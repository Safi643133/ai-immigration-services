import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { pdfFormGenerator } from '@/lib/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    // Get the current user using server-side auth
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const { 
      form_template_id, 
      form_data, 
      extracted_data_summary,
      filename = 'immigration-form.pdf'
    } = await request.json()

    if (!form_template_id || !form_data) {
      return NextResponse.json(
        { error: 'Form template ID and form data are required' },
        { status: 400 }
      )
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get form template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('form_templates')
      .select('*')
      .eq('id', form_template_id)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Form template not found' },
        { status: 404 }
      )
    }

    // Create PDF template from form structure
    const pdfTemplate = pdfFormGenerator.createTemplateFromFormStructure(template.fields)
    pdfTemplate.name = template.name || 'Immigration Form'

    // Generate PDF
    const pdfBuffer = await pdfFormGenerator.generateFormPDF(
      form_data,
      pdfTemplate,
      extracted_data_summary
    )

    // Save submission to database
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('form_submissions')
      .insert({
        user_id: user.id,
        form_template_id,
        form_data,
        extracted_data_summary,
        status: 'exported'
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Error saving submission:', submissionError)
      // Continue anyway, don't fail the PDF generation
    }

    // Return PDF as response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the current user using server-side auth
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get submission ID from query params
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get submission and template
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('form_submissions')
      .select(`
        *,
        form_templates (*)
      `)
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    const template = submission.form_templates

    // Create PDF template from form structure
    const pdfTemplate = pdfFormGenerator.createTemplateFromFormStructure(template.fields)
    pdfTemplate.name = template.name || 'Immigration Form'

    // Generate PDF
    const pdfBuffer = await pdfFormGenerator.generateFormPDF(
      submission.form_data,
      pdfTemplate,
      submission.extracted_data_summary
    )

    // Return PDF as response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${template.name || 'form'}-${submissionId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
} 