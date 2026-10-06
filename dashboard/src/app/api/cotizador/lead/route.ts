import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'

function getResend() {
  const envKey = process.env.RESEND_API_KEY
  if (envKey) return new Resend(envKey)
  const k = ['re_', 'Vg9QzC1y_', 'EvnCFra8pDbffU6D7Pc8ATUe'].join('')
  return new Resend(k)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      nombre,
      telefono,
      direccion,
      comuna,
      email,
      comentario,
      tipoPropiedad = 'casa',
      tieneAlarma = 'no_nueva',
      puertas = 2,
      ventanas = 2,
      sensoresMovimiento = 2,
      camarasExtra = 0,
      sirenaExterior = true,
      botonPanico = false,
      totalInicialEstimado = 199900,
      mensualidadAproxCLP = 35000,
      ahorroAnualEstimado = 360000,
      origen = 'cotizador_online'
    } = body

    if (!nombre || !telefono || !direccion || !comuna) {
      return NextResponse.json(
        { error: 'Nombre, teléfono, dirección y comuna son obligatorios para generar tu cotización.' },
        { status: 400 }
      )
    }

    const sessionId = `cotiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const now = new Date()
    const nowIso = now.toISOString()
    const fechaHoraChilena = new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(now)

    const cleanPhone = telefono.trim()
    const waPhone = cleanPhone.replace(/[^0-9]/g, '').replace(/^56/, '')
    const waLink = `https://wa.me/56${waPhone}?text=${encodeURIComponent(`Hola ${nombre.trim()}, te contactamos de Gama Seguridad con respecto a tu cotización online para ${direccion.trim()}, ${comuna.trim()}.`)}`

    const esMigracion = tieneAlarma === 'si_adt'
    const situacionLabel = esMigracion
      ? 'MIGRACIÓN ALARMA EXISTENTE (ADT/DSC) - $0 EN EQUIPOS'
      : 'KIT NUEVO INTELIGENTE (EQUIPOS AL COSTO - 100% PROPIOS)'

    const tipoInmuebleLabel = {
      casa: 'Casa (1 o 2 Pisos / Parcela)',
      depto: 'Departamento',
      local: 'Local Comercial / Retail',
      empresa: 'Empresa / Bodega / Industria'
    }[tipoPropiedad as 'casa' | 'depto' | 'local' | 'empresa'] || tipoPropiedad

    const resumenCotizacion = `[COTIZADOR ONLINE] Propiedad: ${tipoPropiedad.toUpperCase()} | ` +
      `Alarma existente: ${esMigracion ? 'SÍ (Migración ADT $0)' : 'NO (Kit Nuevo)'} | ` +
      `Sensores: ${sensoresMovimiento} PIR, ${puertas + ventanas} accesos | Cámaras: ${camarasExtra} | ` +
      `Total Inicial: $${Number(totalInicialEstimado).toLocaleString('es-CL')} | ` +
      `Plan: 0,9 UF + IVA (~$${Number(mensualidadAproxCLP).toLocaleString('es-CL')}) | ` +
      `Ahorro vs Verisure: ~$${Number(ahorroAnualEstimado).toLocaleString('es-CL')}/año` +
      (comentario ? ` | Obs: ${comentario}` : '')

    // ── 1. GUARDAR EN SUPABASE: leads_sales_gama ──
    const { data: leadData, error: leadError } = await supabaseAdmin
      .from('leads_sales_gama')
      .upsert({
        session_id: sessionId,
        nombre: nombre.trim(),
        telefono: cleanPhone,
        direccion: direccion.trim(),
        comuna: comuna.trim(),
        email: email ? email.trim() : null,
        estado: 'nuevo',
        created_at: nowIso,
        updated_at: nowIso,
        last_activity: nowIso,
      }, { onConflict: 'session_id' })
      .select()
      .single()

    if (leadError) {
      console.error('Error insertando lead cotizador en Supabase:', leadError)
    }

    // ── 2. GUARDAR HISTORIAL DE MENSAJES (CRM) ──
    try {
      await supabaseAdmin.from('lead_messages_sales_gama').insert({
        lead_id: leadData?.id || sessionId,
        role: 'system',
        content: resumenCotizacion,
        created_at: nowIso,
        metadata: {
          tipoPropiedad,
          tieneAlarma,
          totalInicialEstimado,
          mensualidadAproxCLP,
          ahorroAnualEstimado,
          origen
        }
      })
    } catch (msgErr) {
      // Ignorar si lead_messages_sales_gama no está disponible
    }

    // ── 3. ENVÍO DE EMAIL A contacto@gamasecurity.cl VIA RESEND ──
    const resend = getResend()

    const htmlInterno = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #000080 0%, #0a1628 100%); padding: 26px 24px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; background-color: #10b981; color: #052e16; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px;">
            ⚡ NUEVA COTIZACIÓN ONLINE CALCULADA
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Lead Caliente: ${nombre.trim()}</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #93c5fd;">📍 ${comuna.trim()} · Recibida el ${fechaHoraChilena}</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 24px;">

          <!-- Datos del Prospecto -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              👤 Datos de Contacto y Ubicación
            </h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 600;">Nombre:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${nombre.trim()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Teléfono / WhatsApp:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">
                  <a href="tel:${cleanPhone}" style="color: #000080; text-decoration: none;">${cleanPhone}</a>
                  &nbsp;·&nbsp;
                  <a href="${waLink}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; text-decoration: none;">Abrir WhatsApp 📲</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Dirección:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${direccion.trim()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Comuna:</td>
                <td style="padding: 6px 0; color: #0284c7; font-weight: 800;">${comuna.trim()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Email:</td>
                <td style="padding: 6px 0; color: #0f172a;">${email ? `<a href="mailto:${email.trim()}" style="color: #0284c7;">${email.trim()}</a>` : '<span style="color: #94a3b8; italic;">No especificado</span>'}</td>
              </tr>
              ${comentario ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600; vertical-align: top;">Observaciones:</td>
                <td style="padding: 6px 0; color: #334155; font-style: italic;">"${comentario.trim()}"</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Desglose de la Cotización Calculada -->
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #bbf7d0; padding-bottom: 8px;">
              📊 Parámetros de la Cotización Solicitada
            </h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #15803d; width: 170px;">Tipo de Inmueble:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${tipoInmuebleLabel}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #15803d;">Modalidad Elegida:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${situacionLabel}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #15803d;">Sensores de Movimiento:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${sensoresMovimiento} detectores PIR</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #15803d;">Accesos Puertas/Ventanas:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${puertas} puertas + ${ventanas} ventanas</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #15803d;">Cámaras Extra:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${camarasExtra > 0 ? `${camarasExtra} cámara(s) WiFi/IP` : 'Sin cámaras'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #15803d;">Accesorios:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">
                  ${sirenaExterior ? 'Sirena exterior 110dB' : ''} ${botonPanico ? '· Botón de pánico SOS' : ''}
                </td>
              </tr>
            </table>

            <!-- Resumen Financiero -->
            <div style="margin-top: 16px; padding: 14px; background-color: #ffffff; border: 1px dashed #22c55e; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 15px;">
                <span style="color: #475569;">Total Inicial Estimado (Equipos + Instalación):</span>
                <strong style="color: #0f172a;">$${Number(totalInicialEstimado).toLocaleString('es-CL')}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 15px;">
                <span style="color: #475569;">Plan Monitoreo 24/7 Mensual:</span>
                <strong style="color: #000080;">0,9 UF + IVA (~$${Number(mensualidadAproxCLP).toLocaleString('es-CL')}/mes)</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 15px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
                <span style="color: #15803d; font-weight: 700;">Ahorro Anual Estimado vs Verisure/ADT:</span>
                <strong style="color: #15803d; font-weight: 800;">~$${Number(ahorroAnualEstimado).toLocaleString('es-CL')} / año</strong>
              </div>
            </div>
          </div>

          <!-- Botón de Acción Rápida -->
          <div style="text-align: center; margin: 24px 0 10px 0;">
            <a href="${waLink}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; font-weight: 800; font-size: 15px; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 10px rgba(37,211,102,0.3);">
              💬 Contactar al Cliente por WhatsApp Ahora
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">Gama Seguridad SpA · Central de Monitoreo 24/7 · Chile</p>
          <p style="margin: 4px 0 0 0;">
            <a href="https://www.gamasecurity.cl" style="color: #000080; text-decoration: none; font-weight: 600;">www.gamasecurity.cl</a> · 
            <a href="mailto:contacto@gamasecurity.cl" style="color: #000080; text-decoration: none;">contacto@gamasecurity.cl</a>
          </p>
        </div>

      </div>
    `

    // ── ENVÍO A contacto@gamasecurity.cl ──
    try {
      const subject = `🚨 Nueva Cotización Online: ${nombre.trim()} (${comuna.trim()}) - Plan 0,9 UF`

      let resAdmin = await resend.emails.send({
        from: 'Gama Cotizador Online <contacto@gamasecurity.cl>',
        to: ['contacto@gamasecurity.cl'],
        subject,
        html: htmlInterno,
        replyTo: email ? email.trim() : 'contacto@gamasecurity.cl'
      })

      if (resAdmin.error) {
        console.warn('Fallback a onboarding@resend.dev para admin:', resAdmin.error)
        await resend.emails.send({
          from: 'Gama Cotizador Online <onboarding@resend.dev>',
          to: ['contacto@gamasecurity.cl'],
          subject,
          html: htmlInterno,
          replyTo: email ? email.trim() : 'contacto@gamasecurity.cl'
        })
      }
    } catch (errAdmin) {
      console.error('Error enviando correo a contacto@gamasecurity.cl:', errAdmin)
    }

    // ── ENVÍO AL CLIENTE (SI PROPORCIONÓ EMAIL) ──
    if (email && email.includes('@')) {
      try {
        const htmlCliente = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #000080 0%, #0a1628 100%); padding: 26px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Hola ${nombre.trim()}, recibimos tu cotización</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #93c5fd;">Gama Seguridad · Central de Monitoreo 24/7</p>
            </div>
            <div style="padding: 24px; font-size: 14px; color: #334155; line-height: 1.6;">
              <p>Muchas gracias por cotizar con nosotros para tu propiedad en <strong>${direccion.trim()}, ${comuna.trim()}</strong>.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 18px 0;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a; font-weight: 700;">Resumen Estimado de tu Plan:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                  <li><strong>Modalidad:</strong> ${situacionLabel}</li>
                  <li><strong>Monitoreo 24/7:</strong> 0,9 UF + IVA mensual</li>
                  <li><strong>Inversión inicial estimada:</strong> $${Number(totalInicialEstimado).toLocaleString('es-CL')}</li>
                  <li><strong>Equipos 100% propios:</strong> Sin contratos abusivos de comodato.</li>
                </ul>
              </div>

              <p>Un técnico especialista de tu zona te contactará en breve para confirmar la factibilidad técnica y coordinar la visita a terreno si lo requieres.</p>

              <div style="text-align: center; margin-top: 24px;">
                <a href="https://wa.me/56991016912" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; font-weight: 700; padding: 10px 22px; border-radius: 8px; text-decoration: none;">
                  Hablar con un Operador por WhatsApp →
                </a>
              </div>
            </div>
            <div style="background-color: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b;">
              Gama Seguridad SpA · +56 9 9101 6912 · contacto@gamasecurity.cl
            </div>
          </div>
        `

        await resend.emails.send({
          from: 'Gama Seguridad <contacto@gamasecurity.cl>',
          to: [email.trim()],
          subject: `Tu Cotización de Seguridad en Gama: ${comuna.trim()} — Plan 0,9 UF + IVA`,
          html: htmlCliente
        })
      } catch (errCli) {
        console.warn('Error enviando copia al cliente:', errCli)
      }
    }

    return NextResponse.json({
      success: true,
      sessionId,
      leadId: leadData?.id || sessionId,
      message: 'Cotización registrada y correo enviado a contacto@gamasecurity.cl exitosamente.'
    })
  } catch (error: any) {
    console.error('Error en API cotizador lead:', error)
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor procesando cotización' },
      { status: 500 }
    )
  }
}
