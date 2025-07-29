import { NextApiRequest, NextApiResponse } from 'next'
import { testSupabaseConnection } from '../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 Testing Supabase connection...')
    
    // Test the connection
    const isConnected = await testSupabaseConnection()
    
    if (isConnected) {
      return res.status(200).json({
        success: true,
        message: 'Supabase connection successful',
        timestamp: new Date().toISOString()
      })
    } else {
      return res.status(500).json({
        success: false,
        message: 'Supabase connection failed',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error)
    return res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 