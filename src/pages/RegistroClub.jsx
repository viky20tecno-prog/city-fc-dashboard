import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { API_BASE_URL, SUPPORT_WHATSAPP } from '../config';
import {
  Loader2, CheckCircle, AlertCircle, Check,
  Lock, Mail, User, Phone, Building2, MapPin, ChevronLeft,
  MessageCircle, ArrowRight, Eye, EyeOff,
  Timer, Palette, Globe, ShieldCheck,
  MonitorPlay, Paintbrush, KeyRound, Gift,
} from 'lucide-react';
import { PALETA } from '../components/ThemeSelector';
import ZenSportsLogo from '../components/brand/ZenSportsLogo';

const CYCLE_COLORS = ['#10B981', '#00AAFF', '#8B5CF6', '#0D9488', '#F97316'];

const PAISES = [
  { codigo: '57',  bandera: '🇨🇴', nombre: 'Colombia'        },
  { codigo: '52',  bandera: '🇲🇽', nombre: 'México'          },
  { codigo: '54',  bandera: '🇦🇷', nombre: 'Argentina'       },
  { codigo: '51',  bandera: '🇵🇪', nombre: 'Perú'            },
  { codigo: '56',  bandera: '🇨🇱', nombre: 'Chile'           },
  { codigo: '593', bandera: '🇪🇨', nombre: 'Ecuador'         },
  { codigo: '58',  bandera: '🇻🇪', nombre: 'Venezuela'       },
  { codigo: '595', bandera: '🇵🇾', nombre: 'Paraguay'        },
  { codigo: '598', bandera: '🇺🇾', nombre: 'Uruguay'         },
  { codigo: '591', bandera: '🇧🇴', nombre: 'Bolivia'         },
  { codigo: '506', bandera: '🇨🇷', nombre: 'Costa Rica'      },
  { codigo: '502', bandera: '🇬🇹', nombre: 'Guatemala'       },
  { codigo: '503', bandera: '🇸🇻', nombre: 'El Salvador'     },
  { codigo: '504', bandera: '🇭🇳', nombre: 'Honduras'        },
  { codigo: '505', bandera: '🇳🇮', nombre: 'Nicaragua'       },
  { codigo: '507', bandera: '🇵🇦', nombre: 'Panamá'          },
  { codigo: '1',   bandera: '🇩🇴', nombre: 'Rep. Dominicana' },
  { codigo: '34',  bandera: '🇪🇸', nombre: 'España'          },
];

