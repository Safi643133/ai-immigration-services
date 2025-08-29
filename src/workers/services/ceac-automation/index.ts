// Export all modular components
export { BrowserManager } from './utils/BrowserManager'
export { EmbassySelectionHandler } from './handlers/EmbassySelectionHandler'
export { CaptchaHandler } from './handlers/CaptchaHandler'
export { ApplicationIdConfirmationHandler } from './handlers/ApplicationIdConfirmationHandler'
export { FormFillingHandler } from './handlers/FormFillingHandler'

// Export step handlers
export * from './steps'

export type { 
  SubmissionParams, 
  SubmissionResult, 
  StatusCheckParams, 
  StatusResult 
} from './types/interfaces'
