import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get the user ID from header (alternative to Bearer token)
    const userId = request.headers.get('X-User-ID')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    console.log('Processing request for user:', userId)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build the query
    let query = supabase
      .from('form_submissions')
      .select(`
        *,
        form_templates (
          id,
          name,
          description,
          form_type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Add status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Add search filter if provided
    if (search) {
      query = query.or(`form_templates.name.ilike.%${search}%,application_id.ilike.%${search}%`)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('form_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get paginated results
    const { data: submissions, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    return NextResponse.json({
      submissions: submissions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in GET /api/forms/submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the user ID from header (alternative to Bearer token)
    const userId = request.headers.get('X-User-ID')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    console.log('Processing POST request for user:', userId)

    const body = await request.json()

    // Create the submission
    const { data: submission, error } = await supabase
      .from('form_submissions')
      .insert({
        user_id: userId,
        form_template_id: body.form_template_id,
        form_data: body.form_data,
        extracted_data_summary: body.extracted_data_summary,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        form_templates (
          id,
          name,
          description,
          form_type
        )
      `)
      .single()

    if (error) {
      console.error('Error creating submission:', error)
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error in POST /api/forms/submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
