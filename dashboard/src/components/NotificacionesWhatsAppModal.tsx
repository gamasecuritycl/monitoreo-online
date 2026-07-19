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
  }, [clienteSeleccionado, clientesMap])

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

  // Función para enviar mensaje manual por WhatsApp con pre-texto obligatorio
  const enviarMensajeManual = async () => {
    if (!clienteSeleccionado) {
      alert('Por favor seleccione un abonado en la lista izquierda primero.')
      return
    }
    if (!telefonoEnvio) {
      alert('Por favor ingrese un número de teléfono de destino.')
      return
    }

    const telLimpio = telefonoEnvio.replace(/[^0-9]/g, '')
    if (!telLimpio) {
      alert('Debe ingresar un teléfono válido.')
      return
    }

    const preTexto = 'GAMA SEGURIDAD INFORMA: '
    let mensajeFinal = textoMensaje.trim()
    if (!mensajeFinal) {
      alert('Ingrese el cuerpo del mensaje antes de enviar.')
      return
    }

    if (!mensajeFinal.toUpperCase().startsWith('GAMA SEGURIDAD INFORMA:')) {
      mensajeFinal = `${preTexto}${mensajeFinal}`
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
    { id: 'manual', label: '💬 Envío Manual & Chats' },
    { id: 'config', label: '⚙️ Configuración' },
    { id: 'alertas', label: '🚨 Alertas' },
    { id: 'panico', label: '🆘 Pánico' },
    { id: 'energia', label: '⚡ Energía' },
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
          
          {/* ═══ TAB 1: ENVÍO MANUAL & CHATS ═══ */}
          {activeTab === 'manual' && (
            <div className="p-3 flex gap-3 h-[500px]">
              
              {/* Columna Izquierda: Buscador y Lista de Abonados */}
              <div className="w-64 border-2 border-gray-700 bg-black text-green-400 flex flex-col font-mono text-[11px] shrink-0">
                <div className="p-1.5 border-b border-gray-800 bg-gray-900 shrink-0">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Buscar Abonado:</span>
                  <input
                    type="text"
                    placeholder="BUSCAR ABONADO O CUENTA..."
                    className="w-full bg-black text-green-400 border border-green-800 px-2 py-1 focus:outline-none focus:border-green-400 text-[10px]"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-800 text-green-200 text-[10px]">
                        <th className="p-1 border-b border-gray-700 w-14">CTA</th>
                        <th className="p-1 border-b border-gray-700">ABONADO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900">
                      {clientesFiltrados.map(([cuenta, datos]) => (
                        <tr
                          key={cuenta}
                          className={`cursor-pointer hover:bg-green-900/60 ${clienteSeleccionado?.cuenta === cuenta ? 'bg-green-900 text-white font-bold' : ''}`}
                          onClick={() => setClienteSeleccionado({ cuenta, nombre: datos.nombre || '' })}
                        >
                          <td className="p-1 border-r border-gray-800 font-bold">{cuenta}</td>
                          <td className="p-1 truncate max-w-[140px] text-[10px]">{datos.nombre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Columna Central: Redacción de Mensaje e Ingesta Directa */}
              <div className="flex-1 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e0e0e0] flex flex-col p-3 text-black overflow-y-auto">
                <div className="text-[#000080] font-bold text-xs border-b border-gray-400 pb-1 mb-2 flex justify-between items-center">
                  <span>ENVÍO MANUAL DE EMERGENCIAS</span>
                  {clienteSeleccionado && (
                    <span className="bg-[#000080] text-white px-2 py-0.5 text-[10px] rounded font-mono">
                      CTA: {clienteSeleccionado.cuenta}
                    </span>
                  )}
                </div>

                {!clienteSeleccionado ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 font-bold text-xs text-center p-4">
                    SELECCIONE UN ABONADO EN LA LISTA IZQUIERDA<br />PARA ENVIAR NOTIFICACIONES WHATSAPP
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 gap-2.5">
                    
                    {/* Ficha Cliente Activo */}
                    <div className="bg-white border border-gray-400 p-2 rounded text-[11px]">
                      <div className="font-bold text-blue-900 truncate">
                        {clienteSeleccionado.cuenta} - {clienteSeleccionado.nombre}
                      </div>
                    </div>

                    {/* Selector de Contactos Autorizados */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-700 block mb-1">
                        1. SELECCIONAR CONTACTO DE DESTINO DE ESTE ABONADO:
                      </span>
                      {listaContactosAutorizados.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-1">
                          {listaContactosAutorizados.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => setTelefonoEnvio(c.telefono)}
                              className={`text-left p-1 rounded border text-[10px] truncate cursor-pointer transition-colors ${
                                telefonoEnvio.replace(/[^0-9]/g, '') === c.telefono.replace(/[^0-9]/g, '') && telefonoEnvio !== ''
                                  ? 'bg-green-700 text-white border-green-900 font-bold'
                                  : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-100'
                              }`}
                            >
                              📞 {c.etiqueta}: <span className="font-mono">{c.telefono}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-500 italic mb-1">[Sin contactos guardados en ficha general]</div>
                      )}
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-gray-700 shrink-0">Teléfono manual:</span>
                        <input
                          type="tel"
                          placeholder="+56912345678"
                          className="flex-1 bg-white border border-gray-500 px-2 py-1 text-xs font-mono text-black font-bold focus:outline-none focus:border-blue-700"
                          value={telefonoEnvio}
                          onChange={(e) => setTelefonoEnvio(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Plantillas Rápidas de Emergencia */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-700 block mb-1">
                        2. PLANTILLAS DE EMERGENCIA RÁPIDAS:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => aplicarPlantilla('intrusión')}
                          className="bg-red-700 text-white text-[9px] font-bold px-2 py-1 rounded hover:bg-red-800 cursor-pointer"
                        >
                          🚨 ROBO / INTRUSIÓN
                        </button>
                        <button
                          onClick={() => aplicarPlantilla('energia')}
                          className="bg-yellow-700 text-white text-[9px] font-bold px-2 py-1 rounded hover:bg-yellow-800 cursor-pointer"
                        >
                          ⚡ CORTE ENERGÍA
                        </button>
                        <button
                          onClick={() => aplicarPlantilla('apertura')}
                          className="bg-blue-700 text-white text-[9px] font-bold px-2 py-1 rounded hover:bg-blue-800 cursor-pointer"
                        >
                          🔓 APERTURA
                        </button>
                        <button
                          onClick={() => aplicarPlantilla('cierre')}
                          className="bg-blue-900 text-white text-[9px] font-bold px-2 py-1 rounded hover:bg-blue-950 cursor-pointer"
                        >
                          🔒 CIERRE
                        </button>
                        <button
                          onClick={() => aplicarPlantilla('video')}
                          className="bg-green-700 text-white text-[9px] font-bold px-2 py-1 rounded hover:bg-green-800 cursor-pointer"
                        >
                          🎥 VIDEO VERIFICACIÓN
                        </button>
                      </div>
                    </div>

                    {/* Área de Redacción con Pre-texto Obligatorio Inamovible */}
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-700">
                        3. MENSAJE A TRANSMITIR (INCLUYE PRE-TEXTO OBLIGATORIO):
                      </span>
                      
                      {/* Pre-texto fijo */}
                      <div className="bg-blue-950 text-blue-200 px-2 py-1 rounded-t text-[11px] font-bold tracking-wider font-mono border border-blue-900">
                        🔒 PRE-TEXTO FIJO: GAMA SEGURIDAD INFORMA:
                      </div>
                      
                      <textarea
                        rows={4}
                        placeholder="Redacte el cuerpo de la notificación de emergencia aquí..."
                        className="w-full bg-white border border-gray-500 p-2 text-xs text-black font-mono focus:outline-none focus:border-blue-700 rounded-b resize-none flex-1"
                        value={textoMensaje}
                        onChange={(e) => setTextoMensaje(e.target.value)}
                      />
                    </div>

                    {/* Botón de Enviar e Ingesta Automática */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-400">
                      <span className="text-[10px] font-bold text-blue-900">{mensajeStatus}</span>
                      
                      <button
                        onClick={enviarMensajeManual}
                        disabled={enviandoManual || !telefonoEnvio || !textoMensaje}
                        className="bg-[#25D366] text-white font-bold text-xs px-4 py-1.5 rounded border border-green-700 hover:bg-[#20ba5a] active:bg-[#128C7E] disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow"
                      >
                        {enviandoManual ? (
                          <span>⌛ Enviando...</span>
                        ) : (
                          <>
                            <span>💬</span>
                            <span>ENVIAR NOTIFICACIÓN WHATSAPP</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* Columna Derecha: Historial de Chats y Envíos Registrados */}
              <div className="w-72 border-2 border-gray-700 bg-[#0b141a] text-white flex flex-col font-mono shrink-0 rounded-r overflow-hidden">
                <div className="p-2 border-b border-gray-800 bg-[#1f2c34] flex justify-between items-center">
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">💬 HISTORIAL DE CHAT / ENVÍOS</span>
                  <span className="text-[9px] bg-green-900 text-green-200 px-1.5 py-0.5 rounded font-bold">{chatLogs.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2 text-[10px]">
                  {chatLogs.length > 0 ? (
                    chatLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-2 rounded border transition-all ${
                          log.exito
                            ? 'bg-[#005c4b] border-green-600 text-white'
                            : 'bg-red-950 border-red-700 text-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-1 font-bold text-[9px]">
                          <span>CTA: {log.cuenta}</span>
                          <span>{log.fecha}</span>
                        </div>
                        <div className="text-[9px] text-green-200 mb-1 font-mono">
                          Destino: {log.telefono}
                        </div>
                        <div className="leading-tight break-words text-[10px] font-sans">
                          {log.texto}
                        </div>
                        <div className="mt-1 text-right text-[8px] italic opacity-80">
                          {log.exito ? '✓✓ Entregado en tiempo real' : `❌ ${log.errorMsg}`}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 italic text-center p-4 text-[10px]">
                      <span>💬</span>
                      <span>Los mensajes enviados aparecerán registrados aquí en tiempo real.</span>
                    </div>
                  )}
                </div>
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
