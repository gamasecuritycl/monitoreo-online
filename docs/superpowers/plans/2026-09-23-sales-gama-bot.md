# Plan: SALES-GAMA Bot — SDD (15 Tareas)

**Branch:** `feature/sales-gama-bot` (push a `main` al final)  
**Convención commits:** `feat sales-gama: ...` / `fix sales-gama: ...`  
**Verificación por tarea:** `npm run build` + `npm run lint` + tests unitarios  
**Reviewer:** subagent `cavecrew-reviewer` por cada tarea (Approved/SHIPPABLE requerido)

---

## Tareas

### T1 — Infra & Types (`feat sales-gama: infra, types, supabase schema, config table`)
- **Implementador:** Crea `dashboard/src/lib/sales-gama/`
  - `types.ts`: `Lead`, `LeadMessage`, `Config`, `PreciosItem`, `ChatMessage`, `Session`
  - `supabase.ts`: cliente server (service role) + helpers `upsertLead`, `appendMessage`, `getLead`, `listLeads`, `getConfig`, `setConfig`
  - `schema.ts`: `zod` schemas para `PromptSchema`, `PreciosSchema`, `ConfigSchema`, `ChatRequestSchema`
  - `rate-limit.ts`: `checkRateLimit(sessionId, ipHash)` → `{allowed, remaining, resetAt}`
- **DB:** Ejecuta SQL migración (ver spec §2.4) via Supabase CLI o dashboard.
- **Tests:** `vitest` unitarios para schemas + rate-limit logic.
- **Reviewer:** valida types strict, RLS correcto, schemas cubren casos borde.

### T2 — API `/session/init` & `/session/end` (`feat sales-gama: session endpoints`)
- **Implementador:**
  - `app/api/sales-gama/session/init/route.ts`: GET → genera UUID v4, setea cookie `sg_session` (httpOnly, secure, sameSite=lax, maxAge=86400), retorna `{sessionId}`. Logea IP hash.
  - `app/api/sales-gama/session/end/route.ts`: POST `{sessionId}` → update lead `last_activity`, setea `estado='cerrado'` si no hay nombre, limpia cookie.
- **Tests:** integración con `msw` mock Supabase.
- **Reviewer:** cookie flags, UUID v4, IP hash SHA-256.

### T3 — API `/chat` streaming SSE (`feat sales-gama: chat streaming endpoint`)
- **Implementador:** `app/api/sales-gama/chat/route.ts` POST
  - Input: `{sessionId, message, history: ChatMessage[]}`
  - Rate limit check → 429 si excede
  - Recupera `config` (prompt, precios, modelo, temp) + `precios.json`
  - Construye `systemPrompt` inyectando precios relevantes (busca por palabras_clave en mensaje)
  - Llama Gemini 2.5 Flash streaming (`generateContentStream`)
  - SSE: `data: {type: 'chunk', text: ...}` → `data: {type: 'done', tokensIn, tokensOut}`
  - Guarda mensaje user + assistant en `lead_messages` (batch al final)
  - Actualiza `lead.last_activity`
- **Tests:** mock `@google/generative-ai`, verifica streaming chunks, guardado BD.
- **Reviewer:** streaming correcto, tokens contados, manejo errores Gemini, rate limit integrado.

### T4 — API `/config` & `/precios` CRUD (`feat sales-gama: config & precios endpoints`)
- **Implementador:**
  - `app/api/sales-gama/config/route.ts`: GET/PUT `config_sales_gama` (keys: prompt, config). Valida `PromptSchema` / `ConfigSchema`.
  - `app/api/sales-gama/precios/route.ts`: GET/PUT `config/precios.json` (archivo en `dashboard/config/precios.json` + mirror en Supabase `config_sales_gama` key `precios`). Valida `PreciosSchema`.
- **Tests:** validación schema, round-trip JSON.
- **Reviewer:** validación estricta, atomic writes, backup previo en PUT.

### T5 — API `/leads` list & detail (`feat sales-gama: leads endpoints`)
- **Implementador:**
  - `app/api/sales-gama/leads/route.ts`: GET paginado (cursor/limit), filtros `estado`, `comuna`, `date_from`, `date_to`. Retorna `{items, nextCursor, total}`.
  - `app/api/sales-gama/leads/[id]/route.ts`: GET lead + mensajes (`lead_messages` ordenados).
