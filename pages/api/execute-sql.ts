import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { sql } = req.body
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query required' })
    }

    const supabase = createServerSupabaseClient()
    
    console.log('🔄 Executing SQL:', sql.substring(0, 100) + '...')
    
    // Try different approaches to execute SQL
    let result = null
    let error = null
    
    // Approach 1: Try direct query
    try {
      const { data, error: queryError } = await supabase
        .from('_not_exists_')
        .select('*')
      // This will fail but might reveal more info
    } catch (e) {
      // Ignore this error
    }
    
    // Approach 2: Try rpc approach
    try {
      const { data, error: rpcError } = await supabase.rpc('exec_sql', { sql })
      if (!rpcError) {
        result = data
      } else {
        error = rpcError
      }
    } catch (rpcErr) {
      error = rpcErr
    }
    
    return res.status(200).json({
      success: !error,
      message: error ? 'SQL execution failed' : 'SQL executed successfully',
      result,
      error: error ? (typeof error === 'object' && 'message' in error ? error.message : String(error)) : null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ SQL execution failed:', error)
    return res.status(500).json({
      success: false,
      message: 'SQL execution failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 