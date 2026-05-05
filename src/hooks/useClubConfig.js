import { useState, useEffect } from 'react';
import { fetchClubConfig } from '../services/api';

export function useClubConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubConfig()
      .then(data => { if (data.success) setConfig(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { config, loading };
}
