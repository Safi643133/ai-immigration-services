/**
 * CAPTCHA API Routes
 * 
 * GET /api/ceac/captcha - Get CAPTCHA challenges for user
 * POST /api/ceac/captcha - Create a new CAPTCHA challenge
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ProgressService } from '@/lib/progress/progress-service'

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
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    if (jobId) {
      // Get CAPTCHA challenge for specific job
      try {
        const challenge = await progressService.getCaptchaChallenge(jobId)
        
        if (!challenge) {
          return NextResponse.json({
            success: true,
            data: null
          })
        }

        return NextResponse.json({
          success: true,
          data: challenge
        })
      } catch (error) {
        console.error('Error getting CAPTCHA challenge:', error)
        return NextResponse.json(
          { error: 'Failed to get CAPTCHA challenge' },
          { status: 500 }
        )
      }
    } else {
      // Get all user's active CAPTCHA challenges
      try {
        // Get user's jobs with active CAPTCHAs
        const { data: jobs, error: jobsError } = await supabase
          .from('ceac_automation_jobs')
          .select('id, status, created_at, embassy_location')
          .eq('user_id', user.id)
          .in('status', ['running', 'waiting_for_captcha'])

        if (jobsError) {
          throw jobsError
        }

        // Get CAPTCHA challenges for each job
        const captchaChallenges = await Promise.all(
          jobs.map(async (job) => {
            try {
              const challenge = await progressService.getCaptchaChallenge(job.id)
              if (challenge && (activeOnly ? !challenge.solved : true)) {
                return {
                  job_status: job.status,
                  embassy_location: job.embassy_location,
                  job_created_at: job.created_at,
                  ...challenge
                }
              }
              return null
            } catch (error) {
              console.error(`Error getting CAPTCHA for job ${job.id}:`, error)
              return null
            }
          })
        )

        const activeChallenges = captchaChallenges.filter(challenge => challenge !== null)

        return NextResponse.json({
          success: true,
          data: {
            challenges: activeChallenges,
            total: activeChallenges.length
          }
        })
      } catch (error) {
        console.error('Error getting user CAPTCHA challenges:', error)
        return NextResponse.json(
          { error: 'Failed to get CAPTCHA challenges' },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('CAPTCHA API error:', error)
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
    const body = await request.json()
    
    // Validate required fields
    if (!body.job_id || !body.image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: job_id, image_url' },
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

    // Create CAPTCHA challenge
    const challenge = await progressService.createCaptchaChallenge(
      body.job_id,
      body.image_url
    )

    return NextResponse.json({
      success: true,
      data: challenge
    })

  } catch (error) {
    console.error('CAPTCHA API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

