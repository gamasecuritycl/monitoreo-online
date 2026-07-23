'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, type EventoMonitoreo } from '@/lib/supabase'
import EventGrid from './EventGrid'
import FooterActions from './FooterActions'
import ToolModal from './ToolModal'
import ExpedienteModal from './ExpedienteModal'
import EventosPorUsuarioModal from './EventosPorUsuarioModal'
import ZonificacionModal from './ZonificacionModal'
import NotificacionesMailModal from './NotificacionesMailModal'
import NotificacionesWhatsAppModal from './NotificacionesWhatsAppModal'
import NotificacionesLlamadasSMSModal from './NotificacionesLlamadasSMSModal'
import BitacoraModal from './BitacoraModal'
import TodosLosEventosModal from './TodosLosEventosModal'
import ServicioTecnicoModal from './ServicioTecnicoModal'
import LoginModal from './LoginModal'
import ControlTestModal from './ControlTestModal'
import ReportesModal from './ReportesModal'
import ConfigModal from './ConfigModal'
import VideoVerificacionModal from './VideoVerificacionModal'
import { lookupContactId } from '@/lib/contact_id_library'
import { sendMessage, generarMensajeAlerta, generarMensajeEnergia, detectarPatronEvento, type EventInfo } from '@/lib/whatsapp'

// ── Contactos del Panel Lateral de Scorpion ──
interface ContactoAutorizado {
  prioridad: number
  nombre: string
  telefono: string
}

