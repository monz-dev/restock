# Proposal: MVP Sistema de Pedidos

## Intent

Crear un sistema web mobile-first que permita a comercios locales solicitar productos con un solo clic, sin autenticación, con registro en base de datos y notificaciones en tiempo real para el proveedor.

**Propósito del MVP**: Validar adopción por comercios y funcionamiento del flujo completo de pedidos.

---

## Scope

### In Scope

- Página cliente mobile-first con botones por producto (sin autenticación)
- URL única por cliente (identificador en path)
- API endpoint para crear pedidos (`POST /api/pedido`)
- Registro en tabla `pedidos` con: cliente_id, producto_id, unidad_medida, timestamp
- Dashboard básico para proveedor (lista de pedidos recientes)
- Notificaciones en tiempo real vía Supabase Realtime
- Confirmación visual "Pedido enviado" al cliente
- PWA-capable (manifest + service worker)

### Out of Scope

- Carrito de compras multi-producto
- Sistema de pagos
- Gestión de inventario
- Historial de pedidos por cliente
- Múltiples proveedores
- Notificaciones WhatsApp
- App móvil nativa

---

## Capabilities

### New Capabilities

- `one-click-ordering`: Página cliente con botones por producto, sin auth, un clic = 1 pedido
- `realtime-dashboard`: Dashboard móvil que muestra pedidos en tiempo real
- `order-notification`: Sistema de notificaciones push/web en tiempo real

---

## Approach

**Stack**: Next.js 14 (App Router) + Supabase (Postgres + Edge Functions + Realtime) + PWA

### Arquitectura

```
[Cliente Móvil] → [URL única: /[cliente_id]] → [Edge Function /api/pedido]
                                                    ↓
                                           [Tabla: pedidos]
                                                    ↓
                                           [Supabase Realtime]
                                                    ↓
                                           [Dashboard: /dashboard]
```

### Decisiones técnicas

- **Sin auth**: URL única como identificador de cliente (más simple, MVP)
- **Un pedido por clic**: Cada botón genera pedido independiente (no carrito)
- **Realtime**: Suscripción a cambios en tabla `pedidos` via Supabase
- **PWA**: next-pwa o manual service worker + manifest.json

---

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/[cliente_id]/page.tsx` | New | Página principal del cliente con botones |
| `app/dashboard/page.tsx` | New | Dashboard del proveedor |
| `app/api/pedido/route.ts` | New | Edge Function para crear pedidos |
| `supabase/schema.sql` | New | Tablas: clientes, productos, pedidos |
| `public/manifest.json` | New | PWA manifest |
| `public/sw.js` | New | Service worker |

---

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Baja adopción comercios | Med | UX ultra-simple, prueba con 2-3 clientes reales |
| Notificaciones no funcionan | Med | Fallback a polling cada 30s en dashboard |
| URL compartida/colgada | Low | QR code por cliente para acceso rápido |

---

## Rollback Plan

- Revertir edge function: retornar 503 y mostrar mensaje "Sistema temporalmente unavailable"
- Frontend: página estática con lista de contactos (teléfono proveedor)
- DB: datos se mantienen, no se pierden

---

## Dependencies

- Supabase project configurado con Realtime habilitado
- Edge Functions desplegadas
- Dominio/URL accesible desde móvil

---

## Success Criteria

- [ ] 2+ comercios usando el sistema en 2 semanas
- [ ] ≥10 pedidos registrados
- [ ] Dashboard muestra pedidos en <2s después de crear
- [ ] Notificación arrives al dashboard sin recargar
- [ ] PWA instalable en Android/Chrome
- [ ] Tiempo de respuesta <2s end-to-end