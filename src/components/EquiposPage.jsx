import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Shield, Plus, X, ChevronRight, ChevronDown, Users, UserX,
  Pencil, Check, Loader2, Search, UserPlus, Tag,
} from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import { API_BASE_URL } from '../config';
import { normalizarCategorias } from '../lib/categorias';

const SUGERENCIAS = ['Benjamín', 'Infantil', 'Pre-juvenil', 'Juvenil', 'Sub-17', 'Sub-20', 'Mayores', 'Veteranos', 'Femenino'];

/* ── helpers ── */
function Badge({ n, active, color }) {
  return (
    <span style={{
      padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: active ? `${color}30` : 'rgba(255,255,255,0.07)',
      color: active ? color : 'var(--text-mut)',
    }}>{n}</span>
  );
}

function PlayerRow({ jugador, onRemove, removing }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderRadius: 10,
      background: 'var(--bg-card)', border: '1px solid var(--border-sub)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--cc12)', border: '1px solid var(--cc20)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: 'var(--cc)', flexShrink: 0,
      }}>
        {(jugador.nombre?.[0] || '?').toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--text-pri)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {jugador.nombre} {jugador.apellidos}
        </div>
        <div style={{ color: 'var(--text-mut)', fontSize: 11 }}>{jugador.cedula}</div>
      </div>
      <button
        onClick={() => onRemove(jugador)}
        disabled={removing}
        title="Quitar del equipo"
        style={{
          background: 'none', border: 'none', cursor: removing ? 'wait' : 'pointer',
          color: 'var(--text-mut)', padding: 4, display: 'flex', alignItems: 'center',
          borderRadius: 6, transition: 'color 0.15s',
        }}
        onMouseEnter={e => { if (!removing) e.currentTarget.style.color = '#EF4444'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-mut)'; }}
      >
        {removing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
      </button>
    </div>
  );
}

