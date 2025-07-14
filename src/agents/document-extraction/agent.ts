import { ChatOpenAI } from '@langchain/openai'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
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

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      model: 'gpt-4',
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
    })

    this.extractionParser = StructuredOutputParser.fromZodSchema(ExtractionResultSchema)
  }

  async extractDocument(context: ExtractionContext): Promise<ExtractionResult> {
    const startTime = Date.now()
    
    try {
      console.log(`Starting document extraction for: ${context.filename}`)
      
      // Get document template
      const template = getTemplateForCategory(context.document_category)
      
      // Create extraction chain
      const extractionChain = await this.createExtractionChain(template)
      
      // Extract fields using structured output parser
      const extractionResult = await this.performExtraction(extractionChain, context.document_text)
      
      // Validate extraction if enabled
      if (this.config.enable_validation) {
        await this.validateExtraction(extractionResult.extracted_fields, context.document_text)
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

  private async createExtractionChain(template: any) {
    const formatInstructions = this.extractionParser.getFormatInstructions()
    
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

EXAMPLES OF WHAT TO LOOK FOR:
{examples}

IMPORTANT: Only include fields that you can confidently extract from the document text. If you cannot find a field, do not include it in the response.

Return the extracted information in the exact format specified by the format instructions.

{format_instructions}`
    )
    
    return RunnableSequence.from([
      {
        document_text: (input: { document_text: string }) => input.document_text,
        document_type: () => template.name,
        description: () => template.description,
        fields: () => template.fields.map((field: any) => 
          `- ${field.name}: ${field.description} (${field.required ? 'REQUIRED' : 'OPTIONAL'})
   Examples: ${field.examples.join(', ')}`
        ).join('\n'),
        examples: () => template.examples.join('\n'),
        format_instructions: () => formatInstructions
      },
      prompt,
      this.model,
      this.extractionParser
    ])
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