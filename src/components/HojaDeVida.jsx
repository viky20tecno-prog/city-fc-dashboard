import { useState, useRef, useCallback } from 'react';
import {
  X, User, DollarSign, CreditCard, Camera, Save,
  Loader2, Printer, CheckCircle,
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

function Campo({ label, valor }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-[#6A6A6A] uppercase tracking-wider">{label}</p>
      <p className="text-sm text-[#F5F5F5] font-medium break-words">
        {valor || <span className="text-[#3A3A3A]">—</span>}
      </p>
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4">
      <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-3 flex items-center gap-2">
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

function TabPerfil({ jugador, onFotoUpdate }) {
  const fileRef    = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [fotoUrl,   setFotoUrl]   = useState(jugador.foto_url || null);
  const [posicion,  setPosicion]  = useState(jugador.posicion || '');
  const [numero,    setNumero]    = useState(jugador.numero_camiseta || '');
  const [guardando, setGuardando] = useState(false);
  const [guardado,  setGuardado]  = useState(false);
  const [error,     setError]     = useState('');

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

      // cache-bust para forzar reload de la imagen
      setFotoUrl(`${publicUrl}?t=${Date.now()}`);
      onFotoUpdate?.(publicUrl);
    } catch (err) {
      setError(err.message || 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const guardarDeportivos = async () => {
    setGuardando(true);
    setError('');
    try {
      const res  = await authFetch(
        `${API_BASE_URL}/players/${jugador.cedula}?club_id=${getClubId()}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            posicion:        posicion || null,
            numero_camiseta: numero ? parseInt(numero) : null,
          }) },
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

  const nombre = `${jugador['nombre(s)'] || jugador.nombre || ''} ${jugador['apellido(s)'] || jugador.apellidos || ''}`.trim();

  return (
    <div className="space-y-5">
      {/* Avatar + nombre */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className="w-20 h-20 rounded-full bg-[#1E1E1E] border-2 border-[#E14924]/30 overflow-hidden cursor-pointer flex items-center justify-center hover:border-[#E14924]/60 transition"
          >
            {fotoUrl
              ? <img src={fotoUrl} alt={nombre} className="w-full h-full object-cover" />
              : <User className="w-8 h-8 text-[#3A3A3A]" />}
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
          <p className="text-base font-bold text-[#F5F5F5]">{nombre}</p>
          <p className="text-sm text-[#6A6A6A]">CC {jugador.cedula}</p>
          <p className="text-xs text-[#4A4A4A] mt-0.5">Clic en la foto para cambiar</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-[#EF4444]">{error}</div>
      )}

      {/* Datos deportivos (editables) */}
      <Seccion titulo="Datos Deportivos">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[#6A6A6A]">Posición</label>
            <select
              value={posicion}
              onChange={e => setPosicion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#2A2A2A] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#E14924]/50"
            >
              <option value="">— Sin asignar —</option>
              {POSICIONES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#6A6A6A]">Número de camiseta</label>
            <input
              type="number" min="1" max="99"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              placeholder="Ej: 10"
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#2A2A2A] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#E14924]/50 placeholder-[#3A3A3A]"
            />
          </div>
        </div>
        <button
          onClick={guardarDeportivos}
          disabled={guardando || guardado}
          className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
            guardado
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-[#E14924] hover:bg-[#C9381A] text-white disabled:opacity-60'
          }`}
        >
          {guardando ? <Loader2 className="w-4 h-4 animate-spin" />
            : guardado ? <CheckCircle className="w-4 h-4" />
            : <Save className="w-4 h-4" />}
          {guardado ? 'Guardado' : guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </Seccion>

      {/* Datos del registro (solo lectura) */}
      <Seccion titulo="Datos Personales">
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Tipo de documento"   valor={jugador.tipo_id || jugador.tipo_documento} />
          <Campo label="Cédula / ID"          valor={jugador.cedula} />
          <Campo label="Nombre(s)"            valor={jugador['nombre(s)'] || jugador.nombre} />
          <Campo label="Apellido(s)"          valor={jugador['apellido(s)'] || jugador.apellidos} />
        </div>
      </Seccion>

      <Seccion titulo="Contacto">
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Celular"              valor={jugador.celular} />
          <Campo label="Correo electrónico"   valor={jugador.correo_electronico} />
          <Campo label="Instagram"            valor={jugador.instagram} />
        </div>
      </Seccion>

      <Seccion titulo="Datos Médicos">
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Lugar de nacimiento"  valor={jugador.lugar_de_nacimiento} />
          <Campo label="Fecha de nacimiento"  valor={jugador.fecha_nacimiento} />
          <Campo label="Tipo de sangre"       valor={jugador.tipo_sangre} />
          <Campo label="EPS"                  valor={jugador.eps} />
          <Campo label="Estatura"             valor={jugador.estatura ? `${jugador.estatura} m` : null} />
          <Campo label="Peso"                 valor={jugador.peso    ? `${jugador.peso} kg`    : null} />
        </div>
      </Seccion>

      <Seccion titulo="Residencia">
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Municipio"            valor={jugador.municipio} />
          <Campo label="Barrio"               valor={jugador.barrio} />
          <Campo label="Dirección"            valor={jugador.direccion} />
        </div>
      </Seccion>

      <Seccion titulo="Contacto de Emergencia">
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Familiar / Contacto"  valor={jugador.familiar_emergencia} />
          <Campo label="Celular de contacto"  valor={jugador.celular_contacto} />
        </div>
      </Seccion>
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
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '18px', letterSpacing: '3px', color: '#FFF', lineHeight: 1 }}>
              CITY F.C. <span style={{ color: '#B68631', fontSize: '11px' }}>★</span>
            </div>
            <div style={{ fontSize: '8px', letterSpacing: '3px', color: '#555', textTransform: 'uppercase' }}>
              Lo Hacemos Diferente
            </div>
          </div>
        </div>

        {/* Foto + nombre */}
        <div style={{ display: 'flex', gap: '16px', padding: '16px 20px 12px', alignItems: 'flex-start' }}>
          <div style={{
            width: '82px', height: '82px', borderRadius: '10px', flexShrink: 0,
            overflow: 'hidden', background: '#1A1A1A',
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
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '22px', color: '#FFF', lineHeight: 1, letterSpacing: '1.5px' }}>
              {nombre}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '18px', color: '#E14924', lineHeight: 1.1, letterSpacing: '1px' }}>
              {apellidos}
            </div>
            <div style={{ fontSize: '10px', color: '#555', marginTop: '6px', letterSpacing: '0.5px' }}>
              CC {jugador.cedula}
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#444', textTransform: 'uppercase', marginTop: '2px' }}>
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
              <div style={{ fontSize: '7.5px', color: '#444', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Divisor */}
        <div style={{ height: '1px', margin: '0 20px', background: 'rgba(255,255,255,0.04)' }} />

        {/* Emergencia */}
        {(jugador.familiar_emergencia || jugador.celular_contacto) && (
          <div style={{ padding: '10px 20px 14px' }}>
            <div style={{ fontSize: '7.5px', color: '#444', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
              Contacto de Emergencia
            </div>
            <div style={{ fontSize: '10px', color: '#888' }}>
              {jugador.familiar_emergencia || '—'} · {jugador.celular_contacto || '—'}
            </div>
          </div>
        )}

        {/* Barra inferior dorada */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(182,134,49,0.45), transparent)' }} />
      </div>

      {jugador.posicion === '' && jugador.numero_camiseta === '' && (
        <p className="text-center text-xs text-[#6A6A6A]">
          Completa posición y número en la pestaña Perfil para que aparezcan en el carnet.
        </p>
      )}

      <button
        onClick={imprimir}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-sm font-semibold text-[#F5F5F5] hover:border-[#E14924]/40 hover:bg-[#E14924]/5 transition"
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
        className="relative w-full max-w-[560px] h-full bg-[#141414] border-l border-[#2A2A2A] flex flex-col shadow-2xl"
        style={{ animation: 'hdv-slide-in 0.22s ease both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#E14924]/10 border border-[#E14924]/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {jugadorLocal.foto_url
                ? <img src={jugadorLocal.foto_url} alt="" className="w-full h-full object-cover" />
                : <User className="w-4 h-4 text-[#E14924]" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F5F5F5] truncate">{nombre}</p>
              <p className="text-xs text-[#6A6A6A]">CC {jugadorLocal.cedula}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#1E1E1E] transition flex-shrink-0">
            <X className="w-5 h-5 text-[#6A6A6A]" />
          </button>
        </div>

        {/* Tabs — solo se muestran las permitidas */}
        <div className="flex border-b border-[#2A2A2A] flex-shrink-0">
          {tabsToShow.map(t => {
            const Icon   = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition relative ${
                  active ? 'text-[#E14924]' : 'text-[#6A6A6A] hover:text-[#F5F5F5]'
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
