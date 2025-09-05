require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function createTablesDirect() {
  console.log('🔍 Creating tables directly via Supabase API...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('📋 Supabase URL:', supabaseUrl)
  console.log('📋 Using service role key:', supabaseKey ? 'YES' : 'NO')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    return
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Создаем таблицы по одной
    const tables = [
      {
        name: 'clients',
        sql: `
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
        `
      },
      {
        name: 'agents',
        sql: `
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
        `
      },
      {
        name: 'leads',
        sql: `
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
        `
      },
      {
        name: 'conversations',
        sql: `
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
        `
      }
    ]
    
    for (const table of tables) {
      console.log(`📝 Creating table: ${table.name}`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: table.sql })
        
        if (error) {
          console.warn(`⚠️ Failed to create ${table.name}:`, error.message)
        } else {
          console.log(`✅ Table ${table.name} created successfully`)
        }
      } catch (execError) {
        console.warn(`⚠️ Error creating ${table.name}:`, execError.message)
      }
    }
    
    console.log('🎉 Table creation process completed!')
    
  } catch (error) {
    console.error('❌ Table creation failed:', error.message)
  }
}

createTablesDirect() 