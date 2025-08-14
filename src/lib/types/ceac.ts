// CEAC Automation Types
// Types for the enhanced form storage and CEAC automation system

export type CeacJobStatus = 
  | 'queued' 
  | 'running' 
  | 'succeeded' 
  | 'failed' 
  | 'needs_human' 
  | 'cancelled'

export type EventLevel = 'debug' | 'info' | 'warn' | 'error'

export type ArtifactType = 
  | 'screenshot' 
  | 'html' 
  | 'har' 
  | 'pdf' 
  | 'json' 
  | 'video'
  | 'log'

// Enhanced form submission interface
export interface EnhancedFormSubmission {
  id: string
  user_id: string
  form_template_id: string
  status: 'draft' | 'review' | 'finalized' | 'submitted'
  form_data: Record<string, any>
  extracted_data_summary?: Record<string, any>
  
  // New CEAC-related fields
  submission_reference: string
  ceac_application_id?: string
  ceac_confirmation_id?: string
  submission_attempt_count: number
  last_submission_attempt?: string
  form_validation_status: 'pending' | 'validated' | 'flagged' | 'corrected'
  pre_submission_checks?: FormValidationResult
  ceac_submission_status?: CeacJobStatus
  
  created_at: string
  updated_at: string
}

// Form validation result interface
export interface FormValidationResult {
  isComplete: boolean
  missingFields: string[]
  validationErrors: ValidationError[]
  confidenceScore: number
  readinessForSubmission: boolean
  recommendedActions: string[]
  validatedAt: string
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
  suggestion?: string
}

