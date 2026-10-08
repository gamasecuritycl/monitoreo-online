'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Sliders,
  Image as ImageIcon,
  MessageSquare,
  ExternalLink,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  BellRing,
  HelpCircle,
  Tag,
  Zap,
  Globe,
  Loader2,
  Upload,
  PhoneCall,
  ShieldCheck,
  X
} from 'lucide-react'
import { compressImageToWebP } from '@/lib/imageCompression'
import {
  LandingMarketingConfig,
  DEFAULT_LANDING_MARKETING_CONFIG,
  HeroSlide
} from '@/lib/landing-marketing/types'

const PRESET_IMAGES = [
  { label: 'Flyer Oficial Vetti Master', url: '/ads/vetti_ad_oficial_master.png' },
  { label: 'Vetti Promo Pack 1', url: '/ads/vetti_ad_1.png' },
  { label: 'Vetti Promo Pack 2', url: '/ads/vetti_ad_2.png' },
  { label: 'Vetti Promo Pack 3', url: '/ads/vetti_ad_3.png' },
  { label: 'Vetti Promo Pack 7', url: '/ads/vetti_ad_7.png' },
  { label: 'Central de Monitoreo 24/7', url: '/central-monitoreo.webp' },
  { label: 'Cámaras CCTV & IA 4K', url: '/camaras-cctv.webp' },
  { label: 'Cerco Eléctrico Certificado', url: '/cerco-electrico.webp' },
  { label: 'App NT Click Control', url: '/vetti-click-app.webp' },
]

