import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface EventoMonitoreo {
  id: number
  fecha_hora: string
  cuenta: string
  nombre_abonado: string
  zona: string
  evento: string
  tipo_evento: string
  created_at: string
}
