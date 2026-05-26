import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError]   = useState('');

  useEffect(() => {
    const resolverConSesion = async (session) => {
      const userId = session.user.id;
      const { data: club } = await supabase
        .from('clubs')
        .select('slug')
        .eq('owner_user_id', userId)
        .single();

      if (club?.slug) {
        localStorage.setItem('clubId', club.slug);
        navigate('/app', { replace: true });
      } else {
        navigate('/registro', { replace: true });
      }
    };

    // Escuchar SIGNED_IN para flujo PKCE (OAuth Google / magic link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        resolverConSesion(session);
      }
    });

    // Fallback: si la sesión ya existe (reload o flujo implícito)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        resolverConSesion(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-app)', flexDirection: 'column', gap: 16,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <p style={{ color: '#EF4444', fontSize: 14 }}>{error}</p>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--cc)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Volver al login
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-app)', flexDirection: 'column', gap: 12,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--cc, #E14924)' }} />
      <p style={{ color: 'var(--text-sec)', fontSize: 14 }}>Verificando cuenta…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
