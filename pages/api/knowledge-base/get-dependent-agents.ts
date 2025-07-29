import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentation_id, cursor, page_size = 30 } = req.query;

    if (!documentation_id) {
      return res.status(400).json({ error: 'Documentation ID is required' });
    }

    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor as string);
    if (page_size) params.append('page_size', page_size as string);

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentation_id}/dependent-agents?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to get dependent agents',
        details: errorText
      });
    }

    const data = await response.json();
    
    // Check if our specific agent is in the list
    const ourAgentId = process.env.ELEVENLABS_AGENT_ID || 'agent_01jxkr0mstfk6ttayjsghjm7xc';
    const isAttachedToOurAgent = data.agents?.some((agent: any) => agent.id === ourAgentId) || false;
    
    res.status(200).json({
      ...data,
      is_attached_to_our_agent: isAttachedToOurAgent,
      our_agent_id: ourAgentId
    });

  } catch (error) {
    console.error('Get dependent agents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 