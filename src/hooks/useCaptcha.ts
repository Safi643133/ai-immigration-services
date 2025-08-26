/**
 * CAPTCHA Hook
 * 
 * React hook for managing CAPTCHA challenges with real-time updates using Server-Sent Events (SSE).
 * Eliminates the need for continuous API polling by using HTTP streaming.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { 
  CaptchaChallenge
} from '@/lib/progress/progress-types'

interface UseCaptchaOptions {
  jobId?: string
  enableRealtime?: boolean
  pollInterval?: number
}

interface UseCaptchaReturn {
  // State
  challenge: CaptchaChallenge | null
  loading: boolean
  error: string | null
  solving: boolean
  
  // Actions
  solveCaptcha: (solution: string) => Promise<boolean>
  refreshCaptcha: () => Promise<void>
  
  // SSE
  isStreaming: boolean
  lastUpdate: string | null
  
  // Validation Status
  validationStatus: 'idle' | 'validating' | 'validated' | 'failed' | 'new_captcha'
  validationError: string | null
  attemptCount: number
}

export function useCaptcha(options: UseCaptchaOptions = {}): UseCaptchaReturn {
  const { 
    jobId, 
    enableRealtime = true, 
    pollInterval = 10000 // Increased to reduce polling frequency
  } = options

  // State
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [solving, setSolving] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  
  // Validation Status
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'validated' | 'failed' | 'new_captcha'>('idle')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null)
  const initialFetchDoneRef = useRef(false)

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  const fetchChallenge = useCallback(async () => {
    if (!jobId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/ceac/captcha?jobId=${jobId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CAPTCHA challenge: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setChallenge(data.data)
        initialFetchDoneRef.current = true
      } else {
        throw new Error(data.error || 'Failed to fetch CAPTCHA challenge')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching CAPTCHA challenge:', err)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  const submitSolution = useCallback(async (solution: string): Promise<boolean> => {
    if (!jobId) return false

    try {
      setSolving(true)
      setError(null)
      setValidationStatus('validating')

      const response = await fetch(`/api/ceac/captcha/${jobId}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ solution: solution.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to solve CAPTCHA: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        console.log('✅ CAPTCHA solved successfully')
        setValidationStatus('validated')
        setChallenge(null) // Clear the challenge since it's solved
        return true
      } else {
        // CAPTCHA was wrong
        setValidationStatus('failed')
        setValidationError(data.error || 'CAPTCHA validation failed')
        setAttemptCount(prev => prev + 1)
        throw new Error(data.error || 'Failed to solve CAPTCHA')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setValidationStatus('failed')
      setValidationError(errorMessage)
      setAttemptCount(prev => prev + 1)
      console.error('Error solving CAPTCHA:', err)
      return false
    } finally {
      setSolving(false)
    }
  }, [jobId])

  const refreshCaptchaImage = useCallback(async (): Promise<void> => {
    if (!jobId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/ceac/captcha/${jobId}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to refresh CAPTCHA: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        console.log('🔄 CAPTCHA refreshed successfully')
        // The realtime system will automatically update the challenge
      } else {
        throw new Error(data.error || 'Failed to refresh CAPTCHA')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error refreshing CAPTCHA:', err)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  // ============================================================================
  // SSE STREAMING
  // ============================================================================

  const setupSSEStream = useCallback(() => {
    if (!jobId || !enableRealtime) return

    try {
      console.log(`📡 Setting up CAPTCHA SSE stream for job ${jobId}`)
      
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Create new EventSource connection for CAPTCHA updates
      const eventSource = new EventSource(`/api/ceac/progress?jobId=${jobId}&stream=true`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log(`📡 CAPTCHA SSE connection opened for job ${jobId}`)
        setIsStreaming(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 Received SSE CAPTCHA event:', data)
          setLastUpdate(new Date().toISOString())

          if (data.type === 'progress_update' || data.type === 'job_completed') {
            const { summary, history } = data.data
            
            // Check if there's a new CAPTCHA challenge
            if (summary.needs_captcha && summary.captcha_image) {
              // Check if this is a new CAPTCHA (different from current one)
              setChallenge(prev => {
                if (!prev || prev.image_url !== summary.captcha_image) {
                  const newChallenge: CaptchaChallenge = {
                    id: `captcha-${Date.now()}`, // Generate temporary ID
                    job_id: jobId,
                    image_url: summary.captcha_image,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
                    solved: false,
                    input_selector: '#ctl00_SiteContentPlaceHolder_txtCode',
                    submit_selector: '#ctl00_SiteContentPlaceHolder_btnSubmit'
                  }
                  
                  // If this is a new challenge after a failed attempt, update validation status
                  if (prev) {
                    setValidationStatus('new_captcha')
                    setValidationError(null)
                    setAttemptCount(prev => prev + 1)
                  }
                  
                  console.log('📡 New CAPTCHA challenge detected via SSE:', newChallenge)
                  return newChallenge
                }
                return prev
              })
            }
          }
        } catch (error) {
          console.error('❌ Error parsing SSE CAPTCHA message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('❌ CAPTCHA SSE connection error:', error)
        setIsStreaming(false)
        eventSource.close()
      }

      console.log(`✅ CAPTCHA SSE stream established for job ${jobId}`)
    } catch (error) {
      console.error('❌ Error setting up CAPTCHA SSE stream:', error)
      setIsStreaming(false)
    }
  }, [jobId, enableRealtime])

  const cleanupSSEStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsStreaming(false)
    console.log(`📡 CAPTCHA SSE stream cleaned up for job ${jobId}`)
  }, [jobId])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial fetch only once
  useEffect(() => {
    if (jobId && !initialFetchDoneRef.current) {
      console.log(`📊 Initial CAPTCHA fetch for job ${jobId}`)
      fetchChallenge()
    }
  }, [jobId, fetchChallenge])

  // Setup SSE streaming
  useEffect(() => {
    if (jobId) {
      if (enableRealtime) {
        console.log(`📡 Enabling CAPTCHA SSE streaming for job ${jobId}`)
        setupSSEStream()
      } else {
        console.log(`🔄 CAPTCHA SSE streaming disabled for job ${jobId}`)
        cleanupSSEStream()
      }
    }

    // Cleanup on unmount or jobId change
    return () => {
      cleanupSSEStream()
    }
  }, [jobId, enableRealtime, setupSSEStream, cleanupSSEStream])

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  const refreshCaptcha = useCallback(async () => {
    console.log(`🔄 Manual CAPTCHA refresh for job ${jobId}`)
    await refreshCaptchaImage()
  }, [refreshCaptchaImage])

  return {
    // State
    challenge,
    loading,
    error,
    solving,
    
    // Actions
    solveCaptcha: submitSolution,
    refreshCaptcha,
    
    // SSE
    isStreaming,
    lastUpdate,
    
    // Validation Status
    validationStatus,
    validationError,
    attemptCount
  }
}

