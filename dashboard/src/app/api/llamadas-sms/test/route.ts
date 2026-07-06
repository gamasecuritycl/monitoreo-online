import { NextResponse } from 'next/server'

const CALLMEBOT_APIKEY = '4238719'

export async function POST(req: Request) {
  try {
    const { telefono, tipo } = await req.json()
    if (!telefono) {
      return NextResponse.json({ error: 'Falta teléfono' }, { status: 400 })
    }

    const telLimpio = telefono.replace(/[^0-9]/g, '')

    if (tipo === 'call') {
      // Disparar llamada de voz CallMeBot via WhatsApp
      const mensajeLlamada = `Alerta de prueba del Command Center de Gama Seguridad. Tu sistema de llamadas y SMS de emergencia está operando correctamente.`
      const params = new URLSearchParams({
        phone: telLimpio,
        text: mensajeLlamada,
        apikey: CALLMEBOT_APIKEY,
        lang: 'es-es',
      })
      const res = await fetch(`https://api.callmebot.com/start.php?${params.toString()}`)
      const text = await res.text()
      const success = res.ok && (text.toLowerCase().includes('queued') || text.toLowerCase().includes('success') || text.toLowerCase().includes('calling') || text.toLowerCase().includes('message'))
      
      return NextResponse.json({ success, debug: `callmebot_call: status=${res.status}, response=${text}` })
    } else {
      // Disparar SMS / Texto de prueba (via WhatsApp)
      const mensajeSMS = `🛡️ *GAMA SEGURIDAD*\n━━━━━━━━━━━━━━━━━━━━━\n\n💬 *SMS/TEXTO DE PRUEBA EXITOSO*\n\nEste es un mensaje de prueba de tu sistema de alertas del Command Center.`
      const params = new URLSearchParams({
        phone: telLimpio,
        text: mensajeSMS,
        apikey: CALLMEBOT_APIKEY,
      })
      const res = await fetch(`https://api.callmebot.com/whatsapp.php?${params.toString()}`)
      const text = await res.text()
      const success = res.ok && text.includes('queued')
      
      return NextResponse.json({ success, debug: `callmebot_sms: status=${res.status}, response=${text}` })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
