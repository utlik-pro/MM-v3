require('dotenv').config()

console.log('🔍 Environment variables check:')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'SET' : 'NOT SET')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')

// Проверим формат DATABASE_URL
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL
  console.log('📋 DATABASE_URL format check:')
  console.log('- Starts with postgresql://:', url.startsWith('postgresql://'))
  console.log('- Contains @:', url.includes('@'))
  console.log('- Contains :5432:', url.includes(':5432'))
  console.log('- Contains /postgres:', url.includes('/postgres'))
} 