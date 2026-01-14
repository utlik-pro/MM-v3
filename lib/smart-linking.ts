import { supabase } from './supabase'
import { ElevenLabsClient } from './elevenlabs/client'

export async function smartLinkConversation(leadId: string) {
  try {
    console.log('🔍 Smart linking for lead:', leadId)

    // 1. Получаем данные лида
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      throw new Error('Lead not found')
    }

    // Парсим данные лида
    let contactInfo = null
    let metadata = null
    try {
      contactInfo = lead.contact_info ? JSON.parse(lead.contact_info) : null
      metadata = lead.metadata ? JSON.parse(lead.metadata) : null
    } catch (parseError) {
      throw new Error('Invalid lead data format')
    }

    const leadName = contactInfo?.name?.toLowerCase()
    const leadPhone = normalizePhone(contactInfo?.phone || '')
    const leadCreatedAt = new Date(lead.created_at)

    console.log('👤 Lead data:', { leadName, leadPhone, leadCreatedAt })

    // 2. Получаем разговоры из системы
    const elevenLabsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! })
    const conversationsResult = await elevenLabsClient.listConversations({ 
      page_size: 100 
    })

    if (!conversationsResult.success || !conversationsResult.data) {
      throw new Error(`Failed to fetch conversations: ${conversationsResult.error}`)
    }

    const conversations = conversationsResult.data.conversations
    console.log(`📞 Found ${conversations.length} conversations to analyze`)

    // 3. Ищем подходящие разговоры
    const candidates = []
    
    for (const conversation of conversations) {
      try {
        // Проверяем время (±2 часа от создания лида)
        const convTime = new Date(conversation.start_time_unix_secs * 1000)
        const timeDiffHours = Math.abs(leadCreatedAt.getTime() - convTime.getTime()) / (1000 * 60 * 60)
        
        if (timeDiffHours > 2) {
          continue // Слишком большая разница во времени
        }

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

        if (leadToolCalls.length === 0) {
          continue // Нет tool calls для создания лида
        }

        // Анализируем tool calls для поиска совпадений
        let bestMatch = 0
        let toolData = null

        for (const message of leadToolCalls) {
          for (const toolCall of message.tool_calls || []) {
            if (toolCall.tool_name === 'SendToCRMLead' || toolCall.function?.name === 'SendToCRMLead') {
              try {
                const argsString = toolCall.params_as_json || toolCall.function?.arguments
                const args = typeof argsString === 'string' ? JSON.parse(argsString) : argsString
                
                const toolName = args?.FullName?.toLowerCase()
                const toolPhone = normalizePhone(args?.Phone || '')
                
                let matchScore = 0
                
                // Проверяем совпадение имени
                if (leadName && toolName) {
                  if (leadName === toolName) {
                    matchScore += 50 // Точное совпадение
                  } else if (leadName.includes(toolName) || toolName.includes(leadName)) {
                    matchScore += 30 // Частичное совпадение
                  }
                }
                
                // Проверяем совпадение телефона
                if (leadPhone && toolPhone) {
                  if (leadPhone === toolPhone) {
                    matchScore += 50 // Точное совпадение
                  } else if (leadPhone.includes(toolPhone.slice(-7)) || toolPhone.includes(leadPhone.slice(-7))) {
                    matchScore += 30 // Совпадение последних 7 цифр
                  }
                }

                if (matchScore > bestMatch) {
                  bestMatch = matchScore
                  toolData = args
                }
              } catch (parseError) {
                continue
              }
            }
          }
        }

        if (bestMatch >= 50) { // Требуем минимум 50% совпадения
          candidates.push({
            conversation_id: conversation.conversation_id,
            match_score: bestMatch,
            time_diff_minutes: Math.round(timeDiffHours * 60),
            tool_data: toolData,
            conversation_start: convTime.toISOString()
          })
        }

      } catch (convError) {
        console.warn(`Error processing conversation ${conversation.conversation_id}:`, convError)
        continue
      }
    }

    // 4. Выбираем лучшего кандидата
    candidates.sort((a, b) => {
      // Сначала по match_score, потом по времени
      if (b.match_score !== a.match_score) {
        return b.match_score - a.match_score
      }
      return a.time_diff_minutes - b.time_diff_minutes
    })

    if (candidates.length === 0) {
      return {
        success: false,
        error: 'No matching conversations found',
        search_criteria: {
          lead_name: leadName,
          lead_phone: leadPhone,
          lead_created_at: leadCreatedAt.toISOString(),
          time_window_hours: 2
        },
        total_conversations_checked: conversations.length
      }
    }

    const bestCandidate = candidates[0]

    // 5. Обновляем лид с найденным conversation_id
    const updatedMetadata = {
      ...metadata,
      eleven_labs_conversation_id: bestCandidate.conversation_id,
      smart_linking: {
        matched_at: new Date().toISOString(),
        match_score: bestCandidate.match_score,
        time_diff_minutes: bestCandidate.time_diff_minutes,
        method: 'smart_time_and_data_matching'
      }
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        metadata: JSON.stringify(updatedMetadata)
      })
      .eq('id', leadId)

    if (updateError) {
      throw new Error(`Failed to update lead: ${updateError.message}`)
    }

    console.log(`✅ Successfully linked lead ${leadId} to conversation ${bestCandidate.conversation_id}`)

    return {
      success: true,
      message: 'Conversation linked successfully',
      lead_id: leadId,
      linked_conversation: {
        conversation_id: bestCandidate.conversation_id,
        match_score: bestCandidate.match_score,
        time_diff_minutes: bestCandidate.time_diff_minutes
      },
      all_candidates: candidates,
      search_info: {
        total_conversations_checked: conversations.length,
        matching_candidates_found: candidates.length,
        search_criteria: {
          lead_name: leadName,
          lead_phone: leadPhone,
          time_window_hours: 2
        }
      }
    }

  } catch (error) {
    console.error('❌ Smart linking error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function normalizePhone(phone: string): string {
  if (!phone) return ''
  
  // Удаляем все не-цифры кроме +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Стандартизируем белорусские номера
  if (cleaned.startsWith('375')) {
    return '+' + cleaned
  } else if (cleaned.startsWith('+375')) {
    return cleaned
  } else if (cleaned.startsWith('80') && cleaned.length >= 11) {
    return '+375' + cleaned.substring(2)
  } else if (cleaned.length === 9) {
    return '+375' + cleaned
  }
  
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned
} 