-- Phase: Sistema de Roles y Permisos - MVP
-- Migration: 005_create_roles
-- Roles: admin, proveedor, cliente, repartidor
-- Execute: psql $DATABASE_URL -f 005_create_roles.sql

-- ============================================
-- TABLA: roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: usuario_roles (N:N)
-- ============================================
CREATE TABLE IF NOT EXISTS usuario_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rol_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, rol_id)
);

-- ============================================
-- TABLA: permisos
-- ============================================
CREATE TABLE IF NOT EXISTS permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: usuario_permisos (N:N)
-- ============================================
CREATE TABLE IF NOT EXISTS usuario_permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permiso_id UUID REFERENCES permisos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permiso_id)
);

-- ============================================
-- RLS: Habilitar en todas las tablas nuevas
-- ============================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_permisos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: roles
-- ============================================
-- Todos pueden leer roles (necesario para UI de login)
CREATE POLICY "roles_public_read" ON roles FOR SELECT USING (true);
-- Solo admin puede modificar roles
CREATE POLICY "roles_admin_all" ON roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
);

-- ============================================
-- RLS POLICIES: usuario_roles
-- ============================================
-- Usuarios pueden leer sus propios roles
CREATE POLICY "usuario_roles_read_own" ON usuario_roles FOR SELECT USING (user_id = auth.uid());
-- Admin puede leer todos
CREATE POLICY "usuario_roles_admin_read" ON usuario_roles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
);
-- Usuarios pueden insertar sus propios roles (asignación manual por admin vía trigger)
CREATE POLICY "usuario_roles_insert" ON usuario_roles FOR INSERT WITH CHECK (user_id = auth.uid());
-- Admin puede modificar todos
CREATE POLICY "usuario_roles_admin_all" ON usuario_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
);

-- ============================================
-- RLS POLICIES: permisos
-- ============================================
-- Todos pueden leer permisos
CREATE POLICY "permisos_public_read" ON permisos FOR SELECT USING (true);
-- Solo admin puede modificar permisos
CREATE POLICY "permisos_admin_all" ON permisos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
);

-- ============================================
-- RLS POLICIES: usuario_permisos
-- ============================================
-- Usuarios pueden leer sus propios permisos
CREATE POLICY "usuario_permisos_read_own" ON usuario_permisos FOR SELECT USING (user_id = auth.uid());
-- Admin puede leer todos
CREATE POLICY "usuario_permisos_admin_read" ON usuario_permisos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
);

-- ============================================
-- TABLA PEDIDOS: agregar created_by
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- ============================================
-- RLS POLICIES: pedidos (actualizar existente)
-- ============================================
-- Primero eliminar policies antiguas demasiado permisivas
DROP POLICY IF EXISTS "pedidos_insert_anyone" ON pedidos;
DROP POLICY IF EXISTS "pedido_update_estado" ON pedidos;
DROP POLICY IF EXISTS "pedidos_read_all" ON pedidos;

-- Policy: lectura filtrada por rol
-- - admin ve todos
-- - cliente ve solo sus pedidos
-- - repartidor ve solo despachados
-- - proveedor ve todos
CREATE POLICY "pedidos_read" ON pedidos FOR SELECT USING (
  -- Admin o proveedor ven todo
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre IN ('admin', 'proveedor')
  )
  OR
  -- Cliente ve solo sus pedidos
  (
    EXISTS (
      SELECT 1 FROM usuario_roles ur
      JOIN roles r ON ur.rol_id = r.id
      WHERE ur.user_id = auth.uid() AND r.nombre = 'cliente'
    )
    AND pedidos.created_by = auth.uid()
  )
  OR
  -- Repartidor ve solo pedidos despachados
  (
    EXISTS (
      SELECT 1 FROM usuario_roles ur
      JOIN roles r ON ur.rol_id = r.id
      WHERE ur.user_id = auth.uid() AND r.nombre = 'repartidor'
    )
    AND pedidos.estado = 'despachado'
  )
);

-- Policy: inserción solo usuarios autenticados
CREATE POLICY "pedidos_insert" ON pedidos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: update para admin y repartidor (cambiar estado)
CREATE POLICY "pedidos_update_estado" ON pedidos FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM usuario_roles ur
      JOIN roles r ON ur.rol_id = r.id
      WHERE ur.user_id = auth.uid() AND r.nombre = 'repartidor'
    )
    AND pedidos.estado = 'despachado'
  )
);

-- ============================================
-- INDEX: performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuario_roles_user_id ON usuario_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol_id ON usuario_roles(rol_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_by ON pedidos(created_by);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);

-- ============================================
-- TRIGGER: auto-assign created_by en pedidos
-- ============================================
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_pedidos_created_by ON pedidos;
CREATE TRIGGER set_pedidos_created_by
  BEFORE INSERT ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- ============================================
-- SEED: roles iniciales
-- ============================================
INSERT INTO roles (nombre, descripcion) VALUES
  ('admin', 'Administrador del sistema - acceso total'),
  ('proveedor', 'Proveedor de productos - CRUD productos'),
  ('cliente', 'Cliente que hace pedidos - CRUD pedidos propios'),
  ('repartidor', 'Repartidor de pedidos - actualizar estado delivery')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- ROLLBACK (ejecutar manualmente si es necesario)
-- ============================================
-- DROP TRIGGER IF EXISTS set_pedidos_created_by ON pedidos;
-- DROP FUNCTION IF EXISTS set_created_by();
-- DROP TABLE IF EXISTS usuario_permisos, permisos, usuario_roles, roles CASCADE;
-- ALTER TABLE pedidos DROP COLUMN IF EXISTS created_by;