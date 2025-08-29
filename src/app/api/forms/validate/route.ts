import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateDS160Form, performPreSubmissionChecks, getFormCompletionPercentage } from '@/lib/form-validation'
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
    const { form_data, form_type = 'ds160', include_pre_submission_checks = false } = await request.json()

    if (!form_data) {
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      )
    }

    let validationResult
    let preSubmissionChecks = null
    let completionPercentage = 0

    // Validate based on form type
    switch (form_type) {
      case 'ds160':
        validationResult = validateDS160Form(form_data as DS160FormData)
        completionPercentage = getFormCompletionPercentage(form_data as DS160FormData)
        
        if (include_pre_submission_checks) {
          preSubmissionChecks = performPreSubmissionChecks(form_data as DS160FormData)
        }
        break
        
      default:
        return NextResponse.json(
          { error: `Validation not supported for form type: ${form_type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      validation_result: validationResult,
      completion_percentage: completionPercentage,
      pre_submission_checks: preSubmissionChecks,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Form validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for validation rules and requirements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formType = searchParams.get('form_type') || 'ds160'
    const step = searchParams.get('step')

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

    // Return validation requirements based on form type
    const validationInfo = {
      ds160: {
        total_steps: 17,
        required_fields_per_step: {
          1: ['surnames', 'given_names', 'sex', 'date_of_birth', 'place_of_birth_city', 'place_of_birth_country'],
          2: ['nationality', 'other_nationalities', 'permanent_resident_other_country'],
          // Add more steps as needed
        },
        conditional_fields: {
          'other_names_used': {
            condition: 'Yes',
            required_fields: ['other_surnames_used', 'other_given_names_used']
          },
          'telecode_name': {
            condition: 'Yes',
            required_fields: ['telecode_surnames', 'telecode_given_names']
          }
        },
        validation_rules: {
          'date_of_birth': 'Must be a valid date in the past',
          'email': 'Must be a valid email format',
          'phone': 'Must be a valid phone number format'
        }
      }
    }

    const formValidationInfo = validationInfo[formType as keyof typeof validationInfo]
    
    if (!formValidationInfo) {
      return NextResponse.json(
        { error: `Validation info not available for form type: ${formType}` },
        { status: 400 }
      )
    }

    // If specific step requested, return only that step's info
    if (step) {
      const stepNumber = parseInt(step)
      const stepKey = stepNumber as keyof typeof formValidationInfo.required_fields_per_step
      const stepInfo = {
        step: stepNumber,
        required_fields: formValidationInfo.required_fields_per_step[stepKey] || [],
        conditional_fields: formValidationInfo.conditional_fields,
        validation_rules: formValidationInfo.validation_rules
      }
      
      return NextResponse.json({
        success: true,
        step_validation_info: stepInfo
      })
    }

    return NextResponse.json({
      success: true,
      form_validation_info: formValidationInfo
    })

  } catch (error) {
    console.error('Get validation info error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
