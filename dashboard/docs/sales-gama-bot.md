# SALES-GAMA — Guía de Uso

Agente de ventas IA integrado en el landing de GAMA SECURITY.

## Estructura de Archivos

```
dashboard/src/
├── lib/sales-gama/
│   ├── types.ts          # Tipos TypeScript
│   ├── supabase.ts       # Cliente Supabase server + helpers
│   ├── schema.ts         # Zod schemas (prompt, precios, config)
│   ├── rate-limit.ts     # Lógica rate limit
│   ├── assistant.ts      # Lógica AI Gemini + match de precios
│   └── __tests__/        # Tests unitarios
├── app/api/sales-gama/
│   ├── session/
│   │   ├── init/route.ts # POST → crea sesión, cookie sg_session
│   │   └── end/route.ts  # POST → cierra sesión
│   ├── chat/route.ts     # POST → streaming SSE Gemini
│   ├── config/route.ts   # GET/PUT → config del bot
│   ├── precios/route.ts  # GET/PUT → catálogo de precios JSON
│   ├── leads/route.ts    # GET → lista de leads
│   └── leads/[id]/route.ts # GET → lead + historial
├── components/SalesGama/
│   ├── SalesGamaAvatar.tsx  # Avatar SVG animado (idle/thinking/talking)
│   ├── ChatWidget.tsx       # Widget flotante landing
│   └── Modal/
│       └── SalesGamaModal.tsx # Modal 4 pestañas /operaciones
├── hooks/
│   └── useSalesGama.ts    # Hook cliente (session, rate limit, timeout)
├── config/precios.json    # Catálogo de precios editable
└── app/
    ├── page.tsx           # Landing: <ChatWidget /> reemplaza WhatsApp
    ├── operaciones/page.tsx # Panel operaciones: <SalesGamaModal />
```

## Tabla Supabase

- `leads_sales_gama` — leads con nombre, email, dirección, comuna, teléfono, estado
- `lead_messages` — historial completo de conversación por lead
- `config_sales_gama` — prompt, precios JSON, configuración del bot

## API Endpoints

| Ruta | Método | Descripción |
|---|---|---|
| `/api/sales-gama/session/init` | GET | Crea sesión, cookie `sg_session` |
| `/api/sales-gama/session/end` | POST | Cierra sesión, limpia cookie |
| `/api/sales-gama/chat` | POST | Streaming SSE Gemini 2.5 Flash |
| `/api/sales-gama/config` | GET/PUT | Prompt y configuración |
| `/api/sales-gama/precios` | GET/PUT | Catálogo de precios |
| `/api/sales-gama/leads` | GET | Lista paginada de leads |
| `/api/sales-gama/leads/[id]` | GET | Lead + historial |

## Catálogo de Precios (`config/precios.json`)

Estructura JSON editable desde `/operaciones` → pestaña *Precios/Artículos*:
- `categorias`: array de strings
- `items`: array de objetos con `id`, `nombre`, `descripcion`, `precio`, `categoria`, `palabras_clave`, `incluye`, `no_incluye`, `faq`

## Configuración (`/operaciones` → pestaña *Config*)

- `rateLimit`: msg/sesión (default 30)
- `timeoutMin`: minutos de inactividad (default 5) → despedida + cierre
- `despedida`: texto del mensaje de despedida
- `waUrl`: URL WhatsApp handoff (default `https://wa.me/56991016912`)
- `model`: selector Gemini (`gemini-2.5-flash`)
- `temperature`, `topP`, `topK`: params del modelo

## Prompt del Sistema

Editable desde `/operaciones` → pestaña *Prompt Sistema*. El bot es un experto en ventas que:
1. Califica al cliente (nombre → email → comuna → teléfono)
2. Ofrece productos relevantes del catálogo
3. Usa técnicas de objeción
4. Deriva a WhatsApp con resumen si no sabe o el usuario lo pide

## Rate Limit & Anti-Abuso

- `sessionStorage` cuenta mensajes por sesión
- `x-sg-count` header al servidor
- Si `> config.rateLimit` → 429, bloqueo 5 min
- IP hash (SHA-256) logueado para análisis

## Inactividad (5 min)

- Timer interno en hook
- Expira → mensaje despedida + limpia `localStorage`
- Reanuda con nueva sesión si vuelve

## Handoff WhatsApp

Botón "Hablar con humano" → abre `https://wa.me/56991016912?text=...` con resumen de conversación.

## Tests

```bash
npm run test          # Vitest unitarios (42 tests)
npx playwright test   # Playwright e2e (requiere npm install -D @playwright/test)
```