import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { ElevenLabsClient } from '../../lib/elevenlabs/client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔗 Starting auto-link process for new leads...')

    // 1. Получаем несвязанные лиды за последние 10 минут
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
    const { data: unlinkedLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, contact_info, metadata, created_at')
      .is('conversation_id', null)
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`)
    }

    if (!unlinkedLeads || unlinkedLeads.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new unlinked leads found',
        processed: 0
      })
    }

    console.log(`📊 Found ${unlinkedLeads.length} unlinked leads in last 10 minutes`)

    // 2. Получаем недавние разговоры
    const elevenLabsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! })
    const conversationsResult = await elevenLabsClient.listConversations({ page_size: 30 })

    if (!conversationsResult.success || !conversationsResult.data) {
      throw new Error(`Failed to fetch conversations: ${conversationsResult.error}`)
    }

    const conversations = conversationsResult.data.conversations
    console.log(`📊 Found ${conversations.length} recent conversations`)

    // 3. Автоматическое связывание
    const results = []
    
    for (const lead of unlinkedLeads) {
      try {
        let contactInfo = null
        let metadata = null
        
        try {
          contactInfo = lead.contact_info ? JSON.parse(lead.contact_info) : null
          metadata = lead.metadata ? JSON.parse(lead.metadata) : null
        } catch (parseError) {
          console.warn(`Failed to parse lead data for ${lead.id}:`, parseError)
          continue
        }

        const leadPhone = contactInfo?.phone
        const leadName = contactInfo?.name
        const leadTime = new Date(lead.created_at).getTime()

        // Поиск разговора по времени (в пределах ±5 минут)
        const timeWindow = 5 * 60 * 1000 // 5 минут
        
        const matchingConversation = conversations.find(conv => {
          const convTime = conv.start_time_unix_secs * 1000
          const timeDiff = Math.abs(leadTime - convTime)
          return timeDiff <= timeWindow
        })

        if (matchingConversation) {
          // Создаем запись разговора
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              client_id: 'default-client',
              agent_id: 'agent_8901k4s5hkbkf7gsf1tk5r0a4g8t',
              eleven_labs_conversation_id: matchingConversation.conversation_id,
              status: 'COMPLETED',
              created_at: new Date().toISOString()
            })
            .select('id')
            .single()

          if (convError) {
            console.error('❌ Error creating conversation:', convError)
            results.push({
              lead_id: lead.id,
              success: false,
              error: 'Failed to create conversation record'
            })
            continue
          }

          // Связываем лид с разговором
          const { error: updateError } = await supabase
            .from('leads')
            .update({ conversation_id: newConv.id })
            .eq('id', lead.id)

          if (updateError) {
            console.error('❌ Error updating lead:', updateError)
            results.push({
              lead_id: lead.id,
              success: false,
              error: 'Failed to update lead'
            })
          } else {
            console.log(`✅ Auto-linked lead ${lead.id} (${leadName}) to conversation ${matchingConversation.conversation_id}`)
            results.push({
              lead_id: lead.id,
              lead_name: leadName,
              conversation_id: matchingConversation.conversation_id,
              method: 'time_match',
              success: true
            })
          }
        } else {
          results.push({
            lead_id: lead.id,
            lead_name: leadName,
            success: false,
            error: 'No matching conversation found in time window'
          })
        }
      } catch (error) {
        console.error(`❌ Error processing lead ${lead.id}:`, error)
        results.push({
          lead_id: lead.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successful = results.filter(r => r.success)
    
    console.log(`✅ Auto-linking completed: ${successful.length}/${results.length} successful`)

    res.status(200).json({
      success: true,
      processed: results.length,
      successful_links: successful.length,
      results
    })

  } catch (error) {
    console.error('❌ Error in auto-link-new-leads:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
} 