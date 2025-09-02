/**
 * Progress Status Component
 * 
 * Displays detailed progress information including current step,
 * status, and step details for CEAC automation.
 */

'use client'

import React from 'react'
import type { ProgressSummary, ProgressStep } from '@/lib/progress/progress-types'

interface ProgressStatusProps {
  summary: ProgressSummary
  showDetails?: boolean
  className?: string
}

export default function ProgressStatus({
  summary,
  showDetails = true,
  className = ''
}: ProgressStatusProps) {
  // Get step display information
  const getStepInfo = (step: ProgressStep) => {
    switch (step) {
      case 'job_created':
        return {
          title: 'Job Created',
          description: 'CEAC automation job has been created and queued',
          icon: '📋'
        }
      case 'browser_initialized':
        return {
          title: 'Browser Initialized',
          description: 'Automation browser has been started',
          icon: '🌐'
        }
      case 'navigating_to_ceac':
        return {
          title: 'Navigating to CEAC',
          description: 'Navigating to the official CEAC website',
          icon: '🧭'
        }
      case 'embassy_selected':
        return {
          title: 'Embassy Selected',
          description: 'Embassy location has been selected',
          icon: '🏛️'
        }
      case 'captcha_detected':
        return {
          title: 'CAPTCHA Detected',
          description: 'CAPTCHA challenge detected - waiting for solution',
          icon: '🤖'
        }
      case 'form_filling_started':
        return {
          title: 'Form Filling Started',
          description: 'Beginning to fill the DS-160 form',
          icon: '📝'
        }
      case 'form_step_1':
        return {
          title: 'Step 1: Personal Information',
          description: 'Filling personal information section',
          icon: '👤'
        }
      case 'form_step_2':
        return {
          title: 'Step 2: Personal Information - Part 2',
          description: 'Filling additional personal information',
          icon: '📋'
        }
      case 'form_step_3':
        return {
          title: 'Step 3: Purpose of Trip',
          description: 'Filling purpose of trip and visa information',
          icon: '✈️'
        }
      case 'form_step_4':
        return {
          title: 'Step 4: Travel Information',
          description: 'Filling travel plans and companions',
          icon: '🗺️'
        }
      case 'form_step_5':
        return {
          title: 'Step 5: U.S. Travel History',
          description: 'Filling previous U.S. travel information',
          icon: '🏛️'
        }
      case 'form_step_6':
        return {
          title: 'Step 6: Address and Phone',
          description: 'Filling address and contact information',
          icon: '📍'
        }
      case 'form_step_7':
        return {
          title: 'Step 7: Passport Information',
          description: 'Filling passport details',
          icon: '📖'
        }
      case 'form_step_8':
        return {
          title: 'Step 8: Contact Information',
          description: 'Filling U.S. contact information',
          icon: '📞'
        }
      case 'form_step_9':
        return {
          title: 'Step 9: Family Information',
          description: 'Filling family member information',
          icon: '👨‍👩‍👧‍👦'
        }
      case 'form_step_10':
        return {
          title: 'Step 10: Work/Education/Training',
          description: 'Filling work and education information',
          icon: '💼'
        }
      case 'form_step_11':
        return {
          title: 'Step 11: Security and Background',
          description: 'Filling security and background information',
          icon: '🔒'
        }
      case 'form_step_12':
        return {
          title: 'Step 12: Additional Information',
          description: 'Filling additional information section',
          icon: '📄'
        }
      case 'form_step_13':
        return {
          title: 'Step 13: Review',
          description: 'Reviewing all form information',
          icon: '👀'
        }
      case 'form_step_14':
        return {
          title: 'Step 14: Photo Upload',
          description: 'Uploading passport photo',
          icon: '📷'
        }
      case 'form_step_15':
        return {
          title: 'Step 15: Review and Submit',
          description: 'Final review and submission',
          icon: '✅'
        }
      case 'form_step_16':
        return {
          title: 'Step 16: Confirmation',
          description: 'Processing submission confirmation',
          icon: '📋'
        }
      case 'form_step_17':
        return {
          title: 'Step 17: Application Complete',
          description: 'Application submission completed',
          icon: '🎉'
        }
      case 'form_review':
        return {
          title: 'Form Review',
          description: 'Reviewing completed form before submission',
          icon: '🔍'
        }
      case 'form_submitted':
        return {
          title: 'Form Submitted',
          description: 'DS-160 form has been submitted to CEAC',
          icon: '📤'
        }
      case 'application_id_extracted':
        return {
          title: 'Application ID Extracted',
          description: 'CEAC application ID has been retrieved',
          icon: '🆔'
        }
      case 'confirmation_id_extracted':
        return {
          title: 'Confirmation ID Extracted',
          description: 'CEAC confirmation ID has been retrieved',
          icon: '✅'
        }
      case 'job_completed':
        return {
          title: 'Job Completed',
          description: 'CEAC automation has been completed successfully',
          icon: '🎉'
        }
      default:
        return {
          title: 'Running',
          description: 'Processing automation step',
          icon: '⚡'
        }
    }
  }

  const stepInfo = getStepInfo(summary.current_step)

  // Format last update time
  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Current Step */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-2xl">{stepInfo.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {stepInfo.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {stepInfo.description}
          </p>
        </div>
      </div>

      {/* Progress Details */}
      {showDetails && (
        <div className="mt-4 space-y-3">
          {/* Progress Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Progress:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {summary.progress_percentage}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Steps:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {summary.completed_steps} / {summary.total_steps}
              </span>
            </div>
          </div>

          {/* Last Update */}
          <div className="text-sm text-gray-500">
            Last updated: {formatLastUpdate(summary.last_update)}
          </div>

          {/* CAPTCHA Status */}
          {summary.needs_captcha && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <span className="text-orange-600">🤖</span>
                <span className="text-orange-800 font-medium">
                  CAPTCHA Required
                </span>
              </div>
              <p className="text-orange-700 text-sm mt-1">
                Please solve the CAPTCHA to continue the automation.
              </p>
            </div>
          )}

          {/* Estimated Completion */}
          {summary.estimated_completion && (
            <div className="text-sm text-gray-500">
              Estimated completion: {new Date(summary.estimated_completion).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

