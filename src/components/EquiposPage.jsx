import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Shield, Plus, X, ChevronRight, ChevronDown, UserX,
  Pencil, Check, Loader2, Search, UserPlus, Tag, Minus, Download,
} from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import { API_BASE_URL } from '../config';
import { normalizarCategorias } from '../lib/categorias';
import { hexToRgb, loadLogoDataUrl, drawPdfHeader, drawPdfFooter, drawPdfTableHead } from '../lib/pdfHelpers';

const SUGERENCIAS = ['Benjamín', 'Infantil', 'Pre-juvenil', 'Juvenil', 'Sub-17', 'Sub-20', 'Mayores', 'Veteranos', 'Femenino'];

function Badge({ n, active, color }) {
  return (
    <span style={{
      padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: active ? `${color}30` : 'rgba(255,255,255,0.07)',
      color: active ? color : 'var(--text-mut)',
    }}>{n}</span>
  );
}

function Checkbox({ checked, onChange, color }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(); }}
      style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
        border: `2px solid ${checked ? color : 'var(--border-sub)'}`,
        background: checked ? color : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {checked && <Check size={11} color="#fff" strokeWidth={3} />}
    </button>
  );
}

export default function EquiposPage({ color = '#00AAFF', clubConfig, onConfigSaved }) {
  const clubId = getClubId();
  const c = color;
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  /* ── categorías ── */
  const [categorias,  setCategorias]  = useState(() => normalizarCategorias(clubConfig?.categorias_jugadores || []));
  const [guardando,   setGuardando]   = useState(false);
  const [guardado,    setGuardado]    = useState(false);
  const [nueva,       setNueva]       = useState('');
  const [expandida,   setExpandida]   = useState(null);
  const [nuevoEq,     setNuevoEq]     = useState('');
  const [editandoCat, setEditandoCat] = useState(null);
  const [editNombre,  setEditNombre]  = useState('');

  /* ── panel derecho ── */
  const [seleccion,   setSeleccion]   = useState(null);
  const [jugadores,   setJugadores]   = useState([]);
  const [loadingJ,    setLoadingJ]    = useState(false);
  const [busqueda,    setBusqueda]    = useState('');
  const [showAsignar, setShowAsignar] = useState(false);

  /* multi-select asignar */
  const [selAdd,      setSelAdd]      = useState(new Set()); // cédulas a agregar
  const [guardandoAs, setGuardandoAs] = useState(false);

  /* multi-select quitar */
  const [selRemove,   setSelRemove]   = useState(new Set()); // cédulas a quitar
  const [guardandoRm, setGuardandoRm] = useState(false);

  useEffect(() => {
    setCategorias(normalizarCategorias(clubConfig?.categorias_jugadores || []));
  }, [clubConfig]);

  /* reset selección al cambiar equipo */
  useEffect(() => {
    setSelAdd(new Set());
    setSelRemove(new Set());
    setBusqueda('');
    setShowAsignar(false);
  }, [seleccion]);

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

  const jugadoresEnEquipo = useMemo(() => {
    if (!seleccion || seleccion === '__sin__') return [];
    return jugadores
      .filter(j => {
        if (seleccion.equipo) return j.equipo === seleccion.equipo && j.categoria === seleccion.categoria;
        return j.categoria === seleccion.categoria && !j.equipo;
      })
      .sort((a, b) => `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`, 'es'));
  }, [jugadores, seleccion]);

  const jugadoresSinEquipo = useMemo(() =>
    jugadores.filter(j => !j.categoria && !j.equipo), [jugadores]);

  const jugadoresDisponibles = useMemo(() => {
    const enEquipoCedulas = new Set(jugadoresEnEquipo.map(j => j.cedula));
    const pool = jugadores.filter(j => !enEquipoCedulas.has(j.cedula));
    const q = busqueda.toLowerCase();
    if (!q) return pool;
    return pool.filter(j =>
      `${j.nombre} ${j.apellidos}`.toLowerCase().includes(q) || j.cedula?.includes(q)
    );
  }, [jugadores, jugadoresEnEquipo, busqueda]);

  const conteoPor = useMemo(() => {
    const map = {};
    jugadores.forEach(j => {
      const key = j.equipo || j.categoria || '__sin__';
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [jugadores]);

  const sinEquipoCount = useMemo(() =>
    jugadores.filter(j => !j.equipo && !j.categoria).length, [jugadores]);

  /* ── guardar config ── */
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
    if (!t || categorias.some(cat => cat.nombre === t)) return;
    const nuevas = [...categorias, { nombre: t, equipos: [t] }];
    setCategorias(nuevas); setNueva(''); guardarConfig(nuevas);
  };

  const eliminarCategoria = (idx) => {
    const nuevas = categorias.filter((_, i) => i !== idx);
    setCategorias(nuevas);
    if (seleccion?.categoria === categorias[idx].nombre) setSeleccion(null);
    guardarConfig(nuevas);
  };

  const guardarEditCategoria = (idx) => {
    const t = editNombre.trim().toUpperCase();
    if (!t || (t !== categorias[idx].nombre && categorias.some(cat => cat.nombre === t))) return;
    const nuevas = categorias.map((cat, i) =>
      i === idx ? { ...cat, nombre: t, equipos: cat.equipos.map(e => e === cat.nombre ? t : e) } : cat
    );
    setCategorias(nuevas); setEditandoCat(null); guardarConfig(nuevas);
  };

  const agregarEquipo = (catIdx) => {
    const t = nuevoEq.trim().toUpperCase();
    if (!t) return;
    const cat = categorias[catIdx];
    if (cat.equipos.includes(t)) return;
    const nuevas = categorias.map((cat, i) => i === catIdx ? { ...cat, equipos: [...cat.equipos, t] } : cat);
    setCategorias(nuevas); setNuevoEq(''); guardarConfig(nuevas);
  };

  const eliminarEquipo = (catIdx, eqIdx) => {
    const nuevas = categorias.map((cat, i) => {
      if (i !== catIdx) return cat;
      const eqs = cat.equipos.filter((_, j) => j !== eqIdx);
      return { ...cat, equipos: eqs.length ? eqs : cat.equipos };
    });
    setCategorias(nuevas); guardarConfig(nuevas);
  };

  /* ── asignar múltiples ── */
  const confirmarAsignar = async () => {
    if (!seleccion || selAdd.size === 0) return;
    setGuardandoAs(true);
    try {
      const body = {
        categoria:  seleccion.categoria,
        equipo:     seleccion.equipo || '',
        categorias: [{ categoria: seleccion.categoria, equipo: seleccion.equipo || '' }],
      };
      await Promise.all([...selAdd].map(cedula =>
        authFetch(`${API_BASE_URL}/players/${cedula}?club_id=${clubId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ));
      setSelAdd(new Set());
      setShowAsignar(false);
      await cargarJugadores();
    } catch (e) { alert('Error al asignar: ' + e.message); }
    finally { setGuardandoAs(false); }
  };

  /* ── quitar múltiples ── */
  const confirmarQuitar = async () => {
    if (selRemove.size === 0) return;
    setGuardandoRm(true);
    try {
      await Promise.all([...selRemove].map(cedula =>
        authFetch(`${API_BASE_URL}/players/${cedula}?club_id=${clubId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoria: null, equipo: null, categorias: [] }),
        })
      ));
      setSelRemove(new Set());
      await cargarJugadores();
    } catch (e) { alert('Error al quitar: ' + e.message); }
    finally { setGuardandoRm(false); }
  };

  const toggleAdd    = (cedula) => setSelAdd(s    => { const n = new Set(s); n.has(cedula) ? n.delete(cedula) : n.add(cedula); return n; });
  const toggleRemove = (cedula) => setSelRemove(s => { const n = new Set(s); n.has(cedula) ? n.delete(cedula) : n.add(cedula); return n; });

  const seleccionarTodosDisponibles = () => {
    if (selAdd.size === jugadoresDisponibles.length) setSelAdd(new Set());
    else setSelAdd(new Set(jugadoresDisponibles.map(j => j.cedula)));
  };

  const seleccionarTodosEnEquipo = () => {
    if (selRemove.size === jugadoresEnEquipo.length) setSelRemove(new Set());
    else setSelRemove(new Set(jugadoresEnEquipo.map(j => j.cedula)));
  };

  const disponiblesSugerencias = SUGERENCIAS.filter(s => !categorias.some(cat => cat.nombre === s.toUpperCase()));

  /* ── exportar PDF ── */
  const [exportando, setExportando] = useState(false);

  const exportarPDF = async () => {
    if (seleccion === '__sin__' || !seleccion) return;
    const lista = jugadoresEnEquipo;
    if (!lista.length) return;

    setExportando(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210; const H = 297; const M = 12;
      const accentRgb = hexToRgb(color);
      const clubName  = clubConfig?.nombre || 'Mi Club';
      const titulo    = seleccion.equipo && seleccion.equipo !== seleccion.categoria
        ? `${seleccion.categoria} · ${seleccion.equipo}`
        : seleccion.categoria;
      const fecha     = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
      const logoData  = await loadLogoDataUrl(clubConfig?.logo_url);

      const cols = [
        { label: '#',          x: M },
        { label: 'Nombre',     x: M + 10 },
        { label: 'Cédula',     x: M + 82 },
        { label: 'Celular',    x: M + 112 },
        { label: 'Posición',   x: M + 142 },
        { label: 'Camiseta',   x: M + 168 },
      ];

      const drawPageHeader = () => {
        const y0 = drawPdfHeader(doc, { W, M, clubName, title: titulo, date: `${fecha} · ${lista.length} jugadores`, logoData, accentRgb });
        return drawPdfTableHead(doc, { W, M, y: y0, columns: cols, accentRgb });
      };

      let y = drawPageHeader();

      lista.forEach((j, i) => {
        if (y > H - 20) { doc.addPage(); y = drawPageHeader(); }
        if (i % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(M - 2, y - 4, W - M * 2 + 4, 8, 'F'); }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 40, 50);
        doc.text(String(i + 1),                                      cols[0].x, y);
        doc.text(`${j.nombre || ''} ${j.apellidos || ''}`.toUpperCase().slice(0, 35), cols[1].x, y);
        doc.text(String(j.cedula || ''),                             cols[2].x, y);
        doc.text(String(j.celular || ''),                            cols[3].x, y);
        doc.text((j.posicion || '—').toUpperCase().slice(0, 14),      cols[4].x, y);
        doc.text(String(j.numero_camiseta || '—'),                   cols[5].x, y);
        y += 8;
      });

      const pages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        drawPdfFooter(doc, { W, H, M, clubName, pageNum: p, totalPages: pages, note: `${lista.length} jugadores` });
      }

      const slug = titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      doc.save(`equipo-${slug}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) { alert('Error al exportar: ' + e.message); }
    finally { setExportando(false); }
  };

  // En mobile: mostrar solo izquierda (lista) o derecha (detalle), nunca ambas
  const showLeft  = !isMobile || !seleccion;
  const showRight = !isMobile || !!seleccion;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>

      {/* ══ PANEL IZQUIERDO ══ */}
      <div style={{
        width: isMobile ? '100%' : 300,
        flexShrink: 0,
        borderRight: isMobile ? 'none' : '1px solid var(--border-sub)',
        borderBottom: isMobile && showLeft ? '1px solid var(--border-sub)' : 'none',
        display: showLeft ? 'flex' : 'none',
        flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-app)',
      }}>
        <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--border-sub)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c}1F`, border: `1px solid ${c}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={15} color={c} />
            </div>
            <div>
              <div style={{ color: 'var(--text-pri)', fontWeight: 700, fontSize: 14 }}>Equipos y Categorías</div>
              <div style={{ color: 'var(--text-mut)', fontSize: 11 }}>{categorias.length} categoría{categorias.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
          {categorias.length === 0 && (
            <div style={{ padding: '18px', borderRadius: 12, textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border-sub)', color: 'var(--text-mut)', fontSize: 13 }}>
              Sin categorías — agrega la primera abajo
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {categorias.map((cat, catIdx) => {
              const estaExpandida = expandida === catIdx;
              const tieneSubEquipos = cat.equipos.length > 1 || (cat.equipos.length === 1 && cat.equipos[0] !== cat.nombre);
              const editando = editandoCat === catIdx;
              const totalCat = cat.equipos.reduce((s, e) => s + (conteoPor[e] || 0), 0) || conteoPor[cat.nombre] || 0;

              return (
                <div key={catIdx} style={{ borderRadius: 11, border: `1px solid ${c}33`, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 9px', background: `${c}12` }}>
                    <button onClick={() => setExpandida(estaExpandida ? null : catIdx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: c, display: 'flex', padding: 2, flexShrink: 0 }}>
                      {estaExpandida ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>

                    {editando ? (
                      <input autoFocus value={editNombre} onChange={e => setEditNombre(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') guardarEditCategoria(catIdx); if (e.key === 'Escape') setEditandoCat(null); }}
                        style={{ flex: 1, background: 'var(--bg-app)', border: `1px solid ${c}50`, borderRadius: 6, color: 'var(--text-pri)', fontSize: 12, fontWeight: 700, padding: '2px 6px', outline: 'none' }} />
                    ) : (
                      <button onClick={() => { setSeleccion({ categoria: cat.nombre, equipo: tieneSubEquipos ? null : cat.equipos[0] }); }}
                        style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: c, fontSize: 12, fontWeight: 700, padding: 0 }}>
                        {cat.nombre}
                      </button>
                    )}

                    <Badge n={totalCat} active={false} color={c} />

                    {editando
                      ? <button onClick={() => guardarEditCategoria(catIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22C55E', padding: 2, display: 'flex' }}><Check size={13} /></button>
                      : <button onClick={() => { setEditandoCat(catIdx); setEditNombre(cat.nombre); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mut)', padding: 2, display: 'flex' }}
                          onMouseEnter={e => e.currentTarget.style.color = c}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-mut)'}><Pencil size={12} /></button>}

                    <button onClick={() => eliminarCategoria(catIdx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mut)', padding: 2, display: 'flex' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-mut)'}><X size={13} /></button>
                  </div>

                  {estaExpandida && (
                    <div style={{ padding: '9px 11px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {cat.equipos.map((eq, eqIdx) => {
                          const activo = seleccion?.equipo === eq && seleccion?.categoria === cat.nombre;
                          return (
                            <button key={eqIdx} onClick={() => setSeleccion({ categoria: cat.nombre, equipo: eq })}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 10px', borderRadius: 16,
                                background: activo ? `${c}20` : 'var(--bg-surface)', border: `1px solid ${activo ? c + '50' : 'var(--border-sub)'}`,
                                color: activo ? c : 'var(--text-sec)', fontSize: 11, cursor: 'pointer', fontWeight: activo ? 700 : 400 }}>
                              {eq}
                              <Badge n={conteoPor[eq] || 0} active={activo} color={c} />
                              {cat.equipos.length > 1 && (
                                <span onClick={ev => { ev.stopPropagation(); eliminarEquipo(catIdx, eqIdx); }}
                                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-mut)', marginLeft: 1 }}
                                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-mut)'}><X size={10} /></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <input type="text" placeholder={`Ej: ${cat.nombre} A`} value={nuevoEq}
                          onChange={e => setNuevoEq(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarEquipo(catIdx)}
                          style={{ flex: 1, padding: '5px 8px', borderRadius: 7, background: 'var(--bg-app)', border: '1px solid var(--border-sub)', color: 'var(--text-pri)', fontSize: 11, outline: 'none' }} />
                        <button onClick={() => agregarEquipo(catIdx)} disabled={!nuevoEq.trim()}
                          style={{ padding: '5px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                            background: nuevoEq.trim() ? `${c}1F` : 'var(--bg-app)', border: `1px solid ${nuevoEq.trim() ? c + '40' : 'var(--border-sub)'}`,
                            color: nuevoEq.trim() ? c : 'var(--text-mut)', cursor: nuevoEq.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Plus size={11} /> Sub-equipo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {sinEquipoCount > 0 && (
              <button onClick={() => setSeleccion('__sin__')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 11,
                  background: seleccion === '__sin__' ? 'rgba(245,158,11,0.12)' : 'var(--bg-card)',
                  border: `1px solid ${seleccion === '__sin__' ? 'rgba(245,158,11,0.4)' : 'var(--border-sub)'}`,
                  color: seleccion === '__sin__' ? '#F59E0B' : 'var(--text-sec)', cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'left' }}>
                <UserX size={13} />
                <span style={{ flex: 1 }}>Sin equipo asignado</span>
                <Badge n={sinEquipoCount} active={seleccion === '__sin__'} color="#F59E0B" />
              </button>
            )}
          </div>

          {/* agregar categoría */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-mut)' }}>
              Nueva categoría
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="text" placeholder="Sub-15, Mayores…" value={nueva}
                onChange={e => setNueva(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarCategoria(nueva)}
                style={{ flex: 1, padding: '7px 10px', borderRadius: 9, background: 'var(--bg-card)', border: '1px solid var(--border-sub)', color: 'var(--text-pri)', fontSize: 12, outline: 'none' }} />
              <button onClick={() => agregarCategoria(nueva)} disabled={!nueva.trim()}
                style={{ padding: '7px 11px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                  background: nueva.trim() ? `${c}1F` : 'var(--bg-card)', border: `1px solid ${nueva.trim() ? c + '40' : 'var(--border-sub)'}`,
                  color: nueva.trim() ? c : 'var(--text-mut)', cursor: nueva.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 4 }}>
                {guardando ? <Loader2 size={13} className="animate-spin" /> : guardado ? <Check size={13} /> : <Plus size={13} />}
              </button>
            </div>
            {disponiblesSugerencias.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {disponiblesSugerencias.map(s => (
                  <button key={s} onClick={() => agregarCategoria(s)}
                    style={{ padding: '3px 9px', borderRadius: 16, fontSize: 11, background: 'var(--bg-card)', border: '1px solid var(--border-sub)', color: 'var(--text-mut)', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c + '50'; e.currentTarget.style.color = c; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-sub)'; e.currentTarget.style.color = 'var(--text-mut)'; }}>
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ PANEL DERECHO ══ */}
      <div style={{ flex: 1, display: showRight ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-app)' }}>
        {!seleccion ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-mut)' }}>
            <Shield size={40} strokeWidth={1.2} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 4 }}>Selecciona un equipo</div>
              <div style={{ fontSize: 13 }}>Elige una categoría o equipo de la izquierda<br />para gestionar sus jugadores.</div>
            </div>
          </div>
        ) : (
          <>
            {/* header */}
            <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid var(--border-sub)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              {isMobile && (
                <button onClick={() => setSeleccion(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 10, padding: '6px 10px', borderRadius: 8,
                    background: 'var(--bg-card)', border: '1px solid var(--border-sub)',
                    color: 'var(--text-sec)', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                  ← Volver
                </button>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {seleccion === '__sin__' ? <UserX size={16} color="#F59E0B" /> : <Tag size={15} color={c} />}
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-pri)' }}>
                    {seleccion === '__sin__' ? 'Sin equipo asignado'
                      : seleccion.equipo && seleccion.equipo !== seleccion.categoria
                        ? `${seleccion.categoria} · ${seleccion.equipo}`
                        : seleccion.categoria}
                  </span>
                  <Badge
                    n={seleccion === '__sin__' ? sinEquipoCount : jugadoresEnEquipo.length}
                    active color={seleccion === '__sin__' ? '#F59E0B' : c}
                  />
                </div>
                <div style={{ color: 'var(--text-mut)', fontSize: 12, marginTop: 2 }}>
                  {seleccion === '__sin__' ? 'Jugadores sin categoría ni equipo' : 'Jugadores asignados a este equipo'}
                </div>
              </div>

              {seleccion !== '__sin__' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {jugadoresEnEquipo.length > 0 && (
                    <button onClick={exportarPDF} disabled={exportando}
                      title="Exportar lista a PDF"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                        background: 'var(--bg-card)', border: '1px solid var(--border-sub)',
                        color: 'var(--text-sec)', cursor: exportando ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600, opacity: exportando ? 0.7 : 1 }}>
                      {exportando ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      PDF
                    </button>
                  )}
                  <button onClick={() => setShowAsignar(s => !s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
                      background: showAsignar ? `${c}1F` : 'var(--bg-card)', border: `1px solid ${showAsignar ? c + '50' : 'var(--border-sub)'}`,
                      color: showAsignar ? c : 'var(--text-sec)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <UserPlus size={14} />
                    Asignar jugadores
                  </button>
                </div>
              )}
            </div>

            {/* ── panel asignar (buscador + checkboxes) ── */}
            {showAsignar && seleccion !== '__sin__' && (
              <div style={{ borderBottom: '1px solid var(--border-sub)', background: 'var(--bg-card)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                {/* barra búsqueda + seleccionar todos + confirmar */}
                <div style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-mut)' }} />
                    <input autoFocus type="text" placeholder="Buscar por nombre o cédula…" value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 9, background: 'var(--bg-app)', border: '1px solid var(--border-sub)', color: 'var(--text-pri)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  <button onClick={seleccionarTodosDisponibles}
                    style={{ padding: '7px 12px', borderRadius: 9, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
                      background: 'var(--bg-app)', border: '1px solid var(--border-sub)', color: 'var(--text-sec)' }}>
                    {selAdd.size === jugadoresDisponibles.length && jugadoresDisponibles.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>

                  <button onClick={confirmarAsignar} disabled={selAdd.size === 0 || guardandoAs}
                    style={{ padding: '7px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', cursor: selAdd.size > 0 ? 'pointer' : 'not-allowed',
                      background: selAdd.size > 0 ? c : 'var(--bg-app)', border: `1px solid ${selAdd.size > 0 ? c : 'var(--border-sub)'}`,
                      color: selAdd.size > 0 ? '#fff' : 'var(--text-mut)', display: 'flex', alignItems: 'center', gap: 6, opacity: guardandoAs ? 0.7 : 1 }}>
                    {guardandoAs ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Agregar {selAdd.size > 0 ? `(${selAdd.size})` : ''}
                  </button>
                </div>

                {/* lista disponibles */}
                <div style={{ maxHeight: 220, overflowY: 'auto', padding: '0 22px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {jugadoresDisponibles.length === 0 && (
                    <div style={{ color: 'var(--text-mut)', fontSize: 13, padding: '8px 0' }}>
                      {busqueda ? 'Sin resultados' : 'Todos los jugadores ya están en este equipo'}
                    </div>
                  )}
                  {jugadoresDisponibles.slice(0, 50).map(j => {
                    const checked = selAdd.has(j.cedula);
                    return (
                      <div key={j.cedula} onClick={() => toggleAdd(j.cedula)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 9,
                          background: checked ? `${c}0D` : 'var(--bg-app)', border: `1px solid ${checked ? c + '40' : 'var(--border-sub)'}`,
                          cursor: 'pointer', transition: 'all 0.12s' }}>
                        <Checkbox checked={checked} onChange={() => toggleAdd(j.cedula)} color={c} />
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', flexShrink: 0 }}>
                          {(j.nombre?.[0] || '?').toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-pri)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${j.nombre || ''} ${j.apellidos || ''}`.trim().toUpperCase()}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-mut)' }}>
                            {j.cedula}
                            {j.categoria && <span style={{ color: '#F59E0B', marginLeft: 6 }}>· {j.categoria}{j.equipo ? ` / ${j.equipo}` : ''}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── lista jugadores en equipo ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px' }}>
              {loadingJ ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-mut)', fontSize: 13 }}>
                  <Loader2 size={15} className="animate-spin" /> Cargando…
                </div>
              ) : seleccion === '__sin__' ? (
                jugadoresSinEquipo.length === 0
                  ? <div style={{ color: 'var(--text-mut)', fontSize: 13 }}>Todos los jugadores tienen equipo asignado.</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {jugadoresSinEquipo.map(j => (
                        <div key={j.cedula} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-sub)' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#F59E0B', flexShrink: 0 }}>
                            {(j.nombre?.[0] || '?').toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: 'var(--text-pri)', fontSize: 13, fontWeight: 600 }}>{`${j.nombre || ''} ${j.apellidos || ''}`.trim().toUpperCase()}</div>
                            <div style={{ color: 'var(--text-mut)', fontSize: 11 }}>{j.cedula}</div>
                          </div>
                        </div>
                      ))}
                    </div>
              ) : jugadoresEnEquipo.length === 0 ? (
                <div style={{ color: 'var(--text-mut)', fontSize: 13 }}>
                  Este equipo no tiene jugadores aún. Usa "Asignar jugadores" para agregar.
                </div>
              ) : (
                <>
                  {/* barra quitar múltiples */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
                    <button onClick={seleccionarTodosEnEquipo}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-sub)', color: 'var(--text-sec)', cursor: 'pointer', fontSize: 12 }}>
                      <Checkbox checked={selRemove.size === jugadoresEnEquipo.length && jugadoresEnEquipo.length > 0} onChange={seleccionarTodosEnEquipo} color="#EF4444" />
                      {selRemove.size > 0 ? `${selRemove.size} seleccionado${selRemove.size !== 1 ? 's' : ''}` : 'Seleccionar para quitar'}
                    </button>

                    {selRemove.size > 0 && (
                      <button onClick={confirmarQuitar} disabled={guardandoRm}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444', opacity: guardandoRm ? 0.7 : 1 }}>
                        {guardandoRm ? <Loader2 size={13} className="animate-spin" /> : <Minus size={13} />}
                        Quitar ({selRemove.size})
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {jugadoresEnEquipo.map(j => {
                      const checked = selRemove.has(j.cedula);
                      return (
                        <div key={j.cedula} onClick={() => toggleRemove(j.cedula)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                            background: checked ? 'rgba(239,68,68,0.06)' : 'var(--bg-card)',
                            border: `1px solid ${checked ? 'rgba(239,68,68,0.30)' : 'var(--border-sub)'}`,
                            transition: 'all 0.12s' }}>
                          <Checkbox checked={checked} onChange={() => toggleRemove(j.cedula)} color="#EF4444" />
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c}1F`, border: `1px solid ${c}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c, flexShrink: 0 }}>
                            {(j.nombre?.[0] || '?').toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: 'var(--text-pri)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${j.nombre || ''} ${j.apellidos || ''}`.trim().toUpperCase()}</div>
                            <div style={{ color: 'var(--text-mut)', fontSize: 11 }}>{j.cedula}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
