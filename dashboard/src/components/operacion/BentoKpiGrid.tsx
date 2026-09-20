'use client'

import React from 'react'
import { TrendingUp, DollarSign, Users, CheckCircle2, ArrowUpRight, Clock, ShieldCheck, Activity } from 'lucide-react'

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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-7 font-sans text-left">
      
      {/* ── BENTO CARD 1 (ESTILO DSTUDIO SOFT BLUE): CENTRAL DE RESPUESTA & EVENTOS EN VIVO ── */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-7 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold text-[#1E40AF] bg-white/90 border border-blue-200/80 px-3.5 py-1.5 rounded-full shadow-2xs">
            12:30 - 24/7 ACTIVO
          </span>
          <div className="w-9 h-9 rounded-full bg-white text-[#1E40AF] flex items-center justify-center shadow-xs">
            <Activity className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="my-3 space-y-1">
          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
            Receptor Central Gama & Alarmas 24/7
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            Supervisión continua de {totalCentrosCosto} abonados conectados
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 mt-2 border-t border-blue-200/60">
          {/* AVATARS APILADOS (ESTILO DSTUDIO SHOT) */}
          <div className="flex items-center -space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
              OP1
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1E40AF] text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
              OP2
            </div>
            <div className="w-8 h-8 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
              +4
            </div>
          </div>

          <span className="text-[11px] font-bold text-[#1E40AF] bg-white/70 border border-blue-200/60 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span>En línea</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </span>
        </div>
      </div>

      {/* ── BENTO CARD 2 (ESTILO DSTUDIO SALES DATA): RECURRENCIA MRR & BARRAS SEMANALES ── */}
      <div className="bg-white border border-slate-300/80 p-7 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Recurrencia Mensual (MRR)
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Estimado Cuentas Activas</span>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-mono">
            2026
          </span>
        </div>

        <div className="my-2 space-y-1">
          <div className="text-3xl font-black font-sans text-slate-900 tracking-tight">
            ${mrrEstimado.toLocaleString('es-CL')} <span className="text-xs font-bold text-slate-400">CLP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              <span>▲</span> +12.4%
            </span>
            <span className="text-[11px] font-medium text-slate-500">vs mes anterior</span>
          </div>
        </div>

        {/* BARRAS DE DÍAS DE LA SEMANA (ESTILO DSTUDIO S M T W T F S) */}
        <div className="pt-3 mt-2 border-t border-slate-100">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2 px-1">
            <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 h-3.5 rounded-lg overflow-hidden bg-slate-100 p-0.5 border border-slate-200/60">
            <div className="bg-emerald-300 rounded-sm" title="Lunes 100%" />
            <div className="bg-emerald-400 rounded-sm" title="Martes 100%" />
            <div className="bg-emerald-500 rounded-sm" title="Miércoles 100%" />
            <div className="bg-emerald-400 rounded-sm" title="Jueves 100%" />
            <div className="bg-emerald-300 rounded-sm" title="Viernes 100%" />
            <div className="bg-[#0B2545] rounded-sm" title="Sábado Activo" />
            <div className="bg-[#DC2626] rounded-sm" title="Domingo Guardia" />
          </div>
        </div>
      </div>

      {/* ── BENTO CARD 3 (ESTILO DSTUDIO REVENUE): FACTURACIÓN TOTAL & CURVA SUAVE ── */}
      <div className="bg-white border border-slate-300/80 p-7 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Cobranza & Facturación
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        <div className="my-2 space-y-1">
          <div className="text-3xl font-black font-sans text-slate-900 tracking-tight">
            ${facturasTotalesMonto.toLocaleString('es-CL')} <span className="text-xs font-bold text-slate-400">CLP</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500">
            Cobranza pendiente: <span className="text-[#DC2626] font-bold">${facturasPendientesMonto.toLocaleString('es-CL')}</span>
          </p>
        </div>

        {/* CURVA SUAVE EN SVG DE INGRESOS (ESTILO DSTUDIO CURVE) */}
        <div className="h-11 w-full pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
            <path
              d="M0,20 Q15,5 30,15 T60,8 T85,18 T100,5"
              fill="none"
              stroke="#1E40AF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M0,20 Q15,5 30,15 T60,8 T85,18 T100,5 L100,25 L0,25 Z"
              fill="url(#blue-gradient-subtle)"
              opacity="0.12"
            />
            <defs>
              <linearGradient id="blue-gradient-subtle" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E40AF" />
                <stop offset="100%" stopColor="#EFF6FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* ── BENTO CARD 4 (ESTILO DSTUDIO WIDGETS APILADOS): PRESUPUESTOS & OTs ── */}
      <div className="flex flex-col gap-4 justify-between">
        
        {/* WIDGET SUPERIOR: COTIZACIONES PIPELINE */}
        <div className="bg-white border border-slate-300/80 p-5 sm:p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Presupuestos Comerciales
            </span>
            <div className="text-xl font-black text-slate-900">
              ${cotizacionesTotalMonto.toLocaleString('es-CL')}
            </div>
          </div>
          <div className="text-right">
            <span className="bg-blue-50 text-[#1E40AF] border border-blue-200/80 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs">
              {cotizacionesCount} Propuestas
            </span>
          </div>
        </div>

        {/* WIDGET INFERIOR (SOFT MINT TINT): SERVICIOS TÉCNICOS & SLA */}
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-5 sm:p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Servicios Técnicos (OTs)
            </span>
            <div className="text-xl font-black text-slate-900">
              {ordenesTrabajoCount} Activas
            </div>
          </div>
          <span className="bg-white text-emerald-800 border border-emerald-200 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
            SLA 98.8%
          </span>
        </div>

      </div>

    </div>
  )
}
