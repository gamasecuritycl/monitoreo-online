import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_bS2Vvjtc_7SZkVjCa9MiEc5YfsLQFyDjf')

export async function POST(req: Request) {
  try {
    const { destino, destinatarios, asunto, html, pdf_base64, nombre_archivo } = await req.json()
    
    const toList = Array.isArray(destinatarios) && destinatarios.length > 0
      ? destinatarios
      : destino
      ? [destino]
      : ['tetoromoreno@gamasecurity.cl', 'mrebolledo@gamasecurity.cl']

    if (!asunto || !html) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (asunto, html)' }, { status: 400 })
    }

    const attachments = pdf_base64 ? [
      {
        filename: nombre_archivo || `Levantamiento_Tecnico.pdf`,
        content: pdf_base64
      }
    ] : []

    const data = await resend.emails.send({
      from: 'Gama Seguridad <reportes@gamasecurity.cl>',
      to: toList,
      subject: asunto,
      html,
      attachments
    })

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    console.error('Error enviando reporte Resend:', e)
    return NextResponse.json({ error: e.message || 'Error al enviar email' }, { status: 500 })
  }
}
