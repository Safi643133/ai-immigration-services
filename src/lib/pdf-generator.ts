import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, rgb, StandardFonts } from 'pdf-lib'

export interface FormFieldData {
  [key: string]: string | boolean | number
}

export interface PDFFormTemplate {
  id: string
  name: string
  fields: PDFFieldMapping[]
  layout: PDFLayout
}

export interface PDFFieldMapping {
  fieldId: string // Form field ID like "personal.full_name"
  pdfFieldName: string // PDF field name like "1A" or "full_name"
  fieldType: 'text' | 'checkbox' | 'date' | 'select'
  required: boolean
  maxLength?: number
  validation?: string
}

export interface PDFLayout {
  sections: PDFSection[]
  styling: PDFStyling
}

export interface PDFSection {
  title: string
  fields: PDFFieldMapping[]
  layout: 'single' | 'two-column' | 'three-column'
}

export interface PDFStyling {
  fontSize: number
  fontFamily: string
  primaryColor: any
  secondaryColor: any
}

export class PDFFormGenerator {
  private defaultStyling: PDFStyling = {
    fontSize: 12,
    fontFamily: 'Helvetica',
    primaryColor: rgb(0, 0, 0),
    secondaryColor: rgb(0.5, 0.5, 0.5)
  }

  async generateFormPDF(
    formData: FormFieldData,
    template: PDFFormTemplate,
    extractedDataSummary?: any
  ): Promise<Buffer> {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([612, 792]) // Standard US Letter size
      
      // Embed font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      
      // Add title
      this.addTitle(page, template.name, font)
      
      // Add form fields
      this.addFormFields(page, formData, template, font)
      
      // Add extracted data summary if provided
      if (extractedDataSummary) {
        this.addExtractedDataSummary(page, extractedDataSummary, font)
      }
      
      // Add footer with timestamp
      this.addFooter(page, font)
      
      // Convert to buffer
      const pdfBytes = await pdfDoc.save()
      return Buffer.from(pdfBytes)
      
    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error('Failed to generate PDF form')
    }
  }

  private addTitle(page: any, title: string, font: any) {
    const { width, height } = page.getSize()
    const fontSize = 18
    
    page.drawText(title, {
      x: 50,
      y: height - 50,
      size: fontSize,
      font: font,
      color: this.defaultStyling.primaryColor
    })
  }

  private addFormFields(
    page: any,
    formData: FormFieldData,
    template: PDFFormTemplate,
    font: any
  ) {
    let currentY = 700 // Start below title
    const margin = 50
    const lineSpacing = 35 // Increased spacing
    
    for (const section of template.layout.sections) {
      // Add section title
      currentY = this.addSectionTitle(page, section.title, currentY, font)
      
      // Add fields in this section
      for (const fieldMapping of section.fields) {
        const fieldValue = formData[fieldMapping.fieldId] || ''
        
        currentY = this.addFormField(
          page,
          fieldMapping,
          fieldValue.toString(),
          currentY,
          margin,
          font
        )
        
        currentY -= lineSpacing
        
        // Check if we need a new page
        if (currentY < 150) { // Increased threshold to prevent overlap with summary
          page = this.addNewPage(page)
          currentY = 700
        }
      }
      
      currentY -= 30 // Extra spacing between sections
    }
  }

  private addSectionTitle(page: any, title: string, y: number, font: any): number {
    const fontSize = 14
    
    page.drawText(title, {
      x: 50,
      y: y,
      size: fontSize,
      font: font,
      color: this.defaultStyling.primaryColor
    })
    
    return y - 25
  }

  private addFormField(
    page: any,
    fieldMapping: PDFFieldMapping,
    value: string,
    y: number,
    margin: number,
    font: any
  ): number {
    const labelFontSize = 10
    const valueFontSize = 11
    
    // Format field name for better readability
    const fieldName = fieldMapping.pdfFieldName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    
    // Draw field label
    page.drawText(`${fieldName}:`, {
      x: margin,
      y: y,
      size: labelFontSize,
      font: font,
      color: this.defaultStyling.secondaryColor
    })
    
    // Draw field value with word wrapping for long values
    const maxWidth = 300
    const words = value.split(' ')
    let currentLine = ''
    let lineY = y
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      if (testLine.length * 6 > maxWidth && currentLine) { // Rough character width estimation
        // Draw current line
        page.drawText(currentLine, {
          x: margin + 150,
          y: lineY,
          size: valueFontSize,
          font: font,
          color: this.defaultStyling.primaryColor
        })
        lineY -= 15
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    
    // Draw the last line
    if (currentLine) {
      page.drawText(currentLine, {
        x: margin + 150,
        y: lineY,
        size: valueFontSize,
        font: font,
        color: this.defaultStyling.primaryColor
      })
    }
    
    return lineY - 5 // Return the final Y position
  }

  private addExtractedDataSummary(page: any, extractedData: any, font: any) {
    let currentY = 150 // Start from bottom of page with more space
    
    // Add a separator line
    page.drawText('-'.repeat(80), {
      x: 50,
      y: currentY + 10,
      size: 12,
      font: font,
      color: this.defaultStyling.secondaryColor
    })
    
    currentY -= 10
    
    page.drawText('EXTRACTED DATA SUMMARY:', {
      x: 50,
      y: currentY,
      size: 14,
      font: font,
      color: this.defaultStyling.primaryColor
    })
    
    currentY -= 25
    
    if (Array.isArray(extractedData)) {
      for (const data of extractedData) {
        // Check if we need a new page
        if (currentY < 100) {
          page = this.addNewPage(page)
          currentY = 700
          
          // Add header to new page
          page.drawText('EXTRACTED DATA SUMMARY (continued):', {
            x: 50,
            y: currentY,
            size: 12,
            font: font,
            color: this.defaultStyling.primaryColor
          })
          currentY -= 20
        }
        
        // Format the field name for better readability
        const fieldName = data.field_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        
        page.drawText(`${fieldName}:`, {
          x: 70,
          y: currentY,
          size: 10,
          font: font,
          color: this.defaultStyling.primaryColor
        })
        
        currentY -= 15
        
        page.drawText(`${data.field_value} (${Math.round(data.confidence_score * 100)}% confidence)`, {
          x: 90,
          y: currentY,
          size: 9,
          font: font,
          color: this.defaultStyling.secondaryColor
        })
        
        currentY -= 20 // More spacing between items
      }
    }
  }

  private addFooter(page: any, font: any) {
    const { width, height } = page.getSize()
    const timestamp = new Date().toLocaleString()
    
    page.drawText(`Generated on: ${timestamp}`, {
      x: 50,
      y: 50,
      size: 8,
      font: font,
      color: this.defaultStyling.secondaryColor
    })
  }

  private addNewPage(currentPage: any): any {
    const pdfDoc = currentPage.doc
    return pdfDoc.addPage([612, 792])
  }

  // Method to create a template from existing form structure
  createTemplateFromFormStructure(formFields: any): PDFFormTemplate {
    const sections: PDFSection[] = []
    
    // Convert form fields structure to PDF template
    if (formFields && typeof formFields === 'object') {
      Object.entries(formFields).forEach(([sectionName, sectionFields]) => {
        if (sectionFields && typeof sectionFields === 'object') {
          const fields: PDFFieldMapping[] = []
          
          Object.entries(sectionFields as any).forEach(([fieldName, fieldConfig]) => {
            fields.push({
              fieldId: `${sectionName}.${fieldName}`,
              pdfFieldName: fieldName.replace(/_/g, ' ').toUpperCase(),
              fieldType: (fieldConfig as any).type || 'text',
              required: (fieldConfig as any).required || false,
              maxLength: (fieldConfig as any).maxLength,
              validation: (fieldConfig as any).validation
            })
          })
          
          sections.push({
            title: sectionName.replace(/_/g, ' ').toUpperCase(),
            fields,
            layout: 'single'
          })
        }
      })
    }
    
    return {
      id: 'generated-template',
      name: 'Immigration Form',
      fields: sections.flatMap(s => s.fields),
      layout: {
        sections,
        styling: this.defaultStyling
      }
    }
  }
}

export const pdfFormGenerator = new PDFFormGenerator() 