'use client'

export default function WhatsAppFloating() {
  const handleWhatsApp = () => {
    const text = encodeURIComponent('Hola GAMA Seguridad, me comunico con Ventas para cotizar un sistema de alarma y monitoreo 24/7.')
    window.open(`https://wa.me/56964364943?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="whatsapp-floating fixed bottom-6 left-5 sm:bottom-8 sm:left-6 z-[9990] flex items-center group">
      {/* Botón flotante a la izquierda */}
      <button
        type="button"
        onClick={handleWhatsApp}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white flex items-center justify-center shadow-[0_6px_25px_rgba(37,211,102,0.45)] hover:shadow-[0_8px_32px_rgba(37,211,102,0.7)] transition-all duration-300 transform group-hover:scale-110 active:scale-95 cursor-pointer border-2 border-white/25 focus:outline-none"
        aria-label="Contactar a Ventas por WhatsApp"
      >
        {/* Anillo de pulso disuasivo */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-75 animate-ping pointer-events-none duration-1000" />

        {/* Badge 1 de mensaje pendiente */}
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-slate-950 text-white font-black text-[10px] flex items-center justify-center shadow-md animate-bounce z-20">
          1
        </span>

        {/* Contenedor ópticamente centrado para el logo WhatsApp */}
        <span className="relative z-10 flex items-center justify-center w-7 h-7 translate-x-[0.5px] -translate-y-[0.5px]">
          <svg
            className="w-7 h-7 fill-white drop-shadow-sm"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </span>
      </button>

      {/* Tooltip badge hacia la derecha */}
      <div className="hidden sm:flex items-center gap-2 ml-3 px-3.5 py-1.5 rounded-full bg-[#0a1628]/95 backdrop-blur-md border border-[#25D366]/40 text-white text-xs font-sans shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform -translate-x-2 group-hover:translate-x-0">
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <span className="font-bold text-[#25D366]">WhatsApp Ventas</span>
        <span className="text-slate-300">· +56 9 6436 4943</span>
      </div>
    </div>
  )
}