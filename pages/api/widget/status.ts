import type { NextApiRequest, NextApiResponse } from 'next';
import widgetsConfig from '../../../config/widgets.json';
import { createDefaultElevenLabsClient } from '../../../lib/elevenlabs';

interface WidgetConfig {
  id: string;
  domain: string;
  name: string;
  enabled: boolean;
  theme: string;
  phone: string;
}

interface StatusResponse {
  enabled: boolean;
  config?: {
    theme: string;
    phone: string;
  };
  reason?: string;
}

// Cache balance check to avoid hitting ElevenLabs API on every widget load
let balanceCache: { hasBalance: boolean; timestamp: number } | null = null;
const BALANCE_CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function checkElevenLabsBalance(): Promise<boolean> {
  // Return cached result if fresh
  if (balanceCache && Date.now() - balanceCache.timestamp < BALANCE_CACHE_TTL_MS) {
    return balanceCache.hasBalance;
  }

  try {
    const client = createDefaultElevenLabsClient();
    const result = await client.getSubscription();

    if (!result.success || !result.data) {
      // Fail-open: if we can't check, assume balance is OK
      return true;
    }

    const { character_count, character_limit } = result.data;
    const hasBalance = character_count < character_limit;

    // Cache the result
    balanceCache = { hasBalance, timestamp: Date.now() };

    if (!hasBalance) {
      console.warn(
        `⚠️ ElevenLabs balance exhausted: ${character_count}/${character_limit} characters used. Widgets auto-disabled.`
      );
    }

    return hasBalance;
  } catch (error) {
    console.error('Failed to check ElevenLabs balance:', error);
    // Fail-open on error
    return true;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ enabled: true });
  }

  const domain = (req.query.domain as string) || '';

  // Find widget config by domain
  const widget = widgetsConfig.widgets.find(
    (w: WidgetConfig) => w.domain === domain || domain.endsWith(w.domain)
  );

  if (!widget) {
    // Domain not found - fail-open (show widget)
    return res.status(200).json({ enabled: true });
  }

  // If widget is manually disabled, return immediately
  if (!widget.enabled) {
    return res.status(200).json({
      enabled: false,
      config: {
        theme: widget.theme,
        phone: widget.phone
      },
      reason: 'disabled_by_admin'
    });
  }

  // Check ElevenLabs balance — auto-disable if exhausted
  const hasBalance = await checkElevenLabsBalance();

  if (!hasBalance) {
    return res.status(200).json({
      enabled: false,
      config: {
        theme: widget.theme,
        phone: widget.phone
      },
      reason: 'no_balance'
    });
  }

  return res.status(200).json({
    enabled: widget.enabled,
    config: {
      theme: widget.theme,
      phone: widget.phone
    }
  });
}
