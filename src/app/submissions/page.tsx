'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FileText, Download, Eye, Calendar, User, Send, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
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

export default function SubmissionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<SubmissionWithTemplate[]>([])
  const [ceacJobs, setCeacJobs] = useState<Record<string, CeacJob[]>>({})
  const [loading, setLoading] = useState(true)
  const [submittingTo, setSubmittingTo] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && !authLoading) {
      loadSubmissions()
      loadCeacJobs()
    }
  }, [user, authLoading, router])

  const loadSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (submissionId: string, templateName: string) => {
    try {
      const response = await fetch(`/api/forms/export-pdf?submissionId=${submissionId}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${templateName.replace(/\s+/g, '-').toLowerCase()}-${submissionId}.pdf`
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

  const loadCeacJobs = async () => {
    try {
      const response = await fetch('/api/ceac/jobs')
      if (response.ok) {
        const data = await response.json()
        const jobsMap: Record<string, CeacJob[]> = {}
        data.jobs.forEach((job: any) => {
          const submissionId = job.submission_id
          if (!jobsMap[submissionId]) {
            jobsMap[submissionId] = []
          }
          jobsMap[submissionId].push({
            id: job.id,
            status: job.status,
            createdAt: job.created_at,
            applicationId: job.ceac_application_id,
            confirmationId: job.ceac_confirmation_id,
            embassy: job.embassy_location,
            retryCount: job.retry_count
          })
        })
        
        // Sort jobs by creation date (newest first)
        Object.keys(jobsMap).forEach(submissionId => {
          jobsMap[submissionId].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        })
        
        setCeacJobs(jobsMap)
      }
    } catch (error) {
      console.error('Error loading CEAC jobs:', error)
    }
  }

  const handleSubmitToCeac = async (submissionId: string) => {
    setSubmittingTo(prev => ({ ...prev, [submissionId]: true }))
    
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
          status: 'queued',
          createdAt: data.job.created_at,
          embassy: data.job.embassy_location
        }
        
        setCeacJobs(prev => ({
          ...prev,
          [submissionId]: [newJob, ...(prev[submissionId] || [])]
        }))
        alert('DS-160 form submitted to CEAC! You can track the progress below.')
      } else {
        const error = await response.json()
        alert(`Failed to submit to CEAC: ${error.error}`)
      }
    } catch (error) {
      console.error('Error submitting to CEAC:', error)
      alert('Failed to submit to CEAC')
    } finally {
      setSubmittingTo(prev => ({ ...prev, [submissionId]: false }))
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
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'completed':
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submissions...</p>
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
                onClick={() => router.push('/forms')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Forms
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Form Submissions
            </h2>
            <p className="text-gray-600">
              View and download your previously generated forms
            </p>
          </div>

          {submissions.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No submissions yet
              </h3>
              <p className="text-gray-500 mb-4">
                You haven't generated any forms yet. Start by filling out a form.
              </p>
              <button
                onClick={() => router.push('/forms')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Go to Forms
              </button>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Submissions ({submissions.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <div key={submission.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <FileText className="h-8 w-8 text-indigo-600" />
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {submission.form_templates.name}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(submission.created_at)}</span>
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
                          onClick={() => handleDownloadPDF(submission.id, submission.form_templates.name)}
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center space-x-1 text-sm"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download PDF</span>
                        </button>
                        
                        {submission.form_templates.form_type === 'ds160' && (
                          <>
                            <div className="space-y-2">
                              {/* Always show submit button */}
                              <button
                                onClick={() => handleSubmitToCeac(submission.id)}
                                disabled={submittingTo[submission.id]}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1 text-sm"
                              >
                                {submittingTo[submission.id] ? (
                                  <Clock className="h-4 w-4 animate-spin text-white" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                                <span>
                                  {submittingTo[submission.id] 
                                    ? 'Submitting...' 
                                    : (ceacJobs[submission.id]?.length > 0 ? 'Resubmit to CEAC' : 'Submit to CEAC')
                                  }
                                </span>
                              </button>
                              
                              {/* Show all CEAC jobs for this submission */}
                              {ceacJobs[submission.id] && ceacJobs[submission.id].length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-600">CEAC Submissions:</div>
                                  {ceacJobs[submission.id].slice(0, 3).map((job, index) => (
                                    <div key={job.id} className="flex items-center space-x-2 px-2 py-1 rounded-md bg-gray-50 text-xs">
                                      {getCeacStatusIcon(job.status)}
                                      <span className="font-medium">{getCeacStatusText(job.status)}</span>
                                      {job.embassy && (
                                        <span className="text-gray-600">• {job.embassy}</span>
                                      )}
                                      {job.applicationId && (
                                        <span className="text-gray-600">• ID: {job.applicationId}</span>
                                      )}
                                      <span className="text-gray-500">• {formatDate(job.createdAt)}</span>
                                      {index === 0 && <span className="text-blue-600 font-medium">Latest</span>}
                                    </div>
                                  ))}
                                  {ceacJobs[submission.id].length > 3 && (
                                    <div className="text-xs text-gray-500 px-2">
                                      +{ceacJobs[submission.id].length - 3} more submissions...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 