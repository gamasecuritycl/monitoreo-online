'use client'

import { motion } from 'framer-motion'

export default function CTAEmergencia() {
  const scrollToContacto = () => {
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative py-20 bg-[#050d1a] overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0066cc]/10 via-[#1e3a5f]/20 to-[#0066cc]/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Apple Callout Tile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-[#0a1628] border border-[#1e3a5f] p-8 sm:p-14 text-center overflow-hidden apple-drop-shadow-lg"
        >
          {/* Ambient Lighting inside card */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#0066cc]/15 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0f2240] border border-[#1e3a5f] text-xs font-mono text-[#2997ff]">
              <span className="live-dot" /> ATENCIÓN Y MONITOREO 24 HORAS
            </span>

            <h2 className="apple-display-lg text-white">
              ¿Necesitas asegurar tu propiedad o empresa hoy mismo?
            </h2>

            <p className="apple-lead text-slate-300 max-w-xl mx-auto">
              Nuestros especialistas en seguridad electrónica evalúan tu infraestructura
              y entregan una propuesta técnica de monitoreo sin costo.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={scrollToContacto}
                className="btn-apple-primary text-base py-3 px-8 font-medium"
              >
                Solicitar Cotización Inmediata
              </button>

              <a
                href="https://wa.me/56991016912"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-apple-secondary-dark text-base py-3 px-6"
              >
                Hablar por WhatsApp (+56 9 9101 6912) →
              </a>
            </div>

            <p className="text-xs text-slate-400 font-sans pt-2">
              Respuesta garantizada · Asesoría personalizada en Chile
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
