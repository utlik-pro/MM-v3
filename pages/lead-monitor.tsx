import { useState, useEffect } from 'react'
import { AudioPlayer } from '../src/components/AudioPlayer'
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

interface ChatMessage {
  id: number
  role: string
  message: string
  time: string
  has_tool_calls: boolean
  tool_info: string | null
}

interface ConversationDetails {
  success: boolean
  conversation: {
    id: string
    agent_id: string
    start_time: string | null
    duration: string | null
    status: string
    language: string
    cost: number
  }
  lead_info: {
    name: string
    phone: string
    comment: string
  } | null
  chat_history: ChatMessage[]
  statistics: {
    total_messages: number
    agent_messages: number
    client_messages: number
    has_lead_capture: boolean
    conversation_length_seconds: number
  }
  raw_data_available: {
    has_transcript: boolean
    has_metadata: boolean
    has_analysis: boolean
  }
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
  const [refreshInterval, setRefreshInterval] = useState(15) // seconds
  const [showAll, setShowAll] = useState(true) // Переключатель: все лиды / только недавние
  
  // Состояние для модального окна
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Уведомления
  const { 
    permission, 
    isSupported, 
    isEnabled, 
    requestPermission, 
    enableNotifications, 
    disableNotifications, 
    newLeadsCount 
  } = useNotifications()

  // Отслеживание непрочитанных лидов
  const { markLeadAsRead } = useUnreadLeads()

  const fetchLeads = async () => {
    try {
      // Строим URL в зависимости от режима
      const url = showAll 
        ? '/api/monitor-leads?all=true&limit=100' 
        : '/api/monitor-leads?since=60' // последний час
      
      console.log(`🔄 Fetching leads: ${showAll ? 'ALL' : 'RECENT'} - ${url}`)
      
      const response = await fetch(url)
      const result = await response.json()
      setData(result)
      setLastUpdate(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching leads:', error)
      setIsLoading(false)
    }
  }

  const fetchConversationDetails = async (lead: Lead) => {
    setIsLoadingDetails(true)
    setSelectedLead(lead)
    
    // Отмечаем лид как прочитанный при просмотре
    markLeadAsRead(lead.id)
    
    try {
      const conversationId = lead.conversation_id

      // Если нет conversation_id, показываем ошибку
      if (!conversationId) {
        console.warn('❌ No conversation_id found for lead:', lead.name)
        setConversationDetails(null)
        return
      }

              // Получаем детали разговора из системы
      const url = `/api/conversation-simple?id=${conversationId}`
      console.log(`📞 Fetching conversation details: ${url}`)
      
      const response = await fetch(url)
      const details = await response.json()
      
      if (details.success) {
        setConversationDetails(details)
        console.log('✅ Conversation details loaded:', details.statistics)
      } else {
        console.warn('❌ Failed to load conversation details:', details.error)
        setConversationDetails(null)
      }
    } catch (error) {
      console.error('❌ Error fetching conversation details:', error)
      setConversationDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeModal = () => {
    setSelectedLead(null)
    setConversationDetails(null)
    setIsLoadingDetails(false)
  }

  useEffect(() => {
    fetchLeads()
  }, [showAll]) // Перезагружаем данные при изменении режима показа

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchLeads, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const getSourceBadge = (lead: Lead) => {
    if (lead.is_crm_lead) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          🎯 CRM Tool
        </span>
      )
    }
    if (lead.is_enhanced_lead) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ✨ Enhanced
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        📞 Voice
      </span>
    )
  }

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 font-bold'
    if (score >= 70) return 'text-blue-600 font-semibold'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка мониторинга лидов...</p>
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

