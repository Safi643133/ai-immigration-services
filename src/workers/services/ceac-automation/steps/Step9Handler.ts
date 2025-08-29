import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { getStep9FieldMappings } from '@/lib/form-field-mappings'

export class Step9Handler extends BaseStepHandler {
  constructor() {
    super(9, 'Family Information', 'Filling family information')
  }

  protected getFieldMappings() {
    return getStep9FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!formData['family_info.father_in_us']?.trim()) {
      errors.push('Is your father in the U.S. is required')
    }
    if (!formData['family_info.mother_in_us']?.trim()) {
      errors.push('Is your mother in the U.S. is required')
    }
    if (!formData['family_info.immediate_relatives_us']?.trim()) {
      errors.push('Do you have any immediate relatives in the United States is required')
    }

    // Conditional validation for father status
    if (formData['family_info.father_in_us'] === 'Yes' && !formData['family_info.father_status']?.trim()) {
      errors.push('Father status is required when father is in the U.S.')
    }

    // Conditional validation for mother status
    if (formData['family_info.mother_in_us'] === 'Yes' && !formData['family_info.mother_status']?.trim()) {
      errors.push('Mother status is required when mother is in the U.S.')
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
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Override the handleStep method to use custom Step 9 logic
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
      console.log('🔍 Verifying we are on Step 9 page...')
      const step9Indicator = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxFATHER_SURNAME')
      try {
        await step9Indicator.waitFor({ state: 'visible', timeout: 10000 })
        console.log('✅ Confirmed we are on Step 9 page')
      } catch (error) {
        console.log('⚠️ Could not find Step 9 indicator, taking screenshot for debugging...')
        await this.takeErrorScreenshot(page, jobId)
        throw new Error('Not on Step 9 page - Family Information fields not found')
      }
      
      // Validate step data
      const validation = this.validateStepData(formData)
      if (!validation.valid) {
        console.warn(`⚠️ Step ${this.stepNumber} data validation warnings:`, validation.errors)
      }

      console.log('📝 Starting Step 9 form filling (Family Information)...')

      // Get Step 9 field mappings
      const step9Mappings = getStep9FieldMappings()
      console.log(`📋 Found ${step9Mappings.length} Step 9 field mappings`)

      // Fill each field
      for (const fieldMapping of step9Mappings) {
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
              
              await element.selectOption({ value: selectValue })
              console.log(`✅ Selected dropdown: ${fieldMapping.fieldName} = ${selectValue}`)
              
              // Wait for postback if this is a dropdown that triggers conditional fields
              if (fieldMapping.conditional) {
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after dropdown selection')
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
                
                // Wait for postback if this checkbox triggers conditional fields
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after checkbox selection')
              } else {
                await element.uncheck()
                console.log(`✅ Unchecked checkbox: ${fieldMapping.fieldName}`)
              }
              break
              
            case 'date_split':
              // Handle split date fields
              if (fieldMapping.dateSelectors) {
                const date = new Date(fieldValue.toString())
                const day = date.getDate().toString().padStart(2, '0')
                const monthIndex = date.getMonth()
                const year = date.getFullYear().toString()
                
                // Map month index to text abbreviations for Step 9 (JAN, FEB, etc.)
                const monthAbbreviations = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
                const month = monthAbbreviations[monthIndex]
                
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
              
            default:
              console.log(`⚠️ Unknown field type: ${fieldMapping.type} for field: ${fieldMapping.fieldName}`)
              break
          }
          
          // Handle conditional fields if this field has them
          if (fieldMapping.conditional) {
            console.log(`📝 Field has conditional logic, checking if conditions are met...`)
            await this.handleStep9ConditionalFields(page, jobId, formData, fieldMapping)
          }
          
          console.log(`✅ Successfully filled field: ${fieldMapping.fieldName}`)
          
        } catch (error) {
          console.error(`❌ Error filling field ${fieldMapping.fieldName}:`, error)
          throw error
        }
      }
      
