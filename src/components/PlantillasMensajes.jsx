import { useEffect, useState, useCallback } from 'react';
import { MessageSquarePlus, Pencil, Trash2, ToggleLeft, ToggleRight, Plus, X, QrCode, Clock, Send, CalendarDays, BanknoteIcon } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const TIPO_PLANTILLA_OPTS = [
  { value: 'evento', label: '📅 Recordatorio de evento', desc: 'Se envía automáticamente cuando hay un evento hoy a la hora configurada' },
  { value: 'cobro',  label: '💰 Cobro de mensualidades', desc: 'Se envía a jugadores con pagos pendientes el día del mes que configures' },
];

const TIPO_EVENTO_OPTS = [
  { value: 'ENTRENAMIENTO', label: 'Entrenamiento'       },
  { value: 'PARTIDO',       label: 'Partido'             },
  { value: 'EVENTO',        label: 'Evento especial'     },
  { value: 'todos',         label: 'Todos los eventos'   },
];

const VARS_EVENTO = [
  { key: '{dia}',         desc: 'Día de la semana  —  JUEVES' },
  { key: '{lugar}',       desc: 'Lugar del evento'            },
  { key: '{hora_inicio}', desc: 'Hora de inicio  —  9:00 pm'  },
  { key: '{hora_fin}',    desc: 'Hora de fin  —  11:00 pm'    },
  { key: '{club_nombre}', desc: 'Nombre del club'             },
  { key: '{llave_pago}',  desc: 'Clave / número de pago'      },
];

const VARS_COBRO = [
  { key: '{nombre}',      desc: 'Nombre del jugador'              },
  { key: '{deuda}',       desc: 'Monto total adeudado  —  $150.000' },
  { key: '{meses}',       desc: 'Meses pendientes  —  enero, febrero' },
  { key: '{club_nombre}', desc: 'Nombre del club'                 },
  { key: '{llave_pago}',  desc: 'Clave / número de pago'          },
];

const EMPTY = {
  nombre: '', mensaje: '', incluir_qr: false, activa: true,
  tipo_plantilla: 'evento',
  hora_envio: '14:00', tipo_evento: 'ENTRENAMIENTO',
  dia_envio: 5,
};

const DIAS_MES = Array.from({ length: 28 }, (_, i) => i + 1);

