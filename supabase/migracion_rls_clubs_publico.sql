-- ============================================================
-- FIX CRÍTICO — RLS de `clubs` exponía el config completo a anon
-- Aplicar en: Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/olcevdnhmexaahymfzii/sql
--
-- PROBLEMA:
--   La política "Lectura pública clubs verificación" (rls_seguridad.sql)
--   da SELECT USING(true) a `anon` sobre TODA la fila de `clubs`.
--   Cualquiera con la anon key (pública por diseño) puede hacer
--   GET /rest/v1/clubs?select=* y volcar el `config` completo de
--   TODOS los clubes: llave_pago, cuenta_bancaria, celulares_staff,
--   qr_pago_url, precio_proveedor de uniformes, día de cobro, etc.
--
-- FIX:
--   1. Se quita el SELECT amplio de anon sobre `clubs`.
--   2. Se crea una vista `clubs_publico` con allowlist explícito de
--      columnas (solo lo que el portal atleta / verificación de carnet /
--      formulario de inscripción necesitan para pintar branding).
--   3. Frontend (useClubConfigPublic, VerificarMiembro, PortalAtleta)
--      pasa a consultar `clubs_publico` en vez de `clubs`.
--
-- El owner autenticado (Login/Dashboard/AuthCallback) sigue leyendo
-- `clubs` directo sin cambios — esa policy ya filtra por
-- owner_user_id = auth.uid() y no se toca aquí.
-- ============================================================

-- 1. Quitar el acceso público amplio a la tabla real
DROP POLICY IF EXISTS "Lectura pública clubs verificación" ON clubs;

-- 2. Vista pública con allowlist de campos de config
--    (agregar aquí cualquier campo nuevo que se necesite mostrar
--    en páginas públicas — NUNCA select * ni exponer config completo)
CREATE OR REPLACE VIEW clubs_publico AS
SELECT
  slug,
  jsonb_build_object(
    'nombre',               config->>'nombre',
    'subtitulo',            config->>'subtitulo',
    'logo_url',             config->>'logo_url',
    'color',                config->>'color',
    'deportes',             config->'deportes',
    'categorias_jugadores', config->'categorias_jugadores'
  ) AS config
FROM clubs;

-- Supabase otorga por defecto INSERT/UPDATE/DELETE/TRUNCATE a anon y authenticated
-- sobre cualquier vista/tabla nueva del schema public. Como esta vista es "simple"
-- (una sola tabla en el FROM, sin agregaciones), Postgres la trata como
-- auto-actualizable: sin este REVOKE, cualquiera sin login podría hacer
-- `DELETE FROM clubs_publico` y borrar filas reales de `clubs` (el DELETE se
-- traduce directo a la tabla base, sin pasar por las policies de RLS porque la
-- vista corre con los permisos del owner). Solo debe quedar SELECT.
REVOKE ALL ON clubs_publico FROM anon, authenticated;
GRANT SELECT ON clubs_publico TO anon, authenticated;

-- ============================================================
-- 3. VERIFICACIÓN
-- ============================================================

-- No debe devolver filas para anon (RLS sin policy pública = 0 filas)
-- Ejecutar esto autenticado como anon (o vía REST con la anon key):
--   select * from clubs;               -- debe devolver []
--   select * from clubs_publico limit 3; -- debe devolver solo slug + config allowlisted

SELECT policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'clubs';

-- Debe devolver SOLO estas dos filas (anon,SELECT) y (authenticated,SELECT).
-- Si aparece cualquier otro privilege_type (INSERT/UPDATE/DELETE/TRUNCATE),
-- volver a correr el REVOKE de arriba.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'clubs_publico'
  AND grantee IN ('anon', 'authenticated');
