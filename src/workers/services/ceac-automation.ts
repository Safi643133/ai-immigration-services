import { chromium, Browser, Page, BrowserContext } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { getArtifactStorage } from '../../lib/artifact-storage'
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
  }

  /**
   * Submit DS-160 form to CEAC
   */
  async submitDS160Form(params: SubmissionParams): Promise<SubmissionResult> {
    console.log(`🚀 Starting DS-160 submission for job ${params.jobId}`)
    
    let context: BrowserContext | null = null
    let page: Page | null = null

    try {
      // Initialize browser
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
      console.log('🔄 Starting DS-160 application...')
      await this.startNewApplication(page, params)

      // Fill out the form step by step
      console.log('📝 Filling DS-160 form...')
      const applicationId = await this.fillDS160Form(page, params)

      // Review and submit
      console.log('👀 Reviewing form...')
      await this.reviewForm(page, params)

      console.log('📤 Submitting form...')
      const confirmationId = await this.submitForm(page, params)

      // Take final screenshot
      await this.takeScreenshot(page, params.jobId, 'final-confirmation')

      // Save session artifacts
      await this.saveSessionArtifacts(context, params.jobId)

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
    
    // Handle CAPTCHA if present
    await this.handleCaptcha(page, params.jobId)
    
    // Click "START AN APPLICATION" button
    console.log('🚀 Clicking START AN APPLICATION...')
    const startButton = page.locator('text=START AN APPLICATION').first()
    
    if (await startButton.isVisible()) {
      await startButton.click()
      await page.waitForLoadState('networkidle')
      console.log('✅ Application started successfully')
    } else {
      throw new Error('START AN APPLICATION button not found')
    }
  }

  /**
   * Select embassy/consulate location from the main page dropdown
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
    
    // Look for the main location dropdown with more comprehensive selectors
    console.log('🔍 Searching for location dropdown...')
    const possibleSelectors = [
      // Most likely selectors based on CEAC structure
      'select[name$="Post"]',
      'select[name*="Post"]', 
      'select[name*="Location"]',
      'select[name*="Embassy"]',
      'select[id*="Post"]',
      'select[id*="Location"]', 
      'select[id*="Embassy"]',
      // Generic selectors
      'select:has(option:text("PAKISTAN, ISLAMABAD"))',
      'select:has(option:text("- SELECT ONE -"))',
      'select:has(option[value*="PAKISTAN"])',
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
      } catch (error) {
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
        } catch (error) {
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
      
      // Method 1: Select by exact text
      await locationDropdown.selectOption({ label: targetOption })
      console.log(`✅ Selected embassy location: ${targetOption}`)
      
      // Wait for any dynamic loading
      await page.waitForTimeout(2000)
      
      // Verify selection worked
      const selectedValue = await locationDropdown.inputValue()
      console.log(`🔍 Selected value: "${selectedValue}"`)
      
      // Take screenshot after selection
      await this.takeScreenshot(page, jobId, 'embassy-location-selected')
      
    } catch (error) {
      console.error(`❌ Failed to select embassy location: ${error.message}`)
      
      // Take screenshot of error state
      await this.takeScreenshot(page, jobId, 'embassy-selection-error')
      
      throw new Error(`Failed to select embassy location: ${error.message}`)
    }
  }
  
  /**
   * Handle CAPTCHA if present
   */
  private async handleCaptcha(page: Page, jobId: string): Promise<void> {
    console.log('🔐 Checking for CAPTCHA...')
    
    // Look for CAPTCHA elements
    const captchaImage = page.locator('img[src*="captcha"]').first()
    const captchaInput = page.locator('input[name*="captcha"], input[id*="captcha"]').first()
    
    if (await captchaImage.isVisible({ timeout: 5000 })) {
      console.log('🤖 CAPTCHA detected - manual intervention required')
      
      // Take screenshot of CAPTCHA
      await this.takeScreenshot(page, jobId, 'captcha-challenge')
      
      // For now, we'll pause and wait for manual CAPTCHA solving
      // In production, you might integrate with a CAPTCHA solving service
      console.log('⏸️ Pausing for manual CAPTCHA solving...')
      console.log('👤 Please solve the CAPTCHA manually in the browser window')
      console.log('⏳ Waiting 30 seconds for manual intervention...')
      
      // Wait for user to solve CAPTCHA manually
      await page.waitForTimeout(30000)
      
      // Check if CAPTCHA was solved by looking for the input to be filled
      if (await captchaInput.isVisible()) {
        const captchaValue = await captchaInput.inputValue()
        if (!captchaValue) {
          console.log('⚠️ CAPTCHA not solved - automation may fail')
        } else {
          console.log('✅ CAPTCHA appears to be solved')
        }
      }
    } else {
      console.log('✅ No CAPTCHA detected')
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
