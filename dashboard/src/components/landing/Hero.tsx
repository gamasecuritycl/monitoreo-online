import Link from 'next/link'

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Aurora orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="aurora-orb absolute top-1/4 -left-32 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] animate-aurora1" />
        <div className="aurora-orb absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px] animate-aurora2" />
        <div className="aurora-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[150px] animate-aurora3" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIG9wYWNpdHk9IjAuMDMiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTIgMGEyIDIgMCAxIDEgNCAwYTIgMiAwIDEgMS00IDB6IiBmaWxsPSIjZmZmIi8+PC9nPjwvc3ZnPg==')] opacity-40" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-blue-300 mb-8 tracking-wider uppercase">
          Monitoreo 24/7 &bull; Santiago, Chile
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 tracking-tight">
          Seguridad que{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            nunca descansa
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Protegemos lo que más importa con tecnología de monitoreo de última generación,
          respuesta inmediata y cobertura 24/7 en todo Chile.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#contacto"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 text-base"
          >
            Solicitar Cotización
          </Link>
          <Link
            href="#servicios"
            className="bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-300 border border-white/10 text-base"
          >
            Nuestros Servicios
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {[
            { value: '15+', label: 'Años de Experiencia' },
            { value: '500+', label: 'Clientes Protegidos' },
            { value: '24/7', label: 'Monitoreo Continuo' },
            { value: '2 min', label: 'Tiempo de Respuesta' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
