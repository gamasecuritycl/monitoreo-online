'use client'

import React from 'react'
import { User, FileText, Megaphone, DollarSign, Wrench, BarChart3, Settings, Bot, Layers, X, ShieldCheck } from 'lucide-react'

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
      titulo: 'COMERCIAL & MARKETING',
      items: [
        { id: 'presupuestos', label: 'Presupuestos & DTE', icon: FileText },
        { id: 'marketing', label: 'Marketing B2B', icon: Megaphone },
      ]
    },
    {
      titulo: 'FINANZAS & REPORTES',
      items: [
        { id: 'facturacion', label: 'Cobranza & Abonos', icon: DollarSign },
        { id: 'kpis', label: 'Reportes & Analytics', icon: BarChart3 },
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        onClick={() => setSidebarAbierto(false)}
      />

      <aside className="fixed inset-y-0 left-0 z-50 lg:relative lg:inset-auto lg:z-auto w-72 sm:w-80 bg-[#0a1628]/95 backdrop-blur-xl border border-[#1e3a5f]/60 p-5 sm:p-6 rounded-r-3xl lg:rounded-3xl flex flex-col gap-6 shrink-0 shadow-2xl transition-all overflow-y-auto max-h-screen lg:max-h-none font-sans">
        
        {/* Header Mobile Toggle */}
        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider px-2 mb-1 flex justify-between items-center">
          <span className="flex items-center gap-2 text-slate-200 font-semibold">
            <ShieldCheck className="h-4 w-4 text-[#2997ff]" />
            MENÚ DE MONITOREO
          </span>
          <button
            onClick={() => setSidebarAbierto(false)}
            className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer p-1.5 rounded-lg hover:bg-[#162a4a] lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categorized Modules */}
        <div className="space-y-6 sm:space-y-7">
          {grupos.map((grp) => (
            <div key={grp.titulo} className="space-y-2.5">
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 font-mono">
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
                      className={`w-full text-left py-3.5 px-4 sm:py-4 sm:px-4.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-3.5 cursor-pointer ${
                        esActivo
                          ? 'bg-[#0066cc] text-white shadow-lg shadow-[#0066cc]/30 border border-[#2997ff]/50 scale-[1.01]'
                          : 'bg-[#0f2240]/40 text-slate-200 hover:bg-[#162a4a] hover:text-white border border-[#1e3a5f]/50 hover:border-[#2997ff]/30'
                      }`}
                    >
                      <IconComp className={`h-5 w-5 stroke-[1.75] shrink-0 ${esActivo ? 'text-white' : 'text-[#2997ff]'}`} />
                      <span className="truncate">{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Data Architecture Widget */}
        <div className="mt-auto bg-[#050d1a] border border-[#1e3a5f] p-4.5 rounded-2xl text-xs space-y-2.5 text-slate-400">
          <div className="font-semibold text-white text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-[#2997ff] stroke-[1.5]" />
            <span>ESTRUCTURA DE DATOS</span>
          </div>
          <div className="flex justify-between items-center text-xs">
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
