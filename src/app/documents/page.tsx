'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { File, Download, Trash2, Eye, Clock, CheckCircle, AlertCircle, Play, Database } from 'lucide-react'
import { getUserDocuments, deleteDocument, getDocumentUrl } from '@/lib/documents'
import type { Document as DocumentType } from '@/lib/supabase'

interface ExtractedData {
  id: string
  field_name: string
  field_value: string
  confidence_score: number
  field_category: string
  validation_status: string
}

interface ProcessingStatus {
  processing_status: string
  session: any
  extracted_data: ExtractedData[]
}

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [processingStatuses, setProcessingStatuses] = useState<Record<string, ProcessingStatus>>({})
  const [showExtractedData, setShowExtractedData] = useState<Record<string, boolean>>({})
  const [pollingIntervals, setPollingIntervals] = useState<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && !authLoading) {
      loadDocuments()
    }

    // Cleanup function to clear all polling intervals when component unmounts
    return () => {
      Object.values(pollingIntervals).forEach(interval => {
        clearInterval(interval)
      })
    }
  }, [user, authLoading, router, pollingIntervals])

  const loadDocuments = async () => {
    try {
      const docs = await getUserDocuments()
      setDocuments(docs)
      
      // Load processing status for each document
      for (const doc of docs) {
        if (doc.processing_status === 'queued' || doc.processing_status === 'processing') {
          await loadProcessingStatus(doc.id)
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProcessingStatus = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/process?documentId=${documentId}`)
      if (response.ok) {
        const data = await response.json()
        setProcessingStatuses(prev => ({
          ...prev,
          [documentId]: data
        }))
      }
    } catch (error) {
      console.error('Error loading processing status:', error)
    }
  }

  const handleProcessDocument = async (documentId: string) => {
    setProcessing(documentId)
    try {
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId })
      })

      if (response.ok) {
        // Start polling for status updates
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/documents/process?documentId=${documentId}`)
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              
              // Update the processing status
              setProcessingStatuses(prev => ({
                ...prev,
                [documentId]: statusData
              }))
              
              // Check if processing is complete
              if (statusData.processing_status === 'succeeded' || statusData.processing_status === 'failed') {
                clearInterval(pollInterval)
                setProcessing(null)
                // Remove from polling intervals
                setPollingIntervals(prev => {
                  const newIntervals = { ...prev }
                  delete newIntervals[documentId]
                  return newIntervals
                })
                // Reload documents to get updated status
                await loadDocuments()
              }
            }
          } catch (pollError) {
            console.error('Error polling status:', pollError)
            clearInterval(pollInterval)
            setProcessing(null)
            // Remove from polling intervals
            setPollingIntervals(prev => {
              const newIntervals = { ...prev }
              delete newIntervals[documentId]
              return newIntervals
            })
          }
        }, 2000)
        
        // Store the interval for cleanup
        setPollingIntervals(prev => ({
          ...prev,
          [documentId]: pollInterval
        }))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to process document')
        setProcessing(null)
      }
    } catch (error) {
      console.error('Error processing document:', error)
      alert('Failed to process document')
      setProcessing(null)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    setDeleting(documentId)
    try {
      await deleteDocument(documentId)
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (doc: DocumentType) => {
    const url = getDocumentUrl(doc.file_path)
    const link = document.createElement('a')
    link.href = url
    link.download = doc.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = (document: DocumentType) => {
    const url = getDocumentUrl(document.file_path)
    window.open(url, '_blank')
  }

  const toggleExtractedData = async (documentId: string) => {
    // If we're showing the data, just toggle it off
    if (showExtractedData[documentId]) {
      setShowExtractedData(prev => ({
        ...prev,
        [documentId]: false
      }))
      return
    }

    // If we're showing it for the first time, load the latest data
    try {
      const response = await fetch(`/api/documents/process?documentId=${documentId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Extracted data for document:', documentId, data)
        
        setProcessingStatuses(prev => ({
          ...prev,
          [documentId]: data
        }))
        
        setShowExtractedData(prev => ({
          ...prev,
          [documentId]: true
        }))
      }
    } catch (error) {
      console.error('Error loading extracted data:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      case 'processing':
        return 'Processing'
      case 'queued':
        return 'Queued'
      default:
        return status
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatConfidence = (confidence: number) => {
    return Math.round(confidence * 100) + '%'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Checking authentication...' : 'Loading documents...'}
          </p>
        </div>
      </div>
    )
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
                onClick={() => router.push('/upload')}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Upload New
              </button>
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Documents
            </h2>
            <p className="text-gray-600">
              Manage your uploaded immigration documents and view extracted data
            </p>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12">
              <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No documents uploaded
              </h3>
              <p className="text-gray-500 mb-6">
                Upload your first document to get started with AI processing
              </p>
              <button
                onClick={() => router.push('/upload')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Upload Documents
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {documents.map((document) => (
                <div key={document.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <File className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {document.filename}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{formatFileSize(document.file_size)}</span>
                            <span className="capitalize">{document.document_category}</span>
                            <span>{formatDate(document.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Status */}
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(document.processing_status)}
                          <span className="text-xs text-gray-500">
                            {getStatusText(document.processing_status)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1">
                          {/* Process Document */}
                          {document.processing_status === 'queued' && (
                            <button
                              onClick={() => handleProcessDocument(document.id)}
                              disabled={processing === document.id}
                              className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-50"
                              title="Process document with AI"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}

                          {/* View Extracted Data */}
                          {document.processing_status === 'completed' && (
                            <button
                              onClick={() => toggleExtractedData(document.id)}
                              className={`p-2 rounded-md transition-colors ${
                                showExtractedData[document.id] 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                              title="View extracted data"
                            >
                              <Database className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleView(document)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDownload(document)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(document.id)}
                            disabled={deleting === document.id}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Extracted Data Section */}
                    {showExtractedData[document.id] && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            Extracted Data
                          </h4>
                          <span className="text-xs text-gray-500">
                            {processingStatuses[document.id]?.extracted_data?.length || 0} fields extracted
                          </span>
                        </div>
                        
                        {processingStatuses[document.id]?.extracted_data && processingStatuses[document.id].extracted_data.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {processingStatuses[document.id].extracted_data.map((data: ExtractedData) => (
                              <div key={data.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                                      {data.field_name.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 mt-2 break-words">
                                      {data.field_value}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1 capitalize">
                                      Category: {data.field_category}
                                    </p>
                                  </div>
                                  <div className="ml-3 flex-shrink-0">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      data.confidence_score >= 0.8 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : data.confidence_score >= 0.6 
                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                        : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                      {formatConfidence(data.confidence_score)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Database className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              No data extracted from this document yet.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Try processing the document again or check if the document contains readable text.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Processing Status */}
                    {document.processing_status === 'processing' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                          <span className="text-sm text-gray-600">
                            Processing document with AI...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 