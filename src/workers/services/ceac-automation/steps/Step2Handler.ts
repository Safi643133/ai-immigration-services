import { BaseStepHandler } from './BaseStepHandler'
import { getStep2FieldMappings, type FormFieldMapping } from '../../../../lib/form-field-mappings'
import type { DS160FormData } from '@/lib/types/ceac'

export class Step2Handler extends BaseStepHandler {
  constructor() {
    super(2, 'Personal Information 2', 'Personal Information - Step 2')
  }

  /**
   * Get Step 2 field mappings
   */
  protected getFieldMappings(): FormFieldMapping[] {
    return getStep2FieldMappings()
  }

  /**
   * Validate Step 2 data
   */
  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Basic validation for Step 2 fields (using flattened structure)
    if (!formData['personal_info.nationality']) {
      errors.push('Country/Region of Origin (Nationality) is required')
    }
    
    if (!formData['personal_info.other_nationalities']) {
      errors.push('Other nationalities question is required')
    }
    
    if (!formData['personal_info.permanent_resident_other_country']) {
      errors.push('Permanent resident question is required')
    }
    
    // Optional fields - only validate if they should be filled based on other answers
    if (formData['personal_info.national_identification_number_na'] !== true && !formData['personal_info.national_identification_number']) {
      errors.push('National Identification Number is required')
    }
    
    if (formData['personal_info.us_ssn_na'] !== true && !formData['personal_info.us_social_security_number']) {
      errors.push('U.S. Social Security Number is required')
    }
    
