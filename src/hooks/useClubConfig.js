import { useState, useEffect, useCallback } from 'react';
import { fetchClubConfig } from '../services/api';

export function useClubConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchClubConfig()
      .then(data => { if (data.success) setConfig(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { config, loading, refetch: load };
}
