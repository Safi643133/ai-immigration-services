'use client'

import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import type { FormValidationResult, CeacJobStatus } from '@/lib/types/ceac'

interface FormValidationStatusProps {
  validationResult?: FormValidationResult | null
  submissionReference?: string
  ceacSubmissionStatus?: CeacJobStatus | null
  completionPercentage?: number
  onValidate?: () => void
  onSubmitToCeac?: () => void
}

export default function FormValidationStatus({
  validationResult,
  submissionReference,
  ceacSubmissionStatus,
  completionPercentage = 0,
  onValidate,
  onSubmitToCeac
}: FormValidationStatusProps) {
  
  const getValidationIcon = () => {
    if (!validationResult) return <Clock className="w-5 h-5 text-gray-400" />
    
    if (validationResult.isComplete) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (validationResult.validationErrors.some(e => e.severity === 'error')) {
      return <XCircle className="w-5 h-5 text-red-500" />
    } else {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getValidationStatus = () => {
    if (!validationResult) return 'Not validated'
    
    if (validationResult.isComplete) {
      return 'Valid - Ready for submission'
    } else {
      const errorCount = validationResult.validationErrors.filter(e => e.severity === 'error').length
      const warningCount = validationResult.validationErrors.filter(e => e.severity === 'warning').length
      
      return `${errorCount} error(s), ${warningCount} warning(s)`
    }
  }

  const getCeacStatusColor = (status: CeacJobStatus) => {
    switch (status) {
      case 'succeeded': return 'text-green-600 bg-green-100'
      case 'running': return 'text-blue-600 bg-blue-100'
      case 'queued': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'needs_human': return 'text-orange-600 bg-orange-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Form Status</h3>
        {submissionReference && (
          <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
            {submissionReference}
          </span>
        )}
      </div>

      {/* Completion Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Completion Progress</span>
          <span className="font-medium">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Validation Status */}
      <div className="flex items-center space-x-3">
        {getValidationIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Validation Status</p>
          <p className="text-sm text-gray-600">{getValidationStatus()}</p>
        </div>
        {onValidate && (
          <button
            onClick={onValidate}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Validate
          </button>
        )}
      </div>

      {/* Validation Errors */}
      {validationResult && validationResult.validationErrors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Issues Found:</h4>
          <div className="space-y-1">
            {validationResult.validationErrors.slice(0, 5).map((error, index) => (
              <div key={index} className={`text-xs p-2 rounded ${
                error.severity === 'error' 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                <span className="font-medium">{error.field}:</span> {error.message}
              </div>
            ))}
            {validationResult.validationErrors.length > 5 && (
              <p className="text-xs text-gray-500">
                +{validationResult.validationErrors.length - 5} more issues
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {validationResult && validationResult.recommendedActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Recommended Actions:</h4>
          <ul className="space-y-1">
            {validationResult.recommendedActions.map((action, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CEAC Submission Status */}
      {ceacSubmissionStatus && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">CEAC Submission</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCeacStatusColor(ceacSubmissionStatus)}`}>
                {ceacSubmissionStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {ceacSubmissionStatus === 'running' && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-xs text-gray-600">Processing...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit to CEAC Button */}
      {validationResult?.readinessForSubmission && !ceacSubmissionStatus && onSubmitToCeac && (
        <div className="border-t pt-4">
          <button
            onClick={onSubmitToCeac}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            Submit to CEAC
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Form is complete and ready for automated submission to the official CEAC website.
          </p>
        </div>
      )}

      {/* Confidence Score */}
      {validationResult && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Data Confidence</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    validationResult.confidenceScore >= 0.8 
                      ? 'bg-green-500' 
                      : validationResult.confidenceScore >= 0.6 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${validationResult.confidenceScore * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round(validationResult.confidenceScore * 100)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Based on auto-filled data from uploaded documents
          </p>
        </div>
      )}

      {/* Last Validation */}
      {validationResult?.validatedAt && (
        <div className="text-xs text-gray-500 border-t pt-2">
          Last validated: {new Date(validationResult.validatedAt).toLocaleString()}
        </div>
      )}
    </div>
  )
}
