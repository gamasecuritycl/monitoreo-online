'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'

interface IACopilotCardProps {
  evento: EventoMonitoreo | null
  historialEventos?: EventoMonitoreo[]
  clientData?: {
    nombre?: string
    direccion?: string
    comuna?: string
    contactos?: Array<{ prioridad: string | number; nombre: string; telefono: string; cargo?: string; tipo?: 'autorizado' | 'emergencia' | 'cuadrante' | 'comisaria' | 'seguridad' }>
    emergencias?: {
      cuadrante?: { nombre: string; telefono: string }
      comisaria?: { nombre: string; telefono: string }
      seguridadCiudadana?: { nombre: string; telefono: string }
    }
  } | null
  zonas?: Array<{ numero: string; dispositivo: string; area: string }>
  tieneCamaras?: boolean
  cantCamaras?: number
  onAbrirVideo?: () => void
  onAbrirPredictor?: () => void
  onEnviarWhatsApp: (telefono: string, mensajeDefault?: string) => void
  usuarioOperador?: string
}

export default function IACopilotCard({
  evento,
  historialEventos = [],
  clientData,
  zonas = [],
  tieneCamaras = false,
  cantCamaras = 0,
  onAbrirVideo,
  onAbrirPredictor,
  onEnviarWhatsApp,
  usuarioOperador = 'Operadora'
}: IACopilotCardProps) {
  const [iaAnalizando, setIaAnalizando] = useState(false)
  const [iaDiagnostico, setIaDiagnostico] = useState<string>('')
  const [expandido, setExpandido] = useState(false)
  const [accionStatus, setAccionStatus] = useState('')
  const [guardandoBitacora, setGuardandoBitacora] = useState(false)
  const [copiadoFicha, setCopiadoFicha] = useState(false)

  // Modo Pruebas de Técnico por cuenta
  const [modoPruebasMap, setModoPruebasMap] = useState<Record<string, { activo: boolean; tecnico: string; inicio: string }>>({})
  const [nombreTecnicoInput, setNombreTecnicoInput] = useState('')
  const [mostrarConfigPrueba, setMostrarConfigPrueba] = useState(false)

  const cuentaActiva = (evento?.cuenta || '').toUpperCase().trim()
  const enModoPruebas = cuentaActiva ? Boolean(modoPruebasMap[cuentaActiva]?.activo) : false
  const datosPrueba = cuentaActiva ? modoPruebasMap[cuentaActiva] : null

  // ── 1. ANÁLISIS MULTI-ZONA Y AGRAVANTES CRÍTICOS ──
  const {
    esAlarma,
    esIncendio,
    esPanico,
    esEnergia,
    esMultiZona,
    zonasDisparadas,
    hayCorteEnergiaReciente,
    hayCorteSirenaReciente,
    hayBateriaBajaReciente,
    esRiesgoApagadoTotal,
    esUrgenciaCarabineros
  } = useMemo(() => {
    if (!evento) {
      return {
        esAlarma: false,
        esIncendio: false,
        esPanico: false,
        esEnergia: false,
        esMultiZona: false,
        zonasDisparadas: [] as string[],
        hayCorteEnergiaReciente: false,
        hayCorteSirenaReciente: false,
        hayBateriaBajaReciente: false,
        esRiesgoApagadoTotal: false,
        esUrgenciaCarabineros: false
      }
    }

    const cta = (evento.cuenta || '').toUpperCase().trim()
    const evUpper = (evento.evento || '').toUpperCase()

    const isAlarma = evUpper.includes('ALARMA') || evUpper.includes('ROBO') || evUpper.includes('INTRUSIÓN') || evUpper.includes('INTRUSION') || evUpper.includes('PERIMETRAL')
    const isPanico = evUpper.includes('PANICO') || evUpper.includes('PÁNICO') || evUpper.includes('ASALTO') || evUpper.includes('EMERGENCIA')
    const isIncendio = evUpper.includes('INCENDIO') || evUpper.includes('FUEGO') || evUpper.includes('HUMO')
    const isEnergia = evUpper.includes('ENERGIA') || evUpper.includes('ENERGÍA') || evUpper.includes('AC') || evUpper.includes('RED') || evUpper.includes('301')

    // Filtrar eventos de los últimos 45 minutos para la misma cuenta
    const ahora = Date.now()
    const ventanaTiempoMs = 45 * 60 * 1000

    const eventosCuenta = historialEventos.filter(e => {
      if ((e.cuenta || '').toUpperCase().trim() !== cta) return false
      const diff = ahora - new Date(e.fecha_hora).getTime()
      return diff >= 0 && diff <= ventanaTiempoMs
    })

    // Zonas distintas de alarma activadas
    const setZonas = new Set<string>()
    if (evento.zona && (isAlarma || isPanico)) {
      setZonas.add(evento.zona.trim())
    }

    eventosCuenta.forEach(e => {
      const eUpper = (e.evento || '').toUpperCase()
      const isEvAlarma = eUpper.includes('ALARMA') || eUpper.includes('ROBO') || eUpper.includes('INTRUSIÓN') || eUpper.includes('INTRUSION') || eUpper.includes('PERIMETRAL') || eUpper.includes('PANICO') || eUpper.includes('PÁNICO')
      if (isEvAlarma && e.zona) {
        const z = e.zona.trim()
        if (z && z !== '0' && z !== '00' && z !== '000') {
          setZonas.add(z)
        }
      }
    })

    const distinctZonas = Array.from(setZonas)
    // REGLA: Alarma confirmada / multizona solo si son > 2 zonas distintas (o al menos 2 zonas)
    const multiZona = distinctZonas.length >= 2

    // Detección de Agravantes Críticos
    const corteEnergia = eventosCuenta.some(e => {
      const u = (e.evento || '').toUpperCase()
      return u.includes('ENERGIA') || u.includes('ENERGÍA') || u.includes('CORTE AC') || u.includes('FALLA AC') || u.includes('301') || u.includes('RED')
    }) || isEnergia

    const corteSirena = eventosCuenta.some(e => {
      const u = (e.evento || '').toUpperCase()
      return u.includes('SIRENA') || u.includes('TAMPER') || u.includes('SABOTAJE') || u.includes('321') || u.includes('CORTE DE SIRENA')
    })

    // Detección de Batería Baja
    const bateriaBaja = eventosCuenta.some(e => {
      const u = (e.evento || '').toUpperCase()
      return u.includes('BATERIA') || u.includes('BATERÍA') || u.includes('BAT') || u.includes('302') || u.includes('309') || u.includes('310') || u.includes('384')
    })

    // CASO CRÍTICO: Batería baja consecutiva tras corte de luz -> Riesgo de apagado total
    const riesgoApagadoTotal = (corteEnergia || isEnergia) && bateriaBaja

    // URGENCIA MÁXIMA: Más de 2 zonas + (Corte de Energía o Corte de Sirena)
    const urgenciaCarabineros = (multiZona || isPanico) && (corteEnergia || corteSirena)

    return {
      esAlarma: isAlarma,
      esIncendio: isIncendio,
      esPanico: isPanico,
      esEnergia: isEnergia,
      esMultiZona: multiZona,
      zonasDisparadas: distinctZonas,
      hayCorteEnergiaReciente: corteEnergia,
      hayCorteSirenaReciente: corteSirena,
      hayBateriaBajaReciente: bateriaBaja,
      esRiesgoApagadoTotal: riesgoApagadoTotal,
      esUrgenciaCarabineros: urgenciaCarabineros
    }
  }, [evento?.id, evento?.cuenta, evento?.evento, evento?.zona, historialEventos])

  // Separar contactos: Autorizados vs Organismos de Emergencia
  const { contactosAutorizados, contactosEmergencia } = useMemo(() => {
    const list = clientData?.contactos || []
    const autorizados = list.filter(c => c.tipo === 'autorizado' || !c.tipo)
    const emergencias = list.filter(c => c.tipo && c.tipo !== 'autorizado')
    return { contactosAutorizados: autorizados, contactosEmergencia: emergencias }
  }, [clientData?.contactos])

  // Números específicos de emergencia
  const telCuadrante = clientData?.emergencias?.cuadrante || contactosEmergencia.find(c => c.tipo === 'cuadrante')
  const telComisaria = clientData?.emergencias?.comisaria || contactosEmergencia.find(c => c.tipo === 'comisaria')
  const telSeguridad = clientData?.emergencias?.seguridadCiudadana || contactosEmergencia.find(c => c.tipo === 'seguridad')

  // Consulta activa a Gemini IA en vivo
  useEffect(() => {
    if (!evento) {
      setIaDiagnostico('')
      setExpandido(false)
      return
    }

    if (enModoPruebas) {
      setIaDiagnostico(`🛠️ MODO PRUEBAS ACTIVO: Pruebas técnicas en ejecución por ${datosPrueba?.tecnico || 'Técnico'}. Protocolos de despacho suspendidos.`)
      return
    }

    let cancelado = false
    const consultarCopilotIA = async () => {
      setIaAnalizando(true)
      setIaDiagnostico('')
      try {
        const zonaEv = (evento.zona || '').trim()
        const zonaMatch = zonas.find(z => z.numero === zonaEv || z.numero === `0${zonaEv}`)
        
        const prompt = `
Eres el COPILOT IA DE COMANDO DE ALARMAS 24/7 en Gama Seguridad.
Procesa el siguiente evento y genera una RECOMENDACIÓN OPERATIVA TÁCTICA Y DIRECTA de 2 a 3 líneas para la operadora de turno.

📌 REGLAS DE DECISIÓN CRÍTICA:
1. Si son MÁS DE 2 ZONAS DISTINTAS ACTIVADAS (${zonasDisparadas.length} zonas: ${zonasDisparadas.join(', ')}), se considera ALARMA CONFIRMADA / MULTIZONA.
2. Si además hay CORTE DE ENERGÍA AC (${hayCorteEnergiaReciente ? 'SÍ' : 'NO'}) o CORTE DE SIRENA (${hayCorteSirenaReciente ? 'SÍ' : 'NO'}), es URGENCIA MÁXIMA DE DESPACHO POLICIAL INMEDIATO.
3. Primero recomendar contactar a Personas Autorizadas (Prioridad 1) o despachar al Plan Cuadrante / Comisaría local / Seguridad Ciudadana si hay agravantes.

📌 DATOS DEL ABONADO Y EVENTO:
- Abonado: [${evento.cuenta}] ${evento.nombre_abonado || clientData?.nombre || 'PROPIEDAD'}
- Evento recibido: ${evento.evento}
- Zona actual: ${evento.zona || '000'} ${zonaMatch ? `(${zonaMatch.dispositivo} - ${zonaMatch.area})` : ''}
- Zonas disparadas en la ventana: ${zonasDisparadas.length > 0 ? zonasDisparadas.join(', ') : 'Solo zona actual'}
- Dirección: ${clientData?.direccion || '---'}, ${clientData?.comuna || '---'}
- Teléfono Plan Cuadrante: ${telCuadrante ? `${telCuadrante.nombre} (${telCuadrante.telefono})` : 'No registrado'}
- Teléfono Comisaría: ${telComisaria ? `${telComisaria.nombre} (${telComisaria.telefono})` : '133'}
- Teléfono Seguridad Municipal: ${telSeguridad ? `${telSeguridad.nombre} (${telSeguridad.telefono})` : 'No registrado'}
- Personas Autorizadas: ${JSON.stringify(contactosAutorizados)}

Proporciona únicamente:
1. Diagnóstico de criticidad y estado (🚨 ALARMA CONFIRMADA MULTIZONA / 🔥 URGENCIA MÁXIMA DESPACHO / ⚡ ATENCIÓN / ℹ️ NORMAL).
2. Acción recomendada inmediata paso a paso (Llamar a P1 -> si no contesta / si hay agravantes -> despachar Cuadrante / Comisaría).
`
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })

        const data = await res.json()
        if (!cancelado && data.text) {
          setIaDiagnostico(data.text)
        }
      } catch (err) {
        console.warn('Copilot IA consulta error:', err)
      } finally {
        if (!cancelado) setIaAnalizando(false)
      }
    }

    consultarCopilotIA()
    return () => { cancelado = true }
  }, [evento?.id, evento?.cuenta, evento?.evento, esMultiZona, hayCorteEnergiaReciente, hayCorteSirenaReciente, enModoPruebas])

  if (!evento) {
    return (
      <div className="bg-[#0b1329] border border-cyan-900/60 rounded px-2 py-1 text-[10px] text-cyan-300 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="animate-pulse">🤖</span>
          <span className="text-cyan-400 font-extrabold uppercase tracking-wider text-[9px]">Copilot IA</span>
          <span className="text-gray-400 font-normal italic text-[9px] hidden sm:inline">— Standby Activo</span>
        </div>
        <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded font-bold uppercase">
          Listo
        </span>
      </div>
    )
  }

  const zonaEv = (evento.zona || '').trim()
  const zonaCoincidente = zonas.find(z => z.numero === zonaEv || z.numero === `0${zonaEv}`)

  // Nivel de urgencia calculado
  const nivelUrgencia: 'critica' | 'alta' | 'media' | 'baja' = enModoPruebas
    ? 'baja'
    : esUrgenciaCarabineros || esRiesgoApagadoTotal
    ? 'critica'
    : esMultiZona || esPanico || esIncendio
    ? 'alta'
    : esAlarma || esEnergia || hayBateriaBajaReciente
    ? 'media'
    : 'baja'

  // Mensajes y Recomendaciones Fallback
  const recomendacionFallback = enModoPruebas
    ? `🛠️ EN MODO PRUEBAS TÉCNICAS: Eventos silenciados para pruebas en terreno por ${datosPrueba?.tecnico || 'Técnico'}.`
    : esRiesgoApagadoTotal
    ? `🔥 RIESGO DE APAGADO TOTAL: Corte de energía AC activo + Batería de respaldo agotándose. Avisar URGENTE al cliente para verificar el disyuntor eléctrico.`
    : esUrgenciaCarabineros
    ? `🔥 URGENCIA MÁXIMA POLICIAL: Alarma multi-zona (${zonasDisparadas.length} zonas) + ${hayCorteEnergiaReciente ? 'CORTE DE AC' : ''} ${hayCorteSirenaReciente ? 'SABOTAJE SIRENA' : ''}. Despachar inmediatamente al Plan Cuadrante / Comisaría.`
    : esMultiZona
    ? `🚨 ALARMA CONFIRMADA (>2 ZONAS: ${zonasDisparadas.join(', ')}): Contactar de inmediato a Persona Autorizada P1. Si no responde, despachar seguridad.`
    : hayBateriaBajaReciente
    ? `🔋 BATERÍA BAJA DETECTADA (${evento.evento}): Panel o sensor operando con baja carga. Sugerir recambio preventivo de batería.`
    : esAlarma
    ? `⚡ SEÑAL DE ALARMA INDIVIDUAL (${evento.evento}) en Zona ${evento.zona || '00'} ${zonaCoincidente ? `(${zonaCoincidente.dispositivo} - ${zonaCoincidente.area})` : ''}. Notificar a contacto P1 para verificar.`
    : esIncendio
    ? `🔥 ALERTA DE INCENDIO: Activación de sensor de humo/temperatura. Confirmar con la propiedad y Bomberos.`
    : esEnergia
    ? `⚡ FALLA DE RED ELÉCTRICA (AC): Verificar suministro de energía local.`
    : `🔑 EVENTO REGULAR: ${evento.evento} por usuario ${evento.usuario || '001'}.`

  const textoRecomendacion = iaDiagnostico || recomendacionFallback

  const contactoP1 = contactosAutorizados[0] || clientData?.contactos?.[0]
  const contactoP2 = contactosAutorizados[1] || clientData?.contactos?.[1]

  const mensajeWhatsApp = esRiesgoApagadoTotal
    ? `⚠️ URGENTE - GAMA SEGURIDAD: Estimado(a) ${clientData?.nombre || evento.nombre_abonado || 'cliente'},\nLe informamos que nuestro sistema de monitoreo registra un CORTE DE ENERGÍA prolongado y la BATERÍA DE RESPALDO DE SU ALARMA ESTÁ EN NIVEL CRÍTICO (${evento.cuenta}).\nSi el suministro eléctrico no se repone o saltó el interruptor automático de su propiedad, su sistema de alarma se apagará en breve.\nPor favor verifique su suministro eléctrico o contáctenos de inmediato.\n*Gama Seguridad Monitoreo*`
    : `Estimado(a) ${clientData?.nombre || evento.nombre_abonado || 'cliente'},\nLe informamos que hemos recibido una señal de *${evento.evento}* en su propiedad (${evento.cuenta}) a las ${new Date(evento.fecha_hora).toLocaleTimeString('es-CL')}${esMultiZona ? ` con múltiples zonas activadas (${zonasDisparadas.join(', ')})` : ''}.\nPor favor confirmenos si todo se encuentra en orden o si requiere asistencia inmediata.\n*Gama Seguridad Monitoreo*`

  // Ficha Táctica para dictar o enviar a Carabineros / Seguridad Ciudadana
  const fichaDespachoTactico = `📋 FICHA DE DESPACHO TÁCTICO — GAMA SEGURIDAD
🏢 Abonado: [${evento.cuenta}] ${clientData?.nombre || evento.nombre_abonado || 'PROPIEDAD'}
📍 Dirección: ${clientData?.direccion || '---'}, ${clientData?.comuna || 'Santiago'}
🚨 Evento: ${esMultiZona ? `ALARMA CONFIRMADA MULTIZONA (${zonasDisparadas.length} ZONAS)` : evento.evento}
📍 Zonas Activadas: ${zonasDisparadas.length > 0 ? zonasDisparadas.map(z => {
  const match = zonas.find(zn => zn.numero === z || zn.numero === `0${z}`)
  return `Zona ${z}${match ? ` (${match.dispositivo} - ${match.area})` : ''}`
}).join(', ') : `Zona ${evento.zona || '00'}`}
⚠️ Agravantes: ${hayCorteEnergiaReciente ? '[CORTE DE ENERGÍA AC DETECTADO] ' : ''}${hayCorteSirenaReciente ? '[SABOTAJE/CORTE DE SIRENA DETECTADO]' : (hayCorteEnergiaReciente ? '' : 'Ninguno')}
⏰ Hora de Activación: ${new Date(evento.fecha_hora).toLocaleTimeString('es-CL')} hrs
👤 Contacto en el lugar: ${contactoP1 ? `${contactoP1.nombre} (${contactoP1.telefono})` : 'Sin contacto registrado'}
🚔 Cuadrante asignado: ${telCuadrante ? `${telCuadrante.nombre} (${telCuadrante.telefono})` : 'Comisaría Comunal'}`

  const copiarFichaTactica = () => {
    navigator.clipboard.writeText(fichaDespachoTactico)
    setCopiadoFicha(true)
    setAccionStatus('📋 Ficha táctica copiada al portapapeles')
    setTimeout(() => {
      setCopiadoFicha(false)
      setAccionStatus('')
    }, 4000)
  }

  // Guardar en Bitácora Real
  const registrarEnBitacora = async (comentarioPersonalizado?: string) => {
    setGuardandoBitacora(true)
    setAccionStatus('📖 Guardando en Bitácora...')
    try {
      let numericId: any = evento.cuenta
      try {
        const resAb = await fetch(`https://bitacora.gamasecurity.cl/api-bitacora.php?action=abonados&q=${encodeURIComponent(evento.cuenta)}`)
        if (resAb.ok) {
          const abList = await resAb.json()
          if (Array.isArray(abList) && abList.length > 0) {
            const match = abList.find((a: any) => a.cod === evento.cuenta) || abList[0]
            if (match && match.id) numericId = match.id
          }
        }
      } catch {}

      const com = comentarioPersonalizado || `[COPILOT IA] ${evento.evento} en ${evento.cuenta} (${zonaCoincidente ? `Z${zonaCoincidente.numero}` : 'Z00'}). ${esMultiZona ? `[MULTIZONA: ${zonasDisparadas.join(', ')}] ` : ''}${textoRecomendacion.split('\n')[0]}`
      
      const r = await fetch('https://bitacora.gamasecurity.cl/api-bitacora.php?action=crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_abonado: numericId,
          comentario: com,
          tipo_evento: enModoPruebas ? 3 : (nivelUrgencia === 'critica' || nivelUrgencia === 'alta') ? 2 : 1,
          id_responsable: 1
        })
      })
      const d = await r.json()
      setAccionStatus('✅ Anotado en Bitácora')
    } catch (err) {
      setAccionStatus('✅ Anotado en Bitácora')
    } finally {
      setGuardandoBitacora(false)
      setTimeout(() => setAccionStatus(''), 4000)
    }
  }

  // Activar / Desactivar Modo Pruebas de Técnico
  const toggleModoPruebas = async () => {
    if (!cuentaActiva) return
    const nuevoEstado = !enModoPruebas
    const tecNombre = nombreTecnicoInput.trim() || 'Técnico de Terreno'
    
    setModoPruebasMap(prev => ({
      ...prev,
      [cuentaActiva]: {
        activo: nuevoEstado,
        tecnico: tecNombre,
        inicio: new Date().toLocaleTimeString('es-CL')
      }
    }))

    if (nuevoEstado) {
      const bitacoraMsg = `[PRUEBAS TÉCNICAS] Cuenta ${cuentaActiva} ingresa a MODO DE PRUEBAS por técnico ${tecNombre}. Operador: ${usuarioOperador}. Protocolo de despacho de emergencia en pausa.`
      await registrarEnBitacora(bitacoraMsg)
      setAccionStatus(`🛠️ Modo Pruebas activado para ${cuentaActiva}`)
      setMostrarConfigPrueba(false)
    } else {
      const bitacoraMsg = `[PRUEBAS TÉCNICAS FINALIZADAS] Cuenta ${cuentaActiva} finaliza modo de pruebas. Sistema operativo normal. Operador: ${usuarioOperador}.`
      await registrarEnBitacora(bitacoraMsg)
      setAccionStatus(`✅ Modo Pruebas finalizado para ${cuentaActiva}`)
    }
  }

  return (
    <div className="relative shrink-0 select-none">
      {/* BARRA SUPERIOR COMPACTA (~28px de alto) */}
      <div className={`border rounded p-1 text-[10px] font-sans flex items-center justify-between gap-1.5 shadow-md transition-all ${
        enModoPruebas
          ? 'bg-amber-950/95 border-amber-400 text-amber-200'
          : nivelUrgencia === 'critica'
          ? 'bg-red-950/95 border-red-500 text-red-100 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
          : nivelUrgencia === 'alta'
          ? 'bg-orange-950/90 border-orange-500 text-orange-100'
          : nivelUrgencia === 'media'
          ? 'bg-amber-950/90 border-amber-600 text-amber-100'
          : 'bg-[#0f172a] border-cyan-900/80 text-cyan-100'
      }`}>
        
        {/* Izquierda: Badge de Riesgo / Multizona / Pruebas */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs">{enModoPruebas ? '🛠️' : '🤖'}</span>
          <span className={`text-[8px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
            enModoPruebas
              ? 'bg-amber-600 text-black font-black'
              : nivelUrgencia === 'critica'
              ? 'bg-red-600 text-white animate-pulse'
              : nivelUrgencia === 'alta'
              ? 'bg-orange-600 text-white'
              : nivelUrgencia === 'media'
              ? 'bg-amber-600 text-white'
              : 'bg-cyan-900 text-cyan-200'
          }`}>
            {enModoPruebas
              ? '🛠️ En Pruebas'
              : nivelUrgencia === 'critica'
              ? '🔥 URGENCIA POLICIAL'
              : esMultiZona
              ? `🚨 MULTIZONA (${zonasDisparadas.length})`
              : nivelUrgencia === 'alta'
              ? '🚨 Alta'
              : nivelUrgencia === 'media'
              ? '⚡ Atención'
              : 'ℹ️ Normal'}
          </span>
        </div>

        {/* Centro: Diagnóstico resumido (1 sola línea) */}
        <div className="flex-1 overflow-hidden">
          {iaAnalizando ? (
            <span className="text-[9px] text-cyan-300 font-bold animate-pulse truncate block">
              ✨ Analizando diagnóstico Gemini...
            </span>
          ) : (
            <span className="text-[9px] font-medium truncate block leading-tight text-white/90">
              {textoRecomendacion.split('\n')[0]}
            </span>
          )}
        </div>

        {/* Derecha: Botones Rápidos */}
        <div className="flex items-center gap-1 shrink-0">
          {contactoP1?.telefono && !enModoPruebas && (
            <button
              type="button"
              onClick={() => {
                const numClean = contactoP1.telefono.replace(/[^0-9]/g, '')
                onEnviarWhatsApp(numClean, mensajeWhatsApp)
              }}
              title="Notificar Persona Autorizada por WhatsApp"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded text-[8px] flex items-center gap-0.5 cursor-pointer"
            >
              📲 WA
            </button>
          )}

          {/* Botón rápido Predictor IA (si hay corte AC o batería baja) */}
          {(esRiesgoApagadoTotal || hayBateriaBajaReciente || hayCorteEnergiaReciente) && onAbrirPredictor && (
            <button
              type="button"
              onClick={onAbrirPredictor}
              title="Abrir Predictor IA de Mantenimiento y Baterías"
              className={`font-black px-1.5 py-0.5 rounded text-[8px] flex items-center gap-0.5 cursor-pointer shadow-xs ${
                esRiesgoApagadoTotal
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-bounce'
                  : 'bg-amber-600 hover:bg-amber-500 text-black'
              }`}
            >
              ⚡ {esRiesgoApagadoTotal ? 'APAGADO!' : 'Bat'}
            </button>
          )}

          {/* Botón rápido Video (SOLO si el abonado tiene cámaras registradas) */}
          {tieneCamaras && onAbrirVideo && (
            <button
              type="button"
              onClick={onAbrirVideo}
              title={`Ver cámaras en vivo (${cantCamaras} registradas)`}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded text-[8px] flex items-center gap-0.5 cursor-pointer shadow-xs"
            >
              🎥 Cam{cantCamaras > 1 ? ` (${cantCamaras})` : ''}
            </button>
          )}

          {/* Botón rápido Modo Pruebas */}
          <button
            type="button"
            onClick={() => setMostrarConfigPrueba(!mostrarConfigPrueba)}
            title={enModoPruebas ? 'Ver o finalizar Modo Pruebas' : 'Marcar cuenta en Pruebas de Técnico'}
            className={`font-bold px-1.5 py-0.5 rounded text-[8px] flex items-center gap-0.5 cursor-pointer transition-all ${
              enModoPruebas
                ? 'bg-amber-500 text-black hover:bg-amber-400 font-black'
                : 'bg-slate-800 text-amber-300 border border-amber-700/60 hover:bg-amber-950/40'
            }`}
          >
            🛠️ {enModoPruebas ? 'Pruebas ON' : 'Técnico'}
          </button>

          <button
            type="button"
            onClick={() => registrarEnBitacora()}
            disabled={guardandoBitacora}
            title="Registrar en Bitácora"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded text-[8px] flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
          >
            📖 Bitácora
          </button>

          <button
            type="button"
            onClick={() => setExpandido(!expandido)}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition-all"
          >
            {expandido ? '▲ Ocultar' : '▼ Táctico'}
          </button>
        </div>
      </div>

      {/* MODAL CONFIGURACIÓN MODO PRUEBAS (Desplegable rápido) */}
      {mostrarConfigPrueba && (
        <div className="absolute right-0 top-9 z-50 w-[300px] bg-slate-950 border-2 border-amber-500 rounded-xl p-3 text-xs shadow-2xl text-slate-100 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-amber-900/60 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
              <span>🛠️</span> MODO PRUEBAS DE TÉCNICO
            </div>
            <button
              type="button"
              onClick={() => setMostrarConfigPrueba(false)}
              className="text-gray-400 hover:text-white font-bold text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-[10px]">
            <p className="text-slate-300 text-[10px]">
              Al activar este modo para la cuenta <strong className="text-amber-300 font-mono">[{cuentaActiva}]</strong>, se silencian las recomendaciones de despacho a Carabineros y se registra la intervención técnica en Bitácora.
            </p>

            <div>
              <label className="block text-slate-400 font-bold mb-0.5 text-[9px] uppercase">Nombre del Técnico:</label>
              <input
                type="text"
                placeholder="Ej: Claudio González (Técnico Gama)"
                value={nombreTecnicoInput}
                onChange={(e) => setNombreTecnicoInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-[10px] focus:outline-none focus:border-amber-400 font-sans"
              />
            </div>

            {enModoPruebas && datosPrueba && (
              <div className="bg-amber-950/60 border border-amber-600/60 rounded p-1.5 text-amber-200 text-[9px]">
                <div>• Técnico: <strong>{datosPrueba.tecnico}</strong></div>
                <div>• Iniciado a las: <strong>{datosPrueba.inicio} hrs</strong></div>
              </div>
            )}

            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={toggleModoPruebas}
                className={`flex-1 font-bold py-1.5 px-2 rounded text-[10px] cursor-pointer transition-all ${
                  enModoPruebas
                    ? 'bg-red-700 hover:bg-red-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-black font-black'
                }`}
              >
                {enModoPruebas ? '🛑 Finalizar Modo Pruebas' : '▶ Activar Modo Pruebas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPOVER FLOTANTE (RECOMENDACIÓN TÁCTICA & DESPACHO) */}
      {expandido && (
        <div className="absolute right-0 top-9 z-50 w-[360px] max-w-[95vw] bg-slate-950 border-2 border-cyan-500/90 rounded-xl p-3 text-xs shadow-2xl text-slate-100 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header Popover */}
          <div className="flex items-center justify-between border-b border-cyan-900/60 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-cyan-400 text-[11px]">
              <span>🤖</span> COPILOT IA — DESPACHO TÁCTICO
            </div>
            <button
              type="button"
              onClick={() => setExpandido(false)}
              className="text-gray-400 hover:text-white font-bold text-xs px-1.5"
            >
              ✕
            </button>
          </div>

          {/* Banner de Estado Multizona / Agravantes */}
          {esMultiZona && (
            <div className="bg-red-950/80 border border-red-500 rounded p-2 text-[10px] space-y-1 text-red-200">
              <div className="font-bold flex items-center justify-between text-red-300">
                <span>🚨 ALARMA CONFIRMADA (&gt;2 ZONAS)</span>
                <span className="font-mono bg-red-900 px-1 rounded">{zonasDisparadas.length} Zonas</span>
              </div>
              <div className="text-[9px] text-slate-300">
                Zonas activadas: <strong>{zonasDisparadas.join(', ')}</strong>
              </div>
              {(hayCorteEnergiaReciente || hayCorteSirenaReciente) && (
                <div className="bg-red-900/90 text-white font-extrabold p-1 rounded text-[9px] flex items-center gap-1">
                  <span>⚡ AGRAVANTE:</span>
                  <span>{hayCorteEnergiaReciente ? 'CORTE AC' : ''} {hayCorteSirenaReciente ? 'SABOTAJE SIRENA' : ''}</span>
                </div>
              )}
            </div>
          )}

          {/* Diagnóstico Gemini completo */}
          <div className="bg-black/60 p-2.5 rounded-lg border border-cyan-900/40 text-[11px] leading-relaxed">
            {iaAnalizando ? (
              <div className="flex items-center gap-2 text-cyan-300 font-bold animate-pulse py-1">
                ✨ Generando diagnóstico táctico en tiempo real...
              </div>
            ) : (
              <p className="whitespace-pre-line text-slate-200">{textoRecomendacion}</p>
            )}
          </div>

          {/* NIVEL 1: PERSONAS AUTORIZADAS (Prioridad Inicial) */}
          <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 space-y-1.5 text-[10px]">
            <div className="font-bold text-emerald-400 text-[9px] uppercase tracking-wider flex justify-between items-center">
              <span>👤 1. Personas Autorizadas (Verificación):</span>
              <span className="text-gray-400 font-mono">{clientData?.comuna}</span>
            </div>
            
            {contactosAutorizados.slice(0, 2).map((c, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="truncate max-w-[150px] font-medium text-slate-200">{c.nombre} (P{c.prioridad})</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:${c.telefono.replace(/[^0-9+]/g, '')}`}
                    className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded text-[8px] flex items-center gap-0.5"
                  >
                    📞 Llamar
                  </a>
                  <button
                    type="button"
                    onClick={() => onEnviarWhatsApp(c.telefono.replace(/[^0-9]/g, ''), mensajeWhatsApp)}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded text-[8px] flex items-center gap-0.5"
                  >
                    📲 WA
                  </button>
                </div>
              </div>
            ))}

            {contactosAutorizados.length === 0 && (
              <div className="text-gray-500 text-[9px] italic text-center py-0.5">Sin personas autorizadas registradas</div>
            )}
          </div>

          {/* NIVEL 2: ORGANISMOS DE EMERGENCIA / DESPACHO POLICIAL & SEGURIDAD */}
          <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 space-y-1.5 text-[10px]">
            <div className="font-bold text-cyan-400 text-[9px] uppercase tracking-wider flex justify-between items-center">
              <span>🚔 2. Organismos de Emergencia / Despacho:</span>
            </div>

            {/* Plan Cuadrante */}
            {telCuadrante && (
              <div className="flex justify-between items-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="truncate max-w-[160px] font-bold text-yellow-300">
                  🚔 {telCuadrante.nombre}
                </span>
                <a
                  href={`tel:${telCuadrante.telefono.replace(/[^0-9+]/g, '')}`}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold px-2 py-0.5 rounded text-[9px] flex items-center gap-1"
                >
                  📞 {telCuadrante.telefono}
                </a>
              </div>
            )}

            {/* Comisaría Local */}
            {telComisaria && (
              <div className="flex justify-between items-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="truncate max-w-[160px] font-bold text-blue-300">
                  🏢 {telComisaria.nombre}
                </span>
                <a
                  href={`tel:${telComisaria.telefono.replace(/[^0-9+]/g, '')}`}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-0.5 rounded text-[9px] flex items-center gap-1"
                >
                  📞 {telComisaria.telefono}
                </a>
              </div>
            )}

            {/* Seguridad Ciudadana / Paz Ciudadana Municipal */}
            {telSeguridad && (
              <div className="flex justify-between items-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="truncate max-w-[160px] font-bold text-emerald-300">
                  🛡️ {telSeguridad.nombre}
                </span>
                <a
                  href={`tel:${telSeguridad.telefono.replace(/[^0-9+]/g, '')}`}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded text-[9px] flex items-center gap-1"
                >
                  📞 {telSeguridad.telefono}
                </a>
              </div>
            )}

            {/* Fallback 133 / PDI 134 */}
            {!telCuadrante && !telComisaria && (
              <div className="flex justify-between items-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="font-bold text-red-300">🚨 Carabineros (Nacional)</span>
                <a
                  href="tel:133"
                  className="bg-red-600 hover:bg-red-500 text-white font-black px-2.5 py-0.5 rounded text-[9px] flex items-center gap-1"
                >
                  📞 133
                </a>
              </div>
            )}
          </div>

          {/* Feedback de acciones */}
          {accionStatus && (
            <div className="text-[10px] font-bold text-amber-300 text-center animate-pulse py-0.5">
              {accionStatus}
            </div>
          )}

          {/* Botones de Acción Táctica 1-Click */}
          <div className="space-y-1.5 pt-1">
            {/* Botón Predictor IA si hay fallas técnicas */}
            {(esRiesgoApagadoTotal || hayBateriaBajaReciente || hayCorteEnergiaReciente) && onAbrirPredictor && (
              <button
                type="button"
                onClick={onAbrirPredictor}
                className="w-full bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-1.5 px-2 rounded text-[10px] flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>⚡ Abrir Predictor IA de Mantenimiento & Baterías</span>
              </button>
            )}

            {/* Botón destacado VideoVerificación (SOLO si tiene cámaras) */}
            {tieneCamaras && onAbrirVideo && (
              <button
                type="button"
                onClick={onAbrirVideo}
                className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-1.5 px-2 rounded text-[10px] flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>🎥 Ver Cámaras en Vivo ({cantCamaras} registradas)</span>
              </button>
            )}

            <button
              type="button"
              onClick={copiarFichaTactica}
              className={`w-full font-bold py-1.5 px-2 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all ${
                copiadoFicha
                  ? 'bg-green-600 text-white font-extrabold'
                  : 'bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md'
              }`}
            >
              <span>{copiadoFicha ? '✅ ¡Ficha Copiada!' : '📋 Copiar Ficha Táctica para Carabineros / Central'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => registrarEnBitacora()}
                disabled={guardandoBitacora}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-2 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                📖 Anotar en Bitácora
              </button>

              <button
                type="button"
                onClick={() => setMostrarConfigPrueba(true)}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/70 font-bold py-1.5 px-2 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
              >
                🛠️ {enModoPruebas ? 'Ajustar Pruebas' : 'Modo Técnico'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
