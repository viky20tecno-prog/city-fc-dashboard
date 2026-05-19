import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Edit2, Trash2,
  X, Loader2, MapPin, Clock, CalendarDays, List,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';
import { useRole } from '../hooks/useRole';

// ── Constantes ───────────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_CORTOS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const TIPOS = {
  PARTIDO:       { label: 'Partido',       color: 'var(--cc)',  bg: 'var(--cc12)'  },
  ENTRENAMIENTO: { label: 'Entrenamiento', color: '#3B82F6',    bg: '#3B82F620'    },
  EVENTO:        { label: 'Evento',        color: '#F59E0B',    bg: '#F59E0B20'    },
};

const INPUT = 'w-full bg-[var(--bg-surface)] border border-[var(--cc20)] focus:border-[var(--cc)] text-[var(--text-pri)] placeholder-[var(--text-mut)] rounded-lg px-3 py-2.5 text-sm outline-none transition-colors';

const FORM_EMPTY = { tipo: 'ENTRENAMIENTO', titulo: '', fecha_inicio: '', fecha_fin: '', lugar: '', descripcion: '', equipo: '' };

// ── EventCard — scope de módulo para identidad estable entre renders ──────────

function EventCard({ ev, compact = false, onEdit, onDelete, deleting }) {
  const t = TIPOS[ev.tipo] || TIPOS.EVENTO;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border border-[var(--cc20)] bg-[var(--bg-surface)] ${compact ? 'py-2' : ''}`}>
      <div className="shrink-0 mt-0.5">
        <span style={{ background: t.bg, color: t.color }}
          className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold">{t.label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-pri)] truncate">{ev.titulo}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          <span className="flex items-center gap-1 text-xs text-[var(--text-sec)]">
            <Clock size={11} /> {formatTime(ev.fecha_inicio)}
            {ev.fecha_fin ? ` – ${formatTime(ev.fecha_fin)}` : ''}
          </span>
          {ev.lugar && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-sec)]">
              <MapPin size={11} /> {ev.lugar}
            </span>
          )}
        </div>
        {ev.descripcion && !compact && (
          <p className="text-xs text-[var(--text-mut)] mt-1 line-clamp-2">{ev.descripcion}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(ev)}
          className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-[var(--cc)] hover:bg-[var(--cc12)] transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={() => onDelete(ev.id)} disabled={deleting === ev.id}
          className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
          {deleting === ev.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Utilidades ───────────────────────────────────────────────────────────────

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
  const d = new Date(ts);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateLong(dateStr) {
  // '2026-05-20' → 'Martes 20 de mayo'
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dia = dt.toLocaleDateString('es-CO', { weekday: 'long' });
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${d} de ${MESES[m - 1].toLowerCase()}`;
}

function getCalendarCells(year, month) {
  const firstDow  = new Date(year, month, 1).getDay();          // 0=Dom
  const padStart  = (firstDow + 6) % 7;                         // Mon=0
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const daysInPrev= new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < padStart; i++) {
    cells.push({ day: daysInPrev - padStart + 1 + i, current: false,
                 date: new Date(year, month - 1, daysInPrev - padStart + 1 + i) });
  }
  for (let d = 1; d <= daysInMon; d++) {
    cells.push({ day: d, current: true, date: new Date(year, month, d) });
  }
  const trailing = 42 - cells.length;
  for (let i = 1; i <= trailing; i++) {
    cells.push({ day: i, current: false, date: new Date(year, month + 1, i) });
  }
  return cells;
}

