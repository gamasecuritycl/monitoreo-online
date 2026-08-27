'use client'

import { useEffect, useState } from 'react'
import { supabaseIA } from '@/lib/supabase'

import { Operator, UserRole, ensureUserAttributes, DEFAULT_ATTRIBUTES_BY_ROLE } from '@/types/operator'

interface ToolModalProps {
  modalId: string
  onClose: () => void
  operadores?: Operator[]
  onUpdateOperadores?: (ops: Operator[]) => void
}

export default function ToolModal({ modalId, onClose, operadores = [], onUpdateOperadores }: ToolModalProps) {
  // Form states for creating new operators
  const [newNombre, setNewNombre] = useState('')
  const [newRol, setNewRol] = useState<'Administrador' | 'Supervisor' | 'Operadora' | 'Técnico'>('Operadora')
  const [newClave, setNewClave] = useState('')

  // Modal interaction states
  const [syncing, setSyncing] = useState(false)
  const [syncDone, setSyncDone] = useState(false)
  const [configText, setConfigText] = useState(
    `# GAMA COMMAND CENTER CONFIG\nPORT=3000\nSYNC_INTERVAL_SEC=3\nDATABASE_PATH=E:\\MONITOREO ONLINE\\BASES DE DATOS\\EVENTOS\nSUPABASE_URL=https://onxwyrwmpjxtwlmjrosr.supabase.co\nMAX_DISPLAYED_EVENTS=50\nAUTO_REFRESH=true`
  )
  const [configSaved, setConfigSaved] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationSteps, setValidationSteps] = useState<string[]>([])
  const [contactIdQuery, setContactIdQuery] = useState('')
  const [contactIdCat, setContactIdCat] = useState('TODOS')
  const [searchAccount, setSearchAccount] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Estados para Asignación de Abonados de Video-Verificación IA
  const [clientesReal, setClientesReal] = useState<any[]>([])
  const [cargandoReal, setCargandoReal] = useState(false)
  const [codigosAbonado, setCodigosAbonado] = useState<Record<string, string>>({})
  const [editandoId, setEditandoId] = useState<string | null>(null)

  // Cargar clientes de IA al abrir el panel de abonados
  useEffect(() => {
    if (modalId === 'list-details') {
      const fetchClientes = async () => {
        try {
          setCargandoReal(true)
          const { data } = await supabaseIA
            .from('clientes')
            .select('id, nombre, empresa, email')
            .order('nombre', { ascending: true })
          if (data) {
            setClientesReal(data)
            const dict: Record<string, string> = {}
            data.forEach(c => {
              dict[c.id] = c.empresa || ''
            })
            setCodigosAbonado(dict)
          }
        } catch (err) {
          console.error('Error cargando abonados para asignación:', err)
        } finally {
          setCargandoReal(false)
        }
      }
      fetchClientes()
    }
  }, [modalId])

  // Guardar asignación de abonado en Supabase IA
  const guardarCodigo = async (clienteId: string) => {
    const val = codigosAbonado[clienteId] || ''
    try {
      const { error } = await supabaseIA
        .from('clientes')
        .update({ empresa: val.trim().toUpperCase() })
        .eq('id', clienteId)
      if (!error) {
        alert('Código de abonado asociado correctamente.')
        setEditandoId(null)
        // Refrescar lista local
        setClientesReal(prev => prev.map(c => c.id === clienteId ? { ...c, empresa: val.trim().toUpperCase() } : c))
      } else {
        alert('Error al asociar: ' + error.message)
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message)
    }
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Trigger manual sync simulation
  const handleManualSync = () => {
    setSyncing(true)
    setSyncDone(false)
    setTimeout(() => {
      setSyncing(false)
      setSyncDone(true)
    }, 2000)
  }

  // Trigger config save simulation
  const handleSaveConfig = () => {
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }

  // Trigger integrity checks simulation
  const handleValidation = () => {
    setValidating(true)
    setValidationSteps([])
    const steps = [
      'Conectando a base de datos Supabase...',
      'Verificando esquema de tabla eventos_monitoreo...',
      'Revisando integridad referencial en cuentas...',
      'Validando formato de timestamps UTC...',
      'Comprobando duplicidad en IDs de eventos...',
      'Verificando índices de búsqueda por fecha_hora...',
      'Base de datos íntegra. 0 inconsistencias detectadas.'
    ]
    
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setValidationSteps(prev => [...prev, step])
        if (idx === steps.length - 1) {
          setValidating(false)
        }
      }, (idx + 1) * 400)
    })
  }

  // Dummy search simulation
  const handleSearch = () => {
    setSearchResults([
      { fecha_hora: '2026-08-25T14:32:00', evento: 'ALARMA ROBO - ZONA 02' },
      { fecha_hora: '2026-08-25T14:35:12', evento: 'RESTAURACIÓN ROBO - ZONA 02' },
      { fecha_hora: '2026-08-26T08:02:11', evento: 'DESARMADO POR USUARIO 01' },
      { fecha_hora: '2026-08-26T18:45:00', evento: 'ARMADO POR USUARIO 01' },
    ])
  }

  // Diccionario Oficial SIA DC-05 Contact ID Ademco Exhaustivo con interacción E (Evento) y R (Restauración)
  const contactIdFullCodes = [
    // ── 100-109: EMERGENCIA MÉDICA ──────────────────────────────────
    { code: '100', cat: 'MÉDICA', eCode: 'E100', eName: 'ALARMA MÉDICA', eDesc: 'Emergencia médica o botón de auxilio', rCode: 'R100', rName: 'RESTABLECIMIENTO MÉDICO', rDesc: 'Condición médica normalizada' },
    { code: '101', cat: 'MÉDICA', eCode: 'E101', eName: 'PÁNICO MÉDICO', eDesc: 'Transmisor colgante de emergencia personal', rCode: 'R101', rName: 'REST. PÁNICO MÉDICO', rDesc: 'Pulsador personal restablecido' },
    { code: '102', cat: 'MÉDICA', eCode: 'E102', eName: 'FALLO DE REPORTE MÉDICO', eDesc: 'Falta de confirmación médica en ventana de tiempo', rCode: 'R102', rName: 'REST. REPORTE MÉDICO', rDesc: 'Reporte médico confirmado' },

    // ── 110-119: FUEGO / INCENDIO ───────────────────────────────────
    { code: '110', cat: 'INCENDIO', eCode: 'E110', eName: 'ALARMA DE FUEGO / INCENDIO', eDesc: 'Activación de sensor de humo o calor general', rCode: 'R110', rName: 'RESTABLECIMIENTO DE FUEGO', rDesc: 'Lazo de incendio en reposo y seguro' },
    { code: '111', cat: 'INCENDIO', eCode: 'E111', eName: 'SENSOR DE HUMO', eDesc: 'Detección de partículas de humo en zona', rCode: 'R111', rName: 'REST. SENSOR DE HUMO', rDesc: 'Cámara de humo despejada' },
    { code: '112', cat: 'INCENDIO', eCode: 'E112', eName: 'DETECTOR DE COMBUSTIÓN', eDesc: 'Detección de gases de combustión temprana', rCode: 'R112', rName: 'REST. COMBUSTIÓN', rDesc: 'Nivel de combustión normalizado' },
    { code: '113', cat: 'INCENDIO', eCode: 'E113', eName: 'FLUJO DE AGUA (SPRINKLER)', eDesc: 'Sensor de flujo activado en red de rociadores', rCode: 'R113', rName: 'REST. FLUJO DE AGUA', rDesc: 'Flujo de agua cerrado y en reposo' },
    { code: '114', cat: 'INCENDIO', eCode: 'E114', eName: 'DETECTOR DE CALOR', eDesc: 'Temperatura térmica crítica superada', rCode: 'R114', rName: 'REST. DETECTOR DE CALOR', rDesc: 'Temperatura térmica normalizada' },
    { code: '115', cat: 'INCENDIO', eCode: 'E115', eName: 'ESTACIÓN MANUAL DE JALÓN', eDesc: 'Tirador manual de emergencia activado', rCode: 'R115', rName: 'REST. ESTACIÓN MANUAL', rDesc: 'Tirador rearmado físicamente con llave' },
    { code: '116', cat: 'INCENDIO', eCode: 'E116', eName: 'DETECTOR DE DUCTO', eDesc: 'Humo detectado en ducto de aire acondicionado', rCode: 'R116', rName: 'REST. DETECTOR DUCTO', rDesc: 'Ducto de aire ventilado' },
    { code: '117', cat: 'INCENDIO', eCode: 'E117', eName: 'DETECTOR DE LLAMA', eDesc: 'Detección óptica de llama abierta (UV/IR)', rCode: 'R117', rName: 'REST. DETECTOR DE LLAMA', rDesc: 'Llama extinguida y despejada' },
    { code: '118', cat: 'INCENDIO', eCode: 'E118', eName: 'PRE-ALARMA DE FUEGO', eDesc: 'Alerta previa antes de disparo general', rCode: 'R118', rName: 'REST. PRE-ALARMA', rDesc: 'Pre-alarma despejada' },

    // ── 120-129: PÁNICO / AMAGO / COACCIÓN ──────────────────────────
    { code: '120', cat: 'PÁNICO', eCode: 'E120', eName: 'ALARMA DE PÁNICO', eDesc: 'Pulsador de pánico presionado por el usuario', rCode: 'R120', rName: 'RESTABLECIMIENTO DE PÁNICO', rDesc: 'Botón de pánico rearmado' },
    { code: '121', cat: 'PÁNICO', eCode: 'E121', eName: 'CÓDIGO DE COACCIÓN / AMAGO', eDesc: 'Desarmado bajo amenaza o emboscada', rCode: 'R121', rName: 'REST. AMAGO / COACCIÓN', rDesc: 'Sistema normalizado tras verificación' },
    { code: '122', cat: 'PÁNICO', eCode: 'E122', eName: 'PÁNICO SILENCIOSO 24H', eDesc: 'Alerta sin sirena local para protección de vida', rCode: 'R122', rName: 'REST. PÁNICO SILENCIOSO', rDesc: 'Pulsador silencioso rearmado' },
    { code: '123', cat: 'PÁNICO', eCode: 'E123', eName: 'PÁNICO AUDIBLE 24H', eDesc: 'Alerta de pánico con activación de sirena', rCode: 'R123', rName: 'REST. PÁNICO AUDIBLE', rDesc: 'Sirena detenida y pulsador en reposo' },
    { code: '124', cat: 'PÁNICO', eCode: 'E124', eName: 'ACCESO FORZADO (PÁNICO)', eDesc: 'Violación física violenta de puerta de acceso', rCode: 'R124', rName: 'REST. ACCESO FORZADO', rDesc: 'Punto de acceso asegurado' },
    { code: '125', cat: 'PÁNICO', eCode: 'E125', eName: 'SALIDA FORZADA (PÁNICO)', eDesc: 'Apertura violenta de vía de evacuación', rCode: 'R125', rName: 'REST. SALIDA FORZADA', rDesc: 'Vía de salida asegurada' },

    // ── 130-139: ROBO / INTRUSIÓN ───────────────────────────────────
    { code: '130', cat: 'ROBO', eCode: 'E130', eName: 'ALARMA DE ROBO / INTRUSIÓN', eDesc: 'Intrusión detectada en zona armada', rCode: 'R130', rName: 'RESTABLECIMIENTO DE ROBO', rDesc: 'Zona de intrusión vuelve a reposo' },
    { code: '131', cat: 'ROBO', eCode: 'E131', eName: 'ROBO PERIMETRAL', eDesc: 'Apertura de puerta, portón o ventana exterior', rCode: 'R131', rName: 'REST. ROBO PERIMETRAL', rDesc: 'Apertura perimetral cerrada' },
    { code: '132', cat: 'ROBO', eCode: 'E132', eName: 'ROBO INTERIOR', eDesc: 'Detección de movimiento PIR en interior', rCode: 'R132', rName: 'REST. ROBO INTERIOR', rDesc: 'Detector de movimiento despejado' },
    { code: '133', cat: 'ROBO', eCode: 'E133', eName: 'ALARMA ROBO 24 HORAS', eDesc: 'Zona de intrusión activa las 24 horas violada', rCode: 'R133', rName: 'REST. ROBO 24H', rDesc: 'Zona 24h vuelve a reposo' },
    { code: '134', cat: 'ROBO', eCode: 'E134', eName: 'ALARMA ENTRADA / SALIDA', eDesc: 'Intrusión en ruta de retardo sin desarmar', rCode: 'R134', rName: 'REST. ENTRADA/SALIDA', rDesc: 'Zona de retardo normalizada' },
    { code: '135', cat: 'ROBO', eCode: 'E135', eName: 'ALARMA DÍA / NOCHE', eDesc: 'Alarma instantánea con control horario', rCode: 'R135', rName: 'REST. DÍA/NOCHE', rDesc: 'Zona día/noche en reposo' },
    { code: '136', cat: 'ROBO', eCode: 'E136', eName: 'ALARMA ROBO EXTERIOR', eDesc: 'Detección en patio, terraza o barrera fotoeléctrica', rCode: 'R136', rName: 'REST. ROBO EXTERIOR', rDesc: 'Barrera o detector exterior despejado' },
    { code: '137', cat: 'ROBO', eCode: 'E137', eName: 'TAMPER / SABOTAJE FÍSICO', eDesc: 'Apertura de caja de panel, sirena o sensor', rCode: 'R137', rName: 'RESTABLECIMIENTO DE TAMPER', rDesc: 'Carcasa o caja cerrada correctamente' },
    { code: '138', cat: 'ROBO', eCode: 'E138', eName: 'PRE-ALARMA DE ROBO', eDesc: 'Primer corte de haz en barreras perimetrales', rCode: 'R138', rName: 'REST. PRE-ALARMA', rDesc: 'Lazo de pre-alarma despejado' },

    // ── 140-162: ALARMAS TÉCNICAS Y AMBIENTALES ────────────────────
    { code: '140', cat: 'TÉCNICA', eCode: 'E140', eName: 'ALARMA GENERAL', eDesc: 'Disparo no clasificado en zona general', rCode: 'R140', rName: 'REST. ALARMA GENERAL', rDesc: 'Zona general restablecida' },
    { code: '141', cat: 'TÉCNICA', eCode: 'E141', eName: 'POLLING LOOP ABIERTO', eDesc: 'Lazo de comunicación multiplexado abierto', rCode: 'R141', rName: 'REST. POLLING LOOP', rDesc: 'Lazo de multiplexado cerrado' },
    { code: '142', cat: 'TÉCNICA', eCode: 'E142', eName: 'POLLING LOOP EN CORTO', eDesc: 'Cortocircuito en cable de lazo multiplexado', rCode: 'R142', rName: 'REST. CORTO LOOP', rDesc: 'Cortocircuito de lazo reparado' },
    { code: '143', cat: 'TÉCNICA', eCode: 'E143', eName: 'ALARMA MÓDULO EXPANSOR', eDesc: 'Falla o disparo en placa de expansión de zonas', rCode: 'R143', rName: 'REST. MÓDULO EXPANSOR', rDesc: 'Módulo expansor normalizado' },
    { code: '144', cat: 'TÉCNICA', eCode: 'E144', eName: 'TAMPER EN SENSOR', eDesc: 'Sabotaje en microswitch de sensor cableado', rCode: 'R144', rName: 'REST. TAMPER SENSOR', rDesc: 'Sensor cerrado y colocado en su base' },
    { code: '145', cat: 'TÉCNICA', eCode: 'E145', eName: 'TAMPER TAPA EXPANSOR', eDesc: 'Sabotaje en gabinete de expansor', rCode: 'R145', rName: 'REST. TAMPER EXPANSOR', rDesc: 'Gabinete de expansor cerrado' },
    { code: '150', cat: 'TÉCNICA', eCode: 'E150', eName: 'ALARMA 24H AMBIENTAL', eDesc: 'Condición ambiental crítica fuera de rango', rCode: 'R150', rName: 'REST. 24H AMBIENTAL', rDesc: 'Variable ambiental normalizada' },
    { code: '151', cat: 'TÉCNICA', eCode: 'E151', eName: 'DETECCIÓN DE GAS', eDesc: 'Fuga de gas combustible o tóxico', rCode: 'R151', rName: 'REST. DETECCIÓN DE GAS', rDesc: 'Ambiente ventilado libre de gas' },
    { code: '152', cat: 'TÉCNICA', eCode: 'E152', eName: 'FALLA DE REFRIGERACIÓN', eDesc: 'Pérdida de frío en cámara frigorífica', rCode: 'R152', rName: 'REST. REFRIGERACIÓN', rDesc: 'Cadena de frío restablecida' },
    { code: '153', cat: 'TÉCNICA', eCode: 'E153', eName: 'PÉRDIDA DE CALOR / CALEFACCIÓN', eDesc: 'Caída crítica de calefacción', rCode: 'R153', rName: 'REST. CALEFACCIÓN', rDesc: 'Calefacción normalizada' },
    { code: '154', cat: 'TÉCNICA', eCode: 'E154', eName: 'INUNDACIÓN / FUGA DE AGUA', eDesc: 'Detección de líquido en piso o sala técnica', rCode: 'R154', rName: 'REST. INUNDACIÓN', rDesc: 'Sensor de agua seco y en reposo' },
    { code: '155', cat: 'ROBO', eCode: 'E155', eName: 'RUPTURA DE CRISTAL', eDesc: 'Sensor acústico de rotura de vidrio activado', rCode: 'R155', rName: 'REST. RUPTURA CRISTAL', rDesc: 'Sensor acústico normalizado' },
    { code: '156', cat: 'TÉCNICA', eCode: 'E156', eName: 'PROBLEMA DE DÍA', eDesc: 'Avería detectada en jornada diurna', rCode: 'R156', rName: 'REST. PROBLEMA DE DÍA', rDesc: 'Avería diurna corregida' },
    { code: '157', cat: 'TÉCNICA', eCode: 'E157', eName: 'NIVEL BAJO GAS ENVASADO', eDesc: 'Presión baja en estanque o cilindro de gas', rCode: 'R157', rName: 'REST. NIVEL DE GAS', rDesc: 'Estanque de gas recargado' },
    { code: '158', cat: 'TÉCNICA', eCode: 'E158', eName: 'TEMPERATURA ALTA', eDesc: 'Temperatura sobre umbral de seguridad', rCode: 'R158', rName: 'REST. TEMPERATURA ALTA', rDesc: 'Temperatura en rango normal' },
    { code: '159', cat: 'TÉCNICA', eCode: 'E159', eName: 'TEMPERATURA BAJA (HELADA)', eDesc: 'Temperatura bajo umbral de congelamiento', rCode: 'R159', rName: 'REST. TEMPERATURA BAJA', rDesc: 'Temperatura normalizada' },
    { code: '161', cat: 'TÉCNICA', eCode: 'E161', eName: 'MONÓXIDO DE CARBONO (CO)', eDesc: 'Concentración peligrosa de gas CO detectada', rCode: 'R161', rName: 'REST. MONÓXIDO (CO)', rDesc: 'Nivel de CO en cero seguro' },

    // ── 200-206: SUPERVISIÓN DE INCENDIO / HIDRÁULICA ───────────────
    { code: '200', cat: 'SUPERVISIÓN', eCode: 'E200', eName: 'SUPERVISIÓN DE FUEGO', eDesc: 'Avería o anomalía en sistema de extinción', rCode: 'R200', rName: 'REST. SUPERVISIÓN FUEGO', rDesc: 'Sistema de extinción supervisado OK' },
    { code: '201', cat: 'SUPERVISIÓN', eCode: 'E201', eName: 'PRESIÓN BAJA DE AGUA', eDesc: 'Caída de presión en matriz de extinción', rCode: 'R201', rName: 'REST. PRESIÓN DE AGUA', rDesc: 'Presión de agua restablecida' },
    { code: '202', cat: 'SUPERVISIÓN', eCode: 'E202', eName: 'NIVEL BAJO DE CO2', eDesc: 'Nivel bajo en cilindro de inundación por gas', rCode: 'R202', rName: 'REST. NIVEL DE CO2', rDesc: 'Cilindro de CO2 recargado' },
    { code: '203', cat: 'SUPERVISIÓN', eCode: 'E203', eName: 'VÁLVULA DE COMPUERTA', eDesc: 'Válvula de red contra incendios manipulada', rCode: 'R203', rName: 'REST. VÁLVULA COMPUERTA', rDesc: 'Válvula abierta y asegurada' },
    { code: '204', cat: 'SUPERVISIÓN', eCode: 'E204', eName: 'NIVEL BAJO ESTANQUE AGUA', eDesc: 'Nivel insuficiente en estanque de bomberos', rCode: 'R204', rName: 'REST. NIVEL ESTANQUE', rDesc: 'Estanque de agua lleno' },
    { code: '205', cat: 'SUPERVISIÓN', eCode: 'E205', eName: 'BOMBA DE INCENDIO ACTIVADA', eDesc: 'Arranque de bomba principal de impulsión', rCode: 'R205', rName: 'BOMBA INCENDIO DETENIDA', rDesc: 'Bomba de incendio en reposo' },
    { code: '206', cat: 'SUPERVISIÓN', eCode: 'E206', eName: 'FALLA / AUSENCIA DE BOMBA', eDesc: 'Falla eléctrica en tablero de bomba de agua', rCode: 'R206', rName: 'REST. FALLA DE BOMBA', rDesc: 'Tablero de bomba operativo' },

    // ── 300-399: PROBLEMAS DE SISTEMA, ENERGÍA Y HARDWARE ───────────
    { code: '300', cat: 'ENERGÍA & SISTEMA', eCode: 'E300', eName: 'PROBLEMA EN EL SISTEMA', eDesc: 'Falla crítica de hardware en placa principal', rCode: 'R300', rName: 'RESTABLECIMIENTO SISTEMA', rDesc: 'Placa principal operativa' },
    { code: '301', cat: 'ENERGÍA & SISTEMA', eCode: 'E301', eName: 'PÉRDIDA DE CORRIENTE AC 220V', eDesc: 'Corte de suministro eléctrico en la propiedad', rCode: 'R301', rName: 'RESTABLECIMIENTO ENERGÍA AC', rDesc: 'Energía 220V AC restablecida' },
    { code: '302', cat: 'ENERGÍA & SISTEMA', eCode: 'E302', eName: 'BATERÍA BAJA DEL PANEL', eDesc: 'Batería de respaldo descargada (<11.5V)', rCode: 'R302', rName: 'RESTABLECIMIENTO BATERÍA', rDesc: 'Batería recargada a nivel óptimo' },
    { code: '303', cat: 'ENERGÍA & SISTEMA', eCode: 'E303', eName: 'ERROR CHECKSUM RAM', eDesc: 'Falla en memoria volátil de panel', rCode: 'R303', rName: 'REST. MEMORIA RAM', rDesc: 'Memoria RAM normalizada' },
    { code: '304', cat: 'ENERGÍA & SISTEMA', eCode: 'E304', eName: 'ERROR CHECKSUM ROM', eDesc: 'Falla en memoria de firmware del panel', rCode: 'R304', rName: 'REST. MEMORIA ROM', rDesc: 'Memoria ROM verificada' },
    { code: '305', cat: 'ENERGÍA & SISTEMA', eCode: 'E305', eName: 'REINICIO / RESET DE SISTEMA', eDesc: 'Reinicio de microprocesador por caída de tensión', rCode: 'R305', rName: 'SISTEMA EN LÍNEA TRAS RESET', rDesc: 'Secuencia de arranque completada' },
    { code: '306', cat: 'ENERGÍA & SISTEMA', eCode: 'E306', eName: 'CAMBIO DE PROGRAMACIÓN', eDesc: 'Parámetros del panel modificados en memoria', rCode: 'R306', rName: 'PROGRAMACIÓN GUARDADA', rDesc: 'Memoria de configuración asegurada' },
    { code: '307', cat: 'ENERGÍA & SISTEMA', eCode: 'E307', eName: 'FALLO DE AUTO-PRUEBA', eDesc: 'Prueba automática de diagnóstico rechazada', rCode: 'R307', rName: 'REST. AUTO-PRUEBA', rDesc: 'Auto-prueba ejecutada con éxito' },
    { code: '308', cat: 'ENERGÍA & SISTEMA', eCode: 'E308', eName: 'SISTEMA APAGADO / DESCONECTADO', eDesc: 'Apagado total de central de alarma', rCode: 'R308', rName: 'SISTEMA ENCENDIDO', rDesc: 'Sistema encendido y transmitiendo' },
    { code: '309', cat: 'ENERGÍA & SISTEMA', eCode: 'E309', eName: 'FALLO TEST DE BATERÍA', eDesc: 'La batería no sostuvo la carga bajo test dinámico', rCode: 'R309', rName: 'TEST DE BATERÍA EXITOSO', rDesc: 'Batería superó test de carga' },
    { code: '310', cat: 'ENERGÍA & SISTEMA', eCode: 'E310', eName: 'AVERÍA DE PUESTA A TIERRA', eDesc: 'Fuga de corriente a tierra detectada', rCode: 'R310', rName: 'REST. PUESTA A TIERRA', rDesc: 'Circuito de tierra normalizado' },
    { code: '311', cat: 'ENERGÍA & SISTEMA', eCode: 'E311', eName: 'BATERÍA AUSENTE O DESCONECTADA', eDesc: 'Borne de batería desconectado o fusible quemado', rCode: 'R311', rName: 'BATERÍA CONECTADA', rDesc: 'Batería conectada y detectada' },
    { code: '312', cat: 'ENERGÍA & SISTEMA', eCode: 'E312', eName: 'SOBRECORRIENTE EN FUENTE', eDesc: 'Consumo excesivo de corriente en auxiliares', rCode: 'R312', rName: 'REST. CORRIENTE FUENTE', rDesc: 'Consumo auxiliar en rango normal' },
    { code: '313', cat: 'ENERGÍA & SISTEMA', eCode: 'E313', eName: 'RESET POR TÉCNICO', eDesc: 'Reinicio manual efectuado por personal técnico', rCode: 'R313', rName: 'NORMALIZADO TRAS RESET', rDesc: 'Operación normal reanudada' },
    { code: '320', cat: 'ENERGÍA & SISTEMA', eCode: 'E320', eName: 'PROBLEMA EN RELEVADOR SONIDO', eDesc: 'Avería en relé de salida de sirena', rCode: 'R320', rName: 'REST. RELEVADOR SONIDO', rDesc: 'Relé de sonido operativo' },
    { code: '321', cat: 'ENERGÍA & SISTEMA', eCode: 'E321', eName: 'FALLO DE SIRENA 1', eDesc: 'Corte de cable o cortocircuito en sirena 1', rCode: 'R321', rName: 'RESTABLECIMIENTO SIRENA 1', rDesc: 'Circuito de sirena 1 reparado' },
    { code: '322', cat: 'ENERGÍA & SISTEMA', eCode: 'E322', eName: 'FALLO DE SIRENA 2', eDesc: 'Corte de cable o avería en sirena 2', rCode: 'R322', rName: 'RESTABLECIMIENTO SIRENA 2', rDesc: 'Circuito de sirena 2 reparado' },
    { code: '330', cat: 'ENERGÍA & SISTEMA', eCode: 'E330', eName: 'FALLO EN PERIFÉRICO SISTEMA', eDesc: 'Pérdida de enlace con teclado o módulo bus', rCode: 'R330', rName: 'REST. PERIFÉRICO SISTEMA', rDesc: 'Periférico enlazado y respondiendo' },
    { code: '333', cat: 'ENERGÍA & SISTEMA', eCode: 'E333', eName: 'SUPERVISIÓN MÓDULO EXPANSIÓN', eDesc: 'Pérdida de comunicación con expansor de zonas', rCode: 'R333', rName: 'REST. MÓDULO EXPANSIÓN', rDesc: 'Comunicación con expansor restaurada' },
    { code: '350', cat: 'COMUNICACIÓN', eCode: 'E350', eName: 'PROBLEMAS DE COMUNICACIÓN', eDesc: 'Incapacidad de conectar con receptora', rCode: 'R350', rName: 'REST. DE COMUNICACIÓN', rDesc: 'Enlace con central restablecido' },
    { code: '351', cat: 'COMUNICACIÓN', eCode: 'E351', eName: 'FALLO LÍNEA TELEFÓNICA 1', eDesc: 'Pérdida de voltaje o tono de línea fija', rCode: 'R351', rName: 'REST. LÍNEA TELEFÓNICA 1', rDesc: 'Línea telefónica con tono y voltaje' },
    { code: '352', cat: 'COMUNICACIÓN', eCode: 'E352', eName: 'FALLO LÍNEA TELEFÓNICA 2', eDesc: 'Pérdida de línea de respaldo telefónico', rCode: 'R352', rName: 'REST. LÍNEA TELEFÓNICA 2', rDesc: 'Línea de respaldo restaurada' },
    { code: '353', cat: 'COMUNICACIÓN', eCode: 'E353', eName: 'FALLO TRANSMISOR RADIO / 4G', eDesc: 'Pérdida de señal celular o radio comunicador', rCode: 'R353', rName: 'REST. TRANSMISOR RADIO/4G', rDesc: 'Señal celular / 4G conectada' },
    { code: '354', cat: 'COMUNICACIÓN', eCode: 'E354', eName: 'FALLO AL COMUNICAR (FTC)', eDesc: 'Superado el número máximo de reintentos', rCode: 'R354', rName: 'COMUNICACIÓN EXITOSA (FTC)', rDesc: 'Canal de reporte confirmado por ACK' },
    { code: '355', cat: 'COMUNICACIÓN', eCode: 'E355', eName: 'SUPERVISIÓN LAZO DE RADIO', eDesc: 'Pérdida de sondeo con torre de radio', rCode: 'R355', rName: 'REST. SUPERVISIÓN RADIO', rDesc: 'Sondeo de radio confirmado' },
    { code: '370', cat: 'FALLAS DE ZONA', eCode: 'E370', eName: 'PROTECCIÓN DE LAZO ABIERTA', eDesc: 'Circuito de zona abierto o cable cortado', rCode: 'R370', rName: 'REST. LAZO DE PROTECCIÓN', rDesc: 'Circuito de zona cerrado' },
    { code: '371', cat: 'FALLAS DE ZONA', eCode: 'E371', eName: 'CORTO EN LAZO DE PROTECCIÓN', eDesc: 'Cortocircuito en cableado de zona', rCode: 'R371', rName: 'REST. CORTO DE PROTECCIÓN', rDesc: 'Cortocircuito de zona reparado' },
    { code: '373', cat: 'INCENDIO', eCode: 'E373', eName: 'AVERÍA EN LAZO DE FUEGO', eDesc: 'Avería eléctrica en circuito de sensores humo', rCode: 'R373', rName: 'REST. LAZO DE FUEGO', rDesc: 'Lazo de humo en resistencia normal' },
    { code: '380', cat: 'FALLAS DE ZONA', eCode: 'E380', eName: 'PROBLEMA / AVERÍA EN ZONA', eDesc: 'Falla genérica de supervisión en sensor', rCode: 'R380', rName: 'RESTABLECIMIENTO DE ZONA', rDesc: 'Zona operativa y en reposo' },
    { code: '381', cat: 'FALLAS DE ZONA', eCode: 'E381', eName: 'PÉRDIDA SUPERVISIÓN SENSOR RF', eDesc: 'Sensor inalámbrico dejó de transmitir presencia', rCode: 'R381', rName: 'REST. SUPERVISIÓN SENSOR RF', rDesc: 'Enlace inalámbrico RF recuperado' },
    { code: '383', cat: 'FALLAS DE ZONA', eCode: 'E383', eName: 'TAMPER EN SENSOR INALÁMBRICO', eDesc: 'Carcasa de sensor inalámbrico abierta', rCode: 'R383', rName: 'REST. TAMPER SENSOR RF', rDesc: 'Sensor inalámbrico cerrado' },
    { code: '384', cat: 'ENERGÍA & SISTEMA', eCode: 'E384', eName: 'BATERÍA BAJA EN SENSOR RF', eDesc: 'Pila de sensor inalámbrico agotándose', rCode: 'R384', rName: 'REST. BATERÍA SENSOR RF', rDesc: 'Pila cambiada por nueva' },

    // ── 400-466: APERTURAS Y CIERRES (ARMADO / DESARMADO) ────────────
    { code: '400', cat: 'APERTURA / CIERRE', eCode: 'E400', eName: 'DESARMADO GENERAL (APERTURA)', eDesc: 'Apertura del sistema de seguridad', rCode: 'R400', rName: 'ARMADO GENERAL (CIERRE)', rDesc: 'Cierre del sistema de seguridad' },
    { code: '401', cat: 'APERTURA / CIERRE', eCode: 'E401', eName: 'DESARMADO POR USUARIO (APERTURA)', eDesc: 'Apertura manual ingresando código en teclado', rCode: 'R401', rName: 'ARMADO POR USUARIO (CIERRE)', rDesc: 'Cierre manual ingresando código en teclado' },
    { code: '402', cat: 'APERTURA / CIERRE', eCode: 'E402', eName: 'DESARMADO POR GRUPO', eDesc: 'Apertura simultánea de partición o grupo', rCode: 'R402', rName: 'ARMADO POR GRUPO', rDesc: 'Cierre de partición o grupo' },
    { code: '403', cat: 'APERTURA / CIERRE', eCode: 'E403', eName: 'DESARMADO AUTOMÁTICO', eDesc: 'Apertura automática programada por reloj', rCode: 'R403', rName: 'ARMADO AUTOMÁTICO', rDesc: 'Cierre automático programado por reloj' },
    { code: '404', cat: 'APERTURA / CIERRE', eCode: 'E404', eName: 'DESARMADO TARDÍO', eDesc: 'Apertura efectuada después de la hora pactada', rCode: 'R404', rName: 'ARMADO TARDÍO', rDesc: 'Cierre efectuado después de la hora pactada' },
    { code: '405', cat: 'APERTURA / CIERRE', eCode: 'E405', eName: 'DESARMADO DIFERIDO', eDesc: 'Postergación autorizada de horario de apertura', rCode: 'R405', rName: 'ARMADO DIFERIDO', rDesc: 'Postergación de horario de cierre' },
    { code: '406', cat: 'APERTURA / CIERRE', eCode: 'E406', eName: 'CANCELACIÓN DE ALARMA', eDesc: 'Usuario desactivó alarma tras una activación', rCode: 'R406', rName: 'CONFIRMACIÓN TRAS CANCELACIÓN', rDesc: 'Sistema armado nuevamente' },
    { code: '407', cat: 'APERTURA / CIERRE', eCode: 'E407', eName: 'DESARMADO REMOTO (APP/WEB)', eDesc: 'Apertura mediante app móvil o software', rCode: 'R407', rName: 'ARMADO REMOTO (APP/WEB)', rDesc: 'Cierre mediante app móvil o software' },
    { code: '408', cat: 'APERTURA / CIERRE', eCode: 'E408', eName: 'ARMADO RÁPIDO (QUICK ARM)', eDesc: 'Cierre rápido presionando tecla sin código', rCode: 'R408', rName: 'DESARMADO TRAS ARMADO RÁPIDO', rDesc: 'Apertura con código de usuario' },
    { code: '409', cat: 'APERTURA / CIERRE', eCode: 'E409', eName: 'DESARMADO CON LLAVE (KEYSWITCH)', eDesc: 'Apertura física con chapa de llave', rCode: 'R409', rName: 'ARMADO CON LLAVE (KEYSWITCH)', rDesc: 'Cierre físico con chapa de llave' },
    { code: '441', cat: 'APERTURA / CIERRE', eCode: 'E441', eName: 'ARMADO PARCIAL (MODO STAY)', eDesc: 'Cierre con personas dentro (excluye PIR interior)', rCode: 'R441', rName: 'DESARMADO MODO STAY', rDesc: 'Apertura total de modo en casa' },
    { code: '456', cat: 'APERTURA / CIERRE', eCode: 'E456', eName: 'ARMADO PARCIAL CON EXCLUSIÓN', eDesc: 'Cierre dejando zonas anuladas activas', rCode: 'R456', rName: 'DESARMADO TRAS ARMADO PARCIAL', rDesc: 'Apertura del sistema' },
    { code: '457', cat: 'APERTURA / CIERRE', eCode: 'E457', eName: 'ERROR DE SALIDA POR USUARIO', eDesc: 'No se desalojó la propiedad en el tiempo de salida', rCode: 'R457', rName: 'REST. ERROR DE SALIDA', rDesc: 'Zona de salida normalizada' },
    { code: '459', cat: 'APERTURA / CIERRE', eCode: 'E459', eName: 'CIERRE RECIENTE', eDesc: 'Activación de alarma pocos minutos tras armar', rCode: 'R459', rName: 'REST. TRAS CIERRE RECIENTE', rDesc: 'Zona asegurada' },

    // ── 500-575: ANULACIONES (BYPASS) Y DESHABILITACIONES ───────────
    { code: '520', cat: 'ANULACIÓN / BYPASS', eCode: 'E520', eName: 'RELEVADOR DESHABILITADO', eDesc: 'Salida de relé deshabilitada por configuración', rCode: 'R520', rName: 'RELEVADOR HABILITADO', rDesc: 'Salida de relé habilitada' },
    { code: '521', cat: 'ANULACIÓN / BYPASS', eCode: 'E521', eName: 'SIRENA 1 DESHABILITADA', eDesc: 'Salida de sirena 1 inhibida', rCode: 'R521', rName: 'SIRENA 1 HABILITADA', rDesc: 'Salida de sirena 1 activa' },
    { code: '522', cat: 'ANULACIÓN / BYPASS', eCode: 'E522', eName: 'SIRENA 2 DESHABILITADA', eDesc: 'Salida de sirena 2 inhibida', rCode: 'R522', rName: 'SIRENA 2 HABILITADA', rDesc: 'Salida de sirena 2 activa' },
    { code: '551', cat: 'ANULACIÓN / BYPASS', eCode: 'E551', eName: 'COMUNICADOR (DIALER) INHIBIDO', eDesc: 'Marcador telefónico desactivado', rCode: 'R551', rName: 'COMUNICADOR HABILITADO', rDesc: 'Marcador telefónico activado' },
    { code: '552', cat: 'ANULACIÓN / BYPASS', eCode: 'E552', eName: 'RADIO XMTR DESHABILITADA', eDesc: 'Transmisor de radio desactivado', rCode: 'R552', rName: 'RADIO XMTR HABILITADA', rDesc: 'Transmisor de radio activado' },
    { code: '570', cat: 'ANULACIÓN / BYPASS', eCode: 'E570', eName: 'ZONA ANULADA (BYPASS)', eDesc: 'Exclusión voluntaria de zona antes de armar', rCode: 'R570', rName: 'ZONA DESANULADA (UNBYPASS)', rDesc: 'Zona reincorporada a la protección activa' },
    { code: '571', cat: 'ANULACIÓN / BYPASS', eCode: 'E571', eName: 'ZONA FUEGO ANULADA', eDesc: 'Exclusión manual de zona contra incendios', rCode: 'R571', rName: 'ZONA FUEGO DESANULADA', rDesc: 'Zona de fuego reincorporada' },
    { code: '572', cat: 'ANULACIÓN / BYPASS', eCode: 'E572', eName: 'ZONA 24 HORAS ANULADA', eDesc: 'Exclusión manual de zona permanente 24h', rCode: 'R572', rName: 'ZONA 24H DESANULADA', rDesc: 'Zona 24h reincorporada' },
    { code: '573', cat: 'ANULACIÓN / BYPASS', eCode: 'E573', eName: 'ZONA ROBO ANULADA', eDesc: 'Exclusión manual de zona de intrusión', rCode: 'R573', rName: 'ZONA ROBO DESANULADA', rDesc: 'Zona de robo reincorporada' },
    { code: '574', cat: 'ANULACIÓN / BYPASS', eCode: 'E574', eName: 'GRUPO DE ZONAS ANULADO', eDesc: 'Exclusión simultánea de grupo de sensores', rCode: 'R574', rName: 'GRUPO DE ZONAS DESANULADO', rDesc: 'Grupo de zonas reincorporado' },

    // ── 600-654: TESTS, PRUEBAS Y MANTENIMIENTO TÉCNICO ─────────────
    { code: '601', cat: 'TESTS & SISTEMA', eCode: 'E601', eName: 'TEST MANUAL INICIADO', eDesc: 'Prueba de comunicación provocada por operador', rCode: 'R601', rName: 'FIN DE TEST MANUAL', rDesc: 'Prueba manual completada' },
    { code: '602', cat: 'TESTS & SISTEMA', eCode: 'E602', eName: 'TEST PERIÓDICO DE VIDA (24H)', eDesc: 'Señal automática de supervivencia de comunicador', rCode: 'R602', rName: 'TEST PERIÓDICO CONFIRMADO', rDesc: 'Enlace y receptor confirmados' },
    { code: '603', cat: 'TESTS & SISTEMA', eCode: 'E603', eName: 'TRANSMISIÓN PERIÓDICA RF', eDesc: 'Prueba de enlace inalámbrico periódica', rCode: 'R603', rName: 'TEST RF CONFIRMADO', rDesc: 'Enlace RF confirmado' },
    { code: '604', cat: 'TESTS & SISTEMA', eCode: 'E604', eName: 'TEST DE FUEGO / SIMULACRO', eDesc: 'Prueba de sirenas y lazo contra incendios', rCode: 'R604', rName: 'FIN DE TEST DE FUEGO', rDesc: 'Simulacro de fuego finalizado' },
    { code: '607', cat: 'TESTS & SISTEMA', eCode: 'E607', eName: 'TEST DE CAMINATA (WALK TEST)', eDesc: 'Técnico inicia prueba de cobertura de sensores', rCode: 'R607', rName: 'FIN DE TEST DE CAMINATA', rDesc: 'Técnico concluye prueba de paso' },
    { code: '608', cat: 'TESTS & SISTEMA', eCode: 'E608', eName: 'AUTOTEST CON AVERÍA AC', eDesc: 'Prueba de 24h reportada mientras no hay luz 220V', rCode: 'R608', rName: 'AUTOTEST CON AC NORMAL', rDesc: 'Prueba de 24h con energía 220V OK' },
    { code: '621', cat: 'TESTS & SISTEMA', eCode: 'E621', eName: 'MEMORIA DE EVENTOS BORRADA', eDesc: 'Historial interno del panel reseteado a cero', rCode: 'R621', rName: 'REGISTRO DE EVENTOS ACTIVO', rDesc: 'Registro de memoria operativo' },
    { code: '623', cat: 'TESTS & SISTEMA', eCode: 'E623', eName: 'MEMORIA DE EVENTOS AL 90%', eDesc: 'Buffer interno de eventos casi lleno', rCode: 'R623', rName: 'MEMORIA DE EVENTOS DESPEJADA', rDesc: 'Eventos descargados y liberados' },
    { code: '625', cat: 'TESTS & SISTEMA', eCode: 'E625', eName: 'RESET TIEMPO Y FECHA', eDesc: 'Pérdida de reloj interno por corte prolongado', rCode: 'R625', rName: 'RELOJ DE PANEL ACTUALIZADO', rDesc: 'Hora y fecha sincronizadas' },
    { code: '626', cat: 'TESTS & SISTEMA', eCode: 'E626', eName: 'TIEMPO / FECHA INCORRECTO', eDesc: 'Desfase horario superior a tolerancia', rCode: 'R626', rName: 'HORA EXACTA SINCRONIZADA', rDesc: 'Reloj interno sincronizado' },
    { code: '627', cat: 'TESTS & SISTEMA', eCode: 'E627', eName: 'ENTRADA A MODO PROGRAMACIÓN', eDesc: 'Técnico / instalador ingresó a configuración', rCode: 'R627', rName: 'SALIDA DE PROGRAMACIÓN', rDesc: 'Técnico salió del menú de configuración' },
    { code: '628', cat: 'TESTS & SISTEMA', eCode: 'E628', eName: 'SALIDA DE MODO PROGRAMACIÓN', eDesc: 'Panel regresa a modo de monitoreo en vivo', rCode: 'R628', rName: 'MODO OPERATIVO ACTIVO', rDesc: 'Protección operativa restablecida' },
    { code: '631', cat: 'TESTS & SISTEMA', eCode: 'E631', eName: 'EXCEPCIÓN DE HORARIO', eDesc: 'Horario especial de feriado o festivo activo', rCode: 'R631', rName: 'HORARIO HABITUAL REANUDADO', rDesc: 'Horario regular de apertura/cierre' },
    { code: '654', cat: 'TESTS & SISTEMA', eCode: 'E654', eName: 'INACTIVIDAD DEL SISTEMA', eDesc: 'Sin eventos ni aperturas en período prolongado', rCode: 'R654', rName: 'ACTIVIDAD NORMAL REANUDADA', rDesc: 'El usuario reanudó el uso del sistema' },
  ]

  const contactIdCategories = ['TODOS', 'ROBO', 'INCENDIO', 'PÁNICO', 'ENERGÍA & SISTEMA', 'APERTURA / CIERRE', 'SUPERVISIÓN', 'TÉCNICA', 'FALLAS DE ZONA', 'ANULACIÓN / BYPASS', 'TESTS & SISTEMA', 'MÉDICA']

  const filteredFullCodes = contactIdFullCodes.filter(c => {
    const query = contactIdQuery.toLowerCase().trim()
    const matchCat = contactIdCat === 'TODOS' || c.cat === contactIdCat
    if (!matchCat) return false

    if (!query) return true
    return (
      c.code.includes(query) ||
      c.eCode.toLowerCase().includes(query) ||
      c.rCode.toLowerCase().includes(query) ||
      c.eName.toLowerCase().includes(query) ||
      c.rName.toLowerCase().includes(query) ||
      c.eDesc.toLowerCase().includes(query) ||
      c.rDesc.toLowerCase().includes(query) ||
      c.cat.toLowerCase().includes(query)
    )
  })

  // Render modal content based on active id
  const renderContent = () => {
    switch (modalId) {
      case 'tools':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Panel de diagnóstico y herramientas administrativas para el Data Pipeline.</p>
            <div className="p-3 bg-[#0a0e1a] rounded border border-[#1a2340] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pipeline Supabase:</span>
                <span className="text-green-400 font-bold">CONECTADO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Frecuencia de Ingesta:</span>
                <span className="text-slate-300">Cada 3 segundos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Latencia de Conexión:</span>
                <span className="text-slate-300">180ms</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {syncing ? 'Sincronizando...' : 'Forzar Sincronización Manual'}
              </button>
              {syncDone && (
                <p className="text-[10px] text-green-400 text-center font-bold">✓ ¡Sincronización completada con éxito!</p>
              )}
            </div>
          </div>
        )
      case 'user-key':
        const eliminarOperador = (codigo: string) => {
          if (operadores.length <= 1) {
            alert('Debe quedar al menos un operador en el sistema.')
            return
          }
          if (confirm(`¿Está seguro de eliminar al operador con código ${codigo}?`)) {
            const nuevos = operadores.filter(o => o.codigo !== codigo)
            onUpdateOperadores?.(nuevos)
          }
        }

        const agregarOperador = () => {
          if (!newNombre.trim() || !newClave.trim()) {
            alert('Por favor complete todos los campos.')
            return
          }
          const maxCod = Math.max(...operadores.map(o => parseInt(o.codigo) || 0), 0)
          const nextCod = String(maxCod + 1).padStart(2, '0')

          const nuevoOp: Operator = {
            codigo: nextCod,
            nombre: newNombre.trim(),
            rol: newRol,
            clave: newClave.trim()
          }
          const nuevos = [...operadores, nuevoOp]
          onUpdateOperadores?.(nuevos)
          setNewNombre('')
          setNewClave('')
          alert('Operador creado exitosamente.')
        }

        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 font-mono uppercase font-bold">Gestión de Usuarios y Atribuciones de Acceso</p>
            <div className="overflow-x-auto border border-[#1a2340] rounded max-h-[160px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-[#111827] text-slate-400 sticky top-0">
                    <th className="p-2 border-b border-[#1a2340] w-12 text-center">CÓD</th>
                    <th className="p-2 border-b border-[#1a2340]">Nombre Funcionario</th>
                    <th className="p-2 border-b border-[#1a2340] w-24">Rol / Perfil</th>
                    <th className="p-2 border-b border-[#1a2340] w-20 text-center">Clave</th>
                    <th className="p-2 border-b border-[#1a2340] w-12 text-center">Eliminar</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 divide-y divide-[#131b30]">
                  {operadores.map(op => (
                    <tr key={op.codigo} className="border-b border-[#131b30] hover:bg-[#1a2340]/25">
                      <td className="p-2 text-center font-bold">{op.codigo}</td>
                      <td className="p-2 font-bold uppercase">{op.nombre}</td>
                      <td className="p-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border ${
                          op.rol === 'Administrador' ? 'bg-red-950 text-red-400 border-red-900' :
                          op.rol === 'Supervisor' ? 'bg-yellow-950 text-yellow-400 border-yellow-900' :
                          op.rol === 'Técnico' ? 'bg-green-950 text-green-400 border-green-900' :
                          'bg-blue-950 text-blue-400 border-blue-900'
                        }`}>
                          {op.rol.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-yellow-500">{op.clave}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => eliminarOperador(op.codigo)}
                          className="text-red-500 hover:text-red-400 font-bold px-1 cursor-pointer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#0a0e1a] rounded border border-[#1a2340] space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block border-b border-[#1a2340] pb-1">➕ Registrar Nuevo Operador / Técnico</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="bg-black border border-[#1a2340] rounded p-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                />
                <select
                  value={newRol}
                  onChange={(e) => setNewRol(e.target.value as any)}
                  className="bg-black border border-[#1a2340] rounded p-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Operadora">Operadora</option>
                  <option value="Técnico">Técnico</option>
                </select>
                <input
                  type="text"
                  placeholder="Clave numérica"
                  value={newClave}
                  onChange={(e) => setNewClave(e.target.value)}
                  className="bg-black border border-[#1a2340] rounded p-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>
              <button
                onClick={agregarOperador}
                className="w-full mt-1 py-1.5 bg-green-900 hover:bg-green-800 border border-green-700 text-green-200 text-xs font-semibold rounded cursor-pointer"
              >
                REGISTRAR USUARIO
              </button>
            </div>
          </div>
        )
      case 'file-edit':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Editor de configuraciones locales del sistema Gama Command Center.</p>
            <div className="relative">
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                className="w-full h-40 bg-black text-green-400 border border-[#1a2340] rounded p-2 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 justify-between items-center">
              {configSaved ? (
                <span className="text-xs text-green-400 font-bold">✓ Configuración guardada</span>
              ) : <div />}
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        )
      case 'network':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Estado de conexión de las receptoras analógicas e IP virtuales.</p>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 bg-[#0a0e1a] border border-[#1a2340] rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📞</span>
                  <span className="text-slate-300">Receptora Surgard MLR2 (Análoga)</span>
                </div>
                <span className="text-green-400 font-bold text-[10px] border border-green-800 bg-green-950/40 px-1.5 py-0.5 rounded">ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0a0e1a] border border-[#1a2340] rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌐</span>
                  <span className="text-slate-300">Receptora IP Virtual (DSC/Paradox)</span>
                </div>
                <span className="text-green-400 font-bold text-[10px] border border-green-800 bg-green-950/40 px-1.5 py-0.5 rounded">ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0a0e1a] border border-[#1a2340] rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💬</span>
                  <span className="text-slate-300">Notificador Automático WhatsApp</span>
                </div>
                <span className="text-green-400 font-bold text-[10px] border border-green-800 bg-green-950/40 px-1.5 py-0.5 rounded">ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0a0e1a] border border-red-900 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✈️</span>
                  <span className="text-slate-300">Notificador Canales Telegram</span>
                </div>
                <span className="text-red-400 font-bold text-[10px] border border-red-800 bg-red-950/40 px-1.5 py-0.5 rounded animate-pulse">OFFLINE</span>
              </div>
            </div>
          </div>
        )
      case 'shield':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Registro de auditoría de accesos y seguridad RLS.</p>
            <div className="p-3 bg-[#18110a] border border-yellow-900 rounded text-xs text-yellow-400 space-y-1">
              <p className="font-bold">⚠️ ADVERTENCIA DE SEGURIDAD</p>
              <p className="text-[10px] text-slate-300">
                La directiva RLS (Row Level Security) se encuentra desactivada (DISABLE) en Supabase para habilitar la ingesta directa desde sincronizador.py. Se recomienda restringir la API Key en producción.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Sesiones Activas</span>
              <div className="bg-black border border-[#1a2340] rounded p-2 space-y-1 font-mono text-[10px] text-slate-400">
                <div className="flex justify-between border-b border-[#131b30] pb-1">
                  <span>192.168.1.45 (Local)</span>
                  <span>Conectado ahora</span>
                </div>
                <div className="flex justify-between">
                  <span>201.238.10.12 (Santiago, CL)</span>
                  <span>Hace 4 horas</span>
                </div>
              </div>
            </div>
          </div>
        )
      case 'book':
        return (
          <div className="space-y-3 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-2">
              <div>
                <p className="text-xs text-slate-300 font-semibold">
                  Diccionario Oficial de Protocolos SIA DC-05 Contact ID Ademco
                </p>
                <p className="text-[10px] text-slate-500">
                  Interacción directa entre activación de Evento (E) y Normalización de Restauración (R).
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                <span className="bg-red-950/80 text-red-400 border border-red-800/60 px-1.5 py-0.5 rounded font-bold">E = Evento / Alarma</span>
                <span className="text-slate-600">⇄</span>
                <span className="bg-green-950/80 text-green-400 border border-green-800/60 px-1.5 py-0.5 rounded font-bold">R = Restauración</span>
              </div>
            </div>

            {/* Buscador Rápido y Predictivo */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por código (ej. 130, 301), señal (ej. E130, R401), palabra (ej. batería, robo, fuego)..."
                  value={contactIdQuery}
                  onChange={(e) => setContactIdQuery(e.target.value)}
                  className="w-full bg-[#050914] border border-[#1a2340] rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  autoFocus
                />
              </div>
              {contactIdQuery && (
                <button
                  onClick={() => setContactIdQuery('')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded cursor-pointer shrink-0"
                >
                  Limpiar filtro
                </button>
              )}
            </div>

            {/* Filtros por Categoría */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
              {contactIdCategories.map((cat) => {
                const esActiva = contactIdCat === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setContactIdCat(cat)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-sm whitespace-nowrap transition-colors cursor-pointer border ${
                      esActiva
                        ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
                        : 'bg-[#0f172a] border-[#1e293b] text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>

            {/* Tabla Completa con Interacción E y R */}
            <div className="max-h-[52vh] overflow-y-auto border border-[#1e293b] rounded-md bg-[#050914]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#0c1322] border-b border-[#1e293b] z-10 text-slate-300 font-mono text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-[#1e293b] w-14 text-center">CÓDIGO</th>
                    <th className="p-2 border-r border-[#1e293b] w-[42%]">
                      <div className="flex items-center gap-1.5 text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span>EVENTO (E) — Disparo / Falla / Apertura</span>
                      </div>
                    </th>
                    <th className="p-2 border-r border-[#1e293b] w-[42%]">
                      <div className="flex items-center gap-1.5 text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span>RESTAURACIÓN (R) — Normal / Armado</span>
                      </div>
                    </th>
                    <th className="p-2 text-center w-28">CATEGORÍA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#131b30] font-sans">
                  {filteredFullCodes.map((c) => {
                    // Badge color por categoría
                    let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700'
                    if (c.cat === 'ROBO') badgeColor = 'bg-red-950/70 text-red-300 border-red-800'
                    if (c.cat === 'INCENDIO') badgeColor = 'bg-orange-950/70 text-orange-300 border-orange-800'
                    if (c.cat === 'PÁNICO') badgeColor = 'bg-rose-950/70 text-rose-300 border-rose-800'
                    if (c.cat === 'ENERGÍA & SISTEMA') badgeColor = 'bg-yellow-950/70 text-yellow-300 border-yellow-800'
                    if (c.cat === 'APERTURA / CIERRE') badgeColor = 'bg-blue-950/70 text-blue-300 border-blue-800'
                    if (c.cat === 'SUPERVISIÓN') badgeColor = 'bg-amber-950/70 text-amber-300 border-amber-800'
                    if (c.cat === 'ANULACIÓN / BYPASS') badgeColor = 'bg-purple-950/70 text-purple-300 border-purple-800'
                    if (c.cat === 'TESTS & SISTEMA') badgeColor = 'bg-cyan-950/70 text-cyan-300 border-cyan-800'
                    if (c.cat === 'MÉDICA') badgeColor = 'bg-pink-950/70 text-pink-300 border-pink-800'

                    return (
                      <tr key={c.code} className="hover:bg-[#0c1424] transition-colors">
                        {/* Código Base */}
                        <td className="p-2 border-r border-[#1e293b] text-center font-mono font-black text-amber-400 text-sm">
                          {c.code}
                        </td>

                        {/* Columna Evento E */}
                        <td className="p-2 border-r border-[#1e293b] space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-red-900/60 text-red-300 border border-red-700/80 font-mono font-black text-[10px] px-1.5 py-0.2 rounded">
                              {c.eCode}
                            </span>
                            <span className="font-bold text-slate-100 text-xs">
                              {c.eName}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug">
                            {c.eDesc}
                          </p>
                        </td>

                        {/* Columna Restauración R */}
                        <td className="p-2 border-r border-[#1e293b] space-y-0.5 bg-green-950/10">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-green-900/60 text-green-300 border border-green-700/80 font-mono font-black text-[10px] px-1.5 py-0.2 rounded">
                              {c.rCode}
                            </span>
                            <span className="font-bold text-emerald-200 text-xs">
                              {c.rName}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug">
                            {c.rDesc}
                          </p>
                        </td>

                        {/* Categoría */}
                        <td className="p-2 text-center">
                          <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeColor}`}>
                            {c.cat}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredFullCodes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                        No se encontró ningún comando Contact ID que coincida con &quot;{contactIdQuery}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Contador de resultados */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
              <span>Mostrando {filteredFullCodes.length} de {contactIdFullCodes.length} comandos estándar Contact ID</span>
              <span className="text-slate-400 font-bold">Protocolo SIA DC-05 Oficial</span>
            </div>
          </div>
        )
      case 'grid-check':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Herramienta de validación de integridad y consistencia de base de datos.</p>
            <button
              onClick={handleValidation}
              disabled={validating}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              {validating ? 'Validando...' : 'Iniciar Validación de Integridad'}
            </button>
            <div className="bg-black border border-[#1a2340] rounded p-3 h-28 overflow-y-auto font-mono text-[10px] space-y-1">
              {validationSteps.map((step, idx) => (
                <div key={idx} className="text-green-400">{step}</div>
              ))}
              {validating && <div className="text-yellow-400 animate-pulse">Corriendo diagnósticos...</div>}
              {!validating && validationSteps.length > 0 && (
                <div className="text-slate-200 font-bold border-t border-[#1a2340] pt-1 mt-1 text-center">
                  Análisis completo: 0 anomalías encontradas.
                </div>
              )}
            </div>
          </div>
        )
      case 'list-details':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Asigne y cruce abonados de alarmas con clientes de analítica IA.</p>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {cargandoReal ? (
                <div className="text-center py-8 text-xs text-yellow-500 animate-pulse font-mono">[CARGANDO CLIENTES IA...]</div>
              ) : clientesReal.length > 0 ? (
                clientesReal.map((c) => (
                  <div key={c.id} className="p-2 bg-[#0a0e1a] border border-[#1a2340] rounded flex flex-col gap-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center border-b border-[#131b30] pb-1">
                      <span className="font-bold text-slate-200 uppercase">👤 {c.nombre}</span>
                      <span className="text-[9px] text-slate-500">{c.email || 'Sin email'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400">ABONADO ASOCIADO:</span>
                      {editandoId === c.id ? (
                        <div className="flex gap-1 items-center">
                          <input
                            type="text"
                            value={codigosAbonado[c.id] || ''}
                            onChange={(e) => setCodigosAbonado({ ...codigosAbonado, [c.id]: e.target.value })}
                            className="bg-black border border-blue-900 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none w-20 text-center font-bold uppercase font-mono"
                            placeholder="EJ. C701"
                            maxLength={10}
                          />
                          <button
                            onClick={() => guardarCodigo(c.id)}
                            className="bg-green-800 hover:bg-green-700 text-white font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditandoId(null)}
                            className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="font-bold text-yellow-500">{c.empresa || '[SIN CÓDIGO]'}</span>
                          <button
                            onClick={() => setEditandoId(c.id)}
                            className="text-blue-400 hover:text-blue-300 text-[10px] font-bold cursor-pointer"
                          >
                            ✏️ asociar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 italic">[No hay clientes registrados en la BD de IA]</div>
              )}
            </div>
          </div>
        )
      case 'home':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 font-mono">ESTADÍSTICAS DEL GAMA COMMAND CENTER</p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-[#0a0e1a] border border-[#1a2340] rounded">
                <div className="text-xl font-bold text-blue-400 font-mono">2,450</div>
                <div className="text-[9px] text-slate-500 uppercase mt-0.5">Eventos Procesados</div>
              </div>
              <div className="p-3 bg-[#0a0e1a] border border-[#1a2340] rounded">
                <div className="text-xl font-bold text-red-500 font-mono">04</div>
                <div className="text-[9px] text-slate-500 uppercase mt-0.5">Alarmas Activas</div>
              </div>
              <div className="p-3 bg-[#0a0e1a] border border-[#1a2340] rounded">
                <div className="text-xl font-bold text-yellow-500 font-mono">02</div>
                <div className="text-[9px] text-slate-500 uppercase mt-0.5">Fallos de Test</div>
              </div>
              <div className="p-3 bg-[#0a0e1a] border border-[#1a2340] rounded">
                <div className="text-xl font-bold text-green-400 font-mono">182</div>
                <div className="text-[9px] text-slate-500 uppercase mt-0.5">Autotests Recibidos</div>
              </div>
            </div>
          </div>
        )
      case 'search':
        return (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Búsqueda avanzada de registros en la nube.</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-slate-500">Cuenta</label>
                <input
                  type="text"
                  placeholder="ej. 7015"
                  value={searchAccount}
                  onChange={(e) => setSearchAccount(e.target.value)}
                  className="w-full bg-black border border-[#1a2340] rounded p-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-slate-500">Señal</label>
                <input
                  type="text"
                  placeholder="ej. ROBO"
                  className="w-full bg-black border border-[#1a2340] rounded p-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Buscar en Historial
            </button>
            {searchResults.length > 0 && (
              <div className="border border-[#1a2340] rounded max-h-32 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[10px] font-mono">
                  <thead>
                    <tr className="bg-[#111827] text-slate-400">
                      <th className="p-1 border-b border-[#1a2340]">Fecha</th>
                      <th className="p-1 border-b border-[#1a2340]">Señal</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-[#131b30]">
                    {searchResults.map((r, i) => (
                      <tr key={i}>
                        <td className="p-1">{r.fecha_hora.split('T')[0]} {r.fecha_hora.split('T')[1]}</td>
                        <td className={`p-1 font-bold ${r.evento.includes('ROBO') ? 'text-red-400' : 'text-slate-300'}`}>{r.evento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      case 'archive':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Historial de archivos de bases de datos locales cargados.</p>
            <div className="space-y-2 font-mono text-[10px] text-slate-300">
              <div className="p-2 bg-[#0a0e1a] border border-[#1a2340] rounded flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-200">2026-06-30.MDB</span>
                  <p className="text-[9px] text-slate-500">225 KB | Última sincronización: Hace unos segundos</p>
                </div>
                <span className="text-green-400 font-bold border border-green-800 bg-green-950/40 px-1 py-0.5 rounded">ACTIVO</span>
              </div>
              <div className="p-2 bg-[#0a0e1a] border border-[#1a2340] rounded flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-400">2026-06-29.MDB</span>
                  <p className="text-[9px] text-slate-500">172 KB | Respaldado en Supabase</p>
                </div>
                <span className="text-slate-400 font-bold border border-slate-700 bg-slate-900/40 px-1 py-0.5 rounded">ARCHIVADO</span>
              </div>
              <div className="p-2 bg-[#0a0e1a] border border-[#1a2340] rounded flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-400">2026-06-28.MDB</span>
                  <p className="text-[9px] text-slate-500">163 KB | Respaldado en Supabase</p>
                </div>
                <span className="text-slate-400 font-bold border border-slate-700 bg-slate-900/40 px-1 py-0.5 rounded">ARCHIVADO</span>
              </div>
            </div>
          </div>
        )
      case 'ayuda-faq':
        return (
          <div className="space-y-4 font-sans max-h-[62vh] overflow-y-auto pr-1">
            <div className="border-b border-[#1e293b] pb-2">
              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Centro de Ayuda • Preguntas Frecuentes de la Central</p>
              <p className="text-[11px] text-slate-400">Guía rápida de procedimientos para operadores de monitoreo GAMA Security 24/7.</p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-200">
              <div className="bg-[#0b1324] border border-[#1e3a5f] p-3 rounded-md space-y-1">
                <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                  <span>🚨</span> ¿Qué hacer ante una señal de Robo / Intrusión (E130 / E131 / E132)?
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  1. Identifique en pantalla la zona afectada y el área de cobertura.<br/>
                  2. Llame de inmediato a los teléfonos de la lista de <strong>Personas Autorizadas</strong> por orden de prioridad (PR 1, PR 2).<br/>
                  3. Solicite la <strong>Contraseña / Contraclave</strong> de seguridad antes de anular el procedimiento.<br/>
                  4. Si no contestan o la clave es errónea, despache móvil de reacción y comunique a Carabineros (Plan Cuadrante).
                </p>
              </div>

              <div className="bg-[#0b1324] border border-[#1e3a5f] p-3 rounded-md space-y-1">
                <span className="text-rose-400 font-bold flex items-center gap-1.5 text-xs">
                  <span>🆘</span> ¿Cómo actuar ante una señal de Pánico o Coacción / Amago (E120 / E121)?
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <strong>¡MÁXIMA PRIORIDAD!</strong> Nunca llame al abonado preguntando si está en peligro (podría estar bajo amenaza). Despache asistencia policial inmediata al domicilio y active la verificación por cámaras en tiempo real.
                </p>
              </div>

              <div className="bg-[#0b1324] border border-[#1e3a5f] p-3 rounded-md space-y-1">
                <span className="text-yellow-400 font-bold flex items-center gap-1.5 text-xs">
                  <span>⚡</span> ¿Cuándo notificar una Pérdida de Energía 220V AC (E301)?
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  La batería de respaldo del panel brinda entre 8 y 24 horas de autonomía. Se recomienda enviar aviso por WhatsApp o llamar solo si el corte se prolonga más de 30 minutos o si el cliente tiene protocolo especial en sus Características.
                </p>
              </div>

              <div className="bg-[#0b1324] border border-[#1e3a5f] p-3 rounded-md space-y-1">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                  <span>🔑</span> ¿Cómo realizar el Relevo de Guardia y Cambio de Turno?
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Abra el botón <strong>&quot;ENTREGA TURNO&quot;</strong> en la barra inferior, complete el checklist de novedades y guarde el acta. Luego presione el botón de la <strong>Llave 🔑</strong> para ingresar con el código del nuevo operador.
                </p>
              </div>
            </div>
          </div>
        )
      case 'ayuda-manuales':
        return (
          <div className="space-y-4 font-sans max-h-[62vh] overflow-y-auto pr-1">
            <div className="border-b border-[#1e293b] pb-2">
              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Manuales y Guías Operativas de Turno</p>
              <p className="text-[11px] text-slate-400">Documentación de uso del Command Center, atajos y protocolos operativos.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#0b1324] border border-[#1e3a5f] p-3 rounded-md space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-cyan-300 font-bold text-xs flex items-center gap-1.5 mb-1">
                    <span>📘</span> Manual de Operador Central 24/7
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Guía completa sobre recepción de señales, interpretación de códigos Contact ID, gestión de bitácora y despacho.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#1a2b4a] flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-mono">Rev. 2026.2</span>
                  <span className="text-green-400 font-bold">VIGENTE</span>
                </div>
              </div>

              <div className="bg-[#0b1324] border border-[#1e3a5f] p-3 rounded-md space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-cyan-300 font-bold text-xs flex items-center gap-1.5 mb-1">
                    <span>🎥</span> Guía de Verificación por Video
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Instrucciones para vincular canales de cámaras Dahua/NVR, visualización de streaming en vivo y clips de alerta.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#1a2b4a] flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-mono">Dahua AI Sync</span>
                  <span className="text-green-400 font-bold">VIGENTE</span>
                </div>
              </div>

              <div className="bg-[#0b1324] border border-[#1e3a5f] p-3 rounded-md space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-cyan-300 font-bold text-xs flex items-center gap-1.5 mb-1">
                    <span>💬</span> Protocolo WhatsApp & Despacho
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Plantillas de mensajes predefinidos para apertura/cierre fuera de horario, avisos de corte de luz y confirmación de alarmas.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#1a2b4a] flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-mono">Baileys Core</span>
                  <span className="text-green-400 font-bold">VIGENTE</span>
                </div>
              </div>

              <div className="bg-[#0b1324] border border-[#1e3a5f] p-3 rounded-md space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-cyan-300 font-bold text-xs flex items-center gap-1.5 mb-1">
                    <span>🛠️</span> Guía de Órdenes Técnicas (OT)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Procedimiento para registrar fallas de batería, sensores dañados y asignación de visitas para técnicos en terreno.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#1a2b4a] flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-mono">Servicio Técnico</span>
                  <span className="text-green-400 font-bold">VIGENTE</span>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return <p className="text-xs text-slate-400">Módulo en desarrollo.</p>
    }
  }

  // Retrieve details about the chosen modal
  const getModalInfo = () => {
    const defaultInfo = { titulo: 'MÓDULO', desc: 'Módulo en desarrollo.' }
    const titles: Record<string, { titulo: string; desc: string }> = {
      'tools': { titulo: '🔧 PIPELINE & DIAGNÓSTICO', desc: '' },
      'user-key': { titulo: '🔑 OPERADORES Y CLAVES', desc: '' },
      'file-edit': { titulo: '📝 CONFIGURACIONES SYSTEM', desc: '' },
      'network': { titulo: '🔗 ESTADO DE RECEPTORAS', desc: '' },
      'shield': { titulo: '🛡️ AUDITORÍA DE SEGURIDAD', desc: '' },
      'book': { titulo: '📖 CÓDIGOS CONTACT ID (SIA DC-05)', desc: '' },
      'grid-check': { titulo: '✅ VALIDACIÓN DE DATOS', desc: '' },
      'list-details': { titulo: '📋 BUSCADOR DE ABONADOS', desc: '' },
      'home': { titulo: '🏠 RESUMEN GENERAL CENTRAL', desc: '' },
      'search': { titulo: '🔍 BÚSQUEDA HISTÓRICA DE EVENTOS', desc: '' },
      'archive': { titulo: '📦 ARCHIVOS MDB RESPALDADOS', desc: '' },
      'ayuda-faq': { titulo: '❓ PREGUNTAS FRECUENTES (FAQ)', desc: '' },
      'ayuda-manuales': { titulo: '📚 MANUALES DE OPERADOR', desc: '' },
    }
    return titles[modalId] || defaultInfo
  }

  const info = getModalInfo()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-mono p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`w-full ${
        modalId === 'book' ? 'max-w-5xl' : ['ayuda-faq', 'ayuda-manuales'].includes(modalId) ? 'max-w-3xl' : 'max-w-md'
      } bg-[#080d19] border border-[#1e293b] rounded-md shadow-2xl overflow-hidden`}>
        {/* Header style Windows Desktop bevel */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#111827] border-b border-[#1e293b]">
          <h2 className="text-xs font-bold text-slate-200 tracking-wider font-mono">{info.titulo}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 text-lg leading-none cursor-pointer p-1"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-2 bg-[#0a0e1a] border-t border-[#1e293b]">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 text-xs font-semibold rounded cursor-pointer transition-colors"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  )
}
