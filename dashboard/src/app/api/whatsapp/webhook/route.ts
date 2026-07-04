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
    }

    return NextResponse.json({ ok: true, processed: true, tipo: reply.tipo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
