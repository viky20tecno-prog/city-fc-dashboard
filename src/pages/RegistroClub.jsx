import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../config';
import { Loader2, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';

const INITIAL = {
  nombre_club:   '',
  ciudad:        '',
  nombre_admin:  '',
  celular_admin: '',
  email:         '',
  password:      '',
  confirmacion:  '',
};

export default function RegistroClub() {
  const navigate = useNavigate();
  const [form, setForm]       = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [exito, setExito]     = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_club:   form.nombre_club.trim(),
          ciudad:        form.ciudad.trim(),
          nombre_admin:  form.nombre_admin.trim(),
          celular_admin: form.celular_admin.trim(),
          email:         form.email.trim(),
          password:      form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Ocurrió un error al registrar el club.');
        setLoading(false);
        return;
      }

      // Auto-login con el token recibido
      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({
          access_token:  data.access_token,
          refresh_token: data.refresh_token,
        });
        localStorage.setItem('clubId', data.club_slug);
      }

      setExito(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError('No se pudo conectar con el servidor. ' + (err?.message || 'Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <div style={{ minHeight: '100vh', background: '#060C18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <CheckCircle size={56} color="#00D084" style={{ marginBottom: 16 }} />
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>¡Club registrado!</h2>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>Redirigiendo al dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060C18', fontFamily: "'Inter', system-ui, sans-serif", padding: '40px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 24, padding: 0 }}
          >
            <ChevronLeft size={15} /> Volver al inicio
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,170,255,0.15)', border: '1px solid rgba(0,170,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/10894351.png" alt="Logo" style={{ width: 22, height: 22, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>ClubContable</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Registra tu club</h1>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>30 días gratis · Sin tarjeta de crédito</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#0A1628', border: '1px solid #1A3A5C', borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {error && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(255,94,94,0.1)', border: '1px solid rgba(255,94,94,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                <AlertCircle size={15} color="#FF5E5E" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ color: '#FF5E5E', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Sección club */}
            <p style={{ color: '#00AAFF', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Datos del club</p>

            <Campo label="Nombre del club *" value={form.nombre_club} onChange={v => set('nombre_club', v)} placeholder="Ej: Deportivo Pasto FC" required />
            <Campo label="Ciudad" value={form.ciudad} onChange={v => set('ciudad', v)} placeholder="Ej: Pasto" />

            {/* Sección admin */}
            <p style={{ color: '#00AAFF', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '8px 0 0' }}>Administrador</p>

            <Campo label="Tu nombre *" value={form.nombre_admin} onChange={v => set('nombre_admin', v)} placeholder="Ej: Juan García" required />
            <Campo label="Celular (WhatsApp)" value={form.celular_admin} onChange={v => set('celular_admin', v)} placeholder="Ej: 3001234567" type="tel" />
            <Campo label="Email *" value={form.email} onChange={v => set('email', v)} placeholder="tu@email.com" type="email" required />

            {/* Sección contraseña */}
            <p style={{ color: '#00AAFF', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '8px 0 0' }}>Contraseña</p>

            <Campo label="Contraseña * (mínimo 8 caracteres)" value={form.password} onChange={v => set('password', v)} type="password" required />
            <Campo label="Confirmar contraseña *" value={form.confirmacion} onChange={v => set('confirmacion', v)} type="password" required />

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: 8, width: '100%', background: loading ? '#1A3A5C' : '#00AAFF', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 10, padding: '14px 0', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creando tu club…</>
                : 'Crear mi club gratis'}
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', color: '#4B5563', fontSize: 13, marginTop: 20 }}>
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#00AAFF', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Ingresar
          </button>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Campo({ label, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #1A3A5C', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => { e.target.style.borderColor = '#00AAFF'; }}
        onBlur={e => { e.target.style.borderColor = '#1A3A5C'; }}
      />
    </div>
  );
}
