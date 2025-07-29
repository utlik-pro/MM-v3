import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerSupabaseClient()
    
    console.log('🔄 Testing database schema migration...')
    
    // Test new tables exist
    const tests = []
    
    // Test 1: Check if knowledge_documents table exists
    try {
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_documents')
        .select('count', { count: 'exact', head: true })
      
      tests.push({
        name: 'knowledge_documents table',
        status: kbError ? 'failed' : 'passed',
        error: kbError?.message
      })
    } catch (error) {
      tests.push({
        name: 'knowledge_documents table',
        status: 'failed',
        error: 'Table does not exist'
      })
    }
    
    // Test 2: Check if api_logs table exists
    try {
      const { data: apiData, error: apiError } = await supabase
        .from('api_logs')
        .select('count', { count: 'exact', head: true })
      
      tests.push({
        name: 'api_logs table',
        status: apiError ? 'failed' : 'passed',
        error: apiError?.message
      })
    } catch (error) {
      tests.push({
        name: 'api_logs table',
        status: 'failed',
        error: 'Table does not exist'
      })
    }
    
    // Test 3: Check if conversations table has new columns
    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('eleven_labs_conversation_id, transcript_json, sentiment_score, topics, language')
        .limit(1)
      
      tests.push({
        name: 'conversations enhanced columns',
        status: convError ? 'failed' : 'passed',
        error: convError?.message
      })
    } catch (error) {
      tests.push({
        name: 'conversations enhanced columns',
        status: 'failed',
        error: 'Enhanced columns not found'
      })
    }
    
    // Test 4: Check if leads table has new columns
    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('source_conversation_id, conversation_summary, extracted_entities, lead_quality_score')
        .limit(1)
      
      tests.push({
        name: 'leads enhanced columns',
        status: leadError ? 'failed' : 'passed',
        error: leadError?.message
      })
    } catch (error) {
      tests.push({
        name: 'leads enhanced columns',
        status: 'failed',
        error: 'Enhanced columns not found'
      })
    }
    
    const allPassed = tests.every(test => test.status === 'passed')
    
    return res.status(allPassed ? 200 : 500).json({
      success: allPassed,
      message: allPassed ? 'All migration tests passed' : 'Some migration tests failed',
      tests,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Migration test failed:', error)
    return res.status(500).json({
      success: false,
      message: 'Migration test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 