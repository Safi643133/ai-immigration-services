/**
 * CAPTCHA Input Component
 * 
 * Input component for CAPTCHA solutions with validation
 * and submission functionality.
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'

interface CaptchaInputProps {
  onSubmit: (solution: string) => Promise<boolean>
  onCancel?: () => void
  loading?: boolean
  error?: string | null
  className?: string
}

export default function CaptchaInput({
  onSubmit,
  onCancel,
  loading = false,
  error = null,
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
    const value = e.target.value
    // Only allow alphanumeric characters and common symbols
    const sanitizedValue = value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '')
    setSolution(sanitizedValue)
    
    // Clear error when user starts typing
    if (localError) {
      setLocalError(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const isDisabled = loading || isSubmitting

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Enter CAPTCHA Solution
        </h3>
        {onCancel && (
          <button
            onClick={handleCancel}
            disabled={isDisabled}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>

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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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
        {!localError && !loading && !isSubmitting && (
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
        <div className="flex items-center justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isDisabled}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isDisabled || !solution.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              'Submit Solution'
            )}
          </button>
        </div>
      </form>

      {/* Keyboard Shortcuts */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Keyboard shortcuts:</span> Press Enter to submit, Escape to cancel
        </p>
      </div>
    </div>
  )
}
