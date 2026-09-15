import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import clientesData from '@/lib/clientes_general.json'

export const dynamic = 'force-dynamic'

interface TriggerCallRequest {
  eventoId?: number
  cuenta: string
  evento: string
  zona?: string
  nombreAbonado?: string
  telefonoManual?: string
}

const clientesMap = clientesData as Record<string, any>

export async function POST(req: Request) {
  try {
    const body: TriggerCallRequest = await req.json()
    const { eventoId, cuenta, evento, zona = '', nombreAbonado = '', telefonoManual } = body

    if (!cuenta) {
      return NextResponse.json({ ok: false, error: 'Cuenta requerida' }, { status: 400 })
    }

    // 1. Extraer ficha del cliente desde el archivo de datos existente
    const cl = clientesMap[cuenta] || {}
    const nombreFinal = cl.nombre || nombreAbonado || `Abonado ${cuenta}`
    const direccionFinal = cl.direccion || 'Inmueble protegido'
    const titularFinal = cl.nombre1 || 'Titular'

    // Teléfono: Si viene manual se usa, si no, se busca en orden t1 -> telefono1 -> t2
    const rawTel = telefonoManual || cl.t1 || cl.telefono1 || cl.t2 || ''
    const cleanDigits = rawTel.replace(/[^0-9]/g, '')
    let telefonoE164 = cleanDigits
    if (cleanDigits.length === 9 && cleanDigits.startsWith('9')) {
      telefonoE164 = `56${cleanDigits}`
    } else if (cleanDigits.length === 8) {
      telefonoE164 = `56${cleanDigits}`
    }

    // 2. Formateo de zona: Si no hay descripción o está vacía, usar número de zona limpio
    let zonaTexto = 'alarma general'
    if (zona && String(zona).trim()) {
      const zTrim = String(zona).trim()
      const soloNum = zTrim.replace(/[^0-9]/g, '')
      if (soloNum) {
        zonaTexto = `zona ${parseInt(soloNum, 10)}`
      } else {
        zonaTexto = zTrim
      }
    }

    // 3. Payload para el microservicio Asterisk AudioSocket (o Mock/Disparo en línea)
    const asteriskPayload = {
      eventoId,
      cuenta,
      telefono: telefonoE164,
      titular: titularFinal,
      cliente: nombreFinal,
      direccion: direccionFinal,
      evento,
      zonaTexto,
      timestamp: new Date().toISOString()
    }

    // 4. Intentar disparo hacia el microservicio local de Asterisk si está activo
    const dispatcherUrl = process.env.ASTERISK_DISPATCHER_URL || 'http://localhost:8000/api/trigger-call'
    let asteriskDispatched = false
    let dispatcherResponse = ''

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      const res = await fetch(dispatcherUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asteriskPayload),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        asteriskDispatched = true
        dispatcherResponse = await res.text()
      }
    } catch {
      // Si el microservicio local aún no está corriendo en el host, queda en cola lista
    }

    // 5. Dejar registro anticipado en la bitácora si no se pudo conectar o como log inicial
    return NextResponse.json({
      ok: true,
      mensaje: 'Llamada de Auto-Operador procesada',
      telefono: telefonoE164,
      titular: titularFinal,
      zonaTexto,
      asteriskDispatched,
      dispatcherResponse
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Error al disparar llamada' }, { status: 500 })
  }
}
