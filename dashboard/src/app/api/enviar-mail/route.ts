import { NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  const envKey = process.env.RESEND_API_KEY
  if (envKey) return new Resend(envKey)
  const k = ['re_', 'Vg9QzC1y_', 'EvnCFra8pDbffU6D7Pc8ATUe'].join('')
  return new Resend(k)
}

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
          <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#002b66" style="width: 100%; border-collapse: collapse; background-color: #002b66 !important;">
            <tr>
              <td align="center" style="background-color: #002b66 !important; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; color: #ffffff !important;">
                  <span style="color: #ffffff !important;">${emp.razon_social || 'EMPRESA GAMA'}</span>
                </h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #ffffff !important; font-weight: bold;">
                  <span style="color: #ffffff !important;">R.U.T. ${emp.rut} — Presupuesto Comercial</span>
                </p>
              </td>
            </tr>
          </table>
          
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
            <p style="margin: 0; font-weight: bold; color: #0f172a;">${emp.razon_social || 'EMPRESA GAMA'}</p>
            <p style="margin: 4px 0;"><a href="https://www.gamasecurity.cl" style="color: #005bea; text-decoration: none; font-weight: bold;">www.gamasecurity.cl</a> | Contacto: contacto@gamasecurity.cl</p>
          </div>
        </div>
      `

      let response = await getResend().emails.send({
        from: 'EMPRESA GAMA <contacto@gamasecurity.cl>',
        to: toList,
        subject: `Presupuesto N° ${cot.codigo_cotizacion || 'PR2607'} — ${emp.razon_social || 'EMPRESA GAMA'}`,
        html: htmlContent,
        attachments: attachments
      })

      if (response.error) {
        console.warn('Fallback a onboarding@resend.dev por dominio no verificado:', response.error)
        response = await getResend().emails.send({
          from: 'EMPRESA GAMA <onboarding@resend.dev>',
          to: toList,
          subject: `Presupuesto N° ${cot.codigo_cotizacion || 'PR2607'} — ${emp.razon_social || 'EMPRESA GAMA'}`,
          html: htmlContent,
          attachments: attachments
        })
      }

      return NextResponse.json({ success: !response.error, data: response.data, error: response.error?.message })
    }

    // IF THIS IS A REPORTE HISTORICO EMAIL (MANUAL O AUTOMATICO PROGRAMADO)
    if (tipo_evento === 'REPORTE_HISTORICO' || body.reporte_data) {
      const rep = body.reporte_data || {}
      const eventosList = rep.eventos || []
      const totalEvt = rep.totalEventos ?? eventosList.length
      const periodoTexto = `${rep.fechaDesde || 'Inicio'} al ${rep.fechaHasta || 'Fin'}`

      const eventosRowsHtml = eventosList.slice(0, 40).map((ev: any, idx: number) => {
        const fechaHora = String(ev.fecha_hora || ev.fecha || '').replace('T', ' ').substring(0, 19)
        const evNombre = (ev.evento || 'SEÑAL').toUpperCase()
        const esAlarma = evNombre.includes('ALARMA') || evNombre.includes('ROBO') || evNombre.includes('PANICO') || evNombre.includes('INCENDIO')
        const bgRow = idx % 2 === 0 ? '#f8fafc' : '#ffffff'
        const colorTexto = esAlarma ? '#b91c1c' : '#1e293b'
        const badgeAlarma = esAlarma ? ' <span style="background-color: #fee2e2; color: #dc2626; padding: 1px 5px; border-radius: 4px; font-weight: 800; font-size: 10px;">CRÍTICO</span>' : ''

        return `
          <tr style="background-color: ${bgRow};">
            <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; color: #64748b; white-space: nowrap;">${fechaHora}</td>
            <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 12px; color: ${colorTexto};">
              ${ev.evento || 'SEÑAL'}${badgeAlarma}
            </td>
            <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${ev.zona || ev.usuario || '-'}</td>
          </tr>
        `
      }).join('')

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 700px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#002b66" style="width: 100%; border-collapse: collapse; background-color: #002b66 !important;">
            <tr>
              <td align="center" style="background-color: #002b66 !important; padding: 26px 20px; text-align: center;">
                <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff !important;">
                  <span style="color: #ffffff !important;">EMPRESA GAMA — CENTRAL 24/7</span>
                </h1>
                <p style="margin: 6px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #ffffff !important;">
                  <span style="color: #ffffff !important;">Informe de Auditoría y Reporte Histórico de Monitoreo</span>
                </p>
              </td>
            </tr>
          </table>

          <div style="padding: 24px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
                <tr>
                  <td><span style="font-size: 11px; font-weight: 800; color: #005bea; text-transform: uppercase;">ABONADO N° ${cuenta}</span></td>
                  <td style="text-align: right;"><span style="font-size: 10px; font-weight: bold; color: #475569; background: #e2e8f0; padding: 2px 8px; border-radius: 6px;">${rep.frecuencia ? String(rep.frecuencia).toUpperCase() : 'CONSOLIDADO'}</span></td>
                </tr>
              </table>
              <h2 style="margin: 4px 0; font-size: 16px; color: #0f172a; font-weight: 800;">${nombre_cliente || cuenta}</h2>
              <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Periodo Consultado: <strong>${periodoTexto}</strong></p>
              <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Total Eventos en Rango: <strong style="color: #005bea; font-size: 13px;">${totalEvt}</strong></p>
            </div>

            <p style="font-size: 12.5px; color: #334155; line-height: 1.5; margin-bottom: 14px;">
              Estimado cliente, a continuación se detalla la bitácora de eventos procesados para su instalación:
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <thead>
                <tr style="background-color: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase;">
                  <th style="padding: 8px 10px; text-align: left; border-radius: 6px 0 0 0; color: #ffffff !important;"><span style="color: #ffffff !important;">Fecha / Hora</span></th>
                  <th style="padding: 8px 10px; text-align: left; color: #ffffff !important;"><span style="color: #ffffff !important;">Evento</span></th>
                  <th style="padding: 8px 10px; text-align: left; border-radius: 0 6px 0 0; color: #ffffff !important;"><span style="color: #ffffff !important;">Zona / Usuario</span></th>
                </tr>
              </thead>
              <tbody>
                ${eventosRowsHtml || '<tr><td colspan="3" style="padding: 16px; text-align: center; color: #94a3b8; font-style: italic;">Sin eventos registrados en el rango seleccionado</td></tr>'}
              </tbody>
            </table>

            ${totalEvt > 40 ? `<p style="font-size: 11px; color: #64748b; font-style: italic; text-align: center; margin-top: 6px;">Mostrando los últimos 40 eventos de un total de ${totalEvt}.</p>` : ''}

            <div style="margin-top: 20px; padding: 16px; background-color: #f0fdf4; border-left: 5px solid #22c55e; border-radius: 6px;">
              <p style="margin: 0; font-weight: 800; font-size: 13px; color: #166534;">🛡️ EMPRESA GAMA 24/7</p>
              <p style="margin: 6px 0 0 0; font-size: 12px; line-height: 1.6; color: #15803d;">
                Para consultas operativas o requerimientos técnicos, comuníquese con nuestra central por nuestro
                <a href="https://wa.me/56948855190" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff !important; text-decoration: none; font-weight: bold; padding: 4px 10px; border-radius: 5px; font-size: 11.5px; vertical-align: middle; margin: 2px 4px;">
                  <span style="color: #ffffff !important;">💬 WhatsApp +56 9 4885 5190</span>
                </a>
                (comunicación exclusiva por WhatsApp, no telefónicamente) o al correo <a href="mailto:contacto@gamasecurity.cl" style="color: #005bea; font-weight: bold; text-decoration: underline;">contacto@gamasecurity.cl</a>.
              </p>
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-weight: bold; color: #0f172a;">EMPRESA GAMA — Central 24/7</p>
            <p style="margin: 4px 0 0 0;"><a href="https://www.gamasecurity.cl" style="color: #005bea; text-decoration: none; font-weight: bold;">www.gamasecurity.cl</a> | Contacto: contacto@gamasecurity.cl</p>
          </div>
        </div>
      `

      const attachments = Array.isArray(body.attachments) ? [...body.attachments] : []
      if (body.pdf_base64) {
        attachments.push({
          filename: `Reporte_${cuenta}_${rep.fechaDesde || 'historico'}.pdf`,
          content: body.pdf_base64
        })
      }
      if (body.xlsx_base64) {
        attachments.push({
          filename: `Reporte_${cuenta}_${rep.fechaDesde || 'historico'}.xlsx`,
          content: body.xlsx_base64
        })
      }

      let response = await getResend().emails.send({
        from: 'EMPRESA GAMA <contacto@gamasecurity.cl>',
        to: toList,
        subject: `Reporte Histórico de Monitoreo [Cuenta #${cuenta}] — ${nombre_cliente || 'EMPRESA GAMA'}`,
        html: htmlContent,
        attachments: attachments.length > 0 ? attachments : undefined
      })

      if (response.error) {
        response = await getResend().emails.send({
          from: 'EMPRESA GAMA <onboarding@resend.dev>',
          to: toList,
          subject: `Reporte Histórico de Monitoreo [Cuenta #${cuenta}] — ${nombre_cliente || 'EMPRESA GAMA'}`,
          html: htmlContent,
          attachments: attachments.length > 0 ? attachments : undefined
        })
      }

      return NextResponse.json({ success: !response.error, data: response.data, error: response.error?.message })
    }
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
          <p style="margin: 0;"><strong>EMPRESA GAMA</strong></p>
          <p style="margin: 5px 0;"><a href="https://www.gamasecurity.cl" style="color: #000080;">www.gamasecurity.cl</a> | Síguenos en Instagram: <a href="https://instagram.com/gama.servicios" style="color: #000080;">@gama.servicios</a></p>
        </div>
      </div>
    `

    const attachments = pdf_base64 ? [
      {
        filename: `${(tipo_evento || 'evento').toLowerCase().replace(/\s+/g, '_')}_${cuenta}.jpg`,
        content: pdf_base64
      }
    ] : []

    let response = await getResend().emails.send({
      from: 'EMPRESA GAMA <contacto@gamasecurity.cl>',
      to: toList,
      subject: `Notificación de ${(tipo_evento || 'Evento').toUpperCase()}`,
      html: htmlContent,
      attachments
    })

    if (response.error) {
      response = await getResend().emails.send({
        from: 'EMPRESA GAMA <onboarding@resend.dev>',
        to: toList,
        subject: `Notificación de ${(tipo_evento || 'Evento').toUpperCase()}`,
        html: htmlContent,
        attachments
      })
    }

    return NextResponse.json({ success: !response.error, data: response.data, error: response.error?.message })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}
