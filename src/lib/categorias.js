/**
 * Normaliza el array de categorías al formato objeto { nombre, equipos }.
 * Compatible con el formato antiguo (array de strings) y el nuevo (array de objetos).
 */
export function normalizarCategorias(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(item =>
    typeof item === 'string'
      ? { nombre: item, equipos: [item] }
      : { nombre: item.nombre || '', equipos: Array.isArray(item.equipos) && item.equipos.length ? item.equipos : [item.nombre || ''] }
  ).filter(c => c.nombre);
}

/**
 * Devuelve la lista plana de opciones para el filtro:
 * - Si la categoría tiene un solo equipo con el mismo nombre → una sola entrada
 * - Si tiene sub-equipos → incluye el nombre de la categoría padre (filtra todos)
 *   y cada sub-equipo (filtra específicamente)
 */
export function listarEquipos(cats) {
  const normalized = normalizarCategorias(cats);
  return normalized.flatMap(c =>
    c.equipos.length === 1 && c.equipos[0] === c.nombre
      ? [c.nombre]
      : [c.nombre, ...c.equipos]
  );
}
