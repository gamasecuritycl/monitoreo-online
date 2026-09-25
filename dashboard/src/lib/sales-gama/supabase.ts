import { supabase } from '../supabase';
import type { Lead, LeadMessage, Config, PreciosData, BotConfig, ListLeadsResponse, LeadFilters, PaginationParams } from './types';

export const supabaseAdmin = supabase;

export async function upsertLead(sessionId: string, partialLead: Partial<Lead>): Promise<Lead | null> {
  const now = new Date().toISOString();
  const payload: Partial<Lead> = {
    session_id: sessionId,
    ...partialLead,
    updated_at: now,
    last_activity: now,
    created_at: partialLead.created_at || now,
  };

  let savedLead: Lead | null = null;

  // 1. Guardar exclusivamente en la tabla especializada leads_sales_gama
  // NUNCA escribir en eventos_monitoreo (reservada 100% para alarmas reales de la central)
  try {
    const { data, error } = await supabaseAdmin
      .from('leads_sales_gama')
      .upsert(payload, { onConflict: 'session_id' })
      .select()
      .single();

    if (!error && data) {
      savedLead = data as Lead;
    }
  } catch (err) {
    console.warn('Upsert leads_sales_gama notice:', err);
  }

  if (savedLead) return savedLead;

  // Objeto sintético en memoria si hay retraso de red
  return {
    id: `lead-${sessionId}`,
    session_id: sessionId,
    nombre: partialLead.nombre || 'Prospecto Web Bot',
    telefono: partialLead.telefono,
    email: partialLead.email,
    comuna: partialLead.comuna,
    direccion: partialLead.direccion,
    estado: partialLead.estado || 'nuevo',
    resumen: partialLead.resumen,
    created_at: payload.created_at || now,
    updated_at: now,
    last_activity: now,
  } as Lead;
}

export async function appendMessage(
  leadId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  tokensIn?: number,
  tokensOut?: number,
  metadata?: Record<string, unknown>
): Promise<LeadMessage | null> {
  const payload = {
    lead_id: leadId,
    role,
    content,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    metadata: metadata || {},
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('lead_messages')
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      await supabaseAdmin
        .from('leads_sales_gama')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', leadId);
      return data as LeadMessage;
    }
  } catch {}

  // Fail-safe synthetic message object
  return {
    id: Date.now(),
    lead_id: leadId,
    role,
    content,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  } as LeadMessage;
}

export async function getLeadBySession(sessionId: string): Promise<Lead | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads_sales_gama')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!error && data) {
      return data as Lead;
    }
  } catch {}

  return null;
}

export async function getLeadWithMessages(leadId: string): Promise<{ lead: Lead; messages: LeadMessage[] } | null> {
  try {
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads_sales_gama')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!leadError && lead) {
      const { data: messages } = await supabaseAdmin
        .from('lead_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      return {
        lead: lead as Lead,
        messages: (messages || []) as LeadMessage[],
      };
    }
  } catch {}

  return null;
}

export async function updateLeadStatus(leadId: string, estado: 'nuevo' | 'caliente' | 'cerrado' | 'derivado'): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('leads_sales_gama')
      .update({ estado, last_activity: new Date().toISOString() })
      .eq('id', leadId);
    return !error;
  } catch {
    return false;
  }
}

export async function listLeads(
  filters: LeadFilters = {},
  pagination: PaginationParams = {}
): Promise<ListLeadsResponse> {
  const { cursor, limit = 50 } = pagination;
  const safeLimit = Math.min(limit, 100);

  try {
    let query = supabaseAdmin
      .from('leads_sales_gama')
      .select('*', { count: 'exact' })
      .order('last_activity', { ascending: false })
      .limit(safeLimit + 1);

    if (filters.estado) query = query.eq('estado', filters.estado);
    if (filters.comuna) query = query.ilike('comuna', `%${filters.comuna}%`);
    if (filters.search) {
      query = query.or(`nombre.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telefono.ilike.%${filters.search}%`);
    }
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);
    if (cursor) query = query.lt('last_activity', cursor);

    const { data, count, error } = await query;
    if (!error && data && data.length > 0) {
      let nextCursor: string | undefined;
      const items = [...data] as Lead[];
      if (items.length > safeLimit) {
        const nextItem = items[safeLimit - 1];
        nextCursor = nextItem.last_activity;
        items.pop();
      }
      return {
        items: items.slice(0, safeLimit),
        nextCursor,
        total: count || items.length,
      };
    }
  } catch (err) {
    console.warn('listLeads error:', err);
  }

  return { items: [], total: 0 };
}

