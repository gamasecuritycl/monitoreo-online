'use client'

import { useState, useEffect, useRef } from 'react'

type Abonado = { id: number; cod: string; nombre: string; direccion: string; plan: string; ciudad: string }
type TipoEvento = { id: number; name: string; color: string }
type Evento = { id: number; comentario: string; tipo_evento: number; tipo_nombre: string; tipo_color: string; responsable_nombre: string; created_at: string; updated_at: string }
type Archivo = { id: number; nombre_original: string; url: string; tipo: string; tamanio: number; created_at: string }

const API_URL = 'https://bitacora.gamasecurity.cl/api-bitacora.php'

export default function BitacoraModal({ onClose, cuentaDefault }: { onClose: () => void; cuentaDefault?: string }) {
  const [abonados, setAbonados] = useState<Abonado[]>([])
  const [abonadoSel, setAbonadoSel] = useState<Abonado | null>(null)
  const [busqueda, setBusqueda] = useState(cuentaDefault || '')
  const [eventos, setEventos] = useState<Evento[]>([])
  const [tipos, setTipos] = useState<TipoEvento[]>([])
  const [comentario, setComentario] = useState('')
  const [tipoEvento, setTipoEvento] = useState('1')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [desde, setDesde] = useState(() => { const d = new Date(); return d.toISOString().split('T')[0] })
  const [hasta, setHasta] = useState(() => { const d = new Date(); return d.toISOString().split('T')[0] })
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-mono p-2" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full md:w-[1100px] h-[95vh] md:h-[680px] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1 shadow-[4px_4px_12px_rgba(0,0,0,0.6)] flex flex-col">
        <div className="bg-[#000080] text-white flex justify-between items-center px-3 py-1 text-sm font-bold shrink-0">
          <span>📋 BITÁCORA</span>
          <button onClick={onClose} className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0] text-sm">X</button>
        </div>

        <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
          <div className="relative">
            <input className="w-full border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white px-3 py-1.5 text-sm font-bold focus:outline-none"
              placeholder="Buscar abonado (cuenta o nombre)..."
              value={busqueda} onChange={e => { setBusqueda(e.target.value); setAbonadoSel(null); setEventos([]) }} />
            {abonados.length > 0 && !abonadoSel && (
              <div className="absolute top-full left-0 right-0 bg-white border-2 border-t-gray-700 border-l-gray-700 border-b-gray-700 border-r-gray-700 z-10 max-h-52 overflow-y-auto shadow-md">
                {abonados.map(a => (
                  <div key={a.id} className="px-3 py-1.5 text-sm font-bold hover:bg-[#000080] hover:text-white cursor-pointer border-b border-gray-300"
                    onClick={() => seleccionar(a)}>
                    <span className="text-[#000080]">{a.cod}</span> — {a.nombre} {a.direccion ? `(${a.direccion})` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex gap-3 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {abonadoSel && (
                <div className="flex gap-2 mb-2 shrink-0 items-center">
                  <input type="date" className="border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white px-2 py-1 text-sm font-bold"
                    value={desde} onChange={e => setDesde(e.target.value)} />
                  <span className="text-sm font-bold">→</span>
                  <input type="date" className="border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white px-2 py-1 text-sm font-bold"
                    value={hasta} onChange={e => setHasta(e.target.value)} />
                  <button className="bg-[#000080] text-white text-sm font-bold px-3 py-1 border-2 border-t-[#4444cc] border-l-[#4444cc] border-b-[#000044] border-r-[#000044] hover:bg-[#0000a0]"
                    onClick={() => abonadoSel && cargarEventos(abonadoSel.id)}>FILTRAR</button>
                  <button className="bg-gray-500 text-white text-sm font-bold px-3 py-1 border-2 border-t-gray-400 border-l-gray-400 border-b-gray-600 border-r-gray-600 hover:bg-gray-600"
                    onClick={() => { const d = new Date(); const h = d.toISOString().split('T')[0]; setDesde(h); setHasta(h); if (abonadoSel) cargarEventos(abonadoSel.id) }}>HOY</button>
                </div>
              )}
              <div className="flex-1 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white flex flex-col overflow-hidden">
                <div className="bg-[#000080] text-white text-sm font-bold px-3 py-1 shrink-0">
                  HISTORIAL ({eventos.length})
                </div>
                <div className="flex-1 overflow-y-auto">
                  {eventos.length === 0 && <div className="text-gray-400 text-sm text-center mt-12">Sin eventos en este período</div>}
                  {eventos.map((e, i) => {
                    const color = tipos.find(t => t.id === e.tipo_evento)?.color || '#666'
                    return (
                      <div key={e.id}>
                        {i > 0 && <hr className="border-t-2 border-gray-300 mx-3" />}
                        <div className="py-3 px-3 group">
                          <div className="flex items-start gap-2">
                            <span className="w-3 h-3 rounded-full inline-block shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-sm flex-wrap">
                                <span className="font-bold text-gray-500">{new Date(e.created_at).toLocaleString('es-CL')}</span>
                                {editandoId === e.id ? (
                                  <select className="text-sm font-bold border border-gray-400" value={editTipo} onChange={e2 => setEditTipo(e2.target.value)}>
                                    {tipos.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                ) : (
                                  <span className="font-bold" style={{ color }}>{e.tipo_nombre}</span>
                                )}
                                <span className="text-gray-400">— {e.responsable_nombre}</span>
                                <span className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="text-sm text-[#000080] font-bold hover:underline"
                                    onClick={() => iniciarEdicion(e)} title="Editar">✏️</button>
                                  <button className="text-sm text-gray-500 font-bold hover:underline"
                                    onClick={() => toggleArchivos(e.id)} title="Archivos">📎</button>
                                </span>
                              </div>
                              {editandoId === e.id ? (
                                <div className="mt-2 flex gap-1">
                                  <textarea className="flex-1 border border-gray-400 text-sm p-1 resize-none"
                                    value={editComentario} onChange={e2 => setEditComentario(e2.target.value)} rows={2} />
                                  <div className="flex flex-col gap-0.5">
                                    <button className="bg-[#000080] text-white text-sm font-bold px-2 py-0.5" onClick={guardarEdicion}>💾</button>
                                    <button className="bg-gray-500 text-white text-sm font-bold px-2 py-0.5" onClick={() => setEditandoId(null)}>✕</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm mt-1 text-gray-800 whitespace-pre-wrap">{e.comentario}</div>
                              )}
                              {archivos[e.id] && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {archivos[e.id].map(a => (
                                    <div key={a.id} className="flex items-center gap-1 bg-gray-100 border border-gray-300 px-2 py-0.5 text-sm">
                                      <a href={API_URL.replace('/api-bitacora.php', '') + '/' + a.url} target="_blank" className="text-[#000080] font-bold hover:underline truncate max-w-[160px]">
                                        {a.nombre_original}
                                      </a>
                                      <span className="text-gray-400">({formatBytes(a.tamanio)})</span>
                                      <button className="text-red-600 font-bold hover:text-red-800"
                                        onClick={() => eliminarArchivo(a.id, e.id)}>✕</button>
                                    </div>
                                  ))}
                                  <label className="text-sm text-[#000080] font-bold cursor-pointer hover:underline">
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

            <div className="w-72 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e0e0e0] flex flex-col p-3 shrink-0">
              <div className="text-[#000080] font-bold text-sm border-b border-gray-400 pb-1 mb-3">NUEVO EVENTO</div>
              {!abonadoSel ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm text-center p-3">Selecciona un abonado primero</div>
              ) : (
                <>
                  <div className="text-sm font-bold text-gray-700 mb-2">{abonadoSel.cod} — {abonadoSel.nombre}</div>
                  <label className="text-sm font-bold text-gray-600 mb-1">Tipo</label>
                  <select className="w-full border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white px-2 py-1 text-sm font-bold mb-3"
                    value={tipoEvento} onChange={e => setTipoEvento(e.target.value)}>
                    {tipos.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <label className="text-sm font-bold text-gray-600 mb-1">Comentario</label>
                  <textarea className="w-full flex-1 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white p-2 text-sm resize-none focus:outline-none"
                    placeholder="Escribe el evento..." value={comentario} onChange={e => setComentario(e.target.value)} />
                  {mensaje && <div className="text-sm font-bold mt-2 text-center">{mensaje}</div>}
                  <button className="mt-3 bg-[#000080] text-white font-bold text-sm py-2 border-2 border-t-[#4444cc] border-l-[#4444cc] border-b-[#000044] border-r-[#000044] hover:bg-[#0000a0] disabled:opacity-50"
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
