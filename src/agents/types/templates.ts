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
    name: 'date_of_birth',
    description: 'Date of birth in any format',
    category: 'personal',
    examples: ['15/03/1985', 'March 15, 1985', '1985-03-15'],
    validation_rules: ['Should be a valid date', 'Should be in the past'],
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
    name: 'gender',
    description: 'Gender information',
    category: 'personal',
    examples: ['Male', 'Female', 'M', 'F'],
    required: false
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

// Document templates
export const documentTemplates: Record<string, DocumentTemplate> = {
  passport: {
    name: 'Passport',
    category: 'passport',
    description: 'International passport document',
    fields: [
      ...personalFields,
      ...identificationFields.filter(f => f.name === 'passport_number'),
      ...addressFields
    ],
    examples: [
      'Look for sections labeled "Surname", "Given Names", "Date of Birth", "Nationality"',
      'Passport number is usually prominently displayed',
      'May include place of birth and date of issue'
    ]
  },
  
  visa: {
    name: 'Visa',
    category: 'visa',
    description: 'Visa document or stamp',
    fields: [
      ...personalFields,
      ...identificationFields.filter(f => ['visa_number', 'visa_type'].includes(f.name)),
      ...addressFields
    ],
    examples: [
      'Look for visa number, type, and validity dates',
      'May include sponsor information',
      'Check for entry/exit stamps'
    ]
  },
  
  education: {
    name: 'Education Document',
    category: 'education',
    description: 'Academic transcripts, diplomas, certificates',
    fields: [
      ...personalFields,
      ...educationFields
    ],
    examples: [
      'Look for institution name, degree, graduation date',
      'May include GPA, honors, or academic achievements',
      'Check for accreditation information'
    ]
  },
  
  employment: {
    name: 'Employment Document',
    category: 'employment',
    description: 'Employment letters, contracts, pay stubs',
    fields: [
      ...personalFields,
      ...employmentFields,
      ...contactFields
    ],
    examples: [
      'Look for employer name, job title, salary',
      'May include employment dates and responsibilities',
      'Check for company letterhead and contact information'
    ]
  },
  
  financial: {
    name: 'Financial Document',
    category: 'financial',
    description: 'Bank statements, financial certificates',
    fields: [
      ...personalFields,
      ...financialFields,
      ...addressFields
    ],
    examples: [
      'Look for account numbers, balances, transaction history',
      'May include bank contact information',
      'Check for account holder details'
    ]
  },
  
  general: {
    name: 'General Document',
    category: 'general',
    description: 'Any other immigration-related document',
    fields: [
      ...personalFields,
      ...identificationFields,
      ...contactFields,
      ...addressFields,
      ...employmentFields,
      ...educationFields,
      ...financialFields
    ],
    examples: [
      'Extract any relevant personal, contact, or identification information',
      'Look for dates, numbers, and official identifiers',
      'Identify document type and purpose'
    ]
  }
}

export const getTemplateForCategory = (category: string): DocumentTemplate => {
  return documentTemplates[category] || documentTemplates.general
} 