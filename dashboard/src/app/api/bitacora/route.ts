import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, id_abonado, comentario, tipo_evento, id_responsable, cuenta } = body

    const targetAction = action || 'crear'
    const targetUrl = `https://bitacora.gamasecurity.cl/api-bitacora.php?action=${targetAction}`

    // 1. Intentar envío como URLSearchParams (Formulario Estándar PHP)
    const formData = new URLSearchParams()
    if (id_abonado) formData.append('id_abonado', String(id_abonado))
    if (comentario) formData.append('comentario', String(comentario))
    if (tipo_evento) formData.append('tipo_evento', String(tipo_evento))
    if (id_responsable) formData.append('id_responsable', String(id_responsable))
    if (cuenta) formData.append('cuenta', String(cuenta))

    let response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    let responseText = await response.text()

    // 2. Fallback a JSON si la respuesta no es OK
    if (!response.ok || responseText.includes('error')) {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_abonado: id_abonado || cuenta,
          comentario,
          tipo_evento: tipo_evento || 1,
          id_responsable: id_responsable || 1
        })
      })
      responseText = await response.text()
    }

    return NextResponse.json({ ok: true, text: responseText })
  } catch (e: any) {
    console.error('Error proxying to bitacora:', e)
    return NextResponse.json({ error: e.message || 'Error al conectar con Bitácora' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'abonados'
    const q = searchParams.get('q') || ''

    const targetUrl = `https://bitacora.gamasecurity.cl/api-bitacora.php?action=${action}&q=${encodeURIComponent(q)}`
    const response = await fetch(targetUrl)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Error GET proxying bitacora:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
