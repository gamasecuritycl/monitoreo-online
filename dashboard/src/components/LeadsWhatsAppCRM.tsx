'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  MessageSquare,
  Shield,
  Search,
  RefreshCw,
  Download,
  Calendar,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowLeft,
  Sparkles,
  Zap,
  PhoneCall,
  X
} from 'lucide-react'

export interface WhatsAppLead {
  id: string
  session_id: string
  nombre: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  comuna: string | null
  estado: string
  created_at: string
  updated_at: string
  last_activity: string
}

export default function LeadsWhatsAppCRM() {
  const [leads, setLeads] = useState<WhatsAppLead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroComuna, setFiltroComuna] = useState<string>('todas')
  const [leadSeleccionado, setLeadSeleccionado] = useState<WhatsAppLead | null>(null)
  const [actualizandoId, setActualizandoId] = useState<string | null>(null)

  // Cargar leads desde Supabase
  const cargarLeads = async () => {
    try {
      setRefreshing(true)
      const { data, error } = await supabase
        .from('leads_sales_gama')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error cargando leads:', error.message)
      } else if (data) {
        setLeads(data as WhatsAppLead[])
      }
    } catch (err) {
      console.error('Error de red:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Suscripción Realtime para actualizar al instante
  useEffect(() => {
    cargarLeads()

    const channel = supabase
      .channel('leads_sales_gama_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads_sales_gama' },
        () => {
          cargarLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Cambiar estado de un lead
  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    setActualizandoId(id)
    try {
      const { error } = await supabase
        .from('leads_sales_gama')
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .eq('id', id)

      if (!error) {
        setLeads(prev =>
          prev.map(l => (l.id === id ? { ...l, estado: nuevoEstado, updated_at: new Date().toISOString() } : l))
        )
        if (leadSeleccionado?.id === id) {
          setLeadSeleccionado(prev => prev ? { ...prev, estado: nuevoEstado } : null)
        }
      }
    } catch (err) {
      console.error('Error actualizando estado:', err)
    } finally {
      setActualizandoId(null)
    }
  }

  // Métricas calculadas
  const metricas = useMemo(() => {
    const total = leads.length
    const calificados = leads.filter(l => l.estado === 'calificado' || l.nombre && l.comuna).length
    const visitasAgendadas = leads.filter(l => l.estado === 'visita_agendada' || l.direccion?.includes('Visita')).length
    const requiereHumano = leads.filter(l => l.estado === 'requiere_humano' || l.estado === 'humano').length
    const enConversacion = leads.filter(l => l.estado === 'en_conversacion' || l.estado === 'nuevo').length

    return { total, calificados, visitasAgendadas, requiereHumano, enConversacion }
  }, [leads])

  // Lista única de comunas para el filtro
  const listaComunas = useMemo(() => {
    const comunas = leads
      .map(l => l.comuna?.trim())
      .filter((c): c is string => Boolean(c && c.length > 2))
    return Array.from(new Set(comunas)).sort()
  }, [leads])

  // Filtrado de leads
  const leadsFiltrados = useMemo(() => {
    return leads.filter(l => {
      const matchSearch =
        search === '' ||
        (l.nombre && l.nombre.toLowerCase().includes(search.toLowerCase())) ||
        (l.telefono && l.telefono.includes(search)) ||
        (l.comuna && l.comuna.toLowerCase().includes(search.toLowerCase())) ||
        (l.direccion && l.direccion.toLowerCase().includes(search.toLowerCase()))

      const matchEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'visita_agendada' && (l.estado === 'visita_agendada' || l.direccion?.includes('Visita'))) ||
        (filtroEstado === 'calificado' && l.estado === 'calificado') ||
        (filtroEstado === 'requiere_humano' && (l.estado === 'requiere_humano' || l.estado === 'humano')) ||
        (filtroEstado === 'en_conversacion' && l.estado === 'en_conversacion')

      const matchComuna =
        filtroComuna === 'todas' ||
        (l.comuna && l.comuna.toLowerCase() === filtroComuna.toLowerCase())

      return matchSearch && matchEstado && matchComuna
    })
  }, [leads, search, filtroEstado, filtroComuna])

  // Exportar a Excel (CSV con UTF-8 BOM)
  const exportarCSV = () => {
    if (leads.length === 0) return

    const encabezados = ['ID', 'Fecha Registro', 'Nombre', 'Teléfono', 'Comuna', 'Detalle Propiedad / Solución', 'Estado']
    const filas = leads.map(l => [
      `"${l.session_id || l.id}"`,
      `"${new Date(l.created_at || l.updated_at).toLocaleString('es-CL')}"`,
      `"${l.nombre || 'No indicado'}"`,
      `"${l.telefono || ''}"`,
      `"${l.comuna || 'No indicada'}"`,
      `"${(l.direccion || '').replace(/"/g, '""')}"`,
      `"${l.estado || 'en_conversacion'}"`
    ])

    const csvContent = '\uFEFF' + [encabezados.join(';'), ...filas.map(f => f.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Leads_WhatsApp_GAMA_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-8 font-sans">
      {/* HEADER SUPERIOR */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/operacion"
                className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors bg-sky-950/40 border border-sky-800/60 px-2.5 py-1 rounded-lg"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a Operaciones
              </Link>
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Bot Cloud 24/7 Live
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-sky-400" />
              Centro de Leads WhatsApp
              <span className="text-sm font-semibold text-sky-400 bg-sky-950/80 border border-sky-800 px-3 py-0.5 rounded-full">
                Meta Ads & Ventas
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitoreo en tiempo real de prospectos capturados por el Bot de WhatsApp en la nube (Pack VETTI Smart & 0,9 UF)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cargarLeads}
              disabled={refreshing}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium px-4 py-2 rounded-xl border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
              title="Refrescar leads"
            >
              <RefreshCw className={`w-4 h-4 text-sky-400 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={exportarCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
            <a
              href="https://gama-ventas-bot.onrender.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl transition-all"
            >
              <span>Ver Bot Web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* BENTO KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-6">
          <div className="bg-[#0c1424] border border-slate-800/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>TOTAL LEADS</span>
              <MessageSquare className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{metricas.total}</div>
            <div className="text-[11px] text-slate-500 mt-1">Meta Ads & WhatsApp</div>
          </div>

          <div className="bg-[#0c1424] border border-emerald-900/40 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-2">
              <span>VISITAS $0 AGENDADAS</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-emerald-400">{metricas.visitasAgendadas}</div>
            <div className="text-[11px] text-emerald-600/90 mt-1">Evaluación técnica en terreno</div>
          </div>

          <div className="bg-[#0c1424] border border-sky-900/40 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-sky-400 text-xs font-semibold mb-2">
              <span>LEADS CALIFICADOS</span>
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-sky-400">{metricas.calificados}</div>
            <div className="text-[11px] text-sky-600/90 mt-1">Con nombre y comuna</div>
          </div>

          <div className="bg-[#0c1424] border border-amber-900/40 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-amber-400 text-xs font-semibold mb-2">
              <span>REQUIERE ASESOR</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-amber-400">{metricas.requiereHumano}</div>
            <div className="text-[11px] text-amber-600/90 mt-1">Human Handoff activado</div>
          </div>

          <div className="bg-[#0c1424] border border-slate-800/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>EN CONVERSACIÓN</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-300">{metricas.enConversacion}</div>
            <div className="text-[11px] text-slate-500 mt-1">Interactuando con Bot</div>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="bg-[#0c1424] border border-slate-800 rounded-2xl p-4 mt-6 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o comuna..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filtro Estado */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="todos" className="bg-slate-900">Todos los Estados</option>
                <option value="visita_agendada" className="bg-slate-900">Visitas Agendadas</option>
                <option value="calificado" className="bg-slate-900">Calificados</option>
                <option value="requiere_humano" className="bg-slate-900">Requiere Humano</option>
                <option value="en_conversacion" className="bg-slate-900">En Conversación</option>
              </select>
            </div>

            {/* Filtro Comuna */}
            {listaComunas.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filtroComuna}
                  onChange={e => setFiltroComuna(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="todas" className="bg-slate-900">Todas las Comunas</option>
                  {listaComunas.map(c => (
                    <option key={c} value={c} className="bg-slate-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* TABLA PRINCIPAL DE LEADS */}
        <div className="bg-[#0c1424] border border-slate-800 rounded-2xl overflow-hidden mt-6 shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              <span>Cargando prospectos de WhatsApp...</span>
            </div>
          ) : leadsFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-300">No se encontraron prospectos</p>
              <p className="text-xs text-slate-500 mt-1">Los mensajes entrantes de Meta Ads y WhatsApp aparecerán aquí en vivo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Cliente / Contacto</th>
                    <th className="px-4 py-3.5 font-semibold">Comuna</th>
                    <th className="px-4 py-3.5 font-semibold">Propiedad / Solución</th>
                    <th className="px-4 py-3.5 font-semibold">Estado</th>
                    <th className="px-4 py-3.5 font-semibold">Última Actividad</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Acción Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal">
                  {leadsFiltrados.map(lead => {
                    const esVisita = lead.estado === 'visita_agendada' || lead.direccion?.includes('Visita')
                    const esCalificado = lead.estado === 'calificado'
                    const esHumano = lead.estado === 'requiere_humano' || lead.estado === 'humano'
                    const numeroLimpio = lead.telefono ? lead.telefono.replace(/[^0-9]/g, '') : ''

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setLeadSeleccionado(lead)}
                      >
                        {/* CLIENTE */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-sky-400 shrink-0">
                              {lead.nombre ? lead.nombre.charAt(0).toUpperCase() : <User className="w-4 h-4 text-slate-400" />}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">
                                {lead.nombre || 'Prospecto WhatsApp'}
                              </div>
                              <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-500" />
                                {lead.telefono ? `+${lead.telefono}` : 'Sin número'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* COMUNA */}
                        <td className="px-4 py-4">
                          {lead.comuna ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-200 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              {lead.comuna}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Por definir</span>
                          )}
                        </td>

                        {/* PROPIEDAD / DETALLE */}
                        <td className="px-4 py-4">
                          <div className="text-xs text-slate-300 max-w-xs truncate" title={lead.direccion || ''}>
                            {lead.direccion || 'Alarma con Monitoreo 24/7 (0,9 UF)'}
                          </div>
                        </td>

                        {/* ESTADO */}
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <select
                            value={lead.estado}
                            disabled={actualizandoId === lead.id}
                            onChange={e => cambiarEstado(lead.id, e.target.value)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
                              esVisita
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                                : esCalificado
                                ? 'bg-sky-950/80 text-sky-300 border-sky-700/80'
                                : esHumano
                                ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <option value="en_conversacion" className="bg-slate-900 text-slate-200">En conversación</option>
                            <option value="calificado" className="bg-slate-900 text-sky-300">Calificado</option>
                            <option value="visita_agendada" className="bg-slate-900 text-emerald-300">Visita $0 Agendada</option>
                            <option value="requiere_humano" className="bg-slate-900 text-amber-300">Requiere Humano</option>
                            <option value="contactado" className="bg-slate-900 text-slate-300">Contactado</option>
                            <option value="cerrado" className="bg-slate-900 text-indigo-300">Cerrado Ganado</option>
                            <option value="descartado" className="bg-slate-900 text-slate-400">Descartado</option>
                          </select>
                        </td>

                        {/* ÚLTIMA ACTIVIDAD */}
                        <td className="px-4 py-4 text-xs text-slate-400">
                          {lead.updated_at
                            ? new Date(lead.updated_at).toLocaleString('es-CL', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </td>

                        {/* ACCIONES */}
                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {numeroLimpio && (
                              <>
                                <a
                                  href={`https://wa.me/${numeroLimpio}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                  title="Abrir chat en WhatsApp Web"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Chat</span>
                                </a>
                                <a
                                  href={`tel:+${numeroLimpio}`}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                  title="Llamar al cliente"
                                >
                                  <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLE DE LEAD */}
      {leadSeleccionado && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLeadSeleccionado(null)}
        >
          <div
            className="bg-[#0c1424] border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLeadSeleccionado(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-950 border border-sky-800 flex items-center justify-center text-xl font-bold text-sky-400">
                {leadSeleccionado.nombre ? leadSeleccionado.nombre.charAt(0).toUpperCase() : 'W'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {leadSeleccionado.nombre || 'Prospecto WhatsApp'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  +{leadSeleccionado.telefono || 'Sin teléfono'}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 my-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-sm">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                <span className="text-xs text-slate-400">Comuna:</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {leadSeleccionado.comuna || 'No especificada'}
                </span>
              </div>
              <div className="flex justify-between items-start pb-2.5 border-b border-slate-800">
                <span className="text-xs text-slate-400">Detalle / Requerimiento:</span>
                <span className="font-semibold text-slate-200 text-right max-w-[240px]">
                  {leadSeleccionado.direccion || 'Monitoreo Alarma 24/7 (0,9 UF)'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                <span className="text-xs text-slate-400">Estado actual:</span>
                <span className="font-semibold text-emerald-400 uppercase text-xs">
                  {leadSeleccionado.estado}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Fecha de captura:</span>
                <span className="text-xs text-slate-300">
                  {new Date(leadSeleccionado.created_at || leadSeleccionado.updated_at).toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {leadSeleccionado.telefono && (
                <a
                  href={`https://wa.me/${leadSeleccionado.telefono.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-emerald-900/30"
                >
                  <MessageSquare className="w-4 h-4" />
                  Abrir Chat de WhatsApp
                </a>
              )}
              <button
                onClick={() => setLeadSeleccionado(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-5 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
