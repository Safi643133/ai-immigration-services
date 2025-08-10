import { DocumentTemplate, FieldDefinition } from './extraction'

// Field definitions for personal information
const personalFields: FieldDefinition[] = [
  {
    name: 'full_name',
    description: 'Complete full name of the person',
    category: 'personal',
    examples: ['John Michael Smith', 'Maria Garcia Rodriguez'],
    validation_rules: ['Should contain at least first and last name', 'No special characters except spaces and hyphens'],
    required: true
  },
  {
    name: 'first_name',
    description: 'First/given name',
    category: 'personal',
    examples: ['John', 'Maria', 'Ahmed'],
    required: true
  },
  {
    name: 'last_name',
    description: 'Last/family name/surname',
    category: 'personal',
    examples: ['Smith', 'Garcia Rodriguez', 'Al-Mansouri'],
    required: true
  },
  {
    name: 'surnames',
    description: 'Surname/family name',
    category: 'personal',
    examples: ['Smith', 'Garcia Rodriguez', 'Al-Mansouri'],
    required: true
  },
  {
    name: 'given_names',
    description: 'Given names (first and middle names)',
    category: 'personal',
    examples: ['John Michael', 'Maria Elena', 'Ahmed Hassan'],
    required: true
  },
  {
    name: 'full_name_native_alphabet',
    description: 'Full name written in native alphabet/script',
    category: 'personal',
    examples: ['محمد أحمد', '张伟', 'Иван Петров'],
    required: false
  },
  {
    name: 'other_names_used',
    description: 'Whether person has used other names (maiden, religious, professional, alias)',
    category: 'personal',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'telecode_name',
    description: 'Whether person has a telecode that represents their name',
    category: 'personal',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'date_of_birth',
    description: 'Date of birth in any format',
    category: 'personal',
    examples: ['15/03/1985', 'March 15, 1985', '1985-03-15'],
    validation_rules: ['Should be a valid date', 'Should be in the past'],
    required: true
  },
  {
    name: 'place_of_birth_city',
    description: 'City of birth',
    category: 'personal',
    examples: ['New York', 'Toronto', 'London', 'Mumbai'],
    required: true
  },
  {
    name: 'place_of_birth_state',
    description: 'State/province of birth',
    category: 'personal',
    examples: ['California', 'Ontario', 'England', 'Maharashtra'],
    required: false
  },
  {
    name: 'place_of_birth_country',
    description: 'Country of birth',
    category: 'personal',
    examples: ['United States', 'Canada', 'United Kingdom', 'India'],
    required: true
  },
  {
    name: 'nationality',
    description: 'Nationality or citizenship',
    category: 'personal',
    examples: ['United States', 'Canadian', 'British', 'Indian'],
    required: true
  },
  {
    name: 'other_nationalities',
    description: 'Whether person holds other nationalities',
    category: 'personal',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'other_nationality_country',
    description: 'Other country of nationality',
    category: 'personal',
    examples: ['United Kingdom', 'France', 'Germany'],
    required: false
  },
  {
    name: 'permanent_resident_other_country',
    description: 'Whether person is permanent resident of another country',
    category: 'personal',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'permanent_resident_country',
    description: 'Country where person is permanent resident',
    category: 'personal',
    examples: ['Canada', 'Australia', 'Germany'],
    required: false
  },
  {
    name: 'national_identification_number',
    description: 'National ID number or equivalent',
    category: 'personal',
    examples: ['123456789', 'A12345678', 'DL123456789'],
    required: false
  },
  {
    name: 'us_social_security_number',
    description: 'US Social Security Number',
    category: 'personal',
    examples: ['123-45-6789', '123456789'],
    required: false
  },
  {
    name: 'us_taxpayer_id_number',
    description: 'US Taxpayer ID Number',
    category: 'personal',
    examples: ['12-3456789', '123456789'],
    required: false
  },
  {
    name: 'gender',
    description: 'Gender information',
    category: 'personal',
    examples: ['Male', 'Female', 'M', 'F'],
    required: false
  },
  {
    name: 'sex',
    description: 'Sex (Male/Female)',
    category: 'personal',
    examples: ['Male', 'Female'],
    required: true
  },
  {
    name: 'marital_status',
    description: 'Marital status',
    category: 'personal',
    examples: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'],
    required: true
  }
]

