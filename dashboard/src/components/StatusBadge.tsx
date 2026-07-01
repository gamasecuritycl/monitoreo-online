'use client'

interface StatusBadgeProps {
  tipo: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'ALARMA DE ROBO': { label: 'ALERTA', color: 'text-white', bg: 'bg-[#FF4D4D]' },
  'PANICO': { label: 'PANICO', color: 'text-white', bg: 'bg-[#FF4D4D]' },
  'INCENDIO': { label: 'INCENDIO', color: 'text-white', bg: 'bg-[#FF4D4D]' },
  'CIERRE': { label: 'CIERRE', color: 'text-white', bg: 'bg-[#3B82F6]' },
  'CIERRE ESPECIAL': { label: 'CIERRE ESP', color: 'text-white', bg: 'bg-[#3B82F6]' },
  'APERTURA': { label: 'APERTURA', color: 'text-white', bg: 'bg-[#22C55E]' },
  'AUTOTEST': { label: 'AUTOTEST', color: 'text-white', bg: 'bg-[#9CA3AF]' },
}

export default function StatusBadge({ tipo }: StatusBadgeProps) {
  const config = STATUS_CONFIG[tipo] || { label: tipo, color: 'text-white', bg: 'bg-slate-600' }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  )
}
