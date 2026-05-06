import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../config';
import { Loader2, CheckCircle, AlertCircle, ChevronLeft, Check } from 'lucide-react';

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
  { codigo: '57',  bandera: '🇨🇴', nombre: 'Colombia'            },
  { codigo: '52',  bandera: '🇲🇽', nombre: 'México'              },
  { codigo: '54',  bandera: '🇦🇷', nombre: 'Argentina'           },
  { codigo: '51',  bandera: '🇵🇪', nombre: 'Perú'               },
  { codigo: '56',  bandera: '🇨🇱', nombre: 'Chile'              },
  { codigo: '593', bandera: '🇪🇨', nombre: 'Ecuador'             },
  { codigo: '58',  bandera: '🇻🇪', nombre: 'Venezuela'           },
  { codigo: '595', bandera: '🇵🇾', nombre: 'Paraguay'            },
  { codigo: '598', bandera: '🇺🇾', nombre: 'Uruguay'             },
  { codigo: '591', bandera: '🇧🇴', nombre: 'Bolivia'             },
  { codigo: '506', bandera: '🇨🇷', nombre: 'Costa Rica'          },
  { codigo: '502', bandera: '🇬🇹', nombre: 'Guatemala'           },
  { codigo: '503', bandera: '🇸🇻', nombre: 'El Salvador'         },
  { codigo: '504', bandera: '🇭🇳', nombre: 'Honduras'            },
  { codigo: '505', bandera: '🇳🇮', nombre: 'Nicaragua'           },
  { codigo: '507', bandera: '🇵🇦', nombre: 'Panamá'              },
  { codigo: '1',   bandera: '🇩🇴', nombre: 'Rep. Dominicana'     },
  { codigo: '34',  bandera: '🇪🇸', nombre: 'España'              },
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
  const [form, setForm]         = useState(INITIAL);
  const [color, setColor]       = useState(PALETA[0].hex);
  const [pais, setPais]         = useState(PAISES[0]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [exito, setExito]       = useState(false);

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

  const colorActivo = PALETA.find(p => p.hex === color) || PALETA[0];

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
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, border: `1px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
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
            <p style={{ color: color, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0, transition: 'color 0.3s' }}>Datos del club</p>

            <Campo label="Nombre del club *" value={form.nombre_club} onChange={v => set('nombre_club', v)} placeholder="Ej: Atlético Central FC" required />
            <Campo label="Ciudad" value={form.ciudad} onChange={v => set('ciudad', v)} placeholder="Ej: Buenos Aires, Lima, Bogotá…" />

            {/* Selector de país */}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>País</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {PAISES.map(p => {
                  const activo = pais.codigo === p.codigo;
                  return (
                    <button
                      key={p.codigo}
                      type="button"
                      onClick={() => setPais(p)}
                      style={{
                        background: activo ? `${color}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${activo ? color : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 8,
                        padding: '7px 8px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.2s',
                        boxShadow: activo ? `0 0 8px ${color}44` : 'none',
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{p.bandera}</span>
                      <span style={{ color: activo ? '#fff' : '#9CA3AF', fontSize: 11, fontWeight: activo ? 600 : 400, transition: 'color 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p style={{ color: '#6B7280', fontSize: 11, margin: '6px 0 0' }}>
                Código del país: <strong style={{ color }}> +{pais.codigo}</strong> — usado para WhatsApp
              </p>
            </div>

            {/* Sección admin */}
            <p style={{ color: color, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '8px 0 0', transition: 'color 0.3s' }}>Administrador</p>

            <Campo label="Tu nombre *" value={form.nombre_admin} onChange={v => set('nombre_admin', v)} placeholder="Ej: Juan García" required />
            <Campo label="Celular (WhatsApp)" value={form.celular_admin} onChange={v => set('celular_admin', v)} placeholder="Ej: +57 300 1234567" type="tel" />
            <Campo label="Email *" value={form.email} onChange={v => set('email', v)} placeholder="tu@email.com" type="email" required />

            {/* Sección contraseña */}
            <p style={{ color: color, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '8px 0 0', transition: 'color 0.3s' }}>Contraseña</p>

            <Campo label="Contraseña * (mínimo 8 caracteres)" value={form.password} onChange={v => set('password', v)} type="password" required />
            <Campo label="Confirmar contraseña *" value={form.confirmacion} onChange={v => set('confirmacion', v)} type="password" required />

            {/* Sección color */}
            <p style={{ color: color, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '8px 0 0', transition: 'color 0.3s' }}>Color del club</p>

            <div>
              <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 10 }}>
                Elige el color principal de tu club — aparecerá en el dashboard y comunicaciones.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {PALETA.map(p => (
                  <button
                    key={p.hex}
                    type="button"
                    title={p.nombre}
                    onClick={() => setColor(p.hex)}
                    style={{
                      width: '100%', aspectRatio: '1',
                      borderRadius: 10,
                      background: p.hex,
                      border: color === p.hex ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: color === p.hex ? `0 0 0 2px ${p.hex}, 0 0 12px ${p.hex}88` : 'none',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                      padding: 0,
                    }}
                  >
                    {color === p.hex && <Check size={14} color="#fff" strokeWidth={3} />}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}88` }} />
                <span style={{ color: '#9CA3AF', fontSize: 12 }}>{colorActivo.nombre}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: 8, width: '100%', background: loading ? '#1A3A5C' : color, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 10, padding: '14px 0', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.3s' }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creando tu club…</>
                : 'Crear mi club gratis'}
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', color: '#4B5563', fontSize: 13, marginTop: 20 }}>
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'color 0.3s' }}>
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
