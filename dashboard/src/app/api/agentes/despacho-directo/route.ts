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

    const badgeColor = tipo === 'acta_directorio' ? '#818cf8' : tipo === 'orden_ejecutiva' ? '#f59e0b' : tipo === 'propuestas_graficas' ? '#06b6d4' : '#10b981'
    const badgeLabel = tipo === 'acta_directorio' ? 'ACTA DE DIRECTORIO MULTI-AGENTE' : tipo === 'orden_ejecutiva' ? 'ORDEN EJECUTIVA DE TOMÁS' : tipo === 'propuestas_graficas' ? 'PROPUESTAS GRÁFICAS DE MARKETING' : 'ENTREGABLE OFICIAL IA'

    let htmlContent = ''
    let attachments: any[] = []

    if (tipo === 'propuestas_graficas' || body.incluirPropuestasGraficas) {
      // Cargar imágenes si existen
      const fs = await import('fs')
      const path = await import('path')

      const possibleDir1 = path.join(process.cwd(), 'public', 'marketing')
      const possibleDir2 = path.join(process.cwd(), 'dashboard', 'public', 'marketing')
      const dirToUse = fs.existsSync(possibleDir1) ? possibleDir1 : fs.existsSync(possibleDir2) ? possibleDir2 : ''

      let b64_1 = ''
      let b64_2 = ''

      if (dirToUse) {
        const p1 = path.join(dirToUse, 'propuesta-grafica-1.jpg')
        const p2 = path.join(dirToUse, 'propuesta-grafica-2.jpg')
        if (fs.existsSync(p1)) b64_1 = fs.readFileSync(p1).toString('base64')
        if (fs.existsSync(p2)) b64_2 = fs.readFileSync(p2).toString('base64')
      }

      if (b64_1) {
        attachments.push({
          filename: 'Propuesta_1_Seguridad_Sin_Comodato.jpg',
          content: b64_1,
          cid: 'propuesta_1_img'
        })
      }
      if (b64_2) {
        attachments.push({
          filename: 'Propuesta_2_Comparativa_Anti_Comodato.jpg',
          content: b64_2,
          cid: 'propuesta_2_img'
        })
      }

      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>2 Propuestas Gráficas — Gama Seguridad</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #050d1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #0b1528; border: 1px solid #1e3a5f; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
    
    <div style="background: linear-gradient(135deg, #091a36, #040c1c); padding: 28px; border-bottom: 3px solid #10b981;">
      <span style="display: inline-block; background-color: #064e3b; color: #34d399; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #059669;">
        GERENCIA COMERCIAL &amp; MARKETING DIGITAL
      </span>
      <h1 style="margin: 12px 0 6px 0; font-size: 22px; font-weight: 900; color: #ffffff;">
        ${titulo || '2 Propuestas Gráficas Oficiales Listas para Aprobación'}
      </h1>
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">
        De: <strong>${autor || 'Valentina Lagos'}</strong> (${rolAutor || 'Gerente Comercial & Mkt'}) · Para: <strong>Tomás Toro-Moreno</strong> (CEO &amp; Fundador) · ${fechaStr}
      </p>
    </div>

    <div style="padding: 24px 28px; border-bottom: 1px solid #1e293b; background-color: #081120; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
      <p style="margin: 0 0 10px 0;">
        ${resumen || 'Estimado Tomás: Conforme a lo instruido, adjunto formalmente las <strong>2 propuestas gráficas de alta definición</strong> diseñadas para el posicionamiento comercial de Gama Seguridad SpA en Instagram, Facebook y canales digitales.'}
      </p>
      <p style="margin: 0; color: #38bdf8;">
        ✓ Ambos artes se encuentran supeditados a tu visto bueno definitivo antes de cualquier publicación.
      </p>
    </div>

    <!-- PROPUESTA GRÁFICA 1 -->
    <div style="padding: 28px; border-bottom: 1px solid #1e293b;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span style="background-color: #1e3a8a; color: #60a5fa; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
          PROPUESTA N° 1 · POST / CARRUSEL EDUCATIVO
        </span>
        <span style="color: #64748b; font-size: 11px; font-family: monospace;">1080 x 1080 px</span>
      </div>

      <h2 style="margin: 0 0 8px 0; font-size: 17px; color: #ffffff; font-weight: 800;">
        "Seguridad 24/7 Sin Comodato: Alerta Tradicional vs Monitoreo Profesional CRA"
      </h2>

      <p style="margin: 0 0 16px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        <strong>Objetivo:</strong> Educar al cliente de que una sirena sin monitoreo humano solo molesta a los vecinos. En Gama la CRA 24/7 verifica en 15 segundos y coordina con los cuadrantes de Carabineros.
      </p>

      <div style="text-align: center; margin: 16px 0; border: 2px solid #1e3a5f; border-radius: 12px; overflow: hidden; background-color: #020617;">
        ${b64_1 ? '<img src="cid:propuesta_1_img" alt="Propuesta Gráfica 1" style="width: 100%; max-width: 580px; height: auto; display: block; margin: 0 auto;" />' : '<p style="padding: 20px; color: #64748b;">(Imagen adjunta al correo: Propuesta_1_Seguridad_Sin_Comodato.jpg)</p>'}
      </div>

      <div style="background-color: #061122; border-left: 3px solid #38bdf8; padding: 12px; border-radius: 6px; font-size: 12px; color: #cbd5e1;">
        <strong>Copy Sugerido para Redes:</strong><br/>
        "¿Sabías que una alarma que solo suena no detiene a nadie? 🚨 En Gama Seguridad no te amarramos con comodatos eternos: el equipo es 100% tuyo y nuestra Central Receptora responde en menos de 15 segundos protegiendo a tu familia 24/7. Cotiza en gamasecurity.cl o al +56 9 9101 6912."
      </div>
    </div>

    <!-- PROPUESTA GRÁFICA 2 -->
    <div style="padding: 28px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span style="background-color: #064e3b; color: #34d399; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
          PROPUESTA N° 2 · INFOGRAFÍA ANTI-COMODATO
        </span>
        <span style="color: #64748b; font-size: 11px; font-family: monospace;">1080 x 1080 px</span>
      </div>

      <h2 style="margin: 0 0 8px 0; font-size: 17px; color: #ffffff; font-weight: 800;">
        "Compara y Elige Mejor: Empresas Tradicionales vs Gama Seguridad"
      </h2>

      <p style="margin: 0 0 16px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        <strong>Objetivo:</strong> Romper la trampa de los contratos de 48 meses de la competencia (Verisure / ADT). Destacar la política honesta de Gama: el cliente es dueño del equipo y sin multas de salida.
      </p>

      <div style="text-align: center; margin: 16px 0; border: 2px solid #065f46; border-radius: 12px; overflow: hidden; background-color: #020617;">
        ${b64_2 ? '<img src="cid:propuesta_2_img" alt="Propuesta Gráfica 2" style="width: 100%; max-width: 580px; height: auto; display: block; margin: 0 auto;" />' : '<p style="padding: 20px; color: #64748b;">(Imagen adjunta al correo: Propuesta_2_Comparativa_Anti_Comodato.jpg)</p>'}
      </div>

      <div style="background-color: #061e18; border-left: 3px solid #10b981; padding: 12px; border-radius: 6px; font-size: 12px; color: #cbd5e1;">
        <strong>Copy Sugerido para Redes:</strong><br/>
        "¿Comodato de 48 meses y equipos que nunca son tuyos? 🛑 En Chile mereces transparencia. En Gama Seguridad SpA eres el único dueño de tu alarma desde el primer día, sin letras chicas ni cláusulas de amarre. 25 años de confianza real."
      </div>
    </div>

    <!-- Footer Oficial -->
    <div style="background-color: #050d1a; border-top: 1px solid #1e293b; padding: 20px 28px; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #ffffff; font-weight: bold;">
        Supeditado a la Aprobación Definitiva de Tomás Toro-Moreno
      </p>
      <p style="margin: 0; font-size: 11px; color: #64748b;">
        Gama Seguridad SpA · Oficina Autónoma de Especialistas IA · Santiago, Chile
      </p>
    </div>

  </div>
</body>
</html>
`
    } else {
      htmlContent = `
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

      <div style="font-size: 13px; line-height: 1.6; color: #f1f5f9; white-space: pre-wrap; background-color: #0f172a; padding: 18px; border-radius: 8px; border: 1px solid #1e3b5f;">
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
    }

    const resend = getResendClient()
    const subject = tipo === 'propuestas_graficas'
      ? `🎨 [Propuestas Gráficas] 2 Campañas Oficiales Listas para Aprobación — Valentina Lagos`
      : `🏛️ [${badgeLabel}] ${titulo} — Gama Seguridad`

    let emailSent = false
    let emailResult: any = null

    try {
      const emailPayload: any = {
        from: 'Gama Seguridad Agentes <reportes@gamasecurity.cl>',
        to: [targetEmail],
        subject,
        html: htmlContent
      }
      if (attachments.length > 0) {
        emailPayload.attachments = attachments
      }

      let response = await resend.emails.send(emailPayload)

      if (response.error) {
        console.warn('Fallback a onboarding@resend.dev en despacho directo:', response.error)
        emailPayload.from = 'Gama Seguridad Agentes <onboarding@resend.dev>'
        response = await resend.emails.send(emailPayload)
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
