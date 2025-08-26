/**
 * CAPTCHA Image Component
 * 
 * Displays CAPTCHA challenge image with refresh functionality
 * and loading states.
 */

'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface CaptchaImageProps {
  imageUrl: string
  jobId?: string
  onRefresh?: () => void
  loading?: boolean
  className?: string
}

export default function CaptchaImage({
  imageUrl,
  jobId,
  onRefresh,
  loading = false,
  className = ''
}: CaptchaImageProps) {
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Determine the correct image URL
  const getImageUrl = (url: string) => {
    // If it's a Supabase Storage URL, use it directly
    if (url.includes('supabase.co') && url.includes('storage')) {
      return url
    }
    
    // If it's a local screenshot path (starts with artifacts/)
    if (url.startsWith('artifacts/') && jobId) {
      return `/api/captcha-screenshot/${jobId}`
    }
    
    // If it's a CEAC URL, use our proxy (fallback)
    if (url.includes('ceac.state.gov')) {
      return `/api/captcha-proxy?url=${encodeURIComponent(url)}`
    }
    
    // If it's already a full URL, use it as is
    if (url.startsWith('http')) {
      return url
    }
    
    // Default fallback
    return url
  }
  
  const displayImageUrl = getImageUrl(imageUrl)
  console.log('🖼️ CaptchaImage render - Original URL:', imageUrl)
  console.log('🖼️ CaptchaImage render - Display URL:', displayImageUrl)
  console.log('🖼️ CaptchaImage render - Loading state:', loading || imageLoading)
  console.log('🖼️ CaptchaImage render - Error state:', imageError)

  const handleImageLoad = () => {
    console.log('✅ CAPTCHA image loaded successfully:', displayImageUrl)
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    console.log('❌ CAPTCHA image failed to load:', displayImageUrl)
    setImageLoading(false)
    setImageError(true)
  }

  const handleRefresh = () => {
    if (onRefresh) {
      setImageLoading(true)
      setImageError(false)
      onRefresh()
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          CAPTCHA Challenge
        </h3>

      </div>

      {/* Image Container */}
      <div className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4">
        {loading || imageLoading ? (
          // Loading State
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading CAPTCHA...</span>
            </div>
          </div>
        ) : imageError ? (
          // Error State
          <div className="flex flex-col items-center justify-center h-32 space-y-2">
            <span className="text-4xl">❌</span>
            <span className="text-gray-600 text-sm">Failed to load CAPTCHA</span>
            {onRefresh && (
              <button
                onClick={handleRefresh}
                className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        ) : (
          // Image Display
          <div className="flex justify-center">
            <Image
              key={displayImageUrl} // Force re-render when URL changes
              src={displayImageUrl}
              alt="CAPTCHA Challenge"
              width={200}
              height={80}
              className="max-h-32 max-w-full rounded border border-gray-200"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ imageRendering: 'crisp-edges' }} // Better for CAPTCHA images
              unoptimized={true} // Skip Next.js image optimization for external images
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-3 text-sm text-gray-600">
        <p className="font-medium mb-1">Instructions:</p>
        <ul className="space-y-1 text-xs">
          <li>• Look at the image above and enter the characters you see</li>
          <li>• Characters are case-sensitive</li>
          <li>• If the image is unclear, click "Refresh" to get a new one</li>
          <li>• You have 5 minutes to solve the CAPTCHA</li>
        </ul>
      </div>
    </div>
  )
}

