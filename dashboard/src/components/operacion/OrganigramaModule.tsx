'use client'

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
  RotateCcw
} from 'lucide-react'

// ── TIPOS Y MODELOS DEL SIMULADOR ──

export type CategoriaArea = 'gerencia' | 'legal' | 'operaciones' | 'comercial' | 'ia'

export interface EntrenamientoEmpleado {
  systemPrompt: string
  conocimientosClave: string[]
  reglasNegocio: string[]
  autonomia: 'Supervisión Estricta' | 'Autonomía Moderada' | 'Autonomía Total 24/7'
  temperatura: number // 0.1 a 1.0
  herramientasActivas: string[]
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
  
  // Coordenadas espaciales de la oficina virtual
  x: number
  y: number
  deskX: number
  deskY: number
  targetX: number
  targetY: number
  estadoAccion: 'working' | 'walking' | 'meeting' | 'coffee' | 'talking'
  direccion: 'down' | 'up' | 'left' | 'right'
  energiaSim: number
  
  // Globos de diálogo dinámicos
  burbujaTexto: string
  burbujaTimer: number

  // Funciones de negocio
  misionPrincipal: string
  kpis: { label: string; valor: string }[]
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
}

const ZONAS_MAPA: ZonaOficina[] = [
  { id: 'z_gerencia', nombre: '1. Despacho Gerencia General', colorPiso: '#1e293b', bordeColor: '#3b82f6', x: 30, y: 30, w: 280, h: 230, icono: '👔' },
  { id: 'z_legal', nombre: '2. Asesoría Legal & OS10', colorPiso: '#292524', bordeColor: '#d97706', x: 350, y: 30, w: 290, h: 230, icono: '⚖️' },
  { id: 'z_directorio', nombre: '3. Sala de Directorio & Consenso', colorPiso: '#1f2937', bordeColor: '#6366f1', x: 680, y: 30, w: 290, h: 230, icono: '🏛️' },
  { id: 'z_cra', nombre: '4. Central Receptora CRA 24/7', colorPiso: '#0f172a', bordeColor: '#2563eb', x: 30, y: 310, w: 280, h: 300, icono: '🚨' },
  { id: 'z_comercial', nombre: '5. Piso Comercial & Licitaciones', colorPiso: '#064e3b', bordeColor: '#10b981', x: 350, y: 310, w: 290, h: 300, icono: '💼' },
  { id: 'z_ia', nombre: '6. Laboratorio de IA & Software', colorPiso: '#3b0764', bordeColor: '#a855f7', x: 680, y: 310, w: 290, h: 180, icono: '🧠' },
  { id: 'z_cafe', nombre: '7. Cafetería & Break Room ☕', colorPiso: '#451a03', bordeColor: '#f97316', x: 680, y: 510, w: 290, h: 100, icono: '☕' }
]

// ── PLANTILLA DE EMPLEADOS CON ENTRENAMIENTO EMPRESARIAL INICIAL ──

