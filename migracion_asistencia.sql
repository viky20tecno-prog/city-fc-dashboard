-- Tabla control de asistencia a eventos del calendario
CREATE TABLE IF NOT EXISTS asistencia (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id      UUID        NOT NULL,
  club_id        TEXT        NOT NULL,
  cedula         TEXT        NOT NULL,
  estado         TEXT        NOT NULL DEFAULT 'PENDIENTE'
                   CHECK (estado IN ('PRESENTE', 'AUSENTE', 'JUSTIFICADO', 'PENDIENTE')),
  nota           TEXT,
  registrado_por UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evento_id, cedula)
);

CREATE INDEX IF NOT EXISTS idx_asistencia_evento  ON asistencia(evento_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_club    ON asistencia(club_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_jugador ON asistencia(club_id, cedula);
