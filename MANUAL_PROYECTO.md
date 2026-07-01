# MANUAL DE ARQUITECTURA - SISTEMA DE MONITOREO GAMA

## ROL
Ingeniero de Software Senior y Experto en Seguridad Electrónica. Dominio total en protocolos de monitoreo de alarmas (Contact ID), gestión de hardware (paneles DSC, dispositivos Vetti), y despliegue de soluciones SaaS modernas.

## CONTEXTO DEL NEGOCIO
- **Cliente:** Tomás Eduardo Toro-Moreno Olavarría
- **Empresa:** Gama Seguridad (Chile)
- **Problema:** Software legado (Scorpion) genera bases de datos .MDB con contraseña
- **Solución:** Migración de ingesta de datos a la nube para monitoreo en tiempo real y gestión remota

## ESTADO ACTUAL DEL PROYECTO

### Ingesta
- Script `sincronizador.py` operativo
- Extrae de `E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS`
- Conexión a DB protegida (`'Administ'`) mediante pyodbc

### Backend
- **Base de datos:** Supabase (`eventos_monitoreo`)
- **RLS:** Desactivado (`DISABLE ROW LEVEL SECURITY`) para inserción externa
- **Mantenimiento:** Política de borrado de datos > 90 días configurada

### Frontend (Dashboard Web)
- **Framework:** Next.js + Tailwind CSS
- **Conexión:** supabase-js con escucha de cambios en tiempo real (`realtime`)
- **Hosting:** (pendiente)

## LÓGICA DE VISUALIZACIÓN (PALETA DE COLORES)

| Prioridad | Color | Código | Eventos |
|-----------|-------|--------|---------|
| Alta (ROJO) | ![#FF4D4D](https://via.placeholder.com/15/FF4D4D/000000?text=+) | `#FF4D4D` | "ALARMA DE ROBO", "PÁNICO", "INCENDIO" |
| Media (AZUL) | ![#3B82F6](https://via.placeholder.com/15/3B82F6/000000?text=+) | `#3B82F6` | "CIERRE", "CIERRE ESPECIAL" |
| Baja (VERDE) | ![#22C55E](https://via.placeholder.com/15/22C55E/000000?text=+) | `#22C55E` | "APERTURA" |
| Sistema (GRIS) | ![#9CA3AF](https://via.placeholder.com/15/9CA3AF/000000?text=+) | `#9CA3AF` | "AUTOTEST" |

## OBJETIVOS DEL DASHBOARD
- [x] Tabla de eventos: últimos 50 registros ordenados por `fecha_hora` descendente
- [x] Buscador: filtrado en tiempo real por `cuenta` o `nombre_abonado`
- [x] Diseño SaaS profesional tipo "Command Center"
- [x] Diseño responsive (tablets y celulares)
- [x] Estructura preparada para integrar Webhooks de notificaciones futuras

## CREDENCIALES DE INTEGRACIÓN
- **URL Supabase:** `https://onxwyrwmpjxtwlmjrosr.supabase.co`
- **API Key (anon):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs`

## DIRECTRICES TÉCNICAS
- React/Next.js con Tailwind CSS
- supabase-js para conexión y escucha de cambios en tiempo real
- Código limpio, modular y documentado

## ESTRUCTURA DEL PROYECTO

```
E:\MONITOREO ONLINE\
├── .gitignore
├── MANUAL_PROYECTO.md
├── validar_datos.py
├── sincronizador.py
├── credentials.txt (local, excluido por .gitignore)
├── dashboard/          # Aplicación Next.js
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── CommandCenter.tsx
│   │   ├── EventTable.tsx
│   │   ├── EventRow.tsx
│   │   ├── SearchBar.tsx
│   │   ├── StatusBadge.tsx
│   │   └── EventDetail.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.ts
├── BASES DE DATOS/
│   ├── DESPACHOS/      (archivos .MDB por fecha)
│   ├── EVENTOS/        (archivos .MDB por fecha)
│   └── ZONIFICACION/   (archivos .MDB)
```
