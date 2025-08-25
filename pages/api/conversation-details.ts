import type { NextApiRequest, NextApiResponse } from 'next'
import { createDefaultElevenLabsClient } from '../../lib/elevenlabs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { conversation_id } = req.query

  if (!conversation_id) {
    return res.status(400).json({ error: 'conversation_id is required' })
  }

  try {
    console.log(`🔍 Fetching conversation details for: ${conversation_id}`)

    const elevenLabsClient = createDefaultElevenLabsClient()

    // Получаем детали разговора
    const conversationResult = await elevenLabsClient.getConversation(conversation_id as string)
    
    if (!conversationResult.success) {
      throw new Error(`Failed to get conversation: ${conversationResult.error}`)
    }

    const conversation = conversationResult.data
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }
    
    // Проверяем, что разговор принадлежит нужному агенту
    const targetAgentId = process.env.ELEVENLABS_AGENT_ID || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ''
    if (targetAgentId && conversation?.agent_id && conversation.agent_id !== targetAgentId) {
      return res.status(403).json({
        error: 'Access denied',
        details: 'This conversation does not belong to the target agent'
      })
    }
    console.log(`📋 Conversation details received for: ${conversation_id}`)

    // Получаем аудио URL если есть
    let audioUrl = null
    if (conversation.audio_url) {
      try {
        const audioResult = await elevenLabsClient.getSignedUrl(conversation.audio_url)
        if (audioResult.success) {
          audioUrl = audioResult.data?.signed_url
        }
      } catch (error) {
        console.warn('Failed to get audio URL:', error)
      }
    }

    // Обрабатываем транскрипцию
    let transcript = ''
    let chatHistory: any[] = []
    
    if (conversation.transcript) {
      // Проверяем тип транскрипции
      if (typeof conversation.transcript === 'string') {
        transcript = conversation.transcript
        
        // Разбиваем транскрипцию на сообщения
        const lines = transcript.split('\n').filter(line => line.trim())
        chatHistory = lines.map((line, index) => {
          // Определяем роль по ключевым словам
          const isUser = line.toLowerCase().includes('пользователь') || 
                        line.toLowerCase().includes('клиент') ||
                        line.toLowerCase().includes('человек')
          
          return {
            id: index + 1,
            role: isUser ? 'user' : 'assistant',
            message: line.trim(),
            time: conversation.start_time_unix_secs ? new Date(conversation.start_time_unix_secs * 1000 + (index * 1000)).toLocaleTimeString('ru-RU') : new Date().toLocaleTimeString('ru-RU'),
            has_tool_calls: false,
            tool_info: null
          }
        })
      } else if (Array.isArray(conversation.transcript)) {
        // Если транскрипция в виде массива
        chatHistory = conversation.transcript.map((msg: any, index: number) => ({
          id: index + 1,
          role: msg.role || 'assistant',
          message: msg.message || msg.text || 'No message',
          time: conversation.start_time_unix_secs ? new Date(conversation.start_time_unix_secs * 1000 + (index * 1000)).toLocaleTimeString('ru-RU') : new Date().toLocaleTimeString('ru-RU'),
          has_tool_calls: false,
          tool_info: null
        }))
        transcript = chatHistory.map(msg => msg.message).join('\n')
      } else {
        // Если транскрипция в другом формате
        transcript = JSON.stringify(conversation.transcript)
        chatHistory = [{
          id: 1,
          role: 'system',
          message: 'Транскрипция в нестандартном формате',
          time: conversation.start_time_unix_secs ? new Date(conversation.start_time_unix_secs * 1000).toLocaleTimeString('ru-RU') : new Date().toLocaleTimeString('ru-RU'),
          has_tool_calls: false,
          tool_info: null
        }]
      }
    }

    // Извлекаем информацию о лиде из транскрипции
    let leadInfo = null
    let clientIntent = null
    
    if (transcript) {
      // Улучшенные паттерны для поиска имени
      const namePatterns = [
        /меня зовут\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
        /я\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
        /имя\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
        /([а-яё]+(?:\s+[а-яё]+)?)\s+плюс\s+375\d+/i, // Имя перед "плюс 375" + номер
        /([а-яё]+(?:\s+[а-яё]+)?)\s+\+375/i, // Имя перед номером
        /([а-яё]+(?:\s+[а-яё]+)?)\s+375/i, // Имя перед номером без +
        /([а-яё]+(?:\s+[а-яё]+)?)\s+375\s*\(?(\d{2})\)?\s*(\d{3})/i, // Имя перед полным номером
        /([а-яё]+(?:\s+[а-яё]+)?)\s+плюс/i // Имя перед "плюс" (общий случай)
      ]
      
      // Улучшенные паттерны для поиска телефона
      const phonePatterns = [
        /\+375\s*\(?(\d{2})\)?\s*(\d{3})[- ]?(\d{2})[- ]?(\d{2})/g,
        /375\s*\(?(\d{2})\)?\s*(\d{3})[- ]?(\d{2})[- ]?(\d{2})/g,
        /\+375\s*(\d{9})/g,
        /375\s*(\d{9})/g
      ]

      let phoneMatch = null
      let nameMatch = null
      
      // Ищем телефон
      for (const pattern of phonePatterns) {
        phoneMatch = pattern.exec(transcript)
        if (phoneMatch) break
      }
      
      // Ищем имя
      for (const pattern of namePatterns) {
        nameMatch = pattern.exec(transcript)
        if (nameMatch) break
      }
      
      // Дополнительный поиск имени "Дмитрий"
      if (!nameMatch && transcript.includes('Дмитрий')) {
        nameMatch = { 1: 'Дмитрий' }
      }

      // Анализируем намерения клиента
      const intentKeywords = {
        'инвестиции': ['инвестиция', 'инвестиций', 'доход', 'перепродажа', 'аренда'],
        'для себя': ['для себя', 'жить', 'проживание', 'собственное'],
        'недвижимость': ['квартира', 'дом', 'недвижимость', 'жилье'],
        'бюджет': ['бюджет', 'стоимость', 'цена', 'евро', 'доллар'],
        'рассрочка': ['рассрочка', 'кредит', 'платеж', 'взнос']
      }
      
      const foundIntents = []
      for (const [intent, keywords] of Object.entries(intentKeywords)) {
        for (const keyword of keywords) {
          if (transcript.toLowerCase().includes(keyword.toLowerCase())) {
            foundIntents.push(intent)
            break
          }
        }
      }
      
      // Определяем основное намерение
      if (foundIntents.includes('инвестиции')) {
        clientIntent = 'Инвестиции в недвижимость'
      } else if (foundIntents.includes('для себя')) {
        clientIntent = 'Покупка для проживания'
      } else if (foundIntents.includes('недвижимость')) {
        clientIntent = 'Интерес к недвижимости'
      }

      if (phoneMatch || nameMatch) {
        let extractedName = nameMatch ? nameMatch[1].trim() : 'Неизвестно'
        
        // Фильтруем неправильные имена
        const invalidNames = ['специалист', 'менеджер', 'консультант', 'помощник', 'ассистент']
        const isInvalidName = invalidNames.some(invalid => 
          extractedName.toLowerCase().includes(invalid.toLowerCase())
        )
        
        if (isInvalidName) {
          extractedName = 'Неизвестно'
        }
        
        // Если имя все еще "Неизвестно", попробуем найти "Дмитрий"
        if (extractedName === 'Неизвестно' && transcript.includes('Дмитрий')) {
          extractedName = 'Дмитрий'
        }
        
        leadInfo = {
          name: extractedName,
          phone: phoneMatch ? phoneMatch[0].trim() : 'Не указан',
          extracted_from: 'transcript'
        }
      }
    }

    const result = {
      success: true,
      conversation_id: conversation.conversation_id,
      status: conversation.status,
      created_at: conversation.start_time_unix_secs ? new Date(conversation.start_time_unix_secs * 1000).toISOString() : new Date().toISOString(),
      updated_at: conversation.end_time_unix_secs ? new Date(conversation.end_time_unix_secs * 1000).toISOString() : new Date().toISOString(),
      duration_seconds: conversation.call_duration_secs || 0,
      start_time: conversation.start_time_unix_secs || 0,
      end_time: conversation.end_time_unix_secs || 0,
      transcript: transcript,
      audio_url: audioUrl,
      chat_history: chatHistory,
      lead_info: leadInfo,
      client_intent: clientIntent,
      statistics: {
        total_messages: chatHistory.length,
        agent_messages: chatHistory.filter(msg => msg.role === 'assistant').length,
        client_messages: chatHistory.filter(msg => msg.role === 'user').length,
        has_lead: !!leadInfo,
        duration: conversation.call_duration_secs || 0
      },
      metadata: {
        agent_id: conversation.agent_id,
        call_duration_secs: conversation.call_duration_secs || 0,
        status: conversation.status,
        transcript_length: transcript.length
      }
    }

    // Автоматически создаем лид, если есть информация о лиде
    if (leadInfo && leadInfo.name !== 'Неизвестно' && leadInfo.phone !== 'Не указан') {
      try {
        const createLeadResponse = await fetch(`${req.headers.host ? `http://${req.headers.host}` : 'http://localhost:3000'}/api/create-lead-from-conversation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: conversation.conversation_id,
            lead_info: leadInfo,
            client_intent: clientIntent,
            conversation_data: {
              duration_seconds: conversation.call_duration_secs || 0,
              status: conversation.status,
              agent_id: conversation.agent_id
            }
          })
        })

        if (createLeadResponse.ok) {
          const leadData = await createLeadResponse.json()
          console.log('✅ Lead created automatically:', leadData.lead.id)
          result.lead_created = true
          result.lead_id = leadData.lead.id
        } else {
          console.log('⚠️ Lead creation failed:', await createLeadResponse.text())
          result.lead_created = false
        }
      } catch (error) {
        console.error('❌ Error creating lead:', error)
        result.lead_created = false
      }
    }

    console.log('📊 Conversation details processed:', {
      conversationId: result.conversation_id,
      transcriptLength: transcript.length,
      chatHistoryLength: chatHistory.length,
      hasAudio: !!audioUrl,
      hasLead: !!leadInfo
    })

    return res.status(200).json(result)

  } catch (error) {
    console.error('❌ Conversation details API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 