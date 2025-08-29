import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { getStep8FieldMappings } from '@/lib/form-field-mappings'

export class Step8Handler extends BaseStepHandler {
  constructor() {
    super(8, 'U.S. Contact Information', 'Filling U.S. contact information')
  }

  protected getFieldMappings() {
    return getStep8FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Contact Person and Organization - either contact person or organization must be provided
    const contactPersonNA = formData['us_contact.contact_person_na'] === true
    const organizationNA = formData['us_contact.contact_organization_na'] === true

    if (!contactPersonNA && !organizationNA) {
      // If neither is marked as "Do Not Know", validate the fields
      if (!formData['us_contact.contact_surnames']?.trim()) {
        errors.push('Contact person surnames is required (or mark "Do Not Know")')
      }
      if (!formData['us_contact.contact_given_names']?.trim()) {
        errors.push('Contact person given names is required (or mark "Do Not Know")')
      }
      if (!formData['us_contact.contact_organization']?.trim()) {
        errors.push('Organization name is required (or mark "Do Not Know")')
      }
    } else if (contactPersonNA && organizationNA) {
      // Both cannot be marked as "Do Not Know"
      errors.push('You cannot mark both contact person and organization as "Do Not Know"')
    }

    // Required fields
    if (!formData['us_contact.contact_relationship']?.trim()) {
      errors.push('Relationship to you is required')
    }
    if (!formData['us_contact.contact_address_line1']?.trim()) {
      errors.push('U.S. street address line 1 is required')
    }
    if (!formData['us_contact.contact_city']?.trim()) {
      errors.push('City is required')
    }
    if (!formData['us_contact.contact_state']?.trim()) {
      errors.push('State is required')
    }
    if (!formData['us_contact.contact_phone']?.trim()) {
      errors.push('Phone number is required')
    }

    // Email validation - either filled or marked as NA
    const emailNA = formData['us_contact.contact_email_na'] === true || formData['us_contact.contact_email'] === 'N/A'
    if (!emailNA && !formData['us_contact.contact_email']?.trim()) {
      errors.push('Email address is required (or mark as "Does Not Apply")')
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Override the handleStep method to use custom Step 8 logic
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
      console.log('🔍 Verifying we are on Step 8 page...')
      const step8Indicator = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_SURNAME')
      try {
        await step8Indicator.waitFor({ state: 'visible', timeout: 10000 })
        console.log('✅ Confirmed we are on Step 8 page')
      } catch (error) {
        console.log('⚠️ Could not find Step 8 indicator, taking screenshot for debugging...')
        await this.takeErrorScreenshot(page, jobId)
        throw new Error('Not on Step 8 page - U.S. Contact Information fields not found')
      }
      
      // Validate step data
      const validation = this.validateStepData(formData)
      if (!validation.valid) {
        console.warn(`⚠️ Step ${this.stepNumber} data validation warnings:`, validation.errors)
      }

      console.log('📝 Starting Step 8 form filling (U.S. Contact Information)...')

      // Get Step 8 field mappings
      const step8Mappings = getStep8FieldMappings()
      console.log(`📋 Found ${step8Mappings.length} Step 8 field mappings`)

      // Fill each field
      for (const fieldMapping of step8Mappings) {
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
              
              // Special handling for relationship dropdown - wait for address fields to appear
              if (fieldMapping.fieldName === 'us_contact.contact_relationship') {
                console.log('📝 Relationship selected, waiting for address fields to appear...')
                await page.waitForTimeout(3000) // Wait 3 seconds for address fields to load
                console.log('✅ Waited for address fields to appear')
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
              
            default:
              console.log(`⚠️ Unknown field type: ${fieldMapping.type} for field: ${fieldMapping.fieldName}`)
              break
          }
          
          // Handle conditional fields if this field has them
          if (fieldMapping.conditional) {
            console.log(`📝 Field has conditional logic, checking if conditions are met...`)
            await this.handleStep8ConditionalFields(page, jobId, formData, fieldMapping)
          }
          
          console.log(`✅ Successfully filled field: ${fieldMapping.fieldName}`)
          
        } catch (error) {
          console.error(`❌ Error filling field ${fieldMapping.fieldName}:`, error)
          throw error
        }
      }
      
      console.log('✅ Step 8 form filling completed successfully')
      
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
   * Handle conditional fields for Step 8
   */
  private async handleStep8ConditionalFields(page: Page, jobId: string, formData: DS160FormData, fieldMapping: any): Promise<void> {
    console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
    
    // Handle contact person "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'us_contact.contact_person_na') {
      const contactPersonNA = formData[fieldMapping.fieldName]
      const contactSurnames = formData['us_contact.contact_surnames']
      const contactGivenNames = formData['us_contact.contact_given_names']
      
      console.log(`📝 Contact person NA checkbox: ${contactPersonNA}`)
      console.log(`📝 Contact surnames: ${contactSurnames}`)
      console.log(`📝 Contact given names: ${contactGivenNames}`)
      
      if (contactPersonNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for contact person...')
        
        // Check the contact person NA checkbox
        const contactPersonNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxUS_POC_NAME_NA')
        await contactPersonNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await contactPersonNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for contact person')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after contact person NA checkbox selection')
        
        // The checkbox should automatically disable the contact person fields via JavaScript
        await page.waitForTimeout(1000)
      } else if ((contactSurnames && contactSurnames !== 'N/A') || (contactGivenNames && contactGivenNames !== 'N/A')) {
        console.log('📝 Filling contact person information...')
        
        // Make sure contact person NA checkbox is unchecked
        const contactPersonNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxUS_POC_NAME_NA')
        await contactPersonNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await contactPersonNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for contact person')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after contact person NA checkbox deselection')
        
        // Fill the contact person fields
        if (contactSurnames && contactSurnames !== 'N/A') {
          const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_SURNAME')
          await surnamesElement.waitFor({ state: 'visible', timeout: 15000 })
          await surnamesElement.fill(contactSurnames.toString())
          console.log(`✅ Filled contact surnames: ${contactSurnames}`)
        }
        
        if (contactGivenNames && contactGivenNames !== 'N/A') {
          const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_GIVEN_NAME')
          await givenNamesElement.waitFor({ state: 'visible', timeout: 15000 })
          await givenNamesElement.fill(contactGivenNames.toString())
          console.log(`✅ Filled contact given names: ${contactGivenNames}`)
        }
      }
    }
    
    // Handle organization "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'us_contact.contact_organization_na') {
      const organizationNA = formData[fieldMapping.fieldName]
      const organizationName = formData['us_contact.contact_organization']
      
      console.log(`📝 Organization NA checkbox: ${organizationNA}`)
      console.log(`📝 Organization name: ${organizationName}`)
      
      if (organizationNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for organization...')
        
        // Check the organization NA checkbox
        const organizationNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxUS_POC_ORG_NA_IND')
        await organizationNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await organizationNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for organization')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after organization NA checkbox selection')
        
        // The checkbox should automatically disable the organization field via JavaScript
        await page.waitForTimeout(1000)
      } else if (organizationName && organizationName !== 'N/A') {
        console.log('📝 Filling organization information...')
        
        // Make sure organization NA checkbox is unchecked
        const organizationNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxUS_POC_ORG_NA_IND')
        await organizationNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await organizationNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for organization')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after organization NA checkbox deselection')
        
        // Fill the organization field
        const organizationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ORGANIZATION')
        await organizationElement.waitFor({ state: 'visible', timeout: 15000 })
        await organizationElement.fill(organizationName.toString())
        console.log(`✅ Filled organization name: ${organizationName}`)
      }
    }
    
    // Handle email "Does Not Apply" checkbox logic
    if (fieldMapping.fieldName === 'us_contact.contact_email_na') {
      const emailNA = formData[fieldMapping.fieldName]
      const emailAddress = formData['us_contact.contact_email']
      
      console.log(`📝 Email NA checkbox: ${emailNA}`)
      console.log(`📝 Email address: ${emailAddress}`)
      
      if (emailNA === true || emailAddress === 'N/A') {
        console.log('📝 Checking "Does Not Apply" checkbox for email...')
        
        // Check the email NA checkbox
        const emailNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexUS_POC_EMAIL_ADDR_NA')
        await emailNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await emailNAElement.check()
        console.log('✅ Checked "Does Not Apply" checkbox for email')
        
        // The checkbox should automatically disable the email field via JavaScript
        await page.waitForTimeout(1000)
      } else if (emailAddress && emailAddress !== 'N/A') {
        console.log('📝 Filling email address...')
        
        // Make sure email NA checkbox is unchecked
        const emailNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexUS_POC_EMAIL_ADDR_NA')
        await emailNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await emailNAElement.uncheck()
        console.log('✅ Unchecked "Does Not Apply" checkbox for email')
        
        // Fill the email field
        const emailElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_EMAIL_ADDR')
        await emailElement.waitFor({ state: 'visible', timeout: 15000 })
        await emailElement.fill(emailAddress.toString())
        console.log(`✅ Filled email address: ${emailAddress}`)
      }
    }
    
    console.log(`✅ Completed conditional fields for: ${fieldMapping.fieldName}`)
  }
}
