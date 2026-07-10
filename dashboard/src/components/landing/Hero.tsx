'use client'

import { motion, type Variants } from 'framer-motion'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' }
  })
}

const STATS = [
  { n: '15+', label: 'Años de experiencia' },
  { n: '500+', label: 'Clientes protegidos' },
  { n: '< 2min', label: 'Tiempo de respuesta' },
  { n: '24/7', label: 'Central operativa' },
]

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden bg-[#050d1a]">

      {/* Tech grid */}
      <div className="absolute inset-0 tech-grid opacity-100" />

      {/* Gradient blobs — navy tones */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-[#1e3a5f]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-[#f97316]/6 blur-[100px] rounded-full pointer-events-none" />

      {/* Orange accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="max-w-4xl">

          {/* Status badge */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="inline-flex items-center gap-2.5 mb-8 bg-[#0f2240] border border-[#1e3a5f] rounded-full px-4 py-2"
          >
            <div className="live-dot" />
            <span className="text-[11px] font-mono text-slate-400 tracking-widest uppercase">
              Sistema Activo · Santiago, Chile
            </span>
            <span className="ml-1 text-[11px] font-mono text-orange-400 font-bold">OS-10 Certificado</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.9] tracking-tight mb-6"
          >
            Protección total.
            <br />
            <span className="text-gradient-orange">Respuesta</span>
            <br />
            <span className="text-[#94a3b8] font-light">inmediata.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed"
          >
            Empresa líder en monitoreo electrónico 24/7, instalación de cámaras, cercos
            eléctricos y sistemas de alarma. Plataforma <strong className="text-white font-semibold">Scorpion</strong> —
            el estándar de la industria en Chile.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <button
              onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary text-base"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Solicitar Cotización Gratis
            </button>
            <button
              onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary text-base"
            >
              Ver Servicios
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <a
              href="tel:323276011"
              className="sm:hidden inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Llamar Ahora: 323-276-011
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t border-[#1e3a5f]"
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-black text-white stat-number mb-1">{s.n}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-mono">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right side — enterprise visual */}
      <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden xl:flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute inset-0 m-auto w-[420px] h-[420px] rounded-full border border-[#1e3a5f]/40 animate-[spin_40s_linear_infinite]" />
          <div className="absolute inset-0 m-auto w-[320px] h-[320px] rounded-full border border-orange-500/10 animate-[spin_30s_linear_infinite_reverse]" />

          {/* Center logo */}
          <div className="relative w-[420px] h-[420px] flex items-center justify-center">
            <div className="absolute w-[200px] h-[200px] bg-[#0f2240]/80 rounded-full blur-[40px]" />
            <img
              src="/logo-CASAS.png"
              alt="Gama Servicios"
              className="relative z-10 w-[160px] h-[160px] object-contain opacity-90"
            />
            {/* Orbiting dots */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#f97316' : '#1e3a5f',
                  transform: `rotate(${deg}deg) translateX(150px)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating cards */}
        <div className="absolute top-[25%] right-[15%] bg-[#0f2240]/90 border border-[#1e3a5f] rounded-xl px-4 py-3 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span className="text-xs font-mono text-green-400 font-bold">CENTRAL ACTIVA</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">Scorpion v4.2 · Online</div>
        </div>
        <div className="absolute bottom-[28%] right-[10%] bg-[#0f2240]/90 border border-orange-500/20 rounded-xl px-4 py-3 backdrop-blur-sm shadow-xl">
          <div className="text-orange-400 font-bold text-xs font-mono">RESPUESTA</div>
          <div className="text-white font-black text-xl font-mono">&lt; 2 MIN</div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#050d1a] to-transparent pointer-events-none" />
    </section>
  )
}
