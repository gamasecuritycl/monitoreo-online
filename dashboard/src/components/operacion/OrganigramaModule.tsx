'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Building,
  Shield,
  ShieldCheck,
  Radio,
  Wrench,
  TrendingUp,
  FileText,
  HeartHandshake,
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
  ChevronDown,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Maximize2,
  Minimize2,
  Play,
  Settings,
  Coffee,
  Zap,
  Terminal,
  Compass
} from 'lucide-react'

// ── TIPOS Y ESTRUCTURA DEL ORGANIGRAMA VIRTUAL SIMS ──

export type CategoriaArea = 'gerencia' | 'legal' | 'operaciones' | 'comercial' | 'ia'

export interface AgenteSim {
  id: string
  nombre: string
  rol: string
  area: CategoriaArea
  areaNombre: string
  reportaA: string
  avatarEmoji: string
  avatarColor: string
  plumbobColor: string // Verde sims '#22c55e', dorado '#eab308', cyan '#06b6d4'
  estadoSim: 'Trabajando concentrado' | 'Analizando datos' | 'Atendiendo llamada' | 'Compilando' | 'En reunión' | 'Monitoreando 24/7'
  tareaActual: string
  tiempoEnPuesto: string
  energiaSim: number // 1 a 100
  obligaciones: string[]
  kpis: { label: string; valor: string; status: 'ok' | 'excelente' | 'alerta' }[]
  herramientas: string[]
  ultimoReporte: {
    fecha: string
    resumen: string
    hallazgos: string[]
    recomendacion: string
  }
  promptPersonalidad: string
  historialChat: { autor: 'agente' | 'usuario'; mensaje: string; hora: string }[]
}

// ── EQUIPO DE TRABAJO INICIAL (ORGANIGRAMA OFICIAL GAMA SEGURIDAD) ──

