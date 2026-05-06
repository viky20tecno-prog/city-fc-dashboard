-- ============================================================
-- RLS — Row Level Security para ClubContable
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- ESTRATEGIA:
--   El backend Express usa SUPABASE_SERVICE_ROLE_KEY que bypassa
--   RLS completamente — no se rompe ninguna funcionalidad.
--   Activar RLS bloquea acceso directo con la anon key pública
--   (que está embebida en el bundle del frontend).
--
--   El frontend accede a Supabase solo para:
--     1. Auth (supabase.auth.*) — no afectado por RLS de tablas
--     2. Storage bucket player-photos (upload de foto de jugador)
--
--   Por eso: RLS ON + sin políticas en tablas de datos =
--   acceso bloqueado para anon/authenticated directo,
--   acceso libre para service_role (backend).
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. TABLAS DE DATOS — Activar RLS, sin políticas permisivas
--    (bloquea acceso con anon key; service_role sigue teniendo acceso)
-- ──────────────────────────────────────────────────────────────

ALTER TABLE players           ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensualidades     ENABLE ROW LEVEL SECURITY;
ALTER TABLE uniformes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_uniformes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE torneos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitraje_pagos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensiones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members      ENABLE ROW LEVEL SECURITY;

-- wa_log_envios existe si ejecutaste migracion_penalidad_y_wa_log.sql
ALTER TABLE wa_log_envios ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 2. POLÍTICA LECTURA PROPIA — clubs y club_members
--    Los usuarios autenticados pueden leer SU propio club.
--    (El backend no necesita esto, pero es buena práctica tenerlo
--     por si en el futuro se hacen consultas directas desde el frontend.)
-- ──────────────────────────────────────────────────────────────

-- clubs: el owner puede leer su club
CREATE POLICY "Owner puede leer su club"
  ON clubs
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- club_members: cada miembro puede leer su propia membresía
CREATE POLICY "Miembro puede leer su membresía"
  ON club_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 3. STORAGE — bucket player-photos
--    Lectura pública (las fotos se muestran sin login).
--    Upload/Update solo para usuarios autenticados.
-- ──────────────────────────────────────────────────────────────

-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read player photos'
  ) THEN
    CREATE POLICY "Public read player photos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'player-photos');
  END IF;
END $$;

-- Upload para autenticados
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Auth upload player photos'
  ) THEN
    CREATE POLICY "Auth upload player photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'player-photos');
  END IF;
END $$;

-- Update para autenticados
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Auth update player photos'
  ) THEN
    CREATE POLICY "Auth update player photos"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'player-photos');
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 4. STORAGE — bucket comprobantes
--    Lectura pública (se muestran en el dashboard de Conciliación).
--    Uploads van por la Edge Function con service_role (no necesita política).
-- ──────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read comprobantes'
  ) THEN
    CREATE POLICY "Public read comprobantes"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'comprobantes');
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 5. VERIFICACIÓN — ver qué tablas tienen RLS activo
-- ──────────────────────────────────────────────────────────────

SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
