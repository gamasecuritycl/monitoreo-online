import { supabase } from '../supabase';
import type { Lead, LeadMessage, Config, PreciosData, BotConfig, ListLeadsResponse, LeadFilters, PaginationParams } from './types';

export const supabaseAdmin = supabase;

export async function upsertLead(sessionId: string, partialLead: Partial<Lead>): Promise<Lead | null> {
  const now = new Date().toISOString();
  const payload = {
    session_id: sessionId,
    ...partialLead,
    updated_at: now,
    last_activity: now,
    created_at: partialLead.created_at || now,
  } as Partial<Lead>;

  const { data, error } = await supabaseAdmin
    .from('leads_sales_gama')
    .upsert(payload, { onConflict: 'session_id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting lead:', error);
    return null;
  }

  return data as Lead;
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

  const { data, error } = await supabaseAdmin
    .from('lead_messages')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error appending message:', error);
    return null;
  }

  await supabaseAdmin
    .from('leads_sales_gama')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', leadId);

  return data as LeadMessage;
}

export async function getLeadBySession(sessionId: string): Promise<Lead | null> {
  const { data, error } = await supabaseAdmin
    .from('leads_sales_gama')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error getting lead by session:', error);
    return null;
  }

  return data as Lead;
}

export async function getLeadWithMessages(leadId: string): Promise<{ lead: Lead; messages: LeadMessage[] } | null> {
  const { data: lead, error: leadError } = await supabaseAdmin
    .from('leads_sales_gama')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError) {
    console.error('Error getting lead:', leadError);
    return null;
  }

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from('lead_messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('Error getting messages:', messagesError);
    return null;
  }

  return {
    lead: lead as Lead,
    messages: (messages || []) as LeadMessage[],
  };
}

export async function updateLeadStatus(leadId: string, estado: 'nuevo' | 'caliente' | 'cerrado' | 'derivado'): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('leads_sales_gama')
    .update({ estado, last_activity: new Date().toISOString() })
    .eq('id', leadId);

  if (error) {
    console.error('Error updating lead status:', error);
    return false;
  }
  return true;
}

export async function listLeads(
  filters: LeadFilters = {},
  pagination: PaginationParams = {}
): Promise<ListLeadsResponse> {
  const { cursor, limit = 20 } = pagination;
  const safeLimit = Math.min(limit, 100);
  let query = supabaseAdmin
    .from('leads_sales_gama')
    .select('*', { count: 'exact' })
    .order('last_activity', { ascending: false })
    .limit(safeLimit + 1);

  if (filters.estado) {
    query = query.eq('estado', filters.estado);
  }
  if (filters.comuna) {
    query = query.ilike('comuna', `%${filters.comuna}%`);
  }
  if (filters.search) {
    query = query.or(`nombre.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telefono.ilike.%${filters.search}%`);
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }
  if (cursor) {
    query = query.lt('last_activity', cursor);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing leads:', error);
    return { items: [], total: 0 };
  }

  const items = (data || []) as Lead[];

  // Fail-safe: Si leads_sales_gama no tiene filas o falló RLS, consultar eventos_monitoreo
  if (items.length === 0) {
    try {
      const { data: evData } = await supabaseAdmin
        .from('eventos_monitoreo')
        .select('*')
        .in('cuenta', ['LEAD-BOT', 'WEB-PROSPECTO'])
        .order('id', { ascending: false })
        .limit(safeLimit);

      if (evData && evData.length > 0) {
        const fallbackItems: Lead[] = evData.map((e) => {
          const desc = e.descripcion_evento || '';
          const telMatch = desc.match(/(?:\+?56\s*9|9)\s*([0-9]{4})\s*([0-9]{4})/);
          const emailMatch = desc.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
          const comunaMatch = desc.match(/\[(.*?)\]/);

          return {
            id: `ev-${e.id}`,
            session_id: `ev-sess-${e.id}`,
            nombre: e.nombre_abonado?.replace(/^(?:Cotización Web:\s*|Prospecto Web\s*)/i, '') || 'Prospecto Web',
            telefono: telMatch ? `+56${telMatch[0].replace(/\D/g, '').replace(/^56/, '')}` : undefined,
            email: emailMatch ? emailMatch[0] : undefined,
            comuna: comunaMatch ? comunaMatch[1] : undefined,
            estado: (e.evento === 'LEAD_CALIENTE_BOT' || telMatch) ? 'caliente' : 'nuevo',
            resumen: desc,
            created_at: e.fecha_evento || new Date().toISOString(),
            updated_at: e.fecha_evento || new Date().toISOString(),
            last_activity: e.fecha_evento || new Date().toISOString(),
          };
        });

        return { items: fallbackItems, total: fallbackItems.length };
      }
    } catch (e) {
      console.warn('Fallback listLeads error:', e);
    }
  }

  let nextCursor: string | undefined;
  if (items.length > safeLimit) {
    const nextItem = items[safeLimit - 1];
    nextCursor = nextItem.last_activity;
    items.pop();
  }

  return {
    items: items.slice(0, safeLimit),
    nextCursor,
    total: count || 0,
  };
}

export async function getConfig(): Promise<Config | null> {
  const { data, error } = await supabaseAdmin
    .from('config_sales_gama')
    .select('key, value')
    .in('key', ['prompt', 'precios', 'config']);

  if (error) {
    console.error('Error getting config:', error);
    return null;
  }

  const configMap = new Map((data || []).map((row: { key: string; value: unknown }) => [row.key, row.value]));

  const rawConfig = configMap.get('config');
  const rawPrompt = configMap.get('prompt');
  const rawPrecios = configMap.get('precios');

  const defaultPrecios = {
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
      }
    ]
  };

  const configObj = (rawConfig as Record<string, unknown>) || {};
  const prompt = (typeof rawPrompt === 'string' ? (() => { try { return JSON.parse(rawPrompt); } catch { return rawPrompt; } })() : rawPrompt) as string || (configObj.prompt as string) || '';
  const precios = (typeof rawPrecios === 'string' ? (() => { try { return JSON.parse(rawPrecios); } catch { return rawPrecios; } })() : rawPrecios) as PreciosData || (configObj.precios as PreciosData) || defaultPrecios;
  const botConfig = (configObj.botConfig || configObj) as BotConfig || {
    rateLimit: 100,
    timeoutMin: 30,
    despedida: '¡Gracias por contactar a GAMA Seguridad! Te esperamos.',
    waUrl: 'https://wa.me/56991016912',
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
  };

  return { prompt, precios, config: botConfig };
}

export async function setConfig(key: 'prompt' | 'precios' | 'config', value: unknown): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('config_sales_gama')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    console.error('Error setting config:', error);
    return false;
  }

  return true;
}

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}