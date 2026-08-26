'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  Clock,
  Users,
  FileText,
  Settings,
  PhoneCall,
  BellRing,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  LogOut,
  Sparkles,
  Zap,
  Lock,
  Unlock,
  Radio,
  Building2,
  Home,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesMap = clientesDataRaw as Record<string, Record<string, string>>

// Menú lateral
const NAV_ITEMS = [
  { id: 'inicio', label: 'Resumen General', icon: ShieldCheck },
  { id: 'camaras', label: 'Cámaras en Vivo', icon: Camera, badge: 'HD 4K' },
  { id: 'historial', label: 'Línea de Tiempo', icon: Clock },
  { id: 'contactos', label: 'Contactos Autorizados', icon: Users },
  { id: 'servicios', label: 'Estado del Servicio', icon: FileText },
  { id: 'soporte', label: 'Asistencia SOS 24/7', icon: PhoneCall, highlight: true },
]

export default function AreaClientesPortal() {
  const [cuentaActiva, setCuentaActiva] = useState<string>('0014')
  const [activeTab, setActiveTab] = useState<string>('inicio')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [sistemaArmado, setSistemaArmado] = useState(true)
  const [modalSos, setModalSos] = useState(false)
  const [tiempoSaludo, setTiempoSaludo] = useState('Buenas tardes')
  const [busqueda, setBusqueda] = useState('')

  // Obtener datos del cliente seleccionado
  const clienteInfo = clientesMap[cuentaActiva] || {
    NOMBRE: 'RESIDENCIA EJECUTIVA GAMA',
    DIRECCION: 'Av. Las Condes 1234, Santiago',
    CIUDAD: 'Las Condes',
    ESTADO: 'ACTIVO 24/7',
  }

  // Determinar saludo según la hora local
  useEffect(() => {
    const hora = new Date().getHours()
    if (hora >= 6 && hora < 12) setTiempoSaludo('Buenos días')
    else if (hora >= 12 && hora < 20) setTiempoSaludo('Buenas tardes')
    else setTiempoSaludo('Buenas noches')
  }, [])

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-[#2997ff]/30 selection:text-white overflow-x-hidden">
      
      {/* Dynamic Ambient Background Blur Elements */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#0066cc]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-[#0a2540]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className="flex flex-1 min-h-screen relative">

        {/* ════════════════════════════════════════════════════════════════════
           SIDEBAR LATERAL ELEGANTE CON OCTÁGONO GRANDE
           ════════════════════════════════════════════════════════════════════ */}
        <aside
          className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-[#09111e]/90 backdrop-blur-2xl border-r border-[#1a2e4a]/60 transition-all duration-300 flex flex-col justify-between ${
            isSidebarOpen ? 'w-72' : 'w-20'
          }`}
        >
          <div className="p-5 flex flex-col items-center">
            
            {/* OCTÁGONO AISLADO GRANDE DE LA EMPRESA */}
            <div className="relative group cursor-pointer my-2 flex flex-col items-center">
              {/* Resplandor led perimetral */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#0066cc] via-[#2997ff] to-amber-500/40 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
              
              {/* Marco Octogonal Estilizado */}
              <div className="relative w-24 h-24 bg-[#0a1628] border border-[#2a4875] rounded-2xl p-3 flex items-center justify-center shadow-2xl shadow-[#0066cc]/20 transition-transform duration-300 group-hover:scale-105">
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <Image
                  src="/logo-gama.png"
                  alt="GAMA Security Octágono"
                  width={72}
                  height={72}
                  className="object-contain filter drop-shadow(0 4px 12px rgba(0,102,204,0.5))"
                  priority
                />
              </div>

              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-center"
                >
                  <h2 className="text-white font-bold text-lg tracking-wider uppercase font-mono">
                    GAMA<span className="text-[#2997ff]">SECURITY</span>
                  </h2>
                  <p className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">
                    Área Exclusiva Clientes
                  </p>
                </motion.div>
              )}
            </div>

            {/* Separador brillante */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#1e3a5f] to-transparent my-6" />

            {/* NAVEGACIÓN LATERAL */}
            <nav className="w-full space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0066cc]/20 to-[#0f2847] text-white border border-[#2997ff]/40 shadow-lg shadow-[#0066cc]/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#111f35]/60 border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-2 bottom-2 w-1 bg-[#2997ff] rounded-r-full"
                      />
                    )}
                    
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        isActive
                          ? 'text-[#2997ff]'
                          : item.highlight
                          ? 'text-amber-400 group-hover:text-amber-300'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {isSidebarOpen && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}

                    {isSidebarOpen && item.badge && (
                      <span className="text-[10px] bg-[#2997ff]/20 text-[#2997ff] px-2 py-0.5 rounded-full font-mono font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* PERFIL / PIE DE SIDEBAR */}
          {isSidebarOpen && (
            <div className="p-4 m-3 bg-[#0a1628]/80 border border-[#1e3a5f]/60 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center font-bold text-white text-xs border border-blue-400/30">
                  {cuentaActiva.slice(0, 3)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">
                    Abonado #{cuentaActiva}
                  </p>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cliente VIP
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ════════════════════════════════════════════════════════════════════
           CONTENIDO PRINCIPAL - EXECUTIVE VIP DASHBOARD
           ════════════════════════════════════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          
          {/* ── HEADER SUPERIOR / BARRA DE ACCIÓN ── */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a2e4a]/60 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#2997ff] mb-1">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                CONEXIÓN SEGURA EN TIEMPO REAL · GAMA CENTRAL
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {tiempoSaludo}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">{clienteInfo.NOMBRE}</span>
              </h1>
              <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                {clienteInfo.DIRECCION} — {clienteInfo.CIUDAD}
              </p>
            </div>

            {/* Selector rápido de propiedad + Botón SOS */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalSos(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95 border border-red-400/30"
              >
                <BellRing className="w-4 h-4 animate-bounce" />
                Asistencia SOS 24/7
              </button>

              <button
                onClick={() => setSistemaArmado(!sistemaArmado)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                  sistemaArmado
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                }`}
              >
                {sistemaArmado ? <Lock className="w-4 h-4 text-emerald-400" /> : <Unlock className="w-4 h-4 text-amber-400" />}
                {sistemaArmado ? 'Sistema Armado' : 'Sistema Desarmado'}
              </button>
            </div>
          </header>

          {/* ── BANNER ELEGANTE DE ESTADO GLOBAL DE TRANQUILIDAD ── */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1a2e] via-[#091526] to-[#050b14] border border-[#1e3e6b]/60 p-6 sm:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#2997ff]/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Bloque Izquierdo: Anillo de Protección y Mensaje */}
              <div className="flex items-start sm:items-center gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-20 pointer-events-none" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Protección Completa Activa
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Su propiedad se encuentra 100% resguardada
                  </h3>
                  <p className="text-slate-400 text-sm mt-1 max-w-xl">
                    Monitoreo en tiempo real sin novedades críticas registradas durante las últimas 24 horas. Comunicación GPRS/IP estable.
                  </p>
                </div>
              </div>

              {/* Bloque Derecho: Métricas de Tranquilidad */}
              <div className="grid grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-[#1e3a5f]/60 pt-4 lg:pt-0 lg:pl-8">
                <div className="bg-[#091424]/80 p-4 rounded-2xl border border-[#1a3356]/60">
                  <span className="text-[11px] text-slate-400 font-medium">Test de Enlace</span>
                  <p className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    OK · En línea
                  </p>
                </div>
                <div className="bg-[#091424]/80 p-4 rounded-2xl border border-[#1a3356]/60">
                  <span className="text-[11px] text-slate-400 font-medium">Batería de Respaldo</span>
                  <p className="text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    100% Carga
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* ── TARJETAS EXECUTIVE DE RESUMEN INTELIGENTE ── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tarjeta 1: IA Security Assistant */}
            <div className="bg-[#0b1526]/80 backdrop-blur-xl border border-[#1a3356]/60 rounded-2xl p-6 relative overflow-hidden group hover:border-[#2997ff]/40 transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#2997ff]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-slate-400">Resumen Inteligente</span>
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Diagnóstico Diario IA</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                "Apertura habitual detectada hoy a las 08:32 hrs. Todos los sensores perimetrales e infrarrojos responden correctamente sin falsas alarmas."
              </p>
            </div>

            {/* Tarjeta 2: Última Actividad Registrar */}
            <div className="bg-[#0b1526]/80 backdrop-blur-xl border border-[#1a3356]/60 rounded-2xl p-6 relative overflow-hidden group hover:border-[#2997ff]/40 transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-slate-400">Último Evento</span>
              </div>
              <h4 className="text-white font-semibold text-base mb-2">Apertura de Sistema (Desarme)</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Registrado hoy a las <span className="text-white font-semibold">08:32:15 AM</span> por usuario autorizador 01.
              </p>
            </div>

            {/* Tarjeta 3: Cámaras Destacadas */}
            <div className="bg-[#0b1526]/80 backdrop-blur-xl border border-[#1a3356]/60 rounded-2xl p-6 relative overflow-hidden group hover:border-[#2997ff]/40 transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-slate-400">Video Verificación</span>
              </div>
              <h4 className="text-white font-semibold text-base mb-2">4 Cámaras Conectadas</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Transmisión activa con analítica HD habilitada. Haz clic en "Cámaras" para ver en tiempo real.
              </p>
            </div>

          </section>

          {/* ── LÍNEA DE TIEMPO VISUAL ELEGANTE (TIMELINE RECIENTE) ── */}
          <section className="bg-[#0b1526]/80 backdrop-blur-xl border border-[#1a3356]/60 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a2e4a]/60">
              <div>
                <h3 className="text-lg font-bold text-white">Línea de Tiempo de Eventos</h3>
                <p className="text-xs text-slate-400">Eventos de seguridad y actividad reciente en su propiedad</p>
              </div>
              <button
                onClick={() => setActiveTab('historial')}
                className="text-xs text-[#2997ff] hover:underline font-semibold flex items-center gap-1"
              >
                Ver todo el historial <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { hora: '08:32 AM', titulo: 'Desarme de Sistema (Apertura)', desc: 'Usuario #01 (Administrador)', tipo: 'apertura', color: 'emerald' },
                { hora: '03:15 AM', titulo: 'Test Autocontrol Diario', desc: 'Verificación de canal GPRS/IP Gama OK', tipo: 'test', color: 'blue' },
                { hora: '20:10 PM (Ayer)', titulo: 'Armado de Sistema (Cierre)', desc: 'Usuario #01 - Modo Noche', tipo: 'cierre', color: 'amber' },
              ].map((evt, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3.5 rounded-xl bg-[#08111e] border border-[#162a45] hover:border-[#224470] transition">
                  <div className={`w-3 h-3 rounded-full bg-${evt.color}-400 shadow-md shadow-${evt.color}-400/50`} />
                  <span className="text-xs font-mono text-slate-400 w-28">{evt.hora}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{evt.titulo}</p>
                    <p className="text-xs text-slate-400">{evt.desc}</p>
                  </div>
                  <span className="text-[11px] text-[#2997ff] font-mono font-medium">Verificado</span>
                </div>
              ))}
            </div>
          </section>

        </main>

      </div>

      {/* ── MODAL SOS ASISTENCIA 24/7 ── */}
      <AnimatePresence>
        {modalSos && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1829] border border-red-500/40 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-400">
                <BellRing className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-white">Solicitud de Asistencia VIP</h3>
              <p className="text-xs text-slate-300 mt-2">
                Al confirmar, se establecerá contacto telefónico directo e inmediato con la Central de Monitoreo Gama Security.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href="tel:+56912345678"
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-red-900/40 flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  Llamar a Central Gama Ahora
                </a>
                <button
                  onClick={() => setModalSos(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
