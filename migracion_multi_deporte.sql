-- Migración: soporte multi-deporte
-- Añade columna deporte a la tabla players para que cada jugador
-- tenga su propio deporte asignado (independiente del deporte del club).

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS deporte TEXT;

-- Índice para filtros por deporte dentro de un club
CREATE INDEX IF NOT EXISTS idx_players_club_deporte ON players (club_id, deporte);

-- Nota: clubs.config sigue siendo JSONB.
-- config.deporte (string) existente → retrocompatible.
-- config.deportes (array) nuevo → normalizado por getDeportesClub() en db.js.
-- No se requiere ALTER TABLE en clubs.
