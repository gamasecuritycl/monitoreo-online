const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'gama-seguridad'

export interface EventInfo {
  cuenta: string
  nombre_cliente: string
  tipo_evento: string
  zonas: string[]
  fecha_hora: string
  direccion?: string
}

export interface ReplyResult {
  tipo: 'ok' | 'ayuda' | 'silencio' | 'panico' | 'confirmacion_energia' | 'desconocido'
  mensaje: string
  numero: string
  gps?: { lat: number; lng: number; timestamp: number }
}

const PANICO_KEYWORDS = ['SOCORRO', 'PÁNICO', 'PANICO', 'EMERGENCIA', 'AYUDA YA', 'SOS']
const ENERGIA_KEYWORDS = ['ENERGÍA', 'ENERGIA', 'CORTE', 'LUZ', 'RESTABLECIDO']

export async function sendMessage(telefono: string, texto: string): Promise<boolean> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.error('Evolution API no configurada')
    return false
  }

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: telefono,
        textMessage: { text: texto },
        delay: 1200,
      }),
    })

    const data = await res.json()
    return res.ok && data.key?.id
  } catch (err) {
    console.error('Error enviando WhatsApp:', err)
    return false
  }
}

export function detectarPatronEvento(ultimosEventos: { zona: string; evento: string }[]): { critico: boolean; mensaje: string } {
  const zonasUnicas = new Set(ultimosEventos.map(e => e.zona)).size
  const eventosRecientes = ultimosEventos.length

  if (eventosRecientes >= 2 || zonasUnicas >= 2) {
    return {
      critico: true,
      mensaje: 'INCIDENCIA CONCURRENTE - SE DESPACHARÁ UNIDAD DE EMERGENCIA',
    }
  }

  return {
    critico: false,
    mensaje: 'NOTIFICACIÓN DE EVENTO - MONITOREANDO ACTIVACIONES',
  }
}

export function generarMensajeAlerta(info: EventInfo, critico: boolean): string {
  const lineas = [
    '🛡️ *GAMA SEGURIDAD*',
    '━━━━━━━━━━━━━━━━━━━━━',
    '',
    critico
      ? `🚨 *ALERTA CRÍTICA* - ${info.tipo_evento}`
      : `⚠️ *NOTIFICACIÓN* - ${info.tipo_evento}`,
    '',
    `👤 Cliente: *${info.cuenta}* - ${info.nombre_cliente}`,
  ]

  if (info.direccion) {
    lineas.push(`📍 Dirección: ${info.direccion}`)
  }

  lineas.push(`🕐 Hora: ${info.fecha_hora}`)
  lineas.push('')

  if (critico) {
    lineas.push('⚠️ *MÚLTIPLES ACTIVACIONES DETECTADAS*')
    lineas.push('Se ha despachado una unidad de emergencia.')
    lineas.push('')
    lineas.push('━━━━━━━━━━━━━━━━━━━━━')
    lineas.push('Responda:')
    lineas.push('✅ *OK* → Todo controlado')
    lineas.push('🆘 *AYUDA* → Necesito asistencia')
    lineas.push('🔇 *SILENCIO* → No molestar 1 hora')
  } else {
    lineas.push('Hemos registrado una activación en su sistema.')
    lineas.push('Estamos atentos.')
    lineas.push('')
    lineas.push('━━━━━━━━━━━━━━━━━━━━━')
    lineas.push('Responda:')
    lineas.push('✅ *OK* → Confirmado')
    lineas.push('🆘 *AYUDA* → Necesito asistencia')
  }

  lineas.push('')
  lineas.push('⚡ Si no responde en 1 hora,')
  lineas.push('no se volverá a notificar.')
  lineas.push('')
  lineas.push('_Gama Seguridad - Monitoreo 24/7_')

  return lineas.join('\n')
}

export function generarMensajeEnergia(info: EventInfo): string {
  return [
    '🛡️ *GAMA SEGURIDAD*',
    '━━━━━━━━━━━━━━━━━━━━━',
    '',
    '⚡ *ALERTA DE ENERGÍA ELÉCTRICA*',
    '',
    `👤 Cliente: *${info.cuenta}* - ${info.nombre_cliente}`,
    info.direccion ? `📍 Dirección: ${info.direccion}` : '',
    `🕐 Hora: ${info.fecha_hora}`,
    '',
    'Su sistema opera con batería de respaldo.',
    'Tiempo estimado: 72 horas.',
    '',
    '━━━━━━━━━━━━━━━━━━━━━',
    'Responda:',
    '✅ *OK* → Confirmado recepción',
    '🆘 *AYUDA* → Necesito asistencia',
    '',
    '⚡ Si no responde en 1 hora,',
    'no se volverá a notificar.',
    '',
    '_Gama Seguridad - Monitoreo 24/7_',
  ].filter(Boolean).join('\n')
}

export function interpretarRespuesta(body: any): ReplyResult | null {
  const evento = body?.event
  const datos = body?.data

  if (evento !== 'messages.upsert' || !datos) return null

  const mensaje = datos?.message?.conversation || datos?.message?.extendedTextMessage?.text || ''
  const texto = mensaje.trim().toUpperCase()
  const numero = (datos.key?.remoteJid || '').replace('@s.whatsapp.net', '').replace('@c.us', '')

  if (!numero || datos.key?.fromMe) return null

  if (texto === 'OK' || texto === 'OK.') {
    return { tipo: 'ok', mensaje: texto, numero }
  }
  if (texto === 'AYUDA' || texto === 'AYUDA.') {
    return { tipo: 'ayuda', mensaje: texto, numero }
  }
  if (texto === 'SILENCIO' || texto === 'SILENCIO.') {
    return { tipo: 'silencio', mensaje: texto, numero }
  }

  const isPanico = PANICO_KEYWORDS.some(k => texto.includes(k))
  if (isPanico) {
    return { tipo: 'panico', mensaje: texto, numero }
  }

  if (ENERGIA_KEYWORDS.some(k => texto.includes(k)) && (texto.includes('OK') || texto.includes('RECIBIDO'))) {
    return { tipo: 'confirmacion_energia', mensaje: texto, numero }
  }

  return { tipo: 'desconocido', mensaje: texto, numero }
}
