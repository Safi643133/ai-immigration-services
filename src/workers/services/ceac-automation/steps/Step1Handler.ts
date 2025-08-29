import { BaseStepHandler } from './BaseStepHandler'
import { getStep1FieldMappings, type FormFieldMapping } from '../../../../lib/form-field-mappings'
import type { DS160FormData } from '@/lib/types/ceac'

export class Step1Handler extends BaseStepHandler {
  constructor() {
    super(1, 'Personal Information', 'Personal Information - Step 1')
  }

  /**
   * Get Step 1 field mappings
   */
  protected getFieldMappings(): FormFieldMapping[] {
    return getStep1FieldMappings()
  }

  /**
   * Validate Step 1 data
   */
  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Basic validation for Step 1 fields (using flattened structure)
    if (!formData['personal_info.surnames']) {
      errors.push('Surnames is required')
    }
    
    if (!formData['personal_info.given_names']) {
      errors.push('Given names is required')
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
    
    if (!formData['personal_info.place_of_birth_city']) {
      errors.push('Place of birth city is required')
    }
    
    if (!formData['personal_info.place_of_birth_country']) {
      errors.push('Place of birth country is required')
    }
    
    if (!formData['personal_info.nationality']) {
      errors.push('Nationality is required')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check for Step 1 specific validation errors
   */
  protected async checkStepSpecificValidationErrors(page: any): Promise<boolean> {
    try {
      console.log(`🔍 Checking for Step 1 specific validation errors...`)
      
      // Step 1 specific validation selectors
      const step1ValidationSelectors = [
        '#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary', // Primary Step 1 validation summary
        '#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary ul li', // Step 1 validation list items
        '.error-message', // General error message class
        '.field-validation-error' // Field-specific validation error
      ]
      
      for (const selector of step1ValidationSelectors) {
        const errorElement = page.locator(selector)
        if (await errorElement.isVisible({ timeout: 2000 })) {
          const errorText = await errorElement.textContent()
          console.log(`⚠️ Step 1 specific validation error detected with selector "${selector}": ${errorText}`)
          return true
        }
      }
      
      // Check for specific Step 1 field validation errors
      const step1FieldErrors = [
        'Surnames has not been completed',
        'Given Names has not been completed',
        'Full Name in Native Alphabet has not been completed',
        'The question "Have you ever used other names (i.e., maiden, religious,...?" has not been answered',
        'The question "Do you have a telecode that represents your name?" has not been answered',
        'Sex has not been completed',
        'Marital Status has not been completed',
        'Date has not been completed',
        'City has not been completed',
        'State/Province has not been completed',
        'Country/Region has not been completed'
      ]
      
      // Check if any of these specific error messages are present
      for (const errorMessage of step1FieldErrors) {
        const errorElement = page.locator(`text=${errorMessage}`)
        if (await errorElement.isVisible({ timeout: 1000 })) {
          console.log(`⚠️ Step 1 specific field error detected: ${errorMessage}`)
          return true
        }
      }
      
      return false
    } catch (error) {
      console.warn('⚠️ Error checking for Step 1 specific validation errors:', error)
      return false
    }
  }

  /**
   * Step 1 specific logic (if any)
   */
  protected async handleStepSpecificLogic(page: any, jobId: string, formData: DS160FormData): Promise<void> {
    // Step 1 doesn't have any specific logic beyond field filling
    // This method can be overridden in other steps if needed
  }
}
