'use client'

// ════════════════════════════════════════════════════════════════
//  GAMA COMMAND CENTER - EventRow v4.0
//  Colores dinámicos desde CODIGOS.MDB via Supabase
// ════════════════════════════════════════════════════════════════

import type { EventoMonitoreo } from '@/lib/supabase'

interface CodigoInfo {
  descripcion: string
  zn_us: string
  color: string
}

interface EventRowProps {
  evento: EventoMonitoreo
  onClick?: () => void
  isNew?: boolean
  isLatest?: boolean
  codigosMap?: Record<string, CodigoInfo>
}

// Mapeo de nombres de colores de Access a valores CSS hexadecimales
const COLOR_ACCESS_TO_CSS: Record<string, { bg: string; text: string }> = {
  'AMARILLO': { bg: '#FFFF00', text: '#000000' },
  'ROJO':     { bg: '#FF0000', text: '#FFFFFF' },
  'VERDE':    { bg: '#00FF00', text: '#000000' },
  'BLANCO':   { bg: '#FFFFFF', text: '#000000' },
  'GRIS':     { bg: '#C0C0C0', text: '#000000' },
  'VIOLETA':  { bg: '#EE82EE', text: '#000000' },
  'AZUL':     { bg: '#0000FF', text: '#FFFFFF' },
  'CELESTE':  { bg: '#00FFFF', text: '#000000' },
  'ROSADO':   { bg: '#FFC0CB', text: '#000000' },
  'COMPROBAR':{ bg: '#FFA500', text: '#000000' }, // Naranja para señales a verificar
}

// ── Paleta Scorpion de fallback (si el evento no coincide con CODIGOS.MDB) ─
function getScorpionStyleFallback(evento: string): { bg: string; text: string } {
  const upper = evento.toUpperCase()

  // Emergencia, Pánico, Fuego -> Rojo
  if (upper.includes('PANICO') || upper.includes('FUEGO') || upper.includes('INCENDIO') || upper.includes('EMERGENCIA') || upper.includes('MEDICA')) {
    return { bg: '#FF0000', text: '#FFFFFF' }
  }
  // Todos los Restablecimientos -> Amarillo
  if (upper.includes('RESTABLEC') || upper.includes('RESTAURACION') || upper.includes('RETORNO') || upper.includes('RESTABLECIMIENTO')) {
    return { bg: '#FFFF00', text: '#000000' }
  }
  // Cortes de luz / Fallas de energía -> Verde
  if (upper.includes('FALLA AC') || upper.includes('FALLA DE ENERGIA') || upper.includes('CORTE DE LUZ') || upper.includes('AC FALLA') || upper.includes('E301') || upper.includes('E302')) {
    return { bg: '#00FF00', text: '#000000' }
  }
  // Sabotajes de zona y Alarmas de robo -> Rosado
  if (upper.includes('ROBO') || upper.includes('ALARMA') || upper.includes('INTRUSION') || upper.includes('SABOTAJE') || upper.includes('TAMPER')) {
    return { bg: '#FFC0CB', text: '#000000' }
  }
  // Aperturas -> Azul
  if (upper.includes('APERTURA')) {
    return { bg: '#0000FF', text: '#FFFFFF' }
  }
  // Autotests -> Celeste
  if (upper.includes('AUTOTEST')) {
    return { bg: '#00FFFF', text: '#000000' }
  }

  return { bg: '#FFFFFF', text: '#000000' }
}

/**
 * Determina el color del evento usando CODIGOS.MDB primero, 
 * luego fallback con las reglas predeterminadas de Scorpion.
 */
function getEventoStyle(
  eventoTexto: string,
  codigosMap?: Record<string, CodigoInfo>
): { bg: string; text: string } {
  if (codigosMap && eventoTexto) {
    const upper = eventoTexto.toUpperCase().trim()
    
    // 1. Buscar coincidencia exacta por CODIGO (ej: "E130", "R100")
    if (codigosMap[upper]) {
      const colorNombre = codigosMap[upper].color
      if (COLOR_ACCESS_TO_CSS[colorNombre]) {
        return COLOR_ACCESS_TO_CSS[colorNombre]
      }
    }
    
    // 2. Buscar por coincidencia de DESCRIPCION en el mapa de códigos
    for (const [, info] of Object.entries(codigosMap)) {
      if (
        info.descripcion &&
        upper.includes(info.descripcion.toUpperCase().trim()) &&
        info.descripcion.length > 3
      ) {
        const colorNombre = info.color
        if (COLOR_ACCESS_TO_CSS[colorNombre]) {
          return COLOR_ACCESS_TO_CSS[colorNombre]
        }
      }
    }
  }

  // 3. Fallback a las reglas predeterminadas de Scorpion
  return getScorpionStyleFallback(eventoTexto)
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

export default function EventRow({ evento, onClick, isNew, isLatest, codigosMap }: EventRowProps) {
  const style = getEventoStyle(evento.evento, codigosMap)
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

      {/* SEÑAL */}
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
