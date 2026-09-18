'use client'

import React, { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import {
  obtenerConfigMail,
  guardarConfigMail,
  CORREOS_GAMA_PREDEFINIDOS,
  enviarReporteHistoricoMail
} from '@/lib/notificacionesMail'

interface NotificacionesMailModalProps {
  onClose: () => void
  clientesMap: Record<string, Record<string, string>>
}

const _fmtChile = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function hoyChile(): string {
  return _fmtChile.format(new Date())
}

function getDiasAtras(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return _fmtChile.format(d)
}

function getInicioMes(): string {
  const d = new Date()
  d.setDate(1)
  return _fmtChile.format(d)
}

export default function NotificacionesMailModal({ onClose, clientesMap }: NotificacionesMailModalProps) {
  const [busqueda, setBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{ cuenta: string; nombre: string } | null>(null)
  
  // Casillas del cliente
  const [emails, setEmails] = useState<string[]>([])
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [enviarAbonado, setEnviarAbonado] = useState(true)

  // Filtro de fechas manual
  const [fechaDesde, setFechaDesde] = useState(getDiasAtras(7))
  const [fechaHasta, setFechaHasta] = useState(hoyChile())

  // Formato de reporte
  const [formatoAdjunto, setFormatoAdjunto] = useState<'pdf' | 'xlsx' | 'ambos' | 'ninguno'>('pdf')

  // Usuario Gama (Estrictamente los 4 solicitados)
  const [enviarCopiaGama, setEnviarCopiaGama] = useState(false)
  const [correoGama, setCorreoGama] = useState('contacto@gamasecurity.cl')

  // Programación Automática (desmarcada por defecto)
  const [reporteAuto, setReporteAuto] = useState(false)
  const [frecuencia, setFrecuencia] = useState<'diario' | 'semanal' | 'mensual'>('mensual')

  // Estados de proceso
  const [guardando, setGuardando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  // Lista de clientes filtrada
  const clientesFiltrados = Object.entries(clientesMap)
    .filter(([cuenta, datos]) => {
      const b = busqueda.toLowerCase().trim()
      if (!b) return true
      return cuenta.toLowerCase().includes(b) || (datos.nombre || '').toLowerCase().includes(b)
    })
    .slice(0, 60)

  // Cargar emails y config cuando se selecciona un cliente desde la fuente única
  useEffect(() => {
    if (!clienteSeleccionado) {
      setEmails([])
      setReporteAuto(false)
      return
    }
    let isMounted = true
    const cargarDatos = async () => {
      setGuardando(true)
      const cfg = await obtenerConfigMail(clienteSeleccionado.cuenta)
      if (isMounted) {
        setEmails(cfg.emails)
        setReporteAuto(cfg.reporteAutomatico)
        setFrecuencia(cfg.frecuencia)
        setEnviarCopiaGama(cfg.copiaGama ?? false)
        if (cfg.emailGama) setCorreoGama(cfg.emailGama)
        setEnviarAbonado(cfg.emails.length > 0)
        setGuardando(false)
      }
    }
    cargarDatos()
    return () => { isMounted = false }
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
    setEnviarAbonado(true)
    setGuardando(true)
    await guardarConfigMail(clienteSeleccionado.cuenta, nuevosEmails, {
      reporteAutomatico: reporteAuto,
      frecuencia,
      copiaGama: enviarCopiaGama,
      emailGama: correoGama
    })
    setGuardando(false)
    setMensaje({ tipo: 'ok', texto: `Correo ${emailLimpiado} guardado en la base de datos.` })
    setTimeout(() => setMensaje(null), 3000)
  }

  const eliminarEmail = async (emailAEliminar: string) => {
    if (!clienteSeleccionado) return
    const nuevosEmails = emails.filter(e => e !== emailAEliminar)
    setEmails(nuevosEmails)
    if (nuevosEmails.length === 0) setEnviarAbonado(false)
    setGuardando(true)
    await guardarConfigMail(clienteSeleccionado.cuenta, nuevosEmails, {
      reporteAutomatico: reporteAuto,
      frecuencia,
      copiaGama: enviarCopiaGama,
      emailGama: correoGama
    })
    setGuardando(false)
    setMensaje({ tipo: 'ok', texto: 'Correo eliminado' })
    setTimeout(() => setMensaje(null), 2500)
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
    setMensaje({ tipo: 'ok', texto: checked ? 'Envío automático activado' : 'Envío automático desactivado' })
    setTimeout(() => setMensaje(null), 3000)
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
    setMensaje({ tipo: 'ok', texto: `Frecuencia: ${frec}` })
    setTimeout(() => setMensaje(null), 2500)
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
  }

  // Generador de PDF en Base64
  const generarPdfBase64 = (cuenta: string, nombre: string, eventos: any[]): string => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('GAMA SECURITY — REPORTE HISTÓRICO DE MONITOREO 24/7', 14, 15)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Abonado: #${cuenta} — ${nombre}`, 14, 21)
    doc.text(`Rango Consultado: ${fechaDesde} al ${fechaHasta} | Total Eventos: ${eventos.length}`, 14, 26)
    doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-CL')}`, 14, 31)
    doc.line(14, 33, 196, 33)

    let y = 39
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('FECHA / HORA', 14, y)
    doc.text('EVENTO / SEÑAL', 60, y)
    doc.text('ZONA / USUARIO', 145, y)
    doc.line(14, y + 2, 196, y + 2)
    y += 6

    doc.setFont('helvetica', 'normal')
    const muestra = eventos.slice(0, 80)
    for (const ev of muestra) {
      if (y > 280) {
        doc.addPage()
        y = 18
        doc.setFont('helvetica', 'bold')
        doc.text('FECHA / HORA', 14, y)
        doc.text('EVENTO / SEÑAL', 60, y)
        doc.text('ZONA / USUARIO', 145, y)
        doc.line(14, y + 2, 196, y + 2)
        y += 6
        doc.setFont('helvetica', 'normal')
      }
      const fechaHora = String(ev.fecha_hora || ev.fecha || '').substring(0, 19)
      const evento = String(ev.evento || 'SEÑAL').substring(0, 42)
      const zonaUsr = String(ev.zona || ev.usuario || '-').substring(0, 25)

      doc.text(fechaHora, 14, y)
      doc.text(evento, 60, y)
      doc.text(zonaUsr, 145, y)
      y += 5
    }

    if (eventos.length > 80) {
      doc.setFont('helvetica', 'italic')
      doc.text(`... y ${eventos.length - 80} eventos adicionales registrados en el sistema central.`, 14, y + 4)
    }

    const dataUri = doc.output('datauristring')
    return dataUri.split(',')[1] || ''
  }

  // Generador de Excel XLSX en Base64
  const generarExcelBase64 = (cuenta: string, nombre: string, eventos: any[]): string => {
    const rows = eventos.map((ev, idx) => ({
      '#': idx + 1,
      'Fecha y Hora': ev.fecha_hora || ev.fecha || '',
      'Cuenta': cuenta,
      'Abonado': nombre,
      'Evento': ev.evento || 'SEÑAL',
      'Zona / Código': ev.zona || '',
      'Usuario': ev.usuario || '',
      'Detalle': ev.descripcion || ev.protocolo || ''
    }))

    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Mensaje': 'Sin eventos registrados en el período' }])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Señales_${cuenta}`)
    return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
  }

  // Botón Principal: ENVIAR
  const handleEnviarReporte = async () => {
    if (!clienteSeleccionado) {
      alert('Seleccione un abonado de la lista izquierda primero.')
      return
    }

    // Compilar lista de destinatarios
    const destinatarios: string[] = []
    if (enviarAbonado) {
      destinatarios.push(...emails)
    }
    if (enviarCopiaGama && correoGama && !destinatarios.includes(correoGama)) {
      destinatarios.push(correoGama)
    }

    if (destinatarios.length === 0) {
      alert('Debe marcar al menos un destinatario: casillas del abonado o marcar Usuario Gama.')
      return
    }

    setEnviando(true)
    setMensaje({ tipo: 'ok', texto: 'Consultando bitácora de eventos y generando reporte...' })

    try {
      // 1. Obtener eventos de monitoreo para la cuenta en el rango de fechas
      const { data: rawEventos, error: errEvt } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .eq('cuenta', clienteSeleccionado.cuenta)
        .gte('fecha_hora', `${fechaDesde}T00:00:00`)
        .lte('fecha_hora', `${fechaHasta}T23:59:59`)
        .order('fecha_hora', { ascending: false })
        .limit(300)

      if (errEvt) console.warn('Aviso consultando eventos por fecha:', errEvt)

      const eventosLista = rawEventos || []

      // 2. Construir adjuntos según el formato seleccionado
      const attachments: Array<{ filename: string; content: string }> = []
      const ctaClean = clienteSeleccionado.cuenta
      const nombreClean = clienteSeleccionado.nombre || ctaClean

      if (formatoAdjunto === 'pdf' || formatoAdjunto === 'ambos') {
        const pdfBase64 = generarPdfBase64(ctaClean, nombreClean, eventosLista)
        if (pdfBase64) {
          attachments.push({
            filename: `Reporte_${ctaClean}_${fechaDesde}_al_${fechaHasta}.pdf`,
            content: pdfBase64
          })
        }
      }

      if (formatoAdjunto === 'xlsx' || formatoAdjunto === 'ambos') {
        const xlsxBase64 = generarExcelBase64(ctaClean, nombreClean, eventosLista)
        if (xlsxBase64) {
          attachments.push({
            filename: `Reporte_${ctaClean}_${fechaDesde}_al_${fechaHasta}.xlsx`,
            content: xlsxBase64
          })
        }
      }

      // 3. Despachar a la API de correo
      const res = await enviarReporteHistoricoMail({
        cuenta: ctaClean,
        nombreCliente: nombreClean,
        fechaDesde,
        fechaHasta,
        destinatarios,
        totalEventos: eventosLista.length,
        eventos: eventosLista,
        frecuencia: 'manual',
        attachments: attachments.length > 0 ? attachments : undefined
      })

      setEnviando(false)
      if (res.success) {
        setMensaje({
          tipo: 'ok',
          texto: `✅ Reporte enviado con éxito a: ${destinatarios.join(', ')}`
        })
      } else {
        setMensaje({
          tipo: 'err',
          texto: `❌ Error al enviar: ${res.error || 'Falla de conexión'}`
        })
      }
      setTimeout(() => setMensaje(null), 6000)
    } catch (err: any) {
      setEnviando(false)
      console.error('Error enviando reporte:', err)
      setMensaje({ tipo: 'err', texto: `❌ Error inesperado: ${err.message || err}` })
      setTimeout(() => setMensaje(null), 6000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl font-sans">
        
        {/* Header Modal Clásico */}
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
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        <div className="p-3 flex flex-col md:flex-row gap-3 flex-1 min-h-0 overflow-hidden">
          
          {/* Panel Izquierdo: Lista de Abonados (Terminal UNIX / MDB) */}
          <div className="w-full md:w-[320px] border-2 border-gray-600 bg-black text-green-400 flex flex-col font-mono text-[11px] shrink-0">
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
                      <td className="p-1.5 truncate max-w-[200px]">{datos.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel Derecho: Configuración y Envío de Reporte */}
          <div className="flex-1 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e8e8e8] flex flex-col p-3 text-xs overflow-y-auto">
            <div className="text-[#000080] font-bold text-xs sm:text-sm border-b border-gray-400 pb-1 mb-2 flex justify-between items-center">
              <span>CONFIGURACIÓN Y ENVÍO DE REPORTE HISTÓRICO</span>
              {guardando && <span className="text-[10px] text-blue-700 font-bold animate-pulse">Sincronizando...</span>}
            </div>
            
            {!clienteSeleccionado ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-bold text-xs text-center p-6 gap-2">
                <span className="text-3xl">👈</span>
                <span>SELECCIONE UN ABONADO EN LA LISTA IZQUIERDA PARA CONFIGURAR O ENVIAR REPORTES</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                
                {/* 1. Identificación del Abonado */}
                <div className="bg-white border border-gray-400 p-2 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-bold text-gray-600 uppercase">Abonado Seleccionado:</div>
                    <div className="font-bold text-xs text-blue-950">
                      #{clienteSeleccionado.cuenta} — {clienteSeleccionado.nombre}
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-900 font-mono text-[10px] font-bold px-2 py-0.5 border border-blue-300 rounded-xs">
                    CUENTA ACTIVA
                  </span>
                </div>

                {/* 2. Filtro de Fechas para el Reporte Manual */}
                <div className="bg-[#f0f4f8] border border-blue-300 p-2 space-y-1.5">
                  <div className="text-[11px] font-bold text-blue-900 flex items-center justify-between">
                    <span>📅 RANGO DE FECHAS PARA EL REPORTE:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setFechaDesde(hoyChile()); setFechaHasta(hoyChile()) }}
                        className="bg-white border border-gray-400 px-1.5 py-0.5 text-[10px] font-bold hover:bg-gray-100 cursor-pointer"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFechaDesde(getDiasAtras(7)); setFechaHasta(hoyChile()) }}
                        className="bg-white border border-gray-400 px-1.5 py-0.5 text-[10px] font-bold hover:bg-gray-100 cursor-pointer"
                      >
                        7 Días
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFechaDesde(getInicioMes()); setFechaHasta(hoyChile()) }}
                        className="bg-white border border-gray-400 px-1.5 py-0.5 text-[10px] font-bold hover:bg-gray-100 cursor-pointer"
                      >
                        Mes Actual
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFechaDesde(getDiasAtras(30)); setFechaHasta(hoyChile()) }}
                        className="bg-white border border-gray-400 px-1.5 py-0.5 text-[10px] font-bold hover:bg-gray-100 cursor-pointer"
                      >
                        30 Días
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-bold text-gray-700 w-12 shrink-0">Desde:</label>
                      <input 
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="bg-white border border-gray-400 px-2 py-0.5 text-xs text-blue-950 font-bold flex-1 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-bold text-gray-700 w-12 shrink-0">Hasta:</label>
                      <input 
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="bg-white border border-gray-400 px-2 py-0.5 text-xs text-blue-950 font-bold flex-1 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Formato del Reporte (PDF / Excel XLSX / Ambos) */}
                <div className="bg-white border border-gray-300 p-2 space-y-1">
                  <div className="text-[10px] font-bold text-gray-700 uppercase">
                    📎 Formato de Exportación Adjunto:
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <label className={`flex items-center gap-1.5 px-2 py-1 border cursor-pointer select-none font-bold rounded-xs ${
                      formatoAdjunto === 'pdf' ? 'bg-indigo-50 border-indigo-500 text-indigo-900' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}>
                      <input 
                        type="radio" 
                        name="formato" 
                        checked={formatoAdjunto === 'pdf'} 
                        onChange={() => setFormatoAdjunto('pdf')} 
                        className="cursor-pointer"
                      />
                      <span>📄 Documento PDF</span>
                    </label>

                    <label className={`flex items-center gap-1.5 px-2 py-1 border cursor-pointer select-none font-bold rounded-xs ${
                      formatoAdjunto === 'xlsx' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}>
                      <input 
                        type="radio" 
                        name="formato" 
                        checked={formatoAdjunto === 'xlsx'} 
                        onChange={() => setFormatoAdjunto('xlsx')} 
                        className="cursor-pointer"
                      />
                      <span>📊 Planilla Excel (.xlsx)</span>
                    </label>

                    <label className={`flex items-center gap-1.5 px-2 py-1 border cursor-pointer select-none font-bold rounded-xs ${
                      formatoAdjunto === 'ambos' ? 'bg-blue-50 border-blue-500 text-blue-900' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}>
                      <input 
                        type="radio" 
                        name="formato" 
                        checked={formatoAdjunto === 'ambos'} 
                        onChange={() => setFormatoAdjunto('ambos')} 
                        className="cursor-pointer"
                      />
                      <span>📑 Ambos (PDF + Excel)</span>
                    </label>

                    <label className={`flex items-center gap-1.5 px-2 py-1 border cursor-pointer select-none font-bold rounded-xs ${
                      formatoAdjunto === 'ninguno' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}>
                      <input 
                        type="radio" 
                        name="formato" 
                        checked={formatoAdjunto === 'ninguno'} 
                        onChange={() => setFormatoAdjunto('ninguno')} 
                        className="cursor-pointer"
                      />
                      <span>✉️ Solo Cuerpo HTML</span>
                    </label>
                  </div>
                </div>

                {/* 4. Casillas del Abonado */}
                <div className="bg-white border border-gray-300 p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={enviarAbonado}
                        onChange={(e) => setEnviarAbonado(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-400 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-gray-800">
                        Enviar a correos del Abonado ({emails.length}):
                      </span>
                    </label>
                    <span className="text-[10px] text-gray-500 italic">Sincronizado con base de datos</span>
                  </div>

                  {/* Input Agregar Correo Manual */}
                  <div className="flex gap-1 pt-1">
                    <input 
                      type="email" 
                      className="flex-1 border border-gray-400 px-2 text-xs py-1 text-gray-800 bg-white focus:outline-none focus:border-blue-700"
                      placeholder="Nuevo correo: ejemplo@empresa.cl"
                      value={nuevoEmail}
                      onChange={e => setNuevoEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && agregarEmail()}
                    />
                    <button 
                      onClick={agregarEmail}
                      className="bg-[#c0c0c0] font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 hover:bg-[#d0d0d0] active:border-t-gray-700 text-blue-900 text-xs cursor-pointer flex items-center gap-1"
                    >
                      + Agregar
                    </button>
                  </div>

                  {/* Lista de Correos Registrados */}
                  <div className="max-h-[70px] overflow-y-auto border border-gray-300 bg-gray-50 p-1">
                    {emails.length === 0 ? (
                      <div className="text-[11px] text-gray-500 italic p-1">
                        No hay correos registrados para este abonado. Ingrese uno arriba o marque abajo para enviar solo a Usuario Gama.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {emails.map((email, i) => (
                          <span key={i} className="bg-white border border-blue-300 text-blue-900 font-mono text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span>{email}</span>
                            <button 
                              onClick={() => eliminarEmail(email)}
                              className="text-red-500 hover:text-red-700 font-bold cursor-pointer leading-none"
                              title="Eliminar correo"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Enviar a Usuario Gama (SOLO los 4 solicitados) */}
                <div className="bg-[#f8fafc] border border-blue-300 p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enviarCopiaGama}
                        onChange={(e) => handleToggleCopiaGama(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                        <span>🛡️</span>
                        <span>Enviar a Usuario Gama (puede enviarse solo a Gama):</span>
                      </span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-semibold">Casillas autorizadas</span>
                  </div>

                  {enviarCopiaGama && (
                    <div className="pt-1 flex items-center gap-2">
                      <select
                        value={correoGama}
                        onChange={(e) => handleChangeCorreoGama(e.target.value)}
                        className="flex-1 bg-white border border-gray-400 text-xs font-bold text-blue-950 px-2 py-1 rounded-xs focus:outline-none"
                      >
                        {CORREOS_GAMA_PREDEFINIDOS.map(cg => (
                          <option key={cg.email} value={cg.email}>
                            {cg.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 6. Control de Envío Automático Programado (DESMARCADO POR DEFECTO) */}
                <div className="bg-white border border-gray-300 p-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={reporteAuto}
                      onChange={(e) => handleToggleAuto(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-gray-800">
                      Habilitar Envío Automático Programado
                    </span>
                  </label>
                  
                  {reporteAuto && (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-xs">
                      <span className="text-[10px] font-bold text-blue-900">Frecuencia:</span>
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

                {/* Feedback de Estado */}
                {mensaje && (
                  <div className={`p-2 text-xs font-bold border rounded-xs ${
                    mensaje.tipo === 'ok' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'
                  }`}>
                    {mensaje.texto}
                  </div>
                )}

                {/* Footer de Acciones: Botón ENVIAR */}
                <div className="flex gap-2 justify-between items-center pt-2 border-t border-gray-400 mt-1">
                  <div className="text-[10px] text-gray-600 italic">
                    Destinatarios activos: {
                      [
                        ...(enviarAbonado ? emails : []),
                        ...(enviarCopiaGama && correoGama ? [correoGama] : [])
                      ].length
                    } casillas
                  </div>

                  <button 
                    onClick={handleEnviarReporte}
                    disabled={enviando}
                    className="bg-[#000080] text-white text-xs font-black border-2 border-t-blue-400 border-l-blue-400 border-b-black border-r-black px-6 py-2 hover:bg-blue-900 active:translate-y-0.5 cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                    title="Despachar reporte oficial por correo"
                  >
                    <span>{enviando ? '⏳' : '📧'}</span>
                    <span>{enviando ? 'ENVIANDO...' : 'ENVIAR'}</span>
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
