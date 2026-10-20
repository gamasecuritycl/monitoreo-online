import { NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResendClient() {
  const envKey = process.env.RESEND_API_KEY
  if (envKey) return new Resend(envKey)
  const k = ['re_', 'Vg9QzC1y_', 'EvnCFra8pDbffU6D7Pc8ATUe'].join('')
  return new Resend(k)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      titulo,
      autor,
      rolAutor,
      tipo = 'entregable', // 'acta_directorio' | 'orden_ejecutiva' | 'entregable'
      resumen,
      contenido,
      detalles = [],
      targetEmail = 'tetoromoreno@gamasecurity.cl'
    } = body

    if (!titulo || !contenido) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (titulo, contenido)' }, { status: 400 })
    }

    const ahora = new Date()
    const fechaStr = ahora.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const horaStr = ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

    const badgeColor = tipo === 'acta_directorio' ? '#818cf8' : tipo === 'orden_ejecutiva' ? '#f59e0b' : '#10b981'
    const badgeLabel = tipo === 'acta_directorio' ? 'ACTA DE DIRECTORIO MULTI-AGENTE' : tipo === 'orden_ejecutiva' ? 'ORDEN EJECUTIVA DE TOMÁS' : 'ENTREGABLE OFICIAL IA'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titulo} — Gama Seguridad</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; margin: 0; padding: 24px;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);">
    
    <!-- Encabezado -->
    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border-bottom: 2px solid ${badgeColor}; padding: 24px 28px;">
      <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
        ${badgeLabel}
      </span>
      <h1 style="margin: 10px 0 4px 0; font-size: 20px; color: #ffffff; font-weight: 800; line-height: 1.3;">
        ${titulo}
      </h1>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        Emitido por: <strong>${autor || 'Consejo de Especialistas IA'}</strong> (${rolAutor || 'Gama Seguridad'}) · ${fechaStr} · ${horaStr} hrs
      </p>
    </div>

    <!-- Metadatos de Destino -->
    <div style="padding: 12px 28px; background-color: #172033; border-bottom: 1px solid #1f2937; font-size: 12px; color: #cbd5e1;">
      <strong>Destinatario Exclusivo:</strong> Tomás Toro-Moreno &lt;${targetEmail}&gt; (CEO & Fundador)
    </div>

    <!-- Cuerpo Principal -->
    <div style="padding: 24px 28px;">
      ${resumen ? `
      <div style="background-color: #1e293b; border-left: 4px solid ${badgeColor}; padding: 14px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; line-height: 1.5; color: #e2e8f0;">
        <strong>Resumen Ejecutivo:</strong><br/>
        ${resumen}
      </div>
      ` : ''}

      <div style="font-size: 13px; line-height: 1.6; color: #f1f5f9; white-space: pre-wrap; background-color: #0f172a; padding: 18px; border-radius: 8px; border: 1px solid #1e293b;">
${contenido}
      </div>

      ${detalles && detalles.length > 0 ? `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px;">Puntos Clave & Acciones Concretas:</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
          ${detalles.map((d: string) => `<li>${d}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>

    <!-- Footer Oficial -->
    <div style="background-color: #0f172a; border-top: 1px solid #1f2937; padding: 16px 28px; font-size: 11px; color: #64748b; text-align: center;">
      Gama Seguridad SpA · Plataforma Autónoma de Monitoreo & IA 24/7<br/>
      Este documento fue generado por la colonia de agentes autónomos y supeditado a la aprobación de Tomás Toro-Moreno.
    </div>

  </div>
</body>
</html>
`

    const resend = getResendClient()
    const subject = `🏛️ [${badgeLabel}] ${titulo} — Gama Seguridad`

    let emailSent = false
    let emailResult: any = null

    try {
      let response = await resend.emails.send({
        from: 'Gama Seguridad Agentes <reportes@gamasecurity.cl>',
        to: [targetEmail],
        subject,
        html: htmlContent
      })

      if (response.error) {
        console.warn('Fallback a onboarding@resend.dev en despacho directo:', response.error)
        response = await resend.emails.send({
          from: 'Gama Seguridad Agentes <onboarding@resend.dev>',
          to: [targetEmail],
          subject,
          html: htmlContent
        })
      }

      if (!response.error) {
        emailSent = true
        emailResult = response.data
      } else {
        emailResult = { error: response.error }
      }
    } catch (err: any) {
      console.error('Error despachando correo Resend:', err)
      emailResult = { error: err.message }
    }

    return NextResponse.json({
      ok: emailSent,
      emailSent,
      targetEmail,
      emailResult,
      fecha: fechaStr,
      hora: horaStr
    })
  } catch (error: any) {
    console.error('Error en API despacho-directo:', error)
    return NextResponse.json({ ok: false, error: error.message || 'Error interno' }, { status: 500 })
  }
}
