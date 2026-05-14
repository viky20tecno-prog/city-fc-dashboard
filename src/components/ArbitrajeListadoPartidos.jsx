import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Eye, RefreshCw, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';

const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const fmtFecha = (fecha) => {
  if (!fecha) return '-';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
};

const INPUT_CLS = 'w-full bg-[var(--bg-surface)] border border-[var(--cc20)] focus:border-[var(--cc)] text-[var(--text-pri)] placeholder-[var(--text-mut)] rounded-lg px-3 py-2 text-sm outline-none transition-colors';
const DATE_CLS  = INPUT_CLS + ' [color-scheme:dark]';

function EditForm({ partido, clubId, onSaved, onCancel }) {
  const [form, setForm] = useState({
    titulo:  partido.titulo  || '',
    fecha:   partido.fecha   || '',
    hora:    partido.hora    || '',
    equipoA: partido.equipoA || '',
    equipoB: partido.equipoB || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/arbitrage/partidos/${partido.id}?club_id=${clubId}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al guardar');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-[var(--cc20)]">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Título</label>
        <input type="text" value={form.titulo} onChange={set('titulo')} className={INPUT_CLS} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Fecha</label>
          <input type="date" value={form.fecha} onChange={set('fecha')} className={DATE_CLS} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Hora</label>
          <input type="time" value={form.hora} onChange={set('hora')} className={DATE_CLS} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Equipo A</label>
          <input type="text" value={form.equipoA} onChange={set('equipoA')} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Equipo B</label>
          <input type="text" value={form.equipoB} onChange={set('equipoB')} className={INPUT_CLS} />
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--cc)] text-white text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Guardar
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--cc20)] text-[var(--text-sec)] text-sm font-semibold transition-colors"
        >
          <X size={14} />
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function ArbitrajeListadoPartidos({ clubId, onViewPagos }) {
  const [partidos,    setPartidos]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [editandoId,  setEditandoId]  = useState(null);
  const [borrandoId,  setBorrandoId]  = useState(null);
  const [confirmId,   setConfirmId]   = useState(null);

  const fetchPartidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/arbitrage/partidos?club_id=${clubId}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setPartidos(data.data || []);
    } catch (err) {
      setError('No se pudieron cargar los partidos. Verifica la conexión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartidos(); }, [clubId]);

  const handleDelete = async (id) => {
    setBorrandoId(id);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/arbitrage/partidos/${id}?club_id=${clubId}`,
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al eliminar');
      setConfirmId(null);
      fetchPartidos();
    } catch (err) {
      console.error(err);
    } finally {
      setBorrandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-[var(--cc)] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Cargando partidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchPartidos}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-800/50 hover:bg-red-700/50 text-red-300 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  if (partidos.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-xl p-12 text-center">
        <div className="text-5xl mb-4">🏟️</div>
        <h3 className="text-white font-semibold text-lg mb-2">Aún no hay partidos registrados</h3>
        <p className="text-gray-400 text-sm mb-4">
          Los partidos de arbitraje se crean manualmente por el administrador del club.
        </p>
        <div className="inline-flex items-center gap-2 bg-[var(--cc)]/10 border border-[var(--cc)]/20 rounded-lg px-4 py-2">
          <span className="text-[var(--cc)] text-sm font-medium">
            👆 Usa la pestaña <strong>Registrar Partido</strong> para crear el primero
          </span>
        </div>
        <p className="text-gray-500 text-xs mt-4">
          Cada partido registrado permite gestionar los pagos de arbitraje de forma independiente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contador y refresh */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">
          {partidos.length} partido{partidos.length !== 1 ? 's' : ''} registrado{partidos.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={fetchPartidos}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[#152945] text-gray-300 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* Cards */}
      <div className="grid gap-3">
        {partidos.map((partido) => (
          <div
            key={partido.id}
            className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-xl p-5 transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-base truncate mb-2">
                  {partido.titulo}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-green-500" />
                    {fmtFecha(partido.fecha)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-green-500" />
                    {partido.hora || '-'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={13} className="text-green-500" />
                    {partido.equipoA}
                    <span className="text-gray-600 mx-1">vs</span>
                    {partido.equipoB}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right mr-1">
                  <p className="text-xs text-gray-500 mb-0.5">Monto total</p>
                  <p className="text-[var(--cc)] font-bold">{fmt(partido.montoTotal)}</p>
                </div>

                {/* Editar */}
                <button
                  onClick={() => { setEditandoId(editandoId === partido.id ? null : partido.id); setConfirmId(null); }}
                  title="Editar partido"
                  className={`p-2 rounded-lg transition-colors ${editandoId === partido.id ? 'bg-[var(--cc)]/20 text-[var(--cc)]' : 'bg-[var(--bg-surface)] text-gray-400 hover:text-[var(--cc)]'}`}
                >
                  <Pencil size={14} />
                </button>

                {/* Borrar */}
                <button
                  onClick={() => { setConfirmId(confirmId === partido.id ? null : partido.id); setEditandoId(null); }}
                  title="Eliminar partido"
                  className={`p-2 rounded-lg transition-colors ${confirmId === partido.id ? 'bg-red-500/20 text-red-400' : 'bg-[var(--bg-surface)] text-gray-400 hover:text-red-400'}`}
                >
                  <Trash2 size={14} />
                </button>

                <button
                  onClick={() => onViewPagos(partido.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--cc)] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Eye size={14} />
                  Ver pagos
                </button>
              </div>

            </div>

            {/* Confirmación borrar */}
            {confirmId === partido.id && (
              <div className="mt-4 pt-3 border-t border-red-500/20 flex items-center justify-between gap-3">
                <p className="text-sm text-red-300">
                  ¿Eliminar <strong>{partido.titulo}</strong> y todos sus pagos?
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(partido.id)}
                    disabled={borrandoId === partido.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    {borrandoId === partido.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Eliminar
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] text-gray-400 text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Form editar inline */}
            {editandoId === partido.id && (
              <EditForm
                partido={partido}
                clubId={clubId}
                onSaved={() => { setEditandoId(null); fetchPartidos(); }}
                onCancel={() => setEditandoId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
