import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      cuenta,
      tipoOperacion = 'EDITAR_GENERAL',
      datosNuevos = {},
      datosAnteriores,
      operador = { nombre: 'OPERADOR CENTRAL', codigo: '01', rol: 'Administrador' }
    } = body

    if (!cuenta) {
      return NextResponse.json(
        { success: false, error: 'Falta el parámetro requerido cuenta.' },
        { status: 400 }
      )
    }

    const cuentaNormalizada = cuenta.toUpperCase().trim()
    const nowIso = new Date().toISOString()
    const ordenId = `ORD-${Date.now()}`

    // 1. Encolar orden en 'eventos_monitoreo' (Canal universal y 100% nativo de Supabase)
    const payloadOrden = {
      ordenId,
      cuenta: cuentaNormalizada,
      operador,
      tipoOperacion,
      datosNuevos,
      datosAnteriores: datosAnteriores || null,
      estado: 'PENDIENTE',
      creado_el: nowIso
    }

    try {
      await supabase.from('eventos_monitoreo').insert({
        cuenta: 'ORDEN_EDITOR_REMOTO',
        evento: tipoOperacion,
        nombre_abonado: JSON.stringify(payloadOrden),
        fecha_hora: nowIso,
        zona: 'SYS',
        usuario: operador.codigo || '01'
      })
    } catch (errCola) {
      console.error('[EDITOR REMOTO] Error encolando orden en eventos_monitoreo:', errCola)
    }

    let clientesMap: Record<string, any> = {}

    // 2. Actualizar el mapa maestro de CLIENTES en Supabase en caliente
    try {
      const { data: clientesData } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .eq('cuenta', 'CLIENTES')
        .order('id', { ascending: false })
        .limit(1)

      if (clientesData && clientesData.length > 0) {
        try {
          clientesMap = JSON.parse(clientesData[0].nombre_abonado || '{}')
        } catch (e) {
          clientesMap = {}
        }
      }

      if (tipoOperacion === 'ELIMINAR_ABONADO') {
        // Eliminar del mapa
        delete clientesMap[cuentaNormalizada]
      } else if (tipoOperacion === 'NUEVO_ABONADO') {
        // Sobrescritura completa desde cero (sin arrastrar teléfonos o campos del cliente antiguo)
        clientesMap[cuentaNormalizada] = {
          ...datosNuevos,
          cuenta: cuentaNormalizada,
          _actualizadoRemotoEl: nowIso,
          _actualizadoPor: operador.nombre
        }
      } else {
        // Fusionar o actualizar campos editados
        clientesMap[cuentaNormalizada] = {
          ...(clientesMap[cuentaNormalizada] || {}),
          ...datosNuevos,
          cuenta: cuentaNormalizada,
          _actualizadoRemotoEl: nowIso,
          _actualizadoPor: operador.nombre
        }
      }

      if (clientesData && clientesData.length > 0) {
        await supabase
          .from('eventos_monitoreo')
          .update({
            nombre_abonado: JSON.stringify(clientesMap),
            fecha_hora: nowIso
          })
          .eq('id', clientesData[0].id)
      } else {
        await supabase
          .from('eventos_monitoreo')
          .insert({
            cuenta: 'CLIENTES',
            evento: 'SINCRONIZACION CLIENTES MDB',
            nombre_abonado: JSON.stringify(clientesMap),
            fecha_hora: nowIso
          })
      }
    } catch (errClientes) {
      console.warn('[EDITOR REMOTO] Error actualizando cache de CLIENTES en Supabase:', errClientes)
    }

    // 3. Registrar auditoría detallada en AUDITORIA_EDITOR_REMOTO (para el modal Registro de Cambios)
    try {
      const cambios: { campo: string; valorAnterior: string; valorNuevo: string }[] = []
      const ant = datosAnteriores || (clientesMap ? clientesMap[cuentaNormalizada] : {}) || {}

      for (const [k, v] of Object.entries(datosNuevos)) {
        if (k.startsWith('_')) continue
        const valAnt = ant[k] !== undefined ? String(ant[k]) : ''
        const valNuev = String(v ?? '')
        if (valAnt !== valNuev) {
          cambios.push({
            campo: k,
            valorAnterior: valAnt,
            valorNuevo: valNuev
          })
        }
      }

      const payloadAuditoria = {
        ordenId,
        cuenta: cuentaNormalizada,
        operador,
        tipoOperacion,
        cambios,
        datosNuevos,
        datosAnteriores: ant,
        creado_el: nowIso,
        resumen: tipoOperacion === 'NUEVO_ABONADO'
          ? `Alta de Abonado ${cuentaNormalizada} por ${operador.nombre}`
          : tipoOperacion === 'ELIMINAR_ABONADO'
          ? `Baja de Abonado ${cuentaNormalizada} por ${operador.nombre}`
          : `Modificación de ${cambios.length} campo(s) en ${cuentaNormalizada} por ${operador.nombre}`
      }

      await supabase.from('eventos_monitoreo').insert({
        cuenta: 'AUDITORIA_EDITOR_REMOTO',
        evento: 'REGISTRO_CAMBIO',
        nombre_abonado: JSON.stringify(payloadAuditoria),
        fecha_hora: nowIso,
        zona: 'SYS',
        usuario: operador.codigo || '01'
      })
    } catch (errBitacora) {
      console.warn('[EDITOR REMOTO] Error registrando auditoría:', errBitacora)
    }

    return NextResponse.json({
      success: true,
      ordenId,
      cuenta: cuentaNormalizada,
      tipoOperacion,
      mensaje: `Operación ${tipoOperacion} procesada y guardada exitosamente en Supabase.`
    })
  } catch (error: any) {
    console.error('[EDITOR REMOTO API ERROR]:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error procesando edición remota' },
      { status: 500 }
    )
  }
}
