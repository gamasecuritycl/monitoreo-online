export const COMUNAS_CHILE = [
  "valparaiso", "vina del mar", "viña del mar", "quilpue", "quilpué", "villa alemana", "concon", "concón",
  "santiago", "providencia", "las condes", "vitacura", "lo barnechea", "la reina", "nunoa", "ñuñoa",
  "macul", "penalolen", "peñalolén", "la florida", "la granja", "el bosque", "san bernardo", "puente alto",
  "maipu", "maipú", "estacion central", "estación central", "pudahuel", "quilicura", "recoleta", "independencia",
  "conchali", "conchalí", "huechuraba", "san miguel", "san joaquin", "san joaquín", "cerrillos", "lo prado",
  "cerro navia", "renca", "quinta normal", "pedro aguirre cerda", "lo espejo", "la cisterna", "san ramon", "san ramón",
  "casablanca", "juan fernandez", "quillota", "la calera", "hijuelas", "la cruz",
  "nogales", "san antonio", "algarrobo", "cartagena", "el quisco", "el tabo",
  "santo domingo", "san felipe", "catemu", "llaillay", "panquehue", "putaendo",
  "santa maria", "los andes", "calle larga", "rinconada", "san esteban", "la ligua",
  "cabildo", "papudo", "petorca", "zapallar", "limache", "olmue", "olmué"
];

export interface ExtractedLeadData {
  telefono?: string;
  email?: string;
  nombre?: string;
  comuna?: string;
  direccion?: string;
}

export function extractLeadData(text: string): ExtractedLeadData {
  const extracted: ExtractedLeadData = {};

  if (!text || typeof text !== 'string') return extracted;

  // Email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    extracted.email = emailMatch[0].trim();
  }

  // Teléfono chileno (ej: +56912345678, 912345678, 9 1234 5678, 56912345678)
  const phoneMatch = text.match(/(?:\+?56\s*9|9)\s*([0-9\s-]{8,12})\b/) || text.match(/\b([2-9][0-9\s-]{7,9})\b/);
  if (phoneMatch) {
    let clean = phoneMatch[0].replace(/\D/g, '');
    if (clean.length === 8) clean = '9' + clean;
    if (clean.length === 9) clean = '56' + clean;
    if (clean.startsWith('569') && clean.length === 11) {
      extracted.telefono = `+${clean}`;
    } else if (clean.length >= 8) {
      extracted.telefono = `+56${clean.replace(/^56/, '')}`;
    }
  }

  // Comuna (normalizada)
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const c of COMUNAS_CHILE) {
    const cNorm = c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (new RegExp(`\\b${cNorm}\\b`, 'i').test(lower)) {
      extracted.comuna = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // Nombre (con patrones comunes y respuestas directas)
  const STOPWORDS = new Set(['hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'si', 'no', 'ok', 'vale', 'precio', 'precios', 'kit', 'alarma', 'alarmas', 'camara', 'camaras', 'cuanto', 'costo', 'cotizacion', 'monitoreo', 'gracias', 'por favor', 'favor', 'informacion', 'info', 'ayuda', 'consulta']);
  const explicitName = text.match(/(?:me llamo|mi nombre es|soy|habla|atenta(?:mente)?)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20})?)/i);
  if (explicitName) {
    const candidate = explicitName[1].trim();
    if (!STOPWORDS.has(candidate.toLowerCase())) {
      extracted.nombre = candidate;
    }
  } else {
    // Si el usuario responde directamente con su nombre (1 a 3 palabras)
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/);
    if (words.length >= 1 && words.length <= 3 && /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(trimmed)) {
      const isStop = words.some(w => STOPWORDS.has(w.toLowerCase()));
      if (!isStop && trimmed.length >= 3 && trimmed.length <= 35) {
        extracted.nombre = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }

  // Dirección
  const dirMatch = text.match(/(?:vivo en|la direcci[oó]n es|calle|pasaje|avenida|avda\.?|pasaje)\s+([A-Za-z0-9ÁÉÍÓÚáéíóúñÑ\s#°,-]{6,45})/i);
  if (dirMatch) {
    extracted.direccion = dirMatch[1].trim();
  }

  return extracted;
}
