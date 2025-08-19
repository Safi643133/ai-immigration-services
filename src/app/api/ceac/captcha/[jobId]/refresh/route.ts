import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { ProgressService } from '@/lib/progress/progress-service'
import JobManager from '@/lib/queues'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      )
    }

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
        { success: false, error: 'Unauthorized' },
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

    // Get the job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('ceac_automation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Check if the job is currently running
    const isJobRunning = job.status === 'running' || job.status === 'queued'
    
    if (!isJobRunning) {
      console.log(`🔄 Job ${jobId} is not running (status: ${job.status}), restarting...`)
      
      // Restart the job by updating its status and clearing error information
      const { error: updateError } = await supabaseAdmin
        .from('ceac_automation_jobs')
        .update({
          status: 'queued',
          started_at: null,
          finished_at: null,
          error_code: null,
          error_message: null,
          metadata: {
            ...job.metadata,
            restarted_at: new Date().toISOString(),
            restart_reason: 'captcha_refresh_requested'
          }
        })
        .eq('id', jobId)

      if (updateError) {
        console.error('Error restarting job:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to restart job' },
          { status: 500 }
        )
      }

      // Add the job back to the queue
      try {
        await JobManager.submitToCeac({
          jobId: job.id,
          submissionId: job.submission_id,
          userId: job.user_id,
          formData: job.metadata?.form_data || {},
          embassy: job.embassy_location,
          ceacVersion: job.metadata?.ceac_version || '2025.01'
        })
        
        console.log(`✅ Job ${jobId} restarted and added to queue`)
      } catch (queueError) {
        console.error('Error adding job to queue:', queueError)
        return NextResponse.json(
          { success: false, error: 'Failed to restart automation' },
          { status: 500 }
        )
      }
    }

    // Create a progress update to signal CAPTCHA refresh needed
    const progressService = new ProgressService()
    
    await progressService.createProgressUpdate({
      job_id: jobId,
      user_id: user.id,
      step_name: 'captcha_refresh_requested',
      status: 'pending',
      message: 'User requested CAPTCHA refresh - automation should refresh CAPTCHA on CEAC website',
      progress_percentage: 25, // Keep current progress
      needs_captcha: true,
      metadata: {
        refresh_requested_at: new Date().toISOString(),
        refresh_type: 'user_requested',
        job_restarted: !isJobRunning
      }
    })

    // Wait a moment for the automation to process the refresh request
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Create a new CAPTCHA challenge with a placeholder URL
    // The automation will update this with the actual refreshed URL
    const newChallenge = await progressService.createCaptchaChallenge(
      jobId, 
      'https://ceac.state.gov/GenNIV/BotDetectCaptcha.ashx?get=image&c=c_default_ctl00_sitecontentplaceholder_uclocation_identifycaptcha1_defaultcaptcha&t=REFRESHING'
    )

    if (!newChallenge) {
      return NextResponse.json(
        { success: false, error: 'Failed to create CAPTCHA challenge' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newChallenge,
      message: isJobRunning 
        ? 'CAPTCHA refresh requested - automation will update with fresh image'
        : 'Job restarted and CAPTCHA refresh requested - automation will update with fresh image'
    })

  } catch (error) {
    console.error('Error refreshing CAPTCHA:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
