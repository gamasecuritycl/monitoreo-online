import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cuenta, nombre_cliente, tipo_evento, fecha_hora, destinatarios, cotizacion, empresa_emisora, pdf_base64 } = body

    if (!destinatarios || (Array.isArray(destinatarios) && destinatarios.length === 0)) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 })
    }

    const toList = Array.isArray(destinatarios) ? destinatarios : [destinatarios]

    // IF THIS IS A COTIZACION / PRESUPUESTO EMAIL
    if (tipo_evento === 'COTIZACION' || cotizacion) {
      const cot = cotizacion || {}
      const emp = empresa_emisora || { razon_social: 'Gama Seguridad SpA', rut: '76.319.399-3', banco_nombre: 'Banco de Chile', banco_tipo_cuenta: 'Cuenta Corriente', banco_numero_cuenta: '00-123-45678-9', email_cobranza: 'cobranza@gamasecurity.cl' }

      const attachments = pdf_base64 ? [
        {
          filename: `Presupuesto_${cot.codigo_cotizacion || 'PR2607'}.pdf`,
          content: pdf_base64
        }
      ] : []

      const itemsHtml = (cot.items || []).map((it: any, idx: number) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #666;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #1e293b;">${it.descripcion}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold;">${it.cantidad}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">$${Math.round(it.precio_neto_unitario || 0).toLocaleString('es-CL')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-family: monospace; color: #0f172a;">$${Math.round((it.cantidad || 1) * (it.precio_neto_unitario || 0)).toLocaleString('es-CL')}</td>
        </tr>
      `).join('')

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #005bea; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; tracking-tight: -0.025em;">${emp.razon_social}</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">R.U.T. ${emp.rut} — Presupuesto Comercial DTE</p>
          </div>
          
          <div style="padding: 24px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: #005bea; text-transform: uppercase;">COTIZACIÓN N° ${cot.codigo_cotizacion || 'PR2607-0000'}</span>
                <span style="font-size: 11px; color: #64748b;">Fecha: ${cot.fecha || new Date().toLocaleDateString('es-CL')}</span>
              </div>
              <h2 style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 800;">${cot.nombre_cliente || nombre_cliente || 'Estimado Cliente'}</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Atención: <strong>${cot.contacto_persona || cot.nombre_cliente || 'Adquisiciones'}</strong> | RUT: ${cot.rut_cliente || 'S/RUT'}</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">Ciudad/Comuna: <strong>${cot.ciudad_cliente || 'Santiago'}</strong> | Dirección: ${cot.direccion || 'Dirección de Entrega'}</p>
            </div>

            <p style="font-size: 13px; color: #334155; line-height: 1.5;">
              Junto con saludarle, nos complace adjuntar en este correo la propuesta comercial oficial en formato PDF 📄 (y a continuación su desglose):
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
              <thead>
                <tr style="background-color: #f1f5f9; color: #334155; font-size: 11px; text-transform: uppercase; font-weight: bold;">
                  <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: center;">#</th>
                  <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left;">Descripción</th>
                  <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: center;">Cant.</th>
                  <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: right;">P. Unit</th>
                  <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="margin-top: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <table style="width: 100%; font-size: 13px;">
                <tr>
                  <td style="color: #64748b; font-weight: bold;">Subtotal Neto Afecto:</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">$${Math.round(cot.neto_con_descuento || 0).toLocaleString('es-CL')} ${cot.moneda_cotizacion || 'CLP'}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: bold; padding-top: 6px;">IVA (19% Ley 825):</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #0f172a; padding-top: 6px;">$${Math.round(cot.monto_iva || 0).toLocaleString('es-CL')} ${cot.moneda_cotizacion || 'CLP'}</td>
                </tr>
                <tr style="border-top: 2px solid #cbd5e1;">
                  <td style="font-size: 15px; font-weight: 800; color: #005bea; padding-top: 10px;">TOTAL GENERAL:</td>
                  <td style="text-align: right; font-size: 16px; font-family: monospace; font-weight: 800; color: #005bea; padding-top: 10px;">$${Math.round(cot.monto_total_iva_incluido || 0).toLocaleString('es-CL')} ${cot.moneda_cotizacion || 'CLP'}</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 24px; padding: 16px; background-color: #eff6ff; border-left: 4px solid #005bea; border-radius: 4px; font-size: 12px; color: #1e3a8a;">
              <p style="margin: 0 0 6px 0; font-weight: bold; text-transform: uppercase;">💳 Datos para Transferencia Bancaria:</p>
              <p style="margin: 2px 0;">Banco: <strong>${emp.banco_nombre || 'Banco de Chile'}</strong> — ${emp.banco_tipo_cuenta || 'Cuenta Corriente'}</p>
              <p style="margin: 2px 0;">N° Cuenta: <strong>${emp.banco_numero_cuenta || '00-123-45678-9'}</strong> | RUT: <strong>${emp.rut}</strong></p>
              <p style="margin: 2px 0;">Correo de Cobranza: <strong>${emp.email_cobranza || 'cobranza@gamasecurity.cl'}</strong></p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #3b82f6;">• Validez de la oferta: ${cot.validez_dias || 15} días hábiles. Se adjunta PDF oficial en este correo.</p>
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-weight: bold; color: #0f172a;">${emp.razon_social}</p>
            <p style="margin: 4px 0;"><a href="https://www.gamasecurity.cl" style="color: #005bea; text-decoration: none; font-weight: bold;">www.gamasecurity.cl</a> | Contacto: contacto@gamasecurity.cl</p>
          </div>
        </div>
      `

      const data = await resend.emails.send({
        from: 'Gama Security <contacto@gamasecurity.cl>',
        to: toList,
        subject: `Presupuesto DTE N° ${cot.codigo_cotizacion || 'PR2607'} — ${emp.razon_social}`,
        html: htmlContent,
        attachments: attachments
      })

      return NextResponse.json({ success: true, data })
    }

    // FALLBACK: GENERAL NOTIFICATION EMAIL
    let fechaFormat = fecha_hora
    let horaFormat = ''
    try {
      const d = new Date(fecha_hora || Date.now())
      fechaFormat = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(d)

      horaFormat = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(d)
    } catch (e) {}

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #000080; padding: 20px; text-align: center;">
          <img src="https://dashboard-eight-sable-51.vercel.app/logo-CASAS.png" alt="Gama Security" style="max-height: 80px;" />
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #000080;">Notificación de ${(tipo_evento || 'Evento').toUpperCase()}</h2>
          <p>Estimado Cliente <strong>${nombre_cliente || cuenta}</strong>,</p>
          <p>Junto con saludar le informamos que se recibió una señal de <strong>${(tipo_evento || 'Evento').toUpperCase()}</strong>, el <strong>${fechaFormat}</strong> a las <strong>${horaFormat}</strong>.</p>
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
      to: toList,
      subject: `Notificación de ${(tipo_evento || 'Evento').toUpperCase()}`,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}
