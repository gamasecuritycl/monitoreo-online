'use client'

import type { EventoMonitoreo } from '@/lib/supabase'

interface EventRowProps {
  evento: EventoMonitoreo
  onClick: () => void
}

function getSeverity(evento: string): { color: string; bg: string } {
  const upper = evento.toUpperCase()
  if (upper.includes('ROBO') || upper.includes('PANICO') || upper.includes('INCENDIO'))
    return { color: '#FF4D4D', bg: 'rgba(255,77,77,0.08)' }
  if (upper.includes('CIERRE'))
    return { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' }
  if (upper.includes('APERTURA'))
    return { color: '#22C55E', bg: 'rgba(34,197,94,0.08)' }
  if (upper.includes('AUTOTEST'))
    return { color: '#9CA3AF', bg: 'transparent' }
  return { color: '#94a3b8', bg: 'transparent' }
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function EventRow({ evento, onClick }: EventRowProps) {
  const severity = getSeverity(evento.evento)

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer hover:brightness-125 transition-all"
      style={{ backgroundColor: severity.bg }}
    >
      <td className="px-2 py-0.5 text-[11px] text-slate-400 whitespace-nowrap border border-[#2a2a4a] leading-relaxed">
        {formatFecha(evento.fecha_hora)}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-bold text-slate-200 border border-[#2a2a4a] leading-relaxed">
        {evento.cuenta}
      </td>
      <td className="px-2 py-0.5 text-[11px] text-slate-400 truncate max-w-[250px] border border-[#2a2a4a] leading-relaxed">
        {evento.nombre_abonado}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-bold whitespace-nowrap border border-[#2a2a4a] leading-relaxed" style={{ color: severity.color }}>
        {evento.evento}
      </td>
      <td className="px-2 py-0.5 text-[11px] text-slate-500 text-center border border-[#2a2a4a] leading-relaxed">
        {evento.zona}
      </td>
      <td className="px-2 py-0.5 text-[11px] text-slate-600 text-center border border-[#2a2a4a] leading-relaxed">
        --
      </td>
      <td className="px-2 py-0.5 text-[11px] text-slate-500 text-center border border-[#2a2a4a] leading-relaxed">
        {evento.usuario}
      </td>
      <td className="px-2 py-0.5 text-[11px] text-slate-600 text-center border border-[#2a2a4a] leading-relaxed">
        --
      </td>
    </tr>
  )
}
