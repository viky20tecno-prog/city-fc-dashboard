-- Migración: agregar campos completos del jugador a la tabla players
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS tipo_id              TEXT,
  ADD COLUMN IF NOT EXISTS correo_electronico   TEXT,
  ADD COLUMN IF NOT EXISTS instagram            TEXT,
  ADD COLUMN IF NOT EXISTS lugar_de_nacimiento  TEXT,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento     DATE,
  ADD COLUMN IF NOT EXISTS tipo_sangre          TEXT,
  ADD COLUMN IF NOT EXISTS eps                  TEXT,
  ADD COLUMN IF NOT EXISTS estatura             NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS peso                 NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS barrio               TEXT,
  ADD COLUMN IF NOT EXISTS direccion            TEXT,
  ADD COLUMN IF NOT EXISTS familiar_emergencia  TEXT,
  ADD COLUMN IF NOT EXISTS celular_contacto     TEXT,
  ADD COLUMN IF NOT EXISTS foto_url             TEXT,
  ADD COLUMN IF NOT EXISTS notas                TEXT;

-- ── Storage: bucket de fotos de jugadores ─────────────────────────────────
-- Crea el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-photos',
  'player-photos',
  true,
  3145728,   -- 3 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquiera puede VER las fotos (bucket público)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'player-photos: lectura pública'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "player-photos: lectura pública"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'player-photos');
    $p$;
  END IF;
END$$;

-- Política: usuarios autenticados pueden SUBIR fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'player-photos: subida autenticada'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "player-photos: subida autenticada"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'player-photos');
    $p$;
  END IF;
END$$;

-- Política: usuarios autenticados pueden ACTUALIZAR (reemplazar) fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'player-photos: actualización autenticada'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "player-photos: actualización autenticada"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'player-photos');
    $p$;
  END IF;
END$$;
