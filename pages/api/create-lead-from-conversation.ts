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
    const { conversation_id, lead_info, client_intent, conversation_data } = req.body

    if (!conversation_id || !lead_info) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'conversation_id and lead_info are required'
      })
    }

    console.log('📝 Creating lead from conversation:', conversation_id)

    // Проверяем, не существует ли уже лид с таким conversation_id
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('conversation_id', conversation_id)
      .single()

    if (existingLead) {
      return res.status(409).json({
        error: 'Lead already exists',
        details: `Lead with conversation_id ${conversation_id} already exists`
      })
    }

    // Создаем новый лид
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        client_id: 'default-client',
        agent_id: 'agent_8901k4s5hkbkf7gsf1tk5r0a4g8t',
        conversation_id: conversation_id,
        contact_info: JSON.stringify({
          name: lead_info.name,
          phone: lead_info.phone,
          extracted_from: lead_info.extracted_from
        }),
        conversation_summary: client_intent || 'Общий интерес к недвижимости',
        extracted_entities: {
          intent: client_intent,
          source: 'conversation',
          conversation_data: {
            duration: conversation_data?.duration_seconds || 0,
            status: conversation_data?.status || 'unknown',
            agent_id: conversation_data?.agent_id || 'agent_8901k4s5hkbkf7gsf1tk5r0a4g8t'
          }
        },
        lead_quality_score: calculateLeadQuality(lead_info, client_intent),
        source: 'conversation',
        status: 'NEW'
      })
      .select('id, conversation_id, contact_info, conversation_summary, lead_quality_score, created_at')
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('✅ Lead created successfully:', newLead.id)

    return res.status(201).json({
      success: true,
      lead: {
        id: newLead.id,
        conversation_id: newLead.conversation_id,
        contact_info: JSON.parse(newLead.contact_info),
        conversation_summary: newLead.conversation_summary,
        lead_quality_score: newLead.lead_quality_score,
        created_at: newLead.created_at
      }
    })

  } catch (error) {
    console.error('❌ Create lead error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function calculateLeadQuality(leadInfo: any, clientIntent: string | null): number {
  let score = 0
  
  // Базовые баллы за наличие контактной информации
  if (leadInfo.name && leadInfo.name !== 'Неизвестно') score += 30
  if (leadInfo.phone && leadInfo.phone !== 'Не указан') score += 30
  
  // Дополнительные баллы за намерение
  if (clientIntent) {
    if (clientIntent.includes('Инвестиции')) score += 20
    else if (clientIntent.includes('Покупка для проживания')) score += 15
    else if (clientIntent.includes('Интерес к недвижимости')) score += 10
  }
  
  // Максимальный балл 100
  return Math.min(score, 100)
} 