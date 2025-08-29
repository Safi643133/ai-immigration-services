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

// Step 4: Traveling Companions
export const validateStep4 = (formData: FormData): ValidationResult => {
  const errors: string[] = []
  
  // Required fields
  if (!formData['traveling_companions.traveling_with_others']) {
    errors.push('Please specify if there are other persons traveling with you')
  }
  
  // If traveling with others is Yes, validate additional fields
  if (formData['traveling_companions.traveling_with_others'] === 'Yes') {
    if (!formData['traveling_companions.traveling_as_group']) {
      errors.push('Please specify if you are traveling as part of a group or organization')
    }
    
    // If traveling as group, validate group name
    if (formData['traveling_companions.traveling_as_group'] === 'Yes') {
      if (!formData['traveling_companions.group_name']?.trim()) {
        errors.push('Group name is required when traveling as part of a group')
      }
    } else {
      // If not traveling as group, validate individual companion fields
      if (!formData['traveling_companions.companion_surnames']?.trim()) {
        errors.push('Companion surnames is required')
      }
      if (!formData['traveling_companions.companion_given_names']?.trim()) {
        errors.push('Companion given names is required')
      }
      if (!formData['traveling_companions.companion_relationship']) {
        errors.push('Companion relationship is required')
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 5: Previous U.S. Travel History
export const validateStep5 = (formData: FormData): ValidationResult => {
  const errors: string[] = []
  
  // Required fields
  if (!formData['us_history.been_in_us']) {
    errors.push('Please specify if you have ever been in the U.S.')
  }
  
  // If been in US is Yes, validate additional fields
  if (formData['us_history.been_in_us'] === 'Yes') {
    if (!formData['us_history.last_visit_date']) {
      errors.push('Date arrived is required when you have been in the U.S.')
    }
    if (!formData['us_history.last_visit_length_value']) {
      errors.push('Length of stay value is required when you have been in the U.S.')
    }
    if (!formData['us_history.last_visit_length_unit']) {
      errors.push('Length of stay unit is required when you have been in the U.S.')
    }
    
    // U.S. Driver's License question
    if (!formData['us_history.us_driver_license']) {
      errors.push('Please specify if you hold or held a U.S. Driver\'s License')
    }
    
    // If has US driver's license, validate license fields
    if (formData['us_history.us_driver_license'] === 'Yes') {
      const dlUnknown = formData['us_history.driver_license_unknown'] === true || formData['us_history.driver_license_number'] === 'N/A'
      
      if (!dlUnknown && !formData['us_history.driver_license_number']?.trim()) {
        errors.push('Driver\'s license number is required (or mark as unknown)')
      }
      if (!formData['us_history.driver_license_state']) {
        errors.push('State of driver\'s license is required')
      }
    }
  }
  
  // Previous U.S. Visa question
  if (!formData['us_history.us_visa_issued']) {
    errors.push('Please specify if you have ever been issued a U.S. Visa')
  }
  
  // If held US visa, validate visa fields
  if (formData['us_history.us_visa_issued'] === 'Yes') {
    if (!formData['us_history.last_visa_issued_date']) {
      errors.push('Date last visa was issued is required')
    }
    
    const visaNumUnknown = formData['us_history.visa_number_unknown'] === true || formData['us_history.visa_number'] === 'N/A'
    
    if (!visaNumUnknown && !formData['us_history.visa_number']?.trim()) {
      errors.push('Visa number is required (or mark as unknown)')
    }
    
    if (!formData['us_history.same_visa_type']) {
      errors.push('Please specify if you are applying for the same type of visa')
    }
    
    if (!formData['us_history.same_country']) {
      errors.push('Please specify if you are applying in the same country/location')
    }
    
    if (!formData['us_history.ten_printed']) {
      errors.push('Please specify if you have been ten-printed')
    }
    
    // Visa lost/stolen question
    if (!formData['us_history.visa_lost_stolen']) {
      errors.push('Please specify if your U.S. Visa has ever been lost or stolen')
    }
    
    // If visa lost/stolen, validate additional fields
    if (formData['us_history.visa_lost_stolen'] === 'Yes') {
      if (!formData['us_history.visa_lost_year']?.trim()) {
        errors.push('Year lost or stolen is required')
      }
      if (!formData['us_history.visa_lost_explanation']?.trim()) {
        errors.push('Explanation is required when visa was lost or stolen')
      }
    }
    
    // Visa cancelled/revoked question
    if (!formData['us_history.visa_cancelled_revoked']) {
      errors.push('Please specify if your U.S. Visa has ever been cancelled or revoked')
    }
    
    // If visa cancelled/revoked, validate explanation
    if (formData['us_history.visa_cancelled_revoked'] === 'Yes') {
      if (!formData['us_history.visa_cancelled_explanation']?.trim()) {
        errors.push('Explanation is required when visa was cancelled or revoked')
      }
    }
  }
  
  // Visa refusal question
  if (!formData['us_history.visa_refused']) {
    errors.push('Please specify if you have ever been refused a U.S. Visa, refused admission, or withdrawn your application')
  }
  
  // If visa refused, validate explanation
  if (formData['us_history.visa_refused'] === 'Yes') {
    if (!formData['us_history.visa_refused_explanation']?.trim()) {
      errors.push('Explanation is required when visa was refused')
    }
  }
  
  // Immigrant petition question
  if (!formData['us_history.immigrant_petition']) {
    errors.push('Please specify if anyone has ever filed an immigrant petition on your behalf')
  }
  
  // If immigrant petition filed, validate explanation
  if (formData['us_history.immigrant_petition'] === 'Yes') {
    if (!formData['us_history.immigrant_petition_explanation']?.trim()) {
      errors.push('Explanation is required when immigrant petition was filed')
    }
  }
  
  // Permanent resident question
  if (!formData['us_history.permanent_resident']) {
    errors.push('Please specify if you are or have ever been a U.S. legal permanent resident')
  }
  
  // If permanent resident is Yes, validate explanation
  if (formData['us_history.permanent_resident'] === 'Yes') {
    if (!formData['us_history.permanent_resident_explanation']?.trim()) {
      errors.push('Explanation is required when you are or have been a U.S. legal permanent resident')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 6: Address and Phone Details
export const validateStep6 = (formData: FormData): ValidationResult => {
  const errors: string[] = []
  
  // Home Address - Required fields
  if (!formData['contact_info.home_address_line1']?.trim()) {
    errors.push('Home address line 1 is required')
  }
  if (!formData['contact_info.home_city']?.trim()) {
    errors.push('Home city is required')
  }
  if (!formData['contact_info.home_country']) {
    errors.push('Home country is required')
  }
  
  // Home address optional fields with NA handling
  const homeStateNA = formData['contact_info.home_state_na'] === true || formData['contact_info.home_state'] === 'N/A'
  const homePostalNA = formData['contact_info.home_postal_na'] === true || formData['contact_info.home_postal_code'] === 'N/A'
  
  if (!homeStateNA && !formData['contact_info.home_state']?.trim()) {
    errors.push('Home state/province is required (or mark as NA)')
  }
  if (!homePostalNA && !formData['contact_info.home_postal_code']?.trim()) {
    errors.push('Home postal code is required (or mark as NA)')
  }
  
  // Mailing Address
  if (!formData['contact_info.mailing_same_as_home']) {
    errors.push('Please specify if your mailing address is the same as your home address')
  }
  
  // If mailing address is different, validate mailing address fields
  if (formData['contact_info.mailing_same_as_home'] === 'No') {
    if (!formData['contact_info.mailing_address_line1']?.trim()) {
      errors.push('Mailing address line 1 is required')
    }
    if (!formData['contact_info.mailing_city']?.trim()) {
      errors.push('Mailing city is required')
    }
    if (!formData['contact_info.mailing_country']) {
      errors.push('Mailing country is required')
    }
    
    // Mailing address optional fields with NA handling
    const mailingStateNA = formData['contact_info.mailing_state_na'] === true || formData['contact_info.mailing_state'] === 'N/A'
    const mailingPostalNA = formData['contact_info.mailing_postal_na'] === true || formData['contact_info.mailing_postal_code'] === 'N/A'
    
    if (!mailingStateNA && !formData['contact_info.mailing_state']?.trim()) {
      errors.push('Mailing state/province is required (or mark as NA)')
    }
    if (!mailingPostalNA && !formData['contact_info.mailing_postal_code']?.trim()) {
      errors.push('Mailing postal code is required (or mark as NA)')
    }
  }
  
  // Phone - Primary phone is required
  if (!formData['contact_info.primary_phone']?.trim()) {
    errors.push('Primary phone number is required')
  }
  
  // Secondary and work phone are optional with NA handling
  const secondaryPhoneNA = formData['contact_info.secondary_phone_na'] === true || formData['contact_info.secondary_phone'] === 'N/A'
  const workPhoneNA = formData['contact_info.work_phone_na'] === true || formData['contact_info.work_phone'] === 'N/A'
  
  if (!secondaryPhoneNA && !formData['contact_info.secondary_phone']?.trim()) {
    errors.push('Secondary phone number is required (or mark as NA)')
  }
  if (!workPhoneNA && !formData['contact_info.work_phone']?.trim()) {
    errors.push('Work phone number is required (or mark as NA)')
  }
  
  // Other phone numbers question
  if (!formData['contact_info.other_phone_numbers']) {
    errors.push('Please specify if you have used other phone numbers in the last five years')
  }
  
  // If other phone numbers is Yes, validate additional phone
  if (formData['contact_info.other_phone_numbers'] === 'Yes') {
    if (!formData['contact_info.additional_phone']?.trim()) {
      errors.push('Additional phone number is required when you have used other phone numbers')
    }
  }
  
  // Email - Primary email is required
  if (!formData['contact_info.email_address']?.trim()) {
    errors.push('Email address is required')
  }
  
  // Other email addresses question
  if (!formData['contact_info.other_email_addresses']) {
    errors.push('Please specify if you have used other email addresses in the last five years')
  }
  
  // If other email addresses is Yes, validate additional email
  if (formData['contact_info.other_email_addresses'] === 'Yes') {
    if (!formData['contact_info.additional_email']?.trim()) {
      errors.push('Additional email address is required when you have used other email addresses')
    }
  }
  
  // Social Media - Optional but if provided, both platform and identifier should be filled
  if (formData['contact_info.social_media_platform'] && formData['contact_info.social_media_platform'] !== 'NONE') {
    if (!formData['contact_info.social_media_identifier']?.trim()) {
      errors.push('Social media identifier is required when social media platform is selected')
    }
  }
  
  // Other websites question
  if (!formData['contact_info.other_websites']) {
    errors.push('Please specify if you wish to provide information about other websites/apps used in last five years')
  }
  
  // If other websites is Yes, validate additional social media fields
  if (formData['contact_info.other_websites'] === 'Yes') {
    if (!formData['contact_info.additional_social_platform']?.trim()) {
      errors.push('Additional social media platform is required when you wish to provide other websites information')
    }
    if (!formData['contact_info.additional_social_handle']?.trim()) {
      errors.push('Additional social media handle is required when you wish to provide other websites information')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 7: Passport/Travel Document
export const validateStep7 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Passport/Travel Document
  if (!formData['passport_info.passport_type']?.trim()) {
    errors.push('Passport/Travel Document Type is required')
  }
  if (!formData['passport_info.passport_number']?.trim()) {
    errors.push('Passport/Travel Document Number is required')
  }
  
  // Passport Book Number - either filled or marked as N/A
  const bookNumberNA = formData['passport_info.passport_book_number_na'] === true || formData['passport_info.passport_book_number'] === 'N/A'
  if (!bookNumberNA && !formData['passport_info.passport_book_number']?.trim()) {
    errors.push('Passport Book Number is required (or mark as N/A)')
  }

  if (!formData['passport_info.passport_issuing_country']?.trim()) {
    errors.push('Country/Authority that Issued Passport/Travel Document is required')
  }

  // Passport Issuance Location
  if (!formData['passport_info.passport_issued_city']?.trim()) {
    errors.push('City where passport was issued is required')
  }
  if (!formData['passport_info.passport_issued_country']?.trim()) {
    errors.push('Country where passport was issued is required')
  }

  // Passport Dates
  if (!formData['passport_info.passport_issue_date']?.trim()) {
    errors.push('Passport issuance date is required')
  }
  
  // Expiration Date - either filled or marked as N/A
  const expiryNA = formData['passport_info.passport_expiry_na'] === true || formData['passport_info.passport_expiry_date'] === 'N/A'
  if (!expiryNA && !formData['passport_info.passport_expiry_date']?.trim()) {
    errors.push('Passport expiration date is required (or mark as N/A)')
  }

  // Lost/Stolen Passport
  if (!formData['passport_info.passport_lost_stolen']?.trim()) {
    errors.push('Please indicate if you have ever lost a passport or had one stolen')
  }

  // Conditional validation for lost/stolen passport
  if (formData['passport_info.passport_lost_stolen'] === 'Yes') {
    // Lost passport number - either filled or marked as N/A
    const lostNumberNA = formData['passport_info.lost_passport_number_na'] === true || formData['passport_info.lost_passport_number'] === 'N/A'
    if (!lostNumberNA && !formData['passport_info.lost_passport_number']?.trim()) {
      errors.push('Lost passport number is required (or mark as N/A)')
    }
    
    if (!formData['passport_info.lost_passport_country']?.trim()) {
      errors.push('Country that issued the lost passport is required')
    }
    if (!formData['passport_info.lost_passport_explanation']?.trim()) {
      errors.push('Explanation of circumstances is required')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 8: US Contact Information
export const validateStep8 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Contact Person and Organization - either contact person or organization must be provided
  const contactPersonNA = formData['us_contact.contact_person_na'] === true
  const organizationNA = formData['us_contact.contact_organization_na'] === true

  if (!contactPersonNA && !organizationNA) {
    // If neither is marked as "Do Not Know", validate the fields
    if (!formData['us_contact.contact_surnames']?.trim()) {
      errors.push('Contact person surnames is required (or mark "Do Not Know")')
    }
    if (!formData['us_contact.contact_given_names']?.trim()) {
      errors.push('Contact person given names is required (or mark "Do Not Know")')
    }
    if (!formData['us_contact.contact_organization']?.trim()) {
      errors.push('Organization name is required (or mark "Do Not Know")')
    }
  } else if (contactPersonNA && organizationNA) {
    // Both cannot be marked as "Do Not Know"
    errors.push('You cannot mark both contact person and organization as "Do Not Know"')
  }

  // Relationship is always required
  if (!formData['us_contact.contact_relationship']?.trim()) {
    errors.push('Relationship to you is required')
  }

  // Address and Phone - Required fields
  if (!formData['us_contact.contact_address_line1']?.trim()) {
    errors.push('U.S. Street Address (Line 1) is required')
  }
  if (!formData['us_contact.contact_city']?.trim()) {
    errors.push('City is required')
  }
  if (!formData['us_contact.contact_state']?.trim()) {
    errors.push('State is required')
  }
  if (!formData['us_contact.contact_phone']?.trim()) {
    errors.push('Phone number is required')
  }

  // Email - either filled or marked as N/A
  const emailNA = formData['us_contact.contact_email_na'] === true || formData['us_contact.contact_email'] === 'N/A'
  if (!emailNA && !formData['us_contact.contact_email']?.trim()) {
    errors.push('Email address is required (or mark as N/A)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 9: Family Information
export const validateStep9 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Father's Information
  const fatherSurnameNA = formData['family_info.father_surnames_na'] === true || formData['family_info.father_surnames'] === 'N/A'
  const fatherGivenNA = formData['family_info.father_given_names_na'] === true || formData['family_info.father_given_names'] === 'N/A'
  const fatherDobNA = formData['family_info.father_date_of_birth_na'] === true || formData['family_info.father_date_of_birth'] === 'N/A'

  // Father's name fields - either filled or marked as N/A
  if (!fatherSurnameNA && !formData['family_info.father_surnames']?.trim()) {
    errors.push('Father surnames is required (or mark as "Do not know")')
  }
  if (!fatherGivenNA && !formData['family_info.father_given_names']?.trim()) {
    errors.push('Father given names is required (or mark as "Do not know")')
  }
  if (!fatherDobNA && !formData['family_info.father_date_of_birth']?.trim()) {
    errors.push('Father date of birth is required (or mark as "Do not know")')
  }

  // Father in US question
  if (!formData['family_info.father_in_us']?.trim()) {
    errors.push('Please indicate if your father is in the U.S.')
  }

  // If father is in US, status is required
  if (formData['family_info.father_in_us'] === 'Yes' && !formData['family_info.father_status']?.trim()) {
    errors.push('Father status is required when father is in the U.S.')
  }

  // Mother's Information
  const motherSurnameNA = formData['family_info.mother_surnames_na'] === true || formData['family_info.mother_surnames'] === 'N/A'
  const motherGivenNA = formData['family_info.mother_given_names_na'] === true || formData['family_info.mother_given_names'] === 'N/A'
  const motherDobNA = formData['family_info.mother_date_of_birth_na'] === true || formData['family_info.mother_date_of_birth'] === 'N/A'

  // Mother's name fields - either filled or marked as N/A
  if (!motherSurnameNA && !formData['family_info.mother_surnames']?.trim()) {
    errors.push('Mother surnames is required (or mark as "Do not know")')
  }
  if (!motherGivenNA && !formData['family_info.mother_given_names']?.trim()) {
    errors.push('Mother given names is required (or mark as "Do not know")')
  }
  if (!motherDobNA && !formData['family_info.mother_date_of_birth']?.trim()) {
    errors.push('Mother date of birth is required (or mark as "Do not know")')
  }

  // Mother in US question
  if (!formData['family_info.mother_in_us']?.trim()) {
    errors.push('Please indicate if your mother is in the U.S.')
  }

  // If mother is in US, status is required
  if (formData['family_info.mother_in_us'] === 'Yes' && !formData['family_info.mother_status']?.trim()) {
    errors.push('Mother status is required when mother is in the U.S.')
  }

  // Immediate relatives question
  if (!formData['family_info.immediate_relatives_us']?.trim()) {
    errors.push('Please indicate if you have any immediate relatives in the United States')
  }

  // Conditional validation for immediate relatives
  if (formData['family_info.immediate_relatives_us'] === 'Yes') {
    if (!formData['family_info.relative_surnames']?.trim()) {
      errors.push('Relative surnames is required when you have immediate relatives in the U.S.')
    }
    if (!formData['family_info.relative_given_names']?.trim()) {
      errors.push('Relative given names is required when you have immediate relatives in the U.S.')
    }
    if (!formData['family_info.relative_relationship']?.trim()) {
      errors.push('Relative relationship is required when you have immediate relatives in the U.S.')
    }
    if (!formData['family_info.relative_status']?.trim()) {
      errors.push('Relative status is required when you have immediate relatives in the U.S.')
    }
  } else {
    // If no immediate relatives, other relatives question is required
    if (!formData['family_info.other_relatives_us']?.trim()) {
      errors.push('Please indicate if you have any other relatives in the United States')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 10: Current Occupation
export const validateStep10 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Primary occupation is always required
  if (!formData['present_work_education.primary_occupation']?.trim()) {
    errors.push('Primary occupation is required')
  }

  const selectedOccupation = formData['present_work_education.primary_occupation']
  
  // Conditional validation based on occupation
  if (selectedOccupation === 'NOT EMPLOYED') {
    // Only explanation is required for NOT EMPLOYED
    if (!formData['present_work_education.not_employed_explanation']?.trim()) {
      errors.push('Explanation is required when not employed')
    }
  } else if (selectedOccupation === 'OTHER') {
    // Specification is required for OTHER
    if (!formData['present_work_education.other_occupation_specification']?.trim()) {
      errors.push('Please specify your occupation when selecting "OTHER"')
    }
  } else if (selectedOccupation && !['HOMEMAKER', 'RETIRED'].includes(selectedOccupation)) {
    // For all other occupations except HOMEMAKER and RETIRED, validate employer/school fields
    
    // Employer/School name is required
    if (!formData['present_work_education.employer_school_name']?.trim()) {
      errors.push('Present employer or school name is required')
    }

    // Address fields
    if (!formData['present_work_education.employer_address_line1']?.trim()) {
      errors.push('Employer/school address line 1 is required')
    }
    if (!formData['present_work_education.employer_city']?.trim()) {
      errors.push('Employer/school city is required')
    }
    if (!formData['present_work_education.employer_country']?.trim()) {
      errors.push('Employer/school country is required')
    }

    // State and postal code - either filled or marked as N/A
    const stateNA = formData['present_work_education.employer_state_na'] === true || formData['present_work_education.employer_state'] === 'N/A'
    const postalNA = formData['present_work_education.employer_postal_na'] === true || formData['present_work_education.employer_postal_code'] === 'N/A'
    
    if (!stateNA && !formData['present_work_education.employer_state']?.trim()) {
      errors.push('Employer/school state/province is required (or mark as "Does Not Apply")')
    }
    if (!postalNA && !formData['present_work_education.employer_postal_code']?.trim()) {
      errors.push('Employer/school postal code is required (or mark as "Does Not Apply")')
    }

    // Phone number is required
    if (!formData['present_work_education.employer_phone']?.trim()) {
      errors.push('Employer/school phone number is required')
    }

    // Start date is required
    if (!formData['present_work_education.start_date']?.trim()) {
      errors.push('Start date is required')
    }

    // Monthly income - either filled or marked as N/A
    const incomeNA = formData['present_work_education.monthly_income_na'] === true || formData['present_work_education.monthly_income'] === 'N/A'
    if (!incomeNA && !formData['present_work_education.monthly_income']?.trim()) {
      errors.push('Monthly income is required (or mark as "Does Not Apply")')
    }

    // Job duties are required
    if (!formData['present_work_education.job_duties']?.trim()) {
      errors.push('Brief description of duties is required')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 11: Previous Occupation and Education
export const validateStep11 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Previous Employment
  if (!formData['previous_work_education.previously_employed']?.trim()) {
    errors.push('Please indicate if you were previously employed')
  }

  // Conditional validation for previous employment
  if (formData['previous_work_education.previously_employed'] === 'Yes') {
    // Required fields for previous employment
    if (!formData['previous_work_education.previous_employer_name']?.trim()) {
      errors.push('Previous employer name is required')
    }
    if (!formData['previous_work_education.previous_employer_address_line1']?.trim()) {
      errors.push('Previous employer address line 1 is required')
    }
    if (!formData['previous_work_education.previous_employer_city']?.trim()) {
      errors.push('Previous employer city is required')
    }
    if (!formData['previous_work_education.previous_employer_country']?.trim()) {
      errors.push('Previous employer country is required')
    }
    if (!formData['previous_work_education.previous_employer_phone']?.trim()) {
      errors.push('Previous employer phone number is required')
    }
    if (!formData['previous_work_education.previous_job_title']?.trim()) {
      errors.push('Previous job title is required')
    }
    if (!formData['previous_work_education.previous_employment_from']?.trim()) {
      errors.push('Previous employment start date is required')
    }
    if (!formData['previous_work_education.previous_employment_to']?.trim()) {
      errors.push('Previous employment end date is required')
    }
    if (!formData['previous_work_education.previous_job_duties']?.trim()) {
      errors.push('Previous job duties description is required')
    }

    // Optional fields with N/A handling for previous employment
    const prevStateNA = formData['previous_work_education.previous_employer_state_na'] === true || formData['previous_work_education.previous_employer_state'] === 'N/A'
    const prevPostalNA = formData['previous_work_education.previous_employer_postal_na'] === true || formData['previous_work_education.previous_employer_postal_code'] === 'N/A'
    const supSurnameNA = formData['previous_work_education.previous_supervisor_surname_na'] === true || formData['previous_work_education.previous_supervisor_surname'] === 'N/A'
    const supGivenNA = formData['previous_work_education.previous_supervisor_given_names_na'] === true || formData['previous_work_education.previous_supervisor_given_names'] === 'N/A'

    if (!prevStateNA && !formData['previous_work_education.previous_employer_state']?.trim()) {
      errors.push('Previous employer state/province is required (or mark as NA)')
    }
    if (!prevPostalNA && !formData['previous_work_education.previous_employer_postal_code']?.trim()) {
      errors.push('Previous employer postal code is required (or mark as NA)')
    }
    if (!supSurnameNA && !formData['previous_work_education.previous_supervisor_surname']?.trim()) {
      errors.push('Previous supervisor surname is required (or mark as "Do not know")')
    }
    if (!supGivenNA && !formData['previous_work_education.previous_supervisor_given_names']?.trim()) {
      errors.push('Previous supervisor given names is required (or mark as "Do not know")')
    }
  }

  // Education
  if (!formData['previous_work_education.attended_educational_institutions']?.trim()) {
    errors.push('Please indicate if you have attended any educational institutions')
  }

  // Conditional validation for education
  if (formData['previous_work_education.attended_educational_institutions'] === 'Yes') {
    // Required fields for education
    if (!formData['previous_work_education.educational_institution_name']?.trim()) {
      errors.push('Educational institution name is required')
    }
    if (!formData['previous_work_education.educational_address_line1']?.trim()) {
      errors.push('Educational institution address line 1 is required')
    }
    if (!formData['previous_work_education.educational_city']?.trim()) {
      errors.push('Educational institution city is required')
    }
    if (!formData['previous_work_education.educational_country']?.trim()) {
      errors.push('Educational institution country is required')
    }
    if (!formData['previous_work_education.course_of_study']?.trim()) {
      errors.push('Course of study is required')
    }
    if (!formData['previous_work_education.educational_attendance_from']?.trim()) {
      errors.push('Educational attendance start date is required')
    }
    if (!formData['previous_work_education.educational_attendance_to']?.trim()) {
      errors.push('Educational attendance end date is required')
    }

    // Optional fields with N/A handling for education
    const eduStateNA = formData['previous_work_education.educational_state_na'] === true || formData['previous_work_education.educational_state'] === 'N/A'
    const eduPostalNA = formData['previous_work_education.educational_postal_na'] === true || formData['previous_work_education.educational_postal_code'] === 'N/A'

    if (!eduStateNA && !formData['previous_work_education.educational_state']?.trim()) {
      errors.push('Educational institution state/province is required (or mark as NA)')
    }
    if (!eduPostalNA && !formData['previous_work_education.educational_postal_code']?.trim()) {
      errors.push('Educational institution postal code is required (or mark as NA)')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 12: Additional Occupation Details
export const validateStep12 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Clan or Tribe
  if (!formData['additional_occupation.belong_clan_tribe']?.trim()) {
    errors.push('Please indicate if you belong to a clan or tribe')
  }

  // If belongs to clan/tribe, name is required
  if (formData['additional_occupation.belong_clan_tribe'] === 'Yes' && !formData['additional_occupation.clan_tribe_name']?.trim()) {
    errors.push('Clan or tribe name is required when you belong to a clan or tribe')
  }

  // Language Name - always required
  if (!formData['additional_occupation.language_name']?.trim()) {
    errors.push('Language name is required')
  }

  // Travel last five years
  if (!formData['additional_occupation.traveled_last_five_years']?.trim()) {
    errors.push('Please indicate if you have traveled to any countries/regions within the last five years')
  }

  // If traveled, country/region is required
  if (formData['additional_occupation.traveled_last_five_years'] === 'Yes' && !formData['additional_occupation.traveled_country_region']?.trim()) {
    errors.push('Country/region is required when you have traveled within the last five years')
  }

  // Professional/Social/Charitable organization
  if (!formData['additional_occupation.belonged_professional_org']?.trim()) {
    errors.push('Please indicate if you have belonged to, contributed to, or worked for any professional, social, or charitable organization')
  }

  // If belonged to organization, name is required
  if (formData['additional_occupation.belonged_professional_org'] === 'Yes' && !formData['additional_occupation.professional_org_name']?.trim()) {
    errors.push('Organization name is required when you have belonged to, contributed to, or worked for an organization')
  }

  // Specialized skills/training
  if (!formData['additional_occupation.specialized_skills_training']?.trim()) {
    errors.push('Please indicate if you have any specialized skills or training')
  }

  // If has specialized skills, explanation is required
  if (formData['additional_occupation.specialized_skills_training'] === 'Yes' && !formData['additional_occupation.specialized_skills_explain']?.trim()) {
    errors.push('Explanation is required when you have specialized skills or training')
  }

  // Military Service
  if (!formData['additional_occupation.served_military']?.trim()) {
    errors.push('Please indicate if you have ever served in the military')
  }

  // If served in military, additional details are required
  if (formData['additional_occupation.served_military'] === 'Yes') {
    if (!formData['additional_occupation.military_country_region']?.trim()) {
      errors.push('Military country/region is required when you have served in the military')
    }
    if (!formData['additional_occupation.military_branch']?.trim()) {
      errors.push('Military branch of service is required when you have served in the military')
    }
    if (!formData['additional_occupation.military_rank_position']?.trim()) {
      errors.push('Military rank/position is required when you have served in the military')
    }
    if (!formData['additional_occupation.military_specialty']?.trim()) {
      errors.push('Military specialty is required when you have served in the military')
    }
    if (!formData['additional_occupation.military_service_from']?.trim()) {
      errors.push('Military service start date is required when you have served in the military')
    }
    if (!formData['additional_occupation.military_service_to']?.trim()) {
      errors.push('Military service end date is required when you have served in the military')
    }
  }

  // Paramilitary involvement
  if (!formData['additional_occupation.involved_paramilitary']?.trim()) {
    errors.push('Please indicate if you have ever served in, been a member of, or been involved with a paramilitary unit')
  }

  // If involved with paramilitary, explanation is required
  if (formData['additional_occupation.involved_paramilitary'] === 'Yes' && !formData['additional_occupation.involved_paramilitary_explain']?.trim()) {
    errors.push('Explanation is required when you have been involved with a paramilitary unit')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 13: Security Background - Part 1
export const validateStep13 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Communicable disease
  if (!formData['security_background1.communicable_disease']?.trim()) {
    errors.push('Please indicate if you have a communicable disease of public health significance')
  }

  // If has communicable disease, explanation is required
  if (formData['security_background1.communicable_disease'] === 'Yes' && !formData['security_background1.communicable_disease_explain']?.trim()) {
    errors.push('Explanation is required when you have a communicable disease of public health significance')
  }

  // Mental or physical disorder
  if (!formData['security_background1.mental_or_physical_disorder']?.trim()) {
    errors.push('Please indicate if you have a mental or physical disorder that poses a threat to safety or welfare')
  }

  // If has mental or physical disorder, explanation is required
  if (formData['security_background1.mental_or_physical_disorder'] === 'Yes' && !formData['security_background1.mental_or_physical_disorder_explain']?.trim()) {
    errors.push('Explanation is required when you have a mental or physical disorder that poses a threat')
  }

  // Drug abuser or addict
  if (!formData['security_background1.drug_abuser_or_addict']?.trim()) {
    errors.push('Please indicate if you are or have ever been a drug abuser or addict')
  }

  // If is or has been a drug abuser/addict, explanation is required
  if (formData['security_background1.drug_abuser_or_addict'] === 'Yes' && !formData['security_background1.drug_abuser_or_addict_explain']?.trim()) {
    errors.push('Explanation is required when you are or have been a drug abuser or addict')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 14: Security Background - Part 2
export const validateStep14 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Arrested or convicted
  if (!formData['security_background2.arrested_or_convicted']?.trim()) {
    errors.push('Please indicate if you have ever been arrested or convicted for any offense or crime')
  }

  // If arrested or convicted, explanation is required
  if (formData['security_background2.arrested_or_convicted'] === 'Yes' && !formData['security_background2.arrested_or_convicted_explain']?.trim()) {
    errors.push('Explanation is required when you have been arrested or convicted')
  }

  // Controlled substances violation
  if (!formData['security_background2.controlled_substances_violation']?.trim()) {
    errors.push('Please indicate if you have ever violated any law relating to controlled substances')
  }

  // If violated controlled substances law, explanation is required
  if (formData['security_background2.controlled_substances_violation'] === 'Yes' && !formData['security_background2.controlled_substances_violation_explain']?.trim()) {
    errors.push('Explanation is required when you have violated controlled substances laws')
  }

  // Prostitution or vice
  if (!formData['security_background2.prostitution_or_vice']?.trim()) {
    errors.push('Please indicate if you are coming to engage in prostitution or have been engaged in prostitution')
  }

  // If involved in prostitution, explanation is required
  if (formData['security_background2.prostitution_or_vice'] === 'Yes' && !formData['security_background2.prostitution_or_vice_explain']?.trim()) {
    errors.push('Explanation is required when you are involved in prostitution or vice activities')
  }

  // Money laundering
  if (!formData['security_background2.money_laundering']?.trim()) {
    errors.push('Please indicate if you have ever been involved in money laundering')
  }

  // If involved in money laundering, explanation is required
  if (formData['security_background2.money_laundering'] === 'Yes' && !formData['security_background2.money_laundering_explain']?.trim()) {
    errors.push('Explanation is required when you have been involved in money laundering')
  }

  // Human trafficking - committed or conspired
  if (!formData['security_background2.human_trafficking_committed_or_conspired']?.trim()) {
    errors.push('Please indicate if you have ever committed or conspired to commit human trafficking')
  }

  // If committed human trafficking, explanation is required
  if (formData['security_background2.human_trafficking_committed_or_conspired'] === 'Yes' && !formData['security_background2.human_trafficking_committed_or_conspired_explain']?.trim()) {
    errors.push('Explanation is required when you have committed or conspired to commit human trafficking')
  }

  // Human trafficking - aided/abetted
  if (!formData['security_background2.human_trafficking_aided_abetted']?.trim()) {
    errors.push('Please indicate if you have ever aided, abetted, assisted or colluded with human trafficking')
  }

  // If aided human trafficking, explanation is required
  if (formData['security_background2.human_trafficking_aided_abetted'] === 'Yes' && !formData['security_background2.human_trafficking_aided_abetted_explain']?.trim()) {
    errors.push('Explanation is required when you have aided, abetted, assisted or colluded with human trafficking')
  }

  // Human trafficking - family benefited
  if (!formData['security_background2.human_trafficking_family_benefited']?.trim()) {
    errors.push('Please indicate if you are a spouse, son, or daughter who has benefited from human trafficking activities')
  }

  // If family benefited from human trafficking, explanation is required
  if (formData['security_background2.human_trafficking_family_benefited'] === 'Yes' && !formData['security_background2.human_trafficking_family_benefited_explain']?.trim()) {
    errors.push('Explanation is required when you have benefited from human trafficking activities')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 15: Security Background - Part 3
export const validateStep15 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Espionage or illegal activity
  if (!formData['security_background3.espionage_or_illegal_activity']?.trim()) {
    errors.push('Please indicate if you seek to engage in espionage, sabotage, export control violations, or other illegal activity')
  }

  // If seeking espionage/illegal activity, explanation is required
  if (formData['security_background3.espionage_or_illegal_activity'] === 'Yes' && !formData['security_background3.espionage_or_illegal_activity_explain']?.trim()) {
    errors.push('Explanation is required when you seek to engage in espionage or illegal activity')
  }

  // Terrorist activities
  if (!formData['security_background3.terrorist_activities']?.trim()) {
    errors.push('Please indicate if you seek to engage in terrorist activities or have ever engaged in terrorist activities')
  }

  // If involved in terrorist activities, explanation is required
  if (formData['security_background3.terrorist_activities'] === 'Yes' && !formData['security_background3.terrorist_activities_explain']?.trim()) {
    errors.push('Explanation is required when you are involved in terrorist activities')
  }

  // Support to terrorists
  if (!formData['security_background3.support_to_terrorists']?.trim()) {
    errors.push('Please indicate if you have ever or intend to provide financial assistance or other support to terrorists')
  }

  // If supporting terrorists, explanation is required
  if (formData['security_background3.support_to_terrorists'] === 'Yes' && !formData['security_background3.support_to_terrorists_explain']?.trim()) {
    errors.push('Explanation is required when you have provided support to terrorists')
  }

  // Member of terrorist organization
  if (!formData['security_background3.member_of_terrorist_org']?.trim()) {
    errors.push('Please indicate if you are a member or representative of a terrorist organization')
  }

  // If member of terrorist organization, explanation is required
  if (formData['security_background3.member_of_terrorist_org'] === 'Yes' && !formData['security_background3.member_of_terrorist_org_explain']?.trim()) {
    errors.push('Explanation is required when you are a member of a terrorist organization')
  }

  // Family engaged in terrorism
  if (!formData['security_background3.family_engaged_in_terrorism_last_five_years']?.trim()) {
    errors.push('Please indicate if you are the spouse, son, or daughter of someone who has engaged in terrorist activity')
  }

  // If family engaged in terrorism, explanation is required
  if (formData['security_background3.family_engaged_in_terrorism_last_five_years'] === 'Yes' && !formData['security_background3.family_engaged_in_terrorism_last_five_years_explain']?.trim()) {
    errors.push('Explanation is required when your family has engaged in terrorist activity')
  }

  // Genocide involvement
  if (!formData['security_background3.genocide_involvement']?.trim()) {
    errors.push('Please indicate if you have ever ordered, incited, committed, assisted, or participated in genocide')
  }

  // If involved in genocide, explanation is required
  if (formData['security_background3.genocide_involvement'] === 'Yes' && !formData['security_background3.genocide_involvement_explain']?.trim()) {
    errors.push('Explanation is required when you have been involved in genocide')
  }

  // Torture involvement
  if (!formData['security_background3.torture_involvement']?.trim()) {
    errors.push('Please indicate if you have ever committed, ordered, incited, assisted, or participated in torture')
  }

  // If involved in torture, explanation is required
  if (formData['security_background3.torture_involvement'] === 'Yes' && !formData['security_background3.torture_involvement_explain']?.trim()) {
    errors.push('Explanation is required when you have been involved in torture')
  }

  // Violence/killings involvement
  if (!formData['security_background3.violence_killings_involvement']?.trim()) {
    errors.push('Please indicate if you have committed, ordered, incited, assisted, or participated in extrajudicial killings or acts of violence')
  }

  // If involved in violence/killings, explanation is required
  if (formData['security_background3.violence_killings_involvement'] === 'Yes' && !formData['security_background3.violence_killings_involvement_explain']?.trim()) {
    errors.push('Explanation is required when you have been involved in violence or killings')
  }

  // Child soldiers involvement
  if (!formData['security_background3.child_soldiers_involvement']?.trim()) {
    errors.push('Please indicate if you have ever engaged in the recruitment or use of child soldiers')
  }

  // If involved with child soldiers, explanation is required
  if (formData['security_background3.child_soldiers_involvement'] === 'Yes' && !formData['security_background3.child_soldiers_involvement_explain']?.trim()) {
    errors.push('Explanation is required when you have been involved with child soldiers')
  }

  // Religious freedom violations
  if (!formData['security_background3.religious_freedom_violations']?.trim()) {
    errors.push('Please indicate if you have been responsible for severe violations of religious freedom')
  }

  // If involved in religious freedom violations, explanation is required
  if (formData['security_background3.religious_freedom_violations'] === 'Yes' && !formData['security_background3.religious_freedom_violations_explain']?.trim()) {
    errors.push('Explanation is required when you have been involved in religious freedom violations')
  }

  // Population control/forced abortion/sterilization
  if (!formData['security_background3.population_control_forced_abortion_sterilization']?.trim()) {
    errors.push('Please indicate if you have been involved in forced abortion or sterilization policies')
  }

  // If involved in population control, explanation is required
  if (formData['security_background3.population_control_forced_abortion_sterilization'] === 'Yes' && !formData['security_background3.population_control_forced_abortion_sterilization_explain']?.trim()) {
    errors.push('Explanation is required when you have been involved in forced abortion or sterilization')
  }

  // Coercive transplantation
  if (!formData['security_background3.coercive_transplantation']?.trim()) {
    errors.push('Please indicate if you have ever been involved in coercive transplantation of human organs')
  }

  // If involved in coercive transplantation, explanation is required
  if (formData['security_background3.coercive_transplantation'] === 'Yes' && !formData['security_background3.coercive_transplantation_explain']?.trim()) {
    errors.push('Explanation is required when you have been involved in coercive transplantation')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 16: Security Background - Part 4
export const validateStep16 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Subject of removal or deportation hearing
  if (!formData['security_background4.subject_of_removal_or_deportation_hearing']?.trim()) {
    errors.push('Please indicate if you have ever been the subject of a removal or deportation hearing')
  }

  // If subject of removal/deportation hearing, explanation is required
  if (formData['security_background4.subject_of_removal_or_deportation_hearing'] === 'Yes' && !formData['security_background4.subject_of_removal_or_deportation_hearing_explain']?.trim()) {
    errors.push('Explanation is required when you have been the subject of a removal or deportation hearing')
  }

  // Immigration benefit by fraud or misrepresentation
  if (!formData['security_background4.immigration_benefit_by_fraud_or_misrepresentation']?.trim()) {
    errors.push('Please indicate if you have ever sought to obtain immigration benefits by fraud or misrepresentation')
  }

  // If sought immigration benefits by fraud, explanation is required
  if (formData['security_background4.immigration_benefit_by_fraud_or_misrepresentation'] === 'Yes' && !formData['security_background4.immigration_benefit_by_fraud_or_misrepresentation_explain']?.trim()) {
    errors.push('Explanation is required when you have sought immigration benefits by fraud or misrepresentation')
  }

  // Failed to attend hearing last five years
  if (!formData['security_background4.failed_to_attend_hearing_last_five_years']?.trim()) {
    errors.push('Please indicate if you have failed to attend a hearing on removability or inadmissibility within the last five years')
  }

  // If failed to attend hearing, explanation is required
  if (formData['security_background4.failed_to_attend_hearing_last_five_years'] === 'Yes' && !formData['security_background4.failed_to_attend_hearing_last_five_years_explain']?.trim()) {
    errors.push('Explanation is required when you have failed to attend a hearing on removability or inadmissibility')
  }

  // Unlawfully present or visa violation
  if (!formData['security_background4.unlawfully_present_or_visa_violation']?.trim()) {
    errors.push('Please indicate if you have ever been unlawfully present or violated the terms of a U.S. visa')
  }

  // If unlawfully present or visa violation, explanation is required
  if (formData['security_background4.unlawfully_present_or_visa_violation'] === 'Yes' && !formData['security_background4.unlawfully_present_or_visa_violation_explain']?.trim()) {
    errors.push('Explanation is required when you have been unlawfully present or violated visa terms')
  }

  // Removed or deported from any country
  if (!formData['security_background4.removed_or_deported_from_any_country']?.trim()) {
    errors.push('Please indicate if you have ever been removed or deported from any country')
  }

  // If removed or deported, explanation is required
  if (formData['security_background4.removed_or_deported_from_any_country'] === 'Yes' && !formData['security_background4.removed_or_deported_from_any_country_explain']?.trim()) {
    errors.push('Explanation is required when you have been removed or deported from any country')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step 17: Security Background - Part 5 (Final Step)
export const validateStep17 = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Withheld child custody
  if (!formData['security_background5.withheld_child_custody']?.trim()) {
    errors.push('Please indicate if you have ever withheld custody of a U.S. citizen child outside the United States')
  }

  // If withheld child custody, explanation is required
  if (formData['security_background5.withheld_child_custody'] === 'Yes' && !formData['security_background5.withheld_child_custody_explain']?.trim()) {
    errors.push('Explanation is required when you have withheld custody of a U.S. citizen child')
  }

  // Voted in US in violation
  if (!formData['security_background5.voted_in_us_violation']?.trim()) {
    errors.push('Please indicate if you have voted in the United States in violation of any law or regulation')
  }

  // If voted in violation, explanation is required
  if (formData['security_background5.voted_in_us_violation'] === 'Yes' && !formData['security_background5.voted_in_us_violation_explain']?.trim()) {
    errors.push('Explanation is required when you have voted in the United States in violation of law')
  }

  // Renounced citizenship to avoid taxation
  if (!formData['security_background5.renounced_citizenship_to_avoid_tax']?.trim()) {
    errors.push('Please indicate if you have ever renounced United States citizenship for the purposes of avoiding taxation')
  }

  // If renounced citizenship to avoid tax, explanation is required
  if (formData['security_background5.renounced_citizenship_to_avoid_tax'] === 'Yes' && !formData['security_background5.renounced_citizenship_to_avoid_tax_explain']?.trim()) {
    errors.push('Explanation is required when you have renounced citizenship to avoid taxation')
  }

  // Former J visitor not fulfilled 2-year requirement
  if (!formData['security_background5.former_j_visitor_not_fulfilled_2yr']?.trim()) {
    errors.push('Please indicate if you are a former exchange visitor (J) who has not yet fulfilled the two-year foreign residence requirement')
  }

  // If former J visitor not fulfilled requirement, explanation is required
  if (formData['security_background5.former_j_visitor_not_fulfilled_2yr'] === 'Yes' && !formData['security_background5.former_j_visitor_not_fulfilled_2yr_explain']?.trim()) {
    errors.push('Explanation is required when you have not fulfilled the two-year foreign residence requirement')
  }

  // Public school F status without reimbursing
  if (!formData['security_background5.public_school_f_status_without_reimbursing']?.trim()) {
    errors.push('Please indicate if you have attended a public school on student (F) status without reimbursing the school')
  }

  // If attended public school without reimbursing, explanation is required
  if (formData['security_background5.public_school_f_status_without_reimbursing'] === 'Yes' && !formData['security_background5.public_school_f_status_without_reimbursing_explain']?.trim()) {
    errors.push('Explanation is required when you have attended public school without reimbursing')
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
    case 4:
      return validateStep4(formData)
    case 5:
      return validateStep5(formData)
    case 6:
      return validateStep6(formData)
    case 7:
      return validateStep7(formData)
    case 8:
      return validateStep8(formData)
    case 9:
      return validateStep9(formData)
    case 10:
      return validateStep10(formData)
    case 11:
      return validateStep11(formData)
    case 12:
      return validateStep12(formData)
    case 13:
      return validateStep13(formData)
    case 14:
      return validateStep14(formData)
    case 15:
      return validateStep15(formData)
    case 16:
      return validateStep16(formData)
    case 17:
      return validateStep17(formData)
    // All steps implemented
    default:
      return {
        isValid: true,
        errors: []
      }
  }
}
