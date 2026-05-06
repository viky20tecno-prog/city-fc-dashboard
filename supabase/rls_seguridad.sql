-- ============================================================
-- RLS — Row Level Security ClubContable
-- ============================================================

-- 1. Activar RLS en todas las tablas existentes
ALTER TABLE players          ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensualidades    ENABLE ROW LEVEL SECURITY;
ALTER TABLE uniformes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_uniformes ENABLE ROW LEVEL SECURITY;
ALTER TABLE torneos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitraje_pagos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensiones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_log_envios    ENABLE ROW LEVEL SECURITY;

-- 2. Política: owner autenticado puede leer su propio club
DROP POLICY IF EXISTS "Owner puede leer su club" ON clubs;
CREATE POLICY "Owner puede leer su club"
  ON clubs FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- 3. Storage — bucket player-photos (fotos de jugadores desde HojaDeVida)
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read player photos" ON storage.objects;
CREATE POLICY "Public read player photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player-photos');

DROP POLICY IF EXISTS "Auth upload player photos" ON storage.objects;
CREATE POLICY "Auth upload player photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'player-photos');

DROP POLICY IF EXISTS "Auth update player photos" ON storage.objects;
CREATE POLICY "Auth update player photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'player-photos');

-- 4. Storage — bucket comprobantes (imágenes de pagos WhatsApp)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read comprobantes" ON storage.objects;
CREATE POLICY "Public read comprobantes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comprobantes');

-- 5. Verificación final
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
