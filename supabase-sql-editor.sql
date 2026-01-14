-- Создание таблиц для MinskMir Voice Agency
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Создание таблицы clients
CREATE TABLE IF NOT EXISTS "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "settings" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- 2. Создание таблицы agents
CREATE TABLE IF NOT EXISTS "agents" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" TEXT,
    "currentPromptId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "agents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agents_clientId_externalId_key" UNIQUE ("clientId", "externalId")
);

-- 3. Создание таблицы conversations
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endedAt" TIMESTAMP WITH TIME ZONE,
    "duration" INTEGER,
    "transcript" TEXT,
    "summary" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- 4. Создание таблицы leads
CREATE TABLE IF NOT EXISTS "leads" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "conversationId" TEXT,
    "sourceConversationId" TEXT,
    "contactInfo" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'voice_widget',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "score" INTEGER,
    "conversationSummary" TEXT,
    "extractedEntities" JSONB,
    "leadQualityScore" INTEGER,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- 5. Добавление внешних ключей
ALTER TABLE "agents" ADD CONSTRAINT "agents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_sourceConversationId_fkey" FOREIGN KEY ("sourceConversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Вставка тестовых данных
INSERT INTO "clients" ("id", "name", "domain", "settings", "isActive") VALUES
('default-client', 'MinskMir Voice Agency', 'minskmir.by', '{"timezone": "Europe/Minsk", "language": "ru"}', true)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "agents" ("id", "clientId", "externalId", "name", "description", "isActive") VALUES
('agent_1', 'default-client', 'agent_8901k4s5hkbkf7gsf1tk5r0a4g8t', 'MinskMir Voice Assistant', 'Голосовой ассистент для захвата лидов', true)
ON CONFLICT ("clientId", "externalId") DO NOTHING;

-- Тестовые лиды
INSERT INTO "leads" ("id", "clientId", "agentId", "contactInfo", "source", "status", "score", "notes") VALUES
('lead_1', 'default-client', 'agent_1', '{"name": "Иван Петров", "phone": "+375 29 123-45-67", "email": "ivan.petrov@example.com"}', 'voice_widget', 'NEW', 85, 'Интересуется услугами, просил перезвонить'),
('lead_2', 'default-client', 'agent_1', '{"name": "Мария Сидорова", "phone": "+375 33 987-65-43", "email": "maria.sidorova@example.com"}', 'voice_widget', 'CONTACTED', 92, 'Высокий интерес, назначена встреча'),
('lead_3', 'default-client', 'agent_1', '{"name": "Алексей Михайлов", "phone": "+375 25 555-77-88", "email": "alex.mikhailov@gmail.com"}', 'voice_widget', 'QUALIFIED', 95, 'Готов к покупке, обсуждаем детали'),
('lead_4', 'default-client', 'agent_1', '{"name": "Елена Козлова", "phone": "+375 44 111-22-33"}', 'voice_widget', 'NEW', 70, 'Первичный контакт, требует уточнения потребностей'),
('lead_5', 'default-client', 'agent_1', '{"name": "Дмитрий Волков", "phone": "+375 29 999-88-77", "email": "dmitry.volkov@company.by"}', 'voice_widget', 'CONVERTED', 100, 'Успешная конверсия! Клиент подписал договор')
ON CONFLICT ("id") DO NOTHING;

-- Проверка созданных данных
SELECT 'clients' as table_name, COUNT(*) as count FROM "clients"
UNION ALL
SELECT 'agents' as table_name, COUNT(*) as count FROM "agents"
UNION ALL
SELECT 'leads' as table_name, COUNT(*) as count FROM "leads"; 