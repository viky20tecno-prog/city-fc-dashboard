-- =====================================================================
-- MIGRACIÓN: Corregir / intercambiar la cédula de un jugador
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =====================================================================
-- La cédula es el identificador del jugador y está copiada como texto en
-- varias tablas (no por llave foránea). Cambiarla a mano en `players` deja
-- huérfanos los pagos, torneos, asistencia y uniformes. Estas dos funciones
-- hacen el cascade completo dentro de una sola transacción (la RPC de
-- Supabase envuelve la llamada en una transacción implícita).
--
-- `corregir_cedula_jugador`  — para un typo: mueve una cédula libre.
-- `intercambiar_cedulas_jugadores` — para dos jugadores del mismo club cuyas
--   cédulas quedaron cruzadas (usa un valor temporal para no chocar con el
--   UNIQUE de players).
-- Ambas devuelven un jsonb { tabla: filas_movidas } para el log de auditoría.

CREATE OR REPLACE FUNCTION corregir_cedula_jugador(
  p_club text,
  p_old  text,
  p_new  text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  t       text;
  n       bigint;
  result  jsonb := '{}'::jsonb;
  -- `players` primero; el resto son las copias denormalizadas de la cédula.
  tablas  text[] := ARRAY[
    'players', 'mensualidades', 'pagos', 'suspensiones', 'torneos',
    'asistencia', 'pedido_uniformes', 'wa_log_envios', 'uniformes'
  ];
BEGIN
  IF p_old IS NULL OR p_new IS NULL OR p_old = p_new THEN
    RETURN result;
  END IF;

  FOREACH t IN ARRAY tablas LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format(
        'UPDATE %I SET cedula = $1 WHERE club_id::text = $2 AND cedula = $3', t
      ) USING p_new, p_club, p_old;
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n > 0 THEN
        result := result || jsonb_build_object(t, n);
      END IF;
    END IF;
  END LOOP;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION intercambiar_cedulas_jugadores(
  p_club text,
  p_a    text,
  p_b    text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_tmp text := 'SWP-' || replace(gen_random_uuid()::text, '-', '');
  r1 jsonb;
  r2 jsonb;
  r3 jsonb;
BEGIN
  IF p_a IS NULL OR p_b IS NULL OR p_a = p_b THEN
    RETURN '{}'::jsonb;
  END IF;

  r1 := corregir_cedula_jugador(p_club, p_a,   v_tmp);  -- A  -> temporal
  r2 := corregir_cedula_jugador(p_club, p_b,   p_a);    -- B  -> A
  r3 := corregir_cedula_jugador(p_club, v_tmp, p_b);    -- tmp-> B

  RETURN jsonb_build_object(
    'a_ahora', p_b,
    'b_ahora', p_a,
    'pasos', jsonb_build_array(r1, r2, r3)
  );
END;
$$;
