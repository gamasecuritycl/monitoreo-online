import { supabase } from './supabase'

export interface ConfigMailAbonado {
  cuenta: string
  emails: string[]
  reporteAutomatico: boolean
  frecuencia: 'diario' | 'semanal' | 'mensual'
  filtroEventos: string
  ultimoEnvio?: string | null
  copiaGama: boolean
  emailGama: string
}

export const CORREOS_GAMA_PREDEFINIDOS = [
  { email: 'contacto@gamasecurity.cl', etiqueta: 'contacto@gamasecurity.cl (Central Oficial)' },
  { email: 'tetoromoreno@gamasecurity.cl', etiqueta: 'tetoromoreno@gamasecurity.cl (Administración)' },
  { email: 'soporte@gamasecurity.cl', etiqueta: 'soporte@gamasecurity.cl (Soporte Técnico)' },
  { email: 'ecarrasco@gamasecurity.cl', etiqueta: 'ecarrasco@gamasecurity.cl (Operaciones)' },
]

const DEFAULT_CONFIG: Omit<ConfigMailAbonado, 'cuenta' | 'emails'> = {
  reporteAutomatico: false, // Por defecto siempre desmarcado como solicitó el usuario
  frecuencia: 'mensual',
  filtroEventos: 'TODAS',
  ultimoEnvio: null,
  copiaGama: false,
  emailGama: 'contacto@gamasecurity.cl'
}

/**
 * Obtiene la lista de correos y la configuración de reportes de un abonado
 * desde la única fuente de verdad en Supabase (public.notificaciones_mail).
 */
export async function obtenerConfigMail(cuenta: string): Promise<ConfigMailAbonado> {
  const cta = (cuenta || '').toUpperCase().trim()
  if (!cta) {
    return { cuenta: '', emails: [], ...DEFAULT_CONFIG }
  }

  try {
    const { data, error } = await supabase
      .from('notificaciones_mail')
      .select('cuenta, emails')
      .eq('cuenta', cta)
      .maybeSingle()

    if (error || !data) {
      return { cuenta: cta, emails: [], ...DEFAULT_CONFIG }
    }

    const rawList: string[] = Array.isArray(data.emails) ? data.emails : []
    const emails = rawList.filter(e => typeof e === 'string' && !e.startsWith('__cfg:'))
    const cfgEntry = rawList.find(e => typeof e === 'string' && e.startsWith('__cfg:'))

    let cfg = { ...DEFAULT_CONFIG }
    if (cfgEntry) {
      try {
        const parsed = JSON.parse(cfgEntry.replace('__cfg:', ''))
        cfg = {
          reporteAutomatico: Boolean(parsed.auto),
          frecuencia: (['diario', 'semanal', 'mensual'].includes(parsed.frecuencia) ? parsed.frecuencia : 'mensual') as any,
          filtroEventos: parsed.filtro || 'TODAS',
          ultimoEnvio: parsed.ultimoEnvio || null,
          copiaGama: Boolean(parsed.copiaGama),
          emailGama: parsed.emailGama || 'contacto@gamasecurity.cl'
        }
      } catch (err) {
        console.error('Error parseando configuración de correo para cuenta', cta, err)
      }
    }

    return {
      cuenta: cta,
      emails,
      ...cfg
    }
  } catch (e: any) {
    console.error('Error obteniendo config de correo:', e)
    return { cuenta: cta, emails: [], ...DEFAULT_CONFIG }
  }
}

/**
 * Guarda los correos y la configuración de reportes de un abonado en Supabase (notificaciones_mail).
 * Si se modifica en cualquier pantalla (Reportes, Ficha 360°, Notificaciones), queda sincronizado para todas.
 */
export async function guardarConfigMail(
  cuenta: string,
  emails?: string[],
  configParcial?: Partial<Omit<ConfigMailAbonado, 'cuenta' | 'emails'>>
): Promise<{ success: boolean; error?: string }> {
  const cta = (cuenta || '').toUpperCase().trim()
  if (!cta) return { success: false, error: 'Cuenta no especificada' }

  try {
    // 1. Obtener la config actual para no sobreescribir campos existentes si no vienen en parcial
    const actual = await obtenerConfigMail(cta)

    const nuevoReporteAuto = configParcial?.reporteAutomatico !== undefined
      ? configParcial.reporteAutomatico
      : actual.reporteAutomatico

    const nuevaFrecuencia = configParcial?.frecuencia || actual.frecuencia || 'mensual'
    const nuevoFiltro = configParcial?.filtroEventos || actual.filtroEventos || 'TODAS'
    const ultimoEnvio = configParcial?.ultimoEnvio !== undefined ? configParcial.ultimoEnvio : actual.ultimoEnvio
    const nuevoCopiaGama = configParcial?.copiaGama !== undefined ? configParcial.copiaGama : actual.copiaGama
    const nuevoEmailGama = configParcial?.emailGama || actual.emailGama || 'contacto@gamasecurity.cl'

    // Si no se pasaron emails específicos, preservar estrictamente los existentes
    const baseEmails = emails !== undefined ? emails : actual.emails

    const cleanEmails = Array.from(new Set(
      baseEmails
        .map(e => e.trim().toLowerCase())
        .filter(e => e.includes('@') && !e.startsWith('__cfg:'))
    ))

    const cfgObj = {
      auto: nuevoReporteAuto,
      frecuencia: nuevaFrecuencia,
      filtro: nuevoFiltro,
      ultimoEnvio,
      copiaGama: nuevoCopiaGama,
      emailGama: nuevoEmailGama
    }

    const payloadEmails = [...cleanEmails, `__cfg:${JSON.stringify(cfgObj)}`]

    const { error } = await supabase
      .from('notificaciones_mail')
      .upsert({ cuenta: cta, emails: payloadEmails }, { onConflict: 'cuenta' })

    if (error) throw error

    return { success: true }
  } catch (err: any) {
    console.error('Error guardando configuración de correo en Supabase:', err)
    return { success: false, error: err.message || 'Error al guardar' }
  }
}

/**
 * Despacha un reporte histórico oficial por correo electrónico a través de la API de Resend
 */
export async function enviarReporteHistoricoMail(params: {
  cuenta: string
  nombreCliente: string
  fechaDesde: string
  horaDesde?: string
  fechaHasta: string
  horaHasta?: string
  destinatarios: string[]
  totalEventos: number
  eventos: any[]
  frecuencia?: string
  attachments?: Array<{ filename: string; content: string }>
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/enviar-mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cuenta: params.cuenta,
        nombre_cliente: params.nombreCliente,
        tipo_evento: 'REPORTE_HISTORICO',
        fecha_hora: new Date().toISOString(),
        destinatarios: params.destinatarios,
        attachments: params.attachments,
        reporte_data: {
          fechaDesde: params.fechaDesde,
          horaDesde: params.horaDesde || '00:00',
          fechaHasta: params.fechaHasta,
          horaHasta: params.horaHasta || '23:59',
          totalEventos: params.totalEventos,
          frecuencia: params.frecuencia || 'manual',
          eventos: (params.eventos || []).slice(0, 50) // Muestra de hasta 50 eventos en tabla HTML
        }
      })
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      return { success: false, error: data.error || 'Error al enviar reporte' }
    }

    // Actualizar solo último envío en la base de datos SIN modificar ni borrar los correos del abonado
    await guardarConfigMail(params.cuenta, undefined, {
      ultimoEnvio: new Date().toISOString()
    })

    return { success: true }
  } catch (err: any) {
    console.error('Error al enviar reporte por email:', err)
    return { success: false, error: err.message || 'Error de conexión' }
  }
}
