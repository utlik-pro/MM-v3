import type { NextApiRequest, NextApiResponse } from 'next'
import { ElevenLabsClient } from '../../lib/elevenlabs/client'
import { supabase } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ 
        error: 'conversation_id is required',
        usage: 'GET /api/conversation-simple?id=<conversation_id_or_elevenlabs_id>'
      })
    }

    console.log(`🔍 Fetching conversation: ${id}`)

    let elevenLabsConversationId = id as string

    // Проверяем, является ли это Supabase conversation_id или ElevenLabs conversation_id
    if (!id.toString().startsWith('conv_')) {
      // Это Supabase ID, нужно получить ElevenLabs ID
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('eleven_labs_conversation_id')
        .eq('id', id)
        .single()

      if (error || !conversation?.eleven_labs_conversation_id) {
        return res.status(404).json({
          error: 'Conversation not found in database',
          details: error?.message || 'No ElevenLabs conversation ID found'
        })
      }

      elevenLabsConversationId = conversation.eleven_labs_conversation_id
      console.log(`📍 Mapped Supabase ID ${id} to ElevenLabs ID ${elevenLabsConversationId}`)
    }

    const elevenLabsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! })
    const result = await elevenLabsClient.getConversation(elevenLabsConversationId)

    if (!result.success || !result.data) {
      return res.status(404).json({
        error: 'Conversation not found',
        details: result.error
      })
    }

    const conversation = result.data

    // Обработка транскрипта в простом читаемом формате
    let chatHistory: any[] = []
    
    if (conversation.transcript && Array.isArray(conversation.transcript)) {
      chatHistory = conversation.transcript
        .filter((msg: any) => msg.message) // Только сообщения с текстом
        .map((msg: any, index: number) => ({
          id: index,
          role: msg.role === 'agent' ? 'Агент' : 'Клиент',
          message: msg.message,
          time: msg.time_in_call_secs ? `${msg.time_in_call_secs}с` : '',
          has_tool_calls: !!(msg.tool_calls && msg.tool_calls.length > 0),
          tool_info: msg.tool_calls && msg.tool_calls.length > 0 
            ? msg.tool_calls.map((tc: any) => tc.tool_name || 'Unknown tool').join(', ')
            : null
        }))
    }

    // Извлекаем информацию о лиде из tool calls
    let leadInfo = null
    if (conversation.transcript) {
      for (const msg of conversation.transcript as any[]) {
        if ((msg as any).tool_calls) {
          for (const toolCall of (msg as any).tool_calls) {
            if (toolCall.tool_name === 'SendToCRMLead' && toolCall.tool_call_data) {
              const leadData = toolCall.tool_call_data
              leadInfo = {
                name: leadData.name || leadData.first_name || 'Неизвестно',
                phone: leadData.phone || leadData.phone_number || 'Не указан',
                email: leadData.email || null,
                comment: leadData.comment || leadData.message || 'Без комментария'
              }
              break
            }
          }
          if (leadInfo) break
        }
      }
    }

    // Базовая статистика
    const statistics = {
      total_messages: chatHistory.length,
      agent_messages: chatHistory.filter(msg => msg.role === 'Агент').length,
      client_messages: chatHistory.filter(msg => msg.role === 'Клиент').length,
      has_lead_capture: !!leadInfo,
      conversation_length_seconds: conversation.call_duration_secs || 0
    }

    return res.status(200).json({
      success: true,
      conversation: {
        id: id as string,
        status: conversation.status || 'unknown',
        created_at: conversation.start_time_unix_secs ? new Date(conversation.start_time_unix_secs * 1000).toISOString() : null,
        language: 'ru', // Предполагаем русский язык
        duration_secs: conversation.call_duration_secs || null
      },
      chat_history: chatHistory,
      lead_info: leadInfo,
      statistics,
      audio_url: `/api/conversation-audio?id=${id}`, // Добавляем ссылку на аудио
      raw_data_available: {
        has_transcript: !!conversation.transcript,
        has_metadata: !!conversation.metadata,
        has_analysis: !!(conversation as any).analysis
      }
    })

  } catch (error) {
    console.error('❌ Conversation details error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 