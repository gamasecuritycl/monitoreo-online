'use client'

import React, { useRef, useState, useEffect } from 'react'
import {
  X,
  FileCheck,
  Download,
  Smartphone,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Building2,
  MapPin,
  CreditCard,
  Loader2,
  UserCheck,
  Edit3
} from 'lucide-react'
import { generarContratoPdfBase64, ContratoData } from '@/lib/generateContratoPdf'
import { supabase } from '@/lib/supabase'

interface ContratoDigitalModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: any
  abonado: any
  empresaEmisora?: any
  onContratoGuardado?: (data: any) => void
}

export default function ContratoDigitalModal({
  isOpen,
  onClose,
  cliente,
  abonado,
  empresaEmisora,
  onContratoGuardado
}: ContratoDigitalModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [firmaGuardada, setFirmaGuardada] = useState<string | null>(null)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [firmadoExito, setFirmadoExito] = useState(false)
  
  // ── CAMPOS EDITABLES DEL CONTRATO ──
  // 1. Datos del Cliente / Suscriptor
  const [razonSocial, setRazonSocial] = useState('')
  const [rutCliente, setRutCliente] = useState('')
  const [direccionLegal, setDireccionLegal] = useState('')
  const [ciudadLegal, setCiudadLegal] = useState('Viña del Mar')
  const [telefonoCliente, setTelefonoCliente] = useState('')
  const [emailCliente, setEmailCliente] = useState('')

  // 2. Sucursal o Inmueble Monitoreado
  const [cuentaAbonado, setCuentaAbonado] = useState('')
  const [direccionSucursal, setDireccionSucursal] = useState('')
  const [ciudadSucursal, setCiudadSucursal] = useState('Viña del Mar')

  // 3. Representante Legal & Escritura
  const [representanteLegal, setRepresentanteLegal] = useState('')
  const [rutRepresentante, setRutRepresentante] = useState('')
  const [ciudadFirma, setCiudadFirma] = useState('Viña del Mar')

  // 4. Parámetros Económicos
  const [plazoMeses, setPlazoMeses] = useState(36)
  const [tarifaMonto, setTarifaMonto] = useState(29900)
  const [moneda, setMoneda] = useState<'UF' | 'CLP'>('CLP')

  // Inicializar formulario con datos de la BD (limpiando valores ficticios o placeholders)
  useEffect(() => {
    if (isOpen) {
      const cta = abonado?.cuenta || cliente?.cuentas_abonados?.[0] || '1001'
      setCuentaAbonado(cta)

      // Razón Social / Nombre
      const nombreInicial = cliente?.razon_social || abonado?.alias_centro_costo || cliente?.nombre || ''
      setRazonSocial(nombreInicial)

      // RUT (si viene 'RUT-1001' u otro ficticio generado automáticamente, permitir editarlo limpio)
      const rawRut = cliente?.rut || abonado?.rut_cliente || ''
      const rutLimpio = rawRut.toUpperCase().startsWith('RUT-') ? '' : rawRut
      setRutCliente(rutLimpio)

      // Direcciones
      const dirCom = cliente?.direccion_comercial || abonado?.direccion || ''
      setDireccionLegal(dirCom)
      setCiudadLegal(cliente?.ciudad || abonado?.ciudad || 'Viña del Mar')

      setDireccionSucursal(abonado?.direccion || dirCom || '')
      setCiudadSucursal(abonado?.ciudad || cliente?.ciudad || 'Viña del Mar')

      // Contactos
      setTelefonoCliente(cliente?.telefono || '')
      setEmailCliente(cliente?.email_cobranza || cliente?.email_contacto || '')

      // Representante Legal
      setRepresentanteLegal(cliente?.representante_legal || cliente?.contacto_persona || '')
      setRutRepresentante(cliente?.rut_representante || '')
      setCiudadFirma('Viña del Mar')

      // Moneda y Tarifas
      if (cliente?.moneda === 'UF' || (cliente?.tarifa_mensual && cliente.tarifa_mensual < 100)) {
        setMoneda('UF')
        setTarifaMonto(cliente?.tarifa_mensual || 0.9)
      } else {
        setMoneda('CLP')
        setTarifaMonto(cliente?.tarifa_mensual || 29900)
      }

      setHasSignature(false)
      setFirmaGuardada(null)
      setFirmadoExito(false)
    }
  }, [isOpen, cliente, abonado])

  // Configuración del contexto 2D del Canvas
  useEffect(() => {
    if (!isOpen || firmadoExito) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#001f3f'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [isOpen, firmadoExito])

  // Cálculo exacto de coordenadas con factor de escala (resuelve desfase de la X)
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    
    // Factor de escala entre resolución interna del canvas y el tamaño visible en pantalla
    const scaleX = canvas.width / (rect.width || 1)
    const scaleY = canvas.height / (rect.height || 1)

    let clientX = 0
    let clientY = 0

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      }
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas && hasSignature) {
      setFirmaGuardada(canvas.toDataURL('image/png'))
    }
  }

  const limpiarFirma = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setFirmaGuardada(null)
  }

  if (!isOpen) return null

  const ctaCode = cuentaAbonado || '1001'
  const codigoContrato = `CTR-2026-${ctaCode.toUpperCase()}`

  // Generador de estructura de datos del contrato con los campos editables
  const obtenerContratoPayload = (signatureBase64?: string): ContratoData => {
    const now = new Date()
    const firmaFinal = signatureBase64 || firmaGuardada || undefined

    return {
      codigo_contrato: codigoContrato,
      fecha_ciudad: ciudadFirma || 'Viña del Mar',
      fecha_completa: now.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }),
      empresa_emisora: {
        razon_social: empresaEmisora?.razon_social || 'INVERSIONES GAMA SpA',
        rut: empresaEmisora?.rut || '78.297.009-7',
        representante: empresaEmisora?.representante || 'TOMÁS TORO-MORENO OLAVARRÍA',
        rut_representante: empresaEmisora?.rut_representante || '16.182.547-6',
        direccion: empresaEmisora?.direccion || 'Av. Valparaíso 351, Villa Alemana',
        email_contacto: empresaEmisora?.email_contacto || 'contacto@gamasecurity.cl'
      },
      cliente: {
        nombre_razon_social: razonSocial.trim() || 'CLIENTE GAMA',
        rut: rutCliente.trim() || 'S/RUT',
        representante_legal: representanteLegal.trim() || undefined,
        rut_representante: rutRepresentante.trim() || undefined,
        direccion_legal: direccionLegal.trim() || '5 Oriente 640',
        ciudad_legal: ciudadLegal.trim() || 'Viña del Mar',
        telefono: telefonoCliente.trim() || undefined,
        email: emailCliente.trim() || undefined
      },
      propiedad: {
        cuenta: ctaCode,
        alias: razonSocial.trim() || `Abonado #${ctaCode}`,
        direccion_sucursal: direccionSucursal.trim() || direccionLegal.trim() || 'Dirección de Instalación',
        ciudad_sucursal: ciudadSucursal.trim() || ciudadLegal.trim() || 'Viña del Mar'
      },
      servicio: {
        tarifa_monto: Number(tarifaMonto) || 29900,
        tarifa_texto: moneda === 'UF' ? `${tarifaMonto} Unidades de Fomento` : `${Number(tarifaMonto).toLocaleString('es-CL')} Pesos Chilenos`,
        moneda,
        plazo_inicial_meses: Number(plazoMeses) || 36,
        renovacion_meses: 12,
        dias_aviso_termino: 30,
        email_actualizacion_contactos: 'ecarrasco@gamasecurity.cl'
      },
      firma_base64: firmaFinal,
      fecha_firma: firmaFinal ? `${now.toLocaleDateString('es-CL')} ${now.toLocaleTimeString('es-CL')}` : undefined
    }
  }

  const handleDescargarPdf = () => {
    setGenerandoPdf(true)
    try {
      const canvas = canvasRef.current
      const firmaPng = (canvas && hasSignature) ? canvas.toDataURL('image/png') : (firmaGuardada || undefined)
      if (firmaPng && !firmaGuardada) {
        setFirmaGuardada(firmaPng)
      }

      const contratoData = obtenerContratoPayload(firmaPng)
      const base64Pdf = generarContratoPdfBase64(contratoData)

      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${base64Pdf}`
      link.download = `Contrato_Monitoreo_${codigoContrato}_${ctaCode}.pdf`
      link.click()
    } catch (e: any) {
      alert('Error generando PDF: ' + e.message)
    } finally {
      setGenerandoPdf(false)
    }
  }

  const handleGuardarYFirmar = async () => {
    const canvas = canvasRef.current
    const firmaPng = (canvas && hasSignature) ? canvas.toDataURL('image/png') : firmaGuardada

    if (!firmaPng) {
      alert('Por favor estampe la firma en la pizarra antes de guardar y validar el contrato.')
      return
    }

    if (!razonSocial.trim()) {
      alert('Por favor ingrese el Nombre o Razón Social del Cliente.')
      return
    }

    if (!rutCliente.trim()) {
      alert('Por favor ingrese el RUT del Cliente o Empresa.')
      return
    }

    setFirmaGuardada(firmaPng)
    setGenerandoPdf(true)

    try {
      const contratoData = obtenerContratoPayload(firmaPng)
      const nowIso = new Date().toISOString()

      // Guardar evento de firma en Supabase
      await supabase.from('eventos_monitoreo').insert({
        cuenta: ctaCode,
        nombre_abonado: `Contrato Firmado: ${razonSocial}`,
        evento: 'CONTRATO_FIRMADO_OFICIAL',
        descripcion_evento: `Contrato ${codigoContrato} firmado para cuenta ${ctaCode} (${tarifaMonto} ${moneda} + IVA, ${plazoMeses} meses). RUT: ${rutCliente}`.substring(0, 250),
        fecha_evento: nowIso
      })

      setFirmadoExito(true)
      if (onContratoGuardado) {
        onContratoGuardado(contratoData)
      }
    } catch (err: any) {
      console.error('Error guardando contrato:', err)
      alert('Error al registrar contrato: ' + err.message)
    } finally {
      setGenerandoPdf(false)
    }
  }

  const handleEnviarWhatsApp = () => {
    const tel = (telefonoCliente || cliente?.telefono || '').replace(/[^0-9]/g, '')
    const baseUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://controltestmonitoreo.vercel.app'
    const linkFicha = `${baseUrl}/actualizar?cuenta=${ctaCode}`
    const msg = encodeURIComponent(`Hola ${razonSocial}, adjuntamos confirmación de suscripción del Contrato de Monitoreo 24/7 N° ${codigoContrato} (${tarifaMonto} ${moneda} + IVA). Para revisar sus contactos oficiales o confirmar sus antecedentes ingrese aquí: ${linkFicha}`)

    if (tel) {
      const dest = tel.startsWith('56') ? tel : ('56' + tel)
      window.open(`https://wa.me/${dest}?text=${msg}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-white border border-slate-300/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-800">
        
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-[#0B2545] border-b border-slate-200 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 text-white rounded-2xl border border-white/20">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-xl tracking-tight">
                  Contrato de Prestación de Servicios de Monitoreo
                </h3>
                <span className="bg-white/20 text-white font-mono text-xs px-2.5 py-0.5 rounded-lg font-extrabold">
                  {codigoContrato}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Abonado #{ctaCode} · Complete o confirme los datos antes de estampar la firma.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto text-xs sm:text-sm text-slate-700">
          
          {firmadoExito ? (
            <div className="py-10 text-center space-y-5 bg-emerald-50 border border-emerald-300 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  ¡Contrato Oficial Firmado y Validado!
                </h4>
                <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto">
                  El contrato <strong className="text-slate-900">{codigoContrato}</strong> a nombre de <strong className="text-slate-900">{razonSocial}</strong> (RUT: {rutCliente}) se encuentra firmado electrónicamente y con respaldo legal en la nube.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-4">
                <button
                  onClick={handleDescargarPdf}
                  className="bg-[#0B2545] hover:bg-[#07172c] text-white text-xs py-3 px-6 rounded-xl flex items-center gap-2 font-extrabold shadow-md cursor-pointer transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar Contrato Firmado (PDF)</span>
                </button>
                <button
                  onClick={handleEnviarWhatsApp}
                  className="px-5 py-3 rounded-xl bg-[#25D366] text-white font-extrabold text-xs flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-md cursor-pointer"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Enviar Confirmación por WhatsApp</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SECCIÓN 1: DATOS DEL CLIENTE / SUSCRIPTOR (100% EDITABLES) */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-extrabold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>1. Datos de la Empresa o Suscriptor (Cliente)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">Edición en vivo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      Nombre o Razón Social del Cliente:
                    </label>
                    <input
                      type="text"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      placeholder="Ej. COMERCIALIZADORA DEL PACÍFICO SpA o JUAN PÉREZ"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      R.U.T. Cliente / Empresa:
                    </label>
                    <input
                      type="text"
                      value={rutCliente}
                      onChange={(e) => setRutCliente(e.target.value)}
                      placeholder="Ej. 76.543.210-K"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      Cuenta Monitoreo:
                    </label>
                    <input
                      type="text"
                      value={cuentaAbonado}
                      onChange={(e) => setCuentaAbonado(e.target.value)}
                      placeholder="Ej. 1001"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs font-mono font-extrabold text-[#0B2545] outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      Dirección Legal / Matriz:
                    </label>
                    <input
                      type="text"
                      value={direccionLegal}
                      onChange={(e) => setDireccionLegal(e.target.value)}
                      placeholder="Ej. Av. Libertad 1234, Of. 502"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      Comuna / Ciudad Legal:
                    </label>
                    <input
                      type="text"
                      value={ciudadLegal}
                      onChange={(e) => setCiudadLegal(e.target.value)}
                      placeholder="Ej. Viña del Mar"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      Teléfono Contacto:
                    </label>
                    <input
                      type="text"
                      value={telefonoCliente}
                      onChange={(e) => setTelefonoCliente(e.target.value)}
                      placeholder="Ej. +56 9 9123 4567"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 font-bold outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: SUCURSAL MONITOREADA & CONDICIONES ECONÓMICAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Inmueble Monitoreado */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-extrabold text-[#0B2545] uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                    <MapPin className="h-4 w-4" />
                    <span>2. Inmueble / Sucursal Monitoreada</span>
                  </span>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      Dirección de Instalación:
                    </label>
                    <input
                      type="text"
                      value={direccionSucursal}
                      onChange={(e) => setDireccionSucursal(e.target.value)}
                      placeholder="Ej. Marbella 49"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      Comuna / Ciudad de la Sucursal:
                    </label>
                    <input
                      type="text"
                      value={ciudadSucursal}
                      onChange={(e) => setCiudadSucursal(e.target.value)}
                      placeholder="Ej. San Antonio"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Condiciones Comerciales */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-extrabold text-[#0B2545] uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                    <CreditCard className="h-4 w-4" />
                    <span>3. Tarifa & Plazo de Servicio</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        Moneda:
                      </label>
                      <select
                        value={moneda}
                        onChange={(e) => setMoneda(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none"
                      >
                        <option value="CLP">Pesos Chilenos (CLP)</option>
                        <option value="UF">Unidades de Fomento (UF)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        Tarifa Mensual + IVA:
                      </label>
                      <input
                        type="number"
                        step={moneda === 'UF' ? '0.01' : '1000'}
                        value={tarifaMonto}
                        onChange={(e) => setTarifaMonto(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs font-mono font-black text-[#0B2545] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      Plazo Inicial de Suscripción:
                    </label>
                    <select
                      value={plazoMeses}
                      onChange={(e) => setPlazoMeses(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none"
                    >
                      <option value={36}>36 Meses (Estándar GAMA - Sin multas por término)</option>
                      <option value={24}>24 Meses (2 Años)</option>
                      <option value={12}>12 Meses (1 Año)</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* SECCIÓN 3: REPRESENTANTE LEGAL (SI ES EMPRESA O PERSONA JURÍDICA) */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                <span className="text-xs font-extrabold text-[#0B2545] uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                  <UserCheck className="h-4 w-4" />
                  <span>4. Representante Legal del Suscriptor (Opcional si es titular directo)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      Nombre Representante Legal:
                    </label>
                    <input
                      type="text"
                      value={representanteLegal}
                      onChange={(e) => setRepresentanteLegal(e.target.value)}
                      placeholder="Ej. GUILLERMO ALFONSO MONTECINOS ROJAS"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      R.U.T. Representante:
                    </label>
                    <input
                      type="text"
                      value={rutRepresentante}
                      onChange={(e) => setRutRepresentante(e.target.value)}
                      placeholder="Ej. 7.402.401-7"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 font-bold outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                      Ciudad de Otorgamiento:
                    </label>
                    <input
                      type="text"
                      value={ciudadFirma}
                      onChange={(e) => setCiudadFirma(e.target.value)}
                      placeholder="Viña del Mar"
                      className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/15 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: PAD DE FIRMA DIGITAL CON LÍNEA BASE Y CALIBRACIÓN EXACTA */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-[#0B2545]" />
                      <span>5. Firma Electrónica del Cliente / Suscriptor</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Dibuje la firma dentro del recuadro usando mouse, lápiz táctil o dedo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={limpiarFirma}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Limpiar Pizarra</span>
                  </button>
                </div>

                {/* Contenedor de Pizarra con Guía Visual para que no se dibuje desfasado */}
                <div className="relative border-2 border-dashed border-slate-300 bg-white rounded-2xl p-1 flex justify-center items-center overflow-hidden shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={720}
                    height={180}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair w-full h-[180px] touch-none bg-white rounded-xl relative z-10 select-none"
                  />

                  {/* Guía de Línea de Firma en Fondo */}
                  <div className="absolute bottom-6 left-6 right-6 border-b-2 border-slate-200 pointer-events-none flex items-center justify-between px-3 text-slate-400 select-none z-0">
                    <span className="text-xs font-extrabold font-mono text-slate-400">❌ FIRMAR AQUÍ</span>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      {razonSocial ? `p.p. ${razonSocial}` : 'Línea oficial de firma'}
                    </span>
                  </div>
                </div>
                
                <div className="text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2 pt-1 font-medium">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-[#0B2545]" />
                    <span>La firma se estampará en el contrato con R.U.T. <strong>{rutCliente || 'S/RUT'}</strong> y timbrado de fecha oficial.</span>
                  </div>
                  {hasSignature && (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Firma capturada correctamente
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        {!firmadoExito && (
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <button
              onClick={handleDescargarPdf}
              disabled={generandoPdf}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Vista Previa PDF (con datos actuales)</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarYFirmar}
                disabled={generandoPdf || (!hasSignature && !firmaGuardada)}
                className="w-full sm:w-auto bg-[#0B2545] hover:bg-[#07172c] text-white text-xs py-2.5 px-6 font-extrabold rounded-xl shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer transition-all"
              >
                {generandoPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Validando Contrato...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Guardar y Validar Contrato →</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
