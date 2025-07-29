-- Manual migration for Supabase: Enhanced schema for ElevenLabs integration
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings (if available)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Add new columns to conversations table (only if they don't exist)
DO $$ 
BEGIN 
    -- Add eleven_labs_conversation_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'eleven_labs_conversation_id') THEN
        ALTER TABLE conversations ADD COLUMN eleven_labs_conversation_id TEXT;
    END IF;
    
    -- Add transcript_json column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'transcript_json') THEN
        ALTER TABLE conversations ADD COLUMN transcript_json JSONB;
    END IF;
    
    -- Add sentiment_score column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'sentiment_score') THEN
        ALTER TABLE conversations ADD COLUMN sentiment_score FLOAT;
    END IF;
    
    -- Add topics column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'topics') THEN
        ALTER TABLE conversations ADD COLUMN topics TEXT[];
    END IF;
    
    -- Add language column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'language') THEN
        ALTER TABLE conversations ADD COLUMN language TEXT DEFAULT 'ru';
    END IF;
END $$;

-- Add new columns to leads table (only if they don't exist)
DO $$ 
BEGIN 
    -- Add source_conversation_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'source_conversation_id') THEN
        ALTER TABLE leads ADD COLUMN source_conversation_id TEXT;
    END IF;
    
    -- Add conversation_summary column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'conversation_summary') THEN
        ALTER TABLE leads ADD COLUMN conversation_summary TEXT;
    END IF;
    
    -- Add extracted_entities column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'extracted_entities') THEN
        ALTER TABLE leads ADD COLUMN extracted_entities JSONB;
    END IF;
    
    -- Add lead_quality_score column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'lead_quality_score') THEN
        ALTER TABLE leads ADD COLUMN lead_quality_score INTEGER;
    END IF;
END $$;

-- Create knowledge_documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    client_id TEXT NOT NULL REFERENCES clients(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text',
    metadata JSONB,
    -- Note: Vector embeddings column will be added when pgvector is available
    -- embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_logs table
CREATE TABLE IF NOT EXISTS api_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service_name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for source_conversation_id in leads (with safe approach)
DO $$ 
BEGIN 
    -- Check if the foreign key constraint doesn't exist, then add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_leads_source_conversation'
        AND table_name = 'leads'
    ) THEN
        ALTER TABLE leads 
        ADD CONSTRAINT fk_leads_source_conversation 
        FOREIGN KEY (source_conversation_id) REFERENCES conversations(id);
    END IF;
END $$;

-- Create indexes for better performance (with safe IF NOT EXISTS approach)
DO $$ 
BEGIN 
    -- Index for eleven_labs_conversation_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_eleven_labs_id') THEN
        CREATE INDEX idx_conversations_eleven_labs_id ON conversations(eleven_labs_conversation_id);
    END IF;
    
    -- Index for language
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_language') THEN
        CREATE INDEX idx_conversations_language ON conversations(language);
    END IF;
    
    -- Index for sentiment_score
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_sentiment') THEN
        CREATE INDEX idx_conversations_sentiment ON conversations(sentiment_score);
    END IF;
    
    -- Index for source_conversation_id in leads
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_source_conversation') THEN
        CREATE INDEX idx_leads_source_conversation ON leads(source_conversation_id);
    END IF;
    
    -- Index for lead_quality_score
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_quality_score') THEN
        CREATE INDEX idx_leads_quality_score ON leads(lead_quality_score);
    END IF;
    
    -- Index for knowledge_documents client_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_documents_client') THEN
        CREATE INDEX idx_knowledge_documents_client ON knowledge_documents(client_id);
    END IF;
    
    -- Index for knowledge_documents content_type
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_documents_type') THEN
        CREATE INDEX idx_knowledge_documents_type ON knowledge_documents(content_type);
    END IF;
    
    -- Index for api_logs service_name
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_logs_service') THEN
        CREATE INDEX idx_api_logs_service ON api_logs(service_name);
    END IF;
    
    -- Index for api_logs created_at
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_logs_created_at') THEN
        CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);
    END IF;
    
    -- Index for api_logs status_code
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_logs_status') THEN
        CREATE INDEX idx_api_logs_status ON api_logs(status_code);
    END IF;
END $$;

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to knowledge_documents (safe approach)
DO $$ 
BEGIN 
    -- Drop trigger if exists, then create
    DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
    CREATE TRIGGER update_knowledge_documents_updated_at 
        BEFORE UPDATE ON knowledge_documents 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Verify tables were created
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('knowledge_documents', 'api_logs')
ORDER BY tablename; 