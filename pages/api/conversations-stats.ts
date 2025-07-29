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
    // Получаем все разговоры из ElevenLabs
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .not('eleven_labs_conversation_id', 'is', null)

    if (error) {
      throw new Error(`Database query error: ${error.message}`)
    }

    if (!conversations) {
      return res.status(200).json({
        totalConversations: 0,
        lastSyncTime: null,
        agentBreakdown: [],
        statusBreakdown: [],
        monthlyTrend: [],
        averageDuration: 0,
        successRate: 0,
        totalDuration: 0
      })
    }

    // Базовая статистика
    const totalConversations = conversations.length
    
    // Поиск последнего времени синхронизации
    let lastSyncTime: string | null = null
    const agentCounts: Record<string, number> = {}
    const statusCounts: Record<string, number> = {}
    const monthlyCounts: Record<string, number> = {}
    const successCounts = { success: 0, failure: 0, unknown: 0 }
    let totalDuration = 0

    conversations.forEach((conv: any) => {
      try {
        // Парсим метаданные
        const metadata = typeof conv.metadata === 'string' 
          ? JSON.parse(conv.metadata) 
          : conv.metadata || {}

        // Проверяем, что это ElevenLabs разговор
        if (metadata.source !== 'elevenlabs') {
          return
        }

        // Время последней синхронизации
        if (metadata.sync_time) {
          if (!lastSyncTime || metadata.sync_time > lastSyncTime) {
            lastSyncTime = metadata.sync_time
          }
        }

        // Подсчет по агентам
        if (metadata.agent_name) {
          agentCounts[metadata.agent_name] = (agentCounts[metadata.agent_name] || 0) + 1
        }

        // Подсчет по статусам
        if (conv.status) {
          statusCounts[conv.status] = (statusCounts[conv.status] || 0) + 1
        }

        // Месячная статистика
        if (conv.started_at) {
          const monthKey = new Date(conv.started_at).toISOString().slice(0, 7) // YYYY-MM
          monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1
        }

        // Статистика успешности
        if (metadata.call_successful) {
          if (metadata.call_successful === 'success') {
            successCounts.success++
          } else if (metadata.call_successful === 'failure') {
            successCounts.failure++
          } else {
            successCounts.unknown++
          }
        }

        // Длительность
        if (conv.duration && typeof conv.duration === 'number') {
          totalDuration += conv.duration
        }

      } catch (parseError) {
        console.warn('Failed to parse conversation data:', parseError)
      }
    })

    // Формирование результатов
    const agentBreakdown = Object.entries(agentCounts).map(([agent_name, count]) => ({
      agent_name,
      count
    }))

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }))

    const monthlyTrend = Object.entries(monthlyCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const averageDuration = totalConversations > 0 ? Math.round(totalDuration / totalConversations) : 0
    const totalCallAttempts = successCounts.success + successCounts.failure + successCounts.unknown
    const successRate = totalCallAttempts > 0 
      ? Math.round((successCounts.success / totalCallAttempts) * 100) 
      : 0

    return res.status(200).json({
      totalConversations,
      lastSyncTime,
      agentBreakdown,
      statusBreakdown,
      monthlyTrend,
      averageDuration, // в секундах
      successRate, // в процентах
      totalDuration, // общая длительность в секундах
      successCounts
    })

  } catch (error) {
    console.error('Error getting conversation stats:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return res.status(500).json({ 
      error: 'Failed to get conversation statistics',
      details: errorMsg 
    })
  }
} 