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

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'conversation_id is required' })
    }

    console.log('🎵 Fetching audio for conversation:', id)

    let elevenLabsConversationId = id

    // Проверяем, является ли это Supabase conversation_id или ElevenLabs conversation_id
    if (!id.startsWith('conv_')) {
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
    
    // Получаем аудио из системы
    const audioResult = await elevenLabsClient.getConversationAudio(elevenLabsConversationId)

    console.log('🔍 Audio result:', {
      success: audioResult.success,
      hasData: !!audioResult.data,
      dataType: typeof audioResult.data,
      dataSize: audioResult.data ? audioResult.data.byteLength : 'N/A',
      error: audioResult.error
    })

    if (!audioResult.success) {
      console.error('❌ Audio fetch failed:', audioResult.error)
      return res.status(404).json({ 
        error: 'Audio not found or not available',
        details: audioResult.error 
      })
    }

    if (!audioResult.data || audioResult.data.byteLength === 0) {
      console.error('❌ Empty audio data received')
      return res.status(404).json({
        error: 'Audio data is empty',
        details: 'Received empty audio buffer from ElevenLabs'
      })
    }

    console.log(`✅ Sending audio: ${audioResult.data.byteLength} bytes`)

    // Устанавливаем правильные заголовки для аудио
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Disposition', `inline; filename="conversation_${id}.mp3"`)
    res.setHeader('Cache-Control', 'public, max-age=86400') // Кешируем на 24 часа
    res.setHeader('Content-Length', audioResult.data.byteLength.toString())

    // Возвращаем аудио данные как Buffer
    return res.status(200).send(Buffer.from(audioResult.data))

  } catch (error) {
    console.error('❌ Audio endpoint error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 