// Field definitions for identification
const identificationFields: FieldDefinition[] = [
  {
    name: 'passport_number',
    description: 'Passport number or identifier',
    category: 'identification',
    examples: ['A12345678', '123456789', 'P1234567'],
    validation_rules: ['Usually 6-9 alphanumeric characters'],
    required: false
  },
  {
    name: 'visa_number',
    description: 'Visa number or identifier',
    category: 'identification',
    examples: ['V123456789', '1234567890', 'B1/B2-123456'],
    required: false
  },
  {
    name: 'visa_type',
    description: 'Type of visa',
    category: 'identification',
    examples: ['Tourist', 'Student', 'Work', 'B1/B2', 'F-1'],
    required: false
  },
  {
    name: 'document_number',
    description: 'Any other official document number',
    category: 'identification',
    examples: ['DL123456789', 'SSN123-45-6789'],
    required: false
  }
]

// Field definitions for contact information
const contactFields: FieldDefinition[] = [
  {
    name: 'email',
    description: 'Email address',
    category: 'contact',
    examples: ['john.smith@email.com', 'maria.garcia@company.org'],
    validation_rules: ['Should be a valid email format'],
    required: false
  },
  {
    name: 'phone',
    description: 'Phone number in any format',
    category: 'contact',
    examples: ['+1-555-123-4567', '(555) 123-4567', '555-123-4567'],
    required: false
  }
]

// Field definitions for address information
const addressFields: FieldDefinition[] = [
  {
    name: 'address',
    description: 'Complete address',
    category: 'address',
    examples: ['123 Main Street, Apt 4B', '456 Oak Avenue'],
    required: false
  },
  {
    name: 'city',
    description: 'City name',
    category: 'address',
    examples: ['New York', 'Toronto', 'London'],
    required: false
  },
  {
    name: 'state_province',
    description: 'State or province',
    category: 'address',
    examples: ['California', 'Ontario', 'England'],
    required: false
  },
  {
    name: 'country',
    description: 'Country name',
    category: 'address',
    examples: ['United States', 'Canada', 'United Kingdom'],
    required: false
  },
  {
    name: 'postal_code',
    description: 'Postal/ZIP code',
    category: 'address',
    examples: ['10001', 'M5V 3A8', 'SW1A 1AA'],
    required: false
  }
]

// Field definitions for employment
const employmentFields: FieldDefinition[] = [
  {
    name: 'employer_name',
    description: 'Name of employer or company',
    category: 'employment',
    examples: ['Google Inc.', 'Microsoft Corporation', 'Self-employed'],
    required: false
  },
  {
    name: 'job_title',
    description: 'Job title or position',
    category: 'employment',
    examples: ['Software Engineer', 'Manager', 'Consultant'],
    required: false
  },
  {
    name: 'salary',
    description: 'Salary or income information',
    category: 'employment',
    examples: ['$75,000', 'CAD 85,000', '£45,000'],
    required: false
  },
  {
    name: 'employment_start_date',
    description: 'Employment start date',
    category: 'employment',
    examples: ['01/15/2020', 'January 2020'],
    required: false
  }
]

// Field definitions for education
const educationFields: FieldDefinition[] = [
  {
    name: 'institution_name',
    description: 'Name of educational institution',
    category: 'education',
    examples: ['Harvard University', 'University of Toronto', 'MIT'],
    required: false
  },
  {
    name: 'degree',
    description: 'Degree or qualification',
    category: 'education',
    examples: ['Bachelor of Science', 'Master of Arts', 'PhD'],
    required: false
  },
  {
    name: 'field_of_study',
    description: 'Field or major of study',
    category: 'education',
    examples: ['Computer Science', 'Business Administration', 'Engineering'],
    required: false
  },
  {
    name: 'graduation_date',
    description: 'Graduation date',
    category: 'education',
    examples: ['05/15/2018', 'Spring 2018'],
    required: false
  },
  {
    name: 'gpa',
    description: 'Grade Point Average',
    category: 'education',
    examples: ['3.8', '4.0', '3.5/4.0'],
    required: false
  }
]