      console.log('✅ Step 9 form filling completed successfully')
      
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
   * Handle conditional fields for Step 9
   */
  private async handleStep9ConditionalFields(page: Page, jobId: string, formData: DS160FormData, fieldMapping: any): Promise<void> {
    console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
    
    // Handle father "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.father_surnames_na') {
      const fatherSurnamesNA = formData[fieldMapping.fieldName]
      const fatherSurnames = formData['family_info.father_surnames']
      
      console.log(`📝 Father surnames NA checkbox: ${fatherSurnamesNA}`)
      console.log(`📝 Father surnames: ${fatherSurnames}`)
      
      if (fatherSurnamesNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for father surnames...')
        
        // Check the father surnames NA checkbox
        const fatherSurnamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_SURNAME_UNK_IND')
        await fatherSurnamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherSurnamesNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for father surnames')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father surnames NA checkbox selection')
        
        // The checkbox should automatically disable the surnames field via JavaScript
        await page.waitForTimeout(1000)
      } else if (fatherSurnames && fatherSurnames !== 'N/A') {
        console.log('📝 Filling father surnames...')
        
        // Make sure father surnames NA checkbox is unchecked
        const fatherSurnamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_SURNAME_UNK_IND')
        await fatherSurnamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherSurnamesNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for father surnames')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father surnames NA checkbox deselection')
        
        // Fill the surnames field
        const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxFATHER_SURNAME')
        await surnamesElement.waitFor({ state: 'visible', timeout: 15000 })
        await surnamesElement.fill(fatherSurnames.toString())
        console.log(`✅ Filled father surnames: ${fatherSurnames}`)
      }
    }
    
    // Handle father given names "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.father_given_names_na') {
      const fatherGivenNamesNA = formData[fieldMapping.fieldName]
      const fatherGivenNames = formData['family_info.father_given_names']
      
      console.log(`📝 Father given names NA checkbox: ${fatherGivenNamesNA}`)
      console.log(`📝 Father given names: ${fatherGivenNames}`)
      
      if (fatherGivenNamesNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for father given names...')
        
        // Check the father given names NA checkbox
        const fatherGivenNamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_GIVEN_NAME_UNK_IND')
        await fatherGivenNamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherGivenNamesNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for father given names')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father given names NA checkbox selection')
        
        // The checkbox should automatically disable the given names field via JavaScript
        await page.waitForTimeout(1000)
      } else if (fatherGivenNames && fatherGivenNames !== 'N/A') {
        console.log('📝 Filling father given names...')
        
        // Make sure father given names NA checkbox is unchecked
        const fatherGivenNamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_GIVEN_NAME_UNK_IND')
        await fatherGivenNamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherGivenNamesNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for father given names')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father given names NA checkbox deselection')
        
        // Fill the given names field
        const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxFATHER_GIVEN_NAME')
        await givenNamesElement.waitFor({ state: 'visible', timeout: 15000 })
        await givenNamesElement.fill(fatherGivenNames.toString())
        console.log(`✅ Filled father given names: ${fatherGivenNames}`)
      }
    }
    
    // Handle father date of birth "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.father_date_of_birth_na') {
      const fatherDobNA = formData[fieldMapping.fieldName]
      const fatherDob = formData['family_info.father_date_of_birth']
      
      console.log(`📝 Father DOB NA checkbox: ${fatherDobNA}`)
      console.log(`📝 Father DOB: ${fatherDob}`)
      
      if (fatherDobNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for father date of birth...')
        
        // Check the father DOB NA checkbox
        const fatherDobNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_DOB_UNK_IND')
        await fatherDobNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherDobNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for father date of birth')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father DOB NA checkbox selection')
        
        // The checkbox should automatically disable the date fields via JavaScript
        await page.waitForTimeout(1000)
      } else if (fatherDob && fatherDob !== 'N/A') {
        console.log('📝 Filling father date of birth...')
        
        // Make sure father DOB NA checkbox is unchecked
        const fatherDobNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_DOB_UNK_IND')
        await fatherDobNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherDobNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for father date of birth')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father DOB NA checkbox deselection')
        
        // The date fields will be filled by the main field processing
        await page.waitForTimeout(1000)
      }
    }
    
    // Handle mother "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.mother_surnames_na') {
      const motherSurnamesNA = formData[fieldMapping.fieldName]
      const motherSurnames = formData['family_info.mother_surnames']
      
      console.log(`📝 Mother surnames NA checkbox: ${motherSurnamesNA}`)
      console.log(`📝 Mother surnames: ${motherSurnames}`)
      
      if (motherSurnamesNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for mother surnames...')
        
        // Check the mother surnames NA checkbox
        const motherSurnamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_SURNAME_UNK_IND')
        await motherSurnamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherSurnamesNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for mother surnames')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother surnames NA checkbox selection')
        
        // The checkbox should automatically disable the surnames field via JavaScript
        await page.waitForTimeout(1000)
      } else if (motherSurnames && motherSurnames !== 'N/A') {
        console.log('📝 Filling mother surnames...')
        
        // Make sure mother surnames NA checkbox is unchecked
        const motherSurnamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_SURNAME_UNK_IND')
        await motherSurnamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherSurnamesNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for mother surnames')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother surnames NA checkbox deselection')
        
        // Fill the surnames field
        const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMOTHER_SURNAME')
        await surnamesElement.waitFor({ state: 'visible', timeout: 15000 })
        await surnamesElement.fill(motherSurnames.toString())
        console.log(`✅ Filled mother surnames: ${motherSurnames}`)
      }
    }
    
    // Handle mother given names "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.mother_given_names_na') {
      const motherGivenNamesNA = formData[fieldMapping.fieldName]
      const motherGivenNames = formData['family_info.mother_given_names']
      
      console.log(`📝 Mother given names NA checkbox: ${motherGivenNamesNA}`)
      console.log(`📝 Mother given names: ${motherGivenNames}`)
      
      if (motherGivenNamesNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for mother given names...')
        
        // Check the mother given names NA checkbox
        const motherGivenNamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_GIVEN_NAME_UNK_IND')
        await motherGivenNamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherGivenNamesNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for mother given names')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother given names NA checkbox selection')
        
        // The checkbox should automatically disable the given names field via JavaScript
        await page.waitForTimeout(1000)
      } else if (motherGivenNames && motherGivenNames !== 'N/A') {
        console.log('📝 Filling mother given names...')
        
        // Make sure mother given names NA checkbox is unchecked
        const motherGivenNamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_GIVEN_NAME_UNK_IND')
        await motherGivenNamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherGivenNamesNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for mother given names')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother given names NA checkbox deselection')
        
        // Fill the given names field
        const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMOTHER_GIVEN_NAME')
        await givenNamesElement.waitFor({ state: 'visible', timeout: 15000 })
        await givenNamesElement.fill(motherGivenNames.toString())
        console.log(`✅ Filled mother given names: ${motherGivenNames}`)
      }
    }
    
    // Handle mother date of birth "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.mother_date_of_birth_na') {
      const motherDobNA = formData[fieldMapping.fieldName]
      const motherDob = formData['family_info.mother_date_of_birth']
      
      console.log(`📝 Mother DOB NA checkbox: ${motherDobNA}`)
      console.log(`📝 Mother DOB: ${motherDob}`)
      
      if (motherDobNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for mother date of birth...')
        
        // Check the mother DOB NA checkbox
        const motherDobNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_DOB_UNK_IND')
        await motherDobNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherDobNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for mother date of birth')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother DOB NA checkbox selection')
        
        // The checkbox should automatically disable the date fields via JavaScript
        await page.waitForTimeout(1000)
      } else if (motherDob && motherDob !== 'N/A') {
        console.log('📝 Filling mother date of birth...')
        
        // Make sure mother DOB NA checkbox is unchecked
        const motherDobNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_DOB_UNK_IND')
        await motherDobNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherDobNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for mother date of birth')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother DOB NA checkbox deselection')
        
        // The date fields will be filled by the main field processing
        await page.waitForTimeout(1000)
      }
    }
    
    // Handle father in U.S. conditional fields
    if (fieldMapping.fieldName === 'family_info.father_in_us') {
      const fatherInUS = formData[fieldMapping.fieldName]
      const fatherStatus = formData['family_info.father_status']
      
      console.log(`📝 Father in US: ${fatherInUS}`)
      console.log(`📝 Father status: ${fatherStatus}`)
      
      // If father is in U.S., wait for and fill the status dropdown
      if (fatherInUS === 'Yes' || fatherInUS === 'Y') {
        console.log('📝 Father is in US, waiting for status dropdown to appear...')
        
        // Wait for the status dropdown to appear
        await page.waitForTimeout(2000)
        
        // Check if the father status dropdown is visible
        const fatherStatusDropdown = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ShowDivFatherStatus')
        const isFatherStatusVisible = await fatherStatusDropdown.isVisible({ timeout: 5000 })
        
        if (isFatherStatusVisible) {
          console.log('✅ Father status dropdown is visible')
          
          // Fill the father status dropdown if we have data
          if (fatherStatus) {
            console.log(`📝 Filling father status dropdown with: ${fatherStatus}`)
            
            const statusElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlFATHER_US_STATUS')
            await statusElement.waitFor({ state: 'visible', timeout: 10000 })
            
            // Map the status value
            const statusMapping: Record<string, string> = {
              'U.S. CITIZEN': 'S',
              'U.S. LEGAL PERMANENT RESIDENT (LPR)': 'C',
              'NONIMMIGRANT': 'P',
              "OTHER/I DON'T KNOW": 'O'
            }
            
            const statusValue = statusMapping[fatherStatus as string] || fatherStatus
            await statusElement.selectOption({ value: statusValue })
            console.log(`✅ Selected father status: ${statusValue}`)
          }
        } else {
          console.log('⚠️ Father status dropdown is not visible')
        }
      }
    }
    
    // Handle mother in U.S. conditional fields
    if (fieldMapping.fieldName === 'family_info.mother_in_us') {
      const motherInUS = formData[fieldMapping.fieldName]
      const motherStatus = formData['family_info.mother_status']
      
      console.log(`📝 Mother in US: ${motherInUS}`)
      console.log(`📝 Mother status: ${motherStatus}`)
      
      // If mother is in U.S., wait for and fill the status dropdown
      if (motherInUS === 'Yes' || motherInUS === 'Y') {
        console.log('📝 Mother is in US, waiting for status dropdown to appear...')
        
        // Wait for the status dropdown to appear
        await page.waitForTimeout(2000)
        
        // Check if the mother status dropdown is visible
        const motherStatusDropdown = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ShowDivMotherStatus')
        const isMotherStatusVisible = await motherStatusDropdown.isVisible({ timeout: 5000 })
        
        if (isMotherStatusVisible) {
          console.log('✅ Mother status dropdown is visible')
          
          // Fill the mother status dropdown if we have data
          if (motherStatus) {
            console.log(`📝 Filling mother status dropdown with: ${motherStatus}`)
            
            const statusElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlMOTHER_US_STATUS')
            await statusElement.waitFor({ state: 'visible', timeout: 10000 })
            
            // Map the status value
            const statusMapping: Record<string, string> = {
              'U.S. CITIZEN': 'S',
              'U.S. LEGAL PERMANENT RESIDENT (LPR)': 'C',
              'NONIMMIGRANT': 'P',
              "OTHER/I DON'T KNOW": 'O'
            }
            
            const statusValue = statusMapping[motherStatus as string] || motherStatus
            await statusElement.selectOption({ value: statusValue })
            console.log(`✅ Selected mother status: ${statusValue}`)
          }
        } else {
          console.log('⚠️ Mother status dropdown is not visible')
        }
      }
    }
    
    // Handle immediate relatives conditional fields
    if (fieldMapping.fieldName === 'family_info.immediate_relatives_us') {
      const immediateRelativesUS = formData[fieldMapping.fieldName]
      const otherRelativesUS = formData['family_info.other_relatives_us']
      const relativeSurnames = formData['family_info.relative_surnames']
      const relativeGivenNames = formData['family_info.relative_given_names']
      const relativeRelationship = formData['family_info.relative_relationship']
      const relativeStatus = formData['family_info.relative_status']
      
      console.log(`📝 Immediate relatives US: ${immediateRelativesUS}`)
      console.log(`📝 Other relatives US: ${otherRelativesUS}`)
      
      // If immediate relatives is "Yes", wait for and fill the relative details
      if (immediateRelativesUS === 'Yes' || immediateRelativesUS === 'Y') {
        console.log('📝 Immediate relatives is Yes, waiting for relative details form to appear...')
        
        // Wait for the relative details form to appear
        await page.waitForTimeout(2000)
        
        // Fill relative surnames if we have data
        if (relativeSurnames) {
          console.log(`📝 Filling relative surnames: ${relativeSurnames}`)
          const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlUSRelatives_ctl00_tbxUS_REL_SURNAME')
          await surnamesElement.waitFor({ state: 'visible', timeout: 10000 })
          await surnamesElement.fill(relativeSurnames.toString())
          console.log(`✅ Filled relative surnames: ${relativeSurnames}`)
        }
        
        // Fill relative given names if we have data
        if (relativeGivenNames) {
          console.log(`📝 Filling relative given names: ${relativeGivenNames}`)
          const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlUSRelatives_ctl00_tbxUS_REL_GIVEN_NAME')
          await givenNamesElement.waitFor({ state: 'visible', timeout: 10000 })
          await givenNamesElement.fill(relativeGivenNames.toString())
          console.log(`✅ Filled relative given names: ${relativeGivenNames}`)
        }
        
        // Fill relative relationship if we have data
        if (relativeRelationship) {
          console.log(`📝 Filling relative relationship: ${relativeRelationship}`)
          console.log(`📝 Relationship value type: ${typeof relativeRelationship}`)
          console.log(`📝 Relationship value length: ${relativeRelationship.length}`)
          console.log(`📝 Relationship value char codes: ${Array.from(relativeRelationship as string).map((c: string) => c.charCodeAt(0)).join(', ')}`)
          const relationshipElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlUSRelatives_ctl00_ddlUS_REL_TYPE')
          await relationshipElement.waitFor({ state: 'visible', timeout: 10000 })
          
          // Wait a bit more for options to be fully loaded
          await page.waitForTimeout(1000)
          
          // Debug: Check what options are available
          const options = relationshipElement.locator('option')
          const optionCount = await options.count()
          console.log(`📝 Found ${optionCount} relationship options`)
          
          for (let i = 0; i < optionCount; i++) {
            const option = options.nth(i)
            const optionValue = await option.getAttribute('value')
            const optionText = await option.textContent()
            console.log(`📝 Option ${i + 1}: value="${optionValue}", text="${optionText}"`)
          }
          
          // Map the relationship value
          const relationshipMapping: Record<string, string> = {
            'SPOUSE': 'S',
            'FIANCÉ/FIANCÉE': 'F',
            'FIANCÈ/FIANCÈE': 'F', // Handle both É and È versions
            'CHILD': 'C',
            'SIBLING': 'B'
          }
          
          const relationshipValue = relationshipMapping[relativeRelationship as string]
          if (!relationshipValue) {
            console.error(`❌ No mapping found for relationship: ${relativeRelationship}`)
            console.log(`📝 Available mappings:`, relationshipMapping)
            throw new Error(`No mapping found for relationship: ${relativeRelationship}`)
          }
          console.log(`📝 Trying to select relationship value: ${relationshipValue}`)
          
          try {
            await relationshipElement.selectOption({ value: relationshipValue })
            console.log(`✅ Selected relative relationship: ${relationshipValue}`)
          } catch (error) {
            console.error(`❌ Failed to select relationship value ${relationshipValue}:`, error)
            
            // Try alternative approach - select by text
            try {
              const textToSelect = relativeRelationship as string
              console.log(`📝 Trying to select by text: ${textToSelect}`)
              await relationshipElement.selectOption({ label: textToSelect })
              console.log(`✅ Selected relative relationship by text: ${textToSelect}`)
            } catch (textError) {
              console.error(`❌ Failed to select by text ${relativeRelationship}:`, textError)
              throw textError
            }
          }
        }
        
        // Fill relative status if we have data
        if (relativeStatus) {
          console.log(`📝 Filling relative status: ${relativeStatus}`)
          const statusElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlUSRelatives_ctl00_ddlUS_REL_STATUS')
          await statusElement.waitFor({ state: 'visible', timeout: 10000 })
          
          // Wait a bit more for options to be fully loaded
          await page.waitForTimeout(1000)
          
          // Debug: Check what options are available
          const options = statusElement.locator('option')
          const optionCount = await options.count()
          console.log(`📝 Found ${optionCount} status options`)
          
          for (let i = 0; i < optionCount; i++) {
            const option = options.nth(i)
            const optionValue = await option.getAttribute('value')
            const optionText = await option.textContent()
            console.log(`📝 Option ${i + 1}: value="${optionValue}", text="${optionText}"`)
          }
          
          // Map the status value
          const statusMapping: Record<string, string> = {
            'U.S. CITIZEN': 'S',
            'U.S. LEGAL PERMANENT RESIDENT (LPR)': 'C',
            'NONIMMIGRANT': 'P',
            "OTHER/I DON'T KNOW": 'O'
          }
          
          const statusValue = statusMapping[relativeStatus as string]
          if (!statusValue) {
            console.error(`❌ No mapping found for status: ${relativeStatus}`)
            console.log(`📝 Available mappings:`, statusMapping)
            throw new Error(`No mapping found for status: ${relativeStatus}`)
          }
          console.log(`📝 Trying to select status value: ${statusValue}`)
          
          try {
            await statusElement.selectOption({ value: statusValue })
            console.log(`✅ Selected relative status: ${statusValue}`)
          } catch (error) {
            console.error(`❌ Failed to select status value ${statusValue}:`, error)
            
            // Try alternative approach - select by text
            try {
              const textToSelect = relativeStatus as string
              console.log(`📝 Trying to select by text: ${textToSelect}`)
              await statusElement.selectOption({ label: textToSelect })
              console.log(`✅ Selected relative status by text: ${textToSelect}`)
            } catch (textError) {
              console.error(`❌ Failed to select by text ${relativeStatus}:`, textError)
              throw textError
            }
          }
        }
      }
      
      // If immediate relatives is "No", we need to handle the "other relatives" question
      if (immediateRelativesUS === 'No' || immediateRelativesUS === 'N') {
        console.log('📝 Immediate relatives is No, checking for other relatives question...')
        
        // Wait for the "other relatives" question to appear
        await page.waitForTimeout(2000)
        
        // Check if the other relatives question is visible
        const otherRelativesQuestion = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ShowDivOtherRelatives')
        const isOtherRelativesVisible = await otherRelativesQuestion.isVisible({ timeout: 5000 })
        
        if (isOtherRelativesVisible) {
          console.log('✅ Other relatives question is visible')
          
          // Fill the other relatives question if we have data
          if (otherRelativesUS) {
            console.log(`📝 Filling other relatives question with: ${otherRelativesUS}`)
            
            const otherRelativesRadio = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblUS_OTHER_RELATIVE_IND')
            const radioOptions = otherRelativesRadio.locator('input[type="radio"]')
            const optionCount = await radioOptions.count()
            
            let found = false
            for (let i = 0; i < optionCount; i++) {
              const option = radioOptions.nth(i)
              const optionValue = await option.getAttribute('value')
              console.log(`📝 Other relatives radio option ${i + 1} has value: ${optionValue}`)
              
              if (optionValue === (otherRelativesUS === 'Yes' ? 'Y' : 'N')) {
                await option.check()
                console.log(`✅ Selected other relatives option: ${optionValue}`)
                found = true
                break
              }
            }
            
            if (!found) {
              console.warn(`⚠️ Could not find other relatives radio option for value: ${otherRelativesUS}`)
            }
          }
        } else {
          console.log('⚠️ Other relatives question is not visible')
        }
      }
    }
    
    console.log(`✅ Completed conditional fields for: ${fieldMapping.fieldName}`)
  }
}
