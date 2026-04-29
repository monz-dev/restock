-- Phase: Permisos por Rol
-- Migration: 006_create_permisos
-- Execute: psql $DATABASE_URL -f 006_create_permisos.sql

-- ============================================
-- TABLA: rol_permisos (N:N entre roles y permisos)
-- ============================================
CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permiso_id UUID REFERENCES permisos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (rol_id, permiso_id)
);

-- RLS en rol_permisos
ALTER TABLE rol_permisos ENABLE ROW LEVEL SECURITY;

-- Policy: todos pueden leer
CREATE POLICY "rol_permisos_read" ON rol_permisos FOR SELECT USING (true);

-- Policy: solo admin puede modificar
CREATE POLICY "rol_permisos_admin_all" ON rol_permisos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON ur.rol_id = r.id
    WHERE ur.user_id = auth.uid() AND r.nombre = 'admin'
  )
);

-- ============================================
-- SEED: permisos individuales
-- ============================================
INSERT INTO permisos (nombre, descripcion) VALUES
  ('gestionar_usuarios', 'Crear, editar, eliminar usuarios'),
  ('crear_productos', 'Crear nuevos productos'),
  ('editar_productos', 'Editar productos existentes'),
  ('eliminar_productos', 'Eliminar productos'),
  ('ver_todos_pedidos', 'Ver todos los pedidos del sistema'),
  ('editar_pedidos', 'Editar cualquier pedido'),
  ('gestionar_roles', 'Asignar roles a usuarios'),
  ('ver_pedidos', 'Ver pedidos (según rol)'),
  ('crear_pedidos', 'Crear nuevos pedidos'),
  ('ver_pedidos_propios', 'Ver solo los pedidos propios'),
  ('editar_pedidos_propios', 'Editar solo los pedidos propios'),
  ('ver_pedidos_despachados', 'Ver pedidos en estado despachado'),
  ('actualizar_estado_entrega', 'Actualizar estado de entrega de pedidos')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- ASIGNAR PERMISOS A ROLES
-- ============================================

-- Admin: todos los permisos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'admin'
AND p.nombre IN (
  'gestionar_usuarios',
  'crear_productos',
  'editar_productos',
  'eliminar_productos',
  'ver_todos_pedidos',
  'editar_pedidos',
  'gestionar_roles',
  'ver_pedidos',
  'crear_pedidos',
  'ver_pedidos_propios',
  'editar_pedidos_propios',
  'ver_pedidos_despachados',
  'actualizar_estado_entrega'
)
ON CONFLICT DO NOTHING;

-- Proveedor: permisos de productos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'proveedor'
AND p.nombre IN (
  'crear_productos',
  'editar_productos',
  'eliminar_productos',
  'ver_pedidos',
  'crear_pedidos'
)
ON CONFLICT DO NOTHING;

-- Cliente: permisos de pedidos propios
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'cliente'
AND p.nombre IN (
  'crear_pedidos',
  'ver_pedidos_propios',
  'editar_pedidos_propios'
)
ON CONFLICT DO NOTHING;

-- Repartidor: permisos de entrega
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'repartidor'
AND p.nombre IN (
  'ver_pedidos_despachados',
  'actualizar_estado_entrega'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICAR ASIGNACIONES
-- ============================================
SELECT 
  r.nombre as rol,
  array_agg(p.nombre) as permisos
FROM roles r
LEFT JOIN rol_permisos rp ON rp.rol_id = r.id
LEFT JOIN permisos p ON p.id = rp.permiso_id
GROUP BY r.nombre
ORDER BY r.nombre;