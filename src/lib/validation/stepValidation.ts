interface FormData {
  [key: string]: any
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Step 1: Personal Information - Part 1
export const validateStep1 = (formData: FormData): ValidationResult => {
  const errors: string[] = []
  
  // Required fields
  if (!formData['personal_info.surnames']?.trim()) {
    errors.push('Surname is required')
  }
  if (!formData['personal_info.given_names']?.trim()) {
    errors.push('Given names are required')
  }
  if (!formData['personal_info.sex']) {
    errors.push('Sex is required')
  }
  if (!formData['personal_info.marital_status']) {
    errors.push('Marital status is required')
  }
  if (!formData['personal_info.date_of_birth']) {
    errors.push('Date of birth is required')
  }
  if (!formData['personal_info.place_of_birth_city']?.trim()) {
    errors.push('City of birth is required')
  }
  if (!formData['personal_info.place_of_birth_country']) {
    errors.push('Country of birth is required')
  }
  
  // Full name in native alphabet - required unless marked as N/A
  const fullNameNative = formData['personal_info.full_name_native_alphabet']
  const fullNameNativeNA = formData['personal_info.full_name_native_na']
  if (!fullNameNativeNA && (!fullNameNative || fullNameNative.trim() === '')) {
    errors.push('Full name in native alphabet is required (or mark as N/A)')
  }
  
  // Other names used - required Yes/No question
  if (!formData['personal_info.other_names_used']) {
    errors.push('Please specify if you have used other names')
  }
  
  // Telecode name - required Yes/No question
  if (!formData['personal_info.telecode_name']) {
    errors.push('Please specify if you have a telecode name')
  }
  
  // Place of birth state - required unless marked as N/A
  const placeOfBirthState = formData['personal_info.place_of_birth_state']
  const placeOfBirthStateNA = formData['personal_info.place_of_birth_state_na']
  if (!placeOfBirthStateNA && (!placeOfBirthState || placeOfBirthState.trim() === '')) {
    errors.push('State/Province of birth is required (or mark as N/A)')
  }
  
  // Conditional fields - if "other names used" is Yes, other names fields are required
  if (formData['personal_info.other_names_used'] === 'Yes') {
    if (!formData['personal_info.other_surnames_used']?.trim()) {
      errors.push('Other surnames used is required when you have used other names')
    }
    if (!formData['personal_info.other_given_names_used']?.trim()) {
      errors.push('Other given names used is required when you have used other names')
    }
  }
  
  // Conditional fields - if "telecode name" is Yes, telecode fields are required
  if (formData['personal_info.telecode_name'] === 'Yes') {
    if (!formData['personal_info.telecode_surnames']?.trim()) {
      errors.push('Telecode surnames is required when you have a telecode name')
    }
    if (!formData['personal_info.telecode_given_names']?.trim()) {
      errors.push('Telecode given names is required when you have a telecode name')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 2: Personal Information - Part 2
export const validateStep2 = (formData: FormData): ValidationResult => {
  const errors: string[] = []
  
  // Required fields
  if (!formData['personal_info.nationality']) {
    errors.push('Country/Region of Origin (Nationality) is required')
  }
  
  // Other nationalities - required Yes/No question
  if (!formData['personal_info.other_nationalities']) {
    errors.push('Please specify if you hold or have held any other nationality')
  }
  
  // Conditional fields - if "other nationalities" is Yes, other nationality details are required
  if (formData['personal_info.other_nationalities'] === 'Yes') {
    const otherNationalitiesList = formData['personal_info.other_nationalities_list']
    if (!Array.isArray(otherNationalitiesList) || otherNationalitiesList.length === 0) {
      errors.push('Please add at least one other nationality')
    } else {
      otherNationalitiesList.forEach((nationality, index) => {
        if (!nationality.country?.trim()) {
          errors.push(`Country is required for other nationality #${index + 1}`)
        }
        if (!nationality.has_passport) {
          errors.push(`Please specify if you have a passport for other nationality #${index + 1}`)
        }
        if (nationality.has_passport === 'Yes' && !nationality.passport_number?.trim()) {
          errors.push(`Passport number is required for other nationality #${index + 1}`)
        }
      })
    }
  }
  
  // Permanent resident of other country - required Yes/No question
  if (!formData['personal_info.permanent_resident_other_country']) {
    errors.push('Please specify if you are a permanent resident of another country')
  }
  
  // Conditional fields - if "permanent resident" is Yes, details are required
  if (formData['personal_info.permanent_resident_other_country'] === 'Yes') {
    if (!formData['personal_info.permanent_resident_country']?.trim()) {
      errors.push('Please specify which country you are a permanent resident of')
    }
  }
  
  // US SSN - required unless marked as N/A (split into 3 fields)
  const usSSN1 = formData['personal_info.us_social_security_number_1']
  const usSSN2 = formData['personal_info.us_social_security_number_2']
  const usSSN3 = formData['personal_info.us_social_security_number_3']
  const usSSNNA = formData['personal_info.us_ssn_na']
  
  if (!usSSNNA) {
    const hasSSN1 = usSSN1 && usSSN1.trim().length === 3
    const hasSSN2 = usSSN2 && usSSN2.trim().length === 2
    const hasSSN3 = usSSN3 && usSSN3.trim().length === 4
    
    if (!hasSSN1 || !hasSSN2 || !hasSSN3) {
      errors.push('US Social Security Number is required (or mark as N/A)')
    }
  }
  
  // US ITIN - required unless marked as N/A
  const usITIN = formData['personal_info.us_taxpayer_id_number']
  const usITINNA = formData['personal_info.us_itin_na']
  if (!usITINNA && (!usITIN || usITIN.trim() === '')) {
    errors.push('US Taxpayer ID Number is required (or mark as N/A)')
  }
  
  // National ID Number - required unless marked as N/A
  const nationalID = formData['personal_info.national_identification_number']
  const nationalIDNA = formData['personal_info.national_identification_number_na']
  if (!nationalIDNA && (!nationalID || nationalID.trim() === '')) {
    errors.push('National Identification Number is required (or mark as N/A)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 3: Purpose of Visa
export const validateStep3 = async (formData: FormData): Promise<ValidationResult> => {
  const errors: string[] = []
  
  // Required fields
  if (!formData['travel_info.purpose_of_trip']) {
    errors.push('Purpose of Trip to the U.S. is required')
  }
  
  // If purpose is selected, specify visa is required
  if (formData['travel_info.purpose_of_trip'] && !formData['travel_info.purpose_specify']) {
    errors.push('Specify Visa is required')
  }
  
  // Validate conditional fields based on specify selection
  const selectedSpecify = formData['travel_info.purpose_specify']
  
  // Validate conditional fields for the selected specify option
  if (selectedSpecify) {
    // Import and validate conditional fields
    const { validateConditionalFields } = await import('../../app/forms/ds160/conditionalFields')
    const conditionalErrors = validateConditionalFields(selectedSpecify, formData)
    errors.push(...conditionalErrors)
  }
  
  // Specific travel plans - required Yes/No question
  if (!formData['travel_info.specific_travel_plans']) {
    errors.push('Please specify if you have made specific travel plans')
  }
  
  // If specific travel plans is Yes, validate travel plan fields
  if (formData['travel_info.specific_travel_plans'] === 'Yes') {
    if (!formData['travel_info.arrival_date']) {
      errors.push('Arrival Date is required when you have specific travel plans')
    }
    if (!formData['travel_info.departure_date']) {
      errors.push('Departure Date is required when you have specific travel plans')
    }
    if (!formData['travel_info.arrival_city']?.trim()) {
      errors.push('Arrival City is required when you have specific travel plans')
    }
    if (!formData['travel_info.departure_city']?.trim()) {
      errors.push('Departure City is required when you have specific travel plans')
    }
    if (!formData['travel_info.location']?.trim()) {
      errors.push('Location is required when you have specific travel plans')
    }
  } else {
    // If no specific plans, arrival date and length of stay are required
    if (!formData['travel_info.arrival_date']) {
      errors.push('Arrival Date is required')
    }
    if (!formData['travel_info.length_of_stay_value']) {
      errors.push('Length of stay value is required')
    }
    if (!formData['travel_info.length_of_stay_unit']) {
      errors.push('Length of stay unit is required')
    }
  }
  
  // US stay address - required
  if (!formData['travel_info.us_stay_address_line1']?.trim()) {
    errors.push('US stay address line 1 is required')
  }
  if (!formData['travel_info.us_stay_city']?.trim()) {
    errors.push('US stay city is required')
  }
  if (!formData['travel_info.us_stay_state']) {
    errors.push('US stay state is required')
  }
  if (!formData['travel_info.us_stay_zip']?.trim()) {
    errors.push('US stay zip code is required')
  }
  
  // Trip payer - required
  if (!formData['travel_info.trip_payer']) {
    errors.push('Person/Entity paying for your trip is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Main validation function that routes to the appropriate step validator
export const validateStep = async (step: number, formData: FormData): Promise<ValidationResult> => {
  switch (step) {
    case 1:
      return validateStep1(formData)
    case 2:
      return validateStep2(formData)
    case 3:
      return await validateStep3(formData)
    // Add more steps as we implement them
    default:
      return {
        isValid: true,
        errors: []
      }
  }
}
