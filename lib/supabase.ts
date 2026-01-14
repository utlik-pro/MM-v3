import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (for browser usage)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes and server-side operations)
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      throw error
    }
    
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    return false
  }
} 