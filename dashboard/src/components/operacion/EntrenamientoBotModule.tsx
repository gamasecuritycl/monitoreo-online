'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Bot,
  Package,
  Sparkles,
  HelpCircle,
  Settings,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Send,
  Eye,
  Sliders,
  DollarSign,
  Tag,
  Copy,
  FileText,
  X,
  Phone,
  Check,
  ChevronRight,
  Flame,
  Camera,
  Image as ImageIcon,
  Globe,
  Key,
  Share2,
  Users,
  Download,
  CheckCheck,
  MessageCircle,
  Filter,
  ArrowUpRight,
  Layers
} from 'lucide-react'
import type { PreciosData, PreciosItem, BotConfig, PromocionItem, FAQItem, MetaIntegrationConfig, Lead, LeadMessage } from '@/lib/sales-gama/types'
import { DEFAULT_SALES_PROMPT } from '@/lib/sales-gama/assistant'

export default function EntrenamientoBotModule() {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'promociones' | 'objeciones' | 'prompt' | 'leads' | 'simulador' | 'meta'>('catalogo')
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Datos principales
  const [prompt, setPrompt] = useState<string>(DEFAULT_SALES_PROMPT)
  const [botConfig, setBotConfig] = useState<BotConfig>({
    rateLimit: 100,
    timeoutMin: 30,
    despedida: '¡Gracias por contactar a GAMA Seguridad! Te esperamos.',
    waUrl: 'https://wa.me/56991016912',
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
  })
  const [precios, setPrecios] = useState<PreciosData>({
    version: 2,
    categorias: ['Promociones', 'VETTI (Inalámbrica)', 'DSC (Cableada)', 'Monitoreo 24/7', 'Cámaras CCTV'],
    items: [],
  })
  const [promociones, setPromociones] = useState<PromocionItem[]>([])
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [metaConfig, setMetaConfig] = useState<MetaIntegrationConfig>({
    activo: true,
    verifyToken: 'gama_security_meta_token_2026',
    pageAccessToken: '',
    instagramAccountId: '',
    pageId: '',
    telefonoDerivacion: '56991016912',
    autoResponderInstagram: true,
    autoResponderMessenger: true,
  })
  const [showToken, setShowToken] = useState(false)
  const [testMetaSending, setTestMetaSending] = useState(false)

  // Filtros y búsquedas de Catálogo
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas')
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<'Todas' | 'VETTI' | 'DSC' | 'CCTV'>('Todas')
  const [busquedaFaq, setBusquedaFaq] = useState('')

  // Prospectos Capturados (Leads en Vivo)
  const [leadsList, setLeadsList] = useState<Lead[]>([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [filtroEstadoLead, setFiltroEstadoLead] = useState<string>('todos')
  const [busquedaLead, setBusquedaLead] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [chatMessagesLead, setChatMessagesLead] = useState<LeadMessage[]>([])
  const [loadingChatLead, setLoadingChatLead] = useState(false)

  // Modales CRUD
  const [editingProducto, setEditingProducto] = useState<PreciosItem | null>(null)
  const [isCreatingProducto, setIsCreatingProducto] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromocionItem | null>(null)
  const [isCreatingPromo, setIsCreatingPromo] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null)
  const [isCreatingFaq, setIsCreatingFaq] = useState(false)

  // Simulador de chat
  const [simChatMessages, setSimChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: '¡Hola! 🛡️ Soy Tomás de GAMA Seguridad. ¿En qué podemos proteger tu propiedad hoy? Tenemos sistemas de alarma Vetti Smart, monitoreo 24/7 y cámaras 4K con evaluación en terreno a costo $0 🏡✨',
      time: '10:00'
    }
  ])
  const [simInput, setSimInput] = useState('')
  const [simLoading, setSimLoading] = useState(false)

  const notify = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4000)
  }

  // Cargar datos desde la API unificada de entrenamiento
  const loadTrainingData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sales-gama/entrenamiento')
      if (res.ok) {
        const data = await res.json()
        if (data.prompt) setPrompt(data.prompt)
        if (data.config) setBotConfig(prev => ({ ...prev, ...data.config }))
        if (data.precios?.items) setPrecios(data.precios)
        if (data.promociones) setPromociones(data.promociones)
        if (data.faqs) setFaqs(data.faqs)
        if (data.meta_integration) setMetaConfig(prev => ({ ...prev, ...data.meta_integration }))
      } else {
        notify('error', 'No se pudieron cargar todos los datos de entrenamiento.')
      }
    } catch (e: any) {
      notify('error', 'Error conectando con el servidor de entrenamiento.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrainingData()
  }, [loadTrainingData])

  // Guardar todo en Supabase
  const handleGuardarTodo = async () => {
    setGuardando(true)
    try {
      const res = await fetch('/api/sales-gama/entrenamiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          config: botConfig,
          precios,
          promociones,
          faqs,
          meta_integration: metaConfig,
        })
      })

      if (res.ok) {
        notify('success', '✅ ¡Entrenamiento del Bot publicado y sincronizado exitosamente!')
      } else {
        notify('error', 'Error al guardar cambios en Supabase.')
      }
    } catch (e: any) {
      notify('error', 'Error de red al guardar entrenamiento.')
    } finally {
      setGuardando(false)
    }
  }


  // Subida de imagen para promociones
  const handleSubirImagenPromo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/sales-gama/upload-promo', {
        method: 'POST',
        body: fd
      })

      if (res.ok) {
        const data = await res.json()
        if (editingPromo) {
          setEditingPromo({ ...editingPromo, imagen_url: data.url })
        }
        notify('success', '¡Imagen promocional subida exitosamente!')
      } else {
        notify('error', 'Error al subir imagen.')
      }
    } catch {
      notify('error', 'Fallo al enviar imagen al servidor.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Carga y sincronización de prospectos (Leads)
  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true)
    try {
      const res = await fetch('/api/sales-gama/leads?limit=100')
      if (res.ok) {
        const data = await res.json()
        setLeadsList(data.items || [])
      }
    } catch {
      notify('error', 'Error al cargar prospectos.')
    } finally {
      setLoadingLeads(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'leads') {
      fetchLeads()
    }
  }, [activeTab, fetchLeads])

  const handleOpenChatLead = async (lead: Lead) => {
    setSelectedLead(lead)
    setLoadingChatLead(true)
    try {
      const res = await fetch(`/api/sales-gama/leads/${lead.id}`)
      if (res.ok) {
        const data = await res.json()
        setChatMessagesLead(data.messages || [])
      } else {
        notify('error', 'Error al obtener conversación')
      }
    } catch {
      notify('error', 'Fallo de red al cargar conversación')
    } finally {
      setLoadingChatLead(false)
    }
  }

  const handleChangeStatusLead = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/sales-gama/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus })
      })
      if (res.ok) {
        setLeadsList(prev => prev.map(l => l.id === leadId ? { ...l, estado: newStatus as any } : l))
        if (selectedLead?.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, estado: newStatus as any } : null)
        }
        notify('success', `Estado actualizado a "${newStatus}"`)
      }
    } catch {
      notify('error', 'No se pudo actualizar estado del prospecto')
    }
  }

  const handleExportLeadsCSV = () => {
    if (leadsList.length === 0) {
      notify('error', 'No hay prospectos para exportar')
      return
    }
    const headers = ['Fecha', 'Nombre', 'Teléfono', 'Email', 'Comuna', 'Dirección', 'Estado', 'Resumen']
    const rows = leadsList.map(l => [
      new Date(l.created_at).toLocaleString('es-CL'),
      `"${(l.nombre || 'Anónimo').replace(/"/g, '""')}"`,
      `"${(l.telefono || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.comuna || '').replace(/"/g, '""')}"`,
      `"${(l.direccion || '').replace(/"/g, '""')}"`,
      l.estado,
      `"${(l.resumen || '').replace(/"/g, '""')}"`,
    ])
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `leads_bot_gama_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    notify('success', 'Archivo CSV de prospectos descargado.')
  }

  // Filtrado de productos por Categoría, Marca (VETTI / DSC) y Búsqueda
  const productosFiltrados = useMemo(() => {
    return precios.items.filter(item => {
      const matchCat = categoriaSeleccionada === 'Todas' || item.categoria === categoriaSeleccionada
      const q = busquedaProducto.toLowerCase()
      const matchSearch = !q || item.nombre.toLowerCase().includes(q) || item.descripcion.toLowerCase().includes(q)
      
      const itemMarca = (item.marca || '').toUpperCase()
      const itemNombre = item.nombre.toLowerCase()
      const matchMarca = marcaSeleccionada === 'Todas' || 
        itemMarca === marcaSeleccionada ||
        (marcaSeleccionada === 'VETTI' && (itemMarca.includes('VETTI') || itemNombre.includes('vetti'))) ||
        (marcaSeleccionada === 'DSC' && (itemMarca.includes('DSC') || itemNombre.includes('dsc'))) ||
        (marcaSeleccionada === 'CCTV' && (itemMarca.includes('CCTV') || item.categoria.toLowerCase().includes('cámara') || itemNombre.includes('cámara')))
      
      return matchCat && matchSearch && matchMarca
    })
  }, [precios.items, categoriaSeleccionada, busquedaProducto, marcaSeleccionada])

  // Simulador de chat interactivo
  const handleEnviarSimulador = async (mensajeDirecto?: string) => {
    const query = (mensajeDirecto || simInput).trim()
    if (!query || simLoading) return

    const userTime = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const newHistory = [...simChatMessages, { role: 'user' as const, text: query, time: userTime }]
    setSimChatMessages(newHistory)
    setSimInput('')
    setSimLoading(true)

    try {
      const res = await fetch('/api/sales-gama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'simulador-test-' + Date.now(),
          message: query,
          history: newHistory.map(m => ({ role: m.role, content: m.text }))
        })
      })

      if (res.ok) {
        const data = await res.json()
        const botText = data.reply || data.content || 'Entendido. Estoy procesando tu solicitud con Inteligencia Comercial GAMA.'
        const botTime = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        setSimChatMessages(prev => [...prev, { role: 'assistant', text: botText, time: botTime }])
      } else {
        // Fallback interactivo
        setSimChatMessages(prev => [...prev, {
          role: 'assistant',
          text: `¡Hola! Con gusto te oriento sobre ${query}. En GAMA los equipos son 100% de tu propiedad y el monitoreo profesional 24/7 parte desde 0,9 UF + IVA mensual (~$35.000). ¿En qué comuna se encuentra tu propiedad para coordinar la evaluación técnica gratuita ($0)? 🛡️🏡`,
          time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        }])
      }
    } catch {
      setSimChatMessages(prev => [...prev, {
        role: 'assistant',
        text: '¡Por supuesto! Para proteger tu propiedad contamos con alarma VETTI Smart inalámbrica y cámaras 4K Ultra HD. La evaluación técnica en terreno es 100% gratuita ($0). ¿En qué comuna te ubicas? 📲✨',
        time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setSimLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-[#050d1a] text-slate-100 flex flex-col gap-6 p-4 sm:p-6 lg:p-8 min-h-screen">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all animate-in slide-in-from-top-4 ${
          notification.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header Banner Ejecutivo */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1d3a] via-[#102a54] to-[#071329] border border-blue-900/50 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                WHATSAPP SALES BOT • MOTOR CLOUD 24/7 ACTIVO
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-300">
                v5.3 Enterprise
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Bot className="w-9 h-9 text-blue-400" />
              <span>Plataforma de Entrenamiento <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">Bot de Ventas</span></span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Administra en tiempo real los productos, precios en UF/CLP, promociones visuales con imágenes, manejo de objeciones letales contra Verisure/ADT y el prompt de persuasión comercial de GAMA Seguridad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <a
              href="https://gama-ventas-bot.onrender.com"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all hover:text-white"
            >
              <span>📲 Consola Render Bot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={handleGuardarTodo}
              disabled={guardando}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-900/50 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              <span>{guardando ? 'Guardando en la Nube...' : 'Publicar y Sincronizar Cambios'}</span>
            </button>
          </div>
        </div>

        {/* Mini KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-blue-900/40">
          <div className="bg-slate-950/40 border border-blue-900/30 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Catálogo Activo</span>
            <span className="text-lg font-bold text-white">{precios.items.length} Productos</span>
          </div>
          <div className="bg-slate-950/40 border border-blue-900/30 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Promociones Vigentes</span>
            <span className="text-lg font-bold text-amber-400">{promociones.filter(p => p.activa).length} con Imágenes</span>
          </div>
          <div className="bg-slate-950/40 border border-blue-900/30 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Base de Objeciones</span>
            <span className="text-lg font-bold text-blue-300">{faqs.length} Argumentarios</span>
          </div>
          <div className="bg-slate-950/40 border border-blue-900/30 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Teléfono Derivación</span>
            <span className="text-lg font-bold text-emerald-400">+56 9 9101 6912</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-[#09152a] border border-blue-900/40 rounded-2xl overflow-x-auto shadow-inner">
        <button
          onClick={() => setActiveTab('catalogo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'catalogo'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>📦 Catálogo & Precios ({precios.items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('promociones')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'promociones'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>🎁 Promociones & Imágenes ({promociones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('objeciones')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'objeciones'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>🧠 Objeciones & FAQs ({faqs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'prompt'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>⚙️ Personalidad & Prompt</span>
        </button>

        <button
          onClick={() => setActiveTab('simulador')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'simulador'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-emerald-400 hover:text-emerald-200 hover:bg-slate-800/40'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>💬 Simulador de WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'leads'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-orange-950'
              : 'text-amber-400 hover:text-amber-200 hover:bg-slate-800/40'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-300" />
          <span>🔥 Prospectos en Vivo ({leadsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('meta')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'meta'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-950'
              : 'text-purple-300 hover:text-purple-100 hover:bg-slate-800/40'
          }`}
        >
          <Share2 className="w-4 h-4 text-pink-400" />
          <span>🌐 Instagram & Messenger</span>
        </button>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          TAB 1: CATÁLOGO DE PRODUCTOS & TABLAS OFICIALES DE VALORES
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'catalogo' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* BANNER REGLA INFLEXIBLE: HARDWARE EN CLP, UF SOLO MONITOREO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center gap-3.5 shadow-lg">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs space-y-1">
              <span className="font-extrabold text-amber-200 uppercase tracking-wide block">
                🛡️ REGLA COMERCIAL DE VALORES PARA EL BOT DE VENTAS (PROHIBIDO COTIZAR HARDWARE EN UF)
              </span>
              <p className="text-slate-300 leading-relaxed">
                Los sensores y accesorios se cotizan <strong>SIEMPRE en pesos chilenos (CLP)</strong> con pago único. El valor en <strong>UF</strong> está estrictamente reservado para la mensualidad del servicio de monitoreo 24/7 (desde <strong>0,9 UF + IVA/mes</strong>, ~$35.000 CLP). Cuando un cliente te consulte por distribución de su propiedad (ej. 3 dormitorios y 2 accesos), calcula los accesorios adicionales multiplicando su valor en CLP y suma la mensualidad en UF.
              </p>
            </div>
          </div>

          {/* TABLAS COMPARATIVAS DE VALORES OFICIALES: VETTI vs DSC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* TABLA 1: VETTI SMART INALÁMBRICA */}
            <div className="bg-[#09152a] border border-blue-800/60 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black text-xs">
                      VETTI
                    </span>
                    <div>
                      <h3 className="text-base font-black text-white">Tabla Oficial VETTI Smart</h3>
                      <span className="text-[11px] text-blue-300 font-medium">Inalámbrica de Alta Gama · App NT CLICK</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Propiedad 100% Cliente
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">Pack Base VETTI Smart (Kit Inicial)</strong>
                      <span className="text-[11px] text-slate-400">1 Hub WiFi/4G + 1 PIR + 1 Magnético + 2 Controles + Sirena</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-400 block">$0 Instalación</span>
                      <span className="text-[10px] text-slate-400">Plan 0,9 UF + IVA/mes</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <span className="text-slate-200 font-semibold block">Sensor Movimiento PIR Antimascotas Vetti</span>
                      <span className="text-[10px] text-slate-400">Inalámbrico adicional (dormitorio, living, pasillo)</span>
                    </div>
                    <span className="font-mono font-black text-white text-sm bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/50">
                      $24.900 CLP <span className="text-[10px] text-slate-400 font-normal">+ IVA</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <span className="text-slate-200 font-semibold block">Contacto Magnético Puerta/Ventana Vetti</span>
                      <span className="text-[10px] text-slate-400">Inalámbrico adicional (puerta acceso, cocina, terraza)</span>
                    </div>
                    <span className="font-mono font-black text-white text-sm bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/50">
                      $19.900 CLP <span className="text-[10px] text-slate-400 font-normal">+ IVA</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <span className="text-slate-200 font-semibold block">Control Remoto 4 Botones con Botón SOS Vetti</span>
                      <span className="text-[10px] text-slate-400">Llavero adicional con botón de pánico de emergencia</span>
                    </div>
                    <span className="font-mono font-black text-white text-sm bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/50">
                      $14.900 CLP <span className="text-[10px] text-slate-400 font-normal">+ IVA</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <span className="text-slate-200 font-semibold block">Sirena Exterior Baliza Estroboscópica Vetti</span>
                      <span className="text-[10px] text-slate-400">110 dB disuasiva con luz destellante roja IP65</span>
                    </div>
                    <span className="font-mono font-black text-white text-sm bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/50">
                      $29.900 CLP <span className="text-[10px] text-slate-400 font-normal">+ IVA</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-blue-900/40 flex justify-between items-center text-[11px] text-slate-400">
                <span>🛡️ Protocolo Vetti 433 MHz cifrado</span>
                <button
                  onClick={() => { setMarcaSeleccionada('VETTI'); setCategoriaSeleccionada('Todas'); }}
                  className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline"
                >
                  Filtrar productos VETTI →
                </button>
              </div>
            </div>

            {/* TABLA 2: DSC POWERSERIES CABLEADA / MIGRACIÓN ADT */}
            <div className="bg-[#09152a] border border-purple-800/60 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 font-black text-xs">
                      DSC
                    </span>
                    <div>
                      <h3 className="text-base font-black text-white">Tabla Oficial DSC (PowerSeries)</h3>
                      <span className="text-[11px] text-purple-300 font-medium">Cableada Comercial / Híbrida · Migración ADT</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Ahorro &gt; $350.000/año
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <strong className="text-white block">Reprogramación y Migración Panel ADT a Central GAMA</strong>
                      <span className="text-[11px] text-slate-400">Costo $0 de cambio conservando todos tus sensores existentes</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-400 block">$0 Costo Técnico</span>
                      <span className="text-[10px] text-slate-400">Monitoreo 0,9 UF + IVA/mes</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <span className="text-slate-200 font-semibold block">Kit Central DSC PC1832 Cableada</span>
                      <span className="text-[10px] text-slate-400">Gabinete + placa 8-32 zonas + teclado LED + batería + transformador</span>
                    </div>
                    <span className="font-mono font-black text-white text-sm bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800/50">
                      $189.900 CLP <span className="text-[10px] text-slate-400 font-normal">+ IVA</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <span className="text-slate-200 font-semibold block">Sensor de Movimiento PIR DSC Cableado</span>
                      <span className="text-[10px] text-slate-400">Pago único por sensor adicional · Antimascotas 25 kg</span>
                    </div>
                    <span className="font-mono font-black text-white text-sm bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800/50">
                      $22.900 CLP <span className="text-[10px] text-slate-400 font-normal">+ IVA</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <span className="text-slate-200 font-semibold block">Contacto Magnético Cableado DSC</span>
                      <span className="text-[10px] text-slate-400">Pago único por contacto adicional · Embutido o sobrepuesto</span>
                    </div>
                    <span className="font-mono font-black text-white text-sm bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800/50">
                      $10.900 CLP <span className="text-[10px] text-slate-400 font-normal">+ IVA</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <span className="text-slate-200 font-semibold block">Comunicador 4G Universal para Panel DSC</span>
                      <span className="text-[10px] text-slate-400">Pago único · Transmisor celular multi-operador 24/7</span>
                    </div>
                    <span className="font-mono font-black text-white text-sm bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800/50">
                      $109.900 CLP <span className="text-[10px] text-slate-400 font-normal">+ IVA</span>
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex justify-between items-center">
                    <div>
                      <span className="text-slate-200 font-semibold block">Teclado LED DSC Adicional</span>
                      <span className="text-[10px] text-slate-400">Pago único · Teclado numérico LED adicional para panel DSC</span>
                    </div>
                    <span className="font-mono font-black text-white text-sm bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800/50">
                      $74.900 CLP <span className="text-[10px] text-slate-400 font-normal">+ IVA</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-purple-900/40 flex justify-between items-center text-[11px] text-slate-400">
                <span>🛡️ Grado 2 Industrial DSC PowerSeries</span>
                <button
                  onClick={() => { setMarcaSeleccionada('DSC'); setCategoriaSeleccionada('Todas'); }}
                  className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
                >
                  Filtrar productos DSC →
                </button>
              </div>
            </div>
          </div>

          {/* Barra de control y filtros del Catálogo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#09152a] p-4 rounded-2xl border border-blue-900/40">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, alarma, cámara, sensor..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Selector de Marca Rápido */}
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                {(['Todas', 'VETTI', 'DSC', 'CCTV'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMarcaSeleccionada(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      marcaSeleccionada === m
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m === 'Todas' ? 'Todas' : m === 'VETTI' ? '🏷️ VETTI' : m === 'DSC' ? '🛡️ DSC' : '📹 CCTV'}
                  </button>
                ))}
              </div>

              {/* Selector de categoría */}
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {['Todas', ...precios.categorias].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSeleccionada(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      categoriaSeleccionada === cat
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setEditingProducto({
                  id: 'prod-' + Date.now(),
                  nombre: '',
                  descripcion: '',
                  precio: 24900,
                  precio_uf: '',
                  categoria: 'VETTI (Inalámbrica)',
                  marca: 'VETTI',
                  palabras_clave: [],
                  incluye: [],
                  no_incluye: [],
                  faq: []
                })
                setIsCreatingProducto(true)
              }}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Nuevo Producto</span>
            </button>
          </div>

          {/* Grid de Productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {productosFiltrados.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#09152a] border border-blue-900/40 p-5 flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-xl group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/50 uppercase tracking-wider">
                        {item.categoria}
                      </span>
                      {item.marca && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono border ${
                          item.marca === 'VETTI' ? 'bg-sky-500/15 border-sky-500/40 text-sky-300' :
                          item.marca === 'DSC' ? 'bg-purple-500/15 border-purple-500/40 text-purple-300' :
                          'bg-slate-800 border-slate-700 text-slate-300'
                        }`}>
                          {item.marca}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingProducto(item)
                          setIsCreatingProducto(false)
                        }}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Editar producto"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar el producto "${item.nombre}"?`)) {
                            setPrecios(prev => ({ ...prev, items: prev.items.filter(p => p.id !== item.id) }))
                            notify('success', `Producto "${item.nombre}" eliminado. Recuerda publicar cambios.`)
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                      {item.nombre}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.descripcion}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Precio CLP:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {item.precio > 0 ? `$${item.precio.toLocaleString('es-CL')} CLP` : '$0 (Bonificado)'}
                      </span>
                    </div>
                    {item.precio_uf && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400">Valor UF / Plan:</span>
                        <span className="font-bold text-emerald-400">{item.precio_uf}</span>
                      </div>
                    )}
                  </div>

                  {item.incluye && item.incluye.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Incluye:</span>
                      <ul className="text-[11px] text-slate-300 space-y-0.5">
                        {item.incluye.slice(0, 3).map((inc, i) => (
                          <li key={i} className="flex items-center gap-1.5 truncate">
                            <Check className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            <span className="truncate">{inc}</span>
                          </li>
                        ))}
                        {item.incluye.length > 3 && (
                          <li className="text-[10px] text-slate-500 font-medium">
                            +{item.incluye.length - 3} elementos adicionales
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Activo en Bot</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">{item.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PROMOCIONES & SUBIDA DE IMÁGENES
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'promociones' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#09152a] p-4 rounded-2xl border border-blue-900/40">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Campañas & Afiches Comerciales para WhatsApp</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sube imágenes publicitarias y el bot las enviará a clientes cuando pregunten por promociones.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingPromo({
                  id: 'promo-' + Date.now(),
                  titulo: '',
                  subtitulo: '',
                  beneficio: '',
                  descuento: '',
                  vigencia_desde: new Date().toISOString().split('T')[0],
                  vigencia_hasta: '2026-12-31',
                  imagen_url: '',
                  mensaje_whatsapp: '',
                  activa: true,
                  destacada: false,
                })
                setIsCreatingPromo(true)
              }}
              className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nueva Promoción</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promociones.map((promo) => (
              <div
                key={promo.id}
                className="rounded-3xl bg-[#09152a] border border-blue-900/40 overflow-hidden shadow-2xl flex flex-col justify-between hover:border-amber-500/50 transition-all group"
              >
                {/* Imagen del Afiche */}
                <div className="relative w-full h-48 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-blue-900/30">
                  {promo.imagen_url ? (
                    <img
                      src={promo.imagen_url}
                      alt={promo.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <ImageIcon className="w-10 h-10" />
                      <span className="text-xs">Sin imagen promocional</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      promo.activa ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {promo.activa ? 'En Campaña' : 'Pausada'}
                    </span>
                    {promo.destacada && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Destacada
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingPromo(promo)
                        setIsCreatingPromo(false)
                      }}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-amber-600 text-slate-200 hover:text-white transition-colors backdrop-blur-sm cursor-pointer"
                      title="Editar promoción"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la promoción "${promo.titulo}"?`)) {
                          setPromociones(prev => prev.filter(p => p.id !== promo.id))
                          notify('success', 'Promoción eliminada.')
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors backdrop-blur-sm cursor-pointer"
                      title="Eliminar promoción"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {promo.titulo}
                    </h3>
                    <p className="text-xs text-amber-300/90 font-medium">
                      🎯 {promo.beneficio}
                    </p>
                    {promo.mensaje_whatsapp && (
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 italic">
                        "{promo.mensaje_whatsapp.slice(0, 110)}..."
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Vigencia: {promo.vigencia_hasta || 'Indefinida'}</span>
                    <button
                      onClick={() => {
                        setPromociones(prev => prev.map(p => p.id === promo.id ? { ...p, activa: !p.activa } : p))
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      {promo.activa ? 'Pausar' : 'Activar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: OBJECIONES & FAQS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'objeciones' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#09152a] p-4 rounded-2xl border border-blue-900/40">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <span>Base de Objeciones & Argumentarios de Venta</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Respuestas estandarizadas y demoledoras para cuando los clientes comparan con Verisure o preguntan por detalles técnicos.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingFaq({
                  id: 'faq-' + Date.now(),
                  categoria: 'objeciones',
                  pregunta: '',
                  respuesta: '',
                  palabras_clave: [],
                  activa: true,
                })
                setIsCreatingFaq(true)
              }}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Nueva Objeción / FAQ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-2xl bg-[#09152a] border border-blue-900/40 p-5 space-y-3 hover:border-blue-500/50 transition-all shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/40 uppercase">
                    {faq.categoria}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingFaq(faq)
                        setIsCreatingFaq(false)
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar este argumentario?')) {
                          setFaqs(prev => prev.filter(f => f.id !== faq.id))
                          notify('success', 'Objeción eliminada.')
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-blue-400">❓</span>
                    <span>{faq.pregunta}</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    💡 {faq.respuesta}
                  </p>
                </div>

                {faq.palabras_clave && faq.palabras_clave.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {faq.palabras_clave.map((kw, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: PERSONALIDAD & PROMPT MAESTRO
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'prompt' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#09152a] rounded-2xl p-5 border border-blue-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-400" />
                    <span>Prompt del Sistema (Instrucciones Cognitivas)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define las reglas comerciales, límites de precios, tono chileno empático y derivación forzada.
                  </p>
                </div>

                <button
                  onClick={() => setPrompt(DEFAULT_SALES_PROMPT)}
                  className="text-xs text-slate-400 hover:text-blue-300 underline cursor-pointer"
                >
                  Restaurar Original GAMA
                </button>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={18}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed shadow-inner"
              />
            </div>
          </div>

          {/* Parámetros del Asistente */}
          <div className="space-y-4">
            <div className="bg-[#09152a] rounded-2xl p-5 border border-blue-900/40 space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-blue-900/40 pb-3">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Parámetros de IA & Derivación</span>
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Teléfono de Derivación VIP
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={botConfig.waUrl.replace('https://wa.me/', '')}
                    onChange={(e) => setBotConfig({ ...botConfig, waUrl: `https://wa.me/${e.target.value.replace(/\D/g, '')}` })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                  />
                </div>
                <span className="text-[10px] text-slate-500">Aquí se envían las alertas cuando un cliente califica.</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Temperatura Cognitiva</span>
                  <span className="text-blue-400">{botConfig.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={botConfig.temperature}
                  onChange={(e) => setBotConfig({ ...botConfig, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500"
                />
                <span className="text-[10px] text-slate-500">0 = Precisión estricta / 1 = Mayor creatividad persuasiva.</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Modelo Generativo
                </label>
                <select
                  value={botConfig.model || 'gemini-1.5-flash'}
                  onChange={(e) => setBotConfig({ ...botConfig, model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra Rápido - 1s)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Razonamiento Complejo)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-blue-900/40">
                <button
                  onClick={handleGuardarTodo}
                  disabled={guardando}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-950"
                >
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: SIMULADOR DE WHATSAPP EN VIVO
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'simulador' && (
        <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto w-full animate-in fade-in duration-200">
          
          {/* Marco de Teléfono WhatsApp */}
          <div className="w-full max-w-md mx-auto bg-[#0b141a] rounded-[36px] border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[650px]">
            {/* Header WhatsApp */}
            <div className="bg-[#202c33] p-4 flex items-center justify-between border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow">
                  🛡️
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 leading-tight">GAMA Ventas Bot</h4>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    en línea 24/7
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSimChatMessages([])}
                className="text-xs text-slate-400 hover:text-white p-1"
                title="Limpiar chat"
              >
                Limpiar
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a] bg-opacity-95">
              {simChatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-md ${
                      msg.role === 'user'
                        ? 'bg-[#005c4b] text-white rounded-tr-none'
                        : 'bg-[#202c33] text-slate-200 rounded-tl-none border border-slate-700/40'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="text-[9px] text-slate-400 block text-right mt-1 font-mono">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              {simLoading && (
                <div className="flex items-center gap-2 p-3 bg-[#202c33] rounded-2xl rounded-tl-none max-w-[140px] text-xs text-slate-400 border border-slate-700/40">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                  <span>Escribiendo...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#202c33] border-t border-slate-700/50 flex items-center gap-2">
              <input
                type="text"
                placeholder="Escribe como un cliente..."
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnviarSimulador()}
                className="flex-1 bg-[#2a3942] border-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => handleEnviarSimulador()}
                disabled={!simInput.trim() || simLoading}
                className="p-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Test Scenarios */}
          <div className="flex-1 bg-[#09152a] p-6 rounded-3xl border border-blue-900/40 space-y-4 self-start">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Pruebas Rápidas de Estrés Comercial</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Haz clic en cualquiera de estos mensajes típicos para ver cómo responde el bot entrenado:
            </p>

            <div className="space-y-2">
              {[
                'Hola, quiero saber precios de alarmas para una casa en Viña del Mar',
                '¿Tienen cámaras de seguridad para mi negocio?',
                'Tengo Verisure y me cobran $80.000, ¿por qué debería cambiarme con ustedes?',
                '¿Qué pasa si cortan la luz en la noche?',
                'Tengo 2 perros en el patio, ¿se activará la alarma sola?',
                '¿La visita técnica tiene algún costo?',
                '¿Tienen alguna promoción o descuento vigente?'
              ].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEnviarSimulador(pill)}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 hover:border-blue-500/50 text-xs text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span>"{pill}"</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: CONEXIÓN REDES SOCIALES (INSTAGRAM DM & FACEBOOK MESSENGER)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'meta' && (
        <div className="space-y-6">
          {/* Card Principal: Estado y Conexión Directa */}
          <div className="bg-gradient-to-br from-[#0c1933] via-[#0f2144] to-[#120f2e] border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 blur-[130px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-purple-500/20">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-xs font-bold text-pink-300">
                    <Share2 className="w-3.5 h-3.5" />
                    META GRAPH API v21.0 · CONEXIÓN OFICIAL
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    metaConfig.activo
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {metaConfig.activo ? '● BOT ACTIVO EN META' : '○ BOT PAUSADO'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Vende en Automático por Instagram Direct y Facebook Messenger
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Conecta el mismo cerebro con IA de GAMA Seguridad para responder consultas de cotización, promociones de kits Vetti y alarmas 24/7 en los chats de tus redes sociales, con derivación directa a WhatsApp (+56 9 9101 6912).
                </p>
              </div>

              {/* Switch de Activación General */}
              <div className="flex items-center gap-3 bg-slate-950/60 border border-purple-500/30 rounded-2xl p-3 shrink-0">
                <span className="text-xs font-semibold text-slate-300">Respuesta Automática</span>
                <button
                  type="button"
                  onClick={() => setMetaConfig(prev => ({ ...prev, activo: !prev.activo }))}
                  className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
                    metaConfig.activo ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-slate-700'
                  }`}
                  aria-label="Alternar estado del bot en Meta"
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                      metaConfig.activo ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Parámetros Técnicos de Handshake con Meta */}
            <div className="grid md:grid-cols-2 gap-5 pt-6">
              {/* URL de Webhook */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-pink-400" />
                    <span>URL del Webhook (Callback URL)</span>
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://www.gamasecurity.cl/api/webhooks/meta')
                      notify('success', 'URL del Webhook copiada al portapapeles.')
                    }}
                    className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar URL</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-200 bg-slate-900/90 border border-slate-700/60 p-3 rounded-xl break-all select-all">
                  https://www.gamasecurity.cl/api/webhooks/meta
                </div>
                <p className="text-[11px] text-slate-400">
                  Pega esta URL exacta en el campo <strong>Callback URL</strong> de la consola de Meta Developers.
                </p>
              </div>

              {/* Verify Token */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-purple-400" />
                    <span>Token de Verificación (Verify Token)</span>
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(metaConfig.verifyToken)
                      notify('success', 'Verify Token copiado al portapapeles.')
                    }}
                    className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Token</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={metaConfig.verifyToken}
                  onChange={(e) => setMetaConfig(prev => ({ ...prev, verifyToken: e.target.value }))}
                  placeholder="gama_security_meta_token_2026"
                  className="w-full bg-slate-900/90 border border-slate-700/60 p-3 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-400"
                />
                <p className="text-[11px] text-slate-400">
                  Pega este mismo token en el campo <strong>Verify Token</strong> de Meta para validar el webhook.
                </p>
              </div>
            </div>

            {/* Credenciales de Envío: Page Access Token */}
            <div className="mt-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-blue-400" />
                    <span>Token de Acceso de Página (Page Access Token)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showToken ? 'Ocultar Token' : 'Mostrar Token'}</span>
                  </button>
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={metaConfig.pageAccessToken}
                  onChange={(e) => setMetaConfig(prev => ({ ...prev, pageAccessToken: e.target.value }))}
                  placeholder="EAA... (Pega el token generado en Meta Developers para enviar respuestas)"
                  className="w-full bg-slate-900/90 border border-slate-700/60 p-3 rounded-xl font-mono text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Este token le da permiso al bot para escribir en el chat del cliente. Se obtiene en la sección <em>Messenger &gt; Configuración de API &gt; Generar token</em>.
                </p>
              </div>

              {/* Toggles por Canal */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-pink-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={metaConfig.autoResponderInstagram}
                    onChange={(e) => setMetaConfig(prev => ({ ...prev, autoResponderInstagram: e.target.checked }))}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white block">📸 Instagram Direct (DM)</span>
                    <span className="text-[11px] text-slate-400">Responder mensajes directos y menciones en historias</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-blue-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={metaConfig.autoResponderMessenger}
                    onChange={(e) => setMetaConfig(prev => ({ ...prev, autoResponderMessenger: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white block">💬 Facebook Messenger</span>
                    <span className="text-[11px] text-slate-400">Responder mensajes recibidos en la Fanpage</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Botón de Guardado y Prueba de Handshake */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-6 border-t border-purple-500/20">
              <button
                type="button"
                onClick={async () => {
                  setTestMetaSending(true)
                  try {
                    const testUrl = `/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(metaConfig.verifyToken)}&hub.challenge=gama_meta_test_ok_123`
                    const res = await fetch(testUrl)
                    const text = await res.text()
                    if (res.ok && text.includes('gama_meta_test_ok_123')) {
                      notify('success', '🎉 ¡Handshake con Meta verificado correctamente!')
                    } else {
                      notify('error', 'Token de verificación no coincidió.')
                    }
                  } catch {
                    notify('error', 'Error al probar endpoint de Meta.')
                  } finally {
                    setTestMetaSending(false)
                  }
                }}
                disabled={testMetaSending}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-xs font-semibold text-purple-200 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {testMetaSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>🧪 Probar Handshake del Webhook</span>}
              </button>

              <button
                type="button"
                onClick={handleGuardarTodo}
                disabled={guardando}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-950 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Guardar Configuración de Redes Sociales</span>
              </button>
            </div>
          </div>

          {/* Guía Paso a Paso */}
          <div className="bg-[#09152a] border border-blue-900/40 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📋 Guía de Conexión en Meta for Developers</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Sigue estos 4 pasos rápidos para dejar el bot operando en tu cuenta de Instagram y Facebook.
                </p>
              </div>

              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Ir a Meta Developers</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h5 className="font-bold text-white text-xs">Vincular Cuentas</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  En <strong>Meta Business Suite</strong>, asegúrate de que tu cuenta de Instagram Empresa esté vinculada con la Página de Facebook de Gama Seguridad.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h5 className="font-bold text-white text-xs">Activar Permiso en Instagram</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  En la app de Instagram de tu celular: <em>Configuración &gt; Mensajes y respuestas &gt; Herramientas para mensajes &gt;</em> Activa <strong>"Permitir acceso a los mensajes"</strong>.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h5 className="font-bold text-white text-xs">Configurar Webhook</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  En tu app de Meta Developers, ve a <strong>Webhooks &gt; Messenger/Instagram</strong>, pega la URL y el Token de arriba y suscríbete al campo <code>messages</code>.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h5 className="font-bold text-white text-xs">Pegar Page Access Token</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Genera el token de acceso para la página en Meta Developers y pégalo en el campo superior de esta pantalla. ¡El bot comenzará a responder automáticamente!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 7: PROSPECTOS EN VIVO (LEADS DE WHATSAPP, META & WEB)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'leads' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header con estadísticas */}
          <div className="bg-[#09152a] p-5 sm:p-6 rounded-3xl border border-blue-900/40 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">RADAR DE OPORTUNIDADES SALES-GAMA</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Prospectos Capturados en Vivo</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Contactos comerciales filtrados automáticamente por el bot desde WhatsApp, Instagram y la Web.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={fetchLeads}
                disabled={loadingLeads}
                className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
              <button
                onClick={handleExportLeadsCSV}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-blue-950"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#09152a] border border-blue-900/40 p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400 block font-medium">Total Prospectos</span>
              <span className="text-2xl font-black text-white">{leadsList.length}</span>
            </div>
            <div className="bg-[#09152a] border border-amber-900/40 p-4 rounded-2xl">
              <span className="text-[11px] text-amber-300 block font-medium">🔥 Calientes (Con Teléfono)</span>
              <span className="text-2xl font-black text-amber-400">
                {leadsList.filter(l => l.estado === 'caliente' || Boolean(l.telefono)).length}
              </span>
            </div>
            <div className="bg-[#09152a] border border-blue-900/40 p-4 rounded-2xl">
              <span className="text-[11px] text-blue-300 block font-medium">Nuevos Sin Atender</span>
              <span className="text-2xl font-black text-blue-400">
                {leadsList.filter(l => l.estado === 'nuevo').length}
              </span>
            </div>
            <div className="bg-[#09152a] border border-emerald-900/40 p-4 rounded-2xl">
              <span className="text-[11px] text-emerald-300 block font-medium">Derivados a Ejecutivo</span>
              <span className="text-2xl font-black text-emerald-400">
                {leadsList.filter(l => l.estado === 'derivado').length}
              </span>
            </div>
          </div>

          {/* Filtros de Leads */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#09152a] p-3.5 rounded-2xl border border-blue-900/40">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono, comuna..."
                value={busquedaLead}
                onChange={(e) => setBusquedaLead(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['todos', 'caliente', 'nuevo', 'derivado', 'cerrado'] as const).map(est => (
                <button
                  key={est}
                  onClick={() => setFiltroEstadoLead(est)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    filtroEstadoLead === est
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {est === 'todos' ? 'Todos' : est === 'caliente' ? '🔥 Calientes' : est.charAt(0).toUpperCase() + est.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Leads */}
          <div className="bg-[#09152a] border border-blue-900/40 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-blue-900/40 uppercase text-[10px] tracking-wider font-bold">
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Contacto / Nombre</th>
                    <th className="p-3.5">Comuna / Ubicación</th>
                    <th className="p-3.5">Resumen de Interés</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {leadsList
                    .filter(l => {
                      const matchEst = filtroEstadoLead === 'todos' || l.estado === filtroEstadoLead
                      const q = busquedaLead.toLowerCase()
                      const matchQ = !q || (l.nombre && l.nombre.toLowerCase().includes(q)) || (l.telefono && l.telefono.includes(q)) || (l.comuna && l.comuna.toLowerCase().includes(q))
                      return matchEst && matchQ
                    })
                    .map(lead => {
                      const telLimpio = (lead.telefono || '').replace(/\D/g, '')
                      const waUrl = telLimpio ? `https://wa.me/${telLimpio.startsWith('56') ? telLimpio : '56' + telLimpio}` : null
                      return (
                        <tr key={lead.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3.5">
                            <strong className="text-white block">{lead.nombre || 'Interesado Anónimo'}</strong>
                            <span className="font-mono text-emerald-400 text-[11px]">{lead.telefono || 'Sin teléfono'}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-slate-200 font-semibold">{lead.comuna || 'Región Metropolitana / V Región'}</span>
                            {lead.direccion && <span className="block text-[11px] text-slate-500 truncate max-w-[200px]">{lead.direccion}</span>}
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <p className="line-clamp-2 text-slate-300 text-[11px] leading-relaxed">
                              {lead.resumen || 'Consulta comercial por sistema de alarma o monitoreo 24/7.'}
                            </p>
                          </td>
                          <td className="p-3.5 text-center">
                            <select
                              value={lead.estado}
                              onChange={(e) => handleChangeStatusLead(lead.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono border cursor-pointer ${
                                lead.estado === 'caliente' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                lead.estado === 'nuevo' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                                lead.estado === 'derivado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              <option value="nuevo">Nuevo</option>
                              <option value="caliente">🔥 Caliente</option>
                              <option value="derivado">Derivado</option>
                              <option value="cerrado">Cerrado</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {waUrl && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition cursor-pointer"
                                  title="Contactar por WhatsApp"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => handleOpenChatLead(lead)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Ver Chat</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  {leadsList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                        No hay prospectos capturados todavía. Las consultas recibidas por WhatsApp, Instagram o la Web aparecerán aquí al instante.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal / Drawer de Chat del Lead */}
          {selectedLead && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#09152a] border border-blue-900/60 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span>Transcripción de Chat: {selectedLead.nombre || 'Cliente'}</span>
                    </h3>
                    <span className="text-xs text-emerald-400 font-mono">{selectedLead.telefono || 'Sin teléfono'} · {selectedLead.comuna || 'Sin comuna'}</span>
                  </div>
                  <button onClick={() => setSelectedLead(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs">
                  {loadingChatLead ? (
                    <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Cargando transcripción de mensajes...</span>
                    </div>
                  ) : chatMessagesLead.length === 0 ? (
                    <p className="text-center py-6 text-slate-500">No hay historial de mensajes disponible para esta sesión.</p>
                  ) : (
                    chatMessagesLead.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl ${
                            m.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                          }`}
                        >
                          <span className="text-[10px] opacity-75 font-mono block mb-1">
                            {m.role === 'user' ? '👤 Cliente' : '🛡️ Bot GAMA'}
                          </span>
                          <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-blue-900/40">
                  <span className="text-[11px] text-slate-500">{chatMessagesLead.length} mensajes intercambiados</span>
                  <button
                    onClick={() => {
                      const transcript = chatMessagesLead.map(m => `[${m.role === 'user' ? 'CLIENTE' : 'BOT GAMA'}]: ${m.content}`).join('\n\n')
                      navigator.clipboard.writeText(transcript)
                      notify('success', 'Transcripción copiada al portapapeles.')
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Chat</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDITAR / CREAR PRODUCTO
         ───────────────────────────────────────────────────────────── */}
      {editingProducto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#09152a] border border-blue-900/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
              <h3 className="text-lg font-bold text-white">
                {isCreatingProducto ? 'Nuevo Producto en Catálogo' : `Editar: ${editingProducto.nombre}`}
              </h3>
              <button
                onClick={() => setEditingProducto(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={editingProducto.nombre}
                  onChange={(e) => setEditingProducto({ ...editingProducto, nombre: e.target.value })}
                  placeholder="Ej: Sensor Movimiento PIR Antimascotas Vetti"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Marca del Hardware</label>
                  <select
                    value={editingProducto.marca || 'GENERAL'}
                    onChange={(e) => setEditingProducto({ ...editingProducto, marca: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-blue-300"
                  >
                    <option value="VETTI">VETTI (Inalámbrica)</option>
                    <option value="DSC">DSC (Cableada / PowerSeries)</option>
                    <option value="CCTV">CCTV (Cámaras)</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Categoría</label>
                  <select
                    value={editingProducto.categoria}
                    onChange={(e) => setEditingProducto({ ...editingProducto, categoria: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    {precios.categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Precio en CLP (Hardware / Accesorio)</label>
                  <input
                    type="number"
                    value={editingProducto.precio || 0}
                    onChange={(e) => setEditingProducto({ ...editingProducto, precio: parseInt(e.target.value) || 0 })}
                    placeholder="24900"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono font-bold text-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Los accesorios se cotizan 100% en CLP</span>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Valor en UF (Solo Monitoreo / Planes)</label>
                  <input
                    type="text"
                    value={editingProducto.precio_uf || ''}
                    onChange={(e) => setEditingProducto({ ...editingProducto, precio_uf: e.target.value })}
                    placeholder="Ej: 0,9 UF + IVA mensual"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Dejar vacío si es accesorio de pago único</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Descripción Persuasiva</label>
                <textarea
                  rows={3}
                  value={editingProducto.descripcion}
                  onChange={(e) => setEditingProducto({ ...editingProducto, descripcion: e.target.value })}
                  placeholder="Explica qué problema resuelve y por qué es superior a la competencia..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Elementos que Incluye (separados por coma)</label>
                <input
                  type="text"
                  value={editingProducto.incluye?.join(', ') || ''}
                  onChange={(e) => setEditingProducto({
                    ...editingProducto,
                    incluye: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Central WiFi/4G, 1 PIR antimascota, 2 controles, App NT Click"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-blue-900/40 flex justify-end gap-3">
              <button
                onClick={() => setEditingProducto(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!editingProducto.nombre.trim()) return alert('El nombre es obligatorio')
                  setPrecios(prev => {
                    const exists = prev.items.some(p => p.id === editingProducto.id)
                    const newItems = exists
                      ? prev.items.map(p => p.id === editingProducto.id ? editingProducto : p)
                      : [...prev.items, editingProducto]
                    return { ...prev, items: newItems }
                  })
                  setEditingProducto(null)
                  notify('success', 'Producto guardado. Recuerda pulsar "Publicar y Sincronizar".')
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDITAR / CREAR PROMOCIÓN CON IMAGEN
         ───────────────────────────────────────────────────────────── */}
      {editingPromo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#09152a] border border-blue-900/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>{isCreatingPromo ? 'Nueva Promoción Comercial' : `Editar: ${editingPromo.titulo}`}</span>
              </h3>
              <button onClick={() => setEditingPromo(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Título de la Campaña</label>
                <input
                  type="text"
                  value={editingPromo.titulo}
                  onChange={(e) => setEditingPromo({ ...editingPromo, titulo: e.target.value })}
                  placeholder="Ej: Promo Instalación Costo $0 - Casa Protegida"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Beneficio Clave</label>
                <input
                  type="text"
                  value={editingPromo.beneficio}
                  onChange={(e) => setEditingPromo({ ...editingPromo, beneficio: e.target.value })}
                  placeholder="Ej: Instalación $0 bonificada + 1er mes al 50% de descuento"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              {/* Subida de Imagen */}
              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block">Afiche o Imagen Promocional (PNG/JPG/WebP)</label>
                <div className="flex items-center gap-3">
                  {editingPromo.imagen_url && (
                    <img src={editingPromo.imagen_url} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
                  )}
                  <label className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-amber-500 bg-slate-950 flex items-center justify-center gap-2 cursor-pointer transition-colors text-slate-400 hover:text-white">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>{uploadingImage ? 'Subiendo imagen...' : 'Seleccionar o arrastrar afiche'}</span>
                    <input type="file" accept="image/*" onChange={handleSubirImagenPromo} className="hidden" />
                  </label>
                </div>
                <input
                  type="text"
                  value={editingPromo.imagen_url || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, imagen_url: e.target.value })}
                  placeholder="O ingresa la URL de la imagen: https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-[11px] text-slate-300 mt-1"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Mensaje de WhatsApp a despachar</label>
                <textarea
                  rows={3}
                  value={editingPromo.mensaje_whatsapp || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, mensaje_whatsapp: e.target.value })}
                  placeholder="Texto comercial que acompaña al afiche en WhatsApp..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Vigencia Hasta</label>
                  <input
                    type="date"
                    value={editingPromo.vigencia_hasta || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, vigencia_hasta: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={editingPromo.activa}
                      onChange={(e) => setEditingPromo({ ...editingPromo, activa: e.target.checked })}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <span>Activa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={editingPromo.destacada || false}
                      onChange={(e) => setEditingPromo({ ...editingPromo, destacada: e.target.checked })}
                      className="rounded accent-amber-500 w-4 h-4"
                    />
                    <span>Destacada</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-900/40 flex justify-end gap-3">
              <button onClick={() => setEditingPromo(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!editingPromo.titulo.trim()) return alert('El título es obligatorio')
                  setPromociones(prev => {
                    const exists = prev.some(p => p.id === editingPromo.id)
                    return exists ? prev.map(p => p.id === editingPromo.id ? editingPromo : p) : [...prev, editingPromo]
                  })
                  setEditingPromo(null)
                  notify('success', 'Promoción guardada en lista.')
                }}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                Guardar Promoción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDITAR / CREAR OBJECIÓN
         ───────────────────────────────────────────────────────────── */}
      {editingFaq && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#09152a] border border-blue-900/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
              <h3 className="text-lg font-bold text-white">
                {isCreatingFaq ? 'Nueva Objeción / FAQ' : 'Editar Argumentario'}
              </h3>
              <button onClick={() => setEditingFaq(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Categoría</label>
                <select
                  value={editingFaq.categoria}
                  onChange={(e) => setEditingFaq({ ...editingFaq, categoria: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="objeciones">Objeciones Comerciales (vs Verisure/ADT)</option>
                  <option value="tecnica">Técnicas (Luz, sabotaje, mascotas)</option>
                  <option value="financiera">Financieras (Costos, comodato, salida)</option>
                  <option value="garantias">Garantías y Evaluación en Terreno $0</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Pregunta u Objeción del Cliente</label>
                <input
                  type="text"
                  value={editingFaq.pregunta}
                  onChange={(e) => setEditingFaq({ ...editingFaq, pregunta: e.target.value })}
                  placeholder="Ej: ¿Por qué GAMA es más conveniente que Verisure?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Respuesta Demoledora del Bot</label>
                <textarea
                  rows={4}
                  value={editingFaq.respuesta}
                  onChange={(e) => setEditingFaq({ ...editingFaq, respuesta: e.target.value })}
                  placeholder="Argumento de valor: equipos en propiedad, sin comodato, monitoreo 0,9 UF..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Palabras Clave Disparadoras (separadas por coma)</label>
                <input
                  type="text"
                  value={editingFaq.palabras_clave?.join(', ') || ''}
                  onChange={(e) => setEditingFaq({
                    ...editingFaq,
                    palabras_clave: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
                  })}
                  placeholder="verisure, adt, prosegur, comodato, arriendo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-blue-900/40 flex justify-end gap-3">
              <button onClick={() => setEditingFaq(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!editingFaq.pregunta.trim() || !editingFaq.respuesta.trim()) return alert('Pregunta y respuesta son obligatorias')
                  setFaqs(prev => {
                    const exists = prev.some(f => f.id === editingFaq.id)
                    return exists ? prev.map(f => f.id === editingFaq.id ? editingFaq : f) : [...prev, editingFaq]
                  })
                  setEditingFaq(null)
                  notify('success', 'Objeción guardada.')
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                Guardar Objeción
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
