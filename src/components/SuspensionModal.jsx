import { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle, Plane, Clock, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const MOTIVOS = [
  { valor: 'LESION',          label: 'Lesión',         icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-400/10    border-red-400/40'    },
  { valor: 'VIAJE',           label: 'Viaje',           icon: Plane,         color: 'text-[var(--cc)]', bg: 'bg-[var(--cc)]/10 border-[var(--cc)]/40' },
  { valor: 'RETIRO_TEMPORAL', label: 'Retiro temporal', icon: Clock,         color: 'text-yellow-400',  bg: 'bg-yellow-400/10 border-yellow-400/40'  },
  { valor: 'OTRO',            label: 'Otro',            icon: HelpCircle,    color: 'text-gray-400',    bg: 'bg-gray-400/10   border-gray-400/40'    },
];

const MOTIVO_LABEL_CORTO = {
  LESION:         'Lesión',
  VIAJE:          'Viaje',
  RETIRO_TEMPORAL:'Retiro',
  OTRO:           'Otro',
};

const anioActual = new Date().getFullYear();

export default function SuspensionModal({ jugador, onClose, onSuccess }) {
  const [suspensiones, setSuspensiones]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [anio, setAnio]                     = useState(anioActual);

  // Popover para activar un mes
  const [popoverMes, setPopoverMes]         = useState(null);
  const [popoverMotivo, setPopoverMotivo]   = useState('');
  const [popoverDetalle, setPopoverDetalle] = useState('');
  const [enviando, setEnviando]             = useState(false);

  // Confirmación para desactivar rango heredado
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(null); // { mes, suspension }

  const [cancelando, setCancelando] = useState(null);

  useEffect(() => { cargarSuspensiones(); }, []);

  const cargarSuspensiones = async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`${API_BASE}/suspensiones?club_id=${getClubId()}&cedula=${jugador.cedula}`);
      const data = await res.json();
      if (data.success) setSuspensiones(data.data);
    } catch { /* silencioso */ } finally { setLoading(false); }
  };

  // Mapa mes→suspension para el año seleccionado (expande rangos heredados)
  const mesesMap = useMemo(() => {
    const map = {};
    suspensiones
      .filter(s => s.activa && s.anio === anio)
      .forEach(s => {
        for (let m = s.mes_inicio; m <= s.mes_fin; m++) {
          map[m] = s;
        }
      });
    return map;
  }, [suspensiones, anio]);

  const totalSuspendidos = Object.keys(mesesMap).length;

  const handleChipClick = (mes) => {
    const suspension = mesesMap[mes];
    if (suspension) {
      const esRango = suspension.mes_inicio !== suspension.mes_fin;
      if (esRango) {
        setConfirmarDesactivar({ mes, suspension });
      } else {
        handleCancelar(suspension.id);
      }
    } else {
      setPopoverMes(mes);
      setPopoverMotivo('');
      setPopoverDetalle('');
    }
  };

  const handleCancelar = async (id) => {
    setCancelando(id);
    setConfirmarDesactivar(null);
    try {
      const res  = await authFetch(`${API_BASE}/suspensiones/${id}?club_id=${getClubId()}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { await cargarSuspensiones(); onSuccess?.(); }
    } catch { /* silencioso */ } finally { setCancelando(null); }
  };

  const handleConfirmarSuspension = async () => {
    if (!popoverMotivo) return;
    setEnviando(true);
    try {
      const res  = await authFetch(`${API_BASE}/suspensiones?club_id=${getClubId()}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          cedula:     jugador.cedula,
          motivo:     popoverMotivo,
          detalle:    popoverDetalle,
          mes_inicio: popoverMes,
          mes_fin:    popoverMes,
          anio,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPopoverMes(null);
        await cargarSuspensiones();
        onSuccess?.();
      }
    } catch { /* silencioso */ } finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-app)]/60 flex items-center justify-center z-[1000] p-4">
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-sub)] w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-sub)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-pri)]">Gestión de Suspensión</h2>
            <p className="text-sm text-[var(--text-sec)]">{jugador.nombreCompleto} · CC {jugador.cedula}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Selector de año */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setAnio(a => a - 1); setPopoverMes(null); setConfirmarDesactivar(null); }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[var(--text-pri)]">{anio}</span>
            <button
              onClick={() => { setAnio(a => a + 1); setPopoverMes(null); setConfirmarDesactivar(null); }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid de chips */}
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {MESES.map((nombre, i) => {
                const mes        = i + 1;
                const suspension = mesesMap[mes];
                const motivo     = suspension ? MOTIVOS.find(m => m.valor === suspension.motivo) : null;
                const esCancelando = suspension && cancelando === suspension.id;
                const esPopover  = popoverMes === mes;
                const esConfirmar = confirmarDesactivar?.mes === mes;

                return (
                  <button
                    key={mes}
                    onClick={() => handleChipClick(mes)}
                    disabled={!!esCancelando}
                    title={
                      suspension
                        ? `${motivo?.label || suspension.motivo}${suspension.detalle ? ': ' + suspension.detalle : ''}${suspension.mes_inicio !== suspension.mes_fin ? ` (rango ${MESES[suspension.mes_inicio-1]}–${MESES[suspension.mes_fin-1]})` : ''}`
                        : 'Click para suspender este mes'
                    }
                    className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 rounded-xl text-xs font-medium border transition-all ${
                      esCancelando
                        ? 'opacity-40 cursor-wait bg-yellow-400/10 border-yellow-400/40 text-yellow-400'
                        : suspension
                          ? `bg-yellow-400/10 border-yellow-400/40 text-yellow-400 ${esConfirmar ? 'ring-2 ring-yellow-400/60' : 'hover:bg-yellow-400/20'}`
                          : `bg-[var(--bg-app)] border-[var(--border-sub)] text-[var(--text-sec)] hover:border-[var(--cc)]/50 hover:text-[var(--text-pri)] ${esPopover ? 'border-[var(--cc)]/50 text-[var(--text-pri)]' : ''}`
                    }`}
                  >
                    <span>{nombre.slice(0, 3)}</span>
                    {suspension && (
                      <span className="text-[9px] opacity-70 leading-none">
                        {MOTIVO_LABEL_CORTO[suspension.motivo] || 'Susp.'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Leyenda */}
          <div className="flex items-center gap-4 text-xs text-[var(--text-sec)]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[var(--bg-app)] border border-[var(--border-sub)] inline-block" />
              Normal · cobra
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-yellow-400/20 border border-yellow-400/40 inline-block" />
              Suspendido · no cobra
            </span>
          </div>

          {/* Resumen de meses suspendidos */}
          {totalSuspendidos > 0 && (
            <div className="p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20 text-xs text-yellow-400/80">
              {totalSuspendidos} mes{totalSuspendidos > 1 ? 'es' : ''} suspendido{totalSuspendidos > 1 ? 's' : ''} en {anio} — mensualidad no cobrada
            </div>
          )}

          {/* Popover: seleccionar motivo para activar un mes */}
          {popoverMes && (
            <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--cc)]/30 space-y-3">
              <p className="text-sm font-semibold text-[var(--text-pri)]">
                {MESES[popoverMes - 1]} {anio} — ¿Motivo?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MOTIVOS.map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.valor}
                      onClick={() => setPopoverMotivo(m.valor)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        popoverMotivo === m.valor
                          ? m.bg + ' ' + m.color
                          : 'bg-[var(--bg-card)] border-[var(--border-sub)] text-[var(--text-sec)] hover:text-[var(--text-pri)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={popoverDetalle}
                onChange={e => setPopoverDetalle(e.target.value)}
                placeholder="Detalle opcional (ej: fractura tobillo)..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border-sub)] rounded-xl px-3 py-2 text-xs text-[var(--text-pri)] placeholder-[var(--text-sec)] focus:outline-none focus:border-[#00D084] transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setPopoverMes(null)}
                  className="flex-1 py-2 rounded-xl border border-[var(--border-sub)] text-xs text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarSuspension}
                  disabled={!popoverMotivo || enviando}
                  className="flex-1 py-2 rounded-xl bg-yellow-400 text-[#060C18] text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {enviando ? 'Guardando...' : 'Suspender mes'}
                </button>
              </div>
            </div>
          )}

          {/* Confirmación para desactivar rango heredado */}
          {confirmarDesactivar && (
            <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-yellow-400/30 space-y-3">
              <p className="text-xs text-yellow-400/90">
                ⚠️ Este mes pertenece a una suspensión{' '}
                <strong>
                  {MESES[confirmarDesactivar.suspension.mes_inicio - 1]}–{MESES[confirmarDesactivar.suspension.mes_fin - 1]} {anio}
                </strong>
                . Al desactivar se liberan todos los meses del rango.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmarDesactivar(null)}
                  className="flex-1 py-2 rounded-xl border border-[var(--border-sub)] text-xs text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleCancelar(confirmarDesactivar.suspension.id)}
                  disabled={!!cancelando}
                  className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors disabled:opacity-40"
                >
                  {cancelando ? 'Desactivando...' : 'Desactivar rango'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
