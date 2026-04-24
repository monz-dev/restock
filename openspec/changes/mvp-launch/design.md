# Design: mvp-launch

## Technical Approach

MVP Sistema de Pedidos usando Next.js 14 App Router + Supabase (Postgres + Realtime). Tres specs se implementan en paralelo: one-click-ordering (página cliente), realtime-dashboard (dashboard proveedor), order-notification (notificaciones).

## Architecture Decisions

### Decision: Routing Strategy

**Choice**: Next.js App Router con Dynamic Routes `[cliente_id]`
**Alternatives considered**: pagesRouter, Supabase Edge Functions con catch-all routes
**Rationale**: App Router ofrece mejor performance con Server Components, SEO nativo, y estructura de archivos intuitiva. Dynamic routes permiten `/cliente-123` sin configuración adicional.

### Decision: API Endpoint Location

**Choice**: Next.js Route Handler (`app/api/pedido/route.ts`) en lugar de Supabase Edge Functions
**Alternatives considered**: Edge Functions en `/pedido` endpoint externo
**Rationale**: Mantiene todo en un solo proyecto Next.js. Easier deployment (Vercel). Edge Functions son útiles para lógica serverless compleja — aquí es simple INSERT. Siguiente fase puede migrar si se necesita más scale.

### Decision: Database Schema

**Choice**: Tres tablas independientes (clientes, productos, pedidos) con Foreign Keys
**Alternatives considered**: Single table con JSONB, única tabla pedidos
**Rationale**: Normalización facilita queries posteriores, integridad referencial, y scalability. No hay requisitos de NoSQL en MVP.

### Decision: Realtime Implementation

**Choice**: Supabase Postgres Changes (REPLICA IDENTITY) + cliente `@supabase/supabase-js` con `channel.subscribe()`
**Alternatives considered**: WebSocket manual, polling, Supabase Broadcast
**Rationale**: Postgres Changes detecta cambios en la tabla `pedidos` automáticamente. No requiere Edge Functions adicionales. Broadcast es para mensajes efímeros, no persistencia.

### Decision: PWA Setup

**Choice**: Manual manifest.json + service worker (fuera de `/app` dir, en `/public`)
**Alternatives considered**: `next-pwa` library
**Rationale**: Mayor control sobre caching strategy. `next-pwa` tiene issues conocidos con App Router. Service worker simple para offline fallback en cliente.

## Data Flow

```
[Cliente Móvil]
     │
     ▼ (tap producto)
app/api/pedido/route.ts
     │
     ▼ POST / INSERT
Supabase: pedidos table
     │
     ▼ (Realtime: Postgres Changes)
[suscripción realtime]
     │
     ▼ (broadcast)
Dashboard Web ──► Notificación visual + sonora
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/[cliente_id]/page.tsx` | Create | Página cliente con botones de productos |
| `app/dashboard/page.tsx` | Create | Dashboard proveedor con lista realtime |
| `app/api/pedido/route.ts` | Create | POST endpoint para crear pedido |
| `app/layout.tsx` | Modify | Agregar providers (Supabase client) |
| `app/globals.css` | Create | Estilos base, variables CSS |
| `lib/supabase/client.ts` | Create | Supabase browser client |
| `lib/supabase/server.ts` | Create | Supabase server client |
| `types/index.ts` | Create | TypeScript interfaces |
| `supabase/schema.sql` | Create | DDL: clientes, productos, pedidos |
| `supabase/seed.sql` | Create | Datos iniciales |
| `public/manifest.json` | Create | PWA manifest |
| `public/sw.js` | Create | Service worker |
| `public/icons/*.png` | Create | Íconos PWA |
| `public/sounds/notification.mp3` | Create | Audio notificación |

## Database Schema

```sql
-- clientes: identificar comercio
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- cliente_id en URL
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- productos: items disponibles
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  unidad_medida TEXT DEFAULT 'unidad',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pedidos: registro de solicitudes
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER DEFAULT 1,
  estado TEXT DEFAULT 'pendiente',  -- pendiente | atendido
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime: REPLICA IDENTITY para Postgres Changes
ALTER TABLE pedidos REPLICA IDENTITY FULL;
```

## API Contract

### POST /api/pedido

**Request**:
```json
{
  "producto_id": "uuid"
}
```
- `cliente_id` se extrae del path `[cliente_id]` en la URL

**Response** (201):
```json
{
  "success": true,
  "pedido_id": "uuid",
  "message": "Pedido enviado"
}
```

**Error** (400/500):
```json
{
  "success": false,
  "error": "mensaje descriptivo"
}
```

## Interfaces / Contracts

```typescript
// types/index.ts
interface Cliente {
  id: string;
  nombre: string;
  slug: string;
}

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  unidad_medida: string;
}

interface Pedido {
  id: string;
  cliente_id: string;
  producto_id: string;
  cantidad: number;
  estado: 'pendiente' | 'atendido';
  created_at: string;
}
```

## Realtime Setup

```typescript
// lib/supabase/realtime.ts
const supabase = createClient(...)
const channel = supabase
  .channel('pedidos')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'pedidos'
  }, (payload) => {
    // actualizar UI + mostrar notificación
  })
  .subscribe()
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | helpers, utils, types | Vitest |
| Integration | API route con test request | Vitest + supertest / Next.js test client |
| E2E | Flujo completo cliente→pedido→dashboard | Playwright (mobile viewport) |

## Migration / Rollout

No migration required — schema inicial. Datos seed (clientes, productos) se crean con script.

**Rollout**:
1. Deploy Next.js (Vercel)
2. Ejecutar `schema.sql` en Supabase
3. Ejecutar `seed.sql` para datos demo
4. Configurar Realtime en Supabase Dashboard
5. Testear flujo completo

## Open Questions

- [ ] ¿Necesitamos rate limiting en `/api/pedido`? (spam prevention)
- [ ] ¿Cuál es la estrategia de caching para lista de productos? (SSG vs ISR vs client fetch)
- [ ] ¿El manifest.json debe residir en `/app` o `/public` en App Router?