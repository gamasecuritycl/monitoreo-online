import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * ===============================================================================
 *  GAMA SEGURIDAD - DAHUA P2P CLOUD BRIDGE API ROUTE (VERCEL & LOCAL STACK)
 * ===============================================================================
 *  Propósito: Proxy seguro HTTPS/Serverless para túneles P2P Dahua por SN.
 *  Evita bloqueos de Mixed Content (ws:// vs https://) en navegadores web.
 * ===============================================================================
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sn = searchParams.get('sn') || ''
  const user = searchParams.get('user') || 'admin'
  const pass = searchParams.get('pass') || ''
  const canal = searchParams.get('canal') || '1'

  if (!sn) {
    return NextResponse.json({ error: 'Número de Serie (SN) requerido' }, { status: 400 })
  }

  // 1. Intentar conexión P2P con Relay Dahua / Gateway Local
  const localGatewayUrl = process.env.DAHUA_P2P_BRIDGE_URL || 'http://10.99.0.1:8000'
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const resp = await fetch(`${localGatewayUrl}/snapshot?sn=${sn}&user=${user}&pass=${encodeURIComponent(pass)}&canal=${canal}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DahuaNetSDK-P2P/2.0'
      }
    })
    clearTimeout(timeoutId)

    if (resp.ok) {
      const buffer = await resp.arrayBuffer()
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Dahua-P2P-Status': 'ONLINE_DIRECT'
        }
      })
    }
  } catch (e) {
    // Si el Gateway Local 10.99.0.1 no está al alcance desde Vercel Cloud:
    // Retornar respuesta de estado con diagnóstico claro para el Log Terminal
  }

  // 2. Respuesta de Diagnóstico Servidor P2P
  return NextResponse.json({
    status: 'DIAGNOSTICO_P2P',
    sn,
    canal,
    user,
    msg: `Solicitud P2P enviada para SN [${sn}]. Esperando respuesta de túnel NAT Dahua.`,
    causas: [
      'El servidor local SCORPION_DEPLOY debe estar ejecutándose con sincronizador.py / dahua_p2p_bridge.py',
      'El DVR/NVR Dahua debe tener el interruptor P2P activado en Menú > Red > P2P (Estado: En línea)',
      'Verificar contraseña del usuario admin en el equipo físico Dahua'
    ]
  }, { status: 200 })
}
