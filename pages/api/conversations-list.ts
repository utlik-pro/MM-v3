import type { NextApiRequest, NextApiResponse } from 'next'
import { createDefaultElevenLabsClient } from '../../lib/elevenlabs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 Fetching conversations from ElevenLabs...')

    const elevenLabsClient = createDefaultElevenLabsClient()
    const { page = 1, limit = 50 } = req.query

    // Получаем список разговоров
    const conversationsResult = await elevenLabsClient.listConversations({
      page_size: parseInt(limit as string) || 50
    })

    if (!conversationsResult.success) {
      throw new Error(`Failed to get conversations: ${conversationsResult.error}`)
    }

    const conversations = conversationsResult.data?.conversations || []
    console.log(`📋 Found ${conversations.length} conversations`)

    // Фильтруем по агенту из ENV (если задан), иначе показываем все
    const targetAgentId = process.env.ELEVENLABS_AGENT_ID || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ''
    const filteredConversations = targetAgentId
      ? conversations.filter(conversation => conversation.agent_id === targetAgentId)
      : conversations
    console.log(`🎯 Filtered to ${filteredConversations.length} conversations` + (targetAgentId ? ` for agent ${targetAgentId}` : ' (no agent filter)'))

    // Обрабатываем каждый разговор для получения дополнительной информации
    const processedConversations = await Promise.all(
      filteredConversations.map(async (conversation) => {
        try {
          // Получаем детали разговора
          const convDetailResult = await elevenLabsClient.getConversation(conversation.conversation_id)
          
          let leadInfo = null
          let hasLead = false
          let topic: string | null = null
          let clientIntent: string | null = null
          let transcriptLength = 0
          
          if (convDetailResult.success && convDetailResult.data) {
            const rawTranscript = (convDetailResult.data as any).transcript
            const transcript = Array.isArray(rawTranscript)
              ? rawTranscript.map((m: any) => (typeof m === 'string' ? m : m?.content || '')).join(' ')
              : (rawTranscript || '') as string
            if (Array.isArray(rawTranscript)) {
              transcriptLength = rawTranscript.length
            } else if (typeof rawTranscript === 'string') {
              transcriptLength = rawTranscript.length
            } else {
              transcriptLength = 0
            }
            
            // Извлекаем контактную информацию из транскрипта
            const phonePattern = /\+375\s*\(?(\d{2})\)?\s*(\d{3})[- ]?(\d{2})[- ]?(\d{2})/g
            const namePatterns = [
              /меня зовут\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
              /я\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
              /имя\s+([а-яё]+(?:\s+[а-яё]+)?)/i
            ]

            const phoneMatch = phonePattern.exec(transcript)
            let nameMatch = null
            for (const pattern of namePatterns) {
              nameMatch = pattern.exec(transcript)
              if (nameMatch) break
            }

            if (phoneMatch || nameMatch) {
              hasLead = true
              leadInfo = {
                name: nameMatch ? nameMatch[1].trim() : 'Неизвестно',
                phone: phoneMatch ? phoneMatch[0].trim() : 'Не указан',
                extracted_from: 'transcript'
              }
            }

            // Дополнительно: извлекаем контакт из tool_calls (если есть)
            try {
              const toolCalls = (convDetailResult.data as any).tool_calls
              if (toolCalls) {
                const serialized = typeof toolCalls === 'string' ? toolCalls : JSON.stringify(toolCalls)
                // Поиск телефона
                const phoneFromTools = /\+?375\s*\(?\d{2}\)?\s*\d{3}[- ]?\d{2}[- ]?\d{2}/i.exec(serialized)
                // Поиск имени (упрощённо, до первой буквы/слова кириллицей)
                const nameFromTools = /"name"\s*:\s*"([А-Яа-яЁёA-Za-z\s]+)"/i.exec(serialized)
                if (phoneFromTools || nameFromTools) {
                  hasLead = true
                  leadInfo = {
                    name: nameFromTools ? nameFromTools[1].trim() : (leadInfo?.name || 'Неизвестно'),
                    phone: phoneFromTools ? phoneFromTools[0].trim() : (leadInfo?.phone || 'Не указан'),
                    extracted_from: leadInfo ? 'transcript+tools' : 'tools'
                  }
                }
              }
            } catch {}

            // Определяем тему/намерение разговора по ключевым словам
            const intentKeywords: Record<string, string[]> = {
              'Инвестиции в недвижимость': ['инвестиция', 'инвест', 'доход', 'перепродажа', 'аренда'],
              'Покупка для проживания': ['для себя', 'жить', 'проживание', 'семья'],
              'Интерес к недвижимости': ['квартира', 'дом', 'недвижимость', 'жилье'],
            }
            for (const [candidate, keywords] of Object.entries(intentKeywords)) {
              if (keywords.some(k => transcript.toLowerCase().includes(k))) {
                topic = candidate
                clientIntent = candidate
                break
              }
            }

            // Фолбэк: если тема не определена по тексту, используем заголовок сводки
            if (!topic && (conversation as any).call_summary_title) {
              topic = (conversation as any).call_summary_title
            }
          }

          const endTime = conversation.start_time_unix_secs + conversation.call_duration_secs
          
          return {
            id: conversation.conversation_id,
            agent_id: conversation.agent_id,
            status: conversation.status,
            call_successful: (conversation as any).call_successful || null,
            start_time: conversation.start_time_unix_secs,
            end_time: endTime,
            duration_seconds: conversation.call_duration_secs,
            duration_formatted: formatDuration(conversation.call_duration_secs),
            start_time_formatted: new Date(conversation.start_time_unix_secs * 1000).toLocaleString('ru-RU'),
            end_time_formatted: new Date(endTime * 1000).toLocaleString('ru-RU'),
            minutes_ago: Math.round((Date.now() - conversation.start_time_unix_secs * 1000) / (1000 * 60)),
            has_lead: hasLead,
            lead_info: leadInfo,
            title: (conversation as any).call_summary_title || null,
            topic: topic,
            client_intent: clientIntent,
            transcript_length: transcriptLength,
            metadata: {
              agent_id: conversation.agent_id,
              call_duration_secs: conversation.call_duration_secs,
              status: conversation.status
            }
          }
        } catch (error) {
          console.warn(`Failed to process conversation ${conversation.conversation_id}:`, error)
          return {
            id: conversation.conversation_id,
            agent_id: conversation.agent_id,
            status: conversation.status,
            call_successful: (conversation as any).call_successful || null,
            start_time: conversation.start_time_unix_secs,
            end_time: conversation.start_time_unix_secs + conversation.call_duration_secs,
            duration_seconds: conversation.call_duration_secs,
            duration_formatted: formatDuration(conversation.call_duration_secs),
            start_time_formatted: new Date(conversation.start_time_unix_secs * 1000).toLocaleString('ru-RU'),
            end_time_formatted: new Date((conversation.start_time_unix_secs + conversation.call_duration_secs) * 1000).toLocaleString('ru-RU'),
            minutes_ago: Math.round((Date.now() - conversation.start_time_unix_secs * 1000) / (1000 * 60)),
            has_lead: false,
            lead_info: null,
            title: conversation.call_summary_title || null,
            topic: (conversation as any).call_summary_title || null,
            client_intent: null,
            transcript_length: 0,
            error: 'Failed to process conversation'
          }
        }
      })
    )

    // Статистика
    const totalConversations = filteredConversations.length
    const conversationsWithLeads = processedConversations.filter(conv => conv.has_lead).length
    const totalDuration = processedConversations.reduce((sum, conv) => sum + conv.duration_seconds, 0)
    const avgDuration = totalConversations > 0 ? Math.round(totalDuration / totalConversations) : 0

    const stats = {
      total_conversations: totalConversations,
      conversations_with_leads: conversationsWithLeads,
      lead_extraction_rate: totalConversations > 0 ? Math.round((conversationsWithLeads / totalConversations) * 100) : 0,
      total_duration_seconds: totalDuration,
      avg_duration_seconds: avgDuration,
      avg_duration_formatted: formatDuration(avgDuration)
    }

    console.log('📊 Conversations stats:', stats)

    return res.status(200).json({
      success: true,
      conversations: processedConversations,
      stats,
      pagination: {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 50,
        total: totalConversations
      }
    })

  } catch (error) {
    console.error('❌ Conversations API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м ${secs}с`
  } else if (minutes > 0) {
    return `${minutes}м ${secs}с`
  } else {
    return `${secs}с`
  }
} 