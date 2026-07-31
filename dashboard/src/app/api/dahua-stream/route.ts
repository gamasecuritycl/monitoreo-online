// ════════════════════════════════════════════════════════════════════
//  🔒 LOCKED — NO MODIFICAR
//  Sirve frames de cualquier cámara Dahua vía Vercel Blob + Supabase.
//  Solo necesita ?sn=XXX&ch=N. Genérico para toda cámara.
// ════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { head } from '@vercel/blob'
import { getCachedBlobUrl } from '../_frame-cache'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fetchFromBlob(url: string, source: string): Promise<NextResponse | null> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!resp.ok) return null
    const buffer = Buffer.from(await resp.arrayBuffer())
    if (buffer.length <= 100) return null
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Dahua-Source': source,
        'X-Frame-Age': '0'
      }
    })
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sn = searchParams.get('sn')?.trim().toUpperCase()
  const canal = parseInt(searchParams.get('canal') || '1')
  if (!sn) {
    return new NextResponse(getSvg('SN requerido'), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' }
    })
  }

  const key = `${sn}_CH_${canal}`

  // 1. Cache local de URL firmada (misma instancia)
  const cachedUrl = getCachedBlobUrl(sn, canal)
  if (cachedUrl) {
    const resp = await fetchFromBlob(cachedUrl, 'VERCEL_BLOB_CACHE')
    if (resp) return resp
  }

  // 2. Vercel Blob head lookup (compartido entre instancias)
  try {
    const blob = await head(`frames/${key}.jpg`)
    if (blob?.url) {
      const resp = await fetchFromBlob(blob.url, 'VERCEL_BLOB')
      if (resp) return resp
    }
  } catch {}

  // 3. Ping a Supabase (fire-and-forget)
  ;(async () => {
    try {
      const p = supabase.from('eventos_monitoreo').upsert({
        cuenta: `DAHUA_STREAM_REQ_${sn}_CH_${canal}`,
        nombre_abonado: 'ACTIVE_PING',
        evento: 'STREAM_REQ',
        fecha_hora: new Date().toISOString()
      })
      await Promise.race([Promise.resolve(p), new Promise(r => setTimeout(r, 5000))])
    } catch {}
  })()

  // 4. Supabase fallback
  const cuentas = [`DAHUA_FRAME_${sn}_CH_${canal}`, `DAHUA_FRAME_${sn}`]
  for (const cuenta of cuentas) {
    try {
      const q = supabase
        .from('eventos_monitoreo')
        .select('nombre_abonado, fecha_hora')
        .eq('cuenta', cuenta)
        .order('id', { ascending: false })
        .limit(1)
      const { data } = await Promise.race([
        Promise.resolve(q) as Promise<any>,
        new Promise<{ data: null }>(r => setTimeout(() => r({ data: null }), 6000))
      ]) as any
      if (data?.[0]?.nombre_abonado) {
        const raw = data[0].nombre_abonado
        const ts = data[0].fecha_hora
        let b64: string | null = null
        try {
          const parsed = JSON.parse(raw)
          if (parsed.img) b64 = parsed.img
        } catch { b64 = raw }
        if (!b64) continue
        const age = ts ? (Date.now() - new Date(ts).getTime()) / 1000 : 999
        if (age < 15) {
          let buffer: Buffer | null = null
          if (b64.startsWith('data:image/')) {
            buffer = Buffer.from(b64.split(',')[1], 'base64')
          } else {
            buffer = Buffer.from(b64, 'base64')
          }
          if (buffer && buffer.length > 100) {
            return new NextResponse(new Uint8Array(buffer), {
              headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Dahua-Source': 'SUPABASE_CLOUD',
                'X-Frame-Age': age.toFixed(1)
              }
            })
          }
        }
      }
    } catch {}
  }

  // 5. Sin frame -> SVG esperando
  return new NextResponse(getSvg(`ESPERANDO FRAME ${sn} CH-${canal}`), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache'
    }
  })
}

function getSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <rect fill="#0a0f1a" width="640" height="360"/>
    <circle cx="320" cy="150" r="20" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="100">
      <animateTransform attributeName="transform" type="rotate" from="0 320 150" to="360 320 150" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <text x="320" y="210" text-anchor="middle" fill="#f59e0b" font-family="monospace" font-size="14" font-weight="bold">${msg}</text>
    <text x="320" y="240" text-anchor="middle" fill="#666" font-family="monospace" font-size="11">Bridge en el PC Scorpion debe estar activo</text>
    <text x="320" y="260" text-anchor="middle" fill="#444" font-family="monospace" font-size="10">puerto 8000 - Vercel Blob + Supabase</text>
  </svg>`
}
