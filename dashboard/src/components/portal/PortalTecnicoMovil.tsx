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

const TECNICOS = [
  { nombre: 'Juan Pérez', cargo: 'Técnico Senior Sistemas Alarmas & CCTV', pin: '1234' },
  { nombre: 'Diego Reyes', cargo: 'Técnico Terreno Redes & Acceso', pin: '1234' },
  { nombre: 'Mauricio Tapia', cargo: 'Especialista en Automatización & Cercos', pin: '1234' },
  { nombre: 'Cristian Muñoz', cargo: 'Técnico Terreno Mantenimiento Preventivo', pin: '1234' },
]

function formatFechaHoraChile(fechaIso: string) {
  if (!fechaIso) return { hora: '--:--:--', fecha: '----' }
  try {
    let isoClean = fechaIso.trim()
    if (!isoClean.endsWith('Z') && !isoClean.includes('+')) {
      isoClean = isoClean.replace(' ', 'T') + 'Z'
    }
    const d = new Date(isoClean)
    if (isNaN(d.getTime())) return { hora: fechaIso.slice(11, 19), fecha: fechaIso.slice(0, 10) }

    const hora = d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Santiago'
    })

    const fecha = d.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Santiago'
    })

    return { hora, fecha }
  } catch (e) {
    return { hora: fechaIso.slice(11, 19), fecha: fechaIso.slice(0, 10) }
  }
}

