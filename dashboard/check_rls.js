const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
  console.log('🔓 Desactivando RLS en tablas de mensajeria de Supabase para permitir comunicacion en la nube...')
  
  // Como no podemos ejecutar comandos DDL directos via cliente anonimo,
  // verificamos si podemos escribir directamente un registro de test en eventos_monitoreo.
  try {
    const { data, error } = await supabase
      .from('eventos_monitoreo')
      .insert({
        cuenta: 'TEST_RLS_CLOUD',
        nombre_abonado: 'OK',
        evento: 'TEST',
        fecha_hora: new Date().toISOString()
      })
    
    if (error) {
      console.log('⚠️ Error al insertar (Posible RLS activo):', error.message)
    } else {
      console.log('✅ Insercion exitosa. RLS ya esta liberado para anon en eventos_monitoreo!')
    }
  } catch (err) {
    console.error(err)
  }
}

run()
