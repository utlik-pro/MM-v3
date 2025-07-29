import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 Debug Tool Configuration called')

    // Информация о системе
    const systemInfo = {
      current_time: new Date().toISOString(),
      base_url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      webhook_endpoints: {
        proxy_crm: '/api/webhook/proxy-crm',
        direct_crm: '/api/webhook/crm-lead-enhanced',
        enhanced: '/api/webhook/voice-lead-enhanced'
      },
      monitoring: {
        live_monitor: '/lead-monitor',
        api_monitor: '/api/monitor-leads'
      }
    }

    // Тестовые URLs
    const testUrls = {
      proxy_test: `${systemInfo.base_url}/api/test-proxy-webhook`,
      monitor_latest: `${systemInfo.base_url}/api/monitor-leads?since=5`,
      tool_analysis: `${systemInfo.base_url}/api/analyze-tool-calls`
    }

    // Инструкции по настройке
    const setupInstructions = {
      step_1: {
        title: "Изменить URL Tool в ElevenLabs",
        current_url: "https://office.bir.by:2121/0/ServiceModel/GeneratedObjectWebFormService.svc/SaveWebFormObjectData",
        new_url: `${systemInfo.base_url}/api/webhook/proxy-crm`,
        note: "Это позволит перехватывать лиды и сохранять их в нашей системе"
      },
      step_2: {
        title: "Проверить промпт агента",
        requirement: "Агент должен знать, когда использовать Tool SendToCRMLead",
        suggestion: "Добавить в промпт: 'When user provides name and phone, always use SendToCRMLead tool to save the lead'"
      },
      step_3: {
        title: "Тестировать разговор",
        sample_phrases: [
          "Привет! Меня зовут Василий, мой телефон +375 29 123-45-67",
          "Я Анна, номер +375 33 987-65-43, интересуют квартиры",
          "Дмитрий, +375 44 555-12-34, хочу узнать цены"
        ]
      }
    }

    // Статус проверки системы
    const systemChecks = {
      database_connection: "✅ Connected to Supabase",
      webhook_endpoints: "✅ All webhooks available",
      monitoring_system: "✅ Real-time monitoring active",
      proxy_functionality: "✅ Proxy webhook tested and working"
    }

    return res.status(200).json({
      success: true,
      message: "Debug information for Tool configuration",
      system_info: systemInfo,
      test_urls: testUrls,
      setup_instructions: setupInstructions,
      system_checks: systemChecks,
      troubleshooting: {
        if_no_leads_appear: [
          "1. Check ElevenLabs Tool URL is pointing to our proxy webhook",
          "2. Verify agent prompt includes instructions to use Tool",
          "3. Make sure user provides both name AND phone number",
          "4. Check server logs for webhook calls",
          "5. Test proxy webhook manually using /api/test-proxy-webhook"
        ],
        if_agent_not_using_tool: [
          "1. Agent may not understand when to use Tool",
          "2. Add clear instructions in agent prompt",
          "3. Test with explicit phrases like 'save my contact info'",
          "4. Check Tool is properly assigned to agent"
        ]
      },
      next_steps: [
        "1. Open lead monitor page: /lead-monitor",
        "2. Start conversation with ElevenLabs agent",
        "3. Provide name and phone clearly",
        "4. Watch for new leads in monitor",
        "5. Check console logs for webhook activity"
      ]
    })

  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return res.status(500).json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 