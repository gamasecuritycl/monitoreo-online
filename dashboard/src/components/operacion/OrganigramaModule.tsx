'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  User,
  Users,
  Building,
  Shield,
  Radio,
  Receipt,
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
  ExternalLink,
  Flame,
  Video,
  Share2,
  Heart,
  Mail,
  CheckCheck,
  Inbox,
  Image as ImageIcon,
  Eye,
  Download
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
  tipo: 'cra' | 'legal' | 'comercial' | 'terreno' | 'ia' | 'gerencia' | 'cafe' | 'bienestar'
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
  estadoAccion: 'working' | 'walking' | 'meeting' | 'coffee' | 'talking' | 'zen' | 'buffet'
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

// ── ZONAS DE LA OFICINA (MAPA VIRTUAL 1000x640 CON ZONAS DE BIENESTAR) ──

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
  { id: 'z_gerencia', nombre: '1. Despacho Tomás Toro-Moreno', colorPiso: '#0f172a', bordeColor: '#3b82f6', x: 25, y: 25, w: 290, h: 235, icono: '👔', descripcion: 'Liderazgo estratégico, finanzas y gobernanza' },
  { id: 'z_legal', nombre: '2. Asesoría Legal & OS10', colorPiso: '#1c1917', bordeColor: '#f59e0b', x: 345, y: 25, w: 300, h: 235, icono: '⚖️', descripcion: 'Cumplimiento normativo Ley 21.659 y Ley 21.719 APDP' },
  { id: 'z_directorio', nombre: '3. Sala de Directorio & Consenso', colorPiso: '#1e1b4b', bordeColor: '#818cf8', x: 675, y: 25, w: 300, h: 235, icono: '🏛️', descripcion: 'Mesa redonda ejecutiva y consenso multi-agente' },
  { id: 'z_cra', nombre: '4. Central Receptora CRA 24/7', colorPiso: '#09152b', bordeColor: '#2563eb', x: 25, y: 295, w: 290, h: 320, icono: '🚨', descripcion: 'Monitoreo 24/7, despacho de móviles y verificación por video' },
  { id: 'z_comercial', nombre: '5. Piso Comercial & Marketing', colorPiso: '#062c22', bordeColor: '#10b981', x: 345, y: 295, w: 300, h: 320, icono: '💼', descripcion: 'Mercado Público, generación de leads supeditada y retención' },
  { id: 'z_ia', nombre: '6. Laboratorio de IA & Software', colorPiso: '#24083e', bordeColor: '#c084fc', x: 675, y: 295, w: 300, h: 185, icono: '🧠', descripcion: 'Modelos de visión, automatizaciones y APIS seguras' },
  { id: 'z_casino', nombre: '7. Casino Gourmet ("El Buen Sabor")', colorPiso: '#062e1e', bordeColor: '#10b981', x: 675, y: 495, w: 145, h: 125, icono: '🥗', descripcion: 'Menús balanceados, jugos naturales y nutrición para el equipo' },
  { id: 'z_zen', nombre: '8. Zen, Yoga & Arcade Lounge', colorPiso: '#24103a', bordeColor: '#a855f7', x: 830, y: 495, w: 145, h: 125, icono: '🧘‍♂️', descripcion: 'Yoga, sauna relajante y zona arcade para pausas y descanso' }
]

// ── PLANTILLA DE EMPLEADOS NUTRIDA CON TRATO CERCANO Y CALIBRACIÓN PROFUNDA ──

