/**
 * Progress Hook
 * 
 * React hook for managing progress tracking with real-time updates using Server-Sent Events (SSE).
 * Eliminates the need for continuous API polling by using HTTP streaming.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { 
  ProgressSummary, 
  ProgressUpdate, 
  CaptchaChallenge
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
  
  // SSE
  isStreaming: boolean
  lastUpdate: string | null
}

export function useProgress(options: UseProgressOptions = {}): UseProgressReturn {
  const { 
    jobId, 
    enableRealtime = true, 
    pollInterval = 10000 // Increased to reduce polling frequency
  } = options

  // State
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [history, setHistory] = useState<ProgressUpdate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null)
  const initialFetchDoneRef = useRef(false)

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
        initialFetchDoneRef.current = true
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
  // SSE STREAMING
  // ============================================================================

  const setupSSEStream = useCallback(() => {
    if (!jobId || !enableRealtime) return

    try {
      console.log(`📡 Setting up SSE stream for job ${jobId}`)
      
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Create new EventSource connection
      const eventSource = new EventSource(`/api/ceac/progress?jobId=${jobId}&stream=true`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log(`📡 SSE connection opened for job ${jobId}`)
        setIsStreaming(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 Received SSE progress event:', data)
          setLastUpdate(new Date().toISOString())

          if (data.type === 'progress_update' || data.type === 'job_completed') {
            const { summary, history } = data.data
            
            setSummary(summary)
            setHistory(history)
            
            console.log('📡 Updated progress via SSE:', summary)
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error)
        setIsStreaming(false)
        eventSource.close()
      }

      console.log(`✅ SSE stream established for job ${jobId}`)
    } catch (error) {
      console.error('❌ Error setting up SSE stream:', error)
      setIsStreaming(false)
    }
  }, [jobId, enableRealtime])

  const cleanupSSEStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsStreaming(false)
    console.log(`📡 SSE stream cleaned up for job ${jobId}`)
  }, [jobId])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial fetch only once
  useEffect(() => {
    if (jobId && !initialFetchDoneRef.current) {
      console.log(`📊 Initial progress fetch for job ${jobId}`)
      fetchProgress()
    }
  }, [jobId, fetchProgress])

  // Setup SSE streaming
  useEffect(() => {
    if (jobId) {
      if (enableRealtime) {
        console.log(`📡 Enabling SSE streaming for job ${jobId}`)
        setupSSEStream()
      } else {
        console.log(`🔄 SSE streaming disabled for job ${jobId}`)
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

  const refreshProgress = useCallback(async () => {
    console.log(`🔄 Manual progress refresh for job ${jobId}`)
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
    
    // SSE
    isStreaming,
    lastUpdate
  }
}

