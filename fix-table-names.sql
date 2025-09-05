-- Исправление названий колонок в таблице leads
-- Выполните этот скрипт в Supabase SQL Editor

-- Удаляем старую таблицу leads
DROP TABLE IF EXISTS "leads" CASCADE;

-- Создаем таблицу leads с правильными названиями колонок
CREATE TABLE IF NOT EXISTS "leads" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "conversationId" TEXT,
    "sourceConversationId" TEXT,
    "contact_info" TEXT NOT NULL, -- Исправлено: contactInfo -> contact_info
    "source" TEXT NOT NULL DEFAULT 'voice_widget',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "score" INTEGER,
    "conversation_summary" TEXT, -- Исправлено: conversationSummary -> conversation_summary
    "extracted_entities" JSONB, -- Исправлено: extractedEntities -> extracted_entities
    "lead_quality_score" INTEGER, -- Исправлено: leadQualityScore -> lead_quality_score
    "notes" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL, -- Исправлено: createdAt -> created_at
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL, -- Исправлено: updatedAt -> updated_at
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- Добавляем внешние ключи
ALTER TABLE "leads" ADD CONSTRAINT "leads_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_sourceConversationId_fkey" FOREIGN KEY ("sourceConversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Вставляем тестовые лиды с правильными названиями колонок
INSERT INTO "leads" ("id", "clientId", "agentId", "contact_info", "source", "status", "score", "notes") VALUES
('lead_1', 'default-client', 'agent_1', '{"name": "Иван Петров", "phone": "+375 29 123-45-67", "email": "ivan.petrov@example.com"}', 'voice_widget', 'NEW', 85, 'Интересуется услугами, просил перезвонить'),
('lead_2', 'default-client', 'agent_1', '{"name": "Мария Сидорова", "phone": "+375 33 987-65-43", "email": "maria.sidorova@example.com"}', 'voice_widget', 'CONTACTED', 92, 'Высокий интерес, назначена встреча'),
('lead_3', 'default-client', 'agent_1', '{"name": "Алексей Михайлов", "phone": "+375 25 555-77-88", "email": "alex.mikhailov@gmail.com"}', 'voice_widget', 'QUALIFIED', 95, 'Готов к покупке, обсуждаем детали'),
('lead_4', 'default-client', 'agent_1', '{"name": "Елена Козлова", "phone": "+375 44 111-22-33"}', 'voice_widget', 'NEW', 70, 'Первичный контакт, требует уточнения потребностей'),
('lead_5', 'default-client', 'agent_1', '{"name": "Дмитрий Волков", "phone": "+375 29 999-88-77", "email": "dmitry.volkov@company.by"}', 'voice_widget', 'CONVERTED', 100, 'Успешная конверсия! Клиент подписал договор')
ON CONFLICT ("id") DO NOTHING;

-- Проверяем созданные данные
SELECT 'leads' as table_name, COUNT(*) as count FROM "leads"; 