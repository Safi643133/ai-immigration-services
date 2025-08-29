import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { getStep7FieldMappings } from '@/lib/form-field-mappings'
import { getCountryCode } from '@/lib/country-code-mapping'

export class Step7Handler extends BaseStepHandler {
  constructor() {
    super(7, 'Passport/Visa Information', 'Filling passport and visa information')
  }

  protected getFieldMappings() {
    return getStep7FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required passport fields
    if (!formData['passport_info.passport_type']?.trim()) {
      errors.push('Passport type is required')
    }
    if (!formData['passport_info.passport_number']?.trim()) {
      errors.push('Passport number is required')
    }
    if (!formData['passport_info.passport_issuing_country']?.trim()) {
      errors.push('Passport issuing country is required')
    }
    if (!formData['passport_info.passport_issued_city']?.trim()) {
      errors.push('City where passport was issued is required')
    }
    if (!formData['passport_info.passport_issued_country']?.trim()) {
      errors.push('Country where passport was issued is required')
    }
    if (!formData['passport_info.passport_issue_date']?.trim()) {
      errors.push('Passport issue date is required')
    }

    // Conditional validation
    if (formData['passport_info.passport_type'] === 'Other') {
      if (!formData['passport_info.passport_other_explanation']?.trim()) {
        errors.push('Passport other explanation is required when passport type is Other')
      }
    }

    if (formData['passport_info.passport_lost_stolen'] === 'Yes') {
      if (!formData['passport_info.lost_passport_country']?.trim()) {
        errors.push('Lost passport country is required when passport was lost/stolen')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Override the handleStep method to use custom Step 7 logic
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

      // Verify we're on the correct page before proceeding
      console.log('🔍 Verifying we are on Step 7 page...')
      const step7Indicator = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_TYPE')
      try {
        await step7Indicator.waitFor({ state: 'visible', timeout: 10000 })
        console.log('✅ Confirmed we are on Step 7 page')
      } catch (error) {
        console.log('⚠️ Could not find Step 7 indicator, taking screenshot for debugging...')
        await this.takeErrorScreenshot(page, jobId)
        throw new Error('Not on Step 7 page - Passport Type dropdown not found')
      }
      
      // Validate step data
      const validation = this.validateStepData(formData)
      if (!validation.valid) {
        console.warn(`⚠️ Step ${this.stepNumber} data validation warnings:`, validation.errors)
      }

      console.log('📝 Starting Step 7 form filling (Passport/Visa Information)...')

      // Get Step 7 field mappings
      const step7Mappings = getStep7FieldMappings()
      console.log(`📋 Found ${step7Mappings.length} Step 7 field mappings`)

      // Fill each field
      for (const fieldMapping of step7Mappings) {
        try {
          console.log(`📝 Processing field: ${fieldMapping.fieldName}`)
          
          // Get field value from form data
          const fieldValue = formData[fieldMapping.fieldName]
          
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
            continue
          }
          
          console.log(`📝 Field value: ${fieldValue}`)
          
          // Fill the field based on its type
          const element = page.locator(fieldMapping.selector)
          await element.waitFor({ state: 'visible', timeout: 15000 })
          
          switch (fieldMapping.type) {
            case 'text':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled text field: ${fieldMapping.fieldName}`)
              break
              
            case 'select':
              let selectValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
              
              // Handle country dropdowns for Step 7
              if (fieldMapping.fieldName === 'passport_info.passport_issuing_country' || 
                  fieldMapping.fieldName === 'passport_info.passport_issued_country') {
                const countryCode = getCountryCode(selectValue)
                if (countryCode) {
                  selectValue = countryCode
                  console.log(`🔍 STEP7 - Country "${fieldValue}" mapped to CEAC code: "${selectValue}"`)
                } else {
                  console.log(`⚠️ STEP7 - No country code found for: ${selectValue}`)
                }
              }
              
              await element.selectOption({ value: selectValue })
              console.log(`✅ Selected dropdown: ${fieldMapping.fieldName} = ${selectValue}`)
              
              // Wait for postback if this is a dropdown that triggers conditional fields
              if (fieldMapping.conditional) {
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after dropdown selection')
              }
              break
              
            case 'textarea':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled textarea: ${fieldMapping.fieldName}`)
              break
              
            case 'date_split':
              // Handle split date fields
              if (fieldMapping.dateSelectors) {
                const date = new Date(fieldValue.toString())
                const day = date.getDate().toString().padStart(2, '0')
                const month = (date.getMonth() + 1).toString().padStart(2, '0') // Use numeric month (01-12)
                const year = date.getFullYear().toString()
                
                console.log(`📝 Splitting date ${fieldValue} into: day=${day}, month=${month}, year=${year}`)
                
                // Fill day dropdown
                const dayElement = page.locator(fieldMapping.dateSelectors.day)
                await dayElement.waitFor({ state: 'visible', timeout: 15000 })
                await dayElement.selectOption({ value: day })
                console.log(`✅ Filled day: ${day}`)
                
                // Small delay between date components
                await page.waitForTimeout(500)
                
                // Fill month dropdown
                const monthElement = page.locator(fieldMapping.dateSelectors.month)
                await monthElement.waitFor({ state: 'visible', timeout: 15000 })
                
                // Get available options for debugging
                const monthOptions = await monthElement.locator('option').all()
                const availableMonths = await Promise.all(monthOptions.map(async (opt) => {
                  const value = await opt.getAttribute('value')
                  const text = await opt.textContent()
                  return { value, text }
                }))
                console.log(`📝 Available month options:`, availableMonths)
                
                await monthElement.selectOption({ value: month })
                console.log(`✅ Filled month: ${month}`)
                
                // Small delay between date components
                await page.waitForTimeout(500)
                
                // Fill year input
                const yearElement = page.locator(fieldMapping.dateSelectors.year)
                await yearElement.waitFor({ state: 'visible', timeout: 15000 })
                await yearElement.fill(year)
                console.log(`✅ Filled year: ${year}`)
              }
              break
              
            case 'radio':
              // For radio buttons, we need to find the correct option
              let radioValue = fieldValue.toString()
              if (fieldMapping.valueMapping && fieldMapping.valueMapping[radioValue]) {
                radioValue = fieldMapping.valueMapping[radioValue]
              }
              
              console.log(`📝 Looking for radio option with value: ${radioValue}`)
              
              const radioOptions = page.locator(`${fieldMapping.selector} input[type="radio"]`)
              const optionCount = await radioOptions.count()
              console.log(`📝 Found ${optionCount} radio options`)
              
              // If no radio options found, try alternative selectors
              if (optionCount === 0) {
                console.log('⚠️ No radio options found with standard selector, trying alternative...')
                const alternativeOptions = page.locator('input[type="radio"]')
                const altCount = await alternativeOptions.count()
                console.log(`📝 Found ${altCount} radio options with alternative selector`)
                
                // Log all radio buttons on the page for debugging
                for (let i = 0; i < Math.min(altCount, 10); i++) {
                  const option = alternativeOptions.nth(i)
                  const optionValue = await option.getAttribute('value')
                  const optionId = await option.getAttribute('id')
                  const optionName = await option.getAttribute('name')
                  console.log(`📝 Radio option ${i + 1}: value="${optionValue}", id="${optionId}", name="${optionName}"`)
                }
              }
              
              let found = false
              for (let i = 0; i < optionCount; i++) {
                const option = radioOptions.nth(i)
                const optionValue = await option.getAttribute('value')
                console.log(`📝 Radio option ${i + 1} has value: ${optionValue}`)
                
                if (optionValue === radioValue) {
                  await option.check()
                  console.log(`✅ Selected radio option: ${radioValue}`)
                  found = true
                  break
                }
              }
              
              if (!found) {
                console.warn(`⚠️ Could not find radio option with value: ${radioValue}`)
                // Try to find by label text as fallback
                const radioLabels = page.locator(`${fieldMapping.selector} label`)
                const labelCount = await radioLabels.count()
                console.log(`📝 Found ${labelCount} radio labels`)
                
                for (let i = 0; i < labelCount; i++) {
                  const label = radioLabels.nth(i)
                  const labelText = await label.textContent()
                  console.log(`📝 Radio label ${i + 1}: "${labelText}"`)
                  
                  if (labelText && (labelText.trim().toLowerCase() === fieldValue.toString().toLowerCase() || 
                      labelText.trim().toLowerCase() === radioValue.toLowerCase())) {
                    const radioInput = label.locator('input[type="radio"]')
                    await radioInput.check()
                    console.log(`✅ Selected radio option by label: ${labelText}`)
                    found = true
                    break
                  }
                }
              }
              
              if (!found) {
                throw new Error(`Could not find radio option for value: ${radioValue}`)
              }
              
              // Wait for postback if this is a radio button that triggers conditional fields
              if (fieldMapping.conditional) {
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after radio button selection')
              }
              break
              
            case 'checkbox':
              if (fieldValue === true || fieldValue === 'Yes') {
                await element.check()
                console.log(`✅ Checked checkbox: ${fieldMapping.fieldName}`)
              } else {
                await element.uncheck()
                console.log(`✅ Unchecked checkbox: ${fieldMapping.fieldName}`)
              }
              break
              
            default:
              console.log(`⚠️ Unknown field type: ${fieldMapping.type} for field: ${fieldMapping.fieldName}`)
              break
          }
          
          // Handle conditional fields if this field has them
          if (fieldMapping.conditional) {
            console.log(`📝 Field has conditional logic, checking if conditions are met...`)
            await this.handleStep7ConditionalFields(page, jobId, formData, fieldMapping)
          }
          
          console.log(`✅ Successfully filled field: ${fieldMapping.fieldName}`)
          
        } catch (error) {
          console.error(`❌ Error filling field ${fieldMapping.fieldName}:`, error)
          throw error
        }
      }
      
      console.log('✅ Step 7 form filling completed successfully')
      
      // Update final progress for this step
      await this.progressService.updateStepProgress(
        jobId,
        `form_step_${this.stepNumber}_completed` as any,
        'running',
        `Successfully filled Step ${this.stepNumber} fields`,
        40 + (this.stepNumber * 2) + 2
      )
      
      console.log(`✅ Step ${this.stepNumber} completed.`)
      
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
   * Handle conditional fields for Step 7
   */
  private async handleStep7ConditionalFields(page: Page, jobId: string, formData: DS160FormData, fieldMapping: any): Promise<void> {
    console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
    
    if (fieldMapping.fieldName === 'passport_info.passport_type') {
      const passportType = formData[fieldMapping.fieldName]
      console.log(`📝 Passport type selected: ${passportType}`)
      
      if (passportType === 'Other') {
        console.log('📝 "Other" passport type selected, waiting for explanation field...')
        
        // Wait for the conditional field to appear
        await page.waitForTimeout(3000)
        
        // Check if the conditional field is visible
        const explanationField = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_passportOther')
        if (await explanationField.isVisible({ timeout: 10000 })) {
          console.log('📝 Explanation field is visible, filling it...')
          
          const explanationValue = formData['passport_info.passport_other_explanation']
          if (explanationValue) {
            const textareaElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPptOtherExpl')
            await textareaElement.waitFor({ state: 'visible', timeout: 15000 })
            await textareaElement.fill(explanationValue.toString())
            console.log(`✅ Filled passport other explanation: ${explanationValue}`)
          }
        } else {
          console.log('⚠️ Explanation field not visible after waiting')
        }
      }
    }
    
    // Handle passport book number "Does Not Apply" checkbox logic
    if (fieldMapping.fieldName === 'passport_info.passport_book_number_na') {
      const bookNumberNA = formData[fieldMapping.fieldName]
      const bookNumber = formData['passport_info.passport_book_number']
      
      console.log(`📝 Passport book number NA checkbox: ${bookNumberNA}`)
      console.log(`📝 Passport book number value: ${bookNumber}`)
      
      if (bookNumberNA === true || bookNumber === 'N/A') {
        console.log('📝 Checking "Does Not Apply" checkbox for passport book number...')
        
        // Check the checkbox
        const checkboxElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_BOOK_NUM_NA')
        await checkboxElement.waitFor({ state: 'visible', timeout: 15000 })
        await checkboxElement.check()
        console.log('✅ Checked "Does Not Apply" checkbox for passport book number')
        
        // The checkbox should automatically disable the text field via JavaScript
        await page.waitForTimeout(1000)
      } else if (bookNumber && bookNumber !== 'N/A') {
        console.log('📝 Filling passport book number...')
        
        // Make sure checkbox is unchecked
        const checkboxElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_BOOK_NUM_NA')
        await checkboxElement.waitFor({ state: 'visible', timeout: 15000 })
        await checkboxElement.uncheck()
        console.log('✅ Unchecked "Does Not Apply" checkbox for passport book number')
        
        // Fill the book number field
        const bookNumberElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_BOOK_NUM')
        await bookNumberElement.waitFor({ state: 'visible', timeout: 15000 })
        await bookNumberElement.fill(bookNumber.toString())
        console.log(`✅ Filled passport book number: ${bookNumber}`)
      }
    }
    
    // Handle passport expiration "No Expiration" checkbox logic
    if (fieldMapping.fieldName === 'passport_info.passport_expiry_na') {
      const expiryNA = formData[fieldMapping.fieldName]
      const expiryDate = formData['passport_info.passport_expiry_date']
      
      console.log(`📝 Passport expiry NA checkbox: ${expiryNA}`)
      console.log(`📝 Passport expiry date value: ${expiryDate}`)
      
      if (expiryNA === true || expiryDate === 'N/A') {
        console.log('📝 Checking "No Expiration" checkbox for passport expiry...')
        
        // Check the checkbox
        const checkboxElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxPPT_EXPIRE_NA')
        await checkboxElement.waitFor({ state: 'visible', timeout: 15000 })
        await checkboxElement.check()
        console.log('✅ Checked "No Expiration" checkbox for passport expiry')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after "No Expiration" checkbox selection')
        
        // The checkbox should automatically disable the date fields via JavaScript
        await page.waitForTimeout(1000)
      } else if (expiryDate && expiryDate !== 'N/A') {
        console.log('📝 Filling passport expiry date...')
        
        // Make sure checkbox is unchecked
        const checkboxElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxPPT_EXPIRE_NA')
        await checkboxElement.waitFor({ state: 'visible', timeout: 15000 })
        await checkboxElement.uncheck()
        console.log('✅ Unchecked "No Expiration" checkbox for passport expiry')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after "No Expiration" checkbox deselection')
        
        // The date fields should now be enabled and can be filled normally
        await page.waitForTimeout(1000)
      }
    }
    
    // Handle lost/stolen passport conditional fields
    if (fieldMapping.fieldName === 'passport_info.passport_lost_stolen') {
      const lostStolen = formData[fieldMapping.fieldName]
      console.log(`📝 Lost/stolen passport selection: ${lostStolen}`)
      
      if (lostStolen === 'Yes') {
        console.log('📝 "Yes" selected for lost/stolen passport, waiting for conditional fields...')
        
        // Wait for conditional fields to appear
        await page.waitForTimeout(3000)
        
        // Check if the conditional fields are visible
        const lostPassportSection = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_tbxLOST_PPT_NUM')
        if (await lostPassportSection.isVisible({ timeout: 10000 })) {
          console.log('📝 Lost passport conditional fields are visible, filling them...')
          
          // Fill lost passport number
          const lostPassportNumber = formData['passport_info.lost_passport_number']
          if (lostPassportNumber) {
            const numberElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_tbxLOST_PPT_NUM')
            await numberElement.waitFor({ state: 'visible', timeout: 15000 })
            await numberElement.fill(lostPassportNumber.toString())
            console.log(`✅ Filled lost passport number: ${lostPassportNumber}`)
          }
          
          // Handle "Do Not Know" checkbox for lost passport number
          const lostNumberNA = formData['passport_info.lost_passport_number_na']
          if (lostNumberNA === true || lostPassportNumber === 'N/A') {
            console.log('📝 Checking "Do Not Know" checkbox for lost passport number...')
            const lostNumberNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_cbxLOST_PPT_NUM_UNKN_IND')
            await lostNumberNAElement.waitFor({ state: 'visible', timeout: 15000 })
            await lostNumberNAElement.check()
            console.log('✅ Checked "Do Not Know" checkbox for lost passport number')
          }
          
          // Fill lost passport country
          const lostPassportCountry = formData['passport_info.lost_passport_country']
          if (lostPassportCountry) {
            const countryCode = getCountryCode(lostPassportCountry)
            const selectValue = countryCode || lostPassportCountry
            
            const countryElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_ddlLOST_PPT_NATL')
            await countryElement.waitFor({ state: 'visible', timeout: 15000 })
            await countryElement.selectOption({ value: selectValue })
            console.log(`✅ Selected lost passport country: ${lostPassportCountry} (${selectValue})`)
          }
          
          // Fill explanation
          const explanation = formData['passport_info.lost_passport_explanation']
          if (explanation) {
            const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_tbxLOST_PPT_EXPL')
            await explanationElement.waitFor({ state: 'visible', timeout: 15000 })
            await explanationElement.fill(explanation.toString())
            console.log(`✅ Filled lost passport explanation: ${explanation}`)
          }
        } else {
          console.log('⚠️ Lost passport conditional fields not visible after waiting')
        }
      }
    }
    
    console.log(`✅ Completed conditional fields for: ${fieldMapping.fieldName}`)
  }
}
