import { createBrowserClient } from '@supabase/ssr'
import type { Document, DocumentCategory } from './supabase'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const uploadDocument = async (
  file: File,
  category: DocumentCategory,
  filename: string
): Promise<Document> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  formData.append('filename', filename)

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }

  const result = await response.json()
  return result.document
}

export const getUserDocuments = async (): Promise<Document[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export const getDocumentById = async (id: string): Promise<Document | null> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No document found
    }
    throw error
  }

  return data
}

export const updateDocumentStatus = async (
  id: string,
  status: 'upload_status' | 'processing_status',
  value: string
): Promise<Document> => {
  const { data, error } = await supabase
    .from('documents')
    .update({ [status]: value })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export const deleteDocument = async (id: string): Promise<void> => {
  // First get the document to get the file path
  const document = await getDocumentById(id)
  if (!document) {
    throw new Error('Document not found')
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([document.file_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (dbError) {
    throw dbError
  }
}

export const getDocumentUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath)
  
  return data.publicUrl
} 