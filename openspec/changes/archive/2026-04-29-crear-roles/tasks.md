# Tasks: crear-roles

## Phase 1: Infrastructure — Database

- [ ] 1.1 Crear `supabase/migrations/005_create_roles.sql` con tablas: `roles`, `usuario_roles`, `permisos`, `usuario_permisos`
- [ ] 1.2 Añadir RLS policies a todas las tablas nuevas
- [ ] 1.3 Añadir RLS policy a `pedidos` con filtro `created_by = auth.uid()`
- [ ] 1.4 Modificar tabla `pedidos` existente para agregar columna `created_by UUID REFERENCES auth.users(id)`
- [ ] 1.5 Crear script seed `supabase/seeds/002_seed_roles.sql` insertando los 4 roles (admin, proveedor, cliente, repartidor)
- [ ] 1.6 Crear script post-migración `supabase/seeds/003_seed_admin.sql` (placeholder — ejecutar manualmente después de crear el primer usuario)

## Phase 2: Types — TypeScript

- [ ] 2.1 Añadir tipo `Rol` a `lib/supabase/client.ts`
- [ ] 2.2 Añadir tipo `UsuarioRol` a `lib/supabase/client.ts`
- [ ] 2.3 Añadir tipo `Permiso` a `lib/supabase/client.ts`
- [ ] 2.4 Añadir helper `getUserRole(userId: string): Promise<Rol | null>` a `lib/supabase/client.ts`
- [ ] 2.5 Exportar tipo `RolNombre` como unión literal (`'admin' | 'proveedor' | 'cliente' | 'repartidor'`)

## Phase 3: API — Auth Verification

- [ ] 3.1 Modificar `app/api/pedido/route.ts` para verificar `supabase.auth.getUser()` antes de procesar
- [ ] 3.2 Añadir verificación de rol en `app/api/pedido/route.ts` (filtrar por rol "admin" para ver todos)
- [ ] 3.3 Devolver 401 si no hay usuario autenticado en todas las API routes existentes
- [ ] 3.4 Actualizar RLS policy `pedidos_insert_anyone` → `pedidos_insert_auth` (solo usuarios autenticados)

## Phase 4: Cleanup — RLS Legacy

- [ ] 4.1 Eliminar policy `pedidos_insert_anyone` (demasiado permisivo)
- [ ] 4.2 Actualizar `app/dashboard/page.tsx` para filtrar pedidos por `created_by` si no es admin
- [ ] 4.3 Añadir comentarios en migración indicando cómo ejecutar rollback

## Phase 5: Documentation — Scripts

- [ ] 5.1 Documentar en `PRD.md` la estructura de roles y permisos
- [ ] 5.2 Crear `SUPABASE.md` o sección en README explicando cómo asignar roles post-migración

---

**Orden de ejecución:**
1. Phase 1 (Foundation) — debe ir primero
2. Phase 2 (Types) — depende de Phase 1
3. Phase 3 (API) — depende de Phase 2
4. Phase 4 (Cleanup) — depende de Phase 3
5. Phase 5 (Docs) — puede ir en cualquier momento