'use client'

import React from 'react'
import { X, ExternalLink, Shield, User, FileText, Wrench, DollarSign, Calendar, MapPin, Phone, Mail, Clock } from 'lucide-react'

interface SlideOverDrawerProps {
  isOpen: boolean
  onClose: () => void
  titulo: string
  subtitulo?: string
  tipo: 'cliente' | 'cotizacion' | 'factura' | 'ot'
  datos: any
  onAccionAdicional?: () => void
}

export default function SlideOverDrawer({
  isOpen,
  onClose,
  titulo,
  subtitulo,
  tipo,
  datos,
  onAccionAdicional
}: SlideOverDrawerProps) {
  if (!isOpen || !datos) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-[#0a1628] border-l border-[#1e3a5f] text-white shadow-2xl flex flex-col">
          
          {/* Header Drawer */}
          <div className="p-6 bg-[#050d1a] border-b border-[#1e3a5f] flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0066cc]/20 border border-[#0066cc]/40 text-[#2997ff] flex items-center justify-center shrink-0">
                {tipo === 'cliente' ? <User className="h-5 w-5 stroke-[1.5]" /> :
                 tipo === 'cotizacion' ? <FileText className="h-5 w-5 stroke-[1.5]" /> :
                 tipo === 'factura' ? <DollarSign className="h-5 w-5 stroke-[1.5]" /> :
                 <Wrench className="h-5 w-5 stroke-[1.5]" />}
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#2997ff] uppercase tracking-wider block">
                  EXPEDIENTE DE {tipo.toUpperCase()}
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                  {titulo}
                </h2>
                {subtitulo && <p className="text-xs text-slate-400 mt-0.5">{subtitulo}</p>}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#0f2240] hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
            
            {/* Contenido dinámico según el tipo */}
            {tipo === 'cliente' && (
              <div className="space-y-6">
                <div className="bg-[#050d1a] border border-[#1e3a5f] rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-[#1e3a5f]/60 pb-2">
                    Datos Principales del Cliente
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">RUT Empresa / Cliente</span>
                      <strong className="font-mono text-white text-sm">{datos.rut}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Razón Social</span>
                      <strong className="text-white">{datos.razon_social}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Email Cobranza</span>
                      <span className="text-slate-200">{datos.email_cobranza || 'No registrado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Teléfono Contacto</span>
                      <span className="text-slate-200">{datos.telefono || '+56 9 9101 6912'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#050d1a] border border-[#1e3a5f] rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-[#2997ff] uppercase tracking-wider border-b border-[#1e3a5f]/60 pb-2 flex justify-between items-center">
                    <span>Abonados / Centros de Costo Vinculados</span>
                    <span className="text-[10px] font-mono bg-[#0066cc]/20 px-2 py-0.5 rounded-full text-[#2997ff]">
                      {datos.cuentas_abonados?.length || 0} cuentas
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {datos.cuentas_abonados?.map((cta: string) => (
                      <div key={cta} className="flex justify-between items-center bg-[#0a1628] p-3 rounded-xl border border-[#1e3a5f]">
                        <span className="font-mono font-bold text-[#2997ff] text-sm">Cuenta #{cta}</span>
                        <span className="text-xs text-slate-300">Monitoreo Perimetral 24/7</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tipo === 'cotizacion' && (
              <div className="space-y-6">
                <div className="bg-[#050d1a] border border-[#1e3a5f] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-[#1e3a5f]/60 pb-2">
                    <span className="font-mono text-sm font-bold text-[#2997ff]">{datos.codigo_cotizacion}</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {datos.etapa_pipeline || 'Cotización'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cliente</span>
                      <strong className="text-white">{datos.nombre_cliente}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">RUT Receptor</span>
                      <span className="font-mono text-slate-200">{datos.rut_cliente}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Fecha Emisión</span>
                      <span className="text-slate-300">{datos.fecha}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Monto Total (IVA Incl.)</span>
                      <strong className="font-mono text-emerald-400 text-sm">
                        ${(datos.monto_total_iva_incluido || 0).toLocaleString('es-CL')} CLP
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="bg-[#050d1a] border border-[#1e3a5f] rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ítems Cotizados ({datos.items?.length || 0})</h4>
                  <div className="space-y-2">
                    {datos.items?.map((it: any, idx: number) => (
                      <div key={idx} className="bg-[#0a1628] p-3 rounded-xl border border-[#1e3a5f]/60 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-white">{it.descripcion}</div>
                          <div className="text-[10px] text-slate-400">Cantidad: {it.cantidad} x ${Number(it.precioUnitario).toLocaleString('es-CL')}</div>
                        </div>
                        <strong className="font-mono text-[#2997ff]">${Number(it.subtotal).toLocaleString('es-CL')}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tipo === 'ot' && (
              <div className="space-y-6">
                <div className="bg-[#050d1a] border border-[#1e3a5f] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-[#1e3a5f]/60 pb-2">
                    <span className="font-mono text-sm font-bold text-[#2997ff]">{datos.codigo_ot}</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {datos.estado}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cuenta / Cliente</span>
                      <strong className="text-white">#{datos.cuenta} — {datos.cliente_nombre}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Técnico Asignado</span>
                      <strong className="text-slate-200">{datos.tecnico_asignado}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SLA de Atención</span>
                      <span className="text-red-400 font-semibold">{datos.prioridad_sla}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Fecha Programada</span>
                      <span className="text-slate-300">{datos.fecha_programada}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#050d1a] border border-[#1e3a5f] rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Observaciones & Requerimientos</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#0a1628] p-3 rounded-xl border border-[#1e3a5f]">
                    {datos.observaciones || 'Revisión técnica estándar'}
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-[#050d1a] border-t border-[#1e3a5f] flex justify-between items-center">
            <button
              onClick={onClose}
              className="btn-apple-secondary-dark text-xs py-2 px-4"
            >
              Cerrar Expediente
            </button>

            {onAccionAdicional && (
              <button
                onClick={onAccionAdicional}
                className="btn-apple-primary text-xs py-2 px-5"
              >
                Ejecutar Acción →
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
