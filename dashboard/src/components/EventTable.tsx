'use client'

import EventRow from './EventRow'
import type { EventoMonitoreo } from '@/lib/supabase'

interface EventTableProps {
  eventos: EventoMonitoreo[]
}

export default function EventTable({ eventos }: EventTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/80">
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha/Hora</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuenta</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre Abonado</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Zona</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Evento</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
          </tr>
        </thead>
        <tbody>
          {eventos.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm">No se encontraron eventos</p>
                </div>
              </td>
            </tr>
          ) : (
            eventos.map((evento) => (
              <EventRow key={evento.id} evento={evento} />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
