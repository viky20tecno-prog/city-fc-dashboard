import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Eye, EyeOff, Mail, Lock, CheckCircle, KeyRound, ArrowLeft, MessageCircle } from 'lucide-react';

const WHATSAPP_SOPORTE = '573023903192';

export default function Login() {
  const navigate = useNavigate();
  const [vista, setVista]         = useState('login'); // login | recuperar | enviado | nueva_clave | actualizada
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [verClave, setVerClave]   = useState(false);
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [verNueva, setVerNueva]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Detecta el token de recuperación que viene en la URL al hacer click en el email
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setVista('nueva_clave');
    });
    return () => subscription.unsubscribe();
  }, []);

  const limpiar = () => setError('');

  // ── Login normal ──────────────────────────────────────────────────────────
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

  // ── Enviar email de recuperación ──────────────────────────────────────────
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

  // ── Guardar nueva contraseña ───────────────────────────────────────────────
  const handleNuevaClave = async (e) => {
    e.preventDefault();
    limpiar();
    if (newPw.length < 8) { setError('La contraseña debe tener mínimo 8 caracteres.'); return; }
    if (newPw !== confirmPw) { setError('Las contraseñas no coinciden. Verifícalas.'); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (updateError) setError('Error al guardar: ' + updateError.message);
    else setVista('actualizada');
  };

  const irLogin    = () => { setVista('login'); limpiar(); };
  const irRecuperar = () => { setVista('recuperar'); limpiar(); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060C18 0%, #0A1628 60%, #060C18 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: '24px 16px',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'rgba(0,170,255,0.12)', border: '1px solid rgba(0,170,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <img src="/10894351.png" alt="ClubContable" style={{ width: 46, height: 46, objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }} />
        </div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0 }}>ClubContable</h1>
        <p style={{ color: '#6B7280', fontSize: 14, margin: '6px 0 0' }}>
          Panel de gestión para tu club de fútbol
        </p>
      </div>

      {/* ── CARD ── */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(10,22,40,0.9)',
        border: '1px solid rgba(0,170,255,0.15)',
        borderRadius: 20, padding: '32px 28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,94,94,0.1)', border: '1px solid rgba(255,94,94,0.25)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 20,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <p style={{ color: '#FF7070', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        {/* ═══════════ VISTA: LOGIN ═══════════ */}
        {vista === 'login' && (
          <>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
              Bienvenido
            </h2>
            <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>
              Ingresa con el correo y contraseña de tu club
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Campo
                label="Correo electrónico"
                icon={<Mail size={17} color="#4B7CAF" />}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                required
              />
              <div>
                <label style={labelStyle}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconLeft}><Lock size={17} color="#4B7CAF" /></span>
                  <input
                    type={verClave ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    required
                    autoComplete="current-password"
                    style={{ ...inputStyle, paddingLeft: 44, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setVerClave(v => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#4B7CAF' }}>
                    {verClave ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={btnPrimary(loading)}>
                {loading
                  ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Ingresando...</>
                  : '→  Ingresar al dashboard'}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button onClick={irRecuperar} style={btnLink}>
                ¿Olvidaste tu contraseña? Recupérala aquí
              </button>
            </div>
          </>
        )}

        {/* ═══════════ VISTA: RECUPERAR ═══════════ */}
        {vista === 'recuperar' && (
          <>
            <button onClick={irLogin} style={{ ...btnLink, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13 }}>
              <ArrowLeft size={14} /> Volver al login
            </button>

            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
              Recuperar contraseña
            </h2>
            <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
              Escribe el correo con el que registraste tu club. Te enviaremos un enlace para crear una nueva contraseña.
            </p>

            <form onSubmit={handleRecuperar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Campo
                label="Correo electrónico del club"
                icon={<Mail size={17} color="#4B7CAF" />}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                required
              />
              <button type="submit" disabled={loading} style={btnPrimary(loading)}>
                {loading
                  ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                  : '📧  Enviar enlace de recuperación'}
              </button>
            </form>

            <div style={{ marginTop: 24, padding: '16px', background: 'rgba(0,170,255,0.06)', border: '1px solid rgba(0,170,255,0.15)', borderRadius: 12 }}>
              <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 10px', lineHeight: 1.5 }}>
                ¿No recuerdas el correo o no llega el email?
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_SOPORTE}?text=Hola, necesito ayuda para recuperar el acceso a mi club en ClubContable`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                <MessageCircle size={15} /> Contactar soporte por WhatsApp
              </a>
            </div>
          </>
        )}

        {/* ═══════════ VISTA: EMAIL ENVIADO ═══════════ */}
        {vista === 'enviado' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
              ¡Revisa tu correo!
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: 15, lineHeight: 1.7, margin: '0 0 8px' }}>
              Enviamos un enlace a
            </p>
            <p style={{ color: '#00AAFF', fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>
              {email}
            </p>
            <div style={{ background: 'rgba(0,170,255,0.06)', border: '1px solid rgba(0,170,255,0.15)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
              <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0, lineHeight: 1.8 }}>
                <strong style={{ color: '#fff' }}>Pasos a seguir:</strong><br />
                1. Abre el correo de ClubContable<br />
                2. Haz clic en el botón "Restablecer contraseña"<br />
                3. Se abrirá esta misma página con un formulario<br />
                4. Escribe y confirma tu nueva contraseña
              </p>
            </div>
            <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 16px' }}>
              ¿No llegó? Revisa la carpeta de spam o espera unos minutos.
            </p>
            <button onClick={irRecuperar} style={btnLink}>
              Reenviar el correo
            </button>
          </div>
        )}

        {/* ═══════════ VISTA: NUEVA CONTRASEÑA ═══════════ */}
        {vista === 'nueva_clave' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <KeyRound size={40} color="#00AAFF" style={{ marginBottom: 12 }} />
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
                Crea tu nueva contraseña
              </h2>
              <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
                Elige una contraseña segura de mínimo 8 caracteres
              </p>
            </div>

            <form onSubmit={handleNuevaClave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Nueva contraseña</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconLeft}><Lock size={17} color="#4B7CAF" /></span>
                  <input
                    type={verNueva ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required minLength={8}
                    style={{ ...inputStyle, paddingLeft: 44, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setVerNueva(v => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#4B7CAF' }}>
                    {verNueva ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <Campo
                label="Confirmar contraseña"
                icon={<Lock size={17} color="#4B7CAF" />}
                type="password"
                value={confirmPw}
                onChange={setConfirmPw}
                placeholder="Repite la contraseña"
                required
              />
              <button type="submit" disabled={loading} style={btnPrimary(loading)}>
                {loading
                  ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>
                  : '✓  Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}

        {/* ═══════════ VISTA: CONTRASEÑA ACTUALIZADA ═══════════ */}
        {vista === 'actualizada' && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={56} color="#00D084" style={{ marginBottom: 16 }} />
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
              ¡Contraseña actualizada!
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>
              Tu nueva contraseña quedó guardada. Ya puedes ingresar al dashboard.
            </p>
            <button onClick={irLogin} style={btnPrimary(false)}>
              → Ir al login
            </button>
          </div>
        )}

      </div>

      {/* Footer */}
      <p style={{ color: '#374151', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
        ClubContable · Para clubes de toda América Latina ⚽
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #4B5563; }
        input:focus { outline: none; border-color: #00AAFF !important; box-shadow: 0 0 0 3px rgba(0,170,255,0.1); }
      `}</style>
    </div>
  );
}

// ─── Componente campo reutilizable ─────────────────────────────────────────
function Campo({ label, icon, type = 'text', value, onChange, placeholder, autoComplete, required }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={iconLeft}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          style={{ ...inputStyle, paddingLeft: 44 }}
        />
      </div>
    </div>
  );
}

// ─── Estilos compartidos ───────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: '#9CA3AF', marginBottom: 8,
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1.5px solid rgba(0,170,255,0.2)',
  borderRadius: 12, padding: '13px 16px',
  fontSize: 15, color: '#fff',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const iconLeft = {
  position: 'absolute', left: 14,
  top: '50%', transform: 'translateY(-50%)',
  pointerEvents: 'none',
};

const btnPrimary = (disabled) => ({
  width: '100%', padding: '14px',
  background: disabled ? '#1A3A5C' : '#00AAFF',
  border: 'none', borderRadius: 12,
  color: '#fff', fontSize: 16, fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  transition: 'background 0.2s',
  marginTop: 4,
});

const btnLink = {
  background: 'none', border: 'none',
  color: '#00AAFF', fontSize: 14,
  cursor: 'pointer', padding: 0,
  textDecoration: 'underline', textDecorationColor: 'transparent',
  transition: 'text-decoration-color 0.2s',
};
