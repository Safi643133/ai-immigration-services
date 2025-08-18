/**
 * Job-Specific Progress API Routes
 * 
 * GET /api/ceac/progress/[jobId] - Get progress for specific job
 * POST /api/ceac/progress/[jobId] - Update progress for specific job
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ProgressService } from '@/lib/progress/progress-service'
import type { ProgressUpdate } from '@/lib/progress/progress-types'

const progressService = new ProgressService()

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

    // Verify the job belongs to the user
    const { data: job, error: jobError } = await supabase
      .from('ceac_automation_jobs')
      .select('id, user_id, status, embassy_location')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('includeHistory') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    try {
      // Get progress summary
      const summary = await progressService.getProgressSummary(jobId)
      
      let history: ProgressUpdate[] = []
      if (includeHistory) {
        history = await progressService.getProgressHistory(jobId)
        history = history.slice(-limit) // Get latest updates
      }

      return NextResponse.json({
        success: true,
        data: {
          job: {
            id: job.id,
            status: job.status,
            embassy_location: job.embassy_location
          },
          summary,
          history: includeHistory ? history : undefined
        }
      })
    } catch (error) {
      console.error('Error getting job progress:', error)
      return NextResponse.json(
        { error: 'Failed to get job progress' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Job progress API error:', error)
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

    // Verify the job belongs to the user
    const { data: job, error: jobError } = await supabase
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

    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.step_name || !body.status || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: step_name, status, message' },
        { status: 400 }
      )
    }

    // Update progress
    const progressUpdate = await progressService.updateProgress(jobId, {
      step_name: body.step_name,
      status: body.status,
      message: body.message,
      progress_percentage: body.progress_percentage,
      captcha_image: body.captcha_image,
      needs_captcha: body.needs_captcha,
      captcha_solution: body.captcha_solution,
      metadata: body.metadata
    })

    return NextResponse.json({
      success: true,
      data: progressUpdate
    })

  } catch (error) {
    console.error('Job progress API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

