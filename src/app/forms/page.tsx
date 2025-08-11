'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { FormTemplate, FormSubmission, ExtractedData } from '@/lib/supabase'

interface FormField {
  type: string
  required: boolean
  validation?: string
  options?: string[]
}

interface FormSection {
  [key: string]: FormField
}

interface FormFields {
  [key: string]: FormSection
}

interface FormData {
  [key: string]: any
}

export default function FormsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [formData, setFormData] = useState<FormData>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [ds160Step, setDs160Step] = useState<number>(1)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && !authLoading) {
      loadFormTemplates()
      loadExtractedData()
    }
  }, [user, authLoading, router])

  const loadFormTemplates = async () => {
    try {
      const response = await fetch('/api/forms/templates')
      if (response.ok) {
        const data = await response.json()
        setFormTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error loading form templates:', error)
    }
  }

  const loadExtractedData = async () => {
    try {
      const response = await fetch('/api/documents/extracted-data')
      if (response.ok) {
        const data = await response.json()
        setExtractedData(data.extracted_data)
      }
    } catch (error) {
      console.error('Error loading extracted data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: FormTemplate) => {
    setSelectedTemplate(template)
    autoFillForm(template, extractedData)
  }

  const autoFillForm = async (template: FormTemplate, data: ExtractedData[]) => {
    const filledData: FormData = {}
    
    console.log('Auto-filling form with extracted data:', data)
    console.log('Template fields:', template.fields)
    
    // Create a map of extracted data for easy lookup
    const dataMap = new Map<string, string>()
    data.forEach(item => {
      dataMap.set(item.field_name, item.field_value || '')
    })
    
    console.log('Data map:', Object.fromEntries(dataMap))

    // Helper function to convert date string to YYYY-MM-DD format
    const convertToDateInputFormat = (dateStr: string): string => {
      try {
        // Handle common date formats more reliably
        let date: Date
        
        // Try parsing as "Month DD, YYYY" format first
        if (dateStr.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
          const [month, day, year] = dateStr.split(' ')
          const dayNum = parseInt(day.replace(',', ''))
          const yearNum = parseInt(year)
          const monthIndex = new Date(`${month} 1, 2000`).getMonth()
          date = new Date(yearNum, monthIndex, dayNum)
        } else {
          // Fallback to standard Date parsing
          date = new Date(dateStr)
        }
        
        if (!isNaN(date.getTime())) {
          // Use local date components to avoid timezone issues
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
      } catch (error) {
        console.warn('Failed to parse date:', dateStr)
      }
      return dateStr // Return original if conversion fails
    }

    // Load field mappings for this template
    let mappingMap = new Map<string, string>()
    try {
      const res = await fetch(`/api/forms/templates?mappingsFor=${template.id}`)
      // Fallback: if endpoint doesn't support mappings, build from SQL-like structure on client later
      if (res.ok) {
        const json = await res.json()
        const mappings: Array<{ extracted_field_name: string; form_field_name: string }>= json.field_mappings || []
        mappings.forEach(m => mappingMap.set(m.extracted_field_name, m.form_field_name))
      }
    } catch (e) {
      console.warn('Failed to load field mappings, will use heuristics only')
    }

    // Auto-fill form fields based on template + field_mappings + extracted data
    if (template.fields && typeof template.fields === 'object') {
      Object.entries(template.fields as FormFields).forEach(([section, sectionFields]) => {
        if (sectionFields && typeof sectionFields === 'object') {
          Object.entries(sectionFields as FormSection).forEach(([fieldName, fieldConfig]) => {
            const fullFieldName = `${section}.${fieldName}`
            
            // Try to find matching extracted data
            let value = ''
            
            // 1) Use explicit mapping if available
            const mappedFrom = Array.from(mappingMap.entries()).find(([, formField]) => formField === fullFieldName)?.[0]
            if (mappedFrom && dataMap.has(mappedFrom)) {
              value = dataMap.get(mappedFrom) || ''
            }

            // 2) Direct field name match
            if (dataMap.has(fieldName)) {
              value = dataMap.get(fieldName) || ''
            }
            
            // 3) Try common variations
            const variations = [
              fieldName,
              fieldName.replace(/_/g, ''),
              fieldName.replace(/_/g, ' '),
              fieldName.replace(/([A-Z])/g, ' $1').toLowerCase().trim()
            ]
            
            for (const variation of variations) {
              if (dataMap.has(variation)) {
                value = dataMap.get(variation) || ''
                break
              }
            }

            // Convert value based on field type
            if (value) {
              if (fieldConfig.type === 'date') {
                value = convertToDateInputFormat(value)
              }
              filledData[fullFieldName] = value
              console.log(`Set field ${fullFieldName} = ${value}`)
            } else {
              console.log(`No value found for field ${fullFieldName}`)
            }
          })
        }
      })
    }

    // Post-fill normalization for special US history fields
    try {
      const usDriverLicense = dataMap.get('us_driver_license') || dataMap.get('us driver license')
      if (usDriverLicense && !/^(yes|no)$/i.test(usDriverLicense.trim())) {
        filledData['us_history.driver_license_number'] = usDriverLicense
        filledData['us_history.us_driver_license'] = 'Yes'
      }

      const prevUsVisa = dataMap.get('previous_us_visa') || dataMap.get('previous us visa')
      if (prevUsVisa && !/^(yes|no)$/i.test(prevUsVisa.trim())) {
        filledData['us_history.last_visa_number'] = prevUsVisa
        filledData['us_history.previous_us_visa'] = 'Yes'
      }

      const tenPrinted = dataMap.get('ten_printed') || dataMap.get('ten printed')
      if (tenPrinted && tenPrinted.trim().length > 0 && !/^(yes|no)$/i.test(tenPrinted.trim())) {
        filledData['us_history.ten_printed'] = 'Yes'
      }
    } catch (e) {
      console.warn('Normalization step failed', e)
    }

    setFormData(filledData)
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleSaveForm = async () => {
    if (!selectedTemplate) return

    setProcessing(true)
    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_template_id: selectedTemplate.id,
          form_data: formData,
          extracted_data_summary: extractedData.map(item => ({
            field_name: item.field_name,
            field_value: item.field_value,
            confidence_score: item.confidence_score
          }))
        })
      })

      if (response.ok) {
        alert('Form saved successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save form')
      }
    } catch (error) {
      console.error('Error saving form:', error)
      alert('Failed to save form')
    } finally {
      setProcessing(false)
    }
  }

  const handleExportPDF = async () => {
    if (!selectedTemplate) return

    setProcessing(true)
    try {
      const response = await fetch('/api/forms/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_template_id: selectedTemplate.id,
          form_data: formData,
          extracted_data_summary: extractedData.map(item => ({
            field_name: item.field_name,
            field_value: item.field_value,
            confidence_score: item.confidence_score
          })),
          filename: `${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`
        })
      })

      if (response.ok) {
        // Create blob and download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        alert('PDF exported successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to export PDF')
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF')
    } finally {
      setProcessing(false)
    }
  }

  // DS-160 Step 1: Personal Information - Part 1
  const DS160Step1 = () => {
    const get = (key: string) => formData[key] || ''
    const set = (key: string, val: string) => handleFieldChange(key, val)

    const yesNo = ['Yes', 'No']

    const countries = [
      'United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'China', 'Japan', 'Germany', 'France', 'Brazil', 'Mexico', 'Nigeria', 'Kenya', 'South Africa', 'Italy', 'Spain', 'Russia', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Portugal', 'Ireland', 'New Zealand', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Vietnam', 'Turkey', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Egypt', 'Israel', 'Argentina', 'Chile', 'Colombia', 'Peru'
    ]

    const otherNamesUsed = (get('personal_info.other_names_used') || '').toString().toLowerCase() === 'yes'
    const telecodeName = (get('personal_info.telecode_name') || '').toString().toLowerCase() === 'yes'
    const fullNameNativeNA = get('personal_info.full_name_native_na') === true || get('personal_info.full_name_native_alphabet') === 'N/A'

    const setUpper = (key: string, val: string) => set(key, (val || '').toUpperCase())

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Surname (Write in capital) <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={get('personal_info.surnames')}
              onChange={(e) => setUpper('personal_info.surnames', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Given Names (Write in capital) <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={get('personal_info.given_names')}
              onChange={(e) => setUpper('personal_info.given_names', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name in Native Alphabet</label>
          <div className="flex items-center space-x-3 mt-1">
            <input
              type="text"
              value={fullNameNativeNA ? 'N/A' : get('personal_info.full_name_native_alphabet')}
              onChange={(e) => set('personal_info.full_name_native_alphabet', e.target.value)}
              className="flex-1 rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              disabled={fullNameNativeNA}
              placeholder="Enter native script name"
            />
            <label className="inline-flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                className="mr-2"
                checked={fullNameNativeNA}
                onChange={(e) => {
                  if (e.target.checked) {
                    set('personal_info.full_name_native_na', true as any)
                    set('personal_info.full_name_native_alphabet', 'N/A')
                  } else {
                    set('personal_info.full_name_native_na', false as any)
                    if (get('personal_info.full_name_native_alphabet') === 'N/A') {
                      set('personal_info.full_name_native_alphabet', '')
                    }
                  }
                }}
              />
              NA (Does Not Apply / Technology Not Available)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Have you ever used other names?</label>
            <div className="mt-2 flex items-center space-x-6">
              {yesNo.map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="other_names_used"
                    className="mr-2"
                    checked={get('personal_info.other_names_used') === opt}
                    onChange={() => set('personal_info.other_names_used', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Do you have a telecode that represents your name?</label>
            <div className="mt-2 flex items-center space-x-6">
              {yesNo.map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="telecode_name"
                    className="mr-2"
                    checked={get('personal_info.telecode_name') === opt}
                    onChange={() => set('personal_info.telecode_name', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {otherNamesUsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Other Surnames Used</label>
              <input
                type="text"
                value={get('personal_info.other_surnames_used')}
                onChange={(e) => setUpper('personal_info.other_surnames_used', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Other Given Names Used</label>
              <input
                type="text"
                value={get('personal_info.other_given_names_used')}
                onChange={(e) => setUpper('personal_info.other_given_names_used', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
              />
            </div>
          </div>
        )}

        {telecodeName && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Telecode Surnames</label>
              <input
                type="text"
                value={get('personal_info.telecode_surnames')}
                onChange={(e) => set('personal_info.telecode_surnames', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telecode Given Names</label>
              <input
                type="text"
                value={get('personal_info.telecode_given_names')}
                onChange={(e) => set('personal_info.telecode_given_names', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sex <span className="text-red-500">*</span></label>
            <select
              value={get('personal_info.sex')}
              onChange={(e) => set('personal_info.sex', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={get('personal_info.date_of_birth')}
              onChange={(e) => set('personal_info.date_of_birth', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">City of Birth <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={get('personal_info.place_of_birth_city')}
              onChange={(e) => set('personal_info.place_of_birth_city', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">State/Province of Birth</label>
            <input
              type="text"
              value={get('personal_info.place_of_birth_state')}
              onChange={(e) => set('personal_info.place_of_birth_state', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country/Region of Birth <span className="text-red-500">*</span></label>
            <select
              value={get('personal_info.place_of_birth_country')}
              onChange={(e) => set('personal_info.place_of_birth_country', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select a country</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  // DS-160 Step 2: Personal Information - Part 2
  const DS160Step2 = () => {
    const get = (key: string) => formData[key] || ''
    const set = (key: string, val: string) => handleFieldChange(key, val)
    const yesNo = ['Yes', 'No']
    const countries = [
      'United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'China', 'Japan', 'Germany', 'France', 'Brazil', 'Mexico', 'Nigeria', 'Kenya', 'South Africa', 'Italy', 'Spain', 'Russia', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Portugal', 'Ireland', 'New Zealand', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Vietnam', 'Turkey', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Egypt', 'Israel', 'Argentina', 'Chile', 'Colombia', 'Peru'
    ]

    const otherNationalities = (get('personal_info.other_nationalities') || '').toString().toLowerCase() === 'yes'
    const otherNatPassport = (get('personal_info.other_nationality_passport') || '').toString().toLowerCase() === 'yes'
    const isPROtherCountry = (get('personal_info.permanent_resident_other_country') || '').toString().toLowerCase() === 'yes'

    const prNAChecked = get('personal_info.permanent_resident_country_na') === true || get('personal_info.permanent_resident_country') === 'N/A'
    const ssnNAChecked = get('personal_info.us_ssn_na') === true || get('personal_info.us_social_security_number') === 'N/A'
    const itinNAChecked = get('personal_info.us_itin_na') === true || get('personal_info.us_taxpayer_id_number') === 'N/A'

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Country/Region of Origin (Nationality) <span className="text-red-500">*</span></label>
          <select
            value={get('personal_info.nationality')}
            onChange={(e) => set('personal_info.nationality', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Do you hold or have you held any other nationality?</label>
            <div className="mt-2 flex items-center space-x-6">
              {yesNo.map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="other_nationalities"
                    className="mr-2"
                    checked={get('personal_info.other_nationalities') === opt}
                    onChange={() => set('personal_info.other_nationalities', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {otherNationalities && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Other Country/Region of Origin (Nationality)</label>
              <select
                value={get('personal_info.other_nationality_country')}
                onChange={(e) => set('personal_info.other_nationality_country', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Do you have a passport from this nationality?</label>
              <div className="mt-2 flex items-center space-x-6">
                {yesNo.map((opt) => (
                  <label key={opt} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="other_nationality_passport"
                      className="mr-2"
                      checked={get('personal_info.other_nationality_passport') === opt}
                      onChange={() => set('personal_info.other_nationality_passport', opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {otherNatPassport && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Passport Number</label>
                <input
                  type="text"
                  value={get('personal_info.other_nationality_passport_number')}
                  onChange={(e) => set('personal_info.other_nationality_passport_number', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Are you a permanent resident of a country/region other than your nationality?</label>
            <div className="mt-2 flex items-center space-x-6">
              {yesNo.map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="permanent_resident_other_country"
                    className="mr-2"
                    checked={get('personal_info.permanent_resident_other_country') === opt}
                    onChange={() => {
                      set('personal_info.permanent_resident_other_country', opt)
                      if (opt === 'No') {
                        // If No, allow NA
                        if (prNAChecked) {
                          set('personal_info.permanent_resident_country', 'N/A')
                        } else {
                          set('personal_info.permanent_resident_country', '')
                        }
                      }
                    }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {isPROtherCountry && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Country/Region of Permanent Residence</label>
              <select
                value={get('personal_info.permanent_resident_country')}
                onChange={(e) => set('personal_info.permanent_resident_country', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Always-available PR country with NA override */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Country/Region of Permanent Residence</label>
          <div className="flex items-center space-x-3 mt-1">
            <select
              value={prNAChecked ? 'N/A' : get('personal_info.permanent_resident_country')}
              onChange={(e) => set('personal_info.permanent_resident_country', e.target.value)}
              className="flex-1 rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              disabled={prNAChecked}
            >
              <option value="">Select a country</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="inline-flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                className="mr-2"
                checked={prNAChecked}
                onChange={(e) => {
                  if (e.target.checked) {
                    set('personal_info.permanent_resident_country_na', true as any)
                    set('personal_info.permanent_resident_country', 'N/A')
                  } else {
                    set('personal_info.permanent_resident_country_na', false as any)
                    if (get('personal_info.permanent_resident_country') === 'N/A') {
                      set('personal_info.permanent_resident_country', '')
                    }
                  }
                }}
              />
              NA (Does Not Apply)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">U.S. Social Security Number</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="text"
                value={ssnNAChecked ? 'N/A' : get('personal_info.us_social_security_number')}
                onChange={(e) => set('personal_info.us_social_security_number', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={ssnNAChecked}
                placeholder="XXX-XX-XXXX"
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={ssnNAChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('personal_info.us_ssn_na', true as any)
                      set('personal_info.us_social_security_number', 'N/A')
                    } else {
                      set('personal_info.us_ssn_na', false as any)
                      if (get('personal_info.us_social_security_number') === 'N/A') {
                        set('personal_info.us_social_security_number', '')
                      }
                    }
                  }}
                />
                NA (Does Not Apply)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">U.S. Taxpayer ID Number</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="text"
                value={itinNAChecked ? 'N/A' : get('personal_info.us_taxpayer_id_number')}
                onChange={(e) => set('personal_info.us_taxpayer_id_number', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={itinNAChecked}
                placeholder="ITIN"
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={itinNAChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('personal_info.us_itin_na', true as any)
                      set('personal_info.us_taxpayer_id_number', 'N/A')
                    } else {
                      set('personal_info.us_itin_na', false as any)
                      if (get('personal_info.us_taxpayer_id_number') === 'N/A') {
                        set('personal_info.us_taxpayer_id_number', '')
                      }
                    }
                  }}
                />
                NA (Does Not Apply)
              </label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderField = (fieldName: string, fieldConfig: FormField, value: string = '') => {
    const { type, required, options } = fieldConfig

    switch (type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={type}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={required}
          />
        )
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={required}
          />
        )
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={required}
          >
            <option value="">Select an option</option>
            {options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={required}
          />
        )
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading forms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AI Immigration Agent
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/documents')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                View Documents
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Immigration Forms
            </h2>
            <p className="text-gray-600">
              Select a form template and let AI auto-fill it with your extracted data
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Templates */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Available Forms
                </h3>
                <div className="space-y-3">
                  {formTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {template.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extracted Data Summary */}
              <div className="bg-white shadow rounded-lg p-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Available Data
                </h3>
                <div className="space-y-2">
                  {extractedData.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No extracted data available. Process your documents first.
                    </p>
                  ) : (
                    extractedData.map((data) => (
                      <div key={data.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 capitalize">
                          {data.field_name.replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-500">
                          {data.field_value}
                        </span>
                      </div>
                    ))
                  )}
                  {/* {extractedData.length > 5 && (
                    <p className="text-xs text-gray-500">
                      +{extractedData.length - 5} more fields
                    </p>
                  )} */}
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="lg:col-span-2">
              {selectedTemplate ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedTemplate.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedTemplate.description}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveForm}
                        disabled={processing}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        <span>{processing ? 'Saving...' : 'Save Form'}</span>
                      </button>
                      
                      <button
                        onClick={handleExportPDF}
                        disabled={processing}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span>{processing ? 'Generating...' : 'Export PDF'}</span>
                      </button>
                    </div>
                  </div>

                  {selectedTemplate.form_type === 'ds160' ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold text-gray-900">{`Step ${ds160Step} / 17`}</h4>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => setDs160Step((s) => Math.max(1, s - 1))}
                            className="px-3 py-2 text-sm rounded-md border text-gray-700 hover:bg-gray-50"
                            disabled={ds160Step === 1}
                          >Back</button>
                          <button
                            type="button"
                            onClick={() => setDs160Step((s) => Math.min(17, s + 1))}
                            className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                          >Next</button>
                        </div>
                      </div>
                      {ds160Step === 1 && (
                        <>
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Personal Information - Part 1</h5>
                          <DS160Step1 />
                        </>
                      )}
                      {ds160Step === 2 && (
                        <>
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Personal Information - Part 2</h5>
                          <DS160Step2 />
                        </>
                      )}
                    </div>
                  ) : (
                    <form className="space-y-6">
                      {selectedTemplate.fields && typeof selectedTemplate.fields === 'object' && 
                        Object.entries(selectedTemplate.fields as FormFields).map(([section, sectionFields]) => (
                          <div key={section} className="border-t border-gray-200 pt-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4 capitalize">
                              {section.replace(/_/g, ' ')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {sectionFields && typeof sectionFields === 'object' && 
                                Object.entries(sectionFields as FormSection).map(([fieldName, fieldConfig]) => {
                                  const fullFieldName = `${section}.${fieldName}`
                                  const value = formData[fullFieldName] || ''
                                  
                                  return (
                                    <div key={fieldName}>
                                      <label className="block text-sm font-medium text-gray-700 capitalize">
                                        {fieldName.replace(/_/g, ' ')}
                                        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                                      </label>
                                      {renderField(fullFieldName, fieldConfig, value)}
                                    </div>
                                  )
                                })
                              }
                            </div>
                          </div>
                        ))
                      }
                    </form>
                  )}
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Form Template
                  </h3>
                  <p className="text-gray-500">
                    Choose a form template from the left to start auto-filling with your extracted data
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 