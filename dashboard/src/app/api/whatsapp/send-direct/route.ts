import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function POST(req: Request) {
  try {
    const { telefono, texto, cuenta } = await req.json()
    if (!telefono || !texto) {
      return NextResponse.json({ ok: false, error: 'Faltan parámetros de envío' }, { status: 400 })
    }

    let telLimpio = String(telefono).trim()
    if (telLimpio.includes('@g.us') || telLimpio.includes('-')) {
      if (!telLimpio.endsWith('@g.us') && telLimpio.includes('-')) {
        telLimpio = telLimpio + '@g.us'
      }
    } else {
      const digitos = telLimpio.replace(/[^0-9]/g, '')
      if (digitos.length === 9 && digitos.startsWith('9')) {
        telLimpio = '56' + digitos
      } else if (digitos.length === 8) {
        telLimpio = '569' + digitos
      } else if (digitos.length > 0) {
        telLimpio = digitos
      }
    }

    const cuentaFinal = cuenta ? String(cuenta).trim() : (telLimpio.includes('@g.us') ? 'GRUPO' : 'CENTRAL')

    // Insertar en conversaciones_whatsapp con estado pendiente y cuenta válida (Not-Null constraint fix)
    const { error } = await supabase.from('conversaciones_whatsapp').insert({
      cuenta: cuentaFinal,
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
    console.error('[SEND-DIRECT API ERROR]:', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
