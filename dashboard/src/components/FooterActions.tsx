'use client'

// ════════════════════════════════════════════════════════════════════════════
//  GAMA COMMAND CENTER - FooterActions v4.0
//  Botonera integrada en un menú sidebar vertical retractable (tipo hamburguesa)
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

interface FooterActionsProps {
  onModalOpen: (modalId: string) => void
}

interface BotonRetro {
  id: string
  title: string
  renderSVG: () => React.ReactNode
}

const BOTONES_RETRO: BotonRetro[] = [
  // 1. LLAVE DE TURNOS
  {
    id: 'key-shift',
    title: 'Cambio de Turno (Llave)',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="16" r="6" stroke="#b45309" strokeWidth="2.5" fill="#f59e0b"/>
        <circle cx="11" cy="16" r="2.5" fill="#ffffff" stroke="#b45309" strokeWidth="1"/>
        <rect x="17" y="13" width="10" height="6" fill="#f59e0b" stroke="#b45309" strokeWidth="2"/>
        <rect x="21" y="17" width="2" height="4" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5"/>
        <rect x="25" y="17" width="2" height="4" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5"/>
      </svg>
    )
  },
  // 2. LÁPIZ Y LIBRETA
  {
    id: 'pencil-notebook',
    title: 'Ficha de Evento Activo',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="4" width="18" height="24" rx="1.5" fill="#f8fafc" stroke="#1e293b" strokeWidth="2"/>
        <line x1="8" y1="9" x2="20" y2="9" stroke="#cbd5e1" strokeWidth="2"/>
        <line x1="8" y1="14" x2="20" y2="14" stroke="#cbd5e1" strokeWidth="2"/>
        <line x1="8" y1="19" x2="16" y2="19" stroke="#cbd5e1" strokeWidth="2"/>
        <g transform="rotate(45 22 18)">
          <rect x="20" y="8" width="4" height="16" rx="1" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1"/>
          <path d="M20 8L22 4L24 8H20Z" fill="#fca5a5"/>
        </g>
      </svg>
    )
  },
  // 3. ÁRBOL DE JERARQUÍA (Tree Nodes)
  {
    id: 'zones-tree',
    title: 'Zonificación',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="13" y="4" width="6" height="6" fill="#22c55e" stroke="#15803d" strokeWidth="1.5"/>
        <line x1="16" y1="10" x2="16" y2="19" stroke="#1e293b" strokeWidth="2"/>
        <line x1="7" y1="19" x2="25" y2="19" stroke="#1e293b" strokeWidth="2"/>
        <rect x="4" y="19" width="6" height="6" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5"/>
        <rect x="22" y="19" width="6" height="6" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5"/>
      </svg>
    )
  },
  // 4. GRÁFICO LINEAL DE TENDENCIAS (Line Chart)
  {
    id: 'line-chart',
    title: 'Tendencias y Gráficos',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="24" height="24" fill="#e0f2fe" stroke="#1e293b" strokeWidth="1.5"/>
        <line x1="7" y1="6" x2="7" y2="25" stroke="#1e293b" strokeWidth="2"/>
        <line x1="7" y1="25" x2="26" y2="25" stroke="#1e293b" strokeWidth="2"/>
        <path d="M7 21L12 14L17 18L25 8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="14" r="2" fill="#000000"/>
        <circle cx="17" cy="18" r="2" fill="#000000"/>
        <circle cx="25" cy="8" r="2" fill="#000000"/>
      </svg>
    )
  },
  // 5. EXPEDIENTE (Libros apilados)
  {
    id: 'bar-chart',
    title: 'Expediente de Usuario',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="5" width="5" height="22" rx="1" fill="#ef4444" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="8" y="7" width="1.5" height="18" fill="#fca5a5"/>
        <line x1="6" y1="9" x2="11" y2="9" stroke="#1e293b" strokeWidth="1"/>
        <line x1="6" y1="23" x2="11" y2="23" stroke="#1e293b" strokeWidth="1"/>

        <rect x="12" y="5" width="5" height="22" rx="1" fill="#2563eb" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="14" y="7" width="1.5" height="18" fill="#93c5fd"/>
        <line x1="12" y1="9" x2="17" y2="9" stroke="#1e293b" strokeWidth="1"/>
        <line x1="12" y1="23" x2="17" y2="23" stroke="#1e293b" strokeWidth="1"/>

        <rect x="18" y="5" width="5" height="22" rx="1" fill="#22c55e" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="20" y="7" width="1.5" height="18" fill="#86efac"/>
        <line x1="18" y1="9" x2="23" y2="9" stroke="#1e293b" strokeWidth="1"/>
        <line x1="18" y1="23" x2="23" y2="23" stroke="#1e293b" strokeWidth="1"/>

        <g transform="rotate(15 22 5)">
          <rect x="22" y="4" width="5" height="22" rx="1" fill="#eab308" stroke="#1e293b" strokeWidth="1.2"/>
          <rect x="24" y="6" width="1.5" height="18" fill="#fef08a"/>
          <line x1="22" y1="8" x2="27" y2="8" stroke="#1e293b" strokeWidth="1"/>
          <line x1="22" y1="22" x2="27" y2="22" stroke="#1e293b" strokeWidth="1"/>
        </g>
      </svg>
    )
  },
  // 6. TODOS LOS EVENTOS (All Events by Day)
  {
    id: 'todos-los-eventos',
    title: 'Todos los Eventos',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="24" height="20" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5"/>
        <line x1="8" y1="11" x2="24" y2="11" stroke="#2563eb" strokeWidth="2"/>
        <line x1="8" y1="16" x2="24" y2="16" stroke="#22c55e" strokeWidth="2"/>
        <line x1="8" y1="21" x2="24" y2="21" stroke="#ef4444" strokeWidth="2"/>
      </svg>
    )
  },
  // 7. BITÁCORA -> EVENTOS POR USUARIO (Lista checklist)
  {
    id: 'checklist',
    title: 'Eventos por Usuario',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="4" width="20" height="24" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8"/>
        <path d="M9 9L11 11L15 7" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="18" y1="9" x2="23" y2="9" stroke="#1e293b" strokeWidth="1.5"/>
        <path d="M9 17L11 19L15 15" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="18" y1="17" x2="23" y2="17" stroke="#1e293b" strokeWidth="1.5"/>
        <line x1="9" y1="23" x2="23" y2="23" stroke="#cbd5e1" strokeWidth="1.5"/>
      </svg>
    )
  },
  // 8. HOGAR (Home)
  {
    id: 'home',
    title: 'Monitoreo Principal',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4L4 14H8V26H24V14H28L16 4Z" fill="#3b82f6" stroke="#1e293b" strokeWidth="1.8"/>
        <rect x="7" y="14" width="16" height="12" fill="#fef08a" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="13" y="19" width="4" height="7" fill="#78350f" stroke="#1e293b" strokeWidth="0.8"/>
        <rect x="9" y="16" width="3" height="3" fill="#3b82f6" stroke="#1e293b" strokeWidth="0.8"/>
        <rect x="20" y="16" width="3" height="3" fill="#3b82f6" stroke="#1e293b" strokeWidth="0.8"/>
      </svg>
    )
  },
  // 9. LUPA (Search)
  {
    id: 'search',
    title: 'Búsqueda Rápida',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="7" stroke="#1e293b" strokeWidth="2.5" fill="#e2e8f0"/>
        <circle cx="10" cy="10" r="4" fill="#ffffff" opacity="0.6"/>
        <line x1="17" y1="17" x2="26" y2="26" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="square"/>
      </svg>
    )
  },
  // 10. ARCHIVADOR (Archive Cabinet)
  {
    id: 'archive',
    title: 'Archivos Históricos',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="4" width="20" height="24" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.8"/>
        <rect x="9" y="7" width="14" height="8" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="13" y="11" width="6" height="2" fill="#475569" stroke="#1e293b" strokeWidth="0.8"/>
        <rect x="9" y="17" width="14" height="8" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="13" y="21" width="6" height="2" fill="#475569" stroke="#1e293b" strokeWidth="0.8"/>
      </svg>
    )
  },
  // 11. BOTÓN OFICIAL DE WHATSAPP
  {
    id: 'notificaciones-whatsapp',
    title: 'Centro de Envíos WhatsApp',
    renderSVG: () => (
      <svg width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M24 4C12.9543 4 4 12.9543 4 24C4 27.8576 5.09241 31.4623 6.98595 34.5262L4.5 43.5L13.7153 41.0772C16.666 42.9242 20.2075 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4Z" fill="#25D366"/>
        <path d="M17.481 14.3777C17.0264 13.3639 16.5457 13.3444 16.1118 13.3262C15.7533 13.3106 15.3344 13.3113 14.9157 13.3113C14.4967 13.3113 13.8153 13.4687 13.2389 14.0975C12.6625 14.7263 11.0378 16.2464 11.0378 19.3387C11.0378 22.431 13.2913 25.4182 13.6059 25.8376C13.9205 26.257 18.0163 32.5649 24.2748 35.2678C29.4764 37.514 30.5361 37.0653 31.6892 36.9605C32.8423 36.8557 35.4093 35.4406 35.9335 33.973C36.4577 32.5054 36.4577 31.2476 36.3004 30.9856C36.1432 30.7236 35.7239 30.5663 35.0949 30.2517C34.4659 29.9371 31.3736 28.417 30.7972 28.2074C30.2208 27.9978 29.8015 27.8931 29.3826 28.5219C28.9636 29.1507 27.758 30.5663 27.3911 30.9856C27.0242 31.405 26.6573 31.4574 26.0283 31.1428C25.3993 30.8282 23.3761 30.1652 20.9767 28.026C19.108 26.3601 17.8475 24.3039 17.4806 23.6751C17.1137 23.0463 17.4414 22.7062 17.7573 22.3924C18.0409 22.1105 18.3879 21.6575 18.7025 21.2906C19.0171 20.9237 19.1219 20.6617 19.3315 20.2423C19.5411 19.8229 19.4363 19.456 19.2791 19.1414C19.1219 18.8268 17.8927 15.7915 17.481 14.3777Z" fill="white"/>
      </svg>
    )
  }
]

