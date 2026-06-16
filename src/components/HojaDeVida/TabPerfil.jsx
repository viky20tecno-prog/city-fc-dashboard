import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  X, User, Camera, Save, Loader2, CheckCircle, ClipboardList, ZoomIn,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { authFetch } from '../../lib/authFetch';
import { API_BASE_URL } from '../../config';
import { getClubId } from '../../services/api';
import { PAISES_NACIMIENTO } from '../../lib/paises';
import { normalizarCategorias } from '../../lib/categorias';

const POSICIONES_POR_DEPORTE = {
  futbol:     ['Portero', 'Defensa Central', 'Lateral Derecho', 'Lateral Izquierdo', 'Mediocampista Defensivo', 'Mediocampista', 'Mediocampista Ofensivo', 'Extremo Derecho', 'Extremo Izquierdo', 'Delantero', 'Atacante'],
  baloncesto: ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'],
  voleibol:   ['Armador', 'Opuesto', 'Central', 'Receptor', 'Libero'],
  natacion:   ['Mariposa', 'Espalda', 'Pecho', 'Crol', 'Combinado'],
  tenis:      ['Sencillos', 'Dobles', 'Dobles Mixtos'],
  beisbol:    ['Lanzador', 'Receptor', 'Primera Base', 'Segunda Base', 'Tercera Base', 'Shortstop', 'Jardinero Izquierdo', 'Jardinero Central', 'Jardinero Derecho'],
  ciclismo:   ['Sprinter', 'Rodador', 'Escalador', 'Contrarrelojista', 'Doméstico'],
  rugby:      ['Pilar', 'Hooker', 'Segunda Línea', 'Flanker', 'Número 8', 'Medio Scrum', 'Apertura', 'Centro', 'Ala', 'Zaguero'],
  general:    [],
};

function Seccion({ titulo, children }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-sub)] p-4">
      <p className="text-xs text-[var(--text-mut)] uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-3 h-0.5 bg-[var(--cc)] inline-block rounded" />
        {titulo}
      </p>
      {children}
    </div>
  );
}

const INPUT_CLS = "w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-sub)] text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)]/50 placeholder-[var(--text-mut)]";

const PAISES_TEL = [
  { code: '57',  flag: '🇨🇴', label: '+57',  nombre: 'Colombia'    },
  { code: '1',   flag: '🇺🇸', label: '+1',   nombre: 'EE.UU.'      },
  { code: '52',  flag: '🇲🇽', label: '+52',  nombre: 'México'      },
  { code: '34',  flag: '🇪🇸', label: '+34',  nombre: 'España'      },
  { code: '54',  flag: '🇦🇷', label: '+54',  nombre: 'Argentina'   },
  { code: '56',  flag: '🇨🇱', label: '+56',  nombre: 'Chile'       },
  { code: '51',  flag: '🇵🇪', label: '+51',  nombre: 'Perú'        },
  { code: '593', flag: '🇪🇨', label: '+593', nombre: 'Ecuador'     },
  { code: '58',  flag: '🇻🇪', label: '+58',  nombre: 'Venezuela'   },
  { code: '55',  flag: '🇧🇷', label: '+55',  nombre: 'Brasil'      },
  { code: '598', flag: '🇺🇾', label: '+598', nombre: 'Uruguay'     },
  { code: '595', flag: '🇵🇾', label: '+595', nombre: 'Paraguay'    },
  { code: '591', flag: '🇧🇴', label: '+591', nombre: 'Bolivia'     },
  { code: '506', flag: '🇨🇷', label: '+506', nombre: 'Costa Rica'  },
  { code: '507', flag: '🇵🇦', label: '+507', nombre: 'Panamá'      },
];

function parsePhone(full) {
  const digits = String(full || '').replace(/\D/g, '');
  for (const c of [...PAISES_TEL].sort((a, b) => b.code.length - a.code.length)) {
    if (digits.startsWith(c.code) && digits.length > c.code.length) {
      return { code: c.code, local: digits.slice(c.code.length) };
    }
  }
  return { code: '57', local: digits };
}

