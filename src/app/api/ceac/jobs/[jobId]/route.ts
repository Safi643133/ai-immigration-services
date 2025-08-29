import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import JobManager from '@/lib/queues'

/**
 * Individual CEAC Job Management API
 * 
 * GET /api/ceac/jobs/[jobId] - Get job details
 * DELETE /api/ceac/jobs/[jobId] - Cancel job
 * PATCH /api/ceac/jobs/[jobId] - Update job (for worker use)
 */

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

    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('ceac_automation_jobs')
      .select(`
        *,
        form_submissions!inner (
          id,
          form_data,
          form_templates (
            name,
            form_type
          )
        )
      `)
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Get job events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('ceac_job_events')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (eventsError) {
      console.warn('Failed to fetch job events:', eventsError)
    }

    // Get artifacts
    const { data: artifacts, error: artifactsError } = await supabaseAdmin
      .from('ceac_artifacts')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (artifactsError) {
      console.warn('Failed to fetch job artifacts:', artifactsError)
    }

    // Get queue status if job is active
    let queueStatus = null
    if (job.metadata?.queue_job_id && ['queued', 'running'].includes(job.status)) {
      try {
        const queueJob = await JobManager.getJobStatus(job.metadata.queue_job_id)
        if (queueJob) {
          queueStatus = {
            state: await queueJob.getState(),
            progress: queueJob.progress,
            attemptsMade: queueJob.attemptsMade,
            processedOn: queueJob.processedOn,
            finishedOn: queueJob.finishedOn,
            failedReason: queueJob.failedReason,
            data: queueJob.data,
            opts: queueJob.opts
          }
        }
      } catch (error) {
        console.warn(`Failed to get queue status for job ${jobId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        queueStatus,
        events: events || [],
        artifacts: artifacts || []
      }
    })

  } catch (error) {
    console.error('Get job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Get job details
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

    // Check if job can be cancelled
    if (!['queued', 'running'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Job cannot be cancelled in its current state' },
        { status: 400 }
      )
    }

    // Cancel queue job if it exists
    let queueCancelled = false
    if (job.metadata?.queue_job_id) {
      try {
        queueCancelled = await JobManager.cancelJob(job.metadata.queue_job_id)
      } catch (error) {
        console.warn(`Failed to cancel queue job ${job.metadata.queue_job_id}:`, error)
      }
    }

    // Update job status in database
    const { error: updateError } = await supabaseAdmin
      .from('ceac_automation_jobs')
      .update({
        status: 'cancelled',
        finished_at: new Date().toISOString(),
        error_message: 'Cancelled by user'
      })
      .eq('id', jobId)

    if (updateError) {
      console.error('Failed to update job status:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel job' },
        { status: 500 }
      )
    }

    // Log cancellation event
    await supabaseAdmin
      .from('ceac_job_events')
      .insert({
        job_id: jobId,
        event_type: 'job_cancelled',
        level: 'info',
        message: 'Job cancelled by user',
        metadata: {
          queue_cancelled: queueCancelled,
          cancelled_by: user.id
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
      queueCancelled
    })

  } catch (error) {
    console.error('Cancel job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params
    const body = await request.json()
    
    // This endpoint is primarily for worker updates
    // Check for worker authentication (could be API key or internal token)
    const workerAuth = request.headers.get('x-worker-auth')
    const expectedAuth = process.env.WORKER_AUTH_TOKEN
    
    if (!expectedAuth || workerAuth !== expectedAuth) {
      // Fall back to user authentication for status updates
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

    const {
      status,
      progress,
      ceac_application_id,
      ceac_confirmation_id,
      error_code,
      error_message,
      metadata,
      event
    } = body

    // Prepare update data
    const updateData: any = {}
    
    if (status) {
      updateData.status = status
      if (status === 'running' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString()
      }
      if (['completed', 'failed', 'cancelled'].includes(status)) {
        updateData.finished_at = new Date().toISOString()
      }
    }
    
    if (ceac_application_id) updateData.ceac_application_id = ceac_application_id
    if (ceac_confirmation_id) updateData.ceac_confirmation_id = ceac_confirmation_id
    if (error_code) updateData.error_code = error_code
    if (error_message) updateData.error_message = error_message
    
    if (metadata) {
      // Merge with existing metadata
      const { data: currentJob } = await supabaseAdmin
        .from('ceac_automation_jobs')
        .select('metadata')
        .eq('id', jobId)
        .single()
        
      updateData.metadata = {
        ...(currentJob?.metadata || {}),
        ...metadata,
        last_updated: new Date().toISOString()
      }
    }

    // Update job in database
    const { error: updateError } = await supabaseAdmin
      .from('ceac_automation_jobs')
      .update(updateData)
      .eq('id', jobId)

    if (updateError) {
      console.error('Failed to update job:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      )
    }

    // Log event if provided
    if (event) {
      await supabaseAdmin
        .from('ceac_job_events')
        .insert({
          job_id: jobId,
          event_type: event.type || 'job_updated',
          level: event.level || 'info',
          message: event.message || 'Job updated',
          metadata: {
            ...event.metadata,
            update_source: workerAuth ? 'worker' : 'user'
          }
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully'
    })

  } catch (error) {
    console.error('Update job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}