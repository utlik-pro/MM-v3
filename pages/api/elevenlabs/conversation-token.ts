import type { NextApiRequest, NextApiResponse } from 'next';
import type { ElevenLabsConversationTokenResponse, ApiError } from '@/types/elevenlabs';

// Rate limiting setup (shared with signed-url)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = parseInt(process.env.RATE_LIMIT_REQUESTS || '100');
  const window = parseInt(process.env.RATE_LIMIT_WINDOW || '3600') * 1000;

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
  res: NextApiResponse<ElevenLabsConversationTokenResponse | ApiError>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST requests are allowed',
      statusCode: 405
    });
  }

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
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Voice Assistant API error:', response.status, errorText);
      
      return res.status(response.status).json({
        error: 'Voice Assistant API Error',
        message: 'Failed to get conversation token from Voice Assistant',
        statusCode: response.status
      });
    }

    const data = await response.json();
    
    res.status(200).json({
      token: data.token
    });

  } catch (error) {
    console.error('Error in conversation-token endpoint:', error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500
    });
  }
} 