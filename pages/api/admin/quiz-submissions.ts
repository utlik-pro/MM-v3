import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 Checking quiz_submissions table...')

    // Проверяем доступные таблицы
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (tablesError) {
      console.log('📋 Tables error:', tablesError)
    } else {
      console.log('📋 Available tables:', tables?.map(t => t.table_name) || [])
    }

    // Пытаемся получить данные из quiz_submissions
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_submissions')
      .select('*')
      .limit(10)
      .order('created_at', { ascending: false })

    console.log('📊 Quiz submissions query result:', { 
      data: quizData, 
      error: quizError,
      count: quizData?.length || 0 
    })

    if (quizError) {
      // Если прямой запрос не работает, попробуем через RPC
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_quiz_submissions')

      if (rpcError) {
        console.log('🔧 RPC also failed:', rpcError)
        
        // Попробуем проверить схему таблицы
        const { data: schema, error: schemaError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', 'quiz_submissions')

        return res.status(200).json({
          success: false,
          message: 'Quiz submissions table access issues',
          debug: {
            tables_available: tables?.map(t => t.table_name) || [],
            quiz_error: quizError.message,
            rpc_error: rpcError.message,
            schema_info: schema || 'Schema query failed',
            schema_error: schemaError?.message
          }
        })
      }

      return res.status(200).json({
        success: true,
        source: 'rpc',
        data: rpcData
      })
    }

    // Анализируем структуру данных
    const sampleRecord = quizData?.[0]
    console.log('📋 Sample quiz submission:', sampleRecord)

    // Фильтруем записи связанные с нашим Tool ID
    const toolRelatedRecords = quizData?.filter(record => {
      const recordStr = JSON.stringify(record).toLowerCase()
      return recordStr.includes('xi4efseuln') || recordStr.includes('xi4EFSeulNpmBWxSC9b4')
    }) || []

    console.log('🎯 Tool-related records found:', toolRelatedRecords.length)

    return res.status(200).json({
      success: true,
      source: 'direct',
      summary: {
        total_quiz_submissions: quizData?.length || 0,
        tool_related_records: toolRelatedRecords.length,
        target_tool_id: 'xi4EFSeulNpmBWxSC9b4',
        latest_record_date: quizData?.[0]?.created_at || null
      },
      sample_record: sampleRecord,
      tool_related_records: toolRelatedRecords,
      all_records: quizData
    })

  } catch (error) {
    console.error('❌ Quiz submissions API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 