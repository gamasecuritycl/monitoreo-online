'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

function isOficinaAbierta() {
  const now = new Date()
  const h = now.getHours()
  const d = now.getDay()
  return d >= 1 && d <= 5 && h >= 9 && h < 18
}

const INPUT_STYLE = 'w-full bg-[#fafafc] border border-slate-200 rounded-xl px-4 py-3 text-[#1d1d1f] text-sm placeholder-slate-400 focus:outline-none focus:border-[#0066cc] focus:bg-white transition-all duration-200'

export default function Contacto() {
  const abierta = isOficinaAbierta()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    const name = (document.getElementById('name') as HTMLInputElement)?.value || ''
    const email = (document.getElementById('email') as HTMLInputElement)?.value || ''
    const phone = (document.getElementById('phone') as HTMLInputElement)?.value || ''
    const service = (document.getElementById('service') as HTMLSelectElement)?.value || ''
    const message = (document.getElementById('message') as HTMLTextAreaElement)?.value || ''

    const subject = encodeURIComponent(`Cotización GAMA Security: ${service} - ${name}`)
    const body = encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\nTeléfono: ${phone}\nServicio: ${service}\nMensaje: ${message}`)
    
    setTimeout(() => {
      setSending(false)
      setSent(true)
      window.location.href = `mailto:contacto@gamasecurity.cl?subject=${subject}&body=${body}`
    }, 1200)
  }

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/56991016912', '_blank', 'noopener,noreferrer')
  }

  return (
    <section id="contacto" className="relative py-24 sm:py-32 tile-white text-[#1d1d1f] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20 space-y-3"
        >
          <span className="text-xs font-semibold text-[#0066cc] uppercase tracking-widest font-sans">
            CANALES DE ATENCIÓN DIRECTA
          </span>
          <h2 className="apple-display-lg text-[#1d1d1f]">
            Hablemos sobre tus necesidades de seguridad.
          </h2>
          <p className="apple-lead text-[#7a7a7a] text-base sm:text-lg max-w-xl mx-auto">
            Cotización rápida y transparente sin compromiso. Comunícate por WhatsApp o envíanos un correo a contacto@gamasecurity.cl.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Action Buttons (No raw phone text) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-4 text-left"
          >
            {/* Status indicator */}
            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-semibold ${
              abierta ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${abierta ? 'bg-green-500 animate-pulse' : 'bg-[#0066cc]'}`} />
              Central {abierta ? 'activa y atendiendo' : 'en monitoreo 24/7'}
            </div>

            <div className="space-y-4 pt-2">
              {/* WhatsApp Main Card Button */}
              <button
                onClick={handleWhatsAppClick}
                className="w-full apple-card-light p-6 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-green-50 to-emerald-50/40 border-green-200 text-left cursor-pointer group"
              >
                <div className="p-3.5 rounded-2xl bg-[#25D366] text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-green-700 font-sans uppercase tracking-wider">
                    ATENCIÓN EN VIVO
                  </div>
                  <div className="text-[#1d1d1f] font-bold text-lg group-hover:text-green-600 transition-colors">
                    Contactar por WhatsApp →
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Respuesta inmediata con un ejecutivo de seguridad
                  </div>
                </div>
              </button>

              {/* Email Card Button */}
              <a
                href="mailto:contacto@gamasecurity.cl"
                className="apple-card-light p-5 flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5 group text-left"
              >
                <div className="p-3 rounded-xl bg-slate-100 flex-shrink-0 text-[#0066cc]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-[#7a7a7a] font-sans">
                    Correo Oficial de Contacto
                  </div>
                  <div className="text-[#1d1d1f] font-semibold text-base group-hover:text-[#0066cc] transition-colors">
                    contacto@gamasecurity.cl
                  </div>
                </div>
              </a>

              {/* Website Link */}
              <a
                href="https://www.gamasecurity.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="apple-card-light p-5 flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5 group text-left"
              >
                <div className="p-3 rounded-xl bg-slate-100 flex-shrink-0 text-[#0066cc]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-[#7a7a7a] font-sans">
                    Sitio Web Oficial
                  </div>
                  <div className="text-[#1d1d1f] font-semibold text-base group-hover:text-[#0066cc] transition-colors">
                    www.gamasecurity.cl
                  </div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Right Column: Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="apple-card-light p-8 sm:p-10 text-left">
              <h3 className="apple-display-md text-[#1d1d1f] text-2xl mb-6">
                Solicitar Cotización por Formulario
              </h3>

              {sent ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-[#1d1d1f] font-bold text-xl">
                    ¡Solicitud Lista para Envío!
                  </h4>
                  <p className="text-[#7a7a7a] text-sm max-w-sm mx-auto">
                    Se abrirá tu cliente de correo para enviar a <strong>contacto@gamasecurity.cl</strong>. También puedes escribirnos por WhatsApp.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                        Nombre completo *
                      </label>
                      <input
                        id="name"
                        type="text"
                        placeholder="Ej. Juan Pérez"
                        required
                        className={INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                        Correo electrónico *
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="ejemplo@correo.cl"
                        required
                        className={INPUT_STYLE}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                        Teléfono de contacto
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+56 9 1234 5678"
                        className={INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <label htmlFor="service" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                        Servicio requerido *
                      </label>
                      <select
                        id="service"
                        required
                        defaultValue=""
                        className={`${INPUT_STYLE} text-[#1d1d1f]`}
                      >
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="vetti">Alarma Inteligente Vetti & App CLICK</option>
                        <option value="monitoreo">Monitoreo Central 24/7</option>
                        <option value="camaras">Cámaras 4K con IA</option>
                        <option value="cercos">Cercos Eléctricos</option>
                        <option value="dsc">Teclados y Alarmas DSC PK5501</option>
                        <option value="prevencion">Prevención de Robo GAMA</option>
                        <option value="incendio">Detección de Incendio</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                      Detalles de tu propiedad o empresa
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      placeholder="Cuéntanos brevemente ubicación, tipo de propiedad o requisitos específicos..."
                      className={`${INPUT_STYLE} resize-none`}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={sending}
                      className="btn-apple-primary w-full justify-center text-base py-3 disabled:opacity-50"
                    >
                      {sending ? 'Enviando solicitud...' : 'Enviar Solicitud a contacto@gamasecurity.cl →'}
                    </button>
                  </div>

                  <p className="text-center text-xs text-[#7a7a7a] pt-2">
                    Sin compromisos comerciales · Respuesta garantizada
                  </p>
                </form>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
