import { NextResponse } from 'next/server'
import { sendMessage, detectarPatronEvento, generarMensajeAlerta, generarMensajeEnergia, type EventInfo } from '@/lib/whatsapp'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cuenta, nombre_cliente, tipo_evento, zona, fecha_hora, direccion, esEnergia } = body

    if (!cuenta || !nombre_cliente || !tipo_evento) {
      return NextResponse.json({ error: 'Faltan datos requeridos (cuenta, nombre_cliente, tipo_evento)' }, { status: 400 })
    }

    const { data: config } = await supabase
      .from('notificaciones_whatsapp')
      .select('telefono, contactos_escalamiento, silencio_hasta')
      .eq('cuenta', cuenta)
      .eq('activo', true)
      .single()

    if (!config?.telefono) {
      return NextResponse.json({ error: 'Cliente sin WhatsApp configurado' }, { status: 404 })
    }

    if (config.silencio_hasta && new Date(config.silencio_hasta) > new Date()) {
      return NextResponse.json({ error: 'Cliente silenciado temporalmente' }, { status: 200 })
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
    const texto = esEnergia ? generarMensajeEnergia(info) : generarMensajeAlerta(info, critico)

    const resultado = await sendMessage(telefono, texto)
    const enviado = resultado.ok

    if (enviado) {
      const ahora = new Date()
      const silencioHasta = new Date(ahora.getTime() + 60 * 60 * 1000)

      await supabase.from('conversaciones_whatsapp').insert({
        cuenta,
        numero: telefono,
        tipo_evento,
        estado: esEnergia ? 'energia' : (critico ? 'critico' : 'informativo'),
        mensaje_enviado: esEnergia ? 'FALLA ENERGÍA' : asunto,
        respuesta_cliente: null,
        created_at: ahora.toISOString(),
      })

      await supabase.from('notificaciones_whatsapp').upsert({
        cuenta,
        telefono,
        activo: true,
        silencio_hasta: silencioHasta.toISOString(),
        updated_at: ahora.toISOString(),
      }, { onConflict: 'cuenta' })
    }

    return NextResponse.json({
      success: enviado,
      critico,
      asunto,
      esEnergia,
      debug: resultado.debug,
      telefono_enmascarado: telefono.slice(0, -4).replace(/./g, '*') + telefono.slice(-4),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
