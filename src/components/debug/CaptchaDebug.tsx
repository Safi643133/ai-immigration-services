/**
 * CAPTCHA Debug Component
 * 
 * Debug component to help troubleshoot CAPTCHA issues
 */

'use client'

import React, { useState, useEffect } from 'react'

interface CaptchaDebugProps {
  jobId: string
}

export default function CaptchaDebug({ jobId }: CaptchaDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugInfo = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Test CAPTCHA API directly
      const captchaResponse = await fetch(`/api/ceac/captcha?jobId=${jobId}`)
      const captchaData = await captchaResponse.json()
      
      // Test progress API
      const progressResponse = await fetch(`/api/ceac/progress?jobId=${jobId}`)
      const progressData = await progressResponse.json()
      
      setDebugInfo({
        jobId,
        timestamp: new Date().toISOString(),
        captcha: {
          status: captchaResponse.status,
          data: captchaData
        },
        progress: {
          status: progressResponse.status,
          data: progressData
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (jobId) {
      fetchDebugInfo()
    }
  }, [jobId])

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        🔍 CAPTCHA Debug Info
      </h3>
      
      <div className="space-y-2 text-black">
        <div>
          <strong>Job ID:</strong> {jobId}
        </div>
        
        {loading && (
          <div className="text-yellow-600">Loading debug info...</div>
        )}
        
        {error && (
          <div className="text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {debugInfo && (
          <div className="space-y-3">
            <div>
              <strong>Timestamp:</strong> {debugInfo.timestamp}
            </div>
            
            <div>
              <strong>CAPTCHA API:</strong>
              <div className="ml-4 text-sm">
                <div>Status: {debugInfo.captcha.status}</div>
                <div>Data: {JSON.stringify(debugInfo.captcha.data, null, 2)}</div>
              </div>
            </div>
            
            <div>
              <strong>Progress API:</strong>
              <div className="ml-4 text-sm">
                <div>Status: {debugInfo.progress.status}</div>
                <div>Data: {JSON.stringify(debugInfo.progress.data, null, 2)}</div>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={fetchDebugInfo}
          disabled={loading}
          className="mt-2 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50"
        >
          Refresh Debug Info
        </button>
      </div>
    </div>
  )
}
