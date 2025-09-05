require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function executeSQL() {
  console.log('🔍 Executing SQL script...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Используем service role key
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    return
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Читаем SQL файл
    const sqlContent = fs.readFileSync('create-tables.sql', 'utf8')
    console.log('📋 SQL content loaded, length:', sqlContent.length)
    
    // Выполняем SQL через rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ SQL execution error:', error)
      
      // Попробуем альтернативный способ - выполним по частям
      console.log('🔄 Trying alternative approach...')
      
      const sqlParts = sqlContent.split(';').filter(part => part.trim())
      
      for (let i = 0; i < sqlParts.length; i++) {
        const part = sqlParts[i].trim()
        if (part) {
          console.log(`📝 Executing part ${i + 1}/${sqlParts.length}:`, part.substring(0, 50) + '...')
          
          try {
            const { error: partError } = await supabase.rpc('exec_sql', { sql: part })
            if (partError) {
              console.warn(`⚠️ Part ${i + 1} failed:`, partError.message)
            } else {
              console.log(`✅ Part ${i + 1} executed successfully`)
            }
          } catch (execError) {
            console.warn(`⚠️ Part ${i + 1} execution failed:`, execError.message)
          }
        }
      }
    } else {
      console.log('✅ SQL executed successfully!')
    }
    
  } catch (error) {
    console.error('❌ SQL execution failed:', error.message)
  }
}

executeSQL() 