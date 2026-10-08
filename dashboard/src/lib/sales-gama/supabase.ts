import { supabase } from '../supabase';
import type { Lead, LeadMessage, Config, PreciosData, BotConfig, ListLeadsResponse, LeadFilters, PaginationParams, PromocionItem, FAQItem, MetaIntegrationConfig } from './types';

export const DEFAULT_META_CONFIG: MetaIntegrationConfig = {
  activo: true,
  verifyToken: 'gama_security_meta_token_2026',
  pageAccessToken: '',
  instagramAccountId: '',
  pageId: '',
  telefonoDerivacion: '56991016912',
  autoResponderInstagram: true,
  autoResponderMessenger: true,
};

export const supabaseAdmin = supabase;


export async function upsertLead(sessionId: string, partialLead: Partial<Lead>): Promise<Lead | null> {
  const now = new Date().toISOString();
  // Extraer 'resumen' para evitar error de columna inexistente en PostgreSQL
  const { resumen, ...dbFields } = partialLead;

  const payload: Partial<Lead> = {
    session_id: sessionId,
    ...dbFields,
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
      if (resumen) savedLead.resumen = resumen;
    } else if (error) {
      console.warn('Upsert leads_sales_gama error:', error.message);
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
      // Enriquecer items con el último mensaje del usuario para la columna Resumen / Interés
      const leadIds = items.map((l) => l.id);
      if (leadIds.length > 0) {
        try {
          const { data: messages } = await supabaseAdmin
            .from('lead_messages')
            .select('lead_id, content, role, created_at')
            .in('lead_id', leadIds)
            .eq('role', 'user')
            .order('created_at', { ascending: false });

          if (messages && messages.length > 0) {
            const msgMap = new Map<string, string>();
            for (const m of messages) {
              if (!msgMap.has(m.lead_id)) {
                msgMap.set(m.lead_id, m.content);
              }
            }
            items.forEach((l) => {
              if (msgMap.has(l.id)) {
                l.resumen = msgMap.get(l.id);
              }
            });
          }
        } catch {}
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
    categorias: ["Promociones", "VETTI (Inalámbrica)", "DSC (Cableada)", "Monitoreo 24/7", "Cámaras CCTV"],
    items: [
      // ── VETTI SMART ──
      {
        id: "pack-vetti-smart-promo",
        nombre: "Promoción Exclusiva Pack VETTI Smart (Kit Base)",
        descripcion: "Sistema de alarma inalámbrica de alta tecnología con App NT CLICK y monitoreo 24/7. Equipos propios sin arriendo.",
        precio: 0,
        precio_uf: "Instalación $0 bonificada / Monitoreo desde 0,9 UF + IVA mensual",
        categoria: "Promociones",
        marca: "VETTI",
        palabras_clave: ["vetti", "pack", "promocion", "promo", "oferta", "smart", "nt click", "alarma", "kit", "casa", "departamento", "negocio", "valores", "detalles"],
        incluye: [
          "Central Inteligente Vetti Hub (WiFi + 4G GSM anti-corte)",
          "1 Sensor de movimiento PIR antimascotas (hasta 25 kg)",
          "1 Contacto magnético de puerta/ventana",
          "2 Controles remotos con botón de pánico SOS",
          "Sirena disuasiva 110 dB integrada",
          "Batería de respaldo autónoma",
          "App NT CLICK en tu smartphone",
          "Instalación $0 bonificada",
          "Monitoreo 24/7 desde 0,9 UF + IVA mensual",
          "Equipos 100% de tu propiedad (sin comodato)"
        ],
        no_incluye: ["Arriendos de equipos engañosos"],
        faq: [
          { q: "¿Qué incluye la promoción?", a: "Incluye todo el kit Vetti Smart con central WiFi/4G, sensores, controles, sirena, App NT CLICK e instalación $0 bonificada con el servicio de monitoreo 24/7 desde 0,9 UF/mes." },
          { q: "¿Los equipos son míos?", a: "Sí, el equipamiento queda 100% en tu propiedad, sin arriendos eternos." },
          { q: "¿Cuánto cuesta el monitoreo?", a: "Desde 0,9 UF + IVA mensual (~$35.000 CLP aprox)." }
        ]
      },
      {
        id: "vetti-sensor-pir",
        nombre: "Sensor de Movimiento PIR Antimascotas Vetti (Inalámbrico Adicional)",
        descripcion: "Sensor infrarrojo pasivo inalámbrico con óptica inteligente antimascotas (hasta 25 kg). No genera falsas alarmas con perros o gatos.",
        precio: 24900,
        categoria: "VETTI (Inalámbrica)",
        marca: "VETTI",
        palabras_clave: ["pir", "sensor", "movimiento", "dormitorio", "living", "comedor", "antimascotas", "vetti", "adicional"],
        incluye: ["Sensor PIR inalámbrico", "Soporte angular de fijación", "Batería de larga duración de litio"],
        no_incluye: ["Cables (es 100% inalámbrico)"],
        faq: [{ q: "¿Cuánto cuesta cada sensor adicional de movimiento?", a: "$24.900 CLP + IVA cada uno. Es un pago único y el sensor es 100% tuyo." }]
      },
      {
        id: "vetti-contacto-magnetico",
        nombre: "Contacto Magnético Puerta/Ventana Vetti (Inalámbrico Adicional)",
        descripcion: "Sensor magnético de apertura inalámbrico de alta precisión para puertas de acceso, servicio o ventanales.",
        precio: 19900,
        categoria: "VETTI (Inalámbrica)",
        marca: "VETTI",
        palabras_clave: ["magnetico", "puerta", "ventana", "acceso", "servicio", "apertura", "vetti", "adicional"],
        incluye: ["Sensor magnético emisor + imán", "Batería de litio", "Cinta de fijación 3M de alta resistencia"],
        no_incluye: [],
        faq: [{ q: "¿Cuánto cuesta cada contacto magnético adicional?", a: "$19.900 CLP + IVA cada uno. Pago único." }]
      },
      {
        id: "vetti-control-remoto",
        nombre: "Control Remoto Inalámbrico Vetti (4 Botones con Botón Pánico SOS)",
        descripcion: "Control llavero de 4 funciones (armado total, armado noche en casa, desarmado y botón de pánico SOS de emergencia).",
        precio: 14900,
        categoria: "VETTI (Inalámbrica)",
        marca: "VETTI",
        palabras_clave: ["control", "remoto", "llavero", "panico", "sos", "vetti"],
        incluye: ["Control remoto 4 botones", "Pila incluida", "Llavero metálico"],
        no_incluye: [],
        faq: [{ q: "¿Cuánto cuesta un control remoto extra?", a: "$14.900 CLP + IVA cada uno." }]
      },
      {
        id: "vetti-sirena-exterior",
        nombre: "Sirena Exterior Inalámbrica 110 dB con Baliza Estroboscópica Vetti",
        descripcion: "Sirena de alta potencia disuasiva para frontis o patio con luz estroboscópica LED roja intermitente y protección intemperie IP65.",
        precio: 29900,
        categoria: "VETTI (Inalámbrica)",
        marca: "VETTI",
        palabras_clave: ["sirena", "exterior", "baliza", "luz", "ruido", "disuasion", "vetti"],
        incluye: ["Sirena 110 dB", "Luz estroboscópica LED", "Batería de respaldo y transformador"],
        no_incluye: [],
        faq: [{ q: "¿Cuánto cuesta la sirena exterior?", a: "$29.900 CLP + IVA." }]
      },

      // ── DSC POWERSERIES & NEO (CABLEADA / HÍBRIDA) ──
      {
        id: "dsc-reprogramacion-adt",
        nombre: "Reprogramación y Migración Alarma ADT / DSC a Central GAMA",
        descripcion: "Migra tu panel existente DSC o ADT a nuestra Central 24/7 a costo $0. Conservas todos tus sensores instalados.",
        precio: 0,
        precio_uf: "Costo $0 de cambio / Monitoreo desde 0,9 UF + IVA mensual",
        categoria: "Promociones",
        marca: "DSC",
        palabras_clave: ["adt", "reprogramacion", "migracion", "cambiar", "dsc", "powerseries", "costo cero"],
        incluye: [
          "Evaluación y reprogramación técnica en terreno $0",
          "Conexión de sensores existentes a Central GAMA 24/7",
          "Sin comprar sensores nuevos",
          "Plan monitoreo desde 0,9 UF + IVA mensual (~$35.000 CLP)",
          "Ahorro de más de $350.000 al año"
        ],
        no_incluye: ["Costos de salida abusivos (no tenemos letra chica)"],
        faq: [{ q: "¿Cuánto cobran por cambiarme desde ADT si tengo panel DSC?", a: "Costo $0 de instalación y reprogramación. Solo pagas el monitoreo desde 0,9 UF + IVA al mes." }]
      },
      {
        id: "dsc-kit-powerseries",
        nombre: "Kit Central DSC PowerSeries PC1832 (Cableada)",
        descripcion: "Sistema de alarma cableado grado comercial e industrial de máxima robustez. Compatible con hasta 32 zonas cableadas.",
        precio: 189900,
        categoria: "DSC (Cableada)",
        marca: "DSC",
        palabras_clave: ["dsc", "pc1832", "powerseries", "cableada", "central dsc", "kit dsc"],
        incluye: [
          "Gabinete metálico con cerradura",
          "Placa madre DSC PC1832 de 8 zonas expandible a 32",
          "Transformador 16.5V y batería de respaldo 12V 4Ah",
          "Teclado LED DSC",
          "Sirena interior 30W"
        ],
        no_incluye: ["Monitoreo mensual (desde 0,9 UF + IVA)"],
        faq: [{ q: "¿Cuánto cuesta el kit DSC cableado?", a: "$189.900 CLP + IVA." }]
      },
      {
        id: "dsc-sensor-pir",
        nombre: "Sensor de Movimiento PIR DSC Cableado Antimascotas",
        descripcion: "Detector de movimiento infrarrojo pasivo cableado de alta confiabilidad con inmunidad a mascotas de hasta 25 kg.",
        precio: 19900,
        categoria: "DSC (Cableada)",
        marca: "DSC",
        palabras_clave: ["pir dsc", "sensor dsc", "cableado", "movimiento dsc", "antimascotas dsc"],
        incluye: ["Sensor PIR DSC", "Soporte", "Conexión a zona"],
        no_incluye: [],
        faq: [{ q: "¿Cuánto cuesta un sensor PIR cableado DSC?", a: "$19.900 CLP + IVA cada uno." }]
      },
      {
        id: "dsc-contacto-magnetico",
        nombre: "Contacto Magnético Cableado DSC (Puerta/Ventana)",
        descripcion: "Contacto magnético embutido o sobrepuesto de alta durabilidad para puertas de acceso o ventanas.",
        precio: 9900,
        categoria: "DSC (Cableada)",
        marca: "DSC",
        palabras_clave: ["magnetico dsc", "puerta dsc", "ventana dsc", "cableado"],
        incluye: ["Contacto magnético cableado", "Tornillería"],
        no_incluye: [],
        faq: [{ q: "¿Cuánto cuesta el magnético cableado DSC?", a: "$9.900 CLP + IVA." }]
      },
      {
        id: "dsc-comunicador-4g",
        nombre: "Comunicador 4G LTE / IP Universal para Paneles DSC",
        descripcion: "Módulo comunicador celular 4G de alta velocidad para reporte inmediato a Central de Monitoreo GAMA 24/7 sin línea telefónica fija.",
        precio: 59900,
        categoria: "DSC (Cableada)",
        marca: "DSC",
        palabras_clave: ["comunicador", "4g", "gsm", "chip", "reporte", "dsc"],
        incluye: ["Módulo 4G LTE", "Antena de alta ganancia", "Chip M2M multioperador"],
        no_incluye: [],
        faq: [{ q: "¿Cuánto cuesta el comunicador 4G para DSC?", a: "$59.900 CLP + IVA." }]
      },

      // ── SERVICIO DE MONITOREO ──
      {
        id: "monitoreo-247-uf",
        nombre: "Plan Monitoreo de Alarmas 24/7",
        descripcion: "Monitoreo continuo 24/7 los 365 días con verificación humana de señales en < 2 min. El equipo es 100% tuyo.",
        precio: 35000,
        precio_uf: "0,9 UF + IVA mensual",
        categoria: "Monitoreo 24/7",
        marca: "GENERAL",
        palabras_clave: ["monitoreo", "central", "24/7", "uf", "plan", "mensualidad"],
        incluye: ["Verificación < 2 min por operadores certificados", "App móvil", "Aviso telefónico prioritario", "Equipos propios sin comodato"],
        no_incluye: ["Equipos de hardware inicial"],
        faq: [{ q: "¿Cuál es el valor mensual del monitoreo?", a: "Desde 0,9 UF + IVA mensual (~$35.000 CLP aprox), con equipos 100% propios." }]
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

export async function setConfig(
  key: 'prompt' | 'precios' | 'config' | 'promociones' | 'faqs' | 'meta_integration' | string,
  value: unknown
): Promise<boolean> {
  try {
    // Si la clave es un sub-objeto (promociones, faqs, meta_integration),
    // guardarlo dentro de la fila única 'config' para respetar la restricción check de PostgreSQL
    if (key === 'promociones' || key === 'faqs' || key === 'meta_integration') {
      const { data: current } = await supabaseAdmin
        .from('config_sales_gama')
        .select('value')
        .eq('key', 'config')
        .single();

      const existingConfig = current?.value && typeof current.value === 'object' ? current.value : {};
      const updatedConfig = {
        ...existingConfig,
        [key]: value,
      };

      const { error } = await supabaseAdmin
        .from('config_sales_gama')
        .upsert({ key: 'config', value: updatedConfig, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      return !error;
    }

    let finalValue = value;

    if (key === 'config') {
      const { data: current } = await supabaseAdmin
        .from('config_sales_gama')
        .select('value')
        .eq('key', key)
        .single();

      const existing = current?.value && typeof current.value === 'object' ? current.value : {};
      const incoming = typeof value === 'object' && value !== null ? value : {};

      finalValue = {
        ...existing,
        ...incoming,
      };
    }

    const { error } = await supabaseAdmin
      .from('config_sales_gama')
      .upsert({ key, value: finalValue, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    return !error;
  } catch (err) {
    console.warn('setConfig error:', err);
    return false;
  }
}

export async function getMetaIntegrationConfig(): Promise<MetaIntegrationConfig> {
  try {
    // 1. Intentar leer desde el objeto 'config'
    const { data, error } = await supabaseAdmin
      .from('config_sales_gama')
      .select('value')
      .eq('key', 'config')
      .single();

    if (!error && data?.value) {
      const val = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      if (val?.meta_integration) {
        return {
          ...DEFAULT_META_CONFIG,
          ...val.meta_integration,
        };
      }
    }

    // 2. Fallback a clave directa si existe
    const { data: directData } = await supabaseAdmin
      .from('config_sales_gama')
      .select('value')
      .eq('key', 'meta_integration')
      .single();

    if (directData?.value) {
      const val = typeof directData.value === 'string' ? JSON.parse(directData.value) : directData.value;
      return {
        ...DEFAULT_META_CONFIG,
        ...val,
      };
    }
  } catch {}

  return DEFAULT_META_CONFIG;
}

export async function setMetaIntegrationConfig(config: Partial<MetaIntegrationConfig>): Promise<boolean> {
  return setConfig('meta_integration', config);
}


export async function getPromociones(): Promise<PromocionItem[]> {
  const defaultPromos: PromocionItem[] = [
    {
      id: 'promo-instalacion-cero',
      titulo: 'Pack Hogar Seguro - Instalación $0',
      subtitulo: 'Ahorro inmediato en equipamiento e instalación bonificada',
      beneficio: 'Instalación $0 bonificada + 1er mes con 50% de descuento en Monitoreo 24/7',
      descuento: 'Instalación $0 + 50% OFF Mes 1',
      vigencia_desde: '2026-01-01',
      vigencia_hasta: '2026-12-31',
      imagen_url: '/camaras-cctv.png',
      mensaje_whatsapp: '¡Excelente noticia! 🎉 Tenemos activa nuestra promo **Instalación Costo $0** para tu sector: el kit queda 100% en tu propiedad y el monitoreo profesional 24/7 desde solo 0,9 UF + IVA mensual 🛡️.',
      activa: true,
      destacada: true,
    },
    {
      id: 'promo-reprogramacion-adt-dsc',
      titulo: 'Reprogramación ADT / DSC a Costo $0',
      subtitulo: 'Migra tu alarma actual a Central GAMA sin comprar sensores nuevos',
      beneficio: 'Reprogramación técnica $0 + Conexión directa a Central de Monitoreo 24/7',
      descuento: 'Costo de cambio $0',
      vigencia_desde: '2026-01-01',
      vigencia_hasta: '2026-12-31',
      imagen_url: '/dsc-panels.png',
      mensaje_whatsapp: '¿Ya tienes alarma instalada? 🔄 No pagues demás: en GAMA reprogramamos tus sensores existentes a costo $0 y te conectamos a nuestra Central por solo 0,9 UF + IVA al mes 🙌.',
      activa: true,
      destacada: false,
    },
    {
      id: 'promo-cctv-4k',
      titulo: 'Cyber Seguridad - Cámaras 4K con IA',
      subtitulo: 'Videovigilancia Ultra HD con visión nocturna a color y disuasión',
      beneficio: 'Evaluación técnica en terreno $0 + App móvil multicámara incluida',
      descuento: 'Evaluación técnica $0',
      vigencia_desde: '2026-01-01',
      vigencia_hasta: '2026-12-31',
      imagen_url: '/camaras-cctv.webp',
      mensaje_whatsapp: 'Vigila tu propiedad en Ultra HD 4K con IA y alertas inteligentes a tu celular 📲. Te agendamos una visita técnica en terreno 100% gratuita ($0) para dimensionar los puntos exactos 📹.',
      activa: true,
      destacada: false,
    }
  ];

  try {
    // 1. Intentar leer desde config.promociones
    const { data: cfgData } = await supabaseAdmin
      .from('config_sales_gama')
      .select('value')
      .eq('key', 'config')
      .single();

    if (cfgData?.value) {
      const cfgVal = typeof cfgData.value === 'string' ? JSON.parse(cfgData.value) : cfgData.value;
      if (Array.isArray(cfgVal?.promociones) && cfgVal.promociones.length > 0) {
        return cfgVal.promociones as PromocionItem[];
      }
    }

    // 2. Fallback a clave directa
    const { data, error } = await supabaseAdmin
      .from('config_sales_gama')
      .select('value')
      .eq('key', 'promociones')
      .single();

    if (!error && data?.value) {
      const val = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      if (Array.isArray(val) && val.length > 0) return val as PromocionItem[];
    }
  } catch {}

  return defaultPromos;
}

export async function setPromociones(promos: PromocionItem[]): Promise<boolean> {
  return setConfig('promociones', promos);
}

export async function getFAQs(): Promise<FAQItem[]> {
  const defaultFAQs: FAQItem[] = [
    {
      id: 'faq-vs-verisure',
      categoria: 'objeciones',
      pregunta: '¿Por qué elegir GAMA y no Verisure o ADT?',
      respuesta: 'En Verisure pagas de $75.000 a $85.000 mensuales y los equipos están en arriendo eterno (comodato). Si te vas, se los llevan. En GAMA los equipos son 100% de tu propiedad y el monitoreo profesional 24/7 cuesta desde 0,9 UF + IVA (~$35.000/mes). Ahorras más de $500.000 al año con mejor respuesta.',
      palabras_clave: ['verisure', 'adt', 'prosegur', 'competencia', 'arriendo', 'comodato', 'diferencia'],
      activa: true,
    },
    {
      id: 'faq-corte-luz',
      categoria: 'tecnica',
      pregunta: '¿Qué sucede si hay corte de luz o sabotaje de cables?',
      respuesta: 'El sistema cuenta con batería interna de alta autonomía y chip 4G GSM multi-operador de emergencia. Ante un corte de energía o sabotaje eléctrico, la alarma sigue sonando y reporta la señal de inmediato a nuestra Central 24/7.',
      palabras_clave: ['luz', 'corte', 'energia', 'electricidad', 'sabotaje', 'bateria', '4g'],
      activa: true,
    },
    {
      id: 'faq-mascotas',
      categoria: 'tecnica',
      pregunta: 'Tengo perros o gatos en casa, ¿se activará la alarma por error?',
      respuesta: 'No. Nuestros sensores de movimiento incorporan óptica inteligente antimascotas certificada para animales de hasta 25 kg. Puedes activar la alarma con tus mascotas adentro sin falsas alarmas.',
      palabras_clave: ['mascotas', 'perro', 'perros', 'gato', 'gatos', 'animales', 'pir'],
      activa: true,
    },
    {
      id: 'faq-visita-gratis',
      categoria: 'garantias',
      pregunta: '¿La evaluación técnica en terreno tiene costo o compromiso?',
      respuesta: 'Es 100% gratuita ($0) y sin ningún compromiso en toda la Región Metropolitana y V Región. Un especialista certificado revisa tu propiedad y te entrega la propuesta técnica exacta.',
      palabras_clave: ['visita', 'terreno', 'evaluacion', 'costo', 'gratis', 'cuanto cuesta la visita'],
      activa: true,
    },
    {
      id: 'faq-contrato-salida',
      categoria: 'financiera',
      pregunta: '¿Tienen letra chica o multas por retiro de equipos?',
      respuesta: 'Ninguna. Los equipos son 100% tuyos desde el día 1 en propiedad. No cobramos tarifas abusivas por desinstalación ni penalizaciones absurdas.',
      palabras_clave: ['contrato', 'permanencia', 'letra chica', 'multa', 'salida', 'plazo fijo'],
      activa: true,
    }
  ];

  try {
    // 1. Intentar leer desde config.faqs
    const { data: cfgData } = await supabaseAdmin
      .from('config_sales_gama')
      .select('value')
      .eq('key', 'config')
      .single();

    if (cfgData?.value) {
      const cfgVal = typeof cfgData.value === 'string' ? JSON.parse(cfgData.value) : cfgData.value;
      if (Array.isArray(cfgVal?.faqs) && cfgVal.faqs.length > 0) {
        return cfgVal.faqs as FAQItem[];
      }
    }

    // 2. Fallback a clave directa
    const { data, error } = await supabaseAdmin
      .from('config_sales_gama')
      .select('value')
      .eq('key', 'faqs')
      .single();

    if (!error && data?.value) {
      const val = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      if (Array.isArray(val) && val.length > 0) return val as FAQItem[];
    }
  } catch {}

  return defaultFAQs;
}

export async function setFAQs(faqs: FAQItem[]): Promise<boolean> {
  return setConfig('faqs', faqs);
}

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}