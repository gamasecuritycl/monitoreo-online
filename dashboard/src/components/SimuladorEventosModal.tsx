'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesMapFallback = clientesDataRaw as Record<string, Record<string, string>>

export interface PasoEscenario {
  delaySegundos: number
  evento: string
  zona: string
  usuario: string
}

export interface EscenarioSimulacro {
  id: string
  titulo: string
  descripcion: string
  severidad: 'critico' | 'alto' | 'medio'
  cuentaDefault: string
  pasos: PasoEscenario[]
  objetivoEvaluacion: string
}

const ESCENARIOS_PREDEFINIDOS: EscenarioSimulacro[] = [
  {
    id: 'asalto_multizona',
    titulo: '🚨 Asalto Multizona con Sabotaje y Corte AC',
    descripcion: 'Simula un robo complejo: corte de luz, seguido de disparos de múltiples zonas consecutivas y sabotaje de la sirena exterior.',
    severidad: 'critico',
    cuentaDefault: 'C745',
    objetivoEvaluacion: 'Reaccionar en < 15 segundos, identificar agravantes (AC + Sirena) y preparar Ficha Táctica policial.',
    pasos: [
      { delaySegundos: 0, evento: 'CORTE DE ENERGIA AC (301)', zona: '00', usuario: '000' },
      { delaySegundos: 4, evento: 'ALARMA ROBO INTRUSION (130)', zona: '01', usuario: '000' },
      { delaySegundos: 10, evento: 'ALARMA ROBO PERIMETRAL (130)', zona: '04', usuario: '000' },
      { delaySegundos: 18, evento: 'SABOTAJE / CORTE DE SIRENA (321)', zona: '00', usuario: '000' }
    ]
  },
  {
    id: 'corte_bateria',
    titulo: '🔥 Corte AC Prolongado + Riesgo de Apagado por Batería',
    descripcion: 'Simula corte eléctrico activo donde la batería de respaldo cae en nivel crítico, poniendo en riesgo la continuidad del monitoreo.',
    severidad: 'critico',
    cuentaDefault: 'C798',
    objetivoEvaluacion: 'Detectar riesgo de apagado total y notificar urgentemente al cliente por WhatsApp.',
    pasos: [
      { delaySegundos: 0, evento: 'CORTE DE ENERGIA AC (301)', zona: '00', usuario: '000' },
      { delaySegundos: 6, evento: 'BATERIA BAJA PANEL CENTRAL (302)', zona: '00', usuario: '000' }
    ]
  },
  {
    id: 'panico_silencioso',
    titulo: '🆘 Pánico Silencioso / Asalto en Local Comercial',
    descripcion: 'Pulsador de pánico accionado bajo asalto. Requiere despacho policial sigiloso sin delatar la llamada en la propiedad.',
    severidad: 'critico',
    cuentaDefault: '0014',
    objetivoEvaluacion: 'Tiempo de reacción < 10 segundos y despacho inmediato al Plan Cuadrante.',
    pasos: [
      { delaySegundos: 0, evento: 'ALARMA DE PANICO SILENCIOSO (120)', zona: '01', usuario: '000' }
    ]
  },
  {
    id: 'apertura_inhabitual',
    titulo: '🔓 Apertura Inhabitual Fuera de Horario (03:25 AM)',
    descripcion: 'Desarmado del sistema durante la madrugada en local comercial con horario de cierre estricto.',
    severidad: 'alto',
    cuentaDefault: 'C7C9',
    objetivoEvaluacion: 'Contactar de inmediato a Persona Autorizada Titular para validar identidad.',
    pasos: [
      { delaySegundos: 0, evento: 'APERTURA / DESARME DEL SISTEMA (402)', zona: '00', usuario: '003' }
    ]
  },
  {
    id: 'sensor_bateria',
    titulo: '📡 Falla de Batería en Sensor Inalámbrico',
    descripcion: 'Sensor de movimiento inalámbrico reporta batería baja. Se debe coordinar cambio de pila preventiva.',
    severidad: 'medio',
    cuentaDefault: 'C7A0',
    objetivoEvaluacion: 'Generar orden técnica para recambio de pila CR123A en zona afectada.',
    pasos: [
      { delaySegundos: 0, evento: 'BATERIA BAJA SENSOR RF (384)', zona: '03', usuario: '000' }
    ]
  }
]

