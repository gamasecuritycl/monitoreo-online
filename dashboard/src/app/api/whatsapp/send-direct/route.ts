import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const CALLMEBOT_API = 'https://api.callmebot.com/whatsapp.php'
const CALLMEBOT_APIKEY = '4238719'

export async function POST(req: Request) {
  try {
    const { telefono, texto } = await req.json()
    if (!telefono || !texto) {
      return NextResponse.json({ ok: false, error: 'Faltan parámetros de envío' }, { status: 400 })
    }

    let telLimpio = telefono.replace(/[^0-9]/g, '')
    if (telLimpio.length === 9 && telLimpio.startsWith('9')) {
      telLimpio = '56' + telLimpio
    } else if (telLimpio.length === 8) {
      telLimpio = '569' + telLimpio
    }

    // Insertar en conversaciones_whatsapp con estado pendiente
    // El servidor en la nube escuchará este insert y lo despachará al instante
    const { error } = await supabase.from('conversaciones_whatsapp').insert({
      numero: telLimpio,
      mensaje_enviado: texto,
      estado: 'pendiente',
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error('[SUPABASE INSERT ERROR]:', error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, proveedor: 'whatsapp_database_bridge' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
