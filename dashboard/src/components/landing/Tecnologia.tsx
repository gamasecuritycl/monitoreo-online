'use client'

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

const BRANDS = [
  { name: 'Hikvision', cat: 'Cámaras IP' },
  { name: 'DSC', cat: 'Paneles de Alarma' },
  { name: 'Bosch', cat: 'Detección Incendio' },
  { name: 'Dahua', cat: 'NVR / DVR' },
  { name: 'Paradox', cat: 'Control de Acceso' },
  { name: 'Crow', cat: 'Cercos Eléctricos' },
  { name: 'Honeywell', cat: 'Sensores' },
  { name: 'Risco', cat: 'Comunicadores' },
]

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Respuesta automática',
    desc: 'Protocolo de acción inmediata al recibir cualquier señal crítica.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: 'Notificaciones multicanal',
    desc: 'Alertas por WhatsApp, SMS, llamada telefónica y email en tiempo real.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Historial completo',
    desc: 'Registro auditado de todos los eventos con trazabilidad de acciones.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Cobertura nacional',
    desc: 'Red de atención en todo Chile con técnicos en las principales ciudades.',
  },
]

export default function Tecnologia() {
  const titleRef = useReveal()
  const brandsRef = useReveal()

  return (
    <section id="tecnologia" className="relative py-28 sm:py-36 overflow-hidden bg-[#050810]">
      {/* Background */}
      <div className="absolute top-0 left-0 right-0 h-px section-divider" />
      <div className="absolute bottom-0 left-0 right-0 h-px section-divider" />
      <div className="absolute inset-0 tech-grid opacity-25" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div ref={titleRef} className="reveal text-center max-w-2xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-400/8 border border-sky-400/15 text-sky-400 text-xs font-mono tracking-widest uppercase mb-5">
            Tecnología
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
            Plataforma{' '}
            <span className="gradient-text-blue">Scorpion</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            Software de monitoreo estándar de la industria en Latinoamérica.
            Gestionamos miles de señales simultáneas con trazabilidad total.
          </p>
        </div>

        {/* Platform showcase */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">

          {/* Left: Features list */}
          <div className="space-y-4 reveal-left">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="flex gap-4 p-5 glass-card glass-card-hover rounded-xl border border-white/[0.05] transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex-shrink-0 p-2.5 rounded-lg bg-sky-400/10 border border-sky-400/20 text-sky-400 h-fit">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Platform mockup */}
          <div className="reveal-right">
            <div className="relative">
              <div className="absolute inset-0 bg-sky-500/10 blur-[60px] rounded-3xl" />
              <div className="relative glass-card border border-sky-500/15 rounded-2xl overflow-hidden shadow-2xl shadow-sky-900/20">
                {/* Mockup header */}
                <div className="bg-[#080d18] border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <span className="text-[11px] text-gray-500 font-mono">scorpion.gama.cl — Dashboard</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-live" />
                    <span className="text-[9px] text-green-400 font-mono">LIVE</span>
                  </div>
                </div>
                {/* Mockup content */}
                <div className="p-5 space-y-3 bg-[#060a14]">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Clientes activos', val: '487', color: 'text-green-400' },
                      { label: 'Alarmas hoy', val: '23', color: 'text-red-400' },
                      { label: 'Señales/hora', val: '1.2k', color: 'text-sky-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
                        <div className={`text-xl font-black font-mono ${s.color}`}>{s.val}</div>
                        <div className="text-[9px] text-gray-600 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Fake event rows */}
                  <div className="space-y-1.5">
                    {[
                      { code: 'E131', cta: 'CL-4421', status: 'ALARMA', clr: 'text-red-400 bg-red-400/10' },
                      { code: 'E602', cta: 'CL-2187', status: 'OK', clr: 'text-green-400 bg-green-400/10' },
                      { code: 'R401', cta: 'CL-0933', status: 'RESTAU', clr: 'text-amber-400 bg-amber-400/10' },
                      { code: 'E130', cta: 'CL-5512', status: 'ALARMA', clr: 'text-red-400 bg-red-400/10' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/[0.025] border border-white/[0.04] rounded-lg px-3 py-2">
                        <span className="font-mono text-[11px] text-sky-400">{row.code}</span>
                        <span className="font-mono text-[11px] text-gray-500">{row.cta}</span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${row.clr}`}>{row.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-[9px] text-gray-600 font-mono pt-1">
                    Plataforma Scorpion v4.2 — GAMA Seguridad
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brands */}
        <div ref={brandsRef} className="reveal">
          <h3 className="text-center text-sm font-mono text-gray-500 uppercase tracking-widest mb-10">
            Trabajamos con las mejores marcas
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
            {BRANDS.map((brand) => (
              <div
                key={brand.name}
                className="glass-card glass-card-hover rounded-xl p-4 flex flex-col items-center gap-1.5 transition-all duration-300 cursor-default group border border-white/[0.05]"
              >
                <span className="text-white font-bold text-sm group-hover:text-sky-400 transition-colors">{brand.name}</span>
                <span className="text-[9px] text-gray-600 text-center leading-tight">{brand.cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