// Field definitions for financial information
const financialFields: FieldDefinition[] = [
  {
    name: 'bank_name',
    description: 'Name of bank or financial institution',
    category: 'financial',
    examples: ['Chase Bank', 'Bank of America', 'Royal Bank of Canada'],
    required: false
  },
  {
    name: 'account_number',
    description: 'Account number',
    category: 'financial',
    examples: ['1234567890', '****1234'],
    required: false
  },
  {
    name: 'balance',
    description: 'Account balance or financial amount',
    category: 'financial',
    examples: ['$25,000', 'CAD 30,000'],
    required: false
  }
]

// Field definitions for travel information
const travelFields: FieldDefinition[] = [
  {
    name: 'purpose_of_trip',
    description: 'Primary purpose of trip to the US',
    category: 'travel',
    examples: ['Business', 'Tourism', 'Study', 'Work', 'Medical Treatment', 'Transit', 'Other'],
    required: true
  },
  {
    name: 'purpose_specify',
    description: 'Specific details about trip purpose',
    category: 'travel',
    examples: ['Business meeting', 'Vacation', 'Graduate studies', 'Employment'],
    required: false
  },
  {
    name: 'specific_travel_plans',
    description: 'Whether specific travel plans have been made',
    category: 'travel',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'arrival_date',
    description: 'Intended date of arrival in the US',
    category: 'travel',
    examples: ['2024-06-15', 'June 15, 2024'],
    required: true
  },
  {
    name: 'arrival_flight',
    description: 'Flight number for arrival',
    category: 'travel',
    examples: ['AA123', 'DL456', 'UA789'],
    required: false
  },
  {
    name: 'arrival_city',
    description: 'City of arrival in the US',
    category: 'travel',
    examples: ['New York', 'Los Angeles', 'Chicago'],
    required: false
  },
  {
    name: 'departure_date',
    description: 'Intended date of departure from the US',
    category: 'travel',
    examples: ['2024-07-15', 'July 15, 2024'],
    required: true
  },
  {
    name: 'departure_flight',
    description: 'Flight number for departure',
    category: 'travel',
    examples: ['AA124', 'DL457', 'UA790'],
    required: false
  },
  {
    name: 'departure_city',
    description: 'City of departure from the US',
    category: 'travel',
    examples: ['New York', 'Los Angeles', 'Chicago'],
    required: false
  },
  {
    name: 'visit_locations',
    description: 'Places to be visited in the US',
    category: 'travel',
    examples: ['New York, Washington DC, Los Angeles'],
    required: false
  },
  {
    name: 'us_stay_address_line1',
    description: 'Primary address where staying in the US',
    category: 'travel',
    examples: ['123 Main Street', '456 Oak Avenue'],
    required: true
  },
  {
    name: 'us_stay_address_line2',
    description: 'Secondary address line for US stay',
    category: 'travel',
    examples: ['Apt 4B', 'Suite 100'],
    required: false
  },
  {
    name: 'us_stay_city',
    description: 'City where staying in the US',
    category: 'travel',
    examples: ['New York', 'Los Angeles', 'Chicago'],
    required: true
  },
  {
    name: 'us_stay_state',
    description: 'State where staying in the US',
    category: 'travel',
    examples: ['New York', 'California', 'Illinois'],
    required: true
  },
  {
    name: 'us_stay_zip',
    description: 'ZIP code for US stay address',
    category: 'travel',
    examples: ['10001', '90210', '60601'],
    required: false
  },
  {
    name: 'length_of_stay',
    description: 'Intended length of stay in the US',
    category: 'travel',
    examples: ['2 weeks', '3 months', '1 year'],
    required: true
  },
  {
    name: 'trip_payer',
    description: 'Person or entity paying for the trip',
    category: 'travel',
    examples: ['Self', 'Employer', 'Family', 'Sponsor'],
    required: true
  }
]