function localDatetimeValue(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Calendario({ color, clubId }) {
  const { isAdmin } = useRole();
  const today       = new Date();
  const todayStr    = localDateStr(today);

  const [view,         setView]         = useState('mes');
  const [year,         setYear]         = useState(today.getFullYear());
  const [month,        setMonth]        = useState(today.getMonth());
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr);  // 'YYYY-MM-DD'
  const [showForm,     setShowForm]     = useState(false);
  const [editEvent,    setEditEvent]    = useState(null);
  const [form,         setForm]         = useState(FORM_EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/calendario?club_id=${clubId}`);
      const data = await res.json();
      setEvents(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [clubId]);

  // ── Agrupaciones ──────────────────────────────────────────────────────────

  // Map: 'YYYY-MM-DD' → [event, ...]
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      const key = toDateStr(ev.fecha_inicio);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  // Agenda: events from today onwards
  const agendaEvents = useMemo(() => {
    return events
      .filter(ev => toDateStr(ev.fecha_inicio) >= todayStr)
      .reduce((acc, ev) => {
        const key = toDateStr(ev.fecha_inicio);
        if (!acc[key]) acc[key] = [];
        acc[key].push(ev);
        return acc;
      }, {});
  }, [events]);

  const agendaDates = useMemo(() => Object.keys(agendaEvents).sort(), [agendaEvents]);

  // ── Navegación mes ─────────────────────────────────────────────────────────

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // ── Formulario ─────────────────────────────────────────────────────────────

  const openCreate = (dateStr = null) => {
    const fecha = dateStr ? `${dateStr}T08:00` : '';
    setForm({ ...FORM_EMPTY, fecha_inicio: fecha });
    setEditEvent(null);
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setForm({
      tipo:        ev.tipo         || 'ENTRENAMIENTO',
      titulo:      ev.titulo       || '',
      fecha_inicio:localDatetimeValue(ev.fecha_inicio),
      fecha_fin:   localDatetimeValue(ev.fecha_fin),
      lugar:       ev.lugar        || '',
      descripcion: ev.descripcion  || '',
      equipo:      ev.equipo       || '',
    });
    setEditEvent(ev);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditEvent(null); setForm(FORM_EMPTY); };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.fecha_inicio) return;
    setSaving(true);
    try {
      const body = {
        tipo:        form.tipo,
        titulo:      form.titulo.trim(),
        descripcion: form.descripcion || null,
        fecha_inicio:new Date(form.fecha_inicio).toISOString(),
        fecha_fin:   form.fecha_fin ? new Date(form.fecha_fin).toISOString() : null,
        lugar:       form.lugar  || null,
        equipo:      form.equipo || null,
      };
      const url    = editEvent
        ? `${API_BASE_URL}/calendario/${editEvent.id}?club_id=${clubId}`
        : `${API_BASE_URL}/calendario?club_id=${clubId}`;
      const method = editEvent ? 'PATCH' : 'POST';
      const res    = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!data.success) throw new Error(data.error);
      await fetchEvents();
      closeForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    setDeleting(id);
    try {
      await authFetch(`${API_BASE_URL}/calendario/${id}?club_id=${clubId}`, { method: 'DELETE' });
      await fetchEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  // ── Render: vista mes ──────────────────────────────────────────────────────

  const cells       = getCalendarCells(year, month);
  const dayEvents   = eventsByDay[selectedDate] || [];

  const MonthView = () => (
    <div className="flex flex-col gap-4">
      {/* Navegación */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-[var(--cc12)] transition-colors text-[var(--text-sec)] hover:text-[var(--cc)]">
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-base font-bold text-[var(--text-pri)]">
          {MESES[month]} {year}
        </h3>
        <button onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-[var(--cc12)] transition-colors text-[var(--text-sec)] hover:text-[var(--cc)]">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-[var(--cc20)] overflow-hidden">
        {/* Cabecera días */}
        <div className="grid grid-cols-7 bg-[var(--bg-surface)]">
          {DIAS_CORTOS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-[var(--text-sec)] py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const ds         = localDateStr(cell.date);
            const isToday    = ds === todayStr;
            const isSelected = ds === selectedDate;
            const evs        = eventsByDay[ds] || [];
            const dotsToShow = evs.slice(0, 3);
            const extra      = evs.length - 3;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(ds)}
                className={`
                  min-h-[56px] p-1.5 border-t border-[var(--cc20)] flex flex-col items-center gap-1 transition-all
                  ${!cell.current ? 'opacity-30' : ''}
                  ${isSelected ? 'bg-[var(--cc12)]' : 'hover:bg-[var(--bg-surface)]'}
                `}
              >
                <span className={`
                  w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium transition-all
                  ${isToday    ? 'text-white font-bold'           : 'text-[var(--text-pri)]'}
                  ${isSelected && !isToday ? 'ring-1 ring-[var(--cc)] text-[var(--cc)]' : ''}
                `}
                  style={isToday ? { background: color } : {}}
                >
                  {cell.day}
                </span>
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {dotsToShow.map(ev => {
                    const t = TIPOS[ev.tipo] || TIPOS.EVENTO;
                    return <span key={ev.id} style={{ background: t.color }}
                      className="w-1.5 h-1.5 rounded-full" />;
                  })}
                  {extra > 0 && (
                    <span className="text-[8px] text-[var(--text-mut)] leading-none">+{extra}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel del día seleccionado */}
      <div className="rounded-xl border border-[var(--cc20)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--cc20)]">
          <p className="text-sm font-semibold text-[var(--text-pri)]">
            {formatDateLong(selectedDate)}
          </p>
          <button
            onClick={() => openCreate(selectedDate)}
            style={{ background: color }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-80"
          >
            <Plus size={13} /> Agregar
          </button>
        </div>
        <div className="p-3 space-y-2">
          {dayEvents.length === 0 ? (
            <p className="text-center text-[var(--text-sec)] text-sm py-4">
              Sin eventos este día
            </p>
          ) : (
            dayEvents.map(ev => <EventCard key={ev.id} ev={ev} compact onEdit={openEdit} onDelete={handleDelete} deleting={deleting} />)
          )}
        </div>
      </div>
    </div>
  );

  // ── Render: vista agenda ───────────────────────────────────────────────────

  const AgendaView = () => (
    <div className="space-y-5">
      {agendaDates.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-sec)]">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay eventos próximos</p>
        </div>
      ) : (
        agendaDates.map(ds => {
          const isToday = ds === todayStr;
          const isTmw   = ds === localDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
          const label   = isToday ? 'Hoy' : isTmw ? 'Mañana' : formatDateLong(ds);
          return (
            <div key={ds}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? '' : 'text-[var(--text-sec)]'}`}
                  style={isToday ? { color } : {}}>{label}</span>
                <div className="flex-1 h-px bg-[var(--cc20)]" />
              </div>
              <div className="space-y-2">
                {agendaEvents[ds].map(ev => <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={handleDelete} deleting={deleting} />)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ── Render: modal formulario ───────────────────────────────────────────────

  const EventForm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cc20)]">
          <h2 className="text-[var(--text-pri)] font-bold">
            {editEvent ? 'Editar evento' : 'Nuevo evento'}
          </h2>
          <button onClick={closeForm} className="text-[var(--text-sec)] hover:text-[var(--text-pri)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-xs text-[var(--text-sec)] mb-1.5">Tipo</label>
            <div className="flex gap-2">
              {Object.entries(TIPOS).map(([key, t]) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, tipo: key }))}
                  style={form.tipo === key ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all
                    ${form.tipo === key ? 'border-current' : 'border-[var(--cc20)] text-[var(--text-sec)]'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs text-[var(--text-sec)] mb-1">Título *</label>
            <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Entrenamiento táctico ofensivo" className={INPUT} />
          </div>

          {/* Fecha inicio / fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-sec)] mb-1">Inicio *</label>
              <input type="datetime-local" value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-sec)] mb-1">Fin (opcional)</label>
              <input type="datetime-local" value={form.fecha_fin}
                onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} className={INPUT} />
            </div>
          </div>

          {/* Lugar */}
          <div>
            <label className="block text-xs text-[var(--text-sec)] mb-1">Lugar</label>
            <input type="text" value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))}
              placeholder="Ej: Campo principal, Estadio…" className={INPUT} />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs text-[var(--text-sec)] mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Detalles adicionales…" rows={2}
              className={INPUT + ' resize-none'} />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={handleSave} disabled={saving || !form.titulo || !form.fecha_inicio}
            style={{ background: color }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-opacity hover:opacity-85">
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? 'Guardando…' : editEvent ? 'Guardar cambios' : 'Crear evento'}
          </button>
          <button onClick={closeForm}
            className="px-5 py-3 rounded-xl border border-[var(--cc20)] text-[var(--text-sec)] text-sm font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render principal ───────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-pri)]">Calendario</h1>
          <p className="text-xs text-[var(--text-sec)] mt-0.5">Partidos, entrenamientos y eventos del club</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vista */}
          <div className="flex bg-[var(--bg-surface)] border border-[var(--cc20)] rounded-lg p-0.5">
            {[{ id: 'mes', Icon: CalendarDays }, { id: 'agenda', Icon: List }].map(({ id, Icon }) => (
              <button key={id} onClick={() => setView(id)}
                style={view === id ? { background: color, color: '#fff' } : {}}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                  ${view === id ? '' : 'text-[var(--text-sec)] hover:text-[var(--text-pri)]'}`}>
                <Icon size={13} />
                {id === 'mes' ? 'Mes' : 'Agenda'}
              </button>
            ))}
          </div>
          {/* Botón nuevo evento */}
          <button onClick={() => openCreate(view === 'mes' ? selectedDate : null)}
            style={{ background: color }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-85">
            <Plus size={15} /> Evento
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-[var(--text-sec)]">
            <Loader2 size={18} className="animate-spin" style={{ color }} />
            <span className="text-sm">Cargando eventos…</span>
          </div>
        ) : view === 'mes' ? (
          MonthView()
        ) : (
          AgendaView()
        )}
      </div>

      {showForm && EventForm()}
    </div>
  );
}
