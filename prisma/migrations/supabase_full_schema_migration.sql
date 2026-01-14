-- Full schema migration for Supabase: Complete ElevenLabs integration setup
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings (if available)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'CLIENT_ADMIN', 'CLIENT_USER', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE conversation_status AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED', 'TIMEOUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    settings TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT,
    role user_role DEFAULT 'CLIENT_USER',
    client_id TEXT REFERENCES clients(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    client_id TEXT NOT NULL REFERENCES clients(id),
    external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    settings TEXT,
    current_prompt_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, external_id)
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    version INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT,
    metadata TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, version)
);

-- Create conversations table (with enhanced ElevenLabs fields)
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    client_id TEXT NOT NULL REFERENCES clients(id),
    agent_id TEXT NOT NULL REFERENCES agents(id),
    prompt_id TEXT REFERENCES prompts(id),
    external_id TEXT,
    eleven_labs_conversation_id TEXT,
    status conversation_status DEFAULT 'ACTIVE',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    transcript TEXT,
    transcript_json JSONB,
    summary TEXT,
    sentiment_score FLOAT,
    topics TEXT[],
    language TEXT DEFAULT 'ru',
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table (with enhanced ElevenLabs fields)
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    client_id TEXT NOT NULL REFERENCES clients(id),
    agent_id TEXT NOT NULL REFERENCES agents(id),
    conversation_id TEXT REFERENCES conversations(id),
    source_conversation_id TEXT REFERENCES conversations(id),
    contact_info TEXT NOT NULL,
    source TEXT DEFAULT 'voice_widget',
    status lead_status DEFAULT 'NEW',
    score INTEGER,
    conversation_summary TEXT,
    extracted_entities JSONB,
    lead_quality_score INTEGER,
    notes TEXT,
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS lead_activities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lead_id TEXT NOT NULL REFERENCES leads(id),
    user_id TEXT,
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    client_id TEXT NOT NULL REFERENCES clients(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    metric TEXT NOT NULL,
    value FLOAT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, date, metric)
);

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

-- Create NextAuth tables
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_token TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(identifier, token)
);

-- Add missing foreign key constraints (with safe approach)
DO $$ 
BEGIN 
    -- Add constraint for agents.current_prompt_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_agents_current_prompt'
        AND table_name = 'agents'
    ) THEN
        ALTER TABLE agents 
        ADD CONSTRAINT fk_agents_current_prompt 
        FOREIGN KEY (current_prompt_id) REFERENCES prompts(id);
    END IF;
END $$;

-- Create indexes for better performance
DO $$ 
BEGIN 
    -- Indexes for conversations
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_eleven_labs_id') THEN
        CREATE INDEX idx_conversations_eleven_labs_id ON conversations(eleven_labs_conversation_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_language') THEN
        CREATE INDEX idx_conversations_language ON conversations(language);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_sentiment') THEN
        CREATE INDEX idx_conversations_sentiment ON conversations(sentiment_score);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_client_agent') THEN
        CREATE INDEX idx_conversations_client_agent ON conversations(client_id, agent_id);
    END IF;
    
    -- Indexes for leads
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_source_conversation') THEN
        CREATE INDEX idx_leads_source_conversation ON leads(source_conversation_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_quality_score') THEN
        CREATE INDEX idx_leads_quality_score ON leads(lead_quality_score);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_client_status') THEN
        CREATE INDEX idx_leads_client_status ON leads(client_id, status);
    END IF;
    
    -- Indexes for knowledge_documents
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_documents_client') THEN
        CREATE INDEX idx_knowledge_documents_client ON knowledge_documents(client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_documents_type') THEN
        CREATE INDEX idx_knowledge_documents_type ON knowledge_documents(content_type);
    END IF;
    
    -- Indexes for api_logs
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_logs_service') THEN
        CREATE INDEX idx_api_logs_service ON api_logs(service_name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_logs_created_at') THEN
        CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_logs_status') THEN
        CREATE INDEX idx_api_logs_status ON api_logs(status_code);
    END IF;
    
    -- General indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_client') THEN
        CREATE INDEX idx_users_client ON users(client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agents_client') THEN
        CREATE INDEX idx_agents_client ON agents(client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prompts_agent') THEN
        CREATE INDEX idx_prompts_agent ON prompts(agent_id);
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

-- Apply updated_at triggers to all relevant tables
DO $$ 
BEGIN 
    -- Trigger for clients
    DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
    CREATE TRIGGER update_clients_updated_at 
        BEFORE UPDATE ON clients 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    -- Trigger for users
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    -- Trigger for agents
    DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
    CREATE TRIGGER update_agents_updated_at 
        BEFORE UPDATE ON agents 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    -- Trigger for prompts
    DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts;
    CREATE TRIGGER update_prompts_updated_at 
        BEFORE UPDATE ON prompts 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    -- Trigger for conversations
    DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
    CREATE TRIGGER update_conversations_updated_at 
        BEFORE UPDATE ON conversations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    -- Trigger for leads
    DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
    CREATE TRIGGER update_leads_updated_at 
        BEFORE UPDATE ON leads 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    -- Trigger for knowledge_documents
    DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
    CREATE TRIGGER update_knowledge_documents_updated_at 
        BEFORE UPDATE ON knowledge_documents 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Insert initial data
INSERT INTO clients (id, name, domain, is_active) 
VALUES ('default-client', 'Default Client', 'localhost', true)
ON CONFLICT (id) DO NOTHING;

-- Verify tables were created successfully
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('clients', 'users', 'agents', 'prompts', 'conversations', 'leads', 'knowledge_documents', 'api_logs')
ORDER BY tablename; 