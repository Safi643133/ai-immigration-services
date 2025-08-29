import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { getStep14FieldMappings } from '@/lib/form-field-mappings'

export class Step14Handler extends BaseStepHandler {
  constructor() {
    super(14, 'Security and Background Information (Part 2)', 'Filling security and background information part 2')
  }

  protected getFieldMappings() {
    return getStep14FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!formData['security_background2.arrested_or_convicted']?.trim()) {
      errors.push('Arrested or convicted question is required')
    }
    if (!formData['security_background2.controlled_substances_violation']?.trim()) {
      errors.push('Controlled substances violation question is required')
    }
    if (!formData['security_background2.prostitution_or_vice']?.trim()) {
      errors.push('Prostitution or vice question is required')
    }
    if (!formData['security_background2.money_laundering']?.trim()) {
      errors.push('Money laundering question is required')
    }
    if (!formData['security_background2.human_trafficking_committed_or_conspired']?.trim()) {
      errors.push('Human trafficking committed or conspired question is required')
    }
    if (!formData['security_background2.human_trafficking_aided_abetted']?.trim()) {
      errors.push('Human trafficking aided or abetted question is required')
    }
    if (!formData['security_background2.human_trafficking_family_benefited']?.trim()) {
      errors.push('Human trafficking family benefited question is required')
    }

    // Conditional validation for arrested or convicted
    const arrestedOrConvicted = formData['security_background2.arrested_or_convicted']
    if (arrestedOrConvicted === 'Yes') {
      if (!formData['security_background2.arrested_or_convicted_explain']?.trim()) {
        errors.push('Arrested or convicted explanation is required when answer is Yes')
      }
    }

    // Conditional validation for controlled substances violation
    const controlledSubstances = formData['security_background2.controlled_substances_violation']
    if (controlledSubstances === 'Yes') {
      if (!formData['security_background2.controlled_substances_violation_explain']?.trim()) {
        errors.push('Controlled substances violation explanation is required when answer is Yes')
      }
    }

    // Conditional validation for prostitution or vice
    const prostitutionOrVice = formData['security_background2.prostitution_or_vice']
    if (prostitutionOrVice === 'Yes') {
      if (!formData['security_background2.prostitution_or_vice_explain']?.trim()) {
        errors.push('Prostitution or vice explanation is required when answer is Yes')
      }
    }

    // Conditional validation for money laundering
    const moneyLaundering = formData['security_background2.money_laundering']
    if (moneyLaundering === 'Yes') {
      if (!formData['security_background2.money_laundering_explain']?.trim()) {
        errors.push('Money laundering explanation is required when answer is Yes')
      }
    }

    // Conditional validation for human trafficking committed or conspired
    const humanTraffickingCommitted = formData['security_background2.human_trafficking_committed_or_conspired']
    if (humanTraffickingCommitted === 'Yes') {
      if (!formData['security_background2.human_trafficking_committed_or_conspired_explain']?.trim()) {
        errors.push('Human trafficking committed or conspired explanation is required when answer is Yes')
      }
    }

    // Conditional validation for human trafficking aided or abetted
    const humanTraffickingAided = formData['security_background2.human_trafficking_aided_abetted']
    if (humanTraffickingAided === 'Yes') {
      if (!formData['security_background2.human_trafficking_aided_abetted_explain']?.trim()) {
        errors.push('Human trafficking aided or abetted explanation is required when answer is Yes')
      }
    }

    // Conditional validation for human trafficking family benefited
    const humanTraffickingFamily = formData['security_background2.human_trafficking_family_benefited']
    if (humanTraffickingFamily === 'Yes') {
      if (!formData['security_background2.human_trafficking_family_benefited_explain']?.trim()) {
        errors.push('Human trafficking family benefited explanation is required when answer is Yes')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Override the handleStep method to use custom Step 14 logic
   */
  async handleStep(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting Step 14 - Security and Background Information (Part 2)...')
    
    try {
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        'form_step_14',
        'running',
        'Filling Security and Background Information (Part 2)',
        75
      )
      
      // Fill arrested or convicted question
      await this.fillArrestedOrConvictedQuestion(page, jobId, formData)
      
      // Fill controlled substances violation question
      await this.fillControlledSubstancesViolationQuestion(page, jobId, formData)
      
      // Fill prostitution or vice question
      await this.fillProstitutionOrViceQuestion(page, jobId, formData)
      
      // Fill money laundering question
      await this.fillMoneyLaunderingQuestion(page, jobId, formData)
      
      // Fill human trafficking (committed/conspired) question
      await this.fillHumanTraffickingCommittedQuestion(page, jobId, formData)
      
      // Fill human trafficking (aided/abetted) question
      await this.fillHumanTraffickingAidedQuestion(page, jobId, formData)
      
      // Fill human trafficking (family benefited) question
      await this.fillHumanTraffickingFamilyBenefitedQuestion(page, jobId, formData)
      
      console.log('✅ Step 14 form filling completed')
      
      // Click Next button to proceed to Step 15
      await this.clickStep14NextButton(page, jobId)
      
    } catch (error) {
      console.error('❌ Error in Step 14 form filling:', error)
      throw error
    }
  }

  /**
   * Fill arrested or convicted question
   */
  private async fillArrestedOrConvictedQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const arrestedValue = formData['security_background2.arrested_or_convicted']
    console.log(`📝 Filling arrested or convicted question: ${arrestedValue}`)
    
    if (arrestedValue === 'Yes' || arrestedValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblArrested_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for arrested or convicted')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background2.arrested_or_convicted_explain']
      if (explain) {
        console.log(`📝 Filling arrested or convicted explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxArrested')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled arrested or convicted explanation')
      }
    } else if (arrestedValue === 'No' || arrestedValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblArrested_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for arrested or convicted')
    }
  }

  /**
   * Fill controlled substances violation question
   */
  private async fillControlledSubstancesViolationQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const substancesValue = formData['security_background2.controlled_substances_violation']
    console.log(`📝 Filling controlled substances violation question: ${substancesValue}`)
    
    if (substancesValue === 'Yes' || substancesValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblControlledSubstances_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for controlled substances violation')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background2.controlled_substances_violation_explain']
      if (explain) {
        console.log(`📝 Filling controlled substances violation explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxControlledSubstances')
        await explainElement.waitFor({ state: 'visible', timeout: 15015 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled controlled substances violation explanation')
      }
    } else if (substancesValue === 'No' || substancesValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblControlledSubstances_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for controlled substances violation')
    }
  }

  /**
   * Fill prostitution or vice question
   */
  private async fillProstitutionOrViceQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const prostitutionValue = formData['security_background2.prostitution_or_vice']
    console.log(`📝 Filling prostitution or vice question: ${prostitutionValue}`)
    
    if (prostitutionValue === 'Yes' || prostitutionValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblProstitution_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for prostitution or vice')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background2.prostitution_or_vice_explain']
      if (explain) {
        console.log(`📝 Filling prostitution or vice explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxProstitution')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled prostitution or vice explanation')
      }
    } else if (prostitutionValue === 'No' || prostitutionValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblProstitution_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for prostitution or vice')
    }
  }

  /**
   * Fill money laundering question
   */
  private async fillMoneyLaunderingQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const launderingValue = formData['security_background2.money_laundering']
    console.log(`📝 Filling money laundering question: ${launderingValue}`)
    
    if (launderingValue === 'Yes' || launderingValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblMoneyLaundering_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for money laundering')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background2.money_laundering_explain']
      if (explain) {
        console.log(`📝 Filling money laundering explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMoneyLaundering')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled money laundering explanation')
      }
    } else if (launderingValue === 'No' || launderingValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblMoneyLaundering_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for money laundering')
    }
  }

