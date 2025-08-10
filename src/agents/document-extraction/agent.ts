import { ChatOpenAI } from '@langchain/openai'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { z } from 'zod'
import { 
  ExtractionContext, 
  ExtractionResult, 
  ExtractedField, 
  AgentConfig,
  ExtractedFieldSchema,
  ExtractionResultSchema
} from '../types/extraction'
import { getTemplateForCategory } from '../types/templates'
import { validateExtraction } from '../utils/validation'

export class DocumentExtractionAgent {
  private model: ChatOpenAI
  private config: AgentConfig
  private extractionParser: StructuredOutputParser<typeof ExtractionResultSchema>
  private fieldsArrayParser: StructuredOutputParser<z.ZodArray<typeof ExtractedFieldSchema> | any>
  // Soft limit on how much document text we pass to the model to avoid context overflows
  private readonly MAX_INPUT_CHARS = 5000

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      model: 'gpt-4o-mini',
      temperature: 0.1,
      max_tokens: 4000,
      retry_attempts: 3,
      confidence_threshold: 0.7,
      enable_validation: true,
      enable_correction: true,
      ...config
    }

    this.model = new ChatOpenAI({
      modelName: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.max_tokens,
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelKwargs: {
        response_format: { type: 'json_object' }
      }
    })

    this.extractionParser = StructuredOutputParser.fromZodSchema(ExtractionResultSchema)
    // Parser for compact per-category responses: { extracted_fields: ExtractedField[] }
    const FieldsEnvelope = z.object({ extracted_fields: z.array(ExtractedFieldSchema) })
    this.fieldsArrayParser = StructuredOutputParser.fromZodSchema(FieldsEnvelope)
  }

  async extractDocument(context: ExtractionContext): Promise<ExtractionResult> {
    const startTime = Date.now()
    
    try {
      console.log(`Starting document extraction for: ${context.filename}`)
      
      // Get document template
      const template = getTemplateForCategory(context.document_category)
      
      // Truncate document text to fit within context limits
      const truncatedText = this.truncateDocumentText(context.document_text)
      
      // Multi-pass extraction by field category to reduce token pressure
      const extractionResult = await this.extractInChunksByCategory(template, truncatedText)
      
      // Validate extraction if enabled
      if (this.config.enable_validation) {
        await this.validateExtraction(extractionResult.extracted_fields, truncatedText)
      }
      
      // Calculate confidence summary
      const confidenceSummary = this.calculateConfidenceSummary(extractionResult.extracted_fields)
      
      const result: ExtractionResult = {
        document_type: extractionResult.document_type || template.name,
        extracted_fields: extractionResult.extracted_fields,
        confidence_summary: confidenceSummary,
        extraction_notes: extractionResult.extraction_notes || [],
        processing_time_ms: Date.now() - startTime
      }

      console.log(`Extraction completed in ${result.processing_time_ms}ms`)
      console.log(`Extracted ${result.extracted_fields.length} fields with ${confidenceSummary.overall_confidence}% overall confidence`)

      return result

    } catch (error) {
      console.error('Document extraction failed:', error)
      throw new Error(`Document extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async createExtractionChain(template: any, opts?: { fieldsSubset?: any[], useFieldsOnly?: boolean }) {
    const useFieldsOnly = opts?.useFieldsOnly === true
    const fieldsToUse = opts?.fieldsSubset ?? template.fields
    const formatInstructions = useFieldsOnly
      ? this.fieldsArrayParser.getFormatInstructions()
      : this.extractionParser.getFormatInstructions()
    
    const prompt = PromptTemplate.fromTemplate(
      `You are an expert immigration document analyzer. Your task is to extract structured information from immigration documents with high accuracy.

DOCUMENT TYPE: {document_type}
DESCRIPTION: {description}

DOCUMENT TEXT:
{document_text}

 AVAILABLE FIELDS TO EXTRACT:
 {fields}

EXTRACTION GUIDELINES:
1. Only extract information that is explicitly present in the document text
2. If a field is not found, do not include it in the response
3. Maintain the exact text as it appears in the document
4. For dates, preserve the original format
5. For names, include the complete name as written
6. Be precise and avoid making assumptions
7. If you're unsure about a field, set confidence_score to 0.5 or lower
8. The document text may be truncated for length. Only use what is shown.
9. Only extract fields from the ALLOWED list shown above. Ignore any other fields.
10. Keep each extracted field object minimal: include field_name, field_value, confidence_score, field_category, validation_status only.

EXAMPLES OF WHAT TO LOOK FOR:
{examples}

IMPORTANT: Only include fields that you can confidently extract from the document text. If you cannot find a field, do not include it in the response.

Return ONLY valid JSON, with no markdown fences or commentary.

{format_instructions}`
    )
    
    return RunnableSequence.from([
      {
        document_text: (input: { document_text: string }) => input.document_text,
        document_type: () => template.name,
        description: () => template.description,
        fields: () => {
          const MAX_FIELDS = 80
          const listed = fieldsToUse.slice(0, MAX_FIELDS).map((field: any) => 
            `- ${field.name} (${field.required ? 'required' : 'optional'}; category: ${field.category})`
          ).join('\n')
          if (fieldsToUse.length > MAX_FIELDS) {
            const remaining = fieldsToUse.length - MAX_FIELDS
            return listed + `\n- ...and ${remaining} additional fields (not listed due to length). Extract them if present in the document.`
          }
          return listed
        },
        examples: () => {
          if (useFieldsOnly) return ''
          const MAX_EXAMPLES = 3
          const examples = Array.isArray(template.examples) ? template.examples.slice(0, MAX_EXAMPLES) : []
          return examples.join('\n')
        },
        format_instructions: () => formatInstructions
      },
      prompt,
      this.model,
      (raw: any) => useFieldsOnly ? this.safeParseWithParser(raw, this.fieldsArrayParser) : this.safeParseWithParser(raw, this.extractionParser)
    ])
  }

  /**
   * Reduce the input document text to stay safely under model context limits.
   * Keeps the beginning (where headers and identifiers often are) and the end
   * (where signatures/footers can appear), with a clear truncation marker.
   */
  private truncateDocumentText(fullText: string): string {
    if (!fullText || fullText.length <= this.MAX_INPUT_CHARS) {
      return fullText
    }
    const headKeep = Math.floor(this.MAX_INPUT_CHARS * 0.8)
    const tailKeep = this.MAX_INPUT_CHARS - headKeep
    const head = fullText.slice(0, headKeep)
    const tail = fullText.slice(-tailKeep)
    return `${head}\n\n...[TRUNCATED FOR LENGTH]...\n\n${tail}`
  }

  private async performExtraction(chain: any, documentText: string): Promise<any> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.config.retry_attempts; attempt++) {
      try {
        console.log(`Extraction attempt ${attempt}/${this.config.retry_attempts}`)
        
        const result = await chain.invoke({ document_text: documentText })
        
        // Validate the result structure
        if (!result || !Array.isArray(result.extracted_fields)) {
          throw new Error('Invalid extraction result structure')
        }
        
        return result
        
      } catch (error) {
        lastError = error as Error
        console.warn(`Extraction attempt ${attempt} failed:`, error)
        
        if (attempt < this.config.retry_attempts) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }
    
    throw new Error(`All extraction attempts failed. Last error: ${lastError?.message}`)
  }

  private async safeParseWithParser(raw: any, parser: any): Promise<any> {
    const text = typeof raw === 'string' ? raw : (raw?.content ?? String(raw))
    try {
      return await parser.parse(text)
    } catch (err1) {
      const cleaned = this.cleanJsonFences(text)
      try {
        return await parser.parse(cleaned)
      } catch (err2) {
        const sliced = this.extractJsonSubstring(cleaned)
        return await parser.parse(sliced)
      }
    }
  }

  private cleanJsonFences(s: string): string {
    return s
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
  }

  private extractJsonSubstring(s: string): string {
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      return s.slice(start, end + 1)
    }
    return s
  }

  private async extractInChunksByCategory(template: any, documentText: string): Promise<ExtractionResult> {
    // Group fields by category
    const fieldsByCategory: Record<string, any[]> = {}
    for (const f of template.fields) {
      const key = f.category || 'other'
      if (!fieldsByCategory[key]) fieldsByCategory[key] = []
      fieldsByCategory[key].push(f)
    }

    const merged: Record<string, ExtractedField> = {}

    const categoriesOrder = [
      'personal', 'contact', 'address', 'identification', 'passport',
      'travel', 'education', 'employment', 'financial', 'other'
    ]

    const orderedKeys = Object.keys(fieldsByCategory).sort((a, b) => {
      const ia = categoriesOrder.indexOf(a)
      const ib = categoriesOrder.indexOf(b)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })

    const BATCH_SIZE = 12
    for (const key of orderedKeys) {
      const subset = fieldsByCategory[key]
      if (!subset || subset.length === 0) continue

      for (let i = 0; i < subset.length; i += BATCH_SIZE) {
        const batch = subset.slice(i, i + BATCH_SIZE)
        const chain = await this.createExtractionChain({ ...template, fields: batch }, { fieldsSubset: batch, useFieldsOnly: true })
        const res = await this.performExtraction(chain, documentText)
        const arr: ExtractedField[] = res?.extracted_fields ?? []
        for (const ef of arr) {
          const existing = merged[ef.field_name]
          if (!existing || (ef.confidence_score ?? 0) > (existing.confidence_score ?? 0)) {
            merged[ef.field_name] = ef
          }
        }
      }
    }

    const extracted_fields = Object.values(merged)
    const confidence_summary = this.calculateConfidenceSummary(extracted_fields)
    return {
      document_type: template.name,
      extracted_fields,
      confidence_summary,
      extraction_notes: [],
      processing_time_ms: 0
    }
  }

  private async validateExtraction(fields: ExtractedField[], documentText: string): Promise<void> {
    try {
      console.log('Validating extraction results...')
      
      // Perform validation
      const validationSummary = validateExtraction(fields)
      
      // Update field validation status
      fields.forEach(field => {
        const validationResult = validationSummary.validation_results.find(
          v => v.field_name === field.field_name
        )
        if (validationResult) {
          field.validation_status = validationResult.validation_status
        }
      })
      
      console.log(`Validation completed: ${validationSummary.overall_assessment}`)
      
      // If validation is poor, attempt corrections
      if (this.config.enable_correction && validationSummary.overall_assessment.includes('Poor')) {
        await this.attemptCorrections(fields, documentText)
      }
      
    } catch (error) {
      console.warn('Validation failed:', error)
      // Don't throw error, continue with extraction
    }
  }

  private async attemptCorrections(fields: ExtractedField[], documentText: string): Promise<void> {
    try {
      console.log('Attempting field corrections...')
      
      const correctionPromises = fields
        .filter(field => field.validation_status === 'flagged')
        .map(async (field) => {
          try {
            const correctionChain = await this.createCorrectionChain()
            const correction = await correctionChain.invoke({
              field: JSON.stringify(field),
              document_text: documentText
            })
            
            if (correction.corrected_value && correction.confidence_score > field.confidence_score) {
              field.field_value = correction.corrected_value
              field.confidence_score = correction.confidence_score
              field.validation_status = 'validated'
              console.log(`Corrected field ${field.field_name}: ${correction.explanation}`)
            }
          } catch (error) {
            console.warn(`Failed to correct field ${field.field_name}:`, error)
          }
        })
      
      await Promise.all(correctionPromises)
      
    } catch (error) {
      console.warn('Field correction failed:', error)
    }
  }

  private async createCorrectionChain() {
    const prompt = PromptTemplate.fromTemplate(
      `You are an expert immigration document field corrector. Please correct the following extracted field.

DOCUMENT TEXT:
{document_text}

FIELD TO CORRECT:
{field}

Please provide the corrected value based on the document text. If the current value is correct, confirm it. If it cannot be found in the document, indicate that.

Return your response in this JSON format:
{{
  "corrected_value": "the corrected field value",
  "confidence_score": 0.95,
  "explanation": "explanation of the correction made",
  "source_text": "the text from the document that supports this value"
}}`
    )
    
    return RunnableSequence.from([
      {
        field: (input: { field: string; document_text: string }) => input.field,
        document_text: (input: { field: string; document_text: string }) => input.document_text
      },
      prompt,
      this.model,
      (output: string) => {
        try {
          return JSON.parse(output)
        } catch {
          return { corrected_value: null, confidence_score: 0, explanation: 'Failed to parse correction' }
        }
      }
    ])
  }

  private calculateConfidenceSummary(fields: ExtractedField[]) {
    const high_confidence = fields.filter(f => f.confidence_score >= 0.8).length
    const medium_confidence = fields.filter(f => f.confidence_score >= 0.6 && f.confidence_score < 0.8).length
    const low_confidence = fields.filter(f => f.confidence_score < 0.6).length
    
    const overall_confidence = fields.length > 0 
      ? fields.reduce((sum, field) => sum + field.confidence_score, 0) / fields.length
      : 0

    return {
      high_confidence,
      medium_confidence,
      low_confidence,
      overall_confidence
    }
  }

  // Method to get agent configuration
  getConfig(): AgentConfig {
    return { ...this.config }
  }

  // Method to update agent configuration
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Update model if needed
    if (newConfig.model || newConfig.temperature || newConfig.max_tokens) {
      this.model = new ChatOpenAI({
        modelName: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.max_tokens,
        openAIApiKey: process.env.OPENAI_API_KEY,
      })
    }
  }
} 