export default function EquiposPage({ color = '#00AAFF', clubConfig, onConfigSaved }) {
  const clubId = getClubId();
  const c = color;

  /* ── estado categorías ── */
  const [categorias, setCategorias]   = useState(() => normalizarCategorias(clubConfig?.categorias_jugadores || []));
  const [guardando,  setGuardando]    = useState(false);
  const [guardado,   setGuardado]     = useState(false);
  const [nueva,      setNueva]        = useState('');
  const [expandida,  setExpandida]    = useState(null);
  const [nuevoEq,    setNuevoEq]      = useState('');
  const [editandoCat, setEditandoCat] = useState(null);
  const [editNombre,  setEditNombre]  = useState('');

  /* ── panel derecho ── */
  const [seleccion,  setSeleccion]    = useState(null); // { categoria, equipo } | null
  const [jugadores,  setJugadores]    = useState([]);
  const [loadingJ,   setLoadingJ]     = useState(false);
  const [busqueda,   setBusqueda]     = useState('');
  const [asignando,  setAsignando]    = useState(false);
  const [removingId, setRemovingId]   = useState(null);
  const [showAsignar, setShowAsignar] = useState(false);

  /* sync cuando cambia clubConfig externamente */
  useEffect(() => {
    setCategorias(normalizarCategorias(clubConfig?.categorias_jugadores || []));
  }, [clubConfig]);

  /* cargar jugadores */
  const cargarJugadores = useCallback(async () => {
    setLoadingJ(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/players?club_id=${clubId}`);
      const data = await res.json();
      if (data.success) setJugadores(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingJ(false); }
  }, [clubId]);

  useEffect(() => { cargarJugadores(); }, [cargarJugadores]);

  /* jugadores del equipo seleccionado */
  const jugadoresEnEquipo = useMemo(() => {
    if (!seleccion) return [];
    return jugadores.filter(j => {
      if (seleccion.equipo) return j.equipo === seleccion.equipo && j.categoria === seleccion.categoria;
      return j.categoria === seleccion.categoria && !j.equipo;
    });
  }, [jugadores, seleccion]);

  /* jugadores sin equipo (para asignar) */
  const jugadoresSinEquipo = useMemo(() =>
    jugadores.filter(j => !j.categoria && !j.equipo),
    [jugadores]
  );

  const jugadoresDisponibles = useMemo(() => {
    const q = busqueda.toLowerCase();
    const pool = jugadores.filter(j =>
      !jugadoresEnEquipo.some(je => je.cedula === j.cedula)
    );
    if (!q) return pool;
    return pool.filter(j =>
      `${j.nombre} ${j.apellidos}`.toLowerCase().includes(q) || j.cedula?.includes(q)
    );
  }, [jugadores, jugadoresEnEquipo, busqueda]);

  /* conteo por nombre de equipo/categoria */
  const conteoPor = useMemo(() => {
    const map = {};
    jugadores.forEach(j => {
      const key = j.equipo || j.categoria || '__sin__';
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [jugadores]);

  const sinEquipoCount = useMemo(() =>
    jugadores.filter(j => !j.equipo && !j.categoria).length,
    [jugadores]
  );

  /* ── guardar categorías en config ── */
  const guardarConfig = useCallback(async (nuevasCats) => {
    setGuardando(true);
    try {
      await authFetch(`${API_BASE_URL}/config?club_id=${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorias_jugadores: nuevasCats }),
      });
      setGuardado(true);
      onConfigSaved?.(nuevasCats);
      setTimeout(() => setGuardado(false), 2000);
    } catch (err) { alert('Error al guardar: ' + err.message); }
    finally { setGuardando(false); }
  }, [clubId, onConfigSaved]);

  /* ── CRUD categorías ── */
  const agregarCategoria = (nombre) => {
    const t = nombre.trim().toUpperCase();
    if (!t || categorias.some(c => c.nombre === t)) return;
    const nuevas = [...categorias, { nombre: t, equipos: [t] }];
    setCategorias(nuevas);
    setNueva('');
    guardarConfig(nuevas);
  };

  const eliminarCategoria = (idx) => {
    const nuevas = categorias.filter((_, i) => i !== idx);
    setCategorias(nuevas);
    if (seleccion?.categoria === categorias[idx].nombre) setSeleccion(null);
    guardarConfig(nuevas);
  };

  const guardarEditCategoria = (idx) => {
    const t = editNombre.trim().toUpperCase();
    if (!t || (t !== categorias[idx].nombre && categorias.some(c => c.nombre === t))) return;
    const nuevas = categorias.map((c, i) => i === idx ? { ...c, nombre: t, equipos: c.equipos.map(e => e === c.nombre ? t : e) } : c);
    setCategorias(nuevas);
    setEditandoCat(null);
    guardarConfig(nuevas);
  };

  const agregarEquipo = (catIdx) => {
    const t = nuevoEq.trim().toUpperCase();
    if (!t) return;
    const cat = categorias[catIdx];
    if (cat.equipos.includes(t)) return;
    const nuevas = categorias.map((c, i) => i === catIdx ? { ...c, equipos: [...c.equipos, t] } : c);
    setCategorias(nuevas);
    setNuevoEq('');
    guardarConfig(nuevas);
  };

  const eliminarEquipo = (catIdx, eqIdx) => {
    const nuevas = categorias.map((c, i) => {
      if (i !== catIdx) return c;
      const eqs = c.equipos.filter((_, j) => j !== eqIdx);
      return { ...c, equipos: eqs.length ? eqs : c.equipos };
    });
    setCategorias(nuevas);
    guardarConfig(nuevas);
  };

  /* ── asignar / quitar jugador ── */
  const asignarJugador = async (jugador) => {
    if (!seleccion) return;
    setAsignando(true);
    try {
      const body = {
        categoria: seleccion.categoria,
        equipo:    seleccion.equipo || '',
        categorias: [{ categoria: seleccion.categoria, equipo: seleccion.equipo || '' }],
      };
      await authFetch(`${API_BASE_URL}/players/${jugador.cedula}?club_id=${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await cargarJugadores();
      setBusqueda('');
      setShowAsignar(false);
    } catch (e) { alert('Error al asignar: ' + e.message); }
    finally { setAsignando(false); }
  };

  const quitarJugador = async (jugador) => {
    setRemovingId(jugador.cedula);
    try {
      await authFetch(`${API_BASE_URL}/players/${jugador.cedula}?club_id=${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: null, equipo: null, categorias: [] }),
      });
      await cargarJugadores();
    } catch (e) { alert('Error al quitar: ' + e.message); }
    finally { setRemovingId(null); }
  };

  const disponibles = SUGERENCIAS.filter(s => !categorias.some(c => c.nombre === s.toUpperCase()));
  const nombresActuales = categorias.map(c => c.nombre);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ══ PANEL IZQUIERDO — gestión de categorías ══ */}
      <div style={{
        width: 320, flexShrink: 0, borderRight: '1px solid var(--border-sub)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'var(--bg-app)',
      }}>
        {/* header izq */}
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border-sub)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: `${c}1F`, border: `1px solid ${c}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={15} color={c} />
            </div>
            <div>
              <div style={{ color: 'var(--text-pri)', fontWeight: 700, fontSize: 14 }}>Equipos y Categorías</div>
              <div style={{ color: 'var(--text-mut)', fontSize: 11 }}>{categorias.length} categoría{categorias.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>

        {/* lista de categorías */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px' }}>
          {categorias.length === 0 && (
            <div style={{
              padding: '20px 14px', borderRadius: 12, textAlign: 'center',
              background: 'var(--bg-card)', border: '1px dashed var(--border-sub)',
              color: 'var(--text-mut)', fontSize: 13,
            }}>
              Sin categorías — agrega la primera abajo
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {categorias.map((cat, catIdx) => {
              const estaExpandida = expandida === catIdx;
              const tieneSubEquipos = cat.equipos.length > 1 || (cat.equipos.length === 1 && cat.equipos[0] !== cat.nombre);
              const editando = editandoCat === catIdx;

              return (
                <div key={catIdx} style={{ borderRadius: 11, border: `1px solid ${c}33`, overflow: 'hidden' }}>
                  {/* fila categoría */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 10px', background: `${c}12`,
                  }}>
                    <button
                      onClick={() => setExpandida(estaExpandida ? null : catIdx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: c, display: 'flex', padding: 2, flexShrink: 0 }}
                    >
                      {estaExpandida ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>

                    {editando ? (
                      <input
                        autoFocus
                        value={editNombre}
                        onChange={e => setEditNombre(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') guardarEditCategoria(catIdx); if (e.key === 'Escape') setEditandoCat(null); }}
                        style={{ flex: 1, background: 'var(--bg-app)', border: `1px solid ${c}50`, borderRadius: 6, color: 'var(--text-pri)', fontSize: 12, fontWeight: 700, padding: '2px 6px', outline: 'none' }}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          const eq = tieneSubEquipos ? null : cat.equipos[0];
                          setSeleccion({ categoria: cat.nombre, equipo: eq });
                          setShowAsignar(false);
                        }}
                        style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: c, fontSize: 12, fontWeight: 700, padding: 0 }}
                      >
                        {cat.nombre}
                      </button>
                    )}

                    <Badge n={conteoPor[cat.nombre] || (cat.equipos.reduce((s, e) => s + (conteoPor[e] || 0), 0)) || 0} active={false} color={c} />

                    {editando ? (
                      <button onClick={() => guardarEditCategoria(catIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22C55E', padding: 2, display: 'flex' }}>
                        <Check size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => { setEditandoCat(catIdx); setEditNombre(cat.nombre); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mut)', padding: 2, display: 'flex' }}
                        onMouseEnter={e => e.currentTarget.style.color = c}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-mut)'}
                      >
                        <Pencil size={12} />
                      </button>
                    )}

                    <button
                      onClick={() => eliminarCategoria(catIdx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mut)', padding: 2, display: 'flex' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-mut)'}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* sub-equipos expandidos */}
                  {estaExpandida && (
                    <div style={{ padding: '10px 12px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {cat.equipos.map((eq, eqIdx) => {
                          const activo = seleccion?.equipo === eq && seleccion?.categoria === cat.nombre;
                          return (
                            <button
                              key={eqIdx}
                              onClick={() => { setSeleccion({ categoria: cat.nombre, equipo: eq }); setShowAsignar(false); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '3px 8px 3px 10px', borderRadius: 16,
                                background: activo ? `${c}20` : 'var(--bg-surface)',
                                border: `1px solid ${activo ? c + '50' : 'var(--border-sub)'}`,
                                color: activo ? c : 'var(--text-sec)', fontSize: 11, cursor: 'pointer',
                                fontWeight: activo ? 700 : 400,
                              }}
                            >
                              {eq}
                              <Badge n={conteoPor[eq] || 0} active={activo} color={c} />
                              {cat.equipos.length > 1 && (
                                <span
                                  onClick={ev => { ev.stopPropagation(); eliminarEquipo(catIdx, eqIdx); }}
                                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-mut)', marginLeft: 2 }}
                                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-mut)'}
                                >
                                  <X size={10} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* añadir sub-equipo */}
                      <div style={{ display: 'flex', gap: 5 }}>
                        <input
                          type="text"
                          placeholder={`Ej: ${cat.nombre} A`}
                          value={nuevoEq}
                          onChange={e => setNuevoEq(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && agregarEquipo(catIdx)}
                          style={{ flex: 1, padding: '5px 8px', borderRadius: 7, background: 'var(--bg-app)', border: '1px solid var(--border-sub)', color: 'var(--text-pri)', fontSize: 11, outline: 'none' }}
                        />
                        <button
                          onClick={() => agregarEquipo(catIdx)}
                          disabled={!nuevoEq.trim()}
                          style={{
                            padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                            background: nuevoEq.trim() ? `${c}1F` : 'var(--bg-app)',
                            border: `1px solid ${nuevoEq.trim() ? c + '40' : 'var(--border-sub)'}`,
                            color: nuevoEq.trim() ? c : 'var(--text-mut)',
                            cursor: nuevoEq.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap',
                          }}
                        >
                          <Plus size={11} /> Sub-equipo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* sin equipo */}
            {sinEquipoCount > 0 && (
              <button
                onClick={() => { setSeleccion('__sin__'); setShowAsignar(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 11,
                  background: seleccion === '__sin__' ? 'rgba(245,158,11,0.12)' : 'var(--bg-card)',
                  border: `1px solid ${seleccion === '__sin__' ? 'rgba(245,158,11,0.4)' : 'var(--border-sub)'}`,
                  color: seleccion === '__sin__' ? '#F59E0B' : 'var(--text-sec)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'left',
                }}
              >
                <UserX size={13} />
                <span style={{ flex: 1 }}>Sin equipo asignado</span>
                <Badge n={sinEquipoCount} active={seleccion === '__sin__'} color="#F59E0B" />
              </button>
            )}
          </div>

          {/* agregar categoría */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-mut)' }}>
              Nueva categoría
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="Sub-15, Mayores…"
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarCategoria(nueva)}
                style={{ flex: 1, padding: '7px 10px', borderRadius: 9, background: 'var(--bg-card)', border: '1px solid var(--border-sub)', color: 'var(--text-pri)', fontSize: 12, outline: 'none' }}
              />
              <button
                onClick={() => agregarCategoria(nueva)}
                disabled={!nueva.trim()}
                style={{
                  padding: '7px 12px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                  background: nueva.trim() ? `${c}1F` : 'var(--bg-card)',
                  border: `1px solid ${nueva.trim() ? c + '40' : 'var(--border-sub)'}`,
                  color: nueva.trim() ? c : 'var(--text-mut)',
                  cursor: nueva.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                }}
              >
                {guardando
                  ? <Loader2 size={13} className="animate-spin" />
                  : guardado
                    ? <Check size={13} />
                    : <Plus size={13} />}
              </button>
            </div>

            {/* sugerencias */}
            {disponibles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {disponibles.map(s => (
                  <button
                    key={s}
                    onClick={() => agregarCategoria(s)}
                    style={{
                      padding: '3px 9px', borderRadius: 16, fontSize: 11,
                      background: 'var(--bg-card)', border: '1px solid var(--border-sub)',
                      color: 'var(--text-mut)', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c + '50'; e.currentTarget.style.color = c; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-sub)'; e.currentTarget.style.color = 'var(--text-mut)'; }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ PANEL DERECHO — jugadores del equipo seleccionado ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-app)' }}>
        {!seleccion ? (
          /* empty state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-mut)' }}>
            <Shield size={40} strokeWidth={1.2} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 4 }}>Selecciona un equipo</div>
              <div style={{ fontSize: 13 }}>Elige una categoría o equipo de la izquierda<br />para ver y gestionar sus jugadores.</div>
            </div>
          </div>
        ) : (
          <>
            {/* header panel derecho */}
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border-sub)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {seleccion === '__sin__'
                    ? <UserX size={16} color="#F59E0B" />
                    : <Tag size={15} color={c} />}
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-pri)' }}>
                    {seleccion === '__sin__'
                      ? 'Sin equipo asignado'
                      : seleccion.equipo && seleccion.equipo !== seleccion.categoria
                        ? `${seleccion.categoria} · ${seleccion.equipo}`
                        : seleccion.categoria}
                  </span>
                  <Badge
                    n={seleccion === '__sin__' ? sinEquipoCount : jugadoresEnEquipo.length}
                    active
                    color={seleccion === '__sin__' ? '#F59E0B' : c}
                  />
                </div>
                <div style={{ color: 'var(--text-mut)', fontSize: 12, marginTop: 2 }}>
                  {seleccion === '__sin__'
                    ? 'Jugadores sin categoría ni equipo'
                    : 'Jugadores asignados a este equipo'}
                </div>
              </div>

              {seleccion !== '__sin__' && (
                <button
                  onClick={() => { setShowAsignar(s => !s); setBusqueda(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 10,
                    background: showAsignar ? `${c}1F` : 'var(--bg-card)',
                    border: `1px solid ${showAsignar ? c + '50' : 'var(--border-sub)'}`,
                    color: showAsignar ? c : 'var(--text-sec)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}
                >
                  <UserPlus size={14} />
                  Asignar jugador
                </button>
              )}
            </div>

            {/* buscador para asignar */}
            {showAsignar && seleccion !== '__sin__' && (
              <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-sub)', background: 'var(--bg-card)', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-mut)', marginBottom: 8 }}>
                  Agregar jugador a este equipo
                </div>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-mut)' }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar por nombre o cédula…"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 9, background: 'var(--bg-app)', border: '1px solid var(--border-sub)', color: 'var(--text-pri)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {jugadoresDisponibles.length === 0 && (
                    <div style={{ color: 'var(--text-mut)', fontSize: 13, padding: '8px 0' }}>
                      {busqueda ? 'Sin resultados' : 'Todos los jugadores ya están en este equipo'}
                    </div>
                  )}
                  {jugadoresDisponibles.slice(0, 30).map(j => (
                    <button
                      key={j.cedula}
                      onClick={() => asignarJugador(j)}
                      disabled={asignando}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 12px', borderRadius: 9,
                        background: 'var(--bg-app)', border: '1px solid var(--border-sub)',
                        color: 'var(--text-pri)', cursor: asignando ? 'wait' : 'pointer',
                        textAlign: 'left', transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => { if (!asignando) e.currentTarget.style.borderColor = c + '50'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-sub)'; }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', flexShrink: 0 }}>
                        {(j.nombre?.[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.nombre} {j.apellidos}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-mut)' }}>
                          {j.cedula}
                          {j.categoria && <span style={{ color: '#F59E0B', marginLeft: 6 }}>· {j.categoria}{j.equipo ? ` / ${j.equipo}` : ''}</span>}
                        </div>
                      </div>
                      <Plus size={14} color={c} style={{ flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* lista de jugadores */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {loadingJ ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-mut)', fontSize: 13 }}>
                  <Loader2 size={15} className="animate-spin" /> Cargando…
                </div>
              ) : seleccion === '__sin__' ? (
                jugadoresSinEquipo.length === 0 ? (
                  <div style={{ color: 'var(--text-mut)', fontSize: 13 }}>Todos los jugadores tienen equipo asignado.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {jugadoresSinEquipo.map(j => (
                      <div key={j.cedula} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 14px', borderRadius: 10,
                        background: 'var(--bg-card)', border: '1px solid var(--border-sub)',
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#F59E0B', flexShrink: 0 }}>
                          {(j.nombre?.[0] || '?').toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'var(--text-pri)', fontSize: 13, fontWeight: 600 }}>{j.nombre} {j.apellidos}</div>
                          <div style={{ color: 'var(--text-mut)', fontSize: 11 }}>{j.cedula}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : jugadoresEnEquipo.length === 0 ? (
                <div style={{ color: 'var(--text-mut)', fontSize: 13 }}>
                  Este equipo no tiene jugadores aún. Usa "Asignar jugador" para agregar.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {jugadoresEnEquipo.map(j => (
                    <PlayerRow
                      key={j.cedula}
                      jugador={j}
                      onRemove={quitarJugador}
                      removing={removingId === j.cedula}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
