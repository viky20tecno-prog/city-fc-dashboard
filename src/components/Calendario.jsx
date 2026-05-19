import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Edit2, Trash2,
  X, Loader2, MapPin, Clock, CalendarDays, List,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';

// ── Constantes ────────────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const TIPOS = {
  PARTIDO:       { label: 'Partido',       color: 'var(--cc)',  bg: 'var(--cc12)'  },
  ENTRENAMIENTO: { label: 'Entrenamiento', color: '#3B82F6',    bg: '#3B82F620'    },
  EVENTO:        { label: 'Evento',        color: '#F59E0B',    bg: '#F59E0B20'    },
};

const FORM_EMPTY = {
  tipo: 'ENTRENAMIENTO', titulo: '',
  fecha: '', hora: '08:00',
  fecha_fin: '', hora_fin: '',
  lugar: '', descripcion: '',
};

const INPUT = 'w-full bg-[var(--bg-surface)] border border-[var(--cc20)] focus:border-[var(--cc)] text-[var(--text-pri)] placeholder-[var(--text-mut)] rounded-lg px-3 py-2 text-sm outline-none transition-colors';

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

// ── EventCard — scope de módulo para identidad estable ────────────────────────

function EventCard({ ev, onEdit, onDelete, deleting }) {
  const t = TIPOS[ev.tipo] || TIPOS.EVENTO;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--cc20)] group">
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: t.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-pri)] truncate">{ev.titulo}</p>
        <div className="flex gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-[var(--text-sec)]">
            <Clock size={10} />{formatTime(ev.fecha_inicio)}
            {ev.fecha_fin ? ` – ${formatTime(ev.fecha_fin)}` : ''}
          </span>
          {ev.lugar && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-sec)]">
              <MapPin size={10} />{ev.lugar}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function Calendario({ color, clubId }) {
  const today    = new Date();
  const todayStr = localDateStr(today);

  const [view,         setView]         = useState('mes');
  const [year,         setYear]         = useState(today.getFullYear());
  const [month,        setMonth]        = useState(today.getMonth());
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showForm,     setShowForm]     = useState(false);
  const [editEvent,    setEditEvent]    = useState(null);
  const [form,         setForm]         = useState(FORM_EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(null);

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
      fecha:       start ? localDateStr(start)                                    : '',
      hora:        start ? `${pad2(start.getHours())}:${pad2(start.getMinutes())}` : '',
      fecha_fin:   end   ? localDateStr(end)                                      : '',
      hora_fin:    end   ? `${pad2(end.getHours())}:${pad2(end.getMinutes())}`    : '',
      lugar:       ev.lugar       || '',
      descripcion: ev.descripcion || '',
    });
    setEditEvent(ev);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditEvent(null); setForm(FORM_EMPTY); };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.fecha) return;
    setSaving(true);
    try {
      const body = {
        tipo:         form.tipo,
        titulo:       form.titulo.trim(),
        descripcion:  form.descripcion || null,
        fecha_inicio: new Date(`${form.fecha}T${form.hora || '00:00'}`).toISOString(),
        fecha_fin:    form.fecha_fin
          ? new Date(`${form.fecha_fin}T${form.hora_fin || '00:00'}`).toISOString()
          : null,
        lugar: form.lugar || null,
      };
      const url    = editEvent
        ? `${API_BASE_URL}/calendario/${editEvent.id}?club_id=${clubId}`
        : `${API_BASE_URL}/calendario?club_id=${clubId}`;
      const res  = await authFetch(url, {
        method: editEvent ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
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

  const cells    = getCalendarCells(year, month);
  const dayEvs   = eventsByDay[selectedDate] || [];
  const tomorrowStr = localDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));

  // ── MonthView (función, no componente) ────────────────────────────────────

  const MonthView = () => (
    <div>
      {/* Navegación mes */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--cc20)]">
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
      <div className="grid grid-cols-7 px-4 pt-3 pb-1">
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
              style={isSelected ? { background: color, boxShadow: `0 4px 14px ${color}50` }
                    : isToday   ? { background: `${color}15`, border: `1.5px solid ${color}40` }
                                : {}}
              className={`
                min-h-[68px] rounded-xl p-2 flex flex-col gap-0.5 text-left transition-all
                ${!cell.current ? 'opacity-20 pointer-events-none' : ''}
                ${isSelected ? '' : isToday ? '' : 'border border-[var(--cc20)] hover:border-[var(--cc)] hover:bg-[var(--bg-surface)]'}
              `}
            >
              <span className="text-xs font-bold leading-none"
                style={isSelected ? { color: '#fff' }
                      : isToday   ? { color }
                                  : { color: 'var(--text-sec)' }}>
                {cell.day}
              </span>

              {visible.map(ev => {
                const t = TIPOS[ev.tipo] || TIPOS.EVENTO;
                return (
                  <span key={ev.id}
                    className="block text-[10px] font-semibold truncate leading-tight rounded-md px-1 py-0.5 mt-0.5"
                    style={isSelected
                      ? { color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.18)' }
                      : { color: t.color, background: t.bg }}>
                    {ev.titulo}
                  </span>
                );
              })}

              {extra > 0 && (
                <span className="text-[9px] font-semibold leading-tight px-1"
                  style={isSelected ? { color: 'rgba(255,255,255,0.65)' } : { color: 'var(--text-mut)' }}>
                  +{extra} más
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel día seleccionado */}
      <div className="border-t border-[var(--cc20)]">
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
              <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={handleDelete} deleting={deleting} />
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
                <div className="flex-1 h-px bg-[var(--cc20)]" />
              </div>
              <div className="space-y-2">
                {agendaEvents[ds].map(ev => (
                  <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={handleDelete} deleting={deleting} />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl w-full max-w-md shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cc20)]">
          <h2 className="text-[var(--text-pri)] font-bold">{editEvent ? 'Editar evento' : 'Nuevo evento'}</h2>
          <button onClick={closeForm} className="text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Tipo */}
          <div className="flex gap-2">
            {Object.entries(TIPOS).map(([key, t]) => (
              <button key={key} onClick={() => setForm(f => ({ ...f, tipo: key }))}
                style={form.tipo === key ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all
                  ${form.tipo === key ? '' : 'border-[var(--cc20)] text-[var(--text-mut)] hover:border-[var(--cc)]'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Título */}
          <input type="text" value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            placeholder="Título del evento *" className={INPUT} autoFocus />

          {/* Inicio */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[var(--text-sec)] uppercase tracking-wider">Inicio *</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={INPUT} />
              <input type="time" value={form.hora}
                onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} className={INPUT} />
            </div>
          </div>

          {/* Fin */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[var(--text-sec)] uppercase tracking-wider">Fin (opcional)</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.fecha_fin}
                onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} className={INPUT} />
              <input type="time" value={form.hora_fin}
                onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} className={INPUT} />
            </div>
          </div>

          {/* Lugar */}
          <input type="text" value={form.lugar}
            onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))}
            placeholder="Lugar (opcional)" className={INPUT} />

          {/* Descripción */}
          <textarea value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Descripción (opcional)" rows={2}
            className={INPUT + ' resize-none'} />
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={handleSave} disabled={saving || !form.titulo || !form.fecha}
            style={{ background: color }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40 hover:opacity-85 transition-opacity">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? 'Guardando…' : editEvent ? 'Guardar cambios' : 'Crear evento'}
          </button>
          <button onClick={closeForm}
            className="px-5 py-3 rounded-xl border border-[var(--cc20)] text-[var(--text-sec)] text-sm font-semibold hover:border-[var(--cc)] transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-app)] relative z-[1]">
      <div className="min-h-full p-6 flex flex-col items-center">

        {/* Título + controles */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-pri)]">Calendario</h1>
            <p className="text-xs text-[var(--text-sec)] mt-0.5">Partidos, entrenamientos y eventos del club</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--bg-surface)] border border-[var(--cc20)] rounded-xl p-0.5">
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
        <div className="w-full max-w-2xl bg-[var(--bg-card)] rounded-2xl border border-[var(--cc20)] shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-[var(--text-sec)]">
              <Loader2 size={18} className="animate-spin" style={{ color }} />
              <span className="text-sm">Cargando eventos…</span>
            </div>
          ) : view === 'mes' ? MonthView() : AgendaView()}
        </div>

      </div>

      {showForm && EventForm()}
    </div>
  );
}
