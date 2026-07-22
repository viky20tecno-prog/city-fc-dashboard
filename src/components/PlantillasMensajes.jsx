import { useEffect, useState, useCallback } from 'react';
import { MessageSquarePlus, Pencil, Trash2, ToggleLeft, ToggleRight, Plus, X, QrCode, Send, Check, Search, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getClubId } from '../services/api';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const TIPO_EVENTO_OPTS = [
  { value: 'ENTRENAMIENTO', label: 'Entrenamiento'     },
  { value: 'PARTIDO',       label: 'Partido'           },
  { value: 'EVENTO',        label: 'Evento especial'   },
  { value: 'todos',         label: 'Todos los eventos' },
];

const VARS_EVENTO = [
  { key: '{nombre}',      desc: 'Nombre del jugador'       },
  { key: '{dia}',         desc: 'Día — JUEVES'             },
  { key: '{lugar}',       desc: 'Lugar del evento'         },
  { key: '{hora_inicio}', desc: 'Hora inicio — 9:00 pm'    },
  { key: '{hora_fin}',    desc: 'Hora fin — 11:00 pm'      },
  { key: '{club_nombre}', desc: 'Nombre del club'          },
  { key: '{llave_pago}',  desc: 'Clave de pago'            },
];

const EMPTY = {
  nombre: '', mensaje: '', incluir_qr: false, activa: true,
  tipo_plantilla: 'evento',
  hora_envio: '14:00', tipo_evento: 'ENTRENAMIENTO',
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
  const [form,       setForm]       = useState(EMPTY);
  const [error,      setError]      = useState('');
  const [ecLista, setEcLista] = useState([]);
  const [ecLoading, setEcLoading] = useState(false);
  const [ecError, setEcError] = useState('');
  const [ecFiltro, setEcFiltro] = useState('');
  const [ecToast, setEcToast] = useState('');
  const [limpiandoEc, setLimpiandoEc] = useState(false);
  const [plantillaToast, setPlantillaToast] = useState('');

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };
  const clubId = () => getClubId() || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const hdrs = await authHeaders();
      const r = await fetch(`${API}/plantillas?club_id=${clubId()}`, { headers: hdrs });
      const dPlant = await r.json();
      setPlantillas(dPlant.plantillas || []);
      setLimite(dPlant.limite ?? null);
      setPlan(dPlant.plan || '');
    } finally { setLoading(false); }
  }, []);

  const loadEstadoCuenta = useCallback(async () => {
    setEcLoading(true);
    setEcError('');
    try {
      const hdrs = await authHeaders();
      const r = await fetch(`${API}/players/estado-cuenta-lista?club_id=${clubId()}`, { headers: hdrs });
      const d = await r.json();
      if (!d.success) { setEcError(d.error || 'No se pudo cargar la lista'); setEcLista([]); return; }
      setEcLista(
        (d.data || []).sort((a, b) => `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`, 'es'))
      );
    } catch (e) {
      setEcError(e.message);
      setEcLista([]);
    } finally { setEcLoading(false); }
  }, []);

  useEffect(() => { load(); loadEstadoCuenta(); }, [load, loadEstadoCuenta]);

  const openNew  = () => { setForm(EMPTY); setError(''); setModal({ mode: 'new' }); };
  const openEdit = p  => { setForm({ ...p }); setError(''); setModal({ mode: 'edit', id: p.id }); };

  const save = async () => {
    if (!form.nombre.trim() || !form.mensaje.trim()) { setError('Nombre y mensaje son requeridos'); return; }
    if (!form.hora_envio) { setError('Selecciona la hora de envío'); return; }
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

  // No hay envío automático de plantillas de evento (se quitó por riesgo de baneo
  // de WhatsApp, ver PlantillasMensajes/plantillas.js) — esto le da al admin al
  // menos una forma de un clic de llevarse el texto a su WhatsApp y completar las
  // variables ({nombre}, {dia}, {lugar}...) a mano antes de pegarlo.
  const copiarPlantilla = async p => {
    try {
      await navigator.clipboard.writeText(p.mensaje);
      setPlantillaToast(`Mensaje de "${p.nombre}" copiado — completa las variables y pegalo en WhatsApp`);
    } catch {
      setPlantillaToast('No se pudo copiar automáticamente — seleccioná el texto desde "Editar"');
    }
    setTimeout(() => setPlantillaToast(''), 6000);
  };

  const insertVar = key => {
    const ta = document.getElementById('plantilla-msg');
    if (!ta) { setForm(f => ({ ...f, mensaje: f.mensaje + key })); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    setForm(f => ({ ...f, mensaje: f.mensaje.slice(0, s) + key + f.mensaje.slice(e) }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + key.length, s + key.length); }, 0);
  };

  // Marca/desmarca en el servidor que el admin ya mandó el estado de cuenta de este mes a
  // un jugador. Es un registro manual del admin, no una confirmación real de que el mensaje
  // llegó — eso pasa afuera, dentro de WhatsApp.
  const marcarEnviado = async (cedula, enviado) => {
    setEcLista(list => list.map(j => j.cedula === cedula ? { ...j, ya_enviado: enviado } : j));
    try {
      const hdrs = await authHeaders();
      await fetch(`${API}/players/estado-cuenta-marcar?club_id=${clubId()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...hdrs },
        body: JSON.stringify({ cedula, enviado }),
      });
    } catch {
      setEcLista(list => list.map(j => j.cedula === cedula ? { ...j, ya_enviado: !enviado } : j));
    }
  };

  // Quita el check de "enviado" a todos los jugadores del mes actual, para
  // reiniciar el ciclo de cobro (ej. si se quiere volver a escribirle a todos).
  const limpiarTodoEnviado = async () => {
    const enviados = ecLista.filter(j => j.ya_enviado).length;
    if (enviados === 0) return;
    if (!window.confirm(`¿Quitar el check de "enviado" a los ${enviados} jugadores marcados? Reinicia el conteo del mes, no borra ningún mensaje.`)) return;
    setLimpiandoEc(true);
    try {
      const hdrs = await authHeaders();
      const r = await fetch(`${API}/players/estado-cuenta-limpiar?club_id=${clubId()}`, {
        method: 'POST', headers: hdrs,
      });
      const d = await r.json();
      if (d.success) setEcLista(list => list.map(j => ({ ...j, ya_enviado: false })));
      else setEcToast(d.error || 'No se pudo limpiar la lista');
    } catch {
      setEcToast('Error de conexión al limpiar la lista');
    } finally {
      setLimpiandoEc(false);
      setTimeout(() => setEcToast(''), 6000);
    }
  };

  // Copia el mensaje al portapapeles y abre el chat del jugador (sin prellenar texto — un
  // link wa.me con ?text= corrompe los emojis en WhatsApp Desktop de Windows). El admin pega
  // con Ctrl+V y da el envío final desde su propio WhatsApp, nunca automático desde el servidor.
  const abrirEstadoCuenta = async jugador => {
    try {
      await navigator.clipboard.writeText(jugador.texto);
      setEcToast(`Mensaje de ${jugador.nombre} copiado — pegalo con Ctrl+V en el chat que se abrió`);
    } catch {
      setEcToast('No se pudo copiar el mensaje automáticamente — copialo a mano del texto que se abrió');
    }
    window.open(jugador.wa_link, '_blank', 'noopener,noreferrer');
    if (!jugador.ya_enviado) marcarEnviado(jugador.cedula, true);
    setTimeout(() => setEcToast(''), 6000);
  };

  const hasQr    = !!clubConfig?.qr_pago_url;
  const limitado = limite !== null && plantillas.length >= limite;
  const vars     = VARS_EVENTO;
  const planBloqueado = plan === 'trial' || plan === 'starter';

  const labelTipo = p => {
    const ev = TIPO_EVENTO_OPTS.find(t => t.value === p.tipo_evento)?.label || p.tipo_evento || 'Evento';
    return `📅 ${ev} · ${(p.hora_envio || '').slice(0, 5)}`;
  };

  if (planBloqueado) return (
    <div className="p-5 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-lg font-bold text-[var(--text-pri)] mb-2">Plantillas de mensajes</h2>
      <p className="text-sm text-[var(--text-sec)] mb-1 max-w-md">
        Guarda el texto de tus recordatorios de entrenamientos y partidos, con variables listas para completar.
      </p>
      <p className="text-xs text-[var(--text-mut)] mb-6 max-w-sm">
        Disponible en los planes <strong className="text-[var(--text-sec)]">Pro</strong> y <strong className="text-[var(--text-sec)]">Scale</strong>.
      </p>
      <a
        href="https://zensports.zenpra.ai/#pricing"
        target="_blank"
        rel="noopener noreferrer"
        style={{ background: color }}
        className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
      >
        Ver planes y upgrades
      </a>
    </div>
  );

  return (
    <div className="p-5 max-w-2xl mx-auto">

      {/* Card — Estado de cuenta, envío manual jugador por jugador */}
      <div className="mb-5 bg-[var(--bg-card)] border border-[rgba(37,211,102,0.25)] rounded-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-[var(--text-pri)] flex items-center gap-2">
          <span>💬</span> Estado de cuenta
        </p>
        <p className="text-xs text-[var(--text-sec)]">
          El mensaje ya viene armado (mensualidades, uniformes, torneos + portal). Al hacer clic en "Enviar" se copia al portapapeles y se abre el chat del jugador — pegalo con <strong>Ctrl+V</strong> y confirmá el envío desde tu WhatsApp. El check queda a tu criterio, para llevar la cuenta de a quién ya le escribiste este mes.
        </p>

        {ecToast && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[rgba(37,211,102,0.10)] border border-[rgba(37,211,102,0.25)] text-[#25D366]">
            📋 {ecToast}
          </div>
        )}

        {/* Progreso del mes */}
        {ecLista.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-sec)]">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--cc12)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(ecLista.filter(j => j.ya_enviado).length / ecLista.length) * 100}%`, background: '#25D366' }}
              />
            </div>
            <span className="font-semibold text-[var(--text-pri)] whitespace-nowrap">
              {ecLista.filter(j => j.ya_enviado).length} / {ecLista.length} enviados
            </span>
            <button onClick={limpiarTodoEnviado} disabled={limpiandoEc || ecLista.every(j => !j.ya_enviado)}
              title="Quitar el check de enviado a todos, para reiniciar el cobro del mes"
              className="flex items-center gap-1 whitespace-nowrap text-sm font-medium underline decoration-dotted opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              {limpiandoEc ? 'Limpiando…' : <><span className="text-base leading-none">🧹</span> Limpiar todo</>}
            </button>
          </div>
        )}

        {/* Buscador */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-mut)]" />
          <input
            type="search"
            value={ecFiltro}
            onChange={e => setEcFiltro(e.target.value)}
            placeholder="Buscar jugador…"
            className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl pl-9 pr-3 py-2 text-sm text-[var(--text-pri)] placeholder:text-[var(--text-mut)] focus:outline-none focus:border-[rgba(37,211,102,0.5)] transition"
          />
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto">
          {ecLoading ? (
            <p className="text-xs text-[var(--text-mut)] text-center py-6">Cargando…</p>
          ) : ecError ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/25 text-red-400">
              ❌ {ecError}
              <button onClick={loadEstadoCuenta} className="ml-auto underline opacity-80 hover:opacity-100">Reintentar</button>
            </div>
          ) : ecLista.length === 0 ? (
            <p className="text-xs text-[var(--text-mut)] text-center py-6">Ningún jugador activo con número registrado.</p>
          ) : (
            ecLista
              .filter(j => {
                const lower = ecFiltro.toLowerCase();
                return !lower || `${j.nombre} ${j.apellidos}`.toLowerCase().includes(lower) || String(j.cedula).includes(ecFiltro);
              })
              .map(j => (
                <div key={j.cedula} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-app)] border border-[var(--cc20)]">
                  <button
                    type="button"
                    onClick={() => marcarEnviado(j.cedula, !j.ya_enviado)}
                    title={j.ya_enviado ? 'Marcar como no enviado' : 'Marcar como enviado'}
                    className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition"
                    style={j.ya_enviado
                      ? { background: '#25D366', border: '1px solid #25D366' }
                      : { background: 'transparent', border: '1px solid var(--cc30)' }}
                  >
                    {j.ya_enviado && <Check size={13} color="#fff" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-pri)] truncate">{j.nombre} {j.apellidos}</p>
                    <p className="text-xs text-[var(--text-mut)]">CC {j.cedula} · {j.celular}</p>
                  </div>
                  <button
                    onClick={() => abrirEstadoCuenta(j)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.35)', color: '#25D366' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,211,102,0.15)'}
                  >
                    <Send size={12} />
                    {j.ya_enviado ? 'Reenviar' : 'Enviar'}
                  </button>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-pri)]">Plantillas de mensajes</h2>
          <p className="text-xs text-[var(--text-sec)] mt-1">
            Guarda el texto de tus recordatorios — copialo desde "Editar" y pegalo en tu WhatsApp cuando lo necesites
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

      {plantillaToast && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[rgba(37,211,102,0.10)] border border-[rgba(37,211,102,0.25)] text-[#25D366] mb-4">
          📋 {plantillaToast}
        </div>
      )}

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
          <p className="text-xs text-[var(--text-mut)]">Crea una plantilla de recordatorio de evento para tenerla lista y copiarla cuando la necesites</p>
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
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => copiarPlantilla(p)} title="Copiar mensaje"
                      className="p-1.5 rounded-lg hover:bg-[rgba(37,211,102,0.12)] text-[var(--text-sec)] hover:text-[#25D366] transition cursor-pointer">
                      <Copy size={14} />
                    </button>
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

            {/* Nombre */}
            <label className={LABEL_CLS}>Nombre de la plantilla</label>
            <input
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="ej: Recordatorio de entrenamiento"
              className={`${INPUT_CLS} mb-4`}
            />

            {/* Trigger */}
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
              placeholder="☀️ ¡Buen día!\n\nHOY, {dia}\n📍 {lugar}\n🕘 {hora_inicio} - {hora_fin}\n\n🔑 LLAVE PARA PAGOS:\n{llave_pago}"
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
