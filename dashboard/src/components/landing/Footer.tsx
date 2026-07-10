'use client'

import Link from 'next/link'

const SERVICIOS_LINKS = [
  'Monitoreo 24/7',
  'Cercos Eléctricos',
  'Cámaras de Vigilancia',
  'Sistemas de Alarma',
  'Control de Acceso',
  'Detección de Incendio',
]

const NAV_LINKS = [
  { label: 'Inicio', id: 'inicio' },
  { label: 'Quiénes Somos', id: 'quienes-somos' },
  { label: 'Servicios', id: 'servicios' },
  { label: 'Tecnología', id: 'tecnologia' },
  { label: 'Clientes', id: 'clientes' },
  { label: 'Contacto', id: 'contacto' },
]

const SOCIAL = [
  {
    name: 'Facebook',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
]

const CERTS = [
  { label: 'OS-10', sub: 'Carabineros de Chile' },
  { label: 'Scorpion', sub: 'Platform Certified' },
  { label: 'ISO 9001', sub: 'Calidad' },
]

export default function Footer() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="relative border-t border-white/[0.05] bg-[#030608]">
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-px section-divider" />

      {/* CTA Banner */}
      <div className="border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="relative overflow-hidden bg-gradient-to-br from-sky-500/10 via-blue-600/8 to-purple-600/10 border border-sky-500/15 rounded-2xl px-8 py-10 sm:py-12">
            {/* Background grid */}
            <div className="absolute inset-0 tech-grid opacity-30 rounded-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                  ¿Listo para proteger lo que más importa?
                </h3>
                <p className="text-gray-400 text-sm">
                  Cotiza gratis ahora. Sin compromiso, respuesta en menos de 24 horas.
                </p>
              </div>
              <button
                onClick={() => scrollTo('contacto')}
                className="btn-3d-glow flex-shrink-0 bg-gradient-to-b from-sky-500 to-sky-700 text-white font-bold px-8 py-4 rounded-xl text-sm whitespace-nowrap shadow-xl shadow-sky-600/25 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Solicitar Cotización Gratis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9">
                <svg viewBox="0 0 40 40" fill="none">
                  <path d="M20 2L4 9v12c0 8.4 6.8 16.3 16 18 9.2-1.7 16-9.6 16-18V9L20 2z" fill="url(#fg-grad)" stroke="rgba(14,165,233,0.4)" strokeWidth="1"/>
                  <path d="M13 20l4 4 10-10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="fg-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.7"/>
                      <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.9"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <div className="text-white font-black text-base">GAMA <span className="text-sky-400">SEGURIDAD</span></div>
                <div className="text-[10px] text-gray-500 font-mono">Monitoreo electrónico 24/7</div>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Empresa chilena especializada en monitoreo electrónico y protección patrimonial.
              Tecnología de punta con cobertura nacional desde 2010.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {SOCIAL.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-500 hover:text-sky-400 hover:border-sky-400/20 hover:bg-sky-400/5 transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h5 className="text-white text-xs font-semibold mb-5 uppercase tracking-widest">Servicios</h5>
            <ul className="space-y-2.5">
              {SERVICIOS_LINKS.map(item => (
                <li key={item}>
                  <button
                    onClick={() => scrollTo('servicios')}
                    className="text-gray-500 hover:text-gray-200 text-sm transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-sky-400 transition-colors" />
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h5 className="text-white text-xs font-semibold mb-5 uppercase tracking-widest">Navegación</h5>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(item => (
                <li key={item.id}>
                  {item.id === 'clientes' ? (
                    <Link href="/app" className="text-gray-500 hover:text-gray-200 text-sm transition-colors duration-200 flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-sky-400 transition-colors" />
                      Acceso Personal
                    </Link>
                  ) : (
                    <button
                      onClick={() => scrollTo(item.id)}
                      className="text-gray-500 hover:text-gray-200 text-sm transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-sky-400 transition-colors" />
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Certs */}
          <div>
            <h5 className="text-white text-xs font-semibold mb-5 uppercase tracking-widest">Contacto</h5>
            <ul className="space-y-3 text-gray-500 text-sm mb-8">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +56 2 2345 6789
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contacto@gamaseguridad.cl
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Av. Providencia 1420, Of. 602, Santiago
              </li>
            </ul>
            {/* Certifications */}
            <div>
              <div className="text-xs text-gray-600 font-mono uppercase tracking-widest mb-3">Certificaciones</div>
              <div className="space-y-2">
                {CERTS.map(c => (
                  <div key={c.label} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white text-xs font-semibold">{c.label}</span>
                    <span className="text-gray-600 text-xs">· {c.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} GAMA Seguridad. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-live" />
              Monitoreo activo 24/7
            </span>
            <span className="text-gray-700 text-xs">·</span>
            <span className="text-gray-700 text-xs">Certificado OS-10 · Carabineros de Chile</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
