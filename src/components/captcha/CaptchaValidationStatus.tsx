import React from 'react'
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react'

interface CaptchaValidationStatusProps {
  status: 'idle' | 'validating' | 'validated' | 'failed' | 'new_captcha'
  errorMessage?: string
  attemptCount?: number
  className?: string
}

export default function CaptchaValidationStatus({
  status,
  errorMessage,
  attemptCount = 0,
  className = ''
}: CaptchaValidationStatusProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'validating':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          text: 'Validating CAPTCHA...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case 'validated':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'CAPTCHA validated successfully!',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'failed':
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: `CAPTCHA validation failed (attempt ${attemptCount})`,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'new_captcha':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'New CAPTCHA loaded - please try again',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        }
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Enter CAPTCHA solution',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  if (status === 'idle') {
    return null
  }

  return (
    <div className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} border rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className={statusDisplay.color}>
          {statusDisplay.icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${statusDisplay.color}`}>
            {statusDisplay.text}
          </p>
          {errorMessage && status === 'failed' && (
            <p className="text-xs text-red-500 mt-1">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
