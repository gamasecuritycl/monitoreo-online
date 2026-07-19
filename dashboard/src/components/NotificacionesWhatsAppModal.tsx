import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendMessage } from '@/lib/whatsapp'

interface Props {
  onClose: () => void
  clientesMap: Record<string, Record<string, string>>
  cuentaInicial?: string
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

type Tab = 'manual' | 'config' | 'alertas' | 'panico' | 'energia'

export default function NotificacionesWhatsAppModal({ onClose, clientesMap, cuentaInicial }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('manual')
  const [busqueda, setBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{ cuenta: string; nombre: string } | null>(() => {
    if (cuentaInicial && clientesMap[cuentaInicial]) {
      return { cuenta: cuentaInicial, nombre: clientesMap[cuentaInicial].nombre || '' }
    }
    return null
  })

  // Estados de Configuración
  const [telefono, setTelefono] = useState('')
  const [activo, setActivo] = useState(true)
  const [contactos, setContactos] = useState<ContactoEscalamiento[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [silenciaHasta, setSilenciaHasta] = useState('')
  const [notificarAlarma, setNotificarAlarma] = useState(true)
  const [notificarEnergia, setNotificarEnergia] = useState(true)
  const [notificarApertura, setNotificarApertura] = useState(false)
  const [notificarCierre, setNotificarCierre] = useState(false)
  const [notificarVideo, setNotificarVideo] = useState(false)

  // Estados del Panel de Envíos Manuales & Chat
  const [telefonoEnvio, setTelefonoEnvio] = useState('')
  const [textoMensaje, setTextoMensaje] = useState('')
  const [enviandoManual, setEnviandoManual] = useState(false)
  const [mensajeStatus, setMensajeStatus] = useState('')
  const [chatLogs, setChatLogs] = useState<ChatLogItem[]>([])

  const clientesFiltrados = Object.entries(clientesMap)
    .filter(([cuenta, datos]) => {
      const b = busqueda.toLowerCase().trim()
      if (!b) return true
      return cuenta.toLowerCase().includes(b) || (datos.nombre || '').toLowerCase().includes(b)
    })
    .slice(0, 50)

  // Extraer lista de contactos autorizados de un abonado
  const obtenerListaContactos = (cuenta: string) => {
    const datos = clientesMap[cuenta]
    const lista: { etiqueta: string; telefono: string; nombre: string }[] = []
    if (!datos) return lista

    // Teléfono principal
    const telPrincipal = datos.t1 || datos.telefono1 || datos.telefono || ''
    if (telPrincipal) {
      lista.push({
        etiqueta: `Principal (${datos.nombre1 || 'Titular'})`,
        telefono: telPrincipal,
        nombre: datos.nombre1 || 'Titular'
      })
    }

    // Contactos secundarios (2 al 7)
    for (let i = 2; i <= 7; i++) {
      const nom = datos[`nombre${i}`]
      const tel = datos[`t${i}`] || datos[`telefono${i}`]
      if (tel) {
        lista.push({
          etiqueta: `Contacto ${i}: ${nom || 'Autorizado'}`,
          telefono: tel,
          nombre: nom || `Contacto ${i}`
        })
      }
    }

    // Contactos de escalamiento guardados
    contactos.forEach((c, idx) => {
      if (c.telefono && !lista.some(l => l.telefono === c.telefono)) {
        lista.push({
          etiqueta: `Escalamiento ${idx + 1}: ${c.nombre || 'Contacto'}`,
          telefono: c.telefono,
          nombre: c.nombre || `Escalamiento ${idx + 1}`
        })
      }
    })

    return lista
  }

  useEffect(() => {
    if (!clienteSeleccionado) {
      setTelefono('')
      setTelefonoEnvio('')
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
        setTelefonoEnvio(data.telefono || '')
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
        setTelefonoEnvio(telSugerido)
        setActivo(true)
        setContactos([])
        setSilenciaHasta('')
        setNotificarAlarma(true)
        setNotificarEnergia(true)
        setNotificarApertura(false)
        setNotificarCierre(false)
        setNotificarVideo(false)
      }
    }
    cargar()

    // Cargar historial de conversaciones guardadas en Supabase
    const cargarHistorialBD = async () => {
      try {
        const { data } = await supabase
          .from('conversaciones_whatsapp')
          .select('*')
          .or(`cuenta.eq.${clienteSeleccionado.cuenta},numero.eq.${(telefonoEnvio || telefono).replace(/[^0-9]/g, '')}`)
          .order('created_at', { ascending: false })
          .limit(30)

        if (data && data.length > 0) {
          const items: ChatLogItem[] = []
          data.forEach((row: any) => {
            if (row.mensaje_enviado) {
              items.push({
                id: Math.random(),
                cuenta: row.cuenta || clienteSeleccionado.cuenta,
                telefono: row.numero || '',
                texto: row.mensaje_enviado,
                fecha: new Date(row.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
                exito: true,
                esRespuestaCliente: false
              })
            }
            if (row.respuesta_recibida || row.respuesta_cliente) {
              items.push({
                id: Math.random(),
                cuenta: row.cuenta || clienteSeleccionado.cuenta,
                telefono: row.numero || '',
                texto: row.respuesta_recibida || row.respuesta_cliente,
                fecha: row.responded_at ? new Date(row.responded_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : new Date(row.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
                exito: true,
                esRespuestaCliente: true
              })
            }
          })
          setChatLogs(items)
        }
      } catch (err) {
        console.warn('[WHATSAPP BD CHARLA ERROR]:', err)
      }
    }
    cargarHistorialBD()

    // Suscripción Realtime a mensajes entrantes del cliente
    const channel = supabase
      .channel(`chat_realtime_${clienteSeleccionado.cuenta}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversaciones_whatsapp' },
        (payload: any) => {
          const row = payload.new
          if (row) {
            const esCliente = !!(row.respuesta_recibida || row.respuesta_cliente)
            const nuevoItem: ChatLogItem = {
              id: Date.now(),
              cuenta: row.cuenta || clienteSeleccionado.cuenta,
              telefono: row.numero || '',
              texto: esCliente ? (row.respuesta_recibida || row.respuesta_cliente) : (row.mensaje_enviado || ''),
              fecha: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
              exito: true,
              esRespuestaCliente: esCliente
            }
            setChatLogs(prev => [nuevoItem, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clienteSeleccionado, clientesMap, telefono, telefonoEnvio])

  // Función para auto-guardar abonado en Supabase si no estaba creado
  const autoGuardarSiNoExiste = async (cuenta: string, telLimpio: string) => {
    try {
      const { data } = await supabase
        .from('notificaciones_whatsapp')
        .select('id')
        .eq('cuenta', cuenta)
        .limit(1)

      if (!data || data.length === 0) {
        await supabase.from('notificaciones_whatsapp').insert({
          cuenta,
          telefono: telLimpio,
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        console.log(`[WHATSAPP] Auto-guardado exitoso para abonado ${cuenta} con teléfono ${telLimpio}`)
      }
    } catch (err) {
      console.warn('[WHATSAPP] Error en auto-guardado:', err)
    }
  }

  // Handler para guardar manualmente
  const guardar = async () => {
    if (!clienteSeleccionado) return
    const telLimpio = telefono.replace(/[^0-9]/g, '')
    if (!telLimpio) { setMensaje('Debe ingresar un teléfono válido'); return }
    setGuardando(true)
    setMensaje('')
    try {
      const payload: any = {
        cuenta: clienteSeleccionado.cuenta,
        telefono: telLimpio,
        activo,
        contactos_escalamiento: contactos,
        silencio_hasta: null,
        updated_at: new Date().toISOString(),
      }
      try {
        payload.notificar_alarma = notificarAlarma
        payload.notificar_energia = notificarEnergia
        payload.notificar_apertura = notificarApertura
        payload.notificar_cierre = notificarCierre
        payload.notificar_video = notificarVideo
        const { error } = await supabase.from('notificaciones_whatsapp').upsert(payload, { onConflict: 'cuenta' })
        if (error) throw error
      } catch {
        delete payload.notificar_alarma
        delete payload.notificar_energia
        delete payload.notificar_apertura
        delete payload.notificar_cierre
        delete payload.notificar_video
        const { error } = await supabase.from('notificaciones_whatsapp').upsert(payload, { onConflict: 'cuenta' })
        if (error) throw error
      }
      setMensaje('✅ Guardado OK')
      setTimeout(() => setMensaje(''), 3000)
    } catch (err: any) {
      setMensaje('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const agregarContacto = () => setContactos([...contactos, { nombre: '', telefono: '', parentesco: '' }])
  const actualizarContacto = (i: number, campo: keyof ContactoEscalamiento, valor: string) => {
    const copia = [...contactos]; copia[i] = { ...copia[i], [campo]: valor }; setContactos(copia)
  }
  const eliminarContacto = (i: number) => setContactos(contactos.filter((_, idx) => idx !== i))

  // Función para enviar mensaje manual por WhatsApp (Notificación o Chat Directo)
  const enviarMensajeManual = async (esChatDirecto: boolean = false) => {
    if (!clienteSeleccionado) {
      alert('Por favor seleccione un abonado en la lista izquierda primero.')
      return
    }
    if (!telefonoEnvio) {
      alert('Por favor ingrese un número de teléfono de destino.')
      return
    }

    let telLimpio = telefonoEnvio.replace(/[^0-9]/g, '')
    if (telLimpio.length === 9 && telLimpio.startsWith('9')) {
      telLimpio = '56' + telLimpio
    } else if (telLimpio.length === 8) {
      telLimpio = '569' + telLimpio
    }

    if (!telLimpio || telLimpio.length < 8) {
      alert('Debe ingresar un teléfono válido (ej: +56991016912).')
      return
    }

    let mensajeFinal = textoMensaje.trim()
    if (!mensajeFinal) {
      alert('Ingrese el cuerpo del mensaje antes de enviar.')
      return
    }

    if (!esChatDirecto) {
      const preTexto = 'GAMA SEGURIDAD INFORMA: '
      if (!mensajeFinal.toUpperCase().startsWith('GAMA SEGURIDAD INFORMA:')) {
        mensajeFinal = `${preTexto}${mensajeFinal}`
      }
      const notaNoResponder = '\n\n🚫 *Por favor, NO responder a este mensaje. Es una notificación automática.*'
      if (!mensajeFinal.includes('NO responder')) {
        mensajeFinal = `${mensajeFinal}${notaNoResponder}`
      }
    }

    setEnviandoManual(true)
    setMensajeStatus('Enviando mensaje...')

    try {
      // 1. Enviar mensaje por API de WhatsApp
      const resultado = await sendMessage(telLimpio, mensajeFinal)

      // 2. Auto-guardar abonado si no estaba en la base de datos
      await autoGuardarSiNoExiste(clienteSeleccionado.cuenta, telLimpio)

      // 3. Agregar mensaje al historial de chat
      const logItem: ChatLogItem = {
        id: Date.now(),
        cuenta: clienteSeleccionado.cuenta,
        telefono: telLimpio,
        texto: mensajeFinal,
        fecha: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        exito: resultado.ok,
        errorMsg: resultado.ok ? null : (resultado.debug || 'Error al enviar')
      }

      setChatLogs(prev => [logItem, ...prev])
      setMensajeStatus(resultado.ok ? '✅ ¡Mensaje enviado y registrado!' : '❌ Error: ' + (resultado.debug || ''))

      if (resultado.ok) {
        setTextoMensaje('')
      }
    } catch (err: any) {
      setMensajeStatus('❌ Error al enviar mensaje: ' + err.message)
    } finally {
      setEnviandoManual(false)
      setTimeout(() => setMensajeStatus(''), 4000)
    }
  }

  // Plantillas rápidas de emergencias
  const aplicarPlantilla = (tipo: string) => {
    if (!clienteSeleccionado) return
    const cuenta = clienteSeleccionado.cuenta
    const plantillas: Record<string, string> = {
      intrusión: `Se ha detectado una ALARMA DE ROBO / INTRUSIÓN en su propiedad (Cuenta: ${cuenta}). Por favor confirmar estado urgentemente.`,
      energia: `Se registra CORTE DE ENERGÍA ELÉCTRICA en su propiedad (Cuenta: ${cuenta}). Su sistema opera con batería de respaldo.`,
      apertura: `Se ha registrado una APERTURA no programada fuera de horario (Cuenta: ${cuenta}). Confirmar si es personal autorizado.`,
      cierre: `Confirmación de CIERRE DE INSTALACIÓN recibido correctamente (Cuenta: ${cuenta}). Sistema armado.`,
      video: `Transmisión de video-verificación en vivo activada para la propiedad (Cuenta: ${cuenta}).`
    }
    setTextoMensaje(plantillas[tipo] || '')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'manual', label: '💬 Chats & Conversaciones (App PC)' },
    { id: 'config', label: '⚙️ Notificaciones Automáticas & Fichas' },
    { id: 'alertas', label: '🚨 Reglas por Tipo de Evento' },
  ]

  const listaContactosAutorizados = clienteSeleccionado ? obtenerListaContactos(clienteSeleccionado.cuenta) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-sm tracking-wide flex items-center gap-2">
            <span>💬</span>
            <span>CENTRO DE MENSAJERÍA Y CHAT WHATSAPP - GAMA SEGURIDAD</span>
          </div>
          <button onClick={onClose} className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] cursor-pointer">X</button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-gray-600 shrink-0 bg-[#b0b0b0]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'bg-white text-[#000080] border-t-2 border-t-[#000080] border-x border-x-gray-400'
                  : 'bg-[#a0a0a0] text-black hover:bg-[#c0c0c0] border-x border-x-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-hidden">
          
          {/* ═══ TAB 1: CHATS Y CONVERSACIONES (WHATSAPP WEB PC APP STYLE) ═══ */}
          {activeTab === 'manual' && (
            <div className="flex h-[520px] bg-[#111b21] text-white overflow-hidden">
              
              {/* Columna Izquierda: Lista de Chats y Contactos (Estilo WhatsApp PC) */}
              <div className="w-80 border-r border-[#222d34] bg-[#111b21] flex flex-col shrink-0 font-sans">
                {/* Header de Lista de Chats */}
                <div className="p-3 bg-[#202c33] border-b border-[#222d34] flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-white text-xs shadow">
                      GS
                    </div>
                    <span className="font-bold text-xs text-white">CHATS Y CONVERSACIONES</span>
                  </div>
                  <span className="text-[10px] bg-[#00a884] text-black px-2 py-0.5 rounded-full font-bold">OFICIAL</span>
                </div>

                {/* Buscador de Chats */}
                <div className="p-2 bg-[#111b21] border-b border-[#222d34]">
                  <input
                    type="text"
                    placeholder="🔍 Buscar o iniciar un nuevo chat..."
                    className="w-full bg-[#202c33] text-gray-200 border border-[#2a3942] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#00a884]"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>

                {/* Lista de Conversaciones por Abonado */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]">
                  {clientesFiltrados.map(([cuenta, datos]) => {
                    const esSeleccionado = clienteSeleccionado?.cuenta === cuenta
                    return (
                      <div
                        key={cuenta}
                        onClick={() => setClienteSeleccionado({ cuenta, nombre: datos.nombre || '' })}
                        className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                          esSeleccionado ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-[#005c4b] border border-[#00a884] flex items-center justify-center font-bold text-white text-xs shrink-0 shadow">
                          {cuenta.slice(-2)}
                        </div>

                        {/* Info Contacto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="font-bold text-xs text-white truncate max-w-[130px]">
                              {datos.nombre || `Abonado ${cuenta}`}
                            </span>
                            <span className="text-[9px] text-[#8696a0] font-mono">CTA: {cuenta}</span>
                          </div>
                          <div className="text-[10px] text-[#8696a0] truncate font-sans">
                            {datos.t1 || datos.telefono1 || datos.telefono || 'Sin teléfono guardado'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Columna Derecha: Lienzo del Chat Activo (WhatsApp Web Style) */}
              <div className="flex-1 flex flex-col bg-[#0b141a] relative">
                
                {!clienteSeleccionado ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#8696a0] p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#202c33] flex items-center justify-center text-2xl mb-3">💬</div>
                    <span className="font-bold text-sm text-white mb-1">GAMA SEGURIDAD - WHATSAPP COMMAND CENTER</span>
                    <span className="text-xs">Selecciona un abonado o conversación de la lista izquierda para interactuar en tiempo real.</span>
                  </div>
                ) : (
                  <>
                    {/* Header del Chat Activo */}
                    <div className="p-2.5 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between shrink-0 shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-white text-xs">
                          {clienteSeleccionado.cuenta.slice(-2)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white">
                            {clienteSeleccionado.cuenta} - {clienteSeleccionado.nombre}
                          </div>
                          <div className="text-[10px] text-[#00a884] flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></span>
                            <span>WhatsApp Oficial Gama Seguridad Conectado</span>
                          </div>
                        </div>
                      </div>

                      {/* Contactos Autorizados del Abonado */}
                      <div className="flex items-center gap-1">
                        {listaContactosAutorizados.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => setTelefonoEnvio(c.telefono)}
                            className="bg-[#111b21] hover:bg-[#2a3942] border border-[#2a3942] text-[10px] text-gray-200 px-2 py-0.5 rounded font-mono"
                          >
                            📞 {c.nombre}: {c.telefono}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lienzo de Mensajes (Chat History) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a]">
                      {chatLogs.length > 0 ? (
                        chatLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`flex flex-col ${log.esRespuestaCliente ? 'items-start' : 'items-end'}`}
                          >
                            <div
                              className={`max-w-[75%] p-2.5 rounded-lg text-xs font-sans shadow-md break-words ${
                                log.esRespuestaCliente
                                  ? 'bg-[#202c33] text-white rounded-tl-none border-l-4 border-l-[#38bdf8]'
                                  : 'bg-[#005c4b] text-white rounded-tr-none'
                              }`}
                            >
                              <div className="text-[9px] font-bold opacity-75 mb-1 font-mono flex justify-between gap-4">
                                <span>{log.esRespuestaCliente ? `📩 CLIENTE (${log.telefono})` : `🛡️ GAMA SEGURIDAD`}</span>
                                <span>{log.fecha}</span>
                              </div>
                              <div className="leading-relaxed font-medium">{log.texto}</div>
                              <div className="text-[8px] text-right opacity-60 mt-1 italic">
                                {log.esRespuestaCliente ? 'Recibido en Central' : '✓✓ Entregado por WhatsApp Oficial'}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full text-[#8696a0] text-xs italic">
                          No hay mensajes previos en este chat. Escribe un mensaje abajo para iniciar la conversación.
                        </div>
                      )}
                    </div>

                    {/* Plantillas Rápidas de Emergencia */}
                    <div className="px-3 py-1.5 bg-[#111b21] border-t border-[#222d34] flex items-center gap-1 overflow-x-auto text-[10px]">
                      <span className="text-[#8696a0] font-bold shrink-0">PLANTILLAS RÁPIDAS:</span>
                      <button onClick={() => aplicarPlantilla('intrusión')} className="bg-red-800 hover:bg-red-700 text-white px-2 py-0.5 rounded shrink-0">🚨 INTRUSIÓN</button>
                      <button onClick={() => aplicarPlantilla('energia')} className="bg-amber-700 hover:bg-amber-600 text-white px-2 py-0.5 rounded shrink-0">⚡ CORTE ENERGÍA</button>
                      <button onClick={() => aplicarPlantilla('apertura')} className="bg-blue-800 hover:bg-blue-700 text-white px-2 py-0.5 rounded shrink-0">🔓 APERTURA</button>
                      <button onClick={() => aplicarPlantilla('cierre')} className="bg-indigo-800 hover:bg-indigo-700 text-white px-2 py-0.5 rounded shrink-0">🔒 CIERRE</button>
                    </div>

                    {/* Barra Inferior de Escribir Mensaje y Responder */}
                    <div className="p-3 bg-[#202c33] border-t border-[#222d34] flex flex-col gap-2 shrink-0">
                      
                      {/* Campo de Número Telefónico de Envío (Permite signo +) */}
                      <div className="flex items-center gap-2 bg-[#111b21] px-3 py-1 rounded border border-[#2a3942]">
                        <span className="text-[10px] text-[#8696a0] font-bold shrink-0">📱 DESTINATARIO:</span>
                        <input
                          type="text"
                          placeholder="+56991016912"
                          className="flex-1 bg-transparent text-xs text-white font-mono font-bold focus:outline-none"
                          value={telefonoEnvio}
                          onChange={(e) => setTelefonoEnvio(e.target.value.replace(/[^0-9+]/g, ''))}
                        />
                        <span className="text-[9px] text-gray-400 font-mono">Formato libre: +56 9 XXXXXXXX</span>
                      </div>

                      {/* Input de Mensaje de Texto */}
                      <div className="flex gap-2 items-center">
                        <textarea
                          rows={2}
                          placeholder="Escribe un mensaje de respuesta aquí..."
                          className="flex-1 bg-[#2a3942] text-white p-2 text-xs font-sans rounded-lg border border-[#374248] focus:outline-none focus:border-[#00a884] resize-none"
                          value={textoMensaje}
                          onChange={(e) => setTextoMensaje(e.target.value)}
                        />

                        {/* Botones de Envío */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => enviarMensajeManual(true)}
                            disabled={enviandoManual || !telefonoEnvio || !textoMensaje}
                            className="bg-[#00a884] hover:bg-[#029676] text-black font-bold text-xs px-4 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer shadow flex items-center justify-center gap-1"
                            title="Envía una respuesta directa en vivo sin pre-texto"
                          >
                            {enviandoManual ? <span>⌛ Enviando...</span> : <span>💬 RESPONDER</span>}
                          </button>

                          <button
                            onClick={() => enviarMensajeManual(false)}
                            disabled={enviandoManual || !telefonoEnvio || !textoMensaje}
                            className="bg-[#202c33] hover:bg-[#2a3942] text-white border border-gray-600 font-bold text-[9px] px-2 py-1 rounded disabled:opacity-50 cursor-pointer"
                            title="Envía con la cabecera fija Gama Seguridad Informa"
                          >
                            📢 NOTIFICACIÓN FORMAL
                          </button>
                        </div>
                      </div>

                      {mensajeStatus && (
                        <div className="text-[10px] font-bold text-[#00a884] font-mono">{mensajeStatus}</div>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>
          )}

          {/* ═══ TAB 2: CONFIGURACIÓN ═══ */}
          {activeTab === 'config' && (
            <div className="p-4 flex gap-4 h-[480px]">
              {/* Lista de clientes */}
              <div className="flex-1 border-2 border-gray-600 bg-black text-green-400 flex flex-col font-mono text-[11px]">
                <div className="p-1 border-b border-gray-700 bg-gray-900 shrink-0">
                  <input type="text" placeholder="BUSCAR ABONADO O CUENTA..."
                    className="w-full bg-black text-green-400 border border-green-800 px-2 py-1 focus:outline-none focus:border-green-400"
                    value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-800 text-green-200">
                      <th className="p-1 border-b border-gray-700 w-16">CTA</th>
                      <th className="p-1 border-b border-gray-700">NOMBRE ABONADO</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-800">
                      {clientesFiltrados.map(([cuenta, datos]) => (
                        <tr key={cuenta}
                          className={`cursor-pointer hover:bg-green-900 ${clienteSeleccionado?.cuenta === cuenta ? 'bg-green-800 text-white' : ''}`}
                          onClick={() => setClienteSeleccionado({ cuenta, nombre: datos.nombre || '' })}>
                          <td className="p-1 border-r border-gray-800 font-bold">{cuenta}</td>
                          <td className="p-1 truncate max-w-[200px]">{datos.nombre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Config del cliente */}
              <div className="w-96 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e0e0e0] flex flex-col p-3 overflow-y-auto text-black">
                <div className="text-[#000080] font-bold text-sm border-b border-gray-400 pb-1 mb-3">CONFIGURACIÓN BASE DE DATOS</div>
                {!clienteSeleccionado ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 font-bold text-xs text-center p-4">
                    SELECCIONE UN ABONADO EN LA LISTA IZQUIERDA
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 gap-3">
                    <div>
                      <div className="text-[10px] font-bold text-gray-800 mb-1">Abonado:</div>
                      <div className="bg-white border border-gray-400 px-2 py-1 font-bold text-xs text-gray-800 truncate">
                        {clienteSeleccionado.cuenta} - {clienteSeleccionado.nombre}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-800 mb-1">Teléfono Principal WhatsApp:</div>
                      <input type="tel" className="w-full border border-gray-500 px-2 text-xs py-1 text-gray-800 font-mono"
                        placeholder="+56912345678" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold text-gray-800">Notificaciones automáticas activas:</label>
                      <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="accent-[#000080]" />
                      {silenciaHasta && new Date(silenciaHasta) > new Date() && (
                        <span className="text-[10px] text-orange-600 font-bold ml-2">
                          SILENCIADO HASTA {new Date(silenciaHasta).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div className="border-t border-gray-400 pt-2">
                      <div className="text-[10px] font-bold text-gray-800 mb-1">Eventos a Notificar:</div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                          <input type="checkbox" checked={notificarAlarma} onChange={(e) => setNotificarAlarma(e.target.checked)} className="accent-red-600" />
                          <span className="text-red-700 font-bold">🚨 Alarmas</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                          <input type="checkbox" checked={notificarEnergia} onChange={(e) => setNotificarEnergia(e.target.checked)} className="accent-yellow-600" />
                          <span className="text-yellow-700 font-bold">⚡ Corte energía</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                          <input type="checkbox" checked={notificarApertura} onChange={(e) => setNotificarApertura(e.target.checked)} className="accent-blue-600" />
                          <span className="text-blue-700 font-bold">🔓 Apertura</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                          <input type="checkbox" checked={notificarCierre} onChange={(e) => setNotificarCierre(e.target.checked)} className="accent-blue-600" />
                          <span className="text-blue-700 font-bold">🔒 Cierre</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer col-span-2 mt-1 border-t border-dashed border-gray-300 pt-1">
                          <input type="checkbox" checked={notificarVideo} onChange={(e) => setNotificarVideo(e.target.checked)} className="accent-green-600" />
                          <span className="text-green-700 font-bold">🎥 Enviar Video-Verificación Automática</span>
                        </label>
                      </div>
                    </div>
                    <div className="border-t border-gray-400 pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-gray-800">Contactos de Escalamiento:</span>
                        <button onClick={agregarContacto} className="text-xs text-[#000080] font-bold hover:underline cursor-pointer">+ Agregar</button>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {contactos.map((c, i) => (
                          <div key={i} className="bg-white border border-gray-400 p-1 text-[10px]">
                            <div className="flex gap-1 mb-1">
                              <input className="flex-1 border border-gray-300 px-1 py-0.5 text-gray-800" placeholder="Nombre" value={c.nombre} onChange={(e) => actualizarContacto(i, 'nombre', e.target.value)} />
                              <button onClick={() => eliminarContacto(i)} className="text-red-600 font-bold px-1 cursor-pointer">X</button>
                            </div>
                            <div className="flex gap-1">
                              <input className="flex-1 border border-gray-300 px-1 py-0.5 text-gray-800 font-mono" placeholder="Teléfono" value={c.telefono} onChange={(e) => actualizarContacto(i, 'telefono', e.target.value)} />
                              <input className="w-16 border border-gray-300 px-1 py-0.5 text-gray-800" placeholder="Parent." value={c.parentesco} onChange={(e) => actualizarContacto(i, 'parentesco', e.target.value)} />
                            </div>
                          </div>
                        ))}
                        {contactos.length === 0 && <div className="text-gray-400 italic text-[10px] text-center py-2">Sin contactos de escalamiento</div>}
                      </div>
                    </div>
                    <div className="mt-auto flex gap-2 justify-between items-center h-8">
                      <div className="text-[11px] font-bold text-[#000080]">{guardando ? 'Guardando...' : mensaje}</div>
                      <div className="flex gap-1">
                        <button onClick={guardar}
                          className="bg-[#c0c0c0] text-[11px] font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 py-1 hover:bg-[#d0d0d0] cursor-pointer">GUARDAR BD</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB 3: ALERTAS ═══ */}
          {activeTab === 'alertas' && (
            <div className="p-4 overflow-y-auto h-[480px] text-xs text-black font-bold leading-relaxed">
              <div className="bg-[#e0e0e0] border border-gray-400 p-3 mb-3">
                <div className="text-[#000080] text-sm font-bold mb-2">COMO FUNCIONA</div>
                <p className="mb-2">Al detectarse una alarma en Scorpion, se envía WhatsApp automático al cliente registrado.</p>
                <p>El sistema analiza el patrón de eventos para determinar la severidad:</p>
              </div>
              <div className="bg-green-50 border border-green-300 p-3 mb-3">
                <div className="text-green-800 font-bold mb-1">INFORMATIVO (1 zona, 1 evento)</div>
                <p>Sola activación en una zona. Respuesta: AYUDA si necesita asistencia.</p>
              </div>
              <div className="bg-red-50 border border-red-300 p-3 mb-3">
                <div className="text-red-800 font-bold mb-1">CRÍTICO (múltiples zonas o eventos)</div>
                <p>2+ activaciones o múltiples zonas. Se informa: "SE DESPACHARÁ UNIDAD DE EMERGENCIA".</p>
              </div>
            </div>
          )}

          {/* ═══ TAB 4: PÁNICO ═══ */}
          {activeTab === 'panico' && (
            <div className="p-4 overflow-y-auto h-[480px] text-xs text-black font-bold leading-relaxed">
              <div className="bg-red-50 border-2 border-red-400 p-3 mb-3">
                <div className="text-red-800 text-sm font-bold mb-2">PROTOCOLO DE EMERGENCIA</div>
                <p>El cliente envía un mensaje de WhatsApp con cualquiera de estas palabras:</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="bg-red-600 text-white px-2 py-1 rounded">SOCORRO</span>
                  <span className="bg-red-600 text-white px-2 py-1 rounded">PÁNICO</span>
                  <span className="bg-red-600 text-white px-2 py-1 rounded">SOS</span>
                  <span className="bg-red-600 text-white px-2 py-1 rounded">EMERGENCIA</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 5: ENERGÍA ═══ */}
          {activeTab === 'energia' && (
            <div className="p-4 overflow-y-auto h-[480px] text-xs text-black font-bold leading-relaxed">
              <div className="bg-yellow-50 border-2 border-yellow-400 p-3 mb-3">
                <div className="text-yellow-800 text-sm font-bold mb-2">DETECCIÓN AUTOMÁTICA DE CORTE DE LUZ</div>
                <p>Al detectar FALLA DE ENERGÍA ELÉCTRICA en Scorpion, se envía WhatsApp automático al cliente.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
