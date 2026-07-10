'use client'

import { motion } from 'framer-motion'

const SERVICES = [
  {
    id: 'monitoreo',
    accent: '#f97316',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Monitoreo Central 24/7',
    desc: 'Central operativa las 24 horas, 365 días al año. Recepción y verificación de señales en tiempo real con plataforma Scorpion.',
    tag: '< 2 min respuesta',
    features: ['Señales IP y GPRS', 'Operadores certificados', 'Sistema redundante'],
  },
  {
    id: 'camaras',
    accent: '#3b82f6',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Instalación de Cámaras',
    desc: 'CCTV con cámaras IP 4K, acceso remoto desde tu celular, grabación en NVR y detección de movimiento con inteligencia artificial.',
    tag: 'IA · 4K UHD',
    features: ['Acceso remoto 24/7', 'Detección con IA', 'NVR local + cloud'],
  },
  {
    id: 'cercos',
    accent: '#f59e0b',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Cercos Eléctricos',
    desc: 'Instalación, mantención y monitoreo de cercos eléctricos perimetrales de alta tensión para propiedades residenciales e industriales.',
    tag: '10.000V disuasivo',
    features: ['Residencial · Industrial', 'Mantención periódica', 'Integrado a central'],
  },
  {
    id: 'alarmas',
    accent: '#ef4444',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: 'Sistemas de Alarma',
    desc: 'Alarmas patrimoniales con sensores de apertura, movimiento, impacto y vibración. Integradas a nuestra central de monitoreo 24/7.',
    tag: '360° perimetral',
    features: ['Sensores múltiples', 'Panel inteligente', 'Notificación inmediata'],
  },
  {
    id: 'acceso',
    accent: '#22c55e',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    title: 'Control de Acceso',
    desc: 'Biométrico, tarjetas RFID y cerraduras electromagnéticas. Gestión de turnos y registro completo de entradas y salidas.',
    tag: 'Biométrico · RFID',
    features: ['Huella dactilar', 'Tarjeta RFID', 'Registro auditado'],
  },
  {
    id: 'incendio',
    accent: '#f97316',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    title: 'Detección de Incendio',
    desc: 'Detectores de humo, temperatura, CO y gas. Respuesta automática conectada a central 24/7 y coordinación con bomberos.',
    tag: 'Respuesta automática',
    features: ['Humo · Temperatura', 'Sensor de gas', 'Coordinación bomberos'],
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }
}

export default function Servicios() {
  return (
    <section id="servicios" className="relative py-28 sm:py-36 bg-[#0a1628] overflow-hidden">
      <div className="absolute inset-0 tech-grid opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px section-divider" />
      <div className="absolute bottom-0 left-0 right-0 h-px section-divider" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="section-label mb-5 inline-flex">Nuestros Servicios</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mt-5 mb-5">
            Soluciones integrales{' '}
            <span className="text-gradient-orange">de seguridad</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Desde la instalación hasta el monitoreo continuo, cubrimos todo el
            ecosistema de seguridad electrónica para tu hogar o empresa.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {SERVICES.map(svc => (
            <motion.div
              key={svc.id}
              variants={cardVariants}
              className="enterprise-card p-6 group cursor-default"
            >
              {/* Icon + tag */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="p-3 rounded-xl border border-white/10 bg-white/5"
                  style={{ color: svc.accent }}
                >
                  {svc.icon}
                </div>
                <span
                  className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border"
                  style={{
                    color: svc.accent,
                    background: `${svc.accent}15`,
                    borderColor: `${svc.accent}30`
                  }}
                >
                  {svc.tag}
                </span>
              </div>

              <h3 className="text-white font-bold text-lg mb-2.5">{svc.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">{svc.desc}</p>

              {/* Features */}
              <ul className="space-y-1.5 mb-5">
                {svc.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: svc.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="pt-4 border-t border-[#1e3a5f]">
                <button
                  onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs font-semibold flex items-center gap-1.5 transition-colors duration-200"
                  style={{ color: svc.accent }}
                >
                  Cotizar este servicio
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
