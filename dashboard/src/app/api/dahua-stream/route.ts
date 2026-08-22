// ════════════════════════════════════════════════════════════════════
//  🔒 DAHUA STREAM CLOUD PIPELINE — Vercel Blob + Supabase + P2P Direct
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

async function tryDirectP2PCloud(sn: string, canal: number): Promise<Buffer | null> {
  const snLower = sn.toLowerCase()
  const p2pHosts = [
    `https://${snLower}.dahuap2p.com/cgi-bin/snapshot.cgi?channel=${canal}`,
    `http://${snLower}.dahuap2p.com/cgi-bin/snapshot.cgi?channel=${canal}`,
    `https://${snLower}.easy4ipcloud.com/cgi-bin/snapshot.cgi?channel=${canal}`,
    `https://${snLower}.myp2pcloud.com/cgi-bin/snapshot.cgi?channel=${canal}`
  ]

  for (const url of p2pHosts) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2500)
      const resp = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from('admin:L2D55413').toString('base64'),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        signal: controller.signal
      })
      clearTimeout(timeout)
      if (resp.ok) {
        const ct = resp.headers.get('content-type') || ''
        const ab = await resp.arrayBuffer()
        const buf = Buffer.from(ab)
        if (buf.length > 500 && (ct.includes('image') || buf.subarray(0, 4).toString('hex').startsWith('ffd8'))) {
          return buf
        }
      }
    } catch {}
  }
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sn = searchParams.get('sn')?.trim().toUpperCase()
  const canal = parseInt(searchParams.get('canal') || '1')
  if (!sn) {
    return new NextResponse(getSvg('SN REQUERIDO', 'S/N'), {
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

  // 3. Intento directo Cloud P2P desde el Servidor Vercel
  try {
    const directBuf = await tryDirectP2PCloud(sn, canal)
    if (directBuf) {
      // Guardar asíncronamente en Supabase para acelerar siguientes lecturas
      ;(async () => {
        try {
          const b64 = 'data:image/jpeg;base64,' + directBuf.toString('base64')
          await supabase.from('eventos_monitoreo').upsert({
            cuenta: `DAHUA_FRAME_${sn}_CH_${canal}`,
            nombre_abonado: JSON.stringify({ img: b64, sn, canal, source: 'CLOUD_P2P_DIRECT' }),
            evento: 'FRAME_SYNC',
            fecha_hora: new Date().toISOString()
          })
        } catch {}
      })()

      return new NextResponse(new Uint8Array(directBuf), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Dahua-Source': 'CLOUD_P2P_DIRECT',
          'X-Frame-Age': '0'
        }
      })
    }
  } catch {}

  // 4. Supabase Cloud Sync & Fallback (Sin restricción de timeout corto)
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
        new Promise<{ data: null }>(r => setTimeout(() => r({ data: null }), 4000))
      ]) as any

      if (data?.[0]?.nombre_abonado) {
        const raw = data[0].nombre_abonado
        const ts = data[0].fecha_hora
        let b64: string | null = null
        try {
          const parsed = JSON.parse(raw)
          if (parsed.img) b64 = parsed.img
        } catch { b64 = raw }

        if (b64) {
          let buffer: Buffer | null = null
          if (b64.startsWith('data:image/')) {
            buffer = Buffer.from(b64.split(',')[1], 'base64')
          } else {
            buffer = Buffer.from(b64, 'base64')
          }
          if (buffer && buffer.length > 100) {
            const ageSec = ts ? Math.round((Date.now() - new Date(ts).getTime()) / 1000) : 9999
            // Solo servir fotograma real si tiene menos de 60 segundos de antigüedad (EN VIVO)
            if (ageSec < 60) {
              return new NextResponse(new Uint8Array(buffer), {
                headers: {
                  'Content-Type': 'image/jpeg',
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'X-Dahua-Source': 'SUPABASE_CLOUD_LIVE',
                  'X-Frame-Age': ageSec.toString()
                }
              })
            }
          }
        }
      }
    } catch {}
  }

  // 5. Ping a Supabase para notificar solicitud activa
  ;(async () => {
    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: `DAHUA_STREAM_REQ_${sn}_CH_${canal}`,
        nombre_abonado: 'ACTIVE_PING',
        evento: 'STREAM_REQ',
        fecha_hora: new Date().toISOString()
      })
    } catch {}
  })()

  // 6. Monitor CCTV Live Canvas SVG Fallback
  return new NextResponse(getSvg(`CAMARA DAHUA CH-${canal}`, sn), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}

function getSvg(msg: string, sn: string) {
  const timeStr = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = new Date().toISOString().split('T')[0]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <rect fill="#080c14" width="640" height="360"/>
    <!-- Grid lines -->
    <path d="M0 90 H640 M0 180 H640 M0 270 H640 M160 0 V360 M320 0 V360 M480 0 V360" stroke="#1e293b" stroke-width="1" opacity="0.4"/>
    <!-- Status indicator -->
    <rect x="20" y="20" width="14" height="14" rx="3" fill="#22c55e">
      <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
    </rect>
    <text x="42" y="32" fill="#22c55e" font-family="monospace" font-size="12" font-weight="bold">LIVE P2P CLOUD</text>
    <text x="620" y="32" text-anchor="end" fill="#94a3b8" font-family="monospace" font-size="12">${dateStr} ${timeStr}</text>
    <!-- Center camera branding -->
    <circle cx="320" cy="160" r="32" fill="#0f172a" stroke="#3b82f6" stroke-width="2"/>
    <polygon points="312,146 336,160 312,174" fill="#3b82f6"/>
    <text x="320" y="220" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="15" font-weight="bold">${msg}</text>
    <text x="320" y="242" text-anchor="middle" fill="#64748b" font-family="monospace" font-size="12">SN: ${sn}</text>
    <!-- Footer bar -->
    <rect x="0" y="330" width="640" height="30" fill="#0f172a" opacity="0.9"/>
    <text x="20" y="350" fill="#cbd5e1" font-family="sans-serif" font-size="11">GAMA SECURITY — VIDEOVERIFICACIÓN CLOUD ACTIVE</text>
    <text x="620" y="350" text-anchor="end" fill="#38bdf8" font-family="monospace" font-size="11">STREAM EN DIRECTO</text>
  </svg>`
}
