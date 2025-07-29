import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentation_id, model = 'multilingual_e5_large_instruct' } = req.body;

    if (!documentation_id) {
      return res.status(400).json({ error: 'Documentation ID is required' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentation_id}/rag-index`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to compute RAG index',
        details: errorText
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Compute RAG index error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 