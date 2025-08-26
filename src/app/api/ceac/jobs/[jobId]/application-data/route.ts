import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

interface RouteParams {
  params: Promise<{ jobId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params
    
    // Authenticate user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => cookies.forEach(cookie => cookieStore.set(cookie)),
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create admin client
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

    // Verify the job belongs to the user
    const { data: job, error: jobError } = await supabaseAdmin
      .from('ceac_automation_jobs')
      .select('id, user_id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Get application ID data
    const { data: applicationIdData, error: appIdError } = await supabaseAdmin
      .from('ceac_application_ids')
      .select('*')
      .eq('job_id', jobId)
      .single()

    // Get security answer data
    const { data: securityAnswerData, error: securityError } = await supabaseAdmin
      .from('ceac_security_answers')
      .select('*')
      .eq('job_id', jobId)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        applicationId: applicationIdData || null,
        securityAnswer: securityAnswerData || null
      }
    })

  } catch (error) {
    console.error('Application data API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
