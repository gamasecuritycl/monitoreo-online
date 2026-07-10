'use client'

import { motion } from 'framer-motion'

const BRANDS = [
  'Hikvision', 'DSC', 'Bosch', 'Dahua', 'Paradox', 'Crow', 'Honeywell', 'Risco',
  'Axis', 'Pelco', 'Vetti', 'Texecom',
]

const FEATURES = [
  { title: 'Respuesta automática', desc: 'Protocolo activado en < 2 min ante cualquier señal crítica.' },
  { title: 'Multi-canal', desc: 'WhatsApp, SMS, llamada y email en tiempo real.' },
  { title: 'Historial completo', desc: 'Registro auditado de todos los eventos con trazabilidad total.' },
  { title: 'Cobertura nacional', desc: 'Red de técnicos en todo Chile para instalación y mantención.' },
]

// Duplicate for infinite scroll
const TICKER = [...BRANDS, ...BRANDS]

export default function Tecnologia() {
  return (
    <section id="tecnologia" className="relative py-28 sm:py-36 bg-[#0a1628] overflow-hidden">
      <div className="absolute inset-0 tech-grid opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px section-divider" />
      <div className="absolute bottom-0 left-0 right-0 h-px section-divider" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-orange-500/4 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="section-label mb-5 inline-flex">Tecnología</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mt-5 mb-5">
            Plataforma{' '}
            <span className="text-gradient-orange">Scorpion</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Software estándar de la industria en Latinoamérica. Gestionamos miles de
            señales simultáneas con trazabilidad total y respuesta automática.
          </p>
        </motion.div>

        {/* Features + Mockup */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex gap-4 enterprise-card p-5"
              >
                <div className="flex-shrink-0 w-2 rounded-full bg-orange-500/60 mt-1" />
                <div>
                  <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
                  <p className="text-slate-400 text-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Platform mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/8 blur-[60px] rounded-3xl" />
              <div className="relative enterprise-card border-[#1e3a5f] rounded-2xl overflow-hidden shadow-2xl">
                {/* Window chrome */}
                <div className="bg-[#060d1a] border-b border-[#1e3a5f] px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">central.scorpion — GAMA SERVICIOS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="live-dot" />
                    <span className="text-[9px] text-green-400 font-mono">LIVE</span>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5 bg-[#060d1a] space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { l: 'Clientes', v: '487', c: 'text-green-400' },
                      { l: 'Alarmas hoy', v: '23', c: 'text-orange-400' },
                      { l: 'Señales/h', v: '1.2k', c: 'text-blue-400' },
                    ].map(s => (
                      <div key={s.l} className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-3 text-center">
                        <div className={`text-xl font-black font-mono ${s.c}`}>{s.v}</div>
                        <div className="text-[9px] text-slate-600">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { code: 'E131', cta: 'CL-4421', st: 'ALARMA', clr: 'text-red-400 bg-red-900/30' },
                      { code: 'E602', cta: 'CL-2187', st: 'OK', clr: 'text-green-400 bg-green-900/30' },
                      { code: 'R401', cta: 'CL-0933', st: 'RESTAURADO', clr: 'text-orange-400 bg-orange-900/20' },
                      { code: 'E130', cta: 'CL-5512', st: 'ALARMA', clr: 'text-red-400 bg-red-900/30' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#0f2240] border border-[#1e3a5f]/50 rounded-lg px-3 py-2">
                        <span className="font-mono text-[11px] text-orange-400">{row.code}</span>
                        <span className="font-mono text-[11px] text-slate-500">{row.cta}</span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${row.clr}`}>{row.st}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-[9px] text-slate-700 font-mono pt-1">
                    Scorpion Platform v4.2 — GAMA SERVICIOS
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Brands ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-center text-xs font-mono text-slate-600 uppercase tracking-widest mb-8">
            Trabajamos con las mejores marcas
          </p>
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0a1628] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0a1628] to-transparent z-10" />
            <div className="flex ticker-track">
              {TICKER.map((brand, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 mx-4 px-6 py-3 bg-[#0f2240] border border-[#1e3a5f] rounded-xl hover:border-orange-500/30 transition-colors cursor-default"
                >
                  <span className="text-slate-400 text-sm font-semibold whitespace-nowrap hover:text-white transition-colors">
                    {brand}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
