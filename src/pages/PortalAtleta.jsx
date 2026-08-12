import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutos

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(n) || 0);

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`;
  return digits;
}

// ── Constantes de estados ─────────────────────────────────────────────────────
const ESTADO_CFG = {
  pagado:      { bg: 'rgba(0,208,132,0.12)',   border: 'rgba(0,208,132,0.28)',   color: '#00D084', label: 'Al día'      },
  pendiente:   { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)',  color: '#F59E0B', label: 'Pendiente'   },
  vencido:     { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.28)',   color: '#EF4444', label: 'Vencido'     },
  parcial:     { bg: 'rgba(74,158,255,0.12)',  border: 'rgba(74,158,255,0.28)',  color: '#4A9EFF', label: 'Parcial'     },
  por_validar: { bg: 'rgba(192,120,255,0.12)', border: 'rgba(192,120,255,0.28)', color: '#C678FF', label: 'Por validar' },
  exento:      { bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.28)',  color: '#38bdf8', label: 'Exento'      },
  suspendido:  { bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.25)', color: '#9CA3AF', label: 'Suspendido'  },
};

// ── Sub-componentes ───────────────────────────────────────────────────────────
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

function Spinner() {
  return <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .7s linear infinite' }} />;
}

// ── Pedido de uniforme por el propio atleta ────────────────────────────────
const TALLAS_NINO   = ['4', '6', '8', '10', '12', '14', '16'];
const TALLAS_ADULTO = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
const CATEGORIAS    = ['Niño', 'Hombre', 'Mujer'];

function PedidoUniformeCard({ color, clubSlug, cedula, catalogo, onPedidoCreado }) {
  const [abierto, setAbierto]               = useState(false);
  const [categoria, setCategoria]           = useState('Hombre');
  const [talla, setTalla]                   = useState('');
  const [numero, setNumero]                 = useState('');
  const [nombreEstampar, setNombreEstampar] = useState('');
  const [cantidades, setCantidades]         = useState({}); // { nombrePrenda: cantidad }
  const [enviando, setEnviando]             = useState(false);
  const [error, setError]                   = useState('');
  const [exito, setExito]                   = useState(false);

  if (!catalogo || catalogo.length === 0) return null;

  const tallas = categoria === 'Niño' ? TALLAS_NINO : TALLAS_ADULTO;
  const seleccionadas = Object.entries(cantidades).filter(([, c]) => c > 0);
  const total = seleccionadas.reduce((s, [nombre, c]) => {
    const p = catalogo.find(x => x.nombre === nombre);
    return s + (p ? p.precio * c : 0);
  }, 0);
  const requiereNumero = seleccionadas.some(([nombre]) => catalogo.find(p => p.nombre === nombre)?.requiere_numero !== false);

  const toggle = (nombre) => setCantidades(c => ({ ...c, [nombre]: c[nombre] ? 0 : 1 }));
  const cambiarCantidad = (nombre, delta) => setCantidades(c => ({ ...c, [nombre]: Math.max(0, (c[nombre] || 0) + delta) }));

  async function enviar() {
    setError('');
    if (seleccionadas.length === 0) { setError('Elegí al menos una prenda'); return; }
    if (!talla)                     { setError('Elegí una talla'); return; }
    if (requiereNumero && !numero)  { setError('Ingresá el número para estampar'); return; }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/publico/uniforme/${clubSlug}/${cedula}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          talla,
          numero:          numero || undefined,
          nombre_estampar: nombreEstampar || undefined,
          items:            seleccionadas.map(([nombre, cantidad]) => ({ nombre, cantidad })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setError(json.error || 'No se pudo enviar el pedido'); return; }
      setExito(true);
      onPedidoCreado?.();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    return (
      <div className="fade-up" style={{ background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.3)', borderRadius: 16, padding: '16px 18px', textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#00D084', marginBottom: 4 }}>¡Pedido enviado!</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Tu club lo va a revisar. Lo vas a ver reflejado arriba, en "Uniforme".</div>
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
      <button onClick={() => setAbierto(a => !a)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>👕 Pedir uniforme</span>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{abierto ? 'Cerrar' : 'Abrir'}</span>
      </button>

      {abierto && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Categoría (define el set de tallas) */}
          <div style={{ display: 'flex', gap: 6 }}>
            {CATEGORIAS.map(cat => (
              <button key={cat} onClick={() => { setCategoria(cat); setTalla(''); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: categoria === cat ? color : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${categoria === cat ? color : 'rgba(255,255,255,0.1)'}`,
                  color: categoria === cat ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Prendas del catálogo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {catalogo.map(p => {
              const cant = cantidades[p.nombre] || 0;
              return (
                <div key={p.nombre} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
                  background: cant > 0 ? `${color}12` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${cant > 0 ? color + '40' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  <div onClick={() => toggle(p.nombre)} style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{p.nombre}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{fmt(p.precio)}</div>
                  </div>
                  {cant > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => cambiarCantidad(p.nombre, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer' }}>−</button>
                      <span style={{ fontSize: 12, fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{cant}</span>
                      <button onClick={() => cambiarCantidad(p.nombre, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer' }}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Talla */}
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Talla</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tallas.map(t => (
                <button key={t} onClick={() => setTalla(t)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: talla === t ? color : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${talla === t ? color : 'rgba(255,255,255,0.1)'}`,
                    color: talla === t ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {requiereNumero && (
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Número para estampar</div>
              <input type="number" inputMode="numeric" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Ej: 10"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13 }} />
            </div>
          )}

          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Nombre para estampar (opcional)</div>
            <input type="text" value={nombreEstampar} onChange={e => setNombreEstampar(e.target.value)} placeholder="Ej: PÉREZ"
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13 }} />
          </div>

          {total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: `${color}0D`, border: `1px solid ${color}28`, borderRadius: 10 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Total del pedido</span>
              <span style={{ fontSize: 15, fontWeight: 800, color }}>{fmt(total)}</span>
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, fontSize: 12, color: '#FCA5A5' }}>
              {error}
            </div>
          )}

          <button onClick={enviar} disabled={enviando}
            style={{
              width: '100%', border: 'none', borderRadius: 12, padding: '13px',
              background: enviando ? 'rgba(255,255,255,0.08)' : color, color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {enviando ? <Spinner /> : 'Enviar pedido'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Paso 1: Ingresar celular — el backend ya NO devuelve el estado de cuenta acá
// (ese era el segundo hueco de seguridad: cualquiera que supiera el celular de un
// jugador podía ver sus datos financieros con solo escribirlo). Ahora este paso
// solo dispara el envío del link personal por WhatsApp AL NÚMERO escrito — si de
// verdad es el dueño, lo recibe ahí. La respuesta del backend es siempre la misma
// exista o no el celular en el club, así que acá tampoco se puede distinguir un
// caso del otro (eso es intencional, evita enumeración de números registrados).
function StepPhone({ color, clubSlug }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  async function consultar() {
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) { setError('Ingresa un número de celular válido'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/publico/atleta-por-celular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ celular: normalized, club_slug: clubSlug }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setError(json.error || 'No se pudo procesar la solicitud'); return; }
      setEnviado(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const valid = phone.replace(/\D/g, '').length >= 10;

  if (enviado) {
    return (
      <div className="fade-up" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: '28px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 12 }}>📲</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
          Revisa tu WhatsApp
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6 }}>
          Si el número está registrado en el club, te llegó un mensaje de WhatsApp con tu link personal — ábrelo desde ahí para ver tu estado de cuenta.
        </p>
        <button
          onClick={() => { setEnviado(false); setPhone(''); setError(null); }}
          style={{ marginTop: 18, background: 'transparent', border: 'none', color, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 4 }}
        >
          ← Probar con otro número
        </button>
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: '24px 20px' }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 4, textAlign: 'center' }}>
        Consulta tu estado de cuenta
      </p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
        Ingresa el celular con el que estás registrado en el club y te enviamos tu link por WhatsApp
      </p>

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'rgba(255,255,255,0.35)', fontWeight: 600, userSelect: 'none' }}>+57</div>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          aria-label="Número de celular"
          placeholder="300 000 0000"
          value={phone}
          onChange={e => { setPhone(e.target.value.replace(/[^\d\s]/g, '')); setError(null); }}
          onKeyDown={e => e.key === 'Enter' && valid && !loading && consultar()}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.07)', border: `1.5px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 14, padding: '15px 18px 15px 52px',
            color: '#fff', fontSize: 18, fontWeight: 600, letterSpacing: 1.5,
            transition: 'border-color .15s',
          }}
        />
      </div>

      <button
        onClick={consultar}
        disabled={!valid || loading}
        style={{
          width: '100%', border: 'none', borderRadius: 14, padding: '15px',
          background: valid && !loading ? color : 'rgba(255,255,255,0.08)',
          color: valid && !loading ? '#fff' : 'rgba(255,255,255,0.25)',
          fontSize: 15, fontWeight: 700, cursor: valid && !loading ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: valid && !loading ? `0 4px 24px ${color}35` : 'none',
          transition: 'background .2s, box-shadow .2s, color .2s',
        }}
      >
        {loading ? <Spinner /> : 'Enviarme mi link por WhatsApp'}
      </button>

      {error && (
        <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 12, fontSize: 13, color: '#FCA5A5', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16, lineHeight: 1.5 }}>
        El número debe estar registrado en tu club
      </p>
    </div>
  );
}

// ── Directorio de afiliados/patrocinadores ──────────────────────────────────
// Se muestran acá (Portal del Atleta) y en la Landing pública — nunca en el
// bot de WhatsApp (decisión explícita, para no sentirse invasivo). Prioridad
// visual: oro > plata > bronce, máximo un afiliado por tier (rotación simple:
// si hay varios del mismo tier se elige uno al azar en cada render).
function AfiliadosCard() {
  const [destacados, setDestacados] = useState([]);

  // La elección aleatoria (rotación simple dentro de un mismo tier) es un
  // efecto secundario, no un cálculo puro de render — por eso Math.random()
  // vive acá adentro del efecto de fetch (react-hooks/purity la rechaza en
  // useMemo) y setDestacados se llama una sola vez, directo desde el fetch,
  // sin un segundo efecto derivando de otro estado (react-hooks/set-state-in-effect).
  useEffect(() => {
    fetch(`${API_BASE}/publico/afiliados`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json?.success || !Array.isArray(json.afiliados)) return;
        const porTier = { oro: [], plata: [], bronce: [] };
        json.afiliados.forEach(a => { if (porTier[a.tier]) porTier[a.tier].push(a); });
        const elegirUno = (lista) => lista.length ? lista[Math.floor(Math.random() * lista.length)] : null;
        setDestacados([elegirUno(porTier.oro), elegirUno(porTier.plata), elegirUno(porTier.bronce)].filter(Boolean));
      })
      .catch(() => { /* sección opcional: si falla, simplemente no se muestra */ });
  }, []);

  if (destacados.length === 0) return null;

  return (
    <div className="fade-up" style={{ animationDelay: '.22s' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
        Aliados de tu club
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {destacados.map(a => (
          <a
            key={a.id}
            href={a.link_web || undefined}
            target={a.link_web ? '_blank' : undefined}
            rel={a.link_web ? 'noopener noreferrer' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: a.link_web ? 'pointer' : 'default',
              padding: '10px 12px', borderRadius: 14,
              background: a.tier === 'oro' ? 'rgba(245,166,35,0.06)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${a.tier === 'oro' ? 'rgba(245,166,35,0.25)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {a.logo_url ? (
              <img src={a.logo_url} alt={a.nombre} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                {a.nombre.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.categoria || a.ciudad || 'Aliado ZenSports'}</div>
            </div>
            {a.tier === 'oro' && (
              <span style={{ fontSize: 9, fontWeight: 800, color: '#F5A623', background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 999, padding: '2px 7px', flexShrink: 0 }}>★ Destacado</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Paso 2: Resultado ─────────────────────────────────────────────────────────
const UNIFORME_ESTADO = {
  AL_DIA:    { color: '#00D084', label: 'Al día'           },
  PAGADO:    { color: '#00D084', label: 'Pagado'           },
  ENTREGADO: { color: '#00D084', label: 'Entregado'        },
  PENDIENTE: { color: '#F59E0B', label: 'Pendiente de pago'},
  MORA:      { color: '#EF4444', label: 'En mora'          },
  ABONO:     { color: '#4A9EFF', label: 'Abono'            },
};

function Resultado({ datos, color, clubSlug, onNuevaBusqueda, onRefrescar }) {
  const { atleta, mensualidades, torneos = [], uniformes = [], catalogo_uniformes = [], saldo_pendiente, total_pagado, meses_pendientes, esExento } = datos;
  const [imgError, setImgError] = useState(false);
  const nombreCompleto = `${atleta.nombre} ${atleta.apellidos || ''}`.trim();
  const alDia = saldo_pendiente === 0;

  const fotoUrl = atleta?.foto_url
    || (atleta?.cedula ? supabase.storage.from('player-photos').getPublicUrl(`city-fc/${atleta.cedula}.jpg`).data?.publicUrl : null)
    || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Tarjeta atleta */}
      <div className="fade-up" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}28`, borderRadius: 18, overflow: 'hidden', boxShadow: `0 0 40px ${color}0E` }}>
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
              {esExento && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>✦ EXENTO</span>}
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
          background: esExento ? 'rgba(56,189,248,0.07)' : alDia ? 'rgba(0,208,132,0.07)' : 'rgba(245,158,11,0.07)',
          border: `1px solid ${esExento ? 'rgba(56,189,248,0.22)' : alDia ? 'rgba(0,208,132,0.22)' : 'rgba(245,158,11,0.22)'}`,
          borderRadius: 14, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Saldo pendiente</div>
          <div style={{ fontSize: 19, fontWeight: 900, color: esExento ? '#38bdf8' : alDia ? '#00D084' : '#F59E0B', letterSpacing: '-0.5px', lineHeight: 1 }}>
            {esExento ? '✦ Exento' : alDia ? '✓ Al día' : fmt(saldo_pendiente)}
          </div>
          {!alDia && !esExento && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{meses_pendientes} mes{meses_pendientes !== 1 ? 'es' : ''} por regularizar</div>}
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
              <div key={i} className="row-mensualidad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', minWidth: 88, flexShrink: 0 }}>{m.mes}</span>
                  <EstadoBadge estado={m.estado} />
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{fmt(m.valor_pagado)}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}> / {fmt(m.valor_inscrito ?? m.valor_oficial)}</span>
                </div>
              </div>
            ))}
          </div>
          {!alDia && !esExento && (
            <div style={{ margin: '8px 16px 14px', padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 10, textAlign: 'center', fontSize: 12, color: 'rgba(245,158,11,0.8)' }}>
              Comunícate con tu club para regularizar tus pagos
            </div>
          )}
        </div>
      )}

      {/* Torneos */}
      {torneos.length > 0 && (
        <div className="fade-up" style={{ animationDelay: '.16s', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 10px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Torneos inscritos
          </div>
          <div>
            {torneos.map((t, i) => {
              const pagado  = t.valor_pagado || 0;
              const total   = t.valor_inscrito || 0;
              const saldo   = t.saldo_pendiente || 0;
              const alDiaT  = t.estado === 'AL_DIA';
              const estadoColor = alDiaT ? '#00D084' : t.estado === 'ABONO' ? '#F59E0B' : '#EF4444';
              const estadoLabel = alDiaT ? 'Al día' : t.estado === 'ABONO' ? 'Abono' : 'Pendiente';
              return (
                <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 3 }}>{t.nombre_torneo}</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${estadoColor}18`, border: `1px solid ${estadoColor}40`, borderRadius: 999, padding: '1px 8px', fontSize: 10, fontWeight: 700, color: estadoColor }}>
                      {estadoLabel}
                    </span>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{fmt(pagado)}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>/ {fmt(total)}</div>
                    {saldo > 0 && <div style={{ fontSize: 10, color: '#F59E0B', marginTop: 2 }}>Saldo: {fmt(saldo)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Uniformes */}
      {uniformes.length > 0 && (
        <div className="fade-up" style={{ animationDelay: '.18s', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Uniforme</span>
          </div>
          <div>
            {uniformes.map((u, i) => {
              const cfg = UNIFORME_ESTADO[u.estado] || { color: '#9CA3AF', label: u.estado || 'Pendiente' };
              const prendas = u.descripcion ? u.descripcion.split(',').map(p => p.trim()).filter(Boolean) : [];
              const prendasDetalle = u.prendas_detalle || [];
              return (
                <div key={u.id || i} style={{ padding: '10px 16px 14px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {u.tipo && u.tipo !== 'Jugador' && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#C678FF', background: 'rgba(198,120,255,0.14)', border: '1px solid rgba(198,120,255,0.3)', borderRadius: 999, padding: '3px 9px' }}>{u.tipo}</span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, borderRadius: 999, padding: '3px 9px', fontSize: 10, fontWeight: 700, color: cfg.color }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.color }} />
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>{fmt(u.valor_oficial)}</div>
                      {u.saldo_pendiente > 0 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Saldo: {fmt(u.saldo_pendiente)}</div>}
                    </div>
                  </div>
                  {prendasDetalle.length > 0 ? (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Prendas</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {prendasDetalle.map(pr => (
                          <div key={pr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 9px' }}>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>{pr.nombre}{pr.cantidad > 1 ? ` x${pr.cantidad}` : ''}</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                              {fmt(pr.valor_pagado)} / {fmt(pr.valor)}
                              {pr.saldo > 0 && <span style={{ color: '#F59E0B', marginLeft: 6 }}>· Saldo {fmt(pr.saldo)}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : prendas.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Prendas</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {prendas.map((p, pi) => (
                          <span key={pi} style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 6, padding: '2px 8px' }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 16 }}>
                    {u.talla && (
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>Talla</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{u.talla}</div>
                      </div>
                    )}
                    {u.numero && (
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>Número</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>#{String(u.numero).padStart(3, '0')}</div>
                      </div>
                    )}
                    {u.nombre_estampar && (
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>Estampa</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 }}>{u.nombre_estampar.toUpperCase()}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pedir uniforme (self-service) */}
      <div className="fade-up" style={{ animationDelay: '.20s' }}>
        <PedidoUniformeCard
          color={color}
          clubSlug={clubSlug}
          cedula={atleta.cedula}
          catalogo={catalogo_uniformes}
          onPedidoCreado={onRefrescar}
        />
      </div>

      {/* Aliados/patrocinadores del club */}
      <AfiliadosCard />

      {/* Botón cerrar sesión */}
      <div className="fade-up" style={{ animationDelay: '.24s', paddingBottom: 8 }}>
        <button onClick={onNuevaBusqueda} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '13px', color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          ← Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PortalAtleta() {
  const { clubSlug, token } = useParams();

  const SESSION_KEY = `portal_session_${clubSlug}`;

  const [club, setClub]               = useState(null);
  const [clubCargando, setClubCargando] = useState(true);

  // step: 'cargando' (link directo con token, sin pedir nada) | 'phone' | 'result'
  const [step, setStep]   = useState(token ? 'cargando' : 'phone');
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    document.title = 'Estado de Cuenta · ZenSports';

    // Link directo con token (el que manda Estado de cuenta) — entra sin pedir nada.
    // El token es un HMAC opaco, no la cédula — un link viejo con cédula en texto
    // plano ya no matchea nada y cae al mismo "roto/vencido" de abajo.
    if (token) {
      fetch(`${API_BASE}/publico/atleta/${clubSlug}/${token}`)
        .then(r => r.json())
        .then(json => {
          if (json?.success) {
            handleEncontrado(json);
          } else {
            // Link roto/vencido — que la persona entre con su celular en vez de trabarse acá.
            setStep('phone');
          }
        })
        .catch(() => setStep('phone'));
    } else {
      // Restaurar sesión guardada si sigue vigente (< 10 min),
      // luego refrescar datos en background para mostrar cambios recientes
      try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
          const { ts, data: savedData } = JSON.parse(saved);
          if (Date.now() - ts < SESSION_TTL_MS) {
            setDatos(savedData);
            setStep('result');
            if (savedData?.club) setClub(savedData.club);
            // Refresco silencioso: actualiza datos sin pedir el celular de nuevo
            const tokenGuardado = savedData?.portal_token;
            if (tokenGuardado) {
              fetch(`${API_BASE}/publico/atleta/${clubSlug}/${tokenGuardado}`)
                .then(r => r.ok ? r.json() : null)
                .then(json => {
                  if (json?.success) {
                    setDatos(json);
                    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now(), data: json })); } catch { /* ignora */ }
                  }
                })
                .catch(() => { /* mantiene datos cacheados si falla */ });
            }
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch { /* ignora sesión corrupta */ }
    }

    async function cargarClub() {
      try {
        const { data } = await supabase.from('clubs_publico').select('config').eq('slug', clubSlug).single();
        if (data?.config) setClub(data.config);
      } catch { /* usa defaults */ }
      finally { setClubCargando(false); }
    }
    cargarClub();
  }, [clubSlug]); // eslint-disable-line

  function handleEncontrado(json) {
    if (!club && json.club) setClub(json.club);
    setDatos(json);
    setStep('result');
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now(), data: json })); } catch { /* ignora */ }
  }

  function handleReset() {
    setStep('phone');
    setDatos(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignora */ }
  }

  // Refresca los datos del portal sin pedirle el celular de nuevo — se usa
  // después de que el atleta crea un pedido de uniforme, para que aparezca
  // reflejado de inmediato en la sección "Uniforme".
  async function refrescarDatos() {
    const tokenActual = datos?.portal_token;
    if (!tokenActual) return;
    try {
      const res  = await fetch(`${API_BASE}/publico/atleta/${clubSlug}/${tokenActual}`);
      const json = await res.json();
      if (json?.success) {
        setDatos(json);
        try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now(), data: json })); } catch { /* ignora */ }
      }
    } catch { /* mantiene datos actuales si falla */ }
  }

  const color      = club?.color || '#00AAFF';
  const clubNombre = club?.nombre || clubSlug || 'Club';
  const initials   = clubNombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'FC';

  // Indicador de paso
  const steps = [
    { label: 'Celular', icon: '📱' },
    { label: 'Cuenta',  icon: '📋' },
  ];
  const stepIdx = step === 'phone' ? 0 : 1;

  return (
    <div style={{ minHeight: '100dvh', background: '#080C14', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fade-up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fade-up .35s ease both; }
        .btn-primary { transition: opacity .15s, transform .1s; }
        .btn-primary:active { transform: scale(.97); opacity:.88; }
        .row-mensualidad:nth-child(even) { background: rgba(255,255,255,0.025) !important; }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Glow */}
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 420, height: 420, borderRadius: '50%', background: `${color}0A`, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 480, margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1, boxSizing: 'border-box' }}>

        {/* Header club */}
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: step === 'result' ? 24 : 48, paddingBottom: step === 'result' ? 16 : 24, transition: 'padding .3s ease' }}>
          {clubCargando
            ? <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
            : club?.logo_url
              ? <img src={club.logo_url} alt="logo" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 16, border: `1px solid ${color}30`, boxShadow: `0 0 24px ${color}20` }} />
              : <div style={{ width: 64, height: 64, borderRadius: 16, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color }}>{initials}</div>
          }
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.2px' }}>{clubNombre}</div>
            {club?.subtitulo && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 3 }}>{club.subtitulo}</div>}
          </div>

          {/* Stepper */}
          {step === 'phone' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 4 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    opacity: i > stepIdx ? 0.3 : 1, transition: 'opacity .3s',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: i < stepIdx ? color : i === stepIdx ? `${color}22` : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${i <= stepIdx ? color : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: i < stepIdx ? 12 : 13,
                      transition: 'all .3s',
                    }}>
                      {i < stepIdx ? '✓' : s.icon}
                    </div>
                    <span style={{ fontSize: 9, color: i === stepIdx ? color : 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 32, height: 1, background: i < stepIdx ? color : 'rgba(255,255,255,0.08)', margin: '0 4px', marginBottom: 14, transition: 'background .3s' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contenido por paso */}
        {step === 'cargando' && (
          <div className="fade-up" style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spinner />
          </div>
        )}
        {step === 'phone' && (
          <StepPhone color={color} clubSlug={clubSlug} />
        )}
        {step === 'result' && datos && (
          <Resultado datos={datos} color={color} clubSlug={clubSlug} onNuevaBusqueda={handleReset} onRefrescar={refrescarDatos} />
        )}

        <div style={{ flex: 1, minHeight: 40 }} />
      </main>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '20px 20px env(safe-area-inset-bottom, 20px)', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6C3EFF 0%, #9B5DFF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(108,62,255,0.35)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ZENSPORTS</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0, letterSpacing: 0.5, textAlign: 'center' }}>Gestión deportiva inteligente · AI Powered</p>
          <a href="https://zensports.zenpra.ai" target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', textDecoration: 'none', letterSpacing: 0.3, marginTop: 2 }}>zensports.zenpra.ai</a>
        </div>
      </footer>
    </div>
  );
}
