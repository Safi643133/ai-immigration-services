/**
 * CAPTCHA Input Component
 * 
 * Input component for CAPTCHA solutions with validation
 * and submission functionality.
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import CaptchaValidationStatus from './CaptchaValidationStatus'

interface CaptchaInputProps {
  onSubmit: (solution: string) => Promise<boolean>
  onCancel?: () => void
  loading?: boolean
  error?: string | null
  validationStatus?: 'idle' | 'validating' | 'validated' | 'failed' | 'new_captcha'
  validationError?: string | null
  attemptCount?: number
  className?: string
}

export default function CaptchaInput({
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  validationStatus = 'idle',
  validationError = null,
  attemptCount = 0,
  className = ''
}: CaptchaInputProps) {
  const [solution, setSolution] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Clear local error when external error changes
  useEffect(() => {
    if (error) {
      setLocalError(error)
    }
  }, [error])

  // Clear input when new CAPTCHA is loaded
  useEffect(() => {
    if (validationStatus === 'new_captcha') {
      setSolution('')
      setLocalError(null)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }, [validationStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate input
    if (!solution.trim()) {
      setLocalError('Please enter the CAPTCHA solution')
      return
    }

    if (solution.trim().length < 3) {
      setLocalError('CAPTCHA solution is too short')
      return
    }

    if (solution.trim().length > 10) {
      setLocalError('CAPTCHA solution is too long')
      return
    }

    // Submit solution
    try {
      setIsSubmitting(true)
      setLocalError(null)
      
      const success = await onSubmit(solution.trim())
      
      if (success) {
        setSolution('')
        setLocalError(null)
      } else {
        setLocalError('Incorrect CAPTCHA solution. Please try again.')
        // Focus input for retry
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }
    } catch (err) {
      setLocalError('Failed to submit CAPTCHA solution. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSolution(e.target.value)
    if (localError) {
      setLocalError(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const isDisabled = loading || isSubmitting

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            CAPTCHA Verification Required
          </h3>
          <p className="text-sm text-gray-600">
            Please enter the characters you see in the image below
          </p>
        </div>

        {/* Validation Status */}
        <CaptchaValidationStatus
          status={validationStatus}
          errorMessage={validationError || undefined}
          attemptCount={attemptCount}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Field */}
          <div>
            <label htmlFor="captcha-solution" className="block text-sm font-medium text-gray-700 mb-2">
              CAPTCHA Solution
            </label>
            <input
              ref={inputRef}
              id="captcha-solution"
              type="text"
              value={solution}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
              placeholder="Enter the characters you see..."
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              maxLength={10}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the characters exactly as you see them (case-sensitive)
            </p>
          </div>

          {/* Error Display */}
          {localError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">❌</span>
                <span className="text-red-800 text-sm font-medium">
                  {localError}
                </span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {!localError && !loading && !isSubmitting && validationStatus === 'idle' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">💡</span>
                <span className="text-green-800 text-sm">
                  Tip: Look carefully at each character. Some may be similar (like 0 and O, 1 and l).
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isDisabled}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Validating...</span>
                </>
              ) : (
                <span>Submit Solution</span>
              )}
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isDisabled}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

