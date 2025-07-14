'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import type { DocumentCategory } from '@/lib/supabase'

interface UploadedFile {
  id: string
  file: File
  category: DocumentCategory
  status: 'uploading' | 'completed' | 'failed'
  progress: number
  error?: string
}

export default function UploadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Handle authentication and loading states
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const documentCategories: { value: DocumentCategory; label: string; description: string }[] = [
    { value: 'passport', label: 'Passport', description: 'Passport or national ID documents' },
    { value: 'visa', label: 'Visa', description: 'Current and previous visas' },
    { value: 'education', label: 'Education', description: 'Academic certificates and transcripts' },
    { value: 'financial', label: 'Financial', description: 'Bank statements and financial documents' },
    { value: 'medical', label: 'Medical', description: 'Medical certificates and health records' },
    { value: 'other', label: 'Other', description: 'Other supporting documents' }
  ]

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }, [])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/tiff']
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Please upload PDF or image files.`)
        return false
      }
      
      if (file.size > maxSize) {
        alert(`File too large: ${file.name}. Maximum size is 10MB.`)
        return false
      }
      
      return true
    })

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      category: 'other',
      status: 'uploading',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const updateFileCategory = (fileId: string, category: DocumentCategory) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, category } : file
      )
    )
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) return

    setIsUploading(true)

    try {
      for (const uploadedFile of uploadedFiles) {
        await uploadSingleFile(uploadedFile)
      }

      // Redirect to processing page or show success message
      router.push('/dashboard')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading files. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const uploadSingleFile = async (uploadedFile: UploadedFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', uploadedFile.file)
      formData.append('category', uploadedFile.category)
      formData.append('filename', uploadedFile.file.name)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadedFiles(prev => 
            prev.map(file => 
              file.id === uploadedFile.id 
                ? { ...file, progress } 
                : file
            )
          )
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadedFiles(prev => 
            prev.map(file => 
              file.id === uploadedFile.id 
                ? { ...file, status: 'completed', progress: 100 } 
                : file
            )
          )
          resolve()
        } else {
          setUploadedFiles(prev => 
            prev.map(file => 
              file.id === uploadedFile.id 
                ? { ...file, status: 'failed', error: 'Upload failed' } 
                : file
            )
          )
          reject(new Error('Upload failed'))
        }
      })

      xhr.addEventListener('error', () => {
        setUploadedFiles(prev => 
          prev.map(file => 
            file.id === uploadedFile.id 
              ? { ...file, status: 'failed', error: 'Network error' } 
              : file
          )
        )
        reject(new Error('Network error'))
      })

      xhr.open('POST', '/api/documents/upload')
      xhr.send(formData)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AI Immigration Agent
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Upload Documents
            </h2>
            <p className="text-gray-600">
              Upload your immigration documents. We'll automatically extract information and fill your forms.
            </p>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports PDF, JPEG, PNG, and TIFF files up to 10MB
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              Choose Files
            </label>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Uploaded Files ({uploadedFiles.length})
              </h3>
              
              <div className="space-y-4">
                {uploadedFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="bg-white p-4 rounded-lg border shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <File className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {uploadedFile.status === 'completed' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {uploadedFile.status === 'failed' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <button
                          onClick={() => removeFile(uploadedFile.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Document Category
                      </label>
                      <select
                        value={uploadedFile.category}
                        onChange={(e) => updateFileCategory(uploadedFile.id, e.target.value as DocumentCategory)}
                        className="block w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={uploadedFile.status === 'uploading'}
                      >
                        {documentCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Progress Bar */}
                    {uploadedFile.status === 'uploading' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Uploading...</span>
                          <span>{uploadedFile.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {uploadedFile.status === 'failed' && uploadedFile.error && (
                      <p className="mt-2 text-sm text-red-600">
                        {uploadedFile.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Upload Button */}
              <div className="mt-6">
                <button
                  onClick={uploadFiles}
                  disabled={isUploading || uploadedFiles.length === 0}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : `Upload ${uploadedFiles.length} File${uploadedFiles.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 