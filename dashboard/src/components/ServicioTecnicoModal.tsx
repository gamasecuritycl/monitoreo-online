'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface OrdenTrabajo {
  id: number
  codigo_ot: string
  cuenta: string
  nombre_abonado: string
  direccion: string
  telefono_contacto: string
  tipo_visita: 'Correctiva' | 'Preventiva' | 'Cambio de Batería' | 'Instalación' | 'Revisión de Cámaras'
  tecnico: string
  fecha_cita: string
  bloque_horario: string
  problema: string
  estado: 'Pendiente' | 'Programada' | 'En Traslado' | 'En Terreno' | 'Completada' | 'Cancelada'
  novedad: string
  repuestos_utilizados?: string
  firma: string
  nombre_firmante?: string
  fecha_creacion: string
  fecha_cierre?: string
}

interface Props {
  onClose: () => void
  clientesMap?: Record<string, Record<string, string>>
  usuarioActivo?: {
    codigo: string
    nombre: string
    rol: 'Administrador' | 'Supervisor' | 'Operadora' | 'Técnico'
    clave: string
  }
}

const TECNICOS = ['Juan Pérez', 'Diego Reyes', 'Mauricio Tapia', 'Cristian Muñoz']
const TIPOS_VISITA = ['Correctiva', 'Preventiva', 'Cambio de Batería', 'Instalación', 'Revisión de Cámaras'] as const
const BLOQUES_HORARIOS = ['Mañana (09:00 - 13:00)', 'Tarde (14:00 - 18:00)'] as const

