import { chromium, Browser, Page, BrowserContext } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { getArtifactStorage } from '../../lib/artifact-storage'
import { ProgressService } from '../../lib/progress/progress-service'
import type { DS160FormData } from '../../lib/types/ceac'

/**
 * CEAC Automation Service
 * 
 * This service handles the actual automation of DS-160 form submission
 * to the official CEAC website using Playwright.
 */

export interface SubmissionParams {
  jobId: string
  submissionId: string
  userId: string
  formData: DS160FormData
  embassy: string
  ceacVersion: string
}

export interface SubmissionResult {
  success: boolean
  applicationId?: string
  confirmationId?: string
  screenshots?: string[]
  artifacts?: string[]
  error?: string
}

export interface StatusCheckParams {
  applicationId: string
  confirmationId?: string
}

export interface StatusResult {
  status: string
  lastUpdated?: string
  details?: any
}

export class CeacAutomationService {
  private supabase
  private progressService: ProgressService
  private browser: Browser | null = null
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
  }

  /**
   * Submit DS-160 form to CEAC
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
      await this.initializeBrowser()
      if (!this.browser) {
        throw new Error('Failed to initialize browser')
      }

      // Create browser context with proper settings
      context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        recordVideo: {
          dir: `./artifacts/${params.jobId}/videos/`,
          size: { width: 1920, height: 1080 }
        },
        recordHar: {
          path: `./artifacts/${params.jobId}/session.har`
        }
      })

      // Create page
      page = await context.newPage()

      // Set up page monitoring
      await this.setupPageMonitoring(page, params.jobId)

      // Navigate to CEAC website
      await this.progressService.updateStepProgress(params.jobId, 'navigating_to_ceac', 'running', 'Navigating to CEAC website...', 10)
      console.log('📍 Navigating to CEAC website...')
      await page.goto(this.baseUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      })
      
      // Wait for the page to be interactive
      console.log('⏳ Waiting for page to be interactive...')
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 })
      
      // Wait for location dropdown to be available
      console.log('🔍 Waiting for location dropdown...')
      await page.waitForTimeout(3000) // Give additional time for JS to load

      // Take initial screenshot
      await this.takeScreenshot(page, params.jobId, 'initial-page')

      // Start the DS-160 application process
      await this.progressService.updateStepProgress(params.jobId, 'embassy_selected', 'running', 'Selecting embassy location...', 15)
      console.log('🔄 Starting DS-160 application...')
      await this.startNewApplication(page, params)

      // Fill out the form step by step
      await this.progressService.updateStepProgress(params.jobId, 'form_filling_started', 'running', 'Starting form filling process...', 20)
      console.log('📝 Filling DS-160 form...')
      const applicationId = await this.fillDS160Form(page, params)

      // Review and submit
      await this.progressService.updateStepProgress(params.jobId, 'form_review', 'running', 'Reviewing form before submission...', 85)
      console.log('👀 Reviewing form...')
      await this.reviewForm(page, params)

      await this.progressService.updateStepProgress(params.jobId, 'form_submitted', 'running', 'Submitting form to CEAC...', 90)
      console.log('📤 Submitting form...')
      const confirmationId = await this.submitForm(page, params)

      // Take final screenshot
      await this.takeScreenshot(page, params.jobId, 'final-confirmation')

      // Save session artifacts
      await this.saveSessionArtifacts(context, params.jobId)

      // Mark job as completed
      await this.progressService.markJobCompleted(params.jobId, {
        user_id: params.userId,
        applicationId,
        confirmationId,
        screenshots: [`${params.jobId}/initial-page.png`, `${params.jobId}/final-confirmation.png`],
        artifacts: [`${params.jobId}/session.har`]
      })

      console.log(`✅ DS-160 submission completed successfully`)
      console.log(`📋 Application ID: ${applicationId}`)
      console.log(`🎫 Confirmation ID: ${confirmationId}`)

      return {
        success: true,
        applicationId,
        confirmationId,
        screenshots: [`${params.jobId}/initial-page.png`, `${params.jobId}/final-confirmation.png`],
        artifacts: [`${params.jobId}/session.har`]
      }

    } catch (error) {
      console.error('❌ DS-160 submission failed:', error)
      
      // Mark job as failed
      await this.progressService.markJobFailed(params.jobId, error instanceof Error ? error.message : 'Unknown error occurred')
      
      // Take error screenshot if page is available
      if (page) {
        try {
          await this.takeScreenshot(page, params.jobId, 'error-state')
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
   * Check application status
   */
  async checkApplicationStatus(params: StatusCheckParams): Promise<StatusResult> {
    console.log(`🔍 Checking status for application ${params.applicationId}`)
    
    let context: BrowserContext | null = null
    let page: Page | null = null

    try {
      await this.initializeBrowser()
      if (!this.browser) {
        throw new Error('Failed to initialize browser')
      }

      context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 }
      })

      page = await context.newPage()

      // Navigate to status check page
      await page.goto(`${this.baseUrl}vitalinfo.aspx`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })

      // Enter application ID
      await page.fill('#txtApplicationID', params.applicationId)
      
      if (params.confirmationId) {
        await page.fill('#txtConfirmationNumber', params.confirmationId)
      }

      // Submit status check
      await page.click('#btnCheck')
      await page.waitForLoadState('networkidle')

      // Extract status information
      const statusText = await page.textContent('.status-info') || 'Unknown'
      const lastUpdated = await page.textContent('.last-updated') || undefined

      return {
        status: statusText,
        lastUpdated,
        details: {
          applicationId: params.applicationId,
          confirmationId: params.confirmationId,
          checkedAt: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('❌ Status check failed:', error)
      throw error

    } finally {
      if (context) {
        await context.close()
      }
    }
  }

  /**
   * Initialize browser with optimal settings
   */
  private async initializeBrowser(): Promise<void> {
    if (this.browser) return

    console.log('🌐 Initializing Playwright browser...')
    
    this.browser = await chromium.launch({
      headless: false, // Always show browser window for testing
      slowMo: 500, // Slower actions for better visibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    console.log('✅ Browser initialized')
  }

  /**
   * Set up page monitoring and error handling
   */
  private async setupPageMonitoring(page: Page, jobId: string): Promise<void> {
    // Handle console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.warn(`🖥️ Browser console error: ${msg.text()}`)
      }
    })

    // Handle page errors
    page.on('pageerror', (error) => {
      console.error(`🖥️ Page error: ${error.message}`)
    })

    // Handle network failures
    page.on('requestfailed', (request) => {
      console.warn(`🌐 Request failed: ${request.url()} - ${request.failure()?.errorText}`)
    })

    // Set up request/response logging
    page.on('request', (request) => {
      if (request.url().includes('ceac.state.gov')) {
        console.log(`📤 Request: ${request.method()} ${request.url()}`)
      }
    })

    page.on('response', (response) => {
      if (response.url().includes('ceac.state.gov') && response.status() >= 400) {
        console.warn(`📥 Response error: ${response.status()} ${response.url()}`)
      }
    })
  }

  /**
   * Start new DS-160 application
   */
  private async startNewApplication(page: Page, params: SubmissionParams): Promise<void> {
    console.log('🏛️ Selecting embassy/consulate location...')
    
    // First select the embassy location from the main page dropdown
    await this.selectEmbassyLocation(page, params.embassy, params.jobId)
    
    // Handle CAPTCHA if present - wait for solution before continuing
    const captchaSolution = await this.handleCaptcha(page, params.jobId)
    
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
    
    // Click "START AN APPLICATION" button
    console.log('🚀 Clicking START AN APPLICATION...')
    
    // Update progress to show we're starting the application
    await this.progressService.updateStepProgress(
      params.jobId,
      'form_filling_started',
      'running',
      'Clicking START AN APPLICATION button...',
      20
    )
    
    // Try multiple selectors for the START AN APPLICATION button
    const startButtonSelectors = [
      // Specific ID selector from CEAC
      '#ctl00_SiteContentPlaceHolder_lnkNew',
      // Text-based selector as fallback
      'text=START AN APPLICATION',
      // Role-based selector
      '[role="Button"]:has-text("START AN APPLICATION")',
      // Generic link with text
      'a:has-text("START AN APPLICATION")'
    ]
    
    let startButton = null
    
    for (const selector of startButtonSelectors) {
      try {
        console.log(`🔍 Trying START AN APPLICATION button selector: ${selector}`)
        const button = page.locator(selector).first()
        
        if (await button.isVisible({ timeout: 3000 })) {
          startButton = button
          console.log(`✅ Found START AN APPLICATION button with selector: ${selector}`)
          break
        }
      } catch (error: any) {
        console.log(`❌ Selector ${selector} failed: ${error.message}`)
        continue
      }
    }
    
    if (startButton) {
      // Take screenshot before clicking
      await this.takeScreenshot(page, params.jobId, 'before-start-application')
      
      // Click the button
      await startButton.click()
      
      // Wait for navigation to the DS-160 form page
      await page.waitForLoadState('networkidle')
      
      // Verify we're on the correct page
      const currentUrl = page.url()
      console.log(`📍 Current URL after clicking START AN APPLICATION: ${currentUrl}`)
      
      if (currentUrl.includes('ConfirmApplicationID.aspx') || currentUrl.includes('SecureQuestion')) {
        console.log('✅ Successfully navigated to DS-160 form page')
        
        // Update progress to show successful navigation
        await this.progressService.updateStepProgress(
          params.jobId,
          'form_filling_started',
          'running',
          'Successfully navigated to DS-160 form page',
          25
        )
      } else {
        console.log('⚠️ Navigation may not have worked as expected')
      }
      
      // Take screenshot after navigation
      await this.takeScreenshot(page, params.jobId, 'after-start-application')
      
    } else {
      throw new Error('START AN APPLICATION button not found with any selector')
    }
  }

  /**
   * Select embassy/consulate location from the main page dropdown
   * 
   * CEAC HTML Structure:
   * <select name="ctl00$SiteContentPlaceHolder$ucLocation$ddlLocation" 
   *         id="ctl00_SiteContentPlaceHolder_ucLocation_ddlLocation"
   *         aria-label="Select a Language">
   *   <option value=""> - SELECT ONE - </option>
   *   <option value="ISL">PAKISTAN, ISLAMABAD</option>
   *   <!-- other country options -->
   * </select>
   */
  private async selectEmbassyLocation(page: Page, embassy: string, jobId: string): Promise<void> {
    console.log(`🌍 Selecting embassy location: ${embassy}`)
    
    // Take screenshot of current page state for debugging
    await this.takeScreenshot(page, jobId, 'before-embassy-selection')
    
    // Wait for the page to be fully interactive
    console.log('⏳ Ensuring page is fully loaded...')
    await page.waitForFunction(
      () => document.readyState === 'complete' && 
            typeof window !== 'undefined' && 
            window.location.href.includes('ceac.state.gov'),
      { timeout: 10000 }
    )
    
    // Look for the main location dropdown with specific CEAC selectors
    console.log('🔍 Searching for location dropdown...')
    const possibleSelectors = [
      // Exact selector from CEAC website
      'select[name="ctl00$SiteContentPlaceHolder$ucLocation$ddlLocation"]',
      'select[id="ctl00_SiteContentPlaceHolder_ucLocation_ddlLocation"]',
      // Fallback selectors
      'select[name*="ddlLocation"]',
      'select[id*="ddlLocation"]',
      'select[aria-label="Select a Language"]',
      // Generic selectors as backup
      'select:has(option:text("PAKISTAN, ISLAMABAD"))',
      'select:has(option:text("- SELECT ONE -"))',
      'select:has(option[value="ISL"])',
      // Last resort - any select with many options (embassy list)
      'select:has(option:nth-child(20))'
    ]
    
    let locationDropdown = null
    
    for (const selector of possibleSelectors) {
      try {
        console.log(`🔍 Trying selector: ${selector}`)
        const dropdown = page.locator(selector).first()
        
        if (await dropdown.isVisible({ timeout: 3000 })) {
          // Verify this is actually the embassy dropdown by checking options
          const optionCount = await dropdown.locator('option').count()
          console.log(`📊 Found dropdown with ${optionCount} options`)
          
          if (optionCount > 10) { // Embassy dropdown should have many options
            const firstFewOptions = await dropdown.locator('option').first().textContent()
            console.log(`📝 First option: "${firstFewOptions}"`)
            
            locationDropdown = dropdown
            console.log(`✅ Found location dropdown with selector: ${selector}`)
            break
          }
        }
      } catch (error: any) {
        console.log(`❌ Selector ${selector} failed: ${error.message}`)
        continue
      }
    }
    
    if (!locationDropdown) {
      console.log('🔍 Fallback: Scanning all select elements...')
      
      // Fallback: try to find any select element that contains the expected options
      const allSelects = page.locator('select')
      const count = await allSelects.count()
      console.log(`📊 Found ${count} select elements on page`)
      
      for (let i = 0; i < count; i++) {
        try {
          const select = allSelects.nth(i)
          const options = await select.locator('option').allTextContents()
          console.log(`🔍 Select ${i} has ${options.length} options`)
          
          if (options.length > 10 && options.some(option => option.includes('PAKISTAN'))) {
            locationDropdown = select
            console.log(`✅ Found location dropdown by scanning all selects (index ${i})`)
            console.log(`📋 Sample options: ${options.slice(0, 3).join(', ')}...`)
            break
          }
        } catch (error: any) {
          console.log(`❌ Error checking select ${i}: ${error.message}`)
          continue
        }
      }
    }
    
    if (!locationDropdown) {
      // Take screenshot for debugging
      await this.takeScreenshot(page, jobId, 'dropdown-not-found')
      
      // Get page content for debugging
      const pageTitle = await page.title()
      const url = await page.url()
      console.log(`📄 Current page: ${pageTitle} (${url})`)
      
      throw new Error(`Could not find location dropdown on the page. Page title: ${pageTitle}`)
    }
    
    // Select the embassy location
    try {
      console.log('🎯 Attempting to select embassy location...')
      
      // First, get all available options for debugging
      const allOptions = await locationDropdown.locator('option').allTextContents()
      console.log(`📋 All ${allOptions.length} options available:`)
      allOptions.forEach((option, index) => {
        if (option.includes('PAKISTAN') || index < 5) {
          console.log(`  ${index}: "${option}"`)
        }
      })
      
      // Find the exact Pakistan option
      const pakistanOptions = allOptions.filter(option => 
        option.includes('PAKISTAN') && option.includes('ISLAMABAD')
      )
      
      if (pakistanOptions.length === 0) {
        console.log('❌ No Pakistan, Islamabad option found!')
        throw new Error('PAKISTAN, ISLAMABAD option not available')
      }
      
      const targetOption = pakistanOptions[0]
      console.log(`🎯 Target option found: "${targetOption}"`)
      
      // Try multiple selection methods for reliability
      try {
        // Method 1: Select by exact text label
        await locationDropdown.selectOption({ label: targetOption })
        console.log(`✅ Selected embassy location by label: ${targetOption}`)
      } catch (error) {
        console.log(`⚠️ Label selection failed, trying value selection...`)
        
        // Method 2: Select by value (ISL for Pakistan, Islamabad)
        await locationDropdown.selectOption({ value: 'ISL' })
        console.log(`✅ Selected embassy location by value: ISL`)
      }
      
      // Wait for any dynamic loading
      await page.waitForTimeout(2000)
      
      // Verify selection worked
      const selectedValue = await locationDropdown.inputValue()
      console.log(`🔍 Selected value: "${selectedValue}"`)
      
      // Take screenshot after selection
      await this.takeScreenshot(page, jobId, 'embassy-location-selected')
      
    } catch (error: any) {
      console.error(`❌ Failed to select embassy location: ${error.message}`)
      
      // Take screenshot of error state
      await this.takeScreenshot(page, jobId, 'embassy-selection-error')
      
      throw new Error(`Failed to select embassy location: ${error.message}`)
    }
  }
  
  /**
   * Handle CAPTCHA if present
   */
  private async handleCaptcha(page: Page, jobId: string): Promise<string | null> {
    console.log('🔐 Checking for CAPTCHA...')
    
    // Look for CAPTCHA elements using the specific IDs from CEAC
    const captchaImage = page.locator('#c_default_ctl00_sitecontentplaceholder_uclocation_identifycaptcha1_defaultcaptcha_CaptchaImage')
    const captchaInput = page.locator('#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_txtCodeTextBox')
    
    if (await captchaImage.isVisible({ timeout: 5000 })) {
      console.log('🤖 CAPTCHA detected - capturing image')
      
      // Get CAPTCHA image source
      const captchaImageSrc = await captchaImage.getAttribute('src')
      console.log('📸 CAPTCHA image URL:', captchaImageSrc)
      
      // Convert relative URL to absolute URL
      const fullCaptchaUrl = captchaImageSrc?.startsWith('http') 
        ? captchaImageSrc 
        : `https://ceac.state.gov${captchaImageSrc}`
      
      console.log('📸 Full CAPTCHA image URL:', fullCaptchaUrl)
      
      // Take screenshot of CAPTCHA
      await this.takeScreenshot(page, jobId, 'captcha-challenge')
      
      // Update progress to indicate CAPTCHA is detected
      await this.progressService.handleCaptchaDetection(jobId, fullCaptchaUrl)
      
      // Wait for CAPTCHA solution from user
      const solution = await this.waitForCaptchaSolution(jobId)
      
      if (solution) {
        console.log('🔐 CAPTCHA solution received, filling input field...')
        
        // Fill the CAPTCHA solution
        const success = await this.fillCaptcha(page, solution)
        
        if (success) {
          console.log('✅ CAPTCHA solution filled successfully')
          
          // Update progress to indicate CAPTCHA is solved
          await this.progressService.handleCaptchaSolution(jobId, solution)
          
          // Take a screenshot after filling CAPTCHA
          await this.takeScreenshot(page, jobId, 'captcha-filled')
          
          return solution
        } else {
          console.log('❌ Failed to fill CAPTCHA solution')
          return null
        }
      } else {
        console.log('❌ No CAPTCHA solution received within timeout')
        return null
      }
    } else {
      console.log('✅ No CAPTCHA detected')
      return 'no_captcha' // Return a special value to indicate no CAPTCHA was present
    }
  }

  /**
   * Wait for CAPTCHA solution from user
   */
  private async waitForCaptchaSolution(jobId: string): Promise<string | null> {
    console.log('⏳ Waiting for CAPTCHA solution from user...')
    
    const maxWaitTime = 5 * 60 * 1000 // 5 minutes
    const checkInterval = 2000 // 2 seconds
    let startTime = Date.now()
    let lastChallengeId = null
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        console.log(`🔍 Polling cycle ${Math.floor((Date.now() - startTime) / checkInterval) + 1}...`)
        
        // First check if there's an unsolved CAPTCHA challenge
        const unsolvedChallenge = await this.progressService.getCaptchaChallenge(jobId)
        
        if (!unsolvedChallenge) {
          console.log('📝 No unsolved challenge found, checking for solved challenge...')
          
          // No unsolved challenge, check if there's a solved one
          const solvedChallenge = await this.progressService.getSolvedCaptchaChallenge(jobId)
          
          if (solvedChallenge && solvedChallenge.solution) {
            console.log(`✅ CAPTCHA solution received from user: "${solvedChallenge.solution}"`)
            return solvedChallenge.solution
          } else {
            console.log('📝 No solved challenge found either')
          }
        } else {
          // Check if this is a new challenge (user refreshed CAPTCHA)
          if (lastChallengeId && lastChallengeId !== unsolvedChallenge.id) {
            console.log('🔄 New CAPTCHA challenge detected (user refreshed), resetting timer...')
            // Reset the timer when user refreshes CAPTCHA
            startTime = Date.now()
          }
          lastChallengeId = unsolvedChallenge.id
          console.log('📝 Unsolved challenge still exists, waiting...')
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, checkInterval))
      } catch (error) {
        console.warn('Error checking CAPTCHA solution:', error)
        await new Promise(resolve => setTimeout(resolve, checkInterval))
      }
    }
    
    console.log('⏰ CAPTCHA solution timeout - no solution received within 5 minutes')
    return null
  }

  /**
   * Fill CAPTCHA solution
   */
  private async fillCaptcha(page: Page, solution: string): Promise<boolean> {
    try {
      console.log('🔐 Filling CAPTCHA solution:', solution)
      
      // Try multiple selectors for the CAPTCHA input field
      const captchaInputSelectors = [
        '#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_txtCodeTextBox',
        'input[name="ctl00$SiteContentPlaceHolder$ucLocation$IdentifyCaptcha1$txtCodeTextBox"]',
        'input[aria-label="Enter the Captcha"]',
        'input[type="text"][maxlength="10"]'
      ]
      
      let captchaInput = null
      
      for (const selector of captchaInputSelectors) {
        try {
          console.log(`🔍 Trying CAPTCHA input selector: ${selector}`)
          const input = page.locator(selector).first()
          
          if (await input.isVisible({ timeout: 3000 })) {
            captchaInput = input
            console.log(`✅ Found CAPTCHA input with selector: ${selector}`)
            break
          }
        } catch (error: any) {
          console.log(`❌ Selector ${selector} failed: ${error.message}`)
          continue
        }
      }
      
      if (captchaInput) {
        // Clear the input first
        await captchaInput.clear()
        
        // Fill the solution
        await captchaInput.fill(solution)
        
        // Verify the value was set
        const filledValue = await captchaInput.inputValue()
        console.log(`📝 CAPTCHA input value after filling: "${filledValue}"`)
        
        if (filledValue === solution) {
          console.log('✅ CAPTCHA solution filled successfully')
          return true
        } else {
          console.log('❌ CAPTCHA input value verification failed')
          return false
        }
      } else {
        console.log('❌ CAPTCHA input not found with any selector')
        return false
      }
    } catch (error) {
      console.error('❌ Error filling CAPTCHA:', error)
      return false
    }
  }

  /**
   * Fill DS-160 form with provided data
   */
  private async fillDS160Form(page: Page, params: SubmissionParams): Promise<string> {
    // This is a skeleton implementation
    // The actual implementation would iterate through all 17 steps
    // and fill each field based on the form data
    
    console.log('📝 Starting form filling process...')
    
    // Get field mappings from database
    const fieldMappings = await this.getFieldMappings(params.ceacVersion)
    
    // Fill form step by step
    for (let step = 1; step <= 17; step++) {
      console.log(`📝 Filling step ${step}...`)
      
      await this.fillFormStep(page, step, params.formData, fieldMappings)
      
      // Take screenshot after each step
      await this.takeScreenshot(page, params.jobId, `step-${step}`)
      
      // Navigate to next step
      if (step < 17) {
        await this.navigateToNextStep(page)
      }
    }

    // Extract application ID from the page
    const applicationId = await this.extractApplicationId(page)
    
    return applicationId
  }

  /**
   * Fill a specific form step
   */
  private async fillFormStep(
    page: Page, 
    step: number, 
    formData: DS160FormData, 
    fieldMappings: any[]
  ): Promise<void> {
    // Get field mappings for this step
    const stepMappings = fieldMappings.filter(m => m.step_number === step)
    
    for (const mapping of stepMappings) {
      try {
        const value = this.getNestedValue(formData, mapping.form_field_path)
        
        if (value !== undefined && value !== null && value !== '') {
          await this.fillField(page, mapping, value)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fill field ${mapping.form_field_path}:`, error)
      }
    }
  }

  /**
   * Fill a specific field based on mapping
   */
  private async fillField(page: Page, mapping: any, value: any): Promise<void> {
    const selector = mapping.ceac_selector
    const element = page.locator(selector)

    if (!(await element.isVisible({ timeout: 5000 }))) {
      console.warn(`⚠️ Field not visible: ${selector}`)
      return
    }

    switch (mapping.field_type) {
      case 'text':
      case 'email':
      case 'tel':
        await element.fill(String(value))
        break
        
      case 'select':
        await element.selectOption({ label: String(value) })
        break
        
      case 'radio':
        await page.locator(`${selector}[value="${value}"]`).check()
        break
        
      case 'checkbox':
        if (value === true || value === 'true' || value === 'Yes') {
          await element.check()
        }
        break
        
      case 'date':
        await element.fill(String(value))
        break
        
      default:
        console.warn(`⚠️ Unknown field type: ${mapping.field_type}`)
    }

    // Wait a bit for any dynamic updates
    await page.waitForTimeout(100)
  }

  /**
   * Navigate to next step
   */
  private async navigateToNextStep(page: Page): Promise<void> {
    const nextButton = page.locator('input[value="Next"], input[value="Continue"], #btnNext')
    
    if (await nextButton.first().isVisible()) {
      await nextButton.first().click()
      await page.waitForLoadState('networkidle')
    }
  }

  /**
   * Review completed form
   */
  private async reviewForm(page: Page, params: SubmissionParams): Promise<void> {
    console.log('👀 Reviewing form before submission...')
    
    // Navigate to review page if not already there
    const reviewButton = page.locator('text=Review Application')
    if (await reviewButton.isVisible()) {
      await reviewButton.click()
      await page.waitForLoadState('networkidle')
    }

    // Take screenshot of review page
    await this.takeScreenshot(page, params.jobId, 'review-page')
    
    // Scroll through review to ensure all content is visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
  }

  /**
   * Submit the form
   */
  private async submitForm(page: Page, params: SubmissionParams): Promise<string> {
    console.log('📤 Submitting form to CEAC...')
    
    // Look for submit button
    const submitButton = page.locator('input[value="Submit Application"], #btnSubmit')
    
    if (await submitButton.isVisible()) {
      await submitButton.click()
      await page.waitForLoadState('networkidle')
    }

    // Extract confirmation ID
    const confirmationId = await this.extractConfirmationId(page)
    
    return confirmationId
  }

  /**
   * Extract application ID from page
   */
  private async extractApplicationId(page: Page): Promise<string> {
    // Look for application ID in various possible locations
    const selectors = [
      '#lblApplicationID',
      '.application-id',
      '[data-application-id]'
    ]

    for (const selector of selectors) {
      const element = page.locator(selector)
      if (await element.isVisible({ timeout: 2000 })) {
        const text = await element.textContent()
        if (text) {
          return text.trim()
        }
      }
    }

    // Fallback: look for application ID pattern in page content
    const pageContent = await page.content()
    const appIdMatch = pageContent.match(/Application ID[:\s]*([A-Z0-9]{10,})/i)
    
    if (appIdMatch) {
      return appIdMatch[1]
    }

    throw new Error('Could not extract application ID from page')
  }

  /**
   * Extract confirmation ID from page
   */
  private async extractConfirmationId(page: Page): Promise<string> {
    // Look for confirmation ID in various possible locations
    const selectors = [
      '#lblConfirmationNumber',
      '.confirmation-id',
      '[data-confirmation-id]'
    ]

    for (const selector of selectors) {
      const element = page.locator(selector)
      if (await element.isVisible({ timeout: 2000 })) {
        const text = await element.textContent()
        if (text) {
          return text.trim()
        }
      }
    }

    // Fallback: look for confirmation pattern in page content
    const pageContent = await page.content()
    const confirmMatch = pageContent.match(/Confirmation[:\s]*([A-Z0-9]{10,})/i)
    
    if (confirmMatch) {
      return confirmMatch[1]
    }

    throw new Error('Could not extract confirmation ID from page')
  }

  /**
   * Take screenshot and store as artifact
   */
  private async takeScreenshot(page: Page, jobId: string, name: string): Promise<void> {
    try {
      const screenshot = await page.screenshot({ 
        fullPage: true,
        type: 'png'
      })

      const artifactStorage = getArtifactStorage()
    await artifactStorage.storeArtifact(screenshot, {
        jobId,
        type: 'screenshot',
        filename: `${name}.png`,
        mimeType: 'image/png',
        size: screenshot.length,
        metadata: {
          timestamp: new Date().toISOString(),
          page_url: page.url(),
          viewport: await page.viewportSize()
        }
      })

      console.log(`📸 Screenshot saved: ${name}.png`)
    } catch (error) {
      console.warn(`Failed to take screenshot ${name}:`, error)
    }
  }

  /**
   * Save session artifacts (HAR, video, etc.)
   */
  private async saveSessionArtifacts(context: BrowserContext, jobId: string): Promise<void> {
    try {
      // HAR file is automatically saved by Playwright
      // Video is automatically saved by Playwright
      
      // Save page HTML
      const pages = context.pages()
      if (pages.length > 0) {
        const html = await pages[0].content()
        
        const artifactStorage = getArtifactStorage()
    await artifactStorage.storeArtifact(html, {
          jobId,
          type: 'html',
          filename: 'final-page.html',
          mimeType: 'text/html',
          size: Buffer.from(html).length,
          metadata: {
            timestamp: new Date().toISOString(),
            page_url: pages[0].url()
          }
        })
      }

    } catch (error) {
      console.warn('Failed to save session artifacts:', error)
    }
  }

  /**
   * Get field mappings from database
   */
  private async getFieldMappings(ceacVersion: string): Promise<any[]> {
    const { data: mappings, error } = await this.supabase
      .from('ceac_field_mappings')
      .select('*')
      .eq('ceac_version', ceacVersion)
      .eq('is_active', true)
      .order('step_number')

    if (error) {
      console.warn('Failed to get field mappings:', error)
      return []
    }

    return mappings || []
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key]
    }, obj)
  }

  /**
   * Cleanup browser resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

export default CeacAutomationService
