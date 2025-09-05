import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { lead_id, conversation_id } = req.body

    if (!lead_id || !conversation_id) {
      return res.status(400).json({ error: 'lead_id and conversation_id are required' })
    }

    console.log(`🔗 Force linking lead ${lead_id} to conversation ${conversation_id}`)

    // 1. Проверяем существование лида
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, contact_info')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    // 2. Создаем запись разговора в Supabase
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        client_id: 'default-client',
        agent_id: 'agent_2001k4cgbmjhebd92cbzn8fk2zmk',
        eleven_labs_conversation_id: conversation_id,
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (convError) {
      console.error('❌ Error creating conversation:', convError)
      return res.status(500).json({ 
        error: 'Failed to create conversation record', 
        details: convError.message 
      })
    }

    // 3. Обновляем лид, привязывая к разговору
    const { error: updateError } = await supabase
      .from('leads')
      .update({ conversation_id: newConv.id })
      .eq('id', lead_id)

    if (updateError) {
      console.error('❌ Error updating lead:', updateError)
      return res.status(500).json({ 
        error: 'Failed to update lead', 
        details: updateError.message 
      })
    }

    console.log(`✅ Successfully linked lead ${lead_id} to conversation ${conversation_id}`)

    res.status(200).json({
      success: true,
      message: 'Lead successfully linked to conversation',
      lead_id,
      conversation_id,
      supabase_conversation_id: newConv.id
    })

  } catch (error) {
    console.error('❌ Error in force-link-lead:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
} 