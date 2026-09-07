// Verificación temporal (Fase B del refactor estadoCuenta).
//
// Corre el módulo src/lib/estadoCuenta.js EN PARALELO al cálculo viejo de cada
// call site y loguea las diferencias en la consola del navegador, sin cambiar
// absolutamente nada de lo que ve el usuario. La idea es dejar esto un ciclo en
// producción, revisar `window.__ecDrift`, confirmar que el valor nuevo es el
// correcto (o encontrar un bug), y recién ahí cortar al módulo y borrar el viejo.
//
// Ver docs/adr/0001-modulo-estado-de-cuenta.md (paso 5 del plan de ejecución).
// Cuando todos los call sites estén migrados, este archivo se borra.

// Interruptor único. Poné false para silenciar la verificación sin tocar los
// call sites (p. ej. si el log molesta en alguna sesión de soporte).
export const VERIFICAR_PARIDAD = true;

/**
 * Registra un lote de divergencias entre el cálculo viejo y el del módulo.
 * Nunca lanza: un bug acá jamás debe romper la pantalla.
 *
 * @param {string} origen - nombre del call site, ej. 'DashboardOverview.stats'
 * @param {Array<object>} filas - una por divergencia; forma libre pero incluí
 *   siempre algo que identifique al jugador (cedula) y los dos valores.
 */
export function reportarDrift(origen, filas) {
  try {
    if (!VERIFICAR_PARIDAD || !Array.isArray(filas) || filas.length === 0) return;
    const g = typeof window !== 'undefined' ? window : globalThis;
    g.__ecDrift = g.__ecDrift || [];
    g.__ecDrift.push({ origen, ts: new Date().toISOString(), total: filas.length, filas });
    // Recorte para que la consola no explote si algo sale muy mal.
    const muestra = filas.slice(0, 25);
    console.warn(
      `[estadoCuenta:drift] ${origen} — ${filas.length} divergencia(s)` +
      (filas.length > 25 ? ' (mostrando 25)' : ''),
      muestra,
    );
  } catch {
    /* no-op: la verificación nunca debe afectar al cliente */
  }
}
