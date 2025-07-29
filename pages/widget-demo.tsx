import React, { useState } from 'react';
import { AINotificationWidget } from '@/components/AINotificationWidget';
import Navigation from '@/components/Navigation';
import Head from 'next/head';

type WidgetStatus = 'idle' | 'connecting' | 'connected' | 'completed';

export default function WidgetDemo() {
  const [status, setStatus] = useState<WidgetStatus>('idle');
  const [showWidget, setShowWidget] = useState(true);

  const handleCall = () => {
    console.log('Call button clicked');
    setStatus('connecting');
    
    // Simulate connection process
    setTimeout(() => {
      setStatus('connected');
    }, 2000);
    
    // Simulate completion
    setTimeout(() => {
      setStatus('completed');
    }, 5000);
  };

  const handleClose = () => {
    console.log('Widget closed');
    setShowWidget(false);
  };

  const resetWidget = () => {
    setStatus('idle');
    setShowWidget(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Head>
        <title>AI Уведомления - MinskMir</title>
        <meta name="description" content="Демонстрация AI-уведомлений" />
      </Head>

      {/* Navigation Sidebar */}
      <Navigation />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Уведомления</h1>
              <p className="text-sm text-gray-500">Демонстрация виджета уведомлений</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Демонстрация AI-уведомлений
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl">
                Тестируйте различные состояния виджета AI-уведомлений. Виджет появится в правом нижнем углу экрана.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Управление состоянием</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStatus('idle')}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Ожидание
                    </button>
                    <button
                      onClick={() => setStatus('connecting')}
                      className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Подключение
                    </button>
                    <button
                      onClick={() => setStatus('connected')}
                      className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Подключено
                    </button>
                    <button
                      onClick={() => setStatus('completed')}
                      className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Завершено
                    </button>
                  </div>
                  
                  <button
                    onClick={resetWidget}
                    className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Сбросить виджет
                  </button>
                </div>
              </div>

              {/* Status Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Текущее состояние: {status}</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Описание состояний:</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Ожидание:</strong> Показывает кнопку "ПОЗВОНИТЬ"</p>
                      <p><strong>Подключение:</strong> Показывает спиннер с "СОЕДИНЕНИЕ"</p>
                      <p><strong>Подключено:</strong> Показывает кнопку "ПОЗВОНИТЬ" (как в ожидании)</p>
                      <p><strong>Завершено:</strong> Показывает кнопку "ЗАВЕРШИТЬ"</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Функции:</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>• Нажмите "ПОЗВОНИТЬ" для симуляции звонка</p>
                      <p>• Нажмите "X" для закрытия виджета</p>
                      <p>• Виджет автоматически переходит между состояниями</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showWidget && (
        <AINotificationWidget
          status={status}
          onCall={handleCall}
          onClose={handleClose}
        />
      )}
    </div>
  );
}