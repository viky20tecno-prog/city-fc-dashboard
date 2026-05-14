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
 * Devuelve la lista plana de todos los equipos para usar en filtros.
 * Si una categoría tiene un único equipo igual al nombre de la categoría, lo devuelve como una sola entrada.
 */
export function listarEquipos(cats) {
  const normalized = normalizarCategorias(cats);
  return normalized.flatMap(c =>
    c.equipos.length === 1 && c.equipos[0] === c.nombre
      ? [c.nombre]
      : c.equipos
  );
}
