/**
 * Progress Tracking Types
 * 
 * This module defines all types related to progress tracking,
 * CAPTCHA handling, and real-time updates for CEAC automation.
 */

// ============================================================================
// PROGRESS TYPES
// ============================================================================

export type ProgressStatus = 
  | 'pending'
  | 'initializing'
  | 'running'
  | 'waiting_for_captcha'
  | 'captcha_solved'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type ProgressStep = 
  | 'job_created'
  | 'browser_initialized'
  | 'navigating_to_ceac'
  | 'embassy_selected'
  | 'captcha_detected'
  | 'form_filling_started'
  | 'form_step_1'
  | 'form_step_2'
  | 'form_step_3'
  | 'form_step_4'
  | 'form_step_5'
  | 'form_step_6'
  | 'form_step_7'
  | 'form_step_8'
  | 'form_step_9'
  | 'form_step_10'
  | 'form_step_11'
  | 'form_step_12'
  | 'form_step_13'
  | 'form_step_14'
  | 'form_step_15'
  | 'form_step_16'
  | 'form_step_17'
  | 'form_review'
  | 'form_submitted'
  | 'application_id_extracted'
  | 'confirmation_id_extracted'
  | 'job_completed'

export interface ProgressUpdate {
  id: string
  job_id: string
  user_id: string
  step_number?: number
  step_name: ProgressStep
  status: ProgressStatus
  message: string
  progress_percentage: number
  captcha_image?: string
  needs_captcha: boolean
  captcha_solution?: string
  metadata: Record<string, any>
  created_at: string
}

export interface ProgressSummary {
  job_id: string
  current_step: ProgressStep
  current_status: ProgressStatus
  progress_percentage: number
  total_steps: number
  completed_steps: number
  estimated_completion?: string
  last_update: string
  needs_captcha: boolean
  captcha_image?: string
}

// ============================================================================
// CAPTCHA TYPES
// ============================================================================

export interface CaptchaChallenge {
  id: string
  job_id: string
  image_url: string
  input_selector: string
  submit_selector: string
  refresh_selector?: string
  created_at: string
  expires_at: string
  solved: boolean
  solution?: string
}

export interface CaptchaSolution {
  job_id: string
  solution: string
  solved_at: string
}

// ============================================================================
// REALTIME TYPES
// ============================================================================

export type RealtimeEventType = 
  | 'progress_update'
  | 'captcha_challenge'
  | 'captcha_solved'
  | 'job_completed'
  | 'job_failed'
  | 'error'

export interface RealtimeEvent {
  type: RealtimeEventType
  job_id: string
  data: ProgressUpdate | CaptchaChallenge | any
  timestamp: string
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface ProgressServiceInterface {
  createProgressUpdate(update: Omit<ProgressUpdate, 'id' | 'created_at'>): Promise<ProgressUpdate>
  getProgressSummary(jobId: string): Promise<ProgressSummary>
  getProgressHistory(jobId: string): Promise<ProgressUpdate[]>
  updateProgress(jobId: string, update: Partial<ProgressUpdate>): Promise<ProgressUpdate>
  markJobCompleted(jobId: string, result: any): Promise<void>
  markJobFailed(jobId: string, error: string): Promise<void>
}

export interface CaptchaServiceInterface {
  createCaptchaChallenge(jobId: string, imageUrl: string): Promise<CaptchaChallenge>
  solveCaptcha(jobId: string, solution: string): Promise<CaptchaSolution>
  getCaptchaChallenge(jobId: string): Promise<CaptchaChallenge | null>
  refreshCaptcha(jobId: string): Promise<CaptchaChallenge>
}

export interface RealtimeServiceInterface {
  subscribeToProgress(jobId: string, callback: (event: RealtimeEvent) => void): () => void
  subscribeToCaptcha(jobId: string, callback: (challenge: CaptchaChallenge) => void): () => void
  unsubscribe(jobId: string): void
  publishEvent(event: RealtimeEvent): Promise<void>
}

// ============================================================================
// API TYPES
// ============================================================================

export interface CreateProgressUpdateRequest {
  job_id: string
  step_name: ProgressStep
  status: ProgressStatus
  message: string
  progress_percentage: number
  captcha_image?: string
  needs_captcha?: boolean
  metadata?: Record<string, any>
}

export interface SolveCaptchaRequest {
  job_id: string
  solution: string
}

export interface ProgressResponse {
  success: boolean
  data?: ProgressUpdate | ProgressSummary | CaptchaChallenge
  error?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ProgressConfig {
  enable_realtime: boolean
  progress_update_interval: number
  captcha_timeout: number
  max_retries: number
}

export interface ProgressMetrics {
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  average_completion_time: number
  captcha_success_rate: number
}

