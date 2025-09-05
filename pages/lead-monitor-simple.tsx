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

interface Conversation {
  id: string
  agent_id: string
  status: string
  start_time: number
  end_time: number
  duration_seconds: number
  duration_formatted: string
  start_time_formatted: string
  end_time_formatted: string
  minutes_ago: number
  has_lead: boolean
  lead_info: any
  transcript_length: number
  metadata: any
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
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Мониторинг лидов</h1>
            </div>
            <p className="text-gray-600">
              Панель управления лидами в реальном времени от голосового ассистента MinskMir
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('leads')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'leads'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Лиды ({data?.stats?.total_leads || 0})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('conversations')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'conversations'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Разговоры ({conversationsData?.stats?.total_conversations || 0})
                  </div>
                </button>
              </nav>
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
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Разговоры</h2>
              {conversationsData?.conversations?.map((conversation: Conversation) => (
                <div key={conversation.id} className="bg-white p-4 rounded-lg mb-2">
                  <h3 className="font-medium">Разговор {conversation.id.substring(0, 8)}...</h3>
                  <p className="text-gray-600">{conversation.start_time_formatted}</p>
                  <p className="text-sm text-gray-500">Длительность: {conversation.duration_formatted}</p>
                  <p className="text-sm text-gray-500">
                    {conversation.has_lead ? '✅ Есть лид' : '❌ Нет лида'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 