'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, type EventoMonitoreo } from '@/lib/supabase'
import EventGrid from './EventGrid'
import FooterActions from './FooterActions'
import ToolModal from './ToolModal'
import ExpedienteModal from './ExpedienteModal'
import EventosPorUsuarioModal from './EventosPorUsuarioModal'
import ZonificacionModal from './ZonificacionModal'

// ── Contactos y Zonas simuladas por abonado para poblar el Panel Lateral de Scorpion ──
interface ContactoAutorizado {
  prioridad: number
  nombre: string
  telefono: string
}

interface ZonaMapeada {
  numero: string
  descripcion: string
  codigoCID: string
}

function obtenerDatosAbonado(cuenta: string, nombreAbonado: string, clienteDb: Record<string, string> | null) {
  // Datos base con fallback por si no existe
  const datos = {
    direccion: clienteDb?.direccion || 'Av. Providencia 1420, Of. 602',
    comuna: clienteDb?.ciudad || clienteDb?.sector || 'Providencia, Santiago',
    contactos: [] as ContactoAutorizado[],
    zonas: [
      { numero: '01', descripcion: 'Puerta Acceso Principal', codigoCID: '130' },
      { numero: '02', descripcion: 'Sensor Movimiento Living', codigoCID: '130' },
      { numero: '03', descripcion: 'PIR Bodega de Insumos', codigoCID: '130' },
      { numero: '04', descripcion: 'Pánico Teclado Caja 1', codigoCID: '120' }
    ] as ZonaMapeada[]
  }

  // Extraer contactos reales del 1 al 7 de GENERAL.mdb (si existen en el payload)
  if (clienteDb) {
    for (let i = 1; i <= 7; i++) {
      const nombre = clienteDb[`nombre${i}`]
      const tel = clienteDb[`t${i}`] || clienteDb[`telefono${i}`]
      if (nombre && nombre.trim()) {
        datos.contactos.push({
          prioridad: i,
          nombre: nombre.toUpperCase().trim(),
          telefono: (tel || '').trim()
        })
      }
    }
  }

  // Si no hay contactos en la BD, rellenar con fallbacks por defecto
  if (datos.contactos.length === 0) {
    datos.contactos = [
      { prioridad: 1, nombre: 'Tomás Toro (Admin)', telefono: '+56 9 8765 4321' },
      { prioridad: 2, nombre: 'Conserjería Central', telefono: '+56 2 2345 6789' },
      { prioridad: 3, nombre: 'Carabineros de Chile', telefono: '133' }
    ]
  }

  return datos
}

