import { NextResponse } from 'next/server'
import { sendMessage, detectarPatronEvento, generarMensajeAlerta, type EventInfo } from '@/lib/whatsapp'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cuenta, nombre_cliente, tipo_evento, zona, fecha_hora, direccion } = body

    if (!cuenta || !nombre_cliente || !tipo_evento) {
      return NextResponse.json({ error: 'Faltan datos requeridos (cuenta, nombre_cliente, tipo_evento)' }, { status: 400 })
    }

    const { data: config } = await supabase
      .from('notificaciones_whatsapp')
      .select('telefono, contactos_escalamiento')
      .eq('cuenta', cuenta)
      .eq('activo', true)
      .single()

    if (!config?.telefono) {
      return NextResponse.json({ error: 'Cliente sin WhatsApp configurado' }, { status: 404 })
    }

    const telefono = config.telefono.replace(/[^0-9]/g, '')

    const { data: eventosRecientes } = await supabase
      .from('eventos_monitoreo')
      .select('zona, evento')
      .eq('cuenta', cuenta)
      .gte('fecha_hora', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(10)

    const info: EventInfo = {
      cuenta,
      nombre_cliente,
      tipo_evento,
      zonas: [...new Set([...(eventosRecientes || []).map(e => e.zona)])].filter(Boolean),
      fecha_hora,
      direccion,
    }

    if (!info.zonas.includes(zona)) {
      info.zonas.push(zona)
    }

    const { critico, mensaje: asunto } = detectarPatronEvento(eventosRecientes || [])
    const texto = generarMensajeAlerta(info, critico)

    const enviado = await sendMessage(telefono, texto)

    if (enviado) {
      await supabase.from('conversaciones_whatsapp').insert({
        cuenta,
        numero: telefono,
        tipo_evento,
        estado: critico ? 'critico' : 'informativo',
        mensaje_enviado: asunto,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: enviado,
      critico,
      asunto,
      telefono_enmascarado: telefono.slice(0, -4).replace(/./g, '*') + telefono.slice(-4),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
