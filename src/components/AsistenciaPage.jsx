import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle,
  Loader2, Users, Plus, ClipboardList, X, Clock,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';

// ── Utilidades ────────────────────────────────────────────────────────────────

const pad2 = n => String(n).padStart(2, '0');

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return localDateStr(dt);
}

const MESES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
];
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIAS_CORTO  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function formatLabel(dateStr) {
  const hoy    = localDateStr();
  const ayer   = addDays(hoy, -1);
  const manana = addDays(hoy, 1);
  if (dateStr === hoy)    return 'Hoy';
  if (dateStr === ayer)   return 'Ayer';
  if (dateStr === manana) return 'Mañana';
  const [, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(dateStr.replace(/-/g, '/'));
  return `${DIAS_CORTO[dt.getDay()]} ${d} ${MESES_CORTO[m - 1]}`;
}

function formatFechaLarga(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt  = new Date(y, m - 1, d);
  const dia = dt.toLocaleDateString('es-CO', { weekday: 'long' });
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${d} de ${MESES[m - 1]}`;
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function horaActualRedondeada() {
  const now = new Date();
  const h   = now.getMinutes() >= 30 ? (now.getHours() + 1) % 24 : now.getHours();
  return `${pad2(h)}:00`;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const ESTADOS = {
  PRESENTE:    { label: 'Presente',    color: '#22C55E', bg: '#22C55E20', Icon: CheckCircle2 },
  AUSENTE:     { label: 'Ausente',     color: '#EF4444', bg: '#EF444420', Icon: XCircle      },
  JUSTIFICADO: { label: 'Justificado', color: '#F59E0B', bg: '#F59E0B20', Icon: AlertCircle  },
  PENDIENTE:   { label: 'Pendiente',   color: 'var(--text-mut)', bg: 'transparent', Icon: null },
};

const BOTONESESTADO = [
  { key: 'PRESENTE',    Icon: CheckCircle2, activeColor: '#22C55E' },
  { key: 'AUSENTE',     Icon: XCircle,      activeColor: '#EF4444' },
  { key: 'JUSTIFICADO', Icon: AlertCircle,  activeColor: '#F59E0B' },
];

const INPUT = 'w-full bg-[var(--bg-surface)] border border-[var(--cc20)] focus:border-[var(--cc)] text-[var(--text-pri)] placeholder-[var(--text-mut)] rounded-lg px-3 py-2 text-sm outline-none transition-colors';

// ── Componente ────────────────────────────────────────────────────────────────

export default function AsistenciaPage({ color = '#E14924', jugadores = [] }) {
  const clubId = getClubId();

  const [fecha,        setFecha]        = useState(localDateStr);
  const [eventos,      setEventos]      = useState([]);
  const [loadingEv,    setLoadingEv]    = useState(false);
  const [eventoActivo, setEventoActivo] = useState(null);
  const [players,      setPlayers]      = useState([]);
  const [loadingAs,    setLoadingAs]    = useState(false);
  const [saving,       setSaving]       = useState({});
  const [search,       setSearch]       = useState('');
  const [showCrear,    setShowCrear]    = useState(false);
  const [crearHora,    setCrearHora]    = useState(horaActualRedondeada);
  const [crearEquipo,  setCrearEquipo]  = useState('');
  const [creando,      setCreando]      = useState(false);

  // Equipos/categorías únicos de los jugadores activos para el selector
  const equiposDisponibles = useMemo(() => {
    const set = new Set();
    jugadores.forEach(j => {
      if (j.activo !== false) {
        (j.categorias || []).forEach(cat => { if (cat) set.add(cat); });
      }
    });
    return Array.from(set).sort();
  }, [jugadores]);

  // Recargar eventos al cambiar fecha
  useEffect(() => {
    setEventoActivo(null);
    setPlayers([]);
    setSearch('');
    cargarEventos(fecha);
  }, [fecha]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cargarEventos(f) {
    setLoadingEv(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/calendario?club_id=${clubId}&desde=${f}&hasta=${f}T23:59:59`);
      const data = await res.json();
      const evs  = (data.data || []).filter(e => e.tipo === 'ENTRENAMIENTO');
      setEventos(evs);
    } catch {
      setEventos([]);
    } finally {
      setLoadingEv(false);
    }
  }

  async function seleccionarEvento(ev) {
    setEventoActivo(ev);
    setSearch('');
    setLoadingAs(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/asistencia/${ev.id}?club_id=${clubId}`);
      const data = await res.json();
      setPlayers(data.data || []);
    } catch {
      setPlayers([]);
    } finally {
      setLoadingAs(false);
    }
  }

  async function markAsistencia(cedula, estado) {
    const estadoPrev = players.find(p => p.cedula === cedula)?.estado;
    setPlayers(ps => ps.map(p => p.cedula === cedula ? { ...p, estado } : p));
    setSaving(s => ({ ...s, [cedula]: true }));
    try {
      await authFetch(
        `${API_BASE_URL}/asistencia/${eventoActivo.id}/${cedula}?club_id=${clubId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado }),
        }
      );
    } catch {
      setPlayers(ps => ps.map(p => p.cedula === cedula ? { ...p, estado: estadoPrev } : p));
    } finally {
      setSaving(s => { const n = { ...s }; delete n[cedula]; return n; });
    }
  }

  async function crearEntrenamiento() {
    setCreando(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/calendario?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo:        'ENTRENAMIENTO',
          titulo:      `Entrenamiento ${formatLabel(fecha)}`,
          fecha_inicio: new Date(`${fecha}T${crearHora}`).toISOString(),
          equipo:      crearEquipo || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setShowCrear(false);
        await cargarEventos(fecha);
        await seleccionarEvento(data.data);
      }
    } finally {
      setCreando(false);
    }
  }

  function volverAEventos() {
    setEventoActivo(null);
    setPlayers([]);
    setSearch('');
  }

  // Stats calculadas en tiempo real
  const stats = useMemo(() => {
    const s = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0, PENDIENTE: 0 };
    players.forEach(p => { s[p.estado] = (s[p.estado] || 0) + 1; });
    return s;
  }, [players]);

  const filtered = useMemo(() => {
    if (!search.trim()) return players;
    const q = search.toLowerCase();
    return players.filter(p =>
      `${p.nombre || ''} ${p.apellidos || ''}`.toLowerCase().includes(q) ||
      String(p.cedula || '').includes(q)
    );
  }, [players, search]);

  const label    = formatLabel(fecha);
  const esNombrado = ['Hoy', 'Ayer', 'Mañana'].includes(label);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-app)' }}>

      {/* Navegador de fecha */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--cc20)',
        background: 'var(--bg-card)',
      }}>
        <button
          onClick={() => setFecha(f => addDays(f, -1))}
          style={{
            padding: '8px', borderRadius: '10px',
            border: '1px solid var(--cc20)', background: 'var(--bg-surface)',
            color: 'var(--text-sec)', cursor: 'pointer', display: 'flex',
            transition: 'opacity 0.15s',
          }}>
          <ChevronLeft size={18} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pri)', lineHeight: 1.2 }}>{label}</p>
          {esNombrado && (
            <p style={{ fontSize: '11px', color: 'var(--text-mut)', marginTop: '2px' }}>
              {formatFechaLarga(fecha)}
            </p>
          )}
          {!esNombrado && (
            <p style={{ fontSize: '11px', color: 'var(--text-mut)', marginTop: '2px' }}>
              {formatFechaLarga(fecha).split(' de ')[1] ? formatFechaLarga(fecha) : ''}
            </p>
          )}
        </div>

        <button
          onClick={() => setFecha(f => addDays(f, 1))}
          style={{
            padding: '8px', borderRadius: '10px',
            border: '1px solid var(--cc20)', background: 'var(--bg-surface)',
            color: 'var(--text-sec)', cursor: 'pointer', display: 'flex',
            transition: 'opacity 0.15s',
          }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Sin evento activo: lista de entrenamientos ─────────────────────── */}
      {!eventoActivo && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loadingEv ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '8px', color: 'var(--text-sec)' }}>
              <Loader2 size={20} style={{ color, animation: 'spin 1s linear infinite' }} className="animate-spin" />
              <span style={{ fontSize: '14px' }}>Cargando entrenamientos…</span>
            </div>
          ) : eventos.length > 0 ? (
            <>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-mut)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 2px' }}>
                Entrenamientos del día
              </p>
              {eventos.map(ev => (
                <button key={ev.id} onClick={() => seleccionarEvento(ev)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px', borderRadius: '16px',
                    border: '1px solid var(--cc20)', background: 'var(--bg-card)',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                >
                  <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '99px', background: '#3B82F6', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.titulo}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '2px' }}>
                      {formatTime(ev.fecha_inicio)}{ev.equipo ? ` · ${ev.equipo}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-mut)', flexShrink: 0 }} />
                </button>
              ))}

              {/* Crear otro entrenamiento (cuando ya hay eventos) */}
              <button
                onClick={() => { setCrearHora(horaActualRedondeada()); setCrearEquipo(''); setShowCrear(true); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '12px',
                  border: '1px dashed var(--cc20)', background: 'transparent',
                  color: 'var(--text-sec)', cursor: 'pointer', fontSize: '13px',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cc20)'; e.currentTarget.style.color = 'var(--text-sec)'; }}
              >
                <Plus size={15} />
                Crear otro entrenamiento
              </button>
            </>
          ) : (
            /* Estado vacío */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '16px', textAlign: 'center', padding: '60px 24px 24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}1F` }}>
                <ClipboardList size={28} style={{ color }} />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pri)' }}>Sin entrenamientos</p>
                <p style={{ fontSize: '13px', color: 'var(--text-sec)', marginTop: '4px', lineHeight: 1.5 }}>
                  No hay entrenamientos registrados para {label.toLowerCase()}.
                </p>
              </div>
              <button
                onClick={() => { setCrearHora(horaActualRedondeada()); setCrearEquipo(''); setShowCrear(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', borderRadius: '12px',
                  background: color, color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <Plus size={16} />
                Crear entrenamiento y pasar lista
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Con evento activo: lista de jugadores ─────────────────────────── */}
      {eventoActivo && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

          {/* Header del evento */}
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 16px', borderBottom: '1px solid var(--cc20)', background: 'var(--bg-card)',
          }}>
            <button onClick={volverAEventos}
              style={{
                padding: '6px', borderRadius: '8px', border: 'none',
                background: 'var(--bg-surface)', color: 'var(--text-sec)',
                cursor: 'pointer', display: 'flex', flexShrink: 0,
              }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {eventoActivo.titulo}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-sec)', marginTop: '1px' }}>
                {formatTime(eventoActivo.fecha_inicio)}{eventoActivo.equipo ? ` · ${eventoActivo.equipo}` : ''}
              </p>
            </div>
          </div>

          {/* Stats bar */}
          {!loadingAs && players.length > 0 && (
            <div style={{
              flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px', padding: '10px 16px', borderBottom: '1px solid var(--cc20)',
              background: 'var(--bg-card)',
            }}>
              {[
                { key: 'PRESENTE',    label: 'Presentes',  color: '#22C55E' },
                { key: 'AUSENTE',     label: 'Ausentes',   color: '#EF4444' },
                { key: 'JUSTIFICADO', label: 'Justific.',  color: '#F59E0B' },
                { key: 'PENDIENTE',   label: 'Pendientes', color: 'var(--text-mut)' },
              ].map(({ key, label: lb, color: sc }) => (
                <div key={key} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: sc, lineHeight: 1 }}>{stats[key] || 0}</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-mut)', marginTop: '3px' }}>{lb}</p>
                </div>
              ))}
            </div>
          )}

          {/* Buscador */}
          {!loadingAs && players.length > 6 && (
            <div style={{ flexShrink: 0, padding: '10px 16px', borderBottom: '1px solid var(--cc20)', background: 'var(--bg-card)' }}>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jugador…" className={INPUT}
              />
            </div>
          )}

          {/* Lista de jugadores — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingAs ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '8px', color: 'var(--text-sec)' }}>
                <Loader2 size={20} style={{ color }} className="animate-spin" />
                <span style={{ fontSize: '14px' }}>Cargando jugadores…</span>
              </div>
            ) : players.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.2, color: 'var(--text-sec)' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-sec)' }}>No hay jugadores activos</p>
              </div>
            ) : filtered.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-sec)', paddingTop: '40px' }}>
                Sin resultados para "{search}"
              </p>
            ) : (
              filtered.map(p => {
                const est   = ESTADOS[p.estado] || ESTADOS.PENDIENTE;
                const isSav = saving[p.cedula];
                const subInfo = p.equipo || p.categoria || '';
                return (
                  <div key={p.cedula}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '14px',
                      border: '1px solid var(--cc20)',
                      background: p.estado !== 'PENDIENTE' ? est.bg : 'var(--bg-surface)',
                      minHeight: '60px', transition: 'background 0.15s',
                    }}>

                    {/* Avatar */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700, flexShrink: 0,
                      background: est.bg || `${color}1F`,
                      color: est.color !== 'var(--text-mut)' ? est.color : color,
                    }}>
                      {(p.nombre?.[0] || '?').toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                        {p.nombre} {p.apellidos}
                      </p>
                      {subInfo && (
                        <p style={{ fontSize: '11px', color: 'var(--text-sec)', marginTop: '2px' }}>{subInfo}</p>
                      )}
                    </div>

                    {/* Botones estado */}
                    {isSav ? (
                      <Loader2 size={18} style={{ color, flexShrink: 0 }} className="animate-spin" />
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {BOTONESESTADO.map(({ key, Icon, activeColor }) => {
                          const activo = p.estado === key;
                          return (
                            <button key={key} onClick={() => markAsistencia(p.cedula, key)}
                              title={ESTADOS[key].label}
                              style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid',
                                borderColor: activo ? activeColor : 'var(--cc20)',
                                background:  activo ? activeColor : 'var(--bg-card)',
                                color:       activo ? '#fff'       : 'var(--text-mut)',
                                cursor: 'pointer', transition: 'all 0.12s',
                              }}>
                              <Icon size={16} strokeWidth={1.8} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Crear entrenamiento al vuelo ──────────────────────────── */}
      {showCrear && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--cc20)',
            borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '440px',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
          }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--cc20)' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pri)' }}>Crear entrenamiento</p>
              <button onClick={() => setShowCrear(false)}
                style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'var(--bg-surface)', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-sec)' }}>{formatFechaLarga(fecha)}</p>

              {/* Hora */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-sec)', marginBottom: '6px' }}>
                  Hora
                </label>
                <div style={{ position: 'relative' }}>
                  <Clock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-mut)', pointerEvents: 'none' }} />
                  <input type="time" value={crearHora} onChange={e => setCrearHora(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                    className={INPUT} />
                </div>
              </div>

              {/* Equipo */}
              {equiposDisponibles.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-sec)', marginBottom: '6px' }}>
                    Equipo / Categoría <span style={{ fontWeight: 400, color: 'var(--text-mut)' }}>(opcional)</span>
                  </label>
                  <select value={crearEquipo} onChange={e => setCrearEquipo(e.target.value)} className={INPUT}
                    style={{ appearance: 'auto' }}>
                    <option value="">Todos los jugadores activos</option>
                    {equiposDisponibles.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                </div>
              )}

              <button onClick={crearEntrenamiento} disabled={creando}
                style={{
                  width: '100%', padding: '13px', borderRadius: '12px',
                  background: color, color: '#fff', border: 'none',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: creando ? 0.65 : 1, transition: 'opacity 0.15s',
                }}>
                {creando ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creando…
                  </>
                ) : 'Crear y pasar lista'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
