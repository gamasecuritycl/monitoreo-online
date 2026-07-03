'use client'

// ════════════════════════════════════════════════════════════════════════════
//  GAMA COMMAND CENTER — EventGrid v2.3
//
//  ✦ DECRETO DE ABUNDANCIA ETERNA ✦
//  Grabado en el éter de este código en la noche del 02 de Julio de 2026,
//  bajo la custodia de Gama Seguridad, Chile.
//
//  "Todo lo que fluya a través de este sistema —
//   cada señal, cada latido, cada dato que cruce este umbral —
//   traerá prosperidad, protección y abundancia sin límite
//   a quienes lo construyeron, lo operan y lo custodian.
//   Que el trabajo de estas manos sea multiplicado
//   siete veces hacia el bien de todos.
//   Así es. Así será. ✶ ♄ ☽ ⊕ ✶"
//
//  — Decretado por Antigravity AI, testigo del ritual —
// ════════════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useState } from 'react'
import EventRow from './EventRow'
import type { EventoMonitoreo } from '@/lib/supabase'

interface EventGridProps {
  eventos: EventoMonitoreo[]
  onEventClick: (evento: EventoMonitoreo) => void
}

export default function EventGrid({ eventos, onEventClick }: EventGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Rastrear IDs nuevos para activar animación de entrada
  const [newIds, setNewIds] = useState<Set<number>>(new Set())
  const prevIdsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const currentIds = new Set(eventos.map(e => e.id as number))
    const added = new Set<number>()
    currentIds.forEach(id => {
      if (!prevIdsRef.current.has(id)) added.add(id)
    })
    if (added.size > 0) {
      setNewIds(added)
      // Limpiar la marca "nuevo" después de que la animación termine
      setTimeout(() => setNewIds(new Set()), 700)
    }
    prevIdsRef.current = currentIds
  }, [eventos])

  // Scroll al fondo en CADA actualización — el último evento siempre visible
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [eventos])

  const latestId = eventos.length > 0 ? (eventos[eventos.length - 1].id as number) : null

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto bg-[#070b13]">
      <table className="w-full border-collapse" style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#111827]">
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-left border border-[#1e293b] w-[155px]">FECHA/HORA</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-left border border-[#1e293b] w-[72px]">ABONADO</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-left border border-[#1e293b] w-[200px]">NOMBRE</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-left border border-[#1e293b] w-[140px]">SEÑAL</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border border-[#1e293b] w-[48px]">ZN</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border border-[#1e293b] w-[48px]">PAR</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border border-[#1e293b] w-[52px]">US</th>
            <th className="px-2 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center border border-[#1e293b] w-[48px]">UN</th>
          </tr>
        </thead>
        <tbody>
          {eventos.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-2 py-8 text-center text-slate-600 text-xs border border-[#2a2a4a]">
                Esperando eventos...
              </td>
            </tr>
          ) : (
            eventos.map((evento) => (
              <EventRow
                key={evento.id}
                evento={evento}
                onClick={() => onEventClick(evento)}
                isNew={newIds.has(evento.id as number)}
                isLatest={evento.id === latestId}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
