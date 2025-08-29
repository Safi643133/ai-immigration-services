import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { getStep11FieldMappings } from '@/lib/form-field-mappings'

export class Step11Handler extends BaseStepHandler {
  constructor() {
    super(11, 'Previous Work/Education Information', 'Filling previous work and education information')
  }

  protected getFieldMappings() {
    return getStep11FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!formData['previous_work_education.previously_employed']?.trim()) {
      errors.push('Previously employed question is required')
    }
    if (!formData['previous_work_education.attended_educational_institutions']?.trim()) {
      errors.push('Attended educational institutions question is required')
    }

    // Conditional validation for previous employment
    const previouslyEmployed = formData['previous_work_education.previously_employed']
    if (previouslyEmployed === 'Yes') {
      if (!formData['previous_work_education.previous_employer_name']?.trim()) {
        errors.push('Previous employer name is required when previously employed is Yes')
      }
      if (!formData['previous_work_education.previous_job_title']?.trim()) {
        errors.push('Previous job title is required when previously employed is Yes')
      }
      if (!formData['previous_work_education.previous_employment_from']) {
        errors.push('Previous employment start date is required when previously employed is Yes')
      }
      if (!formData['previous_work_education.previous_job_duties']?.trim()) {
        errors.push('Previous job duties are required when previously employed is Yes')
      }
    }

