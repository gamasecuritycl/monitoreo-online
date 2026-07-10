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

function isOficinaAbierta() {
  const now = new Date()
  const hora = now.getHours()
  const dia = now.getDay() // 0=dom, 6=sab
  return dia >= 1 && dia <= 5 && hora >= 9 && hora < 18
}

const INPUT_BASE = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-sky-500/50 focus:bg-white/[0.06] transition-all duration-200'

export default function Contacto() {
  const leftRef = useReveal()
  const rightRef = useReveal()
  const [abierta] = useState(isOficinaAbierta())
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setTimeout(() => { setSending(false); setSent(true) }, 1800)
  }

  const CONTACTOS = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      color: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
      title: 'Teléfono Central',
      value: '+56 2 2345 6789',
      sub: 'Monitoreo 24/7',
      href: 'tel:+56223456789',
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: 'text-green-400 bg-green-400/10 border-green-400/20',
      title: 'WhatsApp',
      value: '+56 9 8765 4321',
      sub: 'Respuesta rápida',
      href: 'https://wa.me/56987654321?text=Hola%20GAMA%20Seguridad%2C%20quisiera%20información.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      title: 'Email',
      value: 'contacto@gamaseguridad.cl',
      sub: 'Respuesta en 24h',
      href: 'mailto:contacto@gamaseguridad.cl',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      title: 'Oficina',
      value: 'Av. Providencia 1420, Of. 602',
      sub: 'Santiago, Chile',
      href: 'https://maps.google.com/?q=Av+Providencia+1420+Santiago',
    },
  ]

  return (
    <section id="contacto" className="relative py-28 sm:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050810] via-[#080d1a] to-[#050810]" />
      <div className="absolute top-0 left-0 right-0 h-px section-divider" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="reveal text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-400/8 border border-sky-400/15 text-sky-400 text-xs font-mono tracking-widest uppercase mb-5">
            Contacto
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
            Hablemos de tu{' '}
            <span className="gradient-text-blue">seguridad</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            Solicita una cotización sin compromiso. Te contactamos en menos de 24 horas.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Left: Contact info */}
          <div ref={leftRef} className="reveal-left space-y-4">
            {/* Office hours indicator */}
            <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold mb-2 ${abierta ? 'bg-green-400/8 border-green-400/20 text-green-400' : 'bg-red-400/8 border-red-400/20 text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${abierta ? 'bg-green-400 animate-pulse-live' : 'bg-red-400'}`} />
              Oficina {abierta ? 'abierta ahora' : 'cerrada ahora'}
              <span className="text-gray-500 font-normal text-xs">· Lun-Vie 09:00-18:00</span>
            </div>

            {/* Emergency card */}
            <div className="p-5 bg-red-500/8 border border-red-400/20 rounded-2xl flex items-center gap-4 hover:border-red-400/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-red-400/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <div className="text-red-400 font-bold text-sm">Emergencia de Seguridad</div>
                <div className="text-white font-black text-xl">+56 2 2345 6789</div>
                <div className="text-gray-400 text-xs">Central operativa 24/7</div>
              </div>
            </div>

            {/* Contact cards */}
            {CONTACTOS.map(c => (
              <a
                key={c.title}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-5 glass-card glass-card-hover rounded-2xl border border-white/[0.05] transition-all duration-300 hover:-translate-y-0.5 group"
              >
                <div className={`p-2.5 rounded-xl border ${c.color} flex-shrink-0`}>
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-gray-400 text-xs mb-0.5">{c.title}</div>
                  <div className="text-white font-semibold text-sm truncate group-hover:text-sky-300 transition-colors">{c.value}</div>
                  <div className="text-gray-600 text-xs">{c.sub}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Right: Form */}
          <div ref={rightRef} className="reveal-right">
            <div className="glass-card border border-white/[0.07] rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/30">
              <h3 className="text-white font-bold text-xl mb-7">Solicitar Cotización</h3>

              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-400/15 border border-green-400/30 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-white font-bold text-lg mb-2">¡Mensaje enviado!</h4>
                  <p className="text-gray-400 text-sm">Te contactaremos en menos de 24 horas.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Nombre completo"
                      required
                      className={INPUT_BASE}
                    />
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="Correo electrónico"
                      required
                      className={INPUT_BASE}
                    />
                  </div>
                  <input
                    id="contact-phone"
                    type="tel"
                    placeholder="Teléfono / WhatsApp"
                    className={INPUT_BASE}
                  />
                  <select
                    id="contact-service"
                    required
                    className={`${INPUT_BASE} text-gray-400`}
                    defaultValue=""
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <option value="" disabled>Tipo de servicio que necesitas</option>
                    <option value="monitoreo">Monitoreo 24/7</option>
                    <option value="cerco">Cerco Eléctrico</option>
                    <option value="cctv">Cámaras de Vigilancia</option>
                    <option value="alarma">Sistema de Alarma</option>
                    <option value="acceso">Control de Acceso</option>
                    <option value="incendio">Detección de Incendio</option>
                    <option value="combo">Paquete completo</option>
                    <option value="otro">Otro</option>
                  </select>
                  <textarea
                    id="contact-message"
                    rows={4}
                    placeholder="Cuéntanos sobre tu propiedad o empresa y lo que necesitas proteger..."
                    className={`${INPUT_BASE} resize-none`}
                  />

                  <button
                    id="contact-submit"
                    type="submit"
                    disabled={sending}
                    className="w-full btn-3d-glow bg-gradient-to-r from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2.5"
                  >
                    {sending ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Enviar Solicitud
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-600">
                    Sin compromiso · Respuesta en menos de 24 horas
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
