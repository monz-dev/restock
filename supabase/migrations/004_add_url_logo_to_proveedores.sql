-- Migration: 004_add_url_logo_to_proveedores
-- Agregar campo para URL del logo del proveedor (almacenado en Supabase Storage)

ALTER TABLE proveedores 
ADD COLUMN IF NOT EXISTS url_logo TEXT;

-- Agregar comentario para documentación
COMMENT ON COLUMN proveedores.url_logo IS 'URL del logo del proveedor almacenada en Supabase Storage (bucket: img)';
