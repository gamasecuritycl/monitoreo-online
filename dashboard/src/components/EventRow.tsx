'use client'

// ════════════════════════════════════════════════════════════════
//  GAMA COMMAND CENTER - EventRow v2.3
//  ⚕ Simbología Oculta: cada señal porta su sigilo alquímico
//  ☽ ♄ ♂ ☿ ⊕ ☊ ✶  — Fuente: Emerald Tablet, Cairo, 1482
// ════════════════════════════════════════════════════════════════

import type { EventoMonitoreo } from '@/lib/supabase'

interface EventRowProps {
  evento: EventoMonitoreo
  onClick?: () => void
  isNew?: boolean
  isLatest?: boolean
}

// ── Tabla alquímica de señales ──────────────────────────────────
// Cada evento del mundo físico corresponde a un principio hermético
const SIGILO: Record<string, { glyph: string; title: string }> = {
  ROBO:        { glyph: '⚔', title: 'Marte — Conflicto' },
  PANICO:      { glyph: '☿', title: 'Mercurio — Mensajero de Peligro' },
  INCENDIO:    { glyph: '🜂', title: 'Azufre — Fuego Primordial' },
  APERTURA:    { glyph: '☽', title: 'Luna — Umbral Abierto' },
  CIERRE:      { glyph: '♄', title: 'Saturno — El Sellador' },
  AUTOTEST:    { glyph: '⊕', title: 'Terra — Pulso Vital' },
  BATERIA:     { glyph: '🜄', title: 'Agua — Energía Latente' },
  FALLA:       { glyph: '♂', title: 'Marte — Ruptura' },
  RESTABLEC:   { glyph: '☀', title: 'Sol — Restauración' },
  DEFAULT:     { glyph: '✶', title: 'Aether — Señal Desconocida' },
}

function getSigilo(evento: string) {
  const u = evento.toUpperCase()
  for (const [key, val] of Object.entries(SIGILO)) {
    if (key !== 'DEFAULT' && u.includes(key)) return val
  }
  return SIGILO.DEFAULT
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
  const sigilo = getSigilo(evento.evento)

  const isCritical = ['#FF0000'].includes(style.bg)

  const rowClass = [
    isNew     ? (isCritical ? 'row-new row-critical' : 'row-new') : '',
    isLatest  ? 'row-latest' : '',
    'cursor-pointer hover:opacity-90 transition-all font-bold',
  ].join(' ')

  return (
    <tr
      onClick={onClick}
      className={rowClass}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {/* FECHA/HORA */}
      <td className="px-2 py-0.5 text-[11px] whitespace-nowrap border border-black leading-relaxed font-bold">
        {formatFecha(evento.fecha_hora)}
      </td>

      {/* ABONADO */}
      <td className="px-2 py-0.5 text-[11px] font-bold border border-black leading-relaxed">
        {evento.cuenta}
      </td>

      {/* NOMBRE */}
      <td className="px-2 py-0.5 text-[11px] truncate max-w-[300px] border border-black leading-relaxed font-bold">
        {evento.nombre_abonado}
      </td>

      {/* SEÑAL + sigilo oculto ← aquí está la magia */}
      <td className="px-2 py-0.5 text-[11px] font-bold border border-black leading-relaxed">
        <span
          className="mr-1 opacity-60 select-none"
          title={sigilo.title}          /* hover revela el nombre hermético */
          style={{ fontSize: '10px' }}
        >
          {sigilo.glyph}
        </span>
        {evento.evento}
      </td>

      {/* ZN */}
      <td className="px-2 py-0.5 text-[11px] font-bold text-center border border-black leading-relaxed">
        {evento.zona && evento.zona !== 'None' ? evento.zona.padStart(2, '0') : '00'}
      </td>

      {/* PAR */}
      <td className="px-2 py-0.5 text-[11px] font-bold text-center border border-black leading-relaxed">
        {evento.zona && evento.zona !== 'None' ? '01' : '--'}
      </td>

      {/* US */}
      <td className="px-2 py-0.5 text-[11px] font-bold text-center border border-black leading-relaxed">
        {evento.usuario && evento.usuario !== 'None' ? evento.usuario.padStart(2, '0') : '00'}
      </td>

      {/* UN */}
      <td className="px-2 py-0.5 text-[11px] font-bold text-center border border-black leading-relaxed">
        01
      </td>
    </tr>
  )
}