// CEAC automation job interface
export interface CeacAutomationJob {
  id: string
  user_id: string
  submission_id: string
  status: CeacJobStatus
  ceac_version: string
  priority: number // 1-10, where 1 is highest priority
  scheduled_at: string
  started_at?: string
  finished_at?: string
  ceac_application_id?: string
  ceac_confirmation_id?: string
  embassy_location?: string
  error_code?: string
  error_message?: string
  retry_count: number
  max_retries: number
  idempotency_key: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// CEAC job event interface
export interface CeacJobEvent {
  id: string
  job_id: string
  timestamp: string
  event_type: string
  level: EventLevel
  message: string
  payload: Record<string, any>
  page_url?: string
  screenshot_path?: string
  created_at: string
}

// CEAC artifact interface
export interface CeacArtifact {
  id: string
  job_id: string
  artifact_type: ArtifactType
  storage_path: string
  file_size?: number
  mime_type?: string
  description?: string
  step_name?: string
  created_at: string
}

// CEAC field mapping interface
export interface CeacFieldMapping {
  id: string
  ceac_version: string
  page_identifier: string
  ds160_step_number: number
  field_group: string
  ds160_field_path: string
  ceac_selector: SelectorStrategy
  ceac_action: 'fill' | 'select' | 'click' | 'radio' | 'checkbox' | 'date'
  field_order: number
  is_required: boolean
  validation_rules: Record<string, any>
  fallback_selectors: SelectorStrategy[]
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Selector strategy interface
export interface SelectorStrategy {
  type: 'label' | 'css' | 'xpath' | 'text' | 'role'
  value: string
  fallbacks?: SelectorStrategy[]
  validation?: string
  timeout?: number
}

// CEAC session interface
export interface CeacSession {
  id: string
  job_id: string
  session_identifier: string
  ceac_location: string
  session_cookies: Record<string, any>
  session_expires_at?: string
  user_agent: string
  viewport_size: string
  created_at: string
}

// Job progress interface
export interface JobProgress {
  current_step: string
  completed_steps: string[]
  total_steps: number
  percentage: number
  estimated_completion?: string
}

// Job creation request interface
export interface CreateCeacJobRequest {
  submission_id: string
  embassy_location: string
  priority?: number
  scheduled_at?: string
  metadata?: Record<string, any>
}

// Job status response interface
export interface CeacJobStatusResponse {
  job: CeacAutomationJob
  progress: JobProgress
  latest_events: CeacJobEvent[]
  artifacts_count: number
  estimated_completion?: string
}

// Embassy location interface
export interface EmbassyLocation {
  code: string
  name: string
  country: string
  region: string
  timezone: string
  processing_capacity: number // jobs per hour
  average_processing_time: number // minutes
}

// Job queue metrics interface
export interface JobQueueMetrics {
  total_jobs: number
  queued_jobs: number
  running_jobs: number
  failed_jobs: number
  succeeded_jobs: number
  average_processing_time: number
  success_rate: number
  queue_depth_by_priority: Record<number, number>
}

// Form pre-submission checks
export interface PreSubmissionChecks {
  validation_passed: boolean
  missing_required_fields: string[]
  field_confidence_warnings: Array<{
    field: string
    confidence: number
    threshold: number
  }>
  document_verification_status: 'pending' | 'verified' | 'failed'
  user_confirmation_required: boolean
  estimated_processing_time: number
  recommended_embassy_slots: Array<{
    location: string
    available_slots: number
    next_available: string
  }>
}

// CEAC API response interfaces
export interface CeacApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  timestamp: string
}

// Batch job operations
export interface BatchJobOperation {
  operation: 'cancel' | 'retry' | 'prioritize'
  job_ids: string[]
  parameters?: Record<string, any>
}

export interface BatchJobResult {
  successful: string[]
  failed: Array<{
    job_id: string
    error: string
  }>
  summary: {
    total: number
    succeeded: number
    failed: number
  }
}

// DS-160 form data interfaces (specific to our multi-step form)
export interface DS160FormData {
  personal_info: {
    surnames: string
    given_names: string
    full_name_native_alphabet?: string
    full_name_native_alphabet_na?: boolean
    other_names_used: 'Yes' | 'No'
    other_surnames_used?: string
    other_given_names_used?: string
    telecode_name: 'Yes' | 'No'
    telecode_surnames?: string
    telecode_given_names?: string
    sex: 'Male' | 'Female'
    marital_status: string
    date_of_birth: string
    place_of_birth_city: string
    place_of_birth_state?: string
    place_of_birth_state_na?: boolean
    place_of_birth_country: string
    nationality: string
    other_nationalities: 'Yes' | 'No'
    other_nationalities_list?: Array<{
      country: string
      has_passport: 'Yes' | 'No'
      passport_number?: string
    }>
    permanent_resident_other_country: 'Yes' | 'No'
    permanent_resident_country?: string
    permanent_resident_country_na?: boolean
    national_identification_number?: string
    national_identification_number_na?: boolean
    us_social_security_number?: string
    us_ssn_na?: boolean
    us_taxpayer_id_number?: string
    us_itin_na?: boolean
  }
  // Add other sections as needed (travel_info, contact_info, etc.)
  [key: string]: any
}

// Field mapping validation
export interface FieldMappingValidation {
  field_path: string
  is_mapped: boolean
  mapping_confidence: number
  selector_reliability: number
  fallback_available: boolean
  validation_issues: string[]
  suggested_improvements: string[]
}

// CEAC automation configuration
export interface CeacAutomationConfig {
  enabled: boolean
  max_concurrent_jobs: number
  default_timeout_minutes: number
  screenshot_enabled: boolean
  video_recording_enabled: boolean
  artifact_retention_days: number
  max_retry_attempts: number
  priority_queue_enabled: boolean
  embassy_restrictions: Record<string, {
    max_daily_submissions: number
    business_hours: {
      start: string
      end: string
      timezone: string
    }
    maintenance_windows: Array<{
      start: string
      end: string
      recurring: boolean
    }>
  }>
}

// Additional interfaces for job processing
export interface CeacJobParams {
  jobId: string
  submissionId: string
  userId: string
  ceacVersion: string
  idempotencyKey?: string
}

// Export utility types
export type CeacJobCreate = Omit<CeacAutomationJob, 'id' | 'created_at' | 'updated_at'>
export type CeacJobUpdate = Partial<Pick<CeacAutomationJob, 'status' | 'ceac_application_id' | 'ceac_confirmation_id' | 'error_code' | 'error_message' | 'retry_count'>>