export default function ScorpionDashboard() {
  const [eventos, setEventos] = useState<EventoMonitoreo[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoMonitoreo | null>(null)
  const [modalActivo, setModalActivo] = useState<string | null>(null)
  const [horaLocal, setHoraLocal] = useState('')
  
  // Mapa de clientes cargado en tiempo real
  const [clientesMap, setClientesMap] = useState<Record<string, Record<string, string>>>({})
  
  // Mapa de códigos de color desde CODIGOS.MDB
  const [codigosMap, setCodigosMap] = useState<Record<string, { descripcion: string; zn_us: string; color: string }> | undefined>(undefined)

  // Cargar base de datos de clientes reales de Supabase en caliente
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'CLIENTES')
          .limit(1)
        if (data && data.length > 0) {
          const rawJson = data[0].nombre_abonado
          if (rawJson) {
            const map = JSON.parse(rawJson)
            setClientesMap(map)
            console.log(`[SUPABASE DASHBOARD] ${Object.keys(map).length} clientes cargados para el visor lateral.`)
          }
        }
      } catch (err) {
        console.warn('[SUPABASE DASHBOARD] Error cargando clientes, usando fallback.')
      }
    }
    fetchClientes()
  }, [])

  // Cargar mapa de códigos de color de CODIGOS.MDB
  useEffect(() => {
    const fetchCodigos = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'CODIGOS')
          .limit(1)
        if (data && data.length > 0) {
          const rawJson = data[0].nombre_abonado
          if (rawJson) {
            const map = JSON.parse(rawJson)
            setCodigosMap(map)
            console.log(`[SUPABASE DASHBOARD] ${Object.keys(map).length} codigos de color cargados desde CODIGOS.MDB.`)
          }
        }
      } catch (err) {
        console.warn('[SUPABASE DASHBOARD] Error cargando codigos de color.')
      }
    }
    fetchCodigos()
  }, [])

  // Reloj digital inferior igual a Scorpion
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const fechaStr = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const horaStr = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
      setHoraLocal(`${fechaStr} ${horaStr}`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Fetch inicial ordenado por ID (para evitar problemas de desfase de hora de red)
  const fetchEventos = useCallback(async () => {
    try {
      let query = supabase
        .from('eventos_monitoreo')
        .select('*')
        .not('cuenta', 'in', '(CLIENTES,CODIGOS,ZONAS)')
        .order('id', { ascending: false })
        .limit(50)

      if (busqueda.trim()) {
        query = query.or(`cuenta.ilike.%${busqueda}%,nombre_abonado.ilike.%${busqueda}%`)
      }

      const { data } = await query
      if (data) {
        const ordenados = data.reverse()
        setEventos(ordenados)
        // Seleccionar por defecto el evento más reciente de la lista al cargar
        if (ordenados.length > 0 && !eventoSeleccionado) {
          setEventoSeleccionado(ordenados[ordenados.length - 1])
        }
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }, [busqueda, eventoSeleccionado])

  useEffect(() => { fetchEventos() }, [fetchEventos])

  // Polling cada 3 segundos
  useEffect(() => {
    let latestId = 0
    const poll = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .not('cuenta', 'in', '(CLIENTES,CODIGOS,ZONAS)')
          .order('id', { ascending: false })
          .limit(50)

        if (!data || data.length === 0) return
        const maxId = data[0].id as number
        if (maxId <= latestId) return

        latestId = maxId
        const filtered = busqueda.trim()
          ? data.filter(e =>
              e.cuenta?.toLowerCase().includes(busqueda.toLowerCase()) ||
              e.nombre_abonado?.toLowerCase().includes(busqueda.toLowerCase())
            )
          : data

        const ordenados = [...filtered].reverse()
        setEventos(ordenados)
        
        // Auto-seleccionar el evento que va llegando si no hay selección manual activa
        if (ordenados.length > 0) {
          setEventoSeleccionado(ordenados[ordenados.length - 1])
        }
      } catch (_) {}
    }
    poll()
    const timer = setInterval(poll, 3000)
    return () => clearInterval(timer)
  }, [busqueda])

  // WebSocket instantáneo
  useEffect(() => {
    const channel = supabase
      .channel('eventos-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos_monitoreo' }, (payload) => {
        const newEvent = payload.new as EventoMonitoreo
        // Ignorar filas especiales de sincronización
        const cuentasEspeciales = ['CLIENTES', 'CODIGOS', 'ZONAS']
        if (cuentasEspeciales.includes((newEvent.cuenta || '').toUpperCase().trim())) return
        setEventos((prev) => {
          if (prev.some(e => e.id === newEvent.id)) return prev
          const next = [...prev, newEvent]
          if (next.length > 50) next.shift()
          return next
        })
        setEventoSeleccionado(newEvent)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Extraer datos del abonado activo para poblar las tarjetas derechas
  const activeEvent = eventoSeleccionado || (eventos.length > 0 ? eventos[eventos.length - 1] : null)
  const cuentaKey = activeEvent ? activeEvent.cuenta.toUpperCase().trim() : ''
  const clienteDb = cuentaKey ? (clientesMap[cuentaKey] || null) : null
  const clientData = activeEvent ? obtenerDatosAbonado(activeEvent.cuenta, activeEvent.nombre_abonado, clienteDb) : null

  return (
    <div className="h-[100dvh] flex flex-col bg-[#070b13] text-slate-100 overflow-hidden select-none relative" style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}>
      
      {/* Top Bar Navy Bevel Style */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 py-1.5 bg-[#0f172a] border-b border-[#1e293b] shrink-0 shadow-md gap-2 sm:gap-0 z-10">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-blue-400 font-bold text-xs tracking-widest">GAMA SEGURIDAD</div>
          <div className="hidden sm:block h-3.5 w-px bg-[#1e293b]" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Command Center v2.0</span>
        </div>
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4 text-[10px] w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
            <span className="text-green-400 font-bold text-[10px] tracking-wider">LIVE</span>
          </div>
          <span className="text-slate-500 font-mono">BUFFER: {eventos.length}/50</span>
          <input
            type="text"
            placeholder="Buscar abonado/cuenta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-48 bg-black border border-[#1e293b] rounded-sm px-2 py-0.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
          />
        </div>
      </header>

      {/* Contenedor Principal: Izquierda (Tabla), Derecha (Widgets de Scorpion) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Lado Izquierdo: Tabla de Eventos (Ocupa 100% en móvil y 845px fijos en PC) */}
        <div className="w-full md:w-[845px] md:shrink-0 border-r border-[#1e293b] flex flex-col h-full bg-[#070b13] overflow-hidden">
          <EventGrid
            eventos={eventos}
            onEventClick={(e) => setEventoSeleccionado(e)}
            codigosMap={codigosMap}
          />
        </div>

        {/* Lado Derecho: Réplica Panel Scorpion (Oculto en móvil, visible en PC) */}
        <div className="hidden md:flex flex-1 flex-col bg-[#c0c0c0] text-black overflow-y-auto border-l border-white p-2 gap-2 select-text">
          
          {/* Fila 1: Logo GAMA / SCORPION + Estado en Negro */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {/* Box Izquierdo GAMA */}
            <div className="bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 p-2 flex items-center justify-center">
              <span className="text-[#0a1a5c] font-black text-3xl tracking-wider" style={{ fontFamily: 'sans-serif' }}>GAMA</span>
            </div>
            {/* Box Derecho SCORPION */}
            <div className="bg-[#000080] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 p-2 flex flex-col items-center justify-center text-white">
              <span className="font-bold text-sm tracking-wide" style={{ fontFamily: 'sans-serif' }}>SCORPION</span>
              <span className="text-[9px] opacity-75">monitoring software</span>
            </div>
          </div>

          {/* Visor de Señal Activa (Negro) */}
          <div className="bg-black border-2 border-t-gray-600 border-l-gray-600 border-b-white border-r-white p-2 font-mono text-green-400 text-xs shrink-0 space-y-1">
            <div className="flex justify-between font-bold text-sm border-b border-green-900 pb-1">
              <span>CTA: {activeEvent?.cuenta || '-----'}</span>
              <span>GRP: 01</span>
              <span>ZN: {activeEvent?.zona || '--'}</span>
              <span>US: {activeEvent?.usuario || '---'}</span>
            </div>
            {/* Barra de progreso de señal verde */}
            <div className="w-full bg-green-950 h-2.5 rounded-sm overflow-hidden my-1 flex gap-0.5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="flex-1 bg-green-400 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
            <div className="text-[10px] text-green-500/80 truncate text-center">
              RAW: 5051 18{activeEvent?.cuenta || 'C000'}E{activeEvent?.zona || '000'}01{activeEvent?.usuario || '000'}
            </div>
          </div>

          {/* Box 2: INFORMACION BASICA */}
          <div className="bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex flex-col">
            <div className="bg-[#000080] text-white text-[11px] font-bold px-2 py-0.5 tracking-wider uppercase">
              Informacion Basica
            </div>
            <div className="p-2 space-y-1 text-xs">
              <div className="grid grid-cols-4 gap-1">
                <span className="font-bold text-gray-700">Abonado:</span>
                <span className="col-span-3 bg-white px-1 border border-gray-400 font-bold">{activeEvent?.cuenta || '---'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-bold text-gray-700">Nombre:</span>
                <span className="col-span-3 bg-white px-1 border border-gray-400 font-bold truncate">{activeEvent?.nombre_abonado || '---'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-bold text-gray-700">Dirección:</span>
                <span className="col-span-3 bg-white px-1 border border-gray-400 font-bold truncate">{clientData?.direccion || '---'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-bold text-gray-700">Comuna:</span>
                <span className="col-span-3 bg-white px-1 border border-gray-400 font-bold">{clientData?.comuna || '---'}</span>
              </div>
            </div>
          </div>

          {/* Box 3: PERSONAS AUTORIZADAS */}
          <div className="bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex flex-col flex-1 min-h-[120px]">
            <div className="bg-[#000080] text-white text-[11px] font-bold px-2 py-0.5 tracking-wider uppercase">
              Personas Autorizadas
            </div>
            <div className="p-1 flex-1 overflow-y-auto">
              <table className="w-full border-collapse text-[10px] text-left bg-white">
                <thead>
                  <tr className="bg-[#d0d0d0] border-b border-gray-400">
                    <th className="p-1 font-bold border-r border-gray-400 w-8 text-center">PR</th>
                    <th className="p-1 font-bold border-r border-gray-400">Nombre</th>
                    <th className="p-1 font-bold">Teléfono</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {clientData?.contactos.map((contact) => (
                    <tr key={contact.prioridad} className="hover:bg-blue-100 font-bold text-gray-800">
                      <td className="p-1 text-center border-r border-gray-300">{contact.prioridad}</td>
                      <td className="p-1 border-r border-gray-300 truncate max-w-[120px]">{contact.nombre}</td>
                      <td className="p-1 font-mono text-blue-800">{contact.telefono}</td>
                    </tr>
                  ))}
                  {!clientData && (
                    <tr>
                      <td colSpan={3} className="p-2 text-center text-gray-400">Seleccione un abonado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Box 4: ZONIFICACION */}
          <div className="bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex flex-col flex-1 min-h-[120px]">
            <div className="bg-[#000080] text-white text-[11px] font-bold px-2 py-0.5 tracking-wider uppercase">
              Zonificacion
            </div>
            <div className="p-1 flex-1 overflow-y-auto">
              <table className="w-full border-collapse text-[10px] text-left bg-white">
                <thead>
                  <tr className="bg-[#d0d0d0] border-b border-gray-400">
                    <th className="p-1 font-bold border-r border-gray-400 w-8 text-center">ZN</th>
                    <th className="p-1 font-bold border-r border-gray-400">Descripción del Sector</th>
                    <th className="p-1 font-bold w-10 text-center">CID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {clientData?.zonas.map((zone) => (
                    <tr key={zone.numero} className="hover:bg-blue-100 font-bold text-gray-800">
                      <td className="p-1 text-center border-r border-gray-300 text-yellow-700">{zone.numero}</td>
                      <td className="p-1 border-r border-gray-300 truncate max-w-[150px]">{zone.descripcion}</td>
                      <td className="p-1 text-center font-mono text-gray-500">{zone.codigoCID}</td>
                    </tr>
                  ))}
                  {!clientData && (
                    <tr>
                      <td colSpan={3} className="p-2 text-center text-gray-400">Seleccione un abonado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botón de verificación de video inferior */}
          <button className="w-full bg-[#d0d0d0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-1.5 text-xs text-gray-800 font-bold hover:bg-[#e0e0e0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none">
            🎥 Activar verificación por video
          </button>

          {/* Reloj y Fecha inferior de Scorpion */}
          <div className="flex justify-between items-center bg-[#d0d0d0] border border-gray-400 px-2 py-0.5 text-[10px] font-mono text-gray-700">
            <span>Operador: MASTER SCORPION</span>
            <span className="font-bold">{horaLocal}</span>
          </div>

        </div>
      </div>

      {/* Tool Modals */}
      {modalActivo && modalActivo !== 'bar-chart' && modalActivo !== 'checklist' && (
        <ToolModal
          modalId={modalActivo}
          onClose={() => setModalActivo(null)}
        />
      )}

      {/* Expediente Modal (Controlado por el botón de libros: 'bar-chart') */}
      {modalActivo === 'bar-chart' && activeEvent && (
        <ExpedienteModal
          evento={activeEvent}
          onClose={() => setModalActivo(null)}
        />
      )}

      {/* Eventos Por Usuario Modal (Controlado por el botón checklist: 'checklist') */}
      {modalActivo === 'checklist' && (
        <EventosPorUsuarioModal
          eventoInicial={activeEvent || undefined}
          onClose={() => setModalActivo(null)}
        />
      )}

      {/* Zonificación Modal (Controlado por el botón Árbol de Coberturas: 'zones-tree') */}
      {modalActivo === 'zones-tree' && (
        <ZonificacionModal
          eventoInicial={activeEvent || undefined}
          onClose={() => setModalActivo(null)}
        />
      )}

      {/* Footer */}
      <FooterActions onModalOpen={setModalActivo} />
    </div>
  )
}
