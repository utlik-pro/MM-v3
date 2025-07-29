import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🧪 Testing enhanced webhook with real conversation...')

    // Используем реальный conversation ID из синхронизированных данных
    const testPayload = {
      transcript: "Привет! Меня зовут Дмитрий. Хочу узнать о ваших услугах. Мой номер +375 33 987-65-43. Когда можно встретиться?",
      eleven_labs_conversation_id: "conv_01k0gz040zec79qd2n1fr2gkzc", // Реальный ID из нашей базы
      conversation_end_reason: "user_ended",
      conversation_duration_secs: 119,
      agentId: "agent_01jxkr0mstfk6ttayjsghjm7xc",
      metadata: {
        test: true,
        source: "api_test_with_conversation",
        timestamp: new Date().toISOString()
      }
    }

    console.log('📤 Sending payload with real conversation ID:', testPayload.eleven_labs_conversation_id)

    // Вызываем enhanced webhook
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhook/voice-lead-enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    })

    const webhookResult = await webhookResponse.json()

    console.log('📥 Enhanced webhook response with conversation data:', webhookResult)

    return res.status(200).json({
      success: true,
      test_payload: testPayload,
      webhook_response: webhookResult,
      webhook_status: webhookResponse.status,
      message: 'Enhanced webhook test with conversation data completed',
      conversation_integration: webhookResult.conversation_data ? 'SUCCESS' : 'NO_CONVERSATION_DATA'
    })

  } catch (error) {
    console.error('❌ Enhanced webhook conversation test error:', error)
    return res.status(500).json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 