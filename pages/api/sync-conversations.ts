import { NextApiRequest, NextApiResponse } from 'next'
import { conversationSyncService } from '../../lib/services/conversation-sync'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      agent_id, 
      page_size = 50, 
      call_successful,
      call_start_after_unix,
      call_start_before_unix 
    } = req.body

    console.log('🔄 Starting manual conversation sync...')
    
    // Подготавливаем параметры синхронизации
    const syncParams: any = {
      page_size: Math.min(page_size, 100) // Ограничиваем до 100
    }

    if (agent_id) {
      syncParams.agent_id = agent_id
    }

    if (call_successful) {
      syncParams.call_successful = call_successful
    }

    if (call_start_after_unix) {
      syncParams.call_start_after_unix = call_start_after_unix
    }

    if (call_start_before_unix) {
      syncParams.call_start_before_unix = call_start_before_unix
    }

    // Выполняем синхронизацию
    const result = await conversationSyncService.syncAllConversations(syncParams)
    
    console.log(`✅ Sync completed: ${result.totalProcessed} processed`)

    return res.status(result.success ? 200 : 207).json({
      success: result.success,
      message: result.success 
        ? 'Conversation sync completed successfully' 
        : 'Conversation sync completed with errors',
      data: {
        totalProcessed: result.totalProcessed,
        newConversations: result.newConversations,
        updatedConversations: result.updatedConversations,
        errorCount: result.errors.length,
        lastSyncTime: result.lastSyncTime
      },
      errors: result.errors.slice(0, 10), // Показываем первые 10 ошибок
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Conversation sync failed:', error)
    return res.status(500).json({
      success: false,
      message: 'Conversation sync failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 