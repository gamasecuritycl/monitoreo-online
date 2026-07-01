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

  const fetchEventos = useCallback(async () => {
    try {
      let query = supabase
        .from('eventos_monitoreo')
        .select('*')
        .order('fecha_hora', { ascending: false })
        .limit(20)

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

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden select-none" style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}>
      {/* Top Bar */}
      <header className="flex items-center justify-between px-3 py-1 bg-[#0d1117] border-b border-[#2a2a4a] shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-blue-400 font-bold text-xs tracking-widest">GAMA SEGURIDAD</div>
          <div className="h-3 w-px bg-[#2a2a4a]" />
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Command Center</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-[10px]">LIVE</span>
          </div>
          <span className="text-slate-600">{eventos.length}/20</span>
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-36 bg-black border border-[#2a2a4a] rounded px-2 py-0.5 text-[11px] text-slate-300 placeholder-slate-700 focus:outline-none focus:border-blue-500/50"
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