function ImageUploadField({
  value,
  onChange,
  label = 'Fotografía / Flyer',
  helperText = 'Sube una foto desde tu PC. Se adaptará automáticamente a la resolución del proyecto.',
}: {
  value: string
  onChange: (url: string) => void
  label?: string
  helperText?: string
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      // Compresión automática a formato WebP ultraligero antes de enviar
      const fileToUpload = await compressImageToWebP(file, { maxWidth: 1600, maxHeight: 1200, quality: 0.85 })
      const formData = new FormData()
      formData.append('file', fileToUpload)

      const res = await fetch('/api/landing-marketing/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.url) {
        onChange(data.url)
      } else {
        setUploadError(data.error || 'Error al subir la imagen')
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error de conexión al subir la imagen')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[11px] text-slate-400 font-mono">PNG, JPG, WEBP</span>
      </div>

      {/* Botón de subida y campo manual */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Subiendo...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Subir desde mi PC</span>
            </>
          )}
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/ads/vetti_ad_oficial_master.png o URL externa"
            className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
      </div>

      {uploadError && (
        <p className="text-xs font-semibold text-rose-600">{uploadError}</p>
      )}

      {/* Miniatura actual */}
      {value && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden relative border border-slate-300 flex-shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Vista previa"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-700 block truncate">
              Imagen lista para publicar
            </span>
            <span className="text-[10px] text-slate-500 font-mono block truncate">
              {value.startsWith('data:') ? 'Fotografía subida desde PC (lista en memoria)' : value}
            </span>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-500">{helperText}</p>
    </div>
  )
}

export default function LandingMarketingModule() {
  const [activeTab, setActiveTab] = useState<'hero' | 'popup' | 'chatbot'>('popup')
  const [config, setConfig] = useState<LandingMarketingConfig>(DEFAULT_LANDING_MARKETING_CONFIG)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null)
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0)
  const [modalPreviewOpen, setModalPreviewOpen] = useState<boolean>(false)

  const isInitialLoadRef = React.useRef<boolean>(true)
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Función principal de guardado con cero caché y propagación en vivo
  const performSave = React.useCallback(async (configToSave: LandingMarketingConfig, isAutoSave = false) => {
    setIsSaving(true)
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/landing-marketing?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify(configToSave),
      })

      if (res.ok) {
        const timeStr = new Date().toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        setLastSavedTime(timeStr)
        setSaveStatus('saved')
        setSaveMessage({
          type: 'success',
          text: isAutoSave
            ? `✓ Auto-guardado en vivo (${timeStr}) — Base de datos sincronizada y caché purgada.`
            : `✓ ¡Cambios guardados con éxito (${timeStr})! La portada www.gamasecurity.cl refleja los cambios de inmediato sin caché.`,
        })

        // Respaldar en localStorage
        try {
          localStorage.setItem('gama_landing_marketing_latest', JSON.stringify(configToSave))
        } catch (_) {}

        // Sincronizar en vivo con otras pestañas y ventanas
        try {
          window.dispatchEvent(new CustomEvent('landing-marketing-updated', { detail: configToSave }))
          const bc = new BroadcastChannel('landing_marketing_channel')
          bc.postMessage(configToSave)
          bc.close()
        } catch (_) {}
      } else {
        const err = await res.json().catch(() => ({}))
        setSaveStatus('error')
        setSaveMessage({
          type: 'error',
          text: err.error || 'Error al guardar la configuración en la base de datos.',
        })
      }
    } catch (error) {
      setSaveStatus('error')
      setSaveMessage({
        type: 'error',
        text: 'Error de red al intentar sincronizar con el servidor.',
      })
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Cargar configuración desde la API (sin caché)
  useEffect(() => {
    async function fetchConfig() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/landing-marketing?t=${Date.now()}&nocache=1`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        if (res.ok) {
          const data = await res.json()
          if (data) {
            const loaded = data.config || (data.popup ? data : null)
            if (loaded) {
              setConfig(loaded)
              try {
                localStorage.setItem('gama_landing_marketing_latest', JSON.stringify(loaded))
              } catch (_) {}
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar config de landing marketing:', err)
        try {
          const cached = localStorage.getItem('gama_landing_marketing_latest')
          if (cached) setConfig(JSON.parse(cached))
        } catch (_) {}
      } finally {
        setIsLoading(false)
        // Habilitar auto-save después de que el estado inicial se haya cargado
        setTimeout(() => {
          isInitialLoadRef.current = false
        }, 400)
      }
    }
    fetchConfig()
  }, [])

  // Auto-guardado en vivo ante cualquier modificación en config
  useEffect(() => {
    if (isInitialLoadRef.current) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    setSaveStatus('saving')
    autoSaveTimerRef.current = setTimeout(() => {
      performSave(config, true)
    }, 700)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [config, performSave])

  // Auto-ocultar mensaje después de 4s
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [saveMessage])

  // Purgar caché manual y recargar
  const handleClearCacheAndReload = async () => {
    setIsClearingCache(true)
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gama_landing_marketing_latest')
        sessionStorage.clear()
      }
      const res = await fetch(`/api/landing-marketing?t=${Date.now()}&nocache=1`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      if (res.ok) {
        const data = await res.json()
        const loaded = data.config || (data.popup ? data : null)
        if (loaded) {
          setConfig(loaded)
          setSaveMessage({
            type: 'success',
            text: '✓ Caché purgada y configuración sincronizada desde Supabase con éxito.',
          })
        }
      }
    } catch (err) {
      console.error('Error purgando caché:', err)
    } finally {
      setIsClearingCache(false)
    }
  }

  // Guardar configuración manual
  const handleSave = () => {
    performSave(config, false)
  }

  // Restablecer por defecto
  const handleResetDefaults = () => {
    if (confirm('¿Deseas restablecer todos los textos y slides a los valores recomendados por defecto?')) {
      setConfig(DEFAULT_LANDING_MARKETING_CONFIG)
      performSave(DEFAULT_LANDING_MARKETING_CONFIG, false)
    }
  }

  // Helpers para slides con guardado inmediato opcional
  const updateSlide = (idx: number, updates: Partial<HeroSlide>, immediateSave = false) => {
    setConfig(prev => {
      const newSlides = [...prev.heroSlides]
      newSlides[idx] = { ...newSlides[idx], ...updates }
      const newConfig = { ...prev, heroSlides: newSlides }
      if (immediateSave) {
        performSave(newConfig, true)
      }
      return newConfig
    })
  }

  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      activo: true,
      orden: config.heroSlides.length + 1,
      badge: 'NUEVA PROMOCIÓN 2026',
      titulo: 'Nuevo Plan de Seguridad Electrónica.',
      tituloHighlight: 'Respaldo total 24/7 para tu propiedad.',
      bajada: 'Cotiza con nuestros especialistas la mejor alternativa tecnológica para tu hogar o empresa.',
      imagenUrl: '/ads/vetti_ad_oficial_master.png',
      btnPrimarioTexto: 'Cotizar por WhatsApp',
      btnPrimarioTipo: 'whatsapp',
      btnPrimarioUrl: 'https://wa.me/56991016912?text=Hola,%20solicito%20m%C3%A1s%20informaci%C3%B3n.',
      btnSecundarioTexto: 'Consultar al Asesor Virtual',
      btnSecundarioTipo: 'chatbot',
    }
    const newConfig = {
      ...config,
      heroSlides: [...config.heroSlides, newSlide],
    }
    setConfig(newConfig)
    setSelectedSlideIndex(config.heroSlides.length)
    performSave(newConfig, true)
  }

  const handleDeleteSlide = (idx: number) => {
    if (config.heroSlides.length <= 1) {
      alert('Debes mantener al menos 1 slide en el Hero.')
      return
    }
    if (confirm('¿Seguro que deseas eliminar este slide?')) {
      const newSlides = config.heroSlides.filter((_, i) => i !== idx)
      const newConfig = {
        ...config,
        heroSlides: newSlides,
      }
      setConfig(newConfig)
      setSelectedSlideIndex(0)
      performSave(newConfig, true)
    }
  }

  const handleMoveSlide = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= config.heroSlides.length) return

    const newSlides = [...config.heroSlides]
    const temp = newSlides[idx]
    newSlides[idx] = newSlides[targetIdx]
    newSlides[targetIdx] = temp
    const newConfig = { ...config, heroSlides: newSlides }
    setConfig(newConfig)
    setSelectedSlideIndex(targetIdx)
    performSave(newConfig, true)
  }

  // Helpers para FAQ Chips
  const handleAddChip = () => {
    const text = prompt('Escribe la pregunta o duda frecuente para el botón rápido:')
    if (text && text.trim()) {
      const newConfig = {
        ...config,
        chatbot: {
          ...config.chatbot,
          chipsIniciales: [...config.chatbot.chipsIniciales, text.trim()],
        },
      }
      setConfig(newConfig)
      performSave(newConfig, true)
    }
  }

  const handleRemoveChip = (chipIdx: number) => {
    const newConfig = {
      ...config,
      chatbot: {
        ...config.chatbot,
        chipsIniciales: config.chatbot.chipsIniciales.filter((_, i) => i !== chipIdx),
      },
    }
    setConfig(newConfig)
    performSave(newConfig, true)
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-white border border-slate-300/80 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Cargando configuración de Landing Marketing en vivo...</p>
      </div>
    )
  }

  const currentSlide = config.heroSlides[selectedSlideIndex] || config.heroSlides[0]

  return (
    <div className="flex-1 bg-white border border-slate-300/80 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm min-h-0 overflow-y-auto font-sans">
      
      {/* ── TOP HEADER CON ACCIONES ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#0B2545] border border-slate-800 text-white p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-amber-400 to-rose-500 rounded-2xl text-slate-950 font-black shadow-md flex items-center justify-center">
            <Sparkles className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black uppercase tracking-wider text-white">
                Landing Marketing
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                En Vivo en www.gamasecurity.cl
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Administración centralizada de Banners Hero, Popup Promocional de ofertas y Chatbot IA de alta conversión.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto">
          {/* Indicador de estado en tiempo real */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-mono">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-amber-300 font-semibold">Guardando en vivo...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">
                  Sincronizado {lastSavedTime ? `(${lastSavedTime})` : ''} · Sin caché
                </span>
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300 font-semibold">Error al guardar</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300">Auto-guardado activo</span>
              </>
            )}
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Ver Landing</span>
            <ExternalLink className="w-3 h-3 text-slate-300" />
          </a>

          <button
            onClick={handleClearCacheAndReload}
            disabled={isClearingCache || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all border border-cyan-800/40 cursor-pointer disabled:opacity-50"
            title="Purgar caché local y del servidor y recargar desde Supabase"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isClearingCache ? 'animate-spin' : ''}`} />
            <span>{isClearingCache ? 'Purgando...' : 'Limpiar Caché'}</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            title="Restablecer sugerencias predeterminadas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Predeterminados</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>


      {/* ── NOTIFICACIÓN DE ESTADO ── */}
      {saveMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* ── SELECTOR DE PESTAÑAS ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('popup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'popup'
              ? 'bg-[#0B2545] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Popup Promocional (Flyer Ofertas)</span>
          {config.popup.activo ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-400 ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'hero'
              ? 'bg-[#0B2545] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Carrusel Hero ({config.heroSlides.length} Banners)</span>
        </button>

        <button
          onClick={() => setActiveTab('chatbot')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'chatbot'
              ? 'bg-[#0B2545] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chatbot Protagonista (IA)</span>
          {config.chatbot.calloutActivo && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-1" />
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PESTAÑA 1: POPUP PROMOCIONAL (FLYER DE OFERTA)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'popup' && (
        <div className="space-y-6">
          {/* Card Principal de Activación */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">Estado del Popup en el Sitio</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    config.popup.activo
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {config.popup.activo ? 'ACTIVO (Se muestra al visitante)' : 'DESACTIVADO'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Aparece automáticamente a los visitantes tras unos segundos con el flyer de la oferta actual y llamados a la acción inmediatos.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalPreviewOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/20 transition-all cursor-pointer active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Modal en Pantalla Completa</span>
              </button>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.popup.activo}
                  onChange={(e) => {
                    const newConfig = {
                      ...config,
                      popup: { ...config.popup, activo: e.target.checked },
                    };
                    setConfig(newConfig);
                    performSave(newConfig, true);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {config.popup.activo ? 'Activado' : 'Desactivado'}
                </span>
              </label>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Formulario de Configuración */}
            <div className="lg:col-span-7 space-y-4">
              {/* Badge y Tiempo de espera */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Etiqueta / Badge Superior
                  </label>
                  <input
                    type="text"
                    value={config.popup.badge}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        popup: { ...prev.popup, badge: e.target.value },
                      }))
                    }
                    placeholder="Ej: OFERTA LIMITADA, PROMO PACK VETTI"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Segundos antes de abrirse
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={config.popup.delaySeconds}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        popup: { ...prev.popup, delaySeconds: parseInt(e.target.value) || 3 },
                      }))
                    }
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Título de la Oferta */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Título de la Oferta
                </label>
                <input
                  type="text"
                  value={config.popup.titulo}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      popup: { ...prev.popup, titulo: e.target.value },
                    }))
                  }
                  placeholder="Ej: 🔥 Promoción Exclusiva Pack VETTI Smart"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Subtítulo / Bajada */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Bajada Persuasiva / Beneficios
                </label>
                <textarea
                  rows={3}
                  value={config.popup.subtitulo}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      popup: { ...prev.popup, subtitulo: e.target.value },
                    }))
                  }
                  placeholder="Explica por qué deben aprovechar la promoción ahora..."
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Imagen del Flyer */}
              <ImageUploadField
                label="Fotografía / Flyer del Pop-up"
                helperText="Sube una foto desde tu PC. Se adaptará automáticamente y se guardará en la carpeta del proyecto."
                value={config.popup.imagenUrl}
                onChange={(url) => {
                  const newConfig = {
                    ...config,
                    popup: { ...config.popup, imagenUrl: url },
                  };
                  setConfig(newConfig);
                  performSave(newConfig, true);
                }}
              />
                {/* Galería de imágenes rápidas */}
                <div className="mt-2.5">
                  <p className="text-[11px] font-bold text-slate-500 mb-1.5">
                    Seleccionar imagen prediseñada disponible en el servidor:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => {
                          const newConfig = {
                            ...config,
                            popup: { ...config.popup, imagenUrl: img.url },
                          };
                          setConfig(newConfig);
                          performSave(newConfig, true);
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          config.popup.imagenUrl === img.url
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>


              {/* Botones de Acción */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Configuración de Botones de Conversión</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Texto Botón WhatsApp Principal
                  </label>
                  <input
                    type="text"
                    value={config.popup.btnWhatsappTexto}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        popup: { ...prev.popup, btnWhatsappTexto: e.target.value },
                      }))
                    }
                    className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Mensaje pre-redactado para WhatsApp
                  </label>
                  <textarea
                    rows={2}
                    value={config.popup.btnWhatsappMensaje}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        popup: { ...prev.popup, btnWhatsappMensaje: e.target.value },
                      }))
                    }
                    className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Texto Botón Asesor Bot Virtual
                  </label>
                  <input
                    type="text"
                    value={config.popup.btnBotTexto}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        popup: { ...prev.popup, btnBotTexto: e.target.value },
                      }))
                    }
                    className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Previsualización en Vivo del Popup */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Eye className="w-3.5 h-3.5" />
                    Vista Previa del Popup
                  </span>
                  <span className="text-[10px] uppercase font-mono">Modo Modal</span>
                </div>

                {/* Contenido Visual */}
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] border border-slate-800 group">
                    <img
                      src={config.popup.imagenUrl}
                      alt="Flyer Promocional"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = '/ads/vetti_ad_oficial_master.png';
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md">
                      {config.popup.badge || 'PROMO'}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white leading-snug">
                      {config.popup.titulo}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                      {config.popup.subtitulo}
                    </p>
                  </div>

                  {/* Botones simulados */}
                  <div className="pt-2 flex flex-col gap-2">
                    <div className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white font-black text-xs text-center shadow-md flex items-center justify-center gap-2">
                      <span>{config.popup.btnWhatsappTexto}</span>
                    </div>
                    <div className="w-full py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs text-center flex items-center justify-center gap-2">
                      <span>{config.popup.btnBotTexto}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalPreviewOpen(true)}
                      className="w-full mt-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Abrir Modal Completo Interactivo</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PESTAÑA 2: CARRUSEL HERO (BANNERS PRINCIPALES)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          {/* Barra superior del Carrusel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Slides Activos del Hero Carrusel ({config.heroSlides.length})
              </h3>
              <p className="text-xs text-slate-500">
                Los slides rotan automáticamente en la cabecera principal de la web.
              </p>
            </div>
            <button
              onClick={handleAddSlide}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Nuevo Slide</span>
            </button>
          </div>

          {/* Selector de Slide en Edición */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {config.heroSlides.map((slide, idx) => (
              <button
                key={slide.id || idx}
                onClick={() => setSelectedSlideIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                  selectedSlideIndex === idx
                    ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Slide #{idx + 1}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    slide.activo ? 'bg-emerald-400' : 'bg-slate-400'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Formulario del Slide Seleccionado */}
          {currentSlide && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                {/* Controles del Slide */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSlide.activo}
                        onChange={(e) =>
                          updateSlide(selectedSlideIndex, { activo: e.target.checked }, true)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-2 text-xs font-bold text-slate-700">
                        {currentSlide.activo ? 'Slide Activo' : 'Pausado'}
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMoveSlide(selectedSlideIndex, 'up')}
                      disabled={selectedSlideIndex === 0}
                      className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Mover a la izquierda / antes"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveSlide(selectedSlideIndex, 'down')}
                      disabled={selectedSlideIndex === config.heroSlides.length - 1}
                      className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Mover a la derecha / después"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(selectedSlideIndex)}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Eliminar este slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Badge & Titulares */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Badge Superior
                  </label>
                  <input
                    type="text"
                    value={currentSlide.badge}
                    onChange={(e) =>
                      updateSlide(selectedSlideIndex, { badge: e.target.value })
                    }
                    placeholder="Ej: OFERTA MES · EQUIPOS 100% PROPIOS"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Título Principal
                  </label>
                  <input
                    type="text"
                    value={currentSlide.titulo}
                    onChange={(e) =>
                      updateSlide(selectedSlideIndex, { titulo: e.target.value })
                    }
                    placeholder="Ej: Pack Alarma Vetti Smart + Monitoreo 24/7."
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Título Destacado (Gradiente Azul/Cian)
                  </label>
                  <input
                    type="text"
                    value={currentSlide.tituloHighlight}
                    onChange={(e) =>
                      updateSlide(selectedSlideIndex, { tituloHighlight: e.target.value })
                    }
                    placeholder="Ej: Instalación $0 y respuesta < 2 min."
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Bajada Explicativa
                  </label>
                  <textarea
                    rows={2}
                    value={currentSlide.bajada}
                    onChange={(e) =>
                      updateSlide(selectedSlideIndex, { bajada: e.target.value })
                    }
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Imagen del Slide */}
                <ImageUploadField
                  label="Fotografía / Banner del Slide"
                  helperText="Sube una foto desde tu PC. Se adaptará automáticamente al carrusel y se guardará en la carpeta del proyecto."
                  value={currentSlide.imagenUrl}
                  onChange={(url) =>
                    updateSlide(selectedSlideIndex, { imagenUrl: url }, true)
                  }
                />

                  {/* Preset Buttons */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() =>
                          updateSlide(selectedSlideIndex, { imagenUrl: img.url }, true)
                        }
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          currentSlide.imagenUrl === img.url

                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>

                {/* Botón Primario */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Botón de Acción Principal (CTA 1)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Texto del Botón
                      </label>
                      <input
                        type="text"
                        value={currentSlide.btnPrimarioTexto}
                        onChange={(e) =>
                          updateSlide(selectedSlideIndex, { btnPrimarioTexto: e.target.value })
                        }
                        className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Tipo de Acción
                      </label>
                      <select
                        value={currentSlide.btnPrimarioTipo}
                        onChange={(e) =>
                          updateSlide(selectedSlideIndex, {
                            btnPrimarioTipo: e.target.value as any,
                          })
                        }
                        className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="whatsapp">WhatsApp Directo</option>
                        <option value="chatbot">Abrir Chatbot IA</option>
                        <option value="link">Enlace / Ancla Web</option>
                      </select>
                    </div>
                  </div>
                  {currentSlide.btnPrimarioTipo !== 'chatbot' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Enlace o URL de WhatsApp
                      </label>
                      <input
                        type="text"
                        value={currentSlide.btnPrimarioUrl || ''}
                        onChange={(e) =>
                          updateSlide(selectedSlideIndex, { btnPrimarioUrl: e.target.value })
                        }
                        placeholder="https://wa.me/56991016912?text=... o #servicios"
                        className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Vista Previa del Slide en el Hero */}
              <div className="lg:col-span-5">
                <div className="bg-[#050d1a] border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <Eye className="w-3.5 h-3.5" />
                      Vista Previa Slide #{selectedSlideIndex + 1}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Hero Section</span>
                  </div>

                  <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-slate-900 border border-slate-800">
                    <img
                      src={currentSlide.imagenUrl}
                      alt="Slide Preview"
                      className="w-full h-full object-cover opacity-60"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = '/ads/vetti_ad_oficial_master.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050d1a] via-[#050d1a]/50 to-transparent p-4 flex flex-col justify-end">
                      <div className="text-[9px] font-black uppercase tracking-wider text-blue-400 mb-1">
                        {currentSlide.badge}
                      </div>
                      <h4 className="text-xs font-black text-white leading-tight">
                        {currentSlide.titulo}{' '}
                        <span className="text-cyan-400">{currentSlide.tituloHighlight}</span>
                      </h4>
                      <p className="text-[10px] text-slate-300 line-clamp-2 mt-1">
                        {currentSlide.bajada}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PESTAÑA 3: CHATBOT PROTAGONISTA (IA DE CONVERSIÓN)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'chatbot' && (
        <div className="space-y-6">
          {/* Card de Activación de Llamada de Atención */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  Burbuja de Llamado Proactivo (Callout Bubble)
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    config.chatbot.calloutActivo
                      ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {config.chatbot.calloutActivo ? 'ACTIVO' : 'PAUSADO'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Muestra un mensaje flotante atractivo junto al avatar del bot para invitar a los visitantes a hacer preguntas sin compromiso.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.chatbot.calloutActivo}
                onChange={(e) => {
                  const newConfig = {
                    ...config,
                    chatbot: { ...config.chatbot, calloutActivo: e.target.checked },
                  };
                  setConfig(newConfig);
                  performSave(newConfig, true);
                }}
                className="sr-only peer"

              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              <span className="ml-2 text-xs font-bold text-slate-700">
                {config.chatbot.calloutActivo ? 'Activado' : 'Desactivado'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Texto del Llamado Proactivo (Burbuja Flotante)
                </label>
                <input
                  type="text"
                  value={config.chatbot.calloutTexto}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      chatbot: { ...prev.chatbot, calloutTexto: e.target.value },
                    }))
                  }
                  placeholder="👋 ¿Dudas con precios o cobertura? Pregúntame al instante."
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Demora antes de aparecer la burbuja (segundos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={config.chatbot.calloutDelaySeconds}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      chatbot: {
                        ...prev.chatbot,
                        calloutDelaySeconds: parseInt(e.target.value) || 4,
                      },
                    }))
                  }
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Botones de Consulta Rápida (FAQ Chips) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Preguntas Rápidas en 1-Clic (FAQ Chips)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Opciones que el visitante puede tocar para recibir una respuesta instantánea sin necesidad de tipear.
                    </p>
                  </div>
                  <button
                    onClick={handleAddChip}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Pregunta</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {config.chatbot.chipsIniciales.map((chip, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                    >
                      <span>{chip}</span>
                      <button
                        onClick={() => handleRemoveChip(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Eliminar pregunta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Vista Previa de la Burbuja del Bot */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Eye className="w-3.5 h-3.5" />
                    Burbuja Flotante en Pantalla
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Esquina Inferior</span>
                </div>

                <div className="flex flex-col items-end gap-3 pt-6">
                  {/* Bubble */}
                  {config.chatbot.calloutActivo && (
                    <div className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl rounded-br-sm shadow-xl max-w-[260px] text-xs font-semibold border border-slate-100 relative">
                      <p>{config.chatbot.calloutTexto}</p>
                      <div className="absolute -bottom-1.5 right-3 w-3 h-3 bg-white rotate-45" />
                    </div>
                  )}

                  {/* Avatar Bot */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 mt-2">
                  <p className="font-bold text-slate-300 mb-1">Impacto psicológico:</p>
                  Elimina el roce del usuario. La gente que no quiere hablar con un ejecutivo prefiere interactuar con un asesor bot inteligente para cotizar precios y ver planes sin presión.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL POP-UP PREVIEW FLOTANTE COMPLETO */}
      {modalPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            onClick={() => setModalPreviewOpen(false)}
            className="fixed inset-0 bg-[#020611]/80 backdrop-blur-md"
          />
          <div className="relative w-full max-w-lg sm:max-w-xl bg-gradient-to-b from-[#0b172c] to-[#070e1b] border border-blue-500/30 rounded-3xl shadow-2xl shadow-blue-950/80 overflow-hidden z-10 p-5 sm:p-7 text-left font-sans animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalPreviewOpen(false)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-600/50 shadow-md active:scale-90"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badge de Promoción */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-bold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>{config.popup.badge || 'OFERTA DESTACADA'}</span>
            </div>

            {/* Imagen del Afiche */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-blue-900/50 bg-[#050d1a] mb-4 group shadow-inner">
              <img
                src={config.popup.imagenUrl || '/ads/vetti_ad_oficial_master.png'}
                alt={config.popup.titulo}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = '/ads/vetti_ad_oficial_master.png';
                }}
              />
            </div>

            {/* Título & Subtítulo */}
            <div className="space-y-1.5 mb-5">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {config.popup.titulo}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {config.popup.subtitulo}
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  const text = encodeURIComponent(
                    config.popup.btnWhatsappMensaje ||
                      'Hola GAMA Seguridad, vi la promoción en la web y deseo cotizar con instalación bonificada.'
                  );
                  window.open(`https://wa.me/56991016912?text=${text}`, '_blank');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
              >
                <PhoneCall className="w-4 h-4 text-emerald-100" />
                <span>{config.popup.btnWhatsappTexto || 'Aprovechar por WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalPreviewOpen(false)}
                className="w-full bg-[#1e40af] hover:bg-[#2563eb] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer border border-blue-400/40"
              >
                <MessageSquare className="w-4 h-4 text-blue-200" />
                <span>{config.popup.btnBotTexto || 'Preguntar al Asesor Bot'}</span>
              </button>
            </div>

            {/* Micro Nota de Confianza */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 mt-4 font-mono text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>GAMA Security · Evaluación Técnica a costo $0 sin compromiso (Vista Previa)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
