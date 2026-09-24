'use client'

import type { EventoMonitoreo } from '@/lib/supabase'
import { lookupContactId } from '@/lib/contact_id_library'

interface StatsBarProps {
  eventos: EventoMonitoreo[]
}

export default function StatsBar({ eventos }: StatsBarProps) {
  const total = eventos.length

  const getDesc = (e: EventoMonitoreo) => {
    const cid = lookupContactId(e.evento)
    return (cid?.descripcion || e.evento || '').toUpperCase().trim()
  }

  const alertas = eventos.filter(e => {
    const desc = getDesc(e)
    const raw = (e.evento || '').toUpperCase().trim()
    return (
      desc.includes('ROBO') ||
      desc.includes('PANICO') ||
      desc.includes('PÁNICO') ||
      desc.includes('ASALTO') ||
      desc.includes('ATRACO') ||
      desc.includes('INCENDIO') ||
      desc.includes('FUEGO') ||
      desc.includes('MEDICA') ||
      desc.includes('MÉDICA') ||
      ['HA', 'MA', 'PA', 'FA', 'BA'].includes(raw)
    ) && !desc.includes('RESTABLEC')
  }).length

  const cierres = eventos.filter(e => {
    const desc = getDesc(e)
    const raw = (e.evento || '').toUpperCase().trim()
    return desc.includes('CIERRE') || ['CL', 'CP', 'CA', 'CG'].includes(raw)
  }).length

  const aperturas = eventos.filter(e => {
    const desc = getDesc(e)
    const raw = (e.evento || '').toUpperCase().trim()
    return desc.includes('APERTURA') || ['OP', 'OA', 'OG'].includes(raw)
  }).length

  const autotests = eventos.filter(e => {
    const desc = getDesc(e)
    const raw = (e.evento || '').toUpperCase().trim()
    return desc.includes('AUTOTEST') || desc.includes('TRANSMISION PERIODICA') || ['RP', 'TX', 'RX'].includes(raw)
  }).length

  const stats = [
    { label: 'Total Eventos', value: total, color: 'text-slate-200', icon: '📊' },
    { label: 'Alertas Activas', value: alertas, color: 'text-[#FF4D4D]', icon: '🚨' },
    { label: 'Cierres', value: cierres, color: 'text-[#3B82F6]', icon: '🔒' },
    { label: 'Aperturas', value: aperturas, color: 'text-[#22C55E]', icon: '🔓' },
    { label: 'Autotests', value: autotests, color: 'text-[#9CA3AF]', icon: '⚙️' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 backdrop-blur"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{stat.icon}</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</span>
          </div>
          <div className={`text-2xl font-bold ${stat.color}`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  )
}
