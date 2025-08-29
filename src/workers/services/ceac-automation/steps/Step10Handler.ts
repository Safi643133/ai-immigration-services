import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { getStep10FieldMappings } from '@/lib/form-field-mappings'

export class Step10Handler extends BaseStepHandler {
  constructor() {
    super(10, 'Work/Education Information', 'Filling work and education information')
  }

  protected getFieldMappings() {
    return getStep10FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!formData['present_work_education.primary_occupation']?.trim()) {
      errors.push('Primary occupation is required')
    }

    // Conditional validation based on occupation
    const occupation = formData['present_work_education.primary_occupation']
    
    if (occupation === 'NOT EMPLOYED') {
      if (!formData['present_work_education.not_employed_explanation']?.trim()) {
        errors.push('Explanation is required when occupation is "NOT EMPLOYED"')
      }
    }
    
    if (occupation === 'OTHER') {
      if (!formData['present_work_education.other_occupation_specification']?.trim()) {
        errors.push('Occupation specification is required when occupation is "OTHER"')
      }
    }

    // Validate employer/school fields for non-special occupations
    if (occupation && !['HOMEMAKER', 'RETIRED', 'NOT EMPLOYED'].includes(occupation)) {
      if (!formData['present_work_education.employer_school_name']?.trim()) {
        errors.push('Employer/school name is required')
      }
      if (!formData['present_work_education.employer_address_line1']?.trim()) {
        errors.push('Employer address line 1 is required')
      }
      if (!formData['present_work_education.employer_city']?.trim()) {
        errors.push('Employer city is required')
      }
      if (!formData['present_work_education.employer_country']?.trim()) {
        errors.push('Employer country is required')
      }
      if (!formData['present_work_education.start_date']) {
        errors.push('Start date is required')
      }
      if (!formData['present_work_education.job_duties']?.trim()) {
        errors.push('Job duties are required')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Override the handleStep method to use custom Step 10 logic
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
      console.log('🔍 Verifying we are on Step 10 page...')
      const step10Indicator = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlPresentOccupation')
      try {
        await step10Indicator.waitFor({ state: 'visible', timeout: 10000 })
        console.log('✅ Confirmed we are on Step 10 page')
      } catch (error) {
        console.log('⚠️ Could not find Step 10 indicator, taking screenshot for debugging...')
        await this.takeErrorScreenshot(page, jobId)
        throw new Error('Not on Step 10 page - Work/Education Information fields not found')
      }
      
      // Validate step data
      const validation = this.validateStepData(formData)
      if (!validation.valid) {
        console.warn(`⚠️ Step ${this.stepNumber} data validation warnings:`, validation.errors)
      }

      console.log('📝 Starting Step 10 form filling (Work/Education Information)...')

      // Get Step 10 field mappings
      const step10Mappings = getStep10FieldMappings()
      console.log(`📋 Found ${step10Mappings.length} Step 10 field mappings`)

      // Fill each field
      for (const fieldMapping of step10Mappings) {
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
              if (fieldMapping.valueMapping) {
                const mappedValue = fieldMapping.valueMapping[fieldValue.toString()]
                if (mappedValue) {
                  await element.selectOption({ value: mappedValue })
                  console.log(`✅ Selected dropdown option: ${fieldMapping.fieldName} = ${mappedValue}`)
                  
                  // Wait for postback after occupation selection
                  if (fieldMapping.fieldName === 'present_work_education.primary_occupation') {
                    console.log('⏳ Waiting for postback after occupation selection...')
                    await this.waitForPostback(page, jobId)
                  }
                } else {
                  console.warn(`⚠️ No mapping found for value: ${fieldValue}`)
                }
              } else {
                await element.selectOption({ value: fieldValue.toString() })
                console.log(`✅ Selected dropdown option: ${fieldMapping.fieldName}`)
              }
              break
              
            case 'date':
              const dateValue = new Date(fieldValue.toString()).toISOString().split('T')[0]
              await element.fill(dateValue)
              console.log(`✅ Filled date field: ${fieldMapping.fieldName}`)
              break
              
            case 'textarea':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled textarea field: ${fieldMapping.fieldName}`)
              break
              
            case 'checkbox':
              if (fieldValue === true || fieldValue === 'Yes' || fieldValue === 'N/A') {
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
          
          // Small delay between fields
          await page.waitForTimeout(200)
          
          console.log(`✅ Successfully filled field: ${fieldMapping.fieldName}`)
          
        } catch (error) {
          console.error(`❌ Error filling field ${fieldMapping.fieldName}:`, error)
          throw error
        }
      }
      
      // Handle conditional fields based on occupation
      await this.handleStep10ConditionalFields(page, jobId, formData)
      
      console.log('✅ Step 10 form filling completed successfully')
      
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
   * Handle conditional fields for Step 10 based on occupation selection
   */
  private async handleStep10ConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 10 conditional fields...')
    
    const selectedOccupation = formData['present_work_education.primary_occupation']
    
    if (!selectedOccupation) {
      console.log('⏭️ No occupation selected, skipping conditional fields')
      return
    }
    
    console.log(`📝 Processing conditional fields for occupation: ${selectedOccupation}`)
    
    // Wait for page to reload after occupation selection
    console.log('⏳ Waiting for page to reload after occupation selection...')
    await page.waitForTimeout(3000)
    
    // Handle HOMEMAKER and RETIRED - no additional fields needed
    if (['HOMEMAKER', 'RETIRED'].includes(selectedOccupation)) {
      console.log(`ℹ️ No additional fields required for occupation: ${selectedOccupation}`)
      return
    }
    
    // Handle NOT EMPLOYED explanation
    if (selectedOccupation === 'NOT EMPLOYED') {
      console.log('📝 Looking for NOT EMPLOYED explanation field...')
      try {
        const explanation = formData['present_work_education.not_employed_explanation']
        if (explanation) {
          console.log('📝 Filling NOT EMPLOYED explanation...')
          const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxNOT_EMPLOYED_EXPLANATION')
          await element.waitFor({ state: 'visible', timeout: 15000 })
          await element.fill(explanation.toString())
          console.log('✅ Filled NOT EMPLOYED explanation')
        }
      } catch (error) {
        console.warn('⚠️ NOT EMPLOYED explanation field not found or not visible')
      }
      return
    }
    
    // Handle OTHER occupation specification
    if (selectedOccupation === 'OTHER') {
      console.log('📝 Looking for OTHER occupation specification field...')
      try {
        const specification = formData['present_work_education.other_occupation_specification']
        if (specification) {
          console.log('📝 Filling OTHER occupation specification...')
          const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxExplainOtherPresentOccupation')
          await element.waitFor({ state: 'visible', timeout: 15000 })
          await element.fill(specification.toString())
          console.log('✅ Filled OTHER occupation specification')
        }
      } catch (error) {
        console.warn('⚠️ OTHER occupation specification field not found or not visible')
      }
    }
    
    // For all other occupations (including OTHER), fill employer/school fields
    // Check if the employer section is visible
    try {
      const employerSection = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ShowDivEmployed')
      await employerSection.waitFor({ state: 'visible', timeout: 10000 })
      console.log('✅ Employer section is visible, proceeding to fill fields...')
      
      // Fill employer/school fields
      await this.fillEmployerSchoolFields(page, jobId, formData)
      
    } catch (error) {
      console.warn('⚠️ Employer section not found or not visible')
    }
    
    console.log('✅ Step 10 conditional fields handling completed')
  }

  /**
   * Fill employer/school fields
   */
  private async fillEmployerSchoolFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling employer/school fields...')
    
    // Fill employer/school name
    const employerName = formData['present_work_education.employer_school_name']
    if (employerName) {
      console.log(`📝 Filling employer/school name: ${employerName}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchName')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(employerName.toString())
      console.log('✅ Filled employer/school name')
    }
    
    // Fill address line 1
    const addressLine1 = formData['present_work_education.employer_address_line1']
    if (addressLine1) {
      console.log(`📝 Filling address line 1: ${addressLine1}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchAddr1')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(addressLine1.toString())
      console.log('✅ Filled address line 1')
    }
    
    // Fill address line 2
    const addressLine2 = formData['present_work_education.employer_address_line2']
    if (addressLine2) {
      console.log(`📝 Filling address line 2: ${addressLine2}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchAddr2')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(addressLine2.toString())
      console.log('✅ Filled address line 2')
    }
    
    // Fill city
    const city = formData['present_work_education.employer_city']
    if (city) {
      console.log(`📝 Filling city: ${city}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchCity')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(city.toString())
      console.log('✅ Filled city')
    }
    
    // Handle state/province
    const state = formData['present_work_education.employer_state']
    const stateNA = formData['present_work_education.employer_state_na']
    if (stateNA === true || state === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for state')
      const stateNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxWORK_EDUC_ADDR_STATE_NA')
      await stateNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for state')
    } else if (state) {
      console.log(`📝 Filling state: ${state}`)
      const stateElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_ADDR_STATE')
      await stateElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateElement.fill(state.toString())
      console.log('✅ Filled state')
    }
    
    // Handle postal code
    const postalCode = formData['present_work_education.employer_postal_code']
    const postalNA = formData['present_work_education.employer_postal_na']
    if (postalNA === true || postalCode === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for postal code')
      const postalNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxWORK_EDUC_ADDR_POSTAL_CD_NA')
      await postalNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await postalNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for postal code')
    } else if (postalCode) {
      console.log(`📝 Filling postal code: ${postalCode}`)
      const postalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_ADDR_POSTAL_CD')
      await postalElement.waitFor({ state: 'visible', timeout: 15000 })
      await postalElement.fill(postalCode.toString())
      console.log('✅ Filled postal code')
    }
    
    // Fill phone number
    const phone = formData['present_work_education.employer_phone']
    if (phone) {
      console.log(`📝 Filling phone number: ${phone}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_TEL')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(phone.toString())
      console.log('✅ Filled phone number')
    }
    
    // Fill country
    const country = formData['present_work_education.employer_country']
    if (country) {
      console.log(`📝 Filling country: ${country}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlEmpSchCountry')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      
      // Map country names to codes based on the HTML options
      const countryCodeMap: { [key: string]: string } = {
        'PAKISTAN': 'PKST',
        'UNITED STATES': 'USA',
        'UNITED STATES OF AMERICA': 'USA',
        'CANADA': 'CAN',
        'UNITED KINGDOM': 'GRBR',
        'INDIA': 'IND',
        'CHINA': 'CHIN',
        'MEXICO': 'MEX',
        'BRAZIL': 'BRZL',
        'FRANCE': 'FRAN',
        'GERMANY': 'GER',
        'ITALY': 'ITLY',
        'SPAIN': 'SPN',
        'JAPAN': 'JPN',
        'AUSTRALIA': 'ASTL',
        'NEW ZEALAND': 'NZLD',
        'SOUTH AFRICA': 'SAFR',
        'NIGERIA': 'NRA',
        'EGYPT': 'EGYP',
        'KENYA': 'KENY',
        'ETHIOPIA': 'ETH',
        'MOROCCO': 'MORO',
        'ALGERIA': 'ALGR',
        'TUNISIA': 'TNSA',
        'LIBYA': 'LBYA',
        'SUDAN': 'SUDA',
        'SOMALIA': 'SOMA',
        'DJIBOUTI': 'DJI',
        'ERITREA': 'ERI',
        'BURUNDI': 'BRND',
        'RWANDA': 'RWND',
        'TANZANIA': 'TAZN',
        'UGANDA': 'UGAN',
        'ZAMBIA': 'ZAMB',
        'ZIMBABWE': 'ZIMB',
        'MALAWI': 'MALW',
        'MOZAMBIQUE': 'MOZ',
        'NAMIBIA': 'NAMB',
        'BOTSWANA': 'BOT',
        'LESOTHO': 'LES',
        'SWAZILAND': 'SZLD',
        'MAURITIUS': 'MRTS',
        'SEYCHELLES': 'SEYC',
        'COMOROS': 'COMO',
        'MADAGASCAR': 'MADG',
        'CAPE VERDE': 'CAVI',
        'CABO VERDE': 'CAVI',
        'SENEGAL': 'SENG',
        'GAMBIA': 'GAM',
        'GUINEA-BISSAU': 'GUIB',
        'GUINEA BISSAU': 'GUIB',
        'SIERRA LEONE': 'SLEO',
        'LIBERIA': 'LIBR',
        'IVORY COAST': 'IVCO',
        'COTE D\'IVOIRE': 'IVCO',
        'GHANA': 'GHAN',
        'TOGO': 'TOGO',
        'BENIN': 'BENN',
        'NIGER': 'NIR',
        'BURKINA FASO': 'BURK',
        'MALI': 'MALI',
        'CHAD': 'CHAD',
        'CAMEROON': 'CMRN',
        'CENTRAL AFRICAN REPUBLIC': 'CAFR',
        'EQUATORIAL GUINEA': 'EGN',
        'GABON': 'GABN',
        'CONGO': 'CONB',
        'CONGO, REPUBLIC OF THE': 'CONB',
        'CONGO, DEMOCRATIC REPUBLIC OF THE': 'COD',
        'ANGOLA': 'ANGL',
        'SAO TOME AND PRINCIPE': 'STPR',
        'SAINT TOME AND PRINCIPE': 'STPR'
      }
      
      const countryCode = countryCodeMap[country.toUpperCase()]
      if (countryCode) {
        await element.selectOption({ value: countryCode })
        console.log(`✅ Selected country: ${country} (${countryCode})`)
      } else {
        console.warn(`⚠️ No country code found for: ${country}`)
        // Try to find by partial match
        const options = await element.locator('option').all()
        for (const option of options) {
          const optionText = await option.textContent()
          const optionValue = await option.getAttribute('value')
          if (optionText && optionText.toUpperCase().includes(country.toUpperCase())) {
            await element.selectOption({ value: optionValue || '' })
            console.log(`✅ Selected country by partial match: ${optionText} (${optionValue})`)
            break
          }
        }
      }
    }
    
    // Fill start date (split date)
    const startDate = formData['present_work_education.start_date']
    if (startDate) {
      console.log(`📝 Filling start date: ${startDate}`)
      const date = new Date(startDate.toString())
      const day = date.getDate().toString()
      const month = (date.getMonth() + 1).toString()
      const year = date.getFullYear().toString()
      
      // Fill day
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlEmpDateFromDay')
      await dayElement.waitFor({ state: 'visible', timeout: 15000 })
      await dayElement.selectOption({ value: day })
      
      // Fill month
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlEmpDateFromMonth')
      await monthElement.waitFor({ state: 'visible', timeout: 15000 })
      await monthElement.selectOption({ value: month })
      
      // Fill year
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxEmpDateFromYear')
      await yearElement.waitFor({ state: 'visible', timeout: 15000 })
      await yearElement.fill(year)
      
      console.log('✅ Filled start date')
    }
    
    // Handle monthly income
    const monthlyIncome = formData['present_work_education.monthly_income']
    const incomeNA = formData['present_work_education.monthly_income_na']
    if (incomeNA === true || monthlyIncome === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for monthly income')
      const incomeNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxCURR_MONTHLY_SALARY_NA')
      await incomeNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await incomeNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for monthly income')
    } else if (monthlyIncome) {
      console.log(`📝 Filling monthly income: ${monthlyIncome}`)
      const incomeElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxCURR_MONTHLY_SALARY')
      await incomeElement.waitFor({ state: 'visible', timeout: 15000 })
      await incomeElement.fill(monthlyIncome.toString())
      console.log('✅ Filled monthly income')
    }
    
    // Fill job duties
    const jobDuties = formData['present_work_education.job_duties']
    if (jobDuties) {
      console.log(`📝 Filling job duties: ${jobDuties}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDescribeDuties')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(jobDuties.toString())
      console.log('✅ Filled job duties')
    }
    
    console.log('✅ Completed filling employer/school fields')
  }
}
