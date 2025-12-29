import type { NextApiRequest, NextApiResponse } from 'next';
import type { ElevenLabsSignedUrlResponse, ApiError } from '@/types/elevenlabs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Rate limiting setup
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = parseInt(process.env.RATE_LIMIT_REQUESTS || '100');
  const window = parseInt(process.env.RATE_LIMIT_WINDOW || '3600') * 1000; // Convert to ms

  const userLimit = rateLimit.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + window });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ElevenLabsSignedUrlResponse | ApiError>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST requests are allowed',
      statusCode: 405
    });
  }

  // Check rate limiting
  const clientIp = req.headers['x-forwarded-for'] as string || 
                   req.headers['x-real-ip'] as string || 
                   req.connection.remoteAddress || 
                   'unknown';

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: 429
    });
  }

  // Verify environment variables
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    console.error('Missing Voice Assistant configuration');
    return res.status(500).json({
      error: 'Configuration Error',
      message: 'Server configuration is incomplete',
      statusCode: 500
    });
  }

  // Check allowed origins (if configured and origin exists)
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
  const origin = req.headers.origin;
  
  // Only check origins if they are configured AND an origin header exists
  // This allows direct API calls and iframe embedding from same origin
  if (allowedOrigins.length > 0 && origin && !allowedOrigins.some(allowed => 
    origin === allowed || origin.includes('.vercel.app')
  )) {
    console.log('Origin check failed:', { origin, allowedOrigins });
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed',
      statusCode: 403
    });
  }

  try {
    // Make request to Voice Assistant API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const upstreamBody = await response.text();
      console.error('Voice Assistant API error:', response.status, upstreamBody);

      // Optional fallback check via curl in development for richer diagnostics
      let curlDebug: { stdout?: string; stderr?: string } | undefined;
      if (process.env.NODE_ENV !== 'production') {
        try {
          const curlCmd = `curl -s -i -H "xi-api-key: ${apiKey}" "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}"`;
          const { stdout, stderr } = await execAsync(curlCmd);
          // Truncate to avoid oversized payloads
          curlDebug = {
            stdout: stdout?.slice(0, 4000),
            stderr: stderr?.slice(0, 4000)
          };
        } catch (e) {
          curlDebug = { stderr: String(e).slice(0, 1000) };
        }
      }

      const payload: any = {
        error: 'Voice Assistant API Error',
        message: 'Failed to get signed URL from Voice Assistant',
        statusCode: response.status
      };
      if (process.env.NODE_ENV !== 'production') {
        payload.dev = {
          upstreamBody,
          curl: curlDebug
        };
      }
      return res.status(response.status).json(payload);
    }

    const data = await response.json();

    // Check if WebSocket proxy is configured
    const wsProxyUrl = process.env.WS_PROXY_URL;

    if (wsProxyUrl) {
      // Return proxied URL - browser connects to our proxy instead of ElevenLabs directly
      const proxiedUrl = `${wsProxyUrl}?url=${encodeURIComponent(data.signed_url)}`;
      console.log('Using WebSocket proxy:', wsProxyUrl);

      res.status(200).json({
        signed_url: proxiedUrl,
        proxied: true
      });
    } else {
      // Return direct ElevenLabs URL (may not work in sanctioned countries)
      res.status(200).json({
        signed_url: data.signed_url,
        proxied: false
      });
    }

  } catch (error) {
    console.error('Error in signed-url endpoint:', error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500
    });
  }
} 