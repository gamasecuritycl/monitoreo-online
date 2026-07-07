'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface OrdenTrabajo {
  id: number
  cuenta: string
  nombre_abonado: string
  tecnico: string
  problema: string
  estado: 'Pendiente' | 'En Proceso' | 'Completada'
  novedad: string
  firma: string
  fecha: string
}

interface Props {
  onClose: () => void
  clientesMap?: Record<string, Record<string, string>>
}

const TECNICOS = ['Juan Pérez', 'Diego Reyes', 'Mauricio Tapia', 'Cristian Muñoz']

export default function ServicioTecnicoModal({ onClose, clientesMap = {} }: Props) {
  const [tabActive, setTabActive] = useState<'despacho' | 'tecnico_movil'>('despacho')
  
  // Lista de órdenes
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [cargando, setCargando] = useState(false)

  // Formulario creación
  const [buscarCuenta, setBuscarCuenta] = useState('')
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('')
  const [tecnicoAsignado, setTecnicoAsignado] = useState(TECNICOS[0])
  const [problemaReportado, setProblemaReportado] = useState('')

  // Simulación Técnico Móvil
  const [tecnicoSimulado, setTecnicoSimulado] = useState(TECNICOS[0])
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajo | null>(null)
  
  // Campo novedad de terreno
  const [novedadTexto, setNovedadTexto] = useState('')
  const [firmando, setFirmando] = useState(false)
  const [firmaImagen, setFirmaImagen] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Simulación Test de Señales
  const [senalesRecibidas, setSenalesRecibidas] = useState<string[]>([])
  const [modoPruebaActivo, setModoPruebaActivo] = useState(false)

  // Cargar órdenes desde Supabase (Fila especial cuenta: 'ORDENES_TRABAJO')
  const cargarOrdenes = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .eq('cuenta', 'ORDENES_TRABAJO')
        .limit(1)

      if (data && data.length > 0 && !error) {
        const parsed = JSON.parse(data[0].nombre_abonado || '[]')
        setOrdenes(parsed)
      }
    } catch (err) {
      console.error('Error cargando órdenes:', err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarOrdenes()
  }, [])

  // Guardar/Actualizar todas las órdenes en Supabase
  const guardarOrdenesBase = async (listaNueva: OrdenTrabajo[]) => {
    try {
      await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'ORDENES_TRABAJO',
          nombre_abonado: JSON.stringify(listaNueva),
          evento: 'CONFIGURACION',
          fecha_hora: new Date().toISOString()
        })
      setOrdenes(listaNueva)
    } catch (err) {
      console.error('Error guardando órdenes:', err)
    }
  }

  // Crear una nueva orden
  const handleCrearOrden = () => {
    if (!cuentaSeleccionada) {
      alert('Por favor seleccione una cuenta de abonado.')
      return
    }
    if (!problemaReportado.trim()) {
      alert('Por favor describa el problema o requerimiento.')
      return
    }

    const abonadoInfo = clientesMap[cuentaSeleccionada] || { nombre: 'Abonado Desconocido' }
    
    const nuevaOrden: OrdenTrabajo = {
      id: Date.now(),
      cuenta: cuentaSeleccionada,
      nombre_abonado: abonadoInfo.nombre || 'Abonado Desconocido',
      tecnico: tecnicoAsignado,
      problema: problemaReportado.trim(),
      estado: 'Pendiente',
      novedad: '',
      firma: '',
      fecha: new Date().toISOString().slice(0, 16).replace('T', ' ')
    }

    const listaNueva = [nuevaOrden, ...ordenes]
    guardarOrdenesBase(listaNueva)
    
    // Resetear formulario
    setProblemaReportado('')
    setBuscarCuenta('')
    setCuentaSeleccionada('')
    alert('Orden de trabajo asignada con éxito al técnico.')
  }

  // Eliminar orden
  const handleEliminarOrden = (id: number) => {
    if (confirm('¿Está seguro de eliminar esta orden de trabajo?')) {
      const listaNueva = ordenes.filter(o => o.id !== id)
      guardarOrdenesBase(listaNueva)
    }
  }

  // Inicializar canvas de firma
  useEffect(() => {
    if (tabActive === 'tecnico_movil' && ordenSeleccionada && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000080'
        ctx.lineWidth = 2
      }
    }
  }, [tabActive, ordenSeleccionada])

  // Manejo de firma táctil/mouse
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setFirmando(true)
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!firmando) return
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = () => {
    setFirmando(false)
    if (canvasRef.current) {
      setFirmaImagen(canvasRef.current.toDataURL())
    }
  }

  const clearFirma = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      setFirmaImagen('')
    }
  }

  // Simular señales de prueba del panel
  const simularSenalPanel = () => {
    if (!ordenSeleccionada) return
    const senales = [
      `18:04:12 - Cuenta ${ordenSeleccionada.cuenta} - Test de Transmisión Periódica (E602)`,
      `18:04:18 - Cuenta ${ordenSeleccionada.cuenta} - Apertura por Teclado Usuario 01 (E401)`,
      `18:04:32 - Cuenta ${ordenSeleccionada.cuenta} - Alarma de Robo Zona 04 (E130)`,
      `18:04:45 - Cuenta ${ordenSeleccionada.cuenta} - Restablecimiento de Robo Zona 04 (R130)`
    ]
    const randomSenal = senales[Math.floor(Math.random() * senales.length)]
    setSenalesRecibidas(prev => [randomSenal, ...prev].slice(0, 5))
  }

  // Finalizar Orden y Crear novedad en Bitácora
  const handleFinalizarOrden = async () => {
    if (!ordenSeleccionada) return
    if (!novedadTexto.trim()) {
      alert('Por favor describa la novedad o trabajo realizado en terreno.')
      return
    }

    // 1. Crear registro de novedad en la grilla de eventos generales
    // Esto se inserta como un evento para que el sincronizador y la bitácora lo registren
    try {
      await supabase.from('eventos_monitoreo').insert({
        fecha_hora: new Date().toISOString(),
        cuenta: ordenSeleccionada.cuenta,
        nombre_abonado: ordenSeleccionada.nombre_abonado,
        evento: `SERVICIO TECNICO: ${novedadTexto.trim().toUpperCase()}`,
        zona: 'S/T',
        usuario: 'TEC'
      })

      // 2. Actualizar el estado de la orden en la lista
      const listaNueva = ordenes.map(o => {
        if (o.id === ordenSeleccionada.id) {
          return {
            ...o,
            estado: 'Completada' as const,
            novedad: novedadTexto.trim(),
            firma: firmaImagen
          }
        }
        return o
      })

      await guardarOrdenesBase(listaNueva)
      alert('¡Orden de trabajo completada y novedad registrada con éxito en la Bitácora!')
      
      // Resetear estados de terreno
      setOrdenSeleccionada(null)
      setNovedadTexto('')
      setFirmaImagen('')
      setSenalesRecibidas([])
      setModoPruebaActivo(false)
    } catch (err: any) {
      alert('Error al registrar novedad: ' + err.message)
    }
  }

  // Filtrar abonados para la creación
  const clientesFiltrados = Object.entries(clientesMap)
    .filter(([cuenta, c]) => 
      cuenta.toLowerCase().includes(buscarCuenta.toLowerCase()) || 
      (c.nombre || '').toLowerCase().includes(buscarCuenta.toLowerCase())
    )
    .slice(0, 5)

  // Órdenes asignadas al técnico seleccionado
  const ordenesTécnico = ordenes.filter(o => o.tecnico === tecnicoSimulado)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-black select-none overflow-hidden">
        
        {/* Title bar */}
        <div className="bg-[#8B0000] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-xs tracking-wide">Scorpion - Módulo de Servicio Técnico en Terreno</div>
          <button 
            onClick={onClose} 
            className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] cursor-pointer"
          >
            X
          </button>
        </div>

        {/* Windows Style Tabs Menu */}
        <div className="bg-[#c0c0c0] px-2 pt-1 flex gap-0.5 border-b-2 border-white shrink-0">
          <button
            onClick={() => setTabActive('despacho')}
            className={`px-3 py-1 font-bold text-xs border-t-2 border-l-2 border-r-2 border-white rounded-t-sm cursor-pointer ${
              tabActive === 'despacho' ? 'bg-[#d4d0c8] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
            }`}
          >
            🖥️ DESPACHO Y ASIGNACIÓN (CENTRAL)
          </button>
          <button
            onClick={() => setTabActive('tecnico_movil')}
            className={`px-3 py-1 font-bold text-xs border-t-2 border-l-2 border-r-2 border-white rounded-t-sm cursor-pointer ${
              tabActive === 'tecnico_movil' ? 'bg-[#d4d0c8] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
            }`}
          >
            📱 SIMULADOR PORTAL TÉCNICO (TERRENO)
          </button>
        </div>

        {/* Tab Content area */}
        <div className="p-3 bg-[#d4d0c8] flex-1 flex flex-col overflow-hidden min-h-0">
          
          {/* TAB 1: DESPACHO CENTRAL */}
          {tabActive === 'despacho' && (
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
              
              {/* Formulario Asignación Izquierda */}
              <div className="w-full md:w-[280px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 p-3 flex flex-col justify-between shrink-0">
                <div className="space-y-3">
                  <div className="bg-[#000080] text-white text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider text-center">
                    Crear Orden de Trabajo
                  </div>
                  
                  {/* Buscador de Abonado */}
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Buscar Abonado:</label>
                    <input
                      type="text"
                      value={buscarCuenta}
                      onChange={(e) => setBuscarCuenta(e.target.value)}
                      placeholder="Escriba cuenta o nombre..."
                      className="bg-white border border-gray-400 font-bold px-2 py-1 text-xs text-black select-text focus:outline-none w-full"
                    />
                    
                    {buscarCuenta && !cuentaSeleccionada && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-400 shadow-lg z-30 divide-y divide-gray-200">
                        {clientesFiltrados.map(([cuenta, c]) => (
                          <div
                            key={cuenta}
                            onClick={() => {
                              setCuentaSeleccionada(cuenta)
                              setBuscarCuenta(`${cuenta} - ${c.nombre}`)
                            }}
                            className="p-1 text-[10px] hover:bg-blue-800 hover:text-white cursor-pointer truncate"
                          >
                            <strong>{cuenta}</strong> - {c.nombre}
                          </div>
                        ))}
                        {clientesFiltrados.length === 0 && (
                          <div className="p-1 text-[10px] text-gray-500 italic">No se encontraron clientes</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Técnico Asignado */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Asignar Técnico:</label>
                    <select
                      value={tecnicoAsignado}
                      onChange={(e) => setTecnicoAsignado(e.target.value)}
                      className="bg-white border border-gray-400 font-bold px-2 py-1 text-xs text-black focus:outline-none w-full"
                    >
                      {TECNICOS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Problema Reportado */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Falla / Trabajo Solicitado:</label>
                    <textarea
                      value={problemaReportado}
                      onChange={(e) => setProblemaReportado(e.target.value)}
                      placeholder="Ej: Cambio de batería, mantenimiento preventivo de sensores de movimiento..."
                      className="bg-white border border-gray-400 font-bold px-2 py-1 text-xs text-black select-text focus:outline-none w-full h-24 resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCrearOrden}
                  className="bg-[#d4d0c8] hover:bg-white border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full py-1.5 font-bold text-xs cursor-pointer active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white mt-4"
                >
                  ➕ DESPACHAR TÉCNICO
                </button>
              </div>

              {/* Listado de Órdenes Derecha */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 p-2">
                <div className="bg-[#000080] text-white text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Listado de Órdenes de Trabajo Activas</span>
                  <button onClick={cargarOrdenes} className="hover:text-yellow-300 text-[10px] font-bold">🔄 ACTUALIZAR</button>
                </div>

                <div className="flex-1 overflow-auto border border-gray-400 bg-white">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#d4d0c8] text-black sticky top-0 border-b border-gray-400 font-bold z-10">
                        <th className="p-1.5 border-r border-gray-400 text-center w-12">ESTADO</th>
                        <th className="p-1.5 border-r border-gray-400 text-center w-10">CUENTA</th>
                        <th className="p-1.5 border-r border-gray-400">ABONADO</th>
                        <th className="p-1.5 border-r border-gray-400">TÉCNICO</th>
                        <th className="p-1.5 border-r border-gray-400">PROBLEMA REPORTADO</th>
                        <th className="p-1.5 border-r border-gray-400">NOVEDAD DE TERRENO</th>
                        <th className="p-1.5 text-center w-8">ACC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ordenes.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-1 border-r border-gray-300 text-center font-bold">
                            <span className={`px-1 py-0.2 rounded-sm text-[9px] ${
                              o.estado === 'Completada' ? 'bg-green-100 text-green-800 border border-green-300' :
                              o.estado === 'En Proceso' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                              'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              {o.estado.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-1 border-r border-gray-300 text-center font-mono font-bold">{o.cuenta}</td>
                          <td className="p-1 border-r border-gray-300 font-bold truncate max-w-[120px] uppercase">{o.nombre_abonado}</td>
                          <td className="p-1 border-r border-gray-300 font-bold text-gray-700">{o.tecnico}</td>
                          <td className="p-1 border-r border-gray-300 max-w-[200px] truncate" title={o.problema}>{o.problema}</td>
                          <td className="p-1 border-r border-gray-300 italic max-w-[200px] truncate text-slate-500" title={o.novedad}>{o.novedad || 'Sin novedad reportada'}</td>
                          <td className="p-1 text-center">
                            <button
                              onClick={() => handleEliminarOrden(o.id)}
                              className="bg-red-700 hover:bg-red-600 text-white border border-red-500 px-1 py-0.2 text-[9px] cursor-pointer"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                      {ordenes.length === 0 && !cargando && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-400 italic">No hay órdenes de trabajo registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PORTAL MOVIL DEL TECNICO */}
          {tabActive === 'tecnico_movil' && (
            <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto py-2">
              
              {/* Smartphone Frame Container */}
              <div className="w-full max-w-[340px] bg-[#222] rounded-[36px] border-8 border-[#444] shadow-2xl p-4 flex flex-col overflow-hidden aspect-[9/18] min-h-[580px] text-black">
                
                {/* Smartphone Speaker & Camera Notch */}
                <div className="w-24 h-4 bg-[#444] rounded-full mx-auto mb-3 flex items-center justify-center shrink-0">
                  <div className="w-8 h-1 bg-[#222] rounded-full" />
                </div>

                {/* Smartphone Screen Viewport */}
                <div className="flex-1 bg-[#c0c0c0] border-2 border-[#111] p-2 flex flex-col overflow-hidden min-h-0 select-text">
                  
                  {/* Simulador Selector de Técnico */}
                  <div className="bg-[#8B0000] text-white p-1 text-[9px] font-bold flex justify-between items-center shrink-0">
                    <span>📱 SIMULADOR TÉCNICO:</span>
                    <select
                      value={tecnicoSimulado}
                      onChange={(e) => {
                        setTecnicoSimulado(e.target.value)
                        setOrdenSeleccionada(null)
                      }}
                      className="bg-black text-white font-bold p-0.5 text-[8px] focus:outline-none border-0"
                    >
                      {TECNICOS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {ordenSeleccionada ? (
                    /* Detalle de la Orden del Técnico */
                    <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0 pt-2 text-[10px]">
                      
                      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                        {/* Botón Volver */}
                        <button
                          onClick={() => setOrdenSeleccionada(null)}
                          className="bg-[#d4d0c8] hover:bg-white border border-gray-600 px-2 py-0.5 font-bold cursor-pointer text-[8px]"
                        >
                          ◀ VOLVER A LA LISTA
                        </button>

                        <div className="bg-white p-1.5 border border-gray-400 space-y-1">
                          <div><strong>CTA:</strong> <span className="font-mono">{ordenSeleccionada.cuenta}</span></div>
                          <div className="truncate"><strong>ABONADO:</strong> {ordenSeleccionada.nombre_abonado}</div>
                          <div><strong>PROBLEMA:</strong> {ordenSeleccionada.problema}</div>
                        </div>

                        {/* Controles de Pruebas de Señal */}
                        <div className="bg-[#e0e0e0] border border-gray-400 p-1.5 space-y-1">
                          <span className="font-bold block text-[8px] text-gray-700 uppercase border-b border-gray-400 pb-0.5">⚙️ PRUEBA DE SEÑALES EN VIVO</span>
                          
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => setModoPruebaActivo(!modoPruebaActivo)}
                              className={`px-2 py-0.5 font-bold text-[8px] border border-gray-600 cursor-pointer ${
                                modoPruebaActivo ? 'bg-yellow-500 text-black' : 'bg-gray-300'
                              }`}
                            >
                              {modoPruebaActivo ? '🔕 MODO PRUEBA ACTIVO' : '🔔 ACTIVAR MODOD PRUEBA'}
                            </button>
                            
                            <button
                              onClick={simularSenalPanel}
                              className="bg-blue-800 text-white font-bold px-2 py-0.5 border border-blue-600 cursor-pointer text-[8px]"
                            >
                              ⚡ PROBAR PANEL
                            </button>
                          </div>

                          {/* Consola de Señales */}
                          <div className="bg-black text-green-400 p-1 font-mono text-[7px] h-16 overflow-y-auto space-y-0.5 border border-gray-500 mt-1">
                            {senalesRecibidas.map((s, idx) => (
                              <div key={idx} className="truncate">{s}</div>
                            ))}
                            {senalesRecibidas.length === 0 && (
                              <div className="text-gray-600 text-center italic py-4">Sin señales enviadas.</div>
                            )}
                          </div>
                        </div>

                        {/* Reporte de terreno */}
                        <div className="space-y-1">
                          <label className="font-bold text-[9px] text-gray-700 uppercase">Escriba Novedad / Trabajo Realizado:</label>
                          <textarea
                            value={novedadTexto}
                            onChange={(e) => setNovedadTexto(e.target.value)}
                            placeholder="Describa los cambios, repuestos, o pruebas efectuadas..."
                            className="bg-white border border-gray-400 p-1 text-[9px] text-black w-full h-14 resize-none select-text focus:outline-none"
                          />
                        </div>

                        {/* Dibujar Firma digital */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <label className="font-bold text-[8px] text-gray-700 uppercase">Firma del Cliente:</label>
                            <button onClick={clearFirma} className="text-[7px] text-red-700 hover:underline">LIMPIAR</button>
                          </div>
                          <canvas
                            ref={canvasRef}
                            width={280}
                            height={50}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="bg-white border border-gray-400 cursor-crosshair w-full rounded-sm"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleFinalizarOrden}
                        className="bg-green-700 hover:bg-green-600 text-white font-bold py-1 border border-green-600 w-full mt-2 cursor-pointer rounded-sm"
                      >
                        ✔️ COMPLETAR Y SUBIR BITÁCORA
                      </button>

                    </div>
                  ) : (
                    /* Listado de Órdenes del Técnico */
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0 pt-2 text-[10px]">
                      <span className="font-bold text-[8px] text-gray-600 block mb-1">MIS TRABAJOS ASIGNADOS ({ordenesTécnico.length}):</span>
                      
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                        {ordenesTécnico.map(o => (
                          <div
                            key={o.id}
                            onClick={() => {
                              if (o.estado === 'Completada') {
                                alert('Esta orden de trabajo ya fue completada.')
                                return
                              }
                              setOrdenSeleccionada(o)
                            }}
                            className={`p-2 border border-gray-400 bg-white cursor-pointer hover:bg-slate-100 space-y-1 ${
                              o.estado === 'Completada' ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex justify-between font-bold">
                              <span className="font-mono text-blue-900">{o.cuenta}</span>
                              <span className={`px-1 text-[7px] rounded-xs ${
                                o.estado === 'Completada' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                              }`}>{o.estado.toUpperCase()}</span>
                            </div>
                            <div className="font-bold text-[9px] truncate">{o.nombre_abonado}</div>
                            <div className="text-[8px] text-gray-500 truncate">{o.problema}</div>
                          </div>
                        ))}
                        {ordenesTécnico.length === 0 && (
                          <div className="text-center text-gray-500 italic py-12">No tienes órdenes asignadas hoy.</div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Smartphone Home Button */}
                <div className="w-10 h-10 rounded-full border-2 border-[#444] bg-[#222] mx-auto mt-2 shrink-0 flex items-center justify-center cursor-pointer hover:bg-[#333]">
                  <div className="w-3.5 h-3.5 border border-[#555] rounded-xs" />
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
