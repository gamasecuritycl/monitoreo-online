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

    // 1. Intentar HTTP directo si está en la misma red local (puerto 3015)
    try {
      const openwaRes = await fetch('http://localhost:3015/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: telLimpio, text: texto }),
        signal: AbortSignal.timeout(1500)
      })
      const openwaData = await openwaRes.json()
      if (openwaData?.ok) {
        return NextResponse.json({ ok: true, proveedor: 'openwa_local_http' })
      }
    } catch {}

    // 2. Broadcast vía Supabase Realtime a la central local (whatsapp_outbound)
    try {
      const channel = supabase.channel('whatsapp_outbound')
      await channel.send({
        type: 'broadcast',
        event: 'send_whatsapp',
        payload: { phone: telLimpio, text: texto, timestamp: Date.now() }
      })
      return NextResponse.json({ ok: true, proveedor: 'whatsapp_oficial_realtime' })
    } catch (err) {
      console.warn('[WHATSAPP BROADCAST ERROR]:', err)
    }

    // 3. Cloud Gateway Fallback solo si falló la central
    const params = new URLSearchParams({
      phone: telLimpio,
      text: texto,
      apikey: CALLMEBOT_APIKEY
    })

    const callmeRes = await fetch(`${CALLMEBOT_API}?${params.toString()}`)
    const callmeData = await callmeRes.text()
    const ok = callmeRes.ok && (callmeData.includes('Message queued') || callmeData.includes('success'))

    return NextResponse.json({ ok: true, proveedor: 'whatsapp_fallback', debug: callmeData.slice(0, 100) })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
