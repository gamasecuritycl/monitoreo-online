'use client'

import EventRow from './EventRow'
import type { EventoMonitoreo } from '@/lib/supabase'

const COLUMNAS = [
  { key: 'fecha', label: 'FECHA/HORA', w: '150px' },
  { key: 'cuenta', label: 'ABONADO', w: '70px' },
  { key: 'nombre', label: 'NOMBRE', w: '1fr' },
  { key: 'senal', label: 'SEÑAL', w: '130px' },
  { key: 'zn', label: 'ZN', w: '50px' },
  { key: 'par', label: 'PAR', w: '50px' },
  { key: 'us', label: 'US', w: '60px' },
  { key: 'un', label: 'UN', w: '60px' },
]

interface EventGridProps {
  eventos: EventoMonitoreo[]
  onEventClick: (evento: EventoMonitoreo) => void
}

export default function EventGrid({ eventos, onEventClick }: EventGridProps) {
  return (
    <div className="bg-[#0a0e1a] rounded-lg overflow-hidden border border-[#1a2340]">
      {/* Header */}
      <div className="flex bg-[#0d1225] border-b-2 border-[#1a2340]">
        {COLUMNAS.map((col) => (
          <div
            key={col.key}
            className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-[#1a2340] last:border-r-0"
            style={{ width: col.w, minWidth: col.w, flex: col.w === '1fr' ? 1 : undefined }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#1a2340]">
        {eventos.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-slate-500 text-xs">
            No hay eventos
          </div>
        ) : (
          eventos.map((evento) => (
            <EventRow
              key={evento.id}
              evento={evento}
              onClick={() => onEventClick(evento)}
            />
          ))
        )}
      </div>
    </div>
  )
}
