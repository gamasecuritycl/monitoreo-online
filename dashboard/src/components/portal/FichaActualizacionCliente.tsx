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
  const [consentimientoDatosAceptado, setConsentimientoDatosAceptado] = useState(false)
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
    if (!declaracionAceptada || !consentimientoDatosAceptado) {
      setErrorGuardado('Debe marcar ambas casillas obligatorias de veracidad y consentimiento de la Ley N° 21.719 para poder guardar.')
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
          declaracionAceptada,
          consentimientoDatosAceptado
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
    <div className="min-h-screen bg-[#EAEFF5] text-slate-800 font-sans selection:bg-blue-100 selection:text-[#0B2545] pb-24">
      
      {/* ── HEADER PRINCIPAL ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-300/80 px-4 sm:px-8 py-4 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/logo-gama.png"
                alt="GAMA Security"
                width={42}
                height={42}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-[#0B2545] font-sans">
                  GAMA <span className="text-[#DC2626]">SECURITY</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#1E40AF] text-[10px] font-bold font-mono">
                  <Lock className="w-3 h-3" />
                  PORTAL SEGURO SSL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Ficha Oficial de Información & Contactos de Emergencia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/56948855190?text=Hola,%20necesito%20asistencia%20con%20la%20Ficha%20de%20Actualización%20de%20Gama%20Security."
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
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
            <div className="text-center space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E40AF] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>ACTUALIZACIÓN SEGURA DE CLIENTES GAMA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Actualiza tus Contactos & Ficha de Propiedad
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Ingresa tu RUT o número de cuenta de abonado para cargar tu ficha y sincronizar tus contactos con la Central de Monitoreo 24/7.
              </p>
            </div>

            <div className="bg-white border border-slate-300/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Selector de Modo */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setModoIdentificacion('rut')
                    setErrorBusqueda('')
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    modoIdentificacion === 'rut'
                      ? 'bg-[#0B2545] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
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
                      ? 'bg-[#0B2545] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Por Nº de Cuenta</span>
                </button>
              </div>

              <form onSubmit={handleBuscar} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-[#1E40AF] focus:bg-white transition"
                      autoFocus
                    />
                    <div className="absolute right-3.5 top-3.5 text-slate-400">
                      <Search className="w-5 h-5 text-[#1E40AF]" />
                    </div>
                  </div>
                </div>

                {errorBusqueda && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorBusqueda}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={buscando}
                  className="w-full py-3.5 rounded-xl bg-[#0B2545] hover:bg-[#1E40AF] text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-500 font-medium">
                  ¿Tienes dudas con tu cuenta? Contáctanos directamente al <strong className="text-slate-800">+56 9 4885 5190</strong>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Mensaje de Éxito al Guardar */}
            {exitoGuardado && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-sm animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-white border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  ¡Ficha Oficial Actualizada & Sincronizada!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                  Los datos del titular y los contactos de emergencia de tus propiedades han quedado debidamente actualizados en la base de datos central de Gama Seguridad y alimentarán los protocolos de respuesta 24/7.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setExitoGuardado(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#1E40AF] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    Seguir Editando
                  </button>
                </div>
              </div>
            )}

            {/* Cabecera con selector Multi-Propiedad */}
            <div className="bg-white border border-slate-300/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDatosCargados(false)
                      setInputIdentificador('')
                    }}
                    className="text-slate-500 hover:text-[#1E40AF] text-xs flex items-center gap-1 font-bold transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#1E40AF]" />
                    <span>Cambiar de RUT / Cliente</span>
                  </button>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {titular?.nombre_razon_social || 'Cliente Gama'}
                </h1>
                <p className="text-xs text-slate-500 font-mono flex items-center gap-2 font-medium">
                  <span>RUT: <strong className="text-slate-900 font-bold">{titular?.rut}</strong></span>
                  <span>•</span>
                  <span>{propiedades.length} {propiedades.length === 1 ? 'Propiedad Protegida' : 'Propiedades Asociadas'}</span>
                </p>
              </div>

              {/* Selector de Pestañas de Propiedades (Si tiene más de 1 cuenta) */}
              {propiedades.length > 1 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Seleccionar Propiedad:</span>
                  <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    {propiedades.map((p, idx) => (
                      <button
                        key={p.cuenta}
                        onClick={() => setPropiedadActivaIdx(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          propiedadActivaIdx === idx
                            ? 'bg-[#0B2545] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
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
              <div className="lg:col-span-4 bg-white border border-slate-300/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#1E40AF] border border-blue-200">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Datos del Titular / Empresa
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Nombre Completo / Razón Social:
                    </label>
                    <input
                      type="text"
                      value={titular?.nombre_razon_social || ''}
                      onChange={(e) => handleTitularChange('nombre_razon_social', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      RUT Titular / Empresa:
                    </label>
                    <input
                      type="text"
                      value={titular?.rut || ''}
                      onChange={(e) => handleTitularChange('rut', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Teléfono Principal de Contacto:
                    </label>
                    <input
                      type="text"
                      value={titular?.telefono_titular || ''}
                      onChange={(e) => handleTitularChange('telefono_titular', e.target.value)}
                      placeholder="+56 9 XXXX XXXX"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#1E40AF] focus:outline-none focus:border-[#1E40AF] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Correo Electrónico (Notificaciones):
                    </label>
                    <input
                      type="email"
                      value={titular?.email_contacto || ''}
                      onChange={(e) => handleTitularChange('email_contacto', e.target.value)}
                      placeholder="ejemplo: contacto@empresa.cl"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Correo Electrónico (Facturación / Cobranza):
                    </label>
                    <input
                      type="email"
                      value={titular?.email_cobranza || ''}
                      onChange={(e) => handleTitularChange('email_cobranza', e.target.value)}
                      placeholder="ejemplo: cobranza@empresa.cl"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Resumen de Cuentas Asociadas */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                    Cuentas asociadas a este RUT:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {propiedades.map((p, idx) => (
                      <span
                        key={p.cuenta}
                        className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                          propiedadActivaIdx === idx
                            ? 'bg-[#0B2545] text-white border-[#0B2545]'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
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
                <div className="bg-white border border-slate-300/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-blue-50 text-[#1E40AF] border border-blue-200">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Propiedad Seleccionada: #{propActual?.cuenta}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono bg-blue-50 text-[#1E40AF] border border-blue-200 px-3 py-1 rounded-full font-bold">
                      {propActual?.plan || 'PLAN MONITOREO 24/7'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Nombre de la Sucursal / Residencia:
                      </label>
                      <input
                        type="text"
                        value={propActual?.nombre_propiedad || ''}
                        onChange={(e) => handlePropiedadChange('nombre_propiedad', e.target.value)}
                        placeholder="Ej: Casa Matriz Viña / Residencia Principal"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Ciudad / Comuna:
                      </label>
                      <input
                        type="text"
                        value={propActual?.ciudad || ''}
                        onChange={(e) => handlePropiedadChange('ciudad', e.target.value)}
                        placeholder="Ej: Viña del Mar, Limache, Santiago"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Dirección Exacta de la Propiedad:
                      </label>
                      <input
                        type="text"
                        value={propActual?.direccion || ''}
                        onChange={(e) => handlePropiedadChange('direccion', e.target.value)}
                        placeholder="Calle, Número, Depto o Parcela"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Referencias de Acceso para Patrullas & Técnicos:
                      </label>
                      <textarea
                        rows={2}
                        value={propActual?.referencia_acceso || ''}
                        onChange={(e) => handlePropiedadChange('referencia_acceso', e.target.value)}
                        placeholder="Ej: Portón de madera, al lado de la plaza, casa de dos pisos..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#1E40AF] focus:bg-white resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ── MATRIZ DE CONTACTOS DE EMERGENCIA (1º AL 7º) ── */}
                <div className="bg-white border border-slate-300/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#1E40AF]" />
                        <span>Lista de Llamadas en Orden de Prioridad (1º al 7º)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        La Central de Monitoreo llamará correlativamente a estos números ante un salto de alarma.
                      </p>
                    </div>

                    {propiedades.length > 1 && (
                      <button
                        type="button"
                        onClick={replicarContactosATodas}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#0B2545] text-slate-700 hover:text-white text-[11px] font-bold transition border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border whitespace-nowrap shadow-2xs ${
                            cIdx === 0
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-blue-50 text-[#1E40AF] border-blue-200'
                          }`}>
                            {cIdx + 1}º PRIORIDAD {cIdx === 0 ? '• (TITULAR / ENCARGADO PRINCIPAL)' : ''}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          <div className="sm:col-span-5 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Completo:</label>
                            <input
                              type="text"
                              value={c.nombre}
                              onChange={(e) => handleContactoChange(cIdx, 'nombre', e.target.value)}
                              placeholder={cIdx === 0 ? 'Nombre del Titular' : `Contacto ${cIdx + 1}`}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-bold focus:border-[#1E40AF] focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Cargo / Parentesco:</label>
                            <input
                              type="text"
                              value={c.cargo}
                              onChange={(e) => handleContactoChange(cIdx, 'cargo', e.target.value)}
                              placeholder="Ej: Titular, Cónyuge, Guardia"
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-[#1E40AF] focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-4 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono de Contacto:</label>
                            <input
                              type="text"
                              value={c.fono}
                              onChange={(e) => handleContactoChange(cIdx, 'fono', e.target.value)}
                              placeholder="+56 9 XXXX XXXX"
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#1E40AF] font-mono font-bold placeholder-slate-400 focus:border-[#1E40AF] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Procedimiento Especial */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">
                      Observaciones o Procedimientos Especiales para la Central:
                    </label>
                    <textarea
                      rows={2}
                      value={propActual?.procedimiento_especial || ''}
                      onChange={(e) => handlePropiedadChange('procedimiento_especial', e.target.value)}
                      placeholder="Ej: Informar aperturas y cierres por SMS a encargada después de las 21:00 hrs..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#1E40AF] focus:bg-white resize-none"
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* ── CARD 3: DECLARACIÓN JURADA Y BOTÓN GUARDAR (FULL WIDTH) ── */}
            <div className="bg-white border border-slate-300/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="bg-amber-50/70 border border-amber-200/90 p-5 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Declaración de Veracidad & Responsabilidad de Contactos</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Al enviar este formulario, usted declara que los números y nombres registrados corresponden a <strong>personas reales, autorizadas y habilitadas</strong> para recibir llamadas o autorizar procedimientos ante activaciones de alarma de su propiedad en la Central Gama Security.
                </p>

                <label className="flex items-start sm:items-center gap-3 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={declaracionAceptada}
                    onChange={(e) => setDeclaracionAceptada(e.target.checked)}
                    className="w-4 h-4 mt-0.5 sm:mt-0 rounded text-[#0B2545] bg-white border-slate-300 focus:ring-[#1E40AF] shrink-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    1. He revisado la información provista y asumo la responsabilidad sobre la exactitud de los números de contacto.
                  </span>
                </label>
              </div>

              {/* Consentimiento Expreso Ley 21.719 */}
              <div className="bg-blue-50/70 border border-blue-200/90 p-5 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-[#1E40AF] text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>Consentimiento Informado & Privacidad (Ley N° 21.719 Chile)</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Conforme a la Ley N° 21.719 sobre Protección de Datos Personales, autorizo expresamente a Gama Seguridad SpA para el tratamiento de estos antecedentes con fines exclusivos de monitoreo, televigilancia y despacho de alertas ante emergencias (llamadas automáticas IA, WhatsApp, SMS y correo). Sé que puedo ejercer mis derechos ARCO+ en <strong>privacidad@gamasecurity.cl</strong>.
                </p>

                <label className="flex items-start sm:items-center gap-3 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentimientoDatosAceptado}
                    onChange={(e) => setConsentimientoDatosAceptado(e.target.checked)}
                    className="w-4 h-4 mt-0.5 sm:mt-0 rounded text-[#0B2545] bg-white border-slate-300 focus:ring-[#1E40AF] shrink-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-emerald-800">
                    2. Autorizo expresamente el tratamiento de datos y la recepción de alertas de seguridad conforme a la Ley N° 21.719.
                  </span>
                </label>
              </div>

              {errorGuardado && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorGuardado}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-[11px] text-slate-500 text-center sm:text-left font-medium">
                  Los cambios impactarán en tiempo real la base de datos de la Central de Monitoreo Gama.
                </p>

                <button
                  type="button"
                  onClick={handleGuardarFicha}
                  disabled={!declaracionAceptada || !consentimientoDatosAceptado || guardando}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0B2545] hover:bg-[#1E40AF] text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
