import { useState, useRef, useCallback } from 'react';
import {
  X, User, DollarSign, CreditCard, Camera, Save,
  Loader2, Printer, CheckCircle, ClipboardList,
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

function EscudoSVG({ size = 32 }) {
  const h = Math.round(size * 44 / 38);
  return (
    <svg width={size} height={h} viewBox="0 0 38 44" fill="none">
      <path d="M19 2L3 8.5V22C3 32.8 10 40.5 19 43C28 40.5 35 32.8 35 22V8.5L19 2Z"
            fill="#1A0A04" stroke="#E14924" strokeWidth="1.4" />
      <path d="M19 5L6 10.8V22C6 31.4 11.5 38.2 19 40.5C26.5 38.2 32 31.4 32 22V10.8L19 5Z"
            fill="rgba(225,73,36,0.07)" stroke="rgba(225,73,36,0.18)" strokeWidth="0.8" />
      <line x1="6" y1="21" x2="32" y2="21" stroke="#E14924" strokeWidth="0.7" opacity="0.4" />
      <text x="19" y="18.5" textAnchor="middle" fill="#E14924"
            fontFamily="Bebas Neue, sans-serif" fontSize="9.5" letterSpacing="1.5">CFC</text>
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

function TabPerfil({ jugador, onFotoUpdate }) {
  const fileRef    = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [fotoUrl,   setFotoUrl]   = useState(jugador.foto_url || null);
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
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className="w-20 h-20 rounded-full bg-[var(--bg-surface)] border-2 border-[#E14924]/30 overflow-hidden cursor-pointer flex items-center justify-center hover:border-[#E14924]/60 transition"
          >
            {fotoUrl
              ? <img src={fotoUrl} alt={nombreDisplay} className="w-full h-full object-cover" />
              : <User className="w-8 h-8 text-[var(--text-mut)]" />}
          </div>
          <button
            onClick={() => !uploading && fileRef.current?.click()}
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
          <p className="text-xs text-[var(--text-mut)] mt-0.5">Clic en la foto para cambiar</p>
        </div>
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

/* ── Tab Carnet ── */

function TabCarnet({ jugador }) {
  const nombre    = (jugador['nombre(s)']  || jugador.nombre    || '').trim();
  const apellidos = (jugador['apellido(s)'] || jugador.apellidos || '').trim();

  const imprimir = () => {
    const el = document.getElementById('city-fc-carnet');
    const w  = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>Carnet — ${nombre} ${apellidos}</title>
          <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { background: #fff; display: flex; justify-content: center; padding: 24px; font-family: Inter, sans-serif; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${el.outerHTML}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const stats = [
    { label: 'CAMISETA', value: jugador.numero_camiseta ? `#${jugador.numero_camiseta}` : '—', color: '#E14924' },
    { label: 'POSICIÓN',  value: jugador.posicion || '—',   color: '#B68631' },
    { label: 'SANGRE',    value: jugador.tipo_sangre || '—', color: '#EF4444' },
  ];

  return (
    <div className="space-y-5">
      {/* Card preview */}
      <div
        id="city-fc-carnet"
        style={{
          width: '320px', margin: '0 auto',
          background: 'linear-gradient(160deg, #1A0804 0%, #0E0E0E 55%, #0A0A0A 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(225,73,36,0.25)',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(225,73,36,0.06)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Barra superior naranja→dorada */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #E14924, #B68631)' }} />

        {/* Cabecera del club */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          padding: '14px 20px 10px',
          borderBottom: '1px solid rgba(225,73,36,0.12)',
        }}>
          <EscudoSVG size={28} />
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '18px', letterSpacing: '3px', color: 'var(--text-pri)', lineHeight: 1 }}>
              CITY F.C. <span style={{ color: '#B68631', fontSize: '11px' }}>★</span>
            </div>
            <div style={{ fontSize: '8px', letterSpacing: '3px', color: 'var(--text-mut)', textTransform: 'uppercase' }}>
              Lo Hacemos Diferente
            </div>
          </div>
        </div>

        {/* Foto + nombre */}
        <div style={{ display: 'flex', gap: '16px', padding: '16px 20px 12px', alignItems: 'flex-start' }}>
          <div style={{
            width: '82px', height: '82px', borderRadius: '10px', flexShrink: 0,
            overflow: 'hidden', background: 'var(--bg-surface)',
            border: '1.5px solid rgba(225,73,36,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {jugador.foto_url ? (
              <img src={jugador.foto_url} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#3A3A3A" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '22px', color: 'var(--text-pri)', lineHeight: 1, letterSpacing: '1.5px' }}>
              {nombre}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '18px', color: '#E14924', lineHeight: 1.1, letterSpacing: '1px' }}>
              {apellidos}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-mut)', marginTop: '6px', letterSpacing: '0.5px' }}>
              CC {jugador.cedula}
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--text-mut)', textTransform: 'uppercase', marginTop: '2px' }}>
              JUGADOR
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: '1px', margin: '0 20px', background: 'linear-gradient(90deg, rgba(225,73,36,0.35), rgba(182,134,49,0.25), transparent)' }} />

        {/* Stats */}
        <div style={{ display: 'flex', padding: '12px 20px' }}>
          {stats.map((item, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              padding: '0 8px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: item.color, fontFamily: "'Bebas Neue', cursive", letterSpacing: '1px' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '7.5px', color: 'var(--text-mut)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Divisor */}
        <div style={{ height: '1px', margin: '0 20px', background: 'var(--bg-surface)' }} />

        {/* Emergencia */}
        {(jugador.familiar_emergencia || jugador.celular_contacto) && (
          <div style={{ padding: '10px 20px 14px' }}>
            <div style={{ fontSize: '7.5px', color: 'var(--text-mut)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
              Contacto de Emergencia
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-sec)' }}>
              {jugador.familiar_emergencia || '—'} · {jugador.celular_contacto || '—'}
            </div>
          </div>
        )}

        {/* Barra inferior dorada */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(182,134,49,0.45), transparent)' }} />
      </div>

      {jugador.posicion === '' && jugador.numero_camiseta === '' && (
        <p className="text-center text-xs text-[var(--text-mut)]">
          Completa posición y número en la pestaña Perfil para que aparezcan en el carnet.
        </p>
      )}

      <button
        onClick={imprimir}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-sub)] text-sm font-semibold text-[var(--text-pri)] hover:border-[#E14924]/40 hover:bg-[#E14924]/5 transition"
      >
        <Printer className="w-4 h-4 text-[#E14924]" />
        Imprimir Carnet
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

export default function HojaDeVida({ jugador, mensualidades, torneos, suspensiones, onClose, onRefresh, initialTab = 'perfil', visibleTabs }) {
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
            <TabPerfil jugador={jugadorLocal} onFotoUpdate={handleFotoUpdate} />
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
            <TabCarnet jugador={jugadorLocal} />
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
