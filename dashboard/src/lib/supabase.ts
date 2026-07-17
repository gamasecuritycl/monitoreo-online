import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para la base de datos de IA (RECOVERED_PROJECT)
const supabaseIAUrl = 'https://usuzyqayiecsburbsipl.supabase.co'
const supabaseIAServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdXp5cWF5aWVjc2J1cmJzaXBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDE0NTY0MCwiZXhwIjoyMDk5NzIxNjQwfQ.ZN2sw5R4K5EHuttLzDguKnsF1KBgqUKqOpipB7dGR1Y'

export const supabaseIA = createClient(supabaseIAUrl, supabaseIAServiceKey)

export interface EventoMonitoreo {
  id: number
  fecha_hora: string
  cuenta: string
  evento: string
  nombre_abonado: string
  zona: string
  usuario: string
}
