import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function WidgetTest() {
  const [birWidgetVisible, setBirWidgetVisible] = useState(true);
  const [minskWidgetVisible, setMinskWidgetVisible] = useState(true);
  const [clickLog, setClickLog] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'widget-closed') {
        console.log('Widget closed message received');
        // Скрываем оба виджета при получении сообщения
        const birWidget = document.getElementById('bir-widget');
        const minskWidget = document.getElementById('minskworld-widget');
        if (birWidget) birWidget.style.display = 'none';
        if (minskWidget) minskWidget.style.display = 'none';

        addLog('Виджет закрыт - iframe скрыт');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setClickLog(prev => [`[${time}] ${message}`, ...prev.slice(0, 9)]);
  };

  const resetWidgets = () => {
    setBirWidgetVisible(false);
    setMinskWidgetVisible(false);
    setClickLog([]);
    setTimeout(() => {
      setBirWidgetVisible(true);
      setMinskWidgetVisible(true);
      // Показываем виджеты снова
      const birWidget = document.getElementById('bir-widget');
      const minskWidget = document.getElementById('minskworld-widget');
      if (birWidget) birWidget.style.display = 'block';
      if (minskWidget) minskWidget.style.display = 'block';
    }, 100);
  };

  return (
    <>
      <Head>
        <title>Тестовый сайт - Проверка виджетов</title>
        <meta name="description" content="Тестовая страница для проверки виджетов" />
      </Head>

      {/* Fake Website Layout */}
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-gray-900 text-white py-4 px-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="text-2xl font-bold">ТЕСТОВЫЙ САЙТ</div>
            <nav className="space-x-6">
              <a href="#" onClick={(e) => { e.preventDefault(); addLog('Клик: Главная'); }} className="hover:text-gray-300">Главная</a>
              <a href="#" onClick={(e) => { e.preventDefault(); addLog('Клик: О нас'); }} className="hover:text-gray-300">О нас</a>
              <a href="#" onClick={(e) => { e.preventDefault(); addLog('Клик: Контакты'); }} className="hover:text-gray-300">Контакты</a>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto py-8 px-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Добро пожаловать!</h1>
            <p className="text-xl mb-6">Это тестовый сайт для проверки работы виджетов</p>
            <button
              onClick={() => addLog('Клик: Кнопка Hero')}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Узнать больше
            </button>
          </div>

          {/* Log Panel */}
          <div className="bg-gray-100 rounded-xl p-4 mb-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-700">Лог кликов (проверка кликабельности):</h3>
              <button
                onClick={resetWidgets}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
              >
                🔄 Сбросить виджеты
              </button>
            </div>
            <div className="bg-white rounded-lg p-3 h-32 overflow-y-auto font-mono text-sm">
              {clickLog.length === 0 ? (
                <p className="text-gray-400">Кликайте по элементам сайта...</p>
              ) : (
                clickLog.map((log, i) => (
                  <div key={i} className="text-green-600">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Content Grid - positioned to be under widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Left Column - under MinskWorld widget */}
            <div className="space-y-4">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <h3 className="font-bold text-purple-800 mb-2">🟣 Зона MinskWorld виджета</h3>
                <p className="text-purple-600 text-sm mb-3">Эти кнопки находятся ПОД виджетом MinskWorld (слева)</p>
                <div className="space-y-2">
                  <button
                    onClick={() => addLog('Клик: Фиолетовая кнопка 1')}
                    className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    Фиолетовая кнопка 1
                  </button>
                  <button
                    onClick={() => addLog('Клик: Фиолетовая кнопка 2')}
                    className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    Фиолетовая кнопка 2
                  </button>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); addLog('Клик: Фиолетовая ссылка'); }}
                    className="block text-purple-600 underline hover:text-purple-800"
                  >
                    Тестовая ссылка
                  </a>
                </div>
              </div>
            </div>

            {/* Center Column */}
            <div className="space-y-4">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-2">📝 Центральный контент</h3>
                <p className="text-gray-600 text-sm mb-3">Эта область должна быть всегда кликабельна</p>
                <div className="space-y-2">
                  <button
                    onClick={() => addLog('Клик: Серая кнопка 1')}
                    className="w-full py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Серая кнопка 1
                  </button>
                  <button
                    onClick={() => addLog('Клик: Серая кнопка 2')}
                    className="w-full py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Серая кнопка 2
                  </button>
                  <input
                    type="text"
                    placeholder="Тестовое поле ввода"
                    onFocus={() => addLog('Фокус: Поле ввода')}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - under BIR widget */}
            <div className="space-y-4">
              <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4">
                <h3 className="font-bold text-teal-800 mb-2">🟢 Зона BIR виджета</h3>
                <p className="text-teal-600 text-sm mb-3">Эти кнопки находятся ПОД виджетом BIR (справа)</p>
                <div className="space-y-2">
                  <button
                    onClick={() => addLog('Клик: Бирюзовая кнопка 1')}
                    className="w-full py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                  >
                    Бирюзовая кнопка 1
                  </button>
                  <button
                    onClick={() => addLog('Клик: Бирюзовая кнопка 2')}
                    className="w-full py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                  >
                    Бирюзовая кнопка 2
                  </button>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); addLog('Клик: Бирюзовая ссылка'); }}
                    className="block text-teal-600 underline hover:text-teal-800"
                  >
                    Тестовая ссылка
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Buttons Row - directly under widget area */}
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 py-4 px-6 z-50">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center">
                {/* Left side buttons - under MinskWorld */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => addLog('Клик: Нижняя левая 1')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Левая кнопка 1
                  </button>
                  <button
                    onClick={() => addLog('Клик: Нижняя левая 2')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Левая кнопка 2
                  </button>
                </div>

                {/* Center */}
                <div className="text-white text-sm">
                  ⬅️ Под MinskWorld | Под BIR ➡️
                </div>

                {/* Right side buttons - under BIR */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => addLog('Клик: Нижняя правая 1')}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Правая кнопка 1
                  </button>
                  <button
                    onClick={() => addLog('Клик: Нижняя правая 2')}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Правая кнопка 2
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer for fixed bottom bar */}
          <div className="h-20"></div>
        </main>
      </div>

      {/* BIR Widget - Right Side */}
      {birWidgetVisible && (
        <div
          id="bir-widget"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 999999,
            width: '340px',
            height: '340px',
            pointerEvents: 'auto'
          }}
        >
          <iframe
            src="/widget?theme=default"
            width="340"
            height="340"
            frameBorder="0"
            allow="microphone"
            style={{
              border: 'none',
              background: 'transparent'
            }}
          />
        </div>
      )}

      {/* MinskWorld Widget - Left Side */}
      {minskWidgetVisible && (
        <div
          id="minskworld-widget"
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '20px',
            zIndex: 999999,
            width: '340px',
            height: '340px',
            pointerEvents: 'auto'
          }}
        >
          <iframe
            src="/widget?theme=purple&phone=7675&privacyUrl=https%3A%2F%2Fminskworld.by%2Fpolozhenie-o-politike-v-otnoshenii-obrabotki-personalnyh-dannyh-potenczialnyh-klientov-v-ooo-dubaj-investment%2F&consentUrl=https%3A%2F%2Fminskworld.by%2Faiconsent.pdf"
            width="340"
            height="340"
            frameBorder="0"
            allow="microphone"
            style={{
              border: 'none',
              background: 'transparent'
            }}
          />
        </div>
      )}
    </>
  );
}
