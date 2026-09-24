# Spec: SALES-GAMA — Agente de Ventas IA para Landing + Panel /operaciones

## 1. Resumen
Widget de chat flotante en **landing pública** (`/`) con avatar animado **SALES-GAMA** (robot amigable, polera GAMA SEGURIDAD, escribe en teclado cuando "piensa"). Elimina botón WhatsApp actual. Copia del widget en **modal de pruebas** dentro de `/operaciones`. Motor **Gemini 2.5 Flash** (`@google/generative-ai`). System prompt editable, memoria de sesión (localStorage, 5 min inactividad → despedida + cierre), handoff a WhatsApp con resumen. Leads e historial en tabla Supabase `leads_sales_gama`. Precios/artículos en JSON `config/precios.json` editable desde modal 4 pestañas en `/operaciones`. Rate limit simple por sesión (sessionStorage + IP header).

---

## 2. Alcance

### 2.1 Landing pública (`/`)
- **Widget flotante** esquina inferior derecha: botón circular con avatar `SalesGamaAvatar` (estado `idle`).
- Click → panel lateral derecho (slide-in 380px, mobile full-screen) con:
  - Header: avatar + "SALES-GAMA" + botón cerrar
  - Área mensajes (scroll, burbujas usuario/bot, avatar animado en cada mensaje del bot)
  - Input fijo abajo: textarea + botón enviar (Enter envía, Shift+Enter salto línea)
  - Estado `thinking` mientras Gemini responde → avatar `thinking` + teclado animado
  - Estado `talking` al recibir streaming → avatar `talking`
  - Botón **"Hablar con humano"** siempre visible abajo → abre `wa.me/56991016912?text=...` con resumen
- **Elimina** botón WhatsApp flotante actual.
- Rate limit: máx 30 msg/sesión (sessionStorage), bloqueo 5 min si excede; IP header logged en Supabase para análisis.

### 2.2 Panel `/operaciones` — Modal SALES-GAMA (4 pestañas)
Acceso: botón "SALES-GAMA" en header o menú lateral de `/operaciones`. Modal ancho 900px, alto 90vh.

| Pestaña | Contenido |
|---|---|
| **Prompt Sistema** | Textarea grande (monospace) con system prompt actual. Botón "Guardar" → valida >50 chars, <8000, persiste en Supabase `config_sales_gama.prompt`. Vista previa tokens aprox. |
| **Precios/Artículos** | Editor JSON (`config/precios.json`) con validación schema (ver §3). Botones: "Validar", "Guardar", "Restaurar default". Vista previa tarjetas renderizadas. |
| **Leads/Historial** | Tabla paginada (20/page) desde `leads_sales_gama`: fecha, nombre, email, comuna, teléfono, estado, última actividad. Click fila → modal detalle con historial completo de mensajes (JSON expandible). Filtros: fecha, estado, comuna. Exportar CSV. |
| **Config** | Rate limit (msg/sesión, default 30), timeout inactividad (min, default 5), mensaje despedida editable, URL WhatsApp, modelo Gemini (selector flash/pro), temperatura (0–1), top_p, top_k. Guardado en `config_sales_gama`. |

### 2.3 API Endpoints (Next.js App Router, `/api/sales-gama/`)
| Ruta | Método | Descripción |
|---|---|---|
| `/chat` | POST | Recibe `{sessionId, message, history[]}` → streaming SSE con Gemini 2.5 Flash. Guarda mensaje usuario + respuesta en `leads_sales_gama.messages`. Rate limit check. |
| `/session/init` | GET | Crea/retorna `sessionId` (UUID v4), setea cookie `sg_session` (httpOnly, 24h). Inicializa `localStorage` cliente. |
| `/session/end` | POST | Marca sesión inactiva, guarda despedida, limpia `localStorage` cliente. |
| `/leads` | GET | Lista paginada + filtros (para pestaña Leads). |
| `/leads/:id` | GET | Detalle lead + historial mensajes. |
| `/config` | GET/PUT | CRUD `config_sales_gama` (prompt, precios JSON, params). |
| `/precios` | GET/PUT | CRUD `config/precios.json` (validación schema). |

### 2.4 Base de Datos (Supabase)

#### Tabla `leads_sales_gama`
```sql
create table leads_sales_gama (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  nombre text,
  email text,
  direccion text,
  comuna text,
  telefono text,
  estado text default 'nuevo' check (estado in ('nuevo','caliente','cerrado','derivado')),
  ip_hash text, -- sha256(ip) para rate limit análisis
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_activity timestamptz default now()
);

create table lead_messages (
  id bigserial primary key,
  lead_id uuid references leads_sales_gama(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  tokens_in int,
  tokens_out int,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index on leads_sales_gama (session_id);
create index on leads_sales_gama (estado, created_at desc);
create index on lead_messages (lead_id, created_at);
```

