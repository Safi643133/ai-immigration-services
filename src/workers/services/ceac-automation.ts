import { chromium, Browser, Page, BrowserContext } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { getArtifactStorage } from '../../lib/artifact-storage'
import { ProgressService } from '../../lib/progress/progress-service'
import type { DS160FormData } from '../../lib/types/ceac'
import { getFieldMapping, getAllFieldMappings, validateFormData } from '../../lib/form-field-mappings'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname, basename } from 'path'
import { createHash } from 'crypto'

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
      await this.fillDS160Form(page, params.jobId, params.formData)

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
        confirmationId,
        screenshots: [`${params.jobId}/initial-page.png`, `${params.jobId}/final-confirmation.png`],
        artifacts: [`${params.jobId}/session.har`]
      })

      console.log(`✅ DS-160 submission completed successfully`)
      console.log(`🎫 Confirmation ID: ${confirmationId}`)

      return {
        success: true,
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
      
      // Wait a bit more for potential redirects
      await page.waitForTimeout(2000)
      
      // Check if we're on the Application ID Confirmation page
      let currentUrl = page.url()
      console.log(`📍 Current URL after clicking START AN APPLICATION: ${currentUrl}`)
      
      // If we're still on the main page, wait for navigation to complete
      if (currentUrl.includes('Default.aspx') && !currentUrl.includes('ConfirmApplicationID')) {
        console.log('⏳ Waiting for navigation to Application ID Confirmation page...')
        
        // Wait for URL to change to the confirmation page
        try {
          await page.waitForURL(url => 
            url.toString().includes('ConfirmApplicationID.aspx') || url.toString().includes('SecureQuestion'),
            { timeout: 10000 }
          )
          currentUrl = page.url()
          console.log(`📍 URL changed to: ${currentUrl}`)
        } catch (error) {
          console.log('⚠️ URL did not change as expected, checking current page content...')
        }
      }
      
      // Check if we're on the Application ID Confirmation page by URL or content
      const isConfirmationPage = currentUrl.includes('ConfirmApplicationID.aspx') || 
                                currentUrl.includes('SecureQuestion') ||
                                await page.locator('#ctl00_SiteContentPlaceHolder_lblBarcode').isVisible({ timeout: 2000 }).catch(() => false)
      
      if (isConfirmationPage) {
        console.log('✅ Successfully navigated to Application ID Confirmation page')
        
        // Update progress to show successful navigation
        await this.progressService.updateStepProgress(
          params.jobId,
          'application_id_confirmation',
          'running',
          'Navigated to Application ID Confirmation page',
          25
        )
        
        // Handle Application ID Confirmation step
        await this.handleApplicationIdConfirmation(page, params.jobId)
        
        // Fill DS-160 form with extracted data
        await this.fillDS160Form(page, params.jobId, params.formData)
        
      } else {
        console.log('⚠️ Navigation may not have worked as expected')
        console.log('🔍 Checking if we need to handle Application ID Confirmation manually...')
        
        // Try to detect if we're on the confirmation page by looking for the Application ID element
        const appIdElement = page.locator('#ctl00_SiteContentPlaceHolder_lblBarcode')
        if (await appIdElement.isVisible({ timeout: 3000 })) {
          console.log('✅ Found Application ID element - we are on the confirmation page')
          await this.handleApplicationIdConfirmation(page, params.jobId)
          
          // Fill DS-160 form with extracted data
          await this.fillDS160Form(page, params.jobId, params.formData)
        } else {
          console.log('❌ Could not detect Application ID Confirmation page')
        }
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
      console.log('�� CAPTCHA detected - taking screenshot')
      
      // Take a screenshot of the CAPTCHA area
      const captchaScreenshotPath = await this.takeCaptchaScreenshot(page, jobId)
      
      if (captchaScreenshotPath) {
        console.log('📸 CAPTCHA screenshot saved:', captchaScreenshotPath)
        
        // Update progress to indicate CAPTCHA is detected with screenshot
        await this.progressService.handleCaptchaDetection(jobId, captchaScreenshotPath)
        
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
        console.log('❌ Failed to take CAPTCHA screenshot')
        return null
      }
    } else {
      console.log('✅ No CAPTCHA detected')
      return 'no_captcha' // Return a special value to indicate no CAPTCHA was present
    }
  }

  /**
   * Take a screenshot of the CAPTCHA area
   */
  private async takeCaptchaScreenshot(page: Page, jobId: string): Promise<string | null> {
    try {
      console.log('📸 Taking CAPTCHA screenshot...')
      
      // Locate the CAPTCHA image element
      const captchaImage = page.locator('#c_default_ctl00_sitecontentplaceholder_uclocation_identifycaptcha1_defaultcaptcha_CaptchaImage')
      
      if (await captchaImage.isVisible({ timeout: 5000 })) {
        // Take screenshot directly to buffer (no local file)
        const screenshotBuffer = await captchaImage.screenshot({ 
          type: 'png'
        })
        
        console.log('✅ CAPTCHA screenshot captured to buffer')
        
        // Store the screenshot as an artifact in Supabase Storage
        try {
          const artifactStorage = getArtifactStorage()
          const filename = `captcha-${Date.now()}.png`
          
          const storedArtifact = await artifactStorage.storeArtifact(
            screenshotBuffer,
            {
              jobId,
              type: 'screenshot',
              filename: filename,
              mimeType: 'image/png',
              size: screenshotBuffer.length,
              checksum: createHash('md5').update(screenshotBuffer).digest('hex'),
              metadata: {
                captured_at: new Date().toISOString(),
                captcha_type: 'ceac_ds160'
              }
            }
          )
          
          console.log('✅ CAPTCHA screenshot stored as artifact:', storedArtifact.id)
          
          // Return the public URL for the frontend to access
          return storedArtifact.publicUrl || `artifacts/${jobId}/${filename}`
        } catch (artifactError) {
          console.warn('Failed to store CAPTCHA screenshot as artifact:', artifactError)
          return null
        }
      } else {
        console.log('❌ CAPTCHA image not visible for screenshot')
        return null
      }
    } catch (error) {
      console.error('❌ Error taking CAPTCHA screenshot:', error)
      return null
    }
  }

  /**
   * Refresh CAPTCHA on the CEAC website
   */
  private async refreshCaptchaOnCeac(page: Page): Promise<void> {
    try {
      console.log('🔄 Refreshing CAPTCHA on CEAC website...')
      
      // Look for the CAPTCHA refresh button/link
      const refreshSelectors = [
        // Common CAPTCHA refresh button selectors
        'img[alt="Refresh"]',
        'img[title="Refresh"]',
        'a[title="Refresh"]',
        'button[title="Refresh"]',
        // CEAC specific selectors
        '#c_default_ctl00_sitecontentplaceholder_uclocation_identifycaptcha1_defaultcaptcha_RefreshButton',
        'input[type="image"][alt*="Refresh"]',
        // Generic refresh button
        'input[type="image"]',
        'img[src*="refresh"]',
        'img[src*="reload"]'
      ]
      
      let refreshButton = null
      
      for (const selector of refreshSelectors) {
        try {
          console.log(`🔍 Trying CAPTCHA refresh selector: ${selector}`)
          const button = page.locator(selector).first()
          
          if (await button.isVisible({ timeout: 2000 })) {
            refreshButton = button
            console.log(`✅ Found CAPTCHA refresh button with selector: ${selector}`)
            break
          }
        } catch (error: any) {
          console.log(`❌ Selector ${selector} failed: ${error.message}`)
          continue
        }
      }
      
      if (refreshButton) {
        // Click the refresh button
        await refreshButton.click()
        console.log('✅ CAPTCHA refresh button clicked')
        
        // Wait for the new CAPTCHA image to load
        await page.waitForTimeout(3000)
        
        // Verify the CAPTCHA image has changed
        const captchaImage = page.locator('#c_default_ctl00_sitecontentplaceholder_uclocation_identifycaptcha1_defaultcaptcha_CaptchaImage')
        if (await captchaImage.isVisible()) {
          console.log('✅ CAPTCHA refreshed successfully on CEAC website')
        } else {
          console.log('⚠️ CAPTCHA refresh may not have worked as expected')
        }
      } else {
        console.log('⚠️ Could not find CAPTCHA refresh button - trying page refresh')
        
        // Fallback: refresh the entire page
        await page.reload()
        await page.waitForLoadState('domcontentloaded')
        
        // Re-select embassy location after page refresh
        // This will be handled by the calling method
      }
    } catch (error) {
      console.error('❌ Error refreshing CAPTCHA on CEAC website:', error)
      // Don't throw error, just log it and continue
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
        
        // Check for CAPTCHA refresh request first
        const refreshRequest = await this.checkForCaptchaRefreshRequest(jobId)
        if (refreshRequest) {
          console.log('🔄 CAPTCHA refresh requested by user - taking new screenshot')
          
          // Get the current page from the browser context
          const pages = this.browser?.contexts()[0]?.pages()
          if (pages && pages.length > 0) {
            const page = pages[0]
            
            // Take a new CAPTCHA screenshot
            const newCaptchaScreenshotPath = await this.takeCaptchaScreenshot(page, jobId)
            
            if (newCaptchaScreenshotPath) {
              console.log('📸 New CAPTCHA screenshot taken:', newCaptchaScreenshotPath)
              
              // Update the current challenge with the new screenshot path
              const currentChallenge = await this.progressService.getCaptchaChallenge(jobId)
              if (currentChallenge) {
                await this.progressService.updateCaptchaImageUrl(jobId, newCaptchaScreenshotPath)
                console.log('✅ Updated CAPTCHA challenge with new screenshot')
              }
            } else {
              console.log('❌ Failed to take new CAPTCHA screenshot')
            }
          }
          
          // Reset timer after refresh
          startTime = Date.now()
          continue
        }
        
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
            console.log(`🆕 New challenge ID: ${unsolvedChallenge.id}`)
            // Reset the timer when user refreshes CAPTCHA
            startTime = Date.now()
          }
          lastChallengeId = unsolvedChallenge.id
          console.log(`📝 Unsolved challenge still exists (ID: ${unsolvedChallenge.id}), waiting...`)
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
   * Check if a CAPTCHA refresh has been requested
   */
  private async checkForCaptchaRefreshRequest(jobId: string): Promise<boolean> {
    try {
      // Get the latest progress updates
      const progressHistory = await this.progressService.getProgressHistory(jobId)
      
      // Look for recent CAPTCHA refresh request
      const refreshRequest = progressHistory.find(update => 
        update.step_name === 'captcha_refresh_requested' &&
        update.status === 'pending' &&
        new Date(update.created_at) > new Date(Date.now() - 30000) // Within last 30 seconds
      )
      
      return !!refreshRequest
    } catch (error) {
      console.warn('Error checking for CAPTCHA refresh request:', error)
      return false
    }
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
   * Handle Application ID Confirmation page
   * 
   * This page contains:
   * 1. Privacy Act checkbox that must be checked
   * 2. Security question answer input
   * 3. Continue button to proceed
   */
  private async handleApplicationIdConfirmation(page: Page, jobId: string): Promise<void> {
    console.log('🔐 Handling Application ID Confirmation...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'application_id_confirmation',
      'running',
      'Processing Application ID Confirmation page',
      30
    )
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle')
    
    // Take screenshot before processing
    await this.takeScreenshot(page, jobId, 'application-id-confirmation-page')
    
    // Step 1: Extract Application ID and Date
    console.log('🆔 Extracting Application ID and Date...')
    const applicationIdElement = page.locator('#ctl00_SiteContentPlaceHolder_lblBarcode')
    const dateElement = page.locator('#ctl00_SiteContentPlaceHolder_lblDate')
    
    let applicationId = ''
    let applicationDate = ''
    
    if (await applicationIdElement.isVisible({ timeout: 5000 })) {
      applicationId = await applicationIdElement.textContent() || ''
      console.log(`✅ Application ID extracted: ${applicationId}`)
    } else {
      console.log('⚠️ Application ID element not found')
    }
    
    if (await dateElement.isVisible({ timeout: 5000 })) {
      applicationDate = await dateElement.textContent() || ''
      console.log(`✅ Application Date extracted: ${applicationDate}`)
    } else {
      console.log('⚠️ Application Date element not found')
    }
    
    // Store Application ID in database
    if (applicationId) {
      await this.storeApplicationId(jobId, applicationId, applicationDate)
      
      // Update progress for Application ID extraction
      await this.progressService.updateStepProgress(
        jobId,
        'application_id_extracted',
        'running',
        `Application ID extracted: ${applicationId}`,
        32
      )
    }
    
    // Step 2: Check the Privacy Act checkbox
    console.log('📋 Checking Privacy Act checkbox...')
    const privacyCheckbox = page.locator('#ctl00_SiteContentPlaceHolder_chkbxPrivacyAct')
    
    if (await privacyCheckbox.isVisible({ timeout: 5000 })) {
      await privacyCheckbox.check()
      console.log('✅ Privacy Act checkbox checked')
      
      // Wait for the postback to complete
      await page.waitForLoadState('networkidle')
    } else {
      console.log('⚠️ Privacy Act checkbox not found, continuing...')
    }
    
    // Step 2: Generate and fill security question answer
    console.log('🔒 Generating security question answer...')
    const securityAnswer = this.generateRandomAnswer()
    
    // Store the security answer in Supabase for future retrieval
    await this.storeSecurityAnswer(jobId, securityAnswer)
    
    // Wait for the page to fully load after the postback
    console.log('⏳ Waiting for page to load after checkbox postback...')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000) // Increased wait for dynamic content
    
    // Wait for the security answer input to become enabled after checkbox
    console.log('⏳ Waiting for security answer input to become enabled...')
    await page.waitForTimeout(3000) // Additional wait for the input to become enabled
    
    // Try multiple selectors for the security answer input
    const possibleSelectors = [
      '#ctl00_SiteContentPlaceHolder_txtAnswer',
      'input[name="ctl00$SiteContentPlaceHolder$txtAnswer"]',
      'input[type="text"][id*="txtAnswer"]',
      'input[type="text"][name*="txtAnswer"]',
      'input[placeholder*="answer" i]',
      'input[placeholder*="security" i]'
    ]
    
    let answerInput = null
    let foundSelector = null
    
    // First, try to find and wait for the input to become enabled
    for (const selector of possibleSelectors) {
      try {
        console.log(`🔍 Trying security answer selector: ${selector}`)
        const input = page.locator(selector)
        
        // Check if element exists first
        const count = await input.count()
        if (count === 0) {
          console.log(`❌ Selector ${selector} not found`)
          continue
        }
        
        // Wait for the element to become visible and enabled
        console.log(`⏳ Waiting for element to become visible and enabled...`)
        await input.waitFor({ state: 'visible', timeout: 10000 })
        
        // Check if element is enabled
        const isEnabled = await input.isEnabled({ timeout: 5000 })
        console.log(`📊 Element status - Enabled: ${isEnabled}`)
        
        if (isEnabled) {
          answerInput = input
          foundSelector = selector
          console.log(`✅ Found enabled security answer input with selector: ${selector}`)
          break
        } else {
          console.log(`⚠️ Element found but still disabled, waiting longer...`)
          // Wait a bit more and try again
          await page.waitForTimeout(2000)
          const isEnabledAfterWait = await input.isEnabled({ timeout: 5000 })
          if (isEnabledAfterWait) {
            answerInput = input
            foundSelector = selector
            console.log(`✅ Element became enabled after waiting with selector: ${selector}`)
            break
          }
        }
      } catch (error) {
        console.log(`❌ Error with selector ${selector}: ${error}`)
      }
    }
    
    if (answerInput) {
      try {
        // Try to focus the input first
        await answerInput.focus({ timeout: 5000 })
        await page.waitForTimeout(500)
        
        // Clear any existing value
        await answerInput.clear({ timeout: 5000 })
        await page.waitForTimeout(500)
        
        // Fill the security answer
        await answerInput.fill(securityAnswer, { timeout: 10000 })
        console.log(`✅ Security answer filled: ${securityAnswer}`)
      } catch (fillError) {
        console.log(`❌ Error filling security answer: ${fillError}`)
        throw new Error(`Failed to fill security answer: ${fillError}`)
      }
    } else {
      // Take a screenshot for debugging
      await this.takeScreenshot(page, jobId, 'security-answer-input-not-found')
      console.log('❌ Security answer input not found with any selector')
      console.log('🔍 Available input fields on page:')
      
      // List all input fields for debugging with more details
      const allInputs = await page.locator('input[type="text"]').all()
      for (let i = 0; i < allInputs.length; i++) {
        try {
          const id = await allInputs[i].getAttribute('id')
          const name = await allInputs[i].getAttribute('name')
          const placeholder = await allInputs[i].getAttribute('placeholder')
          const disabled = await allInputs[i].getAttribute('disabled')
          const readonly = await allInputs[i].getAttribute('readonly')
          const style = await allInputs[i].getAttribute('style')
          const className = await allInputs[i].getAttribute('class')
          
          console.log(`  Input ${i + 1}: id="${id}", name="${name}", placeholder="${placeholder}", disabled="${disabled}", readonly="${readonly}", style="${style}", class="${className}"`)
        } catch (error) {
          console.log(`  Input ${i + 1}: Could not get attributes`)
        }
      }
      
      throw new Error('Security answer input not found with any selector')
    }
    
    // Step 3: Click Continue button
    console.log('➡️ Clicking Continue button...')
    const continueButton = page.locator('#ctl00_SiteContentPlaceHolder_btnContinue')
    
    if (await continueButton.isVisible({ timeout: 10000 })) {
      await continueButton.click()
      console.log('✅ Continue button clicked')
      
      // Wait for navigation to the next page
      await page.waitForLoadState('networkidle')
      
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        'form_filling_started',
        'running',
        'Successfully completed Application ID Confirmation',
        35
      )
      
      // Take screenshot after completion
      await this.takeScreenshot(page, jobId, 'after-application-id-confirmation')
      
      console.log('✅ Application ID Confirmation completed successfully')
    } else {
      throw new Error('Continue button not found')
    }
  }
  
  /**
   * Fill DS-160 form with extracted data
   */
  private async fillDS160Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
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
    
    // Take screenshot before filling
    await this.takeScreenshot(page, jobId, 'before-form-filling')
    
    // Validate form data
    const validation = validateFormData(formData)
    if (!validation.valid) {
      console.warn('⚠️ Form data validation warnings:', validation.errors)
    }
    
    let filledFields = 0
    const totalFields = getAllFieldMappings().length
    
    // Fill each field based on mapping
    for (const fieldMapping of getAllFieldMappings()) {
      try {
        const fieldValue = formData[fieldMapping.fieldName]
        
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
          continue
        }
        
        console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
        
        const element = page.locator(fieldMapping.selector)
        
        // Wait for element to be visible
        await element.waitFor({ state: 'visible', timeout: 5000 })
        
        // Fill based on field type
        switch (fieldMapping.type) {
          case 'text':
            await element.fill(fieldValue.toString())
            break
            
          case 'select':
            // Use value mapping if available, otherwise use the original value
            let selectValue = fieldValue.toString()
            if (fieldMapping.valueMapping && fieldMapping.valueMapping[selectValue]) {
              selectValue = fieldMapping.valueMapping[selectValue]
            }
            
            console.log(`🔍 Selecting dropdown: ${fieldMapping.fieldName} with value: ${selectValue}`)
            
            // Wait for dropdown to be ready
            await element.waitFor({ state: 'visible', timeout: 10000 })
            
            // Extra wait for country dropdown specifically
            if (fieldMapping.fieldName === 'personal_info.place_of_birth_country') {
              console.log(`⏳ Extra wait for country dropdown...`)
              await page.waitForTimeout(2000)
              
              // Check if options are available (don't wait for visibility)
              const options = element.locator('option')
              const optionCount = await options.count()
              console.log(`✅ Country dropdown has ${optionCount} options available`)
            }
            
            // Try to select by value first
            try {
              // Focus the dropdown first
              await element.focus()
              await page.waitForTimeout(200)
              await element.selectOption({ value: selectValue })
              console.log(`✅ Successfully selected by value: ${selectValue}`)
            } catch (error) {
              console.log(`⚠️ Direct selection failed, trying keyboard navigation...`)
              
              // Try keyboard navigation approach
              try {
                // Click to focus the dropdown
                await element.click()
                await page.waitForTimeout(500)
                
                // Type the full country name to find the exact match
                const searchText = fieldValue.toString().toUpperCase()
                console.log(`🔍 Typing full country name: ${searchText}`)
                await page.keyboard.type(searchText)
                await page.waitForTimeout(1000) // Longer wait for full text
                
                // Press Enter to select the highlighted option
                await page.keyboard.press('Enter')
                console.log(`✅ Selected using keyboard navigation: ${fieldValue}`)
              } catch (keyboardError) {
                console.log(`⚠️ Keyboard navigation failed, trying manual option selection...`)
                
                // Manual option selection as last resort
                const options = element.locator('option')
                const optionCount = await options.count()
                console.log(`🔍 Manually searching through ${optionCount} options...`)
                
                let found = false
                for (let i = 0; i < optionCount; i++) {
                  const option = options.nth(i)
                  const optionValue = await option.getAttribute('value')
                  const optionText = await option.textContent()
                  
                  if (optionValue === selectValue) {
                    console.log(`🔍 Found matching option: ${optionText} (value: ${optionValue})`)
                    if (optionValue) {
                      await element.selectOption({ value: optionValue })
                      console.log(`✅ Manually selected option: ${optionText}`)
                      found = true
                      break
                    }
                  }
                }
                
                if (!found) {
                  throw new Error(`Could not find option for value: ${selectValue}`)
                }
              }
            }
            break
            
          case 'radio':
            // For radio buttons, we need to find the correct option
            let radioValue = fieldValue.toString()
            if (fieldMapping.valueMapping && fieldMapping.valueMapping[radioValue]) {
              radioValue = fieldMapping.valueMapping[radioValue]
            }
            
            const radioOptions = page.locator(`${fieldMapping.selector} input[type="radio"]`)
            const optionCount = await radioOptions.count()
            
            for (let i = 0; i < optionCount; i++) {
              const option = radioOptions.nth(i)
              const optionValue = await option.getAttribute('value')
              
              if (optionValue === radioValue) {
                await option.check()
                
                // Handle conditional fields for radio buttons
                if (fieldMapping.conditional && radioValue === fieldMapping.conditional.value) {
                  console.log(`📝 Filling conditional fields for ${fieldMapping.fieldName}...`)
                  await this.fillConditionalFields(page, fieldMapping.conditional.showFields, formData)
                }
                break
              }
            }
            break
            
          case 'checkbox':
            if (fieldValue === true || fieldValue === 'Yes') {
              await element.check()
            } else {
              await element.uncheck()
            }
            break
            
          case 'date':
            // Format date for input
            const dateValue = new Date(fieldValue.toString()).toISOString().split('T')[0]
            await element.fill(dateValue)
            break
            
          case 'date_split':
            // Handle split date fields (day, month, year)
            if (fieldMapping.dateSelectors) {
              const date = new Date(fieldValue.toString())
              const day = date.getDate().toString().padStart(2, '0')
              const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
              const year = date.getFullYear().toString()
              
              // Fill day
              const dayElement = page.locator(fieldMapping.dateSelectors.day)
              await dayElement.selectOption({ value: day })
              
              // Fill month
              const monthElement = page.locator(fieldMapping.dateSelectors.month)
              await monthElement.selectOption({ value: month })
              
              // Fill year
              const yearElement = page.locator(fieldMapping.dateSelectors.year)
              await yearElement.fill(year)
            }
            break
            
          case 'textarea':
            await element.fill(fieldValue.toString())
            break
        }
        
        filledFields++
        
        // Update progress every 10 fields
        if (filledFields % 10 === 0) {
          const progress = 40 + Math.floor((filledFields / totalFields) * 30)
          await this.progressService.updateStepProgress(
            jobId,
            'form_filling_progress',
            'running',
            `Filled ${filledFields}/${totalFields} fields`,
            progress
          )
        }
        
                          // Small delay between fields to avoid overwhelming the form
                  await page.waitForTimeout(100)
                  
                  // Extra delay for dropdowns to ensure they're fully loaded
                  if (fieldMapping.type === 'select') {
                    await page.waitForTimeout(500)
                  }
        
      } catch (error) {
        console.warn(`⚠️ Failed to fill field ${fieldMapping.fieldName}:`, error)
        // Continue with other fields
      }
    }
    
    // Take screenshot after filling
    await this.takeScreenshot(page, jobId, 'after-form-filling')
    
    // Update final progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_filling_completed',
      'running',
      `Successfully filled ${filledFields} form fields`,
      70
    )
    
    console.log(`✅ DS-160 form filling completed. Filled ${filledFields} fields.`)
    
    // Click Next button to proceed to next step
    await this.clickNextButton(page, jobId)
  }

  /**
   * Click the Next button to proceed to the next form step
   */
  private async clickNextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button to proceed to next step...')
    
    // Look for the Next button
    const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
    
    if (await nextButton.isVisible({ timeout: 10000 })) {
      await nextButton.click()
      console.log('✅ Next button clicked')
      
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle')
      
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        'form_step_2',
        'running',
        'Successfully navigated to next form step',
        75
      )
      
      // Take screenshot after navigation
      await this.takeScreenshot(page, jobId, 'after-next-button-click')
      
      console.log('✅ Successfully navigated to next form step')
    } else {
      throw new Error('Next button not found')
    }
  }

  /**
   * Fill conditional fields that appear based on radio button selections
   */
  private async fillConditionalFields(page: Page, conditionalFields: any[], formData: DS160FormData): Promise<void> {
    for (const field of conditionalFields) {
      try {
        const fieldValue = formData[field.fieldName]
        
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          console.log(`⏭️ Skipping empty conditional field: ${field.fieldName}`)
          continue
        }
        
        console.log(`📝 Filling conditional field: ${field.fieldName} = ${fieldValue}`)
        
        const element = page.locator(field.selector)
        
        // Wait for element to be visible (conditional fields may take time to appear)
        await element.waitFor({ state: 'visible', timeout: 10000 })
        
        // Fill based on field type
        switch (field.type) {
          case 'text':
            await element.fill(fieldValue.toString())
            break
            
          case 'select':
            await element.selectOption({ label: fieldValue.toString() })
            break
            
          case 'checkbox':
            if (fieldValue === true || fieldValue === 'Yes') {
              await element.check()
            } else {
              await element.uncheck()
            }
            break
        }
        
        // Small delay between conditional fields
        await page.waitForTimeout(200)
        
      } catch (error) {
        console.warn(`⚠️ Failed to fill conditional field ${field.fieldName}:`, error)
      }
    }
  }

  /**
   * Generate a random 6-letter answer for security question
   */
  private generateRandomAnswer(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    return result
  }
  
  /**
   * Store Application ID in Supabase for future application retrieval
   */
  private async storeApplicationId(jobId: string, applicationId: string, applicationDate: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ceac_application_ids')
        .insert({
          job_id: jobId,
          application_id: applicationId,
          application_date: applicationDate,
          created_at: new Date().toISOString()
        })
      
      if (error) {
        console.warn('Failed to store application ID:', error)
      } else {
        console.log('✅ Application ID stored in database')
      }
    } catch (error) {
      console.warn('Failed to store application ID:', error)
    }
  }

  /**
   * Store security answer in Supabase for future application retrieval
   */
  private async storeSecurityAnswer(jobId: string, answer: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ceac_security_answers')
        .insert({
          job_id: jobId,
          security_question: 'What is the given name of your mother\'s mother?',
          security_answer: answer,
          created_at: new Date().toISOString()
        })
      
      if (error) {
        console.warn('Failed to store security answer:', error)
      } else {
        console.log('✅ Security answer stored in database')
      }
    } catch (error) {
      console.warn('Failed to store security answer:', error)
    }
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