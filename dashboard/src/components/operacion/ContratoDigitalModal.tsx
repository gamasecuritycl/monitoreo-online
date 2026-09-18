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
  ExternalLink
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
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [firmadoExito, setFirmadoExito] = useState(false)
  
  // Parámetros del Contrato Real GAMA
  const [plazoMeses, setPlazoMeses] = useState(36)
  const [tarifaMonto, setTarifaMonto] = useState(0.9)
  const [moneda, setMoneda] = useState<'UF' | 'CLP'>('UF')
  const [tarifaTexto, setTarifaTexto] = useState('Cero coma nueve Unidades de Fomento')
  const [representanteLegal, setRepresentanteLegal] = useState('')
  const [rutRepresentante, setRutRepresentante] = useState('')
  const [ciudadFirma, setCiudadFirma] = useState('Viña del Mar')

  useEffect(() => {
    if (isOpen && cliente) {
      if (cliente.moneda === 'UF' || cliente.tarifa_mensual < 100) {
        setMoneda('UF')
        setTarifaMonto(cliente.tarifa_mensual || 0.9)
        setTarifaTexto(cliente.tarifa_mensual === 0.9 ? 'Cero coma nueve Unidades de Fomento' : `${cliente.tarifa_mensual} Unidades de Fomento`)
      } else {
        setMoneda('CLP')
        setTarifaMonto(cliente.tarifa_mensual || 29900)
        setTarifaTexto(`Pesos chilenos`)
      }
      setRepresentanteLegal(cliente.representante_legal || cliente.contacto_persona || '')
      setRutRepresentante(cliente.rut_representante || '')
      setHasSignature(false)
      setFirmadoExito(false)
    }
  }, [isOpen, cliente])

  useEffect(() => {
    if (!isOpen) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#001f3f'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [isOpen])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const limpiarFirma = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  if (!isOpen) return null

  const ctaCode = abonado?.cuenta || cliente?.cuentas_abonados?.[0] || 'C701'
  const razonSocial = cliente?.razon_social || abonado?.alias_centro_costo || 'CLIENTE GAMA'
  const rutCli = cliente?.rut || 'S/RUT'
  const codigoContrato = `CTR-2026-${ctaCode.toUpperCase()}`

  const obtenerContratoPayload = (signatureBase64?: string): ContratoData => {
    const now = new Date()
    return {
      codigo_contrato: codigoContrato,
      fecha_ciudad: ciudadFirma,
      fecha_completa: now.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }),
      empresa_emisora: empresaEmisora || {
        razon_social: 'INVERSIONES GAMA SpA',
        rut: '78.297.009-7',
        representante: 'TOMÁS TORO-MORENO OLAVARRÍA',
        rut_representante: '16.182.547-6',
        direccion: 'Av. Valparaíso 351, Villa Alemana',
        email_contacto: 'contacto@gamasecurity.cl'
      },
      cliente: {
        nombre_razon_social: razonSocial,
        rut: rutCli,
        representante_legal: representanteLegal || undefined,
        rut_representante: rutRepresentante || undefined,
        direccion_legal: cliente?.direccion_comercial || abonado?.direccion || '5 Oriente 640',
        ciudad_legal: cliente?.ciudad || abonado?.ciudad || 'Viña del Mar',
        telefono: cliente?.telefono,
        email: cliente?.email_cobranza || cliente?.email_contacto
      },
      propiedad: {
        cuenta: ctaCode,
        alias: abonado?.alias_centro_costo || razonSocial,
        direccion_sucursal: abonado?.direccion || cliente?.direccion_comercial || 'Dirección de Instalación',
        ciudad_sucursal: abonado?.ciudad || cliente?.ciudad || 'Viña del Mar'
      },
      servicio: {
        tarifa_monto: tarifaMonto,
        tarifa_texto: tarifaTexto,
        moneda,
        plazo_inicial_meses: plazoMeses,
        renovacion_meses: 12,
        dias_aviso_termino: 30,
        email_actualizacion_contactos: 'ecarrasco@gamasecurity.cl'
      },
      firma_base64: signatureBase64,
      fecha_firma: signatureBase64 ? `${now.toLocaleDateString('es-CL')} ${now.toLocaleTimeString('es-CL')}` : undefined
    }
  }

  const handleDescargarPdf = () => {
    setGenerandoPdf(true)
    try {
      const canvas = canvasRef.current
      const firma = (canvas && hasSignature) ? canvas.toDataURL('image/png') : undefined
      const contratoData = obtenerContratoPayload(firma)
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
    if (!hasSignature) {
      alert('Por favor estampe la firma en el recuadro antes de guardar.')
      return
    }

    setGenerandoPdf(true)
    try {
      const canvas = canvasRef.current
      const firma = canvas?.toDataURL('image/png')
      const contratoData = obtenerContratoPayload(firma)
      const nowIso = new Date().toISOString()

      // Guardar evento en Supabase
      await supabase.from('eventos_monitoreo').insert({
        cuenta: ctaCode,
        nombre_abonado: `Contrato Firmado: ${razonSocial}`,
        evento: 'CONTRATO_FIRMADO_OFICIAL',
        descripcion_evento: `Contrato ${codigoContrato} firmado para cuenta ${ctaCode} (${tarifaMonto} ${moneda} + IVA, ${plazoMeses} meses)`.substring(0, 250),
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
    const tel = (cliente?.telefono || '').replace(/[^0-9]/g, '')
    const baseUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://controltestmonitoreo.vercel.app'
    const linkFicha = `${baseUrl}/actualizar?cuenta=${ctaCode}`
    const msg = encodeURIComponent(`Hola ${razonSocial}, adjuntamos copia del Contrato de Monitoreo 24/7 N° ${codigoContrato} (${tarifaMonto} ${moneda} + IVA). Para revisar sus contactos oficiales o confirmar sus antecedentes ingrese aquí: ${linkFicha}`)

    if (tel) {
      const dest = tel.startsWith('56') ? tel : ('56' + tel)
      window.open(`https://wa.me/${dest}?text=${msg}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0c182b] border border-[#1e3a5f] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="p-6 bg-gradient-to-r from-[#001f3f] to-[#003366] border-b border-white/10 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-[#2997ff] rounded-2xl border border-blue-500/30">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">
                  Contrato de Prestación de Servicios de Monitoreo
                </h3>
                <span className="bg-[#0066cc] text-white font-mono text-xs px-2.5 py-0.5 rounded-lg font-bold">
                  {codigoContrato}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Abonado #{ctaCode} · {razonSocial} · R.U.T. {rutCli}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto text-xs sm:text-sm text-slate-300">
          
          {firmadoExito ? (
            <div className="py-12 text-center space-y-5 bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  ¡Contrato Firmado y Registrado en la Central!
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
                  El contrato oficial <strong className="text-white">{codigoContrato}</strong> ha sido validado con firma electrónica y registrado para la cuenta <strong className="text-[#2997ff]">#{ctaCode}</strong>.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-4">
                <button
                  onClick={handleDescargarPdf}
                  className="btn-apple-primary text-xs py-3 px-6 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar Contrato Oficial (PDF)</span>
                </button>
                <button
                  onClick={handleEnviarWhatsApp}
                  className="px-5 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-md"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Enviar Copia al Cliente por WhatsApp</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Resumen Bento Grid del Contrato */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Caja 1: Comparecencia */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> EL SUSCRIPTOR / CLIENTE
                  </span>
                  <div className="font-extrabold text-white text-sm truncate">{razonSocial}</div>
                  <div className="font-mono text-slate-400 text-xs">RUT: {rutCli}</div>
                  <div className="text-slate-400 text-[11px] truncate">{cliente?.direccion_comercial || abonado?.direccion || '5 Oriente 640'}</div>
                </div>

                {/* Caja 2: Sucursal Inmueble */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> SUCURSAL MONITOREADA
                  </span>
                  <div className="font-extrabold text-white text-sm">Cuenta #{ctaCode}</div>
                  <div className="text-slate-300 text-xs truncate">{abonado?.direccion || cliente?.direccion_comercial || 'Dirección de Instalación'}</div>
                  <div className="text-slate-400 text-[11px]">{abonado?.ciudad || cliente?.ciudad || 'Viña del Mar'}</div>
                </div>

                {/* Caja 3: Condiciones Económicas */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> TARIFA & PLAZO
                  </span>
                  <div className="font-mono font-black text-[#2997ff] text-base">
                    {moneda === 'UF' ? `${tarifaMonto} UF/mes` : `$${tarifaMonto.toLocaleString('es-CL')} CLP/mes`} + IVA
                  </div>
                  <div className="text-slate-400 text-[11px]">Plazo Inicial: {plazoMeses} Meses</div>
                  <div className="text-slate-400 text-[11px]">Sin multas por término anticipado (aviso 30 días)</div>
                </div>

              </div>

              {/* Ajustes de Parámetros de Contrato */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#2997ff]" />
                  <span>DATOS DE LA ESCRITURA Y REPRESENTACIÓN LEGAL</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Representante Legal Cliente:</label>
                    <input
                      type="text"
                      value={representanteLegal}
                      onChange={(e) => setRepresentanteLegal(e.target.value)}
                      placeholder="Ej. GUILLERMO ALFONSO MONTECINOS ROJAS"
                      className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">RUT Representante:</label>
                    <input
                      type="text"
                      value={rutRepresentante}
                      onChange={(e) => setRutRepresentante(e.target.value)}
                      placeholder="Ej. 7.402.401-7"
                      className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Ciudad de Suscripción:</label>
                    <input
                      type="text"
                      value={ciudadFirma}
                      onChange={(e) => setCiudadFirma(e.target.value)}
                      placeholder="Viña del Mar"
                      className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Moneda Tarifa:</label>
                    <select
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value as any)}
                      className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="UF">Unidades de Fomento (UF)</option>
                      <option value="CLP">Pesos Chilenos (CLP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Monto Tarifa Mensual + IVA:</label>
                    <input
                      type="number"
                      step={moneda === 'UF' ? '0.1' : '1000'}
                      value={tarifaMonto}
                      onChange={(e) => setTarifaMonto(Number(e.target.value))}
                      className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Plazo Inicial (Meses):</label>
                    <select
                      value={plazoMeses}
                      onChange={(e) => setPlazoMeses(Number(e.target.value))}
                      className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value={36}>36 Meses (Estándar GAMA)</option>
                      <option value={24}>24 Meses (2 Años)</option>
                      <option value={12}>12 Meses (1 Año)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pad de Firma Digital */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-emerald-400" />
                      <span>FIRMA ELECTRÓNICA DEL CLIENTE / SUSCRIPTOR</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Dibuje la firma con el mouse, lápiz táctil o con el dedo en pantalla.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={limpiarFirma}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Limpiar Firma</span>
                  </button>
                </div>

                <div className="border-2 border-dashed border-[#1e3a5f] bg-[#050d1a] rounded-2xl p-2 flex justify-center items-center">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair w-full max-w-full touch-none bg-white rounded-xl"
                  />
                </div>
                
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                  <span>La firma digital queda vinculada al RUT {rutCli} y timbrada con fecha y hora oficial.</span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        {!firmadoExito && (
          <div className="p-6 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
            <button
              onClick={handleDescargarPdf}
              disabled={generandoPdf}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Vista Previa PDF</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarYFirmar}
                disabled={generandoPdf || !hasSignature}
                className="w-full sm:w-auto btn-apple-primary text-xs py-2.5 px-6 font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
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
