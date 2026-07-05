-- ============================================================
-- Migración: vincular inscripciones de torneos por ID estable
-- Ejecutar en: https://supabase.com/dashboard/project/olcevdnhmexaahymfzii/sql
--
-- Antes de esto, cada inscripción se vinculaba a su torneo por el
-- texto del nombre (columna nombre_torneo). Si el admin editaba el
-- nombre del torneo en la config del club, todas las inscripciones
-- ya creadas quedaban "huérfanas" porque el nombre ya no coincidía.
--
-- Esta migración agrega una columna torneo_id (UUID) que referencia
-- el `id` estable del torneo dentro de clubs.config.torneos_iniciales.
-- Renombrar un torneo ya no rompe el vínculo con sus inscripciones.
-- ============================================================

ALTER TABLE torneos ADD COLUMN IF NOT EXISTS torneo_id UUID;
CREATE INDEX IF NOT EXISTS idx_torneos_torneo_id ON torneos(torneo_id);

-- Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'torneos'
ORDER BY ordinal_position;
