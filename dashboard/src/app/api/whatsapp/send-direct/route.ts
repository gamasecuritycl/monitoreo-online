import { NextResponse } from 'next/server'

const CALLMEBOT_API = 'https://api.callmebot.com/whatsapp.php'
const CALLMEBOT_APIKEY = '4238719'

export async function POST(req: Request) {
  try {
    const { telefono, texto } = await req.json()
    if (!telefono || !texto) {
      return NextResponse.json({ ok: false, error: 'Faltan parámetros de envío' }, { status: 400 })
    }

    const telLimpio = telefono.replace(/[^0-9]/g, '')

    // Intento 1: Gateway Local Baileys/OpenWA si se encuentra activo en servidor
    try {
      const openwaRes = await fetch('http://localhost:3015/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: telLimpio, text: texto }),
        signal: AbortSignal.timeout(2000)
      })
      const openwaData = await openwaRes.json()
      if (openwaData?.ok) {
        return NextResponse.json({ ok: true, proveedor: 'openwa' })
      }
    } catch {}

    // Intento 2: Cloud Gateway Fallback (CallMeBot Server-Side)
    const params = new URLSearchParams({
      phone: telLimpio,
      text: texto,
      apikey: CALLMEBOT_APIKEY
    })

    const callmeRes = await fetch(`${CALLMEBOT_API}?${params.toString()}`)
    const callmeData = await callmeRes.text()
    const ok = callmeRes.ok && (callmeData.includes('Message queued') || callmeData.includes('success'))

    return NextResponse.json({ ok, proveedor: 'callmebot', debug: callmeData.slice(0, 120) })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
