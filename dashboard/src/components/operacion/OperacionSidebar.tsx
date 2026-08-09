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

      <aside className="fixed inset-y-0 left-0 z-50 lg:relative lg:inset-auto lg:z-auto w-72 bg-[#0a1628]/95 backdrop-blur-xl border border-[#1e3a5f]/60 p-5 rounded-r-3xl lg:rounded-3xl flex flex-col gap-6 shrink-0 shadow-2xl transition-all overflow-y-auto max-h-screen lg:max-h-none font-sans">
        
        {/* Header Mobile Toggle */}
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1 flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-[#2997ff]" />
            MENÚ DE MONITOREO
          </span>
          <button
            onClick={() => setSidebarAbierto(false)}
            className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer p-1 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Categorized Modules */}
        <div className="space-y-6">
          {grupos.map((grp) => (
            <div key={grp.titulo} className="space-y-2">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 font-mono">
                {grp.titulo}
              </div>
              <div className="space-y-1">
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
                      className={`w-full text-left p-3 rounded-2xl font-medium text-xs transition-all flex items-center gap-3 cursor-pointer ${
                        esActivo
                          ? 'bg-[#0066cc] text-white shadow-lg shadow-[#0066cc]/30 border border-[#2997ff]/40'
                          : 'bg-[#0f2240]/30 text-slate-300 hover:bg-[#162a4a] hover:text-white border border-[#1e3a5f]/40'
                      }`}
                    >
                      <IconComp className={`h-4 w-4 stroke-[1.5] ${esActivo ? 'text-white' : 'text-[#2997ff]'}`} />
                      <span>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Data Architecture Widget */}
        <div className="mt-auto bg-[#050d1a] border border-[#1e3a5f] p-4 rounded-2xl text-xs space-y-2 text-slate-400">
          <div className="font-semibold text-white text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[#2997ff] stroke-[1.5]" />
            <span>ESTRUCTURA DE DATOS</span>
          </div>
          <div className="flex justify-between">
            <span>Empresas Emisoras:</span>
            <strong className="text-white font-mono font-semibold">{cantEmpresas}</strong>
          </div>
          <div className="flex justify-between">
            <span>Clientes Registrados:</span>
            <strong className="text-white font-mono font-semibold">{cantClientes}</strong>
          </div>
          <div className="flex justify-between">
            <span>Centros de Costo:</span>
            <strong className="text-white font-mono font-semibold">{cantCentros}</strong>
          </div>
        </div>

      </aside>
    </>
  )
}
