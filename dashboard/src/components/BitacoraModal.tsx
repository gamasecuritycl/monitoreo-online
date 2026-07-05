'use client'

import { useState, useEffect, useRef } from 'react'

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
  const [abonados, setAbonados] = useState<Abonado[]>([])
  const [abonadoSel, setAbonadoSel] = useState<Abonado | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const ultimos7 = getUltimos7Dias()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [tipos, setTipos] = useState<TipoEvento[]>([])
  const [comentario, setComentario] = useState('')
  const [tipoEvento, setTipoEvento] = useState('1')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [desde, setDesde] = useState(ultimos7.desde)
  const [hasta, setHasta] = useState(ultimos7.hasta)
  const [modoFecha, setModoFecha] = useState<'turno' | 'semana' | 'personalizado'>('semana')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editComentario, setEditComentario] = useState('')
  const [editTipo, setEditTipo] = useState('')
  const [archivos, setArchivos] = useState<Record<number, Archivo[]>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)

  useEffect(() => {
    if (busqueda.length < 1) { setAbonados([]); return }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}?action=abonados&q=${encodeURIComponent(busqueda)}`)
        if (r.ok) setAbonados(await r.json())
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [busqueda])

  useEffect(() => {
    fetch(`${API_URL}?action=tipos`).then(r => r.ok && r.json()).then(d => d && setTipos(d)).catch(() => {})

    // Cargar eventos del turno actual (sin filtro de abonado)
    const t = getTurnoInfo()
    setDesde(t.desde)
    setHasta(t.hasta)
    fetch(`${API_URL}?action=eventos&desde=${encodeURIComponent(t.desde)}&hasta=${encodeURIComponent(t.hasta)}`).then(r => r.ok && r.json()).then(ev => ev && setEventos(ev)).catch(() => {})
  }, [])

  const cargarEventos = async (id: number) => {
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

  const seleccionar = (a: Abonado) => {
    setAbonadoSel(a)
    setBusqueda(`${a.cod} - ${a.nombre}`)
    setAbonados([])
    cargarEventos(a.id)
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
        setMensaje('✅ Evento registrado')
        setComentario('')
        cargarEventos(abonadoSel.id)
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
        if (abonadoSel) cargarEventos(abonadoSel.id)
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

  const volverTurno = () => {
    const t = getTurnoInfo()
    setDesde(t.desde)
    setHasta(t.hasta)
    setModoFecha('turno')
    setAbonadoSel(null)
    setBusqueda('')
    fetch(`${API_URL}?action=eventos&desde=${encodeURIComponent(t.desde)}&hasta=${encodeURIComponent(t.hasta)}`).then(r => r.ok && r.json()).then(ev => ev && setEventos(ev)).catch(() => {})
  }

  const exportarExcel = () => {
    if (!abonadoSel || eventos.length === 0) return
    const rows = eventos.map(e => {
      const d = new Date(e.created_at)
      const fecha = d.toLocaleDateString('es-CL')
      const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      const tipo = (tipos.find(t => t.id === e.tipo_evento)?.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const comentario = (e.comentario || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return { fecha, hora, tipo, responsable: e.responsable_nombre, comentario }
    })
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="10"/></Style>
  <Style ss:ID="sHeader"><Font ss:Bold="1" ss:Size="10"/><Interior ss:Color="#1e293b" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF"/></Style>
 </Styles>
 <Worksheet ss:Name="Bitácora ${abonadoSel.cod}">
  <Table>
   <Column ss:AutoFitWidth="1"/>
   <Column ss:AutoFitWidth="1"/>
   <Column ss:AutoFitWidth="1"/>
   <Column ss:AutoFitWidth="1"/>
   <Column ss:AutoFitWidth="1"/>
   <Row ss:StyleID="sHeader">
    <Cell><Data ss:Type="String">Fecha</Data></Cell>
    <Cell><Data ss:Type="String">Hora</Data></Cell>
    <Cell><Data ss:Type="String">Tipo</Data></Cell>
    <Cell><Data ss:Type="String">Responsable</Data></Cell>
    <Cell><Data ss:Type="String">Comentario</Data></Cell>
   </Row>
${rows.map(r => `   <Row>
    <Cell><Data ss:Type="String">${r.fecha}</Data></Cell>
    <Cell><Data ss:Type="String">${r.hora}</Data></Cell>
    <Cell><Data ss:Type="String">${r.tipo}</Data></Cell>
    <Cell><Data ss:Type="String">${r.responsable}</Data></Cell>
    <Cell><Data ss:Type="String">${r.comentario}</Data></Cell>
   </Row>`).join('\n')}
  </Table>
 </Worksheet>
</Workbook>`
    const blob = new Blob([xml], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `bitacora_${abonadoSel.cod}.xml`; a.click()
    URL.revokeObjectURL(url)
  }

  const exportarPDF = () => {
    if (!abonadoSel || eventos.length === 0) return
    const turno = getTurnoInfo().nombre
    const filas = eventos.map(e => {
      const d = new Date(e.created_at)
      const fecha = d.toLocaleDateString('es-CL')
      const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      const tipo = tipos.find(t => t.id === e.tipo_evento)?.name || ''
      return `<tr><td>${fecha}</td><td>${hora}</td><td>${tipo}</td><td>${e.responsable_nombre}</td><td>${e.comentario || ''}</td></tr>`
    }).join('')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bitácora - ${abonadoSel.cod}</title>
<style>
body{font-family:Calibri,sans-serif;font-size:10pt;padding:20px}
h1{font-size:14pt;color:#1e293b;border-bottom:2px solid #1e293b;padding-bottom:5px}
h2{font-size:10pt;color:#666;font-weight:normal;margin-top:-5px}
table{width:100%;border-collapse:collapse;margin-top:10px}
th{background:#1e293b;color:#fff;padding:5px 8px;text-align:left;font-size:9pt}
td{padding:4px 8px;border-bottom:1px solid #ddd;font-size:9pt}
tr:nth-child(even){background:#f8f8f8}
@media print{@page{size:landscape;margin:15mm}}
</style></head><body>
<h1>BITÁCORA VIRTUAL — ${abonadoSel.cod} ${abonadoSel.nombre}</h1>
<h2>${turno} | ${eventos.length} eventos</h2>
<table><thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Responsable</th><th>Comentario</th></tr></thead><tbody>${filas}</tbody></table>
<script>window.print()</script></body></html>`)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-2 pt-[5vh] overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full md:w-[1200px] h-[95vh] bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-[#1e293b] flex justify-between items-center px-4 py-2 shrink-0 border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <span className="text-slate-100 font-bold text-base tracking-wide">📋 BITÁCORA VIRTUAL</span>
            {abonadoSel && (
              <span className="bg-[#334155] text-cyan-300 text-xs font-bold px-2 py-0.5 rounded">{abonadoSel.cod} — {abonadoSel.nombre}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {eventos.length > 0 && (
              <>
                <button onClick={exportarExcel} className="text-xs text-slate-400 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-slate-700 transition-colors" title="Exportar Excel XML">📊 XLS</button>
                <button onClick={exportarPDF} className="text-xs text-slate-400 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-slate-700 transition-colors" title="Ver PDF para imprimir">📄 PDF</button>
              </>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold px-1.5 leading-none hover:bg-slate-700 rounded">&times;</button>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          {/* Buscador */}
          <div className="relative">
            <input className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="Buscar abonado (cuenta o nombre)..."
              value={busqueda} onChange={e => { setBusqueda(e.target.value); setAbonadoSel(null); setEventos([]) }} />
            {abonados.length > 0 && !abonadoSel && (
              <div className="absolute top-full left-0 right-0 bg-[#1e293b] border border-[#334155] rounded mt-1 z-10 max-h-52 overflow-y-auto shadow-lg">
                {abonados.map(a => (
                  <div key={a.id} className="px-3 py-2 text-sm text-slate-200 hover:bg-cyan-900/40 cursor-pointer border-b border-[#334155]"
                    onClick={() => seleccionar(a)}>
                    <span className="text-cyan-400 font-bold">{a.cod}</span> — {a.nombre} {a.direccion ? `(${a.direccion})` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex gap-3 overflow-hidden">
            {/* Eventos */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {abonadoSel && (
                <div className="flex gap-2 mb-2 shrink-0 items-center">
                  <input type="date" className="bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    value={desde.split(' ')[0]} onChange={e => { setDesde(e.target.value + ' 00:00'); setModoFecha('personalizado') }} />
                  <span className="text-slate-500 text-sm">→</span>
                  <input type="date" className="bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    value={hasta.split(' ')[0]} onChange={e => { setHasta(e.target.value + ' 23:59'); setModoFecha('personalizado') }} />
                  <button className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-bold px-3 py-1 rounded transition-colors"
                    onClick={() => abonadoSel && cargarEventos(abonadoSel.id)}>FILTRAR</button>
                  <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold px-3 py-1 rounded transition-colors"
                    onClick={volverTurno}>TURNO</button>
                  {modoFecha !== 'semana' && (
                    <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold px-3 py-1 rounded transition-colors"
                      onClick={() => { const d = getUltimos7Dias(); setDesde(d.desde); setHasta(d.hasta); setModoFecha('semana'); if (abonadoSel) cargarEventos(abonadoSel.id); else fetch(`${API_URL}?action=eventos&desde=${encodeURIComponent(d.desde)}&hasta=${encodeURIComponent(d.hasta)}`).then(r => r.ok && r.json()).then(ev => ev && setEventos(ev)).catch(() => {}) }}>7 DÍAS</button>
                  )}
                </div>
              )}
              <div className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded-lg flex flex-col overflow-hidden">
                <div className="bg-[#1e293b] text-slate-200 text-sm font-bold px-4 py-1.5 shrink-0 flex justify-between items-center">
                  <span>HISTORIAL <span className="text-slate-500">({eventos.length})</span></span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {eventos.length === 0 && <div className="text-slate-600 text-sm text-center mt-16">Sin eventos en este turno o selecciona un abonado</div>}
                  {eventos.map((e, i) => {
                    const color = tipos.find(t => t.id === e.tipo_evento)?.color || '#666'
                    return (
                      <div key={e.id}>
                        {i > 0 && <hr className="border-t border-[#1e293b] mx-4" />}
                        <div className="py-3 px-4 group hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 mt-1.5" style={{ backgroundColor: color }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-sm flex-wrap">
                                <span className="font-semibold text-slate-400">{new Date(e.created_at).toLocaleString('es-CL')}</span>
                                {editandoId === e.id ? (
                                  <select className="text-sm font-semibold bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-slate-200"
                                    value={editTipo} onChange={e2 => setEditTipo(e2.target.value)}>
                                    {tipos.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                ) : (
                                  <span className="font-semibold" style={{ color }}>{e.tipo_nombre}</span>
                                )}
                                <span className="text-slate-600">— {e.responsable_nombre}</span>
                                <span className="text-cyan-600 text-xs ml-2">{e.abonado_cod}</span>
                                <span className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="text-sm text-cyan-400 hover:text-cyan-300"
                                    onClick={() => iniciarEdicion(e)} title="Editar">✏️</button>
                                  <button className="text-sm text-slate-500 hover:text-slate-300"
                                    onClick={() => toggleArchivos(e.id)} title="Archivos">📎</button>
                                </span>
                              </div>
                              {editandoId === e.id ? (
                                <div className="mt-2 flex gap-1">
                                  <textarea className="flex-1 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200 p-1.5 resize-none"
                                    value={editComentario} onChange={e2 => setEditComentario(e2.target.value)} rows={2} />
                                  <div className="flex flex-col gap-0.5">
                                    <button className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-bold px-2 py-0.5 rounded" onClick={guardarEdicion}>💾</button>
                                    <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold px-2 py-0.5 rounded" onClick={() => setEditandoId(null)}>✕</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm mt-1 text-slate-300 whitespace-pre-wrap">{e.comentario}</div>
                              )}
                              {archivos[e.id] && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {archivos[e.id].map(a => (
                                    <div key={a.id} className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-sm">
                                      <a href={API_URL.replace('/api-bitacora.php', '') + '/' + a.url} target="_blank" className="text-cyan-400 hover:text-cyan-300 truncate max-w-[160px]">
                                        {a.nombre_original}
                                      </a>
                                      <span className="text-slate-500">({formatBytes(a.tamanio)})</span>
                                      <button className="text-red-400 hover:text-red-300 font-bold"
                                        onClick={() => eliminarArchivo(a.id, e.id)}>✕</button>
                                    </div>
                                  ))}
                                  <label className="text-sm text-cyan-400 cursor-pointer hover:text-cyan-300">
                                    + Archivo
                                    <input type="file" className="hidden" ref={fileInputRef}
                                      onChange={() => handleFileChange(e.id)} disabled={subiendoArchivo} />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Panel nuevo evento */}
            <div className="w-72 bg-[#1e293b] border border-[#334155] rounded-lg flex flex-col p-4 shrink-0">
              <div className="text-slate-200 font-bold text-sm border-b border-[#334155] pb-2 mb-3">NUEVO EVENTO</div>
              {!abonadoSel ? (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-sm text-center p-3">Selecciona un abonado primero</div>
              ) : (
                <>
                  <div className="text-sm font-semibold text-slate-300 mb-2">{abonadoSel.cod} — {abonadoSel.nombre}</div>
                  <label className="text-sm font-semibold text-slate-400 mb-1">Tipo</label>
                  <select className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 mb-3"
                    value={tipoEvento} onChange={e => setTipoEvento(e.target.value)}>
                    {tipos.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <label className="text-sm font-semibold text-slate-400 mb-1">Comentario</label>
                  <textarea className="w-full flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200 resize-none focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                    placeholder="Escribe el evento..." value={comentario} onChange={e => setComentario(e.target.value)} />
                  {mensaje && <div className="text-sm font-semibold mt-2 text-center text-cyan-300">{mensaje}</div>}
                  <button className="mt-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-sm py-2 rounded transition-colors disabled:opacity-50"
                    disabled={enviando || !comentario.trim()} onClick={crearEvento}>
                    {enviando ? 'ENVIANDO...' : 'REGISTRAR EVENTO'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
