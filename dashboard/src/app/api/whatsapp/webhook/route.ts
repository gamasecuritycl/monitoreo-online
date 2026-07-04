import { NextResponse } from 'next/server'
import { interpretarRespuesta, sendMessage } from '@/lib/whatsapp'
import { supabase } from '@/lib/supabase'

const SILENCIO_DURACION_MS = 60 * 60 * 1000

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const reply = interpretarRespuesta(body)
    if (!reply) {
      return NextResponse.json({ ok: true, processed: false })
    }

    if (reply.tipo === 'desconocido') {
      return NextResponse.json({ ok: true, processed: true, tipo: 'desconocido' })
    }

    const { data: config } = await supabase
      .from('notificaciones_whatsapp')
      .select('cuenta, contactos_escalamiento')
      .eq('telefono', reply.numero)
      .single()

    if (!config) {
      return NextResponse.json({ ok: false, error: 'Número no registrado' }, { status: 404 })
    }

    const cuenta = config.cuenta

    const { data: conv } = await supabase
      .from('conversaciones_whatsapp')
      .select('id')
      .eq('cuenta', cuenta)
      .eq('numero', reply.numero)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    switch (reply.tipo) {
      case 'ok': {
        await sendMessage(reply.numero,
          '🛡️ *GAMA SEGURIDAD*\n' +
          '━━━━━━━━━━━━━━━━━━━━━\n' +
          '✅ *CONFIRMADO*\n\n' +
          'Su sistema está siendo monitoreado.\n' +
          'Ante cualquier eventualidad le contactaremos.\n\n' +
          '_Gama Seguridad - Monitoreo 24/7_')

        await supabase.from('notificaciones_whatsapp')
          .update({ silencio_hasta: null })
          .eq('cuenta', cuenta)

        if (conv) {
          await supabase.from('conversaciones_whatsapp')
            .update({ estado: 'confirmado', respuesta_recibida: reply.mensaje, responded_at: new Date().toISOString() })
            .eq('id', conv.id)
        }
        break
      }

      case 'ayuda': {
        const contactos: { nombre: string; telefono: string }[] = config.contactos_escalamiento as any || []

        await sendMessage(reply.numero,
          '🛡️ *GAMA SEGURIDAD*\n' +
          '━━━━━━━━━━━━━━━━━━━━━\n' +
          '🆘 *SOLICITUD DE ASISTENCIA*\n\n' +
          `Cliente: *${cuenta}*\n\n` +
          'Operador asignado. Le contactaremos en breve.\n' +
          'Si es emergencia, llame al *56948855190*.\n\n' +
          '_Gama Seguridad - Monitoreo 24/7_')

        await supabase.from('notificaciones_whatsapp')
          .update({ silencio_hasta: null })
          .eq('cuenta', cuenta)

        for (const c of contactos) {
          const tel = c.telefono.replace(/[^0-9]/g, '')
          await sendMessage(tel,
            `🛡️ *GAMA SEGURIDAD*\n` +
            '━━━━━━━━━━━━━━━━━━━━━\n' +
            `📋 ESCALAMIENTO - *${cuenta}*\n\n` +
            `Contacto: ${c.nombre}\nsolicita asistencia.\n\n` +
            'Responda OK si lo gestiona.')
        }

        if (conv) {
          await supabase.from('conversaciones_whatsapp')
            .update({ estado: 'ayuda', respuesta_recibida: reply.mensaje, responded_at: new Date().toISOString() })
            .eq('id', conv.id)
        }
        break
      }

      case 'silencio': {
        const hasta = new Date(Date.now() + SILENCIO_DURACION_MS).toISOString()
        await sendMessage(reply.numero,
          '🛡️ *GAMA SEGURIDAD*\n' +
          '━━━━━━━━━━━━━━━━━━━━━\n' +
          '🔇 *MODO SILENCIO*\n\n' +
          'Activado por 1 hora.\n' +
          'No recibirá notificaciones.\n\n' +
          '_Gama Seguridad - Monitoreo 24/7_')

        await supabase.from('notificaciones_whatsapp')
          .update({ silencio_hasta: hasta })
          .eq('cuenta', cuenta)

        if (conv) {
          await supabase.from('conversaciones_whatsapp')
            .update({ estado: 'silencio', respuesta_recibida: reply.mensaje, responded_at: new Date().toISOString() })
            .eq('id', conv.id)
        }
        break
      }

      case 'panico': {
        const contactos: { nombre: string; telefono: string }[] = config.contactos_escalamiento as any || []

        await sendMessage(reply.numero,
          '🛡️ *GAMA SEGURIDAD*\n' +
          '━━━━━━━━━━━━━━━━━━━━━\n' +
          '🚨 *EMERGENCIA CONFIRMADA*\n\n' +
          `Cliente: *${cuenta}*\n` +
          `Hora: ${new Date().toLocaleString('es-CL')}\n\n` +
          'Operador de emergencia despachado.\n' +
          'Línea directa: *56948855190*\n\n' +
          '_Gama Seguridad - Monitoreo 24/7_')

        await supabase.from('notificaciones_whatsapp')
          .update({ silencio_hasta: null })
          .eq('cuenta', cuenta)

        for (const c of contactos) {
          const tel = c.telefono.replace(/[^0-9]/g, '')
          await sendMessage(tel,
            '🛡️ *GAMA SEGURIDAD*\n' +
            '━━━━━━━━━━━━━━━━━━━━━\n' +
            `🚨 *EMERGENCIA* - *${cuenta}*\n\n` +
            `Contacto: ${c.nombre}\n\n` +
            'Despache unidad urgente.')
        }

        await supabase.from('conversaciones_whatsapp').insert({
          cuenta,
          numero: reply.numero,
          tipo_evento: 'PÁNICO SOS',
          estado: 'emergencia',
          mensaje_enviado: 'PÁNICO ACTIVADO',
          respuesta_recibida: reply.mensaje,
          created_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
        })
        break
      }

      case 'confirmacion_energia': {
        await sendMessage(reply.numero,
          '🛡️ *GAMA SEGURIDAD*\n' +
          '━━━━━━━━━━━━━━━━━━━━━\n' +
          '✅ *ACUSE RECIBIDO*\n\n' +
          'Fallo de energía registrado.\n' +
          'Su sistema opera con batería (72 hrs).\n' +
          'Notificaremos cuando se restablezca.\n\n' +
          '_Gama Seguridad - Monitoreo 24/7_')

        await supabase.from('notificaciones_whatsapp')
          .update({ silencio_hasta: null })
          .eq('cuenta', cuenta)

        await supabase.from('conversaciones_whatsapp').insert({
          cuenta,
          numero: reply.numero,
          tipo_evento: 'FALLA ENERGÍA',
          estado: 'confirmado_energia',
          mensaje_enviado: 'FALLA ENERGÍA ELÉCTRICA',
          respuesta_recibida: reply.mensaje,
          created_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
        })
        break
      }
    }

    return NextResponse.json({ ok: true, processed: true, tipo: reply.tipo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
