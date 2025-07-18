# 🚀 Деплой MinskMir Voice Widget на Vercel

## 📋 Быстрый деплой (5 минут)

### 1. Откройте Vercel
Перейдите на [vercel.com](https://vercel.com) и войдите в аккаунт

### 2. Импортируйте проект
- Нажмите **"Add New..."** → **"Project"**
- Выберите **"Import Git Repository"**
- Найдите репозиторий: `utlik-pro/MM-v3`
- Нажмите **"Import"**

### 3. Настройте переменные окружения
В разделе **Environment Variables** добавьте **ТОЧНО** как показано:

**⚠️ ВАЖНО: Добавляйте как обычные переменные, НЕ как секреты!**

| Name | Value |
|------|-------|
| `ELEVENLABS_API_KEY` | `sk_079e94528d5861306a40b2083311d6697bcc49e3933991d8` |
| `ELEVENLABS_AGENT_ID` | `agent_01jxkr0mstfk6ttayjsghjm7xc` |
| `ALLOWED_ORIGINS` | `https://minskmir.by,https://www.minskmir.by` |
| `RATE_LIMIT_REQUESTS` | `100` |
| `RATE_LIMIT_WINDOW` | `3600` |

**Пошагово:**
1. Нажмите **"Add another"** для каждой переменной
2. В поле **"Name"** введите название (например: `ELEVENLABS_API_KEY`)
3. В поле **"Value"** введите значение (например: `sk_079e94528d5861306a40b2083311d6697bcc49e3933991d8`)
4. **НЕ ВЫБИРАЙТЕ** опцию "Secret" - оставьте как обычную переменную
5. Повторите для всех 5 переменных

### 4. Деплой
- Нажмите **"Deploy"**
- Дождитесь завершения (1-2 минуты)
- Получите URL: `https://your-project-name.vercel.app`

## 🔧 Если возникла ошибка с секретами

Если увидели ошибку `"references Secret ... which does not exist"`:

1. **Удалите проект** из Vercel Dashboard
2. **Импортируйте заново** 
3. **Добавьте переменные как обычные** (не секреты)
4. **Деплойте снова**

## 🎯 URL вашего виджета
После деплоя ваш iframe виджет будет доступен по адресу:
```
https://your-project-name.vercel.app/widget
```

## 🔧 Интеграция на сайт MinskMir

### Код для встраивания:
```html
<iframe 
  src="https://your-project-name.vercel.app/widget"
  width="134"
  height="44"
  frameborder="0"
  allow="microphone"
  style="border-radius: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
</iframe>
```

### Плавающая кнопка:
```html
<div style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
  <iframe 
    src="https://your-project-name.vercel.app/widget"
    width="200"
    height="60"
    frameborder="0"
    allow="microphone"
    title="Голосовой помощник MinskMir"
    style="border-radius: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
  </iframe>
</div>
```

## ✅ Проверка работы

### 1. Откройте виджет
```
https://your-project-name.vercel.app/widget
```

### 2. Проверьте health endpoint
```
https://your-project-name.vercel.app/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "services": {
    "elevenlabs": "available"
  }
}
```

### 3. Тестируйте голосовую функцию
- Кликните кнопку "Позвонить"
- Разрешите доступ к микрофону
- Говорите с AI ассистентом

## 🔒 Безопасность

✅ **API ключи скрыты** - хранятся только на Vercel  
✅ **Rate limiting** - 100 запросов/час  
✅ **CORS защита** - только ваши домены  
✅ **Iframe безопасность** - настроена правильно  

## 📞 Поддержка

При проблемах проверьте:
1. **Логи Vercel** - Functions tab
2. **Health endpoint** - статус сервисов  
3. **Переменные окружения** - все ли добавлены **как обычные** (не секреты)
4. **CORS настройки** - ваш домен в ALLOWED_ORIGINS

---

## 🎉 Готово!

Ваш голосовой виджет готов к использованию!  
Пользователи будут думать, что это встроенная функция MinskMir! 🎯 