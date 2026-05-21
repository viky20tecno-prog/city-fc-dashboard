import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

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

  // Carga datos del club (para mostrar branding en la pantalla de búsqueda)
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

  // Si viene con cédula en la URL, busca automáticamente
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
        setError(res.status === 404 ? 'No encontramos ningún atleta con esa identificación.' : 'Error al consultar. Intenta de nuevo.');
        return;
      }
      setDatos(json);
      if (!club) setClub(json.club);
      // Foto desde bucket público
      const { data } = supabase.storage.from('player-photos').getPublicUrl(`${clubSlug}/${id}.jpg`);
      if (data?.publicUrl) setFotoUrl(data.publicUrl);
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

  const color = club?.color || '#00AAFF';
  const clubNombre = club?.nombre || clubSlug || 'Club';
  const initials = clubNombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'FC';

  return (
    <div style={{ minHeight: '100vh', background: '#080C14', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fade-up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        .fade-up { animation: fade-up .35s ease both; }
        .btn-consultar { transition: opacity .15s, transform .1s; }
        .btn-consultar:active { transform: scale(.97); opacity:.85; }
        .mes-chip { transition: transform .1s; }
        .mes-chip:hover { transform: scale(1.03); }
        .input-cedula:focus { outline: none; border-color: var(--cc) !important; box-shadow: 0 0 0 3px rgba(0,170,255,.15) !important; }
        @media (max-width: 480px) { .mes-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>

      {/* Glow */}
      <div style={{ position:'fixed', top:'10%', left:'50%', transform:'translateX(-50%)', width:500, height:500, borderRadius:'50%', background:`${color}0C`, filter:'blur(90px)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px 64px', position: 'relative', zIndex: 1 }}>

        {/* Header club */}
        <div className="fade-up" style={{ display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, marginBottom: datos ? 20 : 32, paddingTop: 16 }}>
          {clubCargando
            ? <div style={{ width:56, height:56, borderRadius:14, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }} />
            : club?.logo_url
              ? <img src={club.logo_url} alt="logo" style={{ width:56, height:56, objectFit:'contain', borderRadius:14, border:`1px solid ${color}30` }} />
              : <div style={{ width:56, height:56, borderRadius:14, background:`${color}18`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color, letterSpacing:0.5 }}>{initials}</div>
          }
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:800, letterSpacing:0.3 }}>{clubNombre}</div>
            {club?.subtitulo && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', letterSpacing:1.5, textTransform:'uppercase', marginTop:2 }}>{club.subtitulo}</div>}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:500 }}>Portal de Estado de Cuenta</div>
        </div>

        {/* BÚSQUEDA — siempre visible arriba */}
        {!datos && (
          <div className="fade-up" style={{ animationDelay:'.05s', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, padding:'24px 20px', marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:16, textAlign:'center', lineHeight:1.5 }}>
              Ingresa tu número de identificación<br/>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:400 }}>para ver el estado de tus mensualidades</span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <input
                ref={inputRef}
                className="input-cedula"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ej: 1098765432"
                value={cedula}
                onChange={e => { setCedula(e.target.value.replace(/\D/g,'')); setError(null); }}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                style={{ flex:1, background:'rgba(255,255,255,0.06)', border:`1px solid rgba(255,255,255,0.12)`, borderRadius:12, padding:'14px 16px', color:'#fff', fontSize:17, fontWeight:600, letterSpacing:1, '--cc': color }}
              />
              <button
                className="btn-consultar"
                onClick={() => buscar()}
                disabled={buscando || !cedula}
                style={{ background: color, border:'none', borderRadius:12, padding:'14px 20px', color:'#fff', fontSize:14, fontWeight:700, cursor: cedula ? 'pointer' : 'not-allowed', opacity: cedula ? 1 : 0.4, display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', boxShadow:`0 4px 20px ${color}40` }}
              >
                {buscando
                  ? <span style={{ width:18, height:18, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', display:'inline-block', animation:'spin .7s linear infinite' }} />
                  : <>Consultar <span style={{ fontSize:16 }}>→</span></>
                }
              </button>
            </div>
            {error && (
              <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.20)', borderRadius:10, fontSize:13, color:'#FCA5A5', textAlign:'center' }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* RESULTADO */}
        {datos && <Resultado datos={datos} fotoUrl={fotoUrl} color={color} onNuevaBusqueda={limpiar} />}

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:24 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.18)', fontWeight:600 }}>ZenSports</span>
          </div>
        </div>

      </div>
    </div>
  );
}

const fmt = (n) => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(parseFloat(n) || 0);

function Resultado({ datos, fotoUrl, color, onNuevaBusqueda }) {
  const { atleta, mensualidades, saldo_pendiente, total_pagado, meses_pendientes } = datos;
  const [imgError, setImgError] = useState(false);
  const nombreCompleto = `${atleta.nombre} ${atleta.apellidos || ''}`.trim();
  const alDia = saldo_pendiente === 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Tarjeta atleta */}
      <div className="fade-up" style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${color}28`, borderRadius:18, overflow:'hidden', boxShadow:`0 0 40px ${color}10` }}>
        <div style={{ height:3, background:`linear-gradient(90deg, ${color}, ${color}60)` }} />
        <div style={{ padding:'16px 18px', display:'flex', gap:14, alignItems:'center' }}>
          <div style={{ flexShrink:0 }}>
            {fotoUrl && !imgError
              ? <img src={fotoUrl} alt={nombreCompleto} onError={() => setImgError(true)} style={{ width:60, height:72, objectFit:'cover', borderRadius:10, border:`2px solid ${color}35` }} />
              : <div style={{ width:60, height:72, borderRadius:10, background:`${color}12`, border:`2px solid ${color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={`${color}60`} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:800, letterSpacing:'-0.3px', lineHeight:1.2 }}>{nombreCompleto}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:8 }}>CC {atleta.cedula}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {atleta.categoria && <Chip label={atleta.categoria} />}
              {atleta.equipo    && <Chip label={atleta.equipo} />}
              {atleta.posicion  && <Chip label={atleta.posicion} />}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen financiero — igual que EstadoCuenta */}
      <div className="fade-up" style={{ animationDelay:'.06s', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ background:`${color}0D`, border:`1px solid ${color}28`, borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>Total pagado</div>
          <div style={{ fontSize:20, fontWeight:900, color, letterSpacing:'-0.5px', lineHeight:1 }}>{fmt(total_pagado)}</div>
        </div>
        <div style={{ background: alDia ? 'rgba(0,208,132,0.07)' : 'rgba(245,158,11,0.07)', border:`1px solid ${alDia ? 'rgba(0,208,132,0.22)' : 'rgba(245,158,11,0.22)'}`, borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>Saldo pendiente</div>
          <div style={{ fontSize:20, fontWeight:900, color: alDia ? '#00D084' : '#F59E0B', letterSpacing:'-0.5px', lineHeight:1 }}>
            {alDia ? '✓ Al día' : fmt(saldo_pendiente)}
          </div>
          {!alDia && <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4 }}>{meses_pendientes} mes{meses_pendientes !== 1 ? 'es' : ''} pendiente{meses_pendientes !== 1 ? 's' : ''}</div>}
        </div>
      </div>

      {/* Mensualidades — misma vista que EstadoCuenta */}
      {mensualidades.length > 0 && (
        <div className="fade-up" style={{ animationDelay:'.12s', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>
            Mensualidades {new Date().getFullYear()}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {mensualidades.map((m, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:`1px solid ${color}14`, borderRadius:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.75)', width:52, flexShrink:0 }}>{m.mes}</span>
                  <EstadoBadge estado={m.estado} />
                </div>
                <div style={{ flexShrink:0, textAlign:'right' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{fmt(m.valor_pagado)}</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}> / {fmt(m.valor_oficial)}</span>
                </div>
              </div>
            ))}
          </div>
          {!alDia && (
            <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:10, textAlign:'center', fontSize:12, color:'rgba(245,158,11,0.8)' }}>
              Comunícate con tu club para regularizar tus pagos
            </div>
          )}
        </div>
      )}

      {/* Botón nueva consulta */}
      <div className="fade-up" style={{ animationDelay:'.18s' }}>
        <button onClick={onNuevaBusqueda} style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:12, padding:'12px', color:'rgba(255,255,255,0.45)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          ← Consultar otra cédula
        </button>
      </div>
    </div>
  );
}

const ESTADO_CFG = {
  pagado:      { bg:'rgba(0,208,132,0.12)',  border:'rgba(0,208,132,0.28)',   color:'#00D084', label:'Al día'       },
  pendiente:   { bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.28)',  color:'#F59E0B', label:'Pendiente'    },
  vencido:     { bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.28)',   color:'#EF4444', label:'Vencido'      },
  parcial:     { bg:'rgba(74,158,255,0.12)', border:'rgba(74,158,255,0.28)',  color:'#4A9EFF', label:'Parcial'      },
  por_validar: { bg:'rgba(192,120,255,0.12)',border:'rgba(192,120,255,0.28)', color:'#C678FF', label:'Por validar'  },
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CFG[estado] || { bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.3)', label: estado };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:999, padding:'3px 9px', fontSize:11, fontWeight:700, color:cfg.color, letterSpacing:0.4, textTransform:'uppercase' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.color }} />
      {cfg.label}
    </span>
  );
}


function Chip({ label }) {
  return <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:999, padding:'2px 9px' }}>{label}</span>;
}
