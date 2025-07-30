import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { LeadStatus } from '@prisma/client';

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

  try {
    const whereClause: any = {};

    // Filter by status
    if (status && status !== 'all') {
      whereClause.status = status as LeadStatus;
    }

    // Search in contact info and notes
    if (search && typeof search === 'string') {
      whereClause.OR = [
        {
          contactInfo: {
            contains: search
          }
        },
        {
          notes: {
            contains: search
          }
        }
      ];
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        agent: true,
        client: true,
        conversation: true
      }
    });

    // Transform data to match frontend expectations
    const transformedLeads = leads.map(lead => ({
      id: lead.id,
      contactInfo: lead.contactInfo ? JSON.parse(lead.contactInfo as string) : {},
      status: lead.status,
      score: lead.score,
      source: lead.source,
      notes: lead.notes,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      agent: lead.agent,
      client: lead.client
    }));

    // Get total count for pagination
    const total = await prisma.lead.count({ where: whereClause });

    return res.status(200).json({
      leads: transformedLeads,
      total,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string)
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ error: 'Failed to fetch leads' });
  }
}

async function handleCreateLead(req: NextApiRequest, res: NextApiResponse) {
  const { 
    contactInfo, 
    source = 'voice_widget', 
    status = 'NEW', 
    notes, 
    score,
    agentId = 'agent_01jxkr0mstfk6ttayjsghjm7xc',
    clientId = 'default-client'
  } = req.body;

  if (!contactInfo) {
    return res.status(400).json({ error: 'Contact info is required' });
  }

  try {
    const newLead = await prisma.lead.create({
      data: {
        contactInfo: JSON.stringify(contactInfo),
        source,
        status: status as LeadStatus,
        notes,
        score,
        agentId,
        clientId
      },
      include: {
        agent: true,
        client: true
      }
    });

    const transformedLead = {
      ...newLead,
      contactInfo: newLead.contactInfo ? JSON.parse(newLead.contactInfo as string) : {},
      createdAt: newLead.createdAt.toISOString(),
      updatedAt: newLead.updatedAt.toISOString()
    };

    return res.status(201).json({ lead: transformedLead });
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ error: 'Failed to create lead' });
  }
}

async function handleUpdateLead(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    const updateData: any = {};
    
    if (req.body.status) updateData.status = req.body.status as LeadStatus;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.score !== undefined) updateData.score = req.body.score;
    if (req.body.contactInfo) updateData.contactInfo = JSON.stringify(req.body.contactInfo);

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        agent: true,
        client: true
      }
    });

    const transformedLead = {
      ...updatedLead,
      contactInfo: updatedLead.contactInfo ? JSON.parse(updatedLead.contactInfo as string) : {},
      createdAt: updatedLead.createdAt.toISOString(),
      updatedAt: updatedLead.updatedAt.toISOString()
    };

    return res.status(200).json({ lead: transformedLead });
  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ error: 'Failed to update lead' });
  }
}

async function handleDeleteLead(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    await prisma.lead.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return res.status(500).json({ error: 'Failed to delete lead' });
  }
} 