// Field definitions for family information
const familyFields: FieldDefinition[] = [
  {
    name: 'father_surnames',
    description: 'Father\'s surname/family name',
    category: 'personal',
    examples: ['Smith', 'Garcia', 'Johnson'],
    required: true
  },
  {
    name: 'father_given_names',
    description: 'Father\'s given names',
    category: 'personal',
    examples: ['John Michael', 'Robert James'],
    required: true
  },
  {
    name: 'father_date_of_birth',
    description: 'Father\'s date of birth',
    category: 'personal',
    examples: ['1960-05-15', 'May 15, 1960'],
    required: true
  },
  {
    name: 'father_in_us',
    description: 'Whether father is in the US',
    category: 'personal',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'father_status',
    description: 'Father\'s status in the US',
    category: 'personal',
    examples: ['US Citizen', 'Permanent Resident', 'Student', 'Visitor'],
    required: false
  },
  {
    name: 'mother_surnames',
    description: 'Mother\'s surname/family name',
    category: 'personal',
    examples: ['Smith', 'Garcia', 'Johnson'],
    required: true
  },
  {
    name: 'mother_given_names',
    description: 'Mother\'s given names',
    category: 'personal',
    examples: ['Mary Elizabeth', 'Sarah Jane'],
    required: true
  },
  {
    name: 'mother_date_of_birth',
    description: 'Mother\'s date of birth',
    category: 'personal',
    examples: ['1962-08-20', 'August 20, 1962'],
    required: true
  },
  {
    name: 'mother_in_us',
    description: 'Whether mother is in the US',
    category: 'personal',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'mother_status',
    description: 'Mother\'s status in the US',
    category: 'personal',
    examples: ['US Citizen', 'Permanent Resident', 'Student', 'Visitor'],
    required: false
  },
  {
    name: 'immediate_relatives_us',
    description: 'Whether person has immediate relatives in the US',
    category: 'personal',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'other_relatives_us',
    description: 'Whether person has other relatives in the US',
    category: 'personal',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'relative_surnames',
    description: 'Relative\'s surname',
    category: 'personal',
    examples: ['Smith', 'Garcia', 'Johnson'],
    required: false
  },
  {
    name: 'relative_given_names',
    description: 'Relative\'s given names',
    category: 'personal',
    examples: ['John', 'Maria', 'Ahmed'],
    required: false
  },
  {
    name: 'relative_relationship',
    description: 'Relationship to the relative',
    category: 'personal',
    examples: ['Brother', 'Sister', 'Uncle', 'Aunt', 'Cousin'],
    required: false
  },
  {
    name: 'relative_status',
    description: 'Relative\'s status in the US',
    category: 'personal',
    examples: ['US Citizen', 'Permanent Resident', 'Student', 'Visitor'],
    required: false
  }
]

// Field definitions for spouse information
const spouseFields: FieldDefinition[] = [
  {
    name: 'spouse_surnames',
    description: 'Spouse\'s surname/family name',
    category: 'personal',
    examples: ['Smith', 'Garcia', 'Johnson'],
    required: false
  },
  {
    name: 'spouse_given_names',
    description: 'Spouse\'s given names',
    category: 'personal',
    examples: ['Jane Elizabeth', 'Maria Elena'],
    required: false
  },
  {
    name: 'spouse_date_of_birth',
    description: 'Spouse\'s date of birth',
    category: 'personal',
    examples: ['1985-03-15', 'March 15, 1985'],
    required: false
  },
  {
    name: 'spouse_nationality',
    description: 'Spouse\'s nationality',
    category: 'personal',
    examples: ['United States', 'Canadian', 'British', 'Indian'],
    required: false
  },
  {
    name: 'spouse_place_of_birth_city',
    description: 'Spouse\'s city of birth',
    category: 'personal',
    examples: ['New York', 'Toronto', 'London'],
    required: false
  },
  {
    name: 'spouse_place_of_birth_country',
    description: 'Spouse\'s country of birth',
    category: 'personal',
    examples: ['United States', 'Canada', 'United Kingdom'],
    required: false
  },
  {
    name: 'spouse_address',
    description: 'Spouse\'s address',
    category: 'address',
    examples: ['123 Main Street, New York, NY'],
    required: false
  }
]

