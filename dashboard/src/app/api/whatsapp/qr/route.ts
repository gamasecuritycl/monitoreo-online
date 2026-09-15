import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const WA_SERVER = 'https://gama-whatsapp-cloud-production.up.railway.app'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Proxy del QR del servidor WhatsApp
export async function GET() {
  try {
    const res = await fetch(`${WA_SERVER}/api/qr`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (data) return NextResponse.json(data)
    }
  } catch {}

  // Fallback desde Supabase
  try {
    const { data } = await supabase
      .from('eventos_monitoreo')
      .select('nombre_abonado')
      .eq('cuenta', 'CONFIG_WHATSAPP_QR')
      .order('id', { ascending: false })
      .limit(1)

    if (data && data.length > 0 && data[0].nombre_abonado) {
      const parsed = JSON.parse(data[0].nombre_abonado)
      return NextResponse.json(parsed)
    }
  } catch {}

  return NextResponse.json({ status: 'offline', qr: null, qrImage: null })
}

// Solicitar Pairing Code
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const phone = body?.phone || '56948855190'

    // Intentar Railway
    try {
      const res = await fetch(`${WA_SERVER}/api/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
        signal: AbortSignal.timeout(6000),
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json(data)
      }
    } catch {}

    // Fallback comando vía Supabase Realtime
    await supabase.from('eventos_monitoreo').insert({
      cuenta: 'CONFIG_WHATSAPP_COMMAND',
      nombre_abonado: `PAIR:${phone}`,
      evento: 'PAIR',
      fecha_hora: new Date().toISOString()
    })

    return NextResponse.json({ ok: true, mensaje: 'Comando PAIR enviado a la cola' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
