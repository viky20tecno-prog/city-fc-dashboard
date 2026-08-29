import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Loader2, CheckCircle, ArrowLeftRight } from 'lucide-react';
import { authFetch } from '../../lib/authFetch';
import { API_BASE_URL } from '../../config';

const INPUT_CLS = 'w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-sub)] text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)]/50 placeholder-[var(--text-mut)]';

const nom = (j) => `${j?.nombre || ''} ${j?.apellidos || j?.['apellido(s)'] || ''}`.trim();

export default function CorregirCedulaModal({ jugador, clubId, onClose, onDone }) {
  const [nueva,    setNueva]   = useState('');
  const [entiendo, setEntiendo] = useState(false);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [swap,     setSwap]    = useState(null); // { nombre, apellidos, cedula } del otro jugador
  const [ok,       setOk]      = useState(null); // { swap, movidos }

  const cedulaActual = String(jugador.cedula);
  const nuevaTrim = nueva.trim();
  const puedeEnviar = nuevaTrim.length >= 3 && nuevaTrim !== cedulaActual && entiendo && !loading;

  async function enviar(confirmarSwap) {
    setLoading(true); setError('');
    try {
      const res = await authFetch(
        `${API_BASE_URL}/players/${encodeURIComponent(cedulaActual)}/corregir-cedula?club_id=${clubId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nueva_cedula: nuevaTrim, ...(confirmarSwap ? { confirmar_swap: true } : {}) }),
        },
      );
      const data = await res.json().catch(() => ({}));

      if (data.needs_swap) { setSwap(data.otro_jugador); setLoading(false); return; }
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo corregir la cédula.');

      setOk({ swap: !!data.swap, movidos: data.movidos || {} });
      onDone?.({ cedula: nuevaTrim });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const totalMovidos = ok ? Object.values(ok.movidos).reduce((a, b) => a + Number(b || 0), 0) : 0;

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-sub)] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-sub)]">
          <h3 className="text-sm font-bold text-[var(--text-pri)]">Corregir cédula</h3>
          <button onClick={onClose} className="text-[var(--text-mut)] hover:text-[var(--text-pri)] transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Éxito */}
          {ok ? (
            <div className="space-y-3 text-center py-2">
              <CheckCircle size={32} className="text-green-400 mx-auto" />
              <p className="text-sm text-[var(--text-pri)] font-medium">
                {ok.swap ? 'Cédulas intercambiadas' : 'Cédula corregida'}
              </p>
              <p className="text-xs text-[var(--text-sec)]">
                Se movieron {totalMovidos} registro{totalMovidos === 1 ? '' : 's'} (pagos, torneos, asistencia, uniformes).
              </p>
              <p className="text-[11px] text-amber-400 flex items-center gap-1 justify-center">
                <AlertTriangle size={11} /> Reemití el carnet y compartí de nuevo el link del portal.
              </p>
              <button onClick={onClose} className="w-full mt-2 py-2 rounded-lg bg-[var(--cc)] text-white text-sm font-semibold">
                Listo
              </button>
            </div>
          ) : swap ? (
            /* Confirmación de intercambio */
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-sec)] leading-relaxed">
                La cédula <strong className="text-[var(--text-pri)]">{nuevaTrim}</strong> ya está registrada
                en <strong className="text-[var(--text-pri)]">{nom(swap)}</strong>.
              </p>
              <p className="text-sm text-[var(--text-sec)] leading-relaxed">
                Si las cédulas de <strong className="text-[var(--text-pri)]">{nom(jugador)}</strong> y{' '}
                <strong className="text-[var(--text-pri)]">{nom(swap)}</strong> quedaron cruzadas, puedes intercambiarlas.
                Cada jugador conserva sus pagos, torneos, asistencia y uniformes.
              </p>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setSwap(null)} className="flex-1 py-2 rounded-lg border border-[var(--border-sub)] text-[var(--text-sec)] text-sm">
                  Volver
                </button>
                <button
                  onClick={() => enviar(true)}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-[var(--cc)] text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
                  Intercambiar
                </button>
              </div>
            </div>
          ) : (
            /* Formulario inicial */
            <>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[var(--text-mut)]">Cédula actual</p>
                <p className="text-sm text-[var(--text-sec)] font-mono">{cedulaActual}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-[var(--text-mut)]">Cédula correcta</label>
                <input
                  autoFocus
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  placeholder="Ej: 1234567890"
                  className={INPUT_CLS}
                />
              </div>

              <div className="flex gap-2 rounded-lg bg-amber-500/8 border border-amber-500/25 p-3">
                <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-[var(--text-sec)] leading-relaxed">
                  Se moverán los pagos, torneos, asistencia y uniformes de este jugador a la cédula nueva.
                  El <strong>carnet impreso</strong> y el <strong>link del portal</strong> que ya tenga
                  <strong> dejan de funcionar</strong> — hay que reemitirlos.
                </p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} className="mt-0.5" />
                <span className="text-[12px] text-[var(--text-sec)]">
                  Entiendo que hay que reemitir el carnet y el link del portal de este jugador.
                </span>
              </label>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                onClick={() => enviar(false)}
                disabled={!puedeEnviar}
                className="w-full py-2 rounded-lg bg-[var(--cc)] text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Corregir cédula
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
