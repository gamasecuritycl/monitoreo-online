'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
}

const STATS = [
  { n: '+20', label: 'Años de trayectoria' },
  { n: '500+', label: 'Empresas y hogares protegidos' },
  { n: '< 2 min', label: 'Tiempo medio de respuesta' },
  { n: '24/7', label: 'Central de Monitoreo Redundante' },
]

export default function Hero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden bg-[#050d1a]"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#0066cc]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-[#1e3a5f]/25 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Main Hero Container */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-8">
          
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Status Pill Badge */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="inline-flex items-center gap-2.5 bg-[#0f2240] border border-[#1e3a5f] rounded-full px-4 py-1.5 text-xs text-slate-300 font-sans"
            >
              <div className="live-dot" />
              <span>Monitoreo Activo 24/7 · Central de Operaciones Nivel Enterprise</span>
            </motion.div>

            {/* Apple SF Pro Display Headline */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="apple-hero-display text-white"
            >
              Monitoreo 24/7.
              <br />
              <span className="text-[#2997ff]">Protección absoluta.</span>
            </motion.h1>

            {/* Subheadline Tagline */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="apple-lead text-slate-300 max-w-xl"
            >
              Empresa líder con más de 20 años de trayectoria en monitoreo electrónico,
              instalación de cámaras 4K con IA, cercos eléctricos y alarmas de alta precisión.
              Respuesta inmediata verificada por nuestra central operativa.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <button
                onClick={() => scrollTo('contacto')}
                className="btn-apple-primary text-base py-3 px-7"
              >
                Solicitar Cotización
              </button>

              <button
                onClick={() => scrollTo('servicios')}
                className="btn-apple-secondary-dark text-base py-3 px-6"
              >
                Explorar Servicios →
              </button>
            </motion.div>

            {/* Quick feature highlights */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="pt-6 border-t border-[#1e3a5f]/60 grid grid-cols-2 sm:grid-cols-4 gap-6"
            >
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                    {s.n}
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-0.5 leading-snug">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Hero Visual Asset (Museum Gallery Product Frame) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="lg:col-span-5 relative flex justify-center items-center"
          >
            <div className="relative w-full max-w-lg">
              
              {/* Product Frame Container with Apple Drop Shadow */}
              <div className="relative rounded-3xl overflow-hidden bg-[#0a1628] border border-[#1e3a5f] apple-drop-shadow-lg p-6">
                
                {/* Header Chrome */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1e3a5f]/60">
                  <div className="flex items-center gap-3">
                    <div className="relative w-7 h-7">
                      <Image
                        src="/logo-gama.png"
                        alt="GAMA Security Logo"
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                    </div>
                    <span className="text-xs font-semibold text-white tracking-wide">
                      CENTRAL OPERATIVA GAMA
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[11px] font-mono text-green-400">
                    <span className="live-dot" /> LIVE
                  </span>
                </div>

                {/* Hero Feature Image */}
                <div className="relative h-64 rounded-2xl overflow-hidden mb-5 bg-[#050d1a]">
                  <Image
                    src="/central-monitoreo.png"
                    alt="Central de Monitoreo GAMA Security"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-4 right-4 text-left">
                    <span className="text-[10px] uppercase font-mono text-[#2997ff] tracking-wider font-semibold">
                      CENTRAL DE OPERACIONES REDUNDANTE
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      Recepción de eventos en tiempo real
                    </h3>
                  </div>
                </div>

                {/* Floating Metric Badges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-3 text-left">
                    <div className="text-[11px] text-slate-400 font-sans">
                      Tiempo de reacción
                    </div>
                    <div className="text-lg font-bold text-white font-mono">
                      &lt; 120 seg
                    </div>
                  </div>
                  <div className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-3 text-left">
                    <div className="text-[11px] text-slate-400 font-sans">
                      Estándar de Seguridad
                    </div>
                    <div className="text-lg font-bold text-[#2997ff] font-mono">
                      Enterprise
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Subtle Transition */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a1628] to-transparent pointer-events-none" />
    </section>
  )
}
