import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import QRCodeLib from 'qrcode';
import { createPortal } from 'react-dom';
import {
  X, User, DollarSign, CreditCard, Camera, Save,
  Loader2, Printer, CheckCircle, ClipboardList, ZoomIn,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/authFetch';
import { API_BASE_URL } from '../config';
import { getClubId } from '../services/api';
import FinancieroContent from './FinancieroContent';

const POSICIONES = [
  'Portero', 'Defensa Central', 'Lateral Derecho', 'Lateral Izquierdo',
  'Mediocampista Defensivo', 'Mediocampista', 'Mediocampista Ofensivo',
  'Extremo Derecho', 'Extremo Izquierdo', 'Delantero', 'Atacante',
];

/* ── utilitarios ── */

function Seccion({ titulo, children }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-sub)] p-4">
      <p className="text-xs text-[var(--text-mut)] uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-3 h-0.5 bg-[#E14924] inline-block rounded" />
        {titulo}
      </p>
      {children}
    </div>
  );
}

function EscudoSVG({ size = 32, color = '#E14924', initials = 'FC' }) {
  const h = Math.round(size * 44 / 38);
  return (
    <svg width={size} height={h} viewBox="0 0 38 44" fill="none">
      <path d="M19 2L3 8.5V22C3 32.8 10 40.5 19 43C28 40.5 35 32.8 35 22V8.5L19 2Z"
            fill="#1A0A04" stroke={color} strokeWidth="1.4" />
      <path d="M19 5L6 10.8V22C6 31.4 11.5 38.2 19 40.5C26.5 38.2 32 31.4 32 22V10.8L19 5Z"
            fill={`${color}12`} stroke={`${color}30`} strokeWidth="0.8" />
      <line x1="6" y1="21" x2="32" y2="21" stroke={color} strokeWidth="0.7" opacity="0.4" />
      <text x="19" y="19" textAnchor="middle" fill={color}
            fontFamily="Bebas Neue, sans-serif" fontSize={initials.length > 2 ? '8' : '9.5'} letterSpacing="1.5">
        {initials.slice(0, 3)}
      </text>
      <line x1="13" y1="24" x2="25" y2="24" stroke="#B68631" strokeWidth="0.8" opacity="0.6" />
      <text x="19" y="35" textAnchor="middle" fill="#B68631" fontFamily="Arial" fontSize="6.5" letterSpacing="1">★ ★ ★</text>
    </svg>
  );
}

/* ── Tab Perfil ── */

const INPUT_CLS = "w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-sub)] text-sm text-[var(--text-pri)] focus:outline-none focus:border-[#E14924]/50 placeholder-[var(--text-mut)]";

function CampoEdit({ label, value, onChange, type = 'text', placeholder = '', ...rest }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={INPUT_CLS}
        {...rest}
      />
    </div>
  );
}

