import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError]   = useState('');

  useEffect(() => {
    const resolver = async () => {
      // Supabase lee el code/hash de la URL y establece la sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('No se pudo verificar la sesión. Intenta iniciar sesión de nuevo.');
        return;
      }

      const userId = session.user.id;
      const { data: club } = await supabase
        .from('clubs')
        .select('slug')
        .eq('owner_user_id', userId)
        .single();

      if (club?.slug) {
        localStorage.setItem('clubId', club.slug);
        localStorage.setItem('userRole', 'ADMIN');
        navigate('/app', { replace: true });
      } else {
        // Usuario nuevo con Google — aún no tiene club
        navigate('/registro', { replace: true });
      }
    };

    resolver();
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
