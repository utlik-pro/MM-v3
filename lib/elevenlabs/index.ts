// ElevenLabs API Integration
export { ElevenLabsClient, createElevenLabsClient } from './client'
export * from './types'

import { ElevenLabsClient, createElevenLabsClient } from './client'

// Default client instance factory
export function createDefaultElevenLabsClient(): ElevenLabsClient {
  const apiKey = process.env.ELEVENLABS_API_KEY
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is required')
  }
  
  return createElevenLabsClient({
    apiKey,
    timeout: 30000,
    maxRetries: 3
  })
} 