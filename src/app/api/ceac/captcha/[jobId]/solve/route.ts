/**
 * CAPTCHA Solution API Route
 * 
 * POST /api/ceac/captcha/[jobId]/solve - Submit CAPTCHA solution
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ProgressService } from '@/lib/progress/progress-service'
import type { SolveCaptchaRequest } from '@/lib/progress/progress-types'

const progressService = new ProgressService()

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
      .select('id, user_id, status')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Check if job is in a state that can accept CAPTCHA solutions
    if (!['running', 'waiting_for_captcha'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Job is not in a state that can accept CAPTCHA solutions' },
        { status: 400 }
      )
    }

    // Parse request body
    const body: SolveCaptchaRequest = await request.json()
    
    // Validate required fields
    if (!body.solution || body.solution.trim().length === 0) {
      return NextResponse.json(
        { error: 'CAPTCHA solution is required' },
        { status: 400 }
      )
    }

    // Check if there's an active CAPTCHA challenge
    const challenge = await progressService.getCaptchaChallenge(jobId)
    if (!challenge) {
      return NextResponse.json(
        { error: 'No active CAPTCHA challenge found for this job' },
        { status: 404 }
      )
    }

    if (challenge.solved) {
      return NextResponse.json(
        { error: 'CAPTCHA challenge has already been solved' },
        { status: 400 }
      )
    }

    // Check if CAPTCHA has expired
    if (new Date(challenge.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'CAPTCHA challenge has expired' },
        { status: 400 }
      )
    }

    try {
      // Solve the CAPTCHA
      const captchaSolution = await progressService.solveCaptcha(jobId, body.solution.trim())
      
      // Update progress to indicate CAPTCHA is solved
      const progressUpdate = await progressService.handleCaptchaSolution(jobId, body.solution.trim())

      return NextResponse.json({
        success: true,
        data: {
          solution: captchaSolution,
          progress_update: progressUpdate,
          message: 'CAPTCHA solved successfully'
        }
      })
    } catch (error) {
      console.error('Error solving CAPTCHA:', error)
      return NextResponse.json(
        { error: 'Failed to solve CAPTCHA' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('CAPTCHA solution API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
