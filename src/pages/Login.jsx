import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Loader2, Eye, EyeOff, Mail, Lock, CheckCircle, KeyRound,
  ArrowLeft, MessageCircle, Zap, BarChart2, Globe, Medal, AlertTriangle,
} from 'lucide-react';
import ZenSportsLogo from '../components/brand/ZenSportsLogo';

const WHATSAPP_SOPORTE = '573023903192';
const SUPER_ADMIN_EMAILS = ['diego31escobar@gmail.com'];
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const CYCLE_COLORS = ['#6A00FF', '#AE68FF', '#8B2AFF', '#C084FF', '#7C3AED'];

const ROL_COLORS = {
  admin:              { bg: 'rgba(106,0,255,0.2)',   border: 'rgba(106,0,255,0.4)',   color: '#AE68FF' },
  admin_club_inactivo:{ bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)',  color: '#F59E0B' },
  entrenador:         { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)',  color: '#F59E0B' },
  jugador:            { bg: 'rgba(0,208,132,0.15)',  border: 'rgba(0,208,132,0.3)',   color: '#00D084' },
  visitante:          { bg: 'rgba(255,255,255,0.06)',border: 'rgba(255,255,255,0.12)',color: 'rgba(255,255,255,0.4)' },
};
function RolBadge({ rol }) {
  const c = ROL_COLORS[rol] || ROL_COLORS.visitante;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {rol?.replace('_club_inactivo', ' (club inactivo)')}
    </span>
  );
}
const BTN_COLOR = '#6A00FF';

const FEATURES = [
  { Icon: Zap,       text: 'Cobros automáticos por WhatsApp' },
  { Icon: BarChart2, text: 'Dashboard en tiempo real' },
  { Icon: Globe,     text: 'Disponible en todo el mundo' },
  { Icon: Medal,     text: 'Fútbol, basket, gimnasio y más' },
];

