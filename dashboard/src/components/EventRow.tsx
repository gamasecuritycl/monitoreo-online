'use client'

// ════════════════════════════════════════════════════════════════
//  GAMA COMMAND CENTER - EventRow v5.0
//  Traducción inteligente de Códigos Contact ID / SIA a español
//  y Colores dinámicos desde CODIGOS.MDB + Diccionario Oficial
// ════════════════════════════════════════════════════════════════

import type { EventoMonitoreo } from '@/lib/supabase'
import { lookupContactId } from '@/lib/contact_id_library'

export interface CodigoInfo {
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
  'AMARILLO':   { bg: '#FFFF00', text: '#000000' },
  'ROJO':       { bg: '#FF0000', text: '#FFFFFF' },
  'VERDE':      { bg: '#00FF00', text: '#000000' },
  'BLANCO':     { bg: '#FFFFFF', text: '#000000' },
  'GRIS':       { bg: '#C0C0C0', text: '#000000' },
  'VIOLETA':    { bg: '#EE82EE', text: '#000000' },
  'LILA_PASTEL':{ bg: '#E8D5F5', text: '#000000' }, // Color pastel suave no emergente
  'LAVANDA':    { bg: '#E8D5F5', text: '#000000' },
  'AZUL':       { bg: '#0000FF', text: '#FFFFFF' },
  'CELESTE':    { bg: '#00FFFF', text: '#000000' },
  'ROSADO':     { bg: '#FFC0CB', text: '#000000' },
  'COMPROBAR':  { bg: '#FFA500', text: '#000000' }, // Naranja para señales a verificar
}

/**
 * Traduce un código crudo (ej: E530, E538, E330, R301, E130) a su texto legible en español.
 * Si ya viene en texto (ej: "ALARMA DE ROBO", "AUTOTEST", "CIERRE"), lo conserva intacto.
 */
export function getSenalLegible(
  eventoStr: string,
  codigosMap?: Record<string, CodigoInfo>
): string {
  if (!eventoStr) return ''
  const upper = eventoStr.toUpperCase().trim()

  // 1. Si está en el mapa de CODIGOS.MDB de Scorpion por código exacto (ej: "E330", "R401", "E130")
  if (codigosMap && codigosMap[upper]?.descripcion) {
    return codigosMap[upper].descripcion
  }

  // 2. Si es un código tipo Contact ID (ej: "E530", "R530", "E538", "E301", "530", "BA")
  const cid = lookupContactId(upper)
  if (cid && cid.categoria !== 'DESCONOCIDO') {
    return cid.descripcion
  }

  // 3. Retornar el texto original si no es un código numérico crudo
  return eventoStr
}

// ── Paleta Scorpion de fallback (coincidente 1:1 con Scorpion Monitoring Software) ─
function getScorpionStyleFallback(evento: string): { bg: string; text: string } {
  const upper = (evento || '').toUpperCase().trim()

  // 1. Emergencia, Pánico, Fuego -> Rojo (#FF0000)
  if (upper.includes('PANICO') || upper.includes('FUEGO') || upper.includes('INCENDIO') || upper.includes('EMERGENCIA') || upper.includes('MEDICA')) {
    return { bg: '#FF0000', text: '#FFFFFF' }
  }
  // 2. Todos los Restablecimientos -> Amarillo (#FFFF00)
  if (upper.includes('RESTABLEC') || upper.includes('RESTAURACION') || upper.includes('RETORNO') || upper.includes('RESTABLECIMIENTO')) {
    return { bg: '#FFFF00', text: '#000000' }
  }
  // 3. Cortes de luz / Fallas de energía -> Verde (#00FF00)
  if (upper.includes('FALLA AC') || upper.includes('FALLA DE ENERGIA') || upper.includes('CORTE DE LUZ') || upper.includes('AC FALLA') || upper.includes('E301') || upper.includes('E302')) {
    return { bg: '#00FF00', text: '#000000' }
  }
  // 4. Sabotajes de zona y Alarmas de robo -> Rosado (#FFC0CB)
  if (upper.includes('ROBO') || upper.includes('ALARMA') || upper.includes('INTRUSION') || upper.includes('SABOTAJE') || upper.includes('TAMPER')) {
    return { bg: '#FFC0CB', text: '#000000' }
  }
  // 5. Falla de Cobertura Inalámbrica -> Color Pastel Lavanda/Lila Suave (#E8D5F5) - Sin alarma ni emergencia
  if (upper.includes('COBERTURA') || upper.includes('ELEM. INALAM') || upper.includes('E530')) {
    return { bg: '#E8D5F5', text: '#000000' }
  }
  // 6. Anulaciones y Bypass -> Violeta (#EE82EE)
  if (upper.includes('BYPASS') || upper.includes('ANULA') || upper.includes('INHIBI') || upper.includes('SWINGER') || upper.includes('E570')) {
    return { bg: '#EE82EE', text: '#000000' }
  }
  // 7. Aperturas -> Celeste / Cyan (#00FFFF) igual a PC Scorpion
  if (upper.includes('APERTURA')) {
    return { bg: '#00FFFF', text: '#000000' }
  }
  // 8. Autotests -> Gris / Plateado (#E0E0E0) igual a PC Scorpion
  if (upper.includes('AUTOTEST')) {
    return { bg: '#E0E0E0', text: '#000000' }
  }
  // 9. Cierres -> Blanco (#FFFFFF)
  if (upper.includes('CIERRE')) {
    return { bg: '#FFFFFF', text: '#000000' }
  }

  return { bg: '#FFFFFF', text: '#000000' }
}

