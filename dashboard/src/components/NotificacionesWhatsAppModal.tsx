import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { sendMessage } from '@/lib/whatsapp'

// ──────────────────────────────────────────────
//  INTERFACES
// ──────────────────────────────────────────────
interface Props {
  onClose: () => void
  clientesMap: Record<string, Record<string, string>>
  cuentaInicial?: string
  telefonoInicial?: string
}

interface ContactoEscalamiento {
  nombre: string
  telefono: string
  parentesco: string
}

interface ChatLogItem {
  id: number
  cuenta: string
  telefono: string
  texto: string
  fecha: string
  exito: boolean
  errorMsg?: string | null
  esRespuestaCliente?: boolean
}

interface WaStatus {
  ready: boolean
  estado: string
  usuario: string | null
  hasQR: boolean
  cola: number
  uptime: number
  reintentos: number
}

interface QRData {
  status: 'connected' | 'waiting_qr' | 'connecting' | 'offline'
  qrImage: string | null
  usuario: string | null
}

type Tab = 'chat' | 'notificaciones' | 'config' | 'servidor'

// ──────────────────────────────────────────────
//  NORMALIZAR TELÉFONO (con soporte + internacional)
// ──────────────────────────────────────────────
function normalizarTelefono(raw: string): string {
  // Conservar el + si viene al inicio
  const tieneplus = raw.trim().startsWith('+')
  const digits = raw.replace(/[^0-9]/g, '')
  if (!digits) return ''
  // Chile 9 dígitos: 9xxxxxxxx → 569xxxxxxxx
  if (digits.length === 9 && digits.startsWith('9')) return '56' + digits
  // Chile 8 dígitos: xxxxxxxx → 569xxxxxxxx
  if (digits.length === 8) return '569' + digits
  // Con código de país explícito
  return digits
}

function formatearNumeroDisplay(num: string): string {
  const d = num.replace(/[^0-9]/g, '')
  if (!d) return num
  if (d.startsWith('56') && d.length >= 11) return `+${d.slice(0, 2)} 9 ${d.slice(3)}`
  return `+${d}`
}

