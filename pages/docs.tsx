import { useState } from 'react'
import { FileText, Github, Settings, Phone, Database, Code, ExternalLink, Monitor, Brain, Webhook } from 'lucide-react'
import Navigation from '../src/components/Navigation'
import Head from 'next/head'

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    {
      id: 'overview',
      title: 'Обзор системы',
      icon: FileText,
      content: (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Minsk Mir голосовой ассистент</h2>
          <p className="text-gray-600 mb-6">
            Полноценная система управления голосовыми агентами с AI технологиями, 
            автоматическим мониторингом лидов и управлением базой знаний.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">🎯 Основные возможности</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Автоматический мониторинг лидов в реальном времени</li>
                <li>• Управление базой знаний AI агента</li>
                <li>• Встраиваемый голосовой виджет</li>
                <li>• Интеграция с CRM системой</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">⚡ Технический стек</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Next.js + TypeScript</li>
                <li>• Supabase (PostgreSQL)</li>
                <li>• Voice AI API</li>
                <li>• Tailwind CSS</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'setup',
      title: 'Установка и настройка',
      icon: Settings,
      content: (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Установка и настройка</h2>
          
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Требования</h3>
            <p className="text-sm text-yellow-700">
              Для работы системы необходимы API ключи голосовой платформы и настроенная база данных Supabase.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">1. Клонирование репозитория</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
            <div>git clone https://github.com/your-repo/minsk-mir-voice-agent.git</div>
            <div>cd minsk-mir-voice-agent</div>
            <div>npm install</div>
          </div>

          <h3 className="text-xl font-semibold mb-3">2. Настройка переменных окружения</h3>
          <p className="mb-3">Создайте файл <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>:</p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
            <div># Voice AI API</div>
            <div>VOICE_AI_API_KEY=your_voice_ai_api_key</div>
            <div>VOICE_AGENT_ID=your_agent_id</div>
            <div></div>
            <div># Supabase</div>
            <div>DATABASE_URL=your_supabase_db_url</div>
            <div>DIRECT_URL=your_supabase_direct_url</div>
            <div>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key</div>
          </div>

          <h3 className="text-xl font-semibold mb-3">3. Настройка базы данных</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
            <div>npx prisma db push</div>
            <div>npx prisma generate</div>
          </div>

          <h3 className="text-xl font-semibold mb-3">4. Запуск проекта</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
            <div>npm run dev</div>
          </div>
        </div>
      )
    },
    {
      id: 'widget',
      title: 'Голосовой виджет',
      icon: Phone,
      content: (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Встраивание голосового виджета</h2>
          
          <p className="mb-6">
            Виджет можно легко встроить в любой веб-сайт с помощью iframe или прямой интеграции.
          </p>

          <h3 className="text-xl font-semibold mb-3">Способ 1: iframe (Рекомендуется)</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-6 font-mono text-sm">
            <div>&lt;iframe</div>
            <div>  src="https://your-domain.com/widget"</div>
            <div>  width="400"</div>
            <div>  height="600"</div>
            <div>  frameborder="0"</div>
            <div>  allow="microphone"</div>
            <div>&gt;&lt;/iframe&gt;</div>
          </div>

          <h3 className="text-xl font-semibold mb-3">Способ 2: JavaScript интеграция</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-6 font-mono text-sm">
            <div>&lt;div id="voice-widget"&gt;&lt;/div&gt;</div>
            <div>&lt;script&gt;</div>
            <div>  const script = document.createElement('script');</div>
            <div>  script.src = 'https://your-domain.com/widget.js';</div>
            <div>  script.onload = () =&gt; &#123;VoiceWidget.init('voice-widget')&#125;;</div>
            <div>  document.head.appendChild(script);</div>
            <div>&lt;/script&gt;</div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Настройки виджета</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Настройте agent_id в коде виджета</li>
              <li>• Убедитесь что домен добавлен в CORS настройки</li>
              <li>• Проверьте что пользователи дают разрешение на микрофон</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'api',
      title: 'API и Webhooks',
      icon: Webhook,
      content: (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">API и Webhooks</h2>
          
          <h3 className="text-xl font-semibold mb-3">Основные API endpoints</h3>
          
          <div className="space-y-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">GET</span>
                <code className="font-mono">/api/monitor-leads</code>
              </div>
              <p className="text-sm text-gray-600">Получение списка лидов в реальном времени</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">POST</span>
                <code className="font-mono">/api/webhook/crm-lead-enhanced</code>
              </div>
              <p className="text-sm text-gray-600">Webhook для получения лидов от голосового ассистента</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">GET</span>
                <code className="font-mono">/api/conversation-simple</code>
              </div>
              <p className="text-sm text-gray-600">Получение деталей разговора из системы</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">GET</span>
                <code className="font-mono">/api/knowledge-base/list</code>
              </div>
              <p className="text-sm text-gray-600">Управление документами базы знаний</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3">Настройка голосового ассистента</h3>
          <p className="mb-3">Для автоматической отправки лидов настройте Tool в системе:</p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
            <div>Tool Name: SendToCRMLead</div>
            <div>URL: https://your-domain.com/api/webhook/crm-lead-enhanced</div>
            <div>Method: POST</div>
            <div>Parameters:</div>
            <div>  - FullName (string)</div>
            <div>  - Phone (string)</div>
            <div>  - Commentary (string)</div>
            <div>  - UsrMinskMir (string, optional)</div>
          </div>
        </div>
      )
    },
    {
      id: 'monitoring',
      title: 'Мониторинг лидов',
      icon: Monitor,
      content: (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Система мониторинга лидов</h2>
          
                  <p className="mb-6">
          Система автоматически отслеживает новых лидов и связывает их с разговорами голосового ассистента.
        </p>

        <h3 className="text-xl font-semibold mb-3">Как работает автоматическая связка</h3>
        <ol className="list-decimal list-inside space-y-2 mb-6">
          <li>Голосовой ассистент использует Tool "SendToCRMLead"</li>
            <li>Данные отправляются через office.bir.by на наш webhook</li>
            <li>Система создает лид в базе данных</li>
            <li>Автоматически запускается поиск соответствующего разговора</li>
            <li>Разговор связывается с лидом по времени и данным клиента</li>
          </ol>

          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-green-900 mb-2">✨ Smart Linking Algorithm</h4>
            <p className="text-sm text-green-800 mb-2">Система использует умный алгоритм поиска:</p>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Поиск в временном окне ±2 часа от создания лида</li>
              <li>• Сопоставление по имени клиента (точное/частичное совпадение)</li>
              <li>• Сопоставление по номеру телефона</li>
              <li>• Анализ Tool calls в транскрипте разговора</li>
              <li>• Расчет score совпадения (от 50% до 100%)</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mb-3">Доступ к странице мониторинга</h3>
          <p className="mb-3">
            Перейдите в раздел <a href="/lead-monitor" className="text-blue-600 hover:underline">"Мониторинг лидов"</a> 
            для просмотра лидов в реальном времени.
          </p>

          <h3 className="text-xl font-semibold mb-3">Индикаторы статуса</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-green-50 text-green-600 px-3 py-1 rounded text-xs">🔗 Разговор найден</span>
              <span className="text-sm">Лид успешно связан с разговором</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded text-xs">⚠️ Разговор не найден</span>
              <span className="text-sm">Автоматическая связка не удалась</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'knowledge',
      title: 'База знаний',
      icon: Brain,
      content: (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Управление базой знаний</h2>
          
          <p className="mb-6">
            База знаний позволяет добавлять документы, которые AI агент будет использовать для ответов.
          </p>

          <h3 className="text-xl font-semibold mb-3">Типы документов</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">📄 Текстовые документы</h4>
              <p className="text-sm text-gray-600">Добавляйте текстовую информацию напрямую через веб-интерфейс</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">🔗 URL документы</h4>
              <p className="text-sm text-gray-600">Автоматическая индексация веб-страниц по URL</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">📁 Файлы</h4>
              <p className="text-sm text-gray-600">Загрузка PDF, DOC и других файловых форматов</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3">RAG индексация</h3>
          <p className="mb-3">
            Все документы автоматически индексируются с помощью модели <code className="bg-gray-100 px-2 py-1 rounded">multilingual_e5_large_instruct</code>.
          </p>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Советы по эффективности</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Используйте осмысленные названия документов</li>
              <li>• Добавляйте документы на том же языке, что и агент</li>
              <li>• Регулярно обновляйте устаревшую информацию</li>
                              <li>• Следите за размером базы знаний (системные лимиты)</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mb-3">Привязка к агентам</h3>
          <p className="mb-3">
            После добавления документа обязательно привяжите его к нужному агенту в системе.
          </p>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Решение проблем',
      icon: Database,
      content: (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Решение распространенных проблем</h2>
          
          <div className="space-y-6">
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="font-semibold text-red-900 mb-2">❌ Лиды не приходят</h3>
              <div className="text-sm text-red-800 space-y-2">
                <p><strong>Проверьте:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Правильность URL webhook в настройках системы</li>
                  <li>Работает ли сервер и доступен ли webhook endpoint</li>
                                      <li>Корректность API ключей голосовой платформы</li>
                  <li>Настройки CORS для домена</li>
                </ul>
              </div>
            </div>

            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Разговоры не связываются с лидами</h3>
              <div className="text-sm text-yellow-800 space-y-2">
                <p><strong>Возможные причины:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Большая разница во времени между лидом и разговором ({'>'}2 часов)</li>
                  <li>Неточность в написании имени или номера телефона</li>
                  <li>Агент не использовал Tool "SendToCRMLead" в разговоре</li>
                  <li>Проблемы с доступом к Voice AI API</li>
                </ul>
              </div>
            </div>

            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-blue-900 mb-2">🔧 База знаний не работает</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Проверьте:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Завершилась ли RAG индексация документов</li>
                  <li>Привязаны ли документы к агенту в системе</li>
                  <li>Не превышен ли лимит размера базы знаний</li>
                  <li>Корректность содержимого документов</li>
                </ul>
              </div>
            </div>

            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold text-green-900 mb-2">💾 Проблемы с базой данных</h3>
              <div className="text-sm text-green-800 space-y-2">
                <p><strong>Команды для диагностики:</strong></p>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                  <div>npx prisma db push</div>
                  <div>npx prisma generate</div>
                  <div>npx prisma studio</div>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-8">Логи и отладка</h3>
          <p className="mb-3">Основные места для проверки логов:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Консоль браузера (Network tab для API запросов)</li>
            <li>Логи Next.js сервера (терминал)</li>
            <li>Логи webhook'ов в системе</li>
            <li>Supabase Dashboard для проверки данных</li>
          </ul>
        </div>
      )
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Head>
        <title>Документация - Minsk Mir голосовой ассистент</title>
        <meta name="description" content="Техническая документация по настройке и использованию системы" />
      </Head>

      {/* Navigation Sidebar */}
      <Navigation />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Documentation Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Документация</h1>
                <p className="text-sm text-gray-500">Техническое руководство</p>
              </div>
            </div>
          </div>
          
          <nav className="p-4">
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${
                      activeSection === section.id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <a 
              href="https://github.com/your-repo/minsk-mir-voice-agent" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub репозиторий</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {sections.find(s => s.id === activeSection)?.content}
          </div>
        </div>
      </div>
    </div>
  )
} 