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
  
  // 1. Emergencia, Pánico, Fuego -> Rojo
  if (upper.includes('PANICO') || upper.includes('FUEGO') || upper.includes('INCENDIO') || upper.includes('EMERGENCIA') || upper.includes('MEDICA')) {
    return { bg: '#FF0000', text: '#FFFFFF' }
  }
  
  // 2. Todos los Restablecimientos -> Amarillo
  if (upper.includes('RESTABLEC') || upper.includes('RESTAURACION') || upper.includes('RETORNO') || upper.includes('RESTABLECIMIENTO')) {
    return { bg: '#FFFF00', text: '#000000' }
  }
  
  // 3. Cortes de luz / Fallas de energía -> Verde
  if (upper.includes('FALLA AC') || upper.includes('FALLA DE ENERGIA') || upper.includes('CORTE DE LUZ') || upper.includes('AC FALLA') || upper.includes('E301') || upper.includes('E302')) {
    return { bg: '#00FF00', text: '#000000' }
  }
  
  // 4. Sabotajes de zona y Alarmas de robo -> Rosado / Rosa fuerte
  if (upper.includes('ROBO') || upper.includes('ALARMA') || upper.includes('INTRUSION') || upper.includes('SABOTAJE') || upper.includes('TAMPER')) {
    return { bg: '#FFC0CB', text: '#000000' } // Pink / LightPink retro
  }

  // Por defecto, aperturas y otros
  if (upper.includes('APERTURA')) {
    return { bg: '#0000FF', text: '#FFFFFF' }
  }
  if (upper.includes('AUTOTEST')) {
    return { bg: '#00FFFF', text: '#000000' }
  }

  return { bg: '#FFFFFF', text: '#000000' }
}

function renderFecha(iso: string) {
  try {
    const d = new Date(iso)
    const dia = d.getDate().toString().padStart(2, '0')
    const mes = (d.getMonth() + 1).toString().padStart(2, '0')
    const anio = d.getFullYear()
    const hora = d.getHours().toString().padStart(2, '0')
    const min = d.getMinutes().toString().padStart(2, '0')
    const seg = d.getSeconds().toString().padStart(2, '0')
    
    return (
      <span className="whitespace-nowrap">
        <span>{dia}-{mes}</span>
        <span className="hidden md:inline">-{anio}</span>
        <span> {hora}:{min}:{seg}</span>
      </span>
    )
  } catch {
    return <span>{iso}</span>
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
      <td className="px-1 py-0.5 text-[10px] md:text-[11px] whitespace-nowrap border border-black leading-none font-bold align-middle h-6">
        {renderFecha(evento.fecha_hora)}
      </td>

      {/* ABONADO */}
      <td className="px-1 py-0.5 text-[10px] md:text-[11px] font-bold border border-black leading-none align-middle">
        {evento.cuenta}
      </td>

      {/* NOMBRE */}
      <td className="px-1 py-0.5 text-[10px] md:text-[11px] truncate max-w-[170px] md:max-w-[300px] border border-black leading-none font-bold align-middle">
        {evento.nombre_abonado}
      </td>

      {/* SEÑAL (sin sigilos/iconos, solo el texto) */}
      <td className="px-1 py-0.5 text-[10px] md:text-[11px] font-bold border border-black leading-none align-middle truncate max-w-[80px] md:max-w-none">
        {evento.evento}
      </td>

      {/* ZN */}
      <td className="px-1 py-0.5 text-[10px] md:text-[11px] font-bold text-center border border-black leading-none align-middle">
        {evento.zona && evento.zona !== 'None' ? evento.zona.padStart(2, '0') : '00'}
      </td>

      {/* PAR */}
      <td className="px-1.5 py-0.5 text-[11px] font-bold text-center border border-black leading-none align-middle hidden md:table-cell">
        {evento.zona && evento.zona !== 'None' ? '01' : '--'}
      </td>

      {/* US */}
      <td className="px-1.5 py-0.5 text-[11px] font-bold text-center border border-black leading-none align-middle hidden md:table-cell">
        {evento.usuario && evento.usuario !== 'None' ? evento.usuario.padStart(2, '0') : '00'}
      </td>

      {/* UN */}
      <td className="px-1.5 py-0.5 text-[11px] font-bold text-center border border-black leading-none align-middle hidden md:table-cell">
        01
      </td>
    </tr>
  )
}
