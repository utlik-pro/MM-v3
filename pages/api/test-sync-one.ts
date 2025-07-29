import type { NextApiRequest, NextApiResponse } from 'next'
import { createDefaultElevenLabsClient } from '../../lib/elevenlabs'
import { supabase } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🧪 Testing single conversation sync...')
    
    // 1. Получаем разговоры от системы
    const elevenLabsClient = createDefaultElevenLabsClient()
    const conversationsResult = await elevenLabsClient.listConversations({ page_size: 1 })
    
    if (!conversationsResult.success || !conversationsResult.data) {
      return res.status(500).json({ 
        error: 'Failed to fetch from ElevenLabs',
        details: conversationsResult.error
      })
    }

    const conversations = conversationsResult.data.conversations
    if (conversations.length === 0) {
      return res.status(200).json({ 
        message: 'No conversations to sync',
        count: 0
      })
    }

    const conversation = conversations[0]
    console.log('📞 Processing conversation:', conversation.conversation_id)

    // 2. Проверяем, есть ли уже в базе
    const { data: existing, error: searchError } = await supabase
      .from('conversations')
      .select('id, eleven_labs_conversation_id')
      .eq('eleven_labs_conversation_id', conversation.conversation_id)
      .limit(1)

    if (searchError) {
      throw new Error(`Database search error: ${searchError.message}`)
    }

    console.log('🔍 Existing in DB:', existing?.length || 0)

    // 3. Получаем детали разговора
    const detailResult = await elevenLabsClient.getConversation(conversation.conversation_id)
    let conversationDetail = null
    
    if (detailResult.success && detailResult.data) {
      conversationDetail = detailResult.data
      console.log('📋 Got conversation details')
    }

    // 4. Подготавливаем данные
    const mapStatus = (status: string): string => {
      switch (status.toLowerCase()) {
        case 'done':
        case 'completed':
          return 'COMPLETED'
        case 'active':
        case 'in-progress':
        case 'initiated':
          return 'ACTIVE'
        case 'failed':
        case 'error':
          return 'FAILED'
        case 'timeout':
        case 'cancelled':
          return 'TIMEOUT'
        default:
          return 'ACTIVE'
      }
    }

    const conversationData = {
      client_id: 'default-client',
      agent_id: conversation.agent_id,
      eleven_labs_conversation_id: conversation.conversation_id,
      external_id: conversation.conversation_id,
      
      status: mapStatus(conversation.status),
      started_at: new Date(conversation.start_time_unix_secs * 1000).toISOString(),
      ended_at: conversationDetail?.end_time_unix_secs 
        ? new Date(conversationDetail.end_time_unix_secs * 1000).toISOString() 
        : null,
      duration: conversation.call_duration_secs,
      
      transcript: conversationDetail?.transcript ? JSON.stringify(conversationDetail.transcript) : null,
      transcript_json: conversationDetail?.transcript || null,
      summary: `Conversation: ${conversation.conversation_id} | Agent: ${conversation.agent_name} | Duration: ${conversation.call_duration_secs} seconds`,
      
      language: 'ru',
      metadata: JSON.stringify({
        agent_name: conversation.agent_name,
        message_count: conversation.message_count,
        call_successful: conversation.call_successful,
        source: 'elevenlabs',
        sync_time: new Date().toISOString(),
        raw_conversation: conversation,
        raw_detail: conversationDetail
      })
    }

    console.log('💾 Prepared data:', {
      conversation_id: conversationData.eleven_labs_conversation_id,
      agent_id: conversationData.agent_id,
      duration: conversationData.duration
    })

    // 5. Сохраняем в базу
    if (existing && existing.length > 0) {
      console.log('🔄 Updating existing conversation...')
      const { error: updateError } = await supabase
        .from('conversations')
        .update(conversationData)
        .eq('eleven_labs_conversation_id', conversation.conversation_id)

      if (updateError) {
        throw new Error(`Update error: ${updateError.message}`)
      }

      return res.status(200).json({
        success: true,
        message: 'Conversation updated successfully',
        action: 'updated',
        conversation_id: conversation.conversation_id,
        data: conversationData
      })
    } else {
      console.log('➕ Creating new conversation...')
      const { data: insertedData, error: insertError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()

      if (insertError) {
        throw new Error(`Insert error: ${insertError.message}`)
      }

      return res.status(200).json({
        success: true,
        message: 'Conversation created successfully',
        action: 'created',
        conversation_id: conversation.conversation_id,
        data: conversationData,
        inserted: insertedData
      })
    }

  } catch (error) {
    console.error('❌ Test sync error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return res.status(500).json({ 
      error: 'Test sync failed',
      details: errorMsg,
      timestamp: new Date().toISOString()
    })
  }
} 