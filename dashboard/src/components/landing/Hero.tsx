'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const EVENTS = [
  { code: 'E131', zone: 'Zona 01', account: 'CL-4421', type: 'ALARMA', color: '#ef4444' },
  { code: 'E602', zone: 'Zona 03', account: 'CL-2187', type: 'OK', color: '#22c55e' },
  { code: 'E130', zone: 'Perimetral', account: 'CL-0933', type: 'ALARMA', color: '#ef4444' },
  { code: 'R401', zone: 'Zona 02', account: 'CL-5512', type: 'RESTAU', color: '#f59e0b' },
  { code: 'E602', zone: 'Zona 05', account: 'CL-3341', type: 'OK', color: '#22c55e' },
  { code: 'E110', zone: 'Zona 01', account: 'CL-1198', type: 'FUEGO', color: '#f97316' },
  { code: 'E131', zone: 'Zona 04', account: 'CL-7723', type: 'ALARMA', color: '#ef4444' },
  { code: 'R131', zone: 'Zona 01', account: 'CL-4421', type: 'RESTAU', color: '#f59e0b' },
]

function LiveTerminal() {
  const [lines, setLines] = useState<typeof EVENTS>([])
  const [count, setCount] = useState(0)
  const idxRef = useRef(0)

  useEffect(() => {
    const add = () => {
      const ev = EVENTS[idxRef.current % EVENTS.length]
      idxRef.current++
      setLines(prev => [ev, ...prev].slice(0, 6))
      setCount(prev => prev + 1)
    }
    add()
    const id = setInterval(add, 2400)
    return () => clearInterval(id)
  }, [])

  const now = () => new Date().toLocaleTimeString('es-CL', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  return (
    <div className="relative bg-[#050810]/90 border border-sky-500/20 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(14,165,233,0.08)] backdrop-blur-sm">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="ml-2 text-[10px] text-gray-500 font-mono">central.scorpion — eventos en vivo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-red" />
          <span className="text-[9px] text-red-400 font-mono tracking-widest">REC</span>
        </div>
      </div>

      {/* Scan line */}
      <div className="absolute inset-x-0 top-10 z-10 pointer-events-none">
        <div className="scan-sweep" />
      </div>

      {/* Events */}
      <div className="p-4 space-y-1.5 font-mono text-[11px] min-h-[200px]">
        {lines.length === 0 && (
          <div className="text-gray-600 flex items-center gap-2">
            <span className="cursor-blink">█</span>
            <span>Conectando a central...</span>
          </div>
        )}
        {lines.map((ev, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-gray-400 animate-fade-in"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <span className="text-gray-600">{now()}</span>
            <span style={{ color: ev.color }} className="font-bold">[{ev.type}]</span>
            <span className="text-sky-400">{ev.code}</span>
            <span className="text-gray-500">{ev.account}</span>
            <span className="text-gray-300">{ev.zone}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
        <span className="text-[9px] text-gray-600 font-mono">SCORPION v4.2 · CONNECTED</span>
        <span className="text-[9px] font-mono text-sky-400/70 stat-number">{count} eventos procesados</span>
      </div>
    </div>
  )
}

function useCountUp(target: number, duration: number = 2000) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const steps = 50
    const inc = target / steps
    let current = 0
    const id = setInterval(() => {
      current += inc
      if (current >= target) { setValue(target); clearInterval(id) }
      else setValue(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(id)
  }, [started, target, duration])

  return { value, ref }
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { value: v, ref } = useCountUp(value)
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl font-black text-white stat-number tabular-nums">
        {v}{suffix}
      </div>
      <div className="text-[10px] text-gray-500 mt-1.5 tracking-[0.2em] font-mono uppercase">{label}</div>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden bg-[#050810]">

      {/* Tech grid base */}
      <div className="absolute inset-0 tech-grid opacity-100" />

      {/* Aurora blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-3xl max-h-3xl rounded-full bg-sky-500/6 blur-[120px] animate-aurora1 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] max-w-2xl max-h-2xl rounded-full bg-purple-600/6 blur-[100px] animate-aurora2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-[40vw] h-[40vw] rounded-full bg-blue-600/5 blur-[80px] animate-aurora3 pointer-events-none" />

      {/* Scanlines */}
      <div className="scanlines" />

      {/* REC indicator */}
      <div className="absolute top-24 left-6 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/5 rounded-lg px-3 py-1.5">
        <div className="rec-dot" />
        <span className="text-[10px] text-red-400 font-mono tracking-widest uppercase">Monitoreo 24/7</span>
      </div>

      {/* Alert badge */}
      <div className="absolute top-24 right-6 z-10 hidden sm:flex animate-warn-pulse">
        <div className="bg-amber-500/10 border border-amber-400/40 rounded-xl px-4 py-2.5 backdrop-blur-sm flex items-center gap-3 shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] text-amber-400/80 font-mono tracking-widest uppercase">Central Activa</div>
            <div className="text-xs font-bold text-amber-400">GAMA SEGURIDAD</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Text */}
          <div className="text-center lg:text-left">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.07] text-xs text-sky-300/70 mb-8 tracking-wider font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-live" />
              Sistema Activo · Santiago, Chile
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.95] mb-6 tracking-tight">
              Seguridad{' '}
              <span className="gradient-text-blue block mt-1">
                sin límites
              </span>
              <span className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-400">las 24 horas</span>
            </h1>

            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Protegemos tu hogar y empresa con tecnología de monitoreo de última generación.
              Central operativa <strong className="text-white font-semibold">24/7/365</strong>,
              respuesta en menos de 2 minutos, cobertura en todo Chile.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-14">
              <Link
                href="#contacto"
                className="btn-premium btn-3d-glow w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-b from-sky-500 to-sky-700 text-white font-bold px-8 py-4 rounded-xl text-base shadow-xl shadow-sky-600/25"
                onClick={(e) => { e.preventDefault(); document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }) }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Solicitar Cotización Gratis
              </Link>
              <button
                onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-3d w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold px-8 py-4 rounded-xl border border-white/[0.09] text-base transition-colors duration-200"
              >
                Ver Servicios
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 max-w-sm mx-auto lg:mx-0 border-t border-white/[0.06] pt-8">
              <StatCounter value={15} suffix="+" label="Años" />
              <StatCounter value={500} suffix="+" label="Clientes" />
              <StatCounter value={24} suffix="/7" label="Cobertura" />
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-white">&lt;2'</div>
                <div className="text-[10px] text-gray-500 mt-1.5 tracking-[0.2em] font-mono uppercase">Respuesta</div>
              </div>
            </div>
          </div>

          {/* Right: Live Terminal */}
          <div className="relative animate-float-slow">
            {/* Glow behind terminal */}
            <div className="absolute inset-0 bg-sky-500/8 blur-[80px] rounded-3xl" />
            <div className="relative">
              <LiveTerminal />
              {/* Floating decorative cards */}
              <div className="absolute -top-4 -left-4 bg-green-500/10 border border-green-400/20 rounded-xl px-3 py-2 backdrop-blur-sm animate-float">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-live" />
                  <span className="text-[11px] text-green-400 font-mono font-bold">ONLINE</span>
                </div>
                <div className="text-[9px] text-green-300/60 font-mono mt-0.5">Sistema operativo</div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-sky-500/10 border border-sky-400/20 rounded-xl px-3 py-2 backdrop-blur-sm animate-float-delay">
                <div className="text-[10px] text-sky-400 font-mono font-bold">SCORPION</div>
                <div className="text-[9px] text-sky-300/60 font-mono">Platform v4.2</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050810] to-transparent pointer-events-none" />

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">Scroll</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-gray-500 to-transparent animate-pulse" />
      </div>
    </section>
  )
}
