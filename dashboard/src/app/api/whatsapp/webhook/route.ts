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
          '✅ CONFIRMADO - Su sistema está siendo monitoreado.\n' +
          'Ante cualquier eventualidad le contactaremos de inmediato.')
        if (conv) {
          await supabase.from('conversaciones_whatsapp')
            .update({ estado: 'confirmado', respuesta_recibida: reply.mensaje, responded_at: new Date().toISOString() })
            .eq('id', conv.id)
        }
        break
      }

      case 'ayuda': {
        const contactos: { nombre: string; telefono: string }[] = config.contactos_escalamiento as any || []
        const msg = '🆘 SOLICITUD DE ASISTENCIA\n' +
          `Cliente: ${cuenta}\n` +
          'Operador asignado. Le contactaremos en breve.\n' +
          'Si es una emergencia, llame al 56948855190.'

        await sendMessage(reply.numero, msg)

        for (const c of contactos) {
          const tel = c.telefono.replace(/[^0-9]/g, '')
          await sendMessage(tel,
            `[ESCALAMIENTO] ${cuenta} solicita asistencia.\nContacto: ${c.nombre}\nResponda OK si lo gestiona.`)
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
        await sendMessage(reply.numero, '🔇 MODO SILENCIO activado por 1 hora. No recibirá notificaciones hasta nuevo aviso.')
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
        const gpsInfo = reply.gps
          ? `\n📍 GPS: https://maps.google.com/?q=${reply.gps.lat},${reply.gps.lng}`
          : ''

        const msgUrgente = `🚨 SOS - EMERGENCIA CONFIRMADA\nCliente: ${cuenta}\nHora: ${new Date().toLocaleString('es-CL')}${gpsInfo}\n\nOperador de emergencia despachado.\nLínea directa: 56948855190`

        await sendMessage(reply.numero, msgUrgente)

        for (const c of contactos) {
          const tel = c.telefono.replace(/[^0-9]/g, '')
          await sendMessage(tel,
            `🚨 EMERGENCIA - ${cuenta}\nContacto: ${c.nombre}${gpsInfo}\nDespache unidad urgente.`)
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
          '✅ ACUSE RECIBIDO - Fallo de energía registrado.\n' +
          'Su sistema está operando con batería de respaldo.\n' +
          'Notificaremos cuando se restablezca.')

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