    // Conditional validation for education
    const attendedEducation = formData['previous_work_education.attended_educational_institutions']
    if (attendedEducation === 'Yes') {
      if (!formData['previous_work_education.educational_institution_name']?.trim()) {
        errors.push('Educational institution name is required when attended educational institutions is Yes')
      }
      if (!formData['previous_work_education.course_of_study']?.trim()) {
        errors.push('Course of study is required when attended educational institutions is Yes')
      }
      if (!formData['previous_work_education.educational_attendance_from']) {
        errors.push('Educational attendance start date is required when attended educational institutions is Yes')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Override the handleStep method to use custom Step 11 logic
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
        await page.waitForTimeout(2000)
      }

      // Verify we're on the correct page before proceeding
      console.log('🔍 Verifying we are on Step 11 page...')
      const step11Indicator = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblPreviouslyEmployed_0')
      try {
        await step11Indicator.waitFor({ state: 'visible', timeout: 10000 })
        console.log('✅ Confirmed we are on Step 11 page')
      } catch (error) {
        console.log('⚠️ Could not find Step 11 indicator, taking screenshot for debugging...')
        await this.takeErrorScreenshot(page, jobId)
        throw new Error('Not on Step 11 page - Previous Work/Education Information fields not found')
      }
      
      // Validate step data
      const validation = this.validateStepData(formData)
      if (!validation.valid) {
        console.warn(`⚠️ Step ${this.stepNumber} data validation warnings:`, validation.errors)
      }

      console.log('📝 Starting Step 11 form filling (Previous Work/Education Information)...')

      // Get Step 11 field mappings
      const step11Mappings = getStep11FieldMappings()
      console.log(`📋 Found ${step11Mappings.length} Step 11 field mappings`)

      // Fill each field
      for (const fieldMapping of step11Mappings) {
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
            case 'radio':
              if (fieldValue === 'Yes' || fieldValue === 'Y') {
                await element.check()
                console.log(`✅ Selected radio button: ${fieldMapping.fieldName}`)
                
                // Wait for conditional sections to appear after radio selection
                console.log('⏳ Waiting for conditional sections to appear...')
                await page.waitForTimeout(2000)
              } else {
                // For "No" selection, find the corresponding "No" radio button
                const noSelector = fieldMapping.selector.replace('_0', '_1')
                const noElement = page.locator(noSelector)
                await noElement.waitFor({ state: 'visible', timeout: 15000 })
                await noElement.check()
                console.log(`✅ Selected "No" radio button: ${fieldMapping.fieldName}`)
                
                // Wait for conditional sections to appear after radio selection
                console.log('⏳ Waiting for conditional sections to appear...')
                await page.waitForTimeout(2000)
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
      
      // Handle conditional fields based on radio selections
      await this.handleStep11ConditionalFields(page, jobId, formData)
      
      console.log('✅ Step 11 form filling completed successfully')
      
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
   * Handle conditional fields for Step 11 based on radio selections
   */
  private async handleStep11ConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 11 conditional fields...')
    
    const previouslyEmployed = formData['previous_work_education.previously_employed']
    const attendedEducation = formData['previous_work_education.attended_educational_institutions']
    
    console.log(`📝 Previously employed: ${previouslyEmployed}, Attended education: ${attendedEducation}`)
    
    // Handle previous employment fields
    if (previouslyEmployed === 'Yes' || previouslyEmployed === 'Y') {
      console.log('📝 Filling previous employment fields...')
      await this.fillPreviousEmploymentFields(page, jobId, formData)
    } else {
      console.log('ℹ️ No previous employment to fill')
    }
    
    // Handle education fields
    if (attendedEducation === 'Yes' || attendedEducation === 'Y') {
      console.log('📝 Filling education fields...')
      await this.fillEducationFields(page, jobId, formData)
    } else {
      console.log('ℹ️ No education to fill')
    }
    
    console.log('✅ Step 11 conditional fields handling completed')
  }

  /**
   * Fill previous employment fields
   */
  private async fillPreviousEmploymentFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling previous employment fields...')
    
    // Wait for the previous employment section to appear
    console.log('⏳ Waiting for previous employment section to appear...')
    await page.waitForTimeout(2000)
    
    // Check if the previous employment section is visible
    const employmentSection = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerName')
    await employmentSection.waitFor({ state: 'visible', timeout: 15000 })
    console.log('✅ Previous employment section is visible')
    
    // Fill employer name
    const employerName = formData['previous_work_education.previous_employer_name']
    if (employerName) {
      console.log(`📝 Filling employer name: ${employerName}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerName')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(employerName.toString())
      console.log('✅ Filled employer name')
    }
    
    // Fill address line 1
    const addressLine1 = formData['previous_work_education.previous_employer_address_line1']
    if (addressLine1) {
      console.log(`📝 Filling address line 1: ${addressLine1}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerStreetAddress1')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(addressLine1.toString())
      console.log('✅ Filled address line 1')
    }
    
    // Fill address line 2
    const addressLine2 = formData['previous_work_education.previous_employer_address_line2']
    if (addressLine2) {
      console.log(`📝 Filling address line 2: ${addressLine2}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerStreetAddress2')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(addressLine2.toString())
      console.log('✅ Filled address line 2')
    }
    
    // Fill city
    const city = formData['previous_work_education.previous_employer_city']
    if (city) {
      console.log(`📝 Filling city: ${city}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerCity')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(city.toString())
      console.log('✅ Filled city')
    }
    
    // Handle state/province
    const state = formData['previous_work_education.previous_employer_state']
    const stateNA = formData['previous_work_education.previous_employer_state_na']
    if (stateNA === true || state === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for state')
      const stateNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_cbxPREV_EMPL_ADDR_STATE_NA')
      await stateNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for state')
    } else if (state) {
      console.log(`📝 Filling state: ${state}`)
      const stateElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbxPREV_EMPL_ADDR_STATE')
      await stateElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateElement.fill(state.toString())
      console.log('✅ Filled state')
    }
    
    // Handle postal code
    const postalCode = formData['previous_work_education.previous_employer_postal_code']
    const postalNA = formData['previous_work_education.previous_employer_postal_na']
    if (postalNA === true || postalCode === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for postal code')
      const postalNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_cbxPREV_EMPL_ADDR_POSTAL_CD_NA')
      await postalNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await postalNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for postal code')
    } else if (postalCode) {
      console.log(`📝 Filling postal code: ${postalCode}`)
      const postalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbxPREV_EMPL_ADDR_POSTAL_CD')
      await postalElement.waitFor({ state: 'visible', timeout: 15000 })
      await postalElement.fill(postalCode.toString())
      console.log('✅ Filled postal code')
    }
    
    // Fill country
    const country = formData['previous_work_education.previous_employer_country']
    if (country) {
      console.log(`📝 Filling country: ${country}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_DropDownList2')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      
      // Map country names to codes
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
    
    // Fill phone number
    const phone = formData['previous_work_education.previous_employer_phone']
    if (phone) {
      console.log(`📝 Filling phone number: ${phone}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerPhone')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(phone.toString())
      console.log('✅ Filled phone number')
    }
    
    // Fill job title
    const jobTitle = formData['previous_work_education.previous_job_title']
    if (jobTitle) {
      console.log(`📝 Filling job title: ${jobTitle}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbJobTitle')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(jobTitle.toString())
      console.log('✅ Filled job title')
    }
    
    // Handle supervisor surname
    const supervisorSurname = formData['previous_work_education.previous_supervisor_surname']
    const supervisorSurnameNA = formData['previous_work_education.previous_supervisor_surname_na']
    if (supervisorSurnameNA === true || supervisorSurname === 'N/A') {
      console.log('📝 Checking "Do Not Know" checkbox for supervisor surname')
      const surnameNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_cbxSupervisorSurname_NA')
      await surnameNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await surnameNAElement.check()
      console.log('✅ Checked "Do Not Know" checkbox for supervisor surname')
    } else if (supervisorSurname) {
      console.log(`📝 Filling supervisor surname: ${supervisorSurname}`)
      const surnameElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbSupervisorSurname')
      await surnameElement.waitFor({ state: 'visible', timeout: 15000 })
      await surnameElement.fill(supervisorSurname.toString())
      console.log('✅ Filled supervisor surname')
    }
    
    // Handle supervisor given names
    const supervisorGivenNames = formData['previous_work_education.previous_supervisor_given_names']
    const supervisorGivenNamesNA = formData['previous_work_education.previous_supervisor_given_names_na']
    if (supervisorGivenNamesNA === true || supervisorGivenNames === 'N/A') {
      console.log('📝 Checking "Do Not Know" checkbox for supervisor given names')
      const givenNamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_cbxSupervisorGivenName_NA')
      await givenNamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await givenNamesNAElement.check()
      console.log('✅ Checked "Do Not Know" checkbox for supervisor given names')
    } else if (supervisorGivenNames) {
      console.log(`📝 Filling supervisor given names: ${supervisorGivenNames}`)
      const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbSupervisorGivenName')
      await givenNamesElement.waitFor({ state: 'visible', timeout: 15000 })
      await givenNamesElement.fill(supervisorGivenNames.toString())
      console.log('✅ Filled supervisor given names')
    }
    
    // Fill employment dates (split date)
    const employmentFrom = formData['previous_work_education.previous_employment_from']
    if (employmentFrom) {
      console.log(`📝 Filling employment from date: ${employmentFrom}`)
      const date = new Date(employmentFrom.toString())
      const day = date.getDate().toString()
      const month = (date.getMonth() + 1).toString()
      const year = date.getFullYear().toString()
      
      // Fill day
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_ddlEmpDateFromDay')
      await dayElement.waitFor({ state: 'visible', timeout: 15000 })
      await dayElement.selectOption({ value: day })
      
      // Fill month
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_ddlEmpDateFromMonth')
      await monthElement.waitFor({ state: 'visible', timeout: 15000 })
      await monthElement.selectOption({ value: month })
      
      // Fill year
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbxEmpDateFromYear')
      await yearElement.waitFor({ state: 'visible', timeout: 15000 })
      await yearElement.fill(year)
      
      console.log('✅ Filled employment from date')
    }
    
    const employmentTo = formData['previous_work_education.previous_employment_to']
    if (employmentTo) {
      console.log(`📝 Filling employment to date: ${employmentTo}`)
      const date = new Date(employmentTo.toString())
      const day = date.getDate().toString()
      const month = (date.getMonth() + 1).toString()
      const year = date.getFullYear().toString()
      
      // Fill day
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_ddlEmpDateToDay')
      await dayElement.waitFor({ state: 'visible', timeout: 15000 })
      await dayElement.selectOption({ value: day })
      
      // Fill month
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_ddlEmpDateToMonth')
      await monthElement.waitFor({ state: 'visible', timeout: 15000 })
      await monthElement.selectOption({ value: month })
      
      // Fill year
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbxEmpDateToYear')
      await yearElement.waitFor({ state: 'visible', timeout: 15000 })
      await yearElement.fill(year)
      
      console.log('✅ Filled employment to date')
    }
    
    // Fill job duties
    const jobDuties = formData['previous_work_education.previous_job_duties']
    if (jobDuties) {
      console.log(`📝 Filling job duties: ${jobDuties}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbDescribeDuties')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(jobDuties.toString())
      console.log('✅ Filled job duties')
    }
    
    console.log('✅ Completed filling previous employment fields')
  }

  /**
   * Fill education fields for Step 11
   */
  private async fillEducationFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling education fields...')
    
    // Wait for the education section to appear
    console.log('⏳ Waiting for education section to appear...')
    await page.waitForTimeout(2000)
    
    // Check if the education section is visible
    const educationSection = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolName')
    await educationSection.waitFor({ state: 'visible', timeout: 15000 })
    console.log('✅ Education section is visible')
    
    // Fill institution name
    const institutionName = formData['previous_work_education.educational_institution_name']
    if (institutionName) {
      console.log(`📝 Filling institution name: ${institutionName}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolName')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(institutionName.toString())
      console.log('✅ Filled institution name')
    }
    
    // Fill address line 1
    const addressLine1 = formData['previous_work_education.educational_address_line1']
    if (addressLine1) {
      console.log(`📝 Filling address line 1: ${addressLine1}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolAddr1')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(addressLine1.toString())
      console.log('✅ Filled address line 1')
    }
    
    // Fill address line 2
    const addressLine2 = formData['previous_work_education.educational_address_line2']
    if (addressLine2) {
      console.log(`📝 Filling address line 2: ${addressLine2}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolAddr2')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(addressLine2.toString())
      console.log('✅ Filled address line 2')
    }
    
    // Fill city
    const city = formData['previous_work_education.educational_city']
    if (city) {
      console.log(`📝 Filling city: ${city}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolCity')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(city.toString())
      console.log('✅ Filled city')
      
      // Add a small delay after filling city to allow state field to render
      await page.waitForTimeout(1000)
    }
    
    // Handle state/province
    const state = formData['previous_work_education.educational_state']
    const stateNA = formData['previous_work_education.educational_state_na']
    if (stateNA === true || state === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for state')
      try {
        const stateNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_cbxEDUC_INST_ADDR_STATE_NA')
        await stateNAElement.waitFor({ state: 'visible', timeout: 10000 })
        await stateNAElement.check()
        console.log('✅ Checked "Does Not Apply" checkbox for state')
      } catch (error) {
        console.log('⚠️ Could not find state NA checkbox, continuing...')
      }
    } else if (state) {
      console.log(`📝 Filling state: ${state}`)
      try {
        // Add a longer delay to ensure the field is rendered
        await page.waitForTimeout(2000)
        
        const stateElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxEDUC_INST_ADDR_STATE')
        
        // Debug: Check if element exists
        const elementCount = await stateElement.count()
        console.log(`🔍 Found ${elementCount} state field elements`)
        
        if (elementCount > 0) {
          // Debug: Check element properties
          const isVisible = await stateElement.isVisible()
          const isEnabled = await stateElement.isEnabled()
          const isDisabled = await stateElement.isDisabled()
          console.log(`🔍 State field - Visible: ${isVisible}, Enabled: ${isEnabled}, Disabled: ${isDisabled}`)
          
          // Try to focus and click first
          await stateElement.focus()
          await page.waitForTimeout(500)
          await stateElement.click()
          await page.waitForTimeout(500)
          
          await stateElement.fill(state.toString())
          console.log('✅ Filled state')
        } else {
          console.log('⚠️ State field element not found')
        }
      } catch (error) {
        console.log('⚠️ Could not find state field, continuing...')
        console.log(`Error details: ${error}`)
      }
    }
    
    // Handle postal code
    const postalCode = formData['previous_work_education.educational_postal_code']
    const postalNA = formData['previous_work_education.educational_postal_na']
    if (postalNA === true || postalCode === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for postal code')
      try {
        const postalNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_cbxEDUC_INST_POSTAL_CD_NA')
        await postalNAElement.waitFor({ state: 'visible', timeout: 10000 })
        await postalNAElement.check()
        console.log('✅ Checked "Does Not Apply" checkbox for postal code')
      } catch (error) {
        console.log('⚠️ Could not find postal code NA checkbox, continuing...')
      }
    } else if (postalCode) {
      console.log(`📝 Filling postal code: ${postalCode}`)
      try {
        // Add a longer delay to ensure the field is rendered
        await page.waitForTimeout(2000)
        
        const postalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxEDUC_INST_POSTAL_CD')
        
        // Debug: Check if element exists
        const elementCount = await postalElement.count()
        console.log(`🔍 Found ${elementCount} postal code field elements`)
        
        if (elementCount > 0) {
          // Debug: Check element properties
          const isVisible = await postalElement.isVisible()
          const isEnabled = await postalElement.isEnabled()
          const isDisabled = await postalElement.isDisabled()
          console.log(`🔍 Postal code field - Visible: ${isVisible}, Enabled: ${isEnabled}, Disabled: ${isDisabled}`)
          
          // Try to focus and click first
          await postalElement.focus()
          await page.waitForTimeout(500)
          await postalElement.click()
          await page.waitForTimeout(500)
          
          await postalElement.fill(postalCode.toString())
          console.log('✅ Filled postal code')
        } else {
          console.log('⚠️ Postal code field element not found')
        }
      } catch (error) {
        console.log('⚠️ Could not find postal code field, continuing...')
        console.log(`Error details: ${error}`)
      }
    }
    
    // Fill country
    const country = formData['previous_work_education.educational_country']
    if (country) {
      console.log(`📝 Filling country: ${country}`)
      try {
        const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_ddlSchoolCountry')
        await element.waitFor({ state: 'visible', timeout: 10000 })
      
        // Use the same country code mapping
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
      } catch (error) {
        console.log('⚠️ Could not find country field, continuing...')
      }
    }
    
    // Fill course of study
    const courseOfStudy = formData['previous_work_education.course_of_study']
    if (courseOfStudy) {
      console.log(`📝 Filling course of study: ${courseOfStudy}`)
      try {
        const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolCourseOfStudy')
        await element.waitFor({ state: 'visible', timeout: 10000 })
        await element.fill(courseOfStudy.toString())
        console.log('✅ Filled course of study')
      } catch (error) {
        console.log('⚠️ Could not find course of study field, continuing...')
      }
    }
    
    // Fill attendance dates (split date)
    const attendanceFrom = formData['previous_work_education.educational_attendance_from']
    if (attendanceFrom) {
      console.log(`📝 Filling attendance from date: ${attendanceFrom}`)
      try {
        const date = new Date(attendanceFrom.toString())
        const day = date.getDate().toString()
        const month = (date.getMonth() + 1).toString()
        const year = date.getFullYear().toString()
        
        // Fill day
        const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_ddlSchoolFromDay')
        await dayElement.waitFor({ state: 'visible', timeout: 10000 })
        await dayElement.selectOption({ value: day })
        
        // Fill month
        const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_ddlSchoolFromMonth')
        await monthElement.waitFor({ state: 'visible', timeout: 10000 })
        await monthElement.selectOption({ value: month })
        
        // Fill year
        const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolFromYear')
        await yearElement.waitFor({ state: 'visible', timeout: 10000 })
        await yearElement.fill(year)
        
        console.log('✅ Filled attendance from date')
      } catch (error) {
        console.log('⚠️ Could not find attendance from date fields, continuing...')
      }
    }
    
    const attendanceTo = formData['previous_work_education.educational_attendance_to']
    if (attendanceTo) {
      console.log(`📝 Filling attendance to date: ${attendanceTo}`)
      try {
        const date = new Date(attendanceTo.toString())
        const day = date.getDate().toString()
        const month = (date.getMonth() + 1).toString()
        const year = date.getFullYear().toString()
        
        // Fill day
        const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_ddlSchoolToDay')
        await dayElement.waitFor({ state: 'visible', timeout: 10000 })
        await dayElement.selectOption({ value: day })
        
        // Fill month
        const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_ddlSchoolToMonth')
        await monthElement.waitFor({ state: 'visible', timeout: 10000 })
        await monthElement.selectOption({ value: month })
        
        // Fill year
        const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolToYear')
        await yearElement.waitFor({ state: 'visible', timeout: 10000 })
        await yearElement.fill(year)
        
        console.log('✅ Filled attendance to date')
      } catch (error) {
        console.log('⚠️ Could not find attendance to date fields, continuing...')
      }
    }
    
    console.log('✅ Completed filling education fields')
  }
}
