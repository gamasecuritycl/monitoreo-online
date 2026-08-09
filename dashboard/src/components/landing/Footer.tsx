'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="tile-parchment text-[#7a7a7a] text-xs pt-16 pb-12 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* ── Tier 1: Micro-Legal & Fine Print (Apple Fine Print Style) ── */}
        <div className="space-y-3 pb-8 border-b border-slate-300/60 text-[11px] leading-relaxed text-[#7a7a7a] text-left">
          <p>
            1. <strong>GAMA Security:</strong> Empresa líder con más de 20 años de experiencia en monitoreo electrónico perimetral, Alarma Inteligente Vetti con App NT CLICK y protección patrimonial a nivel nacional.
          </p>
          <p>
            2. <strong>Central de Operaciones Redundante:</strong> La recepción y verificación de eventos opera de forma continua las 24 horas del día, garantizando trazabilidad y registro auditado de cada señal procesada.
          </p>
          <p>
            3. <strong>Tiempos de Respuesta:</strong> Los tiempos indicados corresponden a la verificación promedio de señal crítica en nuestro centro de control en menos de 120 segundos.
          </p>
        </div>

        {/* ── Tier 2: Categorized Navigation Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
          
          {/* Column 1: Brand & Direct Contact (Direct WhatsApp Action) */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7">
                <Image
                  src="/logo-gama.png"
                  alt="GAMA Security"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-[#1d1d1f] text-sm">
                GAMA SECURITY
              </span>
            </div>

            <div className="space-y-2.5 pt-1 text-slate-600">
              <div className="font-medium text-[#1d1d1f]">
                Atención Inmediata 24/7:
              </div>
              <div>
                <a
                  href="https://wa.me/56991016912"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white font-medium text-xs shadow-sm hover:opacity-90 transition-opacity"
                >
                  Contactar por WhatsApp →
                </a>
              </div>
              <div className="pt-1">
                Correo:{' '}
                <a
                  href="mailto:contacto@gamasecurity.cl"
                  className="text-[#0066cc] font-semibold hover:underline"
                >
                  contacto@gamasecurity.cl
                </a>
              </div>
              <div>
                Sitio Web:{' '}
                <a
                  href="https://www.gamasecurity.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0066cc] hover:underline font-medium"
                >
                  www.gamasecurity.cl
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Productos y Servicios (Funcionales) */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase">
              Productos y Servicios
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors text-left text-semibold text-[#0066cc]">
                  ★ Alarma Vetti & App NT CLICK
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors text-left">
                  Monitoreo Central 24/7
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors text-left">
                  Teclados LCD DSC PK5501
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors text-left">
                  Cámaras 4K con IA
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors text-left">
                  Cercos Eléctricos
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors text-left">
                  Detección de Incendio
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Empresa (Funcionales) */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase">
              Empresa
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollTo('quienes-somos')} className="hover:text-[#0066cc] transition-colors text-left">
                  Quiénes Somos (+20 Años)
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('tecnologia')} className="hover:text-[#0066cc] transition-colors text-left">
                  Tecnología y Equipos
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('contacto')} className="hover:text-[#0066cc] transition-colors text-left">
                  Solicitar Cotización
                </button>
              </li>
              <li>
                <a
                  href="https://apps.apple.com/ar/app/nt-click/id1440514183"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#0066cc] transition-colors text-left block"
                >
                  App NT CLICK (iOS App Store)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Acceso Plataforma (Funcionales) */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase">
              Plataforma
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/operacion" className="text-[#0066cc] font-semibold hover:underline">
                  Acceso Operadores →
                </Link>
              </li>
              <li>
                <button onClick={() => scrollTo('contacto')} className="hover:text-[#0066cc] transition-colors text-left">
                  Soporte Técnico
                </button>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" /> Central Operativa OK
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Tier 3: Bottom Copyright & Legal ── */}
        <div className="pt-8 border-t border-slate-300/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#7a7a7a]">
          <div>
            Copyright © {new Date().getFullYear()} GAMA SECURITY (<a href="https://www.gamasecurity.cl" className="hover:underline text-[#0066cc]">www.gamasecurity.cl</a>). Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6">
            <span>Chile</span>
            <span>·</span>
            <span>Estándar de Alta Seguridad Enterprise</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
