/**
 * Progress Hook
 * 
 * React hook for managing progress tracking with API integration
 * and real-time updates using Supabase realtime.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { realtimeService } from '@/lib/realtime/realtime-service'
import type { 
  ProgressSummary, 
  ProgressUpdate, 
  CaptchaChallenge,
  RealtimeEvent 
} from '@/lib/progress/progress-types'

interface UseProgressOptions {
  jobId?: string
  enableRealtime?: boolean
  pollInterval?: number
}

interface UseProgressReturn {
  // State
  summary: ProgressSummary | null
  history: ProgressUpdate[]
  loading: boolean
  error: string | null
  
  // Actions
  refreshProgress: () => Promise<void>
  updateProgress: (update: Partial<ProgressUpdate>) => Promise<void>
  
  // Realtime
  isRealtimeConnected: boolean
  lastEvent: RealtimeEvent | null
}

export function useProgress(options: UseProgressOptions = {}): UseProgressReturn {
  const { 
    jobId, 
    enableRealtime = true, 
    pollInterval = 5000 
  } = options

  // State
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [history, setHistory] = useState<ProgressUpdate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)

  // Refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  const fetchProgress = useCallback(async () => {
    if (!jobId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/ceac/progress?jobId=${jobId}&includeHistory=true`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setSummary(data.data.summary)
        setHistory(data.data.history || [])
      } else {
        throw new Error(data.error || 'Failed to fetch progress')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching progress:', err)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  const updateProgress = useCallback(async (update: Partial<ProgressUpdate>) => {
    if (!jobId) return

    try {
      const response = await fetch(`/api/ceac/progress/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(update)
      })

      if (!response.ok) {
        throw new Error(`Failed to update progress: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Refresh progress after update
        await fetchProgress()
      } else {
        throw new Error(data.error || 'Failed to update progress')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error updating progress:', err)
    }
  }, [jobId, fetchProgress])

  // ============================================================================
  // REALTIME SUBSCRIPTION
  // ============================================================================

  const setupRealtimeSubscription = useCallback(() => {
    if (!jobId || !enableRealtime) return

    try {
      // Subscribe to progress updates
      const unsubscribe = realtimeService.subscribeToProgress(jobId, (event: RealtimeEvent) => {
        console.log('📡 Received progress event:', event)
        setLastEvent(event)
        setIsRealtimeConnected(true)

        if (event.type === 'progress_update') {
          const progressUpdate = event.data as ProgressUpdate
          
          // Update history
          setHistory(prev => [...prev, progressUpdate])
          
          // Update summary if this is the latest update
          setSummary(prev => {
            if (!prev || new Date(progressUpdate.created_at) > new Date(prev.last_update)) {
              return {
                job_id: progressUpdate.job_id,
                current_step: progressUpdate.step_name,
                current_status: progressUpdate.status,
                progress_percentage: progressUpdate.progress_percentage,
                total_steps: 17,
                completed_steps: 0, // This would need to be calculated
                last_update: progressUpdate.created_at,
                needs_captcha: progressUpdate.needs_captcha,
                captcha_image: progressUpdate.captcha_image
              }
            }
            return prev
          })
        }
      })

      unsubscribeRef.current = unsubscribe
      setIsRealtimeConnected(true)
      
      console.log(`📡 Realtime subscription established for job ${jobId}`)
    } catch (error) {
      console.error('Error setting up realtime subscription:', error)
      setIsRealtimeConnected(false)
    }
  }, [jobId, enableRealtime])

  const cleanupRealtimeSubscription = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    setIsRealtimeConnected(false)
    console.log(`📡 Realtime subscription cleaned up for job ${jobId}`)
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
      fetchProgress()
    }, pollInterval)

    console.log(`🔄 Started polling for job ${jobId} every ${pollInterval}ms`)
  }, [jobId, enableRealtime, pollInterval, fetchProgress])

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
      console.log(`🔄 Stopped polling for job ${jobId}`)
    }
  }, [jobId])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial fetch
  useEffect(() => {
    if (jobId) {
      fetchProgress()
    }
  }, [jobId, fetchProgress])

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

  const refreshProgress = useCallback(async () => {
    await fetchProgress()
  }, [fetchProgress])

  return {
    // State
    summary,
    history,
    loading,
    error,
    
    // Actions
    refreshProgress,
    updateProgress,
    
    // Realtime
    isRealtimeConnected,
    lastEvent
  }
}

