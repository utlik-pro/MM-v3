import { createDefaultElevenLabsClient } from '../elevenlabs'
import { supabase } from '../supabase'
import { ApiLogger } from '../api-logger'
import type { 
  Conversation, 
  ConversationDetail, 
  ConversationListParams 
} from '../elevenlabs/types'

export interface SyncResult {
  success: boolean
  totalProcessed: number
  newConversations: number
  updatedConversations: number
  errors: string[]
  lastSyncTime: string
}

export interface ConversationData {
  id: string
  agent_id: string
  conversation_id: string
  start_time: Date
  end_time?: Date
  duration_secs: number
  message_count: number
  status: string
  call_successful: string
  agent_name: string
  transcript?: any
  metadata?: any
}

export class ConversationSyncService {
  private elevenLabsClient = createDefaultElevenLabsClient()
  
  /**
   * Синхронизация всех разговоров
   */
  async syncAllConversations(params: ConversationListParams = {}): Promise<SyncResult> {
    const startTime = new Date().toISOString()
    let totalProcessed = 0
    let newConversations = 0
    let updatedConversations = 0
    const errors: string[] = []

    try {
      console.log('🔄 Starting conversation sync...')
      
      // Настройки по умолчанию
      const syncParams = {
        page_size: 50,
        agent_id: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
        ...params
      }

      let hasMore = true
      let cursor: string | undefined

      while (hasMore) {
        try {
          // Получаем список разговоров
          const result = await this.elevenLabsClient.listConversations({
            ...syncParams,
            cursor
          })

          if (!result.success || !result.data) {
            errors.push(`Failed to fetch conversations: ${result.error?.message}`)
            break
          }

          const { conversations, has_more, next_cursor } = result.data
          
          console.log(`📥 Processing ${conversations.length} conversations...`)

          // Обрабатываем каждый разговор
          for (const conversation of conversations) {
            try {
              const syncResult = await this.syncSingleConversation(conversation)
              
              if (syncResult.success) {
                if (syncResult.isNew) {
                  newConversations++
                } else {
                  updatedConversations++
                }
                totalProcessed++
              } else {
                errors.push(`Conversation ${conversation.conversation_id}: ${syncResult.error}`)
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error)
              errors.push(`Conversation ${conversation.conversation_id}: ${errorMsg}`)
            }
          }

          // Подготовка к следующей итерации
          hasMore = has_more
          cursor = next_cursor

          // Небольшая пауза между запросами
          if (hasMore) {
            await this.sleep(1000)
          }

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          errors.push(`Batch processing error: ${errorMsg}`)
          break
        }
      }

      // Логируем результат
      await ApiLogger.logElevenLabsCall(
        '/convai/conversations/sync',
        'GET',
        200,
        Date.now() - new Date(startTime).getTime(),
        undefined,
        {
          totalProcessed,
          newConversations,
          updatedConversations,
          errorCount: errors.length
        }
      )

      console.log(`✅ Sync completed: ${totalProcessed} processed, ${newConversations} new, ${updatedConversations} updated`)

      return {
        success: errors.length === 0,
        totalProcessed,
        newConversations,
        updatedConversations,
        errors,
        lastSyncTime: startTime
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      errors.push(`Sync service error: ${errorMsg}`)
      
      return {
        success: false,
        totalProcessed,
        newConversations,
        updatedConversations,
        errors,
        lastSyncTime: startTime
      }
    }
  }

  /**
   * Синхронизация одного разговора
   */
  private async syncSingleConversation(conversation: Conversation): Promise<{
    success: boolean
    isNew: boolean
    error?: string
  }> {
    try {
      // Проверяем, существует ли разговор в базе
      const { data: existingConversations, error: searchError } = await supabase
        .from('conversations')
        .select('id, eleven_labs_conversation_id')
        .eq('eleven_labs_conversation_id', conversation.conversation_id)
        .limit(1)

      if (searchError) {
        throw new Error(`Database search error: ${searchError.message}`)
      }

      const isExisting = existingConversations && existingConversations.length > 0
      
      // Получаем детальную информацию о разговоре
      const detailResult = await this.elevenLabsClient.getConversation(conversation.conversation_id)
      let conversationDetail: ConversationDetail | null = null
      
      if (detailResult.success && detailResult.data) {
        conversationDetail = detailResult.data
      }

      // Подготавливаем данные для сохранения
      const conversationData = this.prepareConversationForConversationsTable(conversation, conversationDetail)

      if (isExisting) {
        // Обновляем существующий разговор
        const { error: updateError } = await supabase
          .from('conversations')
          .update(conversationData)
          .eq('eleven_labs_conversation_id', conversation.conversation_id)

        if (updateError) {
          throw new Error(`Update error: ${updateError.message}`)
        }

        return { success: true, isNew: false }
      } else {
        // Создаем новый разговор
        const { error: insertError } = await supabase
          .from('conversations')
          .insert(conversationData)

        if (insertError) {
          throw new Error(`Insert error: ${insertError.message}`)
        }

        return { success: true, isNew: true }
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return { success: false, isNew: false, error: errorMsg }
    }
  }

  /**
   * Подготовка данных для таблицы conversations
   */
  private prepareConversationForConversationsTable(
    conversation: Conversation, 
    detail: ConversationDetail | null
  ): any {
    // Мапинг статусов ElevenLabs в enum базы данных
    const mapStatus = (status: string): string => {
      switch (status.toLowerCase()) {
        case 'done':
        case 'completed':
          return 'COMPLETED'
        case 'active':
        case 'in-progress':
        case 'initiated':
          return 'ACTIVE'
        case 'failed':
        case 'error':
          return 'FAILED'
        case 'timeout':
        case 'cancelled':
          return 'TIMEOUT'
        default:
          return 'ACTIVE' // значение по умолчанию
      }
    }

    return {
      // IDs and basic info
      client_id: 'default-client', // TODO: get from context
      agent_id: conversation.agent_id,
      eleven_labs_conversation_id: conversation.conversation_id,
      external_id: conversation.conversation_id,
      
      // Status and timing
      status: mapStatus(conversation.status),
      started_at: new Date(conversation.start_time_unix_secs * 1000).toISOString(),
      ended_at: detail?.end_time_unix_secs 
        ? new Date(detail.end_time_unix_secs * 1000).toISOString() 
        : null,
      duration: conversation.call_duration_secs,
      
      // Content
      transcript: detail?.transcript ? JSON.stringify(detail.transcript) : null,
      transcript_json: detail?.transcript || null,
      summary: this.formatConversationSummary(conversation, detail),
      
      // ElevenLabs specific fields
      language: 'ru', // Default language
      metadata: JSON.stringify({
        agent_name: conversation.agent_name,
        message_count: conversation.message_count,
        call_successful: conversation.call_successful,
        source: 'elevenlabs',
        sync_time: new Date().toISOString(),
        raw_conversation: conversation,
        raw_detail: detail
      })
    }
  }

  /**
   * Форматирование контента разговора для поиска
   */
  private formatConversationContent(data: any): string {
    const parts = [
      `Conversation: ${data.conversation_id}`,
      `Agent: ${data.agent_name} (${data.agent_id})`,
      `Duration: ${data.duration_secs} seconds`,
      `Status: ${data.status} (${data.call_successful})`,
      `Messages: ${data.message_count}`,
      `Time: ${data.start_time}`
    ]

    // Добавляем транскрипт если есть
    if (data.transcript && Array.isArray(data.transcript)) {
      parts.push('\nTranscript:')
      data.transcript.forEach((message: any) => {
        parts.push(`${message.role}: ${message.content}`)
      })
    }

    return parts.join('\n')
  }

  /**
   * Форматирование суммы разговора
   */
  private formatConversationSummary(
    conversation: Conversation,
    detail: ConversationDetail | null
  ): string {
    const summaryParts: string[] = [
      `Conversation: ${conversation.conversation_id}`,
      `Agent: ${conversation.agent_name}`,
      `Duration: ${conversation.call_duration_secs} seconds`,
      `Status: ${conversation.status}`,
      `Messages: ${conversation.message_count}`
    ]

    if (detail?.transcript && Array.isArray(detail.transcript)) {
      summaryParts.push(`Transcript: ${detail.transcript.length} messages`)
    }

    return summaryParts.join(' | ')
  }

  /**
   * Получение статистики синхронизации
   */
  async getSyncStats(): Promise<{
    totalConversations: number
    lastSyncTime: string | null
    agentBreakdown: Array<{ agent_name: string; count: number }>
    statusBreakdown: Array<{ status: string; count: number }>
  }> {
    try {
      // Получаем все разговоры из системы
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('metadata, eleven_labs_conversation_id, status, created_at')
        .not('eleven_labs_conversation_id', 'is', null)

      if (error) {
        throw new Error(`Stats query error: ${error.message}`)
      }

      const totalConversations = conversations?.length || 0
      
      // Находим последнее время синхронизации
      let lastSyncTime: string | null = null
      const agentCounts: Record<string, number> = {}
      const statusCounts: Record<string, number> = {}

      conversations?.forEach(conv => {
        try {
          const metadata = typeof conv.metadata === 'string' 
            ? JSON.parse(conv.metadata) 
            : conv.metadata

          // Проверяем, что это разговор из голосовой системы
          if (!metadata?.source || metadata.source !== 'elevenlabs') {
            return
          }
          
          // Обновляем время последней синхронизации
          if (metadata.sync_time) {
            if (!lastSyncTime || metadata.sync_time > lastSyncTime) {
              lastSyncTime = metadata.sync_time
            }
          }

          // Подсчитываем по агентам
          if (metadata.agent_name) {
            agentCounts[metadata.agent_name] = (agentCounts[metadata.agent_name] || 0) + 1
          }

          // Подсчитываем по статусам
          if (conv.status) {
            statusCounts[conv.status] = (statusCounts[conv.status] || 0) + 1
          }
        } catch (parseError) {
          console.warn('Failed to parse conversation metadata:', parseError)
        }
      })

      const agentBreakdown = Object.entries(agentCounts).map(([agent_name, count]) => ({
        agent_name,
        count
      }))

      const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }))

      return {
        totalConversations,
        lastSyncTime,
        agentBreakdown,
        statusBreakdown
      }

    } catch (error) {
      console.error('Error getting sync stats:', error)
      return {
        totalConversations: 0,
        lastSyncTime: null,
        agentBreakdown: [],
        statusBreakdown: []
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Экспортируем единственный экземпляр
export const conversationSyncService = new ConversationSyncService() 