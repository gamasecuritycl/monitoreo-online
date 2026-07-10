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
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a1628]/95 backdrop-blur-xl border-b border-[#1e3a5f] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20 py-3">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/logo-CASAS.png"
                alt="Gama Servicios"
                width={48}
                height={48}
                className="object-contain drop-shadow-lg"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-black text-lg tracking-tight">GAMA</span>
              <span className="text-[11px] font-bold text-orange-400 tracking-[0.2em] uppercase">Servicios</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="relative text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/5 group font-medium"
              >
                {link.label}
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-orange-500 rounded-full transition-all duration-300 group-hover:w-4" />
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Emergency number */}
            <a
              href="tel:323276011"
              className="flex items-center gap-2 bg-[#0f2240] border border-[#1e3a5f] hover:border-orange-500/50 rounded-xl px-4 py-2.5 transition-all duration-200 group"
            >
              <div className="live-dot" />
              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-slate-500 font-mono tracking-wider">EMERGENCIAS 24/7</span>
                <span className="text-white font-bold text-sm font-mono">323-276-011</span>
              </div>
            </a>
            <button
              onClick={() => scrollTo('contacto')}
              className="btn-primary text-sm"
            >
              Solicitar Cotización
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-[#0a1628]/98 backdrop-blur-xl border-t border-[#1e3a5f] overflow-hidden"
          >
            <div className="px-4 py-5 space-y-1">
              {NAV_LINKS.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="flex items-center gap-3 w-full text-left text-slate-300 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  {link.label}
                </button>
              ))}
              <div className="pt-3 border-t border-[#1e3a5f] space-y-3">
                <a href="tel:323276011" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0f2240] border border-[#1e3a5f]">
                  <div className="live-dot" />
                  <div>
                    <div className="text-[9px] text-slate-500 font-mono">EMERGENCIAS 24/7</div>
                    <div className="text-white font-bold font-mono">323-276-011</div>
                  </div>
                </a>
                <button
                  onClick={() => scrollTo('contacto')}
                  className="btn-primary w-full justify-center"
                >
                  Solicitar Cotización
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
