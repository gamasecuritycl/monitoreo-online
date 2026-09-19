'use client'

import React from 'react'
import { User, FileText, FileCheck, Megaphone, DollarSign, Receipt, Wrench, BarChart3, Settings, Bot, Layers, X, ShieldCheck } from 'lucide-react'

interface OperacionSidebarProps {
  moduloActivo: string
  setModuloActivo: (mId: any) => void
  sidebarAbierto: boolean
  setSidebarAbierto: (v: boolean) => void
  cantEmpresas: number
  cantClientes: number
  cantCentros: number
}

export default function OperacionSidebar({
  moduloActivo,
  setModuloActivo,
  sidebarAbierto,
  setSidebarAbierto,
  cantEmpresas,
  cantClientes,
  cantCentros
}: OperacionSidebarProps) {
  if (!sidebarAbierto) return null

  const grupos = [
    {
      titulo: 'OPERACIONES & MONITOREO',
      items: [
        { id: 'ficha360', label: 'Ficha 360° Cliente', icon: User },
        { id: 'serv_tecnico', label: 'Servicios Técnicos (OTs)', icon: Wrench },
        { id: 'autonomia', label: 'Agentes Autónomos IA', icon: Bot },
      ]
    },
    {
      titulo: 'COMERCIAL & CONTRATOS',
      items: [
        { id: 'presupuestos', label: 'Presupuestos & DTE', icon: FileText },
        { id: 'contratos', label: 'Contratos & Firma Digital', icon: FileCheck },
        { id: 'marketing', label: 'Marketing B2B', icon: Megaphone },
      ]
    },
    {
      titulo: 'FINANZAS & ERP',
      items: [
        { id: 'facturacion', label: 'Cobranza & Abonos', icon: DollarSign },
        { id: 'compras', label: 'Compras & Proveedores', icon: Receipt },
        { id: 'kpis', label: 'Reportes & Analytics', icon: BarChart3 },
      ]
    },
    {
      titulo: 'LEGAL & CUMPLIMIENTO',
      items: [
        { id: 'ley21719', label: 'Ley 21.719 Datos Personales', icon: ShieldCheck },
      ]
    },
    {
      titulo: 'SISTEMA',
      items: [
        { id: 'config', label: 'Configuración & Claves', icon: Settings },
      ]
    }
  ]

  return (
    <>
      {/* Backdrop para movil */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden transition-opacity"
        onClick={() => setSidebarAbierto(false)}
      />

      <aside className="fixed inset-y-0 left-0 z-50 lg:relative lg:inset-auto lg:z-auto w-72 sm:w-80 bg-[#0a1628]/95 lg:bg-[#0c182b]/85 backdrop-blur-2xl border-r lg:border border-white/10 lg:border-[#1e3a5f]/60 p-5 sm:p-6 rounded-r-3xl lg:rounded-3xl flex flex-col gap-6 shrink-0 shadow-2xl transition-all overflow-y-auto max-h-screen lg:max-h-none font-sans">
        
        {/* Header Mobile Toggle */}
        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider px-2 mb-1 flex justify-between items-center">
          <span className="flex items-center gap-2 text-slate-100 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-[#2997ff] animate-pulse" />
            CENTRAL OPERATIVA GAMA
          </span>
          <button
            onClick={() => setSidebarAbierto(false)}
            className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer p-2 rounded-xl bg-white/5 hover:bg-white/10 lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categorized Modules */}
        <div className="space-y-6 sm:space-y-7">
          {grupos.map((grp) => (
            <div key={grp.titulo} className="space-y-2.5">
              <div className="text-[10px] sm:text-[11px] font-bold text-[#2997ff]/80 uppercase tracking-widest px-2.5 font-mono">
                {grp.titulo}
              </div>
              <div className="space-y-2">
                {grp.items.map((m) => {
                  const IconComp = m.icon
                  const esActivo = moduloActivo === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModuloActivo(m.id)
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                          setSidebarAbierto(false)
                        }
                      }}
                      className={`w-full min-h-[52px] text-left py-3.5 px-4.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-3.5 cursor-pointer relative group ${
                        esActivo
                          ? 'bg-gradient-to-r from-[#0066cc] to-[#0077ed] text-white shadow-xl shadow-[#0066cc]/30 border border-[#2997ff]/60 scale-[1.01]'
                          : 'bg-[#0f2240]/40 text-slate-300 hover:bg-[#162a4a]/80 hover:text-white border border-[#1e3a5f]/40 hover:border-[#2997ff]/40 hover:scale-[1.005]'
                      }`}
                    >
                      <IconComp className={`h-5 w-5 stroke-[1.8] shrink-0 transition-transform duration-200 group-hover:scale-110 ${esActivo ? 'text-white' : 'text-[#2997ff]'}`} />
                      <span className="truncate tracking-tight flex-1">{m.label}</span>
                      {esActivo && (
                        <span className="w-1.5 h-4 rounded-full bg-white/80 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Data Architecture Widget */}
        <div className="mt-auto bg-[#050d1a]/80 border border-white/10 p-5 rounded-2xl text-xs space-y-3 text-slate-400 backdrop-blur-md">
          <div className="font-semibold text-white text-[10px] uppercase tracking-widest mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#2997ff]">
              <Layers className="h-4 w-4 stroke-[1.5]" />
              ESTRUCTURA DE DATOS
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-mono font-bold">
              PRO
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
            <span>Empresas Emisoras:</span>
            <strong className="text-white font-mono font-semibold text-xs sm:text-sm">{cantEmpresas}</strong>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span>Clientes Registrados:</span>
            <strong className="text-white font-mono font-semibold text-xs sm:text-sm">{cantClientes}</strong>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span>Centros de Costo:</span>
            <strong className="text-white font-mono font-semibold text-xs sm:text-sm">{cantCentros}</strong>
          </div>
        </div>

      </aside>
    </>
  )
}
