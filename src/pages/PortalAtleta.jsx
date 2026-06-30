import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

// ── Paso 1: Ingresar celular ──────────────────────────────────────────────────
function StepPhone({ color, clubSlug, onSent }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  async function solicitar() {
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) { setError('Ingresa un número de celular válido'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/publico/otp/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized, club_slug: clubSlug }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setError(json.error || 'No se pudo enviar el código'); return; }
      onSent(normalized);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const valid = phone.replace(/\D/g, '').length >= 10;

  return (
    <div className="fade-up" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: '24px 20px' }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 4, textAlign: 'center' }}>
        Consulta tu estado de cuenta
      </p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
        Ingresa tu celular y te enviamos un código de verificación por WhatsApp
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
          onKeyDown={e => e.key === 'Enter' && valid && !loading && solicitar()}
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
        onClick={solicitar}
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
        {loading ? <Spinner /> : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 0C5.372 0 0 5.373 0 12.001c0 2.117.554 4.1 1.523 5.827L0 24l6.335-1.652C8.01 23.085 9.974 23.6 12 23.6 18.628 23.6 24 18.227 24 11.599 24 4.972 18.628-.001 12-.001z"/></svg>
            Enviar código por WhatsApp
          </>
        )}
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

// ── Paso 2: Ingresar código OTP ───────────────────────────────────────────────
function StepOTP({ color, phone, clubSlug, onVerified, onBack }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
    const t = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  async function verificar() {
    if (code.length !== 4) { setError('El código tiene 4 dígitos'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/publico/otp/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, club_slug: clubSlug, code }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setError(json.error || 'Código incorrecto'); return; }
      onVerified(json);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function reenviar() {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setError(null);
    setCode('');
    try {
      await fetch(`${API_BASE}/publico/otp/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, club_slug: clubSlug }),
      });
    } catch { /* silent */ }
  }

  const phoneDisplay = `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;

  return (
    <div className="fade-up" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: '24px 20px' }}>
      {/* Icono WhatsApp */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 0C5.372 0 0 5.373 0 12.001c0 2.117.554 4.1 1.523 5.827L0 24l6.335-1.652C8.01 23.085 9.974 23.6 12 23.6 18.628 23.6 24 18.227 24 11.599 24 4.972 18.628-.001 12-.001z"/></svg>
        </div>
      </div>

      <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6, textAlign: 'center' }}>
        Revisa tu WhatsApp
      </p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
        Enviamos un código de 4 dígitos a<br />
        <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{phoneDisplay}</span>
      </p>

      {/* Input código */}
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        aria-label="Código de verificación de 4 dígitos"
        pattern="[0-9]*"
        maxLength={4}
        placeholder="_ _ _ _"
        value={code}
        onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(null); }}
        onKeyDown={e => e.key === 'Enter' && code.length === 4 && !loading && verificar()}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.07)',
          border: `1.5px solid ${error ? 'rgba(239,68,68,0.5)' : code.length === 4 ? `${color}60` : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 14, padding: '18px',
          color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: 12,
          textAlign: 'center', marginBottom: 10,
          transition: 'border-color .15s',
        }}
      />

      <button
        onClick={verificar}
        disabled={code.length !== 4 || loading}
        style={{
          width: '100%', border: 'none', borderRadius: 14, padding: '15px',
          background: code.length === 4 && !loading ? color : 'rgba(255,255,255,0.08)',
          color: code.length === 4 && !loading ? '#fff' : 'rgba(255,255,255,0.25)',
          fontSize: 15, fontWeight: 700, cursor: code.length === 4 && !loading ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: code.length === 4 && !loading ? `0 4px 24px ${color}35` : 'none',
          transition: 'background .2s, box-shadow .2s, color .2s',
          marginBottom: 10,
        }}
      >
        {loading ? <Spinner /> : 'Verificar código'}
      </button>

      {error && (
        <div style={{ marginTop: 4, marginBottom: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 12, fontSize: 13, color: '#FCA5A5', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>
          ← Cambiar número
        </button>
        <button
          onClick={reenviar}
          disabled={resendCooldown > 0}
          style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? 'rgba(255,255,255,0.2)' : color, fontSize: 13, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', padding: '4px 0', fontWeight: 600 }}
        >
          {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar código'}
        </button>
      </div>
    </div>
  );
}

// ── Paso 3: Resultado ─────────────────────────────────────────────────────────
const UNIFORME_ESTADO = {
  AL_DIA:    { color: '#00D084', label: 'Al día'           },
  PAGADO:    { color: '#00D084', label: 'Pagado'           },
  ENTREGADO: { color: '#00D084', label: 'Entregado'        },
  PENDIENTE: { color: '#F59E0B', label: 'Pendiente de pago'},
  MORA:      { color: '#EF4444', label: 'En mora'          },
  ABONO:     { color: '#4A9EFF', label: 'Abono'            },
};

function Resultado({ datos, color, onNuevaBusqueda }) {
  const { atleta, mensualidades, torneos = [], uniformes = [], saldo_pendiente, total_pagado, meses_pendientes, esExento } = datos;
  const [fotoUrl, setFotoUrl] = useState(atleta?.foto_url || null);
  const [imgError, setImgError] = useState(false);
  const nombreCompleto = `${atleta.nombre} ${atleta.apellidos || ''}`.trim();
  const alDia = saldo_pendiente === 0;

  useEffect(() => {
    if (!fotoUrl && atleta?.cedula) {
      const { data } = supabase.storage.from('player-photos').getPublicUrl(`city-fc/${atleta.cedula}.jpg`);
      if (data?.publicUrl) setFotoUrl(data.publicUrl);
    }
  }, [atleta?.cedula]); // eslint-disable-line

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
              return (
                <div key={u.id || i} style={{ padding: '10px 16px 14px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, borderRadius: 999, padding: '3px 9px', fontSize: 10, fontWeight: 700, color: cfg.color }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.color }} />
                      {cfg.label}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>{fmt(u.valor_oficial)}</div>
                      {u.saldo_pendiente > 0 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Saldo: {fmt(u.saldo_pendiente)}</div>}
                    </div>
                  </div>
                  {prendas.length > 0 && (
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

      {/* Botón cerrar sesión */}
      <div className="fade-up" style={{ animationDelay: '.22s', paddingBottom: 8 }}>
        <button onClick={onNuevaBusqueda} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '13px', color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          ← Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PortalAtleta() {
  const { clubSlug } = useParams();
  const navigate     = useNavigate();

  const SESSION_KEY = `portal_session_${clubSlug}`;

  const [club, setClub]               = useState(null);
  const [clubCargando, setClubCargando] = useState(true);

  // step: 'phone' | 'otp' | 'result'
  const [step, setStep]   = useState('phone');
  const [phone, setPhone] = useState('');
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    document.title = 'Estado de Cuenta · ZenSports';
    // Restaurar sesión guardada si sigue vigente (< 10 min)
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const { ts, data: savedData } = JSON.parse(saved);
        if (Date.now() - ts < SESSION_TTL_MS) {
          setDatos(savedData);
          setStep('result');
          if (savedData?.club) setClub(savedData.club);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch { /* ignora sesión corrupta */ }

    async function cargarClub() {
      try {
        const { data } = await supabase.from('clubs').select('config').eq('slug', clubSlug).single();
        if (data?.config) setClub(data.config);
      } catch { /* usa defaults */ }
      finally { setClubCargando(false); }
    }
    cargarClub();
  }, [clubSlug]); // eslint-disable-line

  function handleSent(normalizedPhone) {
    setPhone(normalizedPhone);
    setStep('otp');
  }

  function handleVerified(json) {
    if (!club && json.club) setClub(json.club);
    setDatos(json);
    setStep('result');
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now(), data: json })); } catch { /* ignora */ }
  }

  function handleReset() {
    setStep('phone');
    setPhone('');
    setDatos(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignora */ }
  }

  const color      = club?.color || '#00AAFF';
  const clubNombre = club?.nombre || clubSlug || 'Club';
  const initials   = clubNombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'FC';

  // Indicador de paso
  const steps = [
    { label: 'Celular', icon: '📱' },
    { label: 'Código',  icon: '🔐' },
    { label: 'Cuenta',  icon: '📋' },
  ];
  const stepIdx = step === 'phone' ? 0 : step === 'otp' ? 1 : 2;

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
          {step !== 'result' && (
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
        {step === 'phone' && (
          <StepPhone color={color} clubSlug={clubSlug} onSent={handleSent} />
        )}
        {step === 'otp' && (
          <StepOTP color={color} phone={phone} clubSlug={clubSlug} onVerified={handleVerified} onBack={() => setStep('phone')} />
        )}
        {step === 'result' && datos && (
          <Resultado datos={datos} color={color} onNuevaBusqueda={handleReset} />
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
