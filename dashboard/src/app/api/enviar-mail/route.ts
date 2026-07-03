import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend('re_bS2Vvjtc_7SZkVjCa9MiEc5YfsLQFyDjf')

export async function POST(req: Request) {
  try {
    const { cuenta, nombre_cliente, tipo_evento, fecha_hora, destinatarios } = await req.json()

    if (!destinatarios || destinatarios.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 })
    }

    // Parse date for display
    let fechaFormat = fecha_hora
    let horaFormat = ''
    try {
      const d = new Date(fecha_hora)
      const dia = d.getDate().toString().padStart(2, '0')
      const mes = (d.getMonth() + 1).toString().padStart(2, '0')
      const anio = d.getFullYear().toString().slice(-2) // AA
      const hora = d.getHours().toString().padStart(2, '0')
      const min = d.getMinutes().toString().padStart(2, '0')
      fechaFormat = `${dia}/${mes}/${anio}`
      horaFormat = `${hora}:${min}`
    } catch (e) {
      // fallback if parse fails
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #000080; padding: 20px; text-align: center;">
          <img src="https://dashboard-ten-self-68.vercel.app/logo-CASAS.png" alt="Gama Security" style="max-height: 80px;" />
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #000080;">Notificación de ${tipo_evento.toUpperCase()}</h2>
          <p>Estimado Cliente <strong>${nombre_cliente || cuenta}</strong>,</p>
          <p>Junto con saludar le informamos que se recibió una señal de <strong>${tipo_evento.toUpperCase()}</strong>, el <strong>${fechaFormat}</strong> a las <strong>${horaFormat}</strong>.</p>
          <p>Si desconoce este evento póngase en contacto a nuestro WhatsApp haciendo clic en el siguiente enlace:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="https://wa.me/56948855190" style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Contactar por WhatsApp
            </a>
          </p>
          <p>O escríbanos a <a href="mailto:contacto@gamasecurity.cl">contacto@gamasecurity.cl</a>.</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;"><strong>GAMA SERVICIOS LIMITADA</strong></p>
          <p style="margin: 5px 0;"><a href="https://www.gamasecurity.cl" style="color: #000080;">www.gamasecurity.cl</a> | Síguenos en Instagram: <a href="https://instagram.com/gama.servicios" style="color: #000080;">@gama.servicios</a></p>
        </div>
      </div>
    `

    const data = await resend.emails.send({
      from: 'Gama Security <contacto@gamasecurity.cl>',
      to: destinatarios,
      subject: `Notificación de ${tipo_evento.toUpperCase()}`,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
