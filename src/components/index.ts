/**
 * Component Exports
 * 
 * Central export file for all progress and CAPTCHA components
 */

// Progress Components
export { default as ProgressBar } from './progress/ProgressBar'
export { default as ProgressStatus } from './progress/ProgressStatus'
export { default as ProgressTracker } from './progress/ProgressTracker'

// CAPTCHA Components
export { default as CaptchaImage } from './captcha/CaptchaImage'
export { default as CaptchaInput } from './captcha/CaptchaInput'

// Hooks
export { useProgress } from '@/hooks/useProgress'
export { useCaptcha } from '@/hooks/useCaptcha'

// Types
export type {
  ProgressSummary,
  ProgressUpdate,
  ProgressStatus as ProgressStatusType,
  ProgressStep,
  CaptchaChallenge,
  CaptchaSolution,
  RealtimeEvent
} from '@/lib/progress/progress-types'
