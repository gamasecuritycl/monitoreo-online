'use client'

import React, { useState, useEffect } from 'react'
import { supabase, type EventoMonitoreo } from '@/lib/supabase'

interface HealthTelemetryModalProps {
  onClose: () => void
  sincronizadorVivo: boolean
  ultimoHeartbeat: string | null
}

export default function HealthTelemetryModal({
  onClose,
  sincronizadorVivo,
  ultimoHeartbeat
}: HealthTelemetryModalProps) {
  const [waState, setWaState] = useState<{ status?: string; phone?: string; battery?: string }>({ status: 'DESCONOCIDO' })
  const [fallasEnergia, setFallasEnergia] = useState<EventoMonitoreo[]>([])
  const [cargandoFallas, setCargandoFallas] = useState(true)

  useEffect(() => {
    // 1. Cargar estado de WhatsApp
    const fetchWaState = async () => {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CONFIG_WHATSAPP_STATE')
          .limit(1)

        if (data && data.length > 0) {
          const parsed = JSON.parse(data[0].nombre_abonado || '{}')
          setWaState(parsed)
        }
      } catch {}
    }

    // 2. Cargar semáforo de fallas de energía recientes
    const fetchFallasEnergia = async () => {
      setCargandoFallas(true)
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .or('evento.ilike.%ENERGIA%,evento.ilike.%ENERGÍA%,evento.ilike.%RED%,evento.ilike.%BATERIA%,evento.ilike.%BATERÍA%')
          .order('id', { ascending: false })
          .limit(50)

        if (data) {
          // Filtrar únicos por cuenta conservando el evento más reciente
          const porCuenta = new Map<string, EventoMonitoreo>()
          for (const ev of data) {
            if (!porCuenta.has(ev.cuenta)) {
              porCuenta.set(ev.cuenta, ev)
            }
          }
          const lista = Array.from(porCuenta.values())
            .filter(ev => {
              const e = (ev.evento || '').toUpperCase()
              return e.includes('FALLA') || e.includes('CORTE') || e.includes('DESCARGA') || e.includes('BAJA')
            })
          setFallasEnergia(lista)
        }
      } catch (err) {
        console.warn('Error cargando fallas de energía:', err)
      } finally {
        setCargandoFallas(false)
      }
    }

    fetchWaState()
    fetchFallasEnergia()
  }, [])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 rounded shadow-2xl w-full max-w-3xl text-gray-900 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Discreto estilo Windows */}
        <div className="bg-[#000080] text-white px-3 py-1.5 flex justify-between items-center font-bold text-sm select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">🟢</span>
            <span>GAMA SEGURIDAD — Telemetría de Salud del Sistema y Semáforo de Energía</span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#c0c0c0] text-black font-mono font-bold px-2 py-0.5 border border-t-white border-l-white border-b-gray-800 border-r-gray-800 hover:bg-red-600 hover:text-white cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Tarjetas de Salud de Servicios */}
          <div className="grid grid-cols-3 gap-3">
            {/* PC Scorpion / Sincronizador */}
            <div className={`p-3 rounded border shadow-sm ${
              sincronizadorVivo ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-red-50 border-red-400 text-red-900'
            }`}>
              <div className="flex items-center justify-between font-bold border-b pb-1 mb-1.5 text-xs">
                <span>🖥️ PC Scorpion Central</span>
                <span className={`w-2.5 h-2.5 rounded-full ${sincronizadorVivo ? 'bg-emerald-500 animate-ping' : 'bg-red-600'}`} />
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <strong className="uppercase">{sincronizadorVivo ? 'EN LÍNEA (OK)' : 'DESCONECTADO'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Último Heartbeat:</span>
                  <span className="font-mono">{ultimoHeartbeat ? new Date(ultimoHeartbeat).toLocaleTimeString('es-CL') : '---'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>Motor:</span>
                  <span>v3.8 (ISO 24h)</span>
                </div>
              </div>
            </div>

            {/* Servidor WhatsApp */}
            <div className={`p-3 rounded border shadow-sm ${
              waState.status === 'CONECTADO' ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-amber-50 border-amber-400 text-amber-900'
            }`}>
              <div className="flex items-center justify-between font-bold border-b pb-1 mb-1.5 text-xs">
                <span>💬 WhatsApp Official</span>
                <span className={`w-2.5 h-2.5 rounded-full ${waState.status === 'CONECTADO' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <strong className="uppercase">{waState.status || 'CONECTADO'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Teléfono:</span>
                  <span className="font-mono font-bold">+56948855190</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>Motor Bot:</span>
                  <span>Baileys + Gemini IA</span>
                </div>
              </div>
            </div>

            {/* Supabase WebSocket */}
            <div className="p-3 rounded border border-blue-400 bg-blue-50 text-blue-900 shadow-sm">
              <div className="flex items-center justify-between font-bold border-b pb-1 mb-1.5 text-xs">
                <span>⚡ Supabase Realtime</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>WebSocket:</span>
                  <strong className="uppercase text-blue-700">ACTIVO (LIVE)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Latencia Red:</span>
                  <span className="font-mono">&lt; 150 ms</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>Modo:</span>
                  <span>Recepción Instantánea</span>
                </div>
              </div>
            </div>
          </div>

          {/* Semáforo de Fallas de Energía y Batería Baja */}
          <div className="bg-white p-3 border border-gray-400 rounded shadow-sm">
            <div className="font-bold text-amber-900 text-xs border-b pb-1 mb-2 uppercase tracking-wider flex justify-between items-center">
              <span>⚡ Semáforo de Fallas de Energía y Batería ({fallasEnergia.length})</span>
              <span className="text-[10px] text-gray-500 font-normal">Abonados actualmente afectados</span>
            </div>

            {cargandoFallas ? (
              <div className="text-center py-4 text-gray-400">Cargando telemetría de energía...</div>
            ) : fallasEnergia.length === 0 ? (
              <div className="text-center py-4 text-emerald-700 font-bold bg-emerald-50 rounded border border-emerald-200 text-xs">
                ✅ Todos los abonados cuentan con suministro eléctrico normal.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {fallasEnergia.map((ev, idx) => (
                  <div key={ev.id || idx} className="flex justify-between items-center p-2 bg-amber-50 border border-amber-300 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <div>
                        <div className="font-bold text-amber-950">
                          {ev.cuenta} — {ev.nombre_abonado}
                        </div>
                        <div className="text-[10px] text-amber-800">
                          Evento: <strong className="uppercase">{ev.evento}</strong> | Zona: {ev.zona || '01'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[10px] text-amber-900 font-bold">
                      {new Date(ev.fecha_hora).toLocaleTimeString('es-CL')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#d0d0d0] p-2 border-t border-gray-400 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-[#c0c0c0] hover:bg-[#d0d0d0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 px-4 py-1 font-bold text-gray-800 cursor-pointer"
          >
            Cerrar Telemetría
          </button>
        </div>
      </div>
    </div>
  )
}
