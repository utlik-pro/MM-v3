import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [iframeUrl, setIframeUrl] = useState('/widget');

  return (
    <>
      <Head>
        <title>MinskMir Voice Widget - Demo</title>
        <meta name="description" content="Демонстрация голосового виджета MinskMir с ElevenLabs API" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MinskMir Voice Widget
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Демонстрация интеграции голосового ассистента с ElevenLabs API через iframe. 
              Виджет полностью скрывает использование ElevenLabs от конечных пользователей.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Скрытие API</h3>
              <p className="text-gray-600">Полностью скрывает использование ElevenLabs от пользователей</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Безопасность</h3>
              <p className="text-gray-600">API ключи хранятся на сервере, rate limiting включен</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10l1 1v16l-1 1H6l-1-1V5l1-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Готов к продакшену</h3>
              <p className="text-gray-600">Оптимизирован для Vercel, с поддержкой CORS и мониторинга</p>
            </div>
          </div>

          {/* Demo Section */}
          <div className="bg-white rounded-lg shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Демонстрация Iframe Виджета
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Iframe Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Предварительный просмотр:</h3>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                  <iframe
                    src={iframeUrl}
                    width="100%"
                    height="150"
                    frameBorder="0"
                    className="rounded-lg"
                    title="MinskMir Voice Widget"
                  />
                </div>
              </div>

              {/* Integration Code */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Код для интеграции:</h3>
                <div className="bg-gray-900 rounded-lg p-4 text-sm">
                  <pre className="text-green-400 overflow-x-auto">
{`<!-- Простая интеграция -->
<iframe 
  src="https://your-domain.vercel.app/widget"
  width="100%"
  height="150"
  frameborder="0"
  title="MinskMir Voice Assistant">
</iframe>`}
                  </pre>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 text-sm">
                  <pre className="text-green-400 overflow-x-auto">
{`<!-- С дополнительными параметрами -->
<iframe 
  src="https://your-domain.vercel.app/widget"
  width="300"
  height="80"
  frameborder="0"
  allow="microphone"
  title="Voice Assistant">
</iframe>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Технические детали</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• <strong>Framework:</strong> Next.js 14 + TypeScript</li>
                <li>• <strong>Стилизация:</strong> TailwindCSS</li>
                <li>• <strong>API:</strong> ElevenLabs ConvAI</li>
                <li>• <strong>Деплой:</strong> Vercel</li>
                <li>• <strong>Безопасность:</strong> Rate limiting, CORS</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Конфигурация</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• <strong>Agent ID:</strong> agent_01jxkr0mstfk6ttayjsghjm7xc</li>
                <li>• <strong>API Key:</strong> Скрыт на сервере</li>
                <li>• <strong>Rate Limit:</strong> 100 запросов/час</li>
                <li>• <strong>CORS:</strong> Настроен для *.minskmir.by</li>
                <li>• <strong>Размер:</strong> Адаптивный</li>
              </ul>
            </div>
          </div>

          {/* Links */}
          <div className="text-center mt-12">
            <div className="space-x-4">
              <a
                href="/widget"
                target="_blank"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Открыть виджет в новой вкладке
              </a>
              <a
                href="https://github.com/your-repo/minskmir-voice-widget"
                target="_blank"
                className="inline-flex items-center px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
              >
                Исходный код на GitHub
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 