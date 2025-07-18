# 🎤 MinskMir ElevenLabs Proxy Iframe

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)
![ElevenLabs](https://img.shields.io/badge/AI-ElevenLabs-purple)

Полностью кастомный iframe виджет для интеграции голосового ассистента ElevenLabs на сайт MinskMir. Решение полностью **скрывает использование ElevenLabs** от конечных пользователей, предоставляя брендированный интерфейс MinskMir.

## ✨ Особенности

- 🔒 **Полное сокрытие ElevenLabs** - пользователи видят только брендинг MinskMir
- 🛡️ **Максимальная безопасность** - API ключи хранятся на сервере, не передаются клиенту
- ⚡ **Готовность к продакшену** - rate limiting, CORS, comprehensive error handling
- 📱 **Отзывчивый дизайн** - идеально работает на всех устройствах
- 🎨 **Кастомный UI** - выглядит как родная кнопка "Позвонить" вашего сайта
- 🚀 **Оптимизирован для Vercel** - один клик для деплоя

## 🎯 Что получается

| До (оригинальный ElevenLabs) | После (наш прокси) |
|---|---|
| `<elevenlabs-convai agent-id="..."></elevenlabs-convai>` | `<iframe src="your-domain.vercel.app/widget">` |
| Видны ElevenLabs логотипы и брендинг | Только брендинг MinskMir |
| API ключи в клиентском коде | API ключи безопасно на сервере |
| Зависимость от внешних CDN | Полный контроль над кодом |

## 🚀 Быстрый старт

### 1. Деплой на Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/minskmir-voice-widget)

### 2. Настройка переменных окружения

В Vercel Dashboard добавьте:

```env
ELEVENLABS_API_KEY=sk_079e94528d5861306a40b2083311d6697bcc49e3933991d8
ELEVENLABS_AGENT_ID=agent_01jxkr0mstfk6ttayjsghjm7xc
ALLOWED_ORIGINS=https://minskmir.by,https://www.minskmir.by
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

### 3. Интеграция на сайт

```html
<!-- Простая интеграция -->
<iframe 
  src="https://your-project.vercel.app/widget"
  width="220"
  height="60"
  frameborder="0"
  allow="microphone"
  style="border-radius: 30px;">
</iframe>
```

## 🛠 Технологический стек

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS с кастомными стилями MinskMir
- **API Integration**: ElevenLabs Conversational AI SDK
- **Deployment**: Vercel (оптимизировано)
- **Security**: Rate limiting, CORS, secure API proxy

## 📁 Структура проекта

```
├── pages/
│   ├── api/elevenlabs/          # API прокси endpoints
│   │   ├── signed-url.ts        # Получение signed URL
│   │   └── conversation-token.ts # Получение conversation token
│   ├── widget.tsx               # Iframe виджет
│   ├── index.tsx                # Демо страница
│   └── _app.tsx                 # Next.js конфигурация
├── src/
│   ├── components/
│   │   └── CallButton.tsx       # Основной компонент кнопки
│   └── types/
│       └── elevenlabs.ts        # TypeScript типы
├── styles/
│   └── globals.css              # Глобальные стили
├── .env.example                 # Пример переменных окружения
├── vercel.json                  # Конфигурация Vercel
└── INTEGRATION.md               # Подробные инструкции по интеграции
```

## 🔧 Локальная разработка

```bash
# Клонирование репозитория
git clone https://github.com/your-username/minskmir-voice-widget.git
cd minskmir-voice-widget

# Установка зависимостей
npm install

# Копирование переменных окружения
cp .env.example .env.local

# Заполните .env.local вашими API ключами

# Запуск в режиме разработки
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) для просмотра демо.
Виджет доступен по адресу [http://localhost:3000/widget](http://localhost:3000/widget).

## 🔒 Безопасность

### Rate Limiting
- **100 запросов в час** на IP адрес
- Автоматическая блокировка при превышении лимита
- Настраиваемые параметры через переменные окружения

### CORS Protection
- Строгая проверка `Origin` заголовков
- Разрешены только домены из `ALLOWED_ORIGINS`
- Защита от cross-site attacks

### API Security
- API ключи ElevenLabs никогда не передаются клиенту
- Все запросы проходят через серверный прокси
- Валидация и санитизация всех входящих данных

## 📊 Мониторинг

### Health Check Endpoint

```bash
curl https://your-project.vercel.app/health
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

### Vercel Analytics

Включите Vercel Analytics для мониторинга:
- Производительности
- Ошибок
- Использования API
- Geographic распределения пользователей

## 🎨 Кастомизация

### Размеры виджета

```html
<!-- Маленький -->
<iframe src="..." width="180" height="50"></iframe>

<!-- Средний (рекомендуемый) -->
<iframe src="..." width="220" height="60"></iframe>

<!-- Большой -->
<iframe src="..." width="280" height="80"></iframe>
```

### Позиционирование

```html
<!-- Фиксированная позиция (плавающая кнопка) -->
<div style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
  <iframe src="https://your-project.vercel.app/widget" 
          width="200" height="60" frameborder="0" allow="microphone"
          style="border-radius: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
  </iframe>
</div>
```

## 🐛 Troubleshooting

### Виджет не загружается
1. Проверьте CORS настройки в `ALLOWED_ORIGINS`
2. Убедитесь что API ключ ElevenLabs корректен
3. Проверьте health endpoint

### Нет доступа к микрофону
1. Сайт должен загружаться по HTTPS
2. Убедитесь что `allow="microphone"` добавлен в iframe
3. Проверьте настройки браузера

### Rate Limiting ошибки
```bash
# Проверить текущие лимиты
curl -I https://your-project.vercel.app/api/elevenlabs/signed-url
```

## 📝 API Reference

### GET /health
Проверка состояния сервиса

### POST /api/elevenlabs/signed-url
Получение signed URL для ElevenLabs conversation

### POST /api/elevenlabs/conversation-token
Получение conversation token для WebRTC подключения

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Коммит изменений (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📜 Лицензия

Этот проект лицензирован под MIT License - см. [LICENSE](LICENSE) файл для деталей.

## 🆘 Поддержка

- 📖 [Подробные инструкции по интеграции](INTEGRATION.md)
- 🐛 [Создать issue](https://github.com/your-username/minskmir-voice-widget/issues)
- 💬 [Discussions](https://github.com/your-username/minskmir-voice-widget/discussions)
- 📧 Email: support@minskmir.by

## 🙏 Благодарности

- [ElevenLabs](https://elevenlabs.io) за потрясающий Conversational AI API
- [Vercel](https://vercel.com) за отличную платформу деплоя
- [Next.js](https://nextjs.org) команду за фреймворк

---

Сделано с ❤️ для **MinskMir** | [minskmir.by](https://minskmir.by)

**Результат**: Пользователи получают естественное голосовое взаимодействие, думая что это родная функция MinskMir, в то время как вы получаете всю мощь ElevenLabs AI! 🎉 