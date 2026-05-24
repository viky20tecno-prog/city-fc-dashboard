-- ============================================================
-- Migración: Becas y Descuentos por Jugador
-- Ejecutar en: https://supabase.com/dashboard/project/olcevdnhmexaahymfzii/sql
-- ============================================================

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS descuento_pct  NUMERIC(5,2) DEFAULT 0
    CHECK (descuento_pct >= 0 AND descuento_pct <= 100),
  ADD COLUMN IF NOT EXISTS tipo_descuento TEXT DEFAULT 'NA'
    CHECK (tipo_descuento IN ('NA', 'BECA_DEPORTIVA', 'BECA_SOCIAL', 'CONDICION_ESPECIAL'));

-- Verificar
SELECT cedula, nombre, descuento_pct, tipo_descuento
FROM players
LIMIT 10;
