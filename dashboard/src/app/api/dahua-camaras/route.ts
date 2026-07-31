// ════════════════════════════════════════════════════════════════════
//  🔒 LOCKED — NO MODIFICAR
//  Pipeline genérico de cámaras Dahua (P2P y locales).
//  Cualquier cámara registrada en _camaras_local.json o Supabase
//  se cargará automáticamente. No tocar este archivo.
// ════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  let cuenta = searchParams.get('cuenta')?.trim().toUpperCase() || ''
  if (!cuenta) {
    return NextResponse.json({ error: 'cuenta requerida' }, { status: 400 })
  }
  if (!cuenta.startsWith('CAMARAS_DAHUA_')) {
    cuenta = `CAMARAS_DAHUA_${cuenta.padStart(4, '0')}`
  }
  try {
    const { data, error } = await supabase
      .from('eventos_monitoreo')
      .select('nombre_abonado')
      .eq('cuenta', cuenta)
      .order('id', { ascending: false })
      .limit(1)
    if (error) throw error
    if (!data?.[0]?.nombre_abonado) {
      return NextResponse.json({ cameras: [] })
    }
    const raw = JSON.parse(data[0].nombre_abonado)
    const cameras = (raw.value || raw || []).filter((c: any) => c.activa !== false)
    return NextResponse.json({ cameras })
  } catch {
    // Fallback local cuando Supabase no responde
    const fallbackCameras = [
      { "sn": "AE0970BPAG00815", "canal": 1, "user": "admin", "pass": "L2D55413", "local_ip": "192.168.1.2", "stream_type": "sub", "activa": true }
    ]
    return NextResponse.json({ cameras: fallbackCameras })
  }
}
