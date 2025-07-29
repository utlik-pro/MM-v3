import { useState } from 'react'
import { Phone, MessageSquare, Users, Settings, MonitorSpeaker, Copy, Check } from 'lucide-react'
import Navigation from '../src/components/Navigation'
import Head from 'next/head'

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  
  // Widget настройки
  const [widgetSettings, setWidgetSettings] = useState({
    domain: typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com',
    width: '400',
    height: '600',
    frameBorder: '0'
  })

  // Валидация и форматирование размеров
  const handleSizeChange = (field: 'width' | 'height', value: string) => {
    // Разрешаем только цифры и ограничиваем диапазон
    const numValue = parseInt(value.replace(/\D/g, '')) || 0
    const clampedValue = Math.max(200, Math.min(1200, numValue)).toString()
    
    setWidgetSettings(prev => ({
      ...prev,
      [field]: clampedValue
    }))
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
      console.log('✅ Copied to clipboard:', type)
    } catch (err) {
      console.error('❌ Failed to copy:', err)
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
        console.log('✅ Copied to clipboard (fallback):', type)
      } catch (fallbackErr) {
        console.error('❌ Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  const quickLinks = [
    {
      title: 'Мониторинг лидов',
      description: 'Отслеживание лидов в реальном времени',
      href: '/lead-monitor',
      icon: MonitorSpeaker,
      color: 'bg-blue-500'
    },
    {
      title: 'База знаний',
      description: 'Управление документами AI агента',
      href: '/knowledge-base',
      icon: MessageSquare,
      color: 'bg-green-500'
    },
    {
      title: 'Аналитика',
      description: 'Статистика, настройки и экспорт данных',
      href: '/admin',
      icon: Settings,
      color: 'bg-purple-500'
    },
    {
      title: 'Документация',
      description: 'Техническое руководство и настройка',
      href: '/docs',
      icon: Users,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Head>
        <title>MinskMir - Голосовой ассистент</title>
        <meta name="description" content="Система управления голосовыми агентами с интеграцией AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation Sidebar */}
      <Navigation />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <Phone className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MinskMir</h1>
              <p className="text-sm text-gray-500">Голосовой ассистент</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Добро пожаловать в MinskMir
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl">
              Современная система управления голосовыми агентами с AI технологиями. 
              Отслеживайте лиды, управляйте базой знаний и встраивайте голосового ассистента на ваш сайт.
            </p>
          </div>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 ${link.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
                  <p className="text-sm text-gray-600">{link.description}</p>
                </a>
              )
            })}
          </div>

          {/* Widget Code Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Code for embedding */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Код для встраивания</h3>
                  <p className="text-gray-600">
                    Настройте параметры и скопируйте код
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-indigo-600" />
              </div>

              {/* Widget Settings */}
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-900">⚙️ Настройки виджета:</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Домен</label>
                    <input
                      type="text"
                      value={widgetSettings.domain}
                      onChange={(e) => setWidgetSettings({...widgetSettings, domain: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://your-domain.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ширина (200-1200px)</label>
                    <input
                      type="text"
                      value={widgetSettings.width}
                      onChange={(e) => handleSizeChange('width', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="400"
                      min="200"
                      max="1200"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Высота (200-1200px)</label>
                    <input
                      type="text"
                      value={widgetSettings.height}
                      onChange={(e) => handleSizeChange('height', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="600"
                      min="200"
                      max="1200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Рамка</label>
                    <select
                      value={widgetSettings.frameBorder}
                      onChange={(e) => setWidgetSettings({...widgetSettings, frameBorder: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="0">Без рамки</option>
                      <option value="1">С рамкой</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Code blocks */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">HTML (iframe):</h4>
                    <button
                      onClick={() => copyToClipboard(`<iframe
  src="${widgetSettings.domain}/widget"
  width="${widgetSettings.width}"
  height="${widgetSettings.height}"
  frameborder="${widgetSettings.frameBorder}"
  allow="microphone"
></iframe>`, 'iframe')}
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200 transition-colors"
                    >
                      {copied === 'iframe' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === 'iframe' ? 'Скопировано!' : 'Копировать'}
                    </button>
                  </div>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`<iframe
  src="${widgetSettings.domain}/widget"
  width="${widgetSettings.width}"
  height="${widgetSettings.height}"
  frameborder="${widgetSettings.frameBorder}"
  allow="microphone"
></iframe>`}</pre>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">JavaScript интеграция:</h4>
                    <button
                      onClick={() => copyToClipboard(`<div id="voice-widget"></div>
<script>
  const script = document.createElement('script');
  script.src = '${widgetSettings.domain}/widget.js';
  script.onload = () => {
    VoiceWidget.init('voice-widget');
  };
  document.head.appendChild(script);
</script>`, 'js')}
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200 transition-colors"
                    >
                      {copied === 'js' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === 'js' ? 'Скопировано!' : 'Копировать'}
                    </button>
                  </div>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`<div id="voice-widget"></div>
<script>
  const script = document.createElement('script');
  script.src = '${widgetSettings.domain}/widget.js';
  script.onload = () => {
    VoiceWidget.init('voice-widget');
  };
  document.head.appendChild(script);
</script>`}</pre>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">📝 Важные замечания:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Убедитесь что браузер разрешает доступ к микрофону</li>
                  <li>• Настройте CORS для вашего домена</li>
                  <li>• Проверьте настройки голосового агента</li>
                  <li>• Тестируйте на HTTPS (обязательно для микрофона)</li>
                </ul>
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Предварительный просмотр</h3>
                  <p className="text-gray-600">
                    Тестируйте виджет прямо здесь
                  </p>
                </div>
                <Phone className="w-8 h-8 text-indigo-600" />
              </div>
              
              {/* Widget iframe */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded shadow-lg">
                  <iframe
                    src="/widget"
                    width={widgetSettings.width}
                    height={widgetSettings.height}
                    frameBorder={widgetSettings.frameBorder}
                    title="Voice Widget Preview"
                    allow="microphone"
                    className="rounded"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '500px',
                      border: widgetSettings.frameBorder === '1' ? '1px solid #ccc' : 'none'
                    }}
                  />
                </div>
              </div>
              
              {/* Settings Info */}
              <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <div className="grid grid-cols-1 gap-2">
                  <div><strong>Размер:</strong> {widgetSettings.width} × {widgetSettings.height} пикселей</div>
                  <div><strong>Рамка:</strong> {widgetSettings.frameBorder === '1' ? 'Включена' : 'Отключена'}</div>
                  <div><strong>Домен:</strong> <span className="font-mono text-xs">{widgetSettings.domain}</span></div>
                </div>
              </div>
              
              <div className="mt-4">
                <a 
                  href="/widget" 
                  target="_blank"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <span>Открыть в новом окне</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 