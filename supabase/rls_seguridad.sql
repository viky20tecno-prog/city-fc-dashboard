-- ============================================================
-- RLS — Row Level Security ZenSports
-- Aplicar en: Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/olcevdnhmexaahymfzii/sql
--
-- ARQUITECTURA DE SEGURIDAD:
--   • Backend API (city-fc-api-v2): usa SUPABASE_SERVICE_ROLE_KEY
--     → Bypasses RLS automáticamente. No necesita políticas explícitas.
--   • Frontend (browser/JWT autenticado): consulta directamente solo
--     las tablas `clubs` y `club_members`. Necesita políticas explícitas.
--   • Portal Atleta / Carnets: usa clave anon, solo lectura pública.
-- ============================================================

-- ============================================================
-- 1. ACTIVAR RLS EN TODAS LAS TABLAS
-- ============================================================

-- Gestionadas 100% por el backend vía service_role
ALTER TABLE players          ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensualidades    ENABLE ROW LEVEL SECURITY;
ALTER TABLE uniformes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_uniformes ENABLE ROW LEVEL SECURITY;
ALTER TABLE torneos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitraje_pagos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensiones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_log_envios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia       ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario       ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_sessions      ENABLE ROW LEVEL SECURITY;

-- Consultadas directamente desde el frontend con JWT de usuario
ALTER TABLE clubs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members     ENABLE ROW LEVEL SECURITY;

-- Nota: finanzas, nomina_empleados, nomina_pagos ya tienen RLS + políticas
-- service_role definidas en migracion_finanzas.sql. No repetir aquí.

-- ============================================================
-- 2. POLÍTICAS — clubs
-- (Consultada directamente en Login.jsx para resolver el club del owner)
-- ============================================================

-- Owner autenticado: lectura de su propio club
DROP POLICY IF EXISTS "Owner puede leer su club" ON clubs;
CREATE POLICY "Owner puede leer su club"
  ON clubs FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- Owner autenticado: puede actualizar su propio club
DROP POLICY IF EXISTS "Owner puede actualizar su club" ON clubs;
CREATE POLICY "Owner puede actualizar su club"
  ON clubs FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Anon: SIN acceso directo a `clubs` (el config completo incluye
-- llave_pago, cuenta_bancaria, celulares_staff, etc.). El portal
-- atleta, la verificación de carnets y el formulario de inscripción
-- leen branding público a través de la vista `clubs_publico`
-- (allowlist de columnas) — ver migracion_rls_clubs_publico.sql.
DROP POLICY IF EXISTS "Lectura pública clubs verificación" ON clubs;

-- ============================================================
-- 3. POLÍTICAS — club_members
-- (Consultada directamente en Login.jsx para resolver rol de entrenadores)
-- ============================================================

-- Miembro autenticado: solo puede leer su propia membresía
DROP POLICY IF EXISTS "Miembro puede leer su membresía" ON club_members;
CREATE POLICY "Miembro puede leer su membresía"
  ON club_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 4. STORAGE — bucket player-photos
-- (Fotos de jugadores desde HojaDeVida y FormInscripcion)
-- ============================================================

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

-- ============================================================
-- 5. STORAGE — bucket comprobantes
-- (Imágenes de pagos recibidas por WhatsApp)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read comprobantes" ON storage.objects;
CREATE POLICY "Public read comprobantes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comprobantes');

-- ============================================================
-- 6. STORAGE — bucket club-assets
-- (Logos de club y QR de pago — OnboardingWizard y CobroConfigModal)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('club-assets', 'club-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read club assets" ON storage.objects;
CREATE POLICY "Public read club assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'club-assets');

DROP POLICY IF EXISTS "Auth upload club assets" ON storage.objects;
CREATE POLICY "Auth upload club assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'club-assets');

DROP POLICY IF EXISTS "Auth update club assets" ON storage.objects;
CREATE POLICY "Auth update club assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'club-assets');

-- ============================================================
-- 7. VERIFICACIÓN FINAL
-- ============================================================

SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;
