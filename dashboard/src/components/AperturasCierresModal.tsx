'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase, type EventoMonitoreo } from '@/lib/supabase'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesMap = clientesDataRaw as Record<string, Record<string, string>>

interface AperturasCierresModalProps {
  onClose: () => void
}

export interface ItemMonitoreado {
  id: string // Identificador único ej: "C745_P1"
  cuenta: string
  nombreAbonado: string
  particion: string // ej: "P1", "P2", "P3"
  numParticion: number // 1, 2, 3...
}

interface EstadoParticion {
  esApertura: boolean // true = VERDE (Apertura), false = ROJO (Cierre)
  hora: string
  fecha: string
  usuarioCodigo: string
  usuarioNombre: string
  eventoNombre: string
}

const STORAGE_KEY = 'gama_aperturas_cierres_monitoreados_v2'
const SUPABASE_CONFIG_CUENTA = 'CONFIG_APERTURAS_CIERRES_LISTA'

// Helper para resolver el Nombre Real del Abonado desde la BD de clientes
const obtenerNombreRealBD = (cta: string, fallbackNombre?: string): string => {
  const c = clientesMap[cta.toUpperCase().trim()]
  if (c?.nombre && c.nombre.trim()) return c.nombre.trim().toUpperCase()
  if (fallbackNombre && fallbackNombre.trim() && !fallbackNombre.includes('- BODEGA') && !fallbackNombre.includes(' P2')) {
    return fallbackNombre.trim().toUpperCase()
  }
  return `ABONADO #${cta.toUpperCase()}`
}

// Lista sugerida inicial con nombres 100% reales de la BD
const CUENTAS_DEFECTO_SUGERIDAS: ItemMonitoreado[] = [
  { id: 'C745_P1', cuenta: 'C745', nombreAbonado: obtenerNombreRealBD('C745'), particion: 'P1', numParticion: 1 },
  { id: 'C745_P2', cuenta: 'C745', nombreAbonado: obtenerNombreRealBD('C745'), particion: 'P2', numParticion: 2 },
  { id: '0014_P1', cuenta: '0014', nombreAbonado: obtenerNombreRealBD('0014'), particion: 'P1', numParticion: 1 },
  { id: '0014_P2', cuenta: '0014', nombreAbonado: obtenerNombreRealBD('0014'), particion: 'P2', numParticion: 2 },
  { id: 'C7C9_P1', cuenta: 'C7C9', nombreAbonado: obtenerNombreRealBD('C7C9'), particion: 'P1', numParticion: 1 },
  { id: 'C7A0_P1', cuenta: 'C7A0', nombreAbonado: obtenerNombreRealBD('C7A0'), particion: 'P1', numParticion: 1 }
]

// Función para hacer coincidir el número de partición (columna ZN/PAR en Supabase)
const matchParticion = (zonaStr: string, numParticion: number, labelParticion: string): boolean => {
  if (!zonaStr || zonaStr === 'None' || zonaStr === '00' || zonaStr === '0' || zonaStr === '---') {
    return numParticion === 1 // Si no especifica zona, asumir partición 1
  }
  const z = zonaStr.trim().toUpperCase()
  const numZ = parseInt(z.replace(/[^0-9]/g, ''), 10)
  if (!isNaN(numZ)) {
    return numZ === numParticion
  }
  return z.includes(labelParticion.toUpperCase()) || z.includes(`P${numParticion}`)
}

