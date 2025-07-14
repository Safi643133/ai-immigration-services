import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { DocumentCategory } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get the current user using server-side auth
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create admin client for database operations (bypasses RLS)
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as DocumentCategory
    const filename = formData.get('filename') as string

    if (!file || !category || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/tiff', 'image/tif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Supported types: PDF, JPEG, PNG, TIFF` },
        { status: 400 }
      )
    }

    // Additional validation for PDFs
    if (file.type === 'application/pdf') {
      // Check if PDF is password protected or corrupted
      if (file.size === 0) {
        return NextResponse.json(
          { error: 'PDF file appears to be empty or corrupted' },
          { status: 400 }
        )
      }
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = filename.split('.').pop()
    const uniqueFilename = `${user.id}/${timestamp}-${filename}`

    // Upload file to Supabase Storage using admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(uniqueFilename, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(uniqueFilename)

    // Insert document record into database using admin client
    const { data: documentData, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: user.id,
        filename: filename,
        file_path: uniqueFilename,
        file_type: file.type,
        file_size: file.size,
        upload_status: 'completed',
        processing_status: 'queued',
        document_category: category
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('documents')
        .remove([uniqueFilename])
      
      return NextResponse.json(
        { error: 'Failed to save document record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      document: {
        id: documentData.id,
        filename: documentData.filename,
        file_path: documentData.file_path,
        file_type: documentData.file_type,
        file_size: documentData.file_size,
        upload_status: documentData.upload_status,
        processing_status: documentData.processing_status,
        document_category: documentData.document_category,
        public_url: urlData.publicUrl
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 