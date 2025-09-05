import type { NextApiRequest, NextApiResponse } from 'next'
import { ElevenLabsClient } from '../../lib/elevenlabs/client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, description, webhook_url } = req.body

    if (!name || !webhook_url) {
      return res.status(400).json({ 
        error: 'name and webhook_url are required',
        usage: 'POST /api/create-tool with { name: string, description?: string, webhook_url: string }'
      })
    }

    console.log('🛠️ Creating tool:', { name, description, webhook_url })

    const elevenLabsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! })

    const toolConfig = {
      name,
      description: description || `Tool for ${name}`,
      webhook: {
        url: webhook_url,
        method: 'POST' as const,
        headers: {
          'Content-Type': 'application/json'
        },
        request_body_schema: {
          type: 'object',
          properties: {
            FullName: {
              type: 'string',
              description: 'Full name of the lead'
            },
            Phone: {
              type: 'string',
              description: 'Phone number of the lead'
            },
            Commentary: {
              type: 'string',
              description: 'Additional comments about the lead'
            },
            UsrMinskMir: {
              type: 'string',
              description: 'Project information'
            },
            conversation_id: {
              type: 'string',
              description: 'ElevenLabs conversation ID'
            },
            agent_id: {
              type: 'string',
              description: 'Agent ID'
            },
            tool_call_id: {
              type: 'string',
              description: 'Tool call ID'
            }
          },
          required: ['FullName', 'Phone']
        }
      }
    }

    console.log('📋 Tool config:', JSON.stringify(toolConfig, null, 2))
    
    const result = await elevenLabsClient.createTool(toolConfig)

    console.log('📊 Create tool result:', {
      success: result.success,
      error: result.error,
      data: result.data
    })

    if (!result.success) {
      throw new Error(`Failed to create tool: ${JSON.stringify(result.error)}`)
    }

    console.log('✅ Tool created successfully:', result.data)

    return res.status(200).json({
      success: true,
      tool: result.data,
      message: 'Tool created successfully'
    })

  } catch (error) {
    console.error('❌ Error creating tool:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 