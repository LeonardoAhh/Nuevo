// test-supabase.js - Script para probar la conexión con Supabase
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configuración (reemplaza con tus valores reales)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

console.log('🔍 Probando conexión con Supabase...')
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada')
console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ No configurada')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔍 Probando conexión con Supabase...')

    // Probar conexión básica
    const { data, error } = await supabase.from('profiles').select('count').limit(1)

    if (error) {
      console.error('❌ Error de conexión:', error.message)
      return
    }

    console.log('✅ Conexión exitosa con Supabase!')
    console.log('📊 Respuesta de prueba:', data)

  } catch (err) {
    console.error('❌ Error inesperado:', err.message)
  }
}

testConnection()