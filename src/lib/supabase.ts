import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type UserRole = 'applicant' | 'lawyer' | 'admin'
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed'
export type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'paused'
export type DocumentCategory = 'passport' | 'visa' | 'education' | 'employment' | 'financial' | 'birth_certificate' | 'marriage_certificate' | 'medical' | 'other'
export type FieldCategory = 'personal' | 'contact' | 'address' | 'education' | 'employment' | 'financial' | 'travel' | 'identification'
export type ValidationStatus = 'pending' | 'validated' | 'flagged' | 'corrected'
export type ValidationType = 'consistency' | 'format' | 'completeness' | 'cross_document'
export type FormType = 'ds160' | 'work_visa' | 'student_visa' | 'family_visa' | 'custom'
export type SubmissionStatus = 'draft' | 'review' | 'finalized' | 'submitted'

// CEAC automation types
export type CeacJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'needs_human' | 'cancelled'
export type EventLevel = 'debug' | 'info' | 'warn' | 'error'
export type ArtifactType = 'screenshot' | 'html' | 'har' | 'pdf' | 'json' | 'video' | 'log'

export interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  phone: string | null
  company: string | null
  license_number: string | null
  specialization: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  filename: string
  file_path: string
  file_type: string
  file_size: number
  upload_status: UploadStatus
  processing_status: ProcessingStatus
  document_category: DocumentCategory
  created_at: string
  updated_at: string
}

export interface ExtractedData {
  id: string
  document_id: string
  field_name: string
  field_value: string | null
  confidence_score: number
  field_category: FieldCategory
  validation_status: ValidationStatus
  validation_notes: string | null
  created_at: string
  updated_at: string
}

export interface ProcessingSession {
  id: string
  document_id: string
  status: ProcessingStatus
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  processing_logs: any | null
  ocr_text: string | null
  created_at: string
  updated_at: string
}

export interface FormTemplate {
  id: string
  name: string
  form_type: FormType
  description: string | null
  fields: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FormSubmission {
  id: string
  user_id: string
  form_template_id: string
  status: SubmissionStatus
  form_data: any | null
  extracted_data_summary: any | null
  // Enhanced CEAC fields
  submission_reference: string
  ceac_application_id: string | null
  ceac_confirmation_id: string | null
  submission_attempt_count: number
  last_submission_attempt: string | null
  form_validation_status: ValidationStatus
  pre_submission_checks: any | null
  ceac_submission_status: CeacJobStatus | null
  created_at: string
  updated_at: string
}

export interface FieldMapping {
  id: string
  form_template_id: string
  extracted_field_name: string
  form_field_name: string
  mapping_confidence: number
  is_required: boolean
  validation_rules: any | null
  created_at: string
}

export interface ValidationLog {
  id: string
  extracted_data_id: string
  validation_type: ValidationType
  validation_result: ValidationStatus
  validation_message: string | null
  suggested_correction: string | null
  created_at: string
}

// CEAC automation interfaces
export interface CeacAutomationJob {
  id: string
  user_id: string
  submission_id: string
  status: CeacJobStatus
  ceac_version: string
  priority: number
  scheduled_at: string
  started_at: string | null
  finished_at: string | null
  ceac_application_id: string | null
  ceac_confirmation_id: string | null
  embassy_location: string | null
  error_code: string | null
  error_message: string | null
  retry_count: number
  max_retries: number
  idempotency_key: string
  metadata: any
  created_at: string
  updated_at: string
}

export interface CeacJobEvent {
  id: string
  job_id: string
  timestamp: string
  event_type: string
  level: EventLevel
  message: string
  payload: any
  page_url: string | null
  screenshot_path: string | null
  created_at: string
}

export interface CeacArtifact {
  id: string
  job_id: string
  artifact_type: ArtifactType
  storage_path: string
  file_size: number | null
  mime_type: string | null
  description: string | null
  step_name: string | null
  created_at: string
}

export interface CeacFieldMapping {
  id: string
  ceac_version: string
  page_identifier: string
  ds160_step_number: number
  field_group: string
  ds160_field_path: string
  ceac_selector: any
  ceac_action: string
  field_order: number
  is_required: boolean
  validation_rules: any
  fallback_selectors: any
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CeacSession {
  id: string
  job_id: string
  session_identifier: string
  ceac_location: string
  session_cookies: any
  session_expires_at: string | null
  user_agent: string
  viewport_size: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>>
      }
      extracted_data: {
        Row: ExtractedData
        Insert: Omit<ExtractedData, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ExtractedData, 'id' | 'created_at' | 'updated_at'>>
      }
      processing_sessions: {
        Row: ProcessingSession
        Insert: Omit<ProcessingSession, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProcessingSession, 'id' | 'created_at' | 'updated_at'>>
      }
      form_templates: {
        Row: FormTemplate
        Insert: Omit<FormTemplate, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FormTemplate, 'id' | 'created_at' | 'updated_at'>>
      }
      form_submissions: {
        Row: FormSubmission
        Insert: Omit<FormSubmission, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FormSubmission, 'id' | 'created_at' | 'updated_at'>>
      }
      field_mappings: {
        Row: FieldMapping
        Insert: Omit<FieldMapping, 'id' | 'created_at'>
        Update: Partial<Omit<FieldMapping, 'id' | 'created_at'>>
      }
      validation_logs: {
        Row: ValidationLog
        Insert: Omit<ValidationLog, 'id' | 'created_at'>
        Update: Partial<Omit<ValidationLog, 'id' | 'created_at'>>
      }
      ceac_automation_jobs: {
        Row: CeacAutomationJob
        Insert: Omit<CeacAutomationJob, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CeacAutomationJob, 'id' | 'created_at' | 'updated_at'>>
      }
      ceac_job_events: {
        Row: CeacJobEvent
        Insert: Omit<CeacJobEvent, 'id' | 'created_at'>
        Update: Partial<Omit<CeacJobEvent, 'id' | 'created_at'>>
      }
      ceac_artifacts: {
        Row: CeacArtifact
        Insert: Omit<CeacArtifact, 'id' | 'created_at'>
        Update: Partial<Omit<CeacArtifact, 'id' | 'created_at'>>
      }
      ceac_field_mappings: {
        Row: CeacFieldMapping
        Insert: Omit<CeacFieldMapping, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CeacFieldMapping, 'id' | 'created_at' | 'updated_at'>>
      }
      ceac_sessions: {
        Row: CeacSession
        Insert: Omit<CeacSession, 'id' | 'created_at'>
        Update: Partial<Omit<CeacSession, 'id' | 'created_at'>>
      }
    }
  }
} 