'use client'

interface FooterActionsProps {
  onModalOpen: (id: string) => void
}

interface BotonRetro {
  id: string
  title: string
  // Retorna un SVG diseñado píxel a píxel con colores clásicos e iluminación 3D
  renderSVG: () => React.ReactNode
}

const BOTONES_RETRO: BotonRetro[] = [
  // 1. LLAVE (Cambio de Turno)
  {
    id: 'key-shift',
    title: 'Cambio de Turno de Operadores',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Cuerpo de la llave dorada con sombras */}
        <circle cx="10" cy="20" r="7" fill="#eab308" stroke="#1e293b" strokeWidth="1.5"/>
        <circle cx="10" cy="20" r="3" fill="#854d0e" stroke="#1e293b" strokeWidth="1"/>
        
        {/* Eje de la llave */}
        <path d="M16 16L26 6" stroke="#eab308" strokeWidth="3" strokeLinecap="square"/>
        <path d="M16 16L26 6" stroke="#1e293b" strokeWidth="1" strokeLinecap="square"/>
        
        {/* Dientes */}
        <path d="M22 10L25 13" stroke="#eab308" strokeWidth="3" strokeLinecap="square"/>
        <path d="M22 10L25 13" stroke="#1e293b" strokeWidth="1" strokeLinecap="square"/>
        <path d="M24 8L27 11" stroke="#eab308" strokeWidth="3" strokeLinecap="square"/>
        <path d="M24 8L27 11" stroke="#1e293b" strokeWidth="1" strokeLinecap="square"/>
      </svg>
    )
  },
  // 2. LÁPIZ Y LIBRETA (Notepad / Observaciones)
  {
    id: 'pencil-paper',
    title: 'Registrar Observaciones / Notas',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Libreta con espiral y líneas */}
        <rect x="6" y="5" width="16" height="22" rx="1" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5"/>
        <rect x="6" y="5" width="16" height="4" fill="#3b82f6"/>
        {/* Espiral */}
        <circle cx="9" cy="5" r="1.5" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.8"/>
        <circle cx="14" cy="5" r="1.5" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.8"/>
        <circle cx="19" cy="5" r="1.5" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.8"/>
        {/* Renglones */}
        <line x1="9" y1="13" x2="19" y2="13" stroke="#93c5fd" strokeWidth="1.5"/>
        <line x1="9" y1="18" x2="19" y2="18" stroke="#93c5fd" strokeWidth="1.5"/>
        <line x1="9" y1="23" x2="15" y2="23" stroke="#93c5fd" strokeWidth="1.5"/>
        {/* Lápiz clásico amarillo con borrador rojo */}
        <path d="M25 6L14 17L12 20L15 18L26 7L25 6Z" fill="#facc15" stroke="#1e293b" strokeWidth="1"/>
        <path d="M25 6L26 7" fill="#ef4444" stroke="#1e293b" strokeWidth="1.2"/>
        <path d="M12 20L13.5 19L12 20Z" fill="#000000"/>
      </svg>
    )
  },
  // 3. JERARQUÍA / NODOS (Green Table Schema)
  {
    id: 'hierarchy',
    title: 'Estructuras y Relaciones',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Conectores con estilo pixelado */}
        <path d="M16 8V18M8 18H24M8 18V25M24 18V25" stroke="#ef4444" strokeWidth="2" strokeLinecap="square"/>
        
        {/* Bloque superior principal */}
        <rect x="11" y="4" width="10" height="7" fill="#22c55e" stroke="#1e293b" strokeWidth="1.5"/>
        <rect x="13" y="6" width="6" height="3" fill="#86efac"/>
        
        {/* Bloques inferiores */}
        <rect x="3" y="21" width="10" height="7" fill="#22c55e" stroke="#1e293b" strokeWidth="1.5"/>
        <rect x="5" y="23" width="6" height="3" fill="#86efac"/>
        
        <rect x="19" y="21" width="10" height="7" fill="#22c55e" stroke="#1e293b" strokeWidth="1.5"/>
        <rect x="21" y="23" width="6" height="3" fill="#86efac"/>
      </svg>
    )
  },
  // 4. GRÁFICO DE LÍNEA (Line Chart)
  {
    id: 'line-chart',
    title: 'Estadísticas en Tiempo Real',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Marco y fondo */}
        <rect x="4" y="4" width="24" height="24" fill="#e0f2fe" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Ejes cartesianos */}
        <line x1="7" y1="6" x2="7" y2="25" stroke="#1e293b" strokeWidth="2"/>
        <line x1="7" y1="25" x2="26" y2="25" stroke="#1e293b" strokeWidth="2"/>
        {/* Línea de tendencia con degradado */}
        <path d="M7 21L12 14L17 18L25 8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="14" r="2" fill="#000000"/>
        <circle cx="17" cy="18" r="2" fill="#000000"/>
        <circle cx="25" cy="8" r="2" fill="#000000"/>
      </svg>
    )
  },
  // 5. GRÁFICO BARRAS DE COLORES (Bar Chart)
  {
    id: 'bar-chart',
    title: 'Frecuencia de Eventos',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="24" height="24" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Líneas horizontales */}
        <line x1="5" y1="10" x2="27" y2="10" stroke="#f1f5f9" strokeWidth="1.5"/>
        <line x1="5" y1="17" x2="27" y2="17" stroke="#f1f5f9" strokeWidth="1.5"/>
        {/* Barras 3D */}
        {/* Barra 1 - Amarilla */}
        <rect x="6" y="14" width="4" height="11" fill="#eab308" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="7" y="15" width="2" height="9" fill="#fef08a"/>
        {/* Barra 2 - Roja */}
        <rect x="11" y="8" width="4" height="17" fill="#ef4444" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="12" y="9" width="2" height="15" fill="#fca5a5"/>
        {/* Barra 3 - Azul */}
        <rect x="16" y="16" width="4" height="9" fill="#2563eb" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="17" y="17" width="2" height="7" fill="#93c5fd"/>
        {/* Barra 4 - Verde */}
        <rect x="21" y="11" width="4" height="14" fill="#22c55e" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="22" y="12" width="2" height="12" fill="#86efac"/>
      </svg>
    )
  },
  // 6. MATRIZ DE CELDAS (Zones Matrix)
  {
    id: 'zones-grid',
    title: 'Matriz de Zonas / Canales',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="24" height="20" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Celdas estilo pixel art */}
        <rect x="7" y="9" width="6" height="6" fill="#ef4444" stroke="#1e293b" strokeWidth="1"/>
        <rect x="8" y="10" width="4" height="4" fill="#fca5a5"/>
        
        <rect x="14" y="9" width="6" height="6" fill="#ffffff" stroke="#1e293b" strokeWidth="1"/>
        
        <rect x="21" y="9" width="6" height="6" fill="#ef4444" stroke="#1e293b" strokeWidth="1"/>
        <rect x="22" y="10" width="4" height="4" fill="#fca5a5"/>
        
        <rect x="7" y="17" width="6" height="6" fill="#ffffff" stroke="#1e293b" strokeWidth="1"/>
        
        <rect x="14" y="17" width="6" height="6" fill="#ef4444" stroke="#1e293b" strokeWidth="1"/>
        <rect x="15" y="18" width="4" height="4" fill="#fca5a5"/>
        
        <rect x="21" y="17" width="6" height="6" fill="#ffffff" stroke="#1e293b" strokeWidth="1"/>
      </svg>
    )
  },
  // 7. LISTA DE DETALLES (Checklist)
  {
    id: 'reports-list',
    title: 'Bitácoras de Sistema',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="4" width="22" height="24" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5"/>
        {/* List items con sombreado */}
        <rect x="8" y="8" width="4" height="4" fill="#475569" stroke="#1e293b" strokeWidth="0.8"/>
        <line x1="15" y1="10" x2="23" y2="10" stroke="#475569" strokeWidth="2"/>
        
        <rect x="8" y="15" width="4" height="4" fill="#475569" stroke="#1e293b" strokeWidth="0.8"/>
        <line x1="15" y1="17" x2="23" y2="17" stroke="#475569" strokeWidth="2"/>
        
        <rect x="8" y="22" width="4" height="4" fill="#475569" stroke="#1e293b" strokeWidth="0.8"/>
        <line x1="15" y1="24" x2="23" y2="24" stroke="#475569" strokeWidth="2"/>
      </svg>
    )
  },
  // 8. HOGAR / PLANOS (Home Map)
  {
    id: 'home-status',
    title: 'Estado de Abonados / Planos',
    renderSVG: () => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="24" height="24" fill="#bae6fd" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Techo rojo casa */}
        <path d="M5 14L15 6L25 14H5Z" fill="#ef4444" stroke="#1e293b" strokeWidth="1.2"/>
        {/* Cuerpo casa */}
        <rect x="7" y="14" width="16" height="12" fill="#fef08a" stroke="#1e293b" strokeWidth="1.2"/>
        {/* Puerta y ventana */}
        <rect x="13" y="19" width="4" height="7" fill="#78350f" stroke="#1e293b" strokeWidth="0.8"/>
        <rect x="9" y="16" width="3" height="3" fill="#3b82f6" stroke="#1e293b" strokeWidth="0.8"/>
        <rect x="20" y="16" width="3" height="3" fill="#3b82f6" stroke="#1e293b" strokeWidth="0.8"/>
      </svg>
    )
  },
  // 9. LUPA (Search)
  {
    id: 'search',
    title: 'Búsqueda de Eventos',
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
        {/* Cajón 1 */}
        <rect x="9" y="7" width="14" height="8" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="13" y="11" width="6" height="2" fill="#475569" stroke="#1e293b" strokeWidth="0.8"/>
        {/* Cajón 2 */}
        <rect x="9" y="17" width="14" height="8" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="13" y="21" width="6" height="2" fill="#475569" stroke="#1e293b" strokeWidth="0.8"/>
      </svg>
    )
  }
]

export default function FooterActions({ onModalOpen }: FooterActionsProps) {
  return (
    <footer className="shrink-0 bg-[#b0b0d0] border-t-2 border-white px-2 py-2 flex justify-center items-center">
      <div className="flex items-center gap-2">
        {BOTONES_RETRO.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onModalOpen(btn.id)}
            title={btn.title}
            className="w-14 h-14 bg-[#d0d0d0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 flex items-center justify-center cursor-pointer select-none hover:bg-[#d8d8d8] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white active:pt-1 active:pl-1 shadow-sm"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              {btn.renderSVG()}
            </div>
          </button>
        ))}
      </div>
    </footer>
  )
}
