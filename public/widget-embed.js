/**
 * MinskMir/BIR Voice Widget - Auto Embed Script
 *
 * Этот скрипт автоматически создаёт виджет и управляет его размером.
 * Клиенту нужно добавить только одну строку кода!
 *
 * Использование:
 * <script src="https://mm-v3.vercel.app/widget-embed.js" data-theme="default"></script>
 *
 * Параметры (data-атрибуты):
 * - data-theme: "default" | "purple" | "blue" | "orange" | "red"
 * - data-position: "bottom-right" (по умолчанию) | "bottom-left"
 * - data-phone: номер телефона для fallback (по умолчанию "7911")
 */

(function() {
  'use strict';

  // Получить параметры из script тега
  var currentScript = document.currentScript;
  var theme = currentScript?.getAttribute('data-theme') || 'default';
  var position = currentScript?.getAttribute('data-position') || 'bottom-right';

  // Номер телефона по умолчанию зависит от темы
  // purple (minskworld.by) = 7675, default (bir.by) = 7911
  var defaultPhone = (theme === 'purple') ? '7675' : '7911';
  var phone = currentScript?.getAttribute('data-phone') || defaultPhone;

  // Базовый URL виджета
  var WIDGET_BASE_URL = 'https://mm-v3.vercel.app/widget';

  // Размеры
  var EXPANDED_SIZE = { width: 340, height: 450 };
  var COLLAPSED_SIZE = { width: 70, height: 70 };

  // Создать контейнер и iframe
  function createWidget() {
    // Создать контейнер
    var container = document.createElement('div');
    container.id = 'voice-widget-container';
    container.style.cssText = [
      'position: fixed',
      'bottom: 20px',
      position === 'bottom-left' ? 'left: 20px' : 'right: 20px',
      'z-index: 999999',
      'width: ' + EXPANDED_SIZE.width + 'px',
      'height: ' + EXPANDED_SIZE.height + 'px',
      'transition: width 0.3s ease, height 0.3s ease',
      'pointer-events: none'
    ].join(';');

    // Создать iframe
    var iframe = document.createElement('iframe');
    iframe.src = WIDGET_BASE_URL + '?theme=' + theme + '&phone=' + encodeURIComponent(phone);
    iframe.style.cssText = [
      'width: 100%',
      'height: 100%',
      'border: none',
      'background: transparent',
      'pointer-events: auto'
    ].join(';');
    iframe.allow = 'microphone';
    iframe.title = 'Voice Assistant';

    container.appendChild(iframe);
    document.body.appendChild(container);

    return { container: container, iframe: iframe };
  }

  // Изменить размер виджета
  function resizeWidget(container, width, height) {
    container.style.width = width + 'px';
    container.style.height = height + 'px';
  }

  // Слушать сообщения от виджета
  function setupMessageListener(container) {
    window.addEventListener('message', function(event) {
      var data = event.data;
      if (!data || !data.type) return;

      switch (data.type) {
        case 'widget-collapsed':
          resizeWidget(
            container,
            data.width || COLLAPSED_SIZE.width,
            data.height || COLLAPSED_SIZE.height
          );
          break;

        case 'widget-expanded':
          resizeWidget(
            container,
            data.width || EXPANDED_SIZE.width,
            data.height || EXPANDED_SIZE.height
          );
          break;
      }
    });
  }

  // Проверка статуса виджета и создание
  function checkStatusAndInit() {
    var domain = window.location.hostname;
    var statusUrl = 'https://mm-v3.vercel.app/api/widget/status?domain=' + encodeURIComponent(domain);

    fetch(statusUrl)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        // Проверяем enabled статус
        if (data.enabled === false) {
          console.log('[VoiceWidget] Widget disabled for domain:', domain);
          return;
        }

        // Применяем конфиг с сервера если есть
        if (data.config) {
          if (data.config.theme) theme = data.config.theme;
          if (data.config.phone) phone = data.config.phone;
        }

        // Создаём виджет
        var widget = createWidget();
        setupMessageListener(widget.container);
        console.log('[VoiceWidget] Embedded successfully with theme:', theme, 'for domain:', domain);
      })
      .catch(function(error) {
        // При ошибке показываем виджет (fail-open)
        console.log('[VoiceWidget] Status check failed, showing widget anyway:', error);
        var widget = createWidget();
        setupMessageListener(widget.container);
      });
  }

  // Запуск при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkStatusAndInit);
  } else {
    checkStatusAndInit();
  }
})();
