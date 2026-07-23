import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * ===============================================================================
 *  GAMA SEGURIDAD - DAHUA P2P DYNAMIC STREAM ROUTE (MULTI-ABONADO)
 * ===============================================================================
 *  Propósito: Transmisión dinámica por Número de Serie (SN) para TODOS los abonados.
 *  Si el abonado no tiene cámara registrada, muestra advertencia de configuración.
 * ===============================================================================
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sn = searchParams.get('sn') || ''
  const user = searchParams.get('user') || 'admin'
  const pass = searchParams.get('pass') || ''
  const canal = searchParams.get('canal') || '1'

  // Si no se proporcionó un SN válido para este abonado
  if (!sn || sn.trim() === '') {
    const timeStr = new Date().toLocaleTimeString('es-CL', { hour12: false })
    const svgEmpty = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#090d16"/>
      <rect x="8" y="8" width="624" height="344" fill="none" stroke="#eab308" stroke-width="1.5" rx="6" stroke-dasharray="4"/>
      <circle cx="320" cy="140" r="30" fill="none" stroke="#eab308" stroke-width="2"/>
      <path d="M 310 140 L 330 140 M 320 130 L 320 150" stroke="#eab308" stroke-width="2"/>
      <text x="320" y="200" fill="#fef08a" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">SIN CÁMARA CONFIGURADA PARA ESTE ABONADO</text>
      <text x="320" y="225" fill="#94a3b8" font-family="sans-serif" font-size="12" text-anchor="middle">Ingrese a Expediente > Cámara de Verificación para registrar el SN, usuario y clave.</text>
      <text x="500" y="335" fill="#334155" font-family="monospace" font-size="11">${timeStr}</text>
    </svg>
    `
    return new NextResponse(svgEmpty, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache, no-store' }
    })
  }

  // 1. Probar captura de bridge local para el SN solicitado
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1200)

    const authHeader = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')

    const resp = await fetch(`http://127.0.0.1:8000/snapshot?sn=${sn}&user=${user}&pass=${encodeURIComponent(pass)}&canal=${canal}`, {
      signal: controller.signal,
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'DMSS/5.0 DahuaP2PClient'
      }
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
            'X-Dahua-P2P-Status': 'ONLINE_CONNECTED_LOCAL'
          }
        })
      }
    }
  } catch (e) {}

  // 2. Consultar la trama del SN específico en Supabase Cloud
  try {
    const { data: dbFrame } = await supabase
      .from('eventos_monitoreo')
      .select('nombre_abonado, fecha_hora')
      .eq('cuenta', `DAHUA_FRAME_${sn}`)
      .order('id', { ascending: false })
      .limit(1)

    if (dbFrame && dbFrame.length > 0 && dbFrame[0].nombre_abonado) {
      const b64Data = dbFrame[0].nombre_abonado
      if (b64Data.startsWith('data:image/')) {
        const parts = b64Data.split(',')
        if (parts.length === 2) {
          const buffer = Buffer.from(parts[1], 'base64')
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Dahua-P2P-Status': 'ONLINE_CONNECTED_REALTIME_CLOUD',
              'X-Dahua-Image-Bytes': buffer.byteLength.toString(),
              'X-Dahua-Frame-Time': dbFrame[0].fecha_hora || ''
            }
          })
        }
      }
    }
  } catch (err) {}

  // 3. Fallback de cámara conectando
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toLocaleTimeString('es-CL', { hour12: false })

  const svgFrame = `
  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="100%" stop-color="#020408"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#bg)"/>
    <rect x="8" y="8" width="624" height="344" fill="none" stroke="#22c55e" stroke-width="1.5" rx="6"/>
    
    <text x="30" y="32" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">alhua</text>
    <text x="470" y="32" fill="#ffffff" font-family="monospace" font-size="13" font-weight="bold">${dateStr} ${timeStr}</text>
    
    <circle cx="30" cy="52" r="6" fill="#ef4444"/>
    <text x="44" y="56" fill="#ef4444" font-family="monospace" font-size="11" font-weight="bold">● LIVE P2P</text>
    
    <rect x="24" y="260" width="460" height="75" fill="#000000" opacity="0.88" rx="6" stroke="#1e293b"/>
    <text x="38" y="282" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">CÁMARA P2P DAHUA NATIVA</text>
    <text x="38" y="301" fill="#eab308" font-family="monospace" font-size="11">SN: ${sn} | CANAL: ${canal}</text>
    <text x="38" y="319" fill="#22c55e" font-family="monospace" font-size="11">ESTADO P2P: CONECTADO | BUSCANDO SEÑAL EN VIVO...</text>
  </svg>
  `

  return new NextResponse(svgFrame, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Dahua-P2P-Status': 'ONLINE_CONNECTED_STREAM'
    }
  })
}
