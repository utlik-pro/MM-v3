import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      limit = '20', 
      offset = '0', 
      status, 
      source,
      min_quality_score,
      order_by = 'created_at',
      order_direction = 'desc'
    } = req.query

    // Построение фильтров
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
        score,
        created_at,
        metadata
      `)

    // Применение фильтров
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (source && source !== 'all') {
      query = query.eq('source', source)
    }

    if (min_quality_score) {
      const minScore = parseInt(min_quality_score as string, 10)
      if (!isNaN(minScore)) {
        query = query.gte('lead_quality_score', minScore)
      }
    }

    // Сортировка
    const orderCol = order_by as string
    const orderDir = order_direction === 'asc' ? { ascending: true } : { ascending: false }
    query = query.order(orderCol, orderDir)

    // Пагинация
    const limitNum = parseInt(limit as string, 10)
    const offsetNum = parseInt(offset as string, 10)
    query = query.range(offsetNum, offsetNum + limitNum - 1)

    const { data: leads, error } = await query

    if (error) {
      throw new Error(`Database query error: ${error.message}`)
    }

    // Получение общего количества для пагинации
    let countQuery = supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    if (source && source !== 'all') {
      countQuery = countQuery.eq('source', source)
    }

    if (min_quality_score) {
      const minScore = parseInt(min_quality_score as string, 10)
      if (!isNaN(minScore)) {
        countQuery = countQuery.gte('lead_quality_score', minScore)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.warn('Failed to get count:', countError)
    }

    // Обработка и парсинг данных
    const processedLeads = leads?.map(lead => {
      try {
        return {
          ...lead,
          contact_info: lead.contact_info ? JSON.parse(lead.contact_info) : null,
          extracted_entities: lead.extracted_entities || null,
          metadata: lead.metadata ? JSON.parse(lead.metadata) : null,
          
          // Дополнительная информация для админа
          is_enhanced: lead.source?.includes('enhanced') || false,
          has_conversation_data: !!lead.extracted_entities?.conversation_duration,
          extraction_method: lead.extracted_entities?.extraction_method || 'unknown'
        }
      } catch (parseError) {
        console.warn('Failed to parse lead data:', parseError)
        return {
          ...lead,
          contact_info: null,
          extracted_entities: null,
          metadata: null,
          is_enhanced: false,
          has_conversation_data: false,
          extraction_method: 'error'
        }
      }
    }) || []

    // Статистика для дашборда
    const stats = {
      total_leads: count || 0,
      current_page_count: processedLeads.length,
      enhanced_leads: processedLeads.filter(lead => lead.is_enhanced).length,
      high_quality_leads: processedLeads.filter(lead => lead.lead_quality_score >= 80).length,
      avg_quality_score: processedLeads.length > 0 
        ? Math.round(processedLeads.reduce((sum, lead) => sum + (lead.lead_quality_score || 0), 0) / processedLeads.length)
        : 0,
      
      // Группировка по статусам
      status_breakdown: processedLeads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      
      // Группировка по источникам
      source_breakdown: processedLeads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      
      // Анализ интента (для enhanced лидов)
      intent_analysis: processedLeads
        .filter(lead => lead.extracted_entities?.intent)
        .reduce((acc, lead) => {
          const intents = lead.extracted_entities.intent || []
          intents.forEach((intent: string) => {
            acc[intent] = (acc[intent] || 0) + 1
          })
          return acc
        }, {} as Record<string, number>)
    }

    return res.status(200).json({
      success: true,
      leads: processedLeads,
      pagination: {
        total: count || 0,
        limit: limitNum,
        offset: offsetNum,
        has_more: count ? (offsetNum + limitNum) < count : false
      },
      filters: {
        status: status || 'all',
        source: source || 'all',
        min_quality_score: min_quality_score || null,
        order_by: orderCol,
        order_direction
      },
      stats
    })

  } catch (error) {
    console.error('❌ Enhanced leads API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 