/**
 * Progress Bar Component
 * 
 * A beautiful, animated progress bar component for displaying
 * CEAC automation progress with status indicators.
 */

'use client'

import React from 'react'
import type { ProgressStatus } from '@/lib/progress/progress-types'

interface ProgressBarProps {
  percentage: number
  status: ProgressStatus
  showPercentage?: boolean
  showStatus?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ProgressBar({
  percentage,
  status,
  showPercentage = true,
  showStatus = true,
  size = 'md',
  className = ''
}: ProgressBarProps) {
  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage))

  // Get status color and icon
  const getStatusConfig = (status: ProgressStatus) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-600',
          icon: '⏳',
          label: 'Pending'
        }
      case 'initializing':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-600',
          icon: '🚀',
          label: 'Initializing'
        }
      case 'running':
        return {
          color: 'bg-blue-600',
          textColor: 'text-blue-700',
          icon: '⚡',
          label: 'Running'
        }
      case 'waiting_for_captcha':
        return {
          color: 'bg-orange-500',
          textColor: 'text-orange-600',
          icon: '🤖',
          label: 'CAPTCHA Required'
        }
      case 'captcha_solved':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-600',
          icon: '✅',
          label: 'CAPTCHA Solved'
        }
      case 'completed':
        return {
          color: 'bg-green-600',
          textColor: 'text-green-700',
          icon: '🎉',
          label: 'Completed'
        }
      case 'failed':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-600',
          icon: '❌',
          label: 'Failed'
        }
      case 'cancelled':
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-500',
          icon: '⏹️',
          label: 'Cancelled'
        }
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-600',
          icon: '❓',
          label: 'Unknown'
        }
    }
  }

  const statusConfig = getStatusConfig(status)

  // Get size classes
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-2',
          text: 'text-xs',
          icon: 'text-sm'
        }
      case 'md':
        return {
          container: 'h-3',
          text: 'text-sm',
          icon: 'text-base'
        }
      case 'lg':
        return {
          container: 'h-4',
          text: 'text-base',
          icon: 'text-lg'
        }
      default:
        return {
          container: 'h-3',
          text: 'text-sm',
          icon: 'text-base'
        }
    }
  }

  const sizeClasses = getSizeClasses(size)

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className={`relative w-full ${sizeClasses.container} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`${statusConfig.color} h-full rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${clampedPercentage}%` }}
        >
          {/* Animated shimmer effect for running status */}
          {status === 'running' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          )}
        </div>
      </div>

      {/* Status and Percentage */}
      <div className="flex items-center justify-between">
        {/* Status */}
        {showStatus && (
          <div className="flex items-center space-x-2">
            <span className={sizeClasses.icon}>{statusConfig.icon}</span>
            <span className={`font-medium ${statusConfig.textColor} ${sizeClasses.text}`}>
              {statusConfig.label}
            </span>
          </div>
        )}

        {/* Percentage */}
        {showPercentage && (
          <span className={`font-semibold ${statusConfig.textColor} ${sizeClasses.text}`}>
            {clampedPercentage}%
          </span>
        )}
      </div>
    </div>
  )
}
