'use client'

import React from 'react'
import { User, FileText, FileCheck, Megaphone, DollarSign, Receipt, Wrench, BarChart3, Settings, Bot, Layers, X, ShieldCheck, Building2 } from 'lucide-react'

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
        { id: 'presupuestos', label: 'Presupuestos Comerciales', icon: FileText },
        { id: 'mercadopublico', label: 'Mercado Público & Licitaciones', icon: Building2 },
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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        onClick={() => setSidebarAbierto(false)}
      />

      <aside className="fixed inset-y-0 left-0 z-50 lg:relative lg:inset-auto lg:z-auto w-72 sm:w-80 bg-white/95 backdrop-blur-2xl border-r lg:border border-slate-300/80 p-5 sm:p-6 rounded-r-3xl lg:rounded-3xl flex flex-col gap-6 shrink-0 shadow-2xl transition-all overflow-y-auto max-h-screen lg:max-h-none font-sans">
        
        {/* Header Mobile Toggle */}
        <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider px-2 mb-1 flex justify-between items-center">
          <span className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
            <span className="w-2 h-2 rounded-full bg-[#0B2545] animate-pulse" />
            CENTRAL OPERATIVA GAMA
          </span>
          <button
            onClick={() => setSidebarAbierto(false)}
            className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer p-2 rounded-xl bg-slate-100 hover:bg-slate-200 lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categorized Modules */}
        <div className="space-y-6 sm:space-y-7">
          {grupos.map((grp) => (
            <div key={grp.titulo} className="space-y-2.5">
              <div className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-widest px-2.5 font-mono">
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
                      className={`w-full min-h-[52px] text-left py-3.5 px-4.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-3.5 cursor-pointer relative group ${
                        esActivo
                          ? 'bg-[#0B2545] text-white shadow-xl shadow-blue-950/20 border border-[#0B2545] scale-[1.01]'
                          : 'bg-slate-50/70 text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 hover:scale-[1.005]'
                      }`}
                    >
                      <IconComp className={`h-5 w-5 stroke-[2] shrink-0 transition-transform duration-200 group-hover:scale-110 ${esActivo ? 'text-white' : 'text-[#0B2545]'}`} />
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
        <div className="mt-auto bg-slate-50 border border-slate-200/90 p-5 rounded-2xl text-xs space-y-3 text-slate-600 shadow-sm">
          <div className="font-extrabold text-slate-900 text-[10px] uppercase tracking-widest mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#0B2545]">
              <Layers className="h-4 w-4 stroke-[2]" />
              ESTRUCTURA DE DATOS
            </span>
            <span className="text-[9px] bg-blue-50 text-[#0B2545] border border-blue-200 px-2 py-0.5 rounded-full font-mono font-extrabold">
              PRO
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/70">
            <span>Empresas Emisoras:</span>
            <strong className="text-slate-900 font-mono font-bold text-xs sm:text-sm">{cantEmpresas}</strong>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span>Clientes Registrados:</span>
            <strong className="text-slate-900 font-mono font-bold text-xs sm:text-sm">{cantClientes}</strong>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span>Centros de Costo:</span>
            <strong className="text-slate-900 font-mono font-bold text-xs sm:text-sm">{cantCentros}</strong>
          </div>
        </div>

      </aside>
    </>
  )
}
