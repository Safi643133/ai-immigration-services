import { ExtractedField } from '../types/extraction'

export interface ValidationResult {
  field_name: string
  is_valid: boolean
  confidence_score: number
  validation_status: 'pending' | 'validated' | 'flagged' | 'corrected'
  issues: string[]
  suggestions: string[]
  corrected_value?: string
}

export interface ValidationSummary {
  validation_results: ValidationResult[]
  overall_assessment: string
  missing_fields: string[]
  recommendations: string[]
}

// Basic validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.length >= 10 && digitsOnly.length <= 15
}

export const validateDate = (date: string): boolean => {
  // Try to parse the date
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime()) && parsedDate < new Date()
}

export const validatePassportNumber = (passportNumber: string): boolean => {
  // Passport numbers are usually 6-9 alphanumeric characters
  const passportRegex = /^[A-Z0-9]{6,9}$/
  return passportRegex.test(passportNumber)
}

export const validateVisaNumber = (visaNumber: string): boolean => {
  // Visa numbers can vary in format
  const visaRegex = /^[A-Z0-9\-]{8,12}$/
  return visaRegex.test(visaNumber)
}

export const validateName = (name: string): boolean => {
  // Names should contain letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[A-Za-z\s\-'\.]+$/
  return nameRegex.test(name) && name.trim().length >= 2
}

export const validatePostalCode = (postalCode: string): boolean => {
  // Basic postal code validation (can be enhanced for specific countries)
  const postalRegex = /^[A-Z0-9\s\-]{3,10}$/
  return postalRegex.test(postalCode)
}

// Field-specific validation
export const validateField = (field: ExtractedField): ValidationResult => {
  const issues: string[] = []
  const suggestions: string[] = []
  let is_valid = true
  let confidence_score = field.confidence_score

  switch (field.field_name) {
    case 'email':
      if (!validateEmail(field.field_value)) {
        issues.push('Invalid email format')
        is_valid = false
        confidence_score = Math.min(confidence_score, 0.3)
      }
      break

    case 'phone':
      if (!validatePhone(field.field_value)) {
        issues.push('Invalid phone number format')
        is_valid = false
        confidence_score = Math.min(confidence_score, 0.3)
      }
      break

    case 'date_of_birth':
      if (!validateDate(field.field_value)) {
        issues.push('Invalid date format or future date')
        is_valid = false
        confidence_score = Math.min(confidence_score, 0.3)
      }
      break

    case 'passport_number':
      if (!validatePassportNumber(field.field_value)) {
        issues.push('Invalid passport number format')
        is_valid = false
        confidence_score = Math.min(confidence_score, 0.3)
      }
      break

    case 'visa_number':
      if (!validateVisaNumber(field.field_value)) {
        issues.push('Invalid visa number format')
        is_valid = false
        confidence_score = Math.min(confidence_score, 0.3)
      }
      break

    case 'full_name':
    case 'first_name':
    case 'last_name':
      if (!validateName(field.field_value)) {
        issues.push('Invalid name format')
        is_valid = false
        confidence_score = Math.min(confidence_score, 0.3)
      }
      break

    case 'postal_code':
      if (!validatePostalCode(field.field_value)) {
        issues.push('Invalid postal code format')
        is_valid = false
        confidence_score = Math.min(confidence_score, 0.3)
      }
      break
  }

  // Check for empty or very short values
  if (field.field_value.trim().length === 0) {
    issues.push('Field value is empty')
    is_valid = false
    confidence_score = 0
  } else if (field.field_value.trim().length < 2) {
    issues.push('Field value is too short')
    is_valid = false
    confidence_score = Math.min(confidence_score, 0.2)
  }

  // Determine validation status
  let validation_status: 'pending' | 'validated' | 'flagged' | 'corrected' = 'validated'
  if (!is_valid) {
    validation_status = confidence_score < 0.3 ? 'flagged' : 'pending'
  } else if (confidence_score < 0.7) {
    validation_status = 'pending'
  }

  // Add suggestions based on issues
  if (issues.includes('Invalid email format')) {
    suggestions.push('Check for missing @ symbol or domain')
  }
  if (issues.includes('Invalid phone number format')) {
    suggestions.push('Ensure phone number contains 10-15 digits')
  }
  if (issues.includes('Invalid date format')) {
    suggestions.push('Use standard date formats (MM/DD/YYYY, YYYY-MM-DD)')
  }

  return {
    field_name: field.field_name,
    is_valid,
    confidence_score,
    validation_status,
    issues,
    suggestions
  }
}

// Validate all fields in an extraction result
export const validateExtraction = (fields: ExtractedField[]): ValidationSummary => {
  const validation_results = fields.map(validateField)
  
  const valid_count = validation_results.filter(r => r.is_valid).length
  const total_count = validation_results.length
  const overall_score = total_count > 0 ? valid_count / total_count : 0

  let overall_assessment = 'Excellent'
  if (overall_score < 0.5) {
    overall_assessment = 'Poor - Many validation issues found'
  } else if (overall_score < 0.8) {
    overall_assessment = 'Fair - Some validation issues found'
  } else if (overall_score < 0.95) {
    overall_assessment = 'Good - Minor validation issues found'
  }

  const missing_fields = validation_results
    .filter(r => r.validation_status === 'flagged')
    .map(r => r.field_name)

  const recommendations = []
  if (overall_score < 0.8) {
    recommendations.push('Review and correct invalid fields')
  }
  if (validation_results.some(r => r.confidence_score < 0.5)) {
    recommendations.push('Review low-confidence extractions')
  }
  if (missing_fields.length > 0) {
    recommendations.push(`Re-extract missing fields: ${missing_fields.join(', ')}`)
  }

  return {
    validation_results,
    overall_assessment,
    missing_fields,
    recommendations
  }
} 