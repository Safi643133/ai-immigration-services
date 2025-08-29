import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { getStep13FieldMappings } from '@/lib/form-field-mappings'

export class Step13Handler extends BaseStepHandler {
  constructor() {
    super(13, 'Security and Background Information', 'Filling security and background information')
  }

  protected getFieldMappings() {
    return getStep13FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!formData['security_background1.communicable_disease']?.trim()) {
      errors.push('Communicable disease question is required')
    }
    if (!formData['security_background1.mental_or_physical_disorder']?.trim()) {
      errors.push('Mental or physical disorder question is required')
    }
    if (!formData['security_background1.drug_abuser_or_addict']?.trim()) {
      errors.push('Drug abuser or addict question is required')
    }

    // Conditional validation for communicable disease
    const communicableDisease = formData['security_background1.communicable_disease']
    if (communicableDisease === 'Yes') {
      if (!formData['security_background1.communicable_disease_explain']?.trim()) {
        errors.push('Communicable disease explanation is required when answer is Yes')
      }
    }

    // Conditional validation for mental or physical disorder
    const mentalPhysicalDisorder = formData['security_background1.mental_or_physical_disorder']
    if (mentalPhysicalDisorder === 'Yes') {
      if (!formData['security_background1.mental_or_physical_disorder_explain']?.trim()) {
        errors.push('Mental or physical disorder explanation is required when answer is Yes')
      }
    }

    // Conditional validation for drug abuser or addict
    const drugAbuserAddict = formData['security_background1.drug_abuser_or_addict']
    if (drugAbuserAddict === 'Yes') {
      if (!formData['security_background1.drug_abuser_or_addict_explain']?.trim()) {
        errors.push('Drug abuser or addict explanation is required when answer is Yes')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Override the handleStep method to use custom Step 13 logic
   */
  async handleStep(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting Step 13 - Security and Background Information...')
    
    try {
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        'form_step_13',
        'running',
        'Filling Security and Background Information',
        65
      )
      
      // Fill communicable disease question
      await this.fillCommunicableDiseaseQuestion(page, jobId, formData)
      
      // Fill mental/physical disorder question
      await this.fillMentalPhysicalDisorderQuestion(page, jobId, formData)
      
      // Fill drug abuser/addict question
      await this.fillDrugAbuserAddictQuestion(page, jobId, formData)
      
      console.log('✅ Step 13 form filling completed')
      
      // Click Next button to proceed to Step 14
      await this.clickStep13NextButton(page, jobId)
      
    } catch (error) {
      console.error('❌ Error in Step 13 form filling:', error)
      throw error
    }
  }

  /**
   * Fill communicable disease question
   */
  private async fillCommunicableDiseaseQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const diseaseValue = formData['security_background1.communicable_disease']
    console.log(`📝 Filling communicable disease question: ${diseaseValue}`)
    
    if (diseaseValue === 'Yes' || diseaseValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblDisease_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for communicable disease')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background1.communicable_disease_explain']
      if (explain) {
        console.log(`📝 Filling communicable disease explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDisease')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled communicable disease explanation')
      }
    } else if (diseaseValue === 'No' || diseaseValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblDisease_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for communicable disease')
    }
  }

  /**
   * Fill mental/physical disorder question
   */
  private async fillMentalPhysicalDisorderQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const disorderValue = formData['security_background1.mental_or_physical_disorder']
    console.log(`📝 Filling mental/physical disorder question: ${disorderValue}`)
    
    if (disorderValue === 'Yes' || disorderValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblDisorder_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for mental/physical disorder')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background1.mental_or_physical_disorder_explain']
      if (explain) {
        console.log(`📝 Filling mental/physical disorder explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDisorder')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled mental/physical disorder explanation')
      }
    } else if (disorderValue === 'No' || disorderValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblDisorder_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for mental/physical disorder')
    }
  }

  /**
   * Fill drug abuser/addict question
   */
  private async fillDrugAbuserAddictQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const drugValue = formData['security_background1.drug_abuser_or_addict']
    console.log(`📝 Filling drug abuser/addict question: ${drugValue}`)
    
    if (drugValue === 'Yes' || drugValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblDruguser_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for drug abuser/addict')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background1.drug_abuser_or_addict_explain']
      if (explain) {
        console.log(`📝 Filling drug abuser/addict explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDruguser')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled drug abuser/addict explanation')
      }
    } else if (drugValue === 'No' || drugValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblDruguser_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for drug abuser/addict')
    }
  }

  /**
   * Click Next button after Step 13
   */
  private async clickStep13NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button after Step 13...')
    
    try {
      // Look for the Next button
      const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
      
      if (await nextButton.isVisible({ timeout: 10000 })) {
        await nextButton.click()
        console.log('✅ Step 13 Next button clicked')
        
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
          console.error('❌ Validation errors detected on Step 13')
          
          // Take screenshot of the error page
          await this.takeErrorScreenshot(page, jobId)
          
          // Update job status to failed
          await this.updateJobStatusToFailed(jobId, 'Validation errors on Step 13')
          
          // Throw error to stop processing
          throw new Error('Form validation failed on Step 13. Check screenshot for details.')
        }
        
        // Update progress
        await this.progressService.updateStepProgress(
          jobId,
          'form_step_14',
          'running',
          'Successfully navigated to Step 14',
          70
        )
        
        // Take screenshot after navigation (disabled for production)
        if (process.env.ENABLE_DEBUG_SCREENSHOTS === 'true') {
          await page.screenshot({ path: `after-step13-next-button-click-${jobId}.png` })
        }
        
        console.log('✅ Successfully navigated to Step 14')
      } else {
        throw new Error('Step 13 Next button not found')
      }
    } catch (error) {
      console.error('❌ Error clicking Step 13 Next button:', error)
      
      // Take a screenshot for debugging (disabled for production)
      if (process.env.ENABLE_DEBUG_SCREENSHOTS === 'true') {
        await page.screenshot({ path: `error-step13-next-${jobId}.png` })
        console.log('📸 Screenshot saved: error-step13-next.png')
      }
      
      throw error
    }
  }
}
