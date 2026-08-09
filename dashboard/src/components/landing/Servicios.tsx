'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'

const SERVICES = [
  {
    id: 'monitoreo',
    title: 'Monitoreo Central 24/7',
    desc: 'Operación continua las 24 horas, los 365 días del año. Recepción y verificación de señales en tiempo real mediante la plataforma Scorpion.',
    img: '/central-monitoreo.png',
    tag: '< 2 min respuesta',
    features: ['Conexión IP / GPRS redundante', 'Operadores certificados OS-10', 'Verificación inmediata de eventos'],
  },
  {
    id: 'camaras',
    title: 'Cámaras 4K con IA',
    desc: 'Sistemas CCTV de alta resolución con analítica de inteligencia artificial, detección de intrusión perimetral y acceso remoto directo.',
    img: '/camaras-cctv.png',
    tag: 'IA · 4K UHD',
    features: ['Visualización en vivo 24/7', 'Analítica de video inteligente', 'Grabación local + respaldo cloud'],
  },
  {
    id: 'cercos',
    title: 'Cercos Eléctricos',
    desc: 'Protección perimetral disuasiva de alta tensión para instalaciones residenciales e industriales, integrados con la central de monitoreo.',
    img: '/cerco-electrico.png',
    tag: '10.000V Disuasivo',
    features: ['Certificación electromagnética', 'Respuesta integrada ante corte', 'Mantención periódica programada'],
  },
  {
    id: 'alarmas',
    title: 'Sistemas de Alarma',
    desc: 'Detección perimetral e interior con sensores de movimiento, apertura e impacto conectados directamente a nuestro centro operativo.',
    img: '/vetti-alarm.png',
    tag: 'Cobertura 360°',
    features: ['Sensores de alta precisión', 'Paneles anti-sabotaje', 'Notificación inmediata en celular'],
  },
  {
    id: 'prevencion',
    title: 'Prevención de Robo',
    desc: 'Protocolos preventivos y auditoría de seguridad integral para recintos comerciales, empresariales y parques industriales.',
    img: '/prevencion-robo.png',
    tag: 'Empresas & Pymes',
    features: ['Evaluación de vulnerabilidades', 'Planes de respuesta rápida', 'Reportes periódicos auditados'],
  },
  {
    id: 'incendio',
    title: 'Detección de Incendio',
    desc: 'Sistemas automáticos de detección de humo, temperatura y gas con alerta temprana conectada a la central y coordinación con bomberos.',
    img: '/deteccion-incendio.png',
    tag: 'Alerta Temprana',
    features: ['Sensores térmicos y fotoeléctricos', 'Protocolo automático de emergencia', 'Conexión 24 horas'],
  },
]

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function Servicios() {
  const scrollToContacto = () => {
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="servicios" className="relative py-24 sm:py-32 bg-[#0a1628] text-white overflow-hidden">
      
      {/* Top subtle border divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1e3a5f] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header (Apple Display LG Style) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20 space-y-4"
        >
          <span className="text-xs font-semibold text-[#2997ff] uppercase tracking-widest font-sans">
            NUESTROS SERVICIOS DE SEGURIDAD
          </span>
          <h2 className="apple-display-lg text-white">
            Soluciones integrales de seguridad electrónica.
          </h2>
          <p className="text-slate-300 apple-lead text-base sm:text-lg max-w-2xl mx-auto">
            Desde el monitoreo continuo 24/7 hasta la instalación de cercos y cámaras 4K,
            ofrecemos protección integral para tu hogar y empresa.
          </p>
        </motion.div>

        {/* Services Museum Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {SERVICES.map((svc) => (
            <motion.div
              key={svc.id}
              variants={cardVariants}
              className="apple-card-dark overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Image Frame */}
                <div className="relative h-48 w-full bg-[#050d1a] overflow-hidden">
                  <Image
                    src={svc.img}
                    alt={svc.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f2240] via-transparent to-transparent opacity-90" />
                  
                  {/* Badge */}
                  <div className="absolute top-3 right-3 bg-[#050d1a]/80 backdrop-blur-md border border-[#1e3a5f] rounded-full px-3 py-1 text-[11px] font-mono text-[#2997ff]">
                    {svc.tag}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3 text-left">
                  <h3 className="text-xl font-semibold text-white tracking-tight">
                    {svc.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {svc.desc}
                  </p>

                  {/* Bullet points */}
                  <ul className="pt-3 space-y-1.5 border-t border-[#1e3a5f]/50">
                    {svc.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                        <svg className="w-3.5 h-3.5 text-[#2997ff] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="p-6 pt-0 text-left">
                <button
                  onClick={scrollToContacto}
                  className="apple-link-dark text-sm font-medium pt-2 inline-flex items-center gap-1 text-[#2997ff]"
                >
                  Cotizar este servicio →
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom border divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1e3a5f] to-transparent" />
    </section>
  )
}
