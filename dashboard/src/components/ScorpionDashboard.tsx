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
        .order('fecha_hora', { ascending: false })
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

  // Direct Push Subscription (low-latency postgres_changes)
  useEffect(() => {
    const channel = supabase
      .channel('eventos-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'eventos_monitoreo' },
        (payload) => {
          const newEvent = payload.new as EventoMonitoreo
          setEventos((prev) => {
            // Deduplicate if needed
            if (prev.some((e) => e.id === newEvent.id)) return prev
            const next = [...prev, newEvent]
            // Maintain the 50 events buffer size
            if (next.length > 50) {
              next.shift()
            }
            return next
          })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#070b13] text-slate-100 overflow-hidden select-none" style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}>
      {/* Top Bar Navy Bevel Style */}
      <header className="flex items-center justify-between px-4 py-1.5 bg-[#0f172a] border-b border-[#1e293b] shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="text-blue-400 font-bold text-xs tracking-widest">GAMA SEGURIDAD</div>
          <div className="h-3.5 w-px bg-[#1e293b]" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Command Center v2.0</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
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
            className="w-48 bg-black border border-[#1e293b] rounded-sm px-2 py-0.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
          />
        </div>
      </header>

      {/* Event Grid */}
      <div className="flex-1 overflow-hidden">
        <EventGrid
          eventos={eventos}
          onEventClick={(e) => setEventoSeleccionado(e)}
        />
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
