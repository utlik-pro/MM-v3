import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'
import { ApiLogger } from '../../../lib/api-logger'

interface CRMLeadData {
  Phone: string
  FullName: string
  UsrMinskMir?: string
  Commentary?: string
  
  // Дополнительные поля для трекинга
  conversation_id?: string
  agent_id?: string
  tool_call_id?: string
  source?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now()

  // Set CORS headers for ElevenLabs Tool
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Lead-Source')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    await ApiLogger.log({
      serviceName: 'crm-lead-webhook',
      endpoint: '/api/webhook/crm-lead-enhanced',
      method: req.method || 'UNKNOWN',
      statusCode: 405,
      responseTimeMs: Date.now() - startTime,
      errorMessage: 'Method not allowed'
    })
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🎯 CRM Lead Enhanced Webhook received:', JSON.stringify(req.body, null, 2))
    console.log('📋 Headers:', req.headers)

    const leadData: CRMLeadData = req.body

    // Валидация обязательных полей
    if (!leadData.Phone || !leadData.FullName) {
      await ApiLogger.log({
        serviceName: 'crm-lead-webhook',
        endpoint: '/api/webhook/crm-lead-enhanced',
        method: 'POST',
        statusCode: 400,
        responseTimeMs: Date.now() - startTime,
        errorMessage: 'Missing required fields: Phone or FullName'
      })
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['Phone', 'FullName'],
        received: Object.keys(leadData)
      })
    }

    // Нормализация телефона
    const normalizedPhone = normalizePhone(leadData.Phone)
    
    // Расширенный анализ лида
    const enhancedAnalysis = analyzeRealLead(leadData)
    
    // Попытка найти связанный разговор в нашей базе
    let relatedConversation = null
    if (leadData.conversation_id) {
      const { data: conversationData } = await supabase
        .from('conversations')
        .select('*')
        .eq('eleven_labs_conversation_id', leadData.conversation_id)
        .single()
      
      if (conversationData) {
        relatedConversation = conversationData
        console.log('🔗 Found related conversation:', conversationData.id)
      }
    }

    // Подготавливаем данные для сохранения в нашей системе
    const enhancedLeadData = {
      client_id: 'default-client',
      agent_id: leadData.agent_id || 'agent_8901k4s5hkbkf7gsf1tk5r0a4g8t',
      conversation_id: null, // Пока не создаем записи conversations
      source_conversation_id: null,
      
      // Структурированная контактная информация
      contact_info: JSON.stringify({
        name: leadData.FullName,
        phone: normalizedPhone,
        original_phone: leadData.Phone,
        email: null // CRM tool пока не передает email
      }),
      
      // Краткое содержание на основе данных CRM
      conversation_summary: generateCRMSummary(leadData, enhancedAnalysis),
      
      // Расширенные сущности
      extracted_entities: {
        name: leadData.FullName,
        phone: normalizedPhone,
        original_phone: leadData.Phone,
        project: leadData.UsrMinskMir || null,
        commentary: leadData.Commentary || null,
        
        // Анализ
        ...enhancedAnalysis,
        
        // Метаданные извлечения
        extraction_method: 'crm_tool_direct',
        tool_id: 'xi4EFSeulNpmBWxSC9b4',
        tool_call_id: leadData.tool_call_id || null,
        extracted_at: new Date().toISOString()
      },
      
      // Качество лида (на основе полноты данных)
      lead_quality_score: calculateCRMLeadScore(leadData, enhancedAnalysis, relatedConversation),
      
      // Стандартные поля
      source: 'crm_tool_elevenlabs',
      status: 'NEW',
      score: calculateCRMLeadScore(leadData, enhancedAnalysis, relatedConversation), // backward compatibility
      notes: `CRM Tool Lead: ${leadData.Commentary || 'No additional comments'}`,
      
      // Метаданные
      metadata: JSON.stringify({
        tool_id: 'xi4EFSeulNpmBWxSC9b4',
        tool_name: 'SendToCRMLead',
        original_payload: leadData,
        eleven_labs_conversation_id: leadData.conversation_id, // Сохраняем ElevenLabs ID
        conversation_id: leadData.conversation_id, // Для обратной совместимости
        agent_id: leadData.agent_id,
        project: leadData.UsrMinskMir,
        source_headers: {
          'x-lead-source': req.headers['x-lead-source'],
          'user-agent': req.headers['user-agent']
        },
        processed_at: new Date().toISOString()
      })
    }

    // Проверяем на дубликаты
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, contact_info, created_at')
      .contains('contact_info', { phone: normalizedPhone })
      .order('created_at', { ascending: false })
      .limit(5)

    let isDuplicate = false
    let duplicateInfo = null

    if (existingLeads && existingLeads.length > 0) {
      // Проверяем последний лид с таким телефоном
      const latestLead = existingLeads[0]
      const timeDiff = Date.now() - new Date(latestLead.created_at).getTime()
      const hoursDiff = timeDiff / (1000 * 60 * 60)

      // Считаем дубликатом, если лид с таким телефоном был создан менее часа назад
      if (hoursDiff < 1) {
        isDuplicate = true
        duplicateInfo = {
          existing_lead_id: latestLead.id,
          hours_since_last: Math.round(hoursDiff * 100) / 100,
          total_leads_with_phone: existingLeads.length
        }
      }
    }

    if (isDuplicate) {
      console.log('⚠️ Potential duplicate lead detected:', duplicateInfo)
      
      await ApiLogger.log({
        serviceName: 'crm-lead-webhook',
        endpoint: '/api/webhook/crm-lead-enhanced',
        method: 'POST',
        statusCode: 200,
        responseTimeMs: Date.now() - startTime,
        metadata: { 
          duplicate_detected: true, 
          duplicate_info: duplicateInfo,
          phone: normalizedPhone
        }
      })

      return res.status(200).json({
        success: true,
        message: 'Potential duplicate lead detected',
        duplicate_info: duplicateInfo,
        action: 'not_saved',
        lead_data: enhancedLeadData
      })
    }

    // Сохраняем лид в базу данных
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert(enhancedLeadData)
      .select('id, contact_info, conversation_summary, lead_quality_score, source, status, created_at')
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Логируем успешную обработку
    await ApiLogger.log({
      serviceName: 'crm-lead-webhook',
      endpoint: '/api/webhook/crm-lead-enhanced',
      method: 'POST',
      statusCode: 200,
      responseTimeMs: Date.now() - startTime,
      metadata: {
        lead_id: newLead.id,
        quality_score: enhancedLeadData.lead_quality_score,
        has_conversation_link: !!relatedConversation,
        phone: normalizedPhone
      }
    })

    console.log('✅ CRM lead processed successfully:', {
      id: newLead.id,
      phone: normalizedPhone,
      name: leadData.FullName,
      quality_score: enhancedLeadData.lead_quality_score
    })

    // АВТОМАТИЧЕСКИЙ ПОИСК РАЗГОВОРА (если нет уже связанного)
    if (!relatedConversation) {
      try {
        console.log('🔍 Auto-linking conversation for direct CRM lead:', newLead.id)
        
        // Импорт функции (динамический для избежания зависимости от уровня модуля)
        const { smartLinkConversation } = await import('../../../lib/smart-linking')
        const linkResult = await smartLinkConversation(newLead.id)
        
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
    }

    return res.status(200).json({
      success: true,
      message: 'CRM lead processed successfully',
      lead: newLead,
      enhanced_analysis: enhancedAnalysis,
      conversation_link: relatedConversation ? {
        id: relatedConversation.id,
        duration: relatedConversation.duration,
        eleven_labs_id: relatedConversation.eleven_labs_conversation_id
      } : null,
      quality_score: enhancedLeadData.lead_quality_score
    })

  } catch (error) {
    console.error('❌ CRM lead webhook error:', error)
    
    await ApiLogger.log({
      serviceName: 'crm-lead-webhook',
      endpoint: '/api/webhook/crm-lead-enhanced',
      method: 'POST',
      statusCode: 500,
      responseTimeMs: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function normalizePhone(phone: string): string {
  // Удаляем все не-цифры
  const digits = phone.replace(/\D/g, '')
  
  // Преобразуем в стандартный формат
  if (digits.startsWith('375')) {
    return `+${digits}`
  } else if (digits.startsWith('80') && digits.length === 11) {
    return `+375${digits.substring(2)}`
  } else if (digits.length === 9) {
    return `+375${digits}`
  }
  
  return phone // Возвращаем оригинал, если не можем нормализовать
}

function analyzeRealLead(leadData: CRMLeadData) {
  const analysis = {
    has_project_info: !!leadData.UsrMinskMir,
    has_commentary: !!leadData.Commentary,
    phone_type: 'unknown' as 'mobile' | 'landline' | 'unknown',
    name_completeness: 'unknown' as 'full' | 'partial' | 'unknown',
    estimated_intent: [] as string[]
  }

  // Анализ типа телефона по коду оператора
  const normalizedPhone = normalizePhone(leadData.Phone)
  if (normalizedPhone.includes('+375')) {
    const operatorCode = normalizedPhone.substring(4, 6)
    if (['29', '44', '33', '25'].includes(operatorCode)) {
      analysis.phone_type = 'mobile'
    } else {
      analysis.phone_type = 'landline'
    }
  }

  // Анализ полноты имени
  const nameParts = leadData.FullName.trim().split(/\s+/)
  if (nameParts.length >= 2) {
    analysis.name_completeness = 'full'
  } else {
    analysis.name_completeness = 'partial'
  }

  // Определение интента по комментарию
  if (leadData.Commentary) {
    const commentary = leadData.Commentary.toLowerCase()
    if (commentary.includes('купить') || commentary.includes('покупка')) {
      analysis.estimated_intent.push('purchase')
    }
    if (commentary.includes('цена') || commentary.includes('стоимость')) {
      analysis.estimated_intent.push('pricing')
    }
    if (commentary.includes('информация') || commentary.includes('узнать')) {
      analysis.estimated_intent.push('information')
    }
  }

  return analysis
}

function calculateCRMLeadScore(
  leadData: CRMLeadData, 
  analysis: any, 
  conversation: any
): number {
  let score = 60 // Базовая оценка для CRM лидов

  // Контактная информация (всегда есть телефон и имя)
  score += 20 // phone
  score += 15 // name

  // Полнота имени
  if (analysis.name_completeness === 'full') score += 10

  // Тип телефона
  if (analysis.phone_type === 'mobile') score += 5

  // Проектная информация
  if (analysis.has_project_info) score += 10

  // Комментарий
  if (analysis.has_commentary) score += 8

  // Интент
  if (analysis.estimated_intent.includes('purchase')) score += 15
  else if (analysis.estimated_intent.includes('pricing')) score += 10

  // Связь с разговором
  if (conversation) {
    score += 10
    if (conversation.duration > 60) score += 5
  }

  return Math.min(Math.max(score, 0), 100)
}

function generateCRMSummary(leadData: CRMLeadData, analysis: any): string {
  const parts: string[] = []
  
  parts.push(`Клиент: ${leadData.FullName}`)
  
  if (leadData.UsrMinskMir) {
    parts.push(`Проект: ${leadData.UsrMinskMir}`)
  }
  
  if (analysis.estimated_intent.length > 0) {
    parts.push(`Интент: ${analysis.estimated_intent.join(', ')}`)
  }
  
  const summary = parts.join(' | ')
  const commentary = leadData.Commentary ? `\n\nКомментарий: ${leadData.Commentary}` : ''
  
  return `${summary}${commentary}`
} 