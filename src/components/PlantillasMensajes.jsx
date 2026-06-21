import { useEffect, useState, useCallback } from 'react';
import { MessageSquarePlus, Pencil, Trash2, ToggleLeft, ToggleRight, Plus, X, QrCode, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getClubId } from '../services/api';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const TIPO_PLANTILLA_OPTS = [
  {
    value: 'evento',
    icon: '📅',
    label: 'Recordatorio de evento',
    desc: 'Se envía cuando hay un evento hoy a la hora configurada',
  },
  {
    value: 'cobro',
    icon: '💰',
    label: 'Cobro de mensualidades',
    desc: 'Se envía a jugadores con pagos pendientes el día del mes que elijas',
  },
];

const TIPO_EVENTO_OPTS = [
  { value: 'ENTRENAMIENTO', label: 'Entrenamiento'     },
  { value: 'PARTIDO',       label: 'Partido'           },
  { value: 'EVENTO',        label: 'Evento especial'   },
  { value: 'todos',         label: 'Todos los eventos' },
];

const VARS_EVENTO = [
  { key: '{dia}',         desc: 'Día — JUEVES'             },
  { key: '{lugar}',       desc: 'Lugar del evento'         },
  { key: '{hora_inicio}', desc: 'Hora inicio — 9:00 pm'    },
  { key: '{hora_fin}',    desc: 'Hora fin — 11:00 pm'      },
  { key: '{club_nombre}', desc: 'Nombre del club'          },
  { key: '{llave_pago}',  desc: 'Clave de pago'            },
];

const VARS_COBRO = [
  { key: '{nombre}',      desc: 'Nombre del jugador'        },
  { key: '{deuda}',       desc: 'Total adeudado — $150.000' },
  { key: '{meses}',       desc: 'Meses — enero, febrero'    },
  { key: '{club_nombre}', desc: 'Nombre del club'           },
  { key: '{llave_pago}',  desc: 'Clave de pago'             },
];

const EMPTY = {
  nombre: '', mensaje: '', incluir_qr: false, activa: true,
  tipo_plantilla: 'evento',
  hora_envio: '14:00', tipo_evento: 'ENTRENAMIENTO',
  dia_envio: 5,
};

