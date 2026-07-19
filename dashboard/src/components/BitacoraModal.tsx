'use client'

import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'

type Abonado = { id: number; cod: string; nombre: string; direccion: string; plan: string; ciudad: string }
type TipoEvento = { id: number; name: string; color: string }
type Evento = { id: number; id_abonado: number; abonado_cod: string; abonado_nombre: string; comentario: string; tipo_evento: number; tipo_nombre: string; tipo_color: string; responsable_nombre: string; created_at: string; updated_at: string }
type Archivo = { id: number; nombre_original: string; url: string; tipo: string; tamanio: number; created_at: string }

const API_URL = 'https://bitacora.gamasecurity.cl/api-bitacora.php'

function getUltimos7Dias() {
  const hoy = new Date()
  const hace7 = new Date(hoy.getTime() - 7 * 86400000)
  return {
    desde: hace7.toISOString().split('T')[0] + ' 00:00',
    hasta: hoy.toISOString().split('T')[0] + ' 23:59',
  }
}

function getTurnoInfo() {
  const now = new Date()
  const h = now.getHours()
  const hoy = now.toISOString().split('T')[0]
  const ayer = new Date(now.getTime() - 86400000).toISOString().split('T')[0]

  if (h >= 8 && h < 16) {
    return { nombre: 'Turno 1 (08:00-16:00)', desde: `${hoy} 08:00`, hasta: `${hoy} 16:00` }
  } else if (h >= 16 && h < 22) {
    return { nombre: 'Turno 2 (16:00-22:00)', desde: `${hoy} 16:00`, hasta: `${hoy} 22:00` }
  } else {
    return { nombre: 'Turno 3 (22:00-08:00)', desde: `${ayer} 22:00`, hasta: `${hoy} 08:00` }
  }
}

