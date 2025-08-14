// Form Validation Utilities
// Enhanced validation for DS-160 forms before CEAC submission

import type { 
  FormValidationResult, 
  ValidationError, 
  DS160FormData,
  PreSubmissionChecks 
} from './types/ceac'

export interface ValidationRule {
  field: string
  required: boolean
  validator?: (value: any) => boolean
  errorMessage?: string
  warningMessage?: string
  dependsOn?: {
    field: string
    value: any
  }
}

// DS-160 validation rules
export const DS160_VALIDATION_RULES: ValidationRule[] = [
  // Personal Information - Part 1 (Step 1)
  {
    field: 'personal_info.surnames',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'Surname is required'
  },
  {
    field: 'personal_info.given_names',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'Given names are required'
  },
  {
    field: 'personal_info.other_names_used',
    required: true,
    validator: (value) => ['Yes', 'No'].includes(value),
    errorMessage: 'Please specify if you have used other names'
  },
  {
    field: 'personal_info.other_surnames_used',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'Other surnames are required when "Yes" is selected',
    dependsOn: { field: 'personal_info.other_names_used', value: 'Yes' }
  },
  {
    field: 'personal_info.other_given_names_used',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'Other given names are required when "Yes" is selected',
    dependsOn: { field: 'personal_info.other_names_used', value: 'Yes' }
  },
  {
    field: 'personal_info.telecode_name',
    required: true,
    validator: (value) => ['Yes', 'No'].includes(value),
    errorMessage: 'Please specify if you have a telecode name'
  },
  {
    field: 'personal_info.telecode_surnames',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'Telecode surnames are required when "Yes" is selected',
    dependsOn: { field: 'personal_info.telecode_name', value: 'Yes' }
  },
  {
    field: 'personal_info.telecode_given_names',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'Telecode given names are required when "Yes" is selected',
    dependsOn: { field: 'personal_info.telecode_name', value: 'Yes' }
  },
  {
    field: 'personal_info.sex',
    required: true,
    validator: (value) => ['Male', 'Female'].includes(value),
    errorMessage: 'Sex is required'
  },
  {
    field: 'personal_info.marital_status',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'Marital status is required'
  },
  {
    field: 'personal_info.date_of_birth',
    required: true,
    validator: (value) => {
      if (!value) return false
      const date = new Date(value)
      return !isNaN(date.getTime()) && date < new Date()
    },
    errorMessage: 'Valid date of birth is required'
  },
  {
    field: 'personal_info.place_of_birth_city',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'City of birth is required'
  },
  {
    field: 'personal_info.place_of_birth_country',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'Country of birth is required'
  },

  // Personal Information - Part 2 (Step 2)
  {
    field: 'personal_info.nationality',
    required: true,
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    errorMessage: 'Nationality is required'
  },
  {
    field: 'personal_info.other_nationalities',
    required: true,
    validator: (value) => ['Yes', 'No'].includes(value),
    errorMessage: 'Please specify if you hold other nationalities'
  },
  {
    field: 'personal_info.permanent_resident_other_country',
    required: true,
    validator: (value) => ['Yes', 'No'].includes(value),
    errorMessage: 'Please specify if you are a permanent resident of another country'
  }

  // Add more validation rules for other steps as needed
]

/**
 * Get the value from form data using dot notation path
 */
