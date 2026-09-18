'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  ChevronRight,
  Copy,
  Check,
  FileText,
  KeyRound,
  Layers,
  ArrowLeft,
  Search,
  MessageSquare,
  HelpCircle
} from 'lucide-react'

interface ContactoItem {
  prioridad: number
  nombre: string
  cargo: string
  fono: string
  clave: string
}

interface PropiedadFicha {
  cuenta: string
  nombre_propiedad: string
  direccion: string
  ciudad: string
  sector?: string
  referencia_acceso: string
  plan?: string
  contactos: ContactoItem[]
  procedimiento_especial: string
  declaracion_aceptada: boolean
}

interface TitularInfo {
  rut: string
  nombre_razon_social: string
  email_contacto: string
  email_cobranza: string
  telefono_titular: string
  cuentas: string[]
}

export default function FichaActualizacionCliente() {
  // Estado de Búsqueda / Identificación
  const [modoIdentificacion, setModoIdentificacion] = useState<'rut' | 'cuenta'>('rut')
  const [inputIdentificador, setInputIdentificador] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState('')

  // Estado de Datos Cargados
  const [datosCargados, setDatosCargados] = useState(false)
  const [titular, setTitular] = useState<TitularInfo | null>(null)
  const [propiedades, setPropiedades] = useState<PropiedadFicha[]>([])
  const [propiedadActivaIdx, setPropiedadActivaIdx] = useState(0)

  // Estado de Guardado
  const [declaracionAceptada, setDeclaracionAceptada] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [exitoGuardado, setExitoGuardado] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')

  // Efecto: Leer parámetros de URL al iniciar (?rut=... o ?cuenta=... o ?token=...)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const rutParam = params.get('rut')
    const cuentaParam = params.get('cuenta')
    const tokenParam = params.get('token')

    if (tokenParam) {
      ejecutarBusqueda({ token: tokenParam })
    } else if (rutParam) {
      setInputIdentificador(rutParam)
      setModoIdentificacion('rut')
      ejecutarBusqueda({ rut: rutParam })
    } else if (cuentaParam) {
      setInputIdentificador(cuentaParam)
      setModoIdentificacion('cuenta')
      ejecutarBusqueda({ cuenta: cuentaParam })
    }
  }, [])

  // Función para consultar API
  const ejecutarBusqueda = async (params: { rut?: string; cuenta?: string; token?: string }) => {
    setErrorBusqueda('')
    setBuscando(true)
    setExitoGuardado(false)

    const query = new URLSearchParams()
    if (params.rut) query.set('rut', params.rut)
    if (params.cuenta) query.set('cuenta', params.cuenta)
    if (params.token) query.set('token', params.token)

    try {
      const res = await fetch(`/api/actualizar-cliente?${query.toString()}`)
      const data = await res.json()

      if (data.success && data.titular && data.propiedades) {
        setTitular(data.titular)
        setPropiedades(data.propiedades)
        setPropiedadActivaIdx(0)
        setDeclaracionAceptada(false)
        setDatosCargados(true)
      } else {
        setErrorBusqueda(data.error || 'No se encontró la información con los datos ingresados.')
      }
    } catch (err: any) {
      setErrorBusqueda('Error de conexión con la Central Gama. Por favor intente nuevamente.')
    } finally {
      setBuscando(false)
    }
  }

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputIdentificador.trim()) {
      setErrorBusqueda('Por favor ingrese un RUT o Código de Abonado.')
      return
    }

    if (modoIdentificacion === 'rut') {
      ejecutarBusqueda({ rut: inputIdentificador.trim() })
    } else {
      ejecutarBusqueda({ cuenta: inputIdentificador.trim().toUpperCase() })
    }
  }

  // Modificar campo del titular
  const handleTitularChange = (campo: keyof TitularInfo, valor: string) => {
    if (!titular) return
    setTitular({ ...titular, [campo]: valor })
  }

  // Modificar campo de la propiedad activa
  const handlePropiedadChange = (campo: keyof PropiedadFicha, valor: any) => {
    setPropiedades((prev) => {
      const copia = [...prev]
      copia[propiedadActivaIdx] = {
        ...copia[propiedadActivaIdx],
        [campo]: valor
      }
      return copia
    })
  }

  // Modificar contacto específico de la propiedad activa
  const handleContactoChange = (contactoIdx: number, campo: keyof ContactoItem, valor: string) => {
    setPropiedades((prev) => {
      const copia = [...prev]
      const contactosCopia = [...copia[propiedadActivaIdx].contactos]
      contactosCopia[contactoIdx] = {
        ...contactosCopia[contactoIdx],
        [campo]: valor
      }
      copia[propiedadActivaIdx].contactos = contactosCopia
      return copia
    })
  }

  // Replicar contactos de la propiedad activa en todas las propiedades del RUT
  const replicarContactosATodas = () => {
    if (propiedades.length <= 1) return
    const contactosOrigen = propiedades[propiedadActivaIdx].contactos

    setPropiedades((prev) =>
      prev.map((prop, idx) => {
        if (idx === propiedadActivaIdx) return prop
        return {
          ...prop,
          contactos: JSON.parse(JSON.stringify(contactosOrigen))
        }
      })
    )
    alert('¡Contactos replicados en todas las propiedades de su RUT exitosamente!')
  }

  // Guardar ficha oficial
  const handleGuardarFicha = async () => {
    if (!declaracionAceptada) {
      setErrorGuardado('Debe marcar la declaración de veracidad y responsabilidad para poder guardar.')
      return
    }

    if (!titular?.nombre_razon_social?.trim()) {
      setErrorGuardado('Por favor complete el nombre o razón social del titular.')
      return
    }

    setGuardando(true)
    setErrorGuardado('')

    try {
      const res = await fetch('/api/actualizar-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titular,
          propiedades,
          declaracionAceptada
        })
      })

      const data = await res.json()
      if (data.success) {
        setExitoGuardado(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setErrorGuardado(data.error || 'Error al guardar los datos.')
      }
    } catch (e) {
      setErrorGuardado('Error de conexión al guardar. Intente de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const propActual = propiedades[propiedadActivaIdx]

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-[#2997ff]/30 selection:text-white pb-24">
      {/* Glows ambientales Apple HomeKit */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-[#0066cc]/20 via-[#2997ff]/5 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-tl from-[#10b981]/15 via-[#0066cc]/10 to-transparent rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* ── HEADER PRINCIPAL ── */}
      <header className="sticky top-0 z-30 bg-[#030712]/80 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/logo-gama.png"
                alt="GAMA Security"
                width={42}
                height={42}
                className="object-contain filter drop-shadow(0 0 12px rgba(41,151,255,0.7))"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-mono">
                  GAMA<span className="text-[#2997ff]">SECURITY</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#2997ff] text-[10px] font-semibold font-mono">
                  <Lock className="w-3 h-3" />
                  PORTAL SEGURO SSL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ficha Oficial de Información & Contactos de Emergencia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/56948855190?text=Hola,%20necesito%20asistencia%20con%20la%20Ficha%20de%20Actualización%20de%20Gama%20Security."
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-300 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Ayuda Central WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

        {/* ════════════════════════════════════════════════════════════════════
           PANTALLA 1: IDENTIFICACIÓN POR RUT O CUENTA (SI NO HA CARGADO DATOS)
           ════════════════════════════════════════════════════════════════════ */}
        {!datosCargados ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto space-y-6 pt-4"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#2997ff] text-xs font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ACTUALIZACIÓN SEGURA DE CLIENTES GAMA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Actualiza tus Contactos & Ficha de Propiedad
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Ingresa tu RUT o número de cuenta de abonado para cargar tu ficha y sincronizar tus contactos con la Central de Monitoreo 24/7.
              </p>
            </div>

            <div className="bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              {/* Selector de Modo */}
              <div className="grid grid-cols-2 gap-2 bg-[#060c18] p-1 rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setModoIdentificacion('rut')
                    setErrorBusqueda('')
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    modoIdentificacion === 'rut'
                      ? 'bg-[#0066cc] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Por RUT (Titular)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModoIdentificacion('cuenta')
                    setErrorBusqueda('')
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    modoIdentificacion === 'cuenta'
                      ? 'bg-[#0066cc] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Por Nº de Cuenta</span>
                </button>
              </div>

              <form onSubmit={handleBuscar} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide block mb-1.5">
                    {modoIdentificacion === 'rut'
                      ? 'RUT de Cliente / Empresa:'
                      : 'Número de Cuenta o Abonado:'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputIdentificador}
                      onChange={(e) => setInputIdentificador(e.target.value)}
                      placeholder={modoIdentificacion === 'rut' ? 'Ej: 13.756.882-9 ó 76.123.456-K' : 'Ej: C701 ó 0014'}
                      className="w-full bg-[#060c18] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-[#2997ff] focus:ring-2 focus:ring-[#2997ff]/20 transition"
                      autoFocus
                    />
                    <div className="absolute right-3.5 top-3.5 text-slate-500">
                      <Search className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {errorBusqueda && (
                  <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorBusqueda}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={buscando}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-[#0066cc]/30 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {buscando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Consultando Ficha...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Cargar & Actualizar Ficha</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-white/5 text-center">
                <p className="text-[11px] text-slate-500">
                  ¿Tienes dudas con tu cuenta? Contáctanos directamente al <strong>+56 9 4885 5190</strong>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ════════════════════════════════════════════════════════════════════
             PANTALLA 2: FORMULARIO MULTI-ABONADO CARGADO CON ÉXITO
             ════════════════════════════════════════════════════════════════════ */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Mensaje de Éxito al Guardar */}
            {exitoGuardado && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-2xl backdrop-blur-xl animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  ¡Ficha Oficial Actualizada & Sincronizada!
                </h2>
                <p className="text-xs sm:text-sm text-emerald-200 max-w-xl mx-auto leading-relaxed">
                  Los datos del titular y los contactos de emergencia de tus propiedades han quedado debidamente actualizados en la base de datos central de Gama Seguridad y alimentarán los protocolos de respuesta 24/7.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setExitoGuardado(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                  >
                    Seguir Editando
                  </button>
                </div>
              </div>
            )}

            {/* Cabecera con selector Multi-Propiedad */}
            <div className="bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDatosCargados(false)
                      setInputIdentificador('')
                    }}
                    className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-semibold transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cambiar de RUT / Cliente</span>
                  </button>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {titular?.nombre_razon_social || 'Cliente Gama'}
                </h1>
                <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span>RUT: <strong className="text-white">{titular?.rut}</strong></span>
                  <span>•</span>
                  <span>{propiedades.length} {propiedades.length === 1 ? 'Propiedad Protegida' : 'Propiedades Asociadas'}</span>
                </p>
              </div>

              {/* Selector de Pestañas de Propiedades (Si tiene más de 1 cuenta) */}
              {propiedades.length > 1 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Seleccionar Propiedad:</span>
                  <div className="flex flex-wrap gap-1.5 bg-[#060c18] p-1 rounded-2xl border border-white/5">
                    {propiedades.map((p, idx) => (
                      <button
                        key={p.cuenta}
                        onClick={() => setPropiedadActivaIdx(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          propiedadActivaIdx === idx
                            ? 'bg-[#0066cc] text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>#{p.cuenta}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── BENTO GRID DEL FORMULARIO ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* CARD 1: DATOS GENERALES DEL TITULAR & FACTURACIÓN (SPAN 4) */}
              <div className="lg:col-span-4 bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                  <Users className="w-4 h-4 text-[#2997ff]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Datos del Titular / Empresa
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Nombre Completo / Razón Social:
                    </label>
                    <input
                      type="text"
                      value={titular?.nombre_razon_social || ''}
                      onChange={(e) => handleTitularChange('nombre_razon_social', e.target.value)}
                      className="w-full bg-[#060c18] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      RUT Titular / Empresa:
                    </label>
                    <input
                      type="text"
                      value={titular?.rut || ''}
                      onChange={(e) => handleTitularChange('rut', e.target.value)}
                      className="w-full bg-[#060c18] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Teléfono Principal de Contacto:
                    </label>
                    <input
                      type="text"
                      value={titular?.telefono_titular || ''}
                      onChange={(e) => handleTitularChange('telefono_titular', e.target.value)}
                      placeholder="+56 9 XXXX XXXX"
                      className="w-full bg-[#060c18] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#2997ff] focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Correo Electrónico (Notificaciones):
                    </label>
                    <input
                      type="email"
                      value={titular?.email_contacto || ''}
                      onChange={(e) => handleTitularChange('email_contacto', e.target.value)}
                      placeholder="ejemplo: contacto@empresa.cl"
                      className="w-full bg-[#060c18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Correo Electrónico (Facturación / Cobranza):
                    </label>
                    <input
                      type="email"
                      value={titular?.email_cobranza || ''}
                      onChange={(e) => handleTitularChange('email_cobranza', e.target.value)}
                      placeholder="ejemplo: cobranza@empresa.cl"
                      className="w-full bg-[#060c18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>
                </div>

                {/* Resumen de Cuentas Asociadas */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Cuentas asociadas a este RUT:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {propiedades.map((p, idx) => (
                      <span
                        key={p.cuenta}
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                          propiedadActivaIdx === idx
                            ? 'bg-[#0066cc]/30 text-white border-[#2997ff]/50'
                            : 'bg-white/5 text-slate-300 border-white/10'
                        }`}
                      >
                        #{p.cuenta}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD 2: DETALLES DE LA PROPIEDAD SELECCIONADA & CONTACTOS (SPAN 8) */}
              <div className="lg:col-span-8 space-y-6">

                {/* Ficha de la Propiedad Específica */}
                <div className="bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#2997ff]" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Propiedad Seleccionada: #{propActual?.cuenta}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono bg-[#2997ff]/20 text-[#2997ff] border border-[#2997ff]/30 px-2.5 py-0.5 rounded-full font-bold">
                      {propActual?.plan || 'PLAN MONITOREO VIP'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Nombre de la Sucursal / Residencia:
                      </label>
                      <input
                        type="text"
                        value={propActual?.nombre_propiedad || ''}
                        onChange={(e) => handlePropiedadChange('nombre_propiedad', e.target.value)}
                        placeholder="Ej: Casa Matriz Viña / Residencia Principal"
                        className="w-full bg-[#060c18] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#2997ff]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Ciudad / Comuna:
                      </label>
                      <input
                        type="text"
                        value={propActual?.ciudad || ''}
                        onChange={(e) => handlePropiedadChange('ciudad', e.target.value)}
                        placeholder="Ej: Viña del Mar, Limache, Santiago"
                        className="w-full bg-[#060c18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2997ff]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Dirección Exacta de la Propiedad:
                      </label>
                      <input
                        type="text"
                        value={propActual?.direccion || ''}
                        onChange={(e) => handlePropiedadChange('direccion', e.target.value)}
                        placeholder="Calle, Número, Depto o Parcela"
                        className="w-full bg-[#060c18] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#2997ff]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Referencias de Acceso para Patrullas & Técnicos:
                      </label>
                      <textarea
                        rows={2}
                        value={propActual?.referencia_acceso || ''}
                        onChange={(e) => handlePropiedadChange('referencia_acceso', e.target.value)}
                        placeholder="Ej: Portón de madera color rojo carmesí, al lado de la plaza, casa de dos pisos blanca..."
                        className="w-full bg-[#060c18] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#2997ff]"
                      />
                    </div>
                  </div>
                </div>

                {/* ── MATRIZ DE CONTACTOS DE EMERGENCIA (1º AL 7º) ── */}
                <div className="bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#2997ff]" />
                        <span>Lista de Llamadas en Orden de Prioridad (1º al 7º)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        La Central de Monitoreo llamará correlativamente a estos números ante un salto de alarma.
                      </p>
                    </div>

                    {propiedades.length > 1 && (
                      <button
                        type="button"
                        onClick={replicarContactosATodas}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#0066cc] text-slate-300 hover:text-white text-[11px] font-semibold transition border border-white/10 flex items-center gap-1.5 cursor-pointer"
                        title="Replicar esta lista en todas mis propiedades"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Replicar en todas las cuentas</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {propActual?.contactos?.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3.5 rounded-2xl bg-[#060c18]/90 border border-white/5 space-y-2.5 hover:border-[#2997ff]/30 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            cIdx === 0
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-[#2997ff]/20 text-[#2997ff] border-[#2997ff]/30'
                          }`}>
                            {cIdx + 1}º PRIORIDAD {cIdx === 0 ? '• (TITULAR / ENCARGADO PRINCIPAL)' : ''}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          <div className="sm:col-span-5 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo:</label>
                            <input
                              type="text"
                              value={c.nombre}
                              onChange={(e) => handleContactoChange(cIdx, 'nombre', e.target.value)}
                              placeholder={cIdx === 0 ? 'Nombre del Titular' : `Contacto ${cIdx + 1}`}
                              className="w-full bg-[#0d1c33] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-bold focus:border-[#2997ff] focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Cargo / Parentesco:</label>
                            <input
                              type="text"
                              value={c.cargo}
                              onChange={(e) => handleContactoChange(cIdx, 'cargo', e.target.value)}
                              placeholder="Ej: Titular, Cónyuge, Guardia"
                              className="w-full bg-[#0d1c33] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-[#2997ff] focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-4 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono de Contacto:</label>
                            <input
                              type="text"
                              value={c.fono}
                              onChange={(e) => handleContactoChange(cIdx, 'fono', e.target.value)}
                              placeholder="+56 9 XXXX XXXX"
                              className="w-full bg-[#0d1c33] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#2997ff] font-mono font-bold placeholder-slate-500 focus:border-[#2997ff] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Procedimiento Especial */}
                  <div className="pt-3 border-t border-white/10 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      Observaciones o Procedimientos Especiales para la Central:
                    </label>
                    <textarea
                      rows={2}
                      value={propActual?.procedimiento_especial || ''}
                      onChange={(e) => handlePropiedadChange('procedimiento_especial', e.target.value)}
                      placeholder="Ej: Informar aperturas y cierres por SMS a encargada después de las 21:00 hrs..."
                      className="w-full bg-[#060c18] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* ── CARD 3: DECLARACIÓN JURADA Y BOTÓN GUARDAR (FULL WIDTH) ── */}
            <div className="bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="bg-[#060c18] border border-amber-500/30 p-4 sm:p-5 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Declaración de Veracidad & Responsabilidad de Contactos</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Al enviar este formulario, usted declara que los números y nombres registrados corresponden a <strong>personas reales, autorizadas y habilitadas</strong> para recibir llamadas o autorizar procedimientos ante activaciones de alarma de su propiedad en la Central Gama Security.
                </p>

                <label className="flex items-start sm:items-center gap-3 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={declaracionAceptada}
                    onChange={(e) => setDeclaracionAceptada(e.target.checked)}
                    className="w-4 h-4 mt-0.5 sm:mt-0 rounded text-[#0066cc] bg-black border-slate-700 focus:ring-[#2997ff] shrink-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-white">
                    He revisado la información provista y asumo la responsabilidad sobre la exactitud de los números de contacto.
                  </span>
                </label>
              </div>

              {errorGuardado && (
                <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorGuardado}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-[11px] text-slate-400 text-center sm:text-left">
                  Los cambios impactarán en tiempo real la base de datos de la Central de Monitoreo Gama.
                </p>

                <button
                  type="button"
                  onClick={handleGuardarFicha}
                  disabled={!declaracionAceptada || guardando}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-[#2997ff] hover:from-blue-500 hover:to-blue-400 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-blue-950/60 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {guardando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sincronizando con Central...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar & Sincronizar Ficha Oficial</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </motion.div>
        )}

      </main>
    </div>
  )
}
