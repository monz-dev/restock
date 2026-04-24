-- Phase 1: MVP Sistema de Pedidos - Schema
-- Migration: 001_create_clientes_productos_pedidos
-- Execute: psql $DATABASE_URL -f 001_create_clientes_productos_pedidos.sql

-- Table: clientes (comercios que hacen pedidos)
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  codigo_qr TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: productos (items disponibles para pedir)
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  unidad_medida TEXT DEFAULT 'unidad',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: pedidos (registro de solicitudes)
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER DEFAULT 1,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime on pedidos table
ALTER TABLE pedidos REPLICA IDENTITY FULL;

-- RLS: Enable on all tables
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- RLS: clientes - public read
CREATE POLICY "clientes_public_read" ON clientes FOR SELECT USING (true);

-- RLS: productos - public read (only active)
CREATE POLICY "productos_public_read" ON productos FOR SELECT USING (activo = true);

-- RLS: pedidos - anyone can insert
CREATE POLICY "pedidos_insert_anyone" ON pedidos FOR INSERT WITH CHECK (true);

-- RLS: pedidos - read all
CREATE POLICY "pedidos_read_all" ON pedidos FOR SELECT USING (true);

-- RLS: pedidos - update for marking attended
CREATE POLICY "pedido_update_estado" ON pedidos FOR UPDATE USING (true);