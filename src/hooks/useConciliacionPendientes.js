import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import { API_BASE_URL } from '../config';

const INTERVALO_MS = 60_000;

/**
 * Cuántos pagos esperan revisión en Conciliación (pendiente + excedente_pendiente)
 * — p. ej. un comprobante que el jugador mandó por WhatsApp.
 *
 * `avisoKey` sube cada vez que entra un comprobante más nuevo que el último visto:
 * usarlo como `key` de un elemento con `animate-conc-aviso` re-dispara la animación.
 * Si falla la consulta se queda con el último valor (una alerta no debe romper nada).
 */
export function useConciliacionPendientes({ enabled, refreshTrigger }) {
  const [count, setCount]       = useState(0);
  const [avisoKey, setAvisoKey] = useState(0);
  const ultimoVisto = useRef(null);

  const consultar = useCallback(async () => {
    if (!enabled || document.hidden) return;
    try {
      const res  = await authFetch(`${API_BASE_URL}/payments/pendientes?club_id=${getClubId()}`);
      const data = await res.json();
      if (!data.success) return;
      setCount(data.count);
      if (data.ultimo && data.ultimo !== ultimoVisto.current) {
        if (ultimoVisto.current === null || data.ultimo > ultimoVisto.current) setAvisoKey(k => k + 1);
        ultimoVisto.current = data.ultimo;
      }
    } catch {
      // sin red / API caída — se reintenta en el próximo ciclo
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const primera = setTimeout(consultar, 0);
    const id = setInterval(consultar, INTERVALO_MS);
    // Al volver a la pestaña, consultar de una vez en vez de esperar el ciclo
    document.addEventListener('visibilitychange', consultar);
    return () => {
      clearTimeout(primera);
      clearInterval(id);
      document.removeEventListener('visibilitychange', consultar);
    };
  }, [enabled, consultar]);

  // "Actualizar" del encabezado, o al entrar/salir de Conciliación tras aprobar/rechazar
  useEffect(() => {
    if (!refreshTrigger) return;
    const t = setTimeout(consultar, 0);
    return () => clearTimeout(t);
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return { count: enabled ? count : 0, avisoKey };
}
