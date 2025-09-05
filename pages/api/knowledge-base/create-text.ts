import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, name } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const agentId = process.env.ELEVENLABS_AGENT_ID || 'agent_2001k4cgbmjhebd92cbzn8fk2zmk';
    const response = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base/text', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        name: name || null,
        agent_id: agentId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to create knowledge base document from text',
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
           console.log('RAG index computed for document:', ragData);
           
           // Add document to agent configuration
           if (ragData.status === 'succeeded') {
             try {
               // Get current agent configuration and update it directly
               const getAgentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
                 method: 'GET',
                 headers: {
                   'Accept': 'application/json',
                   'xi-api-key': process.env.ELEVENLABS_API_KEY!,
                 },
               });
               
               if (getAgentResponse.ok) {
                 const agentConfig = await getAgentResponse.json();
                 const existingKnowledgeBase = agentConfig.conversation_config.agent.prompt.knowledge_base || [];
                 const documentExists = existingKnowledgeBase.some((doc: any) => doc.id === data.id);
                 
                 if (!documentExists) {
                   const updatedKnowledgeBase = [...existingKnowledgeBase, {
                     type: 'text',
                     name: data.name,
                     id: data.id,
                     usage_mode: 'auto'
                   }];
                   
                   const updateData = {
                     conversation_config: {
                       agent: {
                         prompt: {
                           knowledge_base: updatedKnowledgeBase
                         }
                       }
                     }
                   };
                   
                   const addToAgentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
                     method: 'PATCH',
                     headers: {
                       'Accept': 'application/json',
                       'xi-api-key': process.env.ELEVENLABS_API_KEY!,
                       'Content-Type': 'application/json',
                     },
                     body: JSON.stringify(updateData),
                                        });
                   
                   if (addToAgentResponse.ok) {
                     console.log('Document automatically added to agent');
                   }
                 }
               }
             } catch (agentError) {
               console.log('Failed to add document to agent automatically:', agentError);
             }
           }
         } else {
           console.log('Failed to compute RAG index, but document created');
         }
      } catch (ragError) {
        console.log('RAG index error (document still created):', ragError);
      }
    }
    
    res.status(200).json(data);

  } catch (error) {
    console.error('Knowledge base create text error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 