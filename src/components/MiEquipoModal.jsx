import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Copy, Check, UserCheck, ShieldOff, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';

const ROLE_LABELS = {
  ADMIN:      { label: 'Admin',      color: 'text-[var(--cc)] bg-[var(--cc12)] border-[var(--cc)]/20' },
  ENTRENADOR: { label: 'Entrenador', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20'         },
};

const INPUT = 'w-full bg-[var(--bg-surface)] border border-[var(--cc20)] focus:border-[var(--cc)] text-[var(--text-pri)] placeholder-[var(--text-mut)] rounded-lg px-3 py-2.5 text-sm outline-none transition-colors';

export default function MiEquipoModal({ clubId, onClose }) {
  const [members,   setMembers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [newMember, setNewMember] = useState({ email: '', nombre: '', role: 'ENTRENADOR' });
  const [created,   setCreated]   = useState(null);
  const [copied,    setCopied]    = useState(false);
  const [error,     setError]     = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/miembros?club_id=${clubId}`);
      const data = await res.json();
      setMembers(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, [clubId]);

  const handleCreate = async () => {
    setError(null);
    if (!newMember.email || !newMember.nombre) {
      return setError('Email y nombre son obligatorios');
    }
    setSaving(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/miembros?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setCreated(data);
      setNewMember({ email: '', nombre: '', role: 'ENTRENADOR' });
      setShowForm(false);
      await fetchMembers();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (member) => {
    try {
      await authFetch(`${API_BASE_URL}/miembros/${member.id}?club_id=${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !member.activo }),
      });
      await fetchMembers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este miembro? Perderá acceso al club.')) return;
    try {
      await authFetch(`${API_BASE_URL}/miembros/${id}?club_id=${clubId}`, { method: 'DELETE' });
      await fetchMembers();
    } catch (e) {
      console.error(e);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(created?.password || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cc20)]">
          <div>
            <h2 className="text-[var(--text-pri)] font-bold text-lg">Mi Equipo</h2>
            <p className="text-xs text-[var(--text-sec)] mt-0.5">Gestiona entrenadores y admins del club</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Credenciales del nuevo miembro */}
          {created && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
              <p className="text-green-400 font-semibold text-sm">✅ {created.nombre} agregado exitosamente</p>
              <p className="text-[var(--text-sec)] text-xs">Comparte estas credenciales con el nuevo miembro:</p>
              <div className="bg-[var(--bg-surface)] rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-sec)]">Email:</span>
                  <span className="text-xs text-[var(--text-pri)] font-mono">{created.email}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--text-sec)]">Contraseña temporal:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--cc)] font-mono font-bold">{created.password}</span>
                    <button onClick={copyPassword} className="text-[var(--text-sec)] hover:text-[var(--cc)] transition-colors">
                      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="flex items-center gap-1 text-[10px] text-yellow-400"><AlertTriangle size={10} /> Muéstrale la contraseña ahora — no se podrá ver de nuevo</p>
              <button onClick={() => setCreated(null)} className="text-xs text-[var(--text-sec)] hover:text-[var(--text-pri)] underline underline-offset-2">
                Cerrar aviso
              </button>
            </div>
          )}

          {/* Lista de miembros */}
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-[var(--text-sec)]">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Cargando miembros...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-6 text-[var(--text-sec)] text-sm">
              Aún no hay entrenadores agregados al club.
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => {
                const rs = ROLE_LABELS[m.role] || ROLE_LABELS.ENTRENADOR;
                return (
                  <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border ${m.activo ? 'border-[var(--cc20)] bg-[var(--bg-surface)]' : 'border-gray-700/50 bg-gray-800/30 opacity-60'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-pri)] truncate">{m.nombre}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${rs.color}`}>
                        {rs.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleActivo(m)}
                        title={m.activo ? 'Desactivar acceso' : 'Activar acceso'}
                        className={`p-1.5 rounded-lg transition-colors ${m.activo ? 'text-green-400 hover:bg-red-500/10 hover:text-red-400' : 'text-gray-600 hover:bg-green-500/10 hover:text-green-400'}`}
                      >
                        {m.activo ? <UserCheck size={14} /> : <ShieldOff size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulario nuevo miembro */}
          {showForm ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--cc20)] rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--text-pri)]">Nuevo miembro</p>
              <div>
                <label className="block text-xs text-[var(--text-sec)] mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={newMember.nombre}
                  onChange={(e) => setNewMember(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Carlos Ramírez"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-sec)] mb-1">Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember(p => ({ ...p, email: e.target.value }))}
                  placeholder="entrenador@email.com"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-sec)] mb-1">Rol</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember(p => ({ ...p, role: e.target.value }))}
                  className={INPUT}
                >
                  <option value="ENTRENADOR">Entrenador (solo lectura financiera)</option>
                  <option value="ADMIN">Admin (acceso completo)</option>
                </select>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--cc)] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? 'Creando...' : 'Crear cuenta'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setError(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--cc20)] text-[var(--text-sec)] text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--cc)] hover:border-[var(--cc)] text-sm transition-all"
            >
              <Plus size={16} />
              Agregar entrenador
            </button>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[var(--cc20)]">
          <p className="text-xs text-[var(--text-mut)] text-center">
            Los entrenadores pueden ver jugadores y arbitraje, pero no acceden a información financiera.
          </p>
        </div>
      </div>
    </div>
  );
}
