'use client'

import { motion } from 'framer-motion'

const TESTIMONIALS = [
  {
    quote: "La velocidad de respuesta ante un salto de alarma en nuestra bodega industrial fue impecable. En menos de 2 minutos ya estaban coordinados con nuestro equipo de seguridad.",
    author: "Carlos Mendoza",
    role: "Gerente de Operaciones",
    company: "Logística y Comercio SA",
  },
  {
    quote: "El sistema de cámaras 4K con analítica IA nos da absoluta tranquilidad. Puedo revisar las cámaras de las sucursales directamente desde el celular sin interrupciones.",
    author: "María José Silva",
    role: "Administradora de Sucursales",
    company: "Red de Farmacias Regional",
  },
  {
    quote: "La instalación del cerco eléctrico e integración con la central de GAMA SERVICIOS ha sido la mejor inversión para nuestra comunidad de parcelas.",
    author: "Roberto Fuentes",
    role: "Presidente Comité de Seguridad",
    company: "Condominio Los Lingues",
  },
]

export default function Testimonios() {
  return (
    <section className="relative py-24 sm:py-32 tile-parchment overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-3"
        >
          <span className="text-xs font-semibold text-[#0066cc] uppercase tracking-widest font-sans">
            EXPERIENCIA DE NUESTROS CLIENTES
          </span>
          <h2 className="apple-display-lg text-[#1d1d1f]">
            Confianza respaldada por resultados.
          </h2>
        </motion.div>

        {/* Testimonials Grid (Environment Quote Cards) */}
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="apple-card-light p-8 flex flex-col justify-between text-left"
            >
              <div className="space-y-4">
                <div className="flex gap-1 text-[#0066cc]">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#1d1d1f] text-base leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="font-semibold text-[#1d1d1f] text-sm">
                  {t.author}
                </div>
                <div className="text-xs text-[#7a7a7a]">
                  {t.role} · {t.company}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
