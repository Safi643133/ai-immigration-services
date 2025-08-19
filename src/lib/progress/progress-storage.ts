/**
 * Progress Storage Service
 * 
 * Handles all database operations related to progress tracking,
 * including CRUD operations for progress updates and summaries.
 */

import { createClient } from '@supabase/supabase-js'
import type { 
  ProgressUpdate, 
  ProgressSummary, 
  CaptchaChallenge,
  CaptchaSolution 
} from './progress-types'

export class ProgressStorage {
  private supabase

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

  // ============================================================================
  // PROGRESS UPDATE OPERATIONS
  // ============================================================================

  /**
   * Create a new progress update
   */
  async createProgressUpdate(update: Omit<ProgressUpdate, 'id' | 'created_at'>): Promise<ProgressUpdate> {
    try {
      const { data, error } = await this.supabase
        .from('ceac_progress_updates')
        .insert({
          job_id: update.job_id,
          user_id: update.user_id,
          step_number: update.step_number,
          step_name: update.step_name,
          status: update.status,
          message: update.message,
          progress_percentage: update.progress_percentage,
          captcha_image: update.captcha_image,
          needs_captcha: update.needs_captcha,
          captcha_solution: update.captcha_solution,
          metadata: update.metadata
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating progress update:', error)
        throw new Error(`Failed to create progress update: ${error.message}`)
      }

      return data as ProgressUpdate
    } catch (error) {
      console.error('ProgressStorage.createProgressUpdate error:', error)
      throw error
    }
  }

  /**
   * Get progress history for a job
   */
  async getProgressHistory(jobId: string): Promise<ProgressUpdate[]> {
    try {
      const { data, error } = await this.supabase
        .from('ceac_progress_updates')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching progress history:', error)
        throw new Error(`Failed to fetch progress history: ${error.message}`)
      }

      return data as ProgressUpdate[]
    } catch (error) {
      console.error('ProgressStorage.getProgressHistory error:', error)
      throw error
    }
  }

