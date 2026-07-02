'use client'

import type { EventoMonitoreo } from '@/lib/supabase'

interface EventRowProps {
  evento: EventoMonitoreo
  onClick?: () => void
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
  // Supabase returns timestamptz as UTC (e.g. "2026-07-02T09:59:47+00:00").
  // JavaScript new Date() would subtract the browser's UTC offset and show
  // the wrong local time. We always force America/Santiago so the timestamp
  // matches what operators in Chile expect to see.
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      year:    'numeric',
      month:   '2-digit',
      day:     '2-digit',
      hour:    '2-digit',
      minute:  '2-digit',
      second:  '2-digit',
      hour12:  false,
    }).format(d).replace(',', '')
  } catch {
    return iso
  }
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
      <td className="px-2 py-0.5 text-[11px] font-mono text-slate-300 text-center border border-[#2a2a4a] leading-relaxed">
        {evento.zona && evento.zona !== 'None' ? evento.zona.padStart(2, '0') : '00'}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-mono text-slate-400 text-center border border-[#2a2a4a] leading-relaxed">
        {evento.zona && evento.zona !== 'None' ? '01' : '--'}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-mono text-slate-300 text-center border border-[#2a2a4a] leading-relaxed">
        {evento.usuario && evento.usuario !== 'None' ? evento.usuario.padStart(2, '0') : '00'}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-mono text-slate-400 text-center border border-[#2a2a4a] leading-relaxed">
        01
      </td>
    </tr>
  )
}