- **Tests:** paginación, filtros, join mensajes.
- **Reviewer:** índices usados, paginación estable, sin N+1.

### T6 — Cliente: `useSalesGama` hook + `sessionStorage` rate limit (`feat sales-gama: client hook & rate limit`)
- **Implementador:** `dashboard/src/hooks/useSalesGama.ts`
  - `init()`: llama `/session/init` → guarda `sessionId` en `sessionStorage` + cookie.
  - `send(message)`: POST `/chat` con SSE reader → callbacks `onChunk`, `onDone`, `onError`.
  - `endSession()`: POST `/session/end`.
  - Rate limit local: `sessionStorage['sg_count']` ++; si > `config.rateLimit` → bloquea UI 5 min.
  - Timeout inactividad: `setTimeout` 5 min → auto `endSession` + muestra despedida.
  - Persistencia `localStorage`: `{sessionId, history[], lastActivity}` para survivir reload.
- **Tests:** hook con `msw`, rate limit, timeout, persistencia.
- **Reviewer:** cleanup timers, SSR-safe, memory leaks.

### T7 — Componente `ChatWidget` (landing) (`feat sales-gama: chat widget component`)
- **Implementador:** `dashboard/src/components/SalesGama/ChatWidget.tsx`
  - Botón flotante fijo (bottom-right, z-50) con `SalesGamaAvatar state="idle"`.
  - Click → panel slide-in (Framer Motion) 380px / mobile 100vw.
  - Header: avatar + título + botón cerrar (X).
  - Lista mensajes: `MessageBubble` (usuario derecha, bot izquierda con avatar animado).
  - `MessageBubble` bot: `SalesGamaAvatar state={isStreaming?'thinking':isTalking?'talking':'idle'}`.
  - Input: `textarea` auto-resize, Enter envía, Shift+Enter salto.
  - Botón "Hablar con humano" fijo abajo → `window.open(waLink, '_blank')`.
  - Accesibilidad: `role="log" aria-live="polite"`, focus trap en panel abierto, Escape cierra.
  - Elimina botón WhatsApp actual (`dashboard/src/components/landing/WhatsAppButton.tsx` → borrar o comentar).
- **Tests:** rendering, keyboard nav, focus trap, avatar states.
- **Reviewer:** animaciones suaves, no layout shift, a11y AA.

### T8 — Componente `SalesGamaModal` (`/operaciones`) (`feat sales-gama: operacion modal 4 tabs`)
- **Implementador:** `dashboard/src/components/SalesGama/SalesGamaModal.tsx`
  - Modal 900x90vh (radix-ui Dialog o headless UI).
  - Tabs: `Prompt` | `Precios` | `Leads` | `Config` (radix Tabs).
  - **Prompt**: `textarea` monospace, contador chars, botón Guardar → PUT `/config` (key=prompt). Toast éxito/error.
  - **Precios**: Editor JSON (monaco-editor o `react-json-view` + botón Validar/Guardar). GET `/precios` → carga, PUT `/precios` valida `PreciosSchema`. Vista previa tarjetas al lado.
  - **Leads**: Tabla `tanstack/react-table` (paginación, orden, filtros). Cols: fecha, nombre, email, comuna, teléfono, estado, última actividad. Click fila → `LeadDetailDrawer` (lateral) con historial mensajes (timeline burbujas). Export CSV button.
  - **Config**: Formulario con `react-hook-form` + `zodResolver(ConfigSchema)`. Campos: rateLimit, timeoutMin, despedida, waUrl, model, temperature, topP, topK. Guardar → PUT `/config`.
- **Tests:** cada pestaña aislada, validaciones, loading states.
- **Reviewer:** UX fluida, validaciones cliente+server, tabla performante.

### T9 — Integración Landing: reemplazar WhatsApp por ChatWidget (`feat sales-gama: landing integration`)
- **Implementador:**
  - `dashboard/src/app/page.tsx`: importa `ChatWidget` al final del body (client component wrapper).
  - Elimina import/uso de `WhatsAppButton` en `LandingInteractiveLayer.tsx` o donde esté.
  - Ajusta `z-index` para no chocar con navbar/modal cookies.
- **Tests:** visual regression (storybook/chromatic) o manual checklist.
- **Reviewer:** sin conflictos visuales, widget visible en mobile/desktop.