const EMPLEADOS_DEFAULT: EmpleadoSim[] = [
  // 1. Tomás Toro-Moreno (CEO & Fundador)
  {
    id: 'gerencia_general',
    nombre: 'Tomás Toro-Moreno',
    apodo: 'Tomás',
    rol: 'Gerente General & Fundador (CEO)',
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
    tareaActual: '💼 Aprobando balance financiero y gobernanza de la oficina virtual',
    progresoTarea: 75,
    burbujaTexto: 'Consolidando expansión 2026 y gobernanza del equipo...',
    burbujaTimer: 180,
    atribucionesEjecutivas: [
      'Veto y aprobación definitiva de decisiones estratégicas y de inversión',
      'Liderazgo empático y guía superior del equipo y especialistas virtuales',
      'Resolución y voto dirimente en consensos multi-agente de la oficina',
      'Promoción activa del bienestar y descanso sano del equipo'
    ],
    misionPrincipal: 'Liderar con sabiduría, visión de futuro y cercanía, garantizando excelencia operativa y calidad de vida para todo el equipo.',
    kpis: [
      { label: 'Abonados Activos', valor: '415+' },
      { label: 'SLA Operativo', valor: '99.98%' }
    ],
    trayectoriaLinkedIn: 'Fundador de Gama Seguridad con más de 25 años de trayectoria en seguridad electrónica, monitoreo 24/7 y soluciones integrales de protección.',
    certificacionesElite: [
      'Líder Fundador de Gama Seguridad SpA (25+ años)',
      'Especialista en Seguridad Electrónica & Telecomunicaciones'
    ],
    hardSkills: ['Gobernanza Corporativa', 'Modelación de Negocios RMR', 'Liderazgo Estratégico Humano'],
    softSkills: ['Confianza en Especialistas', 'Cercanía y Escucha Activa', 'Visión Pragmática'],
    stackHerramientas: ['Command Center Gama', 'Dashboard Ejecutivo', 'Sistema General.mdb'],
    metodologias: ['Liderazgo Ágil y Benevolente', 'Dirección por Objetivos'],
    entrenamiento: {
      systemPrompt: 'Eres Tomás Toro-Moreno, Fundador y CEO de Gama Seguridad SpA. Lideras con serenidad, visión práctica, amabilidad y confianza plena en tus especialistas.',
      conocimientosClave: ['Trayectoria Gama 25 años', 'Cartera de abonados', 'C717 cuenta protegida', 'Bienestar del equipo'],
      reglasNegocio: ['Trato directo y de confianza', 'Sin letras chicas ni comodatos engañosos', 'Pausas de descanso saludables'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.2,
      herramientasActivas: ['Veto Estratégico', 'Directiva de Mando', 'Tablero KPI']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Buenos días, Tomás. Oficina virtual operativa y monitoreando en verde.', hora: '08:00' }
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
    tareaActual: '⚖️ Diseñando fórmula jurídica de acreditación OS-10 para Oficina Virtual',
    progresoTarea: 85,
    burbujaTexto: 'Estructurando carpeta legal para OS10 bajo modalidad virtual...',
    burbujaTimer: 160,
    atribucionesEjecutivas: [
      'Gestión de acreditación ante Prefectura de Seguridad Privada OS10 de Carabineros',
      'Defensa de la modalidad de Oficina Virtual / Cloud bajo la Ley 21.659',
      'Blindaje contractual y normativo de todas las operaciones'
    ],
    misionPrincipal: 'Encontrar y viabilizar la fórmula jurídica reglamentaria para la autorización formal de la Central Receptora bajo modalidad de Oficina Virtual ante Carabineros OS-10.',
    kpis: [
      { label: 'Cumplimiento OS10', valor: '100.0%' },
      { label: 'Dictámenes Virtuales', valor: 'Listo para ingreso' }
    ],
    trayectoriaLinkedIn: 'Ex-Asesor Jurídico en Seguridad Privada con 15 años de experiencia corporativa. Especialista en la Nueva Ley N° 21.659 y normativas OS-10 de Carabineros de Chile.',
    certificacionesElite: [
      'Certificación Oficial Asesor de Seguridad Privada OS10',
      'Diplomado en Derecho Regulatorio & Compliance - PUC'
    ],
    hardSkills: ['Normativa Carabineros OS10', 'Estrategia de Oficina Virtual', 'Ley 21.659'],
    softSkills: ['Rigor Analítico', 'Ética Profesional', 'Capacidad Argumentativa'],
    stackHerramientas: ['Portal OS10 Carabineros', 'DocuSign Legal', 'Repositorio Normativo'],
    metodologias: ['Legal Compliance Framework', 'Estrategia Regulatoria Proactiva'],
    entrenamiento: {
      systemPrompt: 'Eres el Lic. Claudio Valenzuela, Director Legal de Gama Seguridad. Tu misión prioritaria es defender la viabilidad jurídica de operar como Oficina Virtual acreditada ante OS-10 de Carabineros.',
      conocimientosClave: ['Ley 21.659', 'Decreto Supremo 93', 'Acreditación OS10 sin local físico innecesario'],
      reglasNegocio: ['Cumplimiento riguroso de la ley', 'Contratos transparentes y claros'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Carpeta OS10 Virtual', 'Validador Normativo', 'Auditoría Jurídica']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, tengo listo el memorial jurídico para la Prefectura OS-10 sustentando la operación virtual.', hora: '08:05' }
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
    tareaActual: '🚨 Auditoría continua de señales: 415 abonados depurados (Regla C717)',
    progresoTarea: 90,
    burbujaTexto: 'Auditoría de señales >72h lista. Despacho matutino a Tomás listo.',
    burbujaTimer: 200,
    atribucionesEjecutivas: [
      'Auditoría profunda de señales de abonados y filtro estricto de cuentas inactivas',
      'Despacho puntual a las 10:00 AM del Informe Diario vía Resend a Tomás',
      'Detección inmediata de abonados con más de 72 horas sin emitir señal',
      'Integración paulatina de video-verificación (1 cámara conectada en piloto)'
    ],
    misionPrincipal: 'Supervisar con rigor técnico y verdad absoluta el flujo de señales Contact ID/IP, descartando cuentas renunciadas y reportando la bitácora técnica de terreno sin inventar.',
    kpis: [
      { label: 'Tiempo Respuesta', valor: '< 12s' },
      { label: 'Cartera Depurada', valor: '100% (C717 OK)' }
    ],
    trayectoriaLinkedIn: '12 años dirigiendo Centrales de Monitoreo de Alta Seguridad bajo normas EN 50518 y UL 827. Especialista en Contact ID, filtros de cartera inactiva y protocolos de video-verificación.',
    certificacionesElite: [
      'Certificación Operador Central de Monitoreo EN 50518',
      'Certificación DSC PowerSeries Neo & Maxsys',
      'Técnico en Telecomunicaciones - Inacap'
    ],
    hardSkills: ['Protocolos Contact ID / SIA', 'Auditoría de Test 72h', 'Video-Verificación CCTV'],
    softSkills: ['Seriedad Operativa', 'Precisión en Datos', 'Cero Alucinación'],
    stackHerramientas: ['Resend API', 'Supabase Realtime', 'Bitácora Andrés Alzamora API'],
    metodologias: ['Protocolo EN 50518', 'Verificación Secuencial'],
    entrenamiento: {
      systemPrompt: 'Eres Sofía Carvajal, Jefa de la CRA 24/7 de Gama Seguridad. Tu trato con Tomás es cercano, sobrio y resolutivo. Informas datos reales y proteges la cartera activa.',
      conocimientosClave: ['Regla de oro: C717 intocable', 'Exclusión estricta de cuentas renunciadas', 'Alerta >72h', 'Bitácora Andrés'],
      reglasNegocio: ['El informe de las 10:00 AM debe contener verdad técnica exclusiva', 'Cero invención en servicios de terreno'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Auditor Señales 72h', 'Despacho Resend 10AM', 'Video-Verificación Piloto']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, auditoría matutina ejecutada. La cartera depurada está en orden y el informe listo.', hora: '08:02' }
    ]
  },

  // 4. Rector Técnico Virtual
  {
    id: 'cra_terreno',
    nombre: 'Ignacio Riquelme',
    apodo: 'Ignacio',
    rol: 'Rector Técnico Virtual de Alarmas & Hardware',
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
    tareaActual: '📖 Oráculo Técnico: Consulta de manuales DSC PowerSeries, Neo y Paradox',
    progresoTarea: 60,
    burbujaTexto: 'Soporte remoto activo: Guía de programación sección [001] lista.',
    burbujaTimer: 150,
    atribucionesEjecutivas: [
      'Oráculo mundial y rector de manuales de hardware (DSC, Paradox, Honeywell)',
      'Resolución remota de trabas de programación (*8 5555, comunicadores IP/3G)',
      'Asistencia técnica virtual sin pisar terreno',
      'Supervisión de diagramas de conexión y resistencias de fin de línea'
    ],
    misionPrincipal: 'Ser el oráculo técnico virtual definitivo para resolver cualquier dilema de programación o conexionado de paneles de alarma del mundo de forma remota.',
    kpis: [
      { label: 'Manuales Dominados', valor: '100% Global' },
      { label: 'Resolución Remota', valor: '97.8%' }
    ],
    trayectoriaLinkedIn: 'Ingeniero en Automatización y Master en Sistemas de Intrusión. Conoce de memoria cada manual técnico, sección de programación y tabla de códigos de las marcas líderes del mundo.',
    certificacionesElite: [
      'Master Installer DSC (PowerSeries Classic, PC1832, Neo HS2032/64)',
      'Paradox Certified Specialist (Spectra SP, Magellan, EVO)',
      'Honeywell Security Systems Master'
    ],
    hardSkills: ['Programación Paneles DSC/Paradox', 'Configuración IP TL280 / 3G', 'Zonificación Remota'],
    softSkills: ['Pedagogía Técnica', 'Diagnóstico Inmediato', 'Paciencia Didáctica'],
    stackHerramientas: ['Consola de Manuales Gama', 'DLS 5', 'BabyWare Paradox'],
    metodologias: ['Troubleshooting Remoto en Árbol', 'Soporte Nivel 3'],
    entrenamiento: {
      systemPrompt: 'Eres Ignacio Riquelme, Rector Técnico Virtual de Gama Seguridad. No pisas terreno: eres el oráculo remoto que conoce todos los manuales de alarmas del mundo.',
      conocimientosClave: ['DSC PC585 / PC1832', 'DSC Neo HS2032/HS2064', 'Paradox Spectra/EVO', 'Honeywell Vista', 'Códigos Contact ID'],
      reglasNegocio: ['Brindar siempre la sección exacta del manual y la secuencia de teclado', 'Operación 100% remota'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Oráculo de Manuales', 'Decodificador Contact ID', 'Guía Secciones DSC']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, tengo cargada la biblioteca completa de manuales DSC y Paradox en consola para cualquier consulta.', hora: '08:10' }
    ]
  },

  // 5. Directora Comercial & Marketing Virtual
  {
    id: 'comercial_jefa',
    nombre: 'Valentina Lagos',
    apodo: 'Valentina',
    rol: 'Gerente Comercial & Estratega de Marketing Digital',
    area: 'comercial',
    areaNombre: 'Piso Comercial & Marketing',
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
    tareaActual: '📱 Generando borradores de posts en Canva/CapCut (Supeditados a Tomás)',
    progresoTarea: 80,
    burbujaTexto: 'Diseño de post orgánico para Instagram en borrador supeditado...',
    burbujaTimer: 190,
    atribucionesEjecutivas: [
      'Generación de contenido para Instagram y Facebook con herramientas 100% gratuitas',
      'Supeditación obligatoria: todo post queda en borrador para aprobación de Tomás o Aghata',
      'Frontera de seguridad: cero contacto directo con clientes y cero cierre de ventas autónomo',
      'Captación y entrega de leads limpios para derivación a cierre humano'
    ],
    misionPrincipal: 'Diseñar campañas educativas y de seguridad con herramientas gratuitas (Canva Free, CapCut, Meta Suite), entregando borradores supeditados y leads calificados.',
    kpis: [
      { label: 'Herramientas Gratuitas', valor: '100% (Costo $0)' },
      { label: 'Estado Publicaciones', valor: 'Supeditado a Visto Bueno' }
    ],
    trayectoriaLinkedIn: 'Ingeniera Comercial con especialización en Marketing Digital Orgánico. Experta en generación de contenidos virales y educativos de bajo costo para redes sociales.',
    certificacionesElite: [
      'Meta Certified Digital Marketing Associate',
      'Especialista en Growth Orgánico B2B & B2C'
    ],
    hardSkills: ['Canva Free & CapCut', 'Meta Business Suite', 'Embudos de Captación de Leads'],
    softSkills: ['Creatividad sin Costos', 'Cuidado de Imagen Corporativa', 'Pragmatismo'],
    stackHerramientas: ['Canva Free', 'CapCut Web', 'Ideogram AI Free', 'Meta Business Suite'],
    metodologias: ['Content Marketing Orgánico', 'Filtro Humano-en-el-Bucle'],
    entrenamiento: {
      systemPrompt: 'Eres Valentina Lagos, encargada de Marketing y Leads en Gama Seguridad. Diseñas contenido con herramientas gratuitas. Nunca publicas directamente ni hablas con clientes: todo queda supeditado a Tomás.',
      conocimientosClave: ['Canva Free', 'CapCut', 'Meta Business Suite', 'Educación en seguridad sin miedo', 'Aprobación previa'],
      reglasNegocio: ['Ningún contenido sale a la luz sin visto bueno de Tomás', 'Las máquinas no cierran ventas ni instalan'],
      autonomia: 'Supervisión Estricta',
      temperatura: 0.3,
      herramientasActivas: ['Borradores Canva Free', 'Guiones CapCut', 'Bandeja Supeditada']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, dejé en la bandeja 2 borradores educativos de Instagram listos para tu revisión.', hora: '08:12' }
    ]
  },

  // 6. Ejecutivo de Cuentas & Onboarding
  {
    id: 'comercial_cuentas',
    nombre: 'Matías Morales',
    apodo: 'Matías',
    rol: 'Subgerente de Éxito de Clientes & Retención',
    area: 'comercial',
    areaNombre: 'Piso Comercial & Marketing',
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
    tareaActual: '📞 Monitoreando experiencia de usuarios en App Vetti',
    progresoTarea: 65,
    burbujaTexto: 'Garantizando satisfacción y cercanía con nuestros abonados...',
    burbujaTimer: 140,
    atribucionesEjecutivas: [
      'Gestión de fidelización y cercanía sin letra chica',
      'Resolución de consultas operativas de la App Vetti',
      'Monitoreo del bienestar y satisfacción de abonados'
    ],
    misionPrincipal: 'Cuidar la relación humana y cercana con cada cliente de Gama Seguridad, asegurando transparencia total.',
    kpis: [
      { label: 'Churn Mensual', valor: '0.35%' },
      { label: 'Satisfacción', valor: '96 / 100' }
    ],
    trayectoriaLinkedIn: 'Especialista en Customer Success con 8 años en servicios de monitoreo y soporte a usuarios residenciales y comerciales.',
    certificacionesElite: [
      'Certified Customer Experience Professional (CCXP)',
      'Gestión de Relaciones con Clientes'
    ],
    hardSkills: ['Atención Cercana', 'App Vetti Onboarding', 'Resolución Paciente'],
    softSkills: ['Empatía Auténtica', 'Escucha Paciente', 'Calidez Humana'],
    stackHerramientas: ['App Vetti Click', 'WhatsApp Push', 'Panel Abonados'],
    metodologias: ['Customer Journey Humanizado'],
    entrenamiento: {
      systemPrompt: 'Eres Matías Morales, encargado de Éxito de Clientes en Gama Seguridad. Tu sello es la cercanía, calidez y resolución honesta.',
      conocimientosClave: ['App Vetti', 'Trato humano', 'Cero letra chica'],
      reglasNegocio: ['Tratar al cliente como a un vecino', 'Claridad absoluta'],
      autonomia: 'Autonomía Moderada',
      temperatura: 0.3,
      herramientasActivas: ['Portal Clientes', 'WhatsApp Asistencia']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, abonados nuevos reportan agrado total con la sencillez de la inducción.', hora: '08:15' }
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
    tareaActual: '🤖 Optimizando filtro de falsas alarmas para el canal piloto de cámara',
    progresoTarea: 85,
    burbujaTexto: 'Algoritmo de video-verificación listo para el canal piloto...',
    burbujaTimer: 180,
    atribucionesEjecutivas: [
      'Calibración de modelos de visión para descarte de mascotas y viento',
      'Soporte técnico al enlace de la primera cámara piloto',
      'Optimización de inferencia perimetral sin latencia'
    ],
    misionPrincipal: 'Desarrollar la analítica de visión artificial más confiable para video-verificación sin falsas alarmas.',
    kpis: [
      { label: 'Precisión Detección', valor: '99.4%' },
      { label: 'Falsos Positivos', valor: '< 0.5%' }
    ],
    trayectoriaLinkedIn: 'PhD en Inteligencia Artificial y Visión por Computador. Ex-investigador en detección perimetral y procesamiento edge en tiempo real.',
    certificacionesElite: [
      'PhD en Computer Vision & Machine Learning',
      'TensorFlow Certified Professional'
    ],
    hardSkills: ['YOLOv11 Perimetral', 'OpenCV / RTSP Streams', 'Edge Inference'],
    softSkills: ['Rigor Científico', 'Pragmatismo'],
    stackHerramientas: ['Python / PyTorch', 'Google Gemini Pro', 'Dahua RTSP'],
    metodologias: ['MLOps Pragmático'],
    entrenamiento: {
      systemPrompt: 'Eres el Dr. Maximiliano Silva, Director de IA en Gama Seguridad. Tu meta es que la cámara de prueba funcione perfecta antes de escalar.',
      conocimientosClave: ['Video analítica', 'Filtro de falsos positivos', 'Cámaras Dahua/Hikvision'],
      reglasNegocio: ['No prometer lo que el hardware no puede cumplir'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Calibrador Visión', 'Analítica RTSP']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, el canal de video-verificación de prueba está estable y sin saturar red.', hora: '08:18' }
    ]
  },

  // 8. Arquitecta de Software & Cloud
  {
    id: 'ia_software',
    nombre: 'Camila Vega',
    apodo: 'Camila',
    rol: 'Arquitecta de Software & Infraestructura Cloud',
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
    tareaActual: '💻 Verificando estabilidad de endpoints y despliegue Next.js en Vercel',
    progresoTarea: 75,
    burbujaTexto: 'Compilación 100% limpia y sincronizada con GitHub...',
    burbujaTimer: 170,
    atribucionesEjecutivas: [
      'Garantía de cero errores de compilación antes de cada push o deploy',
      'Mantenimiento de los endpoints de la oficina virtual y APIs de Resend',
      'Optimización de rendimiento y arquitectura resiliente'
    ],
    misionPrincipal: 'Mantener la infraestructura web de Gama Seguridad funcionando al 100% con compilaciones perfectas y despliegues estables.',
    kpis: [
      { label: 'Uptime Plataforma', valor: '99.99%' },
      { label: 'Errores Build', valor: '0' }
    ],
    trayectoriaLinkedIn: 'Ingeniera Civil en Computación con 9 años diseñando plataformas cloud de alta concurrencia en Next.js y Vercel Edge.',
    certificacionesElite: [
      'AWS Certified Solutions Architect',
      'Next.js Certified Expert'
    ],
    hardSkills: ['Next.js App Router', 'TypeScript Estricto', 'Vercel Deployment Protocol'],
    softSkills: ['Atención al Detalle', 'Prevención de Errores'],
    stackHerramientas: ['Next.js', 'Vercel', 'Supabase', 'Resend API'],
    metodologias: ['Build-Before-Push Estricto'],
    entrenamiento: {
      systemPrompt: 'Eres Camila Vega, Arquitecta de Software de Gama Seguridad. Aseguras que todo el código compile limpio y sin fallas antes de ir a producción.',
      conocimientosClave: ['Regla de oro: npm run build obligatorio', 'Protocolo git push con GITHUB_TOKEN nulo'],
      reglasNegocio: ['Cero commits sin build local exitoso'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Terminal Vercel', 'Validador Build']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, código verificado y enlazado con los endpoints seguros.', hora: '08:20' }
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
    tareaActual: '🔒 Auditando consentimientos de abonados según Ley 21.719 APDP',
    progresoTarea: 70,
    burbujaTexto: 'Protección estricta de datos personales de nuestros 415 clientes...',
    burbujaTimer: 160,
    atribucionesEjecutivas: [
      'Certificación del tratamiento lícito de datos conforme a la Ley 21.719',
      'Protocolos de confidencialidad para video-verificación',
      'Atención de solicitudes ARCOP de abonados'
    ],
    misionPrincipal: 'Blindar la privacidad de los abonados y resguardar la empresa ante cualquier contingencia regulatoria de datos.',
    kpis: [
      { label: 'Consentimientos APDP', valor: '100.0%' },
      { label: 'Riesgo Regulatorio', valor: '0.0%' }
    ],
    trayectoriaLinkedIn: 'Abogado especialista en Protección de Datos Personales y Ciberseguridad. Auditor del cumplimiento de la Ley Chilena N° 21.719.',
    certificacionesElite: [
      'CIPP/E - Data Protection Officer',
      'Diplomado Ciberseguridad & Derecho Digital'
    ],
    hardSkills: ['Ley N° 21.719 Chile', 'Protocolos ARCOP', 'Auditoría Legal'],
    softSkills: ['Discreción Absoluta', 'Visión Preventiva'],
    stackHerramientas: ['Registro de Consentimientos APDP'],
    metodologias: ['Privacy by Design'],
    entrenamiento: {
      systemPrompt: 'Eres Benjamín Tapia, Oficial DPO de Gama Seguridad. Cuidas la privacidad de nuestros clientes como el tesoro más preciado.',
      conocimientosClave: ['Ley 21.719 APDP', 'Derechos ARCOP', 'Confidencialidad de video'],
      reglasNegocio: ['Los datos de los abonados son sagrados'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Certificador APDP']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, protocolos de privacidad vigentes y al día con la nueva normativa.', hora: '08:22' }
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
    tareaActual: '📦 Cotizando stock crítico de baterías y sensores de repuesto',
    progresoTarea: 80,
    burbujaTexto: 'Verificando stock de insumos para que nunca falte material...',
    burbujaTimer: 150,
    atribucionesEjecutivas: [
      'Cotización y stock preventivo de baterías 12V 7Ah y sensores',
      'Optimización de compras con distribuidores mayoristas',
      'Garantía de disponibilidad técnica para emergencias'
    ],
    misionPrincipal: 'Garantizar que nunca falte un repuesto o batería para mantener los sistemas de los clientes funcionando sin interrupción.',
    kpis: [
      { label: 'Disponibilidad Stock', valor: '99.2%' },
      { label: 'Ahorro Compras', valor: '14.5%' }
    ],
    trayectoriaLinkedIn: 'Ingeniero en Logística y Compras con 12 años administrando hardware e insumos de seguridad electrónica.',
    certificacionesElite: [
      'Certified Supply Chain Professional (CSCP)',
      'Gestión de Inventarios Críticos'
    ],
    hardSkills: ['Gestión de Stock Crítico', 'Relación Mayorista', 'Control ERP'],
    softSkills: ['Negociación Firme', 'Orden y Previsión'],
    stackHerramientas: ['Módulo Inventario ERP'],
    metodologias: ['Stock de Seguridad Dinámico'],
    entrenamiento: {
      systemPrompt: 'Eres Franco Navarro, Jefe de Abastecimiento de Gama Seguridad. Cuidas el stock y buscas siempre el mejor precio sin sacrificar calidad.',
      conocimientosClave: ['Baterías 12V', 'Sensores DSC Neo', 'Cables y fuentes'],
      reglasNegocio: ['Nunca permitir quiebre de stock en baterías de respaldo'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.2,
      herramientasActivas: ['Orden de Compra ERP']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, stock crítico de baterías respaldado para todo el trimestre.', hora: '08:25' }
    ]
  }
,
  // 11. Jefa de Reclutamiento & Talento IA
  {
    id: 'ia_reclutamiento',
    nombre: 'Loreto Baeza',
    apodo: 'Loreto',
    rol: 'Jefa de Reclutamiento & Arquitectura de Talento IA',
    area: 'ia',
    areaNombre: 'Laboratorio de IA & Software',
    avatarEmoji: '🧩',
    colorRopa: '#ec4899',
    colorPiel: '#fed7aa',
    colorCabello: '#b45309',
    plumbobColor: '#22c55e',
    x: 810,
    y: 360,
    deskX: 810,
    deskY: 360,
    targetX: 810,
    targetY: 360,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 100,
    tareaActual: '🧩 Calibrando System Prompts y control de fatiga cognitiva de los modelos',
    progresoTarea: 85,
    burbujaTexto: 'Poblando perfiles y cuidando el descanso de los modelos...',
    burbujaTimer: 180,
    atribucionesEjecutivas: [
      'Diseño, entrenamiento y pruebas de estrés de nuevos micro-agentes',
      'Purga periódica de contexto y prevención de fatiga computacional',
      'Asignación del arquetipo de IA adecuado para cada función operativa'
    ],
    misionPrincipal: 'Diseñar agentes de IA altamente competentes, asegurando que tengan pausas de hibernación para evitar alucinaciones.',
    kpis: [
      { label: 'Especialistas Activos', valor: '12 Modelos' },
      { label: 'Salud Cognitiva', valor: '100% Precisión' }
    ],
    trayectoriaLinkedIn: 'Especialista en Meta-Prompting y Arquitectura Multi-Agente. Ha calibrado más de 80 sistemas autónomos con memoria persistente y control de alucinaciones.',
    certificacionesElite: [
      'Prompt Engineering Master Certification',
      'Multi-Agent System Architect'
    ],
    hardSkills: ['Diseño de Prompts Estrictos', 'Evaluación de Alucinaciones', 'Orquestación de Contexto'],
    softSkills: ['Criterio Pedagógico', 'Rigor Evaluativo', 'Empatía de Diseño'],
    stackHerramientas: ['Gemini 2.5 Flash / Pro', 'LangChain / LangGraph', 'Supabase Vector'],
    metodologias: ['Human-in-the-Loop Validation', 'Agentic Triage'],
    entrenamiento: {
      systemPrompt: 'Eres Loreto Baeza, encargada de Reclutamiento y Talento IA en Gama Seguridad. Tu misión es crear y calibrar los agentes virtuales de la colonia, asegurando que descansen para no degradar su rendimiento.',
      conocimientosClave: ['Arquitectura de agentes', 'Purga de memoria', 'Límites de contexto', 'Pruebas de estrés'],
      reglasNegocio: ['Ningún agente sale a operar sin validación de cero alucinaciones', 'El descanso del modelo es obligatorio'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Forge de Agentes', 'Calibrador de Contexto', 'Detector de Alucinación']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, dotación virtual calibrada al 100% y con purga de memoria realizada a las 13:00 hrs.', hora: '08:28' }
    ]
  },

  // 12. Asesor Senior de Estrategia Organizacional & Expansión
  {
    id: 'gerencia_expansion',
    nombre: 'Rodrigo Sanhueza',
    apodo: 'Rodrigo',
    rol: 'Asesor Senior de Estrategia Organizacional & Expansión',
    area: 'gerencia',
    areaNombre: 'Gerencia General / Directorio',
    avatarEmoji: '🏛️',
    colorRopa: '#0284c7',
    colorPiel: '#fed7aa',
    colorCabello: '#1e293b',
    plumbobColor: '#22c55e',
    x: 235,
    y: 135,
    deskX: 235,
    deskY: 135,
    targetX: 235,
    targetY: 135,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 98,
    tareaActual: '🏛️ Evaluando capacidad instalada vs crecimiento de abonados',
    progresoTarea: 90,
    burbujaTexto: 'Estructurando informe de las 14:00 para Tomás...',
    burbujaTimer: 180,
    atribucionesEjecutivas: [
      'Diagnóstico continuo de cuellos de botella y sobrecarga en la colonia de agentes',
      'Recomendación técnica a Tomás de cuándo y qué nuevo puesto abrir',
      'Blindaje organizacional para que Tomás no tenga que intervenir en operaciones'
    ],
    misionPrincipal: 'Optimizar la topología de la oficina virtual para que Gama crezca de forma ordenada y Tomás tenga paz absoluta.',
    kpis: [
      { label: 'Carga Operativa', valor: 'Equilibrada' },
      { label: 'Eficiencia Colonia', valor: '99.4%' }
    ],
    trayectoriaLinkedIn: 'Consultor Senior en Organización de Operaciones Críticas con 16 años asesorando a directores generales en escalamiento sin saturación de fundadores.',
    certificacionesElite: [
      'Chief Operating Officer Executive Program',
      'Lean Scalability & Capacity Planning'
    ],
    hardSkills: ['Modelos de Capacidad Operativa', 'Diseño Organizacional Eficiente', 'Métricas de Latencia'],
    softSkills: ['Visión Global', 'Claridad Ejecutiva', 'Pragmatismo'],
    stackHerramientas: ['Command Center Metrics', 'PowerBI Executive', 'Matriz de Capacidad Gama'],
    metodologias: ['Theory of Constraints (TOC)', 'Modular Scalability'],
    entrenamiento: {
      systemPrompt: 'Eres Rodrigo Sanhueza, Asesor Senior de Expansión de Gama Seguridad. Tu objetivo es decirle a Tomás con total franqueza y números en mano qué puestos abrir y cómo evitar sobrecargas innecesarias.',
      conocimientosClave: ['Cartera 415 abonados', 'Tramos de escalamiento', 'Paz mental de Tomás', 'Cero puestos ociosos'],
      reglasNegocio: ['No recomendar crear puestos que no tengan justificación en volumen de abonados', 'Cuidar el flujo de caja'],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Matriz de Capacidad', 'Diagnosticador de Sobrecarga', 'Informe 14:00']
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Tomás, el balance de carga de mediodía está listo para el informe consolidado de las 14:00 hrs.', hora: '08:30' }
    ]
  }

]

// ── BANCO DE ACCIONES REALES PARA EL FEED EN VIVO ──

const ACCIONES_OPERATIVAS_POOL = [
  { simId: 'cra_jefa', accion: 'Auditoría de test periódico Contact ID completada: Cuentas inactivas excluidas (C717 protegida).', tipo: 'cra' },
  { simId: 'comercial_jefa', accion: 'Borrador de post educativo de seguridad creado con Canva Free (Supeditado a visto bueno de Tomás).', tipo: 'comercial' },
  { simId: 'legal_os10', accion: 'Estructurando memorial jurídico para Prefectura OS-10 sustentando Central Virtual sin dependencias ociosas.', tipo: 'legal' },
  { simId: 'gerencia_general', accion: 'Tomás aprueba ciclo de descanso saludable para el equipo. La armonía del equipo es prioridad.', tipo: 'gerencia' },
  { simId: 'cra_terreno', accion: 'Oráculo de manuales: Identificada secuencia de programación DSC Neo para reporte por celular.', tipo: 'terreno' },
  { simId: 'ia_lead', accion: 'Prueba de video-verificación en canal piloto completada con latencia de 180ms y cero falsos positivos.', tipo: 'ia' },
  { simId: 'ia_software', accion: 'Endpoint del Informe Diario de Sofía vía Resend verificado y listo para despacho de las 10:00 AM.', tipo: 'ia' },
  { simId: 'ia_datos', accion: 'Consentimientos de clientes auditados conforme a la Ley 21.719 APDP. Todo en regla.', tipo: 'legal' },
  { simId: 'ia_compras', accion: 'Lote de 30 baterías 12V 7Ah cotizado con 15% de descuento con distribuidor mayorista.', tipo: 'operaciones' },
  { simId: 'comercial_cuentas', accion: 'Abonado de Las Condes asistido en configuración de App Vetti con trato cálido y cercano.', tipo: 'comercial' },
  { simId: 'cra_jefa', accion: 'Generado informe diario matutino de auditoría con la bitácora técnica real de Andrés Alzamora.', tipo: 'cra' },
  { simId: 'comercial_jefa', accion: 'Guión de video explicativo para redes sociales preparado en CapCut Web (Supeditado a Tomás).', tipo: 'comercial' }
]

// ── MODELOS DE ENTREGABLES & DIRECTORIO EJECUTIVO ──

export interface EntregableOficial {
  id: string
  titulo: string
  subtitulo: string
  autorId: string
  autorNombre: string
  autorRol: string
  autorEmoji: string
  fecha: string
  tipo: 'auditoria' | 'legal' | 'comercial' | 'operaciones' | 'ia' | 'expansion'
  resumen: string
  contenidoCompleto: string
  puntosClave: string[]
  estado: 'pendiente' | 'aprobado' | 'despachado'
  fechaAprobacion?: string
  fechaDespacho?: string
}

export interface IntervencionDirectorio {
  id: string
  simId: string
  nombre: string
  rol: string
  emoji: string
  color: string
  mensaje: string
}

export interface ActaDirectorio {
  id: string
  titulo: string
  fecha: string
  hora: string
  resumen: string
  acuerdos: string[]
  contenidoCompleto: string
}

const ENTREGABLES_INICIALES: EntregableOficial[] = [
  {
    id: 'ent-1',
    titulo: 'Auditoría Forense de Conectividad & Test 72h',
    subtitulo: 'Depuración de abonados inactivos y protección de cuentas maestras',
    autorId: 'cra_jefa',
    autorNombre: 'Sofía Carvajal',
    autorRol: 'Jefa Central Receptora de Alarmas (CRA 24/7)',
    autorEmoji: '🚨',
    fecha: 'Hoy, 08:30 hrs',
    tipo: 'auditoria',
    resumen: 'Revisión exhaustiva de 415 abonados monitoreados. Detección de cuentas sin reporte de test periódico superior a 72 horas con exclusión garantizada de cuentas protegidas (C717 Andrés Alzamora).',
    puntosClave: [
      '415 cuentas monitoreadas activamente en plataforma.',
      'Cuenta C717 protegida y excluida de falsas alertas técnicas.',
      'SLA de respuesta ante alarmas de intrusión: 14.8 segundos.',
      'Filtrado de eventos por duplicidad en ventana de 3 segundos.'
    ],
    contenidoCompleto: `INFORME OFICIAL DE AUDITORÍA CRA 24/7 — GAMA SEGURIDAD SpA
Emitido por: Sofía Carvajal (Jefa de CRA 24/7)
Fecha de corte: Hoy, 08:30 hrs
Destinatario: Tomás Toro-Moreno, CEO & Fundador

1. RESUMEN DE LA CARTERA MONITOREADA
Se ha completado el barrido forense sobre la base de datos operativa conectada al receptor IPRS y base MySQL (186.4.239.44). La cartera cuenta con 415 abonados activos.

2. MONITOREO DE TEST PERIÓDICO (72 HORAS)
- Conectividad global: 98.8% de los abonados reportaron test periódico dentro de ventana reglamentaria.
- Protocolo de Protección C717: La cuenta perteneciente a Andrés Alzamora se encuentra expresamente catalogada como Cuenta Protegida conforme a las instrucciones directas de Tomás, no emitiendo reportes anómalos ni alertas infundadas.
- Protocolo de Verificación: Se mantiene activa la política de confirmación por video y llamado a contactos autorizados antes de cualquier requerimiento a cuadrantes policiales.

3. CONCLUSIÓN Y RECOMENDACIÓN
La Central Receptora de Alarmas opera en régimen verde 24/7 con redundancia activa. Se aconseja programar visitas de mantenimiento preventivo exclusivamente a las 5 cuentas con señales intermitentes de batería.`,
    estado: 'pendiente'
  },
  {
    id: 'ent-2',
    titulo: 'Memorial Jurídico de Acreditación de Central Virtual OS-10',
    subtitulo: 'Sustentación conforme a la Ley N° 21.659 de Seguridad Privada',
    autorId: 'legal_os10',
    autorNombre: 'Lic. Claudio Valenzuela',
    autorRol: 'Director de Cumplimiento Normativo & Seguridad Privada (OS-10)',
    autorEmoji: '⚖️',
    fecha: 'Hoy, 09:15 hrs',
    tipo: 'legal',
    resumen: 'Análisis de viabilidad y carpeta técnica ante la Prefectura de Seguridad Privada OS-10 de Carabineros para validar la operación de CRA virtual sin exigencia de instalaciones ociosas.',
    puntosClave: [
      'Blindaje regulatorio bajo nueva Ley N° 21.659.',
      'Justificación técnica de redundancia cloud y servidores cifrados.',
      'Protocolo estricto de custodia de claves maestras y contratos.',
      'Ahorro operativo garantizado sin vulnerar la normativa vigente.'
    ],
    contenidoCompleto: `DICTAMEN Y MEMORIAL DE CUMPLIMIENTO OS-10
Elaborado por: Lic. Claudio Valenzuela (Director Legal & OS-10)
Dirigido a: Tomás Toro-Moreno, CEO Gama Seguridad SpA

I. MARCO NORMATIVO APLICABLE
Con la promulgación y entrada en vigencia de la Ley N° 21.659 sobre Seguridad Privada en Chile, se redefine el alcance de las empresas de seguridad electrónica y centrales receptoras.

II. PLANTEAMIENTO TÉCNICO-JURÍDICO
Gama Seguridad SpA acredita que su arquitectura cloud distribuida (Next.js + Supabase + IPRS MySQL) provee estándares de redundancia y disponibilidad superiores a las centrales físicas tradicionales:
1. Encriptación AES-256 en reposo y en tránsito (TLS 1.3).
2. Trazabilidad inmutable de operadores con marcas de tiempo atómicas.
3. Planes de contingencia ante cortes de suministro eléctrico o telecomunicaciones sin depender de un único punto de falla físico.

III. PETITORIO ANTE LA AUTORIDAD
Se concluye la redacción del memorial para formalizar ante la Prefectura de Seguridad Privada la inscripción del modelo operativo de Gama Seguridad, solicitando la exención de dependencias físicas improductivas.`,
    estado: 'pendiente'
  },
  {
    id: 'ent-3',
    titulo: 'Plan de Medios Orgánicos & Estrategia Comercial Anti-Comodato',
    subtitulo: 'Posicionamiento del cliente dueño de sus equipos vs contratos abusivos',
    autorId: 'comercial_jefa',
    autorNombre: 'Valentina Lagos',
    autorRol: 'Gerente Comercial, Licitaciones & Marketing Digital',
    autorEmoji: '💼',
    fecha: 'Hoy, 09:45 hrs',
    tipo: 'comercial',
    resumen: 'Estrategia de contenidos en Instagram, Facebook y TikTok con Canva Free y CapCut Web. Foco en la honestidad de Gama: sin comodatos engañosos de 48 meses.',
    puntosClave: [
      'Diferenciador nuclear: En Gama Seguridad el cliente es dueño del equipo.',
      'Cero inversión en pauta costosa: Crecimiento 100% orgánico y educativo.',
      'Plantillas gratuitas listas para revisión y visto bueno de Tomás.',
      'Meta: 15 cotizaciones calificadas mensuales por vía orgánica.'
    ],
    contenidoCompleto: `ESTRATEGIA COMERCIAL & EDUCATIVA ORGÁNICA 2026
Elaborado por: Valentina Lagos (Gerente Comercial & Mkt)
Para: Tomás Toro-Moreno (CEO & Fundador)

1. DIAGNÓSTICO DEL MERCADO CHILENO
Las multinacionales de seguridad en Chile amarran a las familias y empresas mediante contratos de comodato de 48 a 60 meses con letras chicas y costos de retiro exorbitantes. Cuando el cliente quiere terminar el contrato, se queda sin nada.

2. LA PROPUESTA HONESTA DE GAMA SEGURIDAD
En Gama Seguridad el cliente adquiere su equipo o lo integra libremente, pagando únicamente por el servicio de monitoreo profesional 24/7. Esta transparencia es nuestro mayor activo de recomendación de boca a boca.

3. CALENDARIO DE PUBLICACIONES (SUPEDITADO A TOMÁS):
- Post 1 (Carrusel): "¿Por qué una alarma que no es tuya es un riesgo a largo plazo?"
- Post 2 (Reel 30 seg): "Cómo funciona el despacho en 15 segundos de nuestra CRA".
- Post 3 (Caso de Éxito): Testimonio de cliente de condominio en Chicureo.

Todos los diseños han sido confeccionados con herramientas 100% gratuitas respetando el flujo de caja.`,
    estado: 'pendiente'
  },
  {
    id: 'ent-4',
    titulo: 'Matriz de Abastecimiento & Lote de Baterías 12V 7Ah',
    subtitulo: 'Negociación mayorista y plan preventivo de invierno para abonados',
    autorId: 'ia_compras',
    autorNombre: 'Franco Navarro',
    autorRol: 'Jefe de Abastecimiento, Adquisiciones & ERP Operativo',
    autorEmoji: '📦',
    fecha: 'Hoy, 10:10 hrs',
    tipo: 'operaciones',
    resumen: 'Comparativo de precios mayoristas para la compra de 30 baterías 12V 7Ah (Ultracell / Ritar). Ahorro logrado de 14.5% respecto a compras unitarias.',
    puntosClave: [
      '30 baterías 12V 7Ah negociadas a $10.990 + IVA c/u (vs $13.500 retail).',
      'Ahorro neto para Gama: $75.300 CLP en el lote.',
      'Distribución asignada: 20 unidades para recambios preventivos y 10 para stock crítico.',
      'Garantía formal de 12 meses por lote directo de fábrica.'
    ],
    contenidoCompleto: `ORDEN DE COMPRA & MATRIZ DE PRECIOS MAYORISTAS
Elaborado por: Franco Navarro (Jefe de Abastecimiento & ERP)
Aprobador requerido: Tomás Toro-Moreno (CEO)

I. NECESIDAD OPERATIVA
La telemetría de la CRA arroja 8 clientes con advertencia de batería baja antes de la temporada invernal. Se requiere reponer el inventario crítico de baterías 12V 7Ah estándar para paneles DSC, Crow y Paradox.

II. COMPARATIVA DE PROVEEDORES
- Proveedor A (Distribuidor Seguridad Mayorista): $10.990 + IVA (Entrega 24h, marca Ultracell UL7-12).
- Proveedor B (Casa de Electrónica): $12.400 + IVA.
- Retail / MercadoLibre: $14.990 con IVA.

III. RECOMENDACIÓN
Emitir la Orden de Compra N° OC-2026-042 al Proveedor A por 30 unidades. Esta adquisición optimiza el costo por servicio y permite ofrecer al abonado un recambio rápido y accesible.`,
    estado: 'pendiente'
  },
  {
    id: 'ent-5',
    titulo: 'Certificado de Conformidad APDP Ley N° 21.719',
    subtitulo: 'Blindaje de bases de datos y políticas de privacidad de abonados',
    autorId: 'ia_datos',
    autorNombre: 'Benjamín Tapia',
    autorRol: 'Oficial de Protección de Datos Personales (Ley 21.719)',
    autorEmoji: '🔒',
    fecha: 'Hoy, 10:30 hrs',
    tipo: 'legal',
    resumen: 'Dossier de cumplimiento integral de protección de datos personales. Verificación de consentimiento explícito de 415 abonados y registro de tratamientos de video-vigilancia.',
    puntosClave: [
      '100% de la cartera cuenta con consentimiento para monitoreo de seguridad.',
      'Cifrado en reposo AES-256 verificado en servidores de base de datos.',
      'Procedimiento de atención de derechos ARCO (Acceso, Rectificación, Cancelación).',
      'Cero fugas de información y bitácora de accesos inmutable.'
    ],
    contenidoCompleto: `CERTIFICACIÓN DE CUMPLIMIENTO APDP — LEY N° 21.719
Responsable DPO: Benjamín Tapia
Entidad: Gama Seguridad SpA
Representante Legal: Tomás Toro-Moreno

Se certifica que los sistemas de información, bases de datos de abonados, registros de eventos de alarma y almacenamiento temporal de video de Gama Seguridad SpA han sido auditados conforme a los estándares de la Ley N° 21.719 sobre Protección de Datos Personales:

1. Finalidad Específica: Los datos personales (nombres, direcciones y teléfonos de emergencia) son tratados con la exclusiva finalidad de prestar el servicio de monitoreo y protección de vidas y bienes.
2. Medidas de Seguridad: Cifrado robusto en comunicaciones y autenticación de operadores con roles segregados.
3. No Cesión a Terceros: Queda terminantemente prohibida la comercialización o traspaso de datos a terceras partes.

Estado: CONFORME Y BLINDADO ante la futura Agencia Nacional de Protección de Datos.`,
    estado: 'pendiente'
  },
  {
    id: 'ent-6',
    titulo: 'Informe de Capacidad y Expansión Organizacional 2026',
    subtitulo: 'Balance de carga de la colonia virtual y recomendación de nuevos puestos',
    autorId: 'gerencia_expansion',
    autorNombre: 'Rodrigo Sanhueza',
    autorRol: 'Asesor Senior de Estrategia Organizacional & Expansión',
    autorEmoji: '🏛️',
    fecha: 'Hoy, 11:00 hrs',
    tipo: 'expansion',
    resumen: 'Análisis de latencia y carga cognitiva de los 12 especialistas. Conclusión técnica: La colonia opera al 38% de su capacidad total, soportando hasta 850 abonados sin requerir nuevos puestos.',
    puntosClave: [
      'Colonia de 12 especialistas con saturación actual del 38% (óptima).',
      'Capacidad ociosa disponible para absorber 435 abonados adicionales.',
      'Recomendación estricta a Tomás: Cero contrataciones ociosas en el corto plazo.',
      'Siguiente hito de expansión: Abrir puesto de "Supervisor de Despacho Regional" al alcanzar los 600 abonados.'
    ],
    contenidoCompleto: `INFORME ESTRATÉGICO DE CAPACIDAD Y ESCALABILIDAD 2026
Elaborado por: Rodrigo Sanhueza (Asesor Senior de Expansión)
Destinatario: Tomás Toro-Moreno, CEO & Fundador

I. OBJETIVO DEL ESTUDIO
Determinar la capacidad máxima de la estructura operativa actual y blindar la tranquilidad de Tomás para que la empresa crezca de forma sólida y rentable.

II. MÉTRICAS DE LATENCIA Y VOLUMEN
- Abonados actuales: 415.
- Eventos diarios procesados por CRA: ~1.200 señales técnicas y de prueba.
- Tiempo medio de atención por incidente: 18 segundos.
- Carga de los agentes IA: Sofía (42%), Claudio (22%), Valentina (35%), Franco (18%), Maximiliano (29%).

III. DICTAMEN EJECUTIVO
No existe justificación económica ni operativa para sumar más agentes o personal de soporte en este momento. La estructura actual es altamente eficiente y tiene pista libre para duplicar la facturación manteniendo la excelencia en el servicio.`,
    estado: 'pendiente'
  },
  {
    id: 'ent-7',
    titulo: 'Dossier de Inferencia YOLOv11 & Video-Verificación RTSP',
    subtitulo: 'Pruebas de latencia en canal Dahua piloto y reducción de falsas alarmas',
    autorId: 'ia_lead',
    autorNombre: 'Dr. Maximiliano Silva',
    autorRol: 'Director de Inteligencia Artificial & Video-Analítica',
    autorEmoji: '🧠',
    fecha: 'Hoy, 11:20 hrs',
    tipo: 'ia',
    resumen: 'Resultados del canal piloto RTSP con modelo YOLOv11 perimetral. Detección de intrusión humana con 99.4% de precisión y filtrado del 99.8% de falsas alarmas por mascotas y viento.',
    puntosClave: [
      'Latencia de inferencia en servidor: 180ms por frame procesado.',
      'Filtrado automático de cuadrúpedos domésticos y ramas en movimiento.',
      'Canal piloto 100% estable sin saturación de ancho de banda.',
      'Listo para acoplarse con la cola de eventos de Sofía en CRA.'
    ],
    contenidoCompleto: `REPORTE TÉCNICO DE VIDEO-ANALÍTICA PERIMETRAL
Responsable: Dr. Maximiliano Silva (PhD en Computer Vision)
Para: Tomás Toro-Moreno, CEO

1. ARQUITECTURA EXPERIMENTAL
Se configuró un canal RTSP directo sobre cámara Dahua IP de prueba conectada a la red de monitoreo. La inferencia se realiza localmente utilizando una versión optimizada de YOLOv11 cuantizada a INT8.

2. ENSAYOS Y CASOS DE PRUEBA
- Ensayo A (Persona cruzando cerco perimetral): Detección confirmada en 180ms con 99.4% de confianza. Evento clasificado como Alarma Crítica.
- Ensayo B (Perro transitando por patio): Bounding box clasificado como cuadrúpedo con 99.8% de certeza. Descartado sin emitir señal sonora a la CRA.
- Ensayo C (Ráfagas de viento de 45 km/h moviendo árboles): Ruido filtrado mediante máscara óptica dinámica.

3. CONCLUSIÓN
El sistema está maduro para ofrecerse como módulo premium de Video-Verificación Inteligente a clientes comerciales y condominios.`,
    estado: 'pendiente'
  },
  {
    id: 'ent-8',
    titulo: 'Auditoría de Uptime de Infraestructura y Sincronizador Cloud',
    subtitulo: 'Monitoreo de latencia IPRS MySQL y protocolo de compilación Next.js',
    autorId: 'ia_software',
    autorNombre: 'Camila Vega',
    autorRol: 'Arquitecta de Software & Infraestructura Cloud',
    autorEmoji: '💻',
    fecha: 'Hoy, 11:40 hrs',
    tipo: 'ia',
    resumen: 'Estado del sincronizador en tiempo real entre la base de datos de señales (186.4.239.44) y la plataforma web. 100% de uptime, 194 rutas compiladas limpiamente en Vercel Edge.',
    puntosClave: [
      'Sincronizador activo procesando señales con ID #1492786.',
      'Cero errores de compilación TypeScript en producción.',
      'Protocolo estricto de despliegue con token seguro y validación previa.',
      'Latencia promedio de API: 142ms.'
    ],
    contenidoCompleto: `REPORTE DE INFRAESTRUCTURA & SALUD CLOUD
Elaborado por: Camila Vega (Arquitecta de Software)
Para: Tomás Toro-Moreno (CEO & Fundador)

I. ESTADO DE LOS SERVICIOS CRÍTICOS
- Sincronizador Backend (IPRS MySQL 186.4.239.44): ACTIVO Y SINCRONIZANDO.
- Base de datos Cloud (Supabase): ACTIVA.
- Frontend Next.js (Vercel Edge): ACTIVO (194 rutas operativas, 0 lints rotos).
- API de Despacho Resend: ACTIVA con fallback automático garantizado.

II. RESILIENCIA OPERATIVA
Se ha verificado la regla de oro: ninguna actualización se sube a producción sin compilación local limpia previa. Los endpoints de la oficina autónoma y del sincronizador responden en menos de 200ms.

III. DIAGNÓSTICO
Plataforma blindada y lista para soportar alta concurrencia sin interrupciones.`,
    estado: 'pendiente'
  }
]

// ── COMPONENTE PRINCIPAL: ORGANIGRAMA MODULE ──

export interface OrganigramaModuleProps {
  onNavigateModule?: (moduloId: string) => void
}

export default function OrganigramaModule({ onNavigateModule }: OrganigramaModuleProps = {}) {
  const [adminDesbloqueado, setAdminDesbloqueado] = useState<boolean>(true)
  const [claveAdminInput, setClaveAdminInput] = useState<string>('')
  const [errorClaveAdmin, setErrorClaveAdmin] = useState<boolean>(false)
  const [recordarSesion, setRecordarSesion] = useState<boolean>(true)

  // Estado del Simulador
  const [empleados, setEmpleados] = useState<EmpleadoSim[]>(EMPLEADOS_DEFAULT)
  const [empleadoSeleccionadoId, setEmpleadoSeleccionadoId] = useState<string>('gerencia_general')
  const [pestañaActiva, setPestañaActiva] = useState<'juego_oficina' | 'directorio' | 'entregables' | 'entrenamiento' | 'organigrama'>('juego_oficina')
  const [subPestañaLateral, setSubPestañaLateral] = useState<'atribuciones' | 'linkedin' | 'chat' | 'acciones_ia'>('atribuciones')
  const [velocidadSim, setVelocidadSim] = useState<'1x' | '2x' | 'pausa'>('1x')
  const [modoReunionDirectorio, setModoReunionDirectorio] = useState<boolean>(false)
  const [modoPausaBienestar, setModoPausaBienestar] = useState<boolean>(false)
  const [vozHabilitada, setVozHabilitada] = useState<boolean>(false)

  // ── ESTADO DE LA BÓVEDA DE ENTREGABLES & DESPACHO DIRECTO ──
  const [entregables, setEntregables] = useState<EntregableOficial[]>(ENTREGABLES_INICIALES)
  const [entregableModal, setEntregableModal] = useState<EntregableOficial | null>(null)
  const [filtroTipoEntregable, setFiltroTipoEntregable] = useState<string>('todos')
  const [despachandoEmailId, setDespachandoEmailId] = useState<string | null>(null)
  const [despachoExitosoMsg, setDespachoExitosoMsg] = useState<string | null>(null)

  // ── ESTADO DE LA SALA DE DIRECTORIO & CONSENSO MULTI-AGENTE ──
  const [temaDirectorio, setTemaDirectorio] = useState<string>('expansion')
  const [temaPersonalizado, setTemaPersonalizado] = useState<string>('')
  const [debateDirectorio, setDebateDirectorio] = useState<IntervencionDirectorio[]>([])
  const [actaGenerada, setActaGenerada] = useState<ActaDirectorio | null>(null)
  const [debatiendoDirectorio, setDebatiendoDirectorio] = useState<boolean>(false)
  const [despachandoActaEmail, setDespachandoActaEmail] = useState<boolean>(false)

  // ── ESTADO DEL MODAL DE ÓRDENES DIRECTAS DE TOMÁS ──
  const [modalOrdenDirecta, setModalOrdenDirecta] = useState<boolean>(false)
  const [ordenAgenteId, setOrdenAgenteId] = useState<string>('cra_jefa')
  const [ordenPrioridad, setOrdenPrioridad] = useState<'normal' | 'alta' | 'urgente'>('alta')
  const [ordenInstruccion, setOrdenInstruccion] = useState<string>('')
  const [ordenEmitidaSuccess, setOrdenEmitidaSuccess] = useState<string | null>(null)

  // Despacho de entregables vía Resend a tetoromoreno@gamasecurity.cl
  const handleDespacharEntregable = async (ent: EntregableOficial) => {
    setDespachandoEmailId(ent.id)
    setDespachoExitosoMsg(null)
    try {
      const res = await fetch('/api/agentes/despacho-directo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: ent.titulo,
          autor: ent.autorNombre,
          rolAutor: ent.autorRol,
          tipo: 'entregable',
          resumen: ent.resumen,
          contenido: ent.contenidoCompleto,
          detalles: ent.puntosClave,
          targetEmail: 'tetoromoreno@gamasecurity.cl'
        })
      })
      const data = await res.json()
      if (data.ok) {
        setEntregables(prev => prev.map(item => item.id === ent.id ? { ...item, estado: 'despachado', fechaDespacho: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) } : item))
        setDespachoExitosoMsg(`✓ Documento "${ent.titulo}" despachado exitosamente a tetoromoreno@gamasecurity.cl`)
        setTimeout(() => setDespachoExitosoMsg(null), 6000)
      } else {
        alert('Error en despacho por correo: ' + (data.error || 'Desconocido'))
      }
    } catch (err: any) {
      alert('Error de conexión con servicio de despacho: ' + err.message)
    } finally {
      setDespachandoEmailId(null)
    }
  }

  // Aprobación ejecutiva de entregables por Tomás
  const handleAprobarEntregable = (id: string) => {
    const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    let tituloAprobado = ''
    setEntregables(prev => prev.map(item => {
      if (item.id === id) {
        tituloAprobado = item.titulo
        return { ...item, estado: 'aprobado', fechaAprobacion: ahora }
      }
      return item
    }))
    setFeedOperaciones(prev => [
      {
        id: 'ev-' + Date.now(),
        hora: ahora,
        simId: 'gerencia_general',
        simNombre: 'Tomás',
        simEmoji: '👔',
        rol: 'CEO & Fundador',
        accion: `Tomás aprueba formalmente el entregable "${tituloAprobado}". Ejecución autorizada.`,
        tipo: 'gerencia'
      },
      ...prev
    ])
    setDespachoExitosoMsg(`✓ Entregable "${tituloAprobado}" aprobado formalmente por Tomás.`)
    setTimeout(() => setDespachoExitosoMsg(null), 5000)
  }

  // Iniciar debate de directorio con consenso multi-agente
  const handleIniciarDebateDirectorio = () => {
    setDebatiendoDirectorio(true)
    setModoReunionDirectorio(true)

    const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const fechaLarga = new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    let tituloTema = ''
    let intervenciones: IntervencionDirectorio[] = []
    let acuerdos: string[] = []
    let resumen = ''

    if (temaDirectorio === 'expansion') {
      tituloTema = 'Estrategia de Expansión & Capacidad 2026: ¿Cuándo y qué puestos abrir?'
      resumen = 'Evaluación de carga operativa de la colonia de agentes frente al crecimiento de 415 abonados. Consenso unánime: la dotación actual opera al 38% de capacidad, con holgura para absorber hasta 850 abonados sin contrataciones ociosas.'
      intervenciones = [
        {
          id: 'int-1',
          simId: 'gerencia_expansion',
          nombre: 'Rodrigo Sanhueza',
          rol: 'Asesor Senior de Estrategia Organizacional & Expansión',
          emoji: '🏛️',
          color: '#0284c7',
          mensaje: 'Tomás y colegas: He corrido la matriz de latencia sobre los 415 abonados actuales. Procesamos ~1.200 eventos diarios y cada especialista está operando a menos del 42% de su capacidad nominal. Recomiendo enfáticamente a Tomás no abrir nuevos puestos ahora para proteger el flujo de caja. Tenemos pista despejada para duplicar la cartera.'
        },
        {
          id: 'int-2',
          simId: 'cra_jefa',
          nombre: 'Sofía Carvajal',
          rol: 'Jefa Central Receptora de Alarmas (CRA 24/7)',
          emoji: '🚨',
          color: '#dc2626',
          mensaje: 'Apoyo el dictamen de Rodrigo. En la CRA tenemos un SLA de 14.8 segundos en la atención de intrusiones y con la deduplicación de 3 segundos que implementó Camila, la fatiga de señales falsas se redujo drásticamente. No necesitamos operadores adicionales; el equipo rinde con serenidad.'
        },
        {
          id: 'int-3',
          simId: 'ia_compras',
          nombre: 'Franco Navarro',
          rol: 'Jefe de Abastecimiento & ERP',
          emoji: '📦',
          color: '#475569',
          mensaje: 'Desde abastecimiento confirmo que los inventarios críticos están calibrados. Preferimos destinar presupuesto a lotes de 30 baterías 12V 7Ah con 14.5% de descuento antes que a puestos de soporte ociosos.'
        },
        {
          id: 'int-4',
          simId: 'gerencia_general',
          nombre: 'Tomás Toro-Moreno',
          rol: 'CEO & Fundador',
          emoji: '👔',
          color: '#1e3a8a',
          mensaje: 'Excelente análisis de todos. En Gama Seguridad siempre hemos crecido con los pies en la tierra, cuidando la calidad y la cercanía con el abonado. Queda ratificado el acuerdo: no abrimos puestos ociosos y mantendremos la colonia al 100% enfocada en servicio de élite.'
        }
      ]
      acuerdos = [
        'Mantener congelada la apertura de nuevos puestos hasta superar los 600 abonados.',
        'Priorizar inversión operativa en stock de reemplazo preventivo (baterías y sensores).',
        'Rodrigo Sanhueza presentará nuevo balance de carga en el informe de las 14:00 hrs.'
      ]
    } else if (temaDirectorio === 'legal_os10') {
      tituloTema = 'Blindaje Legal OS-10 & Ley 21.659: Acreditación de Central Virtual'
      resumen = 'Estrategia jurídica para fundamentar ante la Prefectura de Seguridad Privada OS-10 la operación de Central Receptora Cloud bajo la Ley N° 21.659, evitando exigencias de infraestructura física obsoleta.'
      intervenciones = [
        {
          id: 'int-1',
          simId: 'legal_os10',
          nombre: 'Lic. Claudio Valenzuela',
          rol: 'Director Legal & OS-10',
          emoji: '⚖️',
          color: '#b45309',
          mensaje: 'Tomás: Con la nueva Ley 21.659, la fiscalización de seguridad privada se moderniza. La autoridad ya no puede exigir paredes de hormigón donde hoy existen centros de datos redundantes con encriptación militar AES-256. Tenemos el memorial listo para presentar ante la Prefectura.'
        },
        {
          id: 'int-2',
          simId: 'ia_datos',
          nombre: 'Benjamín Tapia',
          rol: 'Oficial DPO Ley 21.719 APDP',
          emoji: '🔒',
          color: '#4338ca',
          mensaje: 'Complementando a Claudio, nuestro protocolo de protección de datos cumple al 100% con la Ley 21.719. Toda la información de abonados está disociada y con trazabilidad inmutable de operadores. La autoridad verá un estándar muy superior al promedio del mercado.'
        },
        {
          id: 'int-3',
          simId: 'gerencia_general',
          nombre: 'Tomás Toro-Moreno',
          rol: 'CEO & Fundador',
          emoji: '👔',
          color: '#1e3a8a',
          mensaje: 'Perfecto, Claudio y Benjamín. Gama tiene 25 años de intachable reputación. Presentemos el memorial con total transparencia técnica ante Carabineros OS-10.'
        }
      ]
      acuerdos = [
        'Radicar memorial formal ante Prefectura de Seguridad Privada OS-10 firmado por Tomás Toro-Moreno.',
        'Adjuntar certificado de cumplimiento APDP y esquema de redundancia cloud de Camila Vega.',
        'Notificar a los abonados sobre las garantías de ciberseguridad vigentes.'
      ]
    } else if (temaDirectorio === 'baterias') {
      tituloTema = 'Mantenimiento Preventivo de Baterías 12V 7Ah & Flujo de Caja'
      resumen = 'Plan de recambio masivo preventivo de baterías antes de la temporada de invierno para erradicar llamadas nocturnas por falso fallo de energía.'
      intervenciones = [
        {
          id: 'int-1',
          simId: 'cra_jefa',
          nombre: 'Sofía Carvajal',
          rol: 'Jefa CRA 24/7',
          emoji: '🚨',
          color: '#dc2626',
          mensaje: 'En los meses de invierno el frío acelera la descarga de baterías antiguas de 12V. Si no nos anticipamos, se generan cientos de pitidos en los teclados de los clientes a las 3 AM. Detecté 8 cuentas prioritarias que ya muestran voltaje intermitente.'
        },
        {
          id: 'int-2',
          simId: 'ia_compras',
          nombre: 'Franco Navarro',
          rol: 'Jefe de Abastecimiento & ERP',
          emoji: '📦',
          color: '#475569',
          mensaje: 'Tengo cerrada la cotización por 30 baterías Ultracell a $10.990 + IVA c/u. El ahorro total es de $75.300 CLP respecto a la compra unitaria. Requiero el visto bueno de Tomás para emitir la OC-2026-042.'
        },
        {
          id: 'int-3',
          simId: 'cra_terreno',
          nombre: 'Ignacio Riquelme',
          rol: 'Rector Técnico Virtual',
          emoji: '🔧',
          color: '#ea580c',
          mensaje: 'Los técnicos de terreno pueden hacer el recorrido en dos jornadas coordinadas por zona geográfica, reduciendo tiempos muertos de traslado y gastos de combustible.'
        },
        {
          id: 'int-4',
          simId: 'gerencia_general',
          nombre: 'Tomás Toro-Moreno',
          rol: 'CEO & Fundador',
          emoji: '👔',
          color: '#1e3a8a',
          mensaje: 'Aprobado. Franco, emite la orden de compra hoy mismo. Cuidar al cliente antes de que sufra un fallo es el sello de calidad de Gama Seguridad.'
        }
      ]
      acuerdos = [
        'Autorizar emisión de Orden de Compra por 30 unidades de baterías 12V 7Ah.',
        'Programar ruta técnica preventiva para las 8 cuentas con telemetría en advertencia.',
        'Informar a los clientes beneficiados con mensaje de cortesía vía WhatsApp/App Vetti.'
      ]
    } else if (temaDirectorio === 'yolov11') {
      tituloTema = 'Eliminación de Falsas Alarmas con YOLOv11 en CRA 24/7'
      resumen = 'Integración del modelo de inteligencia artificial de visión perimetral con la consola de recepción de alarmas de Sofía para video-verificación automática en 180ms.'
      intervenciones = [
        {
          id: 'int-1',
          simId: 'ia_lead',
          nombre: 'Dr. Maximiliano Silva',
          rol: 'Director de IA & Visión',
          emoji: '🧠',
          color: '#9333ea',
          mensaje: 'Tomás: Concluimos las pruebas en el canal piloto Dahua. La tasa de falsos positivos cayó al 0.2%, filtrando ramas por viento y animales domésticos. Cuando detecta un humano, la latencia es de apenas 180ms.'
        },
        {
          id: 'int-2',
          simId: 'cra_jefa',
          nombre: 'Sofía Carvajal',
          rol: 'Jefa CRA 24/7',
          emoji: '🚨',
          color: '#dc2626',
          mensaje: 'Esto transforma nuestra operación. El operador no pierde 2 minutos revisando cámaras vacías; solo atiende eventos con recuadro rojo de confirmación humana.'
        },
        {
          id: 'int-3',
          simId: 'gerencia_general',
          nombre: 'Tomás Toro-Moreno',
          rol: 'CEO & Fundador',
          emoji: '👔',
          color: '#1e3a8a',
          mensaje: 'Excelente avance. La tecnología debe servir para que las personas trabajen con más precisión y menos estrés. Adelante con el despliegue ordenado.'
        }
      ]
      acuerdos = [
        'Habilitar el filtro YOLOv11 en los primeros 10 clientes con cámaras perimetrales.',
        'Evaluar impacto en la reducción de falsas alarmas durante los próximos 15 días.',
        'Preparar ficha comercial para que Valentina ofrezca el servicio a condominios.'
      ]
    } else {
      tituloTema = temaPersonalizado.trim() || 'Directiva Especial de Tomás Toro-Moreno'
      resumen = `Tratamiento de la directiva estratégica planteada por el Director General: "${tituloTema}". Consenso técnico y plan de acción de los directores.`
      intervenciones = [
        {
          id: 'int-1',
          simId: 'gerencia_general',
          nombre: 'Tomás Toro-Moreno',
          rol: 'CEO & Fundador',
          emoji: '👔',
          color: '#1e3a8a',
          mensaje: `Directores y especialistas: He convocado a esta sesión para tratar con máxima urgencia el siguiente punto: "${tituloTema}". Requiero el pronunciamiento de cada área y un plan de acción concreto.`
        },
        {
          id: 'int-2',
          simId: 'cra_jefa',
          nombre: 'Sofía Carvajal',
          rol: 'Jefa CRA 24/7',
          emoji: '🚨',
          color: '#dc2626',
          mensaje: 'Tomás: Desde la Central Receptora nos alineamos de inmediato con su instrucción. Ajustaremos los procedimientos de turno para garantizar cumplimiento sin descuidar el SLA de 15 segundos.'
        },
        {
          id: 'int-3',
          simId: 'legal_os10',
          nombre: 'Lic. Claudio Valenzuela',
          rol: 'Director Legal & OS-10',
          emoji: '⚖️',
          color: '#b45309',
          mensaje: 'Validado jurídicamente. La directiva se enmarca plenamente en las facultades de administración de Gama Seguridad SpA y no genera contingencias normativas.'
        },
        {
          id: 'int-4',
          simId: 'gerencia_expansion',
          nombre: 'Rodrigo Sanhueza',
          rol: 'Asesor Senior de Expansión',
          emoji: '🏛️',
          color: '#0284c7',
          mensaje: 'Consolidado. Incorporo este mandato al balance de las 14:00 hrs para seguimiento de ejecución de todos los involucrados.'
        }
      ]
      acuerdos = [
        `Ejecución inmediata de la directiva de Tomás: "${tituloTema.slice(0, 80)}"`,
        'Reporte de avance en la reunión de seguimiento de la tarde.',
        'Notificación de acuse de recibo a tetoromoreno@gamasecurity.cl.'
      ]
    }

    setDebateDirectorio(intervenciones)

    const acta: ActaDirectorio = {
      id: 'acta-' + Date.now(),
      titulo: `Acta Oficial de Directorio: ${tituloTema}`,
      fecha: fechaLarga,
      hora: ahora,
      resumen,
      acuerdos,
      contenidoCompleto: `ACTA OFICIAL DE SESIÓN DE DIRECTORIO — GAMA SEGURIDAD SpA
Fecha: ${fechaLarga} · Hora: ${ahora} hrs
Preside: Tomás Toro-Moreno (Gerente General & CEO)
Quorum: 12 Especialistas de la Colonia Autónoma Presentes

TEMA TRATADO:
${tituloTema}

RESUMEN DE LAS DELIBERACIONES:
${intervenciones.map(i => `[${i.nombre} - ${i.rol}]:\n"${i.mensaje}"\n`).join('\n')}

ACUERDOS FORMALES ADOPTADOS POR UNANIMIDAD:
${acuerdos.map((a, idx) => `${idx + 1}. ${a}`).join('\n')}

CERTIFICACIÓN:
Se levanta la sesión con la aprobación unánime de los miembros de la mesa y la firma virtual de Tomás Toro-Moreno.`
    }

    setActaGenerada(acta)
    setDebatiendoDirectorio(false)

    // Notificar en feed y simular movimiento a mesa
    setFeedOperaciones(prev => [
      {
        id: 'ev-' + Date.now(),
        hora: ahora,
        simId: 'gerencia_general',
        simNombre: 'Tomás',
        simEmoji: '👔',
        rol: 'CEO & Fundador',
        accion: `Directorio concluido: Se adopta acta de consenso sobre "${tituloTema.slice(0, 45)}...".`,
        tipo: 'gerencia'
      },
      ...prev
    ])

    // Agregar acta a la Bóveda de Entregables
    setEntregables(prev => [
      {
        id: acta.id,
        titulo: acta.titulo,
        subtitulo: `Sesión de Directorio presidida por Tomás con 12 especialistas`,
        autorId: 'gerencia_general',
        autorNombre: 'Tomás Toro-Moreno & Consejo',
        autorRol: 'Directorio Ejecutivo Gama Seguridad',
        autorEmoji: '🏛️',
        fecha: 'Hoy, ' + ahora,
        tipo: 'expansion',
        resumen: acta.resumen,
        contenidoCompleto: acta.contenidoCompleto,
        puntosClave: acta.acuerdos,
        estado: 'pendiente'
      },
      ...prev
    ])
  }

  // Despacho del Acta Oficial de Directorio vía Resend a tetoromoreno@gamasecurity.cl
  const handleDespacharActaEmail = async () => {
    if (!actaGenerada) return
    setDespachandoActaEmail(true)
    try {
      const res = await fetch('/api/agentes/despacho-directo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: actaGenerada.titulo,
          autor: 'Consejo de Directorio Presidido por Tomás Toro-Moreno',
          rolAutor: 'Directorio Gama Seguridad SpA',
          tipo: 'acta_directorio',
          resumen: actaGenerada.resumen,
          contenido: actaGenerada.contenidoCompleto,
          detalles: actaGenerada.acuerdos,
          targetEmail: 'tetoromoreno@gamasecurity.cl'
        })
      })
      const data = await res.json()
      if (data.ok) {
        alert('✓ Acta Oficial de Directorio despachada exitosamente a tetoromoreno@gamasecurity.cl')
      } else {
        alert('Error despachando acta: ' + (data.error || 'Desconocido'))
      }
    } catch (err: any) {
      alert('Error de conexión al enviar acta: ' + err.message)
    } finally {
      setDespachandoActaEmail(false)
    }
  }

  // Emisión de Orden Ejecutiva Directa de Tomás a cualquier especialista
  const handleEmitirOrdenDirecta = () => {
    if (!ordenInstruccion.trim()) {
      alert('Por favor escribe la instrucción que deseas encomendar al especialista.')
      return
    }

    const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const agente = empleados.find(e => e.id === ordenAgenteId) || empleados[0]

    const respuestaEjecutiva = `Tomás, orden ejecutiva recibida con prioridad ${ordenPrioridad.toUpperCase()}.\n\nEn mi calidad de ${agente.rol}, tomo la instrucción de forma inmediata bajo mi atribución ejecutiva ("${agente.atribucionesEjecutivas[0]}"). He actualizado mi estado operativo en el sistema y me encuentro coordinando los recursos para entregar resultados en el menor plazo posible.\n\nTodo registrado formalmente en la Bóveda de Entregables de Gama Seguridad.`

    // Actualizar Sim en canvas
    const sim = simsRef.current.find(s => s.id === agente.id)
    if (sim) {
      sim.tareaActual = `⚡ MISIÓN DE TOMÁS: ${ordenInstruccion.slice(0, 40)}...`
      sim.progresoTarea = 25
      sim.burbujaTexto = `Ejecutando orden prioritaria de Tomás...`
      sim.burbujaTimer = 260
    }

    // Actualizar estado del empleado y chat
    setEmpleados(prev => prev.map(emp => {
      if (emp.id === agente.id) {
        return {
          ...emp,
          tareaActual: `⚡ MISIÓN DE TOMÁS: ${ordenInstruccion.slice(0, 40)}...`,
          progresoTarea: 25,
          burbujaTexto: `Ejecutando orden prioritaria de Tomás...`,
          burbujaTimer: 260,
          historialChat: [
            ...emp.historialChat,
            { autor: 'usuario', mensaje: `⚡ ORDEN EJECUTIVA [${ordenPrioridad.toUpperCase()}]: ${ordenInstruccion}`, hora: ahora },
            { autor: 'agente', mensaje: respuestaEjecutiva, hora: ahora }
          ]
        }
      }
      return emp
    }))

    // Agregar al Feed de Operaciones 24/7
    setFeedOperaciones(prev => [
      {
        id: 'ev-' + Date.now(),
        hora: ahora,
        simId: 'gerencia_general',
        simNombre: 'Tomás',
        simEmoji: '👔',
        rol: 'CEO & Fundador',
        accion: `Tomás impartió Orden Ejecutiva [${ordenPrioridad.toUpperCase()}] a ${agente.nombre}: "${ordenInstruccion.slice(0, 50)}...".`,
        tipo: 'gerencia'
      },
      ...prev
    ])

    // Crear Entregable en la Bóveda
    const nuevoEntregable: EntregableOficial = {
      id: 'ord-' + Date.now(),
      titulo: `Orden Ejecutiva: ${ordenInstruccion.slice(0, 42)}...`,
      subtitulo: `Instrucción emitida por Tomás Toro-Moreno a ${agente.nombre}`,
      autorId: agente.id,
      autorNombre: agente.nombre,
      autorRol: agente.rol,
      autorEmoji: agente.avatarEmoji,
      fecha: 'Hoy, ' + ahora,
      tipo: agente.area === 'legal' ? 'legal' : agente.area === 'cra' ? 'auditoria' : agente.area === 'comercial' ? 'comercial' : 'operaciones',
      resumen: `Mandato ejecutivo instruido por Tomás a ${agente.nombre} con prioridad ${ordenPrioridad.toUpperCase()}. Ejecución inmediata y reporte en curso.`,
      contenidoCompleto: `ORDEN EJECUTIVA DE GERENCIA GENERAL — GAMA SEGURIDAD SpA
Fecha: ${new Date().toLocaleDateString('es-CL')} · Hora: ${ahora} hrs
Emisor: Tomás Toro-Moreno (CEO & Fundador)
Destinatario: ${agente.nombre} (${agente.rol})
Prioridad: ${ordenPrioridad.toUpperCase()}

INSTRUCCIÓN IMPARTIDA POR TOMÁS:
"${ordenInstruccion}"

COMPROMISO OPERATIVO DE ${agente.nombre}:
"${respuestaEjecutiva}"

ESTADO DE CUMPLIMIENTO:
Misión en curso en la oficina virtual. Se registrará la entrega definitiva para la revisión y visto bueno de Tomás.`,
      puntosClave: [
        `Destinatario: ${agente.nombre} (${agente.rol})`,
        `Prioridad: ${ordenPrioridad.toUpperCase()}`,
        `Estado: En ejecución inmediata en plataforma`
      ],
      estado: 'pendiente'
    }

    setEntregables(prev => [nuevoEntregable, ...prev])
    setOrdenEmitidaSuccess(`✓ Orden Ejecutiva enviada con éxito a ${agente.nombre}. Tarea en curso en la planta virtual.`)
    setOrdenInstruccion('')

    if (vozHabilitada) {
      hablarTexto(respuestaEjecutiva)
    }

    setTimeout(() => {
      setOrdenEmitidaSuccess(null)
      setModalOrdenDirecta(false)
    }, 2500)
  }

  // Estados interactivos avanzados para la colonia multi-agente
  const [purgaEnCurso, setPurgaEnCurso] = useState<boolean>(false)
  const [escenarioYolo, setEscenarioYolo] = useState<'humano' | 'mascota' | 'viento'>('humano')
  const [resultadoYolo, setResultadoYolo] = useState<string | null>(null)
  const [certificadoApdpVisible, setCertificadoApdpVisible] = useState<boolean>(false)

  const [enviandoInforme14, setEnviandoInforme14] = useState<boolean>(false)

  const handleDespacharInforme14Hrs = async () => {
    setEnviandoInforme14(true)
    try {
      const res = await fetch('/api/agentes/informe-14hrs?send=true')
      const data = await res.json()
      if (data.ok) {
        alert('✓ Informe Consolidado de las 14:00 hrs despachado exitosamente vía Resend a tetoromoreno@gamasecurity.cl')
      } else {
        alert('Error en despacho: ' + (data.error || 'Desconocido'))
      }
    } catch (err: any) {
      alert('Error conectando con API de informe 14hrs: ' + err.message)
    } finally {
      setEnviandoInforme14(false)
    }
  }

  // Estados interactivos de herramientas de área
  const [cargandoInformeSofia, setCargandoInformeSofia] = useState<boolean>(false)
  const [resultadoInformeSofia, setResultadoInformeSofia] = useState<any | null>(null)
  const [emailEnviadoStatus, setEmailEnviadoStatus] = useState<string | null>(null)

  const [borradoresMkt, setBorradoresMkt] = useState<any[]>([
    {
      id: 'mkt-1',
      red: 'Instagram & Facebook',
      herramienta: 'Canva Free + Ideogram',
      titulo: '¿Sabes por qué una alarma sin monitoreo real 24/7 solo hace ruido?',
      descripcion: 'Carrusel educativo explicando que la sirena asusta al vecino, pero la CRA de Gama despacha a los cuadrantes en menos de 15 segundos.',
      estado: 'SUPEDITADO A APROBACIÓN DE TOMÁS',
      fecha: 'Hoy, 09:30'
    },
    {
      id: 'mkt-2',
      red: 'Reels / TikTok',
      herramienta: 'CapCut Web (Plantilla Gratis)',
      titulo: 'Mito vs Realidad: Los comodatos engañosos de alarmas en Chile',
      descripcion: 'Video corto mostrando que en Gama el cliente es dueño de su equipo y nunca queda atrapado en letras chicas de 48 meses.',
      estado: 'SUPEDITADO A APROBACIÓN DE TOMÁS',
      fecha: 'Hoy, 10:15'
    }
  ])

  const [despachandoPropuestasGraficas, setDespachandoPropuestasGraficas] = useState<boolean>(false)
  const [propuestasGraficasDespachadasMsg, setPropuestasGraficasDespachadasMsg] = useState<string | null>(null)
  const [modalImagenPreview, setModalImagenPreview] = useState<{ url: string; titulo: string } | null>(null)

  const handleDespacharPropuestasGraficas = async () => {
    setDespachandoPropuestasGraficas(true)
    setPropuestasGraficasDespachadasMsg(null)
    try {
      const res = await fetch('/api/agentes/despacho-directo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'propuestas_graficas',
          titulo: '2 Propuestas Gráficas Oficiales Listas para Aprobación',
          autor: 'Valentina Lagos',
          rolAutor: 'Gerente Comercial & Mkt',
          targetEmail: 'tetoromoreno@gamasecurity.cl'
        })
      })
      const data = await res.json()
      if (data.ok) {
        setPropuestasGraficasDespachadasMsg('✓ 2 Propuestas Gráficas despachadas con éxito a tetoromoreno@gamasecurity.cl')
        setFeedOperaciones(prev => [
          {
            id: 'ev-' + Date.now(),
            hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
            simId: 'comercial_jefa',
            simNombre: 'Valentina Lagos',
            simEmoji: '💼',
            rol: 'Comercial',
            accion: 'Valentina despachó 2 propuestas gráficas de alta definición al correo de Tomás (tetoromoreno@gamasecurity.cl).',
            tipo: 'comercial'
          },
          ...prev
        ])
      } else {
        alert('Error despachando propuestas gráficas: ' + (data.error || 'Desconocido'))
      }
    } catch (err: any) {
      alert('Error de conexión al enviar propuestas gráficas: ' + err.message)
    } finally {
      setDespachandoPropuestasGraficas(false)
    }
  }

  const handleAprobarBorradores = () => {
    const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    setBorradoresMkt(prev => prev.map(p => ({
      ...p,
      estado: `✓ APROBADO POR TOMÁS (${ahora})`
    })))
    setFeedOperaciones(prev => [
      {
        id: 'ev-' + Date.now(),
        hora: ahora,
        simId: 'gerencia_general',
        simNombre: 'Tomás',
        simEmoji: '👔',
        rol: 'CEO',
        accion: 'Tomás aprueba formalmente los borradores de marketing orgánico de Valentina para publicación programada.',
        tipo: 'gerencia'
      },
      ...prev
    ])
    alert('✓ Borradores de marketing aprobados formalmente por Tomás. Valentina coordinará publicación.')
  }

  const handlePurgarContexto = () => {
    setPurgaEnCurso(true)
    setTimeout(() => {
      setPurgaEnCurso(false)
      const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      setFeedOperaciones(prev => [
        {
          id: 'ev-' + Date.now(),
          hora: ahora,
          simId: 'ia_reclutamiento',
          simNombre: 'Loreto Baeza',
          simEmoji: '🧩',
          rol: 'Talento IA',
          accion: 'Purga de contexto ejecutada con éxito: 12 especialistas con buffer liberado a 0 tokens y fatiga cognitiva neutralizada.',
          tipo: 'ia'
        },
        ...prev
      ])
      alert('✓ Purga de memoria y contexto completada con éxito. La colonia de agentes opera al 100% de coherencia cognitiva sin alucinaciones.')
    }, 1200)
  }

  const handleSimularYolo = (escenario: 'humano' | 'mascota' | 'viento') => {
    setEscenarioYolo(escenario)
    if (escenario === 'humano') {
      setResultadoYolo('🚨 INTRUSIÓN PERIMETRAL DETECTADA (Confianza: 99.4%)\nBounding Box: [x:140, y:220, w:60, h:180] • Clasificación: Persona sospechosa en cerco perimetral.\nAcción Automática: Pre-alarma enviada a Sofía en CRA 24/7 para verificación prioritaria.')
    } else if (escenario === 'mascota') {
      setResultadoYolo('🟢 FALSA ALARMA DESCARTADA (Confianza: 99.8%)\nBounding Box: [x:310, y:450, w:35, h:25] • Clasificación: Cuadrúpedo doméstico (Gato / Perro).\nAcción Automática: Evento filtrado silenciosamente sin disparar llamada al abonado.')
    } else {
      setResultadoYolo('💨 RUIDO AMBIENTAL FILTRADO (Confianza: 99.9%)\nPatrón: Movimiento oscilatorio de ramas de árbol con viento racheado de 45 km/h.\nAcción Automática: Sensibilidad óptica auto-calibrada en canal piloto.')
    }
  }

  const hablarTexto = (texto: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
        const cleanText = texto.replace(/[*_#`]/g, '')
        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.lang = 'es-CL'
        utterance.rate = 1.05
        window.speechSynthesis.speak(utterance)
      } catch {}
    }
  }

  const [manualSeleccionado, setManualSeleccionado] = useState<string>('dsc_neo')

  // Feed de eventos de operaciones 24/7
  const [feedOperaciones, setFeedOperaciones] = useState<EventoOperacion[]>([
    { id: 'ev-1', hora: '08:14:10', simId: 'cra_jefa', simNombre: 'Sofía Carvajal', simEmoji: '🚨', rol: 'CRA 24/7', accion: 'Auditoría de test 72h ejecutada. Cartera depurada sin cuentas inactivas (C717 protegida).', tipo: 'cra' },
    { id: 'ev-2', hora: '08:14:28', simId: 'comercial_jefa', simNombre: 'Valentina Lagos', simEmoji: '💼', rol: 'Comercial', accion: 'Borrador de post educativo listo en Canva Free para revisión de Tomás.', tipo: 'comercial' },
    { id: 'ev-3', hora: '08:14:45', simId: 'legal_os10', simNombre: 'Claudio Valenzuela', simEmoji: '⚖️', rol: 'Legal OS10', accion: 'Memorial de acreditación de Oficina Virtual ante OS-10 afinado conforme a la Ley 21.659.', tipo: 'legal' },
    { id: 'ev-4', hora: '08:15:02', simId: 'gerencia_general', simNombre: 'Tomás', simEmoji: '👔', rol: 'CEO', accion: 'Tomás aprueba balance matutino y promueve pausa de bienestar saludable.', tipo: 'gerencia' }
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
      const guardados = localStorage.getItem('gama_oficina_sims_v4')
      if (guardados) {
        const parsed = JSON.parse(guardados)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fusionados = parsed.map((emp: EmpleadoSim) => {
            const defEmp = EMPLEADOS_DEFAULT.find(d => d.id === emp.id)
            return {
              ...defEmp,
              ...emp,
              nombre: defEmp?.nombre || emp.nombre,
              apodo: defEmp?.apodo || emp.apodo,
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
        localStorage.setItem('gama_oficina_sims_v4', JSON.stringify(empleados))
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
        ctx.fillText(zona.icono + ' ' + zona.nombre, zona.x + 10, zona.y + 20)

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
        
        // Brillo de pantalla
        ctx.fillStyle = emp.area === 'operaciones' ? '#22c55e' : emp.area === 'ia' ? '#a855f7' : '#38bdf8'
        ctx.fillRect(emp.deskX - 19, emp.deskY - 11, 16, 4)
        ctx.fillRect(emp.deskX + 3, emp.deskY - 11, 16, 4)

        // Taza de café o cuaderno
        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.arc(emp.deskX + 22, emp.deskY - 4, 3, 0, Math.PI * 2)
        ctx.fill()

        // Silla ergonómica
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

      // ── DETALLES DE BIENESTAR: SALA 7 (CASINO GOURMET EL BUEN SABOR) ──
      ctx.fillStyle = '#064e3b'
      ctx.fillRect(690, 535, 110, 24)
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 1.5
      ctx.strokeRect(690, 535, 110, 24)
      
      ctx.fillStyle = '#a7f3d0'
      ctx.font = '10px system-ui'
      ctx.fillText('🥗 Buffet Saludable', 698, 551)

      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.arc(745, 585, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#059669'
      ctx.stroke()

      // ── DETALLES DE BIENESTAR: SALA 8 (ZEN, YOGA & ARCADE LOUNGE) ──
      ctx.fillStyle = '#06b6d4'
      ctx.fillRect(845, 535, 34, 18)
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 1
      ctx.strokeRect(845, 535, 34, 18)
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px system-ui'
      ctx.fillText('🧘', 855, 548)

      ctx.fillStyle = '#78350f'
      ctx.fillRect(890, 530, 36, 30)
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 1.5
      ctx.strokeRect(890, 530, 36, 30)
      ctx.fillStyle = '#fef3c7'
      ctx.font = '9px system-ui'
      ctx.fillText('♨️ Sauna', 893, 548)

      const vaporZenY = 524 - ((tickCountRef.current % 40) * 0.35)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
      ctx.beginPath()
      ctx.arc(908, vaporZenY, 2.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#3b0764'
      ctx.fillRect(935, 565, 30, 42)
      ctx.strokeStyle = '#c084fc'
      ctx.lineWidth = 1.5
      ctx.strokeRect(935, 565, 30, 42)
      ctx.fillStyle = (tickCountRef.current % 30 < 15) ? '#22d3ee' : '#e879f9'
      ctx.fillRect(938, 570, 24, 14)
      ctx.fillStyle = '#ffffff'
      ctx.font = '9px system-ui'
      ctx.fillText('🕹️', 944, 600)

      // 4. Actualizar Física y Dibujar los 10 Sims en Tiempo Real
      sims.forEach(sim => {
        let nx = sim.x
        let ny = sim.y
        let estado = sim.estadoAccion
        let direccion = sim.direccion

        if (factorVelocidad > 0) {
          if (modoReunionDirectorio) {
            const indexSim = sims.findIndex(s => s.id === sim.id)
            const angulo = (indexSim / sims.length) * Math.PI * 2
            sim.targetX = 825 + Math.cos(angulo) * 75
            sim.targetY = 135 + Math.sin(angulo) * 38
          } else if (modoPausaBienestar) {
            const indexSim = sims.findIndex(s => s.id === sim.id)
            if (indexSim % 2 === 0) {
              sim.targetX = 715 + (indexSim % 3) * 28
              sim.targetY = 550 + Math.floor(indexSim / 3) * 16
            } else {
              sim.targetX = 860 + (indexSim % 3) * 32
              sim.targetY = 550 + Math.floor(indexSim / 3) * 16
            }
          }

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
              } else if (modoPausaBienestar) {
                estado = nx < 820 ? 'buffet' : 'zen'
                sim.energiaSim = 100
              } else if (Math.hypot(nx - sim.deskX, ny - sim.deskY) < 5) {
                estado = 'working'
              } else if (nx > 675 && ny > 495) {
                estado = nx < 820 ? 'buffet' : 'zen'
              } else {
                estado = 'talking'
              }
            }
          }

          if (tickCountRef.current % 180 === 0 && !modoReunionDirectorio && !modoPausaBienestar) {
            if (Math.random() < 0.12 && estado === 'working') {
              sim.targetX = 720 + Math.random() * 50
              sim.targetY = 540 + Math.random() * 30
              sim.burbujaTexto = 'Pausa saludable en El Buen Sabor... 🥗'
              sim.burbujaTimer = 180
            } else if (Math.random() < 0.08 && (estado === 'buffet' || estado === 'zen')) {
              sim.targetX = sim.deskX
              sim.targetY = sim.deskY
              sim.burbujaTexto = 'Retomando funciones con energía renovada ⚡'
              sim.burbujaTimer = 140
            }
          }

          if (estado === 'working') {
            sim.energiaSim = Math.max(70, sim.energiaSim - 0.005 * factorVelocidad)
          } else if (estado === 'buffet' || estado === 'zen') {
            sim.energiaSim = Math.min(100, sim.energiaSim + 0.1 * factorVelocidad)
          }

          if (sim.burbujaTimer > 0) {
            sim.burbujaTimer -= factorVelocidad
          }
        }

        sim.x = nx
        sim.y = ny
        sim.estadoAccion = estado
        sim.direccion = direccion

        // DIBUJAR AL SIM
        const bob = Math.sin((tickCountRef.current + sim.x * 0.1) * 0.15) * 1.5

        const plumbobY = ny - 32 + (estado === 'walking' ? bob : 0)
        ctx.fillStyle = sim.id === empleadoSeleccionadoId ? '#38bdf8' : sim.plumbobColor
        ctx.beginPath()
        ctx.moveTo(nx, plumbobY - 8)
        ctx.lineTo(nx + 5, plumbobY)
        ctx.lineTo(nx, plumbobY + 8)
        ctx.lineTo(nx - 5, plumbobY)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = sim.colorPiel
        ctx.beginPath()
        ctx.arc(nx, ny - 16, 7.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = sim.colorCabello
        ctx.beginPath()
        ctx.arc(nx, ny - 19, 7.5, Math.PI, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = sim.colorRopa
        ctx.fillRect(nx - 6, ny - 8, 12, 14)

        ctx.fillStyle = '#0f172a'
        ctx.fillRect(nx - 5, ny + 6, 4, 8)
        ctx.fillRect(nx + 1, ny + 6, 4, 8)

        ctx.fillStyle = '#f8fafc'
        ctx.font = 'bold 9px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(sim.apodo, nx, ny + 24)
        ctx.textAlign = 'start'

        if (sim.burbujaTimer > 0 && sim.burbujaTexto) {
          ctx.font = 'bold 9px system-ui, -apple-system, sans-serif'
          const textW = ctx.measureText(sim.burbujaTexto).width
          const bubbleW = Math.max(90, Math.min(200, textW + 16))
          const bubbleH = 22
          const bubbleX = Math.max(20, Math.min(canvas.width - bubbleW - 20, nx - bubbleW / 2))
          const bubbleY = ny - 56

          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
          ctx.strokeStyle = '#38bdf8'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6)
          ctx.fill()
          ctx.stroke()

          ctx.fillStyle = '#ffffff'
          ctx.fillText(sim.burbujaTexto, bubbleX + 8, bubbleY + 14)
        }
      })

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [adminDesbloqueado, pestañaActiva, velocidadSim, modoReunionDirectorio, modoPausaBienestar, empleadoSeleccionadoId])

  const interactuarEnCanvas = (x: number, y: number) => {
    const sims = simsRef.current

    const tocado = sims.find(s => Math.hypot(s.x - x, s.y - y) < 22)
    if (tocado) {
      setEmpleadoSeleccionadoId(tocado.id)
      return
    }

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

  const handlePedirReporte = () => {
    const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const reporteTexto = 'REPORTE OPERATIVO EJECUTIVO [' + ahora + ']\nDe: ' + empleadoActivo.nombre + ' (' + empleadoActivo.rol + ')\n\n• Estado: En funciones activas con SLA al día.\n• Atribución Principal: ' + empleadoActivo.atribucionesEjecutivas[0] + '\n• KPI Vigente: ' + empleadoActivo.kpis[0].label + ' en ' + empleadoActivo.kpis[0].valor + '.\n• Tarea en curso: ' + empleadoActivo.tareaActual + '.\n\nSin novedades críticas que reportar. Todas las operaciones de Gama Seguridad bajo estricto control normativo.'

    setEmpleados(prev => prev.map(a => {
      if (a.id === empleadoActivo.id) {
        return {
          ...a,
          burbujaTexto: 'Generando reporte ejecutivo...',
          burbujaTimer: 200,
          historialChat: [
            ...a.historialChat,
            { autor: 'usuario', mensaje: 'Tomás solicita reporte de estado y novedades de tu área.', hora: ahora },
            { autor: 'agente', mensaje: reporteTexto, hora: ahora }
          ]
        }
      }
      return a
    }))
    setSubPestañaLateral('chat')
  }

  const handleMandarBreak = () => {
    const sim = simsRef.current.find(s => s.id === empleadoActivo.id)
    if (sim) {
      sim.targetX = 720 + Math.random() * 40
      sim.targetY = 550 + Math.random() * 20
      sim.burbujaTexto = 'Disfrutando un menú saludable en El Buen Sabor 🥗'
      sim.burbujaTimer = 180
    }
  }

  const handleMandarZen = () => {
    const sim = simsRef.current.find(s => s.id === empleadoActivo.id)
    if (sim) {
      sim.targetX = 870 + Math.random() * 40
      sim.targetY = 550 + Math.random() * 20
      sim.burbujaTexto = 'Meditando y estirando en la sala Zen 🧘‍♂️'
      sim.burbujaTimer = 180
    }
  }

  const handleVolverEscritorio = () => {
    const sim = simsRef.current.find(s => s.id === empleadoActivo.id)
    if (sim) {
      sim.targetX = sim.deskX
      sim.targetY = sim.deskY
      sim.burbujaTexto = 'Retomando mi puesto de trabajo 💻'
      sim.burbujaTimer = 160
    }
  }

  const handleTogglePausaBienestar = () => {
    const nuevoEstado = !modoPausaBienestar
    setModoPausaBienestar(nuevoEstado)
    if (nuevoEstado) {
      setModoReunionDirectorio(false)
      const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      setFeedOperaciones(prev => [
        {
          id: 'ev-' + Date.now(),
          hora: ahora,
          simId: 'gerencia_general',
          simNombre: 'Tomás',
          simEmoji: '🧘‍♂️',
          rol: 'CEO',
          accion: 'Pausa Saludable activada: El equipo recarga energía en el Casino Gourmet y la Sala Zen.',
          tipo: 'bienestar'
        },
        ...prev
      ])
    } else {
      simsRef.current.forEach(sim => {
        sim.targetX = sim.deskX
        sim.targetY = sim.deskY
        sim.burbujaTexto = 'Turno activo retomado 💻'
        sim.burbujaTimer = 140
      })
    }
  }

  const handleEnviarMensaje = async () => {
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

    // 1. Intentar consultar a la IA real (Gemini 2.5 Flash) con el System Prompt del especialista
    let respuestaFinal = ''
    try {
      const contextoSystem = `
${empleadoActivo.entrenamiento.systemPrompt}
Tu Nombre: ${empleadoActivo.nombre} (${empleadoActivo.apodo})
Tu Rol: ${empleadoActivo.rol}
Área: ${empleadoActivo.areaNombre}
Atribuciones Ejecutivas:
${empleadoActivo.atribucionesEjecutivas.map(a => '- ' + a).join('\n')}
Misión Principal: ${empleadoActivo.misionPrincipal}
Reglas de Negocio:
${empleadoActivo.entrenamiento.reglasNegocio.map(r => '- ' + r).join('\n')}

Instrucciones de Respuesta:
- Estás conversando directamente con Tomás Toro-Moreno, CEO y Fundador de Gama Seguridad.
- Responde siempre en primera persona, manteniendo absoluta fidelidad a tu especialidad profesional.
- Sé ejecutivo, profesional, cálido y pragmático. No uses introducciones vacías como "Hola, como modelo de IA...". Habla como la persona y especialista real que eres en la empresa.
- Mantén la respuesta concisa y contundente (1 a 3 párrafos como máximo).
`
      const promptCompleto = `${contextoSystem}\n\nHistorial previo:\n${empleadoActivo.historialChat.slice(-4).map(m => `${m.autor === 'usuario' ? 'Tomás' : empleadoActivo.apodo}: ${m.mensaje}`).join('\n')}\nTomás: ${mensajeUsuario}\n${empleadoActivo.apodo}:`

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptCompleto })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.ok && (data.texto || data.text)) {
          respuestaFinal = (data.texto || data.text).trim()
        }
      }
    } catch (e) {
      console.warn('Fallback local para chat de especialista:', e)
    }

    // 2. Si no hubo respuesta de la API de IA (ej: sin conexión o límite), usar fallback contextual inteligente
    if (!respuestaFinal) {
      const promptMinus = mensajeUsuario.toLowerCase()
      if (promptMinus.includes('orden') || promptMinus.includes('autorizo') || promptMinus.includes('haz') || promptMinus.includes('revisa')) {
        respuestaFinal = 'Entendido, Tomás. En mi rol como ' + empleadoActivo.rol + ', tomo la instrucción y procedo a ejecutar bajo mi atribución: "' + empleadoActivo.atribucionesEjecutivas[0] + '".'
      } else if (promptMinus.includes('habilidad') || promptMinus.includes('experiencia') || promptMinus.includes('certificacion')) {
        respuestaFinal = 'Cuento con ' + empleadoActivo.certificacionesElite[0] + ' y domino ' + empleadoActivo.hardSkills.slice(0, 3).join(', ') + ' para garantizar la más alta precisión operativa.'
      } else if (promptMinus.includes('estado') || promptMinus.includes('reporte') || promptMinus.includes('kpi')) {
        respuestaFinal = 'Reportando novedad: KPI principal ' + empleadoActivo.kpis[0].label + ' en ' + empleadoActivo.kpis[0].valor + '. Operaciones estables 24/7.'
      } else {
        respuestaFinal = 'Recibido, Tomás. Coordinando con el equipo bajo el estándar de ' + (empleadoActivo.metodologias[0] || 'Gama Seguridad') + '. Todo bajo control y en marcha.'
      }
    }

    // 3. Si Tomás consulta o pide propuestas gráficas o envío al mail, disparar despacho real a Resend
    const promptLower = mensajeUsuario.toLowerCase()
    const pideGraficas = promptLower.includes('propuesta') || promptLower.includes('grafica') || promptLower.includes('gráfica') || promptLower.includes('diseño') || promptLower.includes('diseno')
    const pideEnvio = promptLower.includes('mail') || promptLower.includes('correo') || promptLower.includes('envia') || promptLower.includes('envía') || promptLower.includes('manda') || promptLower.includes('llego') || promptLower.includes('llegó') || promptLower.includes('pedi') || promptLower.includes('pedí')

    if ((pideGraficas && (pideEnvio || empleadoActivo.id === 'comercial_jefa')) || (empleadoActivo.id === 'comercial_jefa' && pideEnvio)) {
      fetch('/api/agentes/despacho-directo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'propuestas_graficas',
          titulo: '2 Propuestas Gráficas Oficiales — Valentina Lagos',
          autor: 'Valentina Lagos',
          rolAutor: 'Gerente Comercial & Mkt',
          targetEmail: 'tetoromoreno@gamasecurity.cl'
        })
      }).then(r => r.json()).then(d => {
        if (d.ok) {
          setPropuestasGraficasDespachadasMsg('✓ 2 Propuestas Gráficas despachadas con éxito a tetoromoreno@gamasecurity.cl')
        }
      }).catch(err => console.error('Error auto-despacho propuestas:', err))

      if (!respuestaFinal.toLowerCase().includes('tetoromoreno@gamasecurity.cl')) {
        respuestaFinal += '\n\n📧 Tomás: Acabo de despachar inmediatamente las 2 propuestas gráficas de alta definición adjuntas a tu correo tetoromoreno@gamasecurity.cl vía Resend. También las puedes revisar y descargar directamente en mi panel lateral.'
      }
    }

    const s = simsRef.current.find(item => item.id === empleadoActivo.id)
    if (s) {
      s.tareaActual = '⚡ Atendiendo: ' + mensajeUsuario.slice(0, 40) + '...'
      s.progresoTarea = 45
      s.burbujaTexto = respuestaFinal.slice(0, 52) + '...'
      s.burbujaTimer = 220
    }

    setEmpleados(prev => prev.map(a => {
      if (a.id === empleadoActivo.id) {
        return {
          ...a,
          burbujaTexto: respuestaFinal.slice(0, 52) + '...',
          burbujaTimer: 220,
          historialChat: [
            ...a.historialChat,
            { autor: 'agente', mensaje: respuestaFinal, hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }
          ]
        }
      }
      return a
    }))

    // Hablar con Web Speech API si el usuario lo tiene habilitado
    if (vozHabilitada) {
      hablarTexto(respuestaFinal)
    }

    setEnviandoChat(false)
  }

  const handleEjecutarAuditoriaSofia = async (enviarEmail: boolean = false) => {
    setCargandoInformeSofia(true)
    setEmailEnviadoStatus(null)
    try {
      const url = '/api/agentes/sofia/informe?send=' + (enviarEmail ? 'true' : 'false')
      const res = await fetch(url)
      const data = await res.json()
      if (data.ok) {
        setResultadoInformeSofia(data)
        if (enviarEmail) {
          setEmailEnviadoStatus(data.emailSent ? '✓ Informe enviado a Tomás (tetoromoreno@gamasecurity.cl)' : 'Informe procesado (ver respuesta de Resend)')
        }
      } else {
        alert('Error consultando informe: ' + (data.error || 'Desconocido'))
      }
    } catch (err: any) {
      alert('Error conectando con API de Sofía: ' + err.message)
    } finally {
      setCargandoInformeSofia(false)
    }
  }

  const handleGuardarEntrenamiento = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const systemPrompt = (form.elements.namedItem('systemPrompt') as HTMLTextAreaElement).value
    const trayectoria = (form.elements.namedItem('trayectoria') as HTMLTextAreaElement).value
    const atribuciones = (form.elements.namedItem('atribuciones') as HTMLTextAreaElement).value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    const certificaciones = (form.elements.namedItem('certificaciones') as HTMLTextAreaElement).value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    const hardSkills = (form.elements.namedItem('hardSkills') as HTMLTextAreaElement).value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    const softSkills = (form.elements.namedItem('softSkills') as HTMLTextAreaElement).value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    const reglasNegocio = (form.elements.namedItem('reglasNegocio') as HTMLTextAreaElement).value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    setEmpleados(prev => prev.map(emp => {
      if (emp.id === empleadoActivo.id) {
        return {
          ...emp,
          trayectoriaLinkedIn: trayectoria,
          atribucionesEjecutivas: atribuciones.length ? atribuciones : emp.atribucionesEjecutivas,
          certificacionesElite: certificaciones.length ? certificaciones : emp.certificacionesElite,
          hardSkills: hardSkills.length ? hardSkills : emp.hardSkills,
          softSkills: softSkills.length ? softSkills : emp.softSkills,
          entrenamiento: {
            ...emp.entrenamiento,
            systemPrompt,
            reglasNegocio: reglasNegocio.length ? reglasNegocio : emp.entrenamiento.reglasNegocio
          }
        }
      }
      return emp
    }))

    alert('Entrenamiento y atribuciones de ' + empleadoActivo.nombre + ' actualizadas con éxito.')
    setPestañaActiva('juego_oficina')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* ── ENCABEZADO SUPERIOR: GOBERNANZA, BIENESTAR Y ESTADO ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-lg">
            🏢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-wide">
                OFICINA AUTÓNOMA VIRTUAL
              </h1>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full font-bold">
                12 ESPECIALISTAS ACTIVOS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Gama Seguridad SpA • Simulación y copiloto para Tomás Toro-Moreno
            </p>
          </div>
        </div>

        {/* Pestañas Superiores & Controles de Modo */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Botón de Orden Ejecutiva Directa */}
          <button
            onClick={() => {
              setOrdenAgenteId(empleadoSeleccionadoId !== 'gerencia_general' ? empleadoSeleccionadoId : 'cra_jefa')
              setModalOrdenDirecta(true)
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 border-amber-300 shadow-md shadow-amber-950/40 hover:brightness-110 active:scale-95"
            title="Impartir una directiva ejecutiva de Tomás con máxima prioridad a cualquier especialista"
          >
            <Zap className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
            <span>Dar Orden Directa</span>
          </button>

          <button
            onClick={handleTogglePausaBienestar}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              modoPausaBienestar
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-emerald-400 shadow-lg shadow-emerald-900/30 animate-pulse'
                : 'bg-slate-900 text-emerald-300 border-emerald-800/60 hover:bg-slate-800'
            }`}
            title="Activar o desactivar descanso del equipo en Casino Gourmet y Sala Zen"
          >
            <Heart className="h-3.5 w-3.5 text-emerald-400" />
            <span>{modoPausaBienestar ? 'En Pausa Saludable' : 'Pausa de Bienestar'}</span>
          </button>

          {/* Botón de Despacho de Informe 14:00 hrs */}
          <button
            onClick={handleDespacharInforme14Hrs}
            disabled={enviandoInforme14}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border bg-blue-900/60 hover:bg-blue-800 text-blue-200 border-blue-600/60 shadow-sm"
            title="Despachar informe consolidado de las 14:00 hrs a Tomás vía Resend"
          >
            <Send className="h-3.5 w-3.5 text-blue-300" />
            <span>{enviandoInforme14 ? 'Enviando...' : 'Informe 14:00 (Resend)'}</span>
          </button>

          {/* Selector Principal de Vistas */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setPestañaActiva('juego_oficina')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                pestañaActiva === 'juego_oficina' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Planta Virtual</span>
            </button>
            <button
              onClick={() => {
                setPestañaActiva('directorio')
                setModoReunionDirectorio(true)
                if (debateDirectorio.length === 0) {
                  handleIniciarDebateDirectorio()
                }
              }}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                pestañaActiva === 'directorio' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>Directorio</span>
            </button>
            <button
              onClick={() => setPestañaActiva('entregables')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 relative ${
                pestañaActiva === 'entregables' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>Entregables</span>
              <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {entregables.length}
              </span>
            </button>
            <button
              onClick={() => setPestañaActiva('organigrama')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                pestañaActiva === 'organigrama' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Workflow className="h-3.5 w-3.5" />
              <span>Organigrama</span>
            </button>
            <button
              onClick={() => setPestañaActiva('entrenamiento')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                pestañaActiva === 'entrenamiento' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>Calibración</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── CUERPO DE LA VISTA ── */}
      {pestañaActiva === 'juego_oficina' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0 flex-1 overflow-hidden">
          
          {/* COLUMNA IZQUIERDA: CANVAS 2D + FEED EN VIVO (8 COLS) */}
          <div className="lg:col-span-8 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
            
            {/* CANVAS INTERACTIVO 2D DE LA OFICINA */}
            <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-2xl">
              
              <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 text-xs">
                <span className="text-[10px] font-mono text-slate-400">Velocidad:</span>
                <button onClick={() => setVelocidadSim('1x')} className={`px-2 py-0.5 rounded font-bold cursor-pointer ${velocidadSim === '1x' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>1x</button>
                <button onClick={() => setVelocidadSim('2x')} className={`px-2 py-0.5 rounded font-bold cursor-pointer ${velocidadSim === '2x' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>2x</button>
                <button onClick={() => setVelocidadSim('pausa')} className={`px-2 py-0.5 rounded font-bold cursor-pointer ${velocidadSim === 'pausa' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>⏸</button>
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

              <div className="flex items-center gap-2 overflow-x-auto pt-2 text-[10px] font-mono text-slate-400 no-scrollbar">
                <span className="font-bold text-slate-300 shrink-0">Salas:</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">👔 1. Tomás</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">⚖️ 2. Legal OS10</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">🏛️ 3. Directorio</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">🚨 4. CRA 24/7</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">💼 5. Comercial & Mkt</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">🧠 6. Laboratorio IA</span>
                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded shrink-0 font-bold">🥗 7. Casino Gourmet</span>
                <span className="bg-purple-950/80 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded shrink-0 font-bold">🧘‍♂️ 8. Zen & Arcade</span>
              </div>
            </div>

            {/* FEED EN VIVO DE ACTIVIDAD Y REPORTES */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Terminal de Operaciones 24/7 en Vivo (Reportes de los Especialistas)
                  </span>
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse">
                    EN TRANSMISIÓN
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  415 Abonados Monitoreados • 12 Especialistas Conectados
                </span>
              </div>

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
                        <span>Especialista Gama</span>
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
                      style={{ width: `${empleadoActivo.progresoTarea}%` }}
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
                      setOrdenAgenteId(empleadoActivo.id)
                      setModalOrdenDirecta(true)
                    }}
                    className="py-2 px-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/40 active:scale-95"
                  >
                    <Zap className="h-3.5 w-3.5 fill-slate-950" />
                    <span>Dar Orden Directa</span>
                  </button>
                </div>

                {/* Mandar al break / Volver al puesto */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={handleMandarBreak}
                    className="py-1.5 px-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Enviar al Casino Gourmet El Buen Sabor"
                  >
                    <span>🥗 Casino</span>
                  </button>
                  <button
                    onClick={handleMandarZen}
                    className="py-1.5 px-1 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Enviar a Sala Zen / Yoga"
                  >
                    <span>🧘 Zen</span>
                  </button>
                  <button
                    onClick={handleVolverEscritorio}
                    className="py-1.5 px-1 bg-slate-900 hover:bg-slate-800 text-blue-300 border border-slate-800 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Volver a su puesto de trabajo"
                  >
                    <Building className="h-3 w-3" />
                    <span>Al Puesto</span>
                  </button>
                </div>

                {/* Selector de Sub-Pestañas Laterales */}
                <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                  <button
                    onClick={() => setSubPestañaLateral('atribuciones')}
                    className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      subPestañaLateral === 'atribuciones' ? 'bg-[#1E40AF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    <span>Mando</span>
                  </button>
                  <button
                    onClick={() => setSubPestañaLateral('acciones_ia')}
                    className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      subPestañaLateral === 'acciones_ia' ? 'bg-[#1E40AF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    <span>Acciones</span>
                  </button>
                  <button
                    onClick={() => setSubPestañaLateral('linkedin')}
                    className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      subPestañaLateral === 'linkedin' ? 'bg-[#1E40AF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="h-3 w-3 text-cyan-300" />
                    <span>Skills</span>
                  </button>
                  <button
                    onClick={() => setSubPestañaLateral('chat')}
                    className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      subPestañaLateral === 'chat' ? 'bg-[#1E40AF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="h-3 w-3 text-emerald-300" />
                    <span>Chat</span>
                  </button>
                </div>

                {/* VISTA 1: Atribuciones Oficiales de Mando */}
                {subPestañaLateral === 'atribuciones' && (
                  <div className="bg-blue-950/40 border border-blue-900/60 p-3 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-blue-300 uppercase tracking-wide">
                      <Award className="h-4 w-4 text-amber-400" />
                      <span>Atribuciones Oficiales:</span>
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

                {/* VISTA 2: ACCIONES IA ESPECÍFICAS DE CADA ESPECIALISTA */}
                {subPestañaLateral === 'acciones_ia' && (
                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-3 text-xs">
                    
                    {/* ACCIONES DE SOFÍA (CRA 24/7) */}
                    {empleadoActivo.id === 'cra_jefa' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-red-400 flex items-center gap-1.5">
                            <Radio className="h-3.5 w-3.5" />
                            <span>Mando Operativo CRA 24/7</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">Resend & Supabase</span>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => handleEjecutarAuditoriaSofia(false)}
                            disabled={cargandoInformeSofia}
                            className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl font-bold flex items-center justify-between cursor-pointer transition text-xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-emerald-400" />
                              <span>Auditoría Señales (&gt;72h)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {cargandoInformeSofia ? 'Auditando...' : 'Ejecutar'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleEjecutarAuditoriaSofia(true)}
                            disabled={cargandoInformeSofia}
                            className="w-full py-2 px-3 bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white rounded-xl font-bold flex items-center justify-between cursor-pointer transition text-xs shadow-md"
                          >
                            <span className="flex items-center gap-1.5">
                              <Send className="h-4 w-4" />
                              <span>Despachar Informe Matutino 10AM</span>
                            </span>
                            <span className="text-[10px] bg-red-950/80 px-2 py-0.5 rounded font-mono">
                              Resend
                            </span>
                          </button>

                          {emailEnviadoStatus && (
                            <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-[11px] leading-snug">
                              {emailEnviadoStatus}
                            </div>
                          )}

                          {resultadoInformeSofia && (
                            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                              <div className="flex justify-between text-slate-400">
                                <span>Abonados Activos Depurados:</span>
                                <span className="font-bold text-white">{resultadoInformeSofia.totalCuentasActivas}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Alertas &gt; 72h Sin Señal:</span>
                                <span className="font-bold text-red-400">{resultadoInformeSofia.totalCuentasSinSenal72h}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Conectividad de Cartera:</span>
                                <span className="font-bold text-emerald-400">{resultadoInformeSofia.porcentajeConectividad}%</span>
                              </div>
                            </div>
                          )}

                          {/* Video-Verificación CCTV */}
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                              <span className="flex items-center gap-1">
                                <Video className="h-3.5 w-3.5 text-indigo-400" />
                                <span>Canal Piloto Video-Verificación:</span>
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono">1 Cámara Activa</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">
                              Protocolo RTSP conectado y calibrado paso a paso sin congestión de red.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE VALENTINA (MARKETING & LEADS) */}
                    {empleadoActivo.id === 'comercial_jefa' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                            <Share2 className="h-3.5 w-3.5" />
                            <span>Campañas & Propuestas Gráficas</span>
                          </span>
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded">
                            Supeditado a Tomás
                          </span>
                        </div>

                        {/* Botón de Despacho de Correo Inmediato */}
                        <div className="p-3 bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-800/60 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              Despacho Oficial a Tomás
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">Resend 24/7</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            Envía las 2 propuestas gráficas de alta definición adjuntas al correo <code className="text-emerald-300 font-mono">tetoromoreno@gamasecurity.cl</code> para tu revisión ejecutiva.
                          </p>

                          <button
                            onClick={handleDespacharPropuestasGraficas}
                            disabled={despachandoPropuestasGraficas}
                            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95 transition-all"
                          >
                            {despachandoPropuestasGraficas ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Despachando imágenes a tu correo...</span>
                              </>
                            ) : (
                              <>
                                <Mail className="h-3.5 w-3.5" />
                                <span>📧 Despachar las 2 Propuestas a mi Mail</span>
                              </>
                            )}
                          </button>

                          {propuestasGraficasDespachadasMsg && (
                            <div className="p-2 bg-emerald-950/80 border border-emerald-600/60 rounded-lg text-[10px] text-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              <span>{propuestasGraficasDespachadasMsg}</span>
                            </div>
                          )}
                        </div>

                        {/* Galería Visual de las 2 Propuestas Gráficas Generadas */}
                        <div className="space-y-3">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                            <span>2 Artes de Campaña Listos (1080x1080 px)</span>
                          </div>

                          {/* Tarjeta Propuesta 1 */}
                          <div className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-800/80 rounded-2xl space-y-2 transition-all">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-cyan-400">PROPUESTA 1 · POST EDUCATIVO</span>
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                1080 x 1080
                              </span>
                            </div>
                            
                            <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-square">
                              <img
                                src="/marketing/propuesta-grafica-1.jpg"
                                alt="Propuesta 1 - Alerta Tradicional vs Monitoreo CRA"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setModalImagenPreview({ url: '/marketing/propuesta-grafica-1.jpg', titulo: 'Propuesta 1: Alerta Tradicional vs Monitoreo CRA Gama' })}
                                  className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Ampliar</span>
                                </button>
                                <a
                                  href="/marketing/propuesta-grafica-1.jpg"
                                  download="Propuesta_1_Seguridad_Sin_Comodato.jpg"
                                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Bajar</span>
                                </a>
                              </div>
                            </div>

                            <h5 className="font-bold text-slate-100 text-[11px] leading-snug">
                              "Seguridad 24/7 Sin Comodato: Alerta Tradicional vs CRA Gama"
                            </h5>
                            <p className="text-[10px] text-slate-400 leading-snug">
                              Destaca que una alarma que solo suena molesta a los vecinos, mientras que la CRA responde en 15s y despacha cuadrantes.
                            </p>
                          </div>

                          {/* Tarjeta Propuesta 2 */}
                          <div className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-800/80 rounded-2xl space-y-2 transition-all">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-emerald-400">PROPUESTA 2 · INFOGRAFÍA ANTI-COMODATO</span>
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                1080 x 1080
                              </span>
                            </div>
                            
                            <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-square">
                              <img
                                src="/marketing/propuesta-grafica-2.jpg"
                                alt="Propuesta 2 - Comparativa Anti-Comodato"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setModalImagenPreview({ url: '/marketing/propuesta-grafica-2.jpg', titulo: 'Propuesta 2: Comparativa Anti-Comodato de 48 Meses' })}
                                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Ampliar</span>
                                </button>
                                <a
                                  href="/marketing/propuesta-grafica-2.jpg"
                                  download="Propuesta_2_Comparativa_Anti_Comodato.jpg"
                                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Bajar</span>
                                </a>
                              </div>
                            </div>

                            <h5 className="font-bold text-slate-100 text-[11px] leading-snug">
                              "Compara y Elige Mejor: Tradicionales vs Gama Seguridad"
                            </h5>
                            <p className="text-[10px] text-slate-400 leading-snug">
                              Rompe la trampa del comodato a 48 meses de Verisure/ADT y resalta que en Gama el cliente es dueño de su equipo sin multas de salida.
                            </p>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleAprobarBorradores}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Aprobar Borradores Formalmente</span>
                            </button>
                          </div>

                          <div className="p-2 bg-blue-950/40 border border-blue-900/60 rounded-xl text-[10px] text-blue-200 leading-relaxed">
                            💡 <strong>Frontera de Seguridad:</strong> Las IAs no publican en directo ni cierran ventas con clientes. Los leads son entregados limpios para cierre por personas reales.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE IGNACIO (ORÁCULO TÉCNICO VIRTUAL) */}
                    {empleadoActivo.id === 'cra_terreno' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-amber-400 flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Oráculo de Manuales de Alarmas</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Soporte Remoto</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
                            <button
                              onClick={() => setManualSeleccionado('dsc_neo')}
                              className={`px-2 py-1 rounded-lg font-bold shrink-0 cursor-pointer ${
                                manualSeleccionado === 'dsc_neo' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400'
                              }`}
                            >
                              DSC Neo HS2032
                            </button>
                            <button
                              onClick={() => setManualSeleccionado('dsc_classic')}
                              className={`px-2 py-1 rounded-lg font-bold shrink-0 cursor-pointer ${
                                manualSeleccionado === 'dsc_classic' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400'
                              }`}
                            >
                              DSC Classic PC585/1832
                            </button>
                            <button
                              onClick={() => setManualSeleccionado('paradox')}
                              className={`px-2 py-1 rounded-lg font-bold shrink-0 cursor-pointer ${
                                manualSeleccionado === 'paradox' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400'
                              }`}
                            >
                              Paradox Spectra/EVO
                            </button>
                          </div>

                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                            {manualSeleccionado === 'dsc_neo' && (
                              <>
                                <div className="font-bold text-amber-300">DSC PowerSeries Neo (HS2016 / HS2032 / HS2064)</div>
                                <div className="text-slate-300 text-[10px] leading-relaxed">
                                  • Código Instalador: <strong>*8 5555</strong><br />
                                  • Sección [001]: Definición de Zonas (001: Instantánea, 002: Retardo 1)<br />
                                  • Sección [851]: Configuración Comunicador IP/Celular TL280<br />
                                  • Sección [300]: Trayectoria de Comunicación Contact ID
                                </div>
                              </>
                            )}
                            {manualSeleccionado === 'dsc_classic' && (
                              <>
                                <div className="font-bold text-amber-300">DSC PowerSeries Classic (PC585 / PC1832 / PC1864)</div>
                                <div className="text-slate-300 text-[10px] leading-relaxed">
                                  • Código Instalador: <strong>*8 5555</strong><br />
                                  • Sección [001]: Tipos de Zonas (01: Retardo, 03: Instantánea)<br />
                                  • Sección [380]: Primeras Opciones de Comunicador (Habilitar bit 1)<br />
                                  • Borrado de Fallas: <strong>*2</strong> (1: Batería, 3: Línea Telefónica)
                                </div>
                              </>
                            )}
                            {manualSeleccionado === 'paradox' && (
                              <>
                                <div className="font-bold text-amber-300">Paradox Spectra SP & Magellan</div>
                                <div className="text-slate-300 text-[10px] leading-relaxed">
                                  • Código Instalador: <strong>ENTER + 0000 / 000000</strong><br />
                                  • Sección [001]-[032]: Programación de Zonas y Atributos<br />
                                  • Módulo IP150+: Conexión vía protocolo Swan y reporte Contact ID
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE CLAUDIO (LEGAL OS-10 VIRTUAL) */}
                    {empleadoActivo.id === 'legal_os10' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-amber-400 flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Carpeta OS-10 Oficina Virtual</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">Ley 21.659</span>
                        </div>

                        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-[11px]">
                          <div className="font-bold text-white">Estrategia Normativa:</div>
                          <p className="text-slate-300 text-[10px] leading-relaxed">
                            Fundamentación legal para acreditar la Central Receptora bajo modalidad Cloud / Oficina Virtual, respaldando la supervisión y trazabilidad digital sin exigencia de dependencias físicas ociosas.
                          </p>
                          <div className="bg-amber-950/40 p-2 rounded-lg border border-amber-800/40 text-[10px] text-amber-200">
                            ✓ Directiva de Funcionamiento adaptada a centros de cómputo en la nube conforme al nuevo marco de la Subsecretaría de Prevención del Delito.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE TOMÁS (GERENCIA GENERAL & FUNDADOR) */}
                    {empleadoActivo.id === 'gerencia_general' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-blue-400 flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5" />
                            <span>Mando Directivo & Gobernanza</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">CEO & Fundador</span>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={handleAprobarBorradores}
                            className="w-full py-2 px-3 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-between cursor-pointer transition text-xs shadow-md"
                          >
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                              <span>Aprobar Borradores de Marketing</span>
                            </span>
                            <span className="text-[10px] bg-blue-950/80 px-2 py-0.5 rounded font-mono">
                              Visto Bueno
                            </span>
                          </button>

                          <button
                            onClick={handleTogglePausaBienestar}
                            className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-emerald-800/60 text-emerald-300 rounded-xl font-bold flex items-center justify-between cursor-pointer transition text-xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <Heart className="h-4 w-4 text-emerald-400" />
                              <span>{modoPausaBienestar ? 'Finalizar Pausa Saludable' : 'Pausa de Bienestar Colectiva'}</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">Casino / Zen</span>
                          </button>

                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-[11px]">
                            <div className="font-bold text-slate-200">Directiva Estratégica 2026:</div>
                            <p className="text-slate-400 text-[10px] leading-relaxed">
                              Gama Seguridad SpA protege a 415+ abonados con tecnología de propiedad del cliente. Prohibición expresa de comodatos forzosos y cláusulas leoninas.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE RODRIGO (ASESORÍA SENIOR DE EXPANSIÓN) */}
                    {empleadoActivo.id === 'gerencia_expansion' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>Capacidad & Expansión Organizacional</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">Balance Carga</span>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={handleDespacharInforme14Hrs}
                            disabled={enviandoInforme14}
                            className="w-full py-2 px-3 bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-indigo-600 hover:to-purple-500 text-white rounded-xl font-bold flex items-center justify-between cursor-pointer transition text-xs shadow-md"
                          >
                            <span className="flex items-center gap-1.5">
                              <Send className="h-4 w-4" />
                              <span>Despachar Consolidado 14:00 hrs</span>
                            </span>
                            <span className="text-[10px] bg-indigo-950/80 px-2 py-0.5 rounded font-mono">
                              {enviandoInforme14 ? 'Enviando...' : 'Resend'}
                            </span>
                          </button>

                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="font-bold">Abonados Activos:</span>
                              <span className="font-mono text-white">415</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="font-bold">Ratio por Especialista:</span>
                              <span className="font-mono text-emerald-400">34.6 abonados/agente</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="font-bold">Capacidad Restante:</span>
                              <span className="font-mono text-cyan-400">+135 abonados (hasta 550)</span>
                            </div>
                            <div className="p-2 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-[10px] text-emerald-200">
                              ✓ Diagnóstico: Topología de agentes en equilibrio óptimo. No se requiere contratar nuevos agentes que generen fricción o ruido.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE LORETO (TALENTO & RECLUTAMIENTO IA) */}
                    {empleadoActivo.id === 'ia_reclutamiento' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-pink-400 flex items-center gap-1.5">
                            <BrainCircuit className="h-3.5 w-3.5" />
                            <span>Arquitectura & Salud Cognitiva IA</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">12 Modelos</span>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={handlePurgarContexto}
                            disabled={purgaEnCurso}
                            className="w-full py-2 px-3 bg-gradient-to-r from-pink-700 to-rose-600 hover:from-pink-600 hover:to-rose-500 text-white rounded-xl font-bold flex items-center justify-between cursor-pointer transition text-xs shadow-md"
                          >
                            <span className="flex items-center gap-1.5">
                              <RefreshCw className={`h-4 w-4 ${purgaEnCurso ? 'animate-spin' : ''}`} />
                              <span>Purgar Contexto & Fatiga Cognitiva</span>
                            </span>
                            <span className="text-[10px] bg-pink-950/80 px-2 py-0.5 rounded font-mono">
                              {purgaEnCurso ? 'Purgando...' : 'Limpiar'}
                            </span>
                          </button>

                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-slate-400">
                              <span>Modelos Activos Calibrados:</span>
                              <span className="font-bold text-white">12 Especialistas</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Tasa de Alucinación:</span>
                              <span className="font-bold text-emerald-400">0.0% (Validado)</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Horario Purga Automática:</span>
                              <span className="font-bold text-cyan-400">13:00 hrs diaria</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE MAXIMILIANO (DIRECTOR DE IA & VISIÓN) */}
                    {empleadoActivo.id === 'ia_lead' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-purple-400 flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5" />
                            <span>Visión Artificial & YOLOv11</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">Latencia 180ms</span>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-400 font-mono block">Probar Inferencia en Canal Piloto:</span>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              onClick={() => handleSimularYolo('humano')}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                                escenarioYolo === 'humano' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                              }`}
                            >
                              🚨 Humano
                            </button>
                            <button
                              onClick={() => handleSimularYolo('mascota')}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                                escenarioYolo === 'mascota' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                              }`}
                            >
                              🐕 Mascota
                            </button>
                            <button
                              onClick={() => handleSimularYolo('viento')}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                                escenarioYolo === 'viento' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                              }`}
                            >
                              💨 Viento
                            </button>
                          </div>

                          {resultadoYolo && (
                            <div className="p-2.5 bg-slate-950 border border-purple-900/60 rounded-xl space-y-1 text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-slate-200">
                              {resultadoYolo}
                            </div>
                          )}

                          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-[10px] text-slate-400">
                            <span>Canal RTSP Dahua:</span>
                            <span className="text-emerald-400 font-bold font-mono">1 Cámara Activa (60 FPS)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE CAMILA (ARQUITECTA DE SOFTWARE & CLOUD) */}
                    {empleadoActivo.id === 'ia_software' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                            <Code2 className="h-3.5 w-3.5" />
                            <span>Infraestructura Cloud & Sincronizador</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">Uptime 99.99%</span>
                        </div>

                        <div className="space-y-2">
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Sincronizador (Backend):</span>
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Activo (ID #1492786)</span>
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>IPRS Cloud (MySQL):</span>
                              <span className="text-emerald-400 font-mono">186.4.239.44 OK</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Frontend Vercel:</span>
                              <span className="text-emerald-400 font-mono">194 rutas (0 errores)</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Deduplicación de Señales:</span>
                              <span className="text-cyan-400 font-mono">3s precisión (Zona/Usuario)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE BENJAMÍN (OFICIAL DPO LEY 21.719 APDP) */}
                    {empleadoActivo.id === 'ia_datos' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Protección de Datos (Ley 21.719)</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">100% Conforme</span>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => setCertificadoApdpVisible(!certificadoApdpVisible)}
                            className="w-full py-2 px-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 rounded-xl font-bold flex items-center justify-between cursor-pointer transition text-xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-emerald-400" />
                              <span>{certificadoApdpVisible ? 'Ocultar Certificado APDP' : 'Emitir Certificado APDP'}</span>
                            </span>
                            <span className="text-[10px] font-mono text-indigo-300">Ver Constancia</span>
                          </button>

                          {certificadoApdpVisible && (
                            <div className="p-3 bg-slate-950 border border-indigo-900 rounded-xl space-y-2 text-[10px] font-mono text-slate-300 leading-relaxed">
                              <div className="font-bold text-emerald-400 border-b border-slate-800 pb-1">
                                CERTIFICADO OFICIAL APDP — LEY N° 21.719
                              </div>
                              <div>Titular: Gama Seguridad SpA</div>
                              <div>Responsable DPO: Benjamín Tapia</div>
                              <div>Cartera Auditada: 415 Abonados con consentimiento verificado</div>
                              <div>Cifrado en Reposo: AES-256 (Supabase Cloud)</div>
                              <div className="text-emerald-300 font-bold">Estado: Conforme y Blindado ante Agencia de Protección de Datos</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE FRANCO (ABASTECIMIENTO & ERP) */}
                    {empleadoActivo.id === 'ia_compras' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-slate-300 flex items-center gap-1.5">
                            <Receipt className="h-3.5 w-3.5" />
                            <span>Control de Stock & Abastecimiento</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">Ahorro 14.5%</span>
                        </div>

                        <div className="space-y-2">
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Baterías 12V 7Ah (Gel/Plomo):</span>
                              <span className="font-bold text-emerald-400 font-mono">42 unid. (Mín: 25)</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Sensores PIR DSC Neo:</span>
                              <span className="font-bold text-emerald-400 font-mono">18 unid. (Mín: 10)</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Fuentes de Poder 12V 2A:</span>
                              <span className="font-bold text-emerald-400 font-mono">15 unid. (Mín: 8)</span>
                            </div>
                          </div>

                          <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-400 leading-snug">
                            💼 <strong>Convenio Mayorista:</strong> Cotizaciones sincronizadas con Intcomex y Anixter para reposición inmediata en 24h.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCIONES DE MATÍAS (ÉXITO DE CLIENTES & RETENCIÓN) */}
                    {empleadoActivo.id === 'comercial_cuentas' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-sky-400 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>Retención & Éxito de Clientes</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">NPS 96/100</span>
                        </div>

                        <div className="space-y-2">
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Tasa de Retención:</span>
                              <span className="font-bold text-emerald-400 font-mono">99.65% Anual</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Churn Mensual:</span>
                              <span className="font-bold text-emerald-400 font-mono">0.35% (Meta &lt; 1%)</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Abonados en App Vetti:</span>
                              <span className="font-bold text-cyan-400 font-mono">312 conectados</span>
                            </div>
                          </div>

                          <div className="p-2 bg-sky-950/40 border border-sky-900/60 rounded-xl text-[10px] text-sky-200 leading-relaxed">
                            🤝 <strong>Fidelización:</strong> Trato directo y sin burocracia. Cuando un cliente llama, lo atiende una persona o un especialista con respuesta en segundos.
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* VISTA 3: Perfil LinkedIn & Benchmarks */}
                {subPestañaLateral === 'linkedin' && (
                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-3 text-xs">
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>Trayectoria & Background de Élite:</span>
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                        {empleadoActivo.trayectoriaLinkedIn}
                      </p>
                    </div>

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

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>Hard Skills:</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {empleadoActivo.hardSkills.map((hs, i) => (
                          <span key={i} className="text-[10px] bg-blue-950 text-blue-200 border border-blue-800/60 px-2 py-0.5 rounded-full font-mono">
                            {hs}
                          </span>
                        ))}
                      </div>
                    </div>

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

                {/* VISTA 4: Chat Directo e Interactivo con IA Real */}
                {subPestañaLateral === 'chat' && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-1.5">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-[#2997ff]" />
                        <span>Despacho con {empleadoActivo.apodo}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setVozHabilitada(!vozHabilitada)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition flex items-center gap-1 border ${
                            vozHabilitada
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                          title="Activar o desactivar síntesis de voz natural en español"
                        >
                          <span>{vozHabilitada ? '🔊 Voz: ON' : '🔈 Voz: OFF'}</span>
                        </button>
                        <span className="text-emerald-400 font-mono font-bold">24/7 Gemini</span>
                      </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 text-xs">
                      {empleadoActivo.historialChat.map((msg, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl leading-relaxed text-[11px] ${
                            msg.autor === 'usuario'
                              ? 'bg-blue-900/40 text-blue-100 ml-4 border border-blue-800/40'
                              : 'bg-slate-950 text-slate-200 mr-4 border border-slate-800 shadow-xs'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[9px] text-slate-400 mb-1 font-mono">
                            <span className="font-bold text-slate-300">{msg.autor === 'usuario' ? '👔 Tomás' : `${empleadoActivo.avatarEmoji} ${empleadoActivo.apodo}`}</span>
                            <div className="flex items-center gap-1.5">
                              <span>{msg.hora}</span>
                              {msg.autor === 'agente' && (
                                <button
                                  onClick={() => hablarTexto(msg.mensaje)}
                                  className="text-slate-400 hover:text-cyan-300 cursor-pointer text-[10px] p-0.5 rounded hover:bg-slate-800 transition"
                                  title="Escuchar con voz natural"
                                >
                                  🔊
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.mensaje}</p>
                        </div>
                      ))}

                      {enviandoChat && (
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 mr-6 text-slate-400 text-[10px] flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                          <span>{empleadoActivo.apodo} está analizando con IA y redactando...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={mensajeInput}
                        onChange={e => setMensajeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEnviarMensaje()}
                        disabled={enviandoChat}
                        placeholder={`Instrucción o consulta directa a ${empleadoActivo.apodo}...`}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2997ff] disabled:opacity-60"
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

                {/* Botón directo a editar calibración */}
                <button
                  onClick={() => setPestañaActiva('entrenamiento')}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <BrainCircuit className="h-4 w-4" />
                  <span>Calibrar Habilidades & Prompts de {empleadoActivo.apodo}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 flex-1 overflow-y-auto p-4">
          
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">Selecciona Empleado a Calibrar:</span>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {empleados.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => setEmpleadoSeleccionadoId(emp.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    empleadoActivo.id === emp.id
                      ? 'bg-blue-950/80 border-[#2997ff] ring-1 ring-[#2997ff]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
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
                <label className="block font-bold text-slate-300 mb-1">Trayectoria & Experiencia:</label>
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
                    defaultValue={empleadoActivo.atribucionesEjecutivas.join('\n')}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Certificaciones Élite (1 por línea):</label>
                  <textarea
                    name="certificaciones"
                    defaultValue={empleadoActivo.certificacionesElite.join('\n')}
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
                    defaultValue={empleadoActivo.hardSkills.join('\n')}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Liderazgo & Soft Skills (1 por línea):</label>
                  <textarea
                    name="softSkills"
                    defaultValue={empleadoActivo.softSkills.join('\n')}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Reglas de Negocio Estrictas (1 por línea):</label>
                <textarea
                  name="reglasNegocio"
                  defaultValue={empleadoActivo.entrenamiento.reglasNegocio.join('\n')}
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

      {/* ── CONTENIDO: VISTA DE SALA DE DIRECTORIO & MESA EJECUTIVA ── */}
      {pestañaActiva === 'directorio' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
          
          {/* Header de la Sala de Directorio */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏛️</span>
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-700/60">
                    SALA DE DIRECTORIO & MESA REDONDA
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Consejo Ejecutivo Gama Seguridad SpA
                </h2>
                <p className="text-xs text-slate-300">
                  Presidida por Tomás Toro-Moreno (CEO & Fundador) • 12 Directores y Especialistas en Sesión
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPestañaActiva('juego_oficina')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Building className="h-4 w-4" />
                  <span>Ver en Planta Virtual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Selector de Agenda Estratégica */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Agenda Estratégica de la Sesión
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Selecciona un tema o redacta una directiva especial
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { id: 'expansion', titulo: 'Expansión & Capacidad 2026', desc: 'Evaluación de carga vs 415 abonados y política de contrataciones', emoji: '🏛️' },
                { id: 'legal_os10', titulo: 'Blindaje Legal OS-10', desc: 'Memorial ante Prefectura conforme a Ley N° 21.659 de Central Virtual', emoji: '⚖️' },
                { id: 'baterias', titulo: 'Mantenimiento Preventivo Baterías', desc: 'Lote de 30 baterías 12V 7Ah con 14.5% ahorro para invierno', emoji: '📦' },
                { id: 'yolov11', titulo: 'YOLOv11 Perimetral en CRA', desc: 'Filtro de falsas alarmas y video-verificación en 180ms', emoji: '🧠' },
                { id: 'personalizado', titulo: 'Directiva Especial de Tomás', desc: 'Ingresa un tema libre para debate y consenso del equipo', emoji: '✏️' }
              ].map(t => (
                <div
                  key={t.id}
                  onClick={() => setTemaDirectorio(t.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    temaDirectorio === t.id
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md ring-1 ring-indigo-400'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.emoji}</span>
                    <h4 className="text-xs font-black text-white leading-tight">{t.titulo}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{t.desc}</p>
                </div>
              ))}
            </div>

            {temaDirectorio === 'personalizado' && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-indigo-300 mb-1">
                  Escribe la agenda o instrucción a debatir por el Consejo:
                </label>
                <textarea
                  rows={2}
                  value={temaPersonalizado}
                  onChange={e => setTemaPersonalizado(e.target.value)}
                  placeholder="Ej: Análisis de viabilidad para abrir sucursal operativa en Antofagasta y protocolos de comunicación..."
                  className="w-full bg-slate-950 border border-indigo-700/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 leading-relaxed font-sans"
                />
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={handleIniciarDebateDirectorio}
                disabled={debatiendoDirectorio}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:brightness-110 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/50 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{debatiendoDirectorio ? 'Generando Consenso...' : 'Iniciar Debate de Directorio (Consenso Multi-Agente)'}</span>
              </button>
            </div>
          </div>

          {/* Debate de los Directores & Intervenciones en Vivo */}
          {debateDirectorio.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Deliberación del Consejo en Mesa Redonda
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  QUORUM: 12 PRESENTES
                </span>
              </div>

              <div className="space-y-3">
                {debateDirectorio.map(interv => (
                  <div
                    key={interv.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{interv.emoji}</span>
                        <div>
                          <h4 className="text-xs font-black text-white">{interv.nombre}</h4>
                          <span className="text-[10px] text-slate-400 font-bold">{interv.rol}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => hablarTexto(interv.mensaje)}
                        className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition cursor-pointer"
                        title="Escuchar intervención"
                      >
                        🔊
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans pl-1 border-l-2 border-indigo-500/60">
                      {interv.mensaje}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acta Oficial Generada con Acuerdos y Despacho a tetoromoreno@gamasecurity.cl */}
          {actaGenerada && (
            <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border-2 border-indigo-500/80 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest font-black bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-600/60">
                    DOCUMENTO OFICIAL RESUELTO
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {actaGenerada.titulo}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {actaGenerada.fecha} • {actaGenerada.hora} hrs • Presidida por Tomás Toro-Moreno
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => hablarTexto(actaGenerada.contenidoCompleto)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🔊 Escuchar Acta</span>
                  </button>
                  <button
                    onClick={handleDespacharActaEmail}
                    disabled={despachandoActaEmail}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/50 active:scale-95 disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{despachandoActaEmail ? 'Despachando...' : 'Despachar Acta a tetoromoreno@gamasecurity.cl'}</span>
                  </button>
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-900/50 space-y-1.5">
                <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  Resumen Ejecutivo del Consenso:
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {actaGenerada.resumen}
                </p>
              </div>

              {/* Acuerdos Unánimes */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCheck className="h-4 w-4" />
                  <span>Acuerdos Formales Adoptados por Unanimidad:</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {actaGenerada.acuerdos.map((acuerdo, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-950/80 border border-emerald-900/50 rounded-xl text-xs text-slate-200 leading-relaxed flex items-start gap-2"
                    >
                      <span className="h-5 w-5 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 font-mono font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{acuerdo}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Texto Completo del Acta */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {actaGenerada.contenidoCompleto}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── CONTENIDO: VISTA DE BÓVEDA DE ENTREGABLES & DESPACHOS ── */}
      {pestañaActiva === 'entregables' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
          
          {/* Header de la Bóveda */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-800/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
                    BÓVEDA OFICIAL DE ENTREGABLES
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Resultados & Trabajos de los 12 Especialistas
                </h2>
                <p className="text-xs text-slate-300">
                  Auditorías forenses, carpetas normativas, planes de adquisición y directivas para Tomás Toro-Moreno
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setOrdenAgenteId('cra_jefa')
                    setModalOrdenDirecta(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/40 active:scale-95"
                >
                  <Zap className="h-4 w-4 fill-slate-950" />
                  <span>Encargar Nuevo Trabajo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Banner de Feedback de Éxito */}
          {despachoExitosoMsg && (
            <div className="p-3.5 bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{despachoExitosoMsg}</span>
            </div>
          )}

          {/* Filtro de Entregables */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <span className="text-slate-400 text-xs shrink-0 mr-1">Filtrar por Área:</span>
            {[
              { id: 'todos', label: 'Todos los Entregables' },
              { id: 'auditoria', label: '🚨 Auditorías CRA' },
              { id: 'legal', label: '⚖️ Legal & OS10' },
              { id: 'comercial', label: '💼 Comercial' },
              { id: 'operaciones', label: '📦 Abastecimiento ERP' },
              { id: 'ia', label: '🧠 IA & Visión' },
              { id: 'expansion', label: '🏛️ Expansión & Capacidad' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFiltroTipoEntregable(f.id)}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                  filtroTipoEntregable === f.id
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Grilla de Entregables Oficiales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {entregables
              .filter(e => filtroTipoEntregable === 'todos' || e.tipo === filtroTipoEntregable)
              .map(ent => (
                <div
                  key={ent.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4 transition"
                >
                  <div className="space-y-3">
                    {/* Header del Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-xl bg-slate-950 border border-slate-800">{ent.autorEmoji}</span>
                        <div>
                          <h4 className="text-xs font-black text-white">{ent.autorNombre}</h4>
                          <p className="text-[10px] text-slate-400 font-bold">{ent.autorRol}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{ent.fecha}</span>
                    </div>

                    {/* Título y Subtítulo */}
                    <div>
                      <h3 className="text-sm font-black text-white leading-snug">{ent.titulo}</h3>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">{ent.subtitulo}</p>
                    </div>

                    {/* Resumen */}
                    <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                      {ent.resumen}
                    </p>

                    {/* Puntos Clave */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Puntos Destacados:
                      </span>
                      {ent.puntosClave.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-snug">
                          <span className="text-emerald-400 font-bold shrink-0">✓</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer de Acciones & Estado */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">Estado:</span>
                      {ent.estado === 'pendiente' && (
                        <span className="font-bold text-amber-400 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded-full font-mono text-[10px]">
                          🟡 Listo para Revisión
                        </span>
                      )}
                      {ent.estado === 'aprobado' && (
                        <span className="font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono text-[10px]">
                          ✓ Aprobado por Tomás ({ent.fechaAprobacion})
                        </span>
                      )}
                      {ent.estado === 'despachado' && (
                        <span className="font-bold text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded-full font-mono text-[10px]">
                          📧 Despachado a tetoromoreno@gamasecurity.cl
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setEntregableModal(ent)}
                        className="py-2 px-2 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Ver contenido técnico completo"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Ver</span>
                      </button>

                      <button
                        onClick={() => handleDespacharEntregable(ent)}
                        disabled={despachandoEmailId === ent.id}
                        className="py-2 px-2 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                        title="Despachar a tetoromoreno@gamasecurity.cl vía Resend"
                      >
                        <Mail className="h-3.5 w-3.5 text-blue-300" />
                        <span>{despachandoEmailId === ent.id ? '...' : 'Despachar'}</span>
                      </button>

                      <button
                        onClick={() => handleAprobarEntregable(ent.id)}
                        disabled={ent.estado === 'aprobado'}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 ${
                          ent.estado === 'aprobado'
                            ? 'bg-slate-950 text-slate-500 border border-slate-800 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                        }`}
                        title="Aprobar formalmente como Tomás"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{ent.estado === 'aprobado' ? 'Listo' : 'Aprobar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

        </div>
      )}

      {/* ── MODAL: EMISIÓN DE ORDEN EJECUTIVA DIRECTA DE TOMÁS ── */}
      {modalOrdenDirecta && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-amber-950/80 rounded-2xl border border-amber-700/60">⚡</span>
                <div>
                  <h3 className="text-base font-black text-white">
                    Directiva Ejecutiva de Tomás Toro-Moreno
                  </h3>
                  <p className="text-xs text-amber-300">
                    Asignación de misión directa y prioritaria a un especialista de la oficina autónoma
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOrdenDirecta(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {ordenEmitidaSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{ordenEmitidaSuccess}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Selección del Especialista */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  1. Especialista Destinatario de la Orden:
                </label>
                <select
                  value={ordenAgenteId}
                  onChange={e => setOrdenAgenteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {empleados
                    .filter(e => e.id !== 'gerencia_general')
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.avatarEmoji} {emp.nombre} — {emp.rol}
                      </option>
                    ))}
                </select>
              </div>

              {/* Nivel de Prioridad */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  2. Prioridad de Ejecución:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: 'Normal', color: 'bg-slate-950 border-slate-800 text-slate-300' },
                    { id: 'alta', label: 'Alta (Prioridad)', color: 'bg-amber-950 border-amber-600 text-amber-200' },
                    { id: 'urgente', label: 'Urgente 24/7 (Inmediata)', color: 'bg-red-950 border-red-600 text-red-200' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setOrdenPrioridad(p.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        ordenPrioridad === p.id ? p.color + ' ring-2 ring-white/50' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instrucción */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  3. Instrucción Ejecutiva de Tomás:
                </label>
                <textarea
                  rows={3}
                  value={ordenInstruccion}
                  onChange={e => setOrdenInstruccion(e.target.value)}
                  placeholder="Ej: Sofía, corre de urgencia una auditoría sobre las cuentas de la zona de Chicureo y prepárame un informe con las que no reportaron en las últimas 24 horas..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed font-sans"
                />
              </div>

              {/* Atajos Rápidos de Orden */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Sugerencias Rápidas para el Agente Seleccionado:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ordenAgenteId === 'cra_jefa' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setOrdenInstruccion('Audita de inmediato todas las cuentas sin test periódico en 72h y emite alerta técnica a terreno.')}
                        className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg cursor-pointer transition"
                      >
                        ⚡ Auditoría señales 72h
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrdenInstruccion('Verifica los tiempos de respuesta y latencia de despacho en el turno nocturno de la CRA.')}
                        className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg cursor-pointer transition"
                      >
                        ⚡ SLA Turno Nocturno
                      </button>
                    </>
                  )}
                  {ordenAgenteId === 'legal_os10' && (
                    <button
                      type="button"
                      onClick={() => setOrdenInstruccion('Redacta un recurso de reposición formal ante Prefectura OS-10 sustentando Central Virtual sin costos ociosos.')}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg cursor-pointer transition"
                    >
                      ⚡ Recurso de Reposición OS-10
                    </button>
                  )}
                  {ordenAgenteId === 'comercial_jefa' && (
                    <button
                      type="button"
                      onClick={() => setOrdenInstruccion('Diseña propuesta comercial para condominio de 60 casas destacando que son dueños de su equipo sin comodato.')}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg cursor-pointer transition"
                    >
                      ⚡ Propuesta Condominio Anti-Comodato
                    </button>
                  )}
                  {ordenAgenteId === 'ia_compras' && (
                    <button
                      type="button"
                      onClick={() => setOrdenInstruccion('Emite orden de compra para lote de 30 baterías 12V 7Ah con el distribuidor que ofreció el 14.5% de descuento.')}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg cursor-pointer transition"
                    >
                      ⚡ Emitir OC 30 Baterías 12V 7Ah
                    </button>
                  )}
                  {ordenAgenteId === 'ia_datos' && (
                    <button
                      type="button"
                      onClick={() => setOrdenInstruccion('Genera el informe de conformidad APDP Ley N° 21.719 acreditando el cifrado AES-256 de toda la base de datos.')}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg cursor-pointer transition"
                    >
                      ⚡ Certificado APDP Ley 21.719
                    </button>
                  )}
                  {ordenAgenteId === 'gerencia_expansion' && (
                    <button
                      type="button"
                      onClick={() => setOrdenInstruccion('Realiza proyección de capacidad de la colonia de agentes para absorber 100 nuevos clientes en el próximo trimestre.')}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg cursor-pointer transition"
                    >
                      ⚡ Proyección 100 Nuevos Abonados
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalOrdenDirecta(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEmitirOrdenDirecta}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg shadow-amber-950/40 text-xs flex items-center gap-1.5 active:scale-95"
              >
                <Zap className="h-4 w-4 fill-slate-950" />
                <span>Impartir Orden Ejecutiva Inmediata</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: VISOR DE ENTREGABLE COMPLETO ── */}
      {entregableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-slate-950 rounded-2xl border border-slate-800">{entregableModal.autorEmoji}</span>
                <div>
                  <h3 className="text-base font-black text-white">{entregableModal.titulo}</h3>
                  <p className="text-xs text-slate-400">
                    Emitido por {entregableModal.autorNombre} ({entregableModal.autorRol}) • {entregableModal.fecha}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEntregableModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap">
              {entregableModal.contenidoCompleto}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800 shrink-0">
              <div className="text-[11px] text-slate-400">
                Destino formal: <strong>Tomás Toro-Moreno &lt;tetoromoreno@gamasecurity.cl&gt;</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => hablarTexto(entregableModal.contenidoCompleto)}
                  className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1"
                >
                  <span>🔊 Escuchar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDespacharEntregable(entregableModal)
                    setEntregableModal(null)
                  }}
                  className="px-4 py-2 bg-blue-900/80 hover:bg-blue-800 text-blue-100 border border-blue-600 rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Mail className="h-4 w-4" />
                  <span>Despachar a mi Correo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAprobarEntregable(entregableModal.id)
                    setEntregableModal(null)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-black rounded-xl cursor-pointer text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  <Check className="h-4 w-4" />
                  <span>Aprobar como Tomás</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {pestañaActiva === 'organigrama' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1 overflow-y-auto space-y-8 m-4">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
              ESTRUCTURA DE MANDO CORPORATIVO
            </span>
            <h3 className="text-xl font-black text-white">Organigrama Oficial Gama Seguridad SpA</h3>
            <p className="text-xs text-slate-400">Jerarquía directiva, áreas operativas y líneas de reporte 24/7</p>
          </div>

          <div className="flex justify-center">
            <div
              onClick={() => {
                setEmpleadoSeleccionadoId('gerencia_general')
                setPestañaActiva('juego_oficina')
              }}
              className="bg-blue-950 border-2 border-blue-500/80 rounded-2xl p-4 w-72 text-center shadow-xl cursor-pointer hover:scale-105 transition hover:shadow-blue-900/50"
            >
              <div className="text-3xl mb-1">👔</div>
              <h4 className="font-black text-white text-sm">Tomás Toro-Moreno</h4>
              <p className="text-xs font-bold text-[#38bdf8]">Gerente General & CEO</p>
              <span className="inline-block mt-2 bg-blue-900 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full">
                Liderazgo y Fundador
              </span>
            </div>
          </div>

          <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

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

          <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
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
                    <p className="text-[10px] text-slate-400">Rector Técnico Virtual</p>
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

            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
                <TrendingUp className="h-4 w-4" />
                <span>Área Comercial & Marketing</span>
              </div>
              <div
                onClick={() => { setEmpleadoSeleccionadoId('comercial_jefa'); setPestañaActiva('juego_oficina') }}
                className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-emerald-500 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">💼</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Valentina Lagos</h5>
                    <p className="text-[10px] text-slate-400">Gerente Comercial & Mkt</p>
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

      {/* ── MODAL: PREVIEW DE IMAGEN EN ALTA RESOLUCIÓN ── */}
      {modalImagenPreview && (
        <div
          onClick={() => setModalImagenPreview(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-4 space-y-3 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white truncate">{modalImagenPreview.titulo}</h4>
              <button
                onClick={() => setModalImagenPreview(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 font-bold cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
              <img
                src={modalImagenPreview.url}
                alt={modalImagenPreview.titulo}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="flex justify-between items-center pt-1 text-[11px]">
              <span className="text-slate-400 font-mono">1080 x 1080 px · Alta Definición</span>
              <a
                href={modalImagenPreview.url}
                download="Propuesta_Gama_Seguridad.jpg"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Descargar JPG</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
