import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, Circle, Loader2, Check, Calendar, Clock, Users, ChevronLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';

const fmt = (n) =>
  Math.round(Number(n)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const fmtFecha = (fecha) => {
  if (!fecha) return '';
  try {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  } catch {
    return fecha;
  }
};

const METODOS = [
  { id: 'EFECTIVO',      label: 'Efectivo',     emoji: '💵' },
  { id: 'TRANSFERENCIA', label: 'Transferencia', emoji: '📲' },
  { id: 'AGUAS',         label: 'Aguas',         emoji: '💧' },
];

export default function ArbitrajeGestionPagos({ clubId, partidoId: partidoIdProp }) {
  const [partidoId,  setPartidoId]  = useState(partidoIdProp || null);
  const [partidos,   setPartidos]   = useState([]);
  const [pagos,      setPagos]      = useState([]);
  const [resumen,    setResumen]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [loadingList,setLoadingList]= useState(false);
  const [error,      setError]      = useState(null);
  const [editando,   setEditando]   = useState(null);
  const [metodoPago, setMetodoPago] = useState('');
  const [guardando,  setGuardando]  = useState(false);

  // Si el prop cambia desde el padre (clic en "Ver pagos"), sincronizar
  useEffect(() => {
    if (partidoIdProp) setPartidoId(partidoIdProp);
  }, [partidoIdProp]);

  // Cargar lista de partidos cuando no hay uno seleccionado
  const fetchPartidos = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/arbitrage/partidos?club_id=${clubId}`);
      const data = await res.json();
      setPartidos(data.data || []);
    } catch (err) {
      console.error('Error cargando partidos:', err);
    } finally {
      setLoadingList(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (!partidoId) fetchPartidos();
  }, [partidoId, fetchPartidos]);

  // Cargar pagos y resumen del partido seleccionado
  const fetchData = useCallback(async () => {
    if (!partidoId) return;
    setLoading(true);
    setError(null);
    try {
      const [resPagos, resResumen] = await Promise.all([
        authFetch(`${API_BASE_URL}/arbitrage/pagos/${partidoId}?club_id=${clubId}`),
        authFetch(`${API_BASE_URL}/arbitrage/resumen/${partidoId}?club_id=${clubId}`),
      ]);
      const dataPagos   = await resPagos.json();
      const dataResumen = await resResumen.json();
      setPagos(dataPagos.pagos || []);
      setResumen(dataResumen);
    } catch (err) {
      setError('Error al cargar los datos del partido.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clubId, partidoId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRegistrarPago = async (cedula) => {
    if (!metodoPago) return;
    setGuardando(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/arbitrage/pagos?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partidoId, cedula, metodoPago, estadoPago: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setEditando(null);
      setMetodoPago('');
      await fetchData();
    } catch (err) {
      alert('Error al registrar el pago: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // ── Vista: selector de partidos ────────────────────────────────────────────
  if (!partidoId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[var(--text-pri)] font-semibold">Selecciona un partido</h3>
            <p className="text-xs text-[var(--text-sec)] mt-0.5">
              Elige el partido para gestionar los pagos de arbitraje
            </p>
          </div>
          <button
            onClick={fetchPartidos}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={13} className={loadingList ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-7 h-7 border-2 border-[var(--cc)] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Cargando partidos...</p>
          </div>
        ) : partidos.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">🏟️</div>
            <h3 className="text-[var(--text-pri)] font-semibold mb-2">No hay partidos registrados</h3>
            <p className="text-gray-400 text-sm">
              Ve a <span className="text-[var(--cc)]">Registrar Partido</span> para crear el primero.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {partidos.map((p) => {
              const pagados   = p.jugadoresCount ? undefined : undefined;
              const pct = undefined;
              return (
                <button
                  key={p.id}
                  onClick={() => setPartidoId(p.id)}
                  className="w-full text-left bg-[var(--bg-card)] border border-[var(--cc20)] rounded-xl p-5 hover:border-[var(--cc)] hover:bg-[var(--cc)]/5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[var(--text-pri)] font-semibold group-hover:text-[var(--cc)] transition-colors truncate mb-1.5">
                        {p.titulo}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        {p.fecha && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-green-500" />
                            {fmtFecha(p.fecha)}
                            {p.hora && <><Clock size={11} className="text-green-500 ml-1" />{p.hora}</>}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users size={11} className="text-blue-400" />
                          {p.equipoA} <span className="text-gray-600 mx-0.5">vs</span> {p.equipoB}
                        </span>
                        {p.jugadoresCount > 0 && (
                          <span className="flex items-center gap-1 text-gray-500">
                            {p.jugadoresCount} jugador{p.jugadoresCount !== 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[var(--cc)] font-bold text-sm">{fmt(p.montoTotal)}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{fmt(p.montoPorJugador)} c/u</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Loading de pagos ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-[var(--cc)] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Cargando información del partido...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-red-800/50 text-red-300 rounded-lg text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  const pct = resumen?.porcentajePagado || 0;

  return (
    <div className="space-y-5">

      {/* ── Botón volver al selector ─── */}
      <button
        onClick={() => { setPartidoId(null); setPagos([]); setResumen(null); setEditando(null); }}
        className="flex items-center gap-1.5 text-sm text-[var(--text-sec)] hover:text-[var(--cc)] transition-colors"
      >
        <ChevronLeft size={16} />
        Cambiar partido
      </button>

      {/* ── Resumen financiero ─────────────────────────────────────────────── */}
      {resumen && (
        <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Partido</p>
              <h3 className="text-[var(--text-pri)] font-bold text-base leading-tight">
                {resumen.titulo || 'Sin título'}
              </h3>
              {(resumen.equipoA || resumen.equipoB) && (
                <p className="text-gray-400 text-sm mt-0.5">
                  {resumen.equipoA}
                  <span className="text-gray-600 mx-1.5">vs</span>
                  {resumen.equipoB}
                </p>
              )}
              {resumen.fecha && (
                <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                  <Calendar size={11} />
                  {fmtFecha(resumen.fecha.split('T')[0])}
                </p>
              )}
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors shrink-0 mt-1"
            >
              <RefreshCw size={12} />
              Actualizar
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Progreso de cobro</span>
              <span className="text-[var(--text-pri)] font-medium">{pct}%</span>
            </div>
            <div className="h-2.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'var(--cc)' }}
              />
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Monto total',  value: fmt(resumen.montoTotal),    color: 'text-[var(--text-pri)]' },
              { label: 'Recaudado',    value: fmt(resumen.totalRecaudado), color: 'text-green-400' },
              { label: 'Pendiente',    value: fmt(resumen.faltante),       color: 'text-yellow-400' },
              { label: 'Sin pagar',    value: `${resumen.cantidadPendiente} de ${resumen.cantidadTotal}`, color: 'text-yellow-400' },
            ].map((m) => (
              <div key={m.label} className="bg-[var(--bg-surface)] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                <p className={`font-bold text-sm ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lista de jugadores ─────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cc20)] flex items-center justify-between">
          <h3 className="text-[var(--text-pri)] font-semibold">Lista de jugadores</h3>
          <span className="text-xs text-[var(--text-sec)]">{pagos.length} jugador{pagos.length !== 1 ? 'es' : ''}</span>
        </div>

        {pagos.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No hay jugadores asignados a este partido.
          </div>
        ) : (
          <div className="divide-y divide-[var(--cc20)]">
            {pagos.map((pago) => (
              <div key={pago.cedula} className="px-5 py-4">

                <div className="flex items-center gap-3">
                  {/* Icono estado */}
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    pago.estadoPago ? 'bg-green-500/15' : 'bg-[var(--bg-surface)]'
                  }`}>
                    {pago.estadoPago
                      ? <CheckCircle size={16} className="text-green-400" />
                      : <Circle size={16} className="text-gray-600" />
                    }
                  </div>

                  {/* Nombre y cédula */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-pri)] text-sm font-medium truncate">{pago.nombre}</p>
                    <p className="text-gray-500 text-xs">{pago.cedula}</p>
                  </div>

                  {/* Valor */}
                  <div className="text-center px-3 shrink-0">
                    <p className="text-[var(--text-pri)] font-bold text-sm">{fmt(pago.valor)}</p>
                  </div>

                  {/* Estado / botón */}
                  <div className="shrink-0 text-right min-w-[110px]">
                    {pago.estadoPago ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-green-400 bg-green-500/10 font-medium">
                        <Check size={11} />
                        {pago.metodoPago}
                      </span>
                    ) : editando === pago.cedula ? (
                      <button
                        onClick={() => { setEditando(null); setMetodoPago(''); }}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    ) : (
                      <button
                        onClick={() => { setEditando(pago.cedula); setMetodoPago(''); }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
                      >
                        Pendiente ▼
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel métodos de pago */}
                {!pago.estadoPago && editando === pago.cedula && (
                  <div className="mt-4 ml-11 space-y-3">
                    <p className="text-xs text-gray-400">Método de pago:</p>
                    <div className="flex gap-2 flex-wrap">
                      {METODOS.map((m) => {
                        const selected = metodoPago === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setMetodoPago(selected ? '' : m.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
                              selected
                                ? 'bg-[var(--cc)] border-[var(--cc)] text-white shadow-[0_4px_16px_var(--cc30)] scale-105'
                                : 'bg-[var(--bg-surface)] border-[var(--cc20)] text-gray-300 hover:bg-[var(--bg-card)] hover:border-gray-600'
                            }`}
                          >
                            <span>{m.emoji}</span>
                            <span>{m.label}</span>
                            {selected && <Check size={13} />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleRegistrarPago(pago.cedula)}
                        disabled={!metodoPago || guardando}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--cc)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        {guardando
                          ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                          : <><Check size={14} /> Confirmar pago</>
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
