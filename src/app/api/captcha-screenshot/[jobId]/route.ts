import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getArtifactStorage } from '@/lib/artifact-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
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

    // Get the latest CAPTCHA challenge to find the screenshot path
    const { data: challenge, error: challengeError } = await supabase
      .from('ceac_captcha_challenges')
      .select('image_url')
      .eq('job_id', jobId)
      .eq('solved', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'No active CAPTCHA challenge found' },
        { status: 404 }
      )
    }

    const imageUrl = challenge.image_url
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No screenshot available' },
        { status: 404 }
      )
    }

    // If it's a Supabase Storage URL, redirect to it
    if (imageUrl.includes('supabase.co') && imageUrl.includes('storage')) {
      return NextResponse.redirect(imageUrl)
    }

    // If it's a local path (fallback), try to serve from artifacts
    if (imageUrl.startsWith('artifacts/')) {
      try {
        // Try to get the artifact from Supabase Storage first
        const artifactStorage = getArtifactStorage()
        
        // Extract filename from path
        const filename = imageUrl.split('/').pop()
        if (!filename) {
          return NextResponse.json(
            { error: 'Invalid screenshot path' },
            { status: 400 }
          )
        }

        // Get the artifact from storage
        const artifacts = await artifactStorage.getJobArtifacts(jobId)
        const captchaArtifact = artifacts.find(artifact => 
          artifact.filename === filename && artifact.type === 'screenshot'
        )

        if (captchaArtifact && captchaArtifact.publicUrl) {
          // Redirect to the public URL
          return NextResponse.redirect(captchaArtifact.publicUrl)
        } else if (captchaArtifact) {
          // Download and serve the artifact
          const imageBuffer = await artifactStorage.downloadArtifact(captchaArtifact.id)
          if (imageBuffer) {
            return new NextResponse(imageBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              },
            })
          }
        }
      } catch (error) {
        console.error('Error serving from Supabase Storage:', error)
      }
    }

    return NextResponse.json(
      { error: 'Screenshot not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error serving CAPTCHA screenshot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
