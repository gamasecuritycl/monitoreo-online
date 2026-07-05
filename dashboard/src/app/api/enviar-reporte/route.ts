import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend('re_bS2Vvjtc_7SZkVjCa9MiEc5YfsLQFyDjf')

export async function POST(req: Request) {
  try {
    const { destino, asunto, html } = await req.json()
    if (!destino || !asunto || !html) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }
    await resend.emails.send({
      from: 'Gama Seguridad <reportes@gamasecurity.cl>',
      to: [destino],
      subject: asunto,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
