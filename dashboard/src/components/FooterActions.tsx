'use client'

import { useState } from 'react'

interface FooterActionsProps {
  onModalOpen: (id: string) => void
}

interface BotonRetro {
  id: string
  title: string
  // Función que dibuja el SVG con el estilo de píxeles exacto de la foto
  renderSVG: () => React.ReactNode
}

const BOTONES_RETRO: BotonRetro[] = [
  // 1. LLAVE (Key)
  {
    id: 'key',
    title: 'Operadores y Accesos',
    renderSVG: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 14C4 11.7909 5.79086 10 8 10C9.6974 10 11.1444 11.06 11.7088 12.56L15 9.26795V7H17V9H19V11H17.5L14.7321 13.7679C14.8967 14.1528 14.9754 14.5684 14.9547 14.9897L11.7 18.2C11.1 19.3 9.7 20 8 20C5.79086 20 4 18.2091 4 16V14Z" fill="#eab308" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="8" cy="14" r="2" fill="#0f172a" />
      </svg>
    )
  },
  // 2. LÁPIZ Y LIBRETA (Notepad)
  {
    id: 'pencil-paper',
    title: 'Observaciones / Notas',
    renderSVG: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Libreta */}
        <rect x="5" y="4" width="12" height="16" rx="1" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5"/>
        <line x1="7" y1="8" x2="15" y2="8" stroke="#60a5fa" strokeWidth="1.5"/>
        <line x1="7" y1="12" x2="15" y2="12" stroke="#60a5fa" strokeWidth="1.5"/>
        <line x1="7" y1="16" x2="12" y2="16" stroke="#60a5fa" strokeWidth="1.5"/>
        {/* Lápiz */}
        <path d="M19.5 5.5L13.5 17.5L11 18L12.5 15.5L18.5 3.5L19.5 5.5Z" fill="#f97316" stroke="#1e293b" strokeWidth="1.2"/>
        <path d="M18.5 3.5L19.5 5.5" stroke="#ef4444" strokeWidth="1.5"/> {/* Borrador */}
      </svg>
    )
  },
  // 3. JERARQUÍA / ESTRUCTURA (Database)
  {
    id: 'hierarchy',
    title: 'Tablas de Estructura / Nodos',
    renderSVG: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Líneas rojas de unión */}
        <line x1="12" y1="4" x2="12" y2="12" stroke="#ef4444" strokeWidth="1.5"/>
        <line x1="6" y1="12" x2="18" y2="12" stroke="#ef4444" strokeWidth="1.5"/>
        <line x1="6" y1="12" x2="6" y2="19" stroke="#ef4444" strokeWidth="1.5"/>
        <line x1="18" y1="12" x2="18" y2="19" stroke="#ef4444" strokeWidth="1.5"/>
        
        {/* Nodos verdes */}
        <rect x="9" y="3" width="6" height="5" fill="#22c55e" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="3" y="15" width="6" height="5" fill="#22c55e" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="15" y="15" width="6" height="5" fill="#22c55e" stroke="#1e293b" strokeWidth="1.2"/>
      </svg>
    )
  },
  // 4. GRÁFICO DE LÍNEA (Line Chart)
  {
    id: 'line-chart',
    title: 'Estadísticas de Tráfico',
    renderSVG: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" fill="#93c5fd" fillOpacity="0.4" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Ejes */}
        <line x1="5" y1="5" x2="5" y2="19" stroke="#1e293b" strokeWidth="1.5"/>
        <line x1="5" y1="19" x2="20" y2="19" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Tendencia roja */}
        <path d="M5 16L9 11L13 14L19 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  // 5. GRÁFICO DE BARRAS (Bar Chart)
  {
    id: 'bar-chart',
    title: 'Reportes y Frecuencias',
    renderSVG: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Líneas horizontales de regla */}
        <line x1="4" y1="8" x2="20" y2="8" stroke="#e2e8f0" strokeWidth="1"/>
        <line x1="4" y1="13" x2="20" y2="13" stroke="#e2e8f0" strokeWidth="1"/>
        {/* Barras de colores */}
        <rect x="5" y="10" width="3" height="9" fill="#eab308" stroke="#1e293b" strokeWidth="1"/>
        <rect x="9" y="6" width="3" height="13" fill="#ef4444" stroke="#1e293b" strokeWidth="1"/>
        <rect x="13" y="12" width="3" height="7" fill="#2563eb" stroke="#1e293b" strokeWidth="1"/>
        <rect x="17" y="8" width="3" height="11" fill="#22c55e" stroke="#1e293b" strokeWidth="1"/>
      </svg>
    )
  },
  // 6. MATRIZ DE CELDAS (Zones Matrix)
  {
    id: 'zones-grid',
    title: 'Matriz de Estado / Particiones',
    renderSVG: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Marco negro general */}
        <rect x="3" y="5" width="18" height="14" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Celdas cuadriculadas */}
        <rect x="5" y="7" width="4" height="4" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8"/>
        <rect x="10" y="7" width="4" height="4" fill="#ffffff" stroke="#1e293b" strokeWidth="0.8"/>
        <rect x="15" y="7" width="4" height="4" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8"/>
        
        <rect x="5" y="13" width="4" height="4" fill="#ffffff" stroke="#1e293b" strokeWidth="0.8"/>
        <rect x="10" y="13" width="4" height="4" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8"/>
        <rect x="15" y="13" width="4" height="4" fill="#ffffff" stroke="#1e293b" strokeWidth="0.8"/>
      </svg>
    )
  },
  // 7. LISTA / REPORTES (Checklist)
  {
    id: 'reports-list',
    title: 'Bitácora y Listados',
    renderSVG: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="3" width="16" height="18" rx="1" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Bullet points con líneas */}
        <circle cx="7" cy="7" r="1.5" fill="#475569"/>
        <line x1="11" y1="7" x2="17" y2="7" stroke="#475569" strokeWidth="1.5"/>
        
        <circle cx="7" cy="12" r="1.5" fill="#475569"/>
        <line x1="11" y1="12" x2="17" y2="12" stroke="#475569" strokeWidth="1.5"/>
        
        <circle cx="7" cy="17" r="1.5" fill="#475569"/>
        <line x1="11" y1="17" x2="17" y2="17" stroke="#475569" strokeWidth="1.5"/>
      </svg>
    )
  },
  // 8. CASA / MAPA (Home status)
  {
    id: 'home-status',
    title: 'Monitoreo de Hogares / Mapa',
    renderSVG: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Fondo cielo celeste */}
        <rect x="3" y="3" width="18" height="18" fill="#bae6fd" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Casa */}
        <rect x="5" y="12" width="8" height="7" fill="#eab308" stroke="#1e293b" strokeWidth="1"/>
        <path d="M4 12L9 7L14 12H4Z" fill="#ef4444" stroke="#1e293b" strokeWidth="1"/>
        {/* Árbol */}
        <rect x="16" y="13" width="2" height="6" fill="#78350f"/>
        <circle cx="17" cy="11" r="3.5" fill="#22c55e" stroke="#1e293b" strokeWidth="1"/>
        {/* Camino gris */}
        <path d="M9 19L11 15L12 19" stroke="#94a3b8" strokeWidth="1.5"/>
      </svg>
    )
  },
  // 9. LUPA (Search)
  {
    id: 'search',
    title: 'Búsqueda Histórica',
    renderSVG: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="5" stroke="#1e293b" strokeWidth="2" fill="#e2e8f0"/>
        <line x1="14" y1="14" x2="19" y2="19" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    )
  },
  // 10. ARCHIVADOR / CAJÓN (Cabinet)
  {
    id: 'archive',
    title: 'Base de Datos / Historial Archivo',
    renderSVG: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Mueble gris */}
        <rect x="5" y="3" width="14" height="18" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.5"/>
        {/* Cajón Superior */}
        <rect x="7" y="5" width="10" height="6" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="10" y="8" width="4" height="1.5" fill="#475569"/> {/* Tirador */}
        {/* Cajón Inferior */}
        <rect x="7" y="13" width="10" height="6" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.2"/>
        <rect x="10" y="16" width="4" height="1.5" fill="#475569"/> {/* Tirador */}
      </svg>
    )
  }
]

export default function FooterActions({ onModalOpen }: FooterActionsProps) {
  return (
    <footer className="shrink-0 bg-[#b0b0d0] border-t-2 border-white px-2 py-1.5 flex justify-start items-center">
      {/* Contenedor de la barra de herramientas al estilo clásico de 16 bits */}
      <div className="flex items-center gap-1">
        {BOTONES_RETRO.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onModalOpen(btn.id)}
            title={btn.title}
            className="w-10 h-10 bg-[#d0d0d0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 flex items-center justify-center cursor-pointer select-none hover:bg-[#d8d8d8] active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white active:pt-1 active:pl-1"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {btn.renderSVG()}
            </div>
          </button>
        ))}
      </div>
    </footer>
  )
}
