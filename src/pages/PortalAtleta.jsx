import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

export default function PortalAtleta() {
  const { clubSlug, cedula: cedulaParam } = useParams();
  const navigate = useNavigate();

  const [club, setClub] = useState(null);
  const [clubCargando, setClubCargando] = useState(true);

  const [cedula, setCedula] = useState(cedulaParam || '');
  const [buscando, setBuscando] = useState(false);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    document.title = 'Estado de Cuenta · ZenSports';
    async function cargarClub() {
      try {
        const { data } = await supabase
          .from('clubs')
          .select('config')
          .eq('slug', clubSlug)
          .single();
        if (data?.config) setClub(data.config);
      } catch { /* usa defaults */ }
      finally { setClubCargando(false); }
    }
    cargarClub();
  }, [clubSlug]);

  useEffect(() => {
    if (cedulaParam) buscar(cedulaParam);
  }, [cedulaParam]); // eslint-disable-line

  async function buscar(ced) {
    const id = (ced || cedula).replace(/\D/g, '').trim();
    if (!id) { inputRef.current?.focus(); return; }
    setBuscando(true);
    setError(null);
    setDatos(null);
    setFotoUrl(null);
    try {
      const res = await fetch(`${API_BASE}/publico/atleta/${clubSlug}/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(res.status === 404
          ? 'No encontramos ningún atleta con esa identificación.'
          : 'Error al consultar. Intenta de nuevo.');
        return;
      }
      setDatos(json);
      if (!club) setClub(json.club);
      if (json.atleta?.foto_url) {
        setFotoUrl(json.atleta.foto_url);
      } else {
        const { data } = supabase.storage.from('player-photos').getPublicUrl(`${clubSlug}/${id}.jpg`);
        if (data?.publicUrl) setFotoUrl(data.publicUrl);
      }
    } catch {
      setError('No se pudo conectar. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setBuscando(false);
    }
  }

  function limpiar() {
    setDatos(null);
    setError(null);
    setCedula('');
    setTimeout(() => inputRef.current?.focus(), 100);
    if (cedulaParam) navigate(`/p/${clubSlug}`, { replace: true });
  }

  const color       = club?.color || '#00AAFF';
  const clubNombre  = club?.nombre || clubSlug || 'Club';
  const initials    = clubNombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'FC';

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#080C14',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fade-up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fade-up .35s ease both; }
        .btn-primary { transition: opacity .15s, transform .1s, box-shadow .15s; }
        .btn-primary:active { transform: scale(.97); opacity:.88; }
        .btn-primary:hover { opacity: .92; }
        .input-cedula { transition: border-color .15s, box-shadow .15s; }
        .input-cedula:focus { outline: none; }
        .row-mensualidad:nth-child(even) { background: rgba(255,255,255,0.025) !important; }
      `}</style>

      {/* Glow ambiental */}
      <div style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 420, height: 420, borderRadius: '50%',
        background: `${color}0A`, filter: 'blur(80px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Contenido principal */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        padding: '0 20px',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box',
      }}>

        {/* Header club */}
        <div className="fade-up" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          paddingTop: datos ? 24 : 56,
          paddingBottom: datos ? 16 : 32,
          transition: 'padding .3s ease',
        }}>
          {clubCargando
            ? <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
            : club?.logo_url
              ? <img src={club.logo_url} alt="logo" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 16, border: `1px solid ${color}30`, boxShadow: `0 0 24px ${color}20` }} />
              : <div style={{ width: 64, height: 64, borderRadius: 16, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color, letterSpacing: 0.5 }}>{initials}</div>
          }
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.2px' }}>{clubNombre}</div>
            {club?.subtitulo && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 3 }}>
                {club.subtitulo}
              </div>
            )}
          </div>
          {!datos && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${color}12`, border: `1px solid ${color}25`,
              borderRadius: 999, padding: '5px 14px',
              fontSize: 11, fontWeight: 600, color: `${color}CC`, letterSpacing: 0.3,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              Portal de Estado de Cuenta
            </div>
          )}
        </div>

        {/* Formulario de búsqueda */}
        {!datos && (
          <div className="fade-up" style={{ animationDelay: '.07s' }}>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 22,
              padding: '24px 20px',
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 4, textAlign: 'center' }}>
                Consulta tu estado de cuenta
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 20 }}>
                Ingresa tu número de identificación
              </p>

              {/* Input */}
              <input
                ref={inputRef}
                className="input-cedula"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ej: 1098765432"
                value={cedula}
                onChange={e => { setCedula(e.target.value.replace(/\D/g, '')); setError(null); }}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.07)',
                  border: `1.5px solid rgba(255,255,255,0.12)`,
                  borderRadius: 14,
                  padding: '15px 18px',
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: 1.5,
                  boxSizing: 'border-box',
                  marginBottom: 10,
                }}
              />

              {/* Botón full-width */}
              <button
                className="btn-primary"
                onClick={() => buscar()}
                disabled={buscando || !cedula}
                style={{
                  width: '100%',
                  background: cedula ? color : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: 14,
                  padding: '15px',
                  color: cedula ? '#fff' : 'rgba(255,255,255,0.25)',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: cedula ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: cedula ? `0 4px 24px ${color}35` : 'none',
                  transition: 'background .2s, box-shadow .2s, color .2s',
                }}
              >
                {buscando
                  ? <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                  : <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      Consultar
                    </>
                }
              </button>

              {error && (
                <div style={{
                  marginTop: 12, padding: '12px 16px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
                  borderRadius: 12, fontSize: 13, color: '#FCA5A5', textAlign: 'center',
                }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resultado */}
        {datos && <Resultado datos={datos} fotoUrl={fotoUrl} color={color} onNuevaBusqueda={limpiar} />}

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 40 }} />

      </main>

      {/* Footer ZenSports */}
      <footer style={{
        position: 'relative', zIndex: 1,
        padding: '20px 20px env(safe-area-inset-bottom, 20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.015)',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {/* Logo + nombre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #6C3EFF 0%, #9B5DFF 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(108,62,255,0.35)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span style={{
              fontSize: 16, fontWeight: 900, letterSpacing: 2,
              background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              ZENSPORTS
            </span>
          </div>
          {/* Tagline */}
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0, letterSpacing: 0.5, textAlign: 'center' }}>
            Gestión deportiva inteligente · AI Powered
          </p>
          {/* Link */}
          <a href="https://zensports.zenpra.ai" target="_blank" rel="noreferrer"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', textDecoration: 'none', letterSpacing: 0.3, marginTop: 2 }}>
            zensports.zenpra.ai
          </a>
        </div>
      </footer>
    </div>
  );
}

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(n) || 0);

function Resultado({ datos, fotoUrl, color, onNuevaBusqueda }) {
  const { atleta, mensualidades, saldo_pendiente, total_pagado, meses_pendientes } = datos;
  const [imgError, setImgError] = useState(false);
  const nombreCompleto = `${atleta.nombre} ${atleta.apellidos || ''}`.trim();
  const alDia = saldo_pendiente === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Tarjeta atleta */}
      <div className="fade-up" style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}28`,
        borderRadius: 18, overflow: 'hidden',
        boxShadow: `0 0 40px ${color}0E`,
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}50)` }} />
        <div style={{ padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ flexShrink: 0 }}>
            {fotoUrl && !imgError
              ? <img src={fotoUrl} alt={nombreCompleto} onError={() => setImgError(true)} style={{ width: 60, height: 72, objectFit: 'cover', borderRadius: 10, border: `2px solid ${color}35` }} />
              : <div style={{ width: 60, height: 72, borderRadius: 10, background: `${color}12`, border: `2px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={`${color}60`} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 }}>{nombreCompleto}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>CC {atleta.cedula}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {atleta.categoria && <Chip label={atleta.categoria} />}
              {atleta.equipo    && <Chip label={atleta.equipo} />}
              {atleta.posicion  && <Chip label={atleta.posicion} />}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="fade-up" style={{ animationDelay: '.06s', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: `${color}0D`, border: `1px solid ${color}28`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Total pagado</div>
          <div style={{ fontSize: 19, fontWeight: 900, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{fmt(total_pagado)}</div>
        </div>
        <div style={{
          background: alDia ? 'rgba(0,208,132,0.07)' : 'rgba(245,158,11,0.07)',
          border: `1px solid ${alDia ? 'rgba(0,208,132,0.22)' : 'rgba(245,158,11,0.22)'}`,
          borderRadius: 14, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Saldo pendiente</div>
          <div style={{ fontSize: 19, fontWeight: 900, color: alDia ? '#00D084' : '#F59E0B', letterSpacing: '-0.5px', lineHeight: 1 }}>
            {alDia ? '✓ Al día' : fmt(saldo_pendiente)}
          </div>
          {!alDia && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{meses_pendientes} mes{meses_pendientes !== 1 ? 'es' : ''} pendiente{meses_pendientes !== 1 ? 's' : ''}</div>}
        </div>
      </div>

      {/* Mensualidades */}
      {mensualidades.length > 0 && (
        <div className="fade-up" style={{ animationDelay: '.12s', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 10px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Mensualidades {new Date().getFullYear()}
          </div>
          <div>
            {mensualidades.map((m, i) => (
              <div key={i} className="row-mensualidad" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', minWidth: 88, flexShrink: 0 }}>{m.mes}</span>
                  <EstadoBadge estado={m.estado} />
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{fmt(m.valor_pagado)}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}> / {fmt(m.valor_oficial)}</span>
                </div>
              </div>
            ))}
          </div>
          {!alDia && (
            <div style={{ margin: '8px 16px 14px', padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 10, textAlign: 'center', fontSize: 12, color: 'rgba(245,158,11,0.8)' }}>
              Comunícate con tu club para regularizar tus pagos
            </div>
          )}
        </div>
      )}

      {/* Botón nueva consulta */}
      <div className="fade-up" style={{ animationDelay: '.18s', paddingBottom: 8 }}>
        <button onClick={onNuevaBusqueda} style={{
          width: '100%', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12,
          padding: '13px', color: 'rgba(255,255,255,0.45)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          ← Consultar otra cédula
        </button>
      </div>
    </div>
  );
}

const ESTADO_CFG = {
  pagado:      { bg: 'rgba(0,208,132,0.12)',   border: 'rgba(0,208,132,0.28)',   color: '#00D084', label: 'Al día'      },
  pendiente:   { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)',  color: '#F59E0B', label: 'Pendiente'   },
  vencido:     { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.28)',   color: '#EF4444', label: 'Vencido'     },
  parcial:     { bg: 'rgba(74,158,255,0.12)',  border: 'rgba(74,158,255,0.28)',  color: '#4A9EFF', label: 'Parcial'     },
  por_validar: { bg: 'rgba(192,120,255,0.12)', border: 'rgba(192,120,255,0.28)', color: '#C678FF', label: 'Por validar' },
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CFG[estado] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.3)', label: estado };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function Chip({ label }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}
