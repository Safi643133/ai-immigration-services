import { useState, useCallback } from 'react'
import { validateStep } from '@/lib/validation/stepValidation'

interface FormData {
  [key: string]: any
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export const useFormValidation = () => {
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validateCurrentStep = useCallback(async (step: number, formData: FormData): Promise<ValidationResult> => {
    return await validateStep(step, formData)
  }, [])

  const validateAndProceed = useCallback(async (
    currentStep: number, 
    formData: FormData, 
    onStepChange: (step: number) => void
  ): Promise<boolean> => {
    const validation = await validateCurrentStep(currentStep, formData)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return false
    }
    
    // Clear errors if validation passes
    setValidationErrors([])
    onStepChange(currentStep + 1)
    return true
  }, [validateCurrentStep])

  const clearErrors = useCallback(() => {
    setValidationErrors([])
  }, [])

  return {
    validationErrors,
    validateCurrentStep,
    validateAndProceed,
    clearErrors,
    setValidationErrors
  }
}
