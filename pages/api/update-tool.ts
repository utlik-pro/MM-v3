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
    const { tool_id, webhook_url } = req.body

    if (!tool_id || !webhook_url) {
      return res.status(400).json({ 
        error: 'tool_id and webhook_url are required',
        usage: 'POST /api/update-tool with { tool_id: string, webhook_url: string }'
      })
    }

    console.log('🛠️ Updating tool:', { tool_id, webhook_url })

    const elevenLabsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! })

    const updateConfig = {
      name: 'SendToCRMLead',
      description: 'Send lead information to CRM system',
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

    console.log('📋 Update config:', JSON.stringify(updateConfig, null, 2))
    
    const result = await elevenLabsClient.updateTool(tool_id, updateConfig)

    console.log('📊 Update tool result:', {
      success: result.success,
      error: result.error,
      data: result.data
    })

    if (!result.success) {
      throw new Error(`Failed to update tool: ${JSON.stringify(result.error)}`)
    }

    console.log('✅ Tool updated successfully:', result.data)

    return res.status(200).json({
      success: true,
      tool: result.data,
      message: 'Tool updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating tool:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 