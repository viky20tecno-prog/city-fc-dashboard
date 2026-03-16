import { useState, useEffect, useCallback } from 'react';
// Cambiar de sheets.js a api.js
import { fetchAllData } from '../services/api';

export function useSheetData() {
  const [data, setData] = useState({
    jugadores: [],
    mensualidades: [],
    uniformes: [],
    torneos: [],
    registroPagos: [],
    morosos: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllData();
      setData(result);
      setLastUpdated(new Date());
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
