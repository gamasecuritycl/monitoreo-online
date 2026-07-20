const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function test() {
  console.log('🔍 Consultando ultimos mensajes de WhatsApp en Supabase...')
  const { data, error } = await supabase
    .from('conversaciones_whatsapp')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log(`Encontrados ${data.length} registros:`)
  data.forEach((r, idx) => {
    console.log(`[#${idx+1}] ID: ${r.id} | Tel: ${r.numero} | Estado: ${r.estado} | Creado: ${r.created_at}`)
    console.log(`     Enviado: "${r.mensaje_enviado || '—'}"`)
    console.log(`     Recibido: "${r.respuesta_recibida || '—'}"`)
  })
}

test()
