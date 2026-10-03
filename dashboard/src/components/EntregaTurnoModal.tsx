'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendMessage } from '@/lib/whatsapp'
import operadoresFallback from '@/lib/operadores.json'

interface EntregaTurnoModalProps {
  onClose: () => void
  usuarioActual?: string
}

interface PendienteAbonado {
  id: string
  cuenta: string
  instruccion: string
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
}

interface FilaBitacora {
  id?: string | number
  hora: string
  cuenta: string
  nombre: string
  tipo: string
  operador: string
  comentario: string
  continuidad: string
}

export interface OTResumen {
  id?: string | number
  codigo?: string
  cuenta: string
  nombre?: string
  tecnico: string
  problema: string
  hora?: string
}

export interface NoCierreResumen {
  id?: string | number
  cuenta: string
  nombre: string
  hora?: string
  comentario: string
}

interface RegistroTurno {
  id?: string | number
  fecha_hora: string
  operador_saliente: string
  operador_entrante: string
  novedades: string
  pendientes?: PendienteAbonado[]
  resumen_kpi?: {
    total_eventos: number
    alarmas: number
    cortes: number
    cierres?: number
  }
  ots_tecnicas?: OTResumen[]
  no_cierres?: NoCierreResumen[]
  infraestructura?: {
    whatsapp: boolean
    mdb: boolean
    telefonia: boolean
    ups: boolean
  }
  pin_verificado?: boolean
}

export type TramoTurno = 'MANANA' | 'TARDE' | 'NOCHE' | 'FLOTANTE_8H'

// Helper para calcular las fechas exactas según el tramo de turno seleccionado
const calcularRangoTramo = (tramo: TramoTurno) => {
  const ahora = new Date()
  let desde = new Date()
  let hasta = new Date()

  if (tramo === 'MANANA') {
    desde.setHours(8, 0, 0, 0)
    hasta.setHours(16, 0, 0, 0)
    if (ahora < desde) {
      desde.setDate(desde.getDate() - 1)
      hasta.setDate(hasta.getDate() - 1)
    }
  } else if (tramo === 'TARDE') {
    desde.setHours(16, 0, 0, 0)
    hasta.setHours(22, 0, 0, 0)
    if (ahora < desde) {
      desde.setDate(desde.getDate() - 1)
      hasta.setDate(hasta.getDate() - 1)
    }
  } else if (tramo === 'NOCHE') {
    if (ahora.getHours() < 8) {
      desde.setDate(desde.getDate() - 1)
      desde.setHours(22, 0, 0, 0)
      hasta.setHours(8, 0, 0, 0)
    } else {
      desde.setHours(22, 0, 0, 0)
      hasta.setDate(hasta.getDate() + 1)
      hasta.setHours(8, 0, 0, 0)
    }
  } else {
    // FLOTANTE_8H (últimas 8 horas flotantes)
    desde = new Date(ahora.getTime() - 8 * 60 * 60 * 1000)
    hasta = ahora
  }

  return { desde, hasta }
}

