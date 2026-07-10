import Link from 'next/link'

export default function ClientesSection() {
  return (
    <section id="clientes" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4 font-mono">Área Clientes</h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Accede a tu plataforma de monitoreo
          </h3>
          <p className="text-gray-400">
            Visualiza el estado de tus alarmas, revisa eventos en tiempo real y gestiona
            tus notificaciones desde cualquier lugar.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card: Acceso al Dashboard */}
          <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-500">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="text-4xl mb-4">🖥️</div>
              <h4 className="text-white font-semibold text-xl mb-3">Command Center</h4>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Panel de monitoreo en tiempo real con eventos, reportes, zonificación
                y notificaciones vía mail, WhatsApp y SMS.
              </p>
              <Link
                href="/app"
                className="btn-3d-glow inline-block bg-gradient-to-b from-blue-500 to-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm"
              >
                Ingresar al Sistema
              </Link>
            </div>
          </div>

          {/* Card: Portal de Clientes (próximamente) */}
          <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-500">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-transparent to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="text-4xl mb-4">🔐</div>
              <h4 className="text-white font-semibold text-xl mb-3">Portal del Cliente</h4>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Próximamente: accede a tu historial, descarga certificados, actualiza
                tus datos de contacto y gestión de cobranza.
              </p>
              <div className="inline-block bg-white/[0.04] text-gray-500 font-semibold px-6 py-2.5 rounded-xl text-sm border border-white/[0.06] cursor-not-allowed">
                Próximamente
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