export default function AperturasCierresModal({ onClose }: AperturasCierresModalProps) {
  const [itemsMonitoreados, setItemsMonitoreados] = useState<ItemMonitoreado[]>(CUENTAS_DEFECTO_SUGERIDAS)
  const [estadosMap, setEstadosMap] = useState<Record<string, EstadoParticion>>({})
  const [cargando, setCargando] = useState(false)
  const [inputCuenta, setInputCuenta] = useState('')
  const [inputParticionSel, setInputParticionSel] = useState<string>('P1')
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'APERTURAS' | 'CIERRES'>('TODOS')
  const [filtroTexto, setFiltroTexto] = useState('')
  const [mensajeError, setMensajeError] = useState('')

  // 1. Cargar lista guardada (Local + Supabase compartida entre monitoras)
  useEffect(() => {
    let cancel = false

    const fetchListaCompartida = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', SUPABASE_CONFIG_CUENTA)
          .order('id', { ascending: false })
          .limit(1)

        if (!cancel && data && data.length > 0 && data[0].nombre_abonado) {
          try {
            const parsed = JSON.parse(data[0].nombre_abonado)
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Sanitizar nombres de abonados para asegurar datos reales de BD
              const sanitizados = parsed.map((item: ItemMonitoreado) => ({
                ...item,
                nombreAbonado: obtenerNombreRealBD(item.cuenta, item.nombreAbonado)
              }))
              setItemsMonitoreados(sanitizados)
              return
            }
          } catch {}
        }

        const localSaved = localStorage.getItem(STORAGE_KEY)
        if (localSaved && !cancel) {
          const parsedLocal = JSON.parse(localSaved)
          if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
            const sanitizadosLocal = parsedLocal.map((item: ItemMonitoreado) => ({
              ...item,
              nombreAbonado: obtenerNombreRealBD(item.cuenta, item.nombreAbonado)
            }))
            setItemsMonitoreados(sanitizadosLocal)
          }
        }
      } catch (e) {
        console.warn('Error al cargar lista de aperturas/cierres:', e)
      }
    }

    fetchListaCompartida()
    return () => { cancel = true }
  }, [])

  // Guardar lista sincronizada
  const guardarLista = async (nuevaLista: ItemMonitoreado[]) => {
    setItemsMonitoreados(nuevaLista)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaLista))
      await supabase.from('eventos_monitoreo').insert({
        cuenta: SUPABASE_CONFIG_CUENTA,
        nombre_abonado: JSON.stringify(nuevaLista),
        evento: 'CONFIG_UPDATE_APERTURAS_CIERRES',
        fecha_hora: new Date().toISOString()
      })
    } catch (err) {
      console.warn('Error al sincronizar lista de particiones:', err)
    }
  }

  // 2. Cargar eventos en tiempo real de los abonados y sus particiones
  useEffect(() => {
    if (itemsMonitoreados.length === 0) return
    let isCancelled = false

    const cargarEstadosRealtime = async () => {
      setCargando(true)
      const cuentasUnicas = Array.from(new Set(itemsMonitoreados.map(i => i.cuenta)))

      try {
        const { data: eventosData } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .in('cuenta', cuentasUnicas)
          .order('id', { ascending: false })
          .limit(300)

        if (isCancelled || !eventosData) return

        const nuevoMap: Record<string, EstadoParticion> = {}

        // Evaluar cada partición individualmente filtrando por su columna PAR/ZN
        itemsMonitoreados.forEach((item) => {
          const evsCuenta = eventosData.filter(e => e.cuenta === item.cuenta)

          // Encontrar el último evento de Apertura/Cierre que corresponda a ESTA partición (PAR)
          const evRelevante = evsCuenta.find(e => {
            const evUpper = (e.evento || '').toUpperCase()
            const esApOrCie = evUpper.includes('APERTURA') || evUpper.includes('CIERRE') ||
                              evUpper.includes('DESARME') || evUpper.includes('ARME') ||
                              evUpper.includes('OPEN') || evUpper.includes('CLOSE')
            
            if (!esApOrCie) return false

            // Verificar si la partición (zona/PAR) coincide
            return matchParticion(e.zona || '', item.numParticion, item.particion)
          })

          if (evRelevante) {
            const evUpper = (evRelevante.evento || '').toUpperCase()
            const esApertura = evUpper.includes('APERTURA') || evUpper.includes('DESARME') || evUpper.includes('OPEN')
            
            const fh = evRelevante.fecha_hora || ''
            const hora = fh.includes('T') ? fh.split('T')[1]?.substring(0, 8) : fh.substring(11, 19) || fh
            const fecha = fh.includes('T') ? fh.split('T')[0] : fh.substring(0, 10) || ''

            nuevoMap[item.id] = {
              esApertura,
              hora: hora || 'Reciente',
              fecha: fecha || '',
              usuarioCodigo: evRelevante.usuario || evRelevante.zona || 'U-01',
              usuarioNombre: evRelevante.nombre_abonado || 'Usuario Registrado',
              eventoNombre: evRelevante.evento || (esApertura ? 'APERTURA' : 'CIERRE')
            }
          } else {
            // Estado por defecto si no hay señal reciente
            nuevoMap[item.id] = {
              esApertura: false,
              hora: '--:--:--',
              fecha: '',
              usuarioCodigo: 'U-01',
              usuarioNombre: 'Sin evento reciente',
              eventoNombre: 'CIERRE / ARMADO'
            }
          }
        })

        setEstadosMap(nuevoMap)
      } catch (e) {
        console.warn('Error al cargar estados de aperturas/cierres:', e)
      } finally {
        if (!isCancelled) setCargando(false)
      }
    }

    cargarEstadosRealtime()

    // Suscripción Realtime a eventos
    const channel = supabase
      .channel('aperturas_cierres_p1_p2_updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'eventos_monitoreo' },
        (payload) => {
          const newEv = payload.new as EventoMonitoreo
          const evUpper = (newEv.evento || '').toUpperCase()
          
          if (evUpper.includes('CONFIG_UPDATE_APERTURAS_CIERRES')) {
            try {
              const parsed = JSON.parse(newEv.nombre_abonado)
              if (Array.isArray(parsed)) {
                const sanitizados = parsed.map((item: ItemMonitoreado) => ({
                  ...item,
                  nombreAbonado: obtenerNombreRealBD(item.cuenta, item.nombreAbonado)
                }))
                setItemsMonitoreados(sanitizados)
              }
            } catch {}
            return
          }

          const esAp = evUpper.includes('APERTURA') || evUpper.includes('DESARME') || evUpper.includes('OPEN')
          const esCie = evUpper.includes('CIERRE') || evUpper.includes('ARME') || evUpper.includes('CLOSE')

          if (!esAp && !esCie) return

          // Actualizar las particiones pertenecientes a esta cuenta si coinciden en PAR
          itemsMonitoreados.forEach(item => {
            if (item.cuenta === newEv.cuenta && matchParticion(newEv.zona || '', item.numParticion, item.particion)) {
              const fh = newEv.fecha_hora || ''
              const hora = fh.includes('T') ? fh.split('T')[1]?.substring(0, 8) : fh.substring(11, 19) || fh

              setEstadosMap(prev => ({
                ...prev,
                [item.id]: {
                  esApertura: esAp,
                  hora: hora || new Date().toLocaleTimeString('es-CL'),
                  fecha: new Date().toLocaleDateString(),
                  usuarioCodigo: newEv.usuario || newEv.zona || 'U-01',
                  usuarioNombre: newEv.nombre_abonado || 'Usuario Registrado',
                  eventoNombre: newEv.evento
                }
              }))
            }
          })
        }
      )
      .subscribe()

    return () => {
      isCancelled = true
      supabase.removeChannel(channel)
    }
  }, [itemsMonitoreados])

  // 3. Agregar Partición Manualmente (Cuenta + P1, P2...)
  const handleAgregarManual = (ctaManual?: string, particionManual?: string) => {
    setMensajeError('')
    const cta = (ctaManual || inputCuenta).toUpperCase().trim()
    const partLabel = (particionManual || inputParticionSel).toUpperCase().trim() || 'P1'

    if (!cta) {
      setMensajeError('Ingrese un número de cuenta válido.')
      return
    }

    const numP = parseInt(partLabel.replace(/[^0-9]/g, ''), 10) || 1
    const partNormalizada = `P${numP}`
    const idItem = `${cta}_${partNormalizada}`

    if (itemsMonitoreados.some(i => i.id === idItem)) {
      setMensajeError(`La cuenta #${cta} Partición ${partNormalizada} ya está agregada.`)
      return
    }

    const nombreRealBD = obtenerNombreRealBD(cta)

    const nuevoItem: ItemMonitoreado = {
      id: idItem,
      cuenta: cta,
      nombreAbonado: nombreRealBD,
      particion: partNormalizada,
      numParticion: numP
    }

    const nuevos = [...itemsMonitoreados, nuevoItem]
    guardarLista(nuevos)
    setInputCuenta('')
  }

  // Eliminar un abonado/partición de la lista
  const handleEliminarItem = (idEliminar: string) => {
    const filtrados = itemsMonitoreados.filter(i => i.id !== idEliminar)
    guardarLista(filtrados)
  }

  // Filtrado visual de los ítems
  const itemsFiltrados = useMemo(() => {
    return itemsMonitoreados.filter(item => {
      const estado = estadosMap[item.id]
      if (filtroEstado === 'APERTURAS' && !estado?.esApertura) return false
      if (filtroEstado === 'CIERRES' && estado?.esApertura) return false

      if (filtroTexto.trim()) {
        const q = filtroTexto.toLowerCase()
        const matchCta = item.cuenta.toLowerCase().includes(q)
        const matchNom = item.nombreAbonado.toLowerCase().includes(q)
        const matchPar = item.particion.toLowerCase().includes(q)
        if (!matchCta && !matchNom && !matchPar) return false
      }

      return true
    })
  }, [itemsMonitoreados, estadosMap, filtroEstado, filtroTexto])

  // Conteo de Aperturas (Verdes) y Cierres (Rojos)
  const conteoStats = useMemo(() => {
    let aperturas = 0
    let cierres = 0
    itemsMonitoreados.forEach(i => {
      const st = estadosMap[i.id]
      if (st?.esApertura) aperturas++
      else cierres++
    })
    return { aperturas, cierres, total: itemsMonitoreados.length }
  }, [itemsMonitoreados, estadosMap])

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-[#0b1329] border-2 border-slate-700 w-full max-w-6xl max-h-[92vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden font-sans text-white animate-in zoom-in-95">
        
        {/* ENCABEZADO SCORPION / COMMAND CENTER */}
        <div className="bg-gradient-to-r from-[#000080] via-[#0d1f4d] to-[#040a1b] px-4 py-3 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-xl shadow">
              🔑
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-white flex items-center gap-2">
                CONTROL DE APERTURAS & CIERRES POR PARTICIÓN (`P1`, `P2`...)
                <span className="text-[10px] bg-blue-900/80 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-500/40">
                  REALTIME BD (COLUMNA PAR / ZONA)
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Semáforo automático por partición individual. Lectura directa del campo `PAR` (`zona`) desde Supabase/MDB. Nombres 100% reales de la BD.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white font-bold flex items-center justify-center transition cursor-pointer border border-slate-600"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* BARRA SUPERIOR DE FORMULARIO DE AGREGADO MANUAL (CUENTA + PARTICIÓN) */}
        <div className="bg-[#070e20] p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Formulario Agregar Partición Manual */}
          <div className="flex items-center gap-2 flex-1 min-w-[320px]">
            <input
              type="text"
              placeholder="Número de Cuenta (Ej: C745, 0014)..."
              value={inputCuenta}
              onChange={(e) => setInputCuenta(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAgregarManual()}
              className="bg-[#0e172e] border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 uppercase font-bold"
            />

            <select
              value={inputParticionSel}
              onChange={(e) => setInputParticionSel(e.target.value)}
              className="bg-[#0e172e] border border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono text-cyan-300 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="P1">Partición P1</option>
              <option value="P2">Partición P2</option>
              <option value="P3">Partición P3</option>
              <option value="P4">Partición P4</option>
              <option value="P5">Partición P5</option>
            </select>

            <button
              onClick={() => handleAgregarManual()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition shadow cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              + Agregar Partición
            </button>

            {mensajeError && (
              <span className="text-red-400 text-xs font-medium animate-pulse">{mensajeError}</span>
            )}
          </div>

          {/* Filtros Rápidos (Todos / Verdes / Rojos) */}
          <div className="flex items-center gap-1.5 bg-[#0b1328] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFiltroEstado('TODOS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filtroEstado === 'TODOS' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({conteoStats.total})
            </button>
            <button
              onClick={() => setFiltroEstado('APERTURAS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filtroEstado === 'APERTURAS' ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 shadow' : 'text-emerald-400 hover:bg-emerald-950/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🟢 Abiertos ({conteoStats.aperturas})
            </button>
            <button
              onClick={() => setFiltroEstado('CIERRES')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filtroEstado === 'CIERRES' ? 'bg-red-950/80 border border-red-500/50 text-red-300 shadow' : 'text-red-400 hover:bg-red-950/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              🔴 Cerrados ({conteoStats.cierres})
            </button>
          </div>

          {/* Filtro por Texto en Pantalla */}
          <input
            type="text"
            placeholder="Buscar abonado/partición..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="bg-[#0e172e] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
          />
        </div>

        {/* CONTENIDO PRINCIPAL: MATRIZ ULTRA-COMPACTA ALTA DENSIDAD */}
        <div className="flex-1 p-3 overflow-y-auto bg-[#070d1c] custom-scrollbar">
          {cargando && itemsMonitoreados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Cargando eventos por partición desde Supabase...</span>
            </div>
          ) : itemsFiltrados.length === 0 ? (
            <div className="bg-[#0b1328] border border-slate-800 rounded-2xl p-8 text-center space-y-2 my-6">
              <span className="text-3xl block">🔑</span>
              <h3 className="font-bold text-sm text-white">No hay abonados o particiones activas en la vista</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Ingrese el número de cuenta y la partición (P1, P2) en el formulario superior para iniciar la supervisión.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {itemsFiltrados.map((item) => {
                const st = estadosMap[item.id]
                const esApertura = st?.esApertura ?? false
                const siguienteP = `P${item.numParticion + 1}`

                return (
                  <div
                    key={item.id}
                    className={`relative rounded-xl border p-2.5 transition-all duration-300 shadow-md flex flex-col justify-between ${
                      esApertura
                        ? 'bg-gradient-to-r from-[#042013] via-[#072c1c] to-[#041a10] border-emerald-500/80 shadow-emerald-950/50'
                        : 'bg-gradient-to-r from-[#200508] via-[#2d080c] to-[#1a0406] border-red-600/80 shadow-red-950/50'
                    }`}
                  >
                    {/* Botón Eliminar en esquina */}
                    <button
                      onClick={() => handleEliminarItem(item.id)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-black/40 hover:bg-red-600 text-slate-400 hover:text-white text-[10px] font-bold flex items-center justify-center transition cursor-pointer"
                      title="Quitar esta partición"
                    >
                      ✕
                    </button>

                    {/* Línea Superior: Cuenta + Badge Partición (P1/P2) + Estado Semáforo */}
                    <div className="flex items-center justify-between gap-1.5 pr-5">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-900/90 text-white font-mono font-black text-xs px-2 py-0.5 rounded border border-slate-700 shadow-sm">
                          #{item.cuenta}
                        </span>
                        <span className="bg-cyan-950 text-cyan-300 font-mono font-black text-xs px-2 py-0.5 rounded border border-cyan-700/80 shadow-xs">
                          {item.particion}
                        </span>
                      </div>

                      {/* Badge Semáforo */}
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow ${
                          esApertura
                            ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                            : 'bg-red-600 text-white shadow-red-600/30'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${esApertura ? 'bg-black animate-pulse' : 'bg-white animate-ping'}`} />
                        {esApertura ? 'APERTURA' : 'CIERRE'}
                      </span>
                    </div>

                    {/* Línea Media: Nombre REAL del Abonado (BD) */}
                    <div className="mt-1.5 mb-1 flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-white truncate tracking-tight uppercase" title={item.nombreAbonado}>
                        {item.nombreAbonado}
                      </h4>

                      {/* Botón rápido para agregar siguiente partición (ej: + P2) */}
                      <button
                        onClick={() => handleAgregarManual(item.cuenta, siguienteP)}
                        className="text-[9px] bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white font-mono font-bold px-1.5 py-0.5 rounded border border-slate-700 transition cursor-pointer shrink-0"
                        title={`Agregar también Partición ${siguienteP} para #${item.cuenta}`}
                      >
                        + {siguienteP}
                      </button>
                    </div>

                    {/* Línea Inferior: Timestamp + Usuario que Armó/Desarmó */}
                    <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-300">
                      <span className="flex items-center gap-1 font-bold">
                        🕒 {st?.hora || '--:--:--'}
                      </span>
                      <span className="truncate max-w-[120px] text-slate-400" title={st?.usuarioNombre}>
                        👤 {st?.usuarioCodigo || 'U-01'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* PIE DE PÁGINA DE RESUMEN Y NORMAS OPERATIVAS */}
        <div className="bg-[#060c1a] px-4 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              🟢 {conteoStats.aperturas} Particiones Abiertas (Desarmadas)
            </span>
            <span className="flex items-center gap-1 text-red-400 font-bold">
              🔴 {conteoStats.cierres} Particiones Cerradas (Armadas)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500">
              * Lectura directa del campo PAR (`zona`) en Supabase Realtime
            </span>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1 rounded-xl text-xs transition cursor-pointer border border-slate-700"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
