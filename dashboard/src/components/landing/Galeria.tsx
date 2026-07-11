'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const ITEMS = [
  {
    img: '/camaras-cctv.png',
    title: 'Cámaras de Vigilancia IP',
    desc: 'Instalación de cámaras dome y bullet 4K con visión nocturna, acceso remoto y detección de movimiento por IA.',
    tag: 'CCTV · IA · 4K',
    color: '#3b82f6',
  },
  {
    img: '/cerco-electrico.png',
    title: 'Cerco Eléctrico 6 Hebras',
    desc: 'Sistema perimetral de alta tensión con 6 hebras sobre muro, señalética reglamentaria y electrificador homologado.',
    tag: '10.000V · OS-10',
    color: '#f59e0b',
  },
  {
    img: '/vetti-alarm.png',
    title: 'Alarma Vetti Smart Alarm',
    desc: 'Sistema inalámbrico Vetti con sensores nano-consumo (4 años de batería), WiFi + GPRS, instalación en < 30 min.',
    tag: 'Inalámbrica · 4G',
    color: '#22c55e',
  },
  {
    img: '/dsc-panels.png',
    title: 'Paneles DSC Power & NEO',
    desc: 'Paneles DSC PowerSeries NEO con tecnología PowerG cifrada 128-bit AES. Hasta 128 zonas. Cobertura 2 km.',
    tag: 'DSC · PowerG · AES',
    color: '#f97316',
  },
  {
    img: '/deteccion-incendio.png',
    title: 'Detección de Incendio',
    desc: 'Detectores de humo, temperatura y gas CO conectados a central 24/7. Respuesta automática y coordinación con bomberos.',
    tag: 'Humo · Gas · Calor',
    color: '#ef4444',
  },
  {
    img: '/central-monitoreo.png',
    title: 'Central de Monitoreo 24/7',
    desc: 'Operadores certificados monitoreando tu propiedad las 24 horas. Respuesta confirmada en menos de 2 minutos.',
    tag: '< 2 min · 24/7',
    color: '#a855f7',
  },
]

export default function Galeria() {
  return (
    <section id="galeria" className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1a] via-[#0a1628] to-[#050d1a]" />
      <div className="absolute top-0 left-0 right-0 h-px section-divider" />
      <div className="absolute bottom-0 left-0 right-0 h-px section-divider" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="section-label mb-5 inline-flex">Equipos y Soluciones</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mt-5 mb-5">
            Tecnología de{' '}
            <span className="text-gradient-orange">primera línea</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Trabajamos con las marcas líderes del mercado. Equipos homologados,
            garantizados y con soporte técnico permanente.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
              className="group enterprise-card overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden bg-[#060d1a]">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />
                {/* Tag */}
                <div
                  className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm"
                  style={{
                    color: item.color,
                    background: `${item.color}20`,
                    borderColor: `${item.color}40`,
                  }}
                >
                  {item.tag}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div
                  className="w-1 h-6 rounded-full mb-3 inline-block"
                  style={{ background: item.color }}
                />
                <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                <button
                  onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-4 text-xs font-semibold flex items-center gap-1.5 transition-colors duration-200"
                  style={{ color: item.color }}
                >
                  Cotizar →
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-slate-600 text-sm">
            Todos los equipos cuentan con garantía del fabricante y soporte técnico de GAMA SERVICIOS
          </p>
        </motion.div>
      </div>
    </section>
  )
}