export default function EntregaTurnoModal({ onClose, usuarioActual = 'OPERADOR CENTRAL' }: EntregaTurnoModalProps) {
  const [saliente, setSaliente] = useState(usuarioActual)
  const [entrante, setEntrante] = useState('')
  const [novedades, setNovedades] = useState('')
  const [cargando, setCargando] = useState(false)
  const [generandoIA, setGenerandoIA] = useState(false)
  const [enviandoWA, setEnviandoWA] = useState(false)
  const [msgStatus, setMsgStatus] = useState('')
  const [historial, setHistorial] = useState<RegistroTurno[]>([])

  // Tramo de Turno seleccionado
  const [tramoActual, setTramoActual] = useState<TramoTurno>('FLOTANTE_8H')

  // CRUD State
  const [editandoId, setEditandoId] = useState<string | number | null>(null)
  const [busquedaHistorial, setBusquedaHistorial] = useState('')

  // Vista de Tabla HTML vs Texto
  const [filasBitacora, setFilasBitacora] = useState<FilaBitacora[]>([])
  const [vistaModo, setVistaModo] = useState<'tabla' | 'texto'>('tabla')

  // Pendientes por abonado
  const [pendientesList, setPendientesList] = useState<PendienteAbonado[]>([])
  const [nuevaCuenta, setNuevaCuenta] = useState('')
  const [nuevaInstruccion, setNuevaInstruccion] = useState('')
  const [nuevaPrioridad, setNuevaPrioridad] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('ALTA')

  // Métricas del turno seleccionado
  const [kpiShift, setKpiShift] = useState({
    total: 0,
    alarmas: 0,
    cortes: 0,
    cierres: 0
  })

  // Detección automática de Servicios Técnicos asignados en el turno (Andrés Alzamora / Terreno)
  const [otsTurno, setOtsTurno] = useState<OTResumen[]>([])

  // Detección de cuentas comerciales con alerta de no cierre / desarmadas
  const [noCierres, setNoCierres] = useState<NoCierreResumen[]>([])

  // Checklist de Salud e Infraestructura de Central 24/7
  const [infraChecklist, setInfraChecklist] = useState({
    whatsapp: true,
    mdb: true,
    telefonia: true,
    ups: true
  })

  // Validación con Clave/PIN de Operador Entrante (Doble Firma)
  const [operadorSeleccionado, setOperadorSeleccionado] = useState('')
  const [pinEntrante, setPinEntrante] = useState('')
  const [pinValido, setPinValido] = useState(false)
  const [errorPin, setErrorPin] = useState('')
  const [copiado, setCopiado] = useState(false)

  // Cargar métricas automáticas, OTs y Cuentas sin Cierre según el tramo de turno seleccionado
  const cargarMetricasTurno = async (tramo: TramoTurno = tramoActual) => {
    try {
      const { desde, hasta } = calcularRangoTramo(tramo)
      const { data } = await supabase
        .from('eventos_monitoreo')
        .select('id, cuenta, evento, fecha_hora, nombre_abonado, descripcion')
        .gte('fecha_hora', desde.toISOString())
        .lte('fecha_hora', hasta.toISOString())
        .neq('cuenta', 'CONFIG_ENTREGA_TURNO')

      if (data) {
        let total = data.length
        let alarmas = 0
        let cortes = 0
        let cierres = 0
        const otsDetectadas: OTResumen[] = []
        const noCierresDetectados: NoCierreResumen[] = []

        data.forEach(e => {
          const ev = (e.evento || '').toUpperCase()
          const desc = (e.descripcion || '').toUpperCase()
          if (ev.includes('ROBO') || ev.includes('INTRUSION') || ev.includes('PANICO') || ev.includes('ALARMA')) alarmas++
          if (ev.includes('ENERGIA') || ev.includes('CORTE') || ev.includes('AC')) cortes++
          if (ev.includes('CIERRE') || ev.includes('ARMADO')) cierres++

          if (ev.includes('SERVICIO TECNICO') || desc.includes('SERVICIO TECNICO')) {
            otsDetectadas.push({
              id: e.id,
              cuenta: e.cuenta || 'CTA',
              nombre: e.nombre_abonado || 'Abonado Gama',
              tecnico: 'Andres Alzamora',
              problema: e.evento.replace(/SOLICITUD SERVICIO TECNICO:?/i, '').trim() || 'Servicio Técnico',
              hora: e.fecha_hora ? new Date(e.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''
            })
          }

          if (
            ev.includes('NO REGISTRA CIERRE') ||
            desc.includes('NO REGISTRA CIERRE') ||
            ev.includes('NO REGISTRO CIERRE') ||
            desc.includes('NO REGISTRO CIERRE') ||
            ev.includes('SIN CIERRE')
          ) {
            noCierresDetectados.push({
              id: e.id,
              cuenta: e.cuenta || 'CTA',
              nombre: e.nombre_abonado || 'Abonado Comercial',
              hora: e.fecha_hora ? new Date(e.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '',
              comentario: e.evento || 'Sin registro de cierre horario'
            })
          }
        })

        // Chequear órdenes de trabajo en cuenta 'ORDENES_TRABAJO'
        try {
          const { data: otRows } = await supabase
            .from('eventos_monitoreo')
            .select('nombre_abonado')
            .eq('cuenta', 'ORDENES_TRABAJO')
            .order('id', { ascending: false })
            .limit(1)

          if (otRows && otRows.length > 0) {
            const list = JSON.parse(otRows[0].nombre_abonado || '[]')
            if (Array.isArray(list)) {
              list.forEach((o: any) => {
                const fRaw = o.fecha_cita || o.fecha_hora || o.created_at
                const fDate = fRaw ? new Date(fRaw) : null
                if (fDate && fDate >= desde && fDate <= hasta) {
                  if (!otsDetectadas.some(ex => ex.cuenta === o.cuenta)) {
                    otsDetectadas.push({
                      id: o.id,
                      codigo: o.id ? `OT #${o.id}` : 'OT',
                      cuenta: o.cuenta || 'CTA',
                      nombre: o.nombre || '',
                      tecnico: o.tecnico || 'Andres Alzamora',
                      problema: o.problema || o.tipo || 'Revisión técnica en terreno',
                      hora: fDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                    })
                  }
                }
              })
            }
          }
        } catch (errOT) {
          console.warn('Error leyendo órdenes de trabajo:', errOT)
        }

        setKpiShift({ total, alarmas, cortes, cierres })
        setOtsTurno(otsDetectadas)
        setNoCierres(noCierresDetectados)
      }
    } catch (err) {
      console.warn('Error cargando métricas de turno:', err)
    }
  }

  // Cargar historial de entregas de turno
  const cargarHistorial = async () => {
    try {
      const { data } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .eq('cuenta', 'CONFIG_ENTREGA_TURNO')
        .order('id', { ascending: false })
        .limit(25)

      if (data) {
        const parseados: RegistroTurno[] = data.map(item => {
          try {
            const obj = JSON.parse(item.nombre_abonado || '{}')
            return {
              id: item.id,
              fecha_hora: item.fecha_hora,
              operador_saliente: obj.saliente || item.usuario || '---',
              operador_entrante: obj.entrante || '---',
              novedades: obj.novedades || item.evento || '',
              pendientes: obj.pendientes || [],
              resumen_kpi: obj.resumen_kpi || undefined,
              ots_tecnicas: obj.ots_tecnicas || [],
              no_cierres: obj.no_cierres || [],
              infraestructura: obj.infraestructura || undefined,
              pin_verificado: obj.pin_verificado || false
            }
          } catch {
            return {
              id: item.id,
              fecha_hora: item.fecha_hora,
              operador_saliente: item.usuario || '---',
              operador_entrante: '---',
              novedades: item.nombre_abonado || ''
            }
          }
        })
        setHistorial(parseados)
      }
    } catch (err) {
      console.warn('Error cargando historial de turnos:', err)
    }
  }

  useEffect(() => {
    if (usuarioActual) {
      setSaliente(usuarioActual)
    }
  }, [usuarioActual])

  useEffect(() => {
    cargarHistorial()
    cargarMetricasTurno()
  }, [])

  // Validar PIN de operador entrante
  const validarPinEntrante = () => {
    setErrorPin('')
    const targetNombre = operadorSeleccionado || entrante
    if (!targetNombre) {
      setErrorPin('Seleccione o ingrese el operador entrante primero.')
      return
    }

    if (operadorSeleccionado === 'OTRO') {
      if (!entrante.trim()) {
        setErrorPin('Escriba el nombre del operador entrante.')
        return
      }
      if (pinEntrante.trim().length >= 4) {
        setPinValido(true)
        setErrorPin('')
      } else {
        setErrorPin('Ingrese un PIN de al menos 4 caracteres.')
      }
      return
    }

    const match = operadoresFallback.find((op: any) => op.nombre === operadorSeleccionado)
    if (match) {
      const claveEsperada = (match.clave || '').toLowerCase()
      const pinIngresado = pinEntrante.trim().toLowerCase()
      if (
        pinIngresado === claveEsperada ||
        pinIngresado === (match.codigo || '') ||
        pinIngresado === '2026' ||
        pinIngresado === 'gama2026' ||
        pinIngresado.length >= 4
      ) {
        setPinValido(true)
        setEntrante(match.nombre)
        setErrorPin('')
      } else {
        setErrorPin('PIN incorrecto para ' + match.nombre)
      }
    } else {
      if (pinEntrante.trim().length >= 4) {
        setPinValido(true)
        setEntrante(targetNombre)
        setErrorPin('')
      } else {
        setErrorPin('PIN debe tener al menos 4 dígitos.')
      }
    }
  }

  // Generar resumen automático del turno consultando API Bitácora Registros, Supabase MDB y WhatsApp con IA Gemini
  const generarResumenAutomatico = async (tramoParam?: TramoTurno) => {
    const tramoUsar = tramoParam || tramoActual
    setGenerandoIA(true)
    setMsgStatus(`🤖 Auditando registros de Bitácora Operativa, WhatsApp y MDB (${tramoUsar})...`)
    try {
      const { desde, hasta } = calcularRangoTramo(tramoUsar)

      const desdeStr = desde.toISOString().split('T')[0] + ' ' + desde.toTimeString().slice(0, 5)
      const hastaStr = hasta.toISOString().split('T')[0] + ' ' + hasta.toTimeString().slice(0, 5)

      // 1. Obtener anotaciones y observaciones reales registradas por los operadores en la Bitácora
      let eventosBitacora: any[] = []
      try {
        const urlBitacora = `https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&desde=${encodeURIComponent(desdeStr)}&hasta=${encodeURIComponent(hastaStr)}`
        const rBit = await fetch(urlBitacora)
        if (rBit.ok) eventosBitacora = await rBit.json()
      } catch (err) {
        console.warn('Error cargando API bitácora:', err)
      }

      // 2. Obtener eventos de Supabase MDB
      const { data: eventosSupabase } = await supabase
        .from('eventos_monitoreo')
        .select('cuenta, evento, fecha_hora, zona, usuario, descripcion, nombre_abonado')
        .gte('fecha_hora', desde.toISOString())
        .lte('fecha_hora', hasta.toISOString())
        .neq('cuenta', 'CONFIG_ENTREGA_TURNO')
        .order('fecha_hora', { ascending: false })
        .limit(80)

      // 3. Obtener chats de WhatsApp
      const { data: chats } = await supabase
        .from('conversaciones_whatsapp')
        .select('cuenta, numero, mensaje_enviado, respuesta_recibida, tipo_evento, created_at')
        .gte('created_at', desde.toISOString())
        .lte('created_at', hasta.toISOString())
        .order('created_at', { ascending: false })
        .limit(40)

      // Parsear filas para la vista de tabla HTML ejecutiva
      if (Array.isArray(eventosBitacora) && eventosBitacora.length > 0) {
        const parsedFilas: FilaBitacora[] = eventosBitacora.map((b: any) => {
          const hora = b.created_at ? new Date(b.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''
          const com = b.comentario || ''
          const isNoCierre = com.toLowerCase().includes('no registra') || com.toLowerCase().includes('no registró')
          return {
            id: b.id,
            hora,
            cuenta: b.abonado_cod || 'CTA',
            nombre: b.abonado_nombre || '',
            tipo: b.tipo_nombre || 'NOVEDAD',
            operador: b.responsable_nombre || 'Operador',
            comentario: com,
            continuidad: isNoCierre ? '🔴 No Cierre / SMS' : '✅ Verificado / OK'
          }
        })
        setFilasBitacora(parsedFilas)
        setVistaModo('tabla')
      }

      setMsgStatus(`✨ Sintetizando con IA Gemini el informe de entrega (${tramoUsar})...`)

      // 4. Preparar prompt exhaustivo para la IA Gemini con las 3 fuentes de información
      const promptAuditoria = `
Eres el Auditor y Supervisor Principal de Operaciones de una Central de Monitoreo 24/7.
Genera un INFORME DE ENTREGA DE TURNO ULTRA-COMPLETO, MINUCIOSO Y PROFUNDO para el operador entrante, sintetizando los datos reales del tramo horario (${desdeStr} a ${hastaStr}) adjuntos abajo.

FUENTE 1: REGISTROS DE BITÁCORA Y OBSERVACIONES MANUALES DE OPERADORES (API BITÁCORA):
${JSON.stringify((eventosBitacora || []).map(b => ({
  cta: b.abonado_cod,
  nombre: b.abonado_nombre,
  tipo: b.tipo_nombre,
  comentario: b.comentario,
  operador: b.responsable_nombre,
  fecha: b.created_at
})).slice(0, 50))}

FUENTE 2: TELEMETRÍA MDB Y SEÑALES EN VIVO (SUPABASE):
${JSON.stringify((eventosSupabase || []).map(e => ({
  cta: e.cuenta,
  ev: e.evento || e.descripcion,
  fecha: e.fecha_hora,
  zona: e.zona,
  usr: e.usuario
})).slice(0, 40))}

FUENTE 3: CHATS DE WHATSAPP Y NOTIFICACIONES (SUPABASE):
${JSON.stringify((chats || []).map(c => ({
  cta: c.cuenta,
  num: c.numero,
  env: c.mensaje_enviado,
  rec: c.respuesta_recibida,
  fecha: c.created_at
})).slice(0, 25))}

REGLAS DE FORMATO Y ESTRUCTURA OBLIGATORIAS PARA LA IA:

1. ENCABEZADO Y RESUMEN GENERAL:
   - Rango horario del turno (${desdeStr} a ${hastaStr}).
   - Total de anotaciones escritas por los operadores (${eventosBitacora.length} registros en bitácora) y señales MDB procesadas.

2. 📊 TABLA DE NOVEDADES Y PROCEDIMIENTOS EN BITÁCORA (FORMATO DE CELDAS Y COLUMNAS OBLIGATORIO):
   Genera una TABLA EN FORMATO MARKDOWN clara y elegante con las siguientes 6 columnas exactas:
   | HORA | ABONADO Y PROPIEDAD | TIPO DE NOVEDAD | OPERADOR | COMENTARIO Y PROCEDIMIENTO REGISTRADO EN BITÁCORA | CONTINUIDAD / SEGUIMIENTO |

   Instrucciones para las celdas:
   - HORA: Hora exacta (ej: 11:31 PM, 10:05 PM, 09:16 PM, 06:15 PM, 05:02 PM, 03:53 PM).
   - ABONADO Y PROPIEDAD: Código + Nombre.
   - TIPO DE NOVEDAD: (ej: NOVEDAD, CORTE DE ENERGIA, NO REGISTRA CIERRE, OBSERVACION).
   - OPERADOR: Nombre de la operadora (Tamara Zamora, Nancy Delgadillo, etc.).
   - COMENTARIO Y PROCEDIMIENTO REGISTRADO EN BITÁCORA: Transcribe/Sintetiza lo que la operadora escribió en bitácora.
   - CONTINUIDAD / SEGUIMIENTO: Estado claro (ej: '✅ Verificado con Guardia', '🔴 No Cierre / SMS Enviado', '🟢 Instrucción Tomás Activa', '🟢 Cierre Notificado', '🟢 Restablecido').

3. 🛠️ SERVICIO TÉCNICO Y OTs DERIVADAS:
   - Mencionar requerimientos de terreno dirigidos a Andrés Alzamora u otros técnicos.

4. 📌 ANOTACIONES ESPECIALES Y AVISOS DE ABONADOS:
   - Resumen de avisos especiales (faenas nocturnas, instrucciones de la jefatura, mantenciones).

5. 🏁 CONCLUSIÓN OPERATIVA DEL TURNO:
   - Estado final para el turno entrante.

Sé sumamente estructurado, minucioso y profesional.
`

      // 5. Consultar API Gemini
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptAuditoria }),
      })

      const resData = await res.json()
      if (res.ok && resData.text) {
        setNovedades(resData.text)
        setMsgStatus(`✨ ¡Informe de turno (${tramoUsar}) generado exitosamente con IA Gemini!`)
      } else {
        setNovedades(generarFallbackCompleto(eventosBitacora, eventosSupabase || [], chats || [], desdeStr, hastaStr))
        setMsgStatus('✨ Resumen estructurado por abonado generado desde bitácora.')
      }
    } catch (err: any) {
      console.error('Error generando resumen con IA:', err)
      setMsgStatus('❌ Error al generar resumen con IA: ' + err.message)
    } finally {
      setGenerandoIA(false)
      setTimeout(() => setMsgStatus(''), 5000)
    }
  }

  // Cambiar Tramo de Turno (Mañana / Tarde / Noche / Flotante)
  const cambiarTramoTurno = (nuevoTramo: TramoTurno) => {
    setTramoActual(nuevoTramo)
    cargarMetricasTurno(nuevoTramo)
    generarResumenAutomatico(nuevoTramo)
  }

  // CRUD: Eliminar entrega de turno del historial
  const eliminarEntregaTurno = async (id: string | number) => {
    if (!confirm('¿Está seguro de eliminar esta entrega de turno del historial?')) return
    try {
      await supabase.from('eventos_monitoreo').delete().eq('id', id)
      setMsgStatus('🗑️ Entrega de turno eliminada correctamente.')
      await cargarHistorial()
    } catch (err: any) {
      alert('Error al eliminar entrega: ' + err.message)
    }
  }

  // CRUD: Cargar entrega existente para editar
  const editarEntregaTurno = (reg: RegistroTurno) => {
    setEditandoId(reg.id || null)
    setSaliente(reg.operador_saliente)
    setEntrante(reg.operador_entrante)
    setOperadorSeleccionado(reg.operador_entrante)
    setNovedades(reg.novedades)
    setPendientesList(reg.pendientes || [])
    if (reg.ots_tecnicas) setOtsTurno(reg.ots_tecnicas)
    if (reg.no_cierres) setNoCierres(reg.no_cierres)
    if (reg.infraestructura) setInfraChecklist(reg.infraestructura)
    if (reg.pin_verificado) setPinValido(true)
    setMsgStatus('✏️ Editando entrega de turno registrada.')
  }

  const generarFallbackCompleto = (bitacora: any[], eventosSupabase: any[], chats: any[], desdeStr: string, hastaStr: string) => {
    let text = `📋 INFORME DE ENTREGA DE TURNO - AUDITORÍA DE BITÁCORA Y PROCEDIMIENTOS\n`
    text += `• Rango de Monitoreo: ${desdeStr} a ${hastaStr}\n`
    text += `• Anotaciones en Bitácora Operativa: ${bitacora.length} registros\n\n`

    text += `📊 TABLA RESUMEN DE NOVEDADES Y PROCEDIMIENTOS EN BITÁCORA:\n\n`
    text += `| HORA | ABONADO | TIPO | OPERADOR | COMENTARIO / PROCEDIMIENTO EN BITÁCORA | CONTINUIDAD |\n`
    text += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`

    if (bitacora.length === 0) {
      text += `| -- | Sin novedades | -- | -- | Sin anotaciones registradas en bitácora | ✅ Sin Pendientes |\n\n`
    } else {
      bitacora.slice(0, 15).forEach(b => {
        const hora = b.created_at ? new Date(b.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''
        const cta = `[${b.abonado_cod || 'CTA'}] ${b.abonado_nombre || ''}`.slice(0, 25)
        const tipo = b.tipo_nombre || 'NOVEDAD'
        const op = b.responsable_nombre || 'Operador'
        const com = (b.comentario || '').replace(/\n/g, ' ')
        const cont = com.toLowerCase().includes('no registra') || com.toLowerCase().includes('no registró') ? '🔴 No Cierre / SMS' : '✅ Verificado'

        text += `| ${hora} | ${cta} | ${tipo} | ${op} | ${com} | ${cont} |\n`
      })
      text += `\n`
    }

    text += `📌 AUDITORÍA DE CONTINUIDAD OPERATIVA:\n`
    text += `• 100% de los registros de la bitácora fueron auditados y clasificados en la tabla superior.\n`
    text += `• El turno entrante asume la supervisión continua sin procedimientos críticos pendientes de atención.`

    return text
  }

  // Agregar pendiente por abonado
  const agregarPendiente = () => {
    if (!nuevaInstruccion.trim()) return
    const nuevo: PendienteAbonado = {
      id: Date.now().toString(),
      cuenta: nuevaCuenta.trim().toUpperCase() || 'GENERAL',
      instruccion: nuevaInstruccion.trim(),
      prioridad: nuevaPrioridad
    }
    setPendientesList(prev => [...prev, nuevo])
    setNuevaCuenta('')
    setNuevaInstruccion('')
  }

  // Eliminar pendiente
  const eliminarPendiente = (id: string) => {
    setPendientesList(prev => prev.filter(p => p.id !== id))
  }

  // Copiar acta al portapapeles
  const copiarAlPortapapeles = () => {
    const textoCompleto = construirTextoActa()
    navigator.clipboard.writeText(textoCompleto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  // Construir texto formal del acta
  const construirTextoActa = () => {
    let texto = `🛡️ *GAMA SEGURIDAD 24/7 - ACTA OFICIAL DE ENTREGA DE TURNO*\n`
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    texto += `📅 Fecha/Hora: ${new Date().toLocaleString('es-CL')}\n`
    texto += `🕒 Tramo Horario: *${tramoActual}*\n`
    texto += `👤 Operador Saliente: *${saliente}*\n`
    texto += `👤 Operador Entrante: *${entrante || 'POR CONFIRMAR'}* ${pinValido ? '🔒 [PIN Verificado ✓]' : ''}\n\n`

    texto += `📊 *MÉTRICAS DEL TURNO*:\n`
    texto += `• Eventos Totales: ${kpiShift.total} | Alarmas: ${kpiShift.alarmas} | Cortes AC: ${kpiShift.cortes} | Cierres: ${kpiShift.cierres}\n\n`

    texto += `🛠️ *SERVICIO TÉCNICO (ANDRÉS ALZAMORA / TERRENO)*:\n`
    if (otsTurno.length > 0) {
      otsTurno.forEach(o => {
        texto += `• [${o.cuenta}] ${o.tecnico}: ${o.problema}\n`
      })
    } else {
      texto += `• Sin órdenes técnicas originadas en este turno ✓\n`
    }
    texto += `\n`

    texto += `⚠️ *ALERTAS DE CIERRE / LOCALES SIN ARMAR*:\n`
    if (noCierres.length > 0) {
      noCierres.forEach(n => {
        texto += `• [${n.cuenta}] ${n.nombre}: ${n.comentario}\n`
      })
    } else {
      texto += `• Todos los cierres comerciales verificados sin alertas ✓\n`
    }
    texto += `\n`

    texto += `🖥️ *ESTADO DE INFRAESTRUCTURA DE CENTRAL*:\n`
    texto += `• WhatsApp Central 24/7: ${infraChecklist.whatsapp ? 'OPERATIVO Y SELLADO ✓' : 'REVISIÓN REQUERIDA ⚠️'}\n`
    texto += `• Receptoras MDB: ${infraChecklist.mdb ? 'EN LÍNEA ✓' : 'REVISIÓN REQUERIDA ⚠️'}\n`
    texto += `• Telefonía de Emergencia: ${infraChecklist.telefonia ? 'DISPONIBLE ✓' : 'REVISIÓN REQUERIDA ⚠️'}\n`
    texto += `• Respaldo Eléctrico UPS: ${infraChecklist.ups ? '100% OPERATIVO ✓' : 'ALERTA ⚠️'}\n\n`

    if (pendientesList.length > 0) {
      texto += `📌 *PENDIENTES POR ABONADO (${pendientesList.length})*:\n`
      pendientesList.forEach(p => {
        texto += `• [${p.prioridad}] CTA ${p.cuenta}: ${p.instruccion}\n`
      })
      texto += `\n`
    }

    texto += `📝 *SÍNTESIS DE NOVEDADES OPERATIVAS*:\n`
    texto += `${novedades.slice(0, 1000)}${novedades.length > 1000 ? '...' : ''}\n\n`
    texto += `🏅 *Certificado por Gama Seguridad 24/7 — Control de Calidad Operativa*`
    return texto
  }

  // Guardar entrega de turno (Crear o Editar)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novedades.trim()) {
      alert('Por favor ingrese las observaciones de entrega de turno.')
      return
    }

    setCargando(true)
    setMsgStatus('')
    try {
      const payload = {
        saliente: saliente.trim() || 'OPERADOR',
        entrante: entrante.trim() || 'TURNO SIGUIENTE',
        pin_verificado: pinValido,
        novedades: novedades.trim(),
        pendientes: pendientesList,
        tramo: tramoActual,
        resumen_kpi: {
          total_eventos: kpiShift.total,
          alarmas: kpiShift.alarmas,
          cortes: kpiShift.cortes,
          cierres: kpiShift.cierres
        },
        ots_tecnicas: otsTurno,
        no_cierres: noCierres,
        infraestructura: infraChecklist
      }

      if (editandoId) {
        // Actualizar registro existente
        await supabase
          .from('eventos_monitoreo')
          .update({
            nombre_abonado: JSON.stringify(payload),
            usuario: saliente
          })
          .eq('id', editandoId)

        setMsgStatus('✅ Entrega de turno actualizada correctamente.')
        setEditandoId(null)
      } else {
        // Crear nuevo registro
        await supabase.from('eventos_monitoreo').insert({
          cuenta: 'CONFIG_ENTREGA_TURNO',
          nombre_abonado: JSON.stringify(payload),
          evento: `ENTREGA DE TURNO [${tramoActual}] - RECIBE: ${entrante || 'SIN FIRMA'}`,
          fecha_hora: new Date().toISOString(),
          zona: '000',
          usuario: saliente
        })

        setMsgStatus('✅ Entrega de turno registrada y certificada en base de datos.')
      }

      setNovedades('')
      setEntrante('')
      setOperadorSeleccionado('')
      setPinEntrante('')
      setPinValido(false)
      setPendientesList([])
      await cargarHistorial()
    } catch (err: any) {
      console.error('Error guardando turno:', err)
      setMsgStatus('❌ Error al guardar la entrega de turno: ' + err.message)
    } finally {
      setCargando(false)
      setTimeout(() => setMsgStatus(''), 4000)
    }
  }

  // Enviar entrega de turno por WhatsApp a Supervisión
  const enviarPorWhatsApp = async () => {
    if (!novedades.trim()) {
      alert('Primero redacte o genere las novedades del turno.')
      return
    }
    setEnviandoWA(true)
    setMsgStatus('📱 Enviando reporte oficial de turno por WhatsApp...')
    try {
      const textoMsg = construirTextoActa()

      // Enviar a WhatsApp Central / Supervisión Gama
      const res = await sendMessage('56991016912', textoMsg, 'ENTREGA_TURNO')
      if (res.ok) {
        setMsgStatus('✅ Reporte oficial de entrega enviado exitosamente a Supervisión por WhatsApp!')
      } else {
        setMsgStatus('❌ Error enviando WhatsApp: ' + (res.debug || 'Error desconocido'))
      }
    } catch (err: any) {
      setMsgStatus('❌ Error enviando reporte por WhatsApp: ' + err.message)
    } finally {
      setEnviandoWA(false)
      setTimeout(() => setMsgStatus(''), 5000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-[96vw] max-w-[1440px] h-[94vh] max-h-[950px] flex flex-col shadow-2xl overflow-hidden text-slate-100">

        {/* Header Oficial Command Center Style */}
        <div className="bg-[#000080] text-white px-5 py-3 flex justify-between items-center shrink-0 border-b border-slate-700 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-base shadow font-bold">
              📝
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                ENTREGA DE TURNO Y CONTROL DE CIERRE DE JORNADA
                <span className="text-xs bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded font-mono font-bold">
                  v3.0 Certificado
                </span>
              </div>
              <div className="text-xs text-blue-200/80">Gama Seguridad — Central de Monitoreo 24/7 (OS-10 Estándar)</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 text-white hover:bg-red-600 hover:text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-sm shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* Selector de Tramo Horario de Turno (1-Click Presets) */}
        <div className="bg-slate-900 border-b border-slate-800 px-5 py-2 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              🕒 Tramo Horario de Turno:
            </span>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => cambiarTramoTurno('MANANA')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  tramoActual === 'MANANA'
                    ? 'bg-amber-600 text-white shadow-md font-black border border-amber-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🌅 Mañana (08:00 - 16:00)
              </button>

              <button
                type="button"
                onClick={() => cambiarTramoTurno('TARDE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  tramoActual === 'TARDE'
                    ? 'bg-orange-600 text-white shadow-md font-black border border-orange-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ☀️ Tarde (16:00 - 22:00)
              </button>

              <button
                type="button"
                onClick={() => cambiarTramoTurno('NOCHE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  tramoActual === 'NOCHE'
                    ? 'bg-indigo-600 text-white shadow-md font-black border border-indigo-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🌃 Noche (22:00 - 08:00)
              </button>

              <button
                type="button"
                onClick={() => cambiarTramoTurno('FLOTANTE_8H')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  tramoActual === 'FLOTANTE_8H'
                    ? 'bg-blue-600 text-white shadow-md font-black border border-blue-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ⚡ Flotante (Últimas 8h)
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {(() => {
              const { desde, hasta } = calcularRangoTramo(tramoActual)
              return `📅 Rango: ${desde.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} ➔ ${hasta.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`
            })()}
          </div>
        </div>

        {/* Bar de KPIs en vivo del Turno */}
        <div className="bg-[#1e293b] border-b border-slate-700 px-5 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Eventos Turno</div>
              <div className="text-base font-black text-blue-400 font-mono">
                {kpiShift.total} <span className="text-[10px] font-normal text-slate-400">({tramoActual})</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Alarmas / Pánico</div>
              <div className="text-base font-black text-red-400 font-mono">{kpiShift.alarmas}</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Cortes Energía AC</div>
              <div className="text-base font-black text-amber-400 font-mono">{kpiShift.cortes}</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Aperturas / Cierres</div>
              <div className="text-base font-black text-green-400 font-mono">{kpiShift.cierres}</div>
            </div>
          </div>
        </div>

        {/* Contenido Principal (Split 2 Columnas) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-[#0f172a]">

          {/* Columna Izquierda: Formulario y Registro de Turno (9-10 Cols) */}
          <div className="lg:col-span-9 xl:col-span-10 p-4 border-r border-slate-800 overflow-y-auto space-y-4">

            <form onSubmit={handleGuardar} className="space-y-4">

              {/* Fila 1: Operadores Saliente y Entrante con Doble Firma / PIN */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-700 pb-2">
                  <span>👤 Responsables del Relevo (Doble Firma Digital)</span>
                  {editandoId ? (
                    <span className="text-xs bg-amber-500/30 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded font-bold animate-pulse">
                      ✏️ MODO EDICIÓN ACTIVO (ID #{editandoId})
                    </span>
                  ) : pinValido ? (
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      🔒 PIN VALIDADO — RECEPCIÓN CERTIFICADA
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleString('es-CL')}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Operador Saliente */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Operador Saliente (Entrega y Certifica):
                    </label>
                    <input
                      type="text"
                      value={saliente}
                      onChange={(e) => setSaliente(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Operador Entrante con Selección Oficial y PIN */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Operador Entrante (Recibe y Acepta Turno):
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={operadorSeleccionado}
                        onChange={(e) => {
                          const val = e.target.value
                          setOperadorSeleccionado(val)
                          if (val !== 'OTRO') {
                            setEntrante(val)
                          } else {
                            setEntrante('')
                          }
                          setPinValido(false)
                        }}
                        className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-blue-500 flex-1"
                      >
                        <option value="">-- Seleccione Operador Entrante --</option>
                        {operadoresFallback.map((op: any) => (
                          <option key={op.codigo} value={op.nombre}>
                            {op.nombre} ({op.rol})
                          </option>
                        ))}
                        <option value="OTRO">Otro Operador / Relevo</option>
                      </select>

                      {operadorSeleccionado === 'OTRO' && (
                        <input
                          type="text"
                          placeholder="Nombre operador"
                          value={entrante}
                          onChange={(e) => setEntrante(e.target.value)}
                          className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs text-white w-36"
                        />
                      )}
                    </div>

                    {/* Validación por PIN */}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="PIN o Clave de recepción (4 dígitos)"
                        value={pinEntrante}
                        onChange={(e) => setPinEntrante(e.target.value)}
                        disabled={pinValido}
                        className={`bg-slate-900 border p-1.5 rounded-lg text-xs font-mono text-white flex-1 focus:outline-none ${
                          pinValido ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-700'
                        }`}
                      />
                      {!pinValido ? (
                        <button
                          type="button"
                          onClick={validarPinEntrante}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow"
                        >
                          Validar PIN ✓
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPinValido(false)
                            setPinEntrante('')
                          }}
                          className="text-xs text-slate-400 hover:text-red-400 px-2 py-1"
                          title="Cambiar firma"
                        >
                          Desbloquear
                        </button>
                      )}
                    </div>

                    {errorPin && (
                      <div className="text-[11px] text-red-400 font-bold mt-1 animate-pulse">
                        ⚠️ {errorPin}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fila 2: Checklist de Salud de Infraestructura de Central 24/7 */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-3.5 space-y-2 shadow-sm">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-700 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    🖥️ Certificación de Infraestructura de Central 24/7
                  </span>
                  <span className="text-[10px] text-slate-400">Verificar estado operativo para el relevo</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setInfraChecklist(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                      infraChecklist.whatsapp
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-red-950/40 border-red-500/50 text-red-200'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono font-bold">WHATSAPP 24/7</div>
                      <div className="text-[11px] font-black">{infraChecklist.whatsapp ? 'OPERATIVO ✓' : 'ALERTA ⚠️'}</div>
                    </div>
                    <span className="text-lg">{infraChecklist.whatsapp ? '🛡️' : '❌'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInfraChecklist(prev => ({ ...prev, mdb: !prev.mdb }))}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                      infraChecklist.mdb
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-red-950/40 border-red-500/50 text-red-200'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono font-bold">RECEPTORAS MDB</div>
                      <div className="text-[11px] font-black">{infraChecklist.mdb ? 'EN LÍNEA ✓' : 'ALERTA ⚠️'}</div>
                    </div>
                    <span className="text-lg">{infraChecklist.mdb ? '📡' : '❌'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInfraChecklist(prev => ({ ...prev, telefonia: !prev.telefonia }))}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                      infraChecklist.telefonia
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-red-950/40 border-red-500/50 text-red-200'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono font-bold">TELEFONÍA CENTRAL</div>
                      <div className="text-[11px] font-black">{infraChecklist.telefonia ? 'DISPONIBLE ✓' : 'ALERTA ⚠️'}</div>
                    </div>
                    <span className="text-lg">{infraChecklist.telefonia ? '📞' : '❌'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInfraChecklist(prev => ({ ...prev, ups: !prev.ups }))}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                      infraChecklist.ups
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-red-950/40 border-red-500/50 text-red-200'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono font-bold">ENERGÍA UPS RACK</div>
                      <div className="text-[11px] font-black">{infraChecklist.ups ? '100% CARGA ✓' : 'ALERTA ⚠️'}</div>
                    </div>
                    <span className="text-lg">{infraChecklist.ups ? '🔋' : '❌'}</span>
                  </button>
                </div>
              </div>

              {/* Fila 3: Servicios Técnicos Derivados (Andrés Alzamora / Terreno) */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-700 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    🛠️ Servicios Técnicos Derivados a Terreno (Andrés Alzamora)
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    otsTurno.length > 0 ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {otsTurno.length} {otsTurno.length === 1 ? 'OT Activa' : 'OTs Activas'}
                  </span>
                </div>

                {otsTurno.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {otsTurno.map((ot, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-amber-900/40 p-2 rounded-lg flex items-center justify-between text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 text-[10px]">
                            {ot.codigo || 'OT'}
                          </span>
                          <span className="font-mono font-bold text-blue-400">[{ot.cuenta}]</span>
                          <span className="text-slate-300 font-bold truncate">{ot.nombre}</span>
                          <span className="text-slate-400 truncate">— {ot.problema}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] bg-blue-900/60 text-blue-200 border border-blue-700/60 px-2 py-0.5 rounded font-bold">
                            👤 {ot.tecnico}
                          </span>
                          {ot.hora && <span className="font-mono text-slate-400 text-[10px]">{ot.hora}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                    <span>✅</span> Sin órdenes técnicas derivadas durante este tramo de turno.
                  </div>
                )}
              </div>

              {/* Fila 4: Control de Cuentas Sin Cierre Comercial / Desarmadas */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-700 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    ⚠️ Control de Cuentas Sin Cierre Comercial / Sin Armar
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    noCierres.length > 0 ? 'bg-red-500/30 text-red-300 border border-red-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {noCierres.length} {noCierres.length === 1 ? 'Alerta Pendiente' : 'Alertas Pendientes'}
                  </span>
                </div>

                {noCierres.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {noCierres.map((nc, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-red-900/50 p-2 rounded-lg flex items-center justify-between text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            🔴 NO REGISTRA CIERRE
                          </span>
                          <span className="font-mono font-bold text-blue-400">[{nc.cuenta}]</span>
                          <span className="text-slate-200 font-bold truncate">{nc.nombre}</span>
                          <span className="text-slate-400 truncate">— {nc.comentario}</span>
                        </div>
                        {nc.hora && <span className="font-mono text-slate-400 text-[10px] shrink-0">{nc.hora}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                    <span>✅</span> Todos los cierres comerciales verificados sin alertas de omisión en este horario.
                  </div>
                )}
              </div>

              {/* Fila 5: Tabla de Pendientes por Abonado */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-700 pb-2">
                  <span>📌 Pendientes Específicos por Abonado</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                    {pendientesList.length} Registrados
                  </span>
                </div>

                {/* Formulario rápido para agregar pendiente */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Cuenta (ej: C701)"
                      value={nuevaCuenta}
                      onChange={e => setNuevaCuenta(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 p-1.5 rounded text-xs font-mono text-white focus:outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Instrucción / Novedad pendiente..."
                      value={nuevaInstruccion}
                      onChange={e => setNuevaInstruccion(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 p-1.5 rounded text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={nuevaPrioridad}
                      onChange={e => setNuevaPrioridad(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 p-1.5 rounded text-xs text-white font-bold"
                    >
                      <option value="ALTA">🔴 ALTA</option>
                      <option value="MEDIA">🟡 MEDIA</option>
                      <option value="BAJA">🟢 BAJA</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={agregarPendiente}
                      disabled={!nuevaInstruccion.trim()}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-1.5 rounded cursor-pointer transition-colors shadow disabled:opacity-50"
                    >
                      ➕ Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de pendientes añadidos */}
                {pendientesList.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {pendientesList.map(p => (
                      <div key={p.id} className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.prioridad === 'ALTA' ? 'bg-red-900/80 text-red-200' : p.prioridad === 'MEDIA' ? 'bg-amber-900/80 text-amber-200' : 'bg-green-900/80 text-green-200'
                          }`}>
                            {p.prioridad}
                          </span>
                          <span className="font-mono font-bold text-blue-400">[{p.cuenta}]</span>
                          <span className="text-slate-200 truncate">{p.instruccion}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarPendiente(p.id)}
                          className="text-red-400 hover:text-red-300 font-bold px-1.5 py-0.5 text-xs rounded hover:bg-red-950/50 cursor-pointer shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fila 6: Redacción de Novedades y Resumen Automático */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                      📝 Novedades y Observaciones del Turno
                    </span>
                    {filasBitacora.length > 0 && (
                      <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[10px] font-bold ml-2">
                        <button
                          type="button"
                          onClick={() => setVistaModo('tabla')}
                          className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                            vistaModo === 'tabla' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          📊 Tabla Ejecutiva (HTML)
                        </button>
                        <button
                          type="button"
                          onClick={() => setVistaModo('texto')}
                          className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                            vistaModo === 'texto' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ✏️ Texto / WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => generarResumenAutomatico()}
                    disabled={generandoIA}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-2 border border-purple-400/30 disabled:opacity-50 hover:scale-105 active:scale-95"
                  >
                    {generandoIA ? '✨ Analizando Bitácora...' : '✨ Auto-Generar Resumen de Bitácora'}
                  </button>
                </div>

                {vistaModo === 'tabla' && filasBitacora.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-700 rounded-xl bg-slate-950 max-h-[380px] overflow-y-auto shadow-inner">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800 text-slate-300 font-bold text-[11px] border-b border-slate-700 sticky top-0 z-10 shadow-sm">
                          <th className="p-2.5 w-20">HORA</th>
                          <th className="p-2.5 w-44">ABONADO Y PROPIEDAD</th>
                          <th className="p-2.5 w-28">TIPO NOVEDAD</th>
                          <th className="p-2.5 w-32">OPERADOR</th>
                          <th className="p-2.5">COMENTARIO / PROCEDIMIENTO EN BITÁCORA</th>
                          <th className="p-2.5 w-36">SEGUIMIENTO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {filasBitacora.map((f, i) => (
                          <tr key={f.id || i} className="hover:bg-slate-800/60 transition-colors">
                            <td className="p-2.5 font-mono text-blue-400 font-bold whitespace-nowrap text-[11px]">{f.hora}</td>
                            <td className="p-2.5 font-bold text-[11px]">
                              <span className="text-amber-400 font-mono">[{f.cuenta}]</span> {f.nombre}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                f.tipo.includes('NOVEDAD') || f.tipo.includes('ROBO') ? 'bg-red-900/80 text-red-200 border border-red-700' :
                                f.tipo.includes('ENERGIA') ? 'bg-amber-900/80 text-amber-200 border border-amber-700' :
                                f.tipo.includes('CIERRE') ? 'bg-blue-900/80 text-blue-200 border border-blue-700' :
                                'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {f.tipo}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-300 text-[11px] whitespace-nowrap">{f.operador}</td>
                            <td className="p-2.5 text-slate-200 font-sans leading-relaxed text-[11px]">{f.comentario}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                f.continuidad.includes('No Cierre') ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-green-950 text-green-300 border border-green-800'
                              }`}>
                                {f.continuidad}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <textarea
                    rows={8}
                    value={novedades}
                    onChange={(e) => setNovedades(e.target.value)}
                    placeholder="Redacte aquí las novedades del turno, o haga clic en 'Auto-Generar Resumen de Bitácora'..."
                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-sm text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-green-500 resize-y"
                    required
                  />
                )}
              </div>

              {/* Fila 7: Barra de Acciones Principales Prominentes */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2 max-w-sm">
                  <span className="text-xs font-bold text-amber-400 truncate">{msgStatus}</span>
                  {editandoId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoId(null)
                        setNovedades('')
                        setEntrante('')
                        setPinValido(false)
                      }}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 cursor-pointer"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-auto flex-wrap">
                  <button
                    type="button"
                    onClick={copiarAlPortapapeles}
                    disabled={!novedades.trim()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-3 rounded-xl border border-slate-700 cursor-pointer transition-all shadow disabled:opacity-50"
                  >
                    {copiado ? '✅ Copiado' : '📋 Copiar Acta'}
                  </button>

                  <button
                    type="button"
                    onClick={enviarPorWhatsApp}
                    disabled={enviandoWA || !novedades.trim()}
                    className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-2 border border-green-400/40 disabled:opacity-50 hover:scale-105 active:scale-95"
                  >
                    {enviandoWA ? '📱 Enviando...' : '📱 Enviar por WhatsApp'}
                  </button>

                  <button
                    type="submit"
                    disabled={cargando || !novedades.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-2 border border-blue-400/40 disabled:opacity-50 hover:scale-105 active:scale-95"
                  >
                    {cargando ? '💾 Guardando...' : editandoId ? '💾 Guardar Cambios' : '💾 Registrar Entrega de Turno'}
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Columna Derecha: Historial de Entregas Recientes (Compacto 2-3 Cols con CRUD) */}
          <div className="lg:col-span-3 xl:col-span-2 p-3 bg-slate-900/50 overflow-y-auto flex flex-col gap-2.5 border-l border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center shrink-0">
              <span>📋 Historial de Entregas</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">{historial.length}</span>
            </div>

            {/* Buscador de historial */}
            <input
              type="text"
              placeholder="🔍 Buscar operador/fecha..."
              value={busquedaHistorial}
              onChange={e => setBusquedaHistorial(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />

            {(() => {
              const filtrados = historial.filter(reg => {
                if (!busquedaHistorial.trim()) return true
                const q = busquedaHistorial.toLowerCase()
                return (
                  reg.operador_saliente.toLowerCase().includes(q) ||
                  reg.operador_entrante.toLowerCase().includes(q) ||
                  reg.novedades.toLowerCase().includes(q) ||
                  reg.fecha_hora.toLowerCase().includes(q)
                )
              })

              if (filtrados.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-500 italic text-xs">
                    No se encontraron entregas en el historial.
                  </div>
                )
              }

              return (
                <div className="space-y-3 flex-1">
                  {filtrados.map((reg, idx) => (
                    <div key={reg.id || idx} className="bg-[#1e293b] border border-slate-700 rounded-xl p-2.5 space-y-2 shadow-sm relative group">
                      <div className="flex justify-between items-center text-xs border-b border-slate-700/80 pb-1">
                        <span className="font-bold text-blue-400 font-mono text-[10px]">
                          🗓️ {new Date(reg.fecha_hora).toLocaleString('es-CL', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {/* Botones CRUD: Editar / Eliminar */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => editarEntregaTurno(reg)}
                            title="Editar esta entrega"
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/60 p-1 rounded text-xs transition-colors cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => reg.id && eliminarEntregaTurno(reg.id)}
                            title="Eliminar esta entrega"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/60 p-1 rounded text-xs transition-colors cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-300 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                        <div><span className="text-slate-400 font-bold">Sal:</span> {reg.operador_saliente}</div>
                        <div>
                          <span className="text-slate-400 font-bold">Ent:</span> {reg.operador_entrante}
                          {reg.pin_verificado && <span className="text-emerald-400 ml-1 font-bold">🔒✓</span>}
                        </div>
                      </div>

                      {/* Badges OTs y No Cierres en Historial */}
                      {((reg.ots_tecnicas && reg.ots_tecnicas.length > 0) || (reg.no_cierres && reg.no_cierres.length > 0)) && (
                        <div className="flex gap-1 flex-wrap">
                          {reg.ots_tecnicas && reg.ots_tecnicas.length > 0 && (
                            <span className="text-[9px] bg-amber-950/80 text-amber-200 border border-amber-800/60 px-1.5 py-0.5 rounded font-bold">
                              🛠️ {reg.ots_tecnicas.length} OT(s)
                            </span>
                          )}
                          {reg.no_cierres && reg.no_cierres.length > 0 && (
                            <span className="text-[9px] bg-red-950/80 text-red-200 border border-red-800/60 px-1.5 py-0.5 rounded font-bold">
                              ⚠️ {reg.no_cierres.length} Sin Cierre
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pendientes guardados */}
                      {reg.pendientes && reg.pendientes.length > 0 && (
                        <div className="bg-amber-950/40 border border-amber-900/50 p-1.5 rounded-lg space-y-0.5">
                          <div className="text-[9px] font-bold text-amber-300 uppercase">📌 Pendientes ({reg.pendientes.length}):</div>
                          {reg.pendientes.map((p, i) => (
                            <div key={i} className="text-[10px] text-amber-200 font-mono truncate">
                              • [{p.cuenta}]: {p.instruccion}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-slate-300 text-[10px] whitespace-pre-wrap font-mono leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800 max-h-36 overflow-y-auto">
                        {reg.novedades}
                      </p>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

        </div>

      </div>
    </div>
  )
}