#### Tabla `config_sales_gama`
```sql
create table config_sales_gama (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
-- Keys: 'prompt', 'precios', 'config'
```

RLS: solo `service_role` (server) escribe/lee; cliente nunca accede directo.

### 2.5 JSON `config/precios.json` — Schema
```json
{
  "version": 1,
  "categorias": ["Alarmas Hogar", "Alarmas Negocio", "Cámaras", "Monitoreo", "Accesorios"],
  "items": [
    {
      "id": "alarma-hogar-basica",
      "nombre": "Alarma Hogar Básica",
      "descripcion": "Kit 3 sensores + sirena + panel",
      "precio": 189990,
      "categoria": "Alarmas Hogar",
      "palabras_clave": ["básica", "económica", "departamento"],
      "incluye": ["3 sensores magnéticos", "Sirena exterior", "Panel táctil", "Instalación"],
      "no_incluye": ["Cámaras", "App móvil premium"],
      "faq": [
        {"q": "¿Incluye monitoreo 24/7?", "a": "No, es solo alarma local. Monitoreo se contrata aparte."}
      ]
    }
  ]
}
```
Validación: `id` único, `precio` number >0, `categoria` en `categorias`, arrays no vacíos.

---

## 3. Flujo de Conversación (Bot)

1. **Inicio**: Saludo + "¿En qué te ayudo hoy? (alarma para casa, negocio, cámaras, monitoreo…)"
2. **Calificación**: Pregunta 1 a 1 (nombre → email → comuna → teléfono → necesidad). Cada dato → `upsert lead`.
3. **Oferta**: Según necesidad + `precios.json` → sugiere 1-2 items con precio, incluye/no incluye, botón "Ver detalle".
4. **Objeciones**: Usa `faq` del item + system prompt (técnicas: escuchar, validar, reformular, cerrar).
4. **Cierre**: "¿Agendamos visita técnica gratis?" → pide dirección exacta → deriva a WhatsApp con resumen.
5. **Handoff**: Botón "Hablar con humano" → `wa.me/56991016912?text=Hola%20SALES-GAMA...` con JSON resumen codificado.
6. **Timeout 5 min**: Mensaje "Parece que te ausentaste. ¡Estaré aquí cuando vuelvas! 👋" → cierra sesión, limpia `localStorage`.

---

## 4. Seguridad / Anti-Abuso
- Rate limit: `sessionStorage['sg_count']` ++ cada request; si > `config.rateLimit` (default 30) → 429 + espera 5 min.
- IP hash (SHA-256) logged en `leads_sales_gama.ip_hash` para análisis posterior.
- `Content-Security-Policy` en headers del widget: `script-src 'self'` (no inline scripts en widget).
- Sanitización: `DOMPurify` en mensajes usuario antes de render.
- CORS: solo origen `https://www.gamasecurity.cl` y `https://controltestmonitoreo.vercel.app`.

---

## 5. Stack Técnico
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4
- **Avatar**: `SalesGamaAvatar` (ya creado, SVG + CSS animations)
- **Chat UI**: componentes propios (sin librería externa)
- **Streaming**: SSE (`text/event-stream`) desde `/api/sales-gama/chat`
- **IA**: `@google/generative-ai` (Gemini 2.5 Flash, temp 0.7, top_p 0.9)
- **BD**: Supabase (`@supabase/supabase-js` v2, service role en server)
- **Validación**: `zod` schemas (prompt, precios, config)
- **Sanitización**: `dompurify` (client) + `zod` (server)
- **Rate limit**: `sessionStorage` + header `x-forwarded-for` hash
- **Estilos**: Tailwind 4 + CSS modules para avatar

---

## 6. Criterios de Aceptación
- [ ] Landing: widget abre/cierra, avatar anima `idle`/`thinking`/`talking`, streaming funciona, handoff WhatsApp abre con resumen.
- [ ] Rate limit bloquea tras 30 msg/sesión (5 min).
- [ ] Timeout 5 min → despedida + limpieza `localStorage`.
- [ ] `/operaciones` modal 4 pestañas: prompt editable, precios JSON valida/guarda, leads tabla + detalle, config guarda.
- [ ] Leads se crean/actualizan en Supabase con cada dato capturado.
- [ ] Historial mensajes completo visible en detalle lead.
- [ ] Build `npm run build` pasa, 0 errores TypeScript/ESLint.
- [ ] Accesibilidad: labels ARIA, focus visible, contraste AA, navegable teclado.

---

## 7. Fuera de Alcance (v1)
- Fine-tuning / RAG con documentos
- Integración WhatsApp Server webhook (solo link `wa.me`)
- Dashboard analytics / métricas de conversión
- Multi-idioma
- Notificaciones push / email a vendedores