const INPUT_CLS = 'w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition placeholder:text-[var(--text-mut)]';
const LABEL_CLS = 'block text-xs font-semibold text-[var(--text-sec)] mb-1.5';

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

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };
  const clubId = () => getClubId() || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/plantillas?club_id=${clubId()}`, {
        headers: await authHeaders(),
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
      const cid  = clubId();
      const url  = modal.mode === 'new' ? `${API}/plantillas?club_id=${cid}` : `${API}/plantillas/${modal.id}?club_id=${cid}`;
      const hdrs = await authHeaders();
      const r = await fetch(url, {
        method: modal.mode === 'new' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', ...hdrs },
        body: JSON.stringify(form),
      });
      const text = await r.text();
      let d;
      try { d = JSON.parse(text); }
      catch { setError(`Error ${r.status} — respuesta inesperada del servidor (club: ${cid})`); return; }
      if (!d.success) { setError(d.error || 'Error al guardar'); return; }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const toggleActiva = async p => {
    await fetch(`${API}/plantillas/${p.id}?club_id=${clubId()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ activa: !p.activa }),
    });
    load();
  };

  const eliminar = async id => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    await fetch(`${API}/plantillas/${id}?club_id=${clubId()}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    load();
  };

  const probar = async p => {
    setProbando(p.id);
    try {
      const r = await fetch(`${API}/plantillas/${p.id}/probar?club_id=${clubId()}`, {
        method: 'POST',
        headers: await authHeaders(),
      });
      const d = await r.json();
      if (d.success) alert(`✅ Prueba enviada a ${d.enviado_a}`);
      else alert(`❌ ${d.error}`);
    } catch (e) { alert(`Error: ${e.message}`); }
    finally { setProbando(null); }
  };

  const insertVar = key => {
    const ta = document.getElementById('plantilla-msg');
    if (!ta) { setForm(f => ({ ...f, mensaje: f.mensaje + key })); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    setForm(f => ({ ...f, mensaje: f.mensaje.slice(0, s) + key + f.mensaje.slice(e) }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + key.length, s + key.length); }, 0);
  };

  const hasQr    = !!clubConfig?.qr_pago_url;
  const limitado = limite !== null && plantillas.length >= limite;
  const vars     = form.tipo_plantilla === 'cobro' ? VARS_COBRO : VARS_EVENTO;

  const labelTipo = p => {
    const tipo = p.tipo_plantilla || 'evento';
    if (tipo === 'cobro') return `💰 Cobro · día ${p.dia_envio} de cada mes`;
    const ev = TIPO_EVENTO_OPTS.find(t => t.value === p.tipo_evento)?.label || p.tipo_evento || 'Evento';
    return `📅 ${ev} · ${(p.hora_envio || '').slice(0, 5)}`;
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-pri)]">Plantillas de mensajes</h2>
          <p className="text-xs text-[var(--text-sec)] mt-1">
            Mensajes automáticos que el sistema envía por WhatsApp según el trigger configurado
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {limite !== null && (
            <span className={`text-xs font-semibold ${limitado ? 'text-red-400' : 'text-[var(--text-mut)]'}`}>
              {plantillas.length} / {limite === Infinity ? '∞' : limite} · {plan}
            </span>
          )}
          <button
            onClick={limitado ? undefined : openNew}
            disabled={limitado}
            style={{ background: limitado ? undefined : color }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition
              ${limitado ? 'bg-[var(--cc12)] text-[var(--text-mut)] cursor-not-allowed' : 'text-white hover:opacity-90 cursor-pointer'}`}
          >
            <Plus size={14} /> Nueva
          </button>
        </div>
      </div>

      {/* Banner límite */}
      {limitado && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 text-amber-300 text-sm">
          ⚠️ Alcanzaste el límite de tu plan <strong className="capitalize">{plan}</strong>. Mejora tu plan para agregar más plantillas.
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-2 border-[var(--cc20)] border-t-[var(--cc)] animate-spin" />
        </div>
      ) : plantillas.length === 0 ? (
        <div className="border-2 border-dashed border-[var(--cc20)] rounded-2xl p-12 text-center">
          <MessageSquarePlus size={36} className="mx-auto mb-3 text-[var(--text-mut)]" />
          <p className="text-sm font-semibold text-[var(--text-sec)] mb-1">Sin plantillas configuradas</p>
          <p className="text-xs text-[var(--text-mut)]">Crea una plantilla de evento o de cobro y se enviará automáticamente</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {plantillas.map(p => (
            <div
              key={p.id}
              className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl p-4 transition"
              style={{ borderLeft: `3px solid ${p.activa ? color : 'var(--cc30)'}`, opacity: p.activa ? 1 : 0.55 }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[var(--text-pri)]">{p.nombre}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: p.activa ? `${color}20` : 'var(--cc12)',
                        color:      p.activa ? color        : 'var(--text-mut)',
                      }}
                    >
                      {p.activa ? 'ACTIVA' : 'PAUSADA'}
                    </span>
                    {p.incluir_qr && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--cc12)] text-[var(--text-mut)]">
                        QR
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-sec)] mt-1">{labelTipo(p)}</p>
                  <p className="text-xs text-[var(--text-mut)] mt-1.5 line-clamp-2 whitespace-pre-wrap break-words">
                    {p.mensaje}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => probar(p)}
                    disabled={probando === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--cc20)] text-[var(--text-sec)] text-xs font-semibold hover:text-[var(--text-pri)] hover:border-[var(--cc30)] transition disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={11} /> {probando === p.id ? 'Enviando…' : 'Probar'}
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => toggleActiva(p)} title={p.activa ? 'Pausar' : 'Activar'}
                      className="p-1.5 rounded-lg hover:bg-[var(--cc12)] transition cursor-pointer"
                      style={{ color: p.activa ? color : 'var(--text-mut)' }}>
                      {p.activa ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg hover:bg-[var(--cc12)] text-[var(--text-sec)] hover:text-[var(--text-pri)] transition cursor-pointer">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => eliminar(p.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-mut)] hover:text-red-400 transition cursor-pointer">
                      <Trash2 size={14} />
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
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setModal(null)}
        >
          <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl w-full max-w-[540px] max-h-[92vh] overflow-y-auto p-6">

            {/* Header modal */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[var(--text-pri)]">
                {modal.mode === 'new' ? 'Nueva plantilla' : 'Editar plantilla'}
              </h3>
              <button onClick={() => setModal(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--cc12)] text-[var(--text-sec)] transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Tipo de plantilla */}
            <p className={LABEL_CLS}>Tipo de plantilla</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {TIPO_PLANTILLA_OPTS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setForm(f => ({ ...f, tipo_plantilla: o.value }))}
                  className="text-left p-3 rounded-xl border-2 transition cursor-pointer"
                  style={{
                    borderColor:  form.tipo_plantilla === o.value ? color : 'var(--cc20)',
                    background:   form.tipo_plantilla === o.value ? `${color}12` : 'var(--bg-app)',
                  }}
                >
                  <p className="text-sm font-bold text-[var(--text-pri)] mb-1">{o.icon} {o.label}</p>
                  <p className="text-[11px] text-[var(--text-sec)] leading-snug">{o.desc}</p>
                </button>
              ))}
            </div>

            {/* Nombre */}
            <label className={LABEL_CLS}>Nombre de la plantilla</label>
            <input
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="ej: Recordatorio de entrenamiento"
              className={`${INPUT_CLS} mb-4`}
            />

            {/* Trigger */}
            {form.tipo_plantilla === 'evento' ? (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={LABEL_CLS}>Tipo de evento</label>
                  <select
                    value={form.tipo_evento}
                    onChange={e => setForm(f => ({ ...f, tipo_evento: e.target.value }))}
                    className={INPUT_CLS}
                    style={{ colorScheme: 'dark' }}
                  >
                    {TIPO_EVENTO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Hora de envío</label>
                  <input
                    type="time"
                    value={form.hora_envio}
                    onChange={e => setForm(f => ({ ...f, hora_envio: e.target.value }))}
                    className={INPUT_CLS}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className={LABEL_CLS}>Día del mes para enviar</label>
                <select
                  value={form.dia_envio}
                  onChange={e => setForm(f => ({ ...f, dia_envio: Number(e.target.value) }))}
                  className={INPUT_CLS}
                  style={{ colorScheme: 'dark' }}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>Día {d} de cada mes</option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--text-mut)] mt-1">
                  Solo recibirán el mensaje los jugadores con mensualidades pendientes o en mora.
                </p>
              </div>
            )}

            {/* Variables */}
            <p className={LABEL_CLS}>Variables — clic para insertar</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {vars.map(v => (
                <button
                  key={v.key}
                  onClick={() => insertVar(v.key)}
                  title={v.desc}
                  className="px-3 py-1 rounded-lg bg-[var(--cc12)] border border-[var(--cc20)] text-[var(--text-sec)] text-xs font-mono font-semibold hover:text-[var(--text-pri)] hover:border-[var(--cc30)] transition cursor-pointer"
                >
                  {v.key}
                </button>
              ))}
            </div>

            {/* Mensaje */}
            <label className={LABEL_CLS}>Mensaje</label>
            <textarea
              id="plantilla-msg"
              value={form.mensaje}
              onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
              rows={7}
              className={`${INPUT_CLS} font-mono resize-y`}
              placeholder={form.tipo_plantilla === 'cobro'
                ? 'Hola {nombre} 👋\n\nTienes pagos pendientes en {club_nombre}:\n📅 Meses: {meses}\n💰 Total: {deuda}\n\n🔑 Paga aquí: {llave_pago}'
                : '☀️ ¡Buen día!\n\nHOY, {dia}\n📍 {lugar}\n🕘 {hora_inicio} - {hora_fin}\n\n🔑 LLAVE PARA PAGOS:\n{llave_pago}'}
            />

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-5 mt-3">
              <label className="flex items-center gap-2 text-sm text-[var(--text-sec)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
                  className="accent-[var(--cc)] w-4 h-4"
                />
                Plantilla activa
              </label>
              <label
                className={`flex items-center gap-2 text-sm select-none ${hasQr ? 'text-[var(--text-sec)] cursor-pointer' : 'text-[var(--text-mut)] cursor-not-allowed'}`}
                title={!hasQr ? 'Configura el QR de pagos en Ciclo de Cobro primero' : ''}
              >
                <input
                  type="checkbox"
                  checked={form.incluir_qr}
                  disabled={!hasQr}
                  onChange={e => setForm(f => ({ ...f, incluir_qr: e.target.checked }))}
                  className="accent-[var(--cc)] w-4 h-4"
                />
                <QrCode size={13} /> Incluir QR de pagos
                {!hasQr && <span className="text-red-400 text-[10px]">(no configurado)</span>}
              </label>
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            {/* Acciones */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setModal(null)}
                className="px-5 py-2.5 rounded-xl border border-[var(--cc20)] text-sm text-[var(--text-sec)] hover:text-[var(--text-pri)] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                style={{ background: color }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
              >
                {saving ? 'Guardando…' : 'Guardar plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
