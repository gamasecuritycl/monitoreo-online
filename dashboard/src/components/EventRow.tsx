'use client'

import type { EventoMonitoreo } from '@/lib/supabase'

interface EventRowProps {
  evento: EventoMonitoreo
  onClick: () => void
  isLast: boolean
}

function getSignalColor(evento: string): string {
  const upper = evento.toUpperCase()
  if (upper.includes('ROBO') || upper.includes('PANICO') || upper.includes('INCENDIO')) return '#FF4D4D'
  if (upper.includes('CIERRE')) return '#3B82F6'
  if (upper.includes('APERTURA')) return '#22C55E'
  if (upper.includes('AUTOTEST')) return '#9CA3AF'
  return '#64748b'
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function EventRow({ evento, onClick, isLast }: EventRowProps) {
  const signalColor = getSignalColor(evento.evento)

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer bg-white hover:bg-blue-50/50 transition-colors"
    >
      <td className={`px-3 py-2 text-[11px] font-mono text-slate-600 whitespace-nowrap border-b border-blue-200 ${isLast ? '' : ''} border-r border-blue-100`}>
        {formatFecha(evento.fecha_hora)}
      </td>
      <td className={`px-3 py-2 text-[11px] font-mono font-semibold text-slate-800 border-b border-blue-200 ${isLast ? '' : ''} border-r border-blue-100`}>
        {evento.cuenta}
      </td>
      <td className={`px-3 py-2 text-[11px] font-mono text-slate-600 truncate max-w-[200px] border-b border-blue-200 ${isLast ? '' : ''} border-r border-blue-100`}>
        {evento.nombre_abonado}
      </td>
      <td className={`px-3 py-2 text-[11px] font-mono font-semibold whitespace-nowrap border-b border-blue-200 ${isLast ? '' : ''} border-r border-blue-100`} style={{ color: signalColor }}>
        {evento.evento}
      </td>
      <td className={`px-3 py-2 text-[11px] font-mono text-slate-500 border-b border-blue-200 ${isLast ? '' : ''} border-r border-blue-100`}>
        {evento.zona}
      </td>
      <td className={`px-3 py-2 text-[11px] font-mono text-slate-400 border-b border-blue-200 ${isLast ? '' : ''} border-r border-blue-100`}>
        --
      </td>
      <td className={`px-3 py-2 text-[11px] font-mono text-slate-500 border-b border-blue-200 ${isLast ? '' : ''} border-r border-blue-100`}>
        {evento.usuario}
      </td>
      <td className={`px-3 py-2 text-[11px] font-mono text-slate-400 border-b border-blue-200`}>
        --
      </td>
    </tr>
  )
}
