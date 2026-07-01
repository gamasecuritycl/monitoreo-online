'use client'

import type { EventoMonitoreo } from '@/lib/supabase'

interface EventRowProps {
  evento: EventoMonitoreo
  onClick: () => void
}

function getSignalStyle(evento: string): { color: string; badge: string } {
  const upper = evento.toUpperCase()
  if (upper.includes('ROBO') || upper.includes('PANICO') || upper.includes('INCENDIO'))
    return { color: '#FF4D4D', badge: 'bg-[#FF4D4D]' }
  if (upper.includes('CIERRE'))
    return { color: '#3B82F6', badge: 'bg-[#3B82F6]' }
  if (upper.includes('APERTURA'))
    return { color: '#22C55E', badge: 'bg-[#22C55E]' }
  if (upper.includes('AUTOTEST'))
    return { color: '#9CA3AF', badge: 'bg-[#9CA3AF]' }
  return { color: '#64748b', badge: 'bg-slate-500' }
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function EventRow({ evento, onClick }: EventRowProps) {
  const signal = getSignalStyle(evento.evento)

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer hover:brightness-110 transition-all"
    >
      <div className="px-3 py-1.5 text-[11px] text-slate-600 font-mono whitespace-nowrap border-r border-[#334155] bg-white" style={{ width: '150px', minWidth: '150px' }}>
        {formatFecha(evento.fecha_hora)}
      </div>
      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-700 font-mono border-r border-[#334155] bg-white" style={{ width: '70px', minWidth: '70px' }}>
        {evento.cuenta}
      </div>
      <div className="px-3 py-1.5 text-[11px] text-slate-600 truncate border-r border-[#334155] bg-white" style={{ flex: 1, minWidth: 0 }}>
        {evento.nombre_abonado}
      </div>
      <div className="px-3 py-1.5 text-[11px] font-semibold font-mono whitespace-nowrap border-r border-[#334155] bg-white" style={{ width: '130px', minWidth: '130px', color: signal.color }}>
        {evento.evento}
      </div>
      <div className="px-3 py-1.5 text-[11px] text-slate-500 font-mono border-r border-[#334155] bg-white" style={{ width: '50px', minWidth: '50px' }}>
        {evento.zona}
      </div>
      <div className="px-3 py-1.5 text-[11px] text-slate-400 font-mono border-r border-[#334155] bg-white" style={{ width: '50px', minWidth: '50px' }}>
        --
      </div>
      <div className="px-3 py-1.5 text-[11px] text-slate-500 font-mono border-r border-[#334155] bg-white" style={{ width: '60px', minWidth: '60px' }}>
        {evento.usuario}
      </div>
      <div className="px-3 py-1.5 text-[11px] text-slate-400 font-mono bg-white" style={{ width: '60px', minWidth: '60px' }}>
        --
      </div>
    </div>
  )
}