export default function PlantillasMensajes({ color = '#6A00FF', clubConfig }) {
  const [plantillas, setPlantillas] = useState([]);
  const [limite,     setLimite]     = useState(null);
  const [plan,       setPlan]       = useState('');
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [probando,   setProbando]   = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [error,      setError]      = useState('');

  const token  = () => localStorage.getItem('token')  || sessionStorage.getItem('token')  || '';
  const clubId = () => localStorage.getItem('clubId') || sessionStorage.getItem('clubId') || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/plantillas`, {
        headers: { Authorization: `Bearer ${token()}`, 'x-club-id': clubId() },
      });
      const d = await r.json();
      setPlantillas(d.plantillas || []);
      setLimite(d.limite ?? null);
      setPlan(d.plan || '');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm(EMPTY); setError(''); setModal({ mode: 'new' }); };
  const openEdit = p  => { setForm({ ...p }); setError(''); setModal({ mode: 'edit', id: p.id }); };

  const save = async () => {
    if (!form.nombre.trim() || !form.mensaje.trim()) { setError('Nombre y mensaje son requeridos'); return; }
    if (form.tipo_plantilla === 'evento' && !form.hora_envio) { setError('Selecciona la hora de envío'); return; }
    if (form.tipo_plantilla === 'cobro'  && !form.dia_envio)  { setError('Selecciona el día del mes'); return; }
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
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const toggleActiva = async p => {
    await fetch(`${API}/plantillas/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, 'x-club-id': clubId() },
      body: JSON.stringify({ activa: !p.activa }),
    });
    load();
  };

  const eliminar = async id => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    await fetch(`${API}/plantillas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}`, 'x-club-id': clubId() },
    });
    load();
  };

  const probar = async p => {
    setProbando(p.id);
    try {
      const r = await fetch(`${API}/plantillas/${p.id}/probar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'x-club-id': clubId() },
      });
      const d = await r.json();
      if (d.success) alert(`✅ Prueba enviada a ${d.enviado_a}`);
      else alert(`❌ ${d.error}`);
    } catch (e) { alert(`Error: ${e.message}`); }
    finally { setProbando(null); }
  };

  const insertVar = key => {
    const ta = document.getElementById('plantilla-mensaje');
    if (!ta) { setForm(f => ({ ...f, mensaje: f.mensaje + key })); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = form.mensaje.slice(0, s) + key + form.mensaje.slice(e);
    setForm(f => ({ ...f, mensaje: next }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + key.length, s + key.length); }, 0);
  };

  const hasQr    = !!clubConfig?.qr_pago_url;
  const limitado = limite !== null && plantillas.length >= limite;
  const limiteText = (limite === null || limite === Infinity) ? null
    : `${plantillas.length} / ${limite} · plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
  const vars = form.tipo_plantilla === 'cobro' ? VARS_COBRO : VARS_EVENTO;

  const labelTipo = p => {
    const tipo = p.tipo_plantilla || 'evento';
    if (tipo === 'cobro') return `💰 Cobro · día ${p.dia_envio} de cada mes`;
    const ev = TIPO_EVENTO_OPTS.find(t => t.value === p.tipo_evento)?.label || p.tipo_evento;
    return `📅 ${ev} · ${(p.hora_envio || '').slice(0, 5)}`;
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: 700, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-pri)' }}>Plantillas de mensajes</h2>
          <p style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 2 }}>
            Mensajes automáticos que el sistema envía por WhatsApp según el trigger configurado
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {limiteText && (
            <span style={{ fontSize: 11, color: limitado ? '#EF4444' : 'var(--text-sec)', fontWeight: 600 }}>
              {limiteText}
            </span>
          )}
          <button onClick={limitado ? undefined : openNew} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: limitado ? 'var(--cc20)' : color, color: limitado ? 'var(--text-sec)' : '#fff',
            border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600,
            cursor: limitado ? 'not-allowed' : 'pointer',
          }} title={limitado ? 'Límite del plan alcanzado' : ''}>
            <Plus size={15} /> Nueva
          </button>
        </div>
      </div>

      {/* Banner límite */}
      {limitado && (
        <div style={{
          background: '#FEF3C720', border: '1px solid #F59E0B50', borderRadius: 10,
          padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#92400E',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ⚠️ Alcanzaste el límite de tu plan <strong>{plan}</strong>. Mejora tu plan para crear más plantillas.
        </div>
      )}

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
          <p style={{ fontSize: 13 }}>Crea una plantilla de evento o de cobro y se enviará automáticamente</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plantillas.map(p => (
            <div key={p.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--cc20)', borderRadius: 12,
              padding: '14px 16px', borderLeft: `3px solid ${p.activa ? color : 'var(--cc30)'}`,
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
                    {p.incluir_qr && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: 'var(--cc12)', color: 'var(--text-sec)' }}>QR</span>}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4 }}>{labelTipo(p)}</p>
                  <p style={{
                    fontSize: 12, color: 'var(--text-sec)', marginTop: 5, whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.mensaje}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => probar(p)} disabled={probando === p.id} title="Enviar prueba al admin"
                    style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 7, padding: '4px 8px', cursor: 'pointer', color, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Send size={11} /> {probando === p.id ? '…' : 'Probar'}
                  </button>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => toggleActiva(p)} title={p.activa ? 'Pausar' : 'Activar'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.activa ? color : 'var(--text-sec)', padding: 4 }}>
                      {p.activa ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => openEdit(p)} title="Editar"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)', padding: 4 }}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => eliminar(p.id)} title="Eliminar"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--cc20)', borderRadius: 16,
            width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', padding: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-pri)' }}>
                {modal.mode === 'new' ? 'Nueva plantilla' : 'Editar plantilla'}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Tipo de plantilla */}
            <label style={S.label}>Tipo de plantilla</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {TIPO_PLANTILLA_OPTS.map(o => (
                <button key={o.value} onClick={() => setForm(f => ({ ...f, tipo_plantilla: o.value }))} style={{
                  padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${form.tipo_plantilla === o.value ? color : 'var(--cc20)'}`,
                  background: form.tipo_plantilla === o.value ? `${color}12` : 'var(--bg-base)',
                  fontFamily: 'inherit',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: form.tipo_plantilla === o.value ? color : 'var(--text-pri)', marginBottom: 3 }}>{o.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.4 }}>{o.desc}</p>
                </button>
              ))}
            </div>

            {/* Nombre */}
            <label style={S.label}>Nombre de la plantilla</label>
            <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="ej: Recordatorio entrenamiento" style={S.input} />

            {/* Trigger — condicional según tipo */}
            {form.tipo_plantilla === 'evento' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={S.label}>Tipo de evento</label>
                  <select value={form.tipo_evento} onChange={e => setForm(f => ({ ...f, tipo_evento: e.target.value }))} style={S.input}>
                    {TIPO_EVENTO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Hora de envío</label>
                  <input type="time" value={form.hora_envio}
                    onChange={e => setForm(f => ({ ...f, hora_envio: e.target.value }))} style={S.input} />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Día del mes para enviar (solo a jugadores con deuda)</label>
                <select value={form.dia_envio} onChange={e => setForm(f => ({ ...f, dia_envio: Number(e.target.value) }))} style={S.input}>
                  {DIAS_MES.map(d => <option key={d} value={d}>Día {d} de cada mes</option>)}
                </select>
                <p style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: -8 }}>
                  Solo recibirán el mensaje los jugadores con mensualidades pendientes o en mora.
                </p>
              </div>
            )}

            {/* Variables */}
            <label style={S.label}>Variables — clic para insertar en el mensaje</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {vars.map(v => (
                <button key={v.key} onClick={() => insertVar(v.key)} title={v.desc} style={{
                  background: `${color}15`, border: `1px solid ${color}35`, color,
                  borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'monospace',
                }}>{v.key}</button>
              ))}
            </div>

            {/* Mensaje */}
            <label style={S.label}>Mensaje</label>
            <textarea id="plantilla-mensaje" value={form.mensaje}
              onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
              rows={7} style={{ ...S.input, fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
              placeholder={form.tipo_plantilla === 'cobro'
                ? 'Hola {nombre} 👋\n\nTe recordamos que tienes pagos pendientes en {club_nombre}:\n📅 Meses: {meses}\n💰 Total: {deuda}\n\n🔑 Paga aquí: {llave_pago}'
                : '☀️ ¡Buen día!\n\nHOY, {dia}\n📍 {lugar}\n🕘 {hora_inicio} - {hora_fin}\n\n🔑 LLAVE PARA PAGOS:\n{llave_pago}'}
            />

            {/* Opciones */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-pri)' }}>
                <input type="checkbox" checked={form.activa} onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))} />
                Plantilla activa
              </label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
                cursor: hasQr ? 'pointer' : 'not-allowed',
                color: hasQr ? 'var(--text-pri)' : 'var(--text-sec)', opacity: hasQr ? 1 : 0.5,
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
              <button onClick={save} disabled={saving} style={{ ...S.btnPri, background: color, opacity: saving ? 0.7 : 1 }}>
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
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 5, marginTop: 2 },
  input: {
    width: '100%', background: 'var(--bg-base)', border: '1px solid var(--cc20)',
    borderRadius: 8, padding: '9px 12px', fontSize: 14, color: 'var(--text-pri)',
    outline: 'none', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'inherit',
  },
  btnPri: { padding: '9px 20px', borderRadius: 9, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSec: { padding: '9px 20px', borderRadius: 9, border: '1px solid var(--cc20)', background: 'transparent', color: 'var(--text-sec)', fontSize: 14, cursor: 'pointer' },
};
