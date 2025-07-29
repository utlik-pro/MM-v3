import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🧪 Testing enhanced webhook...')

    // Тестовые данные с реалистичным транскриптом
    const testPayload = {
      transcript: "Здравствуйте! Меня зовут Анна. Я хочу узнать цену на ваши услуги. Мой телефон +375 29 123-45-67, можете перезвонить сегодня? Это срочно, нужно заказать услугу до завтра. Мой email anna@example.com",
      eleven_labs_conversation_id: "conv_test_enhanced_001",
      conversation_end_reason: "user_ended",
      conversation_duration_secs: 95,
      agentId: "agent_01jxkr0mstfk6ttayjsghjm7xc",
      metadata: {
        test: true,
        source: "api_test",
        timestamp: new Date().toISOString()
      }
    }

    console.log('📤 Sending test payload to enhanced webhook...')

    // Вызываем enhanced webhook
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhook/voice-lead-enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    })

    const webhookResult = await webhookResponse.json()

    console.log('📥 Enhanced webhook response:', webhookResult)

    return res.status(200).json({
      success: true,
      test_payload: testPayload,
      webhook_response: webhookResult,
      webhook_status: webhookResponse.status,
      message: 'Enhanced webhook test completed'
    })

  } catch (error) {
    console.error('❌ Enhanced webhook test error:', error)
    return res.status(500).json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 