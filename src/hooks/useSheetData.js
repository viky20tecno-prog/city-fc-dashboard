import { useState, useEffect, useCallback } from 'react';
import { fetchAllData } from '../services/sheets';

export function useSheetData() {
  const [data, setData] = useState({
    jugadores: [],
    mensualidades: [],
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
