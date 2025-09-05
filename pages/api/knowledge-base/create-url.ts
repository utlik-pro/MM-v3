import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, name } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const agentId = process.env.ELEVENLABS_AGENT_ID || 'agent_2001k4cgbmjhebd92cbzn8fk2zmk';
    const response = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base/url', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        name: name || null,
        agent_id: agentId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to create knowledge base document from URL',
        details: errorText
      });
    }

    const data = await response.json();
    
    // Compute RAG index for the document to make it available for agents
    if (data.id) {
      try {
        const ragResponse = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${data.id}/rag-index`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'multilingual_e5_large_instruct'
          }),
        });
        
                 if (ragResponse.ok) {
           const ragData = await ragResponse.json();
           console.log('RAG index computed for URL document:', ragData);
           
           // Add document to agent configuration
           if (ragData.status === 'succeeded') {
             try {
               const addToAgentResponse = await fetch('http://localhost:3001/api/knowledge-base/add-to-agent', {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({
                   document_id: data.id,
                   document_name: data.name,
                   document_type: 'url'
                 }),
               });
               
               if (addToAgentResponse.ok) {
                 console.log('URL document automatically added to agent');
               }
             } catch (agentError) {
               console.log('Failed to add URL document to agent automatically:', agentError);
             }
           }
         } else {
           console.log('Failed to compute RAG index for URL, but document created');
         }
      } catch (ragError) {
        console.log('RAG index error for URL (document still created):', ragError);
      }
    }
    
    res.status(200).json(data);

  } catch (error) {
    console.error('Knowledge base create URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 