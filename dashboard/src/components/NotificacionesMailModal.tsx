import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface NotificacionesMailModalProps {
  onClose: () => void
  clientesMap: Record<string, Record<string, string>>
}

export default function NotificacionesMailModal({ onClose, clientesMap }: NotificacionesMailModalProps) {
  const [busqueda, setBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{ cuenta: string, nombre: string } | null>(null)
  const [emails, setEmails] = useState<string[]>([])
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // Lista de clientes filtrada
  const clientesFiltrados = Object.entries(clientesMap)
    .filter(([cuenta, datos]) => {
      const b = busqueda.toLowerCase().trim()
      if (!b) return true
      return cuenta.toLowerCase().includes(b) || (datos.nombre || '').toLowerCase().includes(b)
    })
    .slice(0, 50) // Limitar para rendimiento

  // Cargar emails cuando se selecciona un cliente
  useEffect(() => {
    if (!clienteSeleccionado) {
      setEmails([])
      return
    }
    const cargarEmails = async () => {
      try {
        const { data } = await supabase
          .from('notificaciones_mail')
          .select('emails')
          .eq('cuenta', clienteSeleccionado.cuenta)
          .single()
        
        if (data && data.emails) {
          setEmails(data.emails)
        } else {
          setEmails([])
        }
      } catch (err) {
        console.error(err)
        setEmails([])
      }
    }
    cargarEmails()
  }, [clienteSeleccionado])

  const agregarEmail = async () => {
    if (!nuevoEmail || !nuevoEmail.includes('@') || !clienteSeleccionado) return
    const emailLimpiado = nuevoEmail.trim().toLowerCase()
    if (emails.includes(emailLimpiado)) {
      setNuevoEmail('')
      return
    }
    
    const nuevosEmails = [...emails, emailLimpiado]
    await guardarEnBD(nuevosEmails)
    setEmails(nuevosEmails)
    setNuevoEmail('')
  }

  const eliminarEmail = async (emailAEliminar: string) => {
    if (!clienteSeleccionado) return
    const nuevosEmails = emails.filter(e => e !== emailAEliminar)
    await guardarEnBD(nuevosEmails)
    setEmails(nuevosEmails)
  }

  const guardarEnBD = async (lista: string[]) => {
    if (!clienteSeleccionado) return
    setGuardando(true)
    setMensaje('')
    try {
      const { error } = await supabase
        .from('notificaciones_mail')
        .upsert({ cuenta: clienteSeleccionado.cuenta, emails: lista }, { onConflict: 'cuenta' })
      
      if (error) throw error
      setMensaje('Guardado OK')
      setTimeout(() => setMensaje(''), 2000)
    } catch (err) {
      console.error(err)
      setMensaje('Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const probarEmail = async () => {
    if (!clienteSeleccionado || emails.length === 0) {
      alert("Agregue al menos un correo primero")
      return
    }
    try {
      setMensaje('Enviando prueba...')
      const res = await fetch('/api/enviar-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuenta: clienteSeleccionado.cuenta,
          nombre_cliente: clienteSeleccionado.nombre,
          tipo_evento: 'APERTURA DE PRUEBA',
          fecha_hora: new Date().toISOString(),
          destinatarios: emails
        })
      })
      if (res.ok) {
        setMensaje('Prueba enviada OK')
      } else {
        const error = await res.json()
        console.error(error)
        setMensaje('Error al enviar prueba')
      }
      setTimeout(() => setMensaje(''), 3000)
    } catch (err) {
      console.error(err)
      setMensaje('Error de conexión')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header Modal */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-sm tracking-wide">CONFIGURACION NOTIFICACIONES POR MAIL</div>
          <button 
            onClick={onClose}
            className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
          >
            X
          </button>
        </div>

        <div className="p-4 flex gap-4 h-[500px]">
          {/* Panel Izquierdo: Lista de Clientes */}
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

          {/* Panel Derecho: Correos del Cliente */}
          <div className="w-96 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e0e0e0] flex flex-col p-3">
            <div className="text-[#000080] font-bold text-sm border-b border-gray-400 pb-1 mb-3">
              CASILLAS DE CORREO
            </div>
            
            {!clienteSeleccionado ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-bold text-xs text-center p-4">
                SELECCIONE UN ABONADO<br/>EN LA LISTA IZQUIERDA
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                <div className="mb-4">
                  <div className="text-[10px] font-bold mb-1">Abonado Seleccionado:</div>
                  <div className="bg-white border border-gray-400 px-2 py-1 font-bold text-xs truncate">
                    {clienteSeleccionado.cuenta} - {clienteSeleccionado.nombre}
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-[10px] font-bold mb-1">Agregar Email:</div>
                  <div className="flex gap-1">
                    <input 
                      type="email" 
                      className="flex-1 border border-gray-500 px-2 text-xs py-1"
                      placeholder="ejemplo@correo.com"
                      value={nuevoEmail}
                      onChange={e => setNuevoEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && agregarEmail()}
                    />
                    <button 
                      onClick={agregarEmail}
                      className="bg-[#c0c0c0] font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 hover:bg-[#d0d0d0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white text-green-700 text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex-1 border border-gray-500 bg-white mt-2 overflow-y-auto">
                  {emails.length === 0 ? (
                    <div className="p-3 text-center text-[10px] text-gray-400 italic">No hay correos registrados</div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {emails.map((email, i) => (
                        <li key={i} className="flex justify-between items-center p-2 text-xs font-bold hover:bg-blue-50">
                          <span className="truncate mr-2">{email}</span>
                          <button 
                            onClick={() => eliminarEmail(email)}
                            className="text-red-600 hover:text-white hover:bg-red-600 px-2 py-0.5 border border-transparent rounded-sm font-bold leading-none"
                            title="Eliminar"
                          >
                            X
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 flex gap-2 justify-between items-center h-8">
                  <div className="text-[11px] font-bold text-[#000080]">
                    {guardando ? 'Guardando...' : mensaje}
                  </div>
                  <button 
                    onClick={probarEmail}
                    disabled={emails.length === 0}
                    className="bg-[#c0c0c0] text-[11px] font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-4 py-1 hover:bg-[#d0d0d0] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white disabled:opacity-50"
                  >
                    ENVIAR PRUEBA
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
