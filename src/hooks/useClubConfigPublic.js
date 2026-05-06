import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useClubConfigPublic(clubId) {
  const [config, setConfig]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) return;
    supabase
      .from('clubs')
      .select('config')
      .eq('slug', clubId)
      .single()
      .then(({ data }) => { if (data?.config) setConfig(data.config); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubId]);

  return { config, loading };
}
