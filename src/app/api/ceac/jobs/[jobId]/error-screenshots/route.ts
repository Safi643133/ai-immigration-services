import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // List all error screenshots for this job
    const { data: files, error } = await supabase.storage
      .from('ceac-artifacts')
      .list(`ceac-jobs/${jobId}/screenshot`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('Error listing error screenshots:', error)
      return NextResponse.json(
        { error: 'Failed to fetch error screenshots' },
        { status: 500 }
      )
    }

    // Filter for error screenshots (files containing "validation-error" in the name)
    const errorScreenshots = files
      .filter(file => file.name.includes('validation-error'))
      .map(file => {
        const { data } = supabase.storage
          .from('ceac-artifacts')
          .getPublicUrl(`ceac-jobs/${jobId}/screenshot/${file.name}`)
        
        return data.publicUrl
      })

    return NextResponse.json({
      screenshots: errorScreenshots,
      count: errorScreenshots.length
    })

  } catch (error) {
    console.error('Error in error-screenshots API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
