import type { NextApiRequest, NextApiResponse } from 'next';

// Temporary in-memory storage (будет заменено на базу данных)
let leads: any[] = [
  {
    id: '1',
    agentId: 'agent_01jxkr0mstfk6ttayjsghjm7xc',
    clientId: 'default-client',
    conversationId: 'conv_123',
    contactInfo: {
      name: 'Иван Петров',
      phone: '+375 29 123-45-67',
      email: 'ivan.petrov@example.com'
    },
    source: 'voice_widget',
    status: 'NEW',
    score: 85,
    notes: 'Интересуется услугами, просил перезвонить',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    agentId: 'agent_01jxkr0mstfk6ttayjsghjm7xc',
    clientId: 'default-client',
    conversationId: 'conv_124',
    contactInfo: {
      name: 'Мария Сидорова',
      phone: '+375 33 987-65-43',
      email: 'maria.sidorova@example.com'
    },
    source: 'voice_widget',
    status: 'CONTACTED',
    score: 92,
    notes: 'Высокий интерес, назначена встреча',
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 минут назад
    updatedAt: new Date().toISOString()
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetLeads(req, res);
      case 'POST':
        return handleCreateLead(req, res);
      case 'PUT':
        return handleUpdateLead(req, res);
      case 'DELETE':
        return handleDeleteLead(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in leads API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetLeads(req: NextApiRequest, res: NextApiResponse) {
  const { status, search, limit = '50', offset = '0' } = req.query;

  let filteredLeads = [...leads];

  // Filter by status
  if (status && status !== 'all') {
    filteredLeads = filteredLeads.filter(lead => lead.status === status);
  }

  // Search by name or phone
  if (search) {
    const searchTerm = (search as string).toLowerCase();
    filteredLeads = filteredLeads.filter(lead => 
      lead.contactInfo.name.toLowerCase().includes(searchTerm) ||
      lead.contactInfo.phone.includes(searchTerm) ||
      (lead.contactInfo.email && lead.contactInfo.email.toLowerCase().includes(searchTerm))
    );
  }

  // Sort by created date (newest first)
  filteredLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const limitNum = parseInt(limit as string);
  const offsetNum = parseInt(offset as string);
  const paginatedLeads = filteredLeads.slice(offsetNum, offsetNum + limitNum);

  return res.status(200).json({
    leads: paginatedLeads,
    total: filteredLeads.length,
    hasMore: offsetNum + limitNum < filteredLeads.length
  });
}

async function handleCreateLead(req: NextApiRequest, res: NextApiResponse) {
  const { agentId, conversationId, contactInfo, source, notes } = req.body;

  if (!agentId || !contactInfo) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newLead = {
    id: `lead_${Date.now()}`,
    agentId,
    clientId: 'default-client', // В реальной системе будет определяться из сессии
    conversationId,
    contactInfo,
    source: source || 'voice_widget',
    status: 'NEW',
    score: calculateLeadScore(contactInfo, notes),
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  leads.push(newLead);

  // В реальной системе здесь будет отправка уведомлений
  console.log('New lead captured:', newLead);

  return res.status(201).json(newLead);
}

async function handleUpdateLead(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const updates = req.body;

  const leadIndex = leads.findIndex(lead => lead.id === id);
  
  if (leadIndex === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  leads[leadIndex] = {
    ...leads[leadIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  return res.status(200).json(leads[leadIndex]);
}

async function handleDeleteLead(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const leadIndex = leads.findIndex(lead => lead.id === id);
  
  if (leadIndex === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  leads.splice(leadIndex, 1);
  return res.status(200).json({ message: 'Lead deleted successfully' });
}

function calculateLeadScore(contactInfo: any, notes: string): number {
  let score = 50; // Base score

  // Increase score if we have email
  if (contactInfo.email) {
    score += 20;
  }

  // Increase score if we have complete phone number
  if (contactInfo.phone && contactInfo.phone.length >= 10) {
    score += 15;
  }

  // Increase score based on notes content
  if (notes) {
    const positiveKeywords = ['заинтересован', 'хочу', 'нужно', 'срочно', 'когда', 'цена'];
    const noteWords = notes.toLowerCase().split(' ');
    const positiveMatches = positiveKeywords.filter(keyword => 
      noteWords.some(word => word.includes(keyword))
    );
    score += positiveMatches.length * 5;
  }

  return Math.min(score, 100); // Cap at 100
} 