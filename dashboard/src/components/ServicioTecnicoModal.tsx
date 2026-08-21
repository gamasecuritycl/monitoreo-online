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

import { Operator } from '@/types/operator'

interface Props {
  onClose: () => void
  clientesMap?: Record<string, Record<string, string>>
  usuarioActivo?: Operator
}

const TECNITOS_NORMALIZADOS = ['Juan Perez', 'Diego Reyes', 'Mauricio Tapia', 'Cristian Munoz']
const TECNICOS = ['Juan Pérez', 'Diego Reyes', 'Mauricio Tapia', 'Cristian Muñoz']
const TIPOS_VISITA = ['Correctiva', 'Preventiva', 'Cambio de Batería', 'Instalación', 'Revisión de Cámaras'] as const
const BLOQUES_HORARIOS = ['Mañana (09:00 - 13:00)', 'Tarde (14:00 - 18:00)'] as const

function coincideTecnico(t1?: string | null, t2?: string | null) {
  if (!t1 || !t2) return false
  const norm1 = t1.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim()
  const norm2 = t2.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim()
  if (norm1 === norm2) return true

  const p1 = norm1.split(' ').filter(Boolean)
  const p2 = norm2.split(' ').filter(Boolean)
  if (p1.length > 0 && p2.length > 0 && p1[0] === p2[0]) {
    return true
  }
  return false
}

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

  // Cargar órdenes desde Supabase (Fila especial cuenta: 'ORDENES_TRABAJO' con id desc)
  const cargarOrdenes = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .eq('cuenta', 'ORDENES_TRABAJO')
        .order('id', { ascending: false })
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
        ctx.lineWidth = 3
      }
    }
  }, [tabActive, ordenSeleccionada])

  const getPos = (e: any) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: any) => {
    setFirmando(true)
    const p = getPos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
    }
  }

  const draw = (e: any) => {
    if (!firmando) return
    const p = getPos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
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
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      setFirmaImagen('')
    }
  }

  // Finalizar Orden desde el módulo técnico
  const handleFinalizarOrden = async () => {
    if (!ordenSeleccionada) return
    if (!novedadTexto.trim()) {
      alert('Por favor describa el trabajo o solución realizada en terreno.')
      return
    }

    const fechaCierreStr = new Date().toISOString().slice(0, 16).replace('T', ' ')

    try {
      await supabase.from('eventos_monitoreo').insert({
        fecha_hora: new Date().toISOString(),
        cuenta: ordenSeleccionada.cuenta,
        nombre_abonado: ordenSeleccionada.nombre_abonado,
        evento: `SERVICIO TECNICO COMPLETADO: ${novedadTexto.trim().toUpperCase()}`,
        zona: 'S/T',
        usuario: 'TEC'
      })

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

      if (ordenCompletada.telefono_contacto) {
        const msgWA = `✅ *GAMA SEGURIDAD 24/7 - Atención Finalizada*\n\nSu orden de servicio técnico *#${ordenCompletada.codigo_ot || 'OT'}* ha sido completada exitosamente.\n\n• *Trabajo Realizado:* ${novedadTexto.trim()}\n• *Repuestos:* ${repuestosTexto.trim() || 'Ninguno'}\n• *Atendido por:* ${ordenCompletada.tecnico}\n\nGracias por su confianza.`
        enviarNotificacionWhatsApp(ordenCompletada.telefono_contacto, msgWA)
      }

      alert('🎉 ¡Orden de trabajo completada, firma capturada y notificada con éxito!')
      setOrdenImprimir(ordenCompletada)
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
  const ordenesTécnico = ordenes.filter(o => coincideTecnico(o.tecnico, tecnicoSimulado))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 font-sans select-none">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-[96vw] max-w-[1550px] h-[92vh] flex flex-col shadow-2xl text-black overflow-hidden rounded-md">
        
        {/* Title bar Ampliado */}
        <div className="bg-[#8B0000] text-white px-4 py-2.5 flex justify-between items-center shrink-0 border-b border-red-950">
          <div className="font-black text-sm md:text-base tracking-wider flex items-center gap-2">
            <span>🛠️</span>
            <span>Scorpion — Módulo de Servicio Técnico & Agendamiento en Terreno</span>
          </div>
          <button 
            onClick={onClose} 
            className="bg-[#c0c0c0] text-black font-black text-sm border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 py-1 leading-none hover:bg-[#d0d0d0] cursor-pointer"
          >
            ✕ CERRAR
          </button>
        </div>

        {/* Windows Style Tabs Menu Ampliado */}
        <div className="bg-[#c0c0c0] px-3 pt-2 flex gap-1 border-b-2 border-white shrink-0">
          {usuarioActivo?.rol !== 'Técnico' && (
            <button
              onClick={() => setTabActive('despacho')}
              className={`px-4 py-2 font-black text-xs md:text-sm border-t-2 border-l-2 border-r-2 border-white rounded-t-md cursor-pointer transition-colors ${
                tabActive === 'despacho' ? 'bg-[#d4d0c8] pb-2.5 -mb-0.5 z-10 text-blue-950' : 'bg-[#b0b0b0] text-gray-700 hover:bg-[#c0c0c0]'
              }`}
            >
              🖥️ DESPACHO Y AGENDAMIENTO (CENTRAL)
            </button>
          )}
          <button
            onClick={() => setTabActive('tecnico_movil')}
            className={`px-4 py-2 font-black text-xs md:text-sm border-t-2 border-l-2 border-r-2 border-white rounded-t-md cursor-pointer transition-colors ${
              tabActive === 'tecnico_movil' ? 'bg-[#d4d0c8] pb-2.5 -mb-0.5 z-10 text-blue-950' : 'bg-[#b0b0b0] text-gray-700 hover:bg-[#c0c0c0]'
            }`}
          >
            {usuarioActivo?.rol === 'Técnico' ? '📱 PORTAL TÉCNICO EN TERRENO' : '📱 SIMULADOR PORTAL TÉCNICO (TERRENO)'}
          </button>
        </div>

        {/* Tab Content area */}
        <div className="p-4 bg-[#d4d0c8] flex-1 flex flex-col overflow-hidden min-h-0">
          
          {/* TAB 1: DESPACHO CENTRAL */}
          {tabActive === 'despacho' && (
            <div className="flex-1 flex flex-col md:flex-row gap-5 overflow-hidden min-h-0">
              
              {/* Formulario Asignación Izquierda (AMPLIADO A 460px) */}
              <div className="w-full md:w-[440px] lg:w-[460px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 p-4 flex flex-col justify-between shrink-0 overflow-y-auto shadow-inner">
                <div className="space-y-4">
                  <div className="bg-[#000080] text-white text-xs md:text-sm font-black px-3 py-1.5 uppercase tracking-wider text-center rounded-sm">
                    ➕ AGENDAR ORDEN DE TRABAJO
                  </div>
                  
                  {/* Buscador de Abonado */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-black text-gray-800 uppercase block">1. BUSCAR ABONADO / CLIENTE:</label>
                    <input
                      type="text"
                      value={buscarCuenta}
                      onChange={(e) => setBuscarCuenta(e.target.value)}
                      placeholder="Escriba código de cuenta o nombre..."
                      className="bg-white border-2 border-gray-500 font-bold px-3 py-2 text-sm text-black select-text focus:outline-none focus:border-blue-800 w-full rounded"
                    />
                    
                    {buscarCuenta && !cuentaSeleccionada && (
                      <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-500 shadow-2xl z-30 divide-y divide-gray-200 rounded">
                        {clientesFiltrados.map(([cuenta, c]) => (
                          <div
                            key={cuenta}
                            onClick={() => {
                              setCuentaSeleccionada(cuenta)
                              setBuscarCuenta(`${cuenta} - ${c.nombre}`)
                            }}
                            className="p-2 text-xs font-bold hover:bg-blue-900 hover:text-white cursor-pointer truncate"
                          >
                            <strong className="font-mono text-blue-900 font-black">{cuenta}</strong> — {c.nombre}
                          </div>
                        ))}
                        {clientesFiltrados.length === 0 && (
                          <div className="p-2 text-xs text-gray-500 italic">No se encontraron clientes</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tipo de Visita & Técnico */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-800 uppercase block">Tipo de Visita:</label>
                      <select
                        value={tipoVisita}
                        onChange={(e: any) => setTipoVisita(e.target.value)}
                        className="bg-white border-2 border-gray-500 font-bold px-2 py-2 text-xs md:text-sm text-black focus:outline-none w-full rounded"
                      >
                        {TIPOS_VISITA.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-800 uppercase block">Técnico Asignado:</label>
                      <select
                        value={tecnicoAsignado}
                        onChange={(e) => setTecnicoAsignado(e.target.value)}
                        className="bg-white border-2 border-gray-500 font-bold px-2 py-2 text-xs md:text-sm text-black focus:outline-none w-full rounded"
                      >
                        {TECNICOS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fecha y Bloque Horario */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-800 uppercase block">Fecha Programada:</label>
                      <input
                        type="date"
                        value={fechaCita}
                        onChange={(e) => setFechaCita(e.target.value)}
                        className="bg-white border-2 border-gray-500 font-bold px-2 py-1.5 text-xs md:text-sm text-black focus:outline-none w-full rounded"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-800 uppercase block">Bloque Horario:</label>
                      <select
                        value={bloqueHorario}
                        onChange={(e: any) => setBloqueHorario(e.target.value)}
                        className="bg-white border-2 border-gray-500 font-bold px-1.5 py-2 text-xs text-black focus:outline-none w-full rounded"
                      >
                        {BLOQUES_HORARIOS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Teléfono de Contacto */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-800 uppercase block">Teléfono Contacto (WhatsApp):</label>
                    <input
                      type="text"
                      value={telefonoContacto}
                      onChange={(e) => setTelefonoContacto(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="bg-white border-2 border-gray-500 font-bold px-3 py-2 text-xs md:text-sm text-black select-text focus:outline-none w-full rounded"
                    />
                  </div>

                  {/* Problema Reportado */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-800 uppercase block">Requerimiento / Falla Reportada:</label>
                    <textarea
                      value={problemaReportado}
                      onChange={(e) => setProblemaReportado(e.target.value)}
                      placeholder="Ej: Cambio de batería 12V 7Ah en panel DSC y revisión de zona 03..."
                      className="bg-white border-2 border-gray-500 font-bold px-3 py-2 text-xs md:text-sm text-black select-text focus:outline-none w-full h-24 resize-none rounded"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCrearOrden}
                  className="bg-[#000080] text-white hover:bg-blue-900 border-2 border-t-white border-l-white border-b-gray-900 border-r-gray-900 w-full py-3 font-black text-xs md:text-sm cursor-pointer active:translate-y-0.5 mt-4 shadow-lg rounded"
                >
                  ➕ AGENDAR ORDEN & NOTIFICAR POR WA
                </button>
              </div>

              {/* Listado de Órdenes Derecha (AMPLIADO Y AMPLIAS TABLAS) */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 p-3 shadow-inner">
                <div className="bg-[#000080] text-white text-xs md:text-sm font-black px-3 py-1.5 uppercase tracking-wider mb-3 flex justify-between items-center rounded-sm">
                  <span>📋 Listado de Órdenes de Trabajo Activas ({ordenes.length})</span>
                  <button onClick={cargarOrdenes} className="hover:text-yellow-300 text-xs font-black cursor-pointer flex items-center gap-1">
                    <span>🔄</span>
                    <span>ACTUALIZAR TABLA</span>
                  </button>
                </div>

                <div className="flex-1 overflow-auto border-2 border-gray-500 bg-white rounded">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-[#d4d0c8] text-black sticky top-0 border-b-2 border-gray-400 font-black z-10">
                        <th className="p-2.5 border-r border-gray-400 text-center w-28">OT / FECHA</th>
                        <th className="p-2.5 border-r border-gray-400 text-center w-24">ESTADO</th>
                        <th className="p-2.5 border-r border-gray-400 text-center w-16">CLIENTE</th>
                        <th className="p-2.5 border-r border-gray-400">ABONADO</th>
                        <th className="p-2.5 border-r border-gray-400">TIPO / TÉCNICO</th>
                        <th className="p-2.5 border-r border-gray-400">FALLA / TRABAJO REPORTADO</th>
                        <th className="p-2.5 text-center w-24">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                      {ordenes.map(o => (
                        <tr key={o.id} className="hover:bg-blue-50 transition-colors">
                          <td className="p-2.5 border-r border-gray-300 text-center">
                            <span className="font-black font-mono text-blue-900 text-xs md:text-sm block">{o.codigo_ot || `OT-${o.id.toString().slice(-4)}`}</span>
                            <span className="text-[11px] text-gray-500 font-bold block">{o.fecha_cita}</span>
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-center font-bold">
                            <span className={`px-2.5 py-1 rounded text-xs font-black whitespace-nowrap block ${
                              o.estado === 'Completada' ? 'bg-emerald-100 text-emerald-900 border border-emerald-400' :
                              o.estado === 'En Terreno' ? 'bg-purple-100 text-purple-900 border border-purple-400' :
                              o.estado === 'En Traslado' ? 'bg-amber-100 text-amber-900 border border-amber-400' :
                              'bg-blue-100 text-blue-900 border border-blue-400'
                            }`}>
                              {o.estado.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-center font-mono font-black text-xs md:text-sm">{o.cuenta}</td>
                          <td className="p-2.5 border-r border-gray-300 font-black truncate max-w-[180px] uppercase text-xs md:text-sm">{o.nombre_abonado}</td>
                          <td className="p-2.5 border-r border-gray-300">
                            <span className="font-black text-gray-900 block text-xs">{o.tipo_visita || 'Correctiva'}</span>
                            <span className="text-gray-600 font-bold text-[11px]">{o.tecnico}</span>
                          </td>
                          <td className="p-2.5 border-r border-gray-300 max-w-[260px] truncate font-medium text-xs md:text-sm" title={o.problema}>{o.problema}</td>
                          <td className="p-2.5 text-center flex items-center justify-center gap-1.5 pt-3">
                            {o.estado === 'Completada' && (
                              <button
                                onClick={() => setOrdenImprimir(o)}
                                className="bg-blue-700 hover:bg-blue-800 text-white border border-blue-600 px-2 py-1 text-xs font-bold rounded cursor-pointer"
                                title="Ver / Imprimir Comprobante Oficial PDF"
                              >
                                📄 PDF
                              </button>
                            )}
                            <button
                              onClick={() => handleEliminarOrden(o.id)}
                              className="bg-red-700 hover:bg-red-600 text-white border border-red-500 px-2 py-1 text-xs font-bold rounded cursor-pointer"
                              title="Eliminar Orden de Trabajo"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                      {ordenes.length === 0 && !cargando && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-gray-400 italic text-sm">No hay órdenes de trabajo registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PORTAL / SIMULADOR TÉCNICO EN TERRENO */}
          {tabActive === 'tecnico_movil' && (
            <div className="flex-1 flex flex-col md:flex-row gap-5 overflow-hidden min-h-0">
              
              {/* Selector de técnico en simulador */}
              <div className="w-full md:w-[320px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 p-3 flex flex-col space-y-3 shrink-0">
                <div className="bg-[#000080] text-white text-xs font-black px-2 py-1 uppercase text-center">
                  👨‍🔧 Selección de Técnico
                </div>
                <select
                  value={tecnicoSimulado}
                  onChange={(e) => {
                    setTecnicoSimulado(e.target.value)
                    setOrdenSeleccionada(null)
                  }}
                  className="bg-white border-2 border-gray-500 font-black p-2 text-xs md:text-sm text-black focus:outline-none w-full rounded"
                >
                  {TECNICOS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <div className="flex-1 overflow-y-auto space-y-2">
                  <span className="text-xs font-black text-gray-800 uppercase block">Órdenes del Técnico ({ordenesTécnico.length}):</span>
                  {ordenesTécnico.map(o => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setOrdenSeleccionada(o)
                        setNovedadTexto(o.novedad || '')
                        setRepuestosTexto(o.repuestos_utilizados || '')
                        setNombreFirmanteText(o.nombre_firmante || '')
                      }}
                      className={`p-2.5 border-2 rounded text-xs cursor-pointer ${
                        ordenSeleccionada?.id === o.id ? 'bg-blue-900 text-white border-blue-950 font-bold' : 'bg-white text-black border-gray-400 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-black flex justify-between">
                        <span>{o.codigo_ot || `OT-${o.id}`}</span>
                        <span>{o.cuenta}</span>
                      </div>
                      <div className="truncate text-[11px] font-bold">{o.nombre_abonado}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vista Móvil Terreno */}
              <div className="flex-1 bg-slate-900 border-2 border-gray-700 p-4 rounded overflow-y-auto text-white">
                {ordenSeleccionada ? (
                  <div className="space-y-4 max-w-lg mx-auto">
                    <h3 className="text-base font-black text-blue-400 border-b border-slate-700 pb-2">
                      Atención #{ordenSeleccionada.codigo_ot || ordenSeleccionada.id} — {ordenSeleccionada.nombre_abonado}
                    </h3>
                    
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs space-y-1">
                      <div><strong>Cuenta:</strong> {ordenSeleccionada.cuenta}</div>
                      <div><strong>Dirección:</strong> {ordenSeleccionada.direccion}</div>
                      <div><strong>Falla Reportada:</strong> {ordenSeleccionada.problema}</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300">Trabajo Realizado en Terreno:</label>
                      <textarea
                        value={novedadTexto}
                        onChange={(e) => setNovedadTexto(e.target.value)}
                        className="bg-slate-950 border border-slate-700 p-2 text-xs text-white w-full h-20 rounded"
                        placeholder="Descripción de trabajos..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300">Repuestos Utilizados:</label>
                      <input
                        type="text"
                        value={repuestosTexto}
                        onChange={(e) => setRepuestosTexto(e.target.value)}
                        className="bg-slate-950 border border-slate-700 p-2 text-xs text-white w-full rounded"
                        placeholder="Ej: Batería 12V 7Ah..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300">Nombre de quien recibe:</label>
                      <input
                        type="text"
                        value={nombreFirmanteText}
                        onChange={(e) => setNombreFirmanteText(e.target.value)}
                        className="bg-slate-950 border border-slate-700 p-2 text-xs text-white w-full rounded"
                        placeholder="Nombre completo..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Firma Touch:</label>
                      <div className="bg-white p-1 rounded">
                        <canvas
                          ref={canvasRef}
                          width={340}
                          height={110}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full cursor-crosshair bg-white rounded"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleFinalizarOrden}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-xs uppercase"
                    >
                      ✔️ FINALIZAR Y GENERAR COMPROBANTE
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-16 text-sm italic">
                    Seleccione una orden de trabajo de la lista para simular la atención.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Visor Modal Comprobante Imprimible */}
      {ordenImprimir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-[750px] bg-white text-black p-6 font-sans shadow-2xl rounded-2xl border border-gray-400 max-h-[95vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b-2 border-blue-900 pb-3 mb-4">
              <div>
                <h1 className="text-xl font-black text-blue-950 tracking-wider">GAMA SEGURIDAD 24/7</h1>
                <p className="text-xs text-gray-600 font-bold">Comprobante de Servicio Técnico en Terreno</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-blue-900 text-white font-mono text-base font-black px-3 py-1 rounded">
                  {ordenImprimir.codigo_ot || `OT-${ordenImprimir.id}`}
                </span>
                <p className="text-xs text-gray-600 mt-1 font-bold">Fecha: {ordenImprimir.fecha_cierre || ordenImprimir.fecha_cita}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-xs md:text-sm space-y-1.5">
              <div><strong>Código de Cliente:</strong> <span className="font-mono font-black text-blue-900">{ordenImprimir.cuenta}</span></div>
              <div><strong>Nombre del Abonado:</strong> {ordenImprimir.nombre_abonado}</div>
              <div><strong>Dirección de Atención:</strong> {ordenImprimir.direccion}</div>
              <div><strong>Teléfono:</strong> {ordenImprimir.telefono_contacto || 'N/A'}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-xs md:text-sm space-y-1.5">
              <div><strong>Trabajo Realizado:</strong> {ordenImprimir.novedad}</div>
              {ordenImprimir.repuestos_utilizados && <div><strong>Repuestos:</strong> {ordenImprimir.repuestos_utilizados}</div>}
              <div><strong>Técnico:</strong> {ordenImprimir.tecnico}</div>
            </div>

            {ordenImprimir.firma && (
              <div className="border border-gray-300 p-3 rounded-xl bg-slate-50 mb-4 text-xs md:text-sm">
                <span className="font-bold block text-gray-700 mb-1.5">Recepción / Firma Cliente: {ordenImprimir.nombre_firmante}</span>
                <img src={ordenImprimir.firma} alt="Firma" className="h-16 border border-gray-400 bg-white px-2 rounded" />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setOrdenImprimir(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 font-black text-xs md:text-sm rounded-xl hover:bg-gray-400 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-900 text-white font-black text-xs md:text-sm rounded-xl hover:bg-blue-950 shadow cursor-pointer"
              >
                🖨️ Imprimir PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
