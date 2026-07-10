'use client'

import { motion } from 'framer-motion'

const TESTIMONIOS = [
  {
    name: 'Rodrigo Fuentes',
    role: 'Gerente General',
    empresa: 'Importadora Fuentes SpA',
    initials: 'RF',
    text: 'Llevamos 3 años con GAMA SERVICIOS y la tranquilidad que nos brinda es invaluable. Detectaron un intento de intrusión a las 3 AM y respondieron en menos de 90 segundos. Profesionales de primera.',
    stars: 5,
  },
  {
    name: 'Claudia Morales',
    role: 'Administradora',
    empresa: 'Edificio Residencial Las Condes',
    initials: 'CM',
    text: 'Instalaron cámaras IP 4K en todo el edificio y el cerco eléctrico perimetral. El sistema funciona perfecto y la central de monitoreo responde siempre. Muy recomendados.',
    stars: 5,
  },
  {
    name: 'Carlos Vega',
    role: 'Propietario',
    empresa: 'Ferretería Vega Hermanos',
    initials: 'CV',
    text: 'Antes teníamos alarmas falsas constantes. GAMA instaló un sistema completamente nuevo y lleva 2 años sin un solo problema. El soporte técnico es rápido y confiable.',
    stars: 5,
  },
]

export default function Testimonios() {
  return (
    <section id="testimonios" className="relative py-28 sm:py-36 bg-[#0a1628] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px section-divider" />
      <div className="absolute bottom-0 left-0 right-0 h-px section-divider" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[#1e3a5f]/30 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="section-label mb-5 inline-flex">Clientes satisfechos</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mt-5 mb-5">
            Lo que dicen{' '}
            <span className="text-gradient-orange">nuestros clientes</span>
          </h2>
          <p className="text-slate-400">
            Más de 500 hogares y empresas protegidos en todo Chile confían en GAMA SERVICIOS.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIOS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="enterprise-card p-7 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(t.stars)].map((_, si) => (
                  <svg key={si} className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-6 italic">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-[#1e3a5f]">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role} · {t.empresa}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
