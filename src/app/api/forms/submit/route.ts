import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
    const { form_template_id, form_data, extracted_data_summary } = await request.json()

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

    // Verify form template exists
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

    // Create form submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('form_submissions')
      .insert({
        user_id: user.id,
        form_template_id,
        form_data,
        extracted_data_summary,
        status: 'draft'
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      return NextResponse.json(
        { error: 'Failed to save form submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      submission_id: submission.id,
      message: 'Form saved successfully'
    })

  } catch (error) {
    console.error('Submit form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 