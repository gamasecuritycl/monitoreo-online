'use client'

import { useState, useEffect } from 'react'

type Abonado = { id: number; cod: string; nombre: string; direccion: string; plan: string; ciudad: string }
type TipoEvento = { id: number; name: string; color: string }
type Evento = { id: number; comentario: string; tipo_evento: number; tipo_nombre: string; tipo_color: string; responsable_nombre: string; created_at: string }

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

  // Buscar abonados al escribir
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

  // Cargar tipos al montar
  useEffect(() => {
    fetch(`${API_URL}?action=tipos`).then(r => r.ok && r.json()).then(d => d && setTipos(d)).catch(() => {})
  }, [])

  // Cargar eventos al seleccionar abonado
  const cargarEventos = async (id: number) => {
    try {
      const r = await fetch(`${API_URL}?action=eventos&id=${id}`)
      if (r.ok) setEventos(await r.json())
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-mono p-2">
      <div className="w-full md:w-[800px] h-[90vh] md:h-[540px] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1 shadow-[4px_4px_12px_rgba(0,0,0,0.6)] flex flex-col">
        {/* Barra título */}
        <div className="bg-[#000080] text-white flex justify-between items-center px-2 py-0.5 text-xs font-bold shrink-0">
          <span>📋 BITÁCORA</span>
          <button onClick={onClose} className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-1.5 leading-none hover:bg-[#d0d0d0]">X</button>
        </div>

        {/* Contenido */}
        <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
          {/* Buscador de abonado */}
          <div className="relative">
            <input
              className="w-full border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white px-2 py-1 text-xs font-bold focus:outline-none"
              placeholder="Buscar abonado (cuenta o nombre)..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setAbonadoSel(null); setEventos([]) }}
            />
            {abonados.length > 0 && !abonadoSel && (
              <div className="absolute top-full left-0 right-0 bg-white border-2 border-t-gray-700 border-l-gray-700 border-b-gray-700 border-r-gray-700 z-10 max-h-40 overflow-y-auto shadow-md">
                {abonados.map(a => (
                  <div key={a.id} className="px-2 py-1 text-xs font-bold hover:bg-[#000080] hover:text-white cursor-pointer border-b border-gray-300"
                    onClick={() => seleccionar(a)}>
                    <span className="text-[#000080]">{a.cod}</span> — {a.nombre} {a.direccion ? `(${a.direccion})` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex gap-2 overflow-hidden">
            {/* Eventos */}
            <div className="flex-1 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white flex flex-col overflow-hidden">
              <div className="bg-[#000080] text-white text-[10px] font-bold px-2 py-0.5 shrink-0">HISTORIAL</div>
              <div className="flex-1 overflow-y-auto p-1">
                {eventos.length === 0 && <div className="text-gray-400 text-xs text-center mt-8">Sin eventos registrados</div>}
                {eventos.map(e => {
                  const color = tipos.find(t => t.id === e.tipo_evento)?.color || '#666'
                  return (
                    <div key={e.id} className="border-b border-gray-200 py-1.5 px-1 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-[10px] font-bold text-gray-500">{new Date(e.created_at).toLocaleString('es-CL')}</span>
                        <span className="text-[10px] font-bold" style={{ color }}>{e.tipo_nombre}</span>
                        <span className="text-[10px] text-gray-400">— {e.responsable_nombre}</span>
                      </div>
                      <div className="text-xs mt-0.5 ml-3.5 text-gray-800">{e.comentario}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Formulario crear evento */}
            <div className="w-64 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-[#e0e0e0] flex flex-col p-2 shrink-0">
              <div className="text-[#000080] font-bold text-xs border-b border-gray-400 pb-1 mb-2">NUEVO EVENTO</div>
              {!abonadoSel ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-xs text-center p-2">Selecciona un abonado primero</div>
              ) : (
                <>
                  <div className="text-[10px] font-bold text-gray-700 mb-1">Abonado: {abonadoSel.cod} — {abonadoSel.nombre}</div>
                  <label className="text-[10px] font-bold text-gray-600 mb-0.5">Tipo</label>
                  <select className="w-full border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white px-1 py-0.5 text-xs font-bold mb-2"
                    value={tipoEvento} onChange={e => setTipoEvento(e.target.value)}>
                    {tipos.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <label className="text-[10px] font-bold text-gray-600 mb-0.5">Comentario</label>
                  <textarea className="w-full flex-1 border-2 border-t-gray-700 border-l-gray-700 border-b-white border-r-white bg-white p-1 text-xs resize-none focus:outline-none"
                    placeholder="Escribe el evento..."
                    value={comentario} onChange={e => setComentario(e.target.value)} />
                  {mensaje && <div className="text-[10px] font-bold mt-1 text-center">{mensaje}</div>}
                  <button className="mt-2 bg-[#000080] text-white font-bold text-xs py-1.5 border-2 border-t-[#4444cc] border-l-[#4444cc] border-b-[#000044] border-r-[#000044] hover:bg-[#0000a0] disabled:opacity-50"
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
