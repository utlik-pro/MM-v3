const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing database connection...')
    
    // Попробуем простой запрос
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful!', result)
    
    // Проверим, есть ли таблицы
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('📋 Existing tables:', tables)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection() 