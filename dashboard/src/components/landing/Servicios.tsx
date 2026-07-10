'use client'

import { useEffect, useRef } from 'react'

function useReveal(className = 'reveal') {
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

const SERVICES = [
  {
    id: 'monitoreo',
    color: 'sky',
    accent: '#0ea5e9',
    gradient: 'from-sky-500/15 to-sky-500/5',
    border: 'border-sky-500/20',
    hoverBorder: 'hover:border-sky-400/40',
    badgeColor: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Monitoreo 24/7',
    desc: 'Central operativa las 24 horas, 365 días al año. Recepción y verificación de señales de alarma en tiempo real con respuesta en menos de 2 minutos.',
    stat: '< 2 min',
    statLabel: 'Tiempo de respuesta',
    badge: 'ACTIVO',
    features: ['Señales IP y GPRS', 'Operadores certificados', 'Sistema redundante'],
  },
  {
    id: 'cercos',
    color: 'amber',
    accent: '#f59e0b',
    gradient: 'from-amber-500/15 to-amber-500/5',
    border: 'border-amber-500/20',
    hoverBorder: 'hover:border-amber-400/40',
    badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Cercos Eléctricos',
    desc: 'Instalación, mantención y monitoreo de cercos eléctricos perimetrales de alta tensión. Protección efectiva para propiedades residenciales e industriales.',
    stat: '10.000V',
    statLabel: 'Alta tensión disuasiva',
    badge: 'INSTALACIÓN',
    features: ['Perimetral residencial', 'Industrial y bodega', 'Mantención periódica'],
  },
  {
    id: 'camaras',
    color: 'purple',
    accent: '#a855f7',
    gradient: 'from-purple-500/15 to-purple-500/5',
    border: 'border-purple-500/20',
    hoverBorder: 'hover:border-purple-400/40',
    badgeColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Cámaras de Vigilancia',
    desc: 'Instalación de CCTV con cámaras IP HD, acceso remoto desde tu celular, grabación en NVR y detección de movimiento con inteligencia artificial.',
    stat: '4K UHD',
    statLabel: 'Resolución máxima',
    badge: 'IA DETECT.',
    features: ['Acceso remoto 24/7', 'Detección con IA', 'Almacenamiento cloud'],
  },
  {
    id: 'alarmas',
    color: 'red',
    accent: '#ef4444',
    gradient: 'from-red-500/15 to-red-500/5',
    border: 'border-red-500/20',
    hoverBorder: 'hover:border-red-400/40',
    badgeColor: 'text-red-400 bg-red-400/10 border-red-400/20',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: 'Sistemas de Alarma',
    desc: 'Alarmas patrimoniales para hogares, comercios e industrias. Sensores de apertura, movimiento, impacto, vibración y perimetrales conectados a nuestra central.',
    stat: '360°',
    statLabel: 'Cobertura perimetral',
    badge: 'PATRIMONIAL',
    features: ['Sensores múltiples', 'Panel inteligente', 'Notificación inmediata'],
  },
  {
    id: 'acceso',
    color: 'green',
    accent: '#22c55e',
    gradient: 'from-green-500/15 to-green-500/5',
    border: 'border-green-500/20',
    hoverBorder: 'hover:border-green-400/40',
    badgeColor: 'text-green-400 bg-green-400/10 border-green-400/20',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    title: 'Control de Acceso',
    desc: 'Sistemas de control de acceso biométrico, tarjetas de proximidad RFID y cerraduras electromagnéticas. Gestión de turnos y registro de entradas y salidas.',
    stat: 'RFID + Bio',
    statLabel: 'Tecnología dual',
    badge: 'BIOMÉTRICO',
    features: ['Huella dactilar', 'Tarjeta RFID', 'Registro auditado'],
  },
  {
    id: 'incendio',
    color: 'orange',
    accent: '#f97316',
    gradient: 'from-orange-500/15 to-orange-500/5',
    border: 'border-orange-500/20',
    hoverBorder: 'hover:border-orange-400/40',
    badgeColor: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    title: 'Detección de Incendio',
    desc: 'Sistemas de detección y alarma de incendio con sensores de humo, temperatura, CO y gas. Respuesta automática conectada a nuestra central 24/7.',
    stat: 'Auto',
    statLabel: 'Respuesta automática',
    badge: 'PREVENCIÓN',
    features: ['Detector de humo', 'Sensor de temperatura', 'Alarma de gas'],
  },
]

export default function Servicios() {
  const titleRef = useReveal()

  return (
    <section id="servicios" className="relative py-28 sm:py-36 overflow-hidden bg-[#050810]">
      {/* Background effects */}
      <div className="absolute inset-0 tech-grid opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px section-divider" />
      <div className="absolute bottom-0 left-0 right-0 h-px section-divider" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-purple-500/4 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={titleRef} className="reveal text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-400/8 border border-purple-400/15 text-purple-400 text-xs font-mono tracking-widest uppercase mb-5">
            Nuestros Servicios
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
            Soluciones integrales{' '}
            <span className="gradient-text-blue">de seguridad</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            Desde la instalación hasta el monitoreo continuo, cubrimos todos los aspectos de la
            seguridad electrónica para proteger lo que más te importa.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((svc, i) => (
            <ServiceCard key={svc.id} svc={svc} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceCard({ svc, delay }: { svc: typeof SERVICES[0]; delay: number }) {
  const ref = useReveal()

  return (
    <div
      ref={ref}
      className={`reveal service-card neon-border-animated group relative bg-gradient-to-br ${svc.gradient} border ${svc.border} ${svc.hoverBorder} rounded-2xl p-6 transition-all duration-400 cursor-default`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div
          className={`service-icon p-3 rounded-xl bg-white/5 border border-white/[0.06]`}
          style={{ color: svc.accent }}
        >
          {svc.icon}
        </div>
        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${svc.badgeColor}`}>
          {svc.badge}
        </span>
      </div>

      {/* Content */}
      <h3 className="text-white font-bold text-lg mb-2.5 group-hover:text-white transition-colors">
        {svc.title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-5">
        {svc.desc}
      </p>

      {/* Features */}
      <ul className="space-y-1.5 mb-5">
        {svc.features.map(f => (
          <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: svc.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      {/* Stat footer */}
      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
        <div>
          <div className="text-xl font-black" style={{ color: svc.accent }}>{svc.stat}</div>
          <div className="text-[10px] text-gray-600 font-mono">{svc.statLabel}</div>
        </div>
        <button
          onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/[0.06] hover:border-white/10 transition-all duration-200"
        >
          Cotizar →
        </button>
      </div>
    </div>
  )
}