export default function BitacoraModal({ onClose, cuentaDefault }: { onClose: () => void; cuentaDefault?: string }) {
  // --- Estados de filtros (Iguales a la web real) ---
  const [buscarTexto, setBuscarTexto] = useState('')
  const [filtroAbonadoInput, setFiltroAbonadoInput] = useState('')
  const [abonadoSugerencias, setAbonadoSugerencias] = useState<Abonado[]>([])
  const [abonadoSel, setAbonadoSel] = useState<Abonado | null>(null)
  
  const [responsables, setResponsables] = useState<string[]>([])
  const [responsableSel, setResponsableSel] = useState('')
  const [tipoSel, setTipoSel] = useState('')
  const [filtroId, setFiltroId] = useState('')

  const ultimos7 = getUltimos7Dias()
  const [desde, setDesde] = useState(ultimos7.desde)
  const [hasta, setHasta] = useState(ultimos7.hasta)
  const [modoFecha, setModoFecha] = useState<'turno' | 'semana' | 'personalizado'>('semana')

  // --- Datos ---
  const [eventos, setEventos] = useState<Evento[]>([])
  const [tipos, setTipos] = useState<TipoEvento[]>([])
  
  // --- Formulario Nuevo Evento ---
  const [mostrarNuevoForm, setMostrarNuevoForm] = useState(false)
  const [comentario, setComentario] = useState('')
  const [tipoEvento, setTipoEvento] = useState('1')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // --- Edición ---
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editComentario, setEditComentario] = useState('')
  const [editTipo, setEditTipo] = useState('')

  // --- Archivos ---
  const [archivos, setArchivos] = useState<Record<number, Archivo[]>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)

  // --- Sugerencias de abonados ---
  useEffect(() => {
    if (filtroAbonadoInput.length < 1) { setAbonadoSugerencias([]); return }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}?action=abonados&q=${encodeURIComponent(filtroAbonadoInput)}`)
        if (r.ok) setAbonadoSugerencias(await r.json())
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [filtroAbonadoInput])

  // --- Inicialización ---
  useEffect(() => {
    fetch(`${API_URL}?action=tipos`).then(r => r.ok && r.json()).then(d => d && setTipos(d)).catch(() => {})
    cargarTodosLosEventos(desde, hasta)
  }, [])

  // Extraer lista única de responsables de los eventos cargados
  useEffect(() => {
    const list = Array.from(new Set(eventos.map(e => e.responsable_nombre).filter(Boolean)))
    setResponsables(list)
  }, [eventos])

  // --- Cargar Eventos ---
  const cargarTodosLosEventos = async (dMin: string, dMax: string) => {
    try {
      const url = `${API_URL}?action=eventos&desde=${encodeURIComponent(dMin)}&hasta=${encodeURIComponent(dMax)}`
      const r = await fetch(url)
      if (r.ok) setEventos(await r.json())
    } catch {}
  };

  const cargarEventosAbonado = async (id: number) => {
    try {
      let url = `${API_URL}?action=eventos&id=${id}`
      if (desde) url += `&desde=${encodeURIComponent(desde)}`
      if (hasta) url += `&hasta=${encodeURIComponent(hasta)}`
      const r = await fetch(url)
      if (r.ok) setEventos(await r.json())
    } catch {}
  }

  const cargarArchivos = async (eventoId: number) => {
    try {
      const r = await fetch(`${API_URL}?action=archivos&evento_id=${eventoId}`)
      if (r.ok) {
        const data = await r.json()
        setArchivos(prev => ({ ...prev, [eventoId]: data }))
      }
    } catch {}
  }

  // --- Acciones de Formulario ---
  const seleccionarAbonadoFiltro = (a: Abonado) => {
    setAbonadoSel(a)
    setFiltroAbonadoInput(`${a.cod} - ${a.nombre}`)
    setAbonadoSugerencias([])
    cargarEventosAbonado(a.id)
  }

  const limpiarFiltros = () => {
    setAbonadoSel(null)
    setFiltroAbonadoInput('')
    setResponsableSel('')
    setTipoSel('')
    setBuscarTexto('')
    setFiltroId('')
    const d = getUltimos7Dias()
    setDesde(d.desde)
    setHasta(d.hasta)
    setModoFecha('semana')
    cargarTodosLosEventos(d.desde, d.hasta)
  }

  const crearEvento = async () => {
    if (!abonadoSel || !comentario.trim()) return
    setEnviando(true)
    setMensaje('')
    try {
      const r = await fetch(`${API_URL}?action=crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_abonado: abonadoSel.id,
          comentario: comentario.trim(),
          tipo_evento: parseInt(tipoEvento),
          id_responsable: 1,
        }),
      })
      const d = await r.json()
      if (d.ok) {
        setMensaje('✅ Registro creado correctamente')
        setComentario('')
        setMostrarNuevoForm(false)
        if (abonadoSel) cargarEventosAbonado(abonadoSel.id)
        else cargarTodosLosEventos(desde, hasta)
      } else {
        setMensaje('❌ Error: ' + (d.error || ''))
      }
    } catch (e: any) {
      setMensaje('❌ Error de red: ' + e.message)
    }
    setEnviando(false)
    setTimeout(() => setMensaje(''), 3000)
  }

  const iniciarEdicion = (e: Evento) => {
    setEditandoId(e.id)
    setEditComentario(e.comentario)
    setEditTipo(String(e.tipo_evento))
  }

  const guardarEdicion = async () => {
    if (editandoId === null) return
    try {
      const r = await fetch(`${API_URL}?action=editar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editandoId, comentario: editComentario, tipo_evento: parseInt(editTipo) }),
      })
      const d = await r.json()
      if (d.ok) {
        setEditandoId(null)
        if (abonadoSel) cargarEventosAbonado(abonadoSel.id)
        else cargarTodosLosEventos(desde, hasta)
      }
    } catch {}
  }

  const subirArchivo = async (eventoId: number, file: File) => {
    setSubiendoArchivo(true)
    const formData = new FormData()
    formData.append('evento_id', String(eventoId))
    formData.append('archivo', file)
    try {
      const r = await fetch(`${API_URL}?action=adjuntar`, { method: 'POST', body: formData })
      const d = await r.json()
      if (d.ok) cargarArchivos(eventoId)
    } catch {}
    setSubiendoArchivo(false)
  }

  const handleFileChange = (eventoId: number) => {
    const file = fileInputRef.current?.files?.[0]
    if (file) subirArchivo(eventoId, file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const eliminarArchivo = async (archivoId: number, eventoId: number) => {
    try {
      await fetch(`${API_URL}?action=eliminar_archivo&id=${archivoId}`, { method: 'DELETE' })
      cargarArchivos(eventoId)
    } catch {}
  }

  const toggleArchivos = (eventoId: number) => {
    if (archivos[eventoId]) {
      setArchivos(prev => { const n = { ...prev }; delete n[eventoId]; return n })
    } else {
      cargarArchivos(eventoId)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    return (bytes / 1024).toFixed(1) + ' KB'
  }

  const filtrarPorTurno = () => {
    const t = getTurnoInfo()
    setDesde(t.desde)
    setHasta(t.hasta)
    setModoFecha('turno')
    cargarTodosLosEventos(t.desde, t.hasta)
  }

  const aplicarFiltroManual = () => {
    if (abonadoSel) {
      cargarEventosAbonado(abonadoSel.id)
    } else {
      cargarTodosLosEventos(desde, hasta)
    }
  }

  // --- Lógica de filtrado en el cliente ---
  const eventosFiltrados = eventos.filter(e => {
    // 1. Filtro responsable
    if (responsableSel && e.responsable_nombre !== responsableSel) return false
    // 2. Filtro Tipo de evento
    if (tipoSel && String(e.tipo_evento) !== tipoSel) return false
    // 3. Filtro ID de registro
    if (filtroId && String(e.id) !== filtroId.trim()) return false
    // 4. Filtro Texto/Comentario libre
    if (buscarTexto.trim()) {
      const q = buscarTexto.toLowerCase()
      const inComentario = (e.comentario || '').toLowerCase().includes(q)
      const inAbonado = (e.abonado_nombre || '').toLowerCase().includes(q)
      const inCod = (e.abonado_cod || '').toLowerCase().includes(q)
      if (!inComentario && !inAbonado && !inCod) return false
    }
    return true
  })

  // --- Exportadores ---
  const exportarExcel = () => {
    if (eventosFiltrados.length === 0) return
    const cod = abonadoSel?.cod || 'TODOS'
    const data = eventosFiltrados.map(e => ({
      ID: e.id,
      Fecha: new Date(e.created_at).toLocaleDateString('es-CL'),
      Hora: new Date(e.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      Abonado: `${e.abonado_cod || ''} - ${e.abonado_nombre || ''}`,
      Tipo: e.tipo_nombre || '',
      Responsable: e.responsable_nombre,
      Comentario: e.comentario || '',
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, `Registros`)
    XLSX.writeFile(wb, `bitacora_registros.xlsx`)
  }

  const exportarPDF = () => {
    if (eventosFiltrados.length === 0) return
    const filas = eventosFiltrados.map(e => {
      const d = new Date(e.created_at)
      const fecha = d.toLocaleDateString('es-CL')
      const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      return `<tr>
        <td>#${e.id}</td>
        <td>${fecha} ${hora}</td>
        <td><strong>${e.abonado_cod || ''}</strong> - ${e.abonado_nombre || ''}</td>
        <td>${e.tipo_nombre}</td>
        <td>${e.responsable_nombre}</td>
        <td>${e.comentario || ''}</td>
      </tr>`
    }).join('')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bitácora</title>
<style>
body{font-family:Calibri,sans-serif;font-size:10pt;padding:20px}
h1{font-size:14pt;color:#1e293b;border-bottom:2px solid #1e293b;padding-bottom:5px;margin-bottom:2px}
table{width:100%;border-collapse:collapse;margin-top:15px}
th{background:#1e293b;color:#fff;padding:6px 10px;text-align:left;font-size:9pt}
td{padding:6px 10px;border-bottom:1px solid #ddd;font-size:9pt}
tr:nth-child(even){background:#f8f8f8}
@media print{@page{size:landscape;margin:15mm}}
</style></head><body>
<h1>GAMA SEGURIDAD — REPORTE DE BITÁCORA</h1>
<p style="font-size:9pt;color:#666;">Fecha emisión: ${new Date().toLocaleString('es-CL')} | Total registros: ${eventosFiltrados.length}</p>
<table><thead><tr><th>ID</th><th>Fecha/Hora</th><th>Abonado</th><th>Tipo</th><th>Responsable</th><th>Comentario</th></tr></thead><tbody>${filas}</tbody></table>
<script>window.print()</script></body></html>`)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-2 pt-[3vh] overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-6xl h-[94vh] bg-[#f8fafc] text-[#1e293b] flex flex-col shadow-2xl overflow-hidden border border-slate-300 rounded-lg">
        
        {/* Header estilo Bootstrap limpio */}
        <div className="bg-white border-b border-slate-200 px-5 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-slate-800 tracking-tight">📖 Registros ({eventosFiltrados.length})</span>
            <button
              onClick={() => setMostrarNuevoForm(!mostrarNuevoForm)}
              className="bg-[#007bff] hover:bg-[#0069d9] text-white text-xs font-bold px-3 py-1.5 rounded transition-colors shadow-sm cursor-pointer"
            >
              {mostrarNuevoForm ? '✕ Cerrar formulario' : '＋ Crear registro'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportarExcel} className="bg-[#28a745] hover:bg-[#218838] text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors cursor-pointer">
              Exportar para Excel
            </button>
            <button onClick={exportarPDF} className="bg-[#dc3545] hover:bg-[#c82333] text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors cursor-pointer">
              Exportar para PDF
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-red-600 hover:bg-slate-100 text-3xl font-bold px-3.5 py-1 rounded-md transition-colors cursor-pointer leading-none flex items-center justify-center border border-transparent hover:border-slate-200"
              title="Cerrar ventana"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Formulario de Nuevo Registro (Expandible superior) */}
          {mostrarNuevoForm && (
            <div className="bg-[#f1f5f9] border-b border-slate-200 p-4 shrink-0 animate-slide-in">
              <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Crear Nuevo Registro en Bitácora</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Abonado *</label>
                    <input
                      type="text"
                      placeholder="Buscar abonado..."
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#007bff]"
                      value={filtroAbonadoInput}
                      onChange={e => { setFiltroAbonadoInput(e.target.value); setAbonadoSel(null) }}
                    />
                    {abonadoSugerencias.length > 0 && !abonadoSel && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded mt-1 z-20 max-h-40 overflow-y-auto shadow-lg">
                        {abonadoSugerencias.map(a => (
                          <div key={a.id} className="px-3 py-1.5 text-xs hover:bg-slate-100 cursor-pointer border-b border-slate-100" onClick={() => seleccionarAbonadoFiltro(a)}>
                            <span className="text-[#007bff] font-bold">{a.cod}</span> — {a.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Tipo de Evento *</label>
                    <select
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#007bff]"
                      value={tipoEvento}
                      onChange={e => setTipoEvento(e.target.value)}
                    >
                      {tipos.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Operador Responsable</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-600">
                      Administrador (ID: 1)
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Comentario / Detalle de la Novedad *</label>
                  <textarea
                    rows={2}
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-[#007bff] resize-none"
                    placeholder="Escribe el comentario del evento..."
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#007bff]">{mensaje}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setMostrarNuevoForm(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded transition-colors cursor-pointer">
                      Cancelar
                    </button>
                    <button
                      onClick={crearEvento}
                      disabled={enviando || !abonadoSel || !comentario.trim()}
                      className="bg-[#28a745] hover:bg-[#218838] text-white text-xs font-bold px-4 py-2 rounded transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {enviando ? 'Guardando...' : 'Guardar Registro'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Panel de Filtros Multivariable (Idéntico a bitacora.gamasecurity.cl) */}
          <div className="bg-white border-b border-slate-200 p-4 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              
              {/* Abonado */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-600 block mb-1">Abonado:</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Escribe código o nombre..."
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#007bff]"
                    value={filtroAbonadoInput}
                    onChange={e => { setFiltroAbonadoInput(e.target.value); setAbonadoSel(null) }}
                  />
                  {abonadoSugerencias.length > 0 && !abonadoSel && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded mt-1 z-20 max-h-40 overflow-y-auto shadow-lg">
                      {abonadoSugerencias.map(a => (
                        <div key={a.id} className="px-3 py-1.5 text-xs hover:bg-slate-100 cursor-pointer border-b border-slate-100" onClick={() => seleccionarAbonadoFiltro(a)}>
                          <span className="text-[#007bff] font-bold">{a.cod}</span> — {a.nombre}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Responsable */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-600 block mb-1">Responsable:</label>
                <select
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#007bff]"
                  value={responsableSel}
                  onChange={e => setResponsableSel(e.target.value)}
                >
                  <option value="">Seleccionar responsable</option>
                  {responsables.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-600 block mb-1">Tipo:</label>
                <select
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#007bff]"
                  value={tipoSel}
                  onChange={e => setTipoSel(e.target.value)}
                >
                  <option value="">Seleccionar tipo</option>
                  {tipos.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Texto / Palabra */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-600 block mb-1">Texto / Palabra:</label>
                <input
                  type="text"
                  placeholder="Texto del comentario..."
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#007bff]"
                  value={buscarTexto}
                  onChange={e => setBuscarTexto(e.target.value)}
                />
              </div>

              {/* Rango de Fechas */}
              <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center gap-3">
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 block mb-0.5">Desde:</label>
                  <input
                    type="date"
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#007bff]"
                    value={desde.split(' ')[0]}
                    onChange={e => { setDesde(e.target.value + ' 00:00'); setModoFecha('personalizado') }}
                  />
                </div>
                <span className="text-slate-400 font-bold self-end mb-1">→</span>
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 block mb-0.5">Hasta:</label>
                  <input
                    type="date"
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#007bff]"
                    value={hasta.split(' ')[0]}
                    onChange={e => { setHasta(e.target.value + ' 23:59'); setModoFecha('personalizado') }}
                  />
                </div>
              </div>

              {/* ID de Registro */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-600 block mb-1">ID:</label>
                <input
                  type="text"
                  placeholder="0000"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#007bff] font-mono"
                  value={filtroId}
                  onChange={e => setFiltroId(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 items-end">
                <button
                  onClick={aplicarFiltroManual}
                  className="flex-1 bg-[#28a745] hover:bg-[#218838] text-white text-xs font-bold py-2 rounded transition-colors cursor-pointer shadow-sm"
                >
                  🔍 Filtrar
                </button>
                <button
                  onClick={filtrarPorTurno}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded transition-colors cursor-pointer"
                  title="Filtrar eventos del turno actual"
                >
                  ⏱️ Turno
                </button>
                <button
                  onClick={limpiarFiltros}
                  className="bg-[#ffc107] hover:bg-[#e0a800] text-black text-xs font-bold py-2 px-3.5 rounded transition-colors cursor-pointer shadow-sm"
                >
                  ✕ Limpiar
                </button>
              </div>

            </div>
          </div>

          {/* Lienzo del Historial (Diseño de Tarjetas Bootstrap de bitacora.gamasecurity.cl) */}
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-3.5">
            {eventosFiltrados.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-16 bg-white border border-slate-200 rounded-lg">
                Ningún registro coincide con los filtros aplicados.
              </div>
            )}
            {eventosFiltrados.map(e => {
              const color = tipos.find(t => t.id === e.tipo_evento)?.color || '#6c757d'
              return (
                <div 
                  key={e.id} 
                  className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  style={{ borderLeftWidth: '6px', borderLeftColor: color, borderColor: `${color}40` }}
                >
                  
                  {/* Cabecera de la tarjeta */}
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#007bff] text-white text-[10.5px] font-black px-2.5 py-0.5 rounded font-mono">
                        #{e.abonado_cod}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {e.abonado_nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span>ID: <strong>{e.id}</strong></span>
                      <span>📅 {new Date(e.created_at).toLocaleString('es-CL')}</span>
                      <span>👤 {e.responsable_nombre}</span>
                    </div>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full border tracking-wide" style={{ backgroundColor: color + '15', color: color, borderColor: color + '40' }}>
                        Tipo: {e.tipo_nombre}
                      </span>
                    </div>
                    
                    {editandoId === e.id ? (
                      <div className="mt-2 flex flex-col md:flex-row gap-2">
                        <textarea
                          className="flex-1 border border-slate-300 rounded text-xs p-2 focus:outline-none focus:border-[#007bff] resize-none"
                          value={editComentario}
                          onChange={e2 => setEditComentario(e2.target.value)}
                          rows={2}
                        />
                        <div className="flex md:flex-col gap-1.5 justify-end">
                          <button className="bg-[#28a745] hover:bg-[#218838] text-white text-xs font-bold px-3 py-1.5 rounded cursor-pointer" onClick={guardarEdicion}>💾 Guardar</button>
                          <button className="bg-slate-300 hover:bg-slate-400 text-slate-700 text-xs font-bold px-3 py-1.5 rounded cursor-pointer" onClick={() => setEditandoId(null)}>✕ Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium bg-slate-50 border border-slate-100 rounded-md p-3">
                        {e.comentario}
                      </p>
                    )}

                    {/* Archivos adjuntos */}
                    {archivos[e.id] && (
                      <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-dashed border-slate-200">
                        {archivos[e.id].map(a => (
                          <div key={a.id} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded px-2.5 py-1 text-xs">
                            <a href={API_URL.replace('/api-bitacora.php', '') + '/' + a.url} target="_blank" className="text-[#007bff] hover:underline font-bold truncate max-w-[180px]">
                              📎 {a.nombre_original}
                            </a>
                            <span className="text-[10px] text-slate-500">({formatBytes(a.tamanio)})</span>
                            <button className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer" onClick={() => eliminarArchivo(a.id, e.id)}>✕</button>
                          </div>
                        ))}
                        <label className="text-xs text-[#007bff] cursor-pointer hover:underline flex items-center font-bold">
                          ＋ Adjuntar archivo
                          <input type="file" className="hidden" ref={fileInputRef} onChange={() => handleFileChange(e.id)} disabled={subiendoArchivo} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Footer de la tarjeta */}
                  <div className="bg-white border-t border-slate-100 px-4 py-2 flex justify-end gap-2.5">
                    <button
                      onClick={() => toggleArchivos(e.id)}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      📎 {archivos[e.id] ? 'Ocultar archivos' : 'Ver archivos / Adjuntar'}
                    </button>
                    <button
                      onClick={() => iniciarEdicion(e)}
                      className="text-xs text-[#007bff] hover:text-[#0056b3] flex items-center gap-1 font-bold cursor-pointer"
                    >
                      ✏️ Editar comentario
                    </button>
                  </div>

                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
