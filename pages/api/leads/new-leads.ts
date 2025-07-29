import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { since } = req.query;
    
    // If no 'since' timestamp provided, return leads from last 5 minutes
    const sinceDate = since 
      ? new Date(parseInt(since as string))
      : new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

    console.log('🔍 Checking for new leads since:', sinceDate.toISOString());

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .gt('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching new leads:', error);
      return res.status(500).json({ error: 'Failed to fetch new leads' });
    }

    // Transform leads to match expected format
    const newLeads = leads?.map(lead => {
      const contactInfo = lead.contact_info ? JSON.parse(lead.contact_info) : {};
      return {
        id: lead.id,
        name: contactInfo.name || 'Без имени',
        phone: contactInfo.phone || 'Без телефона',
        comment: contactInfo.commentary || lead.notes || 'Без комментария',
        createdAt: lead.created_at
      };
    }) || [];

    console.log('📊 Found new leads:', newLeads.length);

    res.status(200).json({
      newLeads,
      count: newLeads.length,
      since: sinceDate.getTime()
    });

  } catch (error) {
    console.error('❌ New leads check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 