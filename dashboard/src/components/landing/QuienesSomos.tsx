'use client'

import { motion } from 'framer-motion'

const TIMELINE = [
  { year: '2010', title: 'Fundación', desc: 'Nace GAMA SERVICIOS con una central de monitoreo en Santiago.' },
  { year: '2013', title: 'Certificación OS-10', desc: 'Habilitados por Carabineros de Chile para operar como empresa de seguridad privada.' },
  { year: '2016', title: 'Plataforma Scorpion', desc: 'Adopción del estándar de monitoreo más reconocido en Latinoamérica.' },
  { year: '2020', title: 'Expansión', desc: 'Cobertura en múltiples regiones con más de 300 clientes activos.' },
  { year: '2024', title: 'IA & Cámaras', desc: 'Integración de inteligencia artificial en análisis de video para detección avanzada.' },
]

const PILLARS = [
  {
    n: '15+',
    label: 'Años en el mercado',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    n: '500+',
    label: 'Clientes activos',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    n: '99.9%',
    label: 'Uptime central',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    n: 'OS-10',
    label: 'Certificado Carabineros',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function QuienesSomos() {
  return (
    <section id="quienes-somos" className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1a] via-[#0a1628] to-[#050d1a]" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[#f97316]/4 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="section-label mb-5 inline-flex">Quiénes Somos</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mt-5 mb-5">
            Protegemos Chile{' '}
            <span className="text-gradient-orange">desde 2010</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Empresa chilena especializada en monitoreo electrónico y protección patrimonial.
            Certificados OS-10, operamos con tecnología Scorpion, el estándar de la industria.
          </p>
        </motion.div>

        {/* Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20"
        >
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="enterprise-card p-6 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mx-auto mb-3">
                {p.icon}
              </div>
              <div className="text-3xl font-black text-white mb-1 stat-number">{p.n}</div>
              <div className="text-xs text-slate-500 leading-tight">{p.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Timeline + text */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-white mb-5">
              Tecnología + equipo humano 24/7
            </h3>
            <div className="space-y-4 text-slate-400 leading-relaxed mb-8">
              <p>
                En GAMA SERVICIOS combinamos la mejor tecnología disponible con operadores
                altamente entrenados. Nuestra central opera sin interrupciones con sistemas
                redundantes de energía y comunicaciones.
              </p>
              <p>
                Utilizamos la <strong className="text-white">plataforma Scorpion</strong>,
                el estándar de la industria en Latinoamérica, que nos permite gestionar
                miles de señales con trazabilidad total de cada evento.
              </p>
            </div>

            {/* Certification badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'OS-10', sub: 'Carabineros de Chile' },
                { label: 'Scorpion', sub: 'Platform Certified' },
                { label: '100% Chilena', sub: 'Empresa nacional' },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-2 bg-[#0f2240] border border-[#1e3a5f] rounded-xl px-4 py-2.5">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <div className="text-white text-xs font-bold">{b.label}</div>
                    <div className="text-slate-500 text-[10px]">{b.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-8">Nuestra trayectoria</h3>
            <div className="relative">
              <div className="absolute left-[5px] top-3 bottom-3 w-px bg-gradient-to-b from-orange-500/50 via-orange-500/20 to-transparent" />
              <div className="space-y-7">
                {TIMELINE.map((item, i) => (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex gap-5 group"
                  >
                    <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0 group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-orange-400 font-mono font-bold text-sm">{item.year}</span>
                        <span className="text-white font-semibold text-sm">{item.title}</span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
