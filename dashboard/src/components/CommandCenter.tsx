'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, type EventoMonitoreo } from '@/lib/supabase'
import SearchBar from './SearchBar'
import EventTable from './EventTable'
import StatsBar from './StatsBar'

export default function CommandCenter() {
  const [eventos, setEventos] = useState<EventoMonitoreo[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)

  const fetchEventos = useCallback(async () => {
    try {
      let query = supabase
        .from('eventos_monitoreo')
        .select('*')
        .order('fecha_hora', { ascending: false })
        .limit(50)

      if (busqueda.trim()) {
        query = query.or(`cuenta.ilike.%${busqueda}%,nombre_abonado.ilike.%${busqueda}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching eventos:', error)
        return
      }

      setEventos(data || [])
      setUltimaActualizacion(new Date())
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setCargando(false)
    }
  }, [busqueda])

  useEffect(() => {
    fetchEventos()
  }, [fetchEventos])

  useEffect(() => {
    const channel = supabase
      .channel('eventos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'eventos_monitoreo',
        },
        () => {
          fetchEventos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEventos])

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">GAMA SEGURIDAD</h1>
                  <p className="text-xs text-slate-400 -mt-1">Command Center</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-live" />
                <span className="hidden sm:inline">Sistema Activo</span>
              </div>
              {ultimaActualizacion && (
                <div className="text-xs text-slate-500 hidden md:block">
                  Actualizado: {ultimaActualizacion.toLocaleTimeString('es-CL')}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <StatsBar eventos={eventos} />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Eventos en Tiempo Real</h2>
            <p className="text-sm text-slate-400 mt-1">
              {cargando ? 'Cargando...' : `${eventos.length} registros recientes`}
            </p>
          </div>
          <SearchBar value={busqueda} onChange={setBusqueda} />
        </div>

        {/* Event Table */}
        <EventTable eventos={eventos} />

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-600">
          Gama Seguridad &copy; {new Date().getFullYear()} — Sistema de Monitoreo en Tiempo Real
        </div>
      </main>
    </div>
  )
}
