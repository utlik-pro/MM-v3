import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  BarChart,
  Settings,
  Download,
  Activity,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  FileText,
  Database,
  Webhook,
  Key,
  Globe,
  Monitor,
  Plug,
  Phone
} from 'lucide-react';
import Navigation from '../../src/components/Navigation';

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

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  color: string;
  action: () => void;
  status?: 'success' | 'warning' | 'error';
}

interface WidgetConfig {
  id: string;
  domain: string;
  name: string;
  enabled: boolean;
  theme: string;
  phone: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'settings' | 'logs' | 'export' | 'widgets'>('analytics');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [widgetsLoading, setWidgetsLoading] = useState(false);

  useEffect(() => {
    fetchAdminStats();
    fetchWidgets();
  }, []);

  const fetchWidgets = async () => {
    try {
      setWidgetsLoading(true);
      const response = await fetch('/api/admin/widget-config');
      if (response.ok) {
        const data = await response.json();
        setWidgets(data.widgets || []);
      }
    } catch (err) {
      console.error('Error fetching widgets:', err);
    } finally {
      setWidgetsLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching real admin stats...');
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const realStats: AdminStats = await response.json();
      console.log('📊 Real stats received:', realStats);
      
      setStats(realStats);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      
      // Fallback к демонстрационным данным при ошибке
      const fallbackStats: AdminStats = {
        leads: {
          total: 0,
          today: 0,
          thisWeek: 0,
          conversionRate: 0
        },
        conversations: {
          total: 0,
          today: 0,
          avgDuration: "0:00",
          successRate: 0
        },
        system: {
          uptime: "Недоступно",
          webhookStatus: 'error',
          dbStatus: 'error',
          lastBackup: "Недоступно"
        }
      };
      setStats(fallbackStats);
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Экспорт лидов',
      description: 'Скачать CSV файл с лидами',
      icon: Download,
      color: 'bg-blue-500',
      action: () => window.open('/api/export/leads', '_blank'),
      status: 'success'
    },
    {
      title: 'Проверить webhook',
      description: 'Тест подключения к webhook',
      icon: Webhook,
      color: 'bg-green-500',
      action: () => window.open('/api/test-webhook', '_blank'),
      status: 'success'
    },
    {
      title: 'Бэкап БД',
      description: 'Создать резервную копию',
      icon: Database,
      color: 'bg-purple-500',
      action: () => window.open('/api/export/leads?format=json&days=365', '_blank'),
      status: 'warning'
    },
    {
      title: 'Логи системы',
      description: 'Просмотр системных логов',
      icon: FileText,
      color: 'bg-orange-500',
      action: () => setActiveTab('logs')
    }
  ];

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Статистика карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего лидов</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.leads.total}</p>
              <p className="text-xs text-green-600">+{stats?.leads.today} сегодня</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Разговоры</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.conversations.total}</p>
              <p className="text-xs text-green-600">+{stats?.conversations.today} сегодня</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Конверсия</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.leads.conversionRate}%</p>
              <p className="text-xs text-green-600">↑ +2.1% за неделю</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Средняя длительность</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.conversations.avgDuration}</p>
              <p className="text-xs text-red-600">↓ -15 сек за неделю</p>
            </div>
          </div>
        </div>
      </div>

      {/* Графики и диаграммы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Лиды по дням недели</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => {
              const height = Math.random() * 200 + 20;
              return (
                <div key={day} className="flex flex-col items-center">
                  <div 
                    className="bg-blue-500 rounded-t w-8 transition-all hover:bg-blue-600"
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Источники лидов</h3>
          <div className="space-y-4">
            {[
              { name: 'Голосовой виджет', count: 89, color: 'bg-green-500' },
              { name: 'Прямые звонки', count: 34, color: 'bg-blue-500' },
              { name: 'CRM интеграция', count: 29, color: 'bg-purple-500' }
            ].map((source) => (
              <div key={source.name} className="flex items-center">
                <div className={`w-4 h-4 ${source.color} rounded mr-3`} />
                <span className="text-sm text-gray-600 flex-1">{source.name}</span>
                <span className="text-sm font-semibold text-gray-900">{source.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API настройки */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Key className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">API ключи</h3>
          </div>
          <div className="space-y-4">
            <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">
                 Voice AI API Key
               </label>
              <div className="flex">
                <input 
                  type="password" 
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm"
                  placeholder="sk-..." 
                  defaultValue="sk-***************"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-r-md text-sm hover:bg-blue-700">
                  Тест
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supabase URL
              </label>
              <input 
                type="url" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="https://..."
                defaultValue="https://your-project.supabase.co"
              />
            </div>
          </div>
        </div>

        {/* Webhook настройки */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Webhook className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Webhooks</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CRM Lead Webhook
              </label>
              <div className="flex">
                <input 
                  type="url" 
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm"
                  defaultValue={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/crm-lead-enhanced`}
                />
                <button className="bg-green-600 text-white px-4 py-2 rounded-r-md text-sm hover:bg-green-700">
                  Тест
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proxy CRM Webhook
              </label>
              <input 
                type="url" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                defaultValue={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/proxy-crm`}
              />
            </div>
          </div>
        </div>

        {/* CORS настройки */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Globe className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">CORS домены</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">localhost:3000</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Активен</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">minsk-mir.by</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Активен</span>
            </div>
            <button className="w-full border-2 border-dashed border-gray-300 rounded-md p-3 text-sm text-gray-500 hover:border-gray-400">
              + Добавить домен
            </button>
          </div>
        </div>

        {/* Статус системы */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Monitor className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Статус системы</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">База данных</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Подключена</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Webhooks</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Активны</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Аптайм</span>
              <span className="text-sm text-gray-600">{stats?.system.uptime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Системные логи</h3>
            <button 
              onClick={fetchAdminStats}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-md text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Обновление...' : 'Обновить'}
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[
              { time: '10:35:24', level: 'INFO', message: 'Новый лид получен: Дмитрий (+375291234567)', type: 'success' },
              { time: '10:34:15', level: 'INFO', message: 'Smart linking: найден разговор с 95% совпадением', type: 'success' },
              { time: '10:33:02', level: 'WARN', message: 'Webhook retry для лида #152', type: 'warning' },
              { time: '10:30:45', level: 'INFO', message: 'Conversation sync completed successfully', type: 'success' },
              { time: '10:28:33', level: 'ERROR', message: 'Failed to link conversation for lead #151', type: 'error' },
              { time: '10:25:17', level: 'INFO', message: 'Knowledge base document added: Новый FAQ', type: 'success' }
            ].map((log, index) => (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                log.type === 'error' ? 'bg-red-50' : 
                log.type === 'warning' ? 'bg-yellow-50' : 'bg-green-50'
              }`}>
                <span className="text-xs text-gray-500 font-mono w-16">{log.time}</span>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                  log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                  log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {log.level}
                </span>
                <span className="text-sm text-gray-700 flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderExport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Экспорт лидов */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Экспорт лидов</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Экспортировать данные лидов в различных форматах
          </p>
                     <div className="space-y-2">
             <button 
               onClick={() => window.open('/api/export/leads?format=csv', '_blank')}
               className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700"
             >
               Скачать CSV
             </button>
             <button 
               onClick={() => window.open('/api/export/leads?format=csv', '_blank')}
               className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm hover:bg-green-700"
             >
               Скачать Excel
             </button>
             <button 
               onClick={() => window.open('/api/export/leads?format=json', '_blank')}
               className="w-full bg-gray-600 text-white py-2 px-4 rounded-md text-sm hover:bg-gray-700"
             >
               JSON данные
             </button>
           </div>
        </div>

        {/* Экспорт разговоров */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <MessageSquare className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Разговоры</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Экспорт транскриптов и метаданных разговоров
          </p>
          <div className="space-y-2">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700">
              Транскрипты
            </button>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md text-sm hover:bg-purple-700">
              Аудио архив
            </button>
          </div>
        </div>

        {/* Бэкап базы знаний */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Database className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">База знаний</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Резервные копии документов базы знаний
          </p>
          <div className="space-y-2">
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md text-sm hover:bg-purple-700">
              Полный бэкап
            </button>
            <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-md text-sm hover:bg-gray-700">
              Только метаданные
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Последний бэкап: {stats?.system.lastBackup}
          </div>
        </div>
      </div>

      {/* Настройки экспорта */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Настройки экспорта</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Период данных
            </label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option>Последние 7 дней</option>
              <option>Последние 30 дней</option>
              <option>Последние 90 дней</option>
              <option>Весь период</option>
              <option>Выбрать даты...</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Формат времени
            </label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option>UTC</option>
              <option>Московское время (UTC+3)</option>
              <option>Минское время (UTC+3)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWidgets = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Управление виджетами</h3>
            <p className="text-sm text-gray-500">Включение и выключение виджетов на сайтах клиентов</p>
          </div>
          <button
            onClick={fetchWidgets}
            disabled={widgetsLoading}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-3 py-2 rounded-md text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${widgetsLoading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        {widgetsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Загрузка...</p>
          </div>
        ) : widgets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Виджеты не найдены
          </div>
        ) : (
          <div className="space-y-4">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className={`border rounded-lg p-4 transition-colors ${
                  widget.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${widget.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{widget.name}</h4>
                      <p className="text-sm text-gray-500">{widget.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="capitalize">{widget.theme}</span>
                        <span className="text-gray-400">|</span>
                        <Phone className="h-3 w-3" />
                        <span>{widget.phone}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      widget.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {widget.enabled ? 'Включен' : 'Выключен'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Как изменить статус виджета</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Откройте файл <code className="bg-blue-100 px-1 rounded">config/widgets.json</code></li>
            <li>Измените <code className="bg-blue-100 px-1 rounded">"enabled": true/false</code> для нужного домена</li>
            <li>Сделайте commit и push в git</li>
            <li>Vercel автоматически задеплоит изменения (~2-3 мин)</li>
          </ol>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка админ панели...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Head>
        <title>Админ панель - MinskMir голосовой ассистент</title>
        <meta name="description" content="Панель администрирования и аналитики" />
      </Head>

      <Navigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Админ панель</h1>
              <p className="text-gray-600">Управление системой MinskMir</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Система работает
              </span>
              <button 
                onClick={fetchAdminStats}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Обновление...' : 'Обновить'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'analytics', name: 'Аналитика', icon: BarChart },
              { id: 'settings', name: 'Настройки', icon: Settings },
              { id: 'logs', name: 'Логи', icon: Activity },
              { id: 'export', name: 'Экспорт', icon: Download },
              { id: 'widgets', name: 'Виджеты', icon: Plug }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Ошибка загрузки данных</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {activeTab === 'analytics' && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.title}
                      onClick={action.action}
                      className="flex items-center p-4 bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow text-left"
                    >
                      <div className={`p-2 ${action.color} rounded-lg mr-3`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                      {action.status && (
                        <div className={`ml-2 h-2 w-2 rounded-full ${
                          action.status === 'success' ? 'bg-green-400' :
                          action.status === 'warning' ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'export' && renderExport()}
          {activeTab === 'widgets' && renderWidgets()}
        </div>
      </div>
    </div>
  );
} 