  /**
   * Fill human trafficking (committed/conspired) question
   */
  private async fillHumanTraffickingCommittedQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const traffickingValue = formData['security_background2.human_trafficking_committed_or_conspired']
    console.log(`📝 Filling human trafficking (committed/conspired) question: ${traffickingValue}`)
    
    if (traffickingValue === 'Yes' || traffickingValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblHumanTrafficking_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for human trafficking (committed/conspired)')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background2.human_trafficking_committed_or_conspired_explain']
      if (explain) {
        console.log(`📝 Filling human trafficking (committed/conspired) explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxHumanTrafficking')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled human trafficking (committed/conspired) explanation')
      }
    } else if (traffickingValue === 'No' || traffickingValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblHumanTrafficking_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for human trafficking (committed/conspired)')
    }
  }

  /**
   * Fill human trafficking (aided/abetted) question
   */
  private async fillHumanTraffickingAidedQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const aidedValue = formData['security_background2.human_trafficking_aided_abetted']
    console.log(`📝 Filling human trafficking (aided/abetted) question: ${aidedValue}`)
    
    if (aidedValue === 'Yes' || aidedValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblAssistedSevereTrafficking_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for human trafficking (aided/abetted)')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background2.human_trafficking_aided_abetted_explain']
      if (explain) {
        console.log(`📝 Filling human trafficking (aided/abetted) explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAssistedSevereTrafficking')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled human trafficking (aided/abetted) explanation')
      }
    } else if (aidedValue === 'No' || aidedValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblAssistedSevereTrafficking_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for human trafficking (aided/abetted)')
    }
  }

  /**
   * Fill human trafficking (family benefited) question
   */
  private async fillHumanTraffickingFamilyBenefitedQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const familyValue = formData['security_background2.human_trafficking_family_benefited']
    console.log(`📝 Filling human trafficking (family benefited) question: ${familyValue}`)
    
    if (familyValue === 'Yes' || familyValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblHumanTraffickingRelated_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for human trafficking (family benefited)')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background2.human_trafficking_family_benefited_explain']
      if (explain) {
        console.log(`📝 Filling human trafficking (family benefited) explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxHumanTraffickingRelated')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled human trafficking (family benefited) explanation')
      }
    } else if (familyValue === 'No' || familyValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblHumanTraffickingRelated_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for human trafficking (family benefited)')
    }
  }

  /**
   * Click Next button after Step 14
   */
  private async clickStep14NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button after Step 14...')
    
    try {
      // Look for the Next button
      const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
      
      if (await nextButton.isVisible({ timeout: 10000 })) {
        await nextButton.click()
        console.log('✅ Step 14 Next button clicked')
        
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
          console.error('❌ Validation errors detected on Step 14')
          
          // Take screenshot of the error page
          await this.takeErrorScreenshot(page, jobId)
          
          // Update job status to failed
          await this.updateJobStatusToFailed(jobId, 'Validation errors on Step 14')
          
          // Throw error to stop processing
          throw new Error('Form validation failed on Step 14. Check screenshot for details.')
        }
        
        // Update progress
        await this.progressService.updateStepProgress(
          jobId,
          'form_step_15',
          'running',
          'Successfully navigated to Step 15',
          80
        )
        
        // Take screenshot after navigation
        await page.screenshot({ path: `after-step14-next-button-click-${jobId}.png` })
        
        console.log('✅ Successfully navigated to Step 15')
      } else {
        throw new Error('Step 14 Next button not found')
      }
    } catch (error) {
      console.error('❌ Error clicking Step 14 Next button:', error)
      
      // Take a screenshot for debugging
      await page.screenshot({ path: `error-step14-next-${jobId}.png` })
      console.log('📸 Screenshot saved: error-step14-next.png')
      
      throw error
    }
  }
}
