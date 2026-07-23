-- ============================================================
-- Migración: costo de proveedor por línea de pedido de uniforme
-- Ejecutar en: https://supabase.com/dashboard/project/olcevdnhmexaahymfzii/sql
--
-- Hasta ahora, pedido_uniforme_prendas solo guardaba precio_unitario
-- (precio de venta) por línea. Para calcular la GANANCIA real de
-- uniformes en el reporte financiero (venta - costo), hace falta
-- guardar también el precio de proveedor vigente al momento del
-- pedido — si se calculara mirando el catálogo actual, un reporte de
-- un mes pasado cambiaría solo porque se editó un precio de proveedor
-- después. Mismo criterio que ya se usa con precio_unitario.
-- ============================================================

ALTER TABLE pedido_uniforme_prendas ADD COLUMN IF NOT EXISTS precio_proveedor NUMERIC DEFAULT 0;

-- Verificar
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'pedido_uniforme_prendas'
ORDER BY ordinal_position;
