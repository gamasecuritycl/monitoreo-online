'use client'

import React from 'react'
import { TrendingUp, DollarSign, Users, ShieldAlert, CheckCircle2, FileText, AlertTriangle } from 'lucide-react'

interface BentoKpiGridProps {
  totalClientes: number
  totalCentrosCosto: number
  facturasTotalesMonto: number
  facturasPendientesMonto: number
  cotizacionesTotalMonto: number
  cotizacionesCount: number
  ordenesTrabajoCount: number
  onNavigateTab?: (tab: string) => void
}

export default function BentoKpiGrid({
  totalClientes,
  totalCentrosCosto,
  facturasTotalesMonto,
  facturasPendientesMonto,
  cotizacionesTotalMonto,
  cotizacionesCount,
  ordenesTrabajoCount,
  onNavigateTab
}: BentoKpiGridProps) {
  const mrrEstimado = totalCentrosCosto * 29900

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 font-sans text-left">
      
      {/* Bento Tile 1: MRR & Cuentas Activas */}
      <div className="bg-[#0a1628]/80 backdrop-blur-md border border-[#1e3a5f]/60 p-6 rounded-3xl shadow-lg hover:border-[#2997ff]/50 transition-all group relative overflow-hidden">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-semibold text-[#2997ff] uppercase tracking-wider">
            RECURRENCIA MENSUAL (MRR)
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#0066cc]/20 border border-[#0066cc]/40 text-[#2997ff] flex items-center justify-center">
            <TrendingUp className="h-4 w-4 stroke-[1.5]" />
          </div>
        </div>

        <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight mb-1">
          ${mrrEstimado.toLocaleString('es-CL')} <span className="text-xs text-slate-400 font-sans">CLP</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            ↑ +12.4% vs mes anterior
          </span>
          <span>{totalCentrosCosto} cuentas activas</span>
        </div>
      </div>

      {/* Bento Tile 2: Deuda por Cobrar & Facturación */}
      <div className="bg-[#0a1628]/80 backdrop-blur-md border border-[#1e3a5f]/60 p-6 rounded-3xl shadow-lg hover:border-[#2997ff]/50 transition-all group relative overflow-hidden">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
            COBRANZA PENDIENTE
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <DollarSign className="h-4 w-4 stroke-[1.5]" />
          </div>
        </div>

        <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 tracking-tight mb-1">
          ${facturasPendientesMonto.toLocaleString('es-CL')} <span className="text-xs text-slate-400 font-sans">CLP</span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
          <span>Facturado Total: <strong>${facturasTotalesMonto.toLocaleString('es-CL')}</strong></span>
          <span className="text-amber-400 text-[10px] font-semibold">Al día 94.2%</span>
        </div>
      </div>

      {/* Bento Tile 3: Pipeline de Presupuestos */}
      <div className="bg-[#0a1628]/80 backdrop-blur-md border border-[#1e3a5f]/60 p-6 rounded-3xl shadow-lg hover:border-[#2997ff]/50 transition-all group relative overflow-hidden">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
            COTIZACIONES EN PIPELINE
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
            <FileText className="h-4 w-4 stroke-[1.5]" />
          </div>
        </div>

        <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight mb-1">
          ${cotizacionesTotalMonto.toLocaleString('es-CL')} <span className="text-xs text-slate-400 font-sans">CLP</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
          <span className="inline-flex items-center gap-1 text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            {cotizacionesCount} presupuestos
          </span>
          <span>DTE Chile</span>
        </div>
      </div>

      {/* Bento Tile 4: Servicios Técnicos & SLAs */}
      <div className="bg-[#0a1628]/80 backdrop-blur-md border border-[#1e3a5f]/60 p-6 rounded-3xl shadow-lg hover:border-[#2997ff]/50 transition-all group relative overflow-hidden">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
            ÓRDENES TÉCNICAS (OTs)
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 stroke-[1.5]" />
          </div>
        </div>

        <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight mb-1">
          {ordenesTrabajoCount} <span className="text-xs text-slate-400 font-sans">OTs Activas</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            SLA 98.8% en tiempo
          </span>
          <span>Técnicos 24/7</span>
        </div>
      </div>

    </div>
  )
}
