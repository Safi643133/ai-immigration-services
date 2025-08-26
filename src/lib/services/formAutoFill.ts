import type { FormTemplate, ExtractedData } from '@/lib/supabase'

interface FormData {
  [key: string]: any
}

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

// Normalize form data values to match expected formats
const normalizeFormData = (filledData: FormData): FormData => {
  const normalized = { ...filledData }

  // Normalize marital status to uppercase to match form options
  if (normalized['personal_info.marital_status']) {
    const maritalStatus = normalized['personal_info.marital_status']
    if (typeof maritalStatus === 'string') {
      normalized['personal_info.marital_status'] = maritalStatus.toUpperCase()
      console.log(`Normalized marital status: ${maritalStatus} -> ${normalized['personal_info.marital_status']}`)
    }
  }

  // Normalize country fields to match dropdown options
  if (normalized['personal_info.place_of_birth_country']) {
    const country = normalized['personal_info.place_of_birth_country']
    if (typeof country === 'string') {
      normalized['personal_info.place_of_birth_country'] = country.toUpperCase()
      console.log(`Normalized country: ${country} -> ${normalized['personal_info.place_of_birth_country']}`)
    }
  }

  // Normalize nationality to uppercase
  if (normalized['personal_info.nationality']) {
    const nationality = normalized['personal_info.nationality']
    if (typeof nationality === 'string') {
      normalized['personal_info.nationality'] = nationality.toUpperCase()
      console.log(`Normalized nationality: ${nationality} -> ${normalized['personal_info.nationality']}`)
    }
  }

  // Normalize trip payer to match form options
  if (normalized['travel_info.trip_payer']) {
    const tripPayer = normalized['travel_info.trip_payer']
    if (typeof tripPayer === 'string') {
      // Keep as is - should match the form options
      console.log(`Trip payer: ${tripPayer}`)
    }
  }

  // Normalize conditional field values
  if (normalized['travel_info.purpose_of_trip']) {
    const purpose = normalized['travel_info.purpose_of_trip']
    if (typeof purpose === 'string') {
      // Ensure it matches one of the visa class options
      console.log(`Purpose of trip: ${purpose}`)
    }
  }

  if (normalized['travel_info.purpose_specify']) {
    const specify = normalized['travel_info.purpose_specify']
    if (typeof specify === 'string') {
      // Ensure it matches one of the specify options
      console.log(`Purpose specify: ${specify}`)
    }
  }

  // Normalize specific travel plans
  if (normalized['travel_info.specific_travel_plans']) {
    const plans = normalized['travel_info.specific_travel_plans']
    if (typeof plans === 'string') {
      // Convert to proper case for Yes/No options
      const normalizedPlans = plans.toLowerCase() === 'yes' ? 'Yes' : 
                             plans.toLowerCase() === 'no' ? 'No' : plans
      normalized['travel_info.specific_travel_plans'] = normalizedPlans
      console.log(`Specific travel plans: ${plans} -> ${normalizedPlans}`)
    }
  }

  return normalized
}

// Post-fill normalization for special fields
const applySpecialNormalizations = (filledData: FormData, dataMap: Map<string, string>): FormData => {
  const normalized = { ...filledData }

  try {
    const usDriverLicense = dataMap.get('us_driver_license') || dataMap.get('us driver license')
    if (usDriverLicense && !/^(yes|no)$/i.test(usDriverLicense.trim())) {
      normalized['us_history.driver_license_number'] = usDriverLicense
      normalized['us_history.us_driver_license'] = 'Yes'
    }

    const prevUsVisa = dataMap.get('previous_us_visa') || dataMap.get('previous us visa')
    if (prevUsVisa && !/^(yes|no)$/i.test(prevUsVisa.trim())) {
      normalized['us_history.last_visa_number'] = prevUsVisa
      normalized['us_history.previous_us_visa'] = 'Yes'
    }

    const tenPrinted = dataMap.get('ten_printed') || dataMap.get('ten printed')
    if (tenPrinted && tenPrinted.trim().length > 0 && !/^(yes|no)$/i.test(tenPrinted.trim())) {
      normalized['us_history.ten_printed'] = 'Yes'
    }
  } catch (e) {
    console.warn('Special normalization step failed', e)
  }

  return normalized
}

export const autoFillForm = async (
  template: FormTemplate, 
  extractedData: ExtractedData[]
): Promise<FormData> => {
  const filledData: FormData = {}
  
  console.log('Auto-filling form with extracted data:', extractedData)
  console.log('Template fields:', template.fields)
  
  // Create a map of extracted data for easy lookup
  const dataMap = new Map<string, string>()
  extractedData.forEach(item => {
    dataMap.set(item.field_name, item.field_value || '')
  })
  
  console.log('Data map:', Object.fromEntries(dataMap))

  // Load field mappings for this template
  let mappingMap = new Map<string, string>()
  try {
    const res = await fetch(`/api/forms/templates?mappingsFor=${template.id}`)
    if (res.ok) {
      const json = await res.json()
      const mappings: Array<{ extracted_field_name: string; form_field_name: string }> = json.field_mappings || []
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

  // Apply special normalizations
  const withSpecialNormalizations = applySpecialNormalizations(filledData, dataMap)
  
  // Normalize form data values
  const normalized = normalizeFormData(withSpecialNormalizations)

  return normalized
}
