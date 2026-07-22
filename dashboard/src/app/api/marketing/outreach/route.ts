import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { leads, asunto, cuerpoHtml, remitente } = body

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron destinatarios para la campaña' }, { status: 400 })
    }

    if (!asunto || !cuerpoHtml) {
      return NextResponse.json({ error: 'Asunto y contenido del correo son obligatorios' }, { status: 400 })
    }

    const senderEmail = remitente || 'Gama Seguridad <contacto@gamasecurity.cl>'
    const resultados = []

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i]
      const emailTarget = lead.email ? lead.email.trim() : ''
      if (!emailTarget || !emailTarget.includes('@')) continue

      const asuntoPersonalizado = asunto.replace(/\{\{nombre_empresa\}\}/g, lead.empresa || 'Estimada Empresa')
                                        .replace(/\{\{contacto\}\}/g, lead.contacto || 'Encargado de Seguridad')

      const cuerpoPersonalizado = cuerpoHtml.replace(/\{\{nombre_empresa\}\}/g, lead.empresa || 'Estimada Empresa')
                                            .replace(/\{\{contacto\}\}/g, lead.contacto || 'Encargado de Seguridad')

      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #005bea; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase;">GAMA SEGURIDAD CHILE</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Soluciones Integrales de Monitoreo 24/7 & Seguridad Electrónica</p>
          </div>

          <div style="padding: 28px; line-height: 1.6; font-size: 14px; color: #334155;">
            ${cuerpoPersonalizado}
          </div>

          <div style="margin: 20px 28px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #005bea; border-radius: 6px; font-size: 12px; color: #475569;">
            <p style="margin: 0; font-weight: bold; color: #005bea;">GAMA SEGURIDAD SPA / GAMA SERVICIOS LIMITADA</p>
            <p style="margin: 4px 0 0 0;">Av. Valparaíso 1183, Viña del Mar | Fono: +56 32 3276011 | Web: <a href="https://www.gamasecurity.cl" style="color: #005bea; font-weight: bold; text-decoration: none;">www.gamasecurity.cl</a></p>
          </div>

          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;">Si no desea recibir más información comercial, responda a este correo solicitando la baja.</p>
          </div>
        </div>
      `

      try {
        const resendRes = await resend.emails.send({
          from: senderEmail,
          to: [emailTarget],
          subject: asuntoPersonalizado,
          html: htmlTemplate
        })
        resultados.push({ email: emailTarget, empresa: lead.empresa, status: 'sent', id: resendRes.data?.id })
      } catch (err: any) {
        console.error(`Error enviando a ${emailTarget}:`, err)
        resultados.push({ email: emailTarget, empresa: lead.empresa, status: 'error', error: err?.message || 'Fallo de entrega' })
      }
    }

    return NextResponse.json({
      success: true,
      totalProcesados: leads.length,
      totalExitosos: resultados.filter(r => r.status === 'sent').length,
      resultados
    })
  } catch (error: any) {
    console.error('Error en API de Outreach Marketing:', error)
    return NextResponse.json({ error: error?.message || 'Error interno en servidor Resend' }, { status: 500 })
  }
}
