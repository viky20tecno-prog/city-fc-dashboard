import { useState, useEffect, useRef, useCallback } from 'react';
import { Smartphone, CheckCircle, XCircle, Loader, RefreshCw, AlertTriangle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getClubId } from '../services/api';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const ESTADO_LABEL = {
  STOPPED:      'Desconectado',
  STARTING:     'Iniciando…',
  SCAN_QR_CODE: 'Esperando escaneo',
  WORKING:      'Conectado',
  FAILED:       'Error de conexión',
};

async function apiCall(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const clubId = getClubId();
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${API}${path}${sep}club_id=${clubId}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  return res.json();
}

export default function WahaConnect({ clubConfig, onConectado }) {
  const plan = (clubConfig?.plan || 'trial').toLowerCase();
  const planOk = plan === 'pro' || plan === 'scale';

  const [fase, setFase]       = useState('idle');   // idle | conectando | qr | exito | error
  const [status, setStatus]   = useState(null);      // STOPPED | STARTING | SCAN_QR_CODE | WORKING | FAILED
  const [qrSrc, setQrSrc]     = useState(null);
  const [me, setMe]           = useState(null);      // { id, pushName }
  const [msg, setMsg]         = useState('');
  const [loading, setLoading] = useState(false);
  const pollRef               = useRef(null);

  // Si ya tiene sesión configurada, verificar su estado real al montar
  useEffect(() => {
    if (planOk && clubConfig?.waha_session) {
      consultarEstado();
    }
    return () => clearInterval(pollRef.current);
  }, []);

  const detenerPoll = () => clearInterval(pollRef.current);

  const consultarEstado = useCallback(async () => {
    const d = await apiCall('/waha/estado');
    if (!d.success) return;
    setStatus(d.status);
    setMe(d.me);
    if (d.status === 'WORKING') {
      setFase('exito');
      detenerPoll();
      onConectado?.();
    } else if (d.status === 'SCAN_QR_CODE') {
      setFase('qr');
      fetchQr();
    } else if (d.status === 'FAILED') {
      setFase('error');
      setMsg('La sesión falló. Intenta reconectar.');
      detenerPoll();
    }
  }, [onConectado]);

  const fetchQr = async () => {
    const d = await apiCall('/waha/qr');
    if (d.success && d.qr) setQrSrc(d.qr);
  };

  const iniciarPoll = useCallback(() => {
    detenerPoll();
    pollRef.current = setInterval(async () => {
      await consultarEstado();
      if (fase === 'qr') fetchQr();
    }, 3000);
  }, [consultarEstado, fase]);

  const conectar = async () => {
    setLoading(true);
    setMsg('');
    setQrSrc(null);
    const d = await apiCall('/waha/conectar', { method: 'POST' });
    setLoading(false);
    if (!d.success) {
      setMsg(d.error || 'Error al iniciar sesión');
      setFase('error');
      return;
    }
    setFase('qr');
    setStatus('STARTING');
    iniciarPoll();
  };

  const desconectar = async () => {
    if (!confirm('¿Desconectar WhatsApp? Los recordatorios automáticos dejarán de enviarse desde tu número.')) return;
    setLoading(true);
    detenerPoll();
    const d = await apiCall('/waha/desconectar', { method: 'DELETE' });
    setLoading(false);
    if (d.success) {
      setFase('idle');
      setStatus('STOPPED');
      setQrSrc(null);
      setMe(null);
    } else {
      setMsg(d.error || 'Error al desconectar');
    }
  };

  const reintentar = () => {
    setFase('idle');
    setStatus(null);
    setMsg('');
    setQrSrc(null);
  };

  // ── Bloqueado por plan ─────────────────────────────────────────────────────
  if (!planOk) {
    return (
      <div className="rounded-2xl border border-[var(--border-sub)] bg-[var(--bg-card)] p-6 flex flex-col items-center gap-3 text-center">
        <Lock className="w-8 h-8 text-[var(--text-sec)]" />
        <p className="text-sm font-semibold text-[var(--text-pri)]">Conecta tu propio WhatsApp</p>
        <p className="text-xs text-[var(--text-sec)] max-w-xs">
          Envía recordatorios y plantillas desde el número de tu club, no del número central de ZenSports.
          Disponible en planes <strong>Pro</strong> y <strong>Scale</strong>.
        </p>
        <span className="text-xs px-3 py-1 rounded-full bg-[var(--cc)]/10 text-[var(--cc)] font-medium border border-[var(--cc)]/20">
          Tu plan: {plan.toUpperCase()}
        </span>
      </div>
    );
  }

  // ── Conectado ──────────────────────────────────────────────────────────────
  if (fase === 'exito' || (status === 'WORKING' && clubConfig?.waha_session)) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex items-start gap-4">
        <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-400">WhatsApp conectado</p>
          <p className="text-xs text-[var(--text-sec)] mt-0.5">
            Sesión: <span className="font-mono text-[var(--text-pri)]">{clubConfig?.waha_session}</span>
            {me?.pushName && <> · <span className="text-[var(--text-pri)]">{me.pushName}</span></>}
          </p>
          <p className="text-xs text-[var(--text-sec)] mt-1">
            Los recordatorios y plantillas salen desde tu número.
          </p>
        </div>
        <button
          onClick={desconectar}
          disabled={loading}
          className="flex-shrink-0 text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          {loading ? 'Desconectando…' : 'Desconectar'}
        </button>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (fase === 'error') {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 flex items-start gap-4">
        <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-400">Error de conexión</p>
          <p className="text-xs text-[var(--text-sec)] mt-0.5">{msg}</p>
        </div>
        <button
          onClick={reintentar}
          className="flex-shrink-0 text-xs text-[var(--text-sec)] hover:text-[var(--text-pri)] border border-[var(--border-sub)] px-3 py-1.5 rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ── QR esperando escaneo ───────────────────────────────────────────────────
  if (fase === 'qr') {
    return (
      <div className="rounded-2xl border border-[var(--border-sub)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <p className="text-sm font-semibold text-[var(--text-pri)]">
            {ESTADO_LABEL[status] || 'Conectando…'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* QR image */}
          <div className="flex-shrink-0">
            {qrSrc ? (
              <img
                src={qrSrc}
                alt="QR WhatsApp"
                className="w-52 h-52 rounded-xl border border-[var(--border-sub)] bg-white p-2"
              />
            ) : (
              <div className="w-52 h-52 rounded-xl border border-[var(--border-sub)] bg-[var(--bg-app)] flex items-center justify-center">
                <Loader className="w-8 h-8 text-[var(--text-sec)] animate-spin" />
              </div>
            )}
          </div>

          {/* Instrucciones */}
          <div className="flex-1 space-y-3 text-sm text-[var(--text-sec)]">
            <p className="font-semibold text-[var(--text-pri)]">Escanea con WhatsApp</p>
            <ol className="space-y-2 list-none">
              {[
                'Abre WhatsApp en el celular del club',
                'Ve a Configuración → Dispositivos vinculados',
                'Toca "Vincular un dispositivo"',
                'Apunta la cámara al código QR',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--cc)]/15 text-[var(--cc)] text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="text-xs text-yellow-400/80 flex items-center gap-1.5 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              El QR se renueva automáticamente cada 20 segundos.
            </p>
            <button
              onClick={reintentar}
              className="flex items-center gap-1.5 text-xs text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors mt-3"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Cancelar y volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Estado idle — botón conectar ───────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-[var(--border-sub)] bg-[var(--bg-card)] p-5 flex items-start gap-4">
      <Smartphone className="w-6 h-6 text-[var(--cc)] flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--text-pri)]">Conecta tu WhatsApp</p>
        <p className="text-xs text-[var(--text-sec)] mt-0.5">
          Los recordatorios y plantillas saldrán desde el número de tu club, no del número central de ZenSports.
        </p>
      </div>
      <button
        onClick={conectar}
        disabled={loading}
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--cc)] text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
        {loading ? 'Iniciando…' : 'Conectar'}
      </button>
    </div>
  );
}
