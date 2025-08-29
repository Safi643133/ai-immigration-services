import { Page } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { ProgressService } from '../../../../lib/progress/progress-service'
import { getCountryCode } from '../../../../lib/country-code-mapping'
import type { FormFieldMapping } from '../../../../lib/form-field-mappings'
import type { DS160FormData } from '@/lib/types/ceac'

export abstract class BaseStepHandler {
  protected progressService: ProgressService
  protected supabase: any
  protected stepNumber: number
  protected stepName: string
  protected stepDescription: string

  constructor(stepNumber: number, stepName: string, stepDescription: string) {
    this.progressService = new ProgressService()
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.stepNumber = stepNumber
    this.stepName = stepName
    this.stepDescription = stepDescription
  }

  /**
   * Main method to handle the step
   */
  async handleStep(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    try {
      console.log(`📝 Starting Step ${this.stepNumber} - ${this.stepDescription}...`)
      
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        `form_step_${this.stepNumber}` as any,
        'running',
        `Filling Step ${this.stepNumber} - ${this.stepDescription}`,
        40 + (this.stepNumber * 2)
      )
      
      // Wait for page to load completely (with fallback)
      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 })
      } catch (error) {
        console.log('⚠️ Network idle timeout, proceeding with form filling...')
        // Wait a bit for any remaining dynamic content
        await page.waitForTimeout(2000)
      }
      
      // Validate step data
      const validation = this.validateStepData(formData)
      if (!validation.valid) {
        console.warn(`⚠️ Step ${this.stepNumber} data validation warnings:`, validation.errors)
      }
      
      // Get field mappings for this step
      const fieldMappings = this.getFieldMappings()
      console.log(`📝 Found ${fieldMappings.length} Step ${this.stepNumber} fields to fill`)
      
      let filledFields = 0
      const totalFields = fieldMappings.length
      
      // Fill each field based on mapping
      for (const fieldMapping of fieldMappings) {
        try {
          const fieldValue = formData[fieldMapping.fieldName]
          
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
            continue
          }
          
          console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
          
          const element = page.locator(fieldMapping.selector)
          
          // Wait for element to be visible
          await element.waitFor({ state: 'visible', timeout: 15000 })
          
                  // Fill based on field type
        await this.fillFieldByType(page, element, fieldMapping, fieldValue, formData, jobId)
          
          filledFields++
          
          // Update progress every 5 fields
          if (filledFields % 5 === 0) {
            const progress = 40 + (this.stepNumber * 2) + Math.floor((filledFields / totalFields) * 2)
            await this.progressService.updateStepProgress(
              jobId,
              `form_step_${this.stepNumber}_progress` as any,
              'running',
              `Filled ${filledFields}/${totalFields} Step ${this.stepNumber} fields`,
              progress
            )
          }
          
          // Small delay between fields to avoid overwhelming the form
          await page.waitForTimeout(100)
          
          // Extra delay for dropdowns to ensure they're fully loaded
          if (fieldMapping.type === 'select') {
            await page.waitForTimeout(500)
          }
          
        } catch (error) {
          console.warn(`⚠️ Failed to fill field ${fieldMapping.fieldName}:`, error)
          // Continue with other fields
        }
      }
      
      // Update final progress for this step
      await this.progressService.updateStepProgress(
        jobId,
        `form_step_${this.stepNumber}_completed` as any,
        'running',
        `Successfully filled ${filledFields} Step ${this.stepNumber} fields`,
        40 + (this.stepNumber * 2) + 2
      )
      
      console.log(`✅ Step ${this.stepNumber} completed. Filled ${filledFields} fields.`)
      
      // Handle step-specific logic
      await this.handleStepSpecificLogic(page, jobId, formData)
      
      // Click Next button to proceed to next step
      await this.clickNextButton(page, jobId, formData)
      
    } catch (error) {
      console.error(`❌ Error in Step ${this.stepNumber}:`, error)
      
      // Take error screenshot
      await this.takeErrorScreenshot(page, jobId)
      
      // Update job status to failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      await this.updateJobStatusToFailed(jobId, `Step ${this.stepNumber} failed: ${errorMessage}`)
      
      // Re-throw the error to stop processing
      throw error
    }
  }

  /**
   * Abstract method to get field mappings for this step
   */
  protected abstract getFieldMappings(): FormFieldMapping[]

  /**
   * Abstract method to validate step-specific data
   */
  protected abstract validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] }

  /**
   * Abstract method for step-specific logic (can be empty implementation)
   */
  protected async handleStepSpecificLogic(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    // Default empty implementation - override in subclasses if needed
  }

  /**
   * Fill field based on its type
   */
  protected async fillFieldByType(
    page: Page, 
    element: any, 
    fieldMapping: FormFieldMapping, 
    fieldValue: any, 
    formData: DS160FormData,
    jobId?: string
  ): Promise<void> {
    switch (fieldMapping.type) {
      case 'text':
        await element.fill(fieldValue.toString())
        break
        
      case 'select':
        await this.fillSelectField(page, element, fieldMapping, fieldValue)
        break
        
      case 'radio':
        await this.fillEnhancedRadioField(page, element, fieldMapping, fieldValue, formData)
        break
        
      case 'checkbox':
        if (fieldValue === true || fieldValue === 'Yes' || fieldValue === 'N/A') {
          await element.check()
        } else {
          await element.uncheck()
        }
        break
        
      case 'date':
        // Format date for input
        const dateValue = new Date(fieldValue.toString()).toISOString().split('T')[0]
        await element.fill(dateValue)
        break
        
      case 'date_split':
        await this.fillSplitDateField(page, fieldMapping, fieldValue)
        break
        
      case 'textarea':
        await element.fill(fieldValue.toString())
        break
        
      case 'text': // Handle SSN as text for now
        await this.fillSSNField(page, fieldMapping, fieldValue, formData)
        break
    }
  }

  /**
   * Fill select dropdown field
   */
  protected async fillSelectField(page: Page, element: any, fieldMapping: FormFieldMapping, fieldValue: any): Promise<void> {
    // Use value mapping if available, otherwise use the original value
    let selectValue = fieldValue.toString()
    if (fieldMapping.valueMapping && fieldMapping.valueMapping[selectValue]) {
      selectValue = fieldMapping.valueMapping[selectValue]
    }
    
    console.log(`🔍 Selecting dropdown: ${fieldMapping.fieldName} with value: ${selectValue}`)
    
    // Wait for dropdown to be ready
    await element.waitFor({ state: 'visible', timeout: 10000 })
    
    // Extra wait for country dropdown specifically
    if (fieldMapping.fieldName.includes('country') || fieldMapping.fieldName.includes('nationality')) {
      console.log(`⏳ Extra wait for country dropdown...`)
      await page.waitForTimeout(2000)
      
      // Check if options are available
      const options = element.locator('option')
      const optionCount = await options.count()
      console.log(`✅ Country dropdown has ${optionCount} options available`)
    }
    
    // For nationality/country fields, use our country code mapping
    if (fieldMapping.fieldName.includes('nationality') || fieldMapping.fieldName.includes('country')) {
      const countryCode = getCountryCode(selectValue)
      if (countryCode) {
        selectValue = countryCode
        console.log(`🔍 STEP${this.stepNumber} - Country "${fieldValue}" mapped to CEAC code: "${selectValue}"`)
      } else {
        console.log(`⚠️ STEP${this.stepNumber} - No country code found for: ${selectValue}`)
      }
    }
    
    // Try to select by value first
    try {
      // Focus the dropdown first
      await element.focus()
      await page.waitForTimeout(200)
      await element.selectOption({ value: selectValue })
      console.log(`✅ Successfully selected by value: ${selectValue}`)
    } catch (error) {
      console.log(`⚠️ Direct selection failed, trying keyboard navigation...`)
      
      // Try keyboard navigation approach
      try {
        // Click to focus the dropdown
        await element.click()
        await page.waitForTimeout(500)
        
        // Type the full country name to find the exact match
        const searchText = fieldValue.toString().toUpperCase()
        console.log(`🔍 Typing full country name: ${searchText}`)
        await page.keyboard.type(searchText)
        await page.waitForTimeout(1000) // Longer wait for full text
        
        // Press Enter to select the highlighted option
        await page.keyboard.press('Enter')
        console.log(`✅ Selected using keyboard navigation: ${fieldValue}`)
      } catch (keyboardError) {
        console.log(`⚠️ Keyboard navigation failed, trying manual option selection...`)
        
        // Manual option selection as last resort
        const options = element.locator('option')
        const optionCount = await options.count()
        console.log(`🔍 Manually searching through ${optionCount} options...`)
        
        let found = false
        for (let i = 0; i < optionCount; i++) {
          const option = options.nth(i)
          const optionValue = await option.getAttribute('value')
          const optionText = await option.textContent()
          
          if (optionValue === selectValue) {
            console.log(`🔍 Found matching option: ${optionText} (value: ${optionValue})`)
            if (optionValue) {
              await element.selectOption({ value: optionValue })
              console.log(`✅ Manually selected option: ${optionText}`)
              found = true
              break
            }
          }
        }
        
        if (!found) {
          throw new Error(`Could not find option for value: ${selectValue}`)
        }
      }
    }
  }

  /**
   * Fill radio button field (enhanced version for Step 2)
   */
  protected async fillEnhancedRadioField(
    page: Page, 
    element: any, 
    fieldMapping: FormFieldMapping, 
    fieldValue: any, 
    formData: DS160FormData,
    jobId?: string
  ): Promise<void> {
    // Use value mapping if available
    let radioValue = fieldValue.toString()
    if (fieldMapping.valueMapping && fieldMapping.valueMapping[radioValue]) {
      radioValue = fieldMapping.valueMapping[radioValue]
    }
    
    console.log(`🔍 STEP${this.stepNumber} - Radio value: ${radioValue}`)
    
    // Handle radio button groups - find the specific radio button by value
    const radioSelector = `input[type="radio"][name*="${fieldMapping.selector.split('_').pop()}"][value="${radioValue}"]`
    console.log(`🔍 STEP${this.stepNumber} - Radio selector: ${radioSelector}`)
    const radioButton = page.locator(radioSelector)
    
    try {
      await radioButton.waitFor({ state: 'visible', timeout: 15000 })
      await radioButton.check()
      console.log(`✅ Selected radio button: ${fieldMapping.fieldName} = ${radioValue}`)
      
      // Handle conditional fields for radio buttons (like other_names_used)
      if (fieldMapping.conditional && fieldMapping.conditional.value && radioValue === fieldMapping.conditional.value && fieldMapping.conditional.showFields) {
        console.log(`📝 Filling conditional fields for ${fieldMapping.fieldName}...`)
        await this.fillConditionalFields(page, fieldMapping.conditional.showFields, formData, jobId)
      }
      
      // Enhanced waiting for conditional fields that may appear (Step 1 and Step 2 specific)
      if (fieldMapping.fieldName === 'personal_info.other_names_used' && radioValue === 'Y' && jobId) {
        console.log(`🔄 Other names used set to Yes - waiting for conditional fields...`)
        await this.waitForConditionalFieldsToAppear(page, jobId, 'other_names')
      } else if (fieldMapping.fieldName === 'personal_info.telecode_name' && radioValue === 'Y' && jobId) {
        console.log(`🔄 Telecode name set to Yes - waiting for conditional fields...`)
        await this.waitForConditionalFieldsToAppear(page, jobId, 'telecode')
      } else if (fieldMapping.fieldName === 'personal_info.other_nationalities' && radioValue === 'Y' && jobId) {
        console.log(`🔄 Other nationalities set to Yes - waiting for conditional fields...`)
        await this.waitForConditionalFieldsToAppear(page, jobId, 'other_nationalities')
      } else if (fieldMapping.fieldName === 'personal_info.permanent_resident_other_country' && radioValue === 'Y' && jobId) {
        console.log(`🔄 Permanent resident other country set to Yes - waiting for conditional fields...`)
        await this.waitForConditionalFieldsToAppear(page, jobId, 'permanent_resident')
      }
      
      // Wait for postback if the radio button triggers one
      await this.waitForPostback(page, 'radio selection')
      
    } catch (error) {
      console.log(`⚠️ Radio button not found, trying alternative selector...`)
      // Try alternative selector for radio button groups
      const altRadioButton = page.locator(`input[type="radio"][value="${radioValue}"]`)
      await altRadioButton.check()
      console.log(`✅ Selected radio button with alternative selector: ${fieldMapping.fieldName} = ${radioValue}`)
      
      // Handle conditional fields for radio buttons (like other_names_used)
      if (fieldMapping.conditional && fieldMapping.conditional.value && radioValue === fieldMapping.conditional.value && fieldMapping.conditional.showFields) {
        console.log(`📝 Filling conditional fields for ${fieldMapping.fieldName}...`)
        await this.fillConditionalFields(page, fieldMapping.conditional.showFields, formData, jobId)
      }
      
      // Enhanced waiting for conditional fields that may appear (Step 1 and Step 2 specific)
      if (fieldMapping.fieldName === 'personal_info.other_names_used' && radioValue === 'Y' && jobId) {
        console.log(`🔄 Other names used set to Yes - waiting for conditional fields...`)
        await this.waitForConditionalFieldsToAppear(page, jobId, 'other_names')
      } else if (fieldMapping.fieldName === 'personal_info.telecode_name' && radioValue === 'Y' && jobId) {
        console.log(`🔄 Telecode name set to Yes - waiting for conditional fields...`)
        await this.waitForConditionalFieldsToAppear(page, jobId, 'telecode')
      } else if (fieldMapping.fieldName === 'personal_info.other_nationalities' && radioValue === 'Y' && jobId) {
        console.log(`🔄 Other nationalities set to Yes - waiting for conditional fields...`)
        await this.waitForConditionalFieldsToAppear(page, jobId, 'other_nationalities')
      } else if (fieldMapping.fieldName === 'personal_info.permanent_resident_other_country' && radioValue === 'Y' && jobId) {
        console.log(`🔄 Permanent resident other country set to Yes - waiting for conditional fields...`)
        await this.waitForConditionalFieldsToAppear(page, jobId, 'permanent_resident')
      }
      
      // Wait for postback if the radio button triggers one
      await this.waitForPostback(page, 'radio selection')
    }
    
    // Small delay to ensure radio button processing
    await page.waitForTimeout(1000)
  }

  /**
   * Fill SSN field (special handling for Step 2)
   */
  protected async fillSSNField(
    page: Page, 
    fieldMapping: FormFieldMapping, 
    fieldValue: any, 
    formData: DS160FormData
  ): Promise<void> {
    // Handle SSN as 3 separate parts
    const ssnParts = fieldValue.toString().split('-')
    const ssnPart1 = ssnParts[0] || ''
    const ssnPart2 = ssnParts[1] || ''
    const ssnPart3 = ssnParts[2] || ''
    
    // Fill SSN part 1
    const ssn1Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN1')
    await ssn1Element.waitFor({ state: 'visible', timeout: 15000 })
    await ssn1Element.fill(ssnPart1)
    
    // Fill SSN part 2
    if (ssnPart2) {
      const ssn2Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN2')
      await ssn2Element.fill(ssnPart2)
    }
    
    // Fill SSN part 3
    if (ssnPart3) {
      const ssn3Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN3')
      await ssn3Element.fill(ssnPart3)
    }
    
    console.log(`✅ Filled SSN: ${ssnPart1}-${ssnPart2}-${ssnPart3}`)
  }

  /**
   * Wait for conditional fields to appear after radio button selection
   */
  protected async waitForConditionalFieldsToAppear(page: Page, jobId: string, fieldType: string): Promise<void> {
    console.log(`⏳ Waiting for ${fieldType} conditional fields to appear...`)
    
    const maxWaitTime = 30000 // 30 seconds
    const checkInterval = 1000 // 1 second
    let startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check for different types of conditional fields
        let conditionalElement = null
        
        switch (fieldType) {
          case 'other_nationalities':
            conditionalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_ddlOTHER_NATL')
            break
          case 'permanent_resident':
            conditionalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOthPermResCntry_ctl00_ddlOthPermResCntry')
            break
          case 'passport_number':
            conditionalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_tbxOTHER_PPT_NUM')
            break
          case 'other_names':
            conditionalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_DListAlias_ctl00_tbxSURNAME')
            break
          case 'telecode':
            conditionalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_TelecodeSURNAME')
            break
          default:
            console.log(`⚠️ Unknown field type: ${fieldType}`)
            return
        }
        
        if (conditionalElement && await conditionalElement.isVisible({ timeout: 2000 })) {
          console.log(`✅ ${fieldType} conditional fields appeared after ${Date.now() - startTime}ms`)
          return
        }
        
        // Wait before checking again
        await page.waitForTimeout(checkInterval)
        
      } catch (error) {
        // Continue waiting
        await page.waitForTimeout(checkInterval)
      }
    }
    
    console.warn(`⚠️ Timeout waiting for ${fieldType} conditional fields to appear`)
    await this.takeErrorScreenshot(page, jobId)
  }

  /**
   * Wait for postback to complete after form interactions
   */
  protected async waitForPostback(page: Page, action: string): Promise<void> {
    console.log(`⏳ Waiting for postback after ${action}...`)
    
    try {
      // Wait for network idle
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      console.log(`✅ Postback completed after ${action}`)
    } catch (timeoutError) {
      console.log(`ℹ️ No postback detected or timeout after ${action} - continuing`)
    }
    
    // Additional wait to ensure DOM is fully updated
    await page.waitForTimeout(2000)
  }

  /**
   * Fill split date field
   */
  protected async fillSplitDateField(page: Page, fieldMapping: FormFieldMapping, fieldValue: any): Promise<void> {
    if (fieldMapping.dateSelectors) {
      const date = new Date(fieldValue.toString())
      const day = date.getDate().toString().padStart(2, '0')
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
      const year = date.getFullYear().toString()
      
      // Fill day
      const dayElement = page.locator(fieldMapping.dateSelectors.day)
      await dayElement.selectOption({ value: day })
      
      // Fill month
      const monthElement = page.locator(fieldMapping.dateSelectors.month)
      await monthElement.selectOption({ value: month })
      
      // Fill year
      const yearElement = page.locator(fieldMapping.dateSelectors.year)
      await yearElement.fill(year)
    }
  }

  /**
   * Fill conditional fields
   */
  protected async fillConditionalFields(page: Page, conditionalFields: any[], formData: DS160FormData, jobId?: string): Promise<void> {
    for (const conditionalField of conditionalFields) {
      try {
        const fieldValue = formData[conditionalField.fieldName]
        
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          console.log(`⏭️ Skipping empty conditional field: ${conditionalField.fieldName}`)
          continue
        }
        
        console.log(`📝 Filling conditional field: ${conditionalField.fieldName} = ${fieldValue}`)
        
        const element = page.locator(conditionalField.selector)
        
        // Wait for element to be visible
        await element.waitFor({ state: 'visible', timeout: 10000 })
        
        // Fill based on field type
        await this.fillFieldByType(page, element, conditionalField, fieldValue, formData, jobId)
        
        // Small delay between conditional fields
        await page.waitForTimeout(100)
        
      } catch (error) {
        console.warn(`⚠️ Failed to fill conditional field ${conditionalField.fieldName}:`, error)
      }
    }
  }

  /**
   * Click the Next button to proceed to the next form step
   */
  protected async clickNextButton(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log(`➡️ Clicking Next button to proceed from Step ${this.stepNumber}...`)
    
    // Look for the Next button
    const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
    
    if (await nextButton.isVisible({ timeout: 10000 })) {
      await nextButton.click()
      console.log('✅ Next button clicked')
      
      // Wait for navigation with better error handling
      try {
        console.log('⏳ Waiting for page to load after Next button click...')
        await page.waitForLoadState('networkidle', { timeout: 45000 })
        console.log('✅ Page loaded successfully')
      } catch (error) {
        console.log('⚠️ Network idle timeout, trying alternative wait strategy...')
        
        // Try waiting for domcontentloaded instead
        try {
          await page.waitForLoadState('domcontentloaded', { timeout: 30000 })
          console.log('✅ DOM content loaded')
          
          // Additional wait for any remaining network activity
          await page.waitForTimeout(5000)
          console.log('✅ Additional wait completed')
        } catch (domError) {
          console.log('⚠️ DOM content loaded also timed out, proceeding anyway...')
          await page.waitForTimeout(3000)
        }
      }
      
      // Check for validation errors after clicking Next
      const hasValidationErrors = await this.checkForValidationErrors(page)
      
      if (hasValidationErrors) {
        console.error(`❌ Validation errors detected on Step ${this.stepNumber}`)
        
        // Take screenshot of the error page
        await this.takeErrorScreenshot(page, jobId)
        
        // Update job status to failed
        await this.updateJobStatusToFailed(jobId, `Validation errors on Step ${this.stepNumber}`)
        
        // Throw error to stop processing
        throw new Error(`Form validation failed on Step ${this.stepNumber}. Check screenshot for details.`)
      }
      
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        `form_step_${this.stepNumber + 1}` as any,
        'running',
        `Successfully navigated from Step ${this.stepNumber} to Step ${this.stepNumber + 1}`,
        40 + ((this.stepNumber + 1) * 2)
      )
      
      console.log(`✅ Successfully navigated from Step ${this.stepNumber} to Step ${this.stepNumber + 1}`)
    } else {
      throw new Error('Next button not found')
    }
  }

  /**
   * Check for validation errors on the current page
   */
  protected async checkForValidationErrors(page: Page): Promise<boolean> {
    // First check step-specific validation selectors
    const stepSpecificErrors = await this.checkStepSpecificValidationErrors(page)
    if (stepSpecificErrors) {
      return true
    }
    
    // Then check general CEAC validation selectors
    return await this.checkGeneralValidationErrors(page)
  }

  /**
   * Check for step-specific validation errors (can be overridden by subclasses)
   */
  protected async checkStepSpecificValidationErrors(page: Page): Promise<boolean> {
    // Default implementation - subclasses can override this for step-specific validation
    return false
  }

  /**
   * Check for general CEAC validation errors
   */
  protected async checkGeneralValidationErrors(page: Page): Promise<boolean> {
    try {
      console.log(`🔍 Checking for validation errors on Step ${this.stepNumber}...`)
      
      // Primary CEAC validation summary check (most specific)
      const primaryValidationSelector = '#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary'
      const primaryValidationElement = page.locator(primaryValidationSelector)
      
      if (await primaryValidationElement.isVisible({ timeout: 3000 })) {
        const errorText = await primaryValidationElement.textContent()
        console.log(`❌ CEAC Validation Summary detected: ${errorText}`)
        
        // Extract specific error messages from the list
        const errorListItems = primaryValidationElement.locator('ul li')
        const errorCount = await errorListItems.count()
        
        if (errorCount > 0) {
          console.log(`📋 Found ${errorCount} validation errors:`)
          for (let i = 0; i < errorCount; i++) {
            const errorItem = await errorListItems.nth(i).textContent()
            console.log(`  - ${errorItem}`)
          }
        }
        
        return true
      }
      
      // Fallback: Check for other CEAC validation selectors (step-specific variations)
      const ceacValidationSelectors = [
        '#ctl00_SiteContentPlaceHolder_ValidationSummary1', // Alternative CEAC validation summary
        '#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary', // Primary selector
        '.error-message', // General error message class
        '.validation-error', // Validation error class
        '.field-validation-error' // Field-specific validation error
      ]
      
      for (const selector of ceacValidationSelectors) {
        const errorElement = page.locator(selector)
        if (await errorElement.isVisible({ timeout: 2000 })) {
          const errorText = await errorElement.textContent()
          console.log(`⚠️ CEAC validation error detected with selector "${selector}": ${errorText}`)
          return true
        }
      }
      
      // Check for error messages in list items (common CEAC pattern)
      const errorListSelectors = [
        '#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary ul li',
        '#ctl00_SiteContentPlaceHolder_ValidationSummary1 ul li',
        '.error-message ul li',
        '.validation-error ul li'
      ]
      
      for (const selector of errorListSelectors) {
        const errorElements = page.locator(selector)
        const count = await errorElements.count()
        
        if (count > 0) {
          console.log(`📋 Found ${count} validation error items with selector "${selector}":`)
          for (let i = 0; i < count; i++) {
            const errorText = await errorElements.nth(i).textContent()
            if (errorText && errorText.trim().length > 0) {
              console.log(`  - ${errorText}`)
              return true
            }
          }
        }
      }
      
      // Check for general error indicators (fallback)
      const generalErrorSelectors = [
        '.error', // General error class
        '.alert-danger', // Bootstrap danger alert
        '.alert-error', // Error alert
        '[class*="error"]', // Any class containing "error"
        '[class*="invalid"]', // Any class containing "invalid"
        '[class*="validation"]' // Any class containing "validation"
      ]
      
      for (const selector of generalErrorSelectors) {
        const errorElement = page.locator(selector)
        if (await errorElement.isVisible({ timeout: 2000 })) {
          const errorText = await errorElement.textContent()
          console.log(`⚠️ General validation error detected with selector "${selector}": ${errorText}`)
          return true
        }
      }
      
      // Check if we're still on the same page (URL hasn't changed) - this might indicate a validation error
      const currentUrl = page.url()
      if (currentUrl.includes(`Step${this.stepNumber}`) || currentUrl.includes(`step${this.stepNumber}`)) {
        console.log(`⚠️ Still on Step ${this.stepNumber} after clicking Next - possible validation error`)
        console.log(`🔗 Current URL: ${currentUrl}`)
        return true
      }
      
      console.log(`✅ No validation errors detected on Step ${this.stepNumber}`)
      return false
      
    } catch (error) {
      console.warn('⚠️ Error checking for validation errors:', error)
      return false
    }
  }

  /**
   * Take screenshot of error page and store in Supabase
   */
  protected async takeErrorScreenshot(page: Page, jobId: string): Promise<void> {
    try {
      console.log(`📸 Taking error screenshot for Step ${this.stepNumber}...`)
      
      // Extract validation error details before taking screenshot
      let validationErrors: string[] = []
      
      try {
        // Try to get the primary CEAC validation summary
        const primaryValidationSelector = '#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary'
        const primaryValidationElement = page.locator(primaryValidationSelector)
        
        if (await primaryValidationElement.isVisible({ timeout: 2000 })) {
          const errorListItems = primaryValidationElement.locator('ul li')
          const errorCount = await errorListItems.count()
          
          for (let i = 0; i < errorCount; i++) {
            const errorText = await errorListItems.nth(i).textContent()
            if (errorText && errorText.trim().length > 0) {
              validationErrors.push(errorText.trim())
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not extract validation error details:', error)
      }
      
      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: true
      })
      
      // Generate filename with validation error count
      const timestamp = Date.now()
      const errorCount = validationErrors.length
      const filename = `step-${this.stepNumber}-validation-error-${errorCount}-errors-${timestamp}.png`
      
      // Store in Supabase bucket
      const { data, error } = await this.supabase.storage
        .from('ceac-artifacts')
        .upload(`ceac-jobs/${jobId}/screenshot/${filename}`, screenshot, {
          contentType: 'image/png',
          cacheControl: '3600'
        })
      
      if (error) {
        console.error('❌ Failed to upload error screenshot:', error)
      } else {
        console.log(`✅ Error screenshot uploaded: ${data.path}`)
        console.log(`📋 Validation errors captured: ${validationErrors.length}`)
        
        // Log the specific validation errors
        if (validationErrors.length > 0) {
          console.log('📝 Validation error details:')
          validationErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`)
          })
        }
        
        // Get public URL
        const { data: urlData } = this.supabase.storage
          .from('ceac-artifacts')
          .getPublicUrl(data.path)
        
        console.log(`📸 Error screenshot URL: ${urlData.publicUrl}`)
        
        // Store validation error details in job metadata
        await this.storeValidationErrorDetails(jobId, validationErrors)
      }
    } catch (error) {
      console.error('❌ Failed to take error screenshot:', error)
    }
  }

  /**
   * Store validation error details in job metadata
   */
  protected async storeValidationErrorDetails(jobId: string, validationErrors: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ceac_automation_jobs')
        .update({
          metadata: {
            validation_errors: validationErrors,
            validation_error_count: validationErrors.length,
            step_number: this.stepNumber,
            error_timestamp: new Date().toISOString()
          }
        })
        .eq('id', jobId)
      
      if (error) {
        console.error('❌ Failed to store validation error details:', error)
      } else {
        console.log(`✅ Validation error details stored for job ${jobId}`)
      }
    } catch (error) {
      console.error('❌ Error storing validation error details:', error)
    }
  }

  /**
   * Update job status to failed
   */
  protected async updateJobStatusToFailed(jobId: string, errorMessage: string): Promise<void> {
    try {
      console.log(`❌ Updating job ${jobId} status to failed...`)
      
      // Update job status in database
      const { error } = await this.supabase
        .from('ceac_automation_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          finished_at: new Date().toISOString()
        })
        .eq('id', jobId)
      
      if (error) {
        console.error('❌ Failed to update job status:', error)
      } else {
        console.log(`✅ Job ${jobId} status updated to failed`)
      }
    } catch (error) {
      console.error('❌ Error updating job status:', error)
    }
  }

  /**
   * Update job status to completed
   */
  protected async updateJobStatusToCompleted(jobId: string, completionMessage: string): Promise<void> {
    try {
      console.log(`✅ Updating job ${jobId} status to completed...`)
      
      // Update job status in database
      const { error } = await this.supabase
        .from('ceac_automation_jobs')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          metadata: {
            completion_message: completionMessage,
            completion_timestamp: new Date().toISOString(),
            final_step: this.stepNumber,
            total_steps_completed: 17
          }
        })
        .eq('id', jobId)
      
      if (error) {
        console.error('❌ Failed to update job status to completed:', error)
      } else {
        console.log(`✅ Job ${jobId} status updated to completed`)
        console.log(`📝 Completion message: ${completionMessage}`)
      }
    } catch (error) {
      console.error('❌ Error updating job status to completed:', error)
    }
  }


}
