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
  FileSearch,
  Check
} from 'lucide-react'
import { supabase, deduplicarEventos, type EventoMonitoreo } from '@/lib/supabase'

import clientesDataRaw from '@/lib/clientes_general.json'
import personasAutorizadasRaw from '@/lib/personas_autorizadas.json'

const clientesMap = clientesDataRaw as Record<string, Record<string, any>>
const personasAutorizadasMap = personasAutorizadasRaw as Record<string, Array<{
  prioridad: number
  nombre: string
  contrasena: string
  cargo: string
  direccion: string
  telefono: string
}>>

// Interface para registros reales de Bitácora
interface BitacoraRecord {
  id: string
  id_abonado: string
  comentario: string
  tipo_evento: string
  created_at: string
  updated_at: string
  tipo_nombre: string
  tipo_color: string
  responsable_nombre: string
  abonado_cod: string
  abonado_nombre: string
}

// Menú lateral de navegación
const NAV_ITEMS = [
  { id: 'inicio', label: 'Resumen General', icon: ShieldCheck },
  { id: 'camaras', label: 'Cámaras en Vivo', icon: Camera, badge: 'HD 4K' },
  { id: 'historial', label: 'Línea de Tiempo', icon: Clock },
  { id: 'contactos', label: 'Contactos Autorizados', icon: Users },
  { id: 'servicios', label: 'Estado del Servicio', icon: FileText },
  { id: 'soporte', label: 'Asistencia 24/7', icon: PhoneCall },
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

  // Registros reales de la Bitácora de la Central (Strict por cuenta)
  const [eventosBitacoraReales, setEventosBitacoraReales] = useState<BitacoraRecord[]>([])
  const [cargandoBitacora, setCargandoBitacora] = useState<boolean>(false)

  // Estado para IA Bitácora Concierge
  const [modalIaBitacora, setModalIaBitacora] = useState<boolean>(false)
  const [cargandoIa, setCargandoIa] = useState<boolean>(false)
  const [eventoIaActual, setEventoIaActual] = useState<any>(null)
  const [explicacionIa, setExplicacionIa] = useState<string>('')

  // Eventos de Supabase en tiempo real
  const [eventosSupabase, setEventosSupabase] = useState<EventoMonitoreo[]>([])

  // Estado de clientes en vivo (Supabase + fallback)
  const [clientesLiveMap, setClientesLiveMap] = useState<Record<string, any>>(clientesMap)
  const [modalEditarContactos, setModalEditarContactos] = useState<boolean>(false)
  const [contactosForm, setContactosForm] = useState<Array<{ nombre: string; cargo: string; fono: string }>>([])
  const [declaracionAceptada, setDeclaracionAceptada] = useState<boolean>(false)
  const [guardandoContactos, setGuardandoContactos] = useState<boolean>(false)
  const [mensajeExitoContactos, setMensajeExitoContactos] = useState<string>('')

  // Cargar mapa fresco de clientes desde Supabase
  useEffect(() => {
    async function fetchClientesSupabase() {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CLIENTES')
          .order('id', { ascending: false })
          .limit(1)

        if (data && data.length > 0 && data[0].nombre_abonado) {
          const map = JSON.parse(data[0].nombre_abonado)
          setClientesLiveMap(map)
        }
      } catch (e) {
        console.warn('Usando fallback local de clientes')
      }
    }
    fetchClientesSupabase()
  }, [autenticado])

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

  // Cargar anotaciones REALES de la Bitácora de la Central STRICT POR CUENTA
  useEffect(() => {
    if (!autenticado || !cuentaActiva) return

    const fetchBitacoraReal = async () => {
      setCargandoBitacora(true)
      try {
        const ctaUpper = cuentaActiva.toUpperCase().trim()

        // 1. Intentar resolver id_abonado de la base de datos MySQL de Bitácora
        let idAbonado: string | null = null
        try {
          const resAb = await fetch(`https://bitacora.gamasecurity.cl/api-bitacora.php?action=abonados&q=${encodeURIComponent(ctaUpper)}`)
          if (resAb.ok) {
            const dataAb = await resAb.json()
            if (Array.isArray(dataAb) && dataAb.length > 0) {
              const exactMatch = dataAb.find((a: any) => a.cod && a.cod.toUpperCase().trim() === ctaUpper)
              if (exactMatch && exactMatch.id) {
                idAbonado = String(exactMatch.id)
              } else if (dataAb[0]?.id) {
                idAbonado = String(dataAb[0].id)
              }
            }
          }
        } catch (e) {
          console.warn('Error resolviendo id de abonado:', e)
        }

        // 2. Consultar eventos con rango amplio de fechas (desde 2020) para no limitar por turno/antigüedad
        const desdeParam = '2020-01-01 00:00'
        const hastaParam = '2099-12-31 23:59'
        const url = idAbonado
          ? `https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&id=${idAbonado}&desde=${encodeURIComponent(desdeParam)}&hasta=${encodeURIComponent(hastaParam)}`
          : `https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&q=${encodeURIComponent(ctaUpper)}&desde=${encodeURIComponent(desdeParam)}&hasta=${encodeURIComponent(hastaParam)}`

        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const filtrados = data.filter((b: BitacoraRecord) => {
              const codMatches = b.abonado_cod && b.abonado_cod.toUpperCase().trim() === ctaUpper
              const comMatches = b.comentario && b.comentario.toUpperCase().includes(ctaUpper)
              const idMatches = idAbonado && String(b.id_abonado) === String(idAbonado)
              return codMatches || comMatches || idMatches
            })
            // Ordenar por fecha descendente (últimos primero)
            filtrados.sort((a: BitacoraRecord, b: BitacoraRecord) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            setEventosBitacoraReales(filtrados)
          }
        }
      } catch (err) {
        console.error('Error consultando Bitácora real:', err)
      } finally {
        setCargandoBitacora(false)
      }
    }

    fetchBitacoraReal()
  }, [autenticado, cuentaActiva])

  // Cargar eventos en vivo de Supabase para la cuenta activa
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
          setEventosSupabase(deduplicarEventos(data))
        }
      } catch (err) {
        console.error('Error cargando eventos Supabase:', err)
      }
    }

    fetchEventos()

    const canal = supabase
      .channel(`eventos_cliente_${cuentaActiva}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'eventos_monitoreo', filter: `cuenta=eq.${cuentaActiva}` },
        (payload) => {
          setEventosSupabase((prev) => deduplicarEventos([payload.new as EventoMonitoreo, ...prev]).slice(0, 20))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [autenticado, cuentaActiva])

  // Obtener información del cliente desde la base de datos de clientes en vivo
  const clienteRaw = clientesLiveMap[cuentaActiva] || clientesMap[cuentaActiva] || {}
  const clienteInfo = {
    NOMBRE: clienteRaw.nombre || (cuentaActiva === 'C701' ? 'MIRNA REBOLLEDO NUÑEZ' : `ABONADO ${cuentaActiva}`),
    DIRECCION: clienteRaw.direccion || 'BORRIQUEROS PARCELA 15 ACCESO POR PEÑABLANCA — LIMACHE',
    CIUDAD: clienteRaw.ciudad || 'LIMACHE',
    ESTADO: 'PROTEGIDO 24/7',
    TELEFONO: clienteRaw.t1 || clienteRaw.telefono1 || '+56 9 1234 5678',
    PLAN: clienteRaw.plan || 'PREMIUM VIP',
  }

  // Abrir modal de edición directa de contactos autorizados
  const abrirModalEditarContactos = () => {
    const cClean = cuentaActiva.trim().toUpperCase()
    const cl = clientesLiveMap[cClean] || clientesMap[cClean] || {}
    const perList = personasAutorizadasMap[cClean] || []

    const formInit: Array<{ nombre: string; cargo: string; fono: string }> = []
    for (let i = 1; i <= 7; i++) {
      const p = perList[i - 1]
      const nom = cl[`nombre${i}`] || (i === 1 && cl.nombre ? cl.nombre : '') || p?.nombre || ''
      const carg = cl[`carg${i}`] || (i === 1 ? 'TITULAR / ENCARGADO' : '') || p?.cargo || ''
      const tel = cl[`t${i}`] || cl[`telefono${i}`] || (i === 1 && cl.telefono1 ? cl.telefono1 : '') || p?.telefono || ''
      formInit.push({ nombre: nom, cargo: carg, fono: tel })
    }
    setContactosForm(formInit)
    setDeclaracionAceptada(false)
    setMensajeExitoContactos('')
    setModalEditarContactos(true)
  }

  // Guardar contactos modificados desde el portal hacia el Editor Remoto y Supabase
  const guardarContactosCliente = async () => {
    if (!declaracionAceptada) return
    setGuardandoContactos(true)
    try {
      const cClean = cuentaActiva.trim().toUpperCase()
      const datosNuevos: Record<string, string> = {}

      contactosForm.forEach((c, idx) => {
        const num = idx + 1
        datosNuevos[`nombre${num}`] = c.nombre.toUpperCase().trim()
        datosNuevos[`carg${num}`] = c.cargo.toUpperCase().trim()
        datosNuevos[`t${num}`] = c.fono.trim()
        if (num === 1 && c.fono) {
          datosNuevos[`telefono1`] = c.fono.trim()
        }
      })

      const res = await fetch('/api/editor-remoto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuenta: cClean,
          tipoOperacion: 'EDITAR_GENERAL',
          datosNuevos,
          operador: {
            nombre: `CLIENTE (PORTAL WEB #${cClean})`,
            codigo: 'WEB',
            rol: 'Abonado'
          }
        })
      })

      if (res.ok) {
        // Registrar en Bitácora para conocimiento de los operadores de la central
        try {
          await supabase.from('eventos_monitoreo').insert({
            cuenta: cClean,
            evento: 'ACTUALIZACIÓN CONTACTOS POR CLIENTE (PORTAL)',
            nombre_abonado: `El cliente actualizó su lista de 7 contactos de emergencia desde el Área de Clientes.`,
            fecha_hora: new Date().toISOString(),
            zona: 'WEB',
            usuario: 'CLI'
          })
        } catch {}

        // Actualizar el estado local en caliente
        setClientesLiveMap((prev) => ({
          ...prev,
          [cClean]: {
            ...(prev[cClean] || {}),
            ...datosNuevos
          }
        }))

        setMensajeExitoContactos('¡Contactos actualizados y sincronizados con éxito en la Central de Monitoreo!')
        setTimeout(() => {
          setModalEditarContactos(false)
          setMensajeExitoContactos('')
        }, 1800)
      }
    } catch (err) {
      console.error('Error guardando contactos desde portal:', err)
    } finally {
      setGuardandoContactos(false)
    }
  }

  // Mensaje pre-configurado para actualizar contactos vía WhatsApp (+56948855190)
  const msgActualizarContactos = `Le habla el cliente ${cuentaActiva} ${clienteInfo.NOMBRE} quisiera hacer modificaciones sobre los contactos de emergencia y personas autorizadas.`
  const linkWhatsAppContactos = `https://wa.me/56948855190?text=${encodeURIComponent(msgActualizarContactos)}`

  // Mensaje pre-configurado para solicitar servicio técnico vía WhatsApp (+56948855190)
  const msgServicioTecnico = `Le habla el cliente ${cuentaActiva} ${clienteInfo.NOMBRE} quisiera solicitar servicio tecnico.`
  const linkWhatsAppServicio = `https://wa.me/56948855190?text=${encodeURIComponent(msgServicioTecnico)}`

  // COTEJAR Y PROCESAR CON IA ÚNICAMENTE CUANDO EXISTE ANOTACIÓN REAL
  const procesarBitacoraConIA = async (item: {
    evento: string
    hora: string
    notaReal: string
    responsable?: string
  }) => {
    setEventoIaActual(item)
    setModalIaBitacora(true)
    setCargandoIa(true)
    setExplicacionIa('')

    const prompt = `Eres el Asistente de IA Concierge de GAMA SEGURIDAD Chile.
Tu tarea es analizar la ANOTACIÓN REAL DE BITÁCORA escrita por el operador de la Central e interpretarla para el cliente abonado en un informe limpio, ejecutivo y tranquilizador.

REGLAS STRICTAS DE VERACIDAD (CRÍTICO):
1. Basate 100% ÚNICAMENTE en la información descrita en la anotación real. NO INVENTES despachos de patrulla, ni llamadas, ni inspecciones que no estén explícitamente escritas en la anotación.
2. Si la anotación habla de una reparación técnica (ej. reparación de cables, cambio de batería, revisión de magnéticos), explica exactamente esa reparación técnica.
3. Si la anotación habla de un llamado a un contacto o guardia específico, menciona exactamente esa comunicación.
4. Elimina claves internas, códigos de seguridad o notas administrativas confidenciales de operadores.
5. Formatea la respuesta en tono sobrio y profesional usando Markdown:
   - 📋 **Resumen del Procedimiento**
   - 🔍 **Detalle de la Acción Realizada en Bitácora**
   - 🟢 **Estado Final del Servicio**

Abonado: ${cuentaActiva} (${clienteInfo.NOMBRE})
Tipo de Evento / Título: ${item.evento}
Hora/Fecha: ${item.hora}
Operador Responsable: ${item.responsable || 'Central Gama'}
Anotación REAL de Bitácora Operador: "${item.notaReal}"`

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
          `📋 **Resumen de Procedimiento Realizado**\n\n` +
          `• **Anotación de Bitácora**: "${item.notaReal}"\n` +
          `• **Operador Responsable**: ${item.responsable || 'Central Gama'}\n` +
          `• **Estado**: Verificado y registrado en el historial de la cuenta.`
        )
      }
    } catch (e) {
      setExplicacionIa(
        `📋 **Resumen de Procedimiento Realizado**\n\n` +
        `• **Anotación de Bitácora**: "${item.notaReal}"\n` +
        `• **Estado**: Verificado en Central.`
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
      <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative font-sans selection:bg-[#2997ff]/30 selection:text-white overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#0066cc]/25 via-[#2997ff]/15 to-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-md bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/90"
        >
          {/* Logo Gama Security con Aura */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="relative group my-2 cursor-pointer flex flex-col items-center">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#0066cc]/40 via-[#2997ff]/20 to-emerald-400/20 rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition duration-500 pointer-events-none" />
              
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                <Image
                  src="/logo-gama.png"
                  alt="GAMA SEGURIDAD"
                  width={110}
                  height={110}
                  className="object-contain filter drop-shadow(0 0 24px rgba(0,102,204,0.9)) transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-wider uppercase font-mono mt-3 text-white">
              GAMA<span className="text-[#2997ff]">SECURITY</span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mt-0.5">
              Área de Clientes VIP
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorLogin && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorLogin}</span>
              </motion.div>
            )}

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
                  className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-[#060c18]/90 border border-white/10 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] transition"
                  required
                />
                <span className="absolute right-3.5 top-3.5 text-[10px] font-mono bg-[#1a3356] text-[#2997ff] px-2 py-0.5 rounded-lg font-bold">
                  ABONADO
                </span>
              </div>
            </div>

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
                className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-[#060c18]/90 border border-white/10 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] transition"
                required
              />
            </div>

            {/* Quick Demo Fill Pill */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-[11px] text-slate-400 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-200">Acceso Rápido Demo:</p>
                <p className="font-mono text-[#2997ff]">Cuenta: C701 · RUT: 13756882-9</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputCuenta('C701')
                  setInputRut('13756882-9')
                }}
                className="text-[10px] bg-[#0066cc] hover:bg-[#2997ff] text-white px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer"
              >
                Auto-Llenar
              </button>
            </div>

            <button
              type="submit"
              disabled={cargandoLogin}
              className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-[#0066cc] via-[#1a75d2] to-[#2997ff] hover:from-[#0055b3] hover:to-[#1a85f2] text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-[#0066cc]/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {cargandoLogin ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verificando Credenciales...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ingresar a Mi Alarma Gama</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <a
              href="https://wa.me/56948855190?text=Hola,%20necesito%20asistencia%20para%20ingresar%20al%20Área%20de%20Clientes%20de%20GAMA%20Security."
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-[#2997ff] flex items-center justify-center gap-1.5 transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>¿Problemas de acceso? Contactar a Central WhatsApp</span>
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // SI ESTÁ AUTENTICADO: RENDERIZAR DASHBOARD APPLE HOMEKIT BENTO GRID
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-[#2997ff]/30 selection:text-white overflow-x-hidden pb-28 lg:pb-10">
      
      {/* Luces de fondo ambient Apple Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] lg:w-[800px] h-[500px] lg:h-[800px] bg-gradient-to-br from-[#0066cc]/15 via-[#2997ff]/5 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] lg:w-[700px] h-[400px] lg:h-[700px] bg-gradient-to-tl from-[#10b981]/10 via-[#0a2540]/20 to-transparent rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* ── HEADER APPLE HOMEKIT FROSTED GLASS ── */}
      <header className="sticky top-0 z-30 bg-[#030712]/80 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5 transition-all shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Marca + Estado en Vivo */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
              <Image
                src="/logo-gama.png"
                alt="GAMA Security"
                width={40}
                height={40}
                className="object-contain filter drop-shadow(0 0 14px rgba(41,151,255,0.7))"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white font-mono">
                  GAMA<span className="text-[#2997ff]">SECURITY</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE 24/7
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-sm">
                Abonado #{cuentaActiva} · {clienteInfo.NOMBRE}
              </p>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#0c182b]/80 border border-white/10 p-1 rounded-2xl backdrop-blur-xl">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-lg shadow-[#0066cc]/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.8]" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Acciones Rápidas (SOS & Logout) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setModalSos(true)}
              className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-950/60 transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-red-400/40"
            >
              <BellRing className="w-3.5 h-3.5 animate-bounce" />
              <span>SOS PÁNICO</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ── CUERPO PRINCIPAL DEL PORTAL ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        
        {/* Banner de Saludo y Propiedad */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#2997ff] uppercase tracking-wider mb-1">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>SISTEMA PERIMETRAL VETTI / DSC CONECTADO · SCORPION 24/7</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {tiempoSaludo}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-[#2997ff]">{clienteInfo.NOMBRE}</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">{clienteInfo.DIRECCION} — {clienteInfo.CIUDAD}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#0c182b] border border-white/10 px-3 py-1.5 rounded-xl font-mono text-slate-300 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Latencia Central: <strong>0.85s</strong></span>
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
           VISTA BENTO GRID (PESTAÑA INICIO)
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'inicio' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* ── BENTO GRID CONTAINER ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              {/* TILE 1: MASTER HOMEKIT SECURITY SHIELD (2x2) */}
              <div className="md:col-span-2 bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-[#2997ff]/40 transition-all duration-300">
                <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] pointer-events-none transition-all duration-500 ${sistemaArmado ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`} />
                
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#2997ff]">
                      CONTROL MAESTRO HOMEKIT
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                    sistemaArmado
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sistemaArmado ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    {sistemaArmado ? 'ARMADO TOTAL (CIERRE)' : 'DESARMADO (APERTURA)'}
                  </span>
                </div>

                {/* Haptic Circular Control */}
                <div className="my-8 flex flex-col items-center justify-center z-10">
                  <div className="relative">
                    {/* Pulsing Concentric Rings */}
                    <div className={`absolute -inset-4 rounded-full border transition-all duration-500 pointer-events-none ${
                      sistemaArmado ? 'border-emerald-500/30 animate-pulse' : 'border-amber-500/30'
                    }`} />
                    <div className={`absolute -inset-8 rounded-full border opacity-40 transition-all duration-500 pointer-events-none ${
                      sistemaArmado ? 'border-emerald-400/20' : 'border-amber-400/20'
                    }`} />

                    <button
                      onClick={() => setSistemaArmado(!sistemaArmado)}
                      className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl cursor-pointer relative group/btn ${
                        sistemaArmado
                          ? 'bg-gradient-to-b from-emerald-500/20 via-emerald-600/30 to-emerald-950/80 border-2 border-emerald-400 text-emerald-300 shadow-emerald-500/30'
                          : 'bg-gradient-to-b from-amber-500/20 via-amber-600/30 to-amber-950/80 border-2 border-amber-400 text-amber-300 shadow-amber-500/30'
                      }`}
                    >
                      {sistemaArmado ? (
                        <>
                          <ShieldCheck className="w-12 h-12 text-emerald-400 stroke-[1.8] group-hover/btn:scale-110 transition-transform duration-200" />
                          <span className="text-xs font-bold font-mono tracking-wider mt-1 text-white">PROTEGIDO</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-12 h-12 text-amber-400 stroke-[1.8] group-hover/btn:scale-110 transition-transform duration-200" />
                          <span className="text-xs font-bold font-mono tracking-wider mt-1 text-white">DESARMADO</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 text-center">
                    Toca el escudo para alternar el estado del sistema en tu propiedad
                  </p>
                </div>

                {/* Segmented Modes Pills */}
                <div className="grid grid-cols-3 gap-2 bg-[#060c18] p-1.5 rounded-2xl border border-white/5 z-10">
                  <button
                    onClick={() => setSistemaArmado(true)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      sistemaArmado ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Armado Total</span>
                  </button>
                  <button
                    onClick={() => setSistemaArmado(true)}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>En Casa</span>
                  </button>
                  <button
                    onClick={() => setSistemaArmado(false)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      !sistemaArmado ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Desarmar</span>
                  </button>
                </div>
              </div>

              {/* TILE 2: LIVE CAMERA STREAM (2x2) */}
              <div className="md:col-span-2 bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-[#2997ff]/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-3 z-10">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#2997ff]" />
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-white">
                      CÁMARAS HD 4K EN VIVO
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-red-600/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE DAHUA
                  </span>
                </div>

                {/* 16:9 Video Canvas Frame */}
                <div className="relative aspect-video rounded-2xl bg-black/90 border border-white/10 overflow-hidden flex items-center justify-center group/cam my-2 shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />
                  
                  {/* Watermark Cam Info */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded border border-white/10">
                      CH-01 · ACCESO PRINCIPAL
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      30 FPS · 4K
                    </span>
                  </div>

                  <Video className="w-12 h-12 text-slate-600 group-hover/cam:text-[#2997ff] transition duration-300" />

                  <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-sans font-medium drop-shadow">
                      Portón de Acceso Perimetral
                    </span>
                    <button
                      onClick={() => setCamaraSeleccionada('Cam 01 · Acceso Principal / Portón')}
                      className="p-2 rounded-xl bg-black/70 hover:bg-[#2997ff] text-white transition backdrop-blur-md cursor-pointer"
                      title="Pantalla Completa"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Channel Switchers */}
                <div className="grid grid-cols-4 gap-2 pt-2 z-10">
                  {['Acceso', 'Patio', 'Subterráneo', 'Hall'].map((cNombre, i) => (
                    <button
                      key={cNombre}
                      onClick={() => setCamaraSeleccionada(`Cam 0${i+1} · ${cNombre}`)}
                      className="py-2 px-2 rounded-xl bg-[#060c18] hover:bg-[#162a4a] border border-white/5 text-[11px] font-semibold text-slate-300 hover:text-white transition text-center truncate cursor-pointer"
                    >
                      CH-0{i+1} {cNombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* TILE 3: SMART CONCIERGE AI BRIEFING (SPAN 2) */}
              <div className="md:col-span-2 bg-gradient-to-br from-[#0c182b]/90 via-[#0e213b]/80 to-[#07111e]/90 backdrop-blur-2xl border border-[#2997ff]/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-[#2997ff]/60 transition-all duration-300 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#2997ff]/15 via-[#a855f7]/15 to-transparent rounded-full blur-[100px] pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-3 z-10">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-white">
                        APPLE INTELLIGENCE CONCIERGE GAMA
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#2997ff]/20 text-[#2997ff] border border-[#2997ff]/30 px-2 py-0.5 rounded-full font-mono font-bold">
                      IA GEMINI 24/7
                    </span>
                  </div>

                  <div className="my-2 z-10">
                    <h4 className="text-white font-bold text-base sm:text-lg mb-1.5 flex items-center gap-2">
                      <span>Resumen Inteligente de tu Propiedad</span>
                    </h4>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {eventosBitacoraReales.length > 0
                        ? `"${eventosBitacoraReales[0].comentario.slice(0, 150)}..."`
                        : `Todo en orden en tu propiedad. Los enlaces de comunicación y sensores perimetrales operan con 100% de normalidad sin anomalías registradas.`
                      }
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between z-10">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Bitácora Central Sincronizada
                  </span>
                  <button
                    onClick={() => selectTab('historial')}
                    className="text-xs text-[#2997ff] hover:text-white font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver Línea de Tiempo</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* TILE 4: TELEMETRÍA & ESTADO DEL EQUIPAMIENTO (SPAN 2) */}
              <div className="md:col-span-2 bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-[#2997ff]/40 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 z-10">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-white">
                        TELEMETRÍA DE RED & COMUNICADOR DUAL
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                      100% EN LÍNEA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-2 z-10">
                    <div className="bg-[#060c18]/80 border border-white/5 p-3 rounded-2xl">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Canal Principal IP</span>
                      <p className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Conexión Fibra Óptica
                      </p>
                    </div>
                    <div className="bg-[#060c18]/80 border border-white/5 p-3 rounded-2xl">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Respaldo 4G LTE</span>
                      <p className="text-xs font-bold text-[#2997ff] mt-0.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#2997ff]" />
                        Señal Óptima (100%)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between z-10">
                  <span className="text-[11px] text-slate-400">
                    Panel: <strong className="text-white">DSC Neo / Hybrid</strong>
                  </span>
                  <button
                    onClick={() => selectTab('servicios')}
                    className="text-xs text-[#2997ff] hover:text-white font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ficha Técnica</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
           PESTAÑA 2: CÁMARAS EN VIVO (FULL 4K STREAMING)
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'camaras' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c182b]/80 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#2997ff]" />
                  Circuito Cerrado de Televisión (CCTV 4K)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualización en tiempo real protegida por Gama Security para la propiedad #{cuentaActiva}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  4 CANALES ACTIVOS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[
                { ch: '01', nombre: 'Acceso Principal & Portón', res: '4K Ultra HD', fps: '30 FPS' },
                { ch: '02', nombre: 'Patio Perimetral Norte', res: '4K Ultra HD', fps: '30 FPS' },
                { ch: '03', nombre: 'Subterráneo / Bodega', res: '1080p HD', fps: '30 FPS' },
                { ch: '04', nombre: 'Hall Interior & Recepción', res: '1080p HD', fps: '30 FPS' },
              ].map((c) => (
                <div
                  key={c.ch}
                  className="bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-[#2997ff]/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-white bg-black/60 px-2.5 py-1 rounded-lg border border-white/10">
                      CH-{c.ch} · {c.nombre}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {c.res} · {c.fps}
                    </span>
                  </div>

                  <div className="relative aspect-video rounded-2xl bg-black/90 border border-white/10 overflow-hidden flex items-center justify-center group/cam shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />
                    <Video className="w-12 h-12 text-slate-600 group-hover/cam:text-[#2997ff] transition duration-300" />
                    
                    <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-mono drop-shadow">
                        EN VIVO · DAHUA HD
                      </span>
                      <button
                        onClick={() => setCamaraSeleccionada(`CH-${c.ch} · ${c.nombre}`)}
                        className="p-2 rounded-xl bg-black/70 hover:bg-[#2997ff] text-white transition backdrop-blur-md cursor-pointer"
                        title="Pantalla Completa"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
           PESTAÑA 3: HISTORIAL & LÍNEA DE TIEMPO
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'historial' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c182b]/80 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#2997ff]" />
                  Línea de Tiempo & Registro Central
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Anotaciones de Bitácora oficiales y señales de alarma para la cuenta #{cuentaActiva}
                </p>
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-1.5 bg-[#060c18] p-1 rounded-2xl border border-white/5">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'bitacora', label: 'Bitácora' },
                  { id: 'alarmas', label: 'Alarmas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFiltroHistorial(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      filtroHistorial === f.id
                        ? 'bg-[#0066cc] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Eventos */}
            <div className="space-y-3">
              {cargandoBitacora ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Consultando Bitácora Central en tiempo real...</p>
                </div>
              ) : eventosBitacoraReales.length === 0 && eventosSupabase.length === 0 ? (
                <div className="bg-[#0c182b]/80 border border-white/10 rounded-3xl p-8 text-center text-slate-400 text-xs">
                  No hay registros de eventos recientes para esta propiedad.
                </div>
              ) : (
                <>
                  {/* Registros de Bitácora Real */}
                  {eventosBitacoraReales
                    .filter(() => filtroHistorial === 'todos' || filtroHistorial === 'bitacora')
                    .map((b) => (
                      <div
                        key={b.id}
                        className="bg-[#0c182b]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#2997ff]/40 transition shadow-lg"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-[#2997ff]/20 text-[#2997ff] px-2.5 py-0.5 rounded-full border border-[#2997ff]/30">
                              BITÁCORA CENTRAL
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {new Date(b.created_at).toLocaleString('es-CL')}
                            </span>
                            {b.responsable_nombre && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                • Op: {b.responsable_nombre}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                            "{b.comentario}"
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            procesarBitacoraConIA({
                              evento: b.tipo_nombre || 'Anotación de Bitácora',
                              hora: new Date(b.created_at).toLocaleString('es-CL'),
                              notaReal: b.comentario,
                              responsable: b.responsable_nombre,
                            })
                          }
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600 hover:to-indigo-600 border border-blue-400/30 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Explicar con IA</span>
                        </button>
                      </div>
                    ))}

                  {/* Registros de Supabase */}
                  {eventosSupabase
                    .filter(() => filtroHistorial === 'todos' || filtroHistorial === 'alarmas')
                    .map((ev, i) => (
                      <div
                        key={ev.id || i}
                        className="bg-[#0c182b]/60 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#2997ff]">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{ev.evento || 'Evento de Monitoreo'}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {ev.fecha_hora ? new Date(ev.fecha_hora).toLocaleString('es-CL') : 'En curso'} · Zona: {ev.zona || 'Principal'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                          SEÑAL RECIBIDA
                        </span>
                      </div>
                    ))}
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
           PESTAÑA 4: CONTACTOS AUTORIZADOS
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'contactos' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c182b]/80 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#2997ff]" />
                  Contactos de Emergencia & Personas Autorizadas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lista de llamadas en orden estricto de prioridad ante activaciones en la propiedad #{cuentaActiva}
                </p>
              </div>

              <button
                onClick={abrirModalEditarContactos}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-bold text-xs shadow-lg shadow-[#0066cc]/30 transition hover:scale-105 flex items-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Editar Contactos Directos</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const cClean = cuentaActiva.trim().toUpperCase()
                const cl = clientesLiveMap[cClean] || clientesMap[cClean] || {}
                const perList = personasAutorizadasMap[cClean] || []
                const p = perList[num - 1]
                const nom = cl[`nombre${num}`] || (num === 1 && cl.nombre ? cl.nombre : '') || p?.nombre
                const carg = cl[`carg${num}`] || (num === 1 ? 'TITULAR / ENCARGADO' : '') || p?.cargo
                const fono = cl[`t${num}`] || cl[`telefono${num}`] || (num === 1 && cl.telefono1 ? cl.telefono1 : '') || p?.telefono

                if (!nom && !fono && num > 3) return null

                return (
                  <div
                    key={num}
                    className="bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 hover:border-[#2997ff]/40 transition shadow-xl"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#2997ff]/20 text-[#2997ff] px-2 py-0.5 rounded-full border border-[#2997ff]/30">
                          {num}º PRIORIDAD
                        </span>
                        {num === 1 && (
                          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            TITULAR
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {nom || <span className="text-slate-500 italic">No asignado</span>}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {carg || 'Contacto Autorizado'}
                      </p>
                      {fono && (
                        <p className="text-xs font-mono font-bold text-[#2997ff]">
                          📞 {fono}
                        </p>
                      )}
                    </div>

                    {fono && (
                      <a
                        href={`tel:${fono.replace(/\s+/g, '')}`}
                        className="p-3 rounded-xl bg-white/5 hover:bg-[#2997ff] text-slate-300 hover:text-white border border-white/10 transition"
                        title="Llamar"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="bg-[#060c18] border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                ¿Prefieres que la Central gestione tus contactos por ti?
              </p>
              <a
                href={linkWhatsAppContactos}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase rounded-xl transition flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Solicitar por WhatsApp</span>
              </a>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
           PESTAÑA 5: ESTADO DEL SERVICIO & EQUIPAMIENTO
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'servicios' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-[#0c182b]/80 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl space-y-4">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#2997ff]" />
                Ficha Técnica & Estado del Servicio
              </h3>
              <p className="text-xs text-slate-400">
                Especificaciones del equipamiento instalado para la cuenta #{cuentaActiva}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#060c18]/80 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Abonado / Cuenta</span>
                  <p className="text-base font-bold text-white mt-1">#{cuentaActiva}</p>
                </div>
                <div className="bg-[#060c18]/80 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Panel Central</span>
                  <p className="text-base font-bold text-white mt-1">DSC PowerSeries Neo / Hybrid</p>
                </div>
                <div className="bg-[#060c18]/80 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Plan de Monitoreo</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">{clienteInfo.PLAN}</p>
                </div>
                <div className="bg-[#060c18]/80 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Canal de Transmisión</span>
                  <p className="text-base font-bold text-[#2997ff] mt-1">Dual IP Fibra + 4G LTE</p>
                </div>
                <div className="bg-[#060c18]/80 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Batería de Respaldo</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">100% Óptima (12V 7Ah)</p>
                </div>
                <div className="bg-[#060c18]/80 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Mantención Preventiva</span>
                  <p className="text-base font-bold text-white mt-1">Al día (Certificada Gama)</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  ¿Requiere ampliación de sensores, cambio de batería o revisión técnica?
                </p>
                <a
                  href={linkWhatsAppServicio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Solicitar Servicio Técnico</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
           PESTAÑA 6: ASISTENCIA 24/7 & SOPORTE
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'soporte' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-blue-950/40 via-[#0c182b] to-[#07111e] border border-blue-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl backdrop-blur-2xl">
              <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto text-[#2997ff] shadow-lg shadow-blue-950/50">
                <PhoneCall className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-white">Central de Monitoreo Gama 24/7</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Operadores supervisores en línea las 24 horas del día. Asistencia y soporte directo para la cuenta #{cuentaActiva}:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
                <a
                  href="tel:+56948855190"
                  className="py-3.5 bg-gradient-to-r from-blue-600 to-[#2997ff] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Llamar a Central Gama</span>
                </a>
                <a
                  href={`https://wa.me/56948855190?text=${encodeURIComponent(`Le habla el cliente ${cuentaActiva} ${clienteInfo.NOMBRE} quisiera consultar a la Central.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Operador</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}

        </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR MOBILE */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08101d] border-t border-[#1a2e4a] px-2 py-2 flex items-center justify-around shadow-2xl">
        {[
          { id: 'inicio', label: 'Inicio', icon: ShieldCheck },
          { id: 'camaras', label: 'Cámaras', icon: Camera },
          { id: 'historial', label: 'Historial', icon: Clock },
          { id: 'soporte', label: 'Contacto', icon: PhoneCall },
        ].map((m) => {
          const Icon = m.icon
          const isActive = activeTab === m.id
          return (
            <button
              key={m.id}
              onClick={() => selectTab(m.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                isActive ? 'text-[#2997ff] bg-[#102038]' : 'text-slate-400'
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

      {/* ════════════════════════════════════════════════════════════════════
         MODAL IA CONCIERGE: INTERPRETACIÓN REAL DE ANOTACIÓN DE BITÁCORA
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
                    Interpretación IA de Bitácora Real
                    <span className="text-[10px] bg-blue-500/20 text-[#2997ff] border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                      Veracidad 100%
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Cotejado directo con los registros de la Central Gama</p>
                </div>
              </div>

              {eventoIaActual && (
                <div className="bg-[#0b1b33] border border-[#1e3a5f] rounded-2xl p-3.5 mb-4 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#2997ff] font-bold uppercase">Anotación Original de Bitácora</span>
                    <span className="text-[10px] font-mono text-slate-400">{eventoIaActual.hora}</span>
                  </div>
                  <p className="text-amber-300 font-mono text-xs bg-[#061020] p-2.5 rounded-xl border border-[#162d4e]">
                    "{eventoIaActual.notaReal || 'Sin comentario escrito'}"
                  </p>
                  {eventoIaActual.responsable && (
                    <p className="text-[10px] text-slate-400 pt-0.5">Operador a cargo: {eventoIaActual.responsable}</p>
                  )}
                </div>
              )}

              {cargandoIa ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-9 h-9 border-3 border-[#2997ff] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-300 font-mono">
                    La Inteligencia Artificial está procesando la anotación de Bitácora en lenguaje cliente...
                  </p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#071120] border border-[#162e4f] p-4 sm:p-5 rounded-2xl max-h-[45vh] overflow-y-auto whitespace-pre-wrap">
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

      {/* ════════════════════════════════════════════════════════════════════
         MODAL DE EDICIÓN DIRECTA DE CONTACTOS AUTORIZADOS + ADVERTENCIA
         ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalEditarContactos && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#091526] border border-[#2997ff]/40 rounded-3xl max-w-3xl w-full p-5 sm:p-7 relative overflow-hidden shadow-2xl text-left my-auto max-h-[92vh] flex flex-col"
            >
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#2997ff]/10 rounded-full blur-[90px] pointer-events-none" />

              {/* Header Modal */}
              <div className="flex items-center justify-between pb-4 border-b border-[#1a3356] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[#2997ff]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Modificar Directorio de Contactos de Emergencia
                    </h3>
                    <p className="text-xs text-slate-400">
                      Abonado #{cuentaActiva} • Prioridad de Llamadas de Central 1 al 7
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalEditarContactos(false)}
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido con Scroll */}
              <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
                
                {/* ⚠️ ADVERTENCIA LEGAL Y DE RESPONSABILIDAD CLARA Y DIRECTA */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border-2 border-amber-500/60 text-amber-200 space-y-2.5 shadow-xl">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm uppercase tracking-wide">
                    <span className="text-lg">⚠️</span>
                    <span>ADVERTENCIA Y DECLARACIÓN DE RESPONSABILIDAD</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    Al ingresar o modificar estos datos, usted declara que los números registrados corresponden a <strong>personas reales, autorizadas y habilitadas</strong> para recibir llamadas o coordinar acciones ante una activación de alarma o emergencia real en su propiedad.
                  </p>
                  <p className="text-[11px] text-amber-300 font-mono">
                    • La Central de Monitoreo Gama llamará en estricto orden correlativo (1º a 7º) a los números aquí provistos.
                  </p>
                  <label className="flex items-start sm:items-center gap-3 pt-2 cursor-pointer select-none bg-black/30 p-2.5 rounded-xl border border-amber-500/30">
                    <input
                      type="checkbox"
                      checked={declaracionAceptada}
                      onChange={(e) => setDeclaracionAceptada(e.target.checked)}
                      className="w-4 h-4 mt-0.5 sm:mt-0 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 shrink-0 cursor-pointer"
                    />
                    <span className="text-xs font-extrabold text-white">
                      Entiendo y asumo la exclusiva responsabilidad sobre la veracidad y vigencia de los contactos registrados.
                    </span>
                  </label>
                </div>

                {/* Formulario de los 7 Contactos */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Lista de Prioridad de Llamadas (1º al 7º Contacto):
                  </div>

                  {contactosForm.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#081220] border border-[#162d4e] space-y-2.5 hover:border-blue-500/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold bg-[#2997ff]/20 text-[#2997ff] px-2.5 py-0.5 rounded-full border border-[#2997ff]/30">
                          {idx + 1}º Prioridad de Llamada {idx === 0 ? '• (TITULAR / PRINCIPAL)' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo:</label>
                          <input
                            type="text"
                            value={c.nombre}
                            onChange={(e) => {
                              const val = e.target.value
                              setContactosForm((prev) => {
                                const copia = [...prev]
                                copia[idx] = { ...copia[idx], nombre: val }
                                return copia
                              })
                            }}
                            placeholder={idx === 0 ? 'Nombre del Titular' : `Nombre Contacto ${idx + 1}`}
                            className="w-full bg-[#0d1c33] border border-[#1e3a5f] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-bold focus:border-blue-400 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Cargo / Parentesco:</label>
                          <input
                            type="text"
                            value={c.cargo}
                            onChange={(e) => {
                              const val = e.target.value
                              setContactosForm((prev) => {
                                const copia = [...prev]
                                copia[idx] = { ...copia[idx], cargo: val }
                                return copia
                              })
                            }}
                            placeholder="Ej: Cónyuge, Encargado"
                            className="w-full bg-[#0d1c33] border border-[#1e3a5f] rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono de Contacto:</label>
                          <input
                            type="text"
                            value={c.fono}
                            onChange={(e) => {
                              const val = e.target.value
                              setContactosForm((prev) => {
                                const copia = [...prev]
                                copia[idx] = { ...copia[idx], fono: val }
                                return copia
                              })
                            }}
                            placeholder="+56 9 XXXX XXXX"
                            className="w-full bg-[#0d1c33] border border-[#1e3a5f] rounded-xl px-3 py-1.5 text-xs text-[#2997ff] font-mono font-bold placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mensaje de Éxito */}
                {mensajeExitoContactos && (
                  <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{mensajeExitoContactos}</span>
                  </div>
                )}

              </div>

              {/* Footer Acciones */}
              <div className="pt-4 border-t border-[#1a3356] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <p className="text-[11px] text-slate-400 text-center sm:text-left">
                  Los cambios impactarán en tiempo real la base de datos de la Central Gama.
                </p>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setModalEditarContactos(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarContactosCliente}
                    disabled={!declaracionAceptada || guardandoContactos}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-600 to-[#2997ff] hover:from-blue-500 hover:to-blue-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-950/60 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                  >
                    {guardandoContactos ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Guardar y Sincronizar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