/**
 * Determina el color del evento usando CODIGOS.MDB primero, 
 * luego diccionario oficial Contact ID y fallback Scorpion.
 */
function getEventoStyle(
  senalLegible: string,
  rawEvento: string,
  codigosMap?: Record<string, CodigoInfo>
): { bg: string; text: string } {
  const upperRaw = (rawEvento || '').toUpperCase().trim()
  const upperLegible = (senalLegible || '').toUpperCase().trim()

  // 1. Reglas prioritarias nativas de Scorpion
  if (upperLegible.includes('COBERTURA') || upperLegible.includes('ELEM. INALAM') || upperRaw.includes('E530') || upperRaw === '530') return { bg: '#E8D5F5', text: '#000000' } // Lila pastel suave
  if (upperLegible.includes('APERTURA')) return { bg: '#00FFFF', text: '#000000' } // Celeste
  if (upperLegible.includes('AUTOTEST')) return { bg: '#E0E0E0', text: '#000000' } // Gris
  if (upperLegible.includes('CIERRE'))   return { bg: '#FFFFFF', text: '#000000' } // Blanco
  if (upperLegible.includes('RESTABLEC') || upperLegible.includes('RESTAURACION')) return { bg: '#FFFF00', text: '#000000' } // Amarillo
  if (upperLegible.includes('FALLA AC') || upperLegible.includes('FALLA DE ENERGIA') || upperLegible.includes('CORTE DE LUZ')) return { bg: '#00FF00', text: '#000000' } // Verde
  if (upperLegible.includes('ROBO') || upperLegible.includes('INTRUSION') || upperLegible.includes('SABOTAJE') || upperLegible.includes('TAMPER')) return { bg: '#FFC0CB', text: '#000000' } // Rosado
  if (upperLegible.includes('BYPASS') || upperLegible.includes('SWINGER') || upperLegible.includes('ANULA')) return { bg: '#EE82EE', text: '#000000' } // Violeta

  // 2. Buscar en CODIGOS.MDB de Scorpion
  if (codigosMap) {
    if (codigosMap[upperRaw]) {
      const colorNombre = codigosMap[upperRaw].color
      if (COLOR_ACCESS_TO_CSS[colorNombre]) {
        return COLOR_ACCESS_TO_CSS[colorNombre]
      }
    }
  }

  // 3. Buscar en Diccionario Contact ID SIA DC-05
  const cid = lookupContactId(upperRaw)
  if (cid && COLOR_ACCESS_TO_CSS[cid.color]) {
    return COLOR_ACCESS_TO_CSS[cid.color]
  }

  // 4. Fallback Scorpion
  return getScorpionStyleFallback(upperLegible || upperRaw)
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
  const senalLegible = getSenalLegible(evento.evento, codigosMap)
  const style = getEventoStyle(senalLegible, evento.evento, codigosMap)
  const isCritical = ['#FF0000'].includes(style.bg)

  const rowClass = [
    isNew     ? (isCritical ? 'row-new row-critical' : 'row-new') : '',
    isLatest  ? 'row-latest' : '',
    'cursor-pointer hover:opacity-95 transition-all font-bold select-none',
  ].join(' ')

  const tieneTraduccion = evento.evento && evento.evento.trim().toUpperCase() !== senalLegible.trim().toUpperCase()

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

      {/* SEÑAL (Traducida automáticamente de Contact ID a español si viene como código) */}
      <td
        className="px-1 py-0.5 text-[10px] md:text-[11px] font-bold border border-black leading-none align-middle truncate max-w-[120px] md:max-w-none"
        title={tieneTraduccion ? `Código original transmitido: ${evento.evento}` : undefined}
      >
        {senalLegible}
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
