import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentation_id, document_id, document_name, document_type } = req.body;
    const agentId = process.env.ELEVENLABS_AGENT_ID || 'agent_01jxkr0mstfk6ttayjsghjm7xc';
    
    // Support both new format (documentation_id) and old format (document_id)
    const docId = documentation_id || document_id;
    
    if (!docId) {
      return res.status(400).json({ error: 'Documentation ID is required' });
    }

    // If document name/type not provided, fetch document details
    let docName = document_name;
    let docType = document_type || 'text';
    
    if (!docName) {
      const docResponse = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${docId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
      });
      
      if (docResponse.ok) {
        const docData = await docResponse.json();
        docName = docData.name || `Document ${docId}`;
        docType = docData.type || 'text';
      } else {
        docName = `Document ${docId}`;
      }
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
    
    // Add new document to knowledge base
    const newDocument = {
      type: docType,
      name: docName,
      id: docId,
      usage_mode: "auto"
    };

    // Check if document is already in the knowledge base
    const existingKnowledgeBase = agentConfig.conversation_config.agent.prompt.knowledge_base || [];
    const documentExists = existingKnowledgeBase.some((doc: any) => doc.id === docId);
    
    if (documentExists) {
      return res.status(200).json({ 
        success: true, 
        message: 'Document already exists in agent knowledge base' 
      });
    }

    // Add the new document
    const updatedKnowledgeBase = [...existingKnowledgeBase, newDocument];

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
      message: 'Document added to agent knowledge base',
      knowledge_base_count: updatedKnowledgeBase.length
    });

  } catch (error) {
    console.error('Add to agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 