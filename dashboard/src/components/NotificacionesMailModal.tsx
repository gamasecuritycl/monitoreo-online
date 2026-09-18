import React, { useState, useEffect } from 'react'
import { obtenerConfigMail, guardarConfigMail, ConfigMailAbonado, CORREOS_GAMA_PREDEFINIDOS } from '@/lib/notificacionesMail'

interface NotificacionesMailModalProps {
  onClose: () => void
  clientesMap: Record<string, Record<string, string>>
}

export default function NotificacionesMailModal({ onClose, clientesMap }: NotificacionesMailModalProps) {
  const [busqueda, setBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{ cuenta: string; nombre: string } | null>(null)
  const [emails, setEmails] = useState<string[]>([])
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [reporteAuto, setReporteAuto] = useState(false)
  const [frecuencia, setFrecuencia] = useState<'diario' | 'semanal' | 'mensual'>('mensual')
  const [enviarCopiaGama, setEnviarCopiaGama] = useState(false)
  const [correoGama, setCorreoGama] = useState('contacto@gamasecurity.cl')
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

  // Cargar emails y config cuando se selecciona un cliente desde la fuente única
  useEffect(() => {
    if (!clienteSeleccionado) {
      setEmails([])
      setReporteAuto(false)
      return
    }
    const cargarDatos = async () => {
      setGuardando(true)
      const cfg = await obtenerConfigMail(clienteSeleccionado.cuenta)
      setEmails(cfg.emails)
      setReporteAuto(cfg.reporteAutomatico)
      setFrecuencia(cfg.frecuencia)
      setEnviarCopiaGama(cfg.copiaGama ?? false)
      if (cfg.emailGama) setCorreoGama(cfg.emailGama)
      setGuardando(false)
    }
    cargarDatos()
  }, [clienteSeleccionado])

  const agregarEmail = async () => {
    if (!nuevoEmail || !nuevoEmail.includes('@') || !clienteSeleccionado) return
    const emailLimpiado = nuevoEmail.trim().toLowerCase()
    if (emails.includes(emailLimpiado)) {
      setNuevoEmail('')
      return
    }

    const nuevosEmails = [...emails, emailLimpiado]
    setEmails(nuevosEmails)
    setNuevoEmail('')
    setGuardando(true)
    setMensaje('Guardando...')
    await guardarConfigMail(clienteSeleccionado.cuenta, nuevosEmails, {
      reporteAutomatico: reporteAuto,
      frecuencia,
      copiaGama: enviarCopiaGama,
      emailGama: correoGama
    })
    setGuardando(false)
    setMensaje('Guardado OK')
    setTimeout(() => setMensaje(''), 2500)
  }

  const eliminarEmail = async (emailAEliminar: string) => {
    if (!clienteSeleccionado) return
    const nuevosEmails = emails.filter(e => e !== emailAEliminar)
    setEmails(nuevosEmails)
    setGuardando(true)
    await guardarConfigMail(clienteSeleccionado.cuenta, nuevosEmails, {
      reporteAutomatico: reporteAuto,
      frecuencia,
      copiaGama: enviarCopiaGama,
      emailGama: correoGama
    })
    setGuardando(false)
    setMensaje('Eliminado OK')
    setTimeout(() => setMensaje(''), 2500)
  }

  const handleToggleAuto = async (checked: boolean) => {
    setReporteAuto(checked)
    if (!clienteSeleccionado) return
    setGuardando(true)
    await guardarConfigMail(clienteSeleccionado.cuenta, emails, {
      reporteAutomatico: checked,
      frecuencia,
      copiaGama: enviarCopiaGama,
      emailGama: correoGama
    })
    setGuardando(false)
    setMensaje(checked ? 'Envío automático activado' : 'Automático desactivado')
    setTimeout(() => setMensaje(''), 3000)
  }

  const handleChangeFrecuencia = async (frec: 'diario' | 'semanal' | 'mensual') => {
    setFrecuencia(frec)
    if (!clienteSeleccionado) return
    setGuardando(true)
    await guardarConfigMail(clienteSeleccionado.cuenta, emails, {
      reporteAutomatico: reporteAuto,
      frecuencia: frec,
      copiaGama: enviarCopiaGama,
      emailGama: correoGama
    })
    setGuardando(false)
    setMensaje(`Frecuencia: ${frec}`)
    setTimeout(() => setMensaje(''), 2500)
  }

  const handleToggleCopiaGama = async (checked: boolean) => {
    setEnviarCopiaGama(checked)
    if (!clienteSeleccionado) return
    setGuardando(true)
    await guardarConfigMail(clienteSeleccionado.cuenta, emails, {
      reporteAutomatico: reporteAuto,
      frecuencia,
      copiaGama: checked,
      emailGama: correoGama
    })
    setGuardando(false)
    setMensaje(checked ? 'Copia a Gama activada' : 'Copia a Gama desactivada')
    setTimeout(() => setMensaje(''), 2500)
  }

  const handleChangeCorreoGama = async (val: string) => {
    setCorreoGama(val)
    if (!clienteSeleccionado) return
    setGuardando(true)
    await guardarConfigMail(clienteSeleccionado.cuenta, emails, {
      reporteAutomatico: reporteAuto,
      frecuencia,
      copiaGama: enviarCopiaGama,
      emailGama: val
    })
    setGuardando(false)
    setMensaje('Destinatario Gama actualizado')
    setTimeout(() => setMensaje(''), 2500)
  }

  const probarEmail = async () => {
    if (!clienteSeleccionado) return
    const destinatarios = [...emails]
    if (enviarCopiaGama && correoGama && !destinatarios.includes(correoGama)) {
      destinatarios.push(correoGama)
    }

    if (destinatarios.length === 0) {
      alert("Agregue al menos un correo o marque copia a Usuario Gama.")
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
          tipo_evento: 'REPORTE_HISTORICO',
          fecha_hora: new Date().toISOString(),
          destinatarios,
          reporte_data: {
            fechaDesde: new Date().toLocaleDateString('es-CL'),
            fechaHasta: new Date().toLocaleDateString('es-CL'),
            totalEventos: 1,
            frecuencia: 'prueba',
            eventos: [
              {
                fecha_hora: new Date().toLocaleString('es-CL'),
                evento: 'TEST DE TRANSMISIÓN Y VERIFICACIÓN POR CORREO',
                zona: 'Central Gama',
                usuario: 'Operador Central'
              }
            ]
          }
        })
      })

      if (res.ok) {
        setMensaje('Prueba enviada OK')
      } else {
        const error = await res.json()
        console.error(error)
        setMensaje('Error al enviar prueba')
      }
      setTimeout(() => setMensaje(''), 3500)
    } catch (err) {
      console.error(err)
      setMensaje('Error de conexión')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl font-sans">
        
        {/* Header Modal */}
        <div className="bg-[#000080] text-white px-3 py-1.5 flex justify-between items-center shrink-0 shadow-inner">
          <div className="font-bold text-xs sm:text-sm tracking-wide flex items-center gap-2">
            <span>CENTRAL DE CORREOS & REPORTES HISTÓRICOS</span>
            <span className="bg-emerald-400 text-black px-1.5 py-0.2 rounded-xs text-[10px] font-black uppercase tracking-wider">
              RESEND 24/7
            </span>
          </div>
          <button 
            onClick={onClose}
            className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] active:border-t-gray-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-3 sm:p-4 flex flex-col md:flex-row gap-3 sm:gap-4 h-[560px]">
          {/* Panel Izquierdo: Lista de Clientes */}
          <div className="flex-1 border-2 border-gray-600 bg-black text-green-400 flex flex-col font-mono text-[11px] min-h-[180px]">
            <div className="p-1.5 border-b border-gray-700 bg-gray-900 shrink-0">
              <input 
                type="text" 
                placeholder="BUSCAR ABONADO O CUENTA..."
                className="w-full bg-black text-green-400 border border-green-800 px-2 py-1 focus:outline-none focus:border-green-400 text-xs"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-green-200 sticky top-0">
                    <th className="p-1.5 border-b border-gray-700 w-16">CTA</th>
                    <th className="p-1.5 border-b border-gray-700">NOMBRE ABONADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {clientesFiltrados.map(([cuenta, datos]) => (
                    <tr 
                      key={cuenta} 
                      className={`cursor-pointer hover:bg-green-950 ${clienteSeleccionado?.cuenta === cuenta ? 'bg-green-800 text-white font-bold' : ''}`}
                      onClick={() => setClienteSeleccionado({ cuenta, nombre: datos.nombre || '' })}
                    >
                      <td className="p-1.5 border-r border-gray-800 font-bold">{cuenta}</td>
                      <td className="p-1.5 truncate max-w-[220px]">{datos.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel Derecho: Configuración de Correos del Cliente */}
          <div className="w-full md:w-[420px] border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e0e0e0] flex flex-col p-3 text-xs">
            <div className="text-[#000080] font-bold text-xs sm:text-sm border-b border-gray-400 pb-1 mb-2 flex justify-between items-center">
              <span>CASILLAS & ENVÍO DE REPORTES</span>
              {guardando && <span className="text-[10px] text-blue-700 font-bold animate-pulse">Sincronizando...</span>}
            </div>
            
            {!clienteSeleccionado ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-bold text-xs text-center p-4">
                SELECCIONE UN ABONADO<br/>EN LA LISTA IZQUIERDA
              </div>
            ) : (
              <div className="flex flex-col flex-1 gap-2.5 overflow-hidden">
                {/* Identificación Abonado */}
                <div className="bg-white border border-gray-400 p-2 shadow-xs">
                  <div className="text-[9px] font-bold text-gray-600 uppercase">Abonado Seleccionado:</div>
                  <div className="font-bold text-xs text-gray-900 truncate">
                    #{clienteSeleccionado.cuenta} — {clienteSeleccionado.nombre}
                  </div>
                </div>

                {/* Agregar Nuevo Correo */}
                <div>
                  <div className="text-[10px] font-bold text-gray-800 mb-1">Agregar Correo para Reportes:</div>
                  <div className="flex gap-1">
                    <input 
                      type="email" 
                      className="flex-1 border border-gray-500 px-2 text-xs py-1 text-gray-800 bg-white focus:outline-none focus:border-blue-700"
                      placeholder="ejemplo@correo.com"
                      value={nuevoEmail}
                      onChange={e => setNuevoEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && agregarEmail()}
                    />
                    <button 
                      onClick={agregarEmail}
                      className="bg-[#c0c0c0] font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 hover:bg-[#d0d0d0] active:border-t-gray-700 text-green-800 text-base leading-none cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Lista de Correos Registrados */}
                <div className="flex-1 border border-gray-500 bg-white overflow-y-auto p-1">
                  {emails.length === 0 ? (
                    <div className="p-3 text-center text-[11px] text-gray-400 italic">No hay correos registrados para este abonado</div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {emails.map((email, i) => (
                        <li key={i} className="flex justify-between items-center p-1.5 text-xs font-bold text-gray-800 hover:bg-blue-50">
                          <span className="truncate mr-2 font-mono text-[11px]">{email}</span>
                          <button 
                            onClick={() => eliminarEmail(email)}
                            className="text-red-600 hover:text-white hover:bg-red-600 px-1.5 py-0.5 border border-transparent rounded-sm font-bold leading-none cursor-pointer"
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Control de Envío Automático Programado (DESMARCADO POR DEFECTO) */}
                <div className="bg-[#f0f4f8] border border-blue-300 p-2 space-y-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={reporteAuto}
                      onChange={(e) => handleToggleAuto(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-blue-950">
                      Habilitar Envío Automático Programado
                    </span>
                  </label>
                  
                  {reporteAuto && (
                    <div className="flex items-center gap-2 pt-1 border-t border-blue-200">
                      <span className="text-[10px] font-bold text-gray-700">Frecuencia:</span>
                      <select
                        value={frecuencia}
                        onChange={(e) => handleChangeFrecuencia(e.target.value as any)}
                        className="bg-white border border-gray-400 text-xs font-bold text-blue-900 px-2 py-0.5 focus:outline-none"
                      >
                        <option value="diario">Diario (últimas 24h)</option>
                        <option value="semanal">Semanal (últimos 7 días)</option>
                        <option value="mensual">Mensual (mes completo)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Copia a Usuario Gama */}
                <div className="bg-gray-100 border border-gray-300 p-2 space-y-1">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enviarCopiaGama}
                      onChange={(e) => handleToggleCopiaGama(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-gray-800">
                      🛡️ Enviar copia a Usuario Gama:
                    </span>
                  </label>
                  {enviarCopiaGama && (
                    <select
                      value={correoGama}
                      onChange={(e) => handleChangeCorreoGama(e.target.value)}
                      className="w-full bg-white border border-gray-400 text-[11px] font-bold text-blue-900 px-2 py-0.5 focus:outline-none"
                    >
                      {CORREOS_GAMA_PREDEFINIDOS.map(cg => (
                        <option key={cg.email} value={cg.email}>
                          {cg.etiqueta}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Footer de Acciones y Prueba */}
                <div className="flex gap-2 justify-between items-center pt-1 border-t border-gray-400">
                  <div className="text-[11px] font-bold text-[#000080] truncate max-w-[200px]">
                    {guardando ? 'Guardando...' : mensaje}
                  </div>
                  <button 
                    onClick={probarEmail}
                    className="bg-[#000080] text-white text-[11px] font-bold border-2 border-t-blue-400 border-l-blue-400 border-b-black border-r-black px-4 py-1.5 hover:bg-blue-900 active:translate-y-0.5 cursor-pointer shadow-xs"
                  >
                    ENVIAR PRUEBA REAL
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
