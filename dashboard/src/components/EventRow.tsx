'use client'

import type { EventoMonitoreo } from '@/lib/supabase'

interface EventRowProps {
  evento: EventoMonitoreo
  onClick: () => void
}

function getSignalColor(evento: string): string {
  const upper = evento.toUpperCase()
  if (upper.includes('ROBO') || upper.includes('PANICO') || upper.includes('INCENDIO')) return 'text-[#FF4D4D] font-bold'
  if (upper.includes('CIERRE')) return 'text-[#3B82F6]'
  if (upper.includes('APERTURA')) return 'text-[#22C55E]'
  if (upper.includes('AUTOTEST')) return 'text-[#9CA3AF]'
  return 'text-slate-300'
}

function getRowBg(evento: string): string {
  const upper = evento.toUpperCase()
  if (upper.includes('ROBO') || upper.includes('PANICO') || upper.includes('INCENDIO')) return 'bg-[#FF4D4D]/5'
  return ''
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function EventRow({ evento, onClick }: EventRowProps) {
  const signalColor = getSignalColor(evento.evento)
  const rowBg = getRowBg(evento.evento)

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-b border-[#1a2340]/50 hover:bg-blue-500/5 transition-colors ${rowBg}`}
    >
      <td className="px-3 py-1 text-slate-400 whitespace-nowrap">{formatFecha(evento.fecha_hora)}</td>
      <td className="px-3 py-1 text-slate-200 font-semibold">{evento.cuenta}</td>
      <td className="px-3 py-1 text-slate-300 truncate max-w-[200px]">{evento.nombre_abonado}</td>
      <td className={`px-3 py-1 whitespace-nowrap ${signalColor}`}>{evento.evento}</td>
      <td className="px-3 py-1 text-slate-400">{evento.zona}</td>
      <td className="px-3 py-1 text-slate-600">--</td>
      <td className="px-3 py-1 text-slate-400">{evento.usuario}</td>
      <td className="px-3 py-1 text-slate-600">--</td>
    </tr>
  )
}
