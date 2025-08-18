/**
 * Progress Tracker Component
 * 
 * Main component that combines progress tracking and CAPTCHA solving
 * with real-time updates using Supabase realtime.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { useCaptcha } from '@/hooks/useCaptcha'
import ProgressBar from './ProgressBar'
import ProgressStatus from './ProgressStatus'
import CaptchaImage from '../captcha/CaptchaImage'
import CaptchaInput from '../captcha/CaptchaInput'
import type { ProgressSummary } from '@/lib/progress/progress-types'

interface ProgressTrackerProps {
  jobId: string
  onComplete?: (summary: ProgressSummary) => void
  onError?: (error: string) => void
  className?: string
}

export default function ProgressTracker({
  jobId,
  onComplete,
  onError,
  className = ''
}: ProgressTrackerProps) {
  // Progress tracking
  const {
    summary,
    history,
    loading: progressLoading,
    error: progressError,
    refreshProgress,
    isRealtimeConnected
  } = useProgress({ jobId, enableRealtime: true })

  // CAPTCHA handling
  const {
    challenge,
    loading: captchaLoading,
    error: captchaError,
    solving,
    solveCaptcha,
    refreshCaptcha
  } = useCaptcha({ jobId, enableRealtime: true })

  // Local state
  const [showCaptchaInput, setShowCaptchaInput] = useState(false)

  // Handle progress completion
  useEffect(() => {
    if (summary && summary.current_status === 'completed' && onComplete) {
      onComplete(summary)
    }
  }, [summary, onComplete])

  // Handle errors
  useEffect(() => {
    if (progressError && onError) {
      onError(progressError)
    }
  }, [progressError, onError])

  useEffect(() => {
    if (captchaError && onError) {
      onError(captchaError)
    }
  }, [captchaError, onError])

  // Show CAPTCHA input when challenge is available or progress indicates CAPTCHA is needed
  useEffect(() => {
    if ((challenge && !challenge.solved) || (summary?.needs_captcha && summary?.captcha_image)) {
      setShowCaptchaInput(true)
    } else {
      setShowCaptchaInput(false)
    }
  }, [challenge, summary])

  // Handle CAPTCHA solution submission
  const handleCaptchaSubmit = async (solution: string): Promise<boolean> => {
    try {
      const success = await solveCaptcha(solution)
      if (success) {
        setShowCaptchaInput(false)
        // Refresh progress after successful CAPTCHA solution
        await refreshProgress()
      }
      return success
    } catch (error) {
      console.error('Error submitting CAPTCHA solution:', error)
      return false
    }
  }

  // Handle CAPTCHA refresh
  const handleCaptchaRefresh = async () => {
    try {
      await refreshCaptcha()
    } catch (error) {
      console.error('Error refreshing CAPTCHA:', error)
    }
  }

  // Loading state
  if (progressLoading && !summary) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading progress...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (progressError && !summary) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 text-red-600">
          <span className="text-xl">❌</span>
          <div>
            <h3 className="font-semibold">Error Loading Progress</h3>
            <p className="text-sm text-red-500">{progressError}</p>
          </div>
        </div>
        <button
          onClick={refreshProgress}
          className="mt-4 px-4 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // No summary available
  if (!summary) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <span className="text-xl">📋</span>
          <p className="mt-2">No progress information available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            CEAC Automation Progress
          </h2>
          <div className="flex items-center space-x-2">
            {/* Realtime Status */}
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-500">
                {isRealtimeConnected ? 'Live' : 'Polling'}
              </span>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={refreshProgress}
              disabled={progressLoading}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Refresh progress"
            >
              <span className="text-sm">🔄</span>
            </button>
          </div>
        </div>

        <ProgressBar
          percentage={summary.progress_percentage}
          status={summary.current_status}
          size="lg"
        />
      </div>

      {/* Progress Status */}
      <ProgressStatus
        summary={summary}
        showDetails={true}
      />

      {/* CAPTCHA Section */}
      {(challenge && !challenge.solved) || (summary.needs_captcha && summary.captcha_image) ? (
        <div className="space-y-4">
          {/* Debug Info */}
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            <div>Challenge ID: {challenge?.id || 'None'}</div>
            <div>Challenge Image URL: {challenge?.image_url || 'None'}</div>
            <div>Challenge Solved: {challenge?.solved ? 'Yes' : 'No'}</div>
            <div>Summary Needs CAPTCHA: {summary.needs_captcha ? 'Yes' : 'No'}</div>
            <div>Summary CAPTCHA Image: {summary.captcha_image || 'None'}</div>
          </div>
          
          {/* CAPTCHA Image */}
          <CaptchaImage
            imageUrl={challenge?.image_url || summary.captcha_image || ''}
            onRefresh={handleCaptchaRefresh}
            loading={captchaLoading}
          />

          {/* CAPTCHA Input */}
          {showCaptchaInput && (
            <CaptchaInput
              onSubmit={handleCaptchaSubmit}
              loading={solving}
              error={captchaError}
            />
          )}
        </div>
      ) : null}

      {/* Progress History (Optional) */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recent Updates
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {history.slice(-5).reverse().map((update, index) => (
              <div key={index} className="flex items-start space-x-3 text-sm">
                <span className="text-gray-400">
                  {new Date(update.created_at).toLocaleTimeString()}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-900">{update.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Job ID: {jobId.slice(0, 8)}...
          </span>
          <span>
            {isRealtimeConnected ? '🟢 Real-time connected' : '🟡 Polling mode'}
          </span>
        </div>
      </div>
    </div>
  )
}

