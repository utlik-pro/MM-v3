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
    console.log('🔍 Analyzing tool calls for real leads...')

    const elevenLabsClient = createDefaultElevenLabsClient()
    const targetToolId = 'xi4EFSeulNpmBWxSC9b4'

    // Получаем последние разговоры
    const conversationsResult = await elevenLabsClient.listConversations({ 
      page_size: 50
    })

    if (!conversationsResult.success) {
      throw new Error(`Failed to get conversations: ${conversationsResult.error}`)
    }

    console.log('💬 Analyzing', conversationsResult.data?.conversations?.length || 0, 'conversations...')

    const realLeads = []
    const toolCallsAnalysis = []

    if (conversationsResult.data?.conversations) {
      for (const conversation of conversationsResult.data.conversations) {
        try {
          // Получаем детали разговора
          const convDetailResult = await elevenLabsClient.getConversation(conversation.conversation_id)
          
          if (convDetailResult.success && convDetailResult.data?.transcript) {
            const transcript = convDetailResult.data.transcript

            // Анализируем каждое сообщение на предмет tool_calls
            for (const message of transcript) {
              const messageAny = message as any // Временно используем any для доступа к tool_calls
              if (messageAny.tool_calls && messageAny.tool_calls.length > 0) {
                for (const toolCall of messageAny.tool_calls) {
                  // Проверяем, использовался ли наш целевой tool
                  if (toolCall.id === targetToolId || toolCall.function?.name === 'SendToCRMLead') {
                    
                    console.log('🎯 Found tool call!', {
                      conversation_id: conversation.conversation_id,
                      tool_id: toolCall.id,
                      function_name: toolCall.function?.name,
                      arguments: toolCall.function?.arguments
                    })

                    toolCallsAnalysis.push({
                      conversation_id: conversation.conversation_id,
                      message_role: message.role,
                      tool_call_id: toolCall.id,
                      function_name: toolCall.function?.name,
                      arguments: toolCall.function?.arguments,
                      timestamp: message.timestamp_unix_secs,
                      conversation_duration: conversation.call_duration_secs
                    })

                    // Извлекаем данные лида из аргументов tool call
                    if (toolCall.function?.arguments) {
                      try {
                        const leadData = typeof toolCall.function.arguments === 'string' 
                          ? JSON.parse(toolCall.function.arguments)
                          : toolCall.function.arguments

                        if (leadData.Phone || leadData.FullName) {
                          realLeads.push({
                            conversation_id: conversation.conversation_id,
                            tool_call_id: toolCall.id,
                            lead_data: leadData,
                            extracted_at: new Date().toISOString(),
                            conversation_metadata: {
                              agent_id: conversation.agent_id,
                              start_time: conversation.start_time_unix_secs,
                              duration: conversation.call_duration_secs,
                              status: conversation.status,
                              agent_name: conversation.agent_name
                            }
                          })

                          console.log('📋 Extracted real lead:', leadData)
                        }
                      } catch (parseError) {
                        console.warn('Failed to parse tool call arguments:', parseError)
                      }
                    }
                  }
                }
              }

              // Также проверяем tool_results для результатов выполнения
              if (messageAny.tool_results && messageAny.tool_results.length > 0) {
                for (const toolResult of messageAny.tool_results) {
                  if (toolResult.tool_call_id && toolCallsAnalysis.some((tc: any) => tc.tool_call_id === toolResult.tool_call_id)) {
                    console.log('✅ Found tool result:', {
                      tool_call_id: toolResult.tool_call_id,
                      result: toolResult.result,
                      is_error: toolResult.is_error
                    })

                    // Обновляем анализ с результатом
                    const analysisItem = toolCallsAnalysis.find((tc: any) => tc.tool_call_id === toolResult.tool_call_id) as any
                    if (analysisItem) {
                      analysisItem.result = toolResult.result
                      analysisItem.is_error = toolResult.is_error
                    }
                  }
                }
              }
            }
          }
          
          // Пауза между запросами
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (convError) {
          console.warn('Failed to analyze conversation:', conversation.conversation_id, convError)
        }
      }
    }

    // Сортируем лиды по времени создания (новые сначала)
    realLeads.sort((a, b) => b.conversation_metadata.start_time - a.conversation_metadata.start_time)
    toolCallsAnalysis.sort((a, b) => b.timestamp - a.timestamp)

    console.log('🎯 Analysis complete:', {
      total_conversations: conversationsResult.data?.conversations?.length || 0,
      tool_calls_found: toolCallsAnalysis.length,
      real_leads_extracted: realLeads.length
    })

    return res.status(200).json({
      success: true,
      target_tool_id: targetToolId,
      analysis_summary: {
        total_conversations_analyzed: conversationsResult.data?.conversations?.length || 0,
        tool_calls_found: toolCallsAnalysis.length,
        real_leads_extracted: realLeads.length,
        latest_lead_date: realLeads[0]?.extracted_at || null
      },
      tool_calls_analysis: toolCallsAnalysis,
      real_leads: realLeads,
      lead_statistics: {
        leads_with_phone: realLeads.filter(lead => lead.lead_data.Phone).length,
        leads_with_name: realLeads.filter(lead => lead.lead_data.FullName).length,
        leads_with_both: realLeads.filter(lead => lead.lead_data.Phone && lead.lead_data.FullName).length,
        avg_conversation_duration: realLeads.length > 0 
          ? Math.round(realLeads.reduce((sum, lead) => sum + lead.conversation_metadata.duration, 0) / realLeads.length)
          : 0
      },
      next_steps: [
        'Integrate these real leads with the enhanced webhook',
        'Create automation to sync tool call results with leads table',
        'Set up monitoring for new tool calls in real-time',
        'Validate CRM integration is working properly'
      ]
    })

  } catch (error) {
    console.error('❌ Tool calls analysis error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 