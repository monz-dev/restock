# Proposal: crear-roles

## Intent

Sistema actual tiene tablas `clientes`, `productos`, `pedidos` **sin autenticación ni control de acceso**. Necesitamos implementar roles para admin, proveedor, cliente y repartidor con sus permisos correspondientes.

## Scope

### In Scope
- Tabla `roles` con los 4 roles definidos
- Tabla `usuario_roles` (vinculación N:N con `auth.users`)
- Tabla `permisos` (estructura para permisos custom)
- Tabla `usuario_permisos` (vinculación N:N)
- Migración SQL con RLS policies restrictivas
- Middleware/hooks de Supabase para enforcement

### Out of Scope
- Login/registro de usuarios (difícil para después)
- UI de gestión de roles (para sprint futuro)
- Asignación de roles a usuarios existentes
- Definición de permisos específicos (usuario los definirá)

## Capabilities

### New Capabilities
- `user-roles`: Sistema de roles vinculado a auth.users con RLS
- `role-based-access`: Control de acceso granular por rol en tablas

### Modified Capabilities
- `pedido-workflow`: Añadir `created_by` y filtro por rol/usuario

## Approach

1. Crear tablas `roles`, `usuario_roles`, `permisos`, `usuario_permisos`
2. Vincular a `auth.users` via `user_id` (no crear tabla `usuarios` propia)
3. RLS policies basadas en rol
4. Migración SQL idempotente (IF NOT EXISTS)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/` | New | Migration con tablas y RLS |
| `lib/supabase/client.ts` | Modified | Tipos para roles y permisos |
| `app/api/pedido/route.ts` | Modified | Filtrar por usuario autenticado |

## Risks

| Risk | Likelihood | Mitigation |
|------|--------|-------------|
| Romper RLS existentes | Med | Review de policies en paralelo |
| Migración sin auth funciona | High | Feature flag, gradual rollout |

## Rollback Plan

`DROP TABLE IF EXISTS usuario_permisos, permisos, usuario_roles, roles CASCADE;`

## Dependencies

- Supabase Auth configurado y activo

## Success Criteria

- [ ] Tablas `roles` y `usuario_roles` creadas con datos seed
- [ ] RLS permite solo acceso por rol definido
- [ ] Tipo `Rol` disponible en `lib/supabase/client.ts`