import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Тестовый payload с данными Василия
    const testPayload = {
      Phone: '+375291234567',  // Примерный номер для Василия
      FullName: 'Василий',
      UsrMinskMir: 'Минск Мир',
      Commentary: 'Тестовый лид от Василия через proxy webhook'
    }

    console.log('🧪 Testing proxy webhook with Василий data:', testPayload)

    // Отправляем в proxy webhook
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const webhookResponse = await fetch(`${baseUrl}/api/webhook/proxy-crm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Lead-Source': 'belhard-voice-agent'
      },
      body: JSON.stringify(testPayload)
    })

    const webhookResult = await webhookResponse.json()

    if (!webhookResponse.ok) {
      throw new Error(`Proxy webhook failed: ${webhookResponse.status} ${webhookResult.error || 'Unknown error'}`)
    }

    console.log('✅ Proxy webhook test successful:', webhookResult)

    return res.status(200).json({
      success: true,
      message: 'Proxy webhook test completed successfully',
      test_payload: testPayload,
      webhook_response: webhookResult,
      instructions: {
        next_step: 'Check /api/monitor-leads to see if the lead appeared',
        monitoring_url: '/lead-monitor',
        proxy_webhook_url: '/api/webhook/proxy-crm'
      }
    })

  } catch (error) {
    console.error('❌ Proxy webhook test failed:', error)
    return res.status(500).json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 