'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, Send, Mail, Phone, ExternalLink } from 'lucide-react'

function isOficinaAbierta() {
  const now = new Date()
  const h = now.getHours()
  const d = now.getDay()
  return d >= 1 && d <= 5 && h >= 9 && h < 18
}

const INPUT_STYLE = 'w-full bg-[#fafafc] border border-slate-200 rounded-xl px-4 py-3 text-[#1d1d1f] text-sm placeholder-slate-400 focus:outline-none focus:border-[#0066cc] focus:bg-white transition-all duration-200 shadow-sm'

export default function Contacto() {
  const abierta = isOficinaAbierta()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errorMessage) setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage('Por favor completa los campos obligatorios (*)')
      return
    }

    setSending(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/contacto-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar la solicitud. Intenta nuevamente.')
      }

      setSent(true)
    } catch (err: any) {
      console.error('Error al enviar formulario:', err)
      setErrorMessage(err?.message || 'No fue posible enviar la solicitud. Por favor intenta por WhatsApp.')
    } finally {
      setSending(false)
    }
  }

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/56991016912?text=Hola%20GAMA%20Seguridad,%20quisiera%20solicitar%20una%20cotizaci%C3%B3n.', '_blank', 'noopener,noreferrer')
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
            Cotización rápida y transparente sin compromiso. Nuestro equipo responderá a tu solicitud con una propuesta a tu medida.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Action Buttons */}
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
                className="w-full apple-card-light p-6 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-green-50 to-emerald-50/40 border-green-200 text-left cursor-pointer group shadow-sm hover:shadow-md"
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
                className="apple-card-light p-5 flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5 group text-left shadow-sm hover:shadow"
              >
                <div className="p-3 rounded-xl bg-slate-100 flex-shrink-0 text-[#0066cc]">
                  <Mail className="w-5 h-5" />
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
                className="apple-card-light p-5 flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5 group text-left shadow-sm hover:shadow"
              >
                <div className="p-3 rounded-xl bg-slate-100 flex-shrink-0 text-[#0066cc]">
                  <ExternalLink className="w-5 h-5" />
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

          {/* Right Column: Form with Resend */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="apple-card-light p-8 sm:p-10 text-left border border-slate-200/80 shadow-lg relative overflow-hidden">
              <h3 className="apple-display-md text-[#1d1d1f] text-2xl mb-2">
                Solicitar Cotización por Formulario
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-sans">
                Completa tus datos y recibirás un correo de confirmación de inmediato.
              </p>

              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="sent-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-10 space-y-5"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[#1d1d1f] font-bold text-2xl tracking-tight">
                        ¡Solicitud Recibida con Éxito!
                      </h4>
                      <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                        Hemos enviado un correo de confirmación a <strong className="text-blue-700 font-semibold">{formData.email}</strong>. 
                        Un especialista en seguridad de <strong>GAMA Seguridad</strong> revisará tus requerimientos y te contactará a la brevedad.
                      </p>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSent(false)
                          setFormData({ name: '', email: '', phone: '', service: '', message: '' })
                        }}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        Enviar otra solicitud
                      </button>
                      <button
                        type="button"
                        onClick={handleWhatsAppClick}
                        className="px-5 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>Conversar por WhatsApp ahora</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMessage && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                          Nombre completo *
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Ej. Juan Pérez"
                          required
                          disabled={sending}
                          className={INPUT_STYLE}
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                          Correo electrónico *
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="ejemplo@correo.cl"
                          required
                          disabled={sending}
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
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+56 9 1234 5678"
                          disabled={sending}
                          className={INPUT_STYLE}
                        />
                      </div>
                      <div>
                        <label htmlFor="service" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                          Servicio requerido *
                        </label>
                        <select
                          id="service"
                          name="service"
                          required
                          value={formData.service}
                          onChange={handleChange}
                          disabled={sending}
                          className={`${INPUT_STYLE} text-[#1d1d1f]`}
                        >
                          <option value="" disabled>Selecciona una opción</option>
                          <option value="vetti">Alarma Inteligente Vetti & App CLICK</option>
                          <option value="monitoreo">Monitoreo Central 24/7 con IA</option>
                          <option value="camaras">Cámaras 4K con IA</option>
                          <option value="cercos">Cercos Eléctricos Perimetrales</option>
                          <option value="dsc">Teclados y Alarmas DSC PK5501</option>
                          <option value="prevencion">Prevención de Robo GAMA</option>
                          <option value="incendio">Detección Temprana de Incendio</option>
                          <option value="general">Cotización Integral de Seguridad</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                        Detalles de tu propiedad o requerimientos
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Cuéntanos brevemente ubicación, tipo de inmueble (casa, oficina, bodega) o requerimientos específicos..."
                        disabled={sending}
                        className={`${INPUT_STYLE} resize-none`}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={sending}
                        className="btn-apple-primary w-full justify-center text-base py-3.5 disabled:opacity-60 cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Enviando cotización por Resend...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Solicitar Cotización Oficial →</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-center text-[11px] text-[#7a7a7a] pt-1 font-sans">
                      🔒 Datos protegidos bajo estricta confidencialidad · Respuesta en minutos
                    </p>
                  </form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
