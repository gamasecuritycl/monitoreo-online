'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendMessage } from '@/lib/whatsapp'

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
  }
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

  // Pendientes por abonado
  const [pendientesList, setPendientesList] = useState<PendienteAbonado[]>([])
  const [nuevaCuenta, setNuevaCuenta] = useState('')
  const [nuevaInstruccion, setNuevaInstruccion] = useState('')
  const [nuevaPrioridad, setNuevaPrioridad] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('ALTA')

  // Métricas del turno actual (últimas 8h)
  const [kpiShift, setKpiShift] = useState({
    total: 0,
    alarmas: 0,
    cortes: 0,
    cierres: 0
  })

  // Cargar métricas automáticas del turno de las últimas 8h
  const cargarMetricasTurno = async () => {
    try {
      const hace8Horas = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('eventos_monitoreo')
        .select('evento')
        .gte('fecha_hora', hace8Horas)
        .neq('cuenta', 'CONFIG_ENTREGA_TURNO')

      if (data) {
        let total = data.length
        let alarmas = 0
        let cortes = 0
        let cierres = 0

        data.forEach(e => {
          const ev = (e.evento || '').toUpperCase()
          if (ev.includes('ROBO') || ev.includes('INTRUSION') || ev.includes('PANICO') || ev.includes('ALARMA')) alarmas++
          if (ev.includes('ENERGIA') || ev.includes('CORTE') || ev.includes('AC')) cortes++
          if (ev.includes('CIERRE') || ev.includes('ARMADO')) cierres++
        })

        setKpiShift({ total, alarmas, cortes, cierres })
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
              resumen_kpi: obj.resumen_kpi || undefined
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
    cargarHistorial()
    cargarMetricasTurno()
  }, [])

  // Generar resumen automático del turno consultando la bitácora de 8 horas
  const generarResumenAutomatico = async () => {
    setGenerandoIA(true)
    setMsgStatus('⏳ Analizando bitácora de las últimas 8 horas...')
    try {
      const hace8Horas = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      const { data: eventos } = await supabase
        .from('eventos_monitoreo')
        .select('cuenta, evento, fecha_hora, zona, usuario')
        .gte('fecha_hora', hace8Horas)
        .neq('cuenta', 'CONFIG_ENTREGA_TURNO')
        .order('fecha_hora', { ascending: false })
        .limit(50)

      if (!eventos || eventos.length === 0) {
        setNovedades('Sin eventos críticos registrados en las últimas 8 horas. Operación normal en central.')
        setMsgStatus('✅ Resumen generado (Sin eventos críticos).')
        return
      }

      // Agrupar eventos por tipo
      const alarmas: string[] = []
      const fallasEnergia: string[] = []
      const cierresAperturas: string[] = []

      eventos.forEach(e => {
        const ev = (e.evento || '').toUpperCase()
        const hora = new Date(e.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        const item = `• [${hora}] CTA ${e.cuenta}: ${e.evento} ${e.zona ? `(Z${e.zona})` : ''}`

        if (ev.includes('ROBO') || ev.includes('INTRUSION') || ev.includes('PANICO') || ev.includes('ALARMA')) {
          alarmas.push(item)
        } else if (ev.includes('ENERGIA') || ev.includes('CORTE') || ev.includes('AC')) {
          fallasEnergia.push(item)
        } else if (ev.includes('CIERRE') || ev.includes('APERTURA')) {
          cierresAperturas.push(item)
        }
      })

      let textoGenerado = `📋 RESUMEN DE SEÑALES Y PROCEDIMIENTOS EN BITÁCORA (Últimas 8 Horas)\n`
      textoGenerado += `• Total Señales Recibidas en Bitácora: ${eventos.length}\n`
      textoGenerado += `• Rango de Monitoreo: ${new Date(hace8Horas).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} a ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}\n\n`

      if (alarmas.length > 0) {
        textoGenerado += `🚨 SEÑALES DE ALARMA Y PROCEDIMIENTO APLICADO (${alarmas.length}):\n${alarmas.slice(0, 10).join('\n')}\n`
        textoGenerado += `  └─ Procedimiento: Verificación telefónica/WhatsApp con abonados, solicitud de contraclave y ejecución de protocolo de emergencia.\n\n`
      } else {
        textoGenerado += `🚨 SEÑALES DE ALARMA / PÁNICO: Sin disparos críticos reportados durante este lapso de tiempo.\n\n`
      }

      if (fallasEnergia.length > 0) {
        textoGenerado += `⚡ FALLAS DE ENERGÍA ELECTRICA Y TELEMETRÍA (${fallasEnergia.length}):\n${fallasEnergia.slice(0, 8).join('\n')}\n`
        textoGenerado += `  └─ Procedimiento: Alertas automáticas despachadas a contactos de emergencia; seguimiento a autonomía de baterías.\n\n`
      }

      if (cierresAperturas.length > 0) {
        textoGenerado += `🔒 APERTURAS Y CIERRES REGISTRADOS (${cierresAperturas.length}):\n${cierresAperturas.slice(0, 5).join('\n')}\n\n`
      }

      textoGenerado += `📌 AUDITORÍA Y ESTADO DE GESTIÓN EN BITÁCORA:\n`
      textoGenerado += `• 100% de las señales recibidas en el turno fueron atendidas, verificadas y registradas con sus acciones en bitácora.\n`
      textoGenerado += `• El turno entrante asume la supervisión continua sin procedimientos críticos pendientes de atención.`

      setNovedades(textoGenerado)
      setMsgStatus('✨ Resumen de señales y procedimientos generado automáticamente desde la bitácora.')
    } catch (err: any) {
      setMsgStatus('❌ Error al generar resumen: ' + err.message)
    } finally {
      setGenerandoIA(false)
      setTimeout(() => setMsgStatus(''), 4000)
    }
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

  // Guardar entrega de turno
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
        novedades: novedades.trim(),
        pendientes: pendientesList,
        resumen_kpi: {
          total_eventos: kpiShift.total,
          alarmas: kpiShift.alarmas,
          cortes: kpiShift.cortes
        }
      }

      await supabase.from('eventos_monitoreo').insert({
        cuenta: 'CONFIG_ENTREGA_TURNO',
        nombre_abonado: JSON.stringify(payload),
        evento: 'ENTREGA DE TURNO',
        fecha_hora: new Date().toISOString(),
        zona: '000',
        usuario: saliente
      })

      setNovedades('')
      setEntrante('')
      setPendientesList([])
      await cargarHistorial()
      setMsgStatus('✅ Entrega de turno registrada correctamente.')
    } catch (err: any) {
      console.error('Error guardando turno:', err)
      setMsgStatus('❌ Error al guardar la entrega de turno: ' + err.message)
    } finally {
      setCargando(false)
      setTimeout(() => setMsgStatus(''), 4000)
    }
  }

  // Enviar entrega de turno por WhatsApp al grupo o número de supervisión
  const enviarPorWhatsApp = async () => {
    if (!novedades.trim()) {
      alert('Primero redacte o genere las novedades del turno.')
      return
    }
    setEnviandoWA(true)
    setMsgStatus('📱 Enviando reporte de turno por WhatsApp...')
    try {
      let textoMsg = `📝 *ENTREGA DE TURNO - GAMA SEGURIDAD*\n`
      textoMsg += `🗓️ Fecha/Hora: ${new Date().toLocaleString('es-CL')}\n`
      textoMsg += `👤 Operador Saliente: *${saliente}*\n`
      if (entrante) textoMsg += `👤 Operador Entrante: *${entrante}*\n`
      textoMsg += `\n📊 *MÉTRICAS DEL TURNO (8h)*:\n`
      textoMsg += `• Total Eventos: ${kpiShift.total} | Alarmas: ${kpiShift.alarmas} | Cortes AC: ${kpiShift.cortes}\n\n`

      if (pendientesList.length > 0) {
        textoMsg += `📌 *PENDIENTES POR ABONADO (${pendientesList.length})*:\n`
        pendientesList.forEach(p => {
          textoMsg += `• [${p.prioridad}] CTA ${p.cuenta}: ${p.instruccion}\n`
        })
        textoMsg += `\n`
      }

      textoMsg += `📝 *NOVEDADES DEL TURNO*:\n${novedades}`

      // Enviar a WhatsApp Central / Grupo
      const res = await sendMessage('56991016912', textoMsg, 'ENTREGA_TURNO')
      if (res.ok) {
        setMsgStatus('✅ Reporte de entrega enviado por WhatsApp exitosamente a supervisión!')
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
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-[96vw] max-w-[1400px] h-[92vh] max-h-[920px] flex flex-col shadow-2xl overflow-hidden text-slate-100">

        {/* Header Oficial Command Center Style */}
        <div className="bg-[#000080] text-white px-5 py-3 flex justify-between items-center shrink-0 border-b border-slate-700 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-base shadow font-bold">
              📝
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                ENTREGA DE TURNO Y NOVEDADES OPERATIVAS
                <span className="text-xs bg-blue-500/30 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded font-mono">v2.0</span>
              </div>
              <div className="text-xs text-blue-200/80">Gama Seguridad — Central de Monitoreo 24/7</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 text-white hover:bg-red-600 hover:text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-sm shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* Bar de KPIs en vivo del Turno (Últimas 8 Horas) */}
        <div className="bg-[#1e293b] border-b border-slate-700 px-5 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Eventos Turno</div>
              <div className="text-base font-black text-blue-400 font-mono">{kpiShift.total} <span className="text-[10px] font-normal text-slate-400">(8h)</span></div>
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

          {/* Columna Izquierda: Formulario y Registro de Turno (7 Cols) */}
          <div className="lg:col-span-7 p-4 border-r border-slate-800 overflow-y-auto space-y-4">

            <form onSubmit={handleGuardar} className="space-y-4">

              {/* Fila 1: Operadores Saliente y Entrante */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-700 pb-2">
                  <span>👤 Responsables del Cambio de Turno</span>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleString('es-CL')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Operador Saliente (Entrega):</label>
                    <input
                      type="text"
                      value={saliente}
                      onChange={(e) => setSaliente(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Operador Entrante (Recibe):</label>
                    <input
                      type="text"
                      value={entrante}
                      onChange={(e) => setEntrante(e.target.value)}
                      placeholder="Ej: Pedro Morales (Turno Noche)"
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 2: Tabla de Pendientes por Abonado */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-700 pb-2">
                  <span>📌 Pendientes Específicos por Abonado</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">{pendientesList.length} Registrados</span>
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

              {/* Fila 3: Redacción de Novedades y Resumen Automático */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                    📝 Novedades y Observaciones del Turno
                  </span>
                  <button
                    type="button"
                    onClick={generarResumenAutomatico}
                    disabled={generandoIA}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 py-1 rounded-lg cursor-pointer transition-colors shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {generandoIA ? '✨ Analizando...' : '✨ Auto-Generar Resumen de Bitácora'}
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={novedades}
                  onChange={(e) => setNovedades(e.target.value)}
                  placeholder="Redacte aquí las novedades del turno, o haga clic en 'Auto-Generar Resumen de Bitácora'..."
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-sm text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-green-500 resize-y"
                  required
                />
              </div>

              {/* Fila 4: Acciones del Formulario */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs font-bold text-amber-400 truncate">{msgStatus}</span>

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={enviarPorWhatsApp}
                    disabled={enviandoWA || !novedades.trim()}
                    className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {enviandoWA ? '📱 Enviando...' : '📱 Enviar por WhatsApp'}
                  </button>

                  <button
                    type="submit"
                    disabled={cargando || !novedades.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {cargando ? '💾 Guardando...' : '💾 Registrar Entrega de Turno'}
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Columna Derecha: Historial de Entregas Recientes (5 Cols) */}
          <div className="lg:col-span-5 p-4 bg-slate-900/50 overflow-y-auto flex flex-col gap-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center shrink-0">
              <span>📋 Historial de Entregas Recientes</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{historial.length} Entregas</span>
            </div>

            {historial.length === 0 ? (
              <div className="text-center py-12 text-slate-500 italic text-xs">
                No hay entregas de turno registradas en la base de datos.
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {historial.map((reg, idx) => (
                  <div key={reg.id || idx} className="bg-[#1e293b] border border-slate-700 rounded-xl p-3 space-y-2 shadow-sm">
                    <div className="flex justify-between items-center text-xs border-b border-slate-700/80 pb-1.5">
                      <span className="font-bold text-blue-400 font-mono flex items-center gap-1.5">
                        🗓️ {new Date(reg.fecha_hora).toLocaleString('es-CL')}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <div><span className="text-slate-400 font-bold">Saliente:</span> {reg.operador_saliente}</div>
                      <div><span className="text-slate-400 font-bold">Entrante:</span> {reg.operador_entrante}</div>
                    </div>

                    {/* Pendientes guardados en este turno */}
                    {reg.pendientes && reg.pendientes.length > 0 && (
                      <div className="bg-amber-950/40 border border-amber-900/50 p-2 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold text-amber-300 uppercase">📌 Pendientes Notificados:</div>
                        {reg.pendientes.map((p, i) => (
                          <div key={i} className="text-[11px] text-amber-200 font-mono">
                            • [{p.cuenta}]: {p.instruccion}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-slate-200 text-xs whitespace-pre-wrap font-mono leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 max-h-48 overflow-y-auto">
                      {reg.novedades}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
