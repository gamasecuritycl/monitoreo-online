'use client'

import { motion } from 'framer-motion'

const PILLARS = [
  {
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    title: 'Respuesta < 2 min',
    desc: 'Protocolo activado en menos de 2 minutos ante cualquier señal de alarma. Operadores entrenados disponibles 24/7.',
    color: '#f97316',
  },
  {
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    title: 'Certificados OS-10',
    desc: 'Habilitados por Carabineros de Chile. Cumplimos todos los estándares exigidos por la normativa de seguridad privada.',
    color: '#22c55e',
  },
  {
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>,
    title: 'Sistema redundante',
    desc: 'Central con sistemas de energía y comunicación redundantes. 99.9% uptime garantizado con monitoreo ininterrumpido.',
    color: '#3b82f6',
  },
  {
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>,
    title: 'Multi-canal',
    desc: 'Notificaciones por WhatsApp, SMS, llamada y email. Tú decides cómo y cuándo quieres ser notificado.',
    color: '#a855f7',
  },
]

const TABLE = [
  { item: 'Monitoreo 24/7/365',     gama: true, otro: false },
  { item: 'Plataforma Scorpion',    gama: true, otro: false },
  { item: 'Certificación OS-10',    gama: true, otro: false },
  { item: 'Respuesta < 2 min',      gama: true, otro: false },
  { item: 'Notificación WhatsApp',  gama: true, otro: false },
  { item: 'Soporte técnico 24/7',   gama: true, otro: false },
  { item: 'Mantención preventiva',  gama: true, otro: false },
]

export default function PorQueNosotros() {
  return (
    <section id="por-que-nosotros" className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1a] via-[#0a1628] to-[#050d1a]" />
      <div className="absolute top-0 left-0 right-0 h-px section-divider" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[#1e3a5f]/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="section-label mb-5 inline-flex">¿Por qué elegirnos?</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mt-5 mb-5">
            La diferencia{' '}
            <span className="text-gradient-orange">GAMA SERVICIOS</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            No todas las empresas de seguridad son iguales. Estos son los estándares
            que nos distinguen en el mercado chileno.
          </p>
        </motion.div>

        {/* Pillars */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="enterprise-card p-6 text-center"
            >
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border"
                style={{ color: p.color, background: `${p.color}15`, borderColor: `${p.color}30` }}
              >
                {p.icon}
              </div>
              <h3 className="text-white font-bold mb-2">{p.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <h3 className="text-center text-white font-bold text-xl mb-8">GAMA vs. otras empresas</h3>
          <div className="enterprise-card overflow-hidden">
            <div className="grid grid-cols-3 bg-[#060d1a] border-b border-[#1e3a5f] px-6 py-3.5">
              <div className="text-slate-500 text-xs font-mono uppercase">Característica</div>
              <div className="text-center text-orange-400 text-xs font-bold uppercase font-mono">GAMA</div>
              <div className="text-center text-slate-600 text-xs font-mono uppercase">Otros</div>
            </div>
            {TABLE.map((row, i) => (
              <div
                key={row.item}
                className={`grid grid-cols-3 px-6 py-4 border-b border-[#1e3a5f]/40 ${i % 2 === 0 ? 'bg-[#0f2240]/30' : ''}`}
              >
                <div className="text-slate-400 text-sm">{row.item}</div>
                <div className="flex justify-center">
                  {row.gama
                    ? <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  }
                </div>
                <div className="flex justify-center">
                  {row.otro
                    ? <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  }
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
