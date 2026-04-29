-- Migration: 002_add_orden_id_to_pedidos
-- Adds orden_id column to group items from the same order submission

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS orden_id UUID DEFAULT gen_random_uuid();

-- Index for efficient grouping queries
CREATE INDEX IF NOT EXISTS idx_pedidos_orden_id ON pedidos(orden_id);
