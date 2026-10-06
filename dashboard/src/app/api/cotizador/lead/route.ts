import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
      tipoPropiedad,
      tieneAlarma,
      puertas,
      ventanas,
      sensoresMovimiento,
      camarasExtra,
      sirenaExterior,
      botonPanico,
      totalInicialEstimado,
      mensualidadAproxCLP,
      ahorroAnualEstimado,
      origen = 'cotizador_online'
    } = body

    if (!nombre || !telefono || !direccion || !comuna) {
      return NextResponse.json(
        { error: 'Nombre, teléfono, dirección y comuna son obligatorios para generar tu cotización.' },
        { status: 400 }
      )
    }

    const sessionId = `cotiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()

    const resumenCotizacion = `[COTIZADOR ONLINE] Propiedad: ${tipoPropiedad.toUpperCase()} | ` +
      `Alarma existente: ${tieneAlarma === 'si_adt' ? 'SÍ (Migración ADT/DSC a $0)' : 'NO (Kit Nuevo al costo)'} | ` +
      `Sensores: ${sensoresMovimiento} PIR, ${puertas + ventanas} accesos | Cámaras: ${camarasExtra} | ` +
      `Total Inicial Est.: $${Number(totalInicialEstimado).toLocaleString('es-CL')} | ` +
      `Plan Mensual: 0,9 UF + IVA (~$${Number(mensualidadAproxCLP).toLocaleString('es-CL')}) | ` +
      `Ahorro Anual vs Verisure/ADT: ~$${Number(ahorroAnualEstimado).toLocaleString('es-CL')}` +
      (comentario ? ` | Obs: ${comentario}` : '')

    // 1. Guardar en leads_sales_gama
    const { data: leadData, error: leadError } = await supabaseAdmin
      .from('leads_sales_gama')
      .upsert({
        session_id: sessionId,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        comuna: comuna.trim(),
        email: email ? email.trim() : null,
        estado: 'nuevo',
        created_at: now,
        updated_at: now,
        last_activity: now,
      }, { onConflict: 'session_id' })
      .select()
      .single()

    if (leadError) {
      console.error('Error insertando lead cotizador en Supabase:', leadError)
    }

    // 2. Registrar el desglose como mensaje inicial si la tabla existe
    try {
      await supabaseAdmin.from('lead_messages_sales_gama').insert({
        lead_id: leadData?.id || sessionId,
        role: 'system',
        content: resumenCotizacion,
        created_at: now,
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

    return NextResponse.json({
      success: true,
      sessionId,
      leadId: leadData?.id || sessionId,
      message: 'Cotización registrada correctamente.'
    })
  } catch (error: any) {
    console.error('Error en API cotizador lead:', error)
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor procesando cotización' },
      { status: 500 }
    )
  }
}
