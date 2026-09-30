'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Sparkles,
  Send,
  Upload,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Users,
  Image as ImageIcon,
  RotateCcw,
  Smartphone,
  Monitor,
  History,
  BookOpen,
  Copy,
  Loader2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

interface CampanaLog {
  id: string;
  nombre: string;
  asunto: string;
  total_destinatarios: number;
  entregados: number;
  fallidos: number;
  remitente: string;
  reply_to: string;
  fecha: string;
}

const TEMPLATES_SUGERIDOS = [
  {
    titulo: '🔥 Promo Pack VETTI Smart ($0 Instalación)',
    tipo: 'promocion' as const,
    prompt: 'Escribe un correo promocional para hogares y empresas ofreciendo el Pack VETTI Smart con instalación bonificada ($0) y monitoreo 24/7 desde 0,9 UF mensual. Destaca que el equipo es 100% propio del cliente (sin arriendos engañosos) y que incluye App móvil NT CLICK.',
    imagenUrl: '/ads/vetti_ad_oficial_master.png',
    ctaTexto: '👉 Cotizar Pack Vetti por WhatsApp',
    ctaUrl: 'https://wa.me/56991016912?text=Hola%20GAMA%20Seguridad,%20recib%C3%AD%20el%20correo%20de%20la%20promoci%C3%B3n%20Pack%20VETTI%20Smart%20y%20quiero%20aprovecharla.',
  },
  {
    titulo: '📋 Comunicado Mantención Preventiva de Central',
    tipo: 'comunicado' as const,
    prompt: 'Informa a los clientes monitoreados que este fin de semana realizaremos una actualización preventiva de infraestructura en los servidores centrales entre las 02:00 y las 04:00 AM. Aclara que el monitoreo de alarmas y despacho de emergencias seguirá 100% operativo sin interrupción.',
    imagenUrl: '',
    ctaTexto: 'Ver Estado del Servicio',
    ctaUrl: 'https://www.gamasecurity.cl',
  },
  {
    titulo: '🛡️ Bienvenida & Tips de Seguridad para Clientes Nuevos',
    tipo: 'comunicado' as const,
    prompt: 'Da la bienvenida oficial a un nuevo cliente que recién instaló su sistema de seguridad con GAMA. Explícale cómo probar su alarma una vez al mes, cómo llamar a la central de monitoreo 24/7 (+56 9 9101 6912) y cómo usar la App móvil.',
    imagenUrl: '/ads/vetti_ad_1.png',
    ctaTexto: 'Descargar App de Seguridad',
    ctaUrl: 'https://www.gamasecurity.cl/servicios/alarma-con-app',
  },
  {
    titulo: '💳 Recordatorio de Pago Mensual y Datos de Transferencia',
    tipo: 'cobranza' as const,
    prompt: 'Redacta un recordatorio formal y amable para el pago del servicio de monitoreo mensual correspondiente al mes en curso. Indica que para emitir la factura electrónica o reportar su pago pueden responder a este mismo correo.',
    imagenUrl: '',
    ctaTexto: 'Reportar Comprobante por WhatsApp',
    ctaUrl: 'https://wa.me/56991016912?text=Hola,%20adjunto%20comprobante%20de%20pago%20de%20monitoreo.',
  },
];