function getValueByPath(obj: any, path: string): any {
  // First try the path as a direct key (flat object)
  if (obj.hasOwnProperty(path)) {
    return obj[path]
  }
  
  // Fallback to nested path resolution
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Check if a field dependency is satisfied
 */
function isDependencySatisfied(formData: any, dependency: { field: string; value: any }): boolean {
  const fieldValue = getValueByPath(formData, dependency.field)
  return fieldValue === dependency.value
}

/**
 * Validate a single field against its rule
 */
function validateField(formData: any, rule: ValidationRule): ValidationError | null {
  const value = getValueByPath(formData, rule.field)
  
  // Check if field is conditionally required
  if (rule.dependsOn) {
    const dependencyMet = isDependencySatisfied(formData, rule.dependsOn)
    if (!dependencyMet) {
      return null // Field not required in this context
    }
  }
  
  // Check if required field is missing
  if (rule.required && (value === undefined || value === null || value === '')) {
    return {
      field: rule.field,
      message: rule.errorMessage || `${rule.field} is required`,
      severity: 'error'
    }
  }
  
  // Check custom validator
  if (value !== undefined && value !== null && value !== '' && rule.validator) {
    if (!rule.validator(value)) {
      return {
        field: rule.field,
        message: rule.errorMessage || `${rule.field} is invalid`,
        severity: 'error'
      }
    }
  }
  
  return null
}

/**
 * Validate DS-160 form data
 */
export function validateDS160Form(formData: DS160FormData): FormValidationResult {
  const validationErrors: ValidationError[] = []
  const missingFields: string[] = []
  
  // Validate each field against its rules
  for (const rule of DS160_VALIDATION_RULES) {
    const error = validateField(formData, rule)
    if (error) {
      validationErrors.push(error)
      if (error.message.includes('required')) {
        missingFields.push(rule.field)
      }
    }
  }
  
  // Calculate confidence score based on auto-filled data
  const confidenceScore = calculateConfidenceScore(formData)
  
  // Determine if form is complete
  const isComplete = validationErrors.filter(e => e.severity === 'error').length === 0
  
  // Determine readiness for submission
  const readinessForSubmission = isComplete && confidenceScore >= 0.7
  
  // Generate recommended actions
  const recommendedActions: string[] = []
  if (!isComplete) {
    recommendedActions.push('Complete all required fields')
  }
  if (confidenceScore < 0.7) {
    recommendedActions.push('Review auto-filled data for accuracy')
  }
  if (missingFields.length > 0) {
    recommendedActions.push(`Complete missing fields: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`)
  }
  
  return {
    isComplete,
    missingFields,
    validationErrors,
    confidenceScore,
    readinessForSubmission,
    recommendedActions,
    validatedAt: new Date().toISOString()
  }
}

/**
 * Calculate overall confidence score based on auto-filled data
 */
function calculateConfidenceScore(formData: DS160FormData): number {
  // This would integrate with your extracted data confidence scores
  // For now, return a default score
  return 0.85
}

/**
 * Perform pre-submission checks before sending to CEAC
 */
export function performPreSubmissionChecks(formData: DS160FormData): PreSubmissionChecks {
  const validationResult = validateDS160Form(formData)
  
  // Check for low-confidence auto-filled fields
  const fieldConfidenceWarnings: Array<{
    field: string
    confidence: number
    threshold: number
  }> = []
  // This would check against extracted_data confidence scores
  
  return {
    validation_passed: validationResult.isComplete,
    missing_required_fields: validationResult.missingFields,
    field_confidence_warnings: fieldConfidenceWarnings,
    document_verification_status: 'verified', // Would check document processing status
    user_confirmation_required: !validationResult.readinessForSubmission,
    estimated_processing_time: 300, // 5 minutes in seconds
    recommended_embassy_slots: [
      {
        location: 'LONDON, ENGLAND',
        available_slots: 15,
        next_available: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
}

/**
 * Get step completion status for progress tracking
 */
export function getStepCompletionStatus(formData: DS160FormData): Record<number, boolean> {
  const stepCompletions: Record<number, boolean> = {}
  
  // Define step field groups
  const stepFieldGroups = {
    1: ['personal_info.surnames', 'personal_info.given_names', 'personal_info.sex', 'personal_info.date_of_birth'],
    2: ['personal_info.nationality', 'personal_info.other_nationalities'],
    // Add more steps as needed
  }
  
  for (const [step, fields] of Object.entries(stepFieldGroups)) {
    const stepNumber = parseInt(step)
    const requiredFieldsForStep = DS160_VALIDATION_RULES.filter(rule => 
      fields.some(field => rule.field.includes(field)) && rule.required
    )
    
    const completedFields = requiredFieldsForStep.filter(rule => {
      const value = getValueByPath(formData, rule.field)
      return value !== undefined && value !== null && value !== ''
    }).length
    
    stepCompletions[stepNumber] = completedFields === requiredFieldsForStep.length
  }
  
  return stepCompletions
}

/**
 * Get form completion percentage
 */
export function getFormCompletionPercentage(formData: DS160FormData): number {
  const totalRequiredFields = DS160_VALIDATION_RULES.filter(rule => rule.required).length
  const completedFields = DS160_VALIDATION_RULES.filter(rule => {
    if (!rule.required) return false
    
    // Check dependencies
    if (rule.dependsOn && !isDependencySatisfied(formData, rule.dependsOn)) {
      return true // Not required in this context, count as completed
    }
    
    const value = getValueByPath(formData, rule.field)
    return value !== undefined && value !== null && value !== ''
  }).length
  
  return totalRequiredFields > 0 ? Math.round((completedFields / totalRequiredFields) * 100) : 0
}

/**
 * Validate specific form step
 */
export function validateFormStep(formData: DS160FormData, stepNumber: number): FormValidationResult {
  // Get fields relevant to this step
  const stepFieldPrefixes = {
    1: ['personal_info.surnames', 'personal_info.given_names', 'personal_info.other_names', 'personal_info.telecode', 'personal_info.sex', 'personal_info.marital_status', 'personal_info.date_of_birth', 'personal_info.place_of_birth'],
    2: ['personal_info.nationality', 'personal_info.other_nationalities', 'personal_info.permanent_resident', 'personal_info.national_identification', 'personal_info.us_social', 'personal_info.us_taxpayer'],
    // Add more steps as needed
  }
  
  const stepPrefixes = stepFieldPrefixes[stepNumber as keyof typeof stepFieldPrefixes] || []
  const stepRules = DS160_VALIDATION_RULES.filter(rule => 
    stepPrefixes.some(prefix => rule.field.startsWith(prefix))
  )
  
  // Validate only fields relevant to this step
  const validationErrors: ValidationError[] = []
  const missingFields: string[] = []
  
  for (const rule of stepRules) {
    const error = validateField(formData, rule)
    if (error) {
      validationErrors.push(error)
      if (error.message.includes('required')) {
        missingFields.push(rule.field)
      }
    }
  }
  
  const isComplete = validationErrors.filter(e => e.severity === 'error').length === 0
  const confidenceScore = calculateConfidenceScore(formData)
  
  return {
    isComplete,
    missingFields,
    validationErrors,
    confidenceScore,
    readinessForSubmission: isComplete,
    recommendedActions: isComplete ? [] : ['Complete all required fields for this step'],
    validatedAt: new Date().toISOString()
  }
}
