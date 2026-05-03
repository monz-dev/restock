-- Migration: 007_create_usuario_clientes
-- Tabla N:N entre usuarios y clientes (comercios)
-- Execute: psql $DATABASE_URL -f 007_create_usuario_clientes.sql

-- ============================================
-- TABLA: usuario_clientes (N:N)
-- ============================================
CREATE TABLE IF NOT EXISTS usuario_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, cliente_id)
);

-- ============================================
-- RLS: Habilitar
-- ============================================
ALTER TABLE usuario_clientes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: usuario_clientes
-- ============================================
-- Usuarios pueden leer sus propios clientes asignados
CREATE POLICY "usuario_clientes_read_own" ON usuario_clientes FOR SELECT USING (usuario_id = auth.uid());

-- Admin puede leer todos
CREATE POLICY "usuario_clientes_admin_read" ON usuario_clientes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
);

-- Admin puede insertar/modificar
CREATE POLICY "usuario_clientes_admin_all" ON usuario_clientes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
);

-- ============================================
-- INDEX: performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuario_clientes_usuario_id ON usuario_clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_clientes_cliente_id ON usuario_clientes(cliente_id);

-- ============================================
-- ROLLBACK (ejecutar manualmente si es necesario)
-- ============================================
-- DROP TABLE IF EXISTS usuario_clientes CASCADE;
