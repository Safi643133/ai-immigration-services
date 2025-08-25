import { chromium, Browser, Page, BrowserContext } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { getArtifactStorage } from '../../lib/artifact-storage'
import { ProgressService } from '../../lib/progress/progress-service'
import type { DS160FormData } from '../../lib/types/ceac'
import { getFieldMapping, getStep1FieldMappings, getStep2FieldMappings, getStep3FieldMappings, getStep4FieldMappings, getStep5FieldMappings, getStep6FieldMappings, getStep7FieldMappings, getStep8FieldMappings, getStep9FieldMappings, getStep10FieldMappings, getStep11FieldMappings, validateFormData } from '../../lib/form-field-mappings'
import { getConditionalFields } from '../../app/forms/ds160/conditionalFields'
import { getCountryCode } from '../../lib/country-code-mapping'
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
    const totalFields = getStep1FieldMappings().length
    console.log(`📝 Found ${totalFields} Step 1 fields to fill`)
    
    // Fill each field based on mapping
    for (const fieldMapping of getStep1FieldMappings()) {
      try {
        const fieldValue = formData[fieldMapping.fieldName]
        
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
          continue
        }
        
        console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
        
        const element = page.locator(fieldMapping.selector)
        
        // Wait for element to be visible
        await element.waitFor({ state: 'visible', timeout: 15000 })
        
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
            if (fieldMapping.fieldName === 'personal_info.place_of_birth_country' || fieldMapping.fieldName === 'personal_info.nationality') {
              console.log(`⏳ Extra wait for country dropdown...`)
              await page.waitForTimeout(2000)
              
              // Check if options are available (don't wait for visibility)
              const options = element.locator('option')
              const optionCount = await options.count()
              console.log(`✅ Country dropdown has ${optionCount} options available`)
            }
            
            // For nationality field, use our country code mapping
            if (fieldMapping.fieldName === 'personal_info.nationality') {
              const countryCode = getCountryCode(selectValue)
              if (countryCode) {
                selectValue = countryCode
                console.log(`🔍 STEP1 - Country "${fieldValue}" mapped to CEAC code: "${selectValue}"`)
              } else {
                console.log(`⚠️ STEP1 - No country code found for: ${selectValue}`)
              }
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
                if (fieldMapping.conditional && fieldMapping.conditional.value && radioValue === fieldMapping.conditional.value && fieldMapping.conditional.showFields) {
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
    await this.clickNextButton(page, jobId, formData)
  }

  /**
   * Click the Next button to proceed to the next form step
   */
  private async clickNextButton(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
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
      
      // Fill Step 2 fields
      await this.fillStep2Form(page, jobId, formData)
    } else {
      throw new Error('Next button not found')
    }
  }

  /**
   * Fill Step 2 of the DS-160 form
   */
  private async fillStep2Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting DS-160 Step 2 form filling...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_2_filling',
      'running',
      'Starting to fill Step 2 form fields',
      80
    )
    
    const totalFields = getStep2FieldMappings().length
    console.log(`📝 Found ${totalFields} Step 2 fields to fill`)
    
    let filledFields = 0
    
    // Fill each field based on mapping
    for (const fieldMapping of getStep2FieldMappings()) {
      try {
        const fieldValue = formData[fieldMapping.fieldName]
        
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
          continue
        }
        
        console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
        
        const element = page.locator(fieldMapping.selector)
        
        // Wait for element to be visible
        await element.waitFor({ state: 'visible', timeout: 15000 })
        
        // Fill based on field type
        switch (fieldMapping.type) {
          case 'text':
            await element.fill(fieldValue.toString())
            break
            
          case 'select':
            // Use value mapping if available, otherwise use the original value
            let selectValue = fieldValue.toString()
            console.log(`🔍 STEP2 - Original value: ${selectValue}`)
            console.log(`🔍 STEP2 - Available mappings:`, fieldMapping.valueMapping ? Object.keys(fieldMapping.valueMapping) : 'None')
            
            // For nationality field, use our country code mapping
            if (fieldMapping.fieldName === 'personal_info.nationality') {
              const countryCode = getCountryCode(selectValue)
              if (countryCode) {
                selectValue = countryCode
                console.log(`🔍 STEP2 - Country "${fieldValue}" mapped to CEAC code: "${selectValue}"`)
              } else {
                console.log(`⚠️ STEP2 - No country code found for: ${selectValue}`)
              }
            } else if (fieldMapping.valueMapping && fieldMapping.valueMapping[selectValue]) {
              selectValue = fieldMapping.valueMapping[selectValue]
              console.log(`🔍 STEP2 - Mapped to: ${selectValue}`)
            } else if (fieldMapping.valueMapping) {
              // Try case-insensitive matching
              const upperValue = selectValue.toUpperCase()
              if (fieldMapping.valueMapping[upperValue]) {
                selectValue = fieldMapping.valueMapping[upperValue]
                console.log(`🔍 STEP2 - Case-insensitive mapped to: ${selectValue}`)
              } else {
                console.log(`⚠️ STEP2 - No mapping found for: ${selectValue}`)
              }
            }
            
            console.log(`🔍 STEP2 - Final select value: ${selectValue}`)
            console.log(`🔍 Selecting dropdown: ${fieldMapping.fieldName} with value: ${selectValue}`)
            
            try {
              await element.selectOption({ value: selectValue })
              console.log(`✅ Successfully selected by value: ${selectValue}`)
              
              // Wait for postback if the dropdown triggers one
              try {
                await page.waitForLoadState('networkidle', { timeout: 5000 })
                console.log(`✅ Postback completed after selection`)
              } catch (timeoutError) {
                console.log(`ℹ️ No postback detected or timeout - continuing`)
              }
            } catch (error) {
              console.log(`⚠️ Direct selection failed, trying click-before-select...`)
              await element.click()
              await page.waitForTimeout(1000)
              await element.selectOption({ value: selectValue })
              console.log(`✅ Successfully selected after click: ${selectValue}`)
              
              // Wait for postback if the dropdown triggers one
              try {
                await page.waitForLoadState('networkidle', { timeout: 5000 })
                console.log(`✅ Postback completed after click-select`)
              } catch (timeoutError) {
                console.log(`ℹ️ No postback detected or timeout - continuing`)
              }
            }
            
            // Small delay to ensure dropdown processing for Step 2
            await page.waitForTimeout(500)
            break
            
          case 'radio':
            // Use value mapping if available
            let radioValue = fieldValue.toString()
            if (fieldMapping.valueMapping && fieldMapping.valueMapping[radioValue]) {
              radioValue = fieldMapping.valueMapping[radioValue]
            }
            
            console.log(`🔍 STEP2 - Radio value: ${radioValue}`)
            
            // Handle radio button groups - find the specific radio button by value
            const radioSelector = `input[type="radio"][name*="${fieldMapping.selector.split('_').pop()}"][value="${radioValue}"]`
            console.log(`🔍 STEP2 - Radio selector: ${radioSelector}`)
            const radioButton = page.locator(radioSelector)
            
            try {
              await radioButton.waitFor({ state: 'visible', timeout: 15000 })
              await radioButton.check()
              console.log(`✅ Selected radio button: ${fieldMapping.fieldName} = ${radioValue}`)
              
              // Enhanced waiting for conditional fields that may appear
              if (fieldMapping.fieldName === 'personal_info.other_nationalities' && radioValue === 'Y') {
                console.log(`🔄 Other nationalities set to Yes - waiting for conditional fields...`)
                await this.waitForConditionalFieldsToAppear(page, jobId, 'other_nationalities')
              } else if (fieldMapping.fieldName === 'personal_info.permanent_resident_other_country' && radioValue === 'Y') {
                console.log(`🔄 Permanent resident other country set to Yes - waiting for conditional fields...`)
                await this.waitForConditionalFieldsToAppear(page, jobId, 'permanent_resident')
              }
              
              // Wait for postback if the radio button triggers one
              await this.waitForPostback(page, 'radio selection')
              
            } catch (error) {
              console.log(`⚠️ Radio button not found, trying alternative selector...`)
              // Try alternative selector for radio button groups
              const altRadioButton = page.locator(`input[type="radio"][value="${radioValue}"]`)
              await altRadioButton.check()
              console.log(`✅ Selected radio button with alternative selector: ${fieldMapping.fieldName} = ${radioValue}`)
              
              // Enhanced waiting for conditional fields that may appear
              if (fieldMapping.fieldName === 'personal_info.other_nationalities' && radioValue === 'Y') {
                console.log(`🔄 Other nationalities set to Yes - waiting for conditional fields...`)
                await this.waitForConditionalFieldsToAppear(page, jobId, 'other_nationalities')
              } else if (fieldMapping.fieldName === 'personal_info.permanent_resident_other_country' && radioValue === 'Y') {
                console.log(`🔄 Permanent resident other country set to Yes - waiting for conditional fields...`)
                await this.waitForConditionalFieldsToAppear(page, jobId, 'permanent_resident')
              }
              
              // Wait for postback if the radio button triggers one
              await this.waitForPostback(page, 'radio selection')
            }
            
            // Small delay to ensure radio button processing
            await page.waitForTimeout(1000)
            break
            
          case 'checkbox':
            if (fieldValue === true || fieldValue === 'Yes' || fieldValue === 'N/A') {
              await element.check()
              console.log(`✅ Checked checkbox: ${fieldMapping.fieldName}`)
            } else {
              await element.uncheck()
              console.log(`✅ Unchecked checkbox: ${fieldMapping.fieldName}`)
            }
            break
        }
        
        filledFields++
        
        // Handle checkbox conditionals for text fields
        if (fieldMapping.type === 'text' && fieldMapping.conditional?.checkbox) {
          const checkboxValue = formData[fieldMapping.conditional.checkbox.fieldName]
          
          // If checkbox is checked (NA), skip filling the text field
          if (checkboxValue === true || checkboxValue === 'true') {
            console.log(`⏭️ Skipping ${fieldMapping.fieldName} - NA checkbox is checked`)
            continue
          }
          
          // Special handling for SSN field (3 separate inputs)
          if (fieldMapping.fieldName === 'personal_info.us_social_security_number_1') {
            const ssnPart1 = fieldValue.toString()
            const ssnPart2 = formData['personal_info.us_social_security_number_2'] || ''
            const ssnPart3 = formData['personal_info.us_social_security_number_3'] || ''
            
            // Fill SSN part 1
            const ssn1Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN1')
            await ssn1Element.fill(ssnPart1)
            
            // Fill SSN part 2
            if (ssnPart2) {
              const ssn2Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN2')
              await ssn2Element.fill(ssnPart2)
            }
            
            // Fill SSN part 3
            if (ssnPart3) {
              const ssn3Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN3')
              await ssn3Element.fill(ssnPart3)
            }
            
            console.log(`✅ Filled SSN: ${ssnPart1}-${ssnPart2}-${ssnPart3}`)
          }
        }
        
        // Update progress every 5 fields
        if (filledFields % 5 === 0) {
          const progress = 80 + Math.floor((filledFields / totalFields) * 15)
          await this.progressService.updateStepProgress(
            jobId,
            'form_step_2_progress',
            'running',
            `Filled ${filledFields}/${totalFields} Step 2 fields`,
            progress
          )
        }
        
        // Small delay between fields
        await page.waitForTimeout(100)
        
      } catch (error) {
        console.warn(`⚠️ Failed to fill field ${fieldMapping.fieldName}:`, error)
      }
    }
    
    // Take screenshot after filling
    await this.takeScreenshot(page, jobId, 'after-step2-filling')
    
    // Update final progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_2_completed',
      'running',
      `Successfully filled ${filledFields} Step 2 form fields`,
      29
    )
    
    console.log(`✅ DS-160 Step 2 form filling completed. Filled ${filledFields} fields.`)
    
    // Handle conditional fields after main fields are filled
    await this.fillStep2ConditionalFields(page, jobId, formData)
    
    // Fill Step 3 fields
    await this.fillStep3Form(page, jobId, formData)
  }

  /**
   * Fill Step 2 conditional fields that appear based on radio button selections
   */
  private async fillStep2ConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 2 conditional fields...')
    
    // ============================================================================
    // HANDLE OTHER NATIONALITIES CONDITIONAL FIELDS
    // ============================================================================
    const otherNationalities = formData['personal_info.other_nationalities']
    if (otherNationalities === 'Yes') {
      console.log('📝 Filling other nationalities conditional fields...')
      
      // Wait for the conditional fields to appear after selecting "Yes"
      await this.waitForConditionalFieldsToAppear(page, jobId, 'other_nationalities')
      
      // Get the other nationalities list
      const natList = Array.isArray(formData['personal_info.other_nationalities_list'])
        ? (formData['personal_info.other_nationalities_list'] as Array<any>)
        : []
      
      if (natList.length > 0) {
        const firstNat = natList[0]
        
        // Fill other nationality country
        if (firstNat.country) {
          try {
            console.log(`🌍 Filling other nationality country: ${firstNat.country}`)
            
            // Wait for the country dropdown to be visible and enabled
            const countryElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_ddlOTHER_NATL')
            await countryElement.waitFor({ state: 'visible', timeout: 15000 })
            
            // Additional wait to ensure dropdown is fully loaded
            await page.waitForTimeout(2000)
            
            // Get CEAC country code for the country name
            const countryCode = getCountryCode(firstNat.country)
            if (!countryCode) {
              throw new Error(`No country code found for: ${firstNat.country}`)
            }
            
            console.log(`🔍 Mapping country "${firstNat.country}" to CEAC code: "${countryCode}"`)
            
            // Select by the CEAC country code
            await countryElement.selectOption({ value: countryCode })
            console.log(`✅ Selected other nationality country: ${firstNat.country} (${countryCode})`)
            
            // Wait for any postback after country selection
            await this.waitForPostback(page, 'country selection')
            
          } catch (error) {
            console.warn(`⚠️ Failed to fill other nationality country:`, error)
            await this.takeScreenshot(page, jobId, 'other-nationality-country-error')
          }
        }
        
        // Fill passport question
        if (firstNat.has_passport) {
          try {
            console.log(`📄 Filling passport question: ${firstNat.has_passport}`)
            
            // Wait for passport radio buttons to appear
            await page.waitForTimeout(2000)
            
            const passportRadio = page.locator(`#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_rblOTHER_PPT_IND input[value="${firstNat.has_passport === 'Yes' ? 'Y' : 'N'}"]`)
            await passportRadio.waitFor({ state: 'visible', timeout: 15000 })
            await passportRadio.check()
            console.log(`✅ Selected passport question: ${firstNat.has_passport}`)
            
            // Wait for postback after radio selection
            await this.waitForPostback(page, 'passport question')
            
            // If Yes, fill passport number
            if (firstNat.has_passport === 'Yes' && firstNat.passport_number) {
              console.log(`📄 Filling passport number: ${firstNat.passport_number}`)
              
              // Wait for the passport number field to appear
              await this.waitForConditionalFieldsToAppear(page, jobId, 'passport_number')
              
              const passportNumberElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_tbxOTHER_PPT_NUM')
              await passportNumberElement.waitFor({ state: 'visible', timeout: 15000 })
              await passportNumberElement.fill(firstNat.passport_number)
              console.log(`✅ Filled passport number: ${firstNat.passport_number}`)
            }
          } catch (error) {
            console.warn(`⚠️ Failed to fill passport question:`, error)
            await this.takeScreenshot(page, jobId, 'passport-question-error')
          }
        }
      }
    }
    
    // ============================================================================
    // HANDLE PERMANENT RESIDENT CONDITIONAL FIELDS
    // ============================================================================
    const permanentResidentOther = formData['personal_info.permanent_resident_other_country']
    if (permanentResidentOther === 'Yes') {
      console.log('📝 Filling permanent resident conditional fields...')
      
      // Wait for the conditional fields to appear after selecting "Yes"
      await this.waitForConditionalFieldsToAppear(page, jobId, 'permanent_resident')
      
      const permanentResidentCountry = formData['personal_info.permanent_resident_country']
      if (permanentResidentCountry) {
        try {
          console.log(`🏠 Filling permanent resident country: ${permanentResidentCountry}`)
          
          // Wait for the country dropdown to be visible and enabled
          const countryElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOthPermResCntry_ctl00_ddlOthPermResCntry')
          await countryElement.waitFor({ state: 'visible', timeout: 15000 })
          
          // Additional wait to ensure dropdown is fully loaded
          await page.waitForTimeout(2000)
          
          // Get CEAC country code for the country name
          const countryCode = getCountryCode(permanentResidentCountry)
          if (!countryCode) {
            throw new Error(`No country code found for: ${permanentResidentCountry}`)
          }
          
          console.log(`🔍 Mapping country "${permanentResidentCountry}" to CEAC code: "${countryCode}"`)
          
          // Select by the CEAC country code
          await countryElement.selectOption({ value: countryCode })
          console.log(`✅ Selected permanent resident country: ${permanentResidentCountry} (${countryCode})`)
          
          // Wait for any postback after country selection
          await this.waitForPostback(page, 'permanent resident country selection')
          
        } catch (error) {
          console.warn(`⚠️ Failed to fill permanent resident country:`, error)
          await this.takeScreenshot(page, jobId, 'permanent-resident-country-error')
        }
      }
    }
    
    // ============================================================================
    // HANDLE IDENTIFICATION NUMBER FIELDS
    // ============================================================================
    console.log('📝 Handling identification number fields...')
    
    // Handle National Identification Number
    const nationalIdNumber = formData['personal_info.national_identification_number']
    if (nationalIdNumber && nationalIdNumber !== '') {
      try {
        console.log(`🆔 Filling national identification number: ${nationalIdNumber}`)
        
        // Check if "Does Not Apply" checkbox is checked
        const nationalIdCheckbox = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_NATIONAL_ID_NA')
        const isChecked = await nationalIdCheckbox.isChecked()
        
        if (!isChecked) {
          // Fill the national ID number field
          const nationalIdElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_NATIONAL_ID')
          await nationalIdElement.waitFor({ state: 'visible', timeout: 10000 })
          await nationalIdElement.fill(nationalIdNumber)
          console.log(`✅ Filled national identification number`)
        } else {
          console.log(`⏭️ Skipping national ID - "Does Not Apply" is checked`)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fill national identification number:`, error)
      }
    }
    
    // Handle U.S. Social Security Number
    const ssnPart1 = formData['personal_info.us_social_security_number_1']
    const ssnPart2 = formData['personal_info.us_social_security_number_2']
    const ssnPart3 = formData['personal_info.us_social_security_number_3']
    
    if (ssnPart1 || ssnPart2 || ssnPart3) {
      try {
        console.log(`🔢 Filling U.S. Social Security Number: ${ssnPart1}-${ssnPart2}-${ssnPart3}`)
        
        // Check if "Does Not Apply" checkbox is checked
        const ssnCheckbox = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_SSN_NA')
        const isChecked = await ssnCheckbox.isChecked()
        
        if (!isChecked) {
          // Fill SSN part 1
          if (ssnPart1) {
            const ssn1Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN1')
            await ssn1Element.waitFor({ state: 'visible', timeout: 10000 })
            await ssn1Element.fill(ssnPart1)
            console.log(`✅ Filled SSN part 1: ${ssnPart1}`)
          }
          
          // Fill SSN part 2
          if (ssnPart2) {
            const ssn2Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN2')
            await ssn2Element.waitFor({ state: 'visible', timeout: 10000 })
            await ssn2Element.fill(ssnPart2)
            console.log(`✅ Filled SSN part 2: ${ssnPart2}`)
          }
          
          // Fill SSN part 3
          if (ssnPart3) {
            const ssn3Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN3')
            await ssn3Element.waitFor({ state: 'visible', timeout: 10000 })
            await ssn3Element.fill(ssnPart3)
            console.log(`✅ Filled SSN part 3: ${ssnPart3}`)
          }
          
          console.log(`✅ Filled U.S. Social Security Number: ${ssnPart1}-${ssnPart2}-${ssnPart3}`)
        } else {
          console.log(`⏭️ Skipping SSN - "Does Not Apply" is checked`)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fill U.S. Social Security Number:`, error)
      }
    }
    
    // Handle U.S. Taxpayer ID Number
    const taxpayerId = formData['personal_info.us_taxpayer_id_number']
    if (taxpayerId && taxpayerId !== '') {
      try {
        console.log(`💰 Filling U.S. Taxpayer ID Number: ${taxpayerId}`)
        
        // Check if "Does Not Apply" checkbox is checked
        const taxpayerCheckbox = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_TAX_ID_NA')
        const isChecked = await taxpayerCheckbox.isChecked()
        
        if (!isChecked) {
          // Fill the taxpayer ID field
          const taxpayerElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_TAX_ID')
          await taxpayerElement.waitFor({ state: 'visible', timeout: 10000 })
          await taxpayerElement.fill(taxpayerId)
          console.log(`✅ Filled U.S. Taxpayer ID Number`)
        } else {
          console.log(`⏭️ Skipping taxpayer ID - "Does Not Apply" is checked`)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fill U.S. Taxpayer ID Number:`, error)
      }
    }
    
    // ============================================================================
    // HANDLE CHECKBOX CONDITIONALS FOR NA FIELDS
    // ============================================================================
    console.log('📝 Handling checkbox conditionals for NA fields...')
    
    const step2Mappings = getStep2FieldMappings()
    for (const fieldMapping of step2Mappings) {
      if (fieldMapping.type === 'text' && fieldMapping.conditional?.checkbox) {
        const checkboxValue = formData[fieldMapping.conditional.checkbox.fieldName]
        
        if (checkboxValue === true || checkboxValue === 'true') {
          console.log(`📝 Checking NA checkbox for: ${fieldMapping.fieldName}`)
          try {
            const checkboxElement = page.locator(fieldMapping.conditional.checkbox.selector)
            await checkboxElement.waitFor({ state: 'visible', timeout: 5000 })
            await checkboxElement.check()
            console.log(`✅ Checked NA checkbox for: ${fieldMapping.fieldName}`)
          } catch (error) {
            console.warn(`⚠️ Failed to check NA checkbox for ${fieldMapping.fieldName}:`, error)
          }
        }
      }
    }
    
    console.log('✅ Step 2 conditional fields completed')
    
    // Click Next button to proceed to Step 3
    await this.clickStep2NextButton(page, jobId)
  }

  /**
   * Wait for conditional fields to appear after radio button selection
   */
  private async waitForConditionalFieldsToAppear(page: Page, jobId: string, fieldType: string): Promise<void> {
    console.log(`⏳ Waiting for ${fieldType} conditional fields to appear...`)
    
    const maxWaitTime = 30000 // 30 seconds
    const checkInterval = 1000 // 1 second
    let startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check for different types of conditional fields
        let conditionalElement = null
        
        switch (fieldType) {
          case 'other_nationalities':
            conditionalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_ddlOTHER_NATL')
            break
          case 'permanent_resident':
            conditionalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOthPermResCntry_ctl00_ddlOthPermResCntry')
            break
          case 'passport_number':
            conditionalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_tbxOTHER_PPT_NUM')
            break
          default:
            console.log(`⚠️ Unknown field type: ${fieldType}`)
            return
        }
        
        if (conditionalElement && await conditionalElement.isVisible({ timeout: 2000 })) {
          console.log(`✅ ${fieldType} conditional fields appeared after ${Date.now() - startTime}ms`)
          return
        }
        
        // Wait before checking again
        await page.waitForTimeout(checkInterval)
        
      } catch (error) {
        // Continue waiting
        await page.waitForTimeout(checkInterval)
      }
    }
    
    console.warn(`⚠️ Timeout waiting for ${fieldType} conditional fields to appear`)
    await this.takeScreenshot(page, jobId, `${fieldType}-conditional-fields-timeout`)
  }

  /**
   * Wait for postback to complete after form interactions
   */
  private async waitForPostback(page: Page, action: string): Promise<void> {
    console.log(`⏳ Waiting for postback after ${action}...`)
    
    try {
      // Wait for network idle
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      console.log(`✅ Postback completed after ${action}`)
    } catch (timeoutError) {
      console.log(`ℹ️ No postback detected or timeout after ${action} - continuing`)
    }
    
    // Additional wait to ensure DOM is fully updated
    await page.waitForTimeout(2000)
  }

  /**
   * Click the Next button on Step 2 to proceed to Step 3
   */
  private async clickStep2NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button on Step 2 to proceed to Step 3...')
    
    // Look for the Next button (same selector as Step 1)
    const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
    
    if (await nextButton.isVisible({ timeout: 10000 })) {
      await nextButton.click()
      console.log('✅ Step 2 Next button clicked')
      
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle')
      
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        'form_step_3',
        'running',
        'Successfully navigated to Step 3',
        98
      )
      
      // Take screenshot after navigation
      await this.takeScreenshot(page, jobId, 'after-step2-next-button-click')
      
      console.log('✅ Successfully navigated to Step 3')
    } else {
      throw new Error('Step 2 Next button not found')
    }
  }

  /**
   * Fill Step 3 form fields (Travel Information)
   */
  private async fillStep3Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting DS-160 Step 3 form filling...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_3_filling',
      'running',
      'Starting to fill Step 3 form fields',
      95
    )
    
    const totalFields = getStep3FieldMappings().length
    console.log(`📝 Found ${totalFields} Step 3 fields to fill`)
    
    let filledFields = 0
    
    // Fill each field based on mapping
    for (const fieldMapping of getStep3FieldMappings()) {
      try {
        const fieldValue = formData[fieldMapping.fieldName]
        
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
          continue
        }
        
        console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
        
        const element = page.locator(fieldMapping.selector)
        
        // Wait for element to be visible
        await element.waitFor({ state: 'visible', timeout: 15000 })
        
        // Fill based on field type
        switch (fieldMapping.type) {
          case 'text':
            await element.fill(fieldValue.toString())
            break
            
          case 'select':
            // Use value mapping if available, otherwise use the original value
            let selectValue = fieldValue.toString()
            console.log(`🔍 STEP3 - Original value: ${selectValue}`)
            console.log(`🔍 STEP3 - Available mappings:`, fieldMapping.valueMapping ? Object.keys(fieldMapping.valueMapping) : 'None')
            
            // For country fields, use our country code mapping
            if (fieldMapping.fieldName.includes('country') || fieldMapping.fieldName.includes('state')) {
              const countryCode = getCountryCode(selectValue)
              if (countryCode) {
                selectValue = countryCode
                console.log(`🔍 STEP3 - Country "${fieldValue}" mapped to CEAC code: "${selectValue}"`)
              } else {
                console.log(`⚠️ STEP3 - No country code found for: ${selectValue}`)
              }
            } else if (fieldMapping.valueMapping && fieldMapping.valueMapping[selectValue]) {
              selectValue = fieldMapping.valueMapping[selectValue]
              console.log(`🔍 STEP3 - Mapped to: ${selectValue}`)
            } else if (fieldMapping.valueMapping) {
              // Try case-insensitive matching
              const upperValue = selectValue.toUpperCase()
              if (fieldMapping.valueMapping[upperValue]) {
                selectValue = fieldMapping.valueMapping[upperValue]
                console.log(`🔍 STEP3 - Case-insensitive mapped to: ${selectValue}`)
              } else {
                console.log(`⚠️ STEP3 - No mapping found for: ${selectValue}`)
              }
            }
            
            console.log(`🔍 STEP3 - Final select value: ${selectValue}`)
            console.log(`🔍 Selecting dropdown: ${fieldMapping.fieldName} with value: ${selectValue}`)
            
            try {
              await element.selectOption({ value: selectValue })
              console.log(`✅ Successfully selected by value: ${selectValue}`)
              
              // Wait for postback if the dropdown triggers one
              try {
                await page.waitForLoadState('networkidle', { timeout: 5000 })
                console.log(`✅ Postback completed after selection`)
              } catch (timeoutError) {
                console.log(`ℹ️ No postback detected or timeout - continuing`)
              }
            } catch (error) {
              console.log(`⚠️ Direct selection failed, trying click-before-select...`)
              await element.click()
              await page.waitForTimeout(1000)
              await element.selectOption({ value: selectValue })
              console.log(`✅ Successfully selected after click: ${selectValue}`)
              
              // Wait for postback if the dropdown triggers one
              try {
                await page.waitForLoadState('networkidle', { timeout: 5000 })
                console.log(`✅ Postback completed after click-select`)
              } catch (timeoutError) {
                console.log(`ℹ️ No postback detected or timeout - continuing`)
              }
            }
            
            // Small delay to ensure dropdown processing for Step 3
            await page.waitForTimeout(500)
            break
            
          case 'radio':
            // Use value mapping if available
            let radioValue = fieldValue.toString()
            if (fieldMapping.valueMapping && fieldMapping.valueMapping[radioValue]) {
              radioValue = fieldMapping.valueMapping[radioValue]
            }
            
            console.log(`🔍 STEP3 - Radio value: ${radioValue}`)
            
            // Handle radio button groups - find the specific radio button by value
            const radioSelector = `input[type="radio"][name*="${fieldMapping.selector.split('_').pop()}"][value="${radioValue}"]`
            console.log(`🔍 STEP3 - Radio selector: ${radioSelector}`)
            const radioButton = page.locator(radioSelector)
            
            try {
              await radioButton.waitFor({ state: 'visible', timeout: 10000 })
              await radioButton.check()
              console.log(`✅ Selected radio button: ${fieldMapping.fieldName} = ${radioValue}`)
              
              // Wait for postback if the radio button triggers one
              try {
                await page.waitForLoadState('networkidle', { timeout: 5000 })
                console.log(`✅ Postback completed after radio selection`)
              } catch (timeoutError) {
                console.log(`ℹ️ No postback detected or timeout - continuing`)
              }
            } catch (error) {
              console.log(`⚠️ Radio button not found, trying alternative selector...`)
              // Try alternative selector for radio button groups
              const altRadioButton = page.locator(`input[type="radio"][value="${radioValue}"]`)
              await altRadioButton.check()
              console.log(`✅ Selected radio button with alternative selector: ${fieldMapping.fieldName} = ${radioValue}`)
            }
            
            // Small delay to ensure radio button processing
            await page.waitForTimeout(500)
            break
            
          case 'checkbox':
            if (fieldValue === true || fieldValue === 'Yes' || fieldValue === 'N/A') {
              await element.check()
              console.log(`✅ Checked checkbox: ${fieldMapping.fieldName}`)
            } else {
              await element.uncheck()
              console.log(`✅ Unchecked checkbox: ${fieldMapping.fieldName}`)
            }
            break
            
          case 'date':
            // Special handling for split date fields
            if (fieldMapping.fieldName === 'travel_info.arrival_date') {
              console.log(`📝 Handling split arrival date: ${fieldValue}`)
              const { day, month, year } = this.splitDate(fieldValue.toString())
              
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
              
            } else if (fieldMapping.fieldName === 'travel_info.departure_date') {
              console.log(`📝 Handling split departure date: ${fieldValue}`)
              const { day, month, year } = this.splitDate(fieldValue.toString())
              
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
              
            } else {
              // Regular date field handling
              const dateValue = new Date(fieldValue.toString()).toISOString().split('T')[0]
              await element.fill(dateValue)
            }
            break
        }
        
        filledFields++
        
        // Special handling for purpose of trip to trigger conditional fields
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
          await this.fillPurposeSpecifyField(page, jobId, formData, fieldValue.toString())
          
          // Additional wait after purpose specify to ensure all conditional fields are rendered
          await page.waitForTimeout(3000)
          console.log(`🔍 STEP3 - Additional wait after purpose specify completed`)
        }
        
        // Update progress every 5 fields
        if (filledFields % 5 === 0) {
          const progress = 95 + Math.floor((filledFields / totalFields) * 4)
          await this.progressService.updateStepProgress(
            jobId,
            'form_step_3_progress',
            'running',
            `Filled ${filledFields}/${totalFields} Step 3 fields`,
            progress
          )
        }
        
        // Small delay between fields
        await page.waitForTimeout(100)
        
      } catch (error) {
        console.warn(`⚠️ STEP3 - Failed to fill field ${fieldMapping.fieldName}:`, error)
        // Continue with next field instead of failing completely
      }
    }
    
    // Take screenshot after filling
    await this.takeScreenshot(page, jobId, 'after-step3-filling')
    
    // Update final progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_3_completed',
      'running',
      `Successfully filled ${filledFields} Step 3 form fields`,
      34
    )
    
    console.log(`✅ DS-160 Step 3 form filling completed. Filled ${filledFields} fields.`)
    
    // Handle conditional fields after main fields are filled
    await this.fillStep3ConditionalFields(page, jobId, formData)
  }

  /**
   * Fill Step 3 conditional fields that appear based on selections
   */
  private async fillStep3ConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
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
    
    // Handle specific travel plans conditional fields
    const specificTravelPlans = formData['travel_info.specific_travel_plans']
    if (specificTravelPlans === 'Yes') {
      console.log('📝 Filling specific travel plans conditional fields (Yes)...')
      await this.fillSpecificTravelPlansFields(page, jobId, formData)
    } else if (specificTravelPlans === 'No') {
      console.log('📝 Filling specific travel plans conditional fields (No)...')
      await this.fillNoSpecificTravelPlansFields(page, jobId, formData)
    }
    
    console.log('✅ Step 3 conditional fields completed')
    // Click Next button to proceed to Step 4
    await this.clickStep3NextButton(page, jobId)
    
    // Fill Step 4 form
    await this.fillStep4Form(page, jobId, formData)
  }

  /**
   * Fill Step 4 form (Travel Companions)
   */
  private async fillStep4Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting DS-160 Step 4 form filling...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_4',
      'running',
      'Filling Step 4 form fields',
      95
    )
    
    // Get Step 4 field mappings
    const step4Fields = getStep4FieldMappings()
    console.log(`📝 Found ${step4Fields.length} Step 4 fields to fill`)
    
    // Fill main fields first
    for (const fieldMapping of step4Fields) {
      try {
        const fieldValue = formData[fieldMapping.fieldName]
        
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
          continue
        }
        
        console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
        
        const element = page.locator(fieldMapping.selector)
        await element.waitFor({ state: 'visible', timeout: 15000 })
        
        switch (fieldMapping.type) {
          case 'radio':
            // Handle radio button selection
            const radioValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
            console.log(`🔍 STEP4 - Radio value: ${radioValue}`)
            
            const radioSelector = `input[type="radio"][name*="${fieldMapping.selector.split('_').pop()}"][value="${radioValue}"]`
            console.log(`🔍 STEP4 - Radio selector: ${radioSelector}`)
            
            const radioElement = page.locator(radioSelector)
            await radioElement.waitFor({ state: 'visible', timeout: 15000 })
            await radioElement.click()
            console.log(`✅ Selected radio button: ${fieldMapping.fieldName} = ${radioValue}`)
            
            // Wait for postback if "No" is selected (triggers postback)
            if (radioValue === 'N') {
              await this.waitForPostback(page, jobId)
              console.log('✅ Postback completed after radio selection')
            }
            break
            
          case 'text':
            await element.fill(fieldValue.toString())
            console.log(`✅ Filled text field: ${fieldMapping.fieldName}`)
            break
            
          case 'select':
            const selectValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
            await element.selectOption({ value: selectValue })
            console.log(`✅ Selected dropdown: ${fieldMapping.fieldName} = ${selectValue}`)
            break
            
          default:
            console.warn(`⚠️ Unknown field type: ${fieldMapping.type} for ${fieldMapping.fieldName}`)
        }
        
        // Small delay between fields
        await page.waitForTimeout(500)
        
      } catch (error) {
        console.warn(`⚠️ STEP4 - Failed to fill field ${fieldMapping.fieldName}:`, error)
      }
    }
    
    // Handle conditional fields
    await this.fillStep4ConditionalFields(page, jobId, formData)
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_4',
      'completed',
      'Step 4 form filling completed',
      39
    )
    
    console.log('✅ DS-160 Step 4 form filling completed.')
    
    // Click Next button to proceed to Step 5
    await this.clickStep4NextButton(page, jobId)
    
    // Fill Step 5 form
    await this.fillStep5Form(page, jobId, formData)
  }

  /**
   * Fill Step 4 conditional fields
   */
  private async fillStep4ConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 4 conditional fields...')
    
    const travelingWithOthers = formData['traveling_companions.traveling_with_others']
    const travelingAsGroup = formData['traveling_companions.traveling_as_group']
    
    if (travelingWithOthers === 'Yes') {
      console.log('📝 Traveling with others is Yes, waiting for group travel question to appear...')
      
      // Wait for the group travel question to appear
      await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
      
      // Check if we need to select the group travel option
      if (travelingAsGroup !== undefined && travelingAsGroup !== null && travelingAsGroup !== '') {
        console.log(`📝 Selecting group travel option: ${travelingAsGroup}`)
        await this.selectGroupTravelOption(page, jobId, travelingAsGroup)
        
        if (travelingAsGroup === 'Yes') {
          console.log('📝 Traveling as group is Yes, filling group name...')
          await this.fillGroupNameField(page, jobId, formData)
        } else if (travelingAsGroup === 'No') {
          console.log('📝 Traveling as group is No, filling individual companion fields...')
          await this.fillIndividualCompanionFields(page, jobId, formData)
        }
      } else {
        console.log('⚠️ No group travel option specified, skipping conditional fields')
      }
    }
    
    console.log('✅ Step 4 conditional fields completed')
  }

  /**
   * Select group travel option (Yes/No)
   */
  private async selectGroupTravelOption(page: Page, jobId: string, option: string): Promise<void> {
    console.log(`📝 Selecting group travel option: ${option}`)
    
    // Map option to CEAC value
    const radioValue = option === 'Yes' ? 'Y' : 'N'
    console.log(`🔍 STEP4 - Group travel radio value: ${radioValue}`)
    
    // Create radio selector for group travel
    const radioSelector = `input[type="radio"][name*="rblGroupTravel"][value="${radioValue}"]`
    console.log(`🔍 STEP4 - Group travel radio selector: ${radioSelector}`)
    
    const radioElement = page.locator(radioSelector)
    await radioElement.waitFor({ state: 'visible', timeout: 15000 })
    await radioElement.click()
    console.log(`✅ Selected group travel radio button: ${option} (${radioValue})`)
    
    // Wait for postback (both Yes and No trigger postback)
    await this.waitForPostback(page, jobId)
    console.log('✅ Postback completed after group travel selection')
    
    // Additional wait for conditional fields to appear
    await page.waitForTimeout(3000)
  }

  /**
   * Fill group name field
   */
  private async fillGroupNameField(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const groupName = formData['traveling_companions.group_name']
    if (groupName) {
      console.log(`📝 Filling group name: ${groupName}`)
      
      // Wait for group name field to appear
      await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
      
      const groupNameElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxGroupName')
      await groupNameElement.waitFor({ state: 'visible', timeout: 15000 })
      await groupNameElement.fill(groupName.toString())
      console.log(`✅ Filled group name: ${groupName}`)
    }
  }

  /**
   * Fill individual companion fields
   */
  private async fillIndividualCompanionFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling individual companion fields...')
    
    // Wait for companion fields to appear
    await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
    
    // Fill companion surnames
    const companionSurnames = formData['traveling_companions.companion_surnames']
    if (companionSurnames) {
      console.log(`📝 Filling companion surnames: ${companionSurnames}`)
      const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlTravelCompanions_ctl00_tbxSurname')
      await surnamesElement.waitFor({ state: 'visible', timeout: 15000 })
      await surnamesElement.fill(companionSurnames.toString().toUpperCase())
      console.log(`✅ Filled companion surnames: ${companionSurnames}`)
    }
    
    // Fill companion given names
    const companionGivenNames = formData['traveling_companions.companion_given_names']
    if (companionGivenNames) {
      console.log(`📝 Filling companion given names: ${companionGivenNames}`)
      const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlTravelCompanions_ctl00_tbxGivenName')
      await givenNamesElement.waitFor({ state: 'visible', timeout: 15000 })
      await givenNamesElement.fill(companionGivenNames.toString().toUpperCase())
      console.log(`✅ Filled companion given names: ${companionGivenNames}`)
    }
    
    // Fill companion relationship
    const companionRelationship = formData['traveling_companions.companion_relationship']
    if (companionRelationship) {
      console.log(`📝 Filling companion relationship: ${companionRelationship}`)
      
      // Map relationship to CEAC values
      const relationshipMapping: Record<string, string> = {
        'PARENT': 'P',
        'SPOUSE': 'S',
        'CHILD': 'C',
        'OTHER RELATIVE': 'R',
        'FRIEND': 'F',
        'BUSINESS ASSOCIATE': 'B',
        'OTHER': 'O'
      }
      
      const relationshipValue = relationshipMapping[companionRelationship.toString()] || companionRelationship.toString()
      const relationshipElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlTravelCompanions_ctl00_ddlTCRelationship')
      await relationshipElement.waitFor({ state: 'visible', timeout: 15000 })
      await relationshipElement.selectOption({ value: relationshipValue })
      console.log(`✅ Filled companion relationship: ${companionRelationship} (${relationshipValue})`)
    }
    
    console.log('✅ Completed filling individual companion fields')
  }

  /**
   * Click the Next button on Step 4 to proceed to Step 5
   */
  private async clickStep4NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button on Step 4 to proceed to Step 5...')
    const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
    if (await nextButton.isVisible({ timeout: 10000 })) {
      await nextButton.click()
      console.log('✅ Step 4 Next button clicked')
      await page.waitForLoadState('networkidle')
      
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        'form_step_5',
        'running',
        'Successfully navigated to Step 5',
        100
      )
      
      // Take screenshot
      await this.takeScreenshot(page, jobId, 'after-step4-next-click')
      console.log('✅ Successfully navigated to Step 5')
    } else {
      throw new Error('Step 4 Next button not found')
    }
  }

  /**
   * Fill Step 5 form (Previous U.S. Travel)
   */
  private async fillStep5Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting DS-160 Step 5 form filling...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_5',
      'running',
      'Filling Step 5 form fields',
      95
    )
    
    // Get Step 5 field mappings
    const step5Fields = getStep5FieldMappings()
    console.log(`📝 Found ${step5Fields.length} Step 5 fields to fill`)
    
    // Fill main fields first
    for (const fieldMapping of step5Fields) {
      try {
        const fieldValue = formData[fieldMapping.fieldName]
        
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
          continue
        }
        
        console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
        
        const element = page.locator(fieldMapping.selector)
        await element.waitFor({ state: 'visible', timeout: 15000 })
        
        switch (fieldMapping.type) {
          case 'radio':
            // Handle radio button selection
            const radioValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
            console.log(`🔍 STEP5 - Radio value: ${radioValue}`)
            
            // Extract the base ID from the field mapping selector and construct the radio button ID
            const baseId = fieldMapping.selector.replace('#', '')
            const radioButtonId = `${baseId}_${radioValue === 'Y' ? '0' : '1'}`
            console.log(`🔍 STEP5 - Radio button ID: ${radioButtonId}`)
            
            const radioElement = page.locator(`#${radioButtonId}`)
            await radioElement.waitFor({ state: 'visible', timeout: 15000 })
            await radioElement.click()
            console.log(`✅ Selected radio button: ${fieldMapping.fieldName} = ${radioValue}`)
            
            // Wait for postback (both Yes and No trigger postback)
            await this.waitForPostback(page, jobId)
            console.log('✅ Postback completed after radio selection')
            
            // Handle conditional fields immediately after radio selection
            if (radioValue === 'Y' && fieldMapping.conditional) {
              console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
              await this.handleStep5ConditionalFields(page, jobId, formData, fieldMapping)
            }
            break
            
          case 'text':
            await element.fill(fieldValue.toString())
            console.log(`✅ Filled text field: ${fieldMapping.fieldName}`)
            break
            
          case 'select':
            const selectValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
            await element.selectOption({ value: selectValue })
            console.log(`✅ Selected dropdown: ${fieldMapping.fieldName} = ${selectValue}`)
            break
            
          case 'checkbox':
            if (fieldValue === true || fieldValue === 'Yes') {
              await element.check()
              console.log(`✅ Checked checkbox: ${fieldMapping.fieldName}`)
            } else {
              await element.uncheck()
              console.log(`✅ Unchecked checkbox: ${fieldMapping.fieldName}`)
            }
            break
            
          default:
            console.warn(`⚠️ Unknown field type: ${fieldMapping.type} for ${fieldMapping.fieldName}`)
        }
        
        // Small delay between fields
        await page.waitForTimeout(500)
        
      } catch (error) {
        console.warn(`⚠️ STEP5 - Failed to fill field ${fieldMapping.fieldName}:`, error)
      }
    }
    
    // Conditional fields are now handled immediately after each radio button selection
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_5',
      'completed',
      'Step 5 form filling completed',
      44
    )
    
    console.log('✅ DS-160 Step 5 form filling completed.')
    
    // Click Next button to proceed to Step 6
    await this.clickStep5NextButton(page, jobId)
    
    // Fill Step 6 form
    await this.fillStep6Form(page, jobId, formData)
  }

  /**
   * Fill Step 5 conditional fields
   */
  private async fillStep5ConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 5 conditional fields...')
    
    const beenInUS = formData['us_history.been_in_us']
    const hasUSDL = formData['us_history.us_driver_license']
    const hasUSVisa = formData['us_history.us_visa_issued']
    
    if (beenInUS === 'Yes') {
      console.log('📝 Been in US is Yes, filling previous visit fields...')
      await this.fillPreviousVisitFields(page, jobId, formData)
      
      if (hasUSDL === 'Yes') {
        console.log('📝 Has US driver license is Yes, filling driver license fields...')
        await this.fillDriverLicenseFields(page, jobId, formData)
      }
    }
    
    if (hasUSVisa === 'Yes') {
      console.log('📝 Has US visa is Yes, filling visa fields...')
      await this.fillUSVisaFields(page, jobId, formData)
    }
    
    // Handle visa refusal question (independent of other sections)
    const visaRefused = formData['us_history.visa_refused']
    if (visaRefused === 'Yes') {
      console.log('📝 Visa refused is Yes, filling refusal explanation...')
      await this.fillVisaRefusalFields(page, jobId, formData)
    }
    
    // Handle immigrant petition question (independent of other sections)
    const immigrantPetition = formData['us_history.immigrant_petition']
    if (immigrantPetition === 'Yes') {
      console.log('📝 Immigrant petition is Yes, filling petition explanation...')
      await this.fillImmigrantPetitionFields(page, jobId, formData)
    }
    
    console.log('✅ Step 5 conditional fields completed')
  }

  /**
   * Fill previous visit fields
   */
  private async fillPreviousVisitFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling previous visit fields...')
    
    // Wait for previous visit fields to appear
    await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
    
    // Fill date arrived (split into day, month, year)
    const lastVisitDate = formData['us_history.last_visit_date']
    if (lastVisitDate) {
      console.log(`📝 Filling last visit date: ${lastVisitDate}`)
      const { day, month, year } = this.splitDate(lastVisitDate.toString())
      
      // Fill day dropdown
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_DTEDay')
      await dayElement.waitFor({ state: 'visible', timeout: 15000 })
      await dayElement.selectOption({ value: day })
      console.log(`✅ Filled last visit day: ${day}`)
      
      // Fill month dropdown
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_DTEMonth')
      await monthElement.waitFor({ state: 'visible', timeout: 15000 })
      await monthElement.selectOption({ value: month })
      console.log(`✅ Filled last visit month: ${month}`)
      
      // Fill year input
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_tbxPREV_US_VISIT_DTEYear')
      await yearElement.waitFor({ state: 'visible', timeout: 15000 })
      await yearElement.fill(year)
      console.log(`✅ Filled last visit year: ${year}`)
    }
    
    // Fill length of stay
    const lengthValue = formData['us_history.last_visit_length_value']
    if (lengthValue) {
      console.log(`📝 Filling length of stay value: ${lengthValue}`)
      const lengthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_tbxPREV_US_VISIT_LOS')
      await lengthElement.waitFor({ state: 'visible', timeout: 15000 })
      await lengthElement.fill(lengthValue.toString())
      console.log(`✅ Filled length of stay value: ${lengthValue}`)
    }
    
    // Fill length of stay unit
    const lengthUnit = formData['us_history.last_visit_length_unit']
    if (lengthUnit) {
      console.log(`📝 Filling length of stay unit: ${lengthUnit}`)
      
      // Map unit to CEAC values
      const unitMapping: Record<string, string> = {
        'Year(s)': 'Y',
        'Month(s)': 'M',
        'Week(s)': 'W',
        'Day(s)': 'D',
        'Less than 24 hours': 'H'
      }
      
      const unitValue = unitMapping[lengthUnit.toString()] || lengthUnit.toString()
      const unitElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_LOS_CD')
      await unitElement.waitFor({ state: 'visible', timeout: 15000 })
      await unitElement.selectOption({ value: unitValue })
      console.log(`✅ Filled length of stay unit: ${lengthUnit} (${unitValue})`)
    }
    
    console.log('✅ Completed filling previous visit fields')
  }

  /**
   * Fill driver license fields
   */
  private async fillDriverLicenseFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling driver license fields...')
    
    // Wait for driver license fields to appear
    await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
    
    // Fill driver license number
    const licenseNumber = formData['us_history.driver_license_number']
    if (licenseNumber && licenseNumber !== 'N/A') {
      console.log(`📝 Filling driver license number: ${licenseNumber}`)
      const licenseElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_tbxUS_DRIVER_LICENSE')
      await licenseElement.waitFor({ state: 'visible', timeout: 15000 })
      await licenseElement.fill(licenseNumber.toString())
      console.log(`✅ Filled driver license number: ${licenseNumber}`)
    }
    
    // Handle "Do not know" checkbox
    const licenseUnknown = formData['us_history.driver_license_unknown']
    if (licenseUnknown === true || licenseNumber === 'N/A') {
      console.log('📝 Checking "Do not know" checkbox for driver license')
      const unknownElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_cbxUS_DRIVER_LICENSE_NA')
      await unknownElement.waitFor({ state: 'visible', timeout: 15000 })
      await unknownElement.check()
      console.log('✅ Checked "Do not know" checkbox for driver license')
    }
    
    // Fill driver license state
    const licenseState = formData['us_history.driver_license_state']
    if (licenseState) {
      console.log(`📝 Filling driver license state: ${licenseState}`)
      const stateElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_ddlUS_DRIVER_LICENSE_STATE')
      await stateElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateElement.selectOption({ value: licenseState.toString() })
      console.log(`✅ Filled driver license state: ${licenseState}`)
    }
    
    console.log('✅ Completed filling driver license fields')
  }

  /**
   * Fill U.S. Visa fields
   */
  private async fillUSVisaFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling U.S. Visa fields...')
    
    // Wait for visa fields to appear
    await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
    
    // Fill last visa issued date (split into day, month, year)
    const lastVisaDate = formData['us_history.last_visa_issued_date']
    if (lastVisaDate) {
      console.log(`📝 Filling last visa issued date: ${lastVisaDate}`)
      const { day, month, year } = this.splitDate(lastVisaDate.toString())
      
      // Fill day dropdown
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlPREV_VISA_ISSUED_DTEDay')
      await dayElement.waitFor({ state: 'visible', timeout: 15000 })
      await dayElement.selectOption({ value: day })
      console.log(`✅ Filled last visa day: ${day}`)
      
      // Fill month dropdown
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlPREV_VISA_ISSUED_DTEMonth')
      await monthElement.waitFor({ state: 'visible', timeout: 15000 })
      await monthElement.selectOption({ value: month })
      console.log(`✅ Filled last visa month: ${month}`)
      
      // Fill year input
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_ISSUED_DTEYear')
      await yearElement.waitFor({ state: 'visible', timeout: 15000 })
      await yearElement.fill(year)
      console.log(`✅ Filled last visa year: ${year}`)
    }
    
    // Fill visa number
    const visaNumber = formData['us_history.visa_number']
    if (visaNumber && visaNumber !== 'N/A') {
      console.log(`📝 Filling visa number: ${visaNumber}`)
      const visaNumberElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_FOIL_NUMBER')
      await visaNumberElement.waitFor({ state: 'visible', timeout: 15000 })
      await visaNumberElement.fill(visaNumber.toString())
      console.log(`✅ Filled visa number: ${visaNumber}`)
    }
    
    // Handle "Do not know" checkbox for visa number
    const visaNumberUnknown = formData['us_history.visa_number_unknown']
    if (visaNumberUnknown === true || visaNumber === 'N/A') {
      console.log('📝 Checking "Do not know" checkbox for visa number')
      const unknownElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxPREV_VISA_FOIL_NUMBER_NA')
      await unknownElement.waitFor({ state: 'visible', timeout: 15000 })
      await unknownElement.check()
      console.log('✅ Checked "Do not know" checkbox for visa number')
    }
    
    // Fill same visa type
    const sameVisaType = formData['us_history.same_visa_type']
    if (sameVisaType) {
      console.log(`📝 Filling same visa type: ${sameVisaType}`)
      const radioValue = sameVisaType === 'Yes' ? 'Y' : 'N'
      const radioSelector = `input[type="radio"][name*="rblPREV_VISA_SAME_TYPE_IND"][value="${radioValue}"]`
      const radioElement = page.locator(radioSelector)
      await radioElement.waitFor({ state: 'visible', timeout: 15000 })
      await radioElement.click()
      console.log(`✅ Selected same visa type: ${sameVisaType} (${radioValue})`)
    }
    
    // Fill same country
    const sameCountry = formData['us_history.same_country']
    if (sameCountry) {
      console.log(`📝 Filling same country: ${sameCountry}`)
      const radioValue = sameCountry === 'Yes' ? 'Y' : 'N'
      const radioSelector = `input[type="radio"][name*="rblPREV_VISA_SAME_CNTRY_IND"][value="${radioValue}"]`
      const radioElement = page.locator(radioSelector)
      await radioElement.waitFor({ state: 'visible', timeout: 15000 })
      await radioElement.click()
      console.log(`✅ Selected same country: ${sameCountry} (${radioValue})`)
    }
    
    // Fill ten printed
    const tenPrinted = formData['us_history.ten_printed']
    if (tenPrinted) {
      console.log(`📝 Filling ten printed: ${tenPrinted}`)
      const radioValue = tenPrinted === 'Yes' ? 'Y' : 'N'
      const radioSelector = `input[type="radio"][name*="rblPREV_VISA_TEN_PRINT_IND"][value="${radioValue}"]`
      const radioElement = page.locator(radioSelector)
      await radioElement.waitFor({ state: 'visible', timeout: 15000 })
      await radioElement.click()
      console.log(`✅ Selected ten printed: ${tenPrinted} (${radioValue})`)
    }
    
    // Handle visa lost/stolen
    const visaLostStolen = formData['us_history.visa_lost_stolen']
    if (visaLostStolen) {
      console.log(`📝 Filling visa lost/stolen: ${visaLostStolen}`)
      const radioValue = visaLostStolen === 'Yes' ? 'Y' : 'N'
      const radioSelector = `input[type="radio"][name*="rblPREV_VISA_LOST_IND"][value="${radioValue}"]`
      const radioElement = page.locator(radioSelector)
      await radioElement.waitFor({ state: 'visible', timeout: 15000 })
      await radioElement.click()
      console.log(`✅ Selected visa lost/stolen: ${visaLostStolen} (${radioValue})`)
      
      // Wait for postback if Yes
      if (visaLostStolen === 'Yes') {
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after visa lost/stolen selection')
        await page.waitForTimeout(3000) // Wait for conditional fields to appear
        
        // Fill visa lost year
        const visaLostYear = formData['us_history.visa_lost_year']
        if (visaLostYear) {
          console.log(`📝 Filling visa lost year: ${visaLostYear}`)
          const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_LOST_YEAR')
          await yearElement.waitFor({ state: 'visible', timeout: 15000 })
          await yearElement.fill(visaLostYear.toString())
          console.log(`✅ Filled visa lost year: ${visaLostYear}`)
        }
        
        // Fill visa lost explanation
        const visaLostExplanation = formData['us_history.visa_lost_explanation']
        if (visaLostExplanation) {
          console.log(`📝 Filling visa lost explanation: ${visaLostExplanation}`)
          const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_LOST_EXPL')
          await explanationElement.waitFor({ state: 'visible', timeout: 15000 })
          await explanationElement.fill(visaLostExplanation.toString())
          console.log(`✅ Filled visa lost explanation: ${visaLostExplanation}`)
        }
      }
    }
    
    // Handle visa cancelled/revoked
    const visaCancelledRevoked = formData['us_history.visa_cancelled_revoked']
    if (visaCancelledRevoked) {
      console.log(`📝 Filling visa cancelled/revoked: ${visaCancelledRevoked}`)
      const radioValue = visaCancelledRevoked === 'Yes' ? 'Y' : 'N'
      const radioSelector = `input[type="radio"][name*="rblPREV_VISA_CANCELLED_IND"][value="${radioValue}"]`
      const radioElement = page.locator(radioSelector)
      await radioElement.waitFor({ state: 'visible', timeout: 15000 })
      await radioElement.click()
      console.log(`✅ Selected visa cancelled/revoked: ${visaCancelledRevoked} (${radioValue})`)
      
      // Wait for postback if Yes
      if (visaCancelledRevoked === 'Yes') {
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after visa cancelled/revoked selection')
        await page.waitForTimeout(3000) // Wait for conditional fields to appear
        
        // Fill visa cancelled explanation
        const visaCancelledExplanation = formData['us_history.visa_cancelled_explanation']
        if (visaCancelledExplanation) {
          console.log(`📝 Filling visa cancelled explanation: ${visaCancelledExplanation}`)
          const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_CANCELLED_EXPL')
          await explanationElement.waitFor({ state: 'visible', timeout: 15000 })
          await explanationElement.fill(visaCancelledExplanation.toString())
          console.log(`✅ Filled visa cancelled explanation: ${visaCancelledExplanation}`)
        }
      }
    }
    
    console.log('✅ Completed filling U.S. Visa fields')
  }

  /**
   * Fill visa refusal fields
   */
  private async fillVisaRefusalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling visa refusal fields...')
    
    // Wait for visa refusal fields to appear
    await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
    
    // Fill visa refused explanation
    const visaRefusedExplanation = formData['us_history.visa_refused_explanation']
    if (visaRefusedExplanation) {
      console.log(`📝 Filling visa refused explanation: ${visaRefusedExplanation}`)
      const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_REFUSED_EXPL')
      await explanationElement.waitFor({ state: 'visible', timeout: 15000 })
      await explanationElement.fill(visaRefusedExplanation.toString())
      console.log(`✅ Filled visa refused explanation: ${visaRefusedExplanation}`)
    }
    
    console.log('✅ Completed filling visa refusal fields')
  }

  /**
   * Fill immigrant petition fields
   */
  private async fillImmigrantPetitionFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling immigrant petition fields...')
    
    // Wait for immigrant petition fields to appear
    await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
    
    // Fill immigrant petition explanation
    const immigrantPetitionExplanation = formData['us_history.immigrant_petition_explanation']
    if (immigrantPetitionExplanation) {
      console.log(`📝 Filling immigrant petition explanation: ${immigrantPetitionExplanation}`)
      const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxIV_PETITION_EXPL')
      await explanationElement.waitFor({ state: 'visible', timeout: 15000 })
      await explanationElement.fill(immigrantPetitionExplanation.toString())
      console.log(`✅ Filled immigrant petition explanation: ${immigrantPetitionExplanation}`)
    }
    
    console.log('✅ Completed filling immigrant petition fields')
  }

  /**
   * Handle conditional fields for Step 5 immediately after radio button selection
   */
  private async handleStep5ConditionalFields(page: Page, jobId: string, formData: DS160FormData, fieldMapping: any): Promise<void> {
    console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
    
    // Wait for conditional fields to appear
    await page.waitForTimeout(3000)
    
    if (fieldMapping.fieldName === 'us_history.been_in_us') {
      console.log('📝 Handling been in US conditional fields...')
      await this.fillPreviousVisitFields(page, jobId, formData)
      
      // Handle the driver license question that appears after previous visit fields
      const hasUSDL = formData['us_history.us_driver_license']
      if (hasUSDL !== undefined && hasUSDL !== null && hasUSDL !== '') {
        console.log(`📝 Selecting driver license option: ${hasUSDL}`)
        await this.selectDriverLicenseOption(page, jobId, hasUSDL)
        
        if (hasUSDL === 'Yes') {
          console.log('📝 Has US driver license is Yes, filling driver license fields...')
          await this.fillDriverLicenseFields(page, jobId, formData)
        }
      }
    } else if (fieldMapping.fieldName === 'us_history.us_visa_issued') {
      console.log('📝 Handling US visa issued conditional fields...')
      await this.fillUSVisaFields(page, jobId, formData)
    } else if (fieldMapping.fieldName === 'us_history.visa_refused') {
      console.log('📝 Handling visa refused conditional fields...')
      await this.fillVisaRefusalFields(page, jobId, formData)
    } else if (fieldMapping.fieldName === 'us_history.immigrant_petition') {
      console.log('📝 Handling immigrant petition conditional fields...')
      await this.fillImmigrantPetitionFields(page, jobId, formData)
    }
    
    console.log(`✅ Completed conditional fields for: ${fieldMapping.fieldName}`)
  }

  /**
   * Select driver license option
   */
  private async selectDriverLicenseOption(page: Page, jobId: string, option: string): Promise<void> {
    console.log(`📝 Selecting driver license option: ${option}`)
    const radioValue = option === 'Yes' ? 'Y' : 'N'
    console.log(`🔍 STEP5 - Driver license radio value: ${radioValue}`)
    
    // Construct the radio button ID for driver license
    const radioButtonId = `ctl00_SiteContentPlaceHolder_FormView1_rblPREV_US_DRIVER_LIC_IND_${radioValue === 'Y' ? '0' : '1'}`
    console.log(`🔍 STEP5 - Driver license radio button ID: ${radioButtonId}`)
    
    const radioElement = page.locator(`#${radioButtonId}`)
    await radioElement.waitFor({ state: 'visible', timeout: 15000 })
    await radioElement.click()
    console.log(`✅ Selected driver license radio button: ${option} (${radioValue})`)
    
    // Wait for postback
    await this.waitForPostback(page, jobId)
    console.log('✅ Postback completed after driver license selection')
    await page.waitForTimeout(3000) // Wait for conditional fields to appear
  }

  /**
   * Click the Next button on Step 5 to proceed to Step 6
   */
  private async clickStep5NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button on Step 5 to proceed to Step 6...')
    const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
    if (await nextButton.isVisible({ timeout: 10000 })) {
      await nextButton.click()
      console.log('✅ Step 5 Next button clicked')
      await page.waitForLoadState('networkidle')
      
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        'form_step_6',
        'running',
        'Successfully navigated to Step 6',
        100
      )
      
      // Take screenshot
      await this.takeScreenshot(page, jobId, 'after-step5-next-click')
      console.log('✅ Successfully navigated to Step 6')
    } else {
      throw new Error('Step 5 Next button not found')
    }
  }

  /**
   * Fill Step 6 form (Contact Information)
   */
  private async fillStep6Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting DS-160 Step 6 form filling...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_6',
      'running',
      'Filling Step 6 form fields',
      48
    )
    
    // Get Step 6 field mappings
    const step6Fields = getStep6FieldMappings()
    console.log(`📝 Found ${step6Fields.length} Step 6 fields to fill`)
    
    // Fill main fields first
    for (const fieldMapping of step6Fields) {
      try {
        const fieldValue = formData[fieldMapping.fieldName]
        
        // Special handling for additional phone/email questions - only set default if field is completely missing
        if ((fieldMapping.fieldName === 'contact_info.other_phone_numbers' || 
             fieldMapping.fieldName === 'contact_info.other_email_addresses') && 
            !(fieldMapping.fieldName in formData)) {
          console.log(`📝 Field ${fieldMapping.fieldName} not found in form data, setting default value "No"`)
          const defaultValue = 'No'
          console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${defaultValue}`)
          
          // Handle as radio button with default "No" value
          const radioValue = 'N'
          console.log(`🔍 STEP6 - Radio value: ${radioValue}`)
          
          const baseId = fieldMapping.selector.replace('#', '')
          const radioButtonId = `${baseId}_1`
          console.log(`🔍 STEP6 - Radio button ID: ${radioButtonId}`)
          
          const radioElement = page.locator(`#${radioButtonId}`)
          await radioElement.waitFor({ state: 'visible', timeout: 15000 })
          await radioElement.click()
          console.log(`✅ Selected radio button: ${fieldMapping.fieldName} = ${radioValue}`)
          
          continue
        }
        
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
          continue
        }
        
        console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
        
        const element = page.locator(fieldMapping.selector)
        await element.waitFor({ state: 'visible', timeout: 15000 })
        
        switch (fieldMapping.type) {
          case 'radio':
            // Handle radio button selection
            const radioValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
            console.log(`🔍 STEP6 - Radio value: ${radioValue}`)
            
            // Extract the base ID from the field mapping selector and construct the radio button ID
            const baseId = fieldMapping.selector.replace('#', '')
            const radioButtonId = `${baseId}_${radioValue === 'Y' ? '0' : '1'}`
            console.log(`🔍 STEP6 - Radio button ID: ${radioButtonId}`)
            
            const radioElement = page.locator(`#${radioButtonId}`)
            await radioElement.waitFor({ state: 'visible', timeout: 15000 })
            await radioElement.click()
            console.log(`✅ Selected radio button: ${fieldMapping.fieldName} = ${radioValue}`)
            
            // Wait for postback (both Yes and No can trigger conditional fields)
            if (radioValue === 'N' || radioValue === 'Y') {
              await this.waitForPostback(page, jobId)
              console.log('✅ Postback completed after radio selection')
            }
            
            // Handle conditional fields immediately after radio selection
            if (fieldMapping.conditional) {
              console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
              await this.handleStep6ConditionalFields(page, jobId, formData, fieldMapping)
            }
            break
            
          case 'text':
            await element.fill(fieldValue.toString())
            console.log(`✅ Filled text field: ${fieldMapping.fieldName}`)
            break
            
          case 'select':
            const selectValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
            await element.selectOption({ value: selectValue })
            console.log(`✅ Selected dropdown: ${fieldMapping.fieldName} = ${selectValue}`)
            break
            
          case 'checkbox':
            if (fieldValue === true || fieldValue === 'Yes') {
              await element.check()
              console.log(`✅ Checked checkbox: ${fieldMapping.fieldName}`)
            } else {
              await element.uncheck()
              console.log(`✅ Unchecked checkbox: ${fieldMapping.fieldName}`)
            }
            break
            
          default:
            console.warn(`⚠️ Unknown field type: ${fieldMapping.type} for ${fieldMapping.fieldName}`)
        }
        
        // Small delay between fields
        await page.waitForTimeout(500)
        
              } catch (error) {
          console.warn(`⚠️ STEP6 - Failed to fill field ${fieldMapping.fieldName}:`, error)
          
          // Special handling for country dropdown failures
          if (fieldMapping.fieldName === 'contact_info.home_country' || fieldMapping.fieldName === 'contact_info.mailing_country') {
            console.log(`🔄 Retrying country selection for ${fieldMapping.fieldName} with different approach...`)
            try {
              const element = page.locator(fieldMapping.selector)
              await element.waitFor({ state: 'visible', timeout: 15000 })
              
              // Get the field value again for retry
              const retryFieldValue = formData[fieldMapping.fieldName]
              if (retryFieldValue) {
                // Try selecting by label instead of value
                await element.selectOption({ label: retryFieldValue.toString() })
                console.log(`✅ Successfully selected country by label: ${fieldMapping.fieldName} = ${retryFieldValue}`)
              }
            } catch (retryError) {
              console.error(`❌ Failed to retry country selection: ${fieldMapping.fieldName}`, retryError)
            }
          }
        }
    }
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_6',
      'completed',
      'Step 6 form filling completed',
      41
    )
    
    console.log('✅ DS-160 Step 6 form filling completed.')
    
    // Click Next button to proceed to Step 7
    await this.clickStep6NextButton(page, jobId)
    
    // Fill Step 7 form
    await this.fillStep7Form(page, jobId, formData)
    
    // Click Next button to proceed to Step 8
    await this.clickStep7NextButton(page, jobId)
    
    // Fill Step 8 form
    await this.fillStep8Form(page, jobId, formData)
    
    // Click Next button to proceed to Step 9
    await this.clickStep8NextButton(page, jobId)
    
    // Fill Step 9 form
    await this.fillStep9Form(page, jobId, formData)
    
    // Click Next button to proceed to Step 10
    await this.clickStep9NextButton(page, jobId)
    
    // Fill Step 10 form
    await this.fillStep10Form(page, jobId, formData)
    
    // Click Next button to proceed to Step 11
    await this.clickStep10NextButton(page, jobId)
    
    // Fill Step 11 form
    await this.fillStep11Form(page, jobId, formData)
  }

  /**
   * Handle conditional fields for Step 6 immediately after radio button selection
   */
  private async handleStep6ConditionalFields(page: Page, jobId: string, formData: DS160FormData, fieldMapping: any): Promise<void> {
    console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
    
    // Wait for conditional fields to appear
    await page.waitForTimeout(3000)
    
    if (fieldMapping.fieldName === 'contact_info.mailing_same_as_home') {
      console.log('📝 Handling mailing address conditional fields...')
      await this.fillMailingAddressFields(page, jobId, formData)
    } else if (fieldMapping.fieldName === 'contact_info.other_phone_numbers') {
      console.log('📝 Handling additional phone numbers conditional fields...')
      await this.fillAdditionalPhoneNumberField(page, jobId, formData)
    } else if (fieldMapping.fieldName === 'contact_info.other_email_addresses') {
      console.log('📝 Handling additional email addresses conditional fields...')
      await this.fillAdditionalEmailAddressField(page, jobId, formData)
    }
    
    console.log(`✅ Completed conditional fields for: ${fieldMapping.fieldName}`)
  }

  /**
   * Fill mailing address fields
   */
  private async fillMailingAddressFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling mailing address fields...')
    
    // Wait for mailing address fields to appear
    await page.waitForTimeout(3000)
    
    // Fill mailing address line 1
    const mailingAddressLine1 = formData['contact_info.mailing_address_line1']
    if (mailingAddressLine1) {
      console.log(`📝 Filling mailing address line 1: ${mailingAddressLine1}`)
      const addressElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_LN1')
      await addressElement.waitFor({ state: 'visible', timeout: 15000 })
      await addressElement.fill(mailingAddressLine1.toString())
      console.log(`✅ Filled mailing address line 1: ${mailingAddressLine1}`)
    }
    
    // Fill mailing address line 2
    const mailingAddressLine2 = formData['contact_info.mailing_address_line2']
    if (mailingAddressLine2) {
      console.log(`📝 Filling mailing address line 2: ${mailingAddressLine2}`)
      const addressElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_LN2')
      await addressElement.waitFor({ state: 'visible', timeout: 15000 })
      await addressElement.fill(mailingAddressLine2.toString())
      console.log(`✅ Filled mailing address line 2: ${mailingAddressLine2}`)
    }
    
    // Fill mailing city
    const mailingCity = formData['contact_info.mailing_city']
    if (mailingCity) {
      console.log(`📝 Filling mailing city: ${mailingCity}`)
      const cityElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_CITY')
      await cityElement.waitFor({ state: 'visible', timeout: 15000 })
      await cityElement.fill(mailingCity.toString())
      console.log(`✅ Filled mailing city: ${mailingCity}`)
    }
    
    // Handle mailing state/province
    const mailingState = formData['contact_info.mailing_state']
    const mailingStateNA = formData['contact_info.mailing_state_na']
    if (mailingStateNA === true || mailingState === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for mailing state')
      const stateNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexMAILING_ADDR_STATE_NA')
      await stateNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for mailing state')
    } else if (mailingState) {
      console.log(`📝 Filling mailing state: ${mailingState}`)
      const stateElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_STATE')
      await stateElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateElement.fill(mailingState.toString())
      console.log(`✅ Filled mailing state: ${mailingState}`)
    }
    
    // Handle mailing postal code
    const mailingPostalCode = formData['contact_info.mailing_postal_code']
    const mailingPostalNA = formData['contact_info.mailing_postal_na']
    if (mailingPostalNA === true || mailingPostalCode === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for mailing postal code')
      const postalNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexMAILING_ADDR_POSTAL_CD_NA')
      await postalNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await postalNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for mailing postal code')
    } else if (mailingPostalCode) {
      console.log(`📝 Filling mailing postal code: ${mailingPostalCode}`)
      const postalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_POSTAL_CD')
      await postalElement.waitFor({ state: 'visible', timeout: 15000 })
      await postalElement.fill(mailingPostalCode.toString())
      console.log(`✅ Filled mailing postal code: ${mailingPostalCode}`)
    }
    
    // Fill mailing country
    const mailingCountry = formData['contact_info.mailing_country']
    if (mailingCountry) {
      console.log(`📝 Filling mailing country: ${mailingCountry}`)
      const countryElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlMailCountry')
      await countryElement.waitFor({ state: 'visible', timeout: 15000 })
      
      // Get country code from country name
      const countryCode = getCountryCode(mailingCountry)
      if (countryCode) {
        await countryElement.selectOption({ value: countryCode })
        console.log(`✅ Selected mailing country: ${mailingCountry} (${countryCode})`)
      } else {
        console.warn(`⚠️ Could not find country code for: ${mailingCountry}`)
      }
    }
    
    console.log('✅ Completed filling mailing address fields')
  }

  /**
   * Fill additional phone number field
   */
  private async fillAdditionalPhoneNumberField(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling additional phone number field...')
    
    // Wait for additional phone number field to appear
    await page.waitForTimeout(3000)
    
    const additionalPhoneNumber = formData['contact_info.additional_phone']
    if (additionalPhoneNumber) {
      console.log(`📝 Filling additional phone number: ${additionalPhoneNumber}`)
      const phoneElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlAddPhone_ctl00_tbxAddPhoneInfo')
      await phoneElement.waitFor({ state: 'visible', timeout: 15000 })
      await phoneElement.fill(additionalPhoneNumber.toString())
      console.log(`✅ Filled additional phone number: ${additionalPhoneNumber}`)
    } else {
      console.log('⏭️ No additional phone number provided, skipping field')
    }
    
    console.log('✅ Completed filling additional phone number field')
  }

  /**
   * Fill additional email address field
   */
  private async fillAdditionalEmailAddressField(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling additional email address field...')
    
    // Wait for additional email address field to appear
    await page.waitForTimeout(3000)
    
    const additionalEmailAddress = formData['contact_info.additional_email']
    if (additionalEmailAddress) {
      console.log(`📝 Filling additional email address: ${additionalEmailAddress}`)
      const emailElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlAddEmail_ctl00_tbxAddEmailInfo')
      await emailElement.waitFor({ state: 'visible', timeout: 15000 })
      await emailElement.fill(additionalEmailAddress.toString())
      console.log(`✅ Filled additional email address: ${additionalEmailAddress}`)
    } else {
      console.log('⏭️ No additional email address provided, skipping field')
    }
    
    console.log('✅ Completed filling additional email address field')
  }

  /**
   * Click the Next button on Step 6 to proceed to Step 7
   */
  private async clickStep6NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button on Step 6 to proceed to Step 7...')
    
    // Try up to 3 times to click the Next button
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt} to click Step 6 Next button...`)
        
        const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
        if (await nextButton.isVisible({ timeout: 10000 })) {
          await nextButton.click()
          console.log(`✅ Step 6 Next button clicked (attempt ${attempt})`)
          
          // Wait for navigation with better error handling
          try {
            console.log('⏳ Waiting for page to load after Step 6 Next button click...')
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
          
          // Verify we're on Step 7 by checking for a Step 7 specific element
          try {
            const step7Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_TYPE')
            await step7Element.waitFor({ state: 'visible', timeout: 15000 })
            console.log('✅ Confirmed we are on Step 7 (Passport Type dropdown found)')
            
            // If we get here, navigation was successful
            break
          } catch (error) {
            console.log(`⚠️ Could not confirm Step 7 navigation on attempt ${attempt}, but proceeding...`)
            if (attempt === 3) {
              // Take a screenshot to see what page we're on
              await this.takeScreenshot(page, jobId, 'step6-next-click-verification')
            }
          }
          
          // If we get here, navigation was successful
          break
        } else {
          throw new Error('Step 6 Next button not found')
        }
             } catch (error) {
         const errorMessage = error instanceof Error ? error.message : String(error)
         console.log(`❌ Attempt ${attempt} failed: ${errorMessage}`)
         if (attempt === 3) {
           throw new Error(`Failed to navigate from Step 6 to Step 7 after 3 attempts: ${errorMessage}`)
         }
        
        // Wait before retrying
        console.log('⏳ Waiting 3 seconds before retry...')
        await page.waitForTimeout(3000)
      }
        }
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_7',
      'running',
      'Successfully navigated to Step 7',
      41
    )
    
    // Take screenshot
    await this.takeScreenshot(page, jobId, 'after-step6-next-click')
    console.log('✅ Successfully navigated to Step 7')
  }

  /**
   * Fill Step 7 form (Passport/Visa Information)
   */
  private async fillStep7Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting Step 7 form filling (Passport/Visa Information)...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_7',
      'running',
      'Filling Step 7 form fields',
      41
    )
    
    try {
      // Verify we're on the correct page before proceeding
      console.log('🔍 Verifying we are on Step 7 page...')
      const step7Indicator = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_TYPE')
      try {
        await step7Indicator.waitFor({ state: 'visible', timeout: 10000 })
        console.log('✅ Confirmed we are on Step 7 page')
      } catch (error) {
        console.log('⚠️ Could not find Step 7 indicator, taking screenshot for debugging...')
        await this.takeScreenshot(page, jobId, 'step7-verification-failed')
        throw new Error('Not on Step 7 page - Passport Type dropdown not found')
      }
      
      // Get Step 7 field mappings
      const step7Mappings = getStep7FieldMappings()
      console.log(`📋 Found ${step7Mappings.length} Step 7 field mappings`)
      
      // Fill each field
      for (const fieldMapping of step7Mappings) {
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
            case 'text':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled text field: ${fieldMapping.fieldName}`)
              break
              
            case 'select':
              let selectValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
              
              // Handle country dropdowns for Step 7
              if (fieldMapping.fieldName === 'passport_info.passport_issuing_country' || 
                  fieldMapping.fieldName === 'passport_info.passport_issued_country') {
                const countryCode = getCountryCode(selectValue)
                if (countryCode) {
                  selectValue = countryCode
                  console.log(`🔍 STEP7 - Country "${fieldValue}" mapped to CEAC code: "${selectValue}"`)
                } else {
                  console.log(`⚠️ STEP7 - No country code found for: ${selectValue}`)
                }
              }
              
              await element.selectOption({ value: selectValue })
              console.log(`✅ Selected dropdown: ${fieldMapping.fieldName} = ${selectValue}`)
              
              // Wait for postback if this is a dropdown that triggers conditional fields
              if (fieldMapping.conditional) {
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after dropdown selection')
              }
              break
              
            case 'textarea':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled textarea: ${fieldMapping.fieldName}`)
              break
              
            case 'date_split':
              // Handle split date fields
              if (fieldMapping.dateSelectors) {
                const date = new Date(fieldValue.toString())
                const day = date.getDate().toString().padStart(2, '0')
                const month = (date.getMonth() + 1).toString().padStart(2, '0') // Use numeric month (01-12)
                const year = date.getFullYear().toString()
                
                console.log(`📝 Splitting date ${fieldValue} into: day=${day}, month=${month}, year=${year}`)
                
                // Fill day dropdown
                const dayElement = page.locator(fieldMapping.dateSelectors.day)
                await dayElement.waitFor({ state: 'visible', timeout: 15000 })
                await dayElement.selectOption({ value: day })
                console.log(`✅ Filled day: ${day}`)
                
                // Small delay between date components
                await page.waitForTimeout(500)
                
                // Fill month dropdown
                const monthElement = page.locator(fieldMapping.dateSelectors.month)
                await monthElement.waitFor({ state: 'visible', timeout: 15000 })
                
                // Get available options for debugging
                const monthOptions = await monthElement.locator('option').all()
                const availableMonths = await Promise.all(monthOptions.map(async (opt) => {
                  const value = await opt.getAttribute('value')
                  const text = await opt.textContent()
                  return { value, text }
                }))
                console.log(`📝 Available month options:`, availableMonths)
                
                await monthElement.selectOption({ value: month })
                console.log(`✅ Filled month: ${month}`)
                
                // Small delay between date components
                await page.waitForTimeout(500)
                
                // Fill year input
                const yearElement = page.locator(fieldMapping.dateSelectors.year)
                await yearElement.waitFor({ state: 'visible', timeout: 15000 })
                await yearElement.fill(year)
                console.log(`✅ Filled year: ${year}`)
              }
              break
              
            case 'radio':
              // For radio buttons, we need to find the correct option
              let radioValue = fieldValue.toString()
              if (fieldMapping.valueMapping && fieldMapping.valueMapping[radioValue]) {
                radioValue = fieldMapping.valueMapping[radioValue]
              }
              
              console.log(`📝 Looking for radio option with value: ${radioValue}`)
              
              const radioOptions = page.locator(`${fieldMapping.selector} input[type="radio"]`)
              const optionCount = await radioOptions.count()
              console.log(`📝 Found ${optionCount} radio options`)
              
              // If no radio options found, try alternative selectors
              if (optionCount === 0) {
                console.log('⚠️ No radio options found with standard selector, trying alternative...')
                const alternativeOptions = page.locator('input[type="radio"]')
                const altCount = await alternativeOptions.count()
                console.log(`📝 Found ${altCount} radio options with alternative selector`)
                
                // Log all radio buttons on the page for debugging
                for (let i = 0; i < Math.min(altCount, 10); i++) {
                  const option = alternativeOptions.nth(i)
                  const optionValue = await option.getAttribute('value')
                  const optionId = await option.getAttribute('id')
                  const optionName = await option.getAttribute('name')
                  console.log(`📝 Radio option ${i + 1}: value="${optionValue}", id="${optionId}", name="${optionName}"`)
                }
              }
              
              let found = false
              for (let i = 0; i < optionCount; i++) {
                const option = radioOptions.nth(i)
                const optionValue = await option.getAttribute('value')
                console.log(`📝 Radio option ${i + 1} has value: ${optionValue}`)
                
                if (optionValue === radioValue) {
                  await option.check()
                  console.log(`✅ Selected radio option: ${radioValue}`)
                  found = true
                  break
                }
              }
              
              if (!found) {
                console.warn(`⚠️ Could not find radio option with value: ${radioValue}`)
                // Try to find by label text as fallback
                const radioLabels = page.locator(`${fieldMapping.selector} label`)
                const labelCount = await radioLabels.count()
                console.log(`📝 Found ${labelCount} radio labels`)
                
                for (let i = 0; i < labelCount; i++) {
                  const label = radioLabels.nth(i)
                  const labelText = await label.textContent()
                  console.log(`📝 Radio label ${i + 1}: "${labelText}"`)
                  
                  if (labelText && (labelText.trim().toLowerCase() === fieldValue.toString().toLowerCase() || 
                      labelText.trim().toLowerCase() === radioValue.toLowerCase())) {
                    const radioInput = label.locator('input[type="radio"]')
                    await radioInput.check()
                    console.log(`✅ Selected radio option by label: ${labelText}`)
                    found = true
                    break
                  }
                }
              }
              
              if (!found) {
                throw new Error(`Could not find radio option for value: ${radioValue}`)
              }
              
              // Wait for postback if this is a radio button that triggers conditional fields
              if (fieldMapping.conditional) {
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after radio button selection')
              }
              break
              
            case 'checkbox':
              if (fieldValue === true || fieldValue === 'Yes') {
                await element.check()
                console.log(`✅ Checked checkbox: ${fieldMapping.fieldName}`)
              } else {
                await element.uncheck()
                console.log(`✅ Unchecked checkbox: ${fieldMapping.fieldName}`)
              }
              break
              
            default:
              console.log(`⚠️ Unknown field type: ${fieldMapping.type} for field: ${fieldMapping.fieldName}`)
              break
          }
          
          // Handle conditional fields if this field has them
          if (fieldMapping.conditional) {
            console.log(`📝 Field has conditional logic, checking if conditions are met...`)
            await this.handleStep7ConditionalFields(page, jobId, formData, fieldMapping)
          }
          
          console.log(`✅ Successfully filled field: ${fieldMapping.fieldName}`)
          
        } catch (error) {
          console.error(`❌ Error filling field ${fieldMapping.fieldName}:`, error)
          throw error
        }
      }
      
      console.log('✅ Step 7 form filling completed successfully')
      
    } catch (error) {
      console.error('❌ Error in Step 7 form filling:', error)
      throw error
    }
  }

  /**
   * Handle conditional fields for Step 7
   */
  private async handleStep7ConditionalFields(page: Page, jobId: string, formData: DS160FormData, fieldMapping: any): Promise<void> {
    console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
    
    if (fieldMapping.fieldName === 'passport_info.passport_type') {
      const passportType = formData[fieldMapping.fieldName]
      console.log(`📝 Passport type selected: ${passportType}`)
      
      if (passportType === 'Other') {
        console.log('📝 "Other" passport type selected, waiting for explanation field...')
        
        // Wait for the conditional field to appear
        await page.waitForTimeout(3000)
        
        // Check if the conditional field is visible
        const explanationField = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_passportOther')
        if (await explanationField.isVisible({ timeout: 10000 })) {
          console.log('📝 Explanation field is visible, filling it...')
          
          const explanationValue = formData['passport_info.passport_other_explanation']
          if (explanationValue) {
            const textareaElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPptOtherExpl')
            await textareaElement.waitFor({ state: 'visible', timeout: 15000 })
            await textareaElement.fill(explanationValue.toString())
            console.log(`✅ Filled passport other explanation: ${explanationValue}`)
          }
        } else {
          console.log('⚠️ Explanation field not visible after waiting')
        }
      }
    }
    
    // Handle passport book number "Does Not Apply" checkbox logic
    if (fieldMapping.fieldName === 'passport_info.passport_book_number_na') {
      const bookNumberNA = formData[fieldMapping.fieldName]
      const bookNumber = formData['passport_info.passport_book_number']
      
      console.log(`📝 Passport book number NA checkbox: ${bookNumberNA}`)
      console.log(`📝 Passport book number value: ${bookNumber}`)
      
      if (bookNumberNA === true || bookNumber === 'N/A') {
        console.log('📝 Checking "Does Not Apply" checkbox for passport book number...')
        
        // Check the checkbox
        const checkboxElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_BOOK_NUM_NA')
        await checkboxElement.waitFor({ state: 'visible', timeout: 15000 })
        await checkboxElement.check()
        console.log('✅ Checked "Does Not Apply" checkbox for passport book number')
        
        // The checkbox should automatically disable the text field via JavaScript
        await page.waitForTimeout(1000)
      } else if (bookNumber && bookNumber !== 'N/A') {
        console.log('📝 Filling passport book number...')
        
        // Make sure checkbox is unchecked
        const checkboxElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_BOOK_NUM_NA')
        await checkboxElement.waitFor({ state: 'visible', timeout: 15000 })
        await checkboxElement.uncheck()
        console.log('✅ Unchecked "Does Not Apply" checkbox for passport book number')
        
        // Fill the book number field
        const bookNumberElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_BOOK_NUM')
        await bookNumberElement.waitFor({ state: 'visible', timeout: 15000 })
        await bookNumberElement.fill(bookNumber.toString())
        console.log(`✅ Filled passport book number: ${bookNumber}`)
      }
    }
    
    // Handle passport expiration "No Expiration" checkbox logic
    if (fieldMapping.fieldName === 'passport_info.passport_expiry_na') {
      const expiryNA = formData[fieldMapping.fieldName]
      const expiryDate = formData['passport_info.passport_expiry_date']
      
      console.log(`📝 Passport expiry NA checkbox: ${expiryNA}`)
      console.log(`📝 Passport expiry date value: ${expiryDate}`)
      
      if (expiryNA === true || expiryDate === 'N/A') {
        console.log('📝 Checking "No Expiration" checkbox for passport expiry...')
        
        // Check the checkbox
        const checkboxElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxPPT_EXPIRE_NA')
        await checkboxElement.waitFor({ state: 'visible', timeout: 15000 })
        await checkboxElement.check()
        console.log('✅ Checked "No Expiration" checkbox for passport expiry')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after "No Expiration" checkbox selection')
        
        // The checkbox should automatically disable the date fields via JavaScript
        await page.waitForTimeout(1000)
      } else if (expiryDate && expiryDate !== 'N/A') {
        console.log('📝 Filling passport expiry date...')
        
        // Make sure checkbox is unchecked
        const checkboxElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxPPT_EXPIRE_NA')
        await checkboxElement.waitFor({ state: 'visible', timeout: 15000 })
        await checkboxElement.uncheck()
        console.log('✅ Unchecked "No Expiration" checkbox for passport expiry')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after "No Expiration" checkbox deselection')
        
        // The date fields should now be enabled and can be filled normally
        await page.waitForTimeout(1000)
      }
    }
    
    // Handle lost/stolen passport conditional fields
    if (fieldMapping.fieldName === 'passport_info.passport_lost_stolen') {
      const lostStolen = formData[fieldMapping.fieldName]
      console.log(`📝 Lost/stolen passport selection: ${lostStolen}`)
      
      if (lostStolen === 'Yes') {
        console.log('📝 "Yes" selected for lost/stolen passport, waiting for conditional fields...')
        
        // Wait for conditional fields to appear
        await page.waitForTimeout(3000)
        
        // Check if the conditional fields are visible
        const lostPassportSection = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_tbxLOST_PPT_NUM')
        if (await lostPassportSection.isVisible({ timeout: 10000 })) {
          console.log('📝 Lost passport conditional fields are visible, filling them...')
          
          // Fill lost passport number
          const lostPassportNumber = formData['passport_info.lost_passport_number']
          if (lostPassportNumber) {
            const numberElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_tbxLOST_PPT_NUM')
            await numberElement.waitFor({ state: 'visible', timeout: 15000 })
            await numberElement.fill(lostPassportNumber.toString())
            console.log(`✅ Filled lost passport number: ${lostPassportNumber}`)
          }
          
          // Handle "Do Not Know" checkbox for lost passport number
          const lostNumberNA = formData['passport_info.lost_passport_number_na']
          if (lostNumberNA === true || lostPassportNumber === 'N/A') {
            console.log('📝 Checking "Do Not Know" checkbox for lost passport number...')
            const lostNumberNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_cbxLOST_PPT_NUM_UNKN_IND')
            await lostNumberNAElement.waitFor({ state: 'visible', timeout: 15000 })
            await lostNumberNAElement.check()
            console.log('✅ Checked "Do Not Know" checkbox for lost passport number')
          }
          
          // Fill lost passport country
          const lostPassportCountry = formData['passport_info.lost_passport_country']
          if (lostPassportCountry) {
            const countryCode = getCountryCode(lostPassportCountry)
            const selectValue = countryCode || lostPassportCountry
            
            const countryElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_ddlLOST_PPT_NATL')
            await countryElement.waitFor({ state: 'visible', timeout: 15000 })
            await countryElement.selectOption({ value: selectValue })
            console.log(`✅ Selected lost passport country: ${lostPassportCountry} (${selectValue})`)
          }
          
          // Fill explanation
          const explanation = formData['passport_info.lost_passport_explanation']
          if (explanation) {
            const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_tbxLOST_PPT_EXPL')
            await explanationElement.waitFor({ state: 'visible', timeout: 15000 })
            await explanationElement.fill(explanation.toString())
            console.log(`✅ Filled lost passport explanation: ${explanation}`)
          }
        } else {
          console.log('⚠️ Lost passport conditional fields not visible after waiting')
        }
      }
    }
    
    console.log(`✅ Completed conditional fields for: ${fieldMapping.fieldName}`)
  }

  /**
   * Click the Next button on Step 7 to proceed to Step 8
   */
  private async clickStep7NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button on Step 7 to proceed to Step 8...')
    
    // Try up to 3 times to click the Next button
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt} to click Step 7 Next button...`)
        
        const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
        if (await nextButton.isVisible({ timeout: 10000 })) {
          await nextButton.click()
          console.log(`✅ Step 7 Next button clicked (attempt ${attempt})`)
          
          // Wait for navigation with better error handling
          try {
            console.log('⏳ Waiting for page to load after Step 7 Next button click...')
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
          
          // Verify we're on Step 8 by checking for a Step 8 specific element
          try {
            const step8Element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_SURNAME')
            await step8Element.waitFor({ state: 'visible', timeout: 15000 })
            console.log('✅ Confirmed we are on Step 8 (U.S. Contact Information)')
            
            // If we get here, navigation was successful
            break
          } catch (error) {
            console.log(`⚠️ Could not confirm Step 8 navigation on attempt ${attempt}, but proceeding...`)
            if (attempt === 3) {
              // Take a screenshot to see what page we're on
              await this.takeScreenshot(page, jobId, 'step7-next-click-verification')
            }
          }
          
          // If we get here, navigation was successful
          break
        } else {
          throw new Error('Step 7 Next button not found')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.log(`❌ Attempt ${attempt} failed: ${errorMessage}`)
        if (attempt === 3) {
          throw new Error(`Failed to navigate from Step 7 to Step 8 after 3 attempts: ${errorMessage}`)
        }
        
        // Wait before retrying
        console.log('⏳ Waiting 3 seconds before retry...')
        await page.waitForTimeout(3000)
      }
    }
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_8',
      'running',
      'Successfully navigated to Step 8',
      44
    )
    
    // Take screenshot
    await this.takeScreenshot(page, jobId, 'after-step7-next-click')
    console.log('✅ Successfully navigated to Step 8')
  }

  /**
   * Fill Step 8 form (U.S. Contact Information)
   */
  private async fillStep8Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting Step 8 form filling (U.S. Contact Information)...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_8',
      'running',
      'Filling Step 8 form fields',
      48
    )
    
    try {
      // Verify we're on the correct page before proceeding
      console.log('🔍 Verifying we are on Step 8 page...')
      const step8Indicator = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_SURNAME')
      try {
        await step8Indicator.waitFor({ state: 'visible', timeout: 10000 })
        console.log('✅ Confirmed we are on Step 8 page')
      } catch (error) {
        console.log('⚠️ Could not find Step 8 indicator, taking screenshot for debugging...')
        await this.takeScreenshot(page, jobId, 'step8-verification-failed')
        throw new Error('Not on Step 8 page - U.S. Contact Information fields not found')
      }
      
      // Get Step 8 field mappings
      const step8Mappings = getStep8FieldMappings()
      console.log(`📋 Found ${step8Mappings.length} Step 8 field mappings`)
      
      // Fill each field
      for (const fieldMapping of step8Mappings) {
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
            case 'text':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled text field: ${fieldMapping.fieldName}`)
              break
              
            case 'select':
              let selectValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
              
              await element.selectOption({ value: selectValue })
              console.log(`✅ Selected dropdown: ${fieldMapping.fieldName} = ${selectValue}`)
              
              // Wait for postback if this is a dropdown that triggers conditional fields
              if (fieldMapping.conditional) {
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after dropdown selection')
              }
              
              // Special handling for relationship dropdown - wait for address fields to appear
              if (fieldMapping.fieldName === 'us_contact.contact_relationship') {
                console.log('📝 Relationship selected, waiting for address fields to appear...')
                await page.waitForTimeout(3000) // Wait 3 seconds for address fields to load
                console.log('✅ Waited for address fields to appear')
              }
              break
              
            case 'checkbox':
              if (fieldValue === true || fieldValue === 'Yes') {
                await element.check()
                console.log(`✅ Checked checkbox: ${fieldMapping.fieldName}`)
                
                // Wait for postback if this checkbox triggers conditional fields
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after checkbox selection')
              } else {
                await element.uncheck()
                console.log(`✅ Unchecked checkbox: ${fieldMapping.fieldName}`)
              }
              break
              
            default:
              console.log(`⚠️ Unknown field type: ${fieldMapping.type} for field: ${fieldMapping.fieldName}`)
              break
          }
          
          // Handle conditional fields if this field has them
          if (fieldMapping.conditional) {
            console.log(`📝 Field has conditional logic, checking if conditions are met...`)
            await this.handleStep8ConditionalFields(page, jobId, formData, fieldMapping)
          }
          
          console.log(`✅ Successfully filled field: ${fieldMapping.fieldName}`)
          
        } catch (error) {
          console.error(`❌ Error filling field ${fieldMapping.fieldName}:`, error)
          throw error
        }
      }
      
      console.log('✅ Step 8 form filling completed successfully')
      
    } catch (error) {
      console.error('❌ Error in Step 8 form filling:', error)
      throw error
    }
  }

  /**
   * Handle conditional fields for Step 9
   */
  private async handleStep9ConditionalFields(page: Page, jobId: string, formData: DS160FormData, fieldMapping: any): Promise<void> {
    console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
    
    // Handle father "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.father_surnames_na') {
      const fatherSurnamesNA = formData[fieldMapping.fieldName]
      const fatherSurnames = formData['family_info.father_surnames']
      
      console.log(`📝 Father surnames NA checkbox: ${fatherSurnamesNA}`)
      console.log(`📝 Father surnames: ${fatherSurnames}`)
      
      if (fatherSurnamesNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for father surnames...')
        
        // Check the father surnames NA checkbox
        const fatherSurnamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_SURNAME_UNK_IND')
        await fatherSurnamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherSurnamesNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for father surnames')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father surnames NA checkbox selection')
        
        // The checkbox should automatically disable the surnames field via JavaScript
        await page.waitForTimeout(1000)
      } else if (fatherSurnames && fatherSurnames !== 'N/A') {
        console.log('📝 Filling father surnames...')
        
        // Make sure father surnames NA checkbox is unchecked
        const fatherSurnamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_SURNAME_UNK_IND')
        await fatherSurnamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherSurnamesNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for father surnames')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father surnames NA checkbox deselection')
        
        // Fill the surnames field
        const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxFATHER_SURNAME')
        await surnamesElement.waitFor({ state: 'visible', timeout: 15000 })
        await surnamesElement.fill(fatherSurnames.toString())
        console.log(`✅ Filled father surnames: ${fatherSurnames}`)
      }
    }
    
    // Handle father given names "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.father_given_names_na') {
      const fatherGivenNamesNA = formData[fieldMapping.fieldName]
      const fatherGivenNames = formData['family_info.father_given_names']
      
      console.log(`📝 Father given names NA checkbox: ${fatherGivenNamesNA}`)
      console.log(`📝 Father given names: ${fatherGivenNames}`)
      
      if (fatherGivenNamesNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for father given names...')
        
        // Check the father given names NA checkbox
        const fatherGivenNamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_GIVEN_NAME_UNK_IND')
        await fatherGivenNamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherGivenNamesNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for father given names')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father given names NA checkbox selection')
        
        // The checkbox should automatically disable the given names field via JavaScript
        await page.waitForTimeout(1000)
      } else if (fatherGivenNames && fatherGivenNames !== 'N/A') {
        console.log('📝 Filling father given names...')
        
        // Make sure father given names NA checkbox is unchecked
        const fatherGivenNamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_GIVEN_NAME_UNK_IND')
        await fatherGivenNamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherGivenNamesNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for father given names')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father given names NA checkbox deselection')
        
        // Fill the given names field
        const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxFATHER_GIVEN_NAME')
        await givenNamesElement.waitFor({ state: 'visible', timeout: 15000 })
        await givenNamesElement.fill(fatherGivenNames.toString())
        console.log(`✅ Filled father given names: ${fatherGivenNames}`)
      }
    }
    
    // Handle father date of birth "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.father_date_of_birth_na') {
      const fatherDobNA = formData[fieldMapping.fieldName]
      const fatherDob = formData['family_info.father_date_of_birth']
      
      console.log(`📝 Father DOB NA checkbox: ${fatherDobNA}`)
      console.log(`📝 Father DOB: ${fatherDob}`)
      
      if (fatherDobNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for father date of birth...')
        
        // Check the father DOB NA checkbox
        const fatherDobNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_DOB_UNK_IND')
        await fatherDobNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherDobNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for father date of birth')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father DOB NA checkbox selection')
        
        // The checkbox should automatically disable the date fields via JavaScript
        await page.waitForTimeout(1000)
      } else if (fatherDob && fatherDob !== 'N/A') {
        console.log('📝 Filling father date of birth...')
        
        // Make sure father DOB NA checkbox is unchecked
        const fatherDobNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxFATHER_DOB_UNK_IND')
        await fatherDobNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await fatherDobNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for father date of birth')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after father DOB NA checkbox deselection')
        
        // The date fields will be filled by the main field processing
        await page.waitForTimeout(1000)
      }
    }
    
    // Handle mother "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.mother_surnames_na') {
      const motherSurnamesNA = formData[fieldMapping.fieldName]
      const motherSurnames = formData['family_info.mother_surnames']
      
      console.log(`📝 Mother surnames NA checkbox: ${motherSurnamesNA}`)
      console.log(`📝 Mother surnames: ${motherSurnames}`)
      
      if (motherSurnamesNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for mother surnames...')
        
        // Check the mother surnames NA checkbox
        const motherSurnamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_SURNAME_UNK_IND')
        await motherSurnamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherSurnamesNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for mother surnames')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother surnames NA checkbox selection')
        
        // The checkbox should automatically disable the surnames field via JavaScript
        await page.waitForTimeout(1000)
      } else if (motherSurnames && motherSurnames !== 'N/A') {
        console.log('📝 Filling mother surnames...')
        
        // Make sure mother surnames NA checkbox is unchecked
        const motherSurnamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_SURNAME_UNK_IND')
        await motherSurnamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherSurnamesNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for mother surnames')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother surnames NA checkbox deselection')
        
        // Fill the surnames field
        const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMOTHER_SURNAME')
        await surnamesElement.waitFor({ state: 'visible', timeout: 15000 })
        await surnamesElement.fill(motherSurnames.toString())
        console.log(`✅ Filled mother surnames: ${motherSurnames}`)
      }
    }
    
    // Handle mother given names "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.mother_given_names_na') {
      const motherGivenNamesNA = formData[fieldMapping.fieldName]
      const motherGivenNames = formData['family_info.mother_given_names']
      
      console.log(`📝 Mother given names NA checkbox: ${motherGivenNamesNA}`)
      console.log(`📝 Mother given names: ${motherGivenNames}`)
      
      if (motherGivenNamesNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for mother given names...')
        
        // Check the mother given names NA checkbox
        const motherGivenNamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_GIVEN_NAME_UNK_IND')
        await motherGivenNamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherGivenNamesNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for mother given names')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother given names NA checkbox selection')
        
        // The checkbox should automatically disable the given names field via JavaScript
        await page.waitForTimeout(1000)
      } else if (motherGivenNames && motherGivenNames !== 'N/A') {
        console.log('📝 Filling mother given names...')
        
        // Make sure mother given names NA checkbox is unchecked
        const motherGivenNamesNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_GIVEN_NAME_UNK_IND')
        await motherGivenNamesNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherGivenNamesNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for mother given names')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother given names NA checkbox deselection')
        
        // Fill the given names field
        const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxMOTHER_GIVEN_NAME')
        await givenNamesElement.waitFor({ state: 'visible', timeout: 15000 })
        await givenNamesElement.fill(motherGivenNames.toString())
        console.log(`✅ Filled mother given names: ${motherGivenNames}`)
      }
    }
    
    // Handle mother date of birth "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'family_info.mother_date_of_birth_na') {
      const motherDobNA = formData[fieldMapping.fieldName]
      const motherDob = formData['family_info.mother_date_of_birth']
      
      console.log(`📝 Mother DOB NA checkbox: ${motherDobNA}`)
      console.log(`📝 Mother DOB: ${motherDob}`)
      
      if (motherDobNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for mother date of birth...')
        
        // Check the mother DOB NA checkbox
        const motherDobNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_DOB_UNK_IND')
        await motherDobNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherDobNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for mother date of birth')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother DOB NA checkbox selection')
        
        // The checkbox should automatically disable the date fields via JavaScript
        await page.waitForTimeout(1000)
      } else if (motherDob && motherDob !== 'N/A') {
        console.log('📝 Filling mother date of birth...')
        
        // Make sure mother DOB NA checkbox is unchecked
        const motherDobNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxMOTHER_DOB_UNK_IND')
        await motherDobNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await motherDobNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for mother date of birth')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after mother DOB NA checkbox deselection')
        
        // The date fields will be filled by the main field processing
        await page.waitForTimeout(1000)
      }
    }
    
    // Handle father in U.S. conditional fields
    if (fieldMapping.fieldName === 'family_info.father_in_us') {
      const fatherInUS = formData[fieldMapping.fieldName]
      const fatherStatus = formData['family_info.father_status']
      
      console.log(`📝 Father in US: ${fatherInUS}`)
      console.log(`📝 Father status: ${fatherStatus}`)
      
      // If father is in U.S., wait for and fill the status dropdown
      if (fatherInUS === 'Yes' || fatherInUS === 'Y') {
        console.log('📝 Father is in US, waiting for status dropdown to appear...')
        
        // Wait for the status dropdown to appear
        await page.waitForTimeout(2000)
        
        // Check if the father status dropdown is visible
        const fatherStatusDropdown = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ShowDivFatherStatus')
        const isFatherStatusVisible = await fatherStatusDropdown.isVisible({ timeout: 5000 })
        
        if (isFatherStatusVisible) {
          console.log('✅ Father status dropdown is visible')
          
          // Fill the father status dropdown if we have data
          if (fatherStatus) {
            console.log(`📝 Filling father status dropdown with: ${fatherStatus}`)
            
            const statusElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlFATHER_US_STATUS')
            await statusElement.waitFor({ state: 'visible', timeout: 10000 })
            
            // Map the status value
            const statusMapping: Record<string, string> = {
              'U.S. CITIZEN': 'S',
              'U.S. LEGAL PERMANENT RESIDENT (LPR)': 'C',
              'NONIMMIGRANT': 'P',
              "OTHER/I DON'T KNOW": 'O'
            }
            
            const statusValue = statusMapping[fatherStatus as string] || fatherStatus
            await statusElement.selectOption({ value: statusValue })
            console.log(`✅ Selected father status: ${statusValue}`)
          }
        } else {
          console.log('⚠️ Father status dropdown is not visible')
        }
      }
    }
    
    // Handle mother in U.S. conditional fields
    if (fieldMapping.fieldName === 'family_info.mother_in_us') {
      const motherInUS = formData[fieldMapping.fieldName]
      const motherStatus = formData['family_info.mother_status']
      
      console.log(`📝 Mother in US: ${motherInUS}`)
      console.log(`📝 Mother status: ${motherStatus}`)
      
      // If mother is in U.S., wait for and fill the status dropdown
      if (motherInUS === 'Yes' || motherInUS === 'Y') {
        console.log('📝 Mother is in US, waiting for status dropdown to appear...')
        
        // Wait for the status dropdown to appear
        await page.waitForTimeout(2000)
        
        // Check if the mother status dropdown is visible
        const motherStatusDropdown = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ShowDivMotherStatus')
        const isMotherStatusVisible = await motherStatusDropdown.isVisible({ timeout: 5000 })
        
        if (isMotherStatusVisible) {
          console.log('✅ Mother status dropdown is visible')
          
          // Fill the mother status dropdown if we have data
          if (motherStatus) {
            console.log(`📝 Filling mother status dropdown with: ${motherStatus}`)
            
            const statusElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlMOTHER_US_STATUS')
            await statusElement.waitFor({ state: 'visible', timeout: 10000 })
            
            // Map the status value
            const statusMapping: Record<string, string> = {
              'U.S. CITIZEN': 'S',
              'U.S. LEGAL PERMANENT RESIDENT (LPR)': 'C',
              'NONIMMIGRANT': 'P',
              "OTHER/I DON'T KNOW": 'O'
            }
            
            const statusValue = statusMapping[motherStatus as string] || motherStatus
            await statusElement.selectOption({ value: statusValue })
            console.log(`✅ Selected mother status: ${statusValue}`)
          }
        } else {
          console.log('⚠️ Mother status dropdown is not visible')
        }
      }
    }
    
    // Handle immediate relatives conditional fields
    if (fieldMapping.fieldName === 'family_info.immediate_relatives_us') {
      const immediateRelativesUS = formData[fieldMapping.fieldName]
      const otherRelativesUS = formData['family_info.other_relatives_us']
      const relativeSurnames = formData['family_info.relative_surnames']
      const relativeGivenNames = formData['family_info.relative_given_names']
      const relativeRelationship = formData['family_info.relative_relationship']
      const relativeStatus = formData['family_info.relative_status']
      
      console.log(`📝 Immediate relatives US: ${immediateRelativesUS}`)
      console.log(`📝 Other relatives US: ${otherRelativesUS}`)
      
      // If immediate relatives is "Yes", wait for and fill the relative details
      if (immediateRelativesUS === 'Yes' || immediateRelativesUS === 'Y') {
        console.log('📝 Immediate relatives is Yes, waiting for relative details form to appear...')
        
        // Wait for the relative details form to appear
        await page.waitForTimeout(2000)
        
        // Fill relative surnames if we have data
        if (relativeSurnames) {
          console.log(`📝 Filling relative surnames: ${relativeSurnames}`)
          const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlUSRelatives_ctl00_tbxUS_REL_SURNAME')
          await surnamesElement.waitFor({ state: 'visible', timeout: 10000 })
          await surnamesElement.fill(relativeSurnames.toString())
          console.log(`✅ Filled relative surnames: ${relativeSurnames}`)
        }
        
        // Fill relative given names if we have data
        if (relativeGivenNames) {
          console.log(`📝 Filling relative given names: ${relativeGivenNames}`)
          const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlUSRelatives_ctl00_tbxUS_REL_GIVEN_NAME')
          await givenNamesElement.waitFor({ state: 'visible', timeout: 10000 })
          await givenNamesElement.fill(relativeGivenNames.toString())
          console.log(`✅ Filled relative given names: ${relativeGivenNames}`)
        }
        
        // Fill relative relationship if we have data
        if (relativeRelationship) {
          console.log(`📝 Filling relative relationship: ${relativeRelationship}`)
          console.log(`📝 Relationship value type: ${typeof relativeRelationship}`)
          console.log(`📝 Relationship value length: ${relativeRelationship.length}`)
          console.log(`📝 Relationship value char codes: ${Array.from(relativeRelationship as string).map((c: string) => c.charCodeAt(0)).join(', ')}`)
          const relationshipElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlUSRelatives_ctl00_ddlUS_REL_TYPE')
          await relationshipElement.waitFor({ state: 'visible', timeout: 10000 })
          
          // Wait a bit more for options to be fully loaded
          await page.waitForTimeout(1000)
          
          // Debug: Check what options are available
          const options = relationshipElement.locator('option')
          const optionCount = await options.count()
          console.log(`📝 Found ${optionCount} relationship options`)
          
          for (let i = 0; i < optionCount; i++) {
            const option = options.nth(i)
            const optionValue = await option.getAttribute('value')
            const optionText = await option.textContent()
            console.log(`📝 Option ${i + 1}: value="${optionValue}", text="${optionText}"`)
          }
          
          // Map the relationship value
          const relationshipMapping: Record<string, string> = {
            'SPOUSE': 'S',
            'FIANCÉ/FIANCÉE': 'F',
            'FIANCÈ/FIANCÈE': 'F', // Handle both É and È versions
            'CHILD': 'C',
            'SIBLING': 'B'
          }
          
          const relationshipValue = relationshipMapping[relativeRelationship as string]
          if (!relationshipValue) {
            console.error(`❌ No mapping found for relationship: ${relativeRelationship}`)
            console.log(`📝 Available mappings:`, relationshipMapping)
            throw new Error(`No mapping found for relationship: ${relativeRelationship}`)
          }
          console.log(`📝 Trying to select relationship value: ${relationshipValue}`)
          
          try {
            await relationshipElement.selectOption({ value: relationshipValue })
            console.log(`✅ Selected relative relationship: ${relationshipValue}`)
          } catch (error) {
            console.error(`❌ Failed to select relationship value ${relationshipValue}:`, error)
            
            // Try alternative approach - select by text
            try {
              const textToSelect = relativeRelationship as string
              console.log(`📝 Trying to select by text: ${textToSelect}`)
              await relationshipElement.selectOption({ label: textToSelect })
              console.log(`✅ Selected relative relationship by text: ${textToSelect}`)
            } catch (textError) {
              console.error(`❌ Failed to select by text ${relativeRelationship}:`, textError)
              throw textError
            }
          }
        }
        
        // Fill relative status if we have data
        if (relativeStatus) {
          console.log(`📝 Filling relative status: ${relativeStatus}`)
          const statusElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlUSRelatives_ctl00_ddlUS_REL_STATUS')
          await statusElement.waitFor({ state: 'visible', timeout: 10000 })
          
          // Wait a bit more for options to be fully loaded
          await page.waitForTimeout(1000)
          
          // Debug: Check what options are available
          const options = statusElement.locator('option')
          const optionCount = await options.count()
          console.log(`📝 Found ${optionCount} status options`)
          
          for (let i = 0; i < optionCount; i++) {
            const option = options.nth(i)
            const optionValue = await option.getAttribute('value')
            const optionText = await option.textContent()
            console.log(`📝 Option ${i + 1}: value="${optionValue}", text="${optionText}"`)
          }
          
          // Map the status value
          const statusMapping: Record<string, string> = {
            'U.S. CITIZEN': 'S',
            'U.S. LEGAL PERMANENT RESIDENT (LPR)': 'C',
            'NONIMMIGRANT': 'P',
            "OTHER/I DON'T KNOW": 'O'
          }
          
          const statusValue = statusMapping[relativeStatus as string]
          if (!statusValue) {
            console.error(`❌ No mapping found for status: ${relativeStatus}`)
            console.log(`📝 Available mappings:`, statusMapping)
            throw new Error(`No mapping found for status: ${relativeStatus}`)
          }
          console.log(`📝 Trying to select status value: ${statusValue}`)
          
          try {
            await statusElement.selectOption({ value: statusValue })
            console.log(`✅ Selected relative status: ${statusValue}`)
          } catch (error) {
            console.error(`❌ Failed to select status value ${statusValue}:`, error)
            
            // Try alternative approach - select by text
            try {
              const textToSelect = relativeStatus as string
              console.log(`📝 Trying to select by text: ${textToSelect}`)
              await statusElement.selectOption({ label: textToSelect })
              console.log(`✅ Selected relative status by text: ${textToSelect}`)
            } catch (textError) {
              console.error(`❌ Failed to select by text ${relativeStatus}:`, textError)
              throw textError
            }
          }
        }
      }
      
      // If immediate relatives is "No", we need to handle the "other relatives" question
      if (immediateRelativesUS === 'No' || immediateRelativesUS === 'N') {
        console.log('📝 Immediate relatives is No, checking for other relatives question...')
        
        // Wait for the "other relatives" question to appear
        await page.waitForTimeout(2000)
        
        // Check if the other relatives question is visible
        const otherRelativesQuestion = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ShowDivOtherRelatives')
        const isOtherRelativesVisible = await otherRelativesQuestion.isVisible({ timeout: 5000 })
        
        if (isOtherRelativesVisible) {
          console.log('✅ Other relatives question is visible')
          
          // Fill the other relatives question if we have data
          if (otherRelativesUS) {
            console.log(`📝 Filling other relatives question with: ${otherRelativesUS}`)
            
            const otherRelativesRadio = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblUS_OTHER_RELATIVE_IND')
            const radioOptions = otherRelativesRadio.locator('input[type="radio"]')
            const optionCount = await radioOptions.count()
            
            let found = false
            for (let i = 0; i < optionCount; i++) {
              const option = radioOptions.nth(i)
              const optionValue = await option.getAttribute('value')
              console.log(`📝 Other relatives radio option ${i + 1} has value: ${optionValue}`)
              
              if (optionValue === (otherRelativesUS === 'Yes' ? 'Y' : 'N')) {
                await option.check()
                console.log(`✅ Selected other relatives option: ${optionValue}`)
                found = true
                break
              }
            }
            
            if (!found) {
              console.warn(`⚠️ Could not find other relatives radio option for value: ${otherRelativesUS}`)
            }
          }
        } else {
          console.log('⚠️ Other relatives question is not visible')
        }
      }
    }
    
    console.log(`✅ Completed conditional fields for: ${fieldMapping.fieldName}`)
  }

  /**
   * Click the Next button on Step 9 to proceed to Step 10
   */
  private async clickStep9NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button on Step 9 to proceed to Step 10...')
    const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
    if (await nextButton.isVisible({ timeout: 10000 })) {
      await nextButton.click()
      console.log('✅ Step 9 Next button clicked')
      
      // Wait for navigation with better error handling
      try {
        console.log('⏳ Waiting for page to load after Step 9 Next button click...')
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
      
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        'form_step_10',
        'running',
        'Successfully navigated to Step 10',
        62
      )
      
      // Take screenshot
      await this.takeScreenshot(page, jobId, 'after-step9-next-click')
      console.log('✅ Successfully navigated to Step 10')
    } else {
      throw new Error('Step 9 Next button not found')
    }
  }

  /**
   * Handle conditional fields for Step 8
   */
  private async handleStep8ConditionalFields(page: Page, jobId: string, formData: DS160FormData, fieldMapping: any): Promise<void> {
    console.log(`📝 Handling conditional fields for: ${fieldMapping.fieldName}`)
    
    // Handle contact person "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'us_contact.contact_person_na') {
      const contactPersonNA = formData[fieldMapping.fieldName]
      const contactSurnames = formData['us_contact.contact_surnames']
      const contactGivenNames = formData['us_contact.contact_given_names']
      
      console.log(`📝 Contact person NA checkbox: ${contactPersonNA}`)
      console.log(`📝 Contact surnames: ${contactSurnames}`)
      console.log(`📝 Contact given names: ${contactGivenNames}`)
      
      if (contactPersonNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for contact person...')
        
        // Check the contact person NA checkbox
        const contactPersonNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxUS_POC_NAME_NA')
        await contactPersonNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await contactPersonNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for contact person')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after contact person NA checkbox selection')
        
        // The checkbox should automatically disable the contact person fields via JavaScript
        await page.waitForTimeout(1000)
      } else if ((contactSurnames && contactSurnames !== 'N/A') || (contactGivenNames && contactGivenNames !== 'N/A')) {
        console.log('📝 Filling contact person information...')
        
        // Make sure contact person NA checkbox is unchecked
        const contactPersonNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxUS_POC_NAME_NA')
        await contactPersonNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await contactPersonNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for contact person')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after contact person NA checkbox deselection')
        
        // Fill the contact person fields
        if (contactSurnames && contactSurnames !== 'N/A') {
          const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_SURNAME')
          await surnamesElement.waitFor({ state: 'visible', timeout: 15000 })
          await surnamesElement.fill(contactSurnames.toString())
          console.log(`✅ Filled contact surnames: ${contactSurnames}`)
        }
        
        if (contactGivenNames && contactGivenNames !== 'N/A') {
          const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_GIVEN_NAME')
          await givenNamesElement.waitFor({ state: 'visible', timeout: 15000 })
          await givenNamesElement.fill(contactGivenNames.toString())
          console.log(`✅ Filled contact given names: ${contactGivenNames}`)
        }
      }
    }
    
    // Handle organization "Do Not Know" checkbox logic
    if (fieldMapping.fieldName === 'us_contact.contact_organization_na') {
      const organizationNA = formData[fieldMapping.fieldName]
      const organizationName = formData['us_contact.contact_organization']
      
      console.log(`📝 Organization NA checkbox: ${organizationNA}`)
      console.log(`📝 Organization name: ${organizationName}`)
      
      if (organizationNA === true) {
        console.log('📝 Checking "Do Not Know" checkbox for organization...')
        
        // Check the organization NA checkbox
        const organizationNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxUS_POC_ORG_NA_IND')
        await organizationNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await organizationNAElement.check()
        console.log('✅ Checked "Do Not Know" checkbox for organization')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after organization NA checkbox selection')
        
        // The checkbox should automatically disable the organization field via JavaScript
        await page.waitForTimeout(1000)
      } else if (organizationName && organizationName !== 'N/A') {
        console.log('📝 Filling organization information...')
        
        // Make sure organization NA checkbox is unchecked
        const organizationNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxUS_POC_ORG_NA_IND')
        await organizationNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await organizationNAElement.uncheck()
        console.log('✅ Unchecked "Do Not Know" checkbox for organization')
        
        // Wait for postback (the checkbox triggers a postback)
        await this.waitForPostback(page, jobId)
        console.log('✅ Postback completed after organization NA checkbox deselection')
        
        // Fill the organization field
        const organizationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ORGANIZATION')
        await organizationElement.waitFor({ state: 'visible', timeout: 15000 })
        await organizationElement.fill(organizationName.toString())
        console.log(`✅ Filled organization name: ${organizationName}`)
      }
    }
    
    // Handle email "Does Not Apply" checkbox logic
    if (fieldMapping.fieldName === 'us_contact.contact_email_na') {
      const emailNA = formData[fieldMapping.fieldName]
      const emailAddress = formData['us_contact.contact_email']
      
      console.log(`📝 Email NA checkbox: ${emailNA}`)
      console.log(`📝 Email address: ${emailAddress}`)
      
      if (emailNA === true || emailAddress === 'N/A') {
        console.log('📝 Checking "Does Not Apply" checkbox for email...')
        
        // Check the email NA checkbox
        const emailNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexUS_POC_EMAIL_ADDR_NA')
        await emailNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await emailNAElement.check()
        console.log('✅ Checked "Does Not Apply" checkbox for email')
        
        // The checkbox should automatically disable the email field via JavaScript
        await page.waitForTimeout(1000)
      } else if (emailAddress && emailAddress !== 'N/A') {
        console.log('📝 Filling email address...')
        
        // Make sure email NA checkbox is unchecked
        const emailNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbexUS_POC_EMAIL_ADDR_NA')
        await emailNAElement.waitFor({ state: 'visible', timeout: 15000 })
        await emailNAElement.uncheck()
        console.log('✅ Unchecked "Does Not Apply" checkbox for email')
        
        // Fill the email field
        const emailElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_EMAIL_ADDR')
        await emailElement.waitFor({ state: 'visible', timeout: 15000 })
        await emailElement.fill(emailAddress.toString())
        console.log(`✅ Filled email address: ${emailAddress}`)
      }
    }
    
    console.log(`✅ Completed conditional fields for: ${fieldMapping.fieldName}`)
  }

  /**
   * Click the Next button on Step 8 to proceed to Step 9
   */
  private async clickStep8NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button on Step 8 to proceed to Step 9...')
    const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
    if (await nextButton.isVisible({ timeout: 10000 })) {
      await nextButton.click()
      console.log('✅ Step 8 Next button clicked')
      
      // Wait for navigation with better error handling
      try {
        console.log('⏳ Waiting for page to load after Step 8 Next button click...')
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
      
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        'form_step_9',
        'running',
        'Successfully navigated to Step 9',
        55
      )
      
      // Take screenshot
      await this.takeScreenshot(page, jobId, 'after-step8-next-click')
      console.log('✅ Successfully navigated to Step 9')
    } else {
      throw new Error('Step 8 Next button not found')
    }
  }



  /**
   * Fill Step 9 form (Family Information)
   */
  private async fillStep9Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting Step 9 form filling (Family Information)...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_9',
      'running',
      'Filling Step 9 form fields',
      55
    )
    
    try {
      // Verify we're on the correct page before proceeding
      console.log('🔍 Verifying we are on Step 9 page...')
      const step9Indicator = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxFATHER_SURNAME')
      try {
        await step9Indicator.waitFor({ state: 'visible', timeout: 10000 })
        console.log('✅ Confirmed we are on Step 9 page')
      } catch (error) {
        console.log('⚠️ Could not find Step 9 indicator, taking screenshot for debugging...')
        await this.takeScreenshot(page, jobId, 'step9-verification-failed')
        throw new Error('Not on Step 9 page - Family Information fields not found')
      }
      
      // Get Step 9 field mappings
      const step9Mappings = getStep9FieldMappings()
      console.log(`📋 Found ${step9Mappings.length} Step 9 field mappings`)
      
      // Fill each field
      for (const fieldMapping of step9Mappings) {
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
            case 'text':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled text field: ${fieldMapping.fieldName}`)
              break
              
            case 'select':
              let selectValue = fieldMapping.valueMapping?.[fieldValue.toString()] || fieldValue.toString()
              
              await element.selectOption({ value: selectValue })
              console.log(`✅ Selected dropdown: ${fieldMapping.fieldName} = ${selectValue}`)
              
              // Wait for postback if this is a dropdown that triggers conditional fields
              if (fieldMapping.conditional) {
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after dropdown selection')
              }
              break
              
            case 'radio':
              // For radio buttons, we need to find the correct option
              let radioValue = fieldValue.toString()
              if (fieldMapping.valueMapping && fieldMapping.valueMapping[radioValue]) {
                radioValue = fieldMapping.valueMapping[radioValue]
              }
              
              console.log(`📝 Looking for radio option with value: ${radioValue}`)
              
              const radioOptions = page.locator(`${fieldMapping.selector} input[type="radio"]`)
              const optionCount = await radioOptions.count()
              console.log(`📝 Found ${optionCount} radio options`)
              
              let found = false
              for (let i = 0; i < optionCount; i++) {
                const option = radioOptions.nth(i)
                const optionValue = await option.getAttribute('value')
                console.log(`📝 Radio option ${i + 1} has value: ${optionValue}`)
                
                if (optionValue === radioValue) {
                  await option.check()
                  console.log(`✅ Selected radio option: ${radioValue}`)
                  found = true
                  break
                }
              }
              
              if (!found) {
                console.warn(`⚠️ Could not find radio option with value: ${radioValue}`)
                // Try to find by label text as fallback
                const radioLabels = page.locator(`${fieldMapping.selector} label`)
                const labelCount = await radioLabels.count()
                console.log(`📝 Found ${labelCount} radio labels`)
                
                for (let i = 0; i < labelCount; i++) {
                  const label = radioLabels.nth(i)
                  const labelText = await label.textContent()
                  console.log(`📝 Radio label ${i + 1}: "${labelText}"`)
                  
                  if (labelText && (labelText.trim().toLowerCase() === fieldValue.toString().toLowerCase() || 
                      labelText.trim().toLowerCase() === radioValue.toLowerCase())) {
                    const radioInput = label.locator('input[type="radio"]')
                    await radioInput.check()
                    console.log(`✅ Selected radio option by label: ${labelText}`)
                    found = true
                    break
                  }
                }
              }
              
              if (!found) {
                throw new Error(`Could not find radio option for value: ${radioValue}`)
              }
              
              // Wait for postback if this is a radio button that triggers conditional fields
              if (fieldMapping.conditional) {
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after radio button selection')
              }
              break
              
            case 'checkbox':
              if (fieldValue === true || fieldValue === 'Yes') {
                await element.check()
                console.log(`✅ Checked checkbox: ${fieldMapping.fieldName}`)
                
                // Wait for postback if this checkbox triggers conditional fields
                await this.waitForPostback(page, jobId)
                console.log('✅ Postback completed after checkbox selection')
              } else {
                await element.uncheck()
                console.log(`✅ Unchecked checkbox: ${fieldMapping.fieldName}`)
              }
              break
              
            case 'date_split':
              // Handle split date fields
              if (fieldMapping.dateSelectors) {
                const date = new Date(fieldValue.toString())
                const day = date.getDate().toString().padStart(2, '0')
                const monthIndex = date.getMonth()
                const year = date.getFullYear().toString()
                
                // Map month index to text abbreviations for Step 9 (JAN, FEB, etc.)
                const monthAbbreviations = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
                const month = monthAbbreviations[monthIndex]
                
                console.log(`📝 Splitting date ${fieldValue} into: day=${day}, month=${month}, year=${year}`)
                
                // Fill day dropdown
                const dayElement = page.locator(fieldMapping.dateSelectors.day)
                await dayElement.waitFor({ state: 'visible', timeout: 15000 })
                await dayElement.selectOption({ value: day })
                console.log(`✅ Filled day: ${day}`)
                
                // Small delay between date components
                await page.waitForTimeout(500)
                
                // Fill month dropdown
                const monthElement = page.locator(fieldMapping.dateSelectors.month)
                await monthElement.waitFor({ state: 'visible', timeout: 15000 })
                
                // Get available options for debugging
                const monthOptions = await monthElement.locator('option').all()
                const availableMonths = await Promise.all(monthOptions.map(async (opt) => {
                  const value = await opt.getAttribute('value')
                  const text = await opt.textContent()
                  return { value, text }
                }))
                console.log(`📝 Available month options:`, availableMonths)
                
                await monthElement.selectOption({ value: month })
                console.log(`✅ Filled month: ${month}`)
                
                // Small delay between date components
                await page.waitForTimeout(500)
                
                // Fill year input
                const yearElement = page.locator(fieldMapping.dateSelectors.year)
                await yearElement.waitFor({ state: 'visible', timeout: 15000 })
                await yearElement.fill(year)
                console.log(`✅ Filled year: ${year}`)
              }
              break
              
            default:
              console.log(`⚠️ Unknown field type: ${fieldMapping.type} for field: ${fieldMapping.fieldName}`)
              break
          }
          
          // Handle conditional fields if this field has them
          if (fieldMapping.conditional) {
            console.log(`📝 Field has conditional logic, checking if conditions are met...`)
            await this.handleStep9ConditionalFields(page, jobId, formData, fieldMapping)
          }
          
          console.log(`✅ Successfully filled field: ${fieldMapping.fieldName}`)
          
        } catch (error) {
          console.error(`❌ Error filling field ${fieldMapping.fieldName}:`, error)
          throw error
        }
      }
      
      console.log('✅ Step 9 form filling completed successfully')
      
    } catch (error) {
      console.error('❌ Error in Step 9 form filling:', error)
      throw error
    }
  }

  /**
   * Fill Step 10 form (Work/Education Information)
   */
  private async fillStep10Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    try {
      console.log('📝 Starting Step 10 form filling (Work/Education Information)...')
      
      // Update progress to 65% (Step 10 of 17 total steps)
      await this.progressService.updateStepProgress(jobId, 'form_step_10', 'running', 'Filling Step 10 - Work/Education Information...', 65)
      
      // Get Step 10 field mappings
      const step10Mappings = getStep10FieldMappings()
      console.log(`📋 Found ${step10Mappings.length} fields for Step 10`)
      
      // Fill each field
      for (const fieldMapping of step10Mappings) {
        try {
          const fieldValue = formData[fieldMapping.fieldName]
          
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
            continue
          }
          
          console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
          
          const element = page.locator(fieldMapping.selector)
          await element.waitFor({ state: 'visible', timeout: 15000 })
          
          switch (fieldMapping.type) {
            case 'text':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled text field: ${fieldMapping.fieldName}`)
              break
              
            case 'select':
              if (fieldMapping.valueMapping) {
                const mappedValue = fieldMapping.valueMapping[fieldValue.toString()]
                if (mappedValue) {
                  await element.selectOption({ value: mappedValue })
                  console.log(`✅ Selected dropdown option: ${fieldMapping.fieldName} = ${mappedValue}`)
                  
                  // Wait for postback after occupation selection
                  if (fieldMapping.fieldName === 'present_work_education.primary_occupation') {
                    console.log('⏳ Waiting for postback after occupation selection...')
                    await this.waitForPostback(page, jobId)
                  }
                } else {
                  console.warn(`⚠️ No mapping found for value: ${fieldValue}`)
                }
              } else {
                await element.selectOption({ value: fieldValue.toString() })
                console.log(`✅ Selected dropdown option: ${fieldMapping.fieldName}`)
              }
              break
              
            case 'date':
              const dateValue = new Date(fieldValue.toString()).toISOString().split('T')[0]
              await element.fill(dateValue)
              console.log(`✅ Filled date field: ${fieldMapping.fieldName}`)
              break
              
            case 'textarea':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled textarea field: ${fieldMapping.fieldName}`)
              break
              
            case 'checkbox':
              if (fieldValue === true || fieldValue === 'Yes' || fieldValue === 'N/A') {
                await element.check()
                console.log(`✅ Checked checkbox: ${fieldMapping.fieldName}`)
              } else {
                await element.uncheck()
                console.log(`✅ Unchecked checkbox: ${fieldMapping.fieldName}`)
              }
              break
              
            default:
              console.warn(`⚠️ Unknown field type: ${fieldMapping.type} for ${fieldMapping.fieldName}`)
          }
          
          // Small delay between fields
          await page.waitForTimeout(200)
          
        } catch (error) {
          console.error(`❌ Error filling field ${fieldMapping.fieldName}:`, error)
          throw error
        }
      }
      
      // Handle conditional fields based on occupation
      await this.handleStep10ConditionalFields(page, jobId, formData)
      
      console.log('✅ Step 10 form filling completed successfully')
      
      // Click the Next button to proceed to the next step
      await this.clickStep10NextButton(page, jobId)
      
    } catch (error) {
      console.error('❌ Error in Step 10 form filling:', error)
      throw error
    }
  }

  /**
   * Handle conditional fields for Step 10 based on occupation selection
   */
  private async handleStep10ConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 10 conditional fields...')
    
    const selectedOccupation = formData['present_work_education.primary_occupation']
    
    if (!selectedOccupation) {
      console.log('⏭️ No occupation selected, skipping conditional fields')
      return
    }
    
    console.log(`📝 Processing conditional fields for occupation: ${selectedOccupation}`)
    
    // Wait for page to reload after occupation selection
    console.log('⏳ Waiting for page to reload after occupation selection...')
    await page.waitForTimeout(3000)
    
    // Handle HOMEMAKER and RETIRED - no additional fields needed
    if (['HOMEMAKER', 'RETIRED'].includes(selectedOccupation)) {
      console.log(`ℹ️ No additional fields required for occupation: ${selectedOccupation}`)
      return
    }
    
    // Handle NOT EMPLOYED explanation
    if (selectedOccupation === 'NOT EMPLOYED') {
      console.log('📝 Looking for NOT EMPLOYED explanation field...')
      try {
        const explanation = formData['present_work_education.not_employed_explanation']
        if (explanation) {
          console.log('📝 Filling NOT EMPLOYED explanation...')
          const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxNOT_EMPLOYED_EXPLANATION')
          await element.waitFor({ state: 'visible', timeout: 15000 })
          await element.fill(explanation.toString())
          console.log('✅ Filled NOT EMPLOYED explanation')
        }
      } catch (error) {
        console.warn('⚠️ NOT EMPLOYED explanation field not found or not visible')
      }
      return
    }
    
    // Handle OTHER occupation specification
    if (selectedOccupation === 'OTHER') {
      console.log('📝 Looking for OTHER occupation specification field...')
      try {
        const specification = formData['present_work_education.other_occupation_specification']
        if (specification) {
          console.log('📝 Filling OTHER occupation specification...')
          const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxExplainOtherPresentOccupation')
          await element.waitFor({ state: 'visible', timeout: 15000 })
          await element.fill(specification.toString())
          console.log('✅ Filled OTHER occupation specification')
        }
      } catch (error) {
        console.warn('⚠️ OTHER occupation specification field not found or not visible')
      }
    }
    
    // For all other occupations (including OTHER), fill employer/school fields
    // Check if the employer section is visible
    try {
      const employerSection = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ShowDivEmployed')
      await employerSection.waitFor({ state: 'visible', timeout: 10000 })
      console.log('✅ Employer section is visible, proceeding to fill fields...')
      
      // Fill employer/school fields
      await this.fillEmployerSchoolFields(page, jobId, formData)
      
    } catch (error) {
      console.warn('⚠️ Employer section not found or not visible')
    }
    
    console.log('✅ Step 10 conditional fields handling completed')
  }

  /**
   * Click the Next button for Step 10
   */
  private async clickStep10NextButton(page: Page, jobId: string): Promise<void> {
    console.log('🔄 Clicking Step 10 Next button...')
    
    try {
      // Wait for the Next button to be visible
      const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
      await nextButton.waitFor({ state: 'visible', timeout: 15000 })
      
      console.log('✅ Step 10 Next button is ready')
      
      // Click the Next button
      await nextButton.click()
      console.log('✅ Clicked Step 10 Next button')
      
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      console.log('✅ Navigation completed after Step 10 Next button click')
      
      // Update job progress
      await this.progressService.updateStepProgress(jobId, 'form_step_11', 'running', 'Completed Step 10 - Work/Education Information...', 70)
      console.log('📊 Updated job progress to Step 11 (70%)')
      
    } catch (error) {
      console.error('❌ Error clicking Step 10 Next button:', error)
      
      // Take a screenshot for debugging
      await page.screenshot({ path: `error-step10-next-${jobId}.png` })
      console.log('📸 Screenshot saved: error-step10-next.png')
      
      throw error
    }
  }

  /**
   * Click the Next button for Step 11
   */
  private async clickStep11NextButton(page: Page, jobId: string): Promise<void> {
    console.log('🔄 Clicking Step 11 Next button...')
    
    try {
      // Wait for the Next button to be visible
      const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
      await nextButton.waitFor({ state: 'visible', timeout: 15000 })
      
      console.log('✅ Step 11 Next button is ready')
      
      // Click the Next button
      await nextButton.click()
      console.log('✅ Clicked Step 11 Next button')
      
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      console.log('✅ Navigation completed after Step 11 Next button click')
      
      // Update job progress
      await this.progressService.updateStepProgress(jobId, 'form_step_12', 'running', 'Completed Step 11 - Previous Work/Education Information...', 75)
      console.log('📊 Updated job progress to Step 12 (75%)')
      
    } catch (error) {
      console.error('❌ Error clicking Step 11 Next button:', error)
      
      // Take a screenshot for debugging
      await page.screenshot({ path: `error-step11-next-${jobId}.png` })
      console.log('📸 Screenshot saved: error-step11-next.png')
      
      throw error
    }
  }

  /**
   * Fill Step 11 form (Previous Work/Education Information)
   */
  private async fillStep11Form(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting Step 11 form filling...')
    
    try {
      // Update job progress
      await this.progressService.updateStepProgress(jobId, 'form_step_11', 'running', 'Filling Step 11 - Previous Work/Education Information...', 75)
      
      // Get Step 11 field mappings
      const step11Mappings = getStep11FieldMappings()
      console.log(`📝 Found ${step11Mappings.length} Step 11 fields to fill`)
      
      // Fill each field based on mapping
      for (const fieldMapping of step11Mappings) {
        try {
          const fieldValue = formData[fieldMapping.fieldName]
          
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
            continue
          }
          
          console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
          
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
              console.warn(`⚠️ Unknown field type: ${fieldMapping.type} for ${fieldMapping.fieldName}`)
          }
          
          // Small delay between fields
          await page.waitForTimeout(200)
          
        } catch (error) {
          console.error(`❌ Error filling field ${fieldMapping.fieldName}:`, error)
          throw error
        }
      }
      
      // Handle conditional fields based on radio selections
      await this.handleStep11ConditionalFields(page, jobId, formData)
      
      console.log('✅ Step 11 form filling completed successfully')
      
      // Click Next button to proceed to Step 12
      await this.clickStep11NextButton(page, jobId)
      
    } catch (error) {
      console.error('❌ Error in Step 11 form filling:', error)
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
   * Fill previous employment fields for Step 11
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
      
      // Map country names to codes based on the HTML options
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
      await yearElement.waitFor({ state: 'visible', timeout: 15015 })
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

  /**
   * Fill employer/school fields for Step 10
   */
  private async fillEmployerSchoolFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling employer/school fields...')
    
    // Fill employer/school name
    const employerName = formData['present_work_education.employer_school_name']
    if (employerName) {
      console.log(`📝 Filling employer/school name: ${employerName}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchName')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(employerName.toString())
      console.log('✅ Filled employer/school name')
    }
    
    // Fill address line 1
    const addressLine1 = formData['present_work_education.employer_address_line1']
    if (addressLine1) {
      console.log(`📝 Filling address line 1: ${addressLine1}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchAddr1')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(addressLine1.toString())
      console.log('✅ Filled address line 1')
    }
    
    // Fill address line 2
    const addressLine2 = formData['present_work_education.employer_address_line2']
    if (addressLine2) {
      console.log(`📝 Filling address line 2: ${addressLine2}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchAddr2')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(addressLine2.toString())
      console.log('✅ Filled address line 2')
    }
    
    // Fill city
    const city = formData['present_work_education.employer_city']
    if (city) {
      console.log(`📝 Filling city: ${city}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchCity')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(city.toString())
      console.log('✅ Filled city')
    }
    
    // Handle state/province
    const state = formData['present_work_education.employer_state']
    const stateNA = formData['present_work_education.employer_state_na']
    if (stateNA === true || state === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for state')
      const stateNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxWORK_EDUC_ADDR_STATE_NA')
      await stateNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for state')
    } else if (state) {
      console.log(`📝 Filling state: ${state}`)
      const stateElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_ADDR_STATE')
      await stateElement.waitFor({ state: 'visible', timeout: 15000 })
      await stateElement.fill(state.toString())
      console.log('✅ Filled state')
    }
    
    // Handle postal code
    const postalCode = formData['present_work_education.employer_postal_code']
    const postalNA = formData['present_work_education.employer_postal_na']
    if (postalNA === true || postalCode === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for postal code')
      const postalNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxWORK_EDUC_ADDR_POSTAL_CD_NA')
      await postalNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await postalNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for postal code')
    } else if (postalCode) {
      console.log(`📝 Filling postal code: ${postalCode}`)
      const postalElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_ADDR_POSTAL_CD')
      await postalElement.waitFor({ state: 'visible', timeout: 15000 })
      await postalElement.fill(postalCode.toString())
      console.log('✅ Filled postal code')
    }
    
    // Fill phone number
    const phone = formData['present_work_education.employer_phone']
    if (phone) {
      console.log(`📝 Filling phone number: ${phone}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_TEL')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(phone.toString())
      console.log('✅ Filled phone number')
    }
    
    // Fill country
    const country = formData['present_work_education.employer_country']
    if (country) {
      console.log(`📝 Filling country: ${country}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlEmpSchCountry')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      
      // Map country names to codes based on the HTML options
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
    
    // Fill start date (split date)
    const startDate = formData['present_work_education.start_date']
    if (startDate) {
      console.log(`📝 Filling start date: ${startDate}`)
      const date = new Date(startDate.toString())
      const day = date.getDate().toString()
      const month = (date.getMonth() + 1).toString()
      const year = date.getFullYear().toString()
      
      // Fill day
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlEmpDateFromDay')
      await dayElement.waitFor({ state: 'visible', timeout: 15000 })
      await dayElement.selectOption({ value: day })
      
      // Fill month
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlEmpDateFromMonth')
      await monthElement.waitFor({ state: 'visible', timeout: 15000 })
      await monthElement.selectOption({ value: month })
      
      // Fill year
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxEmpDateFromYear')
      await yearElement.waitFor({ state: 'visible', timeout: 15000 })
      await yearElement.fill(year)
      
      console.log('✅ Filled start date')
    }
    
    // Handle monthly income
    const monthlyIncome = formData['present_work_education.monthly_income']
    const incomeNA = formData['present_work_education.monthly_income_na']
    if (incomeNA === true || monthlyIncome === 'N/A') {
      console.log('📝 Checking "Does Not Apply" checkbox for monthly income')
      const incomeNAElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxCURR_MONTHLY_SALARY_NA')
      await incomeNAElement.waitFor({ state: 'visible', timeout: 15000 })
      await incomeNAElement.check()
      console.log('✅ Checked "Does Not Apply" checkbox for monthly income')
    } else if (monthlyIncome) {
      console.log(`📝 Filling monthly income: ${monthlyIncome}`)
      const incomeElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxCURR_MONTHLY_SALARY')
      await incomeElement.waitFor({ state: 'visible', timeout: 15000 })
      await incomeElement.fill(monthlyIncome.toString())
      console.log('✅ Filled monthly income')
    }
    
    // Fill job duties
    const jobDuties = formData['present_work_education.job_duties']
    if (jobDuties) {
      console.log(`📝 Filling job duties: ${jobDuties}`)
      const element = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDescribeDuties')
      await element.waitFor({ state: 'visible', timeout: 15000 })
      await element.fill(jobDuties.toString())
      console.log('✅ Filled job duties')
    }
    
    console.log('✅ Completed filling employer/school fields')
  }

  /**
   * Fill conditional fields that appear for a specific purpose specify selection
   */
  private async fillConditionalFieldsForPurposeSpecify(page: Page, jobId: string, formData: DS160FormData, purposeSpecify: string): Promise<void> {
    console.log(`📝 Filling conditional fields for purpose specify: ${purposeSpecify}`)
    
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
                
              case 'date':
                // Format date for input
                const dateValue = new Date(fieldValue.toString()).toISOString().split('T')[0]
                await element.fill(dateValue)
                console.log(`✅ Filled date field: ${fieldConfig.label}`)
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
          }
          
        } catch (error) {
          console.warn(`⚠️ Failed to fill conditional field ${fieldConfig.label}:`, error)
        }
      }
      
      console.log(`✅ Completed filling conditional fields for: ${purposeSpecify}`)
      
    } else {
      console.log(`ℹ️ No conditional fields configuration found for: ${purposeSpecify}`)
    }
  }

  /**
   * Fill purpose specify field immediately after purpose selection
   */
  private async fillPurposeSpecifyField(page: Page, jobId: string, formData: DS160FormData, purposeOfTrip: string): Promise<void> {
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
              'CHILEAN SPEC. OCCUPATION (H1B1)': 'H1B1-CHL',
              'SINGAPOREAN SPEC. OCCUPATION (H1B1)': 'H1B1-SGP',
              'NURSE IN SHORTAGE AREA (H1C)': 'H1C-NR',
              'AGRICULTURAL WORKER (H2A)': 'H2A-AG',
              'NONAGRICULTURAL WORKER (H2B)': 'H2B-NA',
              'TRAINEE (H3)': 'H3-TR',
              'CHILD OF AN H (H4)': 'H4-CH',
              'SPOUSE OF AN H (H4)': 'H4-SP'
            },
            'FOREIGN MEDIA REPRESENTATIVE (I)': {
              'CHILD OF AN I (I)': 'I-CH',
              'FOREIGN MEDIA REPRESENTATIVE (I)': 'I-FR',
              'SPOUSE OF AN I (I)': 'I-SP'
            },
            'EXCHANGE VISITOR (J)': {
              'EXCHANGE VISITOR (J1)': 'J1-J1',
              'CHILD OF A J1 (J2)': 'J2-CH',
              'SPOUSE OF A J1 (J2)': 'J2-SP'
            },
            'FIANCÉ(E) OR SPOUSE OF A U.S. CITIZEN (K)': {
              'FIANCÉ(E) OF A U.S. CITIZEN (K1)': 'K1-K1',
              'CHILD OF A K1 (K2)': 'K2-K2',
              'SPOUSE OF A U.S. CITIZEN (K3)': 'K3-K3',
              'CHILD OF A K3 (K4)': 'K4-K4'
            },
            'INTRACOMPANY TRANSFEREE (L)': {
              'INTRACOMPANY TRANSFEREE (L1)': 'L1-L1',
              'CHILD OF A L1 (L2)': 'L2-CH',
              'SPOUSE OF A L1 (L2)': 'L2-SP'
            },
            'VOCATIONAL/NONACADEMIC STUDENT (M)': {
              'STUDENT (M1)': 'M1-M1',
              'CHILD OF M1 (M2)': 'M2-CH',
              'SPOUSE OF M1 (M2)': 'M2-SP',
              'COMMUTER STUDENT (M3)': 'M3-M3'
            },
            'OTHER (N)': {
              'CHILD OF A N8 (N9)': 'N8-CH',
              'PARENT OF CERTAIN SPECIAL IMMIGRANT (N8)': 'N8-N8'
            },
            'NATO STAFF (NATO)': {
              'CHILD OF NATO 1 (NATO1)': 'NATO1-CH',
              'PRINCIPAL REPRESENTATIVE (NATO1)': 'NATO1-PR',
              'SPOUSE OF NATO1 (NATO1)': 'NATO1-SP',
              'CHILD OF NATO2 (NATO2)': 'NATO2-CH',
              'REPRESENTATIVE (NATO2)': 'NATO2-RP',
              'SPOUSE OF NATO2 (NATO2)': 'NATO2-SP',
              'CHILD OF NATO3 (NATO3)': 'NATO3-CH',
              'SPOUSE OF NATO3 (NATO3)': 'NATO3-SP',
              'CLERICAL STAFF (NATO3)': 'NATO3-ST',
              'CHILD OF NATO4 (NATO4)': 'NATO4-CH',
              'OFFICIAL (NATO4)': 'NATO4-OF',
              'SPOUSE OF NATO4 (NATO4)': 'NATO4-SP',
              'CHILD OF NATO5 (NATO5)': 'NATO5-CH',
              'EXPERT (NATO5)': 'NATO5-EX',
              'SPOUSE OF NATO5 (NATO5)': 'NATO5-SP',
              'CHILD OF NATO6 (NATO6)': 'NATO6-CH',
              'SPOUSE OF NATO6 (NATO6)': 'NATO6-SP',
              'CIVILIAN STAFF (NATO6)': 'NATO6-ST',
              'CHILD OF NATO7 (NATO7)': 'NATO7-CH',
              'PERSONAL EMP. OF NATO1-NATO6 (NATO7)': 'NATO7-EM',
              'SPOUSE OF NATO7 (NATO7)': 'NATO7-SP'
            },
            'ALIEN WITH EXTRAORDINARY ABILITY (O)': {
              'EXTRAORDINARY ABILITY (O1)': 'O1-EX',
              'ALIEN ACCOMPANYING/ASSISTING (O2)': 'O2-AL',
              'CHILD OF O1 OR O2 (O3)': 'O3-CH',
              'SPOUSE OF O1 OR O2 (O3)': 'O3-SP'
            },
            'INTERNATIONALLY RECOGNIZED ALIEN (P)': {
              'INTERNATIONALLY RECOGNIZED ALIEN (P1)': 'P1-P1',
              'ARTIST/ENTERTAINER EXCHANGE PROG. (P2)': 'P2-P2',
              'ARTIST/ENTERTAINER IN CULTURAL PROG. (P3)': 'P3-P3',
              'CHILD OF P1, P2 OR P3 (P4)': 'P4-CH',
              'SPOUSE OF P1, P2 OR P3 (P4)': 'P4-SP'
            },
            'CULTURAL EXCHANGE VISITOR (Q)': {
              'CULTURAL EXCHANGE VISITOR (Q1)': 'Q1-Q1'
            },
            'RELIGIOUS WORKER (R)': {
              'RELIGIOUS WORKER (R1)': 'R1-R1',
              'CHILD OF R1 (R2)': 'R2-CH',
              'SPOUSE OF R1 (R2)': 'R2-SP'
            },
            'INFORMANT OR WITNESS (S)': {
              'FAMILY MEMBER OF AN INFORMANT (S7)': 'S7-S7'
            },
            'VICTIM OF TRAFFICKING (T)': {
              'VICTIM OF TRAFFICKING (T1)': 'T1-T1',
              'SPOUSE OF T1 (T2)': 'T2-SP',
              'CHILD OF T1 (T3)': 'T3-CH',
              'PARENT OF T1 (T4)': 'T4-PR',
              'SIBLING OF T1 (T5)': 'T5-SB',
              'ADULT/MINOR CHILD OF A DERIV BEN OF A T1 (T6)': 'T6-CB'
            },
            'NAFTA PROFESSIONAL (TD/TN)': {
              'CHILD OF TN (TD)': 'TD-CH',
              'SPOUSE OF TN (TD)': 'TD-SP'
            },
            'VICTIM OF CRIMINAL ACTIVITY (U)': {
              'VICTIM OF CRIME (U1)': 'U1-U1',
              'SPOUSE OF U1 (U2)': 'U2-SP',
              'CHILD OF U1 (U3)': 'U3-CH',
              'PARENT OF U1 (U4)': 'U4-PR',
              'SIBLING OF U1 (U5)': 'U5-SB'
            },
            'PAROLE BENEFICIARY (PARCIS)': {
              'PARCIS (USCIS APPROVED PAROLE)': 'PRL-PARCIS'
            }
          }

          // Check if we have a mapping for this purpose type
          const purposeValueMapping = purposeValueMappings[purposeOfTrip]
          if (purposeValueMapping && purposeValueMapping[purposeSpecify]) {
            selectValue = purposeValueMapping[purposeSpecify]
            console.log(`🔍 STEP3 - ${purposeOfTrip} purpose specify mapped to: ${selectValue}`)
          }
          
          await specifyElement.selectOption({ value: selectValue })
          console.log(`✅ Selected purpose specify: ${purposeSpecify}`)
          
          // Wait for postback
          try {
            await page.waitForLoadState('networkidle', { timeout: 5000 })
            console.log(`✅ Postback completed after purpose specify selection`)
          } catch (timeoutError) {
            console.log(`ℹ️ No postback detected or timeout - continuing`)
          }
          
          // Additional wait to ensure conditional fields are rendered
          await page.waitForTimeout(2000)
          console.log(`🔍 Waiting for conditional fields to appear after purpose specify selection...`)
          
          // Fill conditional fields that should appear for this purpose specify
          await this.fillConditionalFieldsForPurposeSpecify(page, jobId, formData, purposeSpecify)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fill purpose specify field:`, error)
      }
    } else {
      console.log(`ℹ️ Purpose '${purposeOfTrip}' does not have specify field, skipping...`)
    }
  }

  /**
   * Click the Next button on Step 3 to proceed to Step 4
   */
  private async clickStep3NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button on Step 3 to proceed to Step 4...')
    const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
    if (await nextButton.isVisible({ timeout: 10000 })) {
      await nextButton.click()
      console.log('✅ Step 3 Next button clicked')
      await page.waitForLoadState('networkidle')
      
      // Update progress
      await this.progressService.updateStepProgress(
        jobId,
        'form_step_4',
        'running',
        'Successfully navigated to Step 4',
        100
      )
      
      // Take screenshot
      await this.takeScreenshot(page, jobId, 'after-step3-next-click')
      console.log('✅ Successfully navigated to Step 4')
    } else {
      throw new Error('Step 3 Next button not found')
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
      // Contact fields - these can be either Principal Applicant or Mission/Organization depending on the specify option
      'travel_info.contact_surnames': '#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppSurname',
      'travel_info.contact_given_names': '#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppGivenName',
      
      // Mission/Organization contact fields (for A-type visas)
      'travel_info.mission_contact_surnames': '#ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgContactSurname',
      'travel_info.mission_contact_given_names': '#ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgContactGivenName',
      
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
      
      // Specific travel plans fields (split date structure) - CORRECTED SELECTORS
      'travel_info.arrival_date_day': '#ctl00_SiteContentPlaceHolder_FormView1_ddlARRIVAL_US_DTEDay',
      'travel_info.arrival_date_month': '#ctl00_SiteContentPlaceHolder_FormView1_ddlARRIVAL_US_DTEMonth',
      'travel_info.arrival_date_year': '#ctl00_SiteContentPlaceHolder_FormView1_tbxARRIVAL_US_DTEYear',
      'travel_info.arrival_flight': '#ctl00_SiteContentPlaceHolder_FormView1_tbxArriveFlight',
      'travel_info.arrival_city': '#ctl00_SiteContentPlaceHolder_FormView1_tbxArriveCity',
      'travel_info.departure_date_day': '#ctl00_SiteContentPlaceHolder_FormView1_ddlDEPARTURE_US_DTEDay',
      'travel_info.departure_date_month': '#ctl00_SiteContentPlaceHolder_FormView1_ddlDEPARTURE_US_DTEMonth',
      'travel_info.departure_date_year': '#ctl00_SiteContentPlaceHolder_FormView1_tbxDEPARTURE_US_DTEYear',
      'travel_info.departure_flight': '#ctl00_SiteContentPlaceHolder_FormView1_tbxDepartFlight',
      'travel_info.departure_city': '#ctl00_SiteContentPlaceHolder_FormView1_tbxDepartCity',
      'travel_info.location': '#ctl00_SiteContentPlaceHolder_FormView1_dtlTravelLoc_ctl00_tbxSPECTRAVEL_LOCATION',
      
      // "No" specific travel plans fields
      'travel_info.intended_arrival_date_day': '#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEDay',
      'travel_info.intended_arrival_date_month': '#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEMonth',
      'travel_info.intended_arrival_date_year': '#ctl00_SiteContentPlaceHolder_FormView1_tbxTRAVEL_DTEYear',
      'travel_info.length_of_stay_value': '#ctl00_SiteContentPlaceHolder_FormView1_tbxTRAVEL_LOS',
      'travel_info.length_of_stay_unit': '#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_LOS_CD',
      
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
      'travel_info.visa_issuing_country_old': '#ctl00_SiteContentPlaceHolder_FormView1_ddlVisaIssuingCountryOld'
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
  private async handleNestedConditionalFields(page: Page, jobId: string, formData: DS160FormData, purposeSpecify: string): Promise<void> {
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
        const principalDateOfBirth = formData['travel_info.principal_date_of_birth']
        if (principalDateOfBirth) {
          try {
            const dobElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppDOB')
            await dobElement.waitFor({ state: 'visible', timeout: 10000 })
            const dateValue = new Date(principalDateOfBirth.toString()).toISOString().split('T')[0]
            await dobElement.fill(dateValue)
            console.log(`✅ Filled principal date of birth: ${dateValue}`)
          } catch (error) {
            console.warn(`⚠️ Failed to fill principal date of birth:`, error)
          }
        }
        
        console.log('✅ Completed filling nested conditional fields')
      } else {
        console.log('ℹ️ Principal visa issued is not "Yes", skipping nested fields')
      }
    } else {
      console.log('ℹ️ Not an E1/E2 executive visa, no nested fields to handle')
    }
  }

  /**
   * Fill fields for "Yes" specific travel plans
   */
  private async fillSpecificTravelPlansFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling specific travel plans fields (Yes)...')
    
    try {
      // Fill arrival date (split into day, month, year)
      const arrivalDate = formData['travel_info.arrival_date']
      if (arrivalDate) {
        console.log(`📝 Filling arrival date: ${arrivalDate}`)
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
      
      // Fill arrival flight
      const arrivalFlight = formData['travel_info.arrival_flight']
      if (arrivalFlight) {
        console.log(`📝 Filling arrival flight: ${arrivalFlight}`)
        const flightElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxArriveFlight')
        await flightElement.waitFor({ state: 'visible', timeout: 10000 })
        await flightElement.fill(arrivalFlight.toString())
        console.log(`✅ Filled arrival flight: ${arrivalFlight}`)
      }
      
      // Fill arrival city
      const arrivalCity = formData['travel_info.arrival_city']
      if (arrivalCity) {
        console.log(`📝 Filling arrival city: ${arrivalCity}`)
        const cityElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxArriveCity')
        await cityElement.waitFor({ state: 'visible', timeout: 10000 })
        await cityElement.fill(arrivalCity.toString())
        console.log(`✅ Filled arrival city: ${arrivalCity}`)
      }
      
      // Fill departure date (split into day, month, year)
      const departureDate = formData['travel_info.departure_date']
      if (departureDate) {
        console.log(`📝 Filling departure date: ${departureDate}`)
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
      
      // Fill departure flight
      const departureFlight = formData['travel_info.departure_flight']
      if (departureFlight) {
        console.log(`📝 Filling departure flight: ${departureFlight}`)
        const flightElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDepartFlight')
        await flightElement.waitFor({ state: 'visible', timeout: 10000 })
        await flightElement.fill(departureFlight.toString())
        console.log(`✅ Filled departure flight: ${departureFlight}`)
      }
      
      // Fill departure city
      const departureCity = formData['travel_info.departure_city']
      if (departureCity) {
        console.log(`📝 Filling departure city: ${departureCity}`)
        const cityElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxDepartCity')
        await cityElement.waitFor({ state: 'visible', timeout: 10000 })
        await cityElement.fill(departureCity.toString())
        console.log(`✅ Filled departure city: ${departureCity}`)
      }
      
      // Fill location
      const location = formData['travel_info.location']
      if (location) {
        console.log(`📝 Filling location: ${location}`)
        const locationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlTravelLoc_ctl00_tbxSPECTRAVEL_LOCATION')
        await locationElement.waitFor({ state: 'visible', timeout: 10000 })
        await locationElement.fill(location.toString())
        console.log(`✅ Filled location: ${location}`)
      }
      
      console.log('✅ Completed filling specific travel plans fields')
      
    } catch (error) {
      console.warn(`⚠️ Failed to fill specific travel plans fields:`, error)
    }
  }

  /**
   * Fill "No" specific travel plans conditional fields
   */
  private async fillNoSpecificTravelPlansFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling "No" specific travel plans fields...')
    
    try {
      // Intended Date of Arrival (split date fields)
      const intendedArrivalDate = formData['travel_info.arrival_date']
      if (intendedArrivalDate) {
        const { day, month, year } = this.splitDate(intendedArrivalDate.toString())
        
        // Fill day
        const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEDay')
        await dayElement.waitFor({ state: 'visible', timeout: 10000 })
        await dayElement.selectOption({ value: day })
        console.log(`✅ Filled intended arrival day: ${day}`)
        
        // Fill month
        const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEMonth')
        await monthElement.waitFor({ state: 'visible', timeout: 10000 })
        await monthElement.selectOption({ value: month })
        console.log(`✅ Filled intended arrival month: ${month}`)
        
        // Fill year
        const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxTRAVEL_DTEYear')
        await yearElement.waitFor({ state: 'visible', timeout: 10000 })
        await yearElement.fill(year)
        console.log(`✅ Filled intended arrival year: ${year}`)
      }
      
      // Length of Stay Value
      const lengthOfStayValue = formData['travel_info.length_of_stay_value']
      if (lengthOfStayValue) {
        const valueElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxTRAVEL_LOS')
        await valueElement.waitFor({ state: 'visible', timeout: 10000 })
        await valueElement.fill(lengthOfStayValue.toString())
        console.log(`✅ Filled length of stay value: ${lengthOfStayValue}`)
      }
      
      // Length of Stay Unit
      const lengthOfStayUnit = formData['travel_info.length_of_stay_unit']
      if (lengthOfStayUnit) {
        const unitElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_LOS_CD')
        await unitElement.waitFor({ state: 'visible', timeout: 10000 })
        
        // Map the unit value to CEAC format
        let unitValue = lengthOfStayUnit
        const unitMapping: Record<string, string> = {
          'Day(s)': 'D',
          'Week(s)': 'W',
          'Month(s)': 'M',
          'Year(s)': 'Y'
        }
        
        if (unitMapping[unitValue]) {
          unitValue = unitMapping[unitValue]
        }
        
        await unitElement.selectOption({ value: unitValue })
        console.log(`✅ Filled length of stay unit: ${unitValue}`)
      }
      
      console.log('✅ Completed filling "No" specific travel plans fields')
      
    } catch (error) {
      console.warn(`⚠️ Failed to fill "No" specific travel plans fields:`, error)
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