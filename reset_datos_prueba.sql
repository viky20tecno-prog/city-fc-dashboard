-- ============================================================
-- RESET DATOS DE PRUEBA — Jugador Diego Escobar (1032401947)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Borrar todos los pagos del jugador
DELETE FROM pagos
WHERE cedula = '1032401947';

-- 2. Borrar pedidos de uniformes (tabla nueva)
DELETE FROM pedido_uniformes
WHERE cedula = '1032401947';

-- 3. Resetear mensualidades (solo meses reales, excluye pre-inscripción)
UPDATE mensualidades
SET valor_pagado    = 0,
    saldo_pendiente = valor_oficial,
    estado          = 'PENDIENTE'
WHERE cedula        = '1032401947'
  AND valor_oficial > 0;

-- 4. Resetear uniformes (tabla vieja)
UPDATE uniformes
SET valor_pagado    = 0,
    saldo_pendiente = valor_oficial,
    estado          = 'PENDIENTE'
WHERE cedula        = '1032401947';

-- 5. Resetear torneos
UPDATE torneos
SET valor_pagado    = 0,
    saldo_pendiente = valor_oficial,
    estado          = 'PENDIENTE'
WHERE cedula        = '1032401947';

-- 6. Desactivar suspensiones activas del jugador
UPDATE suspensiones
SET activo = false
WHERE cedula = '1032401947';


-- ============================================================
-- VERIFICACIÓN — Ejecutar después del reset para confirmar
-- ============================================================

-- Pagos: debe retornar 0 filas
SELECT COUNT(*) AS pagos_restantes
FROM pagos
WHERE cedula = '1032401947';

-- Pedido uniformes: debe retornar 0 filas
SELECT COUNT(*) AS pedidos_restantes
FROM pedido_uniformes
WHERE cedula = '1032401947';

-- Mensualidades: todas deben tener valor_pagado=0 y estado=PENDIENTE (excepto las de valor_oficial=0)
SELECT mes, anio, valor_oficial, valor_pagado, saldo_pendiente, estado
FROM mensualidades
WHERE cedula = '1032401947'
ORDER BY anio, mes;

-- Torneos: valor_pagado=0, estado=PENDIENTE
SELECT nombre_torneo, valor_oficial, valor_pagado, estado
FROM torneos
WHERE cedula = '1032401947';

-- Suspensiones: activo=false
SELECT motivo, activo
FROM suspensiones
WHERE cedula = '1032401947';
