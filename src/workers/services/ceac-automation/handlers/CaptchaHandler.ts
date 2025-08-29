import { Page } from 'playwright'
import { ProgressService } from '../../../../lib/progress/progress-service'
import { getArtifactStorage } from '../../../../lib/artifact-storage'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

export class CaptchaHandler {
  private progressService: ProgressService
  private artifactStorage: any
  private supabase: any

  constructor() {
    this.progressService = new ProgressService()
    this.artifactStorage = getArtifactStorage()
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
   * Handle CAPTCHA if present after clicking START AN APPLICATION
   */
  async handleCaptcha(page: Page, jobId: string): Promise<string | null> {
    console.log('🔐 Checking for CAPTCHA...')
    
    // Look for CAPTCHA elements using the specific IDs from CEAC
    const captchaImage = page.locator('#c_default_ctl00_sitecontentplaceholder_uclocation_identifycaptcha1_defaultcaptcha_CaptchaImage')
    const captchaInput = page.locator('#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_txtCodeTextBox')
    
    if (await captchaImage.isVisible({ timeout: 5000 })) {
      console.log('🔄 CAPTCHA detected - taking screenshot')
      
      // Take a screenshot of the CAPTCHA area
      const captchaScreenshotPath = await this.takeCaptchaScreenshot(page, jobId)
      
      if (captchaScreenshotPath) {
        console.log('📸 CAPTCHA screenshot saved:', captchaScreenshotPath)
        
        // Update progress to indicate CAPTCHA is detected with screenshot
        await this.progressService.handleCaptchaDetection(jobId, captchaScreenshotPath)
        
        // Wait for CAPTCHA solution from user
        const solution = await this.waitForCaptchaSolution(page, jobId)
        
        if (solution) {
          console.log('✅ CAPTCHA solution handled by waitForCaptchaSolution - returning solution')
          return solution
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
          const filename = `captcha-${Date.now()}.png`
          
          const storedArtifact = await this.artifactStorage.storeArtifact(
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
  async refreshCaptchaOnCeac(page: Page): Promise<void> {
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
      }
    } catch (error) {
      console.error('❌ Error refreshing CAPTCHA on CEAC website:', error)
      // Don't throw error, just log it and continue
    }
  }

  /**
   * Wait for CAPTCHA solution from user with real-time validation
   */
  private async waitForCaptchaSolution(page: Page, jobId: string): Promise<string | null> {
    console.log('⏳ Waiting for CAPTCHA solution from user...')
    
    const maxWaitTime = 5 * 60 * 1000 // 5 minutes
    const checkInterval = 2000 // 2 seconds
    let startTime = Date.now()
    let lastChallengeId = null
    let attemptCount = 0
    const maxAttempts = 5
    
    while (Date.now() - startTime < maxWaitTime && attemptCount < maxAttempts) {
      try {
        console.log(`🔍 Polling cycle ${Math.floor((Date.now() - startTime) / checkInterval) + 1}...`)
        
        // Check for CAPTCHA refresh request first
        const refreshRequest = await this.checkForCaptchaRefreshRequest(jobId)
        if (refreshRequest) {
          console.log('🔄 CAPTCHA refresh requested by user - taking new screenshot')
          
          // Get the current page from the browser context
          const pages = page.context().pages()
          if (pages && pages.length > 0) {
            const currentPage = pages[0]
            
            // Take a new CAPTCHA screenshot
            const newCaptchaScreenshotPath = await this.takeCaptchaScreenshot(currentPage, jobId)
            
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
            
            // Get the current page to validate the solution
            const pages = page.context().pages()
            if (pages && pages.length > 0) {
              const currentPage = pages[0]
              
              // Use real-time validation
              const validationResult = await this.fillCaptchaWithRealTimeValidation(currentPage, solvedChallenge.solution, jobId)
              
              if (validationResult.success) {
                console.log('✅ CAPTCHA validation successful')
                return solvedChallenge.solution
              } else {
                console.log('❌ CAPTCHA validation failed:', validationResult.errorMessage)
                attemptCount++
                
                if (validationResult.needsNewCaptcha) {
                  console.log('🔄 New CAPTCHA will be shown to user automatically')
                  // The new CAPTCHA is already created in fillCaptchaWithRealTimeValidation
                  // Reset timer for new attempt
                  startTime = Date.now()
                  continue
                }
                
                if (attemptCount >= maxAttempts) {
                  console.log('❌ Max CAPTCHA attempts reached')
                  return null
                }
              }
            } else {
              console.log('❌ No browser page available for validation')
              return null
            }
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
   * Detect CAPTCHA validation result in real-time
   */
  private async detectCaptchaValidationResult(page: Page): Promise<{
    isValid: boolean
    errorMessage: string | null
    needsNewCaptcha: boolean
  }> {
    try {
      console.log('🔍 Detecting CAPTCHA validation result...')
      
      // Wait for potential validation response
      await page.waitForTimeout(2000)
      
      // Check for validation error elements
      const errorSummary = page.locator('#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_ValidationSummary')
      const errorSpan = page.locator('#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_csvCaptChaCodeTextBox')
      
      // Check if error elements are visible
      const hasErrorSummary = await errorSummary.isVisible()
      const hasErrorSpan = await errorSpan.isVisible()
      
      // Get error message if present
      let errorMessage: string | null = null
      if (hasErrorSummary) {
        errorMessage = await errorSummary.textContent()
        console.log('❌ CAPTCHA error detected:', errorMessage)
      }
      
      // Check if we're still on the CAPTCHA page
      const currentUrl = page.url()
      const isStillOnCaptchaPage = currentUrl.includes('captcha') || 
                                   await page.locator('#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_txtCodeTextBox').isVisible()
      
      // Check if we've been redirected to security question page (success)
      const isOnSecurityQuestionPage = currentUrl.includes('ConfirmApplicationID.aspx?node=SecureQuestion')
      
      // Determine validation result
      if (isOnSecurityQuestionPage) {
        console.log('✅ CAPTCHA validation successful - redirected to security question page')
        return {
          isValid: true,
          errorMessage: null,
          needsNewCaptcha: false
        }
      } else if (hasErrorSummary || hasErrorSpan) {
        console.log('❌ CAPTCHA validation failed - error elements visible')
        return {
          isValid: false,
          errorMessage: errorMessage,
          needsNewCaptcha: true
        }
      } else if (isStillOnCaptchaPage) {
        console.log('⚠️ Still on CAPTCHA page - validation may have failed silently')
        return {
          isValid: false,
          errorMessage: 'Still on CAPTCHA page after submission',
          needsNewCaptcha: false
        }
      } else {
        console.log('✅ CAPTCHA validation appears successful - not on CAPTCHA page')
        return {
          isValid: true,
          errorMessage: null,
          needsNewCaptcha: false
        }
      }
      
    } catch (error) {
      console.error('❌ Error detecting CAPTCHA validation result:', error)
      return {
        isValid: false,
        errorMessage: 'Error during validation detection',
        needsNewCaptcha: false
      }
    }
  }

  /**
   * Fill CAPTCHA with real-time validation
   */
  private async fillCaptchaWithRealTimeValidation(page: Page, solution: string, jobId: string): Promise<{
    success: boolean
    errorMessage: string | null
    needsNewCaptcha: boolean
  }> {
    try {
      console.log('🔐 Filling CAPTCHA with real-time validation:', solution)
      
      // Fill the CAPTCHA input
      const fillSuccess = await this.fillCaptcha(page, solution)
      if (!fillSuccess) {
        return { 
          success: false, 
          errorMessage: 'Failed to fill CAPTCHA input',
          needsNewCaptcha: false
        }
      }
      
      // Click START AN APPLICATION button (not Next button)
      console.log('🚀 Clicking START AN APPLICATION button...')
      
      // Try multiple selectors for the START AN APPLICATION button
      const startButtonSelectors = [
        '#ctl00_SiteContentPlaceHolder_lnkNew',
        'text=START AN APPLICATION',
        '[role="Button"]:has-text("START AN APPLICATION")',
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
        await startButton.click()
        await page.waitForLoadState('networkidle')
      } else {
        console.log('❌ START AN APPLICATION button not found')
        return { 
          success: false, 
          errorMessage: 'START AN APPLICATION button not found',
          needsNewCaptcha: false
        }
      }
      
      // Wait for page response
      await page.waitForLoadState('networkidle')
      
      // Detect validation result
      const validationResult = await this.detectCaptchaValidationResult(page)
      
      if (!validationResult.isValid) {
        console.log('❌ CAPTCHA validation failed:', validationResult.errorMessage)
        
        // If new CAPTCHA is needed, CEAC automatically provides it
        if (validationResult.needsNewCaptcha) {
          console.log('🔄 CAPTCHA was wrong - CEAC automatically provides new CAPTCHA')
          
          // Create a progress update to indicate CAPTCHA validation failed
          // Get user ID from the job record
          const { data: jobData } = await this.supabase
            .from('ceac_automation_jobs')
            .select('user_id')
            .eq('id', jobId)
            .single()
          
          const userId = jobData?.user_id
          
          if (userId) {
            await this.progressService.createProgressUpdate({
              job_id: jobId,
              user_id: userId,
              step_name: 'captcha_detected',
              status: 'waiting_for_captcha',
              message: `CAPTCHA validation failed: ${validationResult.errorMessage || 'Incorrect CAPTCHA solution'}`,
              progress_percentage: 50,
              needs_captcha: true,
              metadata: {
                validation_failed: true,
                error_message: validationResult.errorMessage,
                needs_new_captcha: true,
                timestamp: new Date().toISOString()
              }
            })
          }
          
          // Take new CAPTCHA screenshot (CEAC already refreshed it)
          const newCaptchaScreenshotPath = await this.takeCaptchaScreenshot(page, jobId)
          if (newCaptchaScreenshotPath) {
            // Create a new CAPTCHA challenge for the user
            await this.progressService.createCaptchaChallenge(jobId, newCaptchaScreenshotPath)
            
            // Create a progress update to notify frontend about new CAPTCHA
            if (userId) {
              await this.progressService.createProgressUpdate({
                job_id: jobId,
                user_id: userId,
                step_name: 'captcha_detected',
                status: 'waiting_for_captcha',
                message: 'New CAPTCHA challenge created - please solve',
                progress_percentage: 50,
                captcha_image: newCaptchaScreenshotPath,
                needs_captcha: true,
                metadata: {
                  new_captcha_created: true,
                  previous_validation_failed: true,
                  timestamp: new Date().toISOString()
                }
              })
            }
            
            console.log('✅ New CAPTCHA challenge created and progress update sent')
          } else {
            console.log('⚠️ Could not capture new CAPTCHA screenshot')
          }
        }
        
        return { 
          success: false, 
          errorMessage: validationResult.errorMessage,
          needsNewCaptcha: validationResult.needsNewCaptcha
        }
      } else {
        console.log('✅ CAPTCHA validation successful')
        return { 
          success: true, 
          errorMessage: null,
          needsNewCaptcha: false
        }
      }
      
    } catch (error) {
      console.error('❌ Error in fillCaptchaWithRealTimeValidation:', error)
      return { 
        success: false, 
        errorMessage: `Error during CAPTCHA validation: ${error}`,
        needsNewCaptcha: false
      }
    }
  }
}