// Field definitions for US history
const usHistoryFields: FieldDefinition[] = [
  {
    name: 'been_in_us',
    description: 'Whether person has been in the US before',
    category: 'travel',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'last_visit_date',
    description: 'Date of last US visit',
    category: 'travel',
    examples: ['2023-06-15', 'June 2023'],
    required: false
  },
  {
    name: 'last_visit_length',
    description: 'Length of last US visit',
    category: 'travel',
    examples: ['2 weeks', '3 months', '1 year'],
    required: false
  },
  {
    name: 'us_driver_license',
    description: 'Whether person has US driver\'s license',
    category: 'identification',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'driver_license_number',
    description: 'US driver\'s license number',
    category: 'identification',
    examples: ['DL123456789', '123456789'],
    required: false
  },
  {
    name: 'driver_license_state',
    description: 'State that issued driver\'s license',
    category: 'identification',
    examples: ['New York', 'California', 'Texas'],
    required: false
  },
  {
    name: 'previous_us_visa',
    description: 'Whether person has had previous US visa',
    category: 'identification',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'last_visa_issued_date',
    description: 'Date last US visa was issued',
    category: 'identification',
    examples: ['2020-03-15', 'March 2020'],
    required: false
  },
  {
    name: 'last_visa_number',
    description: 'Number of last US visa',
    category: 'identification',
    examples: ['B1/B2-123456', 'F-1-123456'],
    required: false
  },
  {
    name: 'same_visa_type',
    description: 'Whether applying for same type of visa',
    category: 'identification',
    examples: ['Yes', 'No'],
    required: false
  },
  {
    name: 'same_country_application',
    description: 'Whether applying in same country as last visa',
    category: 'identification',
    examples: ['Yes', 'No'],
    required: false
  },
  {
    name: 'ten_printed',
    description: 'Whether person has been ten-printed',
    category: 'identification',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'visa_lost_stolen',
    description: 'Whether US visa was ever lost or stolen',
    category: 'identification',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'visa_lost_year',
    description: 'Year visa was lost or stolen',
    category: 'identification',
    examples: ['2020', '2021', '2022'],
    required: false
  },
  {
    name: 'visa_lost_explanation',
    description: 'Explanation of lost/stolen visa',
    category: 'identification',
    examples: ['Lost during travel', 'Stolen from wallet'],
    required: false
  },
  {
    name: 'visa_cancelled',
    description: 'Whether US visa was ever cancelled or revoked',
    category: 'identification',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'visa_cancelled_explanation',
    description: 'Explanation of cancelled/revoked visa',
    category: 'identification',
    examples: ['Administrative processing', 'Visa violation'],
    required: false
  },
  {
    name: 'visa_refused',
    description: 'Whether US visa was ever refused',
    category: 'identification',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'visa_refused_explanation',
    description: 'Explanation of visa refusal',
    category: 'identification',
    examples: ['Insufficient ties to home country', 'Incomplete documentation'],
    required: false
  },
  {
    name: 'immigrant_petition',
    description: 'Whether immigrant petition was filed on behalf',
    category: 'identification',
    examples: ['Yes', 'No'],
    required: true
  },
  {
    name: 'immigrant_petition_explanation',
    description: 'Explanation of immigrant petition',
    category: 'identification',
    examples: ['Family-based petition', 'Employment-based petition'],
    required: false
  }
]

