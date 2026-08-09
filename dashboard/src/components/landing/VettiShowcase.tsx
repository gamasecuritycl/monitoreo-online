'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const VETTI_FEATURES = [
  {
    title: 'Control total con App NT CLICK',
    desc: 'Armado, desarmado y monitoreo de zonas en tiempo real desde tu smartphone iOS o Android. Recibe alertas push instantáneas ante cualquier evento.',
  },
  {
    title: '100% Inalámbrico sin perforaciones',
    desc: 'Sensores inteligentes de instalación rápida y estética impecable. Sin cables a la vista ni alteraciones a la arquitectura de tu propiedad.',
  },
  {
    title: 'Sensores de Nano-Consumo (Hasta 4 años de batería)',
    desc: 'Tecnología ultradeficiente que extiende la duración de la batería de los sensores magnéticos e infrarrojos PIR por hasta 4 años.',
  },
  {
    title: 'Transmisión Dual WiFi + 4G/GPRS',
    desc: 'Doble vía de comunicación automatizada. Si la red WiFi local falla, la central Vetti conmuta de inmediato a la red celular de respaldo.',
  },
]

export default function VettiShowcase() {
  const scrollToContacto = () => {
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative py-24 sm:py-32 tile-navy-2 overflow-hidden text-white">
      
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[400px] bg-[#0066cc]/15 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header (Apple Display LG) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20 space-y-4"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0066cc]/15 border border-[#0066cc]/30 text-xs font-semibold text-[#2997ff] uppercase tracking-widest font-sans">
            ★ PRODUCTO ESTRELLA GAMA SECURITY
          </span>
          <h2 className="apple-display-lg text-white">
            Alarma Inteligente Vetti & App NT CLICK.
          </h2>
          <p className="apple-lead text-slate-300 max-w-2xl mx-auto">
            La solución de alarma inalámbrica más avanzada del mercado. Control absoluto en la palma de tu mano,
            respaldada por la central de monitoreo GAMA Security 24/7.
          </p>
        </motion.div>

        {/* Grid Showcase */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Product Showcase Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            <div className="relative rounded-3xl overflow-hidden bg-[#050d1a] border border-[#1e3a5f] p-6 apple-drop-shadow-lg text-left">
              
              {/* Top Chrome */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1e3a5f]/60 text-xs font-sans text-slate-300">
                <span className="font-semibold text-white">
                  SISTEMA VETTI SMART ALARM
                </span>
                <span className="text-[#2997ff] font-mono text-[11px]">
                  APP NT CLICK INCLUIDA
                </span>
              </div>

              {/* Product Hero Image */}
              <div className="relative h-72 rounded-2xl overflow-hidden bg-[#0a1628] mb-5">
                <Image
                  src="/vetti-click-app.png"
                  alt="Alarma Inteligente Vetti y Aplicación CLICK"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Badges strip */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href="https://apps.apple.com/ar/app/nt-click/id1440514183"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0f2240] hover:bg-[#162a4a] border border-[#1e3a5f] rounded-xl p-3 flex items-center gap-3 transition-colors group"
                >
                  <svg className="w-6 h-6 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.04c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.6.7-.1.13-1.97 1.01-3.01 1.07.02 2.26-.6 2.8-1.39z"/>
                  </svg>
                  <div>
                    <div className="text-[10px] text-slate-400">Descargar para iOS</div>
                    <div className="text-xs font-semibold text-white group-hover:text-[#2997ff] transition-colors">
                      App Store (NT CLICK) →
                    </div>
                  </div>
                </a>

                <div className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-3 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#2997ff] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="text-[10px] text-slate-400">Control Smartphone</div>
                    <div className="text-xs font-semibold text-white">
                      Notificaciones Push 24/7
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

          {/* Right Column: Key Features & Action */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            <h3 className="apple-display-md text-white">
              Seguridad de última generación con la máxima simplicidad.
            </h3>

            <div className="space-y-4">
              {VETTI_FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="apple-card-dark p-5 flex gap-4"
                >
                  <div className="w-2 rounded-full bg-[#0066cc] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold text-base mb-1">
                      {f.title}
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={scrollToContacto}
                className="btn-apple-primary text-base py-3 px-7"
              >
                Cotizar Alarma Vetti
              </button>

              <a
                href="https://wa.me/56991016912"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-apple-secondary-dark text-base py-3 px-6"
              >
                Consultar por WhatsApp →
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
