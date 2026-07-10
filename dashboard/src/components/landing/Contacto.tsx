export default function Contacto() {
  return (
    <section id="contacto" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">Contacto</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Hablemos de tu seguridad
            </h3>
            <p className="text-gray-400 mb-10 leading-relaxed">
              Solicita una cotización sin compromiso. Nuestro equipo te contactará en menos de 24 horas
              para entender tus necesidades y ofrecerte la solución que mejor se adapte a tu hogar o empresa.
            </p>

            <div className="space-y-6">
              {[
                { icon: '📞', title: 'Teléfono', value: '+56 2 2345 6789' },
                { icon: '✉️', title: 'Email', value: 'contacto@gamaseguridad.cl' },
                { icon: '📍', title: 'Dirección', value: 'Av. Providencia 1420, Of. 602, Santiago' },
                { icon: '🕐', title: 'Horario', value: 'Monitoreo 24/7 · Oficina: Lun-Vie 9:00-18:00' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div>
                    <h4 className="text-white text-sm font-semibold">{item.title}</h4>
                    <p className="text-gray-400 text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
            <h4 className="text-white font-semibold text-lg mb-6">Envíanos un mensaje</h4>
            <form className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <input
                type="tel"
                placeholder="Teléfono"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors">
                <option value="" disabled selected>Tipo de servicio</option>
                <option value="alarma">Alarma Patrimonial</option>
                <option value="cctv">Circuito Cerrado TV</option>
                <option value="acceso">Control de Acceso</option>
                <option value="incendio">Detección de Incendio</option>
                <option value="monitoreo">Monitoreo 24/7</option>
                <option value="otro">Otro</option>
              </select>
              <textarea
                rows={4}
                placeholder="Mensaje o consulta..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 text-sm"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
