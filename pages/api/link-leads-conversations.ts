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
    console.log('🔗 Starting leads-conversations linking process...')

    // 1. Получаем все лиды без связанного разговора
    const { data: unlinkedLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, contact_info, metadata, created_at')
      .is('conversation_id', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`)
    }

    console.log(`📊 Found ${unlinkedLeads?.length || 0} unlinked leads`)

    // 2. Получаем недавние разговоры из системы
    const elevenLabsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! })
    const conversationsResult = await elevenLabsClient.listConversations({ page_size: 50 })

    if (!conversationsResult.success || !conversationsResult.data) {
      throw new Error(`Failed to fetch conversations: ${conversationsResult.error}`)
    }

    const conversations = conversationsResult.data.conversations
    console.log(`📊 Found ${conversations.length} recent conversations`)

    const linkingResults = []

    // 3. Для каждого лида пытаемся найти соответствующий разговор
    for (const lead of unlinkedLeads || []) {
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

        const leadName = contactInfo?.name
        const leadPhone = contactInfo?.phone
        const elevenLabsConvId = metadata?.eleven_labs_conversation_id

        // Если уже есть eleven_labs_conversation_id в metadata
        if (elevenLabsConvId) {
          const matchingConv = conversations.find(conv => conv.conversation_id === elevenLabsConvId)
          if (matchingConv) {
            await linkLeadToConversation(lead.id, matchingConv.conversation_id, 'metadata_match')
            linkingResults.push({
              lead_id: lead.id,
              conversation_id: matchingConv.conversation_id,
              method: 'metadata_match',
              success: true
            })
            continue
          }
        }

        // Ищем по времени и содержимому разговора
        for (const conversation of conversations) {
          try {
            // Получаем детали разговора
            const convDetailResult = await elevenLabsClient.getConversation(conversation.conversation_id)
            
            if (!convDetailResult.success || !convDetailResult.data?.transcript) {
              continue
            }

            const transcript = convDetailResult.data.transcript as any[]
            
            // Ищем tool calls с SendToCRMLead
            const leadToolCalls = transcript.filter(msg => 
              msg.tool_calls && msg.tool_calls.some((tc: any) => 
                tc.tool_name === 'SendToCRMLead' || tc.function?.name === 'SendToCRMLead'
              )
            )

            if (leadToolCalls.length === 0) continue

            // Анализируем tool calls
            for (const message of leadToolCalls) {
              for (const toolCall of message.tool_calls || []) {
                if (toolCall.tool_name === 'SendToCRMLead' || toolCall.function?.name === 'SendToCRMLead') {
                  let toolArgs = null
                  
                  try {
                    const argsString = toolCall.params_as_json || toolCall.function?.arguments
                    toolArgs = typeof argsString === 'string' ? JSON.parse(argsString) : argsString
                  } catch {
                    continue
                  }

                  const toolName = toolArgs?.FullName
                  const toolPhone = toolArgs?.Phone

                  // Проверяем совпадение по имени и/или телефону
                  const nameMatch = leadName && toolName && 
                    leadName.toLowerCase().includes(toolName.toLowerCase()) ||
                    toolName.toLowerCase().includes(leadName.toLowerCase())
                  
                  const phoneMatch = leadPhone && toolPhone && 
                    normalizePhone(leadPhone) === normalizePhone(toolPhone)

                  if (nameMatch || phoneMatch) {
                    await linkLeadToConversation(lead.id, conversation.conversation_id, phoneMatch ? 'phone_match' : 'name_match')
                    linkingResults.push({
                      lead_id: lead.id,
                      conversation_id: conversation.conversation_id,
                      method: phoneMatch ? 'phone_match' : 'name_match',
                      success: true,
                      matched_data: { leadName, toolName, leadPhone, toolPhone }
                    })
                    break
                  }
                }
              }
            }

          } catch (convError) {
            console.warn(`Error processing conversation ${conversation.conversation_id}:`, convError)
            continue
          }
        }

      } catch (leadError) {
        console.warn(`Error processing lead ${lead.id}:`, leadError)
        linkingResults.push({
          lead_id: lead.id,
          success: false,
          error: leadError instanceof Error ? leadError.message : 'Unknown error'
        })
      }
    }

    // 4. Статистика результатов
    const successfulLinks = linkingResults.filter(r => r.success)
    const failedLinks = linkingResults.filter(r => !r.success)

    return res.status(200).json({
      success: true,
      message: 'Lead-conversation linking completed',
      statistics: {
        total_unlinked_leads: unlinkedLeads?.length || 0,
        total_conversations: conversations.length,
        successful_links: successfulLinks.length,
        failed_links: failedLinks.length,
        linking_methods: {
          metadata_match: successfulLinks.filter(r => r.method === 'metadata_match').length,
          phone_match: successfulLinks.filter(r => r.method === 'phone_match').length,
          name_match: successfulLinks.filter(r => r.method === 'name_match').length
        }
      },
      results: linkingResults,
      next_steps: successfulLinks.length > 0 ? [
        'Check /lead-monitor to see linked conversations',
        'Click on leads to view full conversation details'
      ] : [
        'No automatic links found',
        'Consider manual linking for complex cases'
      ]
    })

  } catch (error) {
    console.error('❌ Lead-conversation linking error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Вспомогательные функции
async function linkLeadToConversation(leadId: string, conversationId: string, method: string) {
  // Сначала ищем существующий разговор в базе или создаем его
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('eleven_labs_conversation_id', conversationId)
    .single()

  let dbConversationId = existingConv?.id

  if (!dbConversationId) {
    // Создаем запись разговора если её нет
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        client_id: 'default-client',
        agent_id: 'agent_2001k4cgbmjhebd92cbzn8fk2zmk',
        eleven_labs_conversation_id: conversationId,
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (convError) {
      throw new Error(`Failed to create conversation record: ${convError.message}`)
    }
    dbConversationId = newConv.id
  }

  // Обновляем лид с привязкой к разговору
  const { error: linkError } = await supabase
    .from('leads')
    .update({
      conversation_id: dbConversationId,
      source_conversation_id: dbConversationId
    })
    .eq('id', leadId)

  if (linkError) {
    throw new Error(`Failed to link lead to conversation: ${linkError.message}`)
  }

  console.log(`✅ Linked lead ${leadId} to conversation ${conversationId} (method: ${method})`)
}

function normalizePhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('375')) return '+' + cleaned
  if (cleaned.startsWith('+375')) return cleaned
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned
} 