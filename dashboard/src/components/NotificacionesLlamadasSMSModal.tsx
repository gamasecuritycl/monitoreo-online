import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Contacto {
  prioridad: number
  nombre: string
  telefono: string
}

interface ClientData {
  direccion: string
  comuna: string
  contactos: Contacto[]
}

interface Props {
  onClose: () => void
  clientData: ClientData | null
  clientesMap: Record<string, any>
}

interface AlertaHistorial {
  id: number
  created_at: string
  mensaje_enviado: string
  tipo_evento: string
  estado: string
}

function obtenerContactos(clienteDb: any): Contacto[] {
  const contactos: Contacto[] = []
  if (clienteDb) {
    for (let i = 1; i <= 7; i++) {
      const tel = clienteDb['t' + i] || clienteDb['telefono' + i]
      const nom = clienteDb['nombre' + i] || clienteDb['usuario' + i] || `Contacto ${i}`
      if (tel && tel.trim()) {
        contactos.push({ prioridad: i, nombre: nom.trim(), telefono: tel.trim() })
      }
    }
  }
  return contactos
}

export default function NotificacionesLlamadasSMSModal({ onClose, clientData, clientesMap }: Props) {
  const [activeTab, setActiveTab] = useState<'dialer' | 'config'>('dialer')
  
  // Tab 1: Dialer States
  const [buscarTexto, setBuscarTexto] = useState('')
  const [clienteFiltrado, setClienteFiltrado] = useState<any>(null)
  const [contactosActivos, setContactosActivos] = useState<Contacto[]>([])
  const [numeroMarcador, setNumeroMarcador] = useState('')
  const [contactoSeleccionado, setContactoSeleccionado] = useState<string>('')

  // Tab 2: System Config States
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [historial, setHistorial] = useState<AlertaHistorial[]>([])
  const [probando, setProbando] = useState<string | null>(null)

  // 1. Cargar número guardado en Supabase (cuenta '__SYSTEM__') e Historial de alertas
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('notificaciones_whatsapp')
          .select('telefono')
          .eq('cuenta', '__SYSTEM__')
          .single()

        if (error && error.code !== 'PGRST116') throw error
        if (data?.telefono) {
          setTelefono(data.telefono)
        } else {
          setTelefono('56991016912')
        }
      } catch (err: any) {
        console.error('Error al cargar config:', err.message)
      } finally {
        setCargando(false)
      }
    }

    const cargarHistorial = async () => {
      try {
        const { data, error } = await supabase
          .from('conversaciones_whatsapp')
          .select('id, created_at, mensaje_enviado, tipo_evento, estado')
          .eq('cuenta', '__SINCRONIZADOR__')
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (error) throw error
        if (data) setHistorial(data)
      } catch (err: any) {
        console.error('Error al cargar historial:', err.message)
      }
    }

    cargarConfig()
    cargarHistorial()
  }, [])

  // No auto-cargar contactos del abonado activo al abrir para evitar que los refrescos en segundo plano cambien la selección del operador

  // Filtrar base de datos de abonados completa
  const listaSugeridos = Object.values(clientesMap || {})
    .filter((c: any) => {
      if (!buscarTexto) return false
      const term = buscarTexto.toLowerCase().trim()
      const cuenta = (c.cuenta || '').toLowerCase()
      const nombre = (c.nombre || '').toLowerCase()
      return cuenta.includes(term) || nombre.includes(term)
    })
    .slice(0, 5) // Máximo 5 resultados

  const seleccionarClienteBuscado = (c: any) => {
    const contactos = obtenerContactos(c)
    setClienteFiltrado(c)
    setContactosActivos(contactos)
    setBuscarTexto('') // Limpiar input de búsqueda
    if (contactos.length > 0) {
      setNumeroMarcador(contactos[0].telefono)
      setContactoSeleccionado(contactos[0].telefono)
    } else {
      setNumeroMarcador('')
      setContactoSeleccionado('')
    }
  }

  // Guardar número de administración
  const handleGuardar = async () => {
    const valorLimpio = telefono.trim()
    if (!valorLimpio) {
      setMensaje('❌ Ingrese un contacto válido')
      return
    }

    const esTelegram = valorLimpio.startsWith('@')
    const finalVal = esTelegram ? valorLimpio : valorLimpio.replace(/[^0-9]/g, '')

    if (!finalVal) {
      setMensaje('❌ Ingrese un contacto válido')
      return
    }

    setGuardando(true)
    setMensaje('')
    try {
      const { error } = await supabase
        .from('notificaciones_whatsapp')
        .upsert({
          cuenta: '__SYSTEM__',
          telefono: finalVal,
          activo: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'cuenta' })

      if (error) throw error
      setMensaje('✅ Configuración guardada correctamente')
      setTimeout(() => setMensaje(''), 3000)
    } catch (err: any) {
      setMensaje('❌ Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  // Probar alerta administrador
  const handleProbar = async (tipo: 'call' | 'sms') => {
    const valorLimpio = telefono.trim()
    if (!valorLimpio) {
      alert('Configure y guarde un contacto primero')
      return
    }

    const esTelegram = valorLimpio.startsWith('@')
    const finalVal = esTelegram ? valorLimpio : valorLimpio.replace(/[^0-9]/g, '')

    if (!finalVal) {
      alert('Ingrese un contacto válido')
      return
    }

    setProbando(tipo)
    try {
      const res = await fetch('/api/llamadas-sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: finalVal, tipo })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(tipo === 'call' 
          ? '📞 Llamada de prueba enviada con éxito.' 
          : '💬 SMS/Texto de prueba enviado con éxito.'
        )
      } else {
        if (data.debug && data.debug.includes('not authorized')) {
          alert('⚠️ NÚMERO NO AUTORIZADO:\n\nEl número o cuenta no está autorizado en CallMeBot.\n\nSi es Telegram, asegúrate de haber chateado con el bot.\nSi es WhatsApp, realiza la autorización primero.')
        } else {
          alert('❌ Detalle del error:\n\n' + (data.error || data.debug || 'Error desconocido'))
        }
      }
    } catch (err: any) {
      alert('❌ Error de red: ' + err.message)
    } finally {
      setProbando(null)
    }
  }

  // Dialer clicks
  const handleKeyPress = (char: string) => {
    setNumeroMarcador(prev => prev + char)
  }

  const handleDialCall = () => {
    const numLimpio = numeroMarcador.replace(/[^0-9+]/g, '')
    if (!numLimpio) return
    window.location.href = `tel:${numLimpio}`
  }

  const handleDialWhatsApp = () => {
    const numLimpio = numeroMarcador.replace(/[^0-9]/g, '')
    if (!numLimpio) return
    window.open(`https://wa.me/${numLimpio}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full max-w-md flex flex-col shadow-2xl font-mono text-black select-none">
        
        {/* Title bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-xs tracking-wide">MARCADOR SCORPION DIALER</div>
          <button onClick={onClose} className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] cursor-pointer">X</button>
        </div>

        {/* Win95 Tabs */}
        <div className="flex bg-[#c0c0c0] px-2 pt-1 border-b border-gray-400 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('dialer')}
            className={`px-3 py-1 text-xs font-bold border-t-2 border-x-2 rounded-t-sm cursor-pointer ${
              activeTab === 'dialer'
                ? 'bg-[#c0c0c0] border-t-white border-x-white pb-[2px] z-10 translate-y-[1px]'
                : 'bg-[#b0b0b0] border-t-gray-500 border-x-gray-500 pb-0.5'
            }`}
          >
            Marcador de Clientes
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1 text-xs font-bold border-t-2 border-x-2 rounded-t-sm cursor-pointer ${
              activeTab === 'config'
                ? 'bg-[#c0c0c0] border-t-white border-x-white pb-[2px] z-10 translate-y-[1px]'
                : 'bg-[#b0b0b0] border-t-gray-500 border-x-gray-500 pb-0.5'
            }`}
          >
            Alertas del Sistema
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="p-3 bg-[#c0c0c0] border-t-2 border-t-white flex-1 flex flex-col">
          
          {/* TAB 1: CLIENTES DIALER */}
          {activeTab === 'dialer' && (
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              
              {/* Buscador de Clientes */}
              <div className="flex flex-col gap-1 relative">
                <span className="text-[10px] font-bold text-gray-700">🔍 BUSCAR ABONADO (CUENTA O NOMBRE):</span>
                <input
                  type="text"
                  value={buscarTexto}
                  onChange={(e) => setBuscarTexto(e.target.value)}
                  placeholder="Escribe cuenta o nombre..."
                  className="w-full bg-white border border-gray-400 font-bold px-2 py-1 text-xs text-black select-text focus:outline-none"
                />
                
                {/* Resultados de Búsqueda */}
                {buscarTexto && listaSugeridos.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 shadow-lg z-50 py-0.5 mt-0.5 max-h-[140px] overflow-y-auto">
                    {listaSugeridos.map((c: any) => (
                      <button
                        key={c.cuenta}
                        onClick={() => seleccionarClienteBuscado(c)}
                        className="w-full text-left px-2 py-1 text-[10px] text-black font-bold hover:bg-[#000080] hover:text-white border-b border-gray-300 truncate cursor-pointer"
                      >
                        [{c.cuenta}] {c.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Información Abonado */}
              <div className="bg-[#d0d0d0] border border-gray-400 p-2 text-xs">
                <div className="font-bold text-gray-700 mb-0.5">ABONADO CARGADO EN MARCADOR:</div>
                <div className="bg-white border border-gray-500 p-1 font-bold text-blue-900 truncate">
                  {clienteFiltrado 
                    ? `[${clienteFiltrado.cuenta}] ${clienteFiltrado.nombre}`
                    : '❌ SELECCIONE ABONADO'
                  }
                </div>
              </div>

              {/* Selector de Contacto de Abonado */}
              {!clienteFiltrado ? (
                <div className="text-[10px] italic text-blue-900 font-bold text-center bg-blue-100 border border-blue-300 py-3.5 px-2">
                  🔍 Por favor, use el buscador superior para cargar los contactos de un abonado.
                </div>
              ) : contactosActivos.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-700">CONTACTOS DISPONIBLES:</span>
                  <select
                    value={contactoSeleccionado}
                    onChange={(e) => {
                      setContactoSeleccionado(e.target.value)
                      setNumeroMarcador(e.target.value)
                    }}
                    className="w-full bg-white border border-gray-400 text-xs p-1 font-bold focus:outline-none"
                  >
                    {contactosActivos.map((c, i) => (
                      <option key={i} value={c.telefono}>
                        {c.prioridad}. {c.nombre} ({c.telefono})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-[10px] italic text-red-700 font-bold text-center bg-red-100 border border-red-300 py-3.5 px-2">
                  Este abonado no tiene contactos registrados en la base de datos.
                </div>
              )}

              {/* Input de Marcación Manual */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-700">NÚMERO DE TELÉFONO:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={numeroMarcador}
                    onChange={(e) => setNumeroMarcador(e.target.value)}
                    placeholder="Digite número..."
                    className="flex-1 bg-white border border-gray-400 font-bold px-2 py-1.5 text-sm text-black select-text focus:outline-none"
                  />
                  <button
                    onClick={() => setNumeroMarcador('')}
                    className="bg-[#d0d0d0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 py-1 font-bold text-xs cursor-pointer active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                  >
                    BORRAR
                  </button>
                </div>
              </div>

              {/* Dial Pad and Action Buttons Layout */}
              <div className="grid grid-cols-3 gap-3 flex-1 items-center">
                
                {/* Dialer Grid */}
                <div className="col-span-2 grid grid-cols-3 gap-1 bg-[#d0d0d0] border border-gray-400 p-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((char) => (
                    <button
                      key={char}
                      onClick={() => handleKeyPress(char)}
                      className="bg-[#c0c0c0] hover:bg-[#d0d0d0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-1.5 font-black text-xs cursor-pointer active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                    >
                      {char}
                    </button>
                  ))}
                </div>

                {/* Dial Action Buttons */}
                <div className="flex flex-col h-full justify-center">
                  <button
                    onClick={handleDialWhatsApp}
                    className="h-full bg-[#075e54] text-white hover:bg-teal-800 border-2 border-t-white border-l-white border-b-gray-900 border-r-gray-900 font-bold text-[11px] cursor-pointer active:border-t-gray-900 active:border-l-gray-900 active:border-b-white active:border-r-white flex flex-col items-center justify-center gap-2 shadow-sm p-2 text-center"
                  >
                    <span className="text-lg">💬</span>
                    <span>ABRIR CHAT</span>
                    <span>WHATSAPP</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: SYSTEM CONFIG (ALERTAS) */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {cargando ? (
                <p className="text-xs italic text-gray-600">Cargando parámetros del sistema...</p>
              ) : (
                <>
                  <div className="bg-blue-900/10 border border-blue-900/30 p-2 text-[10px] text-blue-900 leading-normal">
                    📍 Este contacto recibirá alertas críticas mediante <strong>Llamadas de Voz (WhatsApp/Telegram)</strong> y <strong>Mensajes de WhatsApp</strong> si la central Scorpion pierde conexión por más de 5 minutos.
                  </div>

                  <div className="bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 p-2.5 flex flex-col gap-2">
                    <span className="font-bold text-[10px] text-gray-700">CONTACTO DEL ADMINISTRADOR:</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej: +56991016912 o @username"
                        className="flex-1 bg-white border border-gray-400 font-bold px-2 py-1 text-xs text-black select-text focus:outline-none"
                      />
                      <button
                        onClick={handleGuardar}
                        disabled={guardando}
                        className="bg-[#d0d0d0] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 py-1 font-bold text-xs cursor-pointer active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                      >
                        {guardando ? 'GUARDANDO...' : 'GUARDAR'}
                      </button>
                    </div>
                    {mensaje && <p className="text-[10px] font-bold mt-1 text-center">{mensaje}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleProbar('call')}
                      disabled={probando !== null}
                      className="bg-[#d0d0d0] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-1.5 font-bold text-xs cursor-pointer text-center text-blue-900 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                    >
                      {probando === 'call' ? '📞 LLAMANDO...' : '📞 PROBAR LLAMADA'}
                    </button>
                    <button
                      onClick={() => handleProbar('sms')}
                      disabled={probando !== null}
                      className="bg-[#d0d0d0] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-1.5 font-bold text-xs cursor-pointer text-center text-green-950 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                    >
                      {probando === 'sms' ? '💬 PROBAR TEXTO WA' : '💬 PROBAR TEXTO WA'}
                    </button>
                  </div>

                  <div className="bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex flex-col">
                    <div className="bg-[#000080] text-white text-[9px] font-bold px-2 py-0.5 tracking-wider uppercase">
                      HISTORIAL DE ALERTAS OFFLINE ENVIADAS
                    </div>
                    <div className="p-1 h-[110px] overflow-y-auto bg-white">
                      <table className="w-full text-left text-[9px] border-collapse">
                        <thead>
                          <tr className="bg-gray-200 border-b border-gray-400 font-bold text-gray-700">
                            <th className="p-1">FECHA/HORA</th>
                            <th className="p-1">EVENTO</th>
                            <th className="p-1">MENSAJE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-800">
                          {historial.map((row) => (
                            <tr key={row.id}>
                              <td className="p-1 font-mono">{new Date(row.created_at).toLocaleString('es-CL')}</td>
                              <td className="p-1 font-bold text-red-700">{row.tipo_evento}</td>
                              <td className="p-1 truncate max-w-[150px]">{row.mensaje_enviado}</td>
                            </tr>
                          ))}
                          {historial.length === 0 && (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-gray-400 italic">Sin alertas registradas.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
