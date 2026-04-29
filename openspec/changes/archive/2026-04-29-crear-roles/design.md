# Design: crear-roles

## Technical Approach

Implementar RBAC (Role-Based Access Control) usando:
1. Tablas `roles`, `usuario_roles`, `permisos`, `usuario_permisos` en Supabase
2. Vinculación a `auth.users` existente (sin tabla `usuarios` propia)
3. RLS policies basadas en rol en todas las tablas sensibles
4. Middleware de verificación en API routes

## Architecture Decisions

### Decision: Tabla propia vs auth.users

**Choice**: Tablas `roles` + `usuario_roles` vinculadas a `auth.users`
**Alternatives considered**: Usar `app_meta_data` de auth.users, crear tabla `usuarios` propia
**Rationale**: 
- `app_meta_data` tiene límites de tamaño (1KB)
- Tabla `usuarios` propia requiere sincronización manual
- RLS directo sobre `auth.users` es más simple y menos código

### Decision: Permisos granulares vs roles simples

**Choice**: Tablas `permisos` + `usuario_permisos` para flexibilidad futura
**Alternatives considered**: Solo roles sin permisos custom
**Rationale**: 
- Los permisos se definirán después → mejor modelar desde el inicio
- Estructura N:N permite cualquier combinación futura
- Mínimo overhead si no se usan

### Decision: RLS directo vs aplicación

**Choice**: RLS policies en la base de datos
**Alternatives considered**: Verificación en código Next.js middleware
**Rationale**: 
- RLS es más seguro (no hay bypass posible)
- Supabase optimizado para esto
- Menos código de aplicación

## Data Flow

```
Usuario Login
     │
     ▼
Supabase Auth ──→ user_id
     │
     ▼
RLS Check ──→ usuario_roles ──→ roles
     │
     ▼
Permiso/Denegación
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/005_create_roles.sql` | Create | Tablas roles + RLS |
| `lib/supabase/client.ts` | Modify | Tipos Rol, Permiso, UsuarioRol |
| `app/api/pedido/route.ts` | Modify | Verificar auth en requests |

## Schema SQL

```sql
-- Tabla: roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: usuario_roles (N:N)
CREATE TABLE usuario_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rol_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, rol_id)
);

-- Tabla: permisos
CREATE TABLE permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: usuario_permisos (N:N)
CREATE TABLE usuario_permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permiso_id UUID REFERENCES permisos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permiso_id)
);

-- RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_permisos ENABLE ROW LEVEL SECURITY;

-- Policies: admin puede todo, otros solo leer
CREATE POLICY "admin_full_access" ON roles FOR ALL USING (
  EXISTS (SELECT 1 FROM usuario_roles ur 
    JOIN roles r ON ur.rol_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin')
);
```

## Types TypeScript

```typescript
export type RolNombre = 'admin' | 'proveedor' | 'cliente' | 'repartidor';

export interface Rol {
  id: string;
  nombre: RolNombre;
  descripcion?: string;
  created_at: string;
}

export interface UsuarioRol {
  id: string;
  user_id: string;
  rol_id: string;
  rol?: Rol;
  created_at: string;
}

export interface Permiso {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at: string;
}
```

## Seed Data

```sql
INSERT INTO roles (nombre, descripcion) VALUES
  ('admin', 'Administrador del sistema'),
  ('proveedor', 'Proveedor de productos'),
  ('cliente', 'Cliente que hace pedidos'),
  ('repartidor', 'Repartidor de pedidos')
ON CONFLICT (nombre) DO NOTHING;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Helper `getUserRole()` | Mock supabase auth |
| Integration | RLS policies | Tests directos en Supabase |
| E2E | Login + acceso por rol | Playwright |

## Migration / Rollback

```bash
# Rollback
DROP TABLE IF EXISTS usuario_permisos, permisos, usuario_roles, roles CASCADE;
```

## Open Questions

- [ ] ¿Cómo se asigna el primer admin? (Bootstrapping)
- [ ] ¿Login via Magic Link, OAuth, o email/password?
- [ ] ¿La tabla `clientes` se vincula a auth.users o usa código QR público?