  /**
   * Get the latest progress update for a job
   */
  async getLatestProgressUpdate(jobId: string): Promise<ProgressUpdate | null> {
    try {
      const { data, error } = await this.supabase
        .from('ceac_progress_updates')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        console.error('Error fetching latest progress update:', error)
        throw new Error(`Failed to fetch latest progress update: ${error.message}`)
      }

      return data as ProgressUpdate
    } catch (error) {
      console.error('ProgressStorage.getLatestProgressUpdate error:', error)
      throw error
    }
  }

  /**
   * Get progress summary for a job
   */
  async getProgressSummary(jobId: string): Promise<ProgressSummary> {
    try {
      // Get all progress updates for the job
      const updates = await this.getProgressHistory(jobId)
      
      if (updates.length === 0) {
        throw new Error('No progress updates found for job')
      }

      const latest = updates[updates.length - 1]
      const totalSteps = 17 // Total DS-160 form steps
      const completedSteps = updates.filter(u => 
        u.step_name.startsWith('form_step_') || 
        u.step_name === 'form_submitted' ||
        u.step_name === 'job_completed'
      ).length

      const progressPercentage = Math.min(
        Math.round((completedSteps / totalSteps) * 100),
        100
      )

      return {
        job_id: jobId,
        current_step: latest.step_name,
        current_status: latest.status,
        progress_percentage: progressPercentage,
        total_steps: totalSteps,
        completed_steps: completedSteps,
        last_update: latest.created_at,
        needs_captcha: latest.needs_captcha,
        captcha_image: latest.captcha_image
      }
    } catch (error) {
      console.error('ProgressStorage.getProgressSummary error:', error)
      throw error
    }
  }

  // ============================================================================
  // CAPTCHA OPERATIONS
  // ============================================================================

  /**
   * Create a new CAPTCHA challenge
   */
  async createCaptchaChallenge(challenge: Omit<CaptchaChallenge, 'id' | 'created_at'>): Promise<CaptchaChallenge> {
    try {
      const { data, error } = await this.supabase
        .from('ceac_captcha_challenges')
        .insert({
          job_id: challenge.job_id,
          image_url: challenge.image_url,
          input_selector: challenge.input_selector,
          submit_selector: challenge.submit_selector,
          refresh_selector: challenge.refresh_selector,
          expires_at: challenge.expires_at,
          solved: challenge.solved
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating CAPTCHA challenge:', error)
        throw new Error(`Failed to create CAPTCHA challenge: ${error.message}`)
      }

      return data as CaptchaChallenge
    } catch (error) {
      console.error('ProgressStorage.createCaptchaChallenge error:', error)
      throw error
    }
  }

  /**
   * Update an existing CAPTCHA challenge
   */
  async updateCaptchaChallenge(challengeId: string, updates: Partial<CaptchaChallenge>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ceac_captcha_challenges')
        .update(updates)
        .eq('id', challengeId)

      if (error) {
        console.error('Error updating CAPTCHA challenge:', error)
        throw new Error(`Failed to update CAPTCHA challenge: ${error.message}`)
      }
    } catch (error) {
      console.error('ProgressStorage.updateCaptchaChallenge error:', error)
      throw error
    }
  }

  /**
   * Get the current CAPTCHA challenge for a job (unsolved)
   */
  async getCaptchaChallenge(jobId: string): Promise<CaptchaChallenge | null> {
    try {
      const { data, error } = await this.supabase
        .from('ceac_captcha_challenges')
        .select('*')
        .eq('job_id', jobId)
        .eq('solved', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        console.error('Error fetching CAPTCHA challenge:', error)
        throw new Error(`Failed to fetch CAPTCHA challenge: ${error.message}`)
      }

      return data as CaptchaChallenge
    } catch (error) {
      console.error('ProgressStorage.getCaptchaChallenge error:', error)
      throw error
    }
  }

  /**
   * Get the solved CAPTCHA challenge for a job
   */
  async getSolvedCaptchaChallenge(jobId: string): Promise<CaptchaChallenge | null> {
    try {
      const { data, error } = await this.supabase
        .from('ceac_captcha_challenges')
        .select('*')
        .eq('job_id', jobId)
        .eq('solved', true)
        .not('solution', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        console.error('Error fetching solved CAPTCHA challenge:', error)
        throw new Error(`Failed to fetch solved CAPTCHA challenge: ${error.message}`)
      }

      return data as CaptchaChallenge
    } catch (error) {
      console.error('ProgressStorage.getSolvedCaptchaChallenge error:', error)
      throw error
    }
  }

  /**
   * Mark CAPTCHA as solved
   */
  async solveCaptcha(jobId: string, solution: string): Promise<CaptchaSolution> {
    try {
      // Update the CAPTCHA challenge
      const { error: updateError } = await this.supabase
        .from('ceac_captcha_challenges')
        .update({
          solved: true,
          solution: solution
        })
        .eq('job_id', jobId)
        .eq('solved', false)

      if (updateError) {
        console.error('Error updating CAPTCHA challenge:', updateError)
        throw new Error(`Failed to update CAPTCHA challenge: ${updateError.message}`)
      }

      const captchaSolution: CaptchaSolution = {
        job_id: jobId,
        solution: solution,
        solved_at: new Date().toISOString()
      }

      return captchaSolution
    } catch (error) {
      console.error('ProgressStorage.solveCaptcha error:', error)
      throw error
    }
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Get user_id for a job
   */
  async getJobUserId(jobId: string): Promise<string> {
    try {
      const { data: job, error } = await this.supabase
        .from('ceac_automation_jobs')
        .select('user_id')
        .eq('id', jobId)
        .single()

      if (error || !job) {
        throw new Error(`Failed to get job ${jobId}: ${error?.message || 'Job not found'}`)
      }

      return job.user_id
    } catch (error) {
      console.error('ProgressStorage.getJobUserId error:', error)
      throw error
    }
  }

  /**
   * Clean up old progress data
   */
  async cleanupOldProgress(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { count, error } = await this.supabase
        .from('ceac_progress_updates')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('Error cleaning up old progress:', error)
        throw new Error(`Failed to cleanup old progress: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      console.error('ProgressStorage.cleanupOldProgress error:', error)
      throw error
    }
  }

  /**
   * Get progress metrics
   */
  async getProgressMetrics(): Promise<{
    total_updates: number
    total_captchas: number
    solved_captchas: number
    average_progress_percentage: number
  }> {
    try {
      // Get total progress updates
      const { count: totalUpdates, error: updatesError } = await this.supabase
        .from('ceac_progress_updates')
        .select('*', { count: 'exact', head: true })

      if (updatesError) {
        throw new Error(`Failed to get total updates: ${updatesError.message}`)
      }

      // Get CAPTCHA statistics
      const { count: totalCaptchas, error: captchasError } = await this.supabase
        .from('ceac_captcha_challenges')
        .select('*', { count: 'exact', head: true })

      if (captchasError) {
        throw new Error(`Failed to get total captchas: ${captchasError.message}`)
      }

      const { count: solvedCaptchas, error: solvedError } = await this.supabase
        .from('ceac_captcha_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('solved', true)

      if (solvedError) {
        throw new Error(`Failed to get solved captchas: ${solvedError.message}`)
      }

      // Get average progress percentage
      const { data: progressData, error: progressError } = await this.supabase
        .from('ceac_progress_updates')
        .select('progress_percentage')

      if (progressError) {
        throw new Error(`Failed to get progress data: ${progressError.message}`)
      }

      const averageProgress = progressData.length > 0
        ? progressData.reduce((sum, item) => sum + item.progress_percentage, 0) / progressData.length
        : 0

      return {
        total_updates: totalUpdates || 0,
        total_captchas: totalCaptchas || 0,
        solved_captchas: solvedCaptchas || 0,
        average_progress_percentage: Math.round(averageProgress)
      }
    } catch (error) {
      console.error('ProgressStorage.getProgressMetrics error:', error)
      throw error
    }
  }
}
