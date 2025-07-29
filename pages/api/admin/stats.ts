import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

interface AdminStats {
  leads: {
    total: number;
    today: number;
    thisWeek: number;
    conversionRate: number;
  };
  conversations: {
    total: number;
    today: number;
    avgDuration: string;
    successRate: number;
  };
  system: {
    uptime: string;
    webhookStatus: 'active' | 'inactive' | 'error';
    dbStatus: 'connected' | 'disconnected' | 'error';
    lastBackup: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Получаем статистику лидов
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('created_at, conversation_id')
    
    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError)
    }

    // Получаем статистику разговоров  
    const { data: allConversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('created_at, duration, status')
    
    if (conversationsError) {
      console.error('❌ Error fetching conversations:', conversationsError)
    }

    console.log('📊 Raw data counts:', {
      leads: allLeads?.length || 0,
      conversations: allConversations?.length || 0,
      linkedLeads: allLeads?.filter(lead => lead.conversation_id).length || 0
    })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Обрабатываем статистику лидов
    const leads = allLeads || []
    const leadsToday = leads.filter(lead => 
      new Date(lead.created_at) >= today
    ).length
    
    const leadsThisWeek = leads.filter(lead => 
      new Date(lead.created_at) >= weekAgo
    ).length

    const linkedLeads = leads.filter(lead => lead.conversation_id).length
    const conversionRate = leads.length > 0 ? (linkedLeads / leads.length) * 100 : 0

    // Обрабатываем статистику разговоров
    const conversations = allConversations || []
    const conversationsToday = conversations.filter(conv => 
      new Date(conv.created_at) >= today
    ).length

    // Рассчитываем среднюю продолжительность
    const validDurations = conversations
      .filter(conv => conv.duration && conv.duration > 0)
      .map(conv => conv.duration)
    
    const avgDurationSeconds = validDurations.length > 0 
      ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length
      : 0

    const avgDurationFormatted = avgDurationSeconds > 0 
      ? `${Math.floor(avgDurationSeconds / 60)}:${String(Math.floor(avgDurationSeconds % 60)).padStart(2, '0')}`
      : "0:00"

    // Рассчитываем процент успешности (например, разговоры длиннее 30 сек считаются успешными)
    const successfulConversations = conversations.filter(conv => 
      conv.duration && conv.duration > 30
    ).length
    const successRate = conversations.length > 0 
      ? (successfulConversations / conversations.length) * 100 
      : 0

    // Проверяем статус системы
    let dbStatus: 'connected' | 'disconnected' | 'error' = 'connected'
    try {
      const { error: testError } = await supabase
        .from('leads')
        .select('id')
        .limit(1)
      
      if (testError) {
        dbStatus = 'error'
      }
    } catch (err) {
      dbStatus = 'disconnected'
    }

    const stats: AdminStats = {
      leads: {
        total: leads.length,
        today: leadsToday,
        thisWeek: leadsThisWeek,
        conversionRate: Math.round(conversionRate * 10) / 10
      },
      conversations: {
        total: conversations.length,
        today: conversationsToday,
        avgDuration: avgDurationFormatted,
        successRate: Math.round(successRate * 10) / 10
      },
      system: {
        uptime: "Доступно", // Можно добавить реальный uptime позже
        webhookStatus: 'active', // Можно добавить проверку webhook позже
        dbStatus,
        lastBackup: "Доступно" // Можно добавить реальную информацию о бэкапах
      }
    }

    console.log('📊 Admin stats generated:', {
      totalLeads: stats.leads.total,
      totalConversations: stats.conversations.total,
      conversionRate: stats.leads.conversionRate,
      successRate: stats.conversations.successRate,
      dbStatus: stats.system.dbStatus
    })

    res.status(200).json(stats)

  } catch (error) {
    console.error('Error in admin stats API:', error)
    res.status(500).json({ 
      error: 'Failed to fetch admin statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 