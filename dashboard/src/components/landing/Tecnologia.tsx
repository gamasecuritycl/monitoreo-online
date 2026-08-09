'use client'

import { motion } from 'framer-motion'

const BRANDS = [
  'DSC', 'Hikvision', 'Bosch', 'Dahua', 'Paradox', 'Crow',
  'Honeywell', 'Risco', 'Axis', 'Pelco', 'Texecom',
]

const FEATURES = [
  {
    title: 'Protocolo de respuesta inmediata',
    desc: 'Activación de verificación operativa en menos de 2 minutos ante señales críticas de intrusión.',
  },
  {
    title: 'Notificación omnicanal (+56 9 9101 6912)',
    desc: 'Alertas inmediatas mediante WhatsApp, llamada telefónica y correo electrónico.',
  },
  {
    title: 'Zonificación de precisión Nivel Enterprise',
    desc: 'Identificación exacta de la zona vulnerada (área, sensor, teclado DSC) con historial auditado.',
  },
  {
    title: 'Redundancia y alta disponibilidad',
    desc: 'Sistemas de energía ininterrumpida (UPS) y múltiples canales de transmisión IP/GPRS.',
  },
]

const TICKER = [...BRANDS, ...BRANDS]

export default function Tecnologia() {
  return (
    <section id="tecnologia" className="relative py-24 sm:py-32 tile-navy-deep overflow-hidden">
      
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#0066cc]/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20 space-y-4"
        >
          <span className="text-xs font-semibold text-[#2997ff] uppercase tracking-widest font-sans">
            TECNOLOGÍA Y EQUIPOS DE PRIMERA LÍNEA
          </span>
          <h2 className="apple-display-lg text-white">
            Sistemas de prevención y monitoreo avanzado 24/7.
          </h2>
          <p className="apple-lead text-slate-300 max-w-2xl mx-auto">
            Trabajamos con las marcas líderes del mercado como DSC Power Series, Hikvision y Dahua.
            Equipos homologados y garantizados con soporte técnico permanente.
          </p>
        </motion.div>

        {/* Features + Interactive Mockup Showcase */}
        <div className="grid lg:grid-cols-12 gap-12 items-center mb-24">
          
          {/* Features Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-4 text-left"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="apple-card-dark p-5 flex gap-4"
              >
                <div className="w-1.5 rounded-full bg-[#2997ff] flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold text-base mb-1">
                    {f.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Interactive Console Window Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            <div className="relative rounded-2xl overflow-hidden bg-[#0a1628] border border-[#1e3a5f] apple-drop-shadow-lg text-left">
              
              {/* Window Header */}
              <div className="bg-[#050d1a] border-b border-[#1e3a5f] px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    central.operativa — GAMA SECURITY
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="live-dot" />
                  <span className="text-[11px] font-mono text-green-400">ACTIVO</span>
                </div>
              </div>

              {/* Console Dashboard Body */}
              <div className="p-6 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Cuentas activas', val: '500+', color: 'text-green-400' },
                    { label: 'Eventos hoy', val: '24', color: 'text-[#2997ff]' },
                    { label: 'Señales/hora', val: '1.4k', color: 'text-amber-400' },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-3 text-center">
                      <div className={`text-xl font-bold font-mono ${s.color}`}>
                        {s.val}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Event Feed Rows */}
                <div className="space-y-2 font-mono text-xs">
                  {[
                    { code: 'E131', cta: 'CUENTA-0014', event: 'ALARMA ROBO PERIMETRAL', state: 'EN VERIFICACIÓN', clr: 'text-red-400 bg-red-950/40 border-red-500/30' },
                    { code: 'E602', cta: 'CUENTA-C7C9', event: 'TEST PERIODICO OK', state: 'NORMAL', clr: 'text-green-400 bg-green-950/30 border-green-500/20' },
                    { code: 'R401', cta: 'CUENTA-C7A0', event: 'RESTAURACION ZONA 02', state: 'RESTABLECIDO', clr: 'text-[#2997ff] bg-blue-950/30 border-blue-500/20' },
                    { code: 'E130', cta: 'CUENTA-0082', event: 'ALARMA TECLADO DSC POWER', state: 'VERIFICADO', clr: 'text-amber-400 bg-amber-950/30 border-amber-500/20' },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border flex items-center justify-between ${row.clr}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{row.code}</span>
                        <span className="text-slate-300">{row.cta}</span>
                        <span className="hidden sm:inline text-slate-400 text-[11px]">{row.event}</span>
                      </div>
                      <span className="text-[10px] font-bold tracking-wider">
                        {row.state}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-center text-[10px] font-mono text-slate-500 pt-1">
                  GAMA SECURITY Central Monitoreo Chile · www.gamasecurity.cl
                </div>
              </div>

            </div>
          </motion.div>

        </div>

        {/* Brands Ticker Showcase */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="pt-8"
        >
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
            COMPATIBILIDAD Y EQUIPAMIENTO CON LAS MARCAS LÍDERES
          </p>

          <div className="relative overflow-hidden">
            {/* Fade Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050d1a] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050d1a] to-transparent z-10 pointer-events-none" />

            <div className="flex ticker-track">
              {TICKER.map((brand, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 mx-3 px-5 py-2.5 bg-[#0f2240] border border-[#1e3a5f] rounded-full text-slate-300 text-sm font-medium hover:text-white transition-colors cursor-default"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
