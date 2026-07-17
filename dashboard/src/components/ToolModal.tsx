'use client'

import { useEffect, useState } from 'react'
import { supabaseIA } from '@/lib/supabase'

interface Operator {
  codigo: string
  nombre: string
  rol: 'Administrador' | 'Supervisor' | 'Operadora' | 'Técnico'
  clave: string
}

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
    }, 1500)
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
      'Verificando esquema de tablas en Supabase...',
      'Verificando cadenas de conexión pyodbc...',
      'Validando formatos de fecha y hora...',
      'Buscando anomalías de abonados sin cuenta...',
    ]
    
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setValidationSteps(prev => [...prev, `[OK] ${step}`])
        if (idx === steps.length - 1) {
          setValidating(false)
        }
      }, (idx + 1) * 600)
    })
  }

  // Dummy search simulation
  const handleSearch = () => {
    if (!searchAccount) return
    setSearchResults([
      { fecha_hora: '2026-06-30T10:14:02', cuenta: searchAccount, evento: 'ALARMA DE ROBO', zona: '03', usuario: '--' },
      { fecha_hora: '2026-06-30T08:02:11', cuenta: searchAccount, evento: 'APERTURA', zona: '--', usuario: '01' },
      { fecha_hora: '2026-06-29T20:10:45', cuenta: searchAccount, evento: 'CIERRE', zona: '--', usuario: '01' },
      { fecha_hora: '2026-06-29T12:00:00', cuenta: searchAccount, evento: 'AUTOTEST', zona: '--', usuario: '--' },
    ])
  }

  // Contact ID database
  const contactIdCodes = [
    { code: '100', name: 'ALARMA MÉDICA', desc: 'Emergencia médica o botón colgante presionado' },
    { code: '101', name: 'PÁNICO MÉDICO', desc: 'Transmisor médico de emergencia personal' },
    { code: '110', name: 'ALARMA DE INCENDIO', desc: 'Activación de sensor de humo o calor' },
    { code: '111', name: 'ESTACIÓN MANUAL INCENDIO', desc: 'Tirador manual de alarma de incendio' },
    { code: '112', name: 'DETECTOR DE COMBUSTIÓN', desc: 'Sensor térmico o detector de llama activado' },
    { code: '113', name: 'FLUJO DE AGUA INCENDIO', desc: 'Sensor de flujo de agua en tubería de extinción' },
    { code: '120', name: 'ALARMA DE PÁNICO', desc: 'Botón de pánico presionado por el usuario' },
    { code: '121', name: 'PÁNICO SILENCIOSO / AMAGO', desc: 'Presión bajo amenaza o botón silencioso' },
    { code: '122', name: 'PÁNICO AUDIBLE', desc: 'Botón de pánico con activación de sirena' },
    { code: '123', name: 'CÓDIGO DE COACCIÓN', desc: 'Desarmado del sistema bajo coacción/amenaza' },
    { code: '130', name: 'ALARMA DE ROBO', desc: 'Intrusión detectada en zona perimetral/interior' },
    { code: '131', name: 'ALARMA ROBO PERIMETRAL', desc: 'Apertura de puerta o ventana protegida' },
    { code: '132', name: 'ALARMA ROBO INTERIOR', desc: 'Detección de movimiento en zona interior' },
    { code: '133', name: 'ALARMA ROBO 24 HORAS', desc: 'Violación de zona activa las 24 horas' },
    { code: '134', name: 'ALARMA ZONA ENTRADA/SALIDA', desc: 'Intrusión en la ruta de retardo de tiempo' },
    { code: '135', name: 'ALARMA ROBO DÍA/NOCHE', desc: 'Alarma instantánea en zona con control horario' },
    { code: '136', name: 'ALARMA ROBO EXTERIOR', desc: 'Detección en patio, terraza o barrera exterior' },
    { code: '137', name: 'TAMPER / SABOTAJE', desc: 'Sabotaje físico de caja de panel, sirena o sensor' },
    { code: '138', name: 'PRE-ALARMA / ROBO CERCANO', desc: 'Primer cruce de haz en zona perimetral' },
    { code: '140', name: 'ALARMA DE GAS', desc: 'Detección de fuga de gas combustible o tóxico' },
    { code: '144', name: 'INUNDACIÓN / FUEGO AGUA', desc: 'Sensor de nivel de agua o fuga de líquido activado' },
    { code: '150', name: 'ALARMA AMBIENTAL 24H', desc: 'Monitoreo de variable ambiental crítica' },
    { code: '154', name: 'ALTA TEMPERATURA', desc: 'Temperatura superior al umbral configurado' },
    { code: '155', name: 'BAJA TEMPERATURA', desc: 'Temperatura inferior al umbral configurado (congelamiento)' },
    { code: '158', name: 'ALTO NIVEL DE AGUA', desc: 'Estanque o pozo superó límite de llenado' },
    { code: '300', name: 'FALLO DEL SISTEMA', desc: 'Falla crítica de hardware en el panel principal' },
    { code: '301', name: 'FALLO DE ENERGÍA AC', desc: 'Pérdida de alimentación de corriente alterna 220V' },
    { code: '302', name: 'BATERÍA BAJA PANEL', desc: 'Batería de respaldo del panel descargada o ausente' },
    { code: '305', name: 'RESET DE SISTEMA', desc: 'Reinicio completo del microprocesador del panel' },
    { code: '306', name: 'CAMBIO DE PROGRAMACIÓN', desc: 'Modificación de parámetros en memoria de panel' },
    { code: '308', name: 'APAGADO DEL SISTEMA', desc: 'Desconexión controlada del panel' },
    { code: '309', name: 'FALLO TEST BATERÍA', desc: 'La batería no soportó el test de carga automático' },
    { code: '311', name: 'FALLO MÓDULO EXPANSOR', desc: 'Pérdida de comunicación con placa receptora de zonas' },
    { code: '321', name: 'FALLO DE SIRENA 1', desc: 'Corte de cable o cortocircuito en salida de campana' },
    { code: '333', name: 'FALLO TRANSMISOR RADIO', desc: 'Avería en la antena o módulo de comunicación celular' },
    { code: '350', name: 'FALLO DE TRANSMISIÓN', desc: 'Incapacidad de conectar con receptor de monitoreo' },
    { code: '351', name: 'FALLO LÍNEA TELEFÓNICA 1', desc: 'Pérdida de tono en la línea de teléfono fija' },
    { code: '354', name: 'FALLO AL COMUNICAR', desc: 'Receptor rechazó intentos de reporte del panel' },
    { code: '373', name: 'FALLO LAZO DE FUEGO', desc: 'Circuito de sensores de humo abierto o cortocircuitado' },
    { code: '380', name: 'FALLO EN ZONA', desc: 'Avería genérica en la supervisión de cableado de zona' },
    { code: '381', name: 'FALLO SUPERVISIÓN RF', desc: 'Pérdida de enlace con sensor inalámbrico' },
    { code: '383', name: 'SABOTAJE SENSOR / TAMPER RF', desc: 'Apertura de carcasa de detector inalámbrico' },
    { code: '384', name: 'BATERÍA BAJA SENSOR RF', desc: 'Pila baja en detector magnético o de movimiento' },
    { code: '400', name: 'APERTURA / CIERRE', desc: 'Desarmado o armado del sistema de intrusión' },
    { code: '401', name: 'DESARMADO / ARMADO USUARIO', desc: 'Apertura o cierre manual con código numérico' },
    { code: '402', name: 'DESARMADO / ARMADO AUTO', desc: 'Armado automático programado por horario' },
    { code: '403', name: 'DESARMADO / ARMADO LLAVE', desc: 'Control físico mediante chapa o interruptor de llave' },
    { code: '406', name: 'CANCELACIÓN DE ALARMA', desc: 'Usuario desactivó alarma tras una activación' },
    { code: '407', name: 'DESARMADO / ARMADO REMOTO', desc: 'Acceso efectuado por software de descarga o red' },
    { code: '408', name: 'ARMADO RÁPIDO', desc: 'Cierre del sistema sin ingresar código de usuario' },
    { code: '409', name: 'ARMADO PARCIAL', desc: 'Armado nocturno o modo en casa' },
    { code: '570', name: 'ZONA ANULADA / BYPASS', desc: 'Exclusión voluntaria de una zona al armar el panel' },
    { code: '571', name: 'ANULACIÓN DE FUEGO', desc: 'Exclusión manual de zona de incendios' },
    { code: '572', name: 'ANULACIÓN ZONA 24H', desc: 'Exclusión manual de zona activa permanente' },
    { code: '573', name: 'ANULACIÓN TAMPER', desc: 'Exclusión manual de zona de sabotaje' },
    { code: '601', name: 'TEST MANUAL', desc: 'Prueba de comunicación iniciada por el operador/instalador' },
    { code: '602', name: 'AUTOTEST PERIÓDICO', desc: 'Señal automática de verificación del sistema (24 horas)' },
    { code: '607', name: 'TEST DE CAMINATA INICIADO', desc: 'Plazo de prueba local de sensores por instalador' },
    { code: '608', name: 'AUTOTEST CON AVERÍA AC', desc: 'Prueba de control periódico con falta de energía alterna' },
    { code: '623', name: 'MEMORIA DE EVENTOS BORRADA', desc: 'Vaciado del registro de historial del panel' },
    { code: '627', name: 'ENTRADA PROGRAMACIÓN', desc: 'Técnico ingresó al menú de configuración local' },
    { code: '628', name: 'SALIDA PROGRAMACIÓN', desc: 'Técnico salió del menú de configuración local' },
  ]

  const filteredCodes = contactIdCodes.filter(
    c => c.code.includes(contactIdQuery) || c.name.toLowerCase().includes(contactIdQuery.toLowerCase())
  )

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
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Diccionario y manual de protocolos Contact ID Ademco.</p>
            <input
              type="text"
              placeholder="Buscar por código o nombre (ej. 130 o ROBO)..."
              value={contactIdQuery}
              onChange={(e) => setContactIdQuery(e.target.value)}
              className="w-full bg-black border border-[#1a2340] rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
            <div className="max-h-48 overflow-y-auto border border-[#1a2340] rounded">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-[#111827] text-slate-400">
                    <th className="p-2 border-b border-[#1a2340] w-12">Código</th>
                    <th className="p-2 border-b border-[#1a2340]">Señal</th>
                    <th className="p-2 border-b border-[#1a2340]">Definición</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 divide-y divide-[#131b30]">
                  {filteredCodes.map((c) => (
                    <tr key={c.code} className="hover:bg-[#131b30]">
                      <td className="p-2 text-yellow-400 font-bold">{c.code}</td>
                      <td className="p-2 font-bold text-slate-200">{c.name}</td>
                      <td className="p-2 text-slate-400 text-[10px]">{c.desc}</td>
                    </tr>
                  ))}
                  {filteredCodes.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-3 text-center text-slate-500">Ningún código coincide.</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
      'book': { titulo: '📖 CÓDIGOS CONTACT ID', desc: '' },
      'grid-check': { titulo: '✅ VALIDACIÓN DE DATOS', desc: '' },
      'list-details': { titulo: '📋 BUSCADOR DE ABONADOS', desc: '' },
      'home': { titulo: '🏠 RESUMEN GENERAL CENTRAL', desc: '' },
      'search': { titulo: '🔍 BÚSQUEDA HISTÓRICA', desc: '' },
      'archive': { titulo: '📦 ARCHIVOS MDB RESPALDADOS', desc: '' },
    }
    return titles[modalId] || defaultInfo
  }

  const info = getModalInfo()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-mono"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md mx-4 bg-[#080d19] border border-[#1e293b] rounded-md shadow-2xl overflow-hidden">
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
