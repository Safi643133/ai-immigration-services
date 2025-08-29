import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { FormFieldMapping, getStep17FieldMappings } from '@/lib/form-field-mappings'
import { validateStep17 } from '@/lib/validation/stepValidation'

export class Step17Handler extends BaseStepHandler {
  constructor() {
    super(17, 'Security and Background Information (Part 5)', 'Security and Background Information (Part 5)')
  }

  protected getFieldMappings(): FormFieldMapping[] {
    return getStep17FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const validation = validateStep17(formData)
    return {
      valid: validation.isValid,
      errors: validation.errors
    }
  }

  async handleStep(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting Step 17 - Security and Background Information (Part 5)...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_17',
      'running',
      'Filling Security and Background Information (Part 5)',
      97
    )

    // Fill all Step 17 questions dynamically (only the ones that exist on this form)
    await this.fillChildCustodyQuestion(page, jobId, formData)
    await this.fillVotingViolationQuestion(page, jobId, formData)
    await this.fillRenouncedCitizenshipQuestion(page, jobId, formData)
    await this.fillFormerJVisitorQuestion(page, jobId, formData)
    await this.fillPublicSchoolFStatusQuestion(page, jobId, formData)
    
    console.log('✅ Step 17 form filling completed')
    
    // Click Next button with error checking
    await this.clickStep17NextButton(page, jobId)
  }

  /**
   * Fill child custody question
   */
  private async fillChildCustodyQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const custodyValue = formData['security_background5.withheld_child_custody']
    console.log(`📝 Checking for child custody question...`)
    
    // Check if the question exists on the page
    const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblChildCustody_0')
    const questionExists = await yesElement.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (!questionExists) {
      console.log('⏭️ Child custody question not present on this form, skipping...')
      return
    }
    
    console.log(`📝 Filling child custody question: ${custodyValue}`)
    
    if (custodyValue === 'Yes' || custodyValue === 'Y') {
      // Select Yes
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for child custody')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background5.withheld_child_custody_explain']
      if (explain) {
        console.log(`📝 Filling child custody explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxChildCustody')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled child custody explanation')
      }
    } else if (custodyValue === 'No' || custodyValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblChildCustody_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for child custody')
    }
  }

  /**
   * Fill voting violation question
   */
  private async fillVotingViolationQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const votingValue = formData['security_background5.voted_in_us_violation']
    console.log(`📝 Checking for voting violation question...`)
    
    // Check if the question exists on the page
    const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblVotingViolation_0')
    const questionExists = await yesElement.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (!questionExists) {
      console.log('⏭️ Voting violation question not present on this form, skipping...')
      return
    }
    
    console.log(`📝 Filling voting violation question: ${votingValue}`)
    
    if (votingValue === 'Yes' || votingValue === 'Y') {
      // Select Yes
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for voting violation')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background5.voted_in_us_violation_explain']
      if (explain) {
        console.log(`📝 Filling voting violation explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxVotingViolation')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled voting violation explanation')
      }
    } else if (votingValue === 'No' || votingValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblVotingViolation_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for voting violation')
    }
  }

  /**
   * Fill renounced citizenship question
   */
  private async fillRenouncedCitizenshipQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const renouncedValue = formData['security_background5.renounced_citizenship_to_avoid_tax']
    console.log(`📝 Checking for renounced citizenship question...`)
    
    // Check if the question exists on the page
    const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblRenounceExp_0')
    const questionExists = await yesElement.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (!questionExists) {
      console.log('⏭️ Renounced citizenship question not present on this form, skipping...')
      return
    }
    
    console.log(`📝 Filling renounced citizenship question: ${renouncedValue}`)
    
    if (renouncedValue === 'Yes' || renouncedValue === 'Y') {
      // Select Yes
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for renounced citizenship')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background5.renounced_citizenship_to_avoid_tax_explain']
      if (explain) {
        console.log(`📝 Filling renounced citizenship explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxRenounceExp')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled renounced citizenship explanation')
      }
    } else if (renouncedValue === 'No' || renouncedValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblRenounceExp_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for renounced citizenship')
    }
  }

  /**
   * Fill former J visitor question
   */
  private async fillFormerJVisitorQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const jVisitorValue = formData['security_background5.former_j_visitor_not_fulfilled_2yr']
    console.log(`📝 Checking for former J visitor question...`)
    
    // Check if the question exists on the page
    const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblFormerJVisitor_0')
    const questionExists = await yesElement.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (!questionExists) {
      console.log('⏭️ Former J visitor question not present on this form, skipping...')
      return
    }
    
    console.log(`📝 Filling former J visitor question: ${jVisitorValue}`)
    
    if (jVisitorValue === 'Yes' || jVisitorValue === 'Y') {
      // Select Yes
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for former J visitor')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background5.former_j_visitor_not_fulfilled_2yr_explain']
      if (explain) {
        console.log(`📝 Filling former J visitor explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxFormerJVisitor')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled former J visitor explanation')
      }
    } else if (jVisitorValue === 'No' || jVisitorValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblFormerJVisitor_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for former J visitor')
    }
  }

  /**
   * Fill public school F status question
   */
  private async fillPublicSchoolFStatusQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const schoolValue = formData['security_background5.public_school_f_status_without_reimbursing']
    console.log(`📝 Checking for public school F status question...`)
    
    // Check if the question exists on the page
    const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblAttWoReimb_0')
    const questionExists = await yesElement.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (!questionExists) {
      console.log('⏭️ Public school F status question not present on this form, skipping...')
      return
    }
    
    console.log(`📝 Filling public school F status question: ${schoolValue}`)
    
    if (schoolValue === 'Yes' || schoolValue === 'Y') {
      // Select Yes
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for public school F status')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background5.public_school_f_status_without_reimbursing_explain']
      if (explain) {
        console.log(`📝 Filling public school F status explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAttWoReimb')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled public school F status explanation')
      }
    } else if (schoolValue === 'No' || schoolValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblAttWoReimb_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for public school F status')
    }
  }

  /**
   * Click Next button after Step 17 with error checking
   */
  private async clickStep17NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button after Step 17...')
    try {
      const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
      if (await nextButton.isVisible({ timeout: 10000 })) {
        await nextButton.click()
        console.log('✅ Step 17 Next button clicked')
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
          console.error('❌ Validation errors detected on Step 17')
          await this.takeErrorScreenshot(page, jobId)
          await this.updateJobStatusToFailed(jobId, 'Validation errors on Step 17')
          throw new Error('Form validation failed on Step 17. Check screenshot for details.')
        }
        await this.progressService.updateStepProgress(
          jobId,
          'form_filling_completed',
          'running',
          'Successfully completed all DS-160 form steps',
          100
        )
        await page.screenshot({ path: `after-step17-next-button-click-${jobId}.png` })
        console.log('✅ Successfully completed all DS-160 form steps')
        
        // Mark job as completed
        await this.updateJobStatusToCompleted(jobId, 'DS-160 form filling completed successfully')
        console.log('🎉 Job marked as completed successfully!')
      } else {
        throw new Error('Step 17 Next button not found')
      }
    } catch (error) {
      console.error('❌ Error clicking Step 17 Next button:', error)
      await page.screenshot({ path: `error-step17-next-${jobId}.png` })
      console.log('📸 Screenshot saved: error-step17-next.png')
      throw error
    }
  }
}
