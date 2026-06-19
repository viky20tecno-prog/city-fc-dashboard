import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAllData } from '../services/api';

export function useAppData() {
  const [data, setData] = useState({
    jugadores: [],
    mensualidades: [],
    uniformes: [],
    torneos: [],
    registroPagos: [],
    morosos: [],
    suspensiones: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const initialized = useRef(false);

  const refresh = useCallback(async () => {
    // Solo muestra el spinner de carga completa en la primera carga.
    // Los refreshes posteriores actualizan los datos en segundo plano
    // sin desmontar el contenido (lo que cerraría drawers/modals abiertos).
    if (!initialized.current) setLoading(true);
    setError(null);
    try {
      const result = await fetchAllData();
      setData(result);
      setLastUpdated(new Date());
      initialized.current = true;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, error, lastUpdated, refresh };
}
