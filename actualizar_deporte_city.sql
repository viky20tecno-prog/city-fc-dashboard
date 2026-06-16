-- Actualizar deporte = 'futbol' a todos los jugadores de city-fc
-- Ejecutar en Supabase → SQL Editor

UPDATE players
SET deporte = 'futbol'
WHERE club_id = (SELECT id FROM clubs WHERE slug = 'city-fc')
  AND (deporte IS NULL OR deporte = '');

-- Verificar resultado:
SELECT deporte, COUNT(*) as total
FROM players
WHERE club_id = (SELECT id FROM clubs WHERE slug = 'city-fc')
GROUP BY deporte;