const FEATURES = [
  { Icon: Timer,       color: '#FFC107', text: 'Listo en menos de 5 minutos'       },
  { Icon: Palette,     color: '#A78BFA', text: 'Elige el color de tu club'          },
  { Icon: Globe,       color: '#38BDF8', text: 'Para clubes de todo el mundo'        },
  { Icon: ShieldCheck, color: '#34D399', text: 'Datos seguros y aislados por club'  },
];

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
  const [searchParams] = useSearchParams();
  const [colorIdx, setColorIdx] = useState(0);

  // Si viene de la landing con un color elegido, usarlo como valor inicial
  const colorFromLanding = searchParams.get('color');
  const initialColor = colorFromLanding && PALETA.some(p => p.hex === decodeURIComponent(colorFromLanding))
    ? decodeURIComponent(colorFromLanding)
    : PALETA[0].hex;

  useEffect(() => { document.title = 'ZenSports — Registrar tu club'; }, []);

  const nombreFromLanding  = searchParams.get('nombre') ? decodeURIComponent(searchParams.get('nombre')) : '';
  const whatsappFromLanding = searchParams.get('wa')    ? decodeURIComponent(searchParams.get('wa'))    : '';

  const [form, setForm]         = useState({ ...INITIAL, nombre_club: nombreFromLanding, celular_admin: whatsappFromLanding });
  const [color, setColor]       = useState(initialColor);
  const [pais, setPais]         = useState(PAISES[0]);
  const [loading, setLoading]   = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const [error, setError]       = useState('');
  const [exito, setExito]       = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [showConf, setShowConf] = useState(false);

  const ac = CYCLE_COLORS[colorIdx];

  useEffect(() => {
    const timer = setInterval(() => setColorIdx(i => (i + 1) % CYCLE_COLORS.length), 10000);
    return () => clearInterval(timer);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSlowHint(false);
    if (form.password !== form.confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);

    // Aviso de "tardando" a los 5 s; timeout duro a los 25 s
    const slowTimer    = setTimeout(() => setSlowHint(true), 5000);
    const controller   = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(`${API_BASE_URL}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          nombre_club:   form.nombre_club.trim().toUpperCase(),
          ciudad:        form.ciudad.trim().toUpperCase(),
          nombre_admin:  form.nombre_admin.trim().toUpperCase(),
          celular_admin: form.celular_admin.trim(),
          email:         form.email.trim().toLowerCase(),
          password:      form.password,
          color,
          codigo_pais:   pais.codigo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Ocurrió un error al registrar el club.');
        return;
      }
      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({
          access_token:  data.access_token,
          refresh_token: data.refresh_token,
        });
        localStorage.setItem('clubId', data.club_slug);
      }
      setExito(true);
      setTimeout(() => navigate('/app'), 2000);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('El servidor tardó demasiado en responder. Verifica tu conexión e intenta de nuevo.');
      } else {
        setError('No se pudo conectar con el servidor. ' + (err?.message || 'Intenta de nuevo.'));
      }
    } finally {
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
      setLoading(false);
      setSlowHint(false);
    }
  };

  const showForm = !!nombreFromLanding;

  if (exito) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03050D', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '20%', left: '30%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, #00D08422 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '48px 56px', background: 'rgba(8,10,20,0.72)', backdropFilter: 'blur(32px)', borderRadius: 24, border: '1px solid rgba(0,208,132,0.25)', boxShadow: '0 0 60px rgba(0,208,132,0.1)' }}>
          <CheckCircle size={60} color="#00D084" style={{ marginBottom: 20, filter: 'drop-shadow(0 0 16px #00D08488)' }} />
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 10 }}>¡Club registrado con éxito!</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 15 }}>Redirigiendo a tu dashboard…</p>
        </div>
      </div>
    );
  }

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
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: `radial-gradient(circle, ${ac}18 0%, transparent 70%)`,
          filter: 'blur(60px)', transition: 'background 0.8s',
          animation: 'blob-drift-1 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-10%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: `radial-gradient(circle, ${ac}12 0%, transparent 70%)`,
          filter: 'blur(80px)', transition: 'background 0.8s',
          animation: 'blob-drift-2 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .reg-panel-izq { display: none !important; }
          .reg-divider    { display: none !important; }
          .reg-card       { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── CARD SPLIT ── */}
      <div className="reg-card" style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 980,
        display: 'grid', gridTemplateColumns: '320px 1px 1fr',
        background: 'rgba(8, 10, 20, 0.72)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: `1px solid ${ac}30`,
        borderRadius: 24,
        boxShadow: `0 0 80px ${ac}15, 0 32px 80px rgba(0,0,0,0.55)`,
        overflow: 'hidden',
        maxHeight: showForm ? 'none' : '94vh',
        transition: 'border-color 0.5s, box-shadow 0.5s',
      }}>

        {/* ── PANEL IZQ: brand ── */}
        <div className="reg-panel-izq" style={{ padding: '40px 30px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{ marginBottom: 28 }}>
            <ZenSportsLogo size="md" variant="full" style={{ marginBottom: 4 }} />
            <p style={{ color: 'var(--text-mut)', fontSize: 11, margin: '4px 0 0 38px' }}>Sistema operativo deportivo</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Registra tu club
            </h2>
            <h2 style={{ color: ac, fontSize: 26, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px', lineHeight: 1.2, transition: 'color 0.7s' }}>
              en minutos
            </h2>
            <p style={{ color: 'var(--text-sec)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              Configura, personaliza y comienza a gestionar tu club hoy.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {FEATURES.map(({ Icon, color: ic, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${ic}18`, border: `1px solid ${ic}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={15} color={ic} strokeWidth={1.8} />
                </div>
                <span style={{ color: 'var(--text-sec)', fontSize: 13 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* ── Blob Morfante ── */}
          <div style={{
            width: 130, height: 130, margin: '20px auto 16px', flexShrink: 0,
            background: `radial-gradient(circle at 38% 38%, ${ac} 0%, ${ac}AA 35%, ${ac}44 65%, transparent 100%)`,
            animation: 'blob-morph 10s ease-in-out infinite',
            filter: 'blur(1.5px)',
            boxShadow: `0 0 40px ${ac}44, 0 0 80px ${ac}18`,
            transition: 'background 0.7s, box-shadow 0.7s',
          }} />

          <p style={{ color: 'var(--text-mut)', fontSize: 11, margin: 0 }}>
            ZenSports · ZENPRA © 2026
          </p>
        </div>

        {/* Divisor vertical */}
        <div className="reg-divider" style={{ background: `${ac}22`, transition: 'background 0.5s' }} />

        {/* ── PANEL DER: formulario o contacto ── */}
        <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: showForm ? 'flex-start' : 'center', minHeight: 480, overflowY: 'auto' }}>

          <button
            onClick={() => navigate(showForm ? '/' : '/login')}
            style={{ background: 'none', border: 'none', color: 'var(--text-sec)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 24, padding: 0, alignSelf: 'flex-start' }}
          >
            <ChevronLeft size={15} /> {showForm ? 'Volver al inicio' : 'Volver al inicio'}
          </button>

          {showForm ? (
            /* ── Formulario de auto-registro ── */
            <>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.25 }}>
                  Activa tu prueba gratuita
                </h3>
                <p style={{ color: 'var(--text-sec)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                  Tu consultor ya te explicó todo. Completa tus datos para comenzar.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <Campo label="Nombre del club" icon={<Building2 size={15} color="rgba(255,255,255,0.3)" />}
                  value={form.nombre_club} onChange={v => set('nombre_club', v)} placeholder="CITY FC" required />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Campo label="Ciudad" icon={<MapPin size={15} color="rgba(255,255,255,0.3)" />}
                    value={form.ciudad} onChange={v => set('ciudad', v)} placeholder="Medellín" required />
                  <Campo label="Tu nombre" icon={<User size={15} color="rgba(255,255,255,0.3)" />}
                    value={form.nombre_admin} onChange={v => set('nombre_admin', v)} placeholder="Nombre completo" required />
                </div>

                {/* País + Celular */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 7 }}>Celular</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={pais.codigo} onChange={e => setPais(PAISES.find(p => p.codigo === e.target.value) || PAISES[0])}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: '12px 10px', color: '#fff', fontSize: 14, outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
                      {PAISES.map(p => <option key={p.codigo} value={p.codigo} style={{ background: '#0F1219' }}>{p.bandera} +{p.codigo}</option>)}
                    </select>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Phone size={15} color="rgba(255,255,255,0.3)" /></span>
                      <input value={form.celular_admin} onChange={e => set('celular_admin', e.target.value)}
                        placeholder="3001234567" inputMode="tel"
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: '12px 16px 12px 40px', fontSize: 14, color: '#fff', outline: 'none' }} />
                    </div>
                  </div>
                </div>

                <Campo label="Email" icon={<Mail size={15} color="rgba(255,255,255,0.3)" />}
                  type="email" value={form.email} onChange={v => set('email', v)} placeholder="correo@tuclub.com" required />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Contraseña con ojito */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 7 }}>Contraseña</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Lock size={15} color="rgba(255,255,255,0.3)" /></span>
                      <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                        placeholder="Mín. 8 caracteres" required
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: '12px 40px 12px 40px', fontSize: 14, color: '#fff', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex' }}>
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  {/* Confirmar con ojito */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 7 }}>Confirmar contraseña</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Lock size={15} color="rgba(255,255,255,0.3)" /></span>
                      <input type={showConf ? 'text' : 'password'} value={form.confirmacion} onChange={e => set('confirmacion', e.target.value)}
                        placeholder="Repetir contraseña" required
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${form.confirmacion && form.confirmacion !== form.password ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.10)'}`, borderRadius: 12, padding: '12px 40px 12px 40px', fontSize: 14, color: '#fff', outline: 'none', transition: 'border-color 0.2s' }} />
                      <button type="button" onClick={() => setShowConf(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex' }}>
                        {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {form.confirmacion && form.confirmacion !== form.password && (
                      <p style={{ color: '#EF4444', fontSize: 11, margin: '4px 0 0' }}>Las contraseñas no coinciden</p>
                    )}
                  </div>
                </div>

                {/* Color del club */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 10 }}>Color del club</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PALETA.slice(0, 8).map(p => (
                      <button key={p.hex} type="button" onClick={() => setColor(p.hex)}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: p.hex, border: color === p.hex ? `3px solid #fff` : '3px solid transparent', cursor: 'pointer', boxShadow: color === p.hex ? `0 0 12px ${p.hex}` : 'none', transition: 'all 0.2s', padding: 0, flexShrink: 0 }}
                        title={p.nombre} />
                    ))}
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10 }}>
                    <AlertCircle size={15} color="#EF4444" />
                    <span style={{ color: '#EF4444', fontSize: 13 }}>{error}</span>
                  </div>
                )}
                {slowHint && !error && (
                  <p style={{ color: 'var(--text-mut)', fontSize: 12, textAlign: 'center', margin: 0 }}>Esto está tardando un poco… no cierres la página.</p>
                )}

                <button type="submit" disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '14px', background: loading ? 'rgba(255,255,255,0.08)' : color, border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : `0 4px 24px ${color}50`, transition: 'background 0.3s, box-shadow 0.3s', marginTop: 4 }}>
                  {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={18} />}
                  {loading ? 'Creando tu club…' : 'Activar prueba gratuita'}
                </button>

                <p style={{ textAlign: 'center', color: 'var(--text-mut)', fontSize: 12, margin: 0 }}>
                  5 días gratis · Sin tarjeta · Cancela cuando quieras
                </p>
              </form>

              <p style={{ textAlign: 'center', color: 'var(--text-mut)', fontSize: 13, margin: '16px 0 0' }}>
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: ac, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0, transition: 'color 0.5s' }}>
                  Ingresar
                </button>
              </p>
            </>
          ) : (
            /* ── Pantalla del consultor ── */
            <>
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.25 }}>
                  ¿Quieres registrar<br />tu club?
                </h3>
                <p style={{ color: 'var(--text-sec)', fontSize: 14, margin: 0, lineHeight: 1.65 }}>
                  Antes de crear tu cuenta un Consultor ZenSports te hace una demostración personalizada,
                  te explica todo en menos de 10 minutos y te asigna tus credenciales.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {[
                  { Icon: MonitorPlay, color: '#00D084', text: 'Demo en vivo de la plataforma'            },
                  { Icon: Paintbrush,  color: '#E14924', text: 'Personalizamos el color y logo de tu club' },
                  { Icon: KeyRound,    color: '#FBBF24', text: 'Credenciales seguras asignadas por nosotros'},
                  { Icon: Gift,        color: '#67E8F9', text: '5 días de prueba gratuita sin tarjeta'    },
                ].map(({ Icon, color: ic, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: `${ic}18`, border: `1px solid ${ic}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} color={ic} strokeWidth={1.8} />
                    </div>
                    <span style={{ color: 'var(--text-sec)', fontSize: 13 }}>{text}</span>
                  </div>
                ))}
              </div>

              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('¡Hola ZenSports! 🏆 Estoy en el proceso de registro y necesito ayuda. ¿Me pueden acompañar? Quiero que mi club esté listo hoy 🚀')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 24px', background: '#25D366', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(37,211,102,0.4)', transition: 'opacity 0.2s', marginBottom: 14 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                <MessageCircle size={20} />
                Hablar con un Consultor ZenSports
                <ArrowRight size={16} />
              </a>

              <p style={{ textAlign: 'center', color: 'var(--text-mut)', fontSize: 12, margin: '0 0 20px', lineHeight: 1.5 }}>
                Respuesta en minutos · Lunes a sábado · Sin compromiso
              </p>

              <p style={{ textAlign: 'center', color: 'var(--text-mut)', fontSize: 13, margin: 0 }}>
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: ac, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0, transition: 'color 0.5s' }}>
                  Ingresar
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blob-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(4%, 6%) scale(1.06); }
          66%       { transform: translate(-3%, -4%) scale(0.96); }
        }
        @keyframes blob-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-5%, -4%) scale(1.08); }
          66%       { transform: translate(3%, 5%) scale(0.94); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes blob-morph {
          0%   { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          16%  { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          33%  { border-radius: 50% 60% 30% 40% / 40% 30% 70% 60%; }
          50%  { border-radius: 40% 60% 50% 70% / 60% 50% 40% 30%; }
          66%  { border-radius: 70% 30% 50% 50% / 30% 50% 60% 70%; }
          83%  { border-radius: 45% 55% 65% 35% / 55% 45% 35% 65%; }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        }
        input::placeholder { color: #374151; }
        input:focus {
          outline: none;
          border-color: ${ac} !important;
          box-shadow: 0 0 0 3px ${ac}22;
        }
      `}</style>
    </div>
  );
}

function SecLabel({ text, color }) {
  return (
    <p style={{ color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 10px', transition: 'color 0.5s' }}>
      {text}
    </p>
  );
}

function Campo({ label, icon, type = 'text', value, onChange, placeholder, required = false }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 7 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            paddingTop: 12, paddingBottom: 12,
            paddingLeft: 40, paddingRight: 16,
            fontSize: 14, color: '#fff',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
      </div>
    </div>
  );
}
