import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Edit2, Trash2,
  X, Loader2, MapPin, Clock, CalendarDays, List, Users,
  CheckCircle2, XCircle, AlertCircle, ChevronDown, PauseCircle, PlayCircle,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';

// ── Constantes ────────────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const TIPOS = {
  PARTIDO:       { label: 'Partido',       color: '#FCA5A5',  bg: '#DC262650'  },
  ENTRENAMIENTO: { label: 'Entrenamiento', color: '#93C5FD',  bg: '#2563EB55'  },
  EVENTO:        { label: 'Evento',        color: '#FCD34D',  bg: '#D9770650'  },
};

const ESTADOS = {
  PRESENTE:    { label: 'Presente',    color: '#22C55E', bg: '#22C55E20', Icon: CheckCircle2 },
  AUSENTE:     { label: 'Ausente',     color: '#EF4444', bg: '#EF444420', Icon: XCircle      },
  JUSTIFICADO: { label: 'Justificado', color: '#F59E0B', bg: '#F59E0B20', Icon: AlertCircle  },
  PENDIENTE:   { label: 'Pendiente',   color: 'var(--text-mut)', bg: 'transparent', Icon: null },
};

const FORM_EMPTY = {
  tipo: 'ENTRENAMIENTO', titulo: '',
  fecha: '', hora: '08:00',
  fecha_fin: '', hora_fin: '',
  lugar: '', descripcion: '', equipo: '',
  recurrencia: null,
};

function getWeeklyDates(fechaStr, hasta) {
  const d = new Date(fechaStr + 'T12:00:00');
  const fin = hasta === 'MES'
    ? new Date(d.getFullYear(), d.getMonth() + 1, 0)
    : new Date(d.getFullYear(), 11, 31);
  const fechas = [];
  const curr = new Date(d);
  curr.setDate(curr.getDate() + 7);
  while (curr <= fin) {
    fechas.push(localDateStr(curr));
    curr.setDate(curr.getDate() + 7);
  }
  return fechas;
}

const INPUT = 'w-full bg-[var(--bg-surface)] border border-[var(--cc30)] focus:border-[var(--cc)] text-[var(--text-pri)] placeholder-[var(--text-mut)] rounded-lg px-3 py-2 text-sm outline-none transition-colors';

// ── Utilidades ────────────────────────────────────────────────────────────────

const pad2 = n => String(n).padStart(2, '0');

