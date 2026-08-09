'use client'

import { motion } from 'framer-motion'

const TIMELINE = [
  { year: '2004', title: 'Fundación', desc: 'Inicia operaciones GAMA Security con su primera central de monitoreo en Chile.' },
  { year: '2009', title: 'Consolidación', desc: 'Ampliación de infraestructura y servicios de protección electrónica perimetral.' },
  { year: '2016', title: 'Plataforma Avanzada', desc: 'Gestión de alarmas y zonificación de precisión 24/7 con respuesta inmediata.' },
  { year: '2020', title: 'Expansión Nacional', desc: 'Cobertura completa de servicios de monitoreo e instalación en múltiples regiones.' },
  { year: '2024', title: 'Inteligencia Artificial', desc: 'Integración de analítica de video con IA y automatización de alertas en tiempo real.' },
]

const PILLARS = [
  {
    n: '+20',
    label: 'Años de Experiencia',
    sub: 'Trayectoria ininterrumpida',
  },
  {
    n: '500+',
    label: 'Clientes Activos',
    sub: 'Empresas y hogares',
  },
  {
    n: '99.9%',
    label: 'Uptime Operativo',
    sub: 'Central redundante 24/7',
  },
  {
    n: '24/7',
    label: 'Atención Continua',
    sub: 'Respuesta en < 120 seg',
  },
]

export default function QuienesSomos() {
  return (
    <section id="quienes-somos" className="relative py-24 sm:py-32 tile-parchment overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20 space-y-4"
        >
          <span className="text-xs font-semibold text-[#0066cc] uppercase tracking-widest font-sans">
            SOBRE GAMA SECURITY
          </span>
          <h2 className="apple-display-lg text-[#1d1d1f]">
            Protegiendo familias y empresas en Chile con más de 20 años de trayectoria.
          </h2>
          <p className="apple-lead text-[#7a7a7a] text-base sm:text-lg max-w-2xl mx-auto">
            Combinamos tecnología de grado industrial con operadores capacitados las 24 horas del día,
            garantizando estándares de alta seguridad enterprise.
          </p>
        </motion.div>

        {/* Pillars Grid (Light Museum Cards) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-24"
        >
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="apple-card-light p-6 text-center flex flex-col justify-center"
            >
              <div className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight font-sans mb-1">
                {p.n}
              </div>
              <div className="text-sm font-semibold text-[#1d1d1f] mb-0.5">
                {p.label}
              </div>
              <div className="text-xs text-[#7a7a7a]">
                {p.sub}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Editorial Text + Timeline */}
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Institutional Narrative */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            <h3 className="apple-display-md text-[#1d1d1f]">
              Respuesta humana experta respaldada por tecnología de vanguardia.
            </h3>
            
            <p className="text-[#1d1d1f]/80 text-base leading-relaxed">
              En GAMA Security operamos una central propia redundante con enlaces de comunicación
              múltiples (IP, GPRS, Celular). Cada señal recibida activa un protocolo de verificación
              en menos de 120 segundos.
            </p>

            <p className="text-[#1d1d1f]/80 text-base leading-relaxed">
              Utilizamos una tecnología de gestión de monitoreo avanzada que nos permite gestionar
              miles de señales con zonificación precisa y trazabilidad total de cada evento registrado.
            </p>

            {/* Badges */}
            <div className="pt-4 flex flex-wrap gap-3">
              {[
                { label: 'Alta Seguridad Enterprise', sub: 'Estándar Industrial' },
                { label: 'Tecnología Redundante', sub: 'Servicio Continuo 24/7' },
                { label: '+20 Años', sub: 'Experiencia Nacional' },
              ].map((b) => (
                <div
                  key={b.label}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm text-left"
                >
                  <div className="text-xs font-semibold text-[#1d1d1f]">
                    {b.label}
                  </div>
                  <div className="text-[11px] text-[#7a7a7a]">
                    {b.sub}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Clean Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 text-left"
          >
            <h4 className="text-xs font-semibold text-[#7a7a7a] uppercase tracking-widest mb-8">
              HISTORIA Y TRAYECTORIA
            </h4>

            <div className="relative pl-6 space-y-8 border-l-2 border-slate-300">
              {TIMELINE.map((item) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="relative group"
                >
                  {/* Dot */}
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#0066cc] border-2 border-[#f5f5f7]" />
                  
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[#0066cc] font-mono font-bold text-sm">
                      {item.year}
                    </span>
                    <span className="text-[#1d1d1f] font-semibold text-base">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[#7a7a7a] text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
