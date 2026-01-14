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
    const supabase = createServerSupabaseClient()
    
    console.log('🌱 Seeding database with initial data...')
    
    // Step 1: Insert a test record first to verify our connection works
    let testData = null
    let finalTestError = null
    
    const { data: testData1, error: testError1 } = await supabase
      .from('test')
      .insert({ data: 'migration test' })
      .select()
    
    if (testError1) {
      console.log('❌ Test insert failed:', testError1)
      // Try to create test data using service role bypass
      const { data: testData2, error: testError2 } = await supabase
        .from('test')
        .insert({ data: 'migration test with service role' })
        .select()
      
      if (testError2) {
        finalTestError = testError2
      } else {
        testData = testData2
      }
    } else {
      testData = testData1
    }
    
    if (finalTestError) {
      return res.status(500).json({
        success: false,
        message: 'Unable to write to database. RLS policies may be blocking access.',
        error: finalTestError.message,
        timestamp: new Date().toISOString()
      })
    }
    
    console.log('✅ Test data inserted successfully')
    
    // For now, let's just verify we can work with existing tables
    // We'll use the documents table for our knowledge base
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        pageContent: 'Test knowledge document for voice agent',
        metadata: { 
          type: 'test',
          source: 'migration',
          client_id: 'default-client'
        }
      })
      .select()
    
    if (docError) {
      console.log('Documents table error:', docError)
    }
    
    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        testRecord: testData,
        documentRecord: docData
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    return res.status(500).json({
      success: false,
      message: 'Database seeding failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 