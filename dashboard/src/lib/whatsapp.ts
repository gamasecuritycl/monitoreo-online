const CALLMEBOT_API = 'https://api.callmebot.com/whatsapp.php'
const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY || '4238719'

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

export async function sendMessage(telefono: string, texto: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      phone: telefono,
      text: texto,
      apikey: CALLMEBOT_APIKEY,
    })
    const res = await fetch(`${CALLMEBOT_API}?${params.toString()}`)
    const data = await res.text()
    return data.includes('Message queued')
  } catch {
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
    critico
      ? `[🚨] ALERTA CRÍTICA - ${info.tipo_evento}`
      : `[!] NOTIFICACIÓN - ${info.tipo_evento}`,
    '',
    `Cliente: ${info.cuenta} - ${info.nombre_cliente}`,
  ]

  if (info.direccion) {
    lineas.push(`Dirección: ${info.direccion}`)
  }

  lineas.push(`Zonas: ${info.zonas.join(', ')}`)
  lineas.push(`Hora: ${info.fecha_hora}`)
  lineas.push('')

  if (critico) {
    lineas.push('⚠ MÚLTIPLES ACTIVACIONES DETECTADAS')
    lineas.push('Se ha despachado una unidad de emergencia a su dirección.')
    lineas.push('')
    lineas.push('Responda:')
    lineas.push('  OK      → Ya estoy en el lugar, todo controlado')
    lineas.push('  AYUDA   → Necesito asistencia')
    lineas.push('  SILENCIO→ No molestar por 1 hora')
  } else {
    lineas.push('Hemos registrado una activación en su sistema.')
    lineas.push('Estamos atentos ante cualquier nueva activación.')
    lineas.push('')
    lineas.push('Si requiere asistencia responda:')
    lineas.push('  AYUDA   → Necesito asistencia')
  }

  return lineas.join('\n')
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
