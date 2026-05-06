import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Loader2, Eye, EyeOff, Mail, Lock, CheckCircle, KeyRound,
  ArrowLeft, MessageCircle, Target, Trophy, Dumbbell, Bike, Waves, MoreHorizontal,
} from 'lucide-react';

const WHATSAPP_SOPORTE = '573023903192';

const DEPORTES = [
  { id: 'futbol',   label: 'Fútbol',     Icon: Target,         color: '#22C55E' },
  { id: 'basket',   label: 'Basketball', Icon: Trophy,         color: '#F97316' },
  { id: 'gimnasio', label: 'Gimnasio',   Icon: Dumbbell,       color: '#EC4899' },
  { id: 'ciclismo', label: 'Ciclismo',   Icon: Bike,           color: '#06B6D4' },
  { id: 'natacion', label: 'Natación',   Icon: Waves,          color: '#00AAFF' },
  { id: 'otros',    label: 'Otros',      Icon: MoreHorizontal, color: '#8B5CF6' },
];

export default function Login() {
  const navigate = useNavigate();
  const [sport, setSport]         = useState(DEPORTES[0]);
  const [vista, setVista]         = useState('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [verClave, setVerClave]   = useState(false);
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [verNueva, setVerNueva]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const color = sport.color;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setVista('nueva_clave');
    });
    return () => subscription.unsubscribe();
  }, []);

  const limpiar = () => setError('');

  const handleLogin = async (e) => {
    e.preventDefault();
    limpiar();
    setLoading(true);
    await supabase.auth.signOut();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (authError) {
      setError('El email o la contraseña no son correctos. Verifícalos e intenta de nuevo.');
      setLoading(false);
      return;
    }
    const userId = data?.user?.id;
    let clubId = 'city-fc';
    if (userId) {
      const { data: member } = await supabase
        .from('club_members').select('club_id').eq('user_id', userId).single();
      if (member?.club_id) clubId = member.club_id;
    }
    localStorage.setItem('clubId', clubId);
    navigate('/');
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    limpiar();
    if (!email.trim()) { setError('Por favor escribe tu correo electrónico.'); return; }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/login` }
    );
    setLoading(false);
    if (resetError) {
      setError('No se pudo enviar el correo. Si el problema persiste, contáctanos por WhatsApp.');
    } else {
      setVista('enviado');
    }
  };

  const handleNuevaClave = async (e) => {
    e.preventDefault();
    limpiar();
    if (newPw.length < 8) { setError('La contraseña debe tener mínimo 8 caracteres.'); return; }
    if (newPw !== confirmPw) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (updateError) setError('Error al guardar: ' + updateError.message);
    else setVista('actualizada');
  };

  const irLogin     = () => { setVista('login');     limpiar(); };
  const irRecuperar = () => { setVista('recuperar'); limpiar(); };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
      padding: '24px 16px',
    }}>

      {/* ── FONDO ANIMADO ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: '#04060C' }}>
        <img
          src="/Tony tech.jpg"
          alt=""
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: '200vmax', height: '200vmax',
            objectFit: 'cover',
            animation: 'rotate-bg 90s linear infinite',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(4, 6, 12, 0.80)' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 60% 50%, ${color}12 0%, transparent 60%)`,
          transition: 'background 0.7s ease',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── CARD SPLIT ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 880,
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr',
        background: 'rgba(8, 10, 20, 0.72)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: `1px solid ${color}30`,
        borderRadius: 24,
        boxShadow: `0 0 80px ${color}15, 0 32px 80px rgba(0,0,0,0.55)`,
        overflow: 'hidden',
        transition: 'border-color 0.5s, box-shadow 0.5s',
        minHeight: 500,
      }}>

        {/* ── PANEL IZQ: selector deportes ── */}
        <div style={{ padding: '44px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 30, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              Bienvenido
            </h2>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
              Selecciona la categoría de tu club
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {DEPORTES.map(d => {
              const active = sport.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSport(d)}
                  style={{
                    background: active ? `${d.color}20` : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${active ? d.color : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 14,
                    padding: '16px 10px',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 8,
                    transition: 'all 0.25s',
                    boxShadow: active ? `0 0 22px ${d.color}44` : 'none',
                  }}
                >
                  <d.Icon
                    size={22}
                    color={active ? d.color : '#4B5563'}
                    style={{
                      transition: 'color 0.25s',
                      filter: active ? `drop-shadow(0 0 6px ${d.color})` : 'none',
                    }}
                  />
                  <span style={{
                    color: active ? d.color : '#6B7280',
                    fontSize: 12, fontWeight: active ? 700 : 400,
                    transition: 'color 0.25s',
                  }}>
                    {d.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p style={{ color: '#374151', fontSize: 11, margin: '0 0 0', marginTop: 'auto' }}>
            Sistema de gestión para clubes deportivos © 2026
          </p>
        </div>

        {/* Divisor vertical */}
        <div style={{ background: `${color}22`, transition: 'background 0.5s' }} />

        {/* ── PANEL DER: formulario ── */}
        <div style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {error && (
            <div style={{
              background: 'rgba(255,94,94,0.1)', border: '1px solid rgba(255,94,94,0.25)',
              borderRadius: 12, padding: '11px 14px', marginBottom: 18,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
              <p style={{ color: '#FF7070', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* ══ LOGIN ══ */}
          {vista === 'login' && (
            <>
              <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Iniciar Sesión</h3>
              <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 26px' }}>Accede a tu club deportivo</p>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Campo label="Email" icon={<Mail size={15} color="#6B7280" />}
                  type="email" value={email} onChange={setEmail}
                  placeholder="tu@email.com" autoComplete="email" required />

                <div>
                  <label style={lbl}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <span style={icoL}><Lock size={15} color="#6B7280" /></span>
                    <input
                      type={verClave ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required autoComplete="current-password"
                      style={{ ...inp, paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setVerClave(v => !v)}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6B7280' }}>
                      {verClave ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: color, width: 14, height: 14 }} />
                    <span style={{ color: '#9CA3AF', fontSize: 13 }}>Recordarme</span>
                  </label>
                  <button type="button" onClick={irRecuperar}
                    style={{ background: 'none', border: 'none', color, fontSize: 13, cursor: 'pointer', padding: 0 }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button type="submit" disabled={loading} style={btn(color, loading)}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Ingresando...</>
                    : 'Ingresar al Club'}
                </button>
              </form>

              <p style={{ textAlign: 'center', color: '#4B5563', fontSize: 13, marginTop: 18 }}>
                ¿No tienes cuenta?{' '}
                <button onClick={() => navigate('/registro')}
                  style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>
                  Regístrate aquí
                </button>
              </p>
            </>
          )}

          {/* ══ RECUPERAR ══ */}
          {vista === 'recuperar' && (
            <>
              <button onClick={irLogin} style={{ background: 'none', border: 'none', color, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 18, padding: 0 }}>
                <ArrowLeft size={13} /> Volver
              </button>
              <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Recuperar contraseña</h3>
              <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 22px', lineHeight: 1.6 }}>
                Escribe tu correo y te enviamos un enlace para crear una nueva contraseña.
              </p>
              <form onSubmit={handleRecuperar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Campo label="Correo electrónico" icon={<Mail size={15} color="#6B7280" />}
                  type="email" value={email} onChange={setEmail}
                  placeholder="tu@email.com" autoComplete="email" required />
                <button type="submit" disabled={loading} style={btn(color, loading)}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                    : '📧  Enviar enlace de recuperación'}
                </button>
              </form>
              <div style={{ marginTop: 18, padding: '13px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 9px' }}>¿No recuerdas el correo?</p>
                <a href={`https://wa.me/${WHATSAPP_SOPORTE}?text=Hola, necesito ayuda para recuperar el acceso a mi club en ClubContable`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#25D366', color: '#fff', padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  <MessageCircle size={13} /> Soporte por WhatsApp
                </a>
              </div>
            </>
          )}

          {/* ══ EMAIL ENVIADO ══ */}
          {vista === 'enviado' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 46, marginBottom: 14 }}>📬</div>
              <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>¡Revisa tu correo!</h3>
              <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 4px' }}>Enviamos un enlace a</p>
              <p style={{ color, fontSize: 15, fontWeight: 700, margin: '0 0 18px', transition: 'color 0.4s' }}>{email}</p>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 18, textAlign: 'left' }}>
                <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0, lineHeight: 1.8 }}>
                  <strong style={{ color: '#fff' }}>Pasos:</strong><br />
                  1. Abre el correo de ClubContable<br />
                  2. Clic en "Restablecer contraseña"<br />
                  3. Escribe tu nueva contraseña<br />
                  4. Listo — ingresa al dashboard
                </p>
              </div>
              <button onClick={irRecuperar} style={{ background: 'none', border: 'none', color, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                Reenviar el correo
              </button>
            </div>
          )}

          {/* ══ NUEVA CONTRASEÑA ══ */}
          {vista === 'nueva_clave' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <KeyRound size={34} color={color} style={{ marginBottom: 8, filter: `drop-shadow(0 0 8px ${color})`, transition: 'filter 0.4s' }} />
                <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Nueva contraseña</h3>
                <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Mínimo 8 caracteres</p>
              </div>
              <form onSubmit={handleNuevaClave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>Nueva contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <span style={icoL}><Lock size={15} color="#6B7280" /></span>
                    <input type={verNueva ? 'text' : 'password'} value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="Mínimo 8 caracteres" required minLength={8}
                      style={{ ...inp, paddingRight: 44 }} />
                    <button type="button" onClick={() => setVerNueva(v => !v)}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6B7280' }}>
                      {verNueva ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <Campo label="Confirmar contraseña" icon={<Lock size={15} color="#6B7280" />}
                  type="password" value={confirmPw} onChange={setConfirmPw}
                  placeholder="Repite la contraseña" required />
                <button type="submit" disabled={loading} style={btn(color, loading)}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>
                    : '✓  Guardar nueva contraseña'}
                </button>
              </form>
            </>
          )}

          {/* ══ ACTUALIZADA ══ */}
          {vista === 'actualizada' && (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={50} color={color} style={{ marginBottom: 14, filter: `drop-shadow(0 0 12px ${color})`, transition: 'filter 0.4s' }} />
              <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>¡Contraseña actualizada!</h3>
              <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                Ya puedes ingresar al dashboard con tu nueva contraseña.
              </p>
              <button onClick={irLogin} style={btn(color, false)}>→ Ir al login</button>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes rotate-bg {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        input::placeholder { color: #374151; }
        input:focus {
          outline: none;
          border-color: ${color} !important;
          box-shadow: 0 0 0 3px ${color}22;
        }
      `}</style>
    </div>
  );
}

// ── Componente Campo ───────────────────────────────────────────────────────
function Campo({ label, icon, type = 'text', value, onChange, placeholder, autoComplete, required }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={icoL}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          style={inp}
        />
      </div>
    </div>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────
const lbl = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: '#D1D5DB', marginBottom: 7,
};

const icoL = {
  position: 'absolute', left: 13,
  top: '50%', transform: 'translateY(-50%)',
  pointerEvents: 'none',
};

const inp = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1.5px solid rgba(255,255,255,0.10)',
  borderRadius: 12,
  paddingTop: 12, paddingBottom: 12,
  paddingLeft: 40, paddingRight: 16,
  fontSize: 14, color: '#fff',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const btn = (color, disabled) => ({
  width: '100%', padding: '13px',
  background: disabled ? 'rgba(255,255,255,0.07)' : color,
  border: 'none', borderRadius: 12,
  color: '#fff', fontSize: 15, fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  transition: 'background 0.5s, box-shadow 0.5s',
  boxShadow: disabled ? 'none' : `0 4px 24px ${color}55`,
  marginTop: 4,
});
