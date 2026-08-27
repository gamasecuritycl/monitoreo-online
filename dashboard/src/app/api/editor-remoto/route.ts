import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjI4MzgsImV4cCI6MjA1NTg5ODgzOH0.29Jk8UeNqgC7fO-O3yD7nSOfKkI-gC2cK-_7h0U3s70'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      cuenta,
      tipoOperacion = 'EDITAR_CONTACTOS',
      datosNuevos,
      datosAnteriores,
      operador = { nombre: 'OPERADOR CENTRAL', codigo: '01', rol: 'Administrador' }
    } = body

    if (!cuenta || !datosNuevos) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos (cuenta, datosNuevos).' },
        { status: 400 }
      )
    }

    const cuentaNormalizada = cuenta.toUpperCase().trim()
    const nowIso = new Date().toISOString()

    // 1. Encolar orden en 'ordenes_editor_remoto' (con fallback a 'eventos_monitoreo')
    let ordenId = `ORD-${Date.now()}`
    try {
      const { data, error } = await supabase
        .from('ordenes_editor_remoto')
        .insert({
          operador_nombre: operador.nombre || 'OPERADOR',
          operador_codigo: operador.codigo || '01',
          tipo_operacion: tipoOperacion,
          cuenta: cuentaNormalizada,
          tabla_destino: 'GENERAL.MDB',
          datos_nuevos: datosNuevos,
          datos_anteriores: datosAnteriores || null,
          estado: 'PENDIENTE'
        })
        .select('id')
        .single()

      if (!error && data?.id) {
        ordenId = data.id
      }
    } catch (errCola) {
      console.warn('[EDITOR REMOTO] Usando fallback eventos_monitoreo para encolar orden:', errCola)
      await supabase.from('eventos_monitoreo').insert({
        cuenta: 'ORDEN_EDITOR_REMOTO',
        evento: tipoOperacion,
        nombre_abonado: JSON.stringify({
          ordenId,
          cuenta: cuentaNormalizada,
          operador,
          datosNuevos,
          datosAnteriores,
          estado: 'PENDIENTE',
          creado_el: nowIso
        }),
        fecha_hora: nowIso
      })
    }

    // 2. Actualizar el mapa maestro de CLIENTES en Supabase en caliente para persistencia y reflejo instantáneo
    try {
      const { data: clientesData } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .eq('cuenta', 'CLIENTES')
        .order('id', { ascending: false })
        .limit(1)

      let clientesMap: Record<string, any> = {}

      if (clientesData && clientesData.length > 0) {
        try {
          clientesMap = JSON.parse(clientesData[0].nombre_abonado || '{}')
        } catch (e) {
          clientesMap = {}
        }

        // Fusionar campos editados de la cuenta
        clientesMap[cuentaNormalizada] = {
          ...(clientesMap[cuentaNormalizada] || {}),
          ...datosNuevos,
          cuenta: cuentaNormalizada,
          _actualizadoRemotoEl: nowIso,
          _actualizadoPor: operador.nombre
        }

        await supabase
          .from('eventos_monitoreo')
          .update({
            nombre_abonado: JSON.stringify(clientesMap),
            fecha_hora: nowIso
          })
          .eq('id', clientesData[0].id)
      } else {
        // No existía fila CLIENTES, crearla
        clientesMap[cuentaNormalizada] = {
          ...datosNuevos,
          cuenta: cuentaNormalizada,
          _actualizadoRemotoEl: nowIso,
          _actualizadoPor: operador.nombre
        }

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

    // 3. Registrar auditoría en Bitácora Operativa
    try {
      await supabase.from('eventos_monitoreo').insert({
        cuenta: cuentaNormalizada,
        evento: `EDITOR REMOTO: ${tipoOperacion.replace(/_/g, ' ')}`,
        nombre_abonado: `Modificado por ${operador.nombre} (${operador.rol || 'Operador'}). ${Object.keys(datosNuevos).length} campos actualizados.`,
        fecha_hora: nowIso,
        zona: 'SYS',
        usuario: operador.codigo || '01'
      })
    } catch (errBitacora) {
      console.warn('[EDITOR REMOTO] Error registrando bitacora:', errBitacora)
    }

    return NextResponse.json({
      success: true,
      ordenId,
      cuenta: cuentaNormalizada,
      mensaje: 'Orden de edición procesada, guardada en base de datos y lista para sincronización local.'
    })
  } catch (error: any) {
    console.error('[EDITOR REMOTO API ERROR]:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error procesando edición remota' },
      { status: 500 }
    )
  }
}
