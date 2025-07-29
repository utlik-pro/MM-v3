import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🎭 Running Enhanced Webhook Demo...')

    const demoScenarios = [
      {
        name: 'High-Quality Purchase Intent Lead',
        payload: {
          transcript: "Добрый день! Меня зовут Елена Петрова. Я хочу купить ваши услуги сегодня же. Готова заплатить хорошие деньги. Мой номер +375 44 555-77-99, email elena.petrova@company.by. Это очень срочно!",
          eleven_labs_conversation_id: "conv_demo_high_quality",
          conversation_end_reason: "user_ended",
          conversation_duration_secs: 180,
          agentId: "agent_01jxkr0mstfk6ttayjsghjm7xc",
          metadata: { demo: true, scenario: "high_quality" }
        }
      },
      {
        name: 'Medium-Quality Information Lead',
        payload: {
          transcript: "Привет. Я Сергей. Можете рассказать о ваших услугах? Интересует стоимость. Телефон +375 25 444-33-22. Спасибо.",
          eleven_labs_conversation_id: "conv_demo_medium_quality",
          conversation_end_reason: "timeout",
          conversation_duration_secs: 45,
          agentId: "agent_01jxkr0mstfk6ttayjsghjm7xc",
          metadata: { demo: true, scenario: "medium_quality" }
        }
      },
      {
        name: 'Low-Quality Lead (No Contact)',
        payload: {
          transcript: "Здравствуйте. Просто интересуюсь вашими услугами. Пока думаю. До свидания.",
          eleven_labs_conversation_id: "conv_demo_low_quality",
          conversation_end_reason: "user_ended",
          conversation_duration_secs: 15,
          agentId: "agent_01jxkr0mstfk6ttayjsghjm7xc",
          metadata: { demo: true, scenario: "low_quality" }
        }
      }
    ]

    const results = []

    for (const scenario of demoScenarios) {
      console.log(`🧪 Testing scenario: ${scenario.name}`)
      
      try {
        const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhook/voice-lead-enhanced`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scenario.payload)
        })

        const webhookResult = await webhookResponse.json()

        results.push({
          scenario: scenario.name,
          status: webhookResponse.status,
          result: webhookResult,
          success: webhookResponse.status === 200
        })

        // Небольшая пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        results.push({
          scenario: scenario.name,
          status: 500,
          result: { error: error instanceof Error ? error.message : 'Unknown error' },
          success: false
        })
      }
    }

    // Сбор статистики демо
    const demoStats = {
      total_scenarios: demoScenarios.length,
      successful_scenarios: results.filter(r => r.success).length,
      failed_scenarios: results.filter(r => !r.success).length,
      
      quality_distribution: results
        .filter(r => r.success && r.result.quality_score)
        .map(r => ({
          scenario: r.scenario,
          quality_score: r.result.quality_score,
          lead_created: !!r.result.lead?.id
        })),
      
      leads_created: results
        .filter(r => r.success && r.result.lead?.id)
        .map(r => ({
          scenario: r.scenario,
          lead_id: r.result.lead.id,
          contact_info: r.result.lead.contact_info ? JSON.parse(r.result.lead.contact_info) : null,
          quality_score: r.result.quality_score,
          extracted_entities: r.result.enhanced_analysis
        }))
    }

    console.log('🎯 Demo completed. Results:', demoStats)

    return res.status(200).json({
      success: true,
      message: 'Enhanced webhook demo completed',
      demo_scenarios: demoScenarios.map(s => ({ name: s.name, transcript_preview: s.payload.transcript.substring(0, 100) + '...' })),
      results,
      stats: demoStats,
      recommendations: [
        'High-quality leads with purchase intent receive scores 90+',
        'Leads with complete contact info (name, phone, email) get higher scores',
        'Urgency keywords ("срочно", "сегодня") boost lead quality',
        'Conversation duration and sentiment affect the final score',
        'Enhanced webhook captures more data than basic version'
      ]
    })

  } catch (error) {
    console.error('❌ Demo error:', error)
    return res.status(500).json({ 
      error: 'Demo failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 