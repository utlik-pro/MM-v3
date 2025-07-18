# Интеграция ElevenLabs Voice Widget на сайт MinskMir

## 🎯 Обзор решения

Мы создали полностью кастомный iframe виджет, который:

1. **🔒 Скрывает ElevenLabs** - пользователи видят только брендинг MinskMir
2. **🛡️ Безопасен** - API ключи хранятся на сервере, не передаются клиенту
3. **⚡ Готов к продакшену** - с rate limiting, CORS, error handling
4. **📱 Отзывчивый** - работает на всех устройствах
5. **🎨 Кастомизированный** - выглядит как кнопка "Позвонить" из вашего дизайна

## 🚀 Быстрый деплой на Vercel

### 1. Подготовка репозитория

```bash
# Создайте новый репозиторий на GitHub из этого кода
git init
git add .
git commit -m "Initial commit: ElevenLabs proxy iframe"
git remote add origin https://github.com/YOUR_USERNAME/minskmir-voice-widget.git
git push -u origin main
```

### 2. Деплой на Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. Подключите ваш GitHub аккаунт
3. Нажмите "Import Project"
4. Выберите репозиторий `minskmir-voice-widget`
5. Настройте переменные окружения:

```env
ELEVENLABS_API_KEY=sk_079e94528d5861306a40b2083311d6697bcc49e3933991d8
ELEVENLABS_AGENT_ID=agent_01jxkr0mstfk6ttayjsghjm7xc
ALLOWED_ORIGINS=https://minskmir.by,https://www.minskmir.by
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

6. Нажмите "Deploy"

### 3. Получение URL виджета

После успешного деплоя ваш виджет будет доступен по адресу:
```
https://your-project-name.vercel.app/widget
```

## 📋 Интеграция на сайт MinskMir

### Простая интеграция

Добавьте этот код на любую страницу вашего сайта:

```html
<iframe 
  src="https://your-project-name.vercel.app/widget"
  width="134"
  height="44"
  frameborder="0"
  allow="microphone"
  title="MinskMir Voice Assistant"
  style="border-radius: 30px;">
</iframe>
```

### Адаптивная интеграция

```html
<div style="display: flex; justify-content: center; margin: 20px 0;">
  <iframe 
    src="https://your-project-name.vercel.app/widget"
    width="100%"
    height="80"
    max-width="300px"
    frameborder="0"
    allow="microphone"
    title="Голосовой консультант MinskMir"
    style="border-radius: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  </iframe>
</div>
```

### Фиксированная позиция (плавающая кнопка)

```html
<div style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
  <iframe 
    src="https://your-project-name.vercel.app/widget"
    width="200"
    height="60"
    frameborder="0"
    allow="microphone"
    title="Голосовой помощник"
    style="border-radius: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
  </iframe>
</div>
```

## ⚙️ Настройка и конфигурация

### Переменные окружения на Vercel

В панели управления Vercel добавьте следующие переменные:

| Переменная | Значение | Описание |
|------------|----------|----------|
| `ELEVENLABS_API_KEY` | `sk_079e94528d5861306a40b2083311d6697bcc49e3933991d8` | Ваш API ключ ElevenLabs |
| `ELEVENLABS_AGENT_ID` | `agent_01jxkr0mstfk6ttayjsghjm7xc` | ID вашего агента |
| `ALLOWED_ORIGINS` | `https://minskmir.by,https://www.minskmir.by` | Разрешенные домены |
| `RATE_LIMIT_REQUESTS` | `100` | Лимит запросов в час |
| `RATE_LIMIT_WINDOW` | `3600` | Окно лимитирования (сек) |

### Мониторинг и здоровье

Проверьте статус виджета:
```
GET https://your-project-name.vercel.app/health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 12345,
  "environment": "production",
  "services": {
    "elevenlabs": "available"
  }
}
```

## 🔒 Безопасность

### Rate Limiting

- **Лимит**: 100 запросов в час на IP
- **Окно**: 1 час (3600 секунд)
- **Защита**: Автоматическая блокировка при превышении

### CORS политика

- **Разрешены**: Только домены из `ALLOWED_ORIGINS`
- **Методы**: GET, POST, OPTIONS
- **Заголовки**: Content-Type, Authorization

### Iframe безопасность

- **X-Frame-Options**: `ALLOWALL` для `/widget`
- **CSP**: `frame-ancestors *` для максимальной совместимости
- **XSS Protection**: Включена

## 🎨 Кастомизация

### Размеры виджета

```html
<!-- Маленькая кнопка -->
<iframe src="..." width="180" height="50"></iframe>

<!-- Средняя кнопка -->
<iframe src="..." width="134" height="44"></iframe>

<!-- Большая кнопка -->
<iframe src="..." width="280" height="80"></iframe>
```

### Стилизация контейнера

```css
.voice-widget-container {
  border-radius: 40px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.voice-widget-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
}
```

## 📊 Аналитика и мониторинг

### Логи Vercel

Просматривайте логи в реальном времени:
```bash
vercel logs your-project-name
```

### Метрики использования

- **API вызовы**: Отслеживаются автоматически
- **Rate limiting**: Логируется в консоль
- **Ошибки**: Записываются с полным контекстом

## 🐛 Решение проблем

### Виджет не загружается

1. **Проверьте CORS**: Убедитесь, что ваш домен в `ALLOWED_ORIGINS`
2. **Проверьте API ключ**: Убедитесь, что `ELEVENLABS_API_KEY` корректен
3. **Проверьте health endpoint**: `GET /health`

### Нет звука

1. **Микрофон**: Убедитесь, что разрешение на микрофон дано
2. **HTTPS**: Виджет работает только по HTTPS
3. **Браузер**: Проверьте поддержку WebRTC/WebSocket

### Rate limiting

```bash
# Проверить текущие лимиты
curl -I https://your-project-name.vercel.app/api/elevenlabs/signed-url
```

Ответ покажет заголовки:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642684800
```

## 📞 Поддержка

При возникновении проблем:

1. **Проверьте логи Vercel**
2. **Используйте health endpoint**
3. **Проверьте переменные окружения**
4. **Убедитесь в правильности iframe интеграции**

## 🔄 Обновления

Для обновления виджета:

1. Внесите изменения в код
2. Сделайте `git push`
3. Vercel автоматически разверет новую версию
4. Проверьте health endpoint после деплоя

---

**Готово!** 🎉 Ваш ElevenLabs voice widget полностью интегрирован и готов к использованию! 