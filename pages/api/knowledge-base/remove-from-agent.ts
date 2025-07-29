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

    // First, get the current agent configuration
    const getAgentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
    });

    if (!getAgentResponse.ok) {
      const errorText = await getAgentResponse.text();
      return res.status(getAgentResponse.status).json({ 
        error: 'Failed to get agent configuration',
        details: errorText
      });
    }

    const agentConfig = await getAgentResponse.json();
    
    // Remove document from knowledge base
    const existingKnowledgeBase = agentConfig.conversation_config.agent.prompt.knowledge_base || [];
    const updatedKnowledgeBase = existingKnowledgeBase.filter((doc: any) => doc.id !== documentation_id);
    
    // Check if document was actually in the knowledge base
    if (existingKnowledgeBase.length === updatedKnowledgeBase.length) {
      return res.status(200).json({ 
        success: true, 
        message: 'Document was not in agent knowledge base',
        was_attached: false
      });
    }

    // Update only the knowledge_base field
    const updateData = {
      conversation_config: {
        agent: {
          prompt: {
            knowledge_base: updatedKnowledgeBase
          }
        }
      }
    };

    const updateResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('ElevenLabs update agent error:', updateResponse.status, errorText);
      return res.status(updateResponse.status).json({ 
        error: 'Failed to update agent configuration',
        details: errorText
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Document removed from agent knowledge base',
      knowledge_base_count: updatedKnowledgeBase.length,
      was_attached: true
    });

  } catch (error) {
    console.error('Remove from agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 