-- Ejecutar en Supabase → SQL Editor ANTES de hacer deploy del código
-- Agrega campo tipo_origen a tabla pagos

ALTER TABLE pagos ADD COLUMN IF NOT EXISTS tipo_origen TEXT;

-- Verificación: debe mostrar la columna nueva
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pagos' AND column_name = 'tipo_origen';
