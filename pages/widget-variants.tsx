import React from 'react';
import Head from 'next/head';
import CallButton from '../src/components/CallButton';

const WidgetVariants: React.FC = () => {
  const themes = ['default', 'blue', 'purple', 'orange', 'red'];
  
  return (
    <>
      <Head>
        <title>Варианты дизайна виджета - MinskMir Voice Widget</title>
        <meta name="description" content="Демонстрация различных вариантов дизайна виджета" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Варианты дизайна виджета
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {themes.map((theme) => (
              <div key={theme} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                  Тема: {theme}
                </h2>
                
                <div className="mb-4">
                  <CallButton theme={theme as any} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700">Код для вставки:</h3>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    {`https://mm-v3.vercel.app/widget?theme=${theme}`}
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium text-gray-700 mb-2">HTML код:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<iframe 
  src="https://mm-v3.vercel.app/widget?theme=${theme}" 
  width="100%" 
  height="200" 
  frameborder="0"
  scrolling="no"
></iframe>`}
                  </pre>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Как использовать разные темы
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Доступные темы:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>default</strong> - Зеленая тема (по умолчанию)</li>
                  <li><strong>blue</strong> - Синяя тема</li>
                  <li><strong>purple</strong> - Фиолетовая тема</li>
                  <li><strong>orange</strong> - Оранжевая тема</li>
                  <li><strong>red</strong> - Красная тема</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Использование:</h3>
                <p className="text-gray-700">
                  Добавьте параметр <code className="bg-gray-100 px-1 rounded">?theme=название_темы</code> к URL виджета.
                  Например: <code className="bg-gray-100 px-1 rounded">https://mm-v3.vercel.app/widget?theme=blue</code>
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">JavaScript код для динамической загрузки:</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Создание iframe с выбранной темой
function createWidget(theme = 'default') {
  const iframe = document.createElement('iframe');
  iframe.src = \`https://mm-v3.vercel.app/widget?theme=\${theme}\`;
  iframe.width = '100%';
  iframe.height = '200';
  iframe.frameBorder = '0';
  iframe.scrolling = 'no';
  
  // Добавляем в контейнер
  document.getElementById('widget-container').appendChild(iframe);
}

// Пример использования
createWidget('blue'); // Синяя тема
createWidget('purple'); // Фиолетовая тема`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WidgetVariants; 