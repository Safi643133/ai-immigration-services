import { BaseStepHandler } from './BaseStepHandler'
import { getStep3FieldMappings, type FormFieldMapping } from '../../../../lib/form-field-mappings'
import type { DS160FormData } from '@/lib/types/ceac'

import { getConditionalFields } from '../../../../app/forms/ds160/conditionalFields'

export class Step3Handler extends BaseStepHandler {
  constructor() {
    super(3, 'Travel Information', 'Travel Information - Step 3')
  }

  protected getFieldMappings(): FormFieldMapping[] {
    return getStep3FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Validate required fields for Step 3
    if (!formData['travel_info.purpose_of_trip']) {
      errors.push('Purpose of trip is required')
    }
    
    if (!formData['travel_info.specific_travel_plans']) {
      errors.push('Specific travel plans is required')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  protected async checkStepSpecificValidationErrors(page: any): Promise<boolean> {
    try {
      console.log(`🔍 Checking for Step 3 specific validation errors...`)
      
      // Check for validation summary
      const validationSummary = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary')
      if (await validationSummary.isVisible({ timeout: 2000 })) {
        const errorText = await validationSummary.textContent()
        console.log(`❌ Step 3 validation errors found: ${errorText}`)
        return true
      }
      
      // Check for specific Step 3 error messages
      const step3ErrorMessages = [
        'Purpose of Trip has not been completed',
        'Specific Travel Plans has not been completed',
        'Arrival Date has not been completed',
        'Departure Date has not been completed',
        'Length of Stay has not been completed'
      ]
      
      for (const errorMessage of step3ErrorMessages) {
        const errorElement = page.locator(`text=${errorMessage}`)
        if (await errorElement.isVisible({ timeout: 1000 })) {
          console.log(`❌ Step 3 specific error found: ${errorMessage}`)
          return true
        }
      }
      
      return false
    } catch (error) {
      console.warn(`⚠️ Error checking Step 3 validation:`, error)
      return false
    }
  }

  /**
   * Step 3 specific logic - handle complex conditional fields and purpose specify
   */
  protected async handleStepSpecificLogic(page: any, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 3 specific logic...')
    
    // Handle purpose specify field after main purpose selection
    const purposeOfTrip = formData['travel_info.purpose_of_trip']
    if (purposeOfTrip) {
      await this.fillPurposeSpecifyField(page, jobId, formData, purposeOfTrip)
    }
    
    // Handle conditional fields based on purpose specify
    await this.fillStep3ConditionalFields(page, jobId, formData)
    
    // Handle specific travel plans conditional fields
    const specificTravelPlans = formData['travel_info.specific_travel_plans']
    if (specificTravelPlans === 'Yes') {
      console.log('📝 Filling specific travel plans conditional fields (Yes)...')
      // Wait for specific travel plans fields to appear after radio selection
      await page.waitForTimeout(2000)
      await this.fillSpecificTravelPlansFields(page, jobId, formData)
    } else if (specificTravelPlans === 'No') {
      console.log('📝 Filling specific travel plans conditional fields (No)...')
      // Wait for no specific travel plans fields to appear after radio selection
      await page.waitForTimeout(2000)
      await this.fillNoSpecificTravelPlansFields(page, jobId, formData)
    }
  }

  /**
   * Override the fillFieldByType method to add specific waits for Step 3
   */
  protected async fillFieldByType(page: any, element: any, fieldMapping: FormFieldMapping, fieldValue: any, formData: DS160FormData, jobId?: string): Promise<void> {
    // Call the parent method first
    await super.fillFieldByType(page, element, fieldMapping, fieldValue, formData, jobId)
    
         // Add Step 3 specific waits for purpose of trip selection
     if (fieldMapping.fieldName === 'travel_info.purpose_of_trip') {
       console.log(`🔍 STEP3 - Purpose of trip selected, waiting for page to update...`)
       
       // Wait for the page to fully update after purpose selection
       try {
         await page.waitForLoadState('networkidle', { timeout: 10000 })
         console.log(`✅ Page updated after purpose selection`)
       } catch (timeoutError) {
         console.log(`ℹ️ Network idle timeout, continuing...`)
       }
       
       // Additional wait to ensure conditional fields are rendered
       await page.waitForTimeout(2000)
       console.log(`🔍 STEP3 - Waiting completed, proceeding to next fields...`)
       
       // Immediately fill the specify field if it exists for this purpose
       await this.fillPurposeSpecifyField(page, jobId!, formData, fieldValue.toString())
       
       // Additional wait after purpose specify to ensure all conditional fields are rendered
       await page.waitForTimeout(3000)
       console.log(`🔍 STEP3 - Additional wait after purpose specify completed`)
     }
     
     // Add Step 3 specific waits for specific travel plans selection
     if (fieldMapping.fieldName === 'travel_info.specific_travel_plans') {
       console.log(`🔍 STEP3 - Specific travel plans selected, waiting for conditional fields to appear...`)
       
       // Wait for conditional fields to appear after radio selection
       await page.waitForTimeout(2000)
       console.log(`🔍 STEP3 - Waiting completed for specific travel plans fields...`)
     }
  }

  /**
   * Fill purpose specify field with complex value mappings
   */
  private async fillPurposeSpecifyField(page: any, jobId: string, formData: DS160FormData, purposeOfTrip: string): Promise<void> {
    console.log(`📝 Checking for purpose specify field for: ${purposeOfTrip}`)
    
    // Check if this purpose has a specify field - ALL visa types have specify options
    const hasSpecifyField = purposeOfTrip && 
                           purposeOfTrip !== 'PLEASE SELECT A VISA CLASS' && 
                           purposeOfTrip !== '' && 
                           formData['travel_info.purpose_specify']
    
    if (hasSpecifyField) {
      console.log(`📝 Purpose '${purposeOfTrip}' has specify field, attempting to fill...`)
      
      // Wait for the specify dropdown to appear after purpose selection
      try {
        const specifyElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_ddlOtherPurpose')
        await specifyElement.waitFor({ state: 'visible', timeout: 10000 })
        
        const purposeSpecify = formData['travel_info.purpose_specify']
        if (purposeSpecify) {
          console.log(`📝 Filling purpose specify: ${purposeSpecify}`)
          
          let selectValue = purposeSpecify
          
          // Handle different purpose types with their specific value mappings
          const purposeValueMappings: Record<string, Record<string, string>> = {
            'CNMI WORKER OR INVESTOR (CW/E2C)': {
              'CNMI TEMPORARY WORKER (CW1)': 'CW1-CW1',
              'CHILD OF CW1 (CW2)': 'CW2-CH',
              'SPOUSE OF CW1 (CW2)': 'CW2-SP',
              'CNMI LONG TERM INVESTOR (E2C)': 'E2C-E2C'
            },
            'FOREIGN GOVERNMENT OFFICIAL (A)': {
              'AMBASSADOR OR PUBLIC MINISTER (A1)': 'A1-AM',
              'CHILD OF AN A1 (A1)': 'A1-CH',
              'CAREER DIPLOMAT/CONSULAR OFFICER (A1)': 'A1-DP',
              'SPOUSE OF AN A1 (A1)': 'A1-SP',
              'CHILD OF AN A2 (A2)': 'A2-CH',
              'FOREIGN OFFICIAL/EMPLOYEE (A2)': 'A2-EM',
              'SPOUSE OF AN A2 (A2)': 'A2-SP',
              'CHILD OF AN A3 (A3)': 'A3-CH',
              'PERSONAL EMP. OF AN A1 OR A2 (A3)': 'A3-EM',
              'SPOUSE OF AN A3 (A3)': 'A3-SP'
            },
            'TEMP. BUSINESS OR PLEASURE VISITOR (B)': {
              'BUSINESS OR TOURISM (TEMPORARY VISITOR) (B1/B2)': 'B1-B2',
              'BUSINESS/CONFERENCE (B1)': 'B1-CF',
              'TOURISM/MEDICAL TREATMENT (B2)': 'B2-TM'
            },
            'ALIEN IN TRANSIT (C)': {
              'CREWMEMBER IN TRANSIT (C1/D)': 'C1-D',
              'TRANSIT (C1)': 'C1-TR',
              'TRANSIT TO U.N. HEADQUARTERS (C2)': 'C2-UN',
              'CHILD OF A C3 (C3)': 'C3-CH',
              'PERSONAL EMP. OF A C3 (C3)': 'C3-EM',
              'FOREIGN OFFICIAL IN TRANSIT (C3)': 'C3-FR',
              'SPOUSE OF A C3 (C3)': 'C3-SP',
              'NONCITIZEN IN TRANSIT LIGHTERING OP. (C4)': 'C4-NO',
              'LIGHTERING CREWMEMBER IN TRANSIT (C4/D3)': 'C4-D3'
            },
            'CREWMEMBER (D)': {
              'CREWMEMBER (D)': 'D-D',
              'LIGHTERING CREWMEMBER (D3)': 'D3-LI'
            },
            'TREATY TRADER OR INVESTOR (E)': {
              'CHILD OF AN E1 (E1)': 'E1-CH',
              'EXECUTIVE/MGR/ESSENTIAL EMP (E1)': 'E1-EX',
              'SPOUSE OF AN E1 (E1)': 'E1-SP',
              'TREATY TRADER (E1)': 'E1-TR',
              'CHILD OF AN E2 (E2)': 'E2-CH',
              'EXECUTIVE/MGR/ESSENTIAL EMP (E2)': 'E2-EX',
              'SPOUSE OF AN E2 (E2)': 'E2-SP',
              'TREATY INVESTOR (E2)': 'E2-TR',
              'CHILD OF AN E3 (E3D)': 'E3D-CH',
              'SPOUSE OF AN E3 (E3D)': 'E3D-SP'
            },
            'ACADEMIC OR LANGUAGE STUDENT (F)': {
              'STUDENT (F1)': 'F1-F1',
              'CHILD OF AN F1 (F2)': 'F2-CH',
              'SPOUSE OF AN F1 (F2)': 'F2-SP'
            },
            'INTERNATIONAL ORGANIZATION REP./EMP. (G)': {
              'CHILD OF A G1 (G1)': 'G1-CH',
              'PRINCIPAL REPRESENTATIVE (G1)': 'G1-G1',
              'SPOUSE OF A G1 (G1)': 'G1-SP',
              'STAFF OF PRINCIPAL REPRESENTATIVE (G1)': 'G1-ST',
              'CHILD OF A G2 (G2)': 'G2-CH',
              'REPRESENTATIVE (G2)': 'G2-RP',
              'SPOUSE OF A G2 (G2)': 'G2-SP',
              'CHILD OF A G3 (G3)': 'G3-CH',
              'NON-RECOGNIZED/-MEMBER COUNTRY REP(G3)': 'G3-RP',
              'SPOUSE OF A G3 (G3)': 'G3-SP',
              'CHILD OF AN G4 (G4)': 'G4-CH',
              'INTERNATIONAL ORG. EMPLOYEE (G4)': 'G4-G4',
              'SPOUSE OF A G4 (G4)': 'G4-SP',
              'CHILD OF A G5 (G5)': 'G5-CH',
              'PERSONAL EMP. OF A G1, 2, 3, OR 4 (G5)': 'G5-EM',
              'SPOUSE OF A G5 (G5)': 'G5-SP'
            },
            'TEMPORARY WORKER (H)': {
              'SPECIALTY OCCUPATION (H1B)': 'H1B-H1B',
              'CHILD OF AN H1B (H4)': 'H4-CH',
              'SPOUSE OF AN H1B (H4)': 'H4-SP',
              'TEMPORARY WORKER (H2A)': 'H2A-H2A',
              'TEMPORARY WORKER (H2B)': 'H2B-H2B',
              'TRAINEE (H3)': 'H3-H3',
              'CHILD OF AN H3 (H4)': 'H4-CH',
              'SPOUSE OF AN H3 (H4)': 'H4-SP'
            },
            'PAROLE-BEN': {
              'PRL-PARCIS': 'PRL-PARCIS'
            }
          }
          
          // Get the value mapping for this purpose type
          const valueMapping = purposeValueMappings[purposeOfTrip]
          if (valueMapping && valueMapping[purposeSpecify]) {
            selectValue = valueMapping[purposeSpecify]
            console.log(`🔍 Mapped purpose specify: ${purposeSpecify} -> ${selectValue}`)
          }
          
                     // Select the purpose specify value
           await specifyElement.selectOption({ value: selectValue })
           console.log(`✅ Selected purpose specify: ${selectValue}`)
           
           // Wait for postback after purpose specify selection
           await this.waitForPostback(page, 'purpose specify selection')
           
           // Additional wait to ensure conditional fields are rendered
           await page.waitForTimeout(2000)
           console.log(`🔍 STEP3 - Waiting completed after purpose specify selection...`)
           
           // Additional wait after purpose specify to ensure all conditional fields are rendered
           await page.waitForTimeout(3000)
           console.log(`🔍 STEP3 - Additional wait after purpose specify completed`)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fill purpose specify field:`, error)
      }
    } else {
      console.log(`ℹ️ No purpose specify field needed for: ${purposeOfTrip}`)
    }
  }

     /**
    * Fill Step 3 conditional fields that appear based on purpose specify
    */
   private async fillStep3ConditionalFields(page: any, jobId: string, formData: DS160FormData): Promise<void> {
     console.log('📝 Handling Step 3 conditional fields...')
     
     // Get the purpose specify value to determine which conditional fields to show
     const purposeSpecify = formData['travel_info.purpose_specify']
     
     if (purposeSpecify) {
       console.log(`🔍 Checking conditional fields for purpose specify: ${purposeSpecify}`)
       
       // Get conditional fields configuration for this purpose specify
       const conditionalFieldsConfig = getConditionalFields(purposeSpecify)
       
       if (conditionalFieldsConfig) {
         console.log(`📝 Found conditional fields configuration for: ${purposeSpecify}`)
         console.log(`📋 Title: ${conditionalFieldsConfig.title}`)
         console.log(`📊 Number of fields: ${conditionalFieldsConfig.fields.length}`)
         
         // Log all fields that will be filled
         console.log('📋 Fields to be filled:')
         conditionalFieldsConfig.fields.forEach((field, index) => {
           console.log(`  ${index + 1}. ${field.label} (${field.key}) - Type: ${field.type}`)
         })
         
         // Wait for conditional fields to appear after specify selection
         console.log('⏳ Waiting for conditional fields to appear after specify selection...')
         await page.waitForTimeout(3000) // Wait 3 seconds for fields to appear
         
         // Fill each conditional field
         for (const fieldConfig of conditionalFieldsConfig.fields) {
           try {
             console.log(`📝 Filling conditional field: ${fieldConfig.label}`)
             
             // Get the field value from form data
             const fieldValue = formData[fieldConfig.key]
             
             if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
               console.log(`⏭️ Skipping empty conditional field: ${fieldConfig.label}`)
               continue
             }
             
             console.log(`📝 Field value: ${fieldValue}`)
             
             // Get the appropriate selector for this field type
             const selector = this.getConditionalFieldSelector(fieldConfig)
             
             if (selector) {
               const element = page.locator(selector)
               
               // Wait for element to be visible (conditional fields may take time to appear)
               await element.waitFor({ state: 'visible', timeout: 15000 })
               
               // Fill based on field type
               switch (fieldConfig.type) {
                 case 'text':
                 case 'tel':
                 case 'email':
                   await element.fill(fieldValue.toString())
                   console.log(`✅ Filled text field: ${fieldConfig.label}`)
                   break
                   
                 case 'select':
                   // Handle select dropdowns
                   await element.selectOption({ value: fieldValue.toString() })
                   console.log(`✅ Selected dropdown option: ${fieldConfig.label}`)
                   break
                   
                 case 'radio':
                   // Handle radio buttons
                   if (fieldValue === 'Yes' || fieldValue === 'No') {
                     await element.check()
                     console.log(`✅ Selected radio option: ${fieldConfig.label} = ${fieldValue}`)
                     
                     // Wait for postback after radio selection
                     await this.waitForPostback(page, `radio selection for ${fieldConfig.label}`)
                   }
                   break
                   
                 case 'date':
                   // Format date for input
                   const dateValue = new Date(fieldValue.toString()).toISOString().split('T')[0]
                   await element.fill(dateValue)
                   console.log(`✅ Filled date field: ${fieldConfig.label}`)
                   break
                   
                 case 'date_split':
                   // Handle split date fields (day, month, year)
                   const { day, month, year } = this.splitDate(fieldValue.toString())
                   
                   if (fieldConfig.key.includes('_day')) {
                     await element.selectOption({ value: day })
                     console.log(`✅ Filled date day: ${day}`)
                   } else if (fieldConfig.key.includes('_month')) {
                     await element.selectOption({ value: month })
                     console.log(`✅ Filled date month: ${month}`)
                   } else if (fieldConfig.key.includes('_year')) {
                     await element.fill(year)
                     console.log(`✅ Filled date year: ${year}`)
                   }
                   break
                   
                 default:
                   // Handle checkbox and other types as text input
                   if (fieldConfig.type as string === 'checkbox') {
                     if (fieldValue === true || fieldValue === 'Yes') {
                       await element.check()
                       console.log(`✅ Checked checkbox: ${fieldConfig.label}`)
                     } else {
                       await element.uncheck()
                       console.log(`✅ Unchecked checkbox: ${fieldConfig.label}`)
                     }
                   } else {
                     console.warn(`⚠️ Unknown field type: ${fieldConfig.type} for ${fieldConfig.label}, treating as text`)
                     await element.fill(fieldValue.toString())
                   }
               }
               
               // Small delay between conditional fields
               await page.waitForTimeout(200)
               
             } else {
               console.warn(`⚠️ No selector found for conditional field: ${fieldConfig.label}`)
               console.warn(`⚠️ Field key: ${fieldConfig.key} - This field will be skipped`)
             }
             
           } catch (error) {
             console.warn(`⚠️ Failed to fill conditional field ${fieldConfig.label}:`, error)
             console.warn(`⚠️ Field key: ${fieldConfig.key}, Type: ${fieldConfig.type}`)
             
             // Try to take a screenshot for debugging
             try {
               const screenshotPath = `error-conditional-field-${fieldConfig.key.replace(/\./g, '-')}-${Date.now()}.png`
               await page.screenshot({ path: screenshotPath, fullPage: true })
               console.log(`📸 Screenshot saved: ${screenshotPath}`)
             } catch (screenshotError) {
               console.warn(`⚠️ Failed to take screenshot:`, screenshotError)
             }
           }
         }
         
         console.log(`✅ Completed filling conditional fields for: ${purposeSpecify}`)
         
         // Handle nested conditional fields for E1/E2 executives
         await this.handleNestedConditionalFields(page, jobId, formData, purposeSpecify)
         
       } else {
         console.log(`ℹ️ No conditional fields configuration found for: ${purposeSpecify}`)
       }
     } else {
       console.log('ℹ️ No purpose specify value found, skipping conditional fields')
     }
   }

  /**
   * Fill specific travel plans fields (when specific travel plans = Yes)
   */
  private async fillSpecificTravelPlansFields(page: any, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling specific travel plans fields...')
    
    // Handle arrival date (split into day, month, year)
    const arrivalDate = formData['travel_info.arrival_date']
    if (arrivalDate) {
      console.log(`📝 Handling split arrival date: ${arrivalDate}`)
      const { day, month, year } = this.splitDate(arrivalDate.toString())
      
      // Fill day dropdown
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlARRIVAL_US_DTEDay')
      await dayElement.waitFor({ state: 'visible', timeout: 10000 })
      await dayElement.selectOption({ value: day })
      console.log(`✅ Filled arrival day: ${day}`)
      
      // Fill month dropdown
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlARRIVAL_US_DTEMonth')
      await monthElement.waitFor({ state: 'visible', timeout: 10000 })
      await monthElement.selectOption({ value: month })
      console.log(`✅ Filled arrival month: ${month}`)
      
      // Fill year input
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxARRIVAL_US_DTEYear')
      await yearElement.waitFor({ state: 'visible', timeout: 10000 })
      await yearElement.fill(year)
      console.log(`✅ Filled arrival year: ${year}`)
    }
    
    // Handle arrival flight
    const arrivalFlight = formData['travel_info.arrival_flight']
    if (arrivalFlight) {
      try {
        const flightElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxArriveFlight')
        await flightElement.waitFor({ state: 'visible', timeout: 10000 })
        await flightElement.fill(arrivalFlight)
        console.log(`✅ Filled arrival flight: ${arrivalFlight}`)
      } catch (error) {
        console.warn(`⚠️ Failed to fill arrival flight:`, error)
      }
    }
    
    // Handle arrival city
    const arrivalCity = formData['travel_info.arrival_city']
    if (arrivalCity) {
      try {
        const cityElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxArriveCity')
        await cityElement.waitFor({ state: 'visible', timeout: 10000 })
        await cityElement.fill(arrivalCity)
        console.log(`✅ Filled arrival city: ${arrivalCity}`)
      } catch (error) {
        console.warn(`⚠️ Failed to fill arrival city:`, error)
      }
    }
    
    // Handle departure date (split into day, month, year)
    const departureDate = formData['travel_info.departure_date']
    if (departureDate) {
      console.log(`📝 Handling split departure date: ${departureDate}`)
      const { day, month, year } = this.splitDate(departureDate.toString())
      
      // Fill day dropdown
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlDEPARTURE_US_DTEDay')
      await dayElement.waitFor({ state: 'visible', timeout: 10000 })
      await dayElement.selectOption({ value: day })
      console.log(`✅ Filled departure day: ${day}`)
      
      // Fill month dropdown
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlDEPARTURE_US_DTEMonth')
      await monthElement.waitFor({ state: 'visible', timeout: 10000 })
      await monthElement.selectOption({ value: month })
      console.log(`✅ Filled departure month: ${month}`)
      
      // Fill year input
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDEPARTURE_US_DTEYear')
      await yearElement.waitFor({ state: 'visible', timeout: 10000 })
      await yearElement.fill(year)
      console.log(`✅ Filled departure year: ${year}`)
    }
    
    // Handle departure flight
    const departureFlight = formData['travel_info.departure_flight']
    if (departureFlight) {
      try {
        const flightElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDepartFlight')
        await flightElement.waitFor({ state: 'visible', timeout: 10000 })
        await flightElement.fill(departureFlight)
        console.log(`✅ Filled departure flight: ${departureFlight}`)
      } catch (error) {
        console.warn(`⚠️ Failed to fill departure flight:`, error)
      }
    }
    
    // Handle departure city
    const departureCity = formData['travel_info.departure_city']
    if (departureCity) {
      try {
        const cityElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDepartCity')
        await cityElement.waitFor({ state: 'visible', timeout: 10000 })
        await cityElement.fill(departureCity)
        console.log(`✅ Filled departure city: ${departureCity}`)
      } catch (error) {
        console.warn(`⚠️ Failed to fill departure city:`, error)
      }
    }
    
    // Handle location
    const location = formData['travel_info.location']
    if (location) {
      try {
        const locationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlTravelLoc_ctl00_tbxSPECTRAVEL_LOCATION')
        await locationElement.waitFor({ state: 'visible', timeout: 10000 })
        await locationElement.fill(location)
        console.log(`✅ Filled location: ${location}`)
      } catch (error) {
        console.warn(`⚠️ Failed to fill location:`, error)
      }
    }
  }

  /**
   * Fill no specific travel plans fields (when specific travel plans = No)
   */
  private async fillNoSpecificTravelPlansFields(page: any, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling no specific travel plans fields...')
    
    // Handle intended arrival date (split into day, month, year)
    const intendedArrivalDate = formData['travel_info.intended_arrival_date']
    if (intendedArrivalDate) {
      console.log(`📝 Handling split intended arrival date: ${intendedArrivalDate}`)
      const { day, month, year } = this.splitDate(intendedArrivalDate.toString())
      
      // Fill day dropdown
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEDay')
      await dayElement.waitFor({ state: 'visible', timeout: 10000 })
      await dayElement.selectOption({ value: day })
      console.log(`✅ Filled intended arrival day: ${day}`)
      
      // Fill month dropdown
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEMonth')
      await monthElement.waitFor({ state: 'visible', timeout: 10000 })
      await monthElement.selectOption({ value: month })
      console.log(`✅ Filled intended arrival month: ${month}`)
      
      // Fill year input
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxTRAVEL_DTEYear')
      await yearElement.waitFor({ state: 'visible', timeout: 10000 })
      await yearElement.fill(year)
      console.log(`✅ Filled intended arrival year: ${year}`)
    }
    
    // Handle length of stay value
    const lengthOfStayValue = formData['travel_info.length_of_stay_value']
    if (lengthOfStayValue) {
      try {
        const valueElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxTRAVEL_LOS')
        await valueElement.waitFor({ state: 'visible', timeout: 10000 })
        await valueElement.fill(lengthOfStayValue.toString())
        console.log(`✅ Filled length of stay value: ${lengthOfStayValue}`)
      } catch (error) {
        console.warn(`⚠️ Failed to fill length of stay value:`, error)
      }
    }
    
    // Handle length of stay unit
    const lengthOfStayUnit = formData['travel_info.length_of_stay_unit']
    if (lengthOfStayUnit) {
      try {
        const unitElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_LOS_CD')
        await unitElement.waitFor({ state: 'visible', timeout: 10000 })
        await unitElement.selectOption({ value: lengthOfStayUnit })
        console.log(`✅ Filled length of stay unit: ${lengthOfStayUnit}`)
      } catch (error) {
        console.warn(`⚠️ Failed to fill length of stay unit:`, error)
      }
    }
  }

  /**
   * Helper function to split a date string into day, month, and year
   */
  private splitDate(dateString: string): { day: string; month: string; year: string } {
    if (!dateString) return { day: '', month: '', year: '' }
    
    try {
      const date = new Date(dateString)
      const day = date.getDate().toString()
      const month = (date.getMonth() + 1).toString() // getMonth() returns 0-11
      const year = date.getFullYear().toString()
      
      return { day, month, year }
    } catch (error) {
      console.warn(`⚠️ Failed to parse date: ${dateString}`)
      return { day: '', month: '', year: '' }
    }
  }

        /**
    * Handle nested conditional fields for E1/E2 executives
    */
   private async handleNestedConditionalFields(page: any, jobId: string, formData: DS160FormData, purposeSpecify: string): Promise<void> {
     console.log('📝 Handling nested conditional fields...')
     
     // Check if this is an E1 or E2 executive visa
     if (purposeSpecify === 'EXECUTIVE/MGR/ESSENTIAL EMP (E1)' || purposeSpecify === 'EXECUTIVE/MGR/ESSENTIAL EMP (E2)') {
       console.log(`🔍 Checking for nested conditional fields for: ${purposeSpecify}`)
       
       // Check if principal visa issued is "Yes"
       const principalVisaIssued = formData['travel_info.principal_visa_issued']
       
       if (principalVisaIssued === 'Yes') {
         console.log('📝 Principal visa issued is "Yes", filling nested fields...')
         
         // Wait a bit for the nested fields to appear after the radio selection
         await page.waitForTimeout(2000)
         
         // Fill principal surnames
         const principalSurnames = formData['travel_info.principal_surnames']
         if (principalSurnames) {
           try {
             const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppSurname')
             await surnamesElement.waitFor({ state: 'visible', timeout: 10000 })
             await surnamesElement.fill(principalSurnames)
             console.log(`✅ Filled principal surnames: ${principalSurnames}`)
           } catch (error) {
             console.warn(`⚠️ Failed to fill principal surnames:`, error)
           }
         }
         
         // Fill principal given names
         const principalGivenNames = formData['travel_info.principal_given_names']
         if (principalGivenNames) {
           try {
             const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppGivenName')
             await givenNamesElement.waitFor({ state: 'visible', timeout: 10000 })
             await givenNamesElement.fill(principalGivenNames)
             console.log(`✅ Filled principal given names: ${principalGivenNames}`)
           } catch (error) {
             console.warn(`⚠️ Failed to fill principal given names:`, error)
           }
         }
         
         // Fill principal date of birth
         const principalDOB = formData['travel_info.principal_date_of_birth']
         if (principalDOB) {
           try {
             const dobElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppDOB')
             await dobElement.waitFor({ state: 'visible', timeout: 10000 })
             await dobElement.fill(principalDOB)
             console.log(`✅ Filled principal date of birth: ${principalDOB}`)
           } catch (error) {
             console.warn(`⚠️ Failed to fill principal date of birth:`, error)
           }
         }
       }
     }
   }

   /**
    * Get the appropriate selector for a conditional field based on its configuration
    */
   private getConditionalFieldSelector(fieldConfig: any): string | null {
     // Map field keys to their corresponding CEAC selectors
     const fieldSelectors: Record<string, string> = {
       // Application receipt/petition number fields
       'travel_info.application_receipt_petition_number': '#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPRIN_APP_PETITION_NUM',
       
       // Mission/Organization fields
       'travel_info.sponsoring_mission_organization': '#ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrg',
       
       // Mission/Organization contact fields
       'travel_info.mission_contact_surnames': '#ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgContactSurname',
       'travel_info.mission_contact_given_names': '#ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgContactGivenName',
       
       // Contact fields - these can be either Principal Applicant or Mission/Organization depending on the specify option
       'travel_info.contact_surnames': '#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppSurname',
       'travel_info.contact_given_names': '#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppGivenName',
       
       // Mission/Organization address fields
       'travel_info.mission_address_line1': '#ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgAddress1',
       'travel_info.mission_address_line2': '#ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgAddress2',
       'travel_info.mission_city': '#ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgCity',
       'travel_info.mission_state': '#ctl00_SiteContentPlaceHolder_FormView1_ddlMissionOrgState',
       'travel_info.mission_zip': '#ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgZipCode',
       'travel_info.mission_phone': '#ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgTel',
       
       // Principal Applicant Information fields
       'travel_info.principal_surnames': '#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppSurname',
       'travel_info.principal_given_names': '#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppGivenName',
       'travel_info.principal_date_of_birth': '#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppDOB',
       
       // U.S. Address fields
       'travel_info.us_address_line1': '#ctl00_SiteContentPlaceHolder_FormView1_txtUSAddressLine1',
       'travel_info.us_address_line2': '#ctl00_SiteContentPlaceHolder_FormView1_txtUSAddressLine2',
       'travel_info.us_city': '#ctl00_SiteContentPlaceHolder_FormView1_txtUSCity',
       'travel_info.us_state': '#ctl00_SiteContentPlaceHolder_FormView1_ddlUSState',
       'travel_info.us_zip_code': '#ctl00_SiteContentPlaceHolder_FormView1_txtUSZipCode',
       'travel_info.phone_number': '#ctl00_SiteContentPlaceHolder_FormView1_txtPhoneNumber',
       
       // Company/Employer fields
       'travel_info.company_employer_name': '#ctl00_SiteContentPlaceHolder_FormView1_txtCompanyEmployerName',
       'travel_info.company_address_line1': '#ctl00_SiteContentPlaceHolder_FormView1_txtCompanyAddressLine1',
       'travel_info.company_address_line2': '#ctl00_SiteContentPlaceHolder_FormView1_txtCompanyAddressLine2',
       'travel_info.company_city': '#ctl00_SiteContentPlaceHolder_FormView1_txtCompanyCity',
       'travel_info.company_state': '#ctl00_SiteContentPlaceHolder_FormView1_ddlCompanyState',
       'travel_info.company_zip_code': '#ctl00_SiteContentPlaceHolder_FormView1_txtCompanyZipCode',
       'travel_info.company_phone_number': '#ctl00_SiteContentPlaceHolder_FormView1_txtCompanyPhoneNumber',
       
       // Visa information fields
       'travel_info.visa_class': '#ctl00_SiteContentPlaceHolder_FormView1_ddlVisaClass',
       'travel_info.visa_number': '#ctl00_SiteContentPlaceHolder_FormView1_txtVisaNumber',
       'travel_info.visa_issue_date': '#ctl00_SiteContentPlaceHolder_FormView1_txtVisaIssueDate',
       'travel_info.visa_expiration_date': '#ctl00_SiteContentPlaceHolder_FormView1_txtVisaExpirationDate',
       
       // Additional fields that might be needed for different visa types
       'travel_info.contact_name': '#ctl00_SiteContentPlaceHolder_FormView1_txtContactName',
       'travel_info.contact_phone': '#ctl00_SiteContentPlaceHolder_FormView1_txtContactPhone',
       'travel_info.contact_email': '#ctl00_SiteContentPlaceHolder_FormView1_txtContactEmail',
       'travel_info.employer_name': '#ctl00_SiteContentPlaceHolder_FormView1_txtEmployerName',
       'travel_info.employer_address': '#ctl00_SiteContentPlaceHolder_FormView1_txtEmployerAddress',
       'travel_info.employer_phone': '#ctl00_SiteContentPlaceHolder_FormView1_txtEmployerPhone',
       'travel_info.employer_email': '#ctl00_SiteContentPlaceHolder_FormView1_txtEmployerEmail',
       'travel_info.visa_category': '#ctl00_SiteContentPlaceHolder_FormView1_ddlVisaCategory',
       'travel_info.visa_type': '#ctl00_SiteContentPlaceHolder_FormView1_ddlVisaType',
       'travel_info.visa_status': '#ctl00_SiteContentPlaceHolder_FormView1_ddlVisaStatus',
       'travel_info.visa_issuing_post': '#ctl00_SiteContentPlaceHolder_FormView1_ddlVisaIssuingPost',
       'travel_info.visa_issuing_country': '#ctl00_SiteContentPlaceHolder_FormView1_ddlVisaIssuingCountry',
       'travel_info.visa_issuing_date': '#ctl00_SiteContentPlaceHolder_FormView1_txtVisaIssuingDate',
       'travel_info.visa_expiry_date': '#ctl00_SiteContentPlaceHolder_FormView1_txtVisaExpiryDate',
       'travel_info.visa_number_old': '#ctl00_SiteContentPlaceHolder_FormView1_txtVisaNumberOld',
       'travel_info.visa_issue_date_old': '#ctl00_SiteContentPlaceHolder_FormView1_txtVisaIssueDateOld',
       'travel_info.visa_expiration_date_old': '#ctl00_SiteContentPlaceHolder_FormView1_txtVisaExpirationDateOld',
       'travel_info.visa_issuing_post_old': '#ctl00_SiteContentPlaceHolder_FormView1_ddlVisaIssuingPostOld',
       'travel_info.visa_issuing_country_old': '#ctl00_SiteContentPlaceHolder_FormView1_ddlVisaIssuingCountryOld',
       
       // Principal visa issued field for E1/E2 executives
       'travel_info.principal_visa_issued': '#ctl00_SiteContentPlaceHolder_FormView1_rblPrincipalVisaIssued'
     }
     
     const selector = fieldSelectors[fieldConfig.key]
     if (selector) {
       console.log(`🔍 Found selector for ${fieldConfig.key}: ${selector}`)
       return selector
     } else {
       console.warn(`⚠️ No selector found for field key: ${fieldConfig.key}`)
       return null
     }
   }

   /**
    * Wait for postback after form interactions
    */
   protected async waitForPostback(page: any, action: string): Promise<void> {
     console.log(`⏳ Waiting for postback after ${action}...`)
     
     try {
       // Wait for network to be idle
       await page.waitForLoadState('networkidle', { timeout: 10000 })
       console.log(`✅ Postback completed after ${action}`)
     } catch (timeoutError) {
       console.log(`ℹ️ No postback detected or timeout after ${action} - continuing`)
     }
     
     // Additional wait for DOM updates
     await page.waitForTimeout(2000)
   }
 }
