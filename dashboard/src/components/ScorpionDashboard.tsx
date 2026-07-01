'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchEventos = useCallback(async () => {
    try {
      let query = supabase
        .from('eventos_monitoreo')
        .select('*')
        .order('fecha_hora', { ascending: false })
        .limit(200)

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

  useEffect(() => {
    const channel = supabase
      .channel('eventos-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos_monitoreo' }, () => fetchEventos())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchEventos])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [eventos])

  return (
    <div className="h-screen flex flex-col bg-[#0a0e1a] text-white overflow-hidden select-none">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-1.5 bg-[#0d1225] border-b border-[#1a2340] shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-blue-500 font-bold text-sm tracking-widest">GAMA SEGURIDAD</div>
          <div className="h-4 w-px bg-[#1a2340]" />
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Command Center v2.0</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400">LIVE</span>
          </div>
          <span className="text-slate-600">{eventos.length} eventos</span>
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-40 bg-[#0a0e1a] border border-[#1a2340] rounded px-2 py-0.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </header>

      {/* Event Grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
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