export default function FooterActions({ onModalOpen }: FooterActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 
        PIE DE PÁGINA RESPONSIVO:
        - En PC / Escritorio (md): Muestra los 10 botones tradicionales en fila directamente
        - En Móvil / Tablet (<md): Muestra únicamente el botón de Menú Scorpion
      */}
      <footer className="shrink-0 bg-[#d4d0c8] border-t-2 border-white px-2 py-1.5 flex justify-between items-center select-none z-30">
        
        {/* VERSIÓN DE ESCRITORIO (PC): Fila de 10 botones horizontales */}
        <div className="hidden md:flex items-center gap-1.5 mx-auto">
          {/* Botón BITÁCORA (rectangular con texto) */}
          <button
            onClick={() => onModalOpen('bitacora')}
            title="Bitácora de Eventos"
            className="h-13 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 flex items-center justify-center cursor-pointer select-none hover:bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white shadow-sm px-3"
          >
            <span className="text-[13px] font-bold text-[#000080] tracking-wider whitespace-nowrap">BITÁCORA</span>
          </button>
          {BOTONES_RETRO.map((btn) => (
            <button
              key={btn.id}
              onClick={() => onModalOpen(btn.id)}
              title={btn.title}
              className="w-13 h-13 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 flex items-center justify-center cursor-pointer select-none hover:bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white shadow-sm"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                {btn.renderSVG()}
              </div>
            </button>
          ))}
        </div>

        {/* VERSIÓN MÓVIL: Botón Menú Scorpion (Aparece inmediatamente abajo a la izquierda) */}
        <div className="flex md:hidden items-center justify-between w-full">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2.5 py-1 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 font-bold text-black flex items-center gap-1.5 cursor-pointer active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white text-[10px] select-none hover:bg-gray-200"
          >
            {/* Icono Hamburguesa 16-bits */}
            <div className="flex flex-col gap-0.5 w-3 justify-center">
              <div className="h-0.5 bg-black w-full" />
              <div className="h-0.5 bg-black w-full" />
              <div className="h-0.5 bg-black w-full" />
            </div>
            <span>MENU SCORPION</span>
          </button>
          
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">
            Gama Seguridad
          </span>
        </div>
      </footer>

      {/* 
        SIDEBAR DESPLEGABLE ESTILO SCORPION WINDOWS 95
        Se desliza desde la izquierda sobre la pantalla en móvil
      */}
      {isOpen && (
        <>
          {/* Fondo sombreado traslúcido */}
          <div 
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menú Sidebar */}
          <div 
            className="fixed top-0 left-0 h-full w-[290px] bg-[#d4d0c8] border-r-2 border-white shadow-2xl z-50 flex flex-col justify-between select-none animate-slide-in md:hidden"
            style={{ fontSize: '11px' }}
          >
            {/* Header del Sidebar */}
            <div className="bg-[#000080] text-white font-bold px-2 py-1.5 flex justify-between items-center shrink-0">
              <span className="text-[11px] tracking-wide">Menú Scorpion Opciones</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center text-[9px] pb-0.5 cursor-pointer"
              >
                x
              </button>
            </div>

            {/* Listado de Botones en Vertical */}
            <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-1.5 bg-[#d4d0c8]">
              {/* BITÁCORA primero */}
              <div
                onClick={() => { onModalOpen('bitacora'); setIsOpen(false) }}
                className="flex items-center gap-3 p-2 bg-[#000080] hover:bg-[#0000a0] border border-[#4444cc] cursor-pointer rounded-sm select-none transition-all"
              >
                <span className="font-bold text-white text-[13px] tracking-wider">📋 BITÁCORA</span>
              </div>
              {BOTONES_RETRO.map((btn) => (
                <div
                  key={btn.id}
                  onClick={() => {
                    onModalOpen(btn.id)
                    setIsOpen(false)
                  }}
                  className="flex items-center gap-3 p-1.5 bg-[#d4d0c8] hover:bg-white active:bg-gray-200 border border-gray-400 hover:border-gray-500 cursor-pointer rounded-sm select-none transition-all"
                >
                  {/* Botón retro de 16-bits */}
                  <div className="w-10 h-10 shrink-0 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 flex items-center justify-center">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {btn.renderSVG()}
                    </div>
                  </div>
                  {/* Etiqueta de texto descriptivo */}
                  <div className="flex flex-col">
                    <span className="font-bold text-black text-[11px]">{btn.title}</span>
                    <span className="text-[9px] text-gray-500 capitalize">{btn.id.replace('-', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cierre inferior */}
            <div className="p-2 border-t border-gray-400 bg-[#e0e0e0] flex justify-end shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none text-[11px]"
              >
                Cerrar Menú
              </button>
            </div>

          </div>
        </>
      )}
    </>
  )
}
