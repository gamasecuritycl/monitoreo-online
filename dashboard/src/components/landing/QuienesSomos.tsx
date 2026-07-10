import Image from 'next/image'

export default function QuienesSomos() {
  return (
    <section id="quienes-somos" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">Quiénes Somos</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
              Protegemos a Chile{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                desde 2010
              </span>
            </h3>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>
                En Gama Seguridad somos una empresa chilena especializada en monitoreo electrónico
                y protección patrimonial. Combinamos tecnología de punta con un equipo humano
                altamente capacitado para brindar tranquilidad a nuestros clientes.
              </p>
              <p>
                Nuestra central de monitoreo opera 24/7/365 con sistemas redundantes que garantizan
                que cada señal sea recibida, verificada y atendida sin interrupción. Utilizamos
                la plataforma Scorpion, estándar de la industria en Latinoamérica.
              </p>
              <p>
                Certificados por OS-10 de Carabineros de Chile, cumplimos con los más altos
                estándares de seguridad exigidos por la ley.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { icon: '🛡️', text: 'Certificación OS-10' },
                { icon: '📡', text: 'Tecnología Scorpion' },
                { icon: '👥', text: 'Equipo 24/7' },
                { icon: '🇨🇱', text: '100% Chilena' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm text-gray-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-3xl" />
            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🔒</div>
                  <p className="text-white/60 text-sm">Central de Monitoreo Gama Seguridad</p>
                </div>
                {/* Decorative pulse rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border border-blue-400/20 animate-ping" style={{ animationDuration: '4s' }} />
                  <div className="w-32 h-32 rounded-full border border-purple-400/20 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
