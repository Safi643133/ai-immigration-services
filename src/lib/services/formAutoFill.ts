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

  // Normalize traveling companions fields
  if (normalized['traveling_companions.traveling_with_others']) {
    const traveling = normalized['traveling_companions.traveling_with_others']
    if (typeof traveling === 'string') {
      const normalizedTraveling = traveling.toLowerCase() === 'yes' ? 'Yes' : 
                                 traveling.toLowerCase() === 'no' ? 'No' : traveling
      normalized['traveling_companions.traveling_with_others'] = normalizedTraveling
      console.log(`Traveling with others: ${traveling} -> ${normalizedTraveling}`)
    }
  }

  if (normalized['traveling_companions.traveling_as_group']) {
    const group = normalized['traveling_companions.traveling_as_group']
    if (typeof group === 'string') {
      const normalizedGroup = group.toLowerCase() === 'yes' ? 'Yes' : 
                            group.toLowerCase() === 'no' ? 'No' : group
      normalized['traveling_companions.traveling_as_group'] = normalizedGroup
      console.log(`Traveling as group: ${group} -> ${normalizedGroup}`)
    }
  }

  // Normalize companion names to uppercase
  if (normalized['traveling_companions.companion_surnames']) {
    const surnames = normalized['traveling_companions.companion_surnames']
    if (typeof surnames === 'string') {
      normalized['traveling_companions.companion_surnames'] = surnames.toUpperCase()
      console.log(`Companion surnames: ${surnames} -> ${normalized['traveling_companions.companion_surnames']}`)
    }
  }

  if (normalized['traveling_companions.companion_given_names']) {
    const givenNames = normalized['traveling_companions.companion_given_names']
    if (typeof givenNames === 'string') {
      normalized['traveling_companions.companion_given_names'] = givenNames.toUpperCase()
      console.log(`Companion given names: ${givenNames} -> ${normalized['traveling_companions.companion_given_names']}`)
    }
  }

  // Normalize US history fields
  if (normalized['us_history.been_in_us']) {
    const beenInUS = normalized['us_history.been_in_us']
    if (typeof beenInUS === 'string') {
      const normalizedBeenInUS = beenInUS.toLowerCase() === 'yes' ? 'Yes' : 
                                beenInUS.toLowerCase() === 'no' ? 'No' : beenInUS
      normalized['us_history.been_in_us'] = normalizedBeenInUS
      console.log(`Been in US: ${beenInUS} -> ${normalizedBeenInUS}`)
    }
  }

  if (normalized['us_history.us_driver_license']) {
    const hasDL = normalized['us_history.us_driver_license']
    if (typeof hasDL === 'string') {
      const normalizedHasDL = hasDL.toLowerCase() === 'yes' ? 'Yes' : 
                             hasDL.toLowerCase() === 'no' ? 'No' : hasDL
      normalized['us_history.us_driver_license'] = normalizedHasDL
      console.log(`US Driver License: ${hasDL} -> ${normalizedHasDL}`)
    }
  }

  if (normalized['us_history.us_visa_issued']) {
    const hasVisa = normalized['us_history.us_visa_issued']
    if (typeof hasVisa === 'string') {
      const normalizedHasVisa = hasVisa.toLowerCase() === 'yes' ? 'Yes' : 
                               hasVisa.toLowerCase() === 'no' ? 'No' : hasVisa
      normalized['us_history.us_visa_issued'] = normalizedHasVisa
      console.log(`US Visa Issued: ${hasVisa} -> ${normalizedHasVisa}`)
    }
  }

  if (normalized['us_history.visa_lost_stolen']) {
    const visaLost = normalized['us_history.visa_lost_stolen']
    if (typeof visaLost === 'string') {
      const normalizedVisaLost = visaLost.toLowerCase() === 'yes' ? 'Yes' : 
                                visaLost.toLowerCase() === 'no' ? 'No' : visaLost
      normalized['us_history.visa_lost_stolen'] = normalizedVisaLost
      console.log(`Visa Lost/Stolen: ${visaLost} -> ${normalizedVisaLost}`)
    }
  }

  if (normalized['us_history.visa_cancelled_revoked']) {
    const visaCancelled = normalized['us_history.visa_cancelled_revoked']
    if (typeof visaCancelled === 'string') {
      const normalizedVisaCancelled = visaCancelled.toLowerCase() === 'yes' ? 'Yes' : 
                                     visaCancelled.toLowerCase() === 'no' ? 'No' : visaCancelled
      normalized['us_history.visa_cancelled_revoked'] = normalizedVisaCancelled
      console.log(`Visa Cancelled/Revoked: ${visaCancelled} -> ${normalizedVisaCancelled}`)
    }
  }

  if (normalized['us_history.visa_refused']) {
    const visaRefused = normalized['us_history.visa_refused']
    if (typeof visaRefused === 'string') {
      const normalizedVisaRefused = visaRefused.toLowerCase() === 'yes' ? 'Yes' : 
                                   visaRefused.toLowerCase() === 'no' ? 'No' : visaRefused
      normalized['us_history.visa_refused'] = normalizedVisaRefused
      console.log(`Visa Refused: ${visaRefused} -> ${normalizedVisaRefused}`)
    }
  }

  if (normalized['us_history.immigrant_petition']) {
    const immigrantPetition = normalized['us_history.immigrant_petition']
    if (typeof immigrantPetition === 'string') {
      const normalizedImmigrantPetition = immigrantPetition.toLowerCase() === 'yes' ? 'Yes' : 
                                         immigrantPetition.toLowerCase() === 'no' ? 'No' : immigrantPetition
      normalized['us_history.immigrant_petition'] = normalizedImmigrantPetition
      console.log(`Immigrant Petition: ${immigrantPetition} -> ${normalizedImmigrantPetition}`)
    }
  }

  // Normalize contact info fields
  if (normalized['contact_info.mailing_same_as_home']) {
    const mailingSame = normalized['contact_info.mailing_same_as_home']
    if (typeof mailingSame === 'string') {
      const normalizedMailingSame = mailingSame.toLowerCase() === 'yes' ? 'Yes' : 
                                   mailingSame.toLowerCase() === 'no' ? 'No' : mailingSame
      normalized['contact_info.mailing_same_as_home'] = normalizedMailingSame
      console.log(`Mailing same as home: ${mailingSame} -> ${normalizedMailingSame}`)
    }
  }

  if (normalized['contact_info.other_phone_numbers']) {
    const otherPhones = normalized['contact_info.other_phone_numbers']
    if (typeof otherPhones === 'string') {
      const normalizedOtherPhones = otherPhones.toLowerCase() === 'yes' ? 'Yes' : 
                                   otherPhones.toLowerCase() === 'no' ? 'No' : otherPhones
      normalized['contact_info.other_phone_numbers'] = normalizedOtherPhones
      console.log(`Other phone numbers: ${otherPhones} -> ${normalizedOtherPhones}`)
    }
  }

  if (normalized['contact_info.other_email_addresses']) {
    const otherEmails = normalized['contact_info.other_email_addresses']
    if (typeof otherEmails === 'string') {
      const normalizedOtherEmails = otherEmails.toLowerCase() === 'yes' ? 'Yes' : 
                                   otherEmails.toLowerCase() === 'no' ? 'No' : otherEmails
      normalized['contact_info.other_email_addresses'] = normalizedOtherEmails
      console.log(`Other email addresses: ${otherEmails} -> ${normalizedOtherEmails}`)
    }
  }

  if (normalized['contact_info.other_websites']) {
    const otherWebsites = normalized['contact_info.other_websites']
    if (typeof otherWebsites === 'string') {
      const normalizedOtherWebsites = otherWebsites.toLowerCase() === 'yes' ? 'Yes' : 
                                     otherWebsites.toLowerCase() === 'no' ? 'No' : otherWebsites
      normalized['contact_info.other_websites'] = normalizedOtherWebsites
      console.log(`Other websites: ${otherWebsites} -> ${normalizedOtherWebsites}`)
    }
  }

  // Normalize country names to uppercase
  if (normalized['contact_info.home_country']) {
    const homeCountry = normalized['contact_info.home_country']
    if (typeof homeCountry === 'string') {
      normalized['contact_info.home_country'] = homeCountry.toUpperCase()
      console.log(`Home country: ${homeCountry} -> ${normalized['contact_info.home_country']}`)
    }
  }

  if (normalized['contact_info.mailing_country']) {
    const mailingCountry = normalized['contact_info.mailing_country']
    if (typeof mailingCountry === 'string') {
      normalized['contact_info.mailing_country'] = mailingCountry.toUpperCase()
      console.log(`Mailing country: ${mailingCountry} -> ${normalized['contact_info.mailing_country']}`)
    }
  }

  // Normalize passport info fields
  if (normalized['passport_info.passport_lost_stolen']) {
    const lostStolen = normalized['passport_info.passport_lost_stolen']
    if (typeof lostStolen === 'string') {
      const normalizedLostStolen = lostStolen.toLowerCase() === 'yes' ? 'Yes' : 
                                  lostStolen.toLowerCase() === 'no' ? 'No' : lostStolen
      normalized['passport_info.passport_lost_stolen'] = normalizedLostStolen
      console.log(`Passport lost/stolen: ${lostStolen} -> ${normalizedLostStolen}`)
    }
  }

  // Normalize passport country names to uppercase
  if (normalized['passport_info.passport_issuing_country']) {
    const issuingCountry = normalized['passport_info.passport_issuing_country']
    if (typeof issuingCountry === 'string') {
      normalized['passport_info.passport_issuing_country'] = issuingCountry.toUpperCase()
      console.log(`Passport issuing country: ${issuingCountry} -> ${normalized['passport_info.passport_issuing_country']}`)
    }
  }

  if (normalized['passport_info.passport_issued_country']) {
    const issuedCountry = normalized['passport_info.passport_issued_country']
    if (typeof issuedCountry === 'string') {
      normalized['passport_info.passport_issued_country'] = issuedCountry.toUpperCase()
      console.log(`Passport issued country: ${issuedCountry} -> ${normalized['passport_info.passport_issued_country']}`)
    }
  }

  if (normalized['passport_info.lost_passport_country']) {
    const lostCountry = normalized['passport_info.lost_passport_country']
    if (typeof lostCountry === 'string') {
      normalized['passport_info.lost_passport_country'] = lostCountry.toUpperCase()
      console.log(`Lost passport country: ${lostCountry} -> ${normalized['passport_info.lost_passport_country']}`)
    }
  }

  // Normalize US contact fields
  if (normalized['us_contact.contact_surnames']) {
    const surnames = normalized['us_contact.contact_surnames']
    if (typeof surnames === 'string') {
      normalized['us_contact.contact_surnames'] = surnames.toUpperCase()
      console.log(`Contact surnames: ${surnames} -> ${normalized['us_contact.contact_surnames']}`)
    }
  }

  if (normalized['us_contact.contact_given_names']) {
    const givenNames = normalized['us_contact.contact_given_names']
    if (typeof givenNames === 'string') {
      normalized['us_contact.contact_given_names'] = givenNames.toUpperCase()
      console.log(`Contact given names: ${givenNames} -> ${normalized['us_contact.contact_given_names']}`)
    }
  }

  if (normalized['us_contact.contact_organization']) {
    const organization = normalized['us_contact.contact_organization']
    if (typeof organization === 'string') {
      normalized['us_contact.contact_organization'] = organization.toUpperCase()
      console.log(`Contact organization: ${organization} -> ${normalized['us_contact.contact_organization']}`)
    }
  }

  // Normalize family info fields
  if (normalized['family_info.father_in_us']) {
    const fatherInUS = normalized['family_info.father_in_us']
    if (typeof fatherInUS === 'string') {
      const normalizedFatherInUS = fatherInUS.toLowerCase() === 'yes' ? 'Yes' : 
                                  fatherInUS.toLowerCase() === 'no' ? 'No' : fatherInUS
      normalized['family_info.father_in_us'] = normalizedFatherInUS
      console.log(`Father in US: ${fatherInUS} -> ${normalizedFatherInUS}`)
    }
  }

  if (normalized['family_info.mother_in_us']) {
    const motherInUS = normalized['family_info.mother_in_us']
    if (typeof motherInUS === 'string') {
      const normalizedMotherInUS = motherInUS.toLowerCase() === 'yes' ? 'Yes' : 
                                  motherInUS.toLowerCase() === 'no' ? 'No' : motherInUS
      normalized['family_info.mother_in_us'] = normalizedMotherInUS
      console.log(`Mother in US: ${motherInUS} -> ${normalizedMotherInUS}`)
    }
  }

  if (normalized['family_info.immediate_relatives_us']) {
    const immediateRelatives = normalized['family_info.immediate_relatives_us']
    if (typeof immediateRelatives === 'string') {
      const normalizedImmediateRelatives = immediateRelatives.toLowerCase() === 'yes' ? 'Yes' : 
                                          immediateRelatives.toLowerCase() === 'no' ? 'No' : immediateRelatives
      normalized['family_info.immediate_relatives_us'] = normalizedImmediateRelatives
      console.log(`Immediate relatives in US: ${immediateRelatives} -> ${normalizedImmediateRelatives}`)
    }
  }

  if (normalized['family_info.other_relatives_us']) {
    const otherRelatives = normalized['family_info.other_relatives_us']
    if (typeof otherRelatives === 'string') {
      const normalizedOtherRelatives = otherRelatives.toLowerCase() === 'yes' ? 'Yes' : 
                                      otherRelatives.toLowerCase() === 'no' ? 'No' : otherRelatives
      normalized['family_info.other_relatives_us'] = normalizedOtherRelatives
      console.log(`Other relatives in US: ${otherRelatives} -> ${normalizedOtherRelatives}`)
    }
  }

  // Normalize family names to uppercase
  if (normalized['family_info.father_surnames']) {
    const fatherSurnames = normalized['family_info.father_surnames']
    if (typeof fatherSurnames === 'string') {
      normalized['family_info.father_surnames'] = fatherSurnames.toUpperCase()
      console.log(`Father surnames: ${fatherSurnames} -> ${normalized['family_info.father_surnames']}`)
    }
  }

  if (normalized['family_info.father_given_names']) {
    const fatherGivenNames = normalized['family_info.father_given_names']
    if (typeof fatherGivenNames === 'string') {
      normalized['family_info.father_given_names'] = fatherGivenNames.toUpperCase()
      console.log(`Father given names: ${fatherGivenNames} -> ${normalized['family_info.father_given_names']}`)
    }
  }

  if (normalized['family_info.mother_surnames']) {
    const motherSurnames = normalized['family_info.mother_surnames']
    if (typeof motherSurnames === 'string') {
      normalized['family_info.mother_surnames'] = motherSurnames.toUpperCase()
      console.log(`Mother surnames: ${motherSurnames} -> ${normalized['family_info.mother_surnames']}`)
    }
  }

  if (normalized['family_info.mother_given_names']) {
    const motherGivenNames = normalized['family_info.mother_given_names']
    if (typeof motherGivenNames === 'string') {
      normalized['family_info.mother_given_names'] = motherGivenNames.toUpperCase()
      console.log(`Mother given names: ${motherGivenNames} -> ${normalized['family_info.mother_given_names']}`)
    }
  }

  if (normalized['family_info.relative_surnames']) {
    const relativeSurnames = normalized['family_info.relative_surnames']
    if (typeof relativeSurnames === 'string') {
      normalized['family_info.relative_surnames'] = relativeSurnames.toUpperCase()
      console.log(`Relative surnames: ${relativeSurnames} -> ${normalized['family_info.relative_surnames']}`)
    }
  }

  if (normalized['family_info.relative_given_names']) {
    const relativeGivenNames = normalized['family_info.relative_given_names']
    if (typeof relativeGivenNames === 'string') {
      normalized['family_info.relative_given_names'] = relativeGivenNames.toUpperCase()
      console.log(`Relative given names: ${relativeGivenNames} -> ${normalized['family_info.relative_given_names']}`)
    }
  }

  // Normalize present work/education fields
  if (normalized['present_work_education.employer_school_name']) {
    const employerName = normalized['present_work_education.employer_school_name']
    if (typeof employerName === 'string') {
      normalized['present_work_education.employer_school_name'] = employerName.toUpperCase()
      console.log(`Employer/school name: ${employerName} -> ${normalized['present_work_education.employer_school_name']}`)
    }
  }

  if (normalized['present_work_education.employer_address_line1']) {
    const addressLine1 = normalized['present_work_education.employer_address_line1']
    if (typeof addressLine1 === 'string') {
      normalized['present_work_education.employer_address_line1'] = addressLine1.toUpperCase()
      console.log(`Employer address line 1: ${addressLine1} -> ${normalized['present_work_education.employer_address_line1']}`)
    }
  }

  if (normalized['present_work_education.employer_city']) {
    const city = normalized['present_work_education.employer_city']
    if (typeof city === 'string') {
      normalized['present_work_education.employer_city'] = city.toUpperCase()
      console.log(`Employer city: ${city} -> ${normalized['present_work_education.employer_city']}`)
    }
  }

  if (normalized['present_work_education.employer_country']) {
    const country = normalized['present_work_education.employer_country']
    if (typeof country === 'string') {
      normalized['present_work_education.employer_country'] = country.toUpperCase()
      console.log(`Employer country: ${country} -> ${normalized['present_work_education.employer_country']}`)
    }
  }

  if (normalized['present_work_education.employer_state']) {
    const state = normalized['present_work_education.employer_state']
    if (typeof state === 'string') {
      normalized['present_work_education.employer_state'] = state.toUpperCase()
      console.log(`Employer state: ${state} -> ${normalized['present_work_education.employer_state']}`)
    }
  }

  if (normalized['present_work_education.job_duties']) {
    const jobDuties = normalized['present_work_education.job_duties']
    if (typeof jobDuties === 'string') {
      normalized['present_work_education.job_duties'] = jobDuties.toUpperCase()
      console.log(`Job duties: ${jobDuties} -> ${normalized['present_work_education.job_duties']}`)
    }
  }

  if (normalized['present_work_education.other_occupation_specification']) {
    const otherSpec = normalized['present_work_education.other_occupation_specification']
    if (typeof otherSpec === 'string') {
      normalized['present_work_education.other_occupation_specification'] = otherSpec.toUpperCase()
      console.log(`Other occupation specification: ${otherSpec} -> ${normalized['present_work_education.other_occupation_specification']}`)
    }
  }

  if (normalized['present_work_education.not_employed_explanation']) {
    const notEmployed = normalized['present_work_education.not_employed_explanation']
    if (typeof notEmployed === 'string') {
      normalized['present_work_education.not_employed_explanation'] = notEmployed.toUpperCase()
      console.log(`Not employed explanation: ${notEmployed} -> ${normalized['present_work_education.not_employed_explanation']}`)
    }
  }

  // Normalize previous work/education fields
  if (normalized['previous_work_education.previously_employed']) {
    const previouslyEmployed = normalized['previous_work_education.previously_employed']
    if (typeof previouslyEmployed === 'string') {
      const normalizedPreviouslyEmployed = previouslyEmployed.toLowerCase() === 'yes' ? 'Yes' : 
                                         previouslyEmployed.toLowerCase() === 'no' ? 'No' : previouslyEmployed
      normalized['previous_work_education.previously_employed'] = normalizedPreviouslyEmployed
      console.log(`Previously employed: ${previouslyEmployed} -> ${normalizedPreviouslyEmployed}`)
    }
  }

  if (normalized['previous_work_education.attended_educational_institutions']) {
    const attendedEducation = normalized['previous_work_education.attended_educational_institutions']
    if (typeof attendedEducation === 'string') {
      const normalizedAttendedEducation = attendedEducation.toLowerCase() === 'yes' ? 'Yes' : 
                                        attendedEducation.toLowerCase() === 'no' ? 'No' : attendedEducation
      normalized['previous_work_education.attended_educational_institutions'] = normalizedAttendedEducation
      console.log(`Attended educational institutions: ${attendedEducation} -> ${normalizedAttendedEducation}`)
    }
  }

  // Normalize previous employment text fields to uppercase
  if (normalized['previous_work_education.previous_employer_name']) {
    const employerName = normalized['previous_work_education.previous_employer_name']
    if (typeof employerName === 'string') {
      normalized['previous_work_education.previous_employer_name'] = employerName.toUpperCase()
      console.log(`Previous employer name: ${employerName} -> ${normalized['previous_work_education.previous_employer_name']}`)
    }
  }

  if (normalized['previous_work_education.previous_employer_address_line1']) {
    const addressLine1 = normalized['previous_work_education.previous_employer_address_line1']
    if (typeof addressLine1 === 'string') {
      normalized['previous_work_education.previous_employer_address_line1'] = addressLine1.toUpperCase()
      console.log(`Previous employer address line 1: ${addressLine1} -> ${normalized['previous_work_education.previous_employer_address_line1']}`)
    }
  }

  if (normalized['previous_work_education.previous_employer_city']) {
    const city = normalized['previous_work_education.previous_employer_city']
    if (typeof city === 'string') {
      normalized['previous_work_education.previous_employer_city'] = city.toUpperCase()
      console.log(`Previous employer city: ${city} -> ${normalized['previous_work_education.previous_employer_city']}`)
    }
  }

  if (normalized['previous_work_education.previous_employer_country']) {
    const country = normalized['previous_work_education.previous_employer_country']
    if (typeof country === 'string') {
      normalized['previous_work_education.previous_employer_country'] = country.toUpperCase()
      console.log(`Previous employer country: ${country} -> ${normalized['previous_work_education.previous_employer_country']}`)
    }
  }

  if (normalized['previous_work_education.previous_employer_state']) {
    const state = normalized['previous_work_education.previous_employer_state']
    if (typeof state === 'string') {
      normalized['previous_work_education.previous_employer_state'] = state.toUpperCase()
      console.log(`Previous employer state: ${state} -> ${normalized['previous_work_education.previous_employer_state']}`)
    }
  }

  if (normalized['previous_work_education.previous_job_title']) {
    const jobTitle = normalized['previous_work_education.previous_job_title']
    if (typeof jobTitle === 'string') {
      normalized['previous_work_education.previous_job_title'] = jobTitle.toUpperCase()
      console.log(`Previous job title: ${jobTitle} -> ${normalized['previous_work_education.previous_job_title']}`)
    }
  }

  if (normalized['previous_work_education.previous_supervisor_surname']) {
    const supervisorSurname = normalized['previous_work_education.previous_supervisor_surname']
    if (typeof supervisorSurname === 'string') {
      normalized['previous_work_education.previous_supervisor_surname'] = supervisorSurname.toUpperCase()
      console.log(`Previous supervisor surname: ${supervisorSurname} -> ${normalized['previous_work_education.previous_supervisor_surname']}`)
    }
  }

  if (normalized['previous_work_education.previous_supervisor_given_names']) {
    const supervisorGivenNames = normalized['previous_work_education.previous_supervisor_given_names']
    if (typeof supervisorGivenNames === 'string') {
      normalized['previous_work_education.previous_supervisor_given_names'] = supervisorGivenNames.toUpperCase()
      console.log(`Previous supervisor given names: ${supervisorGivenNames} -> ${normalized['previous_work_education.previous_supervisor_given_names']}`)
    }
  }

  if (normalized['previous_work_education.previous_job_duties']) {
    const jobDuties = normalized['previous_work_education.previous_job_duties']
    if (typeof jobDuties === 'string') {
      normalized['previous_work_education.previous_job_duties'] = jobDuties.toUpperCase()
      console.log(`Previous job duties: ${jobDuties} -> ${normalized['previous_work_education.previous_job_duties']}`)
    }
  }

  // Normalize education text fields to uppercase
  if (normalized['previous_work_education.educational_institution_name']) {
    const institutionName = normalized['previous_work_education.educational_institution_name']
    if (typeof institutionName === 'string') {
      normalized['previous_work_education.educational_institution_name'] = institutionName.toUpperCase()
      console.log(`Educational institution name: ${institutionName} -> ${normalized['previous_work_education.educational_institution_name']}`)
    }
  }

  if (normalized['previous_work_education.educational_address_line1']) {
    const eduAddressLine1 = normalized['previous_work_education.educational_address_line1']
    if (typeof eduAddressLine1 === 'string') {
      normalized['previous_work_education.educational_address_line1'] = eduAddressLine1.toUpperCase()
      console.log(`Educational address line 1: ${eduAddressLine1} -> ${normalized['previous_work_education.educational_address_line1']}`)
    }
  }

  if (normalized['previous_work_education.educational_city']) {
    const eduCity = normalized['previous_work_education.educational_city']
    if (typeof eduCity === 'string') {
      normalized['previous_work_education.educational_city'] = eduCity.toUpperCase()
      console.log(`Educational city: ${eduCity} -> ${normalized['previous_work_education.educational_city']}`)
    }
  }

  if (normalized['previous_work_education.educational_country']) {
    const eduCountry = normalized['previous_work_education.educational_country']
    if (typeof eduCountry === 'string') {
      normalized['previous_work_education.educational_country'] = eduCountry.toUpperCase()
      console.log(`Educational country: ${eduCountry} -> ${normalized['previous_work_education.educational_country']}`)
    }
  }

  if (normalized['previous_work_education.educational_state']) {
    const eduState = normalized['previous_work_education.educational_state']
    if (typeof eduState === 'string') {
      normalized['previous_work_education.educational_state'] = eduState.toUpperCase()
      console.log(`Educational state: ${eduState} -> ${normalized['previous_work_education.educational_state']}`)
    }
  }

  if (normalized['previous_work_education.course_of_study']) {
    const courseOfStudy = normalized['previous_work_education.course_of_study']
    if (typeof courseOfStudy === 'string') {
      normalized['previous_work_education.course_of_study'] = courseOfStudy.toUpperCase()
      console.log(`Course of study: ${courseOfStudy} -> ${normalized['previous_work_education.course_of_study']}`)
    }
  }

  // Normalize additional occupation fields
  if (normalized['additional_occupation.belong_clan_tribe']) {
    const belongClan = normalized['additional_occupation.belong_clan_tribe']
    if (typeof belongClan === 'string') {
      const normalizedBelongClan = belongClan.toLowerCase() === 'yes' ? 'Yes' : 
                                  belongClan.toLowerCase() === 'no' ? 'No' : belongClan
      normalized['additional_occupation.belong_clan_tribe'] = normalizedBelongClan
      console.log(`Belong to clan/tribe: ${belongClan} -> ${normalizedBelongClan}`)
    }
  }

  if (normalized['additional_occupation.traveled_last_five_years']) {
    const traveled = normalized['additional_occupation.traveled_last_five_years']
    if (typeof traveled === 'string') {
      const normalizedTraveled = traveled.toLowerCase() === 'yes' ? 'Yes' : 
                                traveled.toLowerCase() === 'no' ? 'No' : traveled
      normalized['additional_occupation.traveled_last_five_years'] = normalizedTraveled
      console.log(`Traveled last five years: ${traveled} -> ${normalizedTraveled}`)
    }
  }

  if (normalized['additional_occupation.belonged_professional_org']) {
    const belongedOrg = normalized['additional_occupation.belonged_professional_org']
    if (typeof belongedOrg === 'string') {
      const normalizedBelongedOrg = belongedOrg.toLowerCase() === 'yes' ? 'Yes' : 
                                   belongedOrg.toLowerCase() === 'no' ? 'No' : belongedOrg
      normalized['additional_occupation.belonged_professional_org'] = normalizedBelongedOrg
      console.log(`Belonged to professional org: ${belongedOrg} -> ${normalizedBelongedOrg}`)
    }
  }

  if (normalized['additional_occupation.specialized_skills_training']) {
    const specializedSkills = normalized['additional_occupation.specialized_skills_training']
    if (typeof specializedSkills === 'string') {
      const normalizedSpecializedSkills = specializedSkills.toLowerCase() === 'yes' ? 'Yes' : 
                                         specializedSkills.toLowerCase() === 'no' ? 'No' : specializedSkills
      normalized['additional_occupation.specialized_skills_training'] = normalizedSpecializedSkills
      console.log(`Specialized skills training: ${specializedSkills} -> ${normalizedSpecializedSkills}`)
    }
  }

  if (normalized['additional_occupation.served_military']) {
    const servedMilitary = normalized['additional_occupation.served_military']
    if (typeof servedMilitary === 'string') {
      const normalizedServedMilitary = servedMilitary.toLowerCase() === 'yes' ? 'Yes' : 
                                      servedMilitary.toLowerCase() === 'no' ? 'No' : servedMilitary
      normalized['additional_occupation.served_military'] = normalizedServedMilitary
      console.log(`Served military: ${servedMilitary} -> ${normalizedServedMilitary}`)
    }
  }

  if (normalized['additional_occupation.involved_paramilitary']) {
    const involvedParamilitary = normalized['additional_occupation.involved_paramilitary']
    if (typeof involvedParamilitary === 'string') {
      const normalizedInvolvedParamilitary = involvedParamilitary.toLowerCase() === 'yes' ? 'Yes' : 
                                            involvedParamilitary.toLowerCase() === 'no' ? 'No' : involvedParamilitary
      normalized['additional_occupation.involved_paramilitary'] = normalizedInvolvedParamilitary
      console.log(`Involved paramilitary: ${involvedParamilitary} -> ${normalizedInvolvedParamilitary}`)
    }
  }

  // Normalize additional occupation text fields to uppercase
  if (normalized['additional_occupation.clan_tribe_name']) {
    const clanTribeName = normalized['additional_occupation.clan_tribe_name']
    if (typeof clanTribeName === 'string') {
      normalized['additional_occupation.clan_tribe_name'] = clanTribeName.toUpperCase()
      console.log(`Clan/tribe name: ${clanTribeName} -> ${normalized['additional_occupation.clan_tribe_name']}`)
    }
  }

  if (normalized['additional_occupation.language_name']) {
    const languageName = normalized['additional_occupation.language_name']
    if (typeof languageName === 'string') {
      normalized['additional_occupation.language_name'] = languageName.toUpperCase()
      console.log(`Language name: ${languageName} -> ${normalized['additional_occupation.language_name']}`)
    }
  }

  if (normalized['additional_occupation.traveled_country_region']) {
    const traveledCountry = normalized['additional_occupation.traveled_country_region']
    if (typeof traveledCountry === 'string') {
      normalized['additional_occupation.traveled_country_region'] = traveledCountry.toUpperCase()
      console.log(`Traveled country/region: ${traveledCountry} -> ${normalized['additional_occupation.traveled_country_region']}`)
    }
  }

  if (normalized['additional_occupation.professional_org_name']) {
    const orgName = normalized['additional_occupation.professional_org_name']
    if (typeof orgName === 'string') {
      normalized['additional_occupation.professional_org_name'] = orgName.toUpperCase()
      console.log(`Professional org name: ${orgName} -> ${normalized['additional_occupation.professional_org_name']}`)
    }
  }

  if (normalized['additional_occupation.specialized_skills_explain']) {
    const skillsExplain = normalized['additional_occupation.specialized_skills_explain']
    if (typeof skillsExplain === 'string') {
      normalized['additional_occupation.specialized_skills_explain'] = skillsExplain.toUpperCase()
      console.log(`Specialized skills explanation: ${skillsExplain} -> ${normalized['additional_occupation.specialized_skills_explain']}`)
    }
  }

  if (normalized['additional_occupation.military_country_region']) {
    const militaryCountry = normalized['additional_occupation.military_country_region']
    if (typeof militaryCountry === 'string') {
      normalized['additional_occupation.military_country_region'] = militaryCountry.toUpperCase()
      console.log(`Military country/region: ${militaryCountry} -> ${normalized['additional_occupation.military_country_region']}`)
    }
  }

  if (normalized['additional_occupation.military_branch']) {
    const militaryBranch = normalized['additional_occupation.military_branch']
    if (typeof militaryBranch === 'string') {
      normalized['additional_occupation.military_branch'] = militaryBranch.toUpperCase()
      console.log(`Military branch: ${militaryBranch} -> ${normalized['additional_occupation.military_branch']}`)
    }
  }

  if (normalized['additional_occupation.military_rank_position']) {
    const militaryRank = normalized['additional_occupation.military_rank_position']
    if (typeof militaryRank === 'string') {
      normalized['additional_occupation.military_rank_position'] = militaryRank.toUpperCase()
      console.log(`Military rank/position: ${militaryRank} -> ${normalized['additional_occupation.military_rank_position']}`)
    }
  }

  if (normalized['additional_occupation.military_specialty']) {
    const militarySpecialty = normalized['additional_occupation.military_specialty']
    if (typeof militarySpecialty === 'string') {
      normalized['additional_occupation.military_specialty'] = militarySpecialty.toUpperCase()
      console.log(`Military specialty: ${militarySpecialty} -> ${normalized['additional_occupation.military_specialty']}`)
    }
  }

  if (normalized['additional_occupation.involved_paramilitary_explain']) {
    const paramilitaryExplain = normalized['additional_occupation.involved_paramilitary_explain']
    if (typeof paramilitaryExplain === 'string') {
      normalized['additional_occupation.involved_paramilitary_explain'] = paramilitaryExplain.toUpperCase()
      console.log(`Paramilitary explanation: ${paramilitaryExplain} -> ${normalized['additional_occupation.involved_paramilitary_explain']}`)
    }
  }

  // Normalize security background 1 fields
  if (normalized['security_background1.communicable_disease']) {
    const communicableDisease = normalized['security_background1.communicable_disease']
    if (typeof communicableDisease === 'string') {
      const normalizedCommunicableDisease = communicableDisease.toLowerCase() === 'yes' ? 'Yes' : 
                                          communicableDisease.toLowerCase() === 'no' ? 'No' : communicableDisease
      normalized['security_background1.communicable_disease'] = normalizedCommunicableDisease
      console.log(`Communicable disease: ${communicableDisease} -> ${normalizedCommunicableDisease}`)
    }
  }

  if (normalized['security_background1.mental_or_physical_disorder']) {
    const mentalPhysicalDisorder = normalized['security_background1.mental_or_physical_disorder']
    if (typeof mentalPhysicalDisorder === 'string') {
      const normalizedMentalPhysicalDisorder = mentalPhysicalDisorder.toLowerCase() === 'yes' ? 'Yes' : 
                                             mentalPhysicalDisorder.toLowerCase() === 'no' ? 'No' : mentalPhysicalDisorder
      normalized['security_background1.mental_or_physical_disorder'] = normalizedMentalPhysicalDisorder
      console.log(`Mental or physical disorder: ${mentalPhysicalDisorder} -> ${normalizedMentalPhysicalDisorder}`)
    }
  }

  if (normalized['security_background1.drug_abuser_or_addict']) {
    const drugAbuserAddict = normalized['security_background1.drug_abuser_or_addict']
    if (typeof drugAbuserAddict === 'string') {
      const normalizedDrugAbuserAddict = drugAbuserAddict.toLowerCase() === 'yes' ? 'Yes' : 
                                       drugAbuserAddict.toLowerCase() === 'no' ? 'No' : drugAbuserAddict
      normalized['security_background1.drug_abuser_or_addict'] = normalizedDrugAbuserAddict
      console.log(`Drug abuser or addict: ${drugAbuserAddict} -> ${normalizedDrugAbuserAddict}`)
    }
  }

  // Normalize security background 1 explanation fields to uppercase
  if (normalized['security_background1.communicable_disease_explain']) {
    const communicableExplain = normalized['security_background1.communicable_disease_explain']
    if (typeof communicableExplain === 'string') {
      normalized['security_background1.communicable_disease_explain'] = communicableExplain.toUpperCase()
      console.log(`Communicable disease explanation: ${communicableExplain} -> ${normalized['security_background1.communicable_disease_explain']}`)
    }
  }

  if (normalized['security_background1.mental_or_physical_disorder_explain']) {
    const mentalPhysicalExplain = normalized['security_background1.mental_or_physical_disorder_explain']
    if (typeof mentalPhysicalExplain === 'string') {
      normalized['security_background1.mental_or_physical_disorder_explain'] = mentalPhysicalExplain.toUpperCase()
      console.log(`Mental or physical disorder explanation: ${mentalPhysicalExplain} -> ${normalized['security_background1.mental_or_physical_disorder_explain']}`)
    }
  }

  if (normalized['security_background1.drug_abuser_or_addict_explain']) {
    const drugAbuserExplain = normalized['security_background1.drug_abuser_or_addict_explain']
    if (typeof drugAbuserExplain === 'string') {
      normalized['security_background1.drug_abuser_or_addict_explain'] = drugAbuserExplain.toUpperCase()
      console.log(`Drug abuser or addict explanation: ${drugAbuserExplain} -> ${normalized['security_background1.drug_abuser_or_addict_explain']}`)
    }
  }

  // Normalize security background 2 fields
  if (normalized['security_background2.arrested_or_convicted']) {
    const arrestedConvicted = normalized['security_background2.arrested_or_convicted']
    if (typeof arrestedConvicted === 'string') {
      const normalizedArrestedConvicted = arrestedConvicted.toLowerCase() === 'yes' ? 'Yes' : 
                                        arrestedConvicted.toLowerCase() === 'no' ? 'No' : arrestedConvicted
      normalized['security_background2.arrested_or_convicted'] = normalizedArrestedConvicted
      console.log(`Arrested or convicted: ${arrestedConvicted} -> ${normalizedArrestedConvicted}`)
    }
  }

  if (normalized['security_background2.controlled_substances_violation']) {
    const controlledSubstances = normalized['security_background2.controlled_substances_violation']
    if (typeof controlledSubstances === 'string') {
      const normalizedControlledSubstances = controlledSubstances.toLowerCase() === 'yes' ? 'Yes' : 
                                           controlledSubstances.toLowerCase() === 'no' ? 'No' : controlledSubstances
      normalized['security_background2.controlled_substances_violation'] = normalizedControlledSubstances
      console.log(`Controlled substances violation: ${controlledSubstances} -> ${normalizedControlledSubstances}`)
    }
  }

  if (normalized['security_background2.prostitution_or_vice']) {
    const prostitutionVice = normalized['security_background2.prostitution_or_vice']
    if (typeof prostitutionVice === 'string') {
      const normalizedProstitutionVice = prostitutionVice.toLowerCase() === 'yes' ? 'Yes' : 
                                       prostitutionVice.toLowerCase() === 'no' ? 'No' : prostitutionVice
      normalized['security_background2.prostitution_or_vice'] = normalizedProstitutionVice
      console.log(`Prostitution or vice: ${prostitutionVice} -> ${normalizedProstitutionVice}`)
    }
  }

  if (normalized['security_background2.money_laundering']) {
    const moneyLaundering = normalized['security_background2.money_laundering']
    if (typeof moneyLaundering === 'string') {
      const normalizedMoneyLaundering = moneyLaundering.toLowerCase() === 'yes' ? 'Yes' : 
                                      moneyLaundering.toLowerCase() === 'no' ? 'No' : moneyLaundering
      normalized['security_background2.money_laundering'] = normalizedMoneyLaundering
      console.log(`Money laundering: ${moneyLaundering} -> ${normalizedMoneyLaundering}`)
    }
  }

  if (normalized['security_background2.human_trafficking_committed_or_conspired']) {
    const humanTraffickingCommitted = normalized['security_background2.human_trafficking_committed_or_conspired']
    if (typeof humanTraffickingCommitted === 'string') {
      const normalizedHumanTraffickingCommitted = humanTraffickingCommitted.toLowerCase() === 'yes' ? 'Yes' : 
                                                humanTraffickingCommitted.toLowerCase() === 'no' ? 'No' : humanTraffickingCommitted
      normalized['security_background2.human_trafficking_committed_or_conspired'] = normalizedHumanTraffickingCommitted
      console.log(`Human trafficking committed: ${humanTraffickingCommitted} -> ${normalizedHumanTraffickingCommitted}`)
    }
  }

  if (normalized['security_background2.human_trafficking_aided_abetted']) {
    const humanTraffickingAided = normalized['security_background2.human_trafficking_aided_abetted']
    if (typeof humanTraffickingAided === 'string') {
      const normalizedHumanTraffickingAided = humanTraffickingAided.toLowerCase() === 'yes' ? 'Yes' : 
                                            humanTraffickingAided.toLowerCase() === 'no' ? 'No' : humanTraffickingAided
      normalized['security_background2.human_trafficking_aided_abetted'] = normalizedHumanTraffickingAided
      console.log(`Human trafficking aided: ${humanTraffickingAided} -> ${normalizedHumanTraffickingAided}`)
    }
  }

  if (normalized['security_background2.human_trafficking_family_benefited']) {
    const humanTraffickingFamily = normalized['security_background2.human_trafficking_family_benefited']
    if (typeof humanTraffickingFamily === 'string') {
      const normalizedHumanTraffickingFamily = humanTraffickingFamily.toLowerCase() === 'yes' ? 'Yes' : 
                                             humanTraffickingFamily.toLowerCase() === 'no' ? 'No' : humanTraffickingFamily
      normalized['security_background2.human_trafficking_family_benefited'] = normalizedHumanTraffickingFamily
      console.log(`Human trafficking family benefited: ${humanTraffickingFamily} -> ${normalizedHumanTraffickingFamily}`)
    }
  }

  // Normalize security background 2 explanation fields to uppercase
  if (normalized['security_background2.arrested_or_convicted_explain']) {
    const arrestedExplain = normalized['security_background2.arrested_or_convicted_explain']
    if (typeof arrestedExplain === 'string') {
      normalized['security_background2.arrested_or_convicted_explain'] = arrestedExplain.toUpperCase()
      console.log(`Arrested or convicted explanation: ${arrestedExplain} -> ${normalized['security_background2.arrested_or_convicted_explain']}`)
    }
  }

  if (normalized['security_background2.controlled_substances_violation_explain']) {
    const controlledExplain = normalized['security_background2.controlled_substances_violation_explain']
    if (typeof controlledExplain === 'string') {
      normalized['security_background2.controlled_substances_violation_explain'] = controlledExplain.toUpperCase()
      console.log(`Controlled substances explanation: ${controlledExplain} -> ${normalized['security_background2.controlled_substances_violation_explain']}`)
    }
  }

  if (normalized['security_background2.prostitution_or_vice_explain']) {
    const prostitutionExplain = normalized['security_background2.prostitution_or_vice_explain']
    if (typeof prostitutionExplain === 'string') {
      normalized['security_background2.prostitution_or_vice_explain'] = prostitutionExplain.toUpperCase()
      console.log(`Prostitution or vice explanation: ${prostitutionExplain} -> ${normalized['security_background2.prostitution_or_vice_explain']}`)
    }
  }

  if (normalized['security_background2.money_laundering_explain']) {
    const moneyLaunderingExplain = normalized['security_background2.money_laundering_explain']
    if (typeof moneyLaunderingExplain === 'string') {
      normalized['security_background2.money_laundering_explain'] = moneyLaunderingExplain.toUpperCase()
      console.log(`Money laundering explanation: ${moneyLaunderingExplain} -> ${normalized['security_background2.money_laundering_explain']}`)
    }
  }

  if (normalized['security_background2.human_trafficking_committed_or_conspired_explain']) {
    const humanTraffickingCommittedExplain = normalized['security_background2.human_trafficking_committed_or_conspired_explain']
    if (typeof humanTraffickingCommittedExplain === 'string') {
      normalized['security_background2.human_trafficking_committed_or_conspired_explain'] = humanTraffickingCommittedExplain.toUpperCase()
      console.log(`Human trafficking committed explanation: ${humanTraffickingCommittedExplain} -> ${normalized['security_background2.human_trafficking_committed_or_conspired_explain']}`)
    }
  }

  if (normalized['security_background2.human_trafficking_aided_abetted_explain']) {
    const humanTraffickingAidedExplain = normalized['security_background2.human_trafficking_aided_abetted_explain']
    if (typeof humanTraffickingAidedExplain === 'string') {
      normalized['security_background2.human_trafficking_aided_abetted_explain'] = humanTraffickingAidedExplain.toUpperCase()
      console.log(`Human trafficking aided explanation: ${humanTraffickingAidedExplain} -> ${normalized['security_background2.human_trafficking_aided_abetted_explain']}`)
    }
  }

  if (normalized['security_background2.human_trafficking_family_benefited_explain']) {
    const humanTraffickingFamilyExplain = normalized['security_background2.human_trafficking_family_benefited_explain']
    if (typeof humanTraffickingFamilyExplain === 'string') {
      normalized['security_background2.human_trafficking_family_benefited_explain'] = humanTraffickingFamilyExplain.toUpperCase()
      console.log(`Human trafficking family benefited explanation: ${humanTraffickingFamilyExplain} -> ${normalized['security_background2.human_trafficking_family_benefited_explain']}`)
    }
  }

  // Normalize security background 3 fields - Yes/No normalization
  const securityBackground3Fields = [
    'espionage_or_illegal_activity',
    'terrorist_activities',
    'support_to_terrorists',
    'member_of_terrorist_org',
    'family_engaged_in_terrorism_last_five_years',
    'genocide_involvement',
    'torture_involvement',
    'violence_killings_involvement',
    'child_soldiers_involvement',
    'religious_freedom_violations',
    'population_control_forced_abortion_sterilization',
    'coercive_transplantation'
  ]

  securityBackground3Fields.forEach(field => {
    const value = normalized[`security_background3.${field}`]
    if (value && typeof value === 'string') {
      const normalizedValue = value.toLowerCase() === 'yes' ? 'Yes' : 
                            value.toLowerCase() === 'no' ? 'No' : value
      normalized[`security_background3.${field}`] = normalizedValue
      console.log(`Security background 3 ${field}: ${value} -> ${normalizedValue}`)
    }
  })

  // Normalize security background 3 explanation fields to uppercase
  const securityBackground3ExplainFields = [
    'espionage_or_illegal_activity_explain',
    'terrorist_activities_explain',
    'support_to_terrorists_explain',
    'member_of_terrorist_org_explain',
    'family_engaged_in_terrorism_last_five_years_explain',
    'genocide_involvement_explain',
    'torture_involvement_explain',
    'violence_killings_involvement_explain',
    'child_soldiers_involvement_explain',
    'religious_freedom_violations_explain',
    'population_control_forced_abortion_sterilization_explain',
    'coercive_transplantation_explain'
  ]

  securityBackground3ExplainFields.forEach(field => {
    const value = normalized[`security_background3.${field}`]
    if (value && typeof value === 'string') {
      normalized[`security_background3.${field}`] = value.toUpperCase()
      console.log(`Security background 3 ${field}: ${value} -> ${normalized[`security_background3.${field}`]}`)
    }
  })

  // Normalize security background 4 fields - Yes/No normalization
  const securityBackground4Fields = [
    'subject_of_removal_or_deportation_hearing',
    'immigration_benefit_by_fraud_or_misrepresentation',
    'failed_to_attend_hearing_last_five_years',
    'unlawfully_present_or_visa_violation',
    'removed_or_deported_from_any_country'
  ]

  securityBackground4Fields.forEach(field => {
    const value = normalized[`security_background4.${field}`]
    if (value && typeof value === 'string') {
      const normalizedValue = value.toLowerCase() === 'yes' ? 'Yes' : 
                            value.toLowerCase() === 'no' ? 'No' : value
      normalized[`security_background4.${field}`] = normalizedValue
      console.log(`Security background 4 ${field}: ${value} -> ${normalizedValue}`)
    }
  })

  // Normalize security background 4 explanation fields to uppercase
  const securityBackground4ExplainFields = [
    'subject_of_removal_or_deportation_hearing_explain',
    'immigration_benefit_by_fraud_or_misrepresentation_explain',
    'failed_to_attend_hearing_last_five_years_explain',
    'unlawfully_present_or_visa_violation_explain',
    'removed_or_deported_from_any_country_explain'
  ]

  securityBackground4ExplainFields.forEach(field => {
    const value = normalized[`security_background4.${field}`]
    if (value && typeof value === 'string') {
      normalized[`security_background4.${field}`] = value.toUpperCase()
      console.log(`Security background 4 ${field}: ${value} -> ${normalized[`security_background4.${field}`]}`)
    }
  })

  // Normalize security background 5 fields - Yes/No normalization
  const securityBackground5Fields = [
    'withheld_child_custody',
    'voted_in_us_violation',
    'renounced_citizenship_to_avoid_tax',
    'former_j_visitor_not_fulfilled_2yr',
    'public_school_f_status_without_reimbursing'
  ]

  securityBackground5Fields.forEach(field => {
    const value = normalized[`security_background5.${field}`]
    if (value && typeof value === 'string') {
      const normalizedValue = value.toLowerCase() === 'yes' ? 'Yes' : 
                            value.toLowerCase() === 'no' ? 'No' : value
      normalized[`security_background5.${field}`] = normalizedValue
      console.log(`Security background 5 ${field}: ${value} -> ${normalizedValue}`)
    }
  })

  // Normalize security background 5 explanation fields to uppercase
  const securityBackground5ExplainFields = [
    'withheld_child_custody_explain',
    'voted_in_us_violation_explain',
    'renounced_citizenship_to_avoid_tax_explain',
    'former_j_visitor_not_fulfilled_2yr_explain',
    'public_school_f_status_without_reimbursing_explain'
  ]

  securityBackground5ExplainFields.forEach(field => {
    const value = normalized[`security_background5.${field}`]
    if (value && typeof value === 'string') {
      normalized[`security_background5.${field}`] = value.toUpperCase()
      console.log(`Security background 5 ${field}: ${value} -> ${normalized[`security_background5.${field}`]}`)
    }
  })

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
