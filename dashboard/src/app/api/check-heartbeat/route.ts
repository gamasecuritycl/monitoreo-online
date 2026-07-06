import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendMessage } from '@/lib/whatsapp'

const OFFLINE_THRESHOLD_MINUTES = 5
const SILENCE_PERIOD_HOURS = 4

export async function GET() {
  try {
    // 1. Obtener el último heartbeat del sincronizador en Supabase
    const { data: hbData, error: hbError } = await supabase
      .from('eventos_monitoreo')
      .select('fecha_hora')
      .eq('cuenta', '__SINCRONIZADOR__')
      .eq('evento', 'HEARTBEAT')
      .order('fecha_hora', { ascending: false })
      .limit(1)

    if (hbError) {
      return NextResponse.json({ error: 'Error al consultar heartbeat: ' + hbError.message }, { status: 500 })
    }

    if (!hbData || hbData.length === 0) {
      return NextResponse.json({ status: 'no_heartbeat_found' })
    }

    const ultimoHb = new Date(hbData[0].fecha_hora)
    const ahora = new Date()
    const diffMs = ahora.getTime() - ultimoHb.getTime()
    const diffMinutes = diffMs / 1000 / 60

    const isOffline = diffMinutes > OFFLINE_THRESHOLD_MINUTES

    if (!isOffline) {
      return NextResponse.json({
        status: 'online',
        ultimo_heartbeat: hbData[0].fecha_hora,
        diferencia_minutos: diffMinutes.toFixed(2),
      })
    }

    // Obtener teléfono del administrador guardado en la base de datos (cuenta '__SYSTEM__')
    const { data: configSystem } = await supabase
      .from('notificaciones_whatsapp')
      .select('telefono')
      .eq('cuenta', '__SYSTEM__')
      .single()

    const adminPhone = configSystem?.telefono || '56991016912'

    // 2. Si está offline, verificar si ya enviamos una alerta en las últimas 4 horas
    const cuatroHorasAtras = new Date(ahora.getTime() - SILENCE_PERIOD_HOURS * 60 * 60 * 1000).toISOString()
    
    const { data: alertaReciente, error: alertaError } = await supabase
      .from('conversaciones_whatsapp')
      .select('id')
      .eq('cuenta', '__SINCRONIZADOR__')
      .gte('created_at', cuatroHorasAtras)
      .limit(1)

    if (alertaError) {
      return NextResponse.json({ error: 'Error al consultar alertas recientes: ' + alertaError.message }, { status: 500 })
    }

    if (alertaReciente && alertaReciente.length > 0) {
      return NextResponse.json({
        status: 'offline_alert_already_sent_recently',
        ultimo_heartbeat: hbData[0].fecha_hora,
        diferencia_minutos: diffMinutes.toFixed(2),
      })
    }

    const mensaje = `🚨 *ALERTA SISTEMA GAMA SEGURIDAD*\n━━━━━━━━━━━━━━━━━━━━━\n\n⚠️ *SINCRONIZADOR OFFLINE*\n\nEl servidor local de Scorpion en la central ha dejado de reportar a Supabase.\n\n🕐 Último Heartbeat: ${ultimoHb.toLocaleString('es-CL')}\n⏳ Tiempo sin reportar: *${diffMinutes.toFixed(0)} minutos*\n\n━━━━━━━━━━━━━━━━━━━━━\n_Gama Seguridad - Monitoreo Autónomo_`

    // 3. Enviar alerta por WhatsApp o Telegram
    const isTelegram = adminPhone.startsWith('@')
    let resOk = false

    if (isTelegram) {
      const msgLlamada = `Alerta crítica de Gama Seguridad. El sincronizador local de Scorpion en la central ha dejado de reportar a Supabase. Tiempo sin reportar: ${diffMinutes.toFixed(0)} minutos.`
      const params = new URLSearchParams({
        user: adminPhone,
        text: msgLlamada,
        apikey: '4238719',
        lang: 'es-es',
      })
      const callRes = await fetch(`https://api.callmebot.com/start.php?${params.toString()}`)
      const text = await callRes.text()
      resOk = callRes.ok && !text.toLowerCase().includes('error') && !text.toLowerCase().includes('not authorized')
    } else {
      const res = await sendMessage(adminPhone, mensaje)
      resOk = res.ok
    }
    
    if (resOk) {
      // Registrar la conversación para silenciar alertas duplicadas
      await supabase.from('conversaciones_whatsapp').insert({
        cuenta: '__SINCRONIZADOR__',
        numero: adminPhone,
        tipo_evento: 'MONITOR_OFFLINE',
        estado: 'critico',
        mensaje_enviado: isTelegram ? 'SINCRONIZADOR OFFLINE (LLAMADA TELEGRAM)' : 'SINCRONIZADOR OFFLINE',
        respuesta_cliente: null,
        created_at: ahora.toISOString(),
      })
    }

    return NextResponse.json({
      status: 'offline_alert_sent',
      ultimo_heartbeat: hbData[0].fecha_hora,
      diferencia_minutos: diffMinutes.toFixed(2),
      whatsapp_success: res.ok,
      debug: res.debug,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
