# Инструкция по интеграции голосового виджета

**Дата:** 12 января 2025
**Версия:** 2.0

---

## Быстрый старт (рекомендуется)

Добавьте **одну строку кода** перед закрывающим тегом `</body>`:

### Для minskworld.by (бирюзовый):
```html
<script src="https://mm-v3.vercel.app/widget-embed.js" data-theme="default"></script>
```

### Для bir.by (фиолетовый):
```html
<script src="https://mm-v3.vercel.app/widget-embed.js" data-theme="purple"></script>
```

**Готово!** Скрипт автоматически создаст виджет и будет управлять его размером.

---

## Доступные темы

| Сайт | Тема | Код |
|------|------|-----|
| minskworld.by | Бирюзовый | `data-theme="default"` |
| bir.by | Фиолетовый | `data-theme="purple"` |
| Другие | Синий | `data-theme="blue"` |
| Другие | Оранжевый | `data-theme="orange"` |
| Другие | Красный | `data-theme="red"` |

---

## Дополнительные параметры

```html
<script
  src="https://mm-v3.vercel.app/widget-embed.js"
  data-theme="purple"
  data-position="bottom-right"
  data-phone="7911">
</script>
```

| Параметр | Описание | Значения |
|----------|----------|----------|
| `data-theme` | Цветовая тема | `default`, `purple`, `blue`, `orange`, `red` |
| `data-position` | Позиция на экране | `bottom-right` (по умолчанию), `bottom-left` |
| `data-phone` | Телефон для fallback | Любой номер (по умолчанию `7911`) |

---

## Что делает скрипт

1. ✅ Автоматически создаёт контейнер и iframe
2. ✅ Позиционирует виджет в углу экрана
3. ✅ При сворачивании уменьшает размер до 70x70px
4. ✅ При разворачивании возвращает размер 340x450px
5. ✅ Не блокирует клики на странице
6. ✅ Сохраняет состояние между страницами (10 минут)

---

## Миграция со старого кода

### Старый код (удалить):
```html
<div id="minskworld-widget" style="position: fixed; bottom: 20px; right: 20px; ...">
  <iframe src="https://mm-v3.vercel.app/widget" width="340" height="340" ...></iframe>
</div>
<script>
  // старый код обработки виджета
</script>
```

### Новый код (добавить):
```html
<script src="https://mm-v3.vercel.app/widget-embed.js" data-theme="default"></script>
```

---

## Альтернативный вариант (ручная интеграция)

Если вам нужен полный контроль над виджетом, используйте ручную интеграцию:

### Шаг 1: HTML-разметка

```html
<div id="voice-widget-container" style="
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999999;
  width: 340px;
  height: 450px;
  transition: width 0.3s ease, height 0.3s ease;
">
  <iframe
    src="https://mm-v3.vercel.app/widget?theme=default"
    style="width: 100%; height: 100%; border: none;"
    allow="microphone"
    title="Voice Assistant">
  </iframe>
</div>
```

### Шаг 2: Скрипт для изменения размера

```html
<script src="https://mm-v3.vercel.app/widget-resize.js"></script>
```

Или добавьте код напрямую:

```html
<script>
(function() {
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || !data.type) return;

    var container = document.getElementById('voice-widget-container');
    if (!container) return;

    if (data.type === 'widget-collapsed') {
      container.style.width = (data.width || 70) + 'px';
      container.style.height = (data.height || 70) + 'px';
    } else if (data.type === 'widget-expanded') {
      container.style.width = (data.width || 340) + 'px';
      container.style.height = (data.height || 450) + 'px';
    }
  });
})();
</script>
```

---

## Тестирование

После интеграции проверьте:

1. ✅ Виджет отображается в правом нижнем углу
2. ✅ Нажатие X сворачивает виджет в кружок
3. ✅ Элементы страницы под виджетом кликабельны
4. ✅ Клик по кружку разворачивает виджет
5. ✅ Цвет соответствует выбранной теме
6. ✅ После перезагрузки страницы состояние сохраняется

---

## Отладка

### Проверить в консоли браузера (F12):

```javascript
// Должно быть сообщение при загрузке:
// [VoiceWidget] Embedded successfully with theme: default
```

### Симулировать сворачивание/разворачивание:

```javascript
// Свернуть
window.postMessage({ type: 'widget-collapsed', width: 70, height: 70 }, '*');

// Развернуть
window.postMessage({ type: 'widget-expanded', width: 340, height: 450 }, '*');
```

---

## FAQ

**Q: Виджет не появляется**
A: Проверьте, что скрипт добавлен перед `</body>` и нет ошибок в консоли.

**Q: Виджет блокирует клики на странице**
A: Убедитесь, что используете новый скрипт `widget-embed.js` версии от 12.01.2025.

**Q: Как изменить позицию виджета?**
A: Добавьте `data-position="bottom-left"` для левого нижнего угла.

**Q: Виджет не сохраняет состояние между страницами**
A: Проверьте, что localStorage не заблокирован в браузере.

---

## Контакты

По вопросам интеграции обращайтесь к команде разработки.

---

*Документация обновлена: 12 января 2025*
