import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function WidgetTest() {
  const [birWidgetVisible, setBirWidgetVisible] = useState(true);
  const [minskWidgetVisible, setMinskWidgetVisible] = useState(true);

  useEffect(() => {
    // Слушаем сообщения от виджетов
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'widget-closed') {
        // Определяем какой виджет закрылся по origin или другим признакам
        // Для теста скрываем оба, но можно различать по ID
        console.log('Widget closed message received');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const resetWidgets = () => {
    setBirWidgetVisible(false);
    setMinskWidgetVisible(false);
    setTimeout(() => {
      setBirWidgetVisible(true);
      setMinskWidgetVisible(true);
    }, 100);
  };

  return (
    <>
      <Head>
        <title>Тест виджетов - BIR & MinskWorld</title>
        <meta name="description" content="Тестовая страница для проверки виджетов" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Тест виджетов
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Проверка работы виджетов для bir.by и minskworld.by
          </p>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* BIR Widget Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Виджет BIR.BY
              </h2>
              <p className="text-gray-600 mb-4">
                Тема: <span className="font-semibold text-teal-600">Default (бирюзовый)</span>
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Телефон: 7911</li>
                <li>• Документы: bir.by</li>
                <li>• Позиция: справа внизу</li>
              </ul>
            </div>

            {/* MinskWorld Widget Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Виджет MinskWorld
              </h2>
              <p className="text-gray-600 mb-4">
                Тема: <span className="font-semibold text-purple-600">Purple (фиолетовый)</span>
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Телефон: 7675</li>
                <li>• Документы: minskworld.by</li>
                <li>• Позиция: слева внизу</li>
              </ul>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Тестовые кнопки (должны быть кликабельны после закрытия виджета)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => alert('Кнопка 1 работает!')}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Кнопка 1
              </button>
              <button
                onClick={() => alert('Кнопка 2 работает!')}
                className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Кнопка 2
              </button>
              <button
                onClick={() => alert('Кнопка 3 работает!')}
                className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Кнопка 3
              </button>
              <button
                onClick={resetWidgets}
                className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Сбросить виджеты
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-amber-800 mb-2">Инструкция по тестированию:</h3>
            <ol className="text-amber-700 space-y-2">
              <li>1. Отметьте оба чекбокса в виджете</li>
              <li>2. Нажмите "ПОЗВОНИТЬ" для проверки подключения</li>
              <li>3. Нажмите крестик (X) для закрытия виджета</li>
              <li>4. После закрытия попробуйте нажать тестовые кнопки выше</li>
              <li>5. Нажмите "Сбросить виджеты" чтобы показать их снова</li>
            </ol>
          </div>
        </div>

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
              style={{
                border: 'none',
                background: 'transparent'
              }}
            />
          </div>
        )}
      </div>

      {/* Script to handle widget close messages */}
      <script dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'widget-closed') {
              console.log('Widget closed, hiding iframes...');
              var birWidget = document.getElementById('bir-widget');
              var minskWidget = document.getElementById('minskworld-widget');
              if (birWidget) birWidget.style.display = 'none';
              if (minskWidget) minskWidget.style.display = 'none';
            }
          });
        `
      }} />
    </>
  );
}
