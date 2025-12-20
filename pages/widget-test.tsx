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
        const birWidget = document.getElementById('bir-widget');
        const minskWidget = document.getElementById('minskworld-widget');
        if (birWidget) birWidget.style.display = 'none';
        if (minskWidget) minskWidget.style.display = 'none';
        addLog('✅ Виджет закрыт - iframe скрыт');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setClickLog(prev => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
  };

  const resetWidgets = () => {
    setBirWidgetVisible(false);
    setMinskWidgetVisible(false);
    setClickLog([]);
    setTimeout(() => {
      setBirWidgetVisible(true);
      setMinskWidgetVisible(true);
      const birWidget = document.getElementById('bir-widget');
      const minskWidget = document.getElementById('minskworld-widget');
      if (birWidget) birWidget.style.display = 'block';
      if (minskWidget) minskWidget.style.display = 'block';
      addLog('🔄 Виджеты сброшены');
    }, 100);
  };

  return (
    <>
      <Head>
        <title>Тестовый сайт - Проверка виджетов</title>
      </Head>

      <div className="min-h-[300vh] bg-gray-100">
        {/* Header */}
        <header className="bg-gray-900 text-white py-4 px-6 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="text-xl font-bold">ТЕСТОВЫЙ САЙТ</div>
            <nav className="flex items-center space-x-4">
              <a href="#" onClick={(e) => { e.preventDefault(); addLog('Клик: Меню 1'); }} className="hover:text-gray-300">Меню 1</a>
              <a href="#" onClick={(e) => { e.preventDefault(); addLog('Клик: Меню 2'); }} className="hover:text-gray-300">Меню 2</a>
              <button
                onClick={resetWidgets}
                className="px-3 py-1 bg-yellow-500 text-black rounded text-sm font-bold hover:bg-yellow-400"
              >
                🔄 Сбросить
              </button>
            </nav>
          </div>
        </header>

        {/* Log Panel - Fixed */}
        <div className="fixed top-16 left-4 right-4 z-30 max-w-md">
          <div className="bg-black/90 text-green-400 rounded-lg p-3 font-mono text-xs">
            <div className="font-bold text-white mb-1">Лог кликов:</div>
            <div className="h-24 overflow-y-auto">
              {clickLog.length === 0 ? (
                <div className="text-gray-500">Ожидание кликов...</div>
              ) : (
                clickLog.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="pt-8 px-6">
          <div className="max-w-6xl mx-auto">

            {/* Hero */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 mt-32">
              <h1 className="text-3xl font-bold mb-4">Тест скрытия виджетов</h1>
              <p className="text-gray-600 mb-4">
                Прокрутите страницу вниз. Кнопки размещены ПРЯМО ПОД виджетами.
                После закрытия виджета кнопки должны стать кликабельными.
              </p>
              <button
                onClick={() => addLog('Клик: Hero кнопка')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Тестовая кнопка
              </button>
            </div>

            {/* Content sections for scrolling */}
            {[1, 2, 3, 4, 5].map((section) => (
              <div key={section} className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4">Секция {section}</h2>
                <p className="text-gray-600 mb-4">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => addLog(`Клик: Секция ${section} - Кнопка A`)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Кнопка A
                  </button>
                  <button
                    onClick={() => addLog(`Клик: Секция ${section} - Кнопка B`)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Кнопка B
                  </button>
                </div>
              </div>
            ))}

            {/* Footer */}
            <div className="bg-gray-800 text-white rounded-xl p-8 mb-32">
              <h3 className="text-xl font-bold mb-4">Футер сайта</h3>
              <div className="flex space-x-4">
                <a href="#" onClick={(e) => { e.preventDefault(); addLog('Клик: Футер ссылка 1'); }} className="underline">Ссылка 1</a>
                <a href="#" onClick={(e) => { e.preventDefault(); addLog('Клик: Футер ссылка 2'); }} className="underline">Ссылка 2</a>
                <a href="#" onClick={(e) => { e.preventDefault(); addLog('Клик: Футер ссылка 3'); }} className="underline">Ссылка 3</a>
              </div>
            </div>

          </div>
        </main>

        {/* ===== BUTTONS DIRECTLY UNDER WIDGETS ===== */}

        {/* Buttons under BIR widget (right side) */}
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '320px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div className="bg-teal-100 border-2 border-teal-400 rounded-lg p-3">
            <div className="text-teal-800 font-bold text-sm mb-2">🟢 ПОД ВИДЖЕТОМ BIR</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addLog('🟢 BIR: Кнопка 1')}
                className="py-2 bg-teal-600 text-white rounded font-bold hover:bg-teal-700 text-sm"
              >
                Кнопка 1
              </button>
              <button
                onClick={() => addLog('🟢 BIR: Кнопка 2')}
                className="py-2 bg-teal-600 text-white rounded font-bold hover:bg-teal-700 text-sm"
              >
                Кнопка 2
              </button>
              <button
                onClick={() => addLog('🟢 BIR: Кнопка 3')}
                className="py-2 bg-teal-600 text-white rounded font-bold hover:bg-teal-700 text-sm"
              >
                Кнопка 3
              </button>
              <button
                onClick={() => addLog('🟢 BIR: Кнопка 4')}
                className="py-2 bg-teal-600 text-white rounded font-bold hover:bg-teal-700 text-sm"
              >
                Кнопка 4
              </button>
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); addLog('🟢 BIR: Ссылка'); }}
              className="block mt-2 text-teal-700 underline text-center text-sm"
            >
              Тестовая ссылка под BIR
            </a>
          </div>
        </div>

        {/* Buttons under MinskWorld widget (left side) */}
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            width: '320px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div className="bg-purple-100 border-2 border-purple-400 rounded-lg p-3">
            <div className="text-purple-800 font-bold text-sm mb-2">🟣 ПОД ВИДЖЕТОМ MINSKWORLD</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addLog('🟣 MW: Кнопка 1')}
                className="py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 text-sm"
              >
                Кнопка 1
              </button>
              <button
                onClick={() => addLog('🟣 MW: Кнопка 2')}
                className="py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 text-sm"
              >
                Кнопка 2
              </button>
              <button
                onClick={() => addLog('🟣 MW: Кнопка 3')}
                className="py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 text-sm"
              >
                Кнопка 3
              </button>
              <button
                onClick={() => addLog('🟣 MW: Кнопка 4')}
                className="py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 text-sm"
              >
                Кнопка 4
              </button>
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); addLog('🟣 MW: Ссылка'); }}
              className="block mt-2 text-purple-700 underline text-center text-sm"
            >
              Тестовая ссылка под MinskWorld
            </a>
          </div>
        </div>
      </div>

      {/* ===== WIDGETS ===== */}

      {/* BIR Widget - Right Side */}
      {birWidgetVisible && (
        <div
          id="bir-widget"
          style={{
            position: 'fixed',
            bottom: '20px',
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
            style={{ border: 'none', background: 'transparent' }}
          />
        </div>
      )}

      {/* MinskWorld Widget - Left Side */}
      {minskWidgetVisible && (
        <div
          id="minskworld-widget"
          style={{
            position: 'fixed',
            bottom: '20px',
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
            style={{ border: 'none', background: 'transparent' }}
          />
        </div>
      )}
    </>
  );
}
