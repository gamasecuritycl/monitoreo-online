import { NextResponse } from 'next/server'

const WA_SERVER = 'https://gama-whatsapp.zeabur.app'

// Proxy del QR del servidor WhatsApp
export async function GET() {
  try {
    const res = await fetch(`${WA_SERVER}/api/qr`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ status: 'offline', qr: null, qrImage: null })
  }
}

// Solicitar Pairing Code
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const phone = body?.phone || '56948855190'
    const res = await fetch(`${WA_SERVER}/api/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
