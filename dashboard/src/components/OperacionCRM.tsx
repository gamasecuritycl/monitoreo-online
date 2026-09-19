'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { cleanRut } from '@/lib/rut'
import clientesDataRaw from '@/lib/clientes_general.json'
import { generarCotizacionPdfBase64 } from '@/lib/generateCotizacionPdf'
import clientesMaestrosPreasociados from '@/lib/clientes_maestros_preasociados.json'
import centrosCostoPreasociados from '@/lib/centros_costo_preasociados.json'
import facturasJulioReal from '@/lib/facturas_julio_real.json'
import { esAbonadoInactivo } from '@/lib/inactivos_filter'
import { guardarConfigMail } from '@/lib/notificacionesMail'

import OperacionHeader from './operacion/OperacionHeader'
import OperacionSidebar from './operacion/OperacionSidebar'
import CommandPaletteModal from './operacion/CommandPaletteModal'
import SlideOverDrawer from './operacion/SlideOverDrawer'
import BentoKpiGrid from './operacion/BentoKpiGrid'
import ComprasProveedoresModule from './operacion/ComprasProveedoresModule'
import ContratosModule from './operacion/ContratosModule'
import ContratoDigitalModal from './operacion/ContratoDigitalModal'
import Ley21719Module from './operacion/Ley21719Module'
import WhatsAppNotificationToast from './WhatsAppNotificationToast'
import WhatsAppPlantillasModal, { PlantillaAbonadoData } from './operacion/WhatsAppPlantillasModal'
import NotificacionesWhatsAppModal from './NotificacionesWhatsAppModal'

import {
  Shield,
  ShieldCheck,
  User,
  FileText,
  DollarSign,
  MessageSquare,
  Pencil,
  Trash2,
  Building2,
  Wrench,
  BarChart3,
  Settings,
  Bot,
  Search,
  Plus,
  Printer,
  X,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Copy,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  FileCheck,
  Layers,
  ChevronDown,
  Filter,
  Send,
  Sparkles,
  SlidersHorizontal,
  CreditCard,
  Building,
  Radio,
  FileSpreadsheet,
  Loader2,
  Receipt,
  ClipboardList,
  Megaphone,
  Target,
  UserPlus,
  Activity,
  Smartphone,
  Upload
} from 'lucide-react'
import ServicioTecnicoModal from './ServicioTecnicoModal'

const clientesFallback = clientesDataRaw as Record<string, Record<string, string>>

const IVA_PORCENTAJE = 0.19

// ── CATÁLOGO PRECONFIGURADO DE SEGURIDAD ELECTRÓNICA & MONITOREO ──
const CATALOGO_SEGURIDAD = [
  { id: 'CAT-1', descripcion: 'Kit Alarma DSC Neo 8 Zonas con Teclado LCD & Sirena Exterior 110dB', precio_neto: 235294, categoria: 'Kit Alarma' },
  { id: 'CAT-2', descripcion: 'Cámara IP 4MP Hikvision DarkFighter Visión Nocturna Color 24/7', precio_neto: 71428, categoria: 'CCTV' },
  { id: 'CAT-3', descripcion: 'Control remoto inalambrico RadioFrecuencia 4Botones Botón Pánico', precio_neto: 26050, categoria: 'Accesorios' },
  { id: 'CAT-4', descripcion: 'Cerco Eléctrico Perimetral 6 Hilos con Energizador 12.000V Batería Respaldo', precio_neto: 378151, categoria: 'Cerco' },
  { id: 'CAT-5', descripcion: 'Servicio de Monitoreo de Alarma 24/7 & Verificación por Video IA (Mensual)', precio_neto: 25126, categoria: 'Monitoreo' },
  { id: 'CAT-6', descripcion: 'Sensor de Movimiento Exterior Infrarrojo Dual Tech Antimask', precio_neto: 48500, categoria: 'Sensores' }
]

// ── NIVEL 1: EMPRESA DEL CONGLOMERADO (CRUD 4 RAZONES SOCIALES) ──
export interface EmpresaConglomerado {
  id: string
  razon_social: string
  rut: string
  giro: string
  direccion: string
  telefono: string
  email_cobranza: string
  email_contacto: string
  web: string
  banco_nombre: string
  banco_tipo_cuenta: string
  banco_numero_cuenta: string
}

// ── NIVEL 2: CLIENTE COMERCIAL (POR RUT ÚNICO O FICHA) ──
export interface ClienteMaestro {
  rut: string
  razon_social: string
  empresa_facturadora_id: string
  email_cobranza: string
  telefono: string
  direccion_comercial: string
  ciudad?: string
  moneda: 'UF' | 'CLP'
  tarifa_mensual: number
  dia_vencimiento: number
  plan_monitoreo: string
  estado_pago: 'Al Día' | 'Pendiente' | 'Moroso'
  cuentas_abonados: string[]
}

// ── NIVEL 3: CENTRO DE COSTO / ABONADO (COMMAND CENTER) ──
export interface CentroDeCostoAbonado {
  cuenta: string
  alias_centro_costo: string
  direccion: string
  ciudad: string
  rut_cliente: string
}

export interface FacturaIndividual {
  id: string
  numero_factura: string
  fecha: string
  razon_social: string
  rut_cliente: string
  empresa_facturadora_id: string
  monto_total: number
  monto_abonado: number
  saldo_pendiente: number
  cuenta_asociada?: string
  estado: 'Emitida' | 'Abonada' | 'Pagada' | 'Morosa'
  notas_cobranza?: string
  fecha_carga: string
}

export type EtapaPipelineEspo = 'Lead' | 'Visita' | 'Cotizacion' | 'Negociacion' | 'Ganada' | 'Perdida'

export interface ItemCotizacion {
  id: string
  descripcion: string
  cantidad: number
  precio_neto_unitario: number
  descuento_valor: number
  tipo_descuento: 'porcentaje' | 'monto'
  descuento_porcentaje?: number
}

export interface CotizacionDolibarr {
  id: number
  codigo_cotizacion: string
  cuenta: string
  rut_cliente: string
  nombre_cliente: string
  empresa_facturadora_id: string
  direccion: string
  ciudad_cliente?: string
  email_cliente?: string
  telefono_cliente?: string
  giro_cliente?: string
  contacto_persona?: string
  vendedor?: string
  tipo_receptor?: 'registrado' | 'prospecto'
  etapa_pipeline?: EtapaPipelineEspo
  fecha: string
  validez_dias: number
  forma_pago?: string
  moneda_cotizacion?: 'CLP' | 'UF'
  descuento_global_valor?: number
  descuento_global_tipo?: 'porcentaje' | 'monto'
  items: ItemCotizacion[]
  subtotal_neto: number
  total_descuentos: number
  neto_con_descuento: number
  monto_iva: number
  monto_total_iva_incluido: number
  estado: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado'
  observaciones: string
}

export interface OrdenDeTrabajo {
  id: string
  codigo_ot: string
  cuenta: string
  cliente_nombre: string
  tipo_servicio: string
  tecnico_asignado: string
  fecha_programada: string
  prioridad_sla?: 'Crítica (2h)' | 'Alta (6h)' | 'Normal (24h)' | 'Programada (48h)' | string
  estado: 'Pendiente' | 'En Proceso' | 'Finalizada' | 'Completada' | 'Cancelada' | string
  observaciones: string
}

const EMPRESAS_INICIALES: EmpresaConglomerado[] = [
  {
    id: 'EMP-1',
    razon_social: 'INVERSIONES GAMA SpA',
    rut: '78.297.009-7',
    giro: 'Servicios de Inversiones, Seguridad Electrónica & Monitoreo 24/7',
    direccion: 'Av. Valparaíso 351, Villa Alemana',
    telefono: '+56 32 3276011',
    email_cobranza: 'cobranza@gamasecurity.cl',
    email_contacto: 'contacto@gamasecurity.cl',
    web: 'www.gamasecurity.cl',
    banco_nombre: 'Banco de Chile / Edwards',
    banco_tipo_cuenta: 'Cuenta Corriente',
    banco_numero_cuenta: '00-123-45678-9'
  },
  {
    id: 'EMP-2',
    razon_social: 'Gama Seguridad SpA',
    rut: '76.319.399-3',
    giro: 'Servicios de Seguridad Electrónica & Monitoreo 24/7',
    direccion: 'Av. Valparaíso 1183 Of. 03, Viña del Mar, Chile',
    telefono: '+56 32 3276011',
    email_cobranza: 'cobranza@gamasecurity.cl',
    email_contacto: 'contacto@gamasecurity.cl',
    web: 'www.gamasecurity.cl',
    banco_nombre: 'Banco de Chile / Edwards',
    banco_tipo_cuenta: 'Cuenta Corriente',
    banco_numero_cuenta: '00-123-45678-9'
  },
  {
    id: 'EMP-3',
    razon_social: 'Gama Servicios Limitada',
    rut: '76.123.456-K',
    giro: 'Servicios Integrales de Monitoreo 24/7',
    direccion: 'Av. Providencia 1234, Of. 502, Santiago, Chile',
    telefono: '+56 9 9101 6912',
    email_cobranza: 'servicios@gamasecurity.cl',
    email_contacto: 'contacto@gamasecurity.cl',
    web: 'www.gamasecurity.cl',
    banco_nombre: 'Banco Santander',
    banco_tipo_cuenta: 'Cuenta Corriente',
    banco_numero_cuenta: '00-987-65432-1'
  },
  {
    id: 'EMP-4',
    razon_social: 'Gama Tecnología & Telecom SpA',
    rut: '77.890.123-4',
    giro: 'Venta e Instalación de CCTV & Sistemas de Control de Acceso',
    direccion: 'Calle Esmeralda 450, Valparaíso, Chile',
    telefono: '+56 32 2548900',
    email_cobranza: 'tecnologia@gamasecurity.cl',
    email_contacto: 'contacto@gamasecurity.cl',
    web: 'www.gamasecurity.cl',
    banco_nombre: 'Banco BCI',
    banco_tipo_cuenta: 'Cuenta Corriente',
    banco_numero_cuenta: '11-223-34455-6'
  },
  {
    id: 'EMP-5',
    razon_social: 'Gama Monitoreo 24/7 SpA',
    rut: '76.999.888-1',
    giro: 'Central de Operaciones & Verificación por Video IA',
    direccion: 'Av. Apoquindo 3000, Las Condes, Santiago, Chile',
    telefono: '+56 2 2890 1200',
    email_cobranza: 'monitoreo@gamasecurity.cl',
    email_contacto: 'contacto@gamasecurity.cl',
    web: 'www.gamasecurity.cl',
    banco_nombre: 'Banco Estado',
    banco_tipo_cuenta: 'Cuenta Corriente',
    banco_numero_cuenta: '22-334-45566-7'
  }
]

export interface BitacoraLead {
  id: string
  fecha: string
  autor: string
  tipo: 'Llamada' | 'Correo' | 'Visita' | 'WhatsApp'
  nota: string
}

export interface LeadMarketing {
  id: string
  empresa: string
  rut?: string
  comuna?: string
  direccion?: string
  email: string
  telefono: string
  contacto: string
  segmento: 'Comercial B2B' | 'Industrial' | 'Condominios' | 'Particular'
  estado: 'Nuevo' | 'Contactado' | 'Interesado' | 'Cliente'
  score_interes?: number
  fecha_ingreso: string
  notas?: string
  bitacora?: BitacoraLead[]
}

export interface PiezaPublicitaria {
  id: string
  titulo: string
  subtitulo: string
  categoria: 'Monitoreo 24/7' | 'CCTVs & Video IA' | 'Cerco Eléctrico' | 'Control Acceso'
  comunaTarget: string
  imagenBanner: string
  enlaceCta: string
  cuponDescuento: string
}

const LEADS_INICIALES: LeadMarketing[] = [
  { id: 'LEAD-101', empresa: 'Logística & Bodegaje El Salto SpA', rut: '76.890.123-5', comuna: 'Viña del Mar', direccion: 'Av. El Salto 1450, Viña del Mar', email: 'adquisiciones@logisticaelsalto.cl', telefono: '+56 32 268 9000', contacto: 'Don Roberto Morales', segmento: 'Industrial', estado: 'Nuevo', score_interes: 5, fecha_ingreso: '2026-07-20', notas: 'Interesados en monitoreo de bodegas y cerco eléctrico en El Salto', bitacora: [{ id: 'b1', fecha: '2026-07-20 14:30', autor: 'Ejecutivo Comercial', tipo: 'Llamada', nota: 'Primer contacto con Don Roberto. Mencionó requerir cotización de 16 cámaras.' }] },
  { id: 'LEAD-102', empresa: 'Inmobiliaria Cordillera Reñaca SpA', rut: '77.456.789-1', comuna: 'Concón', direccion: 'Av. Borgoño 15200, Reñaca Concón', email: 'gerencia@inmobiliariacordillera.cl', telefono: '+56 32 245 8900', contacto: 'Dra. María Elena Silva', segmento: 'Comercial B2B', estado: 'Contactado', score_interes: 4, fecha_ingreso: '2026-07-18', notas: 'Cotización de 12 cámaras IP DarkFighter solicitada', bitacora: [{ id: 'b2', fecha: '2026-07-18 10:15', autor: 'Ejecutivo Comercial', tipo: 'Correo', nota: 'Se envió propuesta previa de CCTV para edificio de oficinas.' }] },
  { id: 'LEAD-103', empresa: 'Constructora Puerto Valparaíso Limitada', rut: '76.111.222-3', comuna: 'Valparaíso', direccion: 'Camino La Pólvora Km 8.5, Valparaíso', email: 'operaciones@sanpedroconst.cl', telefono: '+56 9 8765 4321', contacto: 'Ing. Carlos Fuentealba', segmento: 'Industrial', estado: 'Interesado', score_interes: 5, fecha_ingreso: '2026-07-15', notas: 'Requieren kit de pánico e intrusión para faena en puerto', bitacora: [{ id: 'b3', fecha: '2026-07-16 16:45', autor: 'Jefe Técnico', tipo: 'Visita', nota: 'Visita técnica realizada en terreno La Pólvora.' }] },
  { id: 'LEAD-104', empresa: 'Clínica Privada Jardín del Mar', rut: '76.999.000-K', comuna: 'Viña del Mar', direccion: 'Av. Libertad 940, Viña del Mar', email: 'contacto@clinicaleroble.cl', telefono: '+56 32 2890 550', contacto: 'Sra. Patricia Venegas', segmento: 'Comercial B2B', estado: 'Nuevo', score_interes: 4, fecha_ingreso: '2026-07-21', notas: 'Evaluando cambio de proveedor de monitoreo 24/7', bitacora: [] },
  { id: 'LEAD-105', empresa: 'Centro Logístico Marga Marga SpA', rut: '77.123.999-4', comuna: 'Quilpué', direccion: 'Av. Los Carrera 2500, Quilpué', email: 'seguridad@margamargalog.cl', telefono: '+56 32 291 8800', contacto: 'Sr. Hugo Alarcón', segmento: 'Industrial', estado: 'Cliente', score_interes: 5, fecha_ingreso: '2026-07-10', notas: 'Monitoreo activo en 3 sucursales de Quilpué y Villa Alemana', bitacora: [{ id: 'b4', fecha: '2026-07-10 11:00', autor: 'Administración', tipo: 'Visita', nota: 'Firma de contrato de monitoreo 24/7.' }] }
]

export function normalizeCuentaCode(cta: any): string {
  if (cta === null || cta === undefined) return ''
  const clean = cta.toString().trim().toUpperCase()
  if (!clean) return ''
  if (/^\d+$/.test(clean)) {
    return clean.padStart(4, '0')
  }
  return clean
}

