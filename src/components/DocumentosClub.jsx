import { useEffect, useState, useCallback } from 'react';
import { FolderOpen, Plus, Trash2, ExternalLink, ToggleLeft, ToggleRight, X, Link2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getClubId } from '../services/api';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const EMPTY = { nombre: '', url: '', descripcion: '', enviar_al_inscribirse: false };

function hostLabel(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url.slice(0, 40); }
}

export default function DocumentosClub({ color }) {
  const c = color || '#E14924';

  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null); // null=oculto, {...}=abierto
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const clubId = () => getClubId() || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/documents?club_id=${clubId()}`, { headers: await authHeaders() });
      const d = await r.json();
      setDocs(d.data || []);
    } finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const openForm = () => { setForm({ ...EMPTY }); setError(''); };
  const closeForm = () => { setForm(null); setError(''); };

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (!form.url.trim())    { setError('La URL es obligatoria'); return; }
    setSaving(true); setError('');
    try {
      const r = await fetch(`${API}/documents?club_id=${clubId()}`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          url: form.url.trim(),
          descripcion: form.descripcion.trim() || null,
          enviar_al_inscribirse: form.enviar_al_inscribirse,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        setError(d.error || 'Error al guardar');
        return;
      }
      closeForm();
      load();
    } finally { setSaving(false); }
  };

  const toggleEnviar = async (doc) => {
    const r = await fetch(`${API}/documents/${doc.id}?club_id=${clubId()}`, {
      method: 'PATCH',
      headers: await authHeaders(),
      body: JSON.stringify({ enviar_al_inscribirse: !doc.enviar_al_inscribirse }),
    });
    if (r.ok) setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, enviar_al_inscribirse: !d.enviar_al_inscribirse } : d));
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este documento?')) return;
    await fetch(`${API}/documents/${id}?club_id=${clubId()}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FolderOpen size={22} color={c} strokeWidth={1.8} />
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-pri)' }}>Documentos del Club</h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-mut)', marginTop: 2 }}>
              Agrega URLs de tus documentos y activa el envío automático por WhatsApp al inscribirse
            </p>
          </div>
        </div>
        {!form && (
          <button
            onClick={openForm}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: c, color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Plus size={15} /> Agregar
          </button>
        )}
      </div>

      {/* Formulario agregar */}
      {form && (
        <div style={{
          background: 'var(--bg-card)', border: `1px solid ${c}40`, borderRadius: 12,
          padding: '18px 20px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-pri)' }}>Nuevo documento</span>
            <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={16} color="var(--text-mut)" />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre del documento *</label>
              <input
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Lineamientos City FC 2026"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>URL del documento *</label>
              <input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://drive.google.com/file/d/..."
                style={inputStyle}
              />
              <span style={{ fontSize: 11, color: 'var(--text-mut)', marginTop: 4, display: 'block' }}>
                Google Drive, Dropbox, OneDrive o cualquier enlace público al archivo
              </span>
            </div>
            <div>
              <label style={labelStyle}>Descripción (opcional)</label>
              <input
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Ej: Reglamento interno del club para la temporada 2026"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setForm(f => ({ ...f, enviar_al_inscribirse: !f.enviar_al_inscribirse }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                {form.enviar_al_inscribirse
                  ? <ToggleRight size={28} color={c} />
                  : <ToggleLeft  size={28} color="var(--text-mut)" />}
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>
                Enviar por WhatsApp al nuevo inscrito
              </span>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#fee2e2', borderRadius: 6, fontSize: 12, color: '#991b1b' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button onClick={closeForm} style={{ ...btnBase, background: 'var(--bg-sub)', color: 'var(--text-sec)' }}>
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...btnBase, background: c, color: '#fff', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-mut)', fontSize: 13 }}>
          Cargando documentos...
        </div>
      ) : docs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          border: '1px dashed var(--border-sub)', borderRadius: 12,
          color: 'var(--text-mut)',
        }}>
          <FolderOpen size={36} color="var(--border-sub)" strokeWidth={1.4} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, marginBottom: 6 }}>Aún no hay documentos</div>
          <div style={{ fontSize: 12 }}>Agrega lineamientos, reglamentos o contratos que quieras compartir con tus jugadores</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {docs.map(doc => (
            <div
              key={doc.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-sub)',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Ícono */}
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                background: `${c}15`, border: `1px solid ${c}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Link2 size={16} color={c} strokeWidth={1.8} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-pri)', marginBottom: 2 }}>
                  {doc.nombre}
                </div>
                {doc.descripcion && (
                  <div style={{ fontSize: 11, color: 'var(--text-mut)', marginBottom: 2 }}>
                    {doc.descripcion}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-mut)' }}>
                  {hostLabel(doc.url)}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {/* Toggle enviar al inscribirse */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <button
                    onClick={() => toggleEnviar(doc)}
                    title={doc.enviar_al_inscribirse ? 'No enviar al inscribirse' : 'Enviar al inscribirse'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    {doc.enviar_al_inscribirse
                      ? <ToggleRight size={26} color={c} />
                      : <ToggleLeft  size={26} color="var(--text-mut)" />}
                  </button>
                  <span style={{ fontSize: 11, color: doc.enviar_al_inscribirse ? c : 'var(--text-mut)', whiteSpace: 'nowrap' }}>
                    {doc.enviar_al_inscribirse ? 'Se envía al inscribirse' : 'No se envía'}
                  </span>
                </div>

                {/* Abrir URL */}
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir documento"
                  style={{ display: 'flex', padding: 6, borderRadius: 6, color: 'var(--text-mut)', textDecoration: 'none' }}
                >
                  <ExternalLink size={15} />
                </a>

                {/* Eliminar */}
                <button
                  onClick={() => handleDelete(doc.id)}
                  title="Eliminar documento"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', color: '#ef4444' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nota informativa */}
      {docs.some(d => d.enviar_al_inscribirse) && (
        <div style={{
          marginTop: 16, padding: '10px 14px',
          background: `${c}0F`, border: `1px solid ${c}25`, borderRadius: 8,
          fontSize: 12, color: 'var(--text-sec)',
        }}>
          Los documentos activos se envían por WhatsApp automáticamente cuando un jugador completa el formulario de inscripción. Requiere WhatsApp conectado en Plantillas WA.
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-sec)', marginBottom: 5,
};

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border-sub)', background: 'var(--bg-main)',
  color: 'var(--text-pri)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
};

const btnBase = {
  padding: '8px 16px', borderRadius: 8, border: 'none',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
