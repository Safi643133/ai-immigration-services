'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Download, Eye, EyeOff, Copy } from 'lucide-react'
import { ProgressTracker } from '@/components'
import CaptchaDebug from '@/components/debug/CaptchaDebug'
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
  errorMessage?: string
  metadata?: {
    validation_errors?: string[]
    validation_error_count?: number
    step_number?: number
    error_timestamp?: string
  }
}

interface ApplicationData {
  applicationId: {
    job_id: string
    application_id: string
    application_date: string
    created_at: string
  } | null
  securityAnswer: {
    job_id: string
    security_question: string
    security_answer: string
    created_at: string
  } | null
}

export default function JobProgressPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const submissionId = params?.submissionId as string
  const jobId = params?.jobId as string
  
  const [submission, setSubmission] = useState<SubmissionWithTemplate | null>(null)
  const [job, setJob] = useState<CeacJob | null>(null)
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null)
  const [showSecurityAnswer, setShowSecurityAnswer] = useState(false)
  const [errorScreenshots, setErrorScreenshots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && !authLoading && submissionId && jobId) {
      loadData()
    }
  }, [user, authLoading, router, submissionId, jobId])

  const loadErrorScreenshots = async (jobId: string) => {
    try {
      const response = await fetch(`/api/ceac/jobs/${jobId}/error-screenshots`)
      if (response.ok) {
        const data = await response.json()
        setErrorScreenshots(data.screenshots || [])
      }
    } catch (error) {
      console.error('Error loading error screenshots:', error)
    }
  }

  const loadData = async () => {
    try {
      // Load submission
      const submissionResponse = await fetch(`/api/submissions`)
      if (submissionResponse.ok) {
        const submissionData = await submissionResponse.json()
        const foundSubmission = submissionData.submissions.find((s: SubmissionWithTemplate) => s.id === submissionId)
        if (foundSubmission) {
          setSubmission(foundSubmission)
        } else {
          router.push('/submissions')
          return
        }
      }

      // Load job
      const jobResponse = await fetch('/api/ceac/jobs')
      if (jobResponse.ok) {
        const jobData = await jobResponse.json()
        const foundJob = jobData.jobs.find((j: any) => j.id === jobId && j.submission_id === submissionId)
        if (foundJob) {
          setJob({
            id: foundJob.id,
            status: foundJob.status,
            createdAt: foundJob.created_at,
            applicationId: foundJob.ceac_application_id,
            confirmationId: foundJob.ceac_confirmation_id,
            embassy: foundJob.embassy_location,
            retryCount: foundJob.retry_count,
            errorMessage: foundJob.error_message,
            metadata: foundJob.metadata
          })

          // Load error screenshots if job failed
          if (foundJob.status === 'failed') {
            await loadErrorScreenshots(jobId)
          }
        } else {
          router.push(`/submissions/${submissionId}`)
          return
        }
      }

      // Load application data (application ID and security answer)
      const applicationDataResponse = await fetch(`/api/ceac/jobs/${jobId}/application-data`)
      if (applicationDataResponse.ok) {
        const applicationDataResult = await applicationDataResponse.json()
        setApplicationData(applicationDataResult.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      router.push('/submissions')
    } finally {
      setLoading(false)
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
        return <Clock className="h-6 w-6 text-yellow-500" />
      case 'running':
        return <AlertCircle className="h-6 w-6 text-blue-500" />
      case 'completed':
      case 'succeeded':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
      case 'succeeded':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleRetry = async () => {
    try {
      const response = await fetch('/api/ceac/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          embassy: job?.embassy || 'PAKISTAN, ISLAMABAD',
          priority: 1
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Navigate to the new job
        router.push(`/submissions/${submissionId}/job/${data.job.id}`)
      } else {
        const error = await response.json()
        alert(`Failed to retry: ${error.error}`)
      }
    } catch (error) {
      console.error('Error retrying job:', error)
      alert('Failed to retry job')
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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${label} copied to clipboard!`)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Failed to copy to clipboard')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!submission || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Job Not Found
          </h3>
          <p className="text-gray-500 mb-4">
            The requested job could not be found.
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
                onClick={() => router.push(`/submissions/${submissionId}`)}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                CEAC Job Progress
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/submissions')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                All Submissions
              </button>
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
          
          {/* Job Status Header */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getCeacStatusIcon(job.status)}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {submission.form_templates.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Job ID: {job.id}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getCeacStatusColor(job.status)}`}>
                      {getCeacStatusText(job.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Started {formatDate(job.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {job.status === 'failed' && (
                  <button
                    onClick={handleRetry}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Retry</span>
                  </button>
                )}
                
                <button
                  onClick={handleDownloadPDF}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Job Details */}
            {(job.embassy || job.applicationId || job.confirmationId || job.retryCount) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {job.embassy && (
                    <div>
                      <span className="font-medium text-gray-500">Embassy:</span>
                      <p className="text-gray-900">{job.embassy}</p>
                    </div>
                  )}
                  {job.applicationId && (
                    <div>
                      <span className="font-medium text-gray-500">Application ID:</span>
                      <p className="text-gray-900 font-mono">{job.applicationId}</p>
                    </div>
                  )}
                  {job.confirmationId && (
                    <div>
                      <span className="font-medium text-gray-500">Confirmation ID:</span>
                      <p className="text-gray-900 font-mono">{job.confirmationId}</p>
                    </div>
                  )}
                  {job.retryCount !== undefined && job.retryCount > 0 && (
                    <div>
                      <span className="font-medium text-gray-500">Retry Count:</span>
                      <p className="text-gray-900">{job.retryCount}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error Information Section */}
          {job.status === 'failed' && (
            <div className="bg-red-50 border border-red-200 shadow rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <XCircle className="h-6 w-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-red-900">
                  Job Failed
                </h3>
              </div>
              
              {/* Error Message */}
              {job.errorMessage && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-700 mb-2">Error Details:</h4>
                  <p className="text-red-800 bg-red-100 p-3 rounded-md">
                    {job.errorMessage}
                  </p>
                </div>
              )}

              {/* Validation Errors */}
              {job.metadata?.validation_errors && job.metadata.validation_errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-700 mb-2">
                    Validation Errors ({job.metadata.validation_error_count} errors):
                  </h4>
                  <div className="bg-red-100 p-3 rounded-md">
                    <ul className="list-disc list-inside space-y-1">
                      {job.metadata.validation_errors.map((error, index) => (
                        <li key={index} className="text-red-800 text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Error Screenshots */}
              {errorScreenshots.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-3">
                    Error Screenshots ({errorScreenshots.length}):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {errorScreenshots.map((screenshot, index) => (
                      <div key={index} className="bg-white border border-red-200 rounded-lg overflow-hidden">
                        <div className="p-3 bg-red-50 border-b border-red-200">
                          <h5 className="text-sm font-medium text-red-700">
                            Error Screenshot {index + 1}
                          </h5>
                        </div>
                        <div className="p-4">
                          <img
                            src={screenshot}
                            alt={`Error screenshot ${index + 1}`}
                            className="w-full h-auto rounded border border-gray-200"
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                          />
                          <div className="mt-3 flex justify-between items-center">
                            <a
                              href={screenshot}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Full Size
                            </a>
                            <button
                              onClick={() => copyToClipboard(screenshot, 'Screenshot URL')}
                              className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy URL
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Metadata */}
              {job.metadata?.step_number && (
                <div className="mt-4 pt-4 border-t border-red-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-red-700">Failed at Step:</span>
                      <p className="text-red-800">{job.metadata.step_number}</p>
                    </div>
                    {job.metadata.error_timestamp && (
                      <div>
                        <span className="font-medium text-red-700">Error Time:</span>
                        <p className="text-red-800">{formatDate(job.metadata.error_timestamp)}</p>
                      </div>
                    )}
                    {job.metadata.validation_error_count && (
                      <div>
                        <span className="font-medium text-red-700">Error Count:</span>
                        <p className="text-red-800">{job.metadata.validation_error_count}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Application ID and Security Answer Section */}
          {applicationData && (applicationData.applicationId || applicationData.securityAnswer) && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                CEAC Application Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Application ID */}
                {applicationData.applicationId && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Application ID</h4>
                      <button
                        onClick={() => copyToClipboard(applicationData.applicationId!.application_id, 'Application ID')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-lg font-mono text-gray-900 mb-2">
                      {applicationData.applicationId.application_id}
                    </p>
                    <div className="text-xs text-gray-500">
                      <p>Date: {formatDate(applicationData.applicationId.application_date)}</p>
                      <p>Created: {formatDate(applicationData.applicationId.created_at)}</p>
                    </div>
                  </div>
                )}

                {/* Security Answer */}
                {applicationData.securityAnswer && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Security Question</h4>
                      <button
                        onClick={() => copyToClipboard(applicationData.securityAnswer!.security_answer, 'Security Answer')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {applicationData.securityAnswer.security_question}
                    </p>
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-lg font-mono text-gray-900">
                        {showSecurityAnswer ? applicationData.securityAnswer.security_answer : '••••••'}
                      </p>
                      <button
                        onClick={() => setShowSecurityAnswer(!showSecurityAnswer)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showSecurityAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Created: {formatDate(applicationData.securityAnswer.created_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CAPTCHA Debug Component */}
          {/* <div className="mb-6">
            <CaptchaDebug jobId={jobId} />
          </div> */}

          {/* Progress Tracker */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Automation Progress
            </h3>
            
            <ProgressTracker
              jobId={jobId}
              onComplete={(summary) => {
                console.log('Job completed:', summary)
                // Refresh job data
                // loadData()
              }}
              onError={(error) => {
                console.error('Job error:', error)
                // Refresh job data to get updated status
                // loadData()
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
} 
