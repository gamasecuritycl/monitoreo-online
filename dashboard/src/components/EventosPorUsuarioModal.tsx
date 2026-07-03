'use client'

import { useEffect, useRef, useState } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// Base de datos de fallback de clientes
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesGeneralFallback = clientesDataRaw as Record<string, Record<string, string>>

interface EventosPorUsuarioModalProps {
  onClose: () => void
  eventoInicial?: EventoMonitoreo
}

export default function EventosPorUsuarioModal({ onClose, eventoInicial }: EventosPorUsuarioModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Cuenta seleccionada activa
  const [cuentaActiva, setCuentaActiva] = useState(eventoInicial?.cuenta.toUpperCase().trim() || 'C735')
  const [buscarNombreInput, setBuscarNombreInput] = useState('')
  
  // Base de datos de clientes para la búsqueda
  const [clientesMap, setClientesMap] = useState<Record<string, Record<string, string>>>(clientesGeneralFallback)
  
  // Lista de días disponibles para el abonado activo
  const [diasDisponibles, setDiasDisponibles] = useState<string[]>([])
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>('')
  
  // Historial de eventos filtrados para el abonado activo y día seleccionado
  const [todosEventosAbonado, setTodosEventosAbonado] = useState<EventoMonitoreo[]>([])
  const [eventosMostrados, setEventosMostrados] = useState<EventoMonitoreo[]>([])
  const [loading, setLoading] = useState(false)

  // 1. Cargar la base de datos de clientes desde Supabase en la inicialización
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'CLIENTES')
          .limit(1)
        
        if (data && data.length > 0 && !error) {
          const rawJson = data[0].nombre_abonado
          if (rawJson) {
            const map = JSON.parse(rawJson)
            setClientesMap(map)
          }
        }
      } catch (err) {
        console.warn('[EVENTOS USUARIO] Fallo de red, usando fallback local.')
      }
    }
    fetchClientes()
  }, [])

  // 2. Cada vez que cambia la cuentaActiva, descargar sus eventos históricos y calcular días disponibles
  useEffect(() => {
    const fetchHistoricoAbonado = async () => {
      if (!cuentaActiva) return
      setLoading(true)
      try {
        // Consultar los últimos 1000 eventos de esta cuenta en Supabase
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', cuentaActiva)
          .order('fecha_hora', { ascending: false })
          .limit(1000)

        if (data && !error) {
          setTodosEventosAbonado(data)
          
          // Agrupar fechas únicas en formato YYYY-MM-DD
          const diasSet = new Set<string>()
          data.forEach((ev: EventoMonitoreo) => {
            if (ev.fecha_hora) {
              const fechaSolo = ev.fecha_hora.split('T')[0]
              diasSet.add(fechaSolo)
            }
          })
          
          const listaDias = Array.from(diasSet).sort((a, b) => b.localeCompare(a)) // Orden descendente
          setDiasDisponibles(listaDias)
          
          // Seleccionar por defecto el día más reciente
          if (listaDias.length > 0) {
            setDiaSeleccionado(listaDias[0])
          } else {
            setDiaSeleccionado('')
            setEventosMostrados([])
          }
        }
      } catch (err) {
        console.error('[EVENTOS USUARIO] Error leyendo histórico:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistoricoAbonado()
  }, [cuentaActiva])

  // 3. Filtrar eventos del abonado según el día seleccionado
  useEffect(() => {
    if (!diaSeleccionado) {
      setEventosMostrados([])
      return
    }
    const filtrados = todosEventosAbonado.filter(ev => {
      return ev.fecha_hora && ev.fecha_hora.startsWith(diaSeleccionado)
    })
    const ordenAsc = [...filtrados].sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
    setEventosMostrados(ordenAsc)
  }, [diaSeleccionado, todosEventosAbonado])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    modalRef.current?.focus()
  }, [])

  // Buscar cliente activo en la base de datos
  const clienteActivo = clientesMap[cuentaActiva] || clientesGeneralFallback[cuentaActiva] || {
    cuenta: cuentaActiva,
    nombre: eventoInicial?.nombre_abonado || 'SIN NOMBRE REGISTRADO'
  }

  // Lista de clientes filtrada para el buscador lateral
  const listaClientesBusqueda = Object.values(clientesMap).map(c => ({
    cuenta: (c.cuenta || '').toUpperCase().trim(),
    nombre: (c.nombre || '').toUpperCase().trim()
  })).sort((a, b) => a.cuenta.localeCompare(b.cuenta))

  const listaClientesFiltrada = buscarNombreInput.trim()
    ? listaClientesBusqueda.filter(c => 
        c.cuenta.toLowerCase().includes(buscarNombreInput.toLowerCase()) ||
        c.nombre.toLowerCase().includes(buscarNombreInput.toLowerCase())
      )
    : listaClientesBusqueda.slice(0, 100)

  const getHoraSolo = (iso: string): string => {
    try {
      const d = new Date(iso)
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
    } catch {
      const partes = iso.split('T')
      if (partes.length === 2) {
        return partes[1].substring(0, 8)
      }
      return iso
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-mono p-2 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* 
        VENTANA RETRO PIXEL-PERFECT COMPACTA E INTELIGENTE
        PC: Ancho 950px, Alto 520px fijos.
        Móvil: Stacking vertical y scroll fluido de formulario para visualización óptima en celulares.
      */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full md:w-[950px] h-[92vh] md:h-[520px] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1 shadow-[4px_4px_12px_rgba(0,0,0,0.6)] focus:outline-none flex flex-col justify-between select-none"
        style={{ fontSize: '11px' }}
      >
        {/* Barra de Título */}
        <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center select-none shrink-0 h-6">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">📋</span>
            <span className="text-[11px] tracking-wide">Scorpion - Ultimos Eventos por Usuario</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center text-[9px] pb-0.5 cursor-pointer"
          >
            r
          </button>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="flex-1 p-2 flex flex-col gap-2.5 overflow-y-auto md:overflow-hidden">
          
          {/* CABECERA: TÍTULO EN AZUL + VISORES NEGROS */}
          <div className="h-auto md:h-14 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 bg-[#d4d0c8] border-b border-gray-400 pb-1.5 gap-2 md:gap-0">
            <div className="text-[#000080] font-black text-[18px] md:text-[22px] italic tracking-widest pl-1 uppercase">
              EVENTOS POR USUARIO
            </div>
            
            {/* Visores Negros con Letras Verdes */}
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[9px] text-gray-700">CUENTA:</span>
                <div className="w-[60px] sm:w-[70px] h-6 bg-black border border-gray-500 flex items-center justify-center font-bold text-green-400 text-xs font-mono">
                  {clienteActivo.cuenta || '-----'}
                </div>
              </div>
              <div className="flex-1 md:flex-none flex items-center gap-1">
                <span className="font-bold text-[9px] text-gray-700">NOMBRE:</span>
                <div className="w-full md:w-[320px] h-6 bg-black border border-gray-500 flex items-center pl-2 font-bold text-green-400 text-[10px] font-mono truncate">
                  {clienteActivo.nombre || '----------------------------------------'}
                </div>
              </div>
            </div>
          </div>

          {/* CUERPO CENTRAL (Eventos + Días + Buscador) */}
          <div className="flex-1 flex flex-col md:flex-row gap-2.5 overflow-y-auto md:overflow-hidden">
            
            {/* Lado Izquierdo: Grilla de Eventos (PC: w-[520px]) */}
            <div className="w-full md:w-[520px] flex flex-col shrink-0 overflow-hidden border border-gray-500 bg-white min-h-[200px] md:min-h-0">
              <div className="bg-[#b0b0b0] text-black text-center font-bold py-1 border-b border-gray-500 uppercase tracking-wider text-[10px]">
                DIA: {diaSeleccionado || '------'}
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse text-[10px] text-left">
                  <thead>
                    <tr className="bg-[#e0e0e0] border-b border-gray-400 font-bold sticky top-0 text-gray-700">
                      <th className="p-1 border-r border-gray-400 w-[65px] text-center">HORA</th>
                      <th className="p-1 border-r border-gray-400">EVENTO</th>
                      <th className="p-1 border-r border-gray-400 w-[35px] text-center">PAR</th>
                      <th className="p-1 border-r border-gray-400 w-[35px] text-center">ZN</th>
                      <th className="p-1 w-[35px] text-center">US</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 font-mono text-black">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500 italic">Cargando eventos...</td>
                      </tr>
                    ) : eventosMostrados.map((ev, idx) => (
                      <tr key={idx} className="hover:bg-blue-100 h-5 font-bold">
                        <td className="p-1 border-r border-gray-300 text-center text-blue-900">{getHoraSolo(ev.fecha_hora)}</td>
                        <td className="p-1 border-r border-gray-300 truncate max-w-[150px] sm:max-w-[250px] uppercase">{ev.evento}</td>
                        <td className="p-1 border-r border-gray-300 text-center text-gray-600">01</td>
                        <td className="p-1 border-r border-gray-300 text-center text-red-600">{ev.zona && ev.zona !== 'None' ? ev.zona.padStart(2, '0') : '00'}</td>
                        <td className="p-1 text-center text-green-700">{ev.usuario && ev.usuario !== 'None' ? ev.usuario.padStart(2, '0') : '00'}</td>
                      </tr>
                    ))}
                    {!loading && eventosMostrados.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-400 italic">Sin actividad</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Centro: Selector de Día (PC: w-[120px], Móvil: Adaptable) */}
            <div className="w-full md:w-[120px] flex flex-col shrink-0 bg-[#d4d0c8] min-h-[90px] md:min-h-0">
              <div className="text-[10px] font-bold text-gray-700 mb-1">
                Seleccione Dia:
              </div>
              <div className="flex-1 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto max-h-[100px] md:max-h-none">
                {diasDisponibles.map((dia) => (
                  <div
                    key={dia}
                    onClick={() => setDiaSeleccionado(dia)}
                    className={`px-1.5 py-1 text-[10px] font-bold font-mono cursor-pointer border-b border-gray-200 select-none ${
                      diaSeleccionado === dia ? 'bg-[#000080] text-white' : 'hover:bg-gray-100 text-black'
                    }`}
                  >
                    📅 {dia}
                  </div>
                ))}
                {diasDisponibles.length === 0 && (
                  <div className="p-2 text-center text-gray-400 italic text-[9px]">Sin fechas</div>
                )}
              </div>
            </div>

            {/* Lado Derecho: Buscar Usuario */}
            <div className="flex-1 border border-gray-400 p-2 relative bg-[#d4d0c8] flex flex-col gap-1.5 shrink-0 min-h-[140px] md:min-h-0">
              <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[9px] font-bold text-gray-700 uppercase">
                BUSCAR USUARIO
              </div>

              <div className="grid grid-cols-4 gap-1 items-center mt-1">
                <span className="font-bold text-gray-700 text-[10px]">NOMBRE:</span>
                <input
                  type="text"
                  value={buscarNombreInput}
                  onChange={(e) => setBuscarNombreInput(e.target.value)}
                  className="col-span-3 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-black text-[11px]"
                  placeholder="Buscar..."
                />
              </div>

              <div className="text-[9px] font-bold text-gray-600">Resultados:</div>

              {/* Lista negra de resultados */}
              <div className="flex-1 h-[90px] md:h-auto bg-black border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto font-mono text-[10px]">
                {listaClientesFiltrada.map((item) => (
                  <div
                    key={item.cuenta}
                    onClick={() => {
                      setCuentaActiva(item.cuenta.toUpperCase().trim())
                      setBuscarNombreInput('')
                    }}
                    className={`px-2 py-0.5 cursor-pointer font-bold select-none truncate ${
                      cuentaActiva === item.cuenta ? 'bg-green-600 text-white' : 'text-green-400 hover:bg-gray-900'
                    }`}
                  >
                    {item.cuenta.padEnd(5, ' ')}|{item.nombre}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* PIE DE DIÁLOGO */}
          <div className="h-10 border-t border-gray-400 pt-1.5 flex justify-between items-center shrink-0">
            <div className="border border-gray-400 px-2 py-1 bg-[#e0e0e0] flex items-center gap-1.5">
              <span className="font-bold text-gray-700 text-[9px] sm:text-[10px]">CUENTA:</span>
              <input
                type="text"
                readOnly
                value={cuentaActiva}
                className="w-14 bg-white border border-gray-500 font-bold text-center text-blue-900"
              />
            </div>
            
            <button 
              onClick={onClose}
              className="px-5 py-1 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-800 font-black active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200 text-center"
            >
              CERRAR
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
