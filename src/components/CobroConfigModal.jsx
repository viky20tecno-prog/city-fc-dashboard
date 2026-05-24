import { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, Save, MessageCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getClubId } from '../services/api';
import { authFetch } from '../lib/authFetch';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';

export default function CobroConfigModal({ color = '#E14924', clubConfig, onClose, onSaved }) {
  const c = color;

  const [form, setForm] = useState({
    whatsapp:          clubConfig?.whatsapp          || '',
    llave_pago:        clubConfig?.llave_pago         || '',
    qr_pago_url:       clubConfig?.qr_pago_url        || '',
    valor_mensualidad: clubConfig?.valor_mensualidad  ?? 65000,
    penalidad_mora:    clubConfig?.penalidad_mora      ?? 10000,
    dias_gracia_mora:  clubConfig?.dias_gracia_mora    ?? 7,
  });

  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);
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

  const handleSave = async () => {
    setSaving(true);
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
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();
    } catch (err) {
      console.error('Error guardando config cobro:', err);
    } finally {
      setSaving(false);
    }
  };

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
        width: '100%', maxWidth: 500, maxHeight: '92vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={16} color={c} strokeWidth={1.8} />
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>Cobro automático WA</p>
              <p style={{ color: '#8B95A3', fontSize: 11, margin: '2px 0 0' }}>Configuración del ciclo de mensajes</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8B95A3', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Ciclo resumen */}
          <div style={{ padding: '12px 14px', background: `${c}08`, borderRadius: 12, border: `1px solid ${c}18` }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
              {[
                { dia: 'Día 27', txt: 'Aviso preventivo' },
                { dia: 'Día 1',  txt: 'Cuota activa' },
                { dia: 'Día 4',  txt: 'Recordatorio' },
                { dia: 'Día 7',  txt: 'Último aviso' },
                { dia: 'Día 8',  txt: 'Mora aplicada' },
              ].map(({ dia, txt }) => (
                <div key={dia} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}18`, padding: '2px 7px', borderRadius: 5 }}>{dia}</span>
                  <span style={{ fontSize: 11, color: '#8B95A3' }}>{txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mensualidad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Mensualidad</label>
              <input type="number" min={0} value={form.valor_mensualidad}
                onChange={e => set('valor_mensualidad', e.target.value)}
                style={inp} />
            </div>
            <div>
              <label style={lbl}>Penalidad mora</label>
              <input type="number" min={0} value={form.penalidad_mora}
                onChange={e => set('penalidad_mora', e.target.value)}
                style={inp} />
            </div>
            <div>
              <label style={lbl}>Días de gracia</label>
              <input type="number" min={0} max={30} value={form.dias_gracia_mora}
                onChange={e => set('dias_gracia_mora', e.target.value)}
                style={inp} />
            </div>
          </div>

          {/* WhatsApp admin */}
          <div>
            <label style={lbl}>Tu WhatsApp (recibe alertas de mora)</label>
            <input type="tel" value={form.whatsapp}
              onChange={e => set('whatsapp', e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 573001234567"
              style={inp} />
          </div>

          {/* Llave de pago */}
          <div>
            <label style={lbl}>Llave de pago (Nequi / Bancolombia)</label>
            <input value={form.llave_pago}
              onChange={e => set('llave_pago', e.target.value.trim())}
              placeholder="Ej: 3001234567 o 0087276387"
              style={inp} />
            <p style={{ fontSize: 11, color: '#8B95A3', marginTop: 5, marginBottom: 0 }}>
              Aparece en cada mensaje de cobro para que el jugador pague directamente.
            </p>
          </div>

          {/* QR de pago */}
          <div>
            <label style={lbl}>QR de pago (Nequi / Bancolombia)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                onClick={() => qrRef.current?.click()}
                style={{
                  width: 72, height: 72, borderRadius: 12, flexShrink: 0, overflow: 'hidden', cursor: 'pointer',
                  background: form.qr_pago_url ? 'transparent' : `${c}10`,
                  border: `2px dashed ${c}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                {form.qr_pago_url
                  ? <img src={form.qr_pago_url} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => set('qr_pago_url', '')} />
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

          {/* Info */}
          <div style={{ padding: '10px 13px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 9 }}>
            <Info size={13} color="#8B95A3" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: '#8B95A3', margin: 0, lineHeight: 1.65 }}>
              Los mensajes se envían automáticamente a los jugadores. La llave y el QR se incluyen para que puedan pagar de inmediato.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose}
            style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#8B95A3', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            Cancelar
          </button>
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
  );
}
