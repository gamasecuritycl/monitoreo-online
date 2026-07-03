'use client'

// ════════════════════════════════════════════════════════════════
//  GAMA COMMAND CENTER - EventRow v3.1
//  Fila ultra-compacta Scorpion (sin iconos en señales, altura ajustada)
// ════════════════════════════════════════════════════════════════

import type { EventoMonitoreo } from '@/lib/supabase'

interface EventRowProps {
  evento: EventoMonitoreo
  onClick?: () => void
  isNew?: boolean
  isLatest?: boolean
}

// ── Paleta Scorpion (colores físicos del panel) ─────────────────
function getScorpionStyle(evento: string): { bg: string; text: string } {
  const upper = evento.toUpperCase()
  if (upper.includes('ROBO') || upper.includes('PANICO') || upper.includes('INCENDIO') || upper.includes('SURGARD'))
    return { bg: '#FF0000', text: '#FFFFFF' }
  if (upper.includes('APERTURA'))
    return { bg: '#0000FF', text: '#FFFFFF' }
  if (upper.includes('AUTOTEST'))
    return { bg: '#00FFFF', text: '#000000' }
  if (upper.includes('RESTABLEC') || upper.includes('RESTAURACION'))
    return { bg: '#FFFF00', text: '#000000' }
  if (upper.includes('FALLA') || upper.includes('BATERIA'))
    return { bg: '#00FF00', text: '#000000' }
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

export default function EventRow({ evento, onClick, isNew, isLatest }: EventRowProps) {
  const style  = getScorpionStyle(evento.evento)
  const isCritical = ['#FF0000'].includes(style.bg)

  const rowClass = [
    isNew     ? (isCritical ? 'row-new row-critical' : 'row-new') : '',
    isLatest  ? 'row-latest' : '',
    'cursor-pointer hover:opacity-95 transition-all font-bold select-none',
  ].join(' ')

  return (
    <tr
      onClick={onClick}
      className={rowClass}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {/* FECHA/HORA */}
      <td className="px-1.5 py-0.5 text-[11px] whitespace-nowrap border border-black leading-none font-bold align-middle h-6">
        {formatFecha(evento.fecha_hora)}
      </td>

      {/* ABONADO */}
      <td className="px-1.5 py-0.5 text-[11px] font-bold border border-black leading-none align-middle">
        {evento.cuenta}
      </td>

      {/* NOMBRE */}
      <td className="px-1.5 py-0.5 text-[11px] truncate max-w-[300px] border border-black leading-none font-bold align-middle">
        {evento.nombre_abonado}
      </td>

      {/* SEÑAL (sin sigilos/iconos, solo el texto) */}
      <td className="px-1.5 py-0.5 text-[11px] font-bold border border-black leading-none align-middle">
        {evento.evento}
      </td>

      {/* ZN */}
      <td className="px-1.5 py-0.5 text-[11px] font-bold text-center border border-black leading-none align-middle">
        {evento.zona && evento.zona !== 'None' ? evento.zona.padStart(2, '0') : '00'}
      </td>

      {/* PAR */}
      <td className="px-1.5 py-0.5 text-[11px] font-bold text-center border border-black leading-none align-middle">
        {evento.zona && evento.zona !== 'None' ? '01' : '--'}
      </td>

      {/* US */}
      <td className="px-1.5 py-0.5 text-[11px] font-bold text-center border border-black leading-none align-middle">
        {evento.usuario && evento.usuario !== 'None' ? evento.usuario.padStart(2, '0') : '00'}
      </td>

      {/* UN */}
      <td className="px-1.5 py-0.5 text-[11px] font-bold text-center border border-black leading-none align-middle">
        01
      </td>
    </tr>
  )
}
