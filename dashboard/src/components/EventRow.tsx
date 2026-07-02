'use client'

import type { EventoMonitoreo } from '@/lib/supabase'

interface EventRowProps {
  evento: EventoMonitoreo
  onClick?: () => void
}

function getScorpionStyle(evento: string): { bg: string; text: string } {
  const upper = evento.toUpperCase()
  if (
    upper.includes('ROBO') ||
    upper.includes('PANICO') ||
    upper.includes('INCENDIO') ||
    upper.includes('SURGARD')
  ) {
    return { bg: '#FF0000', text: '#FFFFFF' } // Red background, white text
  }
  if (upper.includes('APERTURA')) {
    return { bg: '#0000FF', text: '#FFFFFF' } // Blue background, white text
  }
  if (upper.includes('AUTOTEST')) {
    return { bg: '#00FFFF', text: '#000000' } // Cyan background, black text
  }
  if (
    upper.includes('RESTABLEC') ||
    upper.includes('RESTAURACION') ||
    upper.includes('RESTABLEC.')
  ) {
    return { bg: '#FFFF00', text: '#000000' } // Yellow background, black text
  }
  if (upper.includes('FALLA') || upper.includes('BATERIA')) {
    return { bg: '#00FF00', text: '#000000' } // Green background, black text
  }
  // Default: White background, black text
  return { bg: '#FFFFFF', text: '#000000' }
}

function formatFecha(iso: string): string {
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
  const style = getScorpionStyle(evento.evento)

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer hover:opacity-90 transition-all font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <td className="px-2 py-0.5 text-[11px] whitespace-nowrap border border-black leading-relaxed font-bold">
        {formatFecha(evento.fecha_hora)}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-bold border border-black leading-relaxed">
        {evento.cuenta}
      </td>
      <td className="px-2 py-0.5 text-[11px] truncate max-w-[250px] border border-black leading-relaxed font-bold">
        {evento.nombre_abonado}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-bold border border-black leading-relaxed">
        {evento.evento}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-bold text-center border border-black leading-relaxed">
        {evento.zona && evento.zona !== 'None' ? evento.zona.padStart(2, '0') : '00'}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-bold text-center border border-black leading-relaxed">
        {evento.zona && evento.zona !== 'None' ? '01' : '--'}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-bold text-center border border-black leading-relaxed">
        {evento.usuario && evento.usuario !== 'None' ? evento.usuario.padStart(2, '0') : '00'}
      </td>
      <td className="px-2 py-0.5 text-[11px] font-bold text-center border border-black leading-relaxed">
        01
      </td>
    </tr>
  )
}
