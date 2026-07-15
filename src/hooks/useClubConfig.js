import { useState, useEffect, useCallback } from 'react';
import { fetchClubConfig } from '../services/api';

export function useClubConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSet = useCallback(() => {
    return fetchClubConfig()
      .then(data => { if (data.success) setConfig(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Refetch manual (ej. botón de recargar) — reinicia el flag de loading.
  const load = useCallback(() => {
    setLoading(true);
    fetchAndSet();
  }, [fetchAndSet]);

  // Carga inicial — loading ya arranca en true, no hace falta volver a marcarlo.
  useEffect(() => { fetchAndSet(); }, [fetchAndSet]);

  return { config, loading, refetch: load };
}
