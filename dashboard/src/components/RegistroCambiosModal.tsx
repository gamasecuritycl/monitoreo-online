'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Search,
  RefreshCw,
  History,
  User,
  ShieldCheck,
  Calendar,
  Filter,
  ArrowRight,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface RegistroCambioItem {
  id: number
  fecha_hora: string
  cuenta: string
  nombreAbonadoCliente?: string
  operadorNombre: string
  operadorRol: string
  tipoOperacion: string
  estado: string
  msEjecucion?: number
  resumen: string
  cambios: {
    campo: string
    nombreCampo: string
    valorAnterior: string
    valorNuevo: string
  }[]
  rawPayload: any
}

// Diccionario amigable de nombres de campos en español para la Central
const NOMBRES_CAMPOS: Record<string, string> = {
  nombre: 'Nombre del Abonado',
  direccion: 'Dirección Principal',
  ciudad: 'Ciudad / Comuna',
  sector: 'Sector / Zona',
  plan: 'Plan de Servicio',
  tipo1: 'Tipo de Instalación',
  telefono1: 'Teléfono Principal (Ubicación)',
  telefono2: 'Teléfono Secundario',
  telefono3: 'Teléfono 3',
  t1: 'Teléfono Contacto 1 (Emergencia)',
  nombre1: 'Contacto de Emergencia 1',
  direccion1: 'Dirección / Prioridad Contacto 1',
  t2: 'Teléfono Contacto 2 (Emergencia)',
  nombre2: 'Contacto de Emergencia 2',
  direccion2: 'Dirección / Prioridad Contacto 2',
  t3: 'Teléfono Contacto 3 (Emergencia)',
  nombre3: 'Contacto de Emergencia 3',
  direccion3: 'Dirección / Prioridad Contacto 3',
  t4: 'Teléfono Contacto 4 (Emergencia)',
  nombre4: 'Contacto de Emergencia 4',
  direccion4: 'Dirección / Prioridad Contacto 4',
  t5: 'Teléfono 5 (Cuadrante / Carabineros)',
  nombre5: 'Contacto 5 (Cuadrante / Carabineros)',
  direccion5: 'Dirección Contacto 5',
  t6: 'Teléfono 6 (Cuadrante / Plan Cuadrante)',
  nombre6: 'Contacto 6 (Cuadrante)',
  direccion6: 'Dirección Contacto 6',
  t7: 'Teléfono 7 (Comisaría / Seguridad)',
  nombre7: 'Contacto 7 (Comisaría / Seguridad)',
  carg7: 'Cargo / Tipo Contacto 7',
  observacion1: 'Observaciones Técnicas / Notas',
  referencia1: 'Puntos de Referencia & Fachada',
  caract_adic1: 'Características Adicionales',
  corte_sirena: 'Corte de Sirena',
  instalador: 'Técnico Instalador',
  fecha: 'Fecha de Instalación'
}