const AGENTES_INICIALES: AgenteSim[] = [
  // 1. Gerencia General
  {
    id: 'gerencia_general',
    nombre: 'Don Tomás Toro-Moreno',
    rol: 'Gerente General & Directorio Ejecutivo',
    area: 'gerencia',
    areaNombre: 'Gerencia General / Directorio',
    reportaA: 'Directorio de Accionistas',
    avatarEmoji: '👔',
    avatarColor: 'from-blue-900 to-indigo-950',
    plumbobColor: '#22c55e',
    estadoSim: 'En reunión',
    tareaActual: 'Consolidando balances del conglomerado de 4 razones sociales y liderando expansión 2026-2027.',
    tiempoEnPuesto: '24/7 Activo',
    energiaSim: 98,
    obligaciones: [
      'Supervisión estratégica de las 4 gerencias (Legal, Operaciones, Comercial e Innovación IA).',
      'Aprobación de inversiones en infraestructura, flota técnica y modelos cognitivos.',
      'Representación legal ante clientes corporativos de alta envergadura y entidades del Estado.',
      'Control de solvencia financiera, cobranza mensual de abonados y cumplimiento de metas.'
    ],
    kpis: [
      { label: 'Abonados Activos Conglomerado', valor: '1.250+', status: 'excelente' },
      { label: 'SLA Operativo Global', valor: '99.98%', status: 'excelente' },
      { label: 'Margen Neto Consolidado', valor: '42.4%', status: 'ok' },
      { label: 'Eficiencia Multi-Agentes', valor: '9.4/10', status: 'excelente' }
    ],
    herramientas: ['Dashboard Ejecutivo', 'Dolibarr ERP', 'Consenso IA', 'Supabase Monitoreo'],
    ultimoReporte: {
      fecha: 'Hoy, 14:15',
      resumen: 'Se consolida estabilidad total en la Central CRA con 0 caídas de enlace. El área comercial presenta alta actividad de licitaciones en Mercado Público y el Laboratorio de IA completó el despliegue del bot de ventas multicanal.',
      hallazgos: [
        'Excelente cumplimiento en cobranza de facturas del periodo Julio/Agosto.',
        'Se detecta necesidad de 2 camionetas adicionales para soporte técnico en la V Región.',
        'La Ley 21.719 se encuentra cubierta documentalmente con los nuevos formularios APDP.'
      ],
      recomendacion: 'Proceder con la adjudicación de nuevos kits de intrusión DSC y fortalecer la prospección automatizada en Mercado Público.'
    },
    promptPersonalidad: 'Eres el Gerente General y Director Ejecutivo de Gama Seguridad. Hablas con tono sobrio, visionario, analítico y ejecutivo, siempre enfocado en rentabilidad, calidad de servicio 24/7 y liderazgo en seguridad electrónica en Chile.',
    historialChat: [
      { autor: 'agente', mensaje: 'Buen día Tomás. Estoy supervisando el rendimiento de todas las gerencias. ¿En qué foco estratégico nos concentramos hoy?', hora: '08:30' }
    ]
  },

  // 2. Asesoría Legal y Cumplimiento Normativo (OS10)
  {
    id: 'legal_os10',
    nombre: 'Lic. Claudio Valenzuela',
    rol: 'Asesor Legal Senior & Compliance Officer (OS10 / Ley 21.719)',
    area: 'legal',
    areaNombre: 'Asesoría Legal y Cumplimiento Normativo',
    reportaA: 'Gerencia General',
    avatarEmoji: '⚖️',
    avatarColor: 'from-amber-800 to-slate-900',
    plumbobColor: '#22c55e',
    estadoSim: 'Analizando datos',
    tareaActual: 'Auditando vigencia de certificados OS10 de operadores CRA y cláusulas de comodato según Ley 21.659.',
    tiempoEnPuesto: '24/7 Activo',
    energiaSim: 92,
    obligaciones: [
      'Fiscalización y actualización continua de acreditaciones OS10 de Carabineros de Chile para el personal.',
      'Supervisión de cumplimiento de la nueva Ley de Seguridad Privada (Ley N° 21.659).',
      'Cumplimiento irrestricto de la Ley 21.719 sobre Protección de Datos Personales en grabaciones de CCTV.',
      'Revisión y validación legal de contratos comerciales, cláusulas de salida y convenios con terceros.'
    ],
    kpis: [
      { label: 'Operadores con OS10 al Día', valor: '100%', status: 'excelente' },
      { label: 'Multas o Sanciones Regulatorias', valor: '0', status: 'excelente' },
      { label: 'Contratos Auditados', valor: '342', status: 'ok' },
      { label: 'Blindaje Legal APDP', valor: 'Auditado', status: 'excelente' }
    ],
    herramientas: ['Portal Carabineros OS10', 'Bases Legales Ley 21.719', 'Editor de Contratos', 'Pad de Firma Digital'],
    ultimoReporte: {
      fecha: 'Hoy, 13:40',
      resumen: 'Se revisó la totalidad del personal activo de la Central de Monitoreo. Todos cuentan con credenciales OS10 vigentes. Se preparó la adenda de consentimiento expreso para abonados con verificación por video IA.',
      hallazgos: [
        'Vigencia de credenciales OS10 asegurada hasta segundo semestre de 2027.',
        'Cláusula de propiedad de equipos DSC incorporada en todos los presupuestos emitidos.',
        'Sin observaciones pendientes en fiscalizaciones policiales de Valparaíso ni Santiago.'
      ],
      recomendacion: 'Mantener firma digital centralizada con IP y geolocalización para todos los nuevos contratos firmados en tablet.'
    },
    promptPersonalidad: 'Eres el Asesor Legal de Gama Seguridad. Tu lenguaje es jurídico, preciso, riguroso y formal. Tu especialidad es la normativa OS10 de Carabineros, la Ley de Seguridad Privada 21.659 y la Ley 21.719 de Protección de Datos Personales.',
    historialChat: [
      { autor: 'agente', mensaje: 'Estimado Director. Toda la documentación legal y credenciales OS10 están al día y protegidas. ¿Desea revisar algún contrato o dictamen?', hora: '09:15' }
    ]
  },

  // 3. Central Receptora de Alarmas (CRA / Operadores 24/7)
  {
    id: 'cra_operador_247',
    nombre: 'Sofía Carvajal',
    rol: 'Jefa de Operaciones CRA & Triaje de Emergencias 24/7',
    area: 'operaciones',
    areaNombre: 'Área Operativa & Monitoreo de Alarmas',
    reportaA: 'Gerencia General',
    avatarEmoji: '🎧',
    avatarColor: 'from-blue-600 to-slate-900',
    plumbobColor: '#22c55e',
    estadoSim: 'Monitoreando 24/7',
    tareaActual: 'Procesando eventos del receptor Scorpion MDB; 0 señales de pánico pendientes; enlace Dahua 100% arriba.',
    tiempoEnPuesto: '24/7 Activo',
    energiaSim: 100,
    obligaciones: [
      'Monitoreo ininterrumpido 24 horas de señales de robo, asalto, pánico, incendio y sabotaje de paneles DSC/Vetti.',
      'Ejecución del protocolo de verificación inmediata (telefónico + verificación por cámaras en vivo).',
      'Despacho y coordinación con Carabineros de Chile (Plan Cuadrante), Bomberos y móviles de apoyo.',
      'Control de aperturas y cierres fuera de horario en locales comerciales y empresas abonadas.'
    ],
    kpis: [
      { label: 'Tiempo Promedio de Respuesta', valor: '12 seg', status: 'excelente' },
      { label: 'Eventos Filtrados por IA', valor: '98.4%', status: 'excelente' },
      { label: 'Falsas Alarmas Evitadas', valor: '99.2%', status: 'excelente' },
      { label: 'Uptime Central Scorpion', valor: '99.99%', status: 'excelente' }
    ],
    herramientas: ['Receptor MDB Scorpion', 'SmartPSS / Dahua DSS', 'Telemetría 4G Universal', 'WhatsApp Notificador Central'],
    ultimoReporte: {
      fecha: 'Hoy, 14:02',
      resumen: 'Se procesaron 4.280 eventos de supervisión técnica en el último turno. Se verificó corte de energía en cuenta #0412 en Concón, activándose respaldo por batería correctamente y notificando al contacto autorizado.',
      hallazgos: [
        'Filtro de exclusión técnica de PERSONAS_AUTORIZADAS operando a la perfección en la bitácora.',
        'La verificación por video redujo los llamados innecesarios a Carabineros en un 94%.',
        'Todos los enlaces 4G reportan señal sobre -75 dBm.'
      ],
      recomendacion: 'Programar visita preventiva para recambio de batería en panel de cuenta #0188 por antigüedad de 3 años.'
    },
    promptPersonalidad: 'Eres la Jefa de Operaciones de la Central Receptora de Alarmas (CRA) de Gama Seguridad. Tu comunicación es rápida, certera, militarmente precisa y orientada a la protección de vidas y bienes.',
    historialChat: [
      { autor: 'agente', mensaje: 'Central de Operaciones operativa y en línea. Todos los cuadrantes de monitoreo reportan normalidad.', hora: '07:00' }
    ]
  },

  // 4. Técnicos de Terreno e Instalaciones
  {
    id: 'tecnicos_terreno',
    nombre: 'Ignacio Riquelme',
    rol: 'Coordinador Técnico de Terreno & Flota de Instalaciones',
    area: 'operaciones',
    areaNombre: 'Área Operativa & Monitoreo de Alarmas',
    reportaA: 'Gerencia General',
    avatarEmoji: '🛠️',
    avatarColor: 'from-amber-600 to-slate-900',
    plumbobColor: '#22c55e',
    estadoSim: 'Trabajando concentrado',
    tareaActual: 'Asignando 4 OTs del día mediante App Móvil PWA en Viña del Mar, Quilpué y Las Condes.',
    tiempoEnPuesto: '24/7 Activo',
    energiaSim: 88,
    obligaciones: [
      'Montaje, cableado y programación de paneles DSC PowerSeries Neo, teclados LED y sensores antimask.',
      'Instalación de cámaras IP 4MP DarkFighter, NVRs y configuración de cercos eléctricos perimetrales 6 hilos.',
      'Atención de servicios técnicos de emergencia (SLA 2h para fallas críticas de sabotaje o corte).',
      'Levantamiento técnico en terreno y emisión de hojas de presupuesto y conformidad digital.'
    ],
    kpis: [
      { label: 'OTs Ejecutadas en SLA', valor: '97.8%', status: 'excelente' },
      { label: 'Tiempo Medio Instalación Kit', valor: '3.2 hrs', status: 'ok' },
      { label: 'Stock Repuestos Críticos', valor: 'Disponible', status: 'excelente' },
      { label: 'Calificación de Clientes', valor: '4.9/5', status: 'excelente' }
    ],
    herramientas: ['App PWA Portal Técnico', 'DLS 5 Programador DSC', 'Analizador de Red IP', 'Tester Baterías 12V'],
    ultimoReporte: {
      fecha: 'Hoy, 12:45',
      resumen: 'Se concluyó exitosamente la instalación de cerco eléctrico y 8 cámaras IP en faena de El Salto, Viña del Mar. Se realizó prueba de tamper con la Central CRA en menos de 10 segundos.',
      hallazgos: [
        'Stock de sensores PIR cableados DSC ($22.900) y magnéticos ($10.900) con existencias suficientes en bodega.',
        'La App Móvil PWA está siendo adoptada por el 100% de los técnicos para firmar OTs en terreno.',
        'Los comunicadores 4G universales redujeron a cero los problemas de clientes sin fibra óptica.'
      ],
      recomendacion: 'Adquirir un stock de 20 baterías de respaldo de 12V 7Ah antes de fin de mes para el plan preventivo.'
    },
    promptPersonalidad: 'Eres el Coordinador Técnico de Terreno de Gama Seguridad. Tu lenguaje es práctico, técnico, orientado a marcas líderes (DSC, Dahua, Paradox, Hikvision) y enfocado en la prolijidad de las instalaciones.',
    historialChat: [
      { autor: 'agente', mensaje: 'Don Tomás, móviles 1 y 2 en ruta sin novedades. Todas las herramientas y repuestos calibrados.', hora: '08:15' }
    ]
  },

  // 5. Ventas Corporativas y Licitaciones (Mercado Público)
  {
    id: 'ventas_licitaciones',
    nombre: 'Valentina Lagos',
    rol: 'Gerente Comercial B2B & Especialista Licitaciones ChileCompra',
    area: 'comercial',
    areaNombre: 'Área Comercial & Ventas',
    reportaA: 'Gerencia General',
    avatarEmoji: '💼',
    avatarColor: 'from-emerald-700 to-slate-900',
    plumbobColor: '#22c55e',
    estadoSim: 'Analizando datos',
    tareaActual: 'Formulando propuesta técnica para licitación de seguridad en Municipalidad de Quilpué en Mercado Público.',
    tiempoEnPuesto: '24/7 Activo',
    energiaSim: 94,
    obligaciones: [
      'Radar continuo de oportunidades en Mercado Público (ChileCompra) bajo rubros de CCTV, alarmas y guardias.',
      'Elaboración de presupuestos comerciales formales con desglose neto, 19% IVA y catálogo oficial.',
      'Cierre de contratos corporativos con condominios, colegios, bodegas y empresas del sector productivo.',
      'Supervisión del embudo de ventas y pipeline comercial EspoCRM.'
    ],
    kpis: [
      { label: 'Licitaciones en Radar Activo', valor: '$240M CLP', status: 'excelente' },
      { label: 'Tasa de Conversión B2B', valor: '38.5%', status: 'excelente' },
      { label: 'Propuestas Emitidas Mes', valor: '48 Cotiz.', status: 'ok' },
      { label: 'Ticket Promedio Comercial', valor: '$1.450.000', status: 'ok' }
    ],
    herramientas: ['Radar Mercado Público API', 'Generador PDF Cotizaciones 19% IVA', 'Pipeline CRM Espo', 'WhatsApp Negocios'],
    ultimoReporte: {
      fecha: 'Hoy, 13:10',
      resumen: 'Se detectaron 3 nuevas licitaciones públicas de alta viabilidad para Gama Seguridad en la Región de Valparaíso y Metropolitana. Se despacharon 6 presupuestos corporativos con botón de aceptación digital.',
      hallazgos: [
        'Gran interés de condominios en la migración de sistemas antiguos ADT/Verisure hacia monitoreo propio sin comodato.',
        'La tabla de presupuestos con orden por fecha reciente y filtros a 1 clic agilizó los cierres comerciales.',
        'Se preparó oferta para servicio de televigilancia municipal por 36 meses.'
      ],
      recomendacion: 'Potenciar la campaña de emails corporativos a gerentes de operaciones en bodegas logísticas de Concón y Quilicura.'
    },
    promptPersonalidad: 'Eres la Jefa Comercial B2B y Licitaciones de Gama Seguridad. Tu tono es persuasivo, corporativo, estratégico, con profundo dominio de Mercado Público, licitaciones estatales y venta consultiva de alta gama.',
    historialChat: [
      { autor: 'agente', mensaje: 'Hola Tomás. Las propuestas de esta semana tienen alta probabilidad de adjudicación. ¿Revisamos el radar de Mercado Público?', hora: '09:00' }
    ]
  },

  // 6. Atención al Cliente y Éxito de Cuenta
  {
    id: 'customer_success',
    nombre: 'Matías Morales',
    rol: 'Líder de Éxito del Cliente & Retención de Abonados (Customer Success)',
    area: 'comercial',
    areaNombre: 'Área Comercial & Ventas',
    reportaA: 'Gerencia General',
    avatarEmoji: '🤝',
    avatarColor: 'from-teal-600 to-slate-900',
    plumbobColor: '#22c55e',
    estadoSim: 'Atendiendo llamada',
    tareaActual: 'Realizando bienvenida y entrega de credenciales app celular a 6 nuevos abonados residenciales.',
    tiempoEnPuesto: '24/7 Activo',
    energiaSim: 91,
    obligaciones: [
      'Onboarding completo de abonados: entrega de clave maestra, inducción en App Celular y protocolos de pánico.',
      'Gestión proactiva de cobranza y abonos para asegurar cero atrasos en facturación mensual.',
      'Prevención de fugas (churn) y atención inmediata ante cualquier consulta técnica o administrativa.',
      'Encuestas de satisfacción periódicas (NPS) y fidelización a 36 meses.'
    ],
    kpis: [
      { label: 'Retención de Abonados', valor: '99.4%', status: 'excelente' },
      { label: 'Índice de Satisfacción (NPS)', valor: '92 / 100', status: 'excelente' },
      { label: 'Tiempo de Onboarding', valor: '< 24 hrs', status: 'excelente' },
      { label: 'Cartera al Día', valor: '96.2%', status: 'ok' }
    ],
    herramientas: ['Ficha 360° Abonado', 'Gestor de Abonos & Cobranza', 'Plantillas WhatsApp Oficiales', 'Portal Clientes'],
    ultimoReporte: {
      fecha: 'Hoy, 11:20',
      resumen: 'Se contactó al 100% de los abonados instalados durante la semana anterior. Reportan 5 estrellas de satisfacción con la claridad de la aplicación móvil y la rapidez del soporte técnico.',
      hallazgos: [
        'Excelente recepción del plan de 0,9 UF/mes sin contratos amarrados ni multas de salida.',
        'La cobranza del mes de Julio se encuentra recaudada en un 94%.',
        'Cero solicitudes de desvinculación recibidas durante los últimos 45 días.'
      ],
      recomendacion: 'Enviar cápsula de video de 45 segundos enseñando cómo armar el sistema en modo noche desde el celular.'
    },
    promptPersonalidad: 'Eres el Líder de Customer Success de Gama Seguridad. Tu trato es cálido, empático, altamente servicial, enfocado en que cada cliente se sienta protegido, escuchado y orgulloso de contratar a Gama.',
    historialChat: [
      { autor: 'agente', mensaje: 'Don Tomás, todos nuestros clientes están atendidos y con sus sistemas operativos. Seguimos con el programa de fidelización.', hora: '10:00' }
    ]
  },

  // 7. Liderazgo / Arquitectura de Soluciones IA
  {
    id: 'ia_arquitectura',
    nombre: 'Dr. Maximiliano Silva',
    rol: 'Chief AI Officer & Arquitecto de Soluciones de Inteligencia Artificial',
    area: 'ia',
    areaNombre: 'Oficina de IA e Innovación',
    reportaA: 'Gerencia General',
    avatarEmoji: '🧠',
    avatarColor: 'from-purple-800 to-indigo-950',
    plumbobColor: '#06b6d4',
    estadoSim: 'Compilando',
    tareaActual: 'Orquestando el enjambre de 9 agentes cognitivos y balanceando consumo de tokens vs latencia.',
    tiempoEnPuesto: '24/7 Activo',
    energiaSim: 96,
    obligaciones: [
      'Diseño y supervisión de la arquitectura multi-agente que opera la empresa las 24 horas del día.',
      'Definición de modelos fundacionales (Gemini 2.5 Flash, Claude 3.5 Sonnet, Llama 3.3 y Ollama local).',
      'Protocolos de consenso cognitivo entre agentes para evitar alucinaciones y sesgos operativos.',
      'Estrategia de innovación y ventaja competitiva tecnológica para Gama Seguridad en el mercado chileno.'
    ],
    kpis: [
      { label: 'Enjambre Multi-Agentes', valor: '9 Agentes', status: 'excelente' },
      { label: 'Latencia Promedio IA', valor: '380 ms', status: 'excelente' },
      { label: 'Tasa de Acierto Cognitivo', valor: '99.7%', status: 'excelente' },
      { label: 'Autonomía de Operación', valor: '24/7/365', status: 'excelente' }
    ],
    herramientas: ['Gemini 2.5 API', 'Multi-Agent Consensus Engine', 'LangChain / LlamaIndex', 'Vector Store Supabase'],
    ultimoReporte: {
      fecha: 'Hoy, 14:18',
      resumen: 'El enjambre de agentes de la empresa se encuentra 100% coordinado. Se redujo el costo de inferencia en un 35% utilizando el modelo optimizado Gemini Flash para triaje y reservando razonamiento para casos complejos.',
      hallazgos: [
        'Los agentes de la oficina virtual mantienen un tiempo de respuesta de sub-segundo.',
        'La integración entre CRM, inventario y cotizador opera con consistencia de datos ACID.',
        'El sistema de memoria distribuida previene cualquier redundancia entre departamentos.'
      ],
      recomendacion: 'Incorporar nodos de inferencia local con Ollama en el servidor de la Central para operar incluso ante eventuales cortes de enlace submarino de internet.'
    },
    promptPersonalidad: 'Eres el Chief AI Officer de Gama Seguridad. Tu lenguaje es vanguardista, técnico, visionario, enfocado en state-of-the-art en IA, multi-agent frameworks, eficiencia computacional y transformación empresarial total.',
    historialChat: [
      { autor: 'agente', mensaje: 'Saludos Tomás. La arquitectura cognitiva está estable. Todos los agentes están reportando en tiempo real con latencias óptimas.', hora: '08:45' }
    ]
  },

  // 8. Automatización de Procesos (n8n, APIs, Integraciones CRM/ERP)
  {
    id: 'ia_n8n_integraciones',
    nombre: 'Camila Vega',
    rol: 'Lead Automation Engineer (n8n, APIs & Integraciones CRM/ERP)',
    area: 'ia',
    areaNombre: 'Oficina de IA e Innovación',
    reportaA: 'Liderazgo / Arquitectura IA',
    avatarEmoji: '⚡',
    avatarColor: 'from-fuchsia-700 to-slate-900',
    plumbobColor: '#22c55e',
    estadoSim: 'Trabajando concentrado',
    tareaActual: 'Monitoreando colas de Webhooks de Meta (Instagram/WhatsApp) y sincronizaciones Supabase en tiempo real.',
    tiempoEnPuesto: '24/7 Activo',
    energiaSim: 93,
    obligaciones: [
      'Diseño, despliegue y mantenimiento de pipelines de automatización en n8n y microservicios.',
      'Conexión en tiempo real entre Meta Graph API (Instagram DM, Messenger, WhatsApp), Supabase y Dolibarr.',
      'Control de reintentos con backoff exponencial, dead-letter queues y alertas automáticas de fallas.',
      'Automatización de despachos de presupuestos por email con PDF adjunto generado en el servidor.'
    ],
    kpis: [
      { label: 'Workflows en Producción', valor: '24 Flujos', status: 'excelente' },
      { label: 'Tasa de Éxito Webhooks', valor: '99.98%', status: 'excelente' },
      { label: 'Ejecuciones Semanales', valor: '18.400+', status: 'excelente' },
      { label: 'Tiempo Procesamiento Webhook', valor: '85 ms', status: 'excelente' }
    ],
    herramientas: ['n8n Self-Hosted', 'Supabase Realtime', 'Meta Graph API', 'Resend Email API', 'Postman'],
    ultimoReporte: {
      fecha: 'Hoy, 13:55',
      resumen: 'Se verificó la sincronización de leads de WhatsApp y presupuestos. El flujo de generación de PDF en Base64 se ejecuta en menos de 200ms y los webhooks de Meta tienen cero pérdidas de paquetes.',
      hallazgos: [
        'Los triggers de nuevo presupuesto en Supabase se transmiten a la tabla de CRM instantáneamente.',
        'El despachador de emails vía Resend cuenta con tasa de entrega del 99.6%.',
        'Cero errores 500 en las rutas de API durante las últimas 72 horas continuas.'
      ],
      recomendacion: 'Configurar un canal de webhook exclusivo para notificar al Gerente General ante cualquier licitación de más de 50 millones en Mercado Público.'
    },
    promptPersonalidad: 'Eres la Ingeniera Senior de Automatizaciones (n8n & APIs) de Gama Seguridad. Tu comunicación es precisa, apasionada por la eficiencia, obsesionada con los webhooks libres de errores y la sincronización en milisegundos.',
    historialChat: [
      { autor: 'agente', mensaje: 'Don Tomás, pipelines de n8n y APIs de Meta operando con cero fallas. ¿Deseas automatizar algún nuevo flujo operativo?', hora: '09:30' }
    ]
  },

  // 9. Desarrollo de Software & SaaS (Plataformas Propias / Dashboards)
  {
    id: 'ia_software_saas',
    nombre: 'Benjamín Tapia',
    rol: 'Staff Fullstack Engineer & Arquitecto Next.js / SaaS',
    area: 'ia',
    areaNombre: 'Oficina de IA e Innovación',
    reportaA: 'Liderazgo / Arquitectura IA',
    avatarEmoji: '💻',
    avatarColor: 'from-blue-700 to-indigo-950',
    plumbobColor: '#22c55e',
    estadoSim: 'Compilando',
    tareaActual: 'Optimizando el módulo Organigrama Sims 24/7 y la reactividad a un clic de la tabla de presupuestos.',
    tiempoEnPuesto: '24/7 Activo',
    energiaSim: 95,
    obligaciones: [
      'Desarrollo y evolución de la plataforma web `/operacion`, dashboards gerenciales y portales técnicos.',
      'Garantizar compilación 100% limpia en Next.js 16 (Turbopack) con cero errores TypeScript.',
      'Implementación de diseño UI/UX de clase mundial con glassmorphism, micro-animaciones y soporte móvil total.',
      'Despliegues en Vercel Producción con altos estándares de rendimiento y SEO.'
    ],
    kpis: [
      { label: 'TypeScript / Build Status', valor: '0 Errores', status: 'excelente' },
      { label: 'Lighthouse Performance', valor: '98 / 100', status: 'excelente' },
      { label: 'Páginas Estáticas SSG', valor: '192 Rutas', status: 'excelente' },
      { label: 'Tiempo de Carga Dashboard', valor: '0.4 seg', status: 'excelente' }
    ],
    herramientas: ['Next.js 16 (Turbopack)', 'React 19', 'Tailwind CSS', 'TypeScript', 'Vercel CLI', 'Git'],
    ultimoReporte: {
      fecha: 'Hoy, 14:10',
      resumen: 'Se completó con éxito la implementación del módulo de Presupuestos con ordenamiento por fecha más cercana en la parte superior y filtros interactivos a un solo clic en todas las columnas. Se creó la nueva oficina Sims 24/7.',
      hallazgos: [
        'Build de producción en Next.js pasa al 100% sin advertencias de tipos ni errores de hidratación.',
        'La tabla de presupuestos soporta orden ascendente/descendente inmediato con iconos visuales.',
        'Diseño responsive testeado tanto en desktop como en dispositivos móviles.'
      ],
      recomendacion: 'Continuar incorporando componentes Bento Grid interactivos en las demás secciones del sistema para mantener la experiencia visual de alta gama.'
    },
    promptPersonalidad: 'Eres el Ingeniero de Software Staff Fullstack de Gama Seguridad. Tu lenguaje es técnico, apasionado por el código limpio, tipado estricto en TypeScript, rendimiento impecable y interfaces que impresionen a primera vista.',
    historialChat: [
      { autor: 'agente', mensaje: 'Don Tomás, el código está compilando limpio y desplegado en producción. La interfaz de la oficina virtual está lista.', hora: '10:15' }
    ]
  },

  // 10. Operaciones de Modelos & Datos (Ollama, LLMs, Chatbots de Atención)
  {
    id: 'ia_modelos_datos',
    nombre: 'Franco Navarro',
    rol: 'MLOps & Prompt Engineer (Ollama, Chatbots Multicanal & Embeddings)',
    area: 'ia',
    areaNombre: 'Oficina de IA e Innovación',
    reportaA: 'Liderazgo / Arquitectura IA',
    avatarEmoji: '🤖',
    avatarColor: 'from-cyan-700 to-slate-900',
    plumbobColor: '#22c55e',
    estadoSim: 'Analizando datos',
    tareaActual: 'Calibrando base de conocimiento con precios oficiales DSC ($22.900 PIR, $10.900 Magnético) y promociones Vetti.',
    tiempoEnPuesto: '24/7 Activo',
    energiaSim: 90,
    obligaciones: [
      'Entrenamiento, monitoreo y calibración continua del Bot de Ventas IA en WhatsApp, Instagram y Landing.',
      'Supervisión de servidores locales con Ollama para inferencia privada de incidentes y audios de la Central.',
      'Gestión de embeddings vectoriales y búsqueda semántica (RAG) para cotizaciones automáticas exactas.',
      'Cero alucinaciones de precios: resguardo de los valores comerciales oficiales del conglomerado.'
    ],
    kpis: [
      { label: 'Precisión Comercial Bot', valor: '99.8%', status: 'excelente' },
      { label: 'Conversaciones Atendidas Mes', valor: '1.420 chats', status: 'excelente' },
      { label: 'Tasa de Alucinación', valor: '0.0%', status: 'excelente' },
      { label: 'Tiempo Inferencia Local', valor: '220 ms', status: 'excelente' }
    ],
    herramientas: ['Ollama Local Llama 3.3', 'ChromaDB / Supabase pgvector', 'Prompt Studio', 'Meta Webhooks'],
    ultimoReporte: {
      fecha: 'Hoy, 13:25',
      resumen: 'Se sincronizó el catálogo oficial de accesorios DSC en el prompt del sistema. El bot de ventas responde en menos de 1 segundo en Instagram y WhatsApp sin desviarse de los precios pactados.',
      hallazgos: [
        'Precios actualizados: PIR DSC a $22.900 CLP + IVA, Magnético a $10.900 CLP + IVA.',
        'La cápsula de chat de ventas en la landing deriva directamente al WhatsApp de ventas +56 9 6436 4943 sin distorsiones.',
        'La memoria de sesión de 20 minutos previene que el bot se cuelgue de temas antiguos.'
      ],
      recomendacion: 'Generar pruebas automáticas con 50 casos extremos para verificar que el bot nunca invente marcas que no comercializamos.'
    },
    promptPersonalidad: 'Eres el Especialista MLOps y Prompt Engineer de Gama Seguridad. Tu mentalidad es científica, orientada a datos, precisión de parámetros, embeddings y calibración fina de modelos de lenguaje.',
    historialChat: [
      { autor: 'agente', mensaje: 'Don Tomás, el bot de ventas está impecable. ¿Deseas hacerle alguna prueba de preguntas difíciles al modelo?', hora: '10:30' }
    ]
  }
]

