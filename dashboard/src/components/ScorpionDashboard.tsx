'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
import CamaraGridModal from './CamaraGridModal'
import HorariosModal from './HorariosModal'
import PredictorMantenimientoModal from './PredictorMantenimientoModal'
import SimuladorEventosModal from './SimuladorEventosModal'
import IACopilotCard from './IACopilotCard'
import EntregaTurnoModal from './EntregaTurnoModal'
import HealthTelemetryModal from './HealthTelemetryModal'
import AperturasCierresModal from './AperturasCierresModal'
import BuscadorUniversalModal from './BuscadorUniversalModal'
import { lookupContactId } from '@/lib/contact_id_library'
import { sendMessage, generarMensajeAlerta, generarMensajeEnergia, detectarPatronEvento, type EventInfo } from '@/lib/whatsapp'
import { Operator, ensureUserAttributes, OPERADORES_PREDETERMINADOS } from '@/types/operator'

// ── Contactos del Panel Lateral de Scorpion y Entidades de Emergencia ──
interface ContactoAutorizado {
  prioridad: number
  nombre: string
  telefono: string
  cargo?: string
  tipo?: 'autorizado' | 'emergencia' | 'cuadrante' | 'comisaria' | 'seguridad'
}

function obtenerDatosAbonado(cuenta: string, nombreAbonado: string, clienteDb: Record<string, string> | null) {
  const datos = {
    nombre: clienteDb?.nombre || nombreAbonado || 'PROPIEDAD',
    direccion: clienteDb?.direccion || 'Av. Providencia 1420, Of. 602',
    comuna: clienteDb?.sector || clienteDb?.ciudad || 'Santiago',
    contactos: [] as ContactoAutorizado[],
    emergencias: {
      cuadrante: undefined as { nombre: string; telefono: string } | undefined,
      comisaria: undefined as { nombre: string; telefono: string } | undefined,
      seguridadCiudadana: undefined as { nombre: string; telefono: string } | undefined,
    }
  }

  // Extraer contactos reales del 1 al 7 de GENERAL.mdb
  if (clienteDb) {
    for (let i = 1; i <= 7; i++) {
      const nombre = (clienteDb[`nombre${i}`] || '').trim()
      const tel = (clienteDb[`t${i}`] || clienteDb[`telefono${i}`] || '').trim()
      const carg = (clienteDb[`carg${i}`] || '').trim()
      
      if (nombre || tel) {
        const nomUpper = nombre.toUpperCase()
        const cargUpper = carg.toUpperCase()
        const fullTxt = `${nomUpper} ${cargUpper}`
        
        let tipo: ContactoAutorizado['tipo'] = 'autorizado'
        
        if (fullTxt.includes('CUADRANTE') || fullTxt.includes('PLAN')) {
          tipo = 'cuadrante'
          if (tel && !datos.emergencias.cuadrante) {
            datos.emergencias.cuadrante = { nombre: nombre || 'Plan Cuadrante', telefono: tel }
          }
        } else if (fullTxt.includes('COMISARIA') || fullTxt.includes('COMISERIA') || fullTxt.includes('CARABINEROS')) {
          tipo = 'comisaria'
          if (tel && !datos.emergencias.comisaria) {
            datos.emergencias.comisaria = { nombre: nombre || 'Comisaría Local', telefono: tel }
          }
        } else if (fullTxt.includes('PAZ CIUDADANA') || fullTxt.includes('SEGURIDAD CIUDADANA') || fullTxt.includes('MUNICIPAL') || fullTxt.includes('SEGURIDAD MUNICIPAL')) {
          tipo = 'seguridad'
          if (tel && !datos.emergencias.seguridadCiudadana) {
            datos.emergencias.seguridadCiudadana = { nombre: nombre || 'Seguridad Ciudadana', telefono: tel }
          }
        }

        datos.contactos.push({
          prioridad: i,
          nombre: nombre ? nombre.toUpperCase() : (tipo === 'cuadrante' ? 'PLAN CUADRANTE' : tipo === 'comisaria' ? 'COMISARÍA' : 'CONTACTO'),
          telefono: tel,
          cargo: carg,
          tipo
        })
      }
    }
  }

  // Fallbacks si no hay contactos en BD
  if (datos.contactos.length === 0) {
    const mainTel = (clienteDb?.telefono1 || clienteDb?.t1 || clienteDb?.telefono || '').trim()
    const mainNom = (clienteDb?.nombre || nombreAbonado || 'TITULAR ALARMA').trim().toUpperCase()
    if (mainTel || mainNom) {
      datos.contactos.push({
        prioridad: 1,
        nombre: mainNom,
        telefono: mainTel || 'Sin teléfono registrado',
        cargo: 'Titular',
        tipo: 'autorizado'
      })
    }
  }

  return datos
}

