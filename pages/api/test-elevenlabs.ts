import { NextApiRequest, NextApiResponse } from 'next'
import { createDefaultElevenLabsClient } from '../../lib/elevenlabs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 Testing ElevenLabs API connection...')
    
    // Create client instance
    const client = createDefaultElevenLabsClient()
    
    // Perform health check
    const healthResult = await client.healthCheck()
    
    if (!healthResult.success) {
      return res.status(500).json({
        success: false,
        message: 'ElevenLabs API health check failed',
        error: healthResult.error,
        timestamp: new Date().toISOString()
      })
    }
    
    // Try to fetch conversations (with pagination limit)
    const conversationsResult = await client.listConversations({
      page_size: 5,
      agent_id: process.env.ELEVENLABS_AGENT_ID
    })
    
    if (!conversationsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
        error: conversationsResult.error,
        timestamp: new Date().toISOString()
      })
    }
    
    // Try to fetch tools
    const toolsResult = await client.listTools()
    
    // Get rate limit info
    const rateLimitInfo = client.getRateLimitInfo()
    
    console.log('✅ ElevenLabs API connection successful')
    
    return res.status(200).json({
      success: true,
      message: 'ElevenLabs API connection successful',
      data: {
        health_status: healthResult.data?.status,
        conversations_count: conversationsResult.data?.conversations?.length || 0,
        has_more_conversations: conversationsResult.data?.has_more || false,
        tools_count: toolsResult.success ? toolsResult.data?.tools?.length || 0 : 'failed to fetch',
        rate_limit: rateLimitInfo
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ ElevenLabs API test failed:', error)
    return res.status(500).json({
      success: false,
      message: 'ElevenLabs API test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 