export default function OrganigramaModule({
  onNavigateModule
}: {
  onNavigateModule?: (moduloId: string) => void
}) {
  const [agentes, setAgentes] = useState<AgenteSim[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('gama_organigrama_sims')
        if (local) return JSON.parse(local)
      } catch (e) {}
    }
    return AGENTES_INICIALES
  })

  const [vistaModo, setVistaModo] = useState<'oficina_sims' | 'organigrama_arbol'>('oficina_sims')
  const [agenteSeleccionadoId, setAgenteSeleccionadoId] = useState<string>('gerencia_general')
  const [mensajeInput, setMensajeInput] = useState('')
  const [enviandoMsg, setEnviandoMsg] = useState(false)
  const [mostrarModalEditarPuesto, setMostrarModalEditarPuesto] = useState(false)
  const [mostrarMemorandumDirectorio, setMostrarMemorandumDirectorio] = useState(false)
  const [filtroArea, setFiltroArea] = useState<'todas' | CategoriaArea>('todas')
  const [horaSim, setHoraSim] = useState('14:25')

  // Reloj virtual Sims
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setHoraSim(now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gama_organigrama_sims', JSON.stringify(agentes))
    } catch (e) {}
  }, [agentes])

  const agenteActivo = useMemo(() => {
    return agentes.find(a => a.id === agenteSeleccionadoId) || agentes[0]
  }, [agentes, agenteSeleccionadoId])

  // Filtrado de agentes
  const agentesFiltrados = useMemo(() => {
    if (filtroArea === 'todas') return agentes
    return agentes.filter(a => a.area === filtroArea)
  }, [agentes, filtroArea])

  // Enviar mensaje en vivo al agente
  const handleEnviarMensaje = () => {
    if (!mensajeInput.trim() || enviandoMsg) return
    const texto = mensajeInput.trim()
    const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

    const nuevoHistorial = [
      ...agenteActivo.historialChat,
      { autor: 'usuario' as const, mensaje: texto, hora }
    ]

    setEnviandoMsg(true)
    setMensajeInput('')

    // Simulación de respuesta inteligente según su rol
    setTimeout(() => {
      let respuesta = ''
      const lower = texto.toLowerCase()

      if (lower.includes('reporte') || lower.includes('informe') || lower.includes('novedad')) {
        respuesta = `Entendido Don Tomás. Mi último reporte indica: ${agenteActivo.ultimoReporte.resumen} Hallazgo clave: ${agenteActivo.ultimoReporte.hallazgos[0]}`
      } else if (lower.includes('kpi') || lower.includes('meta') || lower.includes('rendimiento')) {
        respuesta = `Mis indicadores de área están operando en nivel óptimo: ${agenteActivo.kpis[0].label} en ${agenteActivo.kpis[0].valor} y ${agenteActivo.kpis[1].label} en ${agenteActivo.kpis[1].valor}. Continuo monitoreando las 24 horas.`
      } else if (lower.includes('obligacion') || lower.includes('tarea') || lower.includes('deber')) {
        respuesta = `Mis responsabilidades principales son: 1) ${agenteActivo.obligaciones[0]} y 2) ${agenteActivo.obligaciones[1]}. Todo ejecutándose sin retrasos.`
      } else if (lower.includes('gracias') || lower.includes('excelente') || lower.includes('buen trabajo')) {
        respuesta = `A su servicio Don Tomás. Todo el equipo de la oficina virtual está comprometido al 100% con la excelencia de Gama Seguridad.`
      } else {
        respuesta = `Recibido conforme, Don Tomás. Tomo nota inmediata de su instrucción: "${texto}". Procedo a coordinar con mi departamento y reportaré novedades a la brevedad.`
      }

      const historialConRespuesta = [
        ...nuevoHistorial,
        { autor: 'agente' as const, mensaje: respuesta, hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }
      ]

      setAgentes(prev => prev.map(a => a.id === agenteActivo.id ? { ...a, historialChat: historialConRespuesta } : a))
      setEnviandoMsg(false)
    }, 600)
  }

  // Guardar edición de puesto
  const handleGuardarEdicionPuesto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const nuevaTarea = (form.elements.namedItem('tareaActual') as HTMLInputElement).value
    const nuevoReporte = (form.elements.namedItem('resumenReporte') as HTMLTextAreaElement).value
    const nuevasObligaciones = (form.elements.namedItem('obligaciones') as HTMLTextAreaElement).value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    setAgentes(prev => prev.map(a => {
      if (a.id === agenteActivo.id) {
        return {
          ...a,
          tareaActual: nuevaTarea || a.tareaActual,
          obligaciones: nuevasObligaciones.length > 0 ? nuevasObligaciones : a.obligaciones,
          ultimoReporte: {
            ...a.ultimoReporte,
            resumen: nuevoReporte || a.ultimoReporte.resumen,
            fecha: `Hoy, ${horaSim}`
          }
        }
      }
      return a
    }))

    setMostrarModalEditarPuesto(false)
    alert(`Puesto de trabajo de "${agenteActivo.nombre}" perfeccionado exitosamente.`)
  }

  return (
    <div className="flex-1 bg-slate-900/95 text-slate-100 rounded-3xl p-5 sm:p-7 flex flex-col gap-6 border border-slate-800 shadow-2xl overflow-hidden min-h-0">
      
      {/* ── HEADER DE LA OFICINA VIRTUAL SIMS ── */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 backdrop-blur-md shadow-lg">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold">OFICINA VIRTUAL SIMS 24/7 EN VIVO</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-bold">{horaSim} HRS (TURNO CONTINUO)</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Building className="h-6 w-6 text-[#2997ff]" />
            <span>Organigrama & Equipo IA Autónomo</span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs rounded-full font-mono font-bold">
              10 PUESTOS ACTIVOS
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-medium">
            Sede central inteligente: Agentes de IA interactivos trabajando las 24 horas del día. Cada especialista cumple obligaciones asignadas, ejecuta tareas en tiempo real y reporta a Gerencia General.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Alternador de Vista: Plano Oficina vs Árbol Jerárquico */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1 shadow-inner">
            <button
              onClick={() => setVistaModo('oficina_sims')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                vistaModo === 'oficina_sims'
                  ? 'bg-[#1E40AF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Plano Sims HQ</span>
            </button>
            <button
              onClick={() => setVistaModo('organigrama_arbol')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                vistaModo === 'organigrama_arbol'
                  ? 'bg-[#1E40AF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Árbol Jerárquico</span>
            </button>
          </div>

          {/* Botón Memorándum Ejecutivo */}
          <button
            onClick={() => setMostrarMemorandumDirectorio(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            <span>Memorándum General 24/7</span>
          </button>
        </div>
      </div>

      {/* ── BARRA DE FILTROS POR DEPARTAMENTO ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Áreas:</span>
        {[
          { id: 'todas', label: 'Toda la Empresa (10)', icon: Users },
          { id: 'gerencia', label: 'Gerencia General', icon: Building },
          { id: 'legal', label: 'Asesoría Legal & OS10', icon: Shield },
          { id: 'operaciones', label: 'CRA & Terreno 24/7', icon: Radio },
          { id: 'comercial', label: 'Ventas & Licitaciones', icon: TrendingUp },
          { id: 'ia', label: 'Oficina IA & SaaS', icon: Cpu },
        ].map(cat => {
          const sel = filtroArea === cat.id
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setFiltroArea(cat.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                sel
                  ? 'bg-[#1E40AF] text-white border-blue-500 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── CONTENIDO PRINCIPAL: PLANO SIMS O ÁRBOL JERÁRQUICO + PANEL LATERAL AGENTE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 flex-1 overflow-hidden">
        
        {/* PANEL IZQUIERDO: VISUALIZADOR DE LA OFICINA / ORGANIGRAMA (8 COLS) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* MODO 1: PLANO VIRTUAL DE OFICINA SIMS 24/7 */}
          {vistaModo === 'oficina_sims' && (
            <div className="space-y-4">
              
              {/* SALA 1: PISO EJECUTIVO & LEGAL */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="font-extrabold uppercase tracking-wider text-amber-300">🏢 Ala Ejecutiva: Directorio & Compliance Legal</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">PISO 3 • ALTA DIRECCIÓN</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {agentesFiltrados.filter(a => a.area === 'gerencia' || a.area === 'legal').map(agente => (
                    <TarjetaSimItem
                      key={agente.id}
                      agente={agente}
                      activo={agenteActivo.id === agente.id}
                      onSelect={() => setAgenteSeleccionadoId(agente.id)}
                    />
                  ))}
                </div>
              </div>

              {/* SALA 2: CENTRAL OPERATIVA CRA & CUADRILLAS DE TERRENO */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="font-extrabold uppercase tracking-wider text-blue-300">🚨 Sala de Control CRA & Coordinación de Terreno</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">PISO 1 • MONITOREO CRÍTICO 24/7</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {agentesFiltrados.filter(a => a.area === 'operaciones').map(agente => (
                    <TarjetaSimItem
                      key={agente.id}
                      agente={agente}
                      activo={agenteActivo.id === agente.id}
                      onSelect={() => setAgenteSeleccionadoId(agente.id)}
                    />
                  ))}
                </div>
              </div>

              {/* SALA 3: PISO COMERCIAL & MERCADO PÚBLICO */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-extrabold uppercase tracking-wider text-emerald-300">💼 Piso Comercial: Licitaciones & Customer Success</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">PISO 2 • VENTAS B2B & CHILECOMPRA</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {agentesFiltrados.filter(a => a.area === 'comercial').map(agente => (
                    <TarjetaSimItem
                      key={agente.id}
                      agente={agente}
                      activo={agenteActivo.id === agente.id}
                      onSelect={() => setAgenteSeleccionadoId(agente.id)}
                    />
                  ))}
                </div>
              </div>

              {/* SALA 4: LABORATORIO DE INTELIGENCIA ARTIFICIAL & INNOVACIÓN */}
              <div className="bg-slate-950/80 border border-purple-900/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-900/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="font-extrabold uppercase tracking-wider text-purple-300">🧠 Laboratorio de IA, n8n, SaaS & Modelos Locales</span>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400">PISO TECH • INNOVACIÓN 24/7</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {agentesFiltrados.filter(a => a.area === 'ia').map(agente => (
                    <TarjetaSimItem
                      key={agente.id}
                      agente={agente}
                      activo={agenteActivo.id === agente.id}
                      onSelect={() => setAgenteSeleccionadoId(agente.id)}
                    />
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* MODO 2: ÁRBOL JERÁRQUICO TRADICIONAL CONECTADO */}
          {vistaModo === 'organigrama_arbol' && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 space-y-6">
              
              {/* NODO RAÍZ: GERENCIA GENERAL */}
              <div className="flex justify-center">
                <div
                  onClick={() => setAgenteSeleccionadoId('gerencia_general')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer max-w-sm text-center shadow-xl ${
                    agenteActivo.id === 'gerencia_general'
                      ? 'bg-blue-900/40 border-[#2997ff] ring-2 ring-[#2997ff]/40'
                      : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="text-3xl mb-1">👔</div>
                  <h4 className="font-extrabold text-white text-sm">Don Tomás Toro-Moreno</h4>
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Gerencia General / Directorio</p>
                  <div className="mt-2 text-[11px] text-slate-400 font-medium">Liderazgo global & decisiones estratégicas</div>
                </div>
              </div>

              {/* LÍNEA CONECTORA */}
              <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

              {/* RAMA 1: ASESORÍA LEGAL (STAFF DE APOYO DIRECTO) */}
              <div className="flex justify-center">
                <div
                  onClick={() => setAgenteSeleccionadoId('legal_os10')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer max-w-xs text-center ${
                    agenteActivo.id === 'legal_os10'
                      ? 'bg-amber-900/40 border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="text-2xl mb-1">⚖️</div>
                  <h4 className="font-bold text-white text-xs">Lic. Claudio Valenzuela</h4>
                  <p className="text-[10px] text-amber-300 font-bold uppercase">Asesoría Legal & OS10</p>
                </div>
              </div>

              {/* LÍNEA CONECTORA */}
              <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

              {/* 3 DIVISIONES PRINCIPALES EN PARALELO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                
                {/* DIVISIÓN 1: OPERACIONES */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="text-xs font-black uppercase text-blue-400 tracking-wider text-center border-b border-slate-800 pb-2">
                    🚨 Operaciones & Alarmas
                  </div>
                  {agentes.filter(a => a.area === 'operaciones').map(a => (
                    <div
                      key={a.id}
                      onClick={() => setAgenteSeleccionadoId(a.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        agenteActivo.id === a.id ? 'bg-blue-900/50 border-blue-400' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{a.avatarEmoji}</span>
                        <div>
                          <p className="font-bold text-white text-[11px] leading-tight">{a.nombre}</p>
                          <p className="text-[10px] text-slate-400">{a.rol}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DIVISIÓN 2: COMERCIAL */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="text-xs font-black uppercase text-emerald-400 tracking-wider text-center border-b border-slate-800 pb-2">
                    💼 Comercial & Ventas
                  </div>
                  {agentes.filter(a => a.area === 'comercial').map(a => (
                    <div
                      key={a.id}
                      onClick={() => setAgenteSeleccionadoId(a.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        agenteActivo.id === a.id ? 'bg-emerald-900/50 border-emerald-400' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{a.avatarEmoji}</span>
                        <div>
                          <p className="font-bold text-white text-[11px] leading-tight">{a.nombre}</p>
                          <p className="text-[10px] text-slate-400">{a.rol}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DIVISIÓN 3: IA & INNOVACIÓN */}
                <div className="bg-slate-900/60 border border-purple-900/30 rounded-xl p-3.5 space-y-3">
                  <div className="text-xs font-black uppercase text-purple-400 tracking-wider text-center border-b border-purple-900/30 pb-2">
                    🧠 IA & Innovación
                  </div>
                  {agentes.filter(a => a.area === 'ia').map(a => (
                    <div
                      key={a.id}
                      onClick={() => setAgenteSeleccionadoId(a.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        agenteActivo.id === a.id ? 'bg-purple-900/50 border-purple-400' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{a.avatarEmoji}</span>
                        <div>
                          <p className="font-bold text-white text-[11px] leading-tight">{a.nombre}</p>
                          <p className="text-[10px] text-slate-400">{a.rol}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

        </div>

        {/* PANEL DERECHO: DETALLE DEL AGENTE SIM SELECCIONADO & INTERACCIÓN (4 COLS) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-5 shadow-2xl overflow-y-auto">
          
          <div className="space-y-4">
            
            {/* CABECERA DEL AGENTE CON PLUMBOB SIMS */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-md">
              
              {/* Plumbob Verde Flotante (Icono de Los Sims) */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-emerald-400">SIM ACTIVO</span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-slate-600 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  {agenteActivo.avatarEmoji}
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-black text-white text-base leading-tight">{agenteActivo.nombre}</h3>
                  <p className="text-xs font-bold text-[#2997ff]">{agenteActivo.rol}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Reporta a: {agenteActivo.reportaA}</p>
                </div>
              </div>

              {/* TAREA EN CURSO EN VIVO */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Activity className="h-3 w-3 animate-pulse" />
                    <span>EN EJECUCIÓN (24/7):</span>
                  </span>
                  <span>Energía: {agenteActivo.energiaSim}%</span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {agenteActivo.tareaActual}
                </p>
              </div>

              {/* BOTÓN PERFECCIONAR PUESTO */}
              <button
                onClick={() => setMostrarModalEditarPuesto(true)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                <span>Perfeccionar Puesto & Obligaciones</span>
              </button>

            </div>

            {/* KPIS DE RENDIMIENTO DEL PUESTO */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Métricas Clave de Desempeño:</span>
              <div className="grid grid-cols-2 gap-2">
                {agenteActivo.kpis.map((k, i) => (
                  <div key={i} className="bg-slate-900/70 border border-slate-800 p-2.5 rounded-xl">
                    <div className="text-[10px] text-slate-400 truncate">{k.label}</div>
                    <div className="text-sm font-black text-white font-mono mt-0.5">{k.valor}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* OBLIGACIONES & RESPONSABILIDADES */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Obligaciones Asignadas:</span>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2 text-xs text-slate-300">
                {agenteActivo.obligaciones.map((ob, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{ob}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ÚLTIMO REPORTE EMITIDO A GERENCIA */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10px]">
                <span className="font-extrabold text-amber-300 uppercase flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>Último Reporte a Don Tomás</span>
                </span>
                <span className="font-mono text-slate-500">{agenteActivo.ultimoReporte.fecha}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                {agenteActivo.ultimoReporte.resumen}
              </p>
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Recomendación al Gerente:</span>
                <div className="bg-blue-950/40 border border-blue-900/50 p-2 rounded-lg text-[11px] text-blue-200 font-medium">
                  💡 {agenteActivo.ultimoReporte.recomendacion}
                </div>
              </div>
            </div>

          </div>

          {/* CHAT / DAR INSTRUCCIÓN DIRECTA AL AGENTE EN SU ESCRITORIO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-1.5">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-[#2997ff]" />
                <span>Interacción Directa con {agenteActivo.nombre.split(' ')[0]}</span>
              </span>
              <span className="text-emerald-400 font-mono font-bold">En línea</span>
            </div>

            {/* Historial de Mensajes */}
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
              {agenteActivo.historialChat.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-xl leading-relaxed ${
                    msg.autor === 'usuario'
                      ? 'bg-blue-900/40 text-blue-100 ml-4 border border-blue-800/40'
                      : 'bg-slate-800/70 text-slate-200 mr-4 border border-slate-700/50'
                  }`}
                >
                  <div className="flex justify-between items-center text-[9px] text-slate-400 mb-0.5">
                    <span className="font-bold">{msg.autor === 'usuario' ? 'Don Tomás (Tú)' : agenteActivo.nombre}</span>
                    <span className="font-mono">{msg.hora}</span>
                  </div>
                  <p className="text-[11px]">{msg.mensaje}</p>
                </div>
              ))}
            </div>

            {/* Input para Dar Instrucción */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={mensajeInput}
                onChange={e => setMensajeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEnviarMensaje()}
                placeholder={`Instrucción o consulta a ${agenteActivo.nombre.split(' ')[0]}...`}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2997ff]"
              />
              <button
                onClick={handleEnviarMensaje}
                disabled={enviandoMsg || !mensajeInput.trim()}
                className="p-2 bg-[#1E40AF] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl cursor-pointer transition shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── MODAL 1: PERFECCIONAR PUESTO DE TRABAJO ── */}
      {mostrarModalEditarPuesto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{agenteActivo.avatarEmoji}</span>
                <div>
                  <h3 className="font-black text-base text-white">Perfeccionar Puesto: {agenteActivo.rol}</h3>
                  <p className="text-xs text-slate-400">Titular asignado: {agenteActivo.nombre}</p>
                </div>
              </div>
              <button onClick={() => setMostrarModalEditarPuesto(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleGuardarEdicionPuesto} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Misión & Tarea Actual en Ejecución:</label>
                <input
                  name="tareaActual"
                  defaultValue={agenteActivo.tareaActual}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-[#2997ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Obligaciones Oficiales del Cargo (Una por línea):</label>
                <textarea
                  name="obligaciones"
                  rows={4}
                  defaultValue={agenteActivo.obligaciones.join('\n')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-[#2997ff] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Resumen del Informe para Gerencia:</label>
                <textarea
                  name="resumenReporte"
                  rows={3}
                  defaultValue={agenteActivo.ultimoReporte.resumen}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-[#2997ff] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModalEditarPuesto(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E40AF] hover:bg-[#2563EB] text-white rounded-xl font-bold cursor-pointer shadow-md"
                >
                  Guardar Perfeccionamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: MEMORÁNDUM GENERAL DEL DIRECTORIO ── */}
      {mostrarMemorandumDirectorio && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 sm:p-8 space-y-5 text-slate-100 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">DOCUMENTO EJECUTIVO DE GOBIERNO CORPORATIVO</div>
                <h3 className="font-black text-lg text-white">Memorándum Consolidado de Áreas — Gama Seguridad SpA</h3>
              </div>
              <button onClick={() => setMostrarMemorandumDirectorio(false)} className="text-slate-400 hover:text-white font-bold text-xl">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400">ESTADO GLOBAL DE LA OPERACIÓN 24/7:</span>
                <p className="text-slate-300 leading-relaxed">
                  Todos los departamentos se encuentran sincronizados y trabajando ininterrumpidamente. Se mantiene cero tiempo de inactividad en la Central Receptora de Alarmas y el radar de licitaciones registra $240M CLP en oportunidades comerciales.
                </p>
              </div>

              <div className="space-y-3">
                <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[11px]">Reportes Sintetizados por Departamento:</span>
                {agentes.map(ag => (
                  <div key={ag.id} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-[12px] flex items-center gap-1.5">
                        <span>{ag.avatarEmoji}</span>
                        <span>{ag.nombre} — {ag.rol}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{ag.ultimoReporte.fecha}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{ag.ultimoReporte.resumen}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setMostrarMemorandumDirectorio(false)}
                className="px-6 py-2.5 bg-[#1E40AF] text-white rounded-xl font-bold cursor-pointer hover:bg-blue-600 transition"
              >
                Cerrar Memorándum
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── COMPONENTE TARJETA DE PUESTO SIMS INTERACTIVA ──

function TarjetaSimItem({
  agente,
  activo,
  onSelect
}: {
  agente: AgenteSim
  activo: boolean
  onSelect: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative select-none ${
        activo
          ? 'bg-blue-950/60 border-[#2997ff] ring-2 ring-[#2997ff]/30 shadow-lg scale-[1.01]'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      {/* Plumbob Verde en la Esquina */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] font-mono font-bold text-emerald-400">24/7</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
          {agente.avatarEmoji}
        </div>

        <div className="space-y-0.5 min-w-0 pr-8">
          <h4 className="font-extrabold text-white text-xs leading-snug truncate">{agente.nombre}</h4>
          <p className="text-[11px] font-bold text-[#2997ff] truncate">{agente.rol}</p>
          <span className="inline-block text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md mt-0.5">
            {agente.estadoSim}
          </span>
        </div>
      </div>

      {/* Tarea Resumida */}
      <div className="bg-slate-950/80 border border-slate-800/60 p-2.5 rounded-xl text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
        {agente.tareaActual}
      </div>

      {/* KPI Principal */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
        <span>{agente.kpis[0].label}:</span>
        <span className="font-bold text-emerald-400">{agente.kpis[0].valor}</span>
      </div>
    </div>
  )
}
