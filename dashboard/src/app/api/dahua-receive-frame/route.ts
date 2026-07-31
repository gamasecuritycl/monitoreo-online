// ════════════════════════════════════════════════════════════════════
//  🔒 LOCKED — NO MODIFICAR
//  Recibe frames desde el bridge Python, los almacena en Vercel Blob
//  y fire-and-forget a Supabase. Genérico para toda cámara Dahua.
// ════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { put } from '@vercel/blob'
import { setCachedBlobUrl } from '../_frame-cache'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const BRIDGE_SECRET = 'gama_dahua_2024_secret'

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('x-bridge-secret')
    if (auth !== BRIDGE_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sn, canal, img: b64, ts } = body
    if (!sn || !canal || !b64) {
      return NextResponse.json({ error: 'sn, canal, img required' }, { status: 400 })
    }

    const timestamp = ts || new Date().toISOString()
    const key = `${sn.toUpperCase()}_CH_${canal}`

    // Subir a Vercel Blob
    try {
      const buffer = Buffer.from(b64.startsWith('data:image/') ? b64.split(',')[1] : b64, 'base64')
      const blob = await put(`frames/${key}.jpg`, buffer, {
        contentType: 'image/jpeg',
        access: 'public',
        addRandomSuffix: false,
      })
      setCachedBlobUrl(sn, canal, blob.url)
    } catch (e: any) {
      console.error('[BLOB] Upload error:', e.message)
    }

    // Supabase async (fire-and-forget)
    Promise.resolve().then(async () => {
      try {
        const cuenta = `DAHUA_FRAME_${sn.toUpperCase()}_CH_${canal}`
        const payload = JSON.stringify({ ts: timestamp, img: b64 })
        const { data: existing } = await supabase
          .from('eventos_monitoreo')
          .select('id')
          .eq('cuenta', cuenta)
          .order('id', { ascending: false })
          .limit(1)
        if (existing?.[0]?.id) {
          await supabase
            .from('eventos_monitoreo')
            .update({ nombre_abonado: payload, fecha_hora: timestamp })
            .eq('id', existing[0].id)
        } else {
          await supabase
            .from('eventos_monitoreo')
            .insert({ cuenta, nombre_abonado: payload, evento: 'FRAME_SYNC', fecha_hora: timestamp })
        }
      } catch {}
    })

    return NextResponse.json({ ok: true, cached: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