// Document templates
export const documentTemplates: Record<string, DocumentTemplate> = {
  passport: {
    name: 'Passport',
    category: 'passport',
    description: 'International passport document',
    fields: [
      ...personalFields,
      ...identificationFields.filter(f => f.name === 'passport_number'),
      ...addressFields,
      ...travelFields.filter(f => ['purpose_of_trip', 'arrival_date', 'departure_date'].includes(f.name))
    ],
    examples: [
      'Look for sections labeled "Surname", "Given Names", "Date of Birth", "Nationality"',
      'Passport number is usually prominently displayed',
      'May include place of birth and date of issue',
      'Check for visa stamps or travel history'
    ]
  },
  
  visa: {
    name: 'Visa',
    category: 'visa',
    description: 'Visa document or stamp',
    fields: [
      ...personalFields,
      ...identificationFields.filter(f => ['visa_number', 'visa_type'].includes(f.name)),
      ...addressFields,
      ...usHistoryFields.filter(f => ['previous_us_visa', 'last_visa_number', 'last_visa_issued_date'].includes(f.name)),
      ...travelFields.filter(f => ['purpose_of_trip', 'arrival_date', 'departure_date'].includes(f.name))
    ],
    examples: [
      'Look for visa number, type, and validity dates',
      'May include sponsor information',
      'Check for entry/exit stamps',
      'Look for previous visa information',
      'Check for travel dates and purpose'
    ]
  },
  
  education: {
    name: 'Education Document',
    category: 'education',
    description: 'Academic transcripts, diplomas, certificates',
    fields: [
      ...personalFields,
      ...educationFields,
      ...familyFields.filter(f => ['father_given_names', 'mother_given_names'].includes(f.name))
    ],
    examples: [
      'Look for institution name, degree, graduation date',
      'May include GPA, honors, or academic achievements',
      'Check for accreditation information',
      'Look for parent information if included'
    ]
  },
  
  employment: {
    name: 'Employment Document',
    category: 'employment',
    description: 'Employment letters, contracts, pay stubs',
    fields: [
      ...personalFields,
      ...employmentFields,
      ...contactFields,
      ...travelFields.filter(f => ['purpose_of_trip', 'trip_payer'].includes(f.name))
    ],
    examples: [
      'Look for employer name, job title, salary',
      'May include employment dates and responsibilities',
      'Check for company letterhead and contact information',
      'Look for business travel information',
      'Check for employer sponsorship details'
    ]
  },
  
  financial: {
    name: 'Financial Document',
    category: 'financial',
    description: 'Bank statements, financial records, sponsorship letters',
    fields: [
      ...personalFields,
      ...financialFields,
      ...contactFields,
      ...travelFields.filter(f => ['trip_payer'].includes(f.name))
    ],
    examples: [
      'Look for account numbers, balances, transaction history',
      'May include bank contact information',
      'Check for sponsorship or funding information',
      'Look for financial sponsorship details'
    ]
  },
  
  birth_certificate: {
    name: 'Birth Certificate',
    category: 'other',
    description: 'Birth certificate or similar vital records',
    fields: [
      ...personalFields.filter(f => ['full_name', 'first_name', 'last_name', 'date_of_birth', 'place_of_birth_city', 'place_of_birth_state', 'place_of_birth_country', 'nationality'].includes(f.name)),
      ...familyFields.filter(f => ['father_given_names', 'mother_given_names'].includes(f.name))
    ],
    examples: [
      'Look for child\'s full name and date of birth',
      'Check for place of birth (city, state, country)',
      'Look for parent information',
      'Check for nationality and citizenship information'
    ]
  },
  
  marriage_certificate: {
    name: 'Marriage Certificate',
    category: 'other',
    description: 'Marriage certificate or similar documents',
    fields: [
      ...personalFields.filter(f => ['full_name', 'first_name', 'last_name', 'date_of_birth', 'marital_status'].includes(f.name)),
      ...spouseFields
    ],
    examples: [
      'Look for both spouses\' names and information',
      'Check for marriage date and location',
      'Look for previous names or maiden names',
      'Check for officiant and witness information'
    ]
  },
  
  general: {
    name: 'General Document',
    category: 'other',
    description: 'Any other type of document',
    fields: [
      ...personalFields,
      ...identificationFields,
      ...contactFields,
      ...addressFields,
      ...employmentFields,
      ...educationFields,
      ...financialFields,
      ...travelFields,
      ...familyFields,
      ...spouseFields,
      ...usHistoryFields
    ],
    examples: [
      'Extract any relevant information found in the document',
      'Look for personal, contact, or identification information',
      'Check for dates, names, and addresses',
      'Look for family, travel, or US history information'
    ]
  }
}

export const getTemplateForCategory = (category: string): DocumentTemplate => {
  return documentTemplates[category] || documentTemplates.general
} 