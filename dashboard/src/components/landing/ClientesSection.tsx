'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

export default function ClientesSection() {
  const ref = useReveal()

  return (
    <section id="clientes" className="relative py-28 sm:py-36 overflow-hidden bg-[#050810]">
      {/* Background */}
      <div className="absolute inset-0 tech-grid opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px section-divider" />
      <div className="absolute bottom-0 left-0 right-0 h-px section-divider" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div ref={ref} className="reveal text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-400/8 border border-green-400/15 text-green-400 text-xs font-mono tracking-widest uppercase mb-5">
            Área Clientes
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
            Accede a tu plataforma{' '}
            <span className="gradient-text-blue">de monitoreo</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            Visualiza el estado de tus alarmas, revisa eventos en tiempo real y gestiona
            tus notificaciones desde cualquier lugar del mundo.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* Card 1: Command Center */}
          <div className="group relative neon-border-animated glass-card border border-sky-500/15 rounded-2xl p-8 hover:border-sky-400/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-900/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            {/* Status indicator */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 bg-green-400/10 border border-green-400/20 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-live" />
                <span className="text-[10px] text-green-400 font-mono font-bold tracking-widest">SISTEMA ACTIVO</span>
              </div>
              <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.05] rounded-lg px-2.5 py-1.5">
                <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[9px] text-gray-500 font-mono">SSL · SEGURO</span>
              </div>
            </div>

            {/* Dashboard preview mockup */}
            <div className="bg-[#060a12] border border-white/[0.05] rounded-xl p-4 mb-6 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono text-sky-400">COMMAND CENTER</div>
                <div className="flex gap-2">
                  {['ALARMAS', 'CÁMARAS', 'REPORTES'].map(t => (
                    <span key={t} className="text-[8px] font-mono text-gray-600 bg-white/[0.03] px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { n: '487', l: 'Clientes', c: 'text-sky-400' },
                  { n: '23', l: 'Alarmas', c: 'text-red-400' },
                  { n: '99.9%', l: 'Uptime', c: 'text-green-400' },
                ].map(s => (
                  <div key={s.l} className="bg-white/[0.03] rounded-lg p-2 text-center">
                    <div className={`text-sm font-black font-mono ${s.c}`}>{s.n}</div>
                    <div className="text-[8px] text-gray-600">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {['E131 · CL-4421 · ALARMA', 'E602 · CL-2187 · OK', 'R401 · CL-0933 · RESTAURADO'].map((line, i) => (
                  <div key={i} className="text-[9px] font-mono text-gray-500 bg-white/[0.02] px-2 py-1 rounded">
                    {line}
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-white font-bold text-xl mb-2">Command Center</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Panel de monitoreo en tiempo real con eventos, reportes, zonificación
              y notificaciones multicanal. Acceso exclusivo para personal GAMA.
            </p>

            <Link
              href="/app"
              className="btn-3d-glow inline-flex items-center gap-2.5 bg-gradient-to-b from-sky-500 to-sky-700 text-white font-bold px-6 py-3 rounded-xl text-sm w-full justify-center shadow-lg shadow-sky-600/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Ingresar al Sistema
            </Link>
          </div>

          {/* Card 2: Portal Cliente */}
          <div className="group relative glass-card border border-white/[0.06] rounded-2xl p-8 hover:border-purple-500/20 transition-all duration-500">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            {/* Coming soon badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 bg-purple-400/10 border border-purple-400/20 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[10px] text-purple-400 font-mono font-bold tracking-widest">EN DESARROLLO</span>
              </div>
            </div>

            {/* Mockup with blur */}
            <div className="bg-[#060a12] border border-white/[0.05] rounded-xl p-4 mb-6 relative overflow-hidden">
              <div className="absolute inset-0 backdrop-blur-[2px] bg-black/20 z-10 flex items-center justify-center rounded-xl">
                <div className="bg-purple-400/10 border border-purple-400/20 rounded-xl px-4 py-3 text-center">
                  <span className="text-purple-400 font-bold text-sm">Próximamente</span>
                  <div className="text-gray-500 text-[10px] mt-1">Q1 2025</div>
                </div>
              </div>
              <div className="opacity-20 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
                <div className="h-3 bg-white/10 rounded w-4/5" />
              </div>
            </div>

            <h3 className="text-white font-bold text-xl mb-2">Portal del Cliente</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Próximamente: accede a tu historial de eventos, descarga certificados,
              actualiza datos de contacto y gestiona tu contrato de monitoreo.
            </p>

            <div className="space-y-2">
              {['Historial de eventos', 'Descarga de certificados', 'Gestión de cobranza', 'Actualizar contactos'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-purple-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>

            <div className="mt-6 w-full flex items-center justify-center gap-2 bg-white/[0.03] text-gray-600 font-semibold px-6 py-3 rounded-xl border border-white/[0.05] text-sm cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Próximamente disponible
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
