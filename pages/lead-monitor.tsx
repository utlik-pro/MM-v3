import { useState, useEffect } from 'react'
import { Users, Phone, MessageSquare, Clock, X, ChevronDown, Bell, BellOff, AlertCircle } from 'lucide-react'
import { useNotifications } from '../src/hooks/useNotifications'
import { useUnreadLeads } from '../src/hooks/useUnreadLeads'
import Navigation from '../src/components/Navigation'
import Head from 'next/head'

interface Lead {
  id: string
  name: string
  phone: string
  source: string
  quality_score: number
  created_at: string
  is_crm_lead: boolean
  is_enhanced_lead: boolean
  conversation_id?: string
  project?: string
  intent: string[]
  minutes_ago: number
  time_formatted: string
}

interface MonitoringData {
  success: boolean
  stats: {
    monitoring_period_minutes: number
    show_all_leads: boolean
    total_leads: number
    crm_leads: number
    enhanced_leads: number
    avg_quality_score: number
    last_lead_time?: string
    last_lead_minutes_ago?: number
  }
  leads: Lead[]
  monitoring: {
    show_all: boolean
    since_minutes: number
    limit: number
    current_time: string
    timezone: string
  }
}

export default function LeadMonitor() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(15)
  const [showAll, setShowAll] = useState(true)
  
  // Состояние для вкладок
  const [activeTab, setActiveTab] = useState<'leads' | 'conversations'>('leads')
  
  // Состояние для разговоров
  const [conversationsData, setConversationsData] = useState<any>(null)
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  
  // Состояние для модальных окон
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [conversationDetails, setConversationDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const fetchLeads = async () => {
    try {
      const url = showAll 
        ? '/api/monitor-leads?all=true&limit=100' 
        : '/api/monitor-leads?since=60'
      
      const response = await fetch(url)
      const result = await response.json()
      
      setData(result)
      setLastUpdate(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error('❌ Error fetching leads:', error)
      setIsLoading(false)
    }
  }

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true)
      const response = await fetch('/api/conversations-list?limit=50')
      const result = await response.json()
      setConversationsData(result)
    } catch (error) {
      console.error('❌ Error fetching conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const fetchConversationDetails = async (conversationId: string) => {
    try {
      setIsLoadingDetails(true)
      console.log(`🔍 Fetching conversation details for: ${conversationId}`)
      
      const response = await fetch(`/api/conversation-details?conversation_id=${conversationId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      console.log('📊 Conversation details received:', {
        success: result.success,
        conversationId: result.conversation_id,
        transcriptLength: result.transcript?.length || 0,
        hasAudio: !!result.audio_url
      })
      
      setConversationDetails(result)
    } catch (error) {
      console.error('❌ Error fetching conversation details:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const openConversationModal = (conversation: any) => {
    setSelectedConversation(conversation)
    fetchConversationDetails(conversation.id)
  }

  const closeConversationModal = () => {
    setSelectedConversation(null)
    setConversationDetails(null)
  }

  useEffect(() => {
    if (activeTab === 'leads') {
      fetchLeads()
    } else if (activeTab === 'conversations') {
      fetchConversations()
    }
  }, [activeTab, showAll])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (activeTab === 'leads') {
        fetchLeads()
      } else if (activeTab === 'conversations') {
        fetchConversations()
      }
    }, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, activeTab])

  const getSourceBadge = (lead: Lead) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    switch (lead.source) {
      case 'voice_widget':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>🎤 Голосовой виджет</span>
      case 'crm_webhook':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>🔗 CRM Webhook</span>
      case 'manual':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>✋ Ручной ввод</span>
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{lead.source}</span>
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    if (score >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка мониторинга...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Head>
        <title>Мониторинг лидов - MinskMir голосовой ассистент</title>
        <meta name="description" content="Панель мониторинга лидов в реальном времени" />
      </Head>

      <Navigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Мониторинг лидов</h1>
                  <p className="text-gray-600">
                    Панель управления лидами в реальном времени от голосового ассистента MinskMir
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                  Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 p-1 bg-gray-100 rounded-2xl shadow-inner border border-gray-200">
              <button
                onClick={() => setActiveTab('leads')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'leads'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Лиды</span>
                <span className={`ml-1 inline-flex items-center justify-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  activeTab === 'leads' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-700'
                }`}>
                  {data?.stats?.total_leads || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'conversations'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Разговоры</span>
                <span className={`ml-1 inline-flex items-center justify-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  activeTab === 'conversations' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-700'
                }`}>
                  {conversationsData?.stats?.total_conversations || 0}
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'leads' ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Лиды</h2>
              {data?.leads?.map((lead: Lead) => (
                <div key={lead.id} className="bg-white p-4 rounded-lg mb-2">
                  <h3 className="font-medium">{lead.name}</h3>
                  <p className="text-gray-600">{lead.phone}</p>
                  <p className="text-sm text-gray-500">{lead.time_formatted}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getSourceBadge(lead)}
                    <span className={`font-bold ${getQualityColor(lead.quality_score)}`}>
                      {lead.quality_score}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Разговоры</h2>
              {conversationsData?.conversations?.map((conversation: any) => (
                <div key={conversation.id} className="bg-white p-4 rounded-lg mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Разговор {conversation.id.substring(0, 8)}...</h3>
                      <p className="text-gray-600">{conversation.start_time_formatted}</p>
                      <p className="text-sm text-gray-500">Длительность: {conversation.duration_formatted}</p>
                      <p className="text-sm text-gray-500">
                        {conversation.has_lead ? '✅ Есть лид' : '❌ Нет лида'}
                      </p>
                      {conversation.lead_info && (
                        <p className="text-sm text-gray-600 mt-1">
                          Лид: {conversation.lead_info.name} - {conversation.lead_info.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openConversationModal(conversation)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Просмотреть
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Модальное окно для деталей разговора */}
          {selectedConversation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] m-4 overflow-hidden">
                {/* Заголовок модального окна */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                                           <h2 className="text-xl font-bold text-gray-900">
                       Разговор {selectedConversation.id.substring(0, 8)}...
                     </h2>
                     <div className="text-sm text-gray-600">
                       {selectedConversation.start_time_formatted} • {selectedConversation.duration_formatted}
                     </div>
                     {conversationDetails?.client_intent && (
                       <div className="text-sm text-blue-600 font-medium">
                         🎯 {conversationDetails.client_intent}
                       </div>
                     )}
                    </div>
                  </div>
                  <button
                    onClick={closeConversationModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Содержимое модального окна */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Загрузка деталей разговора...</span>
                    </div>
                  ) : conversationDetails ? (
                    <div className="space-y-6">
                      {/* Информация о разговоре */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3">📊 Информация о разговоре</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Статус:</span> {conversationDetails.status}
                          </div>
                          <div>
                            <span className="font-medium">Создан:</span> {new Date(conversationDetails.created_at).toLocaleDateString('ru-RU')}
                          </div>
                          <div>
                            <span className="font-medium">Обновлен:</span> {new Date(conversationDetails.updated_at).toLocaleDateString('ru-RU')}
                          </div>
                          <div>
                            <span className="font-medium">Длительность:</span> {conversationDetails.duration_seconds} сек
                          </div>
                          <div>
                            <span className="font-medium">Сообщений:</span> {conversationDetails.statistics?.total_messages || 0}
                          </div>
                          <div>
                            <span className="font-medium">Транскрипт:</span> {conversationDetails.transcript?.length || 0} символов
                          </div>
                        </div>
                      </div>

                      {/* Аудио плеер */}
                      {conversationDetails.audio_url && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-3">🎵 Аудиозапись</h3>
                          <audio controls className="w-full">
                            <source src={conversationDetails.audio_url} type="audio/mpeg" />
                            Ваш браузер не поддерживает аудио элемент.
                          </audio>
                        </div>
                      )}

                      {/* Информация о лиде */}
                      {conversationDetails.lead_info && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="h-4 w-4 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Информация о лиде</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-600">Имя:</span> 
                              <span className="text-gray-900">{conversationDetails.lead_info.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-600">Телефон:</span> 
                              <span className="text-gray-900">{conversationDetails.lead_info.phone}</span>
                            </div>
                          </div>
                          {conversationDetails.lead_created && (
                            <div className="mt-3 p-2 bg-green-100 rounded-lg">
                              <div className="flex items-center gap-2 text-green-700">
                                <span className="text-sm">✅</span>
                                <span className="text-sm font-medium">Лид автоматически создан в базе данных</span>
                              </div>
                              {conversationDetails.lead_id && (
                                <div className="text-xs text-green-600 mt-1">
                                  ID лида: {conversationDetails.lead_id}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                                             {/* Краткое резюме разговора */}
                       {conversationDetails.transcript && (
                         <div>
                           <h3 className="text-lg font-semibold mb-3">📋 Краткое резюме</h3>
                           <div className="bg-gray-50 rounded-lg p-4">
                             <div className="text-sm text-gray-900 space-y-2">
                               <p><strong>Тема разговора:</strong> {conversationDetails.client_intent || 'Общий интерес к недвижимости'}</p>
                               <p><strong>Длительность:</strong> {conversationDetails.duration_seconds} секунд</p>
                               <p><strong>Сообщений:</strong> {conversationDetails.statistics?.total_messages || 0}</p>
                               {conversationDetails.lead_info && (
                                 <p><strong>Контакт:</strong> {conversationDetails.lead_info.name} - {conversationDetails.lead_info.phone}</p>
                               )}
                             </div>
                           </div>
                         </div>
                       )}

                      {/* История чата */}
                      {conversationDetails.chat_history && conversationDetails.chat_history.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">💬 История разговора</h3>
                          <div className="space-y-3">
                            {conversationDetails.chat_history.map((message: any, index: number) => (
                              <div key={index} className={`p-3 rounded-lg ${
                                message.role === 'user' 
                                  ? 'bg-blue-50 border border-blue-100' 
                                  : 'bg-gray-50 border border-gray-100'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-xs font-medium ${
                                    message.role === 'user' ? 'text-blue-600' : 'text-gray-600'
                                  }`}>
                                    {message.role === 'user' ? '👤 Клиент' : '🤖 Ассистент'}
                                  </span>
                                  <span className="text-xs text-gray-500">{message.time}</span>
                                </div>
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки</h4>
                      <p className="text-gray-600">Не удалось загрузить детали разговора</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 