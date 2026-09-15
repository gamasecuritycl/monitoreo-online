import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const WA_SERVER = 'https://gama-whatsapp-cloud-production.up.railway.app'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function GET() {
  // 1. Intento primario contra Railway
  try {
    const res = await fetch(`${WA_SERVER}/api/status`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.estado) {
        return NextResponse.json(data)
      }
    }
  } catch {}

  // 2. Fallback resiliente: Consultar estado sincronizado en Supabase
  try {
    const { data } = await supabase
      .from('eventos_monitoreo')
      .select('nombre_abonado, fecha_hora')
      .eq('cuenta', 'CONFIG_WHATSAPP_STATE')
      .order('id', { ascending: false })
      .limit(1)

    if (data && data.length > 0 && data[0].nombre_abonado) {
      const parsed = JSON.parse(data[0].nombre_abonado)
      return NextResponse.json(parsed)
    }
  } catch {}

  return NextResponse.json({
    ready: false,
    estado: 'SERVIDOR_APAGADO',
    hasQR: false,
    cola: 0,
    usuario: null,
  })
}
