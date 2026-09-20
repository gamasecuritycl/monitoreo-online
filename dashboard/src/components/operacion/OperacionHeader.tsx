'use client'

import React from 'react'
import { Shield, Search, DollarSign, Plus, ArrowLeft, Bell, MessageSquare, UserCheck } from 'lucide-react'

interface OperacionHeaderProps {
  moduloActivoLabel: string
  cantEmpresas: number
  valorUF: number
  sidebarAbierto?: boolean
  setSidebarAbierto?: (v: boolean) => void
  onOpenCommandPalette: () => void
  onQuickCotizacion: () => void
  onQuickOT: () => void
  onOpenWhatsAppPlantillas?: () => void
  moduloActivo?: string | null
  onVolverMenu?: () => void
}

export default function OperacionHeader({
  moduloActivoLabel,
  cantEmpresas,
  valorUF,
  sidebarAbierto,
  setSidebarAbierto,
  onOpenCommandPalette,
  onQuickCotizacion,
  onQuickOT,
  onOpenWhatsAppPlantillas,
  moduloActivo,
  onVolverMenu
}: OperacionHeaderProps) {
  return (
    <header className="bg-white border border-slate-300/80 rounded-3xl p-5 sm:p-6 lg:px-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0 no-imprimir shadow-sm transition-all font-sans">
      
      {/* ── SECCIÓN IZQUIERDA: MARCA GAMA & NAVEGACIÓN ── */}
      <div className="flex items-center gap-3.5 w-full xl:w-auto justify-between xl:justify-start">
        <div className="flex items-center gap-3.5">
          {moduloActivo && onVolverMenu ? (
            <button
              onClick={onVolverMenu}
              className="bg-slate-50 hover:bg-[#0B2545] text-slate-700 hover:text-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-[#0B2545] transition-all cursor-pointer flex items-center gap-2 font-bold text-xs shadow-xs group"
              title="Volver al Menú Principal"
            >
              <ArrowLeft className="h-4 w-4 text-[#1E40AF] group-hover:text-white group-hover:-translate-x-1 transition-all" />
              <span>← Menú Principal</span>
            </button>
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0B2545] to-[#1E40AF] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-900/10 relative overflow-hidden">
              <Shield className="h-6 w-6 stroke-[1.75]" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#DC2626] rounded-full border-2 border-white" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-400">Central Operativa</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#1E40AF] font-bold">{moduloActivoLabel}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                EMPRESA GAMA <span className="text-[#DC2626]">24/7</span>
              </h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>CENTRAL ACTIVA</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN CENTRAL & DERECHA: BUSCADOR PÍLDORA + WIDGET OPERADOR (ESTILO DSTUDIO) ── */}
      <div className="flex flex-wrap items-center gap-3 text-xs w-full xl:w-auto justify-between xl:justify-end">
        
        {/* BUSCADOR SPOTLIGHT PÍLDORA REDONDEADA (DSTUDIO SEARCH PILL) */}
        <button
          onClick={onOpenCommandPalette}
          className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100/80 border border-slate-200 px-4 py-2.5 rounded-full text-slate-600 hover:text-slate-900 flex items-center gap-3 transition-all text-xs font-sans group cursor-pointer shadow-2xs"
        >
          <Search className="h-4 w-4 text-[#1E40AF] stroke-[2] group-hover:scale-110 transition-transform" />
          <span className="font-medium text-slate-500">Buscar módulo, cliente o comando...</span>
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white text-[10px] text-slate-500 font-mono border border-slate-200 shadow-2xs">
            ⌘ K
          </kbd>
        </button>

        {/* INDICADOR DE UF EN TARJETA MINIMALISTA */}
        <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl text-slate-700 font-mono flex items-center gap-2 text-xs shadow-2xs">
          <DollarSign className="h-3.5 w-3.5 text-[#1E40AF] stroke-[2]" />
          <span className="text-slate-400 font-sans font-medium text-[11px]">UF:</span>
          <strong className="text-slate-900 font-bold">${valorUF.toLocaleString('es-CL')}</strong>
        </div>

        {/* BOTÓN RÁPIDO NUEVA COTIZACIÓN */}
        <button
          onClick={onQuickCotizacion}
          className="bg-white hover:bg-slate-50 text-[#0B2545] border border-slate-200 hover:border-[#0B2545] text-xs py-2 px-3.5 rounded-2xl flex items-center gap-1.5 font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-[#1E40AF]" />
          <span>Cotización</span>
        </button>

        {/* BOTÓN RÁPIDO NUEVA OT (EN ROJO GAMA OFICIAL) */}
        <button
          onClick={onQuickOT}
          className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs py-2 px-4 rounded-2xl flex items-center gap-1.5 font-bold transition-all shadow-sm shadow-red-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nueva OT</span>
        </button>

        {/* BOTÓN RÁPIDO WHATSAPP */}
        {onOpenWhatsAppPlantillas && (
          <button
            onClick={onOpenWhatsAppPlantillas}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs py-2 px-3.5 rounded-2xl flex items-center gap-1.5 font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Enviar Plantillas Oficiales de WhatsApp"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WhatsApp</span>
          </button>
        )}

        {/* ── WIDGET DE PERFIL OPERADOR (CARD UI DSTUDIO SHOT EXACTO) ── */}
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-100/90 py-1.5 px-3.5 rounded-2xl flex items-center gap-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 border-r border-slate-200/80 pr-2.5">
            <button className="p-1 hover:text-[#1E40AF] transition-colors cursor-pointer" title="Mensajes Operativos">
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 hover:text-[#DC2626] transition-colors cursor-pointer" title="Novedades del Sistema">
              <Bell className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-extrabold text-slate-800 block leading-tight">Admin Central</span>
            <span className="text-[9px] font-bold text-[#1E40AF] tracking-wider uppercase block">SUPER ADMIN</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0B2545] to-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-white">
            <UserCheck className="h-4 w-4" />
          </div>
        </div>

      </div>

    </header>
  )
}
