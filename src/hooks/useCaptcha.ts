/**
 * CAPTCHA Hook
 * 
 * React hook for managing CAPTCHA challenges and solutions
 * with API integration and real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { realtimeService } from '@/lib/realtime/realtime-service'
import type { 
  CaptchaChallenge, 
  RealtimeEvent 
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
  refreshChallenge: () => Promise<void>
  solveCaptcha: (solution: string) => Promise<boolean>
  refreshCaptcha: () => Promise<void>
  
  // Realtime
  isRealtimeConnected: boolean
  lastEvent: RealtimeEvent | null
}

export function useCaptcha(options: UseCaptchaOptions = {}): UseCaptchaReturn {
  const { 
    jobId, 
    enableRealtime = true, 
    pollInterval = 3000 
  } = options

  // State
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [solving, setSolving] = useState(false)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)

  // Refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

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
    if (!jobId || !solution.trim()) return false

    try {
      setSolving(true)
      setError(null)

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
        setChallenge(null) // Clear the challenge since it's solved
        return true
      } else {
        throw new Error(data.error || 'Failed to solve CAPTCHA')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error solving CAPTCHA:', err)
      return false
    } finally {
      setSolving(false)
    }
  }, [jobId])

  const refreshCaptchaImage = useCallback(async () => {
    if (!jobId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/ceac/captcha/${jobId}/refresh`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`Failed to refresh CAPTCHA: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setChallenge(data.data)
        console.log('🔄 CAPTCHA refreshed successfully')
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
  // REALTIME SUBSCRIPTION
  // ============================================================================

  const setupRealtimeSubscription = useCallback(() => {
    if (!jobId || !enableRealtime) return

    try {
      // Subscribe to CAPTCHA challenges
      const unsubscribe = realtimeService.subscribeToCaptcha(jobId, (captchaChallenge: CaptchaChallenge) => {
        console.log('📡 Received CAPTCHA challenge:', captchaChallenge)
        setLastEvent({
          type: 'captcha_challenge',
          job_id: jobId,
          data: captchaChallenge,
          timestamp: new Date().toISOString()
        })
        setIsRealtimeConnected(true)

        // Update challenge if it's not solved
        if (!captchaChallenge.solved) {
          setChallenge(captchaChallenge)
        } else {
          setChallenge(null) // Clear if solved
        }
      })

      unsubscribeRef.current = unsubscribe
      setIsRealtimeConnected(true)
      
      console.log(`📡 CAPTCHA realtime subscription established for job ${jobId}`)
    } catch (error) {
      console.error('Error setting up CAPTCHA realtime subscription:', error)
      setIsRealtimeConnected(false)
    }
  }, [jobId, enableRealtime])

  const cleanupRealtimeSubscription = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    setIsRealtimeConnected(false)
    console.log(`📡 CAPTCHA realtime subscription cleaned up for job ${jobId}`)
  }, [jobId])

  // ============================================================================
  // POLLING
  // ============================================================================

  const startPolling = useCallback(() => {
    if (!jobId || enableRealtime) return

    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    // Start new polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchChallenge()
    }, pollInterval)

    console.log(`🔄 Started CAPTCHA polling for job ${jobId} every ${pollInterval}ms`)
  }, [jobId, enableRealtime, pollInterval, fetchChallenge])

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
      console.log(`🔄 Stopped CAPTCHA polling for job ${jobId}`)
    }
  }, [jobId])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial fetch
  useEffect(() => {
    if (jobId) {
      fetchChallenge()
    }
  }, [jobId, fetchChallenge])

  // Setup realtime or polling
  useEffect(() => {
    if (jobId) {
      if (enableRealtime) {
        setupRealtimeSubscription()
        stopPolling() // Stop polling if realtime is enabled
      } else {
        cleanupRealtimeSubscription() // Clean up realtime if polling is enabled
        startPolling()
      }
    }

    // Cleanup on unmount or jobId change
    return () => {
      cleanupRealtimeSubscription()
      stopPolling()
    }
  }, [jobId, enableRealtime, setupRealtimeSubscription, cleanupRealtimeSubscription, startPolling, stopPolling])

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  const refreshChallenge = useCallback(async () => {
    await fetchChallenge()
  }, [fetchChallenge])

  const solveCaptcha = useCallback(async (solution: string): Promise<boolean> => {
    return await submitSolution(solution)
  }, [submitSolution])

  const refreshCaptcha = useCallback(async () => {
    await refreshCaptchaImage()
  }, [refreshCaptchaImage])

  return {
    // State
    challenge,
    loading,
    error,
    solving,
    
    // Actions
    refreshChallenge,
    solveCaptcha,
    refreshCaptcha,
    
    // Realtime
    isRealtimeConnected,
    lastEvent
  }
}

