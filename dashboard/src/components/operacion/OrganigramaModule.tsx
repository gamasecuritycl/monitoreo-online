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
  Heart
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
  const [pestañaActiva, setPestañaActiva] = useState<'juego_oficina' | 'entrenamiento' | 'organigrama'>('juego_oficina')
  const [subPestañaLateral, setSubPestañaLateral] = useState<'atribuciones' | 'linkedin' | 'chat' | 'acciones_ia'>('atribuciones')
  const [velocidadSim, setVelocidadSim] = useState<'1x' | '2x' | 'pausa'>('1x')
  const [modoReunionDirectorio, setModoReunionDirectorio] = useState<boolean>(false)
  const [modoPausaBienestar, setModoPausaBienestar] = useState<boolean>(false)
  const [vozHabilitada, setVozHabilitada] = useState<boolean>(false)

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
        <div className="flex items-center gap-2">
          
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

          <button
            onClick={() => {
              setModoReunionDirectorio(!modoReunionDirectorio)
              if (!modoReunionDirectorio) setModoPausaBienestar(false)
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              modoReunionDirectorio
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-900/30'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-indigo-400" />
            <span>Directorio</span>
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


          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setPestañaActiva('juego_oficina')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                pestañaActiva === 'juego_oficina' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Planta Virtual</span>
            </button>
            <button
              onClick={() => setPestañaActiva('organigrama')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                pestañaActiva === 'organigrama' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Workflow className="h-3.5 w-3.5" />
              <span>Organigrama</span>
            </button>
            <button
              onClick={() => setPestañaActiva('entrenamiento')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                pestañaActiva === 'entrenamiento' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
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
                      setSubPestañaLateral('chat')
                      setMensajeInput('Instrucción prioritaria: ')
                    }}
                    className="py-2 px-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                    <span>Dar Instrucción</span>
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
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <Share2 className="h-3.5 w-3.5" />
                            <span>Borradores RRSS (Herramientas Gratis)</span>
                          </span>
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded">
                            Supeditado a Tomás
                          </span>
                        </div>

                        <div className="space-y-2">
                          {borradoresMkt.map(post => (
                            <div key={post.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-cyan-400">{post.red}</span>
                                <span className="text-amber-400 font-mono text-[9px] bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-800/40">
                                  {post.estado}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-200 text-[11px] leading-snug">{post.titulo}</h5>
                              <p className="text-[10px] text-slate-400 leading-snug">{post.descripcion}</p>
                              <div className="text-[9px] font-mono text-slate-500">
                                Herramienta: {post.herramienta}
                              </div>
                            </div>
                          ))}

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

      {/* ── CONTENIDO: VISTA DE ORGANIGRAMA JERÁRQUICO ── */}
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

    </div>
  )
}
