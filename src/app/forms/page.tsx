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

  const autoFillForm = (template: FormTemplate, data: ExtractedData[]) => {
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

    // Auto-fill form fields based on template and extracted data
    if (template.fields && typeof template.fields === 'object') {
      Object.entries(template.fields as FormFields).forEach(([section, sectionFields]) => {
        if (sectionFields && typeof sectionFields === 'object') {
          Object.entries(sectionFields as FormSection).forEach(([fieldName, fieldConfig]) => {
            const fullFieldName = `${section}.${fieldName}`
            
            // Try to find matching extracted data
            let value = ''
            
            // Direct field name match
            if (dataMap.has(fieldName)) {
              value = dataMap.get(fieldName) || ''
            }
            
            // Try common variations
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
                  </div>

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