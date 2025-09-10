import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cursor, page_size = 30, search, show_only_owned_documents = false } = req.query;

    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor as string);
    if (page_size) params.append('page_size', page_size as string);
    if (search) params.append('search', search as string);
    if (show_only_owned_documents) params.append('show_only_owned_documents', show_only_owned_documents as string);

    const agentId = process.env.ELEVENLABS_AGENT_ID || 'agent_8901k4s5hkbkf7gsf1tk5r0a4g8t';
    // Add agent_id to filter results for our agent
    params.append('agent_id', agentId);
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base?${params}`, {
      method: 'GET',
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
        error: 'Failed to fetch knowledge base documents',
        details: errorText
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Knowledge base list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 