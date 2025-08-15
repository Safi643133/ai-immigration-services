'use client'

import React from 'react'

interface SimpleProgressProps {
  status: string
  message: string
  showCaptcha?: boolean
  captchaImage?: string
  onCaptchaSolved?: (solution: string) => void
}

export default function SimpleProgress({ 
  status, 
  message, 
  showCaptcha = false,
  captchaImage,
  onCaptchaSolved 
}: SimpleProgressProps) {
  const [captchaSolution, setCaptchaSolution] = React.useState('')

  const handleSubmitCaptcha = () => {
    if (captchaSolution.trim() && onCaptchaSolved) {
      onCaptchaSolved(captchaSolution.trim())
      setCaptchaSolution('')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'waiting':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <div className="space-y-4">
        {/* Status */}
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${getStatusColor(status)}`}>
            {status.toUpperCase()}
          </h3>
          <p className="text-gray-600 mt-2">{message}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              status === 'running' ? 'bg-blue-600' : 
              status === 'completed' ? 'bg-green-600' : 
              status === 'error' ? 'bg-red-600' : 'bg-gray-400'
            }`}
            style={{ 
              width: status === 'running' ? '50%' : 
                     status === 'completed' ? '100%' : 
                     status === 'error' ? '100%' : '25%' 
            }}
          ></div>
        </div>

        {/* CAPTCHA Section */}
        {showCaptcha && captchaImage && (
          <div className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-medium mb-3">Solve CAPTCHA</h4>
            
            {/* CAPTCHA Image */}
            <div className="text-center mb-4">
              <img
                src={captchaImage}
                alt="CAPTCHA"
                className="border border-gray-300 rounded mx-auto"
                style={{ maxHeight: '60px' }}
              />
            </div>

            {/* CAPTCHA Input */}
            <div className="space-y-3">
              <input
                type="text"
                value={captchaSolution}
                onChange={(e) => setCaptchaSolution(e.target.value)}
                placeholder="Enter CAPTCHA code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={10}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitCaptcha()}
              />
              
              <button
                onClick={handleSubmitCaptcha}
                disabled={!captchaSolution.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit CAPTCHA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
