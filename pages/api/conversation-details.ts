import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { ElevenLabsClient } from '../../lib/elevenlabs/client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { conversationId, elevenLabsId } = req.query

    if (!conversationId && !elevenLabsId) {
      return res.status(400).json({ 
        error: 'conversation_id or eleven_labs_conversation_id is required' 
      })
    }

    console.log('🔍 Fetching conversation details:', { conversationId, elevenLabsId })

    let conversationData = null
    let elevenLabsData = null

    // Получаем данные из нашей базы
    if (conversationId) {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          leads!conversations_id_fkey (
            id,
            contact_info,
            lead_quality_score,
            source,
            status,
            created_at
          )
        `)
        .eq('id', conversationId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.warn('Database query error:', error)
      } else if (data) {
        conversationData = data
      }
    }

    // Если есть ElevenLabs ID, получаем данные оттуда
    const targetElevenLabsId = elevenLabsId || conversationData?.eleven_labs_conversation_id

    if (targetElevenLabsId) {
      try {
        console.log('🎯 Fetching from ElevenLabs:', targetElevenLabsId)
        
        const elevenLabsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! })
        const conversationResult = await elevenLabsClient.getConversation(targetElevenLabsId as string)

        if (conversationResult.success && conversationResult.data) {
          elevenLabsData = conversationResult.data
          console.log('✅ ElevenLabs data retrieved successfully')
        } else {
          console.warn('❌ ElevenLabs fetch failed:', conversationResult.error)
        }
      } catch (elevenLabsError) {
        console.error('❌ ElevenLabs API error:', elevenLabsError)
      }
    }

    // Если нет данных ни из нашей базы, ни из ElevenLabs
    if (!conversationData && !elevenLabsData) {
      return res.status(404).json({ 
        error: 'Conversation not found',
        searched_ids: { conversationId, elevenLabsId }
      })
    }

    // Обработка транскрипта
    let processedTranscript = null
    if (elevenLabsData?.transcript) {
      try {
        // Парсим транскрипт, если он в JSON формате
        const transcript = typeof elevenLabsData.transcript === 'string' 
          ? JSON.parse(elevenLabsData.transcript) 
          : elevenLabsData.transcript

        processedTranscript = Array.isArray(transcript) 
          ? transcript.map((msg: any, index: number) => ({
              id: index,
              role: msg.role || 'unknown',
              message: msg.message || msg.text || 'No message',
              timestamp: msg.time_in_call_secs || index,
              tool_calls: msg.tool_calls || [],
              tool_results: msg.tool_results || []
            }))
          : [{ 
              id: 0, 
              role: 'system', 
              message: 'Transcript format not recognized',
              timestamp: 0 
            }]
      } catch (parseError) {
        console.warn('Failed to parse transcript:', parseError)
        processedTranscript = [{ 
          id: 0, 
          role: 'system', 
          message: 'Transcript parsing failed',
          timestamp: 0 
        }]
      }
    } else if (conversationData?.transcriptJson) {
      try {
        const transcript = JSON.parse(conversationData.transcriptJson)
        processedTranscript = Array.isArray(transcript) 
          ? transcript.map((msg: any, index: number) => ({
              id: index,
              role: msg.role || 'unknown',
              message: msg.message || msg.text || 'No message',
              timestamp: msg.time_in_call_secs || index
            }))
          : [{ 
              id: 0, 
              role: 'system', 
              message: 'Database transcript format not recognized',
              timestamp: 0 
            }]
      } catch (parseError) {
        console.warn('Failed to parse database transcript:', parseError)
        processedTranscript = []
      }
    }

    // Формируем ответ
    const response = {
      success: true,
      conversation: {
        // Основные данные
        id: conversationData?.id || null,
        eleven_labs_id: targetElevenLabsId,
        status: conversationData?.status || elevenLabsData?.status || 'unknown',
        
        // Временные данные
        created_at: conversationData?.created_at || null,
        start_time: elevenLabsData?.start_time_unix_secs ? 
          new Date(elevenLabsData.start_time_unix_secs * 1000).toISOString() : null,
        end_time: elevenLabsData?.end_time_unix_secs ? 
          new Date(elevenLabsData.end_time_unix_secs * 1000).toISOString() : null,
        duration_secs: elevenLabsData?.call_duration_secs || 
          (conversationData?.metadata && JSON.parse(conversationData.metadata)?.duration) || null,

        // Метаданные
        language: conversationData?.language || 'unknown',
        sentiment_score: conversationData?.sentimentScore || null,
        topics: conversationData?.topics || [],
        
        // Агент данные
        agent_id: elevenLabsData?.agent_id || conversationData?.agent_id || null,
        
        // Связанные лиды
        related_leads: conversationData?.leads || [],
        
        // Транскрипт
        transcript: processedTranscript,
        has_transcript: !!processedTranscript && processedTranscript.length > 0,
        
        // Аудио данные
        has_audio: !!elevenLabsData,
        audio_info: elevenLabsData ? {
          agent_id: elevenLabsData.agent_id,
          conversation_id: elevenLabsData.conversation_id,
          can_fetch_audio: true
        } : null
      },
      
      data_sources: {
        database: !!conversationData,
        elevenlabs: !!elevenLabsData,
        transcript_source: processedTranscript ? (elevenLabsData ? 'elevenlabs' : 'database') : null
      },

      actions: {
        can_play_audio: !!elevenLabsData && !!targetElevenLabsId,
        can_download_audio: !!elevenLabsData && !!targetElevenLabsId,
        audio_endpoint: targetElevenLabsId ? `/api/conversation-audio?id=${targetElevenLabsId}` : null
      }
    }

    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Conversation details error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 