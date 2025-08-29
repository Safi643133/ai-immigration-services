import { Page } from 'playwright'
import { ProgressService } from '../../../../lib/progress/progress-service'
import { Step1Handler } from '../steps/Step1Handler'
import { Step2Handler } from '../steps/Step2Handler'
import { Step3Handler } from '../steps/Step3Handler'
import { Step4Handler } from '../steps/Step4Handler'
import { Step5Handler } from '../steps/Step5Handler'
import { Step6Handler } from '../steps/Step6Handler'
import { Step7Handler } from '../steps/Step7Handler'
import { Step8Handler } from '../steps/Step8Handler'
import { Step9Handler } from '../steps/Step9Handler'
import { Step10Handler } from '../steps/Step10Handler'
import { Step11Handler } from '../steps/Step11Handler'
import { Step12Handler } from '../steps/Step12Handler'
import { Step13Handler } from '../steps/Step13Handler'
import { Step14Handler } from '../steps/Step14Handler'
import { Step15Handler } from '../steps/Step15Handler'
import { Step16Handler } from '../steps/Step16Handler'
import { Step17Handler } from '../steps/Step17Handler'
import type { DS160FormData } from '@/lib/types/ceac'

export class FormFillingHandler {
  private progressService: ProgressService
  private step1Handler: Step1Handler
  private step2Handler: Step2Handler
  private step3Handler: Step3Handler
  private step4Handler: Step4Handler
  private step5Handler: Step5Handler
  private step6Handler: Step6Handler
  private step7Handler: Step7Handler
  private step8Handler: Step8Handler
  private step9Handler: Step9Handler
  private step10Handler: Step10Handler
  private step11Handler: Step11Handler
  private step12Handler: Step12Handler
  private step13Handler: Step13Handler
  private step14Handler: Step14Handler
  private step15Handler: Step15Handler
  private step16Handler: Step16Handler
  private step17Handler: Step17Handler

  constructor() {
    this.progressService = new ProgressService()
    this.step1Handler = new Step1Handler()
    this.step2Handler = new Step2Handler()
    this.step3Handler = new Step3Handler()
    this.step4Handler = new Step4Handler()
    this.step5Handler = new Step5Handler()
    this.step6Handler = new Step6Handler()
    this.step7Handler = new Step7Handler()
    this.step8Handler = new Step8Handler()
    this.step9Handler = new Step9Handler()
    this.step10Handler = new Step10Handler()
    this.step11Handler = new Step11Handler()
    this.step12Handler = new Step12Handler()
    this.step13Handler = new Step13Handler()
    this.step14Handler = new Step14Handler()
    this.step15Handler = new Step15Handler()
    this.step16Handler = new Step16Handler()
    this.step17Handler = new Step17Handler()
  }

  /**
   * Fill DS-160 form with extracted data
   */
  async fillDS160Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting DS-160 form filling...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_filling_started',
      'running',
      'Filling DS-160 form with extracted data',
      40
    )
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle')
    
    // Validate form data
    const validation = this.validateFormData(formData)
    if (!validation.valid) {
      console.warn('⚠️ Form data validation warnings:', validation.errors)
    }
    
    // Fill Step 1 using the modular step handler
    await this.step1Handler.handleStep(page, jobId, formData)
    
    // Fill Step 2 using the modular step handler
    await this.step2Handler.handleStep(page, jobId, formData)
    
    // Fill Step 3 using the modular step handler
    await this.step3Handler.handleStep(page, jobId, formData)
    
    // Fill Step 4 using the modular step handler
    await this.step4Handler.handleStep(page, jobId, formData)
    
    // Fill Step 5 using the modular step handler
    await this.step5Handler.handleStep(page, jobId, formData)
    
    // Fill Step 6 using the modular step handler
    await this.step6Handler.handleStep(page, jobId, formData)
    
    // Fill Step 7 using the modular step handler
    await this.step7Handler.handleStep(page, jobId, formData)
    
    // Fill Step 8 using the modular step handler
    await this.step8Handler.handleStep(page, jobId, formData)
    
    // Fill Step 9 using the modular step handler
    await this.step9Handler.handleStep(page, jobId, formData)
    
    // Fill Step 10 using the modular step handler
    await this.step10Handler.handleStep(page, jobId, formData)
    
    // Fill Step 11 using the modular step handler
    await this.step11Handler.handleStep(page, jobId, formData)
    
    // Fill Step 12 using the modular step handler
    await this.step12Handler.handleStep(page, jobId, formData)
    
    // Fill Step 13 using the modular step handler
    await this.step13Handler.handleStep(page, jobId, formData)
    
    // Fill Step 14 using the modular step handler
    await this.step14Handler.handleStep(page, jobId, formData)
    
    // Fill Step 15 using the modular step handler
    await this.step15Handler.handleStep(page, jobId, formData)
    
    // Fill Step 16 using the modular step handler
    await this.step16Handler.handleStep(page, jobId, formData)
    
    // Fill Step 17 using the modular step handler
    await this.step17Handler.handleStep(page, jobId, formData)
    
    console.log('✅ All DS-160 form steps completed successfully!')
  }

  /**
   * Validate form data
   */
  private validateFormData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Basic validation
    if (!formData.personal_info) {
      errors.push('Personal information is required')
    }
    
    if (!formData.personal_info?.surnames) {
      errors.push('Surnames are required')
    }
    
    if (!formData.personal_info?.given_names) {
      errors.push('Given names are required')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}
