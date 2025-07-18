# MinskMir Voice Agent - Требования для разработки

## Обзор

Этот документ содержит полные требования для разработки голосового агента недвижимости компании MinskMir. Агент должен консультировать клиентов по объектам недвижимости, записывать на прием и интегрироваться с CRM системой через голосовое взаимодействие на русском языке.

## Краткое описание приложения

**Название:** MinskMir Voice Agent  
**Тип:** Голосовой AI-агент для консультаций по недвижимости  
**Технологии:** Python, LiveKit, Google Gemini Real-time API, RAG система  
**Язык:** Русский  
**Голос:** Женский (Анна/AOEDE)  

## Основные требования

### Технологический стек:
- **Backend:** Python с LiveKit agents
- **Голосовые технологии:** LiveKit + Google Real-time API (Gemini 2.0 Flash)
- **RAG система:** LlamaIndex для работы с базой знаний недвижимости
- **CRM интеграция:** Webhook для передачи данных в кастомную CRM
- **Frontend:** Существующий iFrame виджет (не изменяется)
- **Деплойность:** GitHub + Dokploy (backend), Vercel (frontend)

### Основные функции:
1. **Голосовые консультации** по недвижимости MinskMir
2. **Автоматическое отключение** при молчании пользователя
3. **Запись на прием** с выбором времени и офиса
4. **Интеграция с CRM** через webhook
5. **Рефакторинг кода** - удаление лишних файлов

### Консультационные возможности:
- Цены на объекты недвижимости
- Детальные характеристики квартир и домов
- Информация о районах и кварталах
- Условия рассрочки и финансирование
- Инфраструктура (метро, школы, детские сады, магазины)
- Полная информация об объектах из базы данных

### Что НЕ нужно строить:
- Frontend виджет (уже готов)
- Новую CRM систему
- Поддержку других языков кроме русского
- Мобильные приложения

### Исследование аналогов:
Изучить существующие голосовые агенты недвижимости и best practices для LiveKit + Google Real-time API интеграции.

---

## Пример промпта для ChatGPT:

```markdown
I would like to create concise functional requirements for the following application:

The app is called MinskMir Voice Agent and is a real estate consultation voice agent using LiveKit and Google Real-time API.
Research existing voice agents for real estate to get a better understanding.

My Requirements:
- It should integrate with LiveKit agents and Google Gemini 2.0 Flash Real-time API for voice processing
- The agent should provide voice consultations in Russian language only
- Voice should be female (Anna/AOEDE)
- The agent should have auto-disconnect feature after 5 seconds of silence with 2-3 seconds warning
- The agent should provide detailed real estate consultations including:
  - Property prices and characteristics
  - District information and infrastructure
  - Metro accessibility, schools, kindergartens
  - Financing options and installment plans
  - Full property database information for MinskMir company
- The agent should be able to schedule appointments with:
  - Time selection
  - Office selection
  - Contact information collection
- There should be CRM integration via webhook sending:
  - Client name
  - Phone number  
  - Appointment time
  - Property interest information (budget, type, etc.)
  - 4-5 fields total
- The system should include RAG (Retrieval Augmented Generation) using LlamaIndex
- Code refactoring is needed to remove unnecessary test files and clean up codebase
- There is existing frontend iFrame widget that should be connected to new backend
- Current technology stack includes:
  - Python backend with LiveKit agents
  - Multiple LiveKit plugins (OpenAI, Google, Deepgram, Cartesia, ElevenLabs, Silero)
  - LlamaIndex for RAG system
  - Various AI/ML libraries (mem0ai, langchain_community, openai)
- Deployment will be on GitHub (code), DigitalOcean (backend), Vercel (frontend)
- Full documentation should be created after testing and verification

Output as markdown code.
```

## Пример готового PRD промпта:

```markdown
You are an expert technical product manager specializing in AI voice agents and real estate technology. Your task is to generate a detailed and well-structured PRD for a voice-based real estate consultation agent based on the following instructions:

<prd_instructions>
{{REQUIREMENTS_FROM_ABOVE}}
</prd_instructions>

Follow these steps to create the PRD:

1. Begin with a brief overview explaining the MinskMir Voice Agent project and the purpose of this PRD document.

2. Use sentence case for all headings except for the title of the document, which should be in title case.

3. Organize your PRD into the following sections:
   a. Introduction
   b. Product overview
   c. Goals and objectives  
   d. Target audience
   e. Features and requirements
   f. User stories and acceptance criteria
   g. Technical requirements / Stack
   h. Voice interaction design
   i. CRM integration specifications
   j. Deployment and infrastructure

4. For each section, provide detailed and relevant information based on the PRD instructions. Ensure that you:
   - Use clear and concise language
   - Provide specific details and metrics where required
   - Maintain consistency throughout the document
   - Address all points mentioned in each section
   - Focus on voice interaction patterns and real estate domain

5. When creating user stories and acceptance criteria:
   - List ALL necessary user stories for voice agent interactions
   - Include scenarios for property consultations, appointment booking, and error handling
   - Assign unique requirement IDs (e.g., VA-101 for Voice Agent requirements)
   - Include user stories for Russian language processing and female voice requirements
   - Include user stories for auto-disconnect functionality
   - Include user stories for CRM webhook integration
   - Include user stories for RAG system integration with property database
   - Ensure each user story covers voice interaction edge cases
   - Make sure each user story is testable with voice input/output

6. Format your PRD professionally:
   - Use consistent styles
   - Include numbered sections and subsections  
   - Use bullet points and tables where appropriate to improve readability
   - Include voice interaction flow diagrams in text format
   - Ensure proper spacing and alignment throughout the document

7. Review your PRD to ensure all aspects of the voice agent project are covered comprehensively, including LiveKit integration, Google API usage, Russian language support, and real estate domain expertise.

Present your final PRD within <PRD> tags. Begin with the title of the document in title case, followed by each section with its corresponding content. Use appropriate subheadings within each section as needed.

Remember to tailor the content specifically to the MinskMir real estate voice agent project, providing detailed and relevant information for each section based on the given context and technical requirements.
```

## Результат PRD будет включать:

### Основные разделы:
1. **Введение** - описание проекта голосового агента MinskMir
2. **Обзор продукта** - функциональность и возможности агента
3. **Цели и задачи** - бизнес-цели и технические задачи
4. **Целевая аудитория** - клиенты недвижимости и сотрудники MinskMir
5. **Функции и требования** - детальное описание всех возможностей
6. **Пользовательские истории** - сценарии взаимодействия с голосовым агентом
7. **Технические требования** - LiveKit, Google API, Python, RAG система
8. **Дизайн голосового взаимодействия** - сценарии диалогов и переходов
9. **Спецификации CRM интеграции** - webhook и передача данных
10. **Деплойность и инфраструктура** - Dokploy, GitHub, Vercel

### Особое внимание к:
- **Голосовому взаимодействию** на русском языке
- **Автоотключению** с предупреждениями
- **Интеграции с базой недвижимости** через RAG
- **CRM webhook** для записи на прием
- **Рефакторингу кода** и очистке от лишних файлов

Использовать этот шаблон для создания полного PRD документа через ChatGPT/Claude, заменив `{{REQUIREMENTS_FROM_ABOVE}}` на детальные требования из первого промпта. 