import { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, Save, MessageCircle, Info, Eye, Settings2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getClubId } from '../services/api';
import { authFetch } from '../lib/authFetch';
import ModalDescuentosAfectados from './ModalDescuentosAfectados';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function calcDias(form) {
  const dc = Math.min(25, Math.max(1, Number(form.dia_cobro) || 1));
  const dg = Math.max(0, Number(form.dias_gracia_mora) || 0);
  return {
    preventivo:   dc > 4 ? dc - 4 : 27,
    cobro:        dc,
    recordatorio: dc + 3,
    vencimiento:  dc + dg - 1,
    mora:         dc + dg,
  };
}

function buildMensajes(form, clubNombre) {
  const nombre   = 'Juan Pérez';
  const valor    = Number(form.valor_mensualidad);
  const pen      = Number(form.penalidad_mora);
  const llave    = form.llave_pago;
  const club     = clubNombre || 'Tu Club';
  const ahora    = new Date();
  const mesActual = MESES[ahora.getMonth() + 1];
  const mesSig    = MESES[ahora.getMonth() === 11 ? 1 : ahora.getMonth() + 2];
  const anio      = ahora.getFullYear();
  const fmt       = (n) => Number(n).toLocaleString('es-CO');
  const pagLink   = llave ? `📲 Paga con la llave:\n🔑 ${llave}` : '';
  const d         = calcDias(form);

  return [
    {
      dia: `Día ${d.preventivo}`, tipo: 'Preventivo', color: '#8B5CF6', showQr: false,
      texto:
        `⚽ *${club} te avisa con tiempo*\n\n` +
        `Hola ${nombre}, tu cuota de *${mesSig} ${anio}* se activará el día ${d.cobro}.\n\n` +
        `💰 Valor: *$${fmt(valor)}*\n\n` +
        `⏳ Organízate desde ya y evita recargos innecesarios.\n\n` +
        `En ${club} jugamos en equipo… y estar al día es parte del juego 💙⚽`,
    },
    {
      dia: `Día ${d.cobro}`, tipo: 'Cobro activo', color: '#3B82F6', showQr: true,
      texto:
        `📢⚽ *${club} — Cuota activa*\n\n` +
        `Hola ${nombre}, tu cuota de *${mesActual}* ya está activa.\n\n` +
        `💰 Valor: *$${fmt(valor)}*\n` +
        `📅 Tienes hasta el *día ${d.vencimiento}* para pagar sin penalidad\n\n` +
        (pagLink ? pagLink + '\n\n' : '') +
        `💪 Paga hoy y juega tranquilo todo el mes ⚽🔥`,
    },
    {
      dia: `Día ${d.recordatorio}`, tipo: 'Recordatorio', color: '#F59E0B', showQr: true,
      texto:
        `⏰⚽ *${club} te recuerda*\n\n` +
        `Hola ${nombre}, te quedan *3 días* para pagar tu cuota de *${mesActual}*.\n\n` +
        `💰 Valor: *$${fmt(valor)}*\n` +
        `⚠️ Evita una penalidad de *$${fmt(pen)}*\n\n` +
        (pagLink ? pagLink + '\n\n' : '') +
        `🔥 No lo dejes para el último minuto… el equipo cuenta contigo ⚽💪`,
    },
    {
      dia: `Día ${d.vencimiento}`, tipo: 'Vencimiento', color: '#EF4444', showQr: true,
      texto:
        `🚨⚽ *HOY es el último día — ${club}*\n\n` +
        `Hola ${nombre}, hoy vence tu cuota de *${mesActual}*.\n\n` +
        `💰 Valor: *$${fmt(valor)}*\n` +
        `⚠️ Mañana tendrás penalidad de *$${fmt(pen)}*\n\n` +
        (pagLink ? pagLink + '\n\n' : '') +
        `⏳ Estás a una jugada de seguir al día… no pierdas este partido ⚽🔥`,
    },
    {
      dia: `Día ${d.mora}`, tipo: 'Mora', color: '#EF4444', showQr: true,
      texto:
        `🚫⚽ *${club} — Estado en mora*\n\n` +
        `Hola ${nombre}, tu cuota de *${mesActual} ${anio}* ya está vencida.\n\n` +
        `💰 Total a pagar: *$${fmt(valor + pen)}*\n` +
        `(incluye penalidad de $${fmt(pen)})\n\n` +
        (pagLink ? pagLink + '\n\n' : '') +
        `🔁 Entre más pronto pagues, más rápido vuelves al juego ⚽`,
    },
  ];
}

