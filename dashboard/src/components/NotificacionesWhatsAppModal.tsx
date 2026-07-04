import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendMessage } from '@/lib/whatsapp'

interface Props {
  onClose: () => void
  clientesMap: Record<string, Record<string, string>>
}

interface ContactoEscalamiento {
  nombre: string
  telefono: string
  parentesco: string
}

type Tab = 'config' | 'alertas' | 'panico' | 'energia'

export default function NotificacionesWhatsAppModal({ onClose, clientesMap }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('config')
  const [busqueda, setBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{ cuenta: string; nombre: string } | null>(null)
  const [telefono, setTelefono] = useState('')
  const [activo, setActivo] = useState(true)
  const [contactos, setContactos] = useState<ContactoEscalamiento[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [silenciaHasta, setSilenciaHasta] = useState('')

  const clientesFiltrados = Object.entries(clientesMap)
    .filter(([cuenta, datos]) => {
      const b = busqueda.toLowerCase().trim()
      if (!b) return true
      return cuenta.toLowerCase().includes(b) || (datos.nombre || '').toLowerCase().includes(b)
    })
    .slice(0, 50)

  useEffect(() => {
    if (!clienteSeleccionado) {
      setTelefono('')
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
      } else {
        setTelefono('')
        setActivo(true)
        setContactos([])
        setSilenciaHasta('')
      }
    }
    cargar()
  }, [clienteSeleccionado])

  const guardar = async () => {
    if (!clienteSeleccionado) return
    const telLimpio = telefono.replace(/[^0-9]/g, '')
    if (!telLimpio) { setMensaje('Debe ingresar un teléfono válido'); return }
    setGuardando(true)
    setMensaje('')
    try {
      const { error } = await supabase.from('notificaciones_whatsapp').upsert({
        cuenta: clienteSeleccionado.cuenta,
        telefono: telLimpio,
        activo,
        contactos_escalamiento: contactos,
        silencio_hasta: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'cuenta' })
      if (error) throw error
      setMensaje('Guardado OK')
      setTimeout(() => setMensaje(''), 2000)
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

  const probarWhatsApp = async () => {
    if (!clienteSeleccionado || !telefono) { alert('Configure un teléfono primero'); return }
    try {
      setMensaje('Enviando prueba...')
      const telLimpio = telefono.replace(/[^0-9]/g, '')
      const texto = `🛡️ *GAMA SEGURIDAD*\n━━━━━━━━━━━━━━━━━━━━━\n\n⚠️ *NOTIFICACIÓN DE PRUEBA*\n\n👤 Cliente: *${clienteSeleccionado.cuenta}* - ${clienteSeleccionado.nombre}\n🕐 Hora: ${new Date().toLocaleString('es-CL')}\n\n━━━━━━━━━━━━━━━━━━━━━\n_Gama Seguridad - Monitoreo 24/7_`
      const resultado = await sendMessage(telLimpio, texto)
      setMensaje(resultado.ok ? '✅ Mensaje enviado' : '❌ Error: ' + (resultado.debug || ''))
      setTimeout(() => setMensaje(''), 3000)
    } catch { setMensaje('❌ Error al enviar') }
  }

  const silencioActivo = silenciaHasta && new Date(silenciaHasta) > new Date()

  const tabs: { id: Tab; label: string }[] = [
    { id: 'config', label: 'Configuración' },
    { id: 'alertas', label: 'Alertas' },
    { id: 'panico', label: 'Pánico' },
    { id: 'energia', label: 'Energía' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-sm tracking-wide">NOTIFICACIONES POR WHATSAPP</div>
          <button onClick={onClose} className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0]">X</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-600 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 text-xs font-bold tracking-wide transition-colors ${
                activeTab === t.id
                  ? 'bg-white text-[#000080] border-t-2 border-t-[#000080] border-x border-x-gray-400'
                  : 'bg-[#a0a0a0] text-black hover:bg-[#b0b0b0] border-x border-x-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {/* ═══ TAB: CONFIGURACIÓN ═══ */}
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
              <div className="w-96 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e0e0e0] flex flex-col p-3">
                <div className="text-[#000080] font-bold text-sm border-b border-gray-400 pb-1 mb-3">CONFIGURACIÓN WHATSAPP</div>
                {!clienteSeleccionado ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 font-bold text-xs text-center p-4">
                    SELECCIONE UN ABONADO<br />EN LA LISTA IZQUIERDA
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
                      <div className="text-[10px] font-bold text-gray-800 mb-1">Teléfono WhatsApp:</div>
                      <input type="tel" className="w-full border border-gray-500 px-2 text-xs py-1 text-gray-800"
                        placeholder="+56912345678" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold text-gray-800">Notificaciones activas:</label>
                      <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="accent-[#000080]" />
                      {silencioActivo && (
                        <span className="text-[10px] text-orange-600 font-bold ml-2">
                          SILENCIADO HASTA {new Date(silenciaHasta).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div className="border-t border-gray-400 pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-gray-800">Contactos de Escalamiento:</span>
                        <button onClick={agregarContacto} className="text-xs text-[#000080] font-bold hover:underline">+ Agregar</button>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {contactos.map((c, i) => (
                          <div key={i} className="bg-white border border-gray-400 p-1 text-[10px]">
                            <div className="flex gap-1 mb-1">
                              <input className="flex-1 border border-gray-300 px-1 py-0.5 text-gray-800" placeholder="Nombre" value={c.nombre} onChange={(e) => actualizarContacto(i, 'nombre', e.target.value)} />
                              <button onClick={() => eliminarContacto(i)} className="text-red-600 font-bold px-1">X</button>
                            </div>
                            <div className="flex gap-1">
                              <input className="flex-1 border border-gray-300 px-1 py-0.5 text-gray-800" placeholder="Teléfono" value={c.telefono} onChange={(e) => actualizarContacto(i, 'telefono', e.target.value)} />
                              <input className="w-16 border border-gray-300 px-1 py-0.5 text-gray-800" placeholder="Parent." value={c.parentesco} onChange={(e) => actualizarContacto(i, 'parentesco', e.target.value)} />
                            </div>
                          </div>
                        ))}
                        {contactos.length === 0 && <div className="text-gray-400 italic text-[10px] text-center py-2">Sin contactos</div>}
                      </div>
                    </div>
                    <div className="mt-auto flex gap-2 justify-between items-center h-8">
                      <div className="text-[11px] font-bold text-[#000080]">{guardando ? 'Guardando...' : mensaje}</div>
                      <div className="flex gap-1">
                        <button onClick={probarWhatsApp} disabled={!telefono}
                          className="bg-[#c0c0c0] text-[11px] font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 py-1 hover:bg-[#d0d0d0] disabled:opacity-50">PROBAR</button>
                        <button onClick={guardar}
                          className="bg-[#c0c0c0] text-[11px] font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 py-1 hover:bg-[#d0d0d0]">GUARDAR</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB: ALERTAS ═══ */}
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
              <div className="bg-blue-50 border border-blue-300 p-3 mb-3">
                <div className="text-blue-800 font-bold mb-1">RESPUESTAS DEL CLIENTE</div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-white border border-gray-300 p-2 text-center"><div className="font-bold text-green-700">OK</div><div className="text-[10px]">Todo controlado</div></div>
                  <div className="bg-white border border-gray-300 p-2 text-center"><div className="font-bold text-orange-700">AYUDA</div><div className="text-[10px]">Solicita asistencia</div></div>
                  <div className="bg-white border border-gray-300 p-2 text-center"><div className="font-bold text-gray-700">SILENCIO</div><div className="text-[10px]">No molestar 1hr</div></div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-300 p-3">
                <div className="text-yellow-800 font-bold mb-1">CIRCUITO DE ESCALAMIENTO</div>
                <p>Sin respuesta en 5 min → contacto secundario → 3 min más → contacto terciario → canal con operador.</p>
              </div>
            </div>
          )}

          {/* ═══ TAB: PÁNICO ═══ */}
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
                  <span className="bg-red-600 text-white px-2 py-1 rounded">AYUDA YA</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-300 p-3 mb-3">
                <div className="text-blue-800 font-bold mb-1">QUE OCURRE AL ACTIVARLO</div>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Se confirma la emergencia al cliente</li>
                  <li>Se notifica a TODOS los contactos de escalamiento</li>
                  <li>Si comparten ubicación GPS → link a Google Maps</li>
                  <li>Se registra estado "EMERGENCIA" en la BD</li>
                  <li>El operador es alertado inmediatamente</li>
                </ol>
              </div>
              <div className="bg-green-50 border border-green-300 p-3 mb-3">
                <div className="text-green-800 font-bold mb-1">COMPARTIR UBICACIÓN GPS</div>
                <ol className="list-decimal ml-4 mt-1">
                  <li>En WhatsApp, tocar 📎 (adjuntar)</li>
                  <li>Seleccionar "Ubicación"</li>
                  <li>Compartir ubicación actual</li>
                </ol>
                <p className="mt-2 text-gray-600">El sistema genera un link directo a Google Maps con las coordenadas.</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-300 p-3">
                <div className="text-yellow-800 font-bold mb-1">MENSAJE A CONTACTOS</div>
                <div className="bg-white border border-gray-300 p-2 mt-1 font-mono text-[10px]">
                  🚨 EMERGENCIA - [CUENTA]<br/>
                  Contacto: [NOMBRE]<br/>
                  📍 GPS: https://maps.google.com/?q=[LAT],[LNG]<br/>
                  Despache unidad urgente.
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: ENERGÍA ═══ */}
          {activeTab === 'energia' && (
            <div className="p-4 overflow-y-auto h-[480px] text-xs text-black font-bold leading-relaxed">
              <div className="bg-yellow-50 border-2 border-yellow-400 p-3 mb-3">
                <div className="text-yellow-800 text-sm font-bold mb-2">DETECCIÓN AUTOMÁTICA</div>
                <p>Al detectar FALLA DE ENERGÍA ELÉCTRICA en Scorpion, se envía WhatsApp automático al cliente.</p>
              </div>
              <div className="bg-gray-50 border border-gray-300 p-3 mb-3">
                <div className="text-gray-800 font-bold mb-2">MENSAJE ENVIADO</div>
                <div className="bg-white border border-gray-300 p-2 font-mono text-[10px]">
                  ⚡ ALERTA DE ENERGÍA ELÉCTRICA<br/><br/>
                  Cliente: [CUENTA] - [NOMBRE]<br/>
                  Dirección: [DIRECCIÓN]<br/>
                  Hora: [FECHA Y HORA]<br/><br/>
                  Se ha detectado un corte o falla de energía eléctrica.<br/>
                  Su sistema opera con batería de respaldo (72 horas).<br/><br/>
                  Responda OK para confirmar recepción.<br/>
                  Si necesita asistencia, responda AYUDA.
                </div>
              </div>
              <div className="bg-green-50 border border-green-300 p-3 mb-3">
                <div className="text-green-800 font-bold mb-1">ACUSE DE RECIBO</div>
                <p>El cliente responde <span className="bg-green-200 px-1">OK</span> para confirmar.</p>
                <p className="mt-1">Si responde <span className="bg-orange-200 px-1">AYUDA</span>, se activa escalamiento.</p>
              </div>
              <div className="bg-blue-50 border border-blue-300 p-3">
                <div className="text-blue-800 font-bold mb-1">INFORMACIÓN EN EL MENSAJE</div>
                <ul className="list-disc ml-4 space-y-1">
                  <li><strong>Tipo:</strong> FALLA ENERGÍA ELÉCTRICA</li>
                  <li><strong>Estado:</strong> Operando con batería de respaldo</li>
                  <li><strong>Batería:</strong> 72 horas estimadas</li>
                  <li><strong>Acción:</strong> Confirmar recepción (OK)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
