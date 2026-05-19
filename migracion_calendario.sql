-- Migración: Crear tabla calendario (eventos del club)
-- Ejecutar en Supabase SQL Editor → https://supabase.com/dashboard/project/olcevdnhmexaahymfzii/sql

CREATE TABLE IF NOT EXISTS calendario (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      TEXT        NOT NULL,
  tipo         TEXT        NOT NULL DEFAULT 'ENTRENAMIENTO'
                 CHECK (tipo IN ('PARTIDO', 'ENTRENAMIENTO', 'EVENTO')),
  titulo       TEXT        NOT NULL,
  descripcion  TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin    TIMESTAMPTZ,
  lugar        TEXT,
  equipo       TEXT,
  created_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendario_club_fecha
  ON calendario(club_id, fecha_inicio);

-- Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'calendario'
ORDER BY ordinal_position;
