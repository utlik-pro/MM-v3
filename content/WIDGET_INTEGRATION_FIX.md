# Инструкция по исправлению виджета голосового помощника

**Дата:** 12 января 2025
**Проблема:** При сворачивании виджета большая область экрана становится некликабельной
**Решение:** Добавить скрипт для автоматического изменения размера контейнера

---

## Проблема

Когда пользователь закрывает виджет, он сворачивается в маленький кружок (70x70px). Однако контейнер `<div>` на вашем сайте остаётся большим (340x340px) и блокирует клики на элементы страницы под ним.

---

## Решение

Добавить JavaScript-код, который слушает сообщения от виджета и автоматически изменяет размер контейнера.

---

# Инструкция для minskworld.by

## Шаг 1: Найти контейнер виджета

На вашем сайте виджет находится в элементе:
```html
<div id="minskworld-widget">
  <iframe src="..."></iframe>
</div>
```

## Шаг 2: Добавить скрипт

Добавьте следующий код **перед закрывающим тегом `</body>`**:

```html
<!-- Скрипт автоматического изменения размера виджета -->
<script>
(function() {
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || !data.type) return;

    // Найти контейнер виджета
    var container = document.getElementById('minskworld-widget');
    if (!container) return;

    // Найти iframe внутри
    var iframe = container.querySelector('iframe');

    if (data.type === 'widget-collapsed') {
      // Виджет свёрнут - уменьшить размер
      container.style.width = '70px';
      container.style.height = '70px';
      if (iframe) {
        iframe.style.width = '70px';
        iframe.style.height = '70px';
      }
    } else if (data.type === 'widget-expanded') {
      // Виджет развёрнут - вернуть полный размер
      container.style.width = '340px';
      container.style.height = '450px';
      if (iframe) {
        iframe.style.width = '340px';
        iframe.style.height = '450px';
      }
    }
  });
})();
</script>
```

## Шаг 3: Проверить CSS контейнера

Убедитесь, что контейнер имеет правильные стили:

```css
#minskworld-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  width: 340px;
  height: 450px;
  /* ВАЖНО: добавить transition для плавной анимации */
  transition: width 0.3s ease, height 0.3s ease;
}

#minskworld-widget iframe {
  width: 100%;
  height: 100%;
  border: none;
  transition: width 0.3s ease, height 0.3s ease;
}
```

---

# Инструкция для bir.by

## Шаг 1: Найти контейнер виджета

На вашем сайте виджет находится в элементе (уточните ID):
```html
<div id="bir-widget">
  <iframe src="..."></iframe>
</div>
```

## Шаг 2: Добавить скрипт

Добавьте следующий код **перед закрывающим тегом `</body>`**:

```html
<!-- Скрипт автоматического изменения размера виджета -->
<script>
(function() {
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || !data.type) return;

    // Найти контейнер виджета (измените ID если отличается)
    var container = document.getElementById('bir-widget');
    if (!container) return;

    // Найти iframe внутри
    var iframe = container.querySelector('iframe');

    if (data.type === 'widget-collapsed') {
      // Виджет свёрнут - уменьшить размер
      container.style.width = '70px';
      container.style.height = '70px';
      if (iframe) {
        iframe.style.width = '70px';
        iframe.style.height = '70px';
      }
    } else if (data.type === 'widget-expanded') {
      // Виджет развёрнут - вернуть полный размер
      container.style.width = '340px';
      container.style.height = '450px';
      if (iframe) {
        iframe.style.width = '340px';
        iframe.style.height = '450px';
      }
    }
  });
})();
</script>
```

## Шаг 3: Проверить CSS контейнера

```css
#bir-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  width: 340px;
  height: 450px;
  transition: width 0.3s ease, height 0.3s ease;
}

#bir-widget iframe {
  width: 100%;
  height: 100%;
  border: none;
  transition: width 0.3s ease, height 0.3s ease;
}
```

---

# Тестирование

После добавления кода проверьте:

1. ✅ Открыть страницу с виджетом
2. ✅ Виджет показывается развёрнутым (полный размер)
3. ✅ Нажать X на виджете → виджет сворачивается в кружок
4. ✅ Контейнер уменьшается до 70x70px
5. ✅ Элементы страницы под виджетом кликабельны
6. ✅ Нажать на кружок → виджет разворачивается
7. ✅ Контейнер возвращается к 340x450px
8. ✅ Перезагрузить страницу → состояние сохраняется

---

# Отладка

## Проверить что скрипт работает

Откройте консоль браузера (F12 → Console) и выполните:

```javascript
// Симулировать сворачивание
window.postMessage({ type: 'widget-collapsed', width: 70, height: 70 }, '*');

// Симулировать разворачивание
window.postMessage({ type: 'widget-expanded', width: 340, height: 450 }, '*');
```

## Проверить что сообщения приходят

Добавьте временно в скрипт:

```javascript
window.addEventListener('message', function(event) {
  console.log('Widget message:', event.data);
  // ... остальной код
});
```

---

# Альтернативный вариант: Подключить готовый скрипт

Вместо копирования кода можно подключить готовый скрипт:

```html
<script src="https://mm-v3.vercel.app/widget-resize.js"></script>
```

---

# Контакты

По вопросам интеграции обращайтесь к команде разработки.
