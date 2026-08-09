'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const ITEMS = [
  {
    img: '/camaras-cctv.png',
    title: 'Cámaras de Vigilancia 4K',
    desc: 'Instalación de cámaras dome y bullet 4K con visión nocturna, acceso remoto y detección de movimiento por IA.',
    tag: 'CCTV · IA · 4K',
    color: '#2997ff',
  },
  {
    img: '/cerco-electrico.png',
    title: 'Cerco Eléctrico Perimetral',
    desc: 'Sistema perimetral de alta tensión con 6 hebras sobre muro, señalética reglamentaria y electrificador homologado.',
    tag: '10.000V · Disuasivo',
    color: '#0066cc',
  },
  {
    img: '/dsc-power.png',
    title: 'Teclados LED DSC Power Series',
    desc: 'Teclado LED clásico DSC Power Series con teclas retroiluminadas e indicadores de estado perimetral de alta precisión.',
    tag: 'DSC Power Series',
    color: '#22c55e',
  },
  {
    img: '/dsc-panels.png',
    title: 'Paneles DSC Power Series',
    desc: 'Paneles centrales de alarma DSC Power Series para proyectos residenciales, comerciales e industriales.',
    tag: 'DSC Power Series',
    color: '#2997ff',
  },
  {
    img: '/prevencion-robo.png',
    title: 'Prevención de Robo GAMA',
    desc: 'Protocolos preventivos con placas disuasivas GAMA Security y auditoría de vulnerabilidades en terreno.',
    tag: 'GAMA Security',
    color: '#0066cc',
  },
  {
    img: '/central-monitoreo.png',
    title: 'Central de Monitoreo 24/7',
    desc: 'Operadores altamente capacitados monitoreando tu propiedad las 24 horas. Respuesta confirmada en menos de 2 minutos.',
    tag: '< 2 min · 24/7',
    color: '#2997ff',
  },
]

export default function Galeria() {
  return (
    <section id="galeria" className="relative py-24 sm:py-32 tile-navy-1 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-xs font-semibold text-[#2997ff] uppercase tracking-widest font-sans mb-3 inline-block">EQUIPOS Y SOLUCIONES</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Tecnología de <span className="text-[#2997ff]">primera línea</span>
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Trabajamos con marcas líderes como DSC Power Series, Hikvision y Dahua. Equipos homologados y garantizados.
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
              className="group apple-card-dark overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-[#050d1a]">
                  <Image
                    src={item.img}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent opacity-90" />
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
                <div className="p-5 text-left">
                  <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>

              <div className="p-5 pt-0 text-left">
                <button
                  onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs font-semibold flex items-center gap-1.5 transition-colors duration-200"
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
          <p className="text-slate-400 text-sm">
            Todos los equipos cuentan con garantía y soporte técnico permanente de GAMA Security (www.gamasecurity.cl)
          </p>
        </motion.div>
      </div>
    </section>
  )
}
