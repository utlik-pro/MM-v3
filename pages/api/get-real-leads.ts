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
    console.log('🔍 Fetching real leads from ElevenLabs Tools API...')

    const elevenLabsClient = createDefaultElevenLabsClient()
    const targetToolId = 'xi4EFSeulNpmBWxSC9b4'

    // Получаем список всех tools
    console.log('📋 Getting tools list...')
    const toolsResult = await elevenLabsClient.listTools()

    if (!toolsResult.success) {
      throw new Error(`Failed to get tools: ${toolsResult.error}`)
    }

    console.log('🛠️ Available tools:', toolsResult.data?.tools?.length || 0)

    // Ищем наш целевой tool
    const targetTool = toolsResult.data?.tools?.find(tool => tool.id === targetToolId)

    if (!targetTool) {
      return res.status(404).json({
        error: 'Target tool not found',
        target_tool_id: targetToolId,
        available_tools: toolsResult.data?.tools?.map(t => ({ 
          id: t.id, 
          name: t.tool_config?.name || 'Unknown', 
          type: 'tool'
        })) || []
      })
    }

    console.log('🎯 Found target tool:', targetTool.tool_config?.name || 'Unknown')

    // Получаем детали tool
    const toolDetailResult = await elevenLabsClient.getTool(targetToolId)

    if (!toolDetailResult.success) {
      throw new Error(`Failed to get tool details: ${toolDetailResult.error}`)
    }

    console.log('📊 Tool details received')

    // Пытаемся получить данные о submissions/results
    // Это может быть в metadata, parameters или отдельном endpoint
    const toolDetail = toolDetailResult.data

    // Получаем последние разговоры, чтобы найти использование этого tool
    console.log('💬 Getting recent conversations...')
    const conversationsResult = await elevenLabsClient.listConversations({ 
      page_size: 50  // Больше разговоров для поиска использований tool
    })

    if (!conversationsResult.success) {
      throw new Error(`Failed to get conversations: ${conversationsResult.error}`)
    }

    console.log('💬 Found conversations:', conversationsResult.data?.conversations?.length || 0)

    // Анализируем разговоры на предмет использования нашего tool
    const toolUsageConversations = []
    const realLeadsData = []

    if (conversationsResult.data?.conversations) {
      for (const conversation of conversationsResult.data.conversations) {
        try {
          // Получаем детали разговора
          const convDetailResult = await elevenLabsClient.getConversation(conversation.conversation_id)
          
          if (convDetailResult.success && convDetailResult.data) {
            const convDetail = convDetailResult.data
            
            // Проверяем, использовался ли наш tool в этом разговоре
            const transcript = JSON.stringify(convDetail.transcript || [])
            const metadata = JSON.stringify(convDetail)
            
            // Ищем упоминания tool ID или связанных данных
            if (metadata.includes(targetToolId) || 
                transcript.includes('quiz') || 
                transcript.includes('опрос') ||
                transcript.includes('анкета')) {
              
              const endTime = conversation.start_time_unix_secs + conversation.call_duration_secs
              
              toolUsageConversations.push({
                conversation_id: conversation.conversation_id,
                start_time: conversation.start_time_unix_secs,
                end_time: endTime,
                duration: conversation.call_duration_secs,
                transcript: transcript.substring(0, 200) + '...',
                found_tool_usage: metadata.includes(targetToolId)
              })

              // Извлекаем данные лида из разговора
              const leadData = extractLeadFromConversation(convDetail, targetToolId)
              if (leadData) {
                realLeadsData.push(leadData)
              }
            }
          }
          
          // Небольшая пауза между запросами
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (convError) {
          console.warn('Failed to get conversation detail:', conversation.conversation_id, convError)
        }
      }
    }

    console.log('🎯 Found tool usage in conversations:', toolUsageConversations.length)
    console.log('📋 Extracted real leads:', realLeadsData.length)

    return res.status(200).json({
      success: true,
      target_tool: {
        id: targetToolId,
        name: targetTool.tool_config?.name || 'Unknown',
        type: 'tool',
        details: toolDetail
      },
      analysis: {
        total_conversations_checked: conversationsResult.data?.conversations?.length || 0,
        tool_usage_conversations: toolUsageConversations.length,
        real_leads_found: realLeadsData.length
      },
      tool_usage_conversations: toolUsageConversations,
      real_leads_data: realLeadsData,
      recommendations: [
        'Found conversations where the quiz tool was potentially used',
        'Real lead data extracted from conversation transcripts',
        'Consider integrating this data with the enhanced webhook',
        'Tool usage indicates actual user engagement with lead generation'
      ]
    })

  } catch (error) {
    console.error('❌ Real leads API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function extractLeadFromConversation(conversationDetail: any, toolId: string) {
  const transcript = conversationDetail.transcript || ''
  const conversationId = conversationDetail.conversation_id
  
  // Базовая экстракция контактной информации
  const phonePattern = /\+375\s*\(?(\d{2})\)?\s*(\d{3})[- ]?(\d{2})[- ]?(\d{2})/g
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  const namePatterns = [
    /меня зовут\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
    /я\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
    /имя\s+([а-яё]+(?:\s+[а-яё]+)?)/i
  ]

  const phoneMatch = phonePattern.exec(transcript)
  const emailMatch = emailPattern.exec(transcript)
  
  let nameMatch = null
  for (const pattern of namePatterns) {
    nameMatch = pattern.exec(transcript)
    if (nameMatch) break
  }

  // Только возвращаем данные, если есть контактная информация
  if (phoneMatch || emailMatch || nameMatch) {
    return {
      conversation_id: conversationId,
      source_tool_id: toolId,
      extracted_at: new Date().toISOString(),
      contact_info: {
        name: nameMatch ? nameMatch[1].trim() : null,
        phone: phoneMatch ? phoneMatch[0].trim() : null,
        email: emailMatch ? emailMatch[1].trim() : null
      },
      transcript_excerpt: transcript.substring(0, 300),
      conversation_metadata: {
        start_time: conversationDetail.start_time_unix_secs,
        end_time: conversationDetail.end_time_unix_secs,
        duration: conversationDetail.end_time_unix_secs - conversationDetail.start_time_unix_secs,
        agent_id: conversationDetail.agent_id
      }
    }
  }

  return null
} 