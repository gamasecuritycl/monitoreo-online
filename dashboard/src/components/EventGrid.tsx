'use client'
// GAMA Command Center - Webhook deployment trigger

import { useRef, useEffect } from 'react'
import EventRow from './EventRow'
import type { EventoMonitoreo } from '@/lib/supabase'

interface EventGridProps {
  eventos: EventoMonitoreo[]
  onEventClick: (evento: EventoMonitoreo) => void
}

export default function EventGrid({ eventos, onEventClick }: EventGridProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [eventos.length])

  return (
    <div className="w-full h-full overflow-y-auto bg-[#070b13]">
      <table className="w-full border-collapse" style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#111827]">
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-left border border-[#1e293b] w-[155px]">FECHA/HORA</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-left border border-[#1e293b] w-[72px]">ABONADO</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-left border border-[#1e293b] w-[200px]">NOMBRE</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-left border border-[#1e293b] w-[140px]">SEÑAL</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border border-[#1e293b] w-[48px]">ZN</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border border-[#1e293b] w-[48px]">PAR</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border border-[#1e293b] w-[52px]">US</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border border-[#1e293b] w-[48px]">UN</th>
          </tr>
        </thead>
        <tbody>
          {eventos.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-2 py-8 text-center text-slate-600 text-xs border border-[#2a2a4a]">
                Esperando eventos...
              </td>
            </tr>
          ) : (
            eventos.map((evento) => (
              <EventRow key={evento.id} evento={evento} onClick={() => onEventClick(evento)} />
            ))
          )}
        </tbody>
      </table>
      <div ref={bottomRef} />
    </div>
  )
}
