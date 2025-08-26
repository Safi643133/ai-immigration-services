import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the user ID from header (alternative to Bearer token)
    const userId = request.headers.get('X-User-ID')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    console.log('Processing GET request for user:', userId)

    const { id: submissionId } = await params

    // Fetch the submission with template information
    const { data: submission, error } = await supabase
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
      .eq('id', submissionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching submission:', error)
      return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
    }

    if (!submission) {
      console.log(`Submission not found: ${submissionId} for user: ${userId}`)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error in GET /api/forms/submissions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the user ID from header (alternative to Bearer token)
    const userId = request.headers.get('X-User-ID')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    console.log('Processing PUT request for user:', userId)

    const { id: submissionId } = await params
    const body = await request.json()

    // Update the submission
    const { data: submission, error } = await supabase
      .from('form_submissions')
      .update({
        form_data: body.form_data,
        extracted_data_summary: body.extracted_data_summary,
        status: body.status || 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating submission:', error)
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
    }

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error in PUT /api/forms/submissions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the user ID from header (alternative to Bearer token)
    const userId = request.headers.get('X-User-ID')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    console.log('Processing DELETE request for user:', userId)

    const { id: submissionId } = await params

    // Delete the submission (hard delete since no deleted_at column)
    const { error } = await supabase
      .from('form_submissions')
      .delete()
      .eq('id', submissionId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting submission:', error)
      return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Submission deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/forms/submissions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
