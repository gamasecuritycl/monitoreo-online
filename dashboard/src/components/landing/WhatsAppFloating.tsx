'use client'

export default function WhatsAppFloating() {
  const whatsappUrl =
    'https://wa.me/56964364943?text=' +
    encodeURIComponent('Hola GAMA Seguridad, me comunico con Ventas para cotizar un sistema de alarma y monitoreo 24/7.')

  return (
    <aside
      aria-label="Chat de Ventas WhatsApp"
      className="whatsapp-floating fixed bottom-6 left-4 sm:bottom-8 sm:left-6 z-[9990] flex items-center"
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir Chat de Ventas por WhatsApp al +56 9 6436 4943"
        className="flex items-center gap-3 pl-2.5 pr-4 py-2 rounded-full bg-[#071322]/95 hover:bg-[#0c1f36] border-2 border-[#25D366] text-white shadow-[0_8px_30px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_40px_rgba(37,211,102,0.7)] backdrop-blur-md transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer no-underline group"
      >
        {/* Contenedor del icono con pulso animado */}
        <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping pointer-events-none duration-1000" />
          
          {/* SVG Oficial de WhatsApp con viewBox 0 0 48 48 sin distorsión */}
          <svg
            className="w-10 h-10 drop-shadow-md shrink-0 block"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M24 4C12.9543 4 4 12.9543 4 24C4 27.8576 5.09241 31.4623 6.98595 34.5262L4.5 43.5L13.7153 41.0772C16.666 42.9242 20.2075 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4Z"
              fill="#25D366"
            />
            <path
              d="M17.481 14.3777C17.0264 13.3639 16.5457 13.3444 16.1118 13.3262C15.7533 13.3106 15.3344 13.3113 14.9157 13.3113C14.4967 13.3113 13.8153 13.4687 13.2389 14.0975C12.6625 14.7263 11.0378 16.2464 11.0378 19.3387C11.0378 22.431 13.2913 25.4182 13.6059 25.8376C13.9205 26.257 18.0163 32.5649 24.2748 35.2678C29.4764 37.514 30.5361 37.0653 31.6892 36.9605C32.8423 36.8557 35.4093 35.4406 35.9335 33.973C36.4577 32.5054 36.4577 31.2476 36.3004 30.9856C36.1432 30.7236 35.7239 30.5663 35.0949 30.2517C34.4659 29.9371 31.3736 28.417 30.7972 28.2074C30.2208 27.9978 29.8015 27.8931 29.3826 28.5219C28.9636 29.1507 27.758 30.5663 27.3911 30.9856C27.0242 31.405 26.6573 31.4574 26.0283 31.1428C25.3993 30.8282 23.3761 30.1652 20.9767 28.026C19.108 26.3601 17.8475 24.3039 17.4806 23.6751C17.1137 23.0463 17.4414 22.7062 17.7573 22.3924C18.0409 22.1105 18.3879 21.6575 18.7025 21.2906C19.0171 20.9237 19.1219 20.6617 19.3315 20.2423C19.5411 19.8229 19.4363 19.456 19.2791 19.1414C19.1219 18.8268 17.8927 15.7915 17.481 14.3777Z"
              fill="white"
            />
          </svg>

          {/* Badge rojo de notificación */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border border-slate-950 text-white font-black text-[9px] flex items-center justify-center shadow-md animate-bounce z-20">
            1
          </span>
        </div>

        {/* Texto explícito y visible: CHAT DE VENTAS */}
        <div className="flex flex-col text-left leading-tight pr-1">
          <span className="text-[12px] font-black text-white tracking-wide uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
            Chat de Ventas
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold tracking-tight">
            +56 9 6436 4943
          </span>
        </div>
      </a>
    </aside>
  )
}