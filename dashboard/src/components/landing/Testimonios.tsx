'use client'

import { useEffect, useRef, useState } from 'react'

function useReveal() {
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

const TESTIMONIOS = [
  {
    name: 'Rodrigo Fuentes',
    role: 'Gerente General',
    empresa: 'Importadora Fuentes SpA',
    avatar: 'RF',
    color: 'from-sky-400 to-blue-600',
    stars: 5,
    text: 'Llevamos 3 años con GAMA y la tranquilidad que nos brinda es invaluable. En una oportunidad detectaron un intento de robo a las 3 AM y actuaron en menos de 90 segundos. Profesionales de primera.',
  },
  {
    name: 'Claudia Morales',
    role: 'Administradora',
    empresa: 'Edificio Res. Las Condes',
    avatar: 'CM',
    color: 'from-purple-400 to-pink-600',
    stars: 5,
    text: 'Instalaron cámaras en todo el edificio y cerco eléctrico en el perímetro. El sistema funciona perfectamente y la app de monitoreo es muy intuitiva. La atención post-venta es excelente.',
  },
  {
    name: 'Carlos Vega',
    role: 'Dueño',
    empresa: 'Ferretería Vega Hermanos',
    avatar: 'CV',
    color: 'from-amber-400 to-orange-600',
    stars: 5,
    text: 'Teníamos problemas constantes con alarmas falsas del sistema anterior. GAMA instaló un sistema completamente nuevo y lleva 2 años sin ningún problema. El soporte técnico es rápido y efectivo.',
  },
  {
    name: 'María José Soto',
    role: 'Propietaria',
    empresa: 'Hogar familiar - Vitacura',
    avatar: 'MS',
    color: 'from-green-400 to-emerald-600',
    stars: 5,
    text: 'Como madre de familia, la seguridad de mis hijos es lo primero. GAMA nos instaló el sistema de alarma y nos enseñaron a usarlo perfectamente. Muy profesionales y respetuosos.',
  },
]

export default function Testimonios() {
  const titleRef = useReveal()
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActive(prev => (prev + 1) % TESTIMONIOS.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="testimonios" className="relative py-28 sm:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050810] via-[#07101e] to-[#050810]" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div ref={titleRef} className="reveal text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-400/8 border border-purple-400/15 text-purple-400 text-xs font-mono tracking-widest uppercase mb-5">
            Clientes satisfechos
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
            Lo que dicen{' '}
            <span className="gradient-text-blue">nuestros clientes</span>
          </h2>
          <p className="text-gray-400">
            Más de 500 hogares y empresas confían en GAMA Seguridad para proteger lo más valioso.
          </p>
        </div>

        {/* Featured testimonial */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative glass-card border border-white/[0.07] rounded-3xl p-8 sm:p-10 transition-all duration-500 shadow-2xl shadow-black/30">
            {/* Quote icon */}
            <div className="absolute top-6 right-8 text-white/[0.04] text-8xl font-serif leading-none select-none">"</div>

            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {[...Array(TESTIMONIOS[active].stars)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>

            {/* Text */}
            <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-8 italic">
              "{TESTIMONIOS[active].text}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${TESTIMONIOS[active].color} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
                {TESTIMONIOS[active].avatar}
              </div>
              <div>
                <div className="text-white font-semibold">{TESTIMONIOS[active].name}</div>
                <div className="text-gray-400 text-sm">{TESTIMONIOS[active].role} · {TESTIMONIOS[active].empresa}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots + mini cards */}
        <div className="flex justify-center gap-2 mb-10">
          {TESTIMONIOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`transition-all duration-300 rounded-full ${i === active ? 'w-8 h-2 bg-sky-400' : 'w-2 h-2 bg-gray-600 hover:bg-gray-400'}`}
            />
          ))}
        </div>

        {/* Thumbnail row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
          {TESTIMONIOS.map((t, i) => (
            <button
              key={t.name}
              onClick={() => setActive(i)}
              className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                i === active
                  ? 'glass-card border-sky-400/30 shadow-lg shadow-sky-400/10'
                  : 'glass-card border-white/[0.05] hover:border-white/10 opacity-50 hover:opacity-75'
              }`}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-xs mb-2`}>
                {t.avatar}
              </div>
              <div className="text-white text-xs font-semibold leading-tight">{t.name}</div>
              <div className="text-gray-500 text-[10px] mt-0.5 leading-tight">{t.empresa}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
