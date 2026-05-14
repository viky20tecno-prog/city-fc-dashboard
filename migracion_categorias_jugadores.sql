-- =====================================================================
-- MIGRACIÓN: Soporte de categorías por jugador
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =====================================================================

-- 1. Columna simple para compatibilidad (categoría principal)
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS categoria  TEXT,
  ADD COLUMN IF NOT EXISTS equipo     TEXT;

-- 2. Columna JSONB para múltiples categorías
--    Formato: [{categoria: "U12", equipo: "U12 A"}, {categoria: "Primera", equipo: ""}]
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS categorias JSONB DEFAULT '[]'::jsonb;

-- 3. Migrar datos existentes: si ya tiene categoria/equipo, llenar categorias[]
UPDATE players
SET categorias = jsonb_build_array(
  jsonb_build_object('categoria', categoria, 'equipo', COALESCE(equipo, ''))
)
WHERE categoria IS NOT NULL
  AND categoria <> ''
  AND (categorias IS NULL OR categorias = '[]'::jsonb);

-- Verificación
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'players'
  AND column_name IN ('categoria', 'equipo', 'categorias');
