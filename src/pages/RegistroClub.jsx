import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../config';
import {
  Loader2, CheckCircle, AlertCircle, Check,
  Lock, Mail, User, Phone, Building2, MapPin, ChevronLeft,
} from 'lucide-react';

const CYCLE_COLORS = ['#10B981', '#00AAFF', '#8B5CF6', '#06B6D4', '#F97316'];

const PALETA = [
  { hex: '#E14924', nombre: 'Naranja Ciudad'    },
  { hex: '#00AAFF', nombre: 'Azul Cobalto'      },
  { hex: '#10B981', nombre: 'Verde Esmeralda'   },
  { hex: '#F59E0B', nombre: 'Dorado Campeón'    },
  { hex: '#8B5CF6', nombre: 'Violeta Real'      },
  { hex: '#EF4444', nombre: 'Rojo Pasión'       },
  { hex: '#F97316', nombre: 'Naranja Solar'     },
  { hex: '#06B6D4', nombre: 'Celeste Deportivo' },
  { hex: '#EC4899', nombre: 'Rosa Dinámico'     },
  { hex: '#84CC16', nombre: 'Lima Fresco'       },
  { hex: '#FACC15', nombre: 'Amarillo Flash'    },
  { hex: '#334155', nombre: 'Azul Marino'       },
];

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
  { icon: '⚡', text: 'Listo en menos de 5 minutos' },
  { icon: '🎨', text: 'Elige el color de tu club' },
  { icon: '🌎', text: 'Para toda América Latina' },
  { icon: '🔒', text: 'Datos seguros y aislados por club' },
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
  const [colorIdx, setColorIdx] = useState(0);
  const [form, setForm]         = useState(INITIAL);
  const [color, setColor]       = useState(PALETA[0].hex);
  const [pais, setPais]         = useState(PAISES[0]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [exito, setExito]       = useState(false);

  const ac = CYCLE_COLORS[colorIdx];

  useEffect(() => {
    const timer = setInterval(() => setColorIdx(i => (i + 1) % CYCLE_COLORS.length), 4000);
    return () => clearInterval(timer);
  }, []);

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
          color,
          codigo_pais:   pais.codigo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Ocurrió un error al registrar el club.');
        setLoading(false);
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
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError('No se pudo conectar con el servidor. ' + (err?.message || 'Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  const colorActivo = PALETA.find(p => p.hex === color) || PALETA[0];

  if (exito) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#04060C', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <img src="/Tony tech.jpg" alt="" style={{ position: 'absolute', top: '50%', left: '50%', width: '200vmax', height: '200vmax', objectFit: 'cover', animation: 'rotate-bg 90s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,6,12,0.88)' }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${ac}10 0%, transparent 60%)`, transition: 'background 0.7s' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '48px 56px', background: 'rgba(8,10,20,0.72)', backdropFilter: 'blur(32px)', borderRadius: 24, border: `1px solid ${ac}30`, boxShadow: `0 0 60px ${ac}15` }}>
          <CheckCircle size={60} color="#00D084" style={{ marginBottom: 20, filter: 'drop-shadow(0 0 16px #00D08488)' }} />
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 10 }}>¡Club registrado con éxito!</h2>
          <p style={{ color: '#9CA3AF', fontSize: 15 }}>Redirigiendo a tu dashboard…</p>
        </div>
        <style>{`@keyframes rotate-bg { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }`}</style>
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
          background: `radial-gradient(ellipse at 40% 50%, ${ac}12 0%, transparent 60%)`,
          transition: 'background 0.7s ease',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── CARD SPLIT ── */}
      <div style={{
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
        maxHeight: '94vh',
        transition: 'border-color 0.5s, box-shadow 0.5s',
      }}>

        {/* ── PANEL IZQ: brand ── */}
        <div style={{ padding: '40px 30px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${ac}22`, border: `1px solid ${ac}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.7s',
            }}>
              <img src="/10894351.png" alt="Logo" style={{ width: 24, height: 24, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: 0, letterSpacing: '-0.2px' }}>ClubContable</p>
              <p style={{ color: '#4B5563', fontSize: 11, margin: 0 }}>Para toda América Latina</p>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Registra tu club
            </h2>
            <h2 style={{ color: ac, fontSize: 26, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px', lineHeight: 1.2, transition: 'color 0.7s' }}>
              en minutos
            </h2>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              Configura, personaliza y comienza a gestionar tu club hoy.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {FEATURES.map(f => (
              <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${ac}18`, border: `1px solid ${ac}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, flexShrink: 0,
                  transition: 'all 0.7s',
                }}>
                  {f.icon}
                </div>
                <span style={{ color: '#9CA3AF', fontSize: 13 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* HUD Ring */}
          <div style={{ position: 'relative', width: 130, height: 130, margin: '20px auto 16px', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1.5px dashed ${ac}55`, animation: 'hud-spin 10s linear infinite', transition: 'border-color 0.7s' }} />
            {[0, 90, 180, 270].map(deg => (
              <div key={deg} style={{ position: 'absolute', inset: 0, borderRadius: '50%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', transform: `rotate(${deg}deg)` }}>
                <div style={{ width: 3, height: 8, borderRadius: 1, background: `${ac}88`, marginTop: 1, transition: 'background 0.7s' }} />
              </div>
            ))}
            <div style={{ position: 'absolute', inset: '16px', borderRadius: '50%', border: `1px solid ${ac}99`, boxShadow: `0 0 18px ${ac}44, inset 0 0 18px ${ac}22`, animation: 'hud-pulse 2s ease-in-out infinite', transition: 'all 0.7s' }} />
            <div style={{ position: 'absolute', inset: '32px', borderRadius: '50%', border: `1.5px dashed ${ac}66`, animation: 'hud-spin-rev 7s linear infinite', transition: 'border-color 0.7s' }} />
            <div style={{ position: 'absolute', inset: '48px', borderRadius: '50%', background: `radial-gradient(circle, ${ac} 0%, ${ac}99 50%, transparent 100%)`, boxShadow: `0 0 20px ${ac}, 0 0 40px ${ac}66`, animation: 'hud-glow 2s ease-in-out infinite', transition: 'all 0.7s' }} />
          </div>

          <p style={{ color: '#374151', fontSize: 11, margin: 0 }}>
            Sistema de gestión deportiva © 2026
          </p>
        </div>

        {/* Divisor vertical */}
        <div style={{ background: `${ac}22`, transition: 'background 0.5s' }} />

        {/* ── PANEL DER: formulario scrollable ── */}
        <div style={{ padding: '36px 36px', overflowY: 'auto', maxHeight: '94vh' }}>

          <div style={{ marginBottom: 22 }}>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, padding: 0 }}
            >
              <ChevronLeft size={15} /> Volver al inicio
            </button>
            <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>Crear cuenta</h3>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Completa los datos de tu club deportivo</p>
          </div>

          {error && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(255,94,94,0.1)', border: '1px solid rgba(255,94,94,0.25)', borderRadius: 12, padding: '11px 14px', marginBottom: 20 }}>
              <AlertCircle size={15} color="#FF5E5E" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: '#FF7070', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <SecLabel text="Datos del club" color={ac} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
              <Campo label="Nombre del club *" icon={<Building2 size={15} color="#6B7280" />}
                value={form.nombre_club} onChange={v => set('nombre_club', v)}
                placeholder="Ej: Atlético Central FC" required />
              <Campo label="Ciudad" icon={<MapPin size={15} color="#6B7280" />}
                value={form.ciudad} onChange={v => set('ciudad', v)}
                placeholder="Ej: Bogotá, Buenos Aires, Lima…" />
            </div>

            <SecLabel text="País" color={ac} />
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {PAISES.map(p => {
                  const activo = pais.codigo === p.codigo;
                  return (
                    <button
                      key={p.codigo}
                      type="button"
                      onClick={() => setPais(p)}
                      style={{
                        background: activo ? `${ac}20` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${activo ? ac : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 8,
                        padding: '7px 8px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.2s',
                        boxShadow: activo ? `0 0 8px ${ac}44` : 'none',
                      }}
                    >
                      <span style={{ fontSize: 14, lineHeight: 1 }}>{p.bandera}</span>
                      <span style={{ color: activo ? '#fff' : '#9CA3AF', fontSize: 11, fontWeight: activo ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p style={{ color: '#6B7280', fontSize: 11, margin: '6px 0 0' }}>
                Código WhatsApp: <strong style={{ color: ac, transition: 'color 0.5s' }}>+{pais.codigo}</strong>
              </p>
            </div>

            <SecLabel text="Administrador" color={ac} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
              <Campo label="Tu nombre *" icon={<User size={15} color="#6B7280" />}
                value={form.nombre_admin} onChange={v => set('nombre_admin', v)}
                placeholder="Ej: Juan García" required />
              <Campo label="Celular (WhatsApp)" icon={<Phone size={15} color="#6B7280" />}
                value={form.celular_admin} onChange={v => set('celular_admin', v)}
                placeholder={`+${pais.codigo} 300 1234567`} type="tel" />
              <Campo label="Email *" icon={<Mail size={15} color="#6B7280" />}
                value={form.email} onChange={v => set('email', v)}
                placeholder="tu@email.com" type="email" required />
            </div>

            <SecLabel text="Contraseña" color={ac} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
              <Campo label="Contraseña * (mínimo 8 caracteres)" icon={<Lock size={15} color="#6B7280" />}
                value={form.password} onChange={v => set('password', v)}
                type="password" required />
              <Campo label="Confirmar contraseña *" icon={<Lock size={15} color="#6B7280" />}
                value={form.confirmacion} onChange={v => set('confirmacion', v)}
                type="password" required />
            </div>

            <SecLabel text="Color del club" color={ac} />
            <div style={{ marginBottom: 26 }}>
              <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 12 }}>
                Aparecerá en tu dashboard y comunicaciones.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {PALETA.map(p => (
                  <button
                    key={p.hex}
                    type="button"
                    title={p.nombre}
                    onClick={() => setColor(p.hex)}
                    style={{
                      width: 30, height: 30,
                      borderRadius: 8, background: p.hex,
                      border: color === p.hex ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: color === p.hex ? `0 0 0 2px ${p.hex}, 0 0 10px ${p.hex}99` : 'none',
                      cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s', padding: 0,
                    }}
                  >
                    {color === p.hex && <Check size={11} color="#fff" strokeWidth={3} />}
                  </button>
                ))}
              </div>
              {/* Preview del color seleccionado */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: `${color}12`,
                border: `1px solid ${color}40`,
                borderRadius: 10, padding: '10px 14px',
                transition: 'all 0.3s',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: color, flexShrink: 0, boxShadow: `0 0 12px ${color}88` }} />
                <div>
                  <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>{colorActivo.nombre}</p>
                  <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>Color principal del dashboard</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? 'rgba(255,255,255,0.07)' : ac,
                border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.5s, box-shadow 0.5s',
                boxShadow: loading ? 'none' : `0 4px 24px ${ac}55`,
                marginBottom: 16,
              }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creando tu club…</>
                : 'Crear mi club gratis'}
            </button>

            <p style={{ textAlign: 'center', color: '#4B5563', fontSize: 13 }}>
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: ac, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0, transition: 'color 0.5s' }}>
                Ingresar
              </button>
            </p>
          </form>
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
        @keyframes hud-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hud-spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes hud-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.06); }
        }
        @keyframes hud-glow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.15); }
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
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 7 }}>{label}</label>
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
