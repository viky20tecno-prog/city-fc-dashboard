import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.error(
    '[supabase] Faltan variables de entorno: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.\n' +
    'Crea un archivo .env.local con esas variables para desarrollo local.',
  );
}

// Si faltan las variables el SDK lanzaría un error que crashea toda la app.
// Usamos un placeholder inválido para que el cliente se cree sin explotar;
// las llamadas a la BD simplemente fallarán con error de red (comportamiento esperado).
// Usar sessionStorage en vez de localStorage para que cada pestaña del
// navegador tenga su propia sesión autenticada de forma completamente
// independiente. Dos clubes abiertos en dos pestañas ya no se contaminan.
export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnon || 'placeholder-anon-key',
  {
    auth: {
      storage:           window.sessionStorage,
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: true,
    },
  },
);
