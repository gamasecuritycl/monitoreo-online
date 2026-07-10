'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-[#0a0e1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-white font-bold text-lg mb-4">
              GAMA <span className="text-blue-400">SEGURIDAD</span>
            </h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Monitoreo electrónico 24/7. Protegemos tu patrimonio con tecnología de punta
              y atención personalizada en todo Chile.
            </p>
          </div>

          <div>
            <h5 className="text-white text-sm font-semibold mb-4">Servicios</h5>
            <ul className="space-y-2">
              {['Monitoreo 24/7', 'Alarmas', 'CCTV', 'Control de Acceso', 'Detección de Incendio'].map((item) => (
                <li key={item}>
                  <button onClick={() => {
                    const el = document.getElementById('servicios')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-white text-sm font-semibold mb-4">Enlaces</h5>
            <ul className="space-y-2">
              {[
                { label: 'Inicio', href: '#inicio' },
                { label: 'Quiénes Somos', href: '#quienes-somos' },
                { label: 'Clientes', href: '#clientes' },
                { label: 'Contacto', href: '#contacto' },
                { label: 'Acceso Personal', href: '/app' },
              ].map((item) => (
                <li key={item.label}>
                  {item.href.startsWith('/') ? (
                    <Link href={item.href} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <button onClick={() => {
                      const el = document.getElementById(item.href.slice(1))
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-white text-sm font-semibold mb-4">Contacto</h5>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li>+56 2 2345 6789</li>
              <li>contacto@gamaseguridad.cl</li>
              <li>Av. Providencia 1420, Of. 602</li>
              <li>Santiago, Chile</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} Gama Seguridad. Todos los derechos reservados.
          </p>
          <p className="text-gray-700 text-xs">
            Monitoreo certificado OS-10 &bull; Carabineros de Chile
          </p>
        </div>
      </div>
    </footer>
  )
}
