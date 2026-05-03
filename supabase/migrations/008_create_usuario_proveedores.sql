-- Migration: 008_create_usuario_proveedores
-- Tabla N:N entre usuarios y proveedores
-- Execute: psql $DATABASE_URL -f 008_create_usuario_proveedores.sql

-- ============================================
-- TABLA: usuario_proveedores (N:N)
-- ============================================
CREATE TABLE IF NOT EXISTS usuario_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, proveedor_id)
);

-- ============================================
-- RLS: Habilitar
-- ============================================
ALTER TABLE usuario_proveedores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: usuario_proveedores
-- ============================================
-- Usuarios pueden leer sus propios proveedores asignados
CREATE POLICY "usuario_proveedores_read_own" ON usuario_proveedores FOR SELECT USING (usuario_id = auth.uid());

-- Admin puede leer todos
CREATE POLICY "usuario_proveedores_admin_read" ON usuario_proveedores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
);

-- Admin puede insertar/modificar
CREATE POLICY "usuario_proveedores_admin_all" ON usuario_proveedores FOR ALL USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
);

-- ============================================
-- INDEX: performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuario_proveedores_usuario_id ON usuario_proveedores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_proveedores_proveedor_id ON usuario_proveedores(proveedor_id);

-- ============================================
-- ROLLBACK (ejecutar manualmente si es necesario)
-- ============================================
-- DROP TABLE IF EXISTS usuario_proveedores CASCADE;
