import type { NextApiRequest, NextApiResponse } from 'next'
import { createDefaultElevenLabsClient } from '../../../lib/elevenlabs'

interface BalanceResponse {
  hasBalance: boolean
  characterCount: number
  characterLimit: number
  usagePercent: number
  tier: string
  status: string
  error?: string
}

// Cache balance check for 60 seconds to avoid excessive API calls
let cachedBalance: { data: BalanceResponse; timestamp: number } | null = null
const CACHE_TTL_MS = 60 * 1000

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      hasBalance: true,
      characterCount: 0,
      characterLimit: 0,
      usagePercent: 0,
      tier: 'unknown',
      status: 'unknown',
      error: 'Method not allowed'
    })
  }

  // Return cached result if fresh
  if (cachedBalance && Date.now() - cachedBalance.timestamp < CACHE_TTL_MS) {
    return res.status(200).json(cachedBalance.data)
  }

  try {
    const client = createDefaultElevenLabsClient()
    const result = await client.getSubscription()

    if (!result.success || !result.data) {
      // On error, fail-open (assume balance is OK)
      return res.status(200).json({
        hasBalance: true,
        characterCount: 0,
        characterLimit: 0,
        usagePercent: 0,
        tier: 'unknown',
        status: 'error',
        error: result.error?.message || 'Failed to check subscription'
      })
    }

    const { character_count, character_limit, tier, status } = result.data
    const usagePercent = character_limit > 0
      ? Math.round((character_count / character_limit) * 100)
      : 0
    const hasBalance = character_count < character_limit

    const data: BalanceResponse = {
      hasBalance,
      characterCount: character_count,
      characterLimit: character_limit,
      usagePercent,
      tier,
      status
    }

    // Cache the result
    cachedBalance = { data, timestamp: Date.now() }

    return res.status(200).json(data)
  } catch (error) {
    // Fail-open on unexpected errors
    return res.status(200).json({
      hasBalance: true,
      characterCount: 0,
      characterLimit: 0,
      usagePercent: 0,
      tier: 'unknown',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
