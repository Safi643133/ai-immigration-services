import { z } from 'zod'

// Field categories for immigration documents
export type FieldCategory = 
  | 'personal' 
  | 'contact' 
  | 'address' 
  | 'education' 
  | 'employment' 
  | 'financial' 
  | 'travel' 
  | 'identification'

// Document categories
export type DocumentCategory = 
  | 'passport' 
  | 'visa' 
  | 'education' 
  | 'financial' 
  | 'employment' 
  | 'medical'
  | 'other'

// Schema for extracted field
export const ExtractedFieldSchema = z.object({
  field_name: z.string(),
  field_value: z.string(),
  confidence_score: z.number().min(0).max(1),
  field_category: z.enum(['personal', 'contact', 'address', 'education', 'employment', 'financial', 'travel', 'identification']),
  source_text: z.string().optional(), // The original text that was extracted from
  validation_status: z.enum(['pending', 'validated', 'flagged', 'corrected']).default('pending')
})

export type ExtractedField = z.infer<typeof ExtractedFieldSchema>

// Schema for extraction result
export const ExtractionResultSchema = z.object({
  document_type: z.string(),
  extracted_fields: z.array(ExtractedFieldSchema),
  confidence_summary: z.object({
    high_confidence: z.number(),
    medium_confidence: z.number(),
    low_confidence: z.number(),
    overall_confidence: z.number()
  }),
  extraction_notes: z.array(z.string()).optional(),
  processing_time_ms: z.number()
})

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>

// Field definitions for different document types
export interface FieldDefinition {
  name: string
  description: string
  category: FieldCategory
  examples: string[]
  validation_rules?: string[]
  required: boolean
}

// Document template
export interface DocumentTemplate {
  name: string
  category: DocumentCategory
  description: string
  fields: FieldDefinition[]
  examples: string[]
}

// Extraction context
export interface ExtractionContext {
  document_category: DocumentCategory
  document_text: string
  file_type: string
  filename: string
  user_id: string
  document_id: string
}

// Agent configuration
export interface AgentConfig {
  model: string
  temperature: number
  max_tokens: number
  retry_attempts: number
  confidence_threshold: number
  enable_validation: boolean
  enable_correction: boolean
} 