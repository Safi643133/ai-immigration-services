/**
 * Progress Service
 * 
 * Main service for managing progress tracking, CAPTCHA handling,
 * and real-time updates for CEAC automation jobs.
 */

import { ProgressStorage } from './progress-storage'
import type { 
  ProgressUpdate, 
  ProgressSummary, 
  ProgressStep, 
  ProgressStatus,
  CaptchaChallenge,
  CaptchaSolution,
  ProgressServiceInterface,
  CaptchaServiceInterface
} from './progress-types'

export class ProgressService implements ProgressServiceInterface, CaptchaServiceInterface {
  private storage: ProgressStorage

  constructor() {
    this.storage = new ProgressStorage()
  }

  // ============================================================================
  // PROGRESS SERVICE IMPLEMENTATION
  // ============================================================================

  /**
   * Create a new progress update
   */
  async createProgressUpdate(update: Omit<ProgressUpdate, 'id' | 'created_at'>): Promise<ProgressUpdate> {
    try {
      console.log(`📊 Creating progress update for job ${update.job_id}: ${update.step_name}`)
      
      const progressUpdate = await this.storage.createProgressUpdate(update)
      
      console.log(`✅ Progress update created: ${progressUpdate.id}`)
      return progressUpdate
    } catch (error) {
      console.error('ProgressService.createProgressUpdate error:', error)
      throw error
    }
  }

  /**
   * Get progress summary for a job
   */
  async getProgressSummary(jobId: string): Promise<ProgressSummary> {
    try {
      console.log(`📊 Getting progress summary for job ${jobId}`)
      
      const summary = await this.storage.getProgressSummary(jobId)
      
      console.log(`✅ Progress summary retrieved: ${summary.progress_percentage}% complete`)
      return summary
    } catch (error) {
      console.error('ProgressService.getProgressSummary error:', error)
      throw error
    }
  }

  /**
   * Get progress history for a job
   */
  async getProgressHistory(jobId: string): Promise<ProgressUpdate[]> {
    try {
      console.log(`📊 Getting progress history for job ${jobId}`)
      
      const history = await this.storage.getProgressHistory(jobId)
      
      console.log(`✅ Progress history retrieved: ${history.length} updates`)
      return history
    } catch (error) {
      console.error('ProgressService.getProgressHistory error:', error)
      throw error
    }
  }

  /**
   * Update progress for a job
   */
  async updateProgress(jobId: string, update: Partial<ProgressUpdate>): Promise<ProgressUpdate> {
    try {
      console.log(`📊 Updating progress for job ${jobId}`)
      
      // Get the latest progress update
      const latest = await this.storage.getLatestProgressUpdate(jobId)
      if (!latest) {
        throw new Error('No existing progress update found')
      }

      // Create a new progress update with the changes
      const newUpdate: Omit<ProgressUpdate, 'id' | 'created_at'> = {
        ...latest,
        ...update,
        job_id: jobId,
        user_id: latest.user_id
      }

      const progressUpdate = await this.storage.createProgressUpdate(newUpdate)
      
      console.log(`✅ Progress updated: ${progressUpdate.step_name}`)
      return progressUpdate
    } catch (error) {
      console.error('ProgressService.updateProgress error:', error)
      throw error
    }
  }

  /**
   * Mark job as completed
   */
  async markJobCompleted(jobId: string, result: any): Promise<void> {
    try {
      console.log(`🎉 Marking job ${jobId} as completed`)
      
      // Get the user_id from the job
      const userId = await this.storage.getJobUserId(jobId)
      
      const finalUpdate: Omit<ProgressUpdate, 'id' | 'created_at'> = {
        job_id: jobId,
        user_id: userId,
        step_name: 'job_completed',
        status: 'completed',
        message: 'CEAC automation completed successfully',
        progress_percentage: 100,
        needs_captcha: false,
        metadata: {
          application_id: result.applicationId,
          confirmation_id: result.confirmationId,
          completion_time: new Date().toISOString(),
          ...result
        }
      }

      await this.storage.createProgressUpdate(finalUpdate)
      
      console.log(`✅ Job ${jobId} marked as completed`)
    } catch (error) {
      console.error('ProgressService.markJobCompleted error:', error)
      throw error
    }
  }

