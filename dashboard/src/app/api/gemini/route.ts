import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })
  }

  const { prompt } = await req.json()
  if (!prompt) {
    return NextResponse.json({ error: 'Falta prompt' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 65536,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      const msg = data?.error?.message || `Error HTTP ${res.status}`
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const finishReason = data?.candidates?.[0]?.finishReason
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!texto) {
      return NextResponse.json({ error: 'Respuesta vacía de Gemini' }, { status: 500 })
    }
    if (finishReason === 'MAX_TOKENS') {
      return NextResponse.json({ ok: true, texto, truncado: true })
    }

    return NextResponse.json({ ok: true, texto, text: texto })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
