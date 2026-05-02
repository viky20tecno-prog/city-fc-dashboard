-- =====================================================================
-- MIGRACIÓN: Hoja de Vida del Jugador — City FC
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =====================================================================

-- 1. Columnas nuevas en la tabla players
ALTER TABLE players ADD COLUMN IF NOT EXISTS foto_url         TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS posicion         TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS numero_camiseta  INTEGER;

-- 2. Bucket de Storage para fotos de jugadores
--    (público para que las URLs funcionen sin autenticación)
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS: lectura pública (cualquiera puede ver las fotos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read player photos'
  ) THEN
    CREATE POLICY "Public read player photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'player-photos');
  END IF;
END $$;

-- 4. RLS: usuarios autenticados pueden subir y actualizar fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Auth upload player photos'
  ) THEN
    CREATE POLICY "Auth upload player photos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'player-photos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Auth update player photos'
  ) THEN
    CREATE POLICY "Auth update player photos" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'player-photos');
  END IF;
END $$;
