import type { NextApiRequest, NextApiResponse } from 'next'

type HealthPayload = {
  status: 'ok' | 'error'
  timestamp: string
  environment: string
  checks: {
    env: {
      apiKey: boolean
      agentId: boolean
    }
    upstream?: {
      signedUrl?: {
        ok: boolean
        status?: number
        bodyPreview?: string
      }
      token?: {
        ok: boolean
        status?: number
        bodyPreview?: string
      }
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthPayload>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        env: { apiKey: false, agentId: false }
      }
    })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  const agentId = process.env.ELEVENLABS_AGENT_ID

  const payload: HealthPayload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      env: {
        apiKey: !!apiKey,
        agentId: !!agentId
      },
      upstream: {}
    }
  }

  // Only probe upstream if env is present
  if (apiKey && agentId) {
    try {
      const r1 = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' }
      })
      const text1 = await r1.text()
      payload.checks.upstream!.signedUrl = {
        ok: r1.ok,
        status: r1.status,
        bodyPreview: process.env.NODE_ENV !== 'production' ? text1.slice(0, 300) : undefined
      }
      if (!r1.ok) payload.status = 'error'
    } catch (e) {
      payload.checks.upstream!.signedUrl = { ok: false }
      payload.status = 'error'
    }

    try {
      const r2 = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' }
      })
      const text2 = await r2.text()
      payload.checks.upstream!.token = {
        ok: r2.ok,
        status: r2.status,
        bodyPreview: process.env.NODE_ENV !== 'production' ? text2.slice(0, 300) : undefined
      }
      if (!r2.ok) payload.status = 'error'
    } catch (e) {
      payload.checks.upstream!.token = { ok: false }
      payload.status = 'error'
    }
  } else {
    payload.status = 'error'
  }

  return res.status(payload.status === 'ok' ? 200 : 500).json(payload)
}


