'use client'

import Image from 'next/image'

export default function Footer() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const SERVICES = ['Monitoreo 24/7', 'Cercos Eléctricos', 'Cámaras CCTV', 'Sistemas de Alarma', 'Control de Acceso', 'Detección de Incendio']
  const LINKS = [
    { label: 'Inicio', id: 'inicio' },
    { label: 'Servicios', id: 'servicios' },
    { label: 'Nosotros', id: 'quienes-somos' },
    { label: 'Tecnología', id: 'tecnologia' },
    { label: 'Contacto', id: 'contacto' },
  ]

  return (
    <footer className="relative border-t border-[#1e3a5f]/60 bg-[#050d1a]">

      {/* CTA Banner */}
      <div className="border-b border-[#1e3a5f]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="relative bg-gradient-to-br from-[#0f2240] to-[#0a1628] border border-orange-500/15 rounded-2xl px-8 py-10 overflow-hidden">
            <div className="absolute inset-0 tech-grid opacity-20 rounded-2xl" />
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-orange-500/5 blur-[60px] rounded-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-1">
                  ¿Listo para proteger lo que importa?
                </h3>
                <p className="text-slate-400 text-sm">Cotiza gratis. Sin compromiso.</p>
              </div>
              <button
                onClick={() => scrollTo('contacto')}
                className="btn-primary flex-shrink-0 whitespace-nowrap"
              >
                Solicitar Cotización Gratis →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <Image src="/logo-CASAS.png" alt="Gama Servicios" width={44} height={44} className="object-contain" />
              <div>
                <div className="text-white font-black text-base">GAMA <span className="text-orange-400">SERVICIOS</span></div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Monitoreo electrónico 24/7</div>
              </div>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-xs">
              Empresa chilena especializada en monitoreo electrónico y protección patrimonial.
              Certificados OS-10 por Carabineros de Chile desde 2013.
            </p>
            {/* Emergency number */}
            <a
              href="tel:323276011"
              className="inline-flex items-center gap-2 bg-[#0f2240] border border-[#1e3a5f] hover:border-orange-500/30 rounded-xl px-4 py-3 transition-all duration-200 group"
            >
              <div className="live-dot" />
              <div>
                <div className="text-[9px] text-slate-500 font-mono">EMERGENCIAS 24/7</div>
                <div className="text-white font-black font-mono">323-276-011</div>
              </div>
            </a>
          </div>

          {/* Services */}
          <div>
            <h5 className="text-white text-xs font-bold mb-5 uppercase tracking-widest">Servicios</h5>
            <ul className="space-y-2.5">
              {SERVICES.map(s => (
                <li key={s}>
                  <button
                    onClick={() => scrollTo('servicios')}
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-orange-500 transition-colors" />
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h5 className="text-white text-xs font-bold mb-5 uppercase tracking-widest">Navegación</h5>
            <ul className="space-y-2.5">
              {LINKS.map(l => (
                <li key={l.id}>
                  <button
                    onClick={() => scrollTo(l.id)}
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-orange-500 transition-colors" />
                    {l.label}
                  </button>
                </li>
              ))}
              <li>
                <a href="/app" className="text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-orange-500 transition-colors" />
                  Acceso Personal
                </a>
              </li>
            </ul>
          </div>

          {/* Certifications */}
          <div>
            <h5 className="text-white text-xs font-bold mb-5 uppercase tracking-widest">Certificaciones</h5>
            <div className="space-y-2.5">
              {[
                { l: 'OS-10', s: 'Carabineros de Chile' },
                { l: 'Scorpion', s: 'Platform Certified' },
                { l: 'ISO 9001', s: 'Gestión de calidad' },
              ].map(c => (
                <div key={c.l} className="flex items-center gap-2 bg-[#0f2240] border border-[#1e3a5f] rounded-lg px-3 py-2">
                  <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <div className="text-white text-xs font-bold">{c.l}</div>
                    <div className="text-slate-600 text-[10px]">{c.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-[#1e3a5f]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} GAMA SERVICIOS. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-700 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-live" />
              Monitoreo activo 24/7
            </span>
            <span className="text-slate-700 text-xs hidden sm:inline">·</span>
            <span className="text-slate-700 text-xs hidden sm:inline">Certificado OS-10</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
