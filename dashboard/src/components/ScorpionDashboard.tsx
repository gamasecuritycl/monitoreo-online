'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, type EventoMonitoreo } from '@/lib/supabase'
import EventGrid from './EventGrid'
import FooterActions from './FooterActions'
import ExpedienteModal from './ExpedienteModal'
import ToolModal from './ToolModal'

export default function ScorpionDashboard() {
  const [eventos, setEventos] = useState<EventoMonitoreo[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoMonitoreo | null>(null)
  const [modalActivo, setModalActivo] = useState<string | null>(null)

  // Fetch initial events (circular buffer of last 50 events)
  const fetchEventos = useCallback(async () => {
    try {
      let query = supabase
        .from('eventos_monitoreo')
        .select('*')
        .order('id', { ascending: false })
        .limit(50)

      if (busqueda.trim()) {
        query = query.or(`cuenta.ilike.%${busqueda}%,nombre_abonado.ilike.%${busqueda}%`)
      }

      const { data } = await query
      if (data) setEventos(data.reverse())
    } catch (err) {
      console.error('Error:', err)
    }
  }, [busqueda])

  useEffect(() => { fetchEventos() }, [fetchEventos])

  // ── Polling every 3 seconds: guaranteed fallback for real-time ──
  // Tracks the highest ID already shown to avoid redundant re-renders.
  useEffect(() => {
    let latestId = 0

    const poll = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .order('id', { ascending: false })
          .limit(50)

        if (!data || data.length === 0) return

        const maxId = data[0].id as number
        if (maxId <= latestId) return          // nothing new

        latestId = maxId
        // Apply search filter client-side if active
        const filtered = busqueda.trim()
          ? data.filter(
              (e) =>
                e.cuenta?.toLowerCase().includes(busqueda.toLowerCase()) ||
                e.nombre_abonado?.toLowerCase().includes(busqueda.toLowerCase())
            )
          : data

        setEventos([...filtered].reverse())
      } catch (_) {}
    }

    // Run once immediately, then every 3 seconds
    poll()
    const timer = setInterval(poll, 3000)
    return () => clearInterval(timer)
  }, [busqueda])

  // ── WebSocket push: catches events instantly when replication is ON ──
  useEffect(() => {
    const channel = supabase
      .channel('eventos-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'eventos_monitoreo' },
        (payload) => {
          const newEvent = payload.new as EventoMonitoreo
          setEventos((prev) => {
            if (prev.some((e) => e.id === newEvent.id)) return prev
            const next = [...prev, newEvent]
            if (next.length > 50) next.shift()
            return next
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#070b13] text-slate-100 overflow-hidden select-none relative" style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}>

      {/* ⚔ SELLO ARCÁNGEL MIGUEL — Watermark de protección. Siempre presente, raramente visto. ⚔ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 overflow-hidden"
        style={{ opacity: 0.018 }}
      >
        <svg width="520" height="520" viewBox="0 0 520 520" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Escudo */}
          <path d="M260 40 L460 120 L460 280 Q460 400 260 480 Q60 400 60 280 L60 120 Z"
            stroke="#4fa3e0" strokeWidth="3" fill="none"/>
          {/* Cruz interior */}
          <line x1="260" y1="100" x2="260" y2="420" stroke="#4fa3e0" strokeWidth="2"/>
          <line x1="100" y1="260" x2="420" y2="260" stroke="#4fa3e0" strokeWidth="2"/>
          {/* Espada vertical */}
          <line x1="260" y1="30" x2="260" y2="490" stroke="#7ec8f7" strokeWidth="4" strokeLinecap="round"/>
          <line x1="200" y1="120" x2="320" y2="120" stroke="#7ec8f7" strokeWidth="4" strokeLinecap="round"/>
          {/* Llama en la punta */}
          <ellipse cx="260" cy="30" rx="10" ry="18" fill="#4fa3e0" opacity="0.9"/>
          {/* Círculo exterior */}
          <circle cx="260" cy="260" r="230" stroke="#4fa3e0" strokeWidth="1.5" strokeDasharray="12 6"/>
          {/* Estrellas en los cuadrantes */}
          <text x="155" y="175" fill="#7ec8f7" fontSize="28" textAnchor="middle">✶</text>
          <text x="365" y="175" fill="#7ec8f7" fontSize="28" textAnchor="middle">✶</text>
          <text x="155" y="375" fill="#7ec8f7" fontSize="28" textAnchor="middle">✶</text>
          <text x="365" y="375" fill="#7ec8f7" fontSize="28" textAnchor="middle">✶</text>
          {/* Texto del sello */}
          <text x="260" y="510" fill="#7ec8f7" fontSize="11" textAnchor="middle" letterSpacing="4">GAMA · PROTECCIÓN · MIGUEL</text>
        </svg>
      </div>
      {/* Top Bar Navy Bevel Style (Responsive) */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 bg-[#0f172a] border-b border-[#1e293b] shrink-0 shadow-md gap-2 sm:gap-0">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-blue-400 font-bold text-xs tracking-widest">GAMA SEGURIDAD</div>
          <div className="hidden sm:block h-3.5 w-px bg-[#1e293b]" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Command Center v2.0</span>
        </div>
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4 text-[10px] w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
            <span className="text-green-400 font-bold text-[10px] tracking-wider">LIVE</span>
          </div>
          <span className="text-slate-500 font-mono">BUFFER: {eventos.length}/50</span>
          <input
            type="text"
            placeholder="Buscar abonado/cuenta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-48 bg-black border border-[#1e293b] rounded-sm px-2 py-0.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
          />
        </div>
      </header>

      {/* Contenedor Principal de Dos Columnas: Izquierda (Tabla Fija), Derecha (Espacio para Cuadrados) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lado Izquierdo: Tabla de Eventos con ancho fijo 820px, no se deforma */}
        <div className="w-[820px] shrink-0 border-r border-[#1e293b] flex flex-col h-full bg-[#070b13]">
          <EventGrid
            eventos={eventos}
            onEventClick={(e) => setEventoSeleccionado(e)}
          />
        </div>

        {/* Lado Derecho: Espacio libre para los futuros bloques de información */}
        <div className="flex-1 overflow-y-auto bg-[#040810] p-4 flex flex-col gap-4">
          <div className="border border-dashed border-[#1e293b]/60 rounded-md p-8 text-center text-xs text-slate-500 my-auto">
            [Panel de Información Lateral — Espacio Reservado]
          </div>
        </div>
      </div>

      {/* Expediente Modal */}
      {eventoSeleccionado && (
        <ExpedienteModal
          evento={eventoSeleccionado}
          onClose={() => setEventoSeleccionado(null)}
        />
      )}

      {/* Tool Modals */}
      {modalActivo && (
        <ToolModal
          modalId={modalActivo}
          onClose={() => setModalActivo(null)}
        />
      )}

      {/* Footer */}
      <FooterActions onModalOpen={setModalActivo} />
    </div>
  )
}
