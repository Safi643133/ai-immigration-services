/**
 * Realtime Service
 * 
 * Manages Supabase realtime subscriptions for progress updates
 * and CAPTCHA challenges with proper connection handling.
 */

import { createClient } from '@supabase/supabase-js'
import type { 
  RealtimeEvent, 
  RealtimeEventType, 
  ProgressUpdate, 
  CaptchaChallenge,
  RealtimeServiceInterface 
} from '../progress/progress-types'

export class RealtimeService implements RealtimeServiceInterface {
  private supabase
  private subscriptions: Map<string, any> = new Map()
  private callbacks: Map<string, Set<(event: RealtimeEvent) => void>> = new Map()

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    )
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  /**
   * Subscribe to progress updates for a specific job
   */
  subscribeToProgress(jobId: string, callback: (event: RealtimeEvent) => void): () => void {
    try {
      console.log(`📡 Subscribing to progress updates for job ${jobId}`)
      
      const channelKey = `progress-${jobId}`
      
      // Add callback to the set
      if (!this.callbacks.has(channelKey)) {
        this.callbacks.set(channelKey, new Set())
      }
      this.callbacks.get(channelKey)!.add(callback)

      // Create subscription if it doesn't exist
      if (!this.subscriptions.has(channelKey)) {
        const subscription = this.supabase
          .channel(channelKey)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'ceac_progress_updates',
            filter: `job_id=eq.${jobId}`
          }, (payload) => {
            this.handleProgressUpdate(jobId, payload.new as ProgressUpdate)
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'ceac_progress_updates',
            filter: `job_id=eq.${jobId}`
          }, (payload) => {
            this.handleProgressUpdate(jobId, payload.new as ProgressUpdate)
          })
          .subscribe((status) => {
            console.log(`📡 Progress subscription status for ${jobId}:`, status)
          })

        this.subscriptions.set(channelKey, subscription)
      }

      // Return unsubscribe function
      return () => {
        this.unsubscribeCallback(channelKey, callback)
      }
    } catch (error) {
      console.error('RealtimeService.subscribeToProgress error:', error)
      throw error
    }
  }

  /**
   * Subscribe to CAPTCHA challenges for a specific job
   */
  subscribeToCaptcha(jobId: string, callback: (challenge: CaptchaChallenge) => void): () => void {
    try {
      console.log(`📡 Subscribing to CAPTCHA challenges for job ${jobId}`)
      
      const channelKey = `captcha-${jobId}`
      
      // Add callback to the set
      if (!this.callbacks.has(channelKey)) {
        this.callbacks.set(channelKey, new Set())
      }
      this.callbacks.get(channelKey)!.add(callback)

      // Create subscription if it doesn't exist
      if (!this.subscriptions.has(channelKey)) {
        const subscription = this.supabase
          .channel(channelKey)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'ceac_captcha_challenges',
            filter: `job_id=eq.${jobId}`
          }, (payload) => {
            this.handleCaptchaChallenge(jobId, payload.new as CaptchaChallenge)
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'ceac_captcha_challenges',
            filter: `job_id=eq.${jobId}`
          }, (payload) => {
            this.handleCaptchaChallenge(jobId, payload.new as CaptchaChallenge)
          })
          .subscribe((status) => {
            console.log(`📡 CAPTCHA subscription status for ${jobId}:`, status)
          })

        this.subscriptions.set(channelKey, subscription)
      }

      // Return unsubscribe function
      return () => {
        this.unsubscribeCallback(channelKey, callback)
      }
    } catch (error) {
      console.error('RealtimeService.subscribeToCaptcha error:', error)
      throw error
    }
  }

  /**
   * Unsubscribe from all events for a specific job
   */
  unsubscribe(jobId: string): void {
    try {
      console.log(`📡 Unsubscribing from all events for job ${jobId}`)
      
      const progressKey = `progress-${jobId}`
      const captchaKey = `captcha-${jobId}`
      
      // Remove progress subscription
      if (this.subscriptions.has(progressKey)) {
        const subscription = this.subscriptions.get(progressKey)
        subscription.unsubscribe()
        this.subscriptions.delete(progressKey)
        this.callbacks.delete(progressKey)
      }
      
      // Remove CAPTCHA subscription
      if (this.subscriptions.has(captchaKey)) {
        const subscription = this.subscriptions.get(captchaKey)
        subscription.unsubscribe()
        this.subscriptions.delete(captchaKey)
        this.callbacks.delete(captchaKey)
      }
      
      console.log(`✅ Unsubscribed from all events for job ${jobId}`)
    } catch (error) {
      console.error('RealtimeService.unsubscribe error:', error)
      throw error
    }
  }

  /**
   * Publish an event (for server-side use)
   */
  async publishEvent(event: RealtimeEvent): Promise<void> {
    try {
      console.log(`📤 Publishing event: ${event.type} for job ${event.job_id}`)
      
      // For server-side publishing, we can use the admin client
      // This is typically used by the worker to notify clients
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Store the event in a temporary table or use a different mechanism
      // For now, we'll just log it since the realtime system handles the rest
      console.log(`📤 Event published:`, event)
    } catch (error) {
      console.error('RealtimeService.publishEvent error:', error)
      throw error
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle progress update events
   */
  private handleProgressUpdate(jobId: string, progressUpdate: ProgressUpdate): void {
    try {
      console.log(`📡 Received progress update for job ${jobId}:`, progressUpdate.step_name)
      
      const event: RealtimeEvent = {
        type: 'progress_update',
        job_id: jobId,
        data: progressUpdate,
        timestamp: new Date().toISOString()
      }

      this.notifyCallbacks(`progress-${jobId}`, event)
    } catch (error) {
      console.error('RealtimeService.handleProgressUpdate error:', error)
    }
  }

  /**
   * Handle CAPTCHA challenge events
   */
  private handleCaptchaChallenge(jobId: string, challenge: CaptchaChallenge): void {
    try {
      console.log(`📡 Received CAPTCHA challenge for job ${jobId}:`, challenge.id)
      
      const event: RealtimeEvent = {
        type: 'captcha_challenge',
        job_id: jobId,
        data: challenge,
        timestamp: new Date().toISOString()
      }

      this.notifyCallbacks(`captcha-${jobId}`, event)
    } catch (error) {
      console.error('RealtimeService.handleCaptchaChallenge error:', error)
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Notify all callbacks for a specific channel
   */
  private notifyCallbacks(channelKey: string, event: RealtimeEvent): void {
    try {
      const callbacks = this.callbacks.get(channelKey)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(event)
          } catch (error) {
            console.error('Error in realtime callback:', error)
          }
        })
      }
    } catch (error) {
      console.error('RealtimeService.notifyCallbacks error:', error)
    }
  }

  /**
   * Unsubscribe a specific callback
   */
  private unsubscribeCallback(channelKey: string, callback: (event: RealtimeEvent) => void): void {
    try {
      const callbacks = this.callbacks.get(channelKey)
      if (callbacks) {
        callbacks.delete(callback)
        
        // If no more callbacks, remove the subscription
        if (callbacks.size === 0) {
          const subscription = this.subscriptions.get(channelKey)
          if (subscription) {
            subscription.unsubscribe()
            this.subscriptions.delete(channelKey)
          }
          this.callbacks.delete(channelKey)
        }
      }
    } catch (error) {
      console.error('RealtimeService.unsubscribeCallback error:', error)
    }
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(jobId: string): {
    progress: boolean
    captcha: boolean
  } {
    const progressKey = `progress-${jobId}`
    const captchaKey = `captcha-${jobId}`
    
    return {
      progress: this.subscriptions.has(progressKey),
      captcha: this.subscriptions.has(captchaKey)
    }
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    try {
      console.log(`🧹 Cleaning up all realtime subscriptions`)
      
      this.subscriptions.forEach((subscription, key) => {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error(`Error unsubscribing from ${key}:`, error)
        }
      })
      
      this.subscriptions.clear()
      this.callbacks.clear()
      
      console.log(`✅ All realtime subscriptions cleaned up`)
    } catch (error) {
      console.error('RealtimeService.cleanup error:', error)
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Export a singleton instance for use across the application
export const realtimeService = new RealtimeService()

// Clean up on process exit
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeService.cleanup()
  })
}

