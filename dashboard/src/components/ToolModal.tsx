'use client'

import { useEffect } from 'react'

interface ToolModalProps {
  modalId: string
  onClose: () => void
}

const MODAL_TITLES: Record<string, { titulo: string; desc: string }> = {
  'tools': { titulo: 'HERRAMIENTAS', desc: 'Panel de herramientas del sistema de monitoreo.' },
  'user-key': { titulo: 'USUARIOS Y CLAVES', desc: 'Gestión de usuarios y credenciales de acceso.' },
  'file-edit': { titulo: 'ARCHIVOS Y EDICIÓN', desc: 'Editor de configuraciones y archivos del sistema.' },
  'network': { titulo: 'RED Y JERARQUÍA', desc: 'Topología de red y jerarquía de dispositivos.' },
  'shield': { titulo: 'SEGURIDAD', desc: 'Panel de seguridad y control de accesos.' },
  'book': { titulo: 'BIBLIOTECA', desc: 'Biblioteca de manuales y documentación técnica.' },
  'grid-check': { titulo: 'VALIDACIÓN', desc: 'Validación de eventos y cruce de datos.' },
  'list-details': { titulo: 'DETALLES', desc: 'Listado detallado de eventos por abonado.' },
  'home': { titulo: 'INICIO', desc: 'Dashboard principal y resumen del sistema.' },
  'search': { titulo: 'BÚSQUEDA AVANZADA', desc: 'Búsqueda avanzada de eventos y abonados.' },
  'archive': { titulo: 'ARCHIVO HISTÓRICO', desc: 'Archivo histórico de eventos y respaldos.' },
}

export default function ToolModal({ modalId, onClose }: ToolModalProps) {
  const info = MODAL_TITLES[modalId] || { titulo: 'MÓDULO', desc: 'Módulo en desarrollo.' }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md mx-4 bg-[#0d1225] border border-[#1a2340] rounded-xl shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2340]">
          <h2 className="text-sm font-bold text-white tracking-wider">{info.titulo}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-lg leading-none">&times;</button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-400">{info.desc}</p>
          <div className="mt-4 p-3 bg-[#0a0e1a] rounded-lg border border-[#1a2340]">
            <p className="text-xs text-slate-500">
              Este módulo está disponible en la versión completa. Presione ESC para cerrar.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#1a2340]">
          <button onClick={onClose} className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
