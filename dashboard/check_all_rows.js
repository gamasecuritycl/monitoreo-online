const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'

async function check() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data, error } = await supabase.from('conversaciones_whatsapp').select('*').order('created_at', { ascending: false }).limit(60)
  if (error) {
    console.error('Error:', error)
    return
  }
  console.log(`TOTAL ROWS IN conversaciones_whatsapp: ${data.length}`)
  data.forEach(r => {
    console.log(`ID: ${r.id} | numero: "${r.numero}" | cuenta: "${r.cuenta}" | tipo: ${r.tipo_evento} | msg: "${(r.mensaje_enviado || r.respuesta_recibida || r.respuesta_cliente || '').slice(0, 50)}"`)
  })
}

check()
