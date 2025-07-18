import type { NextApiRequest, NextApiResponse } from 'next';
import type { ElevenLabsSignedUrlResponse, ApiError } from '@/types/elevenlabs';

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
    console.error('Missing ElevenLabs configuration');
    return res.status(500).json({
      error: 'Configuration Error',
      message: 'Server configuration is incomplete',
      statusCode: 500
    });
  }

  // Check allowed origins (if configured)
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const origin = req.headers.origin;
  
  if (allowedOrigins.length > 0 && origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed',
      statusCode: 403
    });
  }

  try {
    // Make request to ElevenLabs API
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
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      return res.status(response.status).json({
        error: 'ElevenLabs API Error',
        message: 'Failed to get signed URL from ElevenLabs',
        statusCode: response.status
      });
    }

    const data = await response.json();
    
    // Return the signed URL
    res.status(200).json({
      signed_url: data.signed_url
    });

  } catch (error) {
    console.error('Error in signed-url endpoint:', error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500
    });
  }
} 