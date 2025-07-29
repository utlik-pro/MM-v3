import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

interface ProxyLead {
  Phone: string
  FullName: string
  UsrMinskMir?: string
  Commentary?: string
  [key: string]: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔄 Proxy CRM Webhook called:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  })

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const leadData: ProxyLead = req.body

    console.log('📞 Incoming lead data:', leadData)

    // Валидация обязательных полей
    if (!leadData.Phone || !leadData.FullName) {
      console.error('❌ Missing required fields:', { 
        hasPhone: !!leadData.Phone, 
        hasName: !!leadData.FullName 
      })
      return res.status(400).json({ 
        error: 'Missing required fields: Phone and FullName are required' 
      })
    }

    // Нормализация телефона
    const normalizePhone = (phone: string): string => {
      const cleaned = phone.replace(/[^\d+]/g, '')
      if (cleaned.startsWith('375')) return '+' + cleaned
      if (cleaned.startsWith('+375')) return cleaned
      if (cleaned.startsWith('8') && cleaned.length === 13) {
        return '+375' + cleaned.slice(1)
      }
      return cleaned.startsWith('+') ? cleaned : '+' + cleaned
    }

    const normalizedPhone = normalizePhone(leadData.Phone)

    // Подготовка данных для сохранения
    const enhancedLeadData = {
      client_id: 'default-client',
      agent_id: 'agent_01jxkr0mstfk6ttayjsghjm7xc', // Используем существующий agent
      conversation_id: null,
      source_conversation_id: null,
      contact_info: JSON.stringify({
        name: leadData.FullName,
        phone: normalizedPhone,
        original_phone: leadData.Phone,
        email: null
      }),
      conversation_summary: `Proxy Lead: ${leadData.FullName} (${normalizedPhone})`,
      extracted_entities: {
        name: leadData.FullName,
        phone: normalizedPhone,
        original_phone: leadData.Phone,
        project: leadData.UsrMinskMir || null,
        commentary: leadData.Commentary || null,
        extraction_method: 'proxy_crm_webhook',
        tool_id: 'xi4EFSeulNpmBWxSC9b4',
        extracted_at: new Date().toISOString()
      },
      lead_quality_score: 85, // Базовый score для proxy лидов
      source: 'proxy_crm_elevenlabs',
      status: 'NEW',
      score: 85,
      notes: `Proxy CRM Lead: ${leadData.Commentary || 'No additional comments'}`,
      metadata: JSON.stringify({
        proxy_source: true,
        original_tool_url: 'office.bir.by',
        tool_id: 'xi4EFSeulNpmBWxSC9b4',
        received_at: new Date().toISOString(),
        original_payload: leadData
      })
    }

    console.log('💾 Saving proxy lead to database...')

    // Проверка на дубликаты (последние 5 минут)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, contact_info, created_at')
      .gte('created_at', fiveMinutesAgo)
      .eq('source', 'proxy_crm_elevenlabs')

    const isDuplicate = existingLeads?.some(lead => {
      try {
        const contactInfo = JSON.parse(lead.contact_info)
        return contactInfo.phone === normalizedPhone
      } catch {
        return false
      }
    })

    if (isDuplicate) {
      console.log('⚠️ Duplicate lead detected, skipping save')
      return res.status(200).json({
        success: true,
        message: 'Duplicate lead detected, not saved',
        phone: normalizedPhone,
        name: leadData.FullName,
        action: 'skipped_duplicate'
      })
    }

    // Сохранение в базу данных
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert(enhancedLeadData)
      .select('id, contact_info, conversation_summary, lead_quality_score, source, status, created_at')
      .single()

    if (error) {
      console.error('❌ Database save error:', error)
      throw new Error(`Database save failed: ${error.message}`)
    }

    console.log('✅ Proxy lead saved successfully:', newLead?.id)

    // АВТОМАТИЧЕСКИЙ ПОИСК РАЗГОВОРА
    // Запускаем smart linking для автоматического поиска связанного разговора
    try {
      console.log('🔍 Auto-linking conversation for lead:', newLead?.id)
      
      // Импорт функции (динамический для избежания зависимости от уровня модуля)
      const { smartLinkConversation } = await import('../../../lib/smart-linking')
      const linkResult = await smartLinkConversation(newLead?.id!)
      
      if (linkResult.success) {
        console.log('✅ Auto-linked conversation:', linkResult.linked_conversation!.conversation_id, 
                   `(${linkResult.linked_conversation!.match_score}% match)`)
      } else {
        console.log('ℹ️ No matching conversation found during auto-linking')
      }
    } catch (autoLinkError) {
      console.warn('⚠️ Auto-linking failed (non-critical):', autoLinkError)
      // Не останавливаем выполнение, это не критическая ошибка
    }

    // ВАЖНО: Теперь передаем данные в оригинальную CRM систему
    try {
      console.log('🔄 Forwarding to original CRM...')
      
      const originalCrmUrl = 'https://office.bir.by:2121/0/ServiceModel/GeneratedObjectWebFormService.svc/SaveWebFormObjectData'
      
      const crmResponse = await fetch(originalCrmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Lead-Source': 'belhard-voice-agent'
        },
        body: JSON.stringify(leadData)
      })

      if (crmResponse.ok) {
        console.log('✅ Successfully forwarded to original CRM')
      } else {
        console.warn('⚠️ CRM forward failed:', crmResponse.status, crmResponse.statusText)
      }
    } catch (forwardError) {
      console.error('❌ Error forwarding to CRM:', forwardError)
      // Не останавливаем выполнение, продолжаем
    }

    return res.status(200).json({
      success: true,
      message: 'Proxy lead processed and forwarded successfully',
      lead: {
        id: newLead?.id,
        contact_info: newLead?.contact_info,
        lead_quality_score: newLead?.lead_quality_score,
        source: newLead?.source,
        created_at: newLead?.created_at
      },
      forwarded_to_original_crm: true,
      proxy_info: {
        normalized_phone: normalizedPhone,
        original_phone: leadData.Phone,
        project: leadData.UsrMinskMir,
        commentary: leadData.Commentary
      }
    })

  } catch (error) {
    console.error('❌ Proxy webhook error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 