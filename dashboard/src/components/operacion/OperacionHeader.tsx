'use client'

import React from 'react'
import { Shield, Search, DollarSign, ExternalLink, Plus, SlidersHorizontal, Sparkles } from 'lucide-react'

interface OperacionHeaderProps {
  moduloActivoLabel: string
  cantEmpresas: number
  valorUF: number
  sidebarAbierto: boolean
  setSidebarAbierto: (v: boolean) => void
  onOpenCommandPalette: () => void
  onQuickCotizacion: () => void
  onQuickOT: () => void
}

export default function OperacionHeader({
  moduloActivoLabel,
  cantEmpresas,
  valorUF,
  sidebarAbierto,
  setSidebarAbierto,
  onOpenCommandPalette,
  onQuickCotizacion,
  onQuickOT
}: OperacionHeaderProps) {
  return (
    <header className="bg-[#0a1628]/90 backdrop-blur-xl border border-[#1e3a5f]/60 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 no-imprimir shadow-2xl transition-all font-sans">
      
      {/* Brand & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="bg-[#0f2240] hover:bg-[#162a4a] text-slate-300 hover:text-white p-2.5 rounded-xl border border-[#1e3a5f] transition-all cursor-pointer flex items-center justify-center"
            title="Abrir/Cerrar Menú Lateral"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#2997ff] stroke-[1.5]" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-[#0066cc]/20 border border-[#0066cc]/40 text-[#2997ff] flex items-center justify-center shrink-0 shadow-inner">
            <Shield className="h-5 w-5 stroke-[1.5]" />
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <span className="text-slate-400">Central Operativa</span>
              <span className="text-slate-600">/</span>
              <span className="text-[#2997ff]">{moduloActivoLabel}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
              GAMA SECURITY CRM 360°
              <span className="bg-[#0066cc]/20 text-[#2997ff] border border-[#0066cc]/40 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2997ff] animate-pulse" />
                <span>24/7 ONLINE</span>
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* Spotlight Command Palette Trigger & Actions */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium w-full md:w-auto justify-between md:justify-end">
        
        {/* Spotlight Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex-1 md:flex-initial bg-[#050d1a] hover:bg-[#0f2240] border border-[#1e3a5f] hover:border-[#2997ff]/50 px-4 py-2 rounded-xl text-slate-300 hover:text-white flex items-center gap-2.5 transition-all text-xs font-mono group cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-[#2997ff] stroke-[1.5] group-hover:scale-110 transition-transform" />
          <span>Buscar o ejecutar...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#162a4a] text-[10px] text-slate-400 font-mono border border-[#1e3a5f]">
            ⌘ K
          </kbd>
        </button>

        {/* UF Value */}
        <div className="bg-[#050d1a] border border-[#1e3a5f] px-3.5 py-2 rounded-xl text-slate-300 font-mono flex items-center gap-2 text-[11px] sm:text-xs">
          <DollarSign className="h-3.5 w-3.5 text-[#2997ff] stroke-[1.5]" />
          <span className="text-slate-400">UF:</span>
          <strong className="text-emerald-400 font-bold">${valorUF.toLocaleString('es-CL')}</strong>
        </div>

        {/* Quick Presupuesto */}
        <button
          onClick={onQuickCotizacion}
          className="btn-apple-secondary-dark text-xs py-2 px-3 flex items-center gap-1 font-sans"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Cotización</span>
        </button>

        {/* Quick OT */}
        <button
          onClick={onQuickOT}
          className="btn-apple-primary text-xs py-2 px-4 flex items-center gap-1.5 font-sans shadow-md shadow-[#0066cc]/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nueva OT</span>
        </button>
      </div>

    </header>
  )
}
