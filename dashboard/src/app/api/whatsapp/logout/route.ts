import { NextResponse } from 'next/server'
import { getWhatsAppServerUrl } from '@/lib/supabase'

// Desconectar sesión WhatsApp y reiniciar
export async function POST() {
  try {
    const waServerUrl = await getWhatsAppServerUrl()
    const res = await fetch(`${waServerUrl}/api/logout`, {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message })
  }
}
