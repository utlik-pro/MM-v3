import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Get agent ID
    const agentId = process.env.ELEVENLABS_AGENT_ID || 'agent_8901k4s5hkbkf7gsf1tk5r0a4g8t';

    // Create FormData for ElevenLabs API
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(file.filepath);
    const blob = new Blob([fileBuffer], { type: file.mimetype || 'application/octet-stream' });
    
    formData.append('file', blob, file.originalFilename || 'upload');
    if (name) {
      formData.append('name', name);
    }
    formData.append('agent_id', agentId);
    const response = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base/file', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: formData,
    });

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to create knowledge base document from file',
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
           console.log('RAG index computed for file document:', ragData);
           
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
                   document_type: 'file'
                 }),
               });
               
               if (addToAgentResponse.ok) {
                 console.log('File document automatically added to agent');
               }
             } catch (agentError) {
               console.log('Failed to add file document to agent automatically:', agentError);
             }
           }
         } else {
           console.log('Failed to compute RAG index for file, but document created');
         }
      } catch (ragError) {
        console.log('RAG index error for file (document still created):', ragError);
      }
    }
    
    res.status(200).json(data);

  } catch (error) {
    console.error('Knowledge base create file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 