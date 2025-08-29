import { BrowserContext, Page } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { ProgressService } from '../../lib/progress/progress-service'
import { BrowserManager } from './ceac-automation/utils/BrowserManager'
import { EmbassySelectionHandler } from './ceac-automation/handlers/EmbassySelectionHandler'
import { CaptchaHandler } from './ceac-automation/handlers/CaptchaHandler'
import { ApplicationIdConfirmationHandler } from './ceac-automation/handlers/ApplicationIdConfirmationHandler'
import { FormFillingHandler } from './ceac-automation/handlers/FormFillingHandler'
import type { SubmissionParams, SubmissionResult, StatusCheckParams, StatusResult } from './ceac-automation/types/interfaces'

/**
 * CEAC Automation Service - Refactored Version
 * 
 * This is the refactored version using modular architecture.
 * Phase 1: Up to embassy selection
 */

export class CeacAutomationService {
  private supabase
  private progressService: ProgressService
  private browserManager: BrowserManager
  private embassyHandler: EmbassySelectionHandler
  private captchaHandler: CaptchaHandler
  private applicationIdHandler: ApplicationIdConfirmationHandler
  private formFillingHandler: FormFillingHandler
  private baseUrl = 'https://ceac.state.gov/GenNIV/Default.aspx'

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    this.progressService = new ProgressService()
    this.browserManager = new BrowserManager()
    this.embassyHandler = new EmbassySelectionHandler()
    this.captchaHandler = new CaptchaHandler()
    this.applicationIdHandler = new ApplicationIdConfirmationHandler()
    this.formFillingHandler = new FormFillingHandler()
  }

  /**
   * Submit DS-160 form to CEAC - Phase 1: Up to embassy selection
   */
  async submitDS160Form(params: SubmissionParams): Promise<SubmissionResult> {
    console.log(`🚀 Starting DS-160 submission for job ${params.jobId}`)
    
    let context: BrowserContext | null = null
    let page: Page | null = null

    try {
      // Initialize progress tracking
      await this.progressService.initializeJobProgress(params.jobId, params.userId)
      
      // Initialize browser
      await this.progressService.updateStepProgress(params.jobId, 'browser_initialized', 'initializing', 'Initializing browser...', 5)
      await this.browserManager.initializeBrowser()

      // Create browser context with proper settings
      context = await this.browserManager.createBrowserContext(params.jobId)

      // Create page
      page = await this.browserManager.createPage(context)

      // Navigate to CEAC website
      await this.progressService.updateStepProgress(params.jobId, 'navigating_to_ceac', 'running', 'Navigating to CEAC website...', 10)
      await this.browserManager.navigateToPage(page, this.baseUrl, 'CEAC website')
      
      // Wait for location dropdown to be available
      console.log('🔍 Waiting for location dropdown...')
      await page.waitForTimeout(3000) // Give additional time for JS to load

      // Take initial screenshot
      await this.browserManager.takeScreenshot(page, params.jobId, 'initial-page')

      // Start the DS-160 application process
      await this.progressService.updateStepProgress(params.jobId, 'embassy_selected', 'running', 'Selecting embassy location...', 15)
      console.log('🔄 Starting DS-160 application...')
      
      // Select embassy location
      await this.embassyHandler.selectEmbassyLocation(page, params.embassy, params.jobId)

      // Wait for page reload after embassy selection
      console.log('⏳ Waiting for page reload after embassy selection...')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000) // Additional wait for any dynamic content

      // Handle CAPTCHA first (if present after embassy selection)
      console.log('🔍 Checking for CAPTCHA after embassy selection...')
      const captchaSolution = await this.captchaHandler.handleCaptcha(page, params.jobId)
      
      // If CAPTCHA was detected but not solved, stop the automation
      if (captchaSolution === null) {
        console.log('❌ CAPTCHA was detected but not solved - stopping automation')
        throw new Error('CAPTCHA solution required but not provided within timeout')
      }
      
      // If no CAPTCHA was detected, continue normally
      if (captchaSolution === 'no_captcha') {
        console.log('✅ No CAPTCHA detected - continuing normally')
      } else {
        console.log('✅ CAPTCHA solved successfully - continuing')
      }

      // Update progress to show we're ready for form filling
      await this.progressService.updateStepProgress(
        params.jobId,
        'form_filling_started',
        'running',
        'Ready to start form filling...',
        20
      )
      
      console.log('✅ Phase 2 completed: CAPTCHA handled and START AN APPLICATION button clicked by CaptchaHandler')
      
      // Get current URL after CAPTCHA handling
      let currentUrl = page.url()
      console.log(`📍 Current URL after CAPTCHA handling: ${currentUrl}`)
      
      // Phase 3: Handle Application ID Confirmation
      console.log('🆔 Starting Phase 3: Application ID Confirmation...')
      
      // Check if we're on the Application ID Confirmation page
      if (currentUrl.includes('ConfirmApplicationID.aspx') || currentUrl.includes('SecureQuestion')) {
        console.log('✅ Detected Application ID Confirmation page')
        
        // Handle Application ID Confirmation
        await this.applicationIdHandler.handleApplicationIdConfirmation(page, params.jobId)
        
        // Update current URL after Application ID Confirmation
        currentUrl = page.url()
        console.log(`📍 Current URL after Application ID Confirmation: ${currentUrl}`)
        
        console.log('✅ Phase 3 completed: Successfully handled Application ID Confirmation')
        
        // Phase 4: Handle DS-160 Form Filling
        console.log('📝 Starting Phase 4: DS-160 Form Filling...')
        
        // Fill DS-160 form with extracted data
        await this.formFillingHandler.fillDS160Form(page, params.jobId, params.formData)
        
        console.log('✅ Phase 4 completed: Successfully started DS-160 form filling')
      } else {
        console.log('⚠️ Not on Application ID Confirmation page, checking if we need to wait...')
        
        // Wait for URL to change to the confirmation page
        try {
          await page.waitForURL(url => 
            url.toString().includes('ConfirmApplicationID.aspx') || url.toString().includes('SecureQuestion'),
            { timeout: 10000 }
          )
          currentUrl = page.url()
          console.log(`📍 URL changed to Application ID Confirmation page: ${currentUrl}`)
          
          // Handle Application ID Confirmation
          await this.applicationIdHandler.handleApplicationIdConfirmation(page, params.jobId)
          
          // Update current URL after Application ID Confirmation
          currentUrl = page.url()
          console.log(`📍 Current URL after Application ID Confirmation: ${currentUrl}`)
          
          console.log('✅ Phase 3 completed: Successfully handled Application ID Confirmation')
          
          // Phase 4: Handle DS-160 Form Filling
          console.log('📝 Starting Phase 4: DS-160 Form Filling...')
          
          // Fill DS-160 form with extracted data
          await this.formFillingHandler.fillDS160Form(page, params.jobId, params.formData)
          
          console.log('✅ Phase 4 completed: Successfully started DS-160 form filling')
        } catch (error) {
          console.log('⚠️ Did not navigate to Application ID Confirmation page as expected')
        }
      }
      
      // Save session artifacts
      await this.browserManager.saveSessionArtifacts(context, params.jobId)

      return {
        success: true,
        screenshots: [
          `${params.jobId}/initial-page.png`, 
          `${params.jobId}/before-start-application.png`
        ],
        artifacts: [`${params.jobId}/session.har`]
      }

    } catch (error) {
      console.error('❌ DS-160 submission failed:', error)
      
      // Mark job as failed
      await this.progressService.markJobFailed(params.jobId, error instanceof Error ? error.message : 'Unknown error occurred')
      
      // Take error screenshot if page is available
      if (page) {
        try {
          await this.browserManager.takeScreenshot(page, params.jobId, 'error-state')
        } catch (screenshotError) {
          console.warn('Failed to take error screenshot:', screenshotError)
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }

    } finally {
      // Cleanup
      if (context) {
        try {
          await context.close()
        } catch (error) {
          console.warn('Failed to close browser context:', error)
        }
      }
    }
  }

  /**
   * Check application status (placeholder for now)
   */
  async checkApplicationStatus(params: StatusCheckParams): Promise<StatusResult> {
    // This will be implemented in later phases
    return {
      status: 'not_implemented',
      lastUpdated: new Date().toISOString(),
      details: { message: 'Status checking not implemented in Phase 1' }
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.browserManager.cleanup()
  }
}
