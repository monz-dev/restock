# Tasks: MVP Sistema de Pedidos

## Phase 1: Database / Schema

- [x] 1.1 Create `supabase/migrations/001_create_tables.sql` with tables: clientes, productos, pedidos
- [x] 1.2 Add RLS policies: clientes (public read), productos (public read), pedidos (insert for all, read for provider)
- [x] 1.3 Enable Supabase Realtime on `pedidos` table
- [x] 1.4 Seed `productos` table with 5-10 sample products
- [x] 1.5 Create seed for 2-3 sample clientes with QR codes

## Phase 2: API / Edge Function

- [x] 2.1 Create `app/api/pedido/route.ts` - POST handler that accepts producto_id, extracts cliente_id from URL
- [x] 2.2 Insert into `pedidos` table with timestamp
- [x] 2.3 Return `{ success: true, pedido_id: "uuid" }` response
- [x] 2.4 Handle errors: return 500 with message on failure
- [x] 2.5 Add input validation (producto_id required, valid format)

## Phase 3: Client Page (One-Click Ordering)

- [x] 3.1 Create `app/[slug]/page.tsx` - Dynamic route for client pages
- [x] 3.2 Fetch productos from Supabase on load
- [x] 3.3 Verify cliente_slug exists in database, show 404 if not
- [x] 3.4 Render producto buttons with name, price
- [x] 3.5 Implement onClick handler calling POST /api/pedido
- [x] 3.6 Show confirmation toast "Pedido enviado" for 2s
- [x] 3.7 Handle error state with retry message

## Phase 4: Provider Dashboard

- [x] 4.1 Create `app/dashboard/page.tsx` - Main dashboard page
- [x] 4.2 Fetch last 50 pedidos ordered by timestamp desc
- [x] 4.3 Display pedido cards: cliente_id, producto, hora
- [x] 4.4 Add marca "atendido" / "pendiente" toggle
- [x] 4.5 Update pedido status in database
- [x] 4.6 Empty state: "No hay pedidos todavía"
- [x] 4.7 Mobile-first responsive layout

## Phase 5: Real-Time Integration

- [x] 5.1 Add `useSubscription Supabase Realtime` in `app/dashboard/page.tsx`
- [x] 5.2 Subscribe to INSERT events on pedidos table
- [x] 5.3 Add new pedidos to list without reload
- [x] 5.4 Handle reconnect/resubscribe on connection loss
- [x] 5.5 Add polling fallback every 30s if Realtime disconnected

## Phase 6: Notifications

- [x] 6.1 Create `components/NotificationToast.tsx` - Visual toast component
- [x] 6.2 Play notification sound on new pedidos (configurable)
- [x] 6.3 Add settings UI: toggle sound on/off, toggle push notifications
- [x] 6.4 Request push notification permissions on first visit
- [x] 6.5 Add rate limiting (max 1 notification per minute)
- [x] 6.6 Persist notification settings to localStorage

## Phase 7: PWA Setup

- [x] 7.1 Create `public/manifest.json` with: name, short_name, icons, start_url, display: standalone
- [x] 7.2 Create `public/sw.js` - Service worker with cache-first strategy
- [x] 7.3 Register service worker in `app/layout.tsx`
- [x] 7.4 Cache: root page, images, fonts
- [x] 7.5 Handle offline state in client page

## Phase 8: Testing / Verification

- [ ] 8.1 Write e2e test: Create pedido from client page
- [ ] 8.2 Write e2e test: Verify pedido appears in dashboard <2s
- [ ] 8.3 Write e2e test: Toggle atendidos state
- [ ] 8.4 Verify notification toast appears
- [ ] 8.5 Verify PWA installable in Chrome/Android

## Phase 9: Cleanup / Documentation

- [x] 9.1 Add comments to route.ts and client page
- [x] 9.2 Create README.md with setup instructions
- [x] 9.3 Document QR code generation for new clients
- [x] 9.4 Clean up any temporary debug code