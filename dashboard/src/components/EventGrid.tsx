'use client'

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
    <div className="min-h-full">
      <table className="w-full text-[11px] font-mono">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#0d1225] text-slate-500 uppercase tracking-wider text-[10px]">
            <th className="text-left px-3 py-1.5 font-medium w-[150px]">FECHA/HORA</th>
            <th className="text-left px-3 py-1.5 font-medium w-[70px]">ABONADO</th>
            <th className="text-left px-3 py-1.5 font-medium">NOMBRE</th>
            <th className="text-left px-3 py-1.5 font-medium w-[120px]">SEÑAL</th>
            <th className="text-left px-3 py-1.5 font-medium w-[50px]">ZN</th>
            <th className="text-left px-3 py-1.5 font-medium w-[50px]">PAR</th>
            <th className="text-left px-3 py-1.5 font-medium w-[60px]">US</th>
            <th className="text-left px-3 py-1.5 font-medium w-[60px]">UN</th>
          </tr>
        </thead>
        <tbody>
          {eventos.map((evento) => (
            <EventRow
              key={evento.id}
              evento={evento}
              onClick={() => onEventClick(evento)}
            />
          ))}
        </tbody>
      </table>
      <div ref={bottomRef} />
    </div>
  )
}
