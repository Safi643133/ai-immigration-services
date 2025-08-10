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
    }
  }
} 