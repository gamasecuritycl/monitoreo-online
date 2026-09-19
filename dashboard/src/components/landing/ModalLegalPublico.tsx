'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  Cookie,
  Scale,
  Users,
  X,
  FileText,
  CheckCircle2,
  Download,
  Mail,
  Building2,
  Clock,
  ExternalLink,
  Send
} from 'lucide-react'
import jsPDF from 'jspdf'

export type PestañaLegal = 'privacidad' | 'cookies' | 'terminos' | 'arco'

interface ModalLegalPublicoProps {
  isOpen: boolean
  onClose: () => void
  pestañaInicial?: PestañaLegal
}

export default function ModalLegalPublico({
  isOpen,
  onClose,
  pestañaInicial = 'privacidad'
}: ModalLegalPublicoProps) {
  const [pestaña, setPestaña] = useState<PestañaLegal>(pestañaInicial)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [formArcoEnviado, setFormArcoEnviado] = useState(false)
  const [formArco, setFormArco] = useState({
    nombre: '',
    rut: '',
    email: '',
    tipo: 'ACCESO',
    detalle: ''
  })

  // Sincronizar si cambia la prop
  React.useEffect(() => {
    if (pestañaInicial) {
      setPestaña(pestañaInicial)
    }
  }, [pestañaInicial, isOpen])

  if (!isOpen) return null

  const fechaHoy = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date())

  const descargarPoliticaPdf = () => {
    setGenerandoPdf(true)
    try {
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('GAMA SEGURIDAD SpA — PORTAL WEB OFICIAL', 14, 18)
      doc.setFontSize(10.5)
      doc.setTextColor(0, 51, 153)
      doc.text('POLÍTICA DE PRIVACIDAD, PROTECCIÓN DE DATOS Y COOKIES', 14, 25)
      doc.text('CONFORME A LA LEY N° 21.719 Y LEY N° 19.628 DE CHILE', 14, 31)

      doc.setTextColor(70, 70, 70)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha de Publicación: ${fechaHoy} | Canal Oficial DPO: privacidad@gamasecurity.cl | www.gamasecurity.cl`, 14, 38)
      doc.line(14, 40, 196, 40)

      let y = 48
      const addSection = (tit: string, cuerpo: string) => {
        if (y > 255) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(0, 31, 63)
        doc.text(tit, 14, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(40, 40, 40)
        const split = doc.splitTextToSize(cuerpo, 182)
        doc.text(split, 14, y)
        y += split.length * 3.8 + 4
      }

      addSection('1. IDENTIFICACIÓN DEL RESPONSABLE DEL TRATAMIENTO',
        'El responsable del tratamiento de los datos personales recopilados a través de www.gamasecurity.cl es INVERSIONES GAMA SpA / GAMA SEGURIDAD SpA, R.U.T. 78.297.009-7, con domicilio en Av. Valparaíso 351, Villa Alemana, Región de Valparaíso, Chile. Correo de contacto y Oficial de Privacidad: privacidad@gamasecurity.cl.')

      addSection('2. FINALIDAD Y BASE DE LICITUD (ART. 13 LEY N° 21.719)',
        'Los datos personales facilitados en formularios web (nombre, correo, teléfono y requerimientos de seguridad) se tratan con la base de licitud de medidas precontractuales y consentimiento informado del titular. Se emplean exclusivamente para responder consultas comerciales, cotizaciones de alarmas y videovigilancia, sin que jamás sean vendidos ni cedidos a terceros.')

      addSection('3. POLÍTICA DE COOKIES Y RASTREO TÉCNICO',
        'El sitio web utiliza cookies técnicas estrictamente necesarias para la navegación segura y protección contra ataques DDoS y CSRF. Opcionalmente se utilizan cookies analíticas agregadas y anónimas destinadas a optimizar la usabilidad del portal. El usuario puede revocar su consentimiento en cualquier momento.')

      addSection('4. EJERCICIO DE DERECHOS ARCO+ (PLAZO LEGAL: 15 DÍAS HÁBILES)',
        'Todo titular de datos tiene derecho a ejercer gratuitamente ante Gama Seguridad sus derechos de Acceso, Rectificación, Supresión (Cancelación), Oposición, Bloqueo y Portabilidad de datos (Artículos 15 a 20 de la Ley N° 21.719). Para ejercerlos, dirija un correo formal a privacidad@gamasecurity.cl acompañando copia de su cédula de identidad.')

      addSection('5. SEGURIDAD Y DEBER DE CONFIDENCIALIDAD',
        'Gama Seguridad SpA implementa cifrado TLS 1.3 en todas las transmisiones telemáticas, cortafuegos perimetrales y protocolos estrictos de secreto profesional para todo su personal bajo pena de la Ley N° 21.459 de Delitos Informáticos.')

      y += 15
      doc.line(70, y, 140, y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(0, 51, 102)
      doc.text('OFICINA DE PRIVACIDAD & CUMPLIMIENTO LEGAL', 105, y + 4, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(80, 80, 80)
      doc.text('GAMA SEGURIDAD SpA · REPÚBLICA DE CHILE', 105, y + 8, { align: 'center' })

      doc.save(`GamaSeguridad_Politica_Privacidad_Web_Ley21719_${new Date().toISOString().slice(0,10)}.pdf`)
    } finally {
      setGenerandoPdf(false)
    }
  }

  const handleEnviarArco = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formArco.nombre || !formArco.rut || !formArco.email) {
      alert('Por favor complete los campos obligatorios.')
      return
    }
    // Generar mailto link directo
    const subject = encodeURIComponent(`SOLICITUD ARCO+ LEY 21.719 — ${formArco.tipo} — ${formArco.nombre}`)
    const body = encodeURIComponent(
      `Estimado Oficial de Privacidad de Gama Seguridad SpA:\n\n` +
      `Por medio del presente correo, de conformidad con la Ley N° 21.719 de Protección de Datos Personales de Chile, solicito el ejercicio del siguiente derecho:\n\n` +
      `• Titular: ${formArco.nombre}\n` +
      `• RUT: ${formArco.rut}\n` +
      `• Correo de contacto: ${formArco.email}\n` +
      `• Tipo de Derecho: ${formArco.tipo}\n` +
      `• Detalle de la Solicitud:\n${formArco.detalle}\n\n` +
      `Adjunto a este correo copia simple de mi Cédula de Identidad para verificar mi identidad según exige la ley.\n\n` +
      `Atentamente,\n${formArco.nombre}`
    )
    window.open(`mailto:privacidad@gamasecurity.cl?subject=${subject}&body=${body}`, '_blank')
    setFormArcoEnviado(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0c182b] border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Cabecera Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#001f3f] to-[#003366] border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  Marco Legal Chile · Ley N° 21.719
                </span>
                <span className="text-[11px] text-slate-300 hidden sm:inline">
                  Vigente {new Date().getFullYear()}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                Centro de Privacidad & Cumplimiento Normativo
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pestañas */}
        <div className="flex border-b border-slate-800 bg-[#081220] px-4 overflow-x-auto gap-2">
          <button
            onClick={() => setPestaña('privacidad')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              pestaña === 'privacidad'
                ? 'border-blue-400 text-blue-300 bg-blue-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>POLÍTICA DE PRIVACIDAD</span>
          </button>

          <button
            onClick={() => setPestaña('cookies')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              pestaña === 'cookies'
                ? 'border-blue-400 text-blue-300 bg-blue-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>POLÍTICA DE COOKIES</span>
          </button>

          <button
            onClick={() => setPestaña('terminos')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              pestaña === 'terminos'
                ? 'border-blue-400 text-blue-300 bg-blue-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>TÉRMINOS Y CONDICIONES</span>
          </button>

          <button
            onClick={() => setPestaña('arco')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              pestaña === 'arco'
                ? 'border-blue-400 text-blue-300 bg-blue-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>DERECHOS ARCO+ (15 DÍAS)</span>
          </button>
        </div>

        {/* Contenido Scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed text-slate-300">
          
          {/* ── PESTAÑA 1: PRIVACIDAD ── */}
          {pestaña === 'privacidad' && (
            <div className="space-y-5">
              <div className="bg-blue-950/40 border border-blue-500/30 p-4 rounded-2xl flex items-start gap-3 text-xs text-blue-200">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Aviso de Privacidad Proactiva:</strong> Gama Seguridad SpA garantiza que todos los datos recolectados en este sitio web son tratados conforme a los principios de 
                  <strong> licitud, lealtad, transparencia, proporcionalidad y responsabilidad proactiva</strong> contemplados en la Ley N° 21.719 de Chile.
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>1. Responsable del Tratamiento de Datos</span>
                </h3>
                <p className="text-slate-300">
                  El responsable legal del tratamiento es <strong>INVERSIONES GAMA SpA / GAMA SEGURIDAD SpA</strong>, R.U.T. <strong>78.297.009-7</strong>, 
                  con domicilio en Avenida Valparaíso 351, comuna de Villa Alemana, Región de Valparaíso, Chile. 
                  Para cualquier consulta sobre privacidad o ejercicio de derechos, nuestro Oficial de Protección de Datos (DPO) atiende en el canal oficial: 
                  <a href="mailto:privacidad@gamasecurity.cl" className="text-blue-400 underline font-mono ml-1 font-bold">privacidad@gamasecurity.cl</a>.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>2. Datos que Recopilamos en Este Sitio Web</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Formularios de Contacto y Cotización:</strong> Nombre completo, correo electrónico, número de teléfono y detalles de la propiedad o requerimiento de seguridad.</li>
                  <li><strong>Datos de Navegación Técnica:</strong> Dirección IP anonimizada, fecha y hora de la solicitud, navegador y sistema operativo (empleados exclusivamente para mitigar ciberataques, prevención de fraudes y estadísticas de tráfico).</li>
                  <li><strong>Canal de WhatsApp:</strong> Al pulsar el botón de WhatsApp, la conversación se rige por el protocolo de seguridad cifrado de extremo a extremo de la plataforma Meta.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-400" />
                  <span>3. Finalidad del Tratamiento y Base de Licitud</span>
                </h3>
                <p className="text-slate-300">
                  La base de licitud que nos autoriza a tratar sus datos es su <strong>consentimiento informado expreso</strong> otorgado al enviar el formulario (Art. 13 letra a) y la <strong>ejecución de medidas precontractuales</strong> a solicitud del propio interesado (Art. 13 letra b de la Ley N° 21.719). 
                  Sus datos solo se utilizarán para:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Elaborar y remitir la cotización técnica y económica solicitada.</li>
                  <li>Coordinar inspecciones de terreno o asesorías de seguridad electrónica.</li>
                  <li>Responder consultas técnicas y brindar soporte de nuestros servicios de monitoreo 24/7.</li>
                </ul>
                <p className="text-slate-400 text-xs italic">
                  *Gama Seguridad SpA NO comercializa, arrienda, cede ni transfiere bases de datos de prospectos o clientes a empresas de marketing ni a terceros ajenos a la prestación del servicio.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>4. Plazo de Conservación de Datos</span>
                </h3>
                <p className="text-slate-300">
                  Los datos de prospectos recopilados mediante cotizaciones web se conservan durante el período necesario para atender la propuesta comercial y hasta un máximo de 12 meses. 
                  En caso de contratarse el servicio de monitoreo 24/7, los datos pasan a regirse por la política de abonados (retención durante la vigencia del contrato + plazos perentorios de Carabineros OS-10).
                </p>
              </div>
            </div>
          )}

          {/* ── PESTAÑA 2: COOKIES ── */}
          {pestaña === 'cookies' && (
            <div className="space-y-5">
              <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
                <Cookie className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Transparencia en Tecnologías de Rastreo:</strong> Informamos de forma clara y accesible sobre el uso de cookies y almacenamiento local 
                  conforme a los estándares de la Ley N° 21.719 y las mejores prácticas internacionales de privacidad.
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">¿Qué es una Cookie?</h3>
                <p className="text-slate-300">
                  Una cookie es un pequeño archivo de texto que un sitio web almacena en el navegador del usuario al visitarlo. 
                  Permite recordar información sobre su visita, como su preferencia de navegación o validar sesiones seguras.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Categorías de Cookies Empleadas en Gama Seguridad</h3>
                
                <div className="grid gap-3">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs uppercase tracking-wide">1. Cookies Técnicas & Estrictamente Necesarias</span>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Siempre Activas</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Imprescindibles para el correcto funcionamiento técnico de la plataforma web, la prevención de ataques automatizados (CSRF/DDoS) y el enrutamiento seguro SSL/TLS. No pueden ser desactivadas.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs uppercase tracking-wide">2. Cookies de Preferencias & Consentimiento</span>
                      <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">Funcionales</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Almacenan en su dispositivo su elección respecto a la aceptación del banner de privacidad (`gama_cookies_consent`), evitando consultar nuevamente en cada página.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs uppercase tracking-wide">3. Métricas y Rendimiento Agregado</span>
                      <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">Anonimizadas</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Herramientas de diagnóstico de velocidad y disponibilidad del servidor Vercel con direcciones IP enmascaradas, sin crear perfiles de publicidad conductual.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">¿Cómo Administrar o Eliminar Cookies?</h3>
                <p className="text-slate-300">
                  Usted puede configurar o bloquear en cualquier momento las cookies desde el panel de ajustes de su navegador web (Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge). 
                  Tenga en cuenta que la deshabilitación de cookies técnicas esenciales puede limitar ciertas funcionalidades de seguridad del sitio.
                </p>
              </div>
            </div>
          )}

          {/* ── PESTAÑA 3: TÉRMINOS ── */}
          {pestaña === 'terminos' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Condiciones Generales de Uso del Portal Web</h3>
                <p className="text-slate-300">
                  El acceso y navegación en el sitio web <strong>www.gamasecurity.cl</strong> atribuye la condición de usuario e implica la aceptación plena de las presentes estipulaciones. 
                  La información técnica de equipos (Alarmas Vetti, teclados DSC, cámaras Dahua y cercos eléctricos) es de carácter referencial y orientativo.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Propiedad Intelectual & Marcas</h3>
                <p className="text-slate-300">
                  Todos los contenidos, logotipos, diseños, código fuente, esquemas y textos son propiedad exclusiva de Gama Seguridad SpA o de sus respectivos fabricantes licenciantes. 
                  Queda prohibida su reproducción, ingeniería inversa o uso no autorizado sin consentimiento previo y por escrito.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Cotizaciones y Perfeccionamiento del Contrato</h3>
                <p className="text-slate-300">
                  Las solicitudes de cotización remitidas vía web no constituyen un contrato de prestación de servicios definitivo. 
                  El servicio de monitoreo 24/7 y seguridad electrónica se perfecciona únicamente mediante la suscripción del 
                  <strong> Contrato Oficial de Monitoreo de Alarmas</strong>, previa verificación técnica de factibilidad en el inmueble del abonado.
                </p>
              </div>
            </div>
          )}

          {/* ── PESTAÑA 4: ARCO+ ── */}
          {pestaña === 'arco' && (
            <div className="space-y-5">
              <div className="bg-blue-950/40 border border-blue-500/30 p-4 rounded-2xl text-xs text-blue-200">
                <strong>Canal Formal de Ejercicio de Derechos ARCO+:</strong> De conformidad con el Título III de la Ley N° 21.719, 
                usted tiene derecho a solicitar gratuitamente en cualquier momento el acceso, corrección o eliminación de sus datos. 
                Gama Seguridad responderá fundadamente dentro del <strong>plazo legal perentorio de 15 días hábiles</strong>.
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Derecho de Acceso
                  </div>
                  <div className="text-slate-400 text-[11px]">Conocer qué datos personales suyos tratamos, el origen y los destinatarios autorizados.</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Derecho de Rectificación
                  </div>
                  <div className="text-slate-400 text-[11px]">Modificar datos inexactos, desactualizados, equívocos o incompletos.</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Derecho de Supresión
                  </div>
                  <div className="text-slate-400 text-[11px]">Solicitar el borrado de sus datos cuando haya cesado la finalidad o revocado su consentimiento.</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Portabilidad (Art. 19)
                  </div>
                  <div className="text-slate-400 text-[11px]">Recibir sus datos en formato digital estructurado, genérico y legible por máquina (JSON).</div>
                </div>
              </div>

              {formArcoEnviado ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-2xl text-center space-y-2 text-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-sm text-white">Solicitud Redactada para Envío</h4>
                  <p className="text-xs text-slate-300">
                    Se ha abierto su cliente de correo con el requerimiento formal dirigido a <strong>privacidad@gamasecurity.cl</strong>. 
                    Recuerde adjuntar una fotografía o escaneo de su cédula de identidad para acreditar titularidad conforme a la ley.
                  </p>
                  <button
                    onClick={() => setFormArcoEnviado(false)}
                    className="text-xs text-blue-400 underline pt-2 cursor-pointer font-bold"
                  >
                    Ingresar otra solicitud
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnviarArco} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                    Formulario Web Directo para Solicitudes ARCO+
                  </h4>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nombre Completo Titular *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Andrés Pérez Soto"
                        value={formArco.nombre}
                        onChange={(e) => setFormArco({ ...formArco, nombre: e.target.value })}
                        className="w-full bg-[#060c18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">R.U.T. *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 12.345.678-9"
                        value={formArco.rut}
                        onChange={(e) => setFormArco({ ...formArco, rut: e.target.value })}
                        className="w-full bg-[#060c18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Correo Electrónico de Respuesta *</label>
                      <input
                        type="email"
                        required
                        placeholder="su-correo@ejemplo.cl"
                        value={formArco.email}
                        onChange={(e) => setFormArco({ ...formArco, email: e.target.value })}
                        className="w-full bg-[#060c18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Derecho que Desea Ejercer *</label>
                      <select
                        value={formArco.tipo}
                        onChange={(e) => setFormArco({ ...formArco, tipo: e.target.value })}
                        className="w-full bg-[#060c18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400 font-bold"
                      >
                        <option value="ACCESO">ACCESO (Conocer mis datos)</option>
                        <option value="RECTIFICACION">RECTIFICACIÓN (Corregir datos)</option>
                        <option value="SUPRESION">SUPRESIÓN / OLVIDO (Borrar mis datos)</option>
                        <option value="OPOSICION">OPOSICIÓN (Cesar tratamiento)</option>
                        <option value="PORTABILIDAD">PORTABILIDAD (Exportar JSON)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Detalle del Requerimiento *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Especifique con precisión qué datos solicita acceder, corregir o eliminar..."
                      value={formArco.detalle}
                      onChange={(e) => setFormArco({ ...formArco, detalle: e.target.value })}
                      className="w-full bg-[#060c18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Generar Solicitud Formal por Correo →</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer Modal con Descarga de PDF y Contacto */}
        <div className="p-4 sm:p-5 bg-[#081220] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Canal Ciudadano: <strong>privacidad@gamasecurity.cl</strong></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={descargarPoliticaPdf}
              disabled={generandoPdf}
              className="bg-white/10 hover:bg-white/15 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 transition-all cursor-pointer text-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>{generandoPdf ? 'Generando...' : 'Descargar Política en PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl transition-all cursor-pointer text-xs"
            >
              Entendido
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
