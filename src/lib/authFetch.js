import { supabase } from './supabase';

/**
 * Wrapper de fetch que incluye automáticamente el token de Supabase.
 * Usar en lugar de fetch() directo para rutas protegidas del backend.
 */
export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}
