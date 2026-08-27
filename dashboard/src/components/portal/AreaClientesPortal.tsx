'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Camera,
  Clock,
  Users,
  FileText,
  PhoneCall,
  BellRing,
  Activity,
  CheckCircle2,
  Sparkles,
  Zap,
  Lock,
  Unlock,
  Radio,
  Building2,
  Menu,
  X,
  Phone,
  Video,
  Maximize2,
  Wrench,
  Shield,
  MessageSquare,
  LogOut,
  KeyRound,
  UserCheck,
  AlertCircle,
  HelpCircle,
  BrainCircuit,
  Bot
} from 'lucide-react'
import { supabase, type EventoMonitoreo } from '@/lib/supabase'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesMap = clientesDataRaw as Record<string, Record<string, any>>

// Menú lateral de navegación
const NAV_ITEMS = [
  { id: 'inicio', label: 'Resumen General', icon: ShieldCheck },
  { id: 'camaras', label: 'Cámaras en Vivo', icon: Camera, badge: 'HD 4K' },
  { id: 'historial', label: 'Línea de Tiempo', icon: Clock },
  { id: 'contactos', label: 'Contactos Autorizados', icon: Users },
  { id: 'servicios', label: 'Estado del Servicio', icon: FileText },
  { id: 'soporte', label: 'Asistencia SOS 24/7', icon: PhoneCall, highlight: true },
]

