const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Testing Supabase REST API...')
  const start = Date.now()
  const { data, count, error } = await supabase
    .from('eventos_monitoreo')
    .select('id, cuenta, evento, fecha_hora', { count: 'exact' })
    .order('id', { ascending: false })
    .limit(10)

  const latency = Date.now() - start
  console.log(`Latency: ${latency}ms`)
  if (error) {
    console.error('Error:', error)
  } else {
    console.log(`Total rows in eventos_monitoreo: ${count}`)
    console.log('Sample rows:', data)
  }

  // Check conversaciones_whatsapp
  const { count: countWsp, error: errorWsp } = await supabase
    .from('conversaciones_whatsapp')
    .select('id', { count: 'exact', head: true })

  console.log(`Total rows in conversaciones_whatsapp: ${countWsp}`)
}

test()
