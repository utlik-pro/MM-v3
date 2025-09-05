require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('📋 Supabase URL:', supabaseUrl)
  console.log('📋 Supabase Key:', supabaseKey ? 'SET' : 'NOT SET')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    return
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Попробуем простой запрос
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)
    
    if (error) {
      console.error('❌ Supabase query error:', error)
    } else {
      console.log('✅ Supabase connection successful!')
      console.log('📋 Tables found:', data?.length || 0)
    }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
  }
}

testSupabaseConnection() 