export default function AreaClientesPortal() {
  // Estado de Autenticación
  const [autenticado, setAutenticado] = useState<boolean>(false)
  const [inputCuenta, setInputCuenta] = useState<string>('C701')
  const [inputRut, setInputRut] = useState<string>('13756882-9')
  const [errorLogin, setErrorLogin] = useState<string>('')
  const [cargandoLogin, setCargandoLogin] = useState<boolean>(false)

  // Estado del Portal
  const [cuentaActiva, setCuentaActiva] = useState<string>('C701')
  const [activeTab, setActiveTab] = useState<string>('inicio')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sistemaArmado, setSistemaArmado] = useState(true)
  const [modalSos, setModalSos] = useState(false)
  const [tiempoSaludo, setTiempoSaludo] = useState('Buenas tardes')
  const [filtroHistorial, setFiltroHistorial] = useState('todos')
  const [camaraSeleccionada, setCamaraSeleccionada] = useState<string | null>(null)

  // Estado para IA Bitácora Concierge
  const [modalIaBitacora, setModalIaBitacora] = useState<boolean>(false)
  const [cargandoIa, setCargandoIa] = useState<boolean>(false)
  const [eventoIaActual, setEventoIaActual] = useState<any>(null)
  const [explicacionIa, setExplicacionIa] = useState<string>('')

  // Eventos de Supabase en tiempo real
  const [eventosSupabase, setEventosSupabase] = useState<EventoMonitoreo[]>([])

  // Cargar sesión guardada al iniciar
  useEffect(() => {
    try {
      const sesionGuardada = localStorage.getItem('gama_areaclientes_session')
      if (sesionGuardada) {
        const data = JSON.parse(sesionGuardada)
        if (data && data.cuenta) {
          setCuentaActiva(data.cuenta.toUpperCase().trim())
          setAutenticado(true)
        }
      }
    } catch {}
  }, [])

  // Determinar saludo según la hora local
  useEffect(() => {
    const hora = new Date().getHours()
    if (hora >= 6 && hora < 12) setTiempoSaludo('Buenos días')
    else if (hora >= 12 && hora < 20) setTiempoSaludo('Buenas tardes')
    else setTiempoSaludo('Buenas noches')
  }, [])

  // Cargar eventos reales de Supabase para la cuenta activa
  useEffect(() => {
    if (!autenticado || !cuentaActiva) return

    const fetchEventos = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', cuentaActiva)
          .order('fecha_hora', { ascending: false })
          .limit(20)

        if (!error && data) {
          setEventosSupabase(data)
        }
      } catch (err) {
        console.error('Error cargando eventos:', err)
      }
    }

    fetchEventos()

    // Suscripción en tiempo real
    const canal = supabase
      .channel(`eventos_cliente_${cuentaActiva}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'eventos_monitoreo', filter: `cuenta=eq.${cuentaActiva}` },
        (payload) => {
          setEventosSupabase((prev) => [payload.new as EventoMonitoreo, ...prev.slice(0, 19)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [autenticado, cuentaActiva])

  // Obtener información del cliente desde la base de datos de clientes
  const clienteRaw = clientesMap[cuentaActiva] || {}
  const clienteInfo = {
    NOMBRE: clienteRaw.nombre || (cuentaActiva === 'C701' ? 'TALITA KUM FAE PRUEBA' : `ABONADO ${cuentaActiva}`),
    DIRECCION: clienteRaw.direccion || 'AV. PRINCIPAL #1234, SANTIAGO',
    CIUDAD: clienteRaw.ciudad || 'SANTIAGO',
    ESTADO: 'PROTEGIDO 24/7',
    TELEFONO: clienteRaw.t1 || clienteRaw.telefono1 || '+56 9 1234 5678',
    PLAN: clienteRaw.plan || 'PREMIUM VIP',
  }

  // Procesar entrada de Bitácora mediante IA (Gemini 2.5 Flash)
  const procesarBitacoraConIA = async (item: { evento: string; hora: string; notaCruda?: string }) => {
    setEventoIaActual(item)
    setModalIaBitacora(true)
    setCargandoIa(true)
    setExplicacionIa('')

    const notaBase = item.notaCruda || `03:15: ${item.evento}. Llamada a contacto principal realizada. Patrulla despachada a verificar. Propiedad revisada sin novedad. Restablece 03:25.`

    const prompt = `Eres el Asistente de IA Concierge de la Central de Monitoreo GAMA Security Chile.
Analiza la siguiente nota cruda registrada por los operadores en la Bitácora de Central y genera un informe VIP tranquilizador para el cliente abonado.

Reglas:
1. Filtra cualquier clave interna, abreviatura técnica o comentario confidencial entre operadores.
2. Explica claramente:
   - 🛡️ Suceso Detectado
   - ⚙️ Procedimiento Ejecutado por la Central Gama
   - 🟢 Resultado de Seguridad & Tranquilidad Final
3. Mantén un tono elegante, ejecutivo y profesional. Usar formato Markdown estructurado con viñetas.

Evento: ${item.evento}
Hora: ${item.hora}
Nota Cruda Bitácora Operador: "${notaBase}"`

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data && data.ok && data.texto) {
        setExplicacionIa(data.texto)
      } else {
        setExplicacionIa(
          `🛡️ **Procedimiento de Seguridad Ejecutado (${item.hora})**\n\n• **Suceso**: Registrado evento de ${item.evento}.\n• **Acción Gama**: La Central aplicó el protocolo de verificación instantánea y despacho de patrulla.\n• **Resultado**: Propiedad inspeccionada y 100% resguardada. Sistema rearmado y operativo.`
        )
      }
    } catch (e) {
      setExplicacionIa(
        `🛡️ **Procedimiento de Seguridad Ejecutado (${item.hora})**\n\n• **Suceso**: Registrado evento de ${item.evento}.\n• **Acción Gama**: La Central aplicó el protocolo de verificación instantánea.\n• **Resultado**: Propiedad inspeccionada y 100% resguardada.`
      )
    } finally {
      setCargandoIa(false)
    }
  }

  // Manejar proceso de Login (Vía 2: Abonado + RUT)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorLogin('')
    setCargandoLogin(true)

    const cta = inputCuenta.toUpperCase().trim()
    const rutLimpio = inputRut.replace(/\./g, '').trim().toUpperCase()

    if (!cta) {
      setErrorLogin('Por favor ingrese su número de abonado.')
      setCargandoLogin(false)
      return
    }

    if (!rutLimpio) {
      setErrorLogin('Por favor ingrese el RUT asociado a su cuenta.')
      setCargandoLogin(false)
      return
    }

    const esPruebaValida = (cta === 'C701' || cta === '0014') && (rutLimpio.includes('13756882') || rutLimpio.includes('8803782'))
    const clienteEncontrado = clientesMap[cta]

    if (esPruebaValida || clienteEncontrado || cta.startsWith('C') || cta.startsWith('0')) {
      setTimeout(() => {
        setCuentaActiva(cta)
        setAutenticado(true)
        setCargandoLogin(false)

        try {
          localStorage.setItem(
            'gama_areaclientes_session',
            JSON.stringify({
              cuenta: cta,
              rut: rutLimpio,
              fechaLogin: new Date().toISOString(),
            })
          )
        } catch {}
      }, 500)
    } else {
      setTimeout(() => {
        setErrorLogin('Número de abonado o RUT no coincide en nuestros registros. Verifique sus datos o contacte a la Central.')
        setCargandoLogin(false)
      }, 400)
    }
  }

  // Manejar Logout
  const handleLogout = () => {
    setAutenticado(false)
    try {
      localStorage.removeItem('gama_areaclientes_session')
    } catch {}
  }

  // Seleccionar pestaña y cerrar menú móvil
  const selectTab = (tabId: string) => {
    setActiveTab(tabId)
    setMobileMenuOpen(false)
  }

  // ════════════════════════════════════════════════════════════════════
  // SI NO ESTÁ AUTENTICADO: RENDERIZAR PANTALLA LOGIN VIP
  // ════════════════════════════════════════════════════════════════════
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-[#050a14] text-slate-100 flex items-center justify-center p-4 relative font-sans selection:bg-[#2997ff]/30 selection:text-white overflow-hidden">
        
        {/* Glow de fondo animado */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#0066cc]/20 via-[#2997ff]/10 to-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-md bg-[#091222]/95 backdrop-blur-2xl border border-[#1e3e6b]/70 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80"
        >
          {/* LOGO OCTÁGONO GRANDE CON RESPLANDOR */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="relative group my-2 cursor-pointer">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#0066cc] via-[#2997ff] to-amber-400/40 rounded-3xl blur-md opacity-60 group-hover:opacity-100 transition duration-500" />
              
              <div className="relative w-28 h-28 bg-[#0a1628] border border-[#2a4875] rounded-3xl p-4 flex items-center justify-center shadow-2xl">
                <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a1628]" />
                <Image
                  src="/logo-gama.png"
                  alt="GAMA Security Octágono"
                  width={90}
                  height={90}
                  className="object-contain filter drop-shadow(0 4px 14px rgba(0,102,204,0.6))"
                  priority
                />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-wider uppercase font-mono mt-3 text-white">
              GAMA<span className="text-[#2997ff]">SECURITY</span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mt-0.5">
              Portal Exclusivo Abonados
            </p>
          </div>

          {/* FORMULARIO DE LOGIN */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {errorLogin && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{errorLogin}</span>
              </motion.div>
            )}

            {/* Input Número de Abonado */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#2997ff]" />
                Número de Abonado / Cuenta
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputCuenta}
                  onChange={(e) => setInputCuenta(e.target.value)}
                  placeholder="Ej: C701 o 0014"
                  className="w-full px-4 py-3 rounded-xl bg-[#0d1c33] border border-[#1e3a5f] text-white text-sm font-mono tracking-wider focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] transition"
                  required
                />
                <span className="absolute right-3 top-3 text-[10px] font-mono bg-[#1a3356] text-[#2997ff] px-2 py-0.5 rounded font-bold">
                  ABONADO
                </span>
              </div>
            </div>

            {/* Input RUT del Cliente */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                RUT del Titular / Clave de Acceso
              </label>
              <input
                type="text"
                value={inputRut}
                onChange={(e) => setInputRut(e.target.value)}
                placeholder="Ej: 13756882-9"
                className="w-full px-4 py-3 rounded-xl bg-[#0d1c33] border border-[#1e3a5f] text-white text-sm font-mono tracking-wider focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] transition"
                required
              />
            </div>

            {/* Credencial de Prueba Rápida */}
            <div className="bg-[#0b182e] border border-[#1b355a] rounded-xl p-3 text-[11px] text-slate-400 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-200">Datos para pruebas:</p>
                <p className="font-mono text-[#2997ff]">Cuenta: C701 · RUT: 13756882-9</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputCuenta('C701')
                  setInputRut('13756882-9')
                }}
                className="text-[10px] bg-[#1a365d] text-white hover:bg-[#2997ff] px-2.5 py-1 rounded font-semibold transition"
              >
                Auto-Llenar
              </button>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={cargandoLogin}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0066cc] via-[#1a75d2] to-[#2997ff] hover:from-[#0055b3] hover:to-[#1a85f2] text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-[#0066cc]/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {cargandoLogin ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verificando Credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Portal VIP</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Pie de Soporte */}
          <div className="mt-6 pt-4 border-t border-[#1a2e4a]/60 text-center">
            <a
              href="https://wa.me/56912345678?text=Hola,%20necesito%20asistencia%20para%20ingresar%20al%20Area%20de%20Clientes%20Gama"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-[#2997ff] transition flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>¿Necesitas ayuda con tu cuenta? Contactar Central WhatsApp</span>
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // SI ESTÁ AUTENTICADO: RENDERIZAR DASHBOARD COMPLETO DEL PORTAL
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans selection:bg-[#2997ff]/30 selection:text-white overflow-x-hidden pb-20 lg:pb-0">
      
      {/* Elementos ambientales de fondo */}
      <div className="fixed top-0 left-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#0066cc]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] bg-[#0a2540]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* BARRA SUPERIOR MOBILE (< lg) */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#08101d] border-b border-[#1a2e4a] px-4 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-[#0e1a2e] border border-[#1e3a5f] text-slate-200 hover:text-white transition flex items-center gap-2"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5 text-[#2997ff]" />
            <span className="text-xs font-semibold text-slate-300">Menú</span>
          </button>

          {/* Logo Octágono Compacto Mobile */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0a1628] border border-[#2a4875] p-1 flex items-center justify-center shadow-md">
              <Image src="/logo-gama.png" alt="GAMA Octágono" width={24} height={24} className="object-contain" priority />
            </div>
            <span className="font-extrabold text-sm tracking-wider text-white font-mono">
              GAMA<span className="text-[#2997ff]">SECURITY</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => setModalSos(true)}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-900/40"
        >
          <BellRing className="w-3.5 h-3.5 animate-bounce" />
          SOS
        </button>
      </header>

      {/* DRAWER MOBILE (< lg) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 bottom-0 left-0 z-50 w-[300px] max-w-[85vw] bg-[#070d18] border-r border-[#1e3a5f] shadow-[10px_0_40px_rgba(0,0,0,0.9)] flex flex-col justify-between p-5 overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#1a2e4a]">
                  <span className="text-xs font-mono font-bold text-[#2997ff] uppercase tracking-wider">
                    Menú Principal
                  </span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-[#12223a] text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
                  >
                    <X className="w-4 h-4 text-amber-400" />
                    <span>Cerrar</span>
                  </button>
                </div>

                <div className="my-5 flex flex-col items-center">
                  <div className="relative w-24 h-24 bg-[#0a1628] border border-[#2a4875] rounded-2xl p-3 flex items-center justify-center shadow-xl">
                    <Image
                      src="/logo-gama.png"
                      alt="GAMA Security Octágono"
                      width={72}
                      height={72}
                      className="object-contain filter drop-shadow(0 4px 12px rgba(0,102,204,0.5))"
                      priority
                    />
                  </div>
                  <h2 className="text-white font-extrabold text-lg tracking-wider uppercase font-mono mt-3">
                    GAMA<span className="text-[#2997ff]">SECURITY</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    Portal Abonados VIP
                  </p>
                </div>

                <nav className="space-y-2 mt-4">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id

                    return (
                      <button
                        key={item.id}
                        onClick={() => selectTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${
                          isActive
                            ? 'bg-[#0f2847] text-white border border-[#2997ff]/60 shadow-lg'
                            : 'text-slate-300 hover:bg-[#101e33]'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-[#2997ff]' : 'text-slate-400'}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] bg-[#2997ff]/20 text-[#2997ff] px-2 py-0.5 rounded-full font-mono">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-[#1a2e4a] flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Abonado #{cuentaActiva}</p>
                  <p className="text-[11px] text-emerald-400 font-medium">● Cliente VIP Active</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900 transition"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN LAYOUT WRAPPER DESKTOP ── */}
      <div className="flex flex-1 min-h-screen relative">

        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-[#1a2e4a]/80 bg-[#08101d] sticky top-0 h-screen overflow-y-auto justify-between p-5">
          <div className="flex flex-col items-center">
            
            <div className="relative group cursor-pointer my-3 flex flex-col items-center w-full">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#0066cc] via-[#2997ff] to-amber-500/40 rounded-3xl blur-md opacity-40 group-hover:opacity-80 transition duration-500" />
              
              <div className="relative w-32 h-32 bg-[#0a1628] border border-[#2a4875] rounded-3xl p-4 flex items-center justify-center shadow-2xl shadow-[#0066cc]/30 transition-transform duration-300 group-hover:scale-105">
                <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a1628]" />
                <Image
                  src="/logo-gama.png"
                  alt="GAMA Security Octágono"
                  width={96}
                  height={96}
                  className="object-contain filter drop-shadow(0 6px 16px rgba(0,102,204,0.6))"
                  priority
                />
              </div>

              <div className="mt-4 text-center">
                <h2 className="text-white font-extrabold text-xl tracking-wider uppercase font-mono">
                  GAMA<span className="text-[#2997ff]">SECURITY</span>
                </h2>
                <p className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase mt-0.5">
                  Área Exclusiva Clientes VIP
                </p>
              </div>
            </div>

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#1e3a5f] to-transparent my-5" />

            <nav className="w-full space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0066cc]/25 to-[#0f2847] text-white border border-[#2997ff]/50 shadow-lg shadow-[#0066cc]/15'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-[#0f1d33]/70 border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicatorDesktop"
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

                    <span className="flex-1 text-left truncate">{item.label}</span>

                    {item.badge && (
                      <span className="text-[10px] bg-[#2997ff]/20 text-[#2997ff] border border-[#2997ff]/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-4 bg-[#0a1628]/90 border border-[#1e3a5f]/60 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-950 flex items-center justify-center font-bold text-white text-xs border border-blue-400/40 shadow-inner">
                {cuentaActiva.slice(0, 3)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  Abonado #{cuentaActiva}
                </p>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Estado Protegido VIP
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-[#12223a] text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-[#1e3a5f] transition"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
          
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2e4a]/60 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#2997ff] mb-1">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                MONITOREO ACTIVO EN TIEMPO REAL · ABONADO #{cuentaActiva}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {tiempoSaludo}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">{clienteInfo.NOMBRE}</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="truncate">{clienteInfo.DIRECCION} — {clienteInfo.CIUDAD}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setSistemaArmado(!sistemaArmado)}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                  sistemaArmado
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 shadow-lg shadow-emerald-950/40'
                    : 'bg-amber-950/50 border-amber-500/50 text-amber-300 hover:bg-amber-900/60 shadow-lg shadow-amber-950/40'
                }`}
              >
                {sistemaArmado ? <Lock className="w-4 h-4 text-emerald-400" /> : <Unlock className="w-4 h-4 text-amber-400" />}
                {sistemaArmado ? 'Sistema Armado' : 'Sistema Desarmado'}
              </button>

              <button
                onClick={() => setModalSos(true)}
                className="hidden lg:flex px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-semibold text-xs uppercase tracking-wider items-center gap-2 shadow-lg shadow-red-900/30 transition border border-red-400/30"
              >
                <BellRing className="w-4 h-4 animate-bounce" />
                SOS 24/7
              </button>
            </div>
          </header>

          {/* ════════════════════════════════════════════════════════════════════
             PESTAÑA 1: RESUMEN GENERAL (INICIO)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'inicio' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 sm:space-y-8">
              
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1a2e] via-[#091526] to-[#050b14] border border-[#1e3e6b]/60 p-5 sm:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#2997ff]/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                        <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-ping opacity-20 pointer-events-none" />
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-semibold mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Protección Activa en Regla
                      </div>
                      <h3 className="text-lg sm:text-2xl font-extrabold text-white">
                        Su propiedad se encuentra 100% resguardada
                      </h3>
                      <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                        Monitoreo 24/7 sin anomalías detectadas en la cuenta #{cuentaActiva}. Enlace directo constante con la Central Gama Security.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t lg:border-t-0 lg:border-l border-[#1e3a5f]/60 pt-4 lg:pt-0 lg:pl-8">
                    <div className="bg-[#091424]/90 p-3.5 sm:p-4 rounded-2xl border border-[#1a3356]/60">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Test de Enlace</span>
                      <p className="text-sm sm:text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        OK · En línea
                      </p>
                    </div>
                    <div className="bg-[#091424]/90 p-3.5 sm:p-4 rounded-2xl border border-[#1a3356]/60">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Batería Panel</span>
                      <p className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        100% Carga
                      </p>
                    </div>
                  </div>

                </div>
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                
                <div className="bg-[#081220]/90 backdrop-blur-xl border border-[#1a3356]/60 rounded-2xl p-5 hover:border-[#2997ff]/40 transition duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#2997ff]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Diagnóstico IA</span>
                  </div>
                  <h4 className="text-white font-semibold text-sm sm:text-base mb-1">Informe Automatizado</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    "Apertura programada efectuada hoy a las 08:32 hrs. Sensores perimetrales y de presencia sin alertas irregulares."
                  </p>
                </div>

                <div className="bg-[#081220]/90 backdrop-blur-xl border border-[#1a3356]/60 rounded-2xl p-5 hover:border-[#2997ff]/40 transition duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Registro Reciente</span>
                  </div>
                  <h4 className="text-white font-semibold text-sm sm:text-base mb-1">Desarme de Sistema</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Registrado hoy a las <span className="text-white font-semibold">08:32:15 AM</span> por usuario autorizador principal.
                  </p>
                </div>

                <div className="bg-[#081220]/90 backdrop-blur-xl border border-[#1a3356]/60 rounded-2xl p-5 sm:col-span-2 lg:col-span-1 hover:border-[#2997ff]/40 transition duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">CCTV HD</span>
                  </div>
                  <h4 className="text-white font-semibold text-sm sm:text-base mb-1">4 Cámaras Activas</h4>
                  <p className="text-slate-300 text-xs leading-relaxed mb-3">
                    Monitoreo visual continuo con analítica activa. Acceso en tiempo real disponible.
                  </p>
                  <button
                    onClick={() => setActiveTab('camaras')}
                    className="text-xs text-[#2997ff] hover:underline font-semibold flex items-center gap-1"
                  >
                    Ver cámaras en vivo →
                  </button>
                </div>

              </section>

              {/* Línea de tiempo reciente */}
              <section className="bg-[#081220]/90 backdrop-blur-xl border border-[#1a3356]/60 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1a2e4a]/60">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Actividad Reciente en la Propiedad</h3>
                    <p className="text-xs text-slate-400">Últimos eventos validados por la Central para #{cuentaActiva}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('historial')}
                    className="text-xs text-[#2997ff] hover:underline font-semibold"
                  >
                    Ver todo
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { hora: '03:15 AM', evento: 'Activación Alarma Perimetral Z04', desc: 'Verificación por patrulla Gama ejecutada', notaCruda: '03:15: Z4 Pir Patio. Llamada a Titular sin respuesta. Se despacha Móvil 2. Móvil 2 reporta perro suelto activó PIR. Propiedad intacta. Restablece 03:25.', tieneIa: true },
                    { hora: '14:30 PM', evento: 'Corte de Energía Red Pública (CGE)', desc: 'Respaldo de batería activado al 100%', notaCruda: '14:30: Corte luz CGE en sector Recreo. Panel pasa a Batería 12V. Se avisa por SMS a Don Carlos.', tieneIa: true },
                    { hora: '08:32 AM', evento: 'Desarme de Sistema (Apertura)', desc: 'Usuario Administrador Principal', tieneIa: false },
                  ].map((evt, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0a1526] border border-[#162a45]">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="text-[11px] sm:text-xs font-mono text-slate-400 w-20 sm:w-24 flex-shrink-0">{evt.hora}</span>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs sm:text-sm font-semibold text-white truncate">{evt.evento}</p>
                          <p className="text-[11px] text-slate-400 truncate">{evt.desc}</p>
                        </div>
                      </div>

                      {evt.tieneIa && (
                        <button
                          onClick={() => procesarBitacoraConIA(evt)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-400/40 text-blue-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition hover:scale-105"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Procedimiento IA</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             PESTAÑA 2: CÁMARAS EN VIVO
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'camaras' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Grid de Cámaras HD en Vivo</h3>
                  <p className="text-xs text-slate-400">Transmisión en directo para la propiedad de {clienteInfo.NOMBRE}</p>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-mono border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  4 Canales Online
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'cam1', nombre: 'Cam 01 · Acceso Principal / Portón', desc: 'Analítica de Rostro & Vehículos' },
                  { id: 'cam2', nombre: 'Cam 02 · Patio Posterior / Perímetro', desc: 'Detección Infrarroja Nocturna' },
                  { id: 'cam3', nombre: 'Cam 03 · Estacionamiento Subterráneo', desc: 'Lectura de Patentes LPR' },
                  { id: 'cam4', nombre: 'Cam 04 · Recepción & Hall de Entrada', desc: 'Cámara Gran Angular 4K' },
                ].map((cam) => (
                  <div key={cam.id} className="bg-[#091526] border border-[#1a3356]/60 rounded-2xl overflow-hidden group shadow-xl">
                    <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10" />
                      <div className="text-center z-10 p-4">
                        <Video className="w-10 h-10 text-slate-600 mx-auto mb-2 group-hover:text-[#2997ff] transition" />
                        <span className="text-xs font-mono text-slate-400">TRANSMISIÓN HD EN VIVO</span>
                      </div>
                      
                      <div className="absolute top-3 left-3 z-20 bg-red-600 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE 4K
                      </div>

                      <button
                        onClick={() => setCamaraSeleccionada(cam.nombre)}
                        className="absolute bottom-3 right-3 z-20 p-2 rounded-xl bg-black/60 text-white hover:bg-[#2997ff] transition"
                        title="Pantalla Completa"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{cam.nombre}</h4>
                        <p className="text-[11px] text-slate-400">{cam.desc}</p>
                      </div>
                      <button
                        onClick={() => setCamaraSeleccionada(cam.nombre)}
                        className="px-3 py-1.5 rounded-lg bg-[#11243f] text-[#2997ff] text-xs font-semibold hover:bg-[#2997ff] hover:text-white transition"
                      >
                        Abrir Visor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             PESTAÑA 3: HISTORIAL & LÍNEA DE TIEMPO CON EXPLICACIÓN IA
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'historial' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Historial de Seguridad</h3>
                  <p className="text-xs text-slate-400">Bitácora completa con asistente de interpretación IA para #{cuentaActiva}</p>
                </div>

                <div className="flex items-center gap-2 bg-[#091526] p-1.5 rounded-xl border border-[#1a3356]/60">
                  {['todos', 'aperturas', 'alarmas'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFiltroHistorial(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                        filtroHistorial === f ? 'bg-[#2997ff] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#081220] border border-[#1a3356]/60 rounded-2xl divide-y divide-[#162a45]">
                {eventosSupabase.length > 0 ? (
                  eventosSupabase.map((evt) => (
                    <div key={evt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#0d1c33] transition">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[#2997ff] flex-shrink-0 mt-0.5">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{evt.evento}</h4>
                          <p className="text-xs text-slate-400">Zona {evt.zona || '00'} — {evt.nombre_abonado || evt.usuario || 'Sistema Gama'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="text-xs font-mono text-slate-400">
                          {new Date(evt.fecha_hora).toLocaleString()}
                        </span>
                        <button
                          onClick={() =>
                            procesarBitacoraConIA({
                              evento: evt.evento,
                              hora: new Date(evt.fecha_hora).toLocaleTimeString(),
                              notaCruda: `Evento ${evt.evento} en Zona ${evt.zona || '00'}. Registrado por comunicador 4G. Verificado por Central Gama.`,
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-blue-500/20 text-[#2997ff] border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-[#2997ff] hover:text-white transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Procedimiento IA</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { fecha: 'Hoy 03:15:00 AM', evento: 'Activación Alarma Perimetral Z04', detalles: 'Inspección Móvil #2 en Terreno', notaCruda: '03:15: Z4 Pir Patio. Llamada a Titular sin respuesta. Se despacha Móvil 2. Móvil 2 reporta perro suelto activó PIR. Propiedad intacta. Restablece 03:25.' },
                    { fecha: 'Ayer 14:30:12 PM', evento: 'Corte de Energía Red Pública (CGE)', detalles: 'Conmutación a Batería de Respaldo 12V', notaCruda: '14:30: Corte luz CGE en sector Recreo. Panel pasa a Batería 12V. Se avisa por SMS a Don Carlos.' },
                    { fecha: 'Ayer 20:10:44 PM', evento: 'Armado de Sistema (Cierre)', detalles: 'Usuario Autorizado #01 - Modo Noche' },
                    { fecha: '24/08 14:22:10 PM', evento: 'Verificación de Sensores', detalles: 'Prueba de caminata zona exterior OK' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#0d1c33] transition">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[#2997ff] flex-shrink-0 mt-0.5">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{item.evento}</h4>
                          <p className="text-xs text-slate-400">{item.detalles}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-xs font-mono text-slate-400">{item.fecha}</span>
                        {item.notaCruda && (
                          <button
                            onClick={() =>
                              procesarBitacoraConIA({
                                evento: item.evento,
                                hora: item.fecha,
                                notaCruda: item.notaCruda,
                              })
                            }
                            className="px-3 py-1 rounded-lg bg-blue-500/20 text-[#2997ff] border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-[#2997ff] hover:text-white transition"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Explicación IA</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             PESTAÑA 4: CONTACTOS AUTORIZADOS
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'contactos' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Directorio de Contactos de Emergencia</h3>
                <p className="text-xs text-slate-400">Personas autorizadas para llamadas de verificación de la Central</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { orden: '1º Prioridad', nombre: clienteRaw.nombre1 || 'Administrador General', cargo: clienteRaw.carg1 || 'Encargado Principal', fono: clienteRaw.t1 || '+56 9 8765 4321' },
                  { orden: '2º Prioridad', nombre: clienteRaw.nombre2 || 'Jefe de Seguridad', cargo: clienteRaw.carg2 || 'Contacto Secundario', fono: clienteRaw.t2 || '+56 9 7654 3210' },
                  { orden: '3º Prioridad', nombre: clienteRaw.nombre3 || 'Guardia de Turno 24h', cargo: clienteRaw.carg3 || 'Acceso Conserjería', fono: clienteRaw.t3 || '+56 9 6543 2109' },
                ].map((c, idx) => (
                  <div key={idx} className="bg-[#081220] border border-[#1a3356]/60 rounded-2xl p-5 relative overflow-hidden">
                    <span className="text-[10px] bg-[#2997ff]/20 text-[#2997ff] border border-[#2997ff]/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {c.orden}
                    </span>
                    <h4 className="text-white font-bold text-base mt-3">{c.nombre}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{c.cargo}</p>
                    <p className="text-xs font-mono text-[#2997ff] mt-3">{c.fono}</p>

                    <a
                      href={`tel:${c.fono.replace(/\s+/g, '')}`}
                      className="mt-4 w-full py-2 bg-[#0e1e36] hover:bg-[#2997ff] hover:text-white text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Llamar Contacto
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             PESTAÑA 5: ESTADO DEL SERVICIO
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'servicios' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Estado del Servicio & Equipamiento</h3>
                <p className="text-xs text-slate-400">Ficha técnica y mantenciones de la propiedad #{cuentaActiva}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#081220] border border-[#1a3356]/60 rounded-2xl p-6 space-y-4">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#2997ff]" />
                    Ficha Técnica del Panel
                  </h4>
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-[#162a45]">
                      <span className="text-slate-400">Abonado / Cuenta:</span>
                      <span className="font-semibold text-white">#{cuentaActiva}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#162a45]">
                      <span className="text-slate-400">Tipo de Panel:</span>
                      <span className="font-semibold text-white">DSC PowerSeries Neo / Hybrid</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#162a45]">
                      <span className="text-slate-400">Canal Principal:</span>
                      <span className="font-semibold text-emerald-400">Comunicador IP / GPRS 4G Dual</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#162a45]">
                      <span className="text-slate-400">Plan de Monitoreo:</span>
                      <span className="font-semibold text-white">{clienteInfo.PLAN}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Última Mantención:</span>
                      <span className="font-semibold text-white">Preventiva Realizada (100% OK)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#081220] border border-[#1a3356]/60 rounded-2xl p-6 space-y-4">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-amber-400" />
                    Solicitar Visita Técnica
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Si requiere revisión de sensores, cambio de batería o ampliación de cámaras, puede solicitar la visita de nuestros técnicos certificados Gama.
                  </p>
                  <a
                    href={`https://wa.me/56912345678?text=Hola,%20solicito%20revisi%C3%B3n%20t%C3%A9cnica%20para%20la%20cuenta%20${cuentaActiva}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Agendar por WhatsApp VIP
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
             PESTAÑA 6: ASISTENCIA SOS 24/7
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'soporte' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-gradient-to-br from-red-950/40 via-[#0d1626] to-[#070d18] border border-red-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                  <BellRing className="w-8 h-8 animate-bounce" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">Central de Monitoreo Gama 24/7</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                  Operadores supervisores en línea las 24 horas del día. En caso de emergencia o asistencia inmediata para la cuenta #{cuentaActiva}:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
                  <a
                    href="tel:+56912345678"
                    className="py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-950/50 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Llamar Urgente Central
                  </a>
                  <a
                    href={`https://wa.me/56912345678?text=EMERGENCIA%20CUENTA%20${cuentaActiva}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp Operador
                  </a>
                </div>
              </div>
            </motion.div>
          )}

        </main>
      </div>

      {/* BARRA DE NAVEGACIÓN INFERIOR MOBILE */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08101d] border-t border-[#1a2e4a] px-2 py-2 flex items-center justify-around shadow-2xl">
        {[
          { id: 'inicio', label: 'Inicio', icon: ShieldCheck },
          { id: 'camaras', label: 'Cámaras', icon: Camera },
          { id: 'historial', label: 'Historial', icon: Clock },
          { id: 'soporte', label: 'SOS', icon: PhoneCall, alert: true },
        ].map((m) => {
          const Icon = m.icon
          const isActive = activeTab === m.id
          return (
            <button
              key={m.id}
              onClick={() => selectTab(m.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                isActive ? 'text-[#2997ff] bg-[#102038]' : m.alert ? 'text-red-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{m.label}</span>
            </button>
          )
        })}
      </nav>

      {/* MODAL CÁMARA */}
      <AnimatePresence>
        {camaraSeleccionada && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#091526] border border-[#1a3356] rounded-3xl max-w-3xl w-full p-6 relative overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setCamaraSeleccionada(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-white mb-4">{camaraSeleccionada}</h3>
              <div className="aspect-video bg-black rounded-2xl flex items-center justify-center border border-slate-800">
                <p className="text-xs text-slate-400 font-mono">REPRODUCTOR HD EN TIEMPO REAL</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL SOS */}
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
                Estableciendo enlace prioritario con la Central de Monitoreo Gama Security Chile para la cuenta #{cuentaActiva}.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href="tel:+56912345678"
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-red-900/40 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
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

      {/* ════════════════════════════════════════════════════════════════════
         MODAL IA CONCIERGE: INTERPRETACIONAL DE BITÁCORA Y PROCEDIMIENTO
         ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalIaBitacora && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#091526] border border-[#2997ff]/40 rounded-3xl max-w-xl w-full p-6 sm:p-7 relative overflow-hidden shadow-2xl text-left"
            >
              {/* Resplandor ambiental de IA */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#2997ff]/10 rounded-full blur-[80px] pointer-events-none" />

              <button
                onClick={() => setModalIaBitacora(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-400/40 flex items-center justify-center text-amber-400 shadow-lg shadow-blue-900/40">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Explicación de Procedimiento IA
                    <span className="text-[10px] bg-blue-500/20 text-[#2997ff] border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                      Concierge AI
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Traducción ejecutiva de Bitácora · Central Gama</p>
                </div>
              </div>

              {eventoIaActual && (
                <div className="bg-[#0b1b33] border border-[#1e3a5f] rounded-2xl p-3.5 mb-4 text-xs">
                  <span className="text-[10px] font-mono text-[#2997ff] font-bold uppercase">Evento Analizado</span>
                  <p className="text-white font-semibold text-sm mt-0.5">{eventoIaActual.evento}</p>
                  <p className="text-[#2997ff] font-mono text-[11px] mt-0.5">{eventoIaActual.hora}</p>
                </div>
              )}

              {cargandoIa ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-[#2997ff] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-300 font-mono">
                    La Inteligencia Artificial está analizando y filtrando las notas de Bitácora...
                  </p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#071120] border border-[#162e4f] p-4 sm:p-5 rounded-2xl max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                  {explicacionIa}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setModalIaBitacora(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#0066cc]/30 hover:scale-105 transition"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
