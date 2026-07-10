'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0e1a]/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-CASAS.png"
              alt="Gama Seguridad"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <span className="text-white font-bold text-lg tracking-tight">GAMA</span>
              <span className="text-blue-400 font-bold text-lg ml-1">SEGURIDAD</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('inicio')} className="text-sm text-gray-300 hover:text-white transition-colors">Inicio</button>
            <button onClick={() => scrollTo('quienes-somos')} className="text-sm text-gray-300 hover:text-white transition-colors">Quiénes Somos</button>
            <button onClick={() => scrollTo('servicios')} className="text-sm text-gray-300 hover:text-white transition-colors">Servicios</button>
            <button onClick={() => scrollTo('clientes')} className="text-sm text-gray-300 hover:text-white transition-colors">Clientes</button>
            <button onClick={() => scrollTo('contacto')} className="text-sm text-gray-300 hover:text-white transition-colors">Contacto</button>
            <Link
              href="/app"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 shadow-lg shadow-blue-600/20"
            >
              Acceso Personal
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/5">
          <div className="px-4 py-4 space-y-3">
            <button onClick={() => scrollTo('inicio')} className="block w-full text-left text-gray-300 hover:text-white py-2">Inicio</button>
            <button onClick={() => scrollTo('quienes-somos')} className="block w-full text-left text-gray-300 hover:text-white py-2">Quiénes Somos</button>
            <button onClick={() => scrollTo('servicios')} className="block w-full text-left text-gray-300 hover:text-white py-2">Servicios</button>
            <button onClick={() => scrollTo('clientes')} className="block w-full text-left text-gray-300 hover:text-white py-2">Clientes</button>
            <button onClick={() => scrollTo('contacto')} className="block w-full text-left text-gray-300 hover:text-white py-2">Contacto</button>
            <Link href="/app" onClick={() => setMenuOpen(false)} className="block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-5 py-2 rounded-full">
              Acceso Personal
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