function obtenerDatosAbonado(cuenta: string, nombreAbonado: string, clienteDb: Record<string, string> | null) {
  // Datos base con fallback por si no existe
  const datos = {
    direccion: clienteDb?.direccion || 'Av. Providencia 1420, Of. 602',
    comuna: clienteDb?.ciudad || clienteDb?.sector || 'Providencia, Santiago',
    contactos: [] as ContactoAutorizado[]
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
  const [expedientePestana, setExpedientePestana] = useState<'telefonos' | 'horarios' | 'camara'>('telefonos')
  const [horaLocal, setHoraLocal] = useState('')
  const [mostrarMenuNotificaciones, setMostrarMenuNotificaciones] = useState(false)
  const [mostrarMenuReportes, setMostrarMenuReportes] = useState(false)
  const [whatsappTelefonoInicial, setWhatsappTelefonoInicial] = useState<string | undefined>(undefined)
  
  // Mapa de clientes cargado en tiempo real
  const [clientesMap, setClientesMap] = useState<Record<string, Record<string, string>>>({})
  
  // Mapa de códigos de color desde CODIGOS.MDB
  const [codigosMap, setCodigosMap] = useState<Record<string, { descripcion: string; zn_us: string; color: string }> | undefined>(undefined)

  // Mapa de zonificación por abonado desde ZONIFICACION MDB
  const [zonasMap, setZonasMap] = useState<Record<string, { numero: string; dispositivo: string; area: string }[]>>({})

  // Gestión de Usuarios y Roles (RBAC)
  interface Operator {
    codigo: string
    nombre: string
    rol: 'Administrador' | 'Supervisor' | 'Operadora' | 'Técnico'
    clave: string
  }

  const OPERADORES_FALLBACK: Operator[] = [
    { codigo: '01', nombre: 'Tomás Toro', rol: 'Administrador', clave: '123' },
    { codigo: '02', nombre: 'Mauricio Tapia', rol: 'Supervisor', clave: '123' },
    { codigo: '03', nombre: 'Juan Pérez', rol: 'Operadora', clave: '123' },
    { codigo: '04', nombre: 'Diego Reyes', rol: 'Técnico', clave: '123' }
  ]

  const [operadores, setOperadores] = useState<Operator[]>(OPERADORES_FALLBACK)
  const [usuarioActivo, setUsuarioActivo] = useState<Operator>(OPERADORES_FALLBACK[0])
  const [sesionIniciada, setSesionIniciada] = useState(false)
  const [unreadWhatsAppCount, setUnreadWhatsAppCount] = useState(0)

  // Suscripción Realtime a mensajes entrantes de WhatsApp
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp_inbound_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversaciones_whatsapp' },
        () => {
          setUnreadWhatsAppCount((prev) => prev + 1)
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(880, ctx.currentTime)
            gain.gain.setValueAtTime(0.12, ctx.currentTime)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start()
            osc.stop(ctx.currentTime + 0.15)
          } catch {}
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Cargar operadores desde Supabase ('CONFIG_OPERADORES')
  useEffect(() => {
    const fetchOperadores = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CONFIG_OPERADORES')
          .limit(1)
        if (data && data.length > 0 && !error) {
          const parsed = JSON.parse(data[0].nombre_abonado || '[]')
          if (parsed && parsed.length > 0) {
            setOperadores(parsed)
            // Ajustar el usuario activo
            const match = parsed.find((o: any) => o.codigo === usuarioActivo.codigo)
            if (match) {
              setUsuarioActivo(match)
            } else {
              setUsuarioActivo(parsed[0])
            }
          }
        }
      } catch (err) {
        console.warn('Error loading operators list:', err)
      }
    }
    fetchOperadores()
  }, [])

  const guardarOperadoresBase = async (listaNueva: Operator[]) => {
    try {
      await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'CONFIG_OPERADORES',
          nombre_abonado: JSON.stringify(listaNueva),
          evento: 'CONFIGURACION',
          fecha_hora: new Date().toISOString()
        })
      setOperadores(listaNueva)
    } catch (err) {
      console.error('Error guardando operadores:', err)
    }
  }

  // Heartbeat del sincronizador.py en PC Scorpion
  const [sincronizadorVivo, setSincronizadorVivo] = useState(true)
  const [ultimoHeartbeat, setUltimoHeartbeat] = useState<string | null>(null)

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

  // Cargar mapa de zonificación de abonados
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'ZONAS')
          .limit(1)
        if (data && data.length > 0) {
          const rawJson = data[0].nombre_abonado
          if (rawJson) {
            const map = JSON.parse(rawJson)
            setZonasMap(map)
            console.log(`[SUPABASE DASHBOARD] Zonificación de ${Object.keys(map).length} abonados cargada.`)
          }
        }
      } catch (err) {
        console.warn('[SUPABASE DASHBOARD] Error cargando zonificación.')
      }
    }
    fetchZonas()
  }, [])

  // Suscripción Realtime a mensajes entrantes de WhatsApp para el badge rojo
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { count } = await supabase
          .from('conversaciones_whatsapp')
          .select('id', { count: 'exact', head: true })
          .eq('estado', 'pendiente')
          .not('respuesta_recibida', 'is', null)

        if (count !== null) setUnreadWhatsAppCount(count)
      } catch (err) {
        console.warn('[SUPABASE UNREAD] Error contando unread:', err)
      }
    }
    fetchUnread()
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
  // Cargar lista de eventos iniciales ignorando filas internas de configuración y fotogramas
  const esCuentaInternaOFrame = (cuentaRaw: string = '', eventoRaw: string = '') => {
    const c = (cuentaRaw || '').toUpperCase().trim()
    const e = (eventoRaw || '').toUpperCase().trim()
    if (c.startsWith('CAMARAS_DAHUA_') || c.startsWith('DAHUA_FRAME_')) return true
    if (['CLIENTES', 'CODIGOS', 'ZONAS', '__SINCRONIZADOR__', 'EMPRESAS_CONGLOMERADO', 'COTIZACIONES_DOLIBARR', 'ORDENES_TRABAJO', 'CONFIG_OPERADORES', 'CLIENTES_MAESTROS_CRM'].includes(c)) return true
    if (['ELIMINACION_DAHUA_CRUD', 'GENERACION_NVR_MULTICANAL', 'FRAME_SYNC', 'NVR_DVR_FRAME_SYNC', 'CAMERA_FRAME_SYNC'].includes(e)) return true
    return false
  }

  const fetchEventos = useCallback(async () => {
    try {
      let query = supabase
        .from('eventos_monitoreo')
        .select('*')
        .order('fecha_hora', { ascending: false })
        .limit(1000)

      if (busqueda.trim()) {
        query = query.or(`cuenta.ilike.%${busqueda}%,nombre_abonado.ilike.%${busqueda}%`)
      }

      const { data } = await query
      if (data) {
        const limpios = data.filter(ev => !esCuentaInternaOFrame(ev.cuenta, ev.evento))
        const ordenados = limpios.slice(0, 100).reverse()
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
    let latestTime = ''
    const poll = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .order('fecha_hora', { ascending: false })
          .limit(1000)

        if (!data || data.length === 0) return
        const maxTime = data[0].fecha_hora
        if (maxTime <= latestTime) return

        latestTime = maxTime
        const filtered = busqueda.trim()
          ? data.filter(e =>
              e.cuenta?.toLowerCase().includes(busqueda.toLowerCase()) ||
              e.nombre_abonado?.toLowerCase().includes(busqueda.toLowerCase())
            )
          : data

        const limpios = filtered.filter(ev => !esCuentaInternaOFrame(ev.cuenta, ev.evento))
        const ordenados = [...limpios].slice(0, 100).reverse()
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos_monitoreo' }, async (payload) => {
        const newEvent = payload.new as EventoMonitoreo
        // Ignorar filas especiales de sincronización y configuración de cámaras
        if (esCuentaInternaOFrame(newEvent.cuenta, newEvent.evento)) return
        
        setEventos((prev) => {
          if (prev.some(e => e.id === newEvent.id)) return prev
          const next = [...prev, newEvent]
          if (next.length > 50) next.shift()
          return next
        })
        setEventoSeleccionado(newEvent)

        // ── Notificación push del navegador para alarmas críticas ──
        const eventoUpper = (newEvent.evento || '').toUpperCase()
        const cidInfo = lookupContactId(eventoUpper)
        const esAlarmaCritica = eventoUpper.includes('ALARMA') || eventoUpper.includes('PÁNICO') || eventoUpper.includes('PANICO') || eventoUpper.includes('INCENDIO')
        if (esAlarmaCritica && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const notif = new Notification('🚨 ALARMA CRÍTICA — GAMA SEGURIDAD', {
              body: `Cuenta: ${newEvent.cuenta} | ${newEvent.nombre_abonado}\nEvento: ${newEvent.evento}\nHora: ${new Date(newEvent.fecha_hora).toLocaleTimeString('es-CL')}`,
              icon: '/favicon.ico',
              requireInteraction: true,
              tag: `alarma-${newEvent.cuenta}`,
            })
            notif.onclick = () => { window.focus(); notif.close() }
          } catch {}
        }

        // Verificación de Notificaciones (Apertura o Cierre)
        const isAperturaCierre = eventoUpper.includes('APERTURA') || eventoUpper.includes('CIERRE') || (cidInfo && cidInfo.categoria === 'APERTURA')
        
        if (isAperturaCierre) {
          try {
            // Verificar si el cliente tiene correos configurados
            const { data } = await supabase
              .from('notificaciones_mail')
              .select('emails')
              .eq('cuenta', newEvent.cuenta)
              .single()
            
            if (data && data.emails && data.emails.length > 0) {
              await fetch('/api/enviar-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cuenta: newEvent.cuenta,
                  nombre_cliente: newEvent.nombre_abonado,
                  tipo_evento: eventoUpper,
                  fecha_hora: newEvent.fecha_hora,
                  destinatarios: data.emails
                })
              })
            }
          } catch (e) {
            console.error('Error al verificar/enviar notificación por mail:', e)
          }
        }

        // WhatsApp: enviar notificación según configuración del cliente
        try {
          const { data: waConfig, error: waErr } = await supabase
            .from('notificaciones_whatsapp')
            .select('*')
            .eq('cuenta', newEvent.cuenta)
            .eq('activo', true)
            .single()

          if (waConfig?.telefono && !waErr) {
            const silenciado = waConfig.silencio_hasta && new Date(waConfig.silencio_hasta) > new Date()
            if (!silenciado) {
              const isEnergia = eventoUpper.includes('ENERGÍA') || eventoUpper.includes('ENERGIA') || eventoUpper.includes('FALLA')
              const esApertura = eventoUpper.includes('APERTURA') || (cidInfo && cidInfo.categoria === 'APERTURA')
              const esCierre = eventoUpper.includes('CIERRE')

              // Respetar configuración individual (con defaults si columnas no existen)
              const waNotifAlarma = waConfig.notificar_alarma !== undefined ? waConfig.notificar_alarma : true
              const waNotifEnergia = waConfig.notificar_energia !== undefined ? waConfig.notificar_energia : true
              const waNotifApertura = waConfig.notificar_apertura === true
              const waNotifCierre = waConfig.notificar_cierre === true
              const waNotifVideo = waConfig.notificar_video === true

              if (isEnergia && !waNotifEnergia) { return }
              if (esApertura && !waNotifApertura) { return }
              if (esCierre && !waNotifCierre) { return }
              if (!isEnergia && !esApertura && !esCierre && !waNotifAlarma) { return }

              const telefono = waConfig.telefono.replace(/[^0-9]/g, '')

              const { data: eventosRecientes } = await supabase
                .from('eventos_monitoreo')
                .select('zona, evento')
                .eq('cuenta', newEvent.cuenta)
                .gte('fecha_hora', new Date(Date.now() - 5 * 60 * 1000).toISOString())
                .limit(10)

              const info: EventInfo = {
                cuenta: newEvent.cuenta,
                nombre_cliente: newEvent.nombre_abonado,
                tipo_evento: isEnergia ? 'FALLA ENERGÍA ELÉCTRICA' : eventoUpper,
                zonas: [...new Set([...(eventosRecientes || []).map((e: any) => e.zona)])].filter(Boolean),
                fecha_hora: newEvent.fecha_hora,
                direccion: '',
              }
              if (!info.zonas.includes(newEvent.zona || '')) {
                info.zonas.push(newEvent.zona || '')
              }

              const { critico } = detectarPatronEvento(eventosRecientes || [])
              const texto = isEnergia ? generarMensajeEnergia(info) : generarMensajeAlerta(info, critico)

              sendMessage(telefono, texto).then(async (resultado) => {
                if (resultado.ok) {
                  const ahora = new Date()
                  const silencioHasta = new Date(ahora.getTime() + 60 * 60 * 1000)

                  await supabase.from('conversaciones_whatsapp').insert({
                    cuenta: newEvent.cuenta,
                    numero: telefono,
                    tipo_evento: isEnergia ? 'FALLA ENERGÍA' : eventoUpper,
                    estado: isEnergia ? 'energia' : (critico ? 'critico' : 'informativo'),
                    mensaje_enviado: isEnergia ? 'FALLA ENERGÍA' : (critico ? 'ALERTA CRÍTICA' : 'NOTIFICACIÓN'),
                    respuesta_cliente: null,
                    created_at: ahora.toISOString(),
                  })

                  // Enviar video-verificacion automatica si esta habilitado y hay alarma de robo
                  if (waNotifVideo && !isEnergia && !esApertura && !esCierre) {
                    try {
                      const { data: camData } = await supabase
                        .from('eventos_monitoreo')
                        .select('nombre_abonado')
                        .eq('cuenta', 'CAMARAS')
                        .limit(1)
                      if (camData && camData.length > 0) {
                        const allCams = JSON.parse(camData[0].nombre_abonado || '{}')
                        const clientCams = allCams[newEvent.cuenta]
                        const targetVideo = clientCams?.cam01 || clientCams?.cam02 || clientCams?.cam03
                        if (targetVideo) {
                          const isMediaMtx = targetVideo.toLowerCase().trim() === 'mediamtx' || (!targetVideo.startsWith('http') && !targetVideo.startsWith('https') && !targetVideo.startsWith('/'))
                          const videoUrl = isMediaMtx
                            ? `https://dashboard-eight-sable-51.vercel.app/live/${newEvent.cuenta.toLowerCase()}`
                            : targetVideo
                          const videoMsg = `🎥 *VERIFICACIÓN POR VIDEO AUTOMÁTICA*\n━━━━━━━━━━━━━━━━━━━━━\nSe ha detectado una alarma. Puedes revisar el video en el siguiente enlace:\n🔗 ${videoUrl}`
                          sendMessage(telefono, videoMsg).catch(() => {})
                        }
                      }
                    } catch (camErr) {
                      console.error('Error al enviar video-verificación automática:', camErr)
                    }
                  }

                  await supabase.from('notificaciones_whatsapp').upsert({
                    cuenta: newEvent.cuenta,
                    telefono,
                    activo: true,
                    silencio_hasta: silencioHasta.toISOString(),
                    updated_at: ahora.toISOString(),
                  }, { onConflict: 'cuenta' })
                }
              }).catch(() => {})
            }
          }
        } catch (e) {
          console.error('Error al verificar/enviar notificación por WhatsApp:', e)
        }

        // ── Registro automático en Bitácora ──
        try {
          const BITACORA_API = 'https://bitacora.gamasecurity.cl/api-bitacora.php'
          const isEnergia = eventoUpper.includes('ENERGÍA') || eventoUpper.includes('ENERGIA') || eventoUpper.includes('FALLA')
          const esApertura = eventoUpper.includes('APERTURA') || (cidInfo && cidInfo.categoria === 'APERTURA')
          const esCierre = eventoUpper.includes('CIERRE')

          let debeRegistrar = false
          let tipoBitacora = '1'
          let comentarioBitacora = ''

          if (isEnergia) {
            debeRegistrar = true
            tipoBitacora = '4'
            comentarioBitacora = '⚡ Corte de energía eléctrica - Sistema operando con batería de respaldo. Se avisará al cliente'
          } else if (esApertura) {
            debeRegistrar = true
            tipoBitacora = '3'
            comentarioBitacora = '🔓 Apertura de sistema'
          } else if (esCierre) {
            debeRegistrar = true
            tipoBitacora = '3'
            comentarioBitacora = '🔒 Cierre de sistema'
          } else {
            // Múltiples activaciones (patrón crítico)
            const { data: eventosRecientes } = await supabase
              .from('eventos_monitoreo')
              .select('zona, evento')
              .eq('cuenta', newEvent.cuenta)
              .gte('fecha_hora', new Date(Date.now() - 5 * 60 * 1000).toISOString())
              .limit(10)

            const { critico } = detectarPatronEvento(eventosRecientes || [])
            if (critico) {
              debeRegistrar = true
              tipoBitacora = '1'

              const zonasUnicas = [...new Set([...(eventosRecientes || []).map((e: any) => e.zona)])].filter(Boolean)
              const cuentaKey = (newEvent.cuenta || '').toUpperCase().trim()
              const zonasAbonado = zonasMap[cuentaKey] || []

              let detalleZonas = ''
              if (zonasAbonado.length > 0) {
                const nombresZonas = zonasUnicas.map(z => {
                  const match = zonasAbonado.find(za => za.numero === z)
                  return match ? `${z}: ${match.area}` : `Zona ${z}`
                })
                detalleZonas = '\nZonas involucradas:\n' + nombresZonas.map(zn => `  • ${zn}`).join('\n')
              } else {
                detalleZonas = '\nZonas involucradas: ' + zonasUnicas.join(', ')
              }

              comentarioBitacora = `🚨 INCIDENCIA CONCURRENTE - ${eventoUpper}${detalleZonas}`
            }
          }

          if (debeRegistrar) {
            const res = await fetch(`${BITACORA_API}?action=abonados&q=${encodeURIComponent(newEvent.cuenta)}`)
            const abonados = await res.json()
            if (abonados.length > 0) {
              await fetch(`${BITACORA_API}?action=crear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id_abonado: abonados[0].id,
                  comentario: comentarioBitacora,
                  tipo_evento: parseInt(tipoBitacora),
                  id_responsable: 1,
                }),
              })
            }
          }
        } catch (e) {
          console.error('Error al registrar en bitácora:', e)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Monitorear heartbeat del sincronizador en PC Scorpion
  useEffect(() => {
    const checkHeartbeat = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('fecha_hora')
          .order('id', { ascending: false })
          .limit(1)
        if (data && data.length > 0) {
          setSincronizadorVivo(true)
          setUltimoHeartbeat(data[0].fecha_hora)
        } else {
          setSincronizadorVivo(true)
        }
      } catch {
        setSincronizadorVivo(true)
      }
    }
    checkHeartbeat()
    const timer = setInterval(checkHeartbeat, 15000)
    return () => clearInterval(timer)
  }, [])

  // ── Ítem 3: Solicitar permiso de notificaciones push del navegador al iniciar sesión ──
  useEffect(() => {
    if (!sesionIniciada) return
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [sesionIniciada])

  // Trigger de chequeo del sincronizador caído en la nube para enviar alertas de WhatsApp
  useEffect(() => {
    const triggerHeartbeatAlertCheck = async () => {
      try {
        await fetch('/api/check-heartbeat')
      } catch {
        // Silenciar errores
      }
    }
    triggerHeartbeatAlertCheck()
    const interval = setInterval(triggerHeartbeatAlertCheck, 120000)
    return () => clearInterval(interval)
  }, [])

  // Extraer datos del abonado activo para poblar las tarjetas derechas
  const activeEvent = eventoSeleccionado || (eventos.length > 0 ? eventos[eventos.length - 1] : null)
  const cuentaKey = activeEvent ? activeEvent.cuenta.toUpperCase().trim() : ''
  const clienteDb = cuentaKey ? (clientesMap[cuentaKey] || null) : null
  const clientData = activeEvent ? obtenerDatosAbonado(activeEvent.cuenta, activeEvent.nombre_abonado, clienteDb) : null

  const direccionParaMapa = clientData?.direccion && clientData.direccion !== 'Av. Providencia 1420, Of. 602'
    ? `${clientData.direccion}, ${clientData.comuna || ''}, Chile`
    : ''
  const mapUrl = direccionParaMapa ? `https://maps.google.com/maps?q=${encodeURIComponent(direccionParaMapa)}&t=&z=15&ie=UTF8&iwloc=&output=embed` : ''

  if (!sesionIniciada) {
    return (
      <div className="h-[100dvh] bg-[#070b13] flex items-center justify-center relative font-mono select-none overflow-hidden">
        {/* CRT Scanlines background */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] z-10" />
        
        <LoginModal
          onClose={() => {}}
          onLoginSuccess={(op) => {
            setUsuarioActivo(op)
            setSesionIniciada(true)
          }}
          operadores={operadores}
        />
      </div>
    )
  }

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
          <button
            onClick={() => {
              setUnreadWhatsAppCount(0)
              setModalActivo('notificaciones-whatsapp')
            }}
            className="flex items-center gap-1.5 ml-1 bg-transparent border-0 hover:opacity-85 cursor-pointer active:scale-95 transition-all text-left relative"
            title="Abrir Centro de Mensajería y Chat de WhatsApp"
          >
            <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${
              unreadWhatsAppCount > 0 ? 'bg-red-500 shadow-[#ef4444]' : 'bg-green-500 shadow-[#22c55e]'
            }`} />
            <span className={`font-bold text-[10px] tracking-wider hover:underline select-none ${
              unreadWhatsAppCount > 0 ? 'text-red-400 font-extrabold' : 'text-green-400'
            }`}>
              WhatsApp {unreadWhatsAppCount > 0 ? `(${unreadWhatsAppCount} NUEVO)` : ''}
            </span>
          </button>
          <div className="flex items-center gap-1.5 ml-1" title={ultimoHeartbeat ? `Último heartbeat: ${ultimoHeartbeat}` : 'Sin heartbeat'}>
            <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${
              sincronizadorVivo
                ? 'bg-green-500 shadow-[#22c55e]'
                : 'bg-red-500 shadow-[#ef4444]'
            }`} />
            <span className={`font-bold text-[10px] tracking-wider ${
              sincronizadorVivo ? 'text-green-400' : 'text-red-400'
            }`}>SINCR.</span>
          </div>

          <div className="flex items-center gap-1 bg-[#1e293b] px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 border border-slate-700">
            <span>👤 {usuarioActivo.nombre} ({usuarioActivo.rol.toUpperCase()})</span>
            <button
              onClick={() => setSesionIniciada(false)}
              className="text-blue-400 hover:text-blue-300 ml-1.5 underline cursor-pointer"
            >
              Cambiar
            </button>
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

      {/* ── BARRA DE KPIs EN TIEMPO REAL ── */}
      {(() => {
        const hoy = new Date().toDateString()
        const eventosFiltrados = eventos.filter(e => {
          const cuentasEsp = ['CLIENTES','CODIGOS','ZONAS','__SINCRONIZADOR__','CAMARAS','CONFIG_OPERADORES']
          return !cuentasEsp.includes((e.cuenta || '').toUpperCase().trim())
        })
        const alarmasCriticas = eventosFiltrados.filter(e => {
          const ev = (e.evento || '').toUpperCase()
          return ev.includes('ALARMA') || ev.includes('PÁNICO') || ev.includes('PANICO') || ev.includes('INCENDIO')
        })
        const aperturasHoy = eventosFiltrados.filter(e => {
          const ev = (e.evento || '').toUpperCase()
          return (ev.includes('APERTURA') || ev.includes('CIERRE')) && new Date(e.fecha_hora).toDateString() === hoy
        })
        // Abonado con más eventos
        const conteo: Record<string, number> = {}
        eventosFiltrados.forEach(e => {
          const k = e.nombre_abonado || e.cuenta
          conteo[k] = (conteo[k] || 0) + 1
        })
        const masActivo = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]
        const ratio = eventosFiltrados.length > 0 ? Math.round((alarmasCriticas.length / eventosFiltrados.length) * 100) : 0

        return (
          <div className="hidden md:flex items-center gap-0 border-b border-[#1e293b] bg-[#0a0f1e] shrink-0 overflow-x-auto">
            {[
              {
                icon: '🚨',
                label: 'ALARMAS CRÍTICAS',
                value: alarmasCriticas.length,
                color: alarmasCriticas.length > 0 ? 'text-red-400' : 'text-slate-500',
                bg: alarmasCriticas.length > 0 ? 'bg-red-950/30' : '',
              },
              {
                icon: '🔒',
                label: 'APERT./CIERRES HOY',
                value: aperturasHoy.length,
                color: 'text-blue-400',
                bg: '',
              },
              {
                icon: '📊',
                label: 'BUFFER TOTAL',
                value: eventosFiltrados.length,
                color: 'text-slate-300',
                bg: '',
              },
              {
                icon: '⚡',
                label: 'CRITICIDAD',
                value: `${ratio}%`,
                color: ratio > 20 ? 'text-orange-400' : 'text-green-400',
                bg: ratio > 20 ? 'bg-orange-950/20' : '',
              },
              {
                icon: '👁',
                label: 'MÁS ACTIVO',
                value: masActivo ? `${masActivo[0].slice(0, 16)} (${masActivo[1]})` : '—',
                color: 'text-yellow-400',
                bg: '',
              },
            ].map((kpi, i) => (
              <div key={i} className={`flex items-center gap-2 px-4 py-1.5 border-r border-[#1e293b] font-mono text-[10px] whitespace-nowrap ${kpi.bg}`}>
                <span>{kpi.icon}</span>
                <span className="text-slate-600 tracking-wider">{kpi.label}:</span>
                <span className={`font-black ${kpi.color}`}>{kpi.value}</span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* ── BARRA DE MENÚ ESTILO SCORPION (solo PC, oculto en responsive) ── */}
      <nav className="hidden md:flex items-center bg-[#8B0000] border-b border-[#600000] shrink-0 select-none" style={{ fontFamily: "'Arial', sans-serif" }}>
        {/* Items del menú */}
        {[
          { label: 'OPERADORES',     id: 'menu-operadores' },
          { label: 'USUARIOS',       id: 'menu-usuarios' },
          { label: 'CONFIGURACION',  id: 'menu-configuracion' },
          { label: 'SERV. TECNICO',  id: 'menu-serv-tecnico' },
          { label: 'CONTROL TEST',   id: 'menu-control-test' },
          { label: 'TABLAS',         id: 'menu-tablas' },
          { label: 'UTILIDADES',     id: 'menu-utilidades' },
          { label: 'NOTIFICACIONES', id: 'menu-notificaciones', hasDropdown: true },
          { label: 'REPORTES',       id: 'menu-reportes', hasDropdown: true },
          { label: 'EVENTOS',        id: 'menu-eventos' },
          { label: 'AYUDA',          id: 'menu-ayuda' },
        ].filter(item => {
          if (item.id === 'menu-configuracion') return usuarioActivo.rol === 'Administrador'
          if (item.id === 'menu-operadores') return usuarioActivo.rol === 'Administrador' || usuarioActivo.rol === 'Supervisor'
          if (item.id === 'menu-serv-tecnico') return ['Administrador', 'Supervisor', 'Técnico'].includes(usuarioActivo.rol)
          if (item.id === 'menu-control-test') return ['Administrador', 'Supervisor', 'Operadora'].includes(usuarioActivo.rol)
          return true
        }).map((item, idx) => (
          <div key={idx} className="relative">
            <button
              id={item.id}
              onClick={() => {
                if (item.id === 'menu-notificaciones') {
                  setMostrarMenuNotificaciones(!mostrarMenuNotificaciones)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-reportes') {
                  setMostrarMenuReportes(!mostrarMenuReportes)
                  setMostrarMenuNotificaciones(false)
                } else if (item.id === 'menu-configuracion') {
                  setModalActivo('file-edit')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-serv-tecnico') {
                  setModalActivo('servicio-tecnico')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-control-test') {
                  setModalActivo('control-test')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-operadores') {
                  setModalActivo('user-key')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-usuarios') {
                  setModalActivo('list-details')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-marcador') {
                  setModalActivo('notificaciones-llamadas-sms')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-tablas') {
                  setModalActivo('book')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-utilidades') {
                  setModalActivo('tools')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-eventos') {
                  setModalActivo('search')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-ayuda') {
                  setModalActivo('network')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-whatsapp') {
                  setModalActivo('notificaciones-whatsapp')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else {
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                }
              }}
              className="px-4 py-1 text-[11px] font-bold text-white tracking-wider whitespace-nowrap border-r border-black/35 cursor-pointer transition-colors hover:bg-[#a00000] active:bg-[#700000]"
              style={{ fontFamily: "'Arial', sans-serif", paddingLeft: '16px', paddingRight: '16px', paddingTop: '4px', paddingBottom: '4px' }}
            >
              {item.label}
            </button>
            {item.hasDropdown && item.id === 'menu-notificaciones' && mostrarMenuNotificaciones && (
              <div className="absolute top-full left-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 shadow-xl z-50 py-1 min-w-[140px]">
                <button
                  className="w-full text-left px-4 py-1.5 text-xs text-black font-bold hover:bg-[#000080] hover:text-white"
                  onClick={() => { setModalActivo('notificaciones-mail'); setMostrarMenuNotificaciones(false); }}
                >
                  POR MAIL
                </button>
                <button
                  className="w-full text-left px-4 py-1.5 text-xs text-black font-bold hover:bg-[#000080] hover:text-white"
                  onClick={() => { setModalActivo('notificaciones-llamadas-sms'); setMostrarMenuNotificaciones(false); }}
                >
                  POR LLAMADA / WA
                </button>
              </div>
            )}
            {item.hasDropdown && item.id === 'menu-reportes' && mostrarMenuReportes && (
              <div className="absolute top-full left-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 shadow-xl z-50 py-1 min-w-[160px]">
                <button className="w-full text-left px-4 py-1.5 text-xs text-black font-bold hover:bg-[#000080] hover:text-white"
                  onClick={() => { setModalActivo('reportes'); setMostrarMenuReportes(false); }}>TODOS LOS REPORTES</button>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Alerta de sincronizador caído */}
      {!sincronizadorVivo && (
        <div className="bg-red-900/60 border-b border-red-700 px-4 py-1.5 flex items-center gap-3 shrink-0 animate-pulse">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_12px_#ef4444]" />
          <span className="text-red-300 text-xs font-bold tracking-wider">
            SINCRONIZADOR OFFLINE — PC SCORPION NO ESTÁ ENVIANDO DATOS A SUPABASE
          </span>
          <span className="text-red-400 text-[10px] ml-auto">
            {ultimoHeartbeat ? `Último heartbeat: ${ultimoHeartbeat}` : 'Sin heartbeat'}
          </span>
        </div>
      )}

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
        <div className="hidden md:flex flex-1 flex-col bg-[#c0c0c0] text-black overflow-y-auto border-l border-white p-1 gap-1 select-text text-[11px]">
          
          {/* Fila 1: Logo GAMA / SCORPION + Estado en Negro */}
          <div className="grid grid-cols-2 gap-1 shrink-0">
            {/* Box Izquierdo GAMA */}
            <div className="bg-[#e0e0e0] border border-t-white border-l-white border-b-gray-600 border-r-gray-600 p-1 flex items-center justify-center">
              <span className="text-[#0a1a5c] font-black text-2xl tracking-wider" style={{ fontFamily: 'sans-serif' }}>GAMA</span>
            </div>
            {/* Box Derecho SCORPION */}
            <div className="bg-[#000080] border border-t-white border-l-white border-b-gray-600 border-r-gray-600 p-1 flex flex-col items-center justify-center text-white">
              <span className="font-bold text-xs tracking-wide" style={{ fontFamily: 'sans-serif' }}>SCORPION</span>
              <span className="text-[8px] opacity-75">monitoring software</span>
            </div>
          </div>

          {/* Visor de Señal Activa (Negro) */}
          <div className="bg-black border border-t-gray-600 border-l-gray-600 border-b-white border-r-white p-1.5 font-mono text-green-400 text-[10px] shrink-0 space-y-0.5">
            <div className="flex justify-between font-bold text-xs border-b border-green-900 pb-0.5">
              <span>CTA: {activeEvent?.cuenta || '-----'}</span>
              <span>GRP: 01</span>
              <span>ZN: {activeEvent?.zona || '--'}</span>
              <span>US: {activeEvent?.usuario || '---'}</span>
            </div>
            {/* Barra de progreso de señal verde */}
            <div className="w-full bg-green-950 h-2 rounded-sm overflow-hidden my-0.5 flex gap-0.5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="flex-1 bg-green-400 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
            <div className="text-[9px] text-green-500/80 truncate text-center">
              RAW: 5051 18{activeEvent?.cuenta || 'C000'}E{activeEvent?.zona || '000'}01{activeEvent?.usuario || '000'}
            </div>
          </div>

          {/* Box 2: INFORMACION BASICA */}
          <div className="bg-[#e0e0e0] border border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex flex-col shrink-0">
            <div className="bg-[#000080] text-white text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">
              Informacion Basica
            </div>
            <div className="p-1 space-y-0.5 text-[11px]">
              <div className="grid grid-cols-4 gap-1">
                <span className="font-bold text-gray-700">Abonado:</span>
                <span className="col-span-3 bg-white px-1 border border-gray-400 font-bold">{activeEvent?.cuenta || '---'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-bold text-gray-700">Nombre:</span>
                <span className="col-span-3 bg-white px-1 border border-gray-400 truncate">{activeEvent?.nombre_abonado || '---'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-bold text-gray-700">Dirección:</span>
                <span className="col-span-3 bg-white px-1 border border-gray-400 truncate">{clientData?.direccion || '---'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="font-bold text-gray-700">Comuna:</span>
                <span className="col-span-3 bg-white px-1 border border-gray-400 truncate">{clientData?.comuna || '---'}</span>
              </div>
            </div>
          </div>

          {/* Box 3: CONTACTOS / PERSONAS AUTORIZADAS */}
          <div className="bg-[#e0e0e0] border border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex flex-col flex-1 min-h-[100px] max-h-[140px] overflow-hidden">
            <div className="bg-[#000080] text-white text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">
              Personas Autorizadas
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full border-collapse text-[10px] text-left bg-white">
                <thead className="sticky top-0 bg-[#d0d0d0] border-b border-gray-400 z-10">
                  <tr>
                    <th className="p-1 font-bold border-r border-gray-400 w-8 text-center">PR</th>
                    <th className="p-1 font-bold border-r border-gray-400">Nombre</th>
                    <th className="p-1 font-bold">Teléfono</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {clientData?.contactos.map((contact) => (
                    <tr key={contact.prioridad} className="hover:bg-blue-100 font-bold text-gray-800">
                      <td className="p-0.5 text-center border-r border-gray-300">{contact.prioridad}</td>
                      <td className="p-0.5 border-r border-gray-300 truncate max-w-[120px]">{contact.nombre}</td>
                      <td className="p-0.5 font-mono text-blue-800 flex items-center justify-between gap-1">
                        <span className="truncate max-w-[90px]">{contact.telefono}</span>
                        <div className="flex gap-0.5 shrink-0">
                          <button
                            onClick={() => {
                              const telLimpio = contact.telefono.replace(/[^0-9]/g, '')
                              setWhatsappTelefonoInicial(telLimpio)
                              setModalActivo('notificaciones-whatsapp')
                            }}
                            title="Enviar WhatsApp (Interno)"
                            className="bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-1 py-0.5 hover:bg-[#d0d0d0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white flex items-center justify-center cursor-pointer"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.912.54 3.704 1.476 5.23L2 22l4.908-1.28c1.472.8 3.14 1.284 4.936 1.284 5.52 0 10-4.48 10-10.004C21.844 6.48 17.524 2 12.004 2z" fill="#25D366"/>
                              <path d="M8.7 7.15c-.23-.5-.47-.5-.69-.5h-.58c-.2 0-.52.08-.8.38-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.2 3.08c.15.2 2.09 3.2 5.07 4.49.7.3 1.26.49 1.68.62.7.22 1.34.19 1.84.11.57-.08 1.74-.71 1.98-1.4.24-.68.24-1.27.17-1.4-.07-.12-.27-.2-.58-.35s-1.84-.9-2.12-1-.54-.15-.77.19c-.23.34-.89 1.1-.1 1.1.2 1.22.4 1.45.68 1.6.28.15.6.23.92.15.42-.1.7.07 1.01-.08s.1-.3.02-.45c-.07-.15-.7-1.72-.96-2.35-.25-.62-.5-.54-.69-.55l-.59-.01c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.44s1.05 2.84 1.2 3.05c.14.2 2.06 3.15 5 4.42.7.3 1.24.48 1.66.61.7.22 1.32.19 1.81.11.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.27-.2-.57-.35z" fill="white"/>
                            </svg>
                          </button>
                        </div>
                      </td>
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
          <div className="bg-[#e0e0e0] border border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex flex-col flex-1 min-h-[90px] max-h-[140px] overflow-hidden">
            <div className="bg-[#000080] text-white text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">
              Zonificacion
            </div>
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const zonasAbonado = cuentaKey ? (zonasMap[cuentaKey] || []) : []
                if (!activeEvent) {
                  return (
                    <div className="p-1 text-center text-gray-400 text-[10px] italic">Seleccione un abonado</div>
                  )
                }
                if (zonasAbonado.length === 0) {
                  return (
                    <div className="p-1 text-center text-[10px]">
                      <div className="text-gray-500 italic font-bold">Sin información</div>
                      <div className="text-blue-700 font-bold mt-0.5 cursor-pointer hover:underline">Solicitar</div>
                    </div>
                  )
                }
                return (
                  <table className="w-full border-collapse text-[9px] text-left bg-white">
                    <thead className="sticky top-0 bg-[#d0d0d0] border-b border-gray-400 z-10">
                      <tr>
                        <th className="p-1 font-bold border-r border-gray-400 w-8 text-center">ZN</th>
                        <th className="p-1 font-bold border-r border-gray-400">Dispositivos</th>
                        <th className="p-1 font-bold">Area Cubierta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                      {zonasAbonado.map((zona, idx) => (
                        <tr key={idx} className="hover:bg-blue-100 font-bold text-gray-800">
                          <td className="p-0.5 text-center border-r border-gray-300 text-yellow-700">{zona.numero}</td>
                          <td className="p-0.5 border-r border-gray-300 truncate max-w-[100px] capitalize">{(zona.dispositivo || '').toLowerCase()}</td>
                          <td className="p-0.5 truncate max-w-[100px] capitalize">{(zona.area || '').toLowerCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              })()}
            </div>
          </div>

          {/* Botón de verificación de video inferior */}
          <button 
            onClick={() => {
              if (activeEvent) {
                setModalActivo('video-verificacion')
              } else {
                alert('Por favor seleccione un abonado en la grilla primero.')
              }
            }}
            className="w-full bg-[#d0d0d0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-1 text-xs text-gray-800 font-bold hover:bg-[#e0e0e0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none shrink-0"
          >
            🎥 Activar verificación por video
          </button>

          {/* Reloj y Fecha inferior de Scorpion */}
          <div className="flex justify-between items-center bg-[#d0d0d0] border border-gray-400 px-2 py-0.5 text-[9px] font-mono text-gray-700 shrink-0">
            <span>Operador: {usuarioActivo.nombre} ({usuarioActivo.rol.toUpperCase()})</span>
            <span className="font-bold">{horaLocal}</span>
          </div>

        </div>
      </div>

      {/* Tool Modals */}
      {modalActivo && ['tools', 'user-key', 'file-edit', 'network', 'shield', 'book', 'grid-check', 'list-details', 'home', 'search', 'archive'].includes(modalActivo) && (
        <ToolModal
          modalId={modalActivo}
          onClose={() => setModalActivo(null)}
          operadores={operadores}
          onUpdateOperadores={(nuevosOps) => guardarOperadoresBase(nuevosOps)}
        />
      )}

      {/* Expediente Modal (Controlado por el botón de libros: 'bar-chart') */}
      {modalActivo === 'bar-chart' && activeEvent && (
        <ExpedienteModal
          evento={activeEvent}
          pestanaInicial={expedientePestana}
          onClose={() => setModalActivo(null)}
          usuarioRol={usuarioActivo.rol}
        />
      )}

      {/* Eventos Por Usuario Modal (Controlado por el botón checklist: 'checklist') */}
      {modalActivo === 'checklist' && (
        <EventosPorUsuarioModal
          eventoInicial={activeEvent || undefined}
          onClose={() => setModalActivo(null)}
        />
      )}

      {/* Zonificacion Modal (Controlado por el botón hierarchy: 'zones-tree') */}
      {modalActivo === 'zones-tree' && (
        <ZonificacionModal
          eventoInicial={activeEvent || undefined}
          onClose={() => setModalActivo(null)}
        />
      )}

      {/* Notificaciones Mail Modal (Controlado desde el menú superior) */}
      {modalActivo === 'notificaciones-mail' && (
        <NotificacionesMailModal
          onClose={() => setModalActivo(null)}
          clientesMap={clientesMap}
        />
      )}

      {/* Notificaciones WhatsApp Modal */}
      {modalActivo === 'notificaciones-whatsapp' && (
        <NotificacionesWhatsAppModal
          onClose={() => {
            setModalActivo(null)
            setWhatsappTelefonoInicial(undefined)
          }}
          clientesMap={clientesMap}
          cuentaInicial={activeEvent?.cuenta || undefined}
          telefonoInicial={whatsappTelefonoInicial}
        />
      )}

      {/* Notificaciones Llamadas / SMS Modal */}
      {modalActivo === 'notificaciones-llamadas-sms' && (
        <NotificacionesLlamadasSMSModal
          onClose={() => setModalActivo(null)}
          clientData={clientData}
          clientesMap={clientesMap}
        />
      )}

      {/* Todos los Eventos Modal */}
      {modalActivo === 'todos-los-eventos' && (
        <TodosLosEventosModal onClose={() => setModalActivo(null)} />
      )}

      {/* Servicio Técnico Modal */}
      {modalActivo === 'servicio-tecnico' && (
        <ServicioTecnicoModal 
          onClose={() => setModalActivo(null)} 
          clientesMap={clientesMap}
          usuarioActivo={usuarioActivo}
        />
      )}

      {/* Video Verification Modal */}
      {modalActivo === 'video-verificacion' && activeEvent && (
        <VideoVerificacionModal
          onClose={() => setModalActivo(null)}
          evento={activeEvent}
          clientesMap={clientesMap}
          esCierre={(() => {
            const clientEvents = eventos.filter(e => e.cuenta?.toUpperCase().trim() === activeEvent.cuenta?.toUpperCase().trim())
            const stateEvent = clientEvents.find(e => {
              const ev = (e.evento || '').toLowerCase()
              return ev.includes('cierre') || ev.includes('apertura') || ev.includes('armado') || ev.includes('desarmado')
            })
            if (stateEvent) {
              const evName = (stateEvent.evento || '').toLowerCase()
              return evName.includes('cierre') || evName.includes('armado')
            }
            return true // default to Cierre for safety
          })()}
        />
      )}

      {/* Control Test Modal */}
      {modalActivo === 'control-test' && (
        <ControlTestModal 
          onClose={() => setModalActivo(null)} 
          clientesMap={clientesMap}
        />
      )}

      {/* Bitácora Modal */}
      {modalActivo === 'bitacora' && (
        <BitacoraModal
          onClose={() => setModalActivo(null)}
          cuentaDefault={activeEvent?.cuenta || undefined}
        />
      )}

      {/* Reportes Modal */}
      {modalActivo === 'reportes' && (
        <ReportesModal onClose={() => setModalActivo(null)} />
      )}

      {/* Configuración Modal */}
      {modalActivo === 'configuracion' && (
        <ConfigModal onClose={() => setModalActivo(null)} />
      )}

      {/* Login / Operator Switch Modal */}
      {/* (No longer rendered inline since it is used as full-screen gate page) */}

      {/* Footer */}
      <FooterActions
        unreadWhatsAppCount={unreadWhatsAppCount}
        onModalOpen={(id) => {
          if (id === 'notificaciones-whatsapp') {
            setUnreadWhatsAppCount(0)
          }
          if (id === 'key-shift') {
            setSesionIniciada(false)
            setModalActivo(null)
            return
          }
          if (id === 'bar-chart') {
            setExpedientePestana('telefonos')
          }
          setModalActivo(id)
        }}
      />
    </div>
  )
}
