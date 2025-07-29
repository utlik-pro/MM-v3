import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '../../lib/supabase'
import { readFileSync } from 'fs'
import { join } from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🚀 Applying full database schema migration...')
    
    // Read the full migration SQL file
    const migrationPath = join(process.cwd(), 'prisma/migrations/supabase_full_schema_migration.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    const supabase = createServerSupabaseClient()
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...`)
    
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        // Try to execute each statement
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          errorCount++
          errors.push(`Statement ${i + 1}: ${error.message}`)
          console.log(`❌ Error in statement ${i + 1}:`, error.message)
        } else {
          successCount++
          if (i % 10 === 0) {
            console.log(`✅ Executed ${i + 1}/${statements.length} statements`)
          }
        }
      } catch (err) {
        errorCount++
        const errorMsg = err instanceof Error ? err.message : String(err)
        errors.push(`Statement ${i + 1}: ${errorMsg}`)
        console.log(`❌ Exception in statement ${i + 1}:`, errorMsg)
      }
    }
    
    console.log(`✅ Migration completed: ${successCount} success, ${errorCount} errors`)
    
    return res.status(errorCount > 0 ? 207 : 200).json({
      success: errorCount === 0,
      message: `Migration completed with ${successCount} successful statements and ${errorCount} errors`,
      details: {
        total_statements: statements.length,
        successful: successCount,
        failed: errorCount,
        errors: errors.slice(0, 10) // Show first 10 errors only
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Full migration failed:', error)
    return res.status(500).json({
      success: false,
      message: 'Full migration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 