function toDateStr(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateLong(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt  = new Date(y, m - 1, d);
  const dia = dt.toLocaleDateString('es-CO', { weekday: 'long' });
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${d} de ${MESES[m - 1].toLowerCase()}`;
}

function getCalendarCells(year, month) {
  const firstDow   = new Date(year, month, 1).getDay();
  const padStart   = (firstDow + 6) % 7;
  const daysInMon  = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < padStart; i++)
    cells.push({ day: daysInPrev - padStart + 1 + i, current: false,
                 date: new Date(year, month - 1, daysInPrev - padStart + 1 + i) });
  for (let d = 1; d <= daysInMon; d++)
    cells.push({ day: d, current: true, date: new Date(year, month, d) });
  const trailing = 42 - cells.length;
  for (let i = 1; i <= trailing; i++)
    cells.push({ day: i, current: false, date: new Date(year, month + 1, i) });
  return cells;
}

// ── TimeInput — selector de hora accesible y con tema consistente ─────────────

const HORAS    = Array.from({ length: 12 }, (_, i) => i + 1);          // 1-12
const MINUTOS  = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const SEL_BASE = 'bg-[var(--bg-surface)] border border-[var(--cc30)] text-[var(--text-pri)] rounded-lg px-2 py-2 text-sm outline-none focus:border-[var(--cc)] transition-colors cursor-pointer';

function TimeInput({ value, onChange }) {
  const [rawH, rawM] = (value || '08:00').split(':').map(Number);
  const ampm  = rawH >= 12 ? 'PM' : 'AM';
  const hour12 = rawH === 0 ? 12 : rawH > 12 ? rawH - 12 : rawH;

  function emit(h12, min, ap) {
    let h24 = h12 % 12;
    if (ap === 'PM') h24 += 12;
    onChange(`${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }

  return (
    <div className="flex gap-1.5">
      <select value={hour12} onChange={e => emit(Number(e.target.value), rawM, ampm)} className={SEL_BASE} style={{ flex: '0 0 auto', minWidth: '52px' }}>
        {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <select value={rawM} onChange={e => emit(hour12, Number(e.target.value), ampm)} className={SEL_BASE} style={{ flex: '0 0 auto', minWidth: '60px' }}>
        {MINUTOS.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
      </select>
      <select value={ampm} onChange={e => emit(hour12, rawM, e.target.value)} className={SEL_BASE} style={{ flex: '0 0 auto', minWidth: '62px' }}>
        <option value="AM">a. m.</option>
        <option value="PM">p. m.</option>
      </select>
    </div>
  );
}

// ── EventCard — scope de módulo para identidad estable ────────────────────────

function EventCard({ ev, onEdit, onDelete, onAsistencia, onToggleSuspend, deleting, suspending, cacheEntry }) {
  const t    = TIPOS[ev.tipo] || TIPOS.EVENTO;
  const susp = !!ev.suspendido;
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border group transition-colors ${
        susp
          ? 'bg-[var(--bg-surface)] border-[var(--border-sub)] opacity-60 cursor-default'
          : 'bg-[var(--bg-surface)] border-[var(--cc30)] cursor-pointer hover:border-[var(--cc)]'
      }`}
      onClick={() => !susp && onAsistencia(ev)}
    >
      <div className="w-1 self-stretch rounded-full shrink-0"
        style={{ background: susp ? 'var(--text-mut)' : t.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold truncate ${susp ? 'text-[var(--text-mut)] line-through' : 'text-[var(--text-pri)]'}`}>
            {ev.titulo}
          </p>
          {susp && (
            <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
              Suspendido
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-[var(--text-sec)]">
            <Clock size={10} />{formatTime(ev.fecha_inicio)}
            {ev.fecha_fin ? ` – ${formatTime(ev.fecha_fin)}` : ''}
          </span>
          {ev.lugar && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-sec)]">
              <MapPin size={10} />{ev.lugar}
            </span>
          )}
          {ev.equipo && (
            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: susp ? 'var(--text-mut)' : t.color }}>
              <Users size={10} />{ev.equipo}
            </span>
          )}
        </div>
        {cacheEntry && !susp && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#22C55E', background: '#22C55E20' }}>
              ✓ {cacheEntry.PRESENTE} presentes
            </span>
            {cacheEntry.PENDIENTE > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-[var(--text-mut)] bg-[var(--bg-card)] border border-[var(--cc30)]">
                {cacheEntry.PENDIENTE} pendientes
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSuspend(ev); }}
          disabled={suspending === ev.id}
          title={susp ? 'Reactivar entrenamiento' : 'Suspender entrenamiento'}
          className={`p-1.5 rounded-lg transition-colors ${
            susp
              ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20'
              : 'text-[var(--text-sec)] hover:text-yellow-400 hover:bg-yellow-500/10'
          }`}>
          {suspending === ev.id
            ? <Loader2 size={13} className="animate-spin" />
            : susp ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(ev); }}
          className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-[var(--cc)] hover:bg-[var(--cc20)] transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(ev.id); }} disabled={deleting === ev.id}
          className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
          {deleting === ev.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Calendario({ color, clubId }) {
  const today    = new Date();
  const todayStr = localDateStr(today);

  const [view,           setView]           = useState('mes');
  const [year,           setYear]           = useState(today.getFullYear());
  const [month,          setMonth]          = useState(today.getMonth());
  const [events,         setEvents]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedDate,   setSelectedDate]   = useState(todayStr);
  const [showForm,       setShowForm]       = useState(false);
  const [editEvent,      setEditEvent]      = useState(null);
  const [form,           setForm]           = useState(FORM_EMPTY);
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState(null);
  const [suspending,     setSuspending]     = useState(null);

  // Asistencia state
  const [asistEvento,    setAsistEvento]    = useState(null);
  const [asistPlayers,   setAsistPlayers]   = useState([]);
  const [asistLoading,   setAsistLoading]   = useState(false);
  const [asistSaving,    setAsistSaving]    = useState({});
  const [asistSearch,    setAsistSearch]    = useState('');
  const [asistCache,     setAsistCache]     = useState({});

  // Drawer historial por jugador
  const [jugadorDrawer,    setJugadorDrawer]    = useState(null);
  const [historialJugador, setHistorialJugador] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/calendario?club_id=${clubId}`);
      const data = await res.json();
      setEvents(data.data || []);
    } catch (e) { console.error(e); }
    finally      { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [clubId]);

  // Sync caché cuando cambian los jugadores del evento activo de asistencia
  useEffect(() => {
    if (!asistEvento || asistPlayers.length === 0) return;
    const s = { PRESENTE: 0, PENDIENTE: 0 };
    asistPlayers.forEach(p => { const k = p.estado === 'PRESENTE' ? 'PRESENTE' : 'PENDIENTE'; s[k]++; });
    setAsistCache(c => ({ ...c, [asistEvento.id]: { ...s, total: asistPlayers.length } }));
  }, [asistPlayers, asistEvento]); // eslint-disable-line react-hooks/exhaustive-deps

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      const key = toDateStr(ev.fecha_inicio);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const agendaEvents = useMemo(() => {
    return events
      .filter(ev => toDateStr(ev.fecha_inicio) >= todayStr)
      .reduce((acc, ev) => {
        const key = toDateStr(ev.fecha_inicio);
        if (!acc[key]) acc[key] = [];
        acc[key].push(ev);
        return acc;
      }, {});
  }, [events, todayStr]);

  const agendaDates = useMemo(() => Object.keys(agendaEvents).sort(), [agendaEvents]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const openCreate = (dateStr = null) => {
    setForm({ ...FORM_EMPTY, fecha: dateStr || '' });
    setEditEvent(null);
    setShowForm(true);
  };

  const openEdit = (ev) => {
    const start = ev.fecha_inicio ? new Date(ev.fecha_inicio) : null;
    const end   = ev.fecha_fin   ? new Date(ev.fecha_fin)    : null;
    setForm({
      tipo:        ev.tipo        || 'ENTRENAMIENTO',
      titulo:      ev.titulo      || '',
      fecha:       start ? localDateStr(start)                                     : '',
      hora:        start ? `${pad2(start.getHours())}:${pad2(start.getMinutes())}` : '',
      fecha_fin:   end   ? localDateStr(end)                                       : '',
      hora_fin:    end   ? `${pad2(end.getHours())}:${pad2(end.getMinutes())}`     : '',
      lugar:       ev.lugar       || '',
      descripcion: ev.descripcion || '',
      equipo:      ev.equipo      || '',
    });
    setEditEvent(ev);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditEvent(null); setForm(FORM_EMPTY); };

  const handleSave = async () => {
    if (!form.fecha) return;
    const esEntrenamiento = form.tipo === 'ENTRENAMIENTO';
    const tituloFinal = esEntrenamiento && !form.titulo.trim()
      ? 'Entrenamiento'
      : form.titulo.trim();
    if (!esEntrenamiento && !tituloFinal) return;
    setSaving(true);
    try {
      const makeBody = (fecha) => {
        const fechaFinDate = esEntrenamiento
          ? fecha
          : (form.fecha_fin || fecha);
        return {
          tipo:         form.tipo,
          titulo:       tituloFinal,
          descripcion:  form.descripcion || null,
          fecha_inicio: new Date(`${fecha}T${form.hora || '00:00'}`).toISOString(),
          fecha_fin:    form.hora_fin
            ? new Date(`${fechaFinDate}T${form.hora_fin}`).toISOString()
            : null,
          lugar:  form.lugar  || null,
          equipo: form.equipo || null,
        };
      };

      const url = editEvent
        ? `${API_BASE_URL}/calendario/${editEvent.id}?club_id=${clubId}`
        : `${API_BASE_URL}/calendario?club_id=${clubId}`;

      const method = editEvent ? 'PATCH' : 'POST';
      const res  = await authFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makeBody(form.fecha)),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (!editEvent && esEntrenamiento && form.recurrencia) {
        const extras = getWeeklyDates(form.fecha, form.recurrencia);
        await Promise.all(extras.map(f =>
          authFetch(`${API_BASE_URL}/calendario?club_id=${clubId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(makeBody(f)),
          })
        ));
      }

      await fetchEvents();
      closeForm();
    } catch (e) { console.error(e); }
    finally     { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    setDeleting(id);
    try {
      await authFetch(`${API_BASE_URL}/calendario/${id}?club_id=${clubId}`, { method: 'DELETE' });
      await fetchEvents();
    } catch (e) { console.error(e); }
    finally     { setDeleting(null); }
  };

  const handleToggleSuspend = async (ev) => {
    setSuspending(ev.id);
    try {
      await authFetch(`${API_BASE_URL}/calendario/${ev.id}?club_id=${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspendido: !ev.suspendido }),
      });
      await fetchEvents();
    } catch (e) { console.error(e); }
    finally     { setSuspending(null); }
  };

  // ── Asistencia ────────────────────────────────────────────────────────────

  const openAsistencia = async (ev) => {
    setAsistEvento(ev);
    setAsistPlayers([]);
    setAsistSearch('');
    setAsistLoading(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/asistencia/${ev.id}?club_id=${clubId}`);
      const data = await res.json();
      setAsistPlayers(data.data || []);
    } catch (e) { console.error(e); }
    finally     { setAsistLoading(false); }
  };

  const closeAsistencia = () => {
    setAsistEvento(null); setAsistPlayers([]); setAsistSaving({});
    setJugadorDrawer(null); setHistorialJugador([]);
  };

  const abrirDrawerJugador = async (p) => {
    setJugadorDrawer(p);
    setHistorialJugador([]);
    setLoadingHistorial(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/asistencia/jugador/${p.cedula}?club_id=${clubId}`);
      const data = await res.json();
      setHistorialJugador(data.data || []);
    } catch (e) { console.error(e); }
    finally     { setLoadingHistorial(false); }
  };

  const markAsistencia = async (cedula, estado) => {
    setAsistSaving(s => ({ ...s, [cedula]: true }));
    // optimistic update
    setAsistPlayers(prev =>
      prev.map(p => p.cedula === cedula ? { ...p, estado } : p)
    );
    try {
      await authFetch(`${API_BASE_URL}/asistencia/${asistEvento.id}/${cedula}?club_id=${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
    } catch (e) {
      console.error(e);
      // revert on error
      setAsistPlayers(prev =>
        prev.map(p => p.cedula === cedula ? { ...p, estado: 'PENDIENTE' } : p)
      );
    } finally {
      setAsistSaving(s => { const n = { ...s }; delete n[cedula]; return n; });
    }
  };

  const asistFiltered = useMemo(() => {
    if (!asistSearch.trim()) return asistPlayers;
    const q = asistSearch.toLowerCase();
    return asistPlayers.filter(p =>
      `${p.nombre} ${p.apellidos}`.toLowerCase().includes(q) ||
      String(p.cedula).includes(q)
    );
  }, [asistPlayers, asistSearch]);

  const asistStats = useMemo(() => {
    const presentes = asistPlayers.filter(p => p.estado === 'PRESENTE').length;
    return { PRESENTE: presentes, PENDIENTE: asistPlayers.length - presentes };
  }, [asistPlayers]);

  const pctAsistencia = useMemo(() => {
    if (!historialJugador.length) return null;
    const presentes = historialJugador.filter(h => h.estado === 'PRESENTE').length;
    if (!presentes) return null;
    return Math.round((presentes / historialJugador.length) * 100);
  }, [historialJugador]);

  const cells       = getCalendarCells(year, month);
  const dayEvs      = eventsByDay[selectedDate] || [];
  const tomorrowStr = localDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));

  // ── MonthView (función, no componente) ────────────────────────────────────

  const MonthView = () => (
    <div>
      {/* Navegación mes */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--cc30)] bg-[var(--bg-card)]">
        <button onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-sec)] hover:text-[var(--cc)] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-[var(--text-pri)]">{MESES[month]} {year}</span>
        <button onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-sec)] hover:text-[var(--cc)] transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Cabecera días */}
      <div className="grid grid-cols-7 px-4 pt-3 pb-1 bg-[var(--bg-card)]">
        {DIAS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-[var(--text-mut)] uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1.5 px-4 pb-4">
        {cells.map((cell, idx) => {
          const ds         = localDateStr(cell.date);
          const isToday    = ds === todayStr;
          const isSelected = ds === selectedDate;
          const evs        = eventsByDay[ds] || [];
          const visible    = evs.slice(0, 2);
          const extra      = evs.length - 2;

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(ds)}
              style={isSelected ? { background: color, boxShadow: `0 4px 14px ${color}70` }
                    : isToday   ? { background: `${color}38`, border: `2px solid ${color}` }
                                : {}}
              className={`
                min-h-[68px] rounded-xl p-2 flex flex-col gap-0.5 text-left transition-all
                ${!cell.current ? 'opacity-30 pointer-events-none' : ''}
                ${isSelected ? '' : isToday ? '' : 'bg-[var(--bg-surface)] border-2 border-[var(--cc30)] hover:border-[var(--cc)]'}
              `}
            >
              <span className="text-xs font-bold leading-none"
                style={isSelected ? { color: '#fff' }
                      : isToday   ? { color: '#fff' }
                                  : { color: 'var(--text-pri)' }}>
                {cell.day}
              </span>

              {visible.map(ev => {
                const t = TIPOS[ev.tipo] || TIPOS.EVENTO;
                return (
                  <span key={ev.id}
                    className="block text-[10px] font-semibold truncate leading-tight rounded-md px-1 py-0.5 mt-0.5"
                    style={isSelected
                      ? { color: '#fff', background: 'rgba(255,255,255,0.25)' }
                      : { color: t.color, background: t.bg }}>
                    {ev.titulo}
                  </span>
                );
              })}

              {extra > 0 && (
                <span className="text-[9px] font-semibold leading-tight px-1"
                  style={isSelected ? { color: 'rgba(255,255,255,0.8)' } : { color: 'var(--text-sec)' }}>
                  +{extra} más
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel día seleccionado */}
      <div className="border-t border-[var(--cc30)] bg-[var(--bg-card)]">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm font-bold text-[var(--text-pri)]">{formatDateLong(selectedDate)}</p>
          <button onClick={() => openCreate(selectedDate)}
            style={{ background: color }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-80 transition-opacity">
            <Plus size={12} /> Agregar
          </button>
        </div>
        <div className="px-5 pb-5 space-y-2">
          {dayEvs.length === 0 ? (
            <p className="text-center text-xs text-[var(--text-sec)] py-5 opacity-60">
              Sin eventos · pulsa Agregar para crear uno
            </p>
          ) : (
            dayEvs.map(ev => (
              <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={handleDelete}
                onAsistencia={openAsistencia} onToggleSuspend={handleToggleSuspend}
                deleting={deleting} suspending={suspending} cacheEntry={asistCache[ev.id]} />
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ── AgendaView ────────────────────────────────────────────────────────────

  const AgendaView = () => (
    <div className="p-5 space-y-5">
      {agendaDates.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-sec)]">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-25" />
          <p className="text-sm">No hay eventos próximos</p>
        </div>
      ) : (
        agendaDates.map(ds => {
          const isToday = ds === todayStr;
          const isTmw   = ds === tomorrowStr;
          const label   = isToday ? 'Hoy' : isTmw ? 'Mañana' : formatDateLong(ds);
          return (
            <div key={ds}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider"
                  style={isToday ? { color } : { color: 'var(--text-sec)' }}>{label}</span>
                <div className="flex-1 h-px bg-[var(--cc30)]" />
              </div>
              <div className="space-y-2">
                {agendaEvents[ds].map(ev => (
                  <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={handleDelete}
                    onAsistencia={openAsistencia} onToggleSuspend={handleToggleSuspend}
                    deleting={deleting} suspending={suspending} cacheEntry={asistCache[ev.id]} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ── EventForm ────────────────────────────────────────────────────────────

  const EventForm = () => (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--cc30)] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cc30)]">
          <h2 className="text-[var(--text-pri)] font-bold">{editEvent ? 'Editar evento' : 'Nuevo evento'}</h2>
          <button onClick={closeForm} className="text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Tipo */}
          <div className="flex gap-2">
            {Object.entries(TIPOS).map(([key, t]) => (
              <button key={key} onClick={() => setForm(f => ({ ...f, tipo: key, recurrencia: null }))}
                style={form.tipo === key ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all
                  ${form.tipo === key ? '' : 'border-[var(--cc30)] text-[var(--text-mut)] hover:border-[var(--cc)]'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Título — solo para no-entrenamiento o si ya está editando uno con título */}
          {(form.tipo !== 'ENTRENAMIENTO' || editEvent) && (
            <input type="text" value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder={form.tipo === 'ENTRENAMIENTO' ? 'Título (opcional)' : 'Título del evento *'}
              className={INPUT} autoFocus={form.tipo !== 'ENTRENAMIENTO'} />
          )}

          {/* Inicio */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[var(--text-sec)] uppercase tracking-wider">Inicio *</label>
            <div className="flex flex-col gap-2">
              <input type="date" value={form.fecha}
                onChange={e => setForm(f => ({
                  ...f, fecha: e.target.value,
                  fecha_fin: f.fecha_fin === f.fecha || !f.fecha_fin ? e.target.value : f.fecha_fin,
                }))} className={INPUT} autoFocus={form.tipo === 'ENTRENAMIENTO'} />
              <TimeInput value={form.hora} onChange={v => setForm(f => ({ ...f, hora: v }))} />
            </div>
          </div>

          {/* Fin */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[var(--text-sec)] uppercase tracking-wider">Hora fin (opcional)</label>
            <div className="flex flex-col gap-2">
              {form.tipo !== 'ENTRENAMIENTO' && (
                <input type="date" value={form.fecha_fin}
                  onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} className={INPUT} />
              )}
              <TimeInput value={form.hora_fin} onChange={v => setForm(f => ({ ...f, hora_fin: v }))} />
            </div>
          </div>

          {/* Recurrencia — solo para entrenamiento nuevo */}
          {form.tipo === 'ENTRENAMIENTO' && !editEvent && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[var(--text-sec)] uppercase tracking-wider">Repetir semanalmente</label>
              <div className="flex flex-col gap-1.5">
                {[
                  { val: null,  label: 'Sin repetición' },
                  { val: 'MES', label: 'Cada semana · resto del mes' },
                  { val: 'AÑO', label: 'Cada semana · resto del año' },
                ].map(opt => (
                  <label key={String(opt.val)} className="flex items-center gap-2.5 cursor-pointer group">
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${form.recurrencia === opt.val
                        ? 'border-[var(--cc)] bg-[var(--cc)]'
                        : 'border-[var(--border-sub)] group-hover:border-[var(--cc)]'}`}
                      onClick={() => setForm(f => ({ ...f, recurrencia: opt.val }))}>
                      {form.recurrencia === opt.val && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-sm text-[var(--text-sec)] group-hover:text-[var(--text-pri)] transition-colors"
                      onClick={() => setForm(f => ({ ...f, recurrencia: opt.val }))}>
                      {opt.label}
                      {opt.val && form.fecha && form.recurrencia === opt.val && (() => {
                        const n = getWeeklyDates(form.fecha, opt.val).length;
                        return n > 0 ? <span className="ml-1.5 text-xs font-bold text-[var(--cc)]">+{n} eventos</span> : null;
                      })()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Lugar */}
          <input type="text" value={form.lugar}
            onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))}
            placeholder="Lugar (opcional)" className={INPUT} />

          {/* Equipo */}
          <input type="text" value={form.equipo}
            onChange={e => setForm(f => ({ ...f, equipo: e.target.value }))}
            placeholder={form.tipo === 'PARTIDO' ? 'Equipo (filtra asistencia)' : 'Equipo (opcional)'}
            className={INPUT} />

          {/* Descripción */}
          <textarea value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Descripción (opcional)" rows={2}
            className={INPUT + ' resize-none'} />
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={handleSave}
            disabled={saving || (!form.fecha) || (form.tipo !== 'ENTRENAMIENTO' && !form.titulo.trim())}
            style={{ background: color }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40 hover:opacity-85 transition-opacity">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? 'Guardando…' : editEvent ? 'Guardar cambios'
              : form.recurrencia
                ? `Crear ${1 + (form.fecha ? getWeeklyDates(form.fecha, form.recurrencia).length : 0)} eventos`
                : 'Crear evento'}
          </button>
          <button onClick={closeForm}
            className="px-5 py-3 rounded-xl border border-[var(--cc30)] text-[var(--text-sec)] text-sm font-semibold hover:border-[var(--cc)] transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  // ── AsistenciaPanel ────────────────────────────────────────────────────────

  const AsistenciaPanel = () => {
    if (!asistEvento) return null;
    const t = TIPOS[asistEvento.tipo] || TIPOS.EVENTO;
    const total = asistPlayers.length;

    return (
      <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-[var(--bg-card)] border border-[var(--cc30)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[75vh]">

          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--cc30)] shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: t.bg, color: t.color }}>{t.label}</span>
                {asistEvento.equipo && (
                  <span className="text-xs font-semibold text-[var(--text-sec)]">
                    · {asistEvento.equipo}
                  </span>
                )}
              </div>
              <p className="text-base font-bold text-[var(--text-pri)] mt-1 truncate">{asistEvento.titulo}</p>
              <p className="text-xs text-[var(--text-sec)] mt-0.5">
                {formatDateLong(toDateStr(asistEvento.fecha_inicio))}
                {' · '}{formatTime(asistEvento.fecha_inicio)}
              </p>
            </div>
            <button onClick={closeAsistencia}
              className="ml-3 p-1.5 rounded-lg text-[var(--text-sec)] hover:text-[var(--text-pri)] hover:bg-[var(--bg-surface)] transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Stats */}
          {!asistLoading && total > 0 && (
            <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--cc30)] shrink-0">
              <div className="text-center flex-1">
                <p className="text-2xl font-black" style={{ color: '#22C55E' }}>{asistStats.PRESENTE}</p>
                <p className="text-[10px] text-[var(--text-mut)]">Asistieron</p>
              </div>
              <div className="w-px h-8 bg-[var(--cc30)]" />
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-[var(--text-mut)]">{asistStats.PENDIENTE}</p>
                <p className="text-[10px] text-[var(--text-mut)]">Sin marcar</p>
              </div>
              <div className="w-px h-8 bg-[var(--cc30)]" />
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-[var(--text-pri)]">{total}</p>
                <p className="text-[10px] text-[var(--text-mut)]">Total</p>
              </div>
            </div>
          )}

          {/* Search */}
          {!asistLoading && total > 4 && (
            <div className="px-5 py-3 border-b border-[var(--cc30)] shrink-0">
              <input
                type="text"
                value={asistSearch}
                onChange={e => setAsistSearch(e.target.value)}
                placeholder="Buscar jugador…"
                className={INPUT}
              />
            </div>
          )}

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {asistLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-[var(--text-sec)]">
                <Loader2 size={18} className="animate-spin" style={{ color }} />
                <span className="text-sm">Cargando jugadores…</span>
              </div>
            ) : total === 0 ? (
              <div className="text-center py-12">
                <Users size={36} className="mx-auto mb-3 opacity-20 text-[var(--text-sec)]" />
                <p className="text-sm text-[var(--text-sec)]">
                  {asistEvento.tipo === 'PARTIDO' && asistEvento.equipo
                    ? `No hay jugadores en el equipo "${asistEvento.equipo}"`
                    : 'No hay jugadores activos en el club'}
                </p>
              </div>
            ) : asistFiltered.length === 0 ? (
              <p className="text-center text-sm text-[var(--text-sec)] py-8">Sin resultados para "{asistSearch}"</p>
            ) : (
              asistFiltered.map(p => {
                const presente = p.estado === 'PRESENTE';
                const isSaving = asistSaving[p.cedula];
                return (
                  <div key={p.cedula}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                    style={{
                      background: presente ? '#22C55E12' : 'var(--bg-surface)',
                      borderColor: presente ? '#22C55E40' : 'var(--cc30)',
                    }}>

                    {/* Avatar */}
                    <button onClick={() => abrirDrawerJugador(p)}
                      title="Ver historial"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer transition-opacity hover:opacity-75"
                      style={{ background: presente ? '#22C55E20' : 'var(--cc20)', color: presente ? '#22C55E' : 'var(--cc)' }}>
                      {(p.nombre?.[0] || '?').toUpperCase()}
                    </button>

                    {/* Info */}
                    <button onClick={() => abrirDrawerJugador(p)}
                      className="flex-1 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer">
                      <p className="text-sm font-semibold text-[var(--text-pri)] truncate">
                        {`${p.nombre || ''} ${p.apellidos || ''}`.trim().toUpperCase()}
                      </p>
                      <p className="text-xs text-[var(--text-sec)]">CC {p.cedula}</p>
                    </button>

                    {/* Toggle asistencia */}
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin shrink-0" style={{ color: '#22C55E' }} />
                    ) : (
                      <button
                        onClick={() => markAsistencia(p.cedula, presente ? 'PENDIENTE' : 'PRESENTE')}
                        title={presente ? 'Quitar asistencia' : 'Marcar presente'}
                        className="shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
                        style={presente
                          ? { background: '#22C55E', borderColor: '#22C55E', color: '#fff' }
                          : { background: 'transparent', borderColor: 'var(--border-sub)', color: 'transparent' }}>
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer — botón guardar */}
          {!asistLoading && total > 0 && (
            <div className="px-5 py-3 border-t border-[var(--cc30)] shrink-0">
              <button onClick={closeAsistencia}
                style={{ background: color }}
                className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-85 transition-opacity">
                <CheckCircle2 size={15} />
                Guardar lista · {asistStats.PRESENTE} de {total} presentes
              </button>
            </div>
          )}
        </div>

        {/* ── Drawer historial jugador ── */}
        {jugadorDrawer && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setJugadorDrawer(null)} />
            <div className="relative w-full max-w-xs h-full bg-[var(--bg-card)] border-l border-[var(--cc30)] flex flex-col shadow-2xl" style={{ animation: 'slide-in-right 0.18s ease both' }}>

              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--cc30)] shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: `${color}1F`, color }}>
                  {(jugadorDrawer.nombre?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-pri)] truncate">{jugadorDrawer.nombre} {jugadorDrawer.apellidos}</p>
                  <p className="text-xs text-[var(--text-sec)]">CC {jugadorDrawer.cedula}</p>
                </div>
                <button onClick={() => setJugadorDrawer(null)}
                  className="p-1.5 rounded-lg text-[var(--text-sec)] hover:bg-[var(--bg-surface)] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* % asistencia */}
              {!loadingHistorial && pctAsistencia !== null && (
                <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--cc30)] bg-[var(--bg-surface)] shrink-0">
                  <div className="text-center">
                    <p className="text-3xl font-black leading-none"
                      style={{ color: pctAsistencia >= 75 ? '#22C55E' : pctAsistencia >= 50 ? '#F59E0B' : '#EF4444' }}>
                      {pctAsistencia}%
                    </p>
                    <p className="text-[10px] text-[var(--text-mut)] mt-1">asistencia</p>
                  </div>
                  <div className="text-xs text-[var(--text-sec)] leading-relaxed">
                    <p>{historialJugador.filter(h => h.estado === 'PRESENTE').length} presentes</p>
                    <p>{historialJugador.filter(h => h.estado === 'AUSENTE').length} ausentes</p>
                    <p>{historialJugador.filter(h => h.estado === 'JUSTIFICADO').length} justificados</p>
                  </div>
                </div>
              )}

              {/* Lista historial */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                {loadingHistorial ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-[var(--text-sec)]">
                    <Loader2 size={16} className="animate-spin" style={{ color }} />
                    <span className="text-sm">Cargando…</span>
                  </div>
                ) : historialJugador.length === 0 ? (
                  <p className="text-center text-sm text-[var(--text-sec)] pt-10">Sin registros aún</p>
                ) : (
                  historialJugador.map((h, i) => {
                    const est = ESTADOS[h.estado] || ESTADOS.PENDIENTE;
                    const cal = h.calendario || {};
                    const fev = cal.fecha_inicio ? localDateStr(new Date(cal.fecha_inicio)) : '';
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--cc30)]">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-pri)] truncate">{cal.titulo || 'Evento'}</p>
                          <p className="text-[10px] text-[var(--text-sec)] mt-0.5">{fev ? formatDateLong(fev) : ''}{cal.equipo ? ` · ${cal.equipo}` : ''}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ color: est.color, background: est.bg }}>
                          {est.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <style>{`@keyframes slide-in-right { from { transform: translateX(100%); opacity:0.5 } to { transform: translateX(0); opacity:1 } }`}</style>
          </div>
        )}
      </div>
    );
  };

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-app)]">
      <div className="min-h-full p-6 flex flex-col items-center">

        {/* Título + controles */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-pri)]">Calendario</h1>
            <p className="text-xs text-[var(--text-sec)] mt-0.5">Partidos, entrenamientos y eventos del club</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--bg-surface)] border border-[var(--cc30)] rounded-xl p-0.5">
              {[{ id: 'mes', Icon: CalendarDays, label: 'Mes' },
                { id: 'agenda', Icon: List,        label: 'Agenda' }].map(({ id, Icon, label }) => (
                <button key={id} onClick={() => setView(id)}
                  style={view === id ? { background: color, color: '#fff' } : {}}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${view === id ? '' : 'text-[var(--text-sec)] hover:text-[var(--text-pri)]'}`}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
            <button onClick={() => openCreate(view === 'mes' ? selectedDate : null)}
              style={{ background: color }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity">
              <Plus size={15} /> Evento
            </button>
          </div>
        </div>

        {/* Card principal */}
        <div className="w-full max-w-2xl bg-[var(--bg-app)] rounded-2xl border border-[var(--cc30)] shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-[var(--text-sec)]">
              <Loader2 size={18} className="animate-spin" style={{ color }} />
              <span className="text-sm">Cargando eventos…</span>
            </div>
          ) : view === 'mes' ? MonthView() : AgendaView()}
        </div>

      </div>

      {showForm && EventForm()}
      {asistEvento && AsistenciaPanel()}
    </div>
  );
}
