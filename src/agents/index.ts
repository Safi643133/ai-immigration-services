import { DocumentExtractionAgent } from './document-extraction/agent'
import { ExtractionContext, ExtractionResult, AgentConfig } from './types/extraction'

// Singleton instance of the document extraction agent
let extractionAgent: DocumentExtractionAgent | null = null

/**
 * Initialize the document extraction agent with configuration
 */
export const initializeAgent = (config: Partial<AgentConfig> = {}): DocumentExtractionAgent => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  extractionAgent = new DocumentExtractionAgent(config)
  console.log('Document extraction agent initialized with config:', extractionAgent.getConfig())
  
  return extractionAgent
}

/**
 * Get the current document extraction agent instance
 */
export const getExtractionAgent = (): DocumentExtractionAgent => {
  if (!extractionAgent) {
    throw new Error('Document extraction agent not initialized. Call initializeAgent() first.')
  }
  return extractionAgent
}

/**
 * Extract document using the LangChain agent
 */
export const extractDocumentWithAgent = async (context: ExtractionContext): Promise<ExtractionResult> => {
  const agent = getExtractionAgent()
  return await agent.extractDocument(context)
}

/**
 * Update agent configuration
 */
export const updateAgentConfig = (config: Partial<AgentConfig>): void => {
  const agent = getExtractionAgent()
  agent.updateConfig(config)
  console.log('Agent configuration updated:', agent.getConfig())
}

/**
 * Get current agent configuration
 */
export const getAgentConfig = (): AgentConfig => {
  const agent = getExtractionAgent()
  return agent.getConfig()
}

// Export types for external use
export * from './types/extraction'
export * from './types/templates'
export * from './utils/validation'
export { DocumentExtractionAgent } 