  /**
   * Mark job as failed
   */
  async markJobFailed(jobId: string, error: string): Promise<void> {
    try {
      console.log(`❌ Marking job ${jobId} as failed`)
      
      // Get the user_id from the job
      const userId = await this.storage.getJobUserId(jobId)
      
      const finalUpdate: Omit<ProgressUpdate, 'id' | 'created_at'> = {
        job_id: jobId,
        user_id: userId,
        step_name: 'job_completed',
        status: 'failed',
        message: `CEAC automation failed: ${error}`,
        progress_percentage: 0,
        needs_captcha: false,
        metadata: {
          error: error,
          failure_time: new Date().toISOString()
        }
      }

      await this.storage.createProgressUpdate(finalUpdate)
      
      console.log(`✅ Job ${jobId} marked as failed`)
    } catch (error) {
      console.error('ProgressService.markJobFailed error:', error)
      throw error
    }
  }

  // ============================================================================
  // CAPTCHA SERVICE IMPLEMENTATION
  // ============================================================================

  /**
   * Create a new CAPTCHA challenge
   */
  async createCaptchaChallenge(jobId: string, imageUrl: string): Promise<CaptchaChallenge> {
    try {
      console.log(`🤖 Creating CAPTCHA challenge for job ${jobId}`)
      
      // Set expiration time (5 minutes from now)
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 5)

      const challenge: Omit<CaptchaChallenge, 'id' | 'created_at'> = {
        job_id: jobId,
        image_url: imageUrl,
        input_selector: '#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_txtCodeTextBox',
        submit_selector: 'input[type="submit"]',
        refresh_selector: '.LBD_ReloadLink',
        expires_at: expiresAt.toISOString(),
        solved: false
      }

      const captchaChallenge = await this.storage.createCaptchaChallenge(challenge)
      
      console.log(`✅ CAPTCHA challenge created: ${captchaChallenge.id}`)
      return captchaChallenge
    } catch (error) {
      console.error('ProgressService.createCaptchaChallenge error:', error)
      throw error
    }
  }

  /**
   * Solve CAPTCHA
   */
  async solveCaptcha(jobId: string, solution: string): Promise<CaptchaSolution> {
    try {
      console.log(`🔐 Solving CAPTCHA for job ${jobId}`)
      
      const captchaSolution = await this.storage.solveCaptcha(jobId, solution)
      
      console.log(`✅ CAPTCHA solved for job ${jobId}`)
      return captchaSolution
    } catch (error) {
      console.error('ProgressService.solveCaptcha error:', error)
      throw error
    }
  }

  /**
   * Get current CAPTCHA challenge
   */
  async getCaptchaChallenge(jobId: string): Promise<CaptchaChallenge | null> {
    try {
      console.log(`🔍 Getting CAPTCHA challenge for job ${jobId}`)
      
      const challenge = await this.storage.getCaptchaChallenge(jobId)
      
      if (challenge) {
        console.log(`✅ CAPTCHA challenge found: ${challenge.id}`)
      } else {
        console.log(`ℹ️ No active CAPTCHA challenge found for job ${jobId}`)
      }
      
      return challenge
    } catch (error) {
      console.error('ProgressService.getCaptchaChallenge error:', error)
      throw error
    }
  }

  /**
   * Refresh CAPTCHA (create new challenge)
   */
  async refreshCaptcha(jobId: string): Promise<CaptchaChallenge> {
    try {
      console.log(`🔄 Refreshing CAPTCHA for job ${jobId}`)
      
      // Get the current challenge to get the image URL
      const currentChallenge = await this.storage.getCaptchaChallenge(jobId)
      if (!currentChallenge) {
        throw new Error('No current CAPTCHA challenge to refresh')
      }

      // Create a new challenge with the same image URL
      const newChallenge = await this.createCaptchaChallenge(jobId, currentChallenge.image_url)
      
      console.log(`✅ CAPTCHA refreshed: ${newChallenge.id}`)
      return newChallenge
    } catch (error) {
      console.error('ProgressService.refreshCaptcha error:', error)
      throw error
    }
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Initialize progress for a new job
   */
  async initializeJobProgress(jobId: string, userId: string): Promise<ProgressUpdate> {
    try {
      console.log(`🚀 Initializing progress for job ${jobId}`)
      
      const initialUpdate: Omit<ProgressUpdate, 'id' | 'created_at'> = {
        job_id: jobId,
        user_id: userId,
        step_name: 'job_created',
        status: 'pending',
        message: 'CEAC automation job created',
        progress_percentage: 0,
        needs_captcha: false,
        metadata: {
          initialization_time: new Date().toISOString()
        }
      }

      const progressUpdate = await this.storage.createProgressUpdate(initialUpdate)
      
      console.log(`✅ Job progress initialized: ${progressUpdate.id}`)
      return progressUpdate
    } catch (error) {
      console.error('ProgressService.initializeJobProgress error:', error)
      throw error
    }
  }

  /**
   * Update progress for a specific step
   */
  async updateStepProgress(
    jobId: string, 
    step: ProgressStep, 
    status: ProgressStatus, 
    message: string,
    percentage: number,
    metadata?: Record<string, any>
  ): Promise<ProgressUpdate> {
    try {
      console.log(`📝 Updating step progress: ${step} (${percentage}%)`)
      
      // Get the user_id from the job
      const userId = await this.storage.getJobUserId(jobId)
      
      const stepUpdate: Omit<ProgressUpdate, 'id' | 'created_at'> = {
        job_id: jobId,
        user_id: userId,
        step_name: step,
        status: status,
        message: message,
        progress_percentage: percentage,
        needs_captcha: false,
        metadata: {
          step_update_time: new Date().toISOString(),
          ...metadata
        }
      }

      const progressUpdate = await this.storage.createProgressUpdate(stepUpdate)
      
      console.log(`✅ Step progress updated: ${step}`)
      return progressUpdate
    } catch (error) {
      console.error('ProgressService.updateStepProgress error:', error)
      throw error
    }
  }

  /**
   * Handle CAPTCHA detection
   */
  async handleCaptchaDetection(jobId: string, imageUrl: string): Promise<ProgressUpdate> {
    try {
      console.log(`🤖 Handling CAPTCHA detection for job ${jobId}`)
      
      // Create CAPTCHA challenge
      await this.createCaptchaChallenge(jobId, imageUrl)
      
      // Get the user_id from the job
      const userId = await this.storage.getJobUserId(jobId)
      
      // Update progress to indicate CAPTCHA is needed
      const captchaUpdate: Omit<ProgressUpdate, 'id' | 'created_at'> = {
        job_id: jobId,
        user_id: userId,
        step_name: 'captcha_detected',
        status: 'waiting_for_captcha',
        message: 'CAPTCHA detected - waiting for user input',
        progress_percentage: 50, // Pause at 50% until CAPTCHA is solved
        captcha_image: imageUrl,
        needs_captcha: true,
        metadata: {
          captcha_detection_time: new Date().toISOString()
        }
      }

      const progressUpdate = await this.storage.createProgressUpdate(captchaUpdate)
      
      console.log(`✅ CAPTCHA detection handled: ${progressUpdate.id}`)
      return progressUpdate
    } catch (error) {
      console.error('ProgressService.handleCaptchaDetection error:', error)
      throw error
    }
  }

  /**
   * Handle CAPTCHA solution
   */
  async handleCaptchaSolution(jobId: string, solution: string): Promise<ProgressUpdate> {
    try {
      console.log(`🔐 Handling CAPTCHA solution for job ${jobId}`)
      
      // Solve the CAPTCHA
      await this.solveCaptcha(jobId, solution)
      
      // Get the user_id from the job
      const userId = await this.storage.getJobUserId(jobId)
      
      // Update progress to indicate CAPTCHA is solved
      const solutionUpdate: Omit<ProgressUpdate, 'id' | 'created_at'> = {
        job_id: jobId,
        user_id: userId,
        step_name: 'captcha_detected',
        status: 'captcha_solved',
        message: 'CAPTCHA solved - continuing automation',
        progress_percentage: 55, // Resume from 55%
        needs_captcha: false,
        captcha_solution: solution,
        metadata: {
          captcha_solution_time: new Date().toISOString()
        }
      }

      const progressUpdate = await this.storage.createProgressUpdate(solutionUpdate)
      
      console.log(`✅ CAPTCHA solution handled: ${progressUpdate.id}`)
      return progressUpdate
    } catch (error) {
      console.error('ProgressService.handleCaptchaSolution error:', error)
      throw error
    }
  }
}
