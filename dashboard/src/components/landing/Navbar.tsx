'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'quienes-somos', label: 'Nosotros' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'contacto', label: 'Contacto' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      
      {/* ── Tier 1: Global Utility Nav (44px height) ── */}
      <div className="bg-[#050d1a] border-b border-[#1e3a5f]/40 h-11 text-xs text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-slate-300 font-medium tracking-tight flex items-center gap-2">
              <span className="live-dot" />
              Central Monitoreo 24/7 · Chile
            </span>
            <span className="hidden md:inline text-[#2997ff] text-[11px] font-mono font-semibold">
              OS-10 Certificado
            </span>
          </div>

          <div className="flex items-center gap-5 text-[12px]">
            <button
              onClick={() => scrollTo('contacto')}
              className="text-slate-300 hover:text-white transition-colors"
            >
              Atención Clientes
            </button>
            <span className="text-slate-600">|</span>
            <Link
              href="/operacion"
              className="text-[#2997ff] hover:underline font-medium transition-colors"
            >
              Acceso Plataforma Scorpion →
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
            <div
              onClick={() => scrollTo('inicio')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative w-8 h-8 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo-gama.png"
                  alt="GAMA Servicios Monitoreo"
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
                  Servicios
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 text-[13px] font-sans">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="text-slate-300 hover:text-white transition-colors duration-150 font-normal hover:opacity-100"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right Side: Action Blue Pill CTA */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => scrollTo('contacto')}
                className="btn-apple-primary text-xs py-1.5 px-4 font-normal"
              >
                Solicitar Cotización
              </button>
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
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="block w-full text-left text-slate-300 hover:text-white py-2 text-sm font-normal border-b border-white/5"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => scrollTo('contacto')}
                    className="btn-apple-primary w-full justify-center text-sm py-2"
                  >
                    Solicitar Cotización
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  )
}
