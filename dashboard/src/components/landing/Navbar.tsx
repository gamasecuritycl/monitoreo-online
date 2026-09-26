'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface NavLink {
  label: string
  href: string
}

export interface NavGroup {
  label: string
  items: NavLink[]
}

interface NavbarProps {
  servicios: NavLink[]
  comunas: NavGroup[]
  articulos: NavLink[]
}

const NAV_LINKS: {
  id: string
  label: string
  href: string
  menu?: 'servicios' | 'comunas' | 'blog'
}[] = [
  { id: 'inicio', label: 'Inicio', href: '/' },
  { id: 'servicios', label: 'Servicios', href: '/servicios', menu: 'servicios' },
  { id: 'comunas', label: 'Comunas', href: '/comunas', menu: 'comunas' },
  { id: 'quienes-somos', label: 'Nosotros', href: '/#quienes-somos' },
  { id: 'blog', label: 'Blog', href: '/blog', menu: 'blog' },
  { id: 'contacto', label: 'Contacto', href: '/contacto' },
]

const PANEL_CLASS =
  'absolute top-full left-0 mt-2 bg-[#0a1628] border border-[#1e3a5f] rounded-xl p-4 grid grid-cols-2 gap-2 max-h-80 overflow-y-auto z-50 w-max min-w-[22rem]'

export default function Navbar({ servicios, comunas, articulos }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  const renderPanel = (menu: string) => {
    if (menu === 'servicios') {
      return (
        <div className={PANEL_CLASS}>
          {servicios.map(s => (
            <Link
              key={s.href}
              href={s.href}
              onClick={() => setOpenMenu(null)}
              className="text-slate-300 hover:text-[#2997ff] text-[13px] transition-colors"
            >
              {s.label}
            </Link>
          ))}
        </div>
      )
    }
    if (menu === 'comunas') {
      return (
        <div className={`${PANEL_CLASS} min-w-[26rem]`}>
          <Link
            href="/comunas"
            onClick={() => setOpenMenu(null)}
            className="col-span-2 text-[#2997ff] font-semibold text-[13px] border-b border-[#1e3a5f] pb-2 mb-1"
          >
            Ver todas las comunas →
          </Link>
          {comunas.map(group => (
            <Fragment key={group.label}>
              <span className="col-span-2 text-[11px] uppercase tracking-wide text-slate-500 font-semibold pt-2">
                {group.label}
              </span>
              {group.items.map(c => (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={() => setOpenMenu(null)}
                  className="text-slate-300 hover:text-[#2997ff] text-[13px] transition-colors"
                >
                  {c.label}
                </Link>
              ))}
            </Fragment>
          ))}
        </div>
      )
    }
    if (menu === 'blog') {
      return (
        <div className={PANEL_CLASS}>
          <Link
            href="/blog"
            onClick={() => setOpenMenu(null)}
            className="col-span-2 text-[#2997ff] font-semibold text-[13px] border-b border-[#1e3a5f] pb-2 mb-1"
          >
            Ver el blog →
          </Link>
          {articulos.map(a => (
            <Link
              key={a.href}
              href={a.href}
              onClick={() => setOpenMenu(null)}
              className="text-slate-300 hover:text-[#2997ff] text-[13px] transition-colors"
            >
              {a.label}
            </Link>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">

      {/* ── Tier 1: Global Utility Nav (44px height) ── */}
      <div className="bg-[#050d1a] border-b border-[#1e3a5f]/40 h-11 text-xs text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-slate-300 font-medium tracking-tight flex items-center gap-2">
              <span className="live-dot" />
              Central de Monitoreo 24/7 · Chile
            </span>
            <span className="hidden md:inline text-[#2997ff] text-[11px] font-mono font-semibold">
              Estándar de Alta Seguridad Enterprise
            </span>
          </div>

          <div className="flex items-center gap-5 text-[12px]">
            <Link
              href="/contacto"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Atención Clientes
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              href="/operacion"
              className="text-[#2997ff] hover:underline font-medium transition-colors"
            >
              Acceso Operadores →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tier 2: Sub-Nav Frosted Header (52px height) ── */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a1628]/90 backdrop-blur-xl border-b border-[#1e3a5f] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
            : 'bg-[#0a1628]/70 backdrop-blur-lg border-b border-[#1e3a5f]/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[52px]">

            {/* Octagonal Isolated Logo + Title */}
            <Link
              href="/"
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative w-8 h-8 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo-gama.webp"
                  alt="GAMA Security Logo"
                  width={32}
                  height={32}
                  className="object-contain filter drop-shadow(0 2px 8px rgba(0,102,204,0.3))"
                  priority
                />
              </div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-white font-semibold text-base tracking-tight font-sans">
                  GAMA
                </span>
                <span className="text-xs font-normal text-slate-400 font-sans">
                  Security
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 text-[13px] font-sans">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.id}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(link.menu ?? null)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <Link
                    href={link.href}
                    onClick={() =>
                      setOpenMenu(prev =>
                        link.menu && prev === link.menu ? null : link.menu ?? null
                      )
                    }
                    className="text-slate-300 hover:text-white transition-colors duration-150 font-normal hover:opacity-100"
                  >
                    {link.label}
                    {link.menu ? ' ▾' : ''}
                  </Link>
                  {link.menu && openMenu === link.menu && renderPanel(link.menu)}
                </div>
              ))}
            </div>

            {/* Right Side: Action Blue Pill CTA */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/contacto"
                className="btn-apple-primary text-xs py-1.5 px-4 font-normal"
              >
                Solicitar Cotización
              </Link>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-slate-300 hover:text-white p-1.5 transition-colors"
              aria-label="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-[#050d1a]/95 backdrop-blur-xl border-t border-[#1e3a5f] overflow-hidden"
            >
              <div className="px-5 py-4 space-y-3">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={closeMenu}
                    className="block w-full text-left text-slate-300 hover:text-white py-2 text-sm font-normal border-b border-white/5"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/contacto"
                    onClick={closeMenu}
                    className="btn-apple-primary w-full justify-center text-sm py-2"
                  >
                    Solicitar Cotización
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  )
}
