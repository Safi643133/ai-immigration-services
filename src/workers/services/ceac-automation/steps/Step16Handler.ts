import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { FormFieldMapping, getStep16FieldMappings } from '@/lib/form-field-mappings'
import { validateStep16 } from '@/lib/validation/stepValidation'

export class Step16Handler extends BaseStepHandler {
  constructor() {
    super(16, 'Security and Background Information (Part 4)', 'Security and Background Information (Part 4)')
  }

  protected getFieldMappings(): FormFieldMapping[] {
    return getStep16FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const validation = validateStep16(formData)
    return {
      valid: validation.isValid,
      errors: validation.errors
    }
  }

  async handleStep(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting Step 16 - Security and Background Information (Part 4)...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_16',
      'running',
      'Filling Security and Background Information (Part 4)',
      92
    )

    // Fill all Step 16 questions dynamically
    await this.fillRemovalOrDeportationHearingQuestion(page, jobId, formData)
    await this.fillImmigrationBenefitFraudQuestion(page, jobId, formData)
    await this.fillFailedToAttendHearingQuestion(page, jobId, formData)
    await this.fillVisaViolationQuestion(page, jobId, formData)
    await this.fillRemovedOrDeportedQuestion(page, jobId, formData)
    
    console.log('✅ Step 16 form filling completed')
    
    // Click Next button with error checking
    await this.clickStep16NextButton(page, jobId)
  }

  /**
   * Fill removal or deportation hearing question
   */
  private async fillRemovalOrDeportationHearingQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const hearingValue = formData['security_background4.subject_of_removal_or_deportation_hearing']
    console.log(`📝 Filling removal or deportation hearing question: ${hearingValue}`)
    
    if (hearingValue === 'Yes' || hearingValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblRemovalHearing_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for removal or deportation hearing')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background4.subject_of_removal_or_deportation_hearing_explain']
      if (explain) {
        console.log(`📝 Filling removal or deportation hearing explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxRemovalHearing')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled removal or deportation hearing explanation')
      }
    } else if (hearingValue === 'No' || hearingValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblRemovalHearing_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for removal or deportation hearing')
    }
  }

  /**
   * Fill immigration benefit fraud question
   */
  private async fillImmigrationBenefitFraudQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const fraudValue = formData['security_background4.immigration_benefit_by_fraud_or_misrepresentation']
    console.log(`📝 Filling immigration benefit fraud question: ${fraudValue}`)
    
    if (fraudValue === 'Yes' || fraudValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblImmigrationFraud_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for immigration benefit fraud')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background4.immigration_benefit_by_fraud_or_misrepresentation_explain']
      if (explain) {
        console.log(`📝 Filling immigration benefit fraud explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxImmigrationFraud')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled immigration benefit fraud explanation')
      }
    } else if (fraudValue === 'No' || fraudValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblImmigrationFraud_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for immigration benefit fraud')
    }
  }

  /**
   * Fill failed to attend hearing question
   */
  private async fillFailedToAttendHearingQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const failedValue = formData['security_background4.failed_to_attend_hearing_last_five_years']
    console.log(`📝 Filling failed to attend hearing question: ${failedValue}`)
    
    if (failedValue === 'Yes' || failedValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblFailToAttend_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for failed to attend hearing')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background4.failed_to_attend_hearing_last_five_years_explain']
      if (explain) {
        console.log(`📝 Filling failed to attend hearing explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxFailToAttend')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled failed to attend hearing explanation')
      }
    } else if (failedValue === 'No' || failedValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblFailToAttend_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for failed to attend hearing')
    }
  }

  /**
   * Fill visa violation question
   */
  private async fillVisaViolationQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const violationValue = formData['security_background4.unlawfully_present_or_visa_violation']
    console.log(`📝 Filling visa violation question: ${violationValue}`)
    
    if (violationValue === 'Yes' || violationValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblVisaViolation_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for visa violation')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background4.unlawfully_present_or_visa_violation_explain']
      if (explain) {
        console.log(`📝 Filling visa violation explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxVisaViolation')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled visa violation explanation')
      }
    } else if (violationValue === 'No' || violationValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblVisaViolation_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for visa violation')
    }
  }

  /**
   * Fill removed or deported question
   */
  private async fillRemovedOrDeportedQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const deportValue = formData['security_background4.removed_or_deported_from_any_country']
    console.log(`📝 Filling removed or deported question: ${deportValue}`)
    
    if (deportValue === 'Yes' || deportValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblDeport_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for removed or deported')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background4.removed_or_deported_from_any_country_explain']
      if (explain) {
        console.log(`📝 Filling removed or deported explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDeport_EXPL')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled removed or deported explanation')
      }
    } else if (deportValue === 'No' || deportValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblDeport_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for removed or deported')
    }
  }

  /**
   * Click Next button after Step 16 with error checking
   */
  private async clickStep16NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button after Step 16...')
    try {
      const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
      if (await nextButton.isVisible({ timeout: 10000 })) {
        await nextButton.click()
        console.log('✅ Step 16 Next button clicked')
        try { // Robust navigation waiting
          console.log('⏳ Waiting for page to load after Next button click...')
          await page.waitForLoadState('networkidle', { timeout: 45000 })
          console.log('✅ Page loaded successfully')
        } catch (error) {
          console.log('⚠️ Network idle timeout, trying alternative wait strategy...')
          try {
            await page.waitForLoadState('domcontentloaded', { timeout: 30000 })
            console.log('✅ DOM content loaded')
            await page.waitForTimeout(5000)
            console.log('✅ Additional wait completed')
          } catch (domError) {
            console.log('⚠️ DOM content loaded also timed out, proceeding anyway...')
            await page.waitForTimeout(3000)
          }
        }
        const hasValidationErrors = await this.checkForValidationErrors(page)
        if (hasValidationErrors) {
          console.error('❌ Validation errors detected on Step 16')
          await this.takeErrorScreenshot(page, jobId)
          await this.updateJobStatusToFailed(jobId, 'Validation errors on Step 16')
          throw new Error('Form validation failed on Step 16. Check screenshot for details.')
        }
        await this.progressService.updateStepProgress(
          jobId,
          'form_step_17',
          'running',
          'Successfully navigated to Step 17',
          95
        )
        await page.screenshot({ path: `after-step16-next-button-click-${jobId}.png` })
        console.log('✅ Successfully navigated to Step 17')
      } else {
        throw new Error('Step 16 Next button not found')
      }
    } catch (error) {
      console.error('❌ Error clicking Step 16 Next button:', error)
      await page.screenshot({ path: `error-step16-next-${jobId}.png` })
      console.log('📸 Screenshot saved: error-step16-next.png')
      throw error
    }
  }
}
