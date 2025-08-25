'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FileText, Download, Eye, Calendar, User, Send, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, Plus } from 'lucide-react'
import type { FormSubmission, FormTemplate } from '@/lib/supabase'

interface SubmissionWithTemplate extends FormSubmission {
  form_templates: FormTemplate
}

interface CeacJob {
  id: string
  status: string
  createdAt: string
  applicationId?: string
  confirmationId?: string
  embassy?: string
  retryCount?: number
}

export default function SubmissionDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const submissionId = params?.submissionId as string
  
  const [submission, setSubmission] = useState<SubmissionWithTemplate | null>(null)
  const [ceacJobs, setCeacJobs] = useState<CeacJob[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingTo, setSubmittingTo] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && !authLoading && submissionId) {
      loadSubmission()
      loadCeacJobs()
    }
  }, [user, authLoading, router, submissionId])

  const loadSubmission = async () => {
    try {
      const response = await fetch(`/api/submissions`)
      if (response.ok) {
        const data = await response.json()
        const foundSubmission = data.submissions.find((s: SubmissionWithTemplate) => s.id === submissionId)
        if (foundSubmission) {
          setSubmission(foundSubmission)
        } else {
          // Submission not found, redirect back
          router.push('/submissions')
        }
      }
    } catch (error) {
      console.error('Error loading submission:', error)
      router.push('/submissions')
    }
  }

  const loadCeacJobs = async () => {
    try {
      const response = await fetch('/api/ceac/jobs')
      if (response.ok) {
        const data = await response.json()
        const filteredJobs = data.jobs
          .filter((job: any) => job.submission_id === submissionId)
          .map((job: any) => ({
            id: job.id,
            status: job.status,
            createdAt: job.created_at,
            applicationId: job.ceac_application_id,
            confirmationId: job.ceac_confirmation_id,
            embassy: job.embassy_location,
            retryCount: job.retry_count
          }))
          .sort((a: CeacJob, b: CeacJob) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        
        setCeacJobs(filteredJobs)
      }
    } catch (error) {
      console.error('Error loading CEAC jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitToCeac = async () => {
    setSubmittingTo(true)
    
    try {
      const response = await fetch('/api/ceac/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          embassy: 'PAKISTAN, ISLAMABAD', // Default embassy, could be made configurable
          priority: 1
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newJob: CeacJob = {
          id: data.job.id,
          status: data.job.status || 'queued',
          createdAt: data.job.created_at,
          embassy: data.job.embassy_location
        }
        
        // Add new job to the list
        setCeacJobs(prev => [newJob, ...prev])
        
        // Navigate to job progress page
        router.push(`/submissions/${submissionId}/job/${data.job.id}`)
        
      } else {
        const error = await response.json()
        alert(`Failed to submit to CEAC: ${error.error}`)
      }
    } catch (error) {
      console.error('Error submitting to CEAC:', error)
      alert('Failed to submit to CEAC')
    } finally {
      setSubmittingTo(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!submission) return
    
    try {
      const response = await fetch(`/api/forms/export-pdf?submissionId=${submission.id}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${submission.form_templates.name.replace(/\s+/g, '-').toLowerCase()}-${submission.id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to download PDF')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF')
    }
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

  const getCeacStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'running':
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case 'completed':
      case 'succeeded':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getCeacStatusText = (status: string) => {
    switch (status) {
      case 'queued':
        return 'Queued'
      case 'running':
        return 'Processing'
      case 'completed':
      case 'succeeded':
        return 'Completed'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  const getCeacStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
      case 'succeeded':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submission...</p>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Submission Not Found
          </h3>
          <p className="text-gray-500 mb-4">
            The requested submission could not be found.
          </p>
          <button
            onClick={() => router.push('/submissions')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Submissions
          </button>
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
              <button
                onClick={() => router.push('/submissions')}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Submission Details
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Submission Info */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-indigo-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {submission.form_templates.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {submission.form_templates.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(submission.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span className="capitalize">{submission.status}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/forms?edit=${submission.id}`)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Edit Form</span>
                </button>
                
                <button
                  onClick={handleDownloadPDF}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* CEAC Submissions */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                CEAC Submissions ({ceacJobs.length})
              </h3>
              
              <button
                onClick={handleSubmitToCeac}
                disabled={submittingTo}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {submittingTo ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>
                  {submittingTo ? 'Creating...' : 'New CEAC Submission'}
                </span>
              </button>
            </div>

            {ceacJobs.length === 0 ? (
              <div className="text-center py-12">
                <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No CEAC Submissions Yet
                </h4>
                <p className="text-gray-500 mb-4">
                  Submit this form to the CEAC website to begin the visa application process.
                </p>
                <button
                  onClick={handleSubmitToCeac}
                  disabled={submittingTo}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 mx-auto"
                >
                  {submittingTo ? (
                    <Clock className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  <span>
                    {submittingTo ? 'Creating Submission...' : 'Submit to CEAC'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {ceacJobs.map((job, index) => (
                  <div 
                    key={job.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/submissions/${submissionId}/job/${job.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getCeacStatusIcon(job.status)}
                        <div>
                          <div className="flex items-center space-x-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              CEAC Job #{index + 1}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCeacStatusColor(job.status)}`}>
                              {getCeacStatusText(job.status)}
                            </span>
                            {index === 0 && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                Latest
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>Created {formatDate(job.createdAt)}</span>
                            {job.embassy && <span>• {job.embassy}</span>}
                            {job.applicationId && <span>• App ID: {job.applicationId}</span>}
                            {job.retryCount && job.retryCount > 0 && <span>• Retries: {job.retryCount}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Click to view details</span>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 
