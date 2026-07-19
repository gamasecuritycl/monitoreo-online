import { NextResponse } from 'next/server'

const WA_SERVER = 'https://gama-whatsapp.zeabur.app'

// Proxy del estado del servidor WhatsApp (evita CORS desde el browser)
export async function GET() {
  try {
    const res = await fetch(`${WA_SERVER}/api/status`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      ready: false,
      estado: 'SERVIDOR_APAGADO',
      hasQR: false,
      cola: 0,
      usuario: null,
    })
  }
}