export default function ServicioTecnicoModal({ onClose, clientesMap = {}, usuarioActivo }: Props) {
  const [tabActive, setTabActive] = useState<'despacho' | 'tecnico_movil'>('despacho')

  // Bloqueo a vista móvil si inició sesión como Técnico
  useEffect(() => {
    if (usuarioActivo?.rol === 'Técnico') {
      setTabActive('tecnico_movil')
      setTecnicoSimulado(usuarioActivo.nombre)
    }
  }, [usuarioActivo])
  
  // Lista de órdenes
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [cargando, setCargando] = useState(false)

  // Formulario creación en Despacho
  const [buscarCuenta, setBuscarCuenta] = useState('')
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('')
  const [tecnicoAsignado, setTecnicoAsignado] = useState(TECNICOS[0])
  const [tipoVisita, setTipoVisita] = useState<typeof TIPOS_VISITA[number]>('Correctiva')
  const [fechaCita, setFechaCita] = useState(new Date().toISOString().slice(0, 10))
  const [bloqueHorario, setBloqueHorario] = useState<typeof BLOQUES_HORARIOS[number]>('Mañana (09:00 - 13:00)')
  const [telefonoContacto, setTelefonoContacto] = useState('')
  const [direccionAbonado, setDireccionAbonado] = useState('')
  const [problemaReportado, setProblemaReportado] = useState('')

  // Técnico Móvil (Terreno)
  const [tecnicoSimulado, setTecnicoSimulado] = useState(TECNICOS[0])
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajo | null>(null)
  const [novedadTexto, setNovedadTexto] = useState('')
  const [repuestosTexto, setRepuestosTexto] = useState('')
  const [nombreFirmanteText, setNombreFirmanteText] = useState('')
  
  // Canvas de Firma
  const [firmando, setFirmando] = useState(false)
  const [firmaImagen, setFirmaImagen] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Visor de Comprobante Oficial Imprimible
  const [ordenImprimir, setOrdenImprimir] = useState<OrdenTrabajo | null>(null)

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

  // Auto-completar dirección y teléfono al seleccionar cuenta
  useEffect(() => {
    if (cuentaSeleccionada && clientesMap[cuentaSeleccionada]) {
      const c = clientesMap[cuentaSeleccionada]
      setDireccionAbonado(c.direccion || '')
      setTelefonoContacto(c.telefono1 || c.t1 || '')
    }
  }, [cuentaSeleccionada, clientesMap])

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

  // Enviar notificación de WhatsApp al cliente
  const enviarNotificacionWhatsApp = async (numeroTel: string, mensajeStr: string) => {
    if (!numeroTel || numeroTel.length < 8) return
    try {
      let numClean = numeroTel.replace(/[^0-9]/g, '')
      if (numClean.length === 9 && numClean.startsWith('9')) {
        numClean = '56' + numClean
      }
      await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: numClean,
          mensaje: mensajeStr
        })
      })
    } catch (err) {
      console.warn('No se pudo enviar notificación de WhatsApp:', err)
    }
  }

  // Crear una nueva Orden de Trabajo
  const handleCrearOrden = async () => {
    if (!cuentaSeleccionada) {
      alert('Por favor seleccione una cuenta de abonado.')
      return
    }
    if (!problemaReportado.trim()) {
      alert('Por favor describa el problema o requerimiento.')
      return
    }

    const abonadoInfo = clientesMap[cuentaSeleccionada] || { nombre: 'Abonado Desconocido' }
    const idOT = Date.now()
    const codigoOT = `OT-${idOT.toString().slice(-4)}`
    
    const nuevaOrden: OrdenTrabajo = {
      id: idOT,
      codigo_ot: codigoOT,
      cuenta: cuentaSeleccionada,
      nombre_abonado: abonadoInfo.nombre || 'Abonado Desconocido',
      direccion: direccionAbonado || abonadoInfo.direccion || 'Dirección no disponible',
      telefono_contacto: telefonoContacto || abonadoInfo.telefono1 || '',
      tipo_visita: tipoVisita,
      tecnico: tecnicoAsignado,
      fecha_cita: fechaCita,
      bloque_horario: bloqueHorario,
      problema: problemaReportado.trim(),
      estado: 'Programada',
      novedad: '',
      repuestos_utilizados: '',
      firma: '',
      nombre_firmante: '',
      fecha_creacion: new Date().toISOString().slice(0, 16).replace('T', ' ')
    }

    const listaNueva = [nuevaOrden, ...ordenes]
    await guardarOrdenesBase(listaNueva)
    
    // Notificación automática por WhatsApp al cliente
    if (nuevaOrden.telefono_contacto) {
      const msgWA = `🛠️ *GAMA SEGURIDAD 24/7 - Servicio Técnico*\n\nEstimado cliente, su orden de atención técnica *#${codigoOT}* ha sido programada con éxito:\n\n• *Tipo:* ${tipoVisita}\n• *Fecha:* ${fechaCita}\n• *Horario:* ${bloqueHorario}\n• *Técnico Asignado:* ${tecnicoAsignado}\n\nQuedamos atentos a su llegada.`
      enviarNotificacionWhatsApp(nuevaOrden.telefono_contacto, msgWA)
    }

    // Resetear formulario
    setProblemaReportado('')
    setBuscarCuenta('')
    setCuentaSeleccionada('')
    alert(`✅ Orden de trabajo #${codigoOT} programada con éxito para el técnico ${tecnicoAsignado}.`)
  }

  // Transición de estado de la OT por el Técnico
  const cambiarEstadoOrden = async (id: number, nuevoEstado: OrdenTrabajo['estado']) => {
    const listaNueva = ordenes.map(o => {
      if (o.id === id) {
        return { ...o, estado: nuevoEstado }
      }
      return o
    })
    await guardarOrdenesBase(listaNueva)
    if (ordenSeleccionada && ordenSeleccionada.id === id) {
      setOrdenSeleccionada({ ...ordenSeleccionada, estado: nuevoEstado })
    }
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

  // Finalizar Orden, firmar y notificar al cliente
  const handleFinalizarOrden = async () => {
    if (!ordenSeleccionada) return
    if (!novedadTexto.trim()) {
      alert('Por favor describa el trabajo o solución realizada en terreno.')
      return
    }

    const fechaCierreStr = new Date().toISOString().slice(0, 16).replace('T', ' ')

    try {
      // 1. Insertar evento en la bitácora general de monitoreo
      await supabase.from('eventos_monitoreo').insert({
        fecha_hora: new Date().toISOString(),
        cuenta: ordenSeleccionada.cuenta,
        nombre_abonado: ordenSeleccionada.nombre_abonado,
        evento: `SERVICIO TECNICO COMPLETADO: ${novedadTexto.trim().toUpperCase()}`,
        zona: 'S/T',
        usuario: 'TEC'
      })

      // 2. Actualizar la OT en el listado
      const ordenCompletada: OrdenTrabajo = {
        ...ordenSeleccionada,
        estado: 'Completada',
        novedad: novedadTexto.trim(),
        repuestos_utilizados: repuestosTexto.trim(),
        nombre_firmante: nombreFirmanteText.trim() || 'Cliente',
        firma: firmaImagen,
        fecha_cierre: fechaCierreStr
      }

      const listaNueva = ordenes.map(o => o.id === ordenSeleccionada.id ? ordenCompletada : o)
      await guardarOrdenesBase(listaNueva)

      // 3. Notificación de término por WhatsApp
      if (ordenCompletada.telefono_contacto) {
        const msgWA = `✅ *GAMA SEGURIDAD 24/7 - Atención Finalizada*\n\nSu orden de servicio técnico *#${ordenCompletada.codigo_ot || 'OT'}* ha sido completada exitosamente.\n\n• *Trabajo Realizado:* ${novedadTexto.trim()}\n• *Repuestos:* ${repuestosTexto.trim() || 'Ninguno'}\n• *Atendido por:* ${ordenCompletada.tecnico}\n\nGracias por su confianza.`
        enviarNotificacionWhatsApp(ordenCompletada.telefono_contacto, msgWA)
      }

      alert('🎉 ¡Orden de trabajo completada, firma capturada y notificada con éxito!')
      
      // Mostrar comprobante imprimible
      setOrdenImprimir(ordenCompletada)

      // Resetear estados de terreno
      setOrdenSeleccionada(null)
      setNovedadTexto('')
      setRepuestosTexto('')
      setNombreFirmanteText('')
      setFirmaImagen('')
    } catch (err: any) {
      alert('Error al finalizar la orden de trabajo: ' + err.message)
    }
  }

  // Filtrar abonados para el buscador
  const clientesFiltrados = Object.entries(clientesMap)
    .filter(([cuenta, c]) => 
      cuenta.toLowerCase().includes(buscarCuenta.toLowerCase()) || 
      (c.nombre || '').toLowerCase().includes(buscarCuenta.toLowerCase())
    )
    .slice(0, 5)

  // Órdenes asignadas al técnico simulado
  const ordenesTécnico = ordenes.filter(o => o.tecnico === tecnicoSimulado)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 font-mono">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-black select-none overflow-hidden">
        
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
          {usuarioActivo?.rol !== 'Técnico' && (
            <button
              onClick={() => setTabActive('despacho')}
              className={`px-3 py-1 font-bold text-xs border-t-2 border-l-2 border-r-2 border-white rounded-t-sm cursor-pointer ${
                tabActive === 'despacho' ? 'bg-[#d4d0c8] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
              }`}
            >
              🖥️ DESPACHO Y AGENDAMIENTO (CENTRAL)
            </button>
          )}
          <button
            onClick={() => setTabActive('tecnico_movil')}
            className={`px-3 py-1 font-bold text-xs border-t-2 border-l-2 border-r-2 border-white rounded-t-sm cursor-pointer ${
              tabActive === 'tecnico_movil' ? 'bg-[#d4d0c8] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
            }`}
          >
            {usuarioActivo?.rol === 'Técnico' ? '📱 PORTAL TÉCNICO EN TERRENO' : '📱 SIMULADOR PORTAL TÉCNICO (TERRENO)'}
          </button>
        </div>

        {/* Tab Content area */}
        <div className="p-3 bg-[#d4d0c8] flex-1 flex flex-col overflow-hidden min-h-0">
          
          {/* TAB 1: DESPACHO CENTRAL */}
          {tabActive === 'despacho' && (
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
              
              {/* Formulario Asignación Izquierda */}
              <div className="w-full md:w-[320px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
                <div className="space-y-2.5">
                  <div className="bg-[#000080] text-white text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider text-center">
                    Agendar Orden de Trabajo
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

                  {/* Tipo de Visita */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Tipo de Visita:</label>
                      <select
                        value={tipoVisita}
                        onChange={(e: any) => setTipoVisita(e.target.value)}
                        className="bg-white border border-gray-400 font-bold px-1 py-1 text-[10px] text-black focus:outline-none w-full"
                      >
                        {TIPOS_VISITA.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Técnico:</label>
                      <select
                        value={tecnicoAsignado}
                        onChange={(e) => setTecnicoAsignado(e.target.value)}
                        className="bg-white border border-gray-400 font-bold px-1 py-1 text-[10px] text-black focus:outline-none w-full"
                      >
                        {TECNICOS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fecha y Bloque Horario */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Fecha Cita:</label>
                      <input
                        type="date"
                        value={fechaCita}
                        onChange={(e) => setFechaCita(e.target.value)}
                        className="bg-white border border-gray-400 font-bold px-1 py-0.5 text-[10px] text-black focus:outline-none w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Bloque Horario:</label>
                      <select
                        value={bloqueHorario}
                        onChange={(e: any) => setBloqueHorario(e.target.value)}
                        className="bg-white border border-gray-400 font-bold px-1 py-0.5 text-[9px] text-black focus:outline-none w-full"
                      >
                        {BLOQUES_HORARIOS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Teléfono de Contacto */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Teléfono Contacto (WA):</label>
                    <input
                      type="text"
                      value={telefonoContacto}
                      onChange={(e) => setTelefonoContacto(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="bg-white border border-gray-400 font-bold px-2 py-0.5 text-xs text-black select-text focus:outline-none w-full"
                    />
                  </div>

                  {/* Problema Reportado */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Falla / Trabajo Solicitado:</label>
                    <textarea
                      value={problemaReportado}
                      onChange={(e) => setProblemaReportado(e.target.value)}
                      placeholder="Ej: Cambio de batería 12V 7Ah en panel DSC y revisión de zona 03..."
                      className="bg-white border border-gray-400 font-bold px-2 py-1 text-xs text-black select-text focus:outline-none w-full h-20 resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCrearOrden}
                  className="bg-[#000080] text-white hover:bg-blue-900 border-2 border-t-white border-l-white border-b-gray-900 border-r-gray-900 w-full py-1.5 font-bold text-xs cursor-pointer active:translate-y-0.5 mt-3 shadow"
                >
                  ➕ AGENDAR & NOTIFICAR POR WA
                </button>
              </div>

              {/* Listado de Órdenes Derecha */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 p-2">
                <div className="bg-[#000080] text-white text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider mb-2 flex justify-between items-center">
                  <span>📋 Listado de Órdenes de Trabajo Activas ({ordenes.length})</span>
                  <button onClick={cargarOrdenes} className="hover:text-yellow-300 text-[10px] font-bold cursor-pointer">🔄 ACTUALIZAR</button>
                </div>

                <div className="flex-1 overflow-auto border border-gray-400 bg-white">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-[#d4d0c8] text-black sticky top-0 border-b border-gray-400 font-bold z-10">
                        <th className="p-1 border-r border-gray-400 text-center w-20">OT / FECHA</th>
                        <th className="p-1 border-r border-gray-400 text-center w-12">ESTADO</th>
                        <th className="p-1 border-r border-gray-400 text-center w-10">CTA</th>
                        <th className="p-1 border-r border-gray-400">ABONADO</th>
                        <th className="p-1 border-r border-gray-400">TIPO / TÉCNICO</th>
                        <th className="p-1 border-r border-gray-400">FALLA REPORTADA</th>
                        <th className="p-1 text-center w-16">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ordenes.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-1 border-r border-gray-300 text-center">
                            <span className="font-bold font-mono text-blue-900 block">{o.codigo_ot || `OT-${o.id.toString().slice(-4)}`}</span>
                            <span className="text-[8px] text-gray-500">{o.fecha_cita}</span>
                          </td>
                          <td className="p-1 border-r border-gray-300 text-center font-bold">
                            <span className={`px-1 py-0.2 rounded-xs text-[8px] whitespace-nowrap ${
                              o.estado === 'Completada' ? 'bg-green-100 text-green-800 border border-green-300' :
                              o.estado === 'En Terreno' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                              o.estado === 'En Traslado' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                              'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                              {o.estado.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-1 border-r border-gray-300 text-center font-mono font-bold">{o.cuenta}</td>
                          <td className="p-1 border-r border-gray-300 font-bold truncate max-w-[120px] uppercase">{o.nombre_abonado}</td>
                          <td className="p-1 border-r border-gray-300">
                            <span className="font-bold text-gray-800 block text-[9px]">{o.tipo_visita || 'Correctiva'}</span>
                            <span className="text-gray-500 text-[8px]">{o.tecnico}</span>
                          </td>
                          <td className="p-1 border-r border-gray-300 max-w-[180px] truncate" title={o.problema}>{o.problema}</td>
                          <td className="p-1 text-center flex items-center justify-center gap-1 pt-2">
                            {o.estado === 'Completada' && (
                              <button
                                onClick={() => setOrdenImprimir(o)}
                                className="bg-blue-700 hover:bg-blue-800 text-white border border-blue-600 px-1 py-0.2 text-[9px] cursor-pointer"
                                title="Ver / Imprimir Comprobante Oficial PDF"
                              >
                                📄
                              </button>
                            )}
                            <button
                              onClick={() => handleEliminarOrden(o.id)}
                              className="bg-red-700 hover:bg-red-600 text-white border border-red-500 px-1 py-0.2 text-[9px] cursor-pointer"
                              title="Eliminar Orden de Trabajo"
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
              <div className="w-full max-w-[360px] bg-[#222] rounded-[36px] border-8 border-[#444] shadow-2xl p-4 flex flex-col overflow-hidden aspect-[9/18] min-h-[600px] text-black">
                
                {/* Smartphone Notch */}
                <div className="w-24 h-4 bg-[#444] rounded-full mx-auto mb-3 flex items-center justify-center shrink-0">
                  <div className="w-8 h-1 bg-[#222] rounded-full" />
                </div>

                {/* Smartphone Screen Viewport */}
                <div className="flex-1 bg-[#c0c0c0] border-2 border-[#111] p-2 flex flex-col overflow-hidden min-h-0 select-text">
                  
                  {/* Simulador Selector de Técnico */}
                  <div className="bg-[#8B0000] text-white p-1 text-[9px] font-bold flex justify-between items-center shrink-0">
                    <span>{usuarioActivo?.rol === 'Técnico' ? '📱 TÉCNICO:' : '📱 SIMULADOR TÉCNICO:'}</span>
                    {usuarioActivo?.rol === 'Técnico' ? (
                      <span className="font-bold text-[9px] uppercase pr-1">{usuarioActivo.nombre}</span>
                    ) : (
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
                    )}
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

                        <div className="bg-white p-2 border border-gray-400 space-y-1">
                          <div className="flex justify-between font-bold text-blue-900 border-b border-gray-300 pb-0.5">
                            <span>OT #{ordenSeleccionada.codigo_ot || ordenSeleccionada.id}</span>
                            <span className="bg-blue-100 text-blue-900 px-1 text-[8px]">{ordenSeleccionada.tipo_visita || 'Correctiva'}</span>
                          </div>
                          <div><strong>CTA:</strong> <span className="font-mono">{ordenSeleccionada.cuenta}</span></div>
                          <div><strong>ABONADO:</strong> {ordenSeleccionada.nombre_abonado}</div>
                          <div><strong>DIRECCIÓN:</strong> {ordenSeleccionada.direccion}</div>
                          <div><strong>FALLA:</strong> {ordenSeleccionada.problema}</div>
                        </div>

                        {/* Controles de Estado Operativo */}
                        <div className="bg-[#e0e0e0] border border-gray-400 p-1.5 space-y-1">
                          <span className="font-bold block text-[8px] text-gray-700 uppercase border-b border-gray-400 pb-0.5">🚦 ESTADO DE LA ATENCIÓN:</span>
                          <div className="grid grid-cols-2 gap-1 pt-0.5">
                            <button
                              onClick={() => cambiarEstadoOrden(ordenSeleccionada.id, 'En Traslado')}
                              className={`py-1 font-bold text-[8px] border border-gray-600 cursor-pointer ${
                                ordenSeleccionada.estado === 'En Traslado' ? 'bg-yellow-400 text-black font-bold' : 'bg-gray-200'
                              }`}
                            >
                              🚗 EN TRASLADO
                            </button>
                            <button
                              onClick={() => cambiarEstadoOrden(ordenSeleccionada.id, 'En Terreno')}
                              className={`py-1 font-bold text-[8px] border border-gray-600 cursor-pointer ${
                                ordenSeleccionada.estado === 'En Terreno' ? 'bg-purple-600 text-white font-bold' : 'bg-gray-200'
                              }`}
                            >
                              📍 EN TERRENO
                            </button>
                          </div>
                        </div>

                        {/* Reporte de terreno */}
                        <div className="space-y-1">
                          <label className="font-bold text-[9px] text-gray-700 uppercase">Trabajo / Solución Realizada:</label>
                          <textarea
                            value={novedadTexto}
                            onChange={(e) => setNovedadTexto(e.target.value)}
                            placeholder="Describa los cambios de batería, reparación de cableado o pruebas efectivas..."
                            className="bg-white border border-gray-400 p-1 text-[9px] text-black w-full h-14 resize-none select-text focus:outline-none"
                          />
                        </div>

                        {/* Repuestos Utilizados */}
                        <div className="space-y-1">
                          <label className="font-bold text-[9px] text-gray-700 uppercase">Repuestos / Baterías Cambiadas:</label>
                          <input
                            type="text"
                            value={repuestosTexto}
                            onChange={(e) => setRepuestosTexto(e.target.value)}
                            placeholder="Ej: 1 Batería 12V 7Ah, 1 Sensor PIR DSC..."
                            className="bg-white border border-gray-400 p-1 text-[9px] text-black w-full focus:outline-none"
                          />
                        </div>

                        {/* Nombre del Firmante */}
                        <div className="space-y-1">
                          <label className="font-bold text-[9px] text-gray-700 uppercase">Nombre del Cliente / Firmante:</label>
                          <input
                            type="text"
                            value={nombreFirmanteText}
                            onChange={(e) => setNombreFirmanteText(e.target.value)}
                            placeholder="Nombre y apellido de quien recibe..."
                            className="bg-white border border-gray-400 p-1 text-[9px] text-black w-full focus:outline-none"
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
                            width={300}
                            height={60}
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
                        className="bg-green-700 hover:bg-green-600 text-white font-bold py-1.5 border border-green-600 w-full mt-2 cursor-pointer rounded-sm shadow"
                      >
                        ✔️ FINALIZAR Y ENVIAR COMPROBANTE WA
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
                              setOrdenSeleccionada(o)
                              setNovedadTexto(o.novedad || '')
                              setRepuestosTexto(o.repuestos_utilizados || '')
                              setNombreFirmanteText(o.nombre_firmante || '')
                            }}
                            className={`p-2 border border-gray-400 bg-white cursor-pointer hover:bg-slate-100 space-y-1 ${
                              o.estado === 'Completada' ? 'opacity-70 bg-green-50' : ''
                            }`}
                          >
                            <div className="flex justify-between font-bold">
                              <span className="font-mono text-blue-900">{o.cuenta} ({o.codigo_ot || 'OT'})</span>
                              <span className={`px-1 text-[7px] rounded-xs ${
                                o.estado === 'Completada' ? 'bg-green-200 text-green-900' : 'bg-yellow-200 text-yellow-900'
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

      {/* MODAL COMPROBANTE OFICIAL IMPRIMIBLE (PDF / RECEIPT) */}
      {ordenImprimir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
          <div className="w-full max-w-[650px] bg-white text-black p-6 font-sans shadow-2xl rounded border border-gray-400 max-h-[92vh] overflow-y-auto">
            
            {/* Header Corporativo */}
            <div className="flex justify-between items-center border-b-2 border-blue-900 pb-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-blue-950 tracking-wider">GAMA SEGURIDAD 24/7</h1>
                <p className="text-xs text-gray-600 font-semibold">Central de Monitoreo & Servicios Técnicos en Terreno</p>
                <p className="text-[10px] text-gray-500">Santiago, Chile • Fono: +56 9 9101 6912</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-blue-900 text-white font-mono text-sm font-bold px-2.5 py-1 rounded">
                  {ordenImprimir.codigo_ot || `OT-${ordenImprimir.id}`}
                </span>
                <p className="text-[10px] text-gray-500 mt-1">Fecha: {ordenImprimir.fecha_cita || ordenImprimir.fecha_creacion}</p>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-4 text-xs space-y-1">
              <div className="font-bold text-blue-900 border-b border-slate-300 pb-1 mb-1 uppercase text-[11px]">
                DATOS DEL ABONADO
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Cuenta:</strong> <span className="font-mono font-bold text-blue-900">{ordenImprimir.cuenta}</span></div>
                <div><strong>Nombre Titular:</strong> {ordenImprimir.nombre_abonado}</div>
                <div><strong>Dirección:</strong> {ordenImprimir.direccion}</div>
                <div><strong>Teléfono Contacto:</strong> {ordenImprimir.telefono_contacto || 'N/A'}</div>
              </div>
            </div>

            {/* Detalle del Servicio */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-4 text-xs space-y-2">
              <div className="font-bold text-blue-900 border-b border-slate-300 pb-1 uppercase text-[11px]">
                DETALLE DE LA ATENCIÓN TÉCNICA
              </div>
              <div><strong>Tipo de Visita:</strong> <span className="font-bold text-slate-800">{ordenImprimir.tipo_visita || 'Correctiva'}</span></div>
              <div><strong>Técnico Asignado:</strong> {ordenImprimir.tecnico}</div>
              <div><strong>Falla Reportada:</strong> {ordenImprimir.problema}</div>
              <div className="pt-1 border-t border-slate-200">
                <strong>Trabajo Realizado:</strong>
                <p className="text-gray-800 bg-white p-2 border border-slate-300 rounded mt-1 text-[11px] whitespace-pre-wrap">
                  {ordenImprimir.novedad || 'Trabajo completado en terreno sin observaciones.'}
                </p>
              </div>
              {ordenImprimir.repuestos_utilizados && (
                <div>
                  <strong>Repuestos Utilizados:</strong>
                  <p className="text-gray-800 bg-white p-1.5 border border-slate-300 rounded mt-0.5 text-[11px]">
                    {ordenImprimir.repuestos_utilizados}
                  </p>
                </div>
              )}
            </div>

            {/* Firma del Cliente */}
            <div className="border border-gray-300 p-3 rounded bg-slate-50 mb-4 flex justify-between items-center">
              <div>
                <span className="font-bold text-xs block text-gray-700">CONFORMIDAD DEL CLIENTE:</span>
                <span className="text-xs text-gray-600">Recepción: {ordenImprimir.nombre_firmante || ordenImprimir.nombre_abonado}</span>
              </div>
              {ordenImprimir.firma ? (
                <img src={ordenImprimir.firma} alt="Firma Cliente" className="h-16 border border-gray-400 bg-white px-2 rounded" />
              ) : (
                <span className="text-xs text-gray-400 italic">Sin firma registrada</span>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setOrdenImprimir(null)}
                className="px-3 py-1 bg-gray-300 text-gray-800 font-bold text-xs rounded hover:bg-gray-400 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1 bg-blue-900 text-white font-bold text-xs rounded hover:bg-blue-950 shadow cursor-pointer flex items-center gap-1"
              >
                <span>🖨️ Imprimir Comprobante</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
