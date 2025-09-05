import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentation_id } = req.query;

    if (!documentation_id) {
      return res.status(400).json({ error: 'Documentation ID is required' });
    }

    const agentId = process.env.ELEVENLABS_AGENT_ID || 'agent_2001k4cgbmjhebd92cbzn8fk2zmk';
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentation_id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to delete knowledge base document',
        details: errorText
      });
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Knowledge base delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 