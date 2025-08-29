import { Page } from 'playwright'
import { ProgressService } from '../../../../lib/progress/progress-service'
import { createClient } from '@supabase/supabase-js'

export class ApplicationIdConfirmationHandler {
  private progressService: ProgressService
  private supabase: any

  constructor() {
    this.progressService = new ProgressService()
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
   * Handle Application ID Confirmation page
   */
  async handleApplicationIdConfirmation(page: Page, jobId: string): Promise<void> {
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
    
    // Step 3: Generate and fill security question answer
    console.log('🔒 Generating security question answer...')
    const securityAnswer = this.generateRandomAnswer()
    
    // Store the security answer in Supabase for future retrieval
    await this.storeSecurityAnswer(jobId, securityAnswer)
    
    // Wait for the page to fully load after the postback
    console.log('⏳ Waiting for page to load after checkbox postback...')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(8000) // Increased wait for dynamic content to fully load
    
    // Wait for the security answer input to become enabled after checkbox
    console.log('⏳ Waiting for security answer input to become enabled...')
    await page.waitForTimeout(5000) // Additional wait for the input to become enabled
    
    // Additional wait for any JavaScript to complete
    console.log('⏳ Waiting for JavaScript to complete...')
    await page.waitForTimeout(3000)
    
    // Wait for security question to appear on the page
    console.log('🔍 Waiting for security question to appear...')
    try {
      await page.waitForSelector('label:has-text("Security Question")', { timeout: 15000 })
      console.log('✅ Security question appeared on page')
    } catch (error) {
      console.log('⚠️ Security question label not found, continuing anyway...')
    }
    
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
    
    // Poll for the security answer input to appear (up to 30 seconds)
    console.log('🔍 Polling for security answer input to appear...')
    let attempts = 0
    const maxAttempts = 30 // 30 seconds
    
    while (attempts < maxAttempts && !answerInput) {
      attempts++
      console.log(`🔍 Attempt ${attempts}/${maxAttempts} - Looking for security answer input...`)
      
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
      
      // If we found the input, break out of the while loop
      if (answerInput) {
        break
      }
      
      // Wait 1 second before next attempt
      await page.waitForTimeout(1000)
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
    
    // Step 4: Click Continue button
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
      
      console.log('✅ Application ID Confirmation completed successfully')
    } else {
      throw new Error('Continue button not found')
    }
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
   * Generate a random 6-character answer for security question
   */
  private generateRandomAnswer(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    return result
  }
}
