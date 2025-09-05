-- Добавление недостающей колонки conversation_id
-- Выполните этот скрипт в Supabase SQL Editor

-- Добавляем колонку conversation_id в таблицу leads
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "conversation_id" TEXT;

-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position; 