      {/* Navigation Sidebar */}
      <Navigation />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Мониторинг лидов</h1>
            </div>
            <p className="text-gray-600">
              Панель управления лидами в реальном времени от голосового ассистента MinskMir
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchLeads}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  disabled={isLoading}
                >
                  <div className={`${isLoading ? 'animate-spin' : ''}`}>
                    <ChevronDown className="h-4 w-4" style={{transform: 'rotate(180deg)'}} />
                  </div>
                  Обновить
                </button>

                {/* Кнопка уведомлений */}
                {isSupported && (
                  <div className="flex items-center gap-2">
                    {permission === 'default' && (
                      <button
                        onClick={requestPermission}
                        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Разрешить уведомления
                      </button>
                    )}
                    
                    {permission === 'granted' && (
                      <button
                        onClick={isEnabled ? disableNotifications : enableNotifications}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          isEnabled 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {isEnabled ? (
                          <>
                            <Bell className="h-4 w-4" />
                            Уведомления вкл
                            {newLeadsCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                                {newLeadsCount}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <BellOff className="h-4 w-4" />
                            Уведомления выкл
                          </>
                        )}
                      </button>
                    )}

                    {permission === 'denied' && (
                      <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                        Уведомления заблокированы
                      </div>
                    )}
                  </div>
                )}

                {/* Переключатель режима отображения */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">Показать:</label>
                  <div className="relative">
                    <select
                      value={showAll ? 'all' : 'recent'}
                      onChange={(e) => setShowAll(e.target.value === 'all')}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Все лиды</option>
                      <option value="recent">Недавние</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="mr-2"
                  />
                  Автообновление
                </label>

                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="border rounded px-3 py-1"
                  disabled={!autoRefresh}
                >
                  <option value={5}>5 сек</option>
                  <option value={10}>10 сек</option>
                  <option value={15}>15 сек</option>
                  <option value={30}>30 сек</option>
                </select>
              </div>

              <div className="text-sm text-gray-500">
                Последнее обновление: {lastUpdate.toLocaleTimeString('ru-RU')}
              </div>
            </div>
          </div>

          {/* Stats */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      {showAll ? 'Всего лидов' : 'Недавние лиды'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{data.stats.total_leads}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">CRM лиды</p>
                    <p className="text-2xl font-bold text-green-600">{data.stats.crm_leads}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Enhanced</p>
                    <p className="text-2xl font-bold text-purple-600">{data.stats.enhanced_leads}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Ср. качество</p>
                    <p className={`text-2xl font-bold ${getQualityColor(data.stats.avg_quality_score)}`}>
                      {data.stats.avg_quality_score}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leads List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {showAll ? 'Все лиды' : 'Недавние лиды'}
                  {data && !showAll && ` (${data.stats.monitoring_period_minutes} мин)`}
                </h3>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {data?.leads?.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Лидов пока нет</h4>
                  <p className="text-gray-600 mb-4">Начните разговор с агентом для генерации лидов</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">
                      Webhook URL: <code className="bg-white px-2 py-1 rounded text-xs">/api/webhook/crm-lead-enhanced</code>
                    </p>
                  </div>
                </div>
              ) : (
                data?.leads?.map((lead: Lead) => (
                  <div 
                    key={lead.id} 
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => fetchConversationDetails(lead)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{lead.name}</h4>
                          <p className="text-gray-600">{lead.phone}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getSourceBadge(lead)}
                            {lead.project && (
                              <span className="text-xs text-gray-500">🏢 {lead.project}</span>
                            )}
                            {lead.intent?.length > 0 && (
                              <span className="text-xs text-gray-500">
                                💡 {lead.intent.join(', ')}
                              </span>
                            )}
                            {lead.conversation_id ? (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                🔗 Разговор найден
                              </span>
                            ) : (
                              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                ⚠️ Разговор не найден
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getQualityColor(lead.quality_score)}`}>
                          {lead.quality_score}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.time_formatted}
                        </div>
                        <div className="text-xs text-gray-400">
                          {lead.minutes_ago === 0 ? 'только что' : `${lead.minutes_ago} мин назад`}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {lead.conversation_id 
                            ? '📝 Кликните для просмотра разговора'
                            : '🔍 Кликните для поиска разговора'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Инструкции для тестирования</h3>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Откройте голосового ассистента MinskMir в другой вкладке</li>
              <li>Начните разговор с ассистентом</li>
              <li>Во время разговора назовите свое имя и номер телефона</li>
              <li>Ассистент автоматически сохранит лид в CRM</li>
              <li>Лид должен появиться на этой странице в течение нескольких секунд</li>
            </ol>
            
            <div className="mt-4 p-4 bg-white rounded border border-blue-200">
              <p className="font-medium text-blue-900">Технические детали:</p>
              <p className="text-sm text-blue-700">Tool ID: <code>xi4EFSeulNpmBWxSC9b4</code></p>
              <p className="text-sm text-blue-700">Webhook: <code>/api/webhook/crm-lead-enhanced</code></p>
            </div>
          </div>
        </div>

        {/* Модальное окно для деталей разговора */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] m-4 overflow-hidden">
              {/* Заголовок модального окна */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Разговор с {selectedLead.name}
                    </h2>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{selectedLead.phone}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeModal}
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
                          <span className="font-medium">Статус:</span> {conversationDetails.conversation.status}
                        </div>
                        <div>
                          <span className="font-medium">Язык:</span> {conversationDetails.conversation.language}
                        </div>
                        <div>
                          <span className="font-medium">Длительность:</span> {
                            conversationDetails.conversation.duration || 'Неизвестно'
                          }
                        </div>
                        <div>
                          <span className="font-medium">Сообщений:</span> {conversationDetails.statistics.total_messages}
                        </div>
                      </div>
                      
                      {/* Информация о лиде */}
                      {conversationDetails.lead_info && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="h-4 w-4 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Информация о лиде</h4>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-600">Имя:</span> 
                              <span className="text-gray-900">{conversationDetails.lead_info.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-600">Телефон:</span> 
                              <span className="text-gray-900">{conversationDetails.lead_info.phone}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                              <span className="font-medium text-gray-600">Комментарий:</span> 
                              <span className="text-gray-900">{conversationDetails.lead_info.comment}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* История разговора */}
                    {conversationDetails.chat_history && conversationDetails.chat_history.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">История разговора</h3>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-100 rounded-xl p-4 bg-gray-50">
                          {conversationDetails.chat_history.map((message) => (
                            <div 
                              key={message.id} 
                              className={`flex ${message.role === 'Клиент' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                                message.role === 'Клиент' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}>
                                <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
                                  {message.role === 'Клиент' ? (
                                    <Users className="h-3 w-3" />
                                  ) : (
                                    <MessageSquare className="h-3 w-3" />
                                  )}
                                  <span>{message.role}</span>
                                  {message.time && <span> • {message.time}</span>}
                                </div>
                                <div>{message.message}</div>
                                
                                {/* Показываем инструменты если есть */}
                                {message.has_tool_calls && message.tool_info && (
                                  <div className="mt-2 text-xs">
                                    <div className="opacity-75">🔧 Инструменты:</div>
                                    <div className="bg-black bg-opacity-20 rounded p-1 mt-1">
                                      {message.tool_info}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <MessageSquare className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">Транскрипт недоступен</p>
                        <p className="text-sm text-gray-500 mt-1">История разговора не найдена</p>
                      </div>
                    )}

                    {/* Аудио плеер */}
                    {conversationDetails.raw_data_available.has_transcript ? (
                      <AudioPlayer 
                        src={`/api/conversation-audio?id=${conversationDetails.conversation.id}`}
                        conversationId={conversationDetails.conversation.id}
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-xl border border-gray-100 p-8 text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <MessageSquare className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">Аудио недоступно</p>
                        <p className="text-sm text-gray-500 mt-1">Запись разговора не найдена</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Разговор не найден</h4>
                    <p className="text-gray-600 mb-4">
                      Для лида "{selectedLead.name}" не найден связанный разговор
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4 text-sm">
                      <p className="text-blue-800 font-medium mb-2">💡 Возможные причины:</p>
                      <ul className="text-blue-700 text-left space-y-1">
                        <li>• Разговор еще не синхронизирован с системой</li>
                        <li>• Лид был создан вручную, а не через агента</li>
                        <li>• Проблема с автоматической связкой данных</li>
                      </ul>
                                             <button
                         onClick={() => {
                           closeModal()
                           fetchConversationDetails(selectedLead)
                         }}
                         className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                       >
                         🔄 Попробовать снова
                       </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Кнопки в нижней части */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-500">
                  Lead ID: {selectedLead.id}
                  {conversationDetails?.conversation.id && (
                    <span className="ml-4">
                      Conversation ID: {conversationDetails.conversation.id}
                    </span>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 