function CountryPicker({ code, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const sel = PAISES_TEL.find(p => p.code === code) || PAISES_TEL[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0" style={{ width: 90 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1 px-2 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-sub)] text-sm text-[var(--text-pri)] cursor-pointer"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{sel.flag}</span>
        <span className="text-xs text-[var(--text-mut)]">{sel.label}</span>
        <ChevronDown size={10} className="ml-auto shrink-0 text-[var(--text-mut)]" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-lg border border-[var(--border-sub)] overflow-auto"
             style={{ background: 'var(--bg-card)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', maxHeight: 240, width: 200 }}>
          {PAISES_TEL.map(p => (
            <button
              key={p.code}
              type="button"
              onClick={() => { onChange(p.code); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs border-none cursor-pointer hover:bg-white/5 ${p.code === code ? 'bg-white/10' : 'bg-transparent'}`}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{p.flag}</span>
              <span className="text-[var(--text-mut)] shrink-0">{p.label}</span>
              <span className="text-[var(--text-sec)] truncate">{p.nombre || ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CampoTelIntl({ label, value, onChange, placeholder = '3001234567' }) {
  const parsed = parsePhone(value);
  const [code, setCode] = useState(parsed.code);
  const [local, setLocal] = useState(parsed.local);
  return (
    <div className="space-y-1">
      <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">{label}</label>
      <div className="flex gap-1.5">
        <CountryPicker code={code} onChange={c => { setCode(c); onChange(c + local); }} />
        <input
          type="tel"
          value={local}
          onChange={e => { const d = e.target.value.replace(/\D/g,''); setLocal(d); onChange(code + d); }}
          placeholder={placeholder}
          className={INPUT_CLS + ' flex-1'}
        />
      </div>
    </div>
  );
}

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

export default function TabPerfil({ jugador, onFotoUpdate, onUpdate, categoriasJugadores = [], clubConfig }) {
  const fileRef    = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [fotoUrl,   setFotoUrl]   = useState(jugador.foto_url || null);
  const [lightbox,  setLightbox]  = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado,  setGuardado]  = useState(false);
  const [error,     setError]     = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [newCat,    setNewCat]    = useState({ categoria: '', equipo: '' });

  const [form, setForm] = useState({
    deporte:             jugador.deporte             || clubConfig?.deporte || 'futbol',
    posicion:            jugador.posicion            || '',
    numero_camiseta:     jugador.numero_camiseta     || '',
    tipo_id:             jugador.tipo_id             || '',
    nombre:              jugador.nombre              || '',
    apellidos:           jugador.apellidos           || '',
    celular:             jugador.celular             || '',
    correo_electronico:  jugador.correo_electronico  || '',
    instagram:           jugador.instagram           || '',
    pais_nacimiento:     jugador.pais_nacimiento     || '',
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
    tipo_descuento:      jugador.tipo_descuento      || 'NA',
    descuento_pct:       jugador.descuento_pct       ?? 0,
    categorias: Array.isArray(jugador.categorias) && jugador.categorias.length
      ? jugador.categorias
      : (jugador.categoria ? [{ categoria: jugador.categoria, equipo: jugador.equipo || '' }] : []),
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
    const up = v => typeof v === 'string' ? v.trim().toUpperCase() : v;
    try {
      const payload = {
        ...form,
        deporte:             form.deporte || null,
        nombre:              up(form.nombre),
        apellidos:           up(form.apellidos),
        lugar_de_nacimiento: up(form.lugar_de_nacimiento),
        eps:                 up(form.eps),
        municipio:           up(form.municipio),
        barrio:              up(form.barrio),
        direccion:           up(form.direccion),
        familiar_emergencia: up(form.familiar_emergencia),
        correo_electronico:  form.correo_electronico?.trim().toLowerCase(),
        numero_camiseta: form.numero_camiseta ? parseInt(form.numero_camiseta)  : null,
        estatura:        form.estatura        ? parseFloat(form.estatura)        : null,
        peso:            form.peso            ? parseFloat(form.peso)            : null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        categorias:     form.categorias,
        categoria:      form.categorias[0]?.categoria || '',
        equipo:         form.categorias[0]?.equipo    || '',
        tipo_descuento: form.tipo_descuento,
        descuento_pct:  form.tipo_descuento === 'NA' ? 0 : Math.max(0, Math.min(100, Number(form.descuento_pct) || 0)),
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

  const SaveBtn = () => (
    <button
      onClick={guardar}
      disabled={guardando || guardado}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
        guardado
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-[var(--cc)] hover:opacity-90 text-white disabled:opacity-60'
      }`}
    >
      {guardando ? <Loader2 className="w-4 h-4 animate-spin" />
        : guardado ? <CheckCircle className="w-4 h-4" />
        : <Save className="w-4 h-4" />}
      {guardado ? 'Guardado' : guardando ? 'Guardando...' : 'Guardar todos los cambios'}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Avatar + nombre */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div
            onClick={() => fotoUrl && setLightbox(true)}
            className={`w-20 h-20 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--cc)]/30 overflow-hidden flex items-center justify-center transition ${fotoUrl ? 'cursor-zoom-in hover:border-[var(--cc)]/70' : 'cursor-default'}`}
          >
            {fotoUrl
              ? <img src={fotoUrl} alt={nombreDisplay} className="w-full h-full object-cover" />
              : <User className="w-8 h-8 text-[var(--text-mut)]" />}
          </div>
          <button
            onClick={() => !uploading && fileRef.current?.click()}
            title="Cambiar foto"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--cc)] flex items-center justify-center shadow-lg hover:opacity-90 transition"
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

      <SaveBtn />

      {/* Datos deportivos */}
      <Seccion titulo="Datos Deportivos">
        <div className="grid grid-cols-2 gap-3">
          {/* Deporte del jugador — solo visible si el club tiene más de uno */}
          {Array.isArray(clubConfig?.deportes) && clubConfig.deportes.length > 1 && (
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">Deporte</label>
              <select value={form.deporte} onChange={set('deporte')} className={INPUT_CLS}>
                {clubConfig.deportes.map(d => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">Posición</label>
            <select value={form.posicion} onChange={set('posicion')} className={INPUT_CLS}>
              <option value="">— Sin asignar —</option>
              {(POSICIONES_POR_DEPORTE[form.deporte] ?? POSICIONES_POR_DEPORTE.futbol).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <CampoEdit
            label="Número de camiseta"
            type="number" min="1" max="99"
            value={form.numero_camiseta}
            onChange={set('numero_camiseta')}
            placeholder="Ej: 10"
          />
          {categoriasJugadores.length > 0 && (() => {
            const cats = normalizarCategorias(categoriasJugadores);
            const newCatSel = cats.find(c => c.nombre === newCat.categoria);

            const quitarCat = (idx) =>
              setForm(f => ({ ...f, categorias: f.categorias.filter((_, i) => i !== idx) }));

            const confirmarAgregar = () => {
              if (!newCat.categoria) return;
              setForm(f => ({ ...f, categorias: [...f.categorias, { ...newCat }] }));
              setNewCat({ categoria: '', equipo: '' });
              setAddingCat(false);
            };

            return (
              <div className="col-span-2 space-y-2">
                <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">Categorías</label>
                {form.categorias.length === 0 && (
                  <p className="text-xs italic" style={{ color: 'var(--text-mut)' }}>Sin categoría asignada</p>
                )}
                {form.categorias.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)' }}>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-pri)' }}>
                      {c.categoria}{c.equipo ? <span style={{ color: 'var(--text-mut)' }}> — {c.equipo}</span> : ''}
                    </span>
                    <button type="button" onClick={() => quitarCat(idx)}
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition hover:bg-red-500/20"
                      style={{ color: 'var(--text-mut)' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {addingCat ? (
                  <div className="space-y-2 p-3 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)' }}>
                    <select value={newCat.categoria}
                      onChange={e => setNewCat(n => ({ ...n, categoria: e.target.value, equipo: '' }))}
                      className={INPUT_CLS + ' cursor-pointer'}>
                      <option value="">— Seleccionar categoría —</option>
                      {cats.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
                    </select>
                    {newCatSel && newCatSel.equipos.length > 0 && !(newCatSel.equipos.length === 1 && newCatSel.equipos[0] === newCatSel.nombre) && (
                      <select value={newCat.equipo}
                        onChange={e => setNewCat(n => ({ ...n, equipo: e.target.value }))}
                        className={INPUT_CLS + ' cursor-pointer'}>
                        <option value="">— Sin equipo específico —</option>
                        {newCatSel.equipos.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                      </select>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={confirmarAgregar} disabled={!newCat.categoria}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition"
                        style={{ background: 'var(--cc)', color: '#fff', opacity: newCat.categoria ? 1 : 0.4 }}>
                        Agregar
                      </button>
                      <button type="button" onClick={() => { setAddingCat(false); setNewCat({ categoria: '', equipo: '' }); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)', color: 'var(--text-sec)' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setAddingCat(true)}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                    style={{ border: '1px dashed var(--border-sub)', color: 'var(--text-mut)' }}>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Agregar categoría
                  </button>
                )}
              </div>
            );
          })()}
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
          <CampoTelIntl label="Celular (WhatsApp)" value={form.celular} onChange={v => setForm(f => ({ ...f, celular: v }))} />
          <CampoEdit label="Correo electrónico" value={form.correo_electronico} onChange={set('correo_electronico')} placeholder="correo@email.com" type="email" />
          <CampoEdit label="Instagram"          value={form.instagram}          onChange={set('instagram')}          placeholder="@usuario" />
        </div>
      </Seccion>

      {/* Datos médicos */}
      <Seccion titulo="Datos Médicos">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">País de nacimiento</label>
            <select value={form.pais_nacimiento} onChange={set('pais_nacimiento')}
              className={INPUT_CLS + ' cursor-pointer'} style={{ appearance: 'none', WebkitAppearance: 'none' }}>
              <option value="">— Seleccionar —</option>
              {PAISES_NACIMIENTO.map(p => (
                <option key={p.codigo + p.nombre} value={p.nombre}>{p.bandera} {p.nombre}</option>
              ))}
            </select>
          </div>
          <CampoEdit label="Ciudad de nacimiento" value={form.lugar_de_nacimiento} onChange={set('lugar_de_nacimiento')} placeholder="Ciudad" />
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
          <CampoTelIntl label="Celular de contacto" value={form.celular_contacto} onChange={v => setForm(f => ({ ...f, celular_contacto: v }))} />
        </div>
      </Seccion>

      {/* Beca / Descuento */}
      <Seccion titulo="Beca / Descuento">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">Tipo</label>
            <select value={form.tipo_descuento}
              onChange={e => {
                const tipo = e.target.value;
                setForm(f => ({ ...f, tipo_descuento: tipo, descuento_pct: tipo === 'NA' ? 0 : f.descuento_pct }));
              }}
              className={INPUT_CLS}>
              <option value="NA">Sin descuento</option>
              <option value="BECA_DEPORTIVA">Beca Deportiva</option>
              <option value="BECA_SOCIAL">Beca Social</option>
              <option value="CONDICION_ESPECIAL">Condición Especial</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-mut)] uppercase tracking-wider">Descuento (%)</label>
            <input type="number" min="0" max="100" step="1"
              value={form.descuento_pct} onChange={set('descuento_pct')}
              disabled={form.tipo_descuento === 'NA'} placeholder="0"
              className={INPUT_CLS} style={{ opacity: form.tipo_descuento === 'NA' ? 0.4 : 1 }} />
          </div>
        </div>
        {form.tipo_descuento !== 'NA' && Number(form.descuento_pct) > 0 && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-mut)' }}>
            Al guardar se ajustará la mensualidad del mes actual si aún no está pagada.
          </p>
        )}
      </Seccion>

      {/* Observaciones / Notas médicas */}
      <div className="rounded-xl border border-[var(--border-sub)] p-4" style={{ background: 'var(--bg-surface)' }}>
        <p className="text-xs text-[var(--text-mut)] uppercase tracking-wider mb-3 flex items-center gap-2">
          <ClipboardList className="w-3 h-3 text-[var(--cc)]" />
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
          onFocus={e => e.target.style.borderColor = 'var(--cc)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border-sub)'}
        />
      </div>

      <SaveBtn />
    </div>
  );
}
