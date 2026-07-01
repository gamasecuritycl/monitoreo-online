'use client'

import StatusBadge from './StatusBadge'
import type { EventoMonitoreo } from '@/lib/supabase'

interface EventRowProps {
  evento: EventoMonitoreo
}

function getRowBorderClass(tipo: string): string {
  switch (tipo) {
    case 'ALARMA DE ROBO':
    case 'PANICO':
    case 'INCENDIO':
      return 'border-l-[#FF4D4D]'
    case 'CIERRE':
    case 'CIERRE ESPECIAL':
      return 'border-l-[#3B82F6]'
    case 'APERTURA':
      return 'border-l-[#22C55E]'
    case 'AUTOTEST':
      return 'border-l-[#9CA3AF]'
    default:
      return 'border-l-slate-600'
  }
}

function formatFecha(fechaISO: string): string {
  const fecha = new Date(fechaISO)
  const dia = fecha.getDate().toString().padStart(2, '0')
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
  const anio = fecha.getFullYear()
  const horas = fecha.getHours().toString().padStart(2, '0')
  const mins = fecha.getMinutes().toString().padStart(2, '0')
  const segs = fecha.getSeconds().toString().padStart(2, '0')
  return `${dia}/${mes}/${anio} ${horas}:${mins}:${segs}`
}

export default function EventRow({ evento }: EventRowProps) {
  const borderClass = getRowBorderClass(evento.tipo_evento)
  
  return (
    <tr className={`event-row border-l-4 ${borderClass} border-b border-slate-700/50`}>
      <td className="px-4 py-3 text-sm text-slate-300 font-mono whitespace-nowrap">
        {formatFecha(evento.fecha_hora)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-200 font-semibold">
        {evento.cuenta}
      </td>
      <td className="px-4 py-3 text-sm text-slate-200">
        {evento.nombre_abonado}
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">
        {evento.zona}
      </td>
      <td className="px-4 py-3 text-sm text-slate-300">
        {evento.evento}
      </td>
      <td className="px-4 py-3">
        <StatusBadge tipo={evento.tipo_evento} />
      </td>
    </tr>
  )
}
