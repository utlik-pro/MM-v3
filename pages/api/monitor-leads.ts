import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { since, limit, all } = req.query
    
    // Настройки фильтрации
    const showAll = all === 'true'
    const limitResults = parseInt(limit as string) || (showAll ? 100 : 50)
    const sinceMinutes = parseInt(since as string) || (showAll ? null : 30)
    
    console.log(`🔍 Monitoring leads - showAll: ${showAll}, limit: ${limitResults}, sinceMinutes: ${sinceMinutes}`)

    // Строим запрос
    let query = supabase
      .from('leads')
      .select(`
        id,
        contact_info,
        conversation_summary,
        extracted_entities,
        lead_quality_score,
        source,
        status,
        created_at,
        metadata,
        conversation_id
      `)
      .order('created_at', { ascending: false })
      .limit(limitResults)

    // Добавляем фильтр по времени только если не показываем все лиды
    if (!showAll && sinceMinutes) {
      const sinceTime = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString()
      query = query.gte('created_at', sinceTime)
      console.log(`📅 Filtering since: ${sinceTime}`)
    } else {
      console.log(`📊 Showing all leads (limited to ${limitResults})`)
    }

    // Выполняем запрос
    const { data: leads, error } = await query

    if (error) {
      throw new Error(`Database query error: ${error.message}`)
    }

    // Обработка лидов
    const processedLeads = leads?.map((lead: any) => {
      try {
        const contactInfo = lead.contact_info ? JSON.parse(lead.contact_info) : null
        const metadata = lead.metadata ? JSON.parse(lead.metadata) : null
        
        return {
          id: lead.id,
          name: contactInfo?.name || 'Unknown',
          phone: contactInfo?.phone || 'Unknown',
          source: lead.source,
          quality_score: lead.lead_quality_score,
          created_at: lead.created_at,
          is_crm_lead: lead.source === 'crm_tool_elevenlabs',
          is_enhanced_lead: lead.source === 'voice_widget_enhanced',
          conversation_id: lead.conversation_id || metadata?.eleven_labs_conversation_id || metadata?.conversation_id || null, // Приоритет реальному полю БД
          project: metadata?.project || lead.extracted_entities?.project || null,
          intent: lead.extracted_entities?.estimated_intent || lead.extracted_entities?.intent || [],
          agent_id: metadata?.agent_id || null,
          
          // Временные метки для удобства
          minutes_ago: Math.round((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60)),
          time_formatted: new Date(lead.created_at).toLocaleString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit'
          })
        }
      } catch (parseError) {
        console.warn('Failed to parse lead data:', parseError)
        return {
          id: lead.id,
          name: 'Parse Error',
          phone: 'Unknown',
          source: lead.source,
          quality_score: lead.lead_quality_score,
          created_at: lead.created_at,
          error: 'Data parsing failed'
        }
      }
    }) || []

    // Статистика по лидам
    const crmLeads = processedLeads.filter((lead: any) => lead.is_crm_lead)
    const enhancedLeads = processedLeads.filter((lead: any) => lead.is_enhanced_lead)
    
    const stats = {
      monitoring_period_minutes: sinceMinutes,
      show_all_leads: showAll,
      total_leads: processedLeads.length,
      crm_leads: crmLeads.length,
      enhanced_leads: enhancedLeads.length,
      avg_quality_score: processedLeads.length > 0 
        ? Math.round(processedLeads.reduce((sum: number, lead: any) => sum + (lead.quality_score || 0), 0) / processedLeads.length)
        : 0,
      last_lead_time: processedLeads[0]?.created_at || null,
      last_lead_minutes_ago: processedLeads[0]?.minutes_ago || null
    }

    console.log('📊 Lead monitoring stats:', stats)

    return res.status(200).json({
      success: true,
      monitoring: {
        show_all: showAll,
        since_minutes: sinceMinutes,
        limit: limitResults,
        current_time: new Date().toISOString(),
        timezone: 'UTC'
      },
      stats,
      leads: processedLeads,
      instructions: {
        all_leads_url: '/api/monitor-leads?all=true',
        recent_leads_url: `/api/monitor-leads?since=${sinceMinutes || 30}`,
        real_time_tip: 'Refresh this endpoint every 10-30 seconds to monitor new leads',
        webhook_url: '/api/webhook/crm-lead-enhanced',
        agent_tool_id: 'xi4EFSeulNpmBWxSC9b4'
      }
    })

  } catch (error) {
    console.error('❌ Lead monitoring error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 