interface Props {
  onClose: () => void
  onInyectarEvento: (evento: EventoMonitoreo) => void
  clientesMap?: Record<string, Record<string, string>>
}

export default function SimuladorEventosModal({
  onClose,
  onInyectarEvento,
  clientesMap = clientesMapFallback
}: Props) {
  const [tabActiva, setTabActiva] = useState<'escenarios' | 'manual' | 'evaluacion'>('escenarios')
  
  // Escenario seleccionado
  const [escenarioId, setEscenarioId] = useState<string>(ESCENARIOS_PREDEFINIDOS[0].id)
  const [cuentaEscenario, setCuentaEscenario] = useState<string>(ESCENARIOS_PREDEFINIDOS[0].cuentaDefault)
  const [enEjecucion, setEnEjecucion] = useState<boolean>(false)
  const [pasoActualIndex, setPasoActualIndex] = useState<number>(-1)
  const [segundosTranscurridos, setSegundosTranscurridos] = useState<number>(0)
  const [registroEventosInyectados, setRegistroEventosInyectados] = useState<string[]>([])
  
  // Inyector Manual
  const [cuentaManual, setCuentaManual] = useState('C745')
  const [eventoManual, setEventoManual] = useState('ALARMA ROBO INTRUSION (130)')
  const [zonaManual, setZonaManual] = useState('01')
  const [usuarioManual, setUsuarioManual] = useState('001')
  const [feedbackManual, setFeedbackManual] = useState('')

  // Reporte de Evaluación
  const [tiempoFinal, setTiempoFinal] = useState<number | null>(null)
  const [scoreFinal, setScoreFinal] = useState<number | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  const escenarioActivo = ESCENARIOS_PREDEFINIDOS.find(e => e.id === escenarioId) || ESCENARIOS_PREDEFINIDOS[0]

  // Actualizar cuenta default al cambiar de escenario
  useEffect(() => {
    setCuentaEscenario(escenarioActivo.cuentaDefault)
  }, [escenarioActivo])

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timeoutsRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  // Iniciar Cronómetro y Secuencia de Escenario
  const iniciarEscenario = () => {
    // Limpiar anteriores
    if (timerRef.current) clearInterval(timerRef.current)
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []

    setEnEjecucion(true)
    setSegundosTranscurridos(0)
    setPasoActualIndex(-1)
    setRegistroEventosInyectados([])
    setTiempoFinal(null)
    setScoreFinal(null)

    const cDb = clientesMap[cuentaEscenario] || clientesMapFallback[cuentaEscenario] || {}
    const nombreAbonado = cDb.nombre || `ABONADO ${cuentaEscenario}`

    // Iniciar cronómetro de segundos
    const inicioMs = Date.now()
    timerRef.current = setInterval(() => {
      const transcurrido = Math.floor((Date.now() - inicioMs) / 1000)
      setSegundosTranscurridos(transcurrido)
    }, 1000)

    // Programar cada paso
    escenarioActivo.pasos.forEach((paso, idx) => {
      const to = setTimeout(() => {
        const ahora = new Date()
        const horaStr = ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        const fechaStr = ahora.toISOString().split('T')[0]
        const fechaHoraCompleta = `${fechaStr} ${horaStr}`

        const nuevoEvento: EventoMonitoreo = {
          id: Date.now() + idx,
          fecha_hora: fechaHoraCompleta,
          cuenta: cuentaEscenario.toUpperCase().trim(),
          nombre_abonado: nombreAbonado,
          evento: `[SIM] ${paso.evento}`,
          zona: paso.zona,
          usuario: paso.usuario
        }

        onInyectarEvento(nuevoEvento)
        setPasoActualIndex(idx)
        setRegistroEventosInyectados(prev => [
          `[${horaStr}] T+${paso.delaySegundos}s -> #${cuentaEscenario} ${paso.evento} (Zona ${paso.zona})`,
          ...prev
        ])

        // Si es el último paso, mantener cronómetro activo para evaluación
      }, paso.delaySegundos * 1000)

      timeoutsRef.current.push(to)
    })
  }

  // Detener y Evaluar Desempeño
  const finalizarYEvaluar = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
    setEnEjecucion(false)

    const tiempoLogrado = segundosTranscurridos || 1
    setTiempoFinal(tiempoLogrado)

    // Cálculo de Score
    let score = 100
    if (tiempoLogrado > 35) score = 65
    else if (tiempoLogrado > 25) score = 78
    else if (tiempoLogrado > 15) score = 88
    else score = 98

    setScoreFinal(score)
    setTabActiva('evaluacion')
  }

  // Disparo Manual Inmediato
  const handleDispararManual = () => {
    const cta = cuentaManual.toUpperCase().trim()
    const cDb = clientesMap[cta] || clientesMapFallback[cta] || {}
    const nombreAbonado = cDb.nombre || `ABONADO ${cta}`
    const ahora = new Date()
    const horaStr = ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    const fechaHoraCompleta = `${ahora.toISOString().split('T')[0]} ${horaStr}`

    const nuevoEvento: EventoMonitoreo = {
      id: Date.now(),
      fecha_hora: fechaHoraCompleta,
      cuenta: cta,
      nombre_abonado: nombreAbonado,
      evento: `[SIM] ${eventoManual}`,
      zona: zonaManual,
      usuario: usuarioManual
    }

    onInyectarEvento(nuevoEvento)
    setFeedbackManual(`💥 Evento inyectado en grilla: #${cta} ${eventoManual}`)
    setTimeout(() => setFeedbackManual(''), 3500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 font-mono p-2 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-[96vw] max-w-[1250px] h-[92vh] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1.5 shadow-[4px_4px_24px_rgba(0,0,0,0.85)] focus:outline-none flex flex-col justify-between select-none"
        style={{ fontSize: '11px' }}
      >
        {/* Barra de Título */}
        <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center select-none shrink-0 h-6">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🧪</span>
            <span className="text-[11px] tracking-wide">Scorpion - Simulador Táctico de Eventos & Entrenamiento</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-[9px] pb-0.5 cursor-pointer"
          >
            r
          </button>
        </div>

        {/* PESTAÑAS */}
        <div className="flex gap-1 border-b border-gray-400 px-1 pt-1 bg-[#e0ded8] shrink-0">
          <button
            type="button"
            onClick={() => setTabActiva('escenarios')}
            className={`px-3 py-1 text-xs font-bold border-t-2 border-l-2 border-r-2 rounded-t cursor-pointer ${
              tabActiva === 'escenarios'
                ? 'bg-[#d4d0c8] border-white text-blue-900 shadow-xs'
                : 'bg-gray-300 border-gray-400 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🚨 Escenarios de Simulacro
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('manual')}
            className={`px-3 py-1 text-xs font-bold border-t-2 border-l-2 border-r-2 rounded-t cursor-pointer ${
              tabActiva === 'manual'
                ? 'bg-[#d4d0c8] border-white text-blue-900 shadow-xs'
                : 'bg-gray-300 border-gray-400 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎯 Inyector Manual 1-Click
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('evaluacion')}
            className={`px-3 py-1 text-xs font-bold border-t-2 border-l-2 border-r-2 rounded-t cursor-pointer ${
              tabActiva === 'evaluacion'
                ? 'bg-[#d4d0c8] border-white text-blue-900 shadow-xs'
                : 'bg-gray-300 border-gray-400 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Evaluación & Score ({scoreFinal ? `${scoreFinal}%` : 'Pendiente'})
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 p-2 bg-[#d4d0c8] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white overflow-hidden min-h-0">
          
          {/* TAB 1: ESCENARIOS DE SIMULACRO */}
          {tabActiva === 'escenarios' && (
            <div className="h-full flex flex-col md:flex-row gap-2 overflow-hidden">
              
              {/* Selector de Escenarios a la izquierda */}
              <div className="w-full md:w-[360px] bg-white border border-gray-400 p-1.5 flex flex-col gap-1 overflow-y-auto shrink-0">
                <div className="bg-[#808080] text-white px-2 py-0.5 text-[10px] font-bold uppercase">
                  Escenarios Tácticos Disponibles
                </div>

                <div className="space-y-1 mt-1">
                  {ESCENARIOS_PREDEFINIDOS.map(esc => {
                    const seleccionado = esc.id === escenarioId
                    return (
                      <div
                        key={esc.id}
                        onClick={() => {
                          if (!enEjecucion) setEscenarioId(esc.id)
                        }}
                        className={`p-2 rounded-xs border cursor-pointer transition-colors ${
                          seleccionado
                            ? 'bg-[#000080] text-white border-blue-900'
                            : 'bg-gray-50 hover:bg-blue-50 text-gray-900 border-gray-300'
                        } ${enEjecucion ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${seleccionado ? 'text-yellow-300' : 'text-blue-900'}`}>
                            {esc.titulo}
                          </span>
                        </div>
                        <p className={`text-[10px] mt-1 line-clamp-2 ${seleccionado ? 'text-gray-200' : 'text-gray-600'}`}>
                          {esc.descripcion}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Panel de Control del Escenario a la derecha */}
              <div className="flex-1 bg-[#d4d0c8] border border-gray-400 p-2 flex flex-col justify-between gap-2 overflow-y-auto">
                <div className="space-y-2">
                  {/* Encabezado del Escenario */}
                  <div className="bg-[#ffffea] border border-amber-400 p-2.5 rounded-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-sm text-blue-950 flex items-center gap-1.5">
                        <span>🎮</span> {escenarioActivo.titulo}
                      </h3>
                      <span className="bg-red-800 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded">
                        SEVERIDAD: {escenarioActivo.severidad.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800">
                      {escenarioActivo.descripcion}
                    </p>
                    <div className="text-[11px] text-blue-900 font-bold mt-1 bg-blue-50 p-1 border border-blue-200">
                      🎯 Objetivo de Evaluación: {escenarioActivo.objetivoEvaluacion}
                    </div>
                  </div>

                  {/* Configuración de Cuenta */}
                  <div className="bg-white border border-gray-400 p-2 flex items-center gap-3">
                    <span className="font-bold text-xs text-gray-700">Abonado a Simular:</span>
                    <input
                      type="text"
                      disabled={enEjecucion}
                      value={cuentaEscenario}
                      onChange={(e) => setCuentaEscenario(e.target.value.toUpperCase())}
                      className="w-24 bg-[#ffffd0] border border-gray-500 font-mono font-bold px-2 py-0.5 text-xs text-blue-900"
                    />
                    <span className="text-xs text-gray-600 font-bold">
                      {clientesMap[cuentaEscenario]?.nombre || clientesMapFallback[cuentaEscenario]?.nombre || 'Propiedad de Prueba'}
                    </span>
                  </div>

                  {/* Pasos Temporizados del Escenario */}
                  <div className="bg-white border border-gray-400 p-2 space-y-1">
                    <div className="font-bold text-[10px] text-gray-600 uppercase border-b pb-0.5">
                      Secuencia Temporal de Disparo:
                    </div>
                    <div className="space-y-1 pt-1">
                      {escenarioActivo.pasos.map((p, idx) => {
                        const completado = pasoActualIndex >= idx
                        const activo = pasoActualIndex === idx
                        return (
                          <div
                            key={idx}
                            className={`p-1.5 rounded-xs border text-xs flex items-center justify-between font-mono ${
                              activo
                                ? 'bg-amber-100 border-amber-600 text-amber-950 font-black animate-pulse'
                                : completado
                                ? 'bg-green-50 border-green-400 text-green-900 font-bold'
                                : 'bg-gray-50 border-gray-200 text-gray-500'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{completado ? '✅' : '⏱️'}</span>
                              <span className="font-bold text-blue-900">T+{p.delaySegundos}s:</span>
                              <span>{p.evento}</span>
                            </div>
                            <div className="text-[10px] text-gray-600">
                              Zona: {p.zona} · Usuario: {p.usuario}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Consola de Eventos Inyectados en Vivo */}
                  {registroEventosInyectados.length > 0 && (
                    <div className="bg-black text-green-400 p-2 font-mono text-[10px] rounded-xs border border-gray-700 max-h-28 overflow-y-auto space-y-0.5">
                      <div className="text-gray-400 text-[9px] uppercase border-b border-gray-800 pb-0.5">
                        Registro en Tiempo Real de Inyección:
                      </div>
                      {registroEventosInyectados.map((log, i) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BOTONES DE ACCIÓN Y CRONÓMETRO */}
                <div className="bg-[#e0ded8] border border-gray-400 p-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs font-bold text-gray-700">Cronómetro:</span>
                    <span className="bg-black text-yellow-300 font-black text-lg px-3 py-0.5 rounded border border-gray-700">
                      {String(Math.floor(segundosTranscurridos / 60)).padStart(2, '0')}:{String(segundosTranscurridos % 60).padStart(2, '0')}s
                    </span>
                    {enEjecucion && (
                      <span className="text-[10px] text-red-600 font-bold animate-ping">
                        ● EN CURSO
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!enEjecucion ? (
                      <button
                        type="button"
                        onClick={iniciarEscenario}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold px-4 py-2 rounded-xs border-2 border-t-emerald-400 border-l-emerald-400 border-b-emerald-950 border-r-emerald-950 flex items-center gap-1.5 cursor-pointer shadow text-xs"
                      >
                        <span>▶️</span>
                        <span>Iniciar Simulacro</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={finalizarYEvaluar}
                        className="bg-red-700 hover:bg-red-600 text-white font-extrabold px-4 py-2 rounded-xs border-2 border-t-red-400 border-l-red-400 border-b-red-950 border-r-red-950 flex items-center gap-1.5 cursor-pointer shadow text-xs animate-bounce"
                      >
                        <span>🏁</span>
                        <span>Finalizar & Evaluar Desempeño</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: INYECTOR MANUAL 1-CLICK */}
          {tabActiva === 'manual' && (
            <div className="h-full bg-white border border-gray-400 p-3 flex flex-col justify-between gap-3 overflow-y-auto">
              <div className="space-y-3">
                <div className="bg-[#000080] text-white p-2 rounded-xs">
                  <h3 className="font-bold text-xs text-yellow-300 uppercase">🎯 Inyector Directo de Eventos en Tiempo Real</h3>
                  <p className="text-[10px] text-gray-200">
                    Dispara señales individuales personalizadas para comprobar la respuesta del Copilot IA, sonido retro de alarma y grilla en vivo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3 border border-gray-300">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase">Cuenta Abonado:</label>
                    <input
                      type="text"
                      value={cuentaManual}
                      onChange={(e) => setCuentaManual(e.target.value.toUpperCase())}
                      className="w-full bg-[#ffffd0] border border-gray-500 font-mono font-bold px-2 py-1 text-xs text-blue-900 mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase">Evento Contact ID:</label>
                    <select
                      value={eventoManual}
                      onChange={(e) => setEventoManual(e.target.value)}
                      className="w-full bg-white border border-gray-500 font-bold px-2 py-1 text-xs text-gray-900 mt-1"
                    >
                      <option value="ALARMA ROBO INTRUSION (130)">🚨 Robo / Intrusión (130)</option>
                      <option value="ALARMA ROBO PERIMETRAL (130)">🚨 Robo Perimetral (130)</option>
                      <option value="ALARMA DE PANICO SILENCIOSO (120)">🆘 Pánico Silencioso (120)</option>
                      <option value="ALARMA DE INCENDIO / HUMO (110)">🔥 Alarma de Incendio (110)</option>
                      <option value="CORTE DE ENERGIA AC (301)">⚡ Corte de Energía AC (301)</option>
                      <option value="RESTAURACION ENERGIA AC (1301)">🔌 Restauración AC (1301)</option>
                      <option value="BATERIA BAJA PANEL (302)">🔋 Batería Baja Panel (302)</option>
                      <option value="BATERIA BAJA SENSOR RF (384)">📡 Pila Baja Sensor (384)</option>
                      <option value="SABOTAJE / CORTE SIRENA (321)">⚠️ Sabotaje / Sirena (321)</option>
                      <option value="CIERRE / ARMADO DEL SISTEMA (401)">🔒 Cierre / Armado (401)</option>
                      <option value="APERTURA / DESARME DEL SISTEMA (402)">🔓 Apertura / Desarme (402)</option>
                      <option value="TEST PERIODICO DE COMUNICACION (602)">📡 Test Periódico (602)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase">Número de Zona:</label>
                    <input
                      type="text"
                      value={zonaManual}
                      onChange={(e) => setZonaManual(e.target.value)}
                      className="w-full bg-white border border-gray-500 font-mono font-bold px-2 py-1 text-xs text-gray-900 mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase">Código Usuario:</label>
                    <input
                      type="text"
                      value={usuarioManual}
                      onChange={(e) => setUsuarioManual(e.target.value)}
                      className="w-full bg-white border border-gray-500 font-mono font-bold px-2 py-1 text-xs text-gray-900 mt-1"
                    />
                  </div>
                </div>

                {/* Previsualización del Evento */}
                <div className="bg-[#ffffea] border border-amber-300 p-2 text-xs font-mono">
                  <span className="font-bold text-amber-900">Previsualización:</span> [#{cuentaManual}] {clientesMap[cuentaManual]?.nombre || 'Propiedad'} · {eventoManual} · Zona {zonaManual} · Usuario {usuarioManual}
                </div>
              </div>

              <div>
                {feedbackManual && (
                  <div className="p-2 mb-2 bg-green-100 border border-green-400 text-green-900 font-bold text-xs text-center animate-pulse">
                    {feedbackManual}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDispararManual}
                  className="w-full bg-blue-800 hover:bg-blue-700 active:bg-blue-900 text-white font-extrabold py-2.5 px-4 rounded-xs border-2 border-t-blue-400 border-l-blue-400 border-b-blue-950 border-r-blue-950 flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs"
                >
                  <span>💥</span>
                  <span>Disparar Evento en Vivo en la Grilla</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EVALUACIÓN Y SCORE */}
          {tabActiva === 'evaluacion' && (
            <div className="h-full bg-white border border-gray-400 p-4 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-[#000080] text-white p-3 rounded-xs flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-sm text-yellow-300">📊 REPORTE DE DESEMPEÑO DEL OPERADOR</h3>
                    <p className="text-[10px] text-gray-200">
                      Evaluación de velocidad de respuesta, análisis táctico y apego al protocolo de monitoreo.
                    </p>
                  </div>
                  <span className="text-2xl">🎖️</span>
                </div>

                {tiempoFinal !== null && scoreFinal !== null ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-900 text-white p-3 rounded-xs border text-center">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Tiempo de Respuesta Total</div>
                        <div className="text-2xl font-black font-mono text-yellow-300 mt-1">{tiempoFinal} seg</div>
                      </div>

                      <div className={`p-3 rounded-xs border text-center text-white ${
                        scoreFinal >= 85 ? 'bg-emerald-900 border-emerald-700' : scoreFinal >= 70 ? 'bg-amber-900 border-amber-700' : 'bg-red-900 border-red-700'
                      }`}>
                        <div className="text-[10px] uppercase font-bold text-gray-200">Calificación de Desempeño</div>
                        <div className="text-2xl font-black font-mono mt-1">{scoreFinal} / 100%</div>
                      </div>

                      <div className="bg-blue-900 text-white p-3 rounded-xs border text-center">
                        <div className="text-[10px] text-blue-200 uppercase font-bold">Veredicto Táctico</div>
                        <div className="text-sm font-black mt-2 text-cyan-300">
                          {scoreFinal >= 85 ? '🌟 OPERADOR AVANZADO' : scoreFinal >= 70 ? '👍 CUMPLE ESTÁNDAR' : '⚠️ REFUERZO REQUERIDO'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-300 p-3 space-y-2 text-xs">
                      <h4 className="font-bold text-blue-900 uppercase text-[10px]">Criterios Evaluados:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-800">
                        <li><strong>Detección de Criticidad:</strong> El operador atendió la señal antes del tiempo límite.</li>
                        <li><strong>Reconocimiento de Agravantes:</strong> Copilot IA presentó diagnóstico de corte AC / sabotaje de sirena.</li>
                        <li><strong>Ficha de Despacho Táctico:</strong> Formato disponible para comunicación rápida con Plan Cuadrante.</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 italic text-xs">
                    Inicie y finalice un simulacro en la pestaña "Escenarios de Simulacro" para generar el informe de evaluación.
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setTabActiva('escenarios')}
                  className="bg-[#d4d0c8] hover:bg-[#e0ded8] text-black font-bold px-4 py-1.5 border-2 border-t-white border-l-white border-b-black border-r-black cursor-pointer text-xs"
                >
                  🔁 Realizar Otro Simulacro
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
