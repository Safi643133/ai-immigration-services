import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ProgressService } from '@/lib/progress/progress-service'

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

    // Verify the job belongs to the user
    const { data: job, error: jobError } = await supabase
      .from('ceac_automation_jobs')
      .select('id, user_id, status')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Refresh CAPTCHA challenge
    const progressService = new ProgressService()
    const newChallenge = await progressService.refreshCaptcha(jobId)

    if (!newChallenge) {
      return NextResponse.json(
        { success: false, error: 'Failed to refresh CAPTCHA' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newChallenge
    })

  } catch (error) {
    console.error('Error refreshing CAPTCHA:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