### T10 — Integración `/operaciones`: botón + modal (`feat sales-gama: operaciones integration`)
- **Implementador:**
  - `dashboard/src/app/operaciones/page.tsx` (o layout): botón "SALES-GAMA" en header → abre `SalesGamaModal`.
  - Modal solo visible si usuario autenticado (check session existente en `/operaciones`).
- **Tests:** auth guard, modal abre/cierra.
- **Reviewer:** sin acceso no autenticado, modal no rompe layout.

### T11 — Estilos & Accesibilidad (`feat sales-gama: styles & a11y`)
- **Implementador:**
  - CSS modules / Tailwind para `ChatWidget`, `MessageBubble`, `SalesGamaModal`.
  - Dark mode support (respeta `prefers-color-scheme`).
  - Focus visible rings, ARIA labels, `aria-live` en lista mensajes, `role="status"` en avatar thinking.
  - Responsive: mobile panel full-screen, desktop 380px.
  - Animaciones `prefers-reduced-motion` → desactiva keyframes.
- **Tests:** `axe-core` automated a11y, visual regression.
- **Reviewer:** AA compliance, reduced motion, dark mode.

### T12 — Script seed `precios.json` default (`feat sales-gama: seed precios default`)
- **Implementador:** `dashboard/scripts/seed-precios.ts` — genera `config/precios.json` con 10-15 items reales mapeados de tus 20 servicios MD (alarma-casa, alarma-negocio, camaras, monitoreo, cerco, etc.). Ejecuta en build o manual.
- **Tests:** valida schema, cuenta items por categoría.
- **Reviewer:** precios realistas, categorías cubren servicios.

### T13 — Tests E2E (Playwright) (`feat sales-gama: e2e tests`)
- **Implementador:** `dashboard/e2e/sales-gama.spec.ts`
  - Flujo: abre landing → click widget → envía mensaje → ve streaming → click "Hablar con humano" → abre wa.me.
  - Rate limit: 31 mensajes → bloqueo UI.
  - Timeout 5 min (mock time) → despedida.
  - `/operaciones` login → abre modal → edita prompt → guarda → edita precio → valida → ve lead creado.
- **Reviewer:** flakiness <1%, cobertura flujos críticos.

### T14 — Documentación & Limpieza (`feat sales-gama: docs & cleanup`)
- **Implementador:**
  - `docs/sales-gama-bot.md`: guía uso modal, campos JSON, configuración, troubleshooting.
  - Elimina código muerto (WhatsAppButton, imports huérfanos).
  - Actualiza `README.md` sección SALES-GAMA.
- **Reviewer:** docs claras, sin código muerto, build limpio.

### T15 — Merge & Deploy (`feat sales-gama: merge to main`)
- **Implementador:** Rebase sobre `main`, `npm run build` + `npm run lint` + `npm run test` todo verde.
- Push `feature/sales-gama-bot` → PR → merge a `main` (fast-forward).
- Verifica deploy Vercel (build OK, widget funciona en prod).
- **Reviewer:** diff final limpio, deploy verde, smoke test prod.

---

## Orden de Ejecución Sugerido
```
T1 → T2 → T3 → T4 → T5  (backend core)
T6 → T7 → T8            (frontend core)
T9 → T10                (integración)
T11 → T12               (polish + seed)
T13 → T14 → T15         (tests + docs + merge)
```

## Comandos de Verificación Comunes
```bash
cd dashboard
npm run lint
npm run typecheck
npm run test
npm run build
# e2e
npx playwright test e2e/sales-gama.spec.ts
```

---

## Notas para Implementador
- Usa `async/await` + `try/catch` con `NextResponse.json({error}, {status})`.
- Streaming SSE: `ReadableStream` + `TextEncoder`; cierra conexión en `onDone`.
- Supabase: siempre `service_role` en server; nunca exponer clave en client.
- Gemini: `generationConfig: {temperature, topP, topK, maxOutputTokens: 2048}`.
- Prompt sistema base (editable): ver `config_sales_gama.prompt` default en T12.
- `precios.json` se lee en cada request `/chat` (caché 30s en memoria server para performance).
- `localStorage` keys: `sg_session`, `sg_history`, `sg_lastActivity`, `sg_count`.