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

const PILLARS = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accent: '#0ea5e9',
    bg: 'bg-sky-400/8 border-sky-400/15',
    title: 'Respuesta Inmediata',
    desc: 'Protocolo de respuesta activado en menos de 2 minutos desde recibida la señal. Contacto con el cliente, verificación y despacho coordinado.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    accent: '#22c55e',
    bg: 'bg-green-400/8 border-green-400/15',
    title: 'Certificación OS-10',
    desc: 'Habilitados por Carabineros de Chile para operar como empresa de seguridad privada, cumpliendo todos los estándares legales y técnicos exigidos.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    accent: '#a855f7',
    bg: 'bg-purple-400/8 border-purple-400/15',
    title: 'Tecnología de Punta',
    desc: 'Plataforma Scorpion, cámaras 4K con IA, comunicación IP y GPRS con redundancia. Siempre actualizados con la última tecnología disponible.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    accent: '#f59e0b',
    bg: 'bg-amber-400/8 border-amber-400/15',
    title: 'Atención Personalizada',
    desc: 'Un ejecutivo dedicado para cada cliente. Seguimiento post-instalación, mantenimiento preventivo y soporte técnico sin costo adicional.',
  },
]

const COMPARISON = [
  { feature: 'Monitoreo 24/7/365', gama: true, other: false },
  { feature: 'Respuesta < 2 minutos', gama: true, other: false },
  { feature: 'Certificación OS-10', gama: true, other: false },
  { feature: 'App de monitoreo', gama: true, other: false },
  { feature: 'Técnico dedicado', gama: true, other: false },
  { feature: 'Plataforma Scorpion', gama: true, other: false },
  { feature: 'Cobertura nacional', gama: true, other: false },
]

export default function PorQueNosotros() {
  const titleRef = useReveal()
  const compRef = useReveal()

  return (
    <section id="por-que" className="relative py-28 sm:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050810] via-[#08101f] to-[#050810]" />
      <div className="absolute inset-0 tech-grid opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div ref={titleRef} className="reveal text-center max-w-2xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/8 border border-amber-400/15 text-amber-400 text-xs font-mono tracking-widest uppercase mb-5">
            ¿Por qué elegirnos?
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
            La diferencia que{' '}
            <span className="gradient-text-amber">marca GAMA</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            No somos una empresa más de seguridad. Somos tu aliado estratégico para proteger
            lo que más importa, con la tecnología y el equipo humano que marcan la diferencia.
          </p>
        </div>

        {/* 4 pillars */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {PILLARS.map((p, i) => (
            <PillarCard key={p.title} pillar={p} delay={i * 100} />
          ))}
        </div>

        {/* Comparison table */}
        <div ref={compRef} className="reveal">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-center text-xl font-bold text-white mb-8">
              GAMA vs. la competencia
            </h3>
            <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06]">
              {/* Header */}
              <div className="grid grid-cols-3 border-b border-white/[0.06]">
                <div className="px-5 py-3.5 text-xs text-gray-500 font-mono uppercase tracking-wider">Característica</div>
                <div className="px-5 py-3.5 text-center">
                  <span className="text-xs font-bold text-sky-400 font-mono uppercase tracking-wider">GAMA Seguridad</span>
                </div>
                <div className="px-5 py-3.5 text-center">
                  <span className="text-xs text-gray-600 font-mono uppercase tracking-wider">Promedio del mercado</span>
                </div>
              </div>
              {COMPARISON.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === COMPARISON.length - 1 ? 'border-b-0' : ''}`}
                >
                  <div className="px-5 py-3.5 text-sm text-gray-300">{row.feature}</div>
                  <div className="px-5 py-3.5 flex justify-center items-center">
                    <div className="w-5 h-5 rounded-full bg-green-400/15 border border-green-400/30 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="px-5 py-3.5 flex justify-center items-center">
                    <div className="w-5 h-5 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PillarCard({ pillar, delay }: { pillar: typeof PILLARS[0]; delay: number }) {
  const ref = useReveal()
  return (
    <div
      ref={ref}
      className={`reveal group glass-card glass-card-hover rounded-2xl p-6 border ${pillar.bg} transition-all duration-400`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-4 p-3 w-fit rounded-xl bg-white/5 border border-white/[0.06]" style={{ color: pillar.accent }}>
        {pillar.icon}
      </div>
      <h3 className="text-white font-bold text-base mb-2.5">{pillar.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{pillar.desc}</p>
    </div>
  )
}
