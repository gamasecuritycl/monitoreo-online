export default function Servicios() {
  const servicios = [
    {
      icon: '🖥️',
      title: 'Monitoreo 24/7',
      desc: 'Central de monitoreo operativa las 24 horas, los 365 días del año. Recepción y verificación de señales de alarma en tiempo real.',
    },
    {
      icon: '🚨',
      title: 'Alarmas Patrimoniales',
      desc: 'Sistemas de alarma para hogares, comercios e industrias con sensores de apertura, movimiento, impacto y perimetrales.',
    },
    {
      icon: '📹',
      title: 'Circuito Cerrado TV',
      desc: 'Instalación y monitoreo de cámaras IP y análogas con grabación en NVR, acceso remoto y detección por inteligencia artificial.',
    },
    {
      icon: '🔑',
      title: 'Control de Acceso',
      desc: 'Sistemas de control de acceso biométrico, tarjetas de proximidad y cerraduras electrónicas para gestionar entradas y salidas.',
    },
    {
      icon: '🔥',
      title: 'Detección de Incendio',
      desc: 'Sistemas de detección y alarma de incendio con sensores de humo, temperatura y gas conectados a la central 24/7.',
    },
    {
      icon: '📱',
      title: 'App de Monitoreo',
      desc: 'Aplicación web y móvil para que nuestros clientes vean en tiempo real el estado de sus alarmas, eventos y notificaciones.',
    },
  ]

  return (
    <section id="servicios" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-4">Servicios</h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Soluciones integrales de seguridad
          </h3>
          <p className="text-gray-400">
            Desde la instalación hasta el monitoreo continuo, ofrecemos todo lo necesario
            para proteger tu patrimonio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map((svc) => (
            <div
              key={svc.title}
              className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-blue-500/30 rounded-2xl p-6 transition-all duration-500"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
              <div className="relative z-10">
                <span className="text-3xl block mb-4">{svc.icon}</span>
                <h4 className="text-white font-semibold text-lg mb-2">{svc.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{svc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
