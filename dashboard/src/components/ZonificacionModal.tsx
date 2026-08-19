'use client'

import { useEffect, useRef, useState } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

import clientesDataRaw from '@/lib/clientes_general.json'
const clientesFallback = clientesDataRaw as Record<string, Record<string, string>>

interface ZonificacionModalProps {
  onClose: () => void
  eventoInicial?: EventoMonitoreo
  usuarioRol?: string
}

interface Zona {
  numero: string
  dispositivo: string
  area: string
}

export default function ZonificacionModal({ onClose, eventoInicial, usuarioRol }: ZonificacionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  const esAdmin = usuarioRol === 'Administrador'

  const [cuentaActiva, setCuentaActiva] = useState(
    eventoInicial?.cuenta?.toUpperCase().trim() || ''
  )
  const [buscarInput, setBuscarInput] = useState('')
  const [clientesMap, setClientesMap] = useState<Record<string, Record<string, string>>>(clientesFallback)
  const [zonasMap, setZonasMap] = useState<Record<string, Zona[]>>({})
  const [zonaSeleccionada, setZonaSeleccionada] = useState<Zona | null>(null)
  const [zonaEnEdicion, setZonaEnEdicion] = useState<Zona | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensajeError, setMensajeError] = useState('')
  const [loading, setLoading] = useState(true)

  // Cargar clientes y zonas desde Supabase al iniciar
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. Cargar clientes
        const { data: dataClientes } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'CLIENTES')
          .limit(1)
        if (dataClientes && dataClientes.length > 0) {
          const map = JSON.parse(dataClientes[0].nombre_abonado)
          setClientesMap(map)
        }

        // 2. Cargar zonas (preferir la fila válida de sincronización v3.5)
        const { data: dataZonas } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'ZONAS')
          .order('id', { ascending: false })
          .limit(6)
        if (dataZonas && dataZonas.length > 0) {
          const filaValida = dataZonas.find(r => r.evento === 'SINCRONIZACION ZONAS MDB' || r.evento === 'CONFIGURACION_ZONAS') || dataZonas[0]
          if (filaValida?.nombre_abonado) {
            const mz = JSON.parse(filaValida.nombre_abonado)
            setZonasMap(mz)
          }
        }
      } catch (err) {
        console.warn('[ZONIFICACION] Error de red, usando datos locales.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => { modalRef.current?.focus() }, [])

  // Lista de abonados para el panel izquierdo
  const listaAbonados = Object.values(clientesMap)
    .map(c => ({
      cuenta: (c.cuenta || '').toUpperCase().trim(),
      nombre: (c.nombre || '').toUpperCase().trim()
    }))
    .sort((a, b) => a.cuenta.localeCompare(b.cuenta))

  const listaFiltrada = buscarInput.trim()
    ? listaAbonados.filter(a =>
        a.cuenta.toLowerCase().includes(buscarInput.toLowerCase()) ||
        a.nombre.toLowerCase().includes(buscarInput.toLowerCase())
      )
    : listaAbonados

  // Zonas del abonado activo (lookup estricto validado por clave y nombre de cliente)
  const zonasAbonado: Zona[] = (() => {
    const k = (cuentaActiva || '').toUpperCase().trim()
    if (!k) return []

    // 1. Coincidencia exacta por clave de cuenta
    if (zonasMap[k]) {
      const v = zonasMap[k]
      return Array.isArray(v) ? v : [v as any]
    }

    const nombreActivo = (clientesMap[k]?.nombre || '').toUpperCase().trim()
    const last2 = k.slice(-2)
    const last3 = k.slice(-3)

    // 2. Variaciones directas comprobadas
    const candidatas = [
      'C' + k,
      k.startsWith('0') ? 'C7' + last2 : '',
      k.startsWith('0') ? 'C7' + last3 : '',
      k.startsWith('C7') ? '0' + last3 : '',
      k.replace(/^C/, '0'),
      k.replace(/^0+/, ''),
    ].filter(Boolean)

    for (const c of candidatas) {
      if (c && zonasMap[c]) {
        const nombreCandidata = (clientesMap[c]?.nombre || '').toUpperCase().trim()
        // Validar coincidencia de cliente para evitar falsos positivos
        if (
          !nombreActivo ||
          !nombreCandidata ||
          nombreActivo === nombreCandidata ||
          nombreActivo.includes(nombreCandidata) ||
          nombreCandidata.includes(nombreActivo) ||
          c === k
        ) {
          const v = zonasMap[c]
          return Array.isArray(v) ? v : [v as any]
        }
      }
    }

    // 3. Coincidencia estricta por Nombre de Abonado (evita asociar cuentas distintas con números similares)
    if (nombreActivo && nombreActivo.length > 3) {
      for (const [clave, valor] of Object.entries(zonasMap)) {
        const nombreClave = (clientesMap[clave]?.nombre || '').toUpperCase().trim()
        if (
          nombreClave &&
          (nombreActivo === nombreClave ||
            (nombreActivo.length > 5 && nombreClave.length > 5 && (nombreActivo.includes(nombreClave) || nombreClave.includes(nombreActivo))))
        ) {
          const v = Array.isArray(valor) ? valor : [valor as any]
          return v
        }
      }
    }

    return []
  })()

  // Datos del cliente activo
  const clienteActivo = clientesMap[cuentaActiva] || { cuenta: cuentaActiva, nombre: '' }

  const handleSeleccionarCuenta = (cuenta: string) => {
    setCuentaActiva(cuenta)
    setZonaSeleccionada(null)
    setZonaEnEdicion(null)
    setBuscarInput('')
    setMensajeError('')
  }

  const handleSeleccionarZona = (zona: Zona) => {
    setZonaSeleccionada(zona)
    setZonaEnEdicion(null)
    setMensajeError('')
  }

  // Persistir zonificación del abonado activo en la fila especial ZONAS (mismo patrón que CLIENTES)
  const persistirZonas = async (nuevasZonas: Zona[]) => {
    if (!cuentaActiva) { setMensajeError('No hay cuenta activa seleccionada.'); return }
    setGuardando(true)
    setMensajeError('')
    try {
      const nuevoMap: Record<string, Zona[]> = { ...zonasMap, [cuentaActiva]: nuevasZonas }
      const { error } = await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'ZONAS',
          nombre_abonado: JSON.stringify(nuevoMap),
          evento: 'CONFIGURACION_ZONAS',
          fecha_hora: new Date().toISOString()
        })
      if (error) throw error
      setZonasMap(nuevoMap)
      setZonaEnEdicion(null)
      if (nuevasZonas.length > 0) setZonaSeleccionada(nuevasZonas[nuevasZonas.length - 1])
    } catch (err: any) {
      setMensajeError('Error al guardar: ' + (err?.message || 'desconocido'))
    } finally {
      setGuardando(false)
    }
  }

  const handleAgregar = () => {
    if (!esAdmin) { setMensajeError('Acción denegada: solo Administrador puede editar la zonificación.'); return }
    setZonaEnEdicion({ numero: '', dispositivo: '', area: '' })
    setMensajeError('')
  }

  const handleEditar = () => {
    if (!esAdmin) { setMensajeError('Acción denegada: solo Administrador puede editar la zonificación.'); return }
    if (!zonaSeleccionada) { setMensajeError('Seleccione una zona para editar.'); return }
    setZonaEnEdicion({ ...zonaSeleccionada })
    setMensajeError('')
  }

  const handleBorrar = () => {
    if (!esAdmin) { setMensajeError('Acción denegada: solo Administrador puede editar la zonificación.'); return }
    if (!zonaSeleccionada) { setMensajeError('Seleccione una zona para borrar.'); return }
    if (!window.confirm(`¿Eliminar la zona ${zonaSeleccionada.numero} (${zonaSeleccionada.area || 'sin área'})?`)) return
    persistirZonas(zonasAbonado.filter(z => z.numero !== zonaSeleccionada.numero))
    setZonaSeleccionada(null)
  }

  const handleGuardarEdicion = () => {
    if (!zonaEnEdicion) return
    if (!zonaEnEdicion.numero.trim()) { setMensajeError('La zona debe tener número.'); return }
    const existente = zonasAbonado.find(z => z.numero === zonaEnEdicion.numero)
    const nuevas = existente
      ? zonasAbonado.map(z => (z.numero === existente.numero ? zonaEnEdicion : z))
      : [...zonasAbonado, zonaEnEdicion]
    persistirZonas(nuevas)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-mono p-2 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full md:w-[900px] h-[92vh] md:h-[540px] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1 shadow-[4px_4px_12px_rgba(0,0,0,0.6)] focus:outline-none flex flex-col select-none"
        style={{ fontSize: '11px' }}
      >
        {/* Barra de Título */}
        <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center select-none shrink-0 h-6">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🗺️</span>
            <span className="text-[11px] tracking-wide">Scorpion Monitoring Software - Zonificación de Sistemas</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center text-[9px] pb-0.5 cursor-pointer"
          >
            r
          </button>
        </div>

        {/* CUERPO PRINCIPAL */}
        <div className="flex-1 p-1.5 flex flex-col md:flex-row gap-2 overflow-hidden">

          {/* PANEL IZQUIERDO: Lista de abonados */}
          <div className="w-full md:w-[200px] flex flex-col shrink-0 gap-1.5 min-h-[120px] md:min-h-0">
            {/* Campo búsqueda */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-700 text-[10px] w-[40px]">CUENTA:</span>
                <input
                  type="text"
                  value={buscarInput}
                  onChange={(e) => setBuscarInput(e.target.value)}
                  className="flex-1 bg-white border border-t-gray-600 border-l-gray-600 border-b-white border-r-white px-1.5 py-0.5 font-bold text-black text-[11px] focus:outline-none"
                  placeholder="Buscar..."
                />
              </div>
            </div>

            {/* Lista negra estilo Scorpion */}
            <div className="flex-1 bg-black border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto min-h-[80px]">
              {loading ? (
                <div className="p-2 text-green-400 text-[10px] text-center italic animate-pulse">Cargando...</div>
              ) : listaFiltrada.map((item) => (
                <div
                  key={item.cuenta}
                  onClick={() => handleSeleccionarCuenta(item.cuenta)}
                  className={`px-1 py-0.5 text-[10px] font-mono font-bold cursor-pointer select-none truncate ${
                    cuentaActiva === item.cuenta
                      ? 'bg-[#00aa00] text-white'
                      : 'text-green-400 hover:bg-gray-900'
                  }`}
                >
                  {item.cuenta} {item.nombre}
                </div>
              ))}
              {!loading && listaFiltrada.length === 0 && (
                <div className="p-2 text-green-600 text-[9px] text-center italic">Sin resultados</div>
              )}
            </div>
          </div>

          {/* PANEL DERECHO: Zonas del abonado */}
          <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">

            {/* Visor cuenta + nombre en negro/verde */}
            <div className="flex gap-2 items-center shrink-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-700 text-[10px]">CUENTA:</span>
                <div className="w-[65px] h-[22px] bg-black border border-gray-500 flex items-center justify-center font-bold text-green-400 text-xs font-mono">
                  {clienteActivo.cuenta || '-----'}
                </div>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <span className="font-bold text-gray-700 text-[10px]">NOMBRE:</span>
                <div className="flex-1 h-[22px] bg-black border border-gray-500 flex items-center pl-2 font-bold text-green-400 text-[10px] font-mono truncate">
                  {clienteActivo.nombre || '---'}
                </div>
              </div>
            </div>

            {/* Tabla de zonas */}
            <div className="flex-1 border border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white overflow-hidden flex flex-col min-h-[150px] md:min-h-0">
              {/* Cabecera */}
              <div className="grid grid-cols-[50px_1fr_1fr] bg-[#c8c8c8] border-b border-gray-500 font-bold text-[10px] text-gray-800 shrink-0">
                <div className="px-1.5 py-1 border-r border-gray-400 text-center">ZONA Nº</div>
                <div className="px-1.5 py-1 border-r border-gray-400">DISPOSITIVOS</div>
                <div className="px-1.5 py-1">AREA CUBIERTA</div>
              </div>

              {/* Filas de zonas */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-400 italic text-[10px]">Cargando zonas...</div>
                ) : cuentaActiva === '' ? (
                  <div className="p-4 text-center text-gray-400 italic text-[10px]">Seleccione un abonado de la lista</div>
                ) : zonasAbonado.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 italic text-[10px]">No hay zonas registradas para este abonado</div>
                ) : (
                  zonasAbonado.map((zona, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSeleccionarZona(zona)}
                      className={`grid grid-cols-[50px_1fr_1fr] text-[10px] font-mono cursor-pointer border-b border-gray-200 ${
                        zonaSeleccionada?.numero === zona.numero
                          ? 'bg-[#000080] text-white'
                          : idx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-[#f0f8ff] hover:bg-blue-50'
                      }`}
                    >
                      <div className="px-1.5 py-0.5 border-r border-gray-300 text-center font-bold">
                        {zona.numero}
                      </div>
                      <div className="px-1.5 py-0.5 border-r border-gray-300 truncate capitalize">
                        {zona.dispositivo.toLowerCase()}
                      </div>
                      <div className="px-1.5 py-0.5 truncate capitalize">
                        {zona.area.toLowerCase()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel inferior: visor zona individual + botones */}
            <div className="shrink-0 flex flex-col md:flex-row gap-2 h-auto md:h-[100px]">

              {/* Visor zona seleccionada */}
              <div className="flex-1 border border-gray-400 p-1.5 relative bg-[#d4d0c8] flex flex-col gap-1">
                <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700">ZONA</div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-gray-700 w-[45px] shrink-0">Zona Nº:</span>
                    <input
                      type="text"
                      readOnly={!zonaEnEdicion}
                      value={zonaEnEdicion?.numero ?? zonaSeleccionada?.numero ?? ''}
                      onChange={(e) => setZonaEnEdicion(prev => prev ? { ...prev, numero: e.target.value } : prev)}
                      className="w-[40px] bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 font-bold text-center text-gray-800 text-[10px] focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-gray-700 w-[60px] shrink-0">Total Zonas:</span>
                    <input
                      type="text"
                      readOnly
                      value={zonasAbonado.length > 0 ? zonasAbonado.length.toString() : ''}
                      className="w-[35px] bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 font-bold text-center text-gray-800 text-[10px]"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="font-bold text-gray-700 w-[60px] shrink-0">Dispositivo:</span>
                    <input
                      type="text"
                      readOnly={!zonaEnEdicion}
                      value={zonaEnEdicion?.dispositivo ?? zonaSeleccionada?.dispositivo ?? ''}
                      onChange={(e) => setZonaEnEdicion(prev => prev ? { ...prev, dispositivo: e.target.value } : prev)}
                      className="flex-1 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800 text-[10px] truncate focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="font-bold text-gray-700 w-[60px] shrink-0">Area cubierta:</span>
                    <input
                      type="text"
                      readOnly={!zonaEnEdicion}
                      value={zonaEnEdicion?.area ?? zonaSeleccionada?.area ?? ''}
                      onChange={(e) => setZonaEnEdicion(prev => prev ? { ...prev, area: e.target.value } : prev)}
                      className="flex-1 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800 text-[10px] truncate focus:outline-none"
                    />
                  </div>
                </div>
                {mensajeError && (
                  <div className="text-red-700 font-bold text-[9px] mt-1">{mensajeError}</div>
                )}
              </div>

              {/* Botones (solo lectura - igual que Scorpion pero deshabilitados) */}
              <div className="w-full md:w-[90px] flex flex-row md:flex-col justify-end gap-1 shrink-0">
                {zonaEnEdicion ? (
                  <button
                    onClick={handleGuardarEdicion}
                    disabled={guardando}
                    className="flex-1 md:flex-none h-7 md:h-auto px-2 py-1 bg-[#d4d0c8] border-2 font-bold text-[10px] select-none border-t-white border-l-white border-b-gray-700 border-r-gray-700 cursor-pointer hover:bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white text-gray-800 disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAgregar}
                      className="flex-1 md:flex-none h-7 md:h-auto px-2 py-1 bg-[#d4d0c8] border-2 font-bold text-[10px] select-none border-t-white border-l-white border-b-gray-700 border-r-gray-700 cursor-pointer hover:bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white text-gray-800"
                    >
                      Agregar
                    </button>
                    <button
                      onClick={handleEditar}
                      className="flex-1 md:flex-none h-7 md:h-auto px-2 py-1 bg-[#d4d0c8] border-2 font-bold text-[10px] select-none border-t-white border-l-white border-b-gray-700 border-r-gray-700 cursor-pointer hover:bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white text-gray-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={handleBorrar}
                      className="flex-1 md:flex-none h-7 md:h-auto px-2 py-1 bg-[#d4d0c8] border-2 font-bold text-[10px] select-none border-t-white border-l-white border-b-gray-700 border-r-gray-700 cursor-pointer hover:bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white text-gray-800"
                    >
                      Borrar
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 md:flex-none h-7 md:h-auto px-2 py-1 bg-[#d4d0c8] border-2 font-bold text-[10px] select-none border-t-white border-l-white border-b-gray-700 border-r-gray-700 cursor-pointer hover:bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white text-gray-800"
                >
                  Salir
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
