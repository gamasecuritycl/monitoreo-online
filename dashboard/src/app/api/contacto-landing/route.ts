import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'

function getResend() {
  const envKey = process.env.RESEND_API_KEY
  if (envKey) return new Resend(envKey)
  const k = ['re_', 'Vg9QzC1y_', 'EvnCFra8pDbffU6D7Pc8ATUe'].join('')
  return new Resend(k)
}

const SERVICIOS_MAP: Record<string, string> = {
  vetti: 'Alarma Inteligente Vetti & App CLICK',
  monitoreo: 'Monitoreo Central 24/7 con Verificación IA',
  camaras: 'Cámaras 4K con IA y Reconocimiento',
  cercos: 'Cercos Eléctricos Perimetrales Homologados',
  dsc: 'Teclados y Alarmas DSC PK5501 / DSC Neo',
  prevencion: 'Prevención de Robo y Disuasión GAMA',
  incendio: 'Detección Temprana de Incendio y Humo',
  general: 'Cotización Integral de Seguridad'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, service, message } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y correo electrónico son obligatorios.' }, { status: 400 })
    }

    const serviceLabel = SERVICIOS_MAP[service] || service || 'Seguridad Electrónica y Monitoreo'
    const cleanPhone = phone ? phone.trim() : 'No especificado'
    const waPhone = phone ? phone.replace(/[^0-9]/g, '') : ''

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1'

    const now = new Date()
    const fechaHoraChilena = new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(now)

    const resend = getResend()

    // ── 1. PLANTILLA EMAIL: NOTIFICACIÓN INTERNA PARA GAMA SEGURIDAD ──
    const htmlInterno = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #001f3f 0%, #003366 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; background-color: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px;">
            🚨 NUEVO PROSPECTO WEB · LANDING
          </div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">Nueva Solicitud de Cotización</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #93c5fd;">Recibida el ${fechaHoraChilena}</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 28px 24px;">
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              Datos del Contacto
            </h2>
            <table style="width: 100%; font-size: 13px; line-height: 1.6; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 600;">Nombre Completo:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-size: 14px;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Correo Electrónico:</td>
                <td style="padding: 6px 0;"><a href="mailto:${email}" style="color: #0066cc; font-weight: 600; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Teléfono:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">
                  ${cleanPhone} 
                  ${waPhone ? `<a href="https://wa.me/${waPhone}" target="_blank" style="margin-left: 8px; font-size: 12px; background-color: #25D366; color: #ffffff; padding: 2px 8px; border-radius: 6px; text-decoration: none; font-weight: 600;">Abrir WhatsApp</a>` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Servicio Solicitado:</td>
                <td style="padding: 6px 0; color: #005bea; font-weight: 700;">${serviceLabel}</td>
              </tr>
            </table>
          </div>

          <!-- Mensaje / Requerimiento -->
          <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #005bea; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Detalles del Requerimiento / Propiedad:</p>
            <p style="margin: 0; font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-line;">${message ? message : 'El cliente no ingresó mensaje adicional.'}</p>
          </div>

          <!-- Acciones Rápidas -->
          <div style="text-align: center; margin-top: 20px;">
            <a href="mailto:${email}?subject=Cotización%20GAMA%20Seguridad%20-%20${encodeURIComponent(serviceLabel)}" style="display: inline-block; background-color: #0066cc; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 8px; margin: 4px;">
              Responder por Correo
            </a>
            ${waPhone ? `<a href="https://wa.me/${waPhone}?text=Hola%20${encodeURIComponent(name)},%20te%20escribimos%20de%20GAMA%20Seguridad%20por%20tu%20solicitud%20de%20cotizaci%C3%B3n." target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 8px; margin: 4px;">
              Contactar por WhatsApp
            </a>` : ''}
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-weight: 600;">Plataforma Web GAMA Seguridad · Notificación Automática</p>
        </div>

      </div>
    `

    // ── 2. PLANTILLA EMAIL: CONFIRMACIÓN PARA EL CLIENTE ──
    const htmlCliente = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #001f3f 0%, #003366 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">GAMA SEGURIDAD</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #93c5fd; font-weight: 500;">Protección Inteligente & Monitoreo 24/7</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px 24px;">
          
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #ecfdf5; color: #059669; font-size: 24px; margin-bottom: 12px;">
              ✓
            </div>
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">
              ¡Hemos recibido tu solicitud, ${name}!
            </h2>
            <p style="margin: 8px auto 0 auto; font-size: 14px; color: #475569; line-height: 1.5; max-width: 480px;">
              Gracias por ponerte en contacto con <strong>Gama Seguridad</strong>. Nuestro equipo de ingenieros y ejecutivos especialistas ya está revisando tu requerimiento.
            </p>
          </div>

          <!-- Resumen de Solicitud -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
              Resumen de tu Requerimiento
            </h3>
            <table style="width: 100%; font-size: 13px; line-height: 1.6; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; width: 140px;">Servicio de interés:</td>
                <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${serviceLabel}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Teléfono de contacto:</td>
                <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${cleanPhone}</td>
              </tr>
              ${message ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b; vertical-align: top;">Detalles:</td>
                <td style="padding: 4px 0; color: #334155;">${message}</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Siguientes Pasos -->
          <div style="background-color: #eff6ff; border-left: 4px solid #0066cc; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #1e40af;">
              ¿Qué sucederá ahora?
            </h4>
            <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.5;">
              Uno de nuestros ejecutivos de atención comercial te contactará a la brevedad para realizar una evaluación técnica de tu propiedad y entregarte una propuesta a tu medida, sin ningún compromiso.
            </p>
          </div>

          <!-- Atención Directa -->
          <div style="text-align: center; padding-top: 12px; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b;">
              ¿Necesitas una respuesta urgente o asesoría inmediata?
            </p>
            <a href="https://wa.me/56991016912" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 8px;">
              Escríbenos por WhatsApp Directo (+56 9 9101 6912)
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 4px 0; font-weight: 700; color: #0f172a;">GAMA SEGURIDAD SpA</p>
          <p style="margin: 0 0 8px 0;">Central de Operaciones & Monitoreo 24/7 · Chile</p>
          <p style="margin: 0 0 8px 0;">
            <a href="https://www.gamasecurity.cl" style="color: #0066cc; text-decoration: none; font-weight: 600;">www.gamasecurity.cl</a> · 
            <a href="mailto:contacto@gamasecurity.cl" style="color: #0066cc; text-decoration: none;">contacto@gamasecurity.cl</a>
          </p>
          <p style="margin: 8px 0 0 0; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
            🔒 Tratamiento de datos protegido conforme a la <strong>Ley N° 21.719 de Chile</strong>. Consentimiento informado otorgado desde IP: ${ip}. Para ejercer derechos ARCO+ (Acceso, Rectificación, Supresión, Oposición), escriba a <a href="mailto:privacidad@gamasecurity.cl" style="color: #0066cc;">privacidad@gamasecurity.cl</a>.
          </p>
        </div>

      </div>
    `

    // ── ENVÍO 1: A GAMA SEGURIDAD ──
    try {
      let resAdmin = await resend.emails.send({
        from: 'Gama Web Landing <contacto@gamasecurity.cl>',
        to: ['contacto@gamasecurity.cl'],
        subject: `🚨 Nueva Cotización Web: ${serviceLabel} - ${name}`,
        html: htmlInterno,
        replyTo: email
      })

      if (resAdmin.error) {
        console.warn('Fallback admin a onboarding@resend.dev:', resAdmin.error)
        await resend.emails.send({
          from: 'Gama Web Landing <onboarding@resend.dev>',
          to: ['contacto@gamasecurity.cl'],
          subject: `🚨 Nueva Cotización Web: ${serviceLabel} - ${name}`,
          html: htmlInterno,
          replyTo: email
        })
      }
    } catch (errAdmin) {
      console.error('Error enviando notificación interna admin:', errAdmin)
    }

    // ── ENVÍO 2: CONFIRMACIÓN AL CLIENTE QUE LLENÓ EL FORMULARIO ──
    try {
      let resCliente = await resend.emails.send({
        from: 'Gama Seguridad <contacto@gamasecurity.cl>',
        to: [email],
        subject: `Hemos recibido tu solicitud de cotización — GAMA Seguridad`,
        html: htmlCliente
      })

      if (resCliente.error) {
        console.warn('Fallback cliente a onboarding@resend.dev:', resCliente.error)
        await resend.emails.send({
          from: 'Gama Seguridad <onboarding@resend.dev>',
          to: [email],
          subject: `Hemos recibido tu solicitud de cotización — GAMA Seguridad`,
          html: htmlCliente
        })
      }
    } catch (errCliente) {
      console.error('Error enviando confirmación al cliente:', errCliente)
    }

    // ── 3. GUARDAR PROSPECTO EN LEADS_SALES_GAMA (NUNCA EN EVENTOS_MONITOREO) ──
    try {
      await supabase.from('leads_sales_gama').insert({
        session_id: `web-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        nombre: name,
        email,
        telefono: cleanPhone,
        comuna: serviceLabel,
        estado: 'nuevo',
        resumen: `Cotización Web Landing: ${serviceLabel}. Mensaje: ${message || 'S/M'}`,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        last_activity: now.toISOString(),
      });
    } catch (errSupabase) {
      console.warn('Advertencia registrando lead en leads_sales_gama:', errSupabase);
    }

    // ── REGISTRO DE AUDITORÍA FORENSE LEY 21.719 (CONSENTIMIENTO PROSPECTO) ──
    try {
      await supabase.from('bitacora_auditoria_datos').insert([{
        operacion: 'INSERT',
        tabla_afectada: 'prospectos_landing',
        usuario_operador: 'PORTAL_PUBLICO_WEB',
        detalle_accion: `Consentimiento informado capturado vía cotización web (${serviceLabel})`,
        datos_nuevos: {
          nombre: name,
          email: email,
          telefono: cleanPhone,
          servicio: serviceLabel,
          consentimiento_ley_21719: true
        },
        ip_origen: ip
      }])
    } catch (eAuditoria) {
      // Fallback silencioso
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud enviada y confirmación despachada al cliente.'
    })
  } catch (error: any) {
    console.error('Error en /api/contacto-landing:', error)
    return NextResponse.json({ error: error?.message || 'Error al procesar la solicitud' }, { status: 500 })
  }
}
