export type UserRole = 'Administrador' | 'Supervisor' | 'Operador' | 'Operadora' | 'Técnico'

export interface UserAttributes {
  verMonitoreoEnVivo: boolean       // Consola de alarmas en tiempo real y mapa táctico
  verCRM: boolean                   // CRM 360°, datos de abonados, fichas y contactos
  verTelemetriaTecnica: boolean      // Diagnóstico de monitoreo, Predictor IA, HealthWatcher, Cámaras
  verConfiguracion: boolean          // Gestión de claves, usuarios y configuración global del sistema
  verReportes: boolean               // Exportación y visualización de reportes (diarios, fallas, ranking)
  enviarMensajesWhatsApp: boolean    // Envío directo de mensajes WhatsApp y notificaciones
  editarZonificacion: boolean        // Edición de zonas MDB, sensores y paneles
  controlTestSimulador: boolean      // Simulador de eventos y control de pruebas (test)
  editarAbonadosRemoto: boolean      // Editor Remoto: Modificación de teléfonos, contactos y fichas en Scorpion
}

export interface Operator {
  codigo: string
  nombre: string
  rol: UserRole
  clave: string
  telefono?: string
  email?: string
  activo?: boolean
  atributos?: UserAttributes
}

export const ATRIBUTOS_DESCRIPCION: Record<keyof UserAttributes, { label: string; desc: string; icon: string }> = {
  verMonitoreoEnVivo: {
    label: 'Monitoreo en Vivo',
    desc: 'Acceso a la consola principal de alarmas en tiempo real y mapa táctico.',
    icon: '📺',
  },
  verCRM: {
    label: 'CRM & Abonados 360°',
    desc: 'Consulta y actualización de contactos, fichas técnicas y abonados.',
    icon: '👥',
  },
  verTelemetriaTecnica: {
    label: 'Servicio Técnico & Telemetría',
    desc: 'Predictor IA, HealthWatcher, Diagnóstico de Monitoreo y Grilla de Cámaras.',
    icon: '🛠️',
  },
  verConfiguracion: {
    label: 'Área de Configuración & Usuarios',
    desc: 'Creación/Edición de claves, operadores, roles y atributos de acceso.',
    icon: '⚙️',
  },
  verReportes: {
    label: 'Reportes & Estadísticas',
    desc: 'Generación y exportación de reportes diarios, semanales y ranking de fallas.',
    icon: '📊',
  },
  enviarMensajesWhatsApp: {
    label: 'WhatsApp & Comunicaciones',
    desc: 'Envío de notificaciones masivas, plantillas y contacto directo vía WhatsApp.',
    icon: '💬',
  },
  editarZonificacion: {
    label: 'Editar Zonificación MDB',
    desc: 'Configuración y modificación de zonas, detectores y sensores MDB.',
    icon: '📐',
  },
  controlTestSimulador: {
    label: 'Simulador & Control Test',
    desc: 'Pruebas manuales de comunicación, simulador de señales y pruebas periódicas.',
    icon: '🧪',
  },
  editarAbonadosRemoto: {
    label: 'Editor Remoto (Scorpion .MDB)',
    desc: 'Modificación remota de teléfonos, contactos, referencias y alta de abonados.',
    icon: '✏️',
  },
}

const PERMISOS_OPERADOR: UserAttributes = {
  verMonitoreoEnVivo: true,
  verCRM: true,
  verTelemetriaTecnica: false,
  verConfiguracion: false,
  verReportes: true,
  enviarMensajesWhatsApp: true,
  editarZonificacion: false,
  controlTestSimulador: true,
  editarAbonadosRemoto: false,
}

export const DEFAULT_ATTRIBUTES_BY_ROLE: Record<UserRole, UserAttributes> = {
  Administrador: {
    verMonitoreoEnVivo: true,
    verCRM: true,
    verTelemetriaTecnica: true,
    verConfiguracion: true,
    verReportes: true,
    enviarMensajesWhatsApp: true,
    editarZonificacion: true,
    controlTestSimulador: true,
    editarAbonadosRemoto: true,
  },
  Supervisor: {
    verMonitoreoEnVivo: true,
    verCRM: true,
    verTelemetriaTecnica: true,
    verConfiguracion: false,
    verReportes: true,
    enviarMensajesWhatsApp: true,
    editarZonificacion: true,
    controlTestSimulador: true,
    editarAbonadosRemoto: true,
  },
  Operador: PERMISOS_OPERADOR,
  Operadora: PERMISOS_OPERADOR,
  Técnico: {
    verMonitoreoEnVivo: true,
    verCRM: false,
    verTelemetriaTecnica: true,
    verConfiguracion: false,
    verReportes: true,
    enviarMensajesWhatsApp: false,
    editarZonificacion: true,
    controlTestSimulador: true,
    editarAbonadosRemoto: false,
  },
}

export function ensureUserAttributes(op: Partial<Operator>): UserAttributes {
  const role = (op.rol || 'Operador') as UserRole
  const defaults = DEFAULT_ATTRIBUTES_BY_ROLE[role] || DEFAULT_ATTRIBUTES_BY_ROLE.Operador
  return {
    ...defaults,
    ...(op.atributos || {}),
  }
}

export const OPERADORES_PREDETERMINADOS: Operator[] = [
  {
    codigo: '01',
    nombre: 'Central Operativa GAMA Security',
    rol: 'Administrador',
    clave: 'gama2026',
    atributos: DEFAULT_ATTRIBUTES_BY_ROLE.Administrador,
  },
  {
    codigo: '02',
    nombre: 'Supervisor de Turno Central',
    rol: 'Supervisor',
    clave: 'gama8899',
    atributos: DEFAULT_ATTRIBUTES_BY_ROLE.Supervisor,
  },
  {
    codigo: '03',
    nombre: 'Operador de Monitoreo 24/7',
    rol: 'Operador',
    clave: 'gama1234',
    atributos: DEFAULT_ATTRIBUTES_BY_ROLE.Operador,
  },
  {
    codigo: '04',
    nombre: 'Técnico Especialista de Campo',
    rol: 'Técnico',
    clave: 'gama7788',
    atributos: DEFAULT_ATTRIBUTES_BY_ROLE.Técnico,
  },
]