function WaBubble({ texto, qrUrl, color }) {
  const lines = texto.split('\n');
  return (
    <div style={{
      background: '#1A2744', borderRadius: '12px 12px 12px 4px',
      padding: '10px 13px', maxWidth: '100%',
      border: `1px solid rgba(255,255,255,0.07)`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      {qrUrl && (
        <div style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', maxWidth: 160 }}>
          <img src={qrUrl} alt="QR pago" style={{ width: '100%', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }} />
        </div>
      )}
      <div style={{ fontSize: 12.5, color: '#E2E8F4', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {lines.map((line, i) => {
          const parts = line.split(/(\*[^*]+\*)/g);
          return (
            <span key={i}>
              {parts.map((p, j) =>
                p.startsWith('*') && p.endsWith('*')
                  ? <strong key={j} style={{ color: '#fff' }}>{p.slice(1, -1)}</strong>
                  : <span key={j}>{p}</span>
              )}
              {i < lines.length - 1 && '\n'}
            </span>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: '#4A5568', textAlign: 'right', marginTop: 4 }}>
        {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} ✓✓
      </div>
    </div>
  );
}

export default function CobroConfigModal({ color = '#E14924', clubConfig, onClose, onSaved }) {
  const c = color;
  const [tab, setTab] = useState('config');

  const [form, setForm] = useState({
    whatsapp:          clubConfig?.whatsapp          || '',
    llave_pago:        clubConfig?.llave_pago         || '',
    qr_pago_url:       clubConfig?.qr_pago_url        || '',
    valor_mensualidad: clubConfig?.valor_mensualidad  ?? 0,
    penalidad_mora:    clubConfig?.penalidad_mora      ?? 0,
    dias_gracia_mora:  clubConfig?.dias_gracia_mora    ?? 0,
    dia_cobro:         clubConfig?.dia_cobro           ?? 1,
    cuenta_banco:      clubConfig?.cuenta_bancaria?.banco  || '',
    cuenta_tipo:       clubConfig?.cuenta_bancaria?.tipo   || '',
    cuenta_numero:     clubConfig?.cuenta_bancaria?.numero || '',
    razon_social:      clubConfig?.razon_social       || '',
    nit:               clubConfig?.nit                || '',
  });

  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);
  const [activeMsg,   setActiveMsg]   = useState(0);
  const [aplicarAPendientes, setAplicarAPendientes] = useState(false);
  const [actualizadasMsg,    setActualizadasMsg]    = useState('');
  const [becadosAfectados,   setBecadosAfectados]   = useState(null); // null = modal cerrado
  const qrRef = useRef(null);

  const overlayRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (e.target === overlayRef.current) onClose?.(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const uploadQR = async (file) => {
    setUploadingQR(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `clubs/${getClubId()}/qr-pago.${ext}`;
      const { error } = await supabase.storage.from('club-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('club-assets').getPublicUrl(path);
      set('qr_pago_url', publicUrl);
    } catch (err) {
      console.error('Error subiendo QR:', err);
    } finally {
      setUploadingQR(false);
    }
  };

  const valorCambio = Number(form.valor_mensualidad) !== Number(clubConfig?.valor_mensualidad ?? 0);

  const aplicarMensualidadPendientes = async () => {
    const resp = await authFetch(`${API_BASE}/config/aplicar-mensualidad-pendientes?club_id=${getClubId()}`, {
      method: 'POST',
    });
    const data = await resp.json();
    return data.success ? (data.actualizadas || 0) : 0;
  };

  const handleSave = async () => {
    setSaving(true);
    setActualizadasMsg('');
    try {
      await authFetch(`${API_BASE}/config?club_id=${getClubId()}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          whatsapp:          form.whatsapp          || null,
          llave_pago:        form.llave_pago         || null,
          qr_pago_url:       form.qr_pago_url        || null,
          valor_mensualidad: Number(form.valor_mensualidad),
          penalidad_mora:    Number(form.penalidad_mora),
          dias_gracia_mora:  Number(form.dias_gracia_mora),
          dia_cobro:         Math.min(25, Math.max(1, Number(form.dia_cobro) || 1)),
          cuenta_bancaria:   (form.cuenta_numero || form.cuenta_banco)
            ? { banco: form.cuenta_banco || null, tipo: form.cuenta_tipo || null, numero: form.cuenta_numero || null }
            : null,
          razon_social:      form.razon_social || null,
          nit:               form.nit          || null,
        }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();

      if (aplicarAPendientes && valorCambio) {
        // Los jugadores con beca/descuento activo no se tocan de una — se le pide al
        // admin que revise/edite su valor en un modal aparte antes de aplicar nada.
        const respBecados = await authFetch(
          `${API_BASE}/config/jugadores-con-descuento-afectados?club_id=${getClubId()}&nuevo_valor=${Number(form.valor_mensualidad)}`
        );
        const dataBecados = await respBecados.json();
        const becados = dataBecados.success ? (dataBecados.data || []) : [];

        if (becados.length > 0) {
          setBecadosAfectados(becados);
        } else {
          const actualizadas = await aplicarMensualidadPendientes();
          setActualizadasMsg(`${actualizadas} mensualidad(es) pendiente(s) actualizada(s) al nuevo valor.`);
        }
      }
    } catch (err) {
      console.error('Error guardando config cobro:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDescuentos = async (valores) => {
    await authFetch(`${API_BASE}/config/aplicar-descuentos-masivo?club_id=${getClubId()}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ valores }),
    });
    const actualizadas = await aplicarMensualidadPendientes();
    setActualizadasMsg(`${valores.length} jugador(es) con beca actualizado(s), ${actualizadas} mensualidad(es) más al nuevo valor.`);
    setBecadosAfectados(null);
  };

  const mensajes = buildMensajes(form, clubConfig?.nombre);
  const msgActual = mensajes[activeMsg];

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '10px 13px',
    color: '#fff', fontSize: 13, outline: 'none',
  };
  const lbl = {
    display: 'block', fontSize: 11, color: '#8B95A3',
    marginBottom: 5, fontWeight: 500, letterSpacing: 0.3,
  };

  return (
    <>
    <div
      ref={overlayRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(4,6,12,0.80)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: '#0D1627', borderRadius: 18,
        border: `1px solid ${c}30`,
        boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 48px ${c}12`,
        width: '100%', maxWidth: 520, maxHeight: '92vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        {/* Header */}
        <div style={{ padding: '18px 22px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={16} color={c} strokeWidth={1.8} />
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>Cobro automático WA</p>
                <p style={{ color: '#8B95A3', fontSize: 11, margin: '2px 0 0' }}>Ciclo de mensajes automatizados</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8B95A3', cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[
              { id: 'config',  Icon: Settings2, label: 'Configuración' },
              { id: 'preview', Icon: Eye,        label: 'Ver mensajes'  },
            ].map(({ id, Icon, label }) => (
              <button key={id} onClick={() => setTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', fontSize: 12, fontWeight: tab === id ? 700 : 500,
                  color: tab === id ? c : '#8B95A3',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: tab === id ? `2px solid ${c}` : '2px solid transparent',
                  marginBottom: -1, transition: 'color 0.2s',
                }}>
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB CONFIGURACIÓN ── */}
        {tab === 'config' && (
          <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Mensualidad</label>
                <input type="number" min={0} value={form.valor_mensualidad}
                  onChange={e => set('valor_mensualidad', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Penalidad mora</label>
                <input type="number" min={0} value={form.penalidad_mora}
                  onChange={e => set('penalidad_mora', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Días de gracia</label>
                <input type="number" min={0} max={30} value={form.dias_gracia_mora}
                  onChange={e => set('dias_gracia_mora', e.target.value)} style={inp} />
              </div>
            </div>

            {valorCambio && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 13px', background: `${c}0d`, border: `1px solid ${c}30`, borderRadius: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={aplicarAPendientes}
                  onChange={e => setAplicarAPendientes(e.target.checked)}
                  style={{ marginTop: 2, cursor: 'pointer' }} />
                <span style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
                  Aplicar este nuevo valor a las mensualidades <strong>pendientes o en mora</strong> del mes actual en adelante.
                  No afecta lo ya pagado ni meses anteriores.
                </span>
              </label>
            )}
            {actualizadasMsg && (
              <p style={{ fontSize: 11.5, color: '#00D084', margin: 0 }}>✓ {actualizadasMsg}</p>
            )}

            {/* ── Día de cobro ── */}
            {(() => {
              const d = calcDias(form);
              return (
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#CBD5E1', letterSpacing: 0.3 }}>
                    📅 Día de cobro mensual
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 100 }}>
                      <label style={lbl}>Día del mes (1–25)</label>
                      <input type="number" min={1} max={25} value={form.dia_cobro}
                        onChange={e => set('dia_cobro', e.target.value)} style={inp} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {[
                        { label: `Día ${d.preventivo}`, sub: 'Aviso previo', color: '#8B5CF6' },
                        { label: `Día ${d.cobro}`,        sub: 'Cobro activo', color: '#3B82F6' },
                        { label: `Día ${d.recordatorio}`, sub: 'Recordatorio', color: '#F59E0B' },
                        { label: `Día ${d.vencimiento}`,  sub: 'Vencimiento',  color: '#EF4444' },
                        { label: `Día ${d.mora}`,         sub: 'Mora',         color: '#EF4444' },
                      ].map((step, i, arr) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: step.color }}>{step.label}</div>
                            <div style={{ fontSize: 9, color: '#8B95A3' }}>{step.sub}</div>
                          </div>
                          {i < arr.length - 1 && <div style={{ color: '#4A5568', fontSize: 10, marginBottom: 8 }}>→</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: '#8B95A3', margin: 0 }}>
                    Define el día del mes en que se activa la cuota. Los mensajes de recordatorio y mora se calculan automáticamente.
                  </p>
                </div>
              );
            })()}

            <div>
              <label style={lbl}>Tu WhatsApp (recibe alertas de mora)</label>
              <input type="tel" value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 573001234567" style={inp} />
            </div>

            <div>
              <label style={lbl}>Llave de pago (Nequi / Bancolombia)</label>
              <input value={form.llave_pago}
                onChange={e => set('llave_pago', e.target.value.trim())}
                placeholder="Ej: 3001234567 o 0087276387" style={inp} />
              <p style={{ fontSize: 11, color: '#8B95A3', marginTop: 5, marginBottom: 0 }}>
                Aparece en cada mensaje de cobro para que el jugador pague directo.
              </p>
            </div>

            {/* ── Cuenta bancaria ── */}
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#CBD5E1', letterSpacing: 0.3 }}>
                🏦 Cuenta bancaria (transferencia)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Razón social</label>
                  <input value={form.razon_social}
                    onChange={e => set('razon_social', e.target.value)}
                    placeholder="Ej: Corp. Mi Club"
                    style={inp} />
                </div>
                <div>
                  <label style={lbl}>NIT</label>
                  <input value={form.nit}
                    onChange={e => set('nit', e.target.value)}
                    placeholder="Ej: 901906743"
                    style={inp} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Banco</label>
                  <input value={form.cuenta_banco}
                    onChange={e => set('cuenta_banco', e.target.value)}
                    placeholder="Ej: Bancolombia, BBVA…"
                    style={inp} />
                </div>
                <div>
                  <label style={lbl}>Tipo de cuenta</label>
                  <input value={form.cuenta_tipo}
                    onChange={e => set('cuenta_tipo', e.target.value)}
                    placeholder="Ahorros / Corriente"
                    style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Número de cuenta</label>
                <input value={form.cuenta_numero}
                  onChange={e => set('cuenta_numero', e.target.value.replace(/\s/g, ''))}
                  placeholder="Ej: 12345678901"
                  style={inp} />
              </div>
              <p style={{ fontSize: 11, color: '#8B95A3', margin: 0 }}>
                El bot mostrará estos datos cuando el jugador pregunte cómo pagar. Funciona para cualquier país.
              </p>
            </div>

            <div>
              <label style={lbl}>QR de pago (Nequi / Bancolombia)</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div onClick={() => qrRef.current?.click()}
                  style={{
                    width: 72, height: 72, borderRadius: 12, flexShrink: 0, overflow: 'hidden', cursor: 'pointer',
                    background: form.qr_pago_url ? 'transparent' : `${c}10`,
                    border: `2px dashed ${c}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  {form.qr_pago_url
                    ? <img src={form.qr_pago_url} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => set('qr_pago_url', '')} />
                    : uploadingQR
                      ? <Loader2 size={22} color={c} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Camera size={22} color={`${c}80`} strokeWidth={1.5} />}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => qrRef.current?.click()} disabled={uploadingQR}
                    style={{ padding: '8px 12px', background: `${c}18`, border: `1px solid ${c}30`, borderRadius: 9, color: c, fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Camera size={12} />
                    {uploadingQR ? 'Subiendo…' : 'Subir QR'}
                  </button>
                  <input value={form.qr_pago_url}
                    onChange={e => set('qr_pago_url', e.target.value)}
                    placeholder="O pega un URL del QR"
                    style={{ ...inp, padding: '8px 11px', fontSize: 12 }} />
                </div>
              </div>
              <input ref={qrRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && uploadQR(e.target.files[0])} />
              <p style={{ fontSize: 11, color: '#8B95A3', marginTop: 8, marginBottom: 0 }}>
                Se adjunta automáticamente como imagen en los mensajes de cobro.
              </p>
            </div>

            <div style={{ padding: '10px 13px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 9 }}>
              <Info size={13} color="#8B95A3" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: '#8B95A3', margin: 0, lineHeight: 1.65 }}>
                Los mensajes se envían automáticamente a los jugadores. La llave y el QR se incluyen para que puedan pagar de inmediato.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB PREVIEW MENSAJES ── */}
        {tab === 'preview' && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

            {/* Selector de día */}
            <div style={{ padding: '14px 22px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {mensajes.map((m, i) => (
                <button key={i} onClick={() => setActiveMsg(i)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: activeMsg === i ? m.color : 'rgba(255,255,255,0.05)',
                    border: activeMsg === i ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: activeMsg === i ? '#fff' : '#8B95A3',
                    cursor: 'pointer', transition: 'background 0.2s, color 0.2s',
                  }}>
                  {m.dia}
                </button>
              ))}
            </div>

            {/* Pantalla WA simulada */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Header tipo WA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#075E54', borderRadius: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  ⚽
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0 }}>{clubConfig?.nombre || 'Tu Club'}</p>
                  <p style={{ color: '#B2DFDB', fontSize: 11, margin: '1px 0 0' }}>ZenSports · Cobro automático</p>
                </div>
              </div>

              {/* Etiqueta del día */}
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: '#8B95A3', background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: 10 }}>
                  {msgActual.dia} · {msgActual.tipo}
                </span>
              </div>

              {/* Burbuja del mensaje */}
              <WaBubble
                texto={msgActual.texto}
                qrUrl={form.qr_pago_url && msgActual.showQr ? form.qr_pago_url : null}
                color={c}
              />

              {/* Nota */}
              <p style={{ fontSize: 11, color: '#4A5568', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
                Vista previa con datos de ejemplo.<br />
                Los mensajes reales usan el nombre e historial de cada jugador.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '14px 22px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {tab === 'preview' ? (
            <button onClick={() => setTab('config')}
              style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#8B95A3', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
              ← Editar configuración
            </button>
          ) : (
            <button onClick={onClose}
              style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#8B95A3', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
              Cancelar
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            style={{
              padding: '9px 22px', background: c, border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.7 : 1,
              boxShadow: `0 4px 16px ${c}40`,
            }}>
            <Save size={14} />
            {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>

    {becadosAfectados && (
      <ModalDescuentosAfectados
        color={c}
        becados={becadosAfectados}
        onClose={() => setBecadosAfectados(null)}
        onConfirm={handleConfirmDescuentos}
      />
    )}
    </>
  );
}
