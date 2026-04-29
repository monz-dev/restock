## Exploration: crear-roles

### Current State
Sistema MVP de pedidos **sin sistema de autenticación**. 
- Tabla `clientes` (comercios que piden productos)
- Tabla `productos` (items disponibles)
- Tabla `pedidos` (registro de solicitudes)
- RLS policies muy permisivas (cualquiera puede insertar)
- **No hay usuarios, ni auth, ni roles**

### Affected Areas
- `lib/supabase/client.ts` — necesita tipos para Usuario/Rol
- `supabase/migrations/` — necesita nuevas tablas y RLS
- `app/dashboard/page.tsx` — dashboard actual muestra pedidos sin filtro por rol
- `app/[slug]/page.tsx` — cliente ve productos públicos
- `app/api/pedido/route.ts` — endpoint que inserta pedidos

### Approaches

1. **RBAC en Supabase Auth (app_meta)** — Usar `auth.users` con `app_meta_data` para roles
   - Pros: Integrado en Supabase, sin tabla extra, RLS directo
   - Cons: app_meta tiene límites de tamaño, menos flexible
   - Effort: Medium

2. **Tabla `usuarios` propia** — Crear tabla `usuarios` vinculada a `auth.users`
   - Pros: Flexible, metadatos ricos, fácil de consultar
   - Cons: Más código, doble sincronización
   - Effort: High

3. **Tabla `roles` + `usuario_roles`** — Normalizar con tabla de roles y relación N:N
   - Pros: Máximo control, permisos granulares, escalable
   - Cons: Más complejo, múltiples tablas
   - Effort: High

### Recommendation
**Opción 3 (Tabla `roles` + `usuario_roles`)** porque:
- Los permisos se definirán después → mejor modelar normalizado
- Es el MVP inicial → escalable para futuro
- Los 4 roles definidos (admin, proveedor, cliente, repartidor) mapean directo

### Risks
- RLS policies actuales (`pedidos_insert_anyone`) deben restringirse
- Sin auth existente, toca implementar login completo
- Migraciones现有 datos no tienen `created_by` todavía

### Ready for Proposal
**Sí**, pero con pregunta pendiente:
> ¿El usuario ya tiene clara la estructura de permisos o lo definirá después? Esto impacta en el esfuerzo del diseño.