import { NextResponse } from 'next/server'

const WA_SERVER = 'https://gama-whatsapp.zeabur.app'

// Desconectar sesión WhatsApp y reiniciar
export async function POST() {
  try {
    const res = await fetch(`${WA_SERVER}/api/logout`, {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
