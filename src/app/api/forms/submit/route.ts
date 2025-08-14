import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { validateDS160Form, performPreSubmissionChecks } from '@/lib/form-validation'
import type { DS160FormData } from '@/lib/types/ceac'

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
      auto_validate = true,
      submission_reference 
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

    // Perform form validation if enabled
    let validationResult = null
    let preSubmissionChecks = null
    let formValidationStatus = 'pending'

    if (auto_validate && template.form_type === 'ds160') {
      try {
        validationResult = validateDS160Form(form_data as DS160FormData)
        preSubmissionChecks = performPreSubmissionChecks(form_data as DS160FormData)
        formValidationStatus = validationResult.isComplete ? 'validated' : 'flagged'
      } catch (validationError) {
        console.warn('Form validation failed:', validationError)
        // Continue without validation if it fails
      }
    }

    // Prepare submission data
    const submissionData = {
      user_id: user.id,
      form_template_id,
      form_data,
      extracted_data_summary,
      status: 'draft' as const,
      submission_reference: submission_reference || undefined,
      form_validation_status: formValidationStatus as any,
      pre_submission_checks: preSubmissionChecks,
      submission_attempt_count: 0
    }

    // Create form submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('form_submissions')
      .insert(submissionData)
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
      submission_reference: submission.submission_reference,
      validation_result: validationResult,
      pre_submission_checks: preSubmissionChecks,
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