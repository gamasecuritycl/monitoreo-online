const OPENWA_URL = 'http://localhost:3015'
const CALLMEBOT_API = 'https://api.callmebot.com/whatsapp.php'
const CALLMEBOT_APIKEY = '4238719'

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
  session: string
  gps?: { lat: number; lng: number; timestamp: number }
}

const PANICO_KEYWORDS = ['SOCORRO', 'PÁNICO', 'PANICO', 'EMERGENCIA', 'AYUDA YA', 'SOS']
const ENERGIA_KEYWORDS = ['ENERGÍA', 'ENERGIA', 'CORTE', 'LUZ', 'RESTABLECIDO']

export async function sendMessage(telefono: string, texto: string): Promise<{ ok: boolean; debug?: string }> {
  // Intento 1: OpenWA (localhost)
  try {
    const res = await fetch(`${OPENWA_URL}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: telefono, text: texto }),
    })
    const data = await res.json()
    if (data.ok) return { ok: true, debug: 'openwa: ' + JSON.stringify(data) }
  } catch {}

  // Intento 2: CallMeBot directo desde el navegador
  try {
    const params = new URLSearchParams({
      phone: telefono,
      text: texto,
      apikey: CALLMEBOT_APIKEY,
    })
    const res = await fetch(`${CALLMEBOT_API}?${params.toString()}`)
    const data = await res.text()
    const ok = data.includes('Message queued')
    return { ok, debug: `callmebot: status=${res.status}` }
  } catch (err: any) {
    return { ok: false, debug: `error=${err.message}` }
  }
}

export async function getOpenWAStatus(): Promise<{ ready: boolean }> {
  try {
    const res = await fetch(`${OPENWA_URL}/api/status`)
    return await res.json()
  } catch {
    return { ready: false }
  }
}

export async function getMensajesRecibidos(since?: number): Promise<{ messages: any[] }> {
  try {
    const url = since ? `${OPENWA_URL}/api/messages?since=${since}` : `${OPENWA_URL}/api/messages`
    const res = await fetch(url)
    return await res.json()
  } catch {
    return { messages: [] }
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
  const event = body?.event
  const data = body?.data
  if (event !== 'message.received' || !data) return null

  const texto = (data.body || '').trim().toUpperCase()
  const numero = (data.from || '').replace('@c.us', '').replace('@s.whatsapp.net', '')
  const session = data.session || ''

  if (texto === 'OK' || texto === 'OK.') {
    return { tipo: 'ok', mensaje: texto, numero, session }
  }
  if (texto === 'AYUDA' || texto === 'AYUDA.') {
    return { tipo: 'ayuda', mensaje: texto, numero, session }
  }
  if (texto === 'SILENCIO' || texto === 'SILENCIO.') {
    return { tipo: 'silencio', mensaje: texto, numero, session }
  }

  const isPanico = PANICO_KEYWORDS.some(k => texto.includes(k))
  if (isPanico) {
    const gps = extraerGPS(body)
    return { tipo: 'panico', mensaje: texto, numero, session, gps }
  }

  if (ENERGIA_KEYWORDS.some(k => texto.includes(k)) && (texto.includes('OK') || texto.includes('RECIBIDO'))) {
    return { tipo: 'confirmacion_energia', mensaje: texto, numero, session }
  }

  return { tipo: 'desconocido', mensaje: texto, numero, session }
}

function extraerGPS(body: any): { lat: number; lng: number; timestamp: number } | undefined {
  const location = body?.data?.location
  if (location?.latitude && location?.longitude) {
    return { lat: location.latitude, lng: location.longitude, timestamp: Date.now() }
  }
  return undefined
}
