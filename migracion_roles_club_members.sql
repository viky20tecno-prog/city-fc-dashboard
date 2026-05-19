-- Migración: Crear tabla club_members (sistema de roles)
-- Ejecutar en Supabase SQL Editor → https://supabase.com/dashboard/project/olcevdnhmexaahymfzii/sql

CREATE TABLE IF NOT EXISTS club_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL,
  club_id    TEXT        NOT NULL,   -- slug del club (ej: 'city-fc')
  role       TEXT        NOT NULL DEFAULT 'ENTRENADOR'
               CHECK (role IN ('ADMIN', 'ENTRENADOR', 'JUGADOR')),
  nombre     TEXT,
  activo     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsquedas frecuentes por usuario + club
CREATE INDEX IF NOT EXISTS idx_club_members_user_club
  ON club_members(user_id, club_id);

-- Verificar estructura resultante
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'club_members'
ORDER BY ordinal_position;
