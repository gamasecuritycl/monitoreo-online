'use client'

import { useEffect, useRef } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'

interface ExpedienteModalProps {
  evento: EventoMonitoreo
  onClose: () => void
}

function getSignalSeverity(evento: string): { label: string; color: string; bg: string } {
  const upper = evento.toUpperCase()
  if (upper.includes('ROBO') || upper.includes('PANICO') || upper.includes('INCENDIO'))
    return { label: 'CRÍTICO', color: 'text-white', bg: 'bg-[#FF4D4D]' }
  if (upper.includes('CIERRE'))
    return { label: 'CIERRE', color: 'text-white', bg: 'bg-[#3B82F6]' }
  if (upper.includes('APERTURA'))
    return { label: 'APERTURA', color: 'text-white', bg: 'bg-[#22C55E]' }
  if (upper.includes('AUTOTEST'))
    return { label: 'SISTEMA', color: 'text-white', bg: 'bg-[#9CA3AF]' }
  return { label: 'INFORMATIVO', color: 'text-slate-300', bg: 'bg-slate-700' }
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function ExpedienteModal({ evento, onClose }: ExpedienteModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  const severity = getSignalSeverity(evento.evento)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="w-full max-w-lg mx-4 bg-[#0d1225] border border-[#1a2340] rounded-xl shadow-2xl animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2340]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-wider">EXPEDIENTE DEL CLIENTE</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${severity.bg} ${severity.color}`}>
              {severity.label}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-lg leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Abonado */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500">Abonado</label>
            <p className="text-sm font-semibold text-white mt-0.5">{evento.cuenta}</p>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500">Nombre</label>
            <p className="text-sm text-slate-200 mt-0.5">{evento.nombre_abonado}</p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-500">Señal</label>
              <p className={`text-sm mt-0.5 ${severity.color}`}>{evento.evento}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-500">Zona</label>
              <p className="text-sm text-slate-300 mt-0.5">{evento.zona || '---'}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-500">Partición</label>
              <p className="text-sm text-slate-400 mt-0.5">---</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-500">Usuario</label>
              <p className="text-sm text-slate-300 mt-0.5">{evento.usuario || '---'}</p>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500">Fecha/Hora Evento</label>
            <p className="text-sm text-slate-300 mt-0.5">{formatFecha(evento.fecha_hora)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#1a2340]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