// ──────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────
export default function NotificacionesWhatsAppModal({ onClose, clientesMap, cuentaInicial, telefonoInicial }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('chat')

  // ── Estado servidor WhatsApp ──
  const [waStatus, setWaStatus] = useState<WaStatus>({ ready: false, estado: 'CARGANDO', usuario: null, hasQR: false, cola: 0, uptime: 0, reintentos: 0 })
  const [qrData, setQrData] = useState<QRData>({ status: 'connecting', qrImage: null, usuario: null })
  const [pairingCode, setPairingCode] = useState('')
  const [pairingInput, setPairingInput] = useState('')
  const [loadingPair, setLoadingPair] = useState(false)
  const [loadingLogout, setLoadingLogout] = useState(false)
  const [serverMsg, setServerMsg] = useState('')

  // ── Tab Chat en vivo ──
  const [busquedaChat, setBusquedaChat] = useState('')
  const [chatActivo, setChatActivo] = useState<string | null>(null)
  const [todosLosChats, setTodosLosChats] = useState<any[]>([])
  const [textoChat, setTextoChat] = useState('')
  const [enviandoChat, setEnviandoChat] = useState(false)
  const [modoSidebar, setModoSidebar] = useState<'abonados' | 'grupos'>('abonados')
  const [cuentasExpandidas, setCuentasExpandidas] = useState<Record<string, boolean>>({})
  const [whatsappGrupos, setWhatsappGrupos] = useState<any[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Asignar chatActivo inicial si viene por prop
  useEffect(() => {
    if (telefonoInicial) {
      const limpio = telefonoInicial.replace(/[^0-9]/g, '')
      setChatActivo(limpio)
    }
  }, [telefonoInicial])

  // ── Tab Notificaciones ──
  const [busqueda, setBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{ cuenta: string; nombre: string } | null>(() => {
    if (cuentaInicial && clientesMap[cuentaInicial]) {
      return { cuenta: cuentaInicial, nombre: clientesMap[cuentaInicial].nombre || '' }
    }
    return null
  })
  // Número de destino actual — permite edición libre
  const [telefonoDestino, setTelefonoDestino] = useState('')
  const [telefonoManual, setTelefonoManual] = useState('')
  const [textoNotif, setTextoNotif] = useState('')
  const [enviandoNotif, setEnviandoNotif] = useState(false)
  const [statusNotif, setStatusNotif] = useState('')
  const [chatLogs, setChatLogs] = useState<ChatLogItem[]>([])

  // ── Tab Config ──
  const [telefono, setTelefono] = useState('')
  const [activo, setActivo] = useState(true)
  const [contactos, setContactos] = useState<ContactoEscalamiento[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensajeConfig, setMensajeConfig] = useState('')
  const [silenciaHasta, setSilenciaHasta] = useState('')
  const [notificarAlarma, setNotificarAlarma] = useState(true)
  const [notificarEnergia, setNotificarEnergia] = useState(true)
  const [notificarApertura, setNotificarApertura] = useState(false)
  const [notificarCierre, setNotificarCierre] = useState(false)
  const [notificarVideo, setNotificarVideo] = useState(false)

  // ══════════════════════════════════════════════
  //  POLLING DEL ESTADO Y QR DE WHATSAPP DIRECTO DESDE SUPABASE
  // ══════════════════════════════════════════════
  useEffect(() => {
    const fetchStatusAndQR = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('cuenta, nombre_abonado')
          .in('cuenta', ['CONFIG_WHATSAPP_STATE', 'CONFIG_WHATSAPP_QR', 'CONFIG_WHATSAPP_GROUPS'])

        if (error || !data) return

        const statusRow = data.find(r => r.cuenta === 'CONFIG_WHATSAPP_STATE')
        const qrRow = data.find(r => r.cuenta === 'CONFIG_WHATSAPP_QR')
        const groupsRow = data.find(r => r.cuenta === 'CONFIG_WHATSAPP_GROUPS')

        if (statusRow?.nombre_abonado) {
          const parsed = JSON.parse(statusRow.nombre_abonado)
          setWaStatus(parsed)
          if (parsed.pairingCode) {
            setPairingCode(parsed.pairingCode)
          }
        }

        if (qrRow?.nombre_abonado) {
          const parsedQR = JSON.parse(qrRow.nombre_abonado)
          setQrData(parsedQR)
        }

        if (groupsRow?.nombre_abonado) {
          try {
            const parsedG = JSON.parse(groupsRow.nombre_abonado)
            if (Array.isArray(parsedG)) setWhatsappGrupos(parsedG)
          } catch {}
        }
      } catch (err) {
        console.error('Error cargando estado de WhatsApp desde Supabase:', err)
      }
    }

    fetchStatusAndQR()
    const t = setInterval(fetchStatusAndQR, 5000)
    return () => clearInterval(t)
  }, [])

  // ══════════════════════════════════════════════
  //  CHAT EN VIVO - Cargar mensajes
  // ══════════════════════════════════════════════
  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await supabase
          .from('conversaciones_whatsapp')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200)
        if (data && data.length > 0) {
          setTodosLosChats(data)
          if (!chatActivo && data[0]?.numero) setChatActivo(data[0].numero)
        }
      } catch {}
    }
    cargar()

    const sub = supabase
      .channel('chat_global_v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversaciones_whatsapp' }, (payload: any) => {
        if (payload.new) setTodosLosChats(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [chatActivo, todosLosChats])

  // ══════════════════════════════════════════════
  //  CHAT: Construir lista de Abonados agrupados (Acordeón) y Grupos
  // ══════════════════════════════════════════════
  const abonadosAgrupadosMap = new Map<string, {
    cuenta: string
    nombre: string
    contactos: { nombre: string; telefono: string; rol: string }[]
    ultimoMsg?: string
    hora?: string
  }>()

  Object.entries(clientesMap).forEach(([cuenta, cliente]) => {
    const contactosAbonado: { nombre: string; telefono: string; rol: string }[] = []
    const campos = [
      { t: cliente.t1 || cliente.telefono1 || cliente.telefono, n: cliente.nombre1 || cliente.nombre || 'Titular Principal', r: 'Titular' },
      { t: cliente.t2 || cliente.telefono2, n: cliente.nombre2 || 'Contacto 2', r: 'Contacto 2' },
      { t: cliente.t3 || cliente.telefono3, n: cliente.nombre3 || 'Contacto 3', r: 'Contacto 3' },
      { t: cliente.t4 || cliente.telefono4, n: cliente.nombre4 || 'Contacto 4', r: 'Contacto 4' },
    ]
    campos.forEach(({ t, n, r }) => {
      if (t) {
        const num = t.replace(/[^0-9]/g, '')
        if (num.length >= 8 && !contactosAbonado.some(c => c.telefono === num)) {
          contactosAbonado.push({ nombre: n, telefono: num, rol: r })
        }
      }
    })

    let ultimoMsg = 'Abonado registrado'
    let hora = ''
    const msgAbonado = todosLosChats.find(m => m.cuenta === cuenta)
    if (msgAbonado) {
      ultimoMsg = msgAbonado.respuesta_recibida || msgAbonado.respuesta_cliente || msgAbonado.mensaje_enviado || ultimoMsg
      if (msgAbonado.created_at) {
        hora = new Date(msgAbonado.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      }
    }

    abonadosAgrupadosMap.set(cuenta, {
      cuenta,
      nombre: cliente.nombre || 'Sin nombre',
      contactos: contactosAbonado,
      ultimoMsg,
      hora
    })
  })

  const listaAbonadosAgrupada = Array.from(abonadosAgrupadosMap.values()).filter(a => {
    if (!busquedaChat.trim()) return true
    const q = busquedaChat.toLowerCase()
    return a.cuenta.toLowerCase().includes(q) || a.nombre.toLowerCase().includes(q) || a.contactos.some(c => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q))
  })

  // ── Grupos de WhatsApp ──
  const gruposMap = new Map<string, { id: string; nombre: string; miembros: number; ultimoMsg?: string; hora?: string }>()
  
  // Agregar grupos desde Supabase
  whatsappGrupos.forEach((g: any) => {
    if (g.id) {
      gruposMap.set(g.id, {
        id: g.id,
        nombre: g.subject || 'Grupo de WhatsApp',
        miembros: g.participantsCount || 0,
        ultimoMsg: 'Grupo de clientes'
      })
    }
  })

  // Detectar mensajes de grupos en BD (@g.us o guión de grupo)
  todosLosChats.forEach(item => {
    const num = (item.numero || item.telefono || '')
    if (num.includes('@g.us') || num.includes('-')) {
      const exist = gruposMap.get(num)
      const nombreGrupo = exist?.nombre || item.nombre_grupo || item.cuenta || `Grupo ${num.slice(0, 15)}...`
      const horaMsg = item.created_at ? new Date(item.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''
      gruposMap.set(num, {
        id: num,
        nombre: nombreGrupo,
        miembros: exist?.miembros || 0,
        ultimoMsg: item.respuesta_recibida || item.respuesta_cliente || item.mensaje_enviado || '',
        hora: horaMsg
      })
    }
  })

  const listaGrupos = Array.from(gruposMap.values()).filter(g => {
    if (!busquedaChat.trim()) return true
    const q = busquedaChat.toLowerCase()
    return g.nombre.toLowerCase().includes(q) || g.id.includes(q)
  })

  const mensajesActivos = todosLosChats
    .filter(m => {
      if (!chatActivo) return false
      const num = (m.numero || m.telefono || '').replace('@s.whatsapp.net', '').trim().toLowerCase()
      const active = chatActivo.replace('@s.whatsapp.net', '').trim().toLowerCase()
      const cuenta = (m.cuenta || '').trim().toLowerCase()
      const grupoNombre = (m.nombre_grupo || '').trim().toLowerCase()

      // Match exact JID or phone number
      if (num && (num === active || num === active.replace('@g.us', '') || num + '@g.us' === active || active.includes(num) || num.includes(active))) {
        return true
      }
      // Match group by name or cuenta
      if (active.includes('@g.us') || active.includes('-')) {
        const grupo = gruposMap.get(chatActivo)
        if (grupo) {
          const gNombre = grupo.nombre.toLowerCase()
          if (grupoNombre && (grupoNombre.includes(gNombre) || gNombre.includes(grupoNombre))) return true
          if (cuenta && (cuenta.includes(gNombre) || gNombre.includes(cuenta))) return true
        }
      }
      return false
    })
    .reverse()

  const [generandoIA, setGenerandoIA] = useState(false)

  const renderStatusCheck = (estado?: string) => {
    if (!estado || estado === 'pendiente') return <span className="text-gray-400 text-[10px]" title="Pendiente">⏳</span>
    if (estado === 'enviado') return <span className="text-gray-500 font-bold text-[11px]" title="Enviado">✓</span>
    if (estado === 'entregado') return <span className="text-gray-500 font-bold text-[11px]" title="Entregado">✓✓</span>
    if (estado === 'leido') return <span className="text-[#53bdeb] font-bold text-[11px]" title="Leído">✓✓</span>
    return <span className="text-gray-500 font-bold text-[11px]">✓</span>
  }

  const generarRespuestaIA = async () => {
    if (!chatActivo || generandoIA) return
    setGenerandoIA(true)
    try {
      // 1. Obtener la cuenta del cliente activo (ej: C730, C701, etc.)
      const cuentaActiva = clienteSeleccionado?.cuenta || (chatActivo.includes('1493818964') || chatActivo.includes('1495553039') ? 'C730' : '')

      // 2. Consultar eventos de los últimos 3 días en eventos_monitoreo
      let historialAlarmas3Dias: any[] = []
      try {
        const fechaHace3Dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        let query = supabase
          .from('eventos_monitoreo')
          .select('cuenta, evento, fecha_hora, zona, usuario, descripcion, nombre_abonado')
          .gte('fecha_hora', fechaHace3Dias)
          .order('fecha_hora', { ascending: false })

        if (cuentaActiva) {
          query = query.eq('cuenta', cuentaActiva)
        } else {
          query = query.limit(30)
        }
        const { data } = await query
        if (data) historialAlarmas3Dias = data
      } catch {}

      // 3. Formatear el historial de 3 días para el análisis de comportamiento
      const resumenEventos = historialAlarmas3Dias.map(e => {
        const f = e.fecha_hora ? new Date(e.fecha_hora).toLocaleString('es-CL') : ''
        return `[${f}] Cuenta: ${e.cuenta || 'General'} | Evento: ${e.evento || e.descripcion || 'Sin desmit.'} | Zona: ${e.zona || 'N/A'} | Usuario: ${e.usuario || 'N/A'}`
      }).slice(0, 35).join('\n')

      const contextoMsgs = mensajesActivos.slice(-5).map(m => {
        const remitente = (m.respuesta_recibida || m.respuesta_cliente) ? 'Cliente' : 'Gama Seguridad'
        const texto = m.respuesta_recibida || m.respuesta_cliente || m.mensaje_enviado || ''
        return `${remitente}: ${texto}`
      }).join('\n')

      const prompt = `Eres el Auditor de Inteligencia Artificial y Central de Monitoreo 24/7 de Gama Seguridad en Chile.
Tu tarea es hacer un ANÁLISIS DE COMPORTAMIENTO Y SEGUIMIENTO COMPLETO de los últimos 3 días para la cuenta/grupo actual (${cuentaActiva || 'General'}).

Analiza rigurosamente los datos de los últimos 3 días e identifica si ocurre algo de lo siguiente:
1. ⚡ CORTE DE LUZ / ENERGÍA: ¿Hubo corte de luz y NO se restableció? ¿O se restableció correctamente?
2. 🚨 ALARMAS SEGUIDAS / DISPAROS REPETIDOS: ¿Hay alarmas seguidas en la misma zona (posible intrusión o sensor fallado)?
3. 🔓 NO ABRIERON SISTEMA: ¿Faltan aperturas registradas en su horario habitual?
4. 🔒 NO CERRARON SISTEMA: ¿Faltan cierres o quedó desarmado fuera de horario?
5. 📋 RESUMEN DE SEGUIMIENTO: Un informe conciso de 3 a 5 líneas profesional listo para enviar a WhatsApp.

HISTORIAL DE EVENTOS DE ALARMA DE LOS ÚLTIMOS 3 DÍAS:
${resumenEventos || 'Sin eventos registrados en los últimos 3 días.'}

CHAT RECIENTE EN WHATSAPP:
${contextoMsgs || 'Sin mensajes recientes.'}

Responde directamente con la conclusión de seguimiento profesional de Gama Seguridad, clara, concisa y sin preámbulos.`

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      const borrador = data.texto || data.text || data.respuesta || data.result

      if (borrador) {
        setTextoChat(borrador.trim())
      } else {
        // Fallback inteligente
        setTextoChat(`GAMA SEGURIDAD 24/7 [AUDITORÍA 3 DÍAS]: Sistema verificado. ${historialAlarmas3Dias.length} eventos registrados en los últimos 3 días. Monitoreo operando normal.`)
      }
    } catch (err) {
      console.error('Error auditando comportamiento 3 días con IA:', err)
      setTextoChat('GAMA SEGURIDAD 24/7: Informe de seguimiento de 3 días generado. Central atenta a novedades.')
    } finally {
      setGenerandoIA(false)
    }
  }

  const enviarChat = async () => {
    if (!chatActivo || !textoChat.trim() || enviandoChat) return
    const texto = textoChat.trim()
    setTextoChat('')
    setEnviandoChat(true)
    try {
      const cuentaEnvio = clienteSeleccionado?.cuenta || (chatActivo.includes('@g.us') ? 'GRUPO' : 'CENTRAL')
      const res = await sendMessage(chatActivo, texto, cuentaEnvio)
      if (res.ok) {
        const nuevoMsg = {
          id: Date.now(),
          cuenta: cuentaEnvio,
          numero: chatActivo,
          mensaje_enviado: texto,
          estado: 'pendiente',
          created_at: new Date().toISOString()
        }
        setTodosLosChats(prev => [nuevoMsg, ...prev])
      }
    } catch (err: any) {
      console.error('Error enviando chat:', err)
    } finally {
      setEnviandoChat(false)
    }
  }

  const toggleCuentaExpandida = (cuenta: string) => {
    setCuentasExpandidas(prev => ({ ...prev, [cuenta]: !prev[cuenta] }))
  }

  // ══════════════════════════════════════════════
  //  NOTIFICACIONES - Cargar historial por cliente
  // ══════════════════════════════════════════════
  useEffect(() => {
    if (!clienteSeleccionado) {
      setTelefono('')
      setTelefonoDestino('')
      setActivo(true)
      setContactos([])
      setSilenciaHasta('')
      return
    }
    const cargar = async () => {
      const { data } = await supabase
        .from('notificaciones_whatsapp')
        .select('*')
        .eq('cuenta', clienteSeleccionado.cuenta)
        .single()
      if (data) {
        setTelefono(data.telefono || '')
        setActivo(data.activo !== false)
        setContactos((data.contactos_escalamiento as ContactoEscalamiento[]) || [])
        setSilenciaHasta(data.silencio_hasta || '')
        setNotificarAlarma(data.notificar_alarma !== false)
        setNotificarEnergia(data.notificar_energia !== false)
        setNotificarApertura(data.notificar_apertura === true)
        setNotificarCierre(data.notificar_cierre === true)
        setNotificarVideo(data.notificar_video === true)
      } else {
        const datosCliente = clientesMap[clienteSeleccionado.cuenta]
        const telSugerido = datosCliente
          ? (datosCliente.t1 || datosCliente.telefono1 || datosCliente.telefono || datosCliente.t2 || '')
          : ''
        setTelefono(telSugerido)
        setActivo(true)
        setContactos([])
        setSilenciaHasta('')
        setNotificarAlarma(true); setNotificarEnergia(true)
        setNotificarApertura(false); setNotificarCierre(false); setNotificarVideo(false)
      }
    }
    cargar()

    // Cargar historial del abonado
    const cargarHistorial = async () => {
      try {
        const { data } = await supabase
          .from('conversaciones_whatsapp')
          .select('*')
          .eq('cuenta', clienteSeleccionado.cuenta)
          .order('created_at', { ascending: false })
          .limit(40)
        if (data && data.length > 0) {
          const items: ChatLogItem[] = []
          data.forEach((row: any) => {
            if (row.mensaje_enviado) {
              items.push({ id: Math.random(), cuenta: row.cuenta || clienteSeleccionado.cuenta, telefono: row.numero || '', texto: row.mensaje_enviado, fecha: new Date(row.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }), exito: true, esRespuestaCliente: false })
            }
            if (row.respuesta_recibida || row.respuesta_cliente) {
              items.push({ id: Math.random(), cuenta: row.cuenta || clienteSeleccionado.cuenta, telefono: row.numero || '', texto: row.respuesta_recibida || row.respuesta_cliente, fecha: new Date(row.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }), exito: true, esRespuestaCliente: true })
            }
          })
          setChatLogs(items)
        } else {
          setChatLogs([])
        }
      } catch {}
    }
    cargarHistorial()

    const ch = supabase
      .channel(`notif_rt_${clienteSeleccionado.cuenta}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversaciones_whatsapp' }, (payload: any) => {
        const row = payload.new
        if (!row) return
        const esCliente = !!(row.respuesta_recibida || row.respuesta_cliente)
        const nuevoItem: ChatLogItem = {
          id: Date.now(), cuenta: row.cuenta || clienteSeleccionado.cuenta, telefono: row.numero || '',
          texto: esCliente ? (row.respuesta_recibida || row.respuesta_cliente) : (row.mensaje_enviado || ''),
          fecha: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }), exito: true, esRespuestaCliente: esCliente
        }
        setChatLogs(prev => [nuevoItem, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [clienteSeleccionado, clientesMap])

  // Obtener lista de contactos del abonado seleccionado con Nombre + Rol + Teléfono
  const obtenerContactos = useCallback(() => {
    if (!clienteSeleccionado) return []
    const cliente = clientesMap[clienteSeleccionado.cuenta]
    if (!cliente) return []
    const lista: { etiqueta: string; telefono: string; nombre: string }[] = []
    const campos = [
      { t: cliente.t1 || cliente.telefono1 || cliente.telefono, n: cliente.nombre1 || cliente.nombre || 'Titular Principal', e: 'Titular' },
      { t: cliente.t2 || cliente.telefono2, n: cliente.nombre2 || 'Contacto 2', e: 'Contacto 2' },
      { t: cliente.t3 || cliente.telefono3, n: cliente.nombre3 || 'Contacto 3', e: 'Contacto 3' },
      { t: cliente.t4 || cliente.telefono4, n: cliente.nombre4 || 'Contacto 4', e: 'Contacto 4' },
    ]
    campos.forEach(({ t, n, e }) => {
      if (t && t.replace(/[^0-9]/g, '').length >= 8) {
        lista.push({ etiqueta: `👤 ${n} (${e}) — ${formatearNumeroDisplay(t)}`, telefono: t, nombre: n })
      }
    })
    contactos.forEach((c, idx) => {
      if (c.telefono?.replace(/[^0-9]/g, '').length >= 8) {
        lista.push({ etiqueta: `🔗 ${c.nombre || 'Escalamiento'} (${c.parentesco || `Escal. ${idx + 1}`}) — ${formatearNumeroDisplay(c.telefono)}`, telefono: c.telefono, nombre: c.nombre || `Escal. ${idx + 1}` })
      }
    })
    return lista
  }, [clienteSeleccionado, clientesMap, contactos])

  const enviarNotificacion = async () => {
    const destFinal = telefonoManual.trim() || telefonoDestino
    if (!destFinal) { setStatusNotif('❌ Selecciona o ingresa un número de destino'); return }
    if (!textoNotif.trim()) { setStatusNotif('❌ Escribe el mensaje'); return }

    let telNorm = normalizarTelefono(destFinal)
    if (!telNorm || telNorm.length < 8) { setStatusNotif('❌ Número inválido (mín 8 dígitos)'); return }

    let mensajeFinal = textoNotif.trim()
    const preTexto = 'GAMA SEGURIDAD INFORMA: '
    if (!mensajeFinal.toUpperCase().startsWith('GAMA SEGURIDAD INFORMA:')) {
      mensajeFinal = `${preTexto}${mensajeFinal}`
    }
    if (!mensajeFinal.includes('NO responder')) {
      mensajeFinal += '\n\n🚫 *Por favor, NO responder a este mensaje. Es una notificación automática.*'
    }

    setEnviandoNotif(true)
    setStatusNotif('⏳ Enviando...')
    try {
      const cuentaEnvio = clienteSeleccionado?.cuenta || 'MANUAL'
      const res = await sendMessage(telNorm, mensajeFinal, cuentaEnvio)
      if (!res.ok) throw new Error(res.debug || 'Error enviando mensaje')

      const logItem: ChatLogItem = {
        id: Date.now(), cuenta: clienteSeleccionado?.cuenta || 'MANUAL', telefono: telNorm,
        texto: mensajeFinal, fecha: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        exito: true, errorMsg: null, esRespuestaCliente: false
      }
      setChatLogs(prev => [logItem, ...prev])
      setTextoNotif('')
      setStatusNotif(`✅ Enviado a +${telNorm}`)
      setTelefonoManual('')
    } catch (err: any) {
      setStatusNotif('❌ ' + err.message)
    } finally {
      setEnviandoNotif(false)
      setTimeout(() => setStatusNotif(''), 5000)
    }
  }

  const aplicarPlantilla = (tipo: string) => {
    const cuenta = clienteSeleccionado?.cuenta || '???'
    const plantillas: Record<string, string> = {
      intrusión: `Se ha detectado una ALARMA DE ROBO / INTRUSIÓN en su propiedad. Por favor confirmar estado urgentemente.`,
      energia: `Se registra CORTE DE ENERGÍA ELÉCTRICA en su propiedad. Su sistema opera con batería de respaldo (72h aprox.).`,
      apertura: `Se registra APERTURA DE SISTEMA en su propiedad.`,
      cierre: `Confirmación de CIERRE DE INSTALACIÓN recibido correctamente. Sistema armado.`,
      video: `Transmisión de video-verificación en vivo activada para su propiedad.`,
      panico: `⚠️ SEÑAL DE PÁNICO RECIBIDA desde su propiedad. Personal de emergencia en camino. Responda OK si está seguro.`,
    }
    setTextoNotif(plantillas[tipo] || '')
  }

  const guardarConfig = async () => {
    if (!clienteSeleccionado) return
    const telLimpio = telefono.replace(/[^0-9]/g, '')
    if (!telLimpio) { setMensajeConfig('Ingresa un teléfono válido'); return }
    setGuardando(true); setMensajeConfig('')
    try {
      const payload: any = {
        cuenta: clienteSeleccionado.cuenta, telefono: telLimpio, activo,
        contactos_escalamiento: contactos, silencio_hasta: null,
        updated_at: new Date().toISOString(),
        notificar_alarma: notificarAlarma, notificar_energia: notificarEnergia,
        notificar_apertura: notificarApertura, notificar_cierre: notificarCierre,
        notificar_video: notificarVideo,
      }
      const { error } = await supabase.from('notificaciones_whatsapp').upsert(payload, { onConflict: 'cuenta' })
      if (error) throw error
      setMensajeConfig('✅ Guardado correctamente')
    } catch (err: any) {
      setMensajeConfig('Error: ' + err.message)
    } finally {
      setGuardando(false)
      setTimeout(() => setMensajeConfig(''), 3000)
    }
  }

  // Pairing Code
  const solicitarPairingCode = async () => {
    setLoadingPair(true); setServerMsg('')
    try {
      const phone = pairingInput.replace(/[^0-9]/g, '') || '56948855190'
      await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'CONFIG_WHATSAPP_COMMAND',
          nombre_abonado: `PAIR:${phone}`,
          evento: 'COMMAND',
          fecha_hora: new Date().toISOString()
        }, { onConflict: 'cuenta' })
      setServerMsg('⏳ Solicitud de Pairing Code enviada a la nube. El codigo aparecera aqui en breve...')
    } catch (err: any) {
      setServerMsg('❌ Error: ' + err.message)
    } finally {
      setLoadingPair(false)
    }
  }

  const logout = async () => {
    if (!confirm('¿Cerrar sesión de WhatsApp? Deberás volver a vincular.')) return
    setLoadingLogout(true)
    try {
      await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'CONFIG_WHATSAPP_COMMAND',
          nombre_abonado: 'LOGOUT',
          evento: 'COMMAND',
          fecha_hora: new Date().toISOString()
        }, { onConflict: 'cuenta' })
      setServerMsg('🔴 Solicitud de cierre de sesión enviada a la nube...')
    } catch (err: any) {
      setServerMsg('❌ Error al solicitar logout: ' + err.message)
    }
    setLoadingLogout(false)
  }

  const clientesFiltrados = Object.entries(clientesMap).filter(([cuenta, datos]) => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return cuenta.toLowerCase().includes(q) || (datos.nombre || '').toLowerCase().includes(q)
  })

  const contactosAbonado = obtenerContactos()

  // Indicador de estado del servidor
  const statusColor = waStatus.ready ? '#22c55e' : waStatus.estado === 'ESPERANDO_QR' ? '#f59e0b' : '#ef4444'
  const statusLabel = waStatus.ready ? `✅ Conectado (${waStatus.usuario || ''})` : waStatus.estado === 'SERVIDOR_APAGADO' ? '🔴 Servidor apagado' : waStatus.hasQR ? '🟡 Esperando QR' : '🔵 Conectando...'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'chat',          label: '💬 Chat en Vivo' },
    { id: 'notificaciones',label: '📢 Enviar Notificaciones' },
    { id: 'config',        label: '⚙️ Configuración' },
    { id: 'servidor',      label: '📡 Estado Servidor' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 font-sans backdrop-blur-sm">
      <div className="bg-[#f0f2f5] border border-gray-300 rounded-xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header WhatsApp Web Official Green Style */}
        <div className="bg-[#00a884] text-white px-4 py-2.5 flex justify-between items-center shrink-0 shadow-md">
          <div className="font-bold text-sm tracking-wide flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm shadow font-bold">
              💬
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                CENTRO DE MENSAJERÍA WHATSAPP
                <span className="text-[10px] bg-white/20 text-white border border-white/40 px-1.5 py-0.5 rounded font-mono">v3.0</span>
              </div>
              <div className="text-[10px] text-white/80">Gama Seguridad — Monitoreo 24/7</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Indicador de estado compacto */}
            <span className="text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 bg-white text-black shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor }} />
              {statusLabel}
            </span>
            {waStatus.cola > 0 && (
              <span className="text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold shadow">
                📥 {waStatus.cola} en cola
              </span>
            )}
            <button
              onClick={onClose}
              className="bg-white/20 text-white hover:bg-red-600 hover:text-white font-bold w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-xs shadow-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs WhatsApp Web Style */}
        <div className="flex border-b border-gray-300 shrink-0 bg-[#f0f2f5]">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 text-xs font-bold tracking-wide transition-all cursor-pointer border-b-2 ${
                activeTab === t.id
                  ? 'bg-white text-[#00a884] border-b-[#00a884] shadow-sm'
                  : 'text-[#54656f] hover:text-[#111b21] border-b-transparent hover:bg-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden">

          {/* ══════════════════════════════════════════
              TAB 1: CHAT EN VIVO
          ══════════════════════════════════════════ */}
          {activeTab === 'chat' && (
            <div className="flex h-full bg-[#f0f2f5] text-[#111b21] overflow-hidden font-sans">

              {/* Sidebar: Lista de chats */}
              <div className="w-80 border-r border-gray-300 bg-[#ffffff] flex flex-col shrink-0">
                {/* Header sidebar */}
                <div className="p-3 bg-[#f0f2f5] border-b border-gray-300 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-white text-xs shadow">GS</div>
                    <div>
                      <div className="font-bold text-xs text-[#111b21]">WHATSAPP CENTRAL</div>
                      <div className="text-[10px] text-[#00a884] font-bold">Gama Seguridad</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm" style={{ background: statusColor, color: '#000' }}>
                    {waStatus.ready ? 'EN LÍNEA' : 'OFFLINE'}
                  </span>
                </div>

                {/* Selector de Modo: Abonados vs Grupos */}
                <div className="flex border-b border-gray-300 bg-[#f0f2f5] shrink-0">
                  <button
                    onClick={() => setModoSidebar('abonados')}
                    className={`flex-1 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                      modoSidebar === 'abonados'
                        ? 'border-[#00a884] text-[#00a884] bg-white shadow-sm'
                        : 'border-transparent text-[#54656f] hover:text-[#111b21]'
                    }`}
                  >
                    🏢 Abonados ({listaAbonadosAgrupada.length})
                  </button>
                  <button
                    onClick={() => setModoSidebar('grupos')}
                    className={`flex-1 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                      modoSidebar === 'grupos'
                        ? 'border-[#00a884] text-[#00a884] bg-white shadow-sm'
                        : 'border-transparent text-[#54656f] hover:text-[#111b21]'
                    }`}
                  >
                    👥 Grupos ({listaGrupos.length})
                  </button>
                </div>

                {/* Buscador */}
                <div className="p-2.5 bg-[#f0f2f5] border-b border-gray-300 shrink-0">
                  <input
                    type="text"
                    placeholder={modoSidebar === 'abonados' ? "🔍 Buscar abonado o número..." : "🔍 Buscar grupo de WhatsApp..."}
                    className="w-full bg-white text-[#111b21] border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#00a884] shadow-sm"
                    value={busquedaChat}
                    onChange={e => setBusquedaChat(e.target.value)}
                  />
                </div>

                {/* Lista de chats (Modo Abonados con Acordeón) */}
                {modoSidebar === 'abonados' ? (
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-200 bg-white">
                    {listaAbonadosAgrupada.length === 0 && (
                      <div className="p-4 text-center text-[#54656f] text-xs">Sin abonados registrados</div>
                    )}
                    {listaAbonadosAgrupada.map(abonado => {
                      const isExpanded = !!cuentasExpandidas[abonado.cuenta]
                      return (
                        <div key={abonado.cuenta} className="bg-white">
                          {/* Item del Abonado Header */}
                          <div
                            onClick={() => toggleCuentaExpandida(abonado.cuenta)}
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#f5f6f6] transition-colors select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                {abonado.cuenta.slice(0, 3)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-[#111b21] truncate max-w-[160px]">
                                  {abonado.cuenta} — {abonado.nombre}
                                </div>
                                <div className="text-[10px] text-[#54656f]">
                                  {abonado.contactos.length} contacto(s)
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-[#00a884] font-bold px-1">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>

                          {/* Acordeón de Contactos desplegable */}
                          {isExpanded && (
                            <div className="bg-[#f5f6f6] pl-4 divide-y divide-gray-200">
                              {abonado.contactos.length === 0 ? (
                                <div className="p-2 text-[10px] text-[#54656f]">Sin números registrados</div>
                              ) : (
                                abonado.contactos.map((contacto, idx) => {
                                  const isSelected = chatActivo === contacto.telefono
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        setChatActivo(contacto.telefono)
                                        const cli = clientesMap[abonado.cuenta]
                                        if (cli) {
                                          setClienteSeleccionado({ cuenta: abonado.cuenta, nombre: cli.nombre || '' })
                                        }
                                      }}
                                      className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#e9edef] transition-colors ${isSelected ? 'bg-[#e9edef] border-l-4 border-l-[#00a884]' : ''}`}
                                    >
                                      <div className="min-w-0">
                                        <div className="font-bold text-[11px] text-[#111b21] truncate">
                                          👤 {contacto.nombre}
                                        </div>
                                        <div className="text-[9px] text-[#54656f]">
                                          {contacto.rol} · {formatearNumeroDisplay(contacto.telefono)}
                                        </div>
                                      </div>
                                      <span className="text-[10px] text-[#00a884] font-bold">💬 Chat</span>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* Modo Grupos de WhatsApp */
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-200 bg-white">
                    {listaGrupos.length === 0 && (
                      <div className="p-4 text-center text-[#54656f] text-xs">No se han detectado grupos aún</div>
                    )}
                    {listaGrupos.map(grupo => {
                      const isSelected = chatActivo === grupo.id
                      return (
                        <div
                          key={grupo.id}
                          onClick={() => setChatActivo(grupo.id)}
                          className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-[#e9edef] border-l-4 border-l-[#00a884]' : 'hover:bg-[#f5f6f6]'}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#25d366] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                            👥
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <span className="font-bold text-xs text-[#111b21] truncate max-w-[140px]">{grupo.nombre}</span>
                              <span className="text-[9px] text-[#54656f] shrink-0 ml-1">{grupo.hora}</span>
                            </div>
                            <div className="text-[10px] text-[#54656f] truncate font-sans">
                              {grupo.miembros > 0 ? `${grupo.miembros} miembros` : grupo.ultimoMsg}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Panel de chat */}
              <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                {!chatActivo ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#54656f] p-6 text-center bg-[#f0f2f5]">
                    <div className="w-20 h-20 rounded-full bg-[#00a884]/10 border border-[#00a884]/30 flex items-center justify-center text-4xl mb-4">💬</div>
                    <span className="font-bold text-sm text-[#111b21] mb-2">GAMA SEGURIDAD — CHAT EN VIVO</span>
                    <span className="text-xs">Selecciona un abonado o grupo de la lista para conversar.</span>
                  </div>
                ) : (
                  <>
                    {/* Header del chat */}
                    <div className="p-3 bg-[#f0f2f5] border-b border-gray-300 flex items-center justify-between shrink-0 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-white text-base uppercase shadow-sm">
                          {chatActivo.includes('@g.us') || chatActivo.includes('-') ? '👥' : '👤'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#111b21]">
                            {(() => {
                              if (chatActivo.includes('@g.us') || chatActivo.includes('-')) {
                                return gruposMap.get(chatActivo)?.nombre || `Grupo WhatsApp`
                              }
                              for (const ab of abonadosAgrupadosMap.values()) {
                                const c = ab.contactos.find(x => x.telefono === chatActivo)
                                if (c) return `[${ab.cuenta}] ${ab.nombre} — ${c.nombre} (${c.rol})`
                              }
                              return `+${chatActivo}`
                            })()}
                          </div>
                          <div className="text-[10px] text-[#54656f] font-mono">
                            {chatActivo.includes('@g.us') || chatActivo.includes('-') ? 'Canal Grupal WhatsApp' : formatearNumeroDisplay(chatActivo)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setTelefonoManual(chatActivo); setActiveTab('notificaciones') }}
                        className="text-[10px] bg-[#00a884] text-white border border-[#00a884] px-3.5 py-1.5 rounded-full hover:bg-[#029676] transition-colors cursor-pointer font-bold shadow-sm"
                      >
                        📢 Enviar Notificación
                      </button>
                    </div>

                    {/* Mensajes (Wallpaper WhatsApp Beige #efeae2) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]">
                      {mensajesActivos.length === 0 && (
                        <div className="text-center text-[#54656f] text-xs py-8 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-300/50 max-w-sm mx-auto shadow-sm">
                          Sin mensajes registrados aún en esta conversación
                        </div>
                      )}
                      {mensajesActivos.map((msg, i) => {
                        const esCliente = !!(msg.respuesta_recibida || msg.respuesta_cliente)
                        const texto = esCliente ? (msg.respuesta_recibida || msg.respuesta_cliente) : msg.mensaje_enviado
                        if (!texto) return null
                        return (
                          <div key={msg.id || i} className={`flex flex-col ${esCliente ? 'items-start' : 'items-end'}`}>
                            <div className={`max-w-[75%] p-3 rounded-lg text-xs font-sans shadow break-words ${esCliente ? 'bg-white text-[#111b21] rounded-tl-none border border-gray-200' : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none border border-green-200'}`}>
                              <div className="text-[9px] font-bold opacity-70 mb-1 flex justify-between gap-4 items-center">
                                <span className={esCliente ? 'text-[#00a884]' : 'text-[#075e54]'}>{esCliente ? `📩 CLIENTE` : `🛡️ GAMA SEGURIDAD`}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[#667781]">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                  {!esCliente && renderStatusCheck(msg.estado)}
                                </div>
                              </div>
                              <div className="leading-relaxed text-[#111b21]">{texto}</div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Toolbar de Mensajes Pregrabados Rápida */}
                    <div className="bg-[#f0f2f5] border-t border-gray-300 p-2 flex flex-wrap gap-1.5 items-center shrink-0">
                      <span className="text-[10px] font-bold text-[#00a884] uppercase tracking-wider mr-1">
                        ⚡ PLANTILLAS RÁPIDAS:
                      </span>

                      {/* Mostrar C730 si es el grupo Acceso 24/7 */}
                      {chatActivo.includes('56974790348') ? (
                        <>
                          <button
                            onClick={() => setTextoChat('GAMA SEGURIDAD 24/7: Se registra APERTURA DE SISTEMA en Abonado C730.')}
                            className="text-[10px] bg-white hover:bg-green-50 text-green-700 border border-green-500 px-2.5 py-1 rounded cursor-pointer transition-colors font-bold shadow-sm"
                          >
                            🟢 Apertura C730
                          </button>
                          <button
                            onClick={() => setTextoChat('GAMA SEGURIDAD 24/7: Se registra CIERRE DE SISTEMA en Abonado C730. Sistema armado.')}
                            className="text-[10px] bg-white hover:bg-blue-50 text-blue-700 border border-blue-500 px-2.5 py-1 rounded cursor-pointer transition-colors font-bold shadow-sm"
                          >
                            🔵 Cierre C730
                          </button>
                          <button
                            onClick={() => {
                              const zona = prompt('Ingrese el número de Zona con alarma en C730 (ej: 02, 05, 12):', '01')
                              if (zona) {
                                setTextoChat(`GAMA SEGURIDAD 24/7: 🚨 ALARMA DE ROBO / INTRUSIÓN en Abonado C730 — ZONA ${zona}. Confirmar estado con personal.`)
                              }
                            }}
                            className="text-[10px] bg-white hover:bg-red-50 text-red-700 border border-red-500 px-2.5 py-1 rounded cursor-pointer transition-colors font-bold shadow-sm"
                          >
                            🚨 Alarma C730
                          </button>
                          <button
                            onClick={() => setTextoChat('GAMA SEGURIDAD 24/7: ⚡ CORTE DE ENERGÍA ELÉCTRICA en Abonado C730. Su sistema opera con batería de respaldo.')}
                            className="text-[10px] bg-white hover:bg-amber-50 text-amber-700 border border-amber-500 px-2.5 py-1 rounded cursor-pointer transition-colors font-bold shadow-sm"
                          >
                            ⚡ Energía C730
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setTextoChat('GAMA SEGURIDAD INFORMA: Se registra APERTURA DE SISTEMA en su propiedad.')}
                            className="text-[10px] bg-white hover:bg-green-50 text-green-700 border border-green-500 px-2.5 py-1 rounded cursor-pointer transition-colors font-bold shadow-sm"
                          >
                            🟢 Apertura
                          </button>
                          <button
                            onClick={() => setTextoChat('GAMA SEGURIDAD INFORMA: Se registra CIERRE DE SISTEMA. Sistema armado correctamente.')}
                            className="text-[10px] bg-white hover:bg-blue-50 text-blue-700 border border-blue-500 px-2.5 py-1 rounded cursor-pointer transition-colors font-bold shadow-sm"
                          >
                            🔵 Cierre
                          </button>
                          <button
                            onClick={() => {
                              const zona = prompt('Ingrese el número de Zona con alarma (ej: 02, 05, 12):', '01')
                              if (zona) {
                                setTextoChat(`GAMA SEGURIDAD INFORMA: 🚨 ALARMA DE ROBO / INTRUSIÓN en su propiedad — ZONA ${zona}. Por favor confirmar estado urgentemente.`)
                              }
                            }}
                            className="text-[10px] bg-white hover:bg-red-50 text-red-700 border border-red-500 px-2.5 py-1 rounded cursor-pointer transition-colors font-bold shadow-sm"
                          >
                            🚨 Alarma Robo
                          </button>
                          <button
                            onClick={() => setTextoChat('GAMA SEGURIDAD INFORMA: ⚡ Se registra CORTE DE ENERGÍA ELÉCTRICA en su propiedad. Su sistema opera con batería de respaldo.')}
                            className="text-[10px] bg-white hover:bg-amber-50 text-amber-700 border border-amber-500 px-2.5 py-1 rounded cursor-pointer transition-colors font-bold shadow-sm"
                          >
                            ⚡ Corte Energía
                          </button>
                        </>
                      )}

                      {/* Generador Rápido por Código de Abonado */}
                      <button
                        onClick={() => {
                          const cuent = prompt('Ingrese CÓDIGO DE ABONADO (ej: C730, 1001, C798):', 'C730')?.toUpperCase()
                          if (!cuent) return
                          const tipo = prompt('Tipo de novedad (1=Apertura, 2=Cierre, 3=Alarma Robo, 4=Corte Energía):', '1')
                          const z = tipo === '3' ? prompt('Número de zona:', '01') : ''

                          let msg = `GAMA SEGURIDAD: Novedad sobre Abonado ${cuent}.`
                          if (tipo === '1') msg = `GAMA SEGURIDAD: Se registra APERTURA DE SISTEMA en Abonado ${cuent}.`
                          else if (tipo === '2') msg = `GAMA SEGURIDAD: Se registra CIERRE DE SISTEMA en Abonado ${cuent}. Sistema armado.`
                          else if (tipo === '3') msg = `GAMA SEGURIDAD: 🚨 ALARMA DE INTRUSIÓN en Abonado ${cuent} — ZONA ${z || '01'}.`
                          else if (tipo === '4') msg = `GAMA SEGURIDAD: ⚡ CORTE DE ENERGÍA en Abonado ${cuent}. Operando con batería de respaldo.`

                          setTextoChat(msg)
                        }}
                        className="text-[10px] bg-[#00a884] hover:bg-[#029676] text-white px-3 py-1 rounded cursor-pointer font-bold ml-auto shadow-sm"
                      >
                        ➕ Novedad por Código Abonado
                      </button>
                    </div>

                    {/* Input de respuesta */}
                    <div className="p-3 bg-[#f0f2f5] border-t border-gray-300 flex gap-2 items-end shrink-0 shadow-sm">
                      <textarea
                        rows={2}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-white text-[#111b21] p-2.5 text-xs font-sans rounded-lg border border-gray-300 focus:outline-none focus:border-[#00a884] resize-none shadow-sm"
                        value={textoChat}
                        onChange={e => setTextoChat(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarChat() } }}
                      />
                      <button
                        onClick={generarRespuestaIA}
                        disabled={generandoIA}
                        title="Generar respuesta inteligente con Gemini IA basada en los últimos mensajes"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 py-2.5 rounded-lg disabled:opacity-50 cursor-pointer shadow h-10 transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        {generandoIA ? '✨ Pensando...' : '🤖 Asistente IA'}
                      </button>
                      <button
                        onClick={enviarChat}
                        disabled={!textoChat.trim() || enviandoChat}
                        className="bg-[#00a884] hover:bg-[#029676] text-white font-bold text-xs px-4 py-2.5 rounded-lg disabled:opacity-50 cursor-pointer shadow h-10 transition-colors shrink-0"
                      >
                        {enviandoChat ? '⏳' : '💬 Send'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              TAB 2: ENVIAR NOTIFICACIONES
          ══════════════════════════════════════════ */}
          {activeTab === 'notificaciones' && (
            <div className="flex gap-2 h-full bg-[#c0c0c0] p-2 overflow-hidden">

              {/* Columna Izquierda: Lista de Abonados */}
              <div className="w-56 border-2 border-gray-700 bg-black text-green-400 flex flex-col font-mono text-[11px] shrink-0">
                <div className="p-1.5 border-b border-gray-800 bg-gray-900 shrink-0">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">ABONADOS:</span>
                  <input
                    type="text"
                    placeholder="BUSCAR..."
                    className="w-full bg-black text-green-400 border border-green-800 px-2 py-1 focus:outline-none focus:border-green-400 text-[10px]"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-800 text-green-200 text-[10px]">
                        <th className="p-1 border-b border-gray-700 w-12">CTA</th>
                        <th className="p-1 border-b border-gray-700">NOMBRE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900">
                      {clientesFiltrados.map(([cuenta, datos]) => (
                        <tr
                          key={cuenta}
                          className={`cursor-pointer hover:bg-green-900/60 ${clienteSeleccionado?.cuenta === cuenta ? 'bg-green-900 text-white font-bold' : ''}`}
                          onClick={() => {
                            setClienteSeleccionado({ cuenta, nombre: datos.nombre || '' })
                            setTelefonoManual('')
                            setTelefonoDestino('')
                          }}
                        >
                          <td className="p-1 border-r border-gray-800 font-bold">{cuenta}</td>
                          <td className="p-1 truncate max-w-[110px] text-[10px]">{datos.nombre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Columna Central: Redacción */}
              <div className="flex-1 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e0e0e0] flex flex-col p-2 text-black overflow-y-auto gap-2">
                <div className="text-[#000080] font-bold text-xs border-b border-gray-400 pb-1 flex justify-between items-center shrink-0">
                  <span>📢 ENVÍO DE NOTIFICACIÓN WHATSAPP</span>
                  {clienteSeleccionado && <span className="bg-[#000080] text-white px-2 py-0.5 text-[10px] rounded font-mono">CTA: {clienteSeleccionado.cuenta}</span>}
                </div>

                {/* PASO 1: Selector de número destino */}
                <div className="bg-white border border-gray-300 p-2 rounded">
                  <div className="text-[10px] font-bold text-gray-700 mb-1.5">1. SELECCIONAR NÚMERO DE DESTINO:</div>

                  {/* Contactos del abonado */}
                  {clienteSeleccionado && contactosAbonado.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {contactosAbonado.map((c, idx) => {
                        const telNorm = normalizarTelefono(c.telefono)
                        const isSelected = telefonoDestino === c.telefono && !telefonoManual
                        return (
                          <button
                            key={idx}
                            onClick={() => { setTelefonoDestino(c.telefono); setTelefonoManual('') }}
                            className={`text-left px-2 py-1 rounded border text-[10px] cursor-pointer transition-all flex flex-col gap-0.5 ${
                              isSelected
                                ? 'bg-green-700 text-white border-green-900 font-bold shadow-inner'
                                : 'bg-white text-gray-800 border-gray-400 hover:bg-green-50 hover:border-green-600'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 font-bold">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.912.54 3.704 1.476 5.23L2 22l4.908-1.28c1.472.8 3.14 1.284 4.936 1.284 5.52 0 10-4.48 10-10.004C21.844 6.48 17.524 2 12.004 2z" fill="#25D366"/>
                                <path d="M8.7 7.15c-.23-.5-.47-.5-.69-.5h-.58c-.2 0-.52.08-.8.38-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.2 3.08c.15.2 2.09 3.2 5.07 4.49.7.3 1.26.49 1.68.62.7.22 1.34.19 1.84.11.57-.08 1.74-.71 1.98-1.4.24-.68.24-1.27.17-1.4-.07-.12-.27-.2-.58-.35s-1.84-.9-2.12-1-.54-.15-.77.19c-.23.34-.89 1.1-.1 1.1.2 1.22.4 1.45.68 1.6.28.15.6.23.92.15.42-.1.7.07 1.01-.08s.1-.3.02-.45c-.07-.15-.7-1.72-.96-2.35-.25-.62-.5-.54-.69-.55l-.59-.01c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.44s1.05 2.84 1.2 3.05c.14.2 2.06 3.15 5 4.42.7.3 1.24.48 1.66.61.7.22 1.32.19 1.81.11.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.27-.2-.57-.35z" fill="white"/>
                              </svg>
                              {c.etiqueta}
                            </span>
                            <span className="font-mono text-[9px] opacity-80">{formatearNumeroDisplay(c.telefono)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {!clienteSeleccionado && (
                    <div className="text-[10px] text-gray-400 italic mb-1">[Selecciona un abonado de la lista, o ingresa un número manual abajo]</div>
                  )}

                  {/* Campo manual (SIEMPRE visible, soporta +) */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-gray-700 shrink-0">Número manual:</span>
                    <input
                      type="text"
                      placeholder="+56912345678  ó  56912345678  ó  912345678"
                      className={`flex-1 bg-white border px-2 py-1 text-xs font-mono text-black font-bold focus:outline-none focus:border-blue-700 ${telefonoManual ? 'border-blue-500 bg-blue-50' : 'border-gray-500'}`}
                      value={telefonoManual}
                      onChange={e => {
                        // Permite +, dígitos y espacios
                        const v = e.target.value.replace(/[^0-9+\s\-()]/g, '')
                        setTelefonoManual(v)
                        if (v) setTelefonoDestino('')
                      }}
                    />
                    {telefonoManual && (
                      <span className="text-[9px] text-blue-700 font-bold shrink-0">
                        → {formatearNumeroDisplay(normalizarTelefono(telefonoManual))}
                      </span>
                    )}
                  </div>
                  {(telefonoManual || telefonoDestino) && (
                    <div className="text-[9px] text-green-700 font-bold mt-1">
                      ✓ DESTINO ACTIVO: {formatearNumeroDisplay(normalizarTelefono(telefonoManual || telefonoDestino))}
                    </div>
                  )}
                </div>

                {/* PASO 2: Plantillas */}
                <div className="shrink-0">
                  <div className="text-[10px] font-bold text-gray-700 mb-1">2. PLANTILLA RÁPIDA:</div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { tipo: 'intrusión', color: 'bg-red-700', label: '🚨 ROBO/INTRUSIÓN' },
                      { tipo: 'energia',   color: 'bg-yellow-600', label: '⚡ CORTE ENERGÍA' },
                      { tipo: 'apertura',  color: 'bg-blue-700', label: '🔓 APERTURA' },
                      { tipo: 'cierre',    color: 'bg-blue-900', label: '🔒 CIERRE' },
                      { tipo: 'video',     color: 'bg-green-800', label: '📹 VIDEO' },
                      { tipo: 'panico',    color: 'bg-orange-700', label: '🆘 PÁNICO' },
                    ].map(p => (
                      <button
                        key={p.tipo}
                        onClick={() => aplicarPlantilla(p.tipo)}
                        className={`${p.color} text-white text-[9px] font-bold px-2 py-1 rounded hover:opacity-80 cursor-pointer`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PASO 3: Mensaje */}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-[10px] font-bold text-gray-700">3. MENSAJE A ENVIAR:</div>
                  <div className="bg-blue-950 text-blue-200 px-2 py-0.5 text-[10px] font-bold font-mono rounded-t border border-blue-900">
                    🔒 PRE-TEXTO: GAMA SEGURIDAD INFORMA:
                  </div>
                  <textarea
                    rows={5}
                    placeholder="Redacta el cuerpo de la notificación..."
                    className="w-full bg-white border border-gray-500 p-2 text-xs text-black font-mono focus:outline-none focus:border-blue-700 rounded-b resize-none flex-1"
                    value={textoNotif}
                    onChange={e => setTextoNotif(e.target.value)}
                  />
                </div>

                {/* Botón Enviar */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-400 shrink-0">
                  <span className={`text-[11px] font-bold truncate max-w-xs ${statusNotif.startsWith('✅') ? 'text-green-700' : statusNotif.startsWith('❌') ? 'text-red-700' : 'text-blue-900'}`}>
                    {statusNotif}
                  </span>
                  <button
                    onClick={enviarNotificacion}
                    disabled={enviandoNotif || (!telefonoManual && !telefonoDestino) || !textoNotif.trim()}
                    className="bg-[#25D366] text-white font-bold text-[10px] px-4 py-2 rounded border border-green-700 hover:bg-[#20ba5a] disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    {enviandoNotif ? '⌛ Enviando...' : '📢 ENVIAR WHATSAPP'}
                  </button>
                </div>
              </div>

              {/* Columna Derecha: Historial */}
              <div className="w-64 border-2 border-gray-700 bg-[#0b141a] text-white flex flex-col font-mono shrink-0">
                <div className="p-2 border-b border-gray-800 bg-[#1f2c34] flex justify-between items-center">
                  <span className="text-[10px] font-bold text-green-400 uppercase">💬 HISTORIAL</span>
                  <span className="text-[9px] bg-green-900 text-green-200 px-1.5 py-0.5 rounded font-bold">{chatLogs.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 text-[10px]">
                  {chatLogs.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-500 italic text-center text-[10px] p-4">
                      Los envíos aparecerán aquí
                    </div>
                  )}
                  {chatLogs.map(log => (
                    <div
                      key={log.id}
                      className={`p-1.5 rounded border ${log.esRespuestaCliente ? 'bg-[#202c33] border-l-4 border-l-blue-400 text-blue-100' : log.exito ? 'bg-[#005c4b] border-green-700 text-white' : 'bg-red-950 border-red-700 text-red-200'}`}
                    >
                      <div className="flex justify-between items-center border-b border-white/20 pb-0.5 mb-0.5 font-bold text-[9px]">
                        <span>{log.esRespuestaCliente ? '📩 RESP.CLIENTE' : `CTA: ${log.cuenta}`}</span>
                        <span>{log.fecha}</span>
                      </div>
                      <div className="text-[9px] opacity-80 mb-0.5 font-mono">{log.esRespuestaCliente ? `De: ${formatearNumeroDisplay(log.telefono)}` : `→ ${formatearNumeroDisplay(log.telefono)}`}</div>
                      <div className="break-words leading-tight font-sans">{log.texto.slice(0, 80)}{log.texto.length > 80 ? '…' : ''}</div>
                      <div className="text-right text-[8px] italic opacity-70 mt-0.5">
                        {log.esRespuestaCliente ? '👤 Recibido' : log.exito ? '✓✓ Enviado' : `❌ ${log.errorMsg}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              TAB 3: CONFIGURACIÓN
          ══════════════════════════════════════════ */}
          {activeTab === 'config' && (
            <div className="p-3 flex gap-3 h-full bg-[#c0c0c0] overflow-hidden">
              {/* Lista */}
              <div className="w-64 border-2 border-gray-700 bg-black text-green-400 flex flex-col font-mono text-[11px] shrink-0">
                <div className="p-1 border-b border-gray-700 bg-gray-900 shrink-0">
                  <input type="text" placeholder="BUSCAR ABONADO..." className="w-full bg-black text-green-400 border border-green-800 px-2 py-1 focus:outline-none text-[10px]" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-800 text-green-200"><th className="p-1 border-b border-gray-700 w-14">CTA</th><th className="p-1 border-b border-gray-700">NOMBRE</th></tr></thead>
                    <tbody className="divide-y divide-gray-900">
                      {clientesFiltrados.map(([cuenta, datos]) => (
                        <tr key={cuenta} className={`cursor-pointer hover:bg-green-900/60 ${clienteSeleccionado?.cuenta === cuenta ? 'bg-green-900 text-white font-bold' : ''}`} onClick={() => setClienteSeleccionado({ cuenta, nombre: datos.nombre || '' })}>
                          <td className="p-1 border-r border-gray-800 font-bold">{cuenta}</td>
                          <td className="p-1 truncate max-w-[150px] text-[10px]">{datos.nombre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Config detallada */}
              <div className="flex-1 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e0e0e0] flex flex-col p-3 overflow-y-auto text-black">
                <div className="text-[#000080] font-bold text-xs border-b border-gray-400 pb-1 mb-3">CONFIGURACIÓN DE NOTIFICACIONES POR ABONADO</div>
                {!clienteSeleccionado ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 font-bold text-xs text-center">
                    Selecciona un abonado de la lista izquierda
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="bg-white border border-gray-400 p-2 text-xs font-bold text-blue-900">{clienteSeleccionado.cuenta} — {clienteSeleccionado.nombre}</div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-800 mb-1">Teléfono Principal WhatsApp (con código país):</div>
                      <input type="tel" className="w-full border border-gray-500 px-2 py-1 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-600" placeholder="+56912345678" value={telefono} onChange={e => setTelefono(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold text-gray-800">Notificaciones activas:</label>
                      <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} className="accent-[#000080]" />
                      {silenciaHasta && new Date(silenciaHasta) > new Date() && (
                        <span className="text-[10px] text-orange-600 font-bold ml-2">SILENCIADO HASTA {new Date(silenciaHasta).toLocaleTimeString()}</span>
                      )}
                    </div>
                    <div className="border-t border-gray-400 pt-2">
                      <div className="text-[10px] font-bold text-gray-800 mb-1">Eventos a Notificar:</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {[
                          { label: '🚨 Alarmas', val: notificarAlarma, set: setNotificarAlarma, color: 'accent-red-600' },
                          { label: '⚡ Corte Energía', val: notificarEnergia, set: setNotificarEnergia, color: 'accent-yellow-600' },
                          { label: '🔓 Apertura', val: notificarApertura, set: setNotificarApertura, color: 'accent-blue-600' },
                          { label: '🔒 Cierre', val: notificarCierre, set: setNotificarCierre, color: 'accent-blue-600' },
                        ].map(({ label, val, set, color }) => (
                          <label key={label} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                            <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className={color} />
                            <span className="font-bold text-gray-700">{label}</span>
                          </label>
                        ))}
                        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer col-span-2 mt-1 border-t border-dashed border-gray-300 pt-1">
                          <input type="checkbox" checked={notificarVideo} onChange={e => setNotificarVideo(e.target.checked)} className="accent-green-600" />
                          <span className="font-bold text-green-700">🎥 Video-Verificación Automática</span>
                        </label>
                      </div>
                    </div>
                    <div className="border-t border-gray-400 pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-gray-800">Contactos de Escalamiento:</span>
                        <button onClick={() => setContactos([...contactos, { nombre: '', telefono: '', parentesco: '' }])} className="text-xs text-[#000080] font-bold hover:underline cursor-pointer">+ Agregar</button>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {contactos.map((c, i) => (
                          <div key={i} className="bg-white border border-gray-400 p-1 text-[10px]">
                            <div className="flex gap-1 mb-1">
                              <input className="flex-1 border border-gray-300 px-1 py-0.5 text-gray-800" placeholder="Nombre" value={c.nombre} onChange={e => { const copia = [...contactos]; copia[i] = { ...copia[i], nombre: e.target.value }; setContactos(copia) }} />
                              <button onClick={() => setContactos(contactos.filter((_, idx) => idx !== i))} className="text-red-600 font-bold px-1 cursor-pointer">✕</button>
                            </div>
                            <div className="flex gap-1">
                              <input className="flex-1 border border-gray-300 px-1 py-0.5 text-gray-800 font-mono" placeholder="+56912345678" value={c.telefono} onChange={e => { const copia = [...contactos]; copia[i] = { ...copia[i], telefono: e.target.value }; setContactos(copia) }} />
                              <input className="w-20 border border-gray-300 px-1 py-0.5 text-gray-800" placeholder="Parent." value={c.parentesco} onChange={e => { const copia = [...contactos]; copia[i] = { ...copia[i], parentesco: e.target.value }; setContactos(copia) }} />
                            </div>
                          </div>
                        ))}
                        {contactos.length === 0 && <div className="text-gray-400 italic text-[10px] text-center py-2">Sin contactos de escalamiento</div>}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-between items-center mt-2 border-t border-gray-400 pt-2">
                      <span className="text-[11px] font-bold text-[#000080]">{guardando ? 'Guardando...' : mensajeConfig}</span>
                      <button onClick={guardarConfig} className="bg-[#c0c0c0] text-[11px] font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-4 py-1.5 hover:bg-[#d0d0d0] cursor-pointer">GUARDAR EN BD</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              TAB 4: ESTADO DEL SERVIDOR
          ══════════════════════════════════════════ */}
          {activeTab === 'servidor' && (
            <div className="h-full overflow-y-auto bg-[#0f172a] p-4 flex gap-4 text-white font-sans">

              {/* Card principal */}
              <div className="flex-1 flex flex-col gap-4">

                {/* Estado */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-white">🛡️ WhatsApp Corporativo Gama v3.0</h2>
                      <p className="text-xs text-[#94a3b8] mt-0.5">Puerto 3015 — Motor Baileys (sin Chromium)</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: statusColor, color: '#000' }}>
                        {waStatus.ready ? '✅ CONECTADO' : waStatus.estado}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Usuario', val: waStatus.usuario || '—' },
                      { label: 'Uptime', val: waStatus.uptime ? `${Math.round(waStatus.uptime / 60)} min` : '—' },
                      { label: 'Cola', val: String(waStatus.cola || 0) + ' msg' },
                      { label: 'Reintentos', val: String(waStatus.reintentos || 0) },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-[#0f172a] rounded-lg p-3 text-center border border-[#1e293b]">
                        <div className="text-[10px] text-[#64748b] mb-1 uppercase tracking-wide">{label}</div>
                        <div className="text-sm font-bold text-white truncate">{val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={logout}
                      disabled={loadingLogout}
                      className="text-xs bg-red-900 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-bold cursor-pointer disabled:opacity-50 border border-red-700"
                    >
                      {loadingLogout ? '⏳ Cerrando...' : '🔴 Cerrar Sesión'}
                    </button>
                    <button
                      onClick={() => { setWaStatus(prev => ({ ...prev })) }}
                      className="text-xs bg-[#334155] hover:bg-[#475569] text-white px-4 py-1.5 rounded-lg font-bold cursor-pointer border border-[#475569]"
                    >
                      🔄 Actualizar Estado
                    </button>
                  </div>

                  {serverMsg && (
                    <div className="mt-3 text-xs font-bold p-2 rounded bg-[#0f172a] border border-[#334155] text-[#94a3b8]">{serverMsg}</div>
                  )}
                </div>

                {/* QR / Pairing Code */}
                {!waStatus.ready && (
                  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
                    <h3 className="text-sm font-bold text-white mb-3">📲 Vincular WhatsApp</h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* QR */}
                      <div>
                        <div className="text-xs font-bold text-[#94a3b8] mb-2">Opción A: Escanear QR</div>
                        {qrData.qrImage ? (
                          <div className="bg-white p-3 rounded-xl inline-block">
                            <img src={qrData.qrImage} alt="QR WhatsApp" width={200} height={200} />
                          </div>
                        ) : (
                          <div className="bg-[#0f172a] border border-[#334155] rounded-xl w-[216px] h-[216px] flex items-center justify-center text-center text-[#64748b] text-xs">
                            {qrData.status === 'connected' ? '✅ Ya conectado' : '⏳ Generando QR...'}
                          </div>
                        )}
                        <p className="text-[10px] text-[#64748b] mt-2">Abre WhatsApp → Dispositivos Vinculados → Escanear QR</p>
                      </div>

                      {/* Pairing Code */}
                      <div>
                        <div className="text-xs font-bold text-[#94a3b8] mb-2">Opción B: Código de Vinculación</div>
                        <div className="text-[10px] text-[#64748b] mb-2">Sin necesidad de cámara. Ingresa tu número y copia el código en WhatsApp.</div>

                        <div className="flex gap-1 mb-2">
                          <input
                            type="tel"
                            value={pairingInput}
                            onChange={e => setPairingInput(e.target.value.replace(/[^0-9+]/g, ''))}
                            placeholder="+56948855190"
                            className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#38bdf8]"
                          />
                          <button
                            onClick={solicitarPairingCode}
                            disabled={loadingPair}
                            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs px-3 py-2 rounded-lg font-bold cursor-pointer disabled:opacity-50"
                          >
                            {loadingPair ? '⏳' : '🔑 Obtener'}
                          </button>
                        </div>

                        {pairingCode && (
                          <div className="bg-[#0f172a] border-2 border-[#0ea5e9] rounded-xl p-4 text-center">
                            <div className="text-[10px] text-[#94a3b8] mb-1">Ingresa este código en WhatsApp:</div>
                            <div className="text-3xl font-black text-[#0ea5e9] tracking-[0.3em] font-mono">{pairingCode}</div>
                            <div className="text-[9px] text-[#64748b] mt-2">WhatsApp → Dispositivos Vinculados → Vincular con número → Ingresa el código</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conectado */}
                {waStatus.ready && (
                  <div className="bg-[#052e16] border border-[#166534] rounded-xl p-4 text-center">
                    <div className="text-5xl mb-3">✅</div>
                    <div className="text-lg font-bold text-[#4ade80]">WhatsApp Corporativo Activo</div>
                    <div className="text-sm text-[#86efac] mt-1">{waStatus.usuario}</div>
                    <div className="text-xs text-[#4ade80]/70 mt-2">Mensajes siendo procesados en tiempo real · Canal Supabase activo</div>
                  </div>
                )}
              </div>

              {/* Info lateral */}
              <div className="w-56 flex flex-col gap-3">
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-3">
                  <div className="text-xs font-bold text-[#94a3b8] mb-2 uppercase tracking-wide">ℹ️ Información</div>
                  <div className="space-y-2 text-[11px] text-[#64748b]">
                    <div><span className="text-white font-bold">Motor:</span> Baileys WebSocket</div>
                    <div><span className="text-white font-bold">RAM:</span> ~50MB (sin Chrome)</div>
                    <div><span className="text-white font-bold">Puerto:</span> 3015</div>
                    <div><span className="text-white font-bold">Reconexión:</span> Automática</div>
                    <div><span className="text-white font-bold">Cola:</span> {waStatus.cola} mensajes</div>
                  </div>
                </div>
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-3">
                  <div className="text-xs font-bold text-[#f59e0b] mb-2">⚠️ Instrucciones Scorpion</div>
                  <div className="text-[10px] text-[#64748b] leading-relaxed space-y-1">
                    <p>1. Copia <code className="text-[#94a3b8]">WHATSAPP_SERVER/</code> al PC Scorpion</p>
                    <p>2. Ejecuta <code className="text-[#94a3b8]">1_INSTALAR.bat</code></p>
                    <p>3. Ejecuta <code className="text-[#94a3b8]">INICIAR_WHATSAPP.bat</code></p>
                    <p>4. Escanea QR o usa Pairing Code</p>
                    <p>5. Configura <code className="text-[#94a3b8]">AUTOSTART_WINDOWS.bat</code></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
