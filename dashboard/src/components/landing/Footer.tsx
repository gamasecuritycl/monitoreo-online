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
            1. <strong>Certificación Oficial OS-10:</strong> GAMA SERVICIOS se encuentra acreditada por la Prefectura de Seguridad Privada OS-10 de Carabineros de Chile para prestar servicios de monitoreo electrónico y seguridad perimetral a nivel nacional.
          </p>
          <p>
            2. <strong>Plataforma Scorpion:</strong> La recepción y verificación de eventos opera de forma continua mediante la plataforma de monitoreo Scorpion (v3.5), garantizando trazabilidad y registro auditado de cada señal procesada.
          </p>
          <p>
            3. <strong>Tiempos de Respuesta:</strong> Los tiempos indicados correspondes a la verificación promedio de señal crítica en la central de operaciones 24/7. El tiempo de llegada física de unidades policiales o de apoyo depende de la factibilidad geográfica y disponibilidad de las fuerzas del orden público.
          </p>
        </div>

        {/* ── Tier 2: Categorized Navigation Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
          
          {/* Column 1: Brand & Emergency Contacts */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7">
                <Image
                  src="/logo-gama.png"
                  alt="GAMA Servicios"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-[#1d1d1f] text-sm">
                GAMA SERVICIOS
              </span>
            </div>

            <div className="space-y-2 pt-1 text-slate-600">
              <div className="font-medium text-[#1d1d1f]">
                Atención y Emergencias 24/7:
              </div>
              <div>
                Teléfono: <a href="tel:323276011" className="text-[#0066cc] font-semibold hover:underline">323-276-011</a>
              </div>
              <div>
                WhatsApp: <a href="https://wa.me/56948855190" target="_blank" rel="noopener noreferrer" className="text-[#0066cc] font-semibold hover:underline">+56 9 4885 5190</a>
              </div>
              <div>
                Email: <a href="mailto:contacto@gamaservicios.cl" className="text-[#0066cc] hover:underline">contacto@gamaservicios.cl</a>
              </div>
            </div>
          </div>

          {/* Column 2: Servicios */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase">
              Servicios
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors">
                  Monitoreo Central 24/7
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors">
                  Cámaras 4K con IA
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors">
                  Cercos Eléctricos
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors">
                  Sistemas de Alarma
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('servicios')} className="hover:text-[#0066cc] transition-colors">
                  Detección de Incendio
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Empresa */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase">
              Empresa
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollTo('quienes-somos')} className="hover:text-[#0066cc] transition-colors">
                  Quiénes Somos
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('quienes-somos')} className="hover:text-[#0066cc] transition-colors">
                  Certificación OS-10
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('tecnologia')} className="hover:text-[#0066cc] transition-colors">
                  Plataforma Scorpion
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('contacto')} className="hover:text-[#0066cc] transition-colors">
                  Solicitar Cotización
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Acceso Clientes */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase">
              Plataforma
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/operacion" className="text-[#0066cc] font-semibold hover:underline">
                  Acceso Operadores Scorpion →
                </Link>
              </li>
              <li>
                <button onClick={() => scrollTo('contacto')} className="hover:text-[#0066cc] transition-colors">
                  Soporte Técnico
                </button>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Central Operativa OK
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Tier 3: Bottom Copyright & Legal ── */}
        <div className="pt-8 border-t border-slate-300/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#7a7a7a]">
          <div>
            Copyright © {new Date().getFullYear()} GAMA SERVICIOS SpA. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6">
            <span>Santiago, Chile</span>
            <span>·</span>
            <span>Normativa OS-10 Carabineros</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
