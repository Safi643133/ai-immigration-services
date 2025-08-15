import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Simple Progress API
 * 
 * GET /api/ceac/simple-progress/[jobId] - Get current progress
 * POST /api/ceac/simple-progress/[jobId] - Update progress
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    // Get the CEAC job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('ceac_automation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        embassy_location: job.embassy_location,
        created_at: job.created_at,
        ceac_application_id: job.ceac_application_id,
        ceac_confirmation_id: job.ceac_confirmation_id,
        error_message: job.error_message
      },
      progress: {
        status: job.metadata?.status || 'pending',
        message: job.metadata?.message || 'Job created',
        captcha_image: job.metadata?.captcha_image || null,
        needs_captcha: job.metadata?.needs_captcha || false
      }
    })

  } catch (error) {
    console.error('Progress error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const { status, message, captcha_image, needs_captcha, captcha_solution } = await request.json()

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

    // Verify the job belongs to the user
    const { data: job, error: jobError } = await supabaseAdmin
      .from('ceac_automation_jobs')
      .select('metadata')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Update job metadata
    const updatedMetadata = {
      ...job.metadata,
      status,
      message,
      captcha_image,
      needs_captcha,
      captcha_solution,
      last_updated: new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin
      .from('ceac_automation_jobs')
      .update({
        metadata: updatedMetadata
      })
      .eq('id', jobId)

    if (updateError) {
      console.error('Error updating job:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully'
    })

  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