export async function getConfig(): Promise<Config | null> {
  const defaultPrecios: PreciosData = {
    version: 2,
    categorias: ["Monitoreo 24/7", "Alarmas Inteligentes", "Alarmas Cableadas", "Cámaras CCTV", "Cercos Eléctricos", "Promociones"],
    items: [
      {
        id: "monitoreo-247-uf",
        nombre: "Plan Monitoreo de Alarmas 24/7",
        descripcion: "Monitoreo continuo 24/7 los 365 días con verificación humana de señales en < 2 min. El equipo es 100% tuyo.",
        precio: 35000,
        precio_uf: "0,9 UF + IVA mensual",
        categoria: "Monitoreo 24/7",
        palabras_clave: ["monitoreo", "central", "24/7", "uf", "plan"],
        incluye: ["Verificación < 2 min", "App móvil", "Aviso telefónico prioritario", "Equipo propio"],
        no_incluye: ["Hardware inicial"],
        faq: [{ q: "¿Cuál es el valor mensual?", a: "0,9 UF + IVA mensual fijo sin cobros sorpresa." }]
      },
      {
        id: "kit-vetti-inteligente",
        nombre: "Kit Alarma Inteligente Vetti NT CLICK",
        descripcion: "Panel de control inalámbrico de alta tecnología con App NT CLICK. Notificaciones push al instante.",
        precio: 199900,
        precio_uf: "5,3 UF + IVA",
        categoria: "Alarmas Inteligentes",
        palabras_clave: ["vetti", "nt click", "inalambrica", "kit", "smart"],
        incluye: ["Panel Vetti Smart", "1 Sensor de movimiento PIR", "1 Contacto magnético", "2 Controles remotos", "Sirena integrada", "App NT CLICK"],
        no_incluye: ["Instalación en altura especial", "Monitoreo mensual"],
        faq: [{ q: "¿Tiene garantía?", a: "1 año de garantía oficial GAMA Security con soporte técnico directo." }]
      }
    ]
  };

  const defaultBotConfig: BotConfig = {
    rateLimit: 100,
    timeoutMin: 30,
    despedida: '¡Gracias por contactar a GAMA Seguridad! Te esperamos.',
    waUrl: 'https://wa.me/56991016912',
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
  };

  let loadedPrompt: string | null = null;
  let loadedPrecios: PreciosData | null = null;
  let loadedBotConfig: BotConfig | null = null;

  // 1. Leer de config_sales_gama
  try {
    const { data, error } = await supabaseAdmin
      .from('config_sales_gama')
      .select('key, value')
      .in('key', ['prompt', 'precios', 'config']);

    if (!error && data && data.length > 0) {
      const configMap = new Map(data.map((row: { key: string; value: unknown }) => [row.key, row.value]));
      const rawPrompt = configMap.get('prompt');
      const rawPrecios = configMap.get('precios');
      const rawConfig = configMap.get('config');

      if (rawPrompt) {
        loadedPrompt = typeof rawPrompt === 'string'
          ? (() => { try { return JSON.parse(rawPrompt); } catch { return rawPrompt; } })()
          : (rawPrompt as string);
      }
      if (rawPrecios) {
        loadedPrecios = typeof rawPrecios === 'string'
          ? (() => { try { return JSON.parse(rawPrecios); } catch { return rawPrecios; } })()
          : (rawPrecios as PreciosData);
      }
      if (rawConfig) {
        loadedBotConfig = rawConfig as BotConfig;
      }
    }
  } catch (err) {
    console.warn('getConfig error:', err);
  }

  return {
    prompt: loadedPrompt || '',
    precios: loadedPrecios || defaultPrecios,
    config: loadedBotConfig || defaultBotConfig,
  };
}

export async function setConfig(key: 'prompt' | 'precios' | 'config', value: unknown): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('config_sales_gama')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    return !error;
  } catch (err) {
    console.warn('setConfig error:', err);
    return false;
  }
}

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}