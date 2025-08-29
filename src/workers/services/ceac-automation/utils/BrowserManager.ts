import { chromium, Browser, Page, BrowserContext } from 'playwright'
import { getArtifactStorage } from '../../../../lib/artifact-storage'

/**
 * Browser Manager - Handles browser initialization and management
 */
export class BrowserManager {
  private browser: Browser | null = null
  private artifactStorage

  constructor() {
    this.artifactStorage = getArtifactStorage()
  }

  async initializeBrowser(): Promise<void> {
    if (this.browser) return

    console.log('🌐 Initializing Playwright browser...')
    
    // Run headless in production for better performance
    const isProduction = process.env.NODE_ENV === 'production'
    const isHeadless = isProduction || process.env.HEADLESS_BROWSER === 'true'
    
    this.browser = await chromium.launch({
      headless: isHeadless, // Headless in production, visible in development
      slowMo: isProduction ? 0 : 500, // No slowMo in production for speed
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

    console.log(`✅ Browser initialized (${isHeadless ? 'headless' : 'visible'} mode)`)
  }

  async createBrowserContext(jobId: string): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser not initialized')
    }

    console.log('🔧 Creating browser context...')

    // Create context options
    const contextOptions: any = {
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York'
    }

    // Note: Video recording and HAR session recording removed permanently
    console.log('🔧 Browser context created without recording (recording disabled)')

    const context = await this.browser.newContext(contextOptions)

    console.log('✅ Browser context created')
    return context
  }

  async createPage(context: BrowserContext): Promise<Page> {
    console.log('📄 Creating new page...')
    
    const page = await context.newPage()
    
    // Set up page monitoring
    await this.setupPageMonitoring(page)
    
    console.log('✅ Page created')
    return page
  }

  private async setupPageMonitoring(page: Page): Promise<void> {
    // Handle page errors
    page.on('pageerror', (error) => {
      console.error('❌ Page error:', error.message)
    })

    // Handle console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('❌ Console error:', msg.text())
      }
    })

    // Handle request failures
    page.on('requestfailed', (request) => {
      console.error('❌ Request failed:', request.url(), request.failure()?.errorText)
    })

    // Handle response errors
    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.error('❌ Response error:', response.url(), response.status(), response.statusText())
      }
    })
  }

  async navigateToPage(page: Page, url: string, description: string): Promise<void> {
    console.log(`📍 Navigating to ${description}: ${url}`)
    
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 120000 
      })
      
      // Wait for the page to be interactive
      console.log('⏳ Waiting for page to be interactive...')
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 })
      
      console.log(`✅ Successfully navigated to ${description}`)

    } catch (error) {
      console.error(`❌ Failed to navigate to ${description}:`, error)
      throw new Error(`Navigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async takeScreenshot(page: Page, jobId: string, name: string): Promise<void> {
    // Only take screenshots if explicitly enabled
    if (process.env.ENABLE_DEBUG_SCREENSHOTS !== 'true') {
      console.log(`📸 Debug screenshots disabled, skipping: ${name}`)
      return
    }

    try {
      console.log(`📸 Taking screenshot: ${name}`)
      
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false
      })
      
      // Save screenshot using artifact storage
      const filename = `${name}-${jobId}-${Date.now()}.png`
      
      await this.artifactStorage.storeArtifact(screenshot, {
        jobId,
        filename,
        type: 'screenshot',
        mimeType: 'image/png',
        size: screenshot.length,
        metadata: { name, jobId }
      })
      
      console.log(`✅ Screenshot saved: ${filename}`)

    } catch (error) {
      console.error(`❌ Failed to take screenshot ${name}:`, error)
    }
  }

  async closeContext(context: BrowserContext): Promise<void> {
    try {
      console.log('🔄 Closing browser context...')
      
      // Close context
      await context.close()
      
      console.log('✅ Browser context closed')

    } catch (error) {
      console.error('❌ Error closing context:', error)
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        console.log('🔄 Closing browser...')
        await this.browser.close()
        this.browser = null
        console.log('✅ Browser closed')
      }
    } catch (error) {
      console.error('❌ Error closing browser:', error)
    }
  }
}