function TabPerfil({ jugador, onFotoUpdate, onUpdate, categoriasJugadores = [] }) {
  const fileRef    = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [fotoUrl,   setFotoUrl]   = useState(jugador.foto_url || null);
  const [lightbox,  setLightbox]  = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado,  setGuardado]  = useState(false);
  const [error,     setError]     = useState('');

  const [form, setForm] = useState({
    posicion:            jugador.posicion            || '',
    numero_camiseta:     jugador.numero_camiseta     || '',
    tipo_id:             jugador.tipo_id             || '',
    nombre:              jugador.nombre              || '',
    apellidos:           jugador.apellidos           || '',
    celular:             jugador.celular             || '',
    correo_electronico:  jugador.correo_electronico  || '',
    instagram:           jugador.instagram           || '',
    lugar_de_nacimiento: jugador.lugar_de_nacimiento || '',
    fecha_nacimiento:    jugador.fecha_nacimiento    || '',
    tipo_sangre:         jugador.tipo_sangre         || '',
    eps:                 jugador.eps                 || '',
    estatura:            jugador.estatura            || '',
    peso:                jugador.peso                || '',
    municipio:           jugador.municipio           || '',
    barrio:              jugador.barrio              || '',
    direccion:           jugador.direccion           || '',
    familiar_emergencia: jugador.familiar_emergencia || '',
    celular_contacto:    jugador.celular_contacto    || '',
    notas:               jugador.notas               || '',
    categoria:           jugador.categoria           || '',
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const subirFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return; }
    if (file.size > 3 * 1024 * 1024)    { setError('Máximo 3 MB por foto');       return; }

    setUploading(true);
    setError('');
    try {
      const clubId = getClubId();
      const path   = `${clubId}/${jugador.cedula}.jpg`;

      const { error: upErr } = await supabase.storage
        .from('player-photos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('player-photos').getPublicUrl(path);

      const res  = await authFetch(
        `${API_BASE_URL}/players/${jugador.cedula}?club_id=${clubId}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto_url: publicUrl }) },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error guardando foto');

      setFotoUrl(`${publicUrl}?t=${Date.now()}`);
      onFotoUpdate?.(publicUrl);
    } catch (err) {
      setError(err.message || 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      const payload = {
        ...form,
        numero_camiseta: form.numero_camiseta ? parseInt(form.numero_camiseta)  : null,
        estatura:        form.estatura        ? parseFloat(form.estatura)        : null,
        peso:            form.peso            ? parseFloat(form.peso)            : null,
        fecha_nacimiento: form.fecha_nacimiento || null,
      };
      const res  = await authFetch(
        `${API_BASE_URL}/players/${jugador.cedula}?club_id=${getClubId()}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload) },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al guardar');
      onUpdate?.(payload);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const nombreDisplay = `${form.nombre} ${form.apellidos}`.trim();

  return (
    <div className="space-y-5">
      {/* Avatar + nombre */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          {/* Foto — clic abre lightbox */}
          <div
            onClick={() => fotoUrl && setLightbox(true)}
            className={`w-20 h-20 rounded-full bg-[var(--bg-surface)] border-2 border-[#E14924]/30 overflow-hidden flex items-center justify-center transition ${fotoUrl ? 'cursor-zoom-in hover:border-[#E14924]/70' : 'cursor-default'}`}
          >
            {fotoUrl
              ? <img src={fotoUrl} alt={nombreDisplay} className="w-full h-full object-cover" />
              : <User className="w-8 h-8 text-[var(--text-mut)]" />}
          </div>
          {/* Botón cambiar foto */}
          <button
            onClick={() => !uploading && fileRef.current?.click()}
            title="Cambiar foto"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#E14924] flex items-center justify-center shadow-lg hover:bg-[#C9381A] transition"
          >
            {uploading
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Camera  className="w-3.5 h-3.5 text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={subirFoto} />
        </div>
        <div>
          <p className="text-base font-bold text-[var(--text-pri)]">{nombreDisplay || '—'}</p>
          <p className="text-sm text-[var(--text-mut)]">CC {jugador.cedula}</p>
          {fotoUrl && <p className="text-xs text-[var(--text-mut)] mt-0.5 flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Clic en la foto para ver</p>}
        </div>

        {/* Lightbox — portal para escapar del transform del drawer */}
        {lightbox && fotoUrl && createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={() => setLightbox(false)}
          >
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <img
              src={fotoUrl}
              alt={nombreDisplay}
              className="max-h-[88vh] max-w-[88vw] rounded-2xl shadow-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-[#EF4444]">{error}</div>
      )}

      {/* Datos deportivos */}
      <Seccion titulo="Datos Deportivos">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">Posición</label>
            <select
              value={form.posicion}
              onChange={set('posicion')}
              className={INPUT_CLS}
            >
              <option value="">— Sin asignar —</option>
              {POSICIONES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <CampoEdit
            label="Número de camiseta"
            type="number" min="1" max="99"
            value={form.numero_camiseta}
            onChange={set('numero_camiseta')}
            placeholder="Ej: 10"
          />
          {categoriasJugadores.length > 0 && (
            <div className="space-y-1 col-span-2">
              <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">Categoría del jugador</label>
              <select value={form.categoria} onChange={set('categoria')} className={INPUT_CLS}>
                <option value="">— Sin categoría —</option>
                {categoriasJugadores.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Seccion>

      {/* Datos personales */}
      <Seccion titulo="Datos Personales">
        <div className="grid grid-cols-2 gap-3">
          <CampoEdit label="Tipo de documento" value={form.tipo_id}   onChange={set('tipo_id')}   placeholder="CC, TI, CE…" />
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">Cédula / ID</label>
            <p className="text-sm text-[var(--text-pri)] font-medium px-3 py-2">{jugador.cedula}</p>
          </div>
          <CampoEdit label="Nombre(s)"   value={form.nombre}    onChange={set('nombre')}    placeholder="Nombre(s)" />
          <CampoEdit label="Apellido(s)" value={form.apellidos} onChange={set('apellidos')} placeholder="Apellido(s)" />
        </div>
      </Seccion>

      {/* Contacto */}
      <Seccion titulo="Contacto">
        <div className="grid grid-cols-2 gap-3">
          <CampoEdit label="Celular"            value={form.celular}            onChange={set('celular')}            placeholder="Ej: 3001234567" />
          <CampoEdit label="Correo electrónico" value={form.correo_electronico} onChange={set('correo_electronico')} placeholder="correo@email.com" type="email" />
          <CampoEdit label="Instagram"          value={form.instagram}          onChange={set('instagram')}          placeholder="@usuario" />
        </div>
      </Seccion>

      {/* Datos médicos */}
      <Seccion titulo="Datos Médicos">
        <div className="grid grid-cols-2 gap-3">
          <CampoEdit label="Lugar de nacimiento" value={form.lugar_de_nacimiento} onChange={set('lugar_de_nacimiento')} placeholder="Ciudad" />
          <CampoEdit label="Fecha de nacimiento" value={form.fecha_nacimiento}    onChange={set('fecha_nacimiento')}    type="date" />
          <CampoEdit label="Tipo de sangre"      value={form.tipo_sangre}         onChange={set('tipo_sangre')}         placeholder="O+, A-, B+…" />
          <CampoEdit label="EPS"                 value={form.eps}                 onChange={set('eps')}                 placeholder="Nombre EPS" />
          <CampoEdit label="Estatura (m)"        value={form.estatura}            onChange={set('estatura')}            type="number" step="0.01" min="1" max="2.5" placeholder="1.75" />
          <CampoEdit label="Peso (kg)"           value={form.peso}               onChange={set('peso')}               type="number" step="0.1"  min="20" max="200" placeholder="70" />
        </div>
      </Seccion>

      {/* Residencia */}
      <Seccion titulo="Residencia">
        <div className="grid grid-cols-2 gap-3">
          <CampoEdit label="Municipio / Ciudad" value={form.municipio} onChange={set('municipio')} placeholder="Tu ciudad" />
          <CampoEdit label="Barrio"    value={form.barrio}    onChange={set('barrio')}    placeholder="Barrio" />
          <div className="col-span-2">
            <CampoEdit label="Dirección" value={form.direccion} onChange={set('direccion')} placeholder="Calle, carrera, número…" />
          </div>
        </div>
      </Seccion>

      {/* Contacto de emergencia */}
      <Seccion titulo="Contacto de Emergencia">
        <div className="grid grid-cols-2 gap-3">
          <CampoEdit label="Familiar / Contacto"  value={form.familiar_emergencia} onChange={set('familiar_emergencia')} placeholder="Nombre completo" />
          <CampoEdit label="Celular de contacto"  value={form.celular_contacto}    onChange={set('celular_contacto')}    placeholder="3001234567" />
        </div>
      </Seccion>

      {/* Observaciones / Notas médicas */}
      <div className="rounded-xl border border-[var(--border-sub)] p-4" style={{ background: 'var(--bg-surface)' }}>
        <p className="text-xs text-[var(--text-mut)] uppercase tracking-wider mb-3 flex items-center gap-2">
          <ClipboardList className="w-3 h-3 text-[#E14924]" />
          Observaciones y notas
        </p>
        <p className="text-xs text-[var(--text-mut)] mb-2 leading-relaxed">
          Lesiones, condiciones médicas, alergias, restricciones de juego u otros datos relevantes del jugador.
        </p>
        <textarea
          value={form.notas}
          onChange={set('notas')}
          placeholder="Ej: Esguince tobillo derecho — feb 2026. Alérgico a la penicilina. No puede jugar de portero por lesión de hombro…"
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none"
          style={{
            background: 'var(--bg-input, var(--bg-card))',
            border: '1.5px solid var(--border-sub)',
            color: 'var(--text-pri)',
            fontFamily: 'inherit',
            lineHeight: 1.6,
            transition: 'border-color .2s',
          }}
          onFocus={e => e.target.style.borderColor = '#E14924'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-sub)'}
        />
      </div>

      {/* Botón global guardar */}
      <button
        onClick={guardar}
        disabled={guardando || guardado}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
          guardado
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-[#E14924] hover:bg-[#C9381A] text-white disabled:opacity-60'
        }`}
      >
        {guardando ? <Loader2 className="w-4 h-4 animate-spin" />
          : guardado ? <CheckCircle className="w-4 h-4" />
          : <Save className="w-4 h-4" />}
        {guardado ? 'Guardado' : guardando ? 'Guardando...' : 'Guardar todos los cambios'}
      </button>
    </div>
  );
}

/* ── Sello Holográfico ── */
function SelloHolograma({ color, initials, logoUrl, dark }) {
  const id = `holo-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" style={{ filter: `drop-shadow(0 0 4px ${color}80)`, flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FF6B6B" />
          <stop offset="25%"  stopColor="#FFE66D" />
          <stop offset="50%"  stopColor="#4ECDC4" />
          <stop offset="75%"  stopColor="#A8E6CF" />
          <stop offset="100%" stopColor="#C678FF" />
        </linearGradient>
      </defs>
      {/* Anillo externo punteado */}
      <circle cx="17" cy="17" r="15.5" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" strokeDasharray="2,1.8" />
      {/* Anillo shimmer */}
      <circle cx="17" cy="17" r="13" fill="none" stroke={`url(#${id})`} strokeWidth="1.8" opacity="0.5" />
      {/* Fondo interior */}
      <circle cx="17" cy="17" r="11.5" fill={dark ? '#0E0E0E' : '#FAFAFA'} stroke={color} strokeWidth="1.1" />
      {/* Logo o iniciales */}
      {logoUrl
        ? <image href={logoUrl} x="10" y="10" width="14" height="14" />
        : <text x="17" y="21" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={color}
                fontFamily="'Bebas Neue', cursive" letterSpacing="0.5">{initials.slice(0, 2)}</text>
      }
      {/* 8 puntos decorativos en el anillo exterior */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        return <circle key={i} cx={17 + 14 * Math.cos(rad)} cy={17 + 14 * Math.sin(rad)}
                       r={i % 2 === 0 ? 1 : 0.6} fill={color} opacity={i % 2 === 0 ? 0.9 : 0.5} />;
      })}
    </svg>
  );
}

/* ── Tab Carnet ── */

function TabCarnet({ jugador, clubConfig = {} }) {
  const [plantilla, setPlantilla] = useState('oscuro');
  const [lado, setLado] = useState('frente');

  const nombre    = (jugador['nombre(s)']  || jugador.nombre    || '').trim();
  const apellidos = (jugador['apellido(s)'] || jugador.apellidos || '').trim();
  const clubColor  = clubConfig?.color      || '#E14924';
  const clubNombre = clubConfig?.nombre     || 'Mi Club';
  const clubSub    = clubConfig?.subtitulo  || '';
  const logoUrl    = clubConfig?.logo_url   || null;
  const redes      = clubConfig?.redes_sociales || {};
  const initials   = clubNombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'FC';

  const dark = plantilla === 'oscuro';
  const th = dark
    ? { bgCard: 'linear-gradient(155deg,#111111 0%,#0E0E16 100%)', textPri: '#F0F0F0', textSec: '#AAAAAA', textMut: '#666666',
        border: `${clubColor}40`, borderImg: `${clubColor}55`, divider: '#1E1E28', photoBg: '#1A1A26' }
    : { bgCard: 'linear-gradient(155deg,#FFFFFF 0%,#F5F5F5 100%)', textPri: '#111111', textSec: '#444444', textMut: '#888888',
        border: `${clubColor}50`, borderImg: `${clubColor}60`, divider: '#EBEBEB', photoBg: '#E0E0E0' };

  const verifyBase = typeof window !== 'undefined' ? window.location.origin : 'https://zensports.vercel.app';
  const verifyParams = new URLSearchParams({
    n:    `${nombre} ${apellidos}`.trim(),
    pos:  jugador.posicion        || '',
    num:  jugador.numero_camiseta || jugador.numero || '',
    cat:  jugador.categoria || '',
    color: clubColor,
    club:  clubNombre,
    logo:  logoUrl || '',
  });
  const verifyUrl = jugador.cedula
    ? `${verifyBase}/verificar/${getClubId()}/${jugador.cedula}?${verifyParams.toString()}`
    : null;

  // QR generado localmente — sin dependencia de API externa
  const [qrDataUrl, setQrDataUrl] = useState(null);
  useEffect(() => {
    if (!verifyUrl) { setQrDataUrl(null); return; }
    QRCodeLib.toDataURL(verifyUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark:  dark ? '#F0F0F0FF' : '#111111FF',
        light: dark ? '#111111FF' : '#FFFFFFFF',
      },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [verifyUrl, dark]);

  const fmtFecha = (f) => {
    if (!f) return '—';
    const p = f.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : f;
  };

  const redesEntries = Object.entries(redes || {}).filter(([, v]) => v);
  const redIcon = (r) => ({ instagram: '📸', facebook: '📘', youtube: '▶️', twitter: '𝕏', tiktok: '🎵', web: '🌐' }[r] || '🔗');

  const cardBase = {
    width: '320px',
    background: th.bgCard,
    borderRadius: '16px',
    border: `1px solid ${th.border}`,
    overflow: 'hidden',
    boxShadow: dark ? `0 0 48px ${clubColor}18,0 4px 20px rgba(0,0,0,0.4)` : '0 4px 24px rgba(0,0,0,0.1)',
    fontFamily: 'Inter, sans-serif',
  };

  const imprimir = () => {
    const el = document.getElementById(lado === 'frente' ? 'zs-carnet-frente' : 'zs-carnet-dorso');
    if (!el) return;
    const w = window.open('', '_blank');
    const cssVars = dark
      ? '--text-pri:#F0F0F0;--text-sec:#AAAAAA;--text-mut:#666666;--bg-surface:#1A1A2A;'
      : '--text-pri:#111111;--text-sec:#444444;--text-mut:#888888;--bg-surface:#F5F5F5;';
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Carnet — ${nombre} ${apellidos}</title>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>*{box-sizing:border-box;margin:0;padding:0;}:root{${cssVars}}
      body{background:${dark ? '#111' : '#fff'};display:flex;justify-content:center;padding:32px;font-family:Inter,sans-serif;}
      @media print{body{padding:0;}}</style>
      </head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 600);
  };

  const TopBar = () => (
    <div style={{ height: '5px', background: `linear-gradient(90deg,${clubColor},#B68631)` }} />
  );

  const LogoHeader = ({ small = false }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: small ? '10px 16px 8px' : '11px 16px 9px',
      borderBottom: `1px solid ${th.divider}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {logoUrl
          ? <img src={logoUrl} alt="logo" style={{ width: small ? '22px' : '26px', height: small ? '22px' : '26px', objectFit: 'contain' }} />
          : <EscudoSVG size={small ? 18 : 22} color={clubColor} initials={initials} />}
        <div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: small ? '13px' : '15px', letterSpacing: '2.5px', color: th.textPri, lineHeight: 1 }}>
            {clubNombre}
          </div>
          {!small && clubSub && (
            <div style={{ fontSize: '7px', letterSpacing: '2px', color: th.textMut, textTransform: 'uppercase', marginTop: '1px' }}>
              {clubSub}
            </div>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '7px', letterSpacing: '1.5px', color: th.textMut, textTransform: 'uppercase' }}>
          {small ? 'INFORMACIÓN OFICIAL' : 'CARNET OFICIAL'}
        </div>
        {!small && (
          <div style={{ fontSize: '10px', color: clubColor, fontWeight: 700, letterSpacing: '1px', marginTop: '1px' }}>
            {new Date().getFullYear()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Template selector */}
      <div>
        <p className="text-xs text-[var(--text-mut)] uppercase tracking-wider mb-2">Plantilla</p>
        <div className="flex gap-2">
          {[{ key: 'oscuro', label: 'Oscuro', swatch: '#111111' }, { key: 'claro', label: 'Claro', swatch: '#FFFFFF' }].map(({ key, label, swatch }) => (
            <button
              key={key}
              onClick={() => setPlantilla(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition"
              style={plantilla === key
                ? { borderColor: clubColor, color: clubColor, background: `${clubColor}12` }
                : { borderColor: 'var(--border-sub)', color: 'var(--text-mut)' }}
            >
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: swatch, border: '1px solid rgba(128,128,128,0.3)', flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Side toggle */}
      <div>
        <p className="text-xs text-[var(--text-mut)] uppercase tracking-wider mb-2">Vista</p>
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-surface)]">
          {[['frente', 'Frente'], ['dorso', 'Dorso']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setLado(key)}
              className="flex-1 py-1.5 rounded-md text-xs font-semibold transition"
              style={lado === key
                ? { background: 'var(--bg-card)', color: 'var(--text-pri)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }
                : { color: 'var(--text-mut)' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* FRENTE */}
      <div style={{ display: lado === 'frente' ? 'flex' : 'none', justifyContent: 'center' }}>
        <div id="zs-carnet-frente" style={cardBase}>
          <TopBar />
          <LogoHeader />

          {/* Photo full-width */}
          <div style={{ position: 'relative', margin: '12px 16px 0' }}>
            <div style={{
              width: '100%', height: '162px', borderRadius: '10px', overflow: 'hidden',
              background: th.photoBg, border: `1.5px solid ${th.borderImg}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {jugador.foto_url
                ? <img src={jugador.foto_url} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                : <svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke={dark ? '#3A3A3A' : '#C0C0C0'} strokeWidth="0.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>}
            </div>
            {(jugador.numero_camiseta || jugador.posicion) && (
              <div style={{
                position: 'absolute', bottom: '8px', left: '8px',
                background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)',
                borderRadius: '7px', padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {jugador.numero_camiseta && (
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '22px', color: clubColor, lineHeight: 1 }}>
                    #{jugador.numero_camiseta}
                  </div>
                )}
                {jugador.posicion && (
                  <div style={{ fontSize: '8px', color: '#F0F0F0', letterSpacing: '1px', textTransform: 'uppercase', maxWidth: '90px', lineHeight: 1.3 }}>
                    {jugador.posicion}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Name block */}
          <div style={{ padding: '10px 16px 4px' }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '26px', color: th.textPri, lineHeight: 1, letterSpacing: '2px' }}>
              {nombre || '—'}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '20px', color: clubColor, lineHeight: 1.1, letterSpacing: '1.5px' }}>
              {apellidos}
            </div>
            <div style={{ fontSize: '8px', color: th.textMut, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>
              JUGADOR OFICIAL
            </div>
          </div>

          {/* Footer bar */}
          <div style={{ marginTop: '12px', background: clubColor, padding: '7px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.82)', letterSpacing: '1px' }}>CC {jugador.cedula || '—'}</div>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.82)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>{clubNombre}</div>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.82)', letterSpacing: '1px' }}>{new Date().getFullYear()}</div>
          </div>
        </div>
      </div>

      {/* DORSO */}
      <div style={{ display: lado === 'dorso' ? 'flex' : 'none', justifyContent: 'center' }}>
        <div id="zs-carnet-dorso" style={cardBase}>
          <TopBar />
          <LogoHeader small />

          {/* Data + QR */}
          <div style={{ display: 'flex', gap: '12px', padding: '12px 16px' }}>
            <div style={{ flex: 1 }}>
              {[
                { label: 'Nombre',    value: `${nombre} ${apellidos}`.trim() || '—' },
                { label: 'Documento', value: jugador.cedula ? `CC ${jugador.cedula}` : '—' },
                { label: 'Nacimiento',value: fmtFecha(jugador.fecha_nacimiento) },
                { label: 'Posición',  value: jugador.posicion || '—' },
                { label: 'Celular',   value: jugador.celular || '—' },
                { label: 'EPS',       value: jugador.eps || '—' },
              ].map(({ label, value }, i) => (
                <div key={i} style={{ marginBottom: i < 5 ? '7px' : 0 }}>
                  <div style={{ fontSize: '7px', color: th.textMut, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: '10px', color: th.textPri, fontWeight: 500, lineHeight: 1.3 }}>{value}</div>
                </div>
              ))}
            </div>
            {verifyUrl && (
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: `1.5px solid ${th.border}`, background: dark ? '#111111' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {qrDataUrl
                    ? <img src={qrDataUrl} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                    : <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${clubColor}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  }
                </div>
                {/* Sello holográfico con logo del club */}
                <SelloHolograma color={clubColor} initials={initials} logoUrl={logoUrl} dark={dark} />
                <div style={{ fontSize: '6.5px', color: clubColor, letterSpacing: '1.5px', textAlign: 'center', fontWeight: 700 }}>✓ MIEMBRO OFICIAL</div>
              </div>
            )}
          </div>

          {(redesEntries.length > 0 || clubSub) && (
            <div style={{ height: '1px', margin: '0 16px', background: th.divider }} />
          )}

          {redesEntries.length > 0 && (
            <div style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {redesEntries.slice(0, 4).map(([red, val]) => (
                <div key={red} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '9px' }}>{redIcon(red)}</span>
                  <span style={{ fontSize: '8px', color: th.textSec }}>
                    {val.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {clubSub && (
            <div style={{ padding: redesEntries.length > 0 ? '0 16px 7px' : '7px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: th.textMut, letterSpacing: '2px', textTransform: 'uppercase', fontStyle: 'italic' }}>
                "{clubSub}"
              </div>
            </div>
          )}

          {/* Bottom bar */}
          <div style={{ background: clubColor, padding: '6px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.85)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {clubNombre} · TEMPORADA {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>

      {!jugador.foto_url && (
        <p className="text-center text-xs text-[var(--text-mut)]">
          Agrega una foto en la pestaña Perfil para que aparezca en el carnet.
        </p>
      )}

      <button
        onClick={imprimir}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-sm font-semibold text-[var(--text-pri)] hover:opacity-90 transition"
        style={{ borderColor: `${clubColor}40` }}
      >
        <Printer className="w-4 h-4" style={{ color: clubColor }} />
        Imprimir {lado === 'frente' ? 'Frente' : 'Dorso'} — {dark ? 'Oscuro' : 'Claro'}
      </button>
    </div>
  );
}

/* ── Componente principal: Drawer ── */

const TABS = [
  { key: 'perfil',     label: 'Perfil',     icon: User       },
  { key: 'financiero', label: 'Financiero', icon: DollarSign },
  { key: 'carnet',     label: 'Carnet',     icon: CreditCard },
];

export default function HojaDeVida({ jugador, mensualidades, torneos, suspensiones, onClose, onRefresh, initialTab = 'perfil', visibleTabs, categoriasJugadores = [], clubConfig }) {
  const tabsToShow = visibleTabs
    ? TABS.filter(t => visibleTabs.includes(t.key))
    : TABS;
  const [tab, setTab] = useState(initialTab);
  const [jugadorLocal, setJugadorLocal] = useState(jugador);

  const nombre = `${jugadorLocal['nombre(s)'] || jugadorLocal.nombre || ''} ${jugadorLocal['apellido(s)'] || jugadorLocal.apellidos || ''}`.trim();

  const handleFotoUpdate = useCallback((nuevaUrl) => {
    setJugadorLocal(j => ({ ...j, foto_url: nuevaUrl }));
    onRefresh?.();
  }, [onRefresh]);

  const handleUpdate = useCallback((campos) => {
    setJugadorLocal(j => ({ ...j, ...campos }));
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div
        className="relative w-full max-w-[560px] h-full bg-[var(--bg-card)] border-l border-[var(--border-sub)] flex flex-col shadow-2xl"
        style={{ animation: 'hdv-slide-in 0.22s ease both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-sub)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#E14924]/10 border border-[#E14924]/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {jugadorLocal.foto_url
                ? <img src={jugadorLocal.foto_url} alt="" className="w-full h-full object-cover" />
                : <User className="w-4 h-4 text-[#E14924]" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-pri)] truncate">{nombre}</p>
              <p className="text-xs text-[var(--text-mut)]">CC {jugadorLocal.cedula}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition flex-shrink-0">
            <X className="w-5 h-5 text-[var(--text-mut)]" />
          </button>
        </div>

        {/* Tabs — solo se muestran las permitidas */}
        <div className="flex border-b border-[var(--border-sub)] flex-shrink-0">
          {tabsToShow.map(t => {
            const Icon   = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition relative ${
                  active ? 'text-[#E14924]' : 'text-[var(--text-mut)] hover:text-[var(--text-pri)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E14924] rounded-t" />
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido del tab */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'perfil' && (
            <TabPerfil jugador={jugadorLocal} onFotoUpdate={handleFotoUpdate} onUpdate={handleUpdate} categoriasJugadores={categoriasJugadores} />
          )}
          {tab === 'financiero' && (
            <FinancieroContent
              cedula={jugadorLocal.cedula}
              mensualidades={mensualidades}
              torneos={torneos}
              suspensiones={suspensiones}
            />
          )}
          {tab === 'carnet' && (
            <TabCarnet jugador={jugadorLocal} clubConfig={clubConfig} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes hdv-slide-in {
          from { transform: translateX(100%); opacity: 0.6; }
          to   { transform: translateX(0);    opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
