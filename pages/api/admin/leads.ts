import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'CLOSED';

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
    let query = supabase
      .from('leads')
      .select(`
        id,
        contact_info,
        status,
        score,
        source,
        notes,
        created_at,
        updated_at,
        agent_id,
        client_id
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status as LeadStatus);
    }

    // Search in contact info and notes
    if (search && typeof search === 'string') {
      query = query.or(`contact_info.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const { data: leads, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform data to match frontend expectations
    const transformedLeads = leads?.map(lead => ({
      id: lead.id,
      contactInfo: lead.contact_info ? JSON.parse(lead.contact_info) : {},
      status: lead.status,
      score: lead.score,
      source: lead.source,
      notes: lead.notes,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      agentId: lead.agent_id,
      clientId: lead.client_id
    })) || [];

    // Get total count for pagination
    let countQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status as LeadStatus);
    }

    if (search && typeof search === 'string') {
      countQuery = countQuery.or(`contact_info.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const { count } = await countQuery;

    return res.status(200).json({
      leads: transformedLeads,
      total: count || 0,
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
    agentId = 'agent_8901k4s5hkbkf7gsf1tk5r0a4g8t',
    clientId = 'default-client'
  } = req.body;

  if (!contactInfo) {
    return res.status(400).json({ error: 'Contact info is required' });
  }

  try {
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        contact_info: JSON.stringify(contactInfo),
        source,
        status: status as LeadStatus,
        notes,
        score,
        agent_id: agentId,
        client_id: clientId
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const transformedLead = {
      ...newLead,
      contactInfo: newLead.contact_info ? JSON.parse(newLead.contact_info) : {},
      createdAt: newLead.created_at,
      updatedAt: newLead.updated_at
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
    if (req.body.contactInfo) updateData.contact_info = JSON.stringify(req.body.contactInfo);

    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const transformedLead = {
      ...updatedLead,
      contactInfo: updatedLead.contact_info ? JSON.parse(updatedLead.contact_info) : {},
      createdAt: updatedLead.created_at,
      updatedAt: updatedLead.updated_at
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
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return res.status(500).json({ error: 'Failed to delete lead' });
  }
} 