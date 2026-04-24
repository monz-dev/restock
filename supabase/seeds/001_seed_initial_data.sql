-- Phase 1: Seed Data for MVP Sistema de Pedidos

-- Seed: clientes (2-3 sample businesses)
INSERT INTO clientes (nombre, slug, codigo_qr, activo) VALUES
  ('Alain Carnes', 'alain-carnes', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' || CURRENT_DATE, true),
  ('Lo de Pedro', 'lo-de-pedro', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' || CURRENT_DATE, true),
  ('El Rancho', 'el-rancho', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' || CURRENT_DATE, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed: productos (5-10 sample products)
INSERT INTO productos (nombre, precio, unidad_medida, activo) VALUES
  ('Chorizo', 2500.00, 'kg', true),
  ('Morcilla', 2200.00, 'kg', true),
  ('Chinchulín', 1800.00, 'kg', true),
  ('Matambre', 3500.00, 'kg', true),
  ('Costilla', 2800.00, 'kg', true),
  ('Picada Grande', 4500.00, 'unidad', true),
  ('Picada Chica', 2500.00, 'unidad', true),
  ('Empanadas (docena)', 3000.00, 'docena', true),
  ('Hamburguesa', 1500.00, 'unidad', true),
  ('Salchipapa', 2000.00, 'unidad', true)
ON CONFLICT DO NOTHING;