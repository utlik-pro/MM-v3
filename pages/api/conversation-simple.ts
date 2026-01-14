import type { NextApiRequest, NextApiResponse } from 'next'
import { ElevenLabsClient } from '../../lib/elevenlabs/client'
import { supabase } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    // Handle starting a new conversation (simulation)
    try {
      const { message, voice_id = '21m00Tcm4TlvDq8ikWAM' } = req.body

      if (!message) {
        return res.status(400).json({ 
          error: 'message is required',
          usage: 'POST /api/conversation-simple with { message: string, voice_id?: string }'
        })
      }

      console.log(`🚀 Starting conversation simulation with message: ${message}`)

      // For now, we'll simulate a successful conversation start
      // In a real implementation, you would create an actual ElevenLabs conversation
      const conversationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Save to Supabase as a simulated conversation
      const { data: dbConversation, error: dbError } = await supabase
        .from('conversations')
        .insert({
          eleven_labs_conversation_id: conversationId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        // Don't fail the request, just log the error
      }

      return res.status(200).json({
        success: true,
        conversation_id: conversationId,
        message: 'Conversation simulation started successfully',
        data: {
          conversation_id: conversationId,
          status: 'active',
          voice_id: voice_id,
          initial_message: message
        }
      })

    } catch (error) {
      console.error('Error starting conversation:', error)
      return res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

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

    // Check if this is a simulated conversation
    if (elevenLabsConversationId.startsWith('sim_')) {
      return res.status(200).json({
        success: true,
        conversation_id: elevenLabsConversationId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        chat_history: [
          {
            id: 1,
            role: 'Клиент',
            message: 'Привет! Я хочу узнать о новостройках',
            time: '0с'
          },
          {
            id: 2,
            role: 'Агент',
            message: 'Здравствуйте! Я помогу вам подобрать лучшие варианты новостроек. Расскажите, пожалуйста, какие у вас требования к квартире?',
            time: '5с'
          }
        ],
        lead_info: null,
        statistics: {
          total_messages: 2,
          agent_messages: 1,
          client_messages: 1,
          has_lead: false,
          duration: 5
        }
      })
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
      has_lead: !!leadInfo,
      duration: (conversation as any).duration_seconds || 0
    }

    return res.status(200).json({
      success: true,
      conversation_id: conversation.conversation_id,
      status: conversation.status,
      created_at: (conversation as any).created_at || new Date().toISOString(),
      updated_at: (conversation as any).updated_at || new Date().toISOString(),
      duration_seconds: (conversation as any).duration_seconds || 0,
      chat_history: chatHistory,
      lead_info: leadInfo,
      statistics: statistics
    })

  } catch (error) {
    console.error('Error fetching conversation:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 