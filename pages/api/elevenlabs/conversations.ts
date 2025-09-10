import type { NextApiRequest, NextApiResponse } from 'next'
import { createDefaultElevenLabsClient } from '../../../lib/elevenlabs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
    const pageSize = req.query.page_size ? Number(req.query.page_size) : 20

    const agentId = process.env.ELEVENLABS_AGENT_ID || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_8901k4s5hkbkf7gsf1tk5r0a4g8t'

    const client = createDefaultElevenLabsClient()
    const result = await client.listConversations({
      agent_id: agentId || undefined,
      cursor,
      page_size: pageSize
    })

    if (!result.success) {
      return res.status(502).json({ error: 'Upstream error', details: result.error })
    }

    return res.status(200).json(result.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return res.status(500).json({ error: 'Internal error', details: message })
  }
}


