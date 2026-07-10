'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [time, setTime] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('es-CL', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'America/Santiago'
      }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const links = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'quienes-somos', label: 'Nosotros' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'tecnologia', label: 'Tecnología' },
    { id: 'contacto', label: 'Contacto' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#050810]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* Shield SVG logo */}
            <div className="relative w-9 h-9 flex items-center justify-center">
              <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
                <path
                  d="M20 2L4 9v12c0 8.4 6.8 16.3 16 18 9.2-1.7 16-9.6 16-18V9L20 2z"
                  fill="url(#shield-grad)"
                  stroke="rgba(14,165,233,0.5)"
                  strokeWidth="1"
                />
                <path d="M13 20l4 4 10-10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="shield-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.9"/>
                  </linearGradient>
                </defs>
              </svg>
              {/* Live dot on logo */}
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse-live border-2 border-[#050810]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-black text-base tracking-tight">GAMA</span>
              <span className="text-[10px] text-sky-400 font-semibold tracking-[0.18em] uppercase">Seguridad</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="relative text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/5 group"
              >
                {link.label}
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-sky-400 rounded-full transition-all duration-300 group-hover:w-4" />
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {/* Clock */}
            <div className="hidden lg:flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-live" />
              <span className="text-[11px] font-mono text-gray-400 tabular-nums">{time || '--:--:--'}</span>
              <span className="text-[9px] text-gray-600 font-mono">SCL</span>
            </div>
            <Link
              href="/app"
              className="relative group bg-gradient-to-br from-sky-500 to-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-sky-600/20 hover:shadow-sky-500/40 hover:-translate-y-0.5 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Acceso Personal
              </span>
              <span className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#050810]/98 backdrop-blur-xl border-t border-white/[0.06] animate-fade-in-fast">
          <div className="px-4 py-5 space-y-1">
            {links.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="flex items-center gap-3 w-full text-left text-gray-300 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                {link.label}
              </button>
            ))}
            <div className="pt-3 border-t border-white/5">
              <Link
                href="/app"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-sky-500 to-blue-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-sky-600/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Acceso Personal
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