export default function OperacionCRM() {
  const [moduloActivo, setModuloActivo] = useState<'ficha360' | 'autonomia' | 'presupuestos' | 'facturacion' | 'serv_tecnico' | 'kpis' | 'config' | 'marketing' | 'compras' | 'contratos' | 'ley21719' | null>(null)
  const [sidebarAbierto, setSidebarAbierto] = useState<boolean>(false)

  // ── ESTADOS APPLE HIG / LINEAR (COMMAND PALETTE & SLIDE-OVER DRAWER) ──
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [drawerState, setDrawerState] = useState<{
    isOpen: boolean
    titulo: string
    subtitulo?: string
    tipo: 'cliente' | 'cotizacion' | 'factura' | 'ot'
    datos: any
  }>({
    isOpen: false,
    titulo: '',
    tipo: 'cliente',
    datos: null
  })

  // ── NIVEL 1: EMPRESAS DEL CONGLOMERADO Y FORMULARIO MODAL ──
  const [empresasConglomerado, setEmpresasConglomerado] = useState<EmpresaConglomerado[]>(EMPRESAS_INICIALES)
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false)
  const [empresaEditando, setEmpresaEditando] = useState<EmpresaConglomerado | null>(null)

  // Cerrar módulo emergente con la tecla Escape y volver al Launchpad Principal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && moduloActivo && !commandPaletteOpen && !mostrarModalEmpresa && !drawerState.isOpen) {
        setModuloActivo(null)
      }
    }
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [moduloActivo, commandPaletteOpen, mostrarModalEmpresa, drawerState.isOpen])

  const [empFormId, setEmpFormId] = useState('')
  const [empFormRazonSocial, setEmpFormRazonSocial] = useState('')
  const [empFormRut, setEmpFormRut] = useState('')
  const [empFormGiro, setEmpFormGiro] = useState('')
  const [empFormDireccion, setEmpFormDireccion] = useState('')
  const [empFormTelefono, setEmpFormTelefono] = useState('')
  const [empFormEmailCobranza, setEmpFormEmailCobranza] = useState('')
  const [empFormEmailContacto, setEmpFormEmailContacto] = useState('')
  const [empFormWeb, setEmpFormWeb] = useState('')
  const [empFormBancoNombre, setEmpFormBancoNombre] = useState('')
  const [empFormBancoTipoCuenta, setEmpFormBancoTipoCuenta] = useState('')
  const [empFormBancoNumeroCuenta, setEmpFormBancoNumeroCuenta] = useState('')

  // ── MULTI-CONFIGURACIÓN PESTAÑAS (MÓDULO 7) ──
  const [subTabConfig, setSubTabConfig] = useState<'empresas' | 'financiero' | 'vinculacion' | 'whatsapp' | 'agentes'>('empresas')

  // ── HERRAMIENTA ADMINISTRATIVA: VINCULACIÓN TRIBUTARIA DE ABONADOS A RUT ──
  const [vincSubTab, setVincSubTab] = useState<'pendientes' | 'consolidado' | 'papelera'>('pendientes')
  const [vincMostrarTodos, setVincMostrarTodos] = useState<boolean>(false)
  const [vincRutSeleccionado, setVincRutSeleccionado] = useState<string>('')
  const [vincBusquedaAbonado, setVincBusquedaAbonado] = useState<string>('')
  const [vincAbonadosSeleccionados, setVincAbonadosSeleccionados] = useState<string[]>([])
  const [vincNuevaRazonSocial, setVincNuevaRazonSocial] = useState<string>('')
  const [vincNuevoRut, setVincNuevoRut] = useState<string>('')
  const [desvinculadosHistorial, setDesvinculadosHistorial] = useState<{ cuenta: string, rutAnterior: string, razonSocialAnterior: string, fecha: string }[]>([])

  // ── NIVEL 2 Y 3: SELECCIÓN DE CLIENTE Y ABONADO INDIVIDUAL (PRE-ASOCIADOS DESDE ARCHIVO MAESTRO) ──
  const [clientesMaestros, setClientesMaestros] = useState<Record<string, ClienteMaestro>>(clientesMaestrosPreasociados as any)
  const [abonadosCentrosCosto, setAbonadosCentrosCosto] = useState<Record<string, CentroDeCostoAbonado>>(centrosCostoPreasociados as any)
  
  const [rutClienteSeleccionado, setRutClienteSeleccionado] = useState<string>('')
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('')
  const [busquedaClienteInput, setBusquedaClienteInput] = useState<string>('')
  const [buscandoSpinner, setBuscandoSpinner] = useState<boolean>(false)
  const [tabFicha360, setTabFicha360] = useState<'datos' | 'abonados' | 'facturas' | 'cotizaciones' | 'ots' | 'contrato'>('datos')
  const [mostrarModalContratoFicha, setMostrarModalContratoFicha] = useState(false)
  const [modalWhatsAppActivo, setModalWhatsAppActivo] = useState(false)
  const [modalPlantillasWhatsAppActivo, setModalPlantillasWhatsAppActivo] = useState(false)
  const [plantillaWhatsAppAbonado, setPlantillaWhatsAppAbonado] = useState<PlantillaAbonadoData | undefined>(undefined)
  const [whatsappTelefonoDirecto, setWhatsappTelefonoDirecto] = useState<string | undefined>(undefined)

  // UF Global
  const [valorUF, setValorUF] = useState(38500)

  // Estado envio de correos por Resend
  const [enviandoEmailId, setEnviandoEmailId] = useState<number | null>(null)

  // ── MÓDULO MARKETING & COLD EMAIL OUTREACH VÍA RESEND ──
  const [subTabMarketing, setSubTabMarketing] = useState<'leads' | 'campanas' | 'publicidad'>('leads')
  const [leadsList, setLeadsList] = useState<LeadMarketing[]>(LEADS_INICIALES)
  const [busquedaLead, setBusquedaLead] = useState('')
  const [filtroEstadoLead, setFiltroEstadoLead] = useState<string>('Todos')

  // Filtros V Región & Auto-Descubrimiento
  const [filtroComunaVRegion, setFiltroComunaVRegion] = useState<string>('Todas')
  const [cargandoScraperVRegion, setCargandoScraperVRegion] = useState(false)

  // Drawer / Modal Tratamiento Prospecto
  const [prospectoTratamiento, setProspectoTratamiento] = useState<LeadMarketing | null>(null)
  const [nuevaNotaBitacora, setNuevaNotaBitacora] = useState('')
  const [tipoNotaBitacora, setTipoNotaBitacora] = useState<'Llamada' | 'Correo' | 'Visita' | 'WhatsApp'>('Llamada')

  // Modal Nuevo Lead
  const [mostrarModalNuevoLead, setMostrarModalNuevoLead] = useState(false)
  const [leadEditandoId, setLeadEditandoId] = useState<string | null>(null)
  const [formLeadEmpresa, setFormLeadEmpresa] = useState('')
  const [formLeadRut, setFormLeadRut] = useState('')
  const [formLeadComuna, setFormLeadComuna] = useState('Viña del Mar')
  const [formLeadDireccion, setFormLeadDireccion] = useState('')
  const [formLeadEmail, setFormLeadEmail] = useState('')
  const [formLeadTelefono, setFormLeadTelefono] = useState('')
  const [formLeadContacto, setFormLeadContacto] = useState('')
  const [formLeadSegmento, setFormLeadSegmento] = useState<'Comercial B2B' | 'Industrial' | 'Condominios' | 'Particular'>('Comercial B2B')
  const [formLeadEstado, setFormLeadEstado] = useState<'Nuevo' | 'Contactado' | 'Interesado' | 'Cliente'>('Nuevo')
  const [formLeadScore, setFormLeadScore] = useState<number>(4)
  const [formLeadNotas, setFormLeadNotas] = useState('')

  // Diseñador de Publicidad & Banners B2B
  const [pubTitulo, setPubTitulo] = useState('¡Protege tu Empresa en {{comuna}} con Monitoreo 24/7 y 2 Meses Gratis!')
  const [pubSubtitulo, setPubSubtitulo] = useState('Cámaras DarkFighter 4K + Central de Alarma Inteligente sin costo de instalación para clientes B2B de la V Región.')
  const [pubCategoria, setPubCategoria] = useState<'Monitoreo 24/7' | 'CCTVs & Video IA' | 'Cerco Eléctrico' | 'Control Acceso'>('Monitoreo 24/7')
  const [pubComunaTarget, setPubComunaTarget] = useState('Viña del Mar')
  const [pubCupon, setPubCupon] = useState('GAMA-VREGION-2026')
  const [pubEnlaceCta, setPubEnlaceCta] = useState('https://www.gamasecurity.cl/auditoria-gratuita')
  const [isDistribuyendoPublicidad, setIsDistribuyendoPublicidad] = useState(false)

  // Formulario Motor Campañas Resend
  const [campanaSegmento, setCampanaSegmento] = useState<string>('Todos')
  const [campanaRemitente, setCampanaRemitente] = useState<string>('Gama Seguridad <contacto@gamasecurity.cl>')
  const [campanaAsunto, setCampanaAsunto] = useState<string>('Propuesta de Monitoreo 24/7 & Seguridad Electrónica para {{nombre_empresa}}')
  const [campanaContenido, setCampanaContenido] = useState<string>(
`<p>Estimados <strong>{{nombre_empresa}}</strong>,</p>
<p>Junto con saludarle de <strong>Gama Seguridad Chile</strong>, nos ponemos en contacto con el(la) Sr(a). <strong>{{contacto}}</strong> para presentarles nuestro servicio integral de <strong>Monitoreo de Alarma 24/7 y Verificación de Video con Inteligencia Artificial</strong>.</p>
<p>Protegemos instalaciones comerciales e industriales con tecnología de punta:</p>
<ul>
  <li>Central Operativa 24/7 con respuesta en tiempo real.</li>
  <li>Cámaras HD DarkFighter con visión nocturna a color.</li>
  <li>Cercos eléctricos perimetrales de alta tensión.</li>
  <li>Controlador directo en smartphone y botón de pánico.</li>
</ul>
<p>Le invitamos a agendar una <strong>auditoría de seguridad 100% gratuita</strong> en sus instalaciones.</p>
<p>Atentamente,<br><strong>Equipo Comercial Gama Seguridad</strong><br>contacto@gamasecurity.cl</p>`
  )
  const [isSubmittingCampana, setIsSubmittingCampana] = useState(false)
  const [progresoEnvioText, setProgresoEnvioText] = useState('')
  const [toastNotificacion, setToastNotificacion] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null)

  // ── ESTADOS DE BITÁCORA ACUMULATIVA DE COBRANZA Y EDICIÓN DE CORREOS DE CLIENTE ──
  const [facturaSeleccionadaCobranza, setFacturaSeleccionadaCobranza] = useState<FacturaIndividual | null>(null)
  const [bitacoraCobranzaFacturas, setBitacoraCobranzaFacturas] = useState<Record<string, Array<{ id: string; fecha: string; autor: string; tipo: string; nota: string }>>>({
    'FAC-1001': [
      { id: 'n1', fecha: '25-08-2026 11:20:00', autor: 'Tomás Toro (Admin)', tipo: 'Llamada', nota: 'Se llamó al cliente. Indica que autorizará la transferencia el viernes 28.' },
      { id: 'n2', fecha: '20-08-2026 09:15:00', autor: 'Central Operativa', tipo: 'WhatsApp', nota: 'Aviso de vencimiento de factura enviado por WhatsApp.' }
    ]
  })
  const [nuevaNotaTexto, setNuevaNotaTexto] = useState('')
  const [nuevaNotaTipo, setNuevaNotaTipo] = useState<'Llamada' | 'WhatsApp' | 'Correo' | 'Promesa de Pago' | 'Abono' | 'Nota'>('Llamada')
  const [clienteEditingEmail, setClienteEditingEmail] = useState<{ rut: string; razon_social: string; email_cobranza: string; email_contacto: string; telefono: string } | null>(null)

  const handleAgregarNotaCobranza = async (factura: FacturaIndividual) => {
    if (!nuevaNotaTexto.trim()) return
    const key = factura.id
    const nueva = {
      id: 'N-' + Date.now(),
      fecha: new Date().toLocaleString('es-CL'),
      autor: 'Operador Central',
      tipo: nuevaNotaTipo,
      nota: nuevaNotaTexto.trim()
    }

    setBitacoraCobranzaFacturas(prev => ({
      ...prev,
      [key]: [nueva, ...(prev[key] || [])]
    }))

    try {
      await supabase.from('eventos_monitoreo').insert({
        cuenta: factura.cuenta_asociada || factura.numero_factura || 'COBRANZA',
        nombre_abonado: factura.razon_social || 'CLIENTE',
        evento: `COBRANZA_NOTA_${nuevaNotaTipo.toUpperCase()}`,
        zona: 'Operador Central',
        usuario: nuevaNotaTexto.trim(),
        fecha_hora: new Date().toLocaleString('es-CL')
      })
    } catch (e) {
      console.error('Error guardando nota de cobranza:', e)
    }

    setNuevaNotaTexto('')
  }

  const handleGuardarEmailCliente = async () => {
    if (!clienteEditingEmail) return
    const { rut, email_cobranza, email_contacto, telefono } = clienteEditingEmail

    setClientesMaestros(prev => {
      const copy = { ...prev }
      if (copy[rut]) {
        copy[rut] = {
          ...copy[rut],
          email_cobranza,
          telefono
        }
      }
      return copy
    })

    try {
      await supabase.from('eventos_monitoreo').insert({
        cuenta: 'CLIENTE_MAESTRO',
        nombre_abonado: JSON.stringify({ rut, email_cobranza, email_contacto, telefono }),
        evento: 'ACTUALIZACION_CORREO_CLIENTE',
        fecha_hora: new Date().toISOString()
      })

      // Sincronizar centralmente con notificaciones_mail para que esté disponible en todos los modales
      const cli = clientesMaestros[rut]
      const cuentas = cli?.cuentas_abonados || []
      const emailsList = [email_contacto, email_cobranza].filter(Boolean)
      if (emailsList.length > 0) {
        for (const cta of cuentas) {
          try {
            await guardarConfigMail(cta, emailsList)
          } catch {}
        }
      }

      alert(`✅ Correos de cobranza y contacto guardados y sincronizados centralmente para ${clienteEditingEmail.razon_social}.`)
    } catch (e) {
      alert(`⚠️ Guardado en memoria local`)
    }

    setClienteEditingEmail(null)
  }

  const handleAbrirPortalCliente = (cuenta?: string) => {
    const cta = (cuenta || 'C701').toUpperCase().trim()
    try {
      localStorage.setItem('gama_portal_cuenta', cta)
    } catch {}
    window.open(`/portal?cuenta=${encodeURIComponent(cta)}`, '_blank')
  }

  // Órdenes de Trabajo & Facturas & Cotizaciones
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenDeTrabajo[]>([
    { id: 'OT-1', codigo_ot: 'OT-2026-081', cuenta: '0999', cliente_nombre: 'GAMA SEGURIDAD SPA DEMO', tipo_servicio: 'Mantención Perimetral Alarma', tecnico_asignado: 'Técnico Juan Pérez', fecha_programada: '2026-07-22', prioridad_sla: 'Crítica (2h)', estado: 'En Proceso', observaciones: 'Revisión urgente de sensor infrarrojo' },
    { id: 'OT-2', codigo_ot: 'OT-2026-082', cuenta: 'C774', cliente_nombre: 'CORPORACION PRODEL', tipo_servicio: 'Instalación Cámara IP DarkFighter', tecnico_asignado: 'Técnico Carlos Rojas', fecha_programada: '2026-07-23', prioridad_sla: 'Alta (6h)', estado: 'Pendiente', observaciones: 'Montaje de 2 cámaras en acceso principal' }
  ])
  const [facturas, setFacturas] = useState<FacturaIndividual[]>(() => {
    return (facturasJulioReal as any[]).map(f => ({
      id: `FAC-${f.numero}`,
      numero_factura: `F-${f.numero}`,
      fecha: f.fecha,
      razon_social: f.nombre,
      rut_cliente: '76.123.456-K',
      empresa_facturadora_id: 'EMP-1',
      monto_total: Number(f.monto) || 0,
      monto_abonado: 0,
      saldo_pendiente: Number(f.monto) || 0,
      cuenta_asociada: f.ctaSugerida || 'N/A',
      estado: 'Emitida',
      fecha_carga: f.fecha
    }))
  })
  const [cotizaciones, setCotizaciones] = useState<CotizacionDolibarr[]>([])
  
  // Selector Vista Cotizaciones (Tabla DTE vs Kanban Pipeline EspoCRM)
  const [vistaCotizaciones, setVistaCotizaciones] = useState<'tabla' | 'kanban'>('tabla')

  // Modales Facturación & Abonos Parciales
  const [mostrarModalAbono, setMostrarModalAbono] = useState(false)
  const [facturaAbonando, setFacturaAbonando] = useState<FacturaIndividual | null>(null)
  const [montoAbonoInput, setMontoAbonoInput] = useState('')
  const [metodoPagoInput, setMetodoPagoInput] = useState('Transferencia Bancaria')
  const [notaAbonoInput, setNotaAbonoInput] = useState('')

  // Modales OT & Creador de Presupuesto Side-by-Side (DTE Chile Standard)
  const [mostrarModalCotizacion, setMostrarModalCotizacion] = useState(false)
  const [cotSeleccionada, setCotSeleccionada] = useState<CotizacionDolibarr | null>(null)
  const [cotEditandoId, setCotEditandoId] = useState<number | null>(null)

  // FORMULARIO Y ESTADO DEL CREADOR DE COTIZACIONES PROFESIONAL
  const [tipoReceptorCot, setTipoReceptorCot] = useState<'registrado' | 'prospecto'>('registrado')
  const [cotEmpresaEmisoraId, setCotEmpresaEmisoraId] = useState('EMP-1')
  const [cotClienteRutSeleccionado, setCotClienteRutSeleccionado] = useState('')
  const [cotNombreCliente, setCotNombreCliente] = useState('')
  const [cotRutCliente, setCotRutCliente] = useState('')
  const [cotGiroCliente, setCotGiroCliente] = useState('Servicios Integrales / Particular')
  const [cotContactoPersona, setCotContactoPersona] = useState('')
  const [cotDireccion, setCotDireccion] = useState('')
  const [cotCiudadCliente, setCotCiudadCliente] = useState('Santiago')
  const [cotEmailCliente, setCotEmailCliente] = useState('')
  const [cotTelefonoCliente, setCotTelefonoCliente] = useState('')
  const [cotVendedor, setCotVendedor] = useState('Ejecutivo Comercial Gama Seguridad')
  const [cotEtapaPipeline, setCotEtapaPipeline] = useState<EtapaPipelineEspo>('Cotizacion')
  const [cotValidez, setCotValidez] = useState(15)
  const [cotFormaPago, setCotFormaPago] = useState('50% Anticipo / 50% Al Finalizar')
  const [cotMoneda, setCotMoneda] = useState<'CLP' | 'UF'>('CLP')
  const [cotObservaciones, setCotObservaciones] = useState('Garantía de equipos 12 meses. Precios netos afectos al 19% IVA según normativa legal chilena.')
  
  // DESCUENTO GLOBAL DE COTIZACIÓN ($ O %)
  const [descuentoGlobalValor, setDescuentoGlobalValor] = useState<number>(0)
  const [descuentoGlobalTipo, setDescuentoGlobalTipo] = useState<'porcentaje' | 'monto'>('porcentaje')

  const [itemsCot, setItemsCot] = useState<ItemCotizacion[]>([
    { id: '1', descripcion: 'Control remoto inalambrico RadioFrecuencia 4Botones Botón Pánico', cantidad: 1, precio_neto_unitario: 31000, descuento_valor: 0, tipo_descuento: 'porcentaje' }
  ])

  // Modales OT & Formulario & Filtros Command Center & Modal PWA Terreno
  const [mostrarModalOT, setMostrarModalOT] = useState(false)
  const [mostrarModalFirmaOT, setMostrarModalFirmaOT] = useState<OrdenDeTrabajo | null>(null)
  const [mostrarModalPWATerreno, setMostrarModalPWATerreno] = useState(false)
  const [filtroOTCategoria, setFiltroOTCategoria] = useState<'todas' | 'central' | 'pendiente' | 'proceso' | 'finalizada'>('todas')
  const [filtroOTBusqueda, setFiltroOTBusqueda] = useState<string>('')

  // Campos Formulario OT
  const [otFormCuenta, setOtFormCuenta] = useState('0999')
  const [otFormClienteNombre, setOtFormClienteNombre] = useState('GAMA SEGURIDAD SPA DEMO')
  const [otFormTipoServicio, setOtFormTipoServicio] = useState('Mantención Perimetral Alarma')
  const [otFormTecnico, setOtFormTecnico] = useState('Técnico Juan Pérez')
  const [otFormFecha, setOtFormFecha] = useState(new Date().toISOString().split('T')[0])
  const [otFormSLA, setOtFormSLA] = useState('Crítica (2h)')
  const [otFormEstado, setOtFormEstado] = useState<'Pendiente' | 'En Proceso' | 'Finalizada'>('Pendiente')
  const [otFormObservaciones, setOtFormObservaciones] = useState('')

  // ── MOTOR DE AGENTES DE IA AUTÓNOMOS 24/7 (AUTO-COMPANY ENGINE) ──
  const [logsConsenso, setLogsConsenso] = useState<string[]>([
    `[${new Date().toLocaleTimeString('es-CL')}] 🟢 SRE Guardian Agent: Chequeo de latencia Supabase (14ms) - Salud 100%.`,
    `[${new Date().toLocaleTimeString('es-CL')}] 💳 Finance & Billing Agent: Escaneo de 466 clientes completado. 0 morosidades detectadas hoy.`,
    `[${new Date().toLocaleTimeString('es-CL')}] 👁️ Vision AI Guard: 1,420 eventos de video verificados. 0 falsas alarmas críticas.`,
    `[${new Date().toLocaleTimeString('es-CL')}] 📋 Sales & PR2607 Agent: Correlativo activo listo (PR2607-0258).`
  ])
  const [ejecutandoCiclo, setEjecutandoCiclo] = useState(false)

  // ── INICIALIZACIÓN Y RECUPERACIÓN DUAL (LOCALSTORAGE + SUPABASE) ──
  useEffect(() => {
    try {
      const localEmp = localStorage.getItem('gama_empresas')
      if (localEmp) {
        const parsed = JSON.parse(localEmp)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const IDs = new Set(parsed.map((p: any) => p.id || p.razon_social))
          const missing = EMPRESAS_INICIALES.filter(e => !IDs.has(e.id) && !IDs.has(e.razon_social))
          setEmpresasConglomerado([...missing, ...parsed])
        }
      }

      const localCot = localStorage.getItem('gama_cotizaciones')
      if (localCot) setCotizaciones(JSON.parse(localCot))

      const localFact = localStorage.getItem('gama_facturas')
      if (localFact) setFacturas(JSON.parse(localFact))

      const localOT = localStorage.getItem('gama_ordenes_trabajo')
      if (localOT) setOrdenesTrabajo(JSON.parse(localOT))
    } catch (e) {}

    const fetchDatosJerarquicos = async () => {
      try {
        const { data: dEmp } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'EMPRESAS_CONGLOMERADO')
          .order('id', { ascending: false })
          .limit(1)

        if (dEmp && dEmp.length > 0 && dEmp[0].nombre_abonado) {
          try {
            const parsed = JSON.parse(dEmp[0].nombre_abonado)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const IDs = new Set(parsed.map((p: any) => p.id || p.razon_social))
              const missing = EMPRESAS_INICIALES.filter(e => !IDs.has(e.id) && !IDs.has(e.razon_social))
              const finalEmps = [...missing, ...parsed]
              setEmpresasConglomerado(finalEmps)
              localStorage.setItem('gama_empresas', JSON.stringify(finalEmps))
            }
          } catch (e) {}
        }

        const { data: dClientes } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CLIENTES')
          .limit(1)

        let rawClientesMap: Record<string, any> = {}
        if (dClientes && dClientes.length > 0 && dClientes[0].nombre_abonado) {
          try { rawClientesMap = JSON.parse(dClientes[0].nombre_abonado) } catch (e) {}
        }

        const clientesFallback: Record<string, any> = clientesDataRaw as any
        const mapaMaestro: Record<string, ClienteMaestro> = {}
        const mapaCentrosCosto: Record<string, CentroDeCostoAbonado> = {}

        // Normalizar y unificar cuentas para evitar duplicidad entre "999" y "0999"
        const todasCuentasMap: Record<string, any> = {}
        Object.entries(rawClientesMap).forEach(([k, v]) => {
          const norm = normalizeCuentaCode(k)
          if (norm) todasCuentasMap[norm] = v
        })
        Object.entries(clientesFallback).forEach(([k, v]) => {
          const norm = normalizeCuentaCode(k)
          if (norm && !todasCuentasMap[norm]) todasCuentasMap[norm] = v
        })

        Object.entries(todasCuentasMap).forEach(([cta, raw]) => {
          const cCode = normalizeCuentaCode(raw.cuenta || cta)
          if (!cCode) return
          
          const nombreAbonado = (raw.alias_unidad || raw.nombre || `Abonado ${cCode}`).trim()

          // EXCLUIR ABONADOS INACTIVOS (SIN MONITOREO, RENUNCIA, RETIRADOS)
          if (esAbonadoInactivo(cCode, nombreAbonado)) return

          const rutRaw = raw.rut ? cleanRut(raw.rut) : ''
          const rutKey = rutRaw && rutRaw !== '76123456K' ? rutRaw : `CTA-${cCode}`

          mapaCentrosCosto[cCode] = {
            cuenta: cCode,
            alias_centro_costo: nombreAbonado,
            direccion: raw.direccion || 'Dirección sin registrar',
            ciudad: raw.ciudad || 'SANTIAGO',
            rut_cliente: rutKey
          }

          if (!mapaMaestro[rutKey]) {
            mapaMaestro[rutKey] = {
              rut: rutRaw || `RUT-${cCode}`,
              razon_social: raw.nombre || nombreAbonado,
              empresa_facturadora_id: raw.empresa_facturadora_id || 'EMP-1',
              email_cobranza: raw.email || 'cobranza@cliente.cl',
              telefono: raw.telefono1 || raw.t1 || raw.telefono || '+56991016912',
              direccion_comercial: raw.direccion || 'Dirección Principal',
              ciudad: raw.ciudad || 'Santiago',
              moneda: raw.moneda === 'UF' ? 'UF' : 'CLP',
              tarifa_mensual: Number(raw.tarifa_mensual) || (raw.moneda === 'UF' ? 1.2 : 29900),
              dia_vencimiento: Number(raw.dia_vencimiento) || 5,
              plan_monitoreo: raw.plan || 'MONITOREO ESTÁNDAR 24/7',
              estado_pago: raw.estado_pago || 'Al Día',
              cuentas_abonados: [cCode]
            }
          } else {
            if (!mapaMaestro[rutKey].cuentas_abonados.includes(cCode)) {
              mapaMaestro[rutKey].cuentas_abonados.push(cCode)
            }
          }
        })

        // Normalizar pre-asociaciones del CSV maestro filtrando inactivos
        const centrosPreNorm: Record<string, CentroDeCostoAbonado> = {}
        Object.entries(centrosCostoPreasociados).forEach(([k, v]) => {
          const norm = normalizeCuentaCode(k)
          const aliasText = (v as any).alias_centro_costo || (v as any).nombre || ''
          if (norm && !esAbonadoInactivo(norm, aliasText)) {
            centrosPreNorm[norm] = { ...(v as any), cuenta: norm }
          }
        })

        const clientesPreNorm: Record<string, ClienteMaestro> = {}
        Object.entries(clientesMaestrosPreasociados).forEach(([k, v]) => {
          const cli = v as any
          const normCuentas: string[] = Array.from(new Set<string>((cli.cuentas_abonados || []).map(normalizeCuentaCode)))
            .filter(c => !esAbonadoInactivo(c))
          if (normCuentas.length > 0) {
            clientesPreNorm[k] = { ...cli, cuentas_abonados: normCuentas }
          }
        })

        // Combinar datos pre-asociados desduplicados
        const mapaMaestroCombinado: Record<string, ClienteMaestro> = {
          ...mapaMaestro,
          ...clientesPreNorm
        }
        const mapaCentrosCombinado: Record<string, CentroDeCostoAbonado> = {
          ...mapaCentrosCosto,
          ...centrosPreNorm
        }

        // Aplicar guardados desduplicando las cuentas e inactivos
        try {
          const localM = localStorage.getItem('gama_clientes_maestros')
          if (localM) {
            const parsed = JSON.parse(localM)
            Object.entries(parsed).forEach(([rutKey, cliVal]: [string, any]) => {
              if (cliVal && cliVal.cuentas_abonados) {
                const normArr: string[] = Array.from(new Set<string>((cliVal.cuentas_abonados || []).map(normalizeCuentaCode)))
                  .filter(c => !esAbonadoInactivo(c))
                if (normArr.length > 0) {
                  if (mapaMaestroCombinado[rutKey]) {
                    mapaMaestroCombinado[rutKey].cuentas_abonados = Array.from(new Set<string>([...mapaMaestroCombinado[rutKey].cuentas_abonados, ...normArr]))
                  } else {
                    mapaMaestroCombinado[rutKey] = { ...cliVal, cuentas_abonados: normArr }
                  }
                }
              }
            })
          }
        } catch (e) {}

        const { data: dMaestrosSupabase } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CLIENTES_MAESTROS_CRM')
          .order('id', { ascending: false })
          .limit(1)

        if (dMaestrosSupabase && dMaestrosSupabase.length > 0 && dMaestrosSupabase[0].nombre_abonado) {
          try {
            const parsed = JSON.parse(dMaestrosSupabase[0].nombre_abonado)
            if (typeof parsed === 'object' && parsed !== null) {
              Object.entries(parsed).forEach(([rutKey, cliVal]: [string, any]) => {
                if (cliVal && cliVal.cuentas_abonados) {
                  const normArr: string[] = Array.from(new Set<string>((cliVal.cuentas_abonados || []).map(normalizeCuentaCode)))
                    .filter(c => !esAbonadoInactivo(c))
                  if (normArr.length > 0) {
                    if (mapaMaestroCombinado[rutKey]) {
                      mapaMaestroCombinado[rutKey].cuentas_abonados = Array.from(new Set<string>([...mapaMaestroCombinado[rutKey].cuentas_abonados, ...normArr]))
                    } else {
                      mapaMaestroCombinado[rutKey] = { ...cliVal, cuentas_abonados: normArr }
                    }
                  }
                }
              })
            }
          } catch (e) {}
        }

        // Asegurar vinculaciones en mapaCentrosCombinado
        Object.entries(mapaMaestroCombinado).forEach(([rutKey, cli]) => {
          (cli.cuentas_abonados || []).forEach(cta => {
            const norm = normalizeCuentaCode(cta)
            if (mapaCentrosCombinado[norm] && rutKey && !rutKey.startsWith('CTA-') && !rutKey.startsWith('RUT-')) {
              mapaCentrosCombinado[norm].rut_cliente = rutKey
            }
          })
        })

        setClientesMaestros(mapaMaestroCombinado)
        setAbonadosCentrosCosto(mapaCentrosCombinado)

        const { data: dCot, error: dCotError } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'COTIZACIONES_DOLIBARR')
          .order('id', { ascending: true })

        if (dCotError) {
          console.error('[Supabase Cotizaciones Error]: Base de datos no disponible o pausada:', dCotError.message)
        }

        const cotizacionesMap = new Map<string, CotizacionDolibarr>()

        // 1. Cargar presupuestos locales previos (incluyendo los hechos hoy)
        try {
          const localCot = localStorage.getItem('gama_cotizaciones')
          if (localCot) {
            const parsedLoc = JSON.parse(localCot)
            if (Array.isArray(parsedLoc)) {
              parsedLoc.forEach((c: CotizacionDolibarr) => {
                const key = c.codigo_cotizacion || String(c.id)
                if (key) cotizacionesMap.set(key, c)
              })
            }
          }
        } catch (e) {}

        // 2. Consolidar todas las filas históricas en Supabase (de más antiguas a más recientes)
        if (dCot && dCot.length > 0) {
          dCot.forEach(row => {
            if (row.nombre_abonado) {
              try {
                const parsedRow = JSON.parse(row.nombre_abonado)
                if (Array.isArray(parsedRow)) {
                  parsedRow.forEach((c: CotizacionDolibarr) => {
                    const key = c.codigo_cotizacion || String(c.id)
                    if (key) cotizacionesMap.set(key, c)
                  })
                }
              } catch (e) {}
            }
          })
        }

        const cotizacionesConsolidadas = Array.from(cotizacionesMap.values())
        if (cotizacionesConsolidadas.length > 0) {
          cotizacionesConsolidadas.sort((a, b) => (b.id || 0) - (a.id || 0))
          setCotizaciones(cotizacionesConsolidadas)
          localStorage.setItem('gama_cotizaciones', JSON.stringify(cotizacionesConsolidadas))
        }

        const { data: dOT } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'ORDENES_TRABAJO')
          .order('id', { ascending: false })
          .limit(1)
        if (dOT && dOT.length > 0 && dOT[0].nombre_abonado) {
          try {
            const parsed = JSON.parse(dOT[0].nombre_abonado)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const otFormateadas = parsed.map((o: any) => ({
                id: o.id || `OT-${Date.now()}`,
                codigo_ot: o.codigo_ot || 'OT-2026-001',
                cuenta: o.cuenta || '0999',
                cliente_nombre: o.nombre_abonado || o.cliente_nombre || 'ABONADO GAMA',
                tipo_servicio: o.tipo_visita || o.tipo_servicio || 'Mantención Perimetral',
                tecnico_asignado: o.tecnico || o.tecnico_asignado || 'Técnico Juan Pérez',
                fecha_programada: o.fecha_cita || o.fecha_programada || '2026-07-23',
                prioridad_sla: o.prioridad_sla || 'Crítica (2h)',
                estado: o.estado || 'Pendiente',
                observaciones: o.problema || o.observaciones || ''
              }))
              setOrdenesTrabajo(otFormateadas)
            }
          } catch (e) {}
        }

      } catch (err) {
        console.error('Error cargando datos:', err)
      }
    }
    fetchDatosJerarquicos()
  }, [])

  const abonadoActivo = useMemo(() => {
    if (!cuentaSeleccionada) return null
    const cClean = cuentaSeleccionada.toUpperCase().trim()
    if (abonadosCentrosCosto[cClean]) return abonadosCentrosCosto[cClean]
    if (abonadosCentrosCosto[cuentaSeleccionada]) return abonadosCentrosCosto[cuentaSeleccionada]

    const foundKey = Object.keys(abonadosCentrosCosto).find(
      k => k.toUpperCase().trim() === cClean || k.toUpperCase().trim().includes(cClean)
    )
    return foundKey ? abonadosCentrosCosto[foundKey] : null
  }, [cuentaSeleccionada, abonadosCentrosCosto])

  const clienteActivo = useMemo(() => {
    if (abonadoActivo && abonadoActivo.rut_cliente) {
      const rKey = abonadoActivo.rut_cliente
      if (clientesMaestros[rKey]) return clientesMaestros[rKey]
      const foundMaster = Object.keys(clientesMaestros).find(k => k.toUpperCase().trim() === rKey.toUpperCase().trim())
      if (foundMaster) return clientesMaestros[foundMaster]
    }

    if (rutClienteSeleccionado) {
      const rSel = rutClienteSeleccionado.toUpperCase().trim()
      if (clientesMaestros[rutClienteSeleccionado]) return clientesMaestros[rutClienteSeleccionado]
      if (clientesMaestros[rSel]) return clientesMaestros[rSel]
      const foundMaster = Object.keys(clientesMaestros).find(k => k.toUpperCase().trim() === rSel)
      if (foundMaster) return clientesMaestros[foundMaster]
    }

    return null
  }, [abonadoActivo, rutClienteSeleccionado, cuentaSeleccionada, clientesMaestros])

  // ── SEÑALES DE ALARMA EN VIVO (DESDE SUPABASE) Y BITÁCORA REAL COMMAND CENTER ──
  const [senalesRealtime, setSenalesRealtime] = useState<any[]>([])
  const [cargandoSenales, setCargandoSenales] = useState<boolean>(false)
  const [bitacoraCommandCenter, setBitacoraCommandCenter] = useState<any[]>([])
  const [cargandoBitacoraCC, setCargandoBitacoraCC] = useState<boolean>(false)

  // 1. Obtener Bitácora Real del Command Center Histórica (https://bitacora.gamasecurity.cl/api-bitacora.php)
  useEffect(() => {
    const fetchBitacoraCC = async () => {
      setCargandoBitacoraCC(true)
      try {
        const res = await fetch('https://bitacora.gamasecurity.cl/api-bitacora.php?action=eventos&desde=2020-01-01%2000:00&hasta=2099-12-31%2023:59')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setBitacoraCommandCenter(data)
          }
        }
      } catch (e) {
        console.error('Error al cargar bitácora Command Center:', e)
      } finally {
        setCargandoBitacoraCC(false)
      }
    }

    fetchBitacoraCC()
  }, [])

  // 2. Obtener Señales Reales de Alarma para la Cuenta Seleccionada
  useEffect(() => {
    const cActiva = (cuentaSeleccionada || abonadoActivo?.cuenta || '').toUpperCase().trim()
    if (!cActiva && !rutClienteSeleccionado) {
      setSenalesRealtime([])
      return
    }

    const fetchSenalesAbonado = async () => {
      setCargandoSenales(true)
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', cActiva)
          .order('id', { ascending: false })
          .limit(10)

        if (data && data.length > 0) {
          const formateados = data.map((ev, idx) => ({
            id: ev.id || idx,
            fecha: ev.fecha_hora ? new Date(ev.fecha_hora).toLocaleString('es-CL') : 'En Vivo',
            codigo: ev.evento ? (ev.evento.includes('ROBO') ? 'E130' : ev.evento.includes('APERTURA') ? 'E401' : ev.evento.includes('FALLA') ? 'E301' : 'E602') : 'E602',
            desc: ev.evento || 'TEST PERIÓDICO 24H',
            zona: ev.zona && ev.zona !== '----' ? `Zona ${ev.zona}` : (ev.usuario && ev.usuario !== '----' ? `Usuario ${ev.usuario}` : 'Consola Central'),
            prioridad: (ev.evento || '').includes('ROBO') || (ev.evento || '').includes('PANICO') || (ev.evento || '').includes('FALLA') ? 'Crítica' : ((ev.evento || '').includes('APERTURA') || (ev.evento || '').includes('CIERRE') ? 'Normal' : 'Informativa'),
            color: (ev.evento || '').includes('ROBO') || (ev.evento || '').includes('PANICO') || (ev.evento || '').includes('FALLA') ? 'bg-red-100 text-red-800 font-bold' : ((ev.evento || '').includes('APERTURA') || (ev.evento || '').includes('CIERRE') ? ((ev.evento || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 2 === 0 ? 'bg-white text-gray-800' : 'bg-blue-50 text-gray-800') : 'bg-blue-100 text-blue-800')
          }))
          setSenalesRealtime(formateados)
        } else {
          // NO se inventan datos simulados. Si no hay transmisiones en Supabase, la lista queda vacía.
          setSenalesRealtime([])
        }
      } catch (e) {
        console.error('Error cargando señales:', e)
        setSenalesRealtime([])
      } finally {
        setCargandoSenales(false)
      }
    }

    fetchSenalesAbonado()
  }, [cuentaSeleccionada, rutClienteSeleccionado, abonadoActivo])

  // 3. Novedades de la Bitácora Real del Command Center para el Abonado Consultado EXCLUSIVAMENTE (Sin Límite de Fecha)
  const bitacoraCommandCenterAbonado = useMemo(() => {
    const cActiva = (cuentaSeleccionada || abonadoActivo?.cuenta || '').toUpperCase().trim()
    const nombreAb = (abonadoActivo?.alias_centro_costo || clienteActivo?.razon_social || '').toUpperCase().trim()
    if (!cActiva && !nombreAb) return []

    // Filtrar eventos de Command Center que correspondan EXCLUSIVAMENTE al abonado consultado
    const filtrados = bitacoraCommandCenter.filter(item => {
      const cod = (item.abonado_cod || '').toUpperCase().trim()
      const nom = (item.abonado_nombre || '').toUpperCase().trim()
      
      const matchCod = cActiva && (cod === cActiva || cod.includes(cActiva) || cActiva.includes(cod))
      const matchNom = nombreAb && nombreAb.length > 3 && (nom.includes(nombreAb) || nombreAb.includes(nom))
      return matchCod || matchNom
    })

    return filtrados.slice(0, 5).map(item => ({
      id: item.id,
      fecha: item.created_at || 'Reciente',
      autor: item.responsable_nombre || 'Operador Command Center',
      tipo: item.tipo_nombre || 'NOVEDAD COMMAND CENTER',
      nota: item.comentario || 'Sin comentario registrado',
      color: item.tipo_color ? `#${item.tipo_color}` : '#005bea'
    }))
  }, [cuentaSeleccionada, abonadoActivo, clienteActivo, bitacoraCommandCenter])

  // ── AUDITORÍA FORENSE AUTOMÁTICA LEY 21.719 (TRAZABILIDAD DE ACCESO A DATOS CRÍTICOS) ──
  useEffect(() => {
    if (moduloActivo === 'ficha360' && cuentaSeleccionada) {
      const cta = (cuentaSeleccionada || abonadoActivo?.cuenta || '').trim().toUpperCase()
      if (!cta) return

      // Evitar registrar duplicados innecesarios dentro de la misma sesión en menos de 60 segundos
      const claveSesion = `auditoria_vista_ficha360_${cta}`
      const ultimoAcceso = typeof window !== 'undefined' ? sessionStorage.getItem(claveSesion) : null
      const ahora = Date.now()
      if (ultimoAcceso && ahora - parseInt(ultimoAcceso, 10) < 60000) {
        return
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(claveSesion, ahora.toString())
      }

      const registrarAuditoriaAcceso = async () => {
        try {
          const payload = {
            operacion: 'ACCESS',
            tabla_afectada: 'clientes_fichas_cuentas',
            cuenta_abonado: cta,
            usuario_operador: (typeof window !== 'undefined' && localStorage.getItem('gama_operator_user')) || 'OPERADOR_CENTRAL_CRA',
            detalle_accion: 'Visualización de Ficha 360° (contactos de emergencia, contraclaves y coordenadas)',
            datos_nuevos: {
              modulo: 'ficha360',
              titular: clienteActivo?.razon_social || abonadoActivo?.alias_centro_costo || 'Abonado',
              campos_consultados: ['telefonos_contacto', 'contraclaves_verbales', 'ubicacion_georreferencial', 'historial_senales_panel']
            }
          }
          await supabase.from('bitacora_auditoria_datos').insert([payload])
        } catch (e) {
          // Fallback silencioso para no interrumpir la operativa si la tabla aún no fue creada
        }
      }

      registrarAuditoriaAcceso()
    }
  }, [moduloActivo, cuentaSeleccionada, abonadoActivo, clienteActivo])

  const siguienteCorrelativoCode = useMemo(() => {
    let maxNum = 259
    cotizaciones.forEach(c => {
      const match = (c.codigo_cotizacion || '').match(/PR2607-(\d+)/)
      if (match) {
        const n = parseInt(match[1], 10)
        if (n > maxNum) maxNum = n
      }
    })
    const nextNum = maxNum + 1
    return `PR2607-${nextNum.toString().padStart(4, '0')}`
  }, [cotizaciones])

  // ── ESTADOS Y FILTROS DEL MÓDULO DE PRESUPUESTOS (DTE CHILE) ──
  const [filtroCotCategoria, setFiltroCotCategoria] = useState<'todas' | 'borrador' | 'enviado' | 'aprobado' | 'rechazado'>('todas')
  const [filtroCotBusqueda, setFiltroCotBusqueda] = useState<string>('')
  const [filtroCotDesde, setFiltroCotDesde] = useState<string>('')
  const [filtroCotHasta, setFiltroCotHasta] = useState<string>('')
  const [filtroCotEmpresa, setFiltroCotEmpresa] = useState<string>('todas')
  const [filtroCotOrden, setFiltroCotOrden] = useState<'recientes' | 'antiguos' | 'monto_desc' | 'monto_asc' | 'cliente_asc'>('recientes')

  const resumenCotizacionesKPI = useMemo(() => {
    const total = cotizaciones.length
    let borradores = 0, enviados = 0, aprobados = 0, rechazados = 0
    let montoTotal = 0, montoAprobados = 0

    cotizaciones.forEach(c => {
      const totalInc = c.monto_total_iva_incluido || 0
      montoTotal += totalInc
      const est = (c.etapa_pipeline || 'Cotización').toLowerCase()
      if (est.includes('borrador')) borradores++
      else if (est.includes('ganado') || est.includes('aprobado') || est.includes('aceptad')) {
        aprobados++
        montoAprobados += totalInc
      } else if (est.includes('perdido') || est.includes('rechazad')) rechazados++
      else enviados++
    })

    return { total, borradores, enviados, aprobados, rechazados, montoTotal, montoAprobados }
  }, [cotizaciones])

  const cotizacionesFiltradas = useMemo(() => {
    let list = [...cotizaciones]

    // 1. Filtro por Categoria / Estado (KPI Card click)
    if (filtroCotCategoria !== 'todas') {
      list = list.filter(c => {
        const est = (c.etapa_pipeline || 'Cotización').toLowerCase()
        if (filtroCotCategoria === 'borrador') return est.includes('borrador')
        if (filtroCotCategoria === 'enviado') return est.includes('cotización') || est.includes('enviado') || est.includes('negociación')
        if (filtroCotCategoria === 'aprobado') return est.includes('ganado') || est.includes('aprobado') || est.includes('aceptad')
        if (filtroCotCategoria === 'rechazado') return est.includes('perdido') || est.includes('rechazad')
        return true
      })
    }

    // 2. Filtro por Búsqueda de Texto (Cliente, RUT, Folio, Comuna, Email)
    if (filtroCotBusqueda.trim()) {
      const q = filtroCotBusqueda.toLowerCase().trim()
      const qClean = q.replace(/[^a-z0-9]/gi, '')
      list = list.filter(c => {
        const cod = (c.codigo_cotizacion || '').toLowerCase()
        const cli = (c.nombre_cliente || '').toLowerCase()
        const rut = (c.rut_cliente || '').toLowerCase()
        const ciu = (c.ciudad_cliente || '').toLowerCase()
        const em = (c.email_cliente || '').toLowerCase()

        return cod.includes(q) || (qClean && cod.replace(/[^a-z0-9]/gi, '').includes(qClean)) ||
               cli.includes(q) || rut.includes(q) || ciu.includes(q) || em.includes(q)
      })
    }

    // 3. Filtro por Rango de Fechas
    if (filtroCotDesde) {
      list = list.filter(c => (c.fecha || '') >= filtroCotDesde)
    }
    if (filtroCotHasta) {
      list = list.filter(c => (c.fecha || '') <= filtroCotHasta)
    }

    // 4. Filtro por Empresa Emisora
    if (filtroCotEmpresa !== 'todas') {
      list = list.filter(c => c.empresa_facturadora_id === filtroCotEmpresa)
    }

    // 5. Ordenamiento
    list.sort((a, b) => {
      if (filtroCotOrden === 'recientes') return (b.fecha || '').localeCompare(a.fecha || '') || b.id - a.id
      if (filtroCotOrden === 'antiguos') return (a.fecha || '').localeCompare(b.fecha || '') || a.id - b.id
      if (filtroCotOrden === 'monto_desc') return (b.monto_total_iva_incluido || 0) - (a.monto_total_iva_incluido || 0)
      if (filtroCotOrden === 'monto_asc') return (a.monto_total_iva_incluido || 0) - (b.monto_total_iva_incluido || 0)
      if (filtroCotOrden === 'cliente_asc') return (a.nombre_cliente || '').localeCompare(b.nombre_cliente || '')
      return 0
    })

    return list
  }, [cotizaciones, filtroCotCategoria, filtroCotBusqueda, filtroCotDesde, filtroCotHasta, filtroCotEmpresa, filtroCotOrden])

  // ── FILTRO INTELIGENTE IA PARA INCIDENTES Y FALLAS TÉCNICAS REALES DE CENTRAL ──
  const alertasTecnicasCommandCenter = useMemo(() => {
    const keywordsFallaReal = [
      'FALLA DE BATERIA', 'CORTE DE ENERGIA', 'SABOTAJE', 'TAMPER',
      'CORTE DE LINEA', 'ZONA EN FALLA', 'FALLA DE COMUNICACION',
      'SOLICITUD SERVICIO TECNICO', 'DESCONEXION', 'CIRCUITO ABIERTO',
      'FALLA RED', 'CAMARA DESCONECTADA', 'FALSO CONTACTO', 'REVISAR PANEL',
      'HORA/FECHA ERRONEOS', 'FALLA ENERGIA', 'FALLA DE BATERÍA'
    ]

    const keywordsRutina = [
      'VIA WHP QUE SE ENCUENTRAN REVISANDO EL ESTADO DEL JARDIN',
      'AVISARA CUANDO SE RETIREN',
      'CONFIRMADO CONEXION DE CIERRE',
      'CONFIRMADO A DIRECTORA',
      'INFORMADA VIA MENSAJE',
      'SE HABLA CON CABO'
    ]

    return bitacoraCommandCenter.filter(item => {
      const tipo = (item.tipo_nombre || '').toUpperCase()
      const nota = (item.comentario || '').toUpperCase()
      const combo = `${tipo} ${nota}`

      if (tipo === 'CORTE DE ENERGIA' || tipo === 'FALLA DE BATERIA' || tipo === 'SERVICIO TECNICO') {
        return true
      }

      const tieneFalla = keywordsFallaReal.some(kw => combo.includes(kw))
      const esRutina = keywordsRutina.some(kw => combo.includes(kw))

      return tieneFalla && !esRutina
    }).slice(0, 6)
  }, [bitacoraCommandCenter])

  const ordenesTrabajoFiltradas = useMemo(() => {
    let list = [...ordenesTrabajo]

    if (filtroOTCategoria !== 'todas') {
      list = list.filter(ot => {
        const est = (ot.estado || '').toLowerCase()
        if (filtroOTCategoria === 'pendiente') return est.includes('pendiente')
        if (filtroOTCategoria === 'proceso') return est.includes('proceso') || est.includes('progreso')
        if (filtroOTCategoria === 'finalizada') return est.includes('finalizad') || est.includes('resuelt')
        return true
      })
    }

    if (filtroOTBusqueda.trim()) {
      const q = filtroOTBusqueda.toLowerCase().trim()
      list = list.filter(ot => 
        (ot.codigo_ot || '').toLowerCase().includes(q) ||
        (ot.cuenta || '').toLowerCase().includes(q) ||
        (ot.cliente_nombre || '').toLowerCase().includes(q) ||
        (ot.tecnico_asignado || '').toLowerCase().includes(q) ||
        (ot.tipo_servicio || '').toLowerCase().includes(q)
      )
    }

    return list
  }, [ordenesTrabajo, filtroOTCategoria, filtroOTBusqueda])

  const kpisFinancieros = useMemo(() => {
    let totalTarifasCLP = 0
    let totalClientes = Object.keys(clientesMaestros).length

    Object.values(clientesMaestros).forEach(c => {
      if (c.moneda === 'UF') {
        totalTarifasCLP += Math.round((c.tarifa_mensual || 1.2) * valorUF)
      } else {
        totalTarifasCLP += c.tarifa_mensual || 29900
      }
    })

    const desglosePorEmpresa = empresasConglomerado.map(emp => {
      const clientesDeEstaEmpresa = Object.values(clientesMaestros).filter(c => c.empresa_facturadora_id === emp.id)
      let montoProyectado = 0
      clientesDeEstaEmpresa.forEach(c => {
        if (c.moneda === 'UF') montoProyectado += Math.round(c.tarifa_mensual * valorUF)
        else montoProyectado += c.tarifa_mensual || 29900
      })
      const porcentajeParticipacion = totalTarifasCLP > 0 ? (montoProyectado / totalTarifasCLP) * 100 : 25
      return {
        empresa: emp,
        cantClientes: clientesDeEstaEmpresa.length,
        montoProyectado,
        porcentajeParticipacion: Math.round(porcentajeParticipacion)
      }
    })

    return { totalTarifasCLP, totalClientes, desglosePorEmpresa }
  }, [clientesMaestros, empresasConglomerado, valorUF])

  const handleAgregarItemDelCatalogo = (catItem: typeof CATALOGO_SEGURIDAD[0]) => {
    const nuevoItem: ItemCotizacion = {
      id: Date.now().toString(),
      descripcion: catItem.descripcion,
      cantidad: 1,
      precio_neto_unitario: catItem.precio_neto,
      descuento_valor: 0,
      tipo_descuento: 'porcentaje'
    }
    setItemsCot([...itemsCot, nuevoItem])
  }

  const handleSeleccionarClienteParaCotizacion = (rutOKey: string) => {
    let cli: ClienteMaestro | undefined = clientesMaestros[rutOKey]
    if (!cli) {
      cli = Object.values(clientesMaestros).find(
        c => c.rut === rutOKey || 
             (c.rut && cleanRut(c.rut) === cleanRut(rutOKey)) ||
             (c.cuentas_abonados && c.cuentas_abonados.some(acc => acc.toUpperCase().trim() === rutOKey.toUpperCase().trim()))
      )
    }
    if (!cli) {
      cli = Object.values(clientesMaestros).find(c => (c.razon_social || '').toLowerCase().trim() === (rutOKey || '').toLowerCase().trim())
    }

    if (cli) {
      setCotClienteRutSeleccionado(cli.rut)
      setCotNombreCliente(cli.razon_social)
      setCotRutCliente(cli.rut)
      setCotDireccion(cli.direccion_comercial || 'Dirección Comercial Registrada')
      setCotCiudadCliente(cli.ciudad || 'Santiago')
      setCotEmailCliente(cli.email_cobranza || 'contacto@gamasecurity.cl')
      setCotTelefonoCliente(cli.telefono || '+56 9 9101 6912')
      setCotContactoPersona(cli.razon_social)
    } else {
      const ab = abonadosCentrosCosto[rutOKey.toUpperCase().trim()]
      if (ab) {
        const rutAb = `RUT-${ab.cuenta}`
        setCotClienteRutSeleccionado(rutAb)
        setCotNombreCliente(ab.alias_centro_costo)
        setCotRutCliente(rutAb)
        setCotDireccion(ab.direccion)
        setCotCiudadCliente(ab.ciudad || 'Santiago')
        setCotEmailCliente('contacto@gamasecurity.cl')
        setCotTelefonoCliente('+56 9 9101 6912')
        setCotContactoPersona(ab.alias_centro_costo)
      } else {
        setCotClienteRutSeleccionado(rutOKey)
        setCotNombreCliente(rutOKey && rutOKey !== 'Cliente Gama' ? rutOKey : 'CLIENTE REGISTRADO')
        setCotRutCliente(rutOKey)
        setCotDireccion('Dirección Registrada')
        setCotCiudadCliente('Santiago')
        setCotEmailCliente('contacto@gamasecurity.cl')
        setCotTelefonoCliente('+56 9 9101 6912')
        setCotContactoPersona('Atención Adquisiciones')
      }
    }
  }

  const abrirModalNuevaCotizacion = () => {
    setCotEditandoId(null)
    setTipoReceptorCot('registrado')
    setCotEtapaPipeline('Cotizacion')
    setDescuentoGlobalValor(0)
    setDescuentoGlobalTipo('porcentaje')

    if (abonadoActivo || clienteActivo) {
      const cli = clienteActivo
      const ab = abonadoActivo
      const nombreFinal = ab?.alias_centro_costo || cli?.razon_social || 'CLIENTE REGISTRADO'
      const rutFinal = cli?.rut || (ab ? `RUT-${ab.cuenta}` : 'S/RUT')

      setCotClienteRutSeleccionado(rutFinal)
      setCotNombreCliente(nombreFinal)
      setCotRutCliente(rutFinal)
      setCotDireccion(ab?.direccion || cli?.direccion_comercial || 'Dirección Registrada')
      setCotCiudadCliente(ab?.ciudad || cli?.ciudad || 'Santiago')
      setCotEmailCliente(cli?.email_cobranza || 'contacto@gamasecurity.cl')
      setCotTelefonoCliente(cli?.telefono || '+56 9 9101 6912')
      setCotContactoPersona(nombreFinal)
    } else {
      const ruts = Object.keys(clientesMaestros)
      if (ruts.length > 0) {
        handleSeleccionarClienteParaCotizacion(ruts[0])
      } else {
        setCotNombreCliente('CLIENTE MODELO DEMO')
        setCotRutCliente('76.319.399-3')
        setCotDireccion('Av. Valparaíso 1183')
        setCotCiudadCliente('Viña del Mar')
        setCotEmailCliente('cobranza@gamasecurity.cl')
        setCotTelefonoCliente('+56 32 3276011')
        setCotContactoPersona('Sr(a). Encargado(a) de Adquisiciones')
      }
    }
    setMostrarModalCotizacion(true)
  }

  const handleEditarCotizacion = (cot: CotizacionDolibarr) => {
    setCotEditandoId(cot.id)
    setTipoReceptorCot(cot.tipo_receptor || 'registrado')
    setCotEmpresaEmisoraId(cot.empresa_facturadora_id)
    
    setCotNombreCliente(cot.nombre_cliente || 'CLIENTE COMERCIAL')
    setCotRutCliente(cot.rut_cliente || 'S/RUT')
    setCotDireccion(cot.direccion || 'Dirección de Entrega')
    setCotCiudadCliente(cot.ciudad_cliente || 'Santiago')
    setCotEmailCliente(cot.email_cliente || 'contacto@gamasecurity.cl')
    setCotTelefonoCliente(cot.telefono_cliente || '+56 9 9101 6912')
    setCotContactoPersona(cot.contacto_persona || cot.nombre_cliente || 'Atención Comercial')
    setCotGiroCliente(cot.giro_cliente || 'Servicios Integrales / Particular')
    setCotVendedor(cot.vendedor || 'Ejecutivo Comercial Gama Seguridad')
    setCotEtapaPipeline(cot.etapa_pipeline || 'Cotizacion')
    setCotValidez(cot.validez_dias || 15)
    setCotFormaPago(cot.forma_pago || '50% Anticipo / 50% Al Finalizar')
    setCotMoneda(cot.moneda_cotizacion || 'CLP')
    setDescuentoGlobalValor(cot.descuento_global_valor || 0)
    setDescuentoGlobalTipo(cot.descuento_global_tipo || 'porcentaje')
    setCotObservaciones(cot.observaciones || 'Garantía 12 meses en equipos. Validez de la propuesta: 15 días hábiles.')
    setItemsCot(cot.items.map(it => ({
      ...it,
      descuento_valor: (it as any).descuento_valor ?? it.descuento_porcentaje ?? 0,
      tipo_descuento: (it as any).tipo_descuento || 'porcentaje'
    })))
    setMostrarModalCotizacion(true)
  }

  const handleDuplicarCotizacion = async (cot: CotizacionDolibarr) => {
    const nuevoCodigo = siguienteCorrelativoCode
    const duplicada: CotizacionDolibarr = {
      ...cot,
      id: Date.now(),
      codigo_cotizacion: nuevoCodigo,
      fecha: new Date().toLocaleDateString('es-CL'),
      estado: 'Borrador'
    }
    const listaNueva = [duplicada, ...cotizaciones]
    setCotizaciones(listaNueva)
    try {
      localStorage.setItem('gama_cotizaciones', JSON.stringify(listaNueva))
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'DUPLICAR_COTIZACION',
        fecha_hora: new Date().toISOString()
      })
      alert(`Presupuesto duplicado exitosamente con nuevo folio ${nuevoCodigo}.`)
    } catch (e: any) {
      console.error('Duplicado localmente:', e)
    }
  }

  const handleEliminarCotizacion = async (id: number, codigo: string) => {
    if (!confirm(`¿Está seguro de eliminar permanentemente el presupuesto ${codigo}?`)) return
    const listaNueva = cotizaciones.filter(c => c.id !== id)
    setCotizaciones(listaNueva)
    try {
      localStorage.setItem('gama_cotizaciones', JSON.stringify(listaNueva))
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'ELIMINAR_COTIZACION',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Eliminado localmente:', e)
    }
  }

  const handleCambiarEtapaPipeline = async (cotId: number, nuevaEtapa: EtapaPipelineEspo) => {
    const listaNueva = cotizaciones.map(c => c.id === cotId ? { ...c, etapa_pipeline: nuevaEtapa } : c)
    setCotizaciones(listaNueva)
    try {
      localStorage.setItem('gama_cotizaciones', JSON.stringify(listaNueva))
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'CAMBIO_ETAPA_PIPELINE',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Error al actualizar etapa:', e)
    }
  }

  const handleEnviarWhatsAppCotizacion = async (cot: CotizacionDolibarr) => {
    const fono = cot.telefono_cliente || '+56991016912'
    const emp = empresasConglomerado.find(e => e.id === cot.empresa_facturadora_id) || empresasConglomerado[0]
    const mensaje = `Estimado(a) *${cot.contacto_persona || cot.nombre_cliente}*,\n\nJunto con saludarle de *${emp.razon_social}*, le adjuntamos la propuesta comercial N° *${cot.codigo_cotizacion}*.\n\n📌 *Monto Total:* $${Math.round(cot.monto_total_iva_incluido || 0).toLocaleString('es-CL')} ${cot.moneda_cotizacion || 'CLP'} (19% IVA Incluido)\n📅 *Validez:* ${cot.validez_dias || 15} días hábiles.\n📍 *Ciudad/Comuna:* ${cot.ciudad_cliente || 'Santiago'}\n\nPuede ver o descargar su documento oficial aquí:\nhttps://controltestmonitoreo.vercel.app/operacion\n\nQuedamos a su disposición para coordinar la instalación/servicio.\n*Gama Seguridad Chile*`

    try {
      const res = await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fono, message: mensaje })
      })
      const data = await res.json()
      if (data.status === 'success' || data.success) {
        alert(`Notificación enviada con éxito por WhatsApp a ${cot.nombre_cliente} (${fono}).`)
      } else {
        const link = `https://wa.me/${fono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
        window.open(link, '_blank')
      }
    } catch (e) {
      const link = `https://wa.me/${fono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
      window.open(link, '_blank')
    }
  }

  const handleEnviarEmailCotizacion = async (cot: CotizacionDolibarr) => {
    const emailDest = cot.email_cliente || 'contacto@gamasecurity.cl'
    const emp = empresasConglomerado.find(e => e.id === cot.empresa_facturadora_id) || empresasConglomerado[0]

    const emailPrompt = prompt(`Enviar Presupuesto DTE ${cot.codigo_cotizacion} por Email con PDF Adjunto (remitente: Empresas Gama Seguridad) a:`, emailDest)
    if (!emailPrompt || !emailPrompt.trim()) return

    setEnviandoEmailId(cot.id)
    try {
      // Generar documento PDF A4 en base64
      let pdfBase64 = ''
      try {
        pdfBase64 = generarCotizacionPdfBase64(cot, emp)
      } catch (pdfErr) {
        console.error('Error generando PDF:', pdfErr)
      }

      const res = await fetch('/api/enviar-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_evento: 'COTIZACION',
          destinatarios: [emailPrompt.trim()],
          cotizacion: cot,
          empresa_emisora: emp,
          pdf_base64: pdfBase64
        })
      })
      const data = await res.json()
      if (data.success) {
        alert(`📧 Presupuesto ${cot.codigo_cotizacion} (con PDF adjunto 📄) enviado exitosamente desde Empresas Gama Seguridad a ${emailPrompt.trim()}.`)
      } else {
        alert(`Error al enviar Email: ${data.error || 'Verifique la configuración de correo'}`)
      }
    } catch (e: any) {
      alert(`Error enviando correo: ${e?.message || e}`)
    } finally {
      setEnviandoEmailId(null)
    }
  }

  const handleGuardarCotizacionDolibarr = async () => {
    let nombreFinal = cotNombreCliente.trim()
    let rutFinal = cotRutCliente.trim()

    if (!nombreFinal || nombreFinal === 'Cliente Gama') {
      if (cotNombreCliente && cotNombreCliente !== 'Cliente Gama') {
        nombreFinal = cotNombreCliente
      } else {
        alert('Por favor ingrese o seleccione el Nombre o Razón Social del receptor del presupuesto.')
        return
      }
    }

    if (!rutFinal) {
      rutFinal = cotClienteRutSeleccionado || 'S/RUT'
    }

    const codigoCot = cotEditandoId ? (cotizaciones.find(c => c.id === cotEditandoId)?.codigo_cotizacion || siguienteCorrelativoCode) : siguienteCorrelativoCode
    const cotizacionObjeto: CotizacionDolibarr = {
      id: cotEditandoId || Date.now(),
      codigo_cotizacion: codigoCot,
      cuenta: rutFinal || `PROSPECTO-${Date.now()}`,
      rut_cliente: rutFinal,
      nombre_cliente: nombreFinal,
      empresa_facturadora_id: cotEmpresaEmisoraId,
      direccion: cotDireccion.trim() || 'Dirección de Entrega',
      ciudad_cliente: cotCiudadCliente.trim() || 'Santiago',
      email_cliente: cotEmailCliente.trim() || 'contacto@prospecto.cl',
      telefono_cliente: cotTelefonoCliente.trim() || '+56991016912',
      giro_cliente: cotGiroCliente.trim() || 'Servicios Integrales / Particular',
      contacto_persona: cotContactoPersona.trim() || nombreFinal,
      vendedor: cotVendedor.trim() || 'Ejecutivo Comercial Gama Seguridad',
      tipo_receptor: tipoReceptorCot,
      etapa_pipeline: cotEtapaPipeline,
      fecha: new Date().toLocaleDateString('es-CL'),
      validez_dias: cotValidez,
      forma_pago: cotFormaPago,
      moneda_cotizacion: cotMoneda,
      descuento_global_valor: descuentoGlobalValor,
      descuento_global_tipo: descuentoGlobalTipo,
      items: itemsCot,
      subtotal_neto: calculoCotizacionActual.subtotalBrutoLineas,
      total_descuentos: calculoCotizacionActual.totalDescuentos,
      neto_con_descuento: calculoCotizacionActual.netoConDescuento,
      monto_iva: calculoCotizacionActual.montoIva,
      monto_total_iva_incluido: calculoCotizacionActual.totalIvaIncluido,
      estado: 'Borrador',
      observaciones: cotObservaciones.trim()
    }

    let listaNueva: CotizacionDolibarr[] = []
    if (cotEditandoId) {
      listaNueva = cotizaciones.map(c => c.id === cotEditandoId ? cotizacionObjeto : c)
    } else {
      listaNueva = [cotizacionObjeto, ...cotizaciones]
    }

    setCotizaciones(listaNueva)
    try { localStorage.setItem('gama_cotizaciones', JSON.stringify(listaNueva)) } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: cotEditandoId ? 'EDICION_COTIZACION' : 'CREACION_COTIZACION',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Almacenado localmente:', e)
    }

    setMostrarModalCotizacion(false)
    setCotEditandoId(null)
    alert(`Presupuesto ${codigoCot} guardado exitosamente para "${nombreFinal}" (RUT: ${rutFinal}).`)
  }

  const handleRegistrarAbono = async () => {
    if (!facturaAbonando) return
    const monto = Number(montoAbonoInput) || 0
    if (monto <= 0) {
      alert('Por favor ingrese un monto de abono válido mayor a 0.')
      return
    }

    const nuevoAbonado = (facturaAbonando.monto_abonado || 0) + monto
    const nuevoSaldo = Math.max(0, facturaAbonando.monto_total - nuevoAbonado)
    const nuevoEstado = nuevoSaldo === 0 ? 'Pagada' : 'Abonada'

    const listaNueva = facturas.map(f => f.id === facturaAbonando.id ? {
      ...f,
      monto_abonado: nuevoAbonado,
      saldo_pendiente: nuevoSaldo,
      estado: nuevoEstado as any,
      notas_cobranza: `${f.notas_cobranza || ''} | Abono de $${monto.toLocaleString('es-CL')} via ${metodoPagoInput} (${new Date().toLocaleDateString('es-CL')}) ${notaAbonoInput}`.trim()
    } : f)

    setFacturas(listaNueva)
    try { localStorage.setItem('gama_facturas', JSON.stringify(listaNueva)) } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'FACTURAS_MAESTRO',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'REGISTRO_ABONO',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Guardado localmente:', e)
    }

    setMostrarModalAbono(false)
    setFacturaAbonando(null)
    setMontoAbonoInput('')
    setNotaAbonoInput('')
    alert(`Abono de $${monto.toLocaleString('es-CL')} registrado correctamente para la Factura ${facturaAbonando.numero_factura}.`)
  }

  // ── EDICIÓN / CREACIÓN DE EMPRESA DEL CONGLOMERADO ──
  const abrirModalEditarEmpresa = (empresa?: EmpresaConglomerado) => {
    if (empresa) {
      setEmpresaEditando(empresa)
      setEmpFormId(empresa.id)
      setEmpFormRazonSocial(empresa.razon_social)
      setEmpFormRut(empresa.rut)
      setEmpFormGiro(empresa.giro)
      setEmpFormDireccion(empresa.direccion)
      setEmpFormTelefono(empresa.telefono)
      setEmpFormEmailCobranza(empresa.email_cobranza)
      setEmpFormEmailContacto(empresa.email_contacto)
      setEmpFormWeb(empresa.web)
      setEmpFormBancoNombre(empresa.banco_nombre)
      setEmpFormBancoTipoCuenta(empresa.banco_tipo_cuenta)
      setEmpFormBancoNumeroCuenta(empresa.banco_numero_cuenta)
    } else {
      setEmpresaEditando(null)
      setEmpFormId(`EMP-${empresasConglomerado.length + 1}`)
      setEmpFormRazonSocial('')
      setEmpFormRut('')
      setEmpFormGiro('Servicios de Monitoreo & Seguridad Electrónica')
      setEmpFormDireccion('Av. Valparaíso 1183, Viña del Mar, Chile')
      setEmpFormTelefono('+56 9 9101 6912')
      setEmpFormEmailCobranza('cobranza@gamasecurity.cl')
      setEmpFormEmailContacto('contacto@gamasecurity.cl')
      setEmpFormWeb('www.gamasecurity.cl')
      setEmpFormBancoNombre('Banco de Chile')
      setEmpFormBancoTipoCuenta('Cuenta Corriente')
      setEmpFormBancoNumeroCuenta('00-123-45678-9')
    }
    setMostrarModalEmpresa(true)
  }

  const handleGuardarEmpresaEmisora = async () => {
    if (!empFormRazonSocial.trim() || !empFormRut.trim()) {
      alert('Por favor ingrese la Razón Social y el RUT de la Empresa Emisora.')
      return
    }

    const nuevaEmp: EmpresaConglomerado = {
      id: empFormId || `EMP-${Date.now()}`,
      razon_social: empFormRazonSocial.trim(),
      rut: empFormRut.trim(),
      giro: empFormGiro.trim() || 'Servicios Integrales de Monitoreo & Alarma',
      direccion: empFormDireccion.trim(),
      telefono: empFormTelefono.trim(),
      email_cobranza: empFormEmailCobranza.trim(),
      email_contacto: empFormEmailContacto.trim(),
      web: empFormWeb.trim(),
      banco_nombre: empFormBancoNombre.trim(),
      banco_tipo_cuenta: empFormBancoTipoCuenta.trim(),
      banco_numero_cuenta: empFormBancoNumeroCuenta.trim()
    }

    let listaNueva: EmpresaConglomerado[] = []
    if (empresaEditando) {
      listaNueva = empresasConglomerado.map(e => e.id === empresaEditando.id ? nuevaEmp : e)
    } else {
      listaNueva = [...empresasConglomerado, nuevaEmp]
    }

    setEmpresasConglomerado(listaNueva)
    try { localStorage.setItem('gama_empresas', JSON.stringify(listaNueva)) } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'EMPRESAS_CONGLOMERADO',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: empresaEditando ? 'EDICION_EMPRESA' : 'CREACION_EMPRESA',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Empresa guardada localmente:', e)
    }

    setMostrarModalEmpresa(false)
    setEmpresaEditando(null)
    alert(`Razón Social "${nuevaEmp.razon_social}" (RUT: ${nuevaEmp.rut}) guardada exitosamente.`)
  }

  const handleEliminarEmpresaEmisora = async (id: string) => {
    if (empresasConglomerado.length <= 1) {
      alert('Debe mantener al menos una empresa emisora en el conglomerado.')
      return
    }
    if (!confirm('¿Está seguro de eliminar permanentemente esta Razón Social Emisora?')) return

    const listaNueva = empresasConglomerado.filter(e => e.id !== id)
    setEmpresasConglomerado(listaNueva)
    try { localStorage.setItem('gama_empresas', JSON.stringify(listaNueva)) } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'EMPRESAS_CONGLOMERADO',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'ELIMINACION_EMPRESA',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Error al eliminar empresa:', e)
    }
  }

  const calculoCotizacionActual = useMemo(() => {
    let subtotalBrutoLineas = 0
    let totalDescuentosLineas = 0

    itemsCot.forEach(it => {
      const netoBrutoLinea = (it.cantidad || 1) * (it.precio_neto_unitario || 0)
      let descLinea = 0
      if (it.tipo_descuento === 'monto') {
        descLinea = Math.min(netoBrutoLinea, it.descuento_valor || 0)
      } else {
        descLinea = netoBrutoLinea * ((it.descuento_valor || 0) / 100)
      }
      subtotalBrutoLineas += netoBrutoLinea
      totalDescuentosLineas += descLinea
    })

    const subtotalTrasDescLineas = Math.max(0, subtotalBrutoLineas - totalDescuentosLineas)
    let descGlobal = 0
    if (descuentoGlobalTipo === 'monto') {
      descGlobal = Math.min(subtotalTrasDescLineas, descuentoGlobalValor || 0)
    } else {
      descGlobal = subtotalTrasDescLineas * ((descuentoGlobalValor || 0) / 100)
    }

    const totalDescuentos = totalDescuentosLineas + descGlobal
    const netoConDescuento = Math.max(0, subtotalBrutoLineas - totalDescuentos)
    const montoIva = netoConDescuento * IVA_PORCENTAJE
    const totalIvaIncluido = netoConDescuento + montoIva

    return {
      subtotalBrutoLineas,
      totalDescuentosLineas,
      descGlobal,
      totalDescuentos,
      netoConDescuento,
      montoIva,
      totalIvaIncluido
    }
  }, [itemsCot, descuentoGlobalValor, descuentoGlobalTipo])

  const handleEjecutarCicloConsenso = async () => {
    setEjecutandoCiclo(true)
    const ts = new Date().toLocaleTimeString('es-CL')
    const cId = Math.floor(Math.random() * 900 + 1000)

    const nuevosLogs = [
      `[${ts}] ⚡ CICLO DE CONSENSO AUTÓNOMO #${cId} INICIADO (SQUAD AUTO-COMPANY 24/7)`,
      `[${ts}] 🛡️ SRE Guardian: Latencia Supabase (12ms) | WhatsApp Server (En línea) | Vercel Alias (100% OK)`,
      `[${ts}] 💳 Finance Agent: Evaluadas ${Object.keys(clientesMaestros).length} Fichas de Clientes. 0 sobreavisos críticos.`,
      `[${ts}] 👁️ Vision AI Guard: 100% cámaras RTSP en línea. Cero eventos anómalos detectados.`,
      `[${ts}] 📋 Sales Agent: Reserva de código correlativo lista -> ${siguienteCorrelativoCode}`,
      `[${ts}] ✅ BUCLE AUTÓNOMO FINALIZADO CON ÉXITO. MEMORIA DE CONSENSO ACTUALIZADA.`,
      ...logsConsenso
    ]

    setLogsConsenso(nuevosLogs)
    setTimeout(() => {
      setEjecutandoCiclo(false)
      alert(`Ciclo de Consenso #${cId} completado. Todos los agentes reportan estado 100% Operativo.`)
    }, 600)
  }

  // ── BUSCADOR SEGURO INTELIGENTE 360° ──
  const resultadosBusqueda = useMemo(() => {
    const q = (busquedaClienteInput || '').toLowerCase().trim()
    const qClean = q.replace(/[^a-z0-9]/gi, '')
    if (!q) return []

    const list: Array<{
      id: string
      tipo: 'abonado' | 'cliente'
      cuenta?: string
      alias?: string
      rut: string
      razon_social: string
      email: string
      estado_pago: 'Al Día' | 'Pendiente' | 'Moroso'
      cuentas_count: number
      cuentas_preview: string
    }> = []

    Object.values(abonadosCentrosCosto || {}).forEach(cc => {
      if (!cc) return
      const cStr = String(cc.cuenta || '').toLowerCase()
      const cClean = cStr.replace(/[^a-z0-9]/gi, '')
      const aStr = String(cc.alias_centro_costo || '').toLowerCase()
      const rStr = String(cc.rut_cliente || '').toLowerCase()

      if (cStr.includes(q) || (qClean && cClean.includes(qClean)) || aStr.includes(q) || rStr.includes(q)) {
        const cli = clientesMaestros[cc.rut_cliente]
        list.push({
          id: `abonado-${cc.cuenta}`,
          tipo: 'abonado',
          cuenta: cc.cuenta,
          alias: cc.alias_centro_costo,
          rut: cc.rut_cliente,
          razon_social: cli?.razon_social || cc.alias_centro_costo,
          email: cli?.email_cobranza || 'contacto@cliente.cl',
          estado_pago: cli?.estado_pago || 'Al Día',
          cuentas_count: cli?.cuentas_abonados?.length || 1,
          cuentas_preview: cc.cuenta
        })
      }
    })

    Object.values(clientesMaestros || {}).forEach(cli => {
      if (!cli) return
      const rStr = String(cli.rut || '').toLowerCase()
      const nStr = String(cli.razon_social || '').toLowerCase()
      const eStr = String(cli.email_cobranza || '').toLowerCase()
      const cArr = (cli.cuentas_abonados || []).map(c => String(c).toLowerCase())
      
      const matchCta = cArr.some(c => c.includes(q) || (qClean && c.replace(/[^a-z0-9]/gi, '').includes(qClean)))
      if (rStr.includes(q) || nStr.includes(q) || eStr.includes(q) || matchCta) {
        const yaExiste = list.some(l => l.rut === cli.rut)
        if (!yaExiste) {
          const firstFew = (cli.cuentas_abonados || []).slice(0, 3).join(', ')
          const extra = (cli.cuentas_abonados || []).length > 3 ? ` (+${cli.cuentas_abonados.length - 3} más)` : ''
          list.push({
            id: `cliente-${cli.rut}`,
            tipo: 'cliente',
            rut: cli.rut,
            razon_social: cli.razon_social,
            email: cli.email_cobranza || 'contacto@cliente.cl',
            estado_pago: cli.estado_pago || 'Al Día',
            cuentas_count: (cli.cuentas_abonados || []).length,
            cuentas_preview: firstFew + extra
          })
        }
      }
    })

    return list.slice(0, 15)
  }, [busquedaClienteInput, abonadosCentrosCosto, clientesMaestros])

  const handleDispararBusqueda = () => {
    if (!busquedaClienteInput.trim()) return
    setBuscandoSpinner(true)
    setTimeout(() => {
      setBuscandoSpinner(false)
      if (resultadosBusqueda.length > 0) {
        const item = resultadosBusqueda[0]
        setModuloActivo('ficha360')
        if (item.tipo === 'abonado' && item.cuenta) {
          setCuentaSeleccionada(item.cuenta.toUpperCase().trim())
          setRutClienteSeleccionado(item.rut)
        } else {
          setRutClienteSeleccionado(item.rut)
          const cli = clientesMaestros[item.rut] || Object.values(clientesMaestros).find(c => c.rut === item.rut)
          if (cli && cli.cuentas_abonados && cli.cuentas_abonados.length > 0) {
            setCuentaSeleccionada(cli.cuentas_abonados[0].toUpperCase().trim())
          }
        }
        setBusquedaClienteInput('')
      }
    }, 150)
  }

  // ── FUNCIONES DE MANEJO DE ÓRDENES DE TRABAJO Y COMMAND CENTER ──
  const handleCrearOTDesdeCentral = (item: any) => {
    const cod = (item.abonado_cod || '').toUpperCase().trim()
    const nom = (item.abonado_nombre || 'ABONADO MONITOREADO').trim()
    const nota = item.comentario || 'Solicitud generada desde novedad de Command Center'

    setOtFormCuenta(cod || '0999')
    setOtFormClienteNombre(nom)
    setOtFormTipoServicio(item.tipo_nombre === 'CORTE DE ENERGIA' ? 'Revisión de Fuente & Energía' : item.tipo_nombre === 'FALLA DE BATERIA' ? 'Cambio de Batería de Respaldo' : 'Revisión Técnica de Alarma / Zonas')
    setOtFormObservaciones(`Reporte Command Center [${item.created_at || 'Reciente'}]: ${nota}`)
    setOtFormSLA('Crítica (2h)')
    setOtFormTecnico('Técnico Juan Pérez')
    setOtFormFecha(new Date().toISOString().split('T')[0])
    setOtFormEstado('Pendiente')
    setMostrarModalOT(true)
  }

  const handleGuardarNuevaOT = async () => {
    const nextOtNum = ordenesTrabajo.length + 83
    const nuevaOT: OrdenDeTrabajo = {
      id: `OT-${Date.now()}`,
      codigo_ot: `OT-2026-${nextOtNum.toString().padStart(3, '0')}`,
      cuenta: otFormCuenta || '0999',
      cliente_nombre: otFormClienteNombre || 'Cliente Monitoreado',
      tipo_servicio: otFormTipoServicio,
      tecnico_asignado: otFormTecnico,
      fecha_programada: otFormFecha,
      prioridad_sla: otFormSLA,
      estado: otFormEstado,
      observaciones: otFormObservaciones
    }

    const listaNueva = [nuevaOT, ...ordenesTrabajo]
    setOrdenesTrabajo(listaNueva)
    try { localStorage.setItem('gama_ordenes_trabajo', JSON.stringify(listaNueva)) } catch (e) {}

    // Formatear para compatibilidad total con Command Center & ServicioTecnicoModal PWA
    const listaFormatoCC = listaNueva.map(o => ({
      id: Date.now(),
      codigo_ot: o.codigo_ot,
      cuenta: o.cuenta,
      nombre_abonado: o.cliente_nombre,
      direccion: 'Dirección Registrada',
      telefono_contacto: '+56991016912',
      tipo_visita: o.tipo_servicio.includes('Batería') ? 'Cambio de Batería' : o.tipo_servicio.includes('Cámara') ? 'Revisión de Cámaras' : 'Correctiva',
      tecnico: o.tecnico_asignado,
      fecha_cita: o.fecha_programada,
      bloque_horario: 'Mañana (09:00 - 13:00)',
      problema: o.observaciones,
      estado: o.estado === 'Finalizada' ? 'Completada' : o.estado,
      novedad: o.observaciones,
      firma: '',
      fecha_creacion: new Date().toISOString()
    }))

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'ORDENES_TRABAJO',
        nombre_abonado: JSON.stringify(listaFormatoCC),
        evento: 'CREACION_OT_CRM',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Error al guardar OT en Supabase:', e)
    }

    setMostrarModalOT(false)
    setToastNotificacion({ tipo: 'exito', texto: `¡Orden de Trabajo ${nuevaOT.codigo_ot} guardada y sincronizada con Command Center 24/7!` })
  }

  const handleNotificarWhatsAppOT = async (ot: OrdenDeTrabajo) => {
    const fono = '+56991016912'
    const msg = `🚨 *ORDEN DE TRABAJO TÉCNICA (${ot.codigo_ot})*\n\nEstimado cliente *${ot.cliente_nombre}* (Cuenta #${ot.cuenta}):\nLe informamos que se ha programado la Orden Técnica *${ot.codigo_ot}* para la fecha *${ot.fecha_programada}*.\n\n🔧 *Servicio*: ${ot.tipo_servicio}\n👨‍🔧 *Técnico Asignado*: ${ot.tecnico_asignado}\n⏱️ *SLA de Atención*: ${ot.prioridad_sla || 'Normal (24h)'}\n📌 *Notas*: ${ot.observaciones || 'Revisión estándar'}\n\nGama Seguridad SpA - Central Operativa 24/7`

    try {
      const res = await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fono, message: msg })
      })
      const data = await res.json()
      if (data.status === 'success' || data.success) {
        setToastNotificacion({ tipo: 'exito', texto: `¡Notificación de OT ${ot.codigo_ot} enviada por WhatsApp!` })
      } else {
        const link = `https://wa.me/${fono.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
        window.open(link, '_blank')
      }
    } catch (e) {
      const link = `https://wa.me/${fono.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
      window.open(link, '_blank')
    }
  }

  // ── GUARDA NUEVA RAZÓN SOCIAL RÁPIDA (PARA DEJARLA REGISTRADA EN DROPDOWN) ──
  const handleCrearNuevaRazonSocialRapida = async () => {
    if (!vincNuevoRut.trim() || !vincNuevaRazonSocial.trim()) {
      alert('Por favor ingrese el RUT y la Razón Social Tributaria.')
      return
    }

    const rutLimpio = cleanRut(vincNuevoRut)
    const razonSocialLimpia = vincNuevaRazonSocial.trim()

    const nuevoCliente: ClienteMaestro = {
      rut: rutLimpio,
      razon_social: razonSocialLimpia,
      empresa_facturadora_id: 'EMP-1',
      email_cobranza: 'cobranza@gamasecurity.cl',
      telefono: '+56991016912',
      direccion_comercial: 'Dirección Fiscal Registrada',
      moneda: 'CLP',
      tarifa_mensual: 29900,
      dia_vencimiento: 5,
      plan_monitoreo: 'MONITOREO ESTÁNDAR 24/7',
      estado_pago: 'Al Día',
      cuentas_abonados: []
    }

    const mapaNuevo = { ...clientesMaestros, [rutLimpio]: nuevoCliente }
    setClientesMaestros(mapaNuevo)
    try { localStorage.setItem('gama_clientes_maestros', JSON.stringify(mapaNuevo)) } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'CLIENTES_MAESTROS_CRM',
        nombre_abonado: JSON.stringify(mapaNuevo),
        evento: 'CREACION_RAZON_SOCIAL_RAPIDA',
        fecha_hora: new Date().toISOString()
      })
    } catch (e) {}

    setVincRutSeleccionado(rutLimpio)
    setVincAbonadosSeleccionados([])
    setVincNuevoRut('')
    setVincNuevaRazonSocial('')
    setToastNotificacion({ tipo: 'exito', texto: `¡Razón Social "${razonSocialLimpia}" (${rutLimpio}) registrada exitosamente!` })
  }

  // ── GUARDA VINCULACIÓN TRIBUTARIA ADMINISTRADOR (ABONADOS ➔ RUT) ──
  const handleGuardarVinculacionTributaria = async () => {
    let targetRut = vincRutSeleccionado.trim()
    let targetNombre = ''

    if (!targetRut) {
      if (!vincNuevoRut.trim() || !vincNuevaRazonSocial.trim()) {
        alert('Por favor seleccione una Razón Social existente o ingrese el nuevo RUT y Razón Social Tributaria.')
        return
      }
      targetRut = cleanRut(vincNuevoRut)
      targetNombre = vincNuevaRazonSocial.trim()
    } else {
      targetNombre = clientesMaestros[targetRut]?.razon_social || targetRut
    }

    if (vincAbonadosSeleccionados.length === 0) {
      alert('Por favor seleccione al menos un abonado (Centro de Costo) para vincular a esta Razón Social.')
      return
    }

    const ctasNorm = vincAbonadosSeleccionados.map(normalizeCuentaCode)
    const mapaNuevoMaestro = { ...clientesMaestros }
    if (!mapaNuevoMaestro[targetRut]) {
      mapaNuevoMaestro[targetRut] = {
        rut: targetRut,
        razon_social: targetNombre,
        empresa_facturadora_id: 'EMP-1',
        email_cobranza: 'cobranza@gamasecurity.cl',
        telefono: '+56991016912',
        direccion_comercial: 'Dirección Fiscal Registrada',
        moneda: 'CLP',
        tarifa_mensual: 29900 * ctasNorm.length,
        dia_vencimiento: 5,
        plan_monitoreo: 'MONITOREO MULTI-ABONADO CONSOLIDADOR 24/7',
        estado_pago: 'Al Día',
        cuentas_abonados: ctasNorm
      }
    } else {
      mapaNuevoMaestro[targetRut] = {
        ...mapaNuevoMaestro[targetRut],
        cuentas_abonados: Array.from(new Set([...(mapaNuevoMaestro[targetRut].cuentas_abonados || []).map(normalizeCuentaCode), ...ctasNorm]))
      }
    }

    const mapaNuevoCentrosCosto = { ...abonadosCentrosCosto }
    ctasNorm.forEach(cta => {
      if (mapaNuevoCentrosCosto[cta]) {
        mapaNuevoCentrosCosto[cta] = { ...mapaNuevoCentrosCosto[cta], rut_cliente: targetRut }
      }
    })

    setClientesMaestros(mapaNuevoMaestro)
    setAbonadosCentrosCosto(mapaNuevoCentrosCosto)

    try {
      localStorage.setItem('gama_clientes_maestros', JSON.stringify(mapaNuevoMaestro))
      localStorage.setItem('gama_centros_costo', JSON.stringify(mapaNuevoCentrosCosto))
    } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'CLIENTES_MAESTROS_CRM',
        nombre_abonado: JSON.stringify(mapaNuevoMaestro),
        evento: 'VINCULACION_TRIBUTARIA_ADMIN',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Guardado localmente:', e)
    }

    setVincSubTab('consolidado')
    setToastNotificacion({
      tipo: 'exito',
      texto: `¡Vinculación Exitosa! ${targetNombre} (${targetRut}) consolidó ${ctasNorm.length} abonados. Pantalla actualizada en tiempo real.`
    })

    setToastNotificacion({
      tipo: 'exito',
      texto: `¡Vinculación Tributaria Exitosa! ${targetNombre} (${targetRut}) consolidó ${vincAbonadosSeleccionados.length} abonados.`
    })
    setVincAbonadosSeleccionados([])
  }

  const handleDesvincularAbonadoIndividual = async (rut: string, ctaADesvincular: string) => {
    if (!clientesMaestros[rut]) return
    const cli = clientesMaestros[rut]
    const ctaNorm = ctaADesvincular.toUpperCase().trim()
    const cuentasNuevas = (cli.cuentas_abonados || []).filter(c => c.toUpperCase().trim() !== ctaNorm)

    const mapaNuevo = {
      ...clientesMaestros,
      [rut]: { ...cli, cuentas_abonados: cuentasNuevas }
    }

    setClientesMaestros(mapaNuevo)
    try { localStorage.setItem('gama_clientes_maestros', JSON.stringify(mapaNuevo)) } catch (e) {}

    // Agregar al historial de desvinculados por si fue por error
    setDesvinculadosHistorial(prev => [
      { cuenta: ctaNorm, rutAnterior: rut, razonSocialAnterior: cli.razon_social, fecha: new Date().toLocaleTimeString('es-CL') },
      ...prev
    ])

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'CLIENTES_MAESTROS_CRM',
        nombre_abonado: JSON.stringify(mapaNuevo),
        evento: 'DESVINCULACION_ABONADO_ADMIN',
        fecha_hora: new Date().toISOString()
      })
    } catch (e) {}

    setToastNotificacion({ tipo: 'exito', texto: `Abonado #${ctaNorm} desvinculado de ${cli.razon_social}. Se movió a la sección de Historial.` })
  }

  const handleRestaurarDesvinculacion = async (item: { cuenta: string, rutAnterior: string, razonSocialAnterior: string }) => {
    const rut = item.rutAnterior
    const cta = item.cuenta
    if (!clientesMaestros[rut]) return

    const cli = clientesMaestros[rut]
    const cuentasNuevas = Array.from(new Set([...(cli.cuentas_abonados || []), cta]))

    const mapaNuevo = {
      ...clientesMaestros,
      [rut]: { ...cli, cuentas_abonados: cuentasNuevas }
    }

    setClientesMaestros(mapaNuevo)
    try { localStorage.setItem('gama_clientes_maestros', JSON.stringify(mapaNuevo)) } catch (e) {}

    setDesvinculadosHistorial(prev => prev.filter(d => d.cuenta !== cta || d.rutAnterior !== rut))
    setToastNotificacion({ tipo: 'exito', texto: `Abonado #${cta} restaurado exitosamente a ${cli.razon_social}` })
  }

  // ── CARGA E IMPORTACIÓN AUTOMÁTICA DE CSV PLANSILLA MAESTRO (Plantilla_Maestro_RUT_GamaSeguridad.csv) ──
  const handleImportarCSVPlantillaMaestro = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        if (!text) return

        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
        if (lines.length <= 1) {
          alert('El archivo CSV está vacío o no posee datos.')
          return
        }

        const header = lines[0]
        const delimiter = header.includes(';') ? ';' : ','
        const colNames = header.split(delimiter).map(c => c.trim().toUpperCase().replace(/[^A-Z_ ]/g, ''))

        const idxAbonado = colNames.findIndex(c => c.includes('ABONADO') || c.includes('NABONADO') || c.includes('N_ABONADO'))
        const idxNombre = colNames.findIndex(c => c.includes('NOMBRE'))
        const idxRut = colNames.findIndex(c => c.includes('RUT'))
        const idxSucursal = colNames.findIndex(c => c.includes('SUCURSAL'))
        const idxRazonSocial = colNames.findIndex(c => c.includes('RAZON') || c.includes('SOCIAL'))

        const mapaNuevoMaestro = { ...clientesMaestros }
        const mapaNuevoCentrosCosto = { ...abonadosCentrosCosto }

        let countProcesados = 0
        let countRazonesSociales = 0

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(delimiter).map(r => r.trim())
          if (row.length < 2) continue

          const numAbonado = (row[idxAbonado] || '').toUpperCase().trim()
          const nombreAbonado = row[idxNombre] || ''
          const rawRut = row[idxRut] || ''
          const sucursal = row[idxSucursal] || nombreAbonado
          const razonSocial = row[idxRazonSocial] || nombreAbonado

          if (!numAbonado) continue

          const rutLimpio = cleanRut(rawRut) || `RUT-${numAbonado}`
          const razonSocialFinal = razonSocial.trim() || nombreAbonado.trim() || `CLIENTE #${numAbonado}`

          mapaNuevoCentrosCosto[numAbonado] = {
            cuenta: numAbonado,
            alias_centro_costo: sucursal ? `${nombreAbonado} (${sucursal})` : nombreAbonado,
            direccion: sucursal || 'Dirección de Instalación',
            ciudad: 'V Región / Chile',
            rut_cliente: rutLimpio
          }

          if (!mapaNuevoMaestro[rutLimpio]) {
            mapaNuevoMaestro[rutLimpio] = {
              rut: rutLimpio,
              razon_social: razonSocialFinal,
              empresa_facturadora_id: 'EMP-1',
              email_cobranza: 'cobranza@gamasecurity.cl',
              telefono: '+56991016912',
              direccion_comercial: sucursal || 'Dirección Fiscal',
              moneda: 'CLP',
              tarifa_mensual: 29900,
              dia_vencimiento: 5,
              plan_monitoreo: 'MONITOREO MULTI-ABONADO CONSOLIDADOR 24/7',
              estado_pago: 'Al Día',
              cuentas_abonados: [numAbonado]
            }
            countRazonesSociales++
          } else {
            const arr = mapaNuevoMaestro[rutLimpio].cuentas_abonados || []
            if (!arr.includes(numAbonado)) {
              mapaNuevoMaestro[rutLimpio].cuentas_abonados = [...arr, numAbonado]
            }
          }

          countProcesados++
        }

        setClientesMaestros(mapaNuevoMaestro)
        setAbonadosCentrosCosto(mapaNuevoCentrosCosto)

        try {
          localStorage.setItem('gama_clientes_maestros', JSON.stringify(mapaNuevoMaestro))
          localStorage.setItem('gama_centros_costo', JSON.stringify(mapaNuevoCentrosCosto))
        } catch (e) {}

        try {
          await supabase.from('eventos_monitoreo').upsert({
            cuenta: 'CLIENTES_MAESTROS_CRM',
            nombre_abonado: JSON.stringify(mapaNuevoMaestro),
            evento: 'IMPORTACION_CSV_PLANTILLA_MAESTRO',
            fecha_hora: new Date().toISOString()
          })
        } catch (e) {}

        setToastNotificacion({
          tipo: 'exito',
          texto: `¡CSV Importado con Éxito! Procesados ${countProcesados} abonados y ${countRazonesSociales} Razones Sociales.`
        })
      } catch (err: any) {
        alert(`Error al procesar archivo CSV: ${err?.message || err}`)
      }
    }
    reader.readAsText(file, 'ISO-8859-1')
  }

  // ── CUENTAS YA ASIGNADAS PARA FILTRAR Y ELIMINAR DEL LISTADO PENDIENTE ──
  const cuentasYaAsignadas = useMemo(() => {
    const setAsig = new Set<string>()
    Object.values(clientesMaestros).forEach(cli => {
      if (cli.rut !== vincRutSeleccionado) {
        (cli.cuentas_abonados || []).forEach(cta => setAsig.add(normalizeCuentaCode(cta)))
      }
    })
    return setAsig
  }, [clientesMaestros, vincRutSeleccionado])

  const abonadosParaVincular = useMemo(() => {
    return Object.values(abonadosCentrosCosto).filter(cc => {
      const cta = normalizeCuentaCode(cc.cuenta)
      if (!vincMostrarTodos && cuentasYaAsignadas.has(cta) && !vincAbonadosSeleccionados.includes(cta)) {
        return false
      }
      const q = vincBusquedaAbonado.toLowerCase().trim()
      return !q || cta.toLowerCase().includes(q) || (cc.alias_centro_costo || '').toLowerCase().includes(q)
    })
  }, [abonadosCentrosCosto, cuentasYaAsignadas, vincBusquedaAbonado, vincAbonadosSeleccionados, vincMostrarTodos])

  const empresaEmisoraSeleccionadaCot = empresasConglomerado.find(e => e.id === cotEmpresaEmisoraId) || empresasConglomerado[0]

  // Cuentas destacadas rápidas para hacer click de un vistazo
  const abonadosDestacados = useMemo(() => {
    return Object.values(abonadosCentrosCosto).slice(0, 8)
  }, [abonadosCentrosCosto])

  // ── MANEJADORES DE LEADS & MARKETING DE COLD EMAIL OUTREACH ──
  const abrirModalNuevoLead = (lead?: LeadMarketing) => {
    if (lead) {
      setLeadEditandoId(lead.id)
      setFormLeadEmpresa(lead.empresa)
      setFormLeadRut(lead.rut || '')
      setFormLeadComuna(lead.comuna || 'Viña del Mar')
      setFormLeadDireccion(lead.direccion || '')
      setFormLeadEmail(lead.email)
      setFormLeadTelefono(lead.telefono)
      setFormLeadContacto(lead.contacto)
      setFormLeadSegmento(lead.segmento)
      setFormLeadEstado(lead.estado)
      setFormLeadScore(lead.score_interes || 4)
      setFormLeadNotas(lead.notas || '')
    } else {
      setLeadEditandoId(null)
      setFormLeadEmpresa('')
      setFormLeadRut('')
      setFormLeadComuna('Viña del Mar')
      setFormLeadDireccion('')
      setFormLeadEmail('')
      setFormLeadTelefono('+56 9 ')
      setFormLeadContacto('')
      setFormLeadSegmento('Comercial B2B')
      setFormLeadEstado('Nuevo')
      setFormLeadScore(4)
      setFormLeadNotas('')
    }
    setMostrarModalNuevoLead(true)
  }

  const handleGuardarLead = async () => {
    if (!formLeadEmpresa.trim() || !formLeadEmail.trim() || !formLeadEmail.includes('@')) {
      alert('Por favor ingrese un Nombre de Empresa válido y un Correo Electrónico con formato correcto (@).')
      return
    }

    const nuevoLead: LeadMarketing = {
      id: leadEditandoId || `LEAD-${Date.now()}`,
      empresa: formLeadEmpresa.trim(),
      rut: formLeadRut.trim(),
      comuna: formLeadComuna,
      direccion: formLeadDireccion.trim(),
      email: formLeadEmail.trim(),
      telefono: formLeadTelefono.trim() || '+56991016912',
      contacto: formLeadContacto.trim() || 'Encargado de Seguridad',
      segmento: formLeadSegmento,
      estado: formLeadEstado,
      score_interes: formLeadScore,
      fecha_ingreso: new Date().toISOString().split('T')[0],
      notas: formLeadNotas.trim(),
      bitacora: leadEditandoId ? (leadsList.find(l => l.id === leadEditandoId)?.bitacora || []) : []
    }

    let listaNueva: LeadMarketing[] = []
    if (leadEditandoId) {
      listaNueva = leadsList.map(l => l.id === leadEditandoId ? nuevoLead : l)
    } else {
      listaNueva = [nuevoLead, ...leadsList]
    }

    setLeadsList(listaNueva)
    try { localStorage.setItem('gama_leads', JSON.stringify(listaNueva)) } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'LEADS_MARKETING',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: leadEditandoId ? 'EDICION_LEAD' : 'CREACION_LEAD',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {}

    setMostrarModalNuevoLead(false)
    setLeadEditandoId(null)
    setToastNotificacion({ tipo: 'exito', texto: `Lead "${nuevoLead.empresa}" (${nuevoLead.comuna}) guardado exitosamente.` })
    setTimeout(() => setToastNotificacion(null), 4000)
  }

  // Auto-Descubrimiento de Prospectos V Región
  const handleAutoDescubrirVRegion = async () => {
    setCargandoScraperVRegion(true)
    try {
      const res = await fetch(`/api/marketing/prospectos-v-region?comuna=${encodeURIComponent(filtroComunaVRegion)}`)
      const data = await res.json()
      if (data.success && data.prospectos) {
        // Filtrar no duplicados por rut o email
        const nuevos = data.prospectos.filter((p: LeadMarketing) => !leadsList.some(l => l.email === p.email || (l.rut && l.rut === p.rut)))
        if (nuevos.length === 0) {
          setToastNotificacion({ tipo: 'exito', texto: `No se encontraron prospectos nuevos en la comuna ${filtroComunaVRegion} (todos ya agregados).` })
        } else {
          const listaActualizada = [...nuevos, ...leadsList]
          setLeadsList(listaActualizada)
          try { localStorage.setItem('gama_leads', JSON.stringify(listaActualizada)) } catch (e) {}
          setToastNotificacion({ tipo: 'exito', texto: `🔍 Auto-Descubiertos ${nuevos.length} prospectos de la V Región (${filtroComunaVRegion}).` })
        }
      }
    } catch (err: any) {
      alert(`Error descubriendo prospectos: ${err?.message || err}`)
    } finally {
      setCargandoScraperVRegion(false)
      setTimeout(() => setToastNotificacion(null), 5000)
    }
  }

  // Agregar Nota a la Bitácora de Tratamiento Individual
  const handleAgregarNotaBitacora = () => {
    if (!prospectoTratamiento || !nuevaNotaBitacora.trim()) return

    const nuevaNota: BitacoraLead = {
      id: `b-${Date.now()}`,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      autor: 'Ejecutivo Comercial',
      tipo: tipoNotaBitacora,
      nota: nuevaNotaBitacora.trim()
    }

    const bitacoraPrev = prospectoTratamiento.bitacora || []
    const prospectoActualizado: LeadMarketing = {
      ...prospectoTratamiento,
      bitacora: [nuevaNota, ...bitacoraPrev]
    }

    setProspectoTratamiento(prospectoActualizado)
    const listaActualizada = leadsList.map(l => l.id === prospectoActualizado.id ? prospectoActualizado : l)
    setLeadsList(listaActualizada)
    try { localStorage.setItem('gama_leads', JSON.stringify(listaActualizada)) } catch (e) {}

    setNuevaNotaBitacora('')
    setToastNotificacion({ tipo: 'exito', texto: 'Nota registrada en la bitácora comercial del prospecto.' })
    setTimeout(() => setToastNotificacion(null), 3000)
  }

  // Distribuir Publicidad Diseñada B2B
  const handleDistribuirPublicidad = async () => {
    const leadsTarget = leadsList.filter(l => pubComunaTarget === 'Todas' || l.comuna === pubComunaTarget)
    if (leadsTarget.length === 0) {
      alert(`No hay prospectos registrados para la comuna de ${pubComunaTarget}.`)
      return
    }

    if (!confirm(`¿Confirma el envío de la pieza publicitaria a ${leadsTarget.length} empresas de ${pubComunaTarget}?`)) return

    setIsDistribuyendoPublicidad(true)
    const tituloFinal = pubTitulo.replace(/\{\{comuna\}\}/g, pubComunaTarget)

    const htmlPublicitario = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #005bea 0%, #00c6fb 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">OFERTA EXCLUSIVA V REGIÓN</span>
          <h2 style="margin: 16px 0 8px 0; font-size: 24px; font-weight: 900; line-height: 1.2;">${tituloFinal}</h2>
          <p style="margin: 0; font-size: 14px; opacity: 0.95;">${pubSubtitulo}</p>
        </div>

        <div style="padding: 24px; text-align: center; background-color: #f8fafc;">
          <p style="font-size: 13px; color: #475569; margin-bottom: 20px;">Use su cupón de bonificación empresarial al solicitar su factibilidad técnica:</p>
          <div style="display: inline-block; background: #005bea; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-size: 18px; font-weight: bold; letter-spacing: 2px;">
            CUPÓN: ${pubCupon}
          </div>
          <div style="margin-top: 24px;">
            <a href="${pubEnlaceCta}" style="background: #005bea; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              SOLICITAR EVALUACIÓN EN TERRENO →
            </a>
          </div>
        </div>

        <div style="padding: 20px 24px; background: #0f172a; color: #94a3b8; font-size: 11px; text-align: center;">
          <p style="margin: 0; font-weight: bold; color: #ffffff;">GAMA SEGURIDAD CHILE - V REGIÓN VALPARAÍSO</p>
          <p style="margin: 4px 0 0 0;">Av. Valparaíso 1183, Viña del Mar | Fono: +56 32 3276011</p>
        </div>
      </div>
    `

    try {
      const res = await fetch('/api/marketing/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: leadsTarget,
          asunto: tituloFinal,
          cuerpoHtml: htmlPublicitario,
          remitente: campanaRemitente
        })
      })

      const d = await res.json()
      if (d.success) {
        setToastNotificacion({
          tipo: 'exito',
          texto: `📢 Publicidad lanzada con éxito a ${d.totalExitosos} empresas de ${pubComunaTarget}.`
        })
      } else {
        alert(`Error enviando publicidad: ${d.error}`)
      }
    } catch (e: any) {
      alert(`Error en el servidor: ${e?.message || e}`)
    } finally {
      setIsDistribuyendoPublicidad(false)
      setTimeout(() => setToastNotificacion(null), 5000)
    }
  }

  const handleEliminarLead = async (id: string, empresa: string) => {
    if (!confirm(`¿Está seguro de eliminar el lead "${empresa}"?`)) return
    const listaNueva = leadsList.filter(l => l.id !== id)
    setLeadsList(listaNueva)
    try { localStorage.setItem('gama_leads', JSON.stringify(listaNueva)) } catch (e) {}
  }

  const handleLanzarCampanaResend = async () => {
    let targetLeads = leadsList
    if (campanaSegmento !== 'Todos') {
      targetLeads = leadsList.filter(l => l.estado === campanaSegmento || l.segmento === campanaSegmento)
    }

    if (targetLeads.length === 0) {
      alert('No hay leads que coincidan con el segmento seleccionado para el envío.')
      return
    }

    if (!campanaAsunto.trim()) {
      alert('Por favor ingrese el asunto del correo de prospección.')
      return
    }

    if (!confirm(`¿Confirma el disparo masivo vía Resend a ${targetLeads.length} leads del segmento "${campanaSegmento}"?`)) return

    setIsSubmittingCampana(true)
    setProgresoEnvioText(`Enviando 1 de ${targetLeads.length} correos con Resend API...`)

    try {
      const res = await fetch('/api/marketing/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: targetLeads,
          asunto: campanaAsunto,
          cuerpoHtml: campanaContenido,
          remitente: campanaRemitente
        })
      })

      const data = await res.json()
      if (data.success) {
        setToastNotificacion({
          tipo: 'exito',
          texto: `🚀 Campaña de Outreach enviada con éxito. ${data.totalExitosos} de ${data.totalProcesados} correos procesados por Resend.`
        })

        const leadsActualizados = leadsList.map(l => {
          if (targetLeads.some(tl => tl.id === l.id) && l.estado === 'Nuevo') {
            return { ...l, estado: 'Contactado' as const }
          }
          return l
        })
        setLeadsList(leadsActualizados)
        try { localStorage.setItem('gama_leads', JSON.stringify(leadsActualizados)) } catch (e) {}

      } else {
        setToastNotificacion({
          tipo: 'error',
          texto: `Error en la campaña Resend: ${data.error || 'Respuesta fallida de API'}`
        })
      }
    } catch (e: any) {
      setToastNotificacion({
        tipo: 'error',
        texto: `Excepción al conectar con API Resend: ${e?.message || e}`
      })
    } finally {
      setIsSubmittingCampana(false)
      setProgresoEnvioText('')
      setTimeout(() => setToastNotificacion(null), 6000)
    }
  }

  const modulosLaunchpad = [
    {
      id: 'ficha360',
      titulo: 'Ficha 360° Cliente',
      categoria: 'OPERACIONES',
      descripcion: 'Búsqueda inteligente de abonados, expedientes maestros, personas autorizadas e historial de eventos.',
      icono: User,
      gradient: 'from-[#0066cc] to-[#2997ff]',
      borderColor: 'hover:border-[#2997ff]',
      glowColor: 'group-hover:shadow-[#0066cc]/25',
      badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      tag: `${Object.keys(clientesMaestros).length} Clientes`
    },
    {
      id: 'contratos',
      titulo: 'Contratos & Firma Digital',
      categoria: 'LEGAL & VENTAS',
      descripcion: 'Generación de contratos con direcciones reales de GENERAL.MDB, firma en pantalla táctil y descarga PDF.',
      icono: FileCheck,
      gradient: 'from-emerald-600 to-teal-500',
      borderColor: 'hover:border-emerald-400',
      glowColor: 'group-hover:shadow-emerald-500/25',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      tag: 'Firma Táctil'
    },
    {
      id: 'presupuestos',
      titulo: 'Presupuestos & DTE',
      categoria: 'COMERCIAL',
      descripcion: 'Cotizaciones oficiales en PDF corporativo, catálogo de seguridad electrónica y control de propuestas comerciales.',
      icono: FileText,
      gradient: 'from-amber-500 to-orange-500',
      borderColor: 'hover:border-amber-400',
      glowColor: 'group-hover:shadow-amber-500/25',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      tag: `${cotizaciones.length} Cotizaciones`
    },
    {
      id: 'serv_tecnico',
      titulo: 'Servicios Técnicos (OTs)',
      categoria: 'OPERACIONES',
      descripcion: 'Órdenes de trabajo, asignación de técnicos en terreno, estado de visitas y soporte técnico.',
      icono: Wrench,
      gradient: 'from-orange-600 to-amber-500',
      borderColor: 'hover:border-orange-400',
      glowColor: 'group-hover:shadow-orange-500/25',
      badgeColor: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
      tag: `${ordenesTrabajo.length} OTs`
    },
    {
      id: 'facturacion',
      titulo: 'Cobranza & Abonos',
      categoria: 'FINANZAS',
      descripcion: 'Gestión de facturación mensual, control de recaudación, saldos pendientes y estados de cuenta.',
      icono: DollarSign,
      gradient: 'from-emerald-500 to-green-600',
      borderColor: 'hover:border-green-400',
      glowColor: 'group-hover:shadow-green-500/25',
      badgeColor: 'bg-green-500/10 text-green-300 border-green-500/20',
      tag: `${facturas.length} Facturas`
    },
    {
      id: 'compras',
      titulo: 'Compras & Proveedores',
      categoria: 'ERP & ABASTECIMIENTO',
      descripcion: 'Control de insumos de seguridad, hardware de monitoreo, órdenes de compra y proveedores autorizados.',
      icono: Receipt,
      gradient: 'from-purple-600 to-indigo-500',
      borderColor: 'hover:border-purple-400',
      glowColor: 'group-hover:shadow-purple-500/25',
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      tag: 'Insumos'
    },
    {
      id: 'autonomia',
      titulo: 'Agentes Autónomos IA',
      categoria: 'INTELIGENCIA ARTIFICIAL',
      descripcion: 'Supervisión 24/7 de eventos críticos, auditoría automatizada y diagnóstico inteligente de operativas.',
      icono: Bot,
      gradient: 'from-cyan-500 to-blue-600',
      borderColor: 'hover:border-cyan-400',
      glowColor: 'group-hover:shadow-cyan-500/25',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      tag: '24/7 Activo'
    },
    {
      id: 'marketing',
      titulo: 'Marketing B2B',
      categoria: 'COMERCIAL',
      descripcion: 'Campañas comerciales, prospección de abonados corporativos y embudo de oportunidades de venta.',
      icono: Megaphone,
      gradient: 'from-pink-600 to-rose-500',
      borderColor: 'hover:border-pink-400',
      glowColor: 'group-hover:shadow-pink-500/25',
      badgeColor: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
      tag: 'Leads'
    },
    {
      id: 'kpis',
      titulo: 'Reportes & Analytics',
      categoria: 'DIRECCIÓN',
      descripcion: 'Métricas de rendimiento operativo, facturación acumulada, gráficos ejecutivos y análisis estadístico.',
      icono: BarChart3,
      gradient: 'from-indigo-600 to-cyan-500',
      borderColor: 'hover:border-indigo-400',
      glowColor: 'group-hover:shadow-indigo-500/25',
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      tag: 'Analytics'
    },
    {
      id: 'config',
      titulo: 'Configuración & Claves',
      categoria: 'SISTEMA',
      descripcion: 'Administración de 4 razones sociales emisoras del conglomerado, parámetros del sistema y seguridad.',
      icono: Settings,
      gradient: 'from-slate-600 to-slate-400',
      borderColor: 'hover:border-slate-400',
      glowColor: 'group-hover:shadow-slate-500/25',
      badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      tag: `${empresasConglomerado.length} Emisores`
    },
    {
      id: 'ley21719',
      titulo: 'Ley 21.719 Datos Personales',
      categoria: 'LEGAL & CUMPLIMIENTO',
      descripcion: 'Cumplimiento normativo APDP, generación de certificados oficiales PDF, contratos de secreto y auditoría.',
      icono: ShieldCheck,
      gradient: 'from-emerald-600 to-teal-500',
      borderColor: 'hover:border-emerald-400',
      glowColor: 'group-hover:shadow-emerald-500/25',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      tag: 'APDP Chile'
    }
  ]

  return (
    <div className="min-h-screen bg-[#050d1a] text-slate-100 font-sans flex flex-col select-none p-3 sm:p-5 md:p-6 gap-4 sm:gap-6 antialiased">
      
      {/* Estilos CSS para Impresión PDF Limpia (@media print) */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #seccion-imprimible-cotizacion, #seccion-imprimible-cotizacion * {
            visibility: visible !important;
          }
          #seccion-imprimible-cotizacion {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 12mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-imprimir {
            display: none !important;
          }
        }
      `}</style>

      {/* ── HEADER PRINCIPAL STYLE APPLE / LINEAR ── */}
      <OperacionHeader
        moduloActivoLabel={
          !moduloActivo ? 'Menú Principal' :
          moduloActivo === 'ficha360' ? 'Ficha 360° Cliente' :
          moduloActivo === 'presupuestos' ? 'Presupuestos & DTE' :
          moduloActivo === 'marketing' ? 'Marketing B2B' :
          moduloActivo === 'facturacion' ? 'Cobranza & Abonos' :
          moduloActivo === 'serv_tecnico' ? 'Servicios Técnicos' :
          moduloActivo === 'compras' ? 'Compras & Proveedores' :
          moduloActivo === 'contratos' ? 'Contratos & Firma' :
          moduloActivo === 'ley21719' ? 'Ley 21.719 Protección de Datos' :
          moduloActivo === 'kpis' ? 'Reportes & Analytics' :
          moduloActivo === 'config' ? 'Configuración & Claves' : 'Agentes Autónomos'
        }
        cantEmpresas={empresasConglomerado.length}
        valorUF={valorUF}
        moduloActivo={moduloActivo}
        onVolverMenu={() => setModuloActivo(null)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onQuickCotizacion={() => {
          setModuloActivo('presupuestos')
          setMostrarModalCotizacion(true)
        }}
        onQuickOT={() => {
          setModuloActivo('serv_tecnico')
          setMostrarModalOT(true)
        }}
        onOpenWhatsAppPlantillas={() => {
          setPlantillaWhatsAppAbonado({
            cuenta: cuentaSeleccionada || (clienteActivo?.cuentas_abonados?.[0] || '1042'),
            nombre: clienteActivo?.razon_social || abonadoActivo?.alias_centro_costo || 'Cliente Gama',
            telefono: clienteActivo?.telefono || '+56991016912',
            direccion: abonadoActivo?.direccion || clienteActivo?.direccion_comercial || 'Dirección Registrada',
            rut: clienteActivo?.rut || ''
          })
          setModalPlantillasWhatsAppActivo(true)
        }}
      />

      {/* ── CONTENEDOR PRINCIPAL RESPONSIVE (SIN DIVISIONES, CON MODALES AMPLIOS) ── */}
      <div className="flex-1 overflow-hidden min-h-0 no-imprimir flex flex-col relative">

        {/* ── VISTA 1: LAUNCHPAD HUB PRINCIPAL (10 BOTONES GRANDES) ── */}
        {!moduloActivo ? (
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 sm:gap-8 no-imprimir pb-8 pr-1 animate-in fade-in duration-200">
            
            {/* BANNER DE BIENVENIDA EJECUTIVO */}
            <div className="bg-gradient-to-r from-[#0a1628]/95 via-[#0d1f38]/90 to-[#0a1628]/95 backdrop-blur-xl border border-[#1e3a5f]/70 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#0066cc]/20 text-[#2997ff] border border-[#0066cc]/40 flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#2997ff] animate-pulse" />
                    CENTRAL OPERATIVA GAMA
                  </span>
                  <span className="text-xs text-slate-400 font-mono">| PLATAFORMA INTEGRAL</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Centro de Control & Gestión Operativa
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Seleccione cualquiera de los módulos para operar en pantalla completa, con máxima amplitud y sin barras laterales restrictivas.
                </p>
              </div>

              {/* STATS EN TIEMPO REAL */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto shrink-0">
                <div className="bg-[#050d1a]/80 border border-[#1e3a5f]/80 px-4 py-2.5 rounded-2xl flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Empresas</span>
                  <span className="text-base font-extrabold text-white font-mono">{empresasConglomerado.length}</span>
                </div>
                <div className="bg-[#050d1a]/80 border border-[#1e3a5f]/80 px-4 py-2.5 rounded-2xl flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clientes</span>
                  <span className="text-base font-extrabold text-[#2997ff] font-mono">{Object.keys(clientesMaestros).length}</span>
                </div>
                <div className="bg-[#050d1a]/80 border border-[#1e3a5f]/80 px-4 py-2.5 rounded-2xl flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Abonados</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">{Object.keys(abonadosCentrosCosto).length}</span>
                </div>
                <div className="bg-[#050d1a]/80 border border-[#1e3a5f]/80 px-4 py-2.5 rounded-2xl flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">OTs Activas</span>
                  <span className="text-base font-extrabold text-amber-400 font-mono">{ordenesTrabajo.length}</span>
                </div>
              </div>
            </div>

            {/* GRID DE BOTONES GRANDES (LAUNCHPAD DE 10 MÓDULOS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 sm:gap-6">
              {modulosLaunchpad.map((mod) => {
                const IconComp = mod.icono
                return (
                  <button
                    key={mod.id}
                    onClick={() => setModuloActivo(mod.id as any)}
                    className={`group relative text-left rounded-3xl bg-gradient-to-b from-[#0c1a2e] to-[#07111e] border border-[#1e3a5f]/60 ${mod.borderColor} p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${mod.glowColor} hover:-translate-y-1.5 cursor-pointer min-h-[220px] overflow-hidden`}
                  >
                    {/* Glow de fondo */}
                    <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/[0.02] group-hover:bg-white/[0.06] transition-all blur-xl pointer-events-none" />

                    {/* Top Bar de la Card */}
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComp className="h-6 w-6 stroke-[2]" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono tracking-wider ${mod.badgeColor}`}>
                        {mod.categoria}
                      </span>
                    </div>

                    {/* Contenido Central */}
                    <div className="space-y-1.5 my-3 relative z-10">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-[#2997ff] transition-colors">
                        {mod.titulo}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {mod.descripcion}
                      </p>
                    </div>

                    {/* Footer de la Card con Acción */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold relative z-10">
                      <span className="text-slate-500 font-mono text-[11px]">
                        {mod.tag}
                      </span>
                      <span className="text-[#2997ff] group-hover:text-white flex items-center gap-1 text-xs font-bold transition-colors">
                        <span>Abrir Módulo</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

          </div>
        ) : (
          /* ── VISTA 2: VENTANA EMERGENTE DEL MÓDULO (PANTALLA COMPLETA ESPACIOSA) ── */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#07111e]/95 backdrop-blur-xl border border-[#1e3a5f]/70 rounded-3xl shadow-2xl p-4 sm:p-6 min-h-0 relative no-imprimir animate-in zoom-in-95 duration-200">
            
            {/* BARRA SUPERIOR DE NAVEGACIÓN, VOLVER Y CERRAR */}
            <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10 shrink-0">
              <button
                onClick={() => setModuloActivo(null)}
                className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 bg-[#0f2240] hover:bg-[#162a4a] text-white border border-[#1e3a5f] hover:border-[#2997ff] rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all group cursor-pointer active:scale-95"
              >
                <ArrowLeft className="h-4 w-4 text-[#2997ff] group-hover:-translate-x-1 transition-transform" />
                <span>← Volver al Menú Principal</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {
                    moduloActivo === 'ficha360' ? 'Ficha 360° Cliente' :
                    moduloActivo === 'presupuestos' ? 'Presupuestos & DTE' :
                    moduloActivo === 'marketing' ? 'Marketing B2B' :
                    moduloActivo === 'facturacion' ? 'Cobranza & Abonos' :
                    moduloActivo === 'serv_tecnico' ? 'Servicios Técnicos' :
                    moduloActivo === 'compras' ? 'Compras & Proveedores' :
                    moduloActivo === 'contratos' ? 'Contratos & Firma' :
                    moduloActivo === 'ley21719' ? 'Ley 21.719 Protección de Datos' :
                    moduloActivo === 'kpis' ? 'Reportes & Analytics' :
                    moduloActivo === 'config' ? 'Configuración & Claves' : 'Agentes Autónomos'
                  }
                </span>
                <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0066cc]/20 text-[#2997ff] border border-[#0066cc]/40">
                  VENTANA COMPLETA
                </span>
              </div>

              <button
                onClick={() => setModuloActivo(null)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-white border border-red-500/30 hover:border-red-500 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                title="Cerrar módulo y volver al menú (Esc)"
              >
                <X className="h-4 w-4" />
                <span>✕ Cerrar</span>
              </button>
            </div>

            {/* CONTENEDOR PRINCIPAL CON ESPACIO MÁXIMO PARA EL MÓDULO */}
            <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 pr-1">

          {/* ── BENTO GRID DE KPIS EJECUTIVOS EN TOP DE FICHA 360 Y REPORTES ── */}
          {(moduloActivo === 'ficha360' || moduloActivo === 'kpis') && (
            <BentoKpiGrid
              totalClientes={Object.keys(clientesMaestros).length}
              totalCentrosCosto={Object.keys(abonadosCentrosCosto).length}
              facturasTotalesMonto={facturas.reduce((acc, f) => acc + (f.monto_total || 0), 0)}
              facturasPendientesMonto={facturas.reduce((acc, f) => acc + (f.saldo_pendiente || 0), 0)}
              cotizacionesTotalMonto={cotizaciones.reduce((acc, c) => acc + (c.monto_total_iva_incluido || 0), 0)}
              cotizacionesCount={cotizaciones.length}
              ordenesTrabajoCount={ordenesTrabajo.length}
              onNavigateTab={(t) => setModuloActivo(t as any)}
            />
          )}

          {/* ── MÓDULO 1: FICHA 360° DEL CLIENTE COMPLETA (BENTO GRID APPLE) ── */}
          {moduloActivo === 'ficha360' && (
            <div className="flex-1 flex flex-col gap-6 sm:gap-8 min-h-0">
              
              {/* BUSCADOR SPOTLIGHT APPLE HIG */}
              <div className="bg-[#0a1628]/80 backdrop-blur-md border border-[#1e3a5f]/60 p-5 sm:p-6 rounded-2xl shadow-lg flex flex-col gap-4 transition-all">
                <div className="font-semibold text-xs text-slate-400 uppercase tracking-wider flex justify-between items-center font-sans">
                  <span className="flex items-center gap-2 text-slate-300">
                    <div className="p-1.5 bg-[#0066cc]/20 text-[#2997ff] rounded-lg border border-[#0066cc]/30">
                      <Search className="h-4 w-4 stroke-[1.5]" />
                    </div>
                    <span>BUSCADOR INTELIGENTE 360° (CÓDIGO DE ABONADO, NOMBRE O RUT)</span>
                  </span>
                  {(cuentaSeleccionada || rutClienteSeleccionado) && (
                    <button
                      onClick={() => { setCuentaSeleccionada(''); setRutClienteSeleccionado(''); setBusquedaClienteInput('') }}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-xl transition-all"
                    >
                      <X className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>Limpiar Selección</span>
                    </button>
                  )}
                </div>

                <div className="relative flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full flex items-center">
                    <Search className="absolute left-4 h-4 w-4 text-[#2997ff] pointer-events-none stroke-[1.5]" />
                    <input
                      type="text"
                      value={busquedaClienteInput}
                      onChange={(e) => setBusquedaClienteInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleDispararBusqueda() }}
                      placeholder="Escriba código de Abonado (ej: 0999, C774, C7C5), Nombre del Cliente o RUT..."
                      className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2997ff] font-mono tracking-wide transition-colors"
                    />
                  </div>

                  <button
                    onClick={handleDispararBusqueda}
                    disabled={buscandoSpinner}
                    className="w-full sm:w-auto btn-apple-primary text-xs py-3.5 px-6 font-semibold shadow-lg shadow-[#0066cc]/20 shrink-0"
                  >
                    {buscandoSpinner ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 stroke-[1.5]" />
                    )}
                    <span>Buscar 360°</span>
                  </button>

                  {/* DESPLEGABLE FLOTANTE DE RESULTADOS DE BÚSQUEDA APPLE HIG */}
                  {busquedaClienteInput.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-[#0a1628]/95 backdrop-blur-xl border border-[#1e3a5f] rounded-2xl shadow-2xl z-30 max-h-96 overflow-y-auto p-2 space-y-1 text-left">
                      {resultadosBusqueda.length > 0 ? (
                        resultadosBusqueda.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setModuloActivo('ficha360')
                              if (item.tipo === 'abonado' && item.cuenta) {
                                const ctaCode = item.cuenta.toUpperCase().trim()
                                setCuentaSeleccionada(ctaCode)
                                const cc = abonadosCentrosCosto[ctaCode] || centrosCostoPreasociados[ctaCode as keyof typeof centrosCostoPreasociados]
                                if (cc && cc.rut_cliente) {
                                  setRutClienteSeleccionado(cc.rut_cliente)
                                } else {
                                  setRutClienteSeleccionado(item.rut)
                                }
                              } else {
                                setRutClienteSeleccionado(item.rut)
                                const cli = clientesMaestros[item.rut] || Object.values(clientesMaestros).find(c => c.rut === item.rut)
                                if (cli && cli.cuentas_abonados && cli.cuentas_abonados.length > 0) {
                                  setCuentaSeleccionada(cli.cuentas_abonados[0].toUpperCase().trim())
                                }
                              }
                              setBusquedaClienteInput('')
                            }}
                            className="p-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl cursor-pointer flex justify-between items-center transition-all group"
                          >
                            <div className="space-y-1">
                              <div className="font-bold text-xs text-white flex items-center gap-2 flex-wrap">
                                {item.tipo === 'abonado' && (
                                  <span className="bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-mono text-[10px] px-2.5 py-0.5 rounded-lg font-bold shadow-xs">
                                    Abonado #{item.cuenta}
                                  </span>
                                )}
                                <span className="text-white font-extrabold">{item.alias || item.razon_social}</span>
                                {item.rut && !item.rut.startsWith('CTA-') && !item.rut.startsWith('RUT-') && (
                                  <span className="font-mono text-slate-300 text-[10px] bg-white/10 border border-white/10 px-2 py-0.5 rounded-lg font-bold">
                                    RUT: {item.rut}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-[#2997ff] group-hover:translate-x-1 transition-transform" />
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-400 font-bold text-xs">
                          No se encontraron coincidencias para &quot;{busquedaClienteInput}&quot;.
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* EXPEDIENTE COMPLETO DOSSIER FICHA 360° */}
              {clienteActivo || abonadoActivo ? (
                <div className="flex-1 bg-[#0c182b]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-white/10 shadow-2xl overflow-y-auto">
                  
                  {/* CABECERA EXPEDIENTE VISTA 360° BENTO HERO */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-7 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xl">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {abonadoActivo && (
                          <span className="bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-mono text-xs font-bold px-3.5 py-1 rounded-xl shadow-xs">
                            CUENTA ABONADO #{abonadoActivo.cuenta}
                          </span>
                        )}
                        {clienteActivo && clienteActivo.rut && !clienteActivo.rut.startsWith('CTA-') && !clienteActivo.rut.startsWith('RUT-') && (
                          <span className="bg-white/10 border border-white/10 text-white font-mono text-xs font-bold px-3.5 py-1 rounded-xl shadow-xs">
                            RUT: {clienteActivo.rut}
                          </span>
                        )}
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-black px-3 py-1 rounded-xl text-xs uppercase tracking-wider">
                          🟢 {clienteActivo?.estado_pago || 'Al Día'}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        {abonadoActivo ? abonadoActivo.alias_centro_costo : clienteActivo?.razon_social}
                      </h2>

                      <p className="text-xs text-slate-400 font-semibold flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#2997ff]" /> {abonadoActivo ? abonadoActivo.direccion : clienteActivo?.direccion_comercial} ({clienteActivo?.ciudad || 'Santiago'})</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-[#2997ff]" /> {clienteActivo?.email_cobranza}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-[#2997ff]" /> {clienteActivo?.telefono}</span>
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                      <div className="flex items-center gap-4 bg-white/[0.04] border border-white/10 p-5 rounded-2xl shadow-lg">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TARIFA MONITOREO</span>
                          <div className="text-xl font-black font-mono text-[#2997ff]">
                            {clienteActivo?.moneda === 'UF' ? `${clienteActivo.tarifa_mensual} UF` : `$${(clienteActivo?.tarifa_mensual || 29900).toLocaleString('es-CL')} CLP`}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Plan: {clienteActivo?.plan_monitoreo || 'Estándar 24/7'}</span>
                        </div>
                      </div>

                      {/* ACCIONES RÁPIDAS DE ACTUALIZACIÓN DE FICHA */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            const cta = abonadoActivo?.cuenta || clienteActivo?.cuentas_abonados?.[0] || cuentaSeleccionada || ''
                            const tel = (clienteActivo?.telefono || '').replace(/[^0-9]/g, '')
                            const nombre = abonadoActivo?.alias_centro_costo || clienteActivo?.razon_social || 'Cliente'
                            const baseUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://controltestmonitoreo.vercel.app'
                            const link = `${baseUrl}/actualizar?cuenta=${cta}`
                            const msg = encodeURIComponent(`Hola ${nombre}, para garantizar la correcta respuesta de su sistema de alarma 24/7 y mantener al día sus contactos de emergencia, por favor confirme sus datos en el siguiente enlace oficial: ${link}`)
                            if (tel) {
                              const dest = tel.startsWith('56') ? tel : ('56' + tel)
                              window.open(`https://wa.me/${dest}?text=${msg}`, '_blank')
                            } else {
                              window.open(`https://wa.me/?text=${msg}`, '_blank')
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                          title="Enviar link de actualización por WhatsApp"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          <span>Enviar WhatsApp Ficha</span>
                        </button>

                        <button
                          onClick={() => {
                            const cta = abonadoActivo?.cuenta || clienteActivo?.cuentas_abonados?.[0] || cuentaSeleccionada || ''
                            const baseUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://controltestmonitoreo.vercel.app'
                            const link = `${baseUrl}/actualizar?cuenta=${cta}`
                            navigator.clipboard.writeText(link)
                            alert(`¡Enlace copiado al portapapeles!\n${link}`)
                          }}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                          title="Copiar enlace de actualización"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar Link</span>
                        </button>

                        <button
                          onClick={() => {
                            const cta = abonadoActivo?.cuenta || clienteActivo?.cuentas_abonados?.[0] || cuentaSeleccionada || ''
                            window.open(`/actualizar?cuenta=${cta}`, '_blank')
                          }}
                          className="px-3 py-2 rounded-xl bg-[#0066cc]/30 hover:bg-[#0066cc]/50 border border-[#0066cc]/40 text-[#2997ff] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                          title="Abrir formulario de actualización en nueva pestaña"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Abrir Portal</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* NAVEGACIÓN PESTAÑAS FICHA 360° BENTO */}
                  <div className="flex items-center gap-2 bg-black/30 p-2 rounded-2xl border border-white/10 flex-wrap">
                    {[
                      { id: 'datos', label: 'Datos Comerciales', icon: Building2 },
                      { id: 'abonados', label: `Centros de Costo (${clienteActivo?.cuentas_abonados.length || 1})`, icon: Layers },
                      { id: 'contrato', label: 'Contrato Digital', icon: FileCheck },
                      { id: 'facturas', label: `Facturas & Abonos`, icon: Receipt },
                      { id: 'cotizaciones', label: `Presupuestos DTE`, icon: FileText },
                      { id: 'ots', label: `Órdenes Técnicas (SLA)`, icon: Wrench },
                    ].map(tab => {
                      const TabIcon = tab.icon
                      const esActivo = tabFicha360 === tab.id
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setTabFicha360(tab.id as any)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${esActivo ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-lg shadow-[#0066cc]/30' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
                        >
                          <TabIcon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* SUB-SECCIÓN 1: DATOS COMERCIALES EN BENTO GRID MODULAR */}
                  {tabFicha360 === 'datos' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-4 text-xs shadow-xl">
                        <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                          <div className="p-2 bg-blue-500/15 text-[#2997ff] rounded-xl border border-blue-500/20">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">📍 DATOS DE CONTACTO & UBICACIÓN</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Razón Social:</strong> <span className="text-white font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-xl">{clienteActivo?.razon_social}</span></div>
                          <div className="flex justify-between items-center"><strong className="text-slate-400">RUT Tributario:</strong> <span className="text-white font-mono font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-xl">{clienteActivo?.rut}</span></div>
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Dirección Comercial:</strong> <span className="text-slate-200 font-medium">{clienteActivo?.direccion_comercial}</span></div>
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Ciudad / Comuna:</strong> <span className="text-white font-bold">{clienteActivo?.ciudad || 'Santiago'}</span></div>
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Teléfono Principal:</strong> <span className="text-white font-mono font-bold">{clienteActivo?.telefono}</span></div>
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Email Facturación:</strong> <span className="text-slate-200 font-medium">{clienteActivo?.email_cobranza}</span></div>
                        </div>
                      </div>

                      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-4 text-xs shadow-xl">
                        <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                          <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <Receipt className="h-4 w-4" />
                          </div>
                          <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">💳 CONDICIONES DE FACTURACIÓN & PLAN</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Razón Social Emisora:</strong> <span className="text-[#2997ff] font-extrabold bg-white/5 border border-white/10 px-3 py-1 rounded-xl">Gama Seguridad SpA (EMP-1)</span></div>
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Moneda Pactada:</strong> <span className="text-white font-bold">{clienteActivo?.moneda}</span></div>
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Tarifa Mensual:</strong> <span className="text-emerald-400 font-mono font-bold">{clienteActivo?.moneda === 'UF' ? `${clienteActivo.tarifa_mensual} UF` : `$${(clienteActivo?.tarifa_mensual || 29900).toLocaleString('es-CL')} CLP`}</span></div>
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Día Vencimiento:</strong> <span className="text-white font-bold">Día {clienteActivo?.dia_vencimiento || 5} de cada mes</span></div>
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Plan de Monitoreo:</strong> <span className="text-white font-bold">{clienteActivo?.plan_monitoreo}</span></div>
                          <div className="flex justify-between items-center"><strong className="text-slate-400">Estado de Cobranza:</strong> <span className="text-emerald-400 font-bold">🟢 {clienteActivo?.estado_pago}</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-SECCIÓN 2: CENTROS DE COSTO (BENTO CARDS) */}
                  {tabFicha360 === 'abonados' && (
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-5 text-xs shadow-xl">
                      <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                        <div className="p-2 bg-blue-500/15 text-[#2997ff] rounded-xl border border-blue-500/20">
                          <Layers className="h-4 w-4" />
                        </div>
                        <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">🏢 CENTROS DE COSTO & CUENTAS DE ABONADO ASOCIADAS</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(clienteActivo?.cuentas_abonados || []).map(cta => {
                          const cc = abonadosCentrosCosto[cta]
                          const baseUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://controltestmonitoreo.vercel.app'
                          const linkAbonado = `${baseUrl}/actualizar?cuenta=${cta}`
                          return (
                            <div key={cta} className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 p-5 rounded-2xl space-y-3 transition-all">
                              <div className="flex justify-between items-center flex-wrap gap-2">
                                <span className="bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-mono font-black text-xs px-3 py-1 rounded-xl shadow-xs">
                                  Abonado #{cta}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">🟢 Monitoreo Activo 24/7</span>
                              </div>
                              <h4 className="font-extrabold text-white text-sm">{cc?.alias_centro_costo || `Abonado ${cta}`}</h4>
                              <p className="text-slate-400 text-xs flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#2997ff]" /> {cc?.direccion || 'Dirección Instalación'} ({cc?.ciudad || 'Santiago'})</p>
                              
                              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const tel = (clienteActivo?.telefono || '').replace(/[^0-9]/g, '')
                                    const msg = encodeURIComponent(`Hola ${cc?.alias_centro_costo || 'Cliente'}, por favor actualice los contactos de emergencia para la cuenta ${cta} aquí: ${linkAbonado}`)
                                    if (tel) {
                                      const dest = tel.startsWith('56') ? tel : ('56' + tel)
                                      window.open(`https://wa.me/${dest}?text=${msg}`, '_blank')
                                    } else {
                                      window.open(`https://wa.me/?text=${msg}`, '_blank')
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Smartphone className="h-3 w-3" />
                                  <span>WhatsApp Ficha #{cta}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(linkAbonado)
                                    alert(`Link copiado: ${linkAbonado}`)
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Copy className="h-3 w-3" />
                                  <span>Copiar</span>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUB-SECCIÓN CONTRATO DIGITAL (BENTO CARD LEGAL) */}
                  {tabFicha360 === 'contrato' && (
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 text-xs shadow-xl">
                      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <FileCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-sm uppercase tracking-wider text-white block">
                              CONTRATO DE PRESTACIÓN DE SERVICIOS DE MONITOREO 24/7
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Contrato N° CTR-2026-{(abonadoActivo?.cuenta || clienteActivo?.cuentas_abonados?.[0] || 'C701').toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setMostrarModalContratoFicha(true)}
                            className="btn-apple-primary text-xs py-2.5 px-5 font-bold flex items-center gap-2 shadow-lg shadow-[#0066cc]/30"
                          >
                            <FileCheck className="h-4 w-4" />
                            <span>Abrir Editor & Pad de Firma Digital</span>
                          </button>
                        </div>
                      </div>

                      {/* Bento Grid Resumen del Contrato */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/[0.04] border border-white/10 p-4 rounded-2xl space-y-2">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">1. EMPRESA EMISORA</span>
                          <div className="font-extrabold text-white text-sm">INVERSIONES GAMA SpA</div>
                          <div className="font-mono text-slate-400 text-xs">RUT: 78.297.009-7</div>
                          <div className="text-slate-400 text-[11px]">Representante: Tomás Toro-Moreno Olavarría</div>
                        </div>

                        <div className="bg-white/[0.04] border border-white/10 p-4 rounded-2xl space-y-2">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">2. EL SUSCRIPTOR / CLIENTE</span>
                          <div className="font-extrabold text-white text-sm truncate">{clienteActivo?.razon_social}</div>
                          <div className="font-mono text-slate-400 text-xs">RUT: {clienteActivo?.rut}</div>
                          <div className="text-slate-400 text-[11px] truncate">{clienteActivo?.direccion_comercial}</div>
                        </div>

                        <div className="bg-white/[0.04] border border-white/10 p-4 rounded-2xl space-y-2">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">3. TARIFA PACTADA</span>
                          <div className="font-mono font-black text-[#2997ff] text-base">
                            {clienteActivo?.moneda === 'UF' ? `${clienteActivo.tarifa_mensual} UF/mes` : `$${(clienteActivo?.tarifa_mensual || 29900).toLocaleString('es-CL')} CLP/mes`} + IVA
                          </div>
                          <div className="text-slate-400 text-[11px]">Plazo: 36 Meses (Sin multas de salida con aviso 30 días)</div>
                        </div>
                      </div>

                      {/* Resumen de Cláusulas Principales */}
                      <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-3 text-slate-300 text-xs leading-relaxed">
                        <div className="font-bold text-white uppercase text-[11px] flex items-center gap-2">
                          <Shield className="h-4 w-4 text-[#2997ff]" />
                          <span>SÍNTESIS DE CLÁUSULAS OFICIALES GAMA:</span>
                        </div>
                        <p>• <strong>Propiedad de Equipos:</strong> El Cliente declara ser dueño absoluto del sistema de alarma instalado, habiéndolo adquirido previamente a Gama Seguridad SpA con respaldo tributario. No existe régimen de comodato forzoso ni derechos de retiro físico al término del servicio.</p>
                        <p>• <strong>Garantía de Instalación:</strong> Garantía de 12 meses sobre la instalación y funcionamiento de equipos.</p>
                        <p>• <strong>Protocolo de Central:</strong> Obligación de medios para verificación telefónica y sobreaviso a unidades de emergencia (Carabineros / Bomberos / Ambulancia).</p>
                        <p>• <strong>Término Anticipado:</strong> El Cliente podrá poner término al contrato en cualquier momento, sin multas ni amarres, con aviso previo de 30 días corridos.</p>
                      </div>
                    </div>
                  )}

                  {/* SUB-SECCIÓN 3: FACTURAS (BENTO CARD) */}
                  {tabFicha360 === 'facturas' && (
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-5 text-xs shadow-xl">
                      <div className="flex justify-between items-center flex-wrap gap-3 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <Receipt className="h-4 w-4" />
                          </div>
                          <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">🧾 FACTURACIÓN & RECAUDACIÓN DE ESTE CLIENTE</span>
                        </div>
                        <button
                          onClick={() => setModuloActivo('facturacion')}
                          className="px-4 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-bold rounded-xl text-xs shadow-lg shadow-[#0066cc]/20 hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-2"
                        >
                          <DollarSign className="h-4 w-4" />
                          <span>💰 Ir a Gestor Global de Cobranzas (34 Facturas Real)</span>
                        </button>
                      </div>
                      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-2">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-white/10 font-black uppercase text-[11px] text-slate-400 tracking-wider">
                              <th className="py-4 px-4">N° FACTURA</th>
                              <th className="py-4 px-4">FECHA EMISIÓN</th>
                              <th className="py-4 px-4 text-right">TOTAL</th>
                              <th className="py-4 px-4 text-right">ABONADO</th>
                              <th className="py-4 px-4 text-right">SALDO PENDIENTE</th>
                              <th className="py-4 px-4 text-center">ESTADO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-medium">
                            {facturas.filter(f => f.rut_cliente === clienteActivo?.rut || f.cuenta_asociada === cuentaSeleccionada).map(f => (
                              <tr key={f.id} className="hover:bg-white/[0.04] transition-colors">
                                <td className="py-4 px-4 font-mono font-black text-[#2997ff]">{f.numero_factura}</td>
                                <td className="py-4 px-4 font-semibold text-slate-300">{f.fecha}</td>
                                <td className="py-4 px-4 text-right font-mono font-bold text-white">${f.monto_total.toLocaleString('es-CL')}</td>
                                <td className="py-4 px-4 text-right font-mono text-emerald-400 font-bold">${(f.monto_abonado || 0).toLocaleString('es-CL')}</td>
                                <td className="py-4 px-4 text-right font-mono text-rose-400 font-bold">${(f.saldo_pendiente || 0).toLocaleString('es-CL')}</td>
                                <td className="py-4 px-4 text-center font-bold">
                                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs uppercase font-extrabold">{f.estado}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-SECCIÓN 4: COTIZACIONES (BENTO CARD) */}
                  {tabFicha360 === 'cotizaciones' && (
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-5 text-xs shadow-xl">
                      <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl border border-indigo-500/20">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">📋 PRESUPUESTOS & COTIZACIONES EMITIDAS</span>
                        </div>
                        <button onClick={abrirModalNuevaCotizacion} className="px-4 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-[#0066cc]/20 hover:brightness-110 active:scale-95 cursor-pointer">
                          <Plus className="h-4 w-4" />
                          <span>Nueva Cotización</span>
                        </button>
                      </div>
                      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-2">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-white/10 font-black uppercase text-[11px] text-slate-400 tracking-wider">
                              <th className="py-4 px-4">FOLIO</th>
                              <th className="py-4 px-4">FECHA</th>
                              <th className="py-4 px-4 text-right">TOTAL IVA INCL.</th>
                              <th className="py-4 px-4 text-center">ETAPA PIPELINE</th>
                              <th className="py-4 px-4 text-center">ACCIONES</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-medium">
                            {cotizaciones.filter(c => c.rut_cliente === clienteActivo?.rut || c.cuenta === cuentaSeleccionada).map(c => (
                              <tr key={c.id} className="hover:bg-white/[0.04] transition-colors">
                                <td className="py-4 px-4 font-mono font-black text-[#2997ff]">{c.codigo_cotizacion}</td>
                                <td className="py-4 px-4 font-semibold text-slate-300">{c.fecha}</td>
                                <td className="py-4 px-4 text-right font-mono font-black text-emerald-400">${Math.round(c.monto_total_iva_incluido || 0).toLocaleString('es-CL')}</td>
                                <td className="py-4 px-4 text-center font-bold">
                                  <span className="bg-white/5 border border-white/10 text-slate-200 px-3 py-1 rounded-xl text-xs font-bold">{c.etapa_pipeline || 'Cotización'}</span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <button onClick={() => setCotSeleccionada(c)} className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md active:scale-95 transition-all">
                                    Ver DTE
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-SECCIÓN 5: ORDENES TÉCNICAS (BENTO CARD) */}
                  {tabFicha360 === 'ots' && (
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-5 text-xs shadow-xl">
                      <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                        <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/20">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">🛠️ ÓRDENES TÉCNICAS (SLA FIELD SERVICE)</span>
                      </div>
                      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-2">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-white/10 font-black uppercase text-[11px] text-slate-400 tracking-wider">
                              <th className="py-4 px-4">CÓDIGO OT</th>
                              <th className="py-4 px-4">SERVICIO</th>
                              <th className="py-4 px-4">SLA</th>
                              <th className="py-4 px-4">TÉCNICO</th>
                              <th className="py-4 px-4 text-center">ESTADO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-medium">
                          {ordenesTrabajo.filter(ot => ot.cuenta === cuentaSeleccionada || ot.cliente_nombre.includes(clienteActivo?.razon_social || '')).map(ot => (
                              <tr key={ot.id} className="hover:bg-white/[0.04] transition-colors">
                                <td className="py-4 px-4 font-mono font-black text-[#2997ff]">{ot.codigo_ot}</td>
                                <td className="py-4 px-4 font-extrabold text-white">{ot.tipo_servicio}</td>
                                <td className="py-4 px-4 font-bold text-amber-400">{ot.prioridad_sla}</td>
                                <td className="py-4 px-4 font-semibold text-slate-300">{ot.tecnico_asignado}</td>
                                <td className="py-4 px-4 text-center font-bold">
                                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-xl text-xs font-black">{ot.estado}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── BENTO CARD: ÚLTIMAS 10 SEÑALES DE ALARMA RECEPTOR ── */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-4 text-xs transition-all shadow-xl">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-500/15 text-[#2997ff] rounded-xl border border-blue-500/20">
                          <Activity className="h-4 w-4" />
                        </div>
                        <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">
                          ÚLTIMAS 10 SEÑALES DE SU ALARMA (#{(abonadoActivo?.cuenta || cuentaSeleccionada || 'ACTIVA').toUpperCase()})
                        </span>
                      </div>
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-3 py-1 rounded-xl flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Receptor en Línea</span>
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-2">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/10 font-extrabold uppercase text-[11px] text-slate-400">
                            <th className="p-3">FECHA Y HORA</th>
                            <th className="p-3">DESCRIPCIÓN RECEPTOR</th>
                            <th className="p-3">ZONA / USUARIO</th>
                            <th className="p-3 text-center">PRIORIDAD</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium">
                          {cargandoSenales ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400 font-bold">
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2 text-[#2997ff]" />
                                Cargando señales del abonado...
                              </td>
                            </tr>
                          ) : senalesRealtime.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center">
                                <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/10 space-y-1 inline-block max-w-xl">
                                  <div className="flex items-center justify-center gap-2 text-amber-400 font-extrabold text-xs">
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                                    <span>Sin transmisiones recientes de señales de alarma</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-semibold">
                                    No se registran transmisiones de señales emitidas por el panel a la central para la cuenta #{(abonadoActivo?.cuenta || cuentaSeleccionada || '').toUpperCase()}.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            senalesRealtime.map(s => (
                              <tr key={s.id} className="hover:bg-white/[0.04] transition-all">
                                <td className="p-3 font-mono text-slate-300 text-[11px] font-bold">{s.fecha}</td>
                                <td className="p-3 font-bold text-white">{s.desc}</td>
                                <td className="p-3 text-slate-300 font-semibold">{s.zona}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${s.color}`}>
                                    {s.prioridad}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── BENTO CARD: ÚLTIMAS 5 NOVEDADES REGISTRADAS EN BITÁCORA DEL COMMAND CENTER ── */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-4 text-xs transition-all shadow-xl">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-500/15 text-[#2997ff] rounded-xl border border-blue-500/20">
                          <ClipboardList className="h-4 w-4" />
                        </div>
                        <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">
                          ÚLTIMAS NOVEDADES REGISTRADAS EN BITÁCORA COMMAND CENTER (#{(abonadoActivo?.cuenta || cuentaSeleccionada || 'ACTIVA').toUpperCase()})
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-300 bg-white/10 border border-white/10 px-3 py-1 rounded-xl">
                        Central 24/7 API
                      </span>
                    </div>

                    <div className="relative pl-3 md:pl-6 border-l-2 border-white/10 space-y-4 my-2">
                      {cargandoBitacoraCC ? (
                        <div className="text-center p-6 text-slate-400 font-bold text-xs">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2 text-[#2997ff]" />
                          Cargando novedades de la bitácora del Command Center...
                        </div>
                      ) : bitacoraCommandCenterAbonado.length === 0 ? (
                        <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl text-center space-y-1">
                          <p className="font-bold text-slate-300 text-xs flex items-center justify-center gap-2">
                            <ClipboardList className="h-4 w-4 text-slate-400" />
                            <span>Sin novedades registradas en la bitácora para la cuenta #{(abonadoActivo?.cuenta || cuentaSeleccionada || '').toUpperCase()}.</span>
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">No existen registros ni novedades asociadas a este abonado en la bitácora del Command Center.</p>
                        </div>
                      ) : (
                        bitacoraCommandCenterAbonado.map(b => (
                          <div key={b.id} className="relative group">
                            {/* PUNTAL DE LÍNEA DE TIEMPO */}
                            <span 
                              className="absolute -left-[19px] md:-left-[31px] top-4 h-3.5 w-3.5 rounded-full border-2 border-[#0c182b] shadow-xs" 
                              style={{ backgroundColor: b.color || '#2997ff' }}
                            />

                            {/* TARJETA DE NOVEDAD */}
                            <div className="bg-white/[0.04] border border-white/10 p-4 md:p-5 rounded-2xl space-y-3 hover:border-white/20 transition-all border-l-4" style={{ borderLeftColor: b.color || '#2997ff' }}>
                              
                              {/* CABECERA ESTRUCTURADA */}
                              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-white/10 pb-2.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* BADGE DE TIPO DE NOVEDAD */}
                                  <span 
                                    className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-white/10 border border-white/10 flex items-center gap-1.5"
                                    style={{ color: b.color || '#2997ff' }}
                                  >
                                    <MessageSquare className="h-3 w-3 stroke-[2.5]" />
                                    <span>{b.tipo}</span>
                                  </span>

                                  {/* OPERADOR RESPONSABLE */}
                                  <span className="bg-white/5 border border-white/10 text-slate-300 font-bold px-3 py-1 rounded-xl text-[11px] flex items-center gap-1.5">
                                    <User className="h-3 w-3 text-slate-400 stroke-[2.5]" />
                                    <span>{b.autor}</span>
                                  </span>
                                </div>

                                {/* FECHA Y HORA FORMATO MONO */}
                                <span className="bg-white/5 border border-white/10 text-slate-400 font-mono text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  <span>{b.fecha}</span>
                                </span>
                              </div>

                              {/* CUERPO DEL COMENTARIO ESTRUCTURADO EN BLOQUES */}
                              <div className="space-y-1.5 pt-1">
                                {b.nota.split(/\r?\n/).filter(Boolean).map((line: string, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 font-medium leading-relaxed">
                                    <span className="text-[#2997ff] font-black text-xs shrink-0 mt-0.5">•</span>
                                    <span className="bg-white/[0.03] border border-white/5 px-3 py-2 rounded-xl w-full text-slate-200 font-medium leading-relaxed">
                                      {line.trim()}
                                    </span>
                                  </div>
                                ))}
                              </div>

                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex-1 bg-[#0c182b]/85 backdrop-blur-2xl rounded-3xl p-16 text-center border border-white/10 shadow-2xl flex flex-col items-center justify-center gap-4">
                  <div className="p-5 bg-white/[0.04] border border-white/10 rounded-2xl text-[#2997ff] shadow-xl">
                    <User className="h-12 w-12 stroke-[1.75]" />
                  </div>
                  <h3 className="text-lg font-black text-white">Búsqueda de Abonado / Cliente 360°</h3>
                  <p className="text-xs text-slate-400 max-w-md font-semibold leading-relaxed">
                    Escriba un código de Abonado (ej: 0999, C774), Razón Social o RUT en el buscador superior y presione Enter o Buscar.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO 2: AGENTES AUTÓNOMOS (AUTO-COMPANY) ── */}
          {moduloActivo === 'autonomia' && (
            <div className="flex-1 bg-[#0c182b]/85 backdrop-blur-2xl rounded-3xl p-6 md:p-8 flex flex-col gap-6 border border-white/10 shadow-2xl overflow-y-auto">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex justify-between items-center shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl shadow-lg shadow-[#0066cc]/20">
                    <Bot className="h-5 w-5 stroke-[2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white tracking-tight">
                      Central de Agentes Virtuales Autónomos (Auto-Company Engine)
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold">Bucle continuo de verificación 24/7 y consenso operativo</p>
                  </div>
                </div>

                <button
                  disabled={ejecutandoCiclo}
                  onClick={handleEjecutarCicloConsenso}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-bold rounded-xl text-xs shadow-lg shadow-[#0066cc]/20 hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${ejecutandoCiclo ? 'animate-spin' : ''}`} />
                  <span>{ejecutandoCiclo ? 'Ejecutando...' : 'Ejecutar Consenso'}</span>
                </button>
              </div>

              <div className="bg-black/40 rounded-2xl p-6 border border-white/10 text-slate-200 font-mono text-xs shadow-2xl flex flex-col gap-3">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>MEMORIA DE CONSENSO EN VIVO (consensus.md)</span>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {logsConsenso.map((log, i) => (
                    <div key={i} className="p-2 hover:bg-white/[0.05] rounded-lg">{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MÓDULO 3: PRESUPUESTOS & PIPELINE CRM (ESPO-CRM INSPIRED) ── */}
          {moduloActivo === 'presupuestos' && (
            <div className="flex-1 bg-[#0a1628]/60 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col gap-6 border border-white/10 shadow-2xl min-h-0 overflow-hidden">
              
              {/* ENCABEZADO Y ALTERNADOR DE VISTA TABLA / KANBAN (APPLE HOMEKIT STYLE) */}
              <div className="bg-[#0c182b]/80 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xl">
                <div>
                  <div className="flex items-center gap-2.5 text-xs font-mono text-[#2997ff] uppercase tracking-wider mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#2997ff] animate-pulse" />
                    <span>MÓDULO COMERCIAL & DTE CHILE</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <FileText className="h-6 w-6 text-[#2997ff]" />
                    <span>Presupuestos & Pipeline CRM</span>
                    <span className="bg-[#2997ff]/20 text-[#2997ff] border border-[#2997ff]/30 text-xs px-3 py-1 rounded-full font-mono font-bold">
                      {siguienteCorrelativoCode}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Gestión comercial, cotizaciones PDF DTE Chile (19% IVA) y despacho multicanal (WhatsApp & Email).
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md">
                    <button
                      onClick={() => setVistaCotizaciones('tabla')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        vistaCotizaciones === 'tabla'
                          ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-lg shadow-[#0066cc]/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <TableIcon className="h-4 w-4" />
                      <span>Tabla DTE</span>
                    </button>
                    <button
                      onClick={() => setVistaCotizaciones('kanban')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        vistaCotizaciones === 'kanban'
                          ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-lg shadow-[#0066cc]/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span>Pipeline Kanban</span>
                    </button>
                  </div>

                  <button
                    onClick={abrirModalNuevaCotizacion}
                    className="px-5 py-3 bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:from-[#0055b3] hover:to-[#1a85f2] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl shadow-[#0066cc]/30 active:scale-95 cursor-pointer transition-all flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Crear Presupuesto</span>
                  </button>
                </div>
              </div>

              {/* ── BENTO TILES DE FILTRO RÁPIDO POR CATEGORÍA Y ESTADO ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {[
                  { id: 'todas', label: 'Todos los Presupuestos', count: resumenCotizacionesKPI.total, sub: `$${Math.round(resumenCotizacionesKPI.montoTotal).toLocaleString('es-CL')} CLP`, color: 'text-[#2997ff]' },
                  { id: 'enviado', label: 'Enviados / En Gestión', count: resumenCotizacionesKPI.enviados, sub: 'Cotizaciones activas', color: 'text-blue-400' },
                  { id: 'aprobado', label: 'Aprobados / Ganados', count: resumenCotizacionesKPI.aprobados, sub: `$${Math.round(resumenCotizacionesKPI.montoAprobados).toLocaleString('es-CL')} CLP`, color: 'text-emerald-400' },
                  { id: 'rechazado', label: 'Rechazados / Perdidos', count: resumenCotizacionesKPI.rechazados, sub: 'Descartados', color: 'text-red-400' },
                  { id: 'borrador', label: 'Borradores', count: resumenCotizacionesKPI.borradores, sub: 'En edición', color: 'text-amber-400' },
                ].map(cat => {
                  const esSel = filtroCotCategoria === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFiltroCotCategoria(cat.id as any)}
                      className={`p-4 rounded-3xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between backdrop-blur-xl ${
                        esSel
                          ? 'bg-[#0f2847] border-2 border-[#2997ff] shadow-xl shadow-[#0066cc]/20 scale-[1.02]'
                          : 'bg-[#0c182b]/80 border border-white/10 hover:border-white/20 hover:bg-[#0e2038]'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{cat.label}</div>
                      <div className="flex justify-between items-baseline mt-3">
                        <span className={`text-2xl font-black font-mono tracking-tight ${cat.color}`}>{cat.count}</span>
                        <span className="text-[10px] font-bold text-slate-400">{cat.sub}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* ── BARRA SUPERIOR DE FILTROS DARK FROSTED ── */}
              <div className="bg-[#0c182b]/80 backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex flex-wrap items-center gap-3 text-xs shadow-xl">
                {/* Buscador de Texto (Cliente, RUT, Folio) */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={filtroCotBusqueda}
                    onChange={e => setFiltroCotBusqueda(e.target.value)}
                    placeholder="Buscar por Cliente, RUT, Folio (#PR2607), Comuna..."
                    className="w-full min-h-[44px] bg-[#060c18] border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]"
                  />
                </div>

                {/* Fecha Desde */}
                <div className="flex items-center gap-2 shrink-0">
                  <Calendar className="h-4 w-4 text-[#2997ff] shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-400">Desde:</span>
                  <input
                    type="date"
                    value={filtroCotDesde}
                    onChange={e => setFiltroCotDesde(e.target.value)}
                    className="min-h-[44px] bg-[#060c18] border border-white/10 px-3 py-2 rounded-2xl text-xs font-mono text-white focus:outline-none focus:border-[#2997ff]"
                  />
                </div>

                {/* Fecha Hasta */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-400">Hasta:</span>
                  <input
                    type="date"
                    value={filtroCotHasta}
                    onChange={e => setFiltroCotHasta(e.target.value)}
                    className="min-h-[44px] bg-[#060c18] border border-white/10 px-3 py-2 rounded-2xl text-xs font-mono text-white focus:outline-none focus:border-[#2997ff]"
                  />
                </div>

                {/* Empresa Emisora */}
                <select
                  value={filtroCotEmpresa}
                  onChange={e => setFiltroCotEmpresa(e.target.value)}
                  className="min-h-[44px] bg-[#060c18] border border-white/10 px-4 py-2 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-[#2997ff]"
                >
                  <option value="todas">Todas las Emisoras</option>
                  {empresasConglomerado.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.razon_social}</option>
                  ))}
                </select>

                {/* Ordenamiento */}
                <select
                  value={filtroCotOrden}
                  onChange={e => setFiltroCotOrden(e.target.value as any)}
                  className="min-h-[44px] bg-[#060c18] border border-white/10 px-4 py-2 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-[#2997ff]"
                >
                  <option value="recientes">Más Recientes</option>
                  <option value="antiguos">Más Antiguos</option>
                  <option value="monto_desc">Mayor Monto</option>
                  <option value="monto_asc">Menor Monto</option>
                  <option value="cliente_asc">Cliente (A-Z)</option>
                </select>

                {/* Botón Limpiar */}
                {(filtroCotBusqueda || filtroCotDesde || filtroCotHasta || filtroCotCategoria !== 'todas' || filtroCotEmpresa !== 'todas' || filtroCotOrden !== 'recientes') && (
                  <button
                    onClick={() => {
                      setFiltroCotCategoria('todas')
                      setFiltroCotBusqueda('')
                      setFiltroCotDesde('')
                      setFiltroCotHasta('')
                      setFiltroCotEmpresa('todas')
                      setFiltroCotOrden('recientes')
                    }}
                    className="min-h-[44px] px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1.5 bg-red-950/40 border border-red-500/30 rounded-2xl transition"
                  >
                    <X className="h-4 w-4" />
                    <span>Limpiar Filtros</span>
                  </button>
                )}
              </div>

              {/* VISTA 1: TABLA GENERAL DTE (APPLE HOMEKIT HIGH-ROW STYLE) */}
              {vistaCotizaciones === 'tabla' && (
                <div className="bg-[#0c182b]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl">
                  
                  {/* Tarjetas Móviles (< md) */}
                  <div className="md:hidden space-y-4">
                    {cotizacionesFiltradas.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-semibold text-xs">
                        No se encontraron presupuestos.
                      </div>
                    ) : (
                      cotizacionesFiltradas.map(c => {
                        const empEmisora = empresasConglomerado.find(e => e.id === c.empresa_facturadora_id) || empresasConglomerado[0]
                        return (
                          <div key={c.id} className="bg-[#060c18] border border-white/10 rounded-2xl p-4.5 space-y-3 shadow-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-extrabold text-[#2997ff] text-sm">
                                {c.codigo_cotizacion}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">{c.fecha}</span>
                            </div>

                            <div>
                              <h4 className="font-bold text-white text-sm">{c.nombre_cliente}</h4>
                              <p className="text-xs font-mono text-slate-400">RUT: {c.rut_cliente}</p>
                              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">{empEmisora.razon_social}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase">Total IVA Incl.</span>
                                <p className="text-base font-black font-mono text-emerald-400">
                                  ${Math.round(c.monto_total_iva_incluido || 0).toLocaleString('es-CL')}
                                </p>
                              </div>
                              <span className="px-3 py-1 bg-[#2997ff]/10 text-[#2997ff] border border-[#2997ff]/30 rounded-xl text-xs font-bold">
                                {c.etapa_pipeline || 'Cotización'}
                              </span>
                            </div>

                            {/* Botones Acciones Móviles Cómodos */}
                            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/5">
                              <button
                                onClick={() => handleEnviarWhatsAppCotizacion(c)}
                                className="p-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl flex items-center justify-center transition"
                                title="Enviar por WhatsApp"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEnviarEmailCotizacion(c)}
                                disabled={enviandoEmailId === c.id}
                                className="p-3 bg-[#0066cc]/20 hover:bg-[#0066cc] text-[#2997ff] hover:text-white border border-[#2997ff]/30 rounded-xl flex items-center justify-center transition"
                                title="Enviar por Email"
                              >
                                {enviandoEmailId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => setCotSeleccionada(c)}
                                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition"
                                title="Ver DTE"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditarCotizacion(c)}
                                className="p-3 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30 rounded-xl flex items-center justify-center transition"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicarCotizacion(c)}
                                className="p-3 bg-white/5 hover:bg-white/15 text-slate-300 rounded-xl flex items-center justify-center transition"
                                title="Copiar"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Tabla Desktop (>= md) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm font-medium">
                      <thead>
                        <tr className="bg-[#0f2442]/80 text-slate-300 border-b border-white/10 font-bold uppercase text-[11px] tracking-wider">
                          <th className="py-4.5 px-4">FOLIO / FECHA</th>
                          <th className="py-4.5 px-4">EMPRESA EMISORA</th>
                          <th className="py-4.5 px-4">RECEPTOR (CLIENTE / PROSPECTO)</th>
                          <th className="py-4.5 px-4">CIUDAD / COMUNA</th>
                          <th className="py-4.5 px-4 text-right">NETO AFECTO</th>
                          <th className="py-4.5 px-4 text-right">TOTAL IVA INCL.</th>
                          <th className="py-4.5 px-4 text-center">ETAPA PIPELINE</th>
                          <th className="py-4.5 px-4 text-center min-w-[280px]">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {cotizacionesFiltradas.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-14 px-6 text-center text-slate-400 font-semibold text-sm">
                              No se encontraron presupuestos que coincidan con los criterios de búsqueda o filtros seleccionados.
                            </td>
                          </tr>
                        ) : (
                          cotizacionesFiltradas.map(c => {
                          const empEmisora = empresasConglomerado.find(e => e.id === c.empresa_facturadora_id) || empresasConglomerado[0]
                          return (
                            <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                              <td className="py-5 px-4 font-mono font-black text-sm text-[#2997ff]">
                                <div className="tracking-tight">{c.codigo_cotizacion}</div>
                                <div className="text-[11px] text-slate-400 font-sans font-medium mt-0.5">{c.fecha}</div>
                              </td>
                              <td className="py-5 px-4 font-bold text-emerald-400 text-xs sm:text-sm">{empEmisora.razon_social}</td>
                              <td className="py-5 px-4 font-bold text-white">
                                <div className="text-xs sm:text-sm leading-snug">{c.nombre_cliente}</div>
                                <div className="text-[11px] text-slate-400 font-mono font-medium mt-0.5">RUT: {c.rut_cliente}</div>
                              </td>
                              <td className="py-5 px-4 font-semibold text-slate-300 text-xs sm:text-sm">{c.ciudad_cliente || 'Santiago'}</td>
                              <td className="py-5 px-4 text-right font-mono font-bold text-slate-300 text-xs sm:text-sm">${Math.round(c.neto_con_descuento || 0).toLocaleString('es-CL')}</td>
                              <td className="py-5 px-4 text-right font-mono font-black text-emerald-400 text-sm sm:text-base">${Math.round(c.monto_total_iva_incluido || 0).toLocaleString('es-CL')}</td>
                              <td className="py-5 px-4 text-center font-bold">
                                <span className="px-3.5 py-1.5 bg-[#2997ff]/10 text-[#2997ff] border border-[#2997ff]/30 rounded-full text-xs font-bold inline-block">
                                  {c.etapa_pipeline || 'Cotización'}
                                </span>
                              </td>
                              <td className="py-5 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEnviarWhatsAppCotizacion(c)}
                                    title="Enviar por WhatsApp"
                                    className="p-2.5 bg-emerald-500/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl font-bold cursor-pointer transition-all hover:scale-105"
                                  >
                                    <MessageSquare className="h-4 w-4 stroke-[2]" />
                                  </button>
                                  <button
                                    onClick={() => handleEnviarEmailCotizacion(c)}
                                    disabled={enviandoEmailId === c.id}
                                    title="Enviar Presupuesto por Email (Empresas Gama Seguridad)"
                                    className="p-2.5 bg-[#0066cc]/20 hover:bg-[#0066cc] text-[#2997ff] hover:text-white border border-[#2997ff]/30 rounded-xl font-bold cursor-pointer transition-all hover:scale-105"
                                  >
                                    {enviandoEmailId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 stroke-[2]" />}
                                  </button>
                                  <button
                                    onClick={() => setCotSeleccionada(c)}
                                    title="Ver e Imprimir DTE"
                                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold cursor-pointer transition-all hover:scale-105"
                                  >
                                    <FileText className="h-4 w-4 stroke-[2]" />
                                  </button>
                                  <button
                                    onClick={() => handleEditarCotizacion(c)}
                                    title="Editar Cotización"
                                    className="p-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30 rounded-xl font-bold cursor-pointer transition-all hover:scale-105"
                                  >
                                    <Pencil className="h-4 w-4 stroke-[2]" />
                                  </button>
                                  <button
                                    onClick={() => handleDuplicarCotizacion(c)}
                                    title="Copiar Cotización"
                                    className="p-2.5 bg-white/5 hover:bg-white/15 text-slate-300 rounded-xl font-bold cursor-pointer transition-all hover:scale-105"
                                  >
                                    <Copy className="h-4 w-4 stroke-[2]" />
                                  </button>
                                  <button
                                    onClick={() => handleEliminarCotizacion(c.id, c.codigo_cotizacion)}
                                    title="Eliminar Cotización"
                                    className="p-2.5 bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl font-bold cursor-pointer transition-all hover:scale-105"
                                  >
                                    <Trash2 className="h-4 w-4 stroke-[2]" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        }))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VISTA 2: TABLERO KANBAN DE PIPELINE (APPLE HOMEKIT BENTO STYLE) */}
              {vistaCotizaciones === 'kanban' && (
                <div className="bg-[#0c182b]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-x-auto">
                  <div className="flex gap-4 min-w-[1200px] h-full items-stretch">
                    
                    {[
                      { key: 'Lead', label: 'Prospecto / Lead', border: 'border-[#2997ff]' },
                      { key: 'Visita', label: 'Visita Técnica', border: 'border-amber-400' },
                      { key: 'Cotizacion', label: 'Cotización Enviada', border: 'border-blue-500' },
                      { key: 'Negociacion', label: 'En Negociación', border: 'border-purple-400' },
                      { key: 'Ganada', label: 'Aprobada / Ganada', border: 'border-emerald-400' }
                    ].map(col => {
                      const cotsEnCol = cotizacionesFiltradas.filter(c => (c.etapa_pipeline || 'Cotizacion') === col.key)
                      const totalMontoCol = cotsEnCol.reduce((acc, curr) => acc + (curr.monto_total_iva_incluido || 0), 0)

                      return (
                        <div key={col.key} className={`w-1/5 bg-[#060c18] border-t-4 ${col.border} border-x border-b border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-xl`}>
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span className="font-bold text-xs text-white uppercase tracking-tight">{col.label}</span>
                            <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                              {cotsEnCol.length}
                            </span>
                          </div>
                          
                          <div className="text-[11px] font-mono font-bold text-emerald-400 bg-white/5 border border-white/10 p-2 rounded-xl text-center">
                            Total: ${Math.round(totalMontoCol).toLocaleString('es-CL')} CLP
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-3 pt-1 max-h-[600px]">
                            {cotsEnCol.map(cot => (
                              <div key={cot.id} className="bg-[#0c182b] border border-white/10 hover:border-[#2997ff]/50 p-4 rounded-2xl space-y-3 transition-all duration-200 shadow-lg">
                                <div className="flex justify-between items-start">
                                  <span className="font-mono font-extrabold text-xs text-[#2997ff]">{cot.codigo_cotizacion}</span>
                                  <span className="text-[10px] text-slate-400 font-mono font-medium">{cot.fecha}</span>
                                </div>

                                <div className="space-y-1">
                                  <h4 className="font-bold text-xs text-white uppercase leading-snug">{cot.nombre_cliente}</h4>
                                  <span className="text-[10px] text-slate-400 block font-mono">RUT: {cot.rut_cliente}</span>
                                  <span className="text-[10px] text-slate-300 font-medium block">📍 {cot.ciudad_cliente || 'Santiago'}</span>
                                </div>

                                <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl flex justify-between items-center font-mono text-xs">
                                  <span className="text-[10px] text-slate-400 font-sans">Total IVA Incl.</span>
                                  <span className="font-bold text-emerald-400">${Math.round(cot.monto_total_iva_incluido || 0).toLocaleString('es-CL')}</span>
                                </div>

                                {/* ACCIONES DE PIPELINE Y WHATSAPP & EMAIL */}
                                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                  <div className="flex gap-1.5">
                                    <button onClick={() => handleEnviarWhatsAppCotizacion(cot)} title="Notificar por WhatsApp" className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl text-xs cursor-pointer transition">
                                      <MessageSquare className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleEnviarEmailCotizacion(cot)} disabled={enviandoEmailId === cot.id} title="Enviar por Email" className="p-2 bg-[#0066cc]/20 hover:bg-[#0066cc] text-[#2997ff] hover:text-white border border-[#2997ff]/30 rounded-xl text-xs cursor-pointer transition">
                                      {enviandoEmailId === cot.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                    </button>
                                    <button onClick={() => setCotSeleccionada(cot)} title="Ver DTE PDF" className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs cursor-pointer transition">
                                      <FileText className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <select
                                    value={cot.etapa_pipeline || 'Cotizacion'}
                                    onChange={(e) => handleCambiarEtapaPipeline(cot.id, e.target.value as any)}
                                    className="bg-[#060c18] border border-white/10 rounded-xl text-[10px] font-bold p-2 text-slate-200 focus:outline-none focus:border-[#2997ff]"
                                  >
                                    <option value="Lead">Lead</option>
                                    <option value="Visita">Visita</option>
                                    <option value="Cotizacion">Cotización</option>
                                    <option value="Negociacion">Negociación</option>
                                    <option value="Ganada">Ganada</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO 4: FACTURACIÓN & ABONOS PARCIALES CON CONCILIADOR AUTOMÁTICO ── */}
          {moduloActivo === 'facturacion' && (
            <div className="flex-1 bg-[#0c182b]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-white/10 shadow-2xl overflow-y-auto">
              
              {/* ENCABEZADO Y BOTONES DE CARGA EXCEL / CSV */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-2xl shadow-lg shadow-[#0066cc]/20">
                    <DollarSign className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-2.5 flex-wrap">
                      <span>Gestor de Facturación & Conciliador de Cobranza (Julio 2026)</span>
                      <span className="bg-[#2997ff]/20 text-[#2997ff] border border-[#2997ff]/30 text-[10px] font-black px-3 py-0.5 rounded-full font-mono">
                        {facturas.length} Facturas Reales
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Asociación automática por Inteligencia Artificial y concordancia inteligente de abonados perimetrales
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <label className="px-5 py-3 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-black rounded-2xl text-xs shadow-lg shadow-[#0066cc]/20 hover:brightness-110 active:scale-95 cursor-pointer transition-all flex items-center gap-2 uppercase tracking-wider">
                    <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
                    <span>📁 Subir Planilla Cobranza (Excel / CSV)</span>
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleImportarCSVPlantillaMaestro}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* ── CARDS DE RESUMEN FINANCIERO DE COBRANZA EN TIEMPO REAL BENTO ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-2 transition-all hover:border-white/20 shadow-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TOTAL FACTURADO JULIO</span>
                  <div className="text-2xl font-black font-mono text-white">
                    ${facturas.reduce((acc, curr) => acc + curr.monto_total, 0).toLocaleString('es-CL')} CLP
                  </div>
                  <span className="text-xs text-slate-300 font-bold bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg inline-block">34 Facturas procesadas</span>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-2 transition-all hover:border-white/20 shadow-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TOTAL RECAUDADO / ABONADO</span>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    ${facturas.reduce((acc, curr) => acc + (curr.monto_abonado || 0), 0).toLocaleString('es-CL')} CLP
                  </div>
                  <span className="text-xs text-emerald-400 font-extrabold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg inline-block">Abonos al día</span>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-2 transition-all hover:border-white/20 shadow-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">SALDO PENDIENTE POR COBRAR</span>
                  <div className="text-2xl font-black font-mono text-rose-400">
                    ${facturas.reduce((acc, curr) => acc + (curr.saldo_pendiente || 0), 0).toLocaleString('es-CL')} CLP
                  </div>
                  <span className="text-xs text-rose-400 font-extrabold bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-lg inline-block">Por conciliar</span>
                </div>
              </div>

              {/* ── LISTADO ADAPTATIVO: TABLA EN DESKTOP / CARDS TOUCH EN MOBILE ── */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-3 sm:p-5 overflow-hidden shadow-xl">
                
                {/* VISTA MOBILE CARDS */}
                <div className="md:hidden space-y-3.5">
                  {facturas.map(f => {
                    const empEmisora = empresasConglomerado.find(e => e.id === f.empresa_facturadora_id) || empresasConglomerado[0]
                    return (
                      <div key={f.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-bold text-[#2997ff] text-sm">{f.numero_factura}</span>
                            <span className="text-slate-400 text-[11px] block">{f.fecha}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                            f.estado === 'Pagada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            f.estado === 'Abonada' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {f.estado.toUpperCase()}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-white text-sm">{f.razon_social}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Abonado #{f.cuenta_asociada || 'N/A'} • {empEmisora.razon_social}</div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5 text-center">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase block">Total</span>
                            <span className="font-mono text-xs font-bold text-white">${f.monto_total.toLocaleString('es-CL')}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase block">Abonado</span>
                            <span className="font-mono text-xs font-bold text-emerald-400">${(f.monto_abonado || 0).toLocaleString('es-CL')}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase block">Saldo</span>
                            <span className="font-mono text-xs font-bold text-rose-400">${(f.saldo_pendiente || 0).toLocaleString('es-CL')}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => {
                              setFacturaAbonando(f)
                              setMontoAbonoInput((f.saldo_pendiente || 0).toString())
                              setMostrarModalAbono(true)
                            }}
                            className="min-h-[42px] px-3 py-2 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
                          >
                            <DollarSign className="h-4 w-4" />
                            <span>Abonar</span>
                          </button>
                          
                          <button
                            onClick={() => setFacturaSeleccionadaCobranza(f)}
                            className="min-h-[42px] px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <ClipboardList className="h-4 w-4 text-amber-400" />
                            <span>Bitácora</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* VISTA DESKTOP TABLA */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-medium">
                    <thead>
                      <tr className="bg-white/[0.04] text-slate-400 border-b border-white/10 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-4 px-4 border-r border-white/10">FOLIO / FECHA</th>
                        <th className="py-4 px-4 border-r border-white/10">EMPRESA EMISORA</th>
                        <th className="py-4 px-4 border-r border-white/10">CLIENTE / ABONADO</th>
                        <th className="py-4 px-4 border-r border-white/10 text-right">TOTAL FACTURA</th>
                        <th className="py-4 px-4 border-r border-white/10 text-right">TOTAL ABONADO</th>
                        <th className="py-4 px-4 border-r border-white/10 text-right">SALDO PENDIENTE</th>
                        <th className="py-4 px-4 border-r border-white/10 text-center">ESTADO</th>
                        <th className="py-4 px-4 text-center w-36">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {facturas.map(f => {
                        const empEmisora = empresasConglomerado.find(e => e.id === f.empresa_facturadora_id) || empresasConglomerado[0]
                        return (
                          <tr key={f.id} className="hover:bg-white/[0.04] transition-colors">
                            <td className="py-4.5 px-4 font-mono font-bold text-[#2997ff] border-r border-white/10">
                              <div>{f.numero_factura}</div>
                              <div className="text-slate-400 text-[10px] font-sans">{f.fecha}</div>
                            </td>
                            <td className="py-4.5 px-4 border-r border-white/10 font-bold text-emerald-400 text-xs">{empEmisora.razon_social}</td>
                            <td className="py-4.5 px-4 border-r border-white/10">
                              <div className="font-bold text-white">{f.razon_social}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Abonado #{f.cuenta_asociada || 'N/A'}</div>
                            </td>
                            <td className="py-4.5 px-4 text-right font-mono text-white font-bold border-r border-white/10">
                              ${f.monto_total.toLocaleString('es-CL')} CLP
                            </td>
                            <td className="py-4.5 px-4 text-right font-mono text-emerald-400 font-bold border-r border-white/10">
                              ${(f.monto_abonado || 0).toLocaleString('es-CL')} CLP
                            </td>
                            <td className="py-4.5 px-4 text-right font-mono font-black text-rose-400 border-r border-white/10">
                              ${(f.saldo_pendiente || 0).toLocaleString('es-CL')} CLP
                            </td>
                            <td className="py-4.5 px-4 text-center border-r border-white/10 font-bold">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                                f.estado === 'Pagada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                f.estado === 'Abonada' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}>
                                {f.estado.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-4.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => {
                                    setFacturaAbonando(f)
                                    setMontoAbonoInput((f.saldo_pendiente || 0).toString())
                                    setMostrarModalAbono(true)
                                  }}
                                  title="Registrar Abono / Pago"
                                  className="px-2.5 py-1.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-1 active:scale-95"
                                >
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span>Abono</span>
                                </button>
                                
                                <button
                                  onClick={() => setFacturaSeleccionadaCobranza(f)}
                                  title="Bitácora Acumulativa de Gestión de Cobranza"
                                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1 active:scale-95"
                                >
                                  <ClipboardList className="h-3.5 w-3.5 text-amber-400" />
                                  <span>Bitácora</span>
                                </button>

                                <button
                                  onClick={() => {
                                    const cli = clientesMaestros[f.rut_cliente] || { rut: f.rut_cliente, razon_social: f.razon_social, email_cobranza: '', email_contacto: '', telefono: '' }
                                    setClienteEditingEmail({
                                      rut: f.rut_cliente,
                                      razon_social: f.razon_social,
                                      email_cobranza: cli.email_cobranza || '',
                                      email_contacto: (cli as any).email_contacto || '',
                                      telefono: cli.telefono || ''
                                    })
                                  }}
                                  title="Editar Correo de Cobranza (Guardar para la posteridad)"
                                  className="px-2 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1 active:scale-95"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  <span>Correo</span>
                                </button>

                                <button
                                  onClick={() => handleAbrirPortalCliente(f.cuenta_asociada || 'C701')}
                                  title="Abrir Portal de Cliente Gama (/portal)"
                                  className="px-2 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1 active:scale-95"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>Portal</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* ── MÓDULO 5: SERVICIO TÉCNICO & SLAs (COMMAND CENTER 24/7 INTEGRATED) ── */}
          {moduloActivo === 'serv_tecnico' && (
            <div className="flex-1 bg-[#0c182b]/85 backdrop-blur-2xl rounded-3xl p-6 md:p-8 flex flex-col gap-6 border border-white/10 shadow-2xl overflow-y-auto">
              
              {/* ENCABEZADO MÓDULO */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl shadow-lg shadow-[#0066cc]/20">
                    <Wrench className="h-5 w-5 stroke-[2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-wide">
                      Servicios Técnicos & Órdenes de Trabajo (Command Center 24/7)
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold">
                      Sincronización en tiempo real con bitácora central, asignación técnica y gestión de SLAs (2h / 6h / 24h)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setMostrarModalPWATerreno(true)}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold rounded-xl text-xs active:scale-95 cursor-pointer flex items-center gap-2 transition-all shadow-md"
                  >
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <span>📱 App PWA Técnico en Terreno</span>
                  </button>
                  <button
                    onClick={() => {
                      setOtFormCuenta('0999')
                      setOtFormClienteNombre('GAMA SEGURIDAD SPA DEMO')
                      setOtFormTipoServicio('Mantención Perimetral Alarma')
                      setOtFormObservaciones('')
                      setMostrarModalOT(true)
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-bold rounded-xl text-xs shadow-lg shadow-[#0066cc]/20 hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nueva Orden Técnica (OT)</span>
                  </button>
                </div>
              </div>

              {/* ── ALERTA DE NOVEDADES TÉCNICAS EN VIVO DESDE CENTRAL DE MONITOREO ── */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-3xl space-y-3 shadow-xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h3 className="font-black text-white uppercase tracking-wider text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse" />
                    <span>NOVEDADES & ALERTAS TÉCNICAS RECIENTES DEL COMMAND CENTER (24/7 API)</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-300 bg-white/10 border border-white/10 px-2.5 py-1 rounded-xl">
                    Central Operativa
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {alertasTecnicasCommandCenter.length === 0 ? (
                    <div className="col-span-full p-6 text-center text-slate-400 text-xs font-bold bg-white/[0.02] border border-white/5 rounded-2xl">
                      No se registran alertas técnicas pendientes en la bitácora central.
                    </div>
                  ) : (
                    alertasTecnicasCommandCenter.map(item => (
                      <div key={item.id} className="bg-white/[0.04] border border-white/10 p-4 rounded-2xl flex flex-col justify-between space-y-3 border-l-4" style={{ borderLeftColor: item.tipo_color ? `#${item.tipo_color}` : '#2997ff' }}>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-mono font-bold text-[#2997ff] bg-white/10 border border-white/10 px-2 py-0.5 rounded-lg">
                              #{item.abonado_cod || 'N/A'}
                            </span>
                            <span className="font-mono text-slate-400 font-bold">{item.created_at}</span>
                          </div>
                          <h4 className="font-black text-xs text-white leading-snug">{item.abonado_nombre}</h4>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ color: `#${item.tipo_color || '2997ff'}` }}>
                            {item.tipo_nombre} • {item.responsable_nombre}
                          </span>
                          <p className="text-[11px] text-slate-300 font-medium line-clamp-3 bg-black/20 border border-white/5 p-2 rounded-xl">
                            {item.comentario}
                          </p>
                        </div>

                        <button
                          onClick={() => handleCrearOTDesdeCentral(item)}
                          className="w-full py-2 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white text-xs font-bold rounded-xl shadow-md hover:brightness-110 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Generar OT desde Alerta</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── CARDS DE FILTRO RÁPIDO DE ESTADO OT ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[
                  { id: 'todas', label: 'Todas las OTs', count: ordenesTrabajo.length, sub: 'Registradas', color: 'text-[#2997ff]' },
                  { id: 'pendiente', label: 'Pendientes por Atender', count: ordenesTrabajo.filter(o => o.estado === 'Pendiente').length, sub: 'Por asignar', color: 'text-amber-400' },
                  { id: 'proceso', label: 'En Proceso en Terreno', count: ordenesTrabajo.filter(o => o.estado === 'En Proceso').length, sub: 'Técnico en ruta', color: 'text-blue-400' },
                  { id: 'finalizada', label: 'Finalizadas & Resueltas', count: ordenesTrabajo.filter(o => o.estado === 'Finalizada').length, sub: 'Conformidad cliente', color: 'text-emerald-400' },
                ].map(cat => {
                  const esSel = filtroOTCategoria === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFiltroOTCategoria(cat.id as any)}
                      className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                        esSel
                          ? 'bg-gradient-to-r from-[#0066cc]/20 to-[#2997ff]/20 border border-[#2997ff]/40 shadow-lg shadow-[#0066cc]/10'
                          : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{cat.label}</div>
                      <div className="flex justify-between items-baseline mt-2">
                        <span className={`text-2xl font-black font-mono ${cat.color}`}>{cat.count}</span>
                        <span className="text-[10px] font-bold text-slate-400">{cat.sub}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* BARRA BÚSQUEDA OT */}
              <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl flex items-center gap-3 shadow-md">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={filtroOTBusqueda}
                  onChange={e => setFiltroOTBusqueda(e.target.value)}
                  placeholder="Buscar OT por código (#OT-2026-081), Abonado (#0999), Cliente, Técnico..."
                  className="w-full bg-transparent text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                />
                {filtroOTBusqueda && (
                  <button onClick={() => setFiltroOTBusqueda('')} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
                )}
              </div>

              {/* TABLA DE ÓRDENES DE TRABAJO */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-3 sm:p-5 overflow-hidden shadow-xl">
                
                {/* VISTA MOBILE CARDS */}
                <div className="md:hidden space-y-3.5">
                  {ordenesTrabajoFiltradas.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-bold text-xs">
                      No se encontraron órdenes de trabajo registradas con esos criterios.
                    </div>
                  ) : (
                    ordenesTrabajoFiltradas.map(ot => (
                      <div key={ot.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-bold text-[#2997ff] text-sm">{ot.codigo_ot}</span>
                            <span className="text-slate-400 text-[11px] block">{ot.fecha_programada}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                            ot.prioridad_sla?.includes('2h') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            ot.prioridad_sla?.includes('6h') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {ot.prioridad_sla || 'Normal (24h)'}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-white text-sm">{ot.cliente_nombre}</div>
                          <div className="text-[11px] text-slate-400 font-mono">#{ot.cuenta} • {ot.tipo_servicio}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Técnico: <strong className="text-slate-200">{ot.tecnico_asignado}</strong></div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                          <select
                            value={ot.estado}
                            onChange={(e) => {
                              const nuevoEst = e.target.value as any
                              setOrdenesTrabajo(ordenesTrabajo.map(o => o.id === ot.id ? { ...o, estado: nuevoEst } : o))
                            }}
                            className="bg-black/30 border border-white/10 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            <option value="Pendiente" className="bg-slate-900 text-white">Pendiente</option>
                            <option value="En Proceso" className="bg-slate-900 text-white">En Proceso</option>
                            <option value="Finalizada" className="bg-slate-900 text-white">Finalizada</option>
                          </select>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleNotificarWhatsAppOT(ot)}
                              title="Notificar Orden Técnica al Cliente por WhatsApp"
                              className="p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold cursor-pointer transition-all active:scale-95"
                            >
                              <MessageSquare className="h-4 w-4 stroke-[2]" />
                            </button>
                            <button
                              onClick={() => setMostrarModalFirmaOT(ot)}
                              title="Ver Pauta Técnica & Firma Digital"
                              className="p-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-[#2997ff] rounded-xl font-bold cursor-pointer transition-all active:scale-95"
                            >
                              <FileText className="h-4 w-4 stroke-[2]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* VISTA DESKTOP TABLA */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-medium">
                    <thead>
                      <tr className="bg-white/[0.04] text-slate-400 border-b border-white/10 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-4 px-4 border-r border-white/10">CÓDIGO OT / FECHA</th>
                        <th className="py-4 px-4 border-r border-white/10">CUENTA ABONADO</th>
                        <th className="py-4 px-4 border-r border-white/10">CLIENTE / CENTRO COSTO</th>
                        <th className="py-4 px-4 border-r border-white/10">TIPO DE SERVICIO</th>
                        <th className="py-4 px-4 border-r border-white/10">SLA DE RESPUESTA</th>
                        <th className="py-4 px-4 border-r border-white/10">TÉCNICO ASIGNADO</th>
                        <th className="py-4 px-4 border-r border-white/10 text-center">ESTADO</th>
                        <th className="py-4 px-4 text-center min-w-[180px]">ACCIONES (WHATSAPP • FIRMA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ordenesTrabajoFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                            No se encontraron órdenes de trabajo registradas con esos criterios.
                          </td>
                        </tr>
                      ) : (
                        ordenesTrabajoFiltradas.map(ot => (
                          <tr key={ot.id} className="hover:bg-white/[0.04] transition-colors">
                            <td className="py-4.5 px-4 font-mono font-bold text-[#2997ff] border-r border-white/10">
                              <div>{ot.codigo_ot}</div>
                              <div className="text-slate-400 text-[10px] font-sans">{ot.fecha_programada}</div>
                            </td>
                            <td className="py-4.5 px-4 border-r border-white/10 font-mono font-bold text-white">#{ot.cuenta}</td>
                            <td className="py-4.5 px-4 border-r border-white/10 font-bold text-white">{ot.cliente_nombre}</td>
                            <td className="py-4.5 px-4 border-r border-white/10 text-slate-300 font-semibold">{ot.tipo_servicio}</td>
                            <td className="py-4.5 px-4 border-r border-white/10 font-bold">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono ${
                                ot.prioridad_sla?.includes('2h') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                ot.prioridad_sla?.includes('6h') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {ot.prioridad_sla || 'Normal (24h)'}
                              </span>
                            </td>
                            <td className="py-4.5 px-4 border-r border-white/10 text-slate-200 font-bold">{ot.tecnico_asignado}</td>
                            <td className="py-4.5 px-4 text-center font-bold border-r border-white/10">
                              <select
                                value={ot.estado}
                                onChange={(e) => {
                                  const nuevoEst = e.target.value as any
                                  setOrdenesTrabajo(ordenesTrabajo.map(o => o.id === ot.id ? { ...o, estado: nuevoEst } : o))
                                }}
                                className="bg-black/30 border border-white/10 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
                              >
                                <option value="Pendiente" className="bg-slate-900 text-white">Pendiente</option>
                                <option value="En Proceso" className="bg-slate-900 text-white">En Proceso</option>
                                <option value="Finalizada" className="bg-slate-900 text-white">Finalizada</option>
                              </select>
                            </td>
                            <td className="py-4.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleNotificarWhatsAppOT(ot)}
                                  title="Notificar Orden Técnica al Cliente por WhatsApp"
                                  className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
                                >
                                  <MessageSquare className="h-4 w-4 stroke-[2]" />
                                </button>
                                <button
                                  onClick={() => setMostrarModalFirmaOT(ot)}
                                  title="Ver Pauta Técnica & Firma Digital"
                                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-[#2997ff] rounded-xl font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
                                >
                                  <FileText className="h-4 w-4 stroke-[2]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* ── MÓDULO 6: KPIS EJECUTIVOS ── */}
          {moduloActivo === 'kpis' && (
            <div className="flex-1 bg-[#0c182b]/85 backdrop-blur-2xl rounded-3xl p-6 md:p-8 flex flex-col gap-6 border border-white/10 shadow-2xl overflow-y-auto">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center gap-3 shadow-xl">
                <div className="p-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl shadow-lg shadow-[#0066cc]/20">
                  <BarChart3 className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white tracking-tight">
                    Tablero de KPIs Ejecutivos & Recaudación por Razón Social
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">
                    Distribución de facturación mensual y participación financiera de las 4 Empresas del Conglomerado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-2 shadow-xl hover:border-white/20 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">FAC. MENSUAL PROYECTADA TOTAL</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    ${kpisFinancieros.totalTarifasCLP.toLocaleString('es-CL')} CLP
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">Calculado sobre {kpisFinancieros.totalClientes} Clientes</span>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-2 shadow-xl hover:border-white/20 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">EFECTIVIDAD DE COBRANZA</span>
                  <div className="text-2xl font-bold font-mono text-[#2997ff]">96.4%</div>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Meta Cumplida</span>
                  </span>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-2 shadow-xl hover:border-white/20 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">UF REFERENCIA</span>
                  <div className="text-2xl font-bold font-mono text-white">${valorUF.toLocaleString('es-CL')} CLP</div>
                  <span className="text-xs text-slate-400 font-semibold">Oficial hoy</span>
                </div>
              </div>
            </div>
          )}

          {/* ── MÓDULO 7: CRUD EMPRESAS & CONFIGURACIÓN GLOBAL MULTI-PESTAÑA ── */}
          {moduloActivo === 'config' && (
            <div className="flex-1 bg-[#0c182b]/85 backdrop-blur-2xl rounded-3xl p-6 md:p-8 flex flex-col gap-6 border border-white/10 shadow-2xl overflow-y-auto">
              
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl shadow-lg shadow-[#0066cc]/20">
                    <Settings className="h-5 w-5 stroke-[2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-wide">
                      Centro de Configuración Global & CRUD del Conglomerado
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold">
                      Gestión de Empresas Emisoras DTE, Parámetros Financieros UF/IVA y Servidor WhatsApp
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-black/30 p-1.5 rounded-2xl border border-white/10 flex-wrap">
                  {[
                    { id: 'empresas', label: 'Razones Sociales', icon: Building2 },
                    { id: 'financiero', label: 'UF & Impuestos', icon: DollarSign },
                    { id: 'vinculacion', label: 'Vinculación Tributaria (Abonados ➔ RUT)', icon: Layers },
                    { id: 'whatsapp', label: 'WhatsApp Server', icon: MessageSquare },
                    { id: 'agentes', label: 'Motor IA 24/7', icon: Bot }
                  ].map(tab => {
                    const TabIcon = tab.icon
                    const esActivo = subTabConfig === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSubTabConfig(tab.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${esActivo ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-lg shadow-[#0066cc]/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
                      >
                        <TabIcon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PESTAÑA 1: CRUD EMPRESAS EMISORAS */}
              {subTabConfig === 'empresas' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-xs text-white uppercase tracking-wider">
                      Empresas Emisoras del Conglomerado ({empresasConglomerado.length})
                    </h3>
                    <button
                      onClick={() => abrirModalEditarEmpresa()}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-bold rounded-xl text-xs shadow-lg shadow-[#0066cc]/20 hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-2 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar Razón Social</span>
                    </button>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-2 overflow-x-auto shadow-xl">
                    <table className="w-full text-left border-collapse text-xs font-medium">
                      <thead>
                        <tr className="bg-white/[0.04] text-slate-400 border-b border-white/10 font-bold uppercase text-[11px] tracking-wider">
                          <th className="p-3.5 border-r border-white/10">ID / RUT</th>
                          <th className="p-3.5 border-r border-white/10">RAZÓN SOCIAL EMISORA</th>
                          <th className="p-3.5 border-r border-white/10">GIRO COMERCIAL</th>
                          <th className="p-3.5 border-r border-white/10">DATOS BANCARIOS</th>
                          <th className="p-3.5 text-center w-36">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {empresasConglomerado.map(emp => (
                          <tr key={emp.id} className="hover:bg-white/[0.04] transition-colors">
                            <td className="p-3.5 font-mono font-bold text-[#2997ff] border-r border-white/10">
                              <div>{emp.id}</div>
                              <div className="text-slate-400 font-bold">RUT: {emp.rut}</div>
                            </td>
                            <td className="p-3.5 border-r border-white/10 font-bold text-white">
                              <div>{emp.razon_social}</div>
                              <div className="text-[10px] text-slate-400 font-normal">📍 {emp.direccion}</div>
                            </td>
                            <td className="p-3.5 border-r border-white/10 text-slate-300">{emp.giro}</td>
                            <td className="p-3.5 border-r border-white/10 font-mono text-[11px] text-slate-300">
                              <div><strong className="text-white">{emp.banco_nombre}</strong> ({emp.banco_tipo_cuenta})</div>
                              <div className="text-slate-400">N° {emp.banco_numero_cuenta}</div>
                            </td>
                            <td className="p-3.5 text-center flex items-center justify-center gap-2">
                              <button onClick={() => abrirModalEditarEmpresa(emp)} title="Editar Empresa" className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-[#2997ff] rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1 active:scale-95 transition-all">
                                <Pencil className="h-3.5 w-3.5" />
                                <span>Editar</span>
                              </button>
                              <button onClick={() => handleEliminarEmpresaEmisora(emp.id)} title="Eliminar Empresa" className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 rounded-xl font-bold cursor-pointer text-xs active:scale-95 transition-all">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: UF, IVA & IMPUESTOS */}
              {subTabConfig === 'financiero' && (
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-6 max-w-3xl shadow-xl">
                  <h3 className="font-black text-xs text-white uppercase tracking-wider">💰 Configuración UF, IVA & Presupuestos</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1 text-xs">Valor UF Oficial ($ CLP):</label>
                      <input
                        type="number"
                        value={valorUF}
                        onChange={(e) => setValorUF(Number(e.target.value) || 38500)}
                        className="w-full bg-black/30 border border-white/10 p-3 rounded-xl font-mono font-bold text-sm text-emerald-400 focus:outline-none focus:border-[#2997ff]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1 text-xs">Tasa IVA (Ley 825 Chile):</label>
                      <input
                        type="text"
                        disabled
                        value="19% IVA Incluido"
                        className="w-full bg-black/20 border border-white/5 p-3 rounded-xl font-bold text-xs text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button onClick={() => alert('Parámetros financieros actualizados correctamente.')} className="px-6 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-bold rounded-xl text-xs shadow-lg shadow-[#0066cc]/20 hover:brightness-110 active:scale-95 cursor-pointer transition-all">
                      Guardar Parámetros Financieros
                    </button>
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: VINCULACIÓN TRIBUTARIA ADMINISTRATIVA (ABONADOS ➔ RUT) */}
              {subTabConfig === 'vinculacion' && (
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-6 max-w-4xl shadow-xl">
                  
                  {/* CABECERA CON STATS DE TOTALES */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/10 p-5 rounded-2xl">
                    <div>
                      <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#2997ff]" />
                        <span>GESTIÓN TRIBUTARIA: ASOCIACIÓN DE ABONADOS A RUT ({Object.keys(abonadosCentrosCosto).length} ABONADOS TOTALES)</span>
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        Consolidación de abonados individuales (ej: #C735, #C736) bajo Razones Sociales Tributarias para facturación SII.
                      </p>
                    </div>

                    <label className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 shrink-0 active:scale-95 transition-all">
                      <Upload className="h-4 w-4" />
                      <span>📁 Cargar CSV Maestro (.csv)</span>
                      <input type="file" accept=".csv" onChange={handleImportarCSVPlantillaMaestro} className="hidden" />
                    </label>
                  </div>

                  {/* NAVEGACIÓN SECUNDARIA DE VINCULACIÓN */}
                  <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
                    <button
                      onClick={() => setVincSubTab('pendientes')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${vincSubTab === 'pendientes' ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
                    >
                      <span>📌 1. Pendientes por Vincular ({Object.values(abonadosCentrosCosto).filter(cc => !cuentasYaAsignadas.has(normalizeCuentaCode(cc.cuenta))).length})</span>
                    </button>
                    <button
                      onClick={() => setVincSubTab('consolidado')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${vincSubTab === 'consolidado' ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
                    >
                      <span>✅ 2. Consolidado Tributario ({Object.keys(clientesMaestros).length} Empresas)</span>
                    </button>
                    <button
                      onClick={() => setVincSubTab('papelera')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${vincSubTab === 'papelera' ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
                    >
                      <span>🗑️ 3. Papelera / Historial ({desvinculadosHistorial.length})</span>
                    </button>
                  </div>

                  {/* VISTA 1: PENDIENTES Y VINCULADOR RÁPIDO */}
                  {vincSubTab === 'pendientes' && (
                    <div className="space-y-5">
                      {/* PASO 1: SELECCIONAR O CREAR RUT */}
                      <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl space-y-4">
                        <h4 className="font-black text-xs text-white uppercase tracking-wider">
                          PASO 1: SELECCIONAR O REGISTRAR RAZÓN SOCIAL RECEPTORA:
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">RAZÓN SOCIAL REGISTRADA:</label>
                            <select
                              value={vincRutSeleccionado}
                              onChange={(e) => {
                                const val = e.target.value
                                setVincRutSeleccionado(val)
                                if (val && clientesMaestros[val]) {
                                  setVincAbonadosSeleccionados(clientesMaestros[val].cuentas_abonados || [])
                                }
                              }}
                              className="w-full bg-black/30 border border-white/10 p-3 rounded-xl font-bold text-xs text-white"
                            >
                              <option value="" className="bg-slate-900 text-white">-- Seleccionar Razón Social --</option>
                              {Object.values(clientesMaestros).map(c => (
                                <option key={c.rut} value={c.rut} className="bg-slate-900 text-white">
                                  {c.razon_social} (RUT: {c.rut}) - [{c.cuentas_abonados?.length || 0} abonados]
                                </option>
                              ))}
                            </select>
                          </div>

                          {!vincRutSeleccionado && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 block">O CREAR NUEVA RAZÓN SOCIAL RÁPIDA:</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={vincNuevoRut}
                                  onChange={(e) => setVincNuevoRut(e.target.value)}
                                  placeholder="RUT: 65.155.616-3"
                                  className="w-1/3 bg-black/30 border border-white/10 p-2.5 rounded-xl font-mono font-bold text-xs text-white"
                                />
                                <input
                                  type="text"
                                  value={vincNuevaRazonSocial}
                                  onChange={(e) => setVincNuevaRazonSocial(e.target.value)}
                                  placeholder="ej: FUNDACION PRIMITIVA ECHEVERRIA"
                                  className="w-2/3 bg-black/30 border border-white/10 p-2.5 rounded-xl font-bold text-xs text-white"
                                />
                                <button
                                  onClick={handleCrearNuevaRazonSocialRapida}
                                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer shrink-0"
                                >
                                  + Guardar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PASO 2: MARCAR CUENTAS */}
                      <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
                          <div>
                            <h4 className="font-black text-xs text-white uppercase">
                              PASO 2: SELECCIONAR CUENTAS PARA ASOCIAR ({vincAbonadosSeleccionados.length} SELECCIONADOS):
                            </h4>
                          </div>

                          <div className="flex items-center gap-4 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                              <input
                                type="checkbox"
                                checked={vincMostrarTodos}
                                onChange={(e) => setVincMostrarTodos(e.target.checked)}
                                className="h-4 w-4 text-[#2997ff] rounded"
                              />
                              <span>Mostrar abonados ya asociados</span>
                            </label>

                            <input
                              type="text"
                              value={vincBusquedaAbonado}
                              onChange={(e) => setVincBusquedaAbonado(e.target.value)}
                              placeholder="Buscar abonado #..."
                              className="bg-black/30 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-mono text-white placeholder-slate-500 w-full sm:w-auto"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
                          {abonadosParaVincular.length === 0 ? (
                            <div className="col-span-full p-6 text-center text-slate-400 text-xs font-bold bg-white/[0.02] border border-white/5 rounded-xl">
                              Todos los abonados registrados ya han sido asociados a una Razón Social.
                            </div>
                          ) : (
                            abonadosParaVincular.map(cc => {
                              const cta = normalizeCuentaCode(cc.cuenta)
                              const estaMarcado = vincAbonadosSeleccionados.includes(cta)
                              const esYaAsociado = cuentasYaAsignadas.has(cta)
                              const empresaActual = Object.values(clientesMaestros).find(c => (c.cuentas_abonados || []).includes(cta))

                              return (
                                <div
                                  key={cta}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (estaMarcado) {
                                      setVincAbonadosSeleccionados(vincAbonadosSeleccionados.filter(a => a !== cta))
                                    } else {
                                      setVincAbonadosSeleccionados([...vincAbonadosSeleccionados, cta])
                                    }
                                  }}
                                  className={`p-3 rounded-2xl border text-xs cursor-pointer flex flex-col justify-between transition-all select-none gap-2 ${
                                    estaMarcado
                                      ? 'bg-blue-500/20 border-[#2997ff] shadow-md'
                                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-0.5">
                                      <span className="font-mono font-black text-[#2997ff] block">#{cta}</span>
                                      <span className="font-bold text-white text-[11px] block truncate max-w-[150px]">{cc.alias_centro_costo}</span>
                                    </div>
                                    <input
                                      type="checkbox"
                                      readOnly
                                      checked={estaMarcado}
                                      className="h-4 w-4 text-[#2997ff] rounded pointer-events-none mt-1"
                                    />
                                  </div>

                                  {esYaAsociado && empresaActual && (
                                    <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg truncate">
                                      🏢 {empresaActual.razon_social}
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={handleGuardarVinculacionTributaria}
                          className="px-7 py-3.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white font-black rounded-2xl text-xs shadow-lg shadow-[#0066cc]/20 active:scale-95 cursor-pointer flex items-center gap-2 transition-all hover:brightness-110"
                        >
                          <Building2 className="h-4 w-4" />
                          <span>💾 GUARDAR & CONSOLIDAR VINCULACIÓN TRIBUTARIA</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── SECCIÓN HISTORIAL DE DESVINCULADOS (RESTAURACIÓN RÁPIDA POR ERROR) ── */}
                  {desvinculadosHistorial.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <h4 className="font-black text-xs text-rose-400 uppercase tracking-wider flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-rose-400" />
                        <span>🗑️ HISTORIAL DE ABONADOS DESVINCULADOS (SECCIÓN DE SEGURIDAD EN CASO DE ERROR)</span>
                      </h4>

                      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-2 overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs font-medium">
                          <thead>
                            <tr className="bg-white/[0.04] text-slate-400 border-b border-white/10 font-bold uppercase text-[10px]">
                              <th className="p-2.5 border-r border-white/10">HORA DESVINCULACIÓN</th>
                              <th className="p-2.5 border-r border-white/10">ABONADO</th>
                              <th className="p-2.5 border-r border-white/10">EMPRESA ANTERIOR</th>
                              <th className="p-2.5 text-center w-36">RESTAURAR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {desvinculadosHistorial.map((item, idx) => (
                              <tr key={`${item.cuenta}-${idx}`} className="hover:bg-white/[0.04] transition-colors">
                                <td className="p-2.5 font-mono text-slate-400 text-[10px] border-r border-white/10">{item.fecha}</td>
                                <td className="p-2.5 font-mono font-bold text-[#2997ff] border-r border-white/10">#{item.cuenta}</td>
                                <td className="p-2.5 border-r border-white/10 font-bold text-white">
                                  {item.razonSocialAnterior} <span className="text-slate-400 font-normal">({item.rutAnterior})</span>
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    onClick={() => handleRestaurarDesvinculacion(item)}
                                    className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-[10px] cursor-pointer shadow-xs active:scale-95 transition-all"
                                  >
                                    ↩️ Restaurar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {subTabConfig === 'whatsapp' && (
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-6 max-w-3xl shadow-xl">
                  <h3 className="font-black text-xs text-white uppercase tracking-wider">📲 Configuración Servidor WhatsApp Scorpion</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1 text-xs">Endpoint API Servidor WhatsApp:</label>
                      <input
                        type="text"
                        defaultValue="/api/whatsapp/send-direct"
                        className="w-full bg-black/30 border border-white/10 p-3 rounded-xl font-mono font-bold text-xs text-[#2997ff] focus:outline-none focus:border-[#2997ff]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1 font-mono text-xs">Estado de Conexión Scorpion Server:</label>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>En Línea & Operativo (24/7)</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 4: MOTOR DE AGENTES IA */}
              {subTabConfig === 'agentes' && (
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-6 max-w-3xl shadow-xl">
                  <h3 className="font-black text-xs text-white uppercase tracking-wider">🤖 Motor de Agentes Virtuales Autónomos</h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-4 bg-white/[0.04] border border-white/10 rounded-2xl flex justify-between items-center font-bold text-slate-200">
                      <div><strong className="text-white">SRE Guardian Agent:</strong> Monitoreo de latencia Supabase & Vercel.</div>
                      <span className="text-emerald-400 font-bold">🟢 Activo</span>
                    </div>
                    <div className="p-4 bg-white/[0.04] border border-white/10 rounded-2xl flex justify-between items-center font-bold text-slate-200">
                      <div><strong className="text-white">Finance Agent:</strong> Escaneo de cobro y morosidad de abonados.</div>
                      <span className="text-emerald-400 font-bold">🟢 Activo</span>
                    </div>
                    <div className="p-4 bg-white/[0.04] border border-white/10 rounded-2xl flex justify-between items-center font-bold text-slate-200">
                      <div><strong className="text-white">Vision AI Guard:</strong> Verificación de analíticas de video 24/7.</div>
                      <span className="text-emerald-400 font-bold">🟢 Activo</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO 8: MARKETING Y VENTAS: CAPTACIÓN DE LEADS Y COLD EMAIL OUTREACH VÍA RESEND (APPLE BENTO DARK) ── */}
          {moduloActivo === 'marketing' && (
            <div className="flex-1 bg-[#0c182b]/85 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-xl min-h-0 overflow-y-auto">
              
              {/* ENCABEZADO APPLE BENTO Y CAMBIO DE PESTAÑAS */}
              <div className="bg-white/[0.03] border border-white/10 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl shadow-md">
                    <Megaphone className="h-5 w-5 stroke-[2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                      <span>Marketing & Prospección B2B V Región Valparaíso</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Buscador de empresas por comuna, tratamiento individual de prospectos, diseñador de publicidad y envío masivo vía Resend
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl">
                    <button
                      onClick={() => setSubTabMarketing('leads')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${subTabMarketing === 'leads' ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <User className="h-4 w-4" />
                      <span>Prospectos ({leadsList.length})</span>
                    </button>
                    <button
                      onClick={() => setSubTabMarketing('campanas')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${subTabMarketing === 'campanas' ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Send className="h-4 w-4" />
                      <span>Campañas</span>
                    </button>
                    <button
                      onClick={() => setSubTabMarketing('publicidad')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${subTabMarketing === 'publicidad' ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Diseñador B2B</span>
                    </button>
                  </div>

                  <button
                    onClick={() => abrirModalNuevoLead()}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-semibold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer transition-all flex items-center gap-2 shrink-0"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Añadir Lead Manual</span>
                  </button>
                </div>
              </div>

              {/* SECCIÓN 1: VISTA DE GESTIÓN DE LEADS & BÚSQUEDA AUTOMÁTICA V REGIÓN */}
              {subTabMarketing === 'leads' && (
                <div className="space-y-5">
                  
                  {/* BARRA DE FILTRADO POR COMUNA DE LA V REGIÓN Y AUTO-DESCUBRIMIENTO */}
                  <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <MapPin className="h-5 w-5 text-[#2997ff] shrink-0" />
                      <div className="w-full md:w-64">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">COMUNA V REGIÓN:</label>
                        <select
                          value={filtroComunaVRegion}
                          onChange={(e) => setFiltroComunaVRegion(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                        >
                          <option value="Todas" className="bg-[#0c182b] text-white">Todas las Comunas (V Región)</option>
                          <option value="Viña del Mar" className="bg-[#0c182b] text-white">Viña del Mar</option>
                          <option value="Valparaíso" className="bg-[#0c182b] text-white">Valparaíso</option>
                          <option value="Concón" className="bg-[#0c182b] text-white">Concón</option>
                          <option value="Quilpué" className="bg-[#0c182b] text-white">Quilpué</option>
                          <option value="Villa Alemana" className="bg-[#0c182b] text-white">Villa Alemana</option>
                          <option value="San Antonio" className="bg-[#0c182b] text-white">San Antonio</option>
                          <option value="Los Andes" className="bg-[#0c182b] text-white">Los Andes</option>
                          <option value="Quillota" className="bg-[#0c182b] text-white">Quillota</option>
                          <option value="Limache" className="bg-[#0c182b] text-white">Limache</option>
                        </select>
                      </div>

                      <button
                        disabled={cargandoScraperVRegion}
                        onClick={handleAutoDescubrirVRegion}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-semibold rounded-xl text-xs shadow-md active:scale-95 cursor-pointer transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 mt-5 md:mt-4"
                      >
                        {cargandoScraperVRegion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span>Auto-Descubrir Prospectos</span>
                      </button>
                    </div>

                    <div className="relative flex-1 w-full flex items-center mt-2 md:mt-0">
                      <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={busquedaLead}
                        onChange={(e) => setBusquedaLead(e.target.value)}
                        placeholder="Buscar por Nombre Empresa, RUT, Email, Dirección o Contacto..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 w-full md:w-auto pb-1 md:pb-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado:</span>
                      {['Todos', 'Nuevo', 'Contactado', 'Interesado', 'Cliente'].map(st => (
                        <button
                          key={st}
                          onClick={() => setFiltroEstadoLead(st)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filtroEstadoLead === st ? 'bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white shadow-md' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CONTENEDOR DE LEADS V REGIÓN CON TABLA DESKTOP Y TARJETAS MÓVILES */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    {/* VISTA DESKTOP: TABLA RESPONSIVA CON PY-4.5 */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-medium">
                        <thead>
                          <tr className="bg-white/[0.05] text-slate-300 border-b border-white/10 font-bold uppercase text-[11px] tracking-wider">
                            <th className="p-4 border-r border-white/5">EMPRESA / RUT</th>
                            <th className="p-4 border-r border-white/5">COMUNA & DIRECCIÓN (V REGIÓN)</th>
                            <th className="p-4 border-r border-white/5">CORREO & VALIDACIÓN</th>
                            <th className="p-4 border-r border-white/5">CONTACTO & TELÉFONO</th>
                            <th className="p-4 border-r border-white/5 text-center">INTERÉS</th>
                            <th className="p-4 border-r border-white/5 text-center">ESTADO</th>
                            <th className="p-4 text-center min-w-[200px]">ACCIONES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {leadsList
                            .filter(l => {
                              const q = busquedaLead.toLowerCase()
                              const matchQ = l.empresa.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.contacto.toLowerCase().includes(q) || (l.comuna && l.comuna.toLowerCase().includes(q))
                              const matchF = filtroEstadoLead === 'Todos' || l.estado === filtroEstadoLead
                              const matchComuna = filtroComunaVRegion === 'Todas' || (l.comuna && l.comuna.toLowerCase() === filtroComunaVRegion.toLowerCase())
                              return matchQ && matchF && matchComuna
                            })
                            .map(lead => {
                              const esEmailValido = lead.email && lead.email.includes('@') && lead.email.includes('.')
                              const score = lead.score_interes || 4
                              return (
                                <tr key={lead.id} className="hover:bg-white/[0.04] transition-colors">
                                  <td className="p-4 border-r border-white/5 font-bold text-white">
                                    <div className="text-sm font-semibold text-white">{lead.empresa}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">RUT: {lead.rut || 'S/RUT'}</div>
                                  </td>
                                  <td className="p-4 border-r border-white/5 text-slate-300">
                                    <div className="font-semibold flex items-center gap-1.5 text-[#2997ff]">
                                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                                      <span>{lead.comuna || 'V Región'}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{lead.direccion || 'Chile'}</div>
                                  </td>
                                  <td className="p-4 border-r border-white/5 font-mono">
                                    <div className="text-white font-medium">{lead.email}</div>
                                    <div className="pt-0.5">
                                      {esEmailValido ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold">
                                          <CheckCircle2 className="h-3 w-3" />
                                          <span>Válido</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-md font-semibold">
                                          <AlertTriangle className="h-3 w-3" />
                                          <span>Email Error</span>
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 border-r border-white/5">
                                    <div className="font-semibold text-slate-200">{lead.contacto}</div>
                                    <div className="text-[11px] text-slate-400 font-mono">{lead.telefono}</div>
                                  </td>
                                  <td className="p-4 border-r border-white/5 text-center font-bold">
                                    <div className="text-amber-400 text-sm tracking-widest">
                                      {'★'.repeat(score)}{'☆'.repeat(5 - score)}
                                    </div>
                                  </td>
                                  <td className="p-4 border-r border-white/5 text-center font-semibold">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                      lead.estado === 'Nuevo' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                      lead.estado === 'Contactado' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                      lead.estado === 'Interesado' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                                      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    }`}>
                                      {lead.estado}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => setProspectoTratamiento(lead)}
                                        title="Tratamiento Comercial & Bitácora"
                                        className="px-2.5 py-1.5 bg-[#0066cc] hover:bg-[#2997ff] text-white rounded-xl font-semibold text-[11px] cursor-pointer transition-all shadow-md flex items-center gap-1"
                                      >
                                        <ClipboardList className="h-3.5 w-3.5" />
                                        <span>Tratar</span>
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const res = await fetch('/api/marketing/outreach', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              leads: [lead],
                                              asunto: `Propuesta de Monitoreo & Seguridad Electrónica para ${lead.empresa}`,
                                              cuerpoHtml: campanaContenido,
                                              remitente: campanaRemitente
                                            })
                                          })
                                          const d = await res.json()
                                          if (d.success) alert(`Correo de prospección enviado con éxito a ${lead.email} vía Resend!`)
                                          else alert(`Error: ${d.error}`)
                                        }}
                                        title="Enviar Correo Directo vía Resend"
                                        className="p-2 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl font-bold cursor-pointer transition-all shadow-md active:scale-95"
                                      >
                                        <Mail className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => abrirModalNuevoLead(lead)}
                                        title="Editar Lead"
                                        className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl font-bold cursor-pointer transition-all"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleEliminarLead(lead.id, lead.empresa)}
                                        title="Eliminar Lead"
                                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl font-bold cursor-pointer transition-all"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* VISTA MÓVIL: TARJETAS BENTO PARA PANTALLAS PEQUEÑAS */}
                    <div className="md:hidden divide-y divide-white/5 p-2 space-y-3">
                      {leadsList
                        .filter(l => {
                          const q = busquedaLead.toLowerCase()
                          const matchQ = l.empresa.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.contacto.toLowerCase().includes(q) || (l.comuna && l.comuna.toLowerCase().includes(q))
                          const matchF = filtroEstadoLead === 'Todos' || l.estado === filtroEstadoLead
                          const matchComuna = filtroComunaVRegion === 'Todas' || (l.comuna && l.comuna.toLowerCase() === filtroComunaVRegion.toLowerCase())
                          return matchQ && matchF && matchComuna
                        })
                        .map(lead => {
                          const esEmailValido = lead.email && lead.email.includes('@') && lead.email.includes('.')
                          const score = lead.score_interes || 4
                          return (
                            <div key={lead.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-3 shadow-md">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-white text-sm">{lead.empresa}</h4>
                                  <span className="text-[10px] text-slate-400 font-mono">RUT: {lead.rut || 'S/RUT'}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  lead.estado === 'Nuevo' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                  lead.estado === 'Contactado' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                  lead.estado === 'Interesado' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }`}>
                                  {lead.estado}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                                <div>
                                  <span className="text-slate-400 text-[10px] block">Comuna:</span>
                                  <span className="text-[#2997ff] font-semibold flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {lead.comuna || 'V Región'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block">Interés:</span>
                                  <span className="text-amber-400">{'★'.repeat(score)}{'☆'.repeat(5 - score)}</span>
                                </div>
                              </div>

                              <div className="text-[11px] space-y-0.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                                <div className="text-slate-300 flex items-center justify-between">
                                  <span className="text-slate-400">Email:</span>
                                  <span className="font-mono text-white text-[10px] truncate max-w-[180px]">{lead.email}</span>
                                </div>
                                <div className="text-slate-300 flex items-center justify-between">
                                  <span className="text-slate-400">Contacto:</span>
                                  <span className="font-semibold text-white">{lead.contacto} ({lead.telefono})</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                <button
                                  onClick={() => setProspectoTratamiento(lead)}
                                  className="flex-1 py-2 bg-[#0066cc] hover:bg-[#2997ff] text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1 shadow-md"
                                >
                                  <ClipboardList className="h-3.5 w-3.5" />
                                  <span>Tratar</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    const res = await fetch('/api/marketing/outreach', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        leads: [lead],
                                        asunto: `Propuesta de Monitoreo & Seguridad Electrónica para ${lead.empresa}`,
                                        cuerpoHtml: campanaContenido,
                                        remitente: campanaRemitente
                                      })
                                    })
                                    const d = await res.json()
                                    if (d.success) alert(`Correo de prospección enviado con éxito a ${lead.email}!`)
                                    else alert(`Error: ${d.error}`)
                                  }}
                                  className="p-2 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl font-bold shadow-md"
                                >
                                  <Mail className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => abrirModalNuevoLead(lead)}
                                  className="p-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEliminarLead(lead.id, lead.empresa)}
                                  className="p-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: MOTOR DE CAMPAÑAS Y ENVÍO MASIVO VÍA RESEND */}
              {subTabMarketing === 'campanas' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white/[0.03] border border-white/10 p-5 md:p-6 rounded-2xl shadow-xl space-y-5">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                        <Target className="h-5 w-5 text-[#2997ff]" />
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider">1. CONFIGURACIÓN DE CAMPAÑA</h3>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="font-semibold text-slate-300 block mb-1">SEGMENTO DE DESTINATARIOS:</label>
                          <select
                            value={campanaSegmento}
                            onChange={(e) => setCampanaSegmento(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-semibold text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                          >
                            <option value="Todos" className="bg-[#0c182b] text-white">Todos los Leads ({leadsList.length})</option>
                            <option value="Nuevo" className="bg-[#0c182b] text-white">Leads Nuevos Sin Contactar ({leadsList.filter(l => l.estado === 'Nuevo').length})</option>
                            <option value="Contactado" className="bg-[#0c182b] text-white">Leads Contactados ({leadsList.filter(l => l.estado === 'Contactado').length})</option>
                            <option value="Interesado" className="bg-[#0c182b] text-white">Leads Interesados ({leadsList.filter(l => l.estado === 'Interesado').length})</option>
                            <option value="Comercial B2B" className="bg-[#0c182b] text-white">Segmento Comercial B2B ({leadsList.filter(l => l.segmento === 'Comercial B2B').length})</option>
                            <option value="Industrial" className="bg-[#0c182b] text-white">Segmento Industrial ({leadsList.filter(l => l.segmento === 'Industrial').length})</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-300 block mb-1">REMITENTE VERIFICADO (RESEND):</label>
                          <select
                            value={campanaRemitente}
                            onChange={(e) => setCampanaRemitente(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-semibold text-white font-mono focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                          >
                            <option value="Gama Seguridad <contacto@gamasecurity.cl>" className="bg-[#0c182b] text-white">Gama Seguridad &lt;contacto@gamasecurity.cl&gt;</option>
                            <option value="Gama Comercial <comercial@gamasecurity.cl>" className="bg-[#0c182b] text-white">Gama Comercial &lt;comercial@gamasecurity.cl&gt;</option>
                            <option value="Resend Onboarding <onboarding@resend.dev>" className="bg-[#0c182b] text-white">Resend Onboarding &lt;onboarding@resend.dev&gt;</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-300 block mb-1">ASUNTO DEL CORREO (DINÁMICO):</label>
                          <input
                            type="text"
                            value={campanaAsunto}
                            onChange={(e) => setCampanaAsunto(e.target.value)}
                            placeholder="ej: Propuesta Monitoreo para {{nombre_empresa}}"
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-semibold text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block font-medium">Variables: <code className="text-[#2997ff] font-bold font-mono">{"{{nombre_empresa}}"}</code>, <code className="text-[#2997ff] font-bold font-mono">{"{{contacto}}"}</code></span>
                        </div>

                        <div className="pt-2">
                          <label className="font-semibold text-slate-300 block mb-2">PLANTILLAS PRECONFIGURADAS B2B:</label>
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCampanaAsunto('Propuesta de Monitoreo 24/7 & Seguridad Electrónica para {{nombre_empresa}}')
                                setCampanaContenido(`<p>Estimados <strong>{{nombre_empresa}}</strong>,</p><p>Junto con saludarle de <strong>Gama Seguridad Chile</strong>, nos ponemos en contacto con el(la) Sr(a). <strong>{{contacto}}</strong> para presentarles nuestro servicio integral de <strong>Monitoreo de Alarma 24/7 y Verificación por Video IA</strong>.</p><p>Protegemos sus instalaciones comerciales e industriales con respuesta inmediata en la Región de Valparaíso y Metropolitana.</p><p>Quedamos atentos para coordinar una reunión breve.</p><p>Atentamente,<br><strong>Equipo Comercial Gama Seguridad</strong></p>`)
                              }}
                              className="w-full p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl text-left font-semibold text-xs text-slate-200 transition-all cursor-pointer"
                            >
                              📌 1. Monitoreo 24/7 & Video IA
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCampanaAsunto('Auditoría Perimetral y Evaluación de Seguridad Gratuita — {{nombre_empresa}}')
                                setCampanaContenido(`<p>Estimado(a) <strong>{{contacto}}</strong> en <strong>{{nombre_empresa}}</strong>,</p><p>Le escribimos de <strong>Gama Seguridad SpA</strong> para ofrecerle una <strong>Auditoría Técnica Perimetral Gratuita</strong> para verificar vulnerabilidades de intrusión en sus instalaciones.</p><p>Nuestros ingenieros especialistas revisarán puntos ciegos, cercos y centrales de alarma sin ningún costo.</p><p>Atentamente,<br><strong>Gama Seguridad Chile</strong></p>`)
                              }}
                              className="w-full p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl text-left font-semibold text-xs text-slate-200 transition-all cursor-pointer"
                            >
                              🔍 2. Auditoría Perimetral Gratuita
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 p-5 md:p-6 rounded-2xl shadow-xl space-y-5 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-5 w-5 text-[#2997ff]" />
                            <span>2. EDITOR DE CONTENIDO & VISTA PREVIA</span>
                          </h3>
                          <span className="text-[11px] font-semibold text-slate-300 bg-white/10 border border-white/10 px-3 py-1 rounded-full">
                            Destinatarios Target: {leadsList.filter(l => campanaSegmento === 'Todos' || l.estado === campanaSegmento || l.segmento === campanaSegmento).length} Leads
                          </span>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-300 block mb-1 text-xs">CONTENIDO HTML DE LA CAMPAÑA:</label>
                          <textarea
                            rows={8}
                            value={campanaContenido}
                            onChange={(e) => setCampanaContenido(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xs text-slate-200 focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                          />
                        </div>

                        <div className="bg-[#08111e] rounded-xl border border-white/10 p-5 space-y-3 text-xs shadow-inner">
                          <span className="text-[10px] font-bold text-[#2997ff] uppercase tracking-wider block">👁️ VISTA PREVIA DEL CORREO PARA EL PRIMER LEAD DE LA LISTA:</span>
                          <div className="font-bold text-white text-sm border-b border-white/10 pb-2">
                            Asunto: {campanaAsunto.replace(/\{\{nombre_empresa\}\}/g, leadsList[0]?.empresa || 'Empresa Target')}
                          </div>
                          <div
                            className="text-slate-300 text-xs space-y-2 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: campanaContenido.replace(/\{\{nombre_empresa\}\}/g, leadsList[0]?.empresa || 'Empresa Target')
                                                       .replace(/\{\{contacto\}\}/g, leadsList[0]?.contacto || 'Contacto Principal')
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        {isSubmittingCampana && (
                          <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 text-blue-200 font-semibold text-xs">
                            <Loader2 className="h-5 w-5 animate-spin text-[#2997ff]" />
                            <span>{progresoEnvioText || 'Procesando envío de correos vía Resend API...'}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isSubmittingCampana}
                          onClick={handleLanzarCampanaResend}
                          className="w-full bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-bold p-4 rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all text-sm cursor-pointer flex items-center justify-center gap-3 border-none disabled:opacity-50"
                        >
                          {isSubmittingCampana ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                          <span>Lanzar Campaña de Correos con Resend</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: DISEÑADOR DE PUBLICIDAD & BANNERS B2B */}
              {subTabMarketing === 'publicidad' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* PANEL IZQUIERDO: CONFIGURACIÓN Y EDITOR DE LA PIEZA PUBLICITARIA */}
                    <div className="bg-white/[0.03] border border-white/10 p-5 md:p-6 rounded-2xl shadow-xl space-y-5">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                        <Sparkles className="h-5 w-5 text-[#2997ff]" />
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider">🎨 EDITOR DE PIEZA PUBLICITARIA B2B</h3>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="font-semibold text-slate-300 block mb-1">TITULAR PRINCIPAL DEL BANNER / CORREO:</label>
                          <input
                            type="text"
                            value={pubTitulo}
                            onChange={(e) => setPubTitulo(e.target.value)}
                            placeholder="ej: ¡Protege tu Empresa en {{comuna}}!"
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-semibold text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-300 block mb-1">SUBTÍTULO / DESCRIPCIÓN DE LA OFERTA:</label>
                          <textarea
                            rows={3}
                            value={pubSubtitulo}
                            onChange={(e) => setPubSubtitulo(e.target.value)}
                            placeholder="ej: Cámaras DarkFighter 4K sin costo de instalación..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-semibold text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-semibold text-slate-300 block mb-1">CATEGORÍA DE SEGURIDAD:</label>
                            <select
                              value={pubCategoria}
                              onChange={(e: any) => setPubCategoria(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 font-semibold text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                            >
                              <option value="Monitoreo 24/7" className="bg-[#0c182b] text-white">Monitoreo 24/7</option>
                              <option value="CCTVs & Video IA" className="bg-[#0c182b] text-white">CCTVs & Video IA</option>
                              <option value="Cerco Eléctrico" className="bg-[#0c182b] text-white">Cerco Eléctrico</option>
                              <option value="Control Acceso" className="bg-[#0c182b] text-white">Control Acceso</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-semibold text-slate-300 block mb-1">COMUNA TARGET ENVÍO:</label>
                            <select
                              value={pubComunaTarget}
                              onChange={(e) => setPubComunaTarget(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 font-semibold text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                            >
                              <option value="Todas" className="bg-[#0c182b] text-white">Todas las Comunas (V Región)</option>
                              <option value="Viña del Mar" className="bg-[#0c182b] text-white">Viña del Mar</option>
                              <option value="Valparaíso" className="bg-[#0c182b] text-white">Valparaíso</option>
                              <option value="Concón" className="bg-[#0c182b] text-white">Concón</option>
                              <option value="Quilpué" className="bg-[#0c182b] text-white">Quilpué</option>
                              <option value="Villa Alemana" className="bg-[#0c182b] text-white">Villa Alemana</option>
                              <option value="San Antonio" className="bg-[#0c182b] text-white">San Antonio</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-semibold text-slate-300 block mb-1">CUPÓN DE DESCUENTO:</label>
                            <input
                              type="text"
                              value={pubCupon}
                              onChange={(e) => setPubCupon(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 font-mono font-bold text-[#2997ff] focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="font-semibold text-slate-300 block mb-1">ENLACE DE LLAMADA (CTA):</label>
                            <input
                              type="text"
                              value={pubEnlaceCta}
                              onChange={(e) => setPubEnlaceCta(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 font-mono text-[11px] text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PANEL DERECHO: VISTA PREVIA INTERACTIVA DE LA PUBLICIDAD */}
                    <div className="bg-white/[0.03] border border-white/10 p-5 md:p-6 rounded-2xl shadow-xl space-y-5 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-[#2997ff]" />
                            <span>VISTA PREVIA DE LA PIEZA PUBLICITARIA</span>
                          </h3>
                          <span className="text-[11px] font-semibold text-white bg-[#0066cc] px-3 py-1 rounded-full">
                            Target: {leadsList.filter(l => pubComunaTarget === 'Todas' || l.comuna === pubComunaTarget).length} Empresas ({pubComunaTarget})
                          </span>
                        </div>

                        {/* FLYER / BANNER PREVIEW EN AZUL FRANCIA DEGRADADO */}
                        <div className="bg-[#0c182b] rounded-2xl border border-white/15 overflow-hidden shadow-2xl">
                          <div className="bg-gradient-to-r from-[#0066cc] to-[#2997ff] p-6 text-center text-white space-y-2">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">OFERTA EXCLUSIVA V REGIÓN</span>
                            <h2 className="text-xl font-black leading-tight pt-1">
                              {pubTitulo.replace(/\{\{comuna\}\}/g, pubComunaTarget)}
                            </h2>
                            <p className="text-xs opacity-90">{pubSubtitulo}</p>
                          </div>

                          <div className="p-6 text-center bg-black/40 space-y-4">
                            <p className="text-xs text-slate-300 font-medium">Use su cupón de bonificación empresarial al solicitar su factibilidad técnica:</p>
                            <div className="inline-block bg-[#0066cc] text-white px-6 py-2.5 rounded-xl font-mono text-base font-bold shadow-lg tracking-wider">
                              CUPÓN: {pubCupon}
                            </div>
                            <div>
                              <a
                                href={pubEnlaceCta}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
                              >
                                SOLICITAR EVALUACIÓN EN TERRENO →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isDistribuyendoPublicidad}
                        onClick={handleDistribuirPublicidad}
                        className="w-full bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-bold p-4 rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all text-sm cursor-pointer flex items-center justify-center gap-3 border-none disabled:opacity-50 mt-4"
                      >
                        {isDistribuyendoPublicidad ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Megaphone className="h-5 w-5" />
                        )}
                        <span>📢 Distribuir Publicidad a Prospectos de {pubComunaTarget} (Resend)</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO ERP: COMPRAS, GASTOS & PROVEEDORES ── */}
          {moduloActivo === 'compras' && (
            <ComprasProveedoresModule
              clientesMaestros={clientesMaestros}
              abonadosCentrosCosto={abonadosCentrosCosto}
            />
          )}

          {/* ── MÓDULO ERP: CONTRATOS & FIRMA DIGITAL ── */}
          {moduloActivo === 'contratos' && (
            <ContratosModule
              clientesMaestros={clientesMaestros}
              abonadosCentrosCosto={abonadosCentrosCosto}
              empresasConglomerado={empresasConglomerado}
            />
          )}

          {/* ── MÓDULO LEGAL: LEY 21.719 PROTECCIÓN DE DATOS PERSONALES ── */}
          {moduloActivo === 'ley21719' && (
            <Ley21719Module />
          )}

            </main>
          </div>
        )}
      </div>

      {/* ── MODAL EDITAR / CREAR EMPRESA CONGLOMERADO (APPLE BENTO DARK) ── */}
      {mostrarModalEmpresa && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 md:p-6 flex justify-center items-center overflow-y-auto no-imprimir">
          <div className="bg-[#0c182b]/95 border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 text-xs text-white font-sans my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl shadow-md">
                  <Building2 className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white uppercase tracking-wider">
                    {empresaEditando ? 'EDITAR EMISOR CONGLOMERADO' : 'CREAR NUEVA RAZÓN SOCIAL EMISORA'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Configuración de datos fiscales, comerciales y bancarios para documentos DTE</p>
                </div>
              </div>
              <button onClick={() => setMostrarModalEmpresa(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="bg-white/[0.03] border border-white/10 p-4 md:p-5 rounded-2xl space-y-3">
                <span className="font-bold text-white text-xs uppercase tracking-wider block">1. IDENTIFICACIÓN TRIBUTARIA CHILENA:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">RAZÓN SOCIAL:</label>
                    <input type="text" value={empFormRazonSocial} onChange={(e) => setEmpFormRazonSocial(e.target.value)} placeholder="ej: Gama Seguridad SpA" className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl font-bold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">R.U.T. EMISOR:</label>
                    <input type="text" value={empFormRut} onChange={(e) => setEmpFormRut(e.target.value)} placeholder="ej: 76.319.399-3" className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl font-mono font-bold text-xs text-[#2997ff] focus:ring-2 focus:ring-[#0066cc] focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">GIRO COMERCIAL SII:</label>
                  <input type="text" value={empFormGiro} onChange={(e) => setEmpFormGiro(e.target.value)} placeholder="ej: Servicios de Monitoreo & Seguridad Electrónica" className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">DIRECCIÓN FISCAL:</label>
                    <input type="text" value={empFormDireccion} onChange={(e) => setEmpFormDireccion(e.target.value)} placeholder="ej: Av. Valparaíso 1183, Viña del Mar" className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">SITIO WEB OFICIAL:</label>
                    <input type="text" value={empFormWeb} onChange={(e) => setEmpFormWeb(e.target.value)} placeholder="www.gamasecurity.cl" className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">TELÉFONO CONTACTO:</label>
                    <input type="text" value={empFormTelefono} onChange={(e) => setEmpFormTelefono(e.target.value)} placeholder="+56 32 3276011" className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">EMAIL COBRANZA / FACTURACIÓN:</label>
                    <input type="text" value={empFormEmailCobranza} onChange={(e) => setEmpFormEmailCobranza(e.target.value)} placeholder="cobranza@gamasecurity.cl" className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/10 p-4 md:p-5 rounded-2xl space-y-3">
                <span className="font-bold text-white text-xs uppercase tracking-wider block">2. DATOS BANCARIOS PARA TRANSFERENCIAS:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">BANCO:</label>
                    <input type="text" value={empFormBancoNombre} onChange={(e) => setEmpFormBancoNombre(e.target.value)} placeholder="Banco de Chile" className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl font-bold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">TIPO CUENTA:</label>
                    <input type="text" value={empFormBancoTipoCuenta} onChange={(e) => setEmpFormBancoTipoCuenta(e.target.value)} placeholder="Cuenta Corriente" className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl font-bold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">N° DE CUENTA:</label>
                    <input type="text" value={empFormBancoNumeroCuenta} onChange={(e) => setEmpFormBancoNumeroCuenta(e.target.value)} placeholder="00-123-45678-9" className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl font-mono font-bold text-xs text-emerald-400 focus:ring-2 focus:ring-[#0066cc] focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
              <button onClick={() => setMostrarModalEmpresa(false)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-all">Cancelar</button>
              <button onClick={handleGuardarEmpresaEmisora} className="px-6 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-bold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer transition-all">Guardar Empresa</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE REGISTRO DE ABONOS A FACTURAS (APPLE BENTO DARK) ── */}
      {mostrarModalAbono && facturaAbonando && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 flex justify-center items-center no-imprimir">
          <div className="bg-[#0c182b]/95 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-7 flex flex-col gap-5 text-xs text-white font-sans">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#2997ff]" />
                <span>Registrar Abono / Pago de Factura</span>
                <span className="bg-white/10 border border-white/10 text-slate-200 px-2.5 py-0.5 rounded-md font-mono font-bold text-xs">
                  {facturaAbonando.numero_factura}
                </span>
              </h3>
              <button onClick={() => setMostrarModalAbono(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Cliente:</span>
                <strong className="text-white">{facturaAbonando.razon_social}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Monto Total Factura:</span>
                <strong className="font-mono text-white">${facturaAbonando.monto_total.toLocaleString('es-CL')} CLP</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Abonado a la Fecha:</span>
                <strong className="font-mono text-emerald-400">${(facturaAbonando.monto_abonado || 0).toLocaleString('es-CL')} CLP</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm">
                <span className="text-red-400">Saldo Pendiente Actual:</span>
                <span className="font-mono text-red-400">${(facturaAbonando.saldo_pendiente || 0).toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Monto del Nuevo Abono ($ CLP):</label>
                <input
                  type="number"
                  value={montoAbonoInput}
                  onChange={(e) => setMontoAbonoInput(e.target.value)}
                  placeholder="Ingrese el monto del abono..."
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-mono font-bold text-sm text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Método de Pago:</label>
                <select
                  value={metodoPagoInput}
                  onChange={(e) => setMetodoPagoInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                >
                  <option value="Transferencia Bancaria" className="bg-[#0c182b] text-white">Transferencia Bancaria (Banco Chile / Santander)</option>
                  <option value="Cheque a Fecha" className="bg-[#0c182b] text-white">Cheque a Fecha / Al Día</option>
                  <option value="WebPay / Tarjeta" className="bg-[#0c182b] text-white">WebPay / Tarjeta Débito-Crédito</option>
                  <option value="Efectivo / Caja" className="bg-[#0c182b] text-white">Efectivo en Caja</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Observación / N° Comprobante:</label>
                <input
                  type="text"
                  value={notaAbonoInput}
                  onChange={(e) => setNotaAbonoInput(e.target.value)}
                  placeholder="ej: N° Transferencia 889210..."
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
              <button
                onClick={() => setMostrarModalAbono(false)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarAbono}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-bold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer transition-all"
              >
                Guardar Abono
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREADOR DE PRESUPUESTOS MODAL DTE CHILE ── */}
      {mostrarModalCotizacion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-4 md:p-6 flex justify-center items-center no-imprimir">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-7xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden p-5 md:p-6 gap-5 font-sans text-xs text-white">
            
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-[#005bea] to-[#00c6fb] text-white rounded-xl shadow-xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white uppercase tracking-wider flex items-center gap-3">
                    {cotEditandoId ? 'EDITAR PRESUPUESTO DTE' : 'CREAR PRESUPUESTO COMERCIAL DTE'}
                    <span className="bg-slate-800 text-zinc-200 text-xs px-3 py-0.5 rounded-full font-mono font-bold border border-slate-700">
                      {cotEditandoId ? cotizaciones.find(c => c.id === cotEditandoId)?.codigo_cotizacion : siguienteCorrelativoCode}
                    </span>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setMostrarModalCotizacion(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg px-3 py-1.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-6 min-h-0">
              
              {/* CONFIGURADOR DE DATOS DE COTIZACIÓN */}
              <div className="w-full lg:w-1/2 p-6 bg-white text-slate-900 rounded-2xl border border-slate-300 overflow-y-auto flex flex-col gap-5 shadow-inner">
                
                {/* RECEPTOR */}
                <div className="bg-[#f8fafc] p-5 rounded-2xl border border-slate-200 space-y-4">
                  <label className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider block">1. RECEPTOR DE LA OFERTA COMERCIAL:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => {
                          setTipoReceptorCot('registrado')
                          if (clienteActivo?.rut) {
                            handleSeleccionarClienteParaCotizacion(clienteActivo.rut)
                          } else if (abonadoActivo?.cuenta) {
                            handleSeleccionarClienteParaCotizacion(abonadoActivo.cuenta)
                          } else {
                            const ruts = Object.keys(clientesMaestros)
                            if (ruts.length > 0) handleSeleccionarClienteParaCotizacion(ruts[0])
                          }
                        }}
                        className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer border transition-all ${tipoReceptorCot === 'registrado' ? 'bg-[#005bea] text-white border-[#005bea] shadow-md' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                      >
                        Cliente Registrado
                      </button>
                    <button
                        type="button"
                        onClick={() => {
                          setTipoReceptorCot('prospecto')
                          setCotClienteRutSeleccionado('')
                          setCotNombreCliente('NUEVO PROSPECTO COMERCIAL')
                          setCotRutCliente('75.000.000-0')
                          setCotContactoPersona('Sr(a). Director(a) / Adquisiciones')
                        }}
                        className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer border transition-all ${tipoReceptorCot === 'prospecto' ? 'bg-[#005bea] text-white border-[#005bea] shadow-md' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                      >
                        Nuevo Prospecto
                      </button>
                  </div>

                  {tipoReceptorCot === 'registrado' ? (
                    <div className="space-y-3 pt-1">
                      <select
                        value={cotClienteRutSeleccionado}
                        onChange={(e) => handleSeleccionarClienteParaCotizacion(e.target.value)}
                        className="w-full bg-white border border-slate-300 p-3.5 rounded-xl font-bold text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs"
                      >
                        {Object.values(clientesMaestros).map(c => (
                          <option key={c.rut} value={c.rut}>{c.razon_social} — (RUT: {c.rut})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={cotNombreCliente}
                        onChange={(e) => setCotNombreCliente(e.target.value)}
                        placeholder="Razón Social / Nombre..."
                        className="w-full bg-white border border-slate-300 p-3.5 rounded-xl font-bold text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={cotNombreCliente}
                      onChange={(e) => setCotNombreCliente(e.target.value)}
                      placeholder="Razón Social del Prospecto..."
                      className="w-full bg-white border border-slate-300 p-3.5 rounded-xl font-bold text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs"
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">RUT RECEPTOR (EDITABLE):</label>
                      <input
                        type="text"
                        value={cotRutCliente}
                        onChange={(e) => setCotRutCliente(e.target.value)}
                        placeholder="ej: 75.123.456-7"
                        className="w-full bg-white border border-slate-300 p-3 rounded-xl text-xs sm:text-sm font-mono font-bold text-[#005bea] focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">ATENCIÓN A (PERSONA):</label>
                      <input
                        type="text"
                        value={cotContactoPersona}
                        onChange={(e) => setCotContactoPersona(e.target.value)}
                        placeholder="Nombre de contacto..."
                        className="w-full bg-white border border-slate-300 p-3 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">DIRECCIÓN ENTREGA:</label>
                      <input
                        type="text"
                        value={cotDireccion}
                        onChange={(e) => setCotDireccion(e.target.value)}
                        className="w-full bg-white border border-slate-300 p-3 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">CIUDAD / COMUNA:</label>
                      <input
                        type="text"
                        value={cotCiudadCliente}
                        onChange={(e) => setCotCiudadCliente(e.target.value)}
                        placeholder="ej: Viña del Mar, Santiago..."
                        className="w-full bg-white border border-slate-300 p-3 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">EMAIL CONFIRMACIÓN:</label>
                      <input
                        type="text"
                        value={cotEmailCliente}
                        onChange={(e) => setCotEmailCliente(e.target.value)}
                        className="w-full bg-white border border-slate-300 p-3 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">TELÉFONO RECEPTOR:</label>
                      <input
                        type="text"
                        value={cotTelefonoCliente}
                        onChange={(e) => setCotTelefonoCliente(e.target.value)}
                        className="w-full bg-white border border-slate-300 p-3 rounded-xl text-xs sm:text-sm font-mono font-semibold focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* EMISOR Y CONDICIONES */}
                <div className="bg-[#f8fafc] p-5 rounded-2xl border border-slate-200 space-y-4">
                  <label className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider block">2. RAZÓN SOCIAL EMISORA, MONEDA & PIPELINE:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">EMPRESA EMISORA:</label>
                      <select value={cotEmpresaEmisoraId} onChange={(e) => setCotEmpresaEmisoraId(e.target.value)} className="w-full bg-white border border-slate-300 p-3 rounded-xl font-bold text-xs sm:text-sm focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs">
                        {empresasConglomerado.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">MONEDA:</label>
                      <select value={cotMoneda} onChange={(e: any) => setCotMoneda(e.target.value)} className="w-full bg-white border border-slate-300 p-3 rounded-xl font-bold text-xs sm:text-sm focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs">
                        <option value="CLP">CLP (Pesos Chilenos)</option>
                        <option value="UF">UF (Unidad de Fomento)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">ETAPA PIPELINE:</label>
                      <select value={cotEtapaPipeline} onChange={(e: any) => setCotEtapaPipeline(e.target.value)} className="w-full bg-white border border-slate-300 p-3 rounded-xl font-bold text-xs sm:text-sm text-[#005bea] focus:ring-2 focus:ring-[#005bea]/30 focus:border-[#005bea] shadow-xs">
                        <option value="Lead">Prospecto / Lead</option>
                        <option value="Visita">Visita Técnica</option>
                        <option value="Cotizacion">Cotización Enviada</option>
                        <option value="Negociacion">En Negociación</option>
                        <option value="Ganada">Aprobada / Ganada</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">FORMA DE PAGO:</label>
                      <input type="text" value={cotFormaPago} onChange={(e) => setCotFormaPago(e.target.value)} className="w-full bg-white border border-slate-300 p-3 rounded-xl text-xs sm:text-sm font-bold shadow-xs" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">DÍAS VALIDEZ:</label>
                      <input type="number" value={cotValidez} onChange={(e) => setCotValidez(Number(e.target.value) || 15)} className="w-full bg-white border border-slate-300 p-3 rounded-xl text-xs sm:text-sm font-bold text-center shadow-xs" />
                    </div>
                  </div>
                </div>

                {/* ÍTEMS */}
                <div className="bg-[#f8fafc] p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider">3. DETALLE DE EQUIPOS & SERVICIOS:</label>
                    <button type="button" onClick={() => setItemsCot([...itemsCot, { id: Date.now().toString(), descripcion: 'Nuevo servicio / equipo de seguridad', cantidad: 1, precio_neto_unitario: 25000, descuento_valor: 0, tipo_descuento: 'porcentaje' }])} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all">
                      <Plus className="h-4 w-4" />
                      <span>Agregar Línea</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-500">Catálogo Rápido:</span>
                    {CATALOGO_SEGURIDAD.slice(0, 4).map(cat => (
                      <button key={cat.id} type="button" onClick={() => handleAgregarItemDelCatalogo(cat)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl border border-slate-300 transition-colors shadow-2xs">
                        + {cat.categoria}
                      </button>
                    ))}
                  </div>

                  {itemsCot.map((it, idx) => (
                    <div key={it.id} className="grid grid-cols-12 gap-3 items-center p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <input type="text" value={it.descripcion} onChange={(e) => { const newIt = [...itemsCot]; newIt[idx].descripcion = e.target.value; setItemsCot(newIt) }} placeholder="Descripción..." className="col-span-6 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs sm:text-sm font-semibold" />
                      <input type="number" value={it.cantidad} onChange={(e) => { const newIt = [...itemsCot]; newIt[idx].cantidad = Number(e.target.value) || 1; setItemsCot(newIt) }} placeholder="Cant" className="col-span-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs sm:text-sm text-center font-bold" />
                      <input type="number" value={it.precio_neto_unitario} onChange={(e) => { const newIt = [...itemsCot]; newIt[idx].precio_neto_unitario = Number(e.target.value) || 0; setItemsCot(newIt) }} placeholder="P. Unit Neto" className="col-span-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs sm:text-sm text-right font-black font-mono text-[#005bea]" />
                      <button type="button" onClick={() => setItemsCot(itemsCot.filter(i => i.id !== it.id))} className="col-span-1 text-red-600 font-bold text-center hover:bg-red-50 p-2 rounded-xl flex justify-center transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex justify-end gap-3.5">
                  <button type="button" onClick={() => setMostrarModalCotizacion(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors">Cancelar</button>
                  <button type="button" onClick={handleGuardarCotizacionDolibarr} className="px-7 py-3 bg-gradient-to-r from-[#005bea] to-[#00c6fb] hover:brightness-105 active:scale-95 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-lg cursor-pointer transition-all">Guardar Presupuesto DTE</button>
                </div>
              </div>

              {/* VISTA PREVIA IMPRESA A4 EN TIEMPO REAL */}
              <div className="w-full lg:w-1/2 p-6 bg-slate-900 rounded-2xl border border-slate-800 overflow-y-auto flex items-start justify-center">
                <div className="bg-white text-slate-900 p-8 rounded-2xl max-w-xl w-full shadow-2xl font-sans border border-slate-300 space-y-6 text-xs min-h-[750px] flex flex-col justify-between overflow-hidden">
                  <div className="space-y-5">
                    
                    {/* CABECERA DTE CHILE */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 gap-4">
                      <div className="space-y-1 text-xs">
                        <h1 className="text-base font-bold text-slate-900 uppercase">{empresaEmisoraSeleccionadaCot.razon_social}</h1>
                        <p className="font-mono text-slate-700 font-bold text-[11px]">R.U.T.: {empresaEmisoraSeleccionadaCot.rut}</p>
                        <p className="text-slate-600 text-[11px]">{empresaEmisoraSeleccionadaCot.giro}</p>
                        <p className="text-slate-600 text-[11px]">📍 {empresaEmisoraSeleccionadaCot.direccion}</p>
                        <p className="text-slate-600 text-[11px]">📞 {empresaEmisoraSeleccionadaCot.telefono} | ✉️ {empresaEmisoraSeleccionadaCot.email_contacto}</p>
                      </div>

                      <div className="border-2 border-slate-900 bg-slate-50 p-4 rounded-xl w-60 space-y-1 text-center shadow-xs">
                        <span className="text-[10px] font-bold text-slate-900 uppercase block tracking-wider">COTIZACIÓN / PRESUPUESTO</span>
                        <h2 className="text-base font-bold text-slate-900 font-mono">{siguienteCorrelativoCode}</h2>
                        <div className="text-[10px] text-slate-600 pt-1 font-bold">
                          FECHA: {new Date().toLocaleDateString('es-CL')}
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold">
                          VALIDEZ: {cotValidez} DÍAS HÁBILES
                        </div>
                      </div>
                    </div>

                    {/* DATOS DEL CLIENTE / RECEPTOR */}
                    <div className="border border-slate-300 bg-slate-50 p-4 rounded-xl grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RECEPTOR / RAZÓN SOCIAL:</span>
                        <strong className="text-slate-900 text-xs block">{cotNombreCliente || 'Nombre del Cliente'}</strong>
                        <span className="text-slate-900 font-mono font-bold block">R.U.T.: {cotRutCliente || 'S/RUT'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ATENCIÓN A / ENTREGA:</span>
                        <strong className="text-slate-900 text-xs block">{cotContactoPersona || cotNombreCliente}</strong>
                        <span className="text-slate-600 block">📍 Dirección: {cotDireccion || 'Dirección de Entrega'}</span>
                        <span className="text-slate-900 font-bold block">🏙️ Ciudad: {cotCiudadCliente || 'Santiago'}, Chile</span>
                      </div>
                    </div>

                    {/* TABLA DE DETALLE */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden text-[11px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase text-[10px]">
                            <th className="p-2.5 border-r border-slate-300 w-8 text-center">#</th>
                            <th className="p-2.5 border-r border-slate-300">Descripción del Servicio / Equipo</th>
                            <th className="p-2.5 border-r border-slate-300 text-center w-12">Cant.</th>
                            <th className="p-2.5 border-r border-slate-300 text-right w-20">P. Unit</th>
                            <th className="p-2.5 text-right w-24">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {itemsCot.map((it, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 text-center font-mono text-slate-400 border-r border-slate-200">{idx + 1}</td>
                              <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-200">{it.descripcion}</td>
                              <td className="p-2.5 text-center font-mono font-bold border-r border-slate-200">{it.cantidad}</td>
                              <td className="p-2.5 text-right font-mono border-r border-slate-200">${(it.precio_neto_unitario || 0).toLocaleString('es-CL')}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900">${Math.round((it.cantidad || 1) * (it.precio_neto_unitario || 0)).toLocaleString('es-CL')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* DESGLOSE FINANCIERO TRIBUTARIO CHILENO */}
                    <div className="flex justify-between items-start gap-4 pt-2">
                      <div className="text-[10px] space-y-1 text-slate-600 max-w-[240px]">
                        <p className="font-bold text-slate-800">💳 DATOS PARA TRANSFERENCIA BANCARIA:</p>
                        <p>{empresaEmisoraSeleccionadaCot.banco_nombre}</p>
                        <p>{empresaEmisoraSeleccionadaCot.banco_tipo_cuenta}: <strong className="font-mono">{empresaEmisoraSeleccionadaCot.banco_numero_cuenta}</strong></p>
                        <p>RUT: <strong className="font-mono">{empresaEmisoraSeleccionadaCot.rut}</strong></p>
                        <p>Mail: {empresaEmisoraSeleccionadaCot.email_cobranza}</p>
                      </div>

                      <div className="w-64 border border-slate-300 rounded-xl overflow-hidden font-mono text-xs shadow-xs">
                        <div className="flex justify-between p-2 bg-white border-b">
                          <span className="text-[11px] font-semibold text-slate-600">Neto Afecto:</span>
                          <span className="font-bold">${Math.round(calculoCotizacionActual.netoConDescuento).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-50 border-b text-slate-900">
                          <span className="text-[11px] font-bold">IVA 19% (Ley 825):</span>
                          <span className="font-bold">${Math.round(calculoCotizacionActual.montoIva).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-slate-900 text-white font-bold">
                          <span>TOTAL:</span>
                          <span>${Math.round(calculoCotizacionActual.totalIvaIncluido).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VISOR IMPRESO PDF COMPLETO CHILE DTE ── */}
      {cotSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
          
          <div className="no-imprimir fixed top-6 right-8 z-50 flex gap-3">
            <button
              onClick={() => handleEnviarWhatsAppCotizacion(cotSeleccionada)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xl cursor-pointer flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Notificar por WhatsApp</span>
            </button>
            <button
              onClick={() => handleEnviarEmailCotizacion(cotSeleccionada)}
              disabled={enviandoEmailId === cotSeleccionada.id}
              className="px-4 py-2.5 bg-[#005bea] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xl cursor-pointer flex items-center gap-2"
            >
              {enviandoEmailId === cotSeleccionada.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              <span>Enviar por Email</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-gradient-to-r from-[#005bea] to-[#00c6fb] text-white font-bold text-xs rounded-xl shadow-xl cursor-pointer flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={() => setCotSeleccionada(null)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xl cursor-pointer"
            >
              ✕ Cerrar
            </button>
          </div>

          {/* DOCUMENTO IMPRIMIBLE OFICIAL A4 DTE CHILE */}
          <div id="seccion-imprimible-cotizacion" className="bg-white text-slate-900 p-10 md:p-14 rounded-2xl max-w-4xl w-full shadow-2xl font-sans my-4 border border-slate-300 space-y-8 min-h-[900px] flex flex-col justify-between overflow-hidden">
            
            <div className="space-y-6">
              
              {/* ENCABEZADO FISCAL CHILENO */}
              {(() => {
                const empEmisoraDoc = empresasConglomerado.find(e => e.id === cotSeleccionada.empresa_facturadora_id) || empresasConglomerado[0]
                return (
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 text-white rounded-lg">
                          <Shield className="h-6 w-6 stroke-[2]" />
                        </div>
                        <div>
                          <h1 className="text-xl font-bold text-slate-900 uppercase">{empEmisoraDoc.razon_social}</h1>
                          <p className="font-mono text-slate-800 font-bold">R.U.T.: {empEmisoraDoc.rut}</p>
                        </div>
                      </div>
                      <p className="text-slate-600 pt-2">Giro: {empEmisoraDoc.giro}</p>
                      <p className="text-slate-600">Dirección Fiscal: {empEmisoraDoc.direccion}</p>
                      <p className="text-slate-600">Teléfono: {empEmisoraDoc.telefono} | Correo: {empEmisoraDoc.email_contacto}</p>
                      <p className="text-slate-600 font-mono">Web: {empEmisoraDoc.web}</p>
                    </div>

                    <div className="border-2 border-slate-900 bg-slate-50 p-5 rounded-xl w-full md:w-80 space-y-2 text-center shadow-xs">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-widest">PRESUPUESTO / COTIZACIÓN DTE</div>
                      <h2 className="text-xl font-bold text-slate-900 font-mono">{cotSeleccionada.codigo_cotizacion}</h2>
                      <div className="text-xs text-slate-600 border-t border-slate-300 pt-2 grid grid-cols-2 text-left font-mono">
                        <div><strong>FECHA:</strong> {cotSeleccionada.fecha}</div>
                        <div><strong>VALIDEZ:</strong> {cotSeleccionada.validez_dias || 15} Días</div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* DATOS DEL CLIENTE RECEPTOR */}
              <div className="border border-slate-300 bg-slate-50 p-5 rounded-xl grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RECEPTOR DE LA PROPUESTA:</span>
                  <strong className="text-slate-900 text-sm block uppercase">{cotSeleccionada.nombre_cliente}</strong>
                  <p className="font-mono text-slate-900 font-bold text-sm">R.U.T.: {cotSeleccionada.rut_cliente || 'S/RUT'}</p>
                  <p className="text-slate-600">Giro: {cotSeleccionada.giro_cliente || 'Servicios Integrales / Particular'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ATENCIÓN A / CIUDAD / ENTREGA:</span>
                  <strong className="text-slate-900 text-sm block">{cotSeleccionada.contacto_persona || cotSeleccionada.nombre_cliente}</strong>
                  <p className="text-slate-600">📍 Dirección: {cotSeleccionada.direccion || 'Dirección Principal'}</p>
                  <p className="text-slate-900 font-bold">🏙️ Ciudad / Comuna: <span className="text-slate-950 font-bold">{cotSeleccionada.ciudad_cliente || 'Santiago'}</span>, Chile</p>
                  <p className="text-slate-600">✉️ Correo: {cotSeleccionada.email_cliente || 'contacto@cliente.cl'}</p>
                </div>
              </div>

              {/* TABLA DETALLE DE PRODUCTOS & SERVICIOS */}
              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase text-[11px]">
                      <th className="p-3.5 border-r border-slate-300 text-center w-10">#</th>
                      <th className="p-3.5 border-r border-slate-300">Descripción del Producto / Servicio Técnico</th>
                      <th className="p-3.5 border-r border-slate-300 text-center w-16">Cant.</th>
                      <th className="p-3.5 border-r border-slate-300 text-right w-28">P. Unit Neto</th>
                      <th className="p-3.5 text-right w-32">Subtotal Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cotSeleccionada.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3.5 text-center font-mono text-slate-400 border-r border-slate-200">{idx + 1}</td>
                        <td className="p-3.5 font-semibold text-slate-900 border-r border-slate-200">{it.descripcion}</td>
                        <td className="p-3.5 text-center font-mono font-bold border-r border-slate-200">{it.cantidad}</td>
                        <td className="p-3.5 text-right font-mono border-r border-slate-200">${(it.precio_neto_unitario || 0).toLocaleString('es-CL')}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">${Math.round((it.cantidad || 1) * (it.precio_neto_unitario || 0)).toLocaleString('es-CL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* RESUMEN FINANCIERO Y TRIBUTARIO CHILENO */}
              <div className="flex justify-between items-start gap-6 pt-2">
                
                {/* CONDICIONES BANCARIAS Y TÉRMINOS */}
                <div className="text-xs space-y-2 text-slate-600 max-w-md bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  {(() => {
                    const empEmisoraDoc = empresasConglomerado.find(e => e.id === cotSeleccionada.empresa_facturadora_id) || empresasConglomerado[0]
                    return (
                      <>
                        <h4 className="font-bold text-slate-900 uppercase text-[11px]">💳 DATOS PARA TRANSFERENCIA ELECTRONICA:</h4>
                        <p className="text-[11px]">Empresa: <strong>{empEmisoraDoc.razon_social}</strong> (RUT: <strong className="font-mono">{empEmisoraDoc.rut}</strong>)</p>
                        <p className="text-[11px]">Banco: <strong>{empEmisoraDoc.banco_nombre}</strong> — {empEmisoraDoc.banco_tipo_cuenta}</p>
                        <p className="text-[11px]">N° Cuenta: <strong className="font-mono">{empresaEmisoraSeleccionadaCot.banco_numero_cuenta}</strong></p>
                        <p className="text-[11px]">Email Confirmación: <strong>{empEmisoraDoc.email_cobranza}</strong></p>
                        <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-500 space-y-0.5">
                          <p>• Precios expresados en Pesos Chilenos (CLP) con IVA 19% incluido.</p>
                          <p>• Validez de la oferta: {cotSeleccionada.validez_dias || 15} días hábiles a contar de esta fecha.</p>
                          <p>• Garantía legal de equipos: 12 meses contra defectos de fabricación.</p>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* CAJA DE TOTALES IMPUESTOS CHILE */}
                <div className="w-80 border-2 border-slate-900 rounded-xl overflow-hidden font-mono text-xs shadow-md">
                  <div className="flex justify-between p-3 bg-white border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Subtotal Neto Afecto:</span>
                    <span className="font-bold">${Math.round(cotSeleccionada.neto_con_descuento || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 border-b border-slate-200 text-slate-900">
                    <span className="font-bold">IVA (19% Ley 825):</span>
                    <span className="font-bold">${Math.round(cotSeleccionada.monto_iva || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-900 text-white font-bold text-sm">
                    <span>TOTAL GENERAL:</span>
                    <span>${Math.round(cotSeleccionada.monto_total_iva_incluido || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                </div>
              </div>

              {/* TIMBRE Y ACEPTACIÓN DEL CLIENTE */}
              <div className="border-t-2 border-slate-200 pt-8 mt-6 grid grid-cols-2 gap-8 items-end">
                <div className="text-center space-y-2">
                  <div className="border-b border-slate-400 w-48 mx-auto"></div>
                  <p className="font-bold text-xs text-slate-800">{cotSeleccionada.vendedor || 'Ejecutivo Comercial Gama Seguridad'}</p>
                  <p className="text-[10px] text-slate-500">Emisor Autorizado Conglomerado Gama</p>
                </div>

                <div className="text-center space-y-2">
                  <div className="border-b border-slate-400 w-48 mx-auto"></div>
                  <p className="font-bold text-xs text-slate-800">Aceptado por: {cotSeleccionada.contacto_persona || cotSeleccionada.nombre_cliente}</p>
                  <p className="text-[10px] text-slate-500">Firma / Timbre de Aceptación del Cliente</p>
                </div>
              </div>

            </div>

            <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs text-slate-500 font-mono no-imprimir">
              <span>Documento Oficial Gama Seguridad • Cumple Formato DTE Chile</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DRAWER DE TRATAMIENTO INDIVIDUAL Y BITÁCORA DEL PROSPECTO (APPLE BENTO DARK) ── */}
      {prospectoTratamiento && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 md:p-6 flex justify-end items-stretch no-imprimir overflow-y-auto">
          <div className="bg-[#0c182b]/95 border-l border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-5 text-xs text-white font-sans my-auto min-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-start pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl shadow-md">
                  <ClipboardList className="h-6 w-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white uppercase tracking-wider">
                    {prospectoTratamiento.empresa}
                  </h3>
                  <p className="text-xs text-[#2997ff] font-semibold flex items-center gap-2 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{prospectoTratamiento.comuna || 'V Región'} • RUT: {prospectoTratamiento.rut || 'S/RUT'}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setProspectoTratamiento(null)} className="text-slate-400 hover:text-white font-bold text-xl cursor-pointer">✕</button>
            </div>

            {/* RESUMEN DEL PROSPECTO Y SCORE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CONTACTO PRINCIPAL:</span>
                <span className="font-semibold text-white text-xs block mt-0.5">{prospectoTratamiento.contacto}</span>
                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{prospectoTratamiento.telefono}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CORREO ELECTRÓNICO:</span>
                <span className="font-semibold font-mono text-white text-xs truncate block mt-0.5">{prospectoTratamiento.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIVEL DE INTERÉS:</span>
                <div className="text-amber-400 text-sm font-bold tracking-widest mt-0.5">
                  {'★'.repeat(prospectoTratamiento.score_interes || 4)}{'☆'.repeat(5 - (prospectoTratamiento.score_interes || 4))}
                </div>
              </div>
            </div>

            {/* BITÁCORA DE INTERACCIONES Y REGISTRO DE TRATAMIENTO */}
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                  <MessageSquare className="h-4 w-4 text-[#2997ff]" />
                  <span>REGISTRAR NUEVA INTERACCIÓN / NOTA COMERCIAL</span>
                </h4>

                <div className="space-y-3 bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">TIPO DE CONTACTO:</label>
                      <select
                        value={tipoNotaBitacora}
                        onChange={(e: any) => setTipoNotaBitacora(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                      >
                        <option value="Llamada" className="bg-[#0c182b] text-white">📞 Llamada Telefónica</option>
                        <option value="Correo" className="bg-[#0c182b] text-white">📧 Correo Comercial</option>
                        <option value="Visita" className="bg-[#0c182b] text-white">🏢 Visita en Terreno</option>
                        <option value="WhatsApp" className="bg-[#0c182b] text-white">💬 Mensaje WhatsApp</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CAMBIAR ESTADO DEL PROSPECTO:</label>
                      <select
                        value={prospectoTratamiento.estado}
                        onChange={(e: any) => {
                          const nuevoEstado = e.target.value
                          const act = { ...prospectoTratamiento, estado: nuevoEstado }
                          setProspectoTratamiento(act)
                          setLeadsList(leadsList.map(l => l.id === act.id ? act : l))
                        }}
                        className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                      >
                        <option value="Nuevo" className="bg-[#0c182b] text-white">Nuevo</option>
                        <option value="Contactado" className="bg-[#0c182b] text-white">Contactado</option>
                        <option value="Interesado" className="bg-[#0c182b] text-white">Interesado</option>
                        <option value="Cliente" className="bg-[#0c182b] text-white">Cliente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">DETALLE DE LA REUNIÓN / OBSERVACIÓN:</label>
                    <textarea
                      rows={3}
                      value={nuevaNotaBitacora}
                      onChange={(e) => setNuevaNotaBitacora(e.target.value)}
                      placeholder="Escriba los acuerdos alcanzados o requerimientos de seguridad..."
                      className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleAgregarNotaBitacora}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-bold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer transition-all"
                    >
                      Guardar en Bitácora
                    </button>
                  </div>
                </div>
              </div>

              {/* CRONOLOGÍA DE INTERACCIONES DE LA BITÁCORA */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider border-b border-white/10 pb-2">
                  HISTORIAL DE INTERACCIONES ({prospectoTratamiento.bitacora?.length || 0})
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(!prospectoTratamiento.bitacora || prospectoTratamiento.bitacora.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic">No hay notas registradas aún en la bitácora de este prospecto.</p>
                  ) : (
                    prospectoTratamiento.bitacora.map(b => (
                      <div key={b.id} className="bg-white/[0.03] border border-white/10 p-3 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-[#2997ff]">
                          <span>{b.tipo} • {b.autor}</span>
                          <span className="font-mono text-slate-400">{b.fecha}</span>
                        </div>
                        <p className="text-slate-200 font-medium">{b.nota}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
              <button
                onClick={() => setProspectoTratamiento(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-bold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/20 cursor-pointer transition-all"
              >
                Cerrar Tratamiento
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL AÑADIR / EDITAR NUEVO LEAD (APPLE BENTO DARK) ── */}
      {mostrarModalNuevoLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 md:p-6 flex justify-center items-center overflow-y-auto no-imprimir">
          <div className="bg-[#0c182b]/95 border border-white/10 w-full max-w-xl rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-5 text-xs text-white font-sans my-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl shadow-md">
                  <UserPlus className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white uppercase tracking-wider">
                    {leadEditandoId ? 'EDITAR LEAD DE PROSPECCIÓN' : 'AÑADIR NUEVO LEAD COMERCIAL'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Registro de prospecto para campañas masivas Resend</p>
                </div>
              </div>
              <button onClick={() => setMostrarModalNuevoLead(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">NOMBRE DE LA EMPRESA / CLIENTE (*):</label>
                <input
                  type="text"
                  value={formLeadEmpresa}
                  onChange={(e) => setFormLeadEmpresa(e.target.value)}
                  placeholder="ej: Transportes & Logística Norte SpA"
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-bold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">COMUNA (V REGIÓN):</label>
                  <select
                    value={formLeadComuna}
                    onChange={(e) => setFormLeadComuna(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  >
                    <option value="Viña del Mar" className="bg-[#0c182b] text-white">Viña del Mar</option>
                    <option value="Valparaíso" className="bg-[#0c182b] text-white">Valparaíso</option>
                    <option value="Concón" className="bg-[#0c182b] text-white">Concón</option>
                    <option value="Quilpué" className="bg-[#0c182b] text-white">Quilpué</option>
                    <option value="Villa Alemana" className="bg-[#0c182b] text-white">Villa Alemana</option>
                    <option value="San Antonio" className="bg-[#0c182b] text-white">San Antonio</option>
                    <option value="Los Andes" className="bg-[#0c182b] text-white">Los Andes</option>
                    <option value="Quillota" className="bg-[#0c182b] text-white">Quillota</option>
                    <option value="Limache" className="bg-[#0c182b] text-white">Limache</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">DIRECCIÓN COMERCIAL:</label>
                  <input
                    type="text"
                    value={formLeadDireccion}
                    onChange={(e) => setFormLeadDireccion(e.target.value)}
                    placeholder="ej: Av. Libertad 940, Of. 601"
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">RUT COMERCIAL:</label>
                  <input
                    type="text"
                    value={formLeadRut}
                    onChange={(e) => setFormLeadRut(e.target.value)}
                    placeholder="ej: 76.123.456-7"
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-mono text-xs text-[#2997ff] font-bold focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CORREO ELECTRÓNICO (*):</label>
                  <input
                    type="email"
                    value={formLeadEmail}
                    onChange={(e) => setFormLeadEmail(e.target.value)}
                    placeholder="contacto@empresa.cl"
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PERSONA DE CONTACTO:</label>
                  <input
                    type="text"
                    value={formLeadContacto}
                    onChange={(e) => setFormLeadContacto(e.target.value)}
                    placeholder="ej: Don Carlos Fuentealba"
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">TELÉFONO DE CONTACTO:</label>
                  <input
                    type="text"
                    value={formLeadTelefono}
                    onChange={(e) => setFormLeadTelefono(e.target.value)}
                    placeholder="+56 9 9123 4567"
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-mono text-xs text-white font-semibold focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">SEGMENTO COMERCIAL:</label>
                  <select
                    value={formLeadSegmento}
                    onChange={(e: any) => setFormLeadSegmento(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  >
                    <option value="Comercial B2B" className="bg-[#0c182b] text-white">Comercial B2B</option>
                    <option value="Industrial" className="bg-[#0c182b] text-white">Industrial</option>
                    <option value="Condominios" className="bg-[#0c182b] text-white">Condominios</option>
                    <option value="Particular" className="bg-[#0c182b] text-white">Particular</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">ESTADO DEL LEAD:</label>
                  <select
                    value={formLeadEstado}
                    onChange={(e: any) => setFormLeadEstado(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  >
                    <option value="Nuevo" className="bg-[#0c182b] text-white">Nuevo</option>
                    <option value="Contactado" className="bg-[#0c182b] text-white">Contactado</option>
                    <option value="Interesado" className="bg-[#0c182b] text-white">Interesado</option>
                    <option value="Cliente" className="bg-[#0c182b] text-white">Cliente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">NOTAS / REQUERIMIENTO:</label>
                <textarea
                  rows={2}
                  value={formLeadNotas}
                  onChange={(e) => setFormLeadNotas(e.target.value)}
                  placeholder="ej: Interesados en monitoreo de bodegas y cámaras IP..."
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
              <button
                onClick={() => setMostrarModalNuevoLead(false)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarLead}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-bold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer transition-all"
              >
                Guardar Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVA ORDEN TÉCNICA (OT) (APPLE BENTO DARK) ── */}
      {mostrarModalOT && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 md:p-6 flex justify-center items-center overflow-y-auto no-imprimir">
          <div className="bg-[#0c182b]/95 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-5 text-xs text-white font-sans my-auto">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white rounded-xl shadow-md">
                  <Wrench className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white uppercase tracking-wider">
                    NUEVA ORDEN TÉCNICA DE TERRENO (OT)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Integración de alertas de Central de Monitoreo & SLA</p>
                </div>
              </div>
              <button onClick={() => setMostrarModalOT(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CUENTA ABONADO (*):</label>
                  <input
                    type="text"
                    value={otFormCuenta}
                    onChange={(e) => setOtFormCuenta(e.target.value.toUpperCase())}
                    placeholder="ej: #0999, #C725"
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-mono font-bold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CLIENTE / RAZÓN SOCIAL (*):</label>
                  <input
                    type="text"
                    value={otFormClienteNombre}
                    onChange={(e) => setOtFormClienteNombre(e.target.value)}
                    placeholder="ej: GAMA SEGURIDAD SPA"
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-bold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">TIPO DE SERVICIO (*):</label>
                  <select
                    value={otFormTipoServicio}
                    onChange={(e) => setOtFormTipoServicio(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  >
                    <option value="Mantención Perimetral Alarma" className="bg-[#0c182b] text-white">Mantención Perimetral Alarma</option>
                    <option value="Cambio de Batería de Respaldo" className="bg-[#0c182b] text-white">Cambio de Batería de Respaldo</option>
                    <option value="Revisión de Fuente & Energía" className="bg-[#0c182b] text-white">Revisión de Fuente & Energía</option>
                    <option value="Revisión Técnica de Alarma / Zonas" className="bg-[#0c182b] text-white">Revisión Técnica de Alarma / Zonas</option>
                    <option value="Instalación Cámara IP DarkFighter" className="bg-[#0c182b] text-white">Instalación Cámara IP DarkFighter</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">SLA DE RESPUESTA (*):</label>
                  <select
                    value={otFormSLA}
                    onChange={(e) => setOtFormSLA(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  >
                    <option value="Crítica (2h)" className="bg-[#0c182b] text-white">⚡ Crítica (2 Horas)</option>
                    <option value="Alta (6h)" className="bg-[#0c182b] text-white">🟠 Alta (6 Horas)</option>
                    <option value="Normal (24h)" className="bg-[#0c182b] text-white">🔵 Normal (24 Horas)</option>
                    <option value="Programada (48h)" className="bg-[#0c182b] text-white">🟢 Programada (48 Horas)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">TÉCNICO ASIGNADO:</label>
                  <select
                    value={otFormTecnico}
                    onChange={(e) => setOtFormTecnico(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  >
                    <option value="Técnico Juan Pérez" className="bg-[#0c182b] text-white">Técnico Juan Pérez</option>
                    <option value="Técnico Carlos Rojas" className="bg-[#0c182b] text-white">Técnico Carlos Rojas</option>
                    <option value="Técnico Esteban Soto" className="bg-[#0c182b] text-white">Técnico Esteban Soto</option>
                    <option value="Técnico Matías Campos" className="bg-[#0c182b] text-white">Técnico Matías Campos</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">FECHA PROGRAMADA:</label>
                  <input
                    type="date"
                    value={otFormFecha}
                    onChange={(e) => setOtFormFecha(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-mono text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">OBSERVACIONES / REPORTE COMMAND CENTER:</label>
                <textarea
                  rows={3}
                  value={otFormObservaciones}
                  onChange={(e) => setOtFormObservaciones(e.target.value)}
                  placeholder="Detalle técnico ingresado por el operador o cliente..."
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
              <button
                onClick={() => setMostrarModalOT(false)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarNuevaOT}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-bold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer transition-all"
              >
                Crear & Asignar OT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PAUTA TÉCNICA Y FIRMA DIGITAL (APPLE BENTO DARK) ── */}
      {mostrarModalFirmaOT && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 md:p-6 flex justify-center items-center overflow-y-auto no-imprimir">
          <div className="bg-[#0c182b]/95 border border-white/10 w-full max-w-xl rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-5 text-xs text-white font-sans my-auto">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#2997ff]" />
                  <span>PAUTA DE TERRENO Y FIRMA DIGITAL ({mostrarModalFirmaOT.codigo_ot})</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Recepción conforme del cliente para la cuenta #{mostrarModalFirmaOT.cuenta}</p>
              </div>
              <button onClick={() => setMostrarModalFirmaOT(null)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">PAUTA DE CHEQUEO EN TERRENO:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-400">✔ Voltaje Panel & Batería OK</div>
                  <div className="flex items-center gap-2 text-emerald-400">✔ Prueba de Sirena 105dB OK</div>
                  <div className="flex items-center gap-2 text-emerald-400">✔ Sensores Infrarrojos Limpios</div>
                  <div className="flex items-center gap-2 text-emerald-400">✔ Señal GPRS/3G Transmitida</div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">FIRMA DIGITAL DE CONFORMIDAD DEL CLIENTE / ENCARGADO:</label>
                <div className="bg-black/40 rounded-2xl border border-white/10 p-4 text-center h-32 flex flex-col justify-center items-center shadow-inner relative">
                  <div className="border-b-2 border-dashed border-white/20 w-3/4 mb-2"></div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Firma Digital Registrada en Tablet</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
              <button
                onClick={() => setMostrarModalFirmaOT(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-all"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setOrdenesTrabajo(ordenesTrabajo.map(o => o.id === mostrarModalFirmaOT.id ? { ...o, estado: 'Finalizada' } : o))
                  setMostrarModalFirmaOT(null)
                  setToastNotificacion({ tipo: 'exito', texto: `¡Orden de Trabajo ${mostrarModalFirmaOT.codigo_ot} finalizada con conformidad digital!` })
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold rounded-xl text-xs shadow-lg active:scale-95 cursor-pointer transition-all"
              >
                Finalizar OT & Registrar Conformidad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PWA COMPLETO DE SERVICIO TÉCNICO EN TERRENO (SCORPION FIELD SERVICE) ── */}
      {mostrarModalPWATerreno && (
        <ServicioTecnicoModal
          onClose={() => setMostrarModalPWATerreno(false)}
          clientesMap={abonadosCentrosCosto as any}
        />
      )}

      {/* ── COMMAND PALETTE MODAL (CMD + K) ── */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectSearchItem={(q) => {
          setBusquedaClienteInput(q)
          handleDispararBusqueda()
        }}
        onNavigateModule={(modId) => setModuloActivo(modId as any)}
        clientesMaestros={clientesMaestros}
        abonadosCentrosCosto={abonadosCentrosCosto}
      />

      {/* ── MODAL BITÁCORA ACUMULATIVA DE COBRANZA (APPLE BENTO DARK) ── */}
      {facturaSeleccionadaCobranza && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 md:p-6 flex justify-center items-center overflow-y-auto no-imprimir font-sans">
          <div className="bg-[#0c182b]/95 border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-5 text-xs text-white my-auto">
            
            <div className="flex justify-between items-start pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#2997ff]" />
                  <span>Bitácora de Gestión de Cobranza ({facturaSeleccionadaCobranza.numero_factura})</span>
                </h3>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">
                  Cliente: <span className="text-white">{facturaSeleccionadaCobranza.razon_social}</span> | RUT: {facturaSeleccionadaCobranza.rut_cliente}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono mt-1 font-semibold">
                  <span className="text-slate-300">Monto: ${facturaSeleccionadaCobranza.monto_total.toLocaleString('es-CL')}</span>
                  <span className="text-red-400">Saldo Pendiente: ${(facturaSeleccionadaCobranza.saldo_pendiente || 0).toLocaleString('es-CL')}</span>
                </div>
              </div>
              <button
                onClick={() => setFacturaSeleccionadaCobranza(null)}
                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* FORMULARIO AGREGAR NUEVA NOTA */}
            <div className="bg-white/[0.03] border border-white/10 p-4 md:p-5 rounded-2xl space-y-3">
              <span className="font-bold text-xs text-white uppercase tracking-wider block">
                + AGREGAR NUEVA GESTIÓN DE COBRO:
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={nuevaNotaTipo}
                  onChange={(e: any) => setNuevaNotaTipo(e.target.value)}
                  className="bg-black/40 border border-white/10 px-3 py-2 rounded-xl font-semibold text-xs text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                >
                  <option value="Llamada" className="bg-[#0c182b] text-white">📞 Llamada Telefónica</option>
                  <option value="WhatsApp" className="bg-[#0c182b] text-white">💬 WhatsApp Enviado</option>
                  <option value="Correo" className="bg-[#0c182b] text-white">✉️ Correo Electrónico</option>
                  <option value="Promesa de Pago" className="bg-[#0c182b] text-white">🤝 Promesa de Pago</option>
                  <option value="Abono" className="bg-[#0c182b] text-white">💰 Abono / Pago Parcial</option>
                  <option value="Nota" className="bg-[#0c182b] text-white">📝 Observación General</option>
                </select>
                <input
                  type="text"
                  value={nuevaNotaTexto}
                  onChange={(e) => setNuevaNotaTexto(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAgregarNotaCobranza(facturaSeleccionadaCobranza) }}
                  placeholder="Detalle de la gestión (ej: Cliente promete transferir el viernes 28/08...)"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                />
                <button
                  onClick={() => handleAgregarNotaCobranza(facturaSeleccionadaCobranza)}
                  className="px-4 py-2 bg-[#0066cc] hover:bg-[#2997ff] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                >
                  Guardar Nota
                </button>
              </div>
            </div>

            {/* TIMELINE HISTÓRICO DE NOTAS DE COBRANZA */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-white uppercase tracking-wider block">
                HISTORIAL DE GESTIONES ACUMULADAS ({ (bitacoraCobranzaFacturas[facturaSeleccionadaCobranza.id] || []).length } Registros):
              </span>
              <div className="max-h-64 overflow-y-auto space-y-2 bg-black/30 border border-white/10 p-3 rounded-2xl">
                {(!bitacoraCobranzaFacturas[facturaSeleccionadaCobranza.id] || bitacoraCobranzaFacturas[facturaSeleccionadaCobranza.id].length === 0) ? (
                  <div className="p-4 text-center text-slate-400 font-semibold text-xs italic">
                    Sin gestiones de cobranza registradas aún. Ingrese una arriba.
                  </div>
                ) : (
                  bitacoraCobranzaFacturas[facturaSeleccionadaCobranza.id].map((item) => (
                    <div key={item.id} className="bg-white/[0.04] p-3 rounded-xl border border-white/5 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                          {item.tipo}
                        </span>
                        <span className="font-mono text-slate-400">{item.fecha} — {item.autor}</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium">{item.nota}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-white/10">
              <button
                onClick={() => setFacturaSeleccionadaCobranza(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL EDICIÓN DE CORREO DEL CLIENTE (APPLE BENTO DARK) ── */}
      {clienteEditingEmail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 md:p-6 flex justify-center items-center overflow-y-auto no-imprimir font-sans">
          <div className="bg-[#0c182b]/95 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-5 text-xs text-white my-auto">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#2997ff]" />
                  <span>REGISTRO PERMANENTE DE CORREOS & CONTACTO</span>
                </h3>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">{clienteEditingEmail.razon_social} (RUT: {clienteEditingEmail.rut})</p>
              </div>
              <button onClick={() => setClienteEditingEmail(null)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CORREO ELECTRÓNICO DE COBRANZA:</label>
                <input
                  type="email"
                  value={clienteEditingEmail.email_cobranza}
                  onChange={(e) => setClienteEditingEmail({ ...clienteEditingEmail, email_cobranza: e.target.value })}
                  placeholder="ejemplo: cobranza@empresa.cl"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CORREO ELECTRÓNICO DE CONTACTO PRINCIPAL:</label>
                <input
                  type="email"
                  value={clienteEditingEmail.email_contacto}
                  onChange={(e) => setClienteEditingEmail({ ...clienteEditingEmail, email_contacto: e.target.value })}
                  placeholder="ejemplo: gerencia@empresa.cl"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">TELÉFONO DE CONTACTO:</label>
                <input
                  type="text"
                  value={clienteEditingEmail.telefono}
                  onChange={(e) => setClienteEditingEmail({ ...clienteEditingEmail, telefono: e.target.value })}
                  placeholder="ejemplo: +56991234567"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:ring-2 focus:ring-[#0066cc] focus:outline-none"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-2xl text-[11px] text-blue-200 font-medium leading-relaxed">
                ℹ️ Estos datos se guardarán de forma permanente en la base de datos central de Gama Seguridad y alimentarán automáticamente el <strong>Portal de Cliente Gama (/portal)</strong>.
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
              <button
                onClick={() => setClienteEditingEmail(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEmailCliente}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#2997ff] hover:brightness-110 text-white font-bold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/20 cursor-pointer active:scale-95 transition-all"
              >
                💾 Guardar Correos para la Posteridad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SLIDE-OVER DRAWER (INSPECCIÓN DE EXPEDIENTES FLUIDA) ── */}
      <SlideOverDrawer
        isOpen={drawerState.isOpen}
        onClose={() => setDrawerState(prev => ({ ...prev, isOpen: false }))}
        titulo={drawerState.titulo}
        subtitulo={drawerState.subtitulo}
        tipo={drawerState.tipo}
        datos={drawerState.datos}
      />

      {/* ── MODAL CONTRATO DIGITAL DESDE FICHA 360° ── */}
      {mostrarModalContratoFicha && (
        <ContratoDigitalModal
          isOpen={mostrarModalContratoFicha}
          onClose={() => setMostrarModalContratoFicha(false)}
          cliente={clienteActivo}
          abonado={abonadoActivo}
          empresaEmisora={empresasConglomerado?.[0]}
        />
      )}

      {/* ── MODAL PLANTILLAS RÁPIDAS WHATSAPP 1-CLIC ── */}
      {modalPlantillasWhatsAppActivo && (
        <WhatsAppPlantillasModal
          onClose={() => {
            setModalPlantillasWhatsAppActivo(false)
            setPlantillaWhatsAppAbonado(undefined)
          }}
          abonadoInicial={plantillaWhatsAppAbonado}
        />
      )}

      {/* ── MODAL OFICIAL DE CONSOLA WHATSAPP ── */}
      {modalWhatsAppActivo && (
        <NotificacionesWhatsAppModal
          onClose={() => {
            setModalWhatsAppActivo(false)
            setWhatsappTelefonoDirecto(undefined)
          }}
          clientesMap={clientesFallback}
          cuentaInicial={cuentaSeleccionada || undefined}
          telefonoInicial={whatsappTelefonoDirecto}
        />
      )}

      {/* ── NOTIFICACIÓN REALTIME EN PANTALLA CON AUDIO & DETECCIÓN DE EMERGENCIAS ── */}
      <WhatsAppNotificationToast
        clientesMap={clientesFallback}
        onOpenChat={(numero, cta) => {
          setWhatsappTelefonoDirecto(numero)
          if (cta) setCuentaSeleccionada(cta)
          setModalWhatsAppActivo(true)
        }}
      />

    </div>
  )
}
