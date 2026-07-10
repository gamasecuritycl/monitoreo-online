import Link from 'next/link'

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050810]">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#050810] to-black" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M20 20m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0z' fill='%233b82f6'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_50%] from-transparent via-transparent to-black/70 pointer-events-none" />

      {/* Camera scanlines */}
      <div className="scanlines" />

      {/* House with camera overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] opacity-20">
          {/* House shape (SVG) */}
          <svg viewBox="0 0 400 400" fill="none" className="w-full h-full">
            {/* Roof */}
            <polygon points="200,30 30,170 370,170" stroke="#3b82f6" strokeWidth="2" fill="url(#roofGrad)" opacity="0.6" />
            {/* Walls */}
            <rect x="80" y="170" width="240" height="200" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.4" />
            {/* Door */}
            <rect x="175" y="270" width="50" height="100" stroke="#facc15" strokeWidth="1.5" fill="none" opacity="0.5" />
            {/* Windows */}
            <rect x="105" y="210" width="45" height="45" stroke="#60a5fa" strokeWidth="1" fill="none" opacity="0.3" rx="3" />
            <rect x="250" y="210" width="45" height="45" stroke="#60a5fa" strokeWidth="1" fill="none" opacity="0.3" rx="3" />
            {/* Crosshairs */}
            <line x1="127.5" y1="210" x2="127.5" y2="255" stroke="#60a5fa" strokeWidth="0.5" opacity="0.2" />
            <line x1="105" y1="232.5" x2="150" y2="232.5" stroke="#60a5fa" strokeWidth="0.5" opacity="0.2" />
            <line x1="272.5" y1="210" x2="272.5" y2="255" stroke="#60a5fa" strokeWidth="0.5" opacity="0.2" />
            <line x1="250" y1="232.5" x2="295" y2="232.5" stroke="#60a5fa" strokeWidth="0.5" opacity="0.2" />
            {/* Camera at top-right */}
            <circle cx="310" cy="140" r="18" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.6" />
            <circle cx="310" cy="140" r="8" fill="#ef4444" opacity="0.3" />
            {/* Ground line */}
            <line x1="30" y1="370" x2="370" y2="370" stroke="#3b82f6" strokeWidth="1" opacity="0.2" />
            <defs>
              <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Radar sweep */}
          <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-blue-500/5 animate-ping" style={{ animationDuration: '4s' }} />
          <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-blue-500/10 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>
      </div>

      {/* Logo Shield Badge */}
      <div className="absolute top-32 sm:top-40 right-8 sm:right-16 z-10 animate-warn-pulse">
        <div className="relative bg-black/80 border-2 border-yellow-400/60 rounded-xl px-4 py-3 backdrop-blur-sm flex items-center gap-3 shadow-[0_0_30px_rgba(250,204,21,0.15)]">
          <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-lg">
            🛡️
          </div>
          <div>
            <div className="text-[10px] text-yellow-400/80 font-mono tracking-widest uppercase">ALERTA</div>
            <div className="text-sm font-bold text-yellow-400 tracking-tight">GAMA SEGURIDAD</div>
          </div>
        </div>
      </div>

      {/* REC indicator */}
      <div className="absolute top-8 left-8 z-10 flex items-center gap-2">
        <div className="rec-dot" />
        <span className="text-[10px] text-red-400 font-mono tracking-widest uppercase">Monitoreo 24/7</span>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mt-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-blue-300/60 mb-8 tracking-wider uppercase font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-live" />
          Sistema Activo &bull; Santiago, Chile
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 tracking-tight">
          Seguridad que{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            nunca descansa
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed font-mono text-xs sm:text-sm">
          PROTEGEMOS LO QUE MÁS IMPORT CON TECNOLOGÍA DE MONITOREO DE ÚLTIMA GENERACIÓN,
          RESPUESTA INMEDIATA Y COBERTURA 24/7 EN TODO CHILE.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#contacto"
            className="btn-3d-glow bg-gradient-to-b from-blue-500 to-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base tracking-wide"
          >
            Solicitar Cotización
          </Link>
          <Link
            href="#servicios"
            className="btn-3d bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold px-8 py-3.5 rounded-xl border border-white/[0.08] text-base"
          >
            Nuestros Servicios
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {[
            { value: '15+', label: 'AÑOS' },
            { value: '500+', label: 'CLIENTES' },
            { value: '24/7', label: 'COBERTURA' },
            { value: '&lt;2min', label: 'RESPUESTA' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white">
                {stat.value}
              </div>
              <div className="text-[10px] text-gray-600 mt-1 tracking-[0.2em] font-mono">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050810] to-transparent pointer-events-none" />
    </section>
  )
}
