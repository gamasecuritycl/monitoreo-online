'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, Lock } from 'lucide-react'
import { PestañaLegal } from './ModalLegalPublico'

export interface FooterLink {
  label: string
  href: string
}

interface FooterProps {
  onOpenLegal?: (pestaña: PestañaLegal) => void
  servicios: FooterLink[]
  comunas: FooterLink[]
  articulos: FooterLink[]
}

export default function Footer({ onOpenLegal, servicios, comunas, articulos }: FooterProps) {
  const handleOpenLegal = (pestaña: PestañaLegal) => {
    if (onOpenLegal) {
      onOpenLegal(pestaña)
    }
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
            2. <strong>Central de Operaciones Redundante:</strong> La recepción y verificación de eventos opera de forma continua las 24 horas del día, garantizando trazabilidad y registro auditado de cada señal procesada conforme a los estándares de Carabineros de Chile (OS-10).
          </p>
          <p>
            3. <strong>Protección de Datos Personales (Ley N° 21.719):</strong> Gama Seguridad SpA garantiza la confidencialidad, licitud y seguridad de la información de sus prospectos y abonados, asegurando el ejercicio gratuito de los derechos de Acceso, Rectificación, Supresión, Oposición y Portabilidad (ARCO+) en un plazo máximo de 15 días hábiles.
          </p>
        </div>

        {/* ── Tier 2: Categorized Navigation Grid (6 Columnas) ── */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 text-left">
          
          {/* Column 1: Brand & Direct Contact */}
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
                Teléfono:{' '}
                <a
                  href="tel:+56991016912"
                  className="text-[#0066cc] font-semibold hover:underline"
                >
                  +56 9 9101 6912
                </a>
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
                Correo Comercial:{' '}
                <a
                  href="mailto:contacto@gamasecurity.cl"
                  className="text-[#0066cc] font-semibold hover:underline"
                >
                  contacto@gamasecurity.cl
                </a>
              </div>
              <div>
                Canal Privacidad:{' '}
                <a
                  href="mailto:privacidad@gamasecurity.cl"
                  className="text-[#0066cc] font-semibold hover:underline"
                >
                  privacidad@gamasecurity.cl
                </a>
              </div>
              <div>
                Dirección:{' '}
                <span className="text-slate-700">Av. Valparaíso 351, Villa Alemana</span>
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
              <div className="pt-1">
                <Link
                  href="/contacto"
                  className="text-[#0066cc] font-semibold hover:underline"
                >
                  Solicitar Cotización →
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: Servicios (reales desde el loader) */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase">
              Servicios
            </h4>
            <ul className="space-y-2">
              {servicios.map(s => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="hover:text-[#0066cc] transition-colors text-left block"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/servicios" className="hover:text-[#0066cc] font-semibold block">
                  Ver todos los servicios →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Comunas (top RM + V Región) */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase">
              Comunas
            </h4>
            <ul className="space-y-2">
              {comunas.map(c => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="hover:text-[#0066cc] transition-colors text-left block"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/comunas" className="hover:text-[#0066cc] font-semibold block">
                  Ver todas las comunas →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Blog (recientes) */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase">
              Blog
            </h4>
            <ul className="space-y-2">
              {articulos.map(a => (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="hover:text-[#0066cc] transition-colors text-left block"
                  >
                    {a.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/blog" className="hover:text-[#0066cc] font-semibold block">
                  Ver el blog →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Plataforma & CRA */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase">
              Plataforma
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/operacion" className="text-[#0066cc] font-semibold hover:underline">
                  Acceso Operadores CRA →
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-[#0066cc] transition-colors text-left block">
                  Portal de Clientes
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-[#0066cc] transition-colors text-left block">
                  Soporte Técnico
                </Link>
              </li>
              <li>
                <a
                  href="https://apps.apple.com/ar/app/nt-click/id1440514183"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#0066cc] transition-colors text-left block"
                >
                  App NT CLICK (iOS Store)
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" /> Central Operativa OK
                </span>
              </li>
            </ul>
          </div>

          {/* Column 6: Cumplimiento & Legal (Ley N° 21.719) */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1d1d1f] text-xs tracking-tight uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>Privacidad & Legal</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenLegal('privacidad')}
                  className="hover:text-[#0066cc] transition-colors text-left cursor-pointer font-medium text-slate-700 block"
                >
                  Política de Privacidad
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenLegal('cookies')}
                  className="hover:text-[#0066cc] transition-colors text-left cursor-pointer block"
                >
                  Política de Cookies
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenLegal('arco')}
                  className="hover:text-[#0066cc] transition-colors text-left cursor-pointer font-semibold text-[#0066cc] block"
                >
                  Derechos ARCO+ (15 Días) →
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenLegal('terminos')}
                  className="hover:text-[#0066cc] transition-colors text-left cursor-pointer block"
                >
                  Términos y Condiciones
                </button>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <Lock className="w-3 h-3" /> Ley 21.719 APDP
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Tier 3: Bottom Copyright & Legal ── */}
        <div className="pt-8 border-t border-slate-300/60 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#7a7a7a]">
          <div>
            Copyright © {new Date().getFullYear()} GAMA SECURITY SpA (<a href="https://www.gamasecurity.cl" className="hover:underline text-[#0066cc]">www.gamasecurity.cl</a>) · R.U.T. 78.297.009-7. Todos los derechos reservados.
          </div>
          
          <div className="flex items-center gap-4 flex-wrap justify-center text-[11px]">
            <button
              type="button"
              onClick={() => handleOpenLegal('privacidad')}
              className="hover:text-[#0066cc] transition-colors cursor-pointer"
            >
              Privacidad
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('cookies')}
              className="hover:text-[#0066cc] transition-colors cursor-pointer"
            >
              Cookies
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('arco')}
              className="hover:text-[#0066cc] transition-colors cursor-pointer"
            >
              Canal ARCO+
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('terminos')}
              className="hover:text-[#0066cc] transition-colors cursor-pointer"
            >
              Términos
            </button>
            <span>·</span>
            <span className="font-semibold text-slate-600">Chile (OS-10 & APDP)</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
