import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import JobManager, { type CeacSubmissionJobData } from '@/lib/queues'
import { validateDS160Form, performPreSubmissionChecks } from '@/lib/form-validation'
import type { DS160FormData } from '@/lib/types/ceac'

/**
 * CEAC Job Management API
 * 
 * POST /api/ceac/jobs - Create a new CEAC submission job
 * GET /api/ceac/jobs - Get user's jobs
 */

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

    const body = await request.json()
    const { submissionId, embassy, priority = 1, auto_validate = true } = body

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

    // Get the form submission
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
        { error: 'Form submission not found or access denied' },
        { status: 404 }
      )
    }

    // Validate form type
    if (submission.form_templates.form_type !== 'ds160') {
      return NextResponse.json(
        { error: 'Only DS-160 forms are supported for CEAC submission' },
        { status: 400 }
      )
    }

    // Check for existing active jobs for this submission and fail them
    const { data: existingJobs, error: existingJobsError } = await supabaseAdmin
      .from('ceac_automation_jobs')
      .select('id, status, created_at, embassy_location')
      .eq('submission_id', submissionId)
      .eq('user_id', user.id)
      .in('status', ['queued', 'running'])
      .order('created_at', { ascending: false })

    if (existingJobsError) {
      console.error('Error checking existing jobs:', existingJobsError)
      return NextResponse.json(
        { error: 'Failed to check existing jobs' },
        { status: 500 }
      )
    }

    // Fail any existing active jobs
    if (existingJobs && existingJobs.length > 0) {
      console.log(`🔄 Found ${existingJobs.length} existing active job(s) for submission ${submissionId}, failing them...`)
      
      // Update all existing active jobs to failed status
      const jobIds = existingJobs.map(job => job.id)
      await supabaseAdmin
        .from('ceac_automation_jobs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_code: 'SUPERSEDED',
          error_message: 'Job superseded by new submission request'
        })
        .in('id', jobIds)

      // Log events for failed jobs
      for (const job of existingJobs) {
        await supabaseAdmin
          .from('ceac_job_events')
          .insert({
            job_id: job.id,
            event_type: 'job_failed',
            level: 'info',
            message: 'Job superseded by new submission request',
            metadata: {
              superseded_by: 'new_submission',
              submission_id: submissionId
            }
          })
      }

      console.log(`✅ Failed ${existingJobs.length} existing job(s) for submission ${submissionId}`)
    }

    // Perform validation if requested
    let validationResult = null
    let preSubmissionChecks = null
    
    if (auto_validate) {
      try {
        validationResult = validateDS160Form(submission.form_data as DS160FormData)
        preSubmissionChecks = performPreSubmissionChecks(submission.form_data as DS160FormData)
        
        if (!validationResult.readinessForSubmission) {
          return NextResponse.json(
            { 
              error: 'Form validation failed', 
              validation: validationResult,
              preSubmissionChecks 
            },
            { status: 400 }
          )
        }
      } catch (validationError) {
        console.error('Validation error:', validationError)
        return NextResponse.json(
          { error: 'Form validation failed' },
          { status: 400 }
        )
      }
    }

    // Generate unique idempotency key
    const idempotencyKey = `${submissionId}-${user.id}-${Date.now()}`

    // Create CEAC automation job record
    const { data: ceacJob, error: jobError } = await supabaseAdmin
      .from('ceac_automation_jobs')
      .insert({
        user_id: user.id,
        submission_id: submissionId,
        status: 'queued',
        embassy_location: embassy || 'Not specified',
        priority: Math.max(1, Math.min(10, priority)),
        idempotency_key: idempotencyKey,
        metadata: {
          validation_result: validationResult,
          pre_submission_checks: preSubmissionChecks,
          created_via: 'api',
          user_agent: request.headers.get('user-agent') || 'unknown'
        }
      })
      .select()
      .single()

    if (jobError) {
      console.error('Database job creation error:', jobError)
      return NextResponse.json(
        { error: 'Failed to create job record' },
        { status: 500 }
      )
    }

    // Prepare job data for queue
    const jobData: CeacSubmissionJobData = {
      submissionId,
      userId: user.id,
      formData: submission.form_data,
      embassy: embassy || 'Not specified',
      priority,
      idempotencyKey,
      jobId: ceacJob.id,
      ceacVersion: '2025.01'
    }

    // Add job to queue
    const queueJob = await JobManager.submitToCeac(jobData)

    // Update database with queue job ID
    await supabaseAdmin
      .from('ceac_automation_jobs')
      .update({
        metadata: {
          ...ceacJob.metadata,
          queue_job_id: queueJob.id
        }
      })
      .eq('id', ceacJob.id)

    // Log job creation event
    await supabaseAdmin
      .from('ceac_job_events')
      .insert({
        job_id: ceacJob.id,
        event_type: 'job_created',
        level: 'info',
        message: 'CEAC submission job created and queued',
        metadata: {
          queue_job_id: queueJob.id,
          priority,
          embassy
        }
      })

    return NextResponse.json({
      success: true,
      job: {
        id: ceacJob.id,
        queueJobId: queueJob.id,
        status: 'queued',
        submissionId,
        embassy,
        priority,
        createdAt: ceacJob.created_at,
        idempotencyKey
      },
      validation: validationResult,
      preSubmissionChecks
    })

  } catch (error) {
    console.error('CEAC job creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // Build query
    let query = supabaseAdmin
      .from('ceac_automation_jobs')
      .select(`
        *,
        form_submissions!inner (
          id,
          form_templates (
            name,
            form_type
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: jobs, error: jobsError } = await query

    if (jobsError) {
      console.error('Jobs query error:', jobsError)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    // Get queue status for active jobs
    const jobsWithQueueStatus = await Promise.all(
      jobs.map(async (job) => {
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
                failedReason: queueJob.failedReason
              }
            }
          } catch (error) {
            console.warn(`Failed to get queue status for job ${job.id}:`, error)
          }
        }

        return {
          ...job,
          queueStatus
        }
      })
    )

    return NextResponse.json({
      success: true,
      jobs: jobsWithQueueStatus,
      pagination: {
        limit,
        offset,
        total: jobs.length // This is approximate; for exact count, we'd need a separate query
      }
    })

  } catch (error) {
    console.error('Get jobs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
