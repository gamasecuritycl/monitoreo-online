'use client'

import EventRow from './EventRow'
import type { EventoMonitoreo } from '@/lib/supabase'

interface EventGridProps {
  eventos: EventoMonitoreo[]
  onEventClick: (evento: EventoMonitoreo) => void
}

export default function EventGrid({ eventos, onEventClick }: EventGridProps) {
  return (
    <div className="rounded-xl overflow-hidden border-2 border-[#3B82F6]/30 shadow-lg shadow-blue-500/5 bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0d1225]">
            <th className="px-3 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-left border-r border-[#1a2340] w-[150px]">FECHA/HORA</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-left border-r border-[#1a2340] w-[70px]">ABONADO</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-left border-r border-[#1a2340]">NOMBRE</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-left border-r border-[#1a2340] w-[130px]">SEÑAL</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-left border-r border-[#1a2340] w-[50px]">ZN</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-left border-r border-[#1a2340] w-[50px]">PAR</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-left border-r border-[#1a2340] w-[60px]">US</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-left w-[60px]">UN</th>
          </tr>
        </thead>
        <tbody>
          {eventos.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-16 text-center text-slate-400 text-sm bg-white">
                No hay eventos
              </td>
            </tr>
          ) : (
            eventos.map((evento, idx) => (
              <EventRow
                key={evento.id}
                evento={evento}
                onClick={() => onEventClick(evento)}
                isLast={idx === eventos.length - 1}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
