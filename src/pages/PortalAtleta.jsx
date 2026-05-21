import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function EstadoBadge({ estado }) {
  const cfg = {
    pagado:   { bg: 'rgba(0,208,132,0.12)',  border: 'rgba(0,208,132,0.30)',  color: '#00D084', label: 'Pagado'   },
    pendiente:{ bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)', color: '#F59E0B', label: 'Pendiente'},
    vencido:  { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.30)',  color: '#EF4444', label: 'Vencido'  },
  }[estado] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.35)', label: estado };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function MesChip({ mes_nombre, anio, estado, valor }) {
  const colores = {
    pagado:   { bg: 'rgba(0,208,132,0.10)',  border: 'rgba(0,208,132,0.30)',  dot: '#00D084' },
    pendiente:{ bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B' },
    vencido:  { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)',  dot: '#EF4444' },
  }[estado] || { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', dot: 'rgba(255,255,255,0.2)' };

  return (
    <div style={{ background: colores.bg, border: `1px solid ${colores.border}`, borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: colores.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>{mes_nombre}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>{anio}</span>
      </div>
      {valor > 0 && (
        <div style={{ fontSize: 12, fontWeight: 600, color: colores.dot, paddingLeft: 11 }}>
          ${valor.toLocaleString('es-CO')}
        </div>
      )}
    </div>
  );
}

export default function PortalAtleta() {
  const { clubSlug, cedula } = useParams();
  const [estado, setEstado] = useState('cargando');
  const [datos, setDatos] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(null);

  useEffect(() => {
    document.title = 'Portal del Atleta · ZenSports';

    async function cargar() {
      try {
        const res = await fetch(`${API_BASE}/publico/atleta/${clubSlug}/${cedula}`);
        if (!res.ok) {
          setEstado(res.status === 404 ? 'no-encontrado' : 'error');
          return;
        }
        const json = await res.json();
        if (!json.success) { setEstado('error'); return; }
        setDatos(json);

        const { data } = supabase.storage.from('player-photos').getPublicUrl(`${clubSlug}/${cedula}.jpg`);
        if (data?.publicUrl) setFotoUrl(data.publicUrl);

        setEstado('ok');
      } catch {
        setEstado('error');
      }
    }

    cargar();
  }, [clubSlug, cedula]);

  if (estado === 'cargando') return <Pantalla><Spinner color="#00AAFF" texto="Cargando estado de cuenta…" /></Pantalla>;
  if (estado === 'no-encontrado') return <Pantalla><Mensaje titulo="Atleta no encontrado" sub={`No encontramos el número de cédula ${cedula} en este club.`} /></Pantalla>;
  if (estado === 'error') return <Pantalla><Mensaje titulo="Error al cargar" sub="No se pudo obtener la información. Intenta de nuevo más tarde." /></Pantalla>;

  const { club, atleta, mensualidades, saldo_pendiente, meses_pendientes } = datos;
  const color = club.color || '#00AAFF';
  const initials = club.nombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'FC';
  const nombreCompleto = `${atleta.nombre} ${atleta.apellidos}`.trim();

  const anioActual = new Date().getFullYear();
  const mesActual = mensualidades.find(m => m.anio === anioActual && m.mes === new Date().getMonth() + 1);

  return (
    <div style={{ minHeight: '100vh', background: '#080C14', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff', padding: '24px 16px 48px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .portal-card { animation: fade-in 0.4s ease both; }
        @media (max-width: 480px) { .mes-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>

      {/* Glow de fondo */}
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 480, height: 480, borderRadius: '50%', background: `${color}0D`, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Tarjeta principal: club + atleta */}
        <div className="portal-card" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}30`, borderRadius: 20, overflow: 'hidden', boxShadow: `0 0 60px ${color}14, 0 24px 48px rgba(0,0,0,0.4)` }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}80, ${color})` }} />

          {/* Header club */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {club.logo_url
                ? <img src={club.logo_url} alt="logo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
                : <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color, letterSpacing: 0.5 }}>{initials}</div>
              }
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5 }}>{club.nombre}</div>
                {club.subtitulo && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 }}>{club.subtitulo}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '4px 10px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: 0.5 }}>ZenSports</span>
            </div>
          </div>

          {/* Atleta */}
          <div style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0 }}>
              {fotoUrl
                ? <img src={fotoUrl} alt={nombreCompleto} style={{ width: 72, height: 86, objectFit: 'cover', borderRadius: 12, border: `2px solid ${color}40` }} onError={() => setFotoUrl(null)} />
                : <div style={{ width: 72, height: 86, borderRadius: 12, background: `${color}10`, border: `2px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={`${color}60`} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2, marginBottom: 3 }}>{nombreCompleto}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>CC {cedula}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {atleta.categoria && <Chip label={atleta.categoria} />}
                {atleta.equipo && <Chip label={atleta.equipo} />}
                {atleta.posicion && <Chip label={`${atleta.posicion}${atleta.numero ? ` · #${atleta.numero}` : ''}`} />}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de saldo */}
        <div className="portal-card" style={{ animationDelay: '0.08s', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SaldoCard
            valor={saldo_pendiente}
            label="Saldo pendiente"
            color={saldo_pendiente > 0 ? '#F59E0B' : '#00D084'}
            sub={saldo_pendiente > 0 ? `${meses_pendientes} mes${meses_pendientes !== 1 ? 'es' : ''}` : 'Al día'}
            prefijo="$"
          />
          {mesActual ? (
            <SaldoCard
              valor={null}
              label="Mes actual"
              color={mesActual.estado === 'pagado' ? '#00D084' : '#F59E0B'}
              sub={MESES_CORTO[(mesActual.mes || 1) - 1] + ' ' + mesActual.anio}
              badge={<EstadoBadge estado={mesActual.estado} />}
            />
          ) : (
            <SaldoCard valor={null} label="Mes actual" color="rgba(255,255,255,0.3)" sub="Sin registro" />
          )}
        </div>

        {/* Historial de mensualidades */}
        {mensualidades.length > 0 && (
          <div className="portal-card" style={{ animationDelay: '0.16s', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '18px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Estado por mes</div>
            <div className="mes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {mensualidades.map((m, i) => (
                <MesChip key={i} {...m} />
              ))}
            </div>
          </div>
        )}

        {/* Tabla detalle si hay pendientes */}
        {meses_pendientes > 0 && (
          <div className="portal-card" style={{ animationDelay: '0.24s', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 18, padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: 1, textTransform: 'uppercase' }}>Meses pendientes</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mensualidades.filter(m => m.estado !== 'pagado').map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{m.mes_nombre} {m.anio}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {m.valor > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>${m.valor.toLocaleString('es-CO')}</span>}
                    <EstadoBadge estado={m.estado} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '12px', background: 'rgba(245,158,11,0.06)', borderRadius: 10, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Para regularizar pagos, comunícate con tu club</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: 0.5 }}>ZenSports · Portal del Atleta</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>Información provista por {club.nombre}</div>
        </div>

      </div>
    </div>
  );
}

function Pantalla({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#080C14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
      {children}
    </div>
  );
}

function Spinner({ color = '#00AAFF', texto = 'Cargando…' }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${color}`, borderTopColor: 'transparent', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{texto}</p>
    </div>
  );
}

function Mensaje({ titulo, sub }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 320 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{titulo}</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{sub}</div>
    </div>
  );
}

function Chip({ label }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '2px 9px', letterSpacing: 0.3 }}>{label}</span>
  );
}

function SaldoCard({ valor, label, color, sub, prefijo = '', badge }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      {badge
        ? <div style={{ marginBottom: 4 }}>{badge}</div>
        : valor !== null
          ? <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{prefijo}{valor.toLocaleString('es-CO')}</div>
          : null
      }
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, fontWeight: 500 }}>{sub}</div>
    </div>
  );
}
