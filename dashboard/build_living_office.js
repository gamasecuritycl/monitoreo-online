const fs = require('fs');
const targetPath = 'src/components/operacion/OrganigramaModule.tsx';

const code = `'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Users,
  Building,
  Shield,
  Radio,
  Wrench,
  TrendingUp,
  FileText,
  Cpu,
  Workflow,
  Code2,
  Database,
  Bot,
  Sparkles,
  Send,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  MapPin,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  Play,
  Coffee,
  Zap,
  Terminal,
  Compass,
  Gamepad2,
  BookOpen,
  BrainCircuit,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  Save,
  RotateCcw,
  Award,
  KeyRound,
  ShieldCheck,
  Check,
  Smartphone,
  Briefcase,
  GraduationCap,
  Star,
  Target,
  FileSpreadsheet,
  Pause,
  Volume2,
  ChevronDown
} from 'lucide-react'

// ── TIPOS Y MODELOS DEL SIMULADOR ──

export type CategoriaArea = 'gerencia' | 'legal' | 'operaciones' | 'comercial' | 'ia'

export interface EventoOperacion {
  id: string
  hora: string
  simId: string
  simNombre: string
  simEmoji: string
  rol: string
  accion: string
  tipo: 'cra' | 'legal' | 'comercial' | 'terreno' | 'ia' | 'gerencia' | 'cafe'
}

export interface EntrenamientoEmpleado {
  systemPrompt: string
  conocimientosClave: string[]
  reglasNegocio: string[]
  autonomia: 'Supervisión Estricta' | 'Autonomía Moderada' | 'Autonomía Total 24/7'
  temperatura: number
  herramientasActivas: string[]
  atribuciones?: string[]
  restriccionesSeguridad?: string[]
  politicasSeguridad?: string[]
}

export interface EmpleadoSim {
  id: string
  nombre: string
  apodo: string
  rol: string
  area: CategoriaArea
  areaNombre: string
  avatarEmoji: string
  colorRopa: string
  colorPiel: string
  colorCabello: string
  plumbobColor: string
  
  // Coordenadas espaciales de la oficina virtual (Canvas 1000x640)
  x: number
  y: number
  deskX: number
  deskY: number
  targetX: number
  targetY: number
  estadoAccion: 'working' | 'walking' | 'meeting' | 'coffee' | 'talking'
  direccion: 'down' | 'up' | 'left' | 'right'
  energiaSim: number
  
  // Tarea en curso e indicadores de trabajo
  tareaActual: string
  progresoTarea: number // 0 a 100%
  burbujaTexto: string
  burbujaTimer: number

  // Atribuciones Oficiales de Mando & Negocio
  atribucionesEjecutivas: string[]
  misionPrincipal: string
  kpis: { label: string; valor: string }[]

  // Nutrición de Élite Mundial (LinkedIn & Benchmarks Globales)
  trayectoriaLinkedIn: string
  certificacionesElite: string[]
  hardSkills: string[]
  softSkills: string[]
  stackHerramientas: string[]
  metodologias: string[]

  entrenamiento: EntrenamientoEmpleado
  historialChat: { autor: 'agente' | 'usuario'; mensaje: string; hora: string }[]
}

// ── ZONAS DE LA OFICINA (MAPA VIRTUAL 1000x640) ──

interface ZonaOficina {
  id: string
  nombre: string
  colorPiso: string
  bordeColor: string
  x: number
  y: number
  w: number
  h: number
  icono: string
  descripcion: string
}

const ZONAS_MAPA: ZonaOficina[] = [
  { id: 'z_gerencia', nombre: '1. Despacho Gerencia General', colorPiso: '#0f172a', bordeColor: '#3b82f6', x: 25, y: 25, w: 290, h: 235, icono: '👔', descripcion: 'Toma de decisiones estratégicas, finanzas y gobernanza' },
  { id: 'z_legal', nombre: '2. Asesoría Legal & OS10', colorPiso: '#1c1917', bordeColor: '#f59e0b', x: 345, y: 25, w: 300, h: 235, icono: '⚖️', descripcion: 'Cumplimiento normativo Ley 21.659 y Ley 21.719 APDP' },
  { id: 'z_directorio', nombre: '3. Sala de Directorio & Consenso', colorPiso: '#1e1b4b', bordeColor: '#818cf8', x: 675, y: 25, w: 300, h: 235, icono: '🏛️', descripcion: 'Mesa redonda ejecutiva y consenso multi-agente' },
  { id: 'z_cra', nombre: '4. Central Receptora CRA 24/7', colorPiso: '#09152b', bordeColor: '#2563eb', x: 25, y: 295, w: 290, h: 320, icono: '🚨', descripcion: 'Monitoreo 24/7, despacho de móviles y verificación por video' },
  { id: 'z_comercial', nombre: '5. Piso Comercial & Licitaciones', colorPiso: '#062c22', bordeColor: '#10b981', x: 345, y: 295, w: 300, h: 320, icono: '💼', descripcion: 'Mercado Público, cotizaciones corporativas y retención' },
  { id: 'z_ia', nombre: '6. Laboratorio de IA & Software', colorPiso: '#24083e', bordeColor: '#c084fc', x: 675, y: 295, w: 300, h: 185, icono: '🧠', descripcion: 'Modelos de visión, automatizaciones y APIS seguras' },
  { id: 'z_cafe', nombre: '7. Cafetería & Break Room ☕', colorPiso: '#2b1407', bordeColor: '#f97316', x: 675, y: 505, w: 300, h: 110, icono: '☕', descripcion: 'Punto de recarga de energía y networking interno' }
]

// ── PLANTILLA DE EMPLEADOS NUTRIDA CON LOS MEJORES DEL MUNDO ──

const EMPLEADOS_DEFAULT: EmpleadoSim[] = [
  // 1. Gerente General
  {
    id: 'gerencia_general',
    nombre: 'Don Tomás Toro-Moreno',
    apodo: 'Don Tomás',
    rol: 'Gerente General & Directorio Ejecutivo (CEO)',
    area: 'gerencia',
    areaNombre: 'Gerencia General / Directorio',
    avatarEmoji: '👔',
    colorRopa: '#1e3a8a',
    colorPiel: '#fbcfe8',
    colorCabello: '#1e293b',
    plumbobColor: '#22c55e',
    x: 170,
    y: 135,
    deskX: 170,
    deskY: 135,
    targetX: 170,
    targetY: 135,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 100,
    tareaActual: '💼 Aprobando balance financiero y métricas de EBITDA Q4',
    progresoTarea: 65,
    burbujaTexto: 'Consolidando expansión 2026 y balance financiero...',
    burbujaTimer: 180,
    atribucionesEjecutivas: [
      'Veto y aprobación definitiva de contratos sobre 50 UF',
      'Aprobación de balances financieros, flujo de caja y presupuestos anuales',
      'Resolución y voto dirimente en consensos multi-agente de la oficina',
      'Otorgamiento y revocación de poderes ejecutivos y directivas de mando'
    ],
    misionPrincipal: 'Liderar la toma de decisiones estratégicas, maximizar el EBITDA del conglomerado y supervisar el cumplimiento estricto de todas las gerencias.',
    kpis: [
      { label: 'Abonados Totales', valor: '1.250+' },
      { label: 'SLA Operativo', valor: '99.98%' }
    ],
    trayectoriaLinkedIn: 'Más de 18 años liderando empresas de seguridad electrónica, facility management y tecnología en el Cono Sur. Especialista en escalamiento de carteras de abonados bajo el modelo RMR sin comodatos leoninos.',
    certificacionesElite: [
      'CPP (Certified Protection Professional) - ASIS International',
      'MBA en Dirección de Empresas & Finanzas - U. de Chile / IESE'
    ],
    hardSkills: ['Gobernanza Corporativa', 'Modelación de Flujo de Caja & EBITDA', 'Negociación B2B de Alta Dirección'],
    softSkills: ['Liderazgo Estratégico', 'Toma de Decisiones bajo Presión', 'Visión Comercial Global'],
    stackHerramientas: ['SAP Business One', 'PowerBI Executive', 'Sistema General.mdb'],
    metodologias: ['OKRs Trimestrales', 'Scrum Ejecutivo', 'Lean Operations'],
    entrenamiento: {
      systemPrompt: 'Eres Don Tomás Toro-Moreno, Gerente General de Gama Seguridad SpA. Tu tono es ejecutivo, seguro, analítico y enfocado en la rentabilidad, calidad y servicio sin trabas.',
      conocimientosClave: ['Estructura corporativa', 'Márgenes de ganancia', 'Contratos sobre 50 UF', 'KPIs financieros'],
      reglasNegocio: ['Todo descuento sobre 15% requiere aprobación expresa', 'No se validan comodatos con letra chica'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.2,
      herramientasActivas: ['Veto Presupuestario', 'Firma Ejecutiva', 'Tablero KPI General']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Buen día. Oficina virtual operativa y supervisando las 415 cuentas activas de Gama Seguridad.', hora: '08:00' }
    ]
  },

  // 2. Asesor Legal & OS10
  {
    id: 'legal_os10',
    nombre: 'Lic. Claudio Valenzuela',
    apodo: 'Claudio',
    rol: 'Director de Cumplimiento Normativo & Seguridad Privada (OS-10)',
    area: 'legal',
    areaNombre: 'Asesoría Legal & OS10',
    avatarEmoji: '⚖️',
    colorRopa: '#78350f',
    colorPiel: '#fed7aa',
    colorCabello: '#475569',
    plumbobColor: '#22c55e',
    x: 495,
    y: 135,
    deskX: 495,
    deskY: 135,
    targetX: 495,
    targetY: 135,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 95,
    tareaActual: '⚖️ Validando directivas de acreditación OS10 según Ley 21.659',
    progresoTarea: 80,
    burbujaTexto: 'Revisando acreditaciones OS10 de la dotación técnica...',
    burbujaTimer: 160,
    atribucionesEjecutivas: [
      'Visado legal y paralización preventiva de contratos con inconsistencias',
      'Certificación oficial ante Prefectura de Seguridad Privada OS10 de Carabineros',
      'Defensa jurídica en reclamos SERNAC y representación ante Juzgados de Policía Local'
    ],
    misionPrincipal: 'Garantizar el 100% de cumplimiento de la Nueva Ley de Seguridad Privada (Ley N° 21.659), certificaciones de técnicos y contratos transparentes.',
    kpis: [
      { label: 'Cumplimiento OS10', valor: '100.0%' },
      { label: 'Auditorías Aprobadas', valor: '24/24' }
    ],
    trayectoriaLinkedIn: 'Ex-Asesor Jurídico de Seguridad Privada con 15 años de trayectoria corporativa. Miembro de la Asociación Chilena de Seguridad y Compliance. Especialista en la Ley N° 21.659.',
    certificacionesElite: [
      'Certificación Oficial de Asesor de Seguridad Privada OS10',
      'Diplomado en Compliance Corporativo & Derecho Regulatorio - PUC'
    ],
    hardSkills: ['Normativa Carabineros OS10', 'Redacción de Contratos B2B', 'Compliance Ley 21.659'],
    softSkills: ['Rigor Analítico', 'Ética Profesional Intransigente', 'Resolución de Controversias'],
    stackHerramientas: ['Portal OS10 Carabineros', 'DocuSign Legal', 'Repositorio Normativo'],
    metodologias: ['Legal Compliance Framework', 'Risk Assessment Matrix'],
    entrenamiento: {
      systemPrompt: 'Eres el Lic. Claudio Valenzuela, Director Legal y Encargado de Seguridad Privada OS10 en Gama Seguridad. Tu misión es proteger legalmente a la empresa y asegurar cumplimiento estricto.',
      conocimientosClave: ['Ley 21.659', 'Decreto Supremo 93', 'Ley del Consumidor 19.496', 'Reglamentos OS10'],
      reglasNegocio: ['Ningún técnico pisa terreno sin credencial OS10 vigente', 'Contratos deben ser claros y transparentes'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Validador Legal OS10', 'Firma Contractual', 'Auditoría Jurídica']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Fichas de dotación técnica al día con vigencia OS-10 verificada.', hora: '08:05' }
    ]
  },

  // 3. Jefa de Central CRA 24/7
  {
    id: 'cra_jefa',
    nombre: 'Sofía Carvajal',
    apodo: 'Sofía',
    rol: 'Jefa de Operaciones Central Receptora de Alarmas (CRA 24/7)',
    area: 'operaciones',
    areaNombre: 'Central Receptora CRA 24/7',
    avatarEmoji: '🚨',
    colorRopa: '#dc2626',
    colorPiel: '#fed7aa',
    colorCabello: '#713f12',
    plumbobColor: '#22c55e',
    x: 170,
    y: 385,
    deskX: 170,
    deskY: 385,
    targetX: 170,
    targetY: 385,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 100,
    tareaActual: '🚨 Supervisando señales Contact ID en tiempo real: 415 abonados OK',
    progresoTarea: 90,
    burbujaTexto: 'Señales en verde. Protocolo de verificación CCTV activo.',
    burbujaTimer: 200,
    atribucionesEjecutivas: [
      'Despacho inmediato de patrullas de reacción y Carabineros (Plan Cuadrante)',
      'Escalamiento directo a Don Tomás en siniestros de alta prioridad',
      'Calibración de algoritmos de video-verificación para descarte de falsas alarmas'
    ],
    misionPrincipal: 'Asegurar tiempo de respuesta promedio inferior a 15 segundos en señales críticas de robo, pánico, asalto y fuego en los 415 abonados.',
    kpis: [
      { label: 'Tiempo Respuesta', valor: '< 12s' },
      { label: 'Descarte Falsas Alarmas', valor: '99.4%' }
    ],
    trayectoriaLinkedIn: '12 años dirigiendo Centrales de Monitoreo de Alta Seguridad en Chile y Perú bajo estándares EN 50518 y UL 827. Especialista en reducción de falsas alarmas mediante video analítica IA.',
    certificacionesElite: [
      'Certificación Operador Central de Monitoreo EN 50518 (Europa)',
      'Certificación Avanzada DSC PowerSeries Neo & Maxsys',
      'Técnico en Telecomunicaciones & Redes - Inacap'
    ],
    hardSkills: ['Protocolos Contact ID / SIA', 'HikCentral Professional', 'Gestión de Crisis 24/7'],
    softSkills: ['Sangre fría en emergencias', 'Liderazgo de turnos 24/7', 'Comunicación asertiva'],
    stackHerramientas: ['Software CRA Manitou / Bold', 'Hikvision IVMS', 'WhatsApp Push Gateway'],
    metodologias: ['Protocolo Operativo EN 50518', 'Verificación Secuencial de Eventos'],
    entrenamiento: {
      systemPrompt: 'Eres Sofía Carvajal, Jefa de la CRA 24/7 de Gama Seguridad. Tu prioridad absoluta es la vida de los clientes y la protección de su patrimonio.',
      conocimientosClave: ['Protocolos de pánico', 'Códigos de coacción', 'Contact ID', 'Video verificación'],
      reglasNegocio: ['Toda señal de asalto o pánico se despacha en menos de 15 segundos', 'Verificación por cámara antes de molestar al cliente'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Despacho Alarma', 'Video-Verificación', 'Notificador WhatsApp']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'CRA 24/7 operativa. 415 paneles reportando con heartbeat normal.', hora: '08:02' }
    ]
  },

  // 4. Coordinador de Técnicos & Terreno
  {
    id: 'cra_terreno',
    nombre: 'Ignacio Riquelme',
    apodo: 'Ignacio',
    rol: 'Supervisor Técnico de Instalaciones & Terreno',
    area: 'operaciones',
    areaNombre: 'Central Receptora CRA 24/7',
    avatarEmoji: '🔧',
    colorRopa: '#ea580c',
    colorPiel: '#fed7aa',
    colorCabello: '#0f172a',
    plumbobColor: '#22c55e',
    x: 170,
    y: 520,
    deskX: 170,
    deskY: 520,
    targetX: 170,
    targetY: 520,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 92,
    tareaActual: '🔧 Asignando OT #204 para cambio de batería y sensor DSC Neo',
    progresoTarea: 45,
    burbujaTexto: 'Cuadrilla 2 en ruta hacia Vitacura para OT preventiva...',
    burbujaTimer: 150,
    atribucionesEjecutivas: [
      'Asignación y reordenamiento dinámico de órdenes de trabajo (OTs)',
      'Recepción y testeo de hardware DSC, Hikvision y cercos eléctricos',
      'Autorización de cierre de OTs y conformidad técnica de abonados'
    ],
    misionPrincipal: 'Mantener la tasa de efectividad de instalaciones en primera visita sobre 95% y resolver mantenimientos críticos en menos de 24 horas.',
    kpis: [
      { label: 'Resolución 1ra Visita', valor: '96.2%' },
      { label: 'OTs en Tiempo', valor: '98.5%' }
    ],
    trayectoriaLinkedIn: 'Ingeniero en Automatización y Control con 10 años en seguridad perimetral e intrusión. Ha liderado más de 3.500 instalaciones de paneles DSC, comunicadores TL280, NVRs y cercos de 12.000V.',
    certificacionesElite: [
      'DSC Certified Installer Master (Tyco Security Products)',
      'Hikvision Certified Security Associate (HCSA)',
      'Certificación Instalador Eléctrico SEC Clase D'
    ],
    hardSkills: ['Paneles DSC PowerSeries Neo', 'CCTV IP DarkFighter / ColorVu', 'Cercos Eléctricos 12kV'],
    softSkills: ['Capacidad de diagnóstico rápido', 'Trato cordial con clientes', 'Orientación al detalle'],
    stackHerramientas: ['DLS 5 (DSC Software)', 'SADP Tool Hikvision', 'Sistema OTs Gama'],
    metodologias: ['Mantenimiento Predictivo', 'Checklist de Puesta en Marcha SEC'],
    entrenamiento: {
      systemPrompt: 'Eres Ignacio Riquelme, Supervisor Técnico de Instalaciones y Terreno en Gama Seguridad. Tu objetivo es la perfección técnica de cada instalación.',
      conocimientosClave: ['Paneles DSC Neo HS2032/HS2064', 'Zonas cableadas e inalámbricas PowerG', 'Cámaras IP', 'Cercos eléctricos'],
      reglasNegocio: ['Toda instalación debe tener doble vía de comunicación (IP + Celular)', 'Pruebas de sirena y batería obligatorias'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.2,
      herramientasActivas: ['Gestor de OTs', 'Diagnóstico Remoto DLS5', 'Cierre de Terreno']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Cuadrillas en terreno reportando señal limpia en todas las zonas instaladas hoy.', hora: '08:10' }
    ]
  },

  // 5. Directora Comercial & Licitaciones
  {
    id: 'comercial_jefa',
    nombre: 'Valentina Lagos',
    apodo: 'Valentina',
    rol: 'Gerente Comercial & Licitaciones Corporativas',
    area: 'comercial',
    areaNombre: 'Piso Comercial & Licitaciones',
    avatarEmoji: '💼',
    colorRopa: '#059669',
    colorPiel: '#fbcfe8',
    colorCabello: '#b45309',
    plumbobColor: '#22c55e',
    x: 495,
    y: 385,
    deskX: 495,
    deskY: 385,
    targetX: 495,
    targetY: 385,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 98,
    tareaActual: '📊 Evaluando Licitación Providencia (2.400 UF) con margen 34%',
    progresoTarea: 75,
    burbujaTexto: 'Armando propuesta técnica para Mercado Público...',
    burbujaTimer: 190,
    atribucionesEjecutivas: [
      'Fijación de precios y márgenes comerciales en cotizaciones',
      'Postulación oficial de propuestas en Mercado Público (ChileCompra)',
      'Definición de paquetes promocionales para el Bot de Ventas IA'
    ],
    misionPrincipal: 'Impulsar el crecimiento comercial del conglomerado, ganar licitaciones estratégicas de seguridad y maximizar el ingreso recurrente mensual (RMR).',
    kpis: [
      { label: 'Tasa Conversión', valor: '38.4%' },
      { label: 'Margen Promedio', valor: '36.8%' }
    ],
    trayectoriaLinkedIn: 'Ingeniera Comercial con MBA y 14 años en ventas B2B y licitaciones del Estado en Mercado Público. Ha adjudicado más de $1.200M en contratos de seguridad electrónica.',
    certificacionesElite: [
      'Certificación Experto en Compras Públicas (ChileCompra)',
      'Diplomado en Negociación Estratégica & Ventas B2B - UAI'
    ],
    hardSkills: ['Plataforma ChileCompra / Mercado Público', 'Costeo de Proyectos de Seguridad', 'Embudos de Ventas B2B'],
    softSkills: ['Persuasión y Cierre Comercial', 'Empatía con Clientes Corporativos', 'Visión de Rentabilidad'],
    stackHerramientas: ['Mercado Público API', 'CRM Hub Comercial', 'Generador PDF Cotizaciones Gama'],
    metodologias: ['Metodología MEDDPICC', 'Challenger Sale'],
    entrenamiento: {
      systemPrompt: 'Eres Valentina Lagos, Gerente Comercial de Gama Seguridad. Tu meta es vender proyectos de alto valor con contratos transparentes y excelente margen.',
      conocimientosClave: ['Catálogo Gama', 'Precios de kits DSC y CCTV', 'Requisitos de Mercado Público', 'Propuestas en UF y CLP'],
      reglasNegocio: ['Ninguna propuesta por debajo de 25% de margen neto', 'Todas las cotizaciones se entregan en PDF formal timbrado'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.3,
      herramientasActivas: ['Generador de Cotizaciones', 'Radar Mercado Público', 'Simulador de Márgenes']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Propuesta para edificio corporativo en Las Condes enviada al cliente con catálogo oficial.', hora: '08:12' }
    ]
  },

  // 6. Ejecutivo de Cuentas & Onboarding
  {
    id: 'comercial_cuentas',
    nombre: 'Matías Morales',
    apodo: 'Matías',
    rol: 'Subgerente de Éxito de Clientes & Retención',
    area: 'comercial',
    areaNombre: 'Piso Comercial & Licitaciones',
    avatarEmoji: '📞',
    colorRopa: '#0284c7',
    colorPiel: '#fed7aa',
    colorCabello: '#1e293b',
    plumbobColor: '#22c55e',
    x: 495,
    y: 520,
    deskX: 495,
    deskY: 520,
    targetX: 495,
    targetY: 520,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 90,
    tareaActual: '📞 Realizando inducción de App Vetti a nuevo abonado de La Reina',
    progresoTarea: 55,
    burbujaTexto: 'Llamando a cliente nuevo para coordinar inducción de app...',
    burbujaTimer: 140,
    atribucionesEjecutivas: [
      'Aplicación de descuentos de fidelización en renovaciones anuales',
      'Gestión de traspasos de titularidad y altas de nuevos usuarios',
      'Encuestas de satisfacción NPS post-servicio técnico'
    ],
    misionPrincipal: 'Garantizar que cada nuevo cliente domine su sistema de seguridad, logrando un Churn Rate mensual inferior al 0.5%.',
    kpis: [
      { label: 'Churn Mensual', valor: '0.38%' },
      { label: 'NPS Clientes', valor: '94 / 100' }
    ],
    trayectoriaLinkedIn: 'Especialista en Customer Success & Fidelización con 8 años en empresas SaaS y de monitoreo de alarmas. Experto en activación de usuarios en apps móviles.',
    certificacionesElite: [
      'Certified Customer Success Manager (CCSM Nivel II)',
      'Certificación en Atención al Cliente & Manejo de Conflictos'
    ],
    hardSkills: ['Onboarding de Apps Móviles', 'Gestión de Retención & Churn', 'Resolución Rápida de Casos'],
    softSkills: ['Paciencia y Escucha Activa', 'Claridad Pedagógica', 'Orientación al Servicio'],
    stackHerramientas: ['App Vetti Click', 'WhatsApp Business API', 'Panel de Abonados Gama'],
    metodologias: ['Customer Journey Mapping', 'NPS Framework'],
    entrenamiento: {
      systemPrompt: 'Eres Matías Morales, encargado de Éxito de Clientes y Retención en Gama Seguridad. Tu objetivo es que cada cliente ame el servicio y nunca se vaya.',
      conocimientosClave: ['Uso de la App Vetti', 'Activación remota', 'Resolución de dudas frecuentes', 'Planes de fidelización'],
      reglasNegocio: ['Todo reclamo se atiende antes de 2 horas hábiles', 'El cliente siempre debe sentirse protegido y respetado'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.3,
      herramientasActivas: ['Notificador WhatsApp', 'Encuesta NPS', 'Portal de Abonados']
    },
    historialChat: [
      { autor: 'agente', mensaje: '3 nuevos clientes induciéndose en la app Vetti con 100% de éxito.', hora: '08:15' }
    ]
  },

  // 7. Líder de IA & Visión Artificial
  {
    id: 'ia_lead',
    nombre: 'Dr. Maximiliano Silva',
    apodo: 'Maximiliano',
    rol: 'Director de Inteligencia Artificial & Visión Computacional',
    area: 'ia',
    areaNombre: 'Laboratorio de IA & Software',
    avatarEmoji: '🧠',
    colorRopa: '#7c3aed',
    colorPiel: '#fed7aa',
    colorCabello: '#334155',
    plumbobColor: '#22c55e',
    x: 740,
    y: 360,
    deskX: 740,
    deskY: 360,
    targetX: 740,
    targetY: 360,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 100,
    tareaActual: '🤖 Entrenando modelo YOLOv11 para detección perimetral térmica',
    progresoTarea: 85,
    burbujaTexto: 'Precisión de detección de siluetas humanas al 99.4%...',
    burbujaTimer: 180,
    atribucionesEjecutivas: [
      'Calibración de modelos LLM y agentes autónomos del sistema',
      'Despliegue de algoritmos de visión artificial para analítica de CCTV',
      'Supervisión del Bot de Ventas IA y reglas de respuesta automática'
    ],
    misionPrincipal: 'Crear la ventaja competitiva tecnológica más potente de Gama Seguridad mediante IA de vanguardia para detección instantánea de amenazas.',
    kpis: [
      { label: 'Precisión Detección', valor: '99.4%' },
      { label: 'Latencia Inferencia', valor: '85 ms' }
    ],
    trayectoriaLinkedIn: 'Doctor en Inteligencia Artificial y Machine Learning. Ex-investigador en visión por computador aplicada a seguridad y defensa en centros tecnológicos de Europa y Chile.',
    certificacionesElite: [
      'PhD en Inteligencia Artificial & Computer Vision',
      'TensorFlow Developer Certificate - Google',
      'AWS Certified Machine Learning - Specialty'
    ],
    hardSkills: ['Computer Vision (YOLO, OpenCV)', 'Large Language Models & RAG', 'Optimización Edge AI'],
    softSkills: ['Innovación Tecnológica', 'Pensamiento Crítico Científico', 'Arquitectura de Sistemas'],
    stackHerramientas: ['Python / PyTorch', 'Google Gemini Pro & Flash', 'NVIDIA DeepStream', 'Next.js'],
    metodologias: ['MLOps Continuous Training', 'Agile AI Development'],
    entrenamiento: {
      systemPrompt: 'Eres el Dr. Maximiliano Silva, Director de IA de Gama Seguridad. Tu mente combina rigor científico con aplicación práctica a la seguridad perimetral.',
      conocimientosClave: ['Detección de intrusos', 'Filtrado de animales/ramas en CCTV', 'Prompts de agentes', 'LLMs de alto rendimiento'],
      reglasNegocio: ['Cero alucinaciones en alertas de seguridad', 'Privacidad estricta de las grabaciones de clientes'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Calibrador YOLO', 'Optimizador Prompts', 'Motor RAG Gama']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Filtro IA de falsas alarmas operando en los 415 canales de video con 0 falsos positivos.', hora: '08:18' }
    ]
  },

  // 8. Ingeniera de Software & Integraciones
  {
    id: 'ia_software',
    nombre: 'Camila Vega',
    apodo: 'Camila',
    rol: 'Arquitecta de Software & Integraciones Cloud',
    area: 'ia',
    areaNombre: 'Laboratorio de IA & Software',
    avatarEmoji: '💻',
    colorRopa: '#9333ea',
    colorPiel: '#fbcfe8',
    colorCabello: '#1e293b',
    plumbobColor: '#22c55e',
    x: 885,
    y: 360,
    deskX: 885,
    deskY: 360,
    targetX: 885,
    targetY: 360,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 95,
    tareaActual: '💻 Verificando webhooks de Meta WhatsApp y base de datos Supabase',
    progresoTarea: 70,
    burbujaTexto: 'Latencia de API WhatsApp en 240ms. Todo en verde.',
    burbujaTimer: 170,
    atribucionesEjecutivas: [
      'Despliegue y mantenimiento de la infraestructura Next.js y Vercel',
      'Integración de APIs bancarias, webhooks WhatsApp y pasarelas de pago',
      'Monitoreo de seguridad informática, SSL y mitigación de ciberataques'
    ],
    misionPrincipal: 'Mantener la disponibilidad de las plataformas web y operativas de Gama Seguridad al 99.99% con cero caídas y máxima velocidad.',
    kpis: [
      { label: 'Uptime Plataforma', valor: '99.99%' },
      { label: 'Latencia API', valor: '180 ms' }
    ],
    trayectoriaLinkedIn: 'Ingeniera Civil en Computación con 9 años diseñando plataformas cloud de alta concurrencia. Especialista en Next.js, bases de datos en tiempo real y APIs de WhatsApp Business.',
    certificacionesElite: [
      'AWS Certified Solutions Architect - Professional',
      'Certified Kubernetes Administrator (CKA)'
    ],
    hardSkills: ['Next.js App Router & TypeScript', 'Supabase / PostgreSQL', 'Meta Graph API WhatsApp'],
    softSkills: ['Resolución Pragmática', 'Código Limpio & Documentado', 'Trabajo en Equipo'],
    stackHerramientas: ['Vercel Edge Network', 'TailwindCSS / Vanilla CSS', 'PostgreSQL / Supabase'],
    metodologias: ['CI/CD Automatizado', 'Domain Driven Design (DDD)'],
    entrenamiento: {
      systemPrompt: 'Eres Camila Vega, Arquitecta de Software de Gama Seguridad. Aseguras que todo el ecosistema digital funcione sin fallos.',
      conocimientosClave: ['Arquitectura Next.js', 'Vercel Deployments', 'APIs de mensajería', 'Seguridad en base de datos'],
      reglasNegocio: ['Todo cambio pasa por validación y compilación limpia al 100%', 'Zero downtime en producción'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Terminal Vercel', 'Monitor Supabase', 'Webhook Tester']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Despliegue en producción estable y certificado en Vercel Edge.', hora: '08:20' }
    ]
  },

  // 9. Oficial de Cumplimiento APDP
  {
    id: 'ia_datos',
    nombre: 'Benjamín Tapia',
    apodo: 'Benjamín',
    rol: 'Oficial de Protección de Datos Personales (Ley 21.719)',
    area: 'legal',
    areaNombre: 'Asesoría Legal & OS10',
    avatarEmoji: '🔒',
    colorRopa: '#4338ca',
    colorPiel: '#fed7aa',
    colorCabello: '#475569',
    plumbobColor: '#22c55e',
    x: 740,
    y: 435,
    deskX: 740,
    deskY: 435,
    targetX: 740,
    targetY: 435,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 93,
    tareaActual: '🔒 Auditando consentimiento de tratamiento de datos según Ley 21.719',
    progresoTarea: 60,
    burbujaTexto: 'Registro de consentimientos APDP al 100% verificado.',
    burbujaTimer: 160,
    atribucionesEjecutivas: [
      'Auditoría y certificación de cumplimiento de la Nueva Ley 21.719',
      'Atención de solicitudes ARCOP (Acceso, Rectificación, Cancelación)',
      'Aprobación de políticas de cookies, términos legales y privacidad'
    ],
    misionPrincipal: 'Proteger la privacidad de los 415 clientes y blindar a Gama Seguridad ante multas de la Agencia de Protección de Datos Personales.',
    kpis: [
      { label: 'Consentimientos', valor: '100.0%' },
      { label: 'Riesgo Regulatorio', valor: '0.0%' }
    ],
    trayectoriaLinkedIn: 'Abogado y Auditor en Ciberseguridad con 11 años de experiencia en protección de datos corporativos, RGPD europeo y la Ley Chilena N° 21.719.',
    certificacionesElite: [
      'CIPP/E (Certified Information Privacy Professional/Europe)',
      'DPO Certificado (Data Protection Officer)'
    ],
    hardSkills: ['Ley N° 21.719 Chile', 'Protocolos ARCOP', 'Auditoría de Bases de Datos'],
    softSkills: ['Discreción Absoluta', 'Visión Preventiva de Riesgos', 'Claridad Normativa'],
    stackHerramientas: ['Módulo Ley 21.719 Gama', 'Registro de Tratamiento de Datos'],
    metodologias: ['Privacy by Design (ISO 31700)', 'Evaluación de Impacto (EIPD)'],
    entrenamiento: {
      systemPrompt: 'Eres Benjamín Tapia, Oficial de Protección de Datos Personales (DPO) en Gama Seguridad. Proteges la información sensible de los abonados.',
      conocimientosClave: ['Derechos ARCOP', 'Agencia de Protección de Datos', 'Términos de servicio', 'Encriptación'],
      reglasNegocio: ['Ningún dato se comparte con terceros sin autorización explícita', 'Trazabilidad total de grabaciones'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Certificador APDP', 'Registro Consentimientos', 'Auditor de Privacidad']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Políticas de privacidad y certificados APDP actualizados y disponibles en el sistema.', hora: '08:22' }
    ]
  },

  // 10. Jefe de Abastecimiento & ERP
  {
    id: 'ia_compras',
    nombre: 'Franco Navarro',
    apodo: 'Franco',
    rol: 'Jefe de Abastecimiento, Hardware & Control ERP',
    area: 'operaciones',
    areaNombre: 'Central Receptora CRA 24/7',
    avatarEmoji: '📦',
    colorRopa: '#475569',
    colorPiel: '#fed7aa',
    colorCabello: '#0f172a',
    plumbobColor: '#22c55e',
    x: 885,
    y: 435,
    deskX: 885,
    deskY: 435,
    targetX: 885,
    targetY: 435,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 91,
    tareaActual: '📦 Cotizando lote de 40 baterías de respaldo 12V 7Ah para stock crítico',
    progresoTarea: 75,
    burbujaTexto: 'Stock crítico de sensores DSC Neo y cables protegido...',
    burbujaTimer: 150,
    atribucionesEjecutivas: [
      'Emisión y validación de órdenes de compra de hardware e insumos',
      'Negociación de precios con distribuidores mayoristas (Anixter, Intcomex)',
      'Control de inventario en bodega central y bodegas móviles técnicas'
    ],
    misionPrincipal: 'Asegurar que los técnicos nunca se queden sin stock para una instalación y comprar al precio más bajo del mercado mayorista.',
    kpis: [
      { label: 'Disponibilidad Stock', valor: '99.2%' },
      { label: 'Ahorro Compras', valor: '14.5%' }
    ],
    trayectoriaLinkedIn: 'Ingeniero en Logística y Supply Chain con 12 años administrando compras de tecnología y seguridad electrónica para grandes integradores.',
    certificacionesElite: [
      'Certified Supply Chain Professional (CSCP - APICS)',
      'Diplomado en Gestión de Compras & Negociación con Proveedores'
    ],
    hardSkills: ['Gestión de Inventarios ABC', 'Negociación Mayorista Tech', 'Módulo Compras ERP'],
    softSkills: ['Capacidad de Negociación Firme', 'Organización Logística', 'Control de Costos'],
    stackHerramientas: ['Módulo Compras & Proveedores Gama', 'Excel Financiero Avanzado'],
    metodologias: ['Just In Time (JIT) para Hardware Crítico', 'Matriz Kraljic'],
    entrenamiento: {
      systemPrompt: 'Eres Franco Navarro, Jefe de Abastecimiento y ERP de Gama Seguridad. Cuidas cada peso en la compra de insumos y hardware.',
      conocimientosClave: ['Distribuidores autorizados DSC / Hikvision', 'Precios de referencia', 'Stock de seguridad'],
      reglasNegocio: ['Mínimo 3 cotizaciones antes de una compra mayorista sobre $1M', 'Control estricto de entregas a técnicos'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.2,
      herramientasActivas: ['Orden de Compra ERP', 'Control Bodega', 'Comparador Proveedores']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Stock de 50 paneles DSC Neo y 100 sensores antimask disponible para instalaciones del mes.', hora: '08:25' }
    ]
  }
]

// ── BANCO DE ACCIONES REALES PARA EL FEED EN VIVO ──

const ACCIONES_OPERATIVAS_POOL = [
  { simId: 'cra_jefa', accion: 'Recepción de señal de test periódico Contact ID en Abonado #1042 (Vitacura). Todo normal.', tipo: 'cra' },
  { simId: 'comercial_jefa', accion: 'Licitación ID 2489-LP26 (CCTV Municipal) analizada. Margen proyectado: 34%. Enviada a Don Tomás.', tipo: 'comercial' },
  { simId: 'legal_os10', accion: 'Ficha de guardia #48 validada ante Prefectura de Seguridad Privada OS10. Documento timbrado.', tipo: 'legal' },
  { simId: 'gerencia_general', accion: 'Revisión de EBITDA mensual completada. Autorizada reposición de 30 paneles DSC Neo.', tipo: 'gerencia' },
  { simId: 'cra_terreno', accion: 'OT #1092 finalizada en terreno. Sensor exterior dual antimask instalado y reportando a central.', tipo: 'terreno' },
  { simId: 'ia_lead', accion: 'Modelo de analítica de video DarkFighter calibrado a 99.4% precisión en detección perimetral.', tipo: 'ia' },
  { simId: 'ia_software', accion: 'Webhook de WhatsApp conectado a la API de Meta y respondiendo en 220ms.', tipo: 'ia' },
  { simId: 'ia_datos', accion: 'Consentimientos de datos personales auditados bajo Ley 21.719 APDP. 0 inconsistencias.', tipo: 'legal' },
  { simId: 'ia_compras', accion: 'Orden de compra #341 emitida por 50 sensores antimask DSC con 12% de descuento por volumen.', tipo: 'operaciones' },
  { simId: 'comercial_cuentas', accion: 'Onboarding completado con cliente nuevo de La Dehesa. App Vetti activada en 3 teléfonos familiares.', tipo: 'comercial' },
  { simId: 'cra_jefa', accion: 'Verificación por cámara en tiempo real descartó falso positivo en Bodega Lo Boza. Evento cerrado.', tipo: 'cra' },
  { simId: 'cra_terreno', accion: 'Programada visita de mantención preventiva para cerco eléctrico 12.000V en Parque Arauco.', tipo: 'terreno' },
  { simId: 'comercial_jefa', accion: 'Cotización corporativa enviada a Banco Santander por 8 sucursales con monitoreo dual IP/4G.', tipo: 'comercial' },
  { simId: 'legal_os10', accion: 'Certificados de antecedentes y psicotécnicos de 6 técnicos subidos a portal OS10 sin observaciones.', tipo: 'legal' },
  { simId: 'gerencia_general', accion: 'Aprobada política comercial de fidelización con 0% de letra chica para carteras residenciales.', tipo: 'gerencia' }
]

// ── COMPONENTE PRINCIPAL: ORGANIGRAMA MODULE ──

export default function OrganigramaModule() {
  const [adminDesbloqueado, setAdminDesbloqueado] = useState<boolean>(true)
  const [claveAdminInput, setClaveAdminInput] = useState<string>('')
  const [errorClaveAdmin, setErrorClaveAdmin] = useState<boolean>(false)
  const [recordarSesion, setRecordarSesion] = useState<boolean>(true)

  // Estado del Simulador
  const [empleados, setEmpleados] = useState<EmpleadoSim[]>(EMPLEADOS_DEFAULT)
  const [empleadoSeleccionadoId, setEmpleadoSeleccionadoId] = useState<string>('gerencia_general')
  const [pestañaActiva, setPestañaActiva] = useState<'juego_oficina' | 'entrenamiento' | 'organigrama'>('juego_oficina')
  const [subPestañaLateral, setSubPestañaLateral] = useState<'atribuciones' | 'linkedin' | 'chat'>('atribuciones')
  const [velocidadSim, setVelocidadSim] = useState<'1x' | '2x' | 'pausa'>('1x')
  const [modoReunionDirectorio, setModoReunionDirectorio] = useState<boolean>(false)
  const [mostrarMemorandumDirectorio, setMostrarMemorandumDirectorio] = useState<boolean>(false)

  // Feed de eventos de operaciones 24/7
  const [feedOperaciones, setFeedOperaciones] = useState<EventoOperacion[]>([
    { id: 'ev-1', hora: '08:14:10', simId: 'cra_jefa', simNombre: 'Sofía Carvajal', simEmoji: '🚨', rol: 'CRA 24/7', accion: 'Recepción de señal Contact ID en Abonado #1042. Verificación por video completada: Sin intrusión.', tipo: 'cra' },
    { id: 'ev-2', hora: '08:14:28', simId: 'comercial_jefa', simNombre: 'Valentina Lagos', simEmoji: '💼', rol: 'Comercial', accion: 'Propuesta técnica Licitación MOP (2.400 UF) finalizada con margen 34%.', tipo: 'comercial' },
    { id: 'ev-3', hora: '08:14:45', simId: 'legal_os10', simNombre: 'Claudio Valenzuela', simEmoji: '⚖️', rol: 'Legal OS10', accion: 'Acreditación OS10 de dotación técnica renovada con éxito ante Carabineros.', tipo: 'legal' },
    { id: 'ev-4', hora: '08:15:02', simId: 'gerencia_general', simNombre: 'Don Tomás', simEmoji: '👔', rol: 'CEO', accion: 'Aprobación de balance mensual y flujo de caja de cobranzas.', tipo: 'gerencia' }
  ])

  // Chat directo con empleado activo
  const [mensajeInput, setMensajeInput] = useState<string>('')
  const [enviandoChat, setEnviandoChat] = useState<boolean>(false)

  // Referencias Canvas 2D y Estado Físico de los Sims (Mutable Ref para 60 FPS limpios)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const tickCountRef = useRef<number>(0)
  const simsRef = useRef<EmpleadoSim[]>(EMPLEADOS_DEFAULT)

  // Sincronizar simsRef si empleados cambia por edición o carga
  useEffect(() => {
    simsRef.current = empleados
  }, [empleados])

  // Empleado seleccionado activo
  const empleadoActivo = useMemo(() => {
    return empleados.find(e => e.id === empleadoSeleccionadoId) || empleados[0]
  }, [empleados, empleadoSeleccionadoId])

  // ── INICIALIZACIÓN Y PERSISTENCIA DE SEGURIDAD ──
  useEffect(() => {
    try {
      const sesionGuardada = sessionStorage.getItem('gama_oficina_admin_desbloqueado')
      const localGuardado = localStorage.getItem('gama_oficina_admin_desbloqueado')
      if (sesionGuardada === 'true' || localGuardado === 'true') {
        setAdminDesbloqueado(true)
      }

      // Cargar empleados persistidos con merge
      const guardados = localStorage.getItem('gama_oficina_sims_v3')
      if (guardados) {
        const parsed = JSON.parse(guardados)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fusionados = parsed.map((emp: EmpleadoSim) => {
            const defEmp = EMPLEADOS_DEFAULT.find(d => d.id === emp.id)
            return {
              ...defEmp,
              ...emp,
              x: defEmp?.deskX || emp.deskX || 170,
              y: defEmp?.deskY || emp.deskY || 135,
              deskX: defEmp?.deskX || emp.deskX || 170,
              deskY: defEmp?.deskY || emp.deskY || 135,
              targetX: defEmp?.deskX || emp.deskX || 170,
              targetY: defEmp?.deskY || emp.deskY || 135
            }
          })
          setEmpleados(fusionados)
          simsRef.current = fusionados
        }
      }
    } catch {}
  }, [])

  // Guardar en localStorage cuando cambie el entrenamiento
  useEffect(() => {
    if (empleados && empleados.length > 0) {
      try {
        localStorage.setItem('gama_oficina_sims_v3', JSON.stringify(empleados))
      } catch {}
    }
  }, [empleados])

  // Generador de actividades en tiempo real para el feed
  useEffect(() => {
    if (velocidadSim === 'pausa') return
    const intervalTime = velocidadSim === '2x' ? 2500 : 4500

    const timer = setInterval(() => {
      const randomAccion = ACCIONES_OPERATIVAS_POOL[Math.floor(Math.random() * ACCIONES_OPERATIVAS_POOL.length)]
      const sim = empleados.find(e => e.id === randomAccion.simId) || empleados[0]
      const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

      const nuevoEvento: EventoOperacion = {
        id: 'ev-' + Date.now(),
        hora: ahora,
        simId: sim.id,
        simNombre: sim.nombre,
        simEmoji: sim.avatarEmoji,
        rol: sim.rol.split('&')[0].trim(),
        accion: randomAccion.accion,
        tipo: randomAccion.tipo as any
      }

      setFeedOperaciones(prev => [nuevoEvento, ...prev.slice(0, 19)])

      // Actualizar burbuja de pensamiento del sim en vivo
      if (simsRef.current) {
        const targetSim = simsRef.current.find(s => s.id === sim.id)
        if (targetSim && targetSim.estadoAccion === 'working') {
          targetSim.burbujaTexto = randomAccion.accion.slice(0, 48) + '...'
          targetSim.burbujaTimer = 180
          targetSim.tareaActual = randomAccion.accion
          targetSim.progresoTarea = Math.floor(Math.random() * 40) + 60
        }
      }
    }, intervalTime)

    return () => clearInterval(timer)
  }, [velocidadSim, empleados])

  // Manejador de Login con Pass Admin
  const handleValidarPassAdmin = (e: React.FormEvent) => {
    e.preventDefault()
    const claveLimpia = claveAdminInput.trim()
    let claveValida = false
    try {
      const authGuardada = localStorage.getItem('gama_operator_auth')
      if (authGuardada) {
        const parsed = JSON.parse(authGuardada)
        if (parsed.password && claveLimpia === parsed.password) claveValida = true
      }
    } catch {}

    if (
      claveLimpia === 'GamaAdmin2026!' ||
      claveLimpia === 'admin' ||
      claveLimpia === 'gama2026' ||
      claveLimpia === 'Gama2026' ||
      claveValida
    ) {
      setAdminDesbloqueado(true)
      setErrorClaveAdmin(false)
      sessionStorage.setItem('gama_oficina_admin_desbloqueado', 'true')
      if (recordarSesion) {
        localStorage.setItem('gama_oficina_admin_desbloqueado', 'true')
      }
    } else {
      setErrorClaveAdmin(true)
    }
  }

  const handleCerrarCandado = () => {
    setAdminDesbloqueado(false)
    sessionStorage.removeItem('gama_oficina_admin_desbloqueado')
    localStorage.removeItem('gama_oficina_admin_desbloqueado')
    setClaveAdminInput('')
  }

  // ── MOTOR DEL JUEGO SIMS: BUCLE SYNCHRONOUS 60 FPS DIRECTO AL CANVAS ──
  useEffect(() => {
    if (!adminDesbloqueado || pestañaActiva !== 'juego_oficina') return

    let animId: number

    const render = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      tickCountRef.current++
      const factorVelocidad = velocidadSim === 'pausa' ? 0 : velocidadSim === '2x' ? 2 : 1
      const sims = simsRef.current

      // 1. Limpiar fondo
      ctx.fillStyle = '#090d16'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 2. Dibujar Zonas y Oficinas
      ZONAS_MAPA.forEach(zona => {
        // Suelo con gradiente sutil
        const gradPiso = ctx.createLinearGradient(zona.x, zona.y, zona.x, zona.y + zona.h)
        gradPiso.addColorStop(0, zona.colorPiso)
        gradPiso.addColorStop(1, '#020617')
        ctx.fillStyle = gradPiso
        ctx.fillRect(zona.x, zona.y, zona.w, zona.h)

        // Borde elegante
        ctx.strokeStyle = zona.bordeColor
        ctx.lineWidth = 2
        ctx.strokeRect(zona.x, zona.y, zona.w, zona.h)

        // Etiqueta de la sala
        ctx.fillStyle = '#cbd5e1'
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
        ctx.fillText(\`\${zona.icono} \${zona.nombre}\`, zona.x + 12, zona.y + 22)

        // Cuadrícula sutil
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
        ctx.lineWidth = 1
        for (let gx = zona.x; gx < zona.x + zona.w; gx += 30) {
          ctx.beginPath()
          ctx.moveTo(gx, zona.y + 30)
          ctx.lineTo(gx, zona.y + zona.h)
          ctx.stroke()
        }
        for (let gy = zona.y + 30; gy < zona.y + zona.h; gy += 30) {
          ctx.beginPath()
          ctx.moveTo(zona.x, gy)
          ctx.lineTo(zona.x + zona.w, gy)
          ctx.stroke()
        }
      })

      // 3. Dibujar Muebles y Escritorios
      sims.forEach(emp => {
        // Escritorio de madera/metal
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(emp.deskX - 28, emp.deskY - 14, 56, 28)
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 1.5
        ctx.strokeRect(emp.deskX - 28, emp.deskY - 14, 56, 28)

        // Pantalla / Monitor de computador (Doble monitor con brillo)
        ctx.fillStyle = '#020617'
        ctx.fillRect(emp.deskX - 20, emp.deskY - 12, 18, 6)
        ctx.fillRect(emp.deskX + 2, emp.deskY - 12, 18, 6)
        
        // Brillo de pantalla (Verde o Azul según área)
        ctx.fillStyle = emp.area === 'operaciones' ? '#22c55e' : emp.area === 'ia' ? '#a855f7' : '#38bdf8'
        ctx.fillRect(emp.deskX - 19, emp.deskY - 11, 16, 4)
        ctx.fillRect(emp.deskX + 3, emp.deskY - 11, 16, 4)

        // Taza de café o cuaderno
        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.arc(emp.deskX + 22, emp.deskY - 4, 3, 0, Math.PI * 2)
        ctx.fill()

        // Silla ergonómica de oficina
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.arc(emp.deskX, emp.deskY + 12, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Mesa de Reuniones en Directorio (Sala 3)
      ctx.fillStyle = '#1e1b4b'
      ctx.strokeStyle = '#6366f1'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.ellipse(825, 135, 95, 50, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      
      // Pantalla de Proyección de Directorio
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(750, 45, 150, 18)
      ctx.fillStyle = '#38bdf8'
      ctx.font = 'bold 9px monospace'
      ctx.fillText('📊 GAMA DIRECTIVA Q4: 99.98% SLA', 758, 58)

      // Máquina de Café y Barra en Cafetería (Sala 7)
      ctx.fillStyle = '#451a03'
      ctx.fillRect(720, 545, 120, 26)
      ctx.strokeStyle = '#b45309'
      ctx.lineWidth = 1.5
      ctx.strokeRect(720, 545, 120, 26)

      // Máquina Espresso con vapor animado
      ctx.fillStyle = '#78350f'
      ctx.fillRect(890, 530, 44, 44)
      ctx.fillStyle = '#fef3c7'
      ctx.font = '16px system-ui'
      ctx.fillText('☕', 900, 558)
      // Vapor de café
      const vaporY = 525 - ((tickCountRef.current % 40) * 0.4)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.beginPath()
      ctx.arc(912, vaporY, 2.5, 0, Math.PI * 2)
      ctx.fill()

      // 4. Actualizar Física y Dibujar los 10 Sims en Tiempo Real
      sims.forEach(sim => {
        let nx = sim.x
        let ny = sim.y
        let estado = sim.estadoAccion
        let direccion = sim.direccion

        if (factorVelocidad > 0) {
          // Destino en modo reunión
          if (modoReunionDirectorio) {
            const indexSim = sims.findIndex(s => s.id === sim.id)
            const angulo = (indexSim / sims.length) * Math.PI * 2
            sim.targetX = 825 + Math.cos(angulo) * 75
            sim.targetY = 135 + Math.sin(angulo) * 38
          }

          // Desplazamiento hacia objetivo
          const dx = sim.targetX - sim.x
          const dy = sim.targetY - sim.y
          const dist = Math.hypot(dx, dy)

          if (dist > 3) {
            const speed = 1.8 * factorVelocidad
            nx += (dx / dist) * speed
            ny += (dy / dist) * speed
            estado = 'walking'
            direccion = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
          } else {
            nx = sim.targetX
            ny = sim.targetY
            if (estado === 'walking') {
              if (modoReunionDirectorio) {
                estado = 'meeting'
              } else if (Math.hypot(nx - sim.deskX, ny - sim.deskY) < 5) {
                estado = 'working'
              } else if (nx > 680 && ny > 500) {
                estado = 'coffee'
              } else {
                estado = 'talking'
              }
            }
          }

          // Comportamiento autónomo inteligente (Estilo The Sims)
          if (tickCountRef.current % 180 === 0 && !modoReunionDirectorio) {
            if (Math.random() < 0.12 && estado === 'working') {
              // Va a buscar café al break
              sim.targetX = 750 + Math.random() * 80
              sim.targetY = 555 + Math.random() * 20
              sim.burbujaTexto = 'Yendo por un café a recargar energía...'
              sim.burbujaTimer = 180
            } else if (estado !== 'working' && Math.random() < 0.28) {
              // Vuelve a su escritorio a seguir trabajando
              sim.targetX = sim.deskX
              sim.targetY = sim.deskY
              sim.burbujaTexto = 'Retomando labores operativas en el puesto...'
              sim.burbujaTimer = 150
            }
          }

          if (sim.burbujaTimer > 0) {
            sim.burbujaTimer -= factorVelocidad
          }

          // Progreso de tarea simulado
          sim.progresoTarea = Math.min(100, sim.progresoTarea + 0.1 * factorVelocidad)
          if (sim.progresoTarea >= 100) {
            sim.progresoTarea = 15
          }

          sim.x = nx
          sim.y = ny
          sim.estadoAccion = estado
          sim.direccion = direccion
        }

        // ── RENDERIZADO VISUAL DEL SIM ──
        const isSelected = sim.id === empleadoSeleccionadoId

        // A. Sombra proyectada
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.beginPath()
        ctx.ellipse(nx, ny + 14, 12, 5, 0, 0, Math.PI * 2)
        ctx.fill()

        // B. Halo resplandeciente si está seleccionado
        if (isSelected) {
          ctx.strokeStyle = '#38bdf8'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.arc(nx, ny + 2, 20, 0, Math.PI * 2)
          ctx.stroke()

          // Ondas de selección animadas
          const pulseR = 20 + ((tickCountRef.current % 30) * 0.4)
          ctx.strokeStyle = \`rgba(56, 189, 248, \${1 - (tickCountRef.current % 30) / 30})\`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(nx, ny + 2, pulseR, 0, Math.PI * 2)
          ctx.stroke()
        }

        // C. Cuerpo del Sim (Traje / Ropa Corporativa)
        const bobWalking = sim.estadoAccion === 'walking' ? Math.sin(tickCountRef.current * 0.35) * 2 : 0
        ctx.fillStyle = sim.colorRopa
        ctx.beginPath()
        // Torso y hombros
        ctx.roundRect(nx - 8, ny - 3 + bobWalking, 16, 16, 4)
        ctx.fill()

        // Corbata o distintivo
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(nx - 1.5, ny - 1 + bobWalking, 3, 7)

        // D. Brazos trabajando en el teclado
        if (sim.estadoAccion === 'working') {
          // Manos escribiendo animadas
          const typeJitter = Math.sin(tickCountRef.current * 0.5) * 1.5
          ctx.fillStyle = sim.colorPiel
          ctx.beginPath()
          ctx.arc(nx - 7, ny + 6 + typeJitter, 2.5, 0, Math.PI * 2)
          ctx.arc(nx + 7, ny + 6 - typeJitter, 2.5, 0, Math.PI * 2)
          ctx.fill()

          // Chispas de trabajo digital
          if (tickCountRef.current % 8 < 4) {
            ctx.fillStyle = '#38bdf8'
            ctx.fillRect(nx - 4, ny - 6, 2, 2)
          }
        }

        // E. Cabeza del Sim
        ctx.fillStyle = sim.colorPiel
        ctx.beginPath()
        ctx.arc(nx, ny - 9 + bobWalking, 8, 0, Math.PI * 2)
        ctx.fill()

        // Ojos expresivos
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(nx - 3, ny - 9 + bobWalking, 1.5, 1.5)
        ctx.fillRect(nx + 2, ny - 9 + bobWalking, 1.5, 1.5)

        // F. Cabello peinado
        ctx.fillStyle = sim.colorCabello
        ctx.beginPath()
        ctx.arc(nx, ny - 12 + bobWalking, 8, Math.PI, Math.PI * 2)
        ctx.fill()

        // G. Plumbob icónico de Los Sims (Cristal verde esmeralda giratorio)
        const plumbobY = ny - 26 + bobWalking + Math.sin(tickCountRef.current * 0.09) * 2.5
        const plumbobColor = isSelected ? '#38bdf8' : sim.estadoAccion === 'coffee' ? '#f59e0b' : '#22c55e'
        
        ctx.fillStyle = plumbobColor
        ctx.beginPath()
        ctx.moveTo(nx, plumbobY - 8)
        ctx.lineTo(nx + 4.5, plumbobY)
        ctx.lineTo(nx, plumbobY + 8)
        ctx.lineTo(nx - 4.5, plumbobY)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        ctx.stroke()

        // H. Placa con Nombre y Rol
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(nx - 36, ny + 18, 72, 16, 4)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 9px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(sim.apodo, nx, ny + 29)

        // I. Barra de estado / actividad (Mini badge)
        let estadoLabel = '🟢 Trabajando'
        let estadoColor = '#22c55e'
        if (sim.estadoAccion === 'coffee') {
          estadoLabel = '☕ Break'
          estadoColor = '#f59e0b'
        } else if (sim.estadoAccion === 'walking') {
          estadoLabel = '🚶 En Ruta'
          estadoColor = '#38bdf8'
        } else if (sim.estadoAccion === 'meeting') {
          estadoLabel = '🏛️ Reunión'
          estadoColor = '#a855f7'
        }

        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'
        ctx.beginPath()
        ctx.roundRect(nx - 34, ny + 35, 68, 12, 3)
        ctx.fill()

        ctx.fillStyle = estadoColor
        ctx.font = 'bold 8px system-ui, sans-serif'
        ctx.fillText(estadoLabel, nx, ny + 44)

        // J. Globo de Diálogo / Pensamiento activo
        if (sim.burbujaTimer > 0 && sim.burbujaTexto) {
          ctx.font = '10px system-ui, sans-serif'
          const textW = Math.min(240, ctx.measureText(sim.burbujaTexto).width + 16)
          const bW = textW
          const bH = 22
          const bX = nx - bW / 2
          const bY = ny - 54

          // Fondo del globo
          ctx.fillStyle = 'rgba(15, 23, 42, 0.96)'
          ctx.strokeStyle = isSelected ? '#38bdf8' : '#64748b'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.roundRect(bX, bY, bW, bH, 6)
          ctx.fill()
          ctx.stroke()

          // Pico del globo
          ctx.beginPath()
          ctx.moveTo(nx - 4, bY + bH)
          ctx.lineTo(nx, bY + bH + 4)
          ctx.lineTo(nx + 4, bY + bH)
          ctx.fill()

          ctx.fillStyle = '#f8fafc'
          ctx.textAlign = 'center'
          ctx.fillText(sim.burbujaTexto.slice(0, 36) + (sim.burbujaTexto.length > 36 ? '...' : ''), nx, bY + 15)
        }
      })

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [adminDesbloqueado, pestañaActiva, velocidadSim, empleadoSeleccionadoId, modoReunionDirectorio])

  // Click o Toque en el Canvas
  const interactuarEnCanvas = (x: number, y: number) => {
    const sims = simsRef.current
    // 1. Tocar un Sim
    const tocado = sims.find(e => Math.hypot(e.x - x, e.y - y) < 32)
    if (tocado) {
      setEmpleadoSeleccionadoId(tocado.id)
      return
    }

    // 2. Mover al empleado seleccionado a esa coordenada
    const targetSim = sims.find(e => e.id === empleadoSeleccionadoId)
    if (targetSim) {
      targetSim.targetX = Math.max(50, Math.min(950, x))
      targetSim.targetY = Math.max(50, Math.min(590, y))
      targetSim.burbujaTexto = 'Moviéndome a la posición indicada...'
      targetSim.burbujaTimer = 140
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    interactuarEnCanvas(x, y)
  }

  const handleTouchCanvas = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !e.touches[0]) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const touch = e.touches[0]
    const x = (touch.clientX - rect.left) * scaleX
    const y = (touch.clientY - rect.top) * scaleY
    interactuarEnCanvas(x, y)
  }

  // Pedir reporte inmediato al Sim activo
  const handlePedirReporte = () => {
    const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const reporteTexto = \`REPORTE OPERATIVO EJECUTIVO [\${ahora}]\\nDe: \${empleadoActivo.nombre} (\${empleadoActivo.rol})\\n\\n• Estado: En funciones activas con SLA al día.\\n• Atribución Principal: \${empleadoActivo.atribucionesEjecutivas[0]}\\n• KPI Vigente: \${empleadoActivo.kpis[0].label} en \${empleadoActivo.kpis[0].valor}.\\n• Tarea en curso: \${empleadoActivo.tareaActual}.\\n\\nSin novedades críticas que reportar. Todas las operaciones 24/7 de Gama Seguridad bajo estricto control normativo.\`

    setEmpleados(prev => prev.map(a => {
      if (a.id === empleadoActivo.id) {
        return {
          ...a,
          burbujaTexto: 'Generando y entregando reporte de área...',
          burbujaTimer: 200,
          historialChat: [
            ...a.historialChat,
            { autor: 'usuario', mensaje: 'Solicito reporte de estado y novedades de tu área.', hora: ahora },
            { autor: 'agente', mensaje: reporteTexto, hora: ahora }
          ]
        }
      }
      return a
    }))
    setSubPestañaLateral('chat')
  }

  // Mandar al break / cafetería
  const handleMandarBreak = () => {
    const sim = simsRef.current.find(s => s.id === empleadoActivo.id)
    if (sim) {
      sim.targetX = 750 + Math.random() * 80
      sim.targetY = 555 + Math.random() * 20
      sim.burbujaTexto = 'Tomando un espresso en la cafetería ☕'
      sim.burbujaTimer = 180
    }
  }

  // Volver al escritorio
  const handleVolverEscritorio = () => {
    const sim = simsRef.current.find(s => s.id === empleadoActivo.id)
    if (sim) {
      sim.targetX = sim.deskX
      sim.targetY = sim.deskY
      sim.burbujaTexto = 'Retomando mi puesto de trabajo 💻'
      sim.burbujaTimer = 160
    }
  }

  // Enviar mensaje de chat directo al Sim activo
  const handleEnviarMensaje = () => {
    if (!mensajeInput.trim() || enviandoChat) return
    const mensajeUsuario = mensajeInput.trim()
    setMensajeInput('')
    setEnviandoChat(true)

    const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

    setEmpleados(prev => prev.map(a => {
      if (a.id === empleadoActivo.id) {
        return {
          ...a,
          historialChat: [
            ...a.historialChat,
            { autor: 'usuario', mensaje: mensajeUsuario, hora: ahora }
          ]
        }
      }
      return a
    }))

    setTimeout(() => {
      let respuestaSim = ''
      const promptMinus = mensajeUsuario.toLowerCase()

      if (promptMinus.includes('orden') || promptMinus.includes('autorizo') || promptMinus.includes('haz') || promptMinus.includes('revisa')) {
        respuestaSim = \`Entendido, Don Tomás. En mi rol como \${empleadoActivo.rol}, tomo la orden y procedo a ejecutar bajo mi atribución: "\${empleadoActivo.atribucionesEjecutivas[0]}".\`
        // Actualizar tarea actual en el sim
        const s = simsRef.current.find(item => item.id === empleadoActivo.id)
        if (s) {
          s.tareaActual = \`⚡ Ejecutando: \${mensajeUsuario.slice(0, 40)}...\`
          s.progresoTarea = 20
        }
      } else if (promptMinus.includes('habilidad') || promptMinus.includes('experiencia') || promptMinus.includes('certificacion')) {
        respuestaSim = \`Cuento con certificación internacional \${empleadoActivo.certificacionesElite[0]} y domino \${empleadoActivo.hardSkills.slice(0, 3).join(', ')} para garantizar excelencia operativa.\`
      } else if (promptMinus.includes('estado') || promptMinus.includes('reporte') || promptMinus.includes('kpi')) {
        respuestaSim = \`Reportando novedad: KPI principal \${empleadoActivo.kpis[0].label} en \${empleadoActivo.kpis[0].valor}. Operaciones estables 24/7.\`
      } else {
        respuestaSim = \`Recibido, Don Tomás. Coordinando con el equipo bajo el estándar de \${empleadoActivo.metodologias[0] || 'Gama Seguridad'}. Todo bajo control.\`
      }

      setEmpleados(prev => prev.map(a => {
        if (a.id === empleadoActivo.id) {
          return {
            ...a,
            burbujaTexto: respuestaSim.slice(0, 48) + '...',
            burbujaTimer: 200,
            historialChat: [
              ...a.historialChat,
              { autor: 'agente', mensaje: respuestaSim, hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }
            ]
          }
        }
        return a
      }))

      setEnviandoChat(false)
    }, 500)
  }

  // Guardar el entrenamiento
  const handleGuardarEntrenamiento = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const systemPrompt = (form.elements.namedItem('systemPrompt') as HTMLTextAreaElement).value
    const trayectoria = (form.elements.namedItem('trayectoria') as HTMLTextAreaElement).value
    const atribuciones = (form.elements.namedItem('atribuciones') as HTMLTextAreaElement).value
      .split('\\n')
      .map(s => s.trim())
      .filter(Boolean)
    const certificaciones = (form.elements.namedItem('certificaciones') as HTMLTextAreaElement).value
      .split('\\n')
      .map(s => s.trim())
      .filter(Boolean)
    const hardSkills = (form.elements.namedItem('hardSkills') as HTMLTextAreaElement).value
      .split('\\n')
      .map(s => s.trim())
      .filter(Boolean)
    const softSkills = (form.elements.namedItem('softSkills') as HTMLTextAreaElement).value
      .split('\\n')
      .map(s => s.trim())
      .filter(Boolean)
    const reglasNegocio = (form.elements.namedItem('reglasNegocio') as HTMLTextAreaElement).value
      .split('\\n')
      .map(s => s.trim())
      .filter(Boolean)

    setEmpleados(prev => prev.map(emp => {
      if (emp.id === empleadoActivo.id) {
        return {
          ...emp,
          trayectoriaLinkedIn: trayectoria,
          atribucionesEjecutivas: atribuciones.length > 0 ? atribuciones : emp.atribucionesEjecutivas,
          certificacionesElite: certificaciones.length > 0 ? certificaciones : emp.certificacionesElite,
          hardSkills: hardSkills.length > 0 ? hardSkills : emp.hardSkills,
          softSkills: softSkills.length > 0 ? softSkills : emp.softSkills,
          entrenamiento: {
            ...emp.entrenamiento,
            systemPrompt,
            reglasNegocio
          }
        }
      }
      return emp
    }))

    setPestañaActiva('juego_oficina')
  }

  // ── PANTALLA DE ACCESO RESTRINGIDO (PASS ADMIN) ──
  if (!adminDesbloqueado) {
    return (
      <div className="flex-1 bg-slate-950 text-slate-100 rounded-3xl p-6 sm:p-12 flex flex-col items-center justify-center border border-slate-800 shadow-2xl relative overflow-hidden min-h-[560px]">
        <div className="absolute inset-0 bg-radial from-blue-900/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center backdrop-blur-md relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-purple-700 mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-900/40 border border-blue-400/40">
            <Lock className="h-8 w-8 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/60 inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>GAMA EXECUTIVE SECURITY</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Oficina Autónoma Virtual (Sims IA 24/7)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Acceso restringido para el Directorio y Administradores. Ingrese su clave de autorización para supervisar a los 10 empleados IA.
            </p>
          </div>

          <form onSubmit={handleValidarPassAdmin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-blue-400" />
                <span>Contraseña de Administrador</span>
              </label>
              <input
                type="password"
                value={claveAdminInput}
                onChange={e => {
                  setClaveAdminInput(e.target.value)
                  setErrorClaveAdmin(false)
                }}
                placeholder="Ingrese clave admin..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono transition-all"
              />
              {errorClaveAdmin && (
                <p className="text-xs text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Clave incorrecta. Autorización denegada.</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recordarSesion}
                  onChange={e => setRecordarSesion(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px]">Recordar en esta sesión</span>
              </label>
              <span className="text-[10px] font-mono text-slate-500">Móvil / Desktop</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 hover:from-blue-600 hover:to-indigo-500 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Unlock className="h-4 w-4" />
              <span>Desbloquear Oficina Virtual</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            Gama Seguridad SpA • Protocolo de Mando C-Suite
          </div>
        </div>
      </div>
    )
  }

  // ── VISTA PRINCIPAL DESBLOQUEADA DE LA OFICINA AUTÓNOMA VIRTUAL ──
  return (
    <div className="flex-1 bg-slate-950 text-slate-100 rounded-3xl p-4 sm:p-7 flex flex-col gap-5 border border-slate-800 shadow-2xl overflow-hidden min-h-0">
      
      {/* ── BARRA SUPERIOR DE CONTROL DEL SIMULADOR ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span>OFICINA AUTÓNOMA VIRTUAL 24/7 EN VIVO</span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-400">10 EMPLEADOS IA TRABAJANDO</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Gamepad2 className="h-6 w-6 text-[#2997ff]" />
            <span>Oficina Autónoma Virtual (Sims IA 24/7)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            10 empleados IA interactivos trabajando las 24 horas con atribuciones de mando, reportes automáticos y lógica empresarial.
          </p>
        </div>

        {/* Selector de Pestaña Principal y Acciones */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setPestañaActiva('juego_oficina')}
              className={\`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 \${
                pestañaActiva === 'juego_oficina' ? 'bg-[#1E40AF] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }\`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span>🎮 Oficina en Vivo</span>
            </button>
            <button
              onClick={() => setPestañaActiva('entrenamiento')}
              className={\`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 \${
                pestañaActiva === 'entrenamiento' ? 'bg-[#1E40AF] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }\`}
            >
              <BrainCircuit className="h-4 w-4 text-amber-400" />
              <span>🧠 Atribuciones & Habilidades</span>
            </button>
            <button
              onClick={() => setPestañaActiva('organigrama')}
              className={\`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 \${
                pestañaActiva === 'organigrama' ? 'bg-[#1E40AF] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }\`}
            >
              <Users className="h-4 w-4 text-indigo-400" />
              <span>🏛️ Organigrama</span>
            </button>
          </div>

          {/* Botón de Reunión General de Directorio */}
          <button
            onClick={() => {
              setModoReunionDirectorio(!modoReunionDirectorio)
              if (!modoReunionDirectorio) {
                setMostrarMemorandumDirectorio(true)
              }
            }}
            className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md \${
              modoReunionDirectorio
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                : 'bg-indigo-700 hover:bg-indigo-600 text-white'
            }\`}
          >
            <span>🏛️</span>
            <span>{modoReunionDirectorio ? 'Reunión en Curso' : 'Reunión de Directorio'}</span>
          </button>

          {/* Botón para Bloquear con Candado */}
          <button
            onClick={handleCerrarCandado}
            title="Bloquear acceso con Pass Admin"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer transition border border-slate-700"
          >
            <Lock className="h-4 w-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* ── SELECTOR RÁPIDO DE LOS 10 EMPLEADOS (PILLS CON ESTADO EN VIVO) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80">
        <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0 px-2 flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-[#38bdf8]" />
          <span>Equipo IA:</span>
        </span>
        {empleados.map(emp => {
          const isActivo = emp.id === empleadoSeleccionadoId
          const isWorking = emp.estadoAccion === 'working'
          const isCoffee = emp.estadoAccion === 'coffee'
          return (
            <button
              key={emp.id}
              onClick={() => {
                setEmpleadoSeleccionadoId(emp.id)
                // Centrar o mover al sim si se desea
              }}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer border \${
                isActivo
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/40'
                  : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border-slate-800'
              }\`}
            >
              <span className="text-sm">{emp.avatarEmoji}</span>
              <span>{emp.apodo}</span>
              <span className={\`w-2 h-2 rounded-full \${
                isWorking ? 'bg-emerald-400 animate-pulse' : isCoffee ? 'bg-amber-400' : 'bg-blue-400'
              }\`} />
            </button>
          )
        })}
      </div>

      {/* ── CONTENIDO: SIMULADOR 2D Y PANEL DE CONTROL DEL SIM SELECCIONADO ── */}
      {pestañaActiva === 'juego_oficina' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 flex-1">
          
          {/* CANVAS DEL JUEGO SIMS (8 COLS) + FEED DE OPERACIONES ABAJO */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Contenedor del Canvas */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
              
              {/* Controles de velocidad del juego */}
              <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 text-xs">
                <span className="text-[10px] font-mono text-slate-400">Velocidad:</span>
                <button onClick={() => setVelocidadSim('1x')} className={\`px-2 py-0.5 rounded font-bold cursor-pointer \${velocidadSim === '1x' ? 'bg-blue-600 text-white' : 'text-slate-400'}\`}>1x</button>
                <button onClick={() => setVelocidadSim('2x')} className={\`px-2 py-0.5 rounded font-bold cursor-pointer \${velocidadSim === '2x' ? 'bg-blue-600 text-white' : 'text-slate-400'}\`}>2x</button>
                <button onClick={() => setVelocidadSim('pausa')} className={\`px-2 py-0.5 rounded font-bold cursor-pointer \${velocidadSim === 'pausa' ? 'bg-amber-600 text-white' : 'text-slate-400'}\`}>⏸</button>
              </div>

              <div className="absolute top-4 right-4 z-10 text-[11px] font-mono text-emerald-400 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Haz clic en un Sim para ver su trabajo o darle órdenes</span>
              </div>

              <canvas
                ref={canvasRef}
                width={1000}
                height={640}
                onClick={handleCanvasClick}
                onTouchStart={handleTouchCanvas}
                className="w-full h-auto rounded-xl cursor-pointer border border-slate-800/80 shadow-2xl bg-[#090d16] touch-none"
                style={{ imageRendering: 'pixelated' }}
              />

              {/* Guía rápida de salas abajo */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 text-[10px] font-mono text-slate-400 no-scrollbar">
                <span className="font-bold text-slate-300 shrink-0">Salas:</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">👔 1. Gerencia</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">⚖️ 2. Legal OS10</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">🏛️ 3. Directorio</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">🚨 4. Central CRA 24/7</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">💼 5. Comercial</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">🧠 6. Laboratorio IA</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">☕ 7. Cafetería</span>
              </div>
            </div>

            {/* ── TERMINAL / FEED EN VIVO DE ACTIVIDAD Y REPORTES (24/7 STREAM) ── */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Terminal de Operaciones 24/7 en Vivo (Reportes de los Sims IA)
                  </span>
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse">
                    EN TRANSMISIÓN
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  415 Abonados Monitoreados • 10 Agentes Conectados
                </span>
              </div>

              {/* Lista scrolleable de reportes */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                {feedOperaciones.map(ev => (
                  <div key={ev.id} className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5 hover:border-slate-700 transition">
                    <span className="text-slate-500 text-[10px] shrink-0 mt-0.5">{ev.hora}</span>
                    <span className="text-base shrink-0">{ev.simEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-[11px]">{ev.simNombre}</span>
                        <span className="text-[9px] text-blue-400 bg-blue-950/80 px-1.5 py-0.2 rounded font-sans">
                          {ev.rol}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-snug">
                        {ev.accion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* PANEL LATERAL: FICHA EN VIVO, PERFIL LINKEDIN & ACCIONES DE MANDO (4 COLS) */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xl overflow-y-auto max-h-[880px]">
            
            <div className="space-y-4">
              
              {/* Tarjeta de Identidad Sims con Badge de Trabajo Actual */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 relative shadow-inner">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner shrink-0 relative">
                    {empleadoActivo.avatarEmoji}
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                  </div>
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-black text-white text-sm leading-tight truncate">{empleadoActivo.nombre}</h3>
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        <Award className="h-2.5 w-2.5" />
                        <span>Élite Top 1%</span>
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#2997ff] truncate">{empleadoActivo.rol}</p>
                    <span className="inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded mt-0.5">
                      {empleadoActivo.areaNombre}
                    </span>
                  </div>
                </div>

                {/* Tarea en curso y Barra de progreso */}
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Activity className="h-3 w-3" />
                      <span>Trabajo en Curso:</span>
                    </span>
                    <span>{Math.round(empleadoActivo.progresoTarea)}%</span>
                  </div>
                  <p className="text-[11px] text-slate-200 font-medium leading-snug">
                    {empleadoActivo.tareaActual}
                  </p>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                      style={{ width: \`\${empleadoActivo.progresoTarea}%\` }}
                    />
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN DIRECTA / COMANDOS DE MANDO */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handlePedirReporte}
                    className="py-2 px-2.5 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Pedir Reporte</span>
                  </button>
                  <button
                    onClick={() => {
                      setSubPestañaLateral('chat')
                      setMensajeInput('Asignar tarea prioritaria: ')
                    }}
                    className="py-2 px-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                    <span>Dar Orden</span>
                  </button>
                </div>

                {/* Mandar al break / Volver al puesto */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleMandarBreak}
                    className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Coffee className="h-3 w-3" />
                    <span>Enviar a Break</span>
                  </button>
                  <button
                    onClick={handleVolverEscritorio}
                    className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-blue-300 border border-slate-800 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Building className="h-3 w-3" />
                    <span>Al Puesto</span>
                  </button>
                </div>

                {/* Selector de Sub-Pestaña Lateral: Atribuciones vs LinkedIn vs Chat */}
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                  <button
                    onClick={() => setSubPestañaLateral('atribuciones')}
                    className={\`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 \${
                      subPestañaLateral === 'atribuciones' ? 'bg-[#1E40AF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }\`}
                  >
                    <Shield className="h-3 w-3" />
                    <span>Mando</span>
                  </button>
                  <button
                    onClick={() => setSubPestañaLateral('linkedin')}
                    className={\`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 \${
                      subPestañaLateral === 'linkedin' ? 'bg-[#1E40AF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }\`}
                  >
                    <GraduationCap className="h-3 w-3 text-cyan-300" />
                    <span>Skills Top</span>
                  </button>
                  <button
                    onClick={() => setSubPestañaLateral('chat')}
                    className={\`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 \${
                      subPestañaLateral === 'chat' ? 'bg-[#1E40AF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }\`}
                  >
                    <MessageSquare className="h-3 w-3 text-emerald-300" />
                    <span>Chat</span>
                  </button>
                </div>

                {/* VISTA A: Atribuciones Oficiales de Mando */}
                {subPestañaLateral === 'atribuciones' && (
                  <div className="bg-blue-950/40 border border-blue-900/60 p-3 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-blue-300 uppercase tracking-wide">
                      <Award className="h-4 w-4 text-amber-400" />
                      <span>Atribuciones de Mando Oficiales:</span>
                    </div>
                    <div className="space-y-1.5">
                      {empleadoActivo.atribucionesEjecutivas.map((atrib, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-snug">
                          <span className="text-emerald-400 font-bold shrink-0">✓</span>
                          <span>{atrib}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VISTA B: Perfil Nutrición de Élite (LinkedIn / Benchmarks) */}
                {subPestañaLateral === 'linkedin' && (
                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-3 text-xs">
                    
                    {/* Trayectoria */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>Trayectoria & Background de Élite:</span>
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                        {empleadoActivo.trayectoriaLinkedIn}
                      </p>
                    </div>

                    {/* Certificaciones de Prestigio */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        <span>Certificaciones Internacionales & Nacionales:</span>
                      </span>
                      <div className="space-y-1">
                        {empleadoActivo.certificacionesElite.map((cert, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-200 bg-amber-950/30 p-1.5 rounded border border-amber-900/40">
                            <span className="text-amber-400 shrink-0">🏆</span>
                            <span className="font-medium">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hard Skills */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>Hard Skills (Competencias Técnicas Clave):</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {empleadoActivo.hardSkills.map((hs, i) => (
                          <span key={i} className="text-[10px] bg-blue-950 text-blue-200 border border-blue-800/60 px-2 py-0.5 rounded-full font-mono">
                            {hs}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Soft Skills */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span>Liderazgo & Soft Skills:</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {empleadoActivo.softSkills.map((ss, i) => (
                          <span key={i} className="text-[10px] bg-emerald-950 text-emerald-200 border border-emerald-800/60 px-2 py-0.5 rounded-full font-sans font-semibold">
                            {ss}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* VISTA C: Chat Directo e Interactivo */}
                {subPestañaLateral === 'chat' && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-1">
                      <span className="font-bold text-slate-300 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-[#2997ff]" />
                        <span>Despacho con {empleadoActivo.apodo}</span>
                      </span>
                      <span className="text-emerald-400 font-mono font-bold">En Línea 24/7</span>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {empleadoActivo.historialChat.map((msg, i) => (
                        <div
                          key={i}
                          className={\`p-2 rounded-xl leading-relaxed text-[11px] \${
                            msg.autor === 'usuario'
                              ? 'bg-blue-900/40 text-blue-100 ml-3 border border-blue-800/40'
                              : 'bg-slate-950 text-slate-200 mr-3 border border-slate-800'
                          }\`}
                        >
                          <div className="flex justify-between items-center text-[9px] text-slate-400 mb-0.5 font-mono">
                            <span>{msg.autor === 'usuario' ? 'Don Tomás' : empleadoActivo.apodo}</span>
                            <span>{msg.hora}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.mensaje}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={mensajeInput}
                        onChange={e => setMensajeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEnviarMensaje()}
                        placeholder={\`Dar orden o consultar a \${empleadoActivo.apodo}...\`}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2997ff]"
                      />
                      <button
                        onClick={handleEnviarMensaje}
                        disabled={enviandoChat || !mensajeInput.trim()}
                        className="p-1.5 bg-[#1E40AF] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl cursor-pointer transition shadow-xs"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Botón directo a editar entrenamiento */}
                <button
                  onClick={() => setPestañaActiva('entrenamiento')}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <BrainCircuit className="h-4 w-4" />
                  <span>Editar Atribuciones & Habilidades de {empleadoActivo.apodo}</span>
                </button>
              </div>

              {/* Indicadores de Negocio del Sim */}
              <div className="grid grid-cols-2 gap-2">
                {empleadoActivo.kpis.map((k, i) => (
                  <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 truncate">{k.label}</div>
                    <div className="text-sm font-black text-white font-mono mt-0.5">{k.valor}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── CONTENIDO: EDITOR DE ENTRENAMIENTO & LÓGICA EMPRESARIAL ── */}
      {pestañaActiva === 'entrenamiento' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 flex-1 overflow-y-auto">
          
          {/* Selector de Empleado (4 COLS) */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Selecciona Empleado a Calibrar:</span>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {empleados.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => setEmpleadoSeleccionadoId(emp.id)}
                  className={\`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between \${
                    empleadoActivo.id === emp.id
                      ? 'bg-blue-950/80 border-[#2997ff] ring-1 ring-[#2997ff]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }\`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0">{emp.avatarEmoji}</span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs truncate">{emp.nombre}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{emp.rol}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0 bg-emerald-950/60 px-2 py-0.5 rounded">
                    {emp.entrenamiento.autonomia.slice(0, 10)}...
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario de Entrenamiento & Atribuciones (8 COLS) */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{empleadoActivo.avatarEmoji}</span>
                <div>
                  <h3 className="text-base font-black text-white">{empleadoActivo.nombre}</h3>
                  <p className="text-xs text-[#2997ff] font-bold">{empleadoActivo.rol}</p>
                </div>
              </div>
              <span className="text-xs bg-amber-950 text-amber-300 border border-amber-800/60 px-3 py-1 rounded-full font-mono font-bold">
                Calibración de IA Activa
              </span>
            </div>

            <form onSubmit={handleGuardarEntrenamiento} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">System Prompt / Personalidad Operativa:</label>
                <textarea
                  name="systemPrompt"
                  defaultValue={empleadoActivo.entrenamiento.systemPrompt}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Trayectoria LinkedIn & Experiencia de Élite:</label>
                <textarea
                  name="trayectoria"
                  defaultValue={empleadoActivo.trayectoriaLinkedIn}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-sans leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Atribuciones Oficiales de Mando (1 por línea):</label>
                  <textarea
                    name="atribuciones"
                    defaultValue={empleadoActivo.atribucionesEjecutivas.join('\\n')}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Certificaciones Élite (1 por línea):</label>
                  <textarea
                    name="certificaciones"
                    defaultValue={empleadoActivo.certificacionesElite.join('\\n')}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Hard Skills Técnicos (1 por línea):</label>
                  <textarea
                    name="hardSkills"
                    defaultValue={empleadoActivo.hardSkills.join('\\n')}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Liderazgo & Soft Skills (1 por línea):</label>
                  <textarea
                    name="softSkills"
                    defaultValue={empleadoActivo.softSkills.join('\\n')}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Reglas de Negocio Estrictas (1 por línea):</label>
                <textarea
                  name="reglasNegocio"
                  defaultValue={empleadoActivo.entrenamiento.reglasNegocio.join('\\n')}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPestañaActiva('juego_oficina')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-black rounded-xl cursor-pointer shadow-lg shadow-blue-900/30 flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar Entrenamiento & Volver al Juego</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* ── CONTENIDO: VISTA DE ORGANIGRAMA JERÁRQUICO ── */}
      {pestañaActiva === 'organigrama' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1 overflow-y-auto space-y-8">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
              ESTRUCTURA DE MANDO CORPORATIVO
            </span>
            <h3 className="text-xl font-black text-white">Organigrama Oficial Gama Seguridad SpA</h3>
            <p className="text-xs text-slate-400">Jerarquía directiva, áreas operativas y líneas de reporte 24/7</p>
          </div>

          {/* Nivel 1: Gerencia General */}
          <div className="flex justify-center">
            <div
              onClick={() => {
                setEmpleadoSeleccionadoId('gerencia_general')
                setPestañaActiva('juego_oficina')
              }}
              className="bg-blue-950 border-2 border-blue-500/80 rounded-2xl p-4 w-72 text-center shadow-xl cursor-pointer hover:scale-105 transition hover:shadow-blue-900/50"
            >
              <div className="text-3xl mb-1">👔</div>
              <h4 className="font-black text-white text-sm">Don Tomás Toro-Moreno</h4>
              <p className="text-xs font-bold text-[#38bdf8]">Gerente General & CEO</p>
              <span className="inline-block mt-2 bg-blue-900 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full">
                Mando Supremo
              </span>
            </div>
          </div>

          {/* Línea conectora */}
          <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

          {/* Nivel 2: Asesoría Legal y DPO */}
          <div className="flex justify-center gap-6 flex-wrap">
            <div
              onClick={() => {
                setEmpleadoSeleccionadoId('legal_os10')
                setPestañaActiva('juego_oficina')
              }}
              className="bg-amber-950/60 border border-amber-600/80 rounded-2xl p-3.5 w-64 text-center shadow-lg cursor-pointer hover:scale-105 transition"
            >
              <div className="text-2xl mb-1">⚖️</div>
              <h4 className="font-black text-white text-xs">Lic. Claudio Valenzuela</h4>
              <p className="text-[11px] text-amber-300 font-bold">Director Legal & OS-10</p>
              <span className="inline-block mt-1 bg-amber-900/60 text-amber-200 text-[9px] font-mono px-2 py-0.5 rounded-full">
                Ley 21.659
              </span>
            </div>

            <div
              onClick={() => {
                setEmpleadoSeleccionadoId('ia_datos')
                setPestañaActiva('juego_oficina')
              }}
              className="bg-indigo-950/60 border border-indigo-600/80 rounded-2xl p-3.5 w-64 text-center shadow-lg cursor-pointer hover:scale-105 transition"
            >
              <div className="text-2xl mb-1">🔒</div>
              <h4 className="font-black text-white text-xs">Benjamín Tapia</h4>
              <p className="text-[11px] text-indigo-300 font-bold">Oficial DPO Datos Personales</p>
              <span className="inline-block mt-1 bg-indigo-900/60 text-indigo-200 text-[9px] font-mono px-2 py-0.5 rounded-full">
                Ley 21.719 APDP
              </span>
            </div>
          </div>

          {/* Línea conectora */}
          <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

          {/* Nivel 3: Áreas Operativas, Comerciales y Tecnológicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Rama Operaciones */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 border-b border-slate-800 pb-2">
                <Radio className="h-4 w-4" />
                <span>Área Operativa & CRA</span>
              </div>
              <div
                onClick={() => { setEmpleadoSeleccionadoId('cra_jefa'); setPestañaActiva('juego_oficina') }}
                className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚨</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Sofía Carvajal</h5>
                    <p className="text-[10px] text-slate-400">Jefa CRA 24/7</p>
                  </div>
                </div>
              </div>
              <div
                onClick={() => { setEmpleadoSeleccionadoId('cra_terreno'); setPestañaActiva('juego_oficina') }}
                className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔧</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Ignacio Riquelme</h5>
                    <p className="text-[10px] text-slate-400">Supervisor Técnico Terreno</p>
                  </div>
                </div>
              </div>
              <div
                onClick={() => { setEmpleadoSeleccionadoId('ia_compras'); setPestañaActiva('juego_oficina') }}
                className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Franco Navarro</h5>
                    <p className="text-[10px] text-slate-400">Jefe Abastecimiento & ERP</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rama Comercial */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
                <TrendingUp className="h-4 w-4" />
                <span>Área Comercial & Licitaciones</span>
              </div>
              <div
                onClick={() => { setEmpleadoSeleccionadoId('comercial_jefa'); setPestañaActiva('juego_oficina') }}
                className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-emerald-500 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">💼</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Valentina Lagos</h5>
                    <p className="text-[10px] text-slate-400">Gerente Comercial</p>
                  </div>
                </div>
              </div>
              <div
                onClick={() => { setEmpleadoSeleccionadoId('comercial_cuentas'); setPestañaActiva('juego_oficina') }}
                className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-emerald-500 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">📞</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Matías Morales</h5>
                    <p className="text-[10px] text-slate-400">Éxito de Clientes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rama IA y Software */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 border-b border-slate-800 pb-2">
                <Cpu className="h-4 w-4" />
                <span>Laboratorio IA & Cloud</span>
              </div>
              <div
                onClick={() => { setEmpleadoSeleccionadoId('ia_lead'); setPestañaActiva('juego_oficina') }}
                className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-purple-500 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Dr. Maximiliano Silva</h5>
                    <p className="text-[10px] text-slate-400">Director de IA</p>
                  </div>
                </div>
              </div>
              <div
                onClick={() => { setEmpleadoSeleccionadoId('ia_software'); setPestañaActiva('juego_oficina') }}
                className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-purple-500 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">💻</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Camila Vega</h5>
                    <p className="text-[10px] text-slate-400">Arquitecta de Software</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL DE REUNIÓN DE DIRECTORIO (MEMORÁNDUM EJECUTIVO) ── */}
      {mostrarMemorandumDirectorio && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="font-black text-white text-base">Reunión Extraordinaria de Directorio</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Gama Seguridad SpA • Sala de Consenso</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarMemorandumDirectorio(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Todos los 10 empleados IA han tomado sus asientos en la Sala de Directorio para alinear prioridades estratégicas, cumplimiento normativo OS-10 y proyección comercial del trimestre.
            </p>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Puntos de la Tabla en Discusión:</span>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div>1. Expansión a 1.500 abonados bajo el modelo RMR.</div>
                <div>2. Cero tolerancia en acreditación técnica OS10 ante Carabineros.</div>
                <div>3. Adjudicación de licitaciones públicas de cámaras y alarmas.</div>
                <div>4. Automatización total de la verificación por video con IA.</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMostrarMemorandumDirectorio(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md"
              >
                Supervisar Reunión en la Oficina
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
`;

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully wrote living office code. Total lines:', code.split('\n').length);
