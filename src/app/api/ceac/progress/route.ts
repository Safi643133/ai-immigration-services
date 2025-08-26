/**
 * Progress API Routes
 * 
 * GET /api/ceac/progress - Get progress summaries for user
 * POST /api/ceac/progress - Create a new progress update
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ProgressService } from '@/lib/progress/progress-service'
import type { CreateProgressUpdateRequest } from '@/lib/progress/progress-types'

const progressService = new ProgressService()

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const stream = searchParams.get('stream') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // If streaming is requested and jobId is provided
    if (stream && jobId) {
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

      // Create SSE stream
      const streamResponse = new ReadableStream({
        async start(controller) {
          let lastUpdateTime = new Date(0)
          let isActive = true

          // Send initial progress
          try {
            const summary = await progressService.getProgressSummary(jobId)
            const history = await progressService.getProgressHistory(jobId)
            
            const initialData = {
              type: 'progress_update',
              data: {
                summary,
                history: history.slice(offset, offset + limit),
                total: history.length,
                timestamp: new Date().toISOString()
              }
            }
            
            controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`)
          } catch (error) {
            console.error('Error sending initial progress:', error)
          }

          // Watch for progress updates
          const checkProgress = async () => {
            if (!isActive) return

            try {
              const summary = await progressService.getProgressSummary(jobId)
              const history = await progressService.getProgressHistory(jobId)
              
              // Check if there are new updates
              const latestUpdate = history[history.length - 1]
              if (latestUpdate && new Date(latestUpdate.created_at) > lastUpdateTime) {
                lastUpdateTime = new Date(latestUpdate.created_at)
                
                const updateData = {
                  type: 'progress_update',
                  data: {
                    summary,
                    history: history.slice(offset, offset + limit),
                    total: history.length,
                    timestamp: new Date().toISOString()
                  }
                }
                
                controller.enqueue(`data: ${JSON.stringify(updateData)}\n\n`)
              }

              // Check if job is completed or failed
              if (summary.current_status === 'completed' || summary.current_status === 'failed') {
                const finalData = {
                  type: 'job_completed',
                  data: {
                    summary,
                    history: history.slice(offset, offset + limit),
                    total: history.length,
                    timestamp: new Date().toISOString()
                  }
                }
                
                controller.enqueue(`data: ${JSON.stringify(finalData)}\n\n`)
                isActive = false
                controller.close()
                return
              }
            } catch (error) {
              console.error('Error checking progress:', error)
            }

            // Schedule next check
            if (isActive) {
              setTimeout(checkProgress, 2000) // Check every 2 seconds
            }
          }

          // Start monitoring
          setTimeout(checkProgress, 2000)

          // Handle client disconnect
          request.signal.addEventListener('abort', () => {
            isActive = false
            controller.close()
          })
        }
      })

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        }
      })
    }

    // Regular API response (non-streaming)
    if (jobId) {
      // Get specific job progress
      try {
        const summary = await progressService.getProgressSummary(jobId)
        const history = await progressService.getProgressHistory(jobId)
        
        return NextResponse.json({
          success: true,
          data: {
            summary,
            history: history.slice(offset, offset + limit),
            total: history.length
          }
        })
      } catch (error) {
        console.error('Error getting job progress:', error)
        return NextResponse.json(
          { error: 'Failed to get job progress' },
          { status: 500 }
        )
      }
    } else {
      // Get all user's job progress summaries
      try {
        // Get user's CEAC jobs
        const { data: jobs, error: jobsError } = await supabase
          .from('ceac_automation_jobs')
          .select('id, status, created_at, embassy_location')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (jobsError) {
          throw jobsError
        }

        // Get progress summaries for each job
        const progressSummaries = await Promise.all(
          jobs.map(async (job) => {
            try {
              const summary = await progressService.getProgressSummary(job.id)
              return {
                job_status: job.status,
                embassy_location: job.embassy_location,
                created_at: job.created_at,
                ...summary
              }
            } catch (error) {
              console.error(`Error getting progress for job ${job.id}:`, error)
              return {
                job_status: job.status,
                embassy_location: job.embassy_location,
                created_at: job.created_at,
                current_step: 'unknown',
                current_status: 'unknown',
                progress_percentage: 0,
                total_steps: 17,
                completed_steps: 0,
                last_update: job.created_at,
                needs_captcha: false
              }
            }
          })
        )

        return NextResponse.json({
          success: true,
          data: {
            summaries: progressSummaries,
            total: jobs.length
          }
        })
      } catch (error) {
        console.error('Error getting user progress:', error)
        return NextResponse.json(
          { error: 'Failed to get user progress' },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('Progress API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body: CreateProgressUpdateRequest = await request.json()
    
    // Validate required fields
    if (!body.job_id || !body.step_name || !body.status || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: job_id, step_name, status, message' },
        { status: 400 }
      )
    }

    // Verify the job belongs to the user
    const { data: job, error: jobError } = await supabase
      .from('ceac_automation_jobs')
      .select('id, user_id')
      .eq('id', body.job_id)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Create progress update
    const progressUpdate = await progressService.createProgressUpdate({
      job_id: body.job_id,
      user_id: user.id,
      step_name: body.step_name,
      status: body.status,
      message: body.message,
      progress_percentage: body.progress_percentage,
      captcha_image: body.captcha_image,
      needs_captcha: body.needs_captcha || false,
      metadata: body.metadata || {}
    })

    return NextResponse.json({
      success: true,
      data: progressUpdate
    })

  } catch (error) {
    console.error('Progress API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

