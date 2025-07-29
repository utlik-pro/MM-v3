import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { lead_id } = req.query

    if (!lead_id) {
      return res.status(400).json({ error: 'lead_id is required' })
    }

    console.log(`🔍 Direct check for lead: ${lead_id}`)

    // Прямой запрос к Supabase
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, contact_info, conversation_id, created_at, updated_at')
      .eq('id', lead_id)
      .single()

    if (leadError) {
      console.error('❌ Error fetching lead:', leadError)
      return res.status(500).json({ 
        error: 'Failed to fetch lead', 
        details: leadError.message 
      })
    }

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    // Если есть conversation_id, получаем детали разговора
    let conversation = null
    if (lead.conversation_id) {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('id, eleven_labs_conversation_id, status, created_at')
        .eq('id', lead.conversation_id)
        .single()

      if (!convError && conv) {
        conversation = conv
      }
    }

    // Парсим contact_info
    let contactInfo = null
    try {
      contactInfo = lead.contact_info ? JSON.parse(lead.contact_info) : null
    } catch (parseError) {
      console.warn('Failed to parse contact_info:', parseError)
    }

    res.status(200).json({
      success: true,
      lead: {
        id: lead.id,
        name: contactInfo?.name || 'Unknown',
        phone: contactInfo?.phone || 'Unknown',
        conversation_id: lead.conversation_id,
        created_at: lead.created_at,
        updated_at: lead.updated_at
      },
      conversation
    })

  } catch (error) {
    console.error('❌ Error in check-lead-direct:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
} 