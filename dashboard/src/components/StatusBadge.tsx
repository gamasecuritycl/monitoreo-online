'use client'

interface StatusBadgeProps {
  tipo: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'ALARMA DE ROBO': { label: 'ROBO', color: 'text-white', bg: 'bg-[#FF4D4D]' },
  'ALARMA DE ASALTO': { label: 'ASALTO', color: 'text-white', bg: 'bg-[#DC2626]' },
  'EMERGENCIA MEDICA': { label: 'MEDICA', color: 'text-white', bg: 'bg-[#DC2626]' },
  'PANICO': { label: 'PANICO', color: 'text-white', bg: 'bg-[#DC2626]' },
  'INCENDIO': { label: 'INCENDIO', color: 'text-white', bg: 'bg-[#DC2626]' },
  'CIERRE': { label: 'CIERRE', color: 'text-gray-700', bg: 'bg-gray-100' },
  'CIERRE ESPECIAL': { label: 'CIERRE ESP', color: 'text-gray-700', bg: 'bg-gray-100' },
  'APERTURA': { label: 'APERTURA', color: 'text-cyan-900', bg: 'bg-cyan-100' },
  'AUTOTEST': { label: 'AUTOTEST', color: 'text-white', bg: 'bg-[#9CA3AF]' },
  'TRANSMISION PERIODICA': { label: 'AUTOTEST', color: 'text-white', bg: 'bg-[#9CA3AF]' },
  'RESTABLECIMIENTO ROBO': { label: 'REST. ROBO', color: 'text-black', bg: 'bg-[#FFFF00]' },
  'RESTABLECIMIENTO ASALTO': { label: 'REST. ASALTO', color: 'text-black', bg: 'bg-[#FFFF00]' },
  'RESTABLECIMIENTO MEDICO': { label: 'REST. MEDICO', color: 'text-black', bg: 'bg-[#FFFF00]' },
  'HA': { label: 'ASALTO', color: 'text-white', bg: 'bg-[#DC2626]' },
  'BH': { label: 'REST. ROBO', color: 'text-black', bg: 'bg-[#FFFF00]' },
  'MA': { label: 'MEDICA', color: 'text-white', bg: 'bg-[#DC2626]' },
  'MH': { label: 'REST. MEDICO', color: 'text-black', bg: 'bg-[#FFFF00]' },
}

export default function StatusBadge({ tipo }: StatusBadgeProps) {
  const config = STATUS_CONFIG[tipo] || { label: tipo, color: 'text-white', bg: 'bg-slate-600' }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  )
}
