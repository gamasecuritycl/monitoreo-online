import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * ===============================================================================
 *  GAMA SEGURIDAD - DAHUA NVR / DVR / XVR MULTI-CHANNEL STREAM ROUTE (v2.1)
 * ===============================================================================
 *  Mejoras:
 *  - Verifica frescura del frame: NO devuelve frames congelados (>5s de antiguedad)
 *  - Si el frame es viejo, muestra "CONECTANDO..." en vez de la imagen congelada
 *  - Headers de diagnostico mejorados
 * ===============================================================================
 */

function getSvgConnecting(sn: string, canal: string, message: string): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toLocaleTimeString('es-CL', { hour12: false })
  return 
  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="100%" stop-color="#020408"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#bg)"/>
    <rect x="8" y="8" width="624" height="344" fill="none" stroke="#22c55e" stroke-width="1.5" rx="6"/>
    <text x="30" y="32" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">Dahua NVR/DVR</text>
    <text x="470" y="32" fill="#ffffff" font-family="monospace" font-size="13" font-weight="bold"> </text>
    <circle cx="30" cy="52" r="6" fill="#eab308">
      <animate attributeName="fill" values="#eab308;#f97316;#eab308" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <text x="44" y="56" fill="#eab308" font-family="monospace" font-size="11" font-weight="bold">CONECTANDO P2P (CANAL )</text>
    <text x="320" y="180" fill="#fef08a" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle"></text>
    <rect x="24" y="260" width="460" height="75" fill="#000000" opacity="0.88" rx="6" stroke="#1e293b"/>
    <text x="38" y="282" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">NVR / DVR DAHUA MULTICANAL</text>
    <text x="38" y="301" fill="#eab308" font-family="monospace" font-size="11">SN:  | CANAL ACTIVO: </text>
    <text x="38" y="319" fill="#22c55e" font-family="monospace" font-size="11">ESTADO: </text>
  </svg>
  
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sn = (searchParams.get('sn') || '').trim().toUpperCase()
  const user = searchParams.get('user') || 'admin'
  const pass = searchParams.get('pass') || 'L2D55413'
  const canal = searchParams.get('canal') || '1'

  if (!sn) {
    return new NextResponse(getSvgConnecting('---', canal, 'SIN SN CONFIGURADO'), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache, no-store' }
    })
  }

  // Registrar peticion activa en Supabase para activar el bridge local
  const streamKey = DAHUA_STREAM_REQ__CH_
  try {
    const { data } = await supabase.from('eventos_monitoreo').update({
      fecha_hora: new Date().toISOString()
    }).eq('cuenta', streamKey).select()

    if (!data || data.length === 0) {
      await supabase.from('eventos_monitoreo').insert({
        cuenta: streamKey,
        nombre_abonado: 'ACTIVE_PING',
        evento: 'STREAM_REQ',
        fecha_hora: new Date().toISOString()
      })
    }
  } catch (e) {
    console.error('[DAHUA-STREAM] Error registrando request:', e)
  }

  // 1. Intentar bridge local (solo funciona si el bridge corre en el mismo servidor que Vercel - usualmente falla)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1200)
    const resp = await fetch(http://127.0.0.1:8000/snapshot?sn=&user=&pass=&canal=, {
      signal: controller.signal,
      headers: { 'User-Agent': 'DMSS/5.0 DahuaP2PClient' }
    })
    clearTimeout(timeoutId)
    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || ''
      const buffer = await resp.arrayBuffer()
      if (buffer.byteLength > 1000 && contentType.includes('image')) {
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Dahua-P2P-Status': 'ONLINE_LOCAL'
          }
        })
      }
    }
  } catch (e) {
    // Bridge local no disponible, continuar con Supabase cloud
  }

  // 2. Consultar frames en Supabase Cloud con VERIFICACION DE FRESCURA
  const cuentasConsultar = [DAHUA_FRAME__CH_, DAHUA_FRAME_]

  for (const cta of cuentasConsultar) {
    try {
      const { data: dbFrame } = await supabase
        .from('eventos_monitoreo')
        .select('nombre_abonado, fecha_hora')
        .eq('cuenta', cta)
        .order('id', { ascending: false })
        .limit(1)

      if (dbFrame && dbFrame.length > 0 && dbFrame[0].nombre_abonado) {
        const rawValue = dbFrame[0].nombre_abonado
        const frameTimeRaw = dbFrame[0].fecha_hora || ''

        // Intentar extraer timestamp interno del JSON (nuevo formato bridge v2)
        let internalTs: string | null = null
        let b64image: string | null = null

        try {
          // Intentar parsear como JSON con timestamp interno
          const parsed = JSON.parse(rawValue)
          if (parsed.ts && parsed.img) {
            internalTs = parsed.ts
            b64image = parsed.img
          }
        } catch (e) {
          // No es JSON, formato legacy
          b64image = rawValue
        }

        if (!b64image) b64image = rawValue

        // Determinar el mejor timestamp disponible
        const bestTimestamp = internalTs || frameTimeRaw
        let isFresh = false
        let ageSeconds = 999

        if (bestTimestamp) {
          const frameDate = new Date(bestTimestamp)
          const now = new Date()
          ageSeconds = (now.getTime() - frameDate.getTime()) / 1000
          isFresh = ageSeconds < 5 // menos de 5 segundos = fresco
        }

        console.log([DAHUA-STREAM] Frame  CH-: edad=s, fresco=, ts=)

        if (isFresh) {
          // Decodificar base64
          let buffer: Buffer | null = null
          if (b64image.startsWith('data:image/')) {
            const parts = b64image.split(',')
            if (parts.length === 2) {
              buffer = Buffer.from(parts[1], 'base64')
            }
          } else {
            try {
              buffer = Buffer.from(b64image, 'base64')
            } catch (e) {}
          }

          if (buffer && buffer.length > 100) {
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Dahua-P2P-Status': 'ONLINE_CLOUD_FRESH',
                'X-Dahua-Frame-Age': ageSeconds.toFixed(1),
                'X-Dahua-Frame-Time': bestTimestamp
              }
            })
          }
        } else {
          // Frame existe pero es viejo: NO devolverlo para evitar congelamiento
          console.log([DAHUA-STREAM] Frame STALE para  CH- (s) - esperando frame fresco...)
        }
      }
    } catch (err) {
      console.error([DAHUA-STREAM] Error consultando frame para :, err)
    }
  }

  // 3. No hay frame fresco - devolver SVG de "conectando"
  const msg = sn ? ESPERANDO FRAME FRESCO... (SN:  CH: ) : 'CONFIGURANDO...'
  return new NextResponse(getSvgConnecting(sn, canal, msg), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Dahua-P2P-Status': 'CONNECTING'
    }
  })
}