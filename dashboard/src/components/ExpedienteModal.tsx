'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [activeTab, setActiveTab] = useState<'general' | 'zones' | 'maintenance' | 'action'>('general')

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    ref.current?.focus()
  }, [])

  // Dummy dynamic data based on client account
  const accountNum = evento.cuenta || '7015'
  const clientName = evento.nombre_abonado || 'GAMA SEGURIDAD'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-mono"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="w-full max-w-xl mx-4 bg-[#080d19] border border-[#1e293b] rounded-md shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Header style Windows Desktop bevel */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#111827] border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-slate-200 tracking-wider">EXPEDIENTE DEL ABONADO</h2>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${severity.bg} ${severity.color}`}>
              {severity.label}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-lg leading-none cursor-pointer">&times;</button>
        </div>

        {/* Tab Selector Desktop Style */}
        <div className="flex bg-[#0b1222] border-b border-[#1e293b] text-xs">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 border-r border-[#1e293b] font-semibold transition-all cursor-pointer ${
              activeTab === 'general' ? 'bg-[#080d19] text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-500 hover:bg-[#0e172a] hover:text-slate-300'
            }`}
          >
            FICHA TÉCNICA
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 border-r border-[#1e293b] font-semibold transition-all cursor-pointer ${
              activeTab === 'zones' ? 'bg-[#080d19] text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-500 hover:bg-[#0e172a] hover:text-slate-300'
            }`}
          >
            ZONAS & COBERTURA
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2 border-r border-[#1e293b] font-semibold transition-all cursor-pointer ${
              activeTab === 'maintenance' ? 'bg-[#080d19] text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-500 hover:bg-[#0e172a] hover:text-slate-300'
            }`}
          >
            MANTENIMIENTO
          </button>
          <button
            onClick={() => setActiveTab('action')}
            className={`px-4 py-2 font-semibold transition-all cursor-pointer ${
              activeTab === 'action' ? 'bg-[#080d19] text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-500 hover:bg-[#0e172a] hover:text-slate-300'
            }`}
          >
            PLAN DE ACCIÓN
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 h-72 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Número de Abonado</label>
                  <p className="text-xs font-bold text-slate-200 mt-1 font-mono">{accountNum}</p>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Nombre Comercial</label>
                  <p className="text-xs font-bold text-slate-200 mt-1">{clientName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-[#131b30] pt-3">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Dirección Particular</label>
                  <p className="text-xs text-slate-300 mt-1">Calle Falsa 123, Providencia</p>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Ciudad/Comuna</label>
                  <p className="text-xs text-slate-300 mt-1">Santiago, Chile</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#131b30] pt-3">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Señal del Evento</label>
                  <p className={`text-xs font-bold mt-1`} style={{ color: severity.label === 'CRÍTICO' ? '#FF4D4D' : '#3B82F6' }}>
                    {evento.evento}
                  </p>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block">Fecha/Hora Evento</label>
                  <p className="text-xs text-slate-300 mt-1 font-mono">{formatFecha(evento.fecha_hora)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'zones' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* List of Zones */}
              <div className="border border-[#1e293b] rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-[10px] font-mono">
                  <thead>
                    <tr className="bg-[#111827] text-slate-400">
                      <th className="p-1.5 border-b border-[#1e293b] w-8 text-center">ZN</th>
                      <th className="p-1.5 border-b border-[#1e293b]">Descripción</th>
                      <th className="p-1.5 border-b border-[#1e293b] w-10 text-center">CID</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-[#131b30]">
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">01</td>
                      <td className="p-1.5">Puerta Acceso Principal</td>
                      <td className="p-1.5 text-center text-slate-400">130</td>
                    </tr>
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">02</td>
                      <td className="p-1.5">PIR Living Central</td>
                      <td className="p-1.5 text-center text-slate-400">130</td>
                    </tr>
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">03</td>
                      <td className="p-1.5">PIR Bodega de Insumos</td>
                      <td className="p-1.5 text-center text-slate-400">130</td>
                    </tr>
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">04</td>
                      <td className="p-1.5">Botón Pánico Caja 1</td>
                      <td className="p-1.5 text-center text-red-400 font-bold">120</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Simulated Camera Video Verification */}
              <div className="relative border border-[#1e293b] bg-black rounded overflow-hidden flex flex-col justify-between items-center text-center p-4">
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[8px] text-red-500 font-bold tracking-widest uppercase">REC CAM_03</span>
                </div>
                <div className="text-slate-700 text-3xl my-auto">🎥</div>
                <p className="text-[8px] text-slate-500 uppercase tracking-wider">Simulación de Verificación por Video</p>
                <p className="text-[9px] text-green-400 font-mono mt-1">Conexión RTSP Estable (30 FPS)</p>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-3 font-mono text-xs">
              <p className="text-[10px] text-slate-500 uppercase">Historial de Visitas Técnicas</p>
              <div className="space-y-2">
                <div className="p-2.5 bg-[#0a0e1a] border border-[#1e293b] rounded">
                  <div className="flex justify-between font-bold text-[10px] text-slate-400">
                    <span>15/05/2026</span>
                    <span className="text-blue-400">Carlos Ruiz (Técnico)</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">Reemplazo de batería descargada en panel central DSC 1832.</p>
                </div>
                <div className="p-2.5 bg-[#0a0e1a] border border-[#1e293b] rounded">
                  <div className="flex justify-between font-bold text-[10px] text-slate-400">
                    <span>22/04/2026</span>
                    <span className="text-blue-400">Luis Soto (Técnico)</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">Limpieza y re-calibración de sensor de movimiento Hall.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'action' && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Plan de Llamadas de Emergencia</p>
              <div className="overflow-x-auto border border-[#1e293b] rounded">
                <table className="w-full text-left border-collapse text-[10px] font-mono">
                  <thead>
                    <tr className="bg-[#111827] text-slate-400">
                      <th className="p-1.5 border-b border-[#1e293b] w-10 text-center">Prioridad</th>
                      <th className="p-1.5 border-b border-[#1e293b]">Contacto</th>
                      <th className="p-1.5 border-b border-[#1e293b]">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-[#131b30]">
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">1</td>
                      <td className="p-1.5">Tomás Toro (Administrador)</td>
                      <td className="p-1.5 font-bold text-slate-200">+56 9 8765 4321</td>
                    </tr>
                    <tr className="hover:bg-[#131b30]/50">
                      <td className="p-1.5 text-center text-yellow-400 font-bold">2</td>
                      <td className="p-1.5">Guardia Nocturno (Conserjería)</td>
                      <td className="p-1.5 font-bold text-slate-200">+56 2 2345 6789</td>
                    </tr>
                    <tr className="hover:bg-[#131b30]/50 text-red-400 bg-red-950/10">
                      <td className="p-1.5 text-center font-bold">3</td>
                      <td className="p-1.5">Carabineros de Chile</td>
                      <td className="p-1.5 font-bold">133</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer style Windows Desktop bevel */}
        <div className="flex justify-end gap-2 px-4 py-2 bg-[#0a0e1a] border-t border-[#1e293b]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 text-xs font-semibold rounded cursor-pointer transition-colors"
          >
            CERRAR EXPEDIENTE
          </button>
        </div>
      </div>
    </div>
  )
}
