'use client'

import { useEffect, useRef } from 'react'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

const TIMELINE = [
  { year: '2010', title: 'Fundación', desc: 'Nace GAMA Seguridad con una central de monitoreo en Santiago.' },
  { year: '2013', title: 'Certificación OS-10', desc: 'Obtención del certificado de Carabineros de Chile para operar como empresa de seguridad.' },
  { year: '2016', title: 'Plataforma Scorpion', desc: 'Adopción del sistema Scorpion, estándar de la industria en Latinoamérica.' },
  { year: '2020', title: 'Expansión regional', desc: 'Cobertura a todas las regiones del país con +300 clientes activos.' },
  { year: '2024', title: 'IA & Detección', desc: 'Integración de inteligencia artificial para detección de intrusiones en cámaras IP.' },
]

const BADGES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'text-sky-400',
    bg: 'bg-sky-400/10 border-sky-400/20',
    label: 'Certificación OS-10',
    sub: 'Carabineros de Chile',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
    label: 'Plataforma Scorpion',
    sub: 'Software certificado',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20',
    label: 'Equipo Humano 24/7',
    sub: 'Operadores certificados',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    label: '100% Empresa Chilena',
    sub: 'Presencia nacional',
  },
]

export default function QuienesSomos() {
  const titleRef = useReveal()
  const rightRef = useReveal()

  return (
    <section id="quienes-somos" className="relative py-28 sm:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050810] via-[#080d1a] to-[#050810]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-sky-500/4 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={titleRef} className="reveal text-center max-w-2xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-400/8 border border-sky-400/15 text-sky-400 text-xs font-mono tracking-widest uppercase mb-5">
            Quiénes Somos
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
            Protegemos Chile{' '}
            <span className="gradient-text-blue">desde 2010</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            Empresa chilena especializada en monitoreo electrónico y protección patrimonial.
            Tecnología de punta con equipo humano altamente capacitado.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* Left: Timeline */}
          <div className="reveal-left">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest font-mono mb-8">
              Nuestra trayectoria
            </h3>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[5px] top-3 bottom-3 w-[1px] bg-gradient-to-b from-sky-500/50 via-sky-500/20 to-transparent" />

              <div className="space-y-8">
                {TIMELINE.map((item, i) => (
                  <div key={item.year} className="flex gap-6 group" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex flex-col items-center">
                      <div className="timeline-dot mt-1.5 group-hover:scale-125 transition-transform duration-300" />
                    </div>
                    <div className="pb-2">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sky-400 font-mono font-bold text-sm">{item.year}</span>
                        <span className="text-white font-semibold text-sm">{item.title}</span>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Badges + description */}
          <div ref={rightRef} className="reveal-right">
            <div className="space-y-6 mb-10">
              <p className="text-gray-300 leading-relaxed">
                En GAMA Seguridad combinamos la mejor tecnología disponible en el mercado con
                operadores altamente entrenados. Nuestra central de monitoreo opera sin interrupciones
                con sistemas redundantes de energía y comunicaciones.
              </p>
              <p className="text-gray-400 leading-relaxed text-sm">
                Utilizamos la <strong className="text-white">plataforma Scorpion</strong>, el estándar
                de la industria en Latinoamérica, que nos permite gestionar miles de señales de alarma
                simultáneamente con trazabilidad total de cada evento.
              </p>
            </div>

            {/* Badge grid */}
            <div className="grid grid-cols-2 gap-3">
              {BADGES.map((b) => (
                <div
                  key={b.label}
                  className={`glass-card glass-card-hover border ${b.bg} rounded-xl p-4 transition-all duration-300`}
                >
                  <div className={`${b.color} mb-3`}>{b.icon}</div>
                  <div className="text-white text-sm font-semibold leading-tight">{b.label}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{b.sub}</div>
                </div>
              ))}
            </div>

            {/* Mini stats row */}
            <div className="mt-8 grid grid-cols-3 gap-4 p-5 glass-card rounded-2xl border border-white/[0.05]">
              {[
                { n: '15+', l: 'Años de experiencia' },
                { n: '500+', l: 'Clientes activos' },
                { n: '99.9%', l: 'Uptime central' },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <div className="text-2xl font-black text-white">{s.n}</div>
                  <div className="text-[10px] text-gray-500 mt-1 leading-tight">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