    if (formData['personal_info.us_itin_na'] !== true && !formData['personal_info.us_taxpayer_id_number']) {
      errors.push('U.S. Taxpayer ID Number is required')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check for Step 2 specific validation errors
   */
  protected async checkStepSpecificValidationErrors(page: any): Promise<boolean> {
    try {
      console.log(`🔍 Checking for Step 2 specific validation errors...`)
      
      // Step 2 specific validation selectors (same as Step 1 but with Step 2 specific error messages)
      const step2ValidationSelectors = [
        '#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary', // Primary Step 2 validation summary
        '#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary ul li', // Step 2 validation list items
        '.error-message', // General error message class
        '.field-validation-error' // Field-specific validation error
      ]
      
      for (const selector of step2ValidationSelectors) {
        const errorElement = page.locator(selector)
        if (await errorElement.isVisible({ timeout: 2000 })) {
          const errorText = await errorElement.textContent()
          console.log(`⚠️ Step 2 specific validation error detected with selector "${selector}": ${errorText}`)
          return true
        }
      }
      
      // Check for specific Step 2 field validation errors
      const step2FieldErrors = [
        'Country/Region of Origin (Nationality) has not been completed',
        'The question "Do you hold or have you held any nationality other than...?" has not been answered',
        'The question "Are you a permanent resident of a country/region other...?" has not been answered',
        'National Identification Number has not been completed',
        'U.S. Social Security Number has not been completed',
        'U.S. Taxpayer ID Number has not been completed'
      ]
      
      // Check if any of these specific error messages are present
      for (const errorMessage of step2FieldErrors) {
        const errorElement = page.locator(`text=${errorMessage}`)
        if (await errorElement.isVisible({ timeout: 1000 })) {
          console.log(`⚠️ Step 2 specific field error detected: ${errorMessage}`)
          return true
        }
      }
      
      return false
    } catch (error) {
      console.warn('⚠️ Error checking for Step 2 specific validation errors:', error)
      return false
    }
  }

  /**
   * Step 2 specific logic - handle conditional fields and special field types
   */
  protected async handleStepSpecificLogic(page: any, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 2 specific logic...')
    
    // Handle conditional fields after main fields are filled
    await this.handleStep2ConditionalFields(page, jobId, formData)
  }

  /**
   * Handle Step 2 conditional fields that appear based on radio button selections
   */
  private async handleStep2ConditionalFields(page: any, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 2 conditional fields...')
    
    // ============================================================================
    // HANDLE OTHER NATIONALITIES CONDITIONAL FIELDS
    // ============================================================================
    const otherNationalities = formData['personal_info.other_nationalities']
    if (otherNationalities === 'Yes') {
      console.log('📝 Filling other nationalities conditional fields...')
      
      // Wait for the conditional fields to appear after selecting "Yes"
      await this.waitForConditionalFieldsToAppear(page, jobId, 'other_nationalities')
      
      // Get the other nationalities list
      const natList = Array.isArray(formData['personal_info.other_nationalities_list'])
        ? (formData['personal_info.other_nationalities_list'] as Array<any>)
        : []
      
      if (natList.length > 0) {
        const firstNat = natList[0]
        
        // Fill other nationality country
        if (firstNat.country) {
          try {
            console.log(`🌍 Filling other nationality country: ${firstNat.country}`)
            
            // Wait for the country dropdown to be visible and enabled
            const countryElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_ddlOTHER_NATL')
            await countryElement.waitFor({ state: 'visible', timeout: 15000 })
            
            // Additional wait to ensure dropdown is fully loaded
            await page.waitForTimeout(2000)
            
            // Get CEAC country code for the country name
            const { getCountryCode } = await import('../../../../lib/country-code-mapping')
            const countryCode = getCountryCode(firstNat.country)
            if (!countryCode) {
              throw new Error(`No country code found for: ${firstNat.country}`)
            }
            
            console.log(`🔍 Mapping country "${firstNat.country}" to CEAC code: "${countryCode}"`)
            
            // Select by the CEAC country code
            await countryElement.selectOption({ value: countryCode })
            console.log(`✅ Selected other nationality country: ${firstNat.country} (${countryCode})`)
            
            // Wait for any postback after country selection
            await this.waitForPostback(page, 'country selection')
            
          } catch (error) {
            console.warn(`⚠️ Failed to fill other nationality country:`, error)
            await this.takeErrorScreenshot(page, jobId)
          }
        }
        
        // Fill passport question
        if (firstNat.has_passport) {
          try {
            console.log(`📄 Filling passport question: ${firstNat.has_passport}`)
            
            // Wait for passport radio buttons to appear
            await page.waitForTimeout(2000)
            
            const passportRadio = page.locator(`#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_rblOTHER_PPT_IND input[value="${firstNat.has_passport === 'Yes' ? 'Y' : 'N'}"]`)
            await passportRadio.waitFor({ state: 'visible', timeout: 15000 })
            await passportRadio.check()
            console.log(`✅ Selected passport question: ${firstNat.has_passport}`)
            
            // Wait for postback after radio selection
            await this.waitForPostback(page, 'passport question')
            
            // If Yes, fill passport number
            if (firstNat.has_passport === 'Yes' && firstNat.passport_number) {
              console.log(`📄 Filling passport number: ${firstNat.passport_number}`)
              
              // Wait for the passport number field to appear
              await this.waitForConditionalFieldsToAppear(page, jobId, 'passport_number')
              
              const passportNumberElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_tbxOTHER_PPT_NUM')
              await passportNumberElement.waitFor({ state: 'visible', timeout: 15000 })
              await passportNumberElement.fill(firstNat.passport_number)
              console.log(`✅ Filled passport number: ${firstNat.passport_number}`)
            }
          } catch (error) {
            console.warn(`⚠️ Failed to fill passport question:`, error)
            await this.takeErrorScreenshot(page, jobId)
          }
        }
      }
    }
    
    // ============================================================================
    // HANDLE PERMANENT RESIDENT CONDITIONAL FIELDS
    // ============================================================================
    const permanentResidentOther = formData['personal_info.permanent_resident_other_country']
    if (permanentResidentOther === 'Yes') {
      console.log('📝 Filling permanent resident conditional fields...')
      
      // Wait for the conditional fields to appear after selecting "Yes"
      await this.waitForConditionalFieldsToAppear(page, jobId, 'permanent_resident')
      
      const permanentResidentCountry = formData['personal_info.permanent_resident_country']
      if (permanentResidentCountry) {
        try {
          console.log(`🏠 Filling permanent resident country: ${permanentResidentCountry}`)
          
          // Wait for the country dropdown to be visible and enabled
          const countryElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOthPermResCntry_ctl00_ddlOthPermResCntry')
          await countryElement.waitFor({ state: 'visible', timeout: 15000 })
          
          // Additional wait to ensure dropdown is fully loaded
          await page.waitForTimeout(2000)
          
          // Get CEAC country code for the country name
          const { getCountryCode } = await import('../../../../lib/country-code-mapping')
          const countryCode = getCountryCode(permanentResidentCountry)
          if (!countryCode) {
            throw new Error(`No country code found for: ${permanentResidentCountry}`)
          }
          
          console.log(`🔍 Mapping country "${permanentResidentCountry}" to CEAC code: "${countryCode}"`)
          
          // Select by the CEAC country code
          await countryElement.selectOption({ value: countryCode })
          console.log(`✅ Selected permanent resident country: ${permanentResidentCountry} (${countryCode})`)
          
          // Wait for any postback after country selection
          await this.waitForPostback(page, 'permanent resident country selection')
          
        } catch (error) {
          console.warn(`⚠️ Failed to fill permanent resident country:`, error)
          await this.takeErrorScreenshot(page, jobId)
        }
      }
    }
    
    // ============================================================================
    // HANDLE IDENTIFICATION NUMBER FIELDS
    // ============================================================================
    console.log('📝 Handling identification number fields...')
    
    // Handle National Identification Number
    const nationalIdNumber = formData['personal_info.national_identification_number']
    if (nationalIdNumber && nationalIdNumber !== '') {
      try {
        console.log(`🆔 Filling national identification number: ${nationalIdNumber}`)
        
        // Check if "Does Not Apply" checkbox is checked
        const nationalIdCheckbox = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_NATIONAL_ID_NA')
        const isChecked = await nationalIdCheckbox.isChecked()
        
        if (!isChecked) {
          // Fill the national ID number field
          const nationalIdElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_NATIONAL_ID')
          await nationalIdElement.waitFor({ state: 'visible', timeout: 10000 })
          await nationalIdElement.fill(nationalIdNumber)
          console.log(`✅ Filled national identification number`)
        } else {
          console.log(`⏭️ Skipping national ID - "Does Not Apply" is checked`)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fill national identification number:`, error)
      }
    }
    
    // Handle U.S. Social Security Number
    const ssnPart1 = formData['personal_info.us_social_security_number_1']
    const ssnPart2 = formData['personal_info.us_social_security_number_2']
    const ssnPart3 = formData['personal_info.us_social_security_number_3']
    
    if (ssnPart1 || ssnPart2 || ssnPart3) {
      try {
        console.log(`🔢 Filling U.S. Social Security Number: ${ssnPart1}-${ssnPart2}-${ssnPart3}`)
        
        // Check if "Does Not Apply" checkbox is checked
        const ssnCheckbox = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_SSN_NA')
        const isChecked = await ssnCheckbox.isChecked()
        
        if (!isChecked) {
          // Fill SSN part 1
          if (ssnPart1) {
            const ssn1Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN1')
            await ssn1Element.waitFor({ state: 'visible', timeout: 10000 })
            await ssn1Element.fill(ssnPart1)
            console.log(`✅ Filled SSN part 1: ${ssnPart1}`)
          }
          
          // Fill SSN part 2
          if (ssnPart2) {
            const ssn2Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN2')
            await ssn2Element.waitFor({ state: 'visible', timeout: 10000 })
            await ssn2Element.fill(ssnPart2)
            console.log(`✅ Filled SSN part 2: ${ssnPart2}`)
          }
          
          // Fill SSN part 3
          if (ssnPart3) {
            const ssn3Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN3')
            await ssn3Element.waitFor({ state: 'visible', timeout: 10000 })
            await ssn3Element.fill(ssnPart3)
            console.log(`✅ Filled SSN part 3: ${ssnPart3}`)
          }
          
          console.log(`✅ Filled U.S. Social Security Number: ${ssnPart1}-${ssnPart2}-${ssnPart3}`)
        } else {
          console.log(`⏭️ Skipping SSN - "Does Not Apply" is checked`)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fill U.S. Social Security Number:`, error)
      }
    }
    
    // Handle U.S. Taxpayer ID Number
    const taxpayerId = formData['personal_info.us_taxpayer_id_number']
    if (taxpayerId && taxpayerId !== '') {
      try {
        console.log(`💰 Filling U.S. Taxpayer ID Number: ${taxpayerId}`)
        
        // Check if "Does Not Apply" checkbox is checked
        const taxpayerCheckbox = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_TAX_ID_NA')
        const isChecked = await taxpayerCheckbox.isChecked()
        
        if (!isChecked) {
          // Fill the taxpayer ID field
          const taxpayerElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_TAX_ID')
          await taxpayerElement.waitFor({ state: 'visible', timeout: 10000 })
          await taxpayerElement.fill(taxpayerId)
          console.log(`✅ Filled U.S. Taxpayer ID Number`)
        } else {
          console.log(`⏭️ Skipping taxpayer ID - "Does Not Apply" is checked`)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fill U.S. Taxpayer ID Number:`, error)
      }
    }
    
    // ============================================================================
    // HANDLE CHECKBOX CONDITIONALS FOR NA FIELDS
    // ============================================================================
    console.log('📝 Handling checkbox conditionals for NA fields...')
    
    const step2Mappings = getStep2FieldMappings()
    for (const fieldMapping of step2Mappings) {
      if (fieldMapping.type === 'text' && fieldMapping.conditional?.checkbox) {
        const checkboxValue = formData[fieldMapping.conditional.checkbox.fieldName]
        
        if (checkboxValue === true || checkboxValue === 'true') {
          console.log(`📝 Checking NA checkbox for: ${fieldMapping.fieldName}`)
          try {
            const checkboxElement = page.locator(fieldMapping.conditional.checkbox.selector)
            await checkboxElement.waitFor({ state: 'visible', timeout: 5000 })
            await checkboxElement.check()
            console.log(`✅ Checked NA checkbox for: ${fieldMapping.fieldName}`)
          } catch (error) {
            console.warn(`⚠️ Failed to check NA checkbox for ${fieldMapping.fieldName}:`, error)
          }
        }
      }
    }
    
    console.log('✅ Step 2 conditional fields completed')
  }


}
