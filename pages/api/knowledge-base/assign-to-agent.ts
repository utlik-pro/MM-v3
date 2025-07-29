import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentation_id } = req.body;
    const agentId = process.env.ELEVENLABS_AGENT_ID || 'agent_01jxkr0mstfk6ttayjsghjm7xc';

    if (!documentation_id) {
      return res.status(400).json({ error: 'Documentation ID is required' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}/knowledge-base/${documentation_id}`, {
      method: 'PUT',
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
        error: 'Failed to assign document to agent',
        details: errorText
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Knowledge base assign to agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 