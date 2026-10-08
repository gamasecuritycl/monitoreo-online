'use client'

import React, { useState, useMemo } from 'react'
import {
  User,
  FileText,
  FileCheck,
  Megaphone,
  DollarSign,
  Receipt,
  Wrench,
  BarChart3,
  Settings,
  Bot,
  Layers,
  X,
  ShieldCheck,
  Building2,
  Sparkles,
  Mail,
  Search,
  Home,
  Target
} from 'lucide-react'

interface OperacionSidebarProps {
  moduloActivo: string | null
  setModuloActivo: (mId: any) => void
  sidebarAbierto: boolean
  setSidebarAbierto: (v: boolean) => void
  cantEmpresas: number
  cantClientes: number
  cantCentros: number
  onOpenBotConfig?: () => void
  onOpenBotLeads?: () => void
}

export default function OperacionSidebar({
  moduloActivo,
  setModuloActivo,
  sidebarAbierto,
  setSidebarAbierto,
  cantEmpresas,
  cantClientes,
  cantCentros,
  onOpenBotConfig,
  onOpenBotLeads
}: OperacionSidebarProps) {
  const [busqueda, setBusqueda] = useState('')

  if (!sidebarAbierto) return null

  const grupos = [
    {
      titulo: 'OPERACIONES & MONITOREO',
      items: [
        { id: 'ficha360', label: 'Ficha 360° Cliente', icon: User, desc: 'Expedientes, abonados y contactos' },
        { id: 'serv_tecnico', label: 'Servicios Técnicos (OTs)', icon: Wrench, desc: 'Gestión de órdenes de trabajo y terreno' },
        { id: 'autonomia', label: 'Agentes Autónomos IA', icon: Bot, desc: 'Supervisión 24/7 y auditoría en vivo' },
      ]
    },
    {
      titulo: 'COMERCIAL & CONTRATOS',
      items: [
        { id: 'presupuestos', label: 'Presupuestos Comerciales', icon: FileText, desc: 'Cotizaciones oficiales PDF con catálogo' },
        { id: 'entrenamiento_bot', label: 'Entrenamiento Bot Ventas', icon: Sparkles, desc: 'Catálogo de productos, promociones, afiches y prompt IA' },
        { id: 'salesbot', label: 'Sales-Bot IA & Leads Hub', icon: Bot, desc: 'Captura de prospectos y agente de ventas' },
        { id: 'landing_marketing', label: 'Landing Marketing', icon: Sparkles, desc: 'Control de hero, popups y web oficial' },
        { id: 'gestion_mails', label: 'Gestión de Mails IA', icon: Mail, desc: 'Campañas de email con redactor IA' },
        { id: 'mercadopublico', label: 'Mercado Público & Licitaciones', icon: Building2, desc: 'Radar de licitaciones ChileCompra' },
        { id: 'contratos', label: 'Contratos & Firma Digital', icon: FileCheck, desc: 'Firma en pantalla táctil y descarga PDF' },
        { id: 'marketing', label: 'Marketing B2B', icon: Megaphone, desc: 'Campañas comerciales y prospección' },
      ]
    },
    {
      titulo: 'FINANZAS & ERP',
      items: [
        { id: 'facturacion', label: 'Cobranza & Abonos', icon: DollarSign, desc: 'Facturación mensual y recaudación' },
        { id: 'compras', label: 'Compras & Proveedores', icon: Receipt, desc: 'Insumos de seguridad y órdenes de compra' },
        { id: 'kpis', label: 'Reportes & Analytics', icon: BarChart3, desc: 'Métricas ejecutivas y rendimiento' },
      ]
    },
    {
      titulo: 'LEGAL & CUMPLIMIENTO',
      items: [
        { id: 'ley21719', label: 'Ley 21.719 Datos Personales', icon: ShieldCheck, desc: 'Cumplimiento APDP y certificados oficiales' },
      ]
    },
    {
      titulo: 'SISTEMA',
      items: [
        { id: 'config', label: 'Configuración & Claves', icon: Settings, desc: 'Razones sociales y parámetros del sistema' },
      ]
    }
  ]

  const gruposFiltrados = grupos.map(grp => {
    if (!busqueda.trim()) return grp
    const q = busqueda.toLowerCase().trim()
    const items = grp.items.filter(it =>
      it.label.toLowerCase().includes(q) ||
      it.desc.toLowerCase().includes(q)
    )
    return { ...grp, items }
  }).filter(grp => grp.items.length > 0)

  return (
    <>
      {/* Backdrop para móvil y desktop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
        onClick={() => setSidebarAbierto(false)}
      />

      <aside className="fixed inset-y-0 left-0 z-50 w-full max-w-xs sm:max-w-sm bg-white border-r border-slate-300 p-5 sm:p-6 flex flex-col gap-5 shadow-2xl transition-all overflow-y-auto font-sans animate-in slide-in-from-left duration-250">
        
        {/* Cabecera del Drawer */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B2545] animate-pulse" />
            <div>
              <span className="font-black text-slate-900 text-sm tracking-tight block">
                MÓDULOS DE CONTROL
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                Central Operativa GAMA Security 24/7
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarAbierto(false)}
            className="text-slate-400 hover:text-slate-900 font-bold p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer active:scale-95"
            title="Cerrar panel de módulos (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Buscador Rápido de Módulos */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar entre los 16 módulos..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF] focus:bg-white transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Botón Volver a Menú Principal / Launchpad */}
        <button
          onClick={() => {
            setModuloActivo(null)
            setSidebarAbierto(false)
          }}
          className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2.5 cursor-pointer border ${
            !moduloActivo
              ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <Home className="h-4 w-4 shrink-0 text-indigo-500" />
          <span>Launchpad / Menú Principal (Inicio)</span>
        </button>

        {/* Módulos Agrupados */}
        <div className="space-y-5 overflow-y-auto flex-1 pr-1">
          {gruposFiltrados.map((grp) => (
            <div key={grp.titulo} className="space-y-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 font-mono">
                {grp.titulo} ({grp.items.length})
              </div>
              <div className="space-y-1.5">
                {grp.items.map((m) => {
                  const IconComp = m.icon
                  const esActivo = moduloActivo === m.id
                  return (
                    <div key={m.id} className="space-y-1">
                      <button
                        onClick={() => {
                          setModuloActivo(m.id)
                          setSidebarAbierto(false)
                        }}
                        className={`w-full text-left py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-150 flex items-center gap-2.5 cursor-pointer relative group ${
                          esActivo
                            ? 'bg-[#0B2545] text-white shadow-md border border-[#0B2545]'
                            : 'bg-slate-50/70 text-slate-700 hover:bg-blue-50/70 hover:text-slate-900 border border-slate-200/80 hover:border-blue-200'
                        }`}
                      >
                        <IconComp className={`h-4 w-4 shrink-0 ${esActivo ? 'text-white' : 'text-[#1E40AF]'}`} />
                        <div className="truncate flex-1">
                          <span className="block leading-tight">{m.label}</span>
                          <span className={`text-[10px] font-normal truncate block ${esActivo ? 'text-blue-200' : 'text-slate-400'}`}>
                            {m.desc}
                          </span>
                        </div>
                        {esActivo && (
                          <span className="w-1.5 h-3.5 rounded-full bg-white shrink-0" />
                        )}
                      </button>

                      {/* Sub-acciones para Sales-Bot */}
                      {m.id === 'salesbot' && (
                        <div className="grid grid-cols-2 gap-1.5 pl-6 pt-0.5">
                          {onOpenBotLeads && (
                            <button
                              onClick={() => {
                                onOpenBotLeads()
                                setSidebarAbierto(false)
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                            >
                              <Target className="h-3 w-3 text-amber-600" />
                              <span>Ver Leads 🔥</span>
                            </button>
                          )}
                          {onOpenBotConfig && (
                            <button
                              onClick={() => {
                                onOpenBotConfig()
                                setSidebarAbierto(false)
                              }}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                            >
                              <Sparkles className="h-3 w-3 text-blue-600" />
                              <span>Config Catálogo</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Resumen Operativo */}
        <div className="mt-auto bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-2 text-slate-600 shrink-0">
          <div className="font-extrabold text-slate-900 text-[10px] uppercase tracking-widest flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#0B2545]">
              <Layers className="h-3.5 w-3.5" />
              SISTEMA INTEGRAL
            </span>
            <span className="text-[9px] bg-blue-50 text-[#0B2545] border border-blue-200 px-1.5 py-0.2 rounded-full font-mono font-bold">
              16 MÓDULOS
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-200">
            <span>Empresas: <strong className="text-slate-900 font-mono">{cantEmpresas}</strong></span>
            <span>Clientes: <strong className="text-[#1E40AF] font-mono">{cantClientes}</strong></span>
            <span>Centros: <strong className="text-emerald-700 font-mono">{cantCentros}</strong></span>
          </div>
        </div>

      </aside>
    </>
  )
}
