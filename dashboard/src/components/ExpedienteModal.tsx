'use client'

import { useEffect, useRef, useState, Fragment } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'
import { supabase, supabaseIA } from '@/lib/supabase'

import { cleanRut } from '@/lib/rut'
import { esAbonadoInactivo } from '@/lib/inactivos_filter'

// Base de datos de fallback precargada
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesGeneralFallback = clientesDataRaw as Record<string, Record<string, string>>

interface ExpedienteModalProps {
  evento: EventoMonitoreo
  pestanaInicial?: 'telefonos' | 'horarios' | 'camara'
  onClose: () => void
  usuarioRol?: string
}

export default function ExpedienteModal({ evento, pestanaInicial, onClose, usuarioRol = 'Administrador' }: ExpedienteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Cuenta activa seleccionada
  const [cuentaActiva, setCuentaActiva] = useState(evento.cuenta.toUpperCase().trim() || 'C745')
  const [buscarCuentaInput, setBuscarCuentaInput] = useState('')
  
  // Cache en memoria para todos los datos de clientes cargados
  const [clientesMap, setClientesMap] = useState<Record<string, Record<string, string>>>(clientesGeneralFallback)
  
  // Control de pestañas
  const [tabEmergentes, setTabEmergentes] = useState<'telefonos' | 'horarios' | 'camara' | 'servicio_tecnico'>(pestanaInicial || 'telefonos')
  const [ordenesCuenta, setOrdenesCuenta] = useState<any[]>([])
  
  useEffect(() => {
    if (pestanaInicial) {
      setTabEmergentes(pestanaInicial)
    }
  }, [pestanaInicial])

  // Cargar historial de Órdenes de Trabajo para la cuenta activa
  useEffect(() => {
    const fetchOTs = async () => {
      if (!cuentaActiva) return
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'ORDENES_TRABAJO')
          .limit(1)
        if (data && data.length > 0 && data[0].nombre_abonado) {
          const list: any[] = JSON.parse(data[0].nombre_abonado || '[]')
          const filtered = list.filter((o: any) => (o.cuenta || '').toUpperCase().trim() === cuentaActiva.toUpperCase().trim())
          setOrdenesCuenta(filtered)
        }
      } catch (e) {}
    }
    fetchOTs()
  }, [cuentaActiva])

  const [tabInfo, setTabInfo] = useState<'caracteristicas' | 'referencias' | 'observaciones'>('caracteristicas')
  const [tabInstalacion, setTabInstalacion] = useState<'instalacion' | 'ucontrol'>('instalacion')

  // Video-Verificación por IA States
  const [activeCamera, setActiveCamera] = useState<'CAM-01' | 'CAM-02' | 'CAM-03'>('CAM-01')

  // Custom Cameras configuration states
  const [todasLasCamaras, setTodasLasCamaras] = useState<Record<string, { cam01?: string; cam02?: string; cam03?: string }>>({})
  const [editandoCamaras, setEditandoCamaras] = useState(false)
  const [inputCam01, setInputCam01] = useState('')
  const [inputCam02, setInputCam02] = useState('')
  const [inputCam03, setInputCam03] = useState('')

  // Dahua P2P Cameras CRUD State
  const [dahuaCams, setDahuaCams] = useState<Array<{
    id: string
    nombre: string
    serialNumber: string
    usuario: string
    password?: string
    canal: number
    substream: boolean
  }>>([])
  const [inputDahuaSN, setInputDahuaSN] = useState('AE0970BPAG00815')
  const [inputDahuaUser, setInputDahuaUser] = useState('admin')
  const [inputDahuaPass, setInputDahuaPass] = useState('L2D55413')
  const [inputDahuaCanal, setInputDahuaCanal] = useState('1')
  const [inputDahuaNombre, setInputDahuaNombre] = useState('CÁMARA ENTRADA P2P')
  const [editingDahuaId, setEditingDahuaId] = useState<string | null>(null)

  // Estados para RUT y Alias de Unidad (Edición restringida a Administrador)
  const [inputRut, setInputRut] = useState('')
  const [inputAlias, setInputAlias] = useState('')
  const [editandoRut, setEditandoRut] = useState(false)
  const [mostrarModalExcel, setMostrarModalExcel] = useState(false)
  const [excelTextRaw, setExcelTextRaw] = useState('')
  const [cargandoExcel, setCargandoExcel] = useState(false)

  // Estados de integración con BD IA
  const [camarasIA, setCamarasIA] = useState<Array<{ id: string; nombre: string; rtsp_url?: string; activa: boolean }>>([])
  const [clipsIA, setClipsIA] = useState<Array<{ id: string; camara_id: string; clip_path: string; fecha_hora: string; motivo?: string }>>([])
  const [clipSeleccionado, setClipSeleccionado] = useState<string | null>(null)
  const [cargandoIA, setCargandoIA] = useState(false)
  const [selectedCamaraIAId, setSelectedCamaraIAId] = useState<string>('')

  // Load custom cameras config from Supabase
  useEffect(() => {
    const fetchCamaras = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CAMARAS')
          .order('id', { ascending: false })
          .limit(1)
        if (data && data.length > 0 && !error) {
          const parsed = JSON.parse(data[0].nombre_abonado || '{}')
          setTodasLasCamaras(parsed)
        }
      } catch (err) {
        console.warn('Error loading custom cameras list:', err)
      }
    }
    fetchCamaras()
  }, [])

  const camarasActivas = todasLasCamaras[cuentaActiva] || { cam01: '', cam02: '', cam03: '' }

  useEffect(() => {
    setInputCam01(camarasActivas.cam01 || '')
    setInputCam02(camarasActivas.cam02 || '')
    setInputCam03(camarasActivas.cam03 || '')
  }, [cuentaActiva, todasLasCamaras])

  // Cargar lista actualizada de abonados desde la fila especial CLIENTES en eventos_monitoreo
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', 'CLIENTES')
          .limit(1)
        
        if (data && data.length > 0 && !error) {
          const rawJson = data[0].nombre_abonado
          if (rawJson) {
            const map = JSON.parse(rawJson)
            setClientesMap(map)
            console.log(`[SUPABASE REST] ${Object.keys(map).length} expedientes de clientes sincronizados exitosamente en tiempo real.`)
          }
        } else if (error) {
          console.warn('[SUPABASE REST] Fallo al consultar eventos_monitoreo:', error)
        }
      } catch (err) {
        console.warn('[SUPABASE REST] Error de red, usando base de datos local.')
      }
    }
    fetchClientes()
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Cargar cámaras e IA desde la BD de Analítica cuando cambia la cuenta
  useEffect(() => {
    const fetchCamarasIA = async () => {
      if (!cuentaActiva) return
      setCargandoIA(true)
      setCamarasIA([])
      setClipsIA([])
      setClipSeleccionado(null)
      setSelectedCamaraIAId('')
      try {
        // 1. Buscar cliente en BD IA cuyo campo 'empresa' coincide con el código de cuenta
        const { data: clientes } = await supabaseIA
          .from('clientes')
          .select('id, nombre')
          .eq('empresa', cuentaActiva)
          .limit(5)

        if (!clientes || clientes.length === 0) {
          setCargandoIA(false)
          return
        }

        const clienteIds = clientes.map((c: any) => c.id)

        // 2. Obtener cámaras activas de esos clientes
        const { data: cams } = await supabaseIA
          .from('camaras')
          .select('id, nombre, rtsp_url, activa')
          .in('cliente_id', clienteIds)
          .eq('activa', true)

        const camarasList = cams || []
        setCamarasIA(camarasList)
        if (camarasList.length > 0) setSelectedCamaraIAId(camarasList[0].id)

        // 3. Obtener alertas con clips de esas cámaras
        if (camarasList.length > 0) {
          const camIds = camarasList.map((c: any) => c.id)
          const { data: alertas } = await supabaseIA
            .from('alertas')
            .select('id, camara_id, clip_path, fecha_hora, motivo')
            .in('camara_id', camIds)
            .not('clip_path', 'is', null)
            .order('fecha_hora', { ascending: false })
            .limit(20)
          setClipsIA(alertas || [])
        }
      } catch (err) {
        console.warn('[IA DB] Error al cargar cámaras de analítica:', err)
      } finally {
        setCargandoIA(false)
      }
    }
    fetchCamarasIA()
  }, [cuentaActiva])



  // Cargar cámaras Dahua P2P asociadas al abonado activo
  useEffect(() => {
    const fetchDahuaCams = async () => {
      try {
        const localSaved = localStorage.getItem(`gama_dahua_sn_${cuentaActiva}`)
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setDahuaCams(parsed)
              return
            }
          } catch (e) {}
        }

        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', `CAMARAS_DAHUA_${cuentaActiva}`)
          .order('id', { ascending: false })
          .limit(1)

        if (data && data.length > 0 && data[0].nombre_abonado) {
          const parsed = JSON.parse(data[0].nombre_abonado)
          if (Array.isArray(parsed)) {
            setDahuaCams(parsed)
            localStorage.setItem(`gama_dahua_sn_${cuentaActiva}`, JSON.stringify(parsed))
            return
          }
        }

        // Fallback inicial con parámetros de prueba del usuario
        const initialFallback = [
          {
            id: `DH-${cuentaActiva}-1`,
            nombre: 'CÁMARA ACCESO PRINCIPAL P2P',
            serialNumber: 'AE0970BPAG00815',
            usuario: 'admin',
            password: 'L2D55413',
            canal: 1,
            substream: true,
            activa: true
          }
        ]
        setDahuaCams(initialFallback)
      } catch (err) {
        console.warn('Error cargando cámaras Dahua:', err)
      }
    }
    fetchDahuaCams()
  }, [cuentaActiva])

  const guardarCamaraDahuaP2P = async () => {
    if (!inputDahuaSN.trim()) {
      alert('Por favor ingresa un Número de Serie (SN) Dahua válido.')
      return
    }

    let listActualizada = [...dahuaCams]
    if (editingDahuaId) {
      listActualizada = listActualizada.map(c => c.id === editingDahuaId ? {
        ...c,
        nombre: inputDahuaNombre.trim().toUpperCase(),
        serialNumber: inputDahuaSN.trim().toUpperCase(),
        usuario: inputDahuaUser.trim() || 'admin',
        password: inputDahuaPass.trim(),
        canal: Number(inputDahuaCanal) || 1
      } : c)
    } else {
      const nueva: any = {
        id: `DH-${Date.now()}`,
        nombre: inputDahuaNombre.trim().toUpperCase() || 'CÁMARA P2P',
        serialNumber: inputDahuaSN.trim().toUpperCase(),
        usuario: inputDahuaUser.trim() || 'admin',
        password: inputDahuaPass.trim(),
        canal: Number(inputDahuaCanal) || 1,
        substream: true,
        activa: true
      }
      listActualizada.push(nueva)
    }

    setDahuaCams(listActualizada)
    localStorage.setItem(`gama_dahua_sn_${cuentaActiva}`, JSON.stringify(listActualizada))

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: `CAMARAS_DAHUA_${cuentaActiva}`,
        nombre_abonado: JSON.stringify(listActualizada),
        evento: 'CONFIGURACION_DAHUA_CRUD',
        fecha_hora: new Date().toISOString()
      })
      alert(`✅ Configuración P2P Dahua guardada para la cuenta ${cuentaActiva}.`)
      setEditingDahuaId(null)
    } catch (err: any) {
      alert('Error guardando en BD: ' + err.message)
    }
  }

  const eliminarCamaraDahuaP2P = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta cámara Dahua P2P?')) return
    const filtrada = dahuaCams.filter(c => c.id !== id)
    setDahuaCams(filtrada)
    localStorage.setItem(`gama_dahua_sn_${cuentaActiva}`, JSON.stringify(filtrada))
    await supabase.from('eventos_monitoreo').upsert({
      cuenta: `CAMARAS_DAHUA_${cuentaActiva}`,
      nombre_abonado: JSON.stringify(filtrada),
      evento: 'ELIMINACION_DAHUA_CRUD',
      fecha_hora: new Date().toISOString()
    })
  }

  // Sincronizar inputs de RUT y Alias al cambiar de cuenta
  useEffect(() => {
    const r = clientesMap[cuentaActiva]?.rut || clientesGeneralFallback[cuentaActiva]?.rut || ''
    const a = clientesMap[cuentaActiva]?.alias_unidad || clientesGeneralFallback[cuentaActiva]?.alias_unidad || ''
    setInputRut(cleanRut(r))
    setInputAlias(a)
    setEditandoRut(false)
  }, [cuentaActiva, clientesMap])

  // Guardar RUT y Alias de Unidad individual (Restringido a Administrador)
  const guardarRutYAlias = async () => {
    if (usuarioRol !== 'Administrador') {
      alert('🔒 Acción denegada: Solo usuarios con rol Administrador pueden modificar RUTs y Alias de Propiedad.')
      return
    }

    const rutFormateado = cleanRut(inputRut)
    const aliasFormateado = inputAlias.trim().toUpperCase()

    const updatedCliente = {
      ...(clientesMap[cuentaActiva] || {}),
      cuenta: cuentaActiva,
      rut: rutFormateado,
      alias_unidad: aliasFormateado
    }

    const updatedMap = {
      ...clientesMap,
      [cuentaActiva]: updatedCliente
    }

    try {
      const { error } = await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'CLIENTES',
          nombre_abonado: JSON.stringify(updatedMap),
          evento: 'CONFIGURACION_RUT',
          fecha_hora: new Date().toISOString()
        })

      if (!error) {
        setClientesMap(updatedMap)
        setEditandoRut(false)
        alert(`✅ RUT [${rutFormateado}] y Alias [${aliasFormateado || 'SIN ALIAS'}] guardados exitosamente para la cuenta ${cuentaActiva}.`)
      } else {
        throw error
      }
    } catch (err: any) {
      alert('❌ Error al guardar datos de RUT: ' + err.message)
    }
  }

  // Descargar plantilla Excel/CSV oficial de ejemplo
  const descargarPlantillaExcel = () => {
    const contenidoCsv = "N_ABONADO;NOMBRE;RUT;SUCURSAL\nC774;MARIA CECILIA ACUÑA;12123123-6;CASA SANTO DOMINGO\nC775;COMERCIAL GAMA LTDA;76123456-K;LOCAL CENTRO\nC810;JUAN PEREZ;15987654-3;CASA MARBELLA"
    const blob = new Blob(["\uFEFF" + contenidoCsv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'Plantilla_Maestro_RUT_GamaSeguridad.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Carga Masiva desde Excel Maestro (.xlsx / .csv / TSV)
  const procesarCargaMasivaExcel = async () => {
    if (usuarioRol !== 'Administrador') {
      alert('🔒 Acceso denegado: Solo administradores pueden cargar archivos de Excel Maestro.')
      return
    }

    if (!excelTextRaw.trim()) {
      alert('Por favor pega el contenido del archivo Excel Maestro (o selecciona/arrastra el texto).')
      return
    }

    setCargandoExcel(true)
    try {
      const lineas = excelTextRaw.split(/\r?\n/).filter(l => l.trim().length > 0)
      let actualizados = 0
      const nuevoMap = { ...clientesMap }

      for (const linea of lineas) {
        // Separa por tabuladores (copiado desde Excel) o comas / punto y coma / pipe
        const cols = linea.split(/\t|;|\|/).map(c => c.trim().replace(/^["']|["']$/g, ''))
        if (cols.length < 2) continue

        // Saltar línea de encabezados si contiene "abonado", "cuenta", "nombre", "rut"
        const col0Lower = cols[0].toLowerCase()
        if (col0Lower.includes('abonado') || col0Lower.includes('cuenta') || col0Lower.includes('nombre') || col0Lower === 'n°') continue

        // ORDEN ESTRICTO SOLICITADO: Col 0: N° Abonado | Col 1: Nombre | Col 2: RUT | Col 3: Sucursal / Alias
        let cuentaStr = cols[0] ? cols[0].toUpperCase().trim() : ''
        let nombreStr = cols[1] || ''
        let rutStr = cols[2] || ''
        let sucursalStr = cols[3] || ''

        // Detección de seguridad si invirtió RUT y Nombre (Col 1 vs Col 2)
        if (cleanRut(cols[1]).includes('-') && !cleanRut(cols[2]).includes('-')) {
          rutStr = cols[1]
          nombreStr = cols[2]
        }

        if (!cuentaStr) continue
        if (!cuentaStr.startsWith('C') && /^\d+$/.test(cuentaStr)) {
          cuentaStr = `C${cuentaStr}`
        }

        const rutFormateado = cleanRut(rutStr)

        nuevoMap[cuentaStr] = {
          ...(nuevoMap[cuentaStr] || {}),
          cuenta: cuentaStr,
          nombre: nombreStr || nuevoMap[cuentaStr]?.nombre || '',
          rut: rutFormateado || nuevoMap[cuentaStr]?.rut || '',
          alias_unidad: sucursalStr.toUpperCase() || nuevoMap[cuentaStr]?.alias_unidad || ''
        }
        actualizados++
      }

      if (actualizados === 0) {
        alert('No se detectaron filas válidas con formato N° ABONADO, NOMBRE, RUT y SUCURSAL.')
        return
      }

      // Guardar en Supabase fila especial CLIENTES
      const { error } = await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'CLIENTES',
          nombre_abonado: JSON.stringify(nuevoMap),
          evento: 'CARGA_MASIVA_EXCEL',
          fecha_hora: new Date().toISOString()
        })

      if (!error) {
        setClientesMap(nuevoMap)
        setMostrarModalExcel(false)
        setExcelTextRaw('')
        alert(`🎉 ¡Éxito! Se actualizaron ${actualizados} abonados desde el Excel Maestro en la base de datos.`)
      } else {
        throw error
      }
    } catch (err: any) {
      alert('❌ Error al procesar Excel Maestro: ' + err.message)
    } finally {
      setCargandoExcel(false)
    }
  }

  // Buscar el registro completo del cliente en el mapa
  const cliente = clientesMap[cuentaActiva] || clientesGeneralFallback[cuentaActiva] || {
    cuenta: cuentaActiva,
    nombre: evento.nombre_abonado || 'SIN NOMBRE REGISTRADO',
    ciudad: 'SANTIAGO',
    direccion: 'DIRECCIÓN NO DISPONIBLE',
    sector: 'NO DISPONIBLE'
  }

  // Calcular otras unidades vinculadas al mismo RUT
  const otrasUnidadesRut = Object.values(clientesMap).filter(c => {
    const rActual = cleanRut(cliente.rut || '')
    const rComparar = cleanRut(c.rut || '')
    const cCode = (c.cuenta || '').toUpperCase().trim()
    return rActual && rComparar === rActual && cCode !== cuentaActiva
  })

  // Lista de todos los clientes activos para el buscador inferior (excluyendo inactivos)
  const listaAbonados = Object.values(clientesMap)
    .filter(c => !esAbonadoInactivo(c.cuenta || '', c.nombre || ''))
    .map(c => ({
      cuenta: (c.cuenta || '').toUpperCase().trim(),
      nombre: (c.nombre || '').toUpperCase().trim()
    })).sort((a, b) => a.cuenta.localeCompare(b.cuenta))

  // Filtrar lista de abonados según el input de búsqueda
  const listaFiltrada = buscarCuentaInput.trim()
    ? listaAbonados.filter(a => 
        a.cuenta.toLowerCase().includes(buscarCuentaInput.toLowerCase()) ||
        a.nombre.toLowerCase().includes(buscarCuentaInput.toLowerCase())
      )
    : listaAbonados

  // Extraer teléfonos de emergencia indexados (nombre1, direccion1, t1...)
  const telefonosEmergencia = []
  for (let i = 1; i <= 7; i++) {
    const nom = cliente[`nombre${i}`] || ''
    const dir = cliente[`direccion${i}`] || ''
    const carg = cliente[`carg${i}`] || ''
    const tel = cliente[`t${i}`] || ''
    if (nom || tel) {
      telefonosEmergencia.push({
        num: i,
        nombre: nom,
        direccion: dir,
        cargo: carg,
        telefono: tel
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-mono p-2 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* 
        VENTANA RETRO PIXEL-PERFECT COMPACTA
        PC: Ancho 950px, Alto 510px fijos.
        Móvil: Ancho completo fluido, scrollbar vertical de formulario para autoajuste completo.
      */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full md:w-[980px] h-[95vh] md:h-[610px] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1 shadow-[4px_4px_12px_rgba(0,0,0,0.6)] focus:outline-none flex flex-col justify-between select-none"
        style={{ fontSize: '11px' }}
      >
        {/* Barra de Título */}
        <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center select-none shrink-0 h-6">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">📖</span>
            <span className="text-[11px] tracking-wide">Scorpion - Expediente de Usuario</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-[9px] pb-0.5 cursor-pointer"
          >
            r
          </button>
        </div>

        {/* CONTENEDOR PRINCIPAL INTERNO */}
        <div className="flex-1 p-1 flex flex-col gap-2 overflow-y-auto md:overflow-hidden">
          
          {/* FILA 1: INFORMACIÓN BÁSICA + FOTOGRAFÍA */}
          <div className="h-auto md:h-[195px] flex flex-col md:flex-row gap-2 shrink-0">
            
            {/* Caja Información Básica */}
            <div className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-2.5 relative pt-4 flex flex-col justify-between gap-1.5">
              <div className="absolute -top-2 left-3 bg-[#d4d0c8] px-1 font-bold text-[9px] uppercase tracking-wider text-gray-700">
                INFORMACION BASICA:
              </div>

              {/* LÍNEA 1: Cuenta, RUT y Nombre */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Cuenta:</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={cliente.cuenta || ''} 
                    className="w-full sm:w-[60px] bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1 py-0.5 text-blue-900 focus:outline-none text-[11px]" 
                  />
                </div>

                {/* RUT del Titular / Empresa (Formato 12123123-6) */}
                <div className="flex items-center gap-1">
                  <span className="font-bold text-red-900">RUT:</span>
                  <input 
                    type="text" 
                    readOnly={usuarioRol !== 'Administrador'}
                    value={inputRut} 
                    onChange={(e) => setInputRut(cleanRut(e.target.value))}
                    placeholder="12123123-6"
                    className={`w-full sm:w-[90px] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1 py-0.5 text-[11px] ${
                      usuarioRol === 'Administrador' ? 'bg-white text-black focus:ring-1 focus:ring-blue-600' : 'bg-[#ffffd0] text-blue-900'
                    }`}
                  />
                </div>

                {/* Nombre del Titular */}
                <div className="flex-1 flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Nombre:</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={cliente.nombre || ''} 
                    className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-blue-900 focus:outline-none text-[11px] truncate" 
                  />
                </div>
              </div>

              {/* LÍNEA 2: Alias / Unidad de Monitoreo + Botones Admin */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 flex items-center gap-1">
                  <span className="font-bold text-blue-900 w-[70px] sm:w-auto">Unidad/Alias:</span>
                  <input 
                    type="text" 
                    readOnly={usuarioRol !== 'Administrador'}
                    value={inputAlias} 
                    onChange={(e) => setInputAlias(e.target.value)}
                    placeholder="EJ: CASA SANTO DOMINGO"
                    className={`w-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-[11px] truncate ${
                      usuarioRol === 'Administrador' ? 'bg-white text-black focus:ring-1 focus:ring-blue-600' : 'bg-[#ffffd0] text-blue-900'
                    }`}
                  />
                </div>

                {/* Botón de Guardar RUT / Excel (SOLO ADMINISTRADOR) */}
                {usuarioRol === 'Administrador' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={guardarRutYAlias}
                      className="px-2.5 py-0.5 bg-[#000080] text-white font-bold rounded-sm text-[10px] hover:bg-blue-900 shadow active:translate-y-0.5 cursor-pointer"
                      title="Guardar RUT y Alias de Unidad para esta cuenta"
                    >
                      💾 Guardar
                    </button>
                    <button
                      onClick={() => setMostrarModalExcel(true)}
                      className="px-2.5 py-0.5 bg-[#008080] text-white font-bold rounded-sm text-[10px] hover:bg-teal-900 shadow active:translate-y-0.5 cursor-pointer"
                      title="Importar Excel Maestro de RUTs y Unidades"
                    >
                      📊 Cargar Excel Maestro
                    </button>
                  </div>
                )}
              </div>

              {/* Banner de Otras Unidades con el mismo RUT */}
              {otrasUnidadesRut.length > 0 && (
                <div className="bg-[#e6f2ff] border border-blue-400 px-1.5 py-0.5 flex items-center gap-1.5 text-[10px] text-blue-900 shrink-0">
                  <span className="font-bold shrink-0">🏢 Unidades del mismo RUT ({cleanRut(cliente.rut)}):</span>
                  <div className="flex flex-wrap gap-1 overflow-x-auto">
                    {otrasUnidadesRut.map(u => (
                      <button
                        key={u.cuenta}
                        onClick={() => setCuentaActiva((u.cuenta || '').toUpperCase().trim())}
                        className="bg-blue-700 text-white font-bold px-1.5 py-0.2 rounded-xs text-[9px] hover:bg-blue-900 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        {u.cuenta} - {u.alias_unidad || u.nombre || 'Unidad'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ciudad, Plan y Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Ciudad:</span>
                  <select disabled className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold py-0.5 px-1 text-black text-[11px]">
                    <option>{cliente.ciudad || 'SANTIAGO'}</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Plan:</span>
                  <input type="text" readOnly value={cliente.plan || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1 py-0.5 text-[11px]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Tipo:</span>
                  <input type="text" readOnly value={cliente.tipo1 || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1 py-0.5 text-[11px]" />
                </div>
              </div>

              {/* Dirección y Sector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Dirección:</span>
                  <input type="text" readOnly value={cliente.direccion || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-[11px] truncate" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold w-[45px] sm:w-auto">Sector:</span>
                  <input type="text" readOnly value={cliente.sector || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-[11px] truncate" />
                </div>
              </div>

              {/* Teléfonos del Cliente */}
              <div className="border border-gray-400 p-1 relative bg-[#d4d0c8]">
                <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700">
                  TELEFONOS:
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      readOnly
                      value={cliente[`telefono${i + 1}`] || ''}
                      className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 text-center font-bold text-gray-800 text-[10px]"
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* Caja de Fotografía (Oculta en móviles muy chicos, visible en md) */}
            <div className="hidden sm:flex md:w-[200px] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-1 flex-col justify-between bg-[#d4d0c8] shrink-0 h-[100px] md:h-auto">
              <div className="bg-[#808080] text-white text-center font-bold text-[9px] py-0.5 border border-t-black border-l-black border-b-white border-r-white">
                FOTOGRAFIA
              </div>
              <div className="flex-1 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white my-0.5 flex items-center justify-center min-h-[40px]">
                <span className="text-gray-300 text-2xl">👤</span>
              </div>
              <button disabled className="w-full bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-500 border-r-gray-500 text-[9px] py-0.5 font-bold uppercase tracking-wider text-gray-500">
                Insertar / Cambiar Fotografia
              </button>
            </div>

          </div>

          {/* FILA 2: PESTAÑAS MEDIAS (Emergentes y Características) */}
          <div className="h-auto md:h-[170px] flex flex-col md:flex-row gap-2 shrink-0">
            
            {/* Lado Izquierdo: Teléfonos Emergentes (PC: Ancho 530px, Móvil: Completo) */}
            <div className="w-full md:w-[530px] flex flex-col shrink-0">
              <div className="flex flex-wrap gap-0.5 text-[9px]">
                <button
                  onClick={() => setTabEmergentes('telefonos')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'telefonos' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  TELEFONOS EMERGENTES
                </button>
                <button
                  onClick={() => setTabEmergentes('horarios')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'horarios' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  HORARIOS
                </button>
                <button
                  onClick={() => setTabEmergentes('camara')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'camara' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  CAMARA DE VERIFICACION
                </button>
                <button
                  onClick={() => setTabEmergentes('servicio_tecnico')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'servicio_tecnico' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  🛠️ SERVICIO TECNICO ({ordenesCuenta.length})
                </button>
              </div>
              
              <div className="border-2 border-white bg-[#d4d0c8] p-1 flex-1 flex flex-col justify-start overflow-hidden min-h-[110px] md:min-h-0">
                {tabEmergentes === 'servicio_tecnico' && (
                  <div className="border border-gray-400 p-1 relative flex-1 bg-[#d4d0c8] flex flex-col overflow-hidden">
                    <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700 uppercase">
                      HISTORIAL DE ATENCIONES TECNICAS EN TERRENO
                    </div>
                    <div className="flex-1 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto">
                      <table className="w-full border-collapse text-[10px] text-left">
                        <thead>
                          <tr className="bg-[#b0b0b0] border-b border-gray-400 font-bold sticky top-0 text-[9px]">
                            <th className="p-1 border-r border-gray-400">OT / FECHA</th>
                            <th className="p-1 border-r border-gray-400">TIPO / TÉCNICO</th>
                            <th className="p-1 border-r border-gray-400">FALLA REPORTADA</th>
                            <th className="p-1 border-r border-gray-400">TRABAJO REALIZADO</th>
                            <th className="p-1 text-center">ESTADO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          {ordenesCuenta.map((o, idx) => (
                            <tr key={idx} className="hover:bg-blue-100 font-bold text-gray-800 text-[10px]">
                              <td className="p-1 border-r border-gray-300 font-mono text-blue-900">
                                <div>{o.codigo_ot || `OT-${o.id}`}</div>
                                <div className="text-[8px] text-gray-500">{o.fecha_cita || o.fecha}</div>
                              </td>
                              <td className="p-1 border-r border-gray-300">
                                <div>{o.tipo_visita || 'Correctiva'}</div>
                                <div className="text-[8px] text-gray-500">{o.tecnico}</div>
                              </td>
                              <td className="p-1 border-r border-gray-300 max-w-[120px] truncate" title={o.problema}>{o.problema}</td>
                              <td className="p-1 border-r border-gray-300 italic text-slate-700 max-w-[150px] truncate" title={o.novedad}>{o.novedad || 'En atención'}</td>
                              <td className="p-1 text-center">
                                <span className={`px-1 py-0.2 text-[8px] font-bold rounded-xs ${
                                  o.estado === 'Completada' ? 'bg-green-700 text-white' : 'bg-yellow-600 text-white'
                                }`}>
                                  {o.estado || 'PENDIENTE'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {ordenesCuenta.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-gray-400 italic">No hay órdenes de servicio técnico registradas para este abonado.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {tabEmergentes === 'telefonos' && (
                  <div className="border border-gray-400 p-1 relative flex-1 bg-[#d4d0c8] flex flex-col overflow-hidden">
                    <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700">
                      NUMEROS DE EMERGENCIA
                    </div>
                    <div className="flex-1 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto">
                      <table className="w-full border-collapse text-[10px] text-left">
                        <thead>
                          <tr className="bg-[#b0b0b0] border-b border-gray-400 font-bold sticky top-0">
                            <th className="p-0.5 border-r border-gray-400 w-1/4">Nombre</th>
                            <th className="p-0.5 border-r border-gray-400 w-1/4">Dirección</th>
                            <th className="p-0.5 border-r border-gray-400 w-1/6">Cargo</th>
                            <th className="p-0.5">Teléfono</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          {telefonosEmergencia.map((tel, idx) => (
                            <tr key={idx} className="hover:bg-blue-100 font-bold text-gray-800 h-5">
                              <td className="p-0.5 border-r border-gray-300 truncate max-w-[80px] sm:max-w-[120px]">{tel.nombre}</td>
                              <td className="p-0.5 border-r border-gray-300 truncate max-w-[80px] sm:max-w-[180px]">{tel.direccion}</td>
                              <td className="p-0.5 border-r border-gray-300 truncate max-w-[50px] sm:max-w-[80px]">{tel.cargo}</td>
                              <td className="p-0.5 font-mono text-blue-900 truncate max-w-[80px]">{tel.telefono}</td>
                            </tr>
                          ))}
                          {telefonosEmergencia.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-2 text-center text-gray-400 italic">No hay contactos</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {tabEmergentes === 'horarios' && (
                  <div className="p-2 text-center text-gray-500 font-bold border border-gray-400 flex-1 flex items-center justify-center bg-white text-[10px]">
                    [Horarios de Apertura/Cierre]
                  </div>
                )}

                {tabEmergentes === 'camara' && (
                  <div className="border border-gray-400 bg-black flex-1 flex flex-col overflow-hidden text-white font-mono p-1">
                    
                    {/* Controls Row */}
                    <div className="flex items-center justify-between bg-[#111] p-1 border-b border-gray-700 text-[10px] shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 font-bold">CANAL:</span>
                        {cargandoIA ? (
                          <span className="text-yellow-400 text-[9px]">⏳ Cargando BD-IA...</span>
                        ) : camarasIA.length > 0 ? (
                          <select
                            value={selectedCamaraIAId}
                            onChange={(e) => { setSelectedCamaraIAId(e.target.value); setClipSeleccionado(null) }}
                            className="bg-[#222] text-green-300 border border-green-800 font-bold py-0.5 px-1 focus:outline-none text-[9px]"
                          >
                            {camarasIA.map(c => <option key={c.id} value={c.id}>{c.nombre.toUpperCase()}</option>)}
                          </select>
                        ) : (
                          <select
                            value={activeCamera}
                            disabled={editandoCamaras}
                            onChange={(e) => setActiveCamera(e.target.value as any)}
                            className="bg-[#222] text-white border border-gray-600 font-bold py-0.5 px-1 focus:outline-none text-[9px] disabled:opacity-50"
                          >
                            <option value="CAM-01">CAM-01 (Entrada Frontis)</option>
                            <option value="CAM-02">CAM-02 (Patio Lateral)</option>
                            <option value="CAM-03">CAM-03 (Bodega Interna)</option>
                          </select>
                        )}
                        {camarasIA.length > 0 && <span className="text-green-500 text-[8px] font-bold">● IA REAL</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        {!editandoCamaras && usuarioRol !== 'Operadora' && (
                          <button
                            onClick={() => setEditandoCamaras(true)}
                            className="bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold border border-yellow-400 px-2 py-0.5 rounded cursor-pointer text-[9px] shadow"
                          >
                            ⚙️ CONFIGURAR P2P DAHUA / NVR
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Viewport + Clips Panel */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                      
                      {editandoCamaras ? (
                        <div className="flex-1 bg-[#12141c] p-3 text-xs space-y-3 overflow-y-auto flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="text-yellow-400 font-bold border-b border-gray-800 pb-1 uppercase tracking-wider text-[10px] flex items-center justify-between">
                              <span>⚙️ GESTIÓN CRUD DE CÁMARAS & DVR/NVR DAHUA P2P (CTA: {cuentaActiva})</span>
                              <span className="text-[9px] text-gray-400 font-normal">Soporte nativo SN sin apertura de puertos</span>
                            </div>
                            
                            {/* Formulario CRUD */}
                            <div className="bg-black/50 border border-gray-800 p-2 rounded grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                              <div>
                                <label className="text-gray-300 font-bold block mb-0.5">Nombre/Ubicación:</label>
                                <input
                                  type="text"
                                  value={inputDahuaNombre}
                                  onChange={(e) => setInputDahuaNombre(e.target.value)}
                                  placeholder="Ej: ENTRADA PRINCIPAL"
                                  className="w-full bg-[#111] border border-gray-700 p-1 font-mono text-white text-[10px]"
                                />
                              </div>

                              <div>
                                <label className="text-yellow-400 font-bold block mb-0.5">Número de Serie (SN):</label>
                                <input
                                  type="text"
                                  value={inputDahuaSN}
                                  onChange={(e) => setInputDahuaSN(e.target.value.toUpperCase())}
                                  placeholder="Ej: AE0970BPAG00815"
                                  className="w-full bg-[#111] border border-yellow-600/70 p-1 font-mono text-yellow-300 font-bold text-[10px] uppercase"
                                />
                              </div>

                              <div>
                                <label className="text-gray-300 font-bold block mb-0.5">Usuario (admin):</label>
                                <input
                                  type="text"
                                  value={inputDahuaUser}
                                  onChange={(e) => setInputDahuaUser(e.target.value)}
                                  className="w-full bg-[#111] border border-gray-700 p-1 font-mono text-white text-[10px]"
                                />
                              </div>

                              <div>
                                <label className="text-gray-300 font-bold block mb-0.5">Contraseña (L2D55413):</label>
                                <input
                                  type="password"
                                  value={inputDahuaPass}
                                  onChange={(e) => setInputDahuaPass(e.target.value)}
                                  className="w-full bg-[#111] border border-gray-700 p-1 font-mono text-white text-[10px]"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-gray-400 italic">Equipos Dahua P2P registrados en esta cuenta:</span>
                              <button
                                onClick={guardarCamaraDahuaP2P}
                                className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-3 py-1 text-[10px] rounded cursor-pointer transition shadow"
                              >
                                {editingDahuaId ? '✏️ ACTUALIZAR CÁMARA' : '➕ GUARDAR CÁMARA P2P'}
                              </button>
                            </div>

                            {/* Tabla/Lista CRUD */}
                            <div className="space-y-1 pt-1 max-h-[140px] overflow-y-auto">
                              {dahuaCams.map((c) => (
                                <div key={c.id} className="bg-black/40 border border-gray-800 p-1.5 rounded flex items-center justify-between text-[10px]">
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="text-white font-bold">{c.nombre}</span>
                                    <span className="text-yellow-400">SN: {c.serialNumber}</span>
                                    <span className="text-gray-400">CH-{c.canal}</span>
                                    <span className="text-gray-500">User: {c.usuario}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingDahuaId(c.id)
                                        setInputDahuaNombre(c.nombre)
                                        setInputDahuaSN(c.serialNumber)
                                        setInputDahuaUser(c.usuario)
                                        setInputDahuaPass(c.password || '')
                                        setInputDahuaCanal(c.canal.toString())
                                      }}
                                      className="bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-700 px-2 py-0.5 rounded text-[9px]"
                                    >
                                      ✏️ Editar
                                    </button>
                                    <button
                                      onClick={() => eliminarCamaraDahuaP2P(c.id)}
                                      className="bg-red-950 text-red-300 hover:bg-red-900 border border-red-700 px-2 py-0.5 rounded text-[9px]"
                                    >
                                      🗑️ Eliminar
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {dahuaCams.length === 0 && (
                                <div className="text-[10px] text-gray-500 italic p-2 text-center">No hay cámaras Dahua P2P registradas para esta cuenta.</div>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 border-t border-gray-800 pt-2 shrink-0">
                            <button onClick={() => setEditandoCamaras(false)} className="bg-gray-800 hover:bg-gray-700 text-white font-bold border border-gray-600 px-4 py-1 text-[10px] cursor-pointer">CERRAR CONFIGURACIÓN</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Video Player Box */}
                          <div className="relative flex-1 bg-[#050505] overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-800 min-h-[120px] md:min-h-0">
                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] z-10" />

                            {/* Renderizado del feed: clip IA > url manual > imagen demo */}
                            {(() => {
                              // Prioridad 1: Clip seleccionado de BD IA
                              if (clipSeleccionado) {
                                return (
                                  <video
                                    key={clipSeleccionado}
                                    src={`https://usuzyqayiecsburbsipl.supabase.co/storage/v1/object/public/clips/${clipSeleccionado}`}
                                    autoPlay
                                    controls
                                    playsInline
                                    className="w-full h-full object-contain bg-black"
                                  />
                                )
                              }
                              // Prioridad 2: URL manual configurada
                              const url = activeCamera === 'CAM-01' ? camarasActivas.cam01 : activeCamera === 'CAM-02' ? camarasActivas.cam02 : camarasActivas.cam03
                              if (url) {
                                const lowerUrl = url.toLowerCase()
                                const isVideo = lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg')
                                const isImage = lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.png') || lowerUrl.includes('.webp')
                                if (isVideo) return <video src={url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                if (isImage) return <img src={url} alt="feed" className="w-full h-full object-cover" />
                                return <iframe src={url} title="cam" className="w-full h-full border-0 bg-black" allow="autoplay" allowFullScreen />
                              }
                              // Prioridad 3: Demo simulado
                              return (
                                <>
                                  <img
                                    src={activeCamera === 'CAM-01' ? '/cctv_intruder.png' : '/cctv_false_alarm.png'}
                                    alt="Demo"
                                    className={`w-full h-full object-cover select-none ${
                                      activeCamera === 'CAM-03' ? 'grayscale hue-rotate-90 brightness-75' :
                                      activeCamera === 'CAM-02' ? 'hue-rotate-180 brightness-90' : 'brightness-90'
                                    }`}
                                  />
                                  <div className="absolute bottom-1 left-1.5 bg-yellow-700/90 text-white text-[7px] px-1 py-0.5 rounded font-bold z-20">
                                    ⚠️ SIM — Sin cámaras IA vinculadas
                                  </div>
                                </>
                              )
                            })()}

                            {/* HUD */}
                            {!clipSeleccionado && (
                              <div className="absolute top-1 left-1.5 flex items-center gap-1 bg-black/60 px-1 py-0.5 rounded text-[8px] tracking-wider z-20">
                                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                                <span>{camarasIA.length > 0 ? (camarasIA.find(c => c.id === selectedCamaraIAId)?.nombre || 'CAM-IA') : activeCamera}</span>
                              </div>
                            )}
                            {clipSeleccionado && (
                              <div className="absolute top-1 left-1.5 flex items-center gap-1 bg-blue-900/80 px-1 py-0.5 rounded text-[8px] tracking-wider z-20">
                                <span>📦 CLIP IA</span>
                                <button onClick={() => setClipSeleccionado(null)} className="ml-1 text-red-400 font-bold cursor-pointer">✕</button>
                              </div>
                            )}
                            <div className="absolute top-1 right-1.5 bg-black/60 px-1 py-0.5 rounded text-[8px] z-20">
                              {new Date().toISOString().slice(0, 19).replace('T', ' ')}
                            </div>
                          </div>

                          {/* Panel lateral: Clips IA */}
                          {camarasIA.length > 0 && (
                            <div className="w-full md:w-[140px] bg-[#0a0c14] border-t md:border-t-0 md:border-l border-gray-800 flex flex-col shrink-0">
                              <div className="text-[8px] font-bold text-blue-400 px-1.5 py-1 border-b border-gray-800 uppercase tracking-wider">📦 Clips IA ({clipsIA.length})</div>
                              <div className="flex-1 overflow-y-auto">
                                {clipsIA.length === 0 ? (
                                  <div className="text-[8px] text-gray-600 p-2 text-center italic">Sin clips grabados aún</div>
                                ) : clipsIA.map((clip) => (
                                  <button
                                    key={clip.id}
                                    onClick={() => setClipSeleccionado(clip.clip_path)}
                                    className={`w-full text-left px-1.5 py-1 border-b border-gray-900 cursor-pointer text-[8px] hover:bg-blue-900/40 ${
                                      clipSeleccionado === clip.clip_path ? 'bg-blue-800/60 text-white' : 'text-gray-400'
                                    }`}
                                  >
                                    <div className="font-bold text-blue-300 truncate">{clip.clip_path?.split('/').pop() || 'clip'}</div>
                                    <div className="text-gray-600">{clip.fecha_hora ? new Date(clip.fecha_hora).toLocaleString('es-CL') : ''}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lado Derecho: Características (PC: Lado Derecho, Móvil: Abajo) */}
            <div className="flex-1 flex flex-col shrink-0">
              <div className="flex gap-0.5 text-[9px]">
                <button
                  onClick={() => setTabInfo('caracteristicas')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'caracteristicas' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  CARACTERISTICAS
                </button>
                <button
                  onClick={() => setTabInfo('referencias')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'referencias' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  REFERENCIAS
                </button>
                <button
                  onClick={() => setTabInfo('observaciones')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'observaciones' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  OBSERVACIONES
                </button>
              </div>

              <div className="border-2 border-white bg-[#d4d0c8] p-1 flex-1 flex flex-col justify-start overflow-hidden min-h-[90px] md:min-h-0">
                <div className="border border-gray-400 p-1 relative flex-1 flex flex-col bg-[#d4d0c8]">
                  <div className="absolute -top-2.5 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700 uppercase">
                    {tabInfo}
                  </div>
                  <textarea
                    readOnly
                    value={
                      tabInfo === 'caracteristicas' ? (cliente.caract_adic1 || 'Sin características') :
                      tabInfo === 'referencias' ? (cliente.referencia1 || 'Sin referencias') :
                      (cliente.observacion1 || 'Sin observaciones')
                    }
                    className="w-full flex-1 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white p-1.5 font-bold font-mono text-[10px] text-gray-800 resize-none focus:outline-none leading-normal h-full overflow-y-auto"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* FILA 3: INSTALACIÓN + BUSCADOR + SALIR */}
          <div className="h-auto md:h-[140px] flex flex-col md:flex-row gap-2 shrink-0">
            
            {/* Instalación / U. Control (PC: Ancho 400px, Móvil: Completo) */}
            <div className="w-full md:w-[400px] flex flex-col shrink-0">
              <div className="flex gap-0.5 text-[9px]">
                <button
                  onClick={() => setTabInstalacion('instalacion')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'instalacion' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  INSTALACION
                </button>
                <button
                  onClick={() => setTabInstalacion('ucontrol')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'ucontrol' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  U. CONTROL
                </button>
              </div>
              <div className="border border-white bg-[#d4d0c8] p-2 flex-1 flex flex-col justify-center gap-1.5 min-h-[60px] md:min-h-0">
                {tabInstalacion === 'instalacion' && (
                  <div className="space-y-1.5 text-[10px]">
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Instalación:</span>
                      <input type="text" readOnly value={cliente.fecha || ''} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Instalador:</span>
                      <input type="text" readOnly value={cliente.instalador || ''} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800 truncate" />
                    </div>
                  </div>
                )}

                {tabInstalacion === 'ucontrol' && (
                  <div className="space-y-1.5 text-[10px]">
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Marca/Mod:</span>
                      <input type="text" readOnly value={`${cliente.marca || ''} ${cliente.modelo || ''}`} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Ubicación UC:</span>
                      <input type="text" readOnly value={cliente.ubicacion_uc || ''} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800 truncate" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BUSCADOR DE USUARIO (Ancho restante) */}
            <div className="flex-1 border border-gray-400 p-2 relative bg-[#d4d0c8] flex flex-col gap-1 shrink-0 min-h-[120px] md:min-h-0">
              <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[9px] font-bold text-gray-700">
                BUSCAR USUARIO
              </div>
              
              <div className="grid grid-cols-4 gap-1 items-center mt-0.5">
                <span className="font-bold text-gray-700">CUENTA:</span>
                <input
                  type="text"
                  value={buscarCuentaInput}
                  onChange={(e) => setBuscarCuentaInput(e.target.value)}
                  className="col-span-3 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-black"
                  placeholder="Filtro de búsqueda..."
                />
              </div>

              {/* Lista azul marino (Scroll y altura adaptable) */}
              <div className="h-[75px] md:h-[75px] bg-[#000080] text-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto text-[10px]">
                {listaFiltrada.map((item) => (
                  <div
                    key={item.cuenta}
                    onClick={() => {
                      setCuentaActiva(item.cuenta.toUpperCase().trim())
                      setBuscarCuentaInput('')
                    }}
                    className={`px-1.5 py-0.5 cursor-pointer font-mono font-bold select-none ${
                      cuentaActiva === item.cuenta ? 'bg-yellow-500 text-black' : 'hover:bg-blue-900'
                    }`}
                  >
                    {item.cuenta.padEnd(6, ' ')} | {item.nombre}
                  </div>
                ))}
                {listaFiltrada.length === 0 && (
                  <div className="p-2 text-center text-blue-300 italic">No hay coincidencias</div>
                )}
              </div>
            </div>

            {/* BOTÓN SALIR (PC: 110px, Móvil: Completo) */}
            <div className="w-full md:w-[110px] flex flex-col justify-end shrink-0 h-10 md:h-full">
              <button 
                onClick={onClose}
                className="w-full h-8 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-800 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200 text-[11px]"
              >
                SALIR
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* MODAL IMPORTAR EXCEL MAESTRO (SOLO ADMINISTRADOR) */}
      {mostrarModalExcel && usuarioRol === 'Administrador' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
          <div className="w-full max-w-[650px] bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-black border-r-black p-3 flex flex-col gap-2 font-mono text-[11px] shadow-2xl">
            <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center">
              <span>📊 Importación Masiva - Excel Maestro de RUTs y Unidades</span>
              <button onClick={() => setMostrarModalExcel(false)} className="text-white font-bold cursor-pointer">✕</button>
            </div>

            <div className="bg-[#ffffd0] p-2 border border-gray-500 text-gray-800 text-[10px]">
              <strong>Instrucciones:</strong> Copia y pega las filas desde tu archivo Excel o CSV (o descarga la plantilla oficial abajo).<br/>
              Orden estricto de columnas: <code>[N° ABONADO | NOMBRE | RUT | SUCURSAL]</code>.<br/>
              <em>El RUT se formateará automáticamente al formato <code>12123123-6</code> (sin puntos, con guión).</em>
            </div>

            <textarea
              value={excelTextRaw}
              onChange={(e) => setExcelTextRaw(e.target.value)}
              placeholder={"C774\tMARIA CECILIA ACUÑA\t12123123-6\tCASA SANTO DOMINGO\nC775\tCOMERCIAL GAMA LTDA\t76123456-K\tLOCAL CENTRO"}
              className="w-full h-[180px] bg-white border border-gray-600 p-2 text-[10px] font-mono focus:outline-none"
            />

            <div className="flex justify-between items-center gap-2 shrink-0 pt-1">
              <button
                onClick={descargarPlantillaExcel}
                className="px-3 py-1 bg-green-700 text-white font-bold rounded-sm text-[10px] hover:bg-green-800 shadow active:translate-y-0.5 cursor-pointer flex items-center gap-1"
                title="Descargar archivo CSV/Excel de muestra oficial"
              >
                <span>📥 Descargar Plantilla Excel</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  disabled={cargandoExcel}
                  onClick={() => setMostrarModalExcel(false)}
                  className="px-3 py-1 bg-gray-300 border border-gray-600 font-bold hover:bg-gray-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  disabled={cargandoExcel}
                  onClick={procesarCargaMasivaExcel}
                  className="px-4 py-1 bg-[#008080] text-white font-bold hover:bg-teal-900 shadow active:translate-y-0.5 cursor-pointer"
                >
                  {cargandoExcel ? '⏳ Procesando...' : '🚀 Cargar Maestro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