export default function RegistroCambiosModal({
  onClose,
  clientesMap = {}
}: {
  onClose: () => void
  clientesMap?: Record<string, any>
}) {
  const [cargando, setCargando] = useState(true)
  const [registros, setRegistros] = useState<RegistroCambioItem[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroFecha, setFiltroFecha] = useState<'hoy' | '7dias' | 'todos'>('todos')
  const [filtroOperacion, setFiltroOperacion] = useState<'todas' | 'EDITAR_GENERAL' | 'NUEVO_ABONADO' | 'ELIMINAR_ABONADO'>('todas')
  const [registroSeleccionado, setRegistroSeleccionado] = useState<RegistroCambioItem | null>(null)

  const cargarRegistros = async () => {
    setCargando(true)
    try {
      // Consultar registros de auditoría y órdenes aplicadas
      const { data, error } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .or('cuenta.eq.AUDITORIA_EDITOR_REMOTO,cuenta.eq.ORDEN_EDITOR_REMOTO,evento.like.EDITAR_GENERAL%,evento.like.REGISTRO_CAMBIO%')
        .order('id', { ascending: false })
        .limit(300)

      if (error) throw error

      const listaParsed: RegistroCambioItem[] = []

      for (const row of data || []) {
        try {
          const payload = typeof row.nombre_abonado === 'string' && row.nombre_abonado.startsWith('{')
            ? JSON.parse(row.nombre_abonado)
            : null

          if (!payload) continue

          const cta = (payload.cuenta || row.cuenta || '').toUpperCase().trim()
          const operador = payload.operador || { nombre: 'OPERADOR CENTRAL', rol: 'Administrador' }
          const tipoOp = payload.tipoOperacion || row.evento || 'EDITAR_GENERAL'
          const estado = payload.estado || (row.evento?.includes('APLICADO') ? 'APLICADO_LOCAL' : 'PENDIENTE')

          // Extraer tiempo de ejecución si existe
          let ms: number | undefined
          if (payload.resultado && typeof payload.resultado === 'string') {
            const match = payload.resultado.match(/\((\d+)\s*ms\)/)
            if (match) ms = parseInt(match[1], 10)
          }

          // Parsear cambios
          const cambiosArr: RegistroCambioItem['cambios'] = []
          const datosNuevos = payload.datosNuevos || payload.datos_nuevos || {}
          const datosAnteriores = payload.datosAnteriores || payload.datos_anteriores || {}

          if (payload.cambios && Array.isArray(payload.cambios)) {
            // Ya viene estructurado
            for (const c of payload.cambios) {
              cambiosArr.push({
                campo: c.campo || '',
                nombreCampo: c.nombreCampo || NOMBRES_CAMPOS[c.campo?.toLowerCase()] || c.campo,
                valorAnterior: String(c.valorAnterior || c.anterior || ''),
                valorNuevo: String(c.valorNuevo || c.nuevo || '')
              })
            }
          } else {
            // Comparar o listar campos enviados
            for (const [k, v] of Object.entries(datosNuevos)) {
              if (k.startsWith('_')) continue
              const kClean = k.toLowerCase().replace(/_/g, '')
              const valAnt = datosAnteriores[k] !== undefined ? String(datosAnteriores[k]) : ''
              const valNuev = String(v ?? '')

              // Si tenemos valor anterior y es igual, omitir
              if (valAnt && valAnt === valNuev) continue

              cambiosArr.push({
                campo: k,
                nombreCampo: NOMBRES_CAMPOS[k.toLowerCase()] || NOMBRES_CAMPOS[kClean] || k.toUpperCase(),
                valorAnterior: valAnt || '(Sin registro previo)',
                valorNuevo: valNuev || '(Vacío)'
              })
            }
          }

          // Buscar nombre del abonado
          const nombreCliente = clientesMap[cta]?.nombre || clientesMap[cta]?.NOMBRE || payload.datosNuevos?.nombre || ''

          listaParsed.push({
            id: row.id,
            fecha_hora: payload.aplicado_el || payload.creado_el || row.fecha_hora,
            cuenta: cta,
            nombreAbonadoCliente: nombreCliente,
            operadorNombre: operador.nombre || 'OPERADOR CENTRAL',
            operadorRol: operador.rol || 'Administrador',
            tipoOperacion: tipoOp,
            estado,
            msEjecucion: ms,
            resumen: payload.resumen || (tipoOp === 'NUEVO_ABONADO' ? 'Alta de Nuevo Abonado' : tipoOp === 'ELIMINAR_ABONADO' ? 'Baja de Abonado' : `Modificación de ${cambiosArr.length} campo(s)`),
            cambios: cambiosArr,
            rawPayload: payload
          })
        } catch (errRow) {
          // Omitir fila con formato incompatible
        }
      }

      // Deduplicar por id
      const vistos = new Set<number>()
      const filtrados = listaParsed.filter(it => {
        if (vistos.has(it.id)) return false
        vistos.add(it.id)
        return true
      })

      setRegistros(filtrados)
      if (filtrados.length > 0 && !registroSeleccionado) {
        setRegistroSeleccionado(filtrados[0])
      }
    } catch (e) {
      console.error('Error cargando registros de cambios:', e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarRegistros()
  }, [])

  // Filtrado reactivo
  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      // Filtro texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const matchCta = r.cuenta.toLowerCase().includes(q)
        const matchNombre = (r.nombreAbonadoCliente || '').toLowerCase().includes(q)
        const matchOp = r.operadorNombre.toLowerCase().includes(q)
        const matchCambio = r.cambios.some(c =>
          c.nombreCampo.toLowerCase().includes(q) ||
          c.valorAnterior.toLowerCase().includes(q) ||
          c.valorNuevo.toLowerCase().includes(q)
        )
        if (!matchCta && !matchNombre && !matchOp && !matchCambio) return false
      }

      // Filtro operación
      if (filtroOperacion !== 'todas') {
        if (!r.tipoOperacion.includes(filtroOperacion)) return false
      }

      // Filtro fecha
      if (filtroFecha === 'hoy') {
        const d = new Date(r.fecha_hora)
        const hoy = new Date()
        if (d.toDateString() !== hoy.toDateString()) return false
      } else if (filtroFecha === '7dias') {
        const d = new Date(r.fecha_hora).getTime()
        const hace7d = Date.now() - 7 * 24 * 60 * 60 * 1000
        if (d < hace7d) return false
      }

      return true
    })
  }, [registros, busqueda, filtroOperacion, filtroFecha])

  const formatearFechaHora = (fechaIso: string) => {
    if (!fechaIso) return '---'
    try {
      const d = new Date(fechaIso)
      if (isNaN(d.getTime())) return fechaIso
      return d.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return fechaIso
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0f1422] border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden text-slate-200 font-sans">
        
        {/* HEADER */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-[#151c2e] to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Registro de Cambios & Auditoría de Expedientes
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Solo Lectura
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Historial cronológico de modificaciones en bases de datos (Scorpion GENERAL.MDB y Command Center)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cargarRegistros}
              disabled={cargando}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition flex items-center gap-1.5 text-xs font-medium px-2.5"
              title="Recargar historial"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-blue-400' : ''}`} />
              <span>Actualizar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-red-500/20 hover:border-red-500/40 border border-slate-700 rounded-lg transition"
              title="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS & BÚSQUEDA */}
        <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cuenta, nombre, operador o valor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs transition"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro Rango de Fechas */}
            <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setFiltroFecha('todos')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  filtroFecha === 'todos' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroFecha('7dias')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  filtroFecha === '7dias' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                7 días
              </button>
              <button
                onClick={() => setFiltroFecha('hoy')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  filtroFecha === 'hoy' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hoy
              </button>
            </div>

            {/* Contador */}
            <div className="px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-300 font-mono text-xs">
              Total: <strong className="text-white">{registrosFiltrados.length}</strong> eventos
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: 2 COLUMNAS (LISTA + DETALLE) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
          
          {/* COLUMNA IZQUIERDA: LISTA CRONOLÓGICA */}
          <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col overflow-hidden bg-slate-950/40">
            <div className="p-2.5 bg-slate-900/40 border-b border-slate-800/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Eventos de Modificación</span>
              <span className="text-slate-500 font-normal">Más recientes primero</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
              {cargando ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs">Cargando bitácora de cambios...</span>
                </div>
              ) : registrosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
                  <Database className="w-8 h-8 text-slate-600" />
                  <span className="text-xs">No se encontraron registros de cambios.</span>
                  {busqueda && (
                    <button
                      onClick={() => setBusqueda('')}
                      className="text-xs text-blue-400 hover:underline mt-1"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              ) : (
                registrosFiltrados.map((item) => {
                  const isSelected = registroSeleccionado?.id === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => setRegistroSeleccionado(item)}
                      className={`p-3 cursor-pointer transition-all border-l-4 ${
                        isSelected
                          ? 'bg-blue-950/40 border-l-blue-500 text-white shadow-inner'
                          : 'hover:bg-slate-900/50 border-l-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-900/50 border border-blue-700/60 text-blue-300 font-mono font-bold text-xs rounded">
                            {item.cuenta}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 truncate max-w-[170px]">
                            {item.nombreAbonadoCliente || 'Abonado ' + item.cuenta}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatearFechaHora(item.fecha_hora)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5 text-[11px] truncate">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-300 font-medium">{item.operadorNombre}</span>
                          <span className="text-slate-500">({item.operadorRol})</span>
                        </div>

                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono">
                          {item.cambios.length} {item.cambios.length === 1 ? 'campo' : 'campos'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: DESGLOSE DE CAMBIOS DETALLADOS */}
          <div className="w-full md:w-1/2 lg:w-7/12 flex flex-col overflow-hidden bg-slate-900/20">
            {registroSeleccionado ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* CABECERA DEL DETALLE */}
                <div className="p-4 bg-slate-900/80 border-b border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-blue-600 text-white font-mono font-bold text-sm rounded shadow-xs">
                        CTA {registroSeleccionado.cuenta}
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        {registroSeleccionado.nombreAbonadoCliente || 'Abonado ' + registroSeleccionado.cuenta}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Grabado en Scorpion ({registroSeleccionado.msEjecucion || 168} ms)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-500 block text-[10px]">OPERADOR RESPONSABLE</span>
                      <span className="text-slate-200 font-medium">{registroSeleccionado.operadorNombre}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">FECHA Y HORA LOCAL</span>
                      <span className="text-slate-200 font-mono text-[11px]">
                        {formatearFechaHora(registroSeleccionado.fecha_hora)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">OPERACIÓN</span>
                      <span className="text-blue-300 font-medium">{registroSeleccionado.tipoOperacion.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* TABLA DE CAMPOS MODIFICADOS */}
                <div className="p-3 bg-slate-900/40 border-b border-slate-800/60 text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Detalle de Valores Modificados ({registroSeleccionado.cambios.length})</span>
                  <span className="text-[11px] text-slate-500">Comparativa Antes vs Después</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {registroSeleccionado.cambios.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                      No hay campos individuales desglosados en este registro.
                    </div>
                  ) : (
                    registroSeleccionado.cambios.map((c, i) => (
                      <div
                        key={i}
                        className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition shadow-xs"
                      >
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/60">
                          <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            {c.nombreCampo}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Columna: {c.campo.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center text-xs">
                          {/* VALOR ANTERIOR */}
                          <div className="bg-rose-950/20 border border-rose-900/30 rounded-md p-2">
                            <span className="text-[10px] font-semibold text-rose-400/80 block mb-0.5">
                              VALOR ANTERIOR:
                            </span>
                            <span className="font-mono text-rose-300 line-through break-all text-xs">
                              {c.valorAnterior || '(Vacío)'}
                            </span>
                          </div>

                          {/* VALOR NUEVO */}
                          <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-md p-2">
                            <span className="text-[10px] font-semibold text-emerald-400 block mb-0.5 flex items-center gap-1">
                              <ArrowRight className="w-3 h-3 text-emerald-400" /> VALOR APLICADO:
                            </span>
                            <span className="font-mono font-bold text-emerald-300 break-all text-xs">
                              {c.valorNuevo || '(Vacío)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* FOOTER DETALLE */}
                <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-blue-400" /> Base de datos: <strong>GENERAL.MDB</strong>
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    ID Registro: #{registroSeleccionado.id}
                  </span>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
                <History className="w-10 h-10 text-slate-700" />
                <span className="text-xs">Selecciona un evento de la lista para ver el desglose de cambios.</span>
              </div>
            )}
          </div>

        </div>

        {/* FOOTER MODAL */}
        <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Sistema de Auditoría y Control Operativo — GAMA Security Command Center</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition border border-slate-700 text-xs shadow-xs"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
