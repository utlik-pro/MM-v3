import type { NextApiRequest, NextApiResponse } from 'next'
import { smartLinkConversation } from '../../lib/smart-linking'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { lead_id } = req.body

    if (!lead_id) {
      return res.status(400).json({ error: 'lead_id is required' })
    }

    const result = await smartLinkConversation(lead_id)

    if (result.success) {
      return res.status(200).json(result)
    } else {
      return res.status(404).json(result)
    }

  } catch (error) {
    console.error('❌ Smart linking API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 