export default function ScorpionDashboard() {
  const [eventos, setEventos] = useState<EventoMonitoreo[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoMonitoreo | null>(null)
  const [modalActivo, setModalActivo] = useState<string | null>(null)
  const [modalRetorno, setModalRetorno] = useState<string | null>(null)

  const cerrarModalConRetorno = useCallback(() => {
    if (modalRetorno) {
      setModalActivo(modalRetorno)
      setModalRetorno(null)
    } else {
      setModalActivo(null)
    }
  }, [modalRetorno])

  const [camaraGridCuenta, setCamaraGridCuenta] = useState<string | null>(null)
  const [expedientePestana, setExpedientePestana] = useState<'telefonos' | 'horarios' | 'camara'>('telefonos')
  const [horaLocal, setHoraLocal] = useState('')
  const [mostrarMenuNotificaciones, setMostrarMenuNotificaciones] = useState(false)
  const [mostrarMenuReportes, setMostrarMenuReportes] = useState(false)
  const [whatsappTelefonoInicial, setWhatsappTelefonoInicial] = useState<string | undefined>(undefined)
  const [servicioTecnicoInitialData, setServicioTecnicoInitialData] = useState<{ cuenta?: string; problema?: string } | null>(null)
  
  // Mapa de clientes cargado en tiempo real
  const [clientesMap, setClientesMap] = useState<Record<string, Record<string, string>>>({})
  
  // Mapa de códigos de color desde CODIGOS.MDB
  const [codigosMap, setCodigosMap] = useState<Record<string, { descripcion: string; zn_us: string; color: string }> | undefined>(undefined)

  // Mapa de zonificación por abonado desde ZONIFICACION MDB
  const [zonasMap, setZonasMap] = useState<Record<string, { numero: string; dispositivo: string; area: string }[]>>({})

  // Lookup robusto de zonificación: acepta claves "C769", "769", "0769", "0769 "
  const buscarZonasAbonado = useCallback((cuentaRaw: string | null | undefined) => {
    const k = (cuentaRaw || '').toUpperCase().trim()
    if (!k) return [] as { numero: string; dispositivo: string; area: string }[]
    const candidatas = [k, k.replace(/^C/, ''), k.replace(/^C/, '').replace(/^0+/, '')]
    for (const c of candidatas) {
      if (zonasMap[c]) {
        const v = zonasMap[c]
        return Array.isArray(v) ? v : [v as any]
      }
    }
    const soloDigitos = k.replace(/^C/, '').replace(/^0+/, '')
    for (const [clave, valor] of Object.entries(zonasMap)) {
      const claveNorm = clave.toUpperCase().replace(/^C/, '').replace(/^0+/, '')
      if (claveNorm === soloDigitos) {
        return Array.isArray(valor) ? valor : [valor as any]
      }
    }
    return []
  }, [zonasMap])

  // Gestión de Usuarios y Roles (RBAC) con Atributos
  const [operadores, setOperadores] = useState<Operator[]>(OPERADORES_PREDETERMINADOS)
  const [usuarioActivo, setUsuarioActivo] = useState<Operator>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gama_operator_auth') || localStorage.getItem('gama_usuario_activo')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.nombre) return { ...parsed, atributos: ensureUserAttributes(parsed) }
        }
      } catch {}
    }
    return OPERADORES_PREDETERMINADOS[0]
  })
  const [sesionIniciada, setSesionIniciada] = useState(true)

  // Sincronizar usuario activo con OperatorAuthGate
  useEffect(() => {
    const syncActiveUser = () => {
      try {
        const saved = sessionStorage.getItem('gama_operator_auth') || localStorage.getItem('gama_operator_auth')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.nombre) {
            setUsuarioActivo({ ...parsed, atributos: ensureUserAttributes(parsed) })
          }
        }
      } catch {}
    }
    syncActiveUser()
    window.addEventListener('storage', syncActiveUser)
    return () => window.removeEventListener('storage', syncActiveUser)
  }, [])
  const [unreadWhatsAppCount, setUnreadWhatsAppCount] = useState(0)
  const [armadoMap, setArmadoMap] = useState<Record<string, boolean>>({})
  const armadoMapRef = useRef<Record<string, boolean>>({})
  const clientesConCamarasRef = useRef<Set<string>>(new Set())
  const [cuentasConCamarasMap, setCuentasConCamarasMap] = useState<Record<string, number>>({})

  // Cargar cuentas que efectivamente tienen cámaras configuradas en Supabase
  useEffect(() => {
    const fetchCamarasRegistradas = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('cuenta, nombre_abonado')
          .like('cuenta', 'CAMARAS_DAHUA_%')
          .order('id', { ascending: false })

        if (data && data.length > 0) {
          const map: Record<string, number> = {}
          const setCams = new Set<string>()
          for (const row of data) {
            const cta = row.cuenta.replace('CAMARAS_DAHUA_', '').toUpperCase().trim()
            if (cta && !map[cta]) {
              try {
                const parsed = JSON.parse(row.nombre_abonado || '[]')
                if (Array.isArray(parsed) && parsed.length > 0) {
                  map[cta] = parsed.length
                  setCams.add(cta)
                }
              } catch {}
            }
          }
          setCuentasConCamarasMap(map)
          clientesConCamarasRef.current = setCams
        }
      } catch (err) {
        console.warn('Error cargando cuentas con cámaras:', err)
      }
    }
    fetchCamarasRegistradas()
    const timer = setInterval(fetchCamarasRegistradas, 45_000)
    return () => clearInterval(timer)
  }, [])

  // Sincronizar usuario activo con localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && usuarioActivo?.nombre) {
      try {
        localStorage.setItem('gama_usuario_activo', JSON.stringify(usuarioActivo))
      } catch {}
    }
  }, [usuarioActivo])

  // Suscripción Realtime a mensajes entrantes de WhatsApp
  useEffect(() => {
    let channel: any
    try {
      channel = supabase
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
    } catch (e) {
      console.warn('[SUPABASE] WhatsApp channel no disponible')
    }

    return () => {
      if (channel) try { supabase.removeChannel(channel) } catch {}
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
            // Preservar usuario activo si ya coincide por código o nombre
            const match = parsed.find((o: any) => o.codigo === usuarioActivo.codigo || o.nombre === usuarioActivo.nombre)
            if (match) {
              setUsuarioActivo(match)
            }
          }
        }
      } catch (err) {
        console.warn('Error loading operators list, using fallback:', err)
        try { const r = await fetch('/api/dahua-eventos?tipo=operadores'); const j = await r.json(); if (j.data?.[0]?.nombre_abonado) { const p = JSON.parse(j.data[0].nombre_abonado); if (p.length > 0) { setOperadores(p); const m = p.find((o: any) => o.codigo === usuarioActivo.codigo || o.nombre === usuarioActivo.nombre); if (m) setUsuarioActivo(m) } } } catch {}
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
        try { const r = await fetch('/api/dahua-eventos?tipo=clientes'); const j = await r.json(); if (j.data?.[0]?.nombre_abonado) { const p = JSON.parse(j.data[0].nombre_abonado); setClientesMap(p) } } catch {}
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
        try { const r = await fetch('/api/dahua-eventos?tipo=codigos'); const j = await r.json(); if (j.data?.[0]?.nombre_abonado) { const p = JSON.parse(j.data[0].nombre_abonado); setCodigosMap(p) } } catch {}
      }
    }
    fetchCodigos()
  }, [])

  // Cargar mapa de zonificación de abonados (auto-refresh cada 60s + Realtime)
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'ZONAS')
          .order('id', { ascending: false })
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
        try { const r = await fetch('/api/dahua-eventos?tipo=zonas'); const j = await r.json(); if (j.data?.[0]?.nombre_abonado) { const p = JSON.parse(j.data[0].nombre_abonado); setZonasMap(p) } } catch {}
      }
    }
    fetchZonas()
    const timer = setInterval(fetchZonas, 60_000)

    // Realtime: refrescar al instante cuando el sincronizador actualice la fila ZONAS
    let channel: any
    try {
      channel = supabase
        .channel('zonas-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos_monitoreo', filter: 'cuenta=eq.ZONAS' }, () => {
          fetchZonas()
        })
        .subscribe()
    } catch {}

    return () => {
      clearInterval(timer)
      if (channel) supabase.removeChannel(channel)
    }
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
    if (c.startsWith('CAMARAS_DAHUA_') || c.startsWith('DAHUA_FRAME_') || c.startsWith('DAHUA_STREAM_REQ_') || c.startsWith('SNAPSHOT_') || c.startsWith('CLIP_') || c.startsWith('CONFIG_WHATSAPP_') || c.startsWith('CONFIG_APERTURAS_') || c.startsWith('CONFIG_') || c.startsWith('__')) return true
    if (['CLIENTES', 'CODIGOS', 'ZONAS', '__SINCRONIZADOR__', 'EMPRESAS_CONGLOMERADO', 'COTIZACIONES_DOLIBARR', 'ORDENES_TRABAJO', 'CONFIG_OPERADORES', 'CLIENTES_MAESTROS_CRM', 'CONFIG_APERTURAS_CIERRES_LISTA'].includes(c)) return true
    if (['ELIMINACION_DAHUA_CRUD', 'GENERACION_NVR_MULTICANAL', 'FRAME_SYNC', 'NVR_DVR_FRAME_SYNC', 'CAMERA_FRAME_SYNC', 'STREAM_REQ', 'SNAPSHOT_OPERADOR', 'CLIP_VIDEO_OPERADOR', 'CONFIG_UPDATE_APERTURAS_CIERRES'].includes(e) || e.startsWith('CONFIG_UPDATE_')) return true
    return false
  }

  const deduplicarEventos = (lista: EventoMonitoreo[]) => {
    const vistos = new Set<string>()
    const unicos: EventoMonitoreo[] = []
    for (const ev of lista) {
      const key = `${ev.cuenta}_${ev.evento}_${ev.zona}_${ev.usuario}_${ev.fecha_hora}`
      if (!vistos.has(key)) {
        vistos.add(key)
        unicos.push(ev)
      }
    }
    return unicos
  }

  const fetchEventos = useCallback(async () => {
    try {
      let query = supabase
        .from('eventos_monitoreo')
        .select('*')
        .not('cuenta', 'in', '(CLIENTES,CODIGOS,ZONAS,__SINCRONIZADOR__,CONFIG_OPERADORES,CLIENTES_MAESTROS_CRM,EMPRESAS_CONGLOMERADO,COTIZACIONES_DOLIBARR,ORDENES_TRABAJO)')
        .not('cuenta', 'like', 'CAMARAS_DAHUA_%')
        .not('cuenta', 'like', 'DAHUA_FRAME_%')
        .not('cuenta', 'like', 'DAHUA_STREAM_REQ_%')
        .not('cuenta', 'like', 'SNAPSHOT_%')
        .not('cuenta', 'like', 'CONFIG_WHATSAPP_%')
        .order('id', { ascending: false })
        .limit(200)

      if (busqueda.trim()) {
        query = query.or(`cuenta.ilike.%${busqueda}%,nombre_abonado.ilike.%${busqueda}%`)
      }

      const { data, error } = await query
      if (error) throw error
      if (data) {
        const limpios = data.filter(ev => !esCuentaInternaOFrame(ev.cuenta, ev.evento))
        // Orden cronológico ascendente: el más reciente SIEMPRE abajo
        const ordenados = deduplicarEventos(limpios
          .slice(0, 100)
          .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()))
        setEventos(ordenados)
        if (ordenados.length > 0 && !eventoSeleccionado) {
          setEventoSeleccionado(ordenados[ordenados.length - 1])
        }
      }
    } catch (err) {
      console.warn('[SUPABASE] Error en fetchEventos, usando fallback PG directo:', err)
      try {
        const r = await fetch(`/api/dahua-eventos?tipo=eventos&limit=100`)
        const json = await r.json()
        if (json.data && json.data.length > 0) {
          // API devuelve oldest-first (ascendente)
          const deduplicados = deduplicarEventos(json.data)
          setEventos(deduplicados)
          if (deduplicados.length > 0 && !eventoSeleccionado) setEventoSeleccionado(deduplicados[deduplicados.length - 1])
        }
      } catch (e) {
        console.error('[FALLBACK] Error en fallback PG:', e)
      }
    }
  }, [busqueda, eventoSeleccionado])

  useEffect(() => { fetchEventos() }, [fetchEventos])

  // Polling cada 3 segundos
  useEffect(() => {
    let latestId = 0
    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .not('cuenta', 'in', '(CLIENTES,CODIGOS,ZONAS,__SINCRONIZADOR__,CONFIG_OPERADORES,CLIENTES_MAESTROS_CRM,EMPRESAS_CONGLOMERADO,COTIZACIONES_DOLIBARR,ORDENES_TRABAJO)')
          .not('cuenta', 'like', 'CAMARAS_DAHUA_%')
          .not('cuenta', 'like', 'DAHUA_FRAME_%')
          .not('cuenta', 'like', 'DAHUA_STREAM_REQ_%')
          .not('cuenta', 'like', 'SNAPSHOT_%')
          .not('cuenta', 'like', 'CONFIG_WHATSAPP_%')
          .order('id', { ascending: false })
          .limit(200)

        if (error) throw error
        if (!data || data.length === 0) return
        const maxId = data[0].id
        if (maxId <= latestId) return

        latestId = maxId
        const filtered = busqueda.trim()
          ? data.filter(e =>
              e.cuenta?.toLowerCase().includes(busqueda.toLowerCase()) ||
              e.nombre_abonado?.toLowerCase().includes(busqueda.toLowerCase())
            )
          : data

        const limpios = filtered.filter(ev => !esCuentaInternaOFrame(ev.cuenta, ev.evento))
        const ordenados = deduplicarEventos([...limpios]
          .slice(0, 100)
          .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()))
        setEventos(ordenados)
        
        if (ordenados.length > 0) {
          setEventoSeleccionado(ordenados[ordenados.length - 1])
        }
      } catch (_) {
        // Si Supabase falla, intentar polling via PG directo cada 5s
        try {
          const r = await fetch(`/api/dahua-eventos?tipo=eventos&limit=100`)
          const json = await r.json()
          if (json.data && json.data.length > 0) {
            const maxId = json.data[json.data.length - 1].id  // último = más reciente
            if (maxId <= latestId) return
            latestId = maxId
            const deduplicados = deduplicarEventos(json.data)
            setEventos(deduplicados)  // oldest-first
            if (deduplicados.length > 0) setEventoSeleccionado(deduplicados[deduplicados.length - 1])
          }
        } catch {}
      }
    }
    poll()
    const timer = setInterval(poll, 3000)
    return () => clearInterval(timer)
  }, [busqueda])

  // WebSocket instantáneo
  useEffect(() => {
    let channel: any
    try {
      channel = supabase
        .channel('eventos-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos_monitoreo' }, async (payload) => {
        const newEvent = payload.new as EventoMonitoreo
        // Ignorar filas especiales de sincronización y configuración de cámaras
        if (esCuentaInternaOFrame(newEvent.cuenta, newEvent.evento)) return
        
        setEventos((prev) => {
          const eventKey = `${newEvent.cuenta}_${newEvent.evento}_${newEvent.zona}_${newEvent.usuario}_${newEvent.fecha_hora}`
          if (prev.some(e => e.id === newEvent.id || `${e.cuenta}_${e.evento}_${e.zona}_${e.usuario}_${e.fecha_hora}` === eventKey)) return prev
          const next = [...prev, newEvent]
          next.sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
          if (next.length > 50) next.pop()
          return deduplicarEventos(next)
        })
        
        // Seleccionar automáticamente solo si es un evento reciente de los últimos 10 minutos
        const eventTs = new Date(newEvent.fecha_hora).getTime()
        const tenMinsAgo = Date.now() - 600_000
        if (eventTs >= tenMinsAgo) {
          setEventoSeleccionado(newEvent)
        }

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

        // Rastreo de estado armado/cerrado por cuenta
        const esCierre = eventoUpper.includes('CIERRE') || eventoUpper === 'CLOSE' || eventoUpper.includes('ARME')
        const esApertura = eventoUpper.includes('APERTURA') || eventoUpper === 'OPEN' || eventoUpper.includes('DESARME')
        if (esCierre) { const next = { ...armadoMapRef.current, [newEvent.cuenta]: true }; armadoMapRef.current = next; setArmadoMap(next) }
        if (esApertura) { const next = { ...armadoMapRef.current, [newEvent.cuenta]: false }; armadoMapRef.current = next; setArmadoMap(next) }

        // Auto-apertura de videoverificación: ROBO + sistema armado + cliente con cámara registrada
        const esRobo = eventoUpper.includes('ALARMA') && (eventoUpper.includes('ROBO') || eventoUpper.includes('INTRUSIÓN') || eventoUpper.includes('INTRUSION') || eventoUpper.includes('PERIMETRAL'))
        if (esRobo && armadoMapRef.current[newEvent.cuenta] === true) {
          ;(async () => {
            try {
              const ctaKey = (newEvent.cuenta || '').toUpperCase().trim()
              let hasCam = clientesConCamarasRef.current.has(ctaKey)
              if (!hasCam) {
                const { data } = await supabase
                  .from('eventos_monitoreo')
                  .select('nombre_abonado')
                  .eq('cuenta', `CAMARAS_DAHUA_${ctaKey}`)
                  .limit(1)
                if (data && data.length > 0 && data[0].nombre_abonado) {
                  try {
                    const parsed = JSON.parse(data[0].nombre_abonado)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      clientesConCamarasRef.current.add(ctaKey)
                      hasCam = true
                    }
                  } catch {}
                }
              }
              // Solo abrir si verdaderamente tiene cámaras configuradas
              if (hasCam) {
                setEventoSeleccionado(newEvent)
                setModalActivo('video-verificacion')
              }
            } catch {}
          })()
        }

        // Verificación de Notificaciones (Apertura o Cierre)
        const isAperturaCierre = esApertura || esCierre || (cidInfo && cidInfo.categoria === 'APERTURA')
        
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
              const zonasAbonado = buscarZonasAbonado(newEvent.cuenta)

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
    } catch (e) {
      console.warn('[SUPABASE] Realtime channel no disponible (Supabase caído)')
    }
    return () => { if (channel) supabase.removeChannel(channel) }
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

  // Cargar contactos reales guardados en Expediente (Supabase: notificaciones_whatsapp / eventos_monitoreo)
  const [contactosSupabase, setContactosSupabase] = useState<ContactoAutorizado[]>([])

  useEffect(() => {
    if (!cuentaKey) {
      setContactosSupabase([])
      return
    }
    let isCancelled = false

    const loadRealContacts = async () => {
      try {
        // 1. Cargar desde notificaciones_whatsapp (contactos de escalamiento guardados en Expediente)
        const { data: waData } = await supabase
          .from('notificaciones_whatsapp')
          .select('contactos_escalamiento')
          .eq('cuenta', cuentaKey)
          .maybeSingle()

        if (!isCancelled && waData?.contactos_escalamiento && Array.isArray(waData.contactos_escalamiento) && waData.contactos_escalamiento.length > 0) {
          const mapped: ContactoAutorizado[] = waData.contactos_escalamiento.map((c: any, idx: number) => ({
            prioridad: idx + 1,
            nombre: (c.nombre || c.parentesco || `CONTACTO ${idx + 1}`).toUpperCase(),
            telefono: c.telefono || '',
            cargo: c.parentesco || 'AUTORIZADO',
            tipo: 'autorizado'
          }))
          setContactosSupabase(mapped)
          return
        }

        // 2. Cargar desde eventos_monitoreo EXPEDIENTE_CONTACTOS_...
        const { data: expData } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', `EXPEDIENTE_CONTACTOS_${cuentaKey}`)
          .order('id', { ascending: false })
          .limit(1)

        if (!isCancelled && expData && expData.length > 0 && expData[0].nombre_abonado) {
          try {
            const parsed = JSON.parse(expData[0].nombre_abonado)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const mappedExp: ContactoAutorizado[] = parsed.map((c: any, idx: number) => ({
                prioridad: idx + 1,
                nombre: (c.nombre || `CONTACTO ${idx + 1}`).toUpperCase(),
                telefono: c.telefono || '',
                cargo: c.cargo || c.parentesco || 'AUTORIZADO',
                tipo: 'autorizado'
              }))
              setContactosSupabase(mappedExp)
              return
            }
          } catch {}
        }

        if (!isCancelled) setContactosSupabase([])
      } catch (err) {
        if (!isCancelled) setContactosSupabase([])
      }
    }

    loadRealContacts()
    return () => { isCancelled = true }
  }, [cuentaKey])

  const clientData = useMemo(() => {
    if (!activeEvent) return null
    const base = obtenerDatosAbonado(activeEvent.cuenta, activeEvent.nombre_abonado, clienteDb)
    if (contactosSupabase.length > 0) {
      base.contactos = contactosSupabase
    }
    return base
  }, [activeEvent, clienteDb, contactosSupabase])

  const cantCamarasActiva = (() => {
    if (!cuentaKey) return 0
    if (cuentasConCamarasMap[cuentaKey]) return cuentasConCamarasMap[cuentaKey]
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(`gama_dahua_sn_${cuentaKey}`)
        if (local) {
          const p = JSON.parse(local)
          if (Array.isArray(p) && p.length > 0) return p.length
        }
      } catch {}
    }
    return 0
  })()
  const tieneCamaras = cantCamarasActiva > 0

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
    <div className="h-screen h-[100dvh] max-h-screen max-h-[100dvh] w-full flex flex-col bg-[#070b13] text-slate-100 overflow-hidden select-none relative" style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}>

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
          <button
            onClick={() => setModalActivo('health-telemetry')}
            className="flex items-center gap-1.5 ml-1 bg-transparent border-0 cursor-pointer hover:underline"
            title={ultimoHeartbeat ? `Ver Telemetría de Salud (Último heartbeat: ${ultimoHeartbeat})` : 'Ver Telemetría de Salud'}
          >
            <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${
              sincronizadorVivo
                ? 'bg-green-500 shadow-[#22c55e]'
                : 'bg-red-500 shadow-[#ef4444]'
            }`} />
            <span className={`font-bold text-[10px] tracking-wider ${
              sincronizadorVivo ? 'text-green-400' : 'text-red-400'
            }`}>SINCR.</span>
          </button>

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
          { label: 'ZONIFICACION',   id: 'menu-zonificacion' },
          { label: 'PREDICTOR IA',   id: 'menu-predictor-ia' },
          { label: 'CONTROL TEST',   id: 'menu-control-test' },
          { label: 'HORARIOS',       id: 'menu-horarios' },
          { label: 'TABLAS (CONTACT ID)', id: 'menu-tablas' },
          { label: 'UTILIDADES',     id: 'menu-utilidades' },
          { label: 'NOTIFICACIONES', id: 'menu-notificaciones', hasDropdown: true },
          { label: 'REPORTES',       id: 'menu-reportes', hasDropdown: true },
          { label: 'EVENTOS',        id: 'menu-eventos' },
          { label: 'CAMARAS',       id: 'menu-camaras' },
          { label: 'SIMULADOR',      id: 'menu-simulador' },
          { label: 'AYUDA',          id: 'menu-ayuda' },
        ].filter(item => {
          const attrs = ensureUserAttributes(usuarioActivo)
          if (item.id === 'menu-configuracion' || item.id === 'menu-operadores') return attrs.verConfiguracion || usuarioActivo.rol === 'Administrador'
          if (item.id === 'menu-[#zonificacion]' || item.id === 'menu-zonificacion') return attrs.editarZonificacion || ['Administrador', 'Supervisor', 'Técnico'].includes(usuarioActivo.rol)
          if (item.id === 'menu-serv-tecnico' || item.id === 'menu-predictor-ia' || item.id === 'menu-camaras') return attrs.verTelemetriaTecnica
          if (item.id === 'menu-control-test') return true
          if (item.id === 'menu-simulador') return attrs.controlTestSimulador
          if (item.id === 'menu-reportes') return attrs.verReportes
          if (item.id === 'menu-tablas' || item.id === 'menu-usuarios') return attrs.verCRM
          if (item.id === 'menu-notificaciones') return attrs.enviarMensajesWhatsApp
          if (item.id === 'menu-eventos') return attrs.verMonitoreoEnVivo
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
                } else if (item.id === 'menu-zonificacion') {
                  setModalActivo('zones-tree')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-configuracion') {
                  setModalActivo('file-edit')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-serv-tecnico') {
                  setModalActivo('servicio-tecnico')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-predictor-ia') {
                  setModalActivo('predictor-ia')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-simulador') {
                  setModalActivo('simulador')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-control-test') {
                  setModalActivo('control-test')
                  setMostrarMenuNotificaciones(false)
                  setMostrarMenuReportes(false)
                } else if (item.id === 'menu-horarios') {
                  setModalActivo('horarios')
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
                } else if (item.id === 'menu-camaras') {
                  const cuenta = prompt('Ingresa numero de cuenta (ej: 0034):')
                  if (cuenta) {
                    const padded = cuenta.padStart(4, '0')
                    setCamaraGridCuenta(`CAMARAS_DAHUA_${padded}`)
                  }
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
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
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

          {/* TARJETA IA COPILOT GAMA */}
          <IACopilotCard
            evento={activeEvent}
            historialEventos={eventos}
            clientData={clientData}
            zonas={buscarZonasAbonado(activeEvent?.cuenta)}
            tieneCamaras={tieneCamaras}
            cantCamaras={cantCamarasActiva}
            onAbrirVideo={() => setModalActivo('video-verificacion')}
            onAbrirPredictor={() => setModalActivo('predictor-ia')}
            onEnviarWhatsApp={(telefono) => {
              setWhatsappTelefonoInicial(telefono)
              setModalActivo('notificaciones-whatsapp')
            }}
            usuarioOperador={usuarioActivo.nombre}
          />

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
          <div className="bg-[#e0e0e0] border border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex flex-col flex-1 min-h-[140px] max-h-[220px] overflow-hidden">
            <div className="bg-[#000080] text-white text-xs font-black px-2.5 py-1 tracking-wider uppercase flex items-center justify-between">
              <span>Personas Autorizadas</span>
              <span className="text-[10px] text-cyan-300 font-mono font-normal">
                {clientData?.contactos.length || 0} Registrados
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full border-collapse text-xs text-left bg-white">
                <thead className="sticky top-0 bg-[#c4c0b8] border-b border-gray-400 z-10 text-gray-900">
                  <tr>
                    <th className="p-1.5 font-black border-r border-gray-400 w-8 text-center">PR</th>
                    <th className="p-1.5 font-black border-r border-gray-400">Nombre / Contacto</th>
                    <th className="p-1.5 font-black">Teléfono</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {clientData?.contactos.map((contact) => (
                    <tr key={contact.prioridad} className="hover:bg-blue-100 font-bold text-gray-900 text-xs">
                      <td className="p-1 text-center font-mono font-black text-blue-900 border-r border-gray-300">{contact.prioridad}</td>
                      <td className="p-1 border-r border-gray-300 truncate max-w-[150px] font-extrabold uppercase">{contact.nombre}</td>
                      <td className="p-1 font-mono text-blue-900 flex items-center justify-between gap-1 font-bold">
                        <span className="truncate max-w-[110px]">{contact.telefono}</span>
                        <div className="flex gap-0.5 shrink-0">
                          <button
                            onClick={() => {
                              const telLimpio = contact.telefono.replace(/[^0-9]/g, '')
                              setWhatsappTelefonoInicial(telLimpio)
                              setModalActivo('notificaciones-whatsapp')
                            }}
                            title="Enviar WhatsApp (Interno)"
                            className="bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-1.5 py-0.5 hover:bg-[#d0d0d0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      <td colSpan={3} className="p-3 text-center text-gray-500 italic text-xs">Seleccione un abonado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Box 4: ZONIFICACION */}
          <div className="bg-[#e0e0e0] border border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex flex-col flex-1 min-h-[130px] max-h-[220px] overflow-hidden">
            <div className="bg-[#000080] text-white text-xs font-black px-2.5 py-1 tracking-wider uppercase flex items-center justify-between">
              <span>Zonificación</span>
              <span className="text-[10px] text-yellow-300 font-mono font-normal">
                {buscarZonasAbonado(activeEvent?.cuenta).length} Zonas
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const zonasAbonado = buscarZonasAbonado(activeEvent?.cuenta)
                if (!activeEvent) {
                  return (
                    <div className="p-3 text-center text-gray-500 text-xs italic">Seleccione un abonado</div>
                  )
                }
                if (zonasAbonado.length === 0) {
                  return (
                    <div className="p-3 text-center text-xs">
                      <div className="text-gray-600 italic font-bold">Sin información de zonas</div>
                      <div className="text-blue-800 font-bold mt-1 cursor-pointer hover:underline">Solicitar Zonificación</div>
                    </div>
                  )
                }
                return (
                  <table className="w-full border-collapse text-xs text-left bg-white">
                    <thead className="sticky top-0 bg-[#c4c0b8] border-b border-gray-400 z-10 text-gray-900">
                      <tr>
                        <th className="p-1.5 font-black border-r border-gray-400 w-9 text-center">ZN</th>
                        <th className="p-1.5 font-black border-r border-gray-400">Dispositivos</th>
                        <th className="p-1.5 font-black">Área Cubierta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                      {zonasAbonado.map((zona, idx) => (
                        <tr key={idx} className="hover:bg-blue-100 font-bold text-gray-900 text-xs">
                          <td className="p-1 text-center font-mono font-black border-r border-gray-300 text-amber-800">{zona.numero}</td>
                          <td className="p-1 border-r border-gray-300 truncate max-w-[120px] capitalize font-bold">{(zona.dispositivo || '').toLowerCase()}</td>
                          <td className="p-1 truncate max-w-[120px] capitalize font-semibold">{(zona.area || '').toLowerCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              })()}
            </div>
          </div>

          {/* Botón de verificación de video inferior dinámico */}
          <button 
            onClick={() => {
              if (!activeEvent) {
                alert('Por favor seleccione un abonado en la grilla primero.')
                return
              }
              if (tieneCamaras) {
                setModalActivo('video-verificacion')
              } else {
                setExpedientePestana('camara')
                setModalActivo('bar-chart')
              }
            }}
            title={tieneCamaras ? `Verificación por video activa (${cantCamarasActiva} cámaras registradas)` : 'Sin cámaras registradas. Clic para configurar en Expediente'}
            className={`w-full border-2 py-1 text-xs font-bold flex items-center justify-center gap-1.5 transition-all select-none shrink-0 cursor-pointer ${
              tieneCamaras
                ? 'bg-blue-900 text-white border-t-blue-400 border-l-blue-400 border-b-black border-r-black hover:bg-blue-800 active:border-t-black active:border-l-black active:border-b-white active:border-r-white shadow-sm'
                : 'bg-[#d4d0c8] text-gray-700 border-t-white border-l-white border-b-gray-600 border-r-gray-600 hover:bg-[#e0e0e0] active:border-t-gray-600 active:border-l-gray-600 active:border-b-white active:border-r-white'
            }`}
          >
            <span>{tieneCamaras ? '🎥' : '📷'}</span>
            <span>
              {tieneCamaras
                ? `Activar verificación por video (${cantCamarasActiva} cam)`
                : 'Sin cámaras registradas [Configurar]'}
            </span>
          </button>

        </div>
      </div>

      {/* Tool Modals */}
      {modalActivo && ['tools', 'user-key', 'file-edit', 'network', 'shield', 'book', 'grid-check', 'list-details', 'home', 'archive'].includes(modalActivo) && (
        <ToolModal
          modalId={modalActivo}
          onClose={() => setModalActivo(null)}
          operadores={operadores}
          onUpdateOperadores={(nuevosOps) => guardarOperadoresBase(nuevosOps)}
        />
      )}

      {/* Buscador Universal & Auditoría Histórica Modal (Asociado al botón de Lupa 'search' del footer) */}
      {modalActivo === 'search' && (
        <BuscadorUniversalModal
          onClose={() => setModalActivo(null)}
          clientesMap={clientesMap}
          codigosMap={codigosMap}
          onVerExpediente={(cuenta) => {
            const evFake: any = eventos.find(e => e.cuenta === cuenta) || { cuenta, nombre_abonado: clientesMap[cuenta]?.nombre || cuenta }
            setEventoSeleccionado(evFake)
            setExpedientePestana('telefonos')
            setModalRetorno('search')
            setModalActivo('bar-chart')
          }}
          onVerZonificacion={(cuenta) => {
            const evFake: any = eventos.find(e => e.cuenta === cuenta) || { cuenta, nombre_abonado: clientesMap[cuenta]?.nombre || cuenta }
            setEventoSeleccionado(evFake)
            setModalRetorno('search')
            setModalActivo('zones-tree')
          }}
          onVerCamaras={(cuenta) => {
            setModalRetorno('search')
            setCamaraGridCuenta(`CAMARAS_DAHUA_${cuenta.padStart(4, '0')}`)
          }}
          onEnviarWhatsApp={(telefono) => {
            setWhatsappTelefonoInicial(telefono)
            setModalRetorno('search')
            setModalActivo('notificaciones-whatsapp')
          }}
        />
      )}

      {/* Expediente Modal (Controlado por el botón de libros: 'bar-chart') */}
      {modalActivo === 'bar-chart' && activeEvent && (
        <ExpedienteModal
          evento={activeEvent}
          pestanaInicial={expedientePestana}
          onClose={cerrarModalConRetorno}
          usuarioRol={usuarioActivo.rol}
        />
      )}

      {/* Eventos Por Usuario Modal (Controlado por el botón checklist: 'checklist') */}
      {modalActivo === 'checklist' && (
        <EventosPorUsuarioModal
          eventoInicial={activeEvent || undefined}
          onClose={cerrarModalConRetorno}
        />
      )}

      {/* Zonificacion Modal (Controlado por el botón hierarchy: 'zones-tree') */}
      {modalActivo === 'zones-tree' && (
        <ZonificacionModal
          eventoInicial={activeEvent || undefined}
          onClose={cerrarModalConRetorno}
          usuarioRol={usuarioActivo.rol}
        />
      )}

      {/* Notificaciones Mail Modal (Controlado desde el menú superior) */}
      {modalActivo === 'notificaciones-mail' && (
        <NotificacionesMailModal
          onClose={cerrarModalConRetorno}
          clientesMap={clientesMap}
        />
      )}

      {/* Notificaciones WhatsApp Modal */}
      {modalActivo === 'notificaciones-whatsapp' && (
        <NotificacionesWhatsAppModal
          onClose={() => {
            setWhatsappTelefonoInicial(undefined)
            cerrarModalConRetorno()
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
          onClose={() => { setModalActivo(null); setServicioTecnicoInitialData(null); }} 
          clientesMap={clientesMap}
          usuarioActivo={usuarioActivo}
          initialCuenta={servicioTecnicoInitialData?.cuenta}
          initialProblema={servicioTecnicoInitialData?.problema}
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

      {/* Horarios Modal */}
      {modalActivo === 'horarios' && (
        <HorariosModal
          onClose={() => setModalActivo(null)}
          cuentaInicial={activeEvent?.cuenta || undefined}
          clientesMap={clientesMap}
        />
      )}

      {/* Predictor IA Mantenimiento Modal */}
      {modalActivo === 'predictor-ia' && (
        <PredictorMantenimientoModal
          onClose={() => setModalActivo(null)}
          eventos={eventos}
          clientesMap={clientesMap}
          onCrearOrdenTecnica={(cuenta, tipo, problema) => {
            setServicioTecnicoInitialData({ cuenta, problema })
            setModalActivo('servicio-tecnico')
          }}
          onEnviarWhatsApp={(telefono, mensaje) => {
            setWhatsappTelefonoInicial(telefono)
            setModalActivo('notificaciones-whatsapp')
          }}
        />
      )}

      {/* Simulador de Eventos y Entrenamiento Modal */}
      {modalActivo === 'simulador' && (
        <SimuladorEventosModal
          onClose={() => setModalActivo(null)}
          clientesMap={clientesMap}
          onInyectarEvento={(nuevoEv) => {
            setEventos(prev => [nuevoEv, ...prev])
            setEventoSeleccionado(nuevoEv)
          }}
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

      {/* Camara Grid Modal */}
      {camaraGridCuenta && (
        <CamaraGridModal
          cuenta={camaraGridCuenta}
          onClose={() => {
            setCamaraGridCuenta(null)
            cerrarModalConRetorno()
          }}
        />
      )}

      {/* Entrega de Turno Modal */}
      {modalActivo === 'entrega-turno' && (
        <EntregaTurnoModal
          onClose={() => setModalActivo(null)}
          usuarioActual={usuarioActivo.nombre}
        />
      )}

      {/* Health Telemetry Modal */}
      {modalActivo === 'health-telemetry' && (
        <HealthTelemetryModal
          onClose={() => setModalActivo(null)}
          sincronizadorVivo={sincronizadorVivo}
          ultimoHeartbeat={ultimoHeartbeat}
        />
      )}

      {/* Aperturas & Cierres Modal */}
      {modalActivo === 'aperturas-cierres' && (
        <AperturasCierresModal
          onClose={() => setModalActivo(null)}
        />
      )}

      {/* Footer */}
      <FooterActions
        unreadWhatsAppCount={unreadWhatsAppCount}
        operadorNombre={usuarioActivo.nombre}
        operadorRol={usuarioActivo.rol}
        horaLocal={horaLocal}
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
