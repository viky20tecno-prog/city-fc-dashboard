import { useEffect, useState, useCallback } from 'react';
import { MessageSquarePlus, Pencil, Trash2, ToggleLeft, ToggleRight, Plus, X, QrCode, Clock } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const TIPO_OPTS = [
  { value: 'ENTRENAMIENTO', label: 'Entrenamiento' },
  { value: 'PARTIDO',       label: 'Partido'       },
  { value: 'EVENTO',        label: 'Evento'        },
  { value: 'todos',         label: 'Todos los eventos' },
];

const VARIABLES = [
  { key: '{dia}',         desc: 'Día de la semana (JUEVES)' },
  { key: '{lugar}',       desc: 'Lugar del evento'          },
  { key: '{hora_inicio}', desc: 'Hora de inicio (9:00 pm)'  },
  { key: '{hora_fin}',    desc: 'Hora de fin (11:00 pm)'    },
  { key: '{club_nombre}', desc: 'Nombre del club'           },
  { key: '{llave_pago}',  desc: 'Llave/número de pago'      },
];

const EMPTY = { nombre: '', mensaje: '', incluir_qr: false, hora_envio: '14:00', activa: true, tipo_evento: 'ENTRENAMIENTO' };

export default function PlantillasMensajes({ color = '#6A00FF', clubConfig }) {
  const [plantillas, setPlantillas] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null); // null | { mode: 'new'|'edit', data }
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState(EMPTY);
  const [error,      setError]      = useState('');

  const token = () => localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const clubId = () => localStorage.getItem('clubId') || sessionStorage.getItem('clubId') || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/plantillas`, {
        headers: { Authorization: `Bearer ${token()}`, 'x-club-id': clubId() },
      });
      const d = await r.json();
      setPlantillas(d.plantillas || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm(EMPTY); setError(''); setModal({ mode: 'new' }); };
  const openEdit = (p) => { setForm({ ...p }); setError(''); setModal({ mode: 'edit', id: p.id }); };

  const save = async () => {
    if (!form.nombre.trim() || !form.mensaje.trim() || !form.hora_envio) {
      setError('Nombre, mensaje y hora son requeridos'); return;
    }
    setSaving(true); setError('');
    try {
      const url    = modal.mode === 'new' ? `${API}/plantillas` : `${API}/plantillas/${modal.id}`;
      const method = modal.mode === 'new' ? 'POST' : 'PUT';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, 'x-club-id': clubId() },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.success) { setError(d.error || 'Error al guardar'); return; }
      setModal(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActiva = async (p) => {
    await fetch(`${API}/plantillas/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, 'x-club-id': clubId() },
      body: JSON.stringify({ activa: !p.activa }),
    });
    load();
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    await fetch(`${API}/plantillas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}`, 'x-club-id': clubId() },
    });
    load();
  };

  const insertVar = (key) => {
    const ta = document.getElementById('plantilla-mensaje');
    if (!ta) { setForm(f => ({ ...f, mensaje: f.mensaje + key })); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = form.mensaje.slice(0, s) + key + form.mensaje.slice(e);
    setForm(f => ({ ...f, mensaje: next }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + key.length, s + key.length); }, 0);
  };

  const hasQr = !!clubConfig?.qr_pago_url;

  return (
    <div style={{ padding: '20px 16px', maxWidth: 700, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-pri)' }}>Plantillas de mensajes</h2>
          <p style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 2 }}>
            Mensajes automáticos que se envían a los jugadores cuando hay un evento hoy
          </p>
        </div>
        <button onClick={openNew} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: color, color: '#fff', border: 'none', borderRadius: 10,
          padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus size={15} /> Nueva
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-sec)' }}>Cargando…</div>
      ) : plantillas.length === 0 ? (
        <div style={{
          border: '2px dashed var(--cc20)', borderRadius: 14, padding: '40px 20px',
          textAlign: 'center', color: 'var(--text-sec)',
        }}>
          <MessageSquarePlus size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Sin plantillas configuradas</p>
          <p style={{ fontSize: 13 }}>Crea una plantilla y se enviará automáticamente cuando haya un evento</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plantillas.map(p => (
            <div key={p.id} style={{
              background: 'var(--bg-card)', border: `1px solid var(--cc20)`,
              borderRadius: 12, padding: '14px 16px',
              borderLeft: `3px solid ${p.activa ? color : 'var(--cc30)'}`,
              opacity: p.activa ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-pri)' }}>{p.nombre}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                      background: p.activa ? `${color}20` : 'var(--cc12)',
                      color: p.activa ? color : 'var(--text-sec)',
                    }}>{p.activa ? 'ACTIVA' : 'PAUSADA'}</span>
                    {p.incluir_qr && hasQr && (
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: 'var(--cc12)', color: 'var(--text-sec)' }}>
                        QR
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {p.hora_envio?.slice(0, 5)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>
                      {TIPO_OPTS.find(t => t.value === p.tipo_evento)?.label || p.tipo_evento}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12, color: 'var(--text-sec)', marginTop: 6,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.mensaje}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => toggleActiva(p)} title={p.activa ? 'Pausar' : 'Activar'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.activa ? color : 'var(--text-sec)', padding: 4 }}>
                    {p.activa ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => openEdit(p)} title="Editar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)', padding: 4 }}>
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => eliminar(p.id)} title="Eliminar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear / editar */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--cc20)', borderRadius: 16,
            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
            padding: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-pri)' }}>
                {modal.mode === 'new' ? 'Nueva plantilla' : 'Editar plantilla'}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Nombre */}
            <label style={S.label}>Nombre de la plantilla</label>
            <input
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="ej: Recordatorio entrenamiento"
              style={S.input}
            />

            {/* Tipo de evento + Hora */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={S.label}>Tipo de evento</label>
                <select value={form.tipo_evento} onChange={e => setForm(f => ({ ...f, tipo_evento: e.target.value }))} style={S.input}>
                  {TIPO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Hora de envío</label>
                <input type="time" value={form.hora_envio}
                  onChange={e => setForm(f => ({ ...f, hora_envio: e.target.value }))}
                  style={S.input} />
              </div>
            </div>

            {/* Variables disponibles */}
            <label style={S.label}>Variables disponibles — clic para insertar</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {VARIABLES.map(v => (
                <button key={v.key} onClick={() => insertVar(v.key)} title={v.desc} style={{
                  background: `${color}18`, border: `1px solid ${color}40`,
                  color, borderRadius: 6, padding: '3px 9px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace',
                }}>{v.key}</button>
              ))}
            </div>

            {/* Mensaje */}
            <label style={S.label}>Mensaje</label>
            <textarea
              id="plantilla-mensaje"
              value={form.mensaje}
              onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
              placeholder={'☀️ ¡Buen día!\n\nHOY, {dia}\n📍 {lugar}\n🕘 {hora_inicio} - {hora_fin}\n\n🔑 LLAVE PARA PAGOS:\n{llave_pago}'}
              rows={8}
              style={{ ...S.input, fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
            />

            {/* Opciones */}
            <div style={{ display: 'flex', gap: 20, marginTop: 4, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-pri)' }}>
                <input type="checkbox" checked={form.activa} onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))} />
                Plantilla activa
              </label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: hasQr ? 'pointer' : 'not-allowed',
                fontSize: 14, color: hasQr ? 'var(--text-pri)' : 'var(--text-sec)',
                opacity: hasQr ? 1 : 0.5,
              }} title={!hasQr ? 'Configura el QR de pagos en Ciclo de Cobro primero' : ''}>
                <input type="checkbox" checked={form.incluir_qr} disabled={!hasQr}
                  onChange={e => setForm(f => ({ ...f, incluir_qr: e.target.checked }))} />
                <QrCode size={14} /> Incluir QR de pagos
                {!hasQr && <span style={{ fontSize: 11, color: '#EF4444' }}>(no configurado)</span>}
              </label>
            </div>

            {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={S.btnSec}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ ...S.btnPri, background: color }}>
                {saving ? 'Guardando…' : 'Guardar plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 6, marginTop: 2 },
  input: {
    width: '100%', background: 'var(--bg-base)', border: '1px solid var(--cc20)',
    borderRadius: 8, padding: '9px 12px', fontSize: 14, color: 'var(--text-pri)',
    outline: 'none', boxSizing: 'border-box', marginBottom: 12,
    fontFamily: 'inherit',
  },
  btnPri: {
    padding: '9px 20px', borderRadius: 9, border: 'none', color: '#fff',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnSec: {
    padding: '9px 20px', borderRadius: 9, border: '1px solid var(--cc20)',
    background: 'transparent', color: 'var(--text-sec)', fontSize: 14, cursor: 'pointer',
  },
};
