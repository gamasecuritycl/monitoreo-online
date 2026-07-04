import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
  clientesMap: Record<string, Record<string, string>>
}

interface ContactoEscalamiento {
  nombre: string
  telefono: string
  parentesco: string
}

export default function NotificacionesWhatsAppModal({ onClose, clientesMap }: Props) {
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
        setSilenciaHasta(data.silencia_hasta || '')
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
    if (!telLimpio) {
      setMensaje('Debe ingresar un teléfono válido')
      return
    }
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

  const agregarContacto = () => {
    setContactos([...contactos, { nombre: '', telefono: '', parentesco: '' }])
  }

  const actualizarContacto = (i: number, campo: keyof ContactoEscalamiento, valor: string) => {
    const copia = [...contactos]
    copia[i] = { ...copia[i], [campo]: valor }
    setContactos(copia)
  }

  const eliminarContacto = (i: number) => {
    setContactos(contactos.filter((_, idx) => idx !== i))
  }

  const probarWhatsApp = async () => {
    if (!clienteSeleccionado || !telefono) {
      alert('Configure un teléfono primero')
      return
    }
    try {
      setMensaje('Enviando prueba...')
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuenta: clienteSeleccionado.cuenta,
          nombre_cliente: clienteSeleccionado.nombre,
          tipo_evento: 'NOTIFICACIÓN DE PRUEBA',
          zona: 'PRUEBA',
          fecha_hora: new Date().toISOString(),
          direccion: '',
        }),
      })
      if (res.ok) {
        setMensaje('Mensaje de prueba enviado')
      } else {
        const err = await res.json()
        setMensaje('Error: ' + (err.error || 'desconocido'))
      }
      setTimeout(() => setMensaje(''), 3000)
    } catch {
      setMensaje('Error de conexión')
    }
  }

  const silencioActivo = silenciaHasta && new Date(silenciaHasta) > new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-sm tracking-wide">CONFIGURACIÓN NOTIFICACIONES WHATSAPP</div>
          <button
            onClick={onClose}
            className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0]"
          >X</button>
        </div>

        <div className="p-4 flex gap-4 h-[500px]">
          <div className="flex-1 border-2 border-gray-600 bg-black text-green-400 flex flex-col font-mono text-[11px]">
            <div className="p-1 border-b border-gray-700 bg-gray-900 shrink-0">
              <input
                type="text"
                placeholder="BUSCAR ABONADO O CUENTA..."
                className="w-full bg-black text-green-400 border border-green-800 px-2 py-1 focus:outline-none focus:border-green-400"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-green-200">
                    <th className="p-1 border-b border-gray-700 w-16">CTA</th>
                    <th className="p-1 border-b border-gray-700">NOMBRE ABONADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {clientesFiltrados.map(([cuenta, datos]) => (
                    <tr
                      key={cuenta}
                      className={`cursor-pointer hover:bg-green-900 ${clienteSeleccionado?.cuenta === cuenta ? 'bg-green-800 text-white' : ''}`}
                      onClick={() => setClienteSeleccionado({ cuenta, nombre: datos.nombre || '' })}
                    >
                      <td className="p-1 border-r border-gray-800 font-bold">{cuenta}</td>
                      <td className="p-1 truncate max-w-[200px]">{datos.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-96 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e0e0e0] flex flex-col p-3">
            <div className="text-[#000080] font-bold text-sm border-b border-gray-400 pb-1 mb-3">
              CONFIGURACIÓN WHATSAPP
            </div>

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
                  <input
                    type="tel"
                    className="w-full border border-gray-500 px-2 text-xs py-1 text-gray-800"
                    placeholder="+56912345678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-gray-800">Notificaciones activas:</label>
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="accent-[#000080]"
                  />
                  {silencioActivo && (
                    <span className="text-[10px] text-orange-600 font-bold ml-2">
                      SILENCIADO HASTA {new Date(silenciaHasta).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <div className="border-t border-gray-400 pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-800">Contactos de Escalamiento:</span>
                    <button
                      onClick={agregarContacto}
                      className="text-xs text-[#000080] font-bold hover:underline"
                    >+ Agregar</button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {contactos.map((c, i) => (
                      <div key={i} className="bg-white border border-gray-400 p-1 text-[10px]">
                        <div className="flex gap-1 mb-1">
                          <input
                            className="flex-1 border border-gray-300 px-1 py-0.5 text-gray-800"
                            placeholder="Nombre"
                            value={c.nombre}
                            onChange={(e) => actualizarContacto(i, 'nombre', e.target.value)}
                          />
                          <button
                            onClick={() => eliminarContacto(i)}
                            className="text-red-600 font-bold px-1"
                          >X</button>
                        </div>
                        <div className="flex gap-1">
                          <input
                            className="flex-1 border border-gray-300 px-1 py-0.5 text-gray-800"
                            placeholder="Teléfono"
                            value={c.telefono}
                            onChange={(e) => actualizarContacto(i, 'telefono', e.target.value)}
                          />
                          <input
                            className="w-16 border border-gray-300 px-1 py-0.5 text-gray-800"
                            placeholder="Parent."
                            value={c.parentesco}
                            onChange={(e) => actualizarContacto(i, 'parentesco', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                    {contactos.length === 0 && (
                      <div className="text-gray-400 italic text-[10px] text-center py-2">
                        Sin contactos de escalamiento
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex gap-2 justify-between items-center h-8">
                  <div className="text-[11px] font-bold text-[#000080]">
                    {guardando ? 'Guardando...' : mensaje}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={probarWhatsApp}
                      disabled={!telefono}
                      className="bg-[#c0c0c0] text-[11px] font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 py-1 hover:bg-[#d0d0d0] disabled:opacity-50"
                    >PROBAR</button>
                    <button
                      onClick={guardar}
                      className="bg-[#c0c0c0] text-[11px] font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 py-1 hover:bg-[#d0d0d0]"
                    >GUARDAR</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