export default function PortalTecnicoMovil() {
  // Autenticación Diaria & Cierre a Medianoche (00:00)
  const [tecnicoAutenticado, setTecnicoAutenticado] = useState<string | null>(null)
  const [pinIngresado, setPinIngresado] = useState('')
  const [tecnicoSeleccionadoLogin, setTecnicoSeleccionadoLogin] = useState(TECNICOS[0].nombre)
  const [errorLogin, setErrorLogin] = useState('')

  // Pantalla de Carga Splash Screen con Logo
  const [cargandoSplash, setCargandoSplash] = useState<boolean>(true)
  const [mensajeSplash, setMensajeSplash] = useState<string>('Iniciando Módulo Técnico...')

  // Navegación del Menú Principal
  const [menuSeccion, setMenuSeccion] = useState<'itinerario' | 'ordenes_pendientes' | 'servicios_realizados' | 'eventos_alarma' | 'perfil'>('itinerario')

  // Datos
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajo | null>(null)
  const [cargando, setCargando] = useState(false)

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

  // 1. Verificación de Sesión Diaria & Cierre Automático a las 00:00
  const verificarSesionDiaria = () => {
    const hoyStr = new Date().toISOString().slice(0, 10)
    const sesionGuardada = localStorage.getItem('gama_tecnico_sesion_diaria')
    if (sesionGuardada) {
      try {
        const parsed = JSON.parse(sesionGuardada)
        if (parsed.fecha === hoyStr && parsed.tecnico) {
          setTecnicoAutenticado(parsed.tecnico)
        } else {
          // Sesión vencida (pasaron las 00:00) -> Cerrar sesión
          localStorage.removeItem('gama_tecnico_sesion_diaria')
          setTecnicoAutenticado(null)
        }
      } catch (e) {
        setTecnicoAutenticado(null)
      }
    }
  }

  useEffect(() => {
    verificarSesionDiaria()
    const timerSplash = setTimeout(() => {
      setCargandoSplash(false)
    }, 1800)

    // Intervalo de seguridad que invalida la sesión exactamente al pasar las 00:00
    const checkMidnight = setInterval(() => {
      const hoyStr = new Date().toISOString().slice(0, 10)
      const sesion = localStorage.getItem('gama_tecnico_sesion_diaria')
      if (sesion) {
        try {
          const parsed = JSON.parse(sesion)
          if (parsed.fecha !== hoyStr) {
            localStorage.removeItem('gama_tecnico_sesion_diaria')
            setTecnicoAutenticado(null)
            alert('🌙 Ha iniciado un nuevo día laboral (00:00 hrs). Por favor inicie sesión diariamente.')
          }
        } catch {}
      }
    }, 15000)

    return () => {
      clearTimeout(timerSplash)
      clearInterval(checkMidnight)
    }
  }, [])

  // Cargar órdenes de trabajo desde Supabase
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

  // Filtro estricto de eventos internos, heartbeats y registros de sistema
  const esEventoInternoOHeartbeat = (cuentaRaw: string = '', eventoRaw: string = '') => {
    const c = (cuentaRaw || '').toUpperCase().trim()
    const e = (eventoRaw || '').toUpperCase().trim()
    if (c.startsWith('CAMARAS_DAHUA_') || c.startsWith('DAHUA_FRAME_') || c.startsWith('DAHUA_STREAM_REQ_') || c.startsWith('SNAPSHOT_') || c.startsWith('CLIP_') || c.startsWith('CONFIG_WHATSAPP_')) return true
    if (['CLIENTES', 'CODIGOS', 'ZONAS', '__SINCRONIZADOR__', 'EMPRESAS_CONGLOMERADO', 'COTIZACIONES_DOLIBARR', 'ORDENES_TRABAJO', 'CONFIG_OPERADORES', 'CLIENTES_MAESTROS_CRM', 'CONFIGURACION'].includes(c)) return true
    if (['ELIMINACION_DAHUA_CRUD', 'GENERACION_NVR_MULTICANAL', 'FRAME_SYNC', 'NVR_DVR_FRAME_SYNC', 'CAMERA_FRAME_SYNC', 'STREAM_REQ', 'SNAPSHOT_OPERADOR', 'CLIP_VIDEO_OPERADOR', 'HEARTBEAT'].includes(e)) return true
    return false
  }

  // Cargar eventos de alarma reales de clientes en tiempo real (Sólo Lectura)
  const cargarEventosAlarma = async () => {
    setCargandoEventos(true)
    try {
      const { data } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .not('cuenta', 'in', '("ORDENES_TRABAJO","CONFIGURACION","__SINCRONIZADOR__","ZONAS","CLIENTES","CODIGOS")')
        .not('evento', 'eq', 'HEARTBEAT')
        .order('id', { ascending: false })
        .limit(100)

      if (data) {
        const clienteEvs = data.filter(e => !esEventoInternoOHeartbeat(e.cuenta, e.evento))
        setEventosAlarma(clienteEvs.slice(0, 50))
      }
    } catch (err) {
      console.error('Error cargando eventos:', err)
    } finally {
      setCargandoEventos(false)
    }
  }

  useEffect(() => {
    if (tecnicoAutenticado) {
      cargarOrdenes()
    }
  }, [tecnicoAutenticado])

  // Suscripción Realtime para Monitor de Eventos de Clientes (Solo Lectura)
  useEffect(() => {
    if (menuSeccion === 'eventos_alarma' && tecnicoAutenticado) {
      cargarEventosAlarma()
      const channel = supabase
        .channel('realtime_eventos_tecnico')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos_monitoreo' }, payload => {
          const newEv = payload.new as EventoAlarma
          if (newEv && !esEventoInternoOHeartbeat(newEv.cuenta, newEv.evento)) {
            setEventosAlarma(prev => [newEv, ...prev.filter(e => e.id !== newEv.id)].slice(0, 50))
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [menuSeccion, tecnicoAutenticado])

  // Login del Técnico
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorLogin('')
    const tFound = TECNICOS.find(t => t.nombre === tecnicoSeleccionadoLogin)
    if (tFound) {
      const hoyStr = new Date().toISOString().slice(0, 10)
      localStorage.setItem('gama_tecnico_sesion_diaria', JSON.stringify({
        tecnico: tFound.nombre,
        fecha: hoyStr
      }))
      setTecnicoAutenticado(tFound.nombre)
      setCargandoSplash(true)
      setMensajeSplash(`Bienvenido, ${tFound.nombre}...`)
      setTimeout(() => setCargandoSplash(false), 1200)
    }
  }

  // Logout del Técnico
  const handleLogout = () => {
    localStorage.removeItem('gama_tecnico_sesion_diaria')
    setTecnicoAutenticado(null)
    setOrdenSeleccionada(null)
  }

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
        ctx.lineWidth = 3
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

  // Filtrado de órdenes por técnico activo
  const ordenesTécnico = ordenes.filter(o => o.tecnico === tecnicoAutenticado)
  const ordenesPendientes = ordenesTécnico.filter(o => o.estado !== 'Completada' && o.estado !== 'Cancelada')
  const ordenesCompletadas = ordenesTécnico.filter(o => o.estado === 'Completada')

  // Filtrado de eventos de alarma
  const eventosFiltrados = eventosAlarma.filter(e => 
    !filtroCuentaAlarma || 
    e.cuenta.toLowerCase().includes(filtroCuentaAlarma.toLowerCase()) ||
    (e.nombre_abonado || '').toLowerCase().includes(filtroCuentaAlarma.toLowerCase()) ||
    e.evento.toLowerCase().includes(filtroCuentaAlarma.toLowerCase())
  )

  // Fecha bonita en español
  const fechaHoyLegible = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // PANTALLA 1: SPLASH SCREEN (CARGANDO CON LOGO DE EMPRESA)
  if (cargandoSplash) {
    return (
      <div className="fixed inset-0 bg-[#070b14] flex flex-col items-center justify-center p-6 text-white z-50 select-none">
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-blue-600/30 blur-xl animate-pulse"></div>
          <div className="relative w-28 h-28 bg-[#0b1329] border-2 border-blue-500/80 rounded-3xl p-3 shadow-2xl flex items-center justify-center">
            <img src="/logo-gama.png" alt="Gama Seguridad" className="w-full h-full object-contain" />
          </div>
        </div>

        <h1 className="text-xl font-black tracking-wider text-blue-400 uppercase text-center">GAMA SEGURIDAD 24/7</h1>
        <p className="text-xs text-slate-300 font-bold tracking-wide mt-1">Módulo Técnico en Terreno PWA</p>

        <div className="w-64 bg-slate-900 h-2 rounded-full mt-8 overflow-hidden border border-slate-800">
          <div className="bg-gradient-to-r from-blue-600 to-emerald-400 h-full w-full animate-pulse"></div>
        </div>

        <p className="text-xs text-slate-400 mt-4 font-mono animate-pulse">{mensajeSplash}</p>
      </div>
    )
  }

  // PANTALLA 2: LOGIN DIARIO OBLIGATORIO (SE REINICIA A LAS 00:00)
  if (!tecnicoAutenticado) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-center items-center p-5 max-w-md mx-auto relative select-none">
        
        {/* Card Login PWA */}
        <div className="w-full bg-[#0e172a] border border-blue-900/60 rounded-3xl p-6 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-[#070b14] border border-blue-500/50 rounded-2xl p-2 mx-auto shadow-inner flex items-center justify-center">
              <img src="/logo-gama.png" alt="Logo Gama" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-lg font-black tracking-wider text-blue-400 uppercase">GAMA SEGURIDAD 24/7</h1>
            <p className="text-xs text-slate-300 font-bold">Ingreso Diario Técnico en Terreno</p>
            <span className="inline-block bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 rounded-full text-[10px] font-bold">
              🗓️ Jornada: {new Date().toLocaleDateString('es-CL')}
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 uppercase block">Seleccionar Técnico:</label>
              <select
                value={tecnicoSeleccionadoLogin}
                onChange={(e) => setTecnicoSeleccionadoLogin(e.target.value)}
                className="w-full bg-[#070b14] border-2 border-blue-800 text-white font-bold text-sm rounded-xl p-3.5 focus:outline-none focus:border-blue-500"
              >
                {TECNICOS.map(t => (
                  <option key={t.nombre} value={t.nombre}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-amber-400 block">🔒 Política de Seguridad Diaria:</span>
              <p>Por norma operativa de la Central, tu sesión vence automáticamente cada día a las 00:00 hrs. Ingresa para sincronizar tus órdenes diarias.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-wider shadow-xl cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <span>🔑</span>
              <span>INICIAR JORNADA LABORAL</span>
            </button>
          </form>

        </div>

      </div>
    )
  }

  // PANTALLA 3: PORTAL PRINCIPAL DEL TÉCNICO (DISEÑO MÓVIL ALTA VISIBILIDAD)
  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col font-sans max-w-md mx-auto shadow-2xl relative border-x border-slate-800 pb-20 select-none">
      
      {/* Header Corporativo Móvil */}
      <header className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 p-4 border-b border-blue-800/40 sticky top-0 z-30 shadow-xl flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-950 border border-blue-500 rounded-xl p-1 shrink-0">
              <img src="/logo-gama.png" alt="Gama Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-blue-400 uppercase">GAMA SEGURIDAD</h1>
              <p className="text-[11px] text-slate-300 font-bold">Módulo Técnico PWA</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => {
                cargarOrdenes()
                if (menuSeccion === 'eventos_alarma') cargarEventosAlarma()
              }}
              className="bg-blue-950 hover:bg-blue-900 text-blue-300 p-2 rounded-xl border border-blue-700/60 text-xs font-bold active:scale-95 transition-transform"
              title="Actualizar Órdenes"
            >
              🔄
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-950/80 hover:bg-red-900 text-red-300 p-2 rounded-xl border border-red-800/60 text-xs font-bold active:scale-95 transition-transform"
              title="Cerrar Sesión Diaria"
            >
              🚪
            </button>
          </div>
        </div>

        {/* Banner Técnico Autenticado */}
        <div className="bg-slate-950/90 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black text-white">{tecnicoAutenticado}</span>
          </div>
          <span className="text-[10px] text-amber-400 font-bold font-mono">
            {ordenesPendientes.length} Pendiente(s)
          </span>
        </div>
      </header>

      {/* Cuerpo Principal PWA */}
      <main className="flex-1 p-3.5 flex flex-col space-y-4 overflow-y-auto">

        {/* SECCIÓN A: ASISTENTE DE ITINERARIO DIARIO */}
        {menuSeccion === 'itinerario' && !ordenSeleccionada && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Card Mensaje de Bienvenida Asistente */}
            <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 border border-blue-800/70 rounded-3xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center gap-3 border-b border-blue-900/60 pb-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h2 className="text-base font-black text-blue-300">Asistente Virtual de Jornada</h2>
                  <p className="text-xs text-slate-300 capitalize">{fechaHoyLegible}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-white leading-relaxed">
                  ¡Buenos días, <span className="text-amber-400 font-black">{tecnicoAutenticado}</span>! 👋
                </p>
                <p className="text-xs text-slate-300 leading-normal">
                  Bienvenido a tu jornada laboral de hoy. El sistema ha preparado tu itinerario de atenciones en terreno:
                </p>
              </div>

              {/* Stats resumen diario */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-950/80 border border-amber-500/40 p-3 rounded-2xl text-center">
                  <span className="text-xs text-slate-400 font-bold block uppercase">Atenciones Pendientes:</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">{ordenesPendientes.length}</span>
                </div>
                <div className="bg-slate-950/80 border border-emerald-500/40 p-3 rounded-2xl text-center">
                  <span className="text-xs text-slate-400 font-bold block uppercase">Atenciones Finalizadas:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{ordenesCompletadas.length}</span>
                </div>
              </div>
            </div>

            {/* Cronograma / Itinerario de Visitas Sugeridas */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider px-1">
                📅 Cronograma de Visitas Programadas para Hoy:
              </h3>

              {ordenesPendientes.map((o, index) => (
                <div
                  key={o.id}
                  onClick={() => {
                    setOrdenSeleccionada(o)
                    setNovedadTexto(o.novedad || '')
                    setRepuestosTexto(o.repuestos_utilizados || '')
                    setNombreFirmanteText(o.nombre_firmante || '')
                  }}
                  className={`bg-slate-900 border rounded-2xl p-4 cursor-pointer hover:border-blue-500 transition-all shadow-lg space-y-2 active:scale-98 ${
                    index === 0 ? 'border-amber-500 bg-amber-950/20' : 'border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                      {index === 0 ? '📍 PRÓXIMA ATENCIÓN SUGERIDA' : `VISITA N° ${index + 1}`}
                    </span>
                    <span className="bg-blue-950 text-blue-300 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border border-blue-800">
                      {o.bloque_horario}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-black text-white">{o.nombre_abonado}</div>
                    <div className="text-xs text-blue-300 font-mono font-bold">Código Cliente: #{o.cuenta} • {o.tipo_visita || 'Correctiva'}</div>
                    <div className="text-xs text-slate-300 leading-snug">📍 {o.direccion}</div>
                    <div className="text-xs text-amber-200/90 italic bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      ⚠️ {o.problema}
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer mt-1 flex items-center justify-center gap-1.5">
                    <span>🚀 Iniciar Atención Técnica</span>
                    <span>➔</span>
                  </button>
                </div>
              ))}

              {ordenesPendientes.length === 0 && (
                <div className="text-center text-emerald-400 italic py-12 bg-slate-900/60 rounded-3xl border border-emerald-900/60 p-4 space-y-2">
                  <span className="text-3xl block">🎉</span>
                  <span className="font-bold text-sm block">¡Excelente trabajo, {tecnicoAutenticado}!</span>
                  <span className="text-xs text-slate-400 block">Has completado todas tus atenciones programadas para el día de hoy.</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SECCIÓN B: ÓRDENES PENDIENTES & EJECUCIÓN */}
        {menuSeccion === 'ordenes_pendientes' && (
          <div className="space-y-3">
            {ordenSeleccionada ? (
              /* DETALLE Y EJECUCIÓN EN TERRENO */
              <div className="space-y-4 animate-fadeIn">
                
                <button
                  onClick={() => setOrdenSeleccionada(null)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-2xl text-xs font-black border border-slate-700 flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <span>◀</span>
                  <span>Volver a la Lista de Órdenes</span>
                </button>

                {/* Datos del Cliente */}
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 space-y-3 shadow-xl">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-sm font-black text-blue-400 font-mono block">
                        #{ordenSeleccionada.codigo_ot || `OT-${ordenSeleccionada.id}`}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">{ordenSeleccionada.fecha_cita} • {ordenSeleccionada.bloque_horario}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                      ordenSeleccionada.estado === 'Completada' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                      ordenSeleccionada.estado === 'En Terreno' ? 'bg-purple-950 text-purple-300 border border-purple-700' :
                      ordenSeleccionada.estado === 'En Traslado' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                      'bg-blue-950 text-blue-300 border border-blue-700'
                    }`}>
                      {ordenSeleccionada.estado}
                    </span>
                  </div>

                  <div className="text-xs space-y-2">
                    <div><span className="text-slate-400 font-bold">Código de Cliente:</span> <strong className="font-mono text-sm text-blue-300">{ordenSeleccionada.cuenta}</strong></div>
                    <div><span className="text-slate-400 font-bold">Nombre del Abonado:</span> <strong className="text-sm text-white">{ordenSeleccionada.nombre_abonado}</strong></div>
                    
                    <div className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
                      <div className="max-w-[65%]">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Dirección de Atención:</span>
                        <span className="text-xs font-bold text-slate-200 leading-tight block">{ordenSeleccionada.direccion}</span>
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(ordenSeleccionada.direccion)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-3 py-2.5 rounded-xl border border-blue-400 shadow cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <span>📍</span>
                        <span>Navegar</span>
                      </a>
                    </div>

                    {ordenSeleccionada.telefono_contacto && (
                      <div className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Teléfono de Contacto:</span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">{ordenSeleccionada.telefono_contacto}</span>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={`tel:${ordenSeleccionada.telefono_contacto}`}
                            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl border border-emerald-500"
                          >
                            📞 Llamar
                          </a>
                          <a
                            href={`https://wa.me/${ordenSeleccionada.telefono_contacto.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl border border-green-400"
                          >
                            💬 Chat WA
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-2xl text-amber-200 text-xs space-y-1">
                      <span className="font-black block text-xs uppercase text-amber-400">⚠️ Requerimiento / Falla Reportada:</span>
                      <p className="leading-relaxed">{ordenSeleccionada.problema}</p>
                    </div>
                  </div>
                </div>

                {/* Controles de Estado Operativo sin GPS link para el cliente */}
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 space-y-2.5">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wide block border-b border-slate-800 pb-1.5">
                    🚦 Estado de la Atención en Terreno:
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={async () => {
                        const eta = prompt('Tiempo estimado de llegada (ETA en minutos):', '15') || '15'
                        cambiarEstadoOrden(ordenSeleccionada.id, 'En Traslado')
                        if (ordenSeleccionada.telefono_contacto) {
                          const msg = `🚚 *GAMA SEGURIDAD 24/7 - Técnico en camino*\n\nEstimado cliente, el técnico *${ordenSeleccionada.tecnico}* va en camino a su domicilio (*${ordenSeleccionada.direccion}*).\n\n• *Tiempo Estimado de Llegada (ETA):* ~${eta} minutos\n• *Orden de Trabajo:* #${ordenSeleccionada.codigo_ot || ordenSeleccionada.id}\n\nQuedamos atentos a su recepción.`
                          enviarNotificacionWhatsApp(ordenSeleccionada.telefono_contacto, msg)
                        }
                      }}
                      className={`py-3.5 px-3 font-black text-xs rounded-2xl border cursor-pointer transition-colors shadow ${
                        ordenSeleccionada.estado === 'En Traslado'
                          ? 'bg-amber-500 text-black border-amber-300 font-black'
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
                      className={`py-3.5 px-3 font-black text-xs rounded-2xl border cursor-pointer transition-colors shadow ${
                        ordenSeleccionada.estado === 'En Terreno'
                          ? 'bg-purple-600 text-white border-purple-300 font-black'
                          : 'bg-slate-800 text-purple-300 border-purple-800/50 hover:bg-slate-700'
                      }`}
                    >
                      📍 EN TERRENO (+WA LLEGADA)
                    </button>
                  </div>
                </div>

                {/* Checklist Pruebas de Zonificación en Terreno */}
                <div className="bg-slate-900 border border-blue-900/60 rounded-3xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-blue-300 uppercase">📋 Checklist Pruebas de Sensores</span>
                    <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full font-extrabold border border-blue-800">EN VIVO</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {['ZONA 01: PIR Living', 'ZONA 02: Magnético Puerta Principal', 'ZONA 03: PIR Comedor / Pasillo', 'ZONA 04: Humo / Temperatura Cocina'].map((z) => (
                      <div key={z} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                        <span className="font-bold text-slate-200 text-xs">{z}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            const btn = e.currentTarget
                            btn.innerText = '✅ TEST OK'
                            btn.className = 'bg-emerald-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl border border-emerald-400'
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-400 cursor-pointer"
                        >
                          ⚡ PROBAR SENSOR
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulario Cierre & Firma */}
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 space-y-3.5">
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wide block border-b border-slate-800 pb-1.5">
                    📝 Informe de Trabajo & Cierre:
                  </span>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase block">Trabajo / Solución Realizada:</label>
                    <textarea
                      value={novedadTexto}
                      onChange={(e) => setNovedadTexto(e.target.value)}
                      placeholder="Describa los trabajos ejecutados, cambios de batería o revisión de sensores..."
                      className="bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white w-full h-24 resize-none focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase block">Repuestos / Baterías Cambiadas:</label>
                    <input
                      type="text"
                      value={repuestosTexto}
                      onChange={(e) => setRepuestosTexto(e.target.value)}
                      placeholder="Ej: 1 Batería 12V 7Ah Ritar, 1 Sensor PIR DSC..."
                      className="bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white w-full focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase block">Nombre del Cliente / Firmante:</label>
                    <input
                      type="text"
                      value={nombreFirmanteText}
                      onChange={(e) => setNombreFirmanteText(e.target.value)}
                      placeholder="Nombre y apellido de quien recibe en domicilio..."
                      className="bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white w-full focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Dibujar Firma Touch Digital */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300 uppercase">Firma Digital del Cliente:</label>
                      <button onClick={clearFirma} className="text-xs text-red-400 font-bold hover:underline">LIMPIAR</button>
                    </div>
                    <div className="touch-none bg-white rounded-2xl border-2 border-slate-600 p-1">
                      <canvas
                        ref={canvasRef}
                        width={320}
                        height={110}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full cursor-crosshair bg-white rounded-xl"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleFinalizarOrden}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl border border-emerald-400 shadow-xl cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-transform"
                  >
                    <span>✔️</span>
                    <span>FINALIZAR Y ENVIAR COMPROBANTE WA</span>
                  </button>
                </div>

              </div>
            ) : (
              /* LISTA DE TRABAJOS PENDIENTES */
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <span className="text-xs font-black text-slate-200 uppercase">📋 Órdenes Pendientes ({ordenesPendientes.length})</span>
                  <span className="text-xs text-blue-400 font-bold">{tecnicoAutenticado}</span>
                </div>

                <div className="space-y-3">
                  {ordenesPendientes.map(o => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setOrdenSeleccionada(o)
                        setNovedadTexto(o.novedad || '')
                        setRepuestosTexto(o.repuestos_utilizados || '')
                        setNombreFirmanteText(o.nombre_firmante || '')
                      }}
                      className={`bg-slate-900 border rounded-2xl p-4 cursor-pointer hover:border-blue-500 transition-all shadow-lg space-y-2.5 relative overflow-hidden active:scale-98 ${
                        o.estado === 'En Terreno' ? 'border-purple-600 bg-purple-950/30' :
                        o.estado === 'En Traslado' ? 'border-amber-500 bg-amber-950/30' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                        <span className="font-mono text-xs font-black text-blue-400">#{o.codigo_ot || `OT-${o.id}`}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          o.estado === 'En Terreno' ? 'bg-purple-950 text-purple-300 border border-purple-700' :
                          o.estado === 'En Traslado' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                          'bg-blue-950 text-blue-300 border border-blue-700'
                        }`}>
                          {o.estado}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-white flex justify-between">
                          <span>Cliente: <span className="font-mono text-blue-300">{o.cuenta}</span></span>
                          <span className="text-[11px] text-slate-400 font-bold">{o.tipo_visita || 'Correctiva'}</span>
                        </div>
                        <div className="text-sm font-black text-slate-100 uppercase truncate">{o.nombre_abonado}</div>
                        <div className="text-xs text-slate-300 truncate font-medium">📍 {o.direccion}</div>
                        <div className="text-xs text-amber-200/90 italic truncate bg-slate-950 p-2 rounded-xl border border-slate-800">
                          ⚠️ {o.problema}
                        </div>
                      </div>

                      <div className="pt-1.5 flex justify-between items-center text-xs text-slate-400 font-bold border-t border-slate-800">
                        <span>📅 Cita: {o.fecha_cita}</span>
                        <span className="text-blue-400 flex items-center gap-1 font-black">
                          <span>Iniciar Atención</span>
                          <span>➔</span>
                        </span>
                      </div>
                    </div>
                  ))}

                  {ordenesPendientes.length === 0 && !cargando && (
                    <div className="text-center text-slate-400 italic py-16 bg-slate-900/50 rounded-3xl border border-slate-800 text-xs">
                      No tienes órdenes pendientes asignadas para hoy.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN C: SERVICIOS REALIZADOS */}
        {menuSeccion === 'servicios_realizados' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <span className="text-xs font-black text-emerald-400 uppercase">✅ Servicios Realizados ({ordenesCompletadas.length})</span>
              <span className="text-xs text-slate-400 font-bold">{tecnicoAutenticado}</span>
            </div>

            <div className="space-y-3">
              {ordenesCompletadas.map(o => (
                <div
                  key={o.id}
                  className="bg-slate-900 border border-emerald-800/60 bg-emerald-950/20 rounded-2xl p-4 shadow-md space-y-2.5"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-black text-emerald-400">#{o.codigo_ot || `OT-${o.id}`}</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full font-black">COMPLETADA</span>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div><span className="text-slate-400">Cliente:</span> <strong className="font-mono text-blue-300">{o.cuenta}</strong> - {o.nombre_abonado}</div>
                    <div className="text-slate-200"><strong>Trabajo:</strong> {o.novedad}</div>
                    {o.repuestos_utilizados && <div className="text-slate-400"><strong>Repuestos:</strong> {o.repuestos_utilizados}</div>}
                    <div className="text-[10px] text-slate-400">Cierre: {o.fecha_cierre || o.fecha_cita} • Recepción: {o.nombre_firmante || 'Cliente'}</div>
                  </div>
                  <button
                    onClick={() => setOrdenImprimir(o)}
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-extrabold py-2.5 rounded-xl border border-blue-700 text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <span>📄</span>
                    <span>Ver Comprobante Firmado</span>
                  </button>
                </div>
              ))}

              {ordenesCompletadas.length === 0 && (
                <div className="text-center text-slate-400 italic py-16 bg-slate-900/50 rounded-3xl border border-slate-800 text-xs">
                  No hay servicios realizados registrados para {tecnicoAutenticado}.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN D: MONITOR DE EVENTOS DE ALARMA (SOLO LECTURA) */}
        {menuSeccion === 'eventos_alarma' && (
          <div className="space-y-3">
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚨</span>
                  <span className="text-xs font-black text-red-400 uppercase tracking-wide">Monitor de Eventos de Alarma</span>
                </div>
                <span className="text-[9px] bg-red-950 text-red-300 border border-red-700 px-2 py-0.5 rounded-full font-black tracking-wider uppercase">
                  🔒 SÓLO LECTURA
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Visualizador de señales de sensores y pruebas en tiempo real para auditoría en terreno sin permisos de edición.
              </p>

              <input
                type="text"
                value={filtroCuentaAlarma}
                onChange={(e) => setFiltroCuentaAlarma(e.target.value)}
                placeholder="Filtrar por código de cliente o tipo de evento..."
                className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-full focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-2">
              {eventosFiltrados.map(ev => {
                const { hora, fecha } = formatFechaHoraChile(ev.fecha_hora)
                return (
                  <div key={ev.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between hover:border-slate-700">
                    <div className="space-y-1 max-w-[75%]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400 text-xs">{ev.cuenta}</span>
                        <span className="text-xs font-bold text-slate-300 truncate">{ev.nombre_abonado}</span>
                      </div>
                      <div className={`font-mono text-xs font-black ${
                        ev.evento.includes('ALARMA') || ev.evento.includes('ROBO') ? 'text-red-400' :
                        ev.evento.includes('RESTAURA') ? 'text-emerald-400' : 'text-amber-300'
                      }`}>
                        {ev.evento} {ev.zona && ev.zona !== 'S/T' ? `[ZONA ${ev.zona}]` : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono text-slate-300 font-bold block">{hora}</span>
                      <span className="text-[10px] text-slate-500 block">{fecha}</span>
                    </div>
                  </div>
                )
              })}

              {eventosFiltrados.length === 0 && !cargandoEventos && (
                <div className="text-center text-slate-400 italic py-16 bg-slate-900/50 rounded-3xl border border-slate-800 text-xs">
                  No hay eventos de alarma registrados para la búsqueda.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN E: PERFIL DEL TÉCNICO */}
        {menuSeccion === 'perfil' && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4">
                <div className="w-14 h-14 bg-blue-950 text-blue-300 rounded-2xl flex items-center justify-center text-2xl font-bold border border-blue-700 shadow-inner">
                  👨‍🔧
                </div>
                <div>
                  <h3 className="font-black text-base text-white">{tecnicoAutenticado}</h3>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Técnico de Terreno Activo</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Atenciones Pendientes:</span>
                  <strong className="text-amber-400 font-mono text-sm">{ordenesPendientes.length}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Servicios Completados:</span>
                  <strong className="text-emerald-400 font-mono text-sm">{ordenesCompletadas.length}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Política Cierre Sesión:</span>
                  <strong className="text-amber-400">Diaria a las 00:00 hrs</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Estado Conexión PWA:</span>
                  <strong className="text-blue-400">En Línea (Supabase Sync)</strong>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full bg-red-950/80 hover:bg-red-900 text-red-300 font-black py-3.5 rounded-2xl border border-red-800 text-xs uppercase tracking-wider shadow cursor-pointer mt-2 active:scale-95 transition-transform"
              >
                🚪 CERRAR SESIÓN DIARIA MANULAMENTE
              </button>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAVIGATION BAR (MENÚ PROFESIONAL MÓVIL 5 SECCIONES) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 z-40 text-[10px] shadow-2xl">
        
        <button
          onClick={() => { setMenuSeccion('itinerario'); setOrdenSeleccionada(null); }}
          className={`py-2.5 flex flex-col items-center justify-center font-extrabold transition-colors cursor-pointer ${
            menuSeccion === 'itinerario' ? 'text-amber-400 bg-slate-900 border-t-2 border-amber-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base">🤖</span>
          <span className="leading-tight">Itinerario</span>
        </button>

        <button
          onClick={() => { setMenuSeccion('ordenes_pendientes'); setOrdenSeleccionada(null); }}
          className={`py-2.5 flex flex-col items-center justify-center font-extrabold transition-colors cursor-pointer ${
            menuSeccion === 'ordenes_pendientes' ? 'text-blue-400 bg-slate-900 border-t-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base">📋</span>
          <span className="leading-tight">Pendientes</span>
        </button>

        <button
          onClick={() => { setMenuSeccion('servicios_realizados'); setOrdenSeleccionada(null); }}
          className={`py-2.5 flex flex-col items-center justify-center font-extrabold transition-colors cursor-pointer ${
            menuSeccion === 'servicios_realizados' ? 'text-emerald-400 bg-slate-900 border-t-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base">✅</span>
          <span className="leading-tight">Realizados</span>
        </button>

        <button
          onClick={() => { setMenuSeccion('eventos_alarma'); setOrdenSeleccionada(null); }}
          className={`py-2.5 flex flex-col items-center justify-center font-extrabold transition-colors cursor-pointer ${
            menuSeccion === 'eventos_alarma' ? 'text-red-400 bg-slate-900 border-t-2 border-red-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base">🚨</span>
          <span className="leading-tight">Eventos</span>
        </button>

        <button
          onClick={() => { setMenuSeccion('perfil'); setOrdenSeleccionada(null); }}
          className={`py-2.5 flex flex-col items-center justify-center font-extrabold transition-colors cursor-pointer ${
            menuSeccion === 'perfil' ? 'text-purple-400 bg-slate-900 border-t-2 border-purple-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base">👤</span>
          <span className="leading-tight">Perfil</span>
        </button>

      </nav>

      {/* Visor Modal Comprobante Imprimible */}
      {ordenImprimir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 select-text">
          <div className="w-full max-w-[650px] bg-white text-black p-5 font-sans shadow-2xl rounded-2xl border border-gray-400 max-h-[95vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b-2 border-blue-900 pb-3 mb-3">
              <div>
                <h1 className="text-lg font-black text-blue-950 tracking-wider">GAMA SEGURIDAD 24/7</h1>
                <p className="text-xs text-gray-600 font-semibold">Comprobante de Servicio Técnico en Terreno</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-blue-900 text-white font-mono text-sm font-bold px-2 py-0.5 rounded">
                  {ordenImprimir.codigo_ot || `OT-${ordenImprimir.id}`}
                </span>
                <p className="text-[10px] text-gray-500 mt-1">Fecha: {ordenImprimir.fecha_cierre || ordenImprimir.fecha_cita}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 text-xs space-y-1">
              <div><strong>Código de Cliente:</strong> <span className="font-mono font-bold text-blue-900">{ordenImprimir.cuenta}</span></div>
              <div><strong>Nombre del Abonado:</strong> {ordenImprimir.nombre_abonado}</div>
              <div><strong>Dirección de Atención:</strong> {ordenImprimir.direccion}</div>
              <div><strong>Teléfono:</strong> {ordenImprimir.telefono_contacto || 'N/A'}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 text-xs space-y-1">
              <div><strong>Trabajo Realizado:</strong> {ordenImprimir.novedad}</div>
              {ordenImprimir.repuestos_utilizados && <div><strong>Repuestos:</strong> {ordenImprimir.repuestos_utilizados}</div>}
              <div><strong>Técnico:</strong> {ordenImprimir.tecnico}</div>
            </div>

            {ordenImprimir.firma && (
              <div className="border border-gray-300 p-2.5 rounded-xl bg-slate-50 mb-3 text-xs">
                <span className="font-bold block text-gray-700 mb-1">Recepción / Firma Cliente: {ordenImprimir.nombre_firmante}</span>
                <img src={ordenImprimir.firma} alt="Firma" className="h-16 border border-gray-400 bg-white px-2 rounded" />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setOrdenImprimir(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 font-bold text-xs rounded-xl hover:bg-gray-400 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 shadow cursor-pointer"
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
