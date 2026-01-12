/**
 * MinskMir/BIR Voice Widget - Resize Script
 * Добавьте этот скрипт на вашу страницу для автоматического
 * изменения размера виджета при сворачивании/разворачивании
 *
 * Использование:
 * <script src="https://[ваш-домен]/widget-resize.js"></script>
 */

(function() {
  'use strict';

  // Конфигурация - ID контейнера виджета на вашем сайте
  // Измените на ваш ID если отличается
  var WIDGET_CONTAINER_IDS = [
    'minskworld-widget',
    'minskmir-widget',
    'bir-widget',
    'voice-widget'
  ];

  // Размеры виджета
  var COLLAPSED_SIZE = { width: 70, height: 70 };
  var EXPANDED_SIZE = { width: 340, height: 450 };

  // Найти контейнер виджета
  function findWidgetContainer() {
    for (var i = 0; i < WIDGET_CONTAINER_IDS.length; i++) {
      var container = document.getElementById(WIDGET_CONTAINER_IDS[i]);
      if (container) return container;
    }
    // Попробовать найти по атрибуту data-widget
    return document.querySelector('[data-widget="voice"]');
  }

  // Изменить размер контейнера
  function resizeWidget(width, height) {
    var container = findWidgetContainer();
    if (!container) {
      console.warn('[VoiceWidget] Container not found');
      return;
    }

    container.style.width = width + 'px';
    container.style.height = height + 'px';

    // Также изменить размер iframe внутри
    var iframe = container.querySelector('iframe');
    if (iframe) {
      iframe.style.width = width + 'px';
      iframe.style.height = height + 'px';
    }

    console.log('[VoiceWidget] Resized to', width, 'x', height);
  }

  // Слушать сообщения от виджета
  function handleMessage(event) {
    var data = event.data;

    if (!data || !data.type) return;

    switch (data.type) {
      case 'widget-collapsed':
        resizeWidget(
          data.width || COLLAPSED_SIZE.width,
          data.height || COLLAPSED_SIZE.height
        );
        break;

      case 'widget-expanded':
        resizeWidget(
          data.width || EXPANDED_SIZE.width,
          data.height || EXPANDED_SIZE.height
        );
        break;

      case 'widget-closed':
        // Устаревшее событие - теперь виджет сворачивается вместо закрытия
        resizeWidget(COLLAPSED_SIZE.width, COLLAPSED_SIZE.height);
        break;
    }
  }

  // Инициализация
  function init() {
    window.addEventListener('message', handleMessage, false);
    console.log('[VoiceWidget] Resize script loaded');
  }

  // Запуск при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
