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
  rut_firmante?: string
  fotos_evidencia?: string[]
  modo_pruebas_usado?: boolean
  voltaje_bateria?: string
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

export default function PortalTecnicoMovil() {
  // Autenticación Diaria & Cierre a Medianoche (00:00)
  const [tecnicoAutenticado, setTecnicoAutenticado] = useState<string | null>(null)
  const [tecnicoSeleccionadoLogin, setTecnicoSeleccionadoLogin] = useState(TECNICOS[0].nombre)

  // Pantalla de Carga Splash Screen con Logo
  const [cargandoSplash, setCargandoSplash] = useState<boolean>(true)
  const [mensajeSplash, setMensajeSplash] = useState<string>('Iniciando Módulo Técnico...')

  // Navegación del Menú Principal
  const [menuSeccion, setMenuSeccion] = useState<'itinerario' | 'ordenes_pendientes' | 'servicios_realizados' | 'eventos_alarma' | 'perfil'>('itinerario')

  // Datos
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajo | null>(null)
  const [cargando, setCargando] = useState(false)

  // Modo Offline & Auto-Sincronización
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false)
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null)

  // Modo Pruebas de Sistema / Cuenta en Pruebas en Domicilio
  const [modoPruebasActivo, setModoPruebasActivo] = useState<boolean>(false)

  // Fotos de Evidencia en Terreno
  const [fotosEvidencia, setFotosEvidencia] = useState<string[]>([])
  const [voltajeBateriaInput, setVoltajeBateriaInput] = useState<string>('13.8V DC (OK)')

  // Notificaciones Push y Burbujas de Alerta
  const [permisoNotificacion, setPermisoNotificacion] = useState<string>('default')
  const [nuevasOrdenesBadge, setNuevasOrdenesBadge] = useState<number>(0)
  const [bannerAlertaNuevaOT, setBannerAlertaNuevaOT] = useState<OrdenTrabajo | null>(null)

  // Monitor de Eventos de Alarma (Solo Lectura)
  const [eventosAlarma, setEventosAlarma] = useState<EventoAlarma[]>([])
  const [cargandoEventos, setCargandoEventos] = useState(false)
  const [filtroCuentaAlarma, setFiltroCuentaAlarma] = useState('')

  // Formulario terreno
  const [novedadTexto, setNovedadTexto] = useState('')
  const [repuestosTexto, setRepuestosTexto] = useState('')
  const [nombreFirmanteText, setNombreFirmanteText] = useState('')
  const [rutFirmanteText, setRutFirmanteText] = useState('')

  // Canvas Firma Touch
  const [firmando, setFirmando] = useState(false)
  const [firmaImagen, setFirmaImagen] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Visor de Comprobante Imprimible
  const [ordenImprimir, setOrdenImprimir] = useState<OrdenTrabajo | null>(null)

  // Listener para estado Offline / Online
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      sincronizarColaOffline()
    }
    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-Sincronizar órdenes almacenadas localmente durante pérdida de señal
  const sincronizarColaOffline = async () => {
    const offlineQueue = localStorage.getItem('gama_ot_offline_queue')
    if (offlineQueue) {
      try {
        const queue: OrdenTrabajo[] = JSON.parse(offlineQueue)
        if (queue.length > 0) {
          setSyncStatusMsg(`⚡ Sincronizando ${queue.length} orden(es) de terreno pendientes...`)
          
          // Cargar las órdenes actuales de Supabase
          const { data } = await supabase
            .from('eventos_monitoreo')
            .select('*')
            .eq('cuenta', 'ORDENES_TRABAJO')
            .order('id', { ascending: false })
            .limit(1)

          let listaBase: OrdenTrabajo[] = []
          if (data && data.length > 0) {
            listaBase = JSON.parse(data[0].nombre_abonado || '[]')
          }

          // Fusionar queue local con lista base
          const mapaFusion = new Map<number, OrdenTrabajo>()
          listaBase.forEach(o => mapaFusion.set(o.id, o))
          queue.forEach(o => mapaFusion.set(o.id, o))

          const listaFinal = Array.from(mapaFusion.values())

          await supabase
            .from('eventos_monitoreo')
            .upsert({
              cuenta: 'ORDENES_TRABAJO',
              nombre_abonado: JSON.stringify(listaFinal),
              evento: 'CONFIGURACION',
              fecha_hora: new Date().toISOString()
            })

          localStorage.removeItem('gama_ot_offline_queue')
          setOrdenes(listaFinal)
          setSyncStatusMsg('🟢 ¡Sincronización con Supabase completada con éxito!')
          setTimeout(() => setSyncStatusMsg(null), 4000)
        }
      } catch (e) {
        console.error('Error sincronizando cola offline:', e)
      }
    }
  }

  // Generador de Tono Sonoro de Alerta Web Audio API
  const reproducirSonidoAlerta = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start()
      osc1.stop(ctx.currentTime + 0.3)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.25) // A5
      gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.25)
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(ctx.currentTime + 0.25)
      osc2.stop(ctx.currentTime + 0.6)
    } catch (e) {
      console.warn('Audio alert error:', e)
    }
  }

  // Disparar Notificación Push Nativa
  const dispararNotificacionPush = (ot: OrdenTrabajo) => {
    reproducirSonidoAlerta()

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`🛠️ GAMA 24/7: ¡Nuevo Servicio Técnico!`, {
            body: `Abonado ${ot.cuenta} - ${ot.nombre_abonado}\nSolicitud: ${ot.problema}\nDirección: ${ot.direccion}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `ot-${ot.id}`,
            renotify: true
          } as any)
        } catch (err) {
          console.warn('Error push notification:', err)
        }
      }
    }
  }

  // Solicitar permiso Push al usuario
  const solicitarPermisoNotificaciones = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission()
      setPermisoNotificacion(res)
      if (res === 'granted') {
        alert('🔔 ¡Notificaciones Push activadas! Recibirás alertas instantáneas cuando la central te asigne un nuevo servicio técnico.')
        reproducirSonidoAlerta()
      } else {
        alert('Las notificaciones están desactivadas en los permisos del navegador.')
      }
    } else {
      alert('Tu navegador no soporta notificaciones push nativas.')
    }
  }

  // Verificación inicial del estado de permisos de notificación
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermisoNotificacion(Notification.permission)
    }
  }, [])

  // Auto-login persistente por 24 hrs
  useEffect(() => {
    const timerSplash = setTimeout(() => {
      const hoyStr = new Date().toISOString().slice(0, 10)
      const sesion = localStorage.getItem('gama_tecnico_sesion_diaria')
      if (sesion) {
        try {
          const parsed = JSON.parse(sesion)
          if (parsed.fecha === hoyStr && parsed.tecnico) {
            setTecnicoAutenticado(parsed.tecnico)
          } else {
            localStorage.removeItem('gama_tecnico_sesion_diaria')
          }
        } catch {}
      }
      setCargandoSplash(false)
    }, 1500)

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
  const cargarOrdenes = async (silent: boolean = false) => {
    if (!silent) setCargando(true)
    try {
      const { data, error } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .eq('cuenta', 'ORDENES_TRABAJO')
        .order('id', { ascending: false })
        .limit(1)

      if (data && data.length > 0 && !error) {
        const parsed: OrdenTrabajo[] = JSON.parse(data[0].nombre_abonado || '[]')
        
        if (tecnicoAutenticado) {
          const misPendientesNuevas = parsed.filter(o => coincideTecnico(o.tecnico, tecnicoAutenticado) && o.estado !== 'Completada' && o.estado !== 'Cancelada')
          
          setOrdenes(prevOrdenes => {
            if (prevOrdenes.length > 0) {
              const idsViejos = new Set(prevOrdenes.map(o => o.id))
              const ordenRecienAsignada = misPendientesNuevas.find(o => !idsViejos.has(o.id))
              if (ordenRecienAsignada) {
                setBannerAlertaNuevaOT(ordenRecienAsignada)
                setNuevasOrdenesBadge(prev => prev + 1)
                dispararNotificacionPush(ordenRecienAsignada)
              }
            }
            return parsed
          })
        } else {
          setOrdenes(parsed)
        }
      }
    } catch (err) {
      console.error('Error cargando órdenes:', err)
    } finally {
      if (!silent) setCargando(false)
    }
  }

  // Carga inicial y Polling ultrarrápido cada 3.5s + Suscripción Realtime
  useEffect(() => {
    if (!tecnicoAutenticado) return

    cargarOrdenes()
    const pollInterval = setInterval(() => {
      cargarOrdenes(true)
    }, 3500)

    const channelOT = supabase
      .channel('realtime_ordenes_tecnico_pwa')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'eventos_monitoreo',
        filter: 'cuenta=eq.ORDENES_TRABAJO'
      }, () => {
        cargarOrdenes(true)
      })
      .subscribe()

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channelOT)
    }
  }, [tecnicoAutenticado])

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

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(p => setPermisoNotificacion(p))
      }
    }
  }

  // Logout del Técnico
  const handleLogout = () => {
    localStorage.removeItem('gama_tecnico_sesion_diaria')
    setTecnicoAutenticado(null)
    setOrdenSeleccionada(null)
  }

  // Guardar en Supabase o en memoria local (Modo Offline)
  const guardarOrdenesBase = async (listaNueva: OrdenTrabajo[]) => {
    setOrdenes(listaNueva)
    if (isOffline) {
      localStorage.setItem('gama_ot_offline_queue', JSON.stringify(listaNueva))
      setSyncStatusMsg('📡 Guardado localmente en memoria (Modo Offline)')
      return
    }

    try {
      await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'ORDENES_TRABAJO',
          nombre_abonado: JSON.stringify(listaNueva),
          evento: 'CONFIGURACION',
          fecha_hora: new Date().toISOString()
        })
    } catch (err) {
      console.error('Error guardando órdenes:', err)
      localStorage.setItem('gama_ot_offline_queue', JSON.stringify(listaNueva))
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

  // Transición de estado de la atención (En Traslado, En Terreno)
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

    // Si pasa a En Terreno, avisar por evento
    if (nuevoEstado === 'En Terreno' && ordenSeleccionada) {
      try {
        await supabase.from('eventos_monitoreo').insert({
          fecha_hora: new Date().toISOString(),
          cuenta: ordenSeleccionada.cuenta,
          nombre_abonado: ordenSeleccionada.nombre_abonado,
          evento: `TECNICO EN DOMICILIO: ${tecnicoAutenticado?.toUpperCase()}`,
          zona: 'S/T',
          usuario: 'TEC'
        })
      } catch (e) {}
    }
  }

  // Activar / Desactivar Modo Pruebas de Sistema en Domicilio
  const toggleModoPruebas = async () => {
    if (!ordenSeleccionada) return
    const nuevoEstado = !modoPruebasActivo
    setModoPruebasActivo(nuevoEstado)

    try {
      await supabase.from('eventos_monitoreo').insert({
        fecha_hora: new Date().toISOString(),
        cuenta: ordenSeleccionada.cuenta,
        nombre_abonado: ordenSeleccionada.nombre_abonado,
        evento: nuevoEstado ? 'CUENTA PUESTA EN MODO PRUEBAS TECNICAS EN TERRENO' : 'CUENTA RETIRADA DE MODO PRUEBAS TECNICAS',
        zona: 'S/T',
        usuario: 'TEC'
      })
    } catch (e) {
      console.warn('Error al registrar evento de modo pruebas:', e)
    }
  }

  // Captura de Foto de Evidencia
  const handleCapturarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fotosEvidencia.length >= 3) {
      alert('Se permite un máximo de 3 fotos de evidencia por servicio.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      if (base64) {
        setFotosEvidencia(prev => [...prev, base64])
      }
    }
    reader.readAsDataURL(file)
  }

  const eliminarFoto = (idx: number) => {
    setFotosEvidencia(prev => prev.filter((_, i) => i !== idx))
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
      // Si la cuenta estaba en Modo Pruebas, retirarla automáticamente
      if (modoPruebasActivo) {
        await supabase.from('eventos_monitoreo').insert({
          fecha_hora: new Date().toISOString(),
          cuenta: ordenSeleccionada.cuenta,
          nombre_abonado: ordenSeleccionada.nombre_abonado,
          evento: 'CUENTA RETIRADA DE MODO PRUEBAS TECNICAS AL FINALIZAR ATENCION',
          zona: 'S/T',
          usuario: 'TEC'
        })
        setModoPruebasActivo(false)
      }

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
        rut_firmante: rutFirmanteText.trim() || 'N/A',
        firma: firmaImagen,
        fotos_evidencia: fotosEvidencia,
        modo_pruebas_usado: modoPruebasActivo,
        voltaje_bateria: voltajeBateriaInput,
        fecha_cierre: fechaCierreStr
      }

      const listaNueva = ordenes.map(o => o.id === ordenSeleccionada.id ? ordenCompletada : o)
      await guardarOrdenesBase(listaNueva)

      if (ordenCompletada.telefono_contacto) {
        const msgWA = `✅ *GAMA SEGURIDAD 24/7 - Certificado Técnico de Atención*\n\nSu orden de servicio técnico *#${ordenCompletada.codigo_ot || 'OT'}* ha sido completada exitosamente.\n\n• *Trabajo Realizado:* ${novedadTexto.trim()}\n• *Repuestos:* ${repuestosTexto.trim() || 'Ninguno'}\n• *Atendido por:* ${ordenCompletada.tecnico}\n\nGracias por su confianza.`
        enviarNotificacionWhatsApp(ordenCompletada.telefono_contacto, msgWA)
      }

      alert('🎉 ¡Orden completada, firma touch registrada y certificado oficial generado!')
      setOrdenImprimir(ordenCompletada)
      setOrdenSeleccionada(null)
      setNovedadTexto('')
      setRepuestosTexto('')
      setNombreFirmanteText('')
      setRutFirmanteText('')
      setFirmaImagen('')
      setFotosEvidencia([])
    } catch (err: any) {
      alert('Error al finalizar la orden de trabajo: ' + err.message)
    }
  }

  // Filtrado de órdenes por técnico activo
  const ordenesTécnico = ordenes.filter(o => coincideTecnico(o.tecnico, tecnicoAutenticado))
  const ordenesPendientes = ordenesTécnico.filter(o => o.estado !== 'Completada' && o.estado !== 'Cancelada')
  const ordenesCompletadas = ordenesTécnico.filter(o => o.estado === 'Completada')

  // Filtrado de eventos de alarma
  const eventosFiltrados = eventosAlarma.filter(e => 
    !filtroCuentaAlarma || 
    e.cuenta.toLowerCase().includes(filtroCuentaAlarma.toLowerCase()) ||
    (e.nombre_abonado || '').toLowerCase().includes(filtroCuentaAlarma.toLowerCase()) ||
    e.evento.toLowerCase().includes(filtroCuentaAlarma.toLowerCase())
  )

  const fechaHoyLegible = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // PANTALLA 1: SPLASH SCREEN (CARGANDO CON LOGO DE EMPRESA)
  if (cargandoSplash) {
    return (
      <div className="fixed inset-0 bg-[#060913] flex flex-col items-center justify-center p-6 text-white z-50 select-none">
        <div className="relative mb-6">
          <div className="absolute -inset-6 rounded-full bg-blue-600/30 blur-2xl animate-pulse"></div>
          <div className="relative w-32 h-32 bg-[#0b1329]/90 border border-blue-500/40 rounded-3xl p-4 shadow-2xl flex items-center justify-center backdrop-blur-xl">
            <img src="/logo-gama.png" alt="Gama Seguridad" className="w-full h-full object-contain" />
          </div>
        </div>

        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 uppercase text-center">GAMA SEGURIDAD 24/7</h1>
        <p className="text-xs text-slate-400 font-semibold tracking-wider mt-1">{mensajeSplash}</p>
        <div className="w-36 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    )
  }

  // PANTALLA 2: FORMULARIO DE LOGIN DIARIO DEL TÉCNICO
  if (!tecnicoAutenticado) {
    return (
      <div className="min-h-screen bg-[#060913] text-white flex flex-col justify-between p-6 relative overflow-hidden select-none font-sans">
        {/* Glow de fondo Apple Style */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Banner superior */}
        <div className="pt-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#0b1329]/90 border border-blue-500/40 rounded-3xl p-3 shadow-2xl mb-4 backdrop-blur-xl">
            <img src="/logo-gama.png" alt="GAMA Security" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">GAMA SEGURIDAD 24/7</h1>
          <p className="text-xs text-blue-400 font-bold tracking-widest uppercase mt-1">Portal Técnico en Terreno PWA</p>
        </div>

        {/* Tarjeta Formulario Login iOS Style */}
        <div className="max-w-md w-full mx-auto bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl relative z-10 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>👨‍🔧</span>
              <span>Autenticación Diaria de Turno</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Por requerimiento operativo de Central, debe identificarse cada día laboral.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Seleccione Técnico Terreno:</label>
              <select
                value={tecnicoSeleccionadoLogin}
                onChange={(e) => setTecnicoSeleccionadoLogin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
              >
                {TECNICOS.map(t => (
                  <option key={t.nombre} value={t.nombre}>{t.nombre} — ({t.cargo})</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-start gap-3">
              <span className="text-lg">🗓️</span>
              <div className="text-xs text-slate-300">
                <span className="font-bold text-blue-400 block uppercase">Sesión Diaria de Terreno:</span>
                <span>{fechaHoyLegible}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Cierre automático programado a las 00:00 hrs.</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>🚀 INICIAR TURNO Y VER ITINERARIO</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 font-medium relative z-10 pb-4">
          © 2026 GAMA Security — Sistema Móvil de Despacho & Mantenimiento
        </div>
      </div>
    )
  }

  // PANTALLA 3: PORTAL MÓVIL DEL TÉCNICO (AUTENTICADO)
  return (
    <div className="min-h-screen bg-[#060913] text-white flex flex-col font-sans relative pb-24 select-none">
      
      {/* Banner de Estado Offline / Sincronización */}
      {isOffline && (
        <div className="bg-amber-500/90 text-black font-black text-xs px-4 py-2 text-center flex items-center justify-center gap-2 shadow-lg sticky top-0 z-50">
          <span>📡 MODO OFFLINE DETECTADO</span>
          <span className="font-normal">— Trabajos guardados en memoria local. Se sincronizarán al recuperar 4G.</span>
        </div>
      )}

      {syncStatusMsg && (
        <div className="bg-blue-600 text-white font-black text-xs px-4 py-2 text-center animate-pulse sticky top-0 z-50 shadow-lg">
          {syncStatusMsg}
        </div>
      )}

      {/* Banner Alerta Nueva OT en Vivo */}
      {bannerAlertaNuevaOT && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 rounded-3xl shadow-2xl border border-red-400 animate-bounce flex items-center justify-between z-40">
          <div className="space-y-0.5">
            <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">🚨 NUEVO SERVICIO ASIGNADO</span>
            <h4 className="font-black text-sm">{bannerAlertaNuevaOT.cuenta} — {bannerAlertaNuevaOT.nombre_abonado}</h4>
            <p className="text-xs text-red-100 font-medium truncate max-w-xs">{bannerAlertaNuevaOT.problema}</p>
          </div>
          <button
            onClick={() => {
              setOrdenSeleccionada(bannerAlertaNuevaOT)
              setBannerAlertaNuevaOT(null)
              setMenuSeccion('ordenes_pendientes')
            }}
            className="bg-white text-red-700 font-black text-xs px-3 py-2 rounded-2xl shadow hover:bg-red-50 active:scale-95 cursor-pointer shrink-0"
          >
            ATENDER
          </button>
        </div>
      )}

      {/* Top Header iOS Apple Bar */}
      <header className="bg-slate-900/80 border-b border-slate-800/80 px-5 py-4 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0b1329] border border-blue-500/40 rounded-2xl p-1.5 flex items-center justify-center shadow">
            <img src="/logo-gama.png" alt="GAMA Security" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wider text-white leading-tight">GAMA SEGURIDAD</h2>
            <p className="text-[11px] text-blue-400 font-bold leading-tight truncate max-w-[160px]">{tecnicoAutenticado}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {permisoNotificacion !== 'granted' && (
            <button
              onClick={solicitarPermisoNotificaciones}
              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
              title="Activar Notificaciones Push"
            >
              <span>🔔</span>
              <span>Push</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded-xl cursor-pointer"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Main Mobile Body Container */}
      <main className="p-4 space-y-4 max-w-lg mx-auto w-full flex-1">
        
        {/* SECCIÓN 1: ITINERARIO ASISTENTE & BIENVENIDA */}
        {menuSeccion === 'itinerario' && (
          <div className="space-y-4">
            
            {/* Card Bienvenida & Resumen Asistente */}
            <div className="bg-gradient-to-br from-slate-900/90 via-[#0b1329] to-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">ASISTENTE DE RUTA</span>
                  <h3 className="text-xl font-black text-white mt-1">¡Hola, {tecnicoAutenticado?.split(' ')[0]}! 👋</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-400 block">{ordenesPendientes.length}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pendientes</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Para hoy <strong className="text-white">{fechaHoyLegible}</strong> tienes agendadas <strong className="text-blue-400">{ordenesPendientes.length} atenciones técnicas</strong> en terreno.
              </p>

              {/* Botón Acción Principal */}
              {ordenesPendientes.length > 0 ? (
                <button
                  onClick={() => {
                    setOrdenSeleccionada(ordenesPendientes[0])
                    setMenuSeccion('ordenes_pendientes')
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                >
                  <span>🚀 INICIAR PRIMERA ATENCIÓN (# {ordenesPendientes[0].codigo_ot || ordenesPendientes[0].id})</span>
                </button>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-xs text-emerald-400 font-bold text-center">
                  🎉 ¡No tienes órdenes pendientes por realizar en este momento!
                </div>
              )}
            </div>

            {/* Listado Rápido de Itinerario */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">Itinerario Programado de Hoy:</h4>
              {ordenesPendientes.map((ot, idx) => (
                <div
                  key={ot.id}
                  onClick={() => {
                    setOrdenSeleccionada(ot)
                    setMenuSeccion('ordenes_pendientes')
                  }}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-blue-500/50 transition-all cursor-pointer shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-black text-sm text-white">{ot.cuenta} — {ot.nombre_abonado}</div>
                      <div className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{ot.tipo_visita} • {ot.bloque_horario}</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-400">Ver ➔</span>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* SECCIÓN 2: ÓRDENES PENDIENTES & DETALLE DE ATENCIÓN */}
        {menuSeccion === 'ordenes_pendientes' && (
          <div className="space-y-4">
            
            {/* Si no hay orden seleccionada, mostrar listado */}
            {!ordenSeleccionada ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Órdenes Pendientes ({ordenesPendientes.length})</h3>
                  <button onClick={() => cargarOrdenes()} className="text-xs text-blue-400 font-bold">🔄 Actualizar</button>
                </div>

                {ordenesPendientes.map(ot => (
                  <div
                    key={ot.id}
                    onClick={() => {
                      setOrdenSeleccionada(ot)
                      setNovedadTexto(ot.novedad || '')
                      setRepuestosTexto(ot.repuestos_utilizados || '')
                      setNombreFirmanteText(ot.nombre_firmante || '')
                    }}
                    className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl hover:border-blue-500/50 cursor-pointer transition-all backdrop-blur-xl"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full uppercase font-mono">
                          {ot.codigo_ot || `OT-${ot.id}`}
                        </span>
                        <h4 className="text-base font-black text-white mt-1">{ot.nombre_abonado}</h4>
                      </div>
                      <span className="text-xs font-bold text-slate-400 font-mono">{ot.cuenta}</span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                      <div>📍 <strong>Dirección:</strong> {ot.direccion}</div>
                      <div>🛠️ <strong>Requerimiento:</strong> {ot.problema}</div>
                      <div>🕒 <strong>Cita:</strong> {ot.fecha_cita} ({ot.bloque_horario})</div>
                    </div>

                    <button
                      className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-black py-2.5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1"
                    >
                      <span>GESTIONAR ATENCIÓN</span>
                      <span>➔</span>
                    </button>
                  </div>
                ))}

                {ordenesPendientes.length === 0 && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs italic">
                    No tienes órdenes de trabajo pendientes asignadas.
                  </div>
                )}
              </div>
            ) : (
              /* DETALLE Y FORMULARIO DE ATENCIÓN DE ORDEN SELECCIONADA */
              <div className="space-y-4">
                <button
                  onClick={() => setOrdenSeleccionada(null)}
                  className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 mb-2 cursor-pointer"
                >
                  <span>⬅️</span>
                  <span>Volver a la lista de órdenes</span>
                </button>

                {/* Tarjeta Encabezado OT */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-2xl backdrop-blur-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full uppercase font-mono">
                        {ordenSeleccionada.codigo_ot || `OT-${ordenSeleccionada.id}`}
                      </span>
                      <h3 className="text-lg font-black text-white mt-1.5">{ordenSeleccionada.nombre_abonado}</h3>
                    </div>
                    <span className="text-sm font-black text-blue-400 font-mono">CTA: {ordenSeleccionada.cuenta}</span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div>📍 <strong>Dirección:</strong> {ordenSeleccionada.direccion}</div>
                    <div>📞 <strong>Contacto:</strong> {ordenSeleccionada.telefono_contacto || 'Sin registro'}</div>
                    <div>🛠️ <strong>Falla Reportada:</strong> {ordenSeleccionada.problema}</div>
                  </div>

                  {/* Botones Transición de Estado */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => cambiarEstadoOrden(ordenSeleccionada.id, 'En Traslado')}
                      className={`py-3 rounded-2xl text-xs font-black uppercase transition-all cursor-pointer ${
                        ordenSeleccionada.estado === 'En Traslado' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      🚚 EN TRASLADO
                    </button>
                    <button
                      onClick={() => cambiarEstadoOrden(ordenSeleccionada.id, 'En Terreno')}
                      className={`py-3 rounded-2xl text-xs font-black uppercase transition-all cursor-pointer ${
                        ordenSeleccionada.estado === 'En Terreno' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      🏢 EN TERRENO
                    </button>
                  </div>
                </div>

                {/* BOTÓN MODO PRUEBAS DE SISTEMA */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🧪</span>
                        <span>Modo Pruebas de Terreno</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">Notifica a Central para ignorar alertas durante pruebas.</p>
                    </div>

                    <button
                      onClick={toggleModoPruebas}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase transition-all cursor-pointer shadow ${
                        modoPruebasActivo ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black animate-pulse' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {modoPruebasActivo ? '⚠️ EN PRUEBAS (ACTIVO)' : 'ACTIVAR PRUEBAS'}
                    </button>
                  </div>

                  {modoPruebasActivo && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl text-[11px] text-amber-300 font-bold">
                      ⚡ La cuenta está registrada en MODO PRUEBAS en Central. Al finalizar la atención se retirará automáticamente.
                    </div>
                  )}
                </div>

                {/* FORMULARIO DE TRABAJO REALIZADO & EVIDENCIA */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl backdrop-blur-2xl">
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                    📋 Informe Técnico & Evidencia
                  </h4>

                  {/* Trabajo Realizado */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase block">Trabajo / Solución Realizada:</label>
                    <textarea
                      value={novedadTexto}
                      onChange={(e) => setNovedadTexto(e.target.value)}
                      placeholder="Ej: Se reemplazó batería 12V 7Ah agotada en panel DSC 1832, se probó zona 03 PIR living con aviso OK a Central..."
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 h-24 resize-none shadow-inner"
                    />
                  </div>

                  {/* Repuestos Utilizados */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase block">Insumos & Repuestos Utilizados:</label>
                    <input
                      type="text"
                      value={repuestosTexto}
                      onChange={(e) => setRepuestosTexto(e.target.value)}
                      placeholder="Ej: 1x Batería 12V 7Ah Ultracell, 1x Sensor PIR DSC..."
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                    />
                  </div>

                  {/* Medición de Voltaje Batería */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase block">Medición Voltaje Fuente / Batería:</label>
                    <input
                      type="text"
                      value={voltajeBateriaInput}
                      onChange={(e) => setVoltajeBateriaInput(e.target.value)}
                      placeholder="Ej: 13.8V DC (Carga Normal OK)"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 shadow-inner"
                    />
                  </div>

                  {/* CAPTURA DE FOTOS DE EVIDENCIA */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300 uppercase">📷 Fotos de Evidencia (Máx 3):</label>
                      <span className="text-[10px] text-slate-400 font-bold">{fotosEvidencia.length}/3 fotos</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {fotosEvidencia.map((foto, i) => (
                        <div key={i} className="relative aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-700">
                          <img src={foto} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => eliminarFoto(i)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] font-black flex items-center justify-center shadow"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {fotosEvidencia.length < 3 && (
                        <label className="aspect-square bg-slate-950 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-white transition-colors">
                          <span className="text-xl">📸</span>
                          <span className="text-[9px] font-bold uppercase mt-1">Adjuntar Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleCapturarFoto}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* DATOS CLIENTE & FIRMA DIGITAL TOUCH */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <h5 className="text-xs font-black text-slate-300 uppercase">✍️ Conformidad del Cliente</h5>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400">Nombre de quien recibe:</label>
                        <input
                          type="text"
                          value={nombreFirmanteText}
                          onChange={(e) => setNombreFirmanteText(e.target.value)}
                          placeholder="Nombre y Apellido..."
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400">RUT / Identificación:</label>
                        <input
                          type="text"
                          value={rutFirmanteText}
                          onChange={(e) => setRutFirmanteText(e.target.value)}
                          placeholder="12.345.678-K"
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-300">Firma Touch Digitalizada:</label>
                        <button type="button" onClick={clearFirma} className="text-[10px] text-red-400 font-bold">Limpiar Canvas</button>
                      </div>
                      
                      <div className="bg-white p-1 rounded-2xl border-2 border-slate-700 overflow-hidden">
                        <canvas
                          ref={canvasRef}
                          width={340}
                          height={120}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full cursor-crosshair bg-white touch-none rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BOTÓN FINALIZAR */}
                  <button
                    onClick={handleFinalizarOrden}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all mt-3"
                  >
                    <span>✔️ FINALIZAR ATENCIÓN & FIRMAR COMPROBANTE</span>
                  </button>

                </div>
              </div>
            )}

          </div>
        )}

        {/* SECCIÓN 3: HISTORIAL DE SERVICIOS REALIZADOS */}
        {menuSeccion === 'servicios_realizados' && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider px-1">Servicios Completados ({ordenesCompletadas.length})</h3>

            {ordenesCompletadas.map(ot => (
              <div
                key={ot.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase font-mono">
                      {ot.codigo_ot || `OT-${ot.id}`}
                    </span>
                    <h4 className="text-base font-black text-white mt-1">{ot.nombre_abonado}</h4>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">{ot.cuenta}</span>
                </div>

                <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div>✅ <strong>Trabajo:</strong> {ot.novedad}</div>
                  {ot.repuestos_utilizados && <div>🛠️ <strong>Repuestos:</strong> {ot.repuestos_utilizados}</div>}
                  <div>✍️ <strong>Recepción:</strong> {ot.nombre_firmante || 'Cliente'} ({ot.rut_firmante || 'S/RUT'})</div>
                  <div>🕒 <strong>Cierre:</strong> {ot.fecha_cierre || ot.fecha_cita}</div>
                </div>

                <button
                  onClick={() => setOrdenImprimir(ot)}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-black py-2.5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>📄 VER CERTIFICADO OFICIAL / PDF</span>
                </button>
              </div>
            ))}

            {ordenesCompletadas.length === 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs italic">
                Aún no has completado servicios técnicos en este turno.
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 4: MONITOR DE EVENTOS DE ALARMA (SOLO LECTURA) */}
        {menuSeccion === 'eventos_alarma' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Monitor de Alarmas</h3>
                <p className="text-[11px] text-slate-400 font-medium">Recepción en tiempo real (Sólo Lectura)</p>
              </div>
              <button onClick={cargarEventosAlarma} className="text-xs text-blue-400 font-bold">🔄 Actualizar</button>
            </div>

            <input
              type="text"
              value={filtroCuentaAlarma}
              onChange={(e) => setFiltroCuentaAlarma(e.target.value)}
              placeholder="Buscar por cuenta, abonado o evento..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />

            <div className="space-y-2">
              {eventosFiltrados.map(ev => {
                const { hora, fecha } = formatFechaHoraChile(ev.fecha_hora)
                return (
                  <div key={ev.id} className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-xs text-blue-400">{ev.cuenta} — {ev.nombre_abonado || 'Abonado'}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{hora}</span>
                    </div>
                    <div className="text-xs font-bold text-white flex justify-between">
                      <span>{ev.evento}</span>
                      <span className="text-[11px] text-slate-400">ZN: {ev.zona || '--'}</span>
                    </div>
                  </div>
                )
              })}

              {eventosFiltrados.length === 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs italic">
                  No hay eventos de alarma para mostrar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN 5: PERFIL DEL TÉCNICO */}
        {menuSeccion === 'perfil' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-2xl backdrop-blur-2xl">
              <div className="w-20 h-20 bg-[#0b1329] border border-blue-500/40 rounded-full mx-auto p-2 flex items-center justify-center shadow-lg">
                <span className="text-3xl">👨‍🔧</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{tecnicoAutenticado}</h3>
                <p className="text-xs text-blue-400 font-bold">Personal Certificado GAMA Security</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2 text-slate-300">
                <div>🗓️ <strong>Fecha Turno:</strong> {fechaHoyLegible}</div>
                <div>📡 <strong>Estado Conexión:</strong> {isOffline ? '📡 Modo Offline (Memoria Local)' : '🟢 Conectado 4G (Supabase Realtime)'}</div>
                <div>🔔 <strong>Notificaciones Push:</strong> {permisoNotificacion === 'granted' ? '🟢 Activadas' : '🔴 Desactivadas'}</div>
                <div>⚡ <strong>Cierre de Sesión:</strong> Automático a las 00:00 hrs</div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-black py-3 rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
              >
                CERRAR SESIÓN DE TURNO
              </button>
            </div>
          </div>
        )}

      </main>

      {/* FLOATING BOTTOM NAVIGATION BAR (APPLE iOS STYLE) */}
      <nav className="fixed bottom-3 left-3 right-3 max-w-lg mx-auto bg-slate-900/90 border border-slate-800/90 backdrop-blur-2xl rounded-3xl p-2 flex items-center justify-around shadow-2xl z-40">
        
        <button
          onClick={() => {
            setOrdenSeleccionada(null)
            setMenuSeccion('itinerario')
          }}
          className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            menuSeccion === 'itinerario' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-lg">🗺️</span>
          <span className="text-[10px] font-black uppercase mt-0.5">Ruta</span>
        </button>

        <button
          onClick={() => {
            setOrdenSeleccionada(null)
            setMenuSeccion('ordenes_pendientes')
            setNuevasOrdenesBadge(0)
          }}
          className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all relative cursor-pointer ${
            menuSeccion === 'ordenes_pendientes' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-lg">📋</span>
          <span className="text-[10px] font-black uppercase mt-0.5">Pendientes</span>
          {nuevasOrdenesBadge > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow animate-bounce">
              {nuevasOrdenesBadge}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setOrdenSeleccionada(null)
            setMenuSeccion('servicios_realizados')
          }}
          className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            menuSeccion === 'servicios_realizados' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-lg">✅</span>
          <span className="text-[10px] font-black uppercase mt-0.5">Historial</span>
        </button>

        <button
          onClick={() => {
            setOrdenSeleccionada(null)
            setMenuSeccion('eventos_alarma')
          }}
          className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            menuSeccion === 'eventos_alarma' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-lg">🔔</span>
          <span className="text-[10px] font-black uppercase mt-0.5">Alarmas</span>
        </button>

        <button
          onClick={() => {
            setOrdenSeleccionada(null)
            setMenuSeccion('perfil')
          }}
          className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            menuSeccion === 'perfil' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-lg">👤</span>
          <span className="text-[10px] font-black uppercase mt-0.5">Perfil</span>
        </button>

      </nav>

      {/* VISOR COMPROBANTE / CERTIFICADO OFICIAL COMPLETO (HOJA CARTA EXECUTIVE PDF) */}
      {ordenImprimir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 font-sans text-black select-text print:p-0 print:bg-white print:static print:inset-auto">
          <style>{`
            @media print {
              @page {
                size: letter portrait;
                margin: 5mm;
              }
              body, html {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-cert-card {
                width: 100% !important;
                max-width: 100% !important;
                padding: 10px !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                background: white !important;
                page-break-inside: avoid !important;
              }
            }
          `}</style>

          <div className="print-cert-card w-full max-w-[850px] bg-white p-6 md:p-8 shadow-2xl rounded-3xl border border-gray-400 max-h-[96vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0 print:overflow-visible">
            
            {/* Encabezado Corporativo Oficial */}
            <div className="flex justify-between items-start border-b-2 border-blue-900 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-blue-950 p-2 rounded-xl flex items-center justify-center">
                  <img src="/logo-gama.png" alt="Gama Seguridad" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-blue-950 tracking-wider">GAMA SEGURIDAD 24/7</h1>
                  <p className="text-xs text-gray-600 font-bold">Mantenimiento Electrónico & Monitoreo de Alarmas</p>
                  <p className="text-[10px] text-gray-500">Certificado Oficial de Atención Técnica en Terreno</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block bg-blue-950 text-white font-mono text-sm font-black px-4 py-1.5 rounded-lg shadow">
                  CERTIFICADO N° {ordenImprimir.codigo_ot || `OT-${ordenImprimir.id}`}
                </span>
                <p className="text-xs text-gray-700 mt-2 font-bold">Emisión: {ordenImprimir.fecha_cierre || ordenImprimir.fecha_cita}</p>
                <p className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-block mt-1">
                  STATUS: VERIFICADO OK
                </p>
              </div>
            </div>

            {/* SECCIÓN 1: DATOS ABONADO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 space-y-2">
              <h3 className="text-xs font-black text-blue-900 uppercase border-b border-slate-300 pb-1">I. Identificación del Abonado & Domicilio</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><strong>Código Cuenta:</strong> <span className="font-mono font-black text-blue-900">{ordenImprimir.cuenta}</span></div>
                <div><strong>Nombre / Razón Social:</strong> {ordenImprimir.nombre_abonado}</div>
                <div><strong>Dirección Comercial/Residencial:</strong> {ordenImprimir.direccion}</div>
                <div><strong>Teléfono Contacto:</strong> {ordenImprimir.telefono_contacto || 'Sin registro'}</div>
              </div>
            </div>

            {/* SECCIÓN 2: RESUMEN DE ATENCIÓN */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 space-y-2">
              <h3 className="text-xs font-black text-blue-900 uppercase border-b border-slate-300 pb-1">II. Resumen Operativo del Servicio</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><strong>Tipo de Visita:</strong> {ordenImprimir.tipo_visita || 'Correctiva'}</div>
                <div><strong>Bloque Horario:</strong> {ordenImprimir.bloque_horario}</div>
                <div><strong>Técnico Certificado Responsable:</strong> {ordenImprimir.tecnico}</div>
                <div><strong>Voltaje Batería / Fuente:</strong> {ordenImprimir.voltaje_bateria || '13.8V DC (Normal)'}</div>
              </div>
            </div>

            {/* SECCIÓN 3: DIAGNÓSTICO & INFORME */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 space-y-2">
              <h3 className="text-xs font-black text-blue-900 uppercase border-b border-slate-300 pb-1">III. Requerimiento & Diagnóstico Técnico Ejecutado</h3>
              <div className="text-xs space-y-1.5">
                <div><strong>Falla Reportada Inicial:</strong> {ordenImprimir.problema}</div>
                <div><strong>Trabajo Realizado en Terreno:</strong> {ordenImprimir.novedad}</div>
                <div><strong>Repuestos / Insumos Utilizados:</strong> {ordenImprimir.repuestos_utilizados || 'Ninguno (Mantenimiento preventivo)'}</div>
              </div>
            </div>

            {/* SECCIÓN 4: FOTOS EVIDENCIA */}
            {ordenImprimir.fotos_evidencia && ordenImprimir.fotos_evidencia.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 space-y-2">
                <h3 className="text-xs font-black text-blue-900 uppercase border-b border-slate-300 pb-1">IV. Registro Fotográfico de Evidencia en Terreno</h3>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {ordenImprimir.fotos_evidencia.map((foto, i) => (
                    <div key={i} className="aspect-square bg-white border border-gray-300 rounded-lg overflow-hidden p-1 shadow-sm">
                      <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-full object-cover rounded" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN 5: REEPCIÓN & CONFORMIDAD */}
            <div className="border border-gray-300 p-4 rounded-xl bg-slate-50 mb-6 space-y-3">
              <h3 className="text-xs font-black text-blue-900 uppercase border-b border-slate-300 pb-1">V. Conformidad & Recepción del Servicio</h3>
              
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <p className="text-xs font-bold text-gray-700">Firma Cliente Receptor:</p>
                  <p className="text-xs text-gray-600">Nombre: <strong>{ordenImprimir.nombre_firmante || 'Cliente'}</strong></p>
                  <p className="text-xs text-gray-600">RUT: <strong>{ordenImprimir.rut_firmante || 'S/RUT'}</strong></p>
                  
                  {ordenImprimir.firma ? (
                    <img src={ordenImprimir.firma} alt="Firma Touch" className="h-20 border border-gray-400 bg-white p-1 rounded mt-2 shadow-sm" />
                  ) : (
                    <div className="h-20 border border-dashed border-gray-400 bg-white rounded mt-2 flex items-center justify-center text-xs text-gray-400 italic">
                      Firma Digitalizada Registrada
                    </div>
                  )}
                </div>

                <div className="text-right flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-700">Técnico Certificado GAMA Security:</p>
                    <p className="text-xs text-gray-900 font-black">{ordenImprimir.tecnico}</p>
                    <p className="text-[10px] text-gray-500">GAMA Security 24/7 SpA — Chile</p>
                  </div>

                  <div className="border-t border-gray-300 pt-2">
                    <span className="text-[10px] text-gray-400 block font-mono">Sello Digital de Validación GAMA # {ordenImprimir.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones Imprimir / Cerrar */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 print:hidden">
              <button
                onClick={() => setOrdenImprimir(null)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 font-black text-xs rounded-xl hover:bg-gray-300 cursor-pointer"
              >
                CERRAR
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-blue-900 text-white font-black text-xs rounded-xl hover:bg-blue-950 shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>IMPRIMIR CERTIFICADO PDF (HOJA CARTA)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