export default function Login() {
  const navigate = useNavigate();
  const [colorIdx, setColorIdx]   = useState(0);

  useEffect(() => { document.title = 'ZenSports — Iniciar sesión'; }, []);
  const [vista, setVista]         = useState('login');
  const [clubs, setClubs]           = useState([]);
  const [clubSearch, setClubSearch] = useState('');
  const [phoneQuery, setPhoneQuery]     = useState('');
  const [phoneResult, setPhoneResult]   = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [saToken, setSaToken]           = useState(null);
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [verClave, setVerClave]   = useState(false);
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [verNueva, setVerNueva]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const color = CYCLE_COLORS[colorIdx];

  useEffect(() => {
    const timer = setInterval(() => setColorIdx(i => (i + 1) % CYCLE_COLORS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setVista('nueva_clave');
    });
    return () => subscription.unsubscribe();
  }, []);

  const limpiar = () => setError('');

  const handleGoogleLogin = async () => {
    limpiar();
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) {
      setError('No se pudo iniciar con Google. Intenta de nuevo.');
      setLoading(false);
    }
  };

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
    let clubId = null;
    let userRole = 'ADMIN';

    if (userId) {
      // 1. Intento: dueño del club
      const { data: ownedClub } = await supabase
        .from('clubs').select('slug').eq('owner_user_id', userId).single();
      if (ownedClub?.slug) {
        clubId   = ownedClub.slug;
        userRole = 'ADMIN';
      }

      // 2. Intento: miembro con rol (entrenador, etc.)
      if (!clubId) {
        const { data: membership } = await supabase
          .from('club_members')
          .select('club_id, role, activo')
          .eq('user_id', userId)
          .eq('activo', true)
          .single();
        if (membership?.club_id) {
          // club_members.club_id ya es el slug del club (ver migracion_roles_club_members.sql)
          clubId   = membership.club_id;
          userRole = membership.role || 'ENTRENADOR';
        }
      }
    }

    if (!clubId) {
      // Super admin: mostrar selector de clubs
      if (SUPER_ADMIN_EMAILS.includes(data?.user?.email)) {
        // Usar el token que viene directamente en la respuesta del login (funciona en móvil)
        const token = data?.session?.access_token;
        if (!token) {
          setError('No se pudo obtener el token de sesión. Intenta de nuevo.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        setSaToken(token);
        try {
          const r = await fetch(`${API_BASE}/superadmin/clubs`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await r.json();
          if (json.success) {
            setClubs(json.clubs);
            setVista('selector_club');
            setLoading(false);
            return;
          }
          setError(`Error cargando clubs: ${json.error || 'intenta de nuevo'}`);
        } catch {
          setError('No se pudo conectar al servidor. Verifica tu conexión e intenta de nuevo.');
        }
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setError('No se encontró un club asociado a esta cuenta.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    sessionStorage.setItem('clubId', clubId);
    sessionStorage.setItem('userRole', userRole);
    navigate('/app');
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

  const resetSession = async () => {
    if (!phoneQuery.trim()) return;
    setResetLoading(true);
    try {
      const r = await fetch(`${API_BASE}/superadmin/reset-session?phone=${encodeURIComponent(phoneQuery.trim())}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${saToken}` },
      });
      const json = await r.json();
      if (json.success) {
        setPhoneResult(prev => ({ ...prev, sesion_cache: null, _resetMsg: `Sesión eliminada (${json.eliminadas} registro${json.eliminadas !== 1 ? 's' : ''})` }));
      }
    } catch { /* silent */ }
    finally { setResetLoading(false); }
  };

  const buscarPhone = async () => {
    if (!phoneQuery.trim()) return;
    setPhoneLoading(true);
    setPhoneResult(null);
    try {
      const r = await fetch(`${API_BASE}/superadmin/lookup-phone?phone=${encodeURIComponent(phoneQuery.trim())}`, {
        headers: { Authorization: `Bearer ${saToken}` },
      });
      const json = await r.json();
      setPhoneResult(json);
    } catch {
      setPhoneResult({ success: false, error: 'Error de conexión' });
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
      padding: '24px 16px',
    }}>

      {/* ── FONDO MODERNO ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: '#03050D' }}>
        {/* Blob 1 — top right */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '55vw', height: '55vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          filter: 'blur(60px)',
          transition: 'background 0.8s ease',
          animation: 'blob-drift-1 18s ease-in-out infinite',
        }} />
        {/* Blob 2 — bottom left */}
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-10%',
          width: '50vw', height: '50vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
          filter: 'blur(80px)',
          transition: 'background 0.8s ease',
          animation: 'blob-drift-2 22s ease-in-out infinite',
        }} />
        {/* Blob 3 — center subtle */}
        <div style={{
          position: 'absolute', top: '40%', left: '40%',
          width: '30vw', height: '30vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
          filter: 'blur(40px)',
          transition: 'background 0.8s ease',
          animation: 'blob-drift-3 14s ease-in-out infinite',
        }} />
        {/* Grid overlay sutil */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
        {/* Noise vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .login-panel-izq   { display: none !important; }
          .login-divider     { display: none !important; }
          .login-card        { grid-template-columns: 1fr !important; min-height: auto !important; }
          .login-panel-der   { padding: 28px 22px !important; }
          .login-mobile-header { display: flex !important; }
        }
      `}</style>

      {/* ── CARD SPLIT ── */}
      <div className="login-card" style={{
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

        {/* ── PANEL IZQ: brand ── */}
        <div className="login-panel-izq" style={{ padding: '44px 36px', display: 'flex', flexDirection: 'column' }}>

          {/* Logo */}
          <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ZenSportsLogo variant="icon" size={100} />
            <span style={{ fontFamily: "'Sport Event', sans-serif", fontSize: 42, letterSpacing: '0.12em', color: '#fff', lineHeight: 1, marginTop: 6 }}>
              ZenSports
            </span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: '0.22em', color: 'var(--text-mut)', textTransform: 'uppercase' }}>
              Gestión Deportiva Digital
            </span>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Gestiona tu club
            </h2>
            <h2 style={{ color, fontSize: 28, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.2, transition: 'color 0.7s' }}>
              como un profesional
            </h2>
            <p style={{ color: 'var(--text-sec)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              Cobros, jugadores, uniformes y WhatsApp — todo en un solo lugar.
            </p>
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {FEATURES.map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${color}18`, border: `1px solid ${color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background-color 0.7s, border-color 0.7s',
                }}>
                  <f.Icon size={15} color={color} strokeWidth={1.8} style={{ transition: 'color 0.7s' }} />
                </div>
                <span style={{ color: 'var(--text-sec)', fontSize: 13 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* ── Radar Sweep ── */}
          <div style={{ width: 160, height: 160, margin: '16px auto 20px', flexShrink: 0 }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="72" fill="rgba(0,0,0,0.18)" />
              {/* Range rings */}
              <circle cx="80" cy="80" r="72" fill="none" stroke={`${color}22`} strokeWidth="1" />
              <circle cx="80" cy="80" r="48" fill="none" stroke={`${color}14`} strokeWidth="0.8" strokeDasharray="3 6" />
              <circle cx="80" cy="80" r="24" fill="none" stroke={`${color}1A`} strokeWidth="0.8" />
              {/* Crosshairs */}
              <line x1="80" y1="8" x2="80" y2="152" stroke={`${color}12`} strokeWidth="0.8" />
              <line x1="8" y1="80" x2="152" y2="80" stroke={`${color}12`} strokeWidth="0.8" />
              {/* Sweep group — rotates around center via SVG animateTransform */}
              <g>
                <animateTransform attributeName="transform" type="rotate" from="0 80 80" to="360 80 80" dur="3s" repeatCount="indefinite" />
                {/* Trailing halo (70°) */}
                <path d="M 80 80 L 80 8 A 72 72 0 0 1 148 55 Z" fill={`${color}0E`} />
                {/* Main sector (40°) */}
                <path d="M 80 80 L 80 8 A 72 72 0 0 1 126 25 Z" fill={`${color}28`} />
                {/* Leading edge */}
                <line x1="80" y1="80" x2="80" y2="8" stroke={`${color}70`} strokeWidth="1.5" />
              </g>
              {/* Center */}
              <circle cx="80" cy="80" r="7" fill="none" stroke={`${color}35`} strokeWidth="1" />
              <circle cx="80" cy="80" r="3.5" fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
                <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
              </circle>
              {/* Blips */}
              <circle cx="112" cy="48" r="3" fill={color} opacity="0">
                <animate attributeName="opacity" values="0;1;0.8;0" dur="3s" begin="1.1s" repeatCount="indefinite" />
                <animate attributeName="r" values="1;3;2.5;1" dur="3s" begin="1.1s" repeatCount="indefinite" />
              </circle>
              <circle cx="54" cy="102" r="2.5" fill={color} opacity="0">
                <animate attributeName="opacity" values="0;1;0.7;0" dur="3s" begin="2.3s" repeatCount="indefinite" />
                <animate attributeName="r" values="1;2.5;2;1" dur="3s" begin="2.3s" repeatCount="indefinite" />
              </circle>
              <circle cx="98" cy="116" r="2" fill={color} opacity="0">
                <animate attributeName="opacity" values="0;0.9;0.5;0" dur="4s" begin="0.6s" repeatCount="indefinite" />
              </circle>
              <circle cx="46" cy="56" r="2" fill={color} opacity="0">
                <animate attributeName="opacity" values="0;0.8;0.4;0" dur="3.5s" begin="1.8s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          <p style={{ color: 'var(--text-mut)', fontSize: 11, margin: 0 }}>
            Sistema de gestión deportiva © 2026
          </p>
        </div>

        {/* Divisor vertical */}
        <div className="login-divider" style={{ background: `${color}22`, transition: 'background 0.5s' }} />

        {/* ── PANEL DER: formulario ── */}
        <div className="login-panel-der" style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* Cabecera de marca — solo visible en mobile, donde se oculta el panel izq. */}
          <div className="login-mobile-header" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: 3, marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <ZenSportsLogo variant="icon" size={34} />
              <span style={{ fontFamily: "'Sport Event', sans-serif", fontSize: 24, letterSpacing: '0.1em', color: '#fff', lineHeight: 1 }}>
                ZenSports
              </span>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-mut)', textTransform: 'uppercase' }}>
              Gestión Deportiva Digital
            </span>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,94,94,0.1)', border: '1px solid rgba(255,94,94,0.25)',
              borderRadius: 12, padding: '11px 14px', marginBottom: 18,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <AlertTriangle size={15} color="#FF7070" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: '#FF7070', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* ══ LOGIN ══ */}
          {vista === 'login' && (
            <>
              <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Iniciar Sesión</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: 13, margin: '0 0 26px' }}>Accede a tu club deportivo</p>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Campo label="Email" icon={<Mail size={15} color="var(--text-sec)" />}
                  type="email" value={email} onChange={setEmail}
                  placeholder="tu@email.com" autoComplete="email" required />

                <div>
                  <label style={lbl}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <span style={icoL}><Lock size={15} color="var(--text-sec)" /></span>
                    <input
                      type={verClave ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required autoComplete="current-password"
                      style={{ ...inp, paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setVerClave(v => !v)}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-sec)' }}>
                      {verClave ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: color, width: 14, height: 14 }} />
                    <span style={{ color: 'var(--text-sec)', fontSize: 13 }}>Recordarme</span>
                  </label>
                  <button type="button" onClick={irRecuperar}
                    style={{ background: 'none', border: 'none', color, fontSize: 13, cursor: 'pointer', padding: 0, transition: 'color 0.5s' }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button type="submit" disabled={loading} style={btn(BTN_COLOR, loading)}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Ingresando...</>
                    : 'Ingresar al Club'}
                </button>
              </form>

              {/* Divisor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 14px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: 'var(--text-mut)', fontSize: 12 }}>o continúa con</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Google */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                style={{
                  width: '100%', padding: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
              >
                {/* Google icon */}
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.2-2.7-.5-4z" fill="#FFC107"/>
                  <path d="M6.3 14.7l7 5.1C15.2 16 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 11.7z" fill="#FF3D00"/>
                  <path d="M24 45c5.8 0 10.7-1.9 14.7-5.2l-6.8-5.7C29.9 35.9 27.1 37 24 37c-5.8 0-10.7-3.8-12.4-9.1l-7 5.4C8.1 40.7 15.5 45 24 45z" fill="#4CAF50"/>
                  <path d="M44.5 20H24v8.5h11.8c-.9 2.6-2.7 4.8-5.1 6.3l6.8 5.7C41.6 37.1 45 31 45 24c0-1.4-.2-2.7-.5-4z" fill="#1976D2"/>
                </svg>
                Continuar con Google
              </button>

              <p style={{ textAlign: 'center', color: 'var(--text-mut)', fontSize: 13, marginTop: 18 }}>
                ¿No tienes cuenta?{' '}
                <button onClick={() => navigate('/registro')}
                  style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0, transition: 'color 0.5s' }}>
                  Regístrate aquí
                </button>
              </p>
            </>
          )}

          {/* ══ SELECTOR CLUB (super admin) ══ */}
          {vista === 'selector_club' && (
            <>
              <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Super Admin</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: 13, margin: '0 0 18px' }}>Selecciona el club al que quieres acceder</p>

              <input
                type="text"
                placeholder="Buscar club..."
                value={clubSearch}
                onChange={e => setClubSearch(e.target.value)}
                style={{ ...inp, marginBottom: 12 }}
                autoFocus
              />

              <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {clubs
                  .filter(c => c.name.toLowerCase().includes(clubSearch.toLowerCase()) || c.slug.toLowerCase().includes(clubSearch.toLowerCase()))
                  .map(c => (
                    <button
                      key={c.slug}
                      onClick={() => {
                        sessionStorage.setItem('clubId', c.slug);
                        sessionStorage.setItem('userRole', 'ADMIN');
                        navigate('/app');
                      }}
                      style={{
                        width: '100%', padding: '12px 16px', textAlign: 'left',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: 10, cursor: 'pointer', color: '#fff', fontSize: 14,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(106,0,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(106,0,255,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                    >
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{c.slug}</span>
                    </button>
                  ))
                }
              </div>

              {/* ── Lookup de número ── */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', margin: '0 0 10px' }}>Buscar número</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="3201234567"
                    value={phoneQuery}
                    onChange={e => { setPhoneQuery(e.target.value); setPhoneResult(null); }}
                    onKeyDown={e => e.key === 'Enter' && buscarPhone()}
                    style={{ ...inp, flex: 1, marginBottom: 0 }}
                  />
                  <button
                    onClick={buscarPhone}
                    disabled={phoneLoading}
                    style={{ padding: '0 18px', background: '#6A00FF', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                  >
                    {phoneLoading ? '...' : 'Buscar'}
                  </button>
                </div>

                {phoneResult && (
                  <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10 }}>
                    {!phoneResult.success ? (
                      <p style={{ color: '#FF7070', fontSize: 13, margin: 0 }}>{phoneResult.error}</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Rol real en DB */}
                        <div>
                          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 5px' }}>Estado en base de datos</p>
                          {phoneResult.rol === 'visitante' ? (
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>No registrado en ningún club activo</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <RolBadge rol={phoneResult.rol} />
                                {phoneResult.nombre && <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{phoneResult.nombre}</span>}
                              </div>
                              {phoneResult.club_nombre && (
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                                  Club: <span style={{ color: '#fff' }}>{phoneResult.club_nombre}</span>
                                  {phoneResult.cedula && <> · Cédula: <span style={{ color: '#fff' }}>{phoneResult.cedula}</span></>}
                                  {phoneResult.nota && <><br /><span style={{ color: '#F59E0B', fontSize: 11 }}>{phoneResult.nota}</span></>}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Sesión caché */}
                        {phoneResult.sesion_cache && (
                          <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>
                                Sesión bot {phoneResult.sesion_cache.activa ? <span style={{ color: '#00D084' }}>● activa</span> : <span style={{ color: 'rgba(255,255,255,0.25)' }}>● expirada</span>}
                              </p>
                              <button
                                onClick={resetSession}
                                disabled={resetLoading}
                                style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#F87171', cursor: 'pointer' }}
                              >
                                {resetLoading ? '...' : 'Resetear sesión'}
                              </button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <RolBadge rol={phoneResult.sesion_cache.rol_cacheado} />
                              {phoneResult.sesion_cache.club_cacheado && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{phoneResult.sesion_cache.club_cacheado}</span>}
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '4px 0 0' }}>
                              Última actividad: {new Date(phoneResult.sesion_cache.ultima_actividad).toLocaleString('es-CO')}
                            </p>
                          </div>
                        )}
                        {phoneResult._resetMsg && (
                          <p style={{ color: '#00D084', fontSize: 12, margin: 0 }}>✓ {phoneResult._resetMsg}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══ RECUPERAR ══ */}
          {vista === 'recuperar' && (
            <>
              <button onClick={irLogin} style={{ background: 'none', border: 'none', color, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 18, padding: 0, transition: 'color 0.5s' }}>
                <ArrowLeft size={13} /> Volver
              </button>
              <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Recuperar contraseña</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: 13, margin: '0 0 22px', lineHeight: 1.6 }}>
                Escribe tu correo y te enviamos un enlace para crear una nueva contraseña.
              </p>
              <form onSubmit={handleRecuperar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Campo label="Correo electrónico" icon={<Mail size={15} color="var(--text-sec)" />}
                  type="email" value={email} onChange={setEmail}
                  placeholder="tu@email.com" autoComplete="email" required />
                <button type="submit" disabled={loading} style={btn(BTN_COLOR, loading)}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                    : '📧  Enviar enlace de recuperación'}
                </button>
              </form>
              <div style={{ marginTop: 18, padding: '13px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                <p style={{ color: 'var(--text-sec)', fontSize: 12, margin: '0 0 9px' }}>¿No recuerdas el correo?</p>
                <a href={`https://wa.me/${WHATSAPP_SOPORTE}?text=Hola, necesito ayuda para recuperar el acceso a mi club en ZenSports`}
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
              <p style={{ color: 'var(--text-sec)', fontSize: 14, margin: '0 0 4px' }}>Enviamos un enlace a</p>
              <p style={{ color, fontSize: 15, fontWeight: 700, margin: '0 0 18px', transition: 'color 0.5s' }}>{email}</p>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 18, textAlign: 'left' }}>
                <p style={{ color: 'var(--text-sec)', fontSize: 13, margin: 0, lineHeight: 1.8 }}>
                  <strong style={{ color: '#fff' }}>Pasos:</strong><br />
                  1. Abre el correo de ZenSports<br />
                  2. Clic en "Restablecer contraseña"<br />
                  3. Escribe tu nueva contraseña<br />
                  4. Listo — ingresa al dashboard
                </p>
              </div>
              <button onClick={irRecuperar} style={{ background: 'none', border: 'none', color, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.5s' }}>
                Reenviar el correo
              </button>
            </div>
          )}

          {/* ══ NUEVA CONTRASEÑA ══ */}
          {vista === 'nueva_clave' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <KeyRound size={34} color={color} style={{ marginBottom: 8, filter: `drop-shadow(0 0 8px ${color})`, transition: 'filter 0.5s, color 0.5s' }} />
                <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Nueva contraseña</h3>
                <p style={{ color: 'var(--text-sec)', fontSize: 13, margin: 0 }}>Mínimo 8 caracteres</p>
              </div>
              <form onSubmit={handleNuevaClave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>Nueva contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <span style={icoL}><Lock size={15} color="var(--text-sec)" /></span>
                    <input type={verNueva ? 'text' : 'password'} value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="Mínimo 8 caracteres" required minLength={8}
                      style={{ ...inp, paddingRight: 44 }} />
                    <button type="button" onClick={() => setVerNueva(v => !v)}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-sec)' }}>
                      {verNueva ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <Campo label="Confirmar contraseña" icon={<Lock size={15} color="var(--text-sec)" />}
                  type="password" value={confirmPw} onChange={setConfirmPw}
                  placeholder="Repite la contraseña" required />
                <button type="submit" disabled={loading} style={btn(BTN_COLOR, loading)}>
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
              <CheckCircle size={50} color={color} style={{ marginBottom: 14, filter: `drop-shadow(0 0 12px ${color})`, transition: 'filter 0.5s, color 0.5s' }} />
              <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>¡Contraseña actualizada!</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                Ya puedes ingresar al dashboard con tu nueva contraseña.
              </p>
              <button onClick={irLogin} style={btn(BTN_COLOR, false)}>→ Ir al login</button>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes blob-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-4%, 6%) scale(1.06); }
          66%       { transform: translate(5%, -3%) scale(0.96); }
        }
        @keyframes blob-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(5%, -5%) scale(1.08); }
          66%       { transform: translate(-3%, 4%) scale(0.94); }
        }
        @keyframes blob-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-6%, 6%) scale(1.12); }
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

const lbl = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--text-sec)', marginBottom: 7,
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
