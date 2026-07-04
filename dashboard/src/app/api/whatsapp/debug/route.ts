import { NextResponse } from 'next/server'

export async function GET() {
  const phone = '56991016912'
  const apikey = '4238719'
  const text = 'Prueba desde Vercel server'
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apikey}`

  try {
    const res = await fetch(url)
    const data = await res.text()
    return NextResponse.json({ ok: true, status: res.status, body: data, url })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message, url })
  }
}