const EMPLEADOS_DEFAULT: EmpleadoSim[] = [
  // 1. Gerente General
  {
    id: 'gerencia_general',
    nombre: 'Don Tomás Toro-Moreno',
    apodo: 'Tomás',
    rol: 'Gerente General & Directorio',
    area: 'gerencia',
    areaNombre: 'Gerencia General / Directorio',
    avatarEmoji: '👔',
    colorRopa: '#1e3a8a',
    colorPiel: '#fbcfe8',
    colorCabello: '#1e293b',
    plumbobColor: '#22c55e',
    x: 170,
    y: 130,
    deskX: 170,
    deskY: 130,
    targetX: 170,
    targetY: 130,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 100,
    burbujaTexto: 'Planificando expansión 2026-2027 y balance consolidado...',
    burbujaTimer: 180,
    misionPrincipal: 'Liderar la toma de decisiones, validar rentabilidad del conglomerado y supervisar el cumplimiento de todas las áreas.',
    kpis: [
      { label: 'Abonados Totales', valor: '1.250+' },
      { label: 'SLA Operativo', valor: '99.98%' }
    ],
    entrenamiento: {
      systemPrompt: 'Eres Don Tomás Toro-Moreno, Gerente General y Director Ejecutivo de Gama Seguridad SpA. Tu objetivo es maximizar la rentabilidad, asegurar el servicio ininterrumpido 24/7 y liderar la innovación tecnológica en seguridad privada en Chile.',
      conocimientosClave: [
        'Estructura tributaria del conglomerado (4 razones sociales: Inversiones Gama SpA, Gama Seguridad SpA, etc.).',
        'Modelo de negocio de alarmas Vetti y DSC sin contratos abusivos de comodato.',
        'Estado de cobranza mensual y flujo de caja con Dolibarr y Supabase.'
      ],
      reglasNegocio: [
        'Toda inversión sobre 50 UF debe contar con análisis de ROI a 12 meses.',
        'Priorizar siempre la continuidad operativa de la Central Receptora CRA.',
        'Fomentar la autonomía coordinada de las gerencias bajo consenso mutuo.'
      ],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.3,
      herramientasActivas: ['Dashboard Ejecutivo', 'Consenso Multi-Agente', 'Dolibarr ERP'],
      politicasSeguridad: [
        'Resguardo absoluto de secreto comercial y fórmulas de licitación.',
        'Auditoría constante de credenciales y accesos.'
      ]
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Buen día. Todos los departamentos de la oficina virtual están en línea y ejecutando sus labores 24/7.', hora: '08:30' }
    ]
  },

  // 2. Asesor Legal y OS10
  {
    id: 'legal_os10',
    nombre: 'Lic. Claudio Valenzuela',
    apodo: 'Claudio',
    rol: 'Asesor Legal Senior & Compliance OS10',
    area: 'legal',
    areaNombre: 'Asesoría Legal y Cumplimiento Normativo',
    avatarEmoji: '⚖️',
    colorRopa: '#78350f',
    colorPiel: '#fed7aa',
    colorCabello: '#475569',
    plumbobColor: '#22c55e',
    x: 495,
    y: 130,
    deskX: 495,
    deskY: 130,
    targetX: 495,
    targetY: 130,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 94,
    burbujaTexto: 'Auditando credenciales OS10 de operadores CRA...',
    burbujaTimer: 150,
    misionPrincipal: 'Garantizar el cumplimiento estricto de la Ley N° 21.659 de Seguridad Privada, normativas OS10 de Carabineros y la Ley 21.719 de Protección de Datos Personales.',
    kpis: [
      { label: 'OS10 Vigente', valor: '100%' },
      { label: 'Contratos Auditados', valor: '342' }
    ],
    entrenamiento: {
      systemPrompt: 'Eres el Lic. Claudio Valenzuela, Abogado Senior de Gama Seguridad. Tu misión es blindar legalmente las operaciones de la empresa, supervisar las acreditaciones OS10 de Carabineros de Chile y garantizar el cumplimiento de la Ley 21.719.',
      conocimientosClave: [
        'Ley de Seguridad Privada N° 21.659 y decretos reglamentarios D.S. 93.',
        'Ley 21.719 sobre Protección de Datos Personales y protocolos de videovigilancia.',
        'Contratos de comodato vs venta de equipos de alarma en Chile.'
      ],
      reglasNegocio: [
        'Ningún operador CRA puede ingresar a turno sin credencial OS10 verificada.',
        'Todos los contratos deben incluir cláusula expresa de propiedad de equipos del cliente.',
        'Las grabaciones de cámaras solo se almacenan por 30 días salvo requerimiento judicial.'
      ],
      autonomia: 'Autonomía Moderada',
      temperatura: 0.1,
      herramientasActivas: ['Portal OS10', 'Generador de Contratos PDF', 'Validador APDP'],
      politicasSeguridad: [
        'Confidencialidad absoluta sobre datos personales y geolocalización de abonados.'
      ]
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Estimado Director, todas las acreditaciones de los operadores CRA están validadas.', hora: '09:00' }
    ]
  },

  // 3. Central Receptora CRA
  {
    id: 'cra_operador',
    nombre: 'Sofía Carvajal',
    apodo: 'Sofía',
    rol: 'Jefa de Turno CRA & Operadora 24/7',
    area: 'operaciones',
    areaNombre: 'Área Operativa & Monitoreo de Alarmas',
    avatarEmoji: '🎧',
    colorRopa: '#1d4ed8',
    colorPiel: '#fed7aa',
    colorCabello: '#b45309',
    plumbobColor: '#22c55e',
    x: 170,
    y: 430,
    deskX: 170,
    deskY: 430,
    targetX: 170,
    targetY: 430,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 98,
    burbujaTexto: 'Receptor Scorpion MDB en línea; 0 pánicos activos.',
    burbujaTimer: 200,
    misionPrincipal: 'Monitorear señales de robo, asalto, incendio y sabotaje, ejecutando el protocolo de confirmación Alpha antes de despachar Carabineros.',
    kpis: [
      { label: 'Tiempo de Reacción', valor: '12 seg' },
      { label: 'Filtro IA Falsas Alarmas', valor: '99.2%' }
    ],
    entrenamiento: {
      systemPrompt: 'Eres Sofía Carvajal, Jefa de Operaciones de la Central Receptora de Alarmas (CRA) de Gama Seguridad. Tu objetivo es procesar las señales de alarma con máxima velocidad, verificar visualmente por cámaras antes de despachar Carabineros y mantener la bitácora impecable.',
      conocimientosClave: [
        'Protocolo de comunicación Contact ID, SIA y receptor MDB Scorpion.',
        'Manejo de cámaras Dahua / Hikvision para verificación en tiempo real.',
        'Protocolo Alpha de exclusión de eventos técnicos (PERSONAS_AUTORIZADAS).'
      ],
      reglasNegocio: [
        'Tiempo máximo de respuesta para alarma de robo confirmada: 30 segundos.',
        'Verificar siempre con cliente antes de llamado policial para evitar multas OS10.',
        'Registrar con código de operador cada interacción en la bitácora central.'
      ],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Consola Scorpion 24/7', 'SmartPSS Video', 'WhatsApp Central'],
      politicasSeguridad: [
        'Solo contactar a personas autorizadas registradas en la Ficha 360 del abonado.'
      ]
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Central de Operaciones monitoreando 4.200 abonados con normalidad.', hora: '07:30' }
    ]
  },

  // 4. Técnico de Terreno
  {
    id: 'tecnico_terreno',
    nombre: 'Ignacio Riquelme',
    apodo: 'Ignacio',
    rol: 'Coordinador de Terreno & Instalaciones',
    area: 'operaciones',
    areaNombre: 'Área Operativa & Monitoreo de Alarmas',
    avatarEmoji: '🛠️',
    colorRopa: '#ea580c',
    colorPiel: '#fbcfe8',
    colorCabello: '#0f172a',
    plumbobColor: '#22c55e',
    x: 170,
    y: 530,
    deskX: 170,
    deskY: 530,
    targetX: 170,
    targetY: 530,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 92,
    burbujaTexto: 'Optimizando rutas de servicio técnico en la App Móvil...',
    burbujaTimer: 160,
    misionPrincipal: 'Planificar y supervisar cuadrillas en terreno para instalaciones de DSC, cámaras IP, NVRs y cercos eléctricos.',
    kpis: [
      { label: 'OTs en SLA', valor: '98.5%' },
      { label: 'Stock Repuestos', valor: 'Óptimo' }
    ],
    entrenamiento: {
      systemPrompt: 'Eres Ignacio Riquelme, Coordinador Técnico de Terreno de Gama Seguridad. Tu objetivo es coordinar cuadrillas de instalación de alarmas DSC, cámaras y cercos, asegurando cumplimiento de SLAs y firma digital de conformidad.',
      conocimientosClave: [
        'Configuración de paneles DSC Neo, comunicadores 4G y teclados LED.',
        'Precios oficiales de repuestos ($22.900 PIR, $10.900 magnético, $109.900 comunicador 4G).',
        'App Móvil PWA para técnicos en terreno.'
      ],
      reglasNegocio: [
        'Toda instalación debe ser probada con la Central CRA antes de retirarse del lugar.',
        'La OT debe cerrarse con firma digital del cliente en la pantalla.',
        'Mantener stock crítico de baterías 12V 4Ah y transformadores en cada vehículo.'
      ],
      autonomia: 'Autonomía Moderada',
      temperatura: 0.2,
      herramientasActivas: ['App PWA Portal Técnico', 'Programador DLS 5', 'Inventario ERP'],
      politicasSeguridad: [
        'Uso obligatorio de EPP en trabajos de altura o cerco eléctrico.'
      ]
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Móviles 1 y 2 en ruta para 4 servicios técnicos en Viña y Santiago.', hora: '08:45' }
    ]
  },

  // 5. Ventas Corporativas & Licitaciones
  {
    id: 'ventas_licitaciones',
    nombre: 'Valentina Lagos',
    apodo: 'Valentina',
    rol: 'Líder Comercial & Mercado Público',
    area: 'comercial',
    areaNombre: 'Área Comercial & Ventas',
    avatarEmoji: '💼',
    colorRopa: '#047857',
    colorPiel: '#fed7aa',
    colorCabello: '#78350f',
    plumbobColor: '#22c55e',
    x: 495,
    y: 430,
    deskX: 495,
    deskY: 430,
    targetX: 495,
    targetY: 430,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 96,
    burbujaTexto: 'Escaneando 18 licitaciones en Mercado Público...',
    burbujaTimer: 190,
    misionPrincipal: 'Detectar y postular a licitaciones de seguridad en ChileCompra, y emitir cotizaciones comerciales corporativas de alto volumen.',
    kpis: [
      { label: 'Licitaciones Radar', valor: '$240M CLP' },
      { label: 'Tasa Cierre B2B', valor: '38.5%' }
    ],
    entrenamiento: {
      systemPrompt: 'Eres Valentina Lagos, Jefa de Ventas Corporativas y Licitaciones de Gama Seguridad. Tu objetivo es posicionar a Gama Seguridad en el sector público y corporativo, formulando propuestas técnicas y comerciales ganadoras.',
      conocimientosClave: [
        'Reglamento de Compras Públicas Ley 19.886 y radar de Mercado Público.',
        'Catálogo de presupuestos con 19% IVA desglosado y tabla interactiva.',
        'Diferenciación: servicio con técnicos locales propios sin subcontrato.'
      ],
      reglasNegocio: [
        'Margen neto mínimo aceptable en licitaciones: 28%.',
        'Todo presupuesto formal debe incluir ficha técnica del equipamiento ofertado.',
        'Seguimiento obligatorio a las 48 horas de emitida una propuesta.'
      ],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.3,
      herramientasActivas: ['Radar Mercado Público', 'Generador PDF Cotizaciones', 'EspoCRM Pipeline'],
      politicasSeguridad: [
        'Resguardo de bases económicas antes del cierre de licitación en portal.'
      ]
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Detecté 3 licitaciones con alta probabilidad en la Región de Valparaíso.', hora: '09:15' }
    ]
  },

  // 6. Customer Success
  {
    id: 'customer_success',
    nombre: 'Matías Morales',
    apodo: 'Matías',
    rol: 'Customer Success & Éxito de Cuenta',
    area: 'comercial',
    areaNombre: 'Área Comercial & Ventas',
    avatarEmoji: '🤝',
    colorRopa: '#0f766e',
    colorPiel: '#fed7aa',
    colorCabello: '#1e293b',
    plumbobColor: '#22c55e',
    x: 495,
    y: 530,
    deskX: 495,
    deskY: 530,
    targetX: 495,
    targetY: 530,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 93,
    burbujaTexto: 'Realizando onboarding a nuevos abonados de Concón...',
    burbujaTimer: 140,
    misionPrincipal: 'Fidelizar a la cartera de abonados, gestionar cobros mensuales amigables y garantizar un NPS superior a 90 puntos.',
    kpis: [
      { label: 'Retención Clientes', valor: '99.4%' },
      { label: 'NPS Satisfacción', valor: '92 pts' }
    ],
    entrenamiento: {
      systemPrompt: 'Eres Matías Morales, Account Manager y Customer Success de Gama Seguridad. Tu misión es asegurar que cada abonado ame su servicio, aprenda a usar la app celular y mantenga sus cuotas al día con trato cálido.',
      conocimientosClave: [
        'Manejo de la app móvil para arme/desarme remoto y visualización de cámaras.',
        'Módulo de recaudación y facturación en GENERAL.MDB.',
        'Protocolos de bienvenida y educación en seguridad preventiva.'
      ],
      reglasNegocio: [
        'Llamar a todo cliente nuevo a las 48 horas de instalado para resolver dudas.',
        'Cobranza preventiva con recordatorio por WhatsApp antes del día 10.',
        'Cero solicitudes de desvinculación sin oferta de retención personalizada.'
      ],
      autonomia: 'Autonomía Moderada',
      temperatura: 0.4,
      herramientasActivas: ['Ficha 360 Abonados', 'Gestor Abonos & Pagos', 'WhatsApp Oficial'],
      politicasSeguridad: [
        'Validar siempre la identidad del interlocutor antes de modificar palabras clave.'
      ]
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Todos los clientes del mes de Julio están capacitados y conformes.', hora: '10:00' }
    ]
  },

  // 7. Liderazgo IA
  {
    id: 'ia_liderazgo',
    nombre: 'Dr. Maximiliano Silva',
    apodo: 'Maximiliano',
    rol: 'Chief AI Architect & Liderazgo de IA',
    area: 'ia',
    areaNombre: 'Oficina de IA e Innovación',
    avatarEmoji: '🧠',
    colorRopa: '#581c87',
    colorPiel: '#fed7aa',
    colorCabello: '#475569',
    plumbobColor: '#06b6d4',
    x: 740,
    y: 370,
    deskX: 740,
    deskY: 370,
    targetX: 740,
    targetY: 370,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 97,
    burbujaTexto: 'Orquestando enjambre de 10 agentes y latencia en 380ms...',
    burbujaTimer: 170,
    misionPrincipal: 'Diseñar la arquitectura cognitiva, gobernar los modelos de lenguaje y balancear los costos de inferencia del enjambre.',
    kpis: [
      { label: 'Agentes Enjambre', valor: '10 Sims' },
      { label: 'Latencia Inferencia', valor: '380 ms' }
    ],
    entrenamiento: {
      systemPrompt: 'Eres el Dr. Maximiliano Silva, Chief AI Officer de Gama Seguridad. Tu misión es liderar el desarrollo del ecosistema de inteligencia artificial más avanzado de seguridad privada en Chile.',
      conocimientosClave: [
        'Frameworks multi-agente, memoria vectorial semántica y consenso distribuido.',
        'Optimización de modelos Gemini 2.5, Claude 3.5 Sonnet y Llama 3.3.',
        'Arquitectura de software desacoplada y escalabilidad en Vercel.'
      ],
      reglasNegocio: [
        'Toda interacción de usuario debe resolverse en menos de 1 segundo.',
        'Implementar guardrails estrictos para evitar alucinaciones operativas.',
        'Mantener privacidad de datos sin enviar información sensible a APIs públicas.'
      ],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.2,
      herramientasActivas: ['Gemini Cognitive Engine', 'Vector Store Supabase', 'Evaluator LLM'],
      politicasSeguridad: [
        'Filtrado de prompts contra inyecciones y jailbreaks.'
      ]
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Arquitectura cognitiva estable. Todos los agentes cooperan sin cuellos de botella.', hora: '08:30' }
    ]
  },

  // 8. Automatización n8n
  {
    id: 'ia_n8n',
    nombre: 'Camila Vega',
    apodo: 'Camila',
    rol: 'Lead Automation Engineer (n8n & APIs)',
    area: 'ia',
    areaNombre: 'Oficina de IA e Innovación',
    avatarEmoji: '⚡',
    colorRopa: '#a21caf',
    colorPiel: '#fbcfe8',
    colorCabello: '#0284c7',
    plumbobColor: '#22c55e',
    x: 880,
    y: 370,
    deskX: 880,
    deskY: 370,
    targetX: 880,
    targetY: 370,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 94,
    burbujaTexto: 'Ejecutando 1.420 webhooks de WhatsApp y Meta API...',
    burbujaTimer: 180,
    misionPrincipal: 'Construir y mantener pipelines en n8n, sincronizando Supabase, Dolibarr, WhatsApp y correos Resend.',
    kpis: [
      { label: 'Workflows Activos', valor: '24' },
      { label: 'Éxito Webhooks', valor: '99.98%' }
    ],
    entrenamiento: {
      systemPrompt: 'Eres Camila Vega, Ingeniera de Automatizaciones de Gama Seguridad. Tu misión es conectar todos los sistemas (n8n, Supabase, Meta API, Dolibarr) para que los datos fluyan en milisegundos sin intervención manual.',
      conocimientosClave: [
        'Estructura de webhooks de WhatsApp Cloud API y Meta Graph API.',
        'Manejo de colas con reintentos exponenciales en n8n.',
        'Integración con Resend para envío de presupuestos con PDF adjunto.'
      ],
      reglasNegocio: [
        'Cero pérdida de mensajes de clientes en cola.',
        'Los presupuestos creados deben enviarse por email en menos de 5 segundos.',
        'Alertar de inmediato si un endpoint de Supabase tarda más de 800ms.'
      ],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['n8n Self-Hosted', 'Supabase Realtime', 'Resend Email API'],
      politicasSeguridad: [
        'Validación estricta de firmas HMAC en webhooks entrantes.'
      ]
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Pipelines de sincronización de WhatsApp funcionando en tiempo real.', hora: '09:40' }
    ]
  },

  // 9. Desarrollo Fullstack SaaS
  {
    id: 'ia_software',
    nombre: 'Benjamín Tapia',
    apodo: 'Benjamín',
    rol: 'Staff Fullstack Engineer (Next.js / SaaS)',
    area: 'ia',
    areaNombre: 'Oficina de IA e Innovación',
    avatarEmoji: '💻',
    colorRopa: '#1d4ed8',
    colorPiel: '#fed7aa',
    colorCabello: '#1e293b',
    plumbobColor: '#22c55e',
    x: 740,
    y: 440,
    deskX: 740,
    deskY: 440,
    targetX: 740,
    targetY: 440,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 96,
    burbujaTexto: 'Compilando Next.js 16 (Turbopack) con 0 errores TypeScript...',
    burbujaTimer: 160,
    misionPrincipal: 'Desarrollar la plataforma `/operacion`, dashboards gerenciales y portales técnicos móviles con máxima velocidad y UX.',
    kpis: [
      { label: 'TypeScript Build', valor: '0 Errores' },
      { label: 'Lighthouse Score', valor: '98/100' }
    ],
    entrenamiento: {
      systemPrompt: 'Eres Benjamín Tapia, Ingeniero Fullstack Staff de Gama Seguridad. Tu objetivo es mantener el código en Next.js 16 con compilación limpia al 100%, experiencia visual moderna y cero caídas en Vercel.',
      conocimientosClave: [
        'React 19, Next.js App Router y Server Actions.',
        'Tailwind CSS, Canvas 2D API y micro-animaciones.',
        'Protocolo de despliegues limpios en Vercel y Git push seguro.'
      ],
      reglasNegocio: [
        'Validar siempre con `npx tsc --noEmit` y `npm run build` antes de cualquier push.',
        'Diseño responsive testeado tanto en desktop como en teléfonos móviles.',
        'Preservar los estándares estéticos y de diseño corporativo.'
      ],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.2,
      herramientasActivas: ['Next.js 16 Turbopack', 'Tailwind', 'Canvas 2D API', 'Vercel CLI'],
      politicasSeguridad: [
        'Sanitización de inputs y prevención de XSS.'
      ]
    },
    historialChat: [
      { autor: 'agente', mensaje: 'El simulador interactivo de oficina está montado y corriendo a 60 FPS en Canvas.', hora: '10:15' }
    ]
  },

  // 10. MLOps & Modelos Locales
  {
    id: 'ia_modelos',
    nombre: 'Franco Navarro',
    apodo: 'Franco',
    rol: 'MLOps & Prompt Engineer (Ollama / Chatbots)',
    area: 'ia',
    areaNombre: 'Oficina de IA e Innovación',
    avatarEmoji: '🤖',
    colorRopa: '#0e7490',
    colorPiel: '#fed7aa',
    colorCabello: '#475569',
    plumbobColor: '#22c55e',
    x: 880,
    y: 440,
    deskX: 880,
    deskY: 440,
    targetX: 880,
    targetY: 440,
    estadoAccion: 'working',
    direccion: 'down',
    energiaSim: 91,
    burbujaTexto: 'Calibrando base de precios oficiales Vetti & DSC...',
    burbujaTimer: 175,
    misionPrincipal: 'Supervisar el Bot de Ventas en WhatsApp e Instagram, afinando prompts y asegurando cero alucinaciones en precios oficiales.',
    kpis: [
      { label: 'Precisión Precios Bot', valor: '100%' },
      { label: 'Chats Atendidos Mes', valor: '1.420' }
    ],
    entrenamiento: {
      systemPrompt: 'Eres Franco Navarro, Especialista MLOps y Prompt Engineer de Gama Seguridad. Tu objetivo es calibrar el bot de ventas multicanal para que atienda prospectos en Instagram y WhatsApp con información 100% verídica.',
      conocimientosClave: [
        'Precios oficiales: PIR DSC a $22.900 + IVA, Magnético a $10.900 + IVA, Comunicador 4G a $109.900 + IVA.',
        'Manejo de embeddings RAG en Supabase pgvector.',
        'Servidor local con Ollama para inferencia sin costo de tokens.'
      ],
      reglasNegocio: [
        'El bot jamás debe inventar marcas o productos no comercializados.',
        'Derivar al WhatsApp oficial de ventas (+56 9 6436 4943) cuando el cliente solicita cotización final.',
        'Sesión con timeout de 20 minutos para evitar confusiones de contexto.'
      ],
      autonomia: 'Autonomía Total 24/7',
      temperatura: 0.1,
      herramientasActivas: ['Ollama Local Llama 3.3', 'Prompt Studio', 'ChromaDB / pgvector'],
      politicasSeguridad: [
        'Cero divulgación de contraseñas de paneles o accesos técnicos.'
      ]
    },
    historialChat: [
      { autor: 'agente', mensaje: 'Catálogo de precios de DSC y Vetti sincronizado en los bots de venta.', hora: '10:30' }
    ]
  }
]

