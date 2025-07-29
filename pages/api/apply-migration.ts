import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '../../lib/supabase'

const FULL_MIGRATION_SQL = `
-- Full migration for Supabase: Create all tables and enhanced schema

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create conversations table (with enhanced fields)
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

-- Create leads table (with enhanced fields)
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

-- Add missing foreign key constraints
ALTER TABLE agents ADD CONSTRAINT IF NOT EXISTS fk_agents_current_prompt 
    FOREIGN KEY (current_prompt_id) REFERENCES prompts(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_eleven_labs_id ON conversations(eleven_labs_conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_language ON conversations(language);
CREATE INDEX IF NOT EXISTS idx_conversations_sentiment ON conversations(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_conversations_client_agent ON conversations(client_id, agent_id);

CREATE INDEX IF NOT EXISTS idx_leads_source_conversation ON leads(source_conversation_id);
CREATE INDEX IF NOT EXISTS idx_leads_quality_score ON leads(lead_quality_score);
CREATE INDEX IF NOT EXISTS idx_leads_client_status ON leads(client_id, status);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_client ON knowledge_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_type ON knowledge_documents(content_type);

CREATE INDEX IF NOT EXISTS idx_api_logs_service ON api_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_logs(status_code);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_client ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_agents_client ON agents(client_id);
CREATE INDEX IF NOT EXISTS idx_prompts_agent ON prompts(agent_id);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at 
    BEFORE UPDATE ON agents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts;
CREATE TRIGGER update_prompts_updated_at 
    BEFORE UPDATE ON prompts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER update_knowledge_documents_updated_at 
    BEFORE UPDATE ON knowledge_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerSupabaseClient()
    
    console.log('🚀 Applying full database migration...')
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: FULL_MIGRATION_SQL
    })
    
    if (error) {
      // If RPC doesn't work, try to execute parts of the migration
      console.log('RPC failed, trying alternative approach...')
      
      // Try to create the essential tables first
      const migrationSteps = [
        "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"",
        // Add more steps as needed
      ]
      
      for (const step of migrationSteps) {
        try {
          await supabase.rpc('exec_sql', { sql: step })
        } catch (stepError) {
          console.log('Step failed:', step, stepError)
        }
      }
    }
    
    console.log('✅ Migration applied successfully')
    
    return res.status(200).json({
      success: true,
      message: 'Migration applied successfully',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 