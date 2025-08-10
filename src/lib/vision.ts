import { TextractClient, DetectDocumentTextCommand, AnalyzeDocumentCommand } from '@aws-sdk/client-textract'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { PDFDocument } from 'pdf-lib'
import type { Document, ProcessingSession, ExtractedData } from './supabase'
import { initializeAgent, extractDocumentWithAgent } from '../agents'
import type { ExtractionContext, ExtractionResult } from '../agents/types/extraction'

// Initialize AWS Textract client
const textractClient = new TextractClient({
  region: process.env.AWS_REGION_NETLIFY || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_NETLIFY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_NETLIFY!,
  },
})

// Initialize Supabase clients
const createSupabaseClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

const createSupabaseAdmin = () => {
  return createClient(
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

export interface OCRResult {
  text: string
  confidence: number
  boundingBoxes: Array<{
    text: string
    bounds: Array<{ x: number; y: number }>
  }>
  forms?: Array<{
    key: string
    value: string
    confidence: number
  }>
}

// Using ExtractedField from agents/types/extraction.ts

export class DocumentProcessor {
  private supabase: any
  private supabaseAdmin: any
  private agentInitialized: boolean = false

  constructor() {
    this.supabase = null
    this.supabaseAdmin = createSupabaseAdmin()
  }

  private async initializeAgent() {
    if (!this.agentInitialized) {
      try {
        initializeAgent({
          model: 'gpt-4o-mini',
          temperature: 0.1,
          max_tokens: 4000,
          retry_attempts: 3,
          confidence_threshold: 0.7,
          enable_validation: true,
          enable_correction: true
        })
        this.agentInitialized = true
        console.log('LangChain agent initialized successfully')
      } catch (error) {
        console.error('Failed to initialize LangChain agent:', error)
        throw new Error('Agent initialization failed')
      }
    }
  }

  private async initSupabase() {
    if (!this.supabase) {
      this.supabase = await createSupabaseClient()
    }
  }

  async processDocument(documentId: string): Promise<void> {
    try {
      await this.initSupabase()

      // Get document details
      const { data: document, error: docError } = await this.supabaseAdmin
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (docError || !document) {
        throw new Error('Document not found')
      }

      console.log(`Processing document: ${document.filename} (${document.file_type})`)

      // Create processing session
      const { data: session, error: sessionError } = await this.supabaseAdmin
        .from('processing_sessions')
        .insert({
          document_id: documentId,
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) {
        throw sessionError
      }

      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await this.supabaseAdmin.storage
        .from('documents')
        .download(document.file_path)

      if (downloadError) {
        throw downloadError
      }

      // Convert file to buffer
      const buffer = await fileData.arrayBuffer()

      // Validate file format for AWS Textract
      if (!this.isSupportedFormat(document.file_type)) {
        throw new Error(`Unsupported file format: ${document.file_type}. AWS Textract supports: PDF, JPEG, PNG, TIFF`)
      }

      // Perform OCR using AWS Textract
      console.log('Starting OCR processing...')
      const ocrResult = await this.performOCR(Buffer.from(buffer), document.file_type)
      console.log(`OCR completed. Extracted ${ocrResult.text.length} characters with confidence: ${ocrResult.confidence}`)

      // Update processing session with OCR text
      await this.supabaseAdmin
        .from('processing_sessions')
        .update({ ocr_text: ocrResult.text })
        .eq('id', session.id)

      // Initialize LangChain agent if not already done
      await this.initializeAgent()

      // Extract structured data using LangChain agent
      const extractionContext: ExtractionContext = {
        document_category: document.document_category,
        document_text: ocrResult.text,
        file_type: document.file_type,
        filename: document.filename,
        user_id: document.user_id,
        document_id: documentId
      }

      console.log('Starting LangChain extraction...')
      const extractionResult: ExtractionResult = await extractDocumentWithAgent(extractionContext)
      console.log(`LangChain extraction completed. Extracted ${extractionResult.extracted_fields.length} fields`)

      // Save extracted data
      console.log(`Saving ${extractionResult.extracted_fields.length} extracted fields to database...`)
      for (const field of extractionResult.extracted_fields) {
        try {
          const { data: insertedData, error: insertError } = await this.supabaseAdmin
            .from('extracted_data')
            .insert({
              document_id: documentId,
              field_name: field.field_name,
              field_value: field.field_value,
              confidence_score: field.confidence_score,
              field_category: field.field_category,
              validation_status: field.validation_status || 'pending'
            })
            .select()

          if (insertError) {
            console.error(`Failed to insert field ${field.field_name}:`, insertError)
            throw insertError
          }

          console.log(`Successfully inserted field: ${field.field_name} = ${field.field_value}`)
        } catch (fieldError) {
          console.error(`Error inserting field ${field.field_name}:`, fieldError)
          throw fieldError
        }
      }
      console.log('All extracted data saved successfully')

      // Update document processing status
      await this.supabaseAdmin
        .from('documents')
        .update({ processing_status: 'completed' })
        .eq('id', documentId)

      // Update processing session
      await this.supabaseAdmin
        .from('processing_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id)

    } catch (error) {
      console.error('Document processing error:', error)

      // Update document status to failed
      await this.supabaseAdmin
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId)

      // Update processing session with error
      await this.supabaseAdmin
        .from('processing_sessions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('document_id', documentId)
    }
  }

  private isSupportedFormat(fileType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/tif'
    ]
    return supportedTypes.includes(fileType.toLowerCase())
  }

  private async performOCR(buffer: Buffer, fileType: string): Promise<OCRResult> {
    try {
      // For PDFs, we need to handle them differently
      if (fileType.toLowerCase() === 'application/pdf') {
        return await this.processPDF(buffer)
      }

      // For images, try form analysis first, then fallback to text detection
      try {
        const analyzeCommand = new AnalyzeDocumentCommand({
          Document: {
            Bytes: buffer
          },
          FeatureTypes: ['FORMS', 'TABLES']
        })

        const analyzeResult = await textractClient.send(analyzeCommand)
        
        if (analyzeResult.Blocks && analyzeResult.Blocks.length > 0) {
          // Extract text from blocks
          const textBlocks = analyzeResult.Blocks?.filter(block => block.BlockType === 'LINE') || []
          const fullText = textBlocks.map(block => block.Text).join(' ')
          
          // Extract form key-value pairs
          const forms: Array<{ key: string; value: string; confidence: number }> = []
          const keyMap = new Map()
          const valueMap = new Map()
          
          analyzeResult.Blocks?.forEach(block => {
            if (block.BlockType === 'KEY_VALUE_SET') {
              if (block.EntityTypes?.includes('KEY')) {
                const keyText = this.getTextFromBlock(block, analyzeResult.Blocks!)
                keyMap.set(block.Id, keyText)
              } else if (block.EntityTypes?.includes('VALUE')) {
                const valueText = this.getTextFromBlock(block, analyzeResult.Blocks!)
                valueMap.set(block.Id, valueText)
              }
            }
          })
          
          // Match keys and values
          analyzeResult.Blocks?.forEach(block => {
            if (block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')) {
              const keyText = keyMap.get(block.Id)
              const valueBlock = analyzeResult.Blocks?.find(b => 
                b.BlockType === 'KEY_VALUE_SET' && 
                b.EntityTypes?.includes('VALUE') &&
                b.Relationships?.some(rel => 
                  rel.Type === 'VALUE' && 
                  rel.Ids?.includes(block.Id!)
                )
              )
              
              if (valueBlock) {
                const valueText = valueMap.get(valueBlock.Id)
                const confidence = Math.min(
                  block.Confidence || 0,
                  valueBlock.Confidence || 0
                ) / 100
                
                forms.push({
                  key: keyText,
                  value: valueText,
                  confidence
                })
              }
            }
          })

          return {
            text: fullText,
            confidence: 0.9, // Textract is generally very accurate
            boundingBoxes: [],
            forms
          }
        }
      } catch (analyzeError) {
        console.log('Form analysis failed, falling back to text detection:', analyzeError)
      }

      // Fallback to simple text detection
      const detectCommand = new DetectDocumentTextCommand({
        Document: {
          Bytes: buffer
        }
      })

      const detectResult = await textractClient.send(detectCommand)
      
      if (!detectResult.Blocks || detectResult.Blocks.length === 0) {
        return {
          text: '',
          confidence: 0,
          boundingBoxes: []
        }
      }

      // Extract text from blocks
      const textBlocks = detectResult.Blocks.filter(block => block.BlockType === 'LINE')
      const fullText = textBlocks.map(block => block.Text).join(' ')
      
      // Calculate average confidence
      const confidences = textBlocks.map(block => block.Confidence || 0)
      const avgConfidence = confidences.length > 0 
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length / 100
        : 0

      // Extract bounding boxes
      const boundingBoxes = textBlocks.map(block => ({
        text: block.Text || '',
        bounds: block.Geometry?.BoundingBox ? [
          { x: block.Geometry.BoundingBox.Left || 0, y: block.Geometry.BoundingBox.Top || 0 },
          { x: (block.Geometry.BoundingBox.Left || 0) + (block.Geometry.BoundingBox.Width || 0), y: block.Geometry.BoundingBox.Top || 0 },
          { x: (block.Geometry.BoundingBox.Left || 0) + (block.Geometry.BoundingBox.Width || 0), y: (block.Geometry.BoundingBox.Top || 0) + (block.Geometry.BoundingBox.Height || 0) },
          { x: block.Geometry.BoundingBox.Left || 0, y: (block.Geometry.BoundingBox.Top || 0) + (block.Geometry.BoundingBox.Height || 0) }
        ] : []
      }))

      return {
        text: fullText,
        confidence: avgConfidence,
        boundingBoxes
      }
    } catch (error) {
      console.error('OCR error:', error)
      
      // Provide more specific error messages
      if (error && typeof error === 'object' && 'name' in error) {
        const errorName = (error as any).name
        if (errorName === 'UnsupportedDocumentException') {
          if (fileType.toLowerCase() === 'application/pdf') {
            throw new Error('PDF processing failed. This might be a scanned PDF or corrupted file. Please ensure the PDF is readable and not password-protected.')
          } else {
            throw new Error(`Unsupported document format. AWS Textract supports: PDF, JPEG, PNG, TIFF. Your file type: ${fileType}`)
          }
        } else if (errorName === 'DocumentTooLargeException') {
          throw new Error('Document is too large. Maximum size for synchronous operations is 5MB.')
        } else if (errorName === 'BadDocumentException') {
          throw new Error('Document is corrupted or unreadable. Please try with a different file.')
        }
      }
      
      throw new Error('Failed to perform OCR')
    }
  }

  private async processPDF(buffer: Buffer): Promise<OCRResult> {
    try {
      // First, try to extract text directly from PDF (for text-based PDFs)
      const textResult = await this.extractTextFromPDF(buffer)
      
      if (textResult.text && textResult.text.trim().length > 0) {
        // If we got text, this is likely a text-based PDF
        return textResult
      }
      
      // If no text extracted, this is likely a scanned PDF
      // Convert PDF to images and process each page
      return await this.processScannedPDF(buffer)
      
    } catch (error) {
      console.error('PDF processing error:', error)
      
      // If direct text extraction fails, try as scanned PDF
      try {
        return await this.processScannedPDF(buffer)
      } catch (scanError) {
        console.error('Scanned PDF processing also failed:', scanError)
        throw new Error('Failed to process PDF. The document may be corrupted or in an unsupported format.')
      }
    }
  }

  private async extractTextFromPDF(buffer: Buffer): Promise<OCRResult> {
    try {
      // Try to extract text directly using Textract
      const detectCommand = new DetectDocumentTextCommand({
        Document: {
          Bytes: buffer
        }
      })

      const detectResult = await textractClient.send(detectCommand)
      
      if (!detectResult.Blocks || detectResult.Blocks.length === 0) {
        return {
          text: '',
          confidence: 0,
          boundingBoxes: []
        }
      }

      // Extract text from blocks
      const textBlocks = detectResult.Blocks.filter(block => block.BlockType === 'LINE')
      const fullText = textBlocks.map(block => block.Text).join(' ')
      
      // Calculate average confidence
      const confidences = textBlocks.map(block => block.Confidence || 0)
      const avgConfidence = confidences.length > 0 
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length / 100
        : 0

      return {
        text: fullText,
        confidence: avgConfidence,
        boundingBoxes: []
      }
    } catch (error) {
      // If Textract fails, return empty result to trigger scanned PDF processing
      return {
        text: '',
        confidence: 0,
        boundingBoxes: []
      }
    }
  }

  private async processScannedPDF(buffer: Buffer): Promise<OCRResult> {
    try {
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(buffer)
      const pageCount = pdfDoc.getPageCount()
      
      if (pageCount === 0) {
        throw new Error('PDF has no pages')
      }

      let allText = ''
      let totalConfidence = 0
      let processedPages = 0

      // Process each page
      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        try {
          // Create a new PDF with just this page
          const singlePagePdf = await PDFDocument.create()
          const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [pageIndex])
          singlePagePdf.addPage(copiedPage)
          
          // Convert to buffer
          const pageBuffer = Buffer.from(await singlePagePdf.save())
          
          // Try to process as image using Textract
          const pageResult = await this.processPageAsImage(pageBuffer)
          
          if (pageResult.text) {
            allText += pageResult.text + '\n'
            totalConfidence += pageResult.confidence
            processedPages++
          }
          
        } catch (pageError) {
          console.error(`Error processing page ${pageIndex + 1}:`, pageError)
          // Continue with next page
        }
      }

      if (processedPages === 0) {
        throw new Error('Failed to process any pages of the PDF')
      }

      const avgConfidence = totalConfidence / processedPages

      return {
        text: allText.trim(),
        confidence: avgConfidence,
        boundingBoxes: []
      }
      
    } catch (error) {
      console.error('Scanned PDF processing error:', error)
      throw error
    }
  }

  private async processPageAsImage(buffer: Buffer): Promise<OCRResult> {
    try {
      // Try form analysis first for better results
      const analyzeCommand = new AnalyzeDocumentCommand({
        Document: {
          Bytes: buffer
        },
        FeatureTypes: ['FORMS', 'TABLES']
      })

      const analyzeResult = await textractClient.send(analyzeCommand)
      
      if (analyzeResult.Blocks && analyzeResult.Blocks.length > 0) {
        // Extract text from blocks
        const textBlocks = analyzeResult.Blocks?.filter(block => block.BlockType === 'LINE') || []
        const fullText = textBlocks.map(block => block.Text).join(' ')
        
        // Extract form key-value pairs
        const forms: Array<{ key: string; value: string; confidence: number }> = []
        const keyMap = new Map()
        const valueMap = new Map()
        
        analyzeResult.Blocks?.forEach(block => {
          if (block.BlockType === 'KEY_VALUE_SET') {
            if (block.EntityTypes?.includes('KEY')) {
              const keyText = this.getTextFromBlock(block, analyzeResult.Blocks!)
              keyMap.set(block.Id, keyText)
            } else if (block.EntityTypes?.includes('VALUE')) {
              const valueText = this.getTextFromBlock(block, analyzeResult.Blocks!)
              valueMap.set(block.Id, valueText)
            }
          }
        })
        
        // Match keys and values
        analyzeResult.Blocks?.forEach(block => {
          if (block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')) {
            const keyText = keyMap.get(block.Id)
            const valueBlock = analyzeResult.Blocks?.find(b => 
              b.BlockType === 'KEY_VALUE_SET' && 
              b.EntityTypes?.includes('VALUE') &&
              b.Relationships?.some(rel => 
                rel.Type === 'VALUE' && 
                rel.Ids?.includes(block.Id!)
              )
            )
            
            if (valueBlock) {
              const valueText = valueMap.get(valueBlock.Id)
              const confidence = Math.min(
                block.Confidence || 0,
                valueBlock.Confidence || 0
              ) / 100
              
              forms.push({
                key: keyText,
                value: valueText,
                confidence
              })
            }
          }
        })

        return {
          text: fullText,
          confidence: 0.9,
          boundingBoxes: [],
          forms
        }
      }
    } catch (analyzeError) {
      console.log('Form analysis failed for page, falling back to text detection:', analyzeError)
    }

    // Fallback to simple text detection
    const detectCommand = new DetectDocumentTextCommand({
      Document: {
        Bytes: buffer
      }
    })

    const detectResult = await textractClient.send(detectCommand)
    
    if (!detectResult.Blocks || detectResult.Blocks.length === 0) {
      return {
        text: '',
        confidence: 0,
        boundingBoxes: []
      }
    }

    // Extract text from blocks
    const textBlocks = detectResult.Blocks.filter(block => block.BlockType === 'LINE')
    const fullText = textBlocks.map(block => block.Text).join(' ')
    
    // Calculate average confidence
    const confidences = textBlocks.map(block => block.Confidence || 0)
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length / 100
      : 0

    return {
      text: fullText,
      confidence: avgConfidence,
      boundingBoxes: []
    }
  }

  private getTextFromBlock(block: any, allBlocks: any[]): string {
    if (block.Text) {
      return block.Text
    }
    
    if (block.Relationships) {
      const textBlocks = block.Relationships
        .filter((rel: any) => rel.Type === 'CHILD')
        .flatMap((rel: any) => rel.Ids)
        .map((id: string) => allBlocks.find(b => b.Id === id))
        .filter((b: any) => b && b.BlockType === 'WORD')
        .map((b: any) => b.Text)
      
      return textBlocks.join(' ')
    }
    
    return ''
  }

  // All regex-based extraction methods have been removed
  // Now using LangChain agent for intelligent field extraction
}

export const documentProcessor = new DocumentProcessor() 