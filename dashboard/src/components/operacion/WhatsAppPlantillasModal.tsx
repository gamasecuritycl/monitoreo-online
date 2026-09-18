'use client'

import React, { useState } from 'react'
import {
  X,
  Send,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  ShieldAlert,
  FileCheck,
  CreditCard,
  Wrench,
  Sparkles,
  Phone,
  User,
  Loader2
} from 'lucide-react'

export interface PlantillaAbonadoData {
  cuenta: string
  nombre: string
  telefono?: string
  direccion?: string
  rut?: string
}

interface Props {
  onClose: () => void
  abonadoInicial?: PlantillaAbonadoData
}

export default function WhatsAppPlantillasModal({ onClose, abonadoInicial }: Props) {
  const [cuenta, setCuenta] = useState(abonadoInicial?.cuenta || '')
  const [nombre, setNombre] = useState(abonadoInicial?.nombre || '')
  const [telefono, setTelefono] = useState(abonadoInicial?.telefono || '')
  const [direccion, setDireccion] = useState(abonadoInicial?.direccion || '')

  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<string>('actualizacion')
  const [enviandoDirecto, setEnviandoDirecto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [statusEnvio, setStatusEnvio] = useState<{ tipo: 'ok' | 'error'; msj: string } | null>(null)

  // Generación dinámica de textos de plantilla con datos del cliente
  const obtenerTextoPlantilla = (tipo: string): string => {
    const nom = nombre.trim() || 'Cliente'
    const cta = cuenta.trim() || '0000'
    const dir = direccion.trim() || 'su domicilio registrado'
    const urlFicha = `https://controltestmonitoreo.vercel.app/actualizar?cuenta=${encodeURIComponent(cta)}`
    const urlPortal = `https://controltestmonitoreo.vercel.app/operacion`

    switch (tipo) {
      case 'actualizacion':
        return `Hola ${nom}, para garantizar la correcta respuesta de su sistema de alarma 24/7 y mantener al día sus contactos de emergencia, por favor confirme sus datos en el siguiente enlace oficial: ${urlFicha}\n\nGama Seguridad 24/7.`

      case 'contrato':
        return `Estimado(a) ${nom}, le compartimos el acceso a su Contrato de Prestación de Servicios de Monitoreo de Alarmas de INVERSIONES GAMA SpA para su revisión y firma electrónica simple: ${urlPortal}\n\nAnte cualquier duda, estamos a su disposición. Gama Seguridad.`

      case 'alarma':
        return `🚨 GAMA SEGURIDAD 24/7: Le informamos que se ha registrado una señal de alarma en su propiedad ubicada en ${dir} (Cuenta #${cta}). Central de Monitoreo verificando según protocolo de seguridad.\n\nPor favor mantenga su línea telefónica disponible.`

      case 'cobranza':
        return `Estimado(a) ${nom}, le recordamos el estado de su mensualidad del servicio de monitoreo de alarmas (Cuenta #${cta}).\n\n🏦 Datos de Transferencia:\n• Banco: Banco de Chile\n• Razón Social: INVERSIONES GAMA SpA\n• R.U.T.: 78.297.009-7\n• Correo Comprobantes: cobranza@gamasecurity.cl\n\nAgradecemos su preferencia. Gama Seguridad.`

      case 'tecnico':
        return `Estimado(a) ${nom}, le informamos que se ha coordinado una visita técnica de servicio y mantenimiento para su sistema de seguridad en ${dir}.\n\nNuestro equipo técnico se pondrá en contacto para confirmar el horario exacto de llegada. Gama Seguridad.`

      default:
        return ''
    }
  }

  const textoActual = obtenerTextoPlantilla(plantillaSeleccionada)

  const numLimpio = telefono.replace(/[^0-9]/g, '')
  const telefonoChile = numLimpio.startsWith('56')
    ? numLimpio
    : numLimpio.length === 9
    ? `56${numLimpio}`
    : numLimpio

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(textoActual)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const abrirEnWhatsAppWeb = () => {
    if (!telefonoChile) {
      alert('Por favor ingresa un número de teléfono válido.')
      return
    }
    const url = `https://wa.me/${telefonoChile}?text=${encodeURIComponent(textoActual)}`
    window.open(url, '_blank')
  }

  const enviarDirectoServidor = async () => {
    if (!telefonoChile) {
      setStatusEnvio({ tipo: 'error', msj: 'Ingresa un número telefónico antes de enviar.' })
      return
    }

    setEnviandoDirecto(true)
    setStatusEnvio(null)

    try {
      const res = await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: telefonoChile,
          mensaje: textoActual,
          cuenta: cuenta || 'OPERACIONES_ERP'
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setStatusEnvio({ tipo: 'ok', msj: '✅ ¡Mensaje enviado exitosamente vía WhatsApp!' })
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        // Si el endpoint directo no está activo, fallback a WhatsApp Web
        setStatusEnvio({
          tipo: 'error',
          msj: data.error || 'Servidor WhatsApp no disponible. Abriendo WhatsApp Web...'
        })
        setTimeout(() => {
          abrirEnWhatsAppWeb()
        }, 1200)
      }
    } catch (err: any) {
      setStatusEnvio({
        tipo: 'error',
        msj: 'Error de conexión con el servidor. Abriendo WhatsApp Web...'
      })
      setTimeout(() => {
        abrirEnWhatsAppWeb()
      }, 1200)
    } finally {
      setEnviandoDirecto(false)
    }
  }

  const plantillas = [
    {
      id: 'actualizacion',
      titulo: 'Ficha Oficial de Contactos',
      icono: Sparkles,
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      badge: 'Portal Dinámico',
      desc: 'Enlace personalizado para confirmación de contactos 24/7'
    },
    {
      id: 'contrato',
      titulo: 'Contrato y Firma Digital',
      icono: FileCheck,
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      badge: 'Legal ERP',
      desc: 'Envío de contrato oficial con pad de firma electrónica'
    },
    {
      id: 'alarma',
      titulo: 'Aviso de Alarma / Evento',
      icono: ShieldAlert,
      color: 'text-red-400 border-red-500/30 bg-red-500/10',
      badge: 'Urgente Central',
      desc: 'Notificación de activación o corte de energía'
    },
    {
      id: 'cobranza',
      titulo: 'Cobranza & Datos Bancarios',
      icono: CreditCard,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      badge: 'Facturación',
      desc: 'Recordatorio de mensualidad y cuenta corriente Gama'
    },
    {
      id: 'tecnico',
      titulo: 'Coordinación Visita Técnica',
      icono: Wrench,
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      badge: 'Operación',
      desc: 'Agendamiento y confirmación de servicio en terreno'
    }
  ]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Plantillas Rápidas WhatsApp · 1 Clic
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono">
                  GAMA ERP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Envío oficial de fichas, contratos, avisos y cobranza a abonados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Datos del Destinatario */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Nombre / Razón Social
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del Cliente"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" /> Teléfono WhatsApp
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Cuenta Monitoreo #
              </label>
              <input
                type="text"
                value={cuenta}
                onChange={(e) => setCuenta(e.target.value)}
                placeholder="Ej: 1042"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Selector de Plantillas */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Selecciona la Plantilla Oficial:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {plantillas.map((pl) => {
                const Icon = pl.icono
                const seleccionada = plantillaSeleccionada === pl.id

                return (
                  <button
                    key={pl.id}
                    onClick={() => setPlantillaSeleccionada(pl.id)}
                    className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                      seleccionada
                        ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${pl.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {pl.badge}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white mb-0.5">{pl.titulo}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2">{pl.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Vista Previa del Mensaje Generado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Vista Previa del Mensaje a Enviar:
              </label>
              <button
                onClick={copiarAlPortapapeles}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed shadow-inner max-h-40 overflow-y-auto">
              {textoActual}
            </div>
          </div>

          {/* Estado de Envío */}
          {statusEnvio && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                statusEnvio.tipo === 'ok'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              }`}
            >
              <span>{statusEnvio.msj}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={abrirEnWhatsAppWeb}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir WhatsApp Web</span>
            </button>

            <button
              onClick={enviarDirectoServidor}
              disabled={enviandoDirecto}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-50"
            >
              {enviandoDirecto ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar con 1 Clic</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