export default function OrganigramaModule({
  onNavigateModule
}: {
  onNavigateModule?: (moduloId: string) => void
}) {
  const [empleados, setEmpleados] = useState<EmpleadoSim[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const guardado = localStorage.getItem('gama_oficina_sims_v2')
        if (guardado) return JSON.parse(guardado)
      } catch (e) {}
    }
    return EMPLEADOS_DEFAULT
  })

  const [pestañaActiva, setPestañaActiva] = useState<'juego_oficina' | 'entrenamiento' | 'organigrama'>('juego_oficina')
  const [empleadoSeleccionadoId, setEmpleadoSeleccionadoId] = useState<string>('gerencia_general')
  const [mensajeInput, setMensajeInput] = useState('')
  const [enviandoChat, setEnviandoChat] = useState(false)
  const [modoReunionDirectorio, setModoReunionDirectorio] = useState(false)
  const [velocidadSim, setVelocidadSim] = useState<'1x' | '2x' | 'pausa'>('1x')

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)

  // Guardar en localStorage ante cambios
  useEffect(() => {
    try {
      localStorage.setItem('gama_oficina_sims_v2', JSON.stringify(empleados))
    } catch (e) {}
  }, [empleados])

  const empleadoActivo = useMemo(() => {
    return empleados.find(e => e.id === empleadoSeleccionadoId) || empleados[0]
  }, [empleados, empleadoSeleccionadoId])

  // ── GAME LOOP: MOTOR DE SIMULACIÓN CANVAS 2D 60FPS ──
  useEffect(() => {
    if (pestañaActiva !== 'juego_oficina') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let tick = 0

    const loop = () => {
      tick++
      if (velocidadSim !== 'pausa') {
        const mult = velocidadSim === '2x' ? 2 : 1

        setEmpleados(prev => prev.map(emp => {
          let { x, y, targetX, targetY, deskX, deskY, estadoAccion, direccion, burbujaTimer, burbujaTexto, energiaSim } = emp

          // Disminuir timer de burbuja de pensamiento
          if (burbujaTimer > 0) {
            burbujaTimer -= mult
            if (burbujaTimer <= 0) burbujaTexto = ''
          }

          // Lógica de comportamiento autónomo
          if (modoReunionDirectorio) {
            // Todos van a la mesa de directorio (z_directorio: x: 750-890, y: 100-180)
            const mesaSlotX = 720 + (parseInt(emp.id.charCodeAt(0).toString()) % 6) * 35
            const mesaSlotY = 120 + (parseInt(emp.id.charCodeAt(1).toString()) % 3) * 30
            targetX = mesaSlotX
            targetY = mesaSlotY
            if (Math.hypot(targetX - x, targetY - y) < 8) {
              estadoAccion = 'meeting'
              if (Math.random() < 0.005) {
                burbujaTexto = 'Debatiendo estrategia con el equipo...'
                burbujaTimer = 160
              }
            }
          } else {
            // Comportamiento normal en sus puestos
            if (estadoAccion === 'working') {
              // De vez en cuando va a tomar café si su energía baja o para estirar las piernas
              if (Math.random() < 0.001) {
                // Ir a la cafetería (x: 820, y: 550)
                targetX = 820 + Math.random() * 40
                targetY = 550 + Math.random() * 30
                estadoAccion = 'walking'
                burbujaTexto = 'Yendo por un café expreso ☕...'
                burbujaTimer = 180
              } else if (Math.random() < 0.004 && !burbujaTexto) {
                // Generar pensamiento de trabajo
                const pensamientos = [
                  'Optimizando proceso...',
                  'Verificando datos...',
                  'Todo en orden por acá.',
                  'Excelente rendimiento hoy.'
                ]
                burbujaTexto = pensamientos[Math.floor(Math.random() * pensamientos.length)]
                burbujaTimer = 140
              }
            } else if (Math.hypot(targetX - x, targetY - y) < 6) {
              // Llegó al destino
              if (x > 670 && y > 500) {
                // Llegó a cafetería
                estadoAccion = 'coffee'
                energiaSim = Math.min(100, energiaSim + 15)
                setTimeout(() => {
                  // Regresar al escritorio
                  targetX = deskX
                  targetY = deskY
                  estadoAccion = 'walking'
                  burbujaTexto = 'Café listo, volviendo al puesto.'
                  burbujaTimer = 150
                }, 3000)
              } else if (Math.hypot(deskX - x, deskY - y) < 8) {
                estadoAccion = 'working'
              }
            }
          }

          // Movimiento suave hacia targetX, targetY
          const dx = targetX - x
          const dy = targetY - y
          const dist = Math.hypot(dx, dy)

          if (dist > 2) {
            const speed = 1.8 * mult
            const vx = (dx / dist) * speed
            const vy = (dy / dist) * speed
            x += vx
            y += vy

            if (Math.abs(dx) > Math.abs(dy)) {
              direccion = dx > 0 ? 'right' : 'left'
            } else {
              direccion = dy > 0 ? 'down' : 'up'
            }
          }

          return {
            ...emp,
            x,
            y,
            targetX,
            targetY,
            estadoAccion,
            direccion,
            burbujaTimer,
            burbujaTexto,
            energiaSim
          }
        }))
      }

      // ── RENDERIZADO DEL MAPA EN CANVAS ──
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fondo general (Piso del pasillo central: alfombra corporativa oscura)
      ctx.fillStyle = '#090d16'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Cuadrícula sutil de baldosas
      ctx.strokeStyle = '#1e293b22'
      ctx.lineWidth = 1
      for (let gx = 0; gx < canvas.width; gx += 20) {
        ctx.beginPath()
        ctx.moveTo(gx, 0)
        ctx.lineTo(gx, canvas.height)
        ctx.stroke()
      }
      for (let gy = 0; gy < canvas.height; gy += 20) {
        ctx.beginPath()
        ctx.moveTo(0, gy)
        ctx.lineTo(canvas.width, gy)
        ctx.stroke()
      }

      // Dibujar cada Sala de la Oficina
      ZONAS_MAPA.forEach(zona => {
        // Suelo de la sala
        ctx.fillStyle = zona.colorPiso
        ctx.fillRect(zona.x, zona.y, zona.w, zona.h)

        // Paredes con borde iluminado
        ctx.strokeStyle = zona.bordeColor
        ctx.lineWidth = 2
        ctx.strokeRect(zona.x, zona.y, zona.w, zona.h)

        // Cabecera de la sala
        ctx.fillStyle = zona.bordeColor + '22'
        ctx.fillRect(zona.x, zona.y, zona.w, 24)

        ctx.fillStyle = '#f8fafc'
        ctx.font = 'bold 11px sans-serif'
        ctx.fillText(`${zona.icono} ${zona.nombre}`, zona.x + 8, zona.y + 16)
      })

      // Muebles decorativos: Mesa ovalada de directorio en z_directorio
      ctx.fillStyle = '#312e81'
      ctx.beginPath()
      ctx.ellipse(825, 145, 80, 45, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#6366f1'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#c7d2fe'
      ctx.font = 'bold 9px monospace'
      ctx.fillText('MESA DIRECTORIO', 785, 148)

      // Muebles: Cafetera en z_cafe
      ctx.fillStyle = '#78350f'
      ctx.fillRect(860, 530, 45, 25)
      ctx.fillStyle = '#fef08a'
      ctx.font = '14px sans-serif'
      ctx.fillText('☕', 872, 548)

      // Muebles: Racks de servidores en z_cra
      ctx.fillStyle = '#020617'
      ctx.fillRect(45, 340, 25, 60)
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 1
      ctx.strokeRect(45, 340, 25, 60)
      // Luces del servidor parpadeando
      ctx.fillStyle = tick % 30 < 15 ? '#22c55e' : '#ef4444'
      ctx.fillRect(52, 350, 4, 4)
      ctx.fillStyle = tick % 20 < 10 ? '#38bdf8' : '#eab308'
      ctx.fillRect(60, 350, 4, 4)

      // Dibujar escritorios de cada empleado
      empleados.forEach(emp => {
        // Escritorio de madera/cristal
        ctx.fillStyle = '#334155'
        ctx.fillRect(emp.deskX - 22, emp.deskY - 14, 44, 28)
        ctx.strokeStyle = '#475569'
        ctx.lineWidth = 1
        ctx.strokeRect(emp.deskX - 22, emp.deskY - 14, 44, 28)

        // Monitor de computadora
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(emp.deskX - 10, emp.deskY - 12, 20, 8)
        ctx.fillStyle = emp.estadoAccion === 'working' ? '#38bdf8' : '#64748b'
        ctx.fillRect(emp.deskX - 8, emp.deskY - 11, 16, 6)

        // Silla ergonómica
        ctx.fillStyle = '#1e293b'
        ctx.beginPath()
        ctx.arc(emp.deskX, emp.deskY + 8, 8, 0, Math.PI * 2)
        ctx.fill()
      })

      // Dibujar Personajes (Sims)
      empleados.forEach(emp => {
        const esSeleccionado = emp.id === empleadoSeleccionadoId

        // Sombra suave en el suelo
        ctx.fillStyle = '#00000044'
        ctx.beginPath()
        ctx.ellipse(emp.x, emp.y + 12, 10, 5, 0, 0, Math.PI * 2)
        ctx.fill()

        // Si está seleccionado, círculo indicador en el suelo
        if (esSeleccionado) {
          ctx.strokeStyle = '#22c55e'
          ctx.lineWidth = 2
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.ellipse(emp.x, emp.y + 12, 16, 8, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Cuerpo / Ropa del Personaje
        const bobOffset = emp.estadoAccion === 'walking' ? Math.sin(tick * 0.3) * 2 : 0
        ctx.fillStyle = emp.colorRopa
        ctx.fillRect(emp.x - 7, emp.y - 2 + bobOffset, 14, 12)

        // Cabeza
        ctx.fillStyle = emp.colorPiel
        ctx.beginPath()
        ctx.arc(emp.x, emp.y - 8 + bobOffset, 7, 0, Math.PI * 2)
        ctx.fill()

        // Cabello
        ctx.fillStyle = emp.colorCabello
        ctx.beginPath()
        ctx.arc(emp.x, emp.y - 11 + bobOffset, 7, Math.PI, Math.PI * 2)
        ctx.fill()

        // Plumbob Sims Verde / Cyan flotando sobre la cabeza
        const plumbobY = emp.y - 24 + Math.sin(tick * 0.1) * 3
        ctx.fillStyle = emp.plumbobColor
        ctx.beginPath()
        ctx.moveTo(emp.x, plumbobY - 6)
        ctx.lineTo(emp.x + 4, plumbobY)
        ctx.lineTo(emp.x, plumbobY + 6)
        ctx.lineTo(emp.x - 4, plumbobY)
        ctx.closePath()
        ctx.fill()

        // Nombre encima del Sim
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 9px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(emp.apodo, emp.x, emp.y - 17)

        // Globo de diálogo si tiene mensaje activo
        if (emp.burbujaTexto) {
          ctx.font = 'bold 10px sans-serif'
          const textWidth = ctx.measureText(emp.burbujaTexto).width
          const bubbleW = textWidth + 14
          const bubbleH = 20
          const bubbleX = emp.x - bubbleW / 2
          const bubbleY = emp.y - 48

          // Fondo del globo blanco con sombra
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6)
          ctx.fill()
          ctx.strokeStyle = '#0f172a'
          ctx.lineWidth = 1
          ctx.stroke()

          // Pico del globo hacia la cabeza
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.moveTo(emp.x - 4, bubbleY + bubbleH)
          ctx.lineTo(emp.x, bubbleY + bubbleH + 4)
          ctx.lineTo(emp.x + 4, bubbleY + bubbleH)
          ctx.fill()

          // Texto del diálogo
          ctx.fillStyle = '#0f172a'
          ctx.fillText(emp.burbujaTexto, emp.x, bubbleY + 14)
        }
      })

      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [pestañaActiva, velocidadSim, modoReunionDirectorio, empleadoSeleccionadoId])

  // Clic en el Canvas: Seleccionar Sim o mover a Don Tomás al lugar
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    // Verificar si se hizo clic en algún Sim
    const simClickeado = empleados.find(emp => Math.hypot(emp.x - clickX, emp.y - clickY) < 25)

    if (simClickeado) {
      setEmpleadoSeleccionadoId(simClickeado.id)
      // Generar reacción verbal al clic
      setEmpleados(prev => prev.map(a => {
        if (a.id === simClickeado.id) {
          return {
            ...a,
            burbujaTexto: `¡Hola Don Tomás! Estoy concentrado en mi labor.`,
            burbujaTimer: 180
          }
        }
        return a
      }))
    } else {
      // Mover al Gerente General (Don Tomás) al punto donde se hizo clic
      setEmpleados(prev => prev.map(a => {
        if (a.id === 'gerencia_general') {
          return {
            ...a,
            targetX: clickX,
            targetY: clickY,
            estadoAccion: 'walking',
            burbujaTexto: 'Inspeccionando la oficina...',
            burbujaTimer: 120
          }
        }
        return a
      }))
    }
  }

  // Enviar mensaje directo al empleado seleccionado
  const handleEnviarMensaje = () => {
    if (!mensajeInput.trim() || enviandoChat) return
    const texto = mensajeInput.trim()
    const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

    const nuevoHistorial = [
      ...empleadoActivo.historialChat,
      { autor: 'usuario' as const, mensaje: texto, hora }
    ]

    setEnviandoChat(true)
    setMensajeInput('')

    // Respuesta inteligente basada en su lógica empresarial y reglas de negocio
    setTimeout(() => {
      let respuesta = ''
      const lower = texto.toLowerCase()

      if (lower.includes('regla') || lower.includes('politica') || lower.includes('negocio')) {
        respuesta = `Mis reglas de negocio oficiales son: 1) ${empleadoActivo.entrenamiento.reglasNegocio[0]} y 2) ${empleadoActivo.entrenamiento.reglasNegocio[1] || 'Supervisión continua'}.`
      } else if (lower.includes('precio') || lower.includes('cotiz') || lower.includes('costo')) {
        respuesta = `Siguiendo la política de precios de Gama: PIR Cableado DSC $22.900 + IVA, Magnético $10.900 + IVA y Monitoreo base desde 0,9 UF/mes. Sin contratos forzosos.`
      } else if (lower.includes('reunion') || lower.includes('junta') || lower.includes('directorio')) {
        respuesta = `Comprendido. Me dirijo a la Sala de Directorio para participar del consenso corporativo con el equipo.`
        setModoReunionDirectorio(true)
      } else if (lower.includes('reporte') || lower.includes('estado')) {
        respuesta = `Misión en curso: ${empleadoActivo.misionPrincipal} Indicador ${empleadoActivo.kpis[0].label} en nivel ${empleadoActivo.kpis[0].valor}.`
      } else {
        respuesta = `Recibido Don Tomás. Procesando según mi entrenamiento: "${empleadoActivo.entrenamiento.systemPrompt.slice(0, 110)}...". Aplicando reglas de ${empleadoActivo.areaNombre}.`
      }

      const historialConRespuesta = [
        ...nuevoHistorial,
        { autor: 'agente' as const, mensaje: respuesta, hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }
      ]

      setEmpleados(prev => prev.map(a => {
        if (a.id === empleadoActivo.id) {
          return {
            ...a,
            historialChat: historialConRespuesta,
            burbujaTexto: respuesta.slice(0, 36) + '...',
            burbujaTimer: 180
          }
        }
        return a
      }))

      setEnviandoChat(false)
    }, 600)
  }

  // Guardar el entrenamiento editado de un empleado
  const handleGuardarEntrenamiento = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const systemPrompt = (form.elements.namedItem('systemPrompt') as HTMLTextAreaElement).value
    const reglasNegocio = (form.elements.namedItem('reglasNegocio') as HTMLTextAreaElement).value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    const conocimientos = (form.elements.namedItem('conocimientos') as HTMLTextAreaElement).value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    const autonomia = (form.elements.namedItem('autonomia') as HTMLSelectElement).value as any

    setEmpleados(prev => prev.map(a => {
      if (a.id === empleadoActivo.id) {
        return {
          ...a,
          entrenamiento: {
            ...a.entrenamiento,
            systemPrompt,
            reglasNegocio,
            conocimientosClave: conocimientos,
            autonomia
          }
        }
      }
      return a
    }))

    alert(`Entrenamiento y Lógica Empresarial de "${empleadoActivo.nombre}" guardados exitosamente.`)
  }

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 rounded-3xl p-5 sm:p-7 flex flex-col gap-5 border border-slate-800 shadow-2xl overflow-hidden min-h-0">
      
      {/* ── BARRA SUPERIOR DE CONTROL DEL SIMULADOR ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span>SIMULADOR DE OFICINA VIRTUAL 24/7 EN VIVO</span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-400">10 AGENTES AUTÓNOMOS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Gamepad2 className="h-6 w-6 text-[#2997ff]" />
            <span>Sede Central Gama Security (Sims Game & Logic)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Oficina interactiva con agentes trabajando en conjunto. Haz clic en el piso para mover a Don Tomás o toca a cualquier empleado para entrenarlo.
          </p>
        </div>

        {/* Selector de Pestaña Principal */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setPestañaActiva('juego_oficina')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                pestañaActiva === 'juego_oficina' ? 'bg-[#1E40AF] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span>🎮 Oficina en Vivo</span>
            </button>
            <button
              onClick={() => setPestañaActiva('entrenamiento')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                pestañaActiva === 'entrenamiento' ? 'bg-[#1E40AF] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BrainCircuit className="h-4 w-4 text-amber-400" />
              <span>🧠 Entrenamiento & Lógica</span>
            </button>
            <button
              onClick={() => setPestañaActiva('organigrama')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                pestañaActiva === 'organigrama' ? 'bg-[#1E40AF] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>🏛️ Organigrama</span>
            </button>
          </div>

          {/* Botón de Reunión General / Consenso en la Sala de Juntas */}
          <button
            onClick={() => setModoReunionDirectorio(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              modoReunionDirectorio
                ? 'bg-amber-600 text-white border-amber-500 shadow-md animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>{modoReunionDirectorio ? 'Terminar Reunión' : 'Llamar a Reunión General'}</span>
          </button>
        </div>
      </div>

      {/* ── CONTENIDO: MODO JUEGO OFICINA CANVAS 2D ── */}
      {pestañaActiva === 'juego_oficina' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 flex-1 overflow-hidden">
          
          {/* LIENZO DEL JUEGO (CANVAS 2D) (8 COLS) */}
          <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-2 flex flex-col justify-between overflow-hidden shadow-2xl relative">
            
            {/* Controles flotantes sobre el juego */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-[10px] font-mono text-slate-400">Velocidad:</span>
              <button onClick={() => setVelocidadSim('1x')} className={`px-2 py-0.5 rounded font-bold ${velocidadSim === '1x' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>1x</button>
              <button onClick={() => setVelocidadSim('2x')} className={`px-2 py-0.5 rounded font-bold ${velocidadSim === '2x' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>2x</button>
              <button onClick={() => setVelocidadSim('pausa')} className={`px-2 py-0.5 rounded font-bold ${velocidadSim === 'pausa' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>⏸</button>
            </div>

            <div className="absolute top-4 right-4 z-10 text-[11px] font-mono text-emerald-400 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Clic: Mover a Don Tomás / Tocar Sim</span>
            </div>

            <canvas
              ref={canvasRef}
              width={1000}
              height={640}
              onClick={handleCanvasClick}
              className="w-full h-auto rounded-xl cursor-crosshair border border-slate-800/60 shadow-inner bg-[#090d16]"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Guía rápida de salas abajo */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 text-[10px] font-mono text-slate-400 no-scrollbar">
              <span className="font-bold text-slate-300 shrink-0">Salas:</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">👔 Gerencia</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">⚖️ Legal OS10</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">🏛️ Directorio</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">🚨 Central CRA</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">💼 Ventas</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">🧠 Laboratorio IA</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">☕ Cafetería</span>
            </div>
          </div>

          {/* PANEL LATERAL: FICHA EN VIVO & INTERACCIÓN DEL SIM TOCADO (4 COLS) */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl overflow-y-auto">
            
            <div className="space-y-4">
              {/* Tarjeta de Identidad Sims */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 relative">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {empleadoActivo.avatarEmoji}
                  </div>
                  <div className="space-y-0.5 min-w-0 pr-6">
                    <h3 className="font-black text-white text-sm leading-tight truncate">{empleadoActivo.nombre}</h3>
                    <p className="text-xs font-bold text-[#2997ff] truncate">{empleadoActivo.rol}</p>
                    <span className="inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded mt-0.5">
                      {empleadoActivo.areaNombre}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                    <span>MISIÓN ACTUAL:</span>
                    <span className="text-emerald-400 font-bold">{empleadoActivo.energiaSim}% Energía</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                    {empleadoActivo.misionPrincipal}
                  </p>
                </div>

                {/* Botón directo a editar entrenamiento */}
                <button
                  onClick={() => setPestañaActiva('entrenamiento')}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <BrainCircuit className="h-4 w-4" />
                  <span>Editar Entrenamiento & Lógica</span>
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

              {/* Reglas de Negocio en Ejecución */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Lógica Empresarial Asignada:</span>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5 text-xs text-slate-300">
                  {empleadoActivo.entrenamiento.reglasNegocio.map((rg, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{rg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Directo en su Escritorio */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-1">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-[#2997ff]" />
                  <span>Hablar con {empleadoActivo.apodo}</span>
                </span>
                <span className="text-emerald-400 font-mono font-bold">En su puesto</span>
              </div>

              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {empleadoActivo.historialChat.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-xl leading-relaxed text-[11px] ${
                      msg.autor === 'usuario'
                        ? 'bg-blue-900/40 text-blue-100 ml-3 border border-blue-800/40'
                        : 'bg-slate-900 text-slate-200 mr-3 border border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] text-slate-400 mb-0.5 font-mono">
                      <span>{msg.autor === 'usuario' ? 'Don Tomás' : empleadoActivo.apodo}</span>
                      <span>{msg.hora}</span>
                    </div>
                    <p>{msg.mensaje}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={mensajeInput}
                  onChange={e => setMensajeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEnviarMensaje()}
                  placeholder={`Preguntar o dar orden a ${empleadoActivo.apodo}...`}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2997ff]"
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

          {/* Formulario de Entrenamiento Editable (8 COLS) */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{empleadoActivo.avatarEmoji}</span>
                <div>
                  <h3 className="font-black text-base text-white">Calibración de Lógica: {empleadoActivo.rol}</h3>
                  <p className="text-xs text-[#2997ff] font-bold">Titular: {empleadoActivo.nombre} ({empleadoActivo.areaNombre})</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                ENJAMBRE IA ACTIVO
              </span>
            </div>

            <form onSubmit={handleGuardarEntrenamiento} className="space-y-4 text-xs">
              <div>
                <label className="font-black text-slate-300 block mb-1 uppercase tracking-wider text-[11px]">
                  1. System Prompt / Instrucciones Maestras de Razonamiento:
                </label>
                <textarea
                  name="systemPrompt"
                  rows={4}
                  defaultValue={empleadoActivo.entrenamiento.systemPrompt}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-[#2997ff] focus:outline-none font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-black text-slate-300 block mb-1 uppercase tracking-wider text-[11px]">
                    2. Reglas de Negocio Estrictas (Una por línea):
                  </label>
                  <textarea
                    name="reglasNegocio"
                    rows={4}
                    defaultValue={empleadoActivo.entrenamiento.reglasNegocio.join('\n')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-[#2997ff] focus:outline-none font-mono leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-black text-slate-300 block mb-1 uppercase tracking-wider text-[11px]">
                    3. Conocimientos Clave & Fuentes de Datos (Una por línea):
                  </label>
                  <textarea
                    name="conocimientos"
                    rows={4}
                    defaultValue={empleadoActivo.entrenamiento.conocimientosClave.join('\n')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-[#2997ff] focus:outline-none font-mono leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="font-black text-slate-300 block mb-1 uppercase tracking-wider text-[11px]">
                    Nivel de Autonomía en Decisiones:
                  </label>
                  <select
                    name="autonomia"
                    defaultValue={empleadoActivo.entrenamiento.autonomia}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white focus:border-[#2997ff] focus:outline-none"
                  >
                    <option value="Supervisión Estricta">Supervisión Estricta (Consulta todo a Gerencia)</option>
                    <option value="Autonomía Moderada">Autonomía Moderada (Ejecuta y reporta novedades)</option>
                    <option value="Autonomía Total 24/7">Autonomía Total 24/7 (Resuelve y toma decisiones)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1E40AF] hover:bg-[#2563EB] text-white rounded-xl font-bold cursor-pointer transition shadow-md flex items-center justify-center gap-2 text-xs"
                  >
                    <Save className="h-4 w-4" />
                    <span>Guardar Lógica Empresarial de {empleadoActivo.apodo}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* ── CONTENIDO: ÁRBOL DE ORGANIGRAMA CLÁSICO ── */}
      {pestañaActiva === 'organigrama' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 overflow-y-auto">
          {/* NODO GERENCIAL */}
          <div className="flex justify-center">
            <div
              onClick={() => {
                setEmpleadoSeleccionadoId('gerencia_general')
                setPestañaActiva('juego_oficina')
              }}
              className="p-4 rounded-2xl bg-blue-900/40 border-2 border-blue-400 text-center cursor-pointer shadow-lg max-w-sm"
            >
              <div className="text-3xl mb-1">👔</div>
              <h4 className="font-black text-white text-sm">Don Tomás Toro-Moreno</h4>
              <p className="text-xs text-amber-400 font-bold uppercase">Gerencia General / Directorio</p>
            </div>
          </div>

          <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

          {/* ASESORÍA LEGAL */}
          <div className="flex justify-center">
            <div
              onClick={() => {
                setEmpleadoSeleccionadoId('legal_os10')
                setPestañaActiva('juego_oficina')
              }}
              className="p-3.5 rounded-xl bg-amber-900/40 border border-amber-400 text-center cursor-pointer shadow max-w-xs"
            >
              <div className="text-2xl mb-1">⚖️</div>
              <h4 className="font-bold text-white text-xs">Lic. Claudio Valenzuela</h4>
              <p className="text-[10px] text-amber-300 font-bold uppercase">Asesoría Legal & Cumplimiento OS10</p>
            </div>
          </div>

          <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

          {/* 3 DIVISIONES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/40 space-y-2">
              <span className="font-black text-xs text-blue-400 uppercase block text-center border-b border-slate-800 pb-2">
                🚨 Operaciones & Alarmas
              </span>
              {empleados.filter(e => e.area === 'operaciones').map(e => (
                <div
                  key={e.id}
                  onClick={() => { setEmpleadoSeleccionadoId(e.id); setPestañaActiva('juego_oficina') }}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-400 cursor-pointer flex items-center gap-2"
                >
                  <span className="text-lg">{e.avatarEmoji}</span>
                  <div>
                    <p className="font-bold text-xs text-white">{e.nombre}</p>
                    <p className="text-[10px] text-slate-400">{e.rol}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 space-y-2">
              <span className="font-black text-xs text-emerald-400 uppercase block text-center border-b border-slate-800 pb-2">
                💼 Comercial & Ventas
              </span>
              {empleados.filter(e => e.area === 'comercial').map(e => (
                <div
                  key={e.id}
                  onClick={() => { setEmpleadoSeleccionadoId(e.id); setPestañaActiva('juego_oficina') }}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-400 cursor-pointer flex items-center gap-2"
                >
                  <span className="text-lg">{e.avatarEmoji}</span>
                  <div>
                    <p className="font-bold text-xs text-white">{e.nombre}</p>
                    <p className="text-[10px] text-slate-400">{e.rol}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/40 space-y-2">
              <span className="font-black text-xs text-purple-400 uppercase block text-center border-b border-slate-800 pb-2">
                🧠 IA & Innovación
              </span>
              {empleados.filter(e => e.area === 'ia').map(e => (
                <div
                  key={e.id}
                  onClick={() => { setEmpleadoSeleccionadoId(e.id); setPestañaActiva('juego_oficina') }}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-400 cursor-pointer flex items-center gap-2"
                >
                  <span className="text-lg">{e.avatarEmoji}</span>
                  <div>
                    <p className="font-bold text-xs text-white">{e.nombre}</p>
                    <p className="text-[10px] text-slate-400">{e.rol}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