export default function GestionMailsModule() {
  const [activeTab, setActiveTab] = useState<'redactor' | 'historial' | 'plantillas'>('redactor');
  
  // Audiencia
  const [destinatariosRaw, setDestinatariosRaw] = useState<string>('tetoromoreno@gamasecurity.cl');
  const [adminEmail, setAdminEmail] = useState<string>('tetoromoreno@gamasecurity.cl');
  const [prospectosEmails, setProspectosEmails] = useState<string[]>([]);
  const [clientesEmails, setClientesEmails] = useState<string[]>([]);
  
  // Generación IA
  const [tipoCorreo, setTipoCorreo] = useState<'promocion' | 'comunicado' | 'cobranza'>('promocion');
  const [promptIA, setPromptIA] = useState<string>(
    'Promoción del mes: Pack Alarma VETTI Smart inalámbrica con instalación bonificada ($0) y monitoreo 24/7 desde 0,9 UF. Equipos 100% propios sin arriendos.'
  );
  const [imagenUrl, setImagenUrl] = useState<string>('/ads/vetti_ad_oficial_master.png');
  const [ctaTexto, setCtaTexto] = useState<string>('👉 Quiero mi Promoción por WhatsApp');
  const [ctaUrl, setCtaUrl] = useState<string>('https://wa.me/56991016912');
  
  // Contenido generado
  const [asunto, setAsunto] = useState<string>('🛡️ Promoción Exclusiva Pack VETTI Smart — GAMA Seguridad');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  
  // Estados de carga y feedback
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [historial, setHistorial] = useState<CampanaLog[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar listas e historial al iniciar
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/gestion-mails/listas');
        if (res.ok) {
          const data = await res.json();
          if (data.adminEmail) setAdminEmail(data.adminEmail);
          if (Array.isArray(data.prospectosSample)) setProspectosEmails(data.prospectosSample);
          if (Array.isArray(data.clientesSample)) setClientesEmails(data.clientesSample);
          if (Array.isArray(data.historial)) setHistorial(data.historial);
        }
      } catch (err) {
        console.warn('Error cargando listas de correos:', err);
      }
    }
    loadData();
    // Generar un borrador inicial si está vacío
    handleGenerarIA(false);
  }, []);

  // Extraer lista de correos válidos del textarea
  const validEmails = React.useMemo(() => {
    return Array.from(
      new Set(
        destinatariosRaw
          .split(/[\n,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      )
    );
  }, [destinatariosRaw]);

  // Manejar Generación con IA
  const handleGenerarIA = async (notify = true) => {
    if (!promptIA.trim()) return;
    setIsGenerating(true);
    if (notify) setStatusMessage(null);

    try {
      const res = await fetch('/api/gestion-mails/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptIA,
          tipo: tipoCorreo,
          imagenUrl: imagenUrl.trim(),
          ctaTexto,
          ctaUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.html) {
        setAsunto(data.asunto || asunto);
        setHtmlContent(data.html);
        if (notify) {
          setStatusMessage({
            type: 'success',
            text: '¡Correo generado con éxito por la IA con diseño corporativo anti-spam!',
          });
        }
      } else {
        if (notify) setStatusMessage({ type: 'error', text: data.error || 'Error al generar correo' });
      }
    } catch (err: any) {
      if (notify) setStatusMessage({ type: 'error', text: err.message || 'Error de conexión' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Subir imagen desde PC
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/landing-marketing/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setImagenUrl(data.url);
        setStatusMessage({
          type: 'success',
          text: 'Fotografía subida al proyecto. Vuelve a hacer clic en "Generar con IA" o inserta la imagen para actualizar la vista previa.',
        });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error subiendo imagen' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al procesar foto' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Enviar Prueba Personal (a tetoromoreno@gamasecurity.cl)
  const handleEnviarPrueba = async () => {
    if (!htmlContent.trim() || !asunto.trim()) {
      alert('Debes generar o redactar un asunto y cuerpo de correo primero.');
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/gestion-mails/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarios: [adminEmail],
          asunto: `[PRUEBA INTERNA] ${asunto}`,
          html: htmlContent,
          imagenUrl,
          nombreCampana: `Prueba: ${asunto.slice(0, 30)}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.entregados > 0) {
        setStatusMessage({
          type: 'success',
          text: `✅ Correo de prueba despachado exitosamente a ${adminEmail}. Revisa tu bandeja de entrada.`,
        });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error al enviar prueba' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Fallo de red al enviar' });
    } finally {
      setIsSending(false);
    }
  };

  // Despachar a todos los destinatarios
  const handleDespacharCampana = async () => {
    if (validEmails.length === 0) {
      alert('Debes ingresar al menos un correo electrónico destinatario válido.');
      return;
    }

    if (!htmlContent.trim() || !asunto.trim()) {
      alert('El asunto o cuerpo del correo están vacíos.');
      return;
    }

    const confirmar = confirm(
      `¿Confirmas el despacho oficial de este correo a ${validEmails.length} destinatario(s)?\n\n` +
      `• Remitente: contacto@gamasecurity.cl\n` +
      `• Respuestas llegarán a: ${adminEmail}\n` +
      `• Copia automática a: ${adminEmail}`
    );

    if (!confirmar) return;

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/gestion-mails/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarios: validEmails,
          asunto,
          html: htmlContent,
          imagenUrl,
          nombreCampana: asunto,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `🎉 Campaña despachada: ${data.entregados} entregado(s) con éxito, ${data.fallidos} error(es). Se envió copia a tu correo.`,
        });
        // Recargar historial
        const histRes = await fetch('/api/gestion-mails/listas');
        if (histRes.ok) {
          const d = await histRes.json();
          if (Array.isArray(d.historial)) setHistorial(d.historial);
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error despachando correos' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error de red en el despacho' });
    } finally {
      setIsSending(false);
    }
  };

  // Cargar una plantilla
  const handleAplicarPlantilla = (p: typeof TEMPLATES_SUGERIDOS[0]) => {
    setTipoCorreo(p.tipo);
    setPromptIA(p.prompt);
    if (p.imagenUrl) setImagenUrl(p.imagenUrl);
    setCtaTexto(p.ctaTexto);
    setCtaUrl(p.ctaUrl);
    setActiveTab('redactor');
    setStatusMessage({
      type: 'info',
      text: `Plantilla cargada: "${p.titulo}". Haz clic en "Generar con IA" para redactarla.`,
    });
  };

  return (
    <div className="flex-1 bg-white border border-slate-300/80 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm min-h-0 overflow-y-auto font-sans">
      
      {/* ── HEADER SUPERIOR CON METADATOS ── */}
      <div className="bg-gradient-to-r from-[#002b66] via-[#0b2545] to-[#134074] border border-blue-900 text-white p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl text-slate-950 font-black shadow-md flex items-center justify-center">
            <Mail className="h-6 w-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black uppercase tracking-wider text-white">
                Gestión de Mails IA
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Remitente: contacto@gamasecurity.cl
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-500/30">
                Reply-To: {adminEmail}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Redacción con IA Gemini, diseño HTML corporativo anti-spam, inserción de imágenes y respuestas dirigidas directamente a tu correo personal.
            </p>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-slate-700/60 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('redactor')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'redactor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Redactor & Envío</span>
          </button>
          <button
            onClick={() => setActiveTab('plantillas')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'plantillas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Plantillas</span>
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({historial.length})</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-blue-50 border-blue-300 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL: PESTAÑA REDACTOR ── */}
      {activeTab === 'redactor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── COLUMNA IZQUIERDA: CONFIGURACIÓN, AUDIENCIA E IA (5 COLUMNAS) ── */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* 1. SECCIÓN DESTINATARIOS */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Destinatarios
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                  {validEmails.length} casilla(s) lista(s)
                </span>
              </div>

              {/* Botones de Selección Rápida */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setDestinatariosRaw(adminEmail)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-blue-500 text-[11px] font-bold text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Solo mi correo (Prueba)</span>
                </button>
                {prospectosEmails.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const list = Array.from(new Set([...validEmails, ...prospectosEmails])).join(', ');
                      setDestinatariosRaw(list);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 text-[11px] font-bold text-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Leads Web ({prospectosEmails.length})</span>
                  </button>
                )}
                {clientesEmails.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const list = Array.from(new Set([...validEmails, ...clientesEmails])).join(', ');
                      setDestinatariosRaw(list);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-indigo-500 text-[11px] font-bold text-indigo-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Clientes Monitoreo ({clientesEmails.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDestinatariosRaw('')}
                  className="px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-[10px] font-bold text-slate-600 transition-all cursor-pointer"
                  title="Limpiar lista"
                >
                  Limpiar
                </button>
              </div>

              {/* Área de texto de correos */}
              <div>
                <textarea
                  rows={3}
                  value={destinatariosRaw}
                  onChange={(e) => setDestinatariosRaw(e.target.value)}
                  placeholder="Ingresa casillas separadas por coma o salto de línea (ej: cliente@gmail.com, contacto@empresa.cl)"
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 Siempre te llegará una copia de respaldo a <strong>{adminEmail}</strong> y cuando un cliente responda, te llegará directamente a ti.
                </p>
              </div>
            </div>

            {/* 2. MOTOR DE REDACCIÓN CON IA */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Redacción Inteligente con IA
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-500 font-mono">
                  Gemini 2.5
                </span>
              </div>

              {/* Selector de tipo */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTipoCorreo('promocion')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    tipoCorreo === 'promocion' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔥 Promo Venta
                </button>
                <button
                  type="button"
                  onClick={() => setTipoCorreo('comunicado')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    tipoCorreo === 'comunicado' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 Comunicado
                </button>
                <button
                  type="button"
                  onClick={() => setTipoCorreo('cobranza')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    tipoCorreo === 'cobranza' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💳 Cobranza
                </button>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  ¿Qué deseas comunicar u ofrecer en este correo?
                </label>
                <textarea
                  rows={3}
                  value={promptIA}
                  onChange={(e) => setPromptIA(e.target.value)}
                  placeholder="Ej: Escribe un correo promocionando el Pack VETTI Smart con instalación $0 para casas en Santiago y respuesta en menos de 2 minutos."
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                />
              </div>

              {/* Inserción de Imagen / Flyer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Afiche o Fotografía (Opcional)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Desde PC o Galería</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadImage}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Subir de PC</span>
                  </button>
                  <input
                    type="text"
                    value={imagenUrl}
                    onChange={(e) => setImagenUrl(e.target.value)}
                    placeholder="/ads/vetti_ad_oficial_master.png o URL externa"
                    className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                  />
                </div>

                {imagenUrl && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                      ✓ Imagen vinculada al correo
                    </span>
                    <button
                      type="button"
                      onClick={() => setImagenUrl('')}
                      className="text-[10px] text-slate-400 hover:text-rose-600 font-bold underline cursor-pointer"
                    >
                      Quitar imagen
                    </button>
                  </div>
                )}
              </div>

              {/* Botón CTA (Llamado a la acción) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Texto del Botón CTA
                  </label>
                  <input
                    type="text"
                    value={ctaTexto}
                    onChange={(e) => setCtaTexto(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Enlace de Destino (WhatsApp / Web)
                  </label>
                  <input
                    type="text"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Botón Principal Generar con IA */}
              <button
                type="button"
                disabled={isGenerating || !promptIA.trim()}
                onClick={() => handleGenerarIA(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redactando correo con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generar / Rediseñar con IA</span>
                  </>
                )}
              </button>

            </div>

          </div>

          {/* ── COLUMNA DERECHA: ASUNTO, PREVIEW EN VIVO Y ENVÍO (7 COLUMNAS) ── */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Campo Asunto */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                Asunto del Correo Electrónico
              </label>
              <input
                type="text"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Ej: 🛡️ Promoción Exclusiva Pack VETTI Smart — GAMA Seguridad"
                className="w-full text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* BARRA DE HERRAMIENTAS DEL PREVIEW */}
            <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-t-2xl border-t border-x border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Vista Previa en Vivo</span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  (Simulación de entrega real en Gmail / Outlook)
                </span>
              </div>

              {/* Selector Desktop / Mobile */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista Computador"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista Celular"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CONTENEDOR DEL PREVIEW (IFRAME AISLADO O MARCO MÓVIL) */}
            <div className="bg-slate-800/90 p-4 sm:p-6 rounded-b-2xl border-b border-x border-slate-800 flex justify-center items-center min-h-[460px]">
              <div
                className={`bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 border border-slate-300 ${
                  previewDevice === 'mobile'
                    ? 'w-[360px] max-w-full rounded-[32px] border-4 border-slate-900 shadow-2xl p-1'
                    : 'w-full max-w-[620px]'
                }`}
              >
                {htmlContent ? (
                  <div
                    className="preview-email-sandbox overflow-y-auto max-h-[580px]"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                ) : (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-xs font-semibold">Generando diseño de correo...</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── BOTONES DE ENVÍO Y DESPACHO ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              {/* Botón Prueba a tetoromoreno */}
              <button
                type="button"
                disabled={isSending || isGenerating}
                onClick={handleEnviarPrueba}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                title="Te envía una copia idéntica a tu correo para que la revises"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Enviar Prueba a mi Correo</span>
              </button>

              {/* Botón Despachar Campaña */}
              <button
                type="button"
                disabled={isSending || isGenerating || validEmails.length === 0}
                onClick={handleDespacharCampana}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Despachando correos...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Despachar a {validEmails.length} Destinatario(s)</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ── PESTAÑA: PLANTILLAS REUTILIZABLES ── */}
      {activeTab === 'plantillas' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900">
              Plantillas Rápidas Preconfiguradas
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona una plantilla para cargarla en el redactor y generar el correo corporativo en 1 clic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES_SUGERIDOS.map((tpl, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      tpl.tipo === 'promocion'
                        ? 'bg-rose-100 text-rose-700'
                        : tpl.tipo === 'cobranza'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {tpl.tipo}
                    </span>
                    {tpl.imagenUrl && (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Incluye Flyer
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {tpl.titulo}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {tpl.prompt}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAplicarPlantilla(tpl)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Cargar en Redactor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PESTAÑA: HISTORIAL DE ENVÍOS ── */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Historial de Campañas y Correos Enviados
              </h3>
              <p className="text-xs text-slate-500">
                Registro de comunicaciones oficiales despachadas vía Resend desde contacto@gamasecurity.cl
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              Total: {historial.length} envíos
            </span>
          </div>

          {historial.length === 0 ? (
            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-2xl">
              <Mail className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Aún no se han despachado campañas de correo desde este panel.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Asunto de la Campaña</th>
                    <th className="p-3.5 text-center">Destinatarios</th>
                    <th className="p-3.5 text-center">Entregados</th>
                    <th className="p-3.5">Reply-To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {historial.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(item.fecha).toLocaleString('es-CL')}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {item.asunto}
                      </td>
                      <td className="p-3.5 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold">
                          {item.total_destinatarios}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          ✓ {item.entregados} OK
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        {item.reply_to}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
