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

export interface EventoAlarma {
  id: number
  fecha_hora: string
  cuenta: string
  nombre_abonado: string
  evento: string
  zona: string
  usuario: string
}

const TECNICOS = ['Juan Pérez', 'Diego Reyes', 'Mauricio Tapia', 'Cristian Muñoz']

export default function PortalTecnicoMovil() {
  const [tecnicoActivo, setTecnicoActivo] = useState<string>(TECNICOS[0])
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajo | null>(null)
  const [cargando, setCargando] = useState(false)

  // Navegación del Menú Principal (Nombres profesionales sin siglas)
  const [menuSeccion, setMenuSeccion] = useState<'ordenes_pendientes' | 'servicios_realizados' | 'eventos_alarma' | 'perfil'>('ordenes_pendientes')

  // Monitor de Eventos de Alarma (Solo Lectura)
  const [eventosAlarma, setEventosAlarma] = useState<EventoAlarma[]>([])
  const [cargandoEventos, setCargandoEventos] = useState(false)
  const [filtroCuentaAlarma, setFiltroCuentaAlarma] = useState('')

  // Formulario terreno
  const [novedadTexto, setNovedadTexto] = useState('')
  const [repuestosTexto, setRepuestosTexto] = useState('')
  const [nombreFirmanteText, setNombreFirmanteText] = useState('')

  // Canvas Firma Touch
  const [firmando, setFirmando] = useState(false)
  const [firmaImagen, setFirmaImagen] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Visor de Comprobante Imprimible
  const [ordenImprimir, setOrdenImprimir] = useState<OrdenTrabajo | null>(null)

  // Cargar órdenes de trabajo
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

  // Cargar eventos de alarma en tiempo real (Sólo Lectura)
  const cargarEventosAlarma = async () => {
    setCargandoEventos(true)
    try {
      const { data } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .not('cuenta', 'in', '("ORDENES_TRABAJO","CONFIGURACION")')
        .order('id', { ascending: false })
        .limit(50)

      if (data) {
        setEventosAlarma(data)
      }
    } catch (err) {
      console.error('Error cargando eventos:', err)
    } finally {
      setCargandoEventos(false)
    }
  }

  useEffect(() => {
    cargarOrdenes()
  }, [])

  // Suscripción Realtime para Monitor de Eventos (Solo Lectura)
  useEffect(() => {
    if (menuSeccion === 'eventos_alarma') {
      cargarEventosAlarma()
      const channel = supabase
        .channel('realtime_eventos_tecnico')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos_monitoreo' }, payload => {
          const newEv = payload.new as EventoAlarma
          if (newEv && !['ORDENES_TRABAJO', 'CONFIGURACION'].includes(newEv.cuenta)) {
            setEventosAlarma(prev => [newEv, ...prev.slice(0, 49)])
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [menuSeccion])

  // Guardar en Supabase
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

  // Notificación de WhatsApp al Cliente
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

  // Transición de estado de la atención
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

  // Canvas Handlers Touch & Mouse
  useEffect(() => {
    if (ordenSeleccionada && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000080'
        ctx.lineWidth = 2.5
      }
    }
  }, [ordenSeleccionada])

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

  // Finalizar Orden
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

      alert('🎉 ¡Orden de trabajo completada y notificada con éxito!')
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

  // Filtrado por técnico asignado
  const ordenesTécnico = ordenes.filter(o => o.tecnico === tecnicoActivo)
  const ordenesPendientes = ordenesTécnico.filter(o => o.estado !== 'Completada' && o.estado !== 'Cancelada')
  const ordenesCompletadas = ordenesTécnico.filter(o => o.estado === 'Completada')

  // Filtrado de eventos de alarma
  const eventosFiltrados = eventosAlarma.filter(e => 
    !filtroCuentaAlarma || 
    e.cuenta.toLowerCase().includes(filtroCuentaAlarma.toLowerCase()) ||
    (e.nombre_abonado || '').toLowerCase().includes(filtroCuentaAlarma.toLowerCase()) ||
    e.evento.toLowerCase().includes(filtroCuentaAlarma.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans max-w-md mx-auto shadow-2xl relative border-x border-slate-800 pb-16">
      
      {/* Top Header App Bar */}
      <header className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 p-3 border-b border-blue-800/40 sticky top-0 z-30 shadow-lg flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <div>
              <h1 className="text-xs font-black tracking-wider text-blue-400 uppercase">GAMA SEGURIDAD 24/7</h1>
              <p className="text-[10px] text-slate-300 font-bold">Módulo Técnico en Terreno PWA</p>
            </div>
          </div>
          <button 
            onClick={() => {
              cargarOrdenes()
              if (menuSeccion === 'eventos_alarma') cargarEventosAlarma()
            }}
            className="bg-blue-900/60 hover:bg-blue-800 text-blue-200 p-1.5 rounded-lg border border-blue-700/50 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span>🔄</span>
            <span>{cargando || cargandoEventos ? '...' : 'Actualizar'}</span>
          </button>
        </div>

        {/* Selector Profesional de Técnico */}
        <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">👨‍🔧 Técnico Activo:</span>
          <select
            value={tecnicoActivo}
            onChange={(e) => {
              setTecnicoActivo(e.target.value)
              setOrdenSeleccionada(null)
            }}
            className="bg-blue-950 text-blue-100 font-bold px-2 py-1 rounded text-xs border border-blue-700 focus:outline-none"
          >
            {TECNICOS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Body View */}
      <main className="flex-1 p-3 flex flex-col space-y-3 overflow-y-auto">

        {/* SECCIÓN 1: ÓRDENES PENDIENTES */}
        {menuSeccion === 'ordenes_pendientes' && (
          <div className="space-y-3">
            {ordenSeleccionada ? (
              /* DETALLE Y EJECUCIÓN DE ATENCIÓN TÉCNICA */
              <div className="space-y-3 animate-fadeIn">
                
                <button
                  onClick={() => setOrdenSeleccionada(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>◀</span>
                  <span>Volver a Órdenes Pendientes</span>
                </button>

                {/* Datos del Cliente */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 space-y-2 shadow-lg">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-xs font-black text-blue-400 font-mono block">
                        #{ordenSeleccionada.codigo_ot || `OT-${ordenSeleccionada.id}`}
                      </span>
                      <span className="text-[10px] text-slate-400">{ordenSeleccionada.fecha_cita} • {ordenSeleccionada.bloque_horario}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      ordenSeleccionada.estado === 'Completada' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                      ordenSeleccionada.estado === 'En Terreno' ? 'bg-purple-950 text-purple-300 border border-purple-700' :
                      ordenSeleccionada.estado === 'En Traslado' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                      'bg-blue-950 text-blue-300 border border-blue-700'
                    }`}>
                      {ordenSeleccionada.estado}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 pt-1">
                    <div><span className="text-slate-400 font-semibold">Código de Cliente:</span> <strong className="font-mono text-blue-300">{ordenSeleccionada.cuenta}</strong></div>
                    <div><span className="text-slate-400 font-semibold">Nombre del Abonado:</span> <strong>{ordenSeleccionada.nombre_abonado}</strong></div>
                    
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <div className="max-w-[70%]">
                        <span className="text-[10px] text-slate-400 block font-bold">DIRECCIÓN DE ATENCIÓN:</span>
                        <span className="text-xs font-bold text-slate-200 leading-tight block">{ordenSeleccionada.direccion}</span>
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(ordenSeleccionada.direccion)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md border border-blue-400 shadow shrink-0 flex items-center gap-1"
                      >
                        <span>📍</span>
                        <span>Navegar</span>
                      </a>
                    </div>

                    {ordenSeleccionada.telefono_contacto && (
                      <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">TELÉFONO DE CONTACTO:</span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">{ordenSeleccionada.telefono_contacto}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <a
                            href={`tel:${ordenSeleccionada.telefono_contacto}`}
                            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] px-2 py-1 rounded border border-emerald-500"
                          >
                            📞 Llamar
                          </a>
                          <a
                            href={`https://wa.me/${ordenSeleccionada.telefono_contacto.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-green-600 hover:bg-green-500 text-white font-bold text-[10px] px-2 py-1 rounded border border-green-400"
                          >
                            💬 Chat WA
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="bg-amber-950/40 border border-amber-800/60 p-2 rounded-lg text-amber-200 text-xs">
                      <span className="font-bold block text-[10px] uppercase text-amber-400">⚠️ Requerimiento / Falla Reportada:</span>
                      <p className="mt-0.5 leading-relaxed">{ordenSeleccionada.problema}</p>
                    </div>
                  </div>
                </div>

                {/* Controles de Estado Operativo con GPS y WhatsApp */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wide block border-b border-slate-800 pb-1">
                    🚦 Estado de la Atención & Geolocalización:
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={async () => {
                        const eta = prompt('Tiempo estimado de llegada (ETA en minutos):', '15') || '15'
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            const coords = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`
                            cambiarEstadoOrden(ordenSeleccionada.id, 'En Traslado')
                            if (ordenSeleccionada.telefono_contacto) {
                              const msg = `🚚 *GAMA SEGURIDAD 24/7 - Técnico en camino*\n\nEstimado cliente, el técnico *${ordenSeleccionada.tecnico}* va en camino a su domicilio (*${ordenSeleccionada.direccion}*).\n\n• *ETA Estimado:* ~${eta} minutos\n• *Orden:* #${ordenSeleccionada.codigo_ot || ordenSeleccionada.id}\n• *Ubicación GPS:* https://maps.google.com/?q=${coords}\n\nQuedamos atentos a su recepción.`
                              enviarNotificacionWhatsApp(ordenSeleccionada.telefono_contacto, msg)
                            }
                          }, () => {
                            cambiarEstadoOrden(ordenSeleccionada.id, 'En Traslado')
                            if (ordenSeleccionada.telefono_contacto) {
                              const msg = `🚚 *GAMA SEGURIDAD 24/7 - Técnico en camino*\n\nEstimado cliente, el técnico *${ordenSeleccionada.tecnico}* va en camino a su domicilio (*${ordenSeleccionada.direccion}*).\n\n• *ETA Estimado:* ~${eta} minutos\n• *Orden:* #${ordenSeleccionada.codigo_ot || ordenSeleccionada.id}`
                              enviarNotificacionWhatsApp(ordenSeleccionada.telefono_contacto, msg)
                            }
                          })
                        } else {
                          cambiarEstadoOrden(ordenSeleccionada.id, 'En Traslado')
                        }
                      }}
                      className={`py-2 px-2 font-bold text-xs rounded-lg border cursor-pointer transition-colors shadow ${
                        ordenSeleccionada.estado === 'En Traslado'
                          ? 'bg-amber-500 text-black border-amber-300 font-extrabold'
                          : 'bg-slate-800 text-amber-300 border-amber-800/50 hover:bg-slate-700'
                      }`}
                    >
                      🚗 EN TRASLADO (+WA ETA)
                    </button>

                    <button
                      onClick={() => {
                        cambiarEstadoOrden(ordenSeleccionada.id, 'En Terreno')
                        if (ordenSeleccionada.telefono_contacto) {
                          const msg = `📍 *GAMA SEGURIDAD 24/7 - Técnico en Domicilio*\n\nNuestro técnico *${ordenSeleccionada.tecnico}* ha arribado a su domicilio (*${ordenSeleccionada.direccion}*) para iniciar la atención de la OT *#${ordenSeleccionada.codigo_ot || ordenSeleccionada.id}*.`
                          enviarNotificacionWhatsApp(ordenSeleccionada.telefono_contacto, msg)
                        }
                      }}
                      className={`py-2 px-2 font-bold text-xs rounded-lg border cursor-pointer transition-colors shadow ${
                        ordenSeleccionada.estado === 'En Terreno'
                          ? 'bg-purple-600 text-white border-purple-300 font-extrabold'
                          : 'bg-slate-800 text-purple-300 border-purple-800/50 hover:bg-slate-700'
                      }`}
                    >
                      📍 EN TERRENO (+WA LLEGADA)
                    </button>
                  </div>
                </div>

                {/* Checklist Pruebas de Zonificación en Terreno */}
                <div className="bg-slate-900 border border-blue-900/60 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                    <span className="text-xs font-black text-blue-300 uppercase">📋 Checklist Pruebas de Sensores</span>
                    <span className="text-[9px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded font-bold border border-blue-800">EN VIVO</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {['ZONA 01: PIR Living', 'ZONA 02: Magnético Puerta Principal', 'ZONA 03: PIR Comedor / Pasillo', 'ZONA 04: Humo / Temperatura Cocina'].map((z) => (
                      <div key={z} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <span className="font-bold text-slate-200 text-xs">{z}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            const btn = e.currentTarget
                            btn.innerText = '✅ TEST OK'
                            btn.className = 'bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-1 rounded-md border border-emerald-400'
                          }}
                          className="bg-blue-700 hover:bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-blue-500 cursor-pointer"
                        >
                          ⚡ PROBAR SENSOR
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulario Cierre & Firma */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 space-y-3">
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wide block border-b border-slate-800 pb-1">
                    📝 Informe de Trabajo & Cierre:
                  </span>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 uppercase block">Trabajo / Solución Realizada:</label>
                    <textarea
                      value={novedadTexto}
                      onChange={(e) => setNovedadTexto(e.target.value)}
                      placeholder="Describa los trabajos ejecutados, cambios de batería o revisión de sensores..."
                      className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white w-full h-20 resize-none focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 uppercase block">Repuestos / Baterías Cambiadas:</label>
                    <input
                      type="text"
                      value={repuestosTexto}
                      onChange={(e) => setRepuestosTexto(e.target.value)}
                      placeholder="Ej: 1 Batería 12V 7Ah Ritar, 1 Sensor PIR DSC..."
                      className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white w-full focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 uppercase block">Nombre del Cliente / Firmante:</label>
                    <input
                      type="text"
                      value={nombreFirmanteText}
                      onChange={(e) => setNombreFirmanteText(e.target.value)}
                      placeholder="Nombre y apellido de quien recibe en domicilio..."
                      className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white w-full focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Dibujar Firma Touch Digital */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300 uppercase">Firma Digital del Cliente:</label>
                      <button onClick={clearFirma} className="text-[10px] text-red-400 font-bold hover:underline">LIMPIAR</button>
                    </div>
                    <div className="touch-none bg-white rounded-lg border-2 border-slate-600 p-1">
                      <canvas
                        ref={canvasRef}
                        width={320}
                        height={100}
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
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl border border-emerald-400 shadow-xl cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-transform"
                  >
                    <span>✔️</span>
                    <span>FINALIZAR Y ENVIAR COMPROBANTE WA</span>
                  </button>
                </div>

              </div>
            ) : (
              /* LISTA DE TRABAJOS PENDIENTES */
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-xs font-black text-slate-200 uppercase">📋 Órdenes Pendientes ({ordenesPendientes.length})</span>
                  <span className="text-[10px] text-blue-400 font-bold">{tecnicoActivo}</span>
                </div>

                <div className="space-y-2.5">
                  {ordenesPendientes.map(o => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setOrdenSeleccionada(o)
                        setNovedadTexto(o.novedad || '')
                        setRepuestosTexto(o.repuestos_utilizados || '')
                        setNombreFirmanteText(o.nombre_firmante || '')
                      }}
                      className={`bg-slate-900 border rounded-xl p-3.5 cursor-pointer hover:border-blue-500 transition-all shadow-md space-y-2 relative overflow-hidden ${
                        o.estado === 'En Terreno' ? 'border-purple-600 bg-purple-950/30' :
                        o.estado === 'En Traslado' ? 'border-amber-500 bg-amber-950/30' : 'border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                        <span className="font-mono text-xs font-black text-blue-400">#{o.codigo_ot || `OT-${o.id}`}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          o.estado === 'En Terreno' ? 'bg-purple-950 text-purple-300 border border-purple-700' :
                          o.estado === 'En Traslado' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                          'bg-blue-950 text-blue-300 border border-blue-700'
                        }`}>
                          {o.estado}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white flex justify-between">
                          <span>Cliente: <span className="font-mono text-blue-300">{o.cuenta}</span></span>
                          <span className="text-[10px] text-slate-400">{o.tipo_visita || 'Correctiva'}</span>
                        </div>
                        <div className="text-xs font-black text-slate-100 uppercase truncate">{o.nombre_abonado}</div>
                        <div className="text-[11px] text-slate-300 truncate font-medium">📍 {o.direccion}</div>
                        <div className="text-[10px] text-amber-200/90 italic truncate">⚠️ {o.problema}</div>
                      </div>

                      <div className="pt-1 flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-800">
                        <span>📅 Cita: {o.fecha_cita}</span>
                        <span className="text-blue-400 flex items-center gap-1">
                          <span>Iniciar Atención</span>
                          <span>➔</span>
                        </span>
                      </div>
                    </div>
                  ))}

                  {ordenesPendientes.length === 0 && !cargando && (
                    <div className="text-center text-slate-400 italic py-16 bg-slate-900/50 rounded-xl border border-slate-800 text-xs">
                      No tienes órdenes pendientes asignadas para hoy.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 2: SERVICIOS REALIZADOS */}
        {menuSeccion === 'servicios_realizados' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
              <span className="text-xs font-black text-emerald-400 uppercase">✅ Servicios Realizados ({ordenesCompletadas.length})</span>
              <span className="text-[10px] text-slate-400 font-bold">{tecnicoActivo}</span>
            </div>

            <div className="space-y-2.5">
              {ordenesCompletadas.map(o => (
                <div
                  key={o.id}
                  className="bg-slate-900 border border-emerald-800/60 bg-emerald-950/20 rounded-xl p-3.5 shadow-md space-y-2"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <span className="font-mono text-xs font-black text-emerald-400">#{o.codigo_ot || `OT-${o.id}`}</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-extrabold">COMPLETADA</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div><span className="text-slate-400">Cliente:</span> <strong className="font-mono text-blue-300">{o.cuenta}</strong> - {o.nombre_abonado}</div>
                    <div className="text-slate-300"><strong>Trabajo:</strong> {o.novedad}</div>
                    {o.repuestos_utilizados && <div className="text-slate-400"><strong>Repuestos:</strong> {o.repuestos_utilizados}</div>}
                    <div className="text-[10px] text-slate-500">Cierre: {o.fecha_cierre || o.fecha_cita} • Recepción: {o.nombre_firmante || 'Cliente'}</div>
                  </div>
                  <button
                    onClick={() => setOrdenImprimir(o)}
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-1.5 rounded-lg border border-blue-700 text-xs flex items-center justify-center gap-1 cursor-pointer mt-1"
                  >
                    <span>📄</span>
                    <span>Ver Comprobante Firmado</span>
                  </button>
                </div>
              ))}

              {ordenesCompletadas.length === 0 && (
                <div className="text-center text-slate-400 italic py-16 bg-slate-900/50 rounded-xl border border-slate-800 text-xs">
                  No hay servicios realizados registrados para {tecnicoActivo}.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN 3: MONITOR DE EVENTOS DE ALARMA (SOLO LECTURA) */}
        {menuSeccion === 'eventos_alarma' && (
          <div className="space-y-3">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🚨</span>
                  <span className="text-xs font-black text-red-400 uppercase tracking-wide">Monitor de Eventos de Alarma</span>
                </div>
                <span className="text-[8px] bg-red-950 text-red-300 border border-red-700 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                  🔒 SÓLO LECTURA
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Visualizador de señales de sensores y pruebas en tiempo real para auditoría en terreno sin permisos de edición.
              </p>

              {/* Buscador de cuenta o evento */}
              <input
                type="text"
                value={filtroCuentaAlarma}
                onChange={(e) => setFiltroCuentaAlarma(e.target.value)}
                placeholder="Filtrar por código de cliente o tipo de evento..."
                className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white w-full focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              {eventosFiltrados.map(ev => (
                <div key={ev.id} className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs flex items-center justify-between hover:border-slate-700">
                  <div className="space-y-0.5 max-w-[75%]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-blue-400">{ev.cuenta}</span>
                      <span className="text-[10px] font-bold text-slate-300 truncate">{ev.nombre_abonado}</span>
                    </div>
                    <div className={`font-mono text-[11px] font-extrabold ${
                      ev.evento.includes('ALARMA') || ev.evento.includes('ROBO') ? 'text-red-400' :
                      ev.evento.includes('RESTAURA') ? 'text-emerald-400' : 'text-amber-300'
                    }`}>
                      {ev.evento} {ev.zona && ev.zona !== 'S/T' ? `[ZONA ${ev.zona}]` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-mono text-slate-400 block">{ev.fecha_hora ? ev.fecha_hora.slice(11, 19) : ''}</span>
                    <span className="text-[8px] text-slate-500 block">{ev.fecha_hora ? ev.fecha_hora.slice(0, 10) : ''}</span>
                  </div>
                </div>
              ))}

              {eventosFiltrados.length === 0 && !cargandoEventos && (
                <div className="text-center text-slate-400 italic py-16 bg-slate-900/50 rounded-xl border border-slate-800 text-xs">
                  No hay eventos de alarma registrados para la búsqueda.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN 4: PERFIL DEL TÉCNICO */}
        {menuSeccion === 'perfil' && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-12 h-12 bg-blue-900 text-blue-200 rounded-full flex items-center justify-center text-xl font-bold border border-blue-700">
                  👨‍🔧
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">{tecnicoActivo}</h3>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Técnico de Terreno Activo</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Órdenes Pendientes:</span>
                  <strong className="text-amber-400 font-mono">{ordenesPendientes.length}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Servicios Completados:</span>
                  <strong className="text-emerald-400 font-mono">{ordenesCompletadas.length}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Estado de Conexión PWA:</span>
                  <strong className="text-blue-400">En Línea (Supabase Sync)</strong>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAVIGATION BAR (MENÚ PROFESIONAL DE NAVEGACIÓN) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950 border-t border-slate-800 grid grid-cols-4 z-40 text-[10px] shadow-2xl">
        
        <button
          onClick={() => { setMenuSeccion('ordenes_pendientes'); setOrdenSeleccionada(null); }}
          className={`py-2 flex flex-col items-center justify-center font-bold transition-colors cursor-pointer ${
            menuSeccion === 'ordenes_pendientes' ? 'text-blue-400 bg-slate-900 border-t-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-sm">📋</span>
          <span className="leading-tight">Pendientes</span>
        </button>

        <button
          onClick={() => { setMenuSeccion('servicios_realizados'); setOrdenSeleccionada(null); }}
          className={`py-2 flex flex-col items-center justify-center font-bold transition-colors cursor-pointer ${
            menuSeccion === 'servicios_realizados' ? 'text-emerald-400 bg-slate-900 border-t-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-sm">✅</span>
          <span className="leading-tight">Realizados</span>
        </button>

        <button
          onClick={() => { setMenuSeccion('eventos_alarma'); setOrdenSeleccionada(null); }}
          className={`py-2 flex flex-col items-center justify-center font-bold transition-colors cursor-pointer ${
            menuSeccion === 'eventos_alarma' ? 'text-red-400 bg-slate-900 border-t-2 border-red-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-sm">🚨</span>
          <span className="leading-tight">Eventos (Lectura)</span>
        </button>

        <button
          onClick={() => { setMenuSeccion('perfil'); setOrdenSeleccionada(null); }}
          className={`py-2 flex flex-col items-center justify-center font-bold transition-colors cursor-pointer ${
            menuSeccion === 'perfil' ? 'text-purple-400 bg-slate-900 border-t-2 border-purple-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-sm">👤</span>
          <span className="leading-tight">Mi Perfil</span>
        </button>

      </nav>

      {/* Visor Modal Comprobante Imprimible */}
      {ordenImprimir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3">
          <div className="w-full max-w-[650px] bg-white text-black p-5 font-sans shadow-2xl rounded-xl border border-gray-400 max-h-[95vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b-2 border-blue-900 pb-3 mb-3">
              <div>
                <h1 className="text-lg font-bold text-blue-950 tracking-wider">GAMA SEGURIDAD 24/7</h1>
                <p className="text-xs text-gray-600 font-semibold">Comprobante de Servicio Técnico en Terreno</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-blue-900 text-white font-mono text-sm font-bold px-2 py-0.5 rounded">
                  {ordenImprimir.codigo_ot || `OT-${ordenImprimir.id}`}
                </span>
                <p className="text-[10px] text-gray-500 mt-1">Fecha: {ordenImprimir.fecha_cierre || ordenImprimir.fecha_cita}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mb-3 text-xs space-y-1">
              <div><strong>Código de Cliente:</strong> <span className="font-mono font-bold text-blue-900">{ordenImprimir.cuenta}</span></div>
              <div><strong>Nombre del Abonado:</strong> {ordenImprimir.nombre_abonado}</div>
              <div><strong>Dirección de Atención:</strong> {ordenImprimir.direccion}</div>
              <div><strong>Teléfono:</strong> {ordenImprimir.telefono_contacto || 'N/A'}</div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mb-3 text-xs space-y-1">
              <div><strong>Trabajo Realizado:</strong> {ordenImprimir.novedad}</div>
              {ordenImprimir.repuestos_utilizados && <div><strong>Repuestos:</strong> {ordenImprimir.repuestos_utilizados}</div>}
              <div><strong>Técnico:</strong> {ordenImprimir.tecnico}</div>
            </div>

            {ordenImprimir.firma && (
              <div className="border border-gray-300 p-2 rounded bg-slate-50 mb-3 text-xs">
                <span className="font-bold block text-gray-700 mb-1">Recepción / Firma Cliente: {ordenImprimir.nombre_firmante}</span>
                <img src={ordenImprimir.firma} alt="Firma" className="h-14 border border-gray-400 bg-white px-2 rounded" />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setOrdenImprimir(null)}
                className="px-3 py-1 bg-gray-300 text-gray-800 font-bold text-xs rounded hover:bg-gray-400 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1 bg-blue-900 text-white font-bold text-xs rounded hover:bg-blue-950 shadow cursor-pointer"
              >
                🖨️ Imprimir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
