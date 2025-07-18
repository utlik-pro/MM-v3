import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const debug = {
    method: req.method,
    headers: {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for']
    },
    env: {
      hasApiKey: !!process.env.ELEVENLABS_API_KEY,
      hasAgentId: !!process.env.ELEVENLABS_AGENT_ID,
      allowedOrigins: process.env.ALLOWED_ORIGINS,
      nodeEnv: process.env.NODE_ENV
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(debug);
} 