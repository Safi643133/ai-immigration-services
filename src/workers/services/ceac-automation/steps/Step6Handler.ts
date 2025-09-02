import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { getStep6FieldMappings } from '@/lib/form-field-mappings'

export class Step6Handler extends BaseStepHandler {
  constructor() {
    super(6, 'Contact Information', 'Filling contact information')
  }

  protected getFieldMappings() {
    return getStep6FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required home address fields
    if (!formData['contact_info.home_address_line1']?.trim()) {
      errors.push('Home address line 1 is required')
    }
    if (!formData['contact_info.home_city']?.trim()) {
      errors.push('Home city is required')
    }
    if (!formData['contact_info.home_country']?.trim()) {
      errors.push('Home country is required')
    }

    // Required phone and email
    if (!formData['contact_info.primary_phone']?.trim()) {
      errors.push('Primary phone number is required')
    }
    if (!formData['contact_info.email_address']?.trim()) {
      errors.push('Email address is required')
    }

    // Mailing address validation
    if (formData['contact_info.mailing_same_as_home'] === 'No') {
      if (!formData['contact_info.mailing_address_line1']?.trim()) {
        errors.push('Mailing address line 1 is required when mailing address is different from home address')
      }
      if (!formData['contact_info.mailing_city']?.trim()) {
        errors.push('Mailing city is required when mailing address is different from home address')
      }
      if (!formData['contact_info.mailing_country']?.trim()) {
        errors.push('Mailing country is required when mailing address is different from home address')
      }
    }

    // Additional phone validation
    if (formData['contact_info.other_phone_numbers'] === 'Yes') {
      if (!formData['contact_info.additional_phone']?.trim()) {
        errors.push('Additional phone number is required when other phone numbers is Yes')
      }
    }

    // Additional email validation
    if (formData['contact_info.other_email_addresses'] === 'Yes') {
      if (!formData['contact_info.additional_email']?.trim()) {
        errors.push('Additional email address is required when other email addresses is Yes')
      }
    }

    // Social media validation
    if (formData['contact_info.social_media_platform'] && 
        formData['contact_info.social_media_platform'] !== 'NONE' && 
        !formData['contact_info.social_media_identifier']?.trim()) {
      errors.push('Social media identifier is required when a platform is selected')
    }

    // Additional social media validation
    if (formData['contact_info.other_websites'] === 'Yes') {
      if (!formData['contact_info.additional_social_platform']?.trim()) {
        errors.push('Additional social media platform is required when other websites is Yes')
      }
      if (!formData['contact_info.additional_social_handle']?.trim()) {
        errors.push('Additional social media handle is required when other websites is Yes')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Override the handleStep method to use custom Step 6 logic
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

      console.log('📝 Starting DS-160 Step 6 form filling...')

      // Get Step 6 field mappings
      const step6Fields = getStep6FieldMappings()
      console.log(`📝 Found ${step6Fields.length} Step 6 fields to fill`)

      // Check if social media section exists before processing
      const hasSocialMediaSection = await this.checkSocialMediaSectionExists(page)
      if (!hasSocialMediaSection) {
        console.log('⏭️ Social media section not found, will skip social media fields')
      }

      // Fill main fields first
      for (const fieldMapping of step6Fields) {
        try {
          const fieldValue = formData[fieldMapping.fieldName]

          // Skip social media fields if section doesn't exist
          if (!hasSocialMediaSection && (
            fieldMapping.fieldName === 'contact_info.social_media_platform' ||
            fieldMapping.fieldName === 'contact_info.social_media_identifier' ||
            fieldMapping.fieldName === 'contact_info.other_websites' ||
            fieldMapping.fieldName === 'contact_info.additional_social_platform' ||
            fieldMapping.fieldName === 'contact_info.additional_social_handle'
          )) {
            console.log(`⏭️ Skipping social media field ${fieldMapping.fieldName} - section not present on page`)
            continue
          }

          // Special handling for additional phone/email questions - only set default if field is completely missing
          if ((fieldMapping.fieldName === 'contact_info.other_phone_numbers' || 
               fieldMapping.fieldName === 'contact_info.other_email_addresses') && 
              !(fieldMapping.fieldName in formData)) {
            console.log(`📝 Field ${fieldMapping.fieldName} not found in form data, setting default value "No"`)
            const defaultValue = 'No'
            console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${defaultValue}`)
            
            // Handle as radio button with default "No" value
            const radioValue = 'N'
            console.log(`🔍 STEP6 - Radio value: ${radioValue}`)
            
            const baseId = fieldMapping.selector.replace('#', '')
            const radioButtonId = `${baseId}_1`
            console.log(`🔍 STEP6 - Radio button ID: ${radioButtonId}`)
            
            const radioElement = page.locator(`#${radioButtonId}`)
            await radioElement.waitFor({ state: 'visible', timeout: 15000 })
            await radioElement.click()
            console.log(`✅ Selected radio button: ${fieldMapping.fieldName} = ${radioValue}`)
            
            continue
          }

          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
            continue
          }

          console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)

          const element = page.locator(fieldMapping.selector)
          await element.waitFor({ state: 'visible', timeout: 15000 })

          switch (fieldMapping.type) {
            case 'radio':
              // Handle radio button selection
              const radioValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
              console.log(`🔍 STEP6 - Radio value: ${radioValue}`)
              
              // Extract the base ID from the field mapping selector and construct the radio button ID
              const baseId = fieldMapping.selector.replace('#', '')
              const radioButtonId = `${baseId}_${radioValue === 'Y' ? '0' : '1'}`
              console.log(`🔍 STEP6 - Radio button ID: ${radioButtonId}`)
              
              const radioElement = page.locator(`#${radioButtonId}`)
              await radioElement.waitFor({ state: 'visible', timeout: 15000 })
              await radioElement.click()
              console.log(`✅ Selected radio button: ${fieldMapping.fieldName} = ${radioValue}`)
              
              // Wait for postback (both Yes and No can trigger conditional fields)
              if (radioValue === 'N' || radioValue === 'Y') {
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after radio selection')
              }
              
              // Handle conditional fields immediately after radio selection
              if (fieldMapping.conditional) {
                console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
                await this.handleStep6ConditionalFields(page, jobId, formData, fieldMapping)
              }
              break
              
            case 'text':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled text field: ${fieldMapping.fieldName}`)
              break
              
            case 'select':
              const selectValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
              await element.selectOption({ value: selectValue })
              console.log(`✅ Selected dropdown: ${fieldMapping.fieldName} = ${selectValue}`)
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
              console.warn(`⚠️ Unknown field type: ${fieldMapping.type} for ${fieldMapping.fieldName}`)
          }

          // Small delay between fields
          await page.waitForTimeout(500)

        } catch (error) {
          console.warn(`⚠️ STEP6 - Failed to fill field ${fieldMapping.fieldName}:`, error)
          
          // Special handling for country dropdown failures
          if (fieldMapping.fieldName === 'contact_info.home_country' || fieldMapping.fieldName === 'contact_info.mailing_country') {
            console.log(`🔄 Retrying country selection for ${fieldMapping.fieldName} with different approach...`)
            try {
              const element = page.locator(fieldMapping.selector)
              await element.waitFor({ state: 'visible', timeout: 15000 })
              
              // Get the field value again for retry
              const retryFieldValue = formData[fieldMapping.fieldName]
              if (retryFieldValue) {
                // Try selecting by label instead of value
                await element.selectOption({ label: retryFieldValue.toString() })
                console.log(`✅ Successfully selected country by label: ${fieldMapping.fieldName} = ${retryFieldValue}`)
              }
            } catch (retryError) {
              console.error(`❌ Failed to retry country selection: ${fieldMapping.fieldName}`, retryError)
            }
          }
        }
      }

      console.log('✅ DS-160 Step 6 form filling completed.')
      
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
   * Handle conditional fields for Step 6
   */
  private async handleStep6ConditionalFields(page: Page, jobId: string, formData: DS160FormData, fieldMapping: any): Promise<void> {
    console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
    
    // Wait for conditional fields to appear
    await page.waitForTimeout(3000)
    
    if (fieldMapping.fieldName === 'contact_info.mailing_same_as_home') {
      console.log('📝 Handling mailing address conditional fields...')
      await this.fillMailingAddressFields(page, jobId, formData)
    } else if (fieldMapping.fieldName === 'contact_info.other_phone_numbers') {
      console.log('📝 Handling additional phone numbers conditional fields...')
      await this.fillAdditionalPhoneNumberField(page, jobId, formData)
            } else if (fieldMapping.fieldName === 'contact_info.other_email_addresses') {
          console.log('📝 Handling additional email addresses conditional fields...')
          await this.fillAdditionalEmailAddressField(page, jobId, formData)
        } else if (fieldMapping.fieldName === 'contact_info.social_media_platform') {
          console.log('📝 Handling social media platform selection...')
          await this.handleSocialMediaPlatformSelection(page, jobId, formData)
        } else if (fieldMapping.fieldName === 'contact_info.other_websites') {
          console.log('📝 Handling additional social media conditional fields...')
          // Check if additional social media section exists before handling
          const hasAdditionalSocialSection = await this.checkAdditionalSocialSectionExists(page)
          if (hasAdditionalSocialSection) {
            await this.handleAdditionalSocialMediaFields(page, jobId, formData)
          } else {
            console.log('⏭️ Additional social media section not found, skipping...')
          }
        }
    
    console.log(`✅ Completed conditional fields for: ${fieldMapping.fieldName}`)
  }

  /**
   * Fill mailing address fields
   */
  private async fillMailingAddressFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling mailing address fields...')
    
    // Wait for mailing address fields to appear
    await page.waitForTimeout(3000)
    
    // Fill mailing address line 1
    const mailingAddressLine1 = formData['contact_info.mailing_address_line1']
    if (mailingAddressLine1) {
      console.log(`📝 Filling mailing address line 1: ${mailingAddressLine1}`)
      const addressElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_LN1')
      await addressElement.waitFor({ state: 'visible', timeout: 15000 })
      await addressElement.fill(mailingAddressLine1.toString())
      console.log(`✅ Filled mailing address line 1: ${mailingAddressLine1}`)
    }
    
    // Fill mailing address line 2
    const mailingAddressLine2 = formData['contact_info.mailing_address_line2']
    if (mailingAddressLine2) {
      console.log(`📝 Filling mailing address line 2: ${mailingAddressLine2}`)
      const addressElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_LN2')
      await addressElement.waitFor({ state: 'visible', timeout: 15000 })
      await addressElement.fill(mailingAddressLine2.toString())
      console.log(`✅ Filled mailing address line 2: ${mailingAddressLine2}`)
    }
    
    // Fill mailing city
    const mailingCity = formData['contact_info.mailing_city']
    if (mailingCity) {
      console.log(`📝 Filling mailing city: ${mailingCity}`)
      const cityElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_CITY')
      await cityElement.waitFor({ state: 'visible', timeout: 15000 })
      await cityElement.fill(mailingCity.toString())
      console.log(`✅ Filled mailing city: ${mailingCity}`)
    }
    
    // Handle mailing state/province
    const mailingState = formData['contact_info.mailing_state']
    const mailingStateNA = formData['contact_info.mailing_state_na']
    if (mailingStateNA === true || mailingState === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for mailing state')
      const stateNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexMAILING_ADDR_STATE_NA')
      await stateNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for mailing state')
    } else if (mailingState) {
      console.log(`📝 Filling mailing state: ${mailingState}`)
      const stateElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_STATE')
      await stateElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateElement.fill(mailingState.toString())
      console.log(`✅ Filled mailing state: ${mailingState}`)
    }
    
    // Handle mailing postal code
    const mailingPostalCode = formData['contact_info.mailing_postal_code']
    const mailingPostalNA = formData['contact_info.mailing_postal_na']
    if (mailingPostalNA === true || mailingPostalCode === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for mailing postal code')
      const postalNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexMAILING_ADDR_POSTAL_CD_NA')
      await postalNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await postalNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for mailing postal code')
    } else if (mailingPostalCode) {
      console.log(`📝 Filling mailing postal code: ${mailingPostalCode}`)
      const postalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_POSTAL_CD')
      await postalElement.waitFor({ state: 'visible', timeout: 15000 })
      await postalElement.fill(mailingPostalCode.toString())
      console.log(`✅ Filled mailing postal code: ${mailingPostalCode}`)
    }
    
    // Fill mailing country
    const mailingCountry = formData['contact_info.mailing_country']
    if (mailingCountry) {
      console.log(`📝 Filling mailing country: ${mailingCountry}`)
      const countryElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlMailCountry')
      await countryElement.waitFor({ state: 'visible', timeout: 15000 })
      
      try {
        await countryElement.selectOption({ value: mailingCountry.toString() })
        console.log(`✅ Filled mailing country: ${mailingCountry}`)
      } catch (error) {
        console.log(`🔄 Retrying mailing country selection by label...`)
        try {
          await countryElement.selectOption({ label: mailingCountry.toString() })
          console.log(`✅ Successfully selected mailing country by label: ${mailingCountry}`)
        } catch (retryError) {
          console.error(`❌ Failed to select mailing country: ${mailingCountry}`, retryError)
        }
      }
    }
    
    console.log('✅ Completed filling mailing address fields')
  }

  /**
   * Fill additional phone number field
   */
  private async fillAdditionalPhoneNumberField(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling additional phone number field...')
    
    // Wait for additional phone number field to appear
    await page.waitForTimeout(3000)
    
    const additionalPhoneNumber = formData['contact_info.additional_phone']
    if (additionalPhoneNumber) {
      console.log(`📝 Filling additional phone number: ${additionalPhoneNumber}`)
      const phoneElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlAddPhone_ctl00_tbxAddPhoneInfo')
      await phoneElement.waitFor({ state: 'visible', timeout: 15000 })
      await phoneElement.fill(additionalPhoneNumber.toString())
      console.log(`✅ Filled additional phone number: ${additionalPhoneNumber}`)
    } else {
      console.log('⏭️ No additional phone number provided, skipping field')
    }
    
    console.log('✅ Completed filling additional phone number field')
  }

  /**
   * Fill additional email address field
   */
  private async fillAdditionalEmailAddressField(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling additional email address field...')
    
    // Wait for additional email address field to appear
    await page.waitForTimeout(3000)
    
    const additionalEmailAddress = formData['contact_info.additional_email']
    if (additionalEmailAddress) {
      console.log(`📝 Filling additional email address: ${additionalEmailAddress}`)
      const emailElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlAddEmail_ctl00_tbxAddEmailInfo')
      await emailElement.waitFor({ state: 'visible', timeout: 15000 })
      await emailElement.fill(additionalEmailAddress.toString())
      console.log(`✅ Filled additional email address: ${additionalEmailAddress}`)
    } else {
      console.log('⏭️ No additional email address provided, skipping field')
    }
    
    console.log('✅ Completed filling additional email address field')
  }

  /**
   * Handle social media platform selection and identifier
   */
  private async handleSocialMediaPlatformSelection(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Checking if social media section exists...')
    
    // Check if social media section exists on the page
    const socialMediaSection = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlSocial_ctl00_ddlSocialMedia')
    const isSectionVisible = await socialMediaSection.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (!isSectionVisible) {
      console.log('⏭️ Social media section not found on this page, skipping...')
      return
    }
    
    console.log('✅ Social media section found, proceeding with platform selection...')
    
    // Wait for social media fields to be fully loaded
    await page.waitForTimeout(2000)
    
    const platform = formData['contact_info.social_media_platform']
    if (platform && platform !== 'NONE') {
      // Fill social media identifier
      const identifier = formData['contact_info.social_media_identifier']
      if (identifier) {
        console.log(`📝 Filling social media identifier: ${identifier}`)
        const identifierElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlSocial_ctl00_tbxSocialMediaIdent')
        await identifierElement.waitFor({ state: 'visible', timeout: 15000 })
        await identifierElement.fill(identifier.toString())
        console.log(`✅ Filled social media identifier: ${identifier}`)
      } else {
        console.log('⚠️ Social media platform selected but no identifier provided')
      }
    } else {
      console.log('📝 No social media platform selected or NONE selected, skipping identifier')
    }
    
    console.log('✅ Completed social media platform selection handling')
  }

  /**
   * Handle additional social media fields
   */
  private async handleAdditionalSocialMediaFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling additional social media fields...')
    
    // Wait for additional social media fields to appear
    await page.waitForTimeout(3000)
    
    const additionalPlatform = formData['contact_info.additional_social_platform']
    if (additionalPlatform) {
      console.log(`📝 Filling additional social media platform: ${additionalPlatform}`)
      const platformElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlAddSocial_ctl00_tbxAddSocialPlat')
      await platformElement.waitFor({ state: 'visible', timeout: 15000 })
      await platformElement.fill(additionalPlatform.toString())
      console.log(`✅ Filled additional social media platform: ${additionalPlatform}`)
    }
    
    const additionalHandle = formData['contact_info.additional_social_handle']
    if (additionalHandle) {
      console.log(`📝 Filling additional social media handle: ${additionalHandle}`)
      const handleElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlAddSocial_ctl00_tbxAddSocialHand')
      await handleElement.waitFor({ state: 'visible', timeout: 15000 })
      await handleElement.fill(additionalHandle.toString())
      console.log(`✅ Filled additional social media handle: ${additionalHandle}`)
    }
    
    console.log('✅ Completed additional social media fields handling')
  }

  /**
   * Check if social media section exists on the current page
   */
  private async checkSocialMediaSectionExists(page: Page): Promise<boolean> {
    try {
      const socialMediaSection = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlSocial_ctl00_ddlSocialMedia')
      const isVisible = await socialMediaSection.isVisible({ timeout: 3000 }).catch(() => false)
      return isVisible
    } catch (error) {
      console.log('⚠️ Error checking social media section existence:', error)
      return false
    }
  }

  /**
   * Check if additional social media section exists on the current page
   */
  private async checkAdditionalSocialSectionExists(page: Page): Promise<boolean> {
    try {
      const additionalSocialSection = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_upnlAdditionalSocial')
      const isVisible = await additionalSocialSection.isVisible({ timeout: 3000 }).catch(() => false)
      return isVisible
    } catch (error) {
      console.log('⚠️ Error checking additional social media section existence:', error